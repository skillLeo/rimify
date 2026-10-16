<?php

declare(strict_types=1);

namespace Tests\Support\Storefront;

use App\Enums\FitmentStatus;
use App\Models\ApprovalDocument;
use Illuminate\Support\Facades\DB;

/**
 * An example document behind a real wheel (decision 6, D-239): the fixture's sellable answer moved onto a copy of its
 * Gutachten that is born demo — every row, condition and table copied, the original rows for the car retired — so the
 * very same answer now rests on a demo document. `is_demo` is fixed at insert, so the copy is written born demo rather
 * than the original marked afterwards.
 */
final class ExampleDocument
{
    /** Tables that belong to a document and are read with its rows. */
    private const DOCUMENT_TABLES = ['document_conditions', 'document_fasteners', 'document_notices', 'document_speed_deratings'];

    /** @var array<string, list<string>> */
    private static array $generated = [];

    public static function takeOver(KomplettradFixture $fx): ApprovalDocument
    {
        $real = $fx->document;

        $id = (int) DB::table('approval_documents')->insertGetId([
            ...self::copy('approval_documents', DB::table('approval_documents')->where('id', $real->id)->first(), ['supersedes_id']),
            'is_demo' => true,
            'demo_ref' => 'abnahme:doc:beispiel-'.$real->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach (self::DOCUMENT_TABLES as $table) {
            foreach (DB::table($table)->where('approval_document_id', $real->id)->get() as $row) {
                DB::table($table)->insert([...self::copy($table, $row), 'approval_document_id' => $id]);
            }
        }

        foreach (DB::table('fitments')->where('approval_document_id', $real->id)->where('vehicle_id', $fx->vehicle->id)->get() as $row) {
            $old = (int) $row->id;
            $fitment = (int) DB::table('fitments')->insertGetId([...self::copy('fitments', $row), 'approval_document_id' => $id]);

            foreach (DB::table('fitment_conditions')->where('fitment_id', $old)->get() as $condition) {
                DB::table('fitment_conditions')->insert([...self::copy('fitment_conditions', $condition), 'fitment_id' => $fitment]);
            }

            foreach (DB::table('fitment_tyre_sizes')->where('fitment_id', $old)->get() as $size) {
                $newSize = (int) DB::table('fitment_tyre_sizes')->insertGetId([...self::copy('fitment_tyre_sizes', $size), 'fitment_id' => $fitment]);

                foreach (DB::table('fitment_tyre_size_conditions')->where('fitment_tyre_size_id', (int) $size->id)->get() as $code) {
                    DB::table('fitment_tyre_size_conditions')->insert([...self::copy('fitment_tyre_size_conditions', $code), 'fitment_tyre_size_id' => $newSize]);
                }
            }

            DB::table('fitments')->where('id', $old)->update(['status' => FitmentStatus::Retired->value]);
        }

        return ApprovalDocument::query()->findOrFail($id);
    }

    /**
     * A row as a new row takes it: without its id, without what is left out on purpose, and without the columns the
     * database computes itself (`fitment_tyre_sizes.entry_key`) — strict mode refuses a value written into one.
     *
     * @param  list<string>  $without
     * @return array<string, mixed>
     */
    private static function copy(string $table, ?object $row, array $without = []): array
    {
        $values = (array) $row;

        foreach (['id', ...$without, ...self::generated($table)] as $column) {
            unset($values[$column]);
        }

        return $values;
    }

    /** @return list<string> */
    private static function generated(string $table): array
    {
        return self::$generated[$table] ??= DB::table('information_schema.COLUMNS')
            ->where('TABLE_SCHEMA', DB::raw('DATABASE()'))
            ->where('TABLE_NAME', $table)
            ->where('EXTRA', 'like', '%GENERATED%')
            ->pluck('COLUMN_NAME')
            ->map(static fn (mixed $c): string => (string) $c)
            ->values()
            ->all();
    }
}
