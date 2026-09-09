<?php

namespace App\Models\Trade;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocTypeMaster extends ParamModel
{
    use HasFactory;

    public function getDocList(){
        return $this->hasMany(DocumentList::class,"doc_type_id","id")->where("lock_status",false);
    }
}
