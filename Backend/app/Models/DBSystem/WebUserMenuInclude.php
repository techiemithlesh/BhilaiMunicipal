<?php

namespace App\Models\DBSystem;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Redis;

class WebUserMenuInclude extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "user_id",
        "menu_id",
        "description",
        "read",
        "write",
        "delete",
        "update",
        "lock_status",
    ];

    private $_cashKey = "WEB_USER_MENU_MAPS";

    private function cashingData(){
        $list = self::where("lock_status",false)->get();
        Redis::set($this->_cashKey,$list);         
        Redis::expire($this->_cashKey, 18000); 
        return json_encode($list);
    }

    public function store($request){
        $test = self::where("user_id",$request->userId)->where("menu_id",$request->menuId)->first();
        if($test){
            $request->merge(['id'=>$test->id,"lockStatus"=>false]);
            $this->edit($request);
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

    public function getListByUserId(int $userId){
        $wardList  = json_decode(Redis::get($this->_cashKey));
        if(!$wardList){
            $wardList = json_decode($this->cashingData());            
        }
        return collect($wardList)->where("user_id",$userId);
    }
}
