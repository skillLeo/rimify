/**
 * The state of the Gutachten sketch: one object for the five steps, handed to every part through provide/inject. Kept in
 * the browser's session storage, so leaving and coming back resumes at the same step and the same cell, as the draft will
 * (the brief §7) — and nothing reaches the server.
 */

import { inject, nextTick, reactive, type InjectionKey } from 'vue'
import { CODES, GROUPS, PAPER, initialCells, levelFloor, type Cell, type DemoCar, type DemoGroup, type KindValue, type LevelValue, type PaperCode } from './gutachtenDemo'
import { copyCell } from './gutachtenSketch'

export const STEPS = ['Gutachten', 'Felge', 'Fahrzeuge', 'Reifen', 'Freigeben']

export type ArtValue = 'ABE' | 'Teilegutachten' | 'EG-Genehmigung'
export type LiSource = 'document' | 'papers' | 'table'

export interface SketchState {
    step: number
    reached: number
    art: ArtValue
    number: string
    issuer: string
    issuedOn: string
    supplement: string
    liSource: LiSource | null
    wheelId: string
    sizeId: string
    /** The car groups taken over in step 3, by id, in the paper's order. */
    groups: string[]
    /** Cars unticked inside a group. */
    excluded: string[]
    /** Cars added by hand: those without kW, and those created from the paper. */
    added: string[]
    /** Groups created in the flow („Fahrzeug anlegen"), with their one new car. */
    created: DemoGroup[]
    cells: Cell[]
    cell: string
    /** The page the PDF panel shows. */
    pdfPage: number
    codes: PaperCode[]
    /** Cars whose data someone confirmed in step 5 („Daten geprüft"). */
    checked: string[]
    /** D-227: three answers and no default; „teilweise" names what is missing. */
    complete: 'ja' | 'teilweise' | 'unbekannt' | null
    missing: string
    released: boolean
    /** „Weitere Angaben", kept as typed. */
    more: Record<string, string>
}

export function initialState(step = 0, cell = 'm3'): SketchState {
    return {
        step,
        reached: step,
        art: 'ABE',
        number: PAPER.number,
        issuer: PAPER.issuer,
        issuedOn: PAPER.issuedOn,
        supplement: PAPER.supplement,
        liSource: null,
        wheelId: 'db8gt2',
        sizeId: 'db8gt2-18',
        groups: ['m3', 'x3', 'z3'],
        excluded: [],
        added: [],
        created: [],
        cells: initialCells(),
        cell,
        pdfPage: 6,
        codes: CODES.map((code) => ({ ...code })),
        checked: [],
        complete: null,
        missing: '',
        released: false,
        more: {},
    }
}

export const STORAGE_KEY = 'rimify-skizze-gutachten'

export function createStore(step: number, cell: string) {
    const state = reactive<SketchState>(initialState(step, cell))

    function allGroups(): DemoGroup[] {
        return [...GROUPS, ...state.created]
    }

    function group(id: string): DemoGroup | undefined {
        return allGroups().find((g) => g.id === id)
    }

    /** The groups taken over, in the paper's order. */
    function chosenGroups(): DemoGroup[] {
        return allGroups().filter((g) => state.groups.includes(g.id))
    }

    /** The cars a group links: its matches, minus those unticked, plus those added by hand. */
    function carsOf(g: DemoGroup): DemoCar[] {
        return [...g.cars, ...g.withoutKw.filter((car) => state.added.includes(car.id))].filter((car) => !state.excluded.includes(car.id))
    }

    function cellOf(groupId: string): Cell {
        let found = state.cells.find((c) => c.groupId === groupId)

        if (found === undefined) {
            found = { groupId, tyres: [], pairs: [], general: [], page: '', copiedFrom: null }
            state.cells.push(found)
        }

        return found
    }

    function go(step: number): void {
        state.step = Math.max(0, Math.min(STEPS.length - 1, step))
        state.reached = Math.max(state.reached, state.step)

        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0 })
            void nextTick(() => document.querySelector<HTMLElement>('.sk-step h2[tabindex="-1"]')?.focus({ preventScroll: true }))
        }
    }

    function toggleGroup(id: string): void {
        state.groups = state.groups.includes(id) ? state.groups.filter((g) => g !== id) : allGroups().filter((g) => g.id === id || state.groups.includes(g.id)).map((g) => g.id)
    }

    function toggleCar(id: string): void {
        state.excluded = state.excluded.includes(id) ? state.excluded.filter((c) => c !== id) : [...state.excluded, id]
    }

    function addCar(id: string): void {
        if (!state.added.includes(id)) {
            state.added.push(id)
        }
    }

    function createGroup(g: DemoGroup): void {
        if (!state.created.some((c) => c.id === g.id)) {
            state.created.push(g)
        }

        if (!state.groups.includes(g.id)) {
            state.groups.push(g.id)
        }
    }

    /** Someone changed the cell: from now on it is theirs, no longer „kopiert von …". */
    function touched(groupId: string): void {
        cellOf(groupId).copiedFrom = null
    }

    function copy(from: string, to: string[], mode: 'ersetzen' | 'hinzufuegen'): void {
        const source = cellOf(from)
        const name = group(from)?.sales ?? ''

        state.cells = state.cells.map((c) => (to.includes(c.groupId) ? copyCell(source, c, mode, name) : c))

        for (const id of to) {
            if (!state.cells.some((c) => c.groupId === id)) {
                state.cells.push(copyCell(source, cellOf(id), mode, name))
            }
        }
    }

    function define(code: string, text: string, kind: KindValue, level: LevelValue | null): void {
        const entry = { code, text, kind, level: level ?? levelFloor(kind), page: null }
        const at = state.codes.findIndex((c) => c.code === code)

        if (at === -1) {
            state.codes.push(entry)
        } else {
            state.codes[at] = { ...entry, page: state.codes[at]?.page ?? null }
        }
    }

    function codeOf(code: string): PaperCode | undefined {
        return state.codes.find((c) => c.code === code)
    }

    function described(code: string): boolean {
        const entry = codeOf(code)

        return entry !== undefined && entry.text !== null && entry.text.trim() !== ''
    }

    function reset(): void {
        Object.assign(state, initialState(0, 'm3'))
    }

    return { state, allGroups, group, chosenGroups, carsOf, cellOf, go, toggleGroup, toggleCar, addCar, createGroup, touched, copy, define, codeOf, described, reset }
}

export type SketchStore = ReturnType<typeof createStore>

export const SKETCH: InjectionKey<SketchStore> = Symbol('gutachten-skizze')

export function useSketch(): SketchStore {
    const store = inject(SKETCH)

    if (store === undefined) {
        throw new Error('The Gutachten sketch store is provided by its page.')
    }

    return store
}
