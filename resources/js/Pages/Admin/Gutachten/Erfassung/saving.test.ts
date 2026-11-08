import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive, type Component } from 'vue'
import type { EntryView, ServerLine } from './entryStore'

/*
 * What the interaction review of 06.11.2026 found in the five steps: saves that never stop, the end of typing lost, a failed save
 * dropped on moving on, a car that failed to load wiped, ticks that lie, typed text thrown away. Each case as it was reproduced,
 * against the parts themselves; the browser's own part stays in e2e/gutachten-erfassung.spec.ts.
 */

const page = vi.hoisted(() => ({ url: '/admin/gutachten/9', props: {} as Record<string, unknown> }))
const forms = vi.hoisted(() => [] as Record<string, unknown>[])

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue')

    return {
        usePage: () => page,
        router: { put: vi.fn(), reload: vi.fn(), on: () => () => {}, replaceProp: vi.fn() },
        useForm: (data: Record<string, unknown>) => {
            const fields = Object.keys(data)
            const form = reactive({
                ...data,
                errors: {} as Record<string, string>,
                processing: false,
                data: () => Object.fromEntries(fields.map((field) => [field, (form as Record<string, unknown>)[field]])),
                transform: () => form,
                post: vi.fn(),
                put: vi.fn(),
            })

            forms.push(form)

            return form
        },
    }
})

const { ENTRY, createEntryStore } = await import('./entryStore')
const { default: LinesEditor } = await import('./LinesEditor.vue')
const { default: StepCars } = await import('./StepCars.vue')
const { default: PdfPanel } = await import('./PdfPanel.vue')
const { default: PasteDialog } = await import('./PasteDialog.vue')
const { default: CodeTags } = await import('./CodeTags.vue')
const { default: CodeDefine } = await import('./CodeDefine.vue')
const { default: CodesPanel } = await import('./CodesPanel.vue')

const COMBINATION = { id: 1, frontId: 1, rearId: 1, frontKey: 'a', rearKey: 'a', frontConfigId: 1, rearConfigId: 1, same: true, badge: 'gleich vorne und hinten', label: 'Vorne und hinten 8 × 18 ET 35', frontLabel: '', rearLabel: '', frontDiameter: 18, rearDiameter: 18, warnings: [] }
const CAR = { id: 5, combinationId: 1, vehicleId: 50, label: 'BMW 3er', hsnTsn: null, kw: null, k: null, gone: false, lines: 0, pairs: 0, unread: 0, codes: 0, done: false, page: null, copiedFrom: null, unsourced: false, sourceLabel: null, axle: 'ALL', finish: null, conflict: false }
const NEXT = { ...CAR, id: 6, vehicleId: 60, label: 'BMW 4er' }

function entry(cars = [CAR, NEXT]): EntryView {
    return { wheelSizes: [], combinations: [COMBINATION], printed: [], cars, conflicts: [], unreachable: [], hasList: false, keptCombinations: 0, unread: [], undescribed: [], suggestion: null }
}

function serverLine(over: Partial<ServerLine>): ServerLine {
    return { id: 1, front: '', rear: '', oneSided: false, kw: '', codes: [], outsideList: false, frontWhy: null, rearWhy: null, ...over }
}

type Sent = { method: string; url: string; body: Record<string, unknown>; headers: Record<string, string> }

let sent: Sent[] = []
/* Answers the test wants to give by hand, in order; the server's usual answer otherwise. */
let held: ((answer: Response) => void)[] = []
let hold = false
let reply: (call: Sent) => Response | null = () => null

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function put(call: Sent): Response {
    const lines = (call.body.lines as { id: number | null; front: string; rear: string; kw: string; codes: string[] }[]).filter((line) => line.front.trim() !== '' || line.rear.trim() !== '')

    return json({
        stamp: `after-${sent.filter((c) => c.method === 'PUT').length}`,
        car: { id: 5, page: null, codes: [], columns: {}, lines: lines.map((line, i) => serverLine({ id: line.id ?? 100 + i, front: line.front || line.rear, rear: line.rear || line.front, kw: line.kw })) },
        entry: entry(),
    })
}

