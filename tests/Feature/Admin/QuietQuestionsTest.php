<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\Vehicle;
use App\Services\Admin\PermissionProbe;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;

/*
 * ADMIN-GEFUNDEN 509 (S2), fixed as a class: a screen asking which buttons to draw is a question, and its „no“ refuses
 * nobody — so nothing is written, on any screen that asks, for any role. An attempt the server refuses is written, once,
 * as before (docs/BUILD.md V3). Until the fix every view of a released Gutachten wrote two refusals and a read-only
 * account wrote up to three per screen: the Protokoll recorded events that never happened (RefusalPairTest).
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
});

function quietDenials(): int
{
    return AuditLog::query()->where('description', 'permission.denied')->count();
}

function quietAccount(string $role): AdminUser
{
    return AdminUser::query()->where('email', "{$role}@rimify.test")->firstOrFail();
}

it('asks the Policy quietly: the same answer as can(), a „no“ not written — and can() still writes it', function (): void {
    $agent = quietAccount('support-agent');
    $draft = ApprovalDocument::factory()->draft()->create();

    expect($agent->canQuietly('update', $draft))->toBeFalse()
        ->and(quietDenials())->toBe(0)
        ->and($agent->can('update', $draft))->toBeFalse()
        ->and(quietDenials())->toBe(1);
});

it('is quiet only inside the question: one that throws leaves the next refusal written', function (): void {
    $agent = quietAccount('support-agent');
    $draft = ApprovalDocument::factory()->draft()->create();

    expect(static fn () => PermissionProbe::quietly(static fn () => throw new RuntimeException('mid-question')))->toThrow(RuntimeException::class)
        ->and(PermissionProbe::asking())->toBeFalse();

    $agent->can('publish', $draft);

    expect(quietDenials())->toBe(1);
});

it('writes nothing refused when a read-only account opens a screen that asks what to offer', function (string $role, string $path): void {
    $this->actingAs(quietAccount($role), 'admin')->get($path)->assertOk();

    expect(quietDenials())->toBe(0);
})->with([
    'a draft Gutachten: Bearbeiten, Freigeben, Stufen' => ['support-agent', fn (): string => '/admin/gutachten/'.ApprovalDocument::factory()->draft()->create()->id],
    'a released Gutachten: Bearbeiten, Freigeben, Stufen' => ['support-agent', fn (): string => '/admin/gutachten/'.ApprovalDocument::factory()->create()->id],
    'an order: Versendet, Zugestellt' => ['support-agent', fn (): string => '/admin/bestellungen/'.Order::factory()->create()->id],
    'the brands: Neue Marke' => ['support-agent', fn (): string => '/admin/marken'],
    'the conflicts: Entscheiden' => ['support-agent', fn (): string => '/admin/konflikte'],
    'the demand list: Vormerken' => ['support-agent', fn (): string => '/admin/nachfrage'],
    'the reviews: Ausblenden' => ['support-agent', fn (): string => '/admin/bewertungen'],
    'the messages: Gelesen' => ['support-agent', fn (): string => '/admin/nachrichten'],
    'a vehicle: Bearbeiten' => ['catalogue-manager', fn (): string => '/admin/fahrzeuge/'.Vehicle::factory()->create()->id],
]);

it('still writes the attempt: the same account sending an edit to a Gutachten is refused, and that is written once', function (): void {
    $draft = ApprovalDocument::factory()->draft()->create();

    $this->actingAs(quietAccount('support-agent'), 'admin')->post("/admin/gutachten/{$draft->id}/zeilen", [])->assertForbidden();

    expect(quietDenials())->toBe(1);
});
