<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The navigation of the rebuilt shell, and the table behind "Suchen ohne Treffer".
 *
 * The header now carries the catalogue's own categories, the footer is four named columns rather
 * than one list, and the phone's bottom bar reads *Check* rather than the product name in capitals.
 * Written as a migration because the content seeder never runs again on a database an editor has
 * touched; idempotent, so a database that already carries these rows is left as it is.
 */
return new class extends Migration
{
    /** @var array<string, list<array{label: string, route_name?: string, href?: string, behaviour?: string, icon?: string}>> */
    private const MENUS = [
        'header' => [
            ['label' => 'Felgen', 'route_name' => 'felgen.index'],
            ['label' => 'RIMIFY-Check', 'route_name' => 'check.index'],
            ['label' => 'FAQ', 'route_name' => 'faq'],
            ['label' => 'Kontakt', 'route_name' => 'kontakt'],
        ],
        'footer_shop' => [
            ['label' => 'Alle Felgen', 'route_name' => 'felgen.index'],
            ['label' => 'Fahrzeug wählen', 'route_name' => 'felgen.suchen'],
            ['label' => 'RIMIFY-Check', 'route_name' => 'check.index'],
        ],
        'footer_service' => [
            ['label' => 'Fragen und Antworten', 'route_name' => 'faq'],
            ['label' => 'Kontakt', 'route_name' => 'kontakt'],
            ['label' => 'Versand', 'href' => '/rechtliches/versand'],
        ],
        'footer_legal' => [
            ['label' => 'Impressum', 'href' => '/rechtliches/impressum'],
            ['label' => 'Datenschutz', 'href' => '/rechtliches/datenschutz'],
            ['label' => 'AGB', 'href' => '/rechtliches/agb'],
            ['label' => 'Widerrufsbelehrung', 'href' => '/rechtliches/widerrufsbelehrung'],
        ],
        'mobile_bottom' => [
            ['label' => 'Start', 'route_name' => 'startseite', 'icon' => 'home'],
            ['label' => 'Felgen', 'route_name' => 'felgen.index', 'icon' => 'wheel'],
            ['label' => 'Check', 'route_name' => 'check.index', 'icon' => 'check-circle'],
            ['label' => 'Kontakt', 'route_name' => 'kontakt', 'icon' => 'phone'],
            ['label' => 'Warenkorb', 'route_name' => 'warenkorb.index', 'icon' => 'cart'],
        ],
    ];

    public function up(): void
    {
        // The menu column is constrained to the menus that exist; two footer columns are new and
        // one list is gone, so the constraint is rewritten around the rows once they are right.
        Constraints::dropIfExists('nav_items', 'chk_nav_items_menu');

        // The single footer list the old footer read; its rows moved into the columns below.
        DB::table('nav_items')->where('menu', 'footer_pages')->delete();

        foreach (self::MENUS as $menu => $items) {
            $labels = [];

            foreach ($items as $index => $item) {
                $labels[] = $item['label'];

                // The label is written on the update as well: under a case-insensitive collation
                // "RIMIFY-CHECK" matches "RIMIFY-Check", and the row must end up spelled as here.
                DB::table('nav_items')->updateOrInsert(
                    ['menu' => $menu, 'label' => $item['label']],
                    [
                        'label' => $item['label'],
                        'href' => $item['href'] ?? null,
                        'route_name' => $item['route_name'] ?? null,
                        'behaviour' => $item['behaviour'] ?? null,
                        'icon' => $item['icon'] ?? null,
                        'sort_order' => $index,
                        'visible' => true,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ],
                );
            }

            DB::table('nav_items')->where('menu', $menu)->whereNotIn('label', $labels)->delete();
        }

        Constraints::enum('nav_items', 'menu', array_keys(self::MENUS));

        if (! Schema::hasTable('search_misses')) {
            Schema::create('search_misses', function (Blueprint $table): void {
                $table->id();
                $table->string('query', 120)->unique();
                $table->unsignedInteger('misses')->default(1);
                $table->timestamp('last_missed_at');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('search_misses');
    }
};
