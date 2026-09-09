<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        //
        if(!$user->employee_code){
            $user->id;
            $employee_code = "EMP-".str_pad($user->id,7,"0",STR_PAD_LEFT);
            while($count = User::where("employee_code",$employee_code)->count()){
                $str = explode("EMP-",$employee_code);
                $digit = $count."C".str_pad(((int)$str[1]),7-(strlen((string)$count)+1),"0",STR_PAD_LEFT);
                $employee_code = "EMP-".$digit;
            }
            $user->employee_code = $employee_code;
        }
        if(!$user->user_name){
            $user_name = str_replace(" ","",$user->name).".".$user->id;
            while($count = User::where("user_name",$user_name)->count()){
                $user_name .= $count;
            }
            $user->user_name = $user_name;
        }
        if(!$user->password){
            $password = Hash::make(str_pad(str_split(Str::upper($user->name),4)[0],4," ")."@".str_pad(str_split(strrev($user->name),4)[0],4,"0"));
            $user->password = $password;
        }
        $user->save();
    }

    public function updating(User $user): void
    {
        
        $changes = $user->getDirty();
        if(in_array("",$changes)){

        }
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
       
        //
        $changes = $user->getDirty(); 
        if($user->lock_status){

        }
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        //
    }

    /**
     * Handle the User "restored" event.
     */
    public function restored(User $user): void
    {
        //
    }

    /**
     * Handle the User "force deleted" event.
     */
    public function forceDeleted(User $user): void
    {
        //
    }
}
