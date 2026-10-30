<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GuideDestroyRequest;
use App\Http\Requests\Admin\GuideListPublishRequest;
use App\Http\Requests\Admin\GuideStoreRequest;
use App\Http\Requests\Admin\RatgeberIndexRequest;
use App\Models\AdminUser;
use App\Models\NavItem;
use App\Models\Page;
use App\Services\Content\NavigationSchema;
use App\Services\Content\PageChangedMeanwhile;
use App\Services\Content\PageContent;
use App\Services\Content\PagePublisher;
use App\Services\Content\PageSchema;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Inhalte › Ratgeber (the client's admin item 12, D-351): „Ratgeber management page in the admin panel should be a
 * separate page instead of a section in the „Seiten“ page.“ The Blog's articles on a page of their own — listed, searched
 * and sorted, created, published and withdrawn, deleted — and each edited in the page editor, as before. „Seiten“ keeps
 * the homepage and the legal texts; an article's old address there leads here. The same rights as before: the `content`
 * row of the matrix, through PagePolicy.
 */
class RatgeberController extends Controller
{
    public const DELETED = 'Artikel gelöscht. Er steht nicht mehr im Shop und nicht mehr in dieser Liste.';

    public const INCOMPLETE = 'ist noch nicht vollständig. Öffne den Artikel: Die Prüfung zeigt dort jede Stelle, die fehlt.';

    public function __construct(private readonly PagePublisher $publisher) {}

    public function index(RatgeberIndexRequest $request): Response
    {
        $search = $request->search();
        $sort = $request->sort();
        $direction = $request->direction() === 'auf' ? 'asc' : 'desc';
        $admin = self::admin($request);

        $articles = Page::query()
            ->where('kind', Page::KIND_GUIDE)
            ->when($search !== '', static function ($query) use ($search): void {
                $like = '%'.addcslashes($search, '\\%_').'%';
                $query->where(static fn ($where) => $where->where('title', 'like', $like)->orWhere('slug', 'like', $like));
            })
            ->when($sort === 'titel', static fn ($query) => $query->orderBy('title', $direction))
            // The articles in the shop first, by the day they went live; those not in it after them.
            ->when($sort === 'veroeffentlicht', static fn ($query) => $query->orderByRaw("status = 'published' DESC")->orderBy('published_at', $direction))
            ->when($sort === 'geaendert', static fn ($query) => $query->orderBy(DB::raw('COALESCE(draft_updated_at, updated_at)'), $direction))
            ->orderBy('id')
            ->get();

        $names = AdminUser::query()->whereIn('email', $articles->pluck('draft_author_email')->filter()->unique()->values()->all())->pluck('name', 'email')->all();

        return Inertia::render('Admin/Ratgeber/Index', [
            'articles' => $articles->map(static fn (Page $page): array => [
                'id' => (int) $page->id,
                'version' => (int) $page->content_version,
                'title' => $page->title,
                'href' => $page->href(),
                'published' => $page->isPublished(),
                'publishedAt' => GermanFormat::date($page->published_at),
                'changedAt' => GermanFormat::date($page->draft_updated_at ?? $page->updated_at),
                'draft' => $page->draft === null ? null : [
                    'at' => GermanFormat::dateTime($page->draft_updated_at),
                    'by' => $page->draft_author_email === null ? null : ($names[$page->draft_author_email] ?? $page->draft_author_email),
                ],
            ])->values()->all(),
            'total' => Page::query()->where('kind', Page::KIND_GUIDE)->count(),
            'filters' => ['q' => $search, 'sort' => $sort, 'richtung' => $request->direction()],
            'can' => [
                'create' => $admin->may(PermissionModule::Content, PermissionAction::Create),
                'publish' => $admin->may(PermissionModule::Content, PermissionAction::Publish),
                'delete' => $admin->may(PermissionModule::Content, PermissionAction::Delete),
            ],
        ]);
    }

    public function store(GuideStoreRequest $request): RedirectResponse
    {
        $schema = PageSchema::for(new Page(['kind' => Page::KIND_GUIDE])) ?? abort(500);
        $page = $this->publisher->createGuide($request->title(), $request->slug(), $schema, $request->admin());

        return redirect('/admin/ratgeber/'.$page->id)->with('toast', SeitenController::CREATED);
    }

    /** One article in the page editor — the editor every page has, at the article's own address. */
    public function show(Request $request, Page $page): Response|RedirectResponse
    {
        abort_unless($page->kind === Page::KIND_GUIDE, 404);

        return app(SeitenController::class)->show($request, $page);
    }

    /**
     * Publishes what the article holds — its saved draft, or the words it had — after the editor's own publish check. A
     * gap is not filled in from here: the editor names each place.
     */
    public function publish(GuideListPublishRequest $request, Page $page): RedirectResponse
    {
        $schema = PageSchema::for($page) ?? abort(404);
        $raw = PageContent::live($page);
        $content = PageSchema::normalise($schema, is_array($page->draft) ? $page->draft : $raw, $raw);

        if (PageSchema::errors($schema, $content) !== []) {
            return back()->withErrors(['article' => '„'.$page->title.'“ '.self::INCOMPLETE]);
        }

        $changed = self::unlessChangedMeanwhile(fn (): bool => $this->publisher->publish($page, $request->baseVersion(), $schema, $content, false, null, $request->admin()));

        return back()->with('toast', $changed ? SeitenController::PUBLISHED : SeitenController::UNCHANGED);
    }

    public function destroy(GuideDestroyRequest $request, Page $page): RedirectResponse
    {
        // A menu entry still leading here would send every visitor to a missing page — as with withdrawing it.
        $menus = NavItem::query()->where('href', $page->href())->where('visible', true)->pluck('menu')->unique()
            ->map(static fn (string $menu): string => '„'.(NavigationSchema::MENUS[$menu]['label'] ?? $menu).'“')
            ->implode(', ');

        if ($menus !== '') {
            return back()->withErrors(['article' => 'Der Artikel steht noch im Menü '.$menus.'. Nimm ihn dort unter Navigation zuerst heraus, sonst führt der Eintrag ins Leere.']);
        }

        self::unlessChangedMeanwhile(fn () => $this->publisher->delete($page, $request->baseVersion(), $request->admin()));

        return redirect('/admin/ratgeber')->with('toast', self::DELETED);
    }

    /**
     * @template T
     *
     * @param  callable(): T  $write
     * @return T
     */
    private static function unlessChangedMeanwhile(callable $write): mixed
    {
        try {
            return $write();
        } catch (PageChangedMeanwhile) {
            throw ValidationException::withMessages(['article' => PageChangedMeanwhile::MESSAGE]);
        }
    }

    private static function admin(Request $request): AdminUser
    {
        $user = $request->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }
}
