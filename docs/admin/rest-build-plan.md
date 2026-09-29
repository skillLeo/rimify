# Admin — what is left: build plan

Source: the brief "ADMIN, WHAT IS LEFT" (2026-09-26), in its §8 order. Built sequentially by hand,
one commit per step, no push, no deploy. Each step starts with one line on what already exists and is
reused. Only `ai-look-critic` and `interaction-qa` review, once per finished area, ≤15 lines each.

## Step 1 · Shell gaps

**Reused:** the shell (AdminTopbar, AdminNavigation's data-driven rail, the page pattern), the two
existing accessory-price pages, Laravel's database notifications on `AdminUser`.

| Item | Resolution |
|---|---|
| Bell | Top bar, left of Hilfe. Unread count (99+ cap) shared in `admin.notifications.unread`, computed lazily. The bell opens the latest eight with an unread dot, time and link; „Alle als gelesen markieren“; „Alle Benachrichtigungen“ → the centre. |
| Centre | `/admin/benachrichtigungen` (Team): read and unread, filter Ungelesen/Alle, mark read one or all, and „Was du bekommst“ — per kind: im Admin ja/nein, per E-Mail ja/nein, for the kinds this role may see. |
| Kinds and senders | `order_paid` (orders.view): an order turns Bezahlt. `conflict_opened` (approvals.view): a fitment conflict is opened. `job_failed` (settings.view): a queued job fails (Queue::failing). `stock_low` (catalogue.view): arrives with the Meldebestand in Katalog, not before. Each sender writes through one `AdminAlerts` service: recipients are active accounts whose role may view the area and who have not switched the kind off. |
| Customer subscriptions | The page that sat at `/admin/benachrichtigungen` moves to Verkauf › **Anfragen** (`/admin/anfragen`, the brief's name), same rights (approvals.view), the old path redirects. Step 2 extends it. |
| Accessory prices | Einstellungen › **Zubehörpreise** (`/admin/zubehoerpreise/wuchtgewichte`, `/admin/zubehoerpreise/rdks`), one rail item, a tab row between the two; old paths redirect; rights unchanged (catalogue). Katalog leaves the rail until Felgen exists. |
| Dashboard tiles | Each tile carries one line saying what it counts („Eine Freigabe ist eine Zeile eines Gutachtens: diese Felge an diesem Fahrzeug.“) and links to its list where the list exists. Tiles whose lists come later get their link in that list's step; a test asserts every tile with a built list links to it. |

**Files:** migration `notifications` (choices live in `admin_users.preferences.alerts`, beside the rail's — no second table) · `app/Notifications/AdminAlert.php` (database only, never queued; the link is stored as a route name, so an alert gains its link the day its page is built) · `app/Mail/AdminAlertMail.php` · `app/Services/Admin/AdminAlerts.php` · `OrderAlertObserver`, `ConflictAlertObserver` (after commit), `FailedJobAlert` (one alert per job per 15 minutes, never the error text) · `BenachrichtigungenController` + `AlertPreferencesRequest` + `AdminNotificationPolicy` · the Anfragen move (`AnfragenController` = the old page) · `AdminSectionTabs.vue` + `sectionTabs.ts` · `AdminBell.vue` (top bar and phone app bar) · tests `AdminAlertsTest`, `BenachrichtigungenTest`, updated access/shell/Übersicht tests, Vitest for the bell, the tab row and the centre.

Tile links are resolved against `AdminNavigation::BUILT`: every tile names its list now, and links itself the day that list is added to BUILT.

## Step 2 · Verkauf › Bestellungen

**Reused:** the Protokoll's URL-carried filters (Form Request, Berlin days, the phone filter sheet), `AdminPage` / `AdminState` / the `.adm-table` phone cards, the storefront order page's demo check and its reading of the frozen snapshot (`order_line_fitments`, never recomputed), `GermanFormat`, `AuditTrail`, the Inhalte stale-write check, dompdf (installed).

| Commit | What |
|---|---|
| 2.1 List | `/admin/bestellungen`: Nummer, Datum, Kunde, Summe, Zahlung, Versand, the Demodaten marker. Filters Status, Zeitraum, Zahlart, Versandart (each offers only the values orders actually carry — never an option that finds nothing by construction), Betrag von/bis, nur mit Auflagen. Search by Nummer, E-Mail, Name, Fahrzeug. Sort by Datum, Summe, Status. 25 per page on the server; the URL carries all of it. CSV and XLSX of the current filter (`orders.export`). Schema: `orders.payment_method`, `orders.shipping_method` (nullable until checkout writes them), `order_line_fitments.has_conditions` as a stored generated column — the snapshot is append-only, so nothing is written into it. |
| 2.2 Views | `saved_views` per user and list, optionally shared with a role; the column chooser. Bestellungen first, every later list reuses it. |
| 2.3 Detail | Positions with the frozen snapshot (document, revision, tyre sizes per axle, Auflagen as sentences), VAT lines, shipping, total; meta rail (customer, both addresses, payment, shipping and tracking, tags, internal notes); timeline from the Protokoll. Actions: Status ändern (only the transitions the order machine allows), als versendet markieren with tracking, Stornieren (unpaid orders; a paid one is cancelled through Erstattung). Notes and tags carry the stale-write check. |
| 2.4 Documents | Rechnung and Lieferschein as PDFs from the frozen lines and totals, never today's prices. Invoice numbers are sequential and never reused. The seller's details come from configuration; while they are missing the documents are refused with a sentence that says what to fill in — an invoice without its issuer is not an invoice. |
| 2.5 Bulk | `bulk_operations`: Rechnungen erzeugen, als versendet markieren, exportieren — preview of the first 20, run, undo until the next bulk run on the same orders. Invoices are not undone (a German invoice is cancelled by a credit note, never deleted); the preview says so. |

**Order changed (2026-09-26):** after 2.1 the brief „Die Übersicht und die Shell, auf Agenturniveau“ comes first (below). Steps 2.2–2.5 and the rest of Verkauf resume after it.

Erstattung and Gutschrift arrive with Rücksendungen, behind the Sudo prompt. „E-Mail erneut senden“ arrives with the order confirmation mail — checkout does not send one yet, and a button that resends nothing is a dead action.

## Übersicht und Shell auf Agenturniveau (brief of 2026-09-26, evening)

**Reused:** the rail and topbar, `AdminUserMenu`'s sign-out, the palette's actions, `AdminAlerts` / the bell, `OrderList` (every KPI and table row links into its filtered list), `AdminStatTile`, the Protokoll's describer (Letzte Aktivität), `catalogue_gap_events` + `search_misses` + `fitment_subscriptions` (demand signals the shop already records), `fitments` × `vehicles` × `wheel_configs` (coverage).

| Step | What |
|---|---|
| A · Rail foot | Health row (dot + sentence, polled every 60 s; `SystemHealth` service; opens System › Zustand, a small page built now so the row is never a dead link), „Neu“ quick-action menu built once and shared with the palette's Aktionen (server decides by permission and by whether the target exists), profile row (monogram, name, role, menu upward: Profil, Benachrichtigungen, Tastenkürzel, Abmelden in `--c-bad`). Collapsed: dot, +, avatar. Profile leaves the topbar. Phone: the foot lives in Mehr. Zwei-Faktor, Design and photo upload join the menu when they exist. |
| B · Dashboard frame | 12-column grid, max 1440 px, header with Stand, period switcher (7/30/90/eigen, remembered per user), Vorperiode toggle, CSV and print. Four KPI tiles (Umsatz, Bestellungen, Ø Bestellwert, Offene Bestellungen) with delta against the named previous period and a 40 px sparkline, each a link to its filtered list; explanations move into a tooltip; no data → the sentence, never a zero. Demo orders counted and said so. |
| C · Tables | Neueste Bestellungen (8 rows, chips, Alter) and Zu erledigen (Dokumente zur Prüfung, Konflikte, Anfragen ohne Antwort; Produkte ohne Foto once Felgen exists), each row a link to a page that exists. |
| D · Charts | `d3-scale`, `d3-shape` (maths only) and `culori` (the palette test); chart tokens in `tokens.css`; LineChart (Umsatz daily, crosshair, last point labelled), StackedBar (Verdikte je Woche — from a new daily tally the storefront starts writing now; empty state until it has data), BarChart (Top-Felgen, first bar in the accent). Tabelle anzeigen and CSV per chart; animate only on first paint. |
| E · Abdeckungs-Matrix | Makes × rim diameters, count of variants with ≥ 1 published fitment, sequential ramp, count printed, hover sentence, click to the filtered list; one aggregate query, cached an hour, dropped when a document is published. |
| F · Nachfrage-Lücken | Vehicles asked for without an approved wheel: gap events, search misses, subscriptions, scored by count and recency; „Gutachten anfordern“ (prepared e-mail), „Als beobachtet markieren“. |
| G · Icons | Our own set in `resources/js/icons/admin/`, 20 px grid, 1.5 px stroke, square caps, mitre joins; every nav item and row action; nothing borrowed. |
| H · Finish | Role variants, phone pass, gates at 390/768/1280/1920, the two reviewers, commit. |
