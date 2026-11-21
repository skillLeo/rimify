<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\ApprovalDocumentFile;
use App\Services\Admin\AuditTrail;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The PDFs of a Gutachten (D-494): the paper's own first, then the further ones by position. The paper's own entry is read
 * from the paper itself — its file and hash on `approval_documents` — and its row, where there is one, gives only its label,
 * date and place; a paper with a PDF and no row yet shows it as „Gutachten“, dated as the paper. Further files have their own.
 *
 * Changing the list changes no verdict and no released data: every change on a released paper is allowed without a new
 * revision, and each writes one Protokoll entry. Nothing is ever deleted — a hidden file stays, for an order may name it.
 *
 * @phpstan-type Shown array{id: int|null, label: string, datedOn: string|null, key: string, sha256: string|null, main: bool, hidden: bool, position: int}
 */
final class DocumentPdfs
{
    public const MAIN_HIDDEN = 'Das PDF des Gutachtens selbst bleibt sichtbar: Seine Seiten stehen in den Zeilen, und die Antworten im Shop beruhen darauf.';

    /**
     * Every PDF of the paper, the paper's own first; hidden ones only with `$withHidden` (the admin's list).
     *
     * @return list<Shown>
     */
    public static function of(ApprovalDocument $document, bool $withHidden = false): array
    {
        $rows = $document->relationLoaded('files') ? $document->files : $document->files()->get();
        $main = $rows->firstWhere('is_main', true);
        $list = [];

        if ($document->pdf_key !== null) {
            $list[] = [
                'id' => $main?->id,
                'label' => $main?->label ?? 'Gutachten',
                'datedOn' => ($main?->dated_on ?? $document->issued_on)?->format('Y-m-d'),
                'key' => (string) $document->pdf_key,
                'sha256' => $document->pdf_sha256,
                'main' => true,
                'hidden' => false,
                'position' => $main->position ?? 0,
            ];
        }

        foreach ($rows as $row) {
            if ($row->is_main || $row->file_key === null || (! $withHidden && ! $row->isVisible())) {
                continue;
            }

            $list[] = [
                'id' => (int) $row->id,
                'label' => (string) $row->label,
                'datedOn' => $row->dated_on?->format('Y-m-d'),
                'key' => (string) $row->file_key,
                'sha256' => $row->sha256,
                'main' => false,
                'hidden' => ! $row->isVisible(),
                'position' => (int) $row->position,
            ];
        }

        usort($list, static fn (array $a, array $b): int => [$a['position'], $a['main'] ? 0 : 1, $a['id'] ?? 0] <=> [$b['position'], $b['main'] ? 0 : 1, $b['id'] ?? 0]);

        return $list;
    }

    /** A further PDF, confirmed by the upload (PdfUpload) and hashed: placed last, shown. */
    public function add(ApprovalDocument $document, AdminUser $admin, string $label, ?string $datedOn, string $key, string $sha256, ?int $bytes): ApprovalDocumentFile
    {
        return DB::transaction(function () use ($document, $admin, $label, $datedOn, $key, $sha256, $bytes): ApprovalDocumentFile {
            ApprovalDocument::query()->whereKey($document->id)->lockForUpdate()->first();
            $position = (int) ApprovalDocumentFile::query()->where('approval_document_id', $document->id)->max('position') + 1;

            $file = ApprovalDocumentFile::query()->create([
                'approval_document_id' => $document->id,
                'label' => $label,
                'dated_on' => $datedOn,
                'position' => max(2, $position),
                'is_main' => false,
                'file_key' => $key,
                'sha256' => $sha256,
                'bytes' => $bytes,
                'created_by' => $admin->id,
            ]);

            AuditTrail::record($admin, 'approval.file_added', ['document' => FitmentRows::label($document), 'label' => $label, 'sha256' => $sha256], $document);

            return $file;
        });
    }

    /** The label and date of an entry — the paper's own included, its row made where it has none. */
    public function describe(ApprovalDocument $document, AdminUser $admin, ?int $fileId, string $label, ?string $datedOn): void
    {
        DB::transaction(function () use ($document, $admin, $fileId, $label, $datedOn): void {
            $file = $fileId === null ? $this->mainRow($document) : $this->rowOf($document, $fileId);
            $before = $file->label;
            $file->forceFill(['label' => $label, 'dated_on' => $datedOn])->save();

            AuditTrail::record($admin, 'approval.file_described', ['document' => FitmentRows::label($document), 'before' => $before, 'label' => $label], $document);
        });
    }

    /** Hidden from customers, or shown again — never the paper's own, never deleted. */
    public function show(ApprovalDocument $document, AdminUser $admin, int $fileId, bool $visible): void
    {
        DB::transaction(function () use ($document, $admin, $fileId, $visible): void {
            $file = $this->rowOf($document, $fileId);

            if ($file->is_main) {
                throw ValidationException::withMessages(['file' => self::MAIN_HIDDEN]);
            }

            if ($file->isVisible() === $visible) {
                return;
            }

            $file->forceFill(['hidden_at' => $visible ? null : now(), 'hidden_by' => $visible ? null : $admin->id])->save();
            AuditTrail::record($admin, $visible ? 'approval.file_shown' : 'approval.file_hidden', ['document' => FitmentRows::label($document), 'label' => $file->label], $document);
        });
    }

    /**
     * The order the customer reads them in: every entry of the paper, the paper's own included, by id as given.
     *
     * @param  list<int|null>  $order  ids; null stands for the paper's own entry where it has no row yet
     */
    public function reorder(ApprovalDocument $document, AdminUser $admin, array $order): void
    {
        DB::transaction(function () use ($document, $admin, $order): void {
            $known = array_map(static fn (array $f): ?int => $f['id'], self::of($document, withHidden: true));
            $given = array_values($order);
            sort($known);
            $sorted = $given;
            sort($sorted);

            if ($sorted !== $known) {
                throw ValidationException::withMessages(['order' => 'Die Reihenfolge passt nicht mehr zu den PDFs. Lad die Seite neu und sortier noch einmal.']);
            }

            foreach ($given as $i => $id) {
                $row = $id === null ? $this->mainRow($document) : $this->rowOf($document, $id);
                $row->forceFill(['position' => $i + 1])->save();
            }

            AuditTrail::record($admin, 'approval.files_reordered', ['document' => FitmentRows::label($document), 'count' => count($given)], $document);
        });
    }

    private function rowOf(ApprovalDocument $document, int $fileId): ApprovalDocumentFile
    {
        $file = ApprovalDocumentFile::query()->where('approval_document_id', $document->id)->whereKey($fileId)->lockForUpdate()->first();

        if ($file === null) {
            throw ValidationException::withMessages(['file' => 'Diese Datei finden wir hier nicht mehr. Lad die Seite neu.']);
        }

        return $file;
    }

    /** The paper's own entry, made with its defaults the first time it is described or moved. */
    private function mainRow(ApprovalDocument $document): ApprovalDocumentFile
    {
        if ($document->pdf_key === null) {
            throw ValidationException::withMessages(['file' => 'Zu diesem Eintrag ist bei uns noch kein PDF hinterlegt.']);
        }

        return ApprovalDocumentFile::query()->where('approval_document_id', $document->id)->where('is_main', true)->lockForUpdate()->first()
            ?? ApprovalDocumentFile::query()->create([
                'approval_document_id' => $document->id,
                'label' => 'Gutachten',
                'dated_on' => $document->issued_on,
                'position' => 1,
                'is_main' => true,
            ]);
    }
}
