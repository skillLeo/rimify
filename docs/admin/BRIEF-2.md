# RIMIFY — Admin, Teil 2
## The page builder, the super-admin powers, security, motion, and the phone

Part 1 (`BRIEF.md`) defined the shell, the roles, the working areas and the charts. This part adds
what makes the admin feel like a product the client's team owns: they change every public page
themselves, the super-admin has real tools instead of a settings form, security is at the level a
shop with customer data needs, and the motion is deliberate.

**Same rules as before:** DIRECTION tokens only, the eight agents, the loop, gates G1–G9, German in
the informal *du*, no gradient blobs, no icon libraries. **Nothing invented that has no data behind
it.** Commit in small steps. **Do not deploy.**

Sections 1–8 below are the client's brief. Section 9 is the implementer's notes against the code that
already exists — marked as such, so the two are never confused.

---

## 1 · The page builder — the client changes everything, without us

**Model.** A public page is an ordered list of typed sections: `pages` (slug, title, meta, state),
`page_sections` (page_id, type, position, settings JSON), `page_revisions` (full JSON snapshot,
author, note, created_at). Every section type has a PHP DTO and a JSON schema; settings are validated
on save, never stored free-form. The storefront renders from this, so what the editor shows is what
visitors get.

**Section library**, each with its own settings: Hero mit Fahrzeugauswahl · Versprechen-Zeile ·
Gutachten-Geschichte · Felgen-Reihe · Zollgrößen · Marken · Dunkles Band (Kompletträder) ·
Felgenbezeichnung erklärt · Rechner-Teaser · Ratgeber · Service und FAQ · Hinweisleiste · Freitext mit
Bild · Zwei-Spalten-Text · Bildband · CTA-Band.

**Editing.** Sections list on the left, live preview on the right in a device frame (Desktop / Handy),
rendered with the real storefront components. Per section: reorder by drag **and** by keyboard — the row
has „nach oben" / „nach unten" buttons, because drag alone is not accessible — enable or disable
without deleting, duplicate, and delete into the trash. Adding a section opens a picker with a
thumbnail and one line describing each type.

**Product rows are rules, not lists.** A Felgen-Reihe is filled manually (pick products, order them)
or by a rule: brand, size, price below X, newest, most approvals, fits the visitor's vehicle. The
editor shows live which products the rule returns right now, and warns when it returns fewer than the
row needs.

**Guard rails, so content cannot break the design.** Character counters that match what the layout
holds — the limit from the section's schema, not a guess — required alt text, image aspect and minimum
resolution enforced at upload, and a **publish check** that runs before anything goes live: no missing
image, no empty required field, no text over the limit, no horizontal overflow at 390 px, the hero
image present for LCP. A failing check blocks publishing and says exactly which section and which
field. **This is the feature that keeps the shop looking designed after it is handed over.**

**Workflow.** Draft, preview by signed link (shareable, expires), schedule for a date and time,
publish. Revisions with a field-level diff, „mit Live vergleichen", restore in one click. Legal pages
carry the „vom Anwalt geprüft" flag and a second-person approval (§2.2).

**Navigation and footer** are edited the same way: items, labels, targets, order, and which of them
appear in the mobile bottom bar.

---

## 2 · Super-admin powers — the tools missing from most panels

1. **Ansicht als** — view the shop as any role, or as a specific customer, without their password. A
   red bar across the top names who you are impersonating and offers „Beenden". Time-boxed to 30
   minutes, every action inside it written to the audit log with **both** identities, and never
   allowed for payment actions.
2. **Vier-Augen-Prinzip (optional per area)** — price changes, legal pages and role changes can require
   a second person. The change becomes a `change_request` with the payload, a diff, the requester and a
   state; approvers see a queue; approval applies it, rejection returns it with a comment. Off by
   default, switched on per area by the super-admin.
3. **Papierkorb für alles** — every deletable record soft-deletes into a 30-day trash with the record's
   name, who deleted it and a one-click restore. A nightly job purges older entries. Nothing in this
   admin is ever lost by a misclick.
4. **Sammelbearbeitung mit Rücknahme** — every bulk action (price change, publish, stock, brand) runs as
   a job that stores what it changed, shows a preview of the first 20 affected rows before it runs, and
   offers „Rückgängig machen" until the next bulk action on the same records.
