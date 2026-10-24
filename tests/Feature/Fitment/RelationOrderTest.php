<?php

declare(strict_types=1);

use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;

/*
 * A verdict is the same answer every time it is asked. LevelsChangeNoAnswerTest failed on MySQL on 24.10.2026 with no
 * answer moved: a car's tyre sizes came back in another order from one read to the next — the one relation the resolver
 * reads that had no order (Fitment::tyreSizes), so the order was whatever the engine's plan gave. MariaDB happened to
 * give the same twice. Every relation a fitment row is read with is ordered.
 */

it('reads every relation of a fitment row in one fixed order, so a verdict is the same answer every time', function (): void {
    $relations = [
        'the row\'s tyre sizes' => (new Fitment)->tyreSizes(),
        'the row\'s Auflagen' => (new Fitment)->conditionCodes(),
        'a size\'s Auflagen' => (new FitmentTyreSize)->conditionCodes(),
        'the document\'s Auflagen' => (new ApprovalDocument)->conditions(),
        'the speed table' => (new ApprovalDocument)->speedDeratings(),
        'the tyre combinations' => (new ApprovalDocument)->tyreCombinations(),
    ];

    foreach ($relations as $name => $relation) {
        expect($relation->toBase()->orders, "{$name} are read in no fixed order")->not->toBeEmpty();
    }
});
