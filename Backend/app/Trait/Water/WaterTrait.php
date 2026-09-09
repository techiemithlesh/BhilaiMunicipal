<?php
namespace App\Trait\Water;

use App\Bll\Common;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\DBSystem\WorkflowMaster;
use App\Models\DBSystem\WorkflowUlbRoleMap;
use App\Models\Property\PropertyDetail;
use App\Models\Property\ActiveSafDetail;
use App\Models\Property\SafDetail;
use App\Models\Property\RejectedSafDetail;
use App\Models\Water\ConnectionThroughMaster;
use App\Models\Water\ConnectionTypeMaster;
use App\Models\Water\Consumer;
use App\Models\Water\DocTypeMaster;
use App\Models\Water\OwnershipTypeMaster;
use App\Models\Water\PipelineTypeMaster;
use App\Models\Water\PropertyTypeMaster;
use App\Models\Water\WaterActiveApplication;
use App\Models\Water\WaterApplication;
use App\Models\Water\WaterConnectionCharge;
use App\Models\Water\WaterRejectedApplication;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

trait WaterTrait{
    public function adjustValue($water){
        
        $ulbDtl = UlbMaster::find($water->ulb_id);
        $oldWard = UlbWardMaster::find($water->ward_mstr_id);
        $newWard = UlbWardMaster::find($water->new_ward_mstr_id);
        $ownershipTypeMaster = OwnershipTypeMaster::find($water->ownership_type_id);
        $connectionTypeMaster = ConnectionTypeMaster::find($water->connection_type_id);
        $connectionThrowMaster = ConnectionThroughMaster::find($water->connection_through_id);
        $pipelineTypeMaster = PipelineTypeMaster::find($water->pipeline_type_id);
        $propertyTypeMaster = PropertyTypeMaster::find($water->property_type_id);

        $water->saf_no = "";
        $water->new_holding_no = "";
        if($water->property_detail_id){
            $water->new_holding_no = PropertyDetail::find($water->property_detail_id)?->new_holding_no;
        }
        if($water->saf_detail_id){
            $saf = ActiveSafDetail::find($water->saf_detail_id);
            if(!$saf){
                $saf = SafDetail::find($water->saf_detail_id);
            }
            if(!$saf){
                $saf = RejectedSafDetail::find($water->saf_detail_id);                
            }
            $water->saf_no = $saf?->saf_no;
        }
        $water->connection_type = $connectionTypeMaster->connection_type??"";
        $water->ulb_name = $ulbDtl->ulb_name??"";
        $water->ward_no = $oldWard->ward_no??"";
        $water->new_ward_no = $newWard->ward_no??"";
        $water->ownership_type = $ownershipTypeMaster->ownership_type??"";
        $water->connection_through = $connectionThrowMaster->connection_through??"";
        $water->pipeline_type = $pipelineTypeMaster->pipeline_type??"";
        $water->property_type = $propertyTypeMaster->property_type??"";
        return $water;
    }


    public function getAppStatus_old($id){
        $status = "";
        $water = WaterActiveApplication::find($id);
        if(!$water){
            $water=WaterApplication::find($id);
        }if(!$water){
            $water=WaterRejectedApplication::find($id);
        }

        if(in_array($water->getTable(),["water_applications"])){
            $role = RoleTypeMstr::find($water->current_role_id);
            $status="Application Approved ";
            if($role){
                $status.=" By ".$role->role_name??""." On ".$water->approved_date;
            }
        }elseif($water->is_btc){
            $role = RoleTypeMstr::find($water->current_role_id);
            $status ="Application Back To Citizen ".($role ? "From ".$role->role_name??"" : " ");
        }elseif(!$water->payment_status && !$water->is_doc_upload){
            $status ="Payment Not Done And Document Not Uploaded";
        }elseif($water->payment_status && !$water->is_doc_upload){
            $role = RoleTypeMstr::find($water->current_role_id);
            $status ="Payment Done But Document Not Uploaded ";
        }elseif(!$water->payment_status && $water->is_doc_upload){
            $role = RoleTypeMstr::find($water->current_role_id);
            $status ="Document Uploaded But Payment Not Done";
            $inspectionCharge = WaterConnectionCharge::where("lock_status",false)
                                ->where("paid_status",false)
                                ->where("application_id",$water->id)
                                ->where("charge_for","Site Inspection")
                                ->first();
            if($inspectionCharge){
                $status ="Difference Amount Generated On Site Inspection Please Pay It.";
            }
        }else{
            $role = RoleTypeMstr::find($water->current_role_id);
            $status ="Application Pending At ".($role ? $role->role_name : "");
        }
        return $status;
    }