5. **Medienbibliothek** — every image once, with tags, focal point, alt text, automatic AVIF/WebP
   variants, a usage list („wird verwendet in …") and „überall ersetzen" that swaps an image in every
   place it appears.
6. **Feature-Schalter** — on or off per environment and per role, with a note explaining what each does
   and a kill switch that takes effect without a deploy.
7. **Benachrichtigungsregeln** — „bei neuer Bestellung", „bei Gutachten-Konflikt", „bei Bestand unter
   Schwelle" to a role or a person, by e-mail now and other channels later; each user sets their own
   preferences; a daily digest option.
8. **Geplante Aufgaben** — what runs, when it last ran, what it produced, and „jetzt ausführen" for the
   safe ones (imports, exports, cache warm-up).
9. **Exporte** — every list exports to CSV and XLSX with the current filters; an export can be
   scheduled (weekly orders by e-mail, monthly catalogue).
10. **Import mit Zuordnung** — CSV/XLSX with a column-to-field mapping screen, saved mapping templates,
    a dry run showing created / updated / skipped with reasons, and a history that can be rolled back.
11. **Konfiguration sichern** — settings, content and section layouts export as one JSON snapshot and
    import back, so a working state can be restored and moved between environments.
12. **Systemzustand** — queue depth, failed jobs with retry, mail delivery, storage, last deployment,
    error rate over 24 h, each with a plain German sentence („Alles in Ordnung" / „3 Jobs
    fehlgeschlagen, ältester vor 2 Stunden").
13. **Erste Schritte** — a checklist for the client's first week (Logo, Rechtstexte, Versandarten,
    Zahlarten, erstes Produkt, erstes Gutachten) with progress, dismissible once complete.
14. **Gespeicherte Ansichten und Spaltenwahl** — per user, per list: filters, sort, visible columns,
    shareable with a role.
15. **Audit-Log mit Rücknahme** — every entry shows the before/after diff; a single change can be
    reverted from the log.
16. **API-Token und Webhooks** — scoped tokens for supplier feeds and future integrations, with a call
    log, and webhooks on order, product and document events.

---

## 3 · Security — the level a shop with customer data needs

- **Zwei-Faktor (TOTP)**, mandatory for every admin role: QR setup, ten recovery codes shown once,
  „dieses Gerät 30 Tage merken", reset by a super-admin with an audit entry.
- **Sudo-Modus:** re-entering the password unlocks sensitive actions for 15 minutes — role and
  permission changes, refunds, branding, deleting data, API tokens, impersonation.
- **Anmeldung:** rate limiting with increasing delay, lockout after repeated failures, an e-mail to the
  user on a login from a new device, failed logins visible in the admin.
- **Sitzungen:** active sessions per user with device, IP and last activity, „abmelden" per session and
  „überall abmelden", an idle timeout with a warning dialog, and an absolute lifetime.
- **Passwörter:** at least twelve characters, checked against known-breached passwords, no forced
  rotation, and a strength meter that measures rather than scolds.
- **Uploads:** type checked by content, not by extension; size limits; images re-encoded on upload so
  EXIF and GPS are stripped; files stored outside the web root and served through signed URLs.
- **Server:** CSP with a nonce, HSTS, frame-ancestors, referrer policy, secure and same-site cookies;
  every form CSRF-protected; every admin route behind a policy; signed URLs for previews.
- **The audit log is append-only** — a database trigger rejects UPDATE and DELETE, the same mechanism
  the order snapshot uses. Retention is configurable and documented.
- **DSGVO-Werkzeuge:** a queue of export and deletion requests with a documented flow, retention rules
  per data type, the processor list, and cookie settings that match what actually runs.
- **Tests that prove it:** 2FA cannot be skipped; sudo actions fail without re-auth; an UPDATE against
  the audit table fails; an impersonated session cannot pay or refund; every admin route returns 403
  for a role without the permission; an upload of a renamed executable is rejected.

---

## 4 · Motion — deliberate, and the same everywhere

Durations and easings from the tokens. **Transform and opacity only.**

| Moment | Motion |
|---|---|
| Drawer, sheet, flyout | 240 ms in with `--ease-out`, 180 ms out |
| Dialog | 180 ms fade with a 2 % scale from 0.98 |
| Toast | 160 ms slide and fade, **one at a time** |
| Save bar appearing | 140 ms |
| A row just created or updated | one 600 ms fade of a tint, then nothing |
| A deleted row | collapses in 160 ms, with the undo toast |
| Chart first paint | line draws in 300 ms, bars grow from the baseline in 240 ms, stagger ≤ 30 ms |
| Chart on filter or refresh | **no animation** — new numbers appear instantly |
| Skeletons | a 1.2 s pulse, replaced by content in place |

**Never:** counting-up numbers, spring bounces, parallax, confetti, animated gradients, a spinner where
a skeleton belongs, an animation that repeats on every keystroke or render. `prefers-reduced-motion`
sets every duration to zero and keeps the end state.

---

## 5 · The phone — the admin as an app

- Bottom bar: Übersicht · Bestellungen · Katalog · Suche · Mehr. The top bar carries a back arrow, the
  page title and at most two actions.
- Lists are cards, not tables: the two facts that matter, the state as a badge, and a chevron.
- Filters and row actions live in bottom sheets with a drag handle; a sheet closes with the phone's
  back gesture.
- One primary action per screen, in the bottom third; the save bar rides above the keyboard.
- A swipe on a list row reveals a single action (archivieren) and always leaves an undo toast; anything
  destructive asks first.
- Multi-select starts with a long press, shows a count bar, and keeps the selection while scrolling.
- Product photos can be taken with the camera, cropped to the required aspect, and uploaded with a
  progress state that survives a lock screen.
- Numeric fields open numeric keypads; prices a decimal keypad; HSN/TSN forces uppercase.
- Offline: a bar says „Keine Verbindung", and writes are blocked with a clear message instead of
  failing silently.
- Targets at least 44 px, nothing under a fixed bar, no horizontal scroll anywhere, tested on the six
  phone profiles.

---

## 6 · Data model — the shape the above needs

`pages`, `page_sections`, `page_revisions`, `navigation_items` · `media`, `media_usages` · `settings`
with typed casts and `setting_revisions` · `roles`, `permissions`, `role_permission`, `user_role` ·
`audit_events` (append-only, trigger-protected) · `change_requests` · `feature_flags` ·
`notification_rules`, `notification_preferences` · `api_tokens`, `webhooks`, `webhook_deliveries` ·
`imports`, `import_rows` · `bulk_operations` (for undo) · `saved_views` · soft deletes with
`deleted_at` and `deleted_by` everywhere, plus a purge job.

Rules: settings JSON and section settings are always validated against a schema and read through
typed DTOs; every table a person can change has audit coverage; every list query is indexed for its
filters; MySQL 8.4 strict mode stays on; no JSON column is queried where a column belongs.

---

## 7 · What „not AI-generated" means in an admin

`ai-look-critic` adds these to its rubric for admin screens: KPI cards with gradients or glow; icons in
coloured circles; a purple or violet accent; emoji anywhere; rainbow charts; donuts with a big number
in the middle; every panel a rounded card with the same shadow; uppercase letterspaced labels; a
„sparkle" or „AI" badge on anything; tables with zebra stripes and heavy borders instead of space;
progress rings for numbers that are not a ratio; a dashboard that leads with decoration instead of the
three numbers the role opens it for.

---

## 8 · Order and done

**Order within this part:** page builder and media library → super-admin tools 1 to 5 → security →
the remaining tools → motion pass → phone pass → gates.

**Before the client gets access**, two things must exist: the **publish check** (§1) and the **audit
trigger** (§3).

**Done when** the client can rebuild the homepage, change every text, image, price and legal page,
invite their team with the right permissions, and undo any mistake, without us; two-factor is on for
every admin; the audit log cannot be rewritten; the phone version is usable one-handed; and G1–G9 are
green on every admin route.

---

## 9 · Implementer's notes against the existing code

*Not part of the client's brief. Written so that §6 is not read as "rename every working table".*

§6 describes a **shape**. Several parts of it already exist under other names and are not rebuilt
just to match a word:

| §6 asks for | Already here | Note |
|---|---|---|
| `page_sections` | `page_blocks` | Check whether the existing blocks carry type + position + settings; if so they are the sections, and the work is the DTOs, the schemas and the validation. |
| `navigation_items` | `nav_items` | Already drives the storefront menus, including the phone's `mobile_bottom` list. |
| `audit_events`, append-only by trigger | `audit_logs` (D-016) | Spatie activity log, renamed, extended with `ip_address`, `correlation_id`, `actor_email`, and **already made append-only by triggers**. §3's audit trigger is therefore to be **verified by a test**, not rebuilt. What is missing is coverage: writes happen by hand in controllers today, and §2 of Part 1 wants them on model events so they cannot be forgotten. |
| `roles`, `permissions`, `role_permission`, `user_role` | spatie `roles` + `model_has_roles`, and RIMIFY's own `role_permissions` (module × action) | The module × action matrix is the permission model; it is read per request with no cross-request cache and enforced by Policies. |
| `media` | `media` | Exists; `media_usages` and the variants are new. |
| `settings` | `settings` | Exists, JSON value, NOT NULL. `KomplettradSettings` shows the typed-read pattern: absent row → configured default; a row holding explicit null → deliberately unset. |

Everything else in §6 is new: `page_revisions`, `setting_revisions`, `change_requests`,
`feature_flags`, `notification_rules`, `notification_preferences`, `api_tokens`, `webhooks`,
`webhook_deliveries`, `imports`, `import_rows`, `bulk_operations`, `saved_views`, and the soft-delete
columns with `deleted_by`.
