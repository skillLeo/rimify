<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * "A document cannot supersede itself", enforced in the database.
 *
 * MySQL refuses a CHECK constraint that refers to an AUTO_INCREMENT column (error 3818), so this
 * is a trigger instead. BEFORE INSERT cannot help — `NEW.id` is not assigned until after the row
 * is written — so the INSERT case is covered by the service and the model, and the trigger closes
 * the UPDATE path that neither of those can see, such as a future migration issuing raw SQL.
 *
 * The trigger cannot catch A → B → A either; that is a cycle, not a self-reference, and
 * `SupersedeChain` walks the chain to reject it before the write.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_ad_no_self_supersede_update
            BEFORE UPDATE ON approval_documents
            FOR EACH ROW
            BEGIN
                IF NEW.supersedes_id IS NOT NULL AND NEW.supersedes_id = NEW.id THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Ein Dokument kann sich nicht selbst ablösen';
                END IF;
            END
        SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS trg_ad_no_self_supersede_update');
    }
};
