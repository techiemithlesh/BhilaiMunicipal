<?php

namespace App\Http\Controllers\SWM;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Http\Requests\SWM\AddFeedbackRequest;
use App\Http\Requests\SWM\UpdateFeedbackRequest;
use App\Models\SWM\Consumer;
use App\Models\SWM\FeedbackDetail;
use App\Models\SWM\FeedbackMaster;
use App\Models\SWM\ParamModel;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class FeedbackController extends Controller
{
    //

    private $_Conn;
    private $_Consumer;
    private $_FeedbackMaster;
    private $_FeedbackDetail;
    public function __construct()
    {
        $this->_Conn = (new ParamModel())->resolveDynamicConnection();
        $this->_Consumer = new Consumer();
        $this->_FeedbackMaster = new FeedbackMaster();
        $this->_FeedbackDetail = new FeedbackDetail(); 
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


    public function getFeedbackList(Request $request){
        try{ 
            $user = Auth()->user();
            
            $data = $this->_FeedbackMaster
                    ->readConnection()
                    ->select("feedback_masters.*","users.name")
                    ->join("users","users.id","feedback_masters.user_id");            
            
            if($request->key){
                $data->where(function($where)use($request){
                    $where->orWhere("feedback_masters.feedback","ILIKE","%".$request->key."%");
                });
            }

            if($request->all){
                $data = $data
                    ->where("feedback_masters.lock_status",false)
                    ->get();
                return responseMsg(true,"All Feedback Master List",camelCase(remove_null($data)));
            }
            if($request->has("offset") && $request->has("limit")){
                $data = $data->offset($request->offset)->limit($request->limit)->get();
                return responseMsg(true,"All Feedback Master List",camelCase(remove_null($data)));
            }
            $data = paginator($data,$request);
            return responseMsg(true,"Feedback Master Fetched",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        } 
    }

    public function addFeedBack(AddFeedbackRequest $request){
        try {
            $user = Auth()->user();
            $request->merge(["userId"=>$user->id]);
            $this->begin();
            $roleId = $this->_FeedbackMaster->store($request);
            $this->commit();
            return responseMsg(true, "New Feedback Created", ["id" => $roleId]);
        } catch (CustomException $e) {
            $this->rollBack();
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            $this->rollBack();
            return responseMsg(false, "Internal Server Error", "");
        }
    }

    public function showFeedBack(Request $request)
    {
        try {
            $rules = [
                "id"=>"required|integer|exists:".$this->_FeedbackMaster->getConnectionName().".".$this->_FeedbackMaster->getTable().",id",
            ];       
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            } 
            $data = $this->_FeedbackMaster->find($request->id);
            if (!$data) {
                throw new CustomException("Invalid Id");
            }
            return responseMsg(true, "Feedback Details", camelCase(remove_null($data)));
        } catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            return responseMsg(false, "Internal Server Error", "");
        }
    }

    public function editFeedback(UpdateFeedbackRequest $request)
    {
        //
        try {
            $this->begin();
            if (!$this->_FeedbackMaster->edit($request)) {
                throw new CustomException("Data Not Updated");
            }
            $this->commit();
            return responseMsg(true, "Feedback Updated Successfully", "");
        } catch (CustomException $e) {
            $this->rollBack();
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            $this->rollBack();
            return responseMsg(false, "Internal Server Error", "");
        }
    }

    public function lockUnlockFeedback(Request $request)
    {
        try{
            $rules = [
                "id"=>"required|exists:".$this->_FeedbackMaster->getConnectionName().".".$this->_FeedbackMaster->getTable().",id",
                "lockStatus"=>"required|bool",               
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            } 
            $user = Auth()->user();
            $id = $this->_FeedbackMaster->edit($request);
            return responseMsg(true,"Feedback Update","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }

    public function addConsumerFeedback(Request $request){
        try{
            $rules = [
                "consumerId"=>"required|exists:".$this->_Consumer->getConnectionName().".".$this->_Consumer->getTable().",id,lock_status,false",
                "feedbackId"=>"required|exists:".$this->_FeedbackMaster->getConnectionName().".".$this->_FeedbackMaster->getTable().",id",
                "remarks"=>"required_if:feedbackId,1",               
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            } 
            $user = Auth()->user();
            $request->merge(["userId"=>$user->id]);
            $this->begin();
            $this->_FeedbackDetail->store($request);
            $this->commit();
            return responseMsg(true,"Consumer Feedback Add","");
        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            $this->rollBack();
            return responseMsg(false,"Server Error","");
        }
    }

    public function getConsumerFeedbackList(Request $request){
        try{             
            $data = $this->_FeedbackDetail
                    ->readConnection()
                    ->select("feedback_details.*","consumers.consumer_no","feedback_masters.feedback","users.name")
                    ->join("consumers","consumers.id","feedback_details.consumer_id")
                    ->join("feedback_masters","feedback_masters.id","feedback_details.feedback_id")
                    ->join("users","users.id","feedback_details.user_id")
                    ->where("feedback_details.lock_status",false);            
            
            if($request->key){
                $data->where(function($where)use($request){
                    $where->orWhere("feedback_masters.feedback","ILIKE","%".$request->key."%")
                    ->orWhere("feedback_details.remark","ILIKE","%".$request->key."%")
                    ->orWhere("consumers.consumer_no","ILIKE","%".$request->key."%");
                });
            }

            if($request->all){
                $data = $data->get();
                return responseMsg(true,"All Feedback List",camelCase(remove_null($data)));
            }
            $data = paginator($data,$request);
            return responseMsg(true,"Feedback List",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        } 
    }
}
