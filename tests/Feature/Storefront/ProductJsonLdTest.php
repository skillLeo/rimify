<?php

declare(strict_types=1);

use App\Models\Brand;
use App\Models\Setting;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Storefront\ProductJsonLd;
use App\Support\Shipping;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Testing\TestResponse;

/*
 * His admin item 14 (D-305): every Felge's page carries its structured data for search engines — schema.org JSON-LD in
 * the head, a ProductGroup with one Product per size and colour, each with its own Offer. Only what is on record goes in:
 * no rating without buyers' visible reviews, no shipping without a price, never the outline drawing as an image, nothing
 * for example data — and no text can break out of the block.
 */

beforeEach(function (): void {
    $this->seed(ReferenceDataSeeder::class);
});

/** @return array<string, mixed>|null the JSON-LD of a page, or null where it has none */
function jsonLdOf(TestResponse $response): ?array
{
    if (preg_match('#<script type="application/ld\+json">(.+?)</script>#s', (string) $response->getContent(), $match) !== 1) {
        return null;
    }

    $data = json_decode($match[1], true, flags: JSON_THROW_ON_ERROR);

    return is_array($data) ? $data : null;
}

/** A real Felge in two sizes of one colour, the second not available, the first with an EAN and a photograph. */
function jsonLdFelge(array $model = []): WheelModel
{
    $brand = Brand::query()->where('name', 'Prüfrad')->first() ?? Brand::factory()->named('Prüfrad')->create();
    $wheel = WheelModel::factory()->for($brand)->create(['name' => 'Kontur', 'type_designation' => 'KT85', 'description_de' => 'Zehn Speichen.', ...$model]);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $wheel->id, 'name_de' => 'Silber', 'image_manifest' => [
        'base' => '/storage/product-images/wheels/kontur/silber', 'widths' => [480, 960], 'fallback' => 'jpg', 'formats' => ['avif'], 'kind' => 'photo',
    ]]);
    WheelConfig::factory()->create(['wheel_model_id' => $wheel->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 18.0, 'width_in' => 8.5, 'et_mm' => 35, 'sku' => 'PR-KT-18-'.$wheel->id, 'ean' => '4012345678901', 'price_cents' => 18_950, 'available' => true]);
    WheelConfig::factory()->create(['wheel_model_id' => $wheel->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 19.0, 'width_in' => 9.0, 'et_mm' => 40, 'sku' => 'PR-KT-19-'.$wheel->id, 'ean' => null, 'price_cents' => 21_900, 'available' => false]);

    return $wheel->refresh();
}

it('carries a ProductGroup with one Product and Offer per size, as the page shows them @admin-214', function (): void {
    $wheel = jsonLdFelge();
    $data = jsonLdOf($this->get('/felgen/'.$wheel->slug)->assertOk());

    expect($data)->not->toBeNull()
        ->and($data['@context'])->toBe('https://schema.org')
        ->and($data['@type'])->toBe('ProductGroup')
        // The name the shop shows: brand, model, Radtypenbezeichnung (D-298).
        ->and($data['name'])->toBe('Prüfrad Kontur KT85')
        ->and($data['brand'])->toBe(['@type' => 'Brand', 'name' => 'Prüfrad'])
        ->and($data['description'])->toBe('Zehn Speichen.')
        ->and($data['url'])->toEndWith('/felgen/'.$wheel->slug)
        ->and($data['image'])->toBe([url('/storage/product-images/wheels/kontur/silber-960.jpg')])
        ->and($data['variesBy'])->toBe(['https://schema.org/size'])
        ->and($data['hasVariant'])->toHaveCount(2);

    [$first, $second] = $data['hasVariant'];

    expect($first['@type'])->toBe('Product')
        ->and($first['sku'])->toBe('PR-KT-18-'.$wheel->id)
        ->and($first['gtin'])->toBe('4012345678901')
        ->and($first['color'])->toBe('Silber')
        ->and($first['offers']['price'])->toBe('189.50')
        ->and($first['offers']['priceCurrency'])->toBe('EUR')
        // Available or not (D-299), as the page says it.
        ->and($first['offers']['availability'])->toBe('https://schema.org/InStock')
        ->and($first['offers']['url'])->toContain('?groesse=')
        ->and($second['offers']['availability'])->toBe('https://schema.org/OutOfStock')
        // No EAN on record, no gtin.
        ->and($second)->not->toHaveKey('gtin');
});

it('says only what is on record: no rating without reviews, no shipping without a price @admin-214', function (): void {
    $wheel = jsonLdFelge();
    $data = jsonLdOf($this->get('/felgen/'.$wheel->slug)->assertOk());

    expect($data)->not->toHaveKey('aggregateRating')
        ->and($data['hasVariant'][0]['offers'])->not->toHaveKey('shippingDetails')
        ->and($data['hasVariant'][0]['offers'])->not->toHaveKey('hasMerchantReturnPolicy');

    // A rating as the buyers' visible reviews make it (ReviewSummary writes these columns), and a shipping price.
    $wheel->forceFill(['rating' => 4.5, 'rating_count' => 2])->save();
    Setting::set(Shipping::KEY, ['zones' => ['DE' => ['cost_cents' => 990, 'free_from_cents' => 50_000]], 'delivery_min_days' => 3, 'delivery_max_days' => 5]);

    $data = jsonLdOf($this->get('/felgen/'.$wheel->slug)->assertOk());

    expect($data['aggregateRating'])->toBe(['@type' => 'AggregateRating', 'ratingValue' => '4.5', 'reviewCount' => 2, 'bestRating' => '5', 'worstRating' => '1'])
        ->and($data['hasVariant'][0]['offers']['shippingDetails']['shippingRate'])->toBe(['@type' => 'MonetaryAmount', 'value' => '9.90', 'currency' => 'EUR'])
        ->and($data['hasVariant'][0]['offers']['shippingDetails']['shippingDestination'])->toBe(['@type' => 'DefinedRegion', 'addressCountry' => 'DE']);
});

it('never takes the outline drawing for a photograph, and gives example data none at all @admin-214', function (): void {
    $wheel = jsonLdFelge();
    $wheel->finishes()->update(['image_manifest' => json_encode(['base' => '/art/wheel', 'widths' => [480], 'fallback' => 'svg', 'kind' => 'placeholder'])]);

    expect(jsonLdOf($this->get('/felgen/'.$wheel->slug)->assertOk()))->not->toHaveKey('image');

    $demo = jsonLdFelge(['is_demo' => true, 'status' => 'draft']);
    // A demonstration model never reaches the shop (the table's CHECK); built here only to ask the builder itself.
    expect(ProductJsonLd::for($demo, url('/felgen/'.$demo->slug)))->toBeNull();
});

it('lets no text break out of the block @admin-214', function (): void {
    $wheel = jsonLdFelge(['description_de' => 'Speichen </script><script>alert(1)</script> & mehr']);
    $html = (string) $this->get('/felgen/'.$wheel->slug)->assertOk()->getContent();

    expect($html)->not->toContain('</script><script>alert(1)')
        ->and(jsonLdOf($this->get('/felgen/'.$wheel->slug))['description'])->toBe('Speichen </script><script>alert(1)</script> & mehr');
});
