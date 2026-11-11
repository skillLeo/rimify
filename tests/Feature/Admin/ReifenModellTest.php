<?php

declare(strict_types=1);

use App\Http\Requests\Admin\TyreVariantRequest;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Brand;
use App\Models\TyreModel;
use App\Models\TyreModelImage;
use App\Models\TyreVariant;
use App\Services\Admin\Catalogue\TyreModels;
use App\Support\EditStamp;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

/*
 * A tyre model above its sizes (the Gutachten rework §9, D-407): brand, name and season once, with up to four photographs, by the
 * rim page's own upload; below it each size with its price (one supplier, D-448). Every write asks TyreModelPolicy (R-11) and leaves one Protokoll
 * entry. The sizes keep those three for everything that reads a tyre, so the engine and the shop read what they always read.
 */

beforeEach(function (): void {
    $this->seed([AccessSeeder::class, ReferenceDataSeeder::class]);
    Storage::fake('media_products');
});

function modellAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** A model of two sizes, as the list finds it. */
function modellOf(string $name = 'Grip 7', ?Brand $brand = null): TyreModel
{
    $brand ??= Brand::factory()->named('Prüfreifen')->create(['is_wheel_brand' => false]);
    TyreVariant::factory()->for($brand)->size(225, 45, 18.0)->create(['name' => $name, 'season' => 'sommer']);
    TyreVariant::factory()->for($brand)->size(245, 40, 19.0)->create(['name' => $name, 'season' => 'sommer']);
    app(TyreModels::class)->sync();

    return TyreModel::query()->where('name', $name)->sole();
}

it('starts a size for a model left without one from its brand, name and season', function (): void {
    $model = modellOf();
    TyreVariant::query()->where('name', $model->name)->delete();

    $this->actingAs(modellAdmin(), 'admin')->get('/admin/reifen/neu?modell='.$model->id)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('template.brandId', (int) $model->brand_id)
            ->where('template.name', $model->name)
            ->where('template.season', $model->season));
});

function modellStamp(mixed $test, TyreModel $model): string
{
    return $test->actingAs(modellAdmin(), 'admin')->get('/admin/reifen/modell/'.$model->id)->assertOk()->viewData('page')['props']['stamp'];
}

function photoFile(string $name = 'seite.jpg'): UploadedFile
{
    return UploadedFile::fake()->image($name, 1200, 1200);
}

it('makes one model of a tyre’s sizes, whichever road they came by, and leaves the sizes’ own columns as they were', function (): void {
    $brand = Brand::factory()->named('Prüfreifen')->create(['is_wheel_brand' => false]);
    $a = TyreVariant::factory()->for($brand)->size(225, 45, 18.0)->create(['name' => 'Grip 7', 'season' => 'sommer']);
    TyreVariant::factory()->for($brand)->size(245, 40, 19.0)->create(['name' => 'Grip 7', 'season' => 'sommer']);
    // Another season is another model, as another name is.
    TyreVariant::factory()->for($brand)->size(225, 45, 18.0)->create(['name' => 'Grip 7', 'season' => 'winter']);

    $this->actingAs(modellAdmin(), 'admin')->get('/admin/reifen')->assertOk();
    $this->actingAs(modellAdmin(), 'admin')->get('/admin/reifen')->assertOk();

    expect(TyreModel::query()->orderBy('season')->pluck('season')->all())->toBe(['sommer', 'winter'])
        ->and(TyreModel::query()->where('season', 'sommer')->sole()->sizes()->count())->toBe(2)
        ->and($a->fresh()->name)->toBe('Grip 7');
});

it('shows a model’s photographs, facts and sizes, and no supplier: there is one (D-448)', function (): void {
    $model = modellOf();
    TyreVariant::query()->where('width_mm', 225)->update(['supplier' => 'Lieferant A']);

    $this->actingAs(modellAdmin(), 'admin')->get('/admin/reifen/modell/'.$model->id)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Reifen/Modell')
            ->where('model.title', 'Prüfreifen Grip 7')
            ->where('model.demo', false)
            ->where('maxPhotos', 4)
            ->has('photos', 0)
            ->has('sizes', 2)
            ->missing('sizes.0.supplier')
            ->missing('sizes.1.supplier')
            ->where('admin.breadcrumbs.2.label', 'Prüfreifen Grip 7'));
});

