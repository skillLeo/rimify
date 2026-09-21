<script setup lang="ts">
/**
 * The comparison (docs/design/sections/home-overhaul.md §2.6): up to four wheels side by side,
 * one column each — the head with the cut-out, the stick row that keeps naming the columns
 * while the head scrolls away, then the groups *Felge · Preis · Gutachten* and the actions.
 *
 * Every figure comes from the server. With a vehicle the Gutachten rows carry the engine's
 * four-state verdict per column and the action the server decided (`buy`); without one the
 * *Freigabe* row says what it would take, and claims nothing. The page never picks a size.
 *
 * *Unterschiede hervorheben* changes weight and ink only: a row whose cells agree steps back,
 * a differing cell comes forward, nothing hides and nothing moves. The flag travels in `?diff=1`
 * so a shared link keeps it.
 *
 * Below 1024 every row scrolls sideways on its own and the page keeps them in step, so the stick
 * row can stay sticky against the page (a row inside one horizontal scroller could not).
 */

import { Link, router, usePage } from '@inertiajs/vue3'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Icon from '../Ui/Icon.vue'
import Picture from '../Ui/Picture.vue'
import VerdictBadge from '../Ui/VerdictBadge.vue'
import WheelOutline from '../Ui/WheelOutline.vue'
import { useShared } from '../../composables/useShared'
import { euro } from '../../format'
import { useCompare, type CompareEntry } from '../../stores/compare'
import type { CompareItem, ConfigVerdict, VergleichProps } from '../../types/pages'
import { compareKeyOf } from '../../types/rimify'

const props = withDefaults(defineProps<VergleichProps & { phone?: boolean }>(), { phone: false })

const shared = useShared()
const page = usePage()
const store = useCompare()

const vehicle = computed(() => shared.value.vehicle)
const count = computed(() => props.items.length)
const keys = computed(() => props.items.map(compareKeyOf))

const root = ref<HTMLElement | null>(null)
const heading = ref<HTMLHeadingElement | null>(null)

/* ── Head ───────────────────────────────────────────────────────────────────── */

const title = computed(() => (vehicle.value ? `Felgen vergleichen für deinen ${vehicle.value.short}` : 'Felgen vergleichen'))
const listingLabel = computed(() => (vehicle.value ? 'Passende Felgen anzeigen' : 'Felgen ansehen'))

/* ── Differences ────────────────────────────────────────────────────────────── */

/** Read from the page URL, which SSR and the client share — never from `window`. */
function readDiff(url: string): boolean {
    return new URLSearchParams(url.split('?')[1] ?? '').get('diff') === '1'
}

const diff = ref(readDiff(page.url))

watch(diff, (on) => {
    if (typeof window === 'undefined') {
        return
    }

    const url = new URL(window.location.href)

    if (on) {
        url.searchParams.set('diff', '1')
    } else {
        url.searchParams.delete('diff')
    }

    // The same history entry, the same Inertia state: only the query changes.
    window.history.replaceState(window.history.state, '', url.toString())
})

/* ── Rows ───────────────────────────────────────────────────────────────────── */

interface Cell {
    /** The value as compared: string-equal cells make a row "same". */
    text: string
    lines?: string[]
    verdict?: ConfigVerdict | null
}

interface Row {
    id: string
    label: string
    kind: 'text' | 'lines' | 'muted' | 'verdict'
    cells: Cell[]
    same: boolean
    link?: { href: string; label: string }
}

interface Group {
    id: string
    label: string
    rows: Row[]
}

function row(id: string, label: string, kind: Row['kind'], cells: Cell[], link?: Row['link']): Row {
    const first = cells[0]?.text ?? ''

    return { id, label, kind, cells, same: cells.every((cell) => cell.text === first), link }
}

function lines(list: string[]): Cell {
    return list.length ? { text: list.join(' · '), lines: list } : { text: '–', lines: ['–'] }
}

function documentLine(document: CompareItem['specs']['documents'][number]): string {
    if (document.kind === 'ABE') {
        return document.number ? `ABE Nr. ${document.number}` : 'ABE'
    }

    return document.kind
}

function entryText(verdict: ConfigVerdict | null): string {
    if (verdict === null || !verdict.sellable) {
        return '–'
    }

    return verdict.requiresEntry ? 'erforderlich' : 'nicht erforderlich'
}

const perWheel = (item: CompareItem): string => euro(Math.round(item.fromPriceCents / 4))