beforeEach(() => {
    vi.useFakeTimers()
    sent = []
    held = []
    hold = false
    reply = () => null
    forms.length = 0
    page.props = {
        conditions: [],
        choices: { kinds: [], bodyForms: [], drives: [] },
        levels: [],
        unresolved: [],
        can: { levels: false },
        document: { pageCount: 4, hasPdf: true, pdfVersion: 'abc123', pdfUrl: '/pdf' },
    }
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}): Promise<Response> => {
        const call: Sent = { method: init.method ?? 'GET', url, body: init.body ? JSON.parse(String(init.body)) : {}, headers: (init.headers ?? {}) as Record<string, string> }

        sent.push(call)

        const special = reply(call)

        if (special !== null) {
            return special
        }

        if (call.method === 'PUT' && hold) {
            return new Promise<Response>((resolve) => held.push(() => resolve(put(call))))
        }

        if (call.method === 'PUT') {
            return put(call)
        }

        return json({ id: 5, page: null, codes: [], columns: {}, lines: [], stamp: 'loaded' })
    }))
})

let wrappers: VueWrapper[] = []

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.useRealTimers()
})

function withStore(part: Component, props: Record<string, unknown> = {}, cars = [CAR, NEXT]) {
    const store = createEntryStore({ documentId: 9, entry: entry(cars), step: 3, car: 5, editable: true })
    const wrapper = mount(defineComponent({ setup: () => () => h(part, props) }), { global: { provide: { [ENTRY as symbol]: store } }, attachTo: document.body })

    wrappers.push(wrapper)

    return { store, wrapper }
}

async function settle(ms = 0): Promise<void> {
    await vi.advanceTimersByTimeAsync(ms)
    await nextTick()
}

async function editor(lines: ServerLine[] = []) {
    reply = (call) => (call.method === 'GET' ? json({ id: 5, page: 2, codes: [], columns: {}, lines, stamp: 'loaded' }) : null)

    const made = withStore(LinesEditor, { car: CAR, wheelName: 'Felge', combination: COMBINATION })

    await settle()

    return made
}

async function typeLine(wrapper: VueWrapper, text: string): Promise<void> {
    await wrapper.find('.ef-editor__adds .btn--secondary').trigger('click')
    await settle()
    await wrapper.findAll('.ef-line').at(-1)!.find('input[id^="ef-front-"]').setValue(text)
}

const puts = () => sent.filter((call) => call.method === 'PUT')

