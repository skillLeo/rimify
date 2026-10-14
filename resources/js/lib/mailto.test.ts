import { describe, expect, it } from 'vitest'
import { mailtoHref } from './mailto'

describe('mailtoHref', () => {
    it('links a plain address as it is', () => {
        expect(mailtoHref(' jana@example.com ')).toBe('mailto:jana@example.com')
    })

    it('keeps everything a customer typed inside the address: no recipient, subject or text of their choosing', () => {
        const href = mailtoHref('x?bcc=jemand@example.org&subject=Rechnung&body=Bitte zahlen@example.com')

        expect(href).toBe('mailto:x%3Fbcc%3Djemand@example.org%26subject%3DRechnung%26body%3DBitte%20zahlen@example.com')
        // Read as a link: no query at all.
        expect(new URL(href).search).toBe('')
    })
})
