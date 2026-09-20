<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\GermanFormat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Gutachten-Erfassung — the screen Rimify's compliance editor lives in.
 *
 * Every row here was typed by a person reading a PDF, which is why the entry workspace matters
 * more than any other admin screen: thirty rows enterable in fifteen minutes is the difference
 * between the catalogue growing and it not.
 */
class GutachtenController extends Controller
{
    public function index(Request $request): Response
    {
        $documents = DB::table('approval_documents as ad')
            ->leftJoin('fitments as f', 'f.approval_document_id', '=', 'ad.id')
            ->groupBy(
                'ad.id', 'ad.report_number', 'ad.kind', 'ad.issuer', 'ad.kba_number',
                'ad.issued_on', 'ad.revision', 'ad.status', 'ad.page_count',
            )
            ->orderByDesc('ad.issued_on')
            ->get([
                'ad.id', 'ad.report_number', 'ad.kind', 'ad.issuer', 'ad.kba_number',
                'ad.issued_on', 'ad.revision', 'ad.status', 'ad.page_count',
                DB::raw('COUNT(f.id) as fitment_count'),
                DB::raw('SUM(f.status = \'published\') as published_count'),
            ]);

        $rows = [];

        foreach ($documents as $row) {
            $rows[] = [
                'id' => (int) $row->id,
                'reportNumber' => (string) $row->report_number,
                'kind' => (string) $row->kind,
                'issuer' => (string) $row->issuer,
                'kbaNumber' => $row->kba_number,
                'issuedOn' => $row->issued_on === null
                    ? null
                    : GermanFormat::date(new \DateTimeImmutable((string) $row->issued_on)),
                'revision' => (int) $row->revision,
                'status' => (string) $row->status,
                'pageCount' => $row->page_count === null ? null : (int) $row->page_count,
                'fitmentCount' => (int) $row->fitment_count,
                'publishedCount' => (int) $row->published_count,
            ];
        }

        return Inertia::render('Admin/Gutachten/Index', [
            'documents' => $rows,
        ]);
    }
}
