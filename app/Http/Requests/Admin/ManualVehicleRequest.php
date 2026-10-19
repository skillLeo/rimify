<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\Vehicle;
use App\Services\Admin\Approvals\DocumentConditions;
use App\Support\EgNumber;
use App\Support\VehicleName;
use Carbon\CarbonImmutable;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Fahrzeuge › Neues Fahrzeug (his admin items 1 and 3, D-296): a car typed by hand from its Zulassungsbescheinigung
 * Teil I — maker and trade name (D.1, D.3), variant and the maker's Fahrzeugtyp (D.2), HSN and TSN (2.1, 2.2), field K
 * — the EG type-approval number the Gutachten name cars by, or on an older car its national ABE number —, the power
 * (P.2), the build window, body and drive, and the figures for its tyres: the axle loads (8.1, 8.2) and, where the
 * person has it, the top speed (T).
 *
 * The same car twice is refused by the key the import keeps its cars apart with: HSN, TSN and variant (VehicleImport).
 * The figures for the tyres may be left empty — the form says what that costs before it saves (R-03); a figure typed
 * the way a German writes it, `1.160`, is read past its dot.
 */
class ManualVehicleRequest extends FormRequest
{
    /**
     * `06.2014` — the month and the year, as the papers and the documents print a build window; `06,2014` too, as a
     * phone's decimal keypad types it.
     */
    public const MONTH = '/^(0?[1-9]|1[0-2])[.,\/](\d{4})$/';

    /** The first year a build window may name; the last is two years ahead — a model announced, never a typo's 2041. */
    public const FIRST_YEAR = 1900;

    /**
     * Field K on an older car: a national ABE number of letters and digits — `A 333`, as the vehicle datasets carry them
     * (`A333*`). Kept as typed; only an EG type-approval number (EgNumber) is ever matched to a Gutachten by the merge.
     */
    public const NATIONAL_ABE = '/^[A-Z]{1,3} ?\d{1,6}(?:\*\d{0,4})?$/i';

    public const FIELD_K_REFUSED = 'So sieht Feld K nicht aus. Eine EG-Typgenehmigungsnummer beginnt mit e und der Länderziffer, etwa e1*2007/46*0316*12; bei älteren Fahrzeugen steht dort eine nationale ABE-Nummer aus Buchstaben und Ziffern, etwa A 333.';

    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('create', Vehicle::class);
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        foreach (['axle_load_front_kg', 'axle_load_rear_kg', 'max_speed_kmh', 'power_kw'] as $key) {
            $value = $this->input($key);

            if (is_string($value) && preg_match('/^\s*\d{1,3}(?:[.\s\x{00A0}\x{202F}]\d{3})+\s*$/u', $value) === 1) {
                $merge[$key] = (string) preg_replace('/\D/', '', $value);
            }
        }

        // Every space goes, pasted or typed — ` 0005` is 0005, never a cut-off `000` padded to 0000.
        foreach (['hsn', 'tsn'] as $key) {
            if (is_string($this->input($key))) {
                $merge[$key] = mb_strtoupper((string) preg_replace('/[\s\x{00A0}\x{202F}]+/u', '', (string) $this->input($key)));
            }
        }

        // `005` is padded, never taken as typed: `005` and `0005` would be two manufacturers (Vehicle::hsn()).
        if (isset($merge['hsn']) && preg_match('/^\d{1,3}$/', $merge['hsn']) === 1) {
            $merge['hsn'] = str_pad($merge['hsn'], 4, '0', STR_PAD_LEFT);
        }

