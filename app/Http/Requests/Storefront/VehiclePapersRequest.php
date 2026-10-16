<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Domain\Fitment\Data\PapersFigures;
use App\Domain\Fitment\Data\PapersIndex;
use App\Models\Vehicle;
use Closure;
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
            // P.2, optional: asked where the vehicle data has no power, for a Gutachten's kW band (Block D).
            'power_kw' => ['nullable', 'integer', 'between:'.PapersFigures::POWER_MIN_KW.','.PapersFigures::POWER_MAX_KW],
            // 15.1 and 15.2, optional and together: the tyre the papers name per axle, `225/45 R17 91W` (D-242).
            'index_front' => ['nullable', 'string', 'max:40', 'required_with:index_rear', self::readable('15.1')],
            'index_rear' => ['nullable', 'string', 'max:40', 'required_with:index_front', self::readable('15.2')],
        ];
    }

    /** A field 15.1 or 15.2 whose index and symbol cannot be read is refused in words, never half read. */
    private static function readable(string $field): Closure
    {
        return static function (string $attribute, mixed $value, Closure $fail) use ($field): void {
            if (is_string($value) && trim($value) !== '' && PapersIndex::parse($value) === null) {
                $fail("Trag aus Feld {$field} die Reifenangabe so ein, wie sie dort steht – zum Beispiel 225/45 R17 91W. Wir brauchen die Zahl und den Buchstaben am Ende.");
            }
        };
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
            'power_kw.integer' => 'Bitte nur die Zahl in kW, ohne Punkt und Komma.',
            'power_kw.between' => 'Die Leistung liegt zwischen 10 und 1.000 kW. Sieh bitte noch einmal in Feld P.2 nach – die erste Zahl vor dem Schrägstrich.',
            'index_front.required_with' => 'Trag auch Feld 15.1 ein – vorn und hinten gehören zusammen, auch wenn beide gleich sind.',
            'index_rear.required_with' => 'Trag auch Feld 15.2 ein – vorn und hinten gehören zusammen, auch wenn beide gleich sind.',
            'index_front.max' => 'Diese Angabe ist zu lang. Feld 15.1 sieht so aus: 225/45 R17 91W.',
            'index_rear.max' => 'Diese Angabe ist zu lang. Feld 15.2 sieht so aus: 225/45 R17 91W.',
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
        $power = $this->validated('power_kw');
        $front = PapersIndex::parse((string) ($this->validated('index_front') ?? ''));
        $rear = PapersIndex::parse((string) ($this->validated('index_rear') ?? ''));

        $figures = PapersFigures::tryFrom(
            (int) $this->validated('axle_front_kg'),
            (int) $this->validated('axle_rear_kg'),
            (int) $this->validated('top_speed_kmh'),
            $power === null || $power === '' ? null : (int) $power,
            $front === null || $rear === null ? null : PapersIndex::tryFrom($front[0], $front[1], $rear[0], $rear[1]),
        );

        abort_if($figures === null, 422);

        return $figures;
    }
}
