<?php

namespace App\Models\DBSystem;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WebRoleMenuMap extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "role_id",
        "menu_id",
        "icon",
        "description",
        "read",	
        "write",
        "delete",
        "update",
        "lock_status",
    ];

    public function store($request){
        $test = self::where("menu_id",$request->menuId)->where("role_id",$request->roleId)->first();
        if($test){
            $newRequest = new Request(["id"=>$test->id,"lockStatus"=>false]);
            $newRequest->merge($request->all());
            $this->edit($newRequest);
            return $test->id;
        }
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function edit($request){
        $inputs = snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $return= $model->update($inputs->all());
        return $return;
    }
}
