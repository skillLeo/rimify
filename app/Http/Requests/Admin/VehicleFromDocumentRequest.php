<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\VehicleSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Vehicle;
use App\Services\Admin\Approvals\DocumentConditions;
use App\Support\EgNumber;
use App\Support\VehicleName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * „Fahrzeug aus diesem Gutachten anlegen“ (Block C, item 7): the car exactly as the document names it —
 * maker, trade name, the maker's Fahrzeugtyp, the EG type-approval number as printed, body style and drive
 * where the document says them, and the page. No HSN and no TSN: the documents never print them, and none
 * is made up. Only while the document is a draft, by someone who may edit it (R-11).
 *
 * The same car twice is refused: an EG number and a Fahrzeugtyp that a car already carries under the same
 * name name that car, and the person is sent to it (twin()). Two cars a document keeps apart under one
 * approval — BMW X3 and X4 — are two; the later merge then leaves the choice to a person
 * (docs/specs/vehicles-and-tyres.md, C8).
 *
 * The number is taken as printed, in any form (D-521). In the EU form it is what the later merge joins the car on, as
 * before. In any other form — an old national number, an ABE number — nothing joins on it, ever: the person is told so
 * and either picks the stored car from the search above (HSN/TSN or name) or says, with `ohne_eu_format`, that the car
 * is to be stored as the document names it.
 */
class VehicleFromDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $document = $this->route('document');

        return $user instanceof AdminUser && $document instanceof ApprovalDocument && $user->can('update', $document);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $document = $this->document();

        return [
            'make' => ['required', 'string', 'max:60'],
            'model' => ['required', 'string', 'max:80'],
            'variant' => ['nullable', 'string', 'max:80'],
            'type_designation' => ['required', 'string', 'max:32'],
            'eg_number' => ['required', 'string', 'max:64'],
            'ohne_eu_format' => ['sometimes', 'boolean'],
            'body_form' => ['nullable', 'string', Rule::in(DocumentConditions::BODY_FORMS)],
            'drive_axle' => ['nullable', 'string', Rule::in(array_values(array_diff(DocumentConditions::DRIVES, ['Allradlenkung'])))],
            'source_page' => ['required', 'integer', 'min:1', ...($document->page_count === null ? [] : ['max:'.$document->page_count])],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'make.required' => 'Trag den Hersteller ein, so wie das Gutachten ihn nennt.',
            'model.required' => 'Trag die Handelsbezeichnung ein, so wie das Gutachten sie nennt.',
            'type_designation.required' => 'Trag den Fahrzeugtyp ein, etwa „3C“.',
            'eg_number.required' => 'Trag die EG-Typgenehmigungsnummer ein, mit der Erweiterung.',
            'ohne_eu_format.boolean' => 'Bitte ja oder nein.',
            'body_form.in' => 'Wähl eine Karosserie aus der Liste oder „Nennt das Gutachten nicht“.',
            'drive_axle.in' => 'Wähl einen Antrieb aus der Liste oder „Nennt das Gutachten nicht“.',
            'source_page.required' => 'Auf welcher Seite des Gutachtens steht das Fahrzeug?',
            'source_page.min' => 'Die Seite beginnt bei 1.',
            'source_page.max' => 'Das Gutachten hat nur :max Seiten.',
            '*.max' => 'Das ist zu lang.',
            '*.integer' => 'Bitte eine ganze Zahl.',
        ];
    }

    /** Why a number in another form is asked about before the car is stored (D-521). */
    public const NOT_EU = 'Diese Nummer hat nicht die Form einer EG-Typgenehmigungsnummer (etwa e1*2007/46*0316*..). Darüber findet der Fahrzeugdaten-Import das Fahrzeug nie von selbst. Such es oben nach HSN/TSN oder Name und hak es an – oder leg es so an, wie es im Gutachten steht.';

    public function euForm(): bool
    {
        return EgNumber::parse(trim($this->string('eg_number')->toString())) !== null;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            // Not in the EU form: no merge will ever find this car by its number. The person decides, never the shop (D-521).
            if (! $this->euForm() && ! $this->boolean('ohne_eu_format')) {
                $validator->errors()->add('ohne_eu_format', self::NOT_EU);

                return;
            }

            $twin = $this->twin();

            if ($twin !== null) {
                $validator->errors()->add('eg_number', 'Dieses Fahrzeug gibt es schon: '.VehicleName::from($twin).'. Such es in der Liste oben und wähl es dort.');
            }
        });
    }

    /**
     * A car that already carries this EG number and Fahrzeugtyp under the same name — the same car, never a
     * second one.
     *
     * One approval may name several cars, and the documents keep them apart: ABE 55255 prints BMW X3 and BMW
     * X4 both as type X3 under e1*2007/46*0512, and BMW 5er-Reihe 5L once „ohne“ and once „mit Allradlenkung“.
     * So a car that differs in maker, Handelsbezeichnung, variant, body style or drive is another car — the
     * later merge then finds two and leaves the choice to a person (VehicleMerge). The name is compared as
     * the documents spell it differently: „1ER REIHE“ is „1er-Reihe“.
     */
    private function twin(): ?Vehicle
    {
        $raw = trim($this->string('eg_number')->toString());
        $number = EgNumber::parse($raw);
        $type = trim($this->string('type_designation')->toString());
        $variant = trim($this->string('variant')->toString());
        $name = self::named([
            $this->string('make')->toString(),
            $this->string('model')->toString(),
            $variant === '' ? $type : $variant,
            $this->string('body_form')->toString(),
            $this->string('drive_axle')->toString(),
        ]);

        // A number in another form is the same only when it reads the same, normalised (D-521): never a range, never a guess.
        if ($number === null) {
            return Vehicle::query()
                ->where('eg_nummer_norm', Vehicle::normaliseEcNumber($raw))
                ->where('type_designation', $type)
                ->where('source', '!=', VehicleSource::Entwicklung->value)
                ->get()
                ->first(static fn (Vehicle $v): bool => self::named([$v->make, $v->model, (string) $v->variant, (string) $v->body_form, (string) $v->drive_axle]) === $name);
        }

        // The same Fahrzeugtyp under a range of the same approval that shares an extension with this one is
        // the same car: `…*0287*00-09` and `…*0287*05` are one, `…*0287*00-09` and `…*0287*10-..` two.
        return Vehicle::query()
            ->where('eg_nummer_norm', 'like', addcslashes($number->base, '%_\\').'%')
            ->where('type_designation', $type)
            ->where('source', '!=', VehicleSource::Entwicklung->value)
            ->get()
            ->first(static fn (Vehicle $v): bool => (EgNumber::parse($v->getAttribute('eg_nummer_norm'))?->overlaps($number) ?? false)
                && self::named([$v->make, $v->model, (string) $v->variant, (string) $v->body_form, (string) $v->drive_axle]) === $name);
    }

    /**
     * A car's name as the documents spell it, compared without case, spaces or hyphens.
     *
     * @param  list<string>  $parts
     */
    private static function named(array $parts): string
    {
        return implode('|', array_map(static fn (string $part): string => (string) preg_replace('/[\s\-]+/u', '', mb_strtolower(trim($part))), $parts));
    }

    public function document(): ApprovalDocument
    {
        $document = $this->route('document');

        abort_unless($document instanceof ApprovalDocument, 404);

        return $document;
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        abort_unless($user instanceof AdminUser, 403);

        return $user;
    }

    /** @return array{make: string, model: string, variant: string, type_designation: string, eg_nummer_raw: string, body_form: string|null, drive_axle: string|null, source_page: int} */
    public function car(): array
    {
        $type = trim((string) $this->validated('type_designation'));
        $variant = trim((string) ($this->validated('variant') ?? ''));
        $body = $this->validated('body_form');
        $drive = $this->validated('drive_axle');

        return [
            'make' => trim((string) $this->validated('make')),
            'model' => trim((string) $this->validated('model')),
            // Left empty, the variant is the Fahrzeugtyp — the one name the document gives it.
            'variant' => $variant === '' ? $type : $variant,
            'type_designation' => $type,
            'eg_nummer_raw' => trim((string) $this->validated('eg_number')),
            'body_form' => is_string($body) && $body !== '' ? $body : null,
            'drive_axle' => is_string($drive) && $drive !== '' ? $drive : null,
            'source_page' => (int) $this->validated('source_page'),
        ];
    }
}
