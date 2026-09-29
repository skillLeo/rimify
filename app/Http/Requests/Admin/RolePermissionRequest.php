<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * One cell of the permission matrix: a role, a module, an action, allowed or not.
 *
 * A cell and not a whole role, because the matrix is read and changed one answer at a time — "may
 * the Buchhaltung export orders?" — and because posting the whole grid would let two admins editing
 * different corners of it silently undo each other.
 *
 * There is no Policy class here: a role has no Eloquent model to hang one on. The question is the
 * same cell the Policies ask — `roles` × `edit` — asked directly, and it is asked on the server on
 * this mutation like every other (R-11).
 */
class RolePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->may(PermissionModule::Roles, PermissionAction::Edit);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            // The enums are the allow-list: a module or an action that is not one of ours is not a
            // permission anybody can hold, so it is refused rather than stored and ignored.
            'module' => ['required', 'string', Rule::in(array_column(PermissionModule::cases(), 'value'))],
            'action' => ['required', 'string', Rule::in(array_column(PermissionAction::cases(), 'value'))],
            'allowed' => ['required', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'module.in' => 'Dieses Modul gibt es nicht.',
            'action.in' => 'Diese Aktion gibt es nicht.',
        ];
    }

    /**
     * Both halves can exist and the pair still not: the Protokoll has no *Löschen*. Such a cell is
     * refused like an unknown one, because nothing would ever ask about it.
     *
     * @return list<callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $module = PermissionModule::tryFrom((string) $this->input('module'));
                $action = PermissionAction::tryFrom((string) $this->input('action'));

                if ($module !== null && $action !== null && ! $module->hasAction($action)) {
                    $validator->errors()->add('action', self::unrealCell($module, $action));
                }
            },
        ];
    }

    /** The sentence for a cell whose module and action both exist, but not together. */
    public static function unrealCell(PermissionModule $module, PermissionAction $action): string
    {
        return sprintf('„%s“ gibt es im Bereich „%s“ nicht.', $action->labelDe(), $module->labelDe());
    }

    public function module(): PermissionModule
    {
        return PermissionModule::from((string) $this->validated('module'));
    }

    public function action(): PermissionAction
    {
        return PermissionAction::from((string) $this->validated('action'));
    }

    public function allowed(): bool
    {
        return (bool) $this->validated('allowed');
    }

    /** The signed-in admin; authorize() has already refused anyone else. */
    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }
}
