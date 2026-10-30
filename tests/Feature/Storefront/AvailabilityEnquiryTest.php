<?php

declare(strict_types=1);

use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Services\Storefront\Basket;
use App\Support\AvailabilityEnquiry;
use App\Support\GermanFormat;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * His admin item 7, answered (29.10.2026, D-350): „Please add a button „Anfrage“ for the user to contact us about when the
 * rim will be available.“ A rim not available offers „Anfrage“ in the basket button's place — on the product page and on
 * its card — and the contact form opens with the rim, its size and its ET as the subject. Nothing of it goes in the basket.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, KomplettradOptionsSeeder::class]);
});

/** A real rim the demo approvals permit, every size of its colour marked „nicht verfügbar“ — but the fixture's own, with `$keepOne`. */
function enquirySet(bool $keepOne = false): KomplettradFixture
{
    $set = KomplettradFixture::permitted();
    WheelModel::query()->whereKey($set->config->wheel_model_id)->update(['is_demo' => false]);

    WheelConfig::query()
        ->where('wheel_model_id', $set->config->wheel_model_id)
        ->where('wheel_finish_id', $set->config->wheel_finish_id)
        ->when($keepOne, fn ($q) => $q->whereKeyNot($set->config->id))
        ->update(['available' => false]);

    if ($keepOne) {
        $set->config->forceFill(['available' => true])->save();
    }

    return $set;
}

it('names the rim, the size and the ET, a comma before the ET', function (): void {
    expect(AvailabilityEnquiry::subject('Borbet DB8GT2 Schwarz matt', 8.5, 19.0, 35))
        ->toBe('Anfrage zur Verfügbarkeit: Borbet DB8GT2 Schwarz matt, 8,5J × 19, ET 35')
        ->and(AvailabilityEnquiry::subject('Borbet DB8GT2 Schwarz matt', '8.00', '18.0', -5))
        ->toBe('Anfrage zur Verfügbarkeit: Borbet DB8GT2 Schwarz matt, 8J × 18, ET -5');
});

it('names every size of a card where they fit in a subject, its diameters where they do not — never one cut short', function (): void {
    $two = AvailabilityEnquiry::forSizes('Borbet DB8GT2 Schwarz matt', [
        ['width' => '8.00', 'diameter' => '18.0', 'et' => 35],
        ['width' => '8.50', 'diameter' => '19.0', 'et' => 40],
    ]);

    $ten = AvailabilityEnquiry::forSizes('Borbet DB8GT2 Schwarz matt', array_map(
        static fn (int $i): array => ['width' => '8.50', 'diameter' => (string) (17 + $i % 3), 'et' => 30 + $i],
        range(0, 9),
    ));

    expect($two)->toBe('Anfrage zur Verfügbarkeit: Borbet DB8GT2 Schwarz matt, 8J × 18, ET 35; 8,5J × 19, ET 40')
        ->and($ten)->toBe('Anfrage zur Verfügbarkeit: Borbet DB8GT2 Schwarz matt, 17, 18 und 19 Zoll')
        ->and(mb_strlen($ten))->toBeLessThanOrEqual(AvailabilityEnquiry::MAX)
        ->and(AvailabilityEnquiry::forSizes('Borbet DB8GT2 Schwarz matt', []))->toBe('Anfrage zur Verfügbarkeit: Borbet DB8GT2 Schwarz matt');
});

