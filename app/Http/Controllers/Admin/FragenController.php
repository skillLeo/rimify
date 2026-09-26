<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\FaqEntryRequest;
use App\Http\Requests\Admin\FaqOrderRequest;
use App\Http\Requests\Admin\VisibilityRequest;
use App\Models\AdminUser;
use App\Models\FaqEntry;
use App\Models\Setting;
use App\Services\Admin\AuditTrail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Inhalte › FAQ — the questions on /faq and the five on the homepage (docs/admin/inhalte-build-plan.md).
 *
 * No draft: an entry is either visible or hidden, and a visible one changes on the shop when it is
 * saved. Every write stamps `team_edited_at`, so a release never brings the seeded questions back
 * over the team's (ContentSeeder), and leaves one Protokoll entry.
 */
class FragenController extends Controller
{
    public const SAVED = 'Gespeichert.';

    public const CREATED = 'Frage angelegt.';

    public const DELETED = 'Frage gelöscht.';

    public const REORDERED = 'Reihenfolge gespeichert.';

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', FaqEntry::class);

        $groups = [];

        foreach (FaqEntry::GROUPS as $key) {
            $groups[$key] = ['key' => $key, 'entries' => []];
        }

        $entries = FaqEntry::query()->orderBy('sort_order')->orderBy('id')->get();

        foreach ($entries as $entry) {
            // A group no longer offered still shows its entries, under its own name, so none is lost.
            $groups[$entry->group_key] ??= ['key' => $entry->group_key, 'entries' => []];
            $groups[$entry->group_key]['entries'][] = [
                'id' => (int) $entry->id,
                'question' => $entry->question_de,
                'answer' => $entry->answer_de,
                'published' => $entry->published,
            ];
        }

        // The homepage shows the first five visible answers across both groups.
        $home = $entries->where('published', true)->take(5)->pluck('id')->map(static fn (mixed $id): int => (int) $id)->values()->all();

        $admin = self::admin($request);

