<?php

declare(strict_types=1);

use App\Enums\CatalogueStatus;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Brand;
use App\Models\CatalogueImport;
use App\Models\Fitment;
use App\Models\Setting;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Catalogue\CatalogueImporter;
use App\Support\GermanFormat;
use Database\Seeders\AccessSeeder;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;

/**
 * Katalog › Import (the review release §4.2): a supplier feed read, mapped, checked in a Probelauf,
 * applied — and taken back. Nothing is assumed about the file: its headers name its columns, its rows
 * name the brands. A known SKU changes only price, stock, EAN, KBA and weight; measurements never; a
 * demo row never; a new model is a draft.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

function importAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** A German supplier's CSV: semicolons, decimal commas, `5x112` in one column. */
function supplierCsv(array $rows, string $header = 'Artikelnummer;Hersteller;Modell;Farbe;Zoll;Breite;ET;Lochbild;Nabenbohrung;VK-Preis;Lagerbestand', string $delimiter = ';'): UploadedFile
{
    $lines = [$header, ...array_map(fn (array $r): string => implode($delimiter, $r), $rows)];
    $path = tempnam(sys_get_temp_dir(), 'rimify-feed-').'.csv';
    file_put_contents($path, implode("\r\n", $lines)."\r\n");

    return new UploadedFile($path, 'lieferant.csv', 'text/csv', null, true);
}

function feedRows(): array
{
    return [
        ['TST-18-80-35', 'Prüfmarke', 'Kontur', 'Graphit matt', '18', '8', '35', '5x112', '66,6', '189,00', '12'],
        ['TST-19-85-40', 'Prüfmarke', 'Kontur', 'Graphit matt', '19', '8,5', '40', '5x112', '66,6', '1.219,50', '0'],
    ];
}

function probelauf(UploadedFile $file, array $extra = []): CatalogueImport
{
    test()->actingAs(importAdmin(), 'admin')->post('/admin/katalog/import/probelauf', ['file' => $file] + $extra)->assertSessionHasNoErrors()->assertRedirect();

    return CatalogueImport::query()->latest('id')->firstOrFail();
}

it('opens for the importer right and is refused without it (R-11)', function (): void {
    $this->actingAs(importAdmin(), 'admin')->get('/admin/katalog/import')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Admin/Katalog/Import')->has('imports', 0)->where('can.preview', true));

    $this->actingAs(importAdmin('content-editor'), 'admin')->get('/admin/katalog/import')->assertForbidden();
    $this->actingAs(importAdmin('content-editor'), 'admin')->post('/admin/katalog/import/probelauf', ['file' => supplierCsv(feedRows())])->assertForbidden();
});

it('reads a supplier CSV in a Probelauf, maps its columns by name, and writes nothing to the catalogue', function (): void {
    $run = probelauf(supplierCsv(feedRows()));

    expect($run->status)->toBe(CatalogueImport::PREVIEWED)
        ->and($run->mapping)->toMatchArray(['sku' => 'Artikelnummer', 'marke' => 'Hersteller', 'lochkreis' => 'Lochbild', 'mittenloch' => 'Nabenbohrung', 'preis' => 'VK-Preis', 'bestand' => 'Lagerbestand'])
        ->and($run->summary)->toMatchArray(['create' => 2, 'update' => 0, 'refused' => 0, 'brands' => 1, 'models' => 1, 'finishes' => 1])
        ->and(WheelConfig::query()->count())->toBe(0)
        ->and(Brand::query()->count())->toBe(0);

    $this->actingAs(importAdmin(), 'admin')->get('/admin/katalog/import/'.$run->id)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Katalog/ImportRun')
            ->where('missing', [])
            ->has('rows', 2)
            ->where('rows.0.action', 'create')
            ->where('rows.0.label', fn (string $label): bool => str_starts_with($label, 'Prüfmarke Kontur · Graphit matt · ') && str_contains($label, GermanFormat::boltPattern(5, 112)))
            ->where('examples.Zoll', '18')
            ->where('can.apply', true));
});

