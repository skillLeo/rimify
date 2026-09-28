import { router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import { formatNumber } from '../../lib/num'
import { useAdmin } from './useAdmin'

/**
 * „Demodaten aktiv · 4.416 Datensätze · entfernen“ — the rail's foot on a desk, the Mehr sheet on a
 * phone (M1-10): while demo rows exist, whoever opens the admin is told what the figures are made of,
 * and who may (DemoDataPolicy) can take them away after one question. One source for both places.
 */
export function useDemoStrip() {
    const admin = useAdmin()
    const demo = computed(() => admin.value.demo)

    // Figure and noun on one line (R-10): a no-break space, never „4.416 / Datensätze“ (M1-15).
    const rows = computed(() => (demo.value ? `${formatNumber(demo.value.rows)}\u00A0${demo.value.rows === 1 ? 'Datensatz' : 'Datensätze'}` : ''))

    const body = computed(
        () =>
            `${demo.value?.rows === 1 ? 'Der letzte Datensatz der Demodaten wird' : `Alle ${rows.value} der Demodaten werden`} gelöscht – Bestellungen, Prüfungen, Nachfrage, die Einträge des Demo-Teams und der Beispielkatalog mit seinen Gutachten. Echte Daten bleiben unberührt, und das Protokoll hält fest, wer sie entfernt hat.`
    )

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

    return { demo, rows, body, confirming, purging, ask, purge }
}
