/**
 * The five steps of a Gutachten's entry, one object handed to every part (the Gutachten rework §7): what the server last said
 * (`entry`), the step and the car on screen, and the one car being typed in. Every change is saved as it happens; the answer is
 * what the page redraws from, so what staff see is what is stored. The rows the shop reads are written on the server, in the
 * same transaction.
 */

import { usePage } from '@inertiajs/vue3'
import { inject, nextTick, reactive, type InjectionKey } from 'vue'
import { xsrfToken } from '../../../../composables/admin/preferences'
import type { AdminGutachtenShowProps } from '../../../../types/admin/gutachten'
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
    printed: { type: string | null; width: number | null; diameter: number | null; et: number | null; holes: number | null; circle: number | null }
    mismatch: string[]
}

export interface CarView {
    id: number
    sizeId: number
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

export interface PairConflict {
    vehicleId: number
    car: string
    k: string
    pair: string
    others: string[]
}

export interface EntryView {
    wheelSizes: WheelSizeView[]
    cars: CarView[]
    conflicts: PairConflict[]
    unreachable: { vehicleId: number; car: string; k: string | null }[]
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
    frontOnRim: boolean
    rearOnRim: boolean
    outsideList: boolean
    /** Why the server kept a side as typed: it reads as a size, and cannot stand as one (a load index it does not know). */
    frontWhy: string | null
    rearWhy: string | null
}

export interface CarDetail {
    id: number
    page: number | null
    lines: ServerLine[]
    codes: { code: string; note: string | null }[]
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
    frontOnRim: boolean
    rearOnRim: boolean
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
        frontOnRim: line.frontOnRim,
        rearOnRim: line.rearOnRim,
        oneSided: line.oneSided,
        outsideList: line.outsideList,
        // The same size on both sides: correcting the front corrects both. A rear someone made different stays as it is.
        follows: !line.oneSided && line.front === line.rear,
        refused: refusedOf(line),
    }
}

export function blankLine(front = '', rear = front): EditLine {
    return { key: nextKey++, id: null, front, rear, kw: '', codes: [], frontOnRim: false, rearOnRim: false, oneSided: false, outsideList: false, follows: front === rear, refused: { front: null, rear: null } }
}

/** Typed in front: the rear takes the same, until someone changes it (the client's change of 05.11.2026). */
export function typedFront(line: EditLine, text: string): void {
    line.front = text

    if (line.follows && !line.oneSided) {
        line.rear = text
    }
}

export function typedRear(line: EditLine, text: string): void {
    line.rear = text
    line.follows = text.trim() === '' || text === line.front
}

/** Whether both sides read and name two different sizes. */
export function isPair(line: Pick<EditLine, 'front' | 'rear'>): boolean {
    const front = readTyre(line.front)
    const rear = readTyre(line.rear)

    return front !== null && rear !== null && sizeKey(front) !== sizeKey(rear)
}

/** The sizes this car has on a line of their own: those reach the axle by themselves. */
export function ownSizes(lines: Pick<EditLine, 'front' | 'rear'>[]): Set<string> {
    const own = new Set<string>()

    for (const line of lines) {
        const front = readTyre(line.front)
        const rear = readTyre(line.rear)

        if (front !== null && rear !== null && sizeKey(front) === sizeKey(rear)) {
            own.add(sizeKey(front))
        }
    }

    return own
}

/**
 * What the paper's own rule says of a pair: a size it does not list for this wheel is only permitted on another wheel size. A
 * side with no line of its own, and nobody saying the paper lists it in this combination, makes the pair not offered here. Said,
 * never blocked.
 */
export function pairWarnings(line: EditLine, lines: EditLine[]): string[] {
    if (!isPair(line)) {
        return []
    }

    const own = ownSizes(lines)
    const out: string[] = []
    const front = readTyre(line.front)
    const rear = readTyre(line.rear)

    if (front !== null && !own.has(sizeKey(front)) && !line.frontOnRim) {
        out.push(`Die vordere Größe hat hier keine eigene Zeile. Steht sie nicht in diesem Gutachten, braucht sie eine andere Felgengröße, und der Shop bietet diese Kombination auf dieser Felge nicht an. Steht sie im Gutachten nur in dieser Kombination, setz unter „…“ den Haken.`)
    }

    if (rear !== null && !own.has(sizeKey(rear)) && !line.rearOnRim) {
        out.push(`Die hintere Größe hat hier keine eigene Zeile. Steht sie nicht in diesem Gutachten, braucht sie eine andere Felgengröße, und der Shop bietet diese Kombination auf dieser Felge nicht an. Steht sie im Gutachten nur in dieser Kombination, setz unter „…“ den Haken.`)
    }

    return out
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

/** `2 Zeilen · 1 Kombination`, or „noch leer“. */
export function carSummary(car: Pick<CarView, 'lines' | 'pairs' | 'unread'>): string {
    if (car.lines === 0) {
        return car.unread > 0 ? 'nicht lesbar' : 'noch leer'
    }

    const same = car.lines - car.pairs
    const parts = [
        same > 0 ? `${same} ${same === 1 ? 'Reifengröße' : 'Reifengrößen'}` : '',
        car.pairs > 0 ? `${car.pairs} ${car.pairs === 1 ? 'Kombination' : 'Kombinationen'}` : '',
    ].filter(Boolean)

    return parts.join(' · ')
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
}

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
        failure: '',
        /** A step's save is under way: its own button waits. */
        busy: false,
    })

    const base = `/admin/gutachten/${options.documentId}/erfassung`

    function furthest(): number {
        if (state.entry.wheelSizes.length === 0) {
            return 1
        }

        return state.entry.cars.length === 0 ? 2 : STEPS.length - 1
    }

    function go(step: number): void {
        state.step = Math.max(0, Math.min(STEPS.length - 1, step))

        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0 })
            void nextTick(() => document.querySelector<HTMLElement>('.ef-step h2[tabindex="-1"]')?.focus({ preventScroll: true }))
        }
    }

    function car(id: number | null): CarView | undefined {
        return state.entry.cars.find((c) => c.id === id)
    }

    /** One save: the state on screen is what the server answered. A refusal keeps what was typed and says why. */
    async function save<T>(method: string, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
        state.save = 'saving'
        state.failure = ''

        try {
            const answer = await send<T & { entry?: EntryView }>(method, `${base}${path}`, body, headers)

            if (answer.entry) {
                state.entry = answer.entry
            }

            state.save = 'saved'

            return answer
        } catch (failure) {
            state.save = 'failed'
            state.failure = failure instanceof Error ? failure.message : 'Das wurde nicht gespeichert.'

            throw failure
        }
    }

    /** The next car with nothing entered, in the order of the list; none where every one has something. */
    function nextOpen(from: number | null): CarView | undefined {
        const cars = state.entry.cars
        const at = cars.findIndex((c) => c.id === from)

        return [...cars.slice(at + 1), ...cars.slice(0, Math.max(at, 0))].find((c) => !c.done)
    }

    return { state, base, furthest, go, car, save, nextOpen }
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
