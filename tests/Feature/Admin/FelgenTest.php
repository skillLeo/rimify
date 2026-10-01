<?php

declare(strict_types=1);

use App\Enums\CatalogueStatus;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Brand;
use App\Models\Fitment;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelFinishImage;
use App\Models\WheelModel;
use App\Policies\WheelModelPolicy;
use App\Services\Admin\Catalogue\FinishImages;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ApprovalSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

/**
 * Katalog › Felgen (the review release §4.2): the list, one model's form with its finishes and size
 * matrix, and the step into the shop. A save never publishes; a demo model never reaches the shop; a
 * size an approval names keeps its measurements; the Freigaben column counts real fitment rows.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

function felgenAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** A real (not demo) model with one finish and the given sizes. */
function felgeWith(array $sizes = [[18.0, 8.0, 35]], array $model = []): WheelModel
{
    $wheel = WheelModel::factory()->draft()->create(array_replace(['name' => 'Testmodell', 'is_demo' => false, 'description_de' => 'Eine Felge.'], $model));
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $wheel->id, 'name_de' => 'Graphit matt']);

    foreach ($sizes as [$d, $w, $et]) {
        WheelConfig::factory()->create([
            'wheel_model_id' => $wheel->id, 'wheel_finish_id' => $finish->id,
            'diameter_in' => $d, 'width_in' => $w, 'et_mm' => $et, 'price_cents' => 18_900, 'stock_qty' => 4,
        ]);
    }

    return $wheel->refresh();
}

/** The form's payload for a model as it stands, which a test then changes. */
function felgePayload(WheelModel $wheel): array
{
    $wheel->load(['finishes', 'configs']);

    return [
        'brand_id' => $wheel->brand_id,
        'name' => $wheel->name,
        'type_designation' => $wheel->type_designation,
        'spoke_count' => $wheel->spoke_count,
        'description' => $wheel->description_de,
        'seo_title' => '',
        'seo_description' => '',
        'finishes' => $wheel->finishes->map(fn (WheelFinish $f): array => ['key' => 'f'.$f->id, 'id' => $f->id, 'name' => $f->name_de, 'hex' => '', 'art_finish' => $f->art_finish])->all(),
        'configs' => $wheel->configs->map(fn (WheelConfig $c): array => [
            'id' => $c->id, 'finish' => 'f'.$c->wheel_finish_id,
            'diameter' => str_replace('.', ',', (string) (float) $c->diameter_in), 'width' => str_replace('.', ',', (string) (float) $c->width_in),
            'et' => (string) $c->et_mm, 'bolt_holes' => 5, 'bolt_circle' => '112', 'bore' => '66,6',
            'sku' => $c->getAttribute('sku'), 'ean' => '', 'kba' => '', 'price' => '189,00', 'stock' => 4, 'weight_g' => null,
        ])->all(),
    ];
}

function newFelgePayload(array $override = []): array
{
    return array_replace([
        'brand_id' => null,
        'brand_new' => 'Prüfmarke',
        'name' => 'Kontur',
        'type_designation' => 'KT85',
        'spoke_count' => 10,
        'description' => 'Zehn Speichen.',
        'seo_title' => '',
        'seo_description' => '',
        'finishes' => [['key' => 'n1', 'id' => null, 'name' => 'Silber', 'hex' => '#C0C4C8', 'art_finish' => 'silver']],
        'configs' => [
            ['id' => null, 'finish' => 'n1', 'diameter' => '18', 'width' => '8,5', 'et' => '35', 'bolt_holes' => 5, 'bolt_circle' => '112', 'bore' => '66,6', 'sku' => 'PM-KONTUR-18X8.5-ET35-S', 'ean' => '', 'kba' => '', 'price' => '1.189,50', 'stock' => 3, 'weight_g' => 10400],
            ['id' => null, 'finish' => 'n1', 'diameter' => '19', 'width' => '9', 'et' => '-5', 'bolt_holes' => 5, 'bolt_circle' => '112', 'bore' => '66,6', 'sku' => 'PM-KONTUR-19X9-ET-5-S', 'ean' => '4012345678901', 'kba' => '', 'price' => '219', 'stock' => 0, 'weight_g' => null],
        ],
    ], $override);
}

