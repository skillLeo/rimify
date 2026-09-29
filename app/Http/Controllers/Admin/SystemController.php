<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\SystemHealth;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * System › Zustand — every check behind the rail's health line, each in a sentence (BRIEF-2 §2.12).
 *
 * The page asks for the settings right, like the rest of System. The short answer the rail polls
 * is every signed-in person's: "Alles in Ordnung" or "3 Jobs fehlgeschlagen" tells nobody anything
 * they may not know, and the whole team should see when the shop is in maintenance mode.
 */
class SystemController extends Controller
{
    public function index(SystemHealth $health): Response
    {
        $report = $health->report();

        return Inertia::render('Admin/System/Index', [
            'report' => $report,
            'checkedAt' => GermanFormat::dateTime(CarbonImmutable::parse($report['checkedAt'])),
        ]);
    }

    /** The rail's line: state, its short form and the sentence — never the checks behind it. */
    public function pulse(SystemHealth $health): JsonResponse
    {
        $report = $health->report();

        return response()->json([
            'state' => $report['state'],
            'sentence' => $report['sentence'],
            'label' => $report['label'],
            'count' => $report['count'],
        ]);
    }
}
