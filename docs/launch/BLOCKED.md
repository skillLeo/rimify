# RIMIFY — what the launch date waits for

Each item is outside the build. Each is built so its arrival is a configuration step, never a rewrite.

| # | Waiting for | Owner | Arrives as | Status |
|---|---|---|---|---|
| 1 | The supplier product feed and the photo rights | Client | A CSV or JSON file (or URL) run through `ProductImporter` with a saved column mapping | Open |
| 2 | The Gutachten PDFs and which rim each one covers | Client / suppliers | Upload in Gutachten, then the Verwendungsbereich entered and freigegeben by a person | Open |
| 3 | Payment provider account and credentials | Client | One driver file (`PayPalGateway`, `KlarnaGateway`, `StripeGateway`) and a config entry | Open |
| 4 | Legal texts signed off by the client's lawyer | Client's lawyer | Pasted into the prepared legal pages (Impressum, Datenschutz, AGB, Widerruf, Versand, Zahlungsarten) | Open |
| 5 | Domain, hosting, mail sending domain with SPF, DKIM and DMARC | Client / host | `.env` values and DNS records; `rimify:preflight` checks them | Open |
| 6 | **The bucket's name.** The client wrote `rmfy-wbst-bkt-001`, the ARN says `rmfy-wbstbkt-001` (no hyphen before `bkt`). A wrong name answers `NoSuchBucket`, which looks like a permissions problem. | Client | Confirmed name typed into Einstellungen › Medien und Speicher (and `RIMIFY_S3_BUCKET`) | Open — unset until confirmed |
| 7 | **A private prefix.** The bucket is public-read for everything; invoices, exports and uploads under review need `private/` with public access blocked on that prefix (signed URLs only). | Client | A bucket-policy change on their side; `rimify:preflight` requires a 403 from a private object | Open |
| 8 | **Bucket versioning on**, a **CORS rule** allowing `PUT` and `POST` from our domains (presigned uploads of large PDFs), and a **lifecycle rule** removing incomplete multipart uploads after 7 days. | Client | Three settings in the AWS console | Open |
| 9 | **Rotate the IAM access key.** The key and secret were sent in plain text (the client's message, and this chat). They were never written into the repo; once the operator has entered a fresh key in the admin, the old one should be deactivated in IAM. | Client | IAM › Security credentials › deactivate the old key | Open |
