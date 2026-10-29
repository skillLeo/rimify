<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Http\Controllers\Admin\MeistgekaufteFelgenController;
use App\Http\Controllers\Storefront\StartseiteController;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\Setting;
use App\Models\WheelConfig;
use App\Services\Storefront\ShelfPicks;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/*
 * The client's #5, „please show 8 rims“ (29.10.2026, D-353), on the homepage and in the admin: always eight — sales
 * first, then the team's picks (Inhalte › Meistgekaufte Felgen), then the newest — under a heading that claims nothing
 * the data does not hold.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, AccessSeeder::class, ContentSeeder::class]);
    // The seeded demonstration orders are not sales: none counts here.
    DB::table('orders')->update(['status' => OrderStatus::Cancelled->value]);
});

/** @return list<array<string, mixed>> the homepage shelf's cards */
function shelfOnHome(object $test, ?string &$title = null): array
{
    $cards = [];

    $test->get('/')->assertOk()->assertInertia(function (AssertableInertia $page) use (&$cards, &$title): AssertableInertia {
        $popular = $page->toArray()['props']['popular'];
        $cards = $popular['cards'];
        $title = $popular['title'];

        return $page;
    });

    return $cards;
}

/** Paid order lines for these models, `$times` each, within the 90 days. */
function sell(array $times): void
{
    foreach ($times as $model => $count) {
        $config = WheelConfig::query()->where('wheel_model_id', $model)->firstOrFail();

        for ($i = 0; $i < $count; $i++) {
            OrderLine::factory()->create(['order_id' => Order::factory()->create(['paid_at' => now()->subDays(2)]), 'wheel_config_id' => $config->id]);
        }
    }
}

/** @return list<int> published models, newest last: the ones a sale or a pick must lift */
function shelfModels(): array
{
    return DB::table('wheel_models')->where('status', 'published')->whereNull('deleted_at')->orderBy('created_at')->orderBy('id')->pluck('id')->map(fn ($id): int => (int) $id)->all();
}

it('shows eight with no sale: the picks first, under „Empfohlene Felgen“ — and „Neu im Shop“ with none', function (): void {
    $models = shelfModels();
    expect(count($models))->toBeGreaterThanOrEqual(10);

    $plain = shelfOnHome($this, $title);
    expect($plain)->toHaveCount(8)->and($title)->toBe(StartseiteController::NEWEST_LABEL);

    // Two of the oldest, picked: they lead.
    $picks = [$models[0].':'.WheelConfig::query()->where('wheel_model_id', $models[0])->value('wheel_finish_id'), $models[1].':'.WheelConfig::query()->where('wheel_model_id', $models[1])->value('wheel_finish_id')];
    Setting::set(ShelfPicks::KEY, $picks);

    $cards = shelfOnHome($this, $title);
    expect($cards)->toHaveCount(8)
        ->and(array_slice(array_column($cards, 'compareKey'), 0, 2))->toBe($picks)
        ->and($title)->toBe(StartseiteController::RECOMMENDED_LABEL)
        ->and(count(array_unique(array_column($cards, 'compareKey'))))->toBe(8);
});

it('shows eight with three sales: what sold first, most first, then the picks', function (): void {
    $models = shelfModels();
    [$a, $b, $pick] = [$models[0], $models[1], $models[2]];
    sell([$b => 2, $a => 1]);
    Setting::set(ShelfPicks::KEY, [$pick.':'.WheelConfig::query()->where('wheel_model_id', $pick)->value('wheel_finish_id')]);

    $cards = shelfOnHome($this, $title);
    $soldPart = array_values(array_filter($cards, fn (array $card): bool => in_array((int) $card['modelId'], [$a, $b], true)));
    $order = array_column($cards, 'modelId');

    expect($cards)->toHaveCount(8)
        ->and($title)->toBe(StartseiteController::BESTSELLING_LABEL)
        // Every colour of what sold, before anything else; the model sold twice before the one sold once.
        ->and(array_slice($order, 0, count($soldPart)))->toBe(array_column($soldPart, 'modelId'))
        ->and((int) $order[0])->toBe($b)
        ->and((int) $order[count($soldPart)])->toBe($pick);
});

