<?php

namespace App\Rules\Trade;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class LicenseYearsDependsOnHolding implements ValidationRule
{
    protected $holdingNo;

    public function __construct($holdingNo)
    {
        $this->holdingNo = $holdingNo;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($this->holdingNo) && intval($value) !== 1) {
            $fail('If Holding Number is not provided, only a 1-year license is allowed.');
        }

    }
}
