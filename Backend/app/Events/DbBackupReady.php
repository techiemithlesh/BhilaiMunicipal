<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DbBackupReady implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public $userId;
    public $status;
    public $message;
    public $file_name;
    public $download_url;
    public $token;

    public function __construct($userId, $token ,$status, $message, $fileName = '', $downloadUrl = '')
    {
        $this->userId = $userId;
        $this->token = $token;
        $this->status = $status;
        $this->message = $message;
        $this->file_name = $fileName;
        $this->download_url = $downloadUrl;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */

    public function broadcastOn()
    {
        return new PrivateChannel('user.' . $this->userId);
    }

    public function broadcastAs()
    {
        return 'DbBackupReady';
    }
}
