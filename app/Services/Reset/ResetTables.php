<?php

declare(strict_types=1);

namespace App\Services\Reset;

/**
 * Every table of the database, in one of three groups — what a reset of the test environment replaces, and what it
 * never touches (TestReset).
 *
 *  - KEPT: the team, its roles and rights, the settings, the Protokoll (R-12) and the reference tables the engine
 *    cannot work without (R-03). No level replaces them; their demo rows go, and an undo brings those back.
 *  - CONTENT: pages, FAQ and menus. Only „Alles“ replaces them — with the rows a delivered shop starts with (the
 *    baseline, database/baseline/testumgebung.sql).
 *  - SHOP: the catalogue, the Gutachten and their rows, the cars, the orders with everything that hangs off them,
 *    and the figures drawn from them. „Shopdaten“ and „Alles“ replace them with nothing.
 *
 * A table in none of the three refuses every reset (TestReset::guard): a new table is not cleared, or kept, by
 * accident — whoever adds one says here which it is, and ResetTablesTest fails until they do.
 */
final class ResetTables
{
    public const KEPT = [
        // The team and what it may do.
        'admin_users',
        'admin_invitations',
        'roles',
        'permissions',
        'model_has_roles',
        'model_has_permissions',
        'role_has_permissions',
        'role_permissions',
        'saved_views',
        'users',
        'sessions',
        'password_reset_tokens',
        // How the shop is set up: Einstellungen, Zubehörpreise, the bucket's, Stripe's and SES's keys.
        'settings',
        'payment_settings',
        'storage_settings',
        'mail_settings',
        'balance_weight_colours',
        'tpms_sensor_prices',
        // The invoice numbers count on, whatever goes (no number is ever given twice).
        'invoice_sequences',
        // So do the order numbers (his admin item 18, D-354): the counter never resets.
        'order_number_counter',
        // The Protokoll: append-only, R-12.
        'audit_logs',
        // The engine's reference tables (R-03) and the schema's own record.
        'load_index_table',
        'speed_symbol_table',
        'migrations',
        // The machinery.
        'jobs',
        'job_batches',
        'failed_jobs',
        'cache',
        'cache_locks',
        'telescope_entries',
        'telescope_entries_tags',
        'telescope_monitoring',
    ];

    public const CONTENT = [
        'pages',
        'page_blocks',
        'page_revisions',
        'faq_entries',
        'nav_items',
        'media',
    ];

    public const SHOP = [
        // The catalogue.
        'brands',
        'wheel_models',
        'wheel_finishes',
        'wheel_finish_images',
        'wheel_configs',
        'tyre_variants',
        'catalogue_imports',
        // The Gutachten and their rows.
        'approval_documents',
        'document_conditions',
        'document_condition_reworks',
        'document_fasteners',
        'document_notices',
        'document_speed_deratings',
        'document_tyre_combinations',
        'fitments',
        'fitment_conditions',
        'fitment_conflicts',
        'fitment_tyre_sizes',
        'fitment_tyre_size_conditions',
        // The cars, and the vehicle datasets that brought them (D-297).
        'vehicles',
        'vehicle_imports',
        // Orders, customers and everything that hangs off them.
        'customers',
        'customer_accounts',
        'addresses',
        'orders',
        'order_lines',
        'order_line_fitments',
        'invoices',
        // Which Stripe invoices were copied to S3 (D-361): the copies themselves stay in the bucket.
        'invoice_exports',
        'payment_events',
        'refunds',
        'disputes',
        'stripe_events',
        'reviews',
        // What visitors and the review sent in, and the addresses SES reported back.
        'contact_messages',
        'mail_suppressions',
        'review_feedback',
        'fitment_subscriptions',
        'check_results',
        // The figures drawn from all of it, and the bell's messages about it.
        'verdict_tallies',
        'catalogue_gap_events',
        'search_misses',
        'demand_marks',
        'notifications',
    ];

    /**
     * The tables a level replaces; the demo level replaces none (DemoPurge takes its rows out instead).
     *
     * @return list<string>
     */
    public static function replacedBy(ResetLevel $level): array
    {
        return match ($level) {
            ResetLevel::Demo => [],
            ResetLevel::Shop => self::SHOP,
            ResetLevel::All => [...self::SHOP, ...self::CONTENT],
        };
    }

    /**
     * The tables of a database that are in none of the groups.
     *
     * @param  list<string>  $tables
     * @return list<string>
     */
    public static function unclassified(array $tables): array
    {
        return array_values(array_diff($tables, self::KEPT, self::CONTENT, self::SHOP));
    }
}
