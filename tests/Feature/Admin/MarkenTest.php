<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\MarkenController;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Brand;
use App\Models\WheelModel;
use App\Policies\BrandPolicy;
use App\Services\Admin\Catalogue\BrandLogoStore;
use App\Services\Admin\Catalogue\WheelEditor;
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
    // A wordmark-like shape: a dark bar with a gap, on a clear ground (or on nothing clear at all).
    $image = imagecreatetruecolor(40, 10);

    if ($alpha) {
        imagesavealpha($image, true);
        imagealphablending($image, false);
        imagefill($image, 0, 0, imagecolorallocatealpha($image, 0, 0, 0, 127));
    }

    $ink = imagecolorallocatealpha($image, 20, 20, 20, 0);
    imagefilledrectangle($image, 4, 3, 16, 6, $ink);
    imagefilledrectangle($image, 22, 3, 35, 6, $ink);

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
    $first = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><path d="M5 5h90v40H5z"/></svg>';
    $second = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 50"><path d="M5 5h290v40H5z"/></svg>';

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

    // Who may remove brands is told why, in the Policy's words — not that a right is missing (K2-16).
    $this->actingAs($admin, 'admin')->delete('/admin/marken/'.$used->id)->assertSessionHasErrors(['brand' => BrandPolicy::IN_USE]);
    $this->actingAs($admin, 'admin')->delete('/admin/marken/'.$unused->id)->assertSessionHas('toast', 'Marke entfernt.');

    expect(Brand::query()->whereKey($used->id)->exists())->toBeTrue()->and(Brand::query()->whereKey($unused->id)->exists())->toBeFalse();

    // A removed Felge still keeps its brand, and the list counts it, so it offers no „Entfernen“ the server refuses.
    $quiet = Brand::factory()->create(['name' => 'Still', 'slug' => 'still']);
    WheelModel::factory()->create(['brand_id' => $quiet->id])->delete();

    $this->actingAs($admin, 'admin')->get('/admin/marken')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('brands', fn ($rows): bool => collect($rows)->firstWhere('name', 'Still')['removedWheels'] === 1));
    $this->actingAs($admin, 'admin')->delete('/admin/marken/'.$quiet->id)->assertSessionHasErrors(['brand' => BrandPolicy::IN_USE]);
});

it('gives a removed brand\'s name back: rename, „Marke anlegen“ and the Felge form all take it (K2-01)', function (): void {
    $admin = markenAdmin();
    $gone = Brand::factory()->create(['name' => 'Rotiform', 'slug' => 'rotiform', 'logo_path' => 'brands/rotiform-1-abc.svg']);
    $this->actingAs($admin, 'admin')->delete('/admin/marken/'.$gone->id)->assertSessionHasNoErrors();

    // Renaming another brand to it: saved, no 500.
    $other = Brand::factory()->create(['name' => 'Andere', 'slug' => 'andere']);
    $this->actingAs($admin, 'admin')->put('/admin/marken/'.$other->id, ['name' => 'Rotiform', 'isWheelBrand' => true, 'sortOrder' => 5])->assertSessionHasNoErrors();
    expect($other->fresh()?->name)->toBe('Rotiform');

    // „Marke anlegen“ of a removed name brings that row back, and says so.
    $this->actingAs($admin, 'admin')->put('/admin/marken/'.$other->id, ['name' => 'Andere', 'isWheelBrand' => true, 'sortOrder' => 5]);
    $this->actingAs($admin, 'admin')->post('/admin/marken', ['name' => 'Rotiform', 'isWheelBrand' => true, 'sortOrder' => 0])
        ->assertSessionHasNoErrors()->assertSessionHas('toast', MarkenController::RESTORED_WITH_LOGO);
    expect(Brand::query()->where('name', 'Rotiform')->sole()->id)->toBe($gone->id)
        ->and(AuditLog::query()->where('description', 'brand.restored')->exists())->toBeTrue();

    // The Felge form's „Neue Marke anlegen“ with a removed name: the brand comes back, no sizes sentence.
    $this->actingAs($admin, 'admin')->delete('/admin/marken/'.$gone->id);
    $brand = app(WheelEditor::class)->save(null, ['brand_id' => null, 'brand_new' => 'rotiform', 'name' => 'Flow', 'type_designation' => null, 'spoke_count' => 5, 'description_de' => null, 'seo_title' => null, 'seo_description' => null], [], [], $admin)->brand;
    expect($brand?->id)->toBe($gone->id)->and($brand?->trashed())->toBeFalse();
});

it('makes a new brand in the Felge form when a live brand holds the removed one\'s address (K2-44)', function (): void {
    $admin = markenAdmin();
    $gone = Brand::factory()->create(['name' => 'Rotiform', 'slug' => 'rotiform']);
    $gone->delete();
    // Renamed with a full stop: the name differs, the address `rotiform` is the same.
    Brand::factory()->create(['name' => 'Rotiform.', 'slug' => 'rotiform']);

    $brand = app(WheelEditor::class)->save(null, ['brand_id' => null, 'brand_new' => 'Rotiform', 'name' => 'Flow', 'type_designation' => null, 'spoke_count' => 5, 'description_de' => null, 'seo_title' => null, 'seo_description' => null], [], [], $admin)->brand;

    expect($brand?->id)->not->toBe($gone->id)
        ->and($brand?->name)->toBe('Rotiform')
        ->and($brand?->slug)->not->toBe('rotiform')
        ->and(Brand::onlyTrashed()->whereKey($gone->id)->exists())->toBeTrue();
});

