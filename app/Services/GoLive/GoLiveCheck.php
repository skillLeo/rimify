<?php

declare(strict_types=1);

namespace App\Services\GoLive;

/**
 * One thing the live shop needs, as rimify:go-live-check and System › Was fehlt state it (the operator's brief of
 * 05.10.2026, §7): what it is, who closes it, whether it is closed, one German sentence on the state found, and the
 * exact place it is closed — an admin path or the name of an environment variable.
 */
final readonly class GoLiveCheck
{
    public const OK = 'ok';

    public const MISSING = 'fehlt';

    public const UNCHECKABLE = 'nicht prüfbar';

    public const US = 'wir';

    public const CLIENT = 'kunde';

    public const HOST = 'host';

    /**
     * @param  self::OK|self::MISSING|self::UNCHECKABLE  $state
     * @param  self::US|self::CLIENT|self::HOST  $owner
     */
    public function __construct(
        public string $id,
        public string $group,
        public string $title,
        public string $owner,
        public string $state,
        public string $sentence,
        public string $place,
    ) {}

    public function ok(): bool
    {
        return $this->state === self::OK;
    }

    public function missing(): bool
    {
        return $this->state === self::MISSING;
    }

    /** @return array{id: string, group: string, title: string, owner: string, state: string, sentence: string, place: string} */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'group' => $this->group,
            'title' => $this->title,
            'owner' => $this->owner,
            'state' => $this->state,
            'sentence' => $this->sentence,
            'place' => $this->place,
        ];
    }
}
