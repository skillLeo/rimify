<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\SavedView;
use App\Services\Admin\Lists\AdminLists;
use App\Services\Admin\Lists\ListViews;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Validator as ValidatorFactory;
use Illuminate\Validation\Validator;

/**
 * The checks a view's save and its change share: a name the person has not used on this list, only
 * the list's own query keys, a role that may open the list, and no more than the limit of views.
 */
final class SavedViewRules
{
    /** @param  array<string, string>  $query */
    public static function check(Validator $validator, AdminUser $user, string $list, ?string $name, ?array $query, ?int $roleId, ?SavedView $existing): void
    {
        $spec = AdminLists::get($list);

        if ($spec === null) {
            $validator->errors()->add('list', 'In dieser Liste lassen sich keine Ansichten speichern. Lad die Seite bitte neu.');

            return;
        }

        if ($name !== null && $name === '') {
            $validator->errors()->add('name', 'Gib der Ansicht bitte einen Namen.');
        }

        if ($name !== null && $name !== '' && self::nameTaken($user, $list, $name, $existing)) {
            $validator->errors()->add('name', 'Eine Ansicht mit diesem Namen hast du schon. Wähl bitte einen anderen.');
        }

        if ($query !== null && array_diff(array_keys($query), $spec['keys']) !== []) {
            $validator->errors()->add('query', 'Diese Filter lassen sich nicht speichern. Lad die Seite bitte neu.');
        } elseif ($query !== null && ($refusal = self::refusal($spec['request'], $spec['path'], $query)) !== null) {
            // The list's own words for what it would refuse: a view is only ever filters the list takes.
            $validator->errors()->add('query', "Diese Filter lassen sich nicht speichern. {$refusal}");
        }

        if ($roleId !== null && ! in_array($roleId, array_column((new ListViews)->shareOptions($spec['module']->value), 'id'), true)) {
            $validator->errors()->add('role_id', 'Diese Rolle darf die Liste nicht öffnen. Wähl bitte eine andere.');
        }

        if ($existing === null && SavedView::query()->where('admin_user_id', $user->id)->where('list', $list)->count() >= SavedView::MAX_PER_LIST) {
            $validator->errors()->add('name', 'Du hast schon '.SavedView::MAX_PER_LIST.' Ansichten für diese Liste. Lösch bitte eine, bevor du eine neue speicherst.');
        }
    }

    /**
     * Whether the person already has a view of this name on this list. Compared letter for letter:
     * the column's collation would take „Zählung“ for „Zahlung“ and refuse a name nobody used.
     */
    public static function nameTaken(AdminUser $user, string $list, string $name, ?SavedView $except): bool
    {
        return SavedView::query()
            ->where('admin_user_id', $user->id)
            ->where('list', $list)
            ->whereRaw('name COLLATE utf8mb4_bin = ?', [$name])
            ->when($except !== null, static fn ($q) => $q->whereKeyNot($except?->id))
            ->exists();
    }

    /**
     * The first sentence the list's own Form Request would refuse these filters with, or null.
     *
     * @param  class-string<FormRequest>  $class
     * @param  array<string, string>  $query
     */
    private static function refusal(string $class, string $path, array $query): ?string
    {
        $probe = $class::create($path, 'GET', $query);
        /** @var array<string, mixed> $rules */
        $rules = method_exists($probe, 'rules') ? $probe->rules() : [];
        $check = ValidatorFactory::make($query, $rules, $probe->messages());

        if (method_exists($probe, 'after')) {
            $check->after($probe->after());
        }

        return $check->fails() ? $check->errors()->first() : null;
    }
}
