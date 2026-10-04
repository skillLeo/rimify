import { router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import { formatNumber } from '../../lib/num'
import { useAdmin } from './useAdmin'

/**
 * „Demodaten entfernen · 4.416 Datensätze“ — the rail's foot on a desk, the Mehr sheet on a phone (M1-10): while
 * demo rows exist, whoever opens the admin is told what the figures are made of, and who may (DemoDataPolicy) can
 * take them away after one question. The button says what it does and nothing more: only the example data goes, never
 * the team's own wheels, Gutachten and orders (the line beneath it says so). When the set cannot go now, the question
 * is replaced by the reason (AdminDemoBlocked) — before anything is pressed, not after. One source for both places.
 */
export function useDemoStrip() {
    const admin = useAdmin()
    const demo = computed(() => admin.value.demo)

    // Figure and noun on one line (R-10): a no-break space, never „4.416 / Datensätze“ (M1-15).
    const rows = computed(() => (demo.value ? `${formatNumber(demo.value.rows)}\u00A0${demo.value.rows === 1 ? 'Datensatz' : 'Datensätze'}` : ''))

    /** The promise under the button, word for word what it keeps. */
    const note = 'Entfernt nur die Beispieldaten, nicht deine eigenen Felgen, Gutachten und Bestellungen.'

    const body = computed(
        () =>
            `${demo.value?.rows === 1 ? 'Der letzte Datensatz der Beispieldaten wird' : `Die ${rows.value} der Beispieldaten werden`} gelöscht – die Demo-Bestellungen, das Demo-Team und der Beispielkatalog mit seinen Gutachten. Deine eigenen Felgen, Gutachten und Bestellungen bleiben, und das Protokoll hält fest, wer die Beispieldaten entfernt hat.`
    )

    const blocked = computed(() => demo.value?.blocked ?? null)

    const confirming = ref(false)
    const purging = ref(false)

    /**
     * Safari does not focus a clicked button, so the dialog would remember `<body>` as its opener and
     * hand the focus back there on „Abbrechen“ (M1-16). Focusing it first gives the focus a way home.
     */
    function ask(event: MouseEvent): void {
        ;(event.currentTarget as HTMLElement).focus()
        confirming.value = true
    }

    function purge(): void {
        if (purging.value) {
            return
        }

        purging.value = true
        router.post('/admin/demodaten/entfernen', {}, {
            preserveScroll: true,
            onSuccess: () => (confirming.value = false),
            onFinish: () => (purging.value = false),
        })
    }

    return { demo, rows, note, body, blocked, confirming, purging, ask, purge }
}
