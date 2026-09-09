<?php

use Carbon\Carbon;

return [
    "PROPERTY_TYPE"=>[
        "1"=>"SUPER STRUCTURE"
    ],
    "RULE_SETS"=>[
        "BuildingRules1"=>[
            "is_building"=>true,
            "effective_from"=>explode("-",getFY(subtractYear(null,12)))[0]."-04-01",
            "effective_from_fyear"=>getFY(subtractYear(null,12)),
            "effective_upto"=>"2016-03-31",
            "effective_upto_fyear"=>getFY("2016-03-31"),
        ],
        "BuildingRules2"=>[
            "is_building"=>true,
            "effective_from"=>"2016-04-01",
            "effective_from_fyear"=>getFY("2016-04-01"),
            "effective_upto"=>"2022-03-31",
            "effective_upto_fyear"=>getFY("2022-03-31"),
        ],
        "BuildingRules3"=>[
            "is_building"=>true,
            "effective_from"=>"2022-04-01",
            "effective_from_fyear"=>getFY("2022-04-01"),
            "effective_upto"=>"2024-03-31",
            "effective_upto_fyear"=>getFY("2024-03-31"),
        ],
        "BuildingRules4"=>[
            "is_building"=>true,
            "effective_from"=>"2024-04-01",
            "effective_from_fyear"=>getFY("2024-04-01"),
            "effective_upto"=>explode("-",getFY(Carbon::now()->format("Y-m-d")))[1]."-03-31",
            "effective_upto_fyear"=>getFY(explode("-",getFY(Carbon::now()->format("Y-m-d")))[1]."-03-31"),
        ],
        "VacantRules1"=>[
            "is_building"=>false,
            "effective_from"=>"2016-04-01",
            "effective_from_fyear"=>getFY("2016-04-01"),
            "effective_upto"=>"2022-03-31",
            "effective_upto_fyear"=>getFY("2022-03-31"),
        ],
        "VacantRules2"=>[
            "is_building"=>false,
            "effective_from"=>"2022-04-01",
            "effective_from_fyear"=>getFY("2022-04-01"),
            "effective_upto"=>explode("-",getFY(Carbon::now()->format("Y-m-d")))[1]."-03-31",
            "effective_upto_fyear"=>getFY(explode("-",getFY(Carbon::now()->format("Y-m-d")))[1]."-03-31"),
        ],
    ],
    "ACT_OF_LIMITATION"=>13, //EVERY YEAR INCREASED BY 1(TO TAKE DEMAND FROM 2013)
    "BIHAR_RULE_SETS"=>[
        "BuildingRules1"=>[
            "is_building"=>true,
            "effective_from"=>explode("-",getFY(subtractYear(null,13)))[0]."-04-01",
            "effective_from_fyear"=>getFY(subtractYear(null,13)),
            "effective_upto"=>explode("-",getFY(Carbon::now()->format("Y-m-d")))[1]."-03-31",
            "effective_upto_fyear"=>getFY(explode("-",getFY(Carbon::now()->format("Y-m-d")))[1]."-03-31"),
        ],
        "VacantRules1"=>[
            "is_building"=>false,
            "effective_from"=>explode("-",getFY(subtractYear(null,13)))[0]."-04-01",
            "effective_from_fyear"=>getFY(subtractYear(null,13)),
            "effective_upto"=>explode("-",getFY(Carbon::now()->format("Y-m-d")))[1]."-03-31",
            "effective_upto_fyear"=>getFY(explode("-",getFY(Carbon::now()->format("Y-m-d")))[1]."-03-31"),
        ],
    ],
    "ACTION_TYPE"=>[
        "BTC"=>2,
        "FORWARD"=>1,
        "BACKWARD"=>3,
        "APPROVED"=>5,
        "REJECT"=>4,
    ],
    "ZONE_TYPE"=>[
        [
            "id"=>1,
            "zone"=>"Zone 1",
        ],
        [
            "id"=>2,
            "zone"=>"Zone 2",
        ]
    ],
    "ELECTRIC_CATEGORY" => [
        "DS I/II/III",
        "NDS II/III", 
        "IS I/II", 
        "LTS", 
        "HTS"
    ]
];