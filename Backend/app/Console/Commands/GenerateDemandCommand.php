<?php

namespace App\Console\Commands;

use App\Bll\Property\BiharTaxCalculator;
use App\Models\Property\PropertyDemand;
use Illuminate\Console\Command;
use App\Models\Property\PropertyDetail;
use App\Models\Property\PropertyTax;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GenerateDemandCommand extends Command
{
    // This is what you will type in the terminal
    protected $signature = 'demand:generate'; 
    protected $description = 'Generates property demands for the current financial year';

    private function begin(){
        DB::connection("pgsql_property")->beginTransaction();
    }
    private function rollBack(){
        DB::connection("pgsql_property")->rollBack();
    }
    private function commit(){
        DB::connection("pgsql_property")->commit();
    }

    public function handle()
    {
        $this->info("Starting Demand Generation...");

        // Ensure getFY() exists or use a fallback
        $currentFY =  getFY() ;

        DB::connection("pgsql_property")->enableQueryLog();

        $properties = PropertyDetail::select("property_details.id")
            ->leftJoin("property_demands", function($join) use ($currentFY) {
                $join->on("property_demands.property_detail_id", "property_details.id")
                     ->where("property_demands.lock_status", false)
                     ->where("property_demands.fyear", $currentFY);
            })
            ->where("property_details.lock_status", false)
            ->whereNull("property_demands.id")
            ->get();
        list($fromDate,$uptoDate) = FyearFromUptoDate();

        foreach($properties as $index=> $p){                
            $this->begin();
            try{
                $this->info("Generated======>> [".$index."] ====>>" . $p->id);   
                Log::info("Generated======>> [".$index."] ====>>" . $p->id);             
                $prop = PropertyDetail::find($p->id);
                $propFloor = $prop->getFloors();
                $request = new Request();
                if($prop->land_occupation_date){
                    $prop->land_occupation_date = $fromDate;
                }
                if($propFloor){
                    $propFloor = $propFloor->map(function($item) use($fromDate){
                        if(!$item->date_upto){
                            $item->date_from = $fromDate;
                        }elseif(Carbon::parse($item->date_upto)->gt($fromDate)){
                            $item->date_from = $fromDate;
                        }
                        return $item;
                    });
                }

                $saf = $prop;  
                $saf["floorDtl"] = camelCase($propFloor);
                $data = camelCase($saf)->toArray();
                $request->merge($data);
                $calCulator = new BiharTaxCalculator($request);
                $calCulator->calculateTax();
                
                $TAX = $calCulator->_GRID;
                $PropertyDemand = new PropertyDemand();
                $PropertyTax = new PropertyTax();
                foreach($TAX["RuleSetVersionTax"] as $Tax){
                    if(!$Tax["Fyearlytax"]) {
                        continue;
                    }              
                    $taxRequest = new Request($Tax);
                    $taxRequest->merge(["propertyDetailId"=>$p->id]);            
                    $firstFyear = collect($Tax["Fyearlytax"])->max("fyear");
                    $minYearTax = collect($Tax["Fyearlytax"])->where("fyear",$firstFyear)->first();
                    $fromQtr = collect($minYearTax["quarterly"])->min("qtr");
                }
                    
                // deactivate demand upto last
                $PropertyDemand
                    ->where("property_detail_id",$p->id)
                    ->where("paid_status",false)
                    ->where("fyear",">",$currentFY)
                    ->update(["lock_status"=>true]);

                $lastPaidUpto = PropertyDetail::find($p->id)?->demand_paid_upto;
                $paidFy = $paidQtr = null;

                if($lastPaidUpto){
                    $paidFy  = getFy($lastPaidUpto);
                    $paidQtr = getQtr($lastPaidUpto);
                }

                // generate new demand
                foreach($TAX["RuleSetVersionTax"] as $Tax){ 
                    if(!$Tax["Fyearlytax"]) {
                        continue;
                    }                
                    $taxRequest = new Request($Tax);
                    $taxRequest->merge(["propertyDetailId"=>$p->id]);            
                    $minFyear = collect($Tax["Fyearlytax"])->max("fyear");
                    $minYearTax = collect($Tax["Fyearlytax"])->where("fyear",$minFyear)->first();
                    $minQtr = collect($minYearTax["quarterly"])->min("qtr");
                    $taxRequest->merge(["Fyear"=>$minFyear,"Qtr"=>$minQtr]);
                    $taxId = $PropertyTax->store($taxRequest);
                    foreach($Tax["Fyearlytax"] as $yearTax){
                        if($yearTax["fyear"]!=$currentFY){
                            continue;
                        }
                        $qtrTax = $yearTax["quarterly"];
                        if ($paidFy) {
                            $qtrTax = collect($yearTax['quarterly'])
                                ->filter(function ($item) use ($paidFy, $paidQtr) {
                                    return $item['fyear'] > $paidFy || ($item['fyear'] == $paidFy && $item['qtr'] > $paidQtr);
                                })
                                ->values()   
                                ->toArray();
                        }
                        foreach($qtrTax as $quarterlyTax){
                            $newDemandRequest = new Request($quarterlyTax);
                            $newDemandRequest->merge(["propertyDetailId"=>$p->id,"propertyTaxId"=>$taxId,"wardMstrId"=>$request->wardMstrId]);                        
                            $demandId = $PropertyDemand->store($newDemandRequest);                    
                        }

                    }
                    
                }
                $this->commit();
            }catch(Exception $e){
                $this->rollBack();
                $this->warn("error=>".$e->getMessage());
            }

        }

        $this->info("Process Completed.");
    }

}