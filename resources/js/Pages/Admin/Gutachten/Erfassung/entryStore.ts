/**
 * The five steps of a Gutachten's entry, one object handed to every part (the Gutachten rework §7): what the server last said
 * (`entry`), the step and the car on screen, and the one car being typed in. Every change is saved as it happens; the answer is
 * what the page redraws from, so what staff see is what is stored. The rows the shop reads are written on the server, in the
 * same transaction.
 *
 * Saves go out one after the other, so the answers come back in the order of the changes and the newest state stands. Leaving a
 * step or a car goes through here too: the part on screen says what it still owes, and the screen only changes once the server
 * has it. If it refuses, the person stays where the problem is.
 */

import { usePage } from '@inertiajs/vue3'
import { inject, nextTick, reactive, type InjectionKey } from 'vue'
import { xsrfToken } from '../../../../composables/admin/preferences'
import type { AdminGutachtenShowProps } from '../../../../types/admin/gutachten'
import { decimal } from '../../../../format'
import { readTyre, sizeKey } from './tyreInput'

/** The page's props, as the parts of the five steps read them. */
export function useGutachtenPage() {
    return usePage<AdminGutachtenShowProps & Record<string, unknown>>()
}

export const STEPS = ['Gutachten', 'Felge', 'Fahrzeuge', 'Reifen', 'Freigeben']

export interface WheelSizeView {
    id: number
    wheelModelId: number
    configId: number | null
    wheel: string
    wheelType: string | null
    label: string
    colours: { name: string | null; hex: string | null }[]
}

export interface CombinationView {
    id: number
    frontId: number
    rearId: number
    frontKey: string
    rearKey: string
    frontConfigId: number
    rearConfigId: number
    same: boolean
    badge: string
    label: string
    frontLabel: string
    rearLabel: string
    frontDiameter: number
    rearDiameter: number
    warnings: string[]
}

export interface PrintedRow {
    type: string | null
    size: string
    /** What was typed, where it does not read as a number: kept, never a block. */
    et: number | string | null
    bolts: string
}

export interface CarView {
    id: number
    combinationId: number
    vehicleId: number
    label: string
    hsnTsn: string | null
    kw: number | null
    k: string | null
    gone: boolean
    lines: number
    pairs: number
    unread: number
    codes: number
    done: boolean
    page: number | null
    copiedFrom: string | null
    unsourced: boolean
    sourceLabel: string | null
    axle: string
    finish: string | null
    conflict: boolean
}

/* A pair the shop would offer on a wheel combination nobody entered it for: same diameters, one car (D-447). */
export interface PairConflict {
    entryId: number
    vehicleId: number
    car: string
    pair: string
    combination: string
    enteredAt: string[]
}

export interface EntryView {
    wheelSizes: WheelSizeView[]
    combinations: CombinationView[]
    printed: PrintedRow[]
    cars: CarView[]
    conflicts: PairConflict[]
    hasList: boolean
    keptCombinations: number
    unread: { car: string; entryId: number; text: string }[]
    undescribed: string[]
    suggestion: 'document' | 'papers' | 'table' | null
}

export interface ServerLine {
    id: number
    front: string
    rear: string
    oneSided: boolean
    kw: string
    codes: string[]
    outsideList: boolean
    /** Why the server said no to a side: it reads as a size, and cannot stand as one (a load index it does not know, a tyre that does not fit its wheel). */
    frontWhy: string | null
    rearWhy: string | null
}

export interface CarDetail {
    id: number
    page: number | null
    lines: ServerLine[]
    /** „Allgemeine Codes dieses Fahrzeugs“: the car's, not this cell's (D-452). */
    codes: { code: string; note: string | null }[]
    /** Who shares them: the car (`0005/683`, `#152` without key numbers), its cells in this paper and the cars of its HSN/TSN. */
    codesFor?: { car: string; cells: number; cars: number }
    /** This combination's own row's codes, carried from before the five steps where the car's rows said different ones. */
    cellCodes?: { code: string; note: string | null }[]
    columns: Record<string, string | number | null>
}

/** A line as it is being typed. `follows`: the rear still mirrors the front, until someone changes it. */
export interface EditLine {
    key: number
    id: number | null
    front: string
    rear: string
    kw: string
    codes: string[]
    oneSided: boolean
    outsideList: boolean
    follows: boolean
    /** What the server last said of a side, and of which text: changing it takes the word back. */
    refused: { front: { text: string; why: string } | null; rear: { text: string; why: string } | null }
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'failed'

export class Refused extends Error {
    constructor(public readonly errors: Record<string, string[]>) {
        super(Object.values(errors)[0]?.[0] ?? 'Das wurde nicht gespeichert.')
    }
}

/** What the server said of a line's two sides, for as long as they still read as it read them. */
export function refusedOf(line: Pick<ServerLine, 'front' | 'rear' | 'frontWhy' | 'rearWhy'>): EditLine['refused'] {
    return {
        front: line.frontWhy === null ? null : { text: line.front, why: line.frontWhy },
        rear: line.rearWhy === null ? null : { text: line.rear, why: line.rearWhy },
    }
}

const NOT_SAVED = 'Das wurde nicht gespeichert. Prüf die Verbindung und versuch es noch einmal.'
const SIGNED_OUT = 'Das wurde nicht gespeichert: Deine Anmeldung ist abgelaufen. Melde dich in einem neuen Tab wieder an und versuch es dann noch einmal. Deine Eingaben bleiben hier stehen.'
const FORBIDDEN = 'Das wurde nicht gespeichert: Dafür fehlt deinem Konto die Berechtigung.'

/** Sends a save or asks a question, as JSON, with the admin's XSRF header. */
export async function send<T>(method: string, url: string, body?: unknown, headers: Record<string, string> = {}): Promise<T> {
    let response: Response

    try {
        response = await fetch(url, {
            method,
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': xsrfToken() }),
                ...(method === 'GET' ? {} : { 'X-XSRF-TOKEN': xsrfToken() }),
                ...headers,
            },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        })
    } catch {
        // No answer at all: the browser's own sentence is English, and says nothing more.
        throw new Error(NOT_SAVED)
    }

    if (response.status === 422) {
        const answer = (await response.json()) as { errors?: Record<string, string[]> }

        throw new Refused(answer.errors ?? {})
    }

    if (response.status === 401 || response.status === 419) {
        throw new Error(SIGNED_OUT)
    }

    if (response.status === 403) {
        throw new Error(FORBIDDEN)
    }

    if (!response.ok) {
        throw new Error(NOT_SAVED)
    }

    return (await response.json()) as T
}

let nextKey = 1

export function toEditLine(line: ServerLine): EditLine {
    return {
        key: nextKey++,
        id: line.id,
        front: line.front,
        rear: line.rear,
        kw: line.kw,
        codes: [...line.codes],
        oneSided: line.oneSided,
        outsideList: line.outsideList,
        // The same size on both sides: correcting the front corrects both. A rear someone made different stays as it is.
        follows: !line.oneSided && line.front === line.rear,
        refused: refusedOf(line),
    }
}

export function blankLine(front = '', rear = front): EditLine {
    return { key: nextKey++, id: null, front, rear, kw: '', codes: [], oneSided: false, outsideList: false, follows: front === rear, refused: { front: null, rear: null } }
}

/**
 * Typed in front: the rear takes the same, until someone changes it (the client's change of 05.11.2026) — where both wheels have
 * one diameter. Where they differ the same tyre would not fit, and the rear stays empty (the operator's brief of 07.11.2026, §3).
 */
export function typedFront(line: EditLine, text: string, mirrors = true): void {
    line.front = text

    if (mirrors && line.follows && !line.oneSided) {
        line.rear = text
    }
}

export function typedRear(line: EditLine, text: string): void {
    line.rear = text
    line.follows = text.trim() === '' || text === line.front
}

/** Whether this side's typed tyre cannot go on this side's wheel, in the server's words (EntryLineRules::misfit); null where it can. */
export function misfit(text: string, wheelDiameter: number, side: 'front' | 'rear'): string | null {
    const tyre = readTyre(text)

    if (tyre === null || Math.abs(tyre.diameter - wheelDiameter) < 0.001) {
        return null
    }

    return `Dieser Reifen passt nicht: Die Felge ${side === 'front' ? 'vorne' : 'hinten'} hat ${decimal(wheelDiameter, Number.isInteger(wheelDiameter) ? 0 : 1)} Zoll, der Reifen R${decimal(tyre.diameter, Number.isInteger(tyre.diameter) ? 0 : 1)}.`
}

/** The keys of lines that say the same as an earlier one: their sizes, figures and band. */
export function duplicateKeys(lines: EditLine[]): number[] {
    const seen = new Set<string>()
    const twice: number[] = []

    for (const line of lines) {
        const front = readTyre(line.front)
        const rear = readTyre(line.rear)

        if (front === null || rear === null) {
            continue
        }

        const key = `${sizeKey(front)}|${front.li}|${front.si}|${sizeKey(rear)}|${rear.li}|${rear.si}|${line.kw.trim()}`

        if (seen.has(key)) {
            twice.push(line.key)
        }

        seen.add(key)
    }

    return twice
}

/** `2 Kombinationen`, or „noch leer“: every line is a combination. */
export function carSummary(car: Pick<CarView, 'lines' | 'unread'>): string {
    if (car.lines === 0) {
        return car.unread > 0 ? 'nicht vollständig' : 'noch leer'
    }

    const lines = `${car.lines} ${car.lines === 1 ? 'Kombination' : 'Kombinationen'}`

    return car.unread > 0 ? `${lines}, ${car.unread} nicht vollständig` : lines
}