it('changes brand, name and season for every size at once, in one Protokoll entry; a tyre stays offered', function (): void {
    $model = modellOf();
    $other = Brand::factory()->named('Andere Marke')->create(['is_wheel_brand' => false]);

    $this->actingAs(modellAdmin(), 'admin')
        ->put('/admin/reifen/modell/'.$model->id, ['brand_id' => $other->id, 'brand_new' => '', 'name' => 'Grip 8', 'season' => 'ganzjahres'], [EditStamp::HEADER => modellStamp($this, $model)])
        ->assertSessionHasNoErrors();

    expect(TyreVariant::query()->where('name', 'Grip 8')->where('season', 'ganzjahres')->where('brand_id', $other->id)->count())->toBe(2)
        ->and(TyreVariant::query()->where('name', 'Grip 7')->count())->toBe(0)
        ->and($model->fresh()->name)->toBe('Grip 8')
        ->and(TyreModel::query()->count())->toBe(1)
        ->and(AuditLog::query()->where('description', 'tyre.model_updated')->count())->toBe(1);
});

it('refuses to make two models one by a rename, and leaves both as they were', function (): void {
    $brand = Brand::factory()->named('Prüfreifen')->create(['is_wheel_brand' => false]);
    $first = modellOf('Grip 7', $brand);
    modellOf('Grip 8', $brand);

    $this->actingAs(modellAdmin(), 'admin')
        ->put('/admin/reifen/modell/'.$first->id, ['brand_id' => $brand->id, 'brand_new' => '', 'name' => 'Grip 8', 'season' => 'sommer'], [EditStamp::HEADER => modellStamp($this, $first)])
        ->assertSessionHasErrors(['name' => TyreModels::TAKEN]);

    expect(TyreVariant::query()->where('name', 'Grip 7')->count())->toBe(2)
        ->and($first->fresh()->name)->toBe('Grip 7');
});

it('refuses a change saved from a page opened before the last one (F-25)', function (): void {
    $model = modellOf();
    $stamp = modellStamp($this, $model);

    $this->actingAs(modellAdmin(), 'admin')
        ->put('/admin/reifen/modell/'.$model->id, ['brand_id' => $model->brand_id, 'brand_new' => '', 'name' => 'Grip 8', 'season' => 'sommer'], [EditStamp::HEADER => $stamp])
        ->assertSessionHasNoErrors();

    $this->actingAs(modellAdmin(), 'admin')
        ->put('/admin/reifen/modell/'.$model->id, ['brand_id' => $model->brand_id, 'brand_new' => '', 'name' => 'Grip 9', 'season' => 'sommer'], [EditStamp::HEADER => $stamp])
        ->assertSessionHasErrors('_stamp');

    expect($model->fresh()->name)->toBe('Grip 8');
});

it('takes up to four photographs by the rim page’s upload, each with its sentence, in the Protokoll', function (): void {
    $model = modellOf();
    $post = fn (string $name, string $alt = 'Prüfreifen Grip 7, Seitenansicht') => $this->actingAs(modellAdmin(), 'admin')
        ->post('/admin/reifen/modell/'.$model->id.'/foto', ['image' => photoFile($name), 'alt' => $alt]);

    foreach (['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg'] as $name) {
        $post($name)->assertSessionHasNoErrors();
    }

    $post('e.jpg')->assertSessionHasErrors(['image' => TyreModels::FULL]);

    $post('f.jpg', 'kurz');

    expect(TyreModelImage::query()->where('tyre_model_id', $model->id)->pluck('position')->all())->toBe([1, 2, 3, 4])
        ->and(TyreModelImage::query()->first()->manifest['kind'])->toBe('photo')
        ->and(AuditLog::query()->where('description', 'tyre.image_uploaded')->count())->toBe(4);
});

it('refuses a photo without its sentence, and a file that is no picture', function (): void {
    $model = modellOf();

    $this->actingAs(modellAdmin(), 'admin')->post('/admin/reifen/modell/'.$model->id.'/foto', ['image' => photoFile(), 'alt' => 'kurz'])
        ->assertSessionHasErrors('alt');
    $this->actingAs(modellAdmin(), 'admin')->post('/admin/reifen/modell/'.$model->id.'/foto', ['image' => UploadedFile::fake()->create('datei.pdf', 10, 'application/pdf'), 'alt' => 'Prüfreifen Grip 7, Seitenansicht'])
        ->assertSessionHasErrors('image');

    expect(TyreModelImage::query()->count())->toBe(0);
});

