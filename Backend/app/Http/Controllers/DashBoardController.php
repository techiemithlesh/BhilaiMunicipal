<?php

namespace App\Http\Controllers;

use App\Exceptions\CustomException;
use App\Http\Controllers\Property\ReportController;
use App\Http\Controllers\Trade\ReportController as TradeReportController;
use Exception;
use Illuminate\Http\Request;

class DashBoardController extends Controller
{
    /**
     * create date : 2025-08-13
     * status : open
     */

    private $_PropertyReportController;
    private $_TradeReportController;

    function __construct()
    {
        $this->_PropertyReportController = new ReportController();
        $this->_TradeReportController = new TradeReportController();
    }

    public function holdingDemandCollectionCurrentYear(Request $request){
        try{ 
            $request->merge(["all"=>true]);
            $propResponse = $this->_PropertyReportController->wardWiseDcb($request); 
            if(!$propResponse->original["status"]){
                return $propResponse;
            } 
            $response = collect($propResponse->original["data"]["summary"]??[]);
            return responseMsg(true,"Holding Demand Collection Due",camelCase(remove_null($response)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

    public function appliedSafCurrentYear(Request $request){
        try{ 
            $fyear = $request->fyear??getFY();
            list($fromDate,$uptoDate) = FyearFromUptoDate($fyear);
            $request->merge(["all"=>true,"fromDate"=>$fromDate,"uptoDate"=>$uptoDate]);

            $propResponse = $this->_PropertyReportController->wardWiseAppliedList($request); 
            if(!$propResponse->original["status"]){
                return $propResponse;
            } 
            $response = collect($propResponse->original["data"]["summary"]??[]);
            return responseMsg(true,"Applied Saf",camelCase(remove_null($response)));
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }
        catch(Exception $e){
            return responseMsg(false,"Internal Server Error","");
        }
    }

}
