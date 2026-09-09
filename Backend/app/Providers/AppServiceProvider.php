<?php

namespace App\Providers;

use App\Models\Property\ActiveSafDetail;
use App\Models\Property\MemoDetail;
use App\Models\Property\PropertyNotice;
use App\Models\Property\PropTransaction;
use App\Models\Property\SwmActiveConsumer;
use App\Models\Property\SwmConsumerTransaction;
use App\Models\Trade\ActiveTradeLicense;
use App\Models\Trade\TradeTransaction;
use App\Models\User;
use App\Models\Water\WaterActiveApplication;
use App\Models\Water\WaterTransaction;
use App\Observers\Property\ActiveSafDetailObserver;
use App\Observers\Property\MemoDetailObserver;
use App\Observers\Property\PropertyNoticeObserver;
use App\Observers\Property\PropTransactionObserver;
use App\Observers\Property\SwmActiveConsumerObserver;
use App\Observers\Property\SwmConsumerTransactionObserver;
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
        SwmActiveConsumer::observe(SwmActiveConsumerObserver::class);
        SwmConsumerTransaction::observe(SwmConsumerTransactionObserver::class);
        //trade
        ActiveTradeLicense::observe(ActiveTradeLicenseObserver::class);
        TradeTransaction::observe(TradeTransactionObserver::class);
        // Water 
        WaterActiveApplication::observe(WaterActiveApplicationObserver::class);
        WaterTransaction::observe(WaterTransactionObserver::class);

        app()->singleton('requestToken', function () {
            return 'REQ_' . now()->format('YmdHisv') . '_' . bin2hex(random_bytes(5));
        });
    }
}
