# RIMIFY — what the launch date waits for

Each item is outside the build. Each is built so its arrival is a configuration step, never a rewrite.

| # | Waiting for | Owner | Arrives as | Status |
|---|---|---|---|---|
| 1 | The supplier product feed and the photo rights | Client | A CSV or JSON file (or URL) run through `ProductImporter` with a saved column mapping | Open |
| 2 | The Gutachten PDFs and which rim each one covers | Client / suppliers | Upload in Gutachten, then the Verwendungsbereich entered and freigegeben by a person | Open |
| 3 | Payment provider account and credentials | Client | One driver file (`PayPalGateway`, `KlarnaGateway`, `StripeGateway`) and a config entry | Open |
| 4 | Legal texts signed off by the client's lawyer | Client's lawyer | Pasted into the prepared legal pages (Impressum, Datenschutz, AGB, Widerruf, Versand, Zahlungsarten) | Open |
| 5 | Domain, hosting, mail sending domain with SPF, DKIM and DMARC | Client / host | `.env` values and DNS records; `rimify:preflight` checks them | Open |
| 6 | ~~The bucket's name~~ (`rmfy-wbst-bkt-001` vs. `rmfy-wbstbkt-001` in the ARN). | — | The name is no longer typed: „Buckets von AWS laden“ fills a select from AWS's own ListBuckets; free text only if the key may not list. | **Closed in the build** (2026-09-27) |
| 7 | ~~A private prefix.~~ The client created `invoices/` (with `exports/` and `pending/`) with public access blocked. | Client | `rimify:s3-audit` row 5 must read 200/200/200 and **403 on `invoices/`** — run it once the key is entered | **Done by the client**; to be verified by the audit |
| 8 | **Bucket versioning on**, a **CORS rule** allowing `PUT` and `POST` from our domains (presigned uploads of large PDFs), and a **lifecycle rule** removing incomplete multipart uploads after 7 days. | Client | Three settings in the AWS console; `rimify:s3-audit` rows 6–8 say which are missing | Open |
| 9 | **Rotate the IAM access key.** The key and secret were sent in plain text (the client's message, and this chat). They were never written into the repo; once the operator has entered a fresh key in the admin, the old one should be deactivated in IAM. | Client | IAM › Security credentials › deactivate the old key | Open |
| 10 | **A virus scanner** for uploads (ClamAV on the host, or a scanning service). | Host / client | One `VirusScanner` implementation bound in `StorageServiceProvider`; every upload already passes the hook | Open — `NoVirusScanner` until then |
| 11 | **One example ABE and one example rim** — the golden record of the admin review release. | Client | Uploaded through Gutachten › Neu; the stand-in record is swapped for it | Open — built against a stand-in |
