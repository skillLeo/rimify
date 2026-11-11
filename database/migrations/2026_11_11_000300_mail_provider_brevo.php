<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Mail through Brevo (his round of 08.11, §7A; D-450): Einstellungen › E-Mail keeps one set per state, now of one of two
 * providers — Amazon SES as before, or Brevo's SMTP relay with its SMTP login and SMTP key. The key goes where SES's secret
 * goes: encrypted, hidden, only its last four characters ever shown. A set saved before is SES's.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mail_settings', function (Blueprint $t): void {
            $t->string('provider', 16)->default('ses')->after('state')->comment('ses, brevo');
            $t->string('smtp_login', 254)->nullable()->after('from_name')->comment('Brevo: the SMTP login it shows, not secret');
        });
    }

    public function down(): void
    {
        Schema::table('mail_settings', function (Blueprint $t): void {
            $t->dropColumn(['provider', 'smtp_login']);
        });
    }
};
