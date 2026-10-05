<?php

namespace App\Providers;

use App\Models\Property\ActiveSafDetail;
use App\Models\Property\MemoDetail;
use App\Models\Property\PropertyNotice;
use App\Models\Property\PropTransaction;
use App\Models\SWM\Consumer;
use App\Models\SWM\ConsumerConnection;
use App\Models\SWM\ConsumerTransaction;
use App\Models\Trade\ActiveTradeLicense;
use App\Models\Trade\TradeTransaction;
use App\Models\User;
use App\Models\Water\WaterActiveApplication;
use App\Models\Water\WaterTransaction;
use App\Observers\Property\ActiveSafDetailObserver;
use App\Observers\Property\MemoDetailObserver;
use App\Observers\Property\PropertyNoticeObserver;
use App\Observers\Property\PropTransactionObserver;
use App\Observers\SWM\ConsumerConnectionObserver;
use App\Observers\SWM\ConsumerObserver;
use App\Observers\SWM\ConsumerTransactionObserver;
use App\Observers\Trade\ActiveTradeLicenseObserver;
use App\Observers\Trade\TradeTransactionObserver;
use App\Observers\UserObserver;
use App\Observers\Water\WaterActiveApplicationObserver;
use App\Observers\Water\WaterTransactionObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //system
        User::observe(UserObserver::class);
        //property
        ActiveSafDetail::observe(ActiveSafDetailObserver::class);
        MemoDetail::observe(MemoDetailObserver::class);
        PropTransaction::observe(PropTransactionObserver::class);
        PropertyNotice::observe(PropertyNoticeObserver::class); 
        //trade
        ActiveTradeLicense::observe(ActiveTradeLicenseObserver::class);
        TradeTransaction::observe(TradeTransactionObserver::class);
        // Water 
        WaterActiveApplication::observe(WaterActiveApplicationObserver::class);
        WaterTransaction::observe(WaterTransactionObserver::class);
        //SWM
        Consumer::observe(ConsumerObserver::class);
        ConsumerConnection::observe(ConsumerConnectionObserver::class);
        ConsumerTransaction::observe(ConsumerTransactionObserver::class);

        app()->singleton('requestToken', function () {
            return 'REQ_' . now()->format('YmdHisv') . '_' . bin2hex(random_bytes(5));
        });
    }
}