it('imports the Probelauf: new models are drafts, prices read the German way, the mapping is kept', function (): void {
    $run = probelauf(supplierCsv(feedRows()));

    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$run->id}/importieren")
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Importiert. Neue Felgen sind Entwürfe, bis du sie veröffentlichst.');

    $model = WheelModel::query()->where('name', 'Kontur')->firstOrFail();
    $expensive = WheelConfig::query()->where('sku', 'TST-19-85-40')->firstOrFail();

    expect($model->status)->toBe(CatalogueStatus::Draft)
        ->and($model->is_demo)->toBeFalse()
        ->and($expensive->price_cents)->toBe(121_950)
        ->and((float) $expensive->width_in)->toBe(8.5)
        ->and($expensive->getAttribute('bolt_holes'))->toBe(5)
        ->and($run->refresh()->status)->toBe(CatalogueImport::APPLIED)
        ->and(CatalogueImporter::savedMapping(null))->toMatchArray(['sku' => 'Artikelnummer'])
        ->and(AuditLog::query()->where('description', 'catalogue.imported')->count())->toBe(1);
});

it('changes a known size’s price and stock, and shows before and after first', function (): void {
    $this->actingAs(importAdmin(), 'admin')->post('/admin/katalog/import/'.probelauf(supplierCsv(feedRows()))->id.'/importieren');

    $rows = feedRows();
    $rows[0][9] = '199,00';
    $rows[0][10] = '3';
    $run = probelauf(supplierCsv($rows));

    expect($run->summary)->toMatchArray(['create' => 0, 'update' => 1, 'unchanged' => 1])
        // Compared as sets of keys: the JSON column keeps its own key order.
        ->and(collect($run->plan)->firstWhere('action', 'update')['changes'])->toEqual([
            ['field' => 'Preis', 'from' => GermanFormat::money(18_900), 'to' => GermanFormat::money(19_900)],
            ['field' => 'Bestand', 'from' => '12', 'to' => '3'],
        ]);

    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$run->id}/importieren");

    expect(WheelConfig::query()->where('sku', 'TST-18-80-35')->value('price_cents'))->toBe(19_900);
});

it('refuses, row by row, what an import never does — and imports the rest', function (): void {
    $this->actingAs(importAdmin(), 'admin')->post('/admin/katalog/import/'.probelauf(supplierCsv(feedRows()))->id.'/importieren');

    $demo = WheelModel::factory()->draft()->create(['name' => 'Demo', 'is_demo' => true]);
    $demoFinish = WheelFinish::factory()->create(['wheel_model_id' => $demo->id]);
    WheelConfig::factory()->create(['wheel_model_id' => $demo->id, 'wheel_finish_id' => $demoFinish->id, 'sku' => 'DEMO-1']);

    $run = probelauf(supplierCsv([
        // A known SKU with another ET: measurements are never changed by an import.
        ['TST-18-80-35', 'Prüfmarke', 'Kontur', 'Graphit matt', '18', '8', '45', '5x112', '66,6', '189,00', '12'],
        ['DEMO-1', 'Prüfmarke', 'Kontur', 'Graphit matt', '17', '7,5', '35', '5x112', '66,6', '150,00', '1'],
        ['TST-BAD', 'Prüfmarke', 'Kontur', 'Graphit matt', '18', 'acht', '35', '5x112', '66,6', '49.00', '1'],
        ['TST-NEU', 'Prüfmarke', 'Kontur', 'Graphit matt', '20', '9', '30', '5x112', '66,6', '249,00', '2'],
        ['TST-NEU', 'Prüfmarke', 'Kontur', 'Graphit matt', '21', '9', '30', '5x112', '66,6', '249,00', '2'],
    ]));

    $reasons = collect($run->plan)->mapWithKeys(fn (array $e): array => [$e['line'] => $e['reasons']]);

    expect($run->summary)->toMatchArray(['create' => 1, 'refused' => 4])
        ->and($reasons[2][0])->toStartWith('Die SKU gehört zu „Prüfmarke Kontur')
        ->and($reasons[3])->toBe(['Die SKU gehört zu den Demodaten. Ein Import ändert keine Demodaten.'])
        ->and($reasons[4])->toBe(['Die Breite können wir nicht lesen (Zoll, zwischen 4 und 14).', 'Den Preis können wir nicht lesen.'])
        ->and($reasons[6])->toBe(['Die SKU steht doppelt in der Datei (zuerst in Zeile 5).']);
});

