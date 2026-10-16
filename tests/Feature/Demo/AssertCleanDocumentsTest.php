<?php

declare(strict_types=1);

use App\Models\ApprovalDocument;
use App\Models\Fitment;
use Illuminate\Support\Facades\Artisan;

/*
 * Decision 6 (D-239): `demo:assert-clean` checks documents as well as rows. The example catalogue's count leaves out an
 * example document with a row on a real wheel — the one that could put an invented verdict on a real order — so the
 * command counts documents by their own mark, whatever they stand on.
 */
it('fails on an example document that stands on a real wheel', function (): void {
    $document = ApprovalDocument::factory()->create(['is_demo' => true, 'demo_ref' => 'abnahme:doc:auf-echter-felge']);
    Fitment::factory()->create(['approval_document_id' => $document->id]);

    expect(Artisan::call('demo:assert-clean'))->toBe(1)
        ->and(Artisan::output())->toContain('approval_documents');
});

it('passes a database with no demo data at all', function (): void {
    Fitment::factory()->create();

    expect(Artisan::call('demo:assert-clean'))->toBe(0);
});