it('reorders, relabels and removes photographs, renumbering what stays; a stale page reorders nothing', function (): void {
    $model = modellOf();

    foreach (['a.jpg', 'b.jpg', 'c.jpg'] as $name) {
        $this->actingAs(modellAdmin(), 'admin')->post('/admin/reifen/modell/'.$model->id.'/foto', ['image' => photoFile($name), 'alt' => 'Prüfreifen Grip 7, Ansicht '.$name])->assertSessionHasNoErrors();
    }

    [$a, $b, $c] = TyreModelImage::query()->orderBy('position')->pluck('id')->all();
    $order = fn (): array => TyreModelImage::query()->orderBy('position')->pluck('id')->all();
    $stamp = $this->actingAs(modellAdmin(), 'admin')->get('/admin/reifen/modell/'.$model->id)->viewData('page')['props']['photoOrderStamp'];

    $this->actingAs(modellAdmin(), 'admin')->put('/admin/reifen/modell/'.$model->id.'/fotos/reihenfolge', ['ids' => [$c, $a, $b]], [EditStamp::HEADER => $stamp])->assertSessionHasNoErrors();
    expect($order())->toBe([$c, $a, $b]);

    // The stamp from before that move.
    $this->actingAs(modellAdmin(), 'admin')->put('/admin/reifen/modell/'.$model->id.'/fotos/reihenfolge', ['ids' => [$a, $b, $c]], [EditStamp::HEADER => $stamp])->assertSessionHasErrors('_stamp');
    expect($order())->toBe([$c, $a, $b]);

    $this->actingAs(modellAdmin(), 'admin')->put('/admin/reifen/modell/'.$model->id.'/fotos/'.$a, ['alt' => 'Prüfreifen Grip 7, Lauffläche'])->assertSessionHasNoErrors();
    expect(TyreModelImage::query()->find($a)->alt_de)->toBe('Prüfreifen Grip 7, Lauffläche');

    $this->actingAs(modellAdmin(), 'admin')->delete('/admin/reifen/modell/'.$model->id.'/fotos/'.$c)->assertSessionHasNoErrors();

    expect($order())->toBe([$a, $b])
        ->and(TyreModelImage::query()->orderBy('position')->pluck('position')->all())->toBe([1, 2])
        ->and(AuditLog::query()->whereIn('description', ['tyre.images_reordered', 'tyre.image_relabelled', 'tyre.image_removed'])->count())->toBe(3);
});

it('never takes another model’s photograph through this model’s address', function (): void {
    $brand = Brand::factory()->named('Prüfreifen')->create(['is_wheel_brand' => false]);
    $first = modellOf('Grip 7', $brand);
    $second = modellOf('Grip 8', $brand);
    $image = TyreModelImage::query()->create(['tyre_model_id' => $second->id, 'position' => 1, 'manifest' => ['kind' => 'photo'], 'alt_de' => 'Prüfreifen Grip 8, Seite']);

    $this->actingAs(modellAdmin(), 'admin')->delete('/admin/reifen/modell/'.$first->id.'/fotos/'.$image->id, ['_x' => '1'])->assertNotFound();

    expect(TyreModelImage::query()->count())->toBe(1);
});

it('gives the shop a size’s photographs by its model, first the cover, and none of another model’s', function (): void {
    $brand = Brand::factory()->named('Prüfreifen')->create(['is_wheel_brand' => false]);
    $first = modellOf('Grip 7', $brand);
    modellOf('Grip 8', $brand);
    TyreModelImage::query()->create(['tyre_model_id' => $first->id, 'position' => 2, 'manifest' => ['name' => 'zwei'], 'alt_de' => 'Prüfreifen Grip 7, Lauffläche']);
    TyreModelImage::query()->create(['tyre_model_id' => $first->id, 'position' => 1, 'manifest' => ['name' => 'eins'], 'alt_de' => 'Prüfreifen Grip 7, Seite']);

    $own = TyreVariant::query()->where('name', 'Grip 7')->value('id');
    $other = TyreVariant::query()->where('name', 'Grip 8')->value('id');
    $photos = app(TyreModels::class)->photosOf([(int) $own, (int) $other]);

    expect(array_keys($photos))->toBe([(int) $own])
        ->and(array_column($photos[(int) $own], 'name'))->toBe(['eins', 'zwei'])
        ->and($photos[(int) $own][0]['alt'])->toBe('Prüfreifen Grip 7, Seite');
});

it('asks no supplier, keeps one already on record as it is, hidden, and holds one price per size line (D-448)', function (): void {
    $payload = [
        'brand_id' => null, 'brand_new' => 'Prüfreifen', 'name' => 'Grip 7', 'season' => 'sommer', 'width_mm' => '225', 'aspect' => '45', 'diameter_in' => '18',
        'load_index' => '95', 'speed_symbol' => 'Y', 'price' => '129,00', 'available' => true,
    ];

    // A supplier sent all the same is not taken: there is one, and the form has no field for it.
    $this->actingAs(modellAdmin(), 'admin')->post('/admin/reifen', [...$payload, 'supplier' => str_repeat('x', 121)])->assertSessionHasNoErrors();

    $tyre = TyreVariant::query()->sole();

    expect($tyre->supplier)->toBeNull();

    // One written before the client's answer stays on record, untouched by a save, and is shown nowhere.
    $tyre->forceFill(['supplier' => 'Lieferant A'])->save();

    // The same tyre twice is refused as before: one price per size line.
    $this->actingAs(modellAdmin(), 'admin')->post('/admin/reifen', [...$payload, 'brand_new' => 'prüfreifen', 'price' => '119,00'])
        ->assertSessionHasErrors(['name' => TyreVariantRequest::DUPLICATE]);

    $stamp = $this->actingAs(modellAdmin(), 'admin')->get('/admin/reifen/'.$tyre->id)->assertInertia(fn (AssertableInertia $page) => $page
        ->missing('tyre.supplier')
        ->where('modelHref', '/admin/reifen/modell/'.TyreModel::query()->sole()->id))->viewData('page')['props']['stamp'];

    $this->actingAs(modellAdmin(), 'admin')
        ->put('/admin/reifen/'.$tyre->id, [...$payload, 'brand_id' => $tyre->brand_id, 'brand_new' => '', 'price' => '139,00', 'supplier' => 'Lieferant B'], [EditStamp::HEADER => $stamp])
        ->assertSessionHasNoErrors();

    expect($tyre->fresh()->supplier)->toBe('Lieferant A')
        ->and($tyre->fresh()->price_cents)->toBe(13_900)
        ->and(AuditLog::query()->where('description', 'tyre.updated')->sole()->properties['changed'] ?? [])->not->toContain('supplier');
});

