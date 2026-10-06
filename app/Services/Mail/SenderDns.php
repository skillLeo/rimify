<?php

declare(strict_types=1);

namespace App\Services\Mail;

use App\Models\MailSetting;
use Illuminate\Support\Facades\Cache;

/**
 * The DNS records Amazon SES needs on the sender's domain, each looked up as the world sees it (the brief „AFTER CI“,
 * §3): SPF on the MAIL FROM domain (its TXT and the MX SES's bounces come back by), the three DKIM CNAMEs SES names
 * for the domain, and DMARC. Each record comes back with its name, its type, the value it must hold and whether it does
 * — so the go-live check and Einstellungen › E-Mail say exactly what to enter, never „DNS unvollständig“.
 *
 * Lookups are cached for ten minutes: the check runs on a page, and DNS changes take longer than that to show anyway.
 *
 * @phpstan-type Record array{kind: string, type: string, name: string, value: string, found: bool}
 */
final class SenderDns
{
    public const CACHE_MINUTES = 10;

    public function __construct(private readonly DnsLookup $dns) {}

    /** The MAIL FROM domain the shop asks SES to use, unless SES already names another. */
    public static function mailFromDomain(string $domain, ?string $named = null): string
    {
        return $named ?? 'bounce.'.$domain;
    }

    /**
     * Every record, in the order the setup guide enters them. Without the DKIM tokens (SES names them once the domain is
     * created there and the connection test has read them) the three DKIM records are one line that says so.
     *
     * @param  list<string>  $dkimTokens
     * @return list<Record>
     */
    public function records(string $domain, array $dkimTokens, ?string $mailFrom = null, string $region = MailSetting::REGION): array
    {
        $mailFrom = self::mailFromDomain($domain, $mailFrom);
        $feedback = "feedback-smtp.{$region}.amazonses.com";
        $records = [
            [
                'kind' => 'SPF',
                'type' => 'TXT',
                'name' => $mailFrom,
                'value' => 'v=spf1 include:amazonses.com ~all',
                'found' => $this->txt($mailFrom, static fn (string $t): bool => str_starts_with($t, 'v=spf1') && str_contains($t, 'include:amazonses.com')),
            ],
            [
                'kind' => 'SPF',
                'type' => 'MX',
                'name' => $mailFrom,
                'value' => "10 {$feedback}",
                'found' => in_array($feedback, $this->mx($mailFrom), true),
            ],
        ];

        if ($dkimTokens === []) {
            $records[] = ['kind' => 'DKIM', 'type' => 'CNAME', 'name' => "(drei Einträge)._domainkey.{$domain}", 'value' => '(…).dkim.amazonses.com – SES nennt sie, sobald die Domain dort angelegt ist', 'found' => false];
        }

        foreach ($dkimTokens as $token) {
            $records[] = [
                'kind' => 'DKIM',
                'type' => 'CNAME',
                'name' => "{$token}._domainkey.{$domain}",
                'value' => "{$token}.dkim.amazonses.com",
                'found' => $this->cname("{$token}._domainkey.{$domain}") === "{$token}.dkim.amazonses.com",
            ];
        }

        $records[] = [
            'kind' => 'DMARC',
            'type' => 'TXT',
            'name' => "_dmarc.{$domain}",
            // p=none first: the domain's other mail (the client's own mailbox) must pass too before a stricter policy.
            'value' => "v=DMARC1; p=none; rua=mailto:dmarc@{$domain}",
            'found' => $this->txt("_dmarc.{$domain}", static fn (string $t): bool => str_starts_with(strtoupper(str_replace(' ', '', $t)), 'V=DMARC1')),
        ];

        return $records;
    }

    /**
     * The records still missing, as one sentence a person can act on: „SPF: TXT bounce.rimify.de „v=spf1 …“; …“.
     *
     * @param  list<Record>  $records
     */
    public static function missingSentence(array $records): string
    {
        $missing = array_values(array_filter($records, static fn (array $r): bool => ! $r['found']));

        return implode('; ', array_map(static fn (array $r): string => "{$r['kind']}: {$r['type']} {$r['name']} → „{$r['value']}“", $missing));
    }

    /** @param  callable(string): bool  $matches */
    private function txt(string $host, callable $matches): bool
    {
        foreach ($this->lookup($host, DNS_TXT) as $record) {
            $text = (string) ($record['txt'] ?? implode('', (array) ($record['entries'] ?? [])));

            if ($matches(trim($text))) {
                return true;
            }
        }

        return false;
    }

    /** @return list<string> */
    private function mx(string $host): array
    {
        return array_map(static fn (array $r): string => strtolower(rtrim((string) ($r['target'] ?? ''), '.')), $this->lookup($host, DNS_MX));
    }

    private function cname(string $host): ?string
    {
        foreach ($this->lookup($host, DNS_CNAME) as $record) {
            if (isset($record['target'])) {
                return strtolower(rtrim((string) $record['target'], '.'));
            }
        }

        return null;
    }

    /** @return list<array<string, mixed>> */
    private function lookup(string $host, int $type): array
    {
        /** @var list<array<string, mixed>> */
        return Cache::remember('sender-dns:'.$type.':'.strtolower($host), now()->addMinutes(self::CACHE_MINUTES), fn (): array => $this->dns->records($host, $type));
    }
}
