<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Models\Page;
use App\Models\Setting;
use App\Services\Content\LegalTexts;
use App\Support\Seller;

/**
 * The legal texts and the Impressum as a test needs them (D-319): every text a placeholder, as a new shop starts — or
 * every text the Kanzlei's and every Impressum field given, the one state in which the three locks open. Each test that
 * proves a lock holds proves it against this second state too, so a lock that never opens cannot pass.
 */
final class LegalFixture
{
    /** The seller with every Impressum field given: what `ready()` stores. */
    public const SELLER = [
        'name' => 'Beispiel Räder GmbH', 'legal_form' => 'GmbH', 'street' => 'Werkstraße 4', 'zip' => '80331', 'city' => 'München',
        'managing_director' => 'Erika Beispiel', 'register_court' => 'Amtsgericht München', 'register_number' => 'HRB 204711',
        'vat_id' => 'DE204711815', 'tax_number' => null, 'email' => 'rechnung@beispiel.de', 'phone' => '+49 89 123456',
        'placeholder' => false, 'not_applicable' => [],
    ];

    /** Every text the Kanzlei's, the form's flag off, every Impressum field given. */
    public static function ready(): void
    {
        foreach (array_keys(LegalTexts::TEXTS) as $slug) {
            if ($slug !== LegalTexts::FORM) {
                self::page($slug, false);
            }
        }

        Setting::set(LegalTexts::FORM_SETTING, false);
        self::seller();
    }

    /**
     * A published legal page with one section — the Kanzlei's words, or the seeder's marker — and its flag.
     */
    public static function page(string $slug, bool $placeholder, ?string $text = null): Page
    {
        $title = LegalTexts::TEXTS[$slug];
        $page = Page::query()->firstOrCreate(['slug' => $slug], ['locale' => 'de', 'kind' => Page::KIND_LEGAL, 'title' => $title, 'status' => Page::STATUS_PUBLISHED, 'published_at' => now()]);
        $page->blocks()->delete();
        $page->blocks()->create(['type' => 'legal_body', 'sort_order' => 10, 'data' => $placeholder && $text === null
            ? ['heading' => $title, 'text' => '[Rechtstext folgt von der Kanzlei — Abschnitt: '.$title.']', 'placeholder' => true]
            : ['heading' => $title, 'text' => $text ?? "Der Text der Kanzlei: {$title}."]]);
        $page->forceFill(['is_placeholder' => $placeholder])->save();

        return $page->refresh();
    }

    /** @param  array<string, mixed>  $over */
    public static function seller(array $over = []): void
    {
        Setting::set(Seller::KEY, [...self::SELLER, ...$over]);
    }
}
