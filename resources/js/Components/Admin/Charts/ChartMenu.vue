<script setup lang="ts">
/**
 * Every chart's menu (BRIEF §4): „Tabelle anzeigen“ turns the drawing into the same numbers as a
 * table and back; „Als CSV“ saves those numbers. The table is also what a screen reader is offered,
 * so a chart never holds a number that cannot be read without seeing it.
 */

import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'
import Icon from '../AdminIcon.vue'

const props = defineProps<{
    title: string
    /** Whether the table is showing now. */
    table: boolean
    /** Header and rows for the CSV, already in German. */
    header: string[]
    rows: string[][]
    filename: string
}>()

const emit = defineEmits<{ 'update:table': [value: boolean] }>()

function cell(value: string): string {
    const defused = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value

    return /[;"\n]/.test(defused) ? `"${defused.replace(/"/g, '""')}"` : defused
}

function download(): void {
    const text = '﻿' + [props.header, ...props.rows].map((row) => row.map(cell).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')

    link.href = url
    link.download = `${props.filename}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Revoked a moment later: Safari cancels a download whose address is revoked straight after the click.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
</script>

<template>
    <DropdownMenuRoot>
        <DropdownMenuTrigger class="adm-iconbtn" :aria-label="`Menü: ${title}`">
            <Icon name="more" :size="20" />
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
            <DropdownMenuContent class="adm-menu" align="end" :side-offset="8">
                <DropdownMenuItem class="adm-menu__item" @select="emit('update:table', !table)">
                    <Icon :name="table ? 'chart' : 'table'" :size="20" />
                    {{ table ? 'Diagramm anzeigen' : 'Tabelle anzeigen' }}
                </DropdownMenuItem>
                <DropdownMenuItem class="adm-menu__item" @select="download">
                    <Icon name="export" :size="20" />
                    Als CSV
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenuPortal>
    </DropdownMenuRoot>
</template>
