<?php

namespace App\Bll\Water;

use App\Models\DBSystem\UlbMaster;
use App\Models\Property\PropertyDetail;
use App\Models\Water\Consumer;
use App\Models\Water\ConsumerOwner;
use App\Models\Water\MeterStatus;
use App\Models\Water\PropertyTypeMaster;
use App\Trait\Water\WaterTrait;
use Carbon\Carbon;
use Illuminate\Support\Facades\Config;

class ConsumerDemandReceiptBll
{
    use WaterTrait;

    public $_GRID;
    public $_ConsumerId;
    public $_Consumer;
    public $_UlbDetail;
    public $_Owners;
    public $_ConnectionDtl;
    public $_ConsumerDueBll;

    function __construct($consumerId)
    {
        $this->_ConsumerId = $consumerId;
        $this->_Consumer = Consumer::find($this->_ConsumerId);
        $this->_Consumer = $this->adjustValue($this->_Consumer);

        $this->_UlbDetail = UlbMaster::find($this->_Consumer->ulb_id);
        if ($this->_UlbDetail) {
            $this->_UlbDetail->logo_img = $this->_UlbDetail->logo_img ? url('/' . $this->_UlbDetail->logo_img) : "";
            $this->_UlbDetail->right_logo = url('/' . "UlbLogo/swachh_bharat.png");
            $this->_UlbDetail->watermark_base64 = $this->getImageBase64($this->_UlbDetail->water_mark_img);
        }

        $this->_Owners = collect((new ConsumerOwner())->where("consumer_id", $this->_ConsumerId)->where("lock_status", false)->get())->sortBy("id");
        $this->_ConnectionDtl = MeterStatus::find($this->_Consumer->meter_status_id);

        $this->_ConsumerDueBll = new ConsumerDueBll($this->_ConsumerId);
        $this->_ConsumerDueBll->getConsumerDue();
    }

    private function monthYear($date)
    {
        return $date ? Carbon::parse($date)->format("M-Y") : "";
    }

    public function generateReceipt()
    {
        $waterConstant = Config::get("WaterConstant");
        $demandGrid = $this->_ConsumerDueBll->_GRID;
        $demandList = collect($demandGrid["demandList"] ?? [])->sortBy("demand_upto")->values();
        $totalMonths = $demandList->count();
        $isMetered = $this->_ConnectionDtl && $this->_ConnectionDtl->meter_type_id == $waterConstant["CONNECTION_TYPE"]["Meter"];

        $fromReading = null;
        $currentReading = null;
        $units = null;
        if ($isMetered && $totalMonths) {
            $fromReading = $demandList->first()->from_reading;
            $currentReading = $demandList->last()->current_meter_reading;
            $units = roundFigure($currentReading - $fromReading);
        }

        $propertyId = "";
        if ($this->_Consumer->property_detail_id) {
            $propertyId = PropertyDetail::find($this->_Consumer->property_detail_id)?->new_holding_no ?? "";
        }

        $lastReading = $this->_ConnectionDtl?->getLastReading();

        $this->_GRID = [
            "description" => "WATER USER CHARGE DEMAND",
            "department" => "Revenue Section",
            "accountDescription" => "Water User Charge & Others",
            "isMetered" => $isMetered,
            "connectionType" => $isMetered ? "METERED" : "NON-METER",
            "propertyType" => $this->_Consumer->property_type ?? "",
            "printDate" => Carbon::now()->format("d-m-Y"),
            "wardNo" => $this->_Consumer->ward_no ?? "N/A",
            "propertyId" => $propertyId,
            "holdingNo" => $propertyId,
            "consumerNo" => $this->_Consumer->consumer_no ?? "",
            "ownerName" => $this->_Owners->implode("owner_name", ", "),
            "mobileNo" => $this->_Owners->implode("mobile_no", ", "),
            "address" => $this->_Consumer->address ?? "",
            "demandFrom" => $this->monthYear($demandGrid["fromDate"] ?? null),
            "demandUpto" => $this->monthYear($demandGrid["uptoDate"] ?? null),
            "fromReading" => $fromReading,
            "currentReading" => $currentReading,
            "units" => $units,
            "periodMonths" => $totalMonths,
            "rate" => $totalMonths ? roundFigure(($demandGrid["demandAmount"] ?? 0) / $totalMonths) : 0,
            "demandAmount" => $demandGrid["demandAmount"] ?? 0,
            "penalty" => $demandGrid["latePenalty"] ?? 0,
            "payableAmount" => $demandGrid["payableAmount"] ?? 0,
            "lastMeterReadingDate" => $lastReading?->created_at,
            "watermark" => $this->_UlbDetail?->watermark_base64,
            "ulbDtl" => $this->_UlbDetail,
        ];
    }
}
