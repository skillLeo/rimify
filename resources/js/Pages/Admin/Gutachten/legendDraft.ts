import type { InjectionKey, Ref } from 'vue'

/** What a pasted legend holds while its form is open, kept by whoever shows the Auflagenverzeichnis in a dialog that can close over it. */
export interface LegendDraft {
    open: Ref<boolean>
    pasted: Ref<string>
    split: Ref<unknown[]>
}

export const LEGEND_DRAFT: InjectionKey<LegendDraft> = Symbol('legend-draft')
