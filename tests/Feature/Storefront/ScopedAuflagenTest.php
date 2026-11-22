<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\ScopedAnswer;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Mail\OrderConfirmationMail;
use App\Models\DocumentCondition;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Order;
use App\Models\OrderLineFitment;
use App\Models\WheelModel;
use App\Services\Admin\Orders\OrderDetail;
use App\Services\Commerce\KomplettradSettings;
use App\Support\CatalogueVersion;
use App\Support\Switches;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * A4 of the operator's brief of 22.11.2026, behind `rimify.features.scoped_auflagen` (off): a Komplettrad's answer scoped to
 * the sizes chosen — the reverse of D-501's floor, and less strict. The case is D-501's own (order 2611-11406 on the preview):
 * an Abnahme the paper prints beside another size of the row. D-506.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, KomplettradOptionsSeeder::class]);
    config(['rimify.shipping.cost_cents' => 0, 'rimify.shipping.free_from_cents' => null, 'rimify.payments.driver' => 'sandbox', 'rimify.review.enabled' => true]);
    app(KomplettradSettings::class)->setMountingPerWheelCents(2_500);
    $this->fx = KomplettradFixture::permitted();
    WheelModel::query()->whereKey($this->fx->config->wheel_model_id)->update(['is_demo' => false, 'status' => 'published']);
    $this->fx->config->forceFill(['stock_qty' => 40])->save();

    // A row with nothing of its own, and an Abnahme beside another size only.
    $rows = Fitment::query()->where('vehicle_id', $this->fx->vehicle->id)->where('wheel_config_id', $this->fx->config->id)->pluck('id');
    DB::table('fitment_tyre_size_conditions')->whereIn('fitment_tyre_size_id', FitmentTyreSize::query()->whereIn('fitment_id', $rows)->pluck('id'))->delete();
    DB::table('fitment_conditions')->whereIn('fitment_id', $rows)->delete();
    Fitment::query()->whereKey($rows)->update(['requires_entry' => false]);
    DocumentCondition::query()->create(['approval_document_id' => $this->fx->document->id, 'code' => 'A11', 'kind' => ConditionKind::Abnahme, 'text_de' => 'Braucht eine Abnahme.']);
    foreach ($rows as $id) {
        $other = FitmentTyreSize::query()->create(['fitment_id' => $id, 'width_mm' => $this->fx->size->widthMm + 40, 'aspect' => $this->fx->size->aspect + 30, 'diameter_in' => $this->fx->size->diameterIn, 'axle' => 'ALL']);
        DB::table('fitment_tyre_size_conditions')->insert(['fitment_tyre_size_id' => $other->id, 'code' => 'A11']);
    }
    CatalogueVersion::changed();
    $this->tyre = $this->fx->tyre(['load_index' => 120]);

    $this->step = fn (): array => collect($this->withCookies($this->fx->cookies())->get('/komplettraeder?groesse='.$this->fx->config->id)->assertOk()->viewData('page')['props']['config']['komplettrad']['tyres'] ?? [])->firstWhere('id', $this->tyre->id)['answer'];
    $this->buy = function (): array {
        $this->flushSession();
        $this->withCookies($this->fx->cookies())->from('/komplettraeder')->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $this->fx->config->id, 'tyreVariantId' => $this->tyre->id, 'rdks' => 'nein', 'quantity' => 4])->assertSessionHasNoErrors();
        $line = collect($this->withCookies($this->fx->cookies())->get('/warenkorb')->viewData('page')['props']['lines'])->first();
        $this->withCookies($this->fx->cookies())->from('/kasse')->post('/kasse', ['email' => 'sa@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße', 'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true, 'shipping' => 'standard', 'rdks' => 'nein'])->assertSessionHasNoErrors();
        $order = Order::query()->latest('id')->firstOrFail();

        return [$line, $order];
    };
    $this->frozen = static fn (Order $o): array => (array) OrderLineFitment::query()->whereIn('order_line_id', $o->lines()->pluck('id'))->firstOrFail()->verdict;
    $this->page = fn (Order $o): array => collect($this->get(URL::temporarySignedRoute('bestellung.show', now()->addDay(), ['order' => $o->public_id]))->assertOk()->viewData('page')['props']['lines'])->first();
});

