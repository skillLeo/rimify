// The types of scripts/fonts/fallbacks.mjs, for the guard that imports it (resources/js/fonts.test.ts).

export interface FontMetrics {
    sha256: string;
    unitsPerEm: number;
    ascent: number;
    descent: number;
    lineGap: number;
    /** capsize's weighted average advance, by `weight@width`, in the font's units. */
    widths: Record<string, number>;
    /** The advance of „0" — the `ch` unit — by `weight@width`, in the font's units. */
    zero: Record<string, number>;
}

export interface Band {
    min: number;
    max: number;
    at: number;
}

export interface Face {
    family: string;
    src: string[];
    weight: string;
    stretch: string;
    sizeAdjust: string;
    ascentOverride: string;
    descentOverride: string;
    lineGapOverride: string;
}

export interface Fallback {
    family: string;
    unitsPerEm: number;
    faces: Record<number, { xWidthAvg: number; src: string[] }>;
}

export const FONT: string;
export const JSON_FILE: string;
export const CSS_FILE: string;
export const WEIGHTS: Band[];
export const WIDTHS: Band[];
export const FALLBACKS: Fallback[];
export function measure(path?: string): FontMetrics;
export function faces(metrics: FontMetrics): Face[];
export function css(metrics: FontMetrics): string;