it('remembers the mapping per supplier, and one supplier’s never steers another’s file (COMPLIANCE row 25)', function (): void {
    // Borbet's file names its columns its own way; mapped by hand once and imported.
    $header = 'Nr;Fabrikat;Design;Oberfläche;D;B;Offset;PCD;Bohrung;EK;Menge';
    $first = probelauf(supplierCsv(feedRows(), $header), ['lieferant' => '  Borbet   GmbH ']);

    expect($first->supplier)->toBe('Borbet GmbH')
        ->and($first->mapping_remembered)->toBeFalse()
        ->and(CatalogueImporter::missing($first->mapping, $first->source['headers']))->not->toBe([]);

    $mapping = ['sku' => 'Nr', 'marke' => 'Fabrikat', 'modell' => 'Design', 'ausfuehrung' => 'Oberfläche', 'durchmesser' => 'D', 'breite' => 'B', 'et' => 'Offset', 'lochkreis' => 'PCD', 'mittenloch' => 'Bohrung', 'preis' => 'EK', 'bestand' => 'Menge'];
    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$first->id}/zuordnung", ['mapping' => $mapping, 'dezimal' => 'komma'])->assertSessionHasNoErrors();
    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$first->id}/importieren")->assertSessionHasNoErrors();

    // The next Borbet file — the name written another way — starts from that mapping, and says so.
    $rows = feedRows();
    $rows[0][9] = '179,00';
    $next = probelauf(supplierCsv($rows, $header), ['lieferant' => 'borbet gmbh']);

    expect($next->mapping_remembered)->toBeTrue()
        ->and($next->mapping)->toMatchArray($mapping)
        ->and($next->summary)->toMatchArray(['update' => 1, 'unchanged' => 1]);

    $this->actingAs(importAdmin(), 'admin')->get('/admin/katalog/import/'.$next->id)
        ->assertInertia(fn (AssertableInertia $page) => $page->where('run.mappingRemembered', true)->where('run.supplier', 'borbet gmbh'));

    // Re-mapped by hand, the note no longer claims the memory (K2-18).
    $changed = ['preis' => 'Menge', 'bestand' => 'EK'] + $mapping;
    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$next->id}/zuordnung", ['mapping' => $changed, 'dezimal' => 'komma']);
    expect($next->refresh()->mapping_remembered)->toBeFalse();

    // Another supplier with the same columns starts from their names alone; so does a file without a name.
    expect(probelauf(supplierCsv(feedRows(), $header), ['lieferant' => 'Lieferant B'])->mapping_remembered)->toBeFalse()
        ->and(probelauf(supplierCsv(feedRows(), $header))->mapping_remembered)->toBeFalse()
        ->and(CatalogueImporter::savedMapping('Lieferant B'))->toBeNull();

    // Suggested: only a supplier whose mapping is remembered — one that was imported, not every name typed
    // on a Probelauf (K2-20).
    $this->actingAs(importAdmin(), 'admin')->get('/admin/katalog/import')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('suppliers', ['Borbet GmbH']));

    // A name without Latin letters keeps its own key, never the unnamed files' mapping (K2-27).
    expect(CatalogueImporter::supplierKey('Ωμέγα'))->not->toBe('')->and(CatalogueImporter::supplierKey('Ωμέγα'))->not->toBe(CatalogueImporter::supplierKey('—'));
});

it('still reads the one mapping kept before suppliers were named, for a file without a name', function (): void {
    Setting::set(CatalogueImporter::MAPPING_SETTING, ['sku' => 'Nr']);

    expect(CatalogueImporter::savedMapping(null))->toBe(['sku' => 'Nr'])
        ->and(CatalogueImporter::savedMapping('Borbet'))->toBeNull();
});

it('hands out the refused lines with why, as the file had them, to who may read imports (COMPLIANCE row 25)', function (): void {
    $run = probelauf(supplierCsv([
        ['TST-OK', 'Prüfmarke', 'Kontur', 'Graphit matt', '18', '8', '35', '5x112', '66,6', '189,00', '12'],
        ['TST-BAD', 'Prüfmarke', 'Kontur', 'Graphit matt', '18', 'acht', '35', '5x112', '66,6', '=HYPERLINK("x")', '1'],
        ['TST-NEG', 'Prüfmarke', 'Kontur', 'Graphit matt', '18', 'acht', '-5', '5x112', '66,6', '189,00', '1'],
    ]));

    $this->actingAs(importAdmin(), 'admin')->get('/admin/katalog/import/'.$run->id)
        ->assertInertia(fn (AssertableInertia $page) => $page->where('run.refusedHref', '/admin/katalog/import/'.$run->id.'/abgelehnt.csv'));

    $response = $this->actingAs(importAdmin(), 'admin')->get('/admin/katalog/import/'.$run->id.'/abgelehnt.csv')->assertOk();
    $csv = $response->streamedContent();

    expect($response->headers->get('content-disposition'))->toContain('lieferant-abgelehnt.csv')
        ->and($csv)->toContain('"Zeile in der Datei";"Warum abgelehnt";Artikelnummer;Hersteller')
        ->and($csv)->toContain('3;"Die Breite können wir nicht lesen (Zoll, zwischen 4 und 14). Den Preis können wir nicht lesen.";TST-BAD')
        // A cell a spreadsheet would run stays text; a negative ET comes back as the file had it (K2-19).
        ->and($csv)->toContain("'=HYPERLINK")
        ->and($csv)->toContain(';-5;')->not->toContain("'-5")
        ->and($csv)->not->toContain('TST-OK');

    $this->actingAs(importAdmin('content-editor'), 'admin')->get('/admin/katalog/import/'.$run->id.'/abgelehnt.csv')->assertForbidden();

    // Nothing refused: no link.
    $clean = probelauf(supplierCsv(feedRows()));
    $this->actingAs(importAdmin(), 'admin')->get('/admin/katalog/import/'.$clean->id)
        ->assertInertia(fn (AssertableInertia $page) => $page->where('run.refusedHref', null));
});

