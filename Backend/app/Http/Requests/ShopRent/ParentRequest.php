<?php

namespace App\Http\Requests\ShopRent;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class ParentRequest extends FormRequest
{
    protected $_DB_CON_NAME;
    protected $_MODULE_ID;
    protected $_REF_TABLE;
    protected $_MODEL;
    protected $_MODEl_PARENT;


    protected $_CURRENT_DATE;
    protected $_CURRENT_DATE_TIME;
    protected $_REX_DATE_YYYY_MM_DD;
    protected $_REX_DATE_YYYY_MM;
    protected $_REX_ALPHA;
    protected $_REX_ALPHA_NUM;
    protected $_REX_ALPHA_NUM_SPACE;
    protected $_REX_ALPHA_SPACE;
    protected $_REX_ALPHA_NUM_DOT_SPACE;
    protected $_REX_ALPHA_NUM_OPS_DOT_MIN_COM_AND_SPACE_SL;
    protected $_REX_NUM_DOT;
    protected $_REX_APPLICATION_TYPE;
    protected $_REX_OWNER_NAME;
    protected $_REX_MOBILE_NO;
    protected $_APPLYCATION_TYPE ;
    protected $_ENG_MARATHI;
    public function __construct()
    {
        DB::enableQueryLog();
        DB::connection("pgsql_shop_rent")->enableQueryLog();

        $this->_DB_CON_NAME = DB::getName();
        $this->_MODULE_ID = Config::get('module-constants.SHOP_RENT_MODULE_ID');
        
        $this->_CURRENT_DATE                                = Carbon::now()->format('Y-m-d');
        $this->_CURRENT_DATE_TIME                           = Carbon::now()->format('Y-m-d H:i:s');
        $this->_REX_DATE_YYYY_MM_DD                         = "/^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))+$/i";
        $this->_REX_DATE_YYYY_MM                            = "/^([12]\d{3}-(0[1-9]|1[0-2]))+$/i";
        $this->_REX_ALPHA                                   = "/^[a-zA-Z]+$/i";
        $this->_REX_ALPHA_SPACE                             = "/^[a-zA-Z\s]+$/i";
        $this->_REX_ALPHA_NUM                               = "/^[a-zA-Z0-9-]+$/i";
        $this->_REX_ALPHA_NUM_SPACE                         = "/^[a-zA-Z0-9- ]+$/i";
        $this->_REX_ALPHA_NUM_DOT_SPACE                     = "/^[a-zA-Z0-9][a-zA-Z0-9\. \s]+$/i";
        $this->_REX_ALPHA_NUM_OPS_DOT_MIN_COM_AND_SPACE_SL  = "/^[a-zA-Z0-9][a-zA-Z0-9\'\.\-\,\&\s\/]+$/i";
        $this->_REX_NUM_DOT                                 = "/^\d+(?:\.\d+)+$/i";
        $this->_REX_OWNER_NAME                              = "/^([a-zA-Z0-9\.]+)(\s[a-zA-Z0-9\.\,\()']+)*$/i";
        $this->_REX_MOBILE_NO                               = "/[0-9]{10}/";
        $this->_ENG_MARATHI                                 = "/^[\p{Devanagari}]+$/u"; #"/^[A-Za-z0-9\x{0900}-\x{097F}\.|\-\/ ]+/gmi";      
        
    }
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            //
        ];
    }

    protected function failedValidation(Validator $validator)
    { 
        throw new HttpResponseException(
            response()->json(
                [
                    'status' => false,
                    'message' => 'The given data was invalid',
                    'errors' => $validator->errors()
                ], 
                200)
        );
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
