<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Services\Demo\PlaceholderPdf;
use App\Services\Storage\DocumentFiles;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * The demo with ETRTO's table of tyre load at speed (D-459): no example document carries a table of its own any more — the
 * seed wrote ABE 55255's into all but DEMO-0007 until then, and DEMO-0007's fast cars answered UNKNOWN for want of one. Now
 * every example document reads ETRTO's, the same as a real one, and says so; the walkthrough's placeholder needs only its PDF.
 */
beforeEach(function (): void {
    // The answers this test reads are at the legal minimum: margins as shipped, stated (the look-back, D-232).
    config(['rimify.speed_symbol_margin_steps' => 0, 'rimify.load_index_margin_steps' => 0]);
    $this->seed(CommerceSeeder::class);
});

/** A published row of the document whose car is faster than 250 km/h. */
function fastRowOf(string $reportNumber): Fitment
{
    return Fitment::query()
        ->where('status', 'published')
        ->whereHas('approvalDocument', static fn ($q) => $q->where('report_number', $reportNumber))
        ->whereHas('vehicle', static fn ($q) => $q->where('max_speed_kmh', '>', 250)->where('max_speed_kmh', '<=', 300))
        ->whereHas('tyreSizes')
        ->orderBy('id')
        ->firstOrFail();
}

it('seeds no table of tyre load at speed: there is none to seed', function (): void {
    expect(Schema::hasTable('document_speed_deratings'))->toBeFalse()
        ->and(ApprovalDocument::query()->where('report_number', 'like', 'DEMO-%')->count())->toBeGreaterThan(1);
});

it('answers a fast car on DEMO-0007 as on any other example document: from ETRTO\'s table, and says so', function (): void {
    $resolver = app(FitmentResolver::class);

    foreach (['DEMO-0007', 'DEMO-0001'] as $number) {
        $row = fastRowOf($number);
        $verdict = $resolver->resolve((int) $row->vehicle_id, (int) $row->wheel_config_id);

        expect($verdict->tyre?->status)->not->toBe(VerdictStatus::Unknown, $number)
            ->and($verdict->tyre?->basis)->toEndWith('und die bei uns hinterlegte ETRTO-Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit.')
            ->and(implode(' ', $verdict->tyre?->lines ?? []))->not->toContain('Beispieltabelle')
            ->and(implode(' ', $verdict->tyre?->lines ?? []))->not->toContain('Tragfähigkeitstabelle');
    }
});

it('puts the walkthrough’s placeholder PDF back where a released placeholder expects it — those bytes only, and never a real document’s', function (): void {
    Storage::fake('docs_public');
    $pdf = "%PDF-1.4\nPLATZHALTER - kein echtes Gutachten\n%%EOF\n";
    $released = static fn (string $issuer, string $key, string $bytes): ApprovalDocument => ApprovalDocument::query()->create([
        'kind' => 'ABE', 'kba_number' => 'PLATZHALTER-GR-1', 'issuer' => $issuer, 'revision' => 1, 'page_count' => 4, 'status' => 'published',
        'pdf_key' => $key, 'pdf_sha256' => hash('sha256', $bytes),
    ]);
    $file = tempnam(sys_get_temp_dir(), 'gr');
    file_put_contents($file, $pdf);

    $placeholder = $released(PlaceholderPdf::ISSUER, 'gutachten/platzhalter.pdf', $pdf);
    $other = $released(PlaceholderPdf::ISSUER, 'gutachten/anderer.pdf', 'other bytes');
    $real = $released('TÜV SÜD', 'gutachten/echt.pdf', $pdf);
    $disk = app(DocumentFiles::class)->current();

    // The precondition: none of the three files is on this disk.
    expect($disk->exists('gutachten/platzhalter.pdf'))->toBeFalse()
        ->and($disk->exists('gutachten/echt.pdf'))->toBeFalse();

    $this->artisan('demo:placeholder-pdf', ['--pdf' => $file])->expectsOutputToContain('1 Platzhalter-PDF wieder abgelegt.')->assertSuccessful();

    // The placeholder's own bytes at its key; a placeholder released with other bytes, and a real document, untouched.
    expect($disk->get('gutachten/platzhalter.pdf'))->toBe($pdf)
        ->and($disk->exists('gutachten/anderer.pdf'))->toBeFalse()
        ->and($disk->exists('gutachten/echt.pdf'))->toBeFalse()
        ->and(app(DocumentFiles::class)->locate((string) $placeholder->pdf_key)['url'])->not->toBeNull()
        ->and($other->fresh()?->pdf_key)->toBe('gutachten/anderer.pdf')
        ->and($real->fresh()?->pdf_key)->toBe('gutachten/echt.pdf');

    // A file that is there stays as it is.
    $disk->put('gutachten/platzhalter.pdf', 'kept');
    $this->artisan('demo:placeholder-pdf', ['--pdf' => $file])->expectsOutputToContain('Kein Platzhalter-PDF fehlte.')->assertSuccessful();

    expect($disk->get('gutachten/platzhalter.pdf'))->toBe('kept');
    @unlink($file);
});

it('asks for the file rather than doing nothing silently', function (): void {
    $this->artisan('demo:placeholder-pdf')->expectsOutputToContain('Gib die Datei mit --pdf=<Pfad> an.')->assertFailed();
    $this->artisan('demo:placeholder-pdf', ['--pdf' => '/kein/solcher/pfad.pdf'])->expectsOutputToContain('Keine Datei unter /kein/solcher/pfad.pdf.')->assertFailed();
});
