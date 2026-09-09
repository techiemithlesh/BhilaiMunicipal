<?php

namespace App\Models\DBSystem;

use App\Trait\Loggable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParamModel extends Model
{
    use HasFactory,Loggable;
    protected $guarded = [];
    protected $connection = "pgsql";

    public static function readConnection()
    {
        $self = new static; //OBJECT INSTANTIATION
        return $self->setConnection($self->connection."::read");
    }

    public static function editDirty($request)
    {
        $model = new static;
        $inputs = snakeCase($request)->only($model->getFillable())->toArray(); // use getFillable() safely
        $model->fill($inputs);
        return $model; // caller will decide when to save

    }
}
