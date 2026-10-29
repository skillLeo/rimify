<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Services\Storefront\ProductJsonLd;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;

/*
 * The client's #19 as we promised it (D-344): stars and their count typed in the admin, per rim, shown under the rim's
 * name only beside the sentence that says where they come from. Never „Geprüfter Kauf“, never in the structured data,
 * never added to the buyers' own rating — and without that sentence there are no stars: the form refuses them, the
 * table refuses them, and the page renders none.
 */

beforeEach(function (): void {
    $this->seed([AccessSeeder::class, ReferenceDataSeeder::class]);
});

const STARS_ORIGIN = 'Bewertungen aus unserem eBay-Shop, Stand Oktober 2026.';

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

it('shows the stars typed in the admin under the rim\'s name, beside the sentence that says where they come from @kunde-19', function (): void {
    $wheel = starsWheel();

    putStars($this, $wheel, ['rating' => '4,9', 'count' => '13', 'origin' => STARS_ORIGIN])->assertSessionHasNoErrors()->assertSessionHas('toast');

    $this->get('/felgen/'.$wheel->slug)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('product.statedRating', ['label' => '4,9 (13 Bewertungen)', 'origin' => STARS_ORIGIN])
        // The buyers' own rating stays theirs: nothing typed is added to it, and no review appears.
        ->where('product.rating', null)
        ->where('product.ratingCount', 0)
        ->where('reviews', []));

    // The admin shows what is saved, the way it was typed.
    $this->actingAs(starsAdmin(), 'admin')->get("/admin/felgen/{$wheel->id}")->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('statedRating', ['rating' => '4,9', 'count' => '13', 'origin' => STARS_ORIGIN, 'label' => '4,9 (13 Bewertungen)'])
        ->where('can.rate', true));

    $entry = AuditLog::query()->where('description', 'wheel.rating_stated')->sole();
    expect($entry->causer_id)->toBe(starsAdmin()->id)
        ->and($entry->properties['label'] ?? null)->toBe('4,9 (13 Bewertungen)')
        ->and($entry->properties['origin'] ?? null)->toBe(STARS_ORIGIN);
});

it('reads the figures the German way — 4,9 or 4.9, and a count with a thousands point', function (): void {
    $wheel = starsWheel();

    putStars($this, $wheel, ['rating' => '4.5', 'count' => '1.234', 'origin' => '  '.STARS_ORIGIN.'  '])->assertSessionHasNoErrors();

    expect($wheel->refresh()->stated_rating)->toBe(4.5)
        ->and($wheel->stated_rating_count)->toBe(1234)
        ->and($wheel->stated_rating_origin)->toBe(STARS_ORIGIN);
});

it('refuses stars without their sentence, outside one to five, a count of nought, and a sentence that claims a check — and writes nothing', function (): void {
    $wheel = starsWheel();

    putStars($this, $wheel, ['rating' => '4,9', 'count' => '13', 'origin' => ''])->assertSessionHasErrors(['origin']);
    putStars($this, $wheel, ['rating' => '4,9', 'count' => '13', 'origin' => 'eBay'])->assertSessionHasErrors(['origin']);
    putStars($this, $wheel, ['rating' => '', 'count' => '13', 'origin' => STARS_ORIGIN])->assertSessionHasErrors(['rating']);
    putStars($this, $wheel, ['rating' => '5,1', 'count' => '13', 'origin' => STARS_ORIGIN])->assertSessionHasErrors(['rating']);
    putStars($this, $wheel, ['rating' => '0,9', 'count' => '13', 'origin' => STARS_ORIGIN])->assertSessionHasErrors(['rating']);
    putStars($this, $wheel, ['rating' => '4,95', 'count' => '13', 'origin' => STARS_ORIGIN])->assertSessionHasErrors(['rating']);
    putStars($this, $wheel, ['rating' => '4,9', 'count' => '0', 'origin' => STARS_ORIGIN])->assertSessionHasErrors(['count']);
    putStars($this, $wheel, ['rating' => '4,9', 'count' => 'viele', 'origin' => STARS_ORIGIN])->assertSessionHasErrors(['count']);

    // The shop has checked none of these: a sentence that says otherwise is refused, in words that say why.
    foreach (['Nur verifizierte Käufer aus unserem eBay-Shop.', 'Geprüfte Bewertungen aus unserem Laden.', 'Bewertungen echter Kunden aus unserem früheren Shop.', 'Alles Geprüfter Kauf bei eBay.'] as $claim) {
        putStars($this, $wheel, ['rating' => '4,9', 'count' => '13', 'origin' => $claim])
            ->assertSessionHasErrors(['origin' => 'Der Satz darf keine Prüfung behaupten – diese Sterne hat der Shop nicht geprüft. Nenne nur, woher sie stammen.']);
    }

    expect($wheel->refresh()->stated_rating)->toBeNull()
        ->and($wheel->stated_rating_count)->toBeNull()
        ->and($wheel->stated_rating_origin)->toBeNull()
        ->and(AuditLog::query()->where('description', 'wheel.rating_stated')->exists())->toBeFalse();

    // Saying that nothing was checked is not a claim of a check.
    putStars($this, $wheel, ['rating' => '4,9', 'count' => '13', 'origin' => 'Aus unserem eBay-Shop übernommen, von uns nicht geprüft.'])->assertSessionHasNoErrors();
    expect($wheel->refresh()->stated_rating_count)->toBe(13);
});

