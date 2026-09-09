<?php

namespace App\Models\DBSystem;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Redis;

class RoleTypeMstr extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "role_name",
        "user_for",
        "lock_status",
    ];

    private $_cashKey = "ROLE_LIST";

    private function cashingData(){
        $roleList = self::where("lock_status",false)->get();
        Redis::set($this->_cashKey,$roleList);  
        return json_encode($roleList);
    }

    public function getRoleList(){
        $roleList  = json_decode(Redis::get($this->_cashKey));
        if(!$roleList){
            $roleList = json_decode($this->cashingData());            
        }
        return collect($roleList);
    }    

    public function store($request){
        $inputs = snakeCase($request);
        $role= self::create($inputs->all());
        $this->cashingData();
        return $role->id;
    }

    public function edit($request){
        $inputs= snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $returnData= $model->update($inputs->all());
        $this->cashingData();
        return $returnData;
    }

    public function getWedMenu(){
        return $this->hasManyThrough(WebMenuMaster::class,WebRoleMenuMap::class,"role_id","id","id","menu_id")->select((new WebRoleMenuMap())->getTable().".*",(new WebMenuMaster())->getTable().".*");
    }
    public function getMobileMenu(){
        return $this->hasManyThrough(MobileMenuMaster::class,MobileRoleMenuMap::class,"role_id","id","id","menu_id")->select((new MobileRoleMenuMap())->getTable().".*",(new MobileMenuMaster())->getTable().".*");
    }

    public function getRolePermission(){
        return $this->hasMany(UlbRolePermission::class,"role_id","id")->where("lock_status",false);
    }

    public function getUsers(){
        return $this->hasManyThrough(User::class,UserRoleMap::class,"role_id","id","id","user_id");
    }
}