it('is off, and off it says D-501’s stricter answer everywhere', function (): void {
    expect(config('rimify.features.scoped_auflagen'))->toBeFalse()
        ->and(($this->step)()['standing'])->toBe('auflagen')
        ->and(($this->step)()['combination'])->toContain('Braucht eine Abnahme.');

    [$line, $order] = ($this->buy)();

    expect($line['verdict']['status'])->toBe('CONDITIONAL')
        ->and($line['verdict']['conditionGroups']['combination'])->toContain('Braucht eine Abnahme.')
        ->and(array_column(($this->frozen)($order)['conditions'], 'code'))->toContain('A11');
});

it('on, says for the set only what the paper prints for its size — in the step, the basket, the order, its mail and the admin', function (): void {
    config(['rimify.features.scoped_auflagen' => true]);
    expect(Switches::fingerprint())->toBe('~sa');

    $answer = ($this->step)();
    expect($answer['standing'])->toBe('keine')
        ->and($answer['combination'])->toBe([]);

    [$line, $order] = ($this->buy)();
    $frozen = ($this->frozen)($order);

    // Less strict: no Abnahme for this set, so plainly „freigegeben“ — the order freezes it as said.
    expect($line['verdict']['status'])->toBe('PERMITTED')
        ->and($line['verdict']['conditions'])->not->toContain('Braucht eine Abnahme.')
        ->and($line['verdict']['sentence'])->toContain('Für dein Fahrzeug freigegeben.')
        ->and($frozen['status'])->toBe('PERMITTED')
        ->and(array_column($frozen['conditions'], 'code'))->not->toContain('A11')
        ->and(($this->page)($order)['verdict']['conditionGroups']['combination'])->not->toContain('Braucht eine Abnahme.')
        ->and(collect((new OrderConfirmationMail($order, null))->content()->with['lines'])->first()['verdict'])->toBe('Für dein Fahrzeug freigegeben.')
        ->and(collect(app(OrderDetail::class)->for($order)['lines'])->first()['snapshot']['conditionGroups']['combination'])->not->toContain('Braucht eine Abnahme.');
});

it('leaves an order sold before the switch as it was sold, on every page that reads it', function (): void {
    [, $before] = ($this->buy)();

    config(['rimify.features.scoped_auflagen' => true]);

    expect(($this->page)($before)['verdict']['conditionGroups']['combination'])->toContain('Braucht eine Abnahme.')
        ->and(collect((new OrderConfirmationMail($before, null))->content()->with['lines'])->first()['conditions'])->toContain('Braucht eine Abnahme.')
        ->and(collect(app(OrderDetail::class)->for($before)['lines'])->first()['snapshot']['conditionGroups']['combination'])->toContain('Braucht eine Abnahme.');
});

it('fails closed: a size the answer does not name keeps every Auflage, and a rim alone or a plain answer is left as it is', function (): void {
    config(['rimify.features.scoped_auflagen' => true]);
    $verdict = app(FitmentResolver::class)->resolve($this->fx->vehicle->id, $this->fx->config->id);
    $unnamed = ScopedAnswer::of($verdict, '999/99R99');

    expect($verdict->status)->toBe(VerdictStatus::Conditional)
        ->and($unnamed->status)->toBe(VerdictStatus::Conditional)
        ->and(array_map(static fn ($c): string => $c->code, $unnamed->conditions))->toContain('A11')
        ->and(ScopedAnswer::of($verdict, null))->toBe($verdict);

    config(['rimify.features.scoped_auflagen' => false]);
    expect(ScopedAnswer::of($verdict, $this->fx->size->key()))->toBe($verdict);
});
