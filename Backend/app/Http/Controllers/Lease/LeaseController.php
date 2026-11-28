<?php

namespace App\Http\Controllers\Lease;

use App\Bll\Lease\LeaseDueBll;
use App\Bll\Lease\PaymentReceiptBll;
use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Lease\AddLeaseRequest;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Lease\AreaMaster;
use App\Models\Lease\Lease;
use App\Models\Lease\LeaseDemand;
use App\Models\Lease\LeaseOwner;
use App\Models\Lease\LeaseRent;
use App\Models\Lease\LeaseTransaction;
use App\Models\Lease\ParamModel;
use App\Models\Lease\UsageTypeMaster;
use App\Models\Property\PropertyDetail;
use App\Trait\Lease\LeaseTrait;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LeaseController extends Controller
{
    use LeaseTrait;

    private $_MODULE_ID;
    private $_Conn;
    private $_UlbWardMaster;
    private $_PropertyDetail;

    private $_AreaMaster;
    private $_Lease;
    private $_LeaseOwner;
    private $_LeaseRent;
    private $_UsageTypeMaster;
    private $_LeaseDemand;
    private $_LeaseTransaction;

    function __construct()
    {
        $this->_MODULE_ID = Config::get("SystemConstant.MODULE.LEASE");
        $this->_Conn = (new ParamModel())->resolveDynamicConnection();
        $this->_UlbWardMaster = new UlbWardMaster();

        $this->_PropertyDetail = new PropertyDetail();

        $this->_AreaMaster = new AreaMaster();
        $this->_Lease = new Lease();
        $this->_LeaseOwner = new LeaseOwner();
        $this->_LeaseRent = new LeaseRent();
        $this->_UsageTypeMaster = new UsageTypeMaster();
        $this->_LeaseDemand = new LeaseDemand();
        $this->_LeaseTransaction = new LeaseTransaction();

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

    public function getLeaseMasterData(Request $request){
        try{
            $user = Auth()->user();
            $ulbId = $request->ulbId ? $request->ulbId : ($user->ulb_id??0);

            $ulbWardMaster = $this->_UlbWardMaster->getNumericWardList($ulbId);
            $areaTypeMaster = $this->_AreaMaster->getAreaList();
            $useOfLand = $this->_UsageTypeMaster->getUsageList();


            $data=[
                "wardList"=>$ulbWardMaster,
                "areaType"=>$areaTypeMaster,
                "useOfLand"=>$useOfLand,
            ];
            return responseMsg(true,"Lease Master Data",camelCase(remove_null($data)));
        }
        catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function addLease(AddLeaseRequest $request){
        try{
            $user = Auth()->user(); 
            $additionData = [
                "applyDate"=>Carbon::now()->format("Y-m-d"),
                "leaseStatusId"=>1,
            ]; 
            if($user && $user->getTable()=='users'){
                $additionData["userId"]=$user->id;
            }
            if($request->holdingNo){
                $property = $this->_PropertyDetail->where("new_holding_no", $request->holdingNo)->where("lock_status",false)->first();
                $additionData["propertyDetailId"]=$property?->id;
            }
            $request->merge($additionData);
            
            $this->begin();

            $leaseId = $this->_Lease->store($request);
            
            foreach($request->ownerDtl as $owner){
                $newOwnerRequest = new Request($owner);
                $newOwnerRequest->merge(["leaseId"=>$leaseId]);
                $this->_LeaseOwner->store($newOwnerRequest);
            }
            $connectionArr = [
                "leaseId"=>$leaseId,
                "yearlyRate"=>$request->yearlyRate,
                "leaseDate"=>$request->leaseDate,
                "leaseEndDate"=>$request->leaseEndDate,
                "effectiveDate"=>$request->effectiveDate,
                "userId"=>$request->userId,
            ];
            if($request->document){
                $relativePath = "Uploads/Lease";
                $imageName = (strtotime(now())).".".$request->document->getClientOriginalExtension();
                $path = $request->document->storeAs($relativePath,$imageName, $this->disk);
                $connectionArr["docPath"] = $path;
            }
            
            $connectionRequest = new Request($connectionArr);
            $rateId = $this->_LeaseRent->store($connectionRequest);

            // list($curentFyearFromDate,$curentFyearLastDate) = FyearFromUptoDate(getFy());
            // $request->merge(["id"=>$shopId,"currentDate"=>$curentFyearLastDate]);
            // $objDemandBll = new ShopDemandGenerateBll($request);
            // $objDemandBll->generateDemand();
            
            $lease = $this->_Lease->find($leaseId);
            $leaseNo = $lease->lease_no??"";
            $this->commit();
            return responseMsg(true,"Application Submitted ",remove_null(camelCase(["leaseId"=>$leaseId,"leaseNo"=>$leaseNo])));
            
        }
        catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            $this->rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function searchLease(Request $request){
        try{
            $lease = $this->_Lease->readConnection()->select(
                "leases.id",  
                "leases.lease_no",
                "leases.lease_reg_no",
                "leases.holding_no",
                "leases.address",
                "leases.pin_code",
                "leases.apply_date",
                "rate.lease_date",
                "rate.lease_end_date",
                "rate.yearly_rate",
                "rate.effective_date",
                "wm.ward_no",
                "status.status_type",
                "am.area_name",
                "ust.usage_type",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
            )
            ->join(DB::raw("(
                SELECT lease_id,
                       STRING_AGG(owner_name, ',') AS owner_name,
                       STRING_AGG(guardian_name, ',') AS guardian_name,
                       STRING_AGG(CAST(mobile_no AS VARCHAR), ',') AS mobile_no
                FROM lease_owners
                WHERE lock_status = false
                GROUP BY lease_id
            ) AS w"), "w.lease_id", "=", "leases.id")
            ->join("ulb_ward_masters as wm", "wm.id", "=", "leases.ward_mstr_id")
            ->leftJoin("lease_rents AS rate","rate.id","=","leases.current_rate_id")
            ->leftJoin("usage_type_masters AS ust","ust.id","=","leases.uses_type_id")
            ->leftJoin("lease_status_masters AS status","status.id","=","leases.lease_status_id")
            ->leftJoin("area_masters AS am","am.id","=","leases.area_id")
            ->where("leases.lock_status", false);

            if($request->keyWord){
                $lease->where(function($where)use($request){
                    $where->where("leases.lease_no","ILIKE","%".$request->keyWord."%")
                    ->orWhere("leases.lease_reg_no","ILIKE","%".$request->keyWord."%")
                    ->orWhere("leases.holding_no","ILIKE","%".$request->keyWord."%")
                    ->orWhere("w.owner_name","ILIKE","%".$request->keyWord."%")
                    ->orWhere("w.mobile_no","ILIKE","%".$request->keyWord."%");
                });
            }
            if($request->wardId){
                if(!is_array($request->wardId)){
                    $request->merge(["wardId",[$request->wardId]]);
                }
                $lease->whereIn("wm.id",$request->wardId);
            }
            $list = $lease;
            $data = paginator($list,$request);
            return responseMsg(true,"lease Fetched",camelCase(remove_null($data)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function leaseDtl(Request $request){
        try{
            $rule=[
                "id"=>"Required|digits_between:1,9223372036854775807"
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $lease = $this->_Lease->find($request->id);            
            if(!$lease){
                throw new CustomException("Property Not Found");
            }
            $this->adjustLeaseValue($lease);

            $lease->owners = $lease->getOwners();
            $lease->tran_dtls = $lease->getTrans();
            $lease->lease_rents = $lease->getAllRent()->each(fn($item,$index)=>$item->is_current = $lease->current_rate_id==$item->id);

            $user = Auth()->user();
            if($user->getTable()=="users"){
                $role = $user->getRoleDetailsByUserId()->first();
                $lease->UserPermission = $role?->getRolePermission()->where("ulb_id",$user->ulb_id)->where("module_id",$this->_MODULE_ID)->first();             
            }
            return responseMsg(true,"Lease Detail",camelCase(remove_null($lease)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    /*
    public function generateDemand(Request $request)
    {
        try {
            $rules = [
                "id" => "required|digits_between:1,9223372036854775807|exists:".$this->_Lease->getConnectionName().".".$this->_Lease->getTable().",id,lock_status,false",             
            ];
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return validationError($validator);
            }

            $user = Auth()->user();
            $request->merge(["userId" => $user->id]);
            list($curentFyearFromDate,$curentFyearLastDate) = FyearFromUptoDate(getFy());
            $request->merge(["currentDate"=>$curentFyearLastDate]);
            
            $this->begin();
            
            $objDemandBll = new ShopDemandGenerateBll($request);
            $objDemandBll->generateDemand();
            $this->commit();

            return responseMsg(true, "Demand Generated", "");
        } catch (CustomException $e) {
            $this->rollback();
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            $this->rollback();
            return responseMsg(false, "Server Error", "");
        }
    }
    */

    public function getAllDemands(Request $request){
        try{
            $rule=[
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_Lease->getConnectionName().".".$this->_Lease->getTable().",id"
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $allDemand = $this->_LeaseDemand->readConnection()
                    ->where("lease_id",$request->id)
                    ->where("lock_status",false)
                    ->orderBy("fyear","DESC"); 
            $summaryOrm = clone $allDemand;
            $summary = $summaryOrm->get();
            $data = paginator($allDemand,$request);
            $data["summary"]=[
                "totalDue"=>$summary->sum("balance"),
            ];
            return responseMsg(true,"Lease Demand History",camelCase(remove_null($data)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }

    public function leaseDue(Request $request){
        try{
            $fyear = getFy();
            $rules = [
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_Lease->getConnectionName().".".$this->_Lease->getTable().",id,lock_status,false",
                'fyear' => [
                    'nullable',
                    'string',
                    function (string $attribute, mixed $value, \Closure $fail) use ($fyear) {
                        if (!preg_match('/^(\d{4})-(\d{4})$/', $value, $matches)) {
                            $fail("The {$attribute} must be in YYYY-YYYY format.");
                            return;
                        }

                        $startYear = (int) $matches[1];
                        $endYear = (int) $matches[2];

                        if ($endYear !== $startYear + 1) {
                            $fail("The {$attribute} must contain consecutive years (e.g., {$fyear}).");
                            return;
                        }

                        if ($fyear && preg_match('/^(\d{4})-(\d{4})$/', $fyear, $maxMatches)) {
                            $maxStartYear = (int) $maxMatches[1];
                            if ($startYear > $maxStartYear) {
                                $fail("The {$attribute} must be less than or equal to {$fyear}.");
                            }
                        }
                    },
                ],
            ];
            
            $validator = Validator::make($request->all(), $rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $currentDate = Carbon::now()->format("Y-m-d");
            $demandUptoFyear = $request->fyear??$fyear;
            $objConsumerDueBll = new LeaseDueBll($request->id,$currentDate,$demandUptoFyear);
            $objConsumerDueBll->getConsumerDue();
            return responseMsg(true,"Lease Due",camelCase(remove_null($objConsumerDueBll->_GRID)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"Server Error","");
        }
    }

    /*
    public function offlinePayment(Request $request){
        try{
            list($from,$upto) = FyearFromUptoDate(getFy());
            $rule=[
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_Shop->getConnectionName().".".$this->_Shop->getTable().",id,lock_status,false",
                "demandUpto"=>"nullable|date|date_format:Y-m-d|before_or_equal:".$upto,
                "paymentType"=>"required|in:FULL,PART",
                "paymentMode" => "required|in:ONLINE,CASH,CHEQUE,DD,NEFT,RTGS",
                "amount"=>"nullable|required_if:paymentType,==,PART|numeric|min:0",
                "chequeNo"=>"required_unless:paymentMode,ONLINE,CASH",
                "chequeDate"=>"required_unless:paymentMode,ONLINE,CASH",                
                "bankName"=>"required_unless:paymentMode,ONLINE,CASH",
                "branchName"=>"required_unless:paymentMode,ONLINE,CASH",
            ];
            $validator = Validator::make($request->all(),$rule);
            if($validator->fails()){
                return validationError($validator);
            }
            $currentDate = Carbon::now()->format("Y-m-d");
            $demandUpto = Carbon::parse($request->demandUpto??$upto)->endOfMonth()->format("Y-m-d");

            $objConsumerDueBll = new ShopDueBll($request->id,$currentDate,$demandUpto);
            $objConsumerDueBll->getConsumerDue();
            $demandPayableAmount = $objConsumerDueBll->_GRID["payableAmount"];
            if($demandPayableAmount <=0){
                throw new CustomException("All Demand Are Clear");
            } 
            $applicationPaymentBll = new ShopPaymentBll($request);

            $this->begin();           
            $responseData = ($applicationPaymentBll->payNow());
            $this->commit();
            return responseMsg(true,"Payment Successfully Done",$responseData);
        }catch(CustomException $e){
            $this->rollBack();
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            $this->rollBack();
            return responseMsg(false,"Internal Server Error","");
        }
    }
    */

    public function getPaymentReceipt(Request $request){
        try{
            $rules = [
                "id"=>"required|digits_between:1,9223372036854775807|exists:".$this->_LeaseTransaction->getConnectionName().".".$this->_LeaseTransaction->getTable().",id",
            ];
            $validator = Validator::make($request->all(),$rules);
            if($validator->fails()){
                return validationError($validator);
            }
            $receiptBll = new PaymentReceiptBll($request->id); 
            $receiptBll->generateReceipt();
            return responseMsg(true,"Payment Receipt",camelCase(remove_null($receiptBll->_GRID)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }
}
