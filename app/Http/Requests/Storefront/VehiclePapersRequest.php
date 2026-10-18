<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Domain\Fitment\Data\PapersFigures;
use App\Domain\Fitment\Data\PapersIndex;
use App\Domain\Fitment\Verdict\TyreCheck;
use App\Models\Vehicle;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * The figures from the customer's Zulassungsbescheinigung Teil I for one car: 8.1, 8.2 and T (Block C, item 10). Each
 * is a whole number inside the range a road car can have — 99.999 kg is refused here, in words, and never reaches a
 * verdict (the second review of C9, §5). They are text fields (D-290), so `1.160` is read as the German thousands it is.
 * The same request removes them (DELETE, no fields). The policy is asked on every call (R-11).
 *
 * The form asks only for what the answer is missing (D-291): the fields it was asked for (`asked`) must come, a figure
 * the shop already knows is shown and not sent, and something must come. What the form sends it sets — an emptied field
 * is no longer given —, and what it does not send stays as the customer gave it before (`figuresOver()`).
 */
class VehiclePapersRequest extends FormRequest
{
    protected $errorBag = 'papiere';

    /** Each figure the form may send, with the field of the papers it comes from. */
    private const FIGURES = ['axle_front_kg' => '8.1', 'axle_rear_kg' => '8.2', 'top_speed_kmh' => 'T', 'power_kw' => 'P.2'];

    public function authorize(): bool
    {
        return Gate::allows('enterPapers', $this->vehicle());
    }

    /** `1.160` is how a German writes 1160 kg: the thousands dot and spaces are read past, as in Fahrzeuge (VehicleRequest). */
    protected function prepareForValidation(): void
    {
        foreach (array_keys(self::FIGURES) as $key) {
            $value = $this->input($key);

            if (! is_string($value)) {
                continue;
            }

            $value = trim($value);
            $this->merge([$key => match (true) {
                $value === '' => null,
                preg_match('/^\d{1,3}(?:[.\s\x{00A0}]\d{3})+$/u', $value) === 1 => (string) preg_replace('/\D/', '', $value),
                default => $value,
            }]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        if ($this->isMethod('DELETE')) {
            return [];
        }

        $axle = ['nullable', 'integer', 'between:'.PapersFigures::AXLE_MIN_KG.','.PapersFigures::AXLE_MAX_KG];

        return [
            // What the answer waits for, as the form was asked it: those fields must come (D-291).
            'asked' => ['nullable', 'array'],
            'asked.*' => [Rule::in(TyreCheck::PAPERS_FIELDS)],
            'axle_front_kg' => [Rule::requiredIf(fn (): bool => $this->asks('8.1')), ...$axle],
            'axle_rear_kg' => [Rule::requiredIf(fn (): bool => $this->asks('8.2')), ...$axle],
            'top_speed_kmh' => [Rule::requiredIf(fn (): bool => $this->asks('T')), 'nullable', 'integer', 'between:'.PapersFigures::SPEED_MIN_KMH.','.PapersFigures::SPEED_MAX_KMH],
            // P.2, optional: asked where the vehicle data has no power, for a Gutachten's kW band (Block D).
            'power_kw' => ['nullable', 'integer', 'between:'.PapersFigures::POWER_MIN_KW.','.PapersFigures::POWER_MAX_KW],
            // 15.1 and 15.2, optional and together: the tyre the papers name per axle, `225/45 R17 91W` (D-242).
            'index_front' => ['nullable', 'string', 'max:40', 'required_with:index_rear', self::readable('15.1')],
            'index_rear' => ['nullable', 'string', 'max:40', 'required_with:index_front', self::readable('15.2')],
        ];
    }

    /**
     * Something must come: a save with every field empty is refused where the form can show it — on the first field it
     * sent —, never kept as nothing. Emptying them all is „Werte löschen“.
     *
     * @return list<Closure(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($this->isMethod('DELETE') || $validator->errors()->isNotEmpty()) {
                return;
            }

            foreach ([...array_keys(self::FIGURES), 'index_front', 'index_rear'] as $key) {
                if ($this->filled($key)) {
                    return;
                }
            }

            $first = array_values(array_filter(array_keys(self::FIGURES), fn (string $key): bool => $this->exists($key)))[0] ?? 'axle_front_kg';
            $validator->errors()->add($first, $this->messages()["{$first}.required"]);
        }];
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
            'integer' => 'Bitte nur die ganze Zahl in Kilogramm, zum Beispiel 1.160.',
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
            'top_speed_kmh.integer' => 'Bitte nur die ganze Zahl in km/h, zum Beispiel 250.',
            'top_speed_kmh.between' => 'Eine Höchstgeschwindigkeit liegt zwischen 60 und 420 km/h. Sieh bitte noch einmal in Feld T nach.',
            'power_kw.required' => 'Trag die Leistung aus Feld P.2 ein – die erste Zahl vor dem Schrägstrich.',
            'power_kw.integer' => 'Bitte nur die ganze Zahl in kW, zum Beispiel 110.',
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

    /** Whether the form asked for this field of the papers — what the answer is missing (D-291). */
    private function asks(string $field): bool
    {
        $asked = $this->input('asked');

        return is_array($asked) && in_array($field, $asked, true);
    }

    /**
     * The figures sent, laid over the ones the customer gave before for this car: a field the form sent sets its figure,
     * emptied or not; one it did not send — the shop knew it, or the answer did not ask — stays as it was. Validated, so
     * never null: the rules and PapersFigures hold the same ranges, and something came.
     */
    public function figuresOver(?PapersFigures $earlier): PapersFigures
    {
        $int = function (string $key): ?int {
            $value = $this->validated($key);

            return $value === null || $value === '' ? null : (int) $value;
        };

        $index = $earlier?->index;

        if ($this->exists('index_front') || $this->exists('index_rear')) {
            $front = PapersIndex::parse((string) ($this->validated('index_front') ?? ''));
            $rear = PapersIndex::parse((string) ($this->validated('index_rear') ?? ''));
            $index = $front === null || $rear === null ? null : PapersIndex::tryFrom($front[0], $front[1], $rear[0], $rear[1]);
        }

        $figures = PapersFigures::tryFrom(
            $this->exists('axle_front_kg') ? $int('axle_front_kg') : $earlier?->axleFrontKg,
            $this->exists('axle_rear_kg') ? $int('axle_rear_kg') : $earlier?->axleRearKg,
            $this->exists('top_speed_kmh') ? $int('top_speed_kmh') : $earlier?->topSpeedKmh,
            $this->exists('power_kw') ? $int('power_kw') : $earlier?->powerKw,
            $index,
        );

        abort_if($figures === null, 422);

        return $figures;
    }
}
