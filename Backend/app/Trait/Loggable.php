<?php

namespace App\Trait;

use App\Observers\LogObserver;

trait Loggable
{
    public static function bootLoggable()
    {
        static::observe(LogObserver::class);
    }
}
