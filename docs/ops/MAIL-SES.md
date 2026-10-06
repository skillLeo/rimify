# Mail through Amazon SES — setup and deliverability test

> The brief „AFTER CI“, §3 (D-182). SES runs in **`eu-north-1` (Stockholm)**, in the AWS account that holds the
> bucket. Until its key is entered and cleared, the shop keeps writing mail to the log and `rimify:go-live-check`
> shows two lines as **fehlt**: „E-Mail-Versand über Amazon SES“ and „Absenderdomain: SPF, DKIM und DMARC“, the
> second naming every DNS record still missing.

## What the shop does with it

| Piece | Where | Behaviour |
|---|---|---|
| The key | Einstellungen › E-Mail (Super-Admin, password asked again) | write-only, encrypted; tested against SES on every save; a key SES refuses is kept as „pending“ and nothing changes |
| Switching to SES | `MailSettings` | only when the last test clears it: key works, sending enabled, **production access**, sender domain **verified**. Until then `.env`'s mailer stays (`log` on the host) |
| DNS | `SenderDns`, on the screen and in `rimify:go-live-check` | each record looked up as the world sees it, named with type, name and value |
| Bounces and complaints | `POST /webhooks/ses` (SNS) | accepted only signed by SNS and from the topic entered on the screen; a permanent bounce or a complaint blocks the address, once, recorded in the Protokoll; a transient bounce blocks nothing |
| Blocked addresses | `DropSuppressedRecipients` | nothing more is sent to them; the screen lists them, each with „Sperre aufheben“ |

## Setup — the operator, in the AWS console (region **Europe (Stockholm) eu-north-1** throughout)

Each step needs the AWS login, which only the operator holds. Nothing here goes into a file or a chat; the one key is
typed into Einstellungen › E-Mail on the site itself (R-16).

1. **Ask for production access now** — it takes AWS up to a day, and until it is granted SES sends only to addresses
   verified one by one. SES › Account dashboard › „Request production access“:
   - Mail type: **Transactional**
   - Website URL: the shop's address
   - Use case description (AWS reads English):
     > RIMIFY is an online shop for alloy wheels in Germany. We send transactional e-mail only: order confirmations
     > with the invoice and the cancellation policy as PDF attachments, payment and shipping updates, refunds, account
     > sign-in links and replies to customer enquiries — each to a customer who placed an order or wrote to us. No
     > marketing, no purchased lists. Expected volume: under 1,000 messages a month at launch. Bounces and complaints
     > are delivered to our application by an SNS topic; the addresses are blocked at once and SES's account-level
     > suppression list is on for bounces and complaints.
2. **The sender's domain:** SES › Identities › Create identity › Domain › `rimify.de`, **Easy DKIM**, RSA 2048-bit,
   „Publish DNS records to Route 53“ off. SES lists three CNAME records.
3. **Custom MAIL FROM** for the same identity: `bounce.rimify.de`, „Behavior on MX failure“: *Use default MAIL FROM
   domain*. This puts SPF on our own subdomain, so the client's mailbox records on `rimify.de` stay untouched.
4. **Suppression list:** SES › Configuration › Suppression list — account-level, for **Bounces and complaints**
   (on by default for new accounts; the connection test says so either way).
5. **The key:** IAM › Users › Create user `rimify-ses` (no console access) › attach this policy, then create an access
   key („Application running outside AWS“):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       { "Effect": "Allow", "Action": ["ses:SendEmail", "ses:SendRawEmail"], "Resource": "arn:aws:ses:eu-north-1:*:identity/rimify.de" },
       { "Effect": "Allow", "Action": ["ses:GetAccount", "ses:GetEmailIdentity"], "Resource": "*" }
     ]
   }
   ```

   A key of its own, never the bucket's: one that can send mail cannot touch the invoices, and the other way round.
6. **Reports back to the shop:** SNS (eu-north-1) › Topics › Create `rimify-ses-meldungen` (Standard). Copy its ARN.
   Enter it in **Einstellungen › E-Mail › SNS-Thema** and save *before* the next step: the shop accepts SNS's
   confirmation only from the topic it knows. Then: the topic › Create subscription › HTTPS ›
   `https://<shop>/webhooks/ses` — the shop confirms it by itself; the Protokoll says „Amazon SES meldet unzustellbare
   Adressen und Beschwerden ab jetzt an den Shop“. Last: SES › Identities › `rimify.de` › Notifications › Feedback
   notifications › Bounce and Complaint → `rimify-ses-meldungen`.
7. **Einstellungen › E-Mail:** sender `bestellung@rimify.de` (or the address the client chooses on the domain), the
   name „RIMIFY“, the access key and the secret from step 5 → „Verbindung testen“ → „Speichern“. The screen lists every
   step SES answered and every DNS record still missing.

## DNS — whoever holds the domain's DNS (rimify.de: IONOS)

| Purpose | Type | Name | Value |
|---|---|---|---|
| DKIM | CNAME | `<token1>._domainkey.rimify.de` | `<token1>.dkim.amazonses.com` |
| DKIM | CNAME | `<token2>._domainkey.rimify.de` | `<token2>.dkim.amazonses.com` |
| DKIM | CNAME | `<token3>._domainkey.rimify.de` | `<token3>.dkim.amazonses.com` |
| SPF (MAIL FROM) | MX | `bounce.rimify.de` | `10 feedback-smtp.eu-north-1.amazonses.com` |
| SPF (MAIL FROM) | TXT | `bounce.rimify.de` | `v=spf1 include:amazonses.com ~all` |
| DMARC | TXT | `_dmarc.rimify.de` | `v=DMARC1; p=none; rua=mailto:dmarc@rimify.de` |

The three tokens are SES's (step 2); Einstellungen › E-Mail and `rimify:go-live-check` print them in full once the
key is in. DMARC starts at `p=none`: the client's own mail from `rimify.de` (IONOS) must pass too, and the reports to
`dmarc@rimify.de` (an alias the client creates, or leave the `rua` part out) show that it does. After two to four weeks
of clean reports, `p=quarantine`.

## The deliverability test — once production access is granted and every record is found

One message in the order confirmation's layout with two PDF attachments, to one inbox at each of **Gmail, Outlook
(outlook.com) and GMX**, sent from the host:

```bash
$PHP artisan rimify:mail-test <gmail-address> --anhaenge
$PHP artisan rimify:mail-test <outlook-address> --anhaenge
$PHP artisan rimify:mail-test <gmx-address> --anhaenge
```

For each: where it landed (Posteingang / Werbung / Spam), and in the message's original headers
`spf=pass`, `dkim=pass` (for `rimify.de`), `dmarc=pass`. Record the result here, with the date:

| Date | Provider | Landed in | SPF | DKIM | DMARC | Both PDFs open | By |
|---|---|---|---|---|---|---|---|
| — | Gmail | not run yet: needs the SES key and production access | | | | | |
| — | Outlook | not run yet | | | | | |
| — | GMX | not run yet | | | | | |

A message in Spam is not a pass: the cause is in its headers (a failing DKIM or SPF line, or a missing DMARC) and in
the Protokoll; fix it and send again.