const groups = computed<Group[]>(() => {
    const items = props.items

    const gutachten: Row[] = [
        row('docs', 'Dokument', 'lines', items.map((item) => lines(item.specs.documents.map(documentLine)))),
    ]

    if (vehicle.value) {
        gutachten.push(
            row('verdict', 'Freigabe', 'verdict', items.map((item) => ({ text: item.verdict?.status ?? 'UNKNOWN', verdict: item.verdict }))),
            row('tyres', 'Reifengrößen', 'lines', items.map((item) => lines(item.verdict?.tyreSizes ?? []))),
            row('conditions', 'Auflagen', 'lines', items.map((item) => lines(item.verdict?.conditions ?? []))),
            row('entry', 'Eintragung', 'text', items.map((item) => ({ text: entryText(item.verdict) })))
        )
    } else {
        gutachten.push(
            row(
                'verdict-none',
                'Freigabe',
                'muted',
                items.map(() => ({ text: 'Wähle dein Fahrzeug – dann zeigen wir hier, ob die Felge freigegeben ist.' })),
                { href: '/felgen-suchen?zurueck=/vergleich', label: 'Fahrzeug wählen' }
            )
        )
    }

    return [
        {
            id: 'felge',
            label: 'Felge',
            rows: [
                row('sizes', 'Breite × Durchmesser', 'lines', items.map((item) => lines(item.specs.sizes))),
                row('et', 'Einpresstiefe', 'text', items.map((item) => ({ text: item.specs.etRange }))),
                row('lk', 'Lochkreis', 'text', items.map((item) => ({ text: item.specs.boltPattern }))),
                row('mlb', 'Mittenlochbohrung', 'text', items.map((item) => ({ text: item.specs.centreBore }))),
                row('finish', 'Finish', 'text', items.map((item) => ({ text: item.finishName }))),
            ],
        },
        {
            id: 'preis',
            label: 'Preis',
            rows: [
                row('price', 'Preis pro Felge', 'text', items.map((item) => ({ text: `ab ${perWheel(item)}` }))),
                row('legal', 'Hinweis', 'muted', items.map(() => ({ text: 'inkl. MwSt., zzgl. Versand' }))),
            ],
        },
        { id: 'gutachten', label: 'Gutachten', rows: gutachten },
    ]
})

const columnId = (item: CompareItem): string => `compare-col-${compareKeyOf(item).replace(':', '-')}`
const headerIds = computed(() => props.items.map(columnId))

/* ── The store and the page agree ───────────────────────────────────────────── */

function toEntry(item: CompareItem): CompareEntry {
    return {
        modelId: item.modelId,
        finishId: item.finishId,
        slug: item.slug,
        brandName: item.brandName,
        modelName: item.modelName,
        finishName: item.finishName,
        image: item.image,
        fromPriceCents: item.fromPriceCents,
    }
}

let corrected = false

/**
 * The page's items replace the store (a shared link and the tray must agree). An empty page
 * asked for nothing, and the browser holds a list: re-request once with it — once, never a loop.
 */
function sync(): void {
    if (props.items.length > 0 || props.missing > 0) {
        store.replace(props.items.map(toEntry))

        return
    }

    if (!corrected && store.count > 0) {
        corrected = true
        router.get('/vergleich', { f: store.query }, { replace: true, preserveScroll: true, preserveState: true })
    }
}

watch(() => props.items, sync)

/* ── Remove a column ────────────────────────────────────────────────────────── */

function remove(item: CompareItem, index: number): void {
    const key = compareKeyOf(item)
    const remaining = keys.value.filter((k) => k !== key)
    const focusIndex = Math.min(index, remaining.length - 1)

    store.remove(key)

    const query: Record<string, string | number> = {}

    if (remaining.length > 0) {
        query.f = remaining.join(',')
    }

    if (diff.value) {
        query.diff = 1
    }

    router.get('/vergleich', query, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        only: ['items', 'missing'],
        onSuccess: () => {
            void nextTick(() => {
                const buttons = root.value?.querySelectorAll<HTMLButtonElement>('.compare__head .compare__remove') ?? []
                const next = buttons[focusIndex]

                if (next) {
                    next.focus()
                } else {
                    heading.value?.focus()
                }
            })
        },
    })
}

/* ── Add to basket ──────────────────────────────────────────────────────────── */

const adding = ref<number | null>(null)

function addToBasket(configId: number): void {
    if (adding.value !== null) {
        return
    }

    router.post(
        '/warenkorb',
        { kind: 'WHEEL', wheelConfigId: configId, quantity: 4 },
        {
            preserveScroll: true,
            onStart: () => {
                adding.value = configId
            },
            onFinish: () => {
                adding.value = null
            },
        }
    )
}

/* ── Rows in step below 1024 ────────────────────────────────────────────────── */

function onRowScroll(event: Event): void {
    const source = event.target

    if (!(source instanceof HTMLElement) || !source.classList.contains('compare__row')) {
        return
    }

    const left = source.scrollLeft

    for (const other of root.value?.querySelectorAll<HTMLElement>('.compare__row') ?? []) {
        if (other !== source && other.scrollLeft !== left) {
            other.scrollLeft = left
        }
    }
}

onMounted(() => {
    store.hydrate()
    sync()
    // `scroll` does not bubble; the capture phase reaches every row from the root.
    root.value?.addEventListener('scroll', onRowScroll, { capture: true, passive: true })
})

onBeforeUnmount(() => {
    root.value?.removeEventListener('scroll', onRowScroll, { capture: true })
})
</script>

<template>
    <div ref="root" class="compare-page" :class="{ 'compare-page--phone': phone }">
        <header class="compare-head">
            <div class="compare-head__copy">
                <h1 id="vergleich-title" ref="heading" class="h1" tabindex="-1">
                    {{ title }}
                    <span v-if="demo" class="badge demo-note">Demodaten</span>
                </h1>
                <div v-if="count > 0" class="compare-head__meta">
                    <span class="small num muted">{{ count }} von {{ cap }} Felgen</span>
                    <Link href="/felgen" class="link small" prefetch>Weitere Felgen hinzufügen</Link>
                </div>
                <p v-if="demo" class="micro quiet">Beispielsortiment mit Fotos unter freier Lizenz. Preise und Bestände sind Beispielwerte.</p>
            </div>

            <label v-if="count > 0" class="check compare-head__toggle">
                <input v-model="diff" type="checkbox" aria-controls="vergleich-tabelle" />
                Unterschiede hervorheben
            </label>
        </header>

        <!-- Empty: the situation named, and the way forward. -->
        <div v-if="count === 0" class="empty">
            <p class="empty__title">Noch keine Felgen im Vergleich.</p>
            <p class="empty__text">Setz auf einer Felge das Häkchen „Vergleichen“ – bis zu vier Felgen nebeneinander.</p>
            <Link href="/felgen" class="btn btn--secondary" prefetch>{{ listingLabel }}</Link>
        </div>

        <template v-else>
            <div v-if="missing > 0" class="notice compare-notice compare-table" role="status">
                <Icon name="info" :size="20" />
                <p>
                    {{
                        missing === 1
                            ? 'Eine Felge aus deinem Vergleich ist nicht mehr im Sortiment und wurde entfernt.'
                            : `${missing} Felgen aus deinem Vergleich sind nicht mehr im Sortiment und wurden entfernt.`
                    }}
                </p>
            </div>

            <div v-if="count === 1" class="notice compare-notice" :class="{ 'compare-table': missing === 0 }">
                <Icon name="info" :size="20" />
                <p>
                    Füge eine zweite Felge hinzu, um zu vergleichen.
                    <Link href="/felgen" class="link" prefetch>Felgen ansehen</Link>
                </p>
            </div>

            <div
                id="vergleich-tabelle"
                class="compare"
                :class="{ 'compare--phone': phone, 'compare-table': missing === 0 && count > 1 }"
                :style="{ '--n': count }"
                role="table"
                aria-labelledby="vergleich-title"
                :data-diff="diff ? 'on' : undefined"
            >
                <!-- The head: the cut-out, the names, the price, the badge, one remove button per column. -->
                <div class="compare__row compare__head" role="row">
                    <div class="compare__label" role="cell" />
                    <div v-for="(item, i) in items" :key="compareKeyOf(item)" class="compare__cell" role="cell">
                        <span class="compare__img">
                            <Picture v-if="item.image" :image="item.image" :alt="`${item.brandName} ${item.modelName} in ${item.finishName}, Ansicht von vorn`" sizes="(min-width: 1024px) 26vw, 45vw" :eager="i < 2" />
                            <WheelOutline v-else :spokes="item.art.spokes" size="60%" />
                        </span>
                        <span class="small quiet">{{ item.brandName }}</span>
                        <span class="h4">{{ item.modelName }}</span>
                        <span class="small muted">{{ item.finishName }}</span>
                        <span class="body num compare__price">ab {{ perWheel(item) }} pro Felge</span>
                        <span class="micro quiet">inkl. MwSt., zzgl. Versand</span>
                        <VerdictBadge v-if="vehicle && item.verdict" :status="item.verdict.status" class="compare__badge" />
                        <button class="icon-btn compare__remove" type="button" :aria-label="`${item.brandName} ${item.modelName} aus dem Vergleich entfernen`" @click="remove(item, i)">
                            <Icon name="close" :size="16" />
                        </button>
                    </div>
                </div>

                <!-- The stick row: sticky under the header, it names the columns. -->
                <div class="compare__row compare__stick" role="row">
                    <div class="compare__label" role="columnheader"><span class="label">Felge</span></div>
                    <div v-for="item in items" :id="columnId(item)" :key="compareKeyOf(item)" class="compare__cell" role="columnheader">
                        <span class="compare__img">
                            <Picture v-if="item.image" :image="item.image" alt="" sizes="48px" />
                            <WheelOutline v-else :spokes="item.art.spokes" />
                        </span>
                        <span class="compare__stick-name">
                            <span class="micro quiet">{{ item.brandName }}</span>
                            <span>{{ item.modelName }}</span>
                        </span>
                        <VerdictBadge v-if="vehicle && item.verdict" :status="item.verdict.status" />
                    </div>
                </div>

                <!-- The groups. -->
                <template v-for="group in groups" :key="group.id">
                    <div class="compare__row" role="row">
                        <div class="compare__label compare__group label" role="rowheader" :aria-colspan="count + 1">{{ group.label }}</div>
                    </div>

                    <div v-for="r in group.rows" :key="r.id" class="compare__row compare__row--data" :class="{ 'compare__row--same': r.same }" role="row">
                        <div class="compare__label" role="rowheader">
                            <span class="label">{{ r.label }}</span>
                            <Link v-if="r.link" :href="r.link.href" class="link small compare__label-link">{{ r.link.label }}</Link>
                        </div>
                        <div
                            v-for="(cell, i) in r.cells"
                            :key="i"
                            class="compare__cell"
                            :class="{ 'compare__diff': !r.same, 'compare__cell--muted': r.kind === 'muted' }"
                            role="cell"
                            :aria-describedby="headerIds[i]"
                        >
                            <template v-if="r.kind === 'verdict'">
                                <VerdictBadge v-if="cell.verdict" :status="cell.verdict.status" />
                                <span v-else class="small muted">–</span>
                                <span v-if="cell.verdict && cell.verdict.reason" class="small muted compare__reason">{{ cell.verdict.reason }}</span>
                            </template>
                            <ul v-else-if="r.kind === 'lines'" class="compare__list">
                                <li v-for="line in cell.lines" :key="line">{{ line }}</li>
                            </ul>
                            <template v-else>{{ cell.text }}</template>
                        </div>
                    </div>
                </template>

                <!-- The actions: what the server decided per column. Never a size chosen here. -->
                <div class="compare__row compare__actions" role="row">
                    <div class="compare__label" role="cell" />
                    <div v-for="item in items" :key="compareKeyOf(item)" class="compare__cell" role="cell">
                        <template v-if="item.buy.kind === 'basket'">
                            <form class="compare__buy" @submit.prevent="addToBasket(item.buy.configId)">
                                <button class="btn btn--primary btn--block" type="submit" :aria-busy="adding === item.buy.configId ? 'true' : undefined">In den Warenkorb</button>
                            </form>
                            <span class="small muted">{{ item.buy.sizeLabel }} · für deinen {{ vehicle?.short }}</span>
                        </template>
                        <template v-else-if="item.buy.kind === 'choose'">
                            <Link :href="item.buy.href" class="btn btn--secondary btn--block">Größe wählen</Link>
                        </template>
                        <template v-else>
                            <span class="small muted">Nicht freigegeben für deinen {{ vehicle?.short }}</span>
                            <Link :href="`/felgen/${item.slug}?ausfuehrung=${item.finishId}`" class="link">Details ansehen</Link>
                        </template>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
.compare__label-link {
    display: block;
    margin-top: var(--sp-4);
}

.compare__reason {
    display: block;
    margin-top: var(--sp-4);
}

.compare__badge {
    justify-self: start;
    margin-top: var(--sp-4);
}

.compare__buy {
    display: grid;
}
</style>
