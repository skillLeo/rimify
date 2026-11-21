<?php

declare(strict_types=1);

use App\Services\Reset\SchemaFingerprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\Support\ResetFixture;

/*
 * D-494: several PDFs per Gutachten. The migration makes the table and gives every paper with a PDF its first entry — the
 * paper's own, „Gutachten“, dated as the paper —; down drops the table, and every paper keeps its own PDF as before. The round
 * trip runs in a database of its own (ResetFixture): the schema after is the schema before, and nothing of a paper is lost.
 */

function documentFilesMigration(): Migration
{
    return require database_path('migrations/2026_11_21_000200_approval_document_files.php');
}

beforeEach(function (): void {
    $this->scratch = ResetFixture::scratch();
});

afterEach(function (): void {
    DB::setDefaultConnection('mysql');
    $this->scratch->drop();
});

it('gives every paper with a PDF its own first entry, and a paper without one none', function (): void {
    $migration = documentFilesMigration();
    $migration->down();

    $admin = DB::table('admin_users')->value('id');
    $base = ['kind' => 'ABE', 'revision' => 1, 'created_by' => $admin, 'created_at' => now(), 'updated_at' => now()];
    $with = DB::table('approval_documents')->insertGetId([...$base, 'status' => 'published', 'kba_number' => '90001', 'pdf_key' => 'gutachten/a.pdf', 'pdf_sha256' => str_repeat('a', 64), 'issued_on' => '2025-07-16']);
    $without = DB::table('approval_documents')->insertGetId([...$base, 'status' => 'draft', 'kba_number' => '90002']);

    $migration->up();

    $rows = DB::table('approval_document_files')->whereIn('approval_document_id', [$with, $without])->get();

    expect($rows)->toHaveCount(1)
        ->and($rows[0]->approval_document_id)->toBe($with)
        ->and($rows[0]->label)->toBe('Gutachten')
        ->and((bool) $rows[0]->is_main)->toBeTrue()
        ->and($rows[0]->file_key)->toBeNull()
        ->and(substr((string) $rows[0]->dated_on, 0, 10))->toBe('2025-07-16');
});

it('goes down and up again without losing a paper’s PDF: the schema as before', function (): void {
    $before = SchemaFingerprint::of(DB::connection());
    $migration = documentFilesMigration();
    $keys = DB::table('approval_documents')->orderBy('id')->pluck('pdf_key')->all();

    $migration->down();

    expect(Schema::hasTable('approval_document_files'))->toBeFalse()
        ->and(DB::table('approval_documents')->orderBy('id')->pluck('pdf_key')->all())->toBe($keys);

    $migration->up();

    expect(SchemaFingerprint::of(DB::connection()))->toBe($before)
        ->and(DB::table('approval_document_files')->where('is_main', true)->count())->toBe(DB::table('approval_documents')->whereNotNull('pdf_key')->count());
});
