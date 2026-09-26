<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;
use Illuminate\Validation\Rule;

/**
 * A new role: what it is called, optionally what it is for, and optionally whose rights it starts
 * with. The realistic way to make a role is to copy the closest one and take something away.
 */
class RoleStoreRequest extends RoleRequest
{
    public const LABEL_MAX = 60;

    public const DESCRIPTION_MAX = 500;

    protected function needs(): PermissionAction
    {
        return PermissionAction::Create;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'label' => [
                'required', 'string', 'max:'.self::LABEL_MAX,
                // Two roles with one name would make every later choice between them a guess.
                Rule::unique('roles', 'label_de')->where('guard_name', 'admin'),
            ],
            'description' => ['nullable', 'string', 'max:'.self::DESCRIPTION_MAX],
            'copyFrom' => ['nullable', 'integer', Rule::exists('roles', 'id')->where('guard_name', 'admin')],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return self::labelMessages() + [
            'copyFrom.integer' => 'Diese Rolle gibt es nicht mehr.',
            'copyFrom.exists' => 'Diese Rolle gibt es nicht mehr.',
        ];
    }

    /**
     * The sentences for a role's name and description, shared with renaming.
     *
     * @return array<string, string>
     */
    public static function labelMessages(): array
    {
        return [
            'label.required' => 'Gib der Rolle eine Bezeichnung.',
            'label.string' => 'Gib der Rolle eine Bezeichnung.',
            'label.max' => 'Die Bezeichnung darf höchstens '.self::LABEL_MAX.' Zeichen lang sein.',
            'label.unique' => 'Eine Rolle mit dieser Bezeichnung gibt es schon.',
            'description.string' => 'Die Beschreibung muss ein Text sein.',
            'description.max' => 'Die Beschreibung darf höchstens '.self::DESCRIPTION_MAX.' Zeichen lang sein.',
        ];
    }

    public function label(): string
    {
        return (string) $this->validated('label');
    }

    public function description(): ?string
    {
        $value = $this->validated('description');

        return is_string($value) && $value !== '' ? $value : null;
    }

    public function copyFrom(): ?int
    {
        $value = $this->validated('copyFrom');

        return $value === null ? null : (int) $value;
    }
}