describe('the list', function (): void {
    it('opens with nothing in the catalogue, and says how to fill it', function (): void {
        $this->actingAs(felgenAdmin(), 'admin')->get('/admin/felgen')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Felgen/Index')
                ->has('wheels', 0)
                ->where('filtered', false)
                ->where('pagination.total', 0)
                ->where('can.create', true));
    });

    it('shows one model with what its sizes add up to', function (): void {
        felgeWith([[18.0, 8.0, 35], [19.0, 8.5, 40]]);

        $this->actingAs(felgenAdmin(), 'admin')->get('/admin/felgen')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('wheels', 1)
                ->where('wheels.0.name', 'Testmodell')
                ->where('wheels.0.sizes', 2)
                ->where('wheels.0.diameters', "18\u{2013}19 Zoll")
                ->where('wheels.0.fromCents', 18_900)
                ->where('wheels.0.stock', 8)
                ->where('wheels.0.statusLabel', 'Entwurf')
                ->where('wheels.0.demo', false)
                ->where('wheels.0.coverage.label', 'Freigaben noch nicht hinterlegt'));
    });

    it('counts Freigaben from published fitment rows, and marks the demo set', function (): void {
        $this->seed(ApprovalSeeder::class);
        $covered = (int) DB::table('fitments')->where('fitments.status', 'published')->join('wheel_configs', 'wheel_configs.id', '=', 'fitments.wheel_config_id')->value('wheel_configs.wheel_model_id');
        $models = WheelModel::query()->count();

        $this->actingAs(felgenAdmin(), 'admin')->get('/admin/felgen?demo=ja')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('pagination.total', $models)
                ->where('wheels', fn ($wheels) => collect($wheels)->every(fn (array $w): bool => $w['demo'] === true && $w['status'] === 'draft'))
                ->where('wheels', fn ($wheels) => collect($wheels)->firstWhere('id', $covered)['covered'] > 0));

        $this->actingAs(felgenAdmin(), 'admin')->get('/admin/felgen?freigaben=keine')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('wheels', fn ($wheels) => collect($wheels)->every(fn (array $w): bool => $w['covered'] === 0)));
    });

    it('finds a model by an SKU of one of its sizes', function (): void {
        $wheel = felgeWith();
        $sku = (string) $wheel->configs()->value('sku');
        felgeWith([[20.0, 9.0, 30]], ['name' => 'Anderes Modell']);

        $this->actingAs(felgenAdmin(), 'admin')->get('/admin/felgen?q='.urlencode($sku))
            ->assertInertia(fn (AssertableInertia $page) => $page->has('wheels', 1)->where('wheels.0.id', $wheel->id)->where('filtered', true));
    });

    it('refuses a filter it cannot read, in German, and opens the list without it', function (): void {
        $this->actingAs(felgenAdmin(), 'admin')->get('/admin/felgen?freigaben=vielleicht')
            ->assertRedirect('/admin/felgen')
            ->assertSessionHasErrors(['freigaben' => 'Diesen Filter gibt es nicht. Wähl bitte einen aus der Liste.']);
    });

    it('is refused to a role without the catalogue, and read-only to one that may only look', function (): void {
        $this->actingAs(felgenAdmin('content-editor'), 'admin')->get('/admin/felgen')->assertForbidden();

        $this->actingAs(felgenAdmin('support-agent'), 'admin')->get('/admin/felgen')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('can.create', false)->where('can.publish', false));
    });
});

