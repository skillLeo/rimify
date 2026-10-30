<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Setting;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Services\Admin\Catalogue\StatedRatings;
use App\Services\Storefront\ProductJsonLd;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;

/*
 * The client's #19 as he decided it in writing on 29.10.2026 — „Please just take it live. We will contact a lawyer to
 * ask him about the details.“ (D-345): stars and their count typed in the admin per rim, shown under the rim's name on
 * the listing and the product page, with one shop-wide sentence beside them (§ 5b Abs. 3 UWG) whose default is agreed
 * and which can be reworded. Emptied, no typed stars render anywhere. Never „Geprüfter Kauf“, never in the structured
 * data, never added to the buyers' own rating.
 */

beforeEach(function (): void {
    $this->seed([AccessSeeder::class, ReferenceDataSeeder::class]);
});

const STARS_DEFAULT = 'Bewertungen aus anderen Quellen, vom Shop übernommen und nicht auf einen Kauf geprüft.';

function starsAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** A published rim with one size, as the shop sells it. */
function starsWheel(): WheelModel
{
    $config = WheelConfig::factory()->create();
    $wheel = WheelModel::query()->findOrFail($config->wheel_model_id);
    $wheel->forceFill(['status' => 'published'])->save();

    return $wheel->refresh();
}

/** @param  array<string, string>  $data */
function putStars(object $test, WheelModel $wheel, array $data, string $role = 'super-admin'): TestResponse
{
    return $test->actingAs(starsAdmin($role), 'admin')->put("/admin/felgen/{$wheel->id}/sterne", $data);
}

/** @return array<string, mixed>|null the wheel's card on the listing without a car */
function starsCard(object $test, WheelModel $wheel): ?array
{
    $cards = $test->get('/felgen')->assertOk()->viewData('page')['props']['cards'] ?? [];

    return collect($cards)->firstWhere('modelId', $wheel->id);
}

it('shows the stars typed in the admin under the rim\'s name, on the listing and the product page, with the agreed sentence beside them @kunde-19', function (): void {
    $wheel = starsWheel();

    putStars($this, $wheel, ['rating' => '4,9', 'count' => '13'])->assertSessionHasNoErrors()->assertSessionHas('toast');

    $shown = ['label' => '4,9 (13 Bewertungen)', 'disclosure' => STARS_DEFAULT];
    $this->get('/felgen/'.$wheel->slug)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('product.statedRating', $shown)
        // The buyers' own rating stays theirs: nothing typed is added to it, and no review appears.
        ->where('product.rating', null)
        ->where('product.ratingCount', 0)
        ->where('reviews', []));
    expect(starsCard($this, $wheel)['statedRating'] ?? null)->toBe($shown);

    // The admin shows what is saved, the way it was typed, and the sentence with its default.
    $this->actingAs(starsAdmin(), 'admin')->get("/admin/felgen/{$wheel->id}")->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('statedRating', ['rating' => '4,9', 'count' => '13', 'label' => '4,9 (13 Bewertungen)'])
        ->where('statedDisclosure', ['text' => STARS_DEFAULT, 'default' => STARS_DEFAULT])
        ->where('can.rate', true));

    $entry = AuditLog::query()->where('description', 'wheel.rating_stated')->sole();
    expect($entry->causer_id)->toBe(starsAdmin()->id)->and($entry->properties['label'] ?? null)->toBe('4,9 (13 Bewertungen)');
});

