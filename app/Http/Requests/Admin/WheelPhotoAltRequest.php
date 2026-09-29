<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

/**
 * A new sentence for one photograph — the one a screen reader hears, and the product page's alt text for
 * it. The same rules as when the photo was uploaded (WheelImageRequest).
 */
class WheelPhotoAltRequest extends WheelFinishRequest
{
    protected function prepareForValidation(): void
    {
        $alt = $this->input('alt');
        $this->merge(['alt' => is_string($alt) ? trim($alt) : $alt]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return ['alt' => (new WheelImageRequest)->rules()['alt']];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return array_filter((new WheelImageRequest)->messages(), static fn (string $key): bool => str_starts_with($key, 'alt.'), ARRAY_FILTER_USE_KEY);
    }

    public function alt(): string
    {
        return (string) $this->validated('alt');
    }
}
