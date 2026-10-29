<?php

declare(strict_types=1);

use App\Enums\OrderLineKind;
use App\Enums\OrderStatus;
use App\Mail\ReviewInvitationMail;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\PaymentEvent;
use App\Models\Review;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Services\Commerce\Reviews\ReviewLink;
use App\Services\Commerce\Reviews\ReviewSummary;
use App\Services\Commerce\Reviews\ReviewWriter;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia;

/*
 * The client's #19 (D-103): reviews only a buyer can give. „Versendet“ and „Zugestellt“ in the admin; one invitation
 * some days after delivery, with a signed link; stars and an optional sentence per rim, once; the team hides with a
 * reason or answers, never writes one; the rating a page shows is computed from the visible reviews alone, and the
 * product page says how they are checked (§ 5b Abs. 3 UWG) — or, with none yet, what it can prove instead.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    config(['rimify.reviews.invite_after_days' => 7, 'rimify.reviews.link_days' => 60]);
});

function reviewAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** A real order with one rim line, in the given state. */
function reviewOrder(OrderStatus $status = OrderStatus::Paid, array $attributes = []): Order
{
    $config = WheelConfig::factory()->create();
    $order = Order::factory()->status($status)->create($attributes);

    OrderLine::factory()->create([
        'order_id' => $order->id,
        'kind' => OrderLineKind::Wheel->value,
        'wheel_config_id' => $config->id,
        'label' => 'Testfelge 8,5J × 19 · ET 35',
        'quantity' => 4,
    ]);

    return $order->fresh() ?? $order;
}

function deliveredOrder(int $daysAgo = 8): Order
{
    return reviewOrder(OrderStatus::Completed, ['delivered_at' => now()->subDays($daysAgo), 'shipped_at' => now()->subDays($daysAgo + 2)]);
}

it('marks an order shipped with its tracking number, then delivered — in that order, and in the Protokoll', function (): void {
    $order = reviewOrder();
    $admin = reviewAdmin();

    // Delivered before it was shipped: not a step this order can take.
    $this->actingAs($admin, 'admin')->post("/admin/bestellungen/{$order->id}/zugestellt")->assertForbidden();

    $this->actingAs($admin, 'admin')->post("/admin/bestellungen/{$order->id}/versendet", ['tracking' => '00340434 1234'])
        ->assertSessionHasNoErrors()->assertSessionHas('toast');

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::Shipped)->and($order->tracking_code)->toBe('00340434 1234')->and($order->shipped_at)->not->toBeNull();

    $this->actingAs($admin, 'admin')->post("/admin/bestellungen/{$order->id}/zugestellt")->assertSessionHas('toast');

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::Completed)->and($order->delivered_at)->not->toBeNull()
        ->and(AuditLog::query()->whereIn('description', ['order.shipped', 'order.delivered'])->pluck('description')->all())->toBe(['order.shipped', 'order.delivered']);
});

it('lets only a reader who may change orders mark one shipped', function (): void {
    $order = reviewOrder();

    $this->actingAs(reviewAdmin('support-agent'), 'admin')->post("/admin/bestellungen/{$order->id}/versendet")->assertForbidden();
    expect($order->refresh()->status)->toBe(OrderStatus::Paid);
});

it('invites each delivered order once, a week after delivery, and nobody else', function (): void {
    Mail::fake();

    $due = deliveredOrder(8);
    $young = deliveredOrder(2);
    $shipped = reviewOrder(OrderStatus::Shipped);

    $this->artisan('rimify:bewertungen-einladen')->assertSuccessful();
    $this->artisan('rimify:bewertungen-einladen')->assertSuccessful();

    Mail::assertSent(ReviewInvitationMail::class, 1);
    Mail::assertSent(ReviewInvitationMail::class, fn (ReviewInvitationMail $mail): bool => $mail->order->is($due) && $mail->wheels === ['Testfelge 8,5J × 19 · ET 35']);
    expect($due->refresh()->review_invited_at)->not->toBeNull()
        ->and($young->refresh()->review_invited_at)->toBeNull()
        ->and($shipped->refresh()->review_invited_at)->toBeNull();
});

