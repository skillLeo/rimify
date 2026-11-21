# D-485: the two questions in „Gutachten freigeben“

The client's round of 18.11.2026, item 2: remove both questions from the popup and let the shop fail closed without
them. This page lists where each answer was read before the change and what reads it now. The reasons are in
`docs/decisions.md`, D-485. It replaces the part of D-227 that said the question is „asked at every release, never
defaulted“; D-227's reading of the answer (a car the paper does not name is „nicht freigegeben“ only after an explicit
„alle erfasst“) stays.

## Question 1: „Sind alle Anlagen und alle Fahrzeuge dieses Gutachtens erfasst?“

Stored in `approval_documents.completeness` (`complete`, `partial`, `unknown`, or `NULL` for unanswered), with who,
when and for which revision.

| Where it is read | Before | Now |
|---|---|---|
| Verdict engine, `EloquentFitmentRepository::incompleteDocumentsFor()` | A car the paper does not name: `NOT_PERMITTED` („nicht freigegeben“) where `complete`, otherwise `UNKNOWN` („noch nicht bestätigt“). Unanswered already read as partial. | Unchanged. Through the engine this reaches the product page, the listing card, the RIMIFY-Check page with its PDF and share link, the basket check and the order snapshot. |
| Release door, `DocumentRelease::release()` and `declarationBlockers()` | Refused the release without an answer, and a partial answer without the missing Anlagen. | Asks nothing. A new paper stays unanswered, so a car it does not name is „noch nicht bestätigt“. |
| Popup, `ReleaseDialog.vue` | The question, with a preset for a Teilegutachten. | Gone. The popup says what goes live, what an unnamed car gets, and has one „Freigeben“ button. |
| Paper's page, `Show.vue`, and entry step 5, `StepRelease.vue` | „Ist alles erfasst?“ dialog, on a released paper only. | The switch „Alle Fahrzeuge dieses Gutachtens sind erfasst“, on a draft or a released paper. Off by default, never blocks a release. It cannot be turned on while „Angaben“ names missing Anlagen, and it never changes them. |
| Go-live, `GoLiveChecks::liveRefusal()` | Held real payments while a released paper was unanswered. | No longer holds them: unanswered is the safe reading. |
| Go-live, `GoLiveChecks::annexes()` | Missing until every released paper said `complete`. | Met once a paper is released; it still names each paper not switched on. |
| Command line, `rimify:gutachten-freigeben` | `--erfasst` required. | `--erfasst` optional. Without it the paper stays unanswered, as in the browser. |
| New revision, `DocumentRevision` | Not carried over. | Unchanged: a new revision starts unanswered. |
| `DocumentRecord::assertedComplete()` | Defined, read nowhere. | Unchanged. |

Existing papers keep their stored answer exactly as it is. No migration touches the column.

## Question 2: „Verlangt der Verwendungsbereich eine Abnahme?“ with its page

| Where it is read | Before | Now |
|---|---|---|
| Release door, `declarationBlockers()` | Compared with the entry: „bei jeder“ with a row without an Abnahme code, „bei einigen“ with none, „Nein“ with one, each refused the release (the red message). | Gone. |
| Protokoll, `approval.released` | Kept as `declared`. | Releases since D-485 keep what was entered (`entered`: codes, sizes, rows with and without an Abnahme) and no declaration. Older entries keep theirs and still read the same. |
| Storefront wording: „Eintragung erforderlich“, „Abnahme durch einen Prüfer erforderlich“, „Keine Eintragung erforderlich“ | **Never read from this answer.** It comes from `fitments.requires_entry`, which the entry sets from the codes of each combination, through `PapersWording`. | Unchanged. The requirement comes from the codes alone, so every requirement notice that exists today stays. Item 4 deals with the positive „Keine Eintragung erforderlich“. |
| The page number (`abnahme_page`) | Validated at release, then **stored nowhere**: not on the paper, not in the Protokoll. This has been so since the field was added. | Nothing to migrate. Where an Abnahme is printed stays on record through its code: the code's own page in the Auflagenverzeichnis (`document_conditions.source_page`) and the row's page behind „Gutachten öffnen (PDF, Seite N)“. |
| `counted_abnahme`, `counted_abnahme_page` (the count step of D-440) | Written before 08.11.2026, read only by the Protokoll. | Untouched. |

## Stop conditions

- **A verdict on an existing paper changes:** no. No stored answer and no row changes, and the engine reads the same columns.
- **A verdict gets less strict:** no. A new paper is read as partial, which is the stricter of the two readings.
- **A requirement notice disappears:** no. Requirements come from the codes, as before.
- **A place that needs the old answer to avoid a wrong statement:** none found. The Abnahme answer was never used for wording, and an unanswered completeness was already read the safe way.