describe('the tyres of one car', () => {
    it('saves once per change, and stays quiet after the answer', async () => {
        const { wrapper } = await editor()

        await typeLine(wrapper, '225/40 R18 88W')
        await settle(600)
        expect(puts()).toHaveLength(1)

        // The answer brought an id and a word about each side: 15 saves in 10 s, in the review.
        await settle(10_000)
        expect(puts()).toHaveLength(1)
    })

    it('counts neither an empty new line nor a redraw as a change', async () => {
        const { wrapper } = await editor()

        await wrapper.find('.ef-editor__adds .btn--secondary').trigger('click')
        await settle(5000)

        expect(puts()).toHaveLength(0)
    })

    it('sends the end of a size after the answer to its beginning, with that answer’s stamp, and only then moves on', async () => {
        const { store, wrapper } = await editor()

        hold = true
        await typeLine(wrapper, '235/40R18')
        await settle(600)
        expect(puts()).toHaveLength(1)

        await wrapper.find('input[id^="ef-front-"]').setValue('235/40R18 95Y')
        await wrapper.find('.ef-actions .btn--primary').trigger('click')
        await settle()

        // Still the first one on its way: never a second beside it, and the screen stays.
        expect(puts()).toHaveLength(1)
        expect(store.state.carId).toBe(5)

        held.shift()!(new Response())
        await settle()

        expect(puts()).toHaveLength(2)
        expect((puts()[1]!.body.lines as { front: string }[])[0]!.front).toBe('235/40R18 95Y')
        expect(puts()[1]!.headers['X-Rimify-Stand']).toBe('after-1')
        expect(store.state.carId).toBe(5)

        held.shift()!(new Response())
        await settle()

        expect(store.state.carId).toBe(6)
    })

    it('does the same when the next car is picked from the list: the review lost the end of the size that way, 3 of 3', async () => {
        const { store, wrapper } = await editor()

        hold = true
        await typeLine(wrapper, '235/40R18')
        await settle(600)
        await wrapper.find('input[id^="ef-front-"]').setValue('235/40R18 95Y')

        const moved = store.openCar(6)

        await settle()
        expect(store.state.carId).toBe(5)
        expect(store.unsaved()).toBe(true)

        held.shift()!(new Response())
        await settle()
        expect((puts()[1]!.body.lines as { front: string }[])[0]!.front).toBe('235/40R18 95Y')
        expect(puts()[1]!.headers['X-Rimify-Stand']).toBe('after-1')

        held.shift()!(new Response())
        await moved

        expect(store.state.carId).toBe(6)
        expect(store.unsaved()).toBe(false)
    })

    it('stays on the car when a save fails, says so beside the button, and tries again', async () => {
        const { store, wrapper } = await editor()

        reply = (call) => (call.method === 'PUT' ? json({}, 500) : null)
        await typeLine(wrapper, '225/40 R18 88W')
        await wrapper.find('.ef-actions .btn--primary').trigger('click')
        await settle()

        expect(store.state.carId).toBe(5)
        expect(wrapper.find('.ef-actions [role="alert"]').text()).toContain('nicht gespeichert')

        // Connected again: the button that says so, and it saves.
        reply = () => null
        await wrapper.find('.ef-actions [role="alert"] button').trigger('click')
        await settle()

        expect(puts()).toHaveLength(2)
        expect(wrapper.find('.ef-actions [role="alert"]').exists()).toBe(false)
        expect(store.state.carId).toBe(5)

        await wrapper.find('.ef-actions .btn--primary').trigger('click')
        await settle()

        expect(store.state.carId).toBe(6)
    })

    it('holds back a kW band it cannot read, stays, and opens the line that has it', async () => {
        const { store, wrapper } = await editor([serverLine({ id: 1, front: '225/40 R18', rear: '225/40 R18', kw: '85 bis 142' })])

        await typeLine(wrapper, '255/35 R18 94Y')
        await wrapper.find('.ef-actions .btn--primary').trigger('click')
        await settle()

        expect(puts()).toHaveLength(0)
        expect(store.state.carId).toBe(5)
        expect(wrapper.find('.ef-actions [role="alert"]').text()).toContain('kW-Bereich')
        expect(wrapper.find('input[id^="ef-kw-"]').exists()).toBe(true)
    })

    it('does not open the copy dialog before the server holds every line on screen', async () => {
        const { wrapper } = await editor()

        reply = (call) => (call.method === 'PUT' ? json({}, 500) : null)
        await typeLine(wrapper, '225/40 R18 88W')
        await wrapper.find('.ef-actions .btn--secondary').trigger('click')
        await settle()

        expect(document.querySelector('[role="dialog"]')).toBeNull()
        expect(wrapper.find('.ef-actions [role="alert"]').exists()).toBe(true)
    })

    it('offers nothing to type in a car that failed to load, or an empty list would be saved over the stored one', async () => {
        reply = (call) => (call.method === 'GET' ? json({}, 500) : null)

        const { wrapper } = withStore(LinesEditor, { car: CAR, wheelName: 'Felge', combination: COMBINATION })

        await settle()

        expect(wrapper.find('[role="alert"]').text()).toContain('nicht geladen')
        expect(wrapper.find('input').exists()).toBe(false)
        expect(wrapper.find('.ef-editor__adds').exists()).toBe(false)

        reply = (call) => (call.method === 'GET' ? json({ id: 5, page: null, codes: [], columns: {}, lines: [serverLine({ front: '205/55 R16 91V', rear: '205/55 R16 91V' })], stamp: 'loaded' }) : null)
        await wrapper.find('[role="alert"] button').trigger('click')
        await settle()

        expect((wrapper.find('input[id^="ef-front-"]').element as HTMLInputElement).value).toBe('205/55 R16 91V')
        expect(puts()).toHaveLength(0)
    })

    it('says why the server kept a size as typed, also while an empty line stands below it', async () => {
        const { wrapper } = await editor()

        // A size the browser reads and the server keeps as typed (its width is beyond what the shop takes): an index above 279 the browser
        // already refuses itself (D-442).
        await typeLine(wrapper, '365/40 R18 95Y')
        await wrapper.find('.ef-editor__adds .btn--secondary').trigger('click')
        await settle()

        reply = (call) => (call.method === 'PUT'
            ? json({ stamp: 'x', entry: entry(), car: { id: 5, page: null, codes: [], columns: {}, lines: [serverLine({ id: 7, front: '365/40 R18 95Y', rear: '365/40 R18 95Y', frontWhy: 'Gib die Reifenbreite in Millimetern an, zwischen 125 und 355.' })] } })
            : null)
        await settle(600)

        expect(wrapper.find('.ef-line').text()).toContain('Gib die Reifenbreite in Millimetern an, zwischen 125 und 355.')
    })

    it('reads a kW band once whichever way it was typed', async () => {
        const { wrapper } = await editor([serverLine({ front: '225/40 R18', rear: '225/40 R18', kw: '170 kW' }), serverLine({ id: 2, front: '235/40 R18', rear: '235/40 R18', kw: '85-142' })])

        expect(wrapper.findAll('.ef-line__notes .adm-tag').map((tag) => tag.text())).toEqual(['170 kW', '85–142 kW'])
    })

    it('shows the same on both sides as the server stores, where one is left empty', async () => {
        const { wrapper } = await editor([serverLine({ front: '225/40 R18', rear: '225/40 R18' })])
        const front = wrapper.find('input[id^="ef-front-"]')
        const rear = wrapper.find('input[id^="ef-rear-"]')

        await rear.setValue('255/35 R18')
        await front.setValue('')
        await front.trigger('blur')

        expect((front.element as HTMLInputElement).value).toBe('255/35 R18')
    })

    it('says a page is no page, and keeps the stored one meanwhile', async () => {
        const { wrapper } = await editor()

        await wrapper.find('#ef-page').setValue('abc')
        expect(wrapper.find('#ef-page-err').text()).toContain('ganze Zahl')

        await typeLine(wrapper, '225/40 R18')
        await settle(600)

        expect(puts()[0]!.body.source_page).toBe(2)
    })

    it('sends a car’s own columns once they were opened, also with the fold closed again at once', async () => {
        const { wrapper } = await editor()
        const fold = wrapper.find('details.ef-more')

        ;(fold.element as HTMLDetailsElement).open = true
        await fold.trigger('toggle')
        await wrapper.find('#ef-col-note').setValue('Nur mit Abnahme')
        ;(fold.element as HTMLDetailsElement).open = false
        await fold.trigger('toggle')
        await settle(600)

        expect(puts()[0]!.body.entry_note).toBe('Nur mit Abnahme')
    })

    it('hands the keyboard to the next car’s heading when a person moved there', async () => {
        reply = (call) => (call.method === 'GET' ? json({ id: 5, page: null, codes: [], columns: {}, lines: [], stamp: 'x' }) : null)

        const { store } = withStore(LinesEditor, { car: CAR, wheelName: 'Felge', combination: COMBINATION })

        await settle()
        expect(document.activeElement?.id).not.toBe('ef-editor-h')

        wrappers.forEach((w) => w.unmount())
        wrappers = []
        store.state.focusEditor = true

        const again = mount(defineComponent({ setup: () => () => h(LinesEditor, { car: NEXT, wheelName: 'Felge', combination: COMBINATION }) }), { global: { provide: { [ENTRY as symbol]: store } }, attachTo: document.body })

        wrappers.push(again)
        await settle()

        expect(document.activeElement?.id).toBe('ef-editor-h')
        expect(store.state.focusEditor).toBe(false)
    })
})

