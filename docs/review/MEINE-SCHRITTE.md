# My steps — everything that needs you, in a browser

No terminal. Each step says where to click, what to paste, and what you should see. Do them in this order and send me
one message when all are done. Sign in to the admin at **https://rimify.skillleo.com/admin/anmelden** as
`admin@rimify.test` (password in `docs/review/ACCOUNTS.md`).

---

## 1 · The deploy key (hPanel)

1. **hPanel › Advanced › SSH Access** (German hPanel: *Erweitert › SSH-Zugang*) › **SSH Keys** › **Add SSH key**.
2. **Name:** `rimify-preview-deploy`
3. **Key:** the single line starting with `ssh-ed25519` that I sent you in chat (it is the public half; the private half
   never leaves my machine).
4. Save. **Done on 01.10.2026** — the preview now deploys with this key; nothing more to do here.

The base ABE 53841 is entered on the preview as draft #12 and linked from the Nachtrag (#11); step 3 can start.

---

## 2 · The two cron jobs (hPanel)

**hPanel › Advanced › Cron Jobs** (*Erweitert › Cron-Jobs*). Create two jobs. For each one choose the type
**Custom** (*Benutzerdefiniert*), paste the command into the command field, and set the schedule to **every minute**:
the five schedule fields Minute, Hour, Day, Month, Weekday each `*` (or pick *Every minute* / *Jede Minute* from the
common-settings list).

**Job A — the page renderer's watchdog**

| Field | Value |
|---|---|
| Schedule | `* * * * *` (every minute) |
| Command | `bash ~/domains/rimify.skillleo.com/public_html/deploy/ssr-watch.sh > /dev/null 2>&1` |

What it does: the host sometimes stops the program that draws pages on the server; this starts it again within a
minute. If it is missing, pages still work but appear more slowly, and Admin › System › Zustand shows an amber row for
pages served without server rendering.

**Job B — the shop's scheduler**

| Field | Value |
|---|---|
| Schedule | `* * * * *` (every minute) |
| Command | `/opt/alt/php84/usr/bin/php ~/domains/rimify.skillleo.com/public_html/artisan schedule:run > /dev/null 2>&1` |

What it does: runs the shop's timed work — an unpaid order expires after 24 hours and its stock goes back, the nightly
demo check, and the minute pulse the *Zeitplan* warning reads. If the **Zeitplan** warning stays (a banner on every
admin page, an amber row under Admin › System › Zustand), this is the job that is missing or wrong. Within a minute of
it running, the row turns green.

---

## 3 · Release the three Gutachten — in this order

**Admin › Gutachten › Dokumente.** Open each, put its PDF beside it (*PDF öffnen* in the *Angaben* box), check, then
press **Freigeben** (top right) and confirm in the dialog.

### 3.1 · ABE 53841 — the base (first)

Check under *Angaben* against the PDF (pages 1–4):

- Art **ABE**, KBA-Nummer **53841**, Aussteller **Kraftfahrt-Bundesamt**, Ausgestellt am **16.07.2025**, Seiten **13**
- Prüfbericht-Nr. **366-0350-21-WIRD/N1**, Prüfdatum **02.07.2025**
- Berichtigung der Fahrzeugpapiere **nicht erforderlich (§ 15 FZV)** — page 3, point 10

The box at the top says **Kann freigegeben werden** and *Mit der Freigabe übernimmt der Shop die Angaben dieses
Grundgutachtens für seine Nachträge. Eigene Zeilen hat es nicht.* It has no rows of its own — that is correct.

