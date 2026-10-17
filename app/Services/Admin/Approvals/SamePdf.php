<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Domain\Approval\SupersedeChain;
use App\Models\ApprovalDocument;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/**
 * A Gutachten's PDF is known by its SHA-256, not by what was typed beside it (ADMIN-GEFUNDEN 503). On the client's
 * preview the Nachtrag 366-0350-21-WIRD/N1 was entered as „ABE, KBA 53841“ — the base approval it belongs to — and
 * nothing said that the very file was one the shop already held under another name (D-210).
 *
 * The documents that carry the same file, outside one revision line: a new Fassung shares its predecessor's PDF by
 * design („Neue Fassung anlegen“ copies it), so the line a document stands in — every revision before and after it —
 * is never a twin.
 */
final class SamePdf
{
    /**
     * Every other document whose file is `$sha256`, outside the revision line of `$document` and of the document it is
     * to supersede.
     *
     * @return Collection<int, ApprovalDocument>
     */
    public static function twins(?string $sha256, ?ApprovalDocument $document = null, ?int $supersedesId = null): Collection
    {
        if ($sha256 === null || $sha256 === '') {
            return new Collection;
        }

        $line = [];

        foreach (array_filter([$document?->id, $supersedesId]) as $id) {
            $line = [...$line, ...self::line((int) $id)];
        }

        return ApprovalDocument::query()
            ->where('pdf_sha256', $sha256)
            ->when($line !== [], static fn ($q) => $q->whereNotIn('id', $line))
            ->orderBy('id')
            ->get();
    }

    /**
     * The document and every revision before and after it.
     *
     * @return list<int>
     */
    private static function line(int $id): array
    {
        $chain = SupersedeChain::fromConfig();
        $ids = [$id];
        $current = $id;

        for ($step = 0; $step < 50; $step++) {
            $previous = DB::table('approval_documents')->where('id', $current)->value('supersedes_id');

            if ($previous === null || in_array((int) $previous, $ids, true)) {
                break;
            }

            $ids[] = $current = (int) $previous;
        }

        $self = ApprovalDocument::query()->find($id);

        return $self === null ? $ids : [...$ids, ...$chain->forwardChain($self)];
    }
}
