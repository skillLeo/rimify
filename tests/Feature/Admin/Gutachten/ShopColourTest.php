<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\HintColour;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Enums\TyreIndexSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCarEntry;
use App\Models\DocumentCondition;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Gutachten\ReleaseAnswers;

/*
 * The client's item 23 (the operator's brief of 07.11.2026, §6; supersedes D-247 for colour): each code of a paper has a shop colour,
 * green or yellow, green by default. The „Mit Auflagen“ hint on the listing and the product page wears yellow if any code that makes
 * the answer conditional is yellow, otherwise green. Colour is presentation only: the verdict and its words do not change.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

function colourAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/**
 * A released paper: one car on one wheel, the codes on its line.
 *
 * @param  array<string, array{0: ConditionKind, 1: string}>  $codes
 * @return array{document: ApprovalDocument, car: Vehicle, wheel: WheelConfig}
 */
function colourPaper(array $codes): array
{
    $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Papers)->create();
    $model = WheelModel::factory()->create(['is_demo' => false, 'name' => 'Farbtest']);
    $wheel = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => WheelFinish::factory()->create(['wheel_model_id' => $model->id])->id, 'diameter_in' => 18.0]);
    $car = Vehicle::factory()->create(['axle_load_front_kg' => 1000, 'axle_load_rear_kg' => 1000, 'max_speed_kmh' => 200]);

    foreach ($codes as $code => [$kind, $text]) {
        DocumentCondition::query()->create(['approval_document_id' => $document->id, 'code' => $code, 'kind' => $kind, 'text_de' => $text]);
    }

    $admin = colourAdmin();
    $base = "/admin/gutachten/{$document->id}/erfassung";
    test()->actingAs($admin, 'admin')->postJson("{$base}/kombinationen", ['front_config_id' => $wheel->id, 'rear_config_id' => $wheel->id])->assertOk();
    test()->actingAs($admin, 'admin')->postJson("{$base}/fahrzeuge", ['vehicle_ids' => [$car->id]])->assertOk();
    $cell = DocumentCarEntry::query()->where('approval_document_id', $document->id)->firstOrFail();
    test()->actingAs($admin, 'admin')->putJson("{$base}/fahrzeuge/{$cell->id}", ['lines' => [['id' => null, 'front' => '225/40R18 92Y', 'rear' => '225/40R18 92Y', 'kw' => '', 'codes' => array_keys($codes)]], 'codes' => [], 'source_page' => 2])->assertOk();
    test()->actingAs($admin, 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertSessionHasNoErrors();

    return ['document' => $document->fresh(), 'car' => $car, 'wheel' => $wheel];
}

function colourOf(ApprovalDocument $document, string $code): DocumentCondition
{
    return DocumentCondition::query()->where('approval_document_id', $document->id)->where('code', $code)->firstOrFail();
}

