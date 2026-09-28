<?php

declare(strict_types=1);

use App\Enums\AdminUserStatus;
use App\Enums\OrderStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Listeners\FailedJobAlert;
use App\Mail\AdminAlertMail;
use App\Models\AdminUser;
use App\Models\FitmentConflict;
use App\Models\Order;
use App\Services\Admin\AdminAlerts;
use App\Support\GermanFormat;
use Database\Seeders\AccessSeeder;
use Illuminate\Contracts\Queue\Job;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

/**
 * Who on the team hears about what (AdminAlerts). The rule under every test: a person is told only
 * about an area their role may open, only if they have not switched that kind off, and an alert that
 * fails never takes the thing it reports on down with it.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    Cache::flush();
});

function alertAdmin(string $role): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** @return list<string> the e-mail addresses of everyone holding at least one alert of this kind */
function toldAbout(string $kind): array
{
    return AdminUser::query()->orderBy('id')->get()
        ->filter(static fn (AdminUser $u): bool => $u->notifications()->get()->contains(static fn ($n): bool => ($n->data['kind'] ?? null) === $kind))
        ->pluck('email')->values()->all();
}

/** @return list<string> */
function mayView(PermissionModule $module): array
{
    return AdminUser::query()->orderBy('id')->get()
        ->filter(static fn (AdminUser $u): bool => $u->may($module, PermissionAction::View))
        ->pluck('email')->values()->all();
}

function paidOrder(): Order
{
    $order = Order::factory()->pendingPayment()->create(['order_number' => 'RMF-000042', 'total_cents' => 142500]);
    $order->update(['status' => OrderStatus::Paid->value]);

    return $order;
}

describe('an order turning Bezahlt', function (): void {
    it('tells everyone who may open Bestellungen, and nobody else', function (): void {
        paidOrder();

        expect(toldAbout('order_paid'))->toBe(mayView(PermissionModule::Orders))
            ->and(toldAbout('order_paid'))->not->toContain('content-editor@rimify.test');
    });

    it('says which order and what it is worth, in German', function (): void {
        paidOrder();

        $data = alertAdmin('order-manager')->notifications()->firstOrFail()->data;

        expect($data['title'])->toBe('Bestellung RMF-000042 ist bezahlt.')
            ->and($data['detail'])->toBe("1.425,00\u{202F}€ · Audi RS 4 Avant Quattro (B9)");
    });

    it('rings no bell for an order that was written as paid — demo data, imports', function (): void {
        Order::factory()->create();

        expect(toldAbout('order_paid'))->toBe([]);
    });

    it('does not ring again when a paid order changes something else', function (): void {
        $order = paidOrder();
        $order->update(['tracking_code' => 'DHL123']);

        expect(alertAdmin('order-manager')->notifications()->count())->toBe(1);
    });

    it('does not tell a suspended account', function (): void {
        alertAdmin('order-manager')->forceFill(['status' => AdminUserStatus::Suspended])->save();

        paidOrder();

        expect(toldAbout('order_paid'))->not->toContain('order-manager@rimify.test');
    });
});

describe('what each person chose', function (): void {
    it('mails nobody by default', function (): void {
        Mail::fake();

        paidOrder();

        Mail::assertNothingSent();
    });

    it('mails a person who switched e-mail on, and leaves the bell out for one who switched it off', function (): void {
        Mail::fake();
        $manager = alertAdmin('order-manager');
        app(AdminAlerts::class)->remember($manager, ['order_paid' => ['inApp' => false, 'email' => true]]);

        paidOrder();

        Mail::assertSent(AdminAlertMail::class, fn (AdminAlertMail $mail): bool => $mail->hasTo('order-manager@rimify.test')
            && $mail->title === 'Bestellung RMF-000042 ist bezahlt.');
        expect($manager->notifications()->count())->toBe(0);
    });

    it('keeps an order paid when the mail server is down', function (): void {
        app(AdminAlerts::class)->remember(alertAdmin('order-manager'), ['order_paid' => ['inApp' => true, 'email' => true]]);
        Mail::shouldReceive('to')->andThrow(new RuntimeException('SMTP down'));

        $order = paidOrder();

        expect($order->fresh()?->status)->toBe(OrderStatus::Paid)
            ->and(alertAdmin('order-manager')->notifications()->count())->toBe(1);
    });

    it('offers each person only the kinds of the areas they may open', function (): void {
        expect(array_column(app(AdminAlerts::class)->kindsFor(alertAdmin('content-editor')), 'kind'))->toBe([])
            ->and(array_column(app(AdminAlerts::class)->kindsFor(alertAdmin('order-manager')), 'kind'))->toBe(['order_paid'])
            ->and(array_column(app(AdminAlerts::class)->kindsFor(alertAdmin('super-admin')), 'kind'))->toBe(['order_paid', 'conflict_opened', 'job_failed']);
    });
});

