<?php

namespace App\Models\DBSystem;

use Exception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class UlbWardMaster extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "ulb_id",
        "ward_no",
        "lock_status",
    ];

    private $_cashKey = "WARD_LIST";

    protected $hidden = [
        'prop_sam_counter_sequence',
        'prop_fam_counter_sequence',
    ];

    private function cashingData(){
        $wardList = self::where("lock_status",false)->get();
        Redis::set($this->_cashKey,$wardList);  
        return json_encode($wardList);
    }

    public function getWardList(int $ulbId){
        $wardList  = json_decode(Redis::get($this->_cashKey));
        if(!$wardList){
            $wardList = json_decode($this->cashingData());        
        }
        return collect($wardList)->where("ulb_id",$ulbId);
    }

    public function getNumericWardList(int $ulbId){
        $numericWardList = collect($this->getWardList($ulbId))->filter(function ($item) {
            return is_numeric($item->ward_no) && (int)$item->ward_no == $item->ward_no;
        })->sortBy("ward_no")->values();
        return collect($numericWardList);
    }

    public function getNewWardByOldWard(){
        return $this->hasManyThrough(UlbWardMaster::class,OldWardNewWardMap::class,"old_ward_id","id","id","new_ward_id")
            ->where((new OldWardNewWardMap())->getTable().".lock_status",false)
            ->get();
    }

    public function store($request){
        $inputs = snakeCase($request);
        $ward= self::create($inputs->all());
        $this->cashingData();
        return $ward->id;
    }

    public function edit($request){
        $inputs = snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $returnData= $model->update($inputs->all());
        $this->cashingData();
        return $returnData;
    }

    public function getUlb(){
        return $this->belongsTo(UlbMaster::class,"ulb_id","id");
    }

    public function WardSamCounter($id){
        try{
            (DB::connection($this->connection)->statement("ALTER TABLE ".$this->gettable()." ADD COLUMN IF NOT EXISTS prop_sam_counter_sequence text "));            
            $test = self::select("*")
                    ->where("id",$id)
                    ->first();
            if(!$test->prop_sam_counter_sequence)
            {
                
                (DB::connection($this->connection)->statement("CREATE SEQUENCE IF NOT EXISTS ward_id_".$id."_sam_sequence"));
                $test->prop_sam_counter_sequence = "ward_id_".$id."_sam_sequence";
                $test->update();
            }
            return self::select(DB::raw("nextval('".$test->prop_sam_counter_sequence."') AS counter"))->first();
        }
        catch(Exception $e)
        {
            // return $e->getMessage();
        }

    }
    public function WardFamCounter($id){
        try{
            (DB::connection($this->connection)->statement("ALTER TABLE ".$this->gettable()." ADD COLUMN IF NOT EXISTS prop_fam_counter_sequence text "));
            $test = self::select("*")
                    ->where("id",$id)
                    ->first();
            if(!$test->prop_fam_counter_sequence)
            {
                
                (DB::connection($this->connection)->statement("CREATE SEQUENCE IF NOT EXISTS ward_id_".$id."_sam_sequence"));
                $test->prop_fam_counter_sequence = "ward_id_".$id."_sam_sequence";
                $test->update();
            }
            return self::select(DB::raw("nextval('".$test->prop_fam_counter_sequence."') AS counter"))->first();
        }
        catch(Exception $e)
        {
            // return $e->getMessage();
        }

    }
}
