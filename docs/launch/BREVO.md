# Sending the shop's e-mails through Brevo

This is what you do in Brevo so that RIMIFY's e-mails (order confirmations, shipping notices, the contact form) really go
out. It takes about 20 minutes plus the time your domain's DNS needs to update (usually under an hour, sometimes a day).

You enter the key yourself, in the RIMIFY admin. **Never send the key to us or anyone else**, by e-mail or chat.

## 1. Create the Brevo account

1. Go to brevo.com and sign up with the company's e-mail address.
2. Confirm the address from the e-mail Brevo sends you, and fill in the company details Brevo asks for.
3. Choose a plan. The free plan has a daily sending limit; check on Brevo's pricing page whether it covers your expected
   number of orders. You can change the plan later without changing anything in RIMIFY.

## 2. Verify the sender domain rimify.de

Brevo only delivers reliably from a domain it has verified. Without this, mails may be rejected or land in spam.

1. In Brevo, open **Senders, Domains & Dedicated IPs › Domains** and click **Add a domain**. Enter `rimify.de`.
2. Brevo shows a few DNS records (a Brevo code, DKIM and DMARC). Leave that page open.
3. Log in where rimify.de's DNS is managed (the company the domain was registered with). Add each record exactly as Brevo
   shows it: type, name and value.
4. Back in Brevo, click **Verify** (or **Authenticate**). If it is not green yet, wait a while and try again: DNS changes take
   time to spread.
5. Open **Senders** and add the address the shop sends from, for example `bestellung@rimify.de`, with the name customers
   should see (for example „RIMIFY“).

## 3. Create the SMTP key

1. In Brevo, open **SMTP & API** and choose the **SMTP** tab.
2. Note the **SMTP login**. It looks like `8a1b2c001@smtp-brevo.com` and is not your Brevo login address.
3. Click **Generate a new SMTP key**, give it a name such as „RIMIFY Shop“, and copy the key. Brevo shows it only once.

## 4. Enter it in the RIMIFY admin

1. Sign in to the RIMIFY admin and open **Einstellungen › E-Mail**. It asks for your password once more.
2. Under **Anbieter**, choose **Brevo**.
3. Fill in:
   - **Absenderadresse**: the sender address from step 2.5, for example `bestellung@rimify.de`
   - **Absendername**: for example `RIMIFY`
   - **SMTP-Login**: the login from step 3.2
   - **SMTP-Schlüssel**: the key from step 3.3
4. Click **Speichern**. RIMIFY signs in to Brevo with these values straight away and shows the result below
   **Verbindung**. When it is green, the shop sends its mail through Brevo from that moment on. RIMIFY stores the key
   encrypted and only ever shows its last four characters.
5. Under **Test-E-Mail**, type your own address and click **Test-E-Mail senden**. The page says whether it went out, or the
   exact reason it did not.

If a test mail does not arrive: look in your spam folder, then in Brevo under **Transactional › Logs**, which shows what
happened to every message.

## What we need from you

- A short message once steps 1 to 4 are done, so we can check an order confirmation and the contact form on the preview
  with you.
- The sender address you want customers to see, if it should not be `bestellung@rimify.de`.
- If you do not manage rimify.de's DNS yourself: who does, so they can add Brevo's records.
