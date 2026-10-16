<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Models\ApprovalDocument;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * The page an example document opens through (decision 6, D-239): only a document born demo that the shop shows has
 * one (ApprovalDocumentPolicy::viewExample); for any other the address does not exist — the same 404, never a 403 that
 * says a document is there.
 */
class ExampleDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $document = $this->route('document');

        return $document instanceof ApprovalDocument && Gate::allows('viewExample', $document);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'seite' => ['nullable', 'integer', 'min:1', 'max:9999'],
        ];
    }

    /** The page the answer stands on, or null. */
    public function page(): ?int
    {
        $page = $this->validated('seite');

        return is_numeric($page) ? (int) $page : null;
    }

    protected function failedAuthorization(): void
    {
        throw new NotFoundHttpException;
    }
}
