<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The record's shape, after the two real Borbet documents (the corrections memo §4, the Borbet brief §2):
 *
 *   - two more kinds: a Nachtrag (a supplement to another document) and the EG-Typgenehmigung, which the
 *     `EC` kind already was — only its name changes;
 *   - page 1's header: Anlage, Prüfbericht-Nr., Ausfertigung, Benennungsnummer, Prüfort, Prüfdatum, Stand,
 *     and „gültig ab Fertigungsdatum“ — a month: a wheel made before it is not covered;
 *   - a Nachtrag names its base: `supplement_to_id` when we hold it, `supplement_to_number` when we do not.
 *     Without its base it can be saved and released, and the record, the Abdeckung and the customer say
 *     that it is not the whole approval;
 *   - `document_condition_reworks`: the millimetres of a „Nacharbeit mit Maßen“ code, per vehicle type and
 *     axle; `document_fasteners`: the bolts or nuts, their thread, seat, torque and shaft; `document_notices`:
 *     the duties a document always states (the torque check after 50 km, the TPMS note, the papers).
 */
return new class extends Migration
{
    private const KINDS = ['ABE', 'NACHTRAG', 'TEILEGUTACHTEN', 'EC', 'ECE'];

    public function up(): void
    {
        Schema::table('approval_documents', function (Blueprint $t): void {
            $t->string('annex', 64)->nullable()->after('report_number')->comment('Anlage');
            $t->string('test_report_number', 64)->nullable()->after('annex')->comment('Prüfbericht-Nr.');
            $t->string('copy_number', 32)->nullable()->after('test_report_number')->comment('Ausfertigung');
            $t->string('designation_number', 64)->nullable()->after('copy_number')->comment('Benennungsnummer');
            $t->string('test_site', 120)->nullable()->after('designation_number')->comment('Prüfort');
            $t->date('test_date')->nullable()->after('test_site')->comment('Prüfdatum');
            $t->date('revision_date')->nullable()->after('test_date')->comment('Stand');
            $t->date('valid_from_production')->nullable()->after('revision_date')->comment('gültig ab Fertigungsdatum: the first day of the month');
            // No referential action, like supersedes_id: a base stays readable while a Nachtrag names it.
            $t->foreignId('supplement_to_id')->nullable()->after('supersedes_id')->constrained('approval_documents');
            $t->string('supplement_to_number', 64)->nullable()->after('supplement_to_id')->comment('the base we do not hold, as the Nachtrag names it');
        });

        Constraints::dropIfExists('approval_documents', 'chk_approval_documents_kind');
        Constraints::enum('approval_documents', 'kind', self::KINDS);
        // A Nachtrag names its base; nothing else does.
        Constraints::add('approval_documents', 'chk_document_supplement', "(`kind` = 'NACHTRAG') = (`supplement_to_id` IS NOT NULL OR `supplement_to_number` IS NOT NULL)");
        Constraints::add('approval_documents', 'chk_document_production_month', '`valid_from_production` IS NULL OR DAYOFMONTH(`valid_from_production`) = 1');

        Schema::create('document_condition_reworks', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('document_condition_id')->constrained('document_conditions')->cascadeOnDelete();
            $t->string('vehicle_type', 64)->comment('as the document names it, e.g. 3C');
            $t->string('axle', 8);
            $t->decimal('from_mm', 5, 1)->nullable()->comment('the rework begins … mm from the arch centre');
            $t->decimal('to_mm', 5, 1)->nullable();
            $t->decimal('flare_mm', 4, 1)->nullable()->comment('the arch flared by … mm');
            $t->text('note_de')->nullable();
            $t->timestamps();

            $t->index('document_condition_id', 'idx_rework_condition');
        });

        Constraints::add('document_condition_reworks', 'chk_rework_axle', "`axle` IN ('FRONT', 'REAR', 'ALL')");
        Constraints::add('document_condition_reworks', 'chk_rework_measured', '`from_mm` IS NOT NULL OR `to_mm` IS NOT NULL OR `flare_mm` IS NOT NULL');

        Schema::create('document_fasteners', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('approval_document_id')->constrained('approval_documents')->cascadeOnDelete();
            $t->string('number', 16)->comment('as the document numbers it, e.g. S01');
            $t->string('thread', 32)->comment('M14x1,25');
            $t->string('seat', 48)->comment('Kegelbund 60°, Kugelbund R12');
            $t->unsignedSmallInteger('torque_nm')->nullable();
            $t->unsignedSmallInteger('shaft_length_mm')->nullable();
            $t->string('article_number', 64)->nullable();
            $t->string('vehicle_types', 255)->nullable()->comment('for which vehicle types, as the document says');
            $t->unsignedSmallInteger('source_page')->nullable();
            $t->timestamps();

            $t->unique(['approval_document_id', 'number'], 'uq_document_fastener_number');
        });

        Constraints::add('document_fasteners', 'chk_fastener_torque', '`torque_nm` IS NULL OR `torque_nm` BETWEEN 50 AND 300');

        Schema::create('document_notices', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('approval_document_id')->constrained('approval_documents')->cascadeOnDelete();
            $t->text('text_de')->comment('always shown with the verdict, as a full sentence (R-15)');
            $t->unsignedSmallInteger('source_page')->nullable();
            $t->unsignedSmallInteger('sort_order')->default(0);
            $t->timestamps();
        });

        Constraints::add('document_notices', 'chk_notice_text', "TRIM(`text_de`) <> ''");
    }

    public function down(): void
    {
        Schema::dropIfExists('document_notices');
        Schema::dropIfExists('document_fasteners');
        Schema::dropIfExists('document_condition_reworks');

        Constraints::dropIfExists('approval_documents', 'chk_document_production_month');
        Constraints::dropIfExists('approval_documents', 'chk_document_supplement');
        Constraints::dropIfExists('approval_documents', 'chk_approval_documents_kind');
        Constraints::enum('approval_documents', 'kind', ['ABE', 'TEILEGUTACHTEN', 'ECE', 'EC']);

        Schema::table('approval_documents', function (Blueprint $t): void {
            $t->dropConstrainedForeignId('supplement_to_id');
            $t->dropColumn(['annex', 'test_report_number', 'copy_number', 'designation_number', 'test_site', 'test_date', 'revision_date', 'valid_from_production', 'supplement_to_number']);
        });
    }
};
