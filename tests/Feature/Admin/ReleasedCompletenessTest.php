<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Inertia\Testing\AssertableInertia;

/*
 * ADMIN-GEFUNDEN 513: „Ist alles erfasst?“ answered for a document already released (D-227). The answer asked the
 * release's right — `publish` — which only a draft passes, so no released document could be answered: the button never
 * showed, the request answered 403, and the go-live check waited for an answer nobody could give. Its own right now:
 * who may release may answer it, on the released revision.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
});

function answerAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', "{$role}@rimify.test")->firstOrFail();
}

it('lets who may release answer it for a released document — recorded, in the Protokoll, and offered on its page', function (): void {
    $released = ApprovalDocument::factory()->create();

    $this->actingAs(answerAdmin(), 'admin')->get("/admin/gutachten/{$released->id}")->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('can.answer', true));

    $this->actingAs(answerAdmin(), 'admin')->post("/admin/gutachten/{$released->id}/vollstaendigkeit", ['completeness' => 'partial', 'missing' => 'Anlagen 1–15'])
        ->assertSessionHasNoErrors();

    $released->refresh();
    expect($released->completeness)->toBe('partial')
        ->and($released->missing_annexes)->toBe('Anlagen 1–15')
        ->and(AuditLog::query()->where('description', 'approval.completeness_answered')->exists())->toBeTrue();
});

it('refuses it to whom may not release, and on a draft — that is answered at its release', function (): void {
    $released = ApprovalDocument::factory()->create();
    $draft = ApprovalDocument::factory()->draft()->create();
    $before = [$released->completeness, $draft->completeness];

    $this->actingAs(answerAdmin('support-agent'), 'admin')->post("/admin/gutachten/{$released->id}/vollstaendigkeit", ['completeness' => 'unknown'])->assertForbidden();
    $this->actingAs(answerAdmin(), 'admin')->post("/admin/gutachten/{$draft->id}/vollstaendigkeit", ['completeness' => 'unknown'])->assertForbidden();

    expect([$released->refresh()->completeness, $draft->refresh()->completeness])->toBe($before)
        ->and(AuditLog::query()->where('description', 'approval.completeness_answered')->exists())->toBeFalse();
});