describe('step 3, the ticks', () => {
    const HITS = [{ id: 50, label: 'BMW 3er', hsnTsn: '0005 BGU', kw: 100, k: 'e1', window: null, needsReview: false }, { id: 70, label: 'BMW 5er', hsnTsn: null, kw: null, k: null, window: null, needsReview: false }]

    async function cars(chosen = [{ ...CAR, lines: 2 }]) {
        reply = (call) => (call.method === 'GET' ? json({ items: HITS, total: 2 }) : null)

        const made = withStore(StepCars, {}, chosen)

        await made.wrapper.find('#ef-cars-q').setValue('BMW')
        await settle(250)

        return made
    }

    const box = (wrapper: VueWrapper, i: number) => wrapper.findAll<HTMLInputElement>('.ef-hit input[type="checkbox"]')[i]!

    it('keeps a box ticked while the question about the car’s tyres stands open or is answered „Abbrechen“', async () => {
        const { wrapper } = await cars()
        const tick = box(wrapper, 0)

        expect(tick.element.checked).toBe(true)

        tick.element.checked = false
        await tick.trigger('change')
        await settle()

        expect(tick.element.checked).toBe(true)
        expect(sent.filter((call) => call.method === 'DELETE')).toHaveLength(0)
    })

    it('leaves a box unticked when the car was refused, with one reason', async () => {
        const { wrapper } = await cars()
        const tick = box(wrapper, 1)

        reply = (call) => (call.method === 'POST' ? json({}, 500) : null)
        tick.element.checked = true
        await tick.trigger('change')
        await settle()

        expect(tick.element.checked).toBe(false)
        expect(document.querySelectorAll('[role="alert"]')).toHaveLength(1)
    })

    it('takes two ticks in a row as two cars, one after the other, and keeps the boxes usable meanwhile', async () => {
        const { wrapper } = await cars([])
        const answers: ((r: Response) => void)[] = []

        reply = (call) => {
            if (call.method === 'POST') {
                return new Promise<Response>((resolve) => answers.push(resolve)) as unknown as Response
            }

            return null
        }

        const first = box(wrapper, 0)
        const second = box(wrapper, 1)

        first.element.checked = true
        await first.trigger('change')
        expect(second.element.disabled).toBe(false)

        second.element.checked = true
        await second.trigger('change')
        await settle()

        // One at a time: the second goes when the first is answered.
        expect(sent.filter((call) => call.method === 'POST')).toHaveLength(1)

        answers.shift()!(json({ entry: entry([{ ...CAR, vehicleId: 50 }]) }))
        await settle()

        expect(sent.filter((call) => call.method === 'POST').map((call) => call.body.vehicle_ids)).toEqual([[50], [70]])

        answers.shift()!(json({ entry: entry([{ ...CAR, vehicleId: 50 }, { ...NEXT, vehicleId: 70 }]) }))
        await settle()

        expect(first.element.checked).toBe(true)
        expect(second.element.checked).toBe(true)
    })
})

