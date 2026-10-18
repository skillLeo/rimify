<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\CatalogueStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\FelgenFilterRequest;
use App\Http\Requests\Admin\WheelBulkRequest;
use App\Http\Requests\Admin\WheelFinishRequest;
use App\Http\Requests\Admin\WheelImageRequest;
use App\Http\Requests\Admin\WheelModelRequest;
use App\Http\Requests\Admin\WheelModelViewRequest;
use App\Http\Requests\Admin\WheelPhotoAltRequest;
use App\Http\Requests\Admin\WheelPhotoOrderRequest;
use App\Http\Requests\Admin\WheelStatusRequest;
use App\Models\AdminUser;
use App\Models\Brand;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelFinishImage;
use App\Models\WheelModel;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\Catalogue\FinishImages;
use App\Services\Admin\Catalogue\PublishCheck;
use App\Services\Admin\Catalogue\WheelEditor;
use App\Services\Admin\Catalogue\WheelList;
use App\Services\Admin\Lists\AdminLists;
use App\Services\Admin\Lists\ListViews;
use App\Services\Storage\ImageUpload;
use App\Services\Storage\UploadRejected;
use App\Support\GermanFormat;
use App\Support\Money;
use App\Support\WheelTitle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Katalog › Felgen — every wheel model, its finishes and sizes, and the step into the shop (the review
 * release §4.2).
 *
 * A save never publishes: the form keeps a draft; *Veröffentlichen* is its own step, behind the
 * Freigabe-Check and the right to publish. A demo model never reaches the shop (WheelModelPolicy, and
 * the table's CHECK behind it).
 */
class FelgenController extends Controller
{
    public const CREATED = 'Felge angelegt. Sie ist ein Entwurf, bis du sie veröffentlichst.';

    public const SAVED = 'Gespeichert.';

    public const IMAGE_SAVED = 'Foto gespeichert.';

    public const IMAGE_REMOVED = 'Foto entfernt. Der Shop zeigt wieder die Umrisszeichnung.';

    public const PHOTO_REMOVED = 'Foto entfernt.';

    public const PHOTOS_ORDERED = 'Reihenfolge gespeichert. Das erste Foto ist das Titelbild im Shop.';

    private const STEP_TOASTS = [
        'veroeffentlichen' => 'Veröffentlicht. Die Felge ist jetzt im Shop.',
        'zurueckziehen' => 'Zurückgezogen. Die Felge ist nicht mehr im Shop.',
        'archivieren' => 'Archiviert.',
        'wiederherstellen' => 'Wiederhergestellt. Die Felge ist wieder ein Entwurf.',
    ];

    public function __construct(private readonly WheelList $list, private readonly ListViews $views) {}

    public function index(FelgenFilterRequest $request): Response|RedirectResponse
    {
        $filters = $request->filters();
        $canonical = $request->canonical();
        $admin = $request->admin();
        $lists = $this->views->for($admin, AdminLists::FELGEN, $request->view());
        $paged = $lists['views']['active'] === null ? $canonical : [...$canonical, 'ansicht' => (string) $lists['views']['active']];

        $page = $this->list->query($filters)->paginate(WheelList::PER_PAGE, ['*'], 'seite', $request->page());

        if ($page->isEmpty() && $page->total() > 0) {
            return redirect()->to(self::url($paged, $page->lastPage()));
        }

        /** @var list<WheelModel> $models */
        $models = array_values($page->items());
        $filtered = array_diff_key($canonical, ['sort' => true, 'richtung' => true]) !== [];

        return Inertia::render('Admin/Felgen/Index', [
            'wheels' => array_map($this->list->row(...), $models),
            'filters' => [
                'q' => $canonical['q'] ?? '',
                'status' => $canonical['status'] ?? '',
                'marke' => $canonical['marke'] ?? '',
                'freigaben' => $canonical['freigaben'] ?? '',
                'demo' => $canonical['demo'] ?? '',
                'radtyp' => $canonical['radtyp'] ?? '',
                'sort' => $filters['sort'],
                'richtung' => $filters['richtung'],
            ],
            'options' => $this->list->options(),
            // The Felgen saved before the Radtypenbezeichnung was required, still without it (D-298): the backfill.
            'missingDesignation' => WheelModel::query()->where('status', '<>', CatalogueStatus::Archived->value)
                ->where(static fn ($q) => $q->whereNull('type_designation')->orWhere('type_designation', ''))->count(),
            'filtered' => $filtered,
            'totalAll' => $filtered ? WheelModel::query()->where('status', '<>', CatalogueStatus::Archived->value)->count() : $page->total(),
            'pagination' => [
                'current' => $page->currentPage(),
                'last' => $page->lastPage(),
                'total' => $page->total(),
                'prev' => $page->currentPage() > 1 ? self::url($paged, $page->currentPage() - 1) : null,
                'next' => $page->hasMorePages() ? self::url($paged, $page->currentPage() + 1) : null,
            ],
            'query' => $canonical,
            'views' => $lists['views'],
            'columns' => $lists['columns'],
            // Presentation only: every write asks WheelModelPolicy on the server (R-11).
            'can' => self::can($admin),
        ]);
    }

    public function create(WheelModelViewRequest $request): Response
    {
        return Inertia::render('Admin/Felgen/Edit', $this->props(null, $request->admin()));
    }

    public function store(WheelModelRequest $request, WheelEditor $editor): RedirectResponse
    {
        $model = $editor->save(null, $request->modelAttributes(), $request->finishes(), $request->configs(), $request->admin());

        return redirect('/admin/felgen/'.$model->id)->with('toast', self::CREATED);
    }

    public function edit(WheelModelViewRequest $request, WheelModel $model): Response
    {
        $model->loadMissing('brand');
        // On the app's request, not the Form Request: that is a copy, and the crumb is read from the original.
        request()->attributes->set(AdminNavigation::RECORD, WheelTitle::full($model));

        return Inertia::render('Admin/Felgen/Edit', $this->props($model, $request->admin()));
    }

    public function update(WheelModelRequest $request, WheelModel $model, WheelEditor $editor): RedirectResponse
    {
        $editor->save($model, $request->modelAttributes(), $request->finishes(), $request->configs(), $request->admin());

        return back()->with('toast', self::SAVED);
    }

    /** Into the shop, out of it, into the archive, or back to a draft (WheelStatusRequest names the step). */
    public function status(WheelStatusRequest $request, WheelModel $model, PublishCheck $check): RedirectResponse
    {
        $step = $request->step();

        if ($step === 'veroeffentlichen') {
            $blockers = $check->for($model)['blockers'];

            if ($blockers !== []) {
                throw ValidationException::withMessages(['publish' => 'Noch nicht veröffentlichbar: '.implode(' ', $blockers)]);
            }
        }

        $to = match ($step) {
            'veroeffentlichen' => CatalogueStatus::Published,
            'archivieren' => CatalogueStatus::Archived,
            default => CatalogueStatus::Draft,
        };

        $this->move($model, $to, $request->admin());

        return back()->with('toast', self::STEP_TOASTS[$step] ?? self::SAVED);
    }

    /**
     * The list's selection, one step for all. Each model is asked on its own: a demo model, or one the
     * Freigabe-Check stops, is left as it was and named in the answer.
     */
    public function bulk(WheelBulkRequest $request, PublishCheck $check): RedirectResponse
    {
        $admin = $request->admin();
        $action = $request->action();
        $done = 0;
        $skipped = [];

        foreach (WheelModel::query()->with('brand')->whereIn('id', $request->ids())->get() as $model) {
            $name = $model->brand->name.' '.$model->name;

            // Out of the archive is its own step (Wiederherstellen): a list's selection never skips it.
            if ($action !== 'archive' && $model->status === CatalogueStatus::Archived) {
                $skipped[] = $name.' (archiviert)';

                continue;
            }

            if ($action === 'publish') {
                if ($model->is_demo) {
                    $skipped[] = $name.' (Demodaten)';

                    continue;
                }

                $blockers = $check->for($model)['blockers'];

                if ($blockers !== []) {
                    // The commonest stop by its name (D-300); any other is in the Felge's own check.
                    $skipped[] = $name.(in_array(PublishCheck::DESIGNATION_MISSING, $blockers, true) ? ' (Radtypenbezeichnung fehlt)' : ' (Prüfung vor dem Veröffentlichen)');

                    continue;
                }
            }

            $to = match ($action) {
                'publish' => CatalogueStatus::Published,
                'archive' => CatalogueStatus::Archived,
                default => CatalogueStatus::Draft,
            };

            if ($model->status === $to) {
                continue;
            }

            $this->move($model, $to, $admin);
            $done++;
        }

        $verb = match ($action) {
            'publish' => 'veröffentlicht',
            'archive' => 'archiviert',
            default => 'zurückgezogen',
        };
        $toast = match ($done) {
            0 => 'Keine Felge ',
            1 => 'Eine Felge ',
            default => GermanFormat::integer($done).' Felgen ',
        }.$verb.'.';

        if ($skipped !== []) {
            $toast .= ' Nicht '.$verb.': '.implode(', ', $skipped).'.';
        }

        return back()->with('toast', $toast);
    }

    /** One more photograph of a finish, after the ones it has (COMPLIANCE row 23). */
    public function image(WheelImageRequest $request, WheelModel $model, WheelFinish $finish, ImageUpload $uploads, FinishImages $photos): RedirectResponse
    {
        $file = $request->file('image');

        if (! $file instanceof UploadedFile) {
            throw ValidationException::withMessages(['image' => 'Bitte wähl ein Foto aus.']);
        }

        // Before the file is stored: a thirteenth photo is not kept in the bucket either.
        if ($photos->count($finish) >= FinishImages::MAX_PER_FINISH) {
            throw ValidationException::withMessages(['image' => FinishImages::FULL]);
        }

        try {
            $stored = $uploads->store($file, 'media_products', 'wheels/'.$model->slug, true);
        } catch (UploadRejected $e) {
            throw ValidationException::withMessages(['image' => $e->getMessage()]);
        }

        $url = Storage::disk($stored['disk'])->url($stored['path']);
        $app = rtrim((string) config('app.url'), '/');

        // On the site's own disk the address is kept root-relative: the page loads it from whichever
        // name it was opened under (www or not, a staging alias), and the CSP's 'self' covers it.
        if ($app !== '' && str_starts_with($url, $app.'/')) {
            $url = substr($url, strlen($app));
        }

        $ext = pathinfo($stored['path'], PATHINFO_EXTENSION);
        $suffix = '-'.$stored['width'].'.'.$ext;

        $manifest = [
            'name' => basename($stored['path'], $suffix),
            'base' => str_ends_with($url, $suffix) ? substr($url, 0, -strlen($suffix)) : $url,
            'width' => $stored['width'],
            'height' => $stored['height'],
            'widths' => [$stored['width']],
            'fallback' => $ext,
            // One file as uploaded: no other formats to offer before it.
            'formats' => [],
            'placeholder' => 'data:image/svg+xml,'.rawurlencode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="'.($finish->hex ?? '#E4E6E8').'"/></svg>'),
            'kind' => 'photo',
            'disk' => $stored['disk'],
            'path' => $stored['path'],
        ];

        DB::transaction(function () use ($photos, $finish, $manifest, $request, $model): void {
            $photos->add($finish, $manifest, $request->alt());
            $model->touch();
            AuditTrail::record($request->admin(), 'wheel.image_uploaded', self::photoSubject($model, $finish), $model);
        });

        return back()->with('toast', self::IMAGE_SAVED);
    }

    public function removeImage(WheelFinishRequest $request, WheelModel $model, WheelFinish $finish, WheelFinishImage $image, FinishImages $photos): RedirectResponse
    {
        DB::transaction(function () use ($photos, $image, $model, $finish, $request): void {
            // The file stays in the bucket: an order confirmation or a cached page may still point at it.
            $photos->remove($image);
            $model->touch();
            AuditTrail::record($request->admin(), 'wheel.image_removed', self::photoSubject($model, $finish), $model);
        });

        return back()->with('toast', $photos->count($finish) === 0 ? self::IMAGE_REMOVED : self::PHOTO_REMOVED);
    }

    public function reorderImages(WheelPhotoOrderRequest $request, WheelModel $model, WheelFinish $finish, FinishImages $photos): RedirectResponse
    {
        DB::transaction(function () use ($photos, $finish, $request, $model): void {
            if (! $photos->reorder($finish, $request->ids())) {
                throw ValidationException::withMessages(['ids' => FinishImages::STALE]);
            }

            $model->touch();
            AuditTrail::record($request->admin(), 'wheel.images_reordered', self::photoSubject($model, $finish), $model);
        });

        return back()->with('toast', self::PHOTOS_ORDERED);
    }

    public function relabelImage(WheelPhotoAltRequest $request, WheelModel $model, WheelFinish $finish, WheelFinishImage $image, FinishImages $photos): RedirectResponse
    {
        DB::transaction(function () use ($photos, $image, $request, $model, $finish): void {
            $photos->relabel($image, $request->alt());
            $model->touch();
            AuditTrail::record($request->admin(), 'wheel.image_relabelled', self::photoSubject($model, $finish), $model);
        });

        return back()->with('toast', self::SAVED);
    }

    /** @return array{name: string, finish: string} */
    private static function photoSubject(WheelModel $model, WheelFinish $finish): array
    {
        return ['name' => $model->loadMissing('brand')->brand->name.' '.$model->name, 'finish' => (string) $finish->name_de];
    }

    private function move(WheelModel $model, CatalogueStatus $to, AdminUser $admin): void
    {
        $from = $model->status;

        if ($from === $to) {
            return;
        }

        DB::transaction(static function () use ($model, $to, $from, $admin): void {
            $model->forceFill(['status' => $to->value])->save();

            AuditTrail::record($admin, match ($to) {
                CatalogueStatus::Published => 'wheel.published',
                CatalogueStatus::Archived => 'wheel.archived',
                default => $from === CatalogueStatus::Archived ? 'wheel.restored' : 'wheel.unpublished',
            }, ['name' => $model->loadMissing('brand')->brand->name.' '.$model->name], $model);
        });
    }

    /** @return array<string, mixed> */
    private function props(?WheelModel $model, AdminUser $admin): array
    {
        $check = $model === null ? null : app(PublishCheck::class)->for($model);
        $finishes = $model === null ? collect() : $model->finishes()->with('images')->withCount('configs')->orderBy('sort_order')->orderBy('id')->get();
        $configs = $model === null ? collect() : $model->configs()->orderBy('diameter_in')->orderBy('width_in')->orderBy('et_mm')->orderBy('id')->get();
        $locked = $model === null ? [] : DB::table('fitments')->whereIn('wheel_config_id', $configs->pluck('id'))->distinct()->pluck('wheel_config_id')
            ->map(static fn (mixed $id): int => (int) $id)->all();

        return [
            'model' => $model === null ? null : [
                'id' => (int) $model->id,
                'brandId' => (int) $model->brand_id,
                'brand' => $model->brand->name,
                'name' => $model->name,
                'typeDesignation' => $model->type_designation ?? '',
                // The title as typed — empty: the shop composes it from brand, model and Radtypenbezeichnung (D-298).
                'title' => $model->title ?? '',
                'fullTitle' => WheelTitle::full($model),
                'spokeCount' => $model->spoke_count,
                'description' => $model->description_de ?? '',
                'seoTitle' => $model->seo_title ?? '',
                'seoDescription' => $model->seo_description ?? '',
                'internalNote' => $model->internal_note ?? '',
                'status' => $model->status->value,
                'statusLabel' => WheelList::statusLabel($model->status),
                'demo' => $model->is_demo,
                'slug' => $model->slug,
                'shopUrl' => $model->status === CatalogueStatus::Published && ! $model->is_demo ? '/felgen/'.$model->slug : null,
                'updated' => $model->updated_at === null ? null : GermanFormat::dateTime($model->updated_at),
            ],
            'finishes' => $finishes->map(static fn (WheelFinish $f): array => [
                'key' => 'f'.$f->id,
                'id' => (int) $f->id,
                'name' => $f->name_de,
                'hex' => $f->hex ?? '',
                'artFinish' => $f->art_finish,
                'image' => is_array($f->image_manifest) ? [
                    'manifest' => $f->image_manifest,
                    'alt' => $f->image_alt_de ?? '',
                    'placeholder' => ($f->image_manifest['kind'] ?? null) === 'placeholder',
                ] : null,
                // Every photograph, first the cover; the cover above is composed from them.
                'photos' => $f->images->map(static fn (WheelFinishImage $i): array => [
                    'id' => (int) $i->id,
                    'manifest' => $i->manifest,
                    'alt' => $i->alt_de,
                ])->values()->all(),
                'sizes' => (int) $f->getAttribute('configs_count'),
            ])->values()->all(),
            'configs' => $configs->map(static fn (WheelConfig $c): array => [
                'key' => 'c'.$c->id,
                'id' => (int) $c->id,
                'finish' => 'f'.$c->wheel_finish_id,
                'diameter' => GermanFormat::trimmedDecimal($c->diameter_in, 1),
                'width' => GermanFormat::trimmedDecimal($c->width_in, 2),
                'et' => (string) $c->et_mm,
                'bolt_holes' => (int) $c->getAttribute('bolt_holes'),
                'bolt_circle' => GermanFormat::trimmedDecimal((float) $c->getAttribute('bolt_circle_mm'), 1),
                'bore' => GermanFormat::trimmedDecimal((float) $c->getAttribute('centre_bore_mm'), 2),
                'sku' => (string) $c->getAttribute('sku'),
                'ean' => (string) ($c->getAttribute('ean') ?? ''),
                'kba' => (string) ($c->kba_number ?? ''),
                'price' => Money::fromMinor((int) $c->price_cents)->toGerman(),
                'available' => $c->available,
                'weight_g' => $c->weight_g,
                'locked' => in_array((int) $c->id, $locked, true),
            ])->values()->all(),
            'documents' => $check['sizes'] ?? [],
            'check' => $check === null ? null : ['blockers' => $check['blockers'], 'hints' => $check['hints']],
            // Every brand a wheel belongs to, or that is marked as a wheel brand — whatever the
            // homepage's brand wall shows, the model's own brand is always among them.
            'brands' => Brand::query()
                ->where(static fn ($q) => $q->where('is_wheel_brand', true)->orWhereHas('wheelModels'))
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(static fn (Brand $b): array => ['value' => (int) $b->id, 'label' => $b->name])->values()->all(),
            'options' => [
                'spokes' => WheelModelRequest::SPOKES,
                'boltHoles' => WheelModelRequest::BOLT_HOLES,
                'artFinishes' => array_map(static fn (string $value, string $label): array => ['value' => $value, 'label' => $label], array_keys(WheelModelRequest::ART_FINISHES), WheelModelRequest::ART_FINISHES),
                'maxPhotos' => FinishImages::MAX_PER_FINISH,
            ],
            'can' => self::can($admin),
        ];
    }

    /** @return array{create: bool, edit: bool, publish: bool, archive: bool, import: bool} */
    private static function can(AdminUser $admin): array
    {
        return [
            'create' => $admin->may(PermissionModule::Catalogue, PermissionAction::Create),
            'edit' => $admin->may(PermissionModule::Catalogue, PermissionAction::Edit),
            'publish' => $admin->may(PermissionModule::Catalogue, PermissionAction::Publish),
            'archive' => $admin->may(PermissionModule::Catalogue, PermissionAction::Delete),
            'import' => $admin->may(PermissionModule::Imports, PermissionAction::View),
        ];
    }

    /** @param  array<string, string>  $query */
    private static function url(array $query, int $page): string
    {
        if ($page > 1) {
            $query['seite'] = (string) $page;
        }

        return $query === [] ? '/admin/felgen' : '/admin/felgen?'.http_build_query($query);
    }
}
