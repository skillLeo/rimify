<?php

declare(strict_types=1);

namespace Tests\Support\Gutachten;

use App\Models\ApprovalDocument;

/**
 * What a test's release posts. Since D-485 (the client's round of 18.11.2026, item 2) the release asks nothing: the payload is
 * empty. Until then a test answered „alle erfasst“ unless the paper's form named missing Anlagen (the Nachtrag to ABE 53841
 * holds Anlage 16 of 16); that answer is now the switch on the paper's page, so a test that releases the way it did before
 * gets it switched on here, as the person would before pressing „Freigeben“. A test about the switch itself sets it on its
 * own.
 */
final class ReleaseAnswers
{
    /**
     * @param  string|null  $completeness  `complete` (the default where no Anlagen are named missing), `partial`, `unknown`
     * @return array<string, string|int|null>
     */
    public static function for(ApprovalDocument $document, ?string $completeness = null): array
    {
        $named = trim((string) $document->missing_annexes);
        $completeness ??= $named === '' ? ApprovalDocument::COMPLETE : ApprovalDocument::PARTIAL;

        if ($completeness === ApprovalDocument::COMPLETE && $document->completeness !== ApprovalDocument::COMPLETE) {
            $document->forceFill(['completeness' => ApprovalDocument::COMPLETE, 'completeness_at' => now(), 'completeness_revision' => $document->revision])->save();
        }

        return [];
    }
}
