<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\AnfragenController;
use App\Models\AdminUser;
use App\Models\Vehicle;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/*
 * The admin audit's F-26 (ADMIN-AUDIT.md): Nachrichten and Anfragen stopped at the newest 200, with no way to the rest
 * and no search. Every entry is now reached page by page, and a search finds one by what a person remembers of it —
 * umlauts as typed, a car's key numbers as the papers print them.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

function listenAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

/** @return array<string, mixed> */
function listenProps(string $url): array
{
    return test()->actingAs(listenAdmin(), 'admin')->get($url)->assertOk()->viewData('page')['props'];
}

/** Contact messages, oldest first, as the form stores them. */
function listenMessages(int $count, string $subject = 'Frage zur Felge', ?string $name = null): void
{
    $rows = [];

    for ($i = 0; $i < $count; $i++) {
        $rows[] = [
            'name' => $name ?? "Kundin {$i}", 'email' => "kundin{$i}@example.de", 'subject' => $subject, 'message' => 'Passt die Felge?',
            'created_at' => now()->subMinutes($count - $i), 'updated_at' => now(),
        ];
    }

    DB::table('contact_messages')->insert($rows);
}

/** „Sag mir Bescheid“ subscriptions for one car, confirmed and waiting, oldest first. */
function listenSubscriptions(Vehicle $vehicle, int $count, string $prefix = 'wartet'): void
{
    $rows = [];

    for ($i = 0; $i < $count; $i++) {
        $rows[] = [
            'email' => "{$prefix}{$i}@example.de", 'vehicle_id' => $vehicle->id, 'confirm_token' => Str::random(64), 'unsubscribe_token' => Str::random(64),
            'confirmed_at' => now(), 'source' => 'test', 'created_at' => now()->subMinutes($count - $i), 'updated_at' => now(),
        ];
    }

    DB::table('fitment_subscriptions')->insert($rows);
}

it('reaches every unread message page by page, and finds one by a word with umlauts', function (): void {
    listenMessages(229);
    listenMessages(1, 'Größe 8,5J × 18', 'Jürgen Weiß');

    $first = listenProps('/admin/nachrichten');
    expect($first['count'])->toBe(230)
        ->and($first['items'])->toHaveCount(50)
        ->and($first['pagination'])->toMatchArray(['current' => 1, 'last' => 5, 'next' => '/admin/nachrichten?seite=2']);

    // The oldest — past the 200 the list once stopped at — on the last page.
    expect(array_column(listenProps('/admin/nachrichten?seite=5')['items'], 'email'))->toContain('kundin0@example.de');

    $found = listenProps('/admin/nachrichten?q='.rawurlencode('Weiß'));
    expect($found['count'])->toBe(1)->and($found['items'][0]['subject'])->toBe('Größe 8,5J × 18');
});

it('reaches every request page by page, and finds them by address or by the car\'s key numbers', function (): void {
    $asked = Vehicle::factory()->create(['hsn' => '0005', 'tsn' => 'ZZ8']);
    listenSubscriptions(Vehicle::factory()->create(['hsn' => '0603', 'tsn' => 'BJK']), 200);
    listenSubscriptions($asked, 30, 'golf');

    $first = listenProps('/admin/anfragen');
    expect($first['summary']['found'])->toBe(230)
        ->and($first['subscriptions'])->toHaveCount(50)
        ->and($first['pagination']['last'])->toBe(5)
        ->and(array_column(listenProps('/admin/anfragen?seite=5')['subscriptions'], 'email'))->toContain('wartet0@example.de');

    expect(listenProps('/admin/anfragen?q='.rawurlencode('0005/ZZ8'))['summary']['found'])->toBe(30)
        ->and(listenProps('/admin/anfragen?q='.rawurlencode('0005 zz8'))['summary']['found'])->toBe(30)
        ->and(listenProps('/admin/anfragen?q=golf7%40')['summary']['found'])->toBe(1);
});

it('counts every vehicle someone waits for beside the ranking of the most asked-for (the sweep after F-26)', function (): void {
    foreach (range(1, AnfragenController::DEMAND_SHOWN + 3) as $n) {
        listenSubscriptions(Vehicle::factory()->create(), $n, "auto{$n}-");
    }

    $props = listenProps('/admin/anfragen');

    expect($props['demand'])->toHaveCount(AnfragenController::DEMAND_SHOWN)
        ->and($props['demand'][0]['waiting'])->toBe(AnfragenController::DEMAND_SHOWN + 3)
        ->and($props['summary']['vehicles'])->toBe(AnfragenController::DEMAND_SHOWN + 3);
});
