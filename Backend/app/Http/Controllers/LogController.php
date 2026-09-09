<?php

namespace App\Http\Controllers;

use App\Exceptions\CustomException;
use App\Models\ModelLog;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LogController extends Controller
{
    //

    function __construct()
    {
        
        
    }

    public function getLogsByToken(Request $request)
    {
        try{   

            $token = $request->query('token');

            $logs = ModelLog::where('token', $token)
                ->orderBy('created_at')
                ->get();

            return responseMsg(true,"Dtl Of Query","");
        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"server Error","");
        }
        
    }

    public function getAppChangesLogsToken(Request $request){
        try{
            $data = ModelLog::select(
                DB::raw("
                        model_logs.token,
                        count(case when model_logs.is_revert!=true then model_logs.id end ) as pending, 
                        count(case when model_logs.is_revert=true then model_logs.id end ) as total_reverted, 
                        max(model_logs.created_at) as row_created_at,
                        count(model_logs.id) as total_count,
                        model_logs.user_type,
                        MAX(COALESCE(users.name, citizens.name)) AS user_name,
                        model_logs.ip_address,
                        model_logs.url,
                        MAX(model_logs.payload::text) AS payload,
                        MAX(model_logs.response_body::text) AS response_body,
                        STRING_AGG(DISTINCT model_logs.model_type, ',') AS model_type,
                        STRING_AGG(DISTINCT (concat(model_logs.model_table,'===>',model_logs.action)), ',') AS model_table
                    ")
                )
                ->leftJoin('users', function ($join) {
                    $join->on('users.id', '=', 'model_logs.user_id')
                        ->where('model_logs.user_type', '=', 'users');
                })
                ->leftJoin('citizens', function ($join) {
                    $join->on('citizens.id', '=', 'model_logs.user_id')
                        ->where('model_logs.user_type', '!=', 'users');
                })->groupBy(
                    'model_logs.token',
                    'model_logs.user_type',
                    'model_logs.ip_address',
                    'model_logs.url'
                )
                ->orderByDesc('model_logs.token')
                ->orderByDesc('row_created_at'); 
            $list = paginator($data,$request);
            $list["data"]=collect($list["data"])->map(function($item){
                $item->payload = json_decode($item->payload,true);
                $item->response_body = json_decode($item->response_body,true);
                $item->model_table = collect(explode(',',$item->model_table));
                return $item;
            });
            return responseMsg(true,"Log List",remove_null(camelCase($list)));

        }catch(CustomException $e){
            return responseMsg(false,$e->getMessage(),"");
        }catch(Exception $e){
            return responseMsg(false,"server Error","");
        }
    }

}