it('shows a demonstration model and never changes it or its photographs', function (): void {
    $brand = Brand::factory()->named('Prüfreifen')->create(['is_wheel_brand' => false]);
    TyreVariant::factory()->for($brand)->size(205, 55, 16.0)->unlabelled()->create(['name' => 'Beispiel', 'season' => 'sommer', 'is_demo' => true]);
    app(TyreModels::class)->sync();
    $model = TyreModel::query()->sole();

    $this->actingAs(modellAdmin(), 'admin')->get('/admin/reifen/modell/'.$model->id)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('model.demo', true));
    $this->actingAs(modellAdmin(), 'admin')->put('/admin/reifen/modell/'.$model->id, ['brand_id' => $brand->id, 'brand_new' => '', 'name' => 'Anders', 'season' => 'sommer'])->assertForbidden();
    $this->actingAs(modellAdmin(), 'admin')->post('/admin/reifen/modell/'.$model->id.'/foto', ['image' => photoFile(), 'alt' => 'Prüfreifen Beispiel, Seitenansicht'])->assertForbidden();

    expect($model->fresh()->name)->toBe('Beispiel');
});

it('asks the catalogue’s rights on the server for every step (R-11)', function (): void {
    $model = modellOf();
    $image = TyreModelImage::query()->create(['tyre_model_id' => $model->id, 'position' => 1, 'manifest' => ['kind' => 'photo'], 'alt_de' => 'Prüfreifen Grip 7, Seite']);
    // May see the catalogue, not change it.
    $role = (int) DB::table('roles')->where('name', 'catalogue-manager')->value('id');
    DB::table('role_permissions')->where('role_id', $role)->where('module', 'catalogue')->where('action', 'edit')->update(['allowed' => false]);
    $viewer = modellAdmin('catalogue-manager');

    $this->actingAs($viewer, 'admin')->get('/admin/reifen/modell/'.$model->id)->assertOk();

    $forbidden = function (AdminUser $user) use ($model, $image): void {
        $this->actingAs($user, 'admin')->put('/admin/reifen/modell/'.$model->id, ['brand_id' => $model->brand_id, 'name' => 'Anders', 'season' => 'sommer'])->assertForbidden();
        $this->actingAs($user, 'admin')->post('/admin/reifen/modell/'.$model->id.'/foto', ['image' => photoFile(), 'alt' => 'Prüfreifen Grip 7, Seitenansicht'])->assertForbidden();
        $this->actingAs($user, 'admin')->put('/admin/reifen/modell/'.$model->id.'/fotos/reihenfolge', ['ids' => [$image->id]])->assertForbidden();
        $this->actingAs($user, 'admin')->put('/admin/reifen/modell/'.$model->id.'/fotos/'.$image->id, ['alt' => 'Prüfreifen Grip 7, Seite neu'])->assertForbidden();
        $this->actingAs($user, 'admin')->delete('/admin/reifen/modell/'.$model->id.'/fotos/'.$image->id, ['alt' => 'Prüfreifen Grip 7, Seite neu'])->assertForbidden();
    };

    $forbidden($viewer);

    expect($model->fresh()->name)->toBe('Grip 7')->and(TyreModelImage::query()->count())->toBe(1);
});

it('shows a model to no one without the catalogue’s view right (R-11)', function (): void {
    $model = modellOf();
    $role = (int) DB::table('roles')->where('name', 'catalogue-manager')->value('id');
    DB::table('role_permissions')->where('role_id', $role)->where('module', 'catalogue')->where('action', 'view')->update(['allowed' => false]);

    $this->actingAs(modellAdmin('catalogue-manager'), 'admin')->get('/admin/reifen/modell/'.$model->id)->assertForbidden();
});
