import { n as formatNumber } from "./num-Br8qlecZ.js";
//#region resources/js/format.ts
/**
* German formatting in the browser (R-10): the one place a measure or a size is turned into text.
* Numbers and units are joined with a narrow no-break space, so `72,6 mm` never breaks across a
* line. The numbers themselves come from `lib/num.ts`, the one module that formats and parses them —
* and money only from its `formatMoney`, the one way an amount becomes text (the launch release §4).
*/
/** `1.234,5` — thousands point, decimal comma, a fixed number of places. */
function decimal(value, digits = 1) {
	return formatNumber(value, digits);
}
/** `72,6 mm`, `71 dB`, `ET 35` — a value and its unit, inseparable. */
function withUnit(value, unit) {
	return `${value} ${unit}`;
}
/** `18 Zoll`, `18,5 Zoll`; a list reads `17 · 18 · 19 Zoll`. */
/** `1 Felge` · `12 Felgen` — one spelling for every count of wheels on the site. */
function felgen(count) {
	return `${decimal(count, 0)} ${count === 1 ? "Felge" : "Felgen"}`;
}
/** `1 Modell` · `1.234 Modelle` — a count and its noun, in the singular for one. */
function anzahl(count, one, many) {
	return `${decimal(count, 0)} ${count === 1 ? one : many}`;
}
/** The selector's button: `1 passende Felge anzeigen` · `1.234 passende Felgen anzeigen` — never „1 passende Felgen". */
function passendeAnzeigen(count) {
	return `${decimal(count, 0)} ${count === 1 ? "passende Felge" : "passende Felgen"} anzeigen`;
}
function zoll(inches) {
	return withUnit((Array.isArray(inches) ? inches : [inches]).map((v) => typeof v === "number" ? decimal(v, Number.isInteger(v) ? 0 : 1) : v).join(" · "), "Zoll");
}
/**
* A text the team typed in Inhalte, as the paragraphs they meant: a blank line starts a new one
* (the editor says so under every long field). One rule for the Ratgeber, the legal pages and the
* FAQ, so no page prints a typed paragraph break as a single run-on block.
*/
function paragraphs(text) {
	return (text ?? "").replace(/\r\n?/g, "\n").split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p !== "");
}
//#endregion
export { passendeAnzeigen as a, paragraphs as i, decimal as n, withUnit as o, felgen as r, zoll as s, anzahl as t };
