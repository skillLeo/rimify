import { describe, expect, it } from 'vitest'

/*
 * The space the compiler drops (Human QA, 28.10.2026): a `<template v-if>` branch whose first content is a bare space and
 * then an expression or an element — `<template v-else> {{ word }}</template>` — loses that space, because the compiler
 * removes a whitespace-only first child. The list said „2Felgen mit gültigem Gutachten“, and six more lines ran a note
 * into the sentence before it. The space belongs inside the expression: `{{ ' ' + word }}`. This guard reads every
 * component and fails on the pattern, so it cannot come back.
 */

const sources = import.meta.glob<string>(['./**/*.vue'], { query: '?raw', import: 'default', eager: true })

/** A branch whose first content is spaces and then `{{` or a tag. The condition may hold `=>`, so it is read to its `">`. */
const DROPPED = /<template\s+v-(?:if|else-if|else)(?:="[^"]*")?\s*>[ \t]+(?:\{\{|<[a-zA-Z])/g

describe('the space before a conditional word', () => {
    it('is never left for the compiler to drop', () => {
        const found: string[] = []

        for (const [path, source] of Object.entries(sources)) {
            for (const match of source.matchAll(DROPPED)) {
                const line = source.slice(0, match.index).split('\n').length
                found.push(`${path}:${line}  ${match[0]}`)
            }
        }

        expect(found).toEqual([])
    })

    it('finds the pattern it guards against', () => {
        expect('<template v-else> {{ x }}</template>'.match(DROPPED)).not.toBeNull()
        expect(`<template v-if="list.some((c) => c.on)"> <b>x</b></template>`.match(DROPPED)).not.toBeNull()
        // A branch that starts with a word keeps its space: „ · VSN“ is no finding.
        expect('<template v-if="x"> · {{ y }}</template>'.match(DROPPED)).toBeNull()
        expect("<template v-if=\"x\">{{ ' ' + y }}</template>".match(DROPPED)).toBeNull()
    })
})
