<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

/**
 * One Gespeicherte Ansicht: a list's filters and sort under a name, its owner's, and shared with a
 * role when `role_id` is set (AdminLists names the lists; SavedViewPolicy says who may do what).
 *
 * @property int $id
 * @property int $admin_user_id
 * @property string $list
 * @property string $name
 * @property array<string, string> $query
 * @property int|null $role_id
 */
class SavedView extends Model
{
    use SoftDeletes;

    /** How many views one person keeps for one list: a bar of more is no longer a shortcut. */
    public const MAX_PER_LIST = 30;

    protected $fillable = ['admin_user_id', 'list', 'name', 'query', 'role_id'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['query' => 'array'];
    }

    /** @return BelongsTo<AdminUser, $this> */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'admin_user_id');
    }

    /** @return BelongsTo<Role, $this> */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * The views one person sees on one list: their own, and those shared with a role they hold.
     *
     * @param  Builder<SavedView>  $query
     * @return Builder<SavedView>
     */
    public function scopeVisibleTo(Builder $query, AdminUser $user, string $list): Builder
    {
        $roles = self::roleIdsOf($user);

        return $query->where('list', $list)->where(static function (Builder $q) use ($user, $roles): void {
            $q->where('admin_user_id', $user->id);

            if ($roles !== []) {
                $q->orWhereIn('role_id', $roles);
            }
        });
    }

    /** @return list<int> */
    public static function roleIdsOf(AdminUser $user): array
    {
        return DB::table('model_has_roles')
            ->where('model_type', $user->getMorphClass())
            ->where('model_id', $user->getKey())
            ->pluck('role_id')
            ->map(static fn (mixed $id): int => (int) $id)
            ->all();
    }
}
