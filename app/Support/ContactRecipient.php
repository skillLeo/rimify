<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\AdminUser;
use App\Models\Setting;
use App\Services\Admin\AuditTrail;

/**
 * Where the contact form's messages are mailed (the client's #12: his shop's own address, D-347): an admin setting, kept on
 * Verkauf › Nachrichten — the configured contact address until someone sets another. Every message is kept in the admin
 * whatever the mail does; this is the copy that reaches the team's inbox.
 */
final class ContactRecipient
{
    public const KEY = 'contact.recipient';

    public static function address(): string
    {
        $value = Setting::get(self::KEY);

        return is_string($value) && trim($value) !== '' ? trim($value) : trim((string) config('rimify.contact.email'));
    }

    public static function set(string $address, AdminUser $admin): void
    {
        $before = self::address();
        $address = mb_strtolower(trim($address));

        if ($before === $address) {
            return;
        }

        Setting::set(self::KEY, $address);
        AuditTrail::record($admin, 'contact.recipient_changed', ['before' => $before, 'after' => $address]);
    }
}
