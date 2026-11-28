<?php

namespace App\Trait\Lease;

use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Lease\AreaMaster;
use App\Models\Lease\LeaseStatusMaster;
use App\Models\Lease\UsageTypeMaster;

trait LeaseTrait
{
    public function adjustLeaseValue($lease){
        if(!$lease){
            return $lease;
        }
        $ulbDtl = UlbMaster::find($lease?->ulb_id);
        $oldWard = UlbWardMaster::find($lease?->ward_mstr_id);
        $usageTypeMater = UsageTypeMaster::find($lease?->uses_type_id);
        $areaMaster = AreaMaster::find($lease?->area_id);
        $leaseStatusType = LeaseStatusMaster::find($lease?->lease_status_id);
        
        $lease->ulb_name = $ulbDtl?->ulb_name??"";
        $lease->ward_no = $oldWard->ward_no??"";
        $lease->usage_type = $usageTypeMater->usage_type??"";
        $lease->area_name = $areaMaster->area_name??"";
        $lease->status_type = $leaseStatusType->status_type??"";
        return $lease;
    }
}
