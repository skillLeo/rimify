<?php

declare(strict_types=1);

use App\Domain\Storefront\PapersBook;
use App\Models\CheckResult;
use App\Models\Vehicle;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Storefront\KomplettradFixture;

/**
 * The printable RIMIFY-Check (the operator's decision of 29.09.2026): the answer for the chosen car and one
 * wheel, frozen whole under a token — every line of the tyre sum, whatever the product page folds away — so
 * what we showed can be read back, and printed, next week.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    $this->seed(KomplettradOptionsSeeder::class);
});

it('freezes the answer for the chosen car and wheel, and shows every line of the tyre sum', function (): void {
    $fixture = KomplettradFixture::permitted();

    $response = $this->withCookies($fixture->cookies())
        ->post('/rimify-check/ergebnis', ['wheelConfigId' => $fixture->config->id]);

    $result = CheckResult::query()->sole();
    $response->assertRedirect('/rimify-check/ergebnis/'.$result->token);

    expect($result->token)->toMatch('/^[A-Za-z0-9]{32}$/')
        ->and($result->vehicle_id)->toBe($fixture->vehicle->id)
        ->and($result->wheel_config_id)->toBe($fixture->config->id)
        ->and($result->verdict['tyreCheck']['lines'] ?? [])->not->toBeEmpty();

    $this->get('/rimify-check/ergebnis/'.$result->token)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('CheckErgebnis/Index')
            ->where('result.status', $result->verdict_status)
            ->where('result.tyre.lines', $result->verdict['tyreCheck']['lines'])
            ->where('result.tyre.summary', $result->verdict['tyreCheck']['summary'])
            ->has('result.document.label')
            ->where('result.documentToday', null)
        );
});

it('says next week what it said today, whatever the data does since — and says when the Gutachten changed', function (): void {
    $fixture = KomplettradFixture::permitted();
    $this->withCookies($fixture->cookies())->post('/rimify-check/ergebnis', ['wheelConfigId' => $fixture->config->id]);
    $result = CheckResult::query()->sole();
    $before = $this->get('/rimify-check/ergebnis/'.$result->token)->viewData('page')['props']['result'];

    // The car's figures change, and the document is replaced.
    Vehicle::query()->whereKey($fixture->vehicle->id)->update(['axle_load_front_kg' => 1900, 'axle_load_rear_kg' => 1900]);
    DB::table('approval_documents')->where('id', $result->approval_document_id)->update(['status' => 'superseded']);

    $after = $this->get('/rimify-check/ergebnis/'.$result->token)->viewData('page')['props']['result'];

    expect($after['tyre'])->toBe($before['tyre'])
        ->and($after['status'])->toBe($before['status'])
        ->and($after['documentToday'])->toBe('Das Gutachten wurde seitdem durch eine neuere Fassung ersetzt. Prüf die Felge erneut, bevor du kaufst.');
});

it('keeps the figures from the customer’s papers the answer used', function (): void {
    $fixture = KomplettradFixture::permitted();

    $this->withCookies($fixture->cookies())
        ->withUnencryptedCookie(PapersBook::COOKIE, "{$fixture->vehicle->id}.1100.1100.200")
        ->post('/rimify-check/ergebnis', ['wheelConfigId' => $fixture->config->id]);

    // MySQL keeps a JSON object's keys in its own order: the figures, not their order, are the point.
    expect(CheckResult::query()->sole()->papers)->toEqual(['axleFrontKg' => 1100, 'axleRearKg' => 1100, 'topSpeedKmh' => 200]);
});

it('is written once: the database refuses every change', function (): void {
    $fixture = KomplettradFixture::permitted();
    $this->withCookies($fixture->cookies())->post('/rimify-check/ergebnis', ['wheelConfigId' => $fixture->config->id]);

    expect(fn () => DB::table('check_results')->update(['verdict_status' => 'PERMITTED']))->toThrow(QueryException::class);
});

it('asks for the car first, refuses a size that is gone, and shows nothing for a token nobody issued', function (): void {
    $fixture = KomplettradFixture::permitted();

    $this->post('/rimify-check/ergebnis', ['wheelConfigId' => $fixture->config->id])
        ->assertSessionHasErrors(['wheelConfigId' => 'Wähl zuerst dein Fahrzeug – der RIMIFY-Check gilt immer für ein bestimmtes Auto.']);

    $this->withCookies($fixture->cookies())->post('/rimify-check/ergebnis', ['wheelConfigId' => 99_999_999])
        ->assertSessionHasErrors(['wheelConfigId' => 'Diese Felgengröße gibt es nicht mehr. Wähl bitte eine andere.']);

    expect(CheckResult::query()->count())->toBe(0);

    $this->get('/rimify-check/ergebnis/'.str_repeat('A', 32))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('result', null));
    $this->get('/rimify-check/ergebnis/nicht-vergeben')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('result', null));
});
