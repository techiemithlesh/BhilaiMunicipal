<?php
namespace App\Trait\Trade;

use App\Bll\Common;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\DBSystem\WorkflowMaster;
use App\Models\DBSystem\WorkflowUlbRoleMap;
use App\Models\Property\PropertyDetail;
use App\Models\Trade\ActiveTradeLicense;
use App\Models\Trade\ApplicationTypeMaster;
use App\Models\Trade\DocTypeMaster;
use App\Models\Trade\FirmTypeMaster;
use App\Models\Trade\OwnershipTypeMaster;
use App\Models\Trade\RejectedTradeLicense;
use App\Models\Trade\TradeItemTypeMaster;
use App\Models\Trade\TradeLicense;
use App\Models\Trade\TradeLicenseLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

trait TradeTrait{
    public function adjustTradeValue($trade){
        
        $ulbDtl = UlbMaster::find($trade->ulb_id);
        $oldWard = UlbWardMaster::find($trade->ward_mstr_id);
        $newWard = UlbWardMaster::find($trade->new_ward_mstr_id);
        $ownershipTypeMaster = OwnershipTypeMaster::find($trade->ownership_type_id);

        $firmTypeMaster = FirmTypeMaster::find($trade->firm_type_id);
        $applicationTypeMaster = ApplicationTypeMaster::find($trade->application_type_id);
        $TradeItemTypeMaster = TradeItemTypeMaster::find($trade->id);

        
        $trade->new_holding_no = "";
        if($trade->property_detail_id){
            $trade->new_holding_no = PropertyDetail::find($trade->property_detail_id)?->new_holding_no;
        }


        $trade->application_type = $applicationTypeMaster->application_type??"";
        $trade->ulb_name = $ulbDtl->ulb_name??"";
        $trade->ward_no = $oldWard->ward_no??"";
        $trade->new_ward_no = $newWard->ward_no??"";
        $trade->ownership_type = $ownershipTypeMaster->ownership_type??"";
        $trade->firm_type = $firmTypeMaster->firm_type??"";
        return $trade;
    }


    public function getTradeStatus($id){
        $status = "";
        $trade = ActiveTradeLicense::find($id);
        if(!$trade){
            $trade=TradeLicense::find($id);
        }if(!$trade){
            $trade=RejectedTradeLicense::find($id);
        }
        if(!$trade){
            $trade=TradeLicenseLog::find($id);
        }

        if(in_array($trade->getTable(),["trade_license_logs","trade_licenses"])){
            $role = RoleTypeMstr::find($trade->current_role_id);
            $status="Application Approved ";
            if($role){
                $status.=" By ".$role->role_name??""." On ".$trade->approved_date;
            }
        }elseif($trade->is_btc){
            $role = RoleTypeMstr::find($trade->current_role_id);
            $status ="Application Back To Citizen ".($role ? "From ".$role->role_name??"" : " ");
        }elseif(!$trade->payment_status && !$trade->is_doc_upload){
            $status ="Payment Not Done And Document Not Uploaded";
        }elseif($trade->payment_status && !$trade->is_doc_upload){
            $role = RoleTypeMstr::find($trade->current_role_id);
            $status ="Payment Done But Document Not Uploaded ";
        }elseif(!$trade->payment_status && $trade->is_doc_upload){
            $role = RoleTypeMstr::find($trade->current_role_id);
            $status ="Document Uploaded But Payment Not Done";
        }else{
            $role = RoleTypeMstr::find($trade->current_role_id);
            $status ="Application Pending At ".($role ? $role->role_name : "");
        }
        return $status;
    }

    public function generateTradeRequestForCharge($id){
        $license = ActiveTradeLicense::find($id);
        $natureOfBusiness = $license->getTradeItems()->get()->map(function($item){
            $item->tradeItemTypeId = $item->id;
            return $item;
        });
        return[
            "currentDate"=>$license->apply_date,
            "applicationId"=>$license->application_type_id,
            "firmEstablishmentDate"=>($license->application_type_id==Config::get("TradeConstant.APPLICATION-TYPE.NEW LICENSE") ? $license->firm_establishment_date : $license->valid_from),
            "licenseForYears"=>$license->license_for_years,
            "areaInSqft"=>$license->area_in_sqft,
            "isTobaccoLicense"=>$license->is_tobacco_license,
            "natureOfBusiness"=>$natureOfBusiness,
        ];
    }

