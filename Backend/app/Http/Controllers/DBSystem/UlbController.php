<?php

namespace App\Http\Controllers\DBSystem;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Models\DBSystem\UlbMaster;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;

class UlbController extends Controller
{
    /**
     *       created by: Sandeep Bara
     *       Date       : 2025-06-26
             status     : open
            📖         : read data (read connection use)
            ✍️          : write data (write connection use)
     */

    public $_currentDateTime;
    public $_redis;
    private $_modelUlbMaster;
    public function __construct()
    {
        $this->_currentDateTime = Carbon::now();
        $this->_modelUlbMaster = new UlbMaster();
    }


    /**=============📖get All user List📖================
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {

        try{
            $data = $this->_modelUlbMaster;
            if($request->key){
                $data = $data->where(function($where) use($request){
                    $where->orWhere("ulb_name","ILIKE","%".$request->key."%")
                    ->orWhere("short_name","ILIKE","%".$request->key."%")
                    ->orWhere("state","ILIKE","%".$request->key."%")
                    ->orWhere("hindi_ulb_name","ILIKE","%".$request->key."%");
                });
            }
            if($request->all){
                $data = $data->get();
                return responseMsg(true,"All User List",camelCase(remove_null($data)));
            }
            $data = paginator($data,$request);
            $data["data"]= collect($data["data"])->map(function($val){
                $val->logo_img = $val->logo_img ? url("/".$val->logo_img) : null;
                $val->water_mark_img = $val->water_mark_img ? url("/".$val->water_mark_img) : null;
                return $val;
            });
            return responseMsg(true,"User Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }

    }

    /**=============📖 get the user by id 📖================
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try{
            $data = $this->_modelUlbMaster->find($id);
            if(!$data){
                throw new CustomException("Invalid Id");
            }
            $data->logo_img = $data->logo_img ? url("/".$data->logo_img) : null;
            $data->water_mark_img = $data->water_mark_img ? url("/".$data->water_mark_img) : null;            
            return responseMsg(true,"Use Details",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }

    }
}
