<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TpmsDefaultPriceRequest;
use App\Http\Requests\Admin\TpmsSensorPriceRequest;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\TpmsSensorPrice;
use App\Services\Commerce\KomplettradSettings;
use App\Services\Storefront\VehicleTree;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * RDKS-Sensorpreise je Marke — what one tyre-pressure sensor costs for one car make, per sensor
 * (docs/specs/komplettrad.md §6.3, D-030).
 *
 * A make without a row is a make whose price nobody has confirmed: the checkout says so instead of
 * charging a number. Every mutation is authorised by the Policy, runs inside one transaction and
 * leaves an audit entry; a price change never touches an existing order, whose lines are frozen at
 * purchase (§6.6).
 */
class RdksPreiseController extends Controller
{
    public const SAVED_TOAST = 'Gespeichert.';

    public const DELETED_TOAST = 'Gelöscht.';

    public function __construct(private readonly KomplettradSettings $settings) {}

    public function index(Request $request, VehicleTree $tree): Response
    {
        $this->authorize('viewAny', TpmsSensorPrice::class);

        $rows = [];

        foreach (TpmsSensorPrice::query()->orderBy('make_label_de')->orderBy('id')->get() as $price) {
            $rows[] = self::row($price);
        }

        // The makes actually present in `vehicles`, for the datalist. Free text stays allowed: the
        // client's brand range is not decided, and a make RIMIFY does not sell yet must be enterable.
        $makes = [];

        foreach ($tree->makes() as $make) {
            $makes[] = $make['make'];
        }

        $default = $this->settings->tpmsDefaultCents();

        return Inertia::render('Admin/Rdks/Index', [
            'prices' => $rows,
            'makes' => $makes,
            /*
             * What every make without a row above is charged (§13, D-030). The client's example was
             * 15 € as the default with 50 € entered for Porsche: the rows are the exceptions, this
             * is the rule. Empty means there is no rule, and then only the makes listed above can
             * have sensors at all.
             */
            'default' => [
                'cents' => $default,
                'typed' => $default === null ? '' : GermanFormat::money($default),
            ],
            'can' => self::can(self::admin($request)),
        ]);
    }

    /**
     * Saves the default sensor price. Clearing it is a legitimate save: the checkout then offers
     * sensors only for the makes with their own row, and tells everyone else why it cannot.
     */
    public function updateDefaultPrice(TpmsDefaultPriceRequest $request): RedirectResponse
    {
        $cents = $request->priceCents();
        $admin = $request->admin();

        DB::transaction(function () use ($cents, $admin): void {
            $before = $this->settings->tpmsDefaultCents();

            $this->settings->setTpmsDefaultCents($cents);

            self::auditSetting($admin, 'tpms_default_price.updated', [
                'old_cents' => $before,
                'cents' => $cents,
            ]);
        });

        return back()->with('toast', self::SAVED_TOAST);
    }

    public function store(TpmsSensorPriceRequest $request): RedirectResponse
    {
        $attributes = $request->priceAttributes();
        $admin = $request->admin();

        DB::transaction(function () use ($attributes, $admin): void {
            // A deleted make is restored and updated rather than inserted: the unique key spans
            // trashed rows, and old order lines keep pointing at the price they were sold with.
            $price = TpmsSensorPrice::withTrashed()->where('make_key', $attributes['make_key'])->first();

            if ($price === null) {
                $price = new TpmsSensorPrice;
            } elseif ($price->trashed()) {
                $price->restore();
            }

            $price->fill($attributes)->save();

            self::audit($admin, $price, 'tpms_price.created', [
                'make_key' => $price->make_key,
                'price_cents' => $price->price_cents,
            ]);
        });

        return back()->with('toast', self::SAVED_TOAST);
    }

    public function update(TpmsSensorPriceRequest $request, TpmsSensorPrice $price): RedirectResponse
    {
        $attributes = $request->priceAttributes();
        $admin = $request->admin();

        DB::transaction(function () use ($attributes, $admin, $price): void {
            $before = $price->price_cents;

            $price->fill($attributes)->save();

            self::audit($admin, $price, 'tpms_price.updated', [
                'make_key' => $price->make_key,
                'old' => ['price_cents' => $before],
                'new' => ['price_cents' => $price->price_cents],
                'attributes' => $price->getChanges(),
            ]);
        });

        return back()->with('toast', self::SAVED_TOAST);
    }

    public function destroy(Request $request, TpmsSensorPrice $price): RedirectResponse
    {
        $this->authorize('delete', $price);

        $admin = self::admin($request);

        DB::transaction(function () use ($admin, $price): void {
            $price->delete();

            self::audit($admin, $price, 'tpms_price.deleted', [
                'make_key' => $price->make_key,
            ]);
        });

        return back()->with('toast', self::DELETED_TOAST);
    }

    /** @return array<string, mixed> */
    private static function row(TpmsSensorPrice $price): array
    {
        return [
            'id' => (int) $price->getKey(),
            'makeKey' => $price->make_key,
            'makeLabelDe' => $price->make_label_de,
            'priceCents' => $price->price_cents,
            'price' => GermanFormat::money($price->price_cents, $price->currency),
            'active' => $price->active,
        ];
    }

    /**
     * What the page may offer. Read from the matrix directly rather than through the Gate, so a
     * read-only admin opening the list does not write a `permission.denied` row for every button
     * the page decided not to draw.
     *
     * @return array{create: bool, update: bool, delete: bool}
     */
    private static function can(AdminUser $admin): array
    {
        return [
            'create' => $admin->may(PermissionModule::Catalogue, PermissionAction::Create),
            'update' => $admin->may(PermissionModule::Catalogue, PermissionAction::Edit),
            'delete' => $admin->may(PermissionModule::Catalogue, PermissionAction::Delete),
        ];
    }

    private static function admin(Request $request): AdminUser
    {
        $user = $request->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    /**
     * One append-only entry per mutation (§6.6). The actor's e-mail and address are kept on the row
     * itself so the entry stays readable after the account is removed.
     *
     * @param  array<string, mixed>  $properties
     */
    private static function audit(AdminUser $admin, TpmsSensorPrice $price, string $event, array $properties): void
    {
        activity('admin')
            ->causedBy($admin)
            ->performedOn($price)
            ->withProperties($properties)
            ->tap(static function (AuditLog $entry) use ($admin): void {
                $entry->forceFill([
                    'actor_email' => $admin->email,
                    'ip_address' => request()->ip(),
                ]);
            })
            ->log($event);
    }

    /**
     * The same append-only entry without a subject: the default price is a shop-wide figure with no
     * row of its own, and an entry that named one would be a lie.
     *
     * @param  array<string, mixed>  $properties
     */
    private static function auditSetting(AdminUser $admin, string $event, array $properties): void
    {
        activity('admin')
            ->causedBy($admin)
            ->withProperties($properties)
            ->tap(static function (AuditLog $entry) use ($admin): void {
                $entry->forceFill([
                    'actor_email' => $admin->email,
                    'ip_address' => request()->ip(),
                ]);
            })
            ->log($event);
    }
}
