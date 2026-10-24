<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\Support\Seller;

/**
 * Whether the shop's legal texts are real (D-319, the operator's brief of 23.10.2026): no legal text is a placeholder
 * and the Impressum has every field it needs. Until then three locks hold, all reading this one answer — the live shop
 * stays out of search (SecurityHeaders, RobotsController), the go-live check fails the items (GoLiveChecks), and
 * Einstellungen › Zahlung refuses Livemodus (PaymentSettingsRequest). Test keys keep working.
 */
final readonly class LegalReadiness
{
    public function __construct(private LegalTexts $texts) {}

    /**
     * What is still missing, in the words the refusal names it: each placeholder text, then each Impressum field.
     *
     * @return list<string>
     */
    public function missing(): array
    {
        return [
            ...array_map(static fn (string $name): string => $name.' (Platzhalter)', $this->texts->placeholders()),
            ...array_map(static fn (string $field): string => 'Impressum: '.$field, Seller::stored()->impressumMissing()),
        ];
    }

    public function ready(): bool
    {
        return $this->missing() === [];
    }
}