    public function getRequiredDocList($trade){
        $docList = [];
        $commonClass = new Common;
        $user = Auth::user();
        if($trade->application_type_id==1)
		{
			$docList[]='New_Licenses';
		}
        else{
            $docList[]='Licenses';
        }
		if($trade->application_type_id==3)
		{
			$docList[]='Amendment_Affidavit';
		}
        elseif($trade->application_type_id==4)
		{
			$docList[]='Surrender_Affidavit';
		}

		if($trade->property_detail_id)
		{
			$docList[]='Holding_Tax_Receipt';
		}
        if(!$user || $commonClass->checkUsersWithtocken("citizens")){
            $docList[]='Application_Form';
        }        
        $docList[]='other';
        $lists = DocTypeMaster::whereIn("doc_type",$docList)->where("lock_status",false)->get();
        $uploadedDoc = $trade->getDocList()->whereNull("trade_license_owner_detail_id")->get();
        $lists = $lists->map(function($item)use($uploadedDoc){
            $testDoc = collect($uploadedDoc)->where("doc_type_id",$item->id)->sortByDesc("id")->first();
            $item->doc_code = Str::title(implode(" ",explode("_",$item->doc_type))); 
            $item->list = $item->getDocList()->get();
            $item->doc_list_names = $item->list->implode("doc_name",",");
            $item->uploaded_doc_name = $testDoc ? $testDoc["doc_name"] : "";
            $item->uploaded_doc = $testDoc ? url("/documents")."/".$testDoc["doc_path"]:"";
            return $item;
        });
        return["appDoc"=>$lists,"ownerDoc"=>$this->getOwnerDocList($trade)];
    }

    public function getOwnerDocList($trade){
        $owners = $trade->getOwners();
        $lists = $owners->map(function($item){
            $docList=[];
            $docList[] = "Owner_Image";
            $docList[] = "Identity_Proof";
            
            $list = DocTypeMaster::whereIn("doc_type",$docList)->where("lock_status",false)->get();
            $uploadedDoc = $item->getDocList()->get();
            $item->doc_list = $list->map(function($item)use($uploadedDoc){
                $testDoc = collect($uploadedDoc)->where("doc_type_id",$item->id)->sortByDesc("id")->first();
                $item->doc_code = Str::title(implode(" ",explode("_",$item->doc_type)));
                $item->list = $item->getDocList()->get();
                $item->doc_list_names = $item->list->implode("doc_name",",");
                $item->uploaded_doc_name = $testDoc ? $testDoc["doc_name"] : "";
                $item->uploaded_doc = $testDoc ? url("/documents")."/".$testDoc["doc_path"]:"";
                return $item;
            });
            return $item;
        });
        return $lists;
    }

