# Deployment Plan — Bhilai Municipal Corporation Tax System

Stack: Laravel 11.9 (PHP 8.2) API backend + React 18/Vite SPA frontend + PostgreSQL (3 named connections: main, water, property) + Laravel Reverb (WebSockets, beta) + Sanctum (SPA/token auth) + NTT Data payment gateway integration.

Goals for this plan, in priority order: **(1) security, (2) smooth/zero-downtime operation, (3) horizontal scale behind a load balancer.**

---

## 1. Current-state assessment (what I found in this repo)

These are concrete, verified facts, not assumptions — each one shapes a decision below.

| Area | Current state | Risk |
|---|---|---|
| `APP_ENV` / `APP_DEBUG` | `local` / `true` | **Critical.** Debug mode on in prod leaks stack traces, `.env` values, and file paths to any user who triggers a 500. |
| File storage | `FILESYSTEM_DISK=local` | **Blocks load balancing outright.** Uploaded documents (SAF docs, Meter Declaration PDFs, geo-tag survey images) land on whichever server handled that request. Behind a load balancer with 2+ app servers, a later request routed to a different server will 404 on that file. |
| Session / cache / queue | All `database`-backed | Correct (shared via Postgres, so multi-server-safe) but slow under load — every session read/write and queue poll is a DB round trip, and it competes with the same Postgres instance serving the tax/payment queries. |
| Realtime | Reverb on port 8085, no sticky-session or dedicated node plan | WebSocket connections are long-lived and stateful — a plain round-robin LB will break reconnects. |
| CI/CD | None found | Every deploy today is manual — highest-risk part of "smooth running." |
| Containerization | None (no Dockerfile) | Fine to skip if you provision servers directly, but makes horizontal scaling and rollback slower and more error-prone. |
| DB read replicas | `pgsql_water` / `pgsql_property` connections already have a `read` host array in `config/database.php` | Good — the app is already structured to support read replicas, they're just not provisioned yet. |
| Payment integration | `app/Bll/Payment/NttData.php` — a live gateway integration | Needs webhook signature verification, IP allowlisting, and zero payment-data logging (see §3). |
| Frontend bundle | Fixed this session: was one 15MB chunk, now code-split (~1.9MB entry) | Good — reduces load on the LB/CDN and speeds up first paint under load. |

**Bottom line: do not put a second app server behind a load balancer until the storage-disk issue is fixed.** Everything else here can be phased in; that one is a hard prerequisite.

---

## 2. Target architecture

```
                              ┌─────────────────────┐
Users ── HTTPS ──▶ Cloudflare │  WAF + DDoS + CDN    │
                   (or equiv) │  (static asset cache) │
                              └──────────┬───────────┘
                                         │
                              ┌──────────▼───────────┐
                              │   Load Balancer        │
                              │ (managed LB / Nginx)   │
                              │ - TLS termination      │
                              │ - health checks /up     │
                              │ - sticky routing for    │
                              │   /app/reverb/* only    │
                              └──────┬─────────┬──────┘
                                     │         │
                        ┌────────────▼──┐  ┌───▼────────────┐
                        │ App Server 1  │  │ App Server 2   │   ← stateless, identical
                        │ Nginx+PHP-FPM │  │ Nginx+PHP-FPM  │      (add more as load grows)
                        │ + queue worker│  │ + queue worker │
                        └───────┬───────┘  └───────┬────────┘
                                │                   │
              ┌─────────────────┼───────────────────┼──────────────┐
              │                 │                   │              │
      ┌───────▼──────┐  ┌───────▼───────┐  ┌────────▼───────┐ ┌────▼─────┐
      │ Postgres      │  │ Redis          │  │ S3-compatible  │ │ Reverb   │
      │ primary +     │  │ (session/cache/│  │ object storage │ │ node(s)  │
      │ read replicas │  │  queue)        │  │ (uploads)      │ │ (WS)     │
      └───────────────┘  └────────────────┘  └────────────────┘ └──────────┘
```

Key decisions and why:

