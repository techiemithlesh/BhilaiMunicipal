<?php

namespace App\Models\DBSystem;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class UserWardPermission extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "ward_mstr_id",
        "user_id",
        "created_by_user_id",
        "lock_status",
    ];

    public function store(Request $request){
        $inputs = snakeCase($request);
        $user= self::create($inputs->all());
        return $user->id;
    }

    public function edit(Request $request){
        $inputs = collect(snakeCase($request))->filter(function($val,$key){
            return in_array($key,$this->fillable) ;
        });
        $model = self::find($request->id);
        $returnData= $model->update($inputs->all());
        return $returnData;
    }
}