    public function metaDataList(){
        return ActiveTradeLicense::where("active_trade_licenses.lock_status",false)
                ->leftJoin(DB::raw("(
                    select trade_license_id, string_agg(owner_name,',') AS owner_name, 
                        string_agg(guardian_name,',') AS guardian_name,
                        string_agg(mobile_no::text,',') AS mobile_no
                    from active_trade_license_owner_details
                    where lock_status = false
                    group by trade_license_id
                )owners"),"owners.trade_license_id","active_trade_licenses.id")
                ->leftJoin("ulb_ward_masters","ulb_ward_masters.id","active_trade_licenses.ward_mstr_id")
                ->leftJoin("application_type_masters","application_type_masters.id","active_trade_licenses.application_type_id")
                ->leftJoin("firm_type_masters","firm_type_masters.id","active_trade_licenses.firm_type_id")
                ->select("active_trade_licenses.id","active_trade_licenses.application_no","firm_type_masters.firm_type",
                    "active_trade_licenses.apply_date",
                    "current_role_id","initiator_role_id","finisher_role_id","max_level_attempt",
                    "ulb_ward_masters.ward_no",
                "address","application_type_masters.application_type","owners.*");
    }

    public function testWorks($tradeId){
        $user = Auth()->user();
        $workComplied = true;
        $message ="";
        $trade = ActiveTradeLicense::find($tradeId);
        if($trade){
            $role = $user->getRoleDetailsByUserId()->first(); 
            $workflowMater = WorkflowMaster ::find($trade->workflow_id);
            if(!$workflowMater){
                $workComplied = true ;
            }
            $WfPermission = $workflowMater->getWorkFlowRoles()->where("ulb_id",$user->ulb_id)->where("role_id",$role->id)->first();
            if($this->_CommonClass->checkUsersWithtocken("citizens")){
                $WfPermission = new WorkflowUlbRoleMap([
                    "can_doc_upload"=> true,
                ]);
            }
            if(!$WfPermission){
                $workComplied = true ;
            }
            
            if($WfPermission->can_doc_upload || $WfPermission->can_doc_verify){
                $requiredDocList = $this->getRequiredDocList($trade);
                $getUploadedDocList = $trade->getDocList()->get();
                $applicationDoc = collect($requiredDocList["appDoc"]??[]);
                $ownerDoc = collect($requiredDocList["ownerDoc"]??[]);

                $appMandetoryDoc = $applicationDoc->where("is_madetory", true);

                $appUploadedDocVerified = collect();
                $appUploadedDocRejected = collect();
                $appMadetoryDocRejected  = collect();
                $applicationDoc->map(function ($item) use ($appUploadedDocVerified, $appUploadedDocRejected, $appMadetoryDocRejected,$getUploadedDocList) {
                    $val = $getUploadedDocList->where("doc_type_id",$item->id)->whereNull("trade_license_owner_detail_id")->first();
                    $appUploadedDocVerified->push(["is_docVerify" => ($val ?  ($val->verified_status ? true : false) : true)]);
                    $appUploadedDocRejected->push(["is_docRejected" => ($val ?  ($val->verified_status == 2 ? true : false) : false)]);
                    if ($item->is_madetory) {
                        $appMadetoryDocRejected->push(["is_docRejected" => ($val ?  ($val->verified_status == 2 ? true : false) : false)]);
                    }
                });
                $is_appUploadedDocVerified          = $appUploadedDocVerified->where("is_docVerify", false);
                $is_appUploadedDocRejected          = $appUploadedDocRejected->where("is_docRejected", true);
                $is_appUploadedMadetoryDocRejected  = $appMadetoryDocRejected->where("is_docRejected", true);
                // $is_appMandUploadedDoc              = $appMandetoryDoc->whereNull("uploaded_doc");
                
                $is_appMandUploadedDoc = $appMandetoryDoc->filter(function ($val) {
                    return ($val["uploaded_doc"] == "" || $val["uploaded_doc"] == null);
                });

                $Wdocuments = collect();
                $ownerDoc->map(function ($val) use ($Wdocuments) {
                    $ownerId = $val->id?? "";
                    $ownerUploadDoc = $val->getDocList()->get();
                    $val["doc_list"]->map(function ($val1) use ($Wdocuments, $ownerId,$ownerUploadDoc) {
                        $test = $ownerUploadDoc->where("doc_type_id",$val1->id)->first();
                        $val1["ownerId"] = $ownerId;
                        $val1["is_uploded"] = ($val1->is_madetory)  ? ($test ? true : false) : true;
                        $val1["is_docVerify"] = $test ?  ($test->verified_status ? true : false) : true;
                        $val1["is_docRejected"] = $test ?  ($test->verified_status == 2 ? true : false) : false;
                        $val1["is_madetory_docRejected"] = ($test && $val1->is_madetory) ?  ($test->verified_status == 2 ? true : false) : false;
                        $Wdocuments->push($val1);
                    });
                });
                $ownerMandetoryDoc              = $Wdocuments->where("is_madetory", true);
                $is_ownerUploadedDoc            = $Wdocuments->where("is_uploded", false);
                $is_ownerDocVerify              = $Wdocuments->where("is_docVerify", false);
                $is_ownerDocRejected            = $Wdocuments->where("is_docRejected", true);
                $is_ownerMadetoryDocRejected    = $Wdocuments->where("is_madetory_docRejected", true);
                if ($WfPermission->can_doc_upload) {
                    $workComplied = (empty($is_ownerUploadedDoc->all()) && empty($is_ownerDocRejected->all()) && empty($is_appMandUploadedDoc->all()) && empty($is_appUploadedDocRejected->all()));
                    $message = $workComplied ? $message : "All Mandatory Documents Are Not Uploaded";
                }
                if ($WfPermission->can_doc_verify && $workComplied) {
                    $workComplied= (empty($is_ownerDocVerify->all()) && empty($is_appUploadedDocVerified->all()) && empty($is_ownerMadetoryDocRejected->all()) && empty($is_appUploadedMadetoryDocRejected->all()));
                    $message = $workComplied ? $message : "All Documents Are Not Verified Or Some Documents Are Rejected";
                }
            }
            if($WfPermission->can_field_verify){
                if($role->id==5 && !$trade->is_field_verify){
                    $workComplied=false;                    
                    $message = "Filed Verification Pending";
                }
                if($role->id==7 && !$trade->is_utc_field_verify){
                    $workComplied=false;
                    $message = "Filed Verification Pending";
                }
            }
            if($WfPermission->can_geotag){
                $geoTag = $trade->getGeoTag()->get();
                if($geoTag->isEmpty()){
                    $workComplied = false;
                    $message = "GEO Tag Is Pending";
                }
            }

        }
        return ["is_work_complied"=>$workComplied,"message"=>$message];
    }

    public function generateLicenseNo($tradeId){
        $trade = ActiveTradeLicense::find($tradeId);
        if(!$trade){
            $trade = TradeLicense::find($tradeId);
        }
        $ulb = UlbMaster::find($trade->ulb_id);
        $tradeItems = $trade->getTradeItems()->get();
        $oldLIcense = TradeLicense::find($trade->privies_license_id);
        $prefix = $ulb->short_name??"LIC"; 
        
        $ward_no = $trade->getWardOldWardNo()->ward_no??"";
        if(!$ward_no){
            $ward_no = $trade->getWardNewdWardNo()->ward_no??"";
        }
        
        
        $serial_no = TradeLicense::where("ward_mstr_id",$trade->ward_mstr_id)->where("ulb_id",$trade->ulb_id)->where("application_type_id",Config::get("TradeConstant.APPLICATION-TYPE.NEW LICENSE"))->count("id");
        $serial_no += TradeLicenseLog::where("ward_mstr_id",$trade->ward_mstr_id)->where("ulb_id",$trade->ulb_id)->where("application_type_id",Config::get("TradeConstant.APPLICATION-TYPE.NEW LICENSE"))->count("id");
        $serial_no +=1;
        $serial_no_pad = str_pad($serial_no, 4, "0", STR_PAD_LEFT);
        $ward_no = str_pad($ward_no, 3, "0", STR_PAD_LEFT);
        $generated_license_no = $prefix.$ward_no . $serial_no_pad ;
        if(!$oldLIcense){
            while(TradeLicense::where('license_no', $generated_license_no)->exists()){
                    $serial_no ++;
                    $serial_no_pad = str_pad($serial_no, 4, "0", STR_PAD_LEFT);
                    $generated_license_no = $prefix.$ward_no . $serial_no_pad;                
            }
            while(TradeLicenseLog::where('license_no', $generated_license_no)->exists()){
                    $serial_no ++;
                    $serial_no_pad = str_pad($serial_no, 4, "0", STR_PAD_LEFT);
                    $generated_license_no = $prefix.$ward_no . $serial_no_pad;                
            }
        }
        return $oldLIcense && $oldLIcense->license_no ? $oldLIcense->license_no : $generated_license_no ;
    }
}