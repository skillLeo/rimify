<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Rules\TeilegutachtenAbnahme;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Enums\ApprovalKind;
use App\Mail\OrderConfirmationMail;
use App\Models\CheckResult;
use App\Models\Fitment;
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
 * A2 of the operator's brief of 22.11.2026 — option Q, behind `rimify.features.teilegutachten_abnahme` (off). For a paper of
 * kind Teilegutachten every combination states the Abnahme from the type, unless a Prüfer excepts the row with a reason. The
 * sentence is a placeholder kept in one place (TeilegutachtenAbnahme::SENTENCE_DE). D-505.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, KomplettradOptionsSeeder::class]);
    config(['rimify.shipping.cost_cents' => 0, 'rimify.shipping.free_from_cents' => null, 'rimify.payments.driver' => 'sandbox', 'rimify.review.enabled' => true]);
    app(KomplettradSettings::class)->setMountingPerWheelCents(2_500);
    $this->fx = KomplettradFixture::permitted();
    WheelModel::query()->whereKey($this->fx->config->wheel_model_id)->update(['is_demo' => false, 'status' => 'published']);
    $this->fx->config->forceFill(['stock_qty' => 40])->save();

    // A plain answer on a Teilegutachten: no code on the row or its sizes, no Eintragung flag.
    $rows = Fitment::query()->where('vehicle_id', $this->fx->vehicle->id)->where('wheel_config_id', $this->fx->config->id)->pluck('id');
    DB::table('fitment_tyre_size_conditions')->whereIn('fitment_tyre_size_id', DB::table('fitment_tyre_sizes')->whereIn('fitment_id', $rows)->pluck('id'))->delete();
    DB::table('fitment_conditions')->whereIn('fitment_id', $rows)->delete();
    Fitment::query()->whereKey($rows)->update(['requires_entry' => false]);
    DB::table('approval_documents')->where('id', $this->fx->document->id)->update(['kind' => ApprovalKind::Teilegutachten->value]);
    CatalogueVersion::changed();

    $this->rows = $rows;
    $this->verdict = fn () => app(FitmentResolver::class)->resolve($this->fx->vehicle->id, $this->fx->config->id);
    $this->says = static fn (mixed $props): bool => str_contains(json_encode($props, JSON_UNESCAPED_UNICODE) ?: '', TeilegutachtenAbnahme::SENTENCE_DE);
});

it('keeps its sentence in one place, still marked as the placeholder the client has to word', function (): void {
    expect(TeilegutachtenAbnahme::isPlaceholder())->toBeTrue()
        ->and(TeilegutachtenAbnahme::SENTENCE_DE)->toStartWith('[Platzhalter]')
        ->and(config('rimify.features.teilegutachten_abnahme'))->toBeFalse()
        ->and(Switches::fingerprint())->toBe('');
});

it('changes nothing while the switch is off: the Teilegutachten answer stays plain green', function (): void {
    $verdict = ($this->verdict)();

    expect($verdict->status)->toBe(VerdictStatus::Permitted)
        ->and($verdict->requiresEntry)->toBeFalse()
        ->and(array_column(array_map(static fn ($c): array => ['code' => $c->code], $verdict->conditions), 'code'))->not->toContain(TeilegutachtenAbnahme::CODE);
});

