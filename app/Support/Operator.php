<?php

declare(strict_types=1);

namespace App\Support;

/**
 * The operator of the test environment (staging), as its Impressum names them (D-088). While the shop runs on the
 * developer's domain it is a test environment, and the developer runs it: the page says so truthfully — who, where,
 * how to reach them, and that the shop is not in operation. On the client's domain (the live shop) the seller takes
 * its place (Seller), from Einstellungen › Verkäufer & Versand.
 *
 * Typed into the staging `.env` by hand (`rimify.operator`); what is not given is said to be missing, never guessed.
 */
final readonly class Operator
{
    /** The one sentence the test environment's Impressum carries above the operator's details. */
    public const NOT_IN_OPERATION = 'Dies ist eine Testumgebung von RIMIFY. Der Shop ist nicht in Betrieb: Hier werden keine echten Bestellungen angenommen, nichts geliefert und nichts berechnet.';

    public function __construct(
        public ?string $name,
        public ?string $street,
        public ?string $zip,
        public ?string $city,
        public ?string $country,
        public ?string $email,
        public ?string $phone,
    ) {}

    public static function current(): self
    {
        $value = static function (string $key): ?string {
            $raw = config('rimify.operator.'.$key);

            return is_string($raw) && trim($raw) !== '' ? trim($raw) : null;
        };

        return new self($value('name'), $value('street'), $value('zip'), $value('city'), $value('country'), $value('email'), $value('phone'));
    }

    /** Whether the Impressum speaks for the operator: on the staging copy only. */
    public static function applies(): bool
    {
        return app()->environment('staging');
    }

    /**
     * The Impressum's facts (§ 5 DDG) for the test environment, each null while it is not given; a telephone number only
     * when there is one.
     *
     * @return list<array{label: string, value: string|null}>
     */
    public function impressum(): array
    {
        $address = $this->street !== null && $this->zip !== null && $this->city !== null
            ? "{$this->street}\n{$this->zip} {$this->city}".($this->country === null ? '' : "\n{$this->country}")
            : null;

        $rows = [
            ['label' => 'Betreiber der Testumgebung', 'value' => $this->name],
            ['label' => 'Anschrift', 'value' => $address],
            ['label' => 'E-Mail', 'value' => $this->email],
        ];

        if ($this->phone !== null) {
            $rows[] = ['label' => 'Telefon', 'value' => $this->phone];
        }

        return $rows;
    }
}
