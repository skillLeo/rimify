<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\ContactMessage;
use Illuminate\Foundation\Http\FormRequest;

/** Marking a contact-form message as read (Verkauf › Nachrichten, D-123), through ContactMessagePolicy::markRead. */
class ContactMessageReadRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $message = $this->route('message');

        return $user instanceof AdminUser && $message instanceof ContactMessage && $user->can('markRead', $message);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser ? $user : abort(403);
    }
}
