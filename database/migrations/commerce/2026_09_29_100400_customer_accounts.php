<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Block G §2: an account a customer may open after an order, with one click. Keyed by the e-mail address the orders
 * were placed under — an order keeps its own customer row as it always did, and an account finds every order of its
 * address. No password until the customer sets one through the mailed link; deleting the account leaves the orders
 * (a merchant keeps them for the tax office).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_accounts', function (Blueprint $t): void {
            $t->id();
            $t->string('email', 190)->unique();
            $t->string('password')->nullable()->comment('null until the customer sets one through the mailed link');
            $t->timestamp('email_verified_at')->nullable()->comment('set when a password is set through a link sent to this address');
            $t->rememberToken();
            $t->timestamp('last_login_at')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_accounts');
    }
};