describe('the paper beside the form', () => {
    // The test's DOM would try to fetch the PDF into the frame.
    beforeEach(() => {
        (window as unknown as { happyDOM: { settings: { disableIframePageLoading: boolean } } }).happyDOM.settings.disableIframePageLoading = true
    })

    it('loads a new frame for a new page, and names the file’s version in the address', async () => {
        const { wrapper } = withStore(PdfPanel)
        const before = wrapper.find('iframe').element

        expect(before.getAttribute('src')).toContain('/pdf?v=abc123#page=1')

        await wrapper.find('button[aria-label="Nächste Seite"]').trigger('click')
        await settle()

        const after = wrapper.find('iframe').element

        expect(after).not.toBe(before)
        expect(after.getAttribute('src')).toContain('#page=2')
    })
})

describe('text typed into something that closes', () => {
    it('keeps what was pasted when the dialog closes by Esc or a click beside it; a yes or „Abbrechen“ lets it go', async () => {
        const open = reactive({ value: true })
        const wrapper = mount(defineComponent({
            setup: () => () => h(PasteDialog, { car: CAR, combination: COMBINATION, open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) }),
        }), { attachTo: document.body })

        wrappers.push(wrapper)
        await settle()

        const box = () => document.querySelector<HTMLTextAreaElement>('#ef-paste')!

        box().value = '225/40R18 88W'
        box().dispatchEvent(new Event('input'))
        await settle()

        open.value = false
        await settle(400)
        open.value = true
        await settle(400)

        expect(box().value).toBe('225/40R18 88W')

        document.querySelector<HTMLElement>('.btn--secondary')!.click()
        await settle(400)
        open.value = true
        await settle(400)

        expect(box().value).toBe('')
    })

    it('keeps a code half described when its form goes away; „Abbrechen“ lets it go', async () => {
        const { store, wrapper } = withStore(CodeDefine, { code: '68B', idPrefix: 'x' })

        await wrapper.find('textarea').setValue('Nur mit Abnahme.')
        await settle()
        wrapper.unmount()
        wrappers = []

        const again = mount(defineComponent({ setup: () => () => h(CodeDefine, { code: '68B', idPrefix: 'x' }) }), { global: { provide: { [ENTRY as symbol]: store } } })

        wrappers.push(again)
        expect((again.find('textarea').element as HTMLTextAreaElement).value).toBe('Nur mit Abnahme.')

        await again.find('.btn--secondary').trigger('click')
        again.unmount()
        wrappers = []

        const third = mount(defineComponent({ setup: () => () => h(CodeDefine, { code: '68B', idPrefix: 'x' }) }), { global: { provide: { [ENTRY as symbol]: store } } })

        wrappers.push(third)
        expect((third.find('textarea').element as HTMLTextAreaElement).value).toBe('')
    })

    it('says why a code was refused even where its field is not on the form', async () => {
        const { wrapper } = withStore(CodeDefine, { code: '16a', idPrefix: 'x' })

        ;(forms[0]!.errors as Record<string, string>).code = 'Diesen Code gibt es in diesem Gutachten schon.'
        await nextTick()

        expect(wrapper.find('[role="alert"]').text()).toContain('gibt es in diesem Gutachten schon')
    })

    it('lists a code once, in the moment between its description and the next answer', async () => {
        page.props.conditions = [{ id: 1, code: '68B', kind: 'hinweis', kindLabel: 'Hinweis', text: 'Text', level: 'hinweis' }]

        const store = createEntryStore({ documentId: 9, entry: { ...entry(), undescribed: ['68B', '70C'] }, step: 3, car: 5, editable: true })
        const wrapper = mount(CodesPanel, { global: { provide: { [ENTRY as symbol]: store } } })

        wrappers.push(wrapper)

        expect(wrapper.findAll('.ef-codeitem').map((item) => item.find('.ef-code').text())).toEqual(['70C', '68B'])
    })

    it('keeps the code being described on the list, whatever the search says', async () => {
        const store = createEntryStore({ documentId: 9, entry: { ...entry(), undescribed: ['68B', '70C'] }, step: 3, car: 5, editable: true })
        const wrapper = mount(CodesPanel, { global: { provide: { [ENTRY as symbol]: store } } })

        wrappers.push(wrapper)

        await wrapper.findAll('.ef-codeitem__edit')[0]!.trigger('click')
        await wrapper.find('#ef-panel-q').setValue('70C')

        expect(wrapper.findAll('.ef-codeitem').map((item) => item.find('.ef-code').text())).toEqual(['68B', '70C'])
        expect(wrapper.find('form.ef-define').exists()).toBe(true)
    })
})

