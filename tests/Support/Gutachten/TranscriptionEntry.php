<?php

declare(strict_types=1);

namespace Tests\Support\Gutachten;

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The Borbet transcriptions (docs/gutachten) typed in through the admin's own endpoints, the way
 * e2e/tools/gutachten-eingabe.mjs types them into a running shop: every request passes the Form Request and the
 * Policy a person's does. One car's blocks in one document become its one row, with what only one block
 * prints moved to that block's sizes.
 */
final class TranscriptionEntry
{
    /** @var array<string, array<string, mixed>> the cars, by key */
    private array $cars;

    /** @var array<string, int> car key → vehicle id */
    private array $vehicleIds = [];

    /** @var array<int|string, int> document tag (55255, 53841, 366 — PHP keeps them as integer keys) → id */
    public array $documents = [];

    public function __construct(private readonly TestCase $test, private readonly AdminUser $admin)
    {
        /** @var list<array<string, mixed>> $cars */
        $cars = self::read('fahrzeuge.json');
        $this->cars = array_column($cars, null, 'key');
    }

    /** @return array<string, mixed> */
    public static function read(string $file): array
    {
        /** @var array<string, mixed> $data */
        $data = json_decode((string) file_get_contents(base_path('docs/gutachten/'.$file)), true, flags: JSON_THROW_ON_ERROR);

        return $data;
    }

    /**
     * Both wheels' documents, their cars and rows, released by the admin at the end — and the 18″'s base, ABE 53841,
     * whose own Verwendungsbereich is the Nachtrag's Anlagen: entered first, without rows, and linked from the Nachtrag.
     */
    public function enterBoth(bool $release = true): void
    {
        $abe = self::read('abe-55255.json');
        $base = self::read('abe-53841.json');
        $nachtrag = self::read('366-0350-21-WIRD-N1.json');

        $this->documents['55255'] = $this->document($abe);
        $this->documents['53841'] = $this->document($base);
        $this->documents['366'] = $this->document($nachtrag, ['supplement_to_id' => $this->documents['53841']]);

        $this->rows($abe, '55255');
        $this->rows($nachtrag, '366');

        if ($release) {
            foreach ($this->documents as $id) {
                $this->test->actingAs($this->admin, 'admin')->post("/admin/gutachten/{$id}/freigeben", ReleaseAnswers::for(ApprovalDocument::query()->findOrFail($id)))->assertSessionHasNoErrors();
            }
        }
    }

    public function vehicle(string $key): Vehicle
    {
        return Vehicle::query()->findOrFail($this->vehicleIds[$key]);
    }

    /**
     * @param  array<string, mixed>  $t
     * @param  array<string, mixed>  $link  the base a Nachtrag supplements, when we hold it
     */
    private function document(array $t, array $link = []): int
    {
        /** @var array<string, mixed> $doc */
        $doc = $t['document'];
        $key = 'pending/'.Str::lower((string) Str::ulid()).'.pdf';
        Storage::disk('docs_private')->put($key, "%PDF-1.4\n% Abschrift für den Test\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n");

        $this->test->actingAs($this->admin, 'admin')->post('/admin/gutachten', [...$doc, ...$link, 'upload_key' => $key])->assertSessionHasNoErrors();
        $id = (int) ApprovalDocument::query()->latest('id')->value('id');

        // A base whose Auflagen stand in its Nachtrag's Anlagen (ABE 53841) prints no legend of its own.
        if ($t['conditions'] !== []) {
            $this->test->actingAs($this->admin, 'admin')->post("/admin/gutachten/{$id}/auflagen/stapel", ['entries' => $t['conditions']])->assertSessionHasNoErrors();
        }

        foreach ($t['fasteners'] as $fastener) {
            $this->test->actingAs($this->admin, 'admin')->post("/admin/gutachten/{$id}/befestigungsmittel", $fastener)->assertSessionHasNoErrors();
        }

        foreach ($t['notices'] as $notice) {
            $this->test->actingAs($this->admin, 'admin')->post("/admin/gutachten/{$id}/hinweise", $notice)->assertSessionHasNoErrors();
        }

        if (is_array($t['derating'])) {
            $this->test->actingAs($this->admin, 'admin')->put("/admin/gutachten/{$id}/tragfaehigkeitstabelle", $t['derating'])->assertSessionHasNoErrors();
        }

        $conditionIds = DocumentCondition::query()->where('approval_document_id', $id)->pluck('id', 'code');

        foreach ($t['reworks'] as $rework) {
            $code = $rework['code'];
            unset($rework['code']);
            $this->test->actingAs($this->admin, 'admin')->post("/admin/gutachten/{$id}/nacharbeit", ['document_condition_id' => $conditionIds[$code], ...$rework])->assertSessionHasNoErrors();
        }

        return $id;
    }

