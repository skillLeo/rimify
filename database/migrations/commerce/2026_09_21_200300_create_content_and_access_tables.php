<?php

declare(strict_types=1);

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Content, navigation, the permission matrix and the two reporting tables.
 *
 * `page_blocks` is blocks with a validated JSON payload per type, not a WYSIWYG blob: it is what
 * lets marketing change the homepage without a deployment while keeping every block renderable.
 *
 * `nav_items.behaviour` is why the conditional *Felgen suchen* rule — search page with no vehicle,
 * listing with one — is configuration rather than a hard-coded branch in a component.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table): void {
            $table->id();
            $table->string('slug')->unique();
            $table->char('locale', 2)->default('de');
            $table->string('kind', 16)->comment('marketing | faq | legal | guide');
            $table->string('title');
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('status', 16)->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'kind'], 'idx_page_status');
        });

        Schema::create('page_blocks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('page_id')->constrained('pages')->cascadeOnDelete();
            $table->string('type', 32);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->json('data')->comment('validated per type on write');
            $table->timestamps();

            $table->index(['page_id', 'sort_order'], 'idx_block_order');
        });

        Schema::create('nav_items', function (Blueprint $table): void {
            $table->id();
            $table->string('menu', 32)->comment('header | footer_pages | footer_legal | mobile_bottom');
            $table->string('label');
            $table->string('href')->nullable();
            $table->string('route_name')->nullable();
            // 'vehicle_aware' implements the Felgen-suchen rule without a branch in a component.
            $table->string('behaviour', 32)->nullable();
            $table->string('icon', 32)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('visible')->default(true);
            $table->timestamps();

            $table->index(['menu', 'sort_order', 'visible'], 'idx_nav_menu');
        });

        Schema::create('faq_entries', function (Blueprint $table): void {
            $table->id();
            $table->string('group_key', 64)->comment('KOMPATIBILITÄT & FREIGABE | BESTELLUNG & VERSAND');
            $table->text('question_de');
            $table->text('answer_de');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('published')->default(true);
            $table->timestamps();

            $table->index(['published', 'group_key', 'sort_order'], 'idx_faq_group');
        });

        Schema::table('faq_entries', function (Blueprint $table): void {
            $table->fullText(['question_de', 'answer_de'], 'ft_faq');
        });

        Schema::create('role_permissions', function (Blueprint $table): void {
            $table->id();
            // `roles` comes from spatie/laravel-permission, which migrates at the top level.
            $table->unsignedBigInteger('role_id');
            $table->string('module', 32);
            $table->string('action', 16);
            $table->boolean('allowed')->default(false);
            // Narrowing within a module: e.g. a Content Editor who may publish FAQ but not legal.
            $table->json('constraints')->nullable();
            $table->timestamps();

            $table->unique(['role_id', 'module', 'action'], 'uq_role_permission');
            $table->index(['module', 'action'], 'idx_role_permission_cell');
            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
        });

        /*
         * Every vehicle that returned no permitted wheel, deduplicated and ranked by frequency.
         * UNKNOWN verdicts land here, which is how refusing to guess and learning which Gutachten
         * to obtain next turn out to be the same mechanism.
         */
        Schema::create('catalogue_gap_events', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('vehicle_id')->nullable();
            $table->unsignedBigInteger('wheel_config_id')->nullable();
            $table->string('hsn', 4)->nullable();
            $table->string('tsn', 3)->nullable();
            $table->string('vehicle_label')->nullable();
            $table->string('reason_code', 48);
            $table->string('surface', 32)->comment('plp | pdp | check | selector');
            $table->timestamp('occurred_at');

            $table->index(['hsn', 'tsn'], 'idx_gap_keys');
            $table->index(['reason_code', 'occurred_at'], 'idx_gap_reason');
            $table->index('vehicle_id', 'idx_gap_vehicle');
        });

        Constraints::enum('pages', 'kind', ['marketing', 'faq', 'legal', 'guide']);
        Constraints::enum('pages', 'status', ['draft', 'published', 'archived']);
        Constraints::enum('role_permissions', 'module', PermissionModule::values());
        Constraints::enum('role_permissions', 'action', PermissionAction::values());
        Constraints::enum('nav_items', 'menu', ['header', 'footer_pages', 'footer_legal', 'mobile_bottom']);
        Constraints::enum('catalogue_gap_events', 'surface', ['plp', 'pdp', 'check', 'selector']);
    }

    public function down(): void
    {
        Schema::dropIfExists('catalogue_gap_events');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('faq_entries');
        Schema::dropIfExists('nav_items');
        Schema::dropIfExists('page_blocks');
        Schema::dropIfExists('pages');
    }
};