/** Every car once, however many wheel combinations it stands in: what step 3 lists and what its question counts. */
export function distinctCars(cars: CarView[]): CarView[] {
    const out = new Map<number, CarView>()

    for (const car of cars) {
        const seen = out.get(car.vehicleId)

        out.set(car.vehicleId, seen === undefined ? { ...car } : { ...seen, lines: seen.lines + car.lines, unread: seen.unread + car.unread, codes: seen.codes + car.codes, done: seen.done && car.done, finish: seen.finish ?? car.finish })
    }

    return [...out.values()]
}

/** A car's label in a narrow column: key numbers and power stay together, a separator at the end of its line, never alone on the next. */
export function carLine(label: string): string {
    return label.replace(/ · /g, '\u00A0· ').replace(/(HSN|TSN) /g, '$1\u00A0').replace(/ kW/g, '\u00A0kW')
}

export interface EntryStoreOptions {
    documentId: number
    entry: EntryView
    step: number
    car: number | null
    editable: boolean
    /** A new answer: the page keeps it where Back finds it, or Back would bring the state before it (and the next change would write that). */
    remember?: (entry: EntryView) => void
}

/** A part of the steps with something typed in: what the screen asks of it before it changes. */
export interface Holder {
    flush: () => Promise<boolean>
    owed: () => boolean
}

/** What was typed into a form that closed before it was saved: it comes back when the form does. */
export type Draft = Record<string, unknown>

export function createEntryStore(options: EntryStoreOptions) {
    const state = reactive({
        documentId: options.documentId,
        entry: options.entry,
        editable: options.editable,
        step: options.step,
        carId: options.car,
        /** The page the PDF panel shows. */
        pdfPage: 1,
        save: 'idle' as SaveState,
        /** A person moved to another car: the next editor takes the focus, so the keyboard stays with the work. */
        focusEditor: false,
    })

    const base = `/admin/gutachten/${options.documentId}/erfassung`
    const holders = new Set<Holder>()
    const drafts = new Map<string, Draft>()
    let tail: Promise<unknown> = Promise.resolve()
    let underWay = 0

    /** A part with something typed in comes on stage; the function it gets takes it off again. */
    function hold(holder: Holder): () => void {
        holders.add(holder)

        return () => holders.delete(holder)
    }

    /** Whether something typed has not reached the server: a reload then asks first. */
    function unsaved(): boolean {
        return underWay > 0 || [...holders].some((holder) => holder.owed())
    }

    /** Everything typed sent and answered. False: something was refused or did not arrive, and the part on screen says what. */
    async function settled(): Promise<boolean> {
        const results = await Promise.all([...holders].map((holder) => holder.flush()))

        await tail

        return results.every(Boolean)
    }

    function furthest(): number {
        if (state.entry.combinations.length === 0) {
            return 1
        }

        return state.entry.cars.length === 0 ? 2 : STEPS.length - 1
    }

    /** To another step, once what was typed here is saved: a refusal keeps the person here, with its reason. */
    async function go(step: number): Promise<void> {
        if (!(await settled())) {
            return
        }

        state.step = Math.max(0, Math.min(STEPS.length - 1, step))

        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0 })
            void nextTick(() => document.querySelector<HTMLElement>('.ef-step h2[tabindex="-1"]')?.focus({ preventScroll: true }))
        }
    }

    function car(id: number | null): CarView | undefined {
        return state.entry.cars.find((c) => c.id === id)
    }

    /** To another car, once what was typed for this one is saved. */
    async function openCar(id: number): Promise<void> {
        if (id === state.carId || !(await settled())) {
            return
        }

        state.focusEditor = true
        state.carId = id
    }

    /**
     * One save, after the ones before it: the state on screen is what the server answered last. A refusal keeps what was typed;
     * whoever asked says why, where it happened.
     */
    function save<T>(method: string, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
        const run = async (): Promise<T> => {
            state.save = 'saving'

            try {
                const answer = await send<T & { entry?: EntryView }>(method, `${base}${path}`, body, headers)

                if (answer.entry) {
                    state.entry = answer.entry
                    options.remember?.(answer.entry)
                }

                state.save = 'saved'

                return answer
            } catch (failure) {
                state.save = 'failed'

                throw failure
            } finally {
                underWay--
            }
        }

        underWay++

        const result = tail.then(run, run)

        tail = result.catch(() => undefined)

        return result
    }

    /** The next car with nothing entered, in the order of the list; none where every one has something. */
    function nextOpen(from: number | null): CarView | undefined {
        const cars = state.entry.cars
        const at = cars.findIndex((c) => c.id === from)

        return [...cars.slice(at + 1), ...cars.slice(0, Math.max(at, 0))].find((c) => !c.done)
    }

    return { state, base, drafts, hold, unsaved, settled, furthest, go, openCar, car, save, nextOpen }
}

export type EntryStore = ReturnType<typeof createEntryStore>

export const ENTRY: InjectionKey<EntryStore> = Symbol('gutachten-erfassung')

export function useEntry(): EntryStore {
    const store = inject(ENTRY)

    if (store === undefined) {
        throw new Error('The entry store is provided by the Erfassung page.')
    }

    return store
}