it('reads a file that writes 8.5 with a point, when told so', function (): void {
    $run = probelauf(supplierCsv([['TST-P', 'Prüfmarke', 'Punkt', 'Silber', '18', '8.5', '35', '5x112', '66.6', '1189.50', '1']], 'SKU,Marke,Modell,Ausführung,Durchmesser,Breite,ET,Lochkreis,Mittenloch,Preis,Bestand', ','), ['dezimal' => 'punkt']);

    expect($run->summary['create'])->toBe(1);

    // Comma separated: the reader found the delimiter itself.
    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$run->id}/importieren");
    expect(WheelConfig::query()->where('sku', 'TST-P')->value('price_cents'))->toBe(118_950);
});

it('reads an Excel workbook, numbers and all', function (): void {
    $path = tempnam(sys_get_temp_dir(), 'rimify-xlsx-').'.xlsx';
    $writer = new XlsxWriter;
    $writer->openToFile($path);
    $writer->addRow(Row::fromValues(['SKU', 'Marke', 'Modell', 'Farbe', 'Durchmesser', 'Breite', 'ET', 'Lochzahl', 'Lochkreis', 'MLB', 'Preis']));
    $writer->addRow(Row::fromValues(['XL-1', 'Prüfmarke', 'Tabelle', 'Schwarz', 18, 8.5, -5, 5, 112, 66.6, 189.5]));
    $writer->close();

    $run = probelauf(new UploadedFile($path, 'feed.xlsx', null, null, true));

    expect($run->file_format)->toBe('xlsx')->and($run->summary['create'])->toBe(1);

    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$run->id}/importieren");
    $size = WheelConfig::query()->where('sku', 'XL-1')->firstOrFail();

    expect((float) $size->width_in)->toBe(8.5)->and($size->et_mm)->toBe(-5)->and($size->price_cents)->toBe(18_950);
});

it('asks for the missing columns before it checks a single row, and checks again on a new mapping', function (): void {
    $run = probelauf(supplierCsv(feedRows(), 'Code;Hersteller;Modell;Farbe;Zoll;Breite;ET;Lochbild;Nabenbohrung;VK-Preis;Lagerbestand'));

    expect(CatalogueImporter::missing($run->mapping, $run->source['headers']))->toBe(['SKU (Artikelnummer)'])
        ->and($run->plan)->toBe([]);

    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$run->id}/importieren")->assertSessionHasErrors('import');

    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$run->id}/zuordnung", [
        'mapping' => [...$run->mapping, 'sku' => 'Code'],
        'dezimal' => 'komma',
    ])->assertSessionHasNoErrors();

    expect($run->refresh()->summary['create'])->toBe(2);
});

it('refuses to apply a Probelauf the catalogue has moved away from', function (): void {
    $first = probelauf(supplierCsv(feedRows()));
    $second = probelauf(supplierCsv(feedRows()));

    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$first->id}/importieren")->assertSessionHasNoErrors();

    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$second->id}/importieren")
        ->assertSessionHasErrors(['import' => 'Der Katalog hat sich seit dem Probelauf geändert. Mach bitte einen neuen Probelauf, bevor du importierst.']);

    expect(WheelConfig::query()->count())->toBe(2);
});

