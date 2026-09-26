<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The standard roles under their German names (docs/admin/BRIEF.md §2): Super-Admin, Katalog,
 * Gutachten, Bestellungen, Inhalte, Support, Buchhaltung.
 *
 * A migration rather than a re-seed, because re-running AccessSeeder would also rewrite every right
 * the client has changed since. And only where the label is still exactly the one that was seeded:
 * a role the client has already renamed keeps its name, in both directions. Idempotent — on a
 * database that is already German, or empty, it changes nothing.
 */
return new class extends Migration
{
    /** role name => [seeded label, German label] */
    private const LABELS = [
        'super-admin' => ['Super Admin', 'Super-Admin'],
        'catalogue-manager' => ['Katalog-Manager', 'Katalog'],
        'compliance-editor' => ['Compliance Editor', 'Gutachten'],
        'order-manager' => ['Bestell-Manager', 'Bestellungen'],
        'content-editor' => ['Content Editor', 'Inhalte'],
        'support-agent' => ['Support Agent', 'Support'],
    ];

    public function up(): void
    {
        foreach (self::LABELS as $name => [$old, $new]) {
            $this->relabel($name, $old, $new);
        }
    }

    public function down(): void
    {
        foreach (self::LABELS as $name => [$old, $new]) {
            $this->relabel($name, $new, $old);
        }
    }

    /**
     * Compared in PHP, byte for byte: the column's collation ignores case, and a client who wrote
     * "super admin" on purpose has renamed the role as surely as one who wrote "Chef".
     */
    private function relabel(string $name, string $from, string $to): void
    {
        $ids = DB::table('roles')
            ->where('guard_name', 'admin')
            ->where('name', $name)
            ->get(['id', 'label_de'])
            ->filter(static fn (object $row): bool => ($row->label_de ?? null) === $from)
            ->pluck('id')
            ->all();

        if ($ids !== []) {
            DB::table('roles')->whereIn('id', $ids)->update(['label_de' => $to]);
        }
    }
};
