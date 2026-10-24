/** Einstellungen › E-Mail (EmailController). */

export interface MailTestStep {
    step: string
    ok: boolean
    /** SES's own words where a step failed, or what to do next. */
    detail: string | null
}

export interface MailTest {
    ok: boolean
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
    /** Whether the shop's mail goes through SES now. */
    sending: boolean
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
