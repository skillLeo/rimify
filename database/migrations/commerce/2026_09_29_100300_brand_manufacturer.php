<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * GPSR (Verordnung (EU) 2023/988, Art. 19): an online offer names the product's manufacturer — name, postal
 * address, an electronic contact — and, for one outside the EU, the responsible person inside it, and carries the
 * product's safety information. Per brand, entered by a person in Katalog › Marken; null until then (never guessed),
 * and `rimify:preflight` names every published wheel whose brand still has none.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('brands', function (Blueprint $t): void {
            $t->string('manufacturer_name', 190)->nullable()->after('sort_order');
            $t->string('manufacturer_address', 500)->nullable()->after('manufacturer_name');
            $t->string('manufacturer_contact', 190)->nullable()->after('manufacturer_address')->comment('an e-mail address or a web address');
            $t->string('eu_responsible_name', 190)->nullable()->after('manufacturer_contact')->comment('only for a manufacturer outside the EU');
            $t->string('eu_responsible_address', 500)->nullable()->after('eu_responsible_name');
            $t->string('eu_responsible_contact', 190)->nullable()->after('eu_responsible_address');
            $t->text('safety_note')->nullable()->after('eu_responsible_contact')->comment('the manufacturer\'s safety information, in German');
        });
    }

    public function down(): void
    {
        Schema::table('brands', function (Blueprint $t): void {
            $t->dropColumn(['manufacturer_name', 'manufacturer_address', 'manufacturer_contact', 'eu_responsible_name', 'eu_responsible_address', 'eu_responsible_contact', 'safety_note']);
        });
    }
};
