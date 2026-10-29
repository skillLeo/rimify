# Stripe invoices and the daily copy to S3

For you, as the shop owner: what RIMIFY now does with invoices, what you set once in your Stripe account, what the
law asks of an invoice and who covers each part, and what you give us for the daily copy to S3. Written 29.10.2026
for release 23 (your admin item 17, D-361).

## 1 · What the shop does

**Stripe issues the invoice for every order paid through Stripe.** The shop no longer makes its own invoices (you
asked us to switch that off; the code stays, switched off).

When a payment succeeds, the shop asks Stripe to create the invoice, step by step, as Stripe documents it for our
kind of payment (Payment Intents):

1. The customer: the billing name, e-mail address and billing address from the checkout. The payment is made for
   this customer from the start, so Stripe can attach it to the invoice later.
2. A draft invoice in euro, German, A4.
3. One line per row of the order, each with its quantity and price: the rim, the tyre, „Montage und Auswuchten“,
   the Wuchtgewichte, the RDKS sensors and the shipping. Each line carries **19 % VAT, included in the price**, so the
   invoice shows the net amount, the rate and the VAT.
4. A check: the draft's total must equal what the customer paid, to the cent. If it does not, the draft is deleted
   and no invoice is issued; the team sees it in the Protokoll.
5. The invoice is finalized (it gets its number), and the payment that already succeeded is attached to it. Stripe
   then marks it **paid**.

**Where the customer sees it.** The order confirmation page shows „Rechnung … herunterladen“, and the order e-mail
links it. Both show the invoice **only once Stripe has issued it**. There is never a link to an invoice that does not
exist yet.

**If Stripe is not reachable.** The order stays paid, and the order e-mail goes out without the invoice link. The
shop tries again in the background, five times over about three hours, and continues where it stopped. Stripe never
makes a second invoice. If all five tries fail, the Protokoll says so, and the invoice can be issued in your Stripe
Dashboard.

**In the admin.** Verkauf › Bestellungen › an order lists „Rechnung (Stripe)“ with its number and a link to the
invoice in Stripe.

**Not invoiced:** test purchases with the Testzahlung and the demo orders of the preview.

## 2 · What you set in your Stripe Dashboard (once, before the first real order)

| What | Where in Stripe | Why |
|---|---|---|
| Your business name and address | **Settings › Public business information**, and your account details | Stripe prints them on every invoice as the seller. |
| Your VAT ID (USt-IdNr.) or tax number | **Settings › Billing › Invoices**, section „Invoice tax information“; add it and make it the default | It must be on every invoice (§ 14 UStG). |
| Invoice numbering | **Settings › Billing › Invoices**: choose numbering **„sequentially across your account“** (account level) and, if you like, your own prefix such as `RIMIFY` | German invoices need one unique running number. Stripe uses account-level numbering by default for EU accounts, but please check it. |
| Invoice e-mails to customers | Stripe's customer e-mail settings for invoices (Stripe guide „Send customer emails“) | Your choice. Our order e-mail already links the invoice. If you switch Stripe's e-mails on too, the customer gets a second e-mail from Stripe. |
| Footer (optional) | **Settings › Billing › Invoices**, „Default footer“ | For details your company form requires, for example the commercial register entry and the managing director of a GmbH. |
| Branding (optional) | **Settings › Branding** | Logo and colour on the invoice PDF and Stripe's invoice page. |

Stripe's own guide to all of this: <https://docs.stripe.com/invoicing/customize>.

## 3 · What § 14 UStG asks of an invoice, and who covers it

