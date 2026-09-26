<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use Closure;

/**
 * A role's whole set of rights at once: the cells that are allowed, as `module.action`; every other
 * real cell is denied. Sent only after the page has shown the difference and the person confirmed
 * it — from *Von Rolle kopieren* and from a module's *Alle*.
 *
 * Every entry must be a real cell (PermissionModule::actions()). An unknown one, or a real module
 * with an action it does not have, is refused by name rather than dropped: silently ignoring part
 * of what somebody confirmed would save something they did not see.
 */
class RolePermissionsReplaceRequest extends RoleRequest
{
    protected function needs(): PermissionAction
    {
        return PermissionAction::Edit;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'rights' => ['present', 'array', 'max:'.count(PermissionModule::cells())],
            'rights.*' => ['string', 'distinct', static function (string $attribute, mixed $value, Closure $fail): void {
                $refusal = self::refusal($value);

                if ($refusal !== null) {
                    $fail($refusal);
                }
            }],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'rights.present' => 'Die Rechte fehlen.',
            'rights.array' => 'Die Rechte fehlen.',
            'rights.max' => 'Das sind mehr Rechte, als es gibt.',
            'rights.*.string' => 'Dieses Recht gibt es nicht.',
            'rights.*.distinct' => 'Ein Recht steht doppelt in der Liste.',
        ];
    }

    /** Why one entry is not a right a role can hold, or null when it is one. */
    private static function refusal(mixed $value): ?string
    {
        if (! is_string($value) || in_array($value, PermissionModule::cells(), true)) {
            return null;
        }

        [$module, $action] = array_pad(explode('.', $value, 2), 2, '');
        $module = PermissionModule::tryFrom($module);
        $action = PermissionAction::tryFrom($action);

        return $module !== null && $action !== null
            ? RolePermissionRequest::unrealCell($module, $action)
            : 'Dieses Recht gibt es nicht.';
    }

    /**
     * The allowed cells, deduplicated and in the grid's order.
     *
     * @return list<string>
     */
    public function rights(): array
    {
        /** @var list<string> $rights */
        $rights = (array) $this->validated('rights');

        return array_values(array_intersect(PermissionModule::cells(), $rights));
    }
}