describe('a new Felge', function (): void {
    it('is saved whole as a draft — brand, finish, sizes read the German way — and recorded', function (): void {
        $this->actingAs(felgenAdmin(), 'admin')->post('/admin/felgen', newFelgePayload())
            ->assertRedirect()
            ->assertSessionHas('toast', 'Felge angelegt. Sie ist ein Entwurf, bis du sie veröffentlichst.');

        $wheel = WheelModel::query()->where('name', 'Kontur')->firstOrFail();
        $sizes = $wheel->configs()->orderBy('diameter_in')->get();

        expect($wheel->status)->toBe(CatalogueStatus::Draft)
            ->and($wheel->is_demo)->toBeFalse()
            ->and($wheel->slug)->toBe('pruefmarke-kontur')
            ->and(Brand::query()->where('name', 'Prüfmarke')->exists())->toBeTrue()
            ->and($sizes)->toHaveCount(2)
            ->and((float) $sizes[0]->width_in)->toBe(8.5)
            ->and($sizes[0]->price_cents)->toBe(118_950)
            ->and($sizes[1]->et_mm)->toBe(-5)
            ->and($sizes[1]->price_cents)->toBe(21_900)
            ->and((float) $sizes[1]->getAttribute('centre_bore_mm'))->toBe(66.6)
            ->and(AuditLog::query()->where('description', 'wheel.created')->count())->toBe(1);
    });

    it('says under each cell what it could not read', function (): void {
        $payload = newFelgePayload();
        $payload['configs'][0]['width'] = '8.5';
        $payload['configs'][0]['price'] = '1.42,00';
        $payload['configs'][1]['et'] = 'ET35';
        $payload['configs'][1]['bore'] = '120';

        $this->actingAs(felgenAdmin(), 'admin')->post('/admin/felgen', $payload)
            ->assertSessionHasErrors([
                'configs.0.width' => 'Die Breite bitte in Zoll, zwischen 4 und 14, zum Beispiel 8,5.',
                'configs.0.price' => 'Den Preis können wir nicht lesen. Schreib ihn bitte so: 189 oder 1.425,50.',
                'configs.1.et' => 'Die Einpresstiefe bitte in ganzen Millimetern, zwischen −99 und 99.',
                'configs.1.bore' => 'Die Mittenlochbohrung bitte in Millimetern, zwischen 50 und 90, zum Beispiel 66,6.',
            ]);

        expect(WheelModel::query()->count())->toBe(0);
    });

    it('refuses an SKU another Felge carries, and the same size twice in one finish', function (): void {
        $other = felgeWith();
        $payload = newFelgePayload();
        $payload['configs'][0]['sku'] = strtolower((string) $other->configs()->value('sku'));
        $payload['configs'][1] = [...$payload['configs'][0], 'sku' => 'PM-ANDERS'];

        $this->actingAs(felgenAdmin(), 'admin')->post('/admin/felgen', $payload)
            ->assertSessionHasErrors([
                'configs.0.sku' => 'Diese SKU gehört schon zu einer anderen Felge.',
                'configs.1.width' => 'Diese Größe gibt es in dieser Ausführung schon (Zeile 1).',
            ]);
    });

    it('is refused on the server to a role that may only look (R-11)', function (): void {
        $this->actingAs(felgenAdmin('support-agent'), 'admin')->post('/admin/felgen', newFelgePayload())->assertForbidden();
        $this->actingAs(felgenAdmin('support-agent'), 'admin')->get('/admin/felgen/neu')->assertForbidden();

        expect(WheelModel::query()->count())->toBe(0);
    });
});

