# RIMIFY — what the launch date waits for

Each item is outside the build. Each is built so its arrival is a configuration step, never a rewrite.
Last reviewed 2026-09-28 (the launch release).

## Top — the bridge from HSN/TSN to the Gutachten's cars (a purchase decision for the client, now)

**Neither real ABE contains an HSN or a TSN.** ABE 55255 and Gutachten 366-0350-21-WIRD/N1 name cars by EG
type-approval number (`e1*2007/46*0316*..`, with extension ranges such as `*00-07` or `ab …*08`), by the maker's
Fahrzeugtyp (`3C`, `1K4`, `346L`, `Z85`, `UKL/X`) and by a kW band per tyre size. HSN and TSN are fields 2.1 and
2.2 of the Zulassungsbescheinigung — another key, and the bridge between the two is a dataset we do not own.
Until it is bought, RIMIFY cannot go from a customer's HSN/TSN to a Gutachten row, and nothing about HSN/TSN
may be promised.

- **What it takes:** a vehicle dataset per HSN/TSN that also carries the **EG type-approval number with its
  extension** (the join key to the documents), plus maker, trade name, Fahrzeugtyp, kW, build period, body style
  and drive. Ask every supplier for a sample of exactly those columns before buying.
- **Sources:** the KBA's own type data (official, keyed by HSN/TSN); TecDoc from TecAlliance (the parts-trade
  standard, annual licence); GT Motive or DAT (commercial, similar). Whether each carries the EG number with its
  extension is the question to put to them.
- **Meanwhile:** the storefront offers „Fahrzeug auswählen“ — maker, model, the type as the document names it,
  kW (field P.2 of the Zulassungsbescheinigung) — and the HSN/TSN field says „für dieses Fahrzeug noch nicht
  hinterlegt“ instead of guessing. The 74 development cars (invented type keys, BUGS.md DATA-01) never reach
  production.

| # | Waiting for | Owner | Arrives as | Status |
|---|---|---|---|---|
| 1 | The supplier product feed and the photo rights | Client | A CSV or Excel file through Katalog › Import (`CatalogueImporter`): columns mapped, Probelauf, import | Open |
| 2 | The Gutachten PDFs and which rim each one covers | Client / suppliers | Upload in Gutachten › Neues Gutachten, then the Verwendungsbereich entered and freigegeben by a person | Open |
| 3 | The payment provider | Client / user | **Stripe, decided 2026-09-28.** Test keys (`pk_test_…`, `sk_test_…`, the `whsec_…` from `stripe listen`) from the user into `.env` for the payments brief; the live pair typed into Einstellungen › Zahlung on production by a person, never through the repository (R-16, `docs/dev/SECRETS.md`) | Open — the payments brief follows the launch release |
| 4 | Legal texts signed off by the client's lawyer | Client's lawyer | Pasted into the prepared legal pages (Impressum, Datenschutz, AGB, Widerruf, Versand, Zahlungsarten) | Open |
| 5 | Domain, hosting, mail sending domain with SPF, DKIM and DMARC | Client / host | `.env` values and DNS records; `rimify:preflight` checks the mailer and the sender's domain, `rimify:mail-test` proves a message leaves | Open |
| 6 | ~~The bucket's name~~ (`rmfy-wbst-bkt-001` vs. `rmfy-wbstbkt-001` in the ARN). | — | The name is no longer typed: „Buckets von AWS laden“ fills a select from AWS's own ListBuckets; free text only if the key may not list. | **Closed in the build** (2026-09-27) |
| 7 | ~~A private prefix.~~ The client created `invoices/` (with `exports/` and `pending/`) with public access blocked. | Client | `rimify:s3-audit` row 5 must read 200/200/200 and **403 on `invoices/`** — run it once the key is entered | **Done by the client**; to be verified by the audit |
| 8 | **Bucket versioning on**, a **CORS rule** allowing `PUT` and `POST` from our domains (presigned uploads of large PDFs), and a **lifecycle rule** removing incomplete multipart uploads after 7 days. | Client | Three settings in the AWS console; `rimify:s3-audit` rows 6–8 say which are missing | Open |
| 9 | **Rotate the IAM access key.** The key and secret were sent in plain text (the client's message, and this chat). They were never written into the repo; once the operator has entered a fresh key in the admin, the old one should be deactivated in IAM. | Client | IAM › Security credentials › deactivate the old key | Open |
| 10 | **A virus scanner** for uploads (ClamAV on the host, or a scanning service). | Host / client | One `VirusScanner` implementation bound in `StorageServiceProvider`; every upload already passes the hook | Open — `NoVirusScanner` until then |
| 11 | **One example ABE and one example rim** — the golden record of the admin review release. | Client | Uploaded through Gutachten › Neu; the stand-in record is swapped for it | Open — built against a stand-in |
| 12 | **Deploying this release.** Pushing and deploying are the user's; this build never pushes. | User | `git push origin release:main`; then `docs/launch/GO-LIVE.md` (staging with `TARGET_ENV=staging`, production as written) | Open — waiting for the user |
| 13 | **The rollback rehearsed on staging and timed** (GO-LIVE.md §7). Rehearsed locally only; the host is the user's. | User | One run of GO-LIVE.md §1, §3, §7 on staging; the time written into §7's table | Open |
| 14 | **An error tracker** (Sentry or similar), if wanted. Until then the day's log and Admin › System are the tracker (GO-LIVE.md §8). | User / client | An account and its DSN in `.env`; one package | Open — a decision, not a blocker |
| 15 | ~~The live Stripe secret pasted into a working session~~ (2026-09-28). Never written anywhere; the user rolled it the same day. | User | — | **Closed**; the guard against a repeat is `secrets:scan` and its pre-commit hook |
| 16 | **The real vehicle list**: make, model, variant with HSN/TSN, axle loads, top speed and build window, from a vehicle database or the KBA list. The 74 cars in development are test data with made-up type numbers; since 2026-09-28 their seeder refuses production. | Client / data provider, then us | The vehicle data import (the "vehicle data script", not built); a car whose data cannot be read goes to Fahrzeuge › Zur Prüfung (R-03) | Open — production has no car until it runs |
| 17 | **A Marken page** (brand name, logo upload, order on the brand wall). Today a brand is created by the import or the Felge form, and logos come only from `BrandLogoSeeder`. | Us | Katalog › Marken | Open — not built |
