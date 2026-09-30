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
     * The Impressum's facts (§ 5 DDG), in the order a reader looks for them, each null while it is not given: the page
     * prints what there is and says plainly what is missing — never a guess, never the brand name for the legal one.
     * Who manages the company and a telephone number stand there only when given: a sole trader has no Geschäftsführung,
     * and the shop may have no telephone for customers.
     *
     * @return list<array{label: string, value: string|null}>
     */
    public function impressum(): array
    {
        $address = $this->street !== null && $this->zip !== null && $this->city !== null
            ? "{$this->street}\n{$this->zip} {$this->city}\nDeutschland"
            : null;

        return array_values(array_filter([
            ['label' => 'Anbieter', 'value' => $this->name],
            ['label' => 'Anschrift', 'value' => $address],
            $this->managingDirector === null ? null : ['label' => 'Vertreten durch', 'value' => $this->managingDirector],
            ['label' => 'E-Mail', 'value' => $this->email],
            $this->phone === null ? null : ['label' => 'Telefon', 'value' => $this->phone],
            ['label' => 'Registereintrag', 'value' => $this->register],
            ['label' => 'Umsatzsteuer-Identifikationsnummer', 'value' => $this->vatId],
        ]));
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
