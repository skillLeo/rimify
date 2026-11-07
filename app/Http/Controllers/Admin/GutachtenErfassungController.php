<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Requests\Admin\ApprovalStepRequest;
use App\Http\Requests\Admin\Erfassung\EntryCarsRequest;
use App\Http\Requests\Admin\Erfassung\EntryCellRequest;
use App\Http\Requests\Admin\Erfassung\EntryCombinationRequest;
use App\Http\Requests\Admin\Erfassung\EntryCopyRequest;
use App\Http\Requests\Admin\Erfassung\EntryIndexSourceRequest;
use App\Http\Requests\Admin\Erfassung\EntryLinesRequest;
use App\Http\Requests\Admin\Erfassung\EntryRequest;
use App\Http\Requests\Admin\Erfassung\EntryWheelRequest;
use App\Models\ApprovalDocument;
use App\Models\DocumentCarEntry;
use App\Models\DocumentWheelCombination;
use App\Models\Vehicle;
use App\Services\Admin\Approvals\Entry\EntryEditor;
use App\Services\Admin\Approvals\Entry\EntryView;
use App\Services\Admin\Approvals\Entry\VehicleSearch;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\AuditTrail;
use App\Services\Storage\DocumentFiles;
use App\Support\EditStamp;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * The five steps' saves (the Gutachten rework, Phase 2): each answers with the state the page redraws from, so what staff
 * see is what was stored. The rows the shop reads are written in the same transaction (DocumentEntryWriter), while the
 * document is a draft; the release door stays the only way into the shop.
 */
class GutachtenErfassungController extends Controller
{
    public function __construct(private readonly EntryEditor $editor, private readonly EntryView $view) {}

    public function wheel(EntryWheelRequest $request, ApprovalDocument $document): JsonResponse
    {
        $this->editor->savePrinted($document, $request->printed(), $request->admin());

        return $this->state($document);
    }

    public function addCombination(EntryCombinationRequest $request, ApprovalDocument $document): JsonResponse
    {
        $this->editor->addCombination($document, $request->front(), $request->rear(), $request->admin());

        return $this->state($document);
    }

    public function changeCombination(EntryCombinationRequest $request, ApprovalDocument $document, DocumentWheelCombination $combination): JsonResponse
    {
        $this->editor->changeCombination($document, $combination, $request->front(), $request->rear(), $request->admin());

        return $this->state($document);
    }

    public function removeCombination(EntryRequest $request, ApprovalDocument $document, DocumentWheelCombination $combination): JsonResponse
    {
        $left = DocumentWheelCombination::query()->where('approval_document_id', $document->id)->whereKeyNot($combination->id)->exists();

        if (! $left && DocumentCarEntry::query()->where('approval_document_id', $document->id)->exists()) {
            throw ValidationException::withMessages(['combination' => 'Solange Fahrzeuge im Gutachten stehen, braucht es mindestens eine Felgenkombination. Ändere sie, oder nimm zuerst die Fahrzeuge heraus.']);
        }

        $this->editor->removeCombination($document, $combination, $request->admin());

        return $this->state($document);
    }

    public function addCars(EntryCarsRequest $request, ApprovalDocument $document, VehicleSearch $search): JsonResponse
    {
        if (DocumentWheelCombination::query()->where('approval_document_id', $document->id)->doesntExist()) {
            throw ValidationException::withMessages(['vehicle_ids' => 'Wähl zuerst in Schritt 2 die Felgenkombination dieses Gutachtens.']);
        }

        $term = $request->validated('treffer');
        $ids = is_string($term)
            ? $search->ids($term, EntryCarsRequest::MAX + 1)
            : array_map(static fn (mixed $id): int => (int) $id, (array) $request->validated('vehicle_ids'));

        if (count($ids) > EntryCarsRequest::MAX) {
            throw ValidationException::withMessages(['treffer' => 'Das sind mehr als 500 Treffer. Grenz die Suche ein, etwa mit der Betriebserlaubnis.']);
        }

        $added = $this->editor->addCars($document, $ids, $request->admin());

        return $this->state($document, ['added' => $added]);
    }

    public function removeCar(EntryRequest $request, ApprovalDocument $document, DocumentCarEntry $entry): JsonResponse
    {
        $this->editor->removeCar($document, $entry, $request->admin());

        return $this->state($document);
    }

