<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\Dispute;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Validator;

/**
 * Answering a chargeback (Verkauf › Rückbuchungen): who may change orders; an open dispute not yet answered; the
 * explanation, and up to two files — the proof of delivery and one more — as PDF or picture. The invoice goes with it
 * by itself.
 */
class DisputeEvidenceRequest extends FormRequest
{
    public const ANSWERED = 'Zu dieser Rückbuchung sind die Nachweise schon gesendet. Stripe nimmt keine zweiten an.';

    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $this->dispute() !== null && $user->may(PermissionModule::Orders, PermissionAction::Edit);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'note' => ['required', 'string', 'min:20', 'max:20000'],
            'shipping' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'other' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $dispute = $this->dispute();

            if ($dispute !== null && ($dispute->evidence_submitted_at !== null || ! $dispute->isOpen())) {
                $validator->errors()->add('evidence', self::ANSWERED);
            }
        });
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'note.required' => 'Schreib, was geschehen ist: was bestellt, wann versandt, wann zugestellt – das liest die Bank.',
            'note.min' => 'Schreib, was geschehen ist: was bestellt, wann versandt, wann zugestellt – das liest die Bank.',
            '*.mimes' => 'Als Nachweis ein PDF oder ein Bild (JPG, PNG).',
            '*.max' => 'Eine Datei darf höchstens 5 MB groß sein.',
        ];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser ? $user : abort(403);
    }

    public function dispute(): ?Dispute
    {
        $dispute = $this->route('dispute');

        return $dispute instanceof Dispute ? $dispute : null;
    }

    /** @return array<string, UploadedFile> field => file, only what was sent */
    public function evidenceFiles(): array
    {
        $files = [];

        foreach (['shipping' => 'shipping_documentation', 'other' => 'uncategorized_file'] as $input => $field) {
            $file = $this->file($input);

            if ($file instanceof UploadedFile) {
                $files[$field] = $file;
            }
        }

        return $files;
    }
}
