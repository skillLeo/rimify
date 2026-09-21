<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ConditionSeverity;
use Database\Factories\ConditionCodeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * An Auflage or Hinweis, as a first-class row with a stable internal key and editable German
 * wording. The `code` is an internal key — `ARCH_ROLLING`, not the `A02` a particular manufacturer
 * happens to print — and it never reaches a customer; `text_de` does (R-15).
 *
 * @property string $code
 * @property ConditionSeverity $severity
 * @property string $text_de
 * @property bool $affects_tyre_choice
 * @property bool $affects_purchase
 * @property bool $requires_acknowledgement
 * @property string|null $text_en
 * @property-read Pivot|null $pivot
 */
class ConditionCode extends Model
{
    /** @use HasFactory<ConditionCodeFactory> */
    use HasFactory;

    protected $fillable = [
        'code', 'severity', 'text_de', 'text_en',
        'affects_tyre_choice', 'affects_purchase', 'requires_acknowledgement', 'sort_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'severity' => ConditionSeverity::class,
            'affects_tyre_choice' => 'boolean',
            'affects_purchase' => 'boolean',
            'requires_acknowledgement' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /** @return HasMany<ConditionCodeAlias, $this> */
    public function aliases(): HasMany
    {
        return $this->hasMany(ConditionCodeAlias::class);
    }
}