**Afterwards:** the box reads **Freigegeben seit 01.10.2026** (today's date) and a message says *Freigegeben: Der Shop
übernimmt die Angaben dieses Grundgutachtens jetzt für seine Nachträge.*

### 3.2 · ABE 55255 — the 19-inch (second)

Check: KBA-Nummer **55255**, Aussteller **TÜV Rheinland Kraftfahrt GmbH**, Anlage **19**, Prüfbericht-Nr. **55051823**,
Seiten **13**, Prüfdatum **29.11.2023**, Gültig ab Fertigungsdatum **02/2023**; the *Auflagenverzeichnis* sentence by
sentence against the PDF; the *Verwendungsbereich*: 70 cars × 2 sizes = **140 rows** (draft #10). Under **Vorschau im Shop**, pick
a car (e.g. BMW X3 X83) and press *Vorschau zeigen*: it should read *Mit Auflagen freigegeben*.

The top box must say **Kann freigegeben werden**. If it says *Noch nicht freigebbar*, it lists why in sentences — send
me the list instead of pressing anything.

**Afterwards:** *Freigegeben seit …*, and a message *Freigegeben: 140 Zeilen sind jetzt im Shop.*

### 3.3 · Nachtrag 366-0350-21-WIRD/N1 — the 18-inch (third)

Check: Gutachten-Nummer **366-0350-21-WIRD/N1**, Aussteller **TÜV AUSTRIA GMBH**, Anlage **16**, Seiten **24**;
*Nachtrag zu* **ABE 53841** as a link; *Berichtigung der Fahrzeugpapiere* **nicht erforderlich (§ 15 FZV, laut
Grundgutachten)** (this appears only once 3.1 is released); *Verwendungsbereich* **Verwendungsbereich unvollständig –
Anlagen 1–15 liegen nicht vor.** (correct: we hold Anlage 16 only); 55 cars × 2 sizes = **110 rows** (draft #11).

**Afterwards:** *Freigegeben: 110 Zeilen sind jetzt im Shop.* Under **Gutachten › Abdeckung** the section *Verwendungsbereich unvollständig*
lists this Nachtrag with *Fehlende Anlagen: 1–15*.

---

## 4 · Price and publish the BORBET DB8GT2

**Admin › Katalog › Felgen** › **BORBET DB8GT2**.

1. Scroll to the sizes table. It has four rows: *Schwarz matt* 18 and 19, *Bronze matt* 18 and 19.
2. In each row type the price per rim in the column **Preis €** (e.g. `249,00` — the client's price; I have none in
   any document, so I cannot fill it in) and the stock in **Bestand** (at least 4 if the test purchases in step 5
   should go through).
3. Press **Speichern** in the bar at the bottom.
4. The **Freigabe-Check** at the top now reads **Kann veröffentlicht werden**. Notes under it with a blue *i* do not
   stop anything (e.g. a missing description). A red line does — it says what is missing. After step 3 the column
   **Freigaben** shows *ABE 55255* on the 19-inch rows and *Nachtrag 366-0350-21-WIRD/N1* on the 18-inch rows.
5. Press **Veröffentlichen** (top right) and confirm *Felge veröffentlichen?*. The check now reads **Im Shop**.

---

## 5 · The Stripe test keys

Only **test** keys (they start with `pk_test_`, `sk_test_`, `whsec_`). A live key is refused by the page and must
never be entered on the preview.

1. **Stripe Dashboard**, switched to **Test mode** (toggle top right) › **Developers › Webhooks** › **Add endpoint**:
   - Endpoint URL: `https://rimify.skillleo.com/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.processing`, `payment_intent.payment_failed`,
     `payment_intent.canceled`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`
   - Save, then open the endpoint and reveal its **Signing secret** (`whsec_…`).
2. **Developers › API keys** (Test mode): copy the **Publishable key** (`pk_test_…`) and the **Secret key** (`sk_test_…`).
3. **Admin › Einstellungen › Zahlung.** The admin asks for your password once more — type it, *Bestätigen*.
4. **Modus:** *Testmodus*. Then:
   | Field on the page | Paste |
   |---|---|
   | Öffentlicher Schlüssel | `pk_test_…` |
   | Geheimer Schlüssel | `sk_test_…` |
   | Webhook-Signaturschlüssel | `whsec_…` |
5. **Speichern**, then **Verbindung testen**. When it works: a message *Verbindung steht.* and a box with **Konto** (the
   Stripe account's name), **Land** *Deutschland*, **Währung** *eur*, **Zahlungsarten** (e.g. *Karte (mit Apple Pay
   und Google Pay)*) and **Schlüssel** *Test*. If Stripe refuses, the page shows Stripe's own error under the button —
   send it to me.

The page keeps only the last four characters of each key; you will never see them again in full, and that is right.

---

## Then

One message: *key added, deploy confirmed, cron lines in, three Gutachten released, DB8GT2 priced and published, test
keys entered.* I switch the preview's payments to Stripe and run the whole verification.
