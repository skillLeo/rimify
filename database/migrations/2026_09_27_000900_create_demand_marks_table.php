<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What the team has done about one Nachfrage-Lücke (docs/admin/rest-build-plan.md, „Übersicht und
 * Shell“ step F): seen it and is watching it, or asked a wheel brand for the Gutachten.
 *
 * The key names the gap, not a row of the demand itself — `v:123` for a variant in the catalogue,
 * `k:0005-ABC` for key numbers the catalogue does not know — because the demand is counted afresh
 * from the events every time; only the team's answer to it is stored. A mark is a note, not
 * compliance data: taking it back deletes it, and the Protokoll keeps who did what.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demand_marks', function (Blueprint $table): void {
            $table->id();
            $table->string('gap_key', 32)->unique();
            $table->string('state', 16);
            $table->foreignId('brand_id')->nullable()->constrained('brands')->nullOnDelete();
            $table->foreignId('admin_user_id')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamp('marked_at');
            $table->timestamps();
        });

        Constraints::enum('demand_marks', 'state', ['watched', 'requested']);
    }

    public function down(): void
    {
        Schema::dropIfExists('demand_marks');
    }
};
