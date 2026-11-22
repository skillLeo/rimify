<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Mail\OrderConfirmationMail;
use App\Models\DocumentCondition;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Order;
use App\Models\OrderLineFitment;
use App\Models\WheelModel;
use App\Services\Admin\Orders\OrderDetail;
use App\Services\Commerce\KomplettradSettings;
use App\Services\Storage\DocumentFiles;
use App\Services\Storage\StorageSettings;
use App\Services\Storefront\Basket;
use App\Support\CatalogueVersion;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * D-501, the operator's answer of 21.11.2026: a Komplettrad gets one answer wherever the customer reads it. Found on the
 * preview (order 2611-11406): the tyre step said „Keine Auflagen.“ for 225/35 + 255/35 R18, the basket and the Kasse
 * „Freigegeben, mit Auflagen“ with nothing to read, and the order froze A11 „Braucht eine Abnahme.“, which the paper prints
 * beside another size. Until the client says an Auflage counts only for its sizes, every place says the stricter answer.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, KomplettradOptionsSeeder::class]);
    config(['rimify.shipping.cost_cents' => 0, 'rimify.shipping.free_from_cents' => null, 'rimify.payments.driver' => 'sandbox', 'rimify.review.enabled' => true]);
    app(KomplettradSettings::class)->setMountingPerWheelCents(2_500);
    $this->fx = KomplettradFixture::permitted();
    WheelModel::query()->whereKey($this->fx->config->wheel_model_id)->update(['is_demo' => false]);
    $this->fx->config->forceFill(['stock_qty' => 40])->save();

    // An Abnahme the paper prints beside another size of the same row — not beside the size the customer takes.
    DocumentCondition::query()->create(['approval_document_id' => $this->fx->document->id, 'code' => 'A11', 'kind' => ConditionKind::Abnahme, 'text_de' => 'Braucht eine Abnahme.']);
    foreach (Fitment::query()->where('vehicle_id', $this->fx->vehicle->id)->where('wheel_config_id', $this->fx->config->id)->get() as $row) {
        $other = FitmentTyreSize::query()->create(['fitment_id' => $row->id, 'width_mm' => $this->fx->size->widthMm + 40, 'aspect' => $this->fx->size->aspect + 30, 'diameter_in' => $this->fx->size->diameterIn, 'axle' => 'ALL']);
        DB::table('fitment_tyre_size_conditions')->insert(['fitment_tyre_size_id' => $other->id, 'code' => 'A11']);
    }
    CatalogueVersion::changed();
    $this->tyre = $this->fx->tyre(['load_index' => 120]);
});

it('says the same Auflage in the tyre step, the basket, the Kasse and the order — never „Keine Auflagen.“ beside „mit Auflagen“', function (): void {
    // The tyre step: the answer the page dresses its RIMIFY-Check and the tile in.
    $props = $this->withCookies($this->fx->cookies())->get('/komplettraeder?groesse='.$this->fx->config->id)->assertOk()->viewData('page')['props'];
    $offered = collect($props['config']['komplettrad']['tyres'] ?? [])->firstWhere('id', $this->tyre->id);

    expect($props['config']['verdict']['status'])->toBe('CONDITIONAL')
        ->and($offered)->not->toBeNull()
        ->and($offered['answer']['standing'])->toBe('auflagen')
        ->and($offered['answer']['combination'])->toContain('Braucht eine Abnahme.');

    // The basket and the Kasse: the same Auflage, readable, and counted in the line's sentence.
    $this->withCookies($this->fx->cookies())->from('/komplettraeder')->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $this->fx->config->id, 'tyreVariantId' => $this->tyre->id, 'rdks' => 'nein', 'quantity' => 4])->assertSessionHasNoErrors();
    $line = collect($this->withCookies($this->fx->cookies())->get('/warenkorb')->viewData('page')['props']['lines'])->first();

    expect($line['verdict']['status'])->toBe('CONDITIONAL')
        ->and($line['verdict']['conditions'])->toContain('Braucht eine Abnahme.')
        ->and($line['verdict']['conditionGroups']['standing'])->toBe('auflagen')
        ->and($line['verdict']['conditionGroups']['combination'])->toContain('Braucht eine Abnahme.')
        ->and($line['verdict']['sentence'])->toContain('mit 2 Auflagen');

    // The order: frozen with the same answer.
    $this->withCookies($this->fx->cookies())->from('/kasse')->post('/kasse', ['email' => 'test@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße', 'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true, 'shipping' => 'standard', 'rdks' => 'nein'])->assertSessionHasNoErrors();
    $order = Order::query()->latest('id')->firstOrFail();
    $frozen = OrderLineFitment::query()->whereIn('order_line_id', $order->lines()->pluck('id'))->firstOrFail();
    $verdict = is_array($frozen->verdict) ? $frozen->verdict : json_decode((string) $frozen->verdict, true);

    expect($verdict['status'])->toBe('CONDITIONAL')
        ->and(array_column($verdict['conditions'], 'code'))->toContain('A11');

    // Every Auflage the order keeps, the step said: the same list, the same order.
    $kept = array_map(static fn (array $c): string => (string) ($c['textDe'] ?? ''), $verdict['conditions']);
    expect(array_values(array_intersect($offered['answer']['combination'], $kept)))->toHaveCount(count($kept));

    // D-504: the order page, the confirmation mail and the admin's order read the frozen answer the same way — the Auflage
    // stands on each, never only the chosen size's own.
    $page = collect($this->withCookies($this->fx->cookies())->get('/bestellung/'.$order->public_id)->assertOk()->viewData('page')['props']['lines'])->first();
    $mail = collect((new OrderConfirmationMail($order, null))->content()->with['lines'])->first();
    $detail = collect(app(OrderDetail::class)->for($order)['lines'])->first();

    expect($page['verdict']['conditionGroups']['combination'])->toContain('Braucht eine Abnahme.')
        ->and($page['verdict']['conditionGroups']['standing'])->toBe('auflagen')
        ->and($mail['conditions'])->toContain('Braucht eine Abnahme.')
        ->and($mail['verdict'])->toBe('Für dein Fahrzeug freigegeben, mit Auflagen.')
        ->and($detail['snapshot']['conditionGroups']['combination'])->toContain('Braucht eine Abnahme.');
});

