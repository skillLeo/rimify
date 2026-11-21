<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\GutachtenController;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\ApprovalDocumentFile;
use App\Models\Order;
use App\Models\OrderLineFitment;
use App\Models\WheelModel;
use App\Services\Storage\StorageSettings;
use App\Services\Storefront\Basket;
use App\Support\CatalogueVersion;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * The deep check of 21.11.2026 (1.3, D-494): a purchase freezes which PDFs the customer was shown — label and hash — only
 * where the paper has more than its own; adding or hiding one later changes no order, and the paper's own hash stays. A file
 * an order may name has no way to be deleted. An oversize PDF is refused in German at the upload.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, AccessSeeder::class]);
    config([
        'rimify.review.enabled' => true,
        'rimify.payments.driver' => 'sandbox',
        'rimify.shipping.cost_cents' => 0,
        'rimify.shipping.free_from_cents' => null,
        'rimify.shipping.delivery_time' => '3–5 Werktage',
        'media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false],
    ]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake(GutachtenController::DISK);
    $this->orders = [];
    $this->fx = KomplettradFixture::permitted();
    $this->fx->config->forceFill(['stock_qty' => 40])->save();
    // A real wheel: a demo one is never sold (the Kasse's own rule, D-239).
    WheelModel::query()->whereKey($this->fx->config->wheel_model_id)->update(['is_demo' => false]);
    Storage::disk(GutachtenController::DISK)->put((string) $this->fx->document->pdf_key, "%PDF-1.4\n% own\n");
});

function snapshotAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