describe('changing a Felge', function (): void {
    it('keeps an internal note for the admin — above the Felge and in the list, never in the shop', function (): void {
        $note = 'Platzhalterpreise, vom Kunden zu ersetzen';
        $wheel = felgeWith();

        $this->actingAs(felgenAdmin(), 'admin')->put('/admin/felgen/'.$wheel->id, [...felgePayload($wheel), 'internal_note' => "  {$note}  "])->assertSessionHasNoErrors();

        expect($wheel->refresh()->internal_note)->toBe($note);

        $this->actingAs(felgenAdmin(), 'admin')->get('/admin/felgen/'.$wheel->id)
            ->assertInertia(fn (AssertableInertia $page) => $page->where('model.internalNote', $note));
        $this->actingAs(felgenAdmin(), 'admin')->get('/admin/felgen')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('wheels.0.internalNote', $note));

        // In the shop, published: not on the product page, not in the listing.
        $this->seed(ReferenceDataSeeder::class);
        $wheel->forceFill(['status' => CatalogueStatus::Published->value])->save();
        $this->get('/felgen/'.$wheel->slug)->assertOk()->assertDontSee('Platzhalterpreise');
        $this->get('/felgen')->assertOk()->assertDontSee('Platzhalterpreise');

        // Emptied, it is gone; too long, it is refused with a sentence.
        $this->actingAs(felgenAdmin(), 'admin')->put('/admin/felgen/'.$wheel->id, [...felgePayload($wheel), 'internal_note' => str_repeat('x', 501)])
            ->assertSessionHasErrors(['internal_note' => 'Die interne Notiz darf höchstens 500 Zeichen lang sein.']);
        $this->actingAs(felgenAdmin(), 'admin')->put('/admin/felgen/'.$wheel->id, [...felgePayload($wheel), 'internal_note' => ''])->assertSessionHasNoErrors();

        expect($wheel->refresh()->internal_note)->toBeNull();
    });

    it('changes prices and adds a size, and a second save creates nothing twice', function (): void {
        $wheel = felgeWith();
        $payload = felgePayload($wheel);
        $payload['configs'][0]['price'] = '199,00';
        $payload['configs'][] = [...$payload['configs'][0], 'id' => null, 'et' => '45', 'sku' => 'TEST-NEU-45'];

        $this->actingAs(felgenAdmin(), 'admin')->put('/admin/felgen/'.$wheel->id, $payload)->assertSessionHasNoErrors();
        $this->actingAs(felgenAdmin(), 'admin')->put('/admin/felgen/'.$wheel->id, felgePayload($wheel))->assertSessionHasNoErrors();

        expect($wheel->configs()->count())->toBe(2)
            ->and($wheel->configs()->orderBy('et_mm')->value('price_cents'))->toBe(18_900);
    });

    it('keeps the measurements of a size an approval names, but lets its price change', function (): void {
        $wheel = felgeWith();
        $size = $wheel->configs()->firstOrFail();
        Fitment::factory()->create(['wheel_config_id' => $size->id]);

        $payload = felgePayload($wheel);
        $payload['configs'][0]['et'] = '40';

        $this->actingAs(felgenAdmin(), 'admin')->put('/admin/felgen/'.$wheel->id, $payload)
            ->assertSessionHasErrors(['configs.0.width' => 'Diese Größe steht in einem Gutachten. Ihre Maße und ihre Ausführung bleiben, wie sie sind – leg für andere Maße eine neue Größe an.']);

        $payload['configs'][0]['et'] = (string) $size->et_mm;
        $payload['configs'][0]['price'] = '249,00';
        $this->actingAs(felgenAdmin(), 'admin')->put('/admin/felgen/'.$wheel->id, $payload)->assertSessionHasNoErrors();

        expect($size->refresh()->price_cents)->toBe(24_900)->and($size->et_mm)->not->toBe(40);
    });

    it('takes a size out and puts the same size back in one save, and swaps two SKUs (KATALOG-02)', function (): void {
        $wheel = felgeWith([[18.0, 8.0, 35], [19.0, 8.5, 40]]);
        $payload = felgePayload($wheel);
        [$first, $second] = $payload['configs'];

        // The first row removed and entered again as new, the SKUs of the two swapped.
        $payload['configs'] = [
            [...$first, 'id' => null, 'sku' => $second['sku']],
            [...$second, 'sku' => $first['sku']],
        ];

        $this->actingAs(felgenAdmin(), 'admin')->put('/admin/felgen/'.$wheel->id, $payload)->assertSessionHasNoErrors();

        expect($wheel->configs()->count())->toBe(2)
            ->and($wheel->configs()->where('diameter_in', 19)->value('sku'))->toBe($first['sku'])
            ->and($wheel->configs()->where('diameter_in', 18)->value('sku'))->toBe($second['sku']);
    });

    it('will not remove a size an approval names', function (): void {
        $wheel = felgeWith([[18.0, 8.0, 35], [19.0, 8.5, 40]]);
        $named = $wheel->configs()->orderBy('diameter_in')->firstOrFail();
        Fitment::factory()->create(['wheel_config_id' => $named->id]);

        $payload = felgePayload($wheel);
        $payload['configs'] = array_values(array_filter($payload['configs'], fn (array $c): bool => $c['id'] !== $named->id));

        $this->actingAs(felgenAdmin(), 'admin')->put('/admin/felgen/'.$wheel->id, $payload)->assertSessionHasErrors('configs');

        expect(WheelConfig::query()->whereKey($named->id)->exists())->toBeTrue();
    });
});

