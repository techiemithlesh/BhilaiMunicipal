<?php

namespace App\Models\DBSystem;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class WebMenuMaster extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "menu_name",
        "parent_id",
        "menu_type",
        "url",
        "query_string",
        "serial_no",
        "icon",
        "description",
        "lock_status",
    ];

    private $_cashKey = "WEB_MENU";

    private function cashingData(){
        $list = self::where("lock_status",false)->get();
        Redis::set($this->_cashKey,$list);
        Redis::expire($this->_cashKey, 18000);  
        return json_encode($list);
    }

    public function store($request){
        $test = self::where(DB::raw("upper(url)"),Str::upper($request->url))
                ->where(DB::raw("menu_name"),($request->menuName))
                ->where(DB::raw("query_string"),($request->queryString))
                ->where("parent_id",$request->parentId)
                ->where("menu_type",$request->menuType)
                ->where("url",$request->url)
                ->first();
        if($test){
            $newRequest = new Request(["id"=>$test->id,"lockStatus"=>false]);
            $this->edit($newRequest);
            return $test->id;
        }
        $inputs = snakeCase($request);
        $id= self::create($inputs->all())->id;
        $this->cashingData();
        return $id;
    }

    public function edit($request){
        $inputs = snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $return= $model->update($inputs->all());
        $this->cashingData();
        return $return;
    }

    public function getMenuList(){
        return json_decode($this->cashingData());
    }

    public function getRoleMenu(){
        return $this->hasManyThrough(RoleTypeMstr::class,WebRoleMenuMap::class,"menu_id","id","id","role_id");
    }

    public function getRoleMenuWithPermission(){
        return $this->hasManyThrough(RoleTypeMstr::class,WebRoleMenuMap::class,"menu_id","id","id","role_id")->select((new WebRoleMenuMap())->getTable().".*",(new RoleTypeMstr())->getTable().".*");
    }

    public function subMenuOrm(){
        return self::where("menu_type",1)->where("lock_status",false);
    }
}
