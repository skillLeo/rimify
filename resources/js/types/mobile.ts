/**
 * What the phone's selector fetches from the JSON endpoints it calls while the visitor picks a
 * vehicle. Page and shared props live in `types/pages.ts` and `types/rimify.ts`; the two
 * documents receive exactly the same data, so nothing about a page is declared here.
 */

export interface ModelsResponse {
    models: { model: string; variants: number }[]
}

export interface VariantsResponse {
    variants: {
        id: number
        variant: string
        buildWindow: string
        powerPs: number | null
        needsReview: boolean
    }[]
}

export interface FitmentCountResponse {
    count: number
    permitted: number
    conditional: number
    vehicle: { id: number; label: string } | null
    ambiguous: { id: number; label: string }[]
}
