<?php

namespace App\Models\SWM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsumerConnection extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "consumer_id",
        "date_of_effective",
        "user_id",
        "doc_path",
        "ref_unique_no",
        "lock_status",
    ];

    public function connectionDetails()
    {
        return $this->hasMany(ConnectionDetail::class, 'consumer_connection_id')
            ->where('lock_status', false)
            ->with([
                'category:id,category_type',
                'subCategory:id,sub_category_type',
            ]);
    }

}