it('is green by default, and set per code in „definieren“', function (): void {
    $document = ApprovalDocument::factory()->draft()->create();

    $this->actingAs(colourAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", ['code' => 'G1', 'kind' => 'hinweis', 'text_de' => 'Nur mit Serienschrauben.'])->assertSessionHasNoErrors();
    $this->actingAs(colourAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", ['code' => 'Y1', 'kind' => 'hinweis', 'text_de' => 'Bördeln der Radläufe erforderlich.', 'shop_colour' => 'yellow'])->assertSessionHasNoErrors();
    $this->actingAs(colourAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", ['code' => 'X1', 'kind' => 'hinweis', 'text_de' => 'Falsch.', 'shop_colour' => 'rot'])->assertSessionHasErrors('shop_colour');

    expect(colourOf($document, 'G1')->shop_colour)->toBe(HintColour::Green)
        ->and(colourOf($document, 'Y1')->shop_colour)->toBe(HintColour::Yellow);
});

it('changes on a released paper too, by those who may set levels, on the record (R-11)', function (): void {
    ['document' => $document] = colourPaper(['K1' => [ConditionKind::Karosseriearbeit, 'Bördeln der Radläufe erforderlich.']]);
    $code = colourOf($document, 'K1');
    $url = "/admin/gutachten/{$document->id}/auflagen/{$code->id}/farbe";

    $this->actingAs(colourAdmin('support-agent'), 'admin')->put($url, ['shop_colour' => 'yellow'])->assertForbidden();
    $this->actingAs(colourAdmin(), 'admin')->put($url, ['shop_colour' => 'blau'])->assertSessionHasErrors('shop_colour');

    $this->actingAs(colourAdmin(), 'admin')->put($url, ['shop_colour' => 'yellow'])->assertSessionHasNoErrors();

    expect($code->fresh()->shop_colour)->toBe(HintColour::Yellow)
        ->and(AuditLog::query()->where('description', 'approval.condition_colour_set')->count())->toBe(1);
});

it('leaves the verdict and its words exactly as they were, whichever colour', function (): void {
    ['document' => $document, 'car' => $car, 'wheel' => $wheel] = colourPaper(['K1' => [ConditionKind::Karosseriearbeit, 'Bördeln der Radläufe erforderlich.']]);
    $resolver = app(FitmentResolver::class);
    $green = $resolver->resolve($car->id, $wheel->id);

    colourOf($document, 'K1')->forceFill(['shop_colour' => HintColour::Yellow])->save();
    $yellow = $resolver->resolve($car->id, $wheel->id);

    $plain = static function (array $answer): array {
        unset($answer['computedAt']);

        return $answer;
    };

    expect($green->status->value)->toBe('CONDITIONAL')
        ->and($plain($yellow->toArray()))->toEqual($plain($green->toArray()))
        ->and($green->hintColour())->toBe(HintColour::Green)
        ->and($yellow->hintColour())->toBe(HintColour::Yellow);
});

it('wears yellow if any code that makes the answer conditional is yellow, otherwise green', function (): void {
    ['document' => $document, 'car' => $car, 'wheel' => $wheel] = colourPaper([
        'K1' => [ConditionKind::Karosseriearbeit, 'Bördeln der Radläufe erforderlich.'],
        'A1' => [ConditionKind::Abnahme, 'Abnahme durch eine Prüfstelle erforderlich.'],
    ]);
    $resolver = app(FitmentResolver::class);

    expect($resolver->resolve($car->id, $wheel->id)->hintColour())->toBe(HintColour::Green);

    colourOf($document, 'K1')->forceFill(['shop_colour' => HintColour::Yellow])->save();

    expect($resolver->resolve($car->id, $wheel->id)->hintColour())->toBe(HintColour::Yellow);
});

it('shows it on the listing and the product page, and the words stay „Mit Auflagen“', function (): void {
    ['document' => $document, 'car' => $car, 'wheel' => $wheel] = colourPaper(['K1' => [ConditionKind::Karosseriearbeit, 'Bördeln der Radläufe erforderlich.']]);
    colourOf($document, 'K1')->forceFill(['shop_colour' => HintColour::Yellow])->save();
    $slug = WheelModel::query()->whereKey($wheel->wheel_model_id)->value('slug');

    $this->get("/felgen/{$slug}?fahrzeug={$car->id}")->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('configs.0.verdict.status', 'CONDITIONAL')
        ->where('configs.0.verdict.hint', 'yellow')
        ->where('configs.0.verdict.label', VerdictStatus::Conditional->labelDe()));

    $this->get("/felgen?fahrzeug={$car->id}")->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('cards.0.fitment.hint', 'yellow'));
});

it('has a column and a filter on Admin › Auflagen', function (): void {
    ['document' => $document] = colourPaper([
        'K1' => [ConditionKind::Karosseriearbeit, 'Bördeln der Radläufe erforderlich.'],
        'H1' => [ConditionKind::Hinweis, 'Nur mit Serienschrauben.'],
    ]);
    colourOf($document, 'K1')->forceFill(['shop_colour' => HintColour::Yellow])->save();

    $codes = static fn (AssertableInertia $page): array => collect($page->toArray()['props']['documents'][0]['conditions'] ?? [])->pluck('code')->all();

    $this->actingAs(colourAdmin(), 'admin')->get('/admin/auflagen')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('farbe', null)->where('documents.0.conditions.0.shopColour', fn (string $colour): bool => in_array($colour, ['green', 'yellow'], true)));

    $this->actingAs(colourAdmin(), 'admin')->get('/admin/auflagen?farbe=yellow')->assertOk()->assertInertia(function (AssertableInertia $page) use ($codes) {
        expect($codes($page))->toBe(['K1']);

        return $page->where('farbe', 'yellow');
    });

    $this->actingAs(colourAdmin(), 'admin')->get('/admin/auflagen?farbe=green')->assertOk()->assertInertia(function (AssertableInertia $page) use ($codes) {
        expect($codes($page))->toBe(['H1']);

        return $page;
    });
});
