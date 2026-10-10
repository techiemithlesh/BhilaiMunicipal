<?php

namespace App\Http\Controllers\ShopRent;

use App\Http\Controllers\Controller;
use App\Models\ShopRent\AreaMaster;
use App\Models\ShopRent\ParamModel;
use App\Models\ShopRent\ShopTypeMaster;
use Illuminate\Support\Facades\DB;

class MasterController extends Controller
{
    /**
     * Created By Mithlesh Patel
     * Date 2026-10-10
     * Status : Open
     */

    private $conn;
    private $areaList;
    private $shopTypeList;

    public function __construct(){
       $this->conn =(new ParamModel())->resolveDynamicConnection();
       $this->areaList = new AreaMaster();
       $this->shopTypeList = new ShopTypeMaster();
    }

    public function index()
    {
        
        $areaList = $this->getAreaList();
        $shopTypeList = $this->getShopTypeList();
        return response()->json([
            "status" => true,
            "message" => "Shop Rent Master Data",
            "data" => [
                'areaList' => $areaList,
                'shopTypeList' => $shopTypeList,
            ]
        ]);
    }

    public function getAreaList(){
        $area = $this->areaList->getAreaList();
        return $area;
    }

    public function getShopTypeList(){
        $shopType = $this->shopTypeList->getShopTypeList();
        return $shopType;
    }

}