| Required detail | Covered by | Notes |
|---|---|---|
| Your full name and address | **Stripe**, from your settings (section 2) | You set it once. |
| The customer's full name and address | **The shop** sends the billing address from the checkout | — |
| Your tax number or VAT ID | **Stripe**, once you add it as the default (section 2) | You set it once. |
| Date of issue | **Stripe**: the day the invoice is finalized | — |
| A unique, running invoice number | **Stripe**, with account-level numbering | Please check the setting. |
| Quantity and kind of the goods | **The shop**: one line per row, with quantity and description | — |
| **Date of delivery (Leistungsdatum)** | **Not covered — for your tax advisor** | The invoice is issued when the payment succeeds, which is usually before the goods ship. Your tax advisor decides how the delivery date appears, for example a fixed sentence in the invoice footer. |
| Net amount per tax rate | **Stripe**, from the 19 % rate the shop sends with every line | — |
| Tax rate and tax amount | **Stripe** | — |
| Discounts agreed in advance | Not used by the shop | — |
| Kleinunternehmer note (§ 19 UStG) | **For your tax advisor** | If you invoice as a Kleinunternehmer, the shop sends no VAT. The sentence „Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.“ then belongs in the invoice footer. |
| How long to keep invoices | **For your tax advisor** | The daily copy to S3 (section 4) keeps your own copy. With Object Lock, that copy cannot be changed for the period you set. |

We are not tax advisors. This table says what the shop and Stripe put on the invoice. Please have your tax advisor
look at one test invoice before the first real order.

## 4 · The daily copy to S3

Every night at **03:15 (German time)** the shop copies the invoices Stripe created the day before into your own S3
storage. It does this with `php artisan rimify:invoices:export-s3`.

- It goes through all of the day's invoices, however many there are, and leaves out drafts.
- For each invoice it stores the PDF at `invoices/YYYY/MM/DD/<invoice number>.pdf`. Next to it is a small JSON file
  with the invoice ID, number, order number, amount, currency and date.
- Each file is checked by its size after upload.
- Running it twice changes nothing: an invoice already stored, at its size, is left alone.
- A copy that fails is tried three times. After that the admins get an e-mail („Rechnungskopie nach S3
  fehlgeschlagen“, on by default and can be switched off under „Was du bekommst“), the Protokoll records it, and
  System shows it. The next night's run tries that invoice again.
- For backfilling: `--date=2026-11-03` for one day, `--from=2026-11-01 --to=2026-11-30` for a range, and `--dry-run`
  to only list what would be copied.

**What you provide:**

1. **A bucket in an EU region**, ideally Frankfurt (`eu-central-1`).
2. Ideally, with **Object Lock and versioning** switched on when the bucket is created. Then a stored invoice cannot
   be altered or deleted afterwards, not even by us.
3. **An IAM user that may only write to and list that bucket**, and nothing else. The shop checks each file through
   the bucket's listing, so it never needs to read files. Example policy (replace `BUCKET`):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       { "Effect": "Allow", "Action": "s3:PutObject", "Resource": "arn:aws:s3:::BUCKET/invoices/*" },
       { "Effect": "Allow", "Action": "s3:ListBucket", "Resource": "arn:aws:s3:::BUCKET" }
     ]
   }
   ```

4. The access key of that user. It goes **only into the server's `.env`**, as `INVOICE_S3_BUCKET`,
   `INVOICE_S3_REGION`, `INVOICE_S3_KEY` and `INVOICE_S3_SECRET`, and into no file of the project. You can enter it on
   the server yourself, or give it to us for that one step.

Until a bucket is set up, System says: „Für die tägliche Kopie der Stripe-Rechnungen ist noch kein S3-Speicher
eingerichtet.“ Nothing is lost meanwhile: every invoice stays in Stripe, and a backfill copies the days missed.

## 5 · Does the nightly job actually run?

A scheduled job that never runs is the same as no job. The server's cron line starts the shop's scheduler every
minute, and the scheduler leaves a heartbeat. System in the admin shows it („Der Zeitplan läuft.“), and it turns
amber after an hour of silence. The same page shows when the invoice copy last ran.

## 6 · What we still need from you

- **Stripe test keys** (publishable key, secret key and webhook secret, all *test*), so we can place a test order on
  the preview and show you a real Stripe test invoice, line by line. Never send live keys; those you enter yourself
  in the admin on the live shop.
- **The S3 bucket and its key** (section 4), or your go-ahead to leave the copy off for now.
- **Your tax advisor's answers** on the delivery date, the Kleinunternehmer question and the footer (section 3).
