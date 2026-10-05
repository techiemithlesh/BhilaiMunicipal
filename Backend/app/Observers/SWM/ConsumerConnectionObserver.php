<?php

namespace App\Observers\SWM;

use App\Models\SWM\Consumer;
use App\Models\SWM\ConsumerConnection;

class ConsumerConnectionObserver
{
    /**
     * Handle the ConsumerConnection "created" event.
     */
    public function created(ConsumerConnection $consumerConnection): void
    {
        $consumerId = $consumerConnection->consumer_id;
        $consumer = Consumer::find($consumerId);
        $consumer->current_connection_id = $consumerConnection->id;
        $consumer->save();
    }

    /**
     * Handle the ConsumerConnection "updated" event.
     */
    public function updated(ConsumerConnection $consumerConnection): void
    {
        //
    }

    /**
     * Handle the ConsumerConnection "deleted" event.
     */
    public function deleted(ConsumerConnection $consumerConnection): void
    {
        //
    }

    /**
     * Handle the ConsumerConnection "restored" event.
     */
    public function restored(ConsumerConnection $consumerConnection): void
    {
        //
    }

    /**
     * Handle the ConsumerConnection "force deleted" event.
     */
    public function forceDeleted(ConsumerConnection $consumerConnection): void
    {
        //
    }
}
