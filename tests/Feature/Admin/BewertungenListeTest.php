<?php

declare(strict_types=1);

use App\Enums\OrderLineKind;
use App\Enums\OrderStatus;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\Review;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;

/*
 * The admin audit's F-26 and F-28 (ADMIN-AUDIT.md): Verkauf › Bewertungen stopped at the newest 200 with no way on and
 * said „200 Bewertungen“ of a thousand — an older review could never be hidden or answered. Now every review is reached
 * page by page, the count is the real one, and a search finds one by its order, its Felge or a word. Saving an empty
 * answer on a review that has none said „Antwort entfernt.“; it now says nothing was saved, and writes nothing.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

function listeAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

/**
 * Reviews written as the signed link writes them, one per rim line of one delivered order, oldest first.
 *
 * @param  list<string|null>  $bodies
 * @return list<int> the review ids, oldest first
 */
function listeReviews(array $bodies, string $wheelName = 'Testmodell'): array
{
    $model = WheelModel::factory()->create(['name' => $wheelName, 'is_demo' => false]);
    $config = WheelConfig::factory()->create(['wheel_model_id' => $model->id]);
    $order = Order::factory()->status(OrderStatus::Completed)->create(['delivered_at' => now()->subDays(9)]);
    $ids = [];

    foreach ($bodies as $i => $body) {
        $line = OrderLine::factory()->create(['order_id' => $order->id, 'kind' => OrderLineKind::Wheel->value, 'wheel_config_id' => $config->id, 'label' => 'Testfelge', 'quantity' => 4]);
        $ids[] = (int) DB::table('reviews')->insertGetId([
            'order_id' => $order->id, 'order_line_id' => $line->id, 'wheel_model_id' => $model->id, 'rating' => 4,
            'body' => $body, 'verified' => true, 'created_at' => now()->subMinutes(count($bodies) - $i), 'updated_at' => now(),
        ]);
    }

    return $ids;
}

/** @return array<string, mixed> */
function listeProps(string $query = ''): array
{
    return test()->actingAs(listeAdmin(), 'admin')->get('/admin/bewertungen'.$query)->assertOk()->viewData('page')['props'];
}

it('reaches every review page by page and says how many there are', function (): void {
    $ids = listeReviews(array_fill(0, 230, null));

    $first = listeProps();
    expect($first['found'])->toBe(230)
        ->and($first['items'])->toHaveCount(50)
        ->and($first['pagination'])->toMatchArray(['current' => 1, 'last' => 5, 'total' => 230, 'prev' => null, 'next' => '/admin/bewertungen?seite=2']);

    // The oldest — past the 200 the list once stopped at — on the last page, and it can be answered.
    $last = listeProps('?seite=5');
    expect(array_column($last['items'], 'id'))->toContain($ids[0])->toHaveCount(30);

    $this->actingAs(listeAdmin(), 'admin')->put("/admin/bewertungen/{$ids[0]}/antwort", ['reply' => 'Danke für deine Bewertung!'])->assertSessionHas('toast');
    expect(Review::query()->find($ids[0])?->reply)->toBe('Danke für deine Bewertung!');
});

it('finds a review by a word with umlauts, by its Felge and by its order number, and keeps the search across pages', function (): void {
    listeReviews(['Größe passt, Grüße aus Weißenfels!', 'Schnell geliefert.'], 'Straße 18');
    listeReviews(array_fill(0, 60, 'Passt.'), 'Andere');
    $order = Review::query()->firstOrFail()->order;

    expect(array_column(listeProps('?q=Gr%C3%BC%C3%9Fe')['items'], 'body'))->toBe(['Größe passt, Grüße aus Weißenfels!'])
        ->and(listeProps('?q=Stra%C3%9Fe')['found'])->toBe(2)
        ->and(listeProps('?q='.rawurlencode((string) $order?->order_number))['found'])->toBe(2);

    $paged = listeProps('?q=Passt');
    expect($paged['found'])->toBe(61)
        ->and($paged['pagination']['next'])->toBe('/admin/bewertungen?q=Passt&seite=2');
});

it('says an empty answer saved nothing when there was none, and removes one that was there', function (): void {
    [$id] = listeReviews(['Gut.']);

    $this->actingAs(listeAdmin(), 'admin')->put("/admin/bewertungen/{$id}/antwort", ['reply' => ''])
        ->assertSessionHas('toast', 'Die Antwort ist leer – gespeichert wurde nichts.');
    expect(AuditLog::query()->where('description', 'like', 'review.%')->count())->toBe(0);

    $this->actingAs(listeAdmin(), 'admin')->put("/admin/bewertungen/{$id}/antwort", ['reply' => 'Danke!'])->assertSessionHas('toast');
    $this->actingAs(listeAdmin(), 'admin')->put("/admin/bewertungen/{$id}/antwort", ['reply' => ''])->assertSessionHas('toast', 'Antwort entfernt.');
    expect(Review::query()->find($id)?->reply)->toBeNull();
});
