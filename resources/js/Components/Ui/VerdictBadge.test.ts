import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import VerdictBadge from './VerdictBadge.vue'

/** The colour of a CONDITIONAL answer (the client's #23, D-420): how it looks, never what it says. */
describe('VerdictBadge', () => {
    it('wears green for a conditional answer the server calls green, and keeps its words', () => {
        const badge = mount(VerdictBadge, { props: { status: 'CONDITIONAL', hint: 'green' } })

        expect(badge.classes()).toContain('verdict--ok')
        expect(badge.classes()).not.toContain('verdict--warn')
        expect(badge.text()).toBe('Mit Auflagen')
    })

    it('wears yellow for a conditional answer the server calls yellow, and yellow where it says nothing', () => {
        const yellow = mount(VerdictBadge, { props: { status: 'CONDITIONAL', hint: 'yellow' } })
        const unsaid = mount(VerdictBadge, { props: { status: 'CONDITIONAL' } })

        for (const badge of [yellow, unsaid]) {
            expect(badge.classes()).toContain('verdict--warn')
            expect(badge.text()).toBe('Mit Auflagen')
        }
    })

    it('lets no hint change any other answer', () => {
        const others = [['PERMITTED', 'verdict--ok', 'Freigegeben'], ['NOT_PERMITTED', 'verdict--bad', 'Nicht freigegeben'], ['UNKNOWN', 'verdict--unk', 'Noch nicht bestätigt']] as const

        for (const [status, cls, words] of others) {
            const badge = mount(VerdictBadge, { props: { status, hint: 'green' } })

            expect(badge.classes()).toContain(cls)
            expect(badge.text()).toBe(words)
        }
    })
})
