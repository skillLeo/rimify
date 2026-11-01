import { i as RDKS, l as WEIGHTS, m as versionShort, r as MOUNTING_SET_CENTS } from "./shopDemo-CkuVaHdt.js";
//#region resources/js/Pages/Skizze/komplettradSketch.ts
/**
* The Komplettrad sketch's list and basket (the Gutachten rework brief §9): the tyres that fit, filtered by season, brand
* and set price and sorted by price or brand; a set the same front and rear, or two and two where the paper allows a
* pair; no paid extra unless the customer chose it; and the basket as its lines. In memory only, kept apart from the page so it is tested.
*/
var PRICE_BANDS = [
	{
		value: "alle",
		label: "Alle Preise"
	},
	{
		value: "bis500",
		label: "bis 500 €"
	},
	{
		value: "500bis600",
		label: "500 bis 600 €"
	},
	{
		value: "ueber600",
		label: "über 600 €"
	}
];
/**
* The demo tyres in the sizes of the version chosen: 225/40 R18 and 255/35 R18 on 18 inches, 235/35 R19 and 265/30 R19 on
* 19 — a 19-inch rim is never offered 18-inch tyres. Prices of the larger size are the smaller one's plus 20,00 €, the
* set added up, never multiplied (the money rule).
*/
function fitFor(tyre, diameter) {
	if (diameter !== 19) return tyre;
	const front = {
		size: "235/35 R19",
		li: 91,
		si: tyre.front.si,
		priceCents: tyre.front.priceCents + 2e3
	};
	const rear = tyre.rear === null ? null : {
		size: "265/30 R19",
		li: 93,
		si: tyre.rear.si,
		priceCents: tyre.rear.priceCents + 2e3
	};
	return {
		...tyre,
		front,
		rear,
		setCents: front.priceCents + front.priceCents + front.priceCents + front.priceCents,
		mixedSetCents: rear === null ? null : front.priceCents + front.priceCents + rear.priceCents + rear.priceCents
	};
}
/** The sizes a version takes, for the mode tiles: the same front and rear, and the pair the paper allows. */
function sizesOf(diameter) {
	return diameter === 19 ? {
		front: "235/35 R19",
		rear: "265/30 R19",
		li: 91
	} : {
		front: "225/40 R18",
		rear: "255/35 R18",
		li: 92
	};
}
/** The price of four tyres: four alike, or two front and two rear. */
function setPrice(tyre, mode) {
	return mode === "mixed" && tyre.mixedSetCents !== null ? tyre.mixedSetCents : tyre.setCents;
}
function inBand(cents, band) {
	switch (band) {
		case "bis500": return cents <= 5e4;
		case "500bis600": return cents > 5e4 && cents <= 6e4;
		case "ueber600": return cents > 6e4;
		default: return true;
	}
}
function filterTyres(tyres, filter) {
	return tyres.filter((tyre) => (filter.mode === "same" || tyre.rear !== null) && (filter.seasons.length === 0 || filter.seasons.includes(tyre.season)) && (filter.brands.length === 0 || filter.brands.includes(tyre.brand)) && inBand(setPrice(tyre, filter.mode), filter.price)).sort((a, b) => {
		if (filter.sort === "marke") return a.brand.localeCompare(b.brand, "de") || a.model.localeCompare(b.model, "de");
		const diff = setPrice(a, filter.mode) - setPrice(b, filter.mode);
		return filter.sort === "preis-ab" ? -diff : diff;
	});
}
/** What the extras step starts at: the free colour of weights, and the RDKS question unanswered — never a paid extra. */
function initialExtras() {
	return {
		weights: WEIGHTS[0]?.id ?? "",
		rdks: null
	};
}
/** The Komplettrad as its lines: rims, tyres, mounting, the weights' colour, and RDKS sensors only where asked for. */
function basketLines(version, tyre, mode, weights, rdks) {
	const tyreDetail = mode === "mixed" && tyre.rear !== null ? `2 × vorne ${tyre.front.size} ${tyre.front.li}${tyre.front.si} · 2 × hinten ${tyre.rear.size} ${tyre.rear.li}${tyre.rear.si}` : `4 × ${tyre.front.size} ${tyre.front.li}${tyre.front.si}`;
	const colour = WEIGHTS.find((w) => w.id === weights) ?? WEIGHTS[0];
	const lines = [
		{
			label: "4 Felgen",
			detail: versionShort(version),
			cents: version.setCents
		},
		{
			label: `4 Reifen ${tyre.brand} ${tyre.model}`,
			detail: tyreDetail,
			cents: setPrice(tyre, mode)
		},
		{
			label: "Montage und Wuchten",
			detail: "4 Räder, fertig montiert",
			cents: MOUNTING_SET_CENTS
		}
	];
	if (colour !== void 0) lines.push({
		label: `Wuchtgewichte ${colour.name}`,
		detail: colour.setCents === 0 ? "ohne Aufpreis" : "für 4 Räder",
		cents: colour.setCents
	});
	if (rdks === "ja") lines.push({
		label: "RDKS-Sensoren",
		detail: "4 Sensoren, gleich mit eingesetzt",
		cents: RDKS.setCents
	});
	return lines;
}
function total(lines) {
	return lines.reduce((sum, line) => sum + line.cents, 0);
}
//#endregion
export { initialExtras as a, total as c, fitFor as i, basketLines as n, setPrice as o, filterTyres as r, sizesOf as s, PRICE_BANDS as t };