it('states the Abnahme on every surface once on, freezes it in a new order and leaves an older order as sold', function (): void {
    // An order sold before the switch: frozen without the sentence.
    $buy = function (): Order {
        $this->flushSession();
        $this->withCookies($this->fx->cookies())->from('/felgen')->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $this->fx->config->id, 'quantity' => 4])->assertSessionHasNoErrors();
        $this->withCookies($this->fx->cookies())->from('/kasse')->post('/kasse', ['email' => 'tg@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße', 'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true, 'shipping' => 'standard'])->assertSessionHasNoErrors();

        return Order::query()->latest('id')->firstOrFail();
    };
    $before = $buy();

    config(['rimify.features.teilegutachten_abnahme' => true]);
    expect(Switches::fingerprint())->toBe('~tg');

    // The engine: never plain green, the Eintragung follows from the Abnahme.
    $verdict = ($this->verdict)();
    expect($verdict->status)->toBe(VerdictStatus::Conditional)
        ->and($verdict->requiresEntry)->toBeTrue()
        ->and(array_map(static fn ($c): string => $c->sentenceDe(), $verdict->conditions))->toContain(TeilegutachtenAbnahme::SENTENCE_DE);

    // The product page (its green box) and the Check page.
    $product = $this->withCookies($this->fx->cookies())->get('/felgen/'.$this->fx->config->wheelModel->slug.'?groesse='.$this->fx->config->id)->assertOk()->viewData('page')['props'];
    expect(($this->says)($product))->toBeTrue();
    $this->withCookies($this->fx->cookies())->post('/rimify-check/ergebnis', ['wheelConfigId' => $this->fx->config->id]);
    $check = $this->get('/rimify-check/ergebnis/'.CheckResult::query()->latest('id')->firstOrFail()->token)->assertOk()->viewData('page')['props'];
    expect(($this->says)($check['result']))->toBeTrue();

    // The basket, the Kasse, the order, its mail and the admin's order.
    $after = $buy();
    $this->withCookies($this->fx->cookies())->from('/felgen')->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $this->fx->config->id, 'quantity' => 4]);
    expect(($this->says)($this->withCookies($this->fx->cookies())->get('/warenkorb')->viewData('page')['props']['lines']))->toBeTrue()
        ->and(($this->says)($this->withCookies($this->fx->cookies())->get('/kasse')->viewData('page')['props']))->toBeTrue();

    $frozen = static fn (Order $o): array => (array) OrderLineFitment::query()->whereIn('order_line_id', $o->lines()->pluck('id'))->firstOrFail()->verdict;
    expect(($this->says)($frozen($after)))->toBeTrue()
        ->and($frozen($after)['status'])->toBe('CONDITIONAL')
        ->and(($this->says)($this->get(URL::temporarySignedRoute('bestellung.show', now()->addDay(), ['order' => $after->public_id]))->viewData('page')['props']['lines']))->toBeTrue()
        ->and((new OrderConfirmationMail($after, null))->render())->toContain(e(TeilegutachtenAbnahme::SENTENCE_DE))
        ->and(($this->says)(app(OrderDetail::class)->for($after)['lines']))->toBeTrue();

    // The older order: as sold, on every page that reads it.
    expect(($this->says)($frozen($before)))->toBeFalse()
        ->and($frozen($before)['status'])->toBe('PERMITTED')
        ->and(($this->says)($this->get(URL::temporarySignedRoute('bestellung.show', now()->addDay(), ['order' => $before->public_id]))->viewData('page')['props']['lines']))->toBeFalse()
        ->and((new OrderConfirmationMail($before, null))->render())->not->toContain(e(TeilegutachtenAbnahme::SENTENCE_DE));
});

it('lets a Prüfer except a row with a reason — the customer reads the Prüfer’s word, not the type’s', function (): void {
    config(['rimify.features.teilegutachten_abnahme' => true]);
    Fitment::query()->whereKey($this->rows)->update(['entry_override' => 'not_required', 'entry_override_reason' => 'Abnahme bereits im Gutachten erledigt', 'entry_override_at' => now()]);
    CatalogueVersion::changed();

    $verdict = ($this->verdict)();
    $sentences = array_map(static fn ($c): string => $c->sentenceDe(), $verdict->conditions);

    expect($sentences)->not->toContain(TeilegutachtenAbnahme::SENTENCE_DE)
        ->and($sentences)->toContain('Laut Prüfer ist keine Eintragung erforderlich: Abnahme bereits im Gutachten erledigt')
        ->and($verdict->requiresEntry)->toBeFalse();
});

it('leaves an ABE as it is, and never takes an Abnahme the paper states away', function (): void {
    config(['rimify.features.teilegutachten_abnahme' => true]);
    DB::table('approval_documents')->where('id', $this->fx->document->id)->update(['kind' => ApprovalKind::Abe->value]);
    CatalogueVersion::changed();

    expect(($this->verdict)()->status)->toBe(VerdictStatus::Permitted);

    // Back to a Teilegutachten whose row the paper itself marks: both stand, nothing is replaced.
    DB::table('approval_documents')->where('id', $this->fx->document->id)->update(['kind' => ApprovalKind::Teilegutachten->value]);
    Fitment::query()->whereKey($this->rows)->update(['requires_entry' => true]);
    CatalogueVersion::changed();
    $verdict = ($this->verdict)();

    expect($verdict->requiresEntry)->toBeTrue()
        ->and(array_map(static fn ($c): string => $c->sentenceDe(), $verdict->conditions))->toContain(TeilegutachtenAbnahme::SENTENCE_DE);
});