it('takes an import back whole — and not once something was built on it', function (): void {
    $this->actingAs(importAdmin(), 'admin')->post('/admin/katalog/import/'.probelauf(supplierCsv(feedRows()))->id.'/importieren');

    $rows = feedRows();
    $rows[0][9] = '199,00';
    $rows[] = ['TST-20', 'Neumarke', 'Erstling', 'Weiß', '20', '9', '30', '5x120', '72,6', '299,00', '1'];
    $run = probelauf(supplierCsv($rows));
    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$run->id}/importieren")->assertSessionHasNoErrors();

    expect(Brand::query()->where('name', 'Neumarke')->exists())->toBeTrue();

    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$run->id}/zuruecknehmen")
        ->assertSessionHas('toast', 'Import zurückgenommen.');

    expect(WheelConfig::query()->where('sku', 'TST-18-80-35')->value('price_cents'))->toBe(18_900)
        ->and(WheelConfig::withTrashed()->where('sku', 'TST-20')->exists())->toBeFalse()
        ->and(Brand::withTrashed()->where('name', 'Neumarke')->exists())->toBeFalse()
        ->and($run->refresh()->status)->toBe(CatalogueImport::ROLLED_BACK);

    // A new import whose new size an approval now names cannot be taken back.
    $again = probelauf(supplierCsv([['TST-21', 'Prüfmarke', 'Kontur', 'Graphit matt', '21', '9', '30', '5x112', '66,6', '299,00', '1']]));
    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$again->id}/importieren");
    Fitment::factory()->create(['wheel_config_id' => WheelConfig::query()->where('sku', 'TST-21')->value('id')]);

    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$again->id}/zuruecknehmen")
        ->assertSessionHasErrors(['import' => 'Der Import lässt sich nicht mehr zurücknehmen: Für importierte Größen wurden inzwischen Freigaben eingetragen.']);
});

it('brings a removed brand of the file\'s name back, and takes it away again with the import (K2-35)', function (): void {
    $gone = Brand::factory()->create(['name' => 'Prüfmarke', 'slug' => 'pruefmarke', 'logo_path' => 'brands/pruefmarke-1-abc.svg']);
    $gone->delete();

    $run = probelauf(supplierCsv(feedRows()));
    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$run->id}/importieren")->assertSessionHasNoErrors();

    $brand = Brand::query()->where('name', 'Prüfmarke')->sole();
    expect($brand->id)->toBe($gone->id)
        ->and($brand->slug)->toBe('pruefmarke')
        ->and($brand->logo_path)->toBe('brands/pruefmarke-1-abc.svg')
        ->and(Brand::withTrashed()->where('slug', 'like', 'pruefmarke-%')->exists())->toBeFalse();

    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$run->id}/zuruecknehmen")->assertSessionHasNoErrors();

    expect(Brand::query()->where('name', 'Prüfmarke')->exists())->toBeFalse()
        ->and(Brand::onlyTrashed()->whereKey($gone->id)->exists())->toBeTrue();
});

it('names a row by the line a spreadsheet shows, blank lines included', function (): void {
    $path = tempnam(sys_get_temp_dir(), 'rimify-feed-').'.csv';
    file_put_contents($path, "SKU;Marke;Modell;Farbe;Zoll;Breite;ET;Lochbild;MLB;Preis\n\n\nTST-1;Prüfmarke;Kontur;Silber;18;acht;35;5x112;66,6;189,00\n");

    $run = probelauf(new UploadedFile($path, 'luecken.csv', 'text/csv', null, true));

    expect($run->plan[0]['line'])->toBe(4);
});

it('will not take back an import whose new sizes were changed since', function (): void {
    $run = probelauf(supplierCsv(feedRows()));
    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$run->id}/importieren");

    $this->travel(1)->minutes();
    WheelConfig::query()->where('sku', 'TST-18-80-35')->firstOrFail()->forceFill(['stock_qty' => 99])->save();

    $this->actingAs(importAdmin(), 'admin')->post("/admin/katalog/import/{$run->id}/zuruecknehmen")
        ->assertSessionHasErrors(['import' => 'Der Import lässt sich nicht mehr zurücknehmen: Importierte Größen wurden seit dem Import geändert.']);
});

it('offers a sample file with every column it reads', function (): void {
    $response = $this->actingAs(importAdmin(), 'admin')->get('/admin/katalog/import/beispiel.csv')->assertOk();
    $csv = $response->streamedContent();

    expect($csv)->toContain('SKU')->toContain('Mittenloch')->toContain('Beispielmarke');
});
