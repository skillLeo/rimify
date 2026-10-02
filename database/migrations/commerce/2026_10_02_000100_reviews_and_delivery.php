<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The client's #19 — reviews, as only a buyer can give them (D-103).
 *
 * - `orders.delivered_at`: when the order reached the customer, set by the team in Verkauf › Bestellungen. Only a
 *   delivered order's lines can be reviewed.
 * - `orders.review_invited_at`: when the invitation mail went out, so it goes out once.
 * - `reviews`: one per order line — the rating, an optional text, the date, and that it is a verified purchase. The
 *   team can hide one (with a reason) and answer it; nothing in the admin can create one, and the rating a product page
 *   shows is computed from these rows alone (§ 5 and § 5b Abs. 3 UWG: no invented ratings, and the page says how they
 *   are checked).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $t): void {
            $t->timestamp('delivered_at')->nullable()->after('shipped_at');
            $t->timestamp('review_invited_at')->nullable()->after('delivered_at');
        });

        Schema::create('reviews', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('order_id')->constrained('orders')->restrictOnDelete();
            $t->foreignId('order_line_id')->unique()->constrained('order_lines')->restrictOnDelete();
            $t->foreignId('wheel_model_id')->constrained('wheel_models')->restrictOnDelete();
            $t->unsignedTinyInteger('rating');
            $t->string('body', 1000)->nullable();
            $t->boolean('verified')->default(true)->comment('written through the order\'s own signed link');
            $t->timestamp('hidden_at')->nullable();
            $t->string('hidden_reason', 500)->nullable();
            $t->foreignId('hidden_by')->nullable()->constrained('admin_users')->restrictOnDelete();
            $t->string('reply', 1000)->nullable();
            $t->timestamp('replied_at')->nullable();
            $t->foreignId('replied_by')->nullable()->constrained('admin_users')->restrictOnDelete();
            $t->timestamps();

            $t->index(['wheel_model_id', 'hidden_at'], 'idx_reviews_model_visible');
        });

        Constraints::add('reviews', 'chk_review_rating', '`rating` BETWEEN 1 AND 5');
        // A hidden review always says why; a visible one carries no reason.
        Constraints::add('reviews', 'chk_review_hidden_reason', '(`hidden_at` IS NULL) = (`hidden_reason` IS NULL)');
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');

        Schema::table('orders', function (Blueprint $t): void {
            $t->dropColumn(['delivered_at', 'review_invited_at']);
        });
    }
};
