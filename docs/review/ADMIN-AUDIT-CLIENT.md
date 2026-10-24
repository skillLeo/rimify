# The admin, checked end to end — what we found and what we fixed

*23–24 October 2026 · for the shop's owner · the full technical record is `docs/review/ADMIN-AUDIT.md`*

You told us that a lot of things in the admin were not right, without a list. So we made the list ourselves: every
part of the admin, taken from the program itself rather than from memory, and each part tried out. This page says,
in plain words, what we checked, what we fixed, and why a few things stay the way they are on purpose.

## What we checked

- **Every part of the admin — 471 items.** Every page, every form, every list and filter, every button that
  changes something, every dialog, upload, export and import, and every e-mail an admin's action sends. Each one has
  a result in the detailed record.
- **Eight real jobs, from start to finish, in a browser**, on a fresh copy of the shop with demonstration data and
  more than 1,000 entries in every list, on a large screen (1440 pixels wide) and a smaller one (1024):
  1. a new rim, from nothing until it shows in the shop with the right answer for a car;
  2. a Teilegutachten typed in from Borbet's papers — with its fixed tyre combinations and its Auflagen per axle,
     including 16a) — released, and every kind of answer checked: approved, approved with conditions, not
     approved, not yet confirmed, and a car faster than 210 km/h;
  3. a car typed in by hand, then a vehicle file imported through the Probelauf;
  4. a tyre with its EU label, sold together with a rim as a Komplettrad;
  5. a blog post with a photo and a table;
  6. a test order, handled in the admin to the end — found, opened, sent, delivered, partly refunded — and every
     e-mail it sends read;
  7. one of each kind of thing changed and then deleted, and what happened to everything that depended on it;
  8. the level of an Auflage in the shop, customer reviews, and the company details.
- **Every form, tried the awkward way**: sent empty; each required field left out; the longest text a field takes;
  umlauts and ß; a German decimal comma like 2,5; an HSN with leading zeros like 0005; the same thing twice; a double
  click; the browser's Back after saving; the same record open in two tabs.
- **Every list**: sorting, filters, searching with umlauts, moving through pages, an empty list, and the speed with
  more than 1,000 rows.
- **Throughout**: no errors in the browser, no unexpected error answers from the server, nothing new in the error
  log, and no database question slower than 0.3 seconds.

## What we fixed

We found 42 problems. 41 are fixed; the last one is explained under "What is still open". Each fix comes with an
automatic test that fails without the fix and passes with it, so the problem cannot quietly come back. The last one
was found by the final test run itself: on the overview page, the card with the most-requested cars shrank by a row
when fewer than five cars were listed, and everything below it jumped. It now keeps its size. The most important:

**Nothing gets lost or overwritten any more**
- If the same page was open in two tabs — or two people worked on the same thing — the later save silently put back
  the older values. Now the later save is refused with a clear sentence, and everything typed stays on screen. This
  holds for every form that saves several things at once, from the company details to a row of a Gutachten.
- A delivered order that was partly refunded could be marked „sent“ again; it then lost its refund status and
  counted as revenue again. Now the refund stays, and „sent“ and „delivered“ are only recorded, once each.
- The Auflage type „Verbot“ looked like it would exclude a car, but it only shows a warning such as „no snow chains“.
  The admin now says what each type does, right where you choose it.

**Things you could not do before**
- The lists of reviews, messages and customer requests stopped at about 200, with no way to the rest — an older review
  could never be answered or hidden. Gutachten, brands and demand put more than a thousand rows on one slow page. Each
  of these lists now has pages and a search, and the few lists that show only the newest entries now say so.
- A Nachtrag could only be attached to one of the newest 300 Gutachten. Now every Gutachten can be chosen, with a
  field that finds it by its number.
- A car typed in by hand could never be corrected — a typo stayed forever. Now it can be corrected as long as
  nothing in the shop refers to it yet.
- „Freigeben“ was offered, and only after pressing it did the admin say why the release was refused. Now the reason
  is shown before.
