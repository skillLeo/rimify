<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals\Entry;

use App\Models\ApprovalDocument;
use App\Models\DocumentCarEntry;
use App\Models\DocumentKeptCombination;
use App\Models\DocumentTyreLine;
use Illuminate\Support\Collection;

/**
 * One Gutachten as staff entered it, loaded once and read by the writer and the release's check: its cars with their
 * lines, and the rows of an older list no car carries.
 */
final readonly class EntryModel
{
    /**
     * @param  Collection<int, DocumentCarEntry>  $entries
     * @param  Collection<int, DocumentKeptCombination>  $kept
     */
    public function __construct(
        public ApprovalDocument $document,
        public Collection $entries,
        public Collection $kept,
    ) {}

    public static function of(ApprovalDocument $document): self
    {
        return new self(
            $document,
            DocumentCarEntry::query()
                ->with(['lines.codes', 'codes', 'wheelSize', 'vehicle', 'copiedFrom.vehicle', 'wheelConfig.wheelFinish'])
                ->where('approval_document_id', $document->id)
                ->orderBy('position')->orderBy('id')
                ->get(),
            DocumentKeptCombination::query()->where('approval_document_id', $document->id)->orderBy('id')->get(),
        );
    }

    /** Whether the entry exists at all: a document from before the flow, not opened yet, has none. */
    public function isEntered(): bool
    {
        return $this->entries->isNotEmpty() || $this->kept->isNotEmpty();
    }

    /**
     * Whether the paper has a list of combinations: any line pairing two sizes, any line an older list named, or an older
     * list's row no car carries. Once it has one the list is closed — the engine offers nothing else as a Komplettrad
     * (D-256, D-335) — so every line of every car stands in it, the same size on both axles too.
     */
    public function hasList(): bool
    {
        if ($this->kept->isNotEmpty()) {
            return true;
        }

        foreach ($this->entries as $entry) {
            foreach ($entry->lines as $line) {
                if ($line->in_list === true || ($line->in_list === null && self::paired($line))) {
                    return true;
                }
            }
        }

        return false;
    }

    /** Both sides read, and two different sizes. */
    public static function paired(DocumentTyreLine $line): bool
    {
        $front = $line->front();
        $rear = $line->rear();

        return ! $line->unread() && $front !== null && $rear !== null && ! $front->matches($rear);
    }

    /** Both sides read. */
    public static function twoSided(DocumentTyreLine $line): bool
    {
        return ! $line->unread() && $line->front() !== null && $line->rear() !== null;
    }
}
