# D-486: „Keine Eintragung erforderlich“ is gone

The client's round of 18.11.2026, item 4: with „Nur Felgen“ the RIMIFY-Check box stays, but its green line „Keine
Eintragung erforderlich.“ goes. An Eintragung or Abnahme is stated only from the codes on a combination (the release's
Abnahme answer never fed any wording), and the absence of a code is no statement the shop can stand behind. So the positive statement goes wherever it was printed,
and every statement that comes from a code stays.

## Removed

| Place | What it printed | Now |
|---|---|---|
| Product page, RIMIFY-Check box (`FitmentPanel.vue`) | „Keine Eintragung erforderlich.“ or „Keine Abnahme durch einen Prüfer erforderlich.“ under the headline, for the whole wheel and for a tyre or set chosen | No line where no code requires one. |
| One line per size where sizes differ (`entryBySize`, PHP and TypeScript): product page, Kasse sentence, order page, order confirmation mail, RIMIFY-Check page and its printable copy, admin preview, admin order view | „… erforderlich mit 255/40 R19, nicht mit 235/45 R19 und 245/40 R19.“ | „… erforderlich mit 255/40 R19.“ |
| Warenkorb and the panel after „In den Warenkorb“ (`papersLines`) | The positive line for a rim without an entry code | No line. |
| Vergleich (`CompareTable.vue`) | The positive line in the papers row | No line. |
| Felgen listing filter (`FilterBar.vue`, `FelgenController`) | „Ohne Abnahme und Eintragung“, with its count | Gone. An old bookmark with `ohne_eintragung=1` no longer narrows the listing. |
| Admin help on the Auflage levels (`ConditionLevel`, `Auflagenverzeichnis.vue`) | „… ist keine Eintragung nötig …“ | „… verlangt kein Code eine Eintragung …“ |

Removed from the code as well: `PapersWording::NO_ENTRY`, `NO_ABNAHME`, `entryLineOrNone()` and their TypeScript twins, so
the sentence cannot come back by accident.

## Kept, and why

| Statement | Why it stays |
|---|---|
| „Eintragung in die Fahrzeugpapiere erforderlich.“ and „Abnahme durch einen Prüfer erforderlich (§ 19 Abs. 3 StVZO).“ | They come from a code on the combination. |
| „Keine Berichtigung der Fahrzeugpapiere nötig (§ 15 FZV).“ | It rests on the document's own recorded field (`papers_correction_required`), not on the absence of a code. It now shows whenever the wheel may be fitted, not only beside an entry line. |
| „Laut Prüfer ist keine Eintragung erforderlich: …“ | A person's recorded override, with the reason they gave (`fitments.entry_override_*`). |
| A document's own Auflage that says no Eintragung is needed (the old catalogue's code `A02`) | A quote of the document's own code, recorded in its Auflagenverzeichnis. |

## Orders

Past orders keep their frozen snapshot untouched (R-12). Their confirmation mail was sent as it was. The order page and
the admin order view draw the frozen snapshot with today's wording, so a split line there loses its „nicht mit …“ half too.
No frozen value changes.
