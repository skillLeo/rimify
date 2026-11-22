# The three switches of Part A (brief of 22.11.2026)

All three are built, tested and **off**. They live on the branch `part-a` and reach no release until the operator writes
„release A1“, „release A2“ or „release A4“. Each is one line in the host's `.env`, read through `App\Support\Switches`.

| Switch | `.env` line to turn it on | Decision | Test files |
|---|---|---|---|
| A1 · one dropdown (D6) | `RIMIFY_SWITCH_D6_DROPDOWNS=true` | D-509 | `resources/js/Pages/Produkt/Index.test.ts` (A1 block), `tests/Feature/Storefront/D6SwitchTest.php` |
| A2 · Teilegutachten → Abnahme (option Q) | `RIMIFY_SWITCH_TEILEGUTACHTEN_ABNAHME=true` | D-505 | `tests/Feature/Fitment/TeilegutachtenAbnahmeTest.php` |
| A4 · Auflagen only for the sizes chosen | `RIMIFY_SWITCH_SCOPED_AUFLAGEN=true` | D-506 | `tests/Feature/Storefront/ScopedAuflagenTest.php` |

## Turning one on, and back off (rollback)

1. Release `part-a` once (a normal release; with every switch off it changes no answer — census of the preview copy:
   42 of 42 identical).
2. On the host: add the line to `.env`, then `php artisan config:cache`. No migration, no data change. The catalogue caches
   key on the switches (`CatalogueVersion::key`), so no answer cached before the change is read after it.
3. **Rollback:** remove the line (or set it to `false`), `php artisan config:cache`. Seconds; nothing to restore.
   - A2 and A4 change what a **new** order freezes. Orders placed while a switch was on keep, on every page and in their
     mail, what they were sold with — turning the switch off does not rewrite them, and must not (R-12).

## A1 · one dropdown for every dimension and every combination

**What changes for the customer.** On a wheel's page the diameter chips, the version tiles and the set tiles become one
list. Under „Nur Felgen“ it is called „Ausführung“ and holds every size of the colour, grouped by diameter, each with its
price per rim, and the front/rear sets with their price for four. Under „Kompletträder“ it is called „Kombination“ and holds
four alike, then the front/rear sets. A version the car may not have stays in the list, greyed, with the reason. Everything
after the choice — the RIMIFY-Check box, the amount, the price, the basket, the Komplettrad steps, the PDFs — is unchanged.

**Proof.** 5 component tests (off by default; every diameter listed and chosen as a chip would; a set listed whole with
both axles and never one half alone; „Kombination“ in Komplettrad mode; a refused version disabled with its reason) and
2 feature tests (shipped off in the first response, on where the env says so, caches keyed). Screenshots from a local build
on the preview's data copy, switch on and off, at 1440 and 390: `resume/r51/a1/shots/` (not in git).

**What is awkward.**
- A closed dropdown cuts a long set label at 390 („Vorne 2 × 8,5 × 18 ET 25 · Hinten 2 × 8,5 × 1…“). The two lines under it
  and the price bar say the whole set, but the list itself is hard to scan on a phone.
- In „Kompletträder“, a four-alike version whose Komplettrad is one of the paper's tyre combinations reads „ab 2.410,00 € für
  2 + 2“ while others read „pro Rad“ — the same unit problem the tiles have, made more visible in one list.
- A set in „Kompletträder“ shows no price in the list: its price exists only once the tyres are chosen.
- The set labels come from the server as „8,5 × 18“, the versions as „Breite 8,5J“: two notations in one list.
- A native dropdown cannot show the RIMIFY-Check colour or a „Auf Anfrage“ tag beside an entry; they are words in the line.

## A2 · a Teilegutachten states the Abnahme (option Q)

**What changes for the customer.** For a wheel approved by a Teilegutachten, every combination says that the car must be
shown to a Prüfer after fitting, and that the Eintragung is needed — in the RIMIFY-Check box, on the product page, in the
basket, in the Kasse, in the confirmation mail, on the order page and on the Check page. Such a wheel is then never „plain
green“. Where a Prüfer has written an exception on the row, with a reason, the customer reads the Prüfer's word instead.

**The sentence is a placeholder** until the client words it: „[Platzhalter] Teilegutachten: Abnahme durch einen Prüfer
erforderlich.“, kept in one place, `app/Domain/Fitment/Rules/TeilegutachtenAbnahme.php` (`SENTENCE_DE`).

**On the preview's data.** No published paper is a Teilegutachten, so no answer changes today. Draft 17 (BMW 3er Coupé 346C ×
8,5J × 18 ET 30, 2 rows), once released, would gain the sentence and the Eintragung on both rows; it stays „mit Auflagen“, and
no sentence it says today is lost. (On the local demo shop, with nine Teilegutachten: 855 of 2,039 answers stricter, none
looser, no sentence lost — the Task 4 experiment.)

## A4 · Auflagen only for the sizes chosen

**What changes for the customer.** For a Komplettrad, the answer names only the Auflagen the paper prints for the tyre sizes
actually chosen, and leaves out those printed beside another size of the same row. That is **less strict** than today (D-501,
where every Auflage of the row is said for every set). Where nothing is left, the set reads „Für dein Fahrzeug
freigegeben.“ instead of „mit Auflagen“, in the tyre step, the basket, the Kasse, the order and its mail. The rim alone,
and any answer that is not „mit Auflagen“, is unchanged.

**On the preview's data.** 40 of 68 Komplettrad sets would say less, in 14 answers; 38 of those sets are demo cars. The two
real ones are the BMW 330CI × Borbet DB8GT2 8J × 18 ET 35, combination Nr. 2, on both of its rows: „Braucht eine Abnahme.“
(printed beside another size) is no longer said, and the answer turns from „mit Auflagen“ to „freigegeben“. That is exactly
order 2611-11406's case. Full list: `resume/r51/a4/preview.json` (not in git).

**Why it is less strict, and what keeps it safe.** It trusts that an Auflage printed beside one size binds only that size.
A size the answer cannot name keeps every Auflage; the tyre limits are never scoped away; and anything but a „mit Auflagen“
answer is returned as it is (`ScopedAnswer`). Whether the paper means it so is the client's to confirm — the operator's
answer of 21.11.2026: not until he says yes.
