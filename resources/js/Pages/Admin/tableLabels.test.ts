import { describe, expect, it } from 'vitest'

/*
 * On a phone an admin table is a stack of cards, and each cell writes its `data-label` before its value (admin.css). A
 * cell without one shows a bare value: the Bereifungskombinationen stood as two sizes one under the other, and which
 * was the front axle was left to guess (Human QA, 28.10.2026). Every cell of an `adm-table` carries its label, or is
 * hidden on the phone, or is a row's control that needs none.
 */

const sources = import.meta.glob<string>(['./**/*.vue'], { query: '?raw', import: 'default', eager: true })

/** A control cell with no value to name: the remove button of a row being edited. */
const CONTROL = /class="[^"]*__remove/

/** The cells of a component's admin tables that would stand bare on a phone. */
function bareCells(source: string): string[] {
    const template = source.split('<style')[0] ?? ''
    const bare: string[] = []

    for (const table of template.matchAll(/<table\b[^>]*class="[^"]*adm-table[^"]*"[\s\S]*?<\/table>/g)) {
        for (const cell of table[0].matchAll(/<td\b[^>]*>/g)) {
            if (!/\bdata-label=|:data-label=|data-phone="hide"|colspan/.test(cell[0]) && !CONTROL.test(cell[0])) {
                bare.push(cell[0])
            }
        }
    }

    return bare
}

describe('the admin tables on a phone', () => {
    it('label every cell, so no value stands without its name', () => {
        const bare = Object.entries(sources).flatMap(([path, source]) => bareCells(source).map((cell) => `${path}: ${cell}`))

        expect(bare).toEqual([])
    })

    it('finds a bare cell where there is one, and only there', () => {
        const table = (cells: string): string => `<template><table class="adm-table x"><tr>${cells}</tr></table></template>`

        expect(bareCells(table('<td class="num">{{ a }}</td>'))).toEqual(['<td class="num">'])
        expect(bareCells(table('<td data-label="Preis">{{ a }}</td><td :data-label="s">{{ b }}</td>'))).toEqual([])
        expect(bareCells(table('<td data-phone="hide">x</td><td class="fe-sizes__remove"><button /></td>'))).toEqual([])
        // A table outside the admin's card layout is not read.
        expect(bareCells('<template><table class="plain"><tr><td>x</td></tr></table></template>')).toEqual([])
    })
})