it('lets only who may change and publish the catalogue type stars — the order team may not', function (): void {
    $wheel = starsWheel();

    putStars($this, $wheel, ['rating' => '4,9', 'count' => '13', 'origin' => STARS_ORIGIN], 'order-manager')->assertForbidden();
    $this->actingAs(starsAdmin('order-manager'), 'admin')->delete("/admin/felgen/{$wheel->id}/sterne")->assertForbidden();
    expect($wheel->refresh()->stated_rating)->toBeNull();

    putStars($this, $wheel, ['rating' => '4,9', 'count' => '13', 'origin' => STARS_ORIGIN], 'catalogue-manager')->assertSessionHasNoErrors();
    expect($wheel->refresh()->stated_rating_count)->toBe(13);
});

it('takes the stars off again — the page shows none, and the Protokoll says who did', function (): void {
    $wheel = starsWheel();
    putStars($this, $wheel, ['rating' => '4,9', 'count' => '13', 'origin' => STARS_ORIGIN])->assertSessionHasNoErrors();

    $this->actingAs(starsAdmin(), 'admin')->delete("/admin/felgen/{$wheel->id}/sterne")->assertSessionHas('toast');

    expect($wheel->refresh()->stated_rating)->toBeNull()->and($wheel->stated_rating_origin)->toBeNull();
    $this->get('/felgen/'.$wheel->slug)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('product.statedRating', null));
    expect(AuditLog::query()->where('description', 'wheel.rating_removed')->sole()->properties['label'] ?? null)->toBe('4,9 (13 Bewertungen)');
});

it('never puts typed stars into the structured data — only the buyers\' own rating goes there', function (): void {
    $wheel = starsWheel();
    putStars($this, $wheel, ['rating' => '4,9', 'count' => '13', 'origin' => STARS_ORIGIN])->assertSessionHasNoErrors();
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

it('cannot hold stars without their sentence, even written past the form — the table refuses them', function (): void {
    $wheel = starsWheel();

    // The control: all three together are stored, and taken off together.
    $wheel->forceFill(['stated_rating' => 4.9, 'stated_rating_count' => 13, 'stated_rating_origin' => STARS_ORIGIN])->save();
    expect($wheel->refresh()->stated_rating_count)->toBe(13);
    $wheel->forceFill(['stated_rating' => null, 'stated_rating_count' => null, 'stated_rating_origin' => null])->save();

    expect(fn () => $wheel->refresh()->forceFill(['stated_rating' => 4.9, 'stated_rating_count' => 13, 'stated_rating_origin' => null])->save())->toThrow(QueryException::class);
    expect(fn () => $wheel->refresh()->forceFill(['stated_rating' => 4.9, 'stated_rating_count' => 13, 'stated_rating_origin' => '   '])->save())->toThrow(QueryException::class);
    expect(fn () => $wheel->refresh()->forceFill(['stated_rating' => 4.9, 'stated_rating_count' => null, 'stated_rating_origin' => STARS_ORIGIN])->save())->toThrow(QueryException::class);
    expect(fn () => $wheel->refresh()->forceFill(['stated_rating' => 5.5, 'stated_rating_count' => 13, 'stated_rating_origin' => STARS_ORIGIN])->save())->toThrow(QueryException::class);

    // And none of them is ever typed through mass assignment.
    expect((new WheelModel)->isFillable('stated_rating'))->toBeFalse()
        ->and((new WheelModel)->isFillable('stated_rating_count'))->toBeFalse()
        ->and((new WheelModel)->isFillable('stated_rating_origin'))->toBeFalse();
});