- **Load balancer**: use your host's managed LB (DigitalOcean LB, AWS ALB, etc.) if you're on a cloud provider — it removes one more thing you have to patch/secure yourself. If self-hosting, Nginx or HAProxy in front of the app servers works fine at this scale. Either way, terminate TLS at the LB and use `TrustProxies` in Laravel so the app sees the real client IP (needed for rate limiting and audit logs — see §3).
- **App servers are stateless**: no local session storage, no local file storage, no local queue state. This is what makes "add another server" a safe, boring operation instead of a risky one.
- **Reverb gets its own routing rule**: WebSocket upgrade requests (`/app/*` or whatever path you expose) need either sticky sessions at the LB or — cleaner — run Reverb as a single dedicated node (or a small pool with a pub/sub backplane) rather than round-robining it across the same pool as the HTTP app servers.
- **Redis replaces database session/cache/queue**: this is the single highest-impact change for "smooth running." It takes load off Postgres, makes queue processing faster and safer under concurrency, and is a prerequisite for Reverb to broadcast reliably across multiple app servers (Reverb needs a shared broadcasting backplane once you're not on a single box).

---

## 3. Security hardening (primary goal — do these regardless of when you add the load balancer)

**Application config**
- [ ] `APP_ENV=production`, `APP_DEBUG=false` before any real deployment. This alone is the single biggest fix available today.
- [ ] Move `.env` secrets (DB passwords, Reverb secret, NTT Data gateway keys, mail credentials) out of a committed-adjacent file and into your host's secret manager or at minimum a `.env` with `600` permissions owned by the deploy user only, never readable by the web server user directly.
- [ ] `SANCTUM_STATEFUL_DOMAINS` and `SESSION_DOMAIN` explicitly set to your real frontend domain(s) — currently `null`/unset, which is permissive. Lock this to exactly the domains that should be able to make credentialed requests.
- [ ] `config:cache`, `route:cache`, `event:cache` on every deploy (also a performance win — see §4).

**Network / edge**
- [ ] HTTPS only, HSTS with a long max-age once you've confirmed no mixed-content issues.
- [ ] WAF in front (Cloudflare's free/pro tier covers OWASP top 10 + basic DDoS; if self-hosted, ModSecurity on Nginx).
- [ ] Firewall rules: Postgres, Redis, and the internal app-server ports should not be reachable from the public internet at all — only from the LB and from each other on a private network/VPC. Only 80/443 (and the Reverb port if you don't proxy it) should be public.

**Auth & abuse prevention**
- [ ] Rate-limit `login`, `forgot-password`/OTP request, `otp-verify`, and `heartbeat` endpoints specifically (Laravel's `throttle` middleware). These are exactly the endpoints an attacker would hammer, and OTP endpoints are also the ones most likely to get expensive if someone scripts against them (SMS/email cost).
- [ ] Confirm password hashing is bcrypt/argon2 (Laravel default — just don't override it to something weaker).
- [ ] Audit login/logout and payment-record-creation events to an append-only log — this is a government revenue system; "who marked this payment as received and when" needs to be reconstructable months later.

**File uploads** (already partially hardened this session — MIME/size validation added for Meter Declaration docs)
- [ ] Apply the same `mimes:pdf,png,jpg,jpeg` + size-cap pattern to every other upload endpoint (SAF documents, geo-tag survey images, etc.) — check each one individually, they were likely built at different times with different validation.
- [ ] Serve uploaded documents through a signed/short-lived URL rather than a permanently-public path, especially for anything containing personal data (owner ID docs, address proof).

**Payment gateway (NTT Data)**
- [ ] Verify the webhook/callback signature on every incoming payment notification — never trust a payment-confirmed callback on URL/IP alone.
- [ ] Allowlist the gateway's published callback IP ranges at the firewall/LB level in addition to signature checks.
- [ ] Never log full card/UPI reference payloads — log the transaction ID and status only.

**Dependencies**
- [ ] Remove the two frontend hardening candidates flagged earlier this session (`pdfjs-dist`, `zustand`) if they're confirmed unused — smaller attack surface, smaller bundle. (I see `package.json` already had these removed as of the last git status check — good, just confirm nothing broke.)
- [ ] `composer audit` and `npm audit` as a required CI step, not a manual habit.

---

## 4. Smooth running: deploy pipeline, caching, zero downtime

**CI/CD** (none exists today — this is the biggest operational gap)
1. On push to `main`: run backend tests + `composer audit`, run frontend `npm run build` (catches the exact kind of syntax errors we verified manually this session) + `npm audit`.
2. On merge/tag: build artifacts, deploy to staging automatically, deploy to production on manual approval.
3. Deploy script per app server: `git pull` (or artifact deploy) → `composer install --no-dev --optimize-autoloader` → `php artisan migrate --force` (see note below) → `php artisan config:cache && route:cache && view:cache` → `php artisan queue:restart` → reload PHP-FPM (not restart — reload keeps existing requests draining).
4. **Migrations across multiple servers**: run migrations from exactly one place (a CI/CD step or a dedicated deploy box), never let each app server run `migrate` independently — Laravel does take a lock but it's needless risk. Take a DB backup immediately before every migration that touches an existing table with production data (property/water/trade records).

**Zero-downtime rollout**
- Rolling deploy: take one app server out of the LB pool → deploy → health-check it → add it back → repeat for the next server. With 2 servers this gives you zero visible downtime for a deploy that doesn't need new migrations to be backward-incompatible with old code (design migrations to be additive/backward-compatible for the duration of a rollout — add columns nullable first, backfill, then tighten in a later deploy).
- LB health check should hit a real `/up` (Laravel 11 ships this) or a custom health endpoint that actually touches the DB connection, not just "process is running."

**Performance / "don't fall over under load"**
- OPcache enabled and preloaded in production PHP-FPM config — this is often missed and is a large win for Laravel specifically.
- Move session/cache/queue to Redis (§2) — removes Postgres as the bottleneck for anything that isn't an actual tax/payment record query.
- `queue:work` under Supervisor (or systemd) with `--tries` and a dead-letter/failed-jobs table review process, not a bare `php artisan queue:work` in a terminal that dies when someone logs out.
- Read replicas: point read-heavy report/list endpoints (the DCB reports, collection reports, dashboards) at the `read` host array already defined for `pgsql_water`/`pgsql_property` — this is configuration you already have, just needs a replica provisioned and the host filled in.

---

## 5. Monitoring, backup, disaster recovery

- **Uptime/health**: external check (UptimeRobot / a cloud monitor) hitting the LB's public URL, plus internal checks on each app server's `/up` so you know *which* server is unhealthy, not just that the site is down.
- **Logs**: ship Laravel logs + Nginx access/error logs off-box (even just to a managed log service) — logs sitting only on a server that just went down are logs you can't read when you need them most.
- **DB backups**: automated daily Postgres dumps + WAL-based point-in-time recovery if your host supports it. Test the restore process at least once before you need it for real — an untested backup is a hope, not a plan.
- **Object storage**: enable versioning on the S3-compatible bucket so an accidental overwrite/delete of a citizen's uploaded document is recoverable.
- **Alerting on the things that matter for this app specifically**: failed payment-webhook signature checks, queue backlog length (a growing backlog usually means something's silently failing), Postgres connection count approaching max.

---

## 6. Phased rollout (recommended order)

1. **Fix blockers first, on the current single server** — no load balancer needed yet:
   - `APP_ENV=production`, `APP_DEBUG=false`, lock `SANCTUM_STATEFUL_DOMAINS`.
   - Move file storage to S3-compatible object storage.
   - Stand up Redis, move session/cache/queue to it.
   - Add the login/OTP/heartbeat rate limits.
2. **Add CI/CD** running builds + audits on every push, deploying to a staging box that mirrors prod config.
3. **Provision a second app server + the load balancer**, pointed at the now-shared Postgres/Redis/object-storage. Test a rolling deploy on staging before doing it on production.
4. **Provision the Postgres read replica(s)** and route report/dashboard queries to them.
5. **Move Reverb to its own node** with sticky routing or a Redis-backed broadcast driver so it works correctly once there's more than one app server.
6. **Load test** (even a simple k6/Artillery script simulating peak tax-season traffic) before a public announcement of new capacity, to confirm the LB + 2 servers actually holds up.

## 7. Rollback plan

- Keep the previous release's build artifact and `vendor/`/`node_modules` cached, not deleted, so a rollback is "point the LB/deploy script at the last known-good artifact," not "rebuild from scratch under pressure."
- Any migration in a release should have a written-down reverse (`down()` method or a manual revert script) *before* that release goes out, not improvised after something breaks.
- Database backup immediately before every production migration (§4) — if a migration is the problem, restore-and-reapply-without-it beats trying to hand-write a fix live.

---

### What's genuinely optional at this scale

A municipal system for one city doesn't need Kubernetes, a service mesh, or multi-region failover — that's over-engineering for the traffic this app will actually see. The plan above (LB + 2–3 stateless app servers + managed Postgres with a replica + Redis + object storage) is the right amount of infrastructure for "smooth and secure," not the maximum amount possible.