it('refuses a raster whose ground is opaque whatever its header says, and an SVG on a filled ground (K2-02)', function (): void {
    $brand = Brand::factory()->create(['name' => 'Borbet', 'slug' => 'borbet']);
    $admin = markenAdmin();

    // An RGBA PNG — colour type 6 — whose every pixel is opaque white with a black mark: a solid block on the wall.
    $image = imagecreatetruecolor(40, 10);
    imagesavealpha($image, true);
    imagealphablending($image, false);
    imagefill($image, 0, 0, imagecolorallocatealpha($image, 255, 255, 255, 0));
    imagefilledrectangle($image, 10, 2, 30, 7, imagecolorallocatealpha($image, 0, 0, 0, 0));
    ob_start();
    imagepng($image);
    $opaque = (string) ob_get_clean();
    expect(ord($opaque[25]))->toBe(6);

    $this->actingAs($admin, 'admin')->post('/admin/marken/'.$brand->id.'/logo', ['logo' => UploadedFile::fake()->createWithContent('logo.png', $opaque)])
        ->assertSessionHasErrors(['logo' => BrandLogoStore::OPAQUE]);

    $backdrop = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50"><rect width="200" height="50" fill="#fff"/><path d="M10 10h40v30H10z"/></svg>';
    $this->actingAs($admin, 'admin')->post('/admin/marken/'.$brand->id.'/logo', ['logo' => UploadedFile::fake()->createWithContent('logo.svg', $backdrop)])
        ->assertSessionHasErrors(['logo' => BrandLogoStore::BACKDROP]);

    expect($brand->fresh()?->logo_path)->toBeNull()->and(Storage::disk('public')->allFiles('brands'))->toBe([]);

    // A logo on a white sticker with a clear margin: the sticker would be a slab on the wall (K2-36).
    $sticker = imagecreatetruecolor(60, 20);
    imagesavealpha($sticker, true);
    imagealphablending($sticker, false);
    imagefill($sticker, 0, 0, imagecolorallocatealpha($sticker, 0, 0, 0, 127));
    imagefilledrectangle($sticker, 3, 2, 56, 17, imagecolorallocatealpha($sticker, 255, 255, 255, 0));
    imagefilledrectangle($sticker, 10, 7, 30, 12, imagecolorallocatealpha($sticker, 0, 0, 0, 0));
    ob_start();
    imagepng($sticker);
    $this->actingAs($admin, 'admin')->post('/admin/marken/'.$brand->id.'/logo', ['logo' => UploadedFile::fake()->createWithContent('sticker.png', (string) ob_get_clean())])
        ->assertSessionHasErrors(['logo' => BrandLogoStore::BACKDROP]);

    // A backdrop drawn as a path, in pixels, under a viewBox that does not start at 0 (K2-36).
    foreach ([
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50"><path d="M0 0h200v50H0z" fill="#fff"/><path d="M10 10h40v30H10z"/></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50"><rect width="200px" height="50px" fill="#fff"/><path d="M10 10h40v30H10z"/></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -5 220 60"><rect x="-10" y="-5" width="220" height="60"/><path d="M10 10h40v30H10z"/></svg>',
    ] as $svg) {
        $this->actingAs($admin, 'admin')->post('/admin/marken/'.$brand->id.'/logo', ['logo' => UploadedFile::fake()->createWithContent('logo.svg', $svg)])
            ->assertSessionHasErrors(['logo' => BrandLogoStore::BACKDROP]);
    }

    // Huge sides are refused before the picture is decoded (K2-41) — read from a PNG header alone.
    $header = "\x89PNG\r\n\x1a\n".pack('N', 13).'IHDR'.pack('NN', 16000, 16000)."\x08\x06\x00\x00\x00".pack('N', 0);
    $this->actingAs($admin, 'admin')->post('/admin/marken/'.$brand->id.'/logo', ['logo' => UploadedFile::fake()->createWithContent('huge.png', $header)])
        ->assertSessionHasErrors(['logo' => BrandLogoStore::TOO_MANY_PIXELS]);
});

it('takes an SVG saved with a byte-order mark, and names the reason for one with entities (K2-14)', function (): void {
    $brand = Brand::factory()->create(['name' => 'Borbet', 'slug' => 'borbet']);
    $admin = markenAdmin();
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50"><path d="M5 5h190v40H5z"/></svg>';

    $this->actingAs($admin, 'admin')->post('/admin/marken/'.$brand->id.'/logo', ['logo' => UploadedFile::fake()->createWithContent('bom.svg', "\xEF\xBB\xBF".$svg)])
        ->assertSessionHasNoErrors();
    // The brand's id is in the file's name: two brands never share one (K2-26).
    expect((string) $brand->fresh()?->logo_path)->toStartWith('brands/borbet-'.$brand->id.'-');

    $illustrator = '<?xml version="1.0"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "x" [<!ENTITY ns_svg "http://www.w3.org/2000/svg">]>'.$svg;
    $this->actingAs($admin, 'admin')->post('/admin/marken/'.$brand->id.'/logo', ['logo' => UploadedFile::fake()->createWithContent('ai.svg', $illustrator)])
        ->assertSessionHasErrors(['logo' => BrandLogoStore::ENTITIES]);
});

it('never stores a logo for the sample range, which never shows one (K2-25)', function (): void {
    $demo = Brand::factory()->create(['name' => 'Demo', 'slug' => BrandLogos::SAMPLE_RANGE]);

    $this->actingAs(markenAdmin(), 'admin')->post('/admin/marken/'.$demo->id.'/logo', ['logo' => UploadedFile::fake()->createWithContent('d.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 1"><path d="M0 0h1v1z"/></svg>')])
        ->assertSessionHasErrors(['logo' => BrandLogoStore::SAMPLE_RANGE]);
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
