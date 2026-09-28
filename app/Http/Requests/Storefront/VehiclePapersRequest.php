<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Domain\Fitment\Data\PapersFigures;
use App\Models\Vehicle;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

/**
 * The three figures from the customer's Zulassungsbescheinigung Teil I for one car: 8.1, 8.2 and T
 * (Block C, item 10). Each is a whole number inside the range a road car can have — 99.999 kg is refused
 * here, in words, and never reaches a verdict (the second review of C9, §5). The same request removes
 * them (DELETE, no fields). The policy is asked on every call (R-11).
 */
class VehiclePapersRequest extends FormRequest
{
    protected $errorBag = 'papiere';

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

        $axle = ['required', 'integer', 'between:'.PapersFigures::AXLE_MIN_KG.','.PapersFigures::AXLE_MAX_KG];

        return [
            'axle_front_kg' => $axle,
            'axle_rear_kg' => $axle,
            'top_speed_kmh' => ['required', 'integer', 'between:'.PapersFigures::SPEED_MIN_KMH.','.PapersFigures::SPEED_MAX_KMH],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        $axle = static fn (string $field): array => [
            'required' => "Trag die zulässige Achslast aus Feld {$field} ein.",
            'integer' => 'Bitte nur die Zahl in Kilogramm, ohne Punkt und Komma.',
            'between' => "Eine zulässige Achslast liegt zwischen 300 und 4.000 kg. Sieh bitte noch einmal in Feld {$field} nach.",
        ];

        $messages = [];

        foreach (['axle_front_kg' => '8.1', 'axle_rear_kg' => '8.2'] as $key => $field) {
            foreach ($axle($field) as $rule => $text) {
                $messages["{$key}.{$rule}"] = $text;
            }
        }

        return [
            ...$messages,
            'top_speed_kmh.required' => 'Trag die Höchstgeschwindigkeit aus Feld T ein.',
            'top_speed_kmh.integer' => 'Bitte nur die Zahl in km/h, ohne Punkt und Komma.',
            'top_speed_kmh.between' => 'Eine Höchstgeschwindigkeit liegt zwischen 60 und 420 km/h. Sieh bitte noch einmal in Feld T nach.',
        ];
    }

    public function vehicle(): Vehicle
    {
        $vehicle = $this->route('vehicle');

        abort_unless($vehicle instanceof Vehicle, 404);

        return $vehicle;
    }

    /** Validated, so never null: the rules and PapersFigures hold the same ranges. */
    public function figures(): PapersFigures
    {
        $figures = PapersFigures::tryFrom(
            (int) $this->validated('axle_front_kg'),
            (int) $this->validated('axle_rear_kg'),
            (int) $this->validated('top_speed_kmh'),
        );

        abort_if($figures === null, 422);

        return $figures;
    }
}
