<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Enums\DocumentStatus;
use App\Http\Controllers\Admin\GutachtenController;
use App\Models\ApprovalDocument;
use App\Support\CatalogueVersion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * A draft paper for the client to try the five steps on, written by `rimify:demo --ausprobieren` (the operator's answer of
 * 07.11.2026 to change 1): „Demo – zum Ausprobieren“, born demo, with a three-page example PDF and nothing else entered. Opened
 * in the admin it is the entry flow at step 2, so he can choose a wheel, search and tick cars, type combinations and codes and
 * walk to the release door without touching his own drafts. Nothing he enters is in the shop while it is a draft; System ›
 * Zurücksetzen › Demodaten takes it away with the rest of the set — and refuses, in a sentence, while it names one of his real
 * wheels (DemoCatalogue::blockers).
 */
final class AcceptanceTrialPaper
{
    public const REF = AcceptanceSet::PREFIX.'ausprobieren:doc';

    public const NUMBER = 'Demo – zum Ausprobieren';

    public static function present(): bool
    {
        return DB::table('approval_documents')->where('demo_ref', self::REF)->exists();
    }

    /**
     * @return array<string, int> rows written, by table: none where it stands already
     *
     * @throws RuntimeException where demo data may not be written
     */
    public function seed(): array
    {
        DemoGuard::ensure();

        if (self::present()) {
            return [];
        }

        $pdf = ExamplePdf::stamp(self::paperPdf());
        $key = AcceptanceSeeder::exampleKey('ausprobieren');
        Storage::disk(GutachtenController::DISK)->put($key, $pdf);

        DB::table('approval_documents')->insert([
            'kind' => 'ABE',
            'kba_number' => self::NUMBER,
            'issuer' => 'Beispiel aus der RIMIFY-Testumgebung',
            'issued_on' => now()->toDateString(),
            'revision' => 1,
            'valid_from' => now()->toDateString(),
            'page_count' => 3,
            'pdf_key' => $key,
            'pdf_sha256' => hash('sha256', $pdf),
            'status' => DocumentStatus::Draft->value,
            'completeness' => ApprovalDocument::PARTIAL,
            'completeness_at' => now(),
            'completeness_revision' => 1,
            'is_demo' => true,
            'demo_ref' => self::REF,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DemoTables::forget();
        CatalogueVersion::changed();

        return ['approval_documents' => 1];
    }

    /** Three pages that say what they are, so „Aktuelle PDF-Seite übernehmen“ has pages to take. */
    private static function paperPdf(): string
    {
        $pages = [
            ['Beispiel aus der RIMIFY-Testumgebung', 'Ein Entwurf zum Ausprobieren der fuenf Schritte. Nichts davon steht im Shop.'],
            ['Seite 2: Fahrzeuge', 'Hier stuende im echten Gutachten die Liste der Fahrzeuge mit Feld K.'],
            ['Seite 3: Reifen und Auflagen', 'Hier stuenden die Reifengroessen, die Kombinationen und die Codes.'],
        ];
        $objects = ['<< /Type /Catalog /Pages 2 0 R >>', ''];
        $kids = [];

        foreach ($pages as [$title, $line]) {
            $stream = "BT /F1 16 Tf 60 760 Td ({$title}) Tj ET\nBT /F1 11 Tf 60 730 Td ({$line}) Tj ET\n";
            $page = count($objects) + 1;
            $kids[] = "{$page} 0 R";
            $objects[] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents '.($page + 1).' 0 R /Resources << /Font << /F1 FONT 0 R >> >> >>';
            $objects[] = '<< /Length '.strlen($stream)." >>\nstream\n{$stream}endstream";
        }

        $font = count($objects) + 1;
        $objects[] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
        $objects[1] = '<< /Type /Pages /Kids ['.implode(' ', $kids).'] /Count '.count($pages).' >>';
        $objects = array_map(static fn (string $object): string => str_replace('FONT 0 R', "{$font} 0 R", $object), $objects);

        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objects as $i => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($i + 1)." 0 obj\n{$object}\nendobj\n";
        }

        $start = strlen($pdf);
        $pdf .= 'xref'."\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";

        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        return $pdf.'trailer'."\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n{$start}\n%%EOF\n";
    }
}