it('gives a size not available its „Anfrage“ on the product page, and an available one none @admin-207', function (): void {
    $set = enquirySet(keepOne: false);
    $config = $set->config->fresh();
    $model = WheelModel::query()->with(['brand', 'finishes'])->findOrFail($config->wheel_model_id);
    $colour = (string) $model->finishes->firstWhere('id', $config->wheel_finish_id)?->name_de;

    $this->withCookies($set->cookies())->get('/felgen/'.$model->slug)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('configs', function (mixed $configs) use ($config, $model, $colour): bool {
            $rows = collect($configs);
            $gone = $rows->firstWhere('id', $config->id);

            expect($gone['inStock'])->toBeFalse()
                ->and($gone['enquiry'])->toStartWith('Anfrage zur Verfügbarkeit: '.$model->brand->name.' ')
                ->and($gone['enquiry'])->toContain(' '.$colour.', '.GermanFormat::rimWidth((float) $config->width_in).' × ')
                ->and($gone['enquiry'])->toEndWith(', ET '.$config->et_mm);

            // Every size of another colour is still available, and offers no „Anfrage“.
            $rows->where('inStock', true)->each(fn (array $row) => expect($row['enquiry'])->toBeNull());

            return true;
        }));
});

it('gives a card not available in any size its „Anfrage“, with the sizes it shows for the car, and none to one available @admin-207', function (): void {
    $set = enquirySet(keepOne: false);
    $config = $set->config->fresh();

    $this->withCookies($set->cookies())->get('/felgen')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('cards', function (mixed $cards) use ($config): bool {
            $rows = collect($cards);
            $card = $rows->first(fn (array $card): bool => $card['modelId'] === $config->wheel_model_id && $card['finishId'] === $config->wheel_finish_id);

            expect($card)->not->toBeNull()
                ->and($card['inStock'])->toBeFalse()
                ->and($card['enquiry'])->toStartWith('Anfrage zur Verfügbarkeit: '.$card['brandName'].' '.$card['modelName'].' '.$card['finishName'].', ')
                ->and($card['enquiry'])->toContain(', ET '.$config->et_mm)
                ->and(mb_strlen($card['enquiry']))->toBeLessThanOrEqual(AvailabilityEnquiry::MAX);

            $rows->where('inStock', true)->each(fn (array $other) => expect($other['enquiry'])->toBeNull());

            return true;
        }));

    // Without a car, the catalogue's card the same.
    $this->get('/felgen')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('cards', fn (mixed $cards): bool => collect($cards)->contains(
            fn (array $card): bool => $card['modelId'] === $config->wheel_model_id && $card['finishId'] === $config->wheel_finish_id
                && $card['inStock'] === false && str_starts_with((string) $card['enquiry'], 'Anfrage zur Verfügbarkeit: '),
        )));
});

it('keeps the card buyable — no „Anfrage“ — while one of its sizes is available', function (): void {
    $set = enquirySet(keepOne: true);
    $config = $set->config->fresh();

    $this->get('/felgen')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('cards', fn (mixed $cards): bool => collect($cards)->contains(
            fn (array $card): bool => $card['modelId'] === $config->wheel_model_id && $card['finishId'] === $config->wheel_finish_id
                && $card['inStock'] === true && $card['enquiry'] === null,
        )));
});

it('opens the contact form with that subject and the page it came from; name, e-mail and message are the visitor’s @admin-207', function (): void {
    $subject = AvailabilityEnquiry::subject('Borbet DB8GT2 Schwarz matt', 8.5, 19.0, 35);

    $this->get('/kontakt?'.http_build_query(['betreff' => $subject, 'von' => '/felgen/borbet-db8gt2']))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('prefill.subject', $subject)
            ->where('prefill.from', '/felgen/borbet-db8gt2'));
});

it('puts nothing of a size not available in the basket, alone or as a Komplettrad @admin-207', function (): void {
    $set = enquirySet(keepOne: false);
    $tyre = $set->tyre();
    $post = fn (array $line) => $this->withCookies($set->cookies())->from('/felgen')
        ->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $set->config->id, 'quantity' => 4, ...$line]);

    $post([])->assertSessionHasErrors(['wheelConfigId' => Basket::WHEEL_SOLD_OUT]);
    $post(['tyreVariantId' => $tyre->id])->assertSessionHasErrors();

    expect(session('errors')->all())->toContain(Basket::WHEEL_SOLD_OUT)
        ->and(session(Basket::SESSION_KEY, []))->toBe([]);
});
