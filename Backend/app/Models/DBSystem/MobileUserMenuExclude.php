<?php

namespace App\Models\DBSystem;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Redis;

class MobileUserMenuExclude extends WebUserMenuExclude
{
    use HasFactory;
    private $_cashKey = "MOBI_USER_MENU_EXCLUDE_MAPS";

    private function cashingData(){
        $list = self::where("lock_status",false)->get();
        Redis::set($this->_cashKey,$list);         
        Redis::expire($this->_cashKey, 18000); 
        return json_encode($list);
    }
}
