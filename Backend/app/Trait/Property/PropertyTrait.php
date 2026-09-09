<?php
namespace App\Trait\Property;

use App\Bll\Common;
use App\Models\DBSystem\RoleTypeMstr;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\DBSystem\WorkflowMaster;
use App\Models\DBSystem\WorkflowUlbRoleMap;
use App\Models\Property\ActiveSafDetail;
use App\Models\Property\ApartmentDetail;
use App\Models\Property\ConstructionTypeMaster;
use App\Models\Property\DocTypeMaster;
use App\Models\Property\DocumentList;
use App\Models\Property\FloorMaster;
use App\Models\Property\GeotagDetail;
use App\Models\Property\OccupancyTypeMaster;
use App\Models\Property\OwnershipTypeMaster;
use App\Models\Property\PropertyDetail;
use App\Models\Property\PropertyTypeMaster;
use App\Models\Property\RejectedSafDetail;
use App\Models\Property\RoadTypeMaster;
use App\Models\Property\SafDetail;
use App\Models\Property\SwmCategoryTypeMaster;
use App\Models\Property\SwmSubCategoryTypeMaster;
use App\Models\Property\TransferModeMaster;
use App\Models\Property\UsageTypeMaster;
use App\Models\Property\WaterConnectionFacilityType;
use App\Models\Property\WaterTaxType;
use App\Models\Property\ZoneMaster;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

trait PropertyTrait{
    
    public function getHoldingType($request){
        $holding_type = "";
		if ($request->propTypeMstrId == 4) {
			if ($request->ownershipTypeMstrId == 1) {
				$holding_type = "PURE_RESIDENTIAL";
			} elseif (in_array($request->ownershipTypeMstrId,[6,7,8,9])) {
				$holding_type = "PURE_GOVERNMENT";
			} elseif (in_array($request->ownershipTypeMstrId,[3,4,5,10,11,12,13,14,15])) {
				$holding_type = "PURE_COMMERCIAL";
			}
		} else {
			$RESIDENCIAL = false;
			$COMMERCIAL = false;
			$GOVERNMENT = false;
			foreach ($request->floorDtl as $floor) {
				if ($floor['usageTypeMasterId'] == 1) {
					$RESIDENCIAL = true;
				} elseif (in_array($floor['usageTypeMasterId'],[7,9])) {
					$GOVERNMENT = true;
				} else {
					$COMMERCIAL = true;
				}
			}

			if ($RESIDENCIAL == true && $GOVERNMENT == false && $COMMERCIAL == false) {
				$holding_type = "PURE_RESIDENTIAL";
			} else if ($RESIDENCIAL == false && $GOVERNMENT == false && $COMMERCIAL == true) {
				$holding_type = "PURE_COMMERCIAL";
			} else if ($RESIDENCIAL == false && $GOVERNMENT == true && $COMMERCIAL == false) {
				$holding_type = "PURE_GOVERNMENT";
			} else if (($RESIDENCIAL == true || $COMMERCIAL == true) && $GOVERNMENT == true) {
				$holding_type = "MIX_GOVERNMENT";
			} else if ($RESIDENCIAL == true && $GOVERNMENT == false && $COMMERCIAL == true) {
				$holding_type = "MIX_COMMERCIAL";
			}
		}
        return $holding_type;
    }

    public function getZone($zoneId){
        $zone = ZoneMaster::find($zoneId);
        return $zone?->zone_name;
        if($zoneId==1){
            return "Zone 1";
        }
        if($zoneId==2){
            return "Zone 2";
        }
    }

    public function adjustSafValue($saf){
        if(!$saf){
            return $saf;
        }
        $ulbDtl = UlbMaster::find($saf?->ulb_id);
        $transferModeMaster = TransferModeMaster::find($saf?->transfer_mode_mstr_id);
        $oldWard = UlbWardMaster::find($saf?->ward_mstr_id);
        $newWard = UlbWardMaster::find($saf?->new_ward_mstr_id);
        $ownershipTypeMaster = OwnershipTypeMaster::find($saf?->ownership_type_mstr_id);
        $propertyTypeMaster = PropertyTypeMaster::find($saf?->prop_type_mstr_id);
        $apartments = ApartmentDetail::find($saf?->appartment_details_id);
        $roadType = RoadTypeMaster::find($saf?->road_type_mstr_id);
        $waterConnectionFacilityType = WaterConnectionFacilityType::find($saf?->water_connection_facility_type_id);
        $waterTaxType = WaterTaxType::find($saf?->water_tax_type_id);
        $saf->zone = $this->getZone($saf?->zone_mstr_id);
        $saf->roadType = $roadType?->road_type;
        $saf->ulb_name = $ulbDtl?->ulb_name??"";
        $saf->transfer_mode = $transferModeMaster->transfer_mode??"";
        $saf->ward_no = $oldWard->ward_no??"";
        $saf->new_ward_no = $newWard->ward_no??"";
        $saf->ownership_type = $ownershipTypeMaster->ownership_type??"";
        $saf->property_type = $propertyTypeMaster->property_type??"";
        $saf->apartment_name = $apartments ? (($apartments->apartment_name??"")."( ". $apartments->apt_code.")") : "" ;
        $saf->water_connection_facility_type = $waterConnectionFacilityType?->facility_type;
        $saf->water_tax_type = $waterTaxType ? $waterTaxType?->tax_type." @ ".$waterTaxType->amount : "";
        return $saf;
    }

