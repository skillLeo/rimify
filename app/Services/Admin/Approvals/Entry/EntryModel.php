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
                ->with(['lines.codes', 'codes', 'combination.front', 'combination.rear', 'vehicle', 'copiedFrom.vehicle', 'wheelConfig.wheelFinish'])
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
     * Whether the paper has a list of combinations: any line pairing two sizes, any line on two different versions, any line an
     * older list named, or an older list's row no car carries. Once it has one the list is closed — the engine offers nothing
     * else as a Komplettrad (D-256, D-335) — so every line of every car stands in it, the same size on both axles too.
     */
    public function hasList(): bool
    {
        if ($this->kept->isNotEmpty()) {
            return true;
        }

        foreach ($this->entries as $entry) {
            foreach ($entry->lines as $line) {
                if ($line->in_list === true || ($line->in_list === null && self::stands($entry, $line) && (self::paired($line) || self::crossed($entry)))) {
                    return true;
                }
            }
        }

        return false;
    }

    /** Whether this car's combination has two different versions: its lines then go on one axle of each. */
    public static function crossed(DocumentCarEntry $entry): bool
    {
        return $entry->combination?->same() === false;
    }

    /**
     * What keeps a line out of the tables the shop reads, and the release waiting: a side that does not read, a side missing,
     * or a tyre whose rim is not its axle's wheel. A line from before this flow stands as it stood.
     */
    public static function stands(DocumentCarEntry $entry, DocumentTyreLine $line): bool
    {
        return ! $line->unread() && ! self::twoSidedOpen($line) && self::misfit($entry, $line, 'front') === null && self::misfit($entry, $line, 'rear') === null;
    }

    /**
     * Read from a row, or carrying a row of an older list: it writes back as it stood, or the next Fassung of that paper would change
     * answers nobody meant to change. The editor takes both marks away the moment its sizes change.
     */
    public static function fromBefore(DocumentTyreLine $line): bool
    {
        return $line->from_rows || $line->in_list !== null;
    }

    /** A line typed in this flow with one side still empty. */
    public static function twoSidedOpen(DocumentTyreLine $line): bool
    {
        return ! self::fromBefore($line) && ($line->front() === null || $line->rear() === null);
    }

    /** Why this side's tyre cannot go on this side's wheel; null where it can, or where nobody asked (a row's own line). */
    public static function misfit(DocumentCarEntry $entry, DocumentTyreLine $line, string $side): ?string
    {
        $combination = $entry->combination;
        $tyre = $side === 'front' ? $line->front() : $line->rear();
        $wheel = $side === 'front' ? $combination?->front : $combination?->rear;

        if (self::fromBefore($line) || $tyre === null || $wheel === null) {
            return null;
        }

        return EntryLineRules::misfit($tyre->diameterIn, $wheel->diameter_in, $side);
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
