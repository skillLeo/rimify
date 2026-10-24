<script setup lang="ts">
/**
 * The RIMIFY-CHECK panel, at panel density.
 *
 * It ALWAYS names the vehicle. `Passend` on its own is meaningless — the entire claim of this
 * product is that the answer is about one specific car, and a panel that omits the car has thrown
 * that away.
 *
 * Four states, and `UNKNOWN` is not dressed as a refusal: "we hold no document" and "the document
 * does not cover this" are different facts, and only one of them is about the customer's car.
 */

import { Link, router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import { tyreUnconfirmed } from '../../composables/useConfigurator'
import Icon from '../Art/Icon.vue'
import ValueText from '../Ui/ValueText.vue'
import BuildForm from './BuildForm.vue'
import PapersForm from './PapersForm.vue'
import type { IconName } from '../../art'
import ConditionGroups from '../Fitment/ConditionGroups.vue'
import { ABNAHME_REQUIRED, ENTRY_REQUIRED, entryBySize, entryLineOrNone, papersLine } from '../../fitment/papers'
import type { ConfigVerdict } from '../../types/pages'
import type { ConditionGroupsView, VehicleProp } from '../../types/rimify'

const props = withDefaults(
    defineProps<{
        verdict: ConfigVerdict | null
        vehicle: VehicleProp | null
        /** The size shown: „RIMIFY-Check drucken“ freezes the answer for it and this car. */
        configId?: number | null
        /** The freeze's label: on the RIMIFY-Check, whose own address is the link to share, it only prints (#28). */
        issueLabel?: string
        /**
         * A Komplettrad's tyre chosen (the client's #18): the answer for its size, as the server grouped it — the Eintragung
         * and the Auflagen of that size alone, the same the basket line will say. Null: the answer for every size.
         */
        chosen?: ConditionGroupsView | null
        /**
         * Where a customer names the tyres they want checked by hand (finding 103): the contact form, with the wheel as
         * the subject and this page as where they wrote from — the car is ticked there by itself. Null: no such offer.
         */
        askHref?: string | null
    }>(),
    { configId: null, issueLabel: 'RIMIFY-Check drucken oder teilen', chosen: null, askHref: null }
)

/* `255/40 R19` — the size of the tyre chosen, where the server answered for it. */
const chosenSize = computed(() => props.chosen?.chosen ?? null)

/*
 * A set chosen as one of the Gutachten's combinations (D-335): the answer per axle — both sizes fitted, each axle's
 * Auflagen under its name, the Eintragung the set's. Said in full here whatever the detail below folds away.
 */
const setView = computed(() => (props.chosen?.perAxle === true && props.chosen.chosen === null ? props.chosen : null))

/* The sizes the answer is for: the tyre's, or the set's two — null for every size the car may carry. */
const chosenSizes = computed(() => (chosenSize.value !== null ? [chosenSize.value] : setView.value ? setView.value.sizes.map((s) => s.size) : null))

/* „RIMIFY-Check drucken“: the answer frozen whole on the server, then its printable page. */
const issuing = ref(false)

function issueCheck(): void {
    if (props.configId == null || issuing.value) {
        return
    }

    issuing.value = true
    router.post('/rimify-check/ergebnis', { wheelConfigId: props.configId }, {
        onFinish: () => {
            issuing.value = false
        },
    })
}

/* Every Auflage a Hinweis (#23, D-104, decided on the server): the panel says „Freigegeben“, and quietly that there are notes. */
const notesOnly = computed(() => props.vehicle !== null && props.verdict?.status === 'CONDITIONAL' && props.verdict.notesOnly === true)

const tone = computed<{ cls: string; icon: IconName }>(() => {
    if (props.vehicle === null || props.verdict === null) {
        return { cls: 'rcheck-panel--unknown', icon: 'info' }
    }

    if (notesOnly.value) {
        return { cls: '', icon: 'check-circle' }
    }

    switch (props.verdict.status) {
        case 'PERMITTED':
            return { cls: '', icon: 'check-circle' }
        case 'CONDITIONAL':
            return { cls: 'rcheck-panel--warn', icon: 'warning' }
        case 'NOT_PERMITTED':
            return { cls: 'rcheck-panel--danger', icon: 'close' }
        default:
            return { cls: 'rcheck-panel--unknown', icon: 'info' }
    }
})

/*
 * Finding 103 (the operator's decision of 14.10.2026): a wheel its Gutachten approves for the car, with a tyre half
 * that has no answer, was headed „Keine Freigabe hinterlegt“ — the false half first, on the client's own wheel and car.
 * Unverified is neither forbidden nor unavailable; the panel says which half is which, why, and what resolves it. Every
 * sentence states what is on record with us, never what the document does or does not print (R-17). The same shape where
 * the tyres wait for the car's papers (D-286): the wheel's own verdict first, in full — its Eintragung and its
 * Auflagen —, then the tyre as unconfirmed, the reason ours, then the way on: the papers' fields, in the form below.
 */
const tyreOpen = computed(() => tyreUnconfirmed(props.verdict))

/* The fields of the papers the answer waits for (D-286): `8.1`, `8.2`, `T` — empty where it waits for a record of ours. */
const owed = computed(() => (tyreOpen.value ? props.verdict?.tyre?.owed ?? [] : []))

/*
 * Whether the papers need an entry is only a meaningful sentence about a wheel that may be fitted
 * at all. "Keine Eintragung erforderlich." under "Nicht freigegeben" read as reassurance about a
 * wheel that cannot legally go on the car, entry or not. A wheel approved with its tyres unconfirmed may be fitted:
 * its verdict is said in full (D-286).
 */
const entryLine = computed(() => {
    const verdict = props.verdict

    if (verdict === null || (verdict.status !== 'PERMITTED' && verdict.status !== 'CONDITIONAL' && !tyreOpen.value)) {
        return null
    }

    // A tyre chosen: that size's own answer — with 255/40 R19 the Abnahme, with 235/45 R19 none (#18). A set per axle: the
    // set's — needed where either axle's size needs it, for both are fitted (D-335).
    if (chosenSize.value !== null || setView.value !== null) {
        return entryLineOrNone(props.chosen?.entry ?? verdict.requiresEntry, verdict.papersExempt === true)
    }

    // One size needs the Abnahme, another does not (ABE 55255, X3 X83: A01 with 255/40R19 alone): the line names them.
    return entryBySize(verdict.conditionGroups?.sizes, verdict.papersExempt === true) ?? entryLineOrNone(verdict.requiresEntry, verdict.papersExempt === true)
})

/*
 * The document's own word on the papers (§ 15 FZV — ABE 53841, point 10): its own line, because for many buyers that
 * is the question they hesitate over. Beside the Auflagen's line, never instead of it: two questions (PapersWording).
 */
const papersExemptLine = computed(() => (entryLine.value === null ? null : papersLine(props.verdict?.papersExempt === true)))

/*
 * The papers are said once, in the verdict, right under its headline (the client's #21). Where the admin's note on the
 * Eintragung says it more exactly („…durch eine amtlich anerkannte Prüfstelle…“), the note stands in place of the
 * general sentence rather than beside it; a note about something else stays beneath. The Auflagen then explain
 * themselves, and none of them repeats the line: the general sentences are left out of the lists below.
 */
const noteRepeats = computed(() => /eintragung|abnahme/i.test(props.verdict?.entryNoteDe ?? ''))

const verdictEntry = computed(() => {
    const note = props.verdict?.entryNoteDe ?? null

    return entryLine.value === ENTRY_REQUIRED && note !== null && noteRepeats.value ? note : entryLine.value
})

const entryNote = computed(() => (entryLine.value !== null && props.verdict?.entryNoteDe && !noteRepeats.value ? props.verdict.entryNoteDe : null))

/* What the lists below leave out, because the verdict line says it. */
const said = computed(() => (entryLine.value === null ? [] : [entryLine.value, verdictEntry.value ?? '', ENTRY_REQUIRED, ABNAHME_REQUIRED]))

/* An Auflage that says word for word what the verdict line says is not said twice. */
const conditions = computed(() => (props.verdict?.conditions ?? []).filter((condition) => !said.value.includes(condition)))

/*
 * With the detail (Block D, item 15) the panel gives the overview — what there is to do, section by section —
 * and the sentences stand in full below the purchase (FitmentDetail, #auflagen): a Nachtrag gives one car forty
 * of them, and the buy button stays where the customer decides.
 */
const detail = computed(() => props.verdict?.detail ?? null)

const overview = computed(() => {
    const view = detail.value

    if (view === null) {
        return []
    }

    // What there is to do — the notes are not a task, and the sizes have their own line below. With a tyre chosen, only
    // what its size carries: a sentence another size alone hangs off is not this combination's (D-04, #18). With a set
    // per axle, what either of its sizes carries (D-335).
    const lines: string[] = []
    const chosen = chosenSizes.value
    const applies = (i: { sizes?: string[] }): boolean => chosen === null || !i.sizes?.length || i.sizes.some((size) => chosen.includes(size))
    const items = (title: string): number => view.sections.find((s) => s.title === title)?.items.filter((i) => !said.value.includes(i.text) && applies(i)).length ?? 0
    const work = items('Arbeiten am Fahrzeug')
    const first = view.fasteners[0]

    // A size's own work counts only with that size (D-04): „bis zu“ while the size decides.
    const bySize = chosen === null && (view.sections.find((s) => s.title === 'Arbeiten am Fahrzeug')?.items.some((i) => i.sizes?.length) ?? false)

    // An Abnahme only some sizes carry is said as such, as the work is (D-04).
    const abnahmeBySize = chosen === null && (view.sections.find((s) => s.title === 'Abnahme')?.items.some((i) => i.sizes?.length) ?? false)

    if (items('Abnahme') > 0) lines.push(abnahmeBySize ? 'Abnahme beim Prüfer, je nach Reifengröße' : 'Abnahme beim Prüfer')
    if (work > 0) lines.push(`${bySize ? 'bis zu ' : ''}${work} ${work === 1 ? 'Arbeit' : 'Arbeiten'} am Fahrzeug${bySize ? ', je nach Reifengröße' : ''}`)

    if (first !== undefined) {
        // Which set is the car's is not the customer's choice (D-08): the car decides.
        const more = view.fasteners.length - 1

        lines.push(more > 0
            ? `${first.thread}${first.torque ? ` (${first.torque})` : ''} oder ${more === 1 ? 'ein anderer Schraubensatz' : `einer von ${more} anderen Schraubensätzen`} – welcher, hängt von deinem Fahrzeug ab`
            : `${first.thread}${first.torque ? `, ${first.torque}` : ''}`)
    }

    return lines
})

/* Every size the car may carry, front and rear: a size for the rear axle only is still one of them (D-09). */
const sizes = computed(() => [...new Set([
    ...(props.verdict?.tyreSizesFront ?? props.verdict?.tyreSizes ?? []),
    ...(props.verdict?.tyreSizesRear ?? []),
])])

/*
 * „Alle Auflagen im Wortlaut“ scrolls to the section without a history entry: Back from a fragment is an Inertia
 * visit that re-mounts the page and throws away the chosen size and colour (D-01). The heading takes the focus,
 * so a screen reader reads on from there (D-12). A modified click keeps the link's own behaviour.
 */
function toDetail(event: MouseEvent): void {
    const section = document.getElementById('auflagen')

    if (section === null || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
    }

    event.preventDefault()
    document.getElementById('fdt-h')?.focus({ preventScroll: true })
    section.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
}

const documentLine = computed(() => {
    const document = props.verdict?.document

    if (!document) {
        return null
    }

    const parts = [document.issuer, document.number].filter(
        (part): part is string => typeof part === 'string' && part.trim() !== ''
    )
    const line = parts.length > 0 ? parts.join(' · ') : null
    const others = document.others ?? []

    // Several documents the answer rests on are each named, the newest first (the corrections memo §3).
    return others.length === 0 ? line : [line, ...others].filter((part): part is string => part !== null).join(' und ')
})

const headline = computed(() => {
    if (props.vehicle === null) {
        return 'Noch kein Fahrzeug gewählt.'
    }

    if (props.verdict === null) {
        return `Prüfung für ${props.vehicle.label}`
    }

    if (notesOnly.value) {
        return `Freigegeben für ${props.vehicle.label}`
    }

    switch (props.verdict.status) {
        case 'PERMITTED':
            return `Freigegeben für ${props.vehicle.label}`
        case 'CONDITIONAL':
            return `Mit Auflagen freigegeben für ${props.vehicle.label}`
        case 'NOT_PERMITTED':
            return `Nicht freigegeben für ${props.vehicle.label}`
        default:
            // Where the answer waits for the car's body style or drive, it is not „none on file“ but not yet
            // given: the question right below says what it waits for (the operator's ruling on EF-01, D-041).
            if ((props.verdict.missing ?? []).length > 0) {
                return `Noch offen für ${props.vehicle.label}`
            }

            // The wheel is approved and only the tyre size is unconfirmed (finding 103): lead with what is true — the
            // customer's first question is whether this wheel may go on this car — then the caveat. Where the car's
            // papers are what is missing, no size is the open part — the tyres are, whichever size (D-286).
            return tyreOpen.value
                ? `${wheelApproved.value} · ${tyresWord.value} noch nicht bestätigt`
                : `Noch nicht bestätigt für ${props.vehicle.label}`
    }
})

/*
 * Where this wheel is no answer for the car — refused, or nothing on record for it — the panel was the end of the road
 * (finding 117): the wheels that are an answer are one link away. Not where the answer waits for something the
 * customer can give (the body style, the drive) or only the tyre size is open: there the way on is in the panel.
 */
const elsewhere = computed(() => {
    const verdict = props.verdict

    if (props.vehicle === null || verdict === null || tyreOpen.value || (verdict.missing ?? []).length > 0) {
        return null
    }

    return verdict.status === 'NOT_PERMITTED' || verdict.status === 'UNKNOWN' ? `/felgen?fahrzeug=${props.vehicle.id}` : null
})
const wheelApproved = computed(() => (props.verdict?.wheelStatus === 'CONDITIONAL' ? 'Felge freigegeben mit Auflagen' : 'Felge freigegeben'))
/* „Reifengröße“ where a record of ours leaves a size open (finding 103); „Reifen“ where the car's papers are missing. */
const tyresWord = computed(() => (owed.value.length > 0 ? 'Reifen' : 'Reifengröße'))
/*
 * The rim sells alone while its tyres wait for the car's papers, where the wheel's own approval does not wait for them
 * (D-289): the panel says so, and the papers form waits behind its button — it would push the price off the screen.
 */
const rimSells = computed(() => tyreOpen.value && props.verdict?.rimSellable === true)
/* The car named without an article, as the headlines name it („Freigegeben für …“): „deinen“ broke on a „C-Klasse“. */
const openLead = computed(() => {
    if (!tyreOpen.value || !props.vehicle) {
        return null
    }

    const approved = `Die Felge selbst ist für ${props.vehicle.label}${props.verdict?.wheelStatus === 'CONDITIONAL' ? ' mit Auflagen' : ''} freigegeben`

    return rimSells.value
        ? `${approved} – nur mit einer der zulässigen Reifengrößen. Die Reifen dazu können wir noch nicht bestätigen. Die Felge allein kannst du schon bestellen.`
        : `${approved}. ${owed.value.length > 0 ? 'Die Reifen' : 'Die Reifengröße'} dazu können wir noch nicht bestätigen.`
})
</script>

<template>
    <div class="rcheck-panel" :class="tone.cls">
        <p class="rcheck-panel__head">
            <Icon :name="tone.icon" :size="20" /> RIMIFY-Check
        </p>

        <p class="rcheck-panel__vehicle">{{ headline }}</p>
        <!-- Finding 103: which half is approved and which is open, before anything else. -->
        <p v-if="openLead" class="fit__open" data-open="tyre">{{ openLead }}</p>
        <!-- #23, D-104: nothing to do, only to know — said quietly, never as „Mit Auflagen“. -->
        <p v-if="notesOnly" class="fit__notes">Mit Hinweisen aus dem Gutachten – nichts davon musst du tun.</p>

        <!-- The papers, once, in the verdict (#21): the Eintragung under the headline, nowhere else in the panel. -->
        <template v-if="verdict && verdictEntry">
            <p class="fit__entry fit__entry--verdict">{{ verdictEntry }}</p>
            <p v-if="entryNote" class="quiet fit__note">{{ entryNote }}</p>
            <p v-if="papersExemptLine" class="fit__entry fit__papers">{{ papersExemptLine }}</p>
        </template>

        <template v-if="verdict">
            <!-- What the answer waits for, asked by name and answered in place; a derived body style or drive
                 stands as such, with „stimmt das?“ (the operator's last prompt §1.1). Keyed by the car (C-08). -->
            <BuildForm v-if="vehicle" :key="`build-${vehicle.id}`" :vehicle-id="vehicle.id" :build="vehicle.build ?? null" :missing="verdict.missing ?? []" />

            <!-- Two lines, one per half: the wheel rests on the Gutachten, the tyres on the car's papers. -->
            <dl v-if="verdict.wheelLabel && verdict.tyre" class="fit__halves">
                <div class="fit__half">
                    <dt>Felge</dt>
                    <dd>{{ verdict.wheelLabel }}</dd>
                </div>
                <div class="fit__half" :data-tyre="verdict.tyre.status">
                    <dt>Reifen</dt>
                    <dd>{{ verdict.tyre.label }}</dd>
                </div>
            </dl>
            <!-- With the car's figures: the answer and its document always, the sum one click away, inline —
                 open at once where we say no or the customer's own figures made it stricter (29.09.2026). -->
            <template v-if="verdict.tyre?.summary">
                <p class="fit__tyre-summary"><ValueText :text="verdict.tyre.summary" /></p>
                <p v-if="verdict.tyre.basis" class="fit__tyre-basis">{{ verdict.tyre.basis }}</p>
                <details v-if="verdict.tyre.lines.length" class="fit__sum" :open="verdict.tyre.open || undefined">
                    <summary class="fit__sum-toggle">So haben wir gerechnet</summary>
                    <ul class="fit__tyre-lines">
                        <li v-for="line in verdict.tyre.lines" :key="line"><ValueText :text="line" /></li>
                    </ul>
                </details>
            </template>
            <!-- Without them: the document's thresholds and the fields to compare, in full (R-03). -->
            <ul v-else-if="verdict.tyre?.lines.length" class="fit__tyre-lines">
                <li v-for="line in verdict.tyre.lines" :key="line"><ValueText :text="line" /></li>
            </ul>
            <!-- Finding 103: an unverified size is no dead end — what settles it by itself, and what the customer can do now.
                 Where the answer waits for the car's papers, the way on is the form right below (D-286). -->
            <p v-if="tyreOpen && !owed.length" class="fit__open-next" data-open="next">
                Sobald dazu eine Tragfähigkeitstabelle hinterlegt ist, prüfen wir das automatisch nach. Wenn du deine Wunschreifen nennst, prüfen wir sie vorab von Hand.
                <Link v-if="askHref" class="link fit__open-ask" :href="askHref">Wunschreifen nennen</Link>
            </p>
            <!-- 8.1, 8.2 and T from the customer's papers: optional, and what turns the tyre line into a sum. -->
            <!-- Keyed by the car: another car chosen meanwhile (in another tab) gets a fresh form, never the
                 last car's figures under its name (C-08). -->
            <!-- Also where the customer's own figures made the answer negative: theirs stay one press from changing (the
                 interaction review of D-291) — a mistyped 1.610 kg must not take away the way to correct it. -->
            <PapersForm v-if="vehicle && (verdict.tyre || vehicle.papers)" :key="vehicle.id" :vehicle-id="vehicle.id" :papers="vehicle.papers ?? null" :known="vehicle.figures ?? null" :power-kw="vehicle.powerKw ?? null" :asked="owed" :start-closed="rimSells" />

            <!-- Auflagen in full sentences. They cost the customer money and time; burying them is
                 both a conversion problem and a trust problem. With the detail, in the order they are done. -->
            <div v-if="detail && overview.length" class="fit__overview">
                <p class="label fit__overview-h">Das verlangt das Gutachten<template v-if="chosenSize"> mit <span class="data" translate="no">{{ chosenSize }}</span></template><template v-else-if="setView"> für diese Kombination</template></p>
                <p class="small fit__overview-line">{{ overview.join(' · ') }} · <a class="fit__to-detail" href="#auflagen" @click="toDetail">alle Auflagen im Wortlaut</a></p>
            </div>
            <!-- A set chosen as one of the Gutachten's combinations (D-335): each axle's Auflagen under its name, in full,
                 whatever the detail folds away — the groups' own heads say which axle. -->
            <ConditionGroups v-if="setView" class="fit__groups" :groups="setView" :omit="said" data-set-answer />
            <!-- Each tyre size's Auflagen with that size, the combination's once (ConditionGroups) — never one blended list. -->
            <ConditionGroups v-else-if="!detail && chosen" class="fit__groups" :groups="chosen" :omit="said" />
            <ConditionGroups v-else-if="!detail && verdict.conditionGroups && conditions.length" class="fit__groups" :groups="verdict.conditionGroups" :omit="said" />
            <ul v-else-if="!detail && conditions.length" class="fit__conditions">
                <li v-for="condition in conditions" :key="condition">{{ condition }}</li>
            </ul>

            <div v-if="sizes.length" class="fit__tyres">
                <span class="label">Zulässige Reifengrößen</span>
                <p class="data">{{ sizes.join(' · ') }}</p>
            </div>

            <!-- Said once: a reason the tyre lines above already give is not repeated here. -->
            <!-- Where the answer waits for the car's body style or drive, the question above says so by name. -->
            <p v-if="verdict.reason && !(verdict.missing ?? []).length && !(verdict.tyre?.lines ?? []).includes(verdict.reason) && verdict.reason !== verdict.tyre?.summary" class="fit__reason">{{ verdict.reason }}</p>

            <p v-if="documentLine" class="fit__doc">
                <Icon name="document" :size="20" />
                <span class="data">{{ documentLine }}</span>
            </p>
            <!-- An example document carries its mark wherever it is shown (decision 6, D-239). -->
            <p v-if="verdict.document?.example" class="fit__example">
                <span class="tag tag--unknown">Beispieldaten</span>
                Dieses Gutachten ist bei uns nur als Beispiel hinterlegt – eine Freigabe daraus ist hier kein Nachweis für dein Fahrzeug.
            </p>
            <!-- What the document itself limits: a Nachtrag without its base, the month a wheel must be made from. -->
            <p v-for="note in verdict.document?.notes ?? []" :key="note" class="fit__note">{{ note }}</p>
            <!-- The document itself, opened where the answer stands: the customer can check it. -->
            <p v-if="verdict.document?.pdf" class="fit__pdf">
                <!-- A control, not a word in a sentence: `.link`, 44 px tall on touch, as the check's button below. -->
                <a class="link" :href="verdict.document.pdf.url" target="_blank" rel="noopener">
                    Gutachten öffnen (<template v-if="verdict.document.example">Beispiel, </template>PDF<template v-if="verdict.document.pdf.page">, Seite {{ verdict.document.pdf.page }}</template>)
                </a>
            </p>
            <!-- No dead end (finding 117): the wheels that are an answer for this car. -->
            <p v-if="elsewhere && vehicle" class="fit__pdf fit__elsewhere">
                <Link class="link" :href="elsewhere">Felgen für {{ vehicle.short }} anzeigen</Link>
            </p>
            <!-- The answer to take away: frozen whole, every line of the sum, printable and shareable. -->
            <p v-if="vehicle && configId" class="fit__pdf">
                <button class="link fit__issue" type="button" :disabled="issuing" :aria-busy="issuing ? 'true' : undefined" @click="issueCheck">
                    {{ issueLabel }}
                </button>
            </p>
        </template>

        <p v-else-if="vehicle === null" class="quiet fit__note">
            Ohne Fahrzeug können wir keine Freigabe bestätigen.
        </p>

        <slot />
    </div>
</template>

<style scoped>
.fit__halves {
    display: grid;
    gap: var(--space-1);
    margin: var(--space-2) 0 0;
}

/* A Hinweis is quiet: the ink's second tone, no colour of its own (#23, D-104). */
.fit__notes {
    margin: var(--space-1) 0 0;
    color: var(--ink2);
    font-size: var(--text-small);
}

/* Finding 103: which half is approved and which is open — body size under the headline; the way on, small, below. */
.fit__open {
    margin: var(--sp-8) 0 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    color: var(--c-ink);
}

.fit__open-next {
    margin: var(--sp-8) 0 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.fit__open-ask {
    white-space: nowrap;
}

.fit__half {
    display: flex;
    gap: var(--space-2);
    font-size: var(--text-small);
}

.fit__half dt {
    min-width: 4.5em;
    color: var(--ink2);
}

.fit__half dd {
    margin: 0;
    font-weight: 700;
}

/* No bullets, so no indent: the lines keep the panel's text edge. */
.fit__tyre-lines {
    display: grid;
    gap: var(--space-2);
    margin: var(--space-2) 0 0;
    padding-left: 0;
    font-size: var(--text-small);
    color: var(--ink);
}

/* The answer, then its document: two lines, always there. */
.fit__tyre-summary {
    margin: var(--sp-8) 0 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 600;
    color: var(--c-ink);
}

.fit__tyre-basis {
    margin: var(--sp-4) 0 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

/* The sum, one click away and inline: a native disclosure, so it works without script and on a phone. */
.fit__sum {
    margin: var(--sp-8) 0 0;
}

/* A finger's target (DIRECTION §6, 44 px) without moving the line (D-11). */
@media (pointer: coarse) {
    .fit__to-detail {
        display: inline-block;
        padding-block: var(--sp-12);
        margin-block: calc(-1 * var(--sp-12));
    }
}

.fit__sum-toggle {
    cursor: pointer;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-blue);
    text-decoration: underline;
    text-underline-offset: 2px;
}

.fit__sum-toggle:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

/* Under a finger the toggle is a 44 px row, as every other control. */
@media (pointer: coarse) {
    .fit__sum-toggle {
        display: flex;
        align-items: center;
        min-height: 44px;
    }
}

/* The papers under the verdict's headline: in ink, a step below it. */
.fit__entry {
    margin: var(--space-2) 0 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
    color: var(--c-ink);
}

.fit__note {
    margin: var(--space-2) 0 0;
    font-size: var(--text-small);
}

/* An Auflage is a sentence the customer must act on: body size, full ink. */
.fit__groups {
    margin: var(--space-3) 0 0;
    font-size: var(--text-body);
    color: var(--ink);
}

.fit__conditions {
    display: grid;
    gap: var(--space-2);
    margin: var(--space-3) 0 0;
    padding-left: var(--space-4);
    font-size: var(--text-body);
    color: var(--ink);
}

/* What there is to do, one line per section; the sentences stand in full below the purchase (#auflagen). */
.fit__overview {
    margin-top: var(--space-3);
}

.fit__overview-h {
    margin: 0;
}

.fit__overview-line {
    margin: var(--space-1) 0 0;
    color: var(--ink);
}

.fit__tyres {
    margin-top: var(--space-3);
}

.fit__tyres p {
    margin: 2px 0 0;
}

.fit__reason {
    margin: var(--space-3) 0 0;
    font-size: var(--text-body);
    color: var(--ink2);
}

.fit__pdf {
    margin: var(--space-2) 0 0;
    font-size: var(--text-small);
}

.fit__doc {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: var(--space-3) 0 0;
    color: var(--ink2);
}

/* The example document's mark: as loud as the document line itself, never hidden in a tooltip (D-239). */
.fit__example {
    margin: var(--space-2) 0 0;
    font-size: var(--text-small);
}

.fit__example .tag {
    margin-right: var(--space-2);
}
</style>