    public function adjustFloorValue($floor){
        $floor = collect($floor);
        $floor = ($floor)->map(function($val){
            $floorTypeMaster = new FloorMaster();
            $usageTypeMaster = new UsageTypeMaster();
            $constructionTypeMaster = new ConstructionTypeMaster();
            $occupancyTypeMaster = new OccupancyTypeMaster();
            $val->floor_name = $floorTypeMaster->where("id",$val->floor_master_id)->first()->floor_name??"";
            $val->usage_type = $usageTypeMaster->where("id",$val->usage_type_master_id)->first()->usage_type??"";
            $val->construction_type = $constructionTypeMaster->where("id",$val->construction_type_master_id)->first()->construction_type??"";
            $val->occupancy_name = $occupancyTypeMaster->where("id",$val->occupancy_type_master_id)->first()->occupancy_name??"";
            return $val;
        });
        return $floor;
    }

    public function getSafStatus_old($id){
        $status = "";
        $saf = ActiveSafDetail::find($id);
        if(!$saf){
            $saf=SafDetail::find($id);
        }if(!$saf){
            $saf=RejectedSafDetail::find($id);
        }
        if($saf->getTable()=="saf_details"){
            $role = RoleTypeMstr::find($saf->current_role_id);
            $status="Application Approved ";
            if($role){
                $status.=" By ".$role->role_name??""." On ".$saf->saf_approved_date;
            }
        }
        elseif($saf->saf_pending_status == 1){
            $status ="Application Approved";
        }elseif($saf->is_btc){
            $role = RoleTypeMstr::find($saf->current_role_id);
            $status ="Application Back To Citizen ".($role ? "From ".$role->role_name??"" : " ");
        }elseif(!$saf->payment_status && !$saf->is_doc_upload){
            $status ="Payment Not Done And Document Not Uploaded";
        }elseif($saf->payment_status && !$saf->is_doc_upload){
            $role = RoleTypeMstr::find($saf->current_role_id);
            $status ="Payment Done But Document Not Uploaded ";
        }elseif(!$saf->payment_status && $saf->is_doc_upload){
            $role = RoleTypeMstr::find($saf->current_role_id);
            $status ="Document Uploaded But Payment Not Done";
        }else{
            $role = RoleTypeMstr::find($saf->current_role_id);
            $status ="Application Pending At ".($role ? $role->role_name : "");
        }
        return $status;
    }

