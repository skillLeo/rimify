<script setup lang="ts">
/**
 * System › Testumgebung zurücksetzen (TestReset): the test environment back to an empty shop, at one of three levels,
 * and back again for seven days. What each level would take is counted before anything is done and shown for the one
 * chosen; the reset waits for the word to be typed (AdminConfirm), and the server asks for it again. That the team,
 * its roles, the settings and the Protokoll stay is said once, at the top, where it is read before the choice.
 */

import { router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { formatNumber } from '../../../lib/num'
import type { AdminZuruecksetzenProps, ResetLevelInfo, ResetLevelKey } from '../../../types/admin/zuruecksetzen'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminZuruecksetzenProps>()

/** „Shopdaten“ first: what „alle Daten entfernen“ means to whoever opens this page. */
const level = ref<ResetLevelKey>('shop')

const chosen = computed<ResetLevelInfo | undefined>(() => props.levels.find((l) => l.key === level.value))

/** Figure and noun on one line (R-10): „12 Felgen“, never „12 / Felgen“. */
function counted(info: ResetLevelInfo): string {
    return info.counts.map((c) => `${formatNumber(c.count)}\u00A0${c.label}`).join(', ')
}

const empty = computed(() => (chosen.value?.counts.length ?? 0) === 0)

/* The last reset's date stands in its own block below: the context names the scope, once. */
const context = 'Nur in der Testumgebung, nie im Live-Shop'

/* ── Zurücksetzen ──────────────────────────────────────────────────────────── */

const confirming = ref(false)
const resetting = ref(false)

const confirmBody = computed(() => {
    const info = chosen.value

    if (!info) {
        return ''
    }

    /* „Demodaten“ takes the demo team and its entries with it; every other level keeps them all. */
    const stays =
        info.key === 'demo'
            ? 'Die übrigen Benutzer und Protokolleinträge bleiben, wie sie sind'
            : 'Benutzer, Rollen, Einstellungen und das Protokoll bleiben'

    return `Das wird entfernt: ${counted(info)}. ${stays}, und du bleibst angemeldet. Du kannst das Zurücksetzen ${props.keepDays} Tage lang rückgängig machen.`
})

/** Safari does not focus a clicked button: focused first, the dialog hands the focus back here on „Abbrechen“. */
function ask(event: Event): void {
    const button = (event as SubmitEvent).submitter ?? (event.currentTarget as HTMLElement)
    button?.focus()

    if (!chosen.value?.blocked && !empty.value) {
        confirming.value = true
    }
}

function reset(): void {
    if (resetting.value) {
        return
    }

    resetting.value = true
    router.post(
        '/admin/system/zuruecksetzen',
        { level: level.value, confirmation: props.word },
        {
            preserveScroll: true,
            onSuccess: () => (confirming.value = false),
            onFinish: () => (resetting.value = false),
        }
    )
}

/* ── Rückgängig machen ─────────────────────────────────────────────────────── */

const confirmingUndo = ref(false)
const undoing = ref(false)

const undoBody = computed(() => {
    const last = props.last

    if (!last) {
        return ''
    }

    const back =
        last.level === 'demo'
            ? 'Die Demodaten kommen zurück'
            : `Felgen, Gutachten, Fahrzeuge, Bestellungen und die Bilder und PDFs dazu kommen zurück${last.level === 'all' ? ', ebenso Seiten, FAQ und Menüs' : ''}`

    const stays =
        last.level === 'demo'
            ? 'Die übrigen Benutzer und Protokolleinträge bleiben, wie sie sind.'
            : 'Benutzer, Rollen, Einstellungen und das Protokoll bleiben, wie sie jetzt sind.'

    return `${back}, wie sie am ${last.atText} waren. Was seitdem im Shop angelegt wurde, geht dabei verloren. ${stays}`
})

function askUndo(event: MouseEvent): void {
    ;(event.currentTarget as HTMLElement).focus()
    confirmingUndo.value = true
}

function undo(): void {
    if (undoing.value) {
        return
    }

    undoing.value = true
    router.post(
        '/admin/system/zuruecksetzen/rueckgaengig',
        {},
        {
            preserveScroll: true,
            onSuccess: () => (confirmingUndo.value = false),
            onFinish: () => (undoing.value = false),
        }
    )
}
</script>

<template>
    <AdminPage title="Testumgebung zurücksetzen" :context="context">
        <p class="adm-note zs-lead">
            Benutzer, Rollen, Einstellungen und das Protokoll bleiben auf jeder Stufe erhalten – nur „Demodaten“ entfernt das Demo-Team und seine Einträge. Du bleibst angemeldet.
        </p>

        <section v-if="last" class="zs-last" aria-labelledby="zs-last-heading">
            <h2 id="zs-last-heading" class="adm-form__heading">Letztes Zurücksetzen</h2>
            <!-- How long the way back stays open, said on the server; once it has closed, the button goes and one
                 sentence says so (the reset brief of 05.10.2026, §3.3). -->
            <p class="adm-note">
                {{ last.label }}, am {{ last.atText }} von {{ last.by }}.
                <template v-if="last.undone">Am {{ last.undoneText }} rückgängig gemacht.</template>
                <template v-else-if="last.undoable">Rückgängig machen ist bis {{ last.until }} möglich ({{ last.remaining }}).</template>
                <template v-else-if="last.reason">{{ last.reason }}</template>
            </p>
            <div v-if="last.undoable">
                <button class="btn btn--secondary" type="button" :aria-busy="undoing ? 'true' : undefined" @click="askUndo">
                    Letztes Zurücksetzen rückgängig machen
                </button>
            </div>
        </section>

        <form class="adm-form zs-form" novalidate @submit.prevent="ask">
            <fieldset class="zs-levels">
                <legend class="adm-form__heading zs-levels__legend">Was soll weg?</legend>

                <label v-for="option in levels" :key="option.key" class="check zs-level">
                    <input
                        v-model="level"
                        type="radio"
                        name="zs-level"
                        :value="option.key"
                        :aria-describedby="`zs-${option.key}-removes zs-${option.key}-keeps`"
                    >
                    <span class="zs-level__text">
                        <span class="zs-level__name">{{ option.label }}</span>
                        <span :id="`zs-${option.key}-removes`" class="zs-level__line"><span class="zs-level__key">Entfernt:</span> {{ option.removes }}</span>
                        <span :id="`zs-${option.key}-keeps`" class="zs-level__line"><span class="zs-level__key">Bleibt:</span> {{ option.keeps }}</span>
                    </span>
                </label>
            </fieldset>

            <section v-if="chosen" class="adm-form__group" aria-labelledby="zs-what-heading">
                <h2 id="zs-what-heading" class="adm-form__heading">Das wird entfernt</h2>
                <ul v-if="chosen.counts.length" class="zs-counts" aria-live="polite">
                    <li v-for="item in chosen.counts" :key="item.label" class="zs-counts__item">
                        <span class="zs-counts__n">{{ formatNumber(item.count) }}</span>&nbsp;{{ item.label }}
                    </li>
                </ul>
                <p v-else class="adm-note" aria-live="polite">Nichts – auf dieser Stufe ist schon alles leer.</p>
                <p v-if="chosen.blocked" class="zs-blocked" role="status">{{ chosen.blocked }} Nimm stattdessen „Shopdaten“.</p>
            </section>

            <div class="zs-go">
                <button
                    class="btn btn--secondary adm-btn--danger"
                    type="submit"
                    :aria-disabled="chosen?.blocked || empty ? 'true' : undefined"
                    :aria-busy="resetting ? 'true' : undefined"
                >
                    {{ chosen?.label }} zurücksetzen
                </button>
                <p class="adm-form__note">Vorher wird die ganze Datenbank gesichert. Für ein paar Sekunden zeigt der Shop dann die Wartungsseite.</p>
            </div>
        </form>

        <AdminConfirm
            v-model:open="confirming"
            :title="`${chosen?.label ?? ''} zurücksetzen`"
            :body="confirmBody"
            confirm-label="Zurücksetzen"
            :confirm-word="word"
            :busy="resetting"
            @confirm="reset"
        />

        <AdminConfirm
            v-if="last?.undoable"
            v-model:open="confirmingUndo"
            title="Letztes Zurücksetzen rückgängig machen"
            :body="undoBody"
            confirm-label="Rückgängig machen"
            :busy="undoing"
            @confirm="undo"
        />
    </AdminPage>
</template>

<style scoped>
/* The admin's note (14 px, ink-2, its measure): the scope is said once, never louder than the heading above it. */
.zs-lead {
    margin: 0 0 var(--sp-32);
}

.zs-last {
    display: grid;
    gap: var(--sp-12);
    max-width: var(--adm-form-max);
    margin: 0 0 var(--sp-32);
}

.zs-levels {
    display: grid;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
}

.zs-levels__legend {
    padding: 0;
    margin-bottom: var(--sp-12);
}

/* One row per level, between hairlines: the radio on the name's line, what goes and what stays beneath. */
.zs-level {
    align-items: flex-start;
    padding-block: var(--sp-16);
    border-top: 1px solid var(--c-line);
}

.zs-level:last-of-type {
    border-bottom: 1px solid var(--c-line);
}

/* On the name's line: the admin's check rows set their line in --lh-small. */
.zs-level input {
    margin-top: calc((var(--lh-small) - 18px) / 2);
}

.zs-level__text {
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
}

.zs-level__name {
    font-weight: 600;
    color: var(--c-ink);
}

.zs-level__line {
    max-width: 54ch;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

/* „Entfernt:“, „Bleibt:“ — labels as the facts lists set them, so the level's name is the one line in ink. */
.zs-level__key {
    font-weight: 500;
    color: var(--c-ink-2);
}

.zs-counts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8) var(--sp-24);
    margin: 0;
    padding: 0;
    list-style: none;
}

.zs-counts__item {
    white-space: nowrap;
}

.zs-counts__n {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.zs-blocked {
    max-width: 54ch;
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-warn);
}

.zs-go {
    display: grid;
    justify-items: start;
    gap: var(--sp-12);
}

/* Nothing to take, or a level that cannot run: it looks it — the danger red outranked the disabled grey. */
.zs-go .btn[aria-disabled='true'] {
    color: var(--c-ink-3);
    cursor: not-allowed;
}

/* The admin's forms step their rhythm at 1023 px; this page steps with them. */
@media (max-width: 1023px) {
    .zs-lead,
    .zs-last {
        margin-bottom: var(--sp-24);
    }
}

/* A phone: the long buttons take the width and wrap rather than run past the edge (360 px included). */
@media (max-width: 767px) {
    .zs-last .btn,
    .zs-go .btn {
        width: 100%;
        white-space: normal;
        text-wrap: balance;
    }
}
</style>
