# Inhalte — build plan (Seiten, FAQ, Navigation)

Source: `BRIEF.md` §3 *Inhalte*, `BRIEF-2.md` §1. Built sequentially, committed per area, no push,
no deploy. **Taken before Bestellungen on purpose:** checkout writes no order yet (KasseController
refuses every one until payment exists), so an orders screen would be an empty list; content is real
today and is the power the client asked for.

## Resolved

| Item | Resolution |
|---|---|
| What is editable | Only what the storefront prints. Startseite: `hero` (headline, sub, sub_mobile), `promise_row` (1–4 items). Ratgeber: title, meta description, `guide_lead`, `prose` sections. Rechtliches: title, `legal_body` sections. `faq`/`kontakt` pages carry no printed field and are not listed. `meta_title` is printed nowhere and is not offered. |
| Section reordering / section library | **Not in v1.** The homepage is a fixed composition; making it a list of sections is the page-builder step (BRIEF-2 §1) and changes the storefront. v1: fixed blocks edited in place; guide and legal *sections* can be added, removed and moved up/down. |
| Limits | One schema (`App\Services\Content\PageSchema`) holds every field's label, `max`, required, multiline. The editor's counters and the server's validation read the same numbers. |
| Draft | `pages.draft` (JSON) + `draft_updated_at` / `draft_author_email`. The storefront never reads it. |
| Publish | Validates the whole draft (the publish check: required fields, limits), writes `page_blocks`, stamps `published_at`, stores a revision, clears the draft — one transaction. |
| Revisions | `page_revisions` (page_id RESTRICT, snapshot JSON, note, author id + e-mail, created_at). The first publish from the admin first stores the live state it replaces. Restore loads a revision into the draft; publishing stays a separate step. |
| Diff | Field-level, labelled from the schema ("Abschnitt 3 · Text"), shown before publishing and before restoring. |
| Preview | `GET /vorschau/seite/{page}` — temporary signed URL (7 days), no login, `noindex`. Renders the real storefront page with the draft (`PageContent` override). The editor shows it in a frame, Desktop 1280 / Handy 390, reloaded after each draft save. |
| Legal pages | `pages.lawyer_reviewed` flag. Editing a reviewed page warns; publishing changed text clears the flag unless it is ticked again. `placeholder` stays true on a block only while its text is unchanged. We never write the text. |
| New pages | *Ratgeber-Artikel anlegen* (content.create). Guides can be withdrawn (status draft), not deleted. |
| Rights | view → list, editor read-only, preview · edit → draft save/discard, restore · publish → publish/withdraw · create → new guide. |

## Navigation (resolved)

| Item | Resolution |
|---|---|
| Menus | The five the storefront renders (`Chrome::menus`): Kopfzeile, Fußzeile · Shop, Fußzeile · Service, Fußzeile · Rechtliches, Handy-Leiste. |
| Editable | Label, visibility, order, target. New items and deleting items the team added. `behaviour` stays as seeded. |
| Targets | Never free text: a shop page from an allow-list of named routes, or one of the pages Inhalte › Seiten edits. No external or `javascript:` URL can be stored. |
| Legal floor | Impressum and Datenschutz stay reachable on every page (DDG §5, DSGVO Art. 13): their footer items cannot be hidden, deleted or pointed elsewhere. |
| Limits | Label: Kopfzeile 20, Fußzeile 32, Handy-Leiste 12 characters. At most 6 visible items in the Kopfzeile and 5 in the Handy-Leiste, which needs an icon per item. |
| Rights | Menus are live on every page, so every change needs `content.publish` besides edit/create/delete. |
| Cache | `chrome.menus` (5 min) is cleared on every change, or an edit would look lost. |
| Seeder | `nav_items.team_edited_at`; ContentSeeder leaves a menu the team has touched alone. |

## Hardening from the adversarial review (2026-09-26)

| Item | Resolution |
|---|---|
| Two editors on one page | `pages.content_version`, bumped by every write and sent back by the editor; a write against an older version is refused (`PageChangedMeanwhile`), never applied over newer words. |
| Publish without edit | A role that may publish but not edit publishes the stored draft (or the live words); posted words are ignored. |
| Quick show/hide | `PATCH …/sichtbarkeit` carries the visibility alone, so an out-of-date list never writes old words back. |
| FAQ emptied by the team | The claim is also kept as the setting `content.faq_team_edited_at`, so a release does not re-seed an FAQ the team deleted. |
| Menus and unpublished articles | Only published articles are targets; withdrawing an article a visible menu entry leads to is refused. |
| Never-published article | „Entwurf verwerfen" resets it to the empty form (`PageSchema::skeleton`), never to nothing; no „Ausgangsstand" is invented for it. |
| Failures | A failed save answers one sentence (JSON, not a page) — except sign-out and the guest pages; real admin error pages still render. Back asks before losing words, and yields to an open bottom sheet. |
| Paragraphs | `format.ts#paragraphs`: a blank line is a new paragraph, a line break stays one, on the Ratgeber, the legal pages and the FAQ. |

## Endpoints (all `EnsureAdminMay content,view` + Policy per mutation)

`GET /admin/seiten` · `POST /admin/seiten` · `GET /admin/seiten/{page}` · `PUT /admin/seiten/{page}/entwurf` ·
`DELETE /admin/seiten/{page}/entwurf` · `POST /admin/seiten/{page}/veroeffentlichen` ·
`POST /admin/seiten/{page}/zurueckziehen` · `POST /admin/seiten/{page}/versionen/{revision}` ·
`GET /admin/seiten/{page}/versionen/{revision}/vergleich` ·
`GET /admin/faq` · `POST /admin/faq` · `PUT|DELETE /admin/faq/{entry}` · `PATCH /admin/faq/{entry}/sichtbarkeit` · `PUT /admin/faq/reihenfolge` ·
`GET /admin/navigation` · `POST /admin/navigation` · `PUT|DELETE /admin/navigation/{item}` · `PATCH /admin/navigation/{item}/sichtbarkeit` · `PUT /admin/navigation/reihenfolge`

## Editor props — `Admin/Seiten/Bearbeiten`

`page {id, slug, kind, href, status, publishedAt, lawyerReviewed}` · `schema {page: Field[], blocks: BlockSchema[]}` ·
`content {title, metaDescription, blocks: {type, data}[]}` (draft ?? live) · `live` (same shape) ·
`draft {savedAt, by} | null` · `revisions {id, at, by, note}[]` · `previewUrl` · `can {edit, publish}`

## Files

`database/migrations/commerce/…_add_drafts_and_revisions_to_pages.php` · `app/Models/{Page,PageBlock,PageRevision}.php` ·
`app/Services/Content/{PageSchema,PageContent,PageDiff,PagePublisher}.php` · `app/Policies/PagePolicy.php` ·
`app/Http/Requests/Admin/PageContentRequest.php` · `app/Http/Controllers/Admin/SeitenController.php` ·
`app/Http/Controllers/Storefront/VorschauController.php` · Storefront Startseite/Ratgeber/Rechtliches read through `PageContent` ·
`resources/js/Pages/Admin/Seiten/{Index,Bearbeiten}.vue` + `FieldInput.vue`, `PreviewFrame.vue` ·
`tests/Feature/Admin/SeitenTest.php` · then the same shape for FAQ and Navigation.