it('says beside the stars what the sentence says once it is reworded, and shows none anywhere once it is emptied', function (): void {
    $wheel = starsWheel();
    putStars($this, $wheel, ['rating' => '4,5', 'count' => '2'])->assertSessionHasNoErrors();

    $this->actingAs(starsAdmin(), 'admin')->put('/admin/felgen/sterne-hinweis', ['disclosure' => '  Übernommen aus unserem eBay-Shop;  nicht von uns geprüft.  '])
        ->assertSessionHasNoErrors()->assertSessionHas('toast');
    expect(StatedRatings::disclosure())->toBe('Übernommen aus unserem eBay-Shop; nicht von uns geprüft.');
    $this->get('/felgen/'.$wheel->slug)->assertInertia(fn (AssertableInertia $page) => $page
        ->where('product.statedRating.disclosure', 'Übernommen aus unserem eBay-Shop; nicht von uns geprüft.'));

    $this->actingAs(starsAdmin(), 'admin')->put('/admin/felgen/sterne-hinweis', ['disclosure' => ''])->assertSessionHasNoErrors();

    // No statement, no stars — on the product page and on the listing; the figures stay saved for when one is given.
    $this->get('/felgen/'.$wheel->slug)->assertInertia(fn (AssertableInertia $page) => $page->where('product.statedRating', null));
    $card = starsCard($this, $wheel);
    expect($card)->toHaveKey('statedRating')
        ->and($card['statedRating'] ?? null)->toBeNull()
        ->and($wheel->refresh()->stated_rating_count)->toBe(2)
        ->and(AuditLog::query()->where('description', 'reviews.disclosure_changed')->count())->toBe(2);

    // Never set at all, the agreed default stands.
    Setting::query()->whereKey(StatedRatings::DISCLOSURE_SETTING)->delete();
    expect(StatedRatings::disclosure())->toBe(STARS_DEFAULT);
});

it('reads the figures the German way — 4,9 or 4.9, and a count with a thousands point', function (): void {
    $wheel = starsWheel();

    putStars($this, $wheel, ['rating' => '4.5', 'count' => '1.234'])->assertSessionHasNoErrors();

    expect($wheel->refresh()->stated_rating)->toBe(4.5)->and($wheel->stated_rating_count)->toBe(1234);
});

it('refuses stars without a count, outside one to five, with two decimals, and a count of nought — and writes nothing', function (): void {
    $wheel = starsWheel();

    putStars($this, $wheel, ['rating' => '', 'count' => '13'])->assertSessionHasErrors(['rating' => 'Trag die Sterne ein, etwa 4,8.']);
    putStars($this, $wheel, ['rating' => '4,9', 'count' => ''])->assertSessionHasErrors(['count' => 'Trag ein, auf wie vielen Bewertungen die Sterne beruhen.']);
    putStars($this, $wheel, ['rating' => '5,1', 'count' => '13'])->assertSessionHasErrors(['rating']);
    putStars($this, $wheel, ['rating' => '0,9', 'count' => '13'])->assertSessionHasErrors(['rating']);
    putStars($this, $wheel, ['rating' => '4,95', 'count' => '13'])->assertSessionHasErrors(['rating']);
    putStars($this, $wheel, ['rating' => '4,9', 'count' => '0'])->assertSessionHasErrors(['count' => 'Die Zahl der Bewertungen ist eine ganze Zahl ab 1.']);
    putStars($this, $wheel, ['rating' => '4,9', 'count' => 'viele'])->assertSessionHasErrors(['count']);
    $this->actingAs(starsAdmin(), 'admin')->put('/admin/felgen/sterne-hinweis', ['disclosure' => str_repeat('x', 201)])->assertSessionHasErrors(['disclosure']);

    expect($wheel->refresh()->stated_rating)->toBeNull()
        ->and($wheel->stated_rating_count)->toBeNull()
        ->and(AuditLog::query()->whereIn('description', ['wheel.rating_stated', 'reviews.disclosure_changed'])->exists())->toBeFalse()
        ->and(StatedRatings::disclosure())->toBe(STARS_DEFAULT);
});

