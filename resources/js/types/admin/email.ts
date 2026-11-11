/** Einstellungen › E-Mail (EmailController). */

export interface MailTestStep {
    step: string
    ok: boolean
    /** SES's own words where a step failed, or what to do next. */
    detail: string | null
}

export interface MailTest {
    ok: boolean
    /** `brevo` for Brevo's sign-in (D-450); absent on SES's. */
    provider?: 'brevo'
    steps: MailTestStep[]
    at: string
    production_access?: boolean
    sending_enabled?: boolean
    identity_verified?: boolean
    dkim_tokens?: string[]
}

export interface MailDnsRecord {
    kind: 'SPF' | 'DKIM' | 'DMARC'
    type: 'TXT' | 'MX' | 'CNAME'
    name: string
    value: string
    found: boolean
}

export interface MailSuppressionRow {
    id: number
    email: string
    reason: 'Unzustellbar' | 'Beschwerde'
    detail: string | null
    at: string
}

export interface AdminEmailProps {
    /** What the form was opened on (EditStamp): a save against an older state is refused. */
    stamp: string
    form: {
        /** Amazon SES or Brevo (D-450). */
        provider: 'ses' | 'brevo'
        /** Brevo's SMTP login, as SMTP & API › SMTP shows it. */
        smtp_login: string
        from_address: string
        from_name: string
        topic_arn: string
    }
    region: string
    /** `••••••••••••WXYZ` — never more. Null when nothing is stored. */
    keyMasked: string | null
    secretMasked: string | null
    /** A saved set whose key did not work, and which is not in force. */
    pending: boolean
    verifiedAt: string | null
    /** Whether the shop's mail goes through SES or Brevo now. */
    sending: boolean
    /** Which of the two, while one is in force. */
    sendingProvider?: 'ses' | 'brevo' | null
    /** What the last „Test-E-Mail senden“ did: sent, or the transport's words. */
    testMail?: { ok: boolean; to: string; error: string | null } | null
    /** `smtp-relay.brevo.com:587` */
    brevoHost?: string
    /** The mailer in force otherwise (`log` until SES is cleared). */
    mailer: string
    test: MailTest | null
    dns: MailDnsRecord[]
    domain: string | null
    webhookUrl: string
    /** The newest blocked addresses — at most EmailController::SUPPRESSIONS_SHOWN — or those the search finds. */
    suppressions: MailSuppressionRow[]
    /** Every address in force on the block list. */
    suppressionsTotal?: number
    /** What the search finds, over the whole list. */
    suppressionsFound?: number
    /** The part of an address searched for; empty for none. */
    suppressionSearch?: string
}
