<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Models\DBSystem\MobileMenuMaster;
use App\Models\DBSystem\MobileUserMenuExclude;
use App\Models\DBSystem\MobileUserMenuInclude;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\DBSystem\UserRoleMap;
use App\Models\DBSystem\UserWardPermission;
use App\Models\DBSystem\WebMenuMaster;
use App\Models\DBSystem\WebUserMenuExclude;
use App\Models\DBSystem\WebUserMenuInclude;
use App\Trait\Loggable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens,  HasFactory, Notifiable,Loggable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        "ulb_id",
        "can_switch_multi_ulb",
        "user_name",
        "user_for",
        "first_name",
        "middle_name",
        "last_name",
        "guardian_name",
        "phone_no",
        "designation",
        "user_img",
        "unique_ref_no",
        "signature_img",
        "signature_unique_ref_no",
        "report_to",
        "lock_status",
        'name',
        'email',
        'password',
        "max_login_allow",
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function store(Request $request){
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
        return $this->hasManyThrough(RoleTypeMstr::class,UserRoleMap::class,"user_id","id","id","role_id")->where((new UserRoleMap())->getTable().".lock_status",false);
    }

    public function getUserWards(){
        return $this->hasManyThrough(UlbWardMaster::class,UserWardPermission::class,"user_id","id","id","ward_mstr_id")->where((new UserWardPermission())->getTable().".lock_status",false);
    }

    public function getIncludeMenu(){
        return $this->hasManyThrough(WebMenuMaster::class,WebUserMenuInclude::class,"user_id","id","id","menu_id");
    }    

    public function getExcludeMenu(){
        return $this->hasManyThrough(WebMenuMaster::class,WebUserMenuExclude::class,"user_id","id","id","menu_id");
    }

    public function getMobileIncludeMenu(){
        return $this->hasManyThrough(MobileMenuMaster::class,MobileUserMenuInclude::class,"user_id","id","id","menu_id");
    }    

    public function getMobileExcludeMenu(){
        return $this->hasManyThrough(MobileMenuMaster::class,MobileUserMenuExclude::class,"user_id","id","id","menu_id");
    }
}
