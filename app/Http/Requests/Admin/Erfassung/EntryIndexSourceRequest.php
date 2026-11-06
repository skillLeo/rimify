<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Erfassung;

use App\Enums\TyreIndexSource;
use Illuminate\Validation\Rule;

/** Step 5: how the paper gives its tyres' load index and speed symbol, answered by a person (D-277, D-382). */
class EntryIndexSourceRequest extends EntryRequest
{
    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return ['tyre_index_source' => ['required', 'string', Rule::in(TyreIndexSource::values())]];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['tyre_index_source.*' => 'Wähl bitte, wie das Gutachten Lastindex und Geschwindigkeitssymbol angibt.'];
    }

    public function source(): TyreIndexSource
    {
        return TyreIndexSource::from((string) $this->validated('tyre_index_source'));
    }
}
