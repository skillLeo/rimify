<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Setting;

/**
 * RIMIFY as the law names it: the legal name, the address, who manages it, the register and the tax numbers. The
 * client's data, typed in by hand in Einstellungen › Verkäufer & Versand — nothing here is ever filled in by us, and
 * the brand name never stands in for the legal one. `.env` (`rimify.seller`) answers only while that page was never
 * saved; once it was, its word wins, a cleared field included (as KomplettradSettings reads its prices).
 *
 * Two readings. `current()` is what the shop's documents print — the invoice, the Widerrufsformular, the order mail —
 * and a seller marked as placeholder is not given there: the invoice stays a test invoice, the form names the e-mail
 * alone. `stored()` is what was typed, placeholder or not: for the settings page and the Impressum, which marks it.
 *
 * Where it is needed and missing, the surface says so instead of printing a guess: the invoice is issued as a test
 * invoice (Invoices), the Widerrufsformular names the e-mail address alone, the preflight lists the gap.
 *
 * `smallBusiness` is the Kleinunternehmer switch (§ 19 UStG): one flag, and the VAT rate every new order is written
 * at (`vatRateBp`), every price note on the site (the shared `smallBusiness` prop) and the invoice follow it together.
 * An order keeps the rate it was written at; its invoice and its pages read that, never the flag of today.
 */
