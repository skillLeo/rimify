<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The rights the matrix offered and nothing ever checked (the admin audit's F-21): no export of the catalogue, the
 * vehicles, the documents or the customers, no deleting of vehicles or documents (R-04, R-05), nothing to change about
 * a customer, and no page for „Medien“. PermissionModule::actions() no longer lists them; their stored cells go too,
 * so no role is shown or reported as holding one. A right that does something is not touched.
 */
return new class extends Migration
{
    /** @var array<string, list<string>> */
    private const UNREAL = [
        'catalogue' => ['export'],
        'vehicles' => ['delete', 'export'],
        'approvals' => ['delete', 'export'],
        'customers' => ['edit', 'delete', 'export'],
        'media' => ['view', 'create', 'edit', 'delete'],
    ];

    public function up(): void
    {
        foreach (self::UNREAL as $module => $actions) {
            DB::table('role_permissions')->where('module', $module)->whereIn('action', $actions)->delete();
        }
    }

    public function down(): void
    {
        // Nothing to bring back: the cells granted nothing.
    }
};
