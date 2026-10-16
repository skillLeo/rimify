<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\ConditionLevel;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Domain\Storefront\VehicleContext;
use App\Models\AdminUser;
use App\Models\DocumentCondition;
use App\Models\Fitment;
use App\Models\WheelConfig;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Inertia\Testing\AssertableInertia;

/*
 * The client's #23 from the admin to the shop: a level set on a Gutachten's Auflage moves the label the product page
 * gives the answer — „Freigegeben“ at Hinweis, „Mit Auflagen“ at Auflage and at Nicht zulässig (D-104, D-247) — on the
 * next view, nothing cached in between. The acceptance set cannot show it (every answer there that reads „Mit Auflagen“
 * needs an Eintragung, ADMIN-GEFUNDEN 512); the seeded catalogue can: an answer whose one loud Auflage is a Befestigung.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, AccessSeeder::class]);
});

it('moves the product page\'s label as the admin sets the level — Hinweis „Freigegeben“, Auflage and Nicht zulässig „Mit Auflagen“ @kunde-23', function (): void {
    $resolver = app(FitmentResolver::class);
    $found = null;

    // An answer one level can move: conditional, no Eintragung, the tyres permitted, nothing missing, one document —
    // and exactly one Auflage louder than a Hinweis, of a kind that may be one.
    foreach (Fitment::query()->where('status', 'published')->select(['vehicle_id', 'wheel_config_id'])->distinct()->limit(400)->get() as $row) {
        $verdict = $resolver->resolve((int) $row->vehicle_id, (int) $row->wheel_config_id);

        if ($verdict->status !== VerdictStatus::Conditional || $verdict->requiresEntry || $verdict->missingFacts !== [] || $verdict->documents !== []
            || $verdict->document === null || ($verdict->tyre !== null && $verdict->tyre->status !== VerdictStatus::Permitted)) {
            continue;
        }

        $loud = array_values(array_filter($verdict->conditions, static fn ($c): bool => $c->level() !== ConditionLevel::Hinweis));

        if (count($loud) === 1 && ConditionLevel::floorFor($loud[0]->kind) === ConditionLevel::Hinweis) {
            $found = [(int) $row->vehicle_id, (int) $row->wheel_config_id, $verdict->document->id, $loud[0]->code];
            break;
        }
    }

    expect($found)->not->toBeNull();
    [$vehicleId, $configId, $documentId, $code] = $found;
    $condition = DocumentCondition::query()->where('approval_document_id', $documentId)->where('code', $code)->firstOrFail();
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $slug = WheelConfig::query()->findOrFail($configId)->wheelModel->slug;

    $label = function () use ($vehicleId, $configId, $slug): array {
        $shown = [];

        $this->withCookies([VehicleContext::COOKIE => (new VehicleContext($vehicleId, true))->encode()])
            ->get("/felgen/{$slug}?groesse={$configId}")
            ->assertOk()
            ->assertInertia(function (AssertableInertia $page) use ($configId, &$shown): AssertableInertia {
                $row = collect($page->toArray()['props']['configs'])->firstWhere('id', $configId);
                $shown = [$row['verdict']['status'], $row['verdict']['notesOnly'], $row['verdict']['label']];

                return $page;
            });

        return $shown;
    };

    $set = fn (string $level) => $this->actingAs($admin, 'admin')
        ->put("/admin/gutachten/{$documentId}/auflagen/{$condition->id}/stufe", ['level' => $level])
        ->assertSessionHasNoErrors();

    expect($label())->toBe(['CONDITIONAL', false, 'Freigegeben mit Auflagen']);

    $set('hinweis');
    expect($label())->toBe(['CONDITIONAL', true, 'Freigegeben']);

    $set('nicht_zulaessig');
    expect($label())->toBe(['CONDITIONAL', false, 'Freigegeben mit Auflagen']);

    $set('auflage');
    expect($label())->toBe(['CONDITIONAL', false, 'Freigegeben mit Auflagen']);
});