describe('a tag field', () => {
    function tags(start: string[] = [], listed: string[] = []) {
        page.props.conditions = listed.map((code, i) => ({ id: i, code, kind: 'hinweis', kindLabel: 'Hinweis', text: 'Text', level: 'hinweis' }))

        const state = reactive({ codes: start })
        const wrapper = mount(defineComponent({
            setup: () => () => h(CodeTags, { id: 'tags', label: 'Codes', modelValue: state.codes, 'onUpdate:modelValue': (next: string[]) => (state.codes = next) }),
        }), { attachTo: document.body })

        wrappers.push(wrapper)

        return { state, wrapper }
    }

    it('takes the refusal sentence’s own example as one code, typed space by space', async () => {
        const { state, wrapper } = tags()
        const field = wrapper.find('#tags')

        await field.setValue('Nicht')
        await field.trigger('keydown', { key: ' ' })
        expect(state.codes).toEqual([])

        await field.setValue('Nicht 330D')
        await field.trigger('keydown', { key: 'Enter' })
        expect(state.codes).toEqual(['Nicht 330D'])
    })

    it('ends a code at a space where the word is one by itself, unless the paper’s list goes on with it', async () => {
        const { state, wrapper } = tags([], ['A B'])
        const field = wrapper.find('#tags')

        await field.setValue('11A')
        await field.trigger('keydown', { key: ' ' })
        expect(state.codes).toEqual(['11A'])

        await field.setValue('A')
        await field.trigger('keydown', { key: ' ' })
        expect(state.codes).toEqual(['11A'])
    })

    it('stores a printed closing bracket as the server does, so the tag is the code it describes', async () => {
        const { state, wrapper } = tags()
        const field = wrapper.find('#tags')

        await field.setValue('16a)')
        await field.trigger('keydown', { key: 'Enter' })

        expect(state.codes).toEqual(['16a'])
    })

    it('keeps the keyboard in the field when a tag is taken away', async () => {
        const { state, wrapper } = tags(['11A'], ['11A'])

        await wrapper.find('.ef-tags__x').trigger('click')
        await settle()

        expect(state.codes).toEqual([])
        expect(document.activeElement?.id).toBe('tags')
    })
})
