<?php

namespace App\Trait\SWM;

use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\SWM\CategoryTypeMaster;
use App\Models\SWM\Consumer;
use App\Models\SWM\ConsumerConnection;
use App\Models\SWM\ConsumerDemand;
use App\Models\SWM\SubCategoryTypeMaster;
use Illuminate\Support\Facades\DB;

trait ConsumerTrait
{    
    public function adjustValue($consumer){
        
        $ulbDtl = UlbMaster::find($consumer->ulb_id);
        $oldWard = UlbWardMaster::find($consumer->ward_mstr_id);
        $consumer->ulb_name = $ulbDtl->ulb_name??"";
        $consumer->ward_no = $oldWard->ward_no??"";
        return $consumer;
    }

    public function consumerMetaDataList(){
        return Consumer::from("consumers as app")  
                ->join(DB::raw("(
                    SELECT consumer_id,
                        STRING_AGG(owner_name, ',') AS owner_name,
                        STRING_AGG(guardian_name, ',') AS guardian_name,
                        STRING_AGG(CAST(mobile_no AS VARCHAR), ',') AS mobile_no
                    FROM consumer_owners
                    WHERE lock_status = false
                    GROUP BY consumer_id
                ) AS w"), "w.consumer_id", "=", "app.id")
                ->join("ulb_ward_masters as wm", "wm.id", "=", "app.ward_mstr_id")            
                ->where("app.lock_status",false)
                ->select("app.id",
                "app.consumer_no",
                "app.address",
                "holding_no",
                "wm.ward_no",
                "w.owner_name",
                "w.guardian_name",
                "w.mobile_no",
            );
    }

    public function getAllConnection($consumerId){
        $rows = ConsumerConnection::select([
                'cc.id as connection_id',
                "cc.consumer_id",
                'cc.effective_date',
                'cc.lock_status as connection_lock_status',
                'cd.id as detail_id',
                'cd.lock_status as detail_lock_status',
                'ctm.category_type',
                'sctm.sub_category_type',
            ])
            ->from('consumer_connections as cc')
            ->leftJoin('connection_details as cd', function ($join) {
                $join->on('cd.consumer_connection_id', '=', 'cc.id')
                    ->where('cd.lock_status', '=', false);
            })
            ->leftJoin('category_type_masters as ctm', 'ctm.id', '=', 'cd.category_type_master_id')
            ->leftJoin('sub_category_type_masters as sctm', 'sctm.id', '=', 'cd.sub_category_type_master_id')
            ->where('cc.consumer_id', $consumerId)
            ->orderBy('cc.effective_date', 'desc')
            
            ->get();

            // Group flat rows into parent connections containing array of connection details
            $allConnections = $rows->groupBy('connection_id')->map(function ($details, $connectionId) {
                $first = $details->first();
                return [
                    'id' => $connectionId,
                    'effective_date' => $first->effective_date,
                    'lock_status' => $first->connection_lock_status,
                    'connection_details' => $details->filter(fn ($r) => $r->detail_id !== null)->map(fn ($row) => [
                        'id' => $row->detail_id,
                        'category_type' => $row->category_type,
                        'sub_category_type' => $row->sub_category_type,
                        'lock_status' => $row->detail_lock_status,
                    ])->values(),
                ];
            })->values();
    }

    public function getRateCharges($consumerId)
    {
        $subQuery = ConsumerDemand::query()
            ->select('demand_from', 'rate')
            ->selectRaw('LAG(rate) OVER (ORDER BY demand_from) as prev_rate')
            ->where('consumer_id', $consumerId)
            ->where('lock_status', false);

        return ConsumerDemand::query()
            ->fromSub($subQuery, 'rate_changes')
            ->select('demand_from', 'rate')
            ->where(function ($query) {
                $query->whereNull('prev_rate')
                    ->orWhereColumn('rate', '!=', 'prev_rate');
            })
            ->orderBy('demand_from')
            ->get();
    }
}
