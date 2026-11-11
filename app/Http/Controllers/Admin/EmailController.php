<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\MailSettingsRequest;
use App\Http\Requests\Admin\MailSettingsViewRequest;
use App\Http\Requests\Admin\MailSuppressionReleaseRequest;
use App\Http\Requests\Admin\MailTestSendRequest;
use App\Models\MailSetting;
use App\Models\MailSuppression;
use App\Services\Admin\AuditTrail;
use App\Services\Mail\BrevoProbe;
use App\Services\Mail\MailSettings;
use App\Services\Mail\MailSettingsWriter;
use App\Services\Mail\SenderDns;
use App\Services\Storage\StorageConfig;
use App\Support\EditStamp;
use App\Support\GermanFormat;
use App\Support\MailDelivery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Mail\MailManager;
use Illuminate\Mail\Message;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Einstellungen › E-Mail: the Amazon SES key — or, since his round of 08.11 (§7A, D-450), Brevo's SMTP login and key — the
 * shop sends its mail with (the brief „AFTER CI“, §3), entered by the
 * operator — never written into the code or a file (R-16). Built as Medien und Speicher: write-only keys, a save
 * tested before it replaces what works, „Verbindung testen“ on demand. Beside it what SES needs from the world: the DNS
 * records of the sender's domain as they stand (SenderDns), the address SNS reports to, and the addresses SES reported
 * as undeliverable or complaining, each of which can be released.
 */
class EmailController extends Controller
{
    /** The blocked addresses the page lists, newest first; any other is found by its search. */
    public const SUPPRESSIONS_SHOWN = 50;

    public function edit(MailSettingsViewRequest $request, MailSettings $settings, SenderDns $dns): Response
    {
        $active = MailSetting::query()->where('state', MailSetting::ACTIVE)->first();
        $pending = MailSetting::query()->where('state', MailSetting::PENDING)->first();
        $shown = $pending ?? $active;
        /** @var array<string, mixed>|null $test */
        $test = $request->session()->get('mail_test') ?? $shown?->last_test;
        $domain = MailSetting::domainOf($shown->from_address ?? null);
        $search = $request->blockedSearch();
        $blocked = MailSuppression::query()->inForce()
            ->when($search !== '', static fn ($q) => $q->where('email', 'like', '%'.addcslashes($search, '%_\\').'%'));

        return Inertia::render('Admin/Einstellungen/Email', [
            'form' => [
                // Amazon SES or Brevo (D-450); a set saved before was SES's.
                'provider' => $shown->provider ?? MailSetting::SES,
                'smtp_login' => $shown->smtp_login ?? '',
                'from_address' => $shown->from_address ?? '',
                'from_name' => $shown->from_name ?? (string) config('mail.from.name', 'RIMIFY'),
                'topic_arn' => $shown->topic_arn ?? '',
            ],
            'region' => MailSetting::REGION,
            // Only ever the last four characters, masked.
            'keyMasked' => StorageConfig::mask($shown?->key_last4),
            'secretMasked' => StorageConfig::mask($shown?->secret_last4),
            'pending' => $pending !== null,
            'verifiedAt' => $active?->verified_at?->toIso8601String(),
            'sending' => $settings->sending() !== null,
            // The provider the shop sends with now, if any: the context line names it.
            'sendingProvider' => $settings->sending()?->provider,
            // „Test-E-Mail senden“: what the last one did, the relay's words where it failed.
            'testMail' => $request->session()->get('test_mail'),
            'brevoHost' => MailSetting::BREVO_HOST.':'.MailSetting::BREVO_PORT,
            'mailer' => (string) config('mail.default'),
            'test' => $test,
            'dns' => $domain === null ? [] : $dns->records(
                $domain,
                array_values(array_filter((array) ($test['dkim_tokens'] ?? []), 'is_string')),
                is_string($test['mail_from_domain'] ?? null) ? $test['mail_from_domain'] : null,
            ),
            'domain' => $domain,
            'webhookUrl' => route('webhooks.ses'),
            // The newest SUPPRESSIONS_SHOWN, and a search for any other: the list stopped at 50 without a word, and an
            // older address could not be released (the admin audit's sweep after F-26).
            'suppressionsTotal' => MailSuppression::query()->inForce()->count(),
            'suppressionSearch' => $search,
            'suppressionsFound' => $blocked->count(),
            'suppressions' => $blocked->latest('occurred_at')->limit(self::SUPPRESSIONS_SHOWN)->get()
                ->map(static fn (MailSuppression $s): array => [
                    'id' => $s->id,
                    'email' => $s->email,
                    'reason' => $s->reason === MailSuppression::COMPLAINT ? 'Beschwerde' : 'Unzustellbar',
                    'detail' => $s->detail,
                    'at' => GermanFormat::dateTime($s->occurred_at),
                ])->all(),
            // What this form was opened on: a save against an older state is refused (EditStamp, F-25).
            'stamp' => EditStamp::of(self::state()),
        ]);
    }

