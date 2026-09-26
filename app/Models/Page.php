<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A public page whose words the client's team edits in Inhalte › Seiten.
 *
 * What the storefront prints lives in `page_blocks`; `draft` is the editor's working copy and is
 * read only by the signed preview. PageSchema says which pages are editable and what each holds.
 *
 * @property int $id
 * @property string $slug
 * @property string $locale
 * @property string $kind
 * @property string $title
 * @property string|null $meta_title
 * @property string|null $meta_description
 * @property string $status
 * @property Carbon|null $published_at
 * @property array<string, mixed>|null $draft
 * @property Carbon|null $draft_updated_at
 * @property string|null $draft_author_email
 * @property bool $lawyer_reviewed
 * @property Carbon|null $team_edited_at
 * @property int $content_version
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Page extends Model
{
    public const KIND_MARKETING = 'marketing';

    public const KIND_GUIDE = 'guide';

    public const KIND_LEGAL = 'legal';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_DRAFT = 'draft';

    /** The homepage is the one marketing page whose blocks the storefront prints. */
    public const HOME_SLUG = 'startseite';

    protected $fillable = [
        'slug', 'locale', 'kind', 'title', 'meta_title', 'meta_description', 'status', 'published_at',
        'draft', 'draft_updated_at', 'draft_author_email', 'lawyer_reviewed', 'team_edited_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'draft' => 'array',
            'draft_updated_at' => 'datetime',
            'lawyer_reviewed' => 'boolean',
            'team_edited_at' => 'datetime',
            'content_version' => 'integer',
        ];
    }

    /**
     * Stamps the page as the team's the first time they change it; every PagePublisher write
     * calls this. ContentSeeder reads the stamp and never writes over such a page again.
     */
    public function markTeamEdited(): void
    {
        if ($this->team_edited_at === null) {
            $this->team_edited_at = now();
        }
    }

    /** @return HasMany<PageBlock, $this> */
    public function blocks(): HasMany
    {
        return $this->hasMany(PageBlock::class)->orderBy('sort_order')->orderBy('id');
    }

    /** @return HasMany<PageRevision, $this> */
    public function revisions(): HasMany
    {
        return $this->hasMany(PageRevision::class)->orderByDesc('id');
    }

    /**
     * The pages Inhalte › Seiten lists: those whose words the storefront prints.
     *
     * @param  Builder<Page>  $query
     * @return Builder<Page>
     */
    public function scopeEditable(Builder $query): Builder
    {
        return $query->where(function (Builder $editable): void {
            $editable->whereIn('kind', [self::KIND_GUIDE, self::KIND_LEGAL])
                ->orWhere(fn (Builder $home) => $home->where('kind', self::KIND_MARKETING)->where('slug', self::HOME_SLUG));
        });
    }

    public function isEditable(): bool
    {
        return in_array($this->kind, [self::KIND_GUIDE, self::KIND_LEGAL], true)
            || ($this->kind === self::KIND_MARKETING && $this->slug === self::HOME_SLUG);
    }

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    /** Where the page is on the shop. */
    public function href(): string
    {
        return match ($this->kind) {
            self::KIND_GUIDE => '/ratgeber/'.$this->slug,
            self::KIND_LEGAL => '/rechtliches/'.$this->slug,
            default => '/',
        };
    }
}
