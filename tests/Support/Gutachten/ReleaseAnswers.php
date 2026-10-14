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
 * about the questions writes its own answers; DocumentReleaseDeclarationTest is that test.
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

        return $answers + [
            'codes' => $entered['codes'],
            'sizes' => $entered['sizes'],
            'axle_limit_kg' => null,
            'abnahme' => match (true) {
                $entered['withAbnahme'] === 0 => ReleaseDeclaration::ABNAHME_NONE,
                $entered['withoutAbnahme'] === 0 => ReleaseDeclaration::ABNAHME_ALL,
                default => ReleaseDeclaration::ABNAHME_SOME,
            },
        ];
    }
}