- A Gutachten with fixed tyre combinations, in which one tyre size is limited to one axle, offered no Komplettrad at
  all. Following your item 8, the shop now offers the Komplettrad exactly as the combinations the Gutachten lists: two
  wheels for the front and two for the rear, in the sizes the combination names. Each axle's tyre is checked against
  that axle's own load and the car's top speed; if one axle fails, the whole set is refused. Each axle's conditions are
  shown under its name, and the order records which tyre went on which axle. A combination for which the shop sells no
  tyre on one axle offers the rims only. This came as its own change, with its own full test run.

**Clearer for you and for your customers**
- When an order is marked as sent, the customer now gets an e-mail with the tracking number you typed. Before, the
  number reached nobody.
- Every error message is in German now; one message used to read „validation.max.string“.
- The activity log (Protokoll) described thirteen important events — refunds, payment settings, invoices — only with
  the same general line, „Hier wurde etwas geändert, das das Protokoll noch nicht in Worten beschreiben kann.“ Each now
  has a sentence of its own.
- A customer opening an expired link from one of our e-mails was told they had no permission. Now the page says the
  link has expired and how to go on.
- The password question names what it protects (a refund, the company details, the shop's keys).
- Rights in „Rollen & Rechte“ that did nothing at all are gone from the grid.

**Faster**
- The brand list took up to 5 seconds to open and the demand list up to 6 seconds. Both now come in pages: on the same
  test machine the brand list opens in 0.75 seconds and the demand list in 1.1 seconds. Every list in the admin now
  opens in under 1.1 seconds, and a search answers in a quarter to half a second.

## Things that stay the way they are — and why

These are not mistakes. They protect the legal answers the shop gives, the money, or the records. Where the admin
used to just hide a button, it now says why on the screen.

- A car is never deleted, so every approval and order that names it stays explainable; a car typed in by hand can
  still be corrected as long as nothing refers to it.
- A condition code that a row of a Gutachten still uses cannot be removed, so no row ever points at a code that no
  longer says what it means.
- A role that someone still holds cannot be deleted, so nobody is left without access to their work.
- The seven standard roles keep their names and are never deleted; apart from Super-Admin, which always holds every
  right, their rights and descriptions can be changed, and a copy can be made for anything else.
- A brand that still has a rim or a tyre — even a removed rim — cannot be removed, so no approval data disappears while
  the catalogue is tidied.
- A released Gutachten never changes; a correction is made as a new version, so every order placed on it stays
  explainable.
- A Gutachten cannot be released while the rows typed in do not match its count, so the shop never offers more or less
  than the document approves.
- An Abnahme or work on the car body is always shown to the customer as a condition, so nobody buys without knowing
  that an inspector or a workshop is needed.
- „Nicht zulässig“ in the shop setting of a condition only decides how prominently it is shown; the legal answer always
  comes from the Gutachten itself.
- A „Verbot“ (such as „no snow chains“) is shown as a note and never excludes a car.
- Without the axle loads from the registration papers, the tyres for a car stay „Noch nicht bestätigt“ (not yet
  confirmed).
- A tyre that has been ordered keeps its size, load index and speed symbol, so the order always describes the tyre that
  was sold.
- Demonstration data is never changed, sent or counted as real.
- A catalogue import never changes a rim's measurements or the demonstration data, and new rims arrive as drafts.
- Reviews come only from buyers, through the link in their invitation; nobody can write one in the admin.
- Impressum and Datenschutz always stay in the menus, because the law requires them to be reachable from every page.
- A blog post that a menu links to cannot be withdrawn until it is taken out of the menu, so no menu entry leads
  nowhere.
- A refund cannot be taken back once it is made.
- Refunds, the shop's keys, the company details and the reset of the test environment ask for the password again.
- The real invoice number series is opened once and cannot be switched back, because German invoice numbers may have no
  gaps.
- Live payments stay switched off while a legal text is still a placeholder or a field of the Impressum is empty.
- A save made from a page that was opened before someone else's save is refused, so two people never silently undo
  each other's work.
- The test environment can only be reset outside the live shop.

## What is still open

- **Small, for a later round.** Tyres, vehicles, the activity log and a few short lists cannot yet be sorted by a
  column; rims and orders can.

## How we know it works

All automatic tests pass on the commit that carries this report: the unit, feature and component tests on both
database engines the shop runs on, and the browser tests on a desktop screen, at the in-between widths and on a
phone. Nothing was put live: it goes out in the next release together with everything else.
