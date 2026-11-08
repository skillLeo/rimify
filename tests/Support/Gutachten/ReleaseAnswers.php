<?php

declare(strict_types=1);

namespace Tests\Support\Gutachten;

use App\Enums\FitmentStatus;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Services\Admin\Approvals\DocumentRelease;
use App\Services\Admin\Approvals\ReleaseDeclaration;

/**
 * The release questions answered the way the entry stands (D-227, D-228) — for a test about the release itself. A test
 * about the questions writes its own answers; ReleaseQuestionsTest is that test. Since the client's round of 08.11.2026, §3, they
 * are the completeness and, where the paper has rows, the Abnahme with its page (D-440, D-441).
 */
final class ReleaseAnswers
{
    /**
     * Without an answer given, the entry's own: partial where its form already names missing Anlagen (the Nachtrag to ABE
     * 53841 holds Anlage 16 of 16), complete otherwise. The missing ones are said as the document prints them („1–15“).
     *
     * @return array<string, string|int|null>
     */
    public static function for(ApprovalDocument $document, ?string $completeness = null): array
    {
        $named = trim((string) $document->missing_annexes);
        $completeness ??= $named === '' ? ApprovalDocument::COMPLETE : ApprovalDocument::PARTIAL;

        $answers = [
            'completeness' => $completeness,
            'missing' => $completeness === ApprovalDocument::PARTIAL ? ($named === '' ? '1–15' : $named) : null,
        ];

        if (! Fitment::query()->where('approval_document_id', $document->id)->whereNot('status', FitmentStatus::Retired->value)->exists()) {
            return $answers;
        }

        $entered = app(DocumentRelease::class)->entered($document);
        $abnahme = match (true) {
            $entered['withAbnahme'] === 0 => ReleaseDeclaration::ABNAHME_NONE,
            $entered['withoutAbnahme'] === 0 => ReleaseDeclaration::ABNAHME_ALL,
            default => ReleaseDeclaration::ABNAHME_SOME,
        };

        return $answers + [
            'abnahme' => $abnahme,
            'abnahme_page' => $abnahme === ReleaseDeclaration::ABNAHME_NONE ? null : 1,
        ];
    }
}
