<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ExcelExportReady implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $status;
    public $message;
    public $file_name;
    public $download_url;

    public function __construct($userId, $status, $message, $fileName = '', $downloadUrl = '')
    {
        $this->userId = $userId;
        $this->status = $status;
        $this->message = $message;
        $this->file_name = $fileName;
        $this->download_url = $downloadUrl;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('user.' . $this->userId);
    }

    public function broadcastAs()
    {
        return 'ExcelExportReady';
    }
}