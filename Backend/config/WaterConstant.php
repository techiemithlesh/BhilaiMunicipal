<?php

return [
    "CONNECTION_TYPE"=>[
        "Meter"=>1,
        "Fixed"=>2,
    ],
    "distributedPipelineType"=>[
        "CI",
        "DI",
    ],
    "permittedPipeDiameter"=>[
        "15",
        "20",
        "25",
    ],
    "permittedPipeQuality"=>[
        "GI",
        "HDPE",
        "PVC 80",
    ],
    "roadType"=>[
        "RMC",
        "PWD"
    ],
    "TS_MAP"=>[
        [
            "id"=>1,
            "name"=>"Map Without Road Cutting",
            "img"=>trim(env('APP_URL', 'http://localhost'),'\\/')."/WaterTsMap/1.png",
        ],
        [
            "id"=>2,
            "name"=>"Map With Road Cutting",
            "img"=>trim(env('APP_URL', 'http://localhost'),'\\/')."/WaterTsMap/2.png",
        ],
    ]
];