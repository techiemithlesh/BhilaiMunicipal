<?php

namespace App\Models\Water;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentList extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "doc_type_id",
        "doc_name",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }
}