        $this->merge($merge);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'make' => ['required', 'string', 'max:60'],
            'model' => ['required', 'string', 'max:80'],
            'variant' => ['required', 'string', 'max:80'],
            'type_designation' => ['nullable', 'string', 'max:32'],
            'hsn' => ['required', 'string', 'regex:/^\d{4}$/'],
            'tsn' => ['required', 'string', 'regex:/^[0-9A-Z]{3}$/'],
            'eg_number' => ['required', 'string', 'max:64', static function (string $attribute, mixed $value, Closure $fail): void {
                $printed = trim((string) $value);

                if (preg_match(EgNumber::PATTERN, $printed) !== 1 && preg_match(self::NATIONAL_ABE, $printed) !== 1) {
                    $fail(self::FIELD_K_REFUSED);
                }
            }],
            'power_kw' => ['required', 'integer', 'min:10', 'max:1000'],
            'build_from' => ['required', 'string', 'regex:'.self::MONTH],
            'build_to' => ['nullable', 'string', 'regex:'.self::MONTH],
            'body_form' => ['nullable', 'string', Rule::in(DocumentConditions::BODY_FORMS)],
            'drive_axle' => ['nullable', 'string', Rule::in(array_values(array_diff(DocumentConditions::DRIVES, ['Allradlenkung'])))],
            'axle_load_front_kg' => ['nullable', 'integer', 'min:300', 'max:5000'],
            'axle_load_rear_kg' => ['nullable', 'integer', 'min:300', 'max:5000'],
            'max_speed_kmh' => ['nullable', 'integer', 'min:40', 'max:420'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'make.required' => 'Trag den Hersteller ein (Feld D.1).',
            'model.required' => 'Trag die Handelsbezeichnung ein (Feld D.3).',
            'variant.required' => 'Trag die Variante ein – so, wie Kunden das Fahrzeug in der Auswahl finden, etwa 320i Limousine.',
            'hsn.required' => 'Trag die HSN ein (Feld 2.1).',
            'hsn.regex' => 'Die HSN hat vier Ziffern, mit führenden Nullen: 0005.',
            'tsn.required' => 'Trag die TSN ein: die ersten drei Zeichen aus Feld 2.2.',
            'tsn.regex' => 'Die TSN sind die ersten drei Zeichen aus Feld 2.2 – Ziffern oder Buchstaben, etwa AFD.',
            'eg_number.required' => 'Trag die Nummer aus Feld K ein.',
            'power_kw.required' => 'Trag die Leistung in kW ein (Feld P.2, die erste Zahl).',
            'power_kw.*' => 'Die Leistung bitte als ganze Zahl in kW, zwischen 10 und 1.000 (Feld P.2).',
            'build_from.required' => 'Trag ein, ab wann das Fahrzeug in dieser Variante gebaut wird: Monat und Jahr, etwa 06.2014.',
            'build_from.regex' => 'Bitte Monat und Jahr, etwa 06.2014.',
            'build_to.regex' => 'Bitte Monat und Jahr, etwa 03.2019 – oder leer, wenn es noch gebaut wird.',
            'body_form.in' => 'Wähl eine Karosserie aus der Liste oder „Nicht angegeben“.',
            'drive_axle.in' => 'Wähl einen Antrieb aus der Liste oder „Nicht angegeben“.',
            'axle_load_front_kg.*' => 'Die Achslast vorn bitte in Kilogramm, zwischen 300 und 5.000 (Feld 8.1).',
            'axle_load_rear_kg.*' => 'Die Achslast hinten bitte in Kilogramm, zwischen 300 und 5.000 (Feld 8.2).',
            'max_speed_kmh.*' => 'Die Höchstgeschwindigkeit bitte in km/h, zwischen 40 und 420 (Feld T).',
            '*.max' => 'Das ist zu lang: höchstens :max Zeichen.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            [$from, $to] = [$this->month('build_from', false), $this->month('build_to', true)];
            $last = CarbonImmutable::now()->year + 2;

            foreach (['build_from' => $from, 'build_to' => $to] as $field => $month) {
                if ($month !== null && ($month->year < self::FIRST_YEAR || $month->year > $last)) {
                    $validator->errors()->add($field, 'Bitte ein Jahr zwischen '.self::FIRST_YEAR.' und '.$last.'.');

                    return;
                }
            }

            if ($from !== null && $to !== null && $to->lt($from)) {
                $validator->errors()->add('build_to', 'Das Bauende liegt vor dem Baubeginn.');

                return;
            }

            $twin = $this->twin();

            // A removed car is kept (R-04) and holds its key: said as removed, since no list shows it any more.
            if ($twin !== null) {
                $validator->errors()->add('variant', $twin->trashed()
                    ? 'Ein entferntes Fahrzeug hat schon diese HSN, TSN und Variante: '.VehicleName::from($twin).'. Gib eine eigene Variante an.'
                    : 'Ein Fahrzeug mit dieser HSN, TSN und Variante gibt es schon: '.VehicleName::from($twin).'. Ist es ein anderes Fahrzeug, gib eine eigene Variante an.');
            }
        });
    }

    /** The car the import would take for this one: the same HSN, TSN and variant — a removed one included (R-04). */
    public function twin(): ?Vehicle
    {
        return Vehicle::withTrashed()
            ->where('hsn', str_pad((string) $this->validated('hsn'), 4, '0', STR_PAD_LEFT))
            ->where('tsn', mb_strtoupper((string) $this->validated('tsn')))
            ->where('variant', trim((string) $this->validated('variant')))
            ->first();
    }

    /**
     * The car as the row stores it.
     *
     * @return array{make: string, model: string, variant: string, type_designation: string|null, hsn: string, tsn: string, eg_nummer_raw: string, power_kw: int, build_from: string, build_to: string|null, body_form: string|null, drive_axle: string|null, axle_load_front_kg: int|null, axle_load_rear_kg: int|null, max_speed_kmh: int|null}
     */
    public function car(): array
    {
        $text = fn (string $key): ?string => ($value = trim((string) ($this->validated($key) ?? ''))) === '' ? null : $value;
        $int = fn (string $key): ?int => $this->validated($key) === null ? null : (int) $this->validated($key);

        return [
            'make' => (string) $text('make'),
            'model' => (string) $text('model'),
            'variant' => (string) $text('variant'),
            'type_designation' => $text('type_designation'),
            'hsn' => str_pad((string) $text('hsn'), 4, '0', STR_PAD_LEFT),
            'tsn' => mb_strtoupper((string) $text('tsn')),
            'eg_nummer_raw' => (string) $text('eg_number'),
            'power_kw' => (int) $int('power_kw'),
            'build_from' => (string) $this->month('build_from', false)?->toDateString(),
            'build_to' => $this->month('build_to', true)?->toDateString(),
            'body_form' => $text('body_form'),
            'drive_axle' => $text('drive_axle'),
            'axle_load_front_kg' => $int('axle_load_front_kg'),
            'axle_load_rear_kg' => $int('axle_load_rear_kg'),
            'max_speed_kmh' => $int('max_speed_kmh'),
        ];
    }

    /** A month as the window stores it: its first day for the start, its last for the end (R-02: an empty end is still built). */
    private function month(string $key, bool $end): ?CarbonImmutable
    {
        $value = trim((string) ($this->input($key) ?? ''));

        if (preg_match(self::MONTH, $value, $m) !== 1) {
            return null;
        }

        $first = CarbonImmutable::create((int) $m[2], (int) $m[1], 1);

        return $end ? $first->endOfMonth()->startOfDay() : $first;
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        abort_unless($user instanceof AdminUser, 403);

        return $user;
    }
}
