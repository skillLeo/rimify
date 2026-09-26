<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * One question and its answer, shown on /faq under its group and — the first five by order — on
 * the homepage. Edited in Inhalte › FAQ; there is no draft: a visible entry changes on the shop the
 * moment it is saved, which is why changing one takes the right to publish.
 *
 * @property int $id
 * @property string $group_key
 * @property string $question_de
 * @property string $answer_de
 * @property int $sort_order
 * @property bool $published
 * @property Carbon|null $team_edited_at
 */
class FaqEntry extends Model
{
    /**
     * The groups /faq shows, in its order. The key is also the heading a visitor reads, so it is
     * chosen from this list, never typed.
     */
    public const GROUPS = ['KOMPATIBILITÄT & FREIGABE', 'BESTELLUNG & VERSAND'];

    /** Limits that keep an accordion row readable: a question on one or two lines, an answer that is not a page. */
    public const QUESTION_MAX = 120;

    public const ANSWER_MAX = 800;

    /**
     * The setting that says the team has taken the FAQ over, kept beside the rows' own stamps: with
     * every question deleted no row is left to carry one (FragenController, ContentSeeder).
     */
    public const TEAM_OWNED_SETTING = 'content.faq_team_edited_at';

    protected $fillable = ['group_key', 'question_de', 'answer_de', 'sort_order', 'published', 'team_edited_at'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'published' => 'boolean',
            'team_edited_at' => 'datetime',
        ];
    }
}
