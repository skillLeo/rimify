<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Enums\DocumentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/**
 * Verkauf › Bestellungen › one order (the review release §4.4): every wheel line shows the verdict as
 * the customer was shown it at purchase, restored from its frozen snapshot (R-12) — and says when the
 * Gutachten it was sold against has been replaced since, without recomputing anything.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
});

function detailAdmin(string $role = 'order-manager'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** An order with one wheel line and the verdict the shop gave for it, frozen as at checkout. */
function soldWithSnapshot(): array
{
    $vehicle = Vehicle::factory()->create(['build_from' => '2019-01-01', 'build_to' => null]);
    $model = WheelModel::factory()->create(['is_demo' => false]);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $config = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 18.0, 'width_in' => 8.0, 'et_mm' => 35]);
    $document = ApprovalDocument::factory()->abe()->create(['kba_number' => '53810', 'issuer' => 'Kraftfahrt-Bundesamt']);
    $fitment = Fitment::factory()->create(['approval_document_id' => $document->id, 'vehicle_id' => $vehicle->id, 'wheel_config_id' => $config->id, 'source_page' => 6]);
    FitmentTyreSize::factory()->create(['fitment_id' => $fitment->id, 'width_mm' => 225, 'aspect' => 40, 'diameter_in' => 18.0]);
    DocumentCondition::factory()->kind(ConditionKind::Karosseriearbeit, 'Bördeln der Radläufe erforderlich.')->create(['approval_document_id' => $document->id, 'code' => 'K1']);
    DB::table('fitment_conditions')->insert(['fitment_id' => $fitment->id, 'code' => 'K1']);

    $verdict = app(FitmentResolver::class)->resolve($vehicle->id, $config->id);
    $order = Order::factory()->create();
    $line = OrderLine::factory()->create(['order_id' => $order->id, 'wheel_config_id' => $config->id, 'label' => 'Testfelge 8J × 18 ET 35']);

    OrderLineFitment::create([
        'order_line_id' => $line->id,
        'vehicle_id' => $vehicle->id,
        'wheel_config_id' => $config->id,
        'fitment_id' => $fitment->id,
        'approval_document_id' => $document->id,
        'document_revision' => $document->revision,
        'verdict' => $verdict->toArray(),
        'verdict_status' => $verdict->status->value,
        'requires_entry' => $verdict->requiresEntry,
        'pdf_sha256' => $document->pdf_sha256,
        'engine_version' => '1',
        'computed_at' => now(),
    ]);

    return [$order, $document];
}

it('shows each wheel line with the verdict as it was shown at purchase', function (): void {
    [$order] = soldWithSnapshot();

    $this->actingAs(detailAdmin(), 'admin')->get('/admin/bestellungen/'.$order->id)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Bestellungen/Show')
            ->where('order.number', $order->order_number)
            ->where('admin.breadcrumbs.2.label', $order->order_number)
            ->where('lines.0.snapshot.readable', true)
            ->where('lines.0.snapshot.status', 'CONDITIONAL')
            ->where('lines.0.snapshot.document', 'ABE 53810')
            ->where('lines.0.snapshot.sourcePage', 6)
            ->where('lines.0.snapshot.conditions', fn ($c) => collect($c)->contains('Bördeln der Radläufe erforderlich.'))
            ->where('lines.0.snapshot.documentToday', null));
});

it('says when the Gutachten was replaced since, and keeps the snapshot as it was', function (): void {
    [$order, $document] = soldWithSnapshot();
    $document->forceFill(['status' => DocumentStatus::Superseded->value])->save();

    $this->actingAs(detailAdmin(), 'admin')->get('/admin/bestellungen/'.$order->id)
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('lines.0.snapshot.status', 'CONDITIONAL')
            ->where('lines.0.snapshot.documentToday', 'Diese Fassung wurde inzwischen durch eine neuere ersetzt.'));
});

it('says a snapshot it cannot read is unreadable, and invents nothing around it', function (): void {
    $order = Order::factory()->create();
    $line = OrderLine::factory()->create(['order_id' => $order->id]);
    OrderLineFitment::create([
        'order_line_id' => $line->id, 'vehicle_id' => 1, 'wheel_config_id' => 1, 'fitment_id' => 1,
        'approval_document_id' => 999, 'document_revision' => 1,
        'verdict' => ['status' => 'CONDITIONAL'], 'verdict_status' => 'CONDITIONAL',
        'requires_entry' => false, 'engine_version' => '1', 'computed_at' => now(),
    ]);

    $this->actingAs(detailAdmin(), 'admin')->get('/admin/bestellungen/'.$order->id)
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('lines.0.snapshot.readable', false)
            ->missing('lines.0.snapshot.conditions')
            ->where('lines.0.snapshot.documentToday', 'Das Dokument ist nicht mehr auffindbar.'));
});

it('is refused to a role without the orders right (R-11)', function (): void {
    $order = Order::factory()->create();

    $this->actingAs(detailAdmin('content-editor'), 'admin')->get('/admin/bestellungen/'.$order->id)->assertForbidden();
});
