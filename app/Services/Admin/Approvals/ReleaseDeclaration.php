<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Models\ApprovalDocument;

/**
 * What an operator's written instruction says about a Gutachten released on the command line (ReleaseOnInstruction,
 * D-227): whether every Anlage and every vehicle is entered (`complete`, `partial` with what is missing, `unknown`). The
 * browser's release asks nothing since D-485 — the switch on the paper's page says it —, and the Abnahme is no longer asked
 * at all: the codes on a combination say it.
 */
final readonly class ReleaseDeclaration
{
    /** The three answers the release asked until D-485, as the Protokoll holds them for older releases (CountFigures). */
    public const ABNAHME_ALL = 'all';

    public const ABNAHME_SOME = 'some';

    public const ABNAHME_NONE = 'none';

    public const ABNAHME = [self::ABNAHME_ALL, self::ABNAHME_SOME, self::ABNAHME_NONE];

    public function __construct(
        public string $completeness,
        public ?string $missing = null,
    ) {}

    /** @return array{completeness: string, missing: string|null} */
    public function toArray(): array
    {
        return [
            'completeness' => $this->completeness,
            'missing' => $this->missing,
        ];
    }

    public function isComplete(): bool
    {
        return $this->completeness === ApprovalDocument::COMPLETE;
    }
}
