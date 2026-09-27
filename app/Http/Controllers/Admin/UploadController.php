<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PdfLocalUploadRequest;
use App\Http\Requests\Admin\PdfPresignRequest;
use App\Services\Storage\PdfUpload;
use App\Services\Storage\StorageSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

/**
 * Large PDFs, straight into the bucket (PdfUpload): the form to post to, and — on a machine without a
 * bucket — the app's own stand-in for it. Confirming an upload is the calling feature's step, in the
 * same request that writes its row.
 */
class UploadController extends Controller
{
    public function presign(PdfPresignRequest $request, PdfUpload $uploads): JsonResponse
    {
        return response()->json($uploads->presign());
    }

    public function local(PdfLocalUploadRequest $request, StorageSettings $settings, string $name): Response
    {
        // Only a stand-in: with a bucket in force, the bucket takes the upload.
        abort_if($settings->current()->isBucket(), 404);
        abort_unless(preg_match('/^[0-9a-z]{26}\.pdf$/', $name) === 1, 404);

        $file = $request->file('file');
        abort_unless($file !== null && ! is_array($file), 422);

        Storage::disk('docs_private')->putFileAs(PdfUpload::PENDING, $file, $name);

        return response()->noContent();
    }
}