        return Inertia::render('Admin/Faq/Index', [
            'groups' => array_values($groups),
            'groupOptions' => FaqEntry::GROUPS,
            'onHome' => $home,
            'limits' => ['question' => FaqEntry::QUESTION_MAX, 'answer' => FaqEntry::ANSWER_MAX],
            'can' => [
                'create' => $admin->may(PermissionModule::Content, PermissionAction::Create),
                'edit' => $admin->may(PermissionModule::Content, PermissionAction::Edit),
                'delete' => $admin->may(PermissionModule::Content, PermissionAction::Delete),
                'publish' => $admin->may(PermissionModule::Content, PermissionAction::Publish),
            ],
        ]);
    }

    public function store(FaqEntryRequest $request): RedirectResponse
    {
        $attributes = $request->entryAttributes();
        $admin = $request->admin();

        DB::transaction(function () use ($attributes, $admin): void {
            // A new question goes to the end of its group, which is the end of the list for that group.
            $last = (int) FaqEntry::query()->where('group_key', $attributes['group_key'])->max('sort_order');
            $sort = $last > 0 ? $last + 5 : (int) FaqEntry::query()->max('sort_order') + 10;

            $entry = FaqEntry::query()->create($attributes + ['sort_order' => $sort, 'team_edited_at' => now()]);

            AuditTrail::record($admin, 'faq.created', [
                'question' => $entry->question_de,
                'published' => $entry->published,
            ], $entry);

            self::renumber();
            self::touched();
        });

        return back()->with('toast', self::CREATED);
    }

    public function update(FaqEntryRequest $request, FaqEntry $entry): RedirectResponse
    {
        $attributes = $request->entryAttributes();
        $admin = $request->admin();

        DB::transaction(function () use ($attributes, $admin, $entry): void {
            $before = $entry->only(['group_key', 'question_de', 'answer_de', 'published']);

            // Moved to the other group: it joins that group at its end, as a new question would,
            // rather than keeping a number that puts it first there.
            if ($attributes['group_key'] !== $entry->group_key) {
                $entry->sort_order = (int) FaqEntry::query()->where('group_key', $attributes['group_key'])->max('sort_order') + 5;
            }

            $entry->fill($attributes);
            $entry->save();

            self::renumber();
            self::touched();

            $after = $entry->only(['group_key', 'question_de', 'answer_de', 'published']);
            $changed = array_keys(array_filter($after, static fn (mixed $value, string $key): bool => $before[$key] !== $value, ARRAY_FILTER_USE_BOTH));

            AuditTrail::record($admin, 'faq.updated', [
                'question' => $entry->question_de,
                'old_question' => $before['question_de'],
                'changed' => $changed,
                'published' => ['old' => $before['published'], 'new' => $entry->published],
            ], $entry);
        });

        return back()->with('toast', self::SAVED);
    }

    public function destroy(Request $request, FaqEntry $entry): RedirectResponse
    {
        $this->authorize('delete', $entry);

        // Taking a visible answer off the shop is a change visitors see.
        if ($entry->published) {
            $this->authorize('publish', FaqEntry::class);
        }

        $admin = self::admin($request);

        DB::transaction(function () use ($admin, $entry): void {
            AuditTrail::record($admin, 'faq.deleted', [
                'question' => $entry->question_de,
                'answer' => $entry->answer_de,
                'group' => $entry->group_key,
                'published' => $entry->published,
            ]);

            $entry->delete();
            self::touched();
        });

        return back()->with('toast', self::DELETED);
    }

    public function reorder(FaqOrderRequest $request): RedirectResponse
    {
        $ids = $request->ids();
        $admin = $request->admin();

        DB::transaction(function () use ($ids, $admin): void {
            foreach ($ids as $index => $id) {
                FaqEntry::query()->whereKey($id)->update(['sort_order' => ($index + 1) * 10]);
            }

            // A list sent from a page that interleaved the groups is put back in group order, so
            // the stored order is always the one /faq and the homepage read.
            self::renumber();
            self::touched();

            AuditTrail::record($admin, 'faq.reordered', ['count' => count($ids)]);
        });

        return back()->with('toast', self::REORDERED);
    }

    /** Shows or hides one entry — its visibility and nothing else (VisibilityRequest). */
    public function visibility(VisibilityRequest $request, FaqEntry $entry): RedirectResponse
    {
        $visible = $request->visible();
        $admin = $request->admin();

        DB::transaction(function () use ($visible, $admin, $entry): void {
            $before = $entry->published;
            $entry->forceFill(['published' => $visible])->save();
            self::touched();

            AuditTrail::record($admin, 'faq.updated', [
                'question' => $entry->question_de,
                'old_question' => $entry->question_de,
                'changed' => $before === $visible ? [] : ['published'],
                'published' => ['old' => $before, 'new' => $visible],
            ], $entry);
        });

        return back()->with('toast', self::SAVED);
    }

    /**
     * After any change the list is the team's: ContentSeeder, which a release re-runs, leaves it
     * alone. Every row is stamped, and the claim is kept as a setting as well — with the last
     * question deleted there is no row left to carry a stamp, and the next release would otherwise
     * bring all the seeded questions back.
     */
    private static function touched(): void
    {
        FaqEntry::query()->whereNull('team_edited_at')->update(['team_edited_at' => now()]);

        if (Setting::get(FaqEntry::TEAM_OWNED_SETTING) === null) {
            Setting::set(FaqEntry::TEAM_OWNED_SETTING, now()->toIso8601String());
        }
    }

    /** Gaps of ten again, groups in their fixed order: the list and the stored order never disagree. */
    private static function renumber(): void
    {
        $order = array_flip(FaqEntry::GROUPS);
        $entries = FaqEntry::query()->orderBy('sort_order')->orderBy('id')->get()
            ->sortBy(static fn (FaqEntry $e): int => $order[$e->group_key] ?? count($order), SORT_REGULAR, false)
            ->values();

        foreach ($entries as $index => $entry) {
            if ($entry->sort_order !== ($index + 1) * 10) {
                FaqEntry::query()->whereKey($entry->id)->update(['sort_order' => ($index + 1) * 10]);
            }
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
