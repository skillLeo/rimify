import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'

/*
 * Inhalte › Meistgekaufte Felgen (the client's #5, D-353): the shelf as it stands, each rim with its reason, and eight
 * places for the team's picks — each rim once, moved up and down, saved without the empty places.
 */

const put = vi.fn()
const inertiaProps = reactive<{ errors: Record<string, string> }>({ errors: {} })

vi.mock('@inertiajs/vue3', () => ({
    router: { put: (...args: unknown[]) => put(...args) },
    usePage: () => ({ props: inertiaProps }),
}))

vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => slots.default?.() }) }))
vi.mock('../../../Components/Admin/AdminIcon.vue', () => ({ default: defineComponent({ setup: () => () => null }) }))
vi.mock('../../../Components/Admin/AdminPage.vue', () => ({
    default: defineComponent({
        props: { title: { type: String, default: '' }, context: { type: String, default: '' } },
        setup: (props, { slots }) => () => h('main', [h('h1', props.title), h('p', { class: 'context' }, props.context), slots.default?.()]),
    }),
}))

const { default: Page } = await import('./Index.vue')

const OPTIONS = [
    { value: '1:1', label: 'Borbet DB8GT2 · Schwarz matt' },
    { value: '2:3', label: 'Borbet Y · Kristallsilber' },
    { value: '3:5', label: 'Borbet LX · Graphit' },
]

type Props = InstanceType<typeof Page>['$props']

function props(overrides: Partial<Props> = {}): Props {
    return {
        size: 8,
        picks: ['2:3'],
        options: OPTIONS,
        shelf: [
            { key: '1:1', label: 'Borbet DB8GT2 · Schwarz matt', source: 'verkauft', href: '/felgen/borbet-db8gt2?ausfuehrung=1' },
            { key: '2:3', label: 'Borbet Y · Kristallsilber', source: 'ausgewaehlt', href: '/felgen/borbet-y?ausfuehrung=3' },
            { key: '3:5', label: 'Borbet LX · Graphit', source: 'neu', href: '/felgen/borbet-lx?ausfuehrung=5' },
        ],
        can: { update: true },
        ...overrides,
    } as Props
}

let mounted: VueWrapper[] = []

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    put.mockClear()
    inertiaProps.errors = {}
})

function page(p: Props = props()): VueWrapper {
    const wrapper = mount(Page, { props: p })
    mounted.push(wrapper)

    return wrapper
}

describe('Inhalte › Meistgekaufte Felgen', () => {
    it('says it shows eight, and lists the shelf as it stands with the reason for each rim', () => {
        const wrapper = page()

        expect(wrapper.find('.context').text()).toBe('Startseite · zeigt 8 Felgen')
        expect(wrapper.text()).toContain('Der Bereich auf der Startseite zeigt immer 8 Felgen.')
        const rows = wrapper.findAll('.mf__now .mf__row')
        expect(rows.map((r) => r.find('.adm-tag').text())).toEqual(['Verkauft', 'Deine Auswahl', 'Neu im Shop'])
        expect(rows[0]?.find('a').attributes('href')).toBe('/felgen/borbet-db8gt2?ausfuehrung=1')
        // Fewer than eight on sale: said, not hidden.
        expect(wrapper.text()).toContain('Im Shop sind zurzeit 3 Felgen zu kaufen; der Bereich zeigt 8, sobald es so viele gibt.')
    })

    it('offers eight places, the picks in theirs, and each rim in one place only', async () => {
        const wrapper = page()
        const selects = wrapper.findAll('select')

        expect(selects).toHaveLength(8)
        expect((selects[0]?.element as HTMLSelectElement).value).toBe('2:3')
        expect((selects[1]?.element as HTMLSelectElement).value).toBe('')
        // Taken in the first place: not offered in the second.
        expect(selects[1]?.find('option[value="2:3"]').attributes('disabled')).toBeDefined()
        expect(selects[1]?.find('option[value="1:1"]').attributes('disabled')).toBeUndefined()
    })

    it('moves a pick and saves the picks in their order, without the empty places', async () => {
        const wrapper = page()
        const selects = wrapper.findAll('select')

        await selects[2]?.setValue('1:1')
        // The third place up into the second: the empty one goes down.
        await wrapper.findAll('button[aria-label="3. Platz nach oben"]')[0]?.trigger('click')
        await wrapper.find('form').trigger('submit')

        expect(put).toHaveBeenCalledWith('/admin/meistgekaufte-felgen', { picks: ['2:3', '1:1'] }, expect.anything())
    })

    it('says a refusal above the places, and is read-only for a role that may not change the shop', () => {
        inertiaProps.errors = { 'picks.1': 'Jede Felge nur einmal: Sie stünde sonst zweimal im Bereich.' }
        expect(page().find('[role="alert"]').text()).toBe('Jede Felge nur einmal: Sie stünde sonst zweimal im Bereich.')
        inertiaProps.errors = {}

        const reader = page(props({ can: { update: false } }))
        expect(reader.find('form').exists()).toBe(false)
        expect(reader.find('.mf__picks').text()).toContain('Borbet Y · Kristallsilber')
        expect(reader.text()).toContain('Ändern braucht die Rechte „Inhalte · Bearbeiten“ und „Inhalte · Veröffentlichen“.')
    })
})
