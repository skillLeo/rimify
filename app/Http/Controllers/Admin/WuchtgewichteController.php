<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BalanceWeightColourRequest;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\BalanceWeightColour;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Wuchtgewichte-Farben — the colours a customer can choose for the balance weights of a
 * Komplettrad, and what each costs per wheel (docs/specs/komplettrad.md §6.3).
 *
 * Every mutation is authorised by the Policy (through the Form Request, or directly for a delete),
 * runs inside one transaction and leaves an audit entry. Prices are formatted here, once, by
 * GermanFormat (R-10) and shipped beside their raw cents. Nothing here is ever re-read for a placed
 * order: `order_lines.unit_price_cents` and `label` are frozen at purchase (§6.6).
 */
class WuchtgewichteController extends Controller
{
    public const SAVED_TOAST = 'Gespeichert.';

    public const DELETED_TOAST = 'Gelöscht.';

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', BalanceWeightColour::class);

        $rows = [];

        foreach (BalanceWeightColour::query()->orderBy('sort_order')->orderBy('id')->get() as $colour) {
            $rows[] = self::row($colour);
        }

        return Inertia::render('Admin/Wuchtgewichte/Index', [
            'colours' => $rows,
            'can' => self::can(self::admin($request)),
        ]);
    }

    public function store(BalanceWeightColourRequest $request): RedirectResponse
    {
        $attributes = $request->colourAttributes();
        $admin = $request->admin();

        DB::transaction(function () use ($attributes, $admin): void {
            /*
             * A deleted colour with this slug is restored and updated rather than inserted: the
             * unique key spans trashed rows, and the order lines that reference the old id keep
             * pointing at the colour they were sold with (§2.1, §6.3).
             */
            $colour = BalanceWeightColour::withTrashed()->where('slug', $attributes['slug'])->first();

            if ($colour === null) {
                $colour = new BalanceWeightColour;
            } elseif ($colour->trashed()) {
                $colour->restore();
            }

            $colour->fill($attributes)->save();

            if ($attributes['is_default']) {
                $colour->makeDefault();
            }

            self::audit($admin, $colour, 'weight_colour.created', [
                'id' => (int) $colour->getKey(),
                'name_de' => $colour->name_de,
                'surcharge_cents' => $colour->surcharge_cents,
            ]);
        });

        return back()->with('toast', self::SAVED_TOAST);
    }

    public function update(BalanceWeightColourRequest $request, BalanceWeightColour $colour): RedirectResponse
    {
        $attributes = $request->colourAttributes();
        $admin = $request->admin();

        DB::transaction(function () use ($attributes, $admin, $colour): void {
            $before = $colour->getOriginal();

            $colour->fill($attributes)->save();

            $changes = $colour->getChanges();

            if ($attributes['is_default']) {
                $colour->makeDefault();
            }

            self::audit($admin, $colour, 'weight_colour.updated', [
                'id' => (int) $colour->getKey(),
                'old' => array_intersect_key($before, $changes),
                'attributes' => $changes,
            ]);
        });

        return back()->with('toast', self::SAVED_TOAST);
    }

    public function destroy(Request $request, BalanceWeightColour $colour): RedirectResponse
    {
        $this->authorize('delete', $colour);

        $admin = self::admin($request);

        DB::transaction(function () use ($admin, $colour): void {
            $wasDefault = $colour->is_default;

            // The flag never travels into the trash: a later restore must not bring back a second
            // default beside the one that was promoted meanwhile.
            $colour->forceFill(['is_default' => false])->save();
            $colour->delete();

            if ($wasDefault) {
                /*
                 * The next active colour by sort order inherits the default. When none is left,
                 * nothing is promoted and the storefront correctly refuses Kompletträder rather
                 * than inventing a colour (CLAUDE.md §2).
                 */
                BalanceWeightColour::query()->active()->orderBy('sort_order')->orderBy('id')->first()?->makeDefault();
            }

            self::audit($admin, $colour, 'weight_colour.deleted', [
                'id' => (int) $colour->getKey(),
                'name_de' => $colour->name_de,
            ]);
        });

        return back()->with('toast', self::DELETED_TOAST);
    }

    /** @return array<string, mixed> */
    private static function row(BalanceWeightColour $colour): array
    {
        return [
            'id' => (int) $colour->getKey(),
            'nameDe' => $colour->name_de,
            'slug' => $colour->slug,
            'swatchHex' => $colour->swatch_hex,
            'surchargeCents' => $colour->surcharge_cents,
            'surcharge' => GermanFormat::money($colour->surcharge_cents, $colour->currency),
            'isDefault' => $colour->is_default,
            'active' => $colour->active,
            'sortOrder' => $colour->sort_order,
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
    private static function audit(AdminUser $admin, BalanceWeightColour $colour, string $event, array $properties): void
    {
        activity('admin')
            ->causedBy($admin)
            ->performedOn($colour)
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
