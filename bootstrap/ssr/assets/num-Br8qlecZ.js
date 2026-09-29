var cache = /* @__PURE__ */ new Map();
function formatter(min, max) {
	const key = `${min}:${max}`;
	let cached = cache.get(key);
	if (cached === void 0) {
		cached = new Intl.NumberFormat("de-DE", {
			minimumFractionDigits: min,
			maximumFractionDigits: max
		});
		cache.set(key, cached);
	}
	return cached;
}
/** `1.234,5` — thousands point, decimal comma, exactly `digits` places. */
function formatNumber(value, digits = 0) {
	return formatter(digits, digits).format(value);
}
/** The minus of a negative amount: U+2212, as PHP's GermanFormat writes it — never a hyphen. */
var MINUS = "−";
/**
* Minor units split into whole units and cents without dividing into a fraction, so no amount is
* ever a float on its way to text (the launch release §4). A fraction of a cent cannot be a price;
* one that arrives anyway is taken to the nearest cent.
*/
function split(minorUnits) {
	const minor = Math.round(minorUnits);
	const absolute = Math.abs(minor);
	const cents = absolute % 100;
	return {
		sign: minor < 0 ? MINUS : "",
		units: (absolute - cents) / 100,
		cents
	};
}
/**
* An amount in its currency, from minor units: `1.425,00 €`, `12,50 CHF`. Money travels with its
* currency (every money column has one); the shop's is EUR, written as `€`, any other by its code.
* Byte for byte what PHP's `GermanFormat::money` writes, so a price reads the same whichever side
* formatted it.
*/
function formatCurrency(minorUnits, currency = "EUR") {
	const { sign, units, cents } = split(minorUnits);
	return `${sign}${formatNumber(units, 0)},${String(cents).padStart(2, "0")} ${currency === "EUR" ? "€" : currency}`;
}
/**
* `59.748,00 €` from minor units (cents) — the one way a euro amount becomes text. `whole` drops the
* cents, rounding half up: only for a chart axis, whose ticks are round numbers anyway.
*/
function formatMoney(minorUnits, whole = false) {
	if (!whole) return formatCurrency(minorUnits, "EUR");
	const { sign, units, cents } = split(minorUnits);
	const rounded = cents >= 50 ? units + 1 : units;
	return `${rounded === 0 ? "" : sign}${formatNumber(rounded, 0)} €`;
}
/** `+12,4 %` (with its sign), or `12,4 %` with `sign: false`. */
function formatPercent(value, digits = 1, sign = true) {
	const text = formatNumber(Math.abs(value), digits);
	return `${!sign || value === 0 ? value < 0 ? "−" : "" : value > 0 ? "+" : "−"}${text} %`;
}
/** A German number as a person types it: `1000`, `1.000`, `1.425,50`, `−12,5`, spaces around. */
var GROUPED = /^[+\-−]?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/;
var PLAIN = /^[+\-−]?\d+(?:,\d+)?$/;
/**
* The number a German text means, or null where it is not unambiguously one: `12.5` is neither
* twelve and a half (that is `12,5`) nor a thousands group, so it is not a number. A number is
* itself; an empty value is null.
*/
function parseNumber(value) {
	if (typeof value === "number") return Number.isFinite(value) ? value : null;
	if (typeof value !== "string") return null;
	const text = value.trim();
	if (!GROUPED.test(text) && !PLAIN.test(text)) return null;
	const number = Number(text.replace(/−/g, "-").replace(/\./g, "").replace(",", "."));
	return Number.isFinite(number) ? number : null;
}
//#endregion
export { parseNumber as i, formatNumber as n, formatPercent as r, formatMoney as t };