/** A sandbox purchase of four rims of the fixture's size: the order line's frozen answer. @return array<string, mixed> */
function frozenPurchase(object $test): array
{
    $basket = [Basket::SESSION_KEY => ['wheel:'.$test->fx->config->id => ['kind' => 'WHEEL', 'wheelConfigId' => $test->fx->config->id, 'tyreVariantId' => null, 'quantity' => 4]]];
    $before = Order::query()->count();
    // Each purchase from a fresh session: the Kasse answers a second submit of one basket with the order it already wrote.
    $test->flushSession();
    $response = $test->withCookies($test->fx->cookies())->withSession($basket)->from('/kasse')
        ->post('/kasse', ['email' => 'test@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße', 'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true, 'shipping' => 'standard']);
    $response->assertSessionHasNoErrors();
    expect(Order::query()->count())->toBe($before + 1);
    $order = Order::query()->latest('id')->firstOrFail();
    $test->orders[] = $order->id;
    $frozen = OrderLineFitment::query()->whereIn('order_line_id', $order->lines()->pluck('id'))->firstOrFail();

    return is_array($frozen->verdict) ? $frozen->verdict : json_decode((string) $frozen->verdict, true);
}

it('freezes the PDFs a purchase was shown — label and hash, only where there are several — and no later change reaches it', function (): void {
    /** @var ApprovalDocument $document */
    $document = $this->fx->document;
    $ownHash = $document->pdf_sha256;

    // One PDF: the frozen answer names the paper and its hash, no list.
    $first = frozenPurchase($this);
    expect($first['document'] ?? [])->not->toHaveKey('files')
        ->and($first['document']['pdfSha256'] ?? null)->toBe($ownHash);

    // A Nachtrag added to the released paper: the next purchase freezes both, each with its hash.
    $key = 'pending/'.Str::lower((string) Str::ulid()).'.pdf';
    Storage::disk('docs_private')->put($key, "%PDF-1.4\n% Nachtrag 1\n");
    $this->actingAs(snapshotAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/pdfs", ['upload_key' => $key, 'label' => 'Nachtrag 1'])->assertSessionHasNoErrors();
    $added = ApprovalDocumentFile::query()->where('approval_document_id', $document->id)->where('is_main', false)->sole();

    $second = frozenPurchase($this);
    $files = $second['document']['files'] ?? [];

    expect(array_column($files, 'label'))->toBe(['Gutachten', 'Nachtrag 1'])
        ->and(array_column($files, 'sha256'))->toContain($added->sha256)
        // The paper itself is as it was released: its own hash, its revision, its status.
        ->and($document->refresh()->pdf_sha256)->toBe($ownHash)
        ->and($document->status->value)->toBe('published');

    // Hidden again: the next purchase names the paper alone; the two earlier orders keep what they were sold with.
    $this->actingAs(snapshotAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/pdfs/{$added->id}/sichtbar", ['visible' => false])->assertSessionHasNoErrors();
    $third = frozenPurchase($this);
    $frozenOf = function (int $orderId): array {
        $row = OrderLineFitment::query()->whereIn('order_line_id', Order::query()->findOrFail($orderId)->lines()->pluck('id'))->firstOrFail();

        return is_array($row->verdict) ? $row->verdict : json_decode((string) $row->verdict, true);
    };

    expect($third['document'] ?? [])->not->toHaveKey('files')
        ->and($this->orders)->toHaveCount(3)
        ->and($frozenOf($this->orders[0])['document'] ?? [])->not->toHaveKey('files')
        ->and(array_column($frozenOf($this->orders[1])['document']['files'] ?? [], 'label'))->toBe(['Gutachten', 'Nachtrag 1']);
});

it('has no way to delete a paper\'s PDF: add, describe, show or hide and reorder, nothing else', function (): void {
    $routes = collect(Route::getRoutes()->getRoutes())->filter(static fn ($r): bool => str_contains($r->uri(), 'gutachten/{document}/pdfs'));

    expect($routes->flatMap(static fn ($r): array => $r->methods())->unique()->sort()->values()->all())->toBe(['POST', 'PUT'])
        ->and($routes->map(static fn ($r): string => (string) $r->getName())->sort()->values()->all())
        ->toBe(['admin.gutachten.pdfs.order', 'admin.gutachten.pdfs.store', 'admin.gutachten.pdfs.update', 'admin.gutachten.pdfs.visible']);
});

it('refuses a PDF above the limit at the upload, in German, and keeps none of it', function (): void {
    config(['media.upload.pdf_max_mb' => 1]);
    $presign = $this->actingAs(snapshotAdmin(), 'admin')->postJson('/admin/uploads/pdf')->assertOk()->json();
    $big = UploadedFile::fake()->create('gross.pdf', 2 * 1024, 'application/pdf');

    $this->actingAs(snapshotAdmin(), 'admin')->post((string) $presign['url'], ['file' => $big], ['Accept' => 'application/json'])
        ->assertStatus(422)->assertJsonPath('errors.file.0', 'Die Datei ist größer als 1 MB.');

    expect(Storage::disk('docs_private')->exists((string) $presign['key']))->toBeFalse();
});

// D-500: a PDF added, described, hidden or moved changes what the answer links to, so the catalogue's version moves with it —
// the shop's caches, every page's ETag and a page brought back by Back see the new list, never a „304“ of the old one.
it('moves the catalogue version when a PDF is added, hidden or reordered', function (): void {
    $document = $this->fx->document;
    $key = 'pending/'.Str::lower((string) Str::ulid()).'.pdf';
    Storage::disk('docs_private')->put($key, "%PDF-1.4\n% Anlage\n");

    $before = CatalogueVersion::current();
    $this->actingAs(snapshotAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/pdfs", ['upload_key' => $key, 'label' => 'Anlage'])->assertSessionHasNoErrors();
    $added = CatalogueVersion::current();
    $file = ApprovalDocumentFile::query()->where('approval_document_id', $document->id)->where('is_main', false)->sole();
    $this->actingAs(snapshotAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/pdfs/{$file->id}/sichtbar", ['visible' => false])->assertSessionHasNoErrors();
    $hidden = CatalogueVersion::current();

    expect($added)->not->toBe($before)
        ->and($hidden)->not->toBe($added);
});