it('lets only who may change and publish the catalogue type stars or word their sentence — the order team may not', function (): void {
    $wheel = starsWheel();

    putStars($this, $wheel, ['rating' => '4,9', 'count' => '13'], 'order-manager')->assertForbidden();
    $this->actingAs(starsAdmin('order-manager'), 'admin')->delete("/admin/felgen/{$wheel->id}/sterne")->assertForbidden();
    $this->actingAs(starsAdmin('order-manager'), 'admin')->put('/admin/felgen/sterne-hinweis', ['disclosure' => ''])->assertForbidden();
    expect($wheel->refresh()->stated_rating)->toBeNull()->and(StatedRatings::disclosure())->toBe(STARS_DEFAULT);

    putStars($this, $wheel, ['rating' => '4,9', 'count' => '13'], 'catalogue-manager')->assertSessionHasNoErrors();
    expect($wheel->refresh()->stated_rating_count)->toBe(13);
});

it('takes the stars off again — the page shows none, and the Protokoll says who did', function (): void {
    $wheel = starsWheel();
    putStars($this, $wheel, ['rating' => '4,9', 'count' => '13'])->assertSessionHasNoErrors();

    $this->actingAs(starsAdmin(), 'admin')->delete("/admin/felgen/{$wheel->id}/sterne")->assertSessionHas('toast');

    expect($wheel->refresh()->stated_rating)->toBeNull();
    $this->get('/felgen/'.$wheel->slug)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('product.statedRating', null));
    expect(AuditLog::query()->where('description', 'wheel.rating_removed')->sole()->properties['label'] ?? null)->toBe('4,9 (13 Bewertungen)');
});

it('never puts typed stars into the structured data, and never calls them a checked purchase — only the buyers\' own rating goes there', function (): void {
    $wheel = starsWheel();
    putStars($this, $wheel, ['rating' => '4,9', 'count' => '13'])->assertSessionHasNoErrors();
    // The precondition: the stars are there, and the page shows them.
    expect($wheel->refresh()->stated_rating_count)->toBe(13);
    $this->get('/felgen/'.$wheel->slug)->assertInertia(fn (AssertableInertia $page) => $page->where('product.statedRating.label', '4,9 (13 Bewertungen)'));

    expect(ProductJsonLd::for($wheel, 'https://rimify.test/felgen/'.$wheel->slug))->not->toHaveKey('aggregateRating');
    $this->get('/felgen/'.$wheel->slug)->assertOk()->assertDontSee('aggregateRating', false)->assertDontSee('Geprüfter Kauf', false);

    // With buyers' reviews as well (ReviewSummary writes these two), the structured data carries theirs alone.
    $wheel->forceFill(['rating' => 4.5, 'rating_count' => 2])->save();
    expect(ProductJsonLd::for($wheel->refresh(), 'https://rimify.test/felgen/'.$wheel->slug)['aggregateRating'] ?? null)
        ->toBe(['@type' => 'AggregateRating', 'ratingValue' => '4.5', 'reviewCount' => 2, 'bestRating' => '5', 'worstRating' => '1']);
});

it('cannot hold a rating without its count, even written past the form — the table refuses it', function (): void {
    $wheel = starsWheel();

    // The control: both together are stored, and taken off together.
    $wheel->forceFill(['stated_rating' => 4.9, 'stated_rating_count' => 13])->save();
    expect($wheel->refresh()->stated_rating_count)->toBe(13);
    $wheel->forceFill(['stated_rating' => null, 'stated_rating_count' => null])->save();

    expect(fn () => $wheel->refresh()->forceFill(['stated_rating' => 4.9, 'stated_rating_count' => null])->save())->toThrow(QueryException::class);
    expect(fn () => $wheel->refresh()->forceFill(['stated_rating' => null, 'stated_rating_count' => 13])->save())->toThrow(QueryException::class);
    expect(fn () => $wheel->refresh()->forceFill(['stated_rating' => 5.5, 'stated_rating_count' => 13])->save())->toThrow(QueryException::class);
    expect(fn () => $wheel->refresh()->forceFill(['stated_rating' => 4.0, 'stated_rating_count' => 0])->save())->toThrow(QueryException::class);

    // And neither is ever typed through mass assignment.
    expect((new WheelModel)->isFillable('stated_rating'))->toBeFalse()
        ->and((new WheelModel)->isFillable('stated_rating_count'))->toBeFalse();
});
