<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Models\ApprovalDocument;
use App\Models\DocumentSpeedDerating;
use App\Models\Fitment;
use App\Services\Demo\PlaceholderTables;
use Database\Seeders\ApprovalSeeder;
use Database\Seeders\CommerceSeeder;

/**
 * The operator's decision of 29.09.2026: the demo shows both states. Every example document carries ABE
 * 55255's table, marked as the demo seed's; DEMO-0007 carries none on purpose, so a fast car on it gets the
 * honest UNKNOWN; and the walkthrough's placeholder document gets the marked table too.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

/** A published row of the document whose car is faster than 210 km/h. */
function fastRowOf(string $reportNumber): Fitment
{
    return Fitment::query()
        ->where('status', 'published')
        ->whereHas('approvalDocument', static fn ($q) => $q->where('report_number', $reportNumber))
        ->whereHas('vehicle', static fn ($q) => $q->where('max_speed_kmh', '>', 250))
        ->whereHas('tyreSizes')
        ->orderBy('id')
        ->firstOrFail();
}

it('gives every example document the marked table but one, and keeps DEMO-0007 without', function (): void {
    $documents = ApprovalDocument::query()->where('report_number', 'like', 'DEMO-%')->withCount('speedDeratings')->get()->keyBy('report_number');

    foreach ($documents as $number => $document) {
        expect($document->speed_deratings_count)->toBe($number === 'DEMO-0007' ? 0 : 30, $number);
    }

    expect(DocumentSpeedDerating::query()->whereNull('seeded_from')->count())->toBe(0);
});

it('answers a fast car honestly UNKNOWN on DEMO-0007, and definitely on a document with its table', function (): void {
    $resolver = app(FitmentResolver::class);

    $without = fastRowOf('DEMO-0007');
    $verdict = $resolver->resolve((int) $without->vehicle_id, (int) $without->wheel_config_id);

    expect($verdict->tyre?->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->tyre?->summary)->toStartWith('Zu diesem Gutachten ist keine Tragfähigkeitstabelle für hohe Geschwindigkeit hinterlegt.');

    $with = fastRowOf('DEMO-0001');
    $answered = $resolver->resolve((int) $with->vehicle_id, (int) $with->wheel_config_id);

    expect($answered->tyre?->status)->not->toBe(VerdictStatus::Unknown)
        ->and($answered->tyre?->basis)->toContain('Beispieltabelle aus den Demodaten');
});

it('keeps DEMO-0007 without on a database seeded before the decision, and never takes a typed table', function (): void {
    $seven = ApprovalDocument::query()->where('report_number', 'DEMO-0007')->firstOrFail();
    ApprovalSeeder::seedDerating($seven);
    expect($seven->speedDeratings()->count())->toBe(30);

    $this->seed(ApprovalSeeder::class);
    expect($seven->speedDeratings()->count())->toBe(0);

    // A person typed one from a PDF: the seed never removes it.
    DocumentSpeedDerating::query()->create(['approval_document_id' => $seven->id, 'speed_kmh' => 250, 'symbol' => 'W', 'percent' => 95, 'source_page' => 6]);
    $this->seed(ApprovalSeeder::class);
    expect($seven->speedDeratings()->count())->toBe(1);
});

it('gives the walkthrough’s placeholder document the marked table once, and keeps any table it has', function (): void {
    $placeholder = ApprovalDocument::query()->create([
        'kind' => 'ABE', 'kba_number' => 'PLATZHALTER-GR-1', 'issuer' => PlaceholderTables::ISSUER, 'revision' => 1, 'page_count' => 4, 'status' => 'draft',
    ]);

    $this->artisan('demo:placeholder-tables')->expectsOutputToContain('1 Platzhalter-Gutachten')->assertSuccessful();
    $this->artisan('demo:placeholder-tables')->expectsOutputToContain('Nichts zu tun.')->assertSuccessful();

    expect($placeholder->speedDeratings()->count())->toBe(30)
        ->and($placeholder->speedDeratings()->whereNot('seeded_from', ApprovalSeeder::DERATING_SEED)->count())->toBe(0);
});
