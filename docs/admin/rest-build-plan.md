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
