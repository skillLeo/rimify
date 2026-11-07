<?php

declare(strict_types=1);

use App\Enums\CatalogueStatus;
use App\Enums\DocumentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Services\Storage\StorageSettings;
use Database\Seeders\GoldenRecordSeeder;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\DB;
use Tests\E2eData\IntoNamedDatabase;
use Tests\Support\Gutachten\TranscriptionEntry;

/*
 * The released Borbet papers in the development shop the e2e suite calls DEV (e2e/support.ts): ABE 55255, ABE 53841 and
 * the Nachtrag 366-0350-21-WIRD/N1, typed from their transcriptions (docs/gutachten) through the admin's own endpoints —
 * every request passes the Form Request and the Policy a person's does — and released at the release door, as
 * BorbetAcceptanceTest does; then the DB8GT2 published at the client's prices. SWEEP-01 to SWEEP-03 and EF-01 to EF-03
 * read them. On the Windows machine that shop was the team's development database, where the papers were typed by
 * hand; this puts the same papers into any machine's (D-427).
 *
 *   TEST_DB_PORT=3309 TEST_DB_DATABASE=<the development shop's database> php vendor/bin/pest tests/E2eData
 *
 * Once per database: a run that finds ABE 55255 released leaves the papers as they stand.
 */
uses(IntoNamedDatabase::class);

function borbetReleased(string $kbaNumber): bool
{
    return ApprovalDocument::query()
        ->where('kind', 'ABE')
        ->where('kba_number', $kbaNumber)
        ->where('is_demo', false)
        ->where('status', DocumentStatus::Published->value)
        ->exists();
}

it('puts the released Borbet papers and the published DB8GT2 into the development shop', function (): void {
    $database = (string) DB::connection()->getDatabaseName();

    // A suite's database is emptied by its next run, and the papers would stand in every test of that run.
    expect(str_starts_with($database, 'rimify_test'))->toBeFalse("{$database} is a test suite's database: name the development shop's");

    if (! borbetReleased('55255')) {
        // The documents disk of this run, as BorbetAcceptanceTest has it: never a bucket the database names.
        config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
        app(StorageSettings::class)->flush();
        // A person types a car a minute at most 30 times; this run types 76.
        $this->withoutMiddleware(ThrottleRequests::class);

        (new TranscriptionEntry($this, AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail()))->enterBoth();
    }

    // Priced as the client prices it (229,00 € the 18″, 269,00 € the 19″, AcceptanceSeeder), where nobody has priced a size yet;
    // a price a person entered stays.
    $model = WheelModel::query()->where('slug', GoldenRecordSeeder::SLUG)->firstOrFail();

    foreach (WheelConfig::query()->where('wheel_model_id', $model->id)->where('price_cents', 0)->get() as $config) {
        $config->update(['price_cents' => (float) $config->diameter_in < 19.0 ? 22_900 : 26_900, 'stock_qty' => 12]);
    }

    $model->update(['status' => CatalogueStatus::Published]);

    expect(borbetReleased('55255'))->toBeTrue()
        ->and(borbetReleased('53841'))->toBeTrue()
        ->and(ApprovalDocument::query()->where('report_number', '366-0350-21-WIRD/N1')->where('status', DocumentStatus::Published->value)->exists())->toBeTrue()
        ->and(Vehicle::query()->where('make', 'BMW')->where('model', 'X3')->where('type_designation', 'X83')->exists())->toBeTrue()
        ->and(Vehicle::query()->where('make', 'MINI')->where('model', 'Paceman')->where('type_designation', 'UKL-C/X')->count())->toBe(2)
        ->and(WheelConfig::query()->where('wheel_model_id', $model->id)->where('price_cents', 0)->exists())->toBeFalse();
});