it('shows eight with twelve sales — all of them what sold, by how often', function (): void {
    $models = shelfModels();
    // Twelve paid lines over six models: 4, 3, 2, 1, 1, 1.
    $times = [$models[0] => 4, $models[1] => 3, $models[2] => 2, $models[3] => 1, $models[4] => 1, $models[5] => 1];
    sell($times);

    $cards = shelfOnHome($this, $title);
    $counts = array_map(fn (array $card): int => $times[(int) $card['modelId']] ?? 0, $cards);

    expect(array_sum($times))->toBe(12)
        ->and($cards)->toHaveCount(8)
        ->and($title)->toBe(StartseiteController::BESTSELLING_LABEL)
        ->and(min($counts))->toBeGreaterThan(0)
        ->and($counts)->toBe(array_values(collect($counts)->sortDesc()->values()->all()));
});

it('shows the shelf as it stands in the admin, and keeps the picks a role with both rights saves', function (): void {
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $models = shelfModels();
    $keys = array_map(fn (int $model): string => $model.':'.WheelConfig::query()->where('wheel_model_id', $model)->value('wheel_finish_id'), array_slice($models, 0, 3));

    $this->actingAs($admin, 'admin')->get('/admin/meistgekaufte-felgen')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Admin/MeistgekaufteFelgen/Index')
        ->where('size', 8)
        ->has('shelf', 8)
        ->where('shelf.0.source', 'neu')
        ->where('picks', [])
        ->where('can.update', true));

    $this->actingAs($admin, 'admin')->from('/admin/meistgekaufte-felgen')->put('/admin/meistgekaufte-felgen', ['picks' => [$keys[2], '', $keys[0]]])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', MeistgekaufteFelgenController::SAVED);

    expect(ShelfPicks::keys())->toBe([$keys[2], $keys[0]])
        ->and(AuditLog::query()->where('description', 'home.shelf_picked')->count())->toBe(1);

    $this->actingAs($admin, 'admin')->get('/admin/meistgekaufte-felgen')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('picks', [$keys[2], $keys[0]])
        ->where('shelf.0.key', $keys[2])
        ->where('shelf.0.source', 'ausgewaehlt'));
});

it('refuses more than eight, a rim twice, and one not on sale — and the role without both rights', function (): void {
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $keys = array_map(fn (int $model): string => $model.':'.WheelConfig::query()->where('wheel_model_id', $model)->value('wheel_finish_id'), array_slice(shelfModels(), 0, 9));
    $put = fn (array $picks, ?AdminUser $as = null) => $this->actingAs($as ?? $admin, 'admin')->from('/admin/meistgekaufte-felgen')->put('/admin/meistgekaufte-felgen', ['picks' => $picks]);

    $put($keys)->assertSessionHasErrors(['picks' => 'Höchstens 8 Felgen – so viele zeigt der Bereich.']);
    $put([$keys[0], $keys[0]])->assertSessionHasErrors('picks.1');
    $put(['999999:1'])->assertSessionHasErrors('picks.0');
    expect(ShelfPicks::keys())->toBe([]);

    $support = AdminUser::query()->where('email', 'support-agent@rimify.test')->firstOrFail();
    $this->actingAs($support, 'admin')->get('/admin/meistgekaufte-felgen')->assertForbidden();
    $put([$keys[0]], $support)->assertForbidden();

    // The content team without the right to publish: it sees, it does not change the shop.
    $role = (int) DB::table('roles')->where('name', 'content-editor')->value('id');
    DB::table('role_permissions')->where('role_id', $role)->where('module', 'content')->where('action', 'publish')->update(['allowed' => false]);
    $editor = AdminUser::query()->where('email', 'content-editor@rimify.test')->firstOrFail();

    $this->actingAs($editor, 'admin')->get('/admin/meistgekaufte-felgen')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('can.update', false));
    $put([$keys[0]], $editor)->assertForbidden();
    expect(ShelfPicks::keys())->toBe([]);
});
