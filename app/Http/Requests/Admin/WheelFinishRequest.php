<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\WheelFinish;
use App\Models\WheelFinishImage;
use App\Models\WheelModel;
use Illuminate\Foundation\Http\FormRequest;

/**
 * A change to one finish's photographs: the right to edit the model, the finish must be its own, and a
 * photograph named in the URL must be the finish's.
 */
class WheelFinishRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $model = $this->route('model');
        $finish = $this->route('finish');
        $image = $this->route('image');

        return $user instanceof AdminUser
            && $model instanceof WheelModel
            && $finish instanceof WheelFinish
            && $finish->wheel_model_id === $model->id
            && ($image === null || ($image instanceof WheelFinishImage && $image->wheel_finish_id === $finish->id))
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