describe('into the shop', function (): void {
    it('publishes a model the Freigabe-Check lets through, and records it', function (): void {
        $wheel = felgeWith();

        $this->actingAs(felgenAdmin(), 'admin')->post("/admin/felgen/{$wheel->id}/veroeffentlichen")
            ->assertSessionHas('toast', 'Veröffentlicht. Die Felge ist jetzt im Shop.');

        expect($wheel->refresh()->status)->toBe(CatalogueStatus::Published)
            ->and(AuditLog::query()->where('description', 'wheel.published')->exists())->toBeTrue();

        $this->actingAs(felgenAdmin(), 'admin')->post("/admin/felgen/{$wheel->id}/zurueckziehen");
        expect($wheel->refresh()->status)->toBe(CatalogueStatus::Draft);
    });

    it('stops a model without sizes, and says why', function (): void {
        $wheel = felgeWith([]);

        $this->actingAs(felgenAdmin(), 'admin')->post("/admin/felgen/{$wheel->id}/veroeffentlichen")
            ->assertSessionHasErrors(['publish' => 'Noch nicht veröffentlichbar: Es gibt noch keine Größe. Leg mindestens eine an.']);

        expect($wheel->refresh()->status)->toBe(CatalogueStatus::Draft);
    });

    it('never publishes a demo model, whoever asks', function (): void {
        $wheel = felgeWith(model: ['is_demo' => true]);

        $this->actingAs(felgenAdmin(), 'admin')->post("/admin/felgen/{$wheel->id}/veroeffentlichen")->assertForbidden();

        expect($wheel->refresh()->status)->toBe(CatalogueStatus::Draft);
    });

    it('asks for the right to publish, and for archiving the right to delete (R-11)', function (): void {
        $wheel = felgeWith();
        $role = (int) DB::table('roles')->where('name', 'catalogue-manager')->value('id');
        DB::table('role_permissions')->where('role_id', $role)->where('module', 'catalogue')->whereIn('action', ['publish', 'delete'])->update(['allowed' => false]);

        $this->actingAs(felgenAdmin('catalogue-manager'), 'admin')->post("/admin/felgen/{$wheel->id}/veroeffentlichen")->assertForbidden();
        $this->actingAs(felgenAdmin('catalogue-manager'), 'admin')->post("/admin/felgen/{$wheel->id}/archivieren")->assertForbidden();

        $this->actingAs(felgenAdmin(), 'admin')->post("/admin/felgen/{$wheel->id}/archivieren");
        expect($wheel->refresh()->status)->toBe(CatalogueStatus::Archived);

        $this->actingAs(felgenAdmin(), 'admin')->post("/admin/felgen/{$wheel->id}/wiederherstellen");
        expect($wheel->refresh()->status)->toBe(CatalogueStatus::Draft);
    });

    it('publishes a selection, and names the demo model it left out', function (): void {
        $real = felgeWith();
        $demo = felgeWith([[20.0, 9.0, 30]], ['name' => 'Demomodell', 'is_demo' => true]);

        $this->actingAs(felgenAdmin(), 'admin')->post('/admin/felgen/sammelaktion', ['action' => 'publish', 'ids' => [$real->id, $demo->id]])
            ->assertSessionHas('toast', fn (string $toast): bool => str_starts_with($toast, 'Eine Felge veröffentlicht. Nicht veröffentlicht: ') && str_contains($toast, 'Demomodell (Demodaten)'));

        expect($real->refresh()->status)->toBe(CatalogueStatus::Published)
            ->and($demo->refresh()->status)->toBe(CatalogueStatus::Draft);
    });

    it('leaves an archived Felge out of a bulk step: out of the archive is its own step', function (): void {
        $archived = felgeWith(model: ['status' => CatalogueStatus::Archived->value, 'name' => 'Altes Modell']);

        $this->actingAs(felgenAdmin(), 'admin')->post('/admin/felgen/sammelaktion', ['action' => 'publish', 'ids' => [$archived->id]])
            ->assertSessionHas('toast', fn (string $toast): bool => str_contains($toast, 'Altes Modell (archiviert)'));

        expect($archived->refresh()->status)->toBe(CatalogueStatus::Archived);
    });

    it('lists what the Freigabe-Check found on the form', function (): void {
        $wheel = felgeWith(model: ['is_demo' => true]);

        $this->actingAs(felgenAdmin(), 'admin')->get('/admin/felgen/'.$wheel->id)
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Felgen/Edit')
                ->where('admin.breadcrumbs.2.label', $wheel->brand->name.' Testmodell')
                ->where('brands', fn ($brands) => collect($brands)->contains('value', $wheel->brand_id))
                ->where('check.blockers', [WheelModelPolicy::DEMO_REFUSED])
                ->where('check.hints', fn ($hints) => collect($hints)->contains(fn (string $h): bool => str_starts_with($h, 'Freigaben noch nicht hinterlegt')))
                ->where('configs.0.locked', false)
                ->where('configs.0.price', '189,00'));
    });
});

