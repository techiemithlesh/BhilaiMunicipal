<?php

namespace App\Http\Controllers\SWM;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Models\SWM\CategoryTypeMaster;
use App\Models\SWM\ParamModel;
use App\Models\SWM\RateMaster;
use App\Models\SWM\SubCategoryTypeMaster;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class MasterController extends Controller
{
    //

    private $_Conn;
    private $_CategoryTypeMaster;
    private $_SubCategoryTypeMaster;
    private $_RateMaster;

    function __construct()
    {   
        $this->_Conn = (new ParamModel())->resolveDynamicConnection();
        $this->_CategoryTypeMaster = new CategoryTypeMaster(); 
        $this->_SubCategoryTypeMaster = new SubCategoryTypeMaster();  
        $this->_RateMaster = new RateMaster();
    }

    private function begin(){
        DB::connection($this->_Conn)->beginTransaction();
    }
    private function rollBack(){
        DB::connection($this->_Conn)->rollBack();
    }
    private function commit(){
        DB::connection($this->_Conn)->commit();
    }

    public function addCategory(Request $request){
        try{
            $rules = [
                "categoryType"=>"required|unique:".$this->_CategoryTypeMaster->getConnectionName().".".$this->_CategoryTypeMaster->getTable().",category_type",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $id = $this->_CategoryTypeMaster->store($request);
            return responseMsg(true,"New Category Add","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function editCategory(Request $request){
        try{
            $rules = [
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_CategoryTypeMaster->getConnectionName().".".$this->_CategoryTypeMaster->getTable().",id",
                "categoryType"=>"required|unique:".$this->_CategoryTypeMaster->getConnectionName().".".$this->_CategoryTypeMaster->getTable().",category_type".($request->id?(",".$request->id.",id"):""),
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $id = $this->_CategoryTypeMaster->edit($request);
            return responseMsg(true,"Category Update","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function lockUnlockCategory(Request $request){
        try{
            $rules = [
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_CategoryTypeMaster->getConnectionName().".".$this->_CategoryTypeMaster->getTable().",id",
                "lockStatus"=>"required|bool"
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $id = $this->_CategoryTypeMaster->edit($request);
            return responseMsg(true,"Category Update","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){dd($e);
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function getCategoryList(Request $request){
        try{
            $data= $this->_CategoryTypeMaster
                ->orderBy("id","ASC");
            if($request->all){
                $data = $data->where("lock_status",false)->get();
                return responseMsg(true,"All User List",camelCase(remove_null($data)));
            }
            if($request->has("offset") && $request->has("limit")){
                $data = $data->where("lock_status",false)->offset($request->offset)->limit($request->limit)->get();
                return responseMsg(true,"All User List",camelCase(remove_null($data)));
            }
            $data = paginator($data,$request);            
            return responseMsg(true,"User Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function categoryDtl(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_CategoryTypeMaster->getConnectionName().".".$this->_CategoryTypeMaster->getTable().",id",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $data = $this->_CategoryTypeMaster->find($request->id);            
            return responseMsg(true,"Category Type Details",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }


    public function addSubCategory(Request $request){
        try{
            $rules = [
                "categoryTypeMasterId"=>"required|exists:".$this->_CategoryTypeMaster->getConnectionName().".".$this->_CategoryTypeMaster->getTable().",id",
                "subCategoryType"=>"required",
                "rates"=>"required|array",
                "rates.*.ratePerMonth"=>"required|numeric|min:0",                
                "rates.*.restaurantRatePerMonth"=>"required|numeric|min:0",
                "rates.*.gardenRatePerMonth"=>"required|numeric|min:0",
                "rates.*.banquetHallRatePerMonth"=>"required|numeric|min:0",
                "rates.*.effectiveFrom"=>"required|date",
                "rates.*.effectiveUpto"=>"nullable|date"
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $this->begin();
            $id = $this->_SubCategoryTypeMaster->store($request);
            foreach(collect($request->rates)->sortBy("effectiveFrom") as $rate){
                $rateRequest = new Request($rate);
                $rateRequest->merge(["sub_category_type_master_id"=>$id]);
                $this->_RateMaster->store($rateRequest);
            }
            $this->commit();
            return responseMsg(true,"New Sub Category Add","");
        }catch(CustomException $e){
            $this->rollback();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollback();
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function editSubCategory(Request $request){
        try{
            $rules = [
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_SubCategoryTypeMaster->getConnectionName().".".$this->_SubCategoryTypeMaster->getTable().",id",
                "categoryTypeMasterId"=>"required|exists:".$this->_CategoryTypeMaster->getConnectionName().".".$this->_CategoryTypeMaster->getTable().",id",
                "subCategoryType"=>"required",
                "rates"=>"required|array",
                "rates.*.id"=>[
                    "required",
                    function($attribute, $value, $fail)use($request){
                        if($value && !$this->_RateMaster->where("sub_category_type_master_id",$request->id)->where("id",$value)->count()){
                             $fail('The ' . $attribute . ' is invalid.');
                        }

                    }
                ],
                "rates.*.ratePerMonth"=>"required|numeric|min:0",
                "rates.*.restaurantRatePerMonth"=>"required|numeric|min:0",
                "rates.*.gardenRatePerMonth"=>"required|numeric|min:0",
                "rates.*.banquetHallRatePerMonth"=>"required|numeric|min:0",
                "rates.*.effectiveFrom"=>"required|date",
                "rates.*.effectiveUpto"=>[
                    "nullable",
                    "date",
                    "date_format:Y-m-d",
                    function ($attribute, $value, $fail) use($request){
                        $key = explode(".",$attribute)[1];
                        if(($request->rate[$key]["effectiveFrom"]??false) && $value < $request->rate[$key]["effectiveFrom"])
                        {
                            $fail('The '.$attribute.' field must be a date after or equal to '.$request->rate[$key]["effectiveFrom"]);
                        }

                    },
                ],
                "rates.*.lockStatus"=>"required|bool",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $id = $request->id;
            $this->begin();
            $this->_SubCategoryTypeMaster->edit($request);
            foreach(collect($request->rates)->sortBy("effectiveFrom") as $rate){
                $rateRequest = new Request($rate);
                $rateRequest->merge(["sub_category_type_master_id"=>$id]);
                if($rateRequest->id){
                    $this->_RateMaster->edit($rateRequest);
                }else{
                    $this->_RateMaster->store($rateRequest);
                }
            }
            $this->commit();
            return responseMsg(true,"Sub Category Update","");
        }catch(CustomException $e){
            $this->rollback();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollback();
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function lockUnlockSubCategory(Request $request){
        try{
            $rules = [
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_SubCategoryTypeMaster->getConnectionName().".".$this->_SubCategoryTypeMaster->getTable().",id",
                "lockStatus"=>"required|bool"
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $id = $this->_SubCategoryTypeMaster->edit($request);
            return responseMsg(true,"Category Update","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function getSubCategoryList(Request $request){
        try{
            $data= $this->_SubCategoryTypeMaster
                ->orderBy("id","ASC");
            if($request->categoryTypeMasterId){
                $data->where("category_type_master_id",$request->categoryTypeMasterId);
            }
            if($request->all){
                $data = $data->where("lock_status",false)->get();
                return responseMsg(true,"All User List",camelCase(remove_null($data)));
            }
            if($request->has("offset") && $request->has("limit")){
                $data = $data->where("lock_status",false)->offset($request->offset)->limit($request->limit)->get();
                return responseMsg(true,"All User List",camelCase(remove_null($data)));
            }
            $data = paginator($data,$request);
            $data["data"]= collect($data["data"])->map(function($val){
                $val->category_type = $this->_CategoryTypeMaster->find($val->category_type_master_id)?->category_type;
                $val->rates =  $this->_RateMaster->where("sub_category_type_master_id",$val->id)->orderBy("effective_from","ASC")->get()->map(function($rate){
                    $rate->rate_per_month_composting_machine = $rate->is_percent_composting_machine_rate ? (($rate->rate_per_month/100)*$rate->composting_machine_rate) :$rate->composting_machine_rate; 
                    return $rate;
                });               
                return $val;
            });
            return responseMsg(true,"Sub Category List",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error !!!","");
        }
    }

    public function subCategoryDtl(Request $request){
        try{
            $rules = [
                "id"=>"required|integer|exists:".$this->_SubCategoryTypeMaster->getConnectionName().".".$this->_SubCategoryTypeMaster->getTable().",id",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }     
            $data = $this->_SubCategoryTypeMaster->find($request->id);  
            $data->rates =  $this->_RateMaster->where("sub_category_type_master_id",$data->id)->orderBy("effective_from","ASC")->get()->map(function($rate){
                $rate->rate_per_month_composting_machine = $rate->is_percent_composting_machine_rate ? (($rate->rate_per_month/100)*$rate->composting_machine_rate) :$rate->composting_machine_rate; 
                return $rate;
            });         
            return responseMsg(true,"Category Type Details",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error!!",'');
        }
    }
}
