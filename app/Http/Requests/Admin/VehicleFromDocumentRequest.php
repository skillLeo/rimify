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
 * The same car twice is refused: an EG number and a Fahrzeugtyp that a car already carries name that car,
 * and the person is sent to it — the later merge must never find two (docs/specs/vehicles-and-tyres.md, C8).
 */
class VehicleFromDocumentRequest extends FormRequest
{
    /**
     * `e1*2007/46*0316*..`, `e1*2001/116*0447*11`, `e1*2001/116*0287*00-09`, `e1*2007/46*0273*04-..` — country,
     * directive, number, and the extensions as the document prints them (EgNumber).
     */
    public const EG_NUMBER = EgNumber::PATTERN;

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
            'eg_number' => ['required', 'string', 'max:64', 'regex:'.self::EG_NUMBER],
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
            'eg_number.regex' => 'So sieht eine EG-Typgenehmigungsnummer nicht aus. Sie beginnt mit e und der Länderziffer, etwa e1*2007/46*0316*..',
            'body_form.in' => 'Wähl eine Karosserie aus der Liste oder „Nennt das Gutachten nicht“.',
            'drive_axle.in' => 'Wähl einen Antrieb aus der Liste oder „Nennt das Gutachten nicht“.',
            'source_page.required' => 'Auf welcher Seite des Gutachtens steht das Fahrzeug?',
            'source_page.min' => 'Die Seite beginnt bei 1.',
            'source_page.max' => 'Das Gutachten hat nur :max Seiten.',
            '*.max' => 'Das ist zu lang.',
            '*.integer' => 'Bitte eine ganze Zahl.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $twin = $this->twin();

            if ($twin !== null) {
                $validator->errors()->add('eg_number', 'Dieses Fahrzeug gibt es schon: '.VehicleName::from($twin).'. Such es in der Liste oben und wähl es dort.');
            }
        });
    }

    /** A car that already carries this EG number and Fahrzeugtyp — the same car, never a second one. */
    private function twin(): ?Vehicle
    {
        $number = EgNumber::parse($this->string('eg_number')->toString());

        if ($number === null) {
            return null;
        }

        // The same Fahrzeugtyp under a range of the same approval that shares an extension with this one is
        // the same car: `…*0287*00-09` and `…*0287*05` are one, `…*0287*00-09` and `…*0287*10-..` two.
        return Vehicle::query()
            ->where('eg_nummer_norm', 'like', addcslashes($number->base, '%_\\').'%')
            ->where('type_designation', trim($this->string('type_designation')->toString()))
            ->where('source', '!=', VehicleSource::Entwicklung->value)
            ->get()
            ->first(static fn (Vehicle $v): bool => EgNumber::parse($v->getAttribute('eg_nummer_norm'))?->overlaps($number) ?? false);
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