    public function update(MailSettingsRequest $request, MailSettingsWriter $writer): RedirectResponse
    {
        // Checked before the save asks SES: nothing is probed for a form opened on an older state.
        EditStamp::guard($request, self::state());
        $result = $writer->save($request->values(), $request->admin());

        $name = $request->values()['provider'] === MailSetting::BREVO ? 'Brevo' : 'Amazon SES';

        return back()
            ->with('mail_test', $result['test'])
            ->with('toast', match (true) {
                ! $result['active'] => "Gespeichert, aber der Zugang zu {$name} klappt nicht. Es gelten weiter die bisherigen Einstellungen.",
                MailSettings::cleared($result['test']) => "Gespeichert und geprüft. Der Shop verschickt seine Mails ab jetzt über {$name}.",
                default => 'Gespeichert. Der Zugang klappt; verschickt wird über SES, sobald die Prüfung unten keine offenen Punkte mehr nennt.',
            });
    }

    /**
     * The stored sets as far as a stale save must notice them — every column but the key and the secret themselves
     * (encrypted, and different on every write; their last four stand for them).
     *
     * @return list<array<string, mixed>>
     */
    private static function state(): array
    {
        return MailSetting::query()->orderBy('id')->get()
            ->map(static fn (MailSetting $row): array => Arr::except($row->getAttributes(), ['access_key', 'secret']))
            ->all();
    }

    /** „Verbindung testen“ with the values on the form — nothing is saved, nothing is sent. */
    public function test(MailSettingsRequest $request, MailSettingsWriter $writer): RedirectResponse
    {
        $base = MailSetting::query()->where('state', MailSetting::PENDING)->first()
            ?? MailSetting::query()->where('state', MailSetting::ACTIVE)->first();
        $result = $writer->probe($writer->candidate($request->values(), $base));
        $name = $request->values()['provider'] === MailSetting::BREVO ? 'Brevo' : 'Amazon SES';

        return back()
            ->with('mail_test', $result)
            ->with('toast', ($result['ok'] ?? false) === true ? "Verbindung zu {$name} steht." : 'Die Verbindung klappt nicht. Die Schritte darunter sagen, woran es liegt.');
    }

    /**
     * „Test-E-Mail senden“ (D-450): one real message through the mailer the shop sends with now, to the address typed —
     * and the answer as it came: sent, or the transport's exact error. Nothing is sent while no set is in force: the page
     * says so instead of pretending a message left.
     */
    public function sendTest(MailTestSendRequest $request, MailSettings $settings): RedirectResponse
    {
        $to = $request->to();
        // The set in force, as a send would find it (a faked mailer in a test is no manager to reset).
        $manager = Mail::getFacadeRoot();
        $settings->apply($manager instanceof MailManager ? $manager : null);

        if (! MailDelivery::real()) {
            $result = ['ok' => false, 'to' => $to, 'error' => self::NOT_SENDING];
        } else {
            try {
                Mail::raw(
                    "Hallo,\n\ndiese Nachricht prüft, ob der Shop E-Mails verschicken kann. Sie wurde unter Einstellungen › E-Mail mit „Test-E-Mail senden“ ausgelöst; du musst nichts tun.\n\nRIMIFY",
                    static fn (Message $message) => $message->to($to)->subject('RIMIFY – Test-E-Mail'),
                );
                $result = ['ok' => true, 'to' => $to, 'error' => null];
            } catch (Throwable $e) {
                $result = ['ok' => false, 'to' => $to, 'error' => BrevoProbe::reason($e)];
            }
        }

        AuditTrail::record($request->admin(), 'mail.test_sent', ['to' => $to, 'ok' => $result['ok'], 'mailer' => (string) config('mail.default'), 'error' => $result['error']]);

        return back()
            ->with('test_mail', $result)
            ->with('toast', $result['ok'] ? "Die Test-E-Mail an {$to} ist verschickt." : 'Die Test-E-Mail wurde nicht verschickt. Der Grund steht darunter.');
    }

    /** No set in force: the mail would go to the log, so none is sent and the page says why. */
    public const NOT_SENDING = 'Noch ist kein Versand eingerichtet: Speichere zuerst einen Zugang, dessen Prüfung oben nichts Offenes mehr nennt. Bis dahin schreibt der Shop Mails nur ins Protokoll der Anwendung.';

    /** Lifting the block on one address: the shop sends to it again. SES's own list is lifted in the SES console. */
    public function release(MailSuppressionReleaseRequest $request, MailSuppression $suppression): RedirectResponse
    {
        if ($suppression->released_at === null) {
            $suppression->forceFill(['released_at' => now(), 'released_by' => $request->admin()->id])->save();
            AuditTrail::record($request->admin(), 'mail.suppression_released', ['email' => $suppression->email]);
        }

        return back()->with('toast', "Die Sperre für {$suppression->email} ist aufgehoben. Steht die Adresse auch auf der Sperrliste von SES, entferne sie dort ebenfalls.");
    }
}
