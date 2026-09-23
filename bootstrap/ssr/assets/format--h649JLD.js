var decimals = /* @__PURE__ */ new Map();
function formatter(digits) {
	let cached = decimals.get(digits);
	if (cached === void 0) {
		cached = new Intl.NumberFormat("de-DE", {
			minimumFractionDigits: digits,
			maximumFractionDigits: digits
		});
		decimals.set(digits, cached);
	}
	return cached;
}
/** `1.234,5` — thousands point, decimal comma, a fixed number of places. */
function decimal(value, digits = 1) {
	return formatter(digits).format(value);
}
/** `1.234,00 €` from integer cents. */
function euro(cents) {
	return `${decimal(cents / 100, 2)} €`;
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
function zoll(inches) {
	return withUnit((Array.isArray(inches) ? inches : [inches]).map((v) => typeof v === "number" ? decimal(v, Number.isInteger(v) ? 0 : 1) : v).join(" · "), "Zoll");
}
//#endregion
export { zoll as a, withUnit as i, euro as n, felgen as r, decimal as t };
