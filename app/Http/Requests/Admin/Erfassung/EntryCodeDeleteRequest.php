<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Erfassung;

/**
 * Step 4: a code deleted from the whole paper (the client's request of 12.11.2026, G; D-461) — with the count the person was shown
 * before confirming. A count that moved since is asked again (DocumentConditions::deleteEverywhere), never deleted over.
 */
class EntryCodeDeleteRequest extends EntryCodeUsageRequest
{
    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'seen' => ['required', 'array:combinations,cars,rows,reworks'],
            'seen.combinations' => ['required', 'integer', 'min:0'],
            'seen.cars' => ['required', 'integer', 'min:0'],
            'seen.rows' => ['required', 'integer', 'min:0'],
            'seen.reworks' => ['required', 'integer', 'min:0'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [...parent::messages(), 'seen.*' => 'Bitte frag zuerst, wo der Code verwendet wird, und bestätige dann.'];
    }

    /** @return array{combinations: int, cars: int, rows: int, reworks: int} */
    public function seen(): array
    {
        /** @var array<string, int|string> $seen */
        $seen = (array) $this->validated('seen');

        return [
            'combinations' => (int) $seen['combinations'],
            'cars' => (int) $seen['cars'],
            'rows' => (int) $seen['rows'],
            'reworks' => (int) $seen['reworks'],
        ];
    }
}
