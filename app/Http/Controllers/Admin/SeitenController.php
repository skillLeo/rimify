<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GuideStoreRequest;
use App\Http\Requests\Admin\LegalPlaceholderRequest;
use App\Http\Requests\Admin\PageContentRequest;
use App\Http\Requests\Admin\PageImageRequest;
use App\Http\Requests\Admin\PagePublishRequest;
use App\Models\AdminUser;
use App\Models\NavItem;
use App\Models\Page;
use App\Models\PageRevision;
use App\Models\Setting;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\AuditTrail;
use App\Services\Content\LegalTexts;
use App\Services\Content\NavigationSchema;
use App\Services\Content\PageChangedMeanwhile;
use App\Services\Content\PageContent;
use App\Services\Content\PagePublisher;
use App\Services\Content\PageSchema;
use App\Services\Storage\ImageUpload;
use App\Services\Storage\UploadRejected;
use App\Support\GermanFormat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Inhalte › Seiten — the shop's words, edited by the client's team (docs/admin/inhalte-build-plan.md).
 *
 * A page is edited as a draft that visitors never see, checked against PageSchema, previewed in the
 * real storefront by a signed link, and published whole. Every published state is kept, and any of
 * them can be loaded back into the draft.
 *
 * @phpstan-import-type Content from PageSchema
 */
class SeitenController extends Controller
{
    public const DRAFT_SAVED = 'Entwurf gespeichert.';

    public const DRAFT_DISCARDED = 'Entwurf verworfen. Es gilt wieder die veröffentlichte Fassung.';

    public const DRAFT_DISCARDED_UNPUBLISHED = 'Entwurf verworfen. Der Artikel ist weiterhin nicht im Shop zu sehen.';

    public const PUBLISHED = 'Veröffentlicht. Der Shop zeigt jetzt die neue Fassung.';

    public const WITHDRAWN = 'Zurückgezogen. Der Artikel ist nicht mehr im Shop zu sehen.';

    public const PLACEHOLDER_OFF = 'Platzhalter ausgeschaltet. Besucher sehen jetzt den Text statt des Hinweises.';

    public const PLACEHOLDER_ON = 'Platzhalter eingeschaltet. Besucher sehen statt des Textes nur noch den Hinweis, dass der Text der Kanzlei folgt.';

    public const RESTORED = 'Die Version ist jetzt dein Entwurf. Live geht sie erst, wenn du sie veröffentlichst.';

    public const CREATED = 'Artikel angelegt. Er ist noch nicht veröffentlicht.';

    public const NOT_WITHDRAWABLE = 'Zurückziehen geht nur bei einem veröffentlichten Blog-Artikel.';

    public const UNCHANGED = 'Der Shop zeigt schon genau diesen Stand. Es ist keine neue Version entstanden.';

    /** How long a shared preview link works. */
    private const PREVIEW_DAYS = 7;

    private const GROUPS = [
        Page::KIND_MARKETING => 'Startseite',
        Page::KIND_GUIDE => 'Blog',
        Page::KIND_LEGAL => 'Rechtliches',
    ];

    public function __construct(private readonly PagePublisher $publisher) {}

    /**
     * A picture for an article's building block (his admin item 11, D-306), into our own storage: the editor puts its
     * address, width and height into the block — nothing is published until the article is. Answered as JSON, so the
     * form keeps everything typed around it.
     */
    public function image(PageImageRequest $request, Page $page, ImageUpload $uploads): JsonResponse
    {
        try {
            $stored = $uploads->store($request->picture(), 'media_site', 'blog/'.$page->slug);
        } catch (UploadRejected $e) {
            throw ValidationException::withMessages(['image' => $e->getMessage()]);
        }

        $url = Storage::disk($stored['disk'])->url($stored['path']);
        $app = rtrim((string) config('app.url'), '/');

        // On the site's own disk the address is kept root-relative, as a Felge's photograph: the page loads it under
        // whichever name it was opened, and the policy's 'self' covers it.
        if ($app !== '' && str_starts_with($url, $app.'/')) {
            $url = substr($url, strlen($app));
        }

        AuditTrail::record($request->admin(), 'page.image_uploaded', ['page' => $page->title, 'file' => basename($stored['path'])], $page);

        return response()->json(['src' => $url, 'width' => $stored['width'], 'height' => $stored['height']]);
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Page::class);

