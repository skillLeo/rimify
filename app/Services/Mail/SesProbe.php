<?php

declare(strict_types=1);

namespace App\Services\Mail;

use App\Models\MailSetting;
use App\Services\Storage\AwsClients;
use App\Services\Storage\StorageTester;
use App\Support\GermanFormat;
use Aws\Exception\AwsException;
use Throwable;

/**
 * „Verbindung testen“ for Einstellungen › E-Mail: asks Amazon SES itself, with the set on the form, each answer a line
 * of its own — the account (does the key work, may it send, is it out of the sandbox, does SES keep its own list of
 * undeliverable and complaining addresses) and the sender's domain (verified, its three DKIM keys, its MAIL FROM
 * domain). Sends nothing. The answer also carries what the go-live check and the DNS check need: the DKIM tokens SES
 * names, and whether the set may carry the shop's mail (MailSettings::cleared).
 *
 * @phpstan-type Step array{step: string, ok: bool, detail: string|null}
 * @phpstan-type Result array{ok: bool, steps: list<Step>, at: string, production_access: bool, sending_enabled: bool, identity_verified: bool, dkim_status: string|null, dkim_tokens: list<string>, mail_from_domain: string|null, mail_from_status: string|null}
 */
final class SesProbe
{
    public function __construct(private readonly AwsClients $aws) {}

    /** @return Result */
    public function run(MailSetting $set): array
    {
        $facts = ['production_access' => false, 'sending_enabled' => false, 'identity_verified' => false, 'dkim_status' => null, 'dkim_tokens' => [], 'mail_from_domain' => null, 'mail_from_status' => null];
        $domain = $set->domain();

        if (! $set->complete() || $domain === null) {
            return self::result([['step' => 'Zugang zu Amazon SES ('.$set->region.')', 'ok' => false, 'detail' => 'Absenderadresse, Zugriffsschlüssel und geheimer Schlüssel werden gebraucht.']], $facts, false);
        }

        $client = $this->aws->ses($set->region, (string) $set->access_key, (string) $set->secret);

        try {
            $account = $client->getAccount();
        } catch (Throwable $e) {
            return self::result([['step' => 'Zugang zu Amazon SES ('.$set->region.')', 'ok' => false, 'detail' => StorageTester::reason($e)]], $facts, false);
        }

        $facts['sending_enabled'] = (bool) $account->get('SendingEnabled');
        $facts['production_access'] = (bool) $account->get('ProductionAccessEnabled');
        $quota = (array) $account->get('SendQuota');
        $reasons = (array) (((array) $account->get('SuppressionAttributes'))['SuppressedReasons'] ?? []);
        $selfSuppressing = in_array('BOUNCE', $reasons, true) && in_array('COMPLAINT', $reasons, true);

        $steps = [
            ['step' => 'Zugang zu Amazon SES ('.$set->region.')', 'ok' => true, 'detail' => null],
            ['step' => 'Versand für das Konto freigeschaltet', 'ok' => $facts['sending_enabled'], 'detail' => $facts['sending_enabled'] ? null : 'AWS hat den Versand für dieses Konto angehalten. Der Grund steht in der SES-Konsole unter „Account dashboard“.'],
            ['step' => 'Produktionszugang: Versand an jede Adresse', 'ok' => $facts['production_access'], 'detail' => $facts['production_access']
                ? 'Bis zu '.GermanFormat::integer((int) ($quota['Max24HourSend'] ?? 0)).' Mails in 24 Stunden.'
                : 'Das Konto ist noch in der Sandbox: SES stellt nur an bestätigte Adressen zu, eine Bestellbestätigung an Kunden käme nicht an. Produktionszugang in der SES-Konsole beantragen (docs/ops/MAIL-SES.md).'],
            ['step' => 'SES führt eine eigene Sperrliste für unzustellbare Adressen und Beschwerden', 'ok' => $selfSuppressing, 'detail' => $selfSuppressing ? null : 'In der SES-Konsole unter „Suppression list“ für Bounces und Beschwerden einschalten.'],
        ];

        try {
            $identity = $client->getEmailIdentity(['EmailIdentity' => $domain]);
        } catch (Throwable $e) {
            $missing = $e instanceof AwsException && $e->getAwsErrorCode() === 'NotFoundException';
            $steps[] = ['step' => "Absenderdomain {$domain} in SES", 'ok' => false, 'detail' => $missing
                ? "Die Domain ist in SES ({$set->region}) noch nicht angelegt: unter „Identities“ als Domain mit Easy DKIM anlegen."
                : StorageTester::reason($e)];

            return self::result($steps, $facts, true);
        }

        $dkim = (array) $identity->get('DkimAttributes');
        $mailFrom = (array) $identity->get('MailFromAttributes');
        $facts['identity_verified'] = (bool) $identity->get('VerifiedForSendingStatus');
        $facts['dkim_status'] = isset($dkim['Status']) ? (string) $dkim['Status'] : null;
        $facts['dkim_tokens'] = array_values(array_map('strval', (array) ($dkim['Tokens'] ?? [])));
        $facts['mail_from_domain'] = isset($mailFrom['MailFromDomain']) && $mailFrom['MailFromDomain'] !== '' ? (string) $mailFrom['MailFromDomain'] : null;
        $facts['mail_from_status'] = isset($mailFrom['MailFromDomainStatus']) ? (string) $mailFrom['MailFromDomainStatus'] : null;

        $steps[] = ['step' => "Absenderdomain {$domain} bestätigt", 'ok' => $facts['identity_verified'], 'detail' => $facts['identity_verified'] ? null : 'SES wartet auf die DKIM-Einträge im DNS der Domain; sie stehen unten unter „DNS-Einträge der Absenderdomain“.'];
        $steps[] = ['step' => 'DKIM-Signatur', 'ok' => $facts['dkim_status'] === 'SUCCESS', 'detail' => match ($facts['dkim_status']) {
            'SUCCESS' => null,
            'PENDING' => 'SES hat die drei CNAME-Einträge noch nicht gefunden.',
            'FAILED', 'TEMPORARY_FAILURE' => 'SES findet die drei CNAME-Einträge nicht (mehr).',
            default => 'Für die Domain ist Easy DKIM nicht eingeschaltet.',
        }];
        $steps[] = ['step' => 'Eigene MAIL-FROM-Domain', 'ok' => $facts['mail_from_status'] === 'SUCCESS', 'detail' => $facts['mail_from_domain'] === null
            ? 'Nicht eingerichtet: unter „Identities“ › die Domain › „Custom MAIL FROM domain“ bounce.'.$domain.' eintragen, damit SPF für die Domain gilt.'
            : ($facts['mail_from_status'] === 'SUCCESS' ? $facts['mail_from_domain'] : 'SES findet den MX- und den TXT-Eintrag für '.$facts['mail_from_domain'].' noch nicht.')];

        return self::result($steps, $facts, true);
    }

    /**
     * @param  list<array{step: string, ok: bool, detail: string|null}>  $steps
     * @param  array{production_access: bool, sending_enabled: bool, identity_verified: bool, dkim_status: string|null, dkim_tokens: list<string>, mail_from_domain: string|null, mail_from_status: string|null}  $facts
     * @return Result
     */
    private static function result(array $steps, array $facts, bool $reached): array
    {
        return ['ok' => $reached, 'steps' => $steps, 'at' => now()->toIso8601String(), ...$facts];
    }
}
