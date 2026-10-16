<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Services\Admin\Approvals\CountFigures;
use App\Services\Admin\Approvals\ReleaseDeclaration;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * „Zählen“: what a Gutachten's Verwendungsbereich prints for the vehicles to be entered, read off the PDF before the
 * rows are entered, each figure with its page (ADMIN-GEFUNDEN 511). Counting is part of entering a draft
 * (`approvals` × edit, ApprovalDocumentPolicy::update, R-11). Nothing has a default.
 *
 * Route: POST /admin/gutachten/{document}/zaehlung, error bag `zaehlung` (the release dialog asks other questions).
 */
class DocumentCountRequest extends FormRequest
{
    /** @var string */
    protected $errorBag = 'zaehlung';

    public function authorize(): bool
    {
        $user = $this->user('admin');
        $document = $this->route('document');

        return $user instanceof AdminUser && $document instanceof ApprovalDocument && $user->can('update', $document);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $page = ['integer', 'min:1', 'max:'.$this->lastPage()];

        return [
            'codes' => ['required', 'integer', 'min:0', 'max:999'],
            'codes_page' => ['required', ...$page],
            'sizes' => ['required', 'integer', 'min:1', 'max:99'],
            'sizes_page' => ['required', ...$page],
            'axle_limit_kg' => ['nullable', 'integer', 'min:200', 'max:9999'],
            'axle_limit_page' => [Rule::requiredIf(fn (): bool => $this->filled('axle_limit_kg')), 'nullable', ...$page],
            'abnahme' => ['required', Rule::in(ReleaseDeclaration::ABNAHME)],
            'abnahme_page' => [Rule::requiredIf(fn (): bool => in_array($this->input('abnahme'), [ReleaseDeclaration::ABNAHME_ALL, ReleaseDeclaration::ABNAHME_SOME], true)), 'nullable', ...$page],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        $page = 'Trag die Seite im PDF ein, auf der du das gelesen hast – als ganze Zahl zwischen 1 und '.$this->lastPage().'.';

        return [
            'codes.*' => 'Trag ein, wie viele Auflagen-Codes der Verwendungsbereich für die Fahrzeuge druckt, die du erfassen willst – als ganze Zahl.',
            'sizes.*' => 'Trag ein, wie viele Reifengrößen der Verwendungsbereich für diese Fahrzeuge nennt – als ganze Zahl.',
            'axle_limit_kg.*' => 'Die Achslastgrenze bitte in Kilogramm, als ganze Zahl zwischen 200 und 9999 – oder leer, wenn der Verwendungsbereich keine nennt.',
            'abnahme.*' => 'Sag, ob der Verwendungsbereich eine Abnahme verlangt.',
            'codes_page.*' => $page,
            'sizes_page.*' => $page,
            'axle_limit_page.*' => $page,
            'abnahme_page.*' => $page,
        ];
    }

    public function figures(): CountFigures
    {
        $int = fn (string $key): ?int => $this->validated($key) === null ? null : (int) $this->validated($key);

        return new CountFigures(
            codes: (int) $this->validated('codes'),
            codesPage: (int) $this->validated('codes_page'),
            sizes: (int) $this->validated('sizes'),
            sizesPage: (int) $this->validated('sizes_page'),
            axleLimitKg: $int('axle_limit_kg'),
            axleLimitPage: $int('axle_limit_page'),
            abnahme: (string) $this->validated('abnahme'),
            abnahmePage: $int('abnahme_page'),
        );
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    /** The PDF's last page where it is known; a page beyond it cannot be where something was read. */
    private function lastPage(): int
    {
        $document = $this->route('document');
        $pages = $document instanceof ApprovalDocument ? $document->page_count : null;

        return is_int($pages) && $pages > 0 ? $pages : 999;
    }
}
