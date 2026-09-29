<?php

declare(strict_types=1);

namespace App\Support;

/**
 * RIMIFY as the law names it: the legal name, the address, the tax numbers (`rimify.seller`). The client's data, typed
 * in by hand — nothing here is ever filled in by us, and the brand name never stands in for the legal one.
 *
 * Where it is needed and missing, the surface says so instead of printing a guess: the invoice is issued as a test
 * invoice (Invoices), the Widerrufsformular names the e-mail address alone, the preflight lists the gap.
 */
final readonly class Seller
{
    /** The fields § 14 Abs. 4 UStG asks of the seller, in the words the preflight uses for the gap. */
    private const REQUIRED = [
        'name' => 'Name des Unternehmens',
        'street' => 'Straße und Hausnummer',
        'zip' => 'PLZ',
        'city' => 'Ort',
        'email' => 'E-Mail-Adresse',
    ];

    public function __construct(
        public ?string $name,
        public ?string $street,
        public ?string $zip,
        public ?string $city,
        public ?string $email,
        public ?string $vatId,
        public ?string $taxNumber,
        public ?string $register,
    ) {}

    public static function current(): self
    {
        $value = static function (string $key): ?string {
            $raw = config('rimify.seller.'.$key);

            return is_string($raw) && trim($raw) !== '' ? trim($raw) : null;
        };

        return new self(
            $value('name'),
            $value('street'),
            $value('zip'),
            $value('city'),
            $value('email') ?? (is_string($mail = config('rimify.contact.email')) && $mail !== '' ? $mail : null),
            $value('vat_id'),
            $value('tax_number'),
            $value('register'),
        );
    }

    /**
     * What § 14 UStG needs and is not given yet: the address fields, and one of USt-IdNr. or Steuernummer.
     *
     * @return list<string>
     */
    public function missing(): array
    {
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

    /** @return array<string, string|null> */
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
        ];
    }
}
