<?php

namespace App\Http\Requests\Property;

use Carbon\Carbon;

class RequestTaxCalculator extends RequestTaxReview
{
    /**
     * Same payload as the SAF tax review, without owner details and property address.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();

        foreach (array_keys($rules) as $key) {
            if ($key === "ownerDtl" || str_starts_with($key, "ownerDtl.")) {
                unset($rules[$key]);
            }
        }

        unset(
            $rules["propAddress"],
            $rules["propCity"],
            $rules["propDist"],
            $rules["propPinCode"],
            $rules["propState"]
        );

        $rules["villageMaujaName"] = "nullable";
        $rules["appartmentDetailsId"] = "nullable";
        $rules["landOccupationDate"] = "nullable|required_if:propTypeMstrId,4|date|date_format:Y-m-d|before_or_equal:" . Carbon::now()->format("Y-m-d");

        return $rules;
    }
}
