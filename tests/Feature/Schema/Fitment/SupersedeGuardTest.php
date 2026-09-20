<?php

declare(strict_types=1);

use App\Domain\Approval\SupersedeChain;
use App\Models\ApprovalDocument;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

/*
 * A revision chain must always be walkable to one current document. Two failure modes break that:
 * a self-reference, and a cycle. The first is caught in three places, the second in one — because
 * a trigger cannot see beyond the row it fires on.
 */

it('refuses a document that supersedes itself, through the model', function (): void {
    $document = ApprovalDocument::factory()->create();
    $document->supersedes_id = $document->id;

    expect(fn () => $document->save())->toThrow(LogicException::class, 'selbst ablösen');
});

it('refuses a self-supersede written as raw SQL, through the trigger', function (): void {
    // The path the model cannot see: a future migration, a console one-liner, a DBA.
    $document = ApprovalDocument::factory()->create();

    expect(fn () => DB::statement(
        'UPDATE approval_documents SET supersedes_id = id WHERE id = ?',
        [$document->id],
    ))->toThrow(QueryException::class, 'selbst ablösen');

    expect(DB::table('approval_documents')->where('id', $document->id)->value('supersedes_id'))
        ->toBeNull();
});

it('reports SQLSTATE 45000 so the failure is unmistakable', function (): void {
    $document = ApprovalDocument::factory()->create();

    try {
        DB::statement('UPDATE approval_documents SET supersedes_id = id WHERE id = ?', [$document->id]);
        $this->fail('The trigger did not fire.');
    } catch (QueryException $e) {
        expect($e->getCode())->toBe('45000');
    }
});

it('rejects the A to B to A cycle a self-reference check cannot catch', function (): void {
    $a = ApprovalDocument::factory()->create();
    $b = ApprovalDocument::factory()->create(['supersedes_id' => $a->id]);

    // Neither row references itself, so neither the model guard nor the trigger sees a problem —
    // but the chain would now loop forever and no revision would be current.
    $chain = SupersedeChain::fromConfig();

    expect($chain->wouldCreateCycle($a->id, $b->id))->toBeTrue();

    $a->supersedes_id = $b->id;
    expect(fn () => $a->save())->toThrow(LogicException::class, 'close a loop');
});

it('rejects a longer cycle, A to B to C to A', function (): void {
    $a = ApprovalDocument::factory()->create();
    $b = ApprovalDocument::factory()->create(['supersedes_id' => $a->id]);
    $c = ApprovalDocument::factory()->create(['supersedes_id' => $b->id]);

    expect(SupersedeChain::fromConfig()->wouldCreateCycle($a->id, $c->id))->toBeTrue();
});

it('allows a legitimate revision chain of any reasonable depth', function (): void {
    $first = ApprovalDocument::factory()->create();
    $previous = $first;

    foreach (range(1, 5) as $revision) {
        $next = ApprovalDocument::factory()->create([
            'supersedes_id' => $previous->id,
            'revision' => $revision + 1,
        ]);

        expect($next->fresh()->supersedes_id)->toBe($previous->id);
        $previous = $next;
    }

    expect(SupersedeChain::fromConfig()->forwardChain($first))->toHaveCount(5);
});

it('refuses to extend a chain it cannot verify within the depth limit', function (): void {
    // An unverifiable chain is not extended: refusing is the answer that fails safe.
    $shallow = new SupersedeChain(maxDepth: 2);

    $a = ApprovalDocument::factory()->create();
    $b = ApprovalDocument::factory()->create(['supersedes_id' => $a->id]);
    $c = ApprovalDocument::factory()->create(['supersedes_id' => $b->id]);
    $d = ApprovalDocument::factory()->create(['supersedes_id' => $c->id]);

    expect($shallow->wouldCreateCycle(999_999, $d->id))->toBeTrue()
        // The same link is fine once the walk is allowed to finish.
        ->and((new SupersedeChain(maxDepth: 20))->wouldCreateCycle(999_999, $d->id))->toBeFalse();
});

it('treats a null supersedes_id as always safe', function (): void {
    expect(SupersedeChain::fromConfig()->wouldCreateCycle(1, null))->toBeFalse();
});

it('keeps a superseded revision readable rather than deleting it', function (): void {
    $old = ApprovalDocument::factory()->create();
    ApprovalDocument::factory()->create(['supersedes_id' => $old->id]);

    // RESTRICT: the row an order was placed against can never vanish.
    expect(fn () => DB::statement('DELETE FROM approval_documents WHERE id = ?', [$old->id]))
        ->toThrow(QueryException::class);
});
