<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Inertia\Testing\AssertableInertia;

/*
 * The switch „Alle Fahrzeuge dieses Gutachtens sind erfasst“ (D-485, the client's round of 18.11.2026, item 2), in place of
 * D-227's question at release: optional, off until someone turns it on, never in the way of a release. Who may release may
 * set it (ADMIN-GEFUNDEN 513), on a draft or the released revision; it never touches the missing Anlagen under „Angaben“,
 * and cannot be turned on while some are named there.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
});

function answerAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', "{$role}@rimify.test")->firstOrFail();
}

it('switches a released document on and off — recorded with who and when, in the Protokoll, and offered on its page', function (): void {
    $released = ApprovalDocument::factory()->unanswered()->create();

    $this->actingAs(answerAdmin(), 'admin')->get("/admin/gutachten/{$released->id}")->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('can.answer', true)->where('document.completeness', null));

    $this->actingAs(answerAdmin(), 'admin')->post("/admin/gutachten/{$released->id}/vollstaendigkeit", ['complete' => true])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Gespeichert: Alle Fahrzeuge sind erfasst. Ein Fahrzeug, das hier nicht steht, ist im Shop jetzt „nicht freigegeben“.');

    $released->refresh();
    expect($released->completeness)->toBe(ApprovalDocument::COMPLETE)
        ->and($released->completeness_by)->toBe(answerAdmin()->id)
        ->and($released->completeness_revision)->toBe($released->revision);

    $this->actingAs(answerAdmin(), 'admin')->post("/admin/gutachten/{$released->id}/vollstaendigkeit", ['complete' => false])->assertSessionHasNoErrors();

    expect($released->refresh()->completeness)->toBe(ApprovalDocument::UNKNOWN)
        ->and(AuditLog::query()->where('description', 'approval.completeness_answered')->pluck('properties')->map(fn ($p): array => [$p['before'], $p['completeness']])->all())
        ->toBe([[null, 'complete'], ['complete', 'unknown']]);
});

it('sets it on a draft before its release, and keeps it through the release', function (): void {
    $draft = ApprovalDocument::factory()->draft()->unanswered()->create();

    $this->actingAs(answerAdmin(), 'admin')->post("/admin/gutachten/{$draft->id}/vollstaendigkeit", ['complete' => true])->assertSessionHasNoErrors();

    expect($draft->refresh()->completeness)->toBe(ApprovalDocument::COMPLETE);
});

it('cannot be turned on while „Angaben“ names missing Anlagen, and leaves them as they are when turned off', function (): void {
    $released = ApprovalDocument::factory()->create(['completeness' => ApprovalDocument::PARTIAL, 'missing_annexes' => 'Anlagen 1–15']);

    $this->actingAs(answerAdmin(), 'admin')->post("/admin/gutachten/{$released->id}/vollstaendigkeit", ['complete' => true])
        ->assertSessionHasErrors(['complete' => 'Unter „Angaben“ stehen noch fehlende Anlagen (Anlagen 1–15). Solange sie fehlen, sind nicht alle Fahrzeuge erfasst – trag sie nach oder lösch die Angabe.']);

    expect($released->refresh()->completeness)->toBe(ApprovalDocument::PARTIAL)
        ->and($released->missing_annexes)->toBe('Anlagen 1–15');

    // Off where it is already off writes nothing; the stored answer stays exactly as it was.
    $this->actingAs(answerAdmin(), 'admin')->post("/admin/gutachten/{$released->id}/vollstaendigkeit", ['complete' => false])->assertSessionHasNoErrors();

    expect($released->refresh()->completeness)->toBe(ApprovalDocument::PARTIAL)
        ->and($released->missing_annexes)->toBe('Anlagen 1–15')
        ->and(AuditLog::query()->where('description', 'approval.completeness_answered')->exists())->toBeFalse();
});

it('refuses it to whom may not release, on a revision the shop no longer reads, and without an answer', function (): void {
    $released = ApprovalDocument::factory()->unanswered()->create();
    $superseded = ApprovalDocument::factory()->unanswered()->create(['status' => 'superseded']);

    $this->actingAs(answerAdmin('support-agent'), 'admin')->post("/admin/gutachten/{$released->id}/vollstaendigkeit", ['complete' => true])->assertForbidden();
    $this->actingAs(answerAdmin(), 'admin')->post("/admin/gutachten/{$superseded->id}/vollstaendigkeit", ['complete' => true])->assertForbidden();
    $this->actingAs(answerAdmin(), 'admin')->post("/admin/gutachten/{$released->id}/vollstaendigkeit", [])
        ->assertSessionHasErrors(['complete' => 'Sag, ob alle Fahrzeuge dieses Gutachtens erfasst sind: an oder aus.']);

    expect([$released->refresh()->completeness, $superseded->refresh()->completeness])->toBe([null, null])
        ->and(AuditLog::query()->where('description', 'approval.completeness_answered')->exists())->toBeFalse();
});