    /** @param array<string, mixed> $t */
    private function rows(array $t, string $tag): void
    {
        $configIds = WheelConfig::query()->whereIn('sku', $t['configs'])->pluck('id')->map(static fn (mixed $id): int => (int) $id)->all();
        $groups = $t['groups'];
        $keys = array_values(array_unique(array_merge(...array_map(static fn (array $g): array => $g['cars'], $groups))));

        foreach ($keys as $key) {
            $row = self::rowFor(array_values(array_filter($groups, static fn (array $g): bool => in_array($key, $g['cars'], true))));

            $this->test->actingAs($this->admin, 'admin')->post("/admin/gutachten/{$this->documents[$tag]}/zeilen", [
                'vehicle_ids' => [$this->car($key)],
                'config_ids' => $configIds,
                'axle' => 'ALL',
                'entry_note' => '',
                'source_page' => $row['page'],
                'tyre_sizes' => $row['sizes'],
                'conditions' => array_map(static fn (string $code): array => ['code' => $code, 'note' => ''], $row['codes']),
            ])->assertSessionHasNoErrors();
        }
    }

    /** The car, created from the document that names it — found again where it already stands. */
    private function car(string $key): int
    {
        if (isset($this->vehicleIds[$key])) {
            return $this->vehicleIds[$key];
        }

        $car = $this->cars[$key];
        $response = $this->test->actingAs($this->admin, 'admin')->postJson("/admin/gutachten/{$this->documents[$car['doc']]}/fahrzeuge", [
            'make' => $car['make'], 'model' => $car['model'], 'variant' => $car['variant'] ?? '', 'type_designation' => $car['type'],
            'eg_number' => $car['eg'], 'body_form' => $car['body'] ?? '', 'drive_axle' => $car['drive'] ?? '', 'source_page' => $car['page'],
        ])->assertCreated();

        return $this->vehicleIds[$key] = (int) $response->json('id');
    }

    /**
     * @param  list<array<string, mixed>>  $blocks
     * @return array{codes: list<string>, sizes: list<array<string, mixed>>, page: int}
     */
    public static function rowFor(array $blocks): array
    {
        $common = array_values(array_intersect(...array_map(static fn (array $b): array => $b['codes'], [...$blocks, $blocks[0]])));
        $sizes = [];

        foreach ($blocks as $block) {
            $own = array_values(array_diff($block['codes'], $common));

            foreach ($block['sizes'] as $size) {
                $key = implode('|', [$size['width_mm'], $size['aspect'], $size['diameter'], $size['axle'], $size['kw_min'] ?? '', $size['kw_max'] ?? '', $size['min_load_index'] ?? '', $size['min_speed_symbol'] ?? '']);
                $codes = array_values(array_unique([...$size['codes'], ...$own]));
                $sizes[$key] = isset($sizes[$key]) ? [...$sizes[$key], 'codes' => array_values(array_unique([...$sizes[$key]['codes'], ...$codes]))] : [...$size, 'min_speed_symbol' => $size['min_speed_symbol'] ?? '', 'codes' => $codes];
            }
        }

        return [
            'codes' => $common,
            'sizes' => array_values($sizes),
            'page' => min(array_map(static fn (array $b): int => (int) $b['page'], $blocks)),
        ];
    }
}