    public function removeCell(EntryRequest $request, ApprovalDocument $document, DocumentCarEntry $entry): JsonResponse
    {
        $this->editor->removeCell($document, $entry, $request->admin());

        return $this->state($document);
    }

    public function addCell(EntryCellRequest $request, ApprovalDocument $document): JsonResponse
    {
        $this->editor->addCell($document, $request->combination(), $request->vehicle(), $request->admin());

        return $this->state($document);
    }

    public function car(ApprovalStepRequest $request, ApprovalDocument $document, DocumentCarEntry $entry): JsonResponse
    {
        abort_unless($entry->approval_document_id === $document->id, 404);
        $lines = $this->view->lines($entry);

        return response()->json([...$lines, 'stamp' => EditStamp::of($lines)]);
    }

    public function saveCar(EntryLinesRequest $request, ApprovalDocument $document, DocumentCarEntry $entry): JsonResponse
    {
        DB::transaction(function () use ($request, $entry): void {
            // The car as it is now, held: a save from a form opened on another state is refused (EditStamp, F-25).
            $locked = DocumentCarEntry::query()->lockForUpdate()->findOrFail($entry->id);
            EditStamp::guard($request, $this->view->lines($locked));
            $this->editor->saveCar($locked, $request->lines(), $request->codes(), $request->columns(), $request->admin());
        });

        $fresh = $entry->fresh();

        return $this->state($document, ['car' => $this->view->lines($fresh ?? $entry), 'stamp' => EditStamp::of($this->view->lines($fresh ?? $entry))]);
    }

    public function copy(EntryCopyRequest $request, ApprovalDocument $document, DocumentCarEntry $entry): JsonResponse
    {
        $result = $this->editor->copy($entry, $request->targets(), $request->replacing(), $request->admin(), $request->dryRun());

        return $request->dryRun()
            ? response()->json(['preview' => $result])
            : $this->state($document, ['copied' => $result]);
    }

    /**
     * The paper on our own address, inline, so the entry can show it beside the form (D-389): the browser's viewer may frame it
     * from our own pages only. Who may see the Gutachten may read it; a file on the bucket comes through here as well.
     */
    public function pdf(ApprovalStepRequest $request, ApprovalDocument $document, DocumentFiles $files): StreamedResponse
    {
        $key = $document->pdf_key;
        abort_if($key === null, 404);
        $disk = $files->current()->exists($key) ? $files->current() : $files->local();
        abort_unless($disk->exists($key), 404);
        $request->attributes->set(SecurityHeaders::FRAME_SAME_ORIGIN, true);
        request()->attributes->set(SecurityHeaders::FRAME_SAME_ORIGIN, true);

        return response()->stream(static function () use ($disk, $key): void {
            $stream = $disk->readStream($key);

            if (is_resource($stream)) {
                fpassthru($stream);
                fclose($stream);
            }
        }, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="gutachten-'.$document->id.'.pdf"',
            'Cache-Control' => 'private, max-age=600',
        ]);
    }

    /** „Daten geprüft“: a person answers for a car's data, on the record. */
    public function confirmCar(EntryRequest $request, ApprovalDocument $document, DocumentCarEntry $entry): JsonResponse
    {
        /** @var Vehicle|null $car */
        $car = $entry->vehicle;

        if ($car === null || $car->trashed()) {
            throw ValidationException::withMessages(['entry' => 'Dieses Fahrzeug wurde entfernt.']);
        }

        // „Daten geprüft“ changes the car, not the paper: it takes the right to edit cars as well (R-11).
        abort_unless($request->admin()->can('update', $car), 403);

        $this->editor->confirmCar($document, $car, $request->admin());

        return $this->state($document);
    }

    public function indexSource(EntryIndexSourceRequest $request, ApprovalDocument $document): JsonResponse
    {
        DB::transaction(static function () use ($request, $document): void {
            $document->forceFill(['tyre_index_source' => $request->source()->value])->save();
            AuditTrail::record($request->admin(), 'approval.index_source_answered', ['document' => FitmentRows::label($document), 'source' => $request->source()->value], $document);
        });

        return $this->state($document);
    }

    /** @param array<string, mixed> $extra */
    private function state(ApprovalDocument $document, array $extra = []): JsonResponse
    {
        return response()->json([...$extra, 'entry' => $this->view->of($document)]);
    }
}