    public function getSafStatus($id){
        $status = "";
        $saf = ActiveSafDetail::find($id);
        if(!$saf){
            $saf=SafDetail::find($id);
        }if(!$saf){
            $saf=RejectedSafDetail::find($id);
        }
        if($saf->getTable()=="saf_details"){
            $role = RoleTypeMstr::find($saf->current_role_id);
            $status="Application Approved ";
            if($role){
                $status.=" By ".$role->role_name??""." On ".$saf->saf_approved_date;
            }
        }
        elseif($saf->saf_pending_status == 1){
            $status ="Application Approved";
        }elseif($saf->is_btc){
            $role = RoleTypeMstr::find($saf->current_role_id);
            $status ="Application Back To Citizen ".($role ? "From ".$role->role_name??"" : " ");
        }elseif(!$saf->is_doc_upload && !$saf->skip_tc_level){
            $status ="Document Not Uploaded";
        }else{
            $role = RoleTypeMstr::find($saf->current_role_id);
            $status ="Application Pending At ".($role ? $role->role_name : "");
        }
        return $status;
    }

    
    public function metaDataList(){
        return ActiveSafDetail::where("active_saf_details.lock_status",false)
                ->leftJoin(DB::raw("(
                    select saf_detail_id, string_agg(owner_name,',') AS owner_name, 
                        string_agg(guardian_name,',') AS guardian_name,
                        string_agg(mobile_no::text,',') AS mobile_no
                    from active_saf_owner_details
                    where lock_status = false
                    group by saf_detail_id
                )owners"),"owners.saf_detail_id","active_saf_details.id")
                ->leftJoin("ulb_ward_masters","ulb_ward_masters.id","active_saf_details.ward_mstr_id")
                ->leftJoin("property_type_masters","property_type_masters.id","active_saf_details.prop_type_mstr_id")
                ->select("active_saf_details.id","active_saf_details.saf_no","active_saf_details.assessment_type",
                    "active_saf_details.apply_date",
                    "current_role_id","initiator_role_id","finisher_role_id","max_level_attempt",
                    "ulb_ward_masters.ward_no",
                "prop_address","property_type_masters.property_type","owners.*");
    }

    public function testWorks($safId,$roleId=null){
        $user = Auth()->user();
        $workComplied = true;
        $message ="";
        $saf = ActiveSafDetail::find($safId);
        if($saf){
            $role = $user->getRoleDetailsByUserId()->first(); 
            if($roleId){
                $role = RoleTypeMstr::find($roleId);
            }
            $workflowMater = WorkflowMaster ::find($saf->workflow_id);
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
                $requiredDocList = $this->getRequiredDocList($saf);
                $getUploadedDocList = $saf->getDocList()->get();
                $applicationDoc = collect($requiredDocList["appDoc"]??[]);
                $ownerDoc = collect($requiredDocList["ownerDoc"]??[]);

                $appMandetoryDoc = $applicationDoc->where("is_madetory", true);

                $appUploadedDocVerified = collect();
                $appUploadedDocRejected = collect();
                $appMadetoryDocRejected  = collect();
                $applicationDoc->map(function ($item) use ($appUploadedDocVerified, $appUploadedDocRejected, $appMadetoryDocRejected,$getUploadedDocList) {
                    $val = $getUploadedDocList->where("doc_type_id",$item->id)->whereNull("saf_owner_detail_id")->first();
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
                if($role->id==5 && !$saf->is_field_verify){
                    $workComplied=false;                    
                    $message = "Filed Verification Pending";
                }
                if($role->id==7 && !$saf->is_utc_field_verify){
                    $workComplied=false;
                    $message = "Filed Verification Pending";
                }
            }
            if($WfPermission->can_geotag && !$roleId){
                $geoTag = $saf->getGeoTag()->get();
                if($geoTag->isEmpty()){
                    $workComplied = false;
                    $message = "GEO Tag Is Pending";
                }
            }

        }
        return ["is_work_complied"=>$workComplied,"message"=>$message];
    }

    public function testAllDocUpload($saf){
        $requiredDocList = $this->getRequiredDocList($saf);
        $getUploadedDocList = $saf->getDocList()->get();
        $applicationDoc = collect($requiredDocList["appDoc"]??[]);
        $ownerDoc = collect($requiredDocList["ownerDoc"]??[]);

        $appMandetoryDoc = $applicationDoc->where("is_madetory", true);

        $appUploadedDocVerified = collect();
        $appUploadedDocRejected = collect();
        $appMadetoryDocRejected  = collect();
        $applicationDoc->map(function ($item) use ($appUploadedDocVerified, $appUploadedDocRejected, $appMadetoryDocRejected,$getUploadedDocList) {
            $val = $getUploadedDocList->where("doc_type_id",$item->id)->whereNull("saf_owner_detail_id")->first();
            $appUploadedDocVerified->push(["is_docVerify" => ($val ?  ($val->verified_status ? true : false) : true)]);
            $appUploadedDocRejected->push(["is_docRejected" => ($val ?  ($val->verified_status == 2 ? true : false) : false)]);
            if ($item->is_madetory) {
                $appMadetoryDocRejected->push(["is_docRejected" => ($val ?  ($val->verified_status == 2 ? true : false) : false)]);
            }
        });
        $is_appUploadedDocRejected          = $appUploadedDocRejected->where("is_docRejected", true);
        
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
        $is_ownerUploadedDoc            = $Wdocuments->where("is_uploded", false);
        $is_ownerDocRejected            = $Wdocuments->where("is_docRejected", true);
        $workComplied = (empty($is_ownerUploadedDoc->all()) && empty($is_ownerDocRejected->all()) && empty($is_appMandUploadedDoc->all()) && empty($is_appUploadedDocRejected->all()));
        return $workComplied;
        
    }

    public function getRequiredDocList($saf){
        $docList = [];
        $commonClass = new Common;
        $user = Auth()->user();
        if($saf->prop_type_mstr_id==1)	// super structure
		{
			$docList[]='flat_doc';
		}

		if($saf->no_electric_connection) // if electric conn N/A
		{
			$docList[]='no_elect_connection';
		}

		if($saf->assessment_type=="Mutation")
		{
			$docList[]='transfer_mode';
		}
        if(!$user || $commonClass->checkUsersWithtocken("citizens")){
            $docList[]='saf_form';
        }        
        $docList[]='other';
        $lists = DocTypeMaster::whereIn("doc_type",$docList)->where("lock_status",false)->get();
        $uploadedDoc = $saf->getDocList()->whereNull("saf_owner_detail_id")->get();
        $lists = $lists->map(function($item)use($uploadedDoc){
            $testDoc = collect($uploadedDoc)->where("doc_type_id",$item->id)->sortByDesc("id")->first();
            $item->doc_code = Str::title(implode(" ",explode("_",$item->doc_type))); 
            $item->list = $item->getDocList()->get();
            $item->doc_list_names = $item->list->implode("doc_name",",");
            $item->uploaded_doc_name = $testDoc ? $testDoc["doc_name"] : "";
            $item->uploaded_doc = $testDoc ? url("/documents")."/".$testDoc["doc_path"]:"";
            return $item;
        });
        return["appDoc"=>$lists,"ownerDoc"=>$this->getOwnerDocList($saf)];
    }

    public function getOwnerDocList($saf){
        $owners = $saf->getOwners();
        $lists = $owners->map(function($item){
            $docList=[];
            $docList[] = "applicant_image";
            if($item->is_armed_force){
                // $docList[] = "armed_force_document";
            } 
            if($item->is_specially_abled){
                // $docList[] = "handicaped_document";
            }
            if($item->gender=="Other"){
                // $docList[] = "gender_document";
            }
            if($item->dob && Carbon::parse($item->dob)->diffInYears(Carbon::now())>=60){
                // $docList[] = "dob_document";
            }
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
    
    public function adjustSafWithVerification($saf,$verification){
        $saf->zone_mstr_id = $verification->zone_mstr_id;
        $saf->ward_mstr_id = $verification->ward_mstr_id;
        $saf->new_ward_mstr_id = $verification->new_ward_mstr_id;
        $saf->prop_type_mstr_id = $verification->prop_type_mstr_id;
        $saf->road_type_mstr_id = $verification->road_type_mstr_id;
        $saf->road_width = $verification->road_width;
        $saf->area_of_plot = $verification->area_of_plot;
        $saf->builtup_area = $verification->builtup_area;
        $saf->appartment_details_id = $verification->appartment_details_id;
        $saf->colony_mstr_id = $verification->colony_mstr_id;
        $saf->flat_registry_date = $verification->flat_registry_date;
        $saf->hasAttribute("percentage_of_property_transfer") ? $saf->percentage_of_property_transfer = $verification->percentage_of_property_transfer : "";
        $saf->is_mobile_tower = $verification->is_mobile_tower;
        $saf->tower_area = $verification->tower_area;
        $saf->tower_installation_date = $verification->tower_installation_date;
        $saf->is_hoarding_board = $verification->is_hoarding_board;
        $saf->hoarding_area = $verification->hoarding_area;
        $saf->hoarding_installation_date = $verification->hoarding_installation_date;
        $saf->is_petrol_pump = $verification->is_petrol_pump;
        $saf->under_ground_area = $verification->under_ground_area;
        $saf->petrol_pump_completion_date = $verification->petrol_pump_completion_date;
        $saf->is_water_harvesting = $verification->is_water_harvesting;
    }
    public function adjustSafFloorWithVerificationFloor($floor,$verification){
        $floor->floor_master_id = $verification->floor_master_id;
        $floor->usage_type_master_id = $verification->usage_type_master_id;
        $floor->construction_type_master_id = $verification->construction_type_master_id;
        $floor->occupancy_type_master_id = $verification->occupancy_type_master_id;
        $floor->builtup_area = $verification->builtup_area;
        $floor->carpet_area = $verification->carpet_area;
        $floor->date_from = $verification->date_from;
        $floor->date_upto = $verification->date_upto;
    }

    public function generateHoldingNo($safId){
        $saf = ActiveSafDetail::find($safId);
        if(!$saf){
            $saf = SafDetail::find($safId);
        }
        if(!$saf){
            $saf = PropertyDetail::find($safId);
        }
        $floor = $saf->getFloors();
        $count_usage_type = $floor->unique("usage_type_master_id")??collect();
        $property = PropertyDetail::find($saf->previous_holding_id);
        
        $ward_no = $saf->getWardOldWardNo()->ward_no??"";
        if(!$ward_no){
            $ward_no = $saf->getWardNewdWardNo()->ward_no??"";
        }
        if ($saf->prop_type_mstr_id == 4) {
            $usage_type_code = 'Z';
        }elseif($floor->count("id")>1){
                $usage_type_code = 'X';
        }else{            
            $usage_type = $floor->first()->getUsageType();
            $usage_type_code = $usage_type->usage_code??""; 
        }

        if ($saf->prop_type_mstr_id == 4) {
            $const_type_code = '0';
        }elseif(in_array($saf->prop_type_mstr_id,[2,3]) && $count_usage_type->count()>1) { 
                $const_type_code = '4';
        }elseif(in_array($saf->prop_type_mstr_id,[2,3])){
            $const_type_code = $floor->first()->construction_type_master_id??"7";
        }elseif (in_array($saf->prop_type_mstr_id,[1,5]) && $count_usage_type->count()>1) {
                $const_type_code = '8';
        }elseif(in_array($saf->prop_type_mstr_id,[1,5])){
            $first = $floor->first();
            if ($first->const_type_mstr_id??"" == 1) {
                $const_type_code = '5';
            }elseif($first->const_type_mstr_id??"" == 2) {
                $const_type_code = '6';
            }
            else{
                $const_type_code = '7';
            }
        }else{
            $const_type_code = '1';
        }

        $sub_holding_no = '000';
        if ($saf->assessment_type == "Mutation") {
            $previous_holding_id = $saf->previous_holding_id;
            $activeSafCount = ActiveSafDetail::where("previous_holding_id",$previous_holding_id)
                        ->count("id");
            $safCount = SafDetail::where("previous_holding_id",$previous_holding_id)
                        ->count("id");
            $rejectSafCount = RejectedSafDetail::where("previous_holding_id",$previous_holding_id)
                        ->count("id");            
            $sub_holding_no = $activeSafCount+$safCount+$rejectSafCount;
            $sub_holding_no = str_pad($sub_holding_no, 3, "0", STR_PAD_LEFT);
        }
        
        $serial_no = PropertyDetail::where("ward_mstr_id",$saf->ward_mstr_id)->where("ulb_id",$saf->ulb_id)->count("id") + 1;
        $serial_no_pad = str_pad($serial_no, 4, "0", STR_PAD_LEFT);
        $ward_no = str_pad($ward_no, 3, "0", STR_PAD_LEFT);
        $road_type = '000';
        if ($saf->assessment_type == "Reassessment"){            
            if (!$property->new_holding_no) {
                $road_type = "000";
                $sub_holding_no = '000';
            }
        }
        $generated_holding_no = $ward_no . $road_type . $serial_no_pad . $sub_holding_no . $usage_type_code . $const_type_code;
        while(PropertyDetail::where('new_holding_no', $generated_holding_no)->exists()){
                $serial_no ++;
                $serial_no_pad = str_pad($serial_no, 4, "0", STR_PAD_LEFT);
                $generated_holding_no = $ward_no . $road_type . $serial_no_pad . $sub_holding_no . $usage_type_code . $const_type_code;                
        }
        return $property && $property->new_holding_no && (!in_array($saf->assessment_type ,["New Assessment","Mutation"])) ? $property->new_holding_no : $generated_holding_no ;
    }

    public function adjustSWMConsumer($consumer){
        $occupancyType = OccupancyTypeMaster::find($consumer->occupancy_type_master_id);
        $categoryType = SwmCategoryTypeMaster::find($consumer->category_type_master_id);
        $subCategoryType = SwmSubCategoryTypeMaster::find($consumer->sub_category_type_master_id);
        $consumer->occupancy_type = $occupancyType?->occupancy_name;
        $consumer->category_type = $categoryType?->category_type;
        $consumer->sub_category_type = $subCategoryType?->sub_category_type;
        return $consumer;
    }

    public function floorResCommOtherUsage($usageTypeRateId){
        return $usageTypeRateId==1 ? "Resident" : ($usageTypeRateId==2?"Commercial":"Other");
    }
}