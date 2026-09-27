/** Einstellungen › Medien und Speicher (SpeicherController). */

export interface StorageTestStep {
    step: string
    ok: boolean
    /** The storage's own words where a step failed („NoSuchBucket: …“). */
    detail: string | null
}

export interface StorageTest {
    ok: boolean
    steps: StorageTestStep[]
    at: string
}

export interface AdminSpeicherProps {
    form: {
        provider: string
        region: string
        bucket: string
        endpoint: string
        path_style: boolean
        public_url: string
    }
    /** `••••••••••••WXYZ` — never more. Null when nothing is stored. */
    keyMasked: string | null
    secretMasked: string | null
    /** Which set the disks are built from now. */
    source: 'database' | 'env' | 'local'
    /** A saved set that failed its test and is not in force. */
    pending: boolean
    verifiedAt: string | null
    test: StorageTest | null
    /** „Buckets von AWS laden“: the names the key may list, or AWS's reason why not. */
    buckets: { names: string[]; error: string | null } | null
    disks: Record<string, { prefix: string; visibility: 'public' | 'private' }>
}
