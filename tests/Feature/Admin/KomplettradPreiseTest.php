<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Setting;
use App\Models\TpmsSensorPrice;
use App\Services\Commerce\KomplettradPricer;
use App\Services\Commerce\KomplettradSettings;
use App\Support\GermanFormat;
use Database\Seeders\AccessSeeder;

/**
 * The two Komplettrad prices the client sets themselves (docs/specs/komplettrad.md §13):
 * *Montage und Auswuchten je Rad*, and the default RDKS price every make without its own row pays.
 *
 * What these tests hold on to is the difference between "nobody has said" and "somebody said none".
 * Both refuse to sell rather than guess, but only one of them may be overruled by a deployment
 * default — otherwise clearing a price in the admin would silently restore an old one.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);

    config([
        'rimify.komplettrad.mounting_per_wheel_cents' => null,
        'rimify.komplettrad.tpms_default_price_cents' => null,
    ]);
});

/** The seeded account for a role, as AccessSeeder names it. */
function komplettradAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function komplettradSettings(): KomplettradSettings
{
    return app(KomplettradSettings::class);
}

describe('the stored figure and the deployment default', function (): void {
    it('reads the configured figure while nobody has ever touched the field', function (): void {
        config(['rimify.komplettrad.mounting_per_wheel_cents' => 1_990]);

        expect(komplettradSettings()->mountingPerWheelCents())->toBe(1_990);
    });

    it('lets a stored figure overrule the configured one', function (): void {
        config(['rimify.komplettrad.mounting_per_wheel_cents' => 1_990]);
        komplettradSettings()->setMountingPerWheelCents(2_450);

        expect(komplettradSettings()->mountingPerWheelCents())->toBe(2_450);
    });

    it('keeps a deliberately cleared field cleared, and never falls back to the deployment default', function (): void {
        config(['rimify.komplettrad.mounting_per_wheel_cents' => 1_990]);

        komplettradSettings()->setMountingPerWheelCents(null);

        // The row exists and holds null: an admin said "no price", which is an answer, not a gap.
        expect(Setting::query()->whereKey(KomplettradSettings::MOUNTING_KEY)->exists())->toBeTrue()
            ->and(komplettradSettings()->mountingPerWheelCents())->toBeNull();
    });

    it('reads a hand-edited value that is not a non-negative integer as unset, never as a price', function (): void {
        Setting::set(KomplettradSettings::MOUNTING_KEY, '19,90');

        expect(komplettradSettings()->mountingPerWheelCents())->toBeNull();

        Setting::set(KomplettradSettings::TPMS_DEFAULT_KEY, -500);

        expect(komplettradSettings()->tpmsDefaultCents())->toBeNull();
    });
});

describe('Montage und Auswuchten in the admin', function (): void {
    it('saves a price typed the German way', function (): void {
        $this->actingAs(komplettradAdmin(), 'admin')
            ->put('/admin/wuchtgewichte/montage', ['mounting' => '19,90'])
            ->assertRedirect();

        expect(komplettradSettings()->mountingPerWheelCents())->toBe(1_990);
    });

    it('refuses a price it cannot read, and leaves the old one standing', function (): void {
        komplettradSettings()->setMountingPerWheelCents(1_990);

        $this->actingAs(komplettradAdmin(), 'admin')
            ->from('/admin/wuchtgewichte')
            ->put('/admin/wuchtgewichte/montage', ['mounting' => '19.9.0'])
            ->assertSessionHasErrors('mountingCents');

        expect(komplettradSettings()->mountingPerWheelCents())->toBe(1_990);
    });

    it('accepts an empty field as "noch nicht festgelegt"', function (): void {
        komplettradSettings()->setMountingPerWheelCents(1_990);

        $this->actingAs(komplettradAdmin(), 'admin')
            ->put('/admin/wuchtgewichte/montage', ['mounting' => ''])
            ->assertRedirect();

        expect(komplettradSettings()->mountingPerWheelCents())->toBeNull();
    });

    it('accepts nought, because mounting may genuinely be included in the rim price', function (): void {
        $this->actingAs(komplettradAdmin(), 'admin')
            ->put('/admin/wuchtgewichte/montage', ['mounting' => '0,00'])
            ->assertRedirect();

        expect(komplettradSettings()->mountingPerWheelCents())->toBe(0);
    });

    it('refuses a role that may not edit the catalogue, and changes nothing', function (): void {
        komplettradSettings()->setMountingPerWheelCents(1_990);

        $this->actingAs(komplettradAdmin('accountant'), 'admin')
            ->put('/admin/wuchtgewichte/montage', ['mounting' => '1,00'])
            ->assertForbidden();

        expect(komplettradSettings()->mountingPerWheelCents())->toBe(1_990);
    });

    it('leaves an audit entry naming the figure before and after', function (): void {
        komplettradSettings()->setMountingPerWheelCents(1_500);

        $admin = komplettradAdmin();

        $this->actingAs($admin, 'admin')->put('/admin/wuchtgewichte/montage', ['mounting' => '19,90']);

        $entry = AuditLog::query()->where('description', 'mounting_fee.updated')->latest('id')->first();

        expect($entry)->not->toBeNull()
            ->and($entry?->properties['old_cents'])->toBe(1_500)
            ->and($entry?->properties['cents'])->toBe(1_990)
            ->and($entry?->actor_email)->toBe($admin->email);
    });

    it('ships the current figure to the page, and an empty field while there is none', function (): void {
        $admin = komplettradAdmin();

        $this->actingAs($admin, 'admin')->get('/admin/wuchtgewichte')
            ->assertInertia(fn ($page) => $page
                ->where('mounting.cents', null)
                ->where('mounting.typed', '')
            );

        komplettradSettings()->setMountingPerWheelCents(1_990);

        $this->actingAs($admin, 'admin')->get('/admin/wuchtgewichte')
            ->assertInertia(fn ($page) => $page
                ->where('mounting.cents', 1_990)
                ->where('mounting.typed', GermanFormat::money(1_990))
            );
    });
});

