<?php

namespace App\Jobs\Middleware;

use Closure;
use Illuminate\Support\Facades\Log;

class DeferIfServerBusy
{
    protected float $maxCpuThreshold;
    protected int $delaySeconds;

    /**
     * @param float $maxCpuThreshold Maximum CPU usage % allowed (Default: 70%)
     * @param int $delaySeconds Time in seconds to wait before retrying (Default: 180s)
     */
    public function __construct(float $maxCpuThreshold = 70.0, int $delaySeconds = 180)
    {
        $this->maxCpuThreshold = $maxCpuThreshold;
        $this->delaySeconds = $delaySeconds;
    }

    /**
     * Handle the job execution.
     */
    public function handle(object $job, Closure $next): void
    {
        $cpuUsage = $this->getCpuUsagePercentage();
        
        // Access resolveName() from the underlying Queue Driver Job ($job->job)
        if (property_exists($job, 'job') && $job->job !== null && method_exists($job->job, 'resolveName')) {
            $jobName = $job->job->resolveName();
        } else {
            $jobName = get_class($job);
        }
        Log::info("CPU Throttling Check - Current CPU: {$cpuUsage}%, Threshold: {$this->maxCpuThreshold}%");

        if ($cpuUsage > $this->maxCpuThreshold) {
            // Requeue job with a delay if CPU is over capacity
            Log::warning("Job Throttled [{$jobName}]: Server CPU at {$cpuUsage}%, exceeds limit of {$this->maxCpuThreshold}%. Delaying for {$this->delaySeconds}s.");
            $job->release($this->delaySeconds);
            return;
        }
        Log::info("Job Running [{$jobName}]: Server CPU at {$cpuUsage}% (Limit: {$this->maxCpuThreshold}%).");
        $next($job);
    }

    /**
     * Get CPU usage percentage across Windows & Linux.
     */
    protected function getCpuUsagePercentage(): float
    {
        // 1. Windows Server Implementation
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $cmd = 'powershell -NoProfile -Command "Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average | Select-Object -ExpandProperty Average"';
            $output = @shell_exec($cmd);

            if ($output !== null && is_numeric(trim($output))) {
                return (float) trim($output);
            }

            return 0.0;
        }

        // 2. Linux/Unix Server Implementation
        if (function_exists('sys_getloadavg')) {
            $load = sys_getloadavg();
            $cores = (int) @shell_exec('nproc') ?: 1;

            if ($load !== false && isset($load[0])) {
                return ($load[0] / $cores) * 100;
            }
        }

        return 0.0;
    }
}