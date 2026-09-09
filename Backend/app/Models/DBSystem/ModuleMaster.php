<?php

namespace App\Models\DBSystem;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ModuleMaster extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "module_name",
        "lock_status",
    ];

    /**
     * | Save the Otp for Checking Validatin
     * | @param 
     */
    public function store(Request $request){
        $inputs = snakeCase($request);
        $user= self::create($inputs->all());
        return $user->id;
    }

    public function edit($request){
        $inputs= snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $returnData= $model->update($inputs->all());
        return $returnData;
    }
}