it('leaves a plain answer plain: no Auflage on the row, „Keine Auflagen.“ in the step and nothing to read in the basket', function (): void {
    // The row without any code at all: nothing to carry.
    DB::table('fitment_tyre_size_conditions')->whereIn('fitment_tyre_size_id', FitmentTyreSize::query()->whereIn('fitment_id', Fitment::query()->where('vehicle_id', $this->fx->vehicle->id)->where('wheel_config_id', $this->fx->config->id)->pluck('id'))->pluck('id'))->delete();
    DB::table('fitment_conditions')->whereIn('fitment_id', Fitment::query()->where('vehicle_id', $this->fx->vehicle->id)->where('wheel_config_id', $this->fx->config->id)->pluck('id'))->delete();
    Fitment::query()->where('vehicle_id', $this->fx->vehicle->id)->where('wheel_config_id', $this->fx->config->id)->update(['requires_entry' => false]);
    CatalogueVersion::changed();

    $props = $this->withCookies($this->fx->cookies())->get('/komplettraeder?groesse='.$this->fx->config->id)->assertOk()->viewData('page')['props'];
    $offered = collect($props['config']['komplettrad']['tyres'] ?? [])->firstWhere('id', $this->tyre->id);

    expect($props['config']['verdict']['status'])->toBe('PERMITTED')
        ->and($offered['answer']['standing'])->toBe('keine')
        ->and($offered['answer']['combination'])->toBe([]);
});

it('keeps the Auflagen in the mail when a link to the Gutachten cannot be built (D-510)', function (): void {
    $this->withCookies($this->fx->cookies())->from('/komplettraeder')->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $this->fx->config->id, 'tyreVariantId' => $this->tyre->id, 'rdks' => 'nein', 'quantity' => 4])->assertSessionHasNoErrors();
    $this->withCookies($this->fx->cookies())->from('/kasse')->post('/kasse', ['email' => 'test@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße', 'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true, 'shipping' => 'standard', 'rdks' => 'nein'])->assertSessionHasNoErrors();
    $order = Order::query()->latest('id')->firstOrFail();

    // The storage unreadable for a moment: a key stored under another APP_KEY, as on a copy of the database.
    DB::table('approval_documents')->where('id', $this->fx->document->id)->update(['pdf_key' => 'gutachten/probe.pdf']);
    DB::table('storage_settings')->insert(['state' => 'active', 'provider' => 's3', 'region' => 'eu-central-1', 'bucket' => 'probe', 'access_key' => 'nicht-entschluesselbar', 'secret' => 'nicht-entschluesselbar', 'created_at' => now(), 'updated_at' => now()]);
    // The settings are read once per process (a singleton): the next read is a fresh one, as in a new request.
    app()->forgetInstance(StorageSettings::class);
    app()->forgetInstance(DocumentFiles::class);
    Cache::flush();

    $mail = collect((new OrderConfirmationMail($order->fresh(), null))->content()->with['lines'])->first();

    expect($mail['conditions'])->toContain('Braucht eine Abnahme.')
        ->and($mail['verdict'])->toBe('Für dein Fahrzeug freigegeben, mit Auflagen.')
        ->and($mail['document'] ?? null)->toBeNull();
});
