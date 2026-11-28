<?php

namespace App\Http\Requests\Lease;

use App\Http\Requests\ParentRequest;
use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\Lease\AreaMaster;
use App\Models\Lease\UsageTypeMaster;
use App\Models\Property\PropertyDetail;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

class AddLeaseRequest extends ParentRequest
{
    

    protected $_UlbWardMaster;
    protected $_UlbMaster;

    protected $_PropertyDetail;

    protected $_UsageTypeMater;
    protected $_AreaMaster;

    function __construct(){
            parent::__construct();
            $this->_UlbWardMaster = new UlbWardMaster();;
            $this->_UlbMaster = new UlbMaster();

            $this->_PropertyDetail = new PropertyDetail();

            $this->_UsageTypeMater = new UsageTypeMaster();  
            $this->_AreaMaster = new AreaMaster();       
    }

    public function rules(): array
    {
        $user = Auth()->user();
        $ulbId = $user ? $user->ulb_id : null;
        if(!$this->ulbId){
            $this->merge(["ulbId"=>$ulbId]);
        }
        $currentMonth = Carbon::now()->format('Y-m');
        $rules = [
            "ulbId" => "required|integer|exists:" . $this->_UlbMaster->getConnectionName() . "." . $this->_UlbMaster->getTable() . ",id",
            "holdingNo"=>[
                "nullable",
                function ($attribute, $value, $fail) {
                    $property = $this->_PropertyDetail->where("new_holding_no", $value)->where("lock_status",false)->where("ulb_id",$this->ulbId)->exists();
                    if (!$property) {
                        $fail("The {$attribute} is invalid.");
                    }
                },
            ],
            "wardMstrId"=>"required|exists:".$this->_UlbWardMaster->getConnectionName().".".$this->_UlbWardMaster->getTable().",id",
            "leaseRegNo"=>"required",
            "usesTypeId"=>"required|exists:".$this->_UsageTypeMater->getConnectionName().".".$this->_UsageTypeMater->getTable().",id,lock_status,false",
            "areaId"=>"required|exists:".$this->_AreaMaster->getConnectionName().".".$this->_AreaMaster->getTable().",id,lock_status,false",
            "yearlyRate"=>"required|numeric|min:0",
            "leaseDate"=>"required|date|date_format:Y-m-d|before_or_equal:".Carbon::now()->format('Y-m-d'),
            "leaseEndDate"=>"required|date|date_format:Y-m-d|after_or_equal:".Carbon::now()->format('Y-m-d'),
            "address"=>"required|min:5",
            "pinCode"=>"required|int|regex:/[0-9]{6}/", 
            "width"=>"required|numeric|min:0.1",
            "length"=>"required|numeric|min:0.1",
            "effectiveDate" => [
                "required",
                "date_format:Y-m",
                "before_or_equal:" . $currentMonth,
            ], 
            "document" =>[
                "required",
                "mimes:bmp,jpeg,jpg,png,pdf",
                fn ($attribute, $value, $fail) => $this->validateFileSize($attribute, $value, $fail),
            ], 

            "ownerDtl"=>"required|array",
            "ownerDtl.*.ownerName"=>"required",
            "ownerDtl.*.guardianName"=>"nullable",
            "ownerDtl.*.relationType"=>"nullable|required_with:ownerDtl.*.guardianName|in:S/O,D/O,W/O,C/O",
            "ownerDtl.*.mobileNo"=>"required|digits:10|regex:/[0-9]{10}/",
        ];
        return $rules;
    }

    protected function validateFileSize(string $attribute, $value, $fail): void
    {
        if ($value instanceof UploadedFile) {
            // PDF max size: 10MB (10240 KB), Images max size: 5MB (5120 KB)
            $isPdf = strtolower($value->getClientOriginalExtension()) === 'pdf' || $value->getMimeType() === 'application/pdf';
            $maxSize = $isPdf ? 10240 : 5120; 
            $maxSizeBytes = $maxSize * 1024; // Converted properly to bytes

            if ($value->getSize() > $maxSizeBytes) {
                $fail('The ' . $attribute . ' may not be greater than ' . $maxSize . ' kilobytes.');
            }
        }
    }
}