it('opens the review page only through the signed link, and only for a delivered order', function (): void {
    $order = deliveredOrder();

    $this->get(ReviewLink::for($order))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Bewertung/Index')
            ->where('number', $order->order_number)
            ->where('lines.0.label', 'Testfelge 8,5J × 19 · ET 35')
            ->where('lines.0.review', null));

    // Without the signature, or with a changed one: refused.
    $this->get('/bewertung/'.$order->public_id)->assertForbidden();

    // A link for an order that was never delivered leads nowhere.
    $paid = reviewOrder();
    $this->get(ReviewLink::for($paid))->assertNotFound();
});

it('writes one verified review per rim, once, and the wheel\'s rating is what the visible reviews add up to @kunde-19', function (): void {
    $order = deliveredOrder();
    $line = $order->lines->first();
    $model = WheelConfig::query()->findOrFail($line->wheel_config_id)->wheel_model_id;
    $link = ReviewLink::for($order);

    $this->from($link)->post($link, ['reviews' => [$line->id => ['rating' => 5, 'body' => '  Passt perfekt, Eintragung ging schnell.  ']]])
        ->assertSessionHasNoErrors()->assertSessionHas('toast', 'Danke für deine Bewertung!');

    $review = Review::query()->sole();
    expect($review->rating)->toBe(5)->and($review->body)->toBe('Passt perfekt, Eintragung ging schnell.')->and($review->verified)->toBeTrue()
        ->and(WheelModel::query()->findOrFail($model)->rating)->toBe(5.0)
        ->and(WheelModel::query()->findOrFail($model)->rating_count)->toBe(1);

    // A second post changes nothing.
    $this->from($link)->post($link, ['reviews' => [$line->id => ['rating' => 1]]])->assertSessionHas('toast', 'Diese Felgen hast du schon bewertet – danke!');
    expect(Review::query()->count())->toBe(1)->and(Review::query()->sole()->rating)->toBe(5);
});

it('refuses a rating outside one to five stars, in a sentence', function (): void {
    $order = deliveredOrder();
    $link = ReviewLink::for($order);

    $this->from($link)->post($link, ['reviews' => [$order->lines->first()->id => ['rating' => 6]]])
        ->assertSessionHasErrors();
    expect(Review::query()->count())->toBe(0);
});

it('lets the team hide a review with a reason, show it again and answer it — and never write one @kunde-19', function (): void {
    $order = deliveredOrder();
    $line = $order->lines->first();
    $link = ReviewLink::for($order);
    $this->from($link)->post($link, ['reviews' => [$line->id => ['rating' => 2, 'body' => 'Werbung für etwas anderes.']]]);
    $review = Review::query()->sole();
    $admin = reviewAdmin();

    // Without a reason: refused, in a sentence.
    $this->actingAs($admin, 'admin')->post("/admin/bewertungen/{$review->id}/ausblenden", ['reason' => ''])
        ->assertSessionHasErrors(['reason' => 'Schreib dazu, warum die Bewertung ausgeblendet wird – der Grund bleibt bei ihr.']);

    $this->actingAs($admin, 'admin')->post("/admin/bewertungen/{$review->id}/ausblenden", ['reason' => 'Nicht zur Felge, sondern Werbung.'])->assertSessionHas('toast');
    expect($review->refresh()->isHidden())->toBeTrue()
        ->and($review->wheelModel?->refresh()->rating)->toBeNull()
        ->and($review->wheelModel?->rating_count)->toBe(0);

    $this->actingAs($admin, 'admin')->post("/admin/bewertungen/{$review->id}/einblenden")->assertSessionHas('toast');
    $this->actingAs($admin, 'admin')->put("/admin/bewertungen/{$review->id}/antwort", ['reply' => 'Danke für den Hinweis!'])->assertSessionHas('toast');

    expect($review->refresh()->isHidden())->toBeFalse()->and($review->reply)->toBe('Danke für den Hinweis!')
        ->and($review->wheelModel?->refresh()->rating_count)->toBe(1);

    // Reading is not changing: Support sees the list, cannot hide.
    $this->actingAs(reviewAdmin('support-agent'), 'admin')->get('/admin/bewertungen')->assertOk();
    $this->actingAs(reviewAdmin('support-agent'), 'admin')->post("/admin/bewertungen/{$review->id}/ausblenden", ['reason' => 'Darf ich nicht.'])->assertForbidden();

    // There is no route that writes a review, and no form field that types a rating.
    $this->actingAs($admin, 'admin')->post('/admin/bewertungen', ['rating' => 5])->assertStatus(405);
    expect((new WheelModel)->isFillable('rating'))->toBeFalse()->and((new WheelModel)->isFillable('rating_count'))->toBeFalse();
});

