<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Brand;
use App\Models\WheelModel;
use App\Services\Admin\Catalogue\BrandLogoStore;
use App\Support\BrandLogos;
use App\Support\Security\SvgSanitizer;
use Database\Seeders\AccessSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

/*
 * Katalog › Marken (the Borbet golden record needs its brand with a logo): brands created and changed
 * here, a logo uploaded as SVG or as PNG / WebP with transparency — read from the bytes, an SVG reduced to
 * drawing — and refused in a sentence otherwise; nothing that still carries a product is removed (R-11).
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    Storage::fake('public');
});

function markenAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** A 2 × 1 PNG, with or without an alpha channel. */
function markenPng(bool $alpha): string
{
    $image = imagecreatetruecolor(2, 1);

    if ($alpha) {
        imagesavealpha($image, true);
        imagefill($image, 0, 0, imagecolorallocatealpha($image, 0, 0, 0, 127));
    }

    ob_start();
    imagepng($image);

    return (string) ob_get_clean();
}

it('lists every brand with its logo and what it carries', function (): void {
    $brand = Brand::factory()->create(['name' => 'Borbet', 'slug' => 'borbet', 'is_wheel_brand' => true]);
    WheelModel::factory()->create(['brand_id' => $brand->id]);

    $this->actingAs(markenAdmin(), 'admin')->get('/admin/marken')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Marken/Index')
            ->where('brands', fn ($brands): bool => collect($brands)->contains(fn ($b): bool => $b['name'] === 'Borbet' && $b['wheels'] === 1 && $b['logo'] === null))
            ->where('can.create', true));
});

it('creates and renames a brand, and refuses a name another brand has', function (): void {
    $admin = markenAdmin();

    $this->actingAs($admin, 'admin')->post('/admin/marken', ['name' => ' Borbet ', 'isWheelBrand' => true, 'sortOrder' => 3])
        ->assertSessionHasNoErrors()->assertSessionHas('toast', 'Gespeichert.');

    $brand = Brand::query()->where('slug', 'borbet')->sole();

    expect($brand->name)->toBe('Borbet')->and($brand->is_wheel_brand)->toBeTrue()->and($brand->sort_order)->toBe(3);

    $this->actingAs($admin, 'admin')->put('/admin/marken/'.$brand->id, ['name' => 'BORBET', 'isWheelBrand' => true, 'sortOrder' => 1])->assertSessionHasNoErrors();
    expect($brand->fresh()?->name)->toBe('BORBET');

    Brand::factory()->create(['name' => 'OZ Racing', 'slug' => 'oz-racing']);
    $this->actingAs($admin, 'admin')->post('/admin/marken', ['name' => 'OZ Racing', 'isWheelBrand' => true, 'sortOrder' => 0])
        ->assertSessionHasErrors(['name' => 'Diese Marke gibt es schon.']);

    expect(AuditLog::query()->whereIn('description', ['brand.created', 'brand.updated'])->count())->toBe(2);
});

it('takes an SVG logo reduced to drawing, and the brand wall can draw it', function (): void {
    $brand = Brand::factory()->create(['name' => 'Borbet', 'slug' => 'borbet']);
    $svg = '<?xml version="1.0"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'
        .'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50" onload="alert(1)"><script>alert(2)</script>'
        .'<style>path{fill:red}</style><a href="https://example.com"><path d="M0 0h200v50H0z" style="fill:red" onclick="x()"/></a>'
        .'<rect width="10" height="10" fill="url(https://example.com/x.svg#a)"/><path d="M0 0h10v10H0z"/></svg>';

    $this->actingAs(markenAdmin(), 'admin')
        ->post('/admin/marken/'.$brand->id.'/logo', ['logo' => UploadedFile::fake()->createWithContent('borbet.svg', $svg)])
        ->assertSessionHasNoErrors()->assertSessionHas('toast', 'Logo gespeichert. Die Markenwand zeigt es ab jetzt.');

    $path = (string) $brand->fresh()?->logo_path;
    $stored = Storage::disk('public')->get($path);

    expect($path)->toStartWith('brands/borbet-')->toEndWith('.svg')
        ->and($stored)->not->toContain('script')->not->toContain('onload')->not->toContain('onclick')
        ->not->toContain('<style')->not->toContain('style=')->not->toContain('example.com')->not->toContain('DOCTYPE')
        ->and($stored)->toContain('viewBox="0 0 200 50"')->toContain('<path d="M0 0h10v10H0z"/>')
        ->and(BrandLogos::resolve('borbet', $path))->toMatchArray(['aspect' => 4.0]);
});

