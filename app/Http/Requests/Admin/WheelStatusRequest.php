<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\WheelModel;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

/**
 * One Felge into the shop, out of it, into the archive or back (WheelModelPolicy): the route names
 * the step, the Policy decides — publishing and taking out need the right to publish, archiving and
 * bringing back the right to delete. A demo model is refused with the Policy's own sentence.
 */
class WheelStatusRequest extends FormRequest
{
    /** Route name suffix => the Policy ability it needs. */
    public const STEPS = [
        'veroeffentlichen' => 'publish',
        'zurueckziehen' => 'publish',
        'archivieren' => 'archive',
        'wiederherstellen' => 'archive',
    ];

    public function authorize(): bool
    {
        $user = $this->user('admin');
        $model = $this->route('model');

        if (! $user instanceof AdminUser || ! $model instanceof WheelModel) {
            return false;
        }

        $response = Gate::forUser($user)->inspect($this->ability(), $model);

        // The Policy's sentence (a demo model) reaches the page as a 403 with words, not a bare refusal.
        if ($response->denied() && $response->message() !== null) {
            throw new AuthorizationException($response->message());
        }

        return $response->allowed();
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [];
    }

    public function step(): string
    {
        $name = (string) $this->route()?->getName();

        return substr($name, (int) strrpos($name, '.') + 1);
    }

    private function ability(): string
    {
        return self::STEPS[$this->step()] ?? 'publish';
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    public function wheelModel(): WheelModel
    {
        $model = $this->route('model');

        if (! $model instanceof WheelModel) {
            abort(404);
        }

        return $model;
    }
}
