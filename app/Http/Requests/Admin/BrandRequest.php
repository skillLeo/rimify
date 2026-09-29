<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\Brand;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Creating or changing a Marke (Katalog › Marken): its name, whether it is a wheel brand (on the
 * homepage's brand wall), and its place there. The slug follows the name and is never posted; a name
 * another live brand has is refused in a sentence. The logo is its own request (BrandLogoRequest).
 */
class BrandRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $brand = $this->brand();

        return $user instanceof AdminUser && $user->can($brand === null ? 'create' : 'update', $brand ?? Brand::class);
    }

    protected function prepareForValidation(): void
    {
        $name = trim((string) (is_string($this->input('name')) ? $this->input('name') : ''));

        $this->merge(['name' => $name, 'slug' => Str::slug($name)]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $brand = $this->brand();

        return [
            'name' => ['required', 'string', 'max:60', Rule::unique('brands', 'name')->whereNull('deleted_at')->ignore($brand)],
            'slug' => ['required', 'string', 'max:80', Rule::unique('brands', 'slug')->whereNull('deleted_at')->ignore($brand)],
            'isWheelBrand' => ['required', 'boolean'],
            'sortOrder' => ['required', 'integer', 'min:0', 'max:9999'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Bitte gib den Namen der Marke an.',
            'name.max' => 'Der Name darf höchstens 60 Zeichen lang sein.',
            'name.unique' => 'Diese Marke gibt es schon.',
            'slug.required' => 'Der Name braucht mindestens einen Buchstaben oder eine Ziffer.',
            'slug.unique' => 'Eine Marke mit fast gleichem Namen gibt es schon.',
            'sortOrder.*' => 'Die Position ist eine ganze Zahl von 0 bis 9999.',
        ];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser ? $user : abort(403);
    }

    /** @return array{name: string, slug: string, is_wheel_brand: bool, sort_order: int} */
    public function attributesForBrand(): array
    {
        return [
            'name' => (string) $this->validated('name'),
            'slug' => (string) $this->validated('slug'),
            'is_wheel_brand' => (bool) $this->validated('isWheelBrand'),
            'sort_order' => (int) $this->validated('sortOrder'),
        ];
    }

    private function brand(): ?Brand
    {
        $brand = $this->route('brand');

        return $brand instanceof Brand ? $brand : null;
    }
}
