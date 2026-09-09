<?php

namespace App\Models\DBSystem;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class MobileMenuMaster extends WebMenuMaster
{
    use HasFactory;

    private $_cashKey = "MOBI_MENU";

    private function cashingData(){
        $list = self::where("lock_status",false)->get();
        Redis::set($this->_cashKey,$list);
        Redis::expire($this->_cashKey, 18000);  
        return json_encode($list);
    }

    public function getRoleMenu(){
        return $this->hasManyThrough(RoleTypeMstr::class,MobileRoleMenuMap::class,"menu_id","id","id","role_id");
    }

    public function getRoleMenuWithPermission(){
        return $this->hasManyThrough(RoleTypeMstr::class,MobileRoleMenuMap::class,"menu_id","id","id","role_id")->select((new MobileRoleMenuMap())->getTable().".*",(new RoleTypeMstr())->getTable().".*");
    }

}
