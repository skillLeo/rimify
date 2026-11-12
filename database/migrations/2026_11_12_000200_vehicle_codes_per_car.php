<?php

declare(strict_types=1);

use App\Models\ApprovalDocument;
use App\Services\Admin\Approvals\Entry\CarCodesOnce;
use App\Services\Admin\Approvals\Entry\DocumentEntryWriter;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * „Allgemeine Codes dieses Fahrzeugs“ belong to the car, not to one of its wheel combinations (the client's review of 11.11, B; D-452):
 * once per car — its HSN/TSN, or the car itself while it has none — and paper, in `document_vehicle_codes`. Every combination of the
 * car carries them. What the cells held is gathered per car (CarCodesOnce): the same everywhere, once; typed differently, all of it,
 * and the car named; carried differently from the rows before the five steps, each combination its own (`document_car_entry_codes`,
 * now for those alone), and the car named. The rows the shop reads get the codes a combination lacked, nothing else.
 *
 * Back: every cell its car's whole set; the rows keep what they have.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_vehicle_codes', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('approval_document_id')->constrained('approval_documents', 'id', 'fk_vehicle_code_document')->cascadeOnDelete();
            // `0005/683`, or `#152` for a car without key numbers: the car the set belongs to in this paper.
            $t->string('car_key', 24);
            $t->string('hsn', 4)->nullable();
            $t->string('tsn', 3)->nullable();
            $t->foreignId('vehicle_id')->nullable()->constrained('vehicles', 'id', 'fk_vehicle_code_vehicle')->restrictOnDelete();
            $t->string('code', 32)->collation('utf8mb4_bin')->comment('as printed');
            $t->text('note_de')->nullable();
            $t->timestamps();
            $t->unique(['approval_document_id', 'car_key', 'code'], 'uq_vehicle_code');
        });

        $once = new CarCodesOnce(new DocumentEntryWriter);
        $gathered = $once->gather();

        foreach ($gathered['merged'] as $line) {
            echo "  D-452 {$line}: vereinigt\n";
        }

        foreach ($gathered['kept'] as $line) {
            echo "  D-452 {$line}: je Kombination behalten (Zeilen vor der Erfassung)\n";
        }

        foreach (CarCodesOnce::papers() as $id) {
            $result = $once->rows(ApprovalDocument::query()->findOrFail($id));

            foreach ($result['added'] as $line) {
                echo "  D-452 Gutachten {$id}: {$line} ergänzt\n";
            }

            foreach ($result['left'] as $line) {
                echo "  D-452 Gutachten {$id}: {$line} unverändert\n";
            }
        }
    }

    public function down(): void
    {
        (new CarCodesOnce(new DocumentEntryWriter))->spread();

        Schema::drop('document_vehicle_codes');
    }
};