describe('a conflict between two documents', function (): void {
    it('tells everyone who may open the Gutachten area', function (): void {
        FitmentConflict::factory()->create();

        expect(toldAbout('conflict_opened'))->toBe(mayView(PermissionModule::Approvals));
    });

    it('names the car and the Felge, and explains the disagreement in a sentence, never as a code', function (): void {
        $conflict = FitmentConflict::factory()->entryRequirement()->create();
        $vehicle = $conflict->vehicle;
        $config = $conflict->wheelConfig;

        $data = alertAdmin('compliance-editor')->notifications()->firstOrFail()->data;

        expect($data['title'])->toBe("Zwei Gutachten widersprechen sich beim {$vehicle?->make} {$vehicle?->model} {$vehicle?->variant}.")
            ->and($data['detail'])->toContain(GermanFormat::wheelSize($config->width_in, $config->diameter_in, $config->et_mm))
            ->and($data['detail'])->toEndWith('Eines verlangt eine Eintragung, das andere nicht. Bis zur Klärung gilt die strengere Angabe.')
            ->and($data['detail'])->not->toContain('ENTRY_REQUIREMENT');
    });

    it('links nowhere while the Konflikte page does not exist', function (): void {
        FitmentConflict::factory()->create();

        $data = alertAdmin('compliance-editor')->notifications()->firstOrFail()->data;

        expect(AdminAlerts::href($data['target']))->toBeNull();
    });
});

describe('a job that gives up', function (): void {
    function failJob(string $name): void
    {
        $job = Mockery::mock(Job::class);
        $job->shouldReceive('resolveName')->andReturn($name);

        event(new JobFailed('database', $job, new RuntimeException('Kunde max@example.de: SQL …')));
    }

    it('tells whoever may open the settings, naming the job and nothing of its error', function (): void {
        failJob('App\\Mail\\FitmentAvailableMail');

        $data = alertAdmin('super-admin')->notifications()->firstOrFail()->data;

        expect(toldAbout('job_failed'))->toBe(mayView(PermissionModule::Settings))
            ->and($data['detail'])->toBe('Betroffen: die E-Mail an eine Anfrage, dass es jetzt Felgen für ihr Auto gibt. Weitere Fehler dieser Aufgabe melden wir frühestens in 15 Minuten.')
            ->and($data['detail'])->not->toContain('max@example.de');
    });

    it('names a job it has no German name for by its technical name, said as such', function (): void {
        expect(FailedJobAlert::describe('App\\Jobs\\ImportVehicles'))->toBe('eine Aufgabe mit dem technischen Namen „ImportVehicles“')
            ->and(FailedJobAlert::describe(''))->toBe('eine unbekannte Aufgabe');
    });

    it('rings once for a job failing a hundred times, not a hundred times', function (): void {
        foreach (range(1, 5) as $ignored) {
            failJob('App\\Jobs\\SendFitmentAvailableMail');
        }

        failJob('App\\Jobs\\ImportVehicles');

        expect(alertAdmin('super-admin')->notifications()->count())->toBe(2);
    });

    it('rings again once the quiet quarter of an hour is over', function (): void {
        failJob('App\\Jobs\\SendFitmentAvailableMail');
        $this->travel(FailedJobAlert::QUIET_SECONDS + 1)->seconds();
        failJob('App\\Jobs\\SendFitmentAvailableMail');

        expect(alertAdmin('super-admin')->notifications()->count())->toBe(2);
    });
});
