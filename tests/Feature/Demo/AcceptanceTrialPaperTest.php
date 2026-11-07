<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\GutachtenController;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Services\Demo\AcceptanceTrialPaper;
use App\Services\Demo\DemoPurge;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Storage;

/*
 * The draft to try the five steps on (`rimify:demo --ausprobieren`, the operator's answer of 07.11.2026 to change 1): born demo,
 * a draft, its PDF on the documents disk, opened in the admin as the entry flow — and taken away by the demo purge.
 */

beforeEach(function (): void {
    config(['demo.enabled' => true]);
    $this->seed(ReferenceDataSeeder::class);
    Storage::fake(GutachtenController::DISK);
});

it('writes one draft, born demo, with its example PDF, and nothing twice', function (): void {
    $this->artisan('rimify:demo', ['--ausprobieren' => true])->expectsOutputToContain('Demo – zum Ausprobieren')->assertSuccessful();

    $document = ApprovalDocument::query()->where('demo_ref', AcceptanceTrialPaper::REF)->sole();

    expect((bool) $document->is_demo)->toBeTrue()
        ->and($document->status->value)->toBe('draft')
        ->and($document->kba_number)->toBe(AcceptanceTrialPaper::NUMBER)
        ->and($document->page_count)->toBe(3)
        ->and(Storage::disk(GutachtenController::DISK)->exists((string) $document->pdf_key))->toBeTrue()
        ->and(hash('sha256', (string) Storage::disk(GutachtenController::DISK)->get((string) $document->pdf_key)))->toBe($document->pdf_sha256);

    $this->artisan('rimify:demo', ['--ausprobieren' => true])->expectsOutputToContain('schon da')->assertSuccessful();

    expect(ApprovalDocument::query()->where('demo_ref', AcceptanceTrialPaper::REF)->count())->toBe(1);
});

it('opens in the admin as the five steps, with the demo mark', function (): void {
    $this->seed(AccessSeeder::class);
    (new AcceptanceTrialPaper)->seed();
    $document = ApprovalDocument::query()->where('demo_ref', AcceptanceTrialPaper::REF)->sole();
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    $this->actingAs($admin, 'admin')->get('/admin/gutachten/'.$document->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/Gutachten/Erfassung')->where('document.demo', true)->where('weiter', 2));
});

it('goes with the demo purge', function (): void {
    (new AcceptanceTrialPaper)->seed();

    (new DemoPurge)->run('Test');

    expect(ApprovalDocument::query()->where('demo_ref', AcceptanceTrialPaper::REF)->exists())->toBeFalse();
});

it('is not written where demo data may not be', function (): void {
    config(['demo.enabled' => false]);

    $this->artisan('rimify:demo', ['--ausprobieren' => true])->assertFailed();

    expect(AcceptanceTrialPaper::present())->toBeFalse();
});