it('takes a PNG with transparency and refuses an opaque one and a file that is no image', function (): void {
    $brand = Brand::factory()->create(['name' => 'Borbet', 'slug' => 'borbet']);
    $admin = markenAdmin();

    $this->actingAs($admin, 'admin')
        ->post('/admin/marken/'.$brand->id.'/logo', ['logo' => UploadedFile::fake()->createWithContent('logo.png', markenPng(false))])
        ->assertSessionHasErrors(['logo' => BrandLogoStore::OPAQUE]);
    expect($brand->fresh()?->logo_path)->toBeNull()->and(Storage::disk('public')->allFiles('brands'))->toBe([]);

    // A PDF renamed to .png is judged by its bytes.
    $this->actingAs($admin, 'admin')
        ->post('/admin/marken/'.$brand->id.'/logo', ['logo' => UploadedFile::fake()->createWithContent('logo.png', "%PDF-1.4\n")])
        ->assertSessionHasErrors(['logo' => BrandLogoStore::NOT_A_LOGO]);

    $this->actingAs($admin, 'admin')
        ->post('/admin/marken/'.$brand->id.'/logo', ['logo' => UploadedFile::fake()->createWithContent('logo.png', markenPng(true))])
        ->assertSessionHasNoErrors();
    expect((string) $brand->fresh()?->logo_path)->toEndWith('.png');
});

it('replaces and removes a logo, and its old file goes with it', function (): void {
    $brand = Brand::factory()->create(['name' => 'Borbet', 'slug' => 'borbet']);
    $admin = markenAdmin();
    $first = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><path d="M0 0h100v50H0z"/></svg>';
    $second = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 50"><path d="M0 0h300v50H0z"/></svg>';

    $this->actingAs($admin, 'admin')->post('/admin/marken/'.$brand->id.'/logo', ['logo' => UploadedFile::fake()->createWithContent('a.svg', $first)]);
    $old = (string) $brand->fresh()?->logo_path;
    $this->actingAs($admin, 'admin')->post('/admin/marken/'.$brand->id.'/logo', ['logo' => UploadedFile::fake()->createWithContent('b.svg', $second)]);

    expect(Storage::disk('public')->exists($old))->toBeFalse()->and(Storage::disk('public')->allFiles('brands'))->toHaveCount(1);

    $this->actingAs($admin, 'admin')->delete('/admin/marken/'.$brand->id.'/logo')->assertSessionHas('toast', 'Logo entfernt. Die Markenwand zeigt den Namen.');
    expect($brand->fresh()?->logo_path)->toBeNull()->and(Storage::disk('public')->allFiles('brands'))->toBe([]);
});

it('never removes a brand that still carries a wheel, and removes one that carries nothing', function (): void {
    $used = Brand::factory()->create(['name' => 'Borbet', 'slug' => 'borbet']);
    WheelModel::factory()->create(['brand_id' => $used->id]);
    $unused = Brand::factory()->create(['name' => 'Leer', 'slug' => 'leer']);
    $admin = markenAdmin();

    $this->actingAs($admin, 'admin')->delete('/admin/marken/'.$used->id)->assertForbidden();
    $this->actingAs($admin, 'admin')->delete('/admin/marken/'.$unused->id)->assertSessionHas('toast', 'Marke entfernt.');

    expect(Brand::query()->whereKey($used->id)->exists())->toBeTrue()->and(Brand::query()->whereKey($unused->id)->exists())->toBeFalse();
});

it('refuses every write to who may only read the catalogue (R-11)', function (): void {
    $brand = Brand::factory()->create(['name' => 'Borbet', 'slug' => 'borbet']);
    $reader = markenAdmin('order-manager');

    $this->actingAs($reader, 'admin')->get('/admin/marken')->assertOk();
    $this->actingAs($reader, 'admin')->post('/admin/marken', ['name' => 'Neu', 'isWheelBrand' => true, 'sortOrder' => 0])->assertForbidden();
    $this->actingAs($reader, 'admin')->put('/admin/marken/'.$brand->id, ['name' => 'X', 'isWheelBrand' => true, 'sortOrder' => 0])->assertForbidden();
    $this->actingAs($reader, 'admin')->post('/admin/marken/'.$brand->id.'/logo', ['logo' => UploadedFile::fake()->createWithContent('a.svg', '<svg/>')])->assertForbidden();
});

it('refuses an SVG with an entity or an internal subset, and one with nothing to draw', function (): void {
    expect(SvgSanitizer::clean('<!DOCTYPE svg [<!ENTITY x "y">]><svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1z"/></svg>'))->toBeNull()
        ->and(SvgSanitizer::clean('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))->toBeNull()
        ->and(SvgSanitizer::clean('<html><body/></html>'))->toBeNull();
});
