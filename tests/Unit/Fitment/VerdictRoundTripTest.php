<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Verdict\CentreBoreSource;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\MinSource;
use App\Domain\Fitment\Verdict\Severity;
use Tests\Support\Fitment\FitmentFixtures;

/*
 * `order_line_fitments.verdict` is FitmentVerdict::toArray(), and a snapshot must be able to
 * reproduce the decision it evidences eleven months on. Three fields the live verdict carries used
 * to be lost on the round trip — and losing them fails OPEN: a restored verdict showed no document
 * restricting the tyre choice and no document stating its own minimum. The shape grows additively
 * (spec §3.4): no key is removed or renamed, old rows keep deserialising, R-12 is untouched.
 */

/** A verdict that exercises every field the round trip used to lose. */
function verdictWithEverything(): FitmentVerdict
{
    return FitmentFixtures::resolver([
        FitmentFixtures::row(
            sizes: [
                new TyreSize(245, 40, 18.0, documentMinLoadIndex: 95, documentMinSpeedSymbol: '(Y)', axle: 'FRONT'),
                new TyreSize(275, 35, 18.0, axle: 'REAR'),
            ],
            conditions: [
                new Condition(
                    code: 'TYRE_BRAND_LIMIT',
                    severity: Severity::Info,
                    textDe: 'Nur Reifen der im Gutachten genannten Hersteller zulässig.',
                    affectsTyreChoice: true,
                ),
                FitmentFixtures::archRolling(),
            ],
            // The bore this document states for THIS car — 66,5 on a rim cast 66,60.
            centreBoreMm: 66.5,
        ),
    ])->resolve(1, FitmentFixtures::WHEEL_CONFIG_ID);
}

it('preserves the tyre-choice flag, the document minima, the axle and both sources through the round trip', function (): void {
    $verdict = verdictWithEverything();
    $restored = FitmentVerdict::fromArray($verdict->toArray());

    $byCode = [];

    foreach ($restored->conditions as $condition) {
        $byCode[$condition->code] = $condition;
    }

    expect($byCode['TYRE_BRAND_LIMIT']->affectsTyreChoice)->toBeTrue()
        ->and($byCode['TYRE_BRAND_LIMIT']->affectsPurchase)->toBeFalse()
        ->and($byCode['ARCH_ROLLING']->affectsPurchase)->toBeTrue()
        ->and($byCode['ARCH_ROLLING']->requiresAcknowledgement)->toBeTrue()
        ->and($restored->front->sizes[0]->documentMinLoadIndex)->toBe(95)
        ->and($restored->front->sizes[0]->documentMinSpeedSymbol)->toBe('(Y)')
        ->and($restored->front->sizes[0]->axle)->toBe('FRONT')
        ->and($restored->rear->sizes[0]->axle)->toBe('REAR')
        ->and($restored->front->minLoadSource)->toBe(MinSource::Document)
        ->and($restored->front->minSpeedSource)->toBe(MinSource::Document)
        ->and($restored->rear->minLoadSource)->toBe(MinSource::Derived)
        ->and($restored->rear->minSpeedSource)->toBe(MinSource::Derived)
        // The per-vehicle bore survives too: an order has to be able to show which number the
        // customer was given, for the car they gave it for.
        ->and($restored->documentCentreBoreMm)->toBe(66.5)
        ->and($restored->centreBoreSource)->toBe(CentreBoreSource::Document)
        // Lossless both ways: what was written is what is read, and what is read writes the same.
        ->and($restored->toArray())->toBe($verdict->toArray());
});

it('marks a verdict rebuilt from a snapshot as restored, and a live one as not', function (): void {
    $verdict = verdictWithEverything();

    expect($verdict->restored)->toBeFalse()
        ->and(FitmentVerdict::fromArray($verdict->toArray())->restored)->toBeTrue()
        // How the object was built is not what the document said: it never enters the record.
        ->and($verdict->toArray())->not->toHaveKey('restored')
        ->and(FitmentVerdict::fromArray($verdict->toArray())->toArray())->not->toHaveKey('restored');
});

it('reads a snapshot written before the fields were carried with the documented defaults', function (): void {
    $payload = verdictWithEverything()->toArray();

    // The shape a pre-§3.4 writer produced: four keys per condition, three per size, one source
    // per axle, and no per-vehicle bore at all.
    unset($payload['documentCentreBoreMm'], $payload['centreBoreSource']);

    foreach ($payload['conditions'] as &$condition) {
        unset($condition['affectsTyreChoice'], $condition['affectsPurchase'], $condition['requiresAcknowledgement']);
    }
    unset($condition);

    foreach (['front', 'rear'] as $axle) {
        unset($payload['tyres'][$axle]['minLoadSource'], $payload['tyres'][$axle]['minSpeedSource']);

        foreach ($payload['tyres'][$axle]['sizes'] as &$size) {
            unset($size['documentMinLoadIndex'], $size['documentMinSpeedSymbol'], $size['axle']);
        }
        unset($size);
    }

    $restored = FitmentVerdict::fromArray($payload);

    expect($restored->restored)->toBeTrue()
        ->and($restored->conditions[0]->affectsTyreChoice)->toBeFalse()
        ->and($restored->conditions[0]->affectsPurchase)->toBeFalse()
        ->and($restored->conditions[0]->requiresAcknowledgement)->toBeFalse()
        ->and($restored->front->sizes[0]->documentMinLoadIndex)->toBeNull()
        ->and($restored->front->sizes[0]->documentMinSpeedSymbol)->toBeNull()
        ->and($restored->front->sizes[0]->axle)->toBe('ALL')
        // Each half reads as the combined flag the old writer recorded.
        ->and($restored->front->minSource)->toBe(MinSource::Document)
        ->and($restored->front->minLoadSource)->toBe(MinSource::Document)
        ->and($restored->front->minSpeedSource)->toBe(MinSource::Document)
        ->and($restored->rear->minLoadSource)->toBe(MinSource::Derived)
        ->and($restored->rear->minSpeedSource)->toBe(MinSource::Derived)
        // An old order said nothing about the bore, so it reads back as nothing — never as the
        // rim's own figure, which that order never showed.
        ->and($restored->documentCentreBoreMm)->toBeNull()
        ->and($restored->centreBoreSource)->toBe(CentreBoreSource::Unstated);
});

it('keeps every key the snapshot shape had before — nothing removed, nothing renamed', function (): void {
    $payload = verdictWithEverything()->toArray();

    expect(array_keys($payload))->toBe([
        'status', 'vehicle', 'wheel', 'document', 'requiresEntry', 'entryNoteDe',
        // Added with the per-vehicle bore; everything around them is untouched.
        'documentCentreBoreMm', 'centreBoreSource',
        'conditions', 'tyres', 'reason', 'snapshot',
    ])
        ->and(array_keys($payload['tyres']))->toBe(['perAxle', 'front', 'rear'])
        ->and(array_slice(array_keys($payload['tyres']['front']), 0, 4))->toBe(['sizes', 'minLoadIndex', 'minSpeedSymbol', 'minSource'])
        ->and(array_slice(array_keys($payload['tyres']['front']['sizes'][0]), 0, 3))->toBe(['width', 'aspect', 'diameter'])
        ->and(array_slice(array_keys($payload['conditions'][0]), 0, 4))->toBe(['code', 'severity', 'textDe', 'textEn']);
});
