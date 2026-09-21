<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What spatie/laravel-permission's `roles` table lacks for a panel people actually operate.
 *
 * `name` is an identifier and stays one — `compliance-editor` is what policies and the audit trail
 * refer to. `label_de` is what a human reads, and it is editable, because the Super Admin can
 * rename any role without breaking a single permission check.
 *
 * `cloned_from_id` exists because the realistic way to create a role is to copy the closest one and
 * take something away, and losing the record of what it was copied from makes the audit trail
 * harder to read a year later. `is_system` marks the seven starting templates so the panel can warn
 * before one is deleted — it does not prevent deletion, which the client explicitly asked to keep.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table): void {
            $table->string('label_de')->nullable()->after('guard_name');
            $table->text('description_de')->nullable()->after('label_de');
            $table->unsignedBigInteger('cloned_from_id')->nullable()->after('description_de');
            $table->boolean('is_system')->default(false)->after('cloned_from_id');

            $table->foreign('cloned_from_id')->references('id')->on('roles')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table): void {
            $table->dropForeign(['cloned_from_id']);
            $table->dropColumn(['label_de', 'description_de', 'cloned_from_id', 'is_system']);
        });
    }
};
