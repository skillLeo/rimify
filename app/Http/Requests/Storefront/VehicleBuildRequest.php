<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Domain\Fitment\Data\RowFilter;
use App\Domain\Fitment\Data\VehicleBuild;
use App\Models\Vehicle;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * The body style and drive the owner gives for a car whose data has none (the operator's last prompt §1.1):
 * one of the body styles and drives the engine knows, either or both. The same request forgets them (DELETE, no
 * fields). The policy is asked on every call (R-11), as for 8.1, 8.2 and T.
 */
class VehicleBuildRequest extends FormRequest
{
    protected $errorBag = 'aufbau';

    public function authorize(): bool
    {
        return Gate::allows('enterPapers', $this->vehicle());
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        if ($this->isMethod('DELETE')) {
            return [];
        }

        return [
            'body_form' => ['nullable', 'required_without:drive_axle', 'string', Rule::in(RowFilter::BODY_FORMS)],
            'drive_axle' => ['nullable', 'required_without:body_form', 'string', Rule::in(RowFilter::DRIVE_AXLES)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'body_form.required_without' => 'Wähl die Karosserieform oder die Antriebsart deines Fahrzeugs.',
            'drive_axle.required_without' => 'Wähl die Karosserieform oder die Antriebsart deines Fahrzeugs.',
            'body_form.in' => 'Wähl eine der gezeigten Karosserieformen.',
            'drive_axle.in' => 'Wähl eine der gezeigten Antriebsarten.',
        ];
    }

    public function vehicle(): Vehicle
    {
        $vehicle = $this->route('vehicle');

        abort_unless($vehicle instanceof Vehicle, 404);

        return $vehicle;
    }

    /** Validated, so never null. */
    public function build(): VehicleBuild
    {
        $body = $this->validated('body_form');
        $drive = $this->validated('drive_axle');
        $build = VehicleBuild::tryFrom(is_string($body) ? $body : null, is_string($drive) ? $drive : null);

        abort_if($build === null, 422);

        return $build;
    }
}
