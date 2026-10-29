<script setup lang="ts">
/**
 * Inhalte › Meistgekaufte Felgen (the client's #5, „please show 8 rims“; D-353): the homepage's shelf as it stands now —
 * each rim with the reason it stands there — and the team's picks that fill the places sales leave free, in their order.
 * Saved straight to the shop; the server refuses a save to a role without the rights to edit and to publish.
 */

import { router, usePage } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

type Source = 'verkauft' | 'ausgewaehlt' | 'neu'

const props = defineProps<{
    size: number
    picks: string[]
    options: { value: string; label: string }[]
    shelf: { key: string; label: string; source: Source; href: string }[]
    can: { update: boolean }
}>()

const page = usePage()

const SOURCE: Record<Source, { label: string; tone: string }> = {
    verkauft: { label: 'Verkauft', tone: 'adm-tag--ok' },
    ausgewaehlt: { label: 'Deine Auswahl', tone: 'adm-tag--neutral' },
    neu: { label: 'Neu im Shop', tone: '' },
}

const context = computed(() => `Startseite · zeigt ${props.size} Felgen`)

/* ── Deine Auswahl ───────────────────────────────────────────────────────────── */

const fill = (picks: string[]): string[] => Array.from({ length: props.size }, (_, i) => picks[i] ?? '')

const slots = ref<string[]>(fill(props.picks))
const busy = ref(false)

watch(
    () => props.picks,
    (picks) => (slots.value = fill(picks))
)

const chosen = computed(() => slots.value.filter((key) => key !== ''))
const dirty = computed(() => chosen.value.join('|') !== props.picks.join('|'))

const labelOf = (key: string): string => props.options.find((o) => o.value === key)?.label ?? key

/* A rim already in another place is offered there only: the shelf shows each rim once. */
function takenElsewhere(key: string, index: number): boolean {
    return slots.value.some((other, i) => i !== index && other === key)
}

function move(index: number, by: -1 | 1): void {
    const next = [...slots.value]
    const target = index + by
    const a = next[index] ?? ''
    next[index] = next[target] ?? ''
    next[target] = a
    slots.value = next
}

const refusal = computed(() => {
    const raw: unknown = page.props.errors
    const bag = raw !== null && typeof raw === 'object' ? (raw as Record<string, string>) : {}

    return Object.entries(bag).find(([key]) => key === 'picks' || key.startsWith('picks.'))?.[1] ?? ''
})

function save(): void {
    if (busy.value) {
        return
    }

    busy.value = true
    router.put('/admin/meistgekaufte-felgen', { picks: chosen.value }, {
        preserveScroll: true,
        onFinish: () => {
            busy.value = false
        },
    })
}
</script>

<template>
    <AdminPage title="Meistgekaufte Felgen" :context="context">
        <p class="adm-note mf__rule">
            Der Bereich auf der Startseite zeigt immer {{ size }} Felgen. Vorn stehen die Felgen, die in den letzten 90 Tagen
            verkauft wurden, die meistverkauften zuerst. Die freien Plätze füllt deine Auswahl in ihrer Reihenfolge; ist dann
            noch ein Platz frei, die neuesten Felgen im Shop. Solange nichts verkauft ist, heißt der Bereich „Empfohlene Felgen“,
            ohne Auswahl „Neu im Shop“.
        </p>

        <section class="adm-panel mf__now" aria-labelledby="mf-now">
            <h2 id="mf-now" class="adm-form__heading">So steht der Bereich jetzt</h2>
            <ol v-if="shelf.length" class="mf__list">
                <li v-for="(row, index) in shelf" :key="row.key" class="mf__row">
                    <span class="mf__place">{{ index + 1 }}</span>
                    <a :href="row.href" class="mf__name" target="_blank" rel="noopener">{{ row.label }}</a>
                    <span class="adm-tag" :class="SOURCE[row.source].tone">{{ SOURCE[row.source].label }}</span>
                </li>
            </ol>
            <p v-if="shelf.length < size" class="adm-note">
                Im Shop sind zurzeit {{ shelf.length === 0 ? 'keine Felgen' : shelf.length === 1 ? 'eine Felge' : `${shelf.length} Felgen` }} zu
                kaufen; der Bereich zeigt {{ size }}, sobald es so viele gibt.
            </p>
        </section>

        <section class="adm-panel mf__picks" aria-labelledby="mf-picks">
            <h2 id="mf-picks" class="adm-form__heading">Deine Auswahl</h2>
            <p v-if="refusal" class="adm-alert" role="alert">{{ refusal }}</p>

            <form v-if="can.update" class="mf__form" novalidate @submit.prevent="save">
                <ol class="mf__slots">
                    <li v-for="(_, index) in slots" :key="index" class="mf__slot">
                        <label class="mf__place" :for="`mf-slot-${index}`">{{ index + 1 }}<span class="visually-hidden">. Platz</span></label>
                        <select :id="`mf-slot-${index}`" v-model="slots[index]" class="input mf__select">
                            <option value="">Platz frei</option>
                            <option v-for="option in options" :key="option.value" :value="option.value" :disabled="takenElsewhere(option.value, index)">
                                {{ option.label }}
                            </option>
                        </select>
                        <span class="mf__moves">
                            <button class="adm-iconbtn" type="button" :disabled="index === 0" :aria-label="`${index + 1}. Platz nach oben`" @click="move(index, -1)">
                                <Icon name="chevron-up" :size="20" />
                            </button>
                            <button class="adm-iconbtn" type="button" :disabled="index === slots.length - 1" :aria-label="`${index + 1}. Platz nach unten`" @click="move(index, 1)">
                                <Icon name="chevron-down" :size="20" />
                            </button>
                        </span>
                    </li>
                </ol>
                <div class="mf__actions">
                    <button class="btn btn--primary" type="submit" :disabled="busy || !dirty" :aria-busy="busy ? 'true' : undefined">Speichern</button>
                    <span v-if="dirty" class="adm-note">Noch nicht gespeichert.</span>
                </div>
            </form>

            <template v-else>
                <ol v-if="picks.length" class="mf__list">
                    <li v-for="(key, index) in picks" :key="key" class="mf__row">
                        <span class="mf__place">{{ index + 1 }}</span>
                        <span class="mf__name">{{ labelOf(key) }}</span>
                    </li>
                </ol>
                <p v-else class="adm-note">Noch keine Auswahl.</p>
                <p class="adm-note">Ändern braucht die Rechte „Inhalte · Bearbeiten“ und „Inhalte · Veröffentlichen“.</p>
            </template>
        </section>
    </AdminPage>
</template>

<style scoped>
.mf__rule {
    max-width: 75ch;
    margin: 0 0 var(--sp-24);
}

.mf__now,
.mf__picks {
    display: grid;
    gap: var(--sp-12);
    padding: var(--sp-16);
}

.mf__picks {
    margin-top: var(--sp-24);
}

.mf__list,
.mf__slots {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    list-style: none;
}

.mf__row,
.mf__slot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-12);
    min-height: 44px;
}

.mf__place {
    flex: none;
    min-width: 2ch;
    color: var(--c-ink-2);
    font-variant-numeric: tabular-nums;
    text-align: right;
}

.mf__name {
    flex: 1;
    min-width: 0;
    color: inherit;
    overflow-wrap: anywhere;
}

.mf__select {
    flex: 1;
    min-width: 0;
}

.mf__moves {
    display: inline-flex;
    gap: var(--sp-4);
}

.mf__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-12);
    margin-top: var(--sp-8);
}
</style>
