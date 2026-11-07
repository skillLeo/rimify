<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals\Entry;

use App\Models\ApprovalDocument;

/**
 * The way back, proved: what the writer would write for what is entered, against what the shop's tables hold. Equal is the
 * Gutachten rework's mandatory condition for a paper entered before the five steps — its next Fassung then gives the same
 * answers. Nothing is written; it can run on a live database.
 */
final readonly class DocumentEntryProof
{
    public function __construct(private DocumentEntryWriter $writer) {}

    /** @return list<string> every difference, in words; empty where the two are the same */
    public function differences(ApprovalDocument $document): array
    {
        $desired = $this->writer->desired(EntryModel::of($document));
        $actual = EngineRows::actual($document);
        $out = [];

        foreach (array_diff_key($actual['rows'], $desired['rows']) as $key => $row) {
            $out[] = "Zeile {$key} ginge verloren";
        }

        foreach (array_diff_key($desired['rows'], $actual['rows']) as $key => $row) {
            $out[] = "Zeile {$key} käme hinzu";
        }

        foreach (array_intersect_key($desired['rows'], $actual['rows']) as $key => $row) {
            if ($row !== $actual['rows'][$key]) {
                foreach ($row as $field => $value) {
                    if ($value !== $actual['rows'][$key][$field]) {
                        $out[] = "Zeile {$key}: {$field} wäre ".json_encode($value, JSON_UNESCAPED_UNICODE).' statt '.json_encode($actual['rows'][$key][$field], JSON_UNESCAPED_UNICODE);
                    }
                }
            }
        }

        if ($desired['sets'] !== $actual['sets']) {
            $out[] = 'Die Felgensätze wären '.json_encode($desired['sets'], JSON_UNESCAPED_UNICODE).' statt '.json_encode($actual['sets'], JSON_UNESCAPED_UNICODE);
        }

        if ($desired['list'] !== $actual['list']) {
            $out[] = 'Die Kombinationen wären '.json_encode($desired['list'], JSON_UNESCAPED_UNICODE).' statt '.json_encode($actual['list'], JSON_UNESCAPED_UNICODE);
        }

        return $out;
    }
}