it('lets only a purchase paid for real be reviewed — never a test-mode payment, the review sandbox, a demo or a purged order @kunde-19', function (): void {
    Mail::fake();
    $event = static fn (Order $order, bool $live): PaymentEvent => PaymentEvent::query()->create([
        'provider' => 'stripe', 'event_id' => 'evt_'.$order->id.($live ? '_live' : '_test'), 'type' => 'payment_intent.succeeded', 'livemode' => $live,
        'payload' => '{}', 'order_id' => $order->id, 'received_at' => now(),
    ]);

    $paidInTest = deliveredOrder();
    $event($paidInTest, false);
    $sandbox = deliveredOrder();
    $sandbox->forceFill(['payment_method' => 'sandbox'])->save();
    $real = deliveredOrder();
    $event($real, true);
    // Partly refunded and delivered: invited like any other (OrderFulfilment), so its link must open as well.
    $partly = reviewOrder(OrderStatus::PartiallyRefunded, ['delivered_at' => now()->subDays(8), 'shipped_at' => now()->subDays(10)]);

    expect(ReviewWriter::open($paidInTest->refresh()))->toBeFalse()
        ->and(ReviewWriter::open($sandbox->refresh()))->toBeFalse()
        ->and(ReviewWriter::open($real->refresh()))->toBeTrue()
        ->and(ReviewWriter::open($partly->refresh()))->toBeTrue();

    $this->get(ReviewLink::for($paidInTest))->assertNotFound();
    $this->get(ReviewLink::for($sandbox))->assertNotFound();
    $this->get(ReviewLink::for($real))->assertOk();
    $this->get(ReviewLink::for($partly))->assertOk();

    // A purged order has no page: its signed link answers as any order that is not there (its own id, D-354).
    $gone = $real->replicate()->forceFill(['order_number' => 'RMF-2099-99999', 'public_id' => (string) Str::uuid()]);
    $this->get(ReviewLink::for($gone))->assertNotFound();

    // The invitations follow the same rule: one each for the real purchase and the partly refunded one, none else.
    $this->artisan('rimify:bewertungen-einladen')->assertSuccessful();
    Mail::assertSent(ReviewInvitationMail::class, 2);
    expect($real->refresh()->review_invited_at)->not->toBeNull()
        ->and($partly->refresh()->review_invited_at)->not->toBeNull()
        ->and($paidInTest->refresh()->review_invited_at)->toBeNull()
        ->and($sandbox->refresh()->review_invited_at)->toBeNull();
});

it('rounds the average to one decimal, half away from zero, without a float', function (): void {
    expect(ReviewSummary::oneDecimal(97, 20))->toBe(4.9)   // 4,85
        ->and(ReviewSummary::oneDecimal(9, 2))->toBe(4.5)
        ->and(ReviewSummary::oneDecimal(14, 3))->toBe(4.7); // 4,666…
});

it('shows a wheel without reviews no stars, and a wheel with reviews its average, its count and how they are checked @kunde-19', function (): void {
    $this->seed(ReferenceDataSeeder::class);
    $order = deliveredOrder();
    $line = $order->lines->first();
    $model = WheelModel::query()->findOrFail(WheelConfig::query()->findOrFail($line->wheel_config_id)->wheel_model_id);
    $model->forceFill(['status' => 'published'])->save();

    $this->get('/felgen/'.$model->slug)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('product.rating', null)
        ->where('product.ratingCount', 0)
        ->where('reviews', [])
        ->has('product.proof.gutachten')
        ->has('product.proof.variants'));

    $link = ReviewLink::for($order);
    $this->from($link)->post($link, ['reviews' => [$line->id => ['rating' => 4, 'body' => 'Sehr gut.']]]);

    $this->get('/felgen/'.$model->slug)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('product.rating', 4)
        ->where('product.ratingCount', 1)
        ->where('product.ratingLabel', '4,0 (1 Bewertung)')
        ->where('reviews.0.rating', 4)
        ->where('reviews.0.body', 'Sehr gut.'));
});
