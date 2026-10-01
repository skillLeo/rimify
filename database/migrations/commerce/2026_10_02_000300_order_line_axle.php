<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The client's #20 — Mischbereifung (D-105). A mixed set is two order lines in one package group, one per axle, each
 * with its own frozen verdict; `axle` says which line is which, so the order, the invoice and the workshop read the
 * front tyre as the front tyre. Null on every other line.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_lines', function (Blueprint $t): void {
            $t->string('axle', 5)->nullable()->after('package_group')->comment('FRONT or REAR on a Mischbereifung line');
        });

        Constraints::add('order_lines', 'chk_order_line_axle', "`axle` IS NULL OR `axle` IN ('FRONT', 'REAR')");
    }

    public function down(): void
    {
        Constraints::dropIfExists('order_lines', 'chk_order_line_axle');

        Schema::table('order_lines', function (Blueprint $t): void {
            $t->dropColumn('axle');
        });
    }
};
