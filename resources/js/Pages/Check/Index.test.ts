import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import type { CheckAnswer, CheckProps, ConfigVerdict, ProduktConfig } from '../../types/pages'
import type { VehicleProp } from '../../types/rimify'

/*
 * The client's #28: „Passt diese Felge auf mein Auto?“ — the car, the wheel and its size each a visit, so the address
 * carries the question; one answer for the pair; „Jetzt kaufen“ for exactly that combination, then the basket; and the
 * link to the answer, to send to a friend.
 */

const post = vi.fn()
const get = vi.fn()
const visit = vi.fn()
let forms: Array<Record<string, unknown>> = []
const shared: { vehicle: VehicleProp | null; smallBusiness: boolean } = { vehicle: null, smallBusiness: false }

vi.mock('@inertiajs/vue3', () => ({
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    router: { get: (...args: unknown[]) => get(...args), visit: (...args: unknown[]) => visit(...args) },
    usePage: () => ({ url: '/rimify-check?felge=db8gt2', props: shared }),
    useForm: <T extends object>(data: T) => {
        const form = reactive({
            ...data,
            errors: {} as Record<string, string>,
            processing: false,
            post: (...args: unknown[]) => post(...args),
            clearErrors: () => {
                form.errors = {}
            },
        })
        forms.push(form)

        return form
    },
}))

const { default: Check } = await import('./Index.vue')
const { toast } = await import('../../Components/Chrome/toast')

const SelectorStub = defineComponent({
    name: 'VehicleSelector',
    props: { basePath: String, baseQuery: Object, returnTo: String },
    setup: () => () => h('div', { class: 'selector-stub' }),
})

const VEHICLE: VehicleProp = {
    id: 127,
    make: 'BMW',
    model: 'X3',
    variant: 'xDrive30d',
    label: 'BMW X3 xDrive30d',
    short: 'BMW X3',
    hsn: '0005',
    tsn: 'CKT',
    keyNumbers: '0005 / CKT',
    buildWindow: '2017–2021',
}

function verdict(overrides: Partial<ConfigVerdict> = {}): ConfigVerdict {
    return {
        status: 'CONDITIONAL',
        label: 'Mit Auflagen freigegeben',
        sellable: true,
        requiresEntry: false,
        entryNoteDe: null,
        conditions: [],
        centreBore: null,
        centreBoreSource: 'UNSTATED',
        reason: null,
        reasonCode: null,
        document: null,
        tyreSizes: [],
        ...overrides,
    }
}

function config(overrides: Partial<ProduktConfig> = {}): ProduktConfig {
    return {
        id: 110,
        finishId: 3,
        sku: 'BO-DB8GT2-8519-35',
        diameterIn: 19,
        widthIn: 8.5,
        etMm: 35,
        sizeLabel: '8,5J × 19 · ET 35',
        fullLabel: '8,5J × 19 · ET 35 · LK 5 × 112 · 66,6 mm',
        boltPattern: '5 × 112',
        centreBore: '66,6 mm',
        hump: null,
        priceCents: 22_900,
        price: '229,00 €',
        amounts: [
            { quantity: 1, cents: 22_900, text: '229,00 €' },
            { quantity: 4, cents: 91_600, text: '916,00 €' },
        ],
        stockQty: 12,
        inStock: true,
        kbaNumber: null,
        weightG: null,
        verdict: verdict(),
        komplettrad: {
            refusal: null,
            refusalCode: null,
            minSentence: null,
            priceOpen: false,
            quantity: 4,
            tyres: [
                {
                    id: 7,
                    brandName: 'Bridgestone',
                    name: 'Potenza Sport',
                    season: 'sommer',
                    seasonLabel: 'Sommerreifen',
                    sizeLabel: '245/45 R19 100Y',
                    stockQty: 8,
                    tyrePriceCents: 15_000,
                    tyrePrice: '150,00 €',
                    perWheelCents: 40_400,
                    perWheel: '404,00 €',
                    forFourCents: 161_600,
                    forFour: '1.616,00 €',
                    prices: [
                        { colourId: 1, perWheel: '404,00 €', forFourCents: 161_600, forFour: '1.616,00 €' },
                        { colourId: 2, perWheel: '409,00 €', forFourCents: 163_600, forFour: '1.636,00 €' },
                    ],
                    label: null,
                    isDemo: false,
                },
            ],
        },
        ...overrides,
    } as ProduktConfig
}

function answer(overrides: Partial<ProduktConfig> = {}): CheckAnswer {
    return {
        product: { slug: 'borbet-db8gt2', brandName: 'BORBET', modelName: 'DB8GT2', finishId: 3, finishName: 'Graphite Glossy' },
        config: config(overrides),
        komplettradOptions: {
            colours: [
                { id: 1, name: 'Silber', swatchHex: '#c0c0c0', surchargeCents: 0, surcharge: '0,00 €', isDefault: true },
                { id: 2, name: 'Schwarz', swatchHex: '#111111', surchargeCents: 500, surcharge: '5,00 €', isDefault: false },
            ],
            tpms: { applicable: false, quantity: 4, available: false, choice: null, yesTotal: null },
        },
    } as CheckAnswer
}

function props(overrides: Partial<CheckProps> = {}): CheckProps {
    return {
        makes: [],
        models: [],
        variants: [],
        selectedMake: null,
        selectedModel: null,
        wheelBrands: [
            { slug: 'borbet', name: 'BORBET' },
            { slug: 'motec', name: 'MOTEC' },
        ],
        wheelModels: [{ slug: 'borbet-db8gt2', name: 'DB8GT2' }],
        wheelSizes: [
            { id: 110, label: 'Graphite Glossy · 8,5J × 19 · ET 35' },
            { id: 111, label: 'Graphite Glossy · 9J × 20 · ET 40' },
        ],
        chosen: { brand: 'borbet', wheel: 'borbet-db8gt2', size: 110 },
        answer: null,
        ...overrides,
    } as CheckProps
}

let wrappers: VueWrapper[] = []

function mountCheck(overrides: Partial<CheckProps> = {}): VueWrapper {
    const wrapper = mount(Check, {
        props: props(overrides),
        attachTo: document.body,
        global: { stubs: { VehicleSelector: SelectorStub, FitmentPanel: true, FitmentDetail: true, Icon: true, VerdictBadge: true } },
    })
    wrappers.push(wrapper)

    return wrapper
}

beforeEach(() => {
    post.mockReset()
    get.mockReset()
    visit.mockReset()
    forms = []
    shared.vehicle = null
})

afterEach(() => {
    wrappers.forEach((wrapper) => wrapper.unmount())
    wrappers = []
    vi.restoreAllMocks()
})