    public function getAppStatus($id){
        $status = "";
        $water = WaterActiveApplication::find($id);
        if(!$water){
            $water=WaterApplication::find($id);
        }if(!$water){
            $water=WaterRejectedApplication::find($id);
        }

        if(in_array($water->getTable(),["water_applications"])){
            $role = RoleTypeMstr::find($water->current_role_id);
            $status="Application Approved ";
            if($role){
                $status.=" By ".$role->role_name??""." On ".$water->approved_date;
            }
        }elseif($water->is_btc){
            $role = RoleTypeMstr::find($water->current_role_id);
            $status ="Application Back To Citizen ".($role ? "From ".$role->role_name??"" : " ");
        }elseif(!$water->is_doc_upload){
            $status ="Document Not Uploaded";
        }else{
            $role = RoleTypeMstr::find($water->current_role_id);
            $status ="Application Pending At ".($role ? $role->role_name : "");
        }
        return $status;
    }

    public function metaDataList(){
        return WaterActiveApplication::from("water_active_applications as app")                
                ->join("connection_type_masters as ctm", "ctm.id", "app.connection_type_id")
                ->join("property_type_masters as ptm", "ptm.id", "app.property_type_id")
                ->join("connection_through_masters as cthm", "cthm.id", "app.connection_through_id")
                ->join("ownership_type_masters as otm", "otm.id", "app.ownership_type_id")
                ->join(DB::raw("(
                    SELECT application_id,
                        STRING_AGG(owner_name, ',') AS owner_name,
                        STRING_AGG(guardian_name, ',') AS guardian_name,
                        STRING_AGG(CAST(mobile_no AS VARCHAR), ',') AS mobile_no
                    FROM water_active_application_owners
                    WHERE lock_status = false
                    GROUP BY application_id
                ) AS w"), "w.application_id", "=", "app.id")
                ->leftJoin(DB::raw("(
                    SELECT id, saf_no,'active' as app
                    FROM active_saf_details
                    WHERE lock_status = false
                    UNION
                    SELECT id, saf_no,'app' as app
                    FROM saf_details
                    WHERE lock_status = false
                ) AS saf"), "saf.id", "=", "app.saf_detail_id")
                ->join("ulb_ward_masters as wm", "wm.id", "=", "app.ward_mstr_id")
                ->leftJoin("ulb_ward_masters as wmn", "wmn.id", "=", "app.new_ward_mstr_id")
                ->leftJoin("property_details as pd", "pd.id", "app.property_detail_id")                
                ->where("app.lock_status",false)
                ->select("app.id",
                "app.application_no",
                "pd.new_holding_no",
                "saf.saf_no",
                "app.address",
                "app.apply_date",
                "wm.ward_no",
                "wmn.ward_no as new_ward_no",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
                "app.is_btc",
                "app.current_role_id",
                "app.payment_status",
                "app.is_doc_upload"
            );
    }

    public function getRequiredDocList($water){
        $docList = [];
        $commonClass = new Common;
        $user = Auth::user();
        $docList[]='Meter_Bill';
        if(in_array($water->connection_through_id,[1]) || ($water->property_detail_id || $water->saf_detail_id))
		{
			$docList[]='Holding_Proof';
		}
		if(str::upper($water->category)=="BPL")
		{
			$docList[]='BPL';
		}
        elseif($water->ownership_type_id==2)
		{
			$docList[]='Tenant';
		}

        if(!$water->citizen_id){
            $docList[]='Declaration_Form';
        }        
        $docList[]='Others';
        $lists = DocTypeMaster::whereIn("doc_type",$docList)->where("lock_status",false)->get();
        $uploadedDoc = $water->getDocList()->whereNull("owner_detail_id")->get();
        $lists = $lists->map(function($item)use($uploadedDoc){
            $testDoc = collect($uploadedDoc)->where("doc_type_id",$item->id)->sortByDesc("id")->first();
            $item->doc_code = Str::title(implode(" ",explode("_",$item->doc_type))); 
            $item->list = $item->getDocList()->get();
            $item->doc_list_names = $item->list->implode("doc_name",",");
            $item->uploaded_doc_name = $testDoc ? $testDoc["doc_name"] : "";
            $item->uploaded_doc = $testDoc ? url("/documents")."/".$testDoc["doc_path"]:"";
            return $item;
        });
        return["appDoc"=>$lists,"ownerDoc"=>$this->getOwnerDocList($water)];
    }

    public function getOwnerDocList($water){
        $owners = $water->getOwners();
        $lists = $owners->map(function($item){
            $docList=[];
            $docList[] = "Photo";
            $docList[] = "ID_Proof";
            
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

    public function testWorks($waterId){
        $user = Auth()->user();
        $workComplied = true;
        $message ="";
        $water = WaterActiveApplication::find($waterId);
        if($water){
            $role = $user->getRoleDetailsByUserId()->first(); 
            $workflowMater = WorkflowMaster::find($water->workflow_id);
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
                $requiredDocList = $this->getRequiredDocList($water);
                $getUploadedDocList = $water->getDocList()->get();
                $applicationDoc = collect($requiredDocList["appDoc"]??[]);
                $ownerDoc = collect($requiredDocList["ownerDoc"]??[]);

                $appMandetoryDoc = $applicationDoc->where("is_madetory", true);

                $appUploadedDocVerified = collect();
                $appUploadedDocRejected = collect();
                $appMadetoryDocRejected  = collect();
                $applicationDoc->map(function ($item) use ($appUploadedDocVerified, $appUploadedDocRejected, $appMadetoryDocRejected,$getUploadedDocList) {
                    $val = $getUploadedDocList->where("doc_type_id",$item->id)->whereNull("owner_detail_id")->first();
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
                if($role->id==13 && !$water->is_field_verify){
                    $workComplied=false;                    
                    $message = "Filed Verification Pending";
                }
                if($role->id==15 && !$water->is_utc_field_verify){
                    $workComplied=false;
                    $message = "Filed Verification Pending";
                }
            }
            // if($WfPermission->can_geotag){
            //     $geoTag = $water->getGeoTag()->get();
            //     if($geoTag->isEmpty()){
            //         $workComplied = false;
            //         $message = "GEO Tag Is Pending";
            //     }
            // }

        }
        return ["is_work_complied"=>$workComplied,"message"=>$message];
    }

    public function consumerMetaDataList(){
        return Consumer::from("consumers as app")                
                ->join("connection_type_masters as ctm", "ctm.id", "app.connection_type_id")
                ->join("property_type_masters as ptm", "ptm.id", "app.property_type_id")
                ->join("connection_through_masters as cthm", "cthm.id", "app.connection_through_id")
                ->join("ownership_type_masters as otm", "otm.id", "app.ownership_type_id")
                ->join(DB::raw("(
                    SELECT consumer_id,
                        STRING_AGG(owner_name, ',') AS owner_name,
                        STRING_AGG(guardian_name, ',') AS guardian_name,
                        STRING_AGG(CAST(mobile_no AS VARCHAR), ',') AS mobile_no
                    FROM consumer_owners
                    WHERE lock_status = false
                    GROUP BY consumer_id
                ) AS w"), "w.consumer_id", "=", "app.id")
                ->leftJoin(DB::raw("(
                    SELECT id, saf_no,'active' as app
                    FROM active_saf_details
                    WHERE lock_status = false
                    UNION
                    SELECT id, saf_no,'app' as app
                    FROM saf_details
                    WHERE lock_status = false
                ) AS saf"), "saf.id", "=", "app.saf_detail_id")
                ->join("ulb_ward_masters as wm", "wm.id", "=", "app.ward_mstr_id")
                ->leftJoin("ulb_ward_masters as wmn", "wmn.id", "=", "app.new_ward_mstr_id")
                ->leftJoin("property_details as pd", "pd.id", "app.property_detail_id")                
                ->where("app.lock_status",false)
                ->select("app.id",
                "app.consumer_no",
                "pd.new_holding_no",
                "saf.saf_no",
                "app.address",
                "app.category",
                "app.connection_date",
                "wm.ward_no",
                "wmn.ward_no as new_ward_no",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
            );
    }

    public function generateConsumerNo($waterId){
        $water = WaterActiveApplication::find($waterId);
        if(!$water){
            $water = WaterApplication::find($waterId);
        }
        
        $ward_no = $water->getWardOldWardNo()->ward_no??"";
        if(!$ward_no){
            $ward_no = $water->getWardNewdWardNo()->ward_no??"";
        }
        if ($water->connection_type_id == 1) {
            $usage_type_code = 'N';
        }else{  
            $usage_type_code = "R"; 
        }
        
        $serial_no = Consumer::where("ward_mstr_id",$water->ward_mstr_id)->where("ulb_id",$water->ulb_id)->count("id") + 1;
        $serial_no_pad = str_pad($serial_no, 6, "0", STR_PAD_LEFT);
        $ward_no = str_pad($ward_no, 3, "0", STR_PAD_LEFT);
        $consumer_no = $ward_no . $usage_type_code . $serial_no_pad ;
        while(Consumer::where('consumer_no', $consumer_no)->exists()){
                $serial_no ++;
                $serial_no_pad = str_pad($serial_no, 6, "0", STR_PAD_LEFT);
                $consumer_no = $ward_no . $usage_type_code . $serial_no_pad ;               
        }
        return $consumer_no ;
    }
}