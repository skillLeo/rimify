<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Tyres\KomplettradOffer;
use App\Domain\Fitment\Tyres\MixedOffer;
use App\Domain\Fitment\Tyres\MixedPair;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Domain\Fitment\Verdict\ConditionLevel;
use App\Models\DocumentCondition;
use App\Models\Vehicle;
use App\Services\Demo\AcceptanceSeeder;
use App\Services\Storefront\ProductCards;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\DB;

/*
 * 512b, the operator's line (brief of 17.10.2026 §2): „A level may change what the customer reads. It may never change
 * what he is allowed to do.“ The verdict comes from the document — its codes, its Verwendungsbereich, the axle loads,
 * the table; the level is our classification, typed by a person, and a mis-click must never become a legal error.
 *
 * Proved mechanically over the acceptance set: every level of every Auflage in turn, and for every car and every size
 * of the wheel the verdict, the offered tyres, the Mischbereifung pairs and the wheels the listing shows stay exactly
 * what they were. Only the words may move — „Freigegeben“ for „Mit Auflagen“ where every Auflage is a Hinweis — and
 * those are left out of the comparison on purpose. If this fails, the separation has leaked.
 */

beforeEach(function (): void {
    config(['demo.enabled' => true]);
    $this->seed(ReferenceDataSeeder::class);
});

/** The set as `rimify:demo --abnahme` writes it, with stand-in PDFs (as AcceptanceSetTest gives it). */
function levelsAcceptanceSet(): void
{
    $dir = sys_get_temp_dir().'/rimify-abnahme-pdfs-levels';
    $data = require database_path('seeders/content/abnahme/gutachten.php');

    foreach ($data['documents'] as $key => $document) {
        $path = $dir.'/'.$document['pdf']['source'];
        is_dir(dirname($path)) || mkdir(dirname($path), 0777, true);
        file_put_contents($path, "%PDF-1.4\n% stand-in for {$key}\n");
        $data['documents'][$key]['pdf']['sha256'] = hash_file('sha256', $path);
    }

    (new AcceptanceSeeder($dir, $data))->seed();
}

/**
 * A stored answer without what a level may move: the level each Auflage carries, and the moment it was computed.
 *
 * @param  array<mixed>  $data
 * @return array<mixed>
 */
function levelsWithout(array $data): array
{
    $out = [];

    foreach ($data as $key => $value) {
        if ($key === 'level' || $key === 'computedAt') {
            continue;
        }

        $out[$key] = is_array($value) ? levelsWithout($value) : $value;
    }

    return $out;
}

/** @return array<string, mixed> */
function levelsOffer(KomplettradOffer $offer): array
{
    return [
        'tyres' => array_map(static fn (TyreRecord $t): int => $t->id, $offer->tyres),
        'refusal' => $offer->refusal?->value,
        'minimum' => $offer->minimumSentenceDe,
        'source' => $offer->minSource->value,
    ];
}

/** @return array<string, mixed> */
function levelsMixed(MixedOffer $offer): array
{
    return [
        'pairs' => array_map(static fn (MixedPair $p): array => [
            'pair' => $p->pairing->number.' '.$p->pairing->key(),
            'front' => $p->frontMinimum,
            'rear' => $p->rearMinimum,
            'sets' => array_map(static fn (array $s): string => $s['front']->id.'-'.$s['rear']->id, $p->sets),
        ], $offer->pairs),
        'refusal' => $offer->refusal?->value,
        'hasTable' => $offer->hasTable,
        'rules' => $offer->rulesDe,
        'pages' => [$offer->sourcePage, $offer->rulesPage],
    ];
}

/**
 * Every answer of the set a level may not move: per car and size the verdict and both offers, and — with `$listing` — per
 * car the listing's cards.
 *
 * @return array<string, mixed>
 */
function levelsAnswers(bool $listing = true): array
{
    $resolver = app(FitmentResolver::class);
    $eligibility = app(TyreEligibility::class);
    $configs = DB::table('wheel_configs as c')->join('wheel_models as m', 'm.id', '=', 'c.wheel_model_id')
        ->where('m.demo_ref', AcceptanceSeeder::WHEEL_REF)->orderBy('c.id')->pluck('c.id')->map(static fn (mixed $id): int => (int) $id)->all();
    $out = [];

    foreach (Vehicle::query()->where('demo_ref', 'like', 'abnahme:vehicle:%')->orderBy('id')->get() as $vehicle) {
        foreach ($resolver->resolveMany($vehicle->id, $configs) as $configId => $verdict) {
            $out["{$vehicle->id}:{$configId}"] = [
                'sellable' => $verdict->isSellable(),
                'verdict' => levelsWithout($verdict->toArray()),
                'offer' => levelsOffer($eligibility->offerFor($verdict, false)),
                'mixed' => levelsMixed($eligibility->mixedOfferFor($verdict, false)),
            ];
        }

        if (! $listing) {
            continue;
        }

        // The wheels shown for this car, as the listing builds them — without the words a level may soften.
        $out["{$vehicle->id}:listing"] = array_map(static fn (array $card): array => [
            'wheel' => $card['compareKey'],
            'fitting' => $card['diametersFitting'],
            'status' => $card['fitment']['status'] ?? null,
            'entry' => $card['fitment']['requiresEntry'] ?? null,
            // Every Auflage still listed, whatever the badge says above them.
            'conditions' => $card['fitment']['conditions'] ?? null,
        ], app(ProductCards::class)->forVehicle($vehicle->id, [], 100)['cards']);
    }

    return $out;
}

it('moves no verdict and no offered tyre or pair, whatever level any Auflage of an answer has, one at a time — 512b', function (): void {
    levelsAcceptanceSet();
    $baseline = levelsAnswers(listing: false);

    // The proof means something only over answers that differ: sellable and not, offered and refused.
    expect(array_filter($baseline, static fn (array $answer): bool => $answer['sellable'] === true))->not->toBeEmpty()
        ->and(array_filter($baseline, static fn (array $answer): bool => $answer['sellable'] === false))->not->toBeEmpty();

    // The Auflagen that reach an answer: the codes the set's rows and sizes carry. A definition no row uses is never read
    // into a verdict; every definition is flipped at once in the test below.
    $used = DB::table('fitment_conditions')->pluck('code')->merge(DB::table('fitment_tyre_size_conditions')->pluck('code'))->unique()->values()->all();
    $conditions = DocumentCondition::query()->whereIn('code', $used)->orderBy('id')->get();
    $flips = 0;

    expect($conditions)->not->toBeEmpty();

    foreach ($conditions as $condition) {
        $chosen = $condition->level;

        foreach (ConditionLevel::cases() as $level) {
            // The floor holds in the form and the model alike: an Abnahme or body work is never a Hinweis.
            if ($level === $chosen || ! $level->allowedFor($condition->kind)) {
                continue;
            }

            DocumentCondition::query()->whereKey($condition->id)->update(['level' => $level->value]);

            expect(levelsAnswers(listing: false))->toEqual($baseline, "{$condition->code} set to „{$level->labelDe()}“ moved an answer");
            $flips++;
        }

        DocumentCondition::query()->whereKey($condition->id)->update(['level' => $chosen?->value]);
    }

    // Every Auflage that reaches an answer, each to every other level it may have.
    expect($flips)->toBeGreaterThanOrEqual($conditions->count());
});

it('moves no verdict, no offer and no wheel shown with every Auflage at once at the quietest level it may have, and at the loudest', function (): void {
    levelsAcceptanceSet();
    $before = levelsAnswers();

    // Every Auflage at once to the quietest level it may have, then to the loudest.
    foreach ([ConditionLevel::Hinweis, ConditionLevel::NichtZulaessig] as $level) {
        foreach (DocumentCondition::query()->get() as $condition) {
            DocumentCondition::query()->whereKey($condition->id)->update(['level' => $level->atLeastFloorOf($condition->kind)->value]);
        }

        expect(levelsAnswers())->toEqual($before, "every Auflage at „{$level->labelDe()}“ moved an answer");
    }
});