        $groups = [];

        foreach (self::GROUPS as $kind => $label) {
            $groups[$kind] = ['key' => $kind, 'label' => $label, 'pages' => []];
        }

        $pages = Page::query()->editable()->with('blocks')->orderBy('id')->get();
        $names = self::names($pages->pluck('draft_author_email')->filter()->all());

        foreach ($pages as $page) {
            $groups[$page->kind]['pages'][] = [
                'id' => (int) $page->id,
                'title' => $page->title,
                'href' => $page->href(),
                'published' => $page->isPublished(),
                'publishedAt' => GermanFormat::date($page->published_at),
                'draft' => $page->draft === null ? null : [
                    'at' => GermanFormat::dateTime($page->draft_updated_at),
                    'by' => self::who($page->draft_author_email, $names),
                ],
                'lawyerReviewed' => $page->kind === Page::KIND_LEGAL ? $page->lawyer_reviewed : null,
                // A legal text whose flag is on: visitors read the notice only (D-319).
                'placeholder' => $page->kind === Page::KIND_LEGAL && $page->is_placeholder,
            ];
        }

        return Inertia::render('Admin/Seiten/Index', [
            'groups' => array_values(array_filter($groups, static fn (array $group): bool => $group['pages'] !== [])),
            'can' => ['create' => self::admin($request)->may(PermissionModule::Content, PermissionAction::Create)],
        ]);
    }

    public function show(Request $request, Page $page): Response
    {
        // A page the panel does not edit (FAQ, Kontakt) is absent here, not forbidden: a 403 would
        // tell a Super-Admin they lack a right, and log a refusal that never happened.
        abort_unless($page->isEditable(), 404);
        $this->authorize('view', $page);

        $schema = PageSchema::for($page) ?? abort(404);
        $raw = PageContent::live($page);
        $live = PageSchema::normalise($schema, $raw, $raw);
        $content = is_array($page->draft) ? PageSchema::normalise($schema, $page->draft, $raw) : $live;
        $admin = self::admin($request);

        $revisions = [];
        // Every published state, newest first, the wording the admin first replaced last. The list stopped at the latest
        // 20 and the first, and the ones between could not be loaded back (the admin audit's sweep after F-26). Only what
        // the list shows is read — never a version's content.
        $history = $page->revisions()->get(['id', 'page_id', 'created_at', 'author_email', 'note']);

        $names = self::names([...$history->pluck('author_email')->filter()->all(), $page->draft_author_email]);

        foreach ($history as $revision) {
            $revisions[] = [
                'id' => (int) $revision->id,
                'at' => GermanFormat::dateTime($revision->created_at),
                // Null is the wording the admin first replaced: nobody here wrote it.
                'by' => self::who($revision->author_email, $names),
                'note' => $revision->note,
            ];
        }

        $mayPublish = $admin->may(PermissionModule::Content, PermissionAction::Publish);
        $request->attributes->set(AdminNavigation::RECORD, $page->title);

        return Inertia::render('Admin/Seiten/Bearbeiten', [
            'page' => [
                'id' => (int) $page->id,
                // Sent back with every write: one made against an older version is refused.
                'version' => $page->content_version,
                'slug' => $page->slug,
                'kind' => $page->kind,
                'group' => self::GROUPS[$page->kind] ?? '',
                'title' => $page->title,
                'href' => $page->href(),
                'published' => $page->isPublished(),
                'publishedAt' => GermanFormat::dateTime($page->published_at),
                'lawyerReviewed' => $page->kind === Page::KIND_LEGAL ? $page->lawyer_reviewed : null,
                // The flag visitors read by (D-319), whether the live words are still the seeder's marker — the flag stays
                // on over them —, and on the Widerrufsbelehrung the Muster-Widerrufsformular's own flag.
                'placeholder' => $page->kind === Page::KIND_LEGAL && $page->is_placeholder,
                'markerLeft' => self::hasPlaceholder($page),
                'formPlaceholder' => $page->kind === Page::KIND_LEGAL && $page->slug === 'widerrufsbelehrung'
                    ? Setting::get(LegalTexts::FORM_SETTING) !== false
                    : null,
            ],
            'schema' => $schema,
            'content' => $content,
            'live' => $live,
            'draft' => $page->draft === null ? null : [
                'at' => GermanFormat::dateTime($page->draft_updated_at),
                'by' => self::who($page->draft_author_email, $names),
            ],
            'revisions' => $revisions,
            'preview' => [
                'desktop' => self::previewUrl($page, 'desktop'),
                'handy' => self::previewUrl($page, 'handy'),
                'days' => self::PREVIEW_DAYS,
            ],
            'can' => [
                'edit' => $admin->may(PermissionModule::Content, PermissionAction::Edit),
                'publish' => $mayPublish,
                'withdraw' => $mayPublish && $page->kind === Page::KIND_GUIDE && $page->isPublished(),
            ],
        ]);
    }

    public function store(GuideStoreRequest $request): RedirectResponse
    {
        $schema = PageSchema::for(new Page(['kind' => Page::KIND_GUIDE])) ?? abort(500);
        $page = $this->publisher->createGuide($request->title(), $request->slug(), $schema, $request->admin());

        return redirect('/admin/seiten/'.$page->id)->with('toast', self::CREATED);
    }

    public function saveDraft(PageContentRequest $request, Page $page): RedirectResponse
    {
        self::unlessChangedMeanwhile(fn () => $this->publisher->saveDraft($page, $request->baseVersion(), $request->content(), $request->admin()));

        return back()->with('toast', self::DRAFT_SAVED);
    }

    public function discardDraft(Request $request, Page $page): RedirectResponse
    {
        abort_unless($page->isEditable(), 404);
        $this->authorize('update', $page);

        $schema = PageSchema::for($page) ?? abort(404);
        $published = $page->isPublished();

        self::unlessChangedMeanwhile(fn () => $this->publisher->discardDraft($page, self::baseVersion($request), $schema, self::admin($request)));

        return back()->with('toast', $published ? self::DRAFT_DISCARDED : self::DRAFT_DISCARDED_UNPUBLISHED);
    }

    /**
     * The publish check first: nothing goes live with a missing required field or a text over its
     * limit, and each refusal names the section and the field.
     */
    public function publish(PagePublishRequest $request, Page $page): RedirectResponse
    {
        $schema = $request->schema();
        $content = $request->content();
        $errors = PageSchema::errors($schema, $content);

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        $changed = self::unlessChangedMeanwhile(fn (): bool => $this->publisher->publish(
            $page,
            $request->baseVersion(),
            $schema,
            $content,
            $request->lawyerReviewed(),
            $request->note(),
            $request->admin(),
        ));

        return back()->with('toast', $changed ? self::PUBLISHED : self::UNCHANGED);
    }

    /**
     * What loading a version would change in the shop, place by place with its words — asked for
     * by the restore dialog, so twenty versions of a legal page do not travel with every visit.
     */
    public function compare(Request $request, Page $page, PageRevision $revision): JsonResponse
    {
        abort_unless($page->isEditable(), 404);
        $this->authorize('view', $page);

        abort_unless($revision->page_id === $page->id, 404);

        $schema = PageSchema::for($page) ?? abort(404);
        $raw = PageContent::live($page);

        return response()->json([
            'changes' => PageSchema::diff(
                $schema,
                PageSchema::normalise($schema, $raw, $raw),
                PageSchema::normalise($schema, $revision->snapshot, $raw),
            ),
        ]);
    }

    /**
     * A legal text's placeholder flag, or the Muster-Widerrufsformular's (D-319). On, visitors read one notice and the
     * shop stays out of search and live payments (LegalReadiness); off — only over words that are not the marker
     * (LegalPlaceholderRequest) — they read the published text. One Protokoll entry, the old state and the new.
     */
    public function placeholder(LegalPlaceholderRequest $request): RedirectResponse
    {
        $page = $request->page();
        $part = $request->part();
        $on = $request->placeholder();
        $admin = $request->admin();

        DB::transaction(static function () use ($page, $part, $on, $admin): void {
            if ($part === LegalPlaceholderRequest::FORM) {
                $was = Setting::get(LegalTexts::FORM_SETTING) !== false;
                Setting::set(LegalTexts::FORM_SETTING, $on);
                $name = LegalTexts::TEXTS[LegalTexts::FORM];
            } else {
                $locked = Page::query()->lockForUpdate()->findOrFail($page->id);
                $was = $locked->is_placeholder;
                $locked->forceFill(['is_placeholder' => $on]);
                // The team's from now on: a release's seeder leaves the page and its flag alone (ContentSeeder).
                $locked->markTeamEdited();
                $locked->save();
                $name = $locked->title;
            }

            AuditTrail::record($admin, 'page.placeholder_switched', [
                'page' => $name,
                'slug' => $page->slug,
                'part' => $part,
                'placeholder' => ['old' => $was, 'new' => $on],
            ], $page);
        });

        return back()->with('toast', $on ? self::PLACEHOLDER_ON : self::PLACEHOLDER_OFF);
    }

    public function withdraw(Request $request, Page $page): RedirectResponse
    {
        abort_unless($page->isEditable(), 404);
        $this->authorize('publish', $page);

        if ($page->kind !== Page::KIND_GUIDE || ! $page->isPublished()) {
            return back()->withErrors(['page' => self::NOT_WITHDRAWABLE]);
        }

        // A menu entry still leading here would send every visitor to a missing page.
        $menus = NavItem::query()->where('href', $page->href())->where('visible', true)->pluck('menu')->unique()
            ->map(static fn (string $menu): string => '„'.(NavigationSchema::MENUS[$menu]['label'] ?? $menu).'“')
            ->implode(', ');

        if ($menus !== '') {
            return back()->withErrors(['page' => 'Der Artikel steht noch im Menü '.$menus.'. Nimm ihn dort unter Navigation zuerst heraus, sonst führt der Eintrag ins Leere.']);
        }

        self::unlessChangedMeanwhile(fn () => $this->publisher->withdraw($page, self::baseVersion($request), self::admin($request)));

        return back()->with('toast', self::WITHDRAWN);
    }

    public function restore(Request $request, Page $page, PageRevision $revision): RedirectResponse
    {
        abort_unless($page->isEditable(), 404);
        $this->authorize('update', $page);

        abort_unless($revision->page_id === $page->id, 404);

        self::unlessChangedMeanwhile(fn () => $this->publisher->restore($page, self::baseVersion($request), $revision, self::admin($request)));

        return back()->with('toast', self::RESTORED);
    }

    /**
     * Runs a write, and turns "somebody changed the page meanwhile" into the sentence the editor
     * shows above its fields — the page, and everything typed on it, stays as it is.
     *
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
            throw ValidationException::withMessages(['page' => PageChangedMeanwhile::MESSAGE]);
        }
    }

    /** The page version a restore, a discard or a withdraw was made against. */
    private static function baseVersion(Request $request): int
    {
        /** @var array{baseVersion: int|string} $valid */
        $valid = $request->validate(
            ['baseVersion' => ['required', 'integer', 'min:0']],
            ['baseVersion' => 'Die Seite ist nicht vollständig angekommen. Bitte lade sie neu und versuch es noch einmal.'],
        );

        return (int) $valid['baseVersion'];
    }

    /**
     * The team's names by e-mail, in one query: a person is shown as the name the top bar shows.
     *
     * @param  array<int, string|null>  $emails
     * @return array<string, string>
     */
    private static function names(array $emails): array
    {
        $emails = array_values(array_unique(array_filter($emails, static fn (?string $email): bool => $email !== null && $email !== '')));

        if ($emails === []) {
            return [];
        }

        /** @var array<string, string> */
        return AdminUser::query()->whereIn('email', $emails)->pluck('name', 'email')->all();
    }

    /**
     * A name, or the address when the account is gone — never a guess.
     *
     * @param  array<string, string>  $names
     */
    private static function who(?string $email, array $names): ?string
    {
        if ($email === null || $email === '') {
            return null;
        }

        return $names[$email] ?? $email;
    }

    /** A signed link to the storefront page with this page's draft; it works without signing in. */
    private static function previewUrl(Page $page, string $device): string
    {
        return URL::temporarySignedRoute('vorschau.seite', now()->addDays(self::PREVIEW_DAYS), [
            'page' => $page->id,
            'geraet' => $device,
        ]);
    }

    /** Whether a legal page's live words are still the seeded „[Rechtstext folgt …]" — the placeholder flag cannot go off over them. */
    private static function hasPlaceholder(Page $page): bool
    {
        foreach ($page->blocks as $block) {
            if (($block->data['placeholder'] ?? false) === true) {
                return true;
            }
        }

        return false;
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
