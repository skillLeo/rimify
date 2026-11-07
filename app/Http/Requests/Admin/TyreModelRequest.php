<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\TyreSeason;
use App\Models\AdminUser;
use App\Models\TyreModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A tyre model's facts: brand (or a new one), model name, season — changed for all its sizes at once (TyreModels::change).
 * TyreModelPolicy on the server (R-11); the same sentences as a size's form.
 */
class TyreModelRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $model = $this->route('model');

        return $user instanceof AdminUser && $model instanceof TyreModel && $user->can('update', $model);
    }

    protected function prepareForValidation(): void
    {
        $trim = static fn (mixed $v): mixed => is_string($v) ? trim($v) : $v;

        $this->merge(['name' => $trim($this->input('name')), 'brand_new' => $trim($this->input('brand_new'))]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'brand_id' => ['nullable', 'integer', 'required_without:brand_new', Rule::exists('brands', 'id')->whereNull('deleted_at')],
            'brand_new' => ['nullable', 'string', 'max:60'],
            'name' => ['required', 'string', 'max:80'],
            'season' => ['required', Rule::in(TyreSeason::values())],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'brand_id.required_without' => 'Bitte wähl die Marke oder leg eine neue an.',
            'brand_id.*' => 'Diese Marke gibt es nicht mehr. Wähl bitte eine aus der Liste.',
            'brand_new.max' => 'Der Markenname darf höchstens 60 Zeichen lang sein.',
            'name.required' => 'Bitte gib das Modell ein, zum Beispiel „PremiumContact 7“.',
            'name.max' => 'Das Modell darf höchstens 80 Zeichen lang sein.',
            'season.*' => 'Bitte wähl die Saison.',
        ];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }
}
