<?php

namespace App\Http\Controllers\ShopRent;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ShopRentController extends Controller
{
    
    public function getShopRentMasterData(Request $request){
        try{
            $user = Auth()->user();
            $ulbId = $request->ulbId ? $request->ulbId : ($user->ulb_id??0);
            $occupancyTypeMaster = $this->_OccupancyTypeMaster->getOccupancyTypeList();
            $constructionTypeMaster = $this->_ConstructionTypeMaster->getConstructionTypeList();
            $floorMaster = $this->_FloorMaster->getFloorList();
            $ownershipTypeMaster = $this->_OwnershipTypeMaster->getOwnershipTypeList();
            $propertyTypeMaster = $this->_PropertyTypeMaster->getPropertyTypeList();
            $roadTypeMaster = $this->_RoadTypeMaster->getRoadTypeList();
            $transferModeMaster = $this->_TransferModeMaster->getTransferModeList();
            $usageTypeMaster  = $this->_UsageTypeMaster->getUsageTypeList();
            $ulbWardMaster = $this->_UlbWardMaster->getNumericWardList($ulbId);
            $electricityType = Config::get('PropertyConstant.ELECTRIC_CATEGORY');
            $zoneType = $this->_ZoneMaster->getZoneList();
            $applicationType = [
                "NIGAM","ZONE"
            ];
            $fyearList = collect(FyListdesc(null,"1986"))->map(function($item){
                return ["fromDate"=>Carbon::parse(FyearQutFromDate($item,1))->format("Y-m"),"uptoDate"=>Carbon::parse(FyearQutUptoDate($item,4))->format("Y-m"),"fyear"=>$item];
            });

            $waterFacility = $this->_WaterConnectionFacilityType->getWaterFacilityList();
            $waterTax = $this->_WaterTaxType->getWaterTaxList()->map(function($item){
                $item->tax_type = $item->tax_type." @ ".$item->amount;
                return $item;
            });

            $data=[
                "applicationType"=>$applicationType,
                "wardList"=>$ulbWardMaster,
                "ownershipType"=>$ownershipTypeMaster,
                "propertyType"=>$propertyTypeMaster,
                "roadType"=>$roadTypeMaster,
                "transferMode"=>$transferModeMaster,
                "occupancyType"=>$occupancyTypeMaster,
                "constructionType"=>$constructionTypeMaster,
                "floorType"=>$floorMaster,
                "usageType"=>$usageTypeMaster,
                "electricityType"=>$electricityType,
                "zoneType"=>$zoneType,
                "fyearList"=>$fyearList,
                "waterFacility"=>$waterFacility,
                "waterTax"=>$waterTax,
            ];
            return responseMsg(true,"Property Master Data",camelCase(remove_null($data)));
        }
        catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    
}
