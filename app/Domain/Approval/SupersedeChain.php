<?php

declare(strict_types=1);

namespace App\Domain\Approval;

use App\Models\ApprovalDocument;
use Illuminate\Support\Facades\DB;
use LogicException;

/**
 * Guards the supersession chain.
 *
 * A revision chain must be walkable to a single current document. `A supersedes A` is caught by
 * the model and by a database trigger, but `A → B → A` is not a self-reference — it is a cycle,
 * and it would make the chain unresolvable: every walk runs forever and no revision is current.
 *
 * The walk is bounded. A chain deeper than the configured maximum is itself a data problem worth
 * surfacing rather than following, so it is reported as such instead of being silently truncated.
 */
final readonly class SupersedeChain
{
    public function __construct(private int $maxDepth) {}

    public static function fromConfig(): self
    {
        return new self((int) config('rimify.gutachten.max_supersede_depth', 20));
    }

    /**
     * Would linking `$documentId` → `$supersedesId` close a loop or exceed the depth limit?
     *
     * Reads the raw column rather than the relation so that a half-hydrated model cannot hide an
     * existing link.
     */
    public function wouldCreateCycle(int $documentId, ?int $supersedesId): bool
    {
        if ($supersedesId === null) {
            return false;
        }

        if ($supersedesId === $documentId) {
            return true;
        }

        $current = $supersedesId;

        for ($step = 0; $step < $this->maxDepth; $step++) {
            $next = DB::table('approval_documents')->where('id', $current)->value('supersedes_id');

            if ($next === null) {
                return false;
            }

            if ((int) $next === $documentId) {
                return true;
            }

            $current = (int) $next;
        }

        // Too deep to verify. Refusing is the answer that fails safe: an unverifiable chain must
        // not be extended.
        return true;
    }

    /**
     * @throws LogicException when the link would close a loop
     */
    public function assertLinkIsSafe(int $documentId, ?int $supersedesId): void
    {
        if ($this->wouldCreateCycle($documentId, $supersedesId)) {
            throw new LogicException(sprintf(
                'Approval document [%d] cannot supersede [%s]: the link would close a loop in the '
                .'revision chain, leaving no current revision.',
                $documentId,
                $supersedesId === null ? 'null' : (string) $supersedesId,
            ));
        }
    }

    /**
     * Walk from a document to the newest revision that replaced it.
     *
     * @return list<int> the ids traversed, oldest first, excluding the starting document
     */
    public function forwardChain(ApprovalDocument $document): array
    {
        $chain = [];
        $current = $document->id;

        for ($step = 0; $step < $this->maxDepth; $step++) {
            $next = DB::table('approval_documents')->where('supersedes_id', $current)->value('id');

            if ($next === null) {
                break;
            }

            $chain[] = (int) $next;
            $current = (int) $next;
        }

        return $chain;
    }
}