describe('a photograph', function (): void {
    it('is stored with the sentence a screen reader hears, and the manifest the shop reads', function (): void {
        Storage::fake('media_products');
        $wheel = felgeWith();
        $finish = $wheel->finishes()->firstOrFail();

        $this->actingAs(felgenAdmin(), 'admin')->post("/admin/felgen/{$wheel->id}/ausfuehrungen/{$finish->id}/foto", [
            'image' => UploadedFile::fake()->image('felge.jpg', 1200, 1200),
            'alt' => 'Testmodell in Graphit matt, Ansicht von vorn',
        ])->assertSessionHasNoErrors()->assertSessionHas('toast', 'Foto gespeichert.');

        $manifest = $finish->refresh()->image_manifest;

        expect($manifest['kind'])->toBe('photo')
            // On the site's own disk: root-relative, whatever host name the page is opened under.
            ->and($manifest['base'])->toStartWith('/')->not->toContain('://')
            ->and($manifest['widths'])->toBe([1200])
            ->and($manifest['formats'])->toBe([])
            ->and($finish->image_alt_de)->toBe('Testmodell in Graphit matt, Ansicht von vorn');
        Storage::disk('media_products')->assertExists($manifest['path']);
        expect($manifest['path'])->toEndWith('-1200.jpg');
    });

    it('is refused without alt text', function (): void {
        Storage::fake('media_products');
        $wheel = felgeWith();
        $finish = $wheel->finishes()->firstOrFail();

        $this->actingAs(felgenAdmin(), 'admin')->post("/admin/felgen/{$wheel->id}/ausfuehrungen/{$finish->id}/foto", [
            'image' => UploadedFile::fake()->image('felge.jpg', 600, 600),
        ])->assertSessionHasErrors('alt');

        expect($finish->refresh()->image_manifest)->toBeNull();
    });

    it('is refused for a finish of another model', function (): void {
        Storage::fake('media_products');
        $wheel = felgeWith();
        $other = felgeWith([[20.0, 9.0, 30]], ['name' => 'Anderes']);

        $this->actingAs(felgenAdmin(), 'admin')->post("/admin/felgen/{$wheel->id}/ausfuehrungen/{$other->finishes()->value('id')}/foto", [
            'image' => UploadedFile::fake()->image('felge.jpg', 600, 600),
            'alt' => 'Ein Foto der anderen Felge',
        ])->assertForbidden();
    });
});