describe('the default RDKS price', function (): void {
    it('saves a default and answers for a make with no row of its own', function (): void {
        $this->actingAs(komplettradAdmin(), 'admin')
            ->put('/admin/rdks-preise/standard', ['price' => '15,00'])
            ->assertRedirect();

        expect(komplettradSettings()->tpmsDefaultCents())->toBe(1_500);
    });

    it('refuses nought, because free sensors are not a price anybody set', function (): void {
        $this->actingAs(komplettradAdmin(), 'admin')
            ->from('/admin/rdks-preise')
            ->put('/admin/rdks-preise/standard', ['price' => '0,00'])
            ->assertSessionHasErrors('priceCents');

        expect(komplettradSettings()->tpmsDefaultCents())->toBeNull();
    });

    it('accepts an empty field, and then only the entered makes can have sensors', function (): void {
        komplettradSettings()->setTpmsDefaultCents(1_500);

        $this->actingAs(komplettradAdmin(), 'admin')
            ->put('/admin/rdks-preise/standard', ['price' => ''])
            ->assertRedirect();

        expect(komplettradSettings()->tpmsDefaultCents())->toBeNull();
    });

    it('refuses a role that may not edit the catalogue', function (): void {
        $this->actingAs(komplettradAdmin('accountant'), 'admin')
            ->put('/admin/rdks-preise/standard', ['price' => '15,00'])
            ->assertForbidden();

        expect(komplettradSettings()->tpmsDefaultCents())->toBeNull();
    });

    it('ships the current default to the page', function (): void {
        komplettradSettings()->setTpmsDefaultCents(1_500);

        $this->actingAs(komplettradAdmin(), 'admin')->get('/admin/rdks-preise')
            ->assertInertia(fn ($page) => $page
                ->where('default.cents', 1_500)
                ->where('default.typed', GermanFormat::money(1_500))
            );
    });

    it('leaves the per-make row in charge where the admin entered one', function (): void {
        komplettradSettings()->setTpmsDefaultCents(1_500);

        TpmsSensorPrice::factory()->create([
            'make_key' => 'porsche',
            'make_label_de' => 'Porsche',
            'price_cents' => 5_000,
            'active' => true,
        ]);

        $pricer = app(KomplettradPricer::class);

        $porsche = $pricer->sensorFor('Porsche');
        $golf = $pricer->sensorFor('VW');

        expect($porsche?->priceCents)->toBe(5_000)
            ->and($porsche?->fromDefault())->toBeFalse()
            ->and($porsche?->makeLabelDe)->toBe('Porsche')
            // The default answers for everyone else, under the vehicle's own spelling.
            ->and($golf?->priceCents)->toBe(1_500)
            ->and($golf?->fromDefault())->toBeTrue();
    });

    it('answers for nobody while there is neither a row nor a default', function (): void {
        expect(app(KomplettradPricer::class)->sensorFor('Volkswagen'))->toBeNull();
    });

    it('never answers without a usable make, default or no default', function (): void {
        komplettradSettings()->setTpmsDefaultCents(1_500);

        $pricer = app(KomplettradPricer::class);

        expect($pricer->sensorFor(null))->toBeNull()
            ->and($pricer->sensorFor(''))->toBeNull()
            ->and($pricer->sensorFor('   '))->toBeNull();
    });
});
