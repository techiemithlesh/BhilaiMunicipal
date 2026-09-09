<?php

namespace App\Http\Controllers\Property;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Models\Property\ActiveSafDetail;
use App\Models\Property\PropertyDetail;
use App\Models\Property\RejectedSafDetail;
use App\Models\Property\SafDetail;
use App\Trait\Property\PropertyTrait;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CitizenPropertyController extends Controller
{
    use PropertyTrait;
    /**
     *       created by: Sandeep Bara
     *       Date       : 2025-07-28
             status     : open
            📖         : read data (read connection use)
            ✍️          : write data (write connection use)
     */

    protected $_ActiveSafDetail;
    protected $_SafDetail;
    protected $_RejectedSafDetail;
    protected $_PropertyDetail;

    public function __construct()
    {

        $this->_ActiveSafDetail = new ActiveSafDetail();
        $this->_SafDetail = new SafDetail();
        $this->_RejectedSafDetail = new RejectedSafDetail();
        $this->_PropertyDetail = new PropertyDetail();

    }

    public function searchHoldingWithMobile(Request $request){
        try{
            $rules = [
                "holdingNo"=>"required|string",
                "mobileNo"=>"required|digits:4",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $data = $this->_PropertyDetail->select("property_details.*",DB::raw("property_owner_details.owner_name,property_owner_details.mobile_no"))
               ->join("property_owner_details",function($join){
                    $join->On("property_owner_details.property_detail_id","property_details.id")
                    ->where("property_owner_details.lock_status",false);
               })
               ->orderBy('property_details.id', 'DESC')
               ->where("property_details.new_holding_no",$request->holdingNo)
               ->where("property_owner_details.mobile_no","like","%".$request->mobileNo)
               ->first();

            if(!$data){
                throw new CustomException("Data Not Found");
            }
            return responseMsg(true,"Data Fetched",remove_null(camelCase($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }

    public function searchSafWithMobile(Request $request){
        try{
            $rules = [
                "safNo"=>"required|string",
                "mobileNo"=>"required|digits:4",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $data = $this->_ActiveSafDetail->select("active_saf_details.*",DB::raw("active_saf_owner_details.owner_name,active_saf_owner_details.mobile_no"))
               ->join("active_saf_owner_details",function($join){
                    $join->On("active_saf_owner_details.saf_detail_id","active_saf_details.id")
                    ->where("active_saf_owner_details.lock_status",false);
               })
               ->orderBy('active_saf_details.id', 'DESC')
               ->where("active_saf_details.saf_no",$request->safNo)
               ->where("active_saf_owner_details.mobile_no","like","%".$request->mobileNo)
               ->first();
            if(!$data){
               $data = $this->_SafDetail->select("saf_details.*",DB::raw("saf_owner_details.owner_name,saf_owner_details.mobile_no"))
               ->join("saf_owner_details",function($join){
                    $join->On("saf_owner_details.saf_detail_id","saf_details.id")
                    ->where("saf_owner_details.lock_status",false);
               })
               ->orderBy('saf_details.id', 'DESC')
               ->where("saf_details.saf_no",$request->safNo)
               ->where("saf_owner_details.mobile_no","like","%".$request->mobileNo)
               ->first(); 
            }
            if(!$data){
               $data = $this->_RejectedSafDetail->select("rejected_saf_details.*",DB::raw("rejected_saf_owner_details.owner_name,rejected_saf_owner_details.mobile_no"))
               ->join("rejected_saf_owner_details",function($join){
                    $join->On("rejected_saf_owner_details.saf_detail_id","rejected_saf_details.id")
                    ->where("rejected_saf_owner_details.lock_status",false);
               })
               ->orderBy('rejected_saf_details.id', 'DESC')
               ->where("rejected_saf_details.saf_no",$request->safNo)
               ->where("rejected_saf_owner_details.mobile_no","like","%".$request->mobileNo)
               ->first(); 
            }

            if(!$data){
                throw new CustomException("Data Not Found");
            }
            return responseMsg(true,"Data Fetched",remove_null(camelCase($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }
}
