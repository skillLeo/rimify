<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Inertia\Testing\AssertableInertia;

/*
 * „JSON-LD anzeigen“ on the rim's edit page (his admin item 14; the operator's brief of 29.10.2026, §3): the preview is
 * closed to crawlers, so the page shows the structured data its rim gives search engines, to be pasted into the „Code“
 * tab of Google's Rich Results Test. The same generator as the shop's page head, never a second one — and a demo rim,
 * whose page carries none, shown as a real rim's would be, and said to be one.
 */

beforeEach(function (): void {
    $this->seed([AccessSeeder::class, ReferenceDataSeeder::class]);
});

function jsonLdAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

/** A rim with one size, published unless told otherwise. */
function jsonLdWheel(array $attributes = ['status' => 'published']): WheelModel
{
    $config = WheelConfig::factory()->create();
    $wheel = WheelModel::query()->findOrFail($config->wheel_model_id);
    $wheel->forceFill($attributes)->save();

    return $wheel->refresh();
}

/** @return array{code: string|null, demo: bool, published: bool} */
function jsonLdProp(object $test, WheelModel $wheel): array
{
    $prop = null;

    $test->actingAs(jsonLdAdmin(), 'admin')
        ->get("/admin/felgen/{$wheel->id}")
        ->assertOk()
        ->assertInertia(function (AssertableInertia $page) use (&$prop): AssertableInertia {
            $prop = $page->toArray()['props']['jsonLd'] ?? null;

            return $page->component('Admin/Felgen/Edit');
        });

    expect($prop)->toBeArray();

    return $prop;
}

it('shows a published rim the block its page carries, set out to be pasted', function (): void {
    $wheel = jsonLdWheel();
    $prop = jsonLdProp($this, $wheel);

    expect($prop['demo'])->toBeFalse()
        ->and($prop['published'])->toBeTrue()
        ->and($prop['code'])->toStartWith("<script type=\"application/ld+json\">\n{")
        ->and($prop['code'])->toEndWith("}\n</script>");

    // The same data as the product page's head, only set out on lines.
    $json = substr((string) $prop['code'], strlen("<script type=\"application/ld+json\">\n"), -strlen("\n</script>"));
    $head = $this->get('/felgen/'.$wheel->slug)->assertOk()->viewData('productJsonLd');

    expect(json_decode($json, true))->toBe(json_decode((string) $head, true))
        ->and(json_decode($json, true)['@type'])->toBe('ProductGroup');
});

it('shows a demo rim what a real one would carry, and says the shop sends none for it', function (): void {
    $wheel = jsonLdWheel(['status' => 'published', 'is_demo' => true, 'demo_ref' => 'abnahme:test:jsonld']);
    $prop = jsonLdProp($this, $wheel);

    expect($prop['demo'])->toBeTrue()
        ->and($prop['code'])->toContain('"@type": "ProductGroup"');

    // The page itself still gives search engines nothing for it.
    expect($this->get('/felgen/'.$wheel->slug)->viewData('productJsonLd'))->toBeNull();
});

it('says a rim without a size has none yet, and a draft that it is not live', function (): void {
    $draft = jsonLdWheel(['status' => 'draft']);
    expect(jsonLdProp($this, $draft))->toMatchArray(['published' => false])
        ->and(jsonLdProp($this, $draft)['code'])->not->toBeNull();

    $bare = WheelModel::factory()->create(['status' => 'draft']);
    expect(jsonLdProp($this, $bare)['code'])->toBeNull();
});