final readonly class Seller
{
    /** The sentence a Kleinunternehmer's invoice carries in place of the VAT. */
    public const SMALL_BUSINESS_SENTENCE = 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.';

    /** The settings row Einstellungen › Verkäufer & Versand writes. */
    public const KEY = 'shop.seller';

    /** What `missing()` says for a seller marked as placeholder. */
    public const PLACEHOLDER = 'Verkäuferangaben (noch Platzhalter)';

    /**
     * The Impressum's fields that may honestly not apply — a sole trader has no Geschäftsführung and no register entry, a
     * Kleinunternehmer may hold no USt-IdNr., a shop may take no calls — each declared so in the admin („entfällt“):
     * a declaration, never an invented value (D-319). Every other Impressum field must be given.
     */
    public const MAY_NOT_APPLY = ['managing_director', 'register', 'vat_id', 'phone'];

    /**
     * What the Impressum shows in place of a field not given yet (the operator's brief of 23.10.2026): a marker no reader
     * can take for the value, and that LegalReadiness counts.
     */
    public const MARKERS = [
        'name' => '[FIRMENNAME]',
        'legal_form' => '[RECHTSFORM]',
        'street' => '[STRASSE UND HAUSNUMMER]',
        'zip' => '[PLZ]',
        'city' => '[ORT]',
        'managing_director' => '[GESCHÄFTSFÜHRER]',
        'register_court' => '[REGISTERGERICHT]',
        'register_number' => '[REGISTERNUMMER]',
        'vat_id' => '[UST-IDNR.]',
        'phone' => '[TELEFON]',
        'email' => '[E-MAIL]',
    ];

    /**
     * The Impressum's fields by the name the admin form gives them — what the refusals and the admin's lists say is
     * missing — each with the „Entfällt“ declaration that may stand in for it.
     */
    private const IMPRESSUM_FIELDS = [
        'name' => ['Name des Unternehmens', null],
        'legalForm' => ['Rechtsform', null],
        'street' => ['Straße und Hausnummer', null],
        'zip' => ['PLZ', null],
        'city' => ['Ort', null],
        'managingDirector' => ['Geschäftsführung', 'managing_director'],
        'registerCourt' => ['Registergericht', 'register'],
        'registerNumber' => ['Registernummer', 'register'],
        'vatId' => ['USt-IdNr.', 'vat_id'],
        'phone' => ['Telefon', 'phone'],
        'email' => ['E-Mail-Adresse', null],
    ];

    /** The fields § 14 Abs. 4 UStG asks of the seller, in the words the preflight uses for the gap. */
    private const REQUIRED = [
        'name' => 'Name des Unternehmens',
        'street' => 'Straße und Hausnummer',
        'zip' => 'PLZ',
        'city' => 'Ort',
        'email' => 'E-Mail-Adresse',
    ];

    /**
     * @param  string|null  $register  the register as one line: `Amtsgericht München, HRB 204711`
     * @param  string|null  $ownEmail  the seller's own address, where `email` may be the shop's contact address
     * @param  'Einstellungen'|'.env'  $source
     * @param  list<string>  $notApplicable  the MAY_NOT_APPLY fields declared „entfällt“ in the admin
     */
    public function __construct(
        public ?string $name,
        public ?string $street,
        public ?string $zip,
        public ?string $city,
        public ?string $email,
        public ?string $vatId,
        public ?string $taxNumber,
        public ?string $register,
        public bool $smallBusiness = false,
        public ?string $managingDirector = null,
        public ?string $registerCourt = null,
        public ?string $registerNumber = null,
        public ?string $phone = null,
        public bool $placeholder = false,
        public string $source = '.env',
        public ?string $ownEmail = null,
        public ?string $legalForm = null,
        public array $notApplicable = [],
    ) {}

    /** The seller the shop's documents print: a placeholder is not given there (only the shop's contact address is). */
    public static function current(): self
    {
        $stored = self::stored();

        if (! $stored->placeholder) {
            return $stored;
        }

        return new self(null, null, null, null, self::contactEmail(), null, null, null, $stored->smallBusiness, placeholder: true, source: $stored->source);
    }

    /** The seller as typed — placeholders included, marked — for the settings page and the Impressum. */
    public static function stored(): self
    {
        $small = config('rimify.seller.small_business') === true;
        $row = Setting::get(self::KEY);

        if (is_array($row)) {
            $own = self::text($row['email'] ?? null);
            $court = self::text($row['register_court'] ?? null);
            $number = self::text($row['register_number'] ?? null);

            return new self(
                self::text($row['name'] ?? null),
                self::text($row['street'] ?? null),
                self::text($row['zip'] ?? null),
                self::text($row['city'] ?? null),
                $own ?? self::contactEmail(),
                self::text($row['vat_id'] ?? null),
                self::text($row['tax_number'] ?? null),
                $court !== null && $number !== null ? "{$court}, {$number}" : $number,
                $small,
                self::text($row['managing_director'] ?? null),
                $court,
                $number,
                self::text($row['phone'] ?? null),
                ($row['placeholder'] ?? false) === true,
                'Einstellungen',
                $own,
                self::text($row['legal_form'] ?? null),
                array_values(array_intersect(self::MAY_NOT_APPLY, is_array($row['not_applicable'] ?? null) ? $row['not_applicable'] : [])),
            );
        }

        $value = static fn (string $key): ?string => self::text(config('rimify.seller.'.$key));
        $own = $value('email');

        return new self(
            $value('name'),
            $value('street'),
            $value('zip'),
            $value('city'),
            $own ?? self::contactEmail(),
            $value('vat_id'),
            $value('tax_number'),
            $value('register'),
            $small,
            source: '.env',
            ownEmail: $own,
        );
    }

    /** The VAT rate a new order is written at, in basis points: none for a Kleinunternehmer, 19 % otherwise. */
    public function vatRateBp(): int
    {
        return $this->smallBusiness ? 0 : Money::VAT_STANDARD_BP;
    }

    /**
     * What § 14 UStG needs and is not given yet: the address fields, and one of USt-IdNr. or Steuernummer. A seller
     * marked as placeholder needs its real data, and nothing else is said about it.
     *
     * @return list<string>
     */
    public function missing(): array
    {
        if ($this->placeholder) {
            return [self::PLACEHOLDER];
        }

        $missing = [];

        foreach (self::REQUIRED as $field => $label) {
            if ($this->{$field} === null) {
                $missing[] = $label;
            }
        }

        if ($this->vatId === null && $this->taxNumber === null) {
            $missing[] = 'USt-IdNr. oder Steuernummer';
        }

        return $missing;
    }

    public function complete(): bool
    {
        return $this->missing() === [];
    }

    /**
     * The seller's lines as a letter would print them; only what is given.
     *
     * @return list<string>
     */
    public function addressLines(): array
    {
        return array_values(array_filter([
            $this->name,
            $this->street,
            trim(($this->zip ?? '').' '.($this->city ?? '')) ?: null,
        ]));
    }

    /**
     * The line under every invoice and order mail — what § 14 UStG and, for a GmbH, § 35a GmbHG ask a business letter
     * to carry: `Beispiel GmbH · Straße 1 · 80331 München · E-Mail · Geschäftsführung: … · Amtsgericht …, HRB … ·
     * USt-IdNr. …`. Only what is given.
     */
    public function documentLine(): string
    {
        return implode(' · ', array_values(array_filter([
            ...$this->addressLines(),
            $this->email,
            $this->managingDirector === null ? null : 'Geschäftsführung: '.$this->managingDirector,
            $this->register,
            $this->vatId === null ? null : 'USt-IdNr. '.$this->vatId,
            $this->taxNumber === null ? null : 'Steuernummer '.$this->taxNumber,
        ])));
    }

    /**
     * The Impressum's facts (§ 5 DDG), in the order a reader looks for them, from the fields entered once in the admin.
     * A field not given shows its marker — „[FIRMENNAME]“ — and is `missing`: never a guess, never the brand name for
     * the legal one (D-319). A field declared „entfällt“ (MAY_NOT_APPLY) is left out, as the law leaves it out.
     *
     * @return list<array{label: string, value: string, missing: bool}>
     */
    public function impressum(): array
    {
        $row = static fn (string $label, ?string $value, string $marker): array => ['label' => $label, 'value' => $value ?? $marker, 'missing' => $value === null];
        $applies = fn (string $field): bool => ! in_array($field, $this->notApplicable, true);

        $rows = [
            $row('Anbieter', $this->name, self::MARKERS['name']),
            $row('Rechtsform', $this->legalForm, self::MARKERS['legal_form']),
            [
                'label' => 'Anschrift',
                'value' => ($this->street ?? self::MARKERS['street'])."\n".($this->zip ?? self::MARKERS['zip']).' '.($this->city ?? self::MARKERS['city'])."\nDeutschland",
                'missing' => $this->street === null || $this->zip === null || $this->city === null,
            ],
        ];

        if ($applies('managing_director')) {
            $rows[] = $row('Vertreten durch', $this->managingDirector, self::MARKERS['managing_director']);
        }

        if ($applies('register')) {
            $rows[] = $row('Registergericht', $this->registerCourt, self::MARKERS['register_court']);
            $rows[] = $row('Registernummer', $this->registerNumber, self::MARKERS['register_number']);
        }

        if ($applies('vat_id')) {
            $rows[] = $row('Umsatzsteuer-Identifikationsnummer', $this->vatId, self::MARKERS['vat_id']);
        }

        if ($applies('phone')) {
            $rows[] = $row('Telefon', $this->phone, self::MARKERS['phone']);
        }

        $rows[] = $row('E-Mail', $this->email, self::MARKERS['email']);

        return $rows;
    }

    /**
     * The Impressum's fields not given and not declared „Entfällt“, by the name the admin form gives them — what keeps
     * the shop out of search and out of live payments (LegalReadiness). A seller marked as placeholder has given nothing
     * yet.
     *
     * @return list<string>
     */
    public function impressumMissing(): array
    {
        if ($this->placeholder) {
            return [self::PLACEHOLDER];
        }

        $missing = [];

        foreach (self::IMPRESSUM_FIELDS as $property => [$label, $declared]) {
            if ($this->{$property} === null && ($declared === null || ! in_array($declared, $this->notApplicable, true))) {
                $missing[] = $label;
            }
        }

        return $missing;
    }

    /** @return array<string, string|bool|null> */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'street' => $this->street,
            'zip' => $this->zip,
            'city' => $this->city,
            'email' => $this->email,
            'vatId' => $this->vatId,
            'taxNumber' => $this->taxNumber,
            'register' => $this->register,
            'managingDirector' => $this->managingDirector,
            'phone' => $this->phone,
            'legalForm' => $this->legalForm,
            'smallBusiness' => $this->smallBusiness,
            'placeholder' => $this->placeholder,
        ];
    }

    private static function contactEmail(): ?string
    {
        $mail = config('rimify.contact.email');

        return is_string($mail) && trim($mail) !== '' ? trim($mail) : null;
    }

    private static function text(mixed $raw): ?string
    {
        return is_string($raw) && trim($raw) !== '' ? trim($raw) : null;
    }
}