describe('RIMIFY-Check', () => {
    it('asks the one question, and asks for the car before it answers — keeping the wheel chosen', () => {
        const wrapper = mountCheck()
        const selector = wrapper.findComponent(SelectorStub)

        expect(wrapper.find('h1').text()).toBe('Passt diese Felge auf mein Auto?')
        expect(selector.props('basePath')).toBe('/rimify-check')
        expect(selector.props('baseQuery')).toEqual({ hersteller: 'borbet', felge: 'borbet-db8gt2', groesse: 110 })
        // Once the car is chosen the visitor comes back here, the wheel already chosen.
        expect(selector.props('returnTo')).toBe('/rimify-check?hersteller=borbet&felge=borbet-db8gt2&groesse=110')
        expect(wrapper.find('.chk__ask').text()).toContain('Wähl oben dein Auto')
        expect(wrapper.find('#antwort').exists()).toBe(false)
    })

    it('says once that no wheel is in the shop yet, instead of four empty fields, with a way to ask', () => {
        const wrapper = mountCheck({ wheelBrands: [] })
        const none = wrapper.get('.chk__none')

        expect(wrapper.find('#chk-brand').exists()).toBe(false)
        expect(none.text().replace(/\s+/g, ' ')).toBe('Noch ist keine Felge im Sortiment. Sobald die ersten freigegeben sind, prüfst du sie hier. Schreib uns, welche du suchst.')
        expect(none.get('a').attributes('href')).toBe('/kontakt?betreff=Ich+suche+eine+Felge&von=%2Frimify-check')
    })

    it('makes every wheel choice a visit, a beat after the last change, so the address carries the question', async () => {
        vi.useFakeTimers()
        const wrapper = mountCheck({ selectedMake: 'BMW' })

        await wrapper.find('#chk-brand').setValue('motec')
        vi.advanceTimersByTime(300)
        // The car's drill under way stays in the address (CHECK-15).
        expect(get).toHaveBeenLastCalledWith('/rimify-check', { marke: 'BMW', hersteller: 'motec' }, expect.objectContaining({ preserveScroll: true }))

        await wrapper.find('#chk-wheel').setValue('borbet-db8gt2')
        vi.advanceTimersByTime(300)
        expect(get).toHaveBeenLastCalledWith('/rimify-check', { marke: 'BMW', hersteller: 'borbet', felge: 'borbet-db8gt2' }, expect.anything())

        // Three sizes browsed with the arrow keys: one visit, for the last (CHECK-12).
        get.mockClear()
        for (const size of ['111', '110', '111']) {
            await wrapper.find('#chk-size').setValue(size)
            vi.advanceTimersByTime(100)
        }
        vi.advanceTimersByTime(300)
        expect(get).toHaveBeenCalledTimes(1)
        expect(get).toHaveBeenLastCalledWith('/rimify-check', { marke: 'BMW', hersteller: 'borbet', felge: 'borbet-db8gt2', groesse: 111 }, expect.anything())
        vi.useRealTimers()
    })

    it('marks the chosen options selected, so the first frame of a shared link shows its choice (CHECK-04)', () => {
        const wrapper = mountCheck({ wheelFinishes: [{ id: 3, name: 'Graphite Glossy' }], chosen: { brand: 'borbet', wheel: 'borbet-db8gt2', finish: 3, size: 111 } })

        expect(wrapper.find('#chk-brand option[value="borbet"]').attributes('selected')).toBeDefined()
        expect(wrapper.find('#chk-wheel option[value="borbet-db8gt2"]').attributes('selected')).toBeDefined()
        expect(wrapper.find('#chk-finish option[value="3"]').attributes('selected')).toBeDefined()
        expect(wrapper.find('#chk-size option[value="111"]').attributes('selected')).toBeDefined()
        expect(wrapper.find('#chk-size option[value="110"]').attributes('selected')).toBeUndefined()
    })

    it('opens the selector with „Ändern“ in the address and closes it with „Abbrechen“ on the car chosen (CHECK-01, -02, -14)', async () => {
        vi.useFakeTimers()
        shared.vehicle = VEHICLE
        const wrapper = mountCheck()

        await wrapper.find('.chk__car button').trigger('click')
        vi.advanceTimersByTime(0)
        expect(get).toHaveBeenLastCalledWith('/rimify-check', { hersteller: 'borbet', felge: 'borbet-db8gt2', groesse: 110, aendern: 1 }, expect.anything())

        const open = mountCheck({ changing: true })
        const selector = open.findComponent(SelectorStub)
        // Every drill step keeps „Ändern“; the car's return address does not, so a choice closes the selector.
        expect(selector.props('baseQuery')).toEqual({ hersteller: 'borbet', felge: 'borbet-db8gt2', groesse: 110, aendern: 1 })
        expect(selector.props('returnTo')).toBe('/rimify-check?hersteller=borbet&felge=borbet-db8gt2&groesse=110')

        await open.find('.chk__cancel button').trigger('click')
        vi.advanceTimersByTime(0)
        expect(get).toHaveBeenLastCalledWith('/rimify-check', { hersteller: 'borbet', felge: 'borbet-db8gt2', groesse: 110 }, expect.anything())
        vi.useRealTimers()
    })

    it('buys nothing while another size loads, and says so if it cannot load (CHECK-06, -09)', async () => {
        vi.useFakeTimers()
        shared.vehicle = VEHICLE
        const wrapper = mountCheck({ answer: answer() })

        await wrapper.find('#chk-size').setValue('111')
        expect(wrapper.find('.chk__go').attributes('disabled')).toBeDefined()
        expect(wrapper.find('.chk__go').text()).toBe('Antwort wird geladen …')
        expect(wrapper.find('#antwort').attributes('aria-busy')).toBe('true')

        vi.advanceTimersByTime(300)
        const options = get.mock.calls.at(-1)?.[2] as { onNetworkError: () => unknown; onFinish: () => void }
        expect(options.onNetworkError()).toBe(false)
        options.onFinish()
        await flushPromises()

        expect(wrapper.find('.chk__lost[role="alert"]').text()).toContain('Keine Verbindung')
        expect(wrapper.find('.chk__go').text()).toBe('Jetzt kaufen')
        vi.useRealTimers()
    })

    it('keeps the tyre and colour chosen when a refused add comes back as a new answer (CHECK-08)', async () => {
        shared.vehicle = VEHICLE
        const twoTyres = answer()
        const first = twoTyres.config.komplettrad!.tyres[0]!
        twoTyres.config.komplettrad!.tyres.push({ ...first, id: 8, name: 'Turanza' })
        const wrapper = mountCheck({ answer: twoTyres })

        await wrapper.find('input[name="chk-mode"][value="komplettrad"]').setValue()
        await wrapper.find('input[name="kc-tyre"][value="8"]').setValue()
        await wrapper.find('input[name="kc-weights"][value="2"]').setValue()

        // The refusal: the same size again, a new object, with the sentence under the button.
        ;(forms[0]?.errors as Record<string, string>).tyreVariantId = 'Diesen Reifen haben wir gerade nicht in der benötigten Menge auf Lager.'
        await wrapper.setProps({ answer: JSON.parse(JSON.stringify(twoTyres)) as CheckAnswer })
        await flushPromises()

        expect((wrapper.find('input[name="kc-tyre"][value="8"]').element as HTMLInputElement).checked).toBe(true)
        expect((wrapper.find('input[name="kc-weights"][value="2"]').element as HTMLInputElement).checked).toBe(true)
        expect(wrapper.find('.chk__error').text()).toContain('Diesen Reifen haben wir gerade nicht')
    })

    it('leads to the product page on the size answered (CHECK-13)', () => {
        shared.vehicle = VEHICLE
        const link = mountCheck({ answer: answer() }).findAll('.chk__more a').find((a) => a.text() === 'Alles zur Felge auf der Produktseite')

        expect(link?.attributes('href')).toBe('/felgen/borbet-db8gt2?ausfuehrung=3&groesse=110')
    })

    it('answers for the pair and buys exactly it: four rims into the basket, then the basket', async () => {
        shared.vehicle = VEHICLE
        const wrapper = mountCheck({ answer: answer() })

        expect(wrapper.find('.chk__pair').text()).toContain('BORBET DB8GT2')
        expect(wrapper.find('.chk__pair').text()).toContain('für BMW X3 xDrive30d')
        expect(wrapper.find('.chk__price .price').text()).toBe('916,00 €')

        await wrapper.find('.chk__go').trigger('click')

        expect(forms[0]).toMatchObject({ wheelConfigId: 110, tyreVariantId: null, weightColourId: null, quantity: 4 })
        const options = post.mock.calls[0]?.[1] as { onSuccess: (page: { component: string }) => void }
        expect(post.mock.calls[0]?.[0]).toBe('/warenkorb')

        // Only the add's own answer leads on; an error page stays where the visitor can read it.
        options.onSuccess({ component: 'Fehler/Index' })
        expect(visit).not.toHaveBeenCalled()
        options.onSuccess({ component: 'Check/Index' })
        expect(visit).toHaveBeenCalledWith('/warenkorb', expect.anything())

        // On its way to the basket the page buys nothing more, however often the button is pressed (CHECK-07).
        await flushPromises()
        expect(wrapper.find('.chk__go').attributes('aria-busy')).toBe('true')
        await wrapper.find('.chk__go').trigger('click')
        expect(post).toHaveBeenCalledTimes(1)
    })

    it('buys the Komplettrad with the tyre and the colour chosen, priced in that colour', async () => {
        shared.vehicle = VEHICLE
        const wrapper = mountCheck({ answer: answer() })

        await wrapper.find('input[name="chk-mode"][value="komplettrad"]').setValue()
        expect(wrapper.find('.chk__price .price').text()).toBe('1.616,00 €')

        await wrapper.find('input[name="kc-weights"][value="2"]').setValue()
        expect(wrapper.find('.chk__price .price').text()).toBe('1.636,00 €')

        await wrapper.find('.chk__go').trigger('click')

        expect(forms[0]).toMatchObject({ wheelConfigId: 110, tyreVariantId: 7, weightColourId: 2, quantity: 4 })
    })

    it('sells nothing where the document does not cover the pair, and says why with two ways on', () => {
        shared.vehicle = VEHICLE
        const wrapper = mountCheck({ answer: answer({ verdict: verdict({ status: 'NOT_PERMITTED', label: 'Nicht freigegeben', sellable: false }) }) })

        expect(wrapper.find('.chk__go').exists()).toBe(false)
        expect(wrapper.find('.chk__nosale-text').text()).toBe('In dieser Größe ist die Felge für dein Auto nicht freigegeben, deshalb bieten wir sie dafür nicht an.')
        expect(wrapper.find('.chk__nosale-go a[href="/felgen"]').text()).toBe('Passende Felgen für BMW X3')
        expect(wrapper.find('.chk__nosale-go a[href^="/kontakt"]').exists()).toBe(true)
    })

    it('starts another choice clean: a refusal of the last add goes with the mode it was made under', async () => {
        shared.vehicle = VEHICLE
        const wrapper = mountCheck({ answer: answer() })
        ;(forms[0]?.errors as Record<string, string>).wheelConfigId = 'Diese Größe ist derzeit ausverkauft.'
        await flushPromises()
        expect(wrapper.find('.chk__error').exists()).toBe(true)

        await wrapper.find('input[name="chk-mode"][value="komplettrad"]').setValue()
        expect(wrapper.find('.chk__error').exists()).toBe(false)
    })

    it('says why a Komplettrad cannot be bought when fewer rims than a set are on the shelf', async () => {
        shared.vehicle = VEHICLE
        const wrapper = mountCheck({ answer: answer({ stockQty: 2 }) })

        // Two rims: „Nur Felgen“ sells the two.
        expect(wrapper.find('.chk__go').text()).toBe('Jetzt kaufen')
        expect(wrapper.find('.chk__why').exists()).toBe(false)

        await wrapper.find('input[name="chk-mode"][value="komplettrad"]').setValue()

        expect(wrapper.find('.chk__go').attributes('disabled')).toBeDefined()
        expect(wrapper.find('.chk__go').text()).toBe('Komplettrad gerade nicht möglich')
        expect(wrapper.find('.chk__why').text()).toBe('Von dieser Felge haben wir nur noch 2 Stück auf Lager – für einen Satz Kompletträder brauchen wir 4.')
    })

    it('says so when a shared link names a wheel or a size the shop no longer has', () => {
        expect(mountCheck({ notFound: 'wheel' }).find('.chk__lost').text()).toBe(
            'Die Felge aus dem Link gibt es bei uns nicht mehr. Wähl einen Hersteller und eine andere Felge.'
        )
        expect(mountCheck({ notFound: 'size' }).find('.chk__lost').text()).toBe('Diese Felge gibt es in der Größe aus dem Link nicht mehr. Wähl oben eine andere Größe.')
        expect(mountCheck().find('.chk__lost').exists()).toBe(false)
    })

    it('copies the link to the answer, and says so', async () => {
        shared.vehicle = VEHICLE
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
        const show = vi.spyOn(toast, 'show')
        const wrapper = mountCheck({ answer: answer() })

        await wrapper.find('.chk__copy').trigger('click')
        await flushPromises()

        expect(writeText).toHaveBeenCalledWith(window.location.href)
        // The link carries the car, the wheel and the size — not what the visitor typed from their papers (CHECK-17).
        expect(show).toHaveBeenCalledWith({ text: 'Link kopiert – er führt zu diesem Auto mit dieser Felge. Angaben aus deinen Fahrzeugpapieren stehen nicht darin.' })
    })
})
