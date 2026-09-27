<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use Illuminate\Foundation\Http\FormRequest;

/** Taking the photograph off one finish: the right to edit the model, and the finish must be its own. */
class WheelFinishRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $model = $this->route('model');
        $finish = $this->route('finish');

        return $user instanceof AdminUser
            && $model instanceof WheelModel
            && $finish instanceof WheelFinish
            && $finish->wheel_model_id === $model->id
            && $user->can('update', $model);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [];
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