/**
 * @param  list<string>  $alts
 * @return list<int> the photos' ids, in the order uploaded
 */
function photographed(WheelModel $wheel, WheelFinish $finish, array $alts): array
{
    foreach ($alts as $i => $alt) {
        test()->actingAs(felgenAdmin(), 'admin')->post("/admin/felgen/{$wheel->id}/ausfuehrungen/{$finish->id}/foto", [
            'image' => UploadedFile::fake()->image("felge-{$i}.jpg", 800 + $i, 800 + $i),
            'alt' => $alt,
        ])->assertSessionHasNoErrors();
    }

    return WheelFinishImage::query()->where('wheel_finish_id', $finish->id)->orderBy('position')->pluck('id')->map(fn ($id): int => (int) $id)->all();
}

describe('several photographs of one colour (COMPLIANCE row 23)', function (): void {
    it('keeps every photo in order, the first as the cover and the others as the product page’s views', function (): void {
        Storage::fake('media_products');
        $wheel = felgeWith();
        $finish = $wheel->finishes()->firstOrFail();

        photographed($wheel, $finish, ['Testmodell in Graphit matt, Ansicht von vorn', 'Testmodell in Graphit matt, schräg von der Seite']);
        $manifest = $finish->refresh()->image_manifest;

        expect($manifest['alt'])->toBe('Testmodell in Graphit matt, Ansicht von vorn')
            ->and($manifest['views'])->toHaveCount(1)
            ->and($manifest['views'][0]['alt'])->toBe('Testmodell in Graphit matt, schräg von der Seite')
            ->and($manifest['views'][0]['width'])->toBe(801)
            ->and($finish->image_alt_de)->toBe('Testmodell in Graphit matt, Ansicht von vorn');

        $this->actingAs(felgenAdmin(), 'admin')->get('/admin/felgen/'.$wheel->id)
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('finishes.0.photos.1.alt', 'Testmodell in Graphit matt, schräg von der Seite')
                ->where('options.maxPhotos', 12));
    });

    it('reorders them, and the new first photo becomes the cover', function (): void {
        Storage::fake('media_products');
        $wheel = felgeWith();
        $finish = $wheel->finishes()->firstOrFail();
        [$front, $side] = photographed($wheel, $finish, ['Testmodell, Ansicht von vorn', 'Testmodell, Ansicht von der Seite']);

        $this->actingAs(felgenAdmin(), 'admin')->put("/admin/felgen/{$wheel->id}/ausfuehrungen/{$finish->id}/fotos/reihenfolge", ['ids' => [$side, $front]])
            ->assertSessionHasNoErrors()->assertSessionHas('toast', 'Reihenfolge gespeichert. Das erste Foto ist das Titelbild im Shop.');

        expect($finish->refresh()->image_manifest['alt'])->toBe('Testmodell, Ansicht von der Seite')
            ->and($finish->image_manifest['views'][0]['alt'])->toBe('Testmodell, Ansicht von vorn')
            ->and(AuditLog::query()->where('description', 'wheel.images_reordered')->exists())->toBeTrue();

        // A page that has not seen every photo reorders nothing.
        $this->actingAs(felgenAdmin(), 'admin')->put("/admin/felgen/{$wheel->id}/ausfuehrungen/{$finish->id}/fotos/reihenfolge", ['ids' => [$front]])
            ->assertSessionHasErrors(['ids' => FinishImages::STALE]);
        expect($finish->refresh()->image_manifest['alt'])->toBe('Testmodell, Ansicht von der Seite');
    });

    it('describes one anew and takes one off, and with the last one gone the shop draws the outline again', function (): void {
        Storage::fake('media_products');
        $wheel = felgeWith();
        $finish = $wheel->finishes()->firstOrFail();
        [$front, $side] = photographed($wheel, $finish, ['Testmodell, Ansicht von vorn', 'Testmodell, Ansicht von der Seite']);

        $this->actingAs(felgenAdmin(), 'admin')->put("/admin/felgen/{$wheel->id}/ausfuehrungen/{$finish->id}/fotos/{$side}", ['alt' => 'kurz'])
            ->assertSessionHasErrors('alt');
        $this->actingAs(felgenAdmin(), 'admin')->put("/admin/felgen/{$wheel->id}/ausfuehrungen/{$finish->id}/fotos/{$side}", ['alt' => 'Testmodell, seitlich mit Speichenbild'])
            ->assertSessionHasNoErrors();
        expect($finish->refresh()->image_manifest['views'][0]['alt'])->toBe('Testmodell, seitlich mit Speichenbild');

        $this->actingAs(felgenAdmin(), 'admin')->delete("/admin/felgen/{$wheel->id}/ausfuehrungen/{$finish->id}/fotos/{$front}")
            ->assertSessionHas('toast', 'Foto entfernt.');
        expect($finish->refresh()->image_manifest['alt'])->toBe('Testmodell, seitlich mit Speichenbild')
            ->and($finish->image_manifest)->not->toHaveKey('views');

        $this->actingAs(felgenAdmin(), 'admin')->delete("/admin/felgen/{$wheel->id}/ausfuehrungen/{$finish->id}/fotos/{$side}")
            ->assertSessionHas('toast', 'Foto entfernt. Der Shop zeigt wieder die Umrisszeichnung.');
        expect($finish->refresh()->image_manifest)->toBeNull()
            ->and($finish->image_alt_de)->toBeNull();
    });

    it('takes no thirteenth photo, and never a photo of another colour through this one', function (): void {
        Storage::fake('media_products');
        $wheel = felgeWith();
        $finish = $wheel->finishes()->firstOrFail();
        $ids = photographed($wheel, $finish, array_map(fn (int $i): string => "Testmodell, Ansicht Nummer {$i}", range(1, FinishImages::MAX_PER_FINISH)));

        $this->actingAs(felgenAdmin(), 'admin')->post("/admin/felgen/{$wheel->id}/ausfuehrungen/{$finish->id}/foto", [
            'image' => UploadedFile::fake()->image('felge.jpg', 600, 600),
            'alt' => 'Testmodell, noch eine Ansicht',
        ])->assertSessionHasErrors(['image' => FinishImages::FULL]);
        expect(count(Storage::disk('media_products')->allFiles()))->toBe(FinishImages::MAX_PER_FINISH);

        $other = WheelFinish::factory()->create(['wheel_model_id' => $wheel->id]);
        $this->actingAs(felgenAdmin(), 'admin')->delete("/admin/felgen/{$wheel->id}/ausfuehrungen/{$other->id}/fotos/{$ids[0]}")->assertForbidden();
        $this->actingAs(felgenAdmin(), 'admin')->put("/admin/felgen/{$wheel->id}/ausfuehrungen/{$other->id}/fotos/{$ids[0]}", ['alt' => 'Testmodell, fremdes Foto'])->assertForbidden();
    });

    it('refuses every change to who may only read the catalogue (R-11)', function (): void {
        Storage::fake('media_products');
        $wheel = felgeWith();
        $finish = $wheel->finishes()->firstOrFail();
        [$id] = photographed($wheel, $finish, ['Testmodell, Ansicht von vorn']);
        $reader = felgenAdmin('order-manager');

        $this->actingAs($reader, 'admin')->put("/admin/felgen/{$wheel->id}/ausfuehrungen/{$finish->id}/fotos/reihenfolge", ['ids' => [$id]])->assertForbidden();
        $this->actingAs($reader, 'admin')->put("/admin/felgen/{$wheel->id}/ausfuehrungen/{$finish->id}/fotos/{$id}", ['alt' => 'Testmodell, neu beschrieben'])->assertForbidden();
        $this->actingAs($reader, 'admin')->delete("/admin/felgen/{$wheel->id}/ausfuehrungen/{$finish->id}/fotos/{$id}")->assertForbidden();

        expect(WheelFinishImage::query()->count())->toBe(1);
    });
});
