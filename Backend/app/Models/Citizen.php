<?php

namespace App\Models;

use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UserRoleMap;
use App\Trait\Loggable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Citizen extends Model
{
    use HasFactory,HasApiTokens,  Notifiable,Loggable;

    protected $fillable = [
        "ulb_id",
        "name",
        "first_name",
        "middle_name",
        "last_name",
        "guardian_name",
        "phone_no",
        "email",
        "user_img",
        "unique_ref_no",
        "lock_status",
        'password',
        "google_id",
        "github_id",
        "facebook_id",
    ];

    protected $hidden = [
        'password',
        'remember_token',
        "google_id",
        "github_id",
        "facebook_id",
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function store(Request $request){
        $names = explode(" ",$request->name);
        if(!($names[2]??null)){
            $names[2] = $names[1]??null;
            $names[1]=null;
        }
        $request->merge(["firstName"=>$names[0]??null,"middleName"=>$names[1]??null,"lastName"=>$names[2]??null]);
        $request->merge(["name"=> trim($request->firstName." ". trim($request->middleName." ". $request->lastName))]);
        $inputs = snakeCase($request);
        $user= self::create($inputs->all());
        return $user->id;
    }

    public function edit(Request $request){
        $request->merge(["name"=> trim($request->firstName." ". trim($request->middleName." ". $request->lastName))]);
        $inputs = collect(snakeCase($request))->filter(function($val,$key){
            return in_array($key,$this->fillable) ;
        });
        $model = self::find($request->id);
        $return= $model->update($inputs->all());
        return $return;
    }

    public function getRoleDetailsByUserId(){
        return $this->hasManyThrough(RoleTypeMstr::class,UserRoleMap::class,"user_id","id","id","role_id")->whereNull((new UserRoleMap())->getTable().".id");
    }
}
