import { c as contactHref, y as useVehicleChangeHref } from "./useShopFeedback-kI2ariWw.js";
import { a as link_default, d as vue_exports, s as usePage } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as Icon_default } from "./Icon-D4PPT3t7.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as formatMoney } from "./num-Br8qlecZ.js";
import { t as ConditionGroups_default } from "./ConditionGroups-BO9ZVcYo.js";
import { t as Icon_default$1 } from "./Icon-BdoCBs5a.js";
import { i as entryBySize, n as ENTRY_REQUIRED, o as entryLineOrNone, s as papersLine, t as ABNAHME_REQUIRED } from "./papers-B4aUsj_q.js";
import { t as ValueText_default } from "./ValueText-YEd3Pu5w.js";
import { n as BuildForm_default, t as PapersForm_default } from "./PapersForm-WBL1l4g5.js";
//#region resources/js/Components/Product/setNames.ts
var same = (a, b) => (a ?? "").trim().toLocaleLowerCase("de-DE") === (b ?? "").trim().toLocaleLowerCase("de-DE");
function setNames(set) {
	const rearBrand = set.rearBrandName ?? set.brandName;
	const rearLine = set.rearName ?? set.name;
	if (same(set.brandName, rearBrand) && same(set.name, rearLine)) return {
		brands: [set.brandName],
		line: set.name,
		front: null,
		rear: null
	};
	if (same(set.brandName, rearBrand)) return {
		brands: [set.brandName],
		line: null,
		front: set.name,
		rear: rearLine
	};
	return {
		brands: [set.brandName, rearBrand],
		line: null,
		front: `${set.brandName} ${set.name}`,
		rear: `${rearBrand} ${rearLine}`
	};
}
//#endregion
//#region resources/js/Pages/Komplettrad/komplettradFlow.ts
var TYRE_CLASSES = [
	"A",
	"B",
	"C",
	"D",
	"E"
];
var NOISE_CLASSES = [
	"A",
	"B",
	"C"
];
function oneSize(size) {
	return size.replace(/ /g, "\xA0");
}
function euFrom(label, title) {
	if (!label || !label.fuel || !label.wetGrip || !TYRE_CLASSES.includes(label.fuel) || !TYRE_CLASSES.includes(label.wetGrip) || label.noiseDb === null || !label.noiseClass || !NOISE_CLASSES.includes(label.noiseClass)) return null;
	return {
		fuel: label.fuel,
		wet: label.wetGrip,
		noiseDb: label.noiseDb,
		noiseClass: label.noiseClass,
		snowGrip: label.snowGrip,
		iceGrip: label.iceGrip,
		eprelId: label.eprelId,
		title
	};
}
function tyreCard(tyre, photos) {
	return {
		key: `t${tyre.id}`,
		mode: "same",
		frontTyreId: tyre.id,
		rearTyreId: null,
		brands: [tyre.brandName],
		name: tyre.name,
		season: tyre.season,
		seasonLabel: tyre.seasonLabel,
		sides: [{
			axle: null,
			line: null,
			size: tyre.sizeLabel,
			facts: tyre.facts ?? "",
			eu: euFrom(tyre.label, `${tyre.brandName} ${tyre.name} · ${oneSize(tyre.sizeLabel)}`)
		}],
		setCents: tyre.tyreSetCents ?? 0,
		set: tyre.tyreSet ?? "",
		each: `${tyre.tyrePrice} je Reifen`,
		unit: "für 4 Reifen",
		perWheel: tyre.perWheel,
		forFourCents: tyre.forFourCents,
		forFour: tyre.forFour,
		prices: tyre.prices ?? [],
		photos: photos[String(tyre.id)] ?? [],
		answer: tyre.answer ?? null,
		isDemo: tyre.isDemo
	};
}
function setCard(set, pair, photos) {
	const names = setNames(set);
	const one = set.frontTyreId === set.rearTyreId;
	const rearBrand = set.rearBrandName ?? set.brandName;
	const rearName = set.rearName ?? set.name;
	const sides = set.frontLabel === set.rearLabel && one ? [{
		axle: "vorne und hinten",
		line: null,
		size: set.frontLabel,
		facts: set.frontFacts ?? "",
		eu: euFrom(set.frontEu, `${set.brandName} ${set.name} · ${oneSize(set.frontLabel)}`)
	}] : [{
		axle: "vorne",
		line: names.front,
		size: set.frontLabel,
		facts: set.frontFacts ?? "",
		eu: euFrom(set.frontEu, `${set.brandName} ${set.name} · ${oneSize(set.frontLabel)}`)
	}, {
		axle: "hinten",
		line: names.rear,
		size: set.rearLabel,
		facts: set.rearFacts ?? "",
		eu: euFrom(one ? set.frontEu : set.rearEu, `${rearBrand} ${rearName} · ${oneSize(set.rearLabel)}`)
	}];
	return {
		key: `${pair.key}:${set.key}`,
		mode: "mixed",
		frontTyreId: set.frontTyreId,
		rearTyreId: set.rearTyreId,
		brands: names.brands,
		name: names.line,
		season: set.season ?? "",
		seasonLabel: set.seasonLabel,
		sides,
		setCents: set.tyreSetCents ?? 0,
		set: set.tyreSet ?? "",
		each: set.frontTyrePrice === set.rearTyrePrice ? `${set.frontTyrePrice} je Reifen` : `vorne ${set.frontTyrePrice}, hinten ${set.rearTyrePrice} je Reifen`,
		unit: "für 2 vorne und 2 hinten",
		perWheel: null,
		forFourCents: set.forFourCents,
		forFour: set.forFour,
		prices: (set.prices ?? []).map((p) => ({
			colourId: p.colourId,
			forFourCents: p.forFourCents,
			forFour: p.forFour
		})),
		photos: photos[String(set.frontTyreId)] ?? [],
		answer: pair.answer ?? null,
		isDemo: set.isDemo
	};
}
function pairView(pair, photos) {
	return {
		key: pair.key,
		number: pair.number,
		front: pair.front,
		rear: pair.rear,
		sameSize: pair.sameSize === true,
		minSentence: pair.minSentence,
		noSet: pair.noSet ?? null,
		answer: pair.answer ?? null,
		cards: pair.sets.map((set) => setCard(set, pair, photos))
	};
}
var NO_TYRES = "Passende Reifen für diese Größe können wir dir gerade nicht anbieten. Die Felge allein kannst du bestellen.";
/** What the server offers for one version, as one kind of card. */
function offerOf(config, photos) {
	const offer = config.komplettrad;
	const mixed = config.mischbereifung ?? null;
	const listed = (offer?.combinations?.length ?? 0) > 0;
	const pairs = (listed ? offer?.combinations ?? [] : mixed?.pairs ?? []).map((pair) => pairView(pair, photos));
	const same = (offer?.tyres ?? []).map((tyre) => tyreCard(tyre, photos));
	const none = same.length === 0 && pairs.every((pair) => pair.cards.length === 0);
	return {
		refusal: none ? pairs.length > 0 ? pairs[0]?.noSet ?? NO_TYRES : offer?.refusal ?? mixed?.refusal ?? NO_TYRES : null,
		refusalCode: none ? pairs.length > 0 ? "NO_TYRE_AVAILABLE" : offer?.refusalCode ?? null : null,
		minSentence: offer?.minSentence ?? null,
		same,
		pairs,
		listed,
		mixedRefusal: mixed?.refusal ?? null,
		rules: mixed?.rules ?? null,
		rulesPage: (mixed?.rulesPage === void 0 ? mixed?.sourcePage : mixed.rulesPage) ?? null,
		sourcePage: offer?.sourcePage ?? mixed?.sourcePage ?? null,
		priceOpen: offer?.priceOpen === true || mixed?.priceOpen === true,
		quantity: offer?.quantity ?? 4,
		perAxle: offer?.perAxle ?? mixed?.perAxle ?? 2
	};
}
/**
* What the product page and the RIMIFY-Check say of a version's Komplettrad before its steps: whether there is one, why not, and from
* what price — the server's lowest figure, per wheel, or the lowest 2 + 2 where only pairs stand.
*/
function setSummary(config) {
	if (config === null) return {
		ready: false,
		refusal: null,
		refusalCode: null,
		from: null,
		fromUnit: "pro Rad",
		priceOpen: false
	};
	const offer = offerOf(config, {});
	const lowest = (cards) => cards.reduce((low, card) => low === null || card.forFourCents < low.forFourCents ? card : low, null);
	const same = lowest(offer.same);
	const pair = lowest(offer.pairs.flatMap((item) => item.cards));
	return {
		ready: offer.refusal === null,
		refusal: offer.refusal,
		refusalCode: offer.refusalCode,
		from: same?.perWheel ?? pair?.forFour ?? null,
		fromUnit: same !== null ? "pro Rad" : "für 2 + 2",
		priceOpen: offer.priceOpen
	};
}
function filterCards(cards, filter, bands) {
	const band = bands.find((b) => b.value === filter.band) ?? null;
	return cards.filter((card) => (filter.seasons.length === 0 || filter.seasons.includes(card.season)) && (filter.brands.length === 0 || card.brands.some((brand) => filter.brands.includes(brand))) && (band === null || (band.from === null || card.setCents > band.from) && (band.to === null || card.setCents <= band.to)));
}
function sortCards(cards, sort) {
	return [...cards].sort((a, b) => {
		if (sort === "marke") return (a.brands[0] ?? "").localeCompare(b.brands[0] ?? "", "de") || (a.name ?? "").localeCompare(b.name ?? "", "de") || a.setCents - b.setCents;
		return sort === "preis-ab" ? b.setCents - a.setCents : a.setCents - b.setCents;
	});
}
function roundedDown(cents) {
	return cents - cents % 5e3;
}
/**
* Up to three price ranges for the tyres on the page, cut at their thirds and rounded. None where a choice would say nothing: three
* tyres or fewer, or ranges of one price. Never a range nothing falls in.
*/
function priceBands(cards) {
	const prices = [...cards.map((card) => card.setCents)].sort((a, b) => a - b);
	if (prices.length < 4) return [];
	const low = roundedDown(prices[Math.floor(prices.length / 3)] ?? 0);
	const high = roundedDown(prices[Math.floor(prices.length * 2 / 3)] ?? 0);
	const within = (from, to) => prices.some((p) => (from === null || p > from) && (to === null || p <= to));
	const bands = [];
	if (low > 0 && within(null, low)) bands.push({
		value: `bis-${low}`,
		label: `bis ${formatMoney(low, true)}`,
		from: null,
		to: low
	});
	if (high > low && within(low, high)) bands.push({
		value: `${low}-${high}`,
		label: `${formatMoney(low, true)} bis ${formatMoney(high, true)}`,
		from: low,
		to: high
	});
	const top = high > low ? high : low;
	if (top > 0 && within(top, null)) bands.push({
		value: `ueber-${top}`,
		label: `über ${formatMoney(top, true)}`,
		from: top,
		to: null
	});
	return bands.length > 1 ? bands : [];
}
/** The extras start empty: nothing chosen for the customer (§ 312a Abs. 3 BGB, D-355), and the sensors asked, never assumed. */
function initialExtras() {
	return {
		colourId: null,
		rdks: null
	};
}
/** The colour the server puts in where none is chosen: the standard one, if it costs nothing (Basket::freeStandardColour, D-355). */
function freeStandardColour(colours) {
	const standard = colours.find((colour) => colour.isDefault) ?? colours[0] ?? null;
	return standard?.surchargeCents === 0 ? standard : null;
}
/**
* What „Weiter: Warenkorb“ still waits for, in a sentence, or null: the answer on the sensors (the client's change of 05.11.2026), and
* the weights' colour where none comes free, which the basket would refuse only after the customer got there.
*/
function extrasHint(tpms, rdks, colours = [], colourId = null) {
	const sensors = tpms !== null && tpms !== void 0 && rdks === null;
	const colour = colours.length > 0 && colourId === null && freeStandardColour(colours) === null;
	if (sensors && colour) return "Wähl zuerst eine Farbe für die Wuchtgewichte und sag uns, ob du RDKS-Sensoren brauchst.";
	if (colour) return "Wähl zuerst eine Farbe für die Wuchtgewichte.";
	return sensors ? "Sag uns zuerst, ob du RDKS-Sensoren brauchst." : null;
}
function priceWith(card, colourId) {
	return card.prices.find((p) => p.colourId === colourId) ?? {
		forFourCents: card.forFourCents,
		forFour: card.forFour
	};
}
/**
* The Komplettrad as its lines: rims, tyres, mounting, the weights' colour, the sensors where asked for. The server's figures, each its
* own; the sum is the set's own figure with the colour chosen, plus the sensors.
*/
function flowSum(config, card, mounting, colour, tpms, rdks, wheelsInBasket = 0) {
	const tyres = card.sides.map((side) => side.axle === null ? `4 × ${side.size}` : side.axle === "vorne und hinten" ? `2 + 2 × ${side.size}` : `${side.axle === "vorne" ? "Vorne" : "Hinten"} 2 × ${side.size}`).join(" · ");
	const lines = [
		{
			label: "4 Felgen",
			detail: config.fullLabel,
			price: config.priceForFour ?? ""
		},
		{
			label: `4 Reifen ${[card.brands.join(" · "), card.name].filter(Boolean).join(" ")}`,
			detail: tyres,
			price: card.set
		},
		{
			label: "Montage und Auswuchten",
			detail: mounting === null ? "Der Preis dafür steht noch nicht fest." : `4 Räder, je ${mounting.each}`,
			price: mounting?.total ?? "–"
		}
	];
	if (colour !== null) lines.push({
		label: `Wuchtgewichte ${colour.name}`,
		detail: colour.surchargeCents === 0 ? "für 4 Räder" : `für 4 Räder, je ${colour.surcharge}`,
		price: colour.surchargeCents === 0 ? "ohne Aufpreis" : colour.surchargeForFour ?? colour.surcharge
	});
	const sensors = rdks === "ja" && tpms?.available === true;
	if (sensors) lines.push({
		label: "RDKS-Sensoren",
		detail: `${tpms.line ?? ""}, ${wheelsInBasket > 0 ? "für alle Räder im Warenkorb" : "gleich mit eingesetzt"}`,
		price: tpms.yesTotal ?? ""
	});
	if (rdks === "nein") lines.push({
		label: "RDKS-Sensoren",
		detail: "Ohne Sensoren",
		price: "–"
	});
	return {
		lines,
		totalCents: priceWith(card, colour?.id ?? null).forFourCents + (sensors ? tpms.yesTotalCents ?? 0 : 0),
		open: mounting === null
	};
}
//#endregion
//#region resources/js/Components/Product/FitmentDetail.vue?vue&type=script&setup=true&lang.ts
var FitmentDetail_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "FitmentDetail",
	__ssrInlineRender: true,
	props: {
		detail: {},
		vehicleLabel: {},
		omit: { default: () => [] }
	},
	setup(__props) {
		/**
		* What the Gutachten asks of the chosen car, in full (Block D, item 15), in the order the Borbet brief §5 sets:
		* Abnahme, Arbeiten am Fahrzeug with the millimetres its document prints for this Fahrzeugtyp, Befestigung with
		* the bolt sets and their torque, Reifen with each size's axle, band and printed minimum — and beside them the
		* notes. Every sentence is the answer's documents' own.
		*
		* Full width below the purchase, on the page's own split: what the customer has to do on the left, what they
		* should know on the right. A Nachtrag gives one car forty sentences; the check panel keeps the overview and the
		* buy button where they are, and links here.
		*/
		const props = __props;
		const TODO = [
			"Abnahme",
			"Arbeiten am Fahrzeug",
			"Befestigung",
			"Reifen"
		];
		const todo = (0, vue_exports.computed)(() => TODO.map((title) => ({
			title,
			groups: grouped(props.detail.sections.find((s) => s.title === title)?.items ?? [])
		})).filter((section) => section.groups.length > 0 || section.title === "Befestigung" && props.detail.fasteners.length > 0 || section.title === "Reifen" && props.detail.tyres.length > 0));
		const notes = (0, vue_exports.computed)(() => grouped(props.detail.sections.find((s) => s.title === "Hinweise")?.items ?? []));
		function forSizes(sizes) {
			if (!sizes?.length) return null;
			return `Nur bei ${sizes.length === 1 ? sizes[0] : `${sizes.slice(0, -1).join(", ")} und ${sizes[sizes.length - 1]}`}`;
		}
		function grouped(listed) {
			const items = listed.filter((i) => !props.omit.includes(i.text));
			const all = items.filter((i) => !i.sizes?.length && !i.own);
			const own = items.filter((i) => !i.sizes?.length && i.own);
			const bySizes = /* @__PURE__ */ new Map();
			for (const item of items.filter((i) => i.sizes?.length)) {
				const label = forSizes(item.sizes) ?? "";
				bySizes.set(label, [...bySizes.get(label) ?? [], item]);
			}
			return [
				...all.length ? [{
					key: "all",
					label: bySizes.size > 0 ? "Für jede zulässige Reifengröße" : null,
					items: all
				}] : [],
				...own.length ? [{
					key: "own",
					label: null,
					items: own
				}] : [],
				...[...bySizes.entries()].map(([label, list]) => ({
					key: label,
					label,
					items: list
				}))
			];
		}
		const hasOwn = (0, vue_exports.computed)(() => props.detail.sections.some((s) => s.items.some((i) => i.own)));
		const namesNachtrag = (0, vue_exports.computed)(() => props.detail.fasteners.some((f) => /Nachtrag/.test(f.limit ?? "")));
		const original = (0, vue_exports.computed)(() => props.detail.original ?? []);
		const originalGroups = (0, vue_exports.computed)(() => {
			const all = original.value.filter((i) => !i.sizes?.length);
			const bySizes = /* @__PURE__ */ new Map();
			for (const item of original.value.filter((i) => i.sizes?.length)) {
				const label = forSizes(item.sizes) ?? "";
				bySizes.set(label, [...bySizes.get(label) ?? [], item]);
			}
			return [...all.length ? [{
				key: "all",
				label: bySizes.size > 0 ? "Für jede zulässige Reifengröße" : null,
				items: all
			}] : [], ...[...bySizes.entries()].map(([label, items]) => ({
				key: label,
				label,
				items
			}))];
		});
		const originalBySize = (0, vue_exports.computed)(() => originalGroups.value.some((group) => group.label !== null));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				id: "auflagen",
				class: "fdt",
				"aria-labelledby": "fdt-h"
			}, _attrs))} data-v-1a581694><h2 id="fdt-h" class="h2 fdt__h" tabindex="-1" data-v-1a581694>Was das Gutachten für ${(0, server_renderer_exports.ssrInterpolate)(__props.vehicleLabel)} verlangt</h2><p class="small muted fdt__lede" data-v-1a581694> Der Wortlaut des Gutachtens, wie er bei uns hinterlegt ist.`);
			if (hasOwn.value) _push(`<!--[--> Was mit „Unser Hinweis“ beginnt, kommt von uns.<!--]-->`);
			else _push(`<!---->`);
			_push(`</p><div class="fdt__cols" data-v-1a581694><div class="fdt__main" data-v-1a581694><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(todo.value, (section) => {
				_push(`<div class="fdt__sec" data-v-1a581694><h3 class="h4 fdt__sec-h" data-v-1a581694>${(0, server_renderer_exports.ssrInterpolate)(section.title)}</h3><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(section.groups, (group) => {
					_push(`<!--[-->`);
					if (group.label) _push(`<p class="fdt__for" data-v-1a581694>${(0, server_renderer_exports.ssrInterpolate)(group.label)}</p>`);
					else _push(`<!---->`);
					_push(`<ul class="fdt__list" data-v-1a581694><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(group.items, (item) => {
						_push(`<li data-v-1a581694>`);
						if (item.own) _push(`<span class="fdt__own" data-v-1a581694>Unser Hinweis: </span>`);
						else _push(`<!---->`);
						_push(`${(0, server_renderer_exports.ssrInterpolate)(item.text)} `);
						if (item.measures.length) {
							_push(`<ul class="fdt__measures" data-v-1a581694><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(item.measures, (measure) => {
								_push(`<li data-v-1a581694>${(0, server_renderer_exports.ssrInterpolate)(measure)}</li>`);
							});
							_push(`<!--]--></ul>`);
						} else _push(`<!---->`);
						_push(`</li>`);
					});
					_push(`<!--]--></ul><!--]-->`);
				});
				_push(`<!--]-->`);
				if (section.title === "Befestigung" && __props.detail.fasteners.length) {
					_push(`<table class="fdt__table" data-v-1a581694><thead data-v-1a581694><tr data-v-1a581694><th scope="col" data-v-1a581694>Schraube</th><th scope="col" data-v-1a581694>Anzugsmoment</th><th scope="col" data-v-1a581694>Artikel</th><th scope="col" data-v-1a581694>Gilt</th></tr></thead><tbody data-v-1a581694><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.detail.fasteners, (bolt) => {
						_push(`<tr data-v-1a581694><td data-label="Schraube" class="fdt__key" data-v-1a581694>`);
						if (bolt.number) _push(`<!--[-->Nr. ${(0, server_renderer_exports.ssrInterpolate)(bolt.number)} · <!--]-->`);
						else _push(`<!---->`);
						_push(`${(0, server_renderer_exports.ssrInterpolate)(bolt.label)}</td><td data-label="Anzugsmoment" class="fdt__num" data-v-1a581694>${(0, server_renderer_exports.ssrInterpolate)(bolt.torque ?? "–")}</td><td data-label="Artikel" data-v-1a581694>${(0, server_renderer_exports.ssrInterpolate)(bolt.article ?? "–")}</td><td data-label="Gilt" data-v-1a581694>${(0, server_renderer_exports.ssrInterpolate)(bolt.limit ?? "für diesen Typ")}</td></tr>`);
					});
					_push(`<!--]--></tbody></table>`);
				} else _push(`<!---->`);
				if (section.title === "Befestigung" && namesNachtrag.value) _push(`<p class="small muted fdt__aside" data-v-1a581694> „Nachtrag“ meint hier den Stand der EG-Typgenehmigung deines Fahrzeugs, nicht den des Gutachtens. Er steht in Feld K der Zulassungsbescheinigung Teil I: die Ziffern nach dem letzten Sternchen, bei …*04 also „04“. </p>`);
				else _push(`<!---->`);
				if (section.title === "Reifen" && __props.detail.tyres.length) {
					_push(`<table class="fdt__table" data-v-1a581694><thead data-v-1a581694><tr data-v-1a581694><th scope="col" data-v-1a581694>Größe</th><th scope="col" data-v-1a581694>Achse</th><th scope="col" data-v-1a581694>Motorleistung</th><th scope="col" data-v-1a581694>Mindestens laut Gutachten</th></tr></thead><tbody data-v-1a581694><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.detail.tyres, (size) => {
						_push(`<tr data-v-1a581694><td data-label="Größe" class="fdt__key fdt__num" data-v-1a581694>${(0, server_renderer_exports.ssrInterpolate)(size.label)}</td><td data-label="Achse" data-v-1a581694>${(0, server_renderer_exports.ssrInterpolate)(size.axle)}</td><td data-label="Motorleistung" class="fdt__num" data-v-1a581694>${(0, server_renderer_exports.ssrInterpolate)(size.band ?? "–")}</td><td data-label="Mindestens laut Gutachten" data-v-1a581694>${(0, server_renderer_exports.ssrInterpolate)(size.minimum ?? "–")}</td></tr>`);
					});
					_push(`<!--]--></tbody></table>`);
				} else _push(`<!---->`);
				_push(`</div>`);
			});
			_push(`<!--]--></div>`);
			if (notes.value.length || __props.detail.notices.length) {
				_push(`<div class="fdt__side" data-v-1a581694>`);
				if (notes.value.length) {
					_push(`<div class="fdt__sec" data-v-1a581694><h3 class="h4 fdt__sec-h" data-v-1a581694>Hinweise</h3><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(notes.value, (group) => {
						_push(`<!--[-->`);
						if (group.label) _push(`<p class="fdt__for" data-v-1a581694>${(0, server_renderer_exports.ssrInterpolate)(group.label)}</p>`);
						else _push(`<!---->`);
						_push(`<ul class="fdt__list fdt__list--note" data-v-1a581694><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(group.items, (item) => {
							_push(`<li data-v-1a581694>`);
							if (item.own) _push(`<span class="fdt__own" data-v-1a581694>Unser Hinweis: </span>`);
							else _push(`<!---->`);
							_push(`${(0, server_renderer_exports.ssrInterpolate)(item.text)}</li>`);
						});
						_push(`<!--]--></ul><!--]-->`);
					});
					_push(`<!--]--></div>`);
				} else _push(`<!---->`);
				if (__props.detail.notices.length) {
					_push(`<div class="fdt__sec" data-v-1a581694><h3 class="h4 fdt__sec-h" data-v-1a581694>Hinweise des Gutachtens</h3><ul class="fdt__list fdt__list--note" data-v-1a581694><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.detail.notices, (notice) => {
						_push(`<li data-v-1a581694>${(0, server_renderer_exports.ssrInterpolate)(notice)}</li>`);
					});
					_push(`<!--]--></ul></div>`);
				} else _push(`<!---->`);
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`</div>`);
			if (original.value.length) {
				_push(`<details class="fdt__original" data-original data-v-1a581694><summary class="fdt__original-toggle" data-v-1a581694>Originaltext anzeigen</summary><p class="small muted fdt__original-lede" data-v-1a581694> Der bei uns hinterlegte Wortlaut des Gutachtens, ohne unsere Gliederung.`);
				if (originalBySize.value) _push(`<!--[--> Gilt ein Satz nur für bestimmte Reifengrößen, stehen diese Größen direkt darüber.<!--]-->`);
				else _push(`<!---->`);
				_push(`</p><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(originalGroups.value, (group) => {
					_push(`<!--[-->`);
					if (group.label) _push(`<p class="fdt__for" data-v-1a581694>${(0, server_renderer_exports.ssrInterpolate)(group.label)}</p>`);
					else _push(`<!---->`);
					_push(`<ul class="fdt__list fdt__list--note" data-v-1a581694><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(group.items, (item) => {
						_push(`<li data-v-1a581694>${(0, server_renderer_exports.ssrInterpolate)(item.text)}`);
						if (item.page) _push(`<span class="fdt__page" data-v-1a581694> (Seite ${(0, server_renderer_exports.ssrInterpolate)(item.page)})</span>`);
						else _push(`<!---->`);
						_push(`</li>`);
					});
					_push(`<!--]--></ul><!--]-->`);
				});
				_push(`<!--]--></details>`);
			} else _push(`<!---->`);
			_push(`</section>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/FitmentDetail.vue
var _sfc_setup$2 = FitmentDetail_vue_vue_type_script_setup_true_lang_default.setup;
FitmentDetail_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/FitmentDetail.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var FitmentDetail_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FitmentDetail_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-1a581694"]]);
//#endregion
//#region resources/js/composables/useConfigurator.ts
/**
* The product configurator.
*
* Two rules, and both are the difference between a shop and a compliance tool:
*
* 1. Configuration NARROWS, it never rejects. A size that exists but is not permitted on the
*    chosen car is shown, disabled, with the reason — hiding it would let the customer believe the
*    wheel is not made in that size, which is a different and false statement.
*
* 2. Price, stock and verdict change in ONE commit. They come from the same config object, so
*    there is no frame in which the page shows a new price beside an old legal answer. That frame
*    is short, and it is exactly the kind of thing that ends up in a screenshot.
*
* A diameter can hold several configurations — 8J ET45 and 8,5J ET40 are both "18 Zoll" — and
* they can carry different verdicts. So a diameter is struck through only when NONE of its
* configurations is permitted: striking 18" because its first row is not permitted, while another
* 18" row is, tells the customer something false about their car. The width/ET options inside the
* chosen diameter are offered separately (`variants`), so every permitted configuration is
* reachable: each is one version of the rim, chosen on its own (the Gutachten rework §8), `versions`
* those the car may have and `others` the rest — never a swap, and never hidden for good.
*
* Where a paper names two versions for the car, one on each axle (the client's fourth change), they are one thing to buy: a set,
* `setsHere` under each diameter it holds. Such a version has no chip of its own and is never four. `selected` stays the version in
* view, as the diameter chips show it; `selectedSet` is what is bought.
*/
/**
* The wheel half approved, the tyre half without an answer: unverified, which is neither forbidden nor unavailable.
* (A verdict that still waits for a fact of the car is „noch offen“, and is asked for in place — not this.)
*/
function tyreUnconfirmed(verdict) {
	return verdict !== null && verdict !== void 0 && verdict.status === "UNKNOWN" && (verdict.wheelStatus === "PERMITTED" || verdict.wheelStatus === "CONDITIONAL") && verdict.tyre?.status === "UNKNOWN" && (verdict.missing ?? []).length === 0;
}
var NOTHING_ON_RECORD = [
	"NO_DOCUMENT",
	"ANNEX_MISSING",
	"COVERAGE_UNCONFIRMED"
];
function standingOf(verdict) {
	if (verdict?.status === "NOT_PERMITTED") return "refused";
	return verdict?.reasonCode && !NOTHING_ON_RECORD.includes(verdict.reasonCode) ? "open" : "none";
}
var FALLBACK_REASON = "Für dein Fahrzeug nicht freigegeben.";
/**
* With no vehicle there is no verdict and no claim: every configuration may be bought. A rim that sells alone while
* its tyres wait for the car's papers (D-289) is a size to buy, not a struck one.
*/
function sellable(config) {
	if (config.onlyInSet === true) return false;
	return config.verdict === null || config.verdict.sellable || config.verdict.rimSellable === true;
}
function answerable(config) {
	return config.onlyInSet !== true && config.verdict !== null && !config.verdict.sellable && config.verdict.status === "UNKNOWN" && (config.verdict.missing ?? []).length > 0;
}
function choosable(config) {
	return sellable(config) || answerable(config);
}
function rank(config) {
	if (config.onlyInSet === true) return 6;
	if (sellable(config)) return config.inStock ? 0 : 1;
	if (tyreUnconfirmed(config.verdict)) return 2;
	if (answerable(config)) return 3;
	return config.verdict?.status === "UNKNOWN" ? 4 : 5;
}
function best(configs) {
	return [...configs].sort((a, b) => rank(a) - rank(b) || a.priceCents - b.priceCents || a.id - b.id)[0] ?? null;
}
function sameVersion(a, b) {
	return a.diameterIn === b.diameterIn && a.widthIn === b.widthIn && a.etMm === b.etMm && a.boltPattern === b.boltPattern && a.centreBore === b.centreBore;
}
function reasonFor(configs) {
	return configs.find((c) => c.verdict?.reason)?.verdict?.reason ?? FALLBACK_REASON;
}
function useConfigurator(configs, firstFinishId, initialConfigId = null, openOn = () => ({}), wheelSets = () => [], initialSetKey = null) {
	const finishId = (0, vue_exports.ref)(firstFinishId);
	const configId = (0, vue_exports.ref)(initialConfigId);
	const setKey = (0, vue_exports.ref)(initialSetKey);
	let wanted = null;
	const colourLacks = (0, vue_exports.ref)(null);
	const forFinish = (0, vue_exports.computed)(() => configs().filter((c) => c.finishId === finishId.value));
	/**
	* The chosen configuration, or the size the server opens this finish on — the rule its card follows too, so the card
	* and the page give one answer (OpeningSize, M-6) —, or, without one, the best default: permitted and in stock,
	* cheapest first — never simply the first row, which on a car with a narrow approval would open the page on a
	* disabled chip and a blocked button.
	*/
	const selected = (0, vue_exports.computed)(() => {
		const explicit = forFinish.value.find((c) => c.id === configId.value);
		const opening = openOn()[String(finishId.value)] ?? null;
		return explicit ?? forFinish.value.find((c) => c.id === opening) ?? best(forFinish.value);
	});
	const setsOfFinish = (0, vue_exports.computed)(() => wheelSets().filter((set) => set.finishId === finishId.value));
	const standsInSet = (config) => setsOfFinish.value.some((set) => set.frontId === config.id || set.rearId === config.id);
	const selectedSet = (0, vue_exports.computed)(() => {
		const chosen = setsOfFinish.value.find((set) => set.key === setKey.value);
		if (chosen !== void 0) return chosen;
		const current = selected.value;
		return current?.onlyInSet === true ? setsOfFinish.value.find((set) => set.frontId === current.id || set.rearId === current.id) ?? null : null;
	});
	const setsHere = (0, vue_exports.computed)(() => {
		const diameter = selected.value?.diameterIn;
		return setsOfFinish.value.filter((set) => diameter !== void 0 && set.diameters.includes(diameter));
	});
	const sizes = (0, vue_exports.computed)(() => {
		const groups = /* @__PURE__ */ new Map();
		for (const config of forFinish.value) groups.set(config.diameterIn, [...groups.get(config.diameterIn) ?? [], config]);
		const current = selected.value;
		return [...groups.entries()].map(([diameter, group]) => {
			const inSet = setsOfFinish.value.some((set) => set.diameters.includes(diameter));
			const unconfirmed = !inSet && !group.some(choosable) && group.some((c) => c.onlyInSet !== true && tyreUnconfirmed(c.verdict));
			const blocked = !inSet && !group.some(choosable) && !unconfirmed;
			const representative = current !== null && group.includes(current) ? current : best(group);
			return {
				diameter,
				label: String(diameter).replace(".", ","),
				config: representative,
				blocked,
				unconfirmed,
				reason: blocked || unconfirmed ? reasonFor(group) : null,
				standings: blocked ? [...new Set(group.map((c) => c.onlyInSet === true ? "axle" : standingOf(c.verdict)))] : []
			};
		}).sort((a, b) => a.diameter - b.diameter);
	});
	const variants = (0, vue_exports.computed)(() => {
		const current = selected.value;
		if (current === null) return [];
		const row = forFinish.value.filter((c) => c.diameterIn === current.diameterIn && !(c.onlyInSet === true && standsInSet(c)));
		return [...row].sort((a, b) => a.widthIn - b.widthIn || a.etMm - b.etMm || a.versionLabel.localeCompare(b.versionLabel, "de", { numeric: true })).map((config) => {
			const unconfirmed = config.onlyInSet !== true && !choosable(config) && tyreUnconfirmed(config.verdict);
			const blocked = !choosable(config) && !unconfirmed;
			const twin = row.some((other) => other.id !== config.id && other.versionLabel === config.versionLabel);
			return {
				id: config.id,
				label: twin ? `${config.versionLabel} · Mittenloch\u00A0${config.centreBore}` : config.versionLabel,
				config,
				blocked,
				standing: blocked ? config.onlyInSet === true ? "axle" : standingOf(config.verdict) : null,
				unconfirmed,
				reason: blocked || unconfirmed ? reasonFor([config]) : null
			};
		});
	});
	const versions = (0, vue_exports.computed)(() => variants.value.filter((v) => !v.blocked));
	const others = (0, vue_exports.computed)(() => variants.value.filter((v) => v.blocked));
	const fromPrice = (0, vue_exports.computed)(() => {
		return [...forFinish.value].sort((a, b) => a.priceCents - b.priceCents)[0]?.price ?? null;
	});
	/**
	* Another colour keeps the person's version: all of it, whatever this colour's answer for the car — struck there, it stays
	* and says so, never a swap in silence (the rework §8). Where the colour does not make it, the page says so and shows the
	* nearest of that diameter or the colour's opening size; on the way back the person's version is there again. Pressing
	* the colour already on changes nothing.
	*/
	function selectFinish(id) {
		if (id === finishId.value) return;
		wanted ??= selected.value;
		const setBefore = selectedSet.value;
		const versionOf = (id) => configs().find((c) => c.id === id);
		finishId.value = id;
		configId.value = null;
		colourLacks.value = null;
		setKey.value = null;
		if (setBefore !== null) {
			const front = versionOf(setBefore.frontId);
			const rear = versionOf(setBefore.rearId);
			const same = setsOfFinish.value.find((set) => {
				const f = versionOf(set.frontId);
				const r = versionOf(set.rearId);
				return f !== void 0 && r !== void 0 && front !== void 0 && rear !== void 0 && sameVersion(f, front) && sameVersion(r, rear);
			});
			setKey.value = same?.key ?? null;
		}
		const version = wanted;
		if (version === null) return;
		const same = forFinish.value.find((c) => sameVersion(c, version));
		if (same !== void 0) {
			configId.value = same.id;
			return;
		}
		const nearest = best(forFinish.value.filter((c) => c.diameterIn === version.diameterIn && (choosable(c) || tyreUnconfirmed(c.verdict))));
		colourLacks.value = version;
		configId.value = nearest?.id ?? null;
	}
	function choose(chosen) {
		wanted = chosen;
		colourLacks.value = null;
		configId.value = chosen.id;
		setKey.value = null;
	}
	function selectSize(option) {
		if (option.blocked) return;
		if (option.config.onlyInSet !== true) {
			choose(option.config);
			return;
		}
		const current = selectedSet.value;
		const set = current !== null && current.diameters.includes(option.diameter) ? current : setsOfFinish.value.find((item) => item.diameters.includes(option.diameter));
		wanted = option.config;
		colourLacks.value = null;
		configId.value = option.config.id;
		setKey.value = set?.key ?? null;
	}
	function selectSet(option) {
		const current = selected.value;
		const inView = current !== null && (current.id === option.frontId || current.id === option.rearId) ? current : configs().find((c) => c.id === (current?.diameterIn === option.diameters[1] ? option.rearId : option.frontId));
		colourLacks.value = null;
		wanted = inView ?? wanted;
		configId.value = inView?.id ?? option.frontId;
		setKey.value = option.key;
	}
	function selectVariant(option) {
		if (!option.blocked) choose(option.config);
	}
	return {
		finishId,
		configId,
		selected,
		sizes,
		variants,
		versions,
		others,
		selectedSet,
		setsHere,
		setKey,
		fromPrice,
		colourLacks,
		selectFinish,
		selectSize,
		selectVariant,
		selectSet
	};
}
//#endregion
//#region resources/js/Components/Product/FitmentPanel.vue?vue&type=script&setup=true&lang.ts
var FitmentPanel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "FitmentPanel",
	__ssrInlineRender: true,
	props: {
		verdict: {},
		vehicle: {},
		configId: { default: null },
		issueLabel: { default: "RIMIFY-Check drucken oder teilen" },
		chosen: { default: null },
		tyreSummary: { default: null },
		askHref: { default: null }
	},
	setup(__props) {
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
		const props = __props;
		const chosenSize = (0, vue_exports.computed)(() => props.chosen?.chosen ?? null);
		const setView = (0, vue_exports.computed)(() => props.chosen?.perAxle === true && props.chosen.chosen === null ? props.chosen : null);
		const chosenSizes = (0, vue_exports.computed)(() => chosenSize.value !== null ? [chosenSize.value] : setView.value ? setView.value.sizes.map((s) => s.size) : null);
		const issuing = (0, vue_exports.ref)(false);
		const notesOnly = (0, vue_exports.computed)(() => props.vehicle !== null && props.verdict?.status === "CONDITIONAL" && props.verdict.notesOnly === true);
		const tone = (0, vue_exports.computed)(() => {
			if (props.vehicle === null || props.verdict === null) return {
				cls: "rcheck-panel--unknown",
				icon: "info"
			};
			if (notesOnly.value) return {
				cls: "",
				icon: "check-circle"
			};
			switch (props.verdict.status) {
				case "PERMITTED": return {
					cls: "",
					icon: "check-circle"
				};
				case "CONDITIONAL": return props.verdict.hint === "green" ? {
					cls: "",
					icon: "info"
				} : {
					cls: "rcheck-panel--warn",
					icon: "warning"
				};
				case "NOT_PERMITTED": return {
					cls: "rcheck-panel--danger",
					icon: "close"
				};
				default: return {
					cls: "rcheck-panel--unknown",
					icon: "info"
				};
			}
		});
		const tyreOpen = (0, vue_exports.computed)(() => tyreUnconfirmed(props.verdict));
		const owed = (0, vue_exports.computed)(() => tyreOpen.value ? props.verdict?.tyre?.owed ?? [] : []);
		const entryLine = (0, vue_exports.computed)(() => {
			const verdict = props.verdict;
			if (verdict === null || verdict.status !== "PERMITTED" && verdict.status !== "CONDITIONAL" && !tyreOpen.value) return null;
			if (chosenSize.value !== null || setView.value !== null) return entryLineOrNone(props.chosen?.entry ?? verdict.requiresEntry, verdict.papersExempt === true);
			return entryBySize(verdict.conditionGroups?.sizes, verdict.papersExempt === true) ?? entryLineOrNone(verdict.requiresEntry, verdict.papersExempt === true);
		});
		const papersExemptLine = (0, vue_exports.computed)(() => entryLine.value === null ? null : papersLine(props.verdict?.papersExempt === true));
		const noteRepeats = (0, vue_exports.computed)(() => /eintragung|abnahme/i.test(props.verdict?.entryNoteDe ?? ""));
		const verdictEntry = (0, vue_exports.computed)(() => {
			const note = props.verdict?.entryNoteDe ?? null;
			return entryLine.value === "Eintragung in die Fahrzeugpapiere erforderlich." && note !== null && noteRepeats.value ? note : entryLine.value;
		});
		const entryNote = (0, vue_exports.computed)(() => entryLine.value !== null && props.verdict?.entryNoteDe && !noteRepeats.value ? props.verdict.entryNoteDe : null);
		const said = (0, vue_exports.computed)(() => entryLine.value === null ? [] : [
			entryLine.value,
			verdictEntry.value ?? "",
			ENTRY_REQUIRED,
			ABNAHME_REQUIRED
		]);
		const conditions = (0, vue_exports.computed)(() => (props.verdict?.conditions ?? []).filter((condition) => !said.value.includes(condition)));
		const detail = (0, vue_exports.computed)(() => props.verdict?.detail ?? null);
		const overview = (0, vue_exports.computed)(() => {
			const view = detail.value;
			if (view === null) return [];
			const lines = [];
			const chosen = chosenSizes.value;
			const applies = (i) => chosen === null || !i.sizes?.length || i.sizes.some((size) => chosen.includes(size));
			const items = (title) => view.sections.find((s) => s.title === title)?.items.filter((i) => !said.value.includes(i.text) && applies(i)).length ?? 0;
			const work = items("Arbeiten am Fahrzeug");
			const first = view.fasteners[0];
			const bySize = chosen === null && (view.sections.find((s) => s.title === "Arbeiten am Fahrzeug")?.items.some((i) => i.sizes?.length) ?? false);
			const abnahmeBySize = chosen === null && (view.sections.find((s) => s.title === "Abnahme")?.items.some((i) => i.sizes?.length) ?? false);
			if (items("Abnahme") > 0) lines.push(abnahmeBySize ? "Abnahme beim Prüfer, je nach Reifengröße" : "Abnahme beim Prüfer");
			if (work > 0) lines.push(`${bySize ? "bis zu " : ""}${work} ${work === 1 ? "Arbeit" : "Arbeiten"} am Fahrzeug${bySize ? ", je nach Reifengröße" : ""}`);
			if (first !== void 0) {
				const more = view.fasteners.length - 1;
				lines.push(more > 0 ? `${first.thread}${first.torque ? ` (${first.torque})` : ""} oder ${more === 1 ? "ein anderer Schraubensatz" : `einer von ${more} anderen Schraubensätzen`} – welcher, hängt von deinem Fahrzeug ab` : `${first.thread}${first.torque ? `, ${first.torque}` : ""}`);
			}
			return lines;
		});
		const sizes = (0, vue_exports.computed)(() => [.../* @__PURE__ */ new Set([...props.verdict?.tyreSizesFront ?? props.verdict?.tyreSizes ?? [], ...props.verdict?.tyreSizesRear ?? []])]);
		const documentLine = (0, vue_exports.computed)(() => {
			const document = props.verdict?.document;
			if (!document) return null;
			const parts = [document.issuer, document.number].filter((part) => typeof part === "string" && part.trim() !== "");
			const line = parts.length > 0 ? parts.join(" · ") : null;
			const others = document.others ?? [];
			return others.length === 0 ? line : [line, ...others].filter((part) => part !== null).join(" und ");
		});
		const headline = (0, vue_exports.computed)(() => {
			if (props.vehicle === null) return "Noch kein Fahrzeug gewählt.";
			if (props.verdict === null) return `Prüfung für ${props.vehicle.label}`;
			if (notesOnly.value) return `Freigegeben für ${props.vehicle.label}`;
			switch (props.verdict.status) {
				case "PERMITTED": return `Freigegeben für ${props.vehicle.label}`;
				case "CONDITIONAL": return `Mit Auflagen freigegeben für ${props.vehicle.label}`;
				case "NOT_PERMITTED": return `Nicht freigegeben für ${props.vehicle.label}`;
				default:
					if ((props.verdict.missing ?? []).length > 0) return `Noch offen für ${props.vehicle.label}`;
					return tyreOpen.value ? `${wheelApproved.value} · ${tyresWord.value} noch nicht bestätigt` : `Noch nicht bestätigt für ${props.vehicle.label}`;
			}
		});
		const elsewhere = (0, vue_exports.computed)(() => {
			const verdict = props.verdict;
			if (props.vehicle === null || verdict === null || tyreOpen.value || (verdict.missing ?? []).length > 0) return null;
			return verdict.status === "NOT_PERMITTED" || verdict.status === "UNKNOWN" ? `/felgen?fahrzeug=${props.vehicle.id}` : null;
		});
		const wheelApproved = (0, vue_exports.computed)(() => props.verdict?.wheelStatus === "CONDITIONAL" ? "Felge freigegeben mit Auflagen" : "Felge freigegeben");
		const tyresWord = (0, vue_exports.computed)(() => owed.value.length > 0 ? "Reifen" : "Reifengröße");
		const rimSells = (0, vue_exports.computed)(() => tyreOpen.value && props.verdict?.rimSellable === true);
		const openLead = (0, vue_exports.computed)(() => {
			if (!tyreOpen.value || !props.vehicle) return null;
			const approved = `Die Felge selbst ist für ${props.vehicle.label}${props.verdict?.wheelStatus === "CONDITIONAL" ? " mit Auflagen" : ""} freigegeben`;
			return rimSells.value ? `${approved} – nur mit einer der zulässigen Reifengrößen. Die Reifen dazu können wir noch nicht bestätigen. Die Felge allein kannst du schon bestellen.` : `${approved}. ${owed.value.length > 0 ? "Die Reifen" : "Die Reifengröße"} dazu können wir noch nicht bestätigen.`;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["rcheck-panel", tone.value.cls] }, _attrs))} data-v-7f7c78a6><p class="rcheck-panel__head" data-v-7f7c78a6>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default$1, {
				name: tone.value.icon,
				size: 20
			}, null, _parent));
			_push(` RIMIFY-Check </p><p class="rcheck-panel__vehicle" data-v-7f7c78a6>${(0, server_renderer_exports.ssrInterpolate)(headline.value)}</p>`);
			if (openLead.value) _push(`<p class="fit__open" data-open="tyre" data-v-7f7c78a6>${(0, server_renderer_exports.ssrInterpolate)(openLead.value)}</p>`);
			else _push(`<!---->`);
			if (notesOnly.value) _push(`<p class="fit__notes" data-v-7f7c78a6>Mit Hinweisen aus dem Gutachten – nichts davon musst du tun.</p>`);
			else _push(`<!---->`);
			if (__props.verdict && verdictEntry.value) {
				_push(`<!--[--><p class="fit__entry fit__entry--verdict" data-v-7f7c78a6>${(0, server_renderer_exports.ssrInterpolate)(verdictEntry.value)}</p>`);
				if (entryNote.value) _push(`<p class="quiet fit__note" data-v-7f7c78a6>${(0, server_renderer_exports.ssrInterpolate)(entryNote.value)}</p>`);
				else _push(`<!---->`);
				if (papersExemptLine.value) _push(`<p class="fit__entry fit__papers" data-v-7f7c78a6>${(0, server_renderer_exports.ssrInterpolate)(papersExemptLine.value)}</p>`);
				else _push(`<!---->`);
				_push(`<!--]-->`);
			} else _push(`<!---->`);
			if (__props.verdict) {
				_push(`<!--[-->`);
				if (__props.vehicle) _push((0, server_renderer_exports.ssrRenderComponent)(BuildForm_default, {
					key: `build-${__props.vehicle.id}`,
					"vehicle-id": __props.vehicle.id,
					build: __props.vehicle.build ?? null,
					missing: __props.verdict.missing ?? []
				}, null, _parent));
				else _push(`<!---->`);
				if (__props.verdict.wheelLabel && __props.verdict.tyre) _push(`<dl class="fit__halves" data-v-7f7c78a6><div class="fit__half" data-v-7f7c78a6><dt data-v-7f7c78a6>Felge</dt><dd data-v-7f7c78a6>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.wheelLabel)}</dd></div><div class="fit__half"${(0, server_renderer_exports.ssrRenderAttr)("data-tyre", __props.verdict.tyre.status)} data-v-7f7c78a6><dt data-v-7f7c78a6>Reifen</dt><dd data-v-7f7c78a6>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.tyre.label)}</dd></div></dl>`);
				else _push(`<!---->`);
				if (__props.verdict.tyre?.summary) {
					_push(`<!--[--><p class="fit__tyre-summary" data-v-7f7c78a6>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: __props.tyreSummary ?? __props.verdict.tyre.summary }, null, _parent));
					_push(`</p>`);
					if (__props.verdict.tyre.basis) _push(`<p class="fit__tyre-basis" data-v-7f7c78a6>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.tyre.basis)}</p>`);
					else _push(`<!---->`);
					if (__props.verdict.tyre.lines.length) {
						_push(`<details class="fit__sum"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.verdict.tyre.open || void 0) ? " open" : ""} data-v-7f7c78a6><summary class="fit__sum-toggle" data-v-7f7c78a6>So haben wir gerechnet</summary><ul class="fit__tyre-lines" data-v-7f7c78a6><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.verdict.tyre.lines, (line) => {
							_push(`<li data-v-7f7c78a6>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: line }, null, _parent));
							_push(`</li>`);
						});
						_push(`<!--]--></ul></details>`);
					} else _push(`<!---->`);
					_push(`<!--]-->`);
				} else if (__props.verdict.tyre?.lines.length) {
					_push(`<ul class="fit__tyre-lines" data-v-7f7c78a6><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.verdict.tyre.lines, (line) => {
						_push(`<li data-v-7f7c78a6>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: line }, null, _parent));
						_push(`</li>`);
					});
					_push(`<!--]--></ul>`);
				} else _push(`<!---->`);
				if (tyreOpen.value && !owed.value.length) {
					_push(`<p class="fit__open-next" data-open="next" data-v-7f7c78a6> Sobald dazu eine Tragfähigkeitstabelle hinterlegt ist, prüfen wir das automatisch nach. Wenn du deine Wunschreifen nennst, prüfen wir sie vorab von Hand. `);
					if (__props.askHref) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						class: "link fit__open-ask",
						href: __props.askHref
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`Wunschreifen nennen`);
							else return [(0, vue_exports.createTextVNode)("Wunschreifen nennen")];
						}),
						_: 1
					}, _parent));
					else _push(`<!---->`);
					_push(`</p>`);
				} else _push(`<!---->`);
				if (__props.vehicle && (__props.verdict.tyre || __props.vehicle.papers)) _push((0, server_renderer_exports.ssrRenderComponent)(PapersForm_default, {
					key: __props.vehicle.id,
					"vehicle-id": __props.vehicle.id,
					papers: __props.vehicle.papers ?? null,
					known: __props.vehicle.figures ?? null,
					"power-kw": __props.vehicle.powerKw ?? null,
					asked: owed.value,
					"start-closed": rimSells.value
				}, null, _parent));
				else _push(`<!---->`);
				if (detail.value && overview.value.length) {
					_push(`<div class="fit__overview" data-v-7f7c78a6><p class="label fit__overview-h" data-v-7f7c78a6>Das verlangt das Gutachten`);
					if (chosenSize.value) _push(`<!--[--> mit <span class="data" translate="no" data-v-7f7c78a6>${(0, server_renderer_exports.ssrInterpolate)(chosenSize.value)}</span><!--]-->`);
					else if (setView.value) _push(`<!--[--> für diese Kombination<!--]-->`);
					else _push(`<!---->`);
					_push(`</p><p class="small fit__overview-line" data-v-7f7c78a6>${(0, server_renderer_exports.ssrInterpolate)(overview.value.join(" · "))} · <a class="fit__to-detail" href="#auflagen" data-v-7f7c78a6>alle Auflagen im Wortlaut</a></p></div>`);
				} else _push(`<!---->`);
				if (setView.value) _push((0, server_renderer_exports.ssrRenderComponent)(ConditionGroups_default, {
					class: "fit__groups",
					groups: setView.value,
					omit: said.value,
					"data-set-answer": ""
				}, null, _parent));
				else if (!detail.value && __props.chosen) _push((0, server_renderer_exports.ssrRenderComponent)(ConditionGroups_default, {
					class: "fit__groups",
					groups: __props.chosen,
					omit: said.value
				}, null, _parent));
				else if (!detail.value && __props.verdict.conditionGroups && conditions.value.length) _push((0, server_renderer_exports.ssrRenderComponent)(ConditionGroups_default, {
					class: "fit__groups",
					groups: __props.verdict.conditionGroups,
					omit: said.value
				}, null, _parent));
				else if (!detail.value && conditions.value.length) {
					_push(`<ul class="fit__conditions" data-v-7f7c78a6><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(conditions.value, (condition) => {
						_push(`<li data-v-7f7c78a6>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
					});
					_push(`<!--]--></ul>`);
				} else _push(`<!---->`);
				if (sizes.value.length) {
					_push(`<div class="fit__tyres" data-v-7f7c78a6><span class="label" data-v-7f7c78a6>Zulässige Reifengrößen</span>`);
					if (__props.verdict.sizesPerAxle) {
						_push(`<!--[-->`);
						if (__props.verdict.tyreSizesFront?.length) _push(`<p class="data" data-sizes-axle="front" data-v-7f7c78a6>Vorne: ${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.tyreSizesFront.join(" · "))}</p>`);
						else _push(`<!---->`);
						if (__props.verdict.tyreSizesRear?.length) _push(`<p class="data" data-sizes-axle="rear" data-v-7f7c78a6>Hinten: ${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.tyreSizesRear.join(" · "))}</p>`);
						else _push(`<!---->`);
						_push(`<!--]-->`);
					} else _push(`<p class="data" data-v-7f7c78a6>${(0, server_renderer_exports.ssrInterpolate)(sizes.value.join(" · "))}</p>`);
					_push(`</div>`);
				} else _push(`<!---->`);
				if (__props.verdict.reason && !(__props.verdict.missing ?? []).length && !(__props.verdict.tyre?.lines ?? []).includes(__props.verdict.reason) && __props.verdict.reason !== __props.verdict.tyre?.summary) _push(`<p class="fit__reason" data-v-7f7c78a6>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.reason)}</p>`);
				else _push(`<!---->`);
				if (documentLine.value) {
					_push(`<p class="fit__doc" data-v-7f7c78a6>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default$1, {
						name: "document",
						size: 20
					}, null, _parent));
					_push(`<span class="data" data-v-7f7c78a6>${(0, server_renderer_exports.ssrInterpolate)(documentLine.value)}</span></p>`);
				} else _push(`<!---->`);
				if (__props.verdict.document?.example) _push(`<p class="fit__example" data-v-7f7c78a6><span class="tag tag--unknown" data-v-7f7c78a6>Beispieldaten</span> Dieses Gutachten ist bei uns nur als Beispiel hinterlegt – eine Freigabe daraus ist hier kein Nachweis für dein Fahrzeug. </p>`);
				else _push(`<!---->`);
				_push(`<!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.verdict.document?.notes ?? [], (note) => {
					_push(`<p class="fit__note" data-v-7f7c78a6>${(0, server_renderer_exports.ssrInterpolate)(note)}</p>`);
				});
				_push(`<!--]-->`);
				if (__props.verdict.document?.pdf) {
					_push(`<p class="fit__pdf" data-v-7f7c78a6><a class="link"${(0, server_renderer_exports.ssrRenderAttr)("href", __props.verdict.document.pdf.url)} target="_blank" rel="noopener" data-v-7f7c78a6> Gutachten öffnen (`);
					if (__props.verdict.document.example) _push(`<!--[-->Beispiel, <!--]-->`);
					else _push(`<!---->`);
					_push(`PDF`);
					if (__props.verdict.document.pdf.page) _push(`<!--[-->, Seite ${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.document.pdf.page)}<!--]-->`);
					else _push(`<!---->`);
					_push(`) </a></p>`);
				} else _push(`<!---->`);
				if (elsewhere.value && __props.vehicle) {
					_push(`<p class="fit__pdf fit__elsewhere" data-v-7f7c78a6>`);
					_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						class: "link",
						href: elsewhere.value
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`Felgen für ${(0, server_renderer_exports.ssrInterpolate)(__props.vehicle.short)} anzeigen`);
							else return [(0, vue_exports.createTextVNode)("Felgen für " + (0, vue_exports.toDisplayString)(__props.vehicle.short) + " anzeigen", 1)];
						}),
						_: 1
					}, _parent));
					_push(`</p>`);
				} else _push(`<!---->`);
				if (__props.vehicle && __props.configId) _push(`<p class="fit__pdf" data-v-7f7c78a6><button class="link fit__issue" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(issuing.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", issuing.value ? "true" : void 0)} data-v-7f7c78a6>${(0, server_renderer_exports.ssrInterpolate)(__props.issueLabel)}</button></p>`);
				else _push(`<!---->`);
				_push(`<!--]-->`);
			} else if (__props.vehicle === null) _push(`<p class="quiet fit__note" data-v-7f7c78a6> Ohne Fahrzeug können wir keine Freigabe bestätigen. </p>`);
			else _push(`<!---->`);
			(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent);
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/FitmentPanel.vue
var _sfc_setup$1 = FitmentPanel_vue_vue_type_script_setup_true_lang_default.setup;
FitmentPanel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/FitmentPanel.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var FitmentPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FitmentPanel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-7f7c78a6"]]);
//#endregion
//#region resources/js/Components/Product/KomplettradRefusal.vue?vue&type=script&setup=true&lang.ts
var KomplettradRefusal_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "KomplettradRefusal",
	__ssrInlineRender: true,
	props: {
		sentence: {},
		code: {}
	},
	setup(__props) {
		/**
		* Why there is no Komplettrad for this size: one sentence and a way forward, never an empty panel and never a dead end. The refusal code
		* is never rendered — it only picks which routes make sense: the selector when the car is missing, the papers form when the tyres wait
		* for the car's figures (D-286), the contact form when a person has to look at it.
		*/
		const props = __props;
		const page = usePage();
		const carHref = useVehicleChangeHref();
		const forward = (0, vue_exports.computed)(() => ({
			vehicle: props.code === "NO_VEHICLE" || props.code === "VERDICT_RESTORED",
			papers: props.code === "TYRES_AWAIT_PAPERS",
			contact: props.code !== "NO_VEHICLE" && props.code !== "TYRES_AWAIT_PAPERS"
		}));
		const askHref = (0, vue_exports.computed)(() => contactHref({
			subject: "Frage zum Komplettrad",
			from: page.url
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "notice kr-refusal" }, _attrs))} data-v-d4443b0a>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "info",
				size: 20
			}, null, _parent));
			_push(`<div data-v-d4443b0a><p class="kr-refusal__text" data-v-d4443b0a>${(0, server_renderer_exports.ssrInterpolate)(__props.sentence)}</p>`);
			if (forward.value.vehicle || forward.value.papers || forward.value.contact) {
				_push(`<p class="kr-refusal__routes" data-v-d4443b0a>`);
				if (forward.value.vehicle) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: (0, vue_exports.unref)(carHref),
					class: "btn btn--secondary btn--sm"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Fahrzeug wählen`);
						else return [(0, vue_exports.createTextVNode)("Fahrzeug wählen")];
					}),
					_: 1
				}, _parent));
				else _push(`<!---->`);
				if (forward.value.papers) _push(`<button class="btn btn--secondary btn--sm" type="button" data-v-d4443b0a>Werte eintragen</button>`);
				else _push(`<!---->`);
				if (forward.value.contact) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: askHref.value,
					class: "link kr-refusal__mail"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Schreib uns`);
						else return [(0, vue_exports.createTextVNode)("Schreib uns")];
					}),
					_: 1
				}, _parent));
				else _push(`<!---->`);
				_push(`</p>`);
			} else _push(`<!---->`);
			_push(`</div></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/KomplettradRefusal.vue
var _sfc_setup = KomplettradRefusal_vue_vue_type_script_setup_true_lang_default.setup;
KomplettradRefusal_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/KomplettradRefusal.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var KomplettradRefusal_default = /*#__PURE__*/ _plugin_vue_export_helper_default(KomplettradRefusal_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-d4443b0a"]]);
//#endregion
//#region resources/js/lib/basketAdd.ts
/** What every way into the basket says where the connection is gone: nothing was added, and a second press tries again. */
var OFFLINE_ADD = "Keine Verbindung – es wurde nichts in den Warenkorb gelegt. Versuch es gleich noch einmal.";
//#endregion
export { tyreUnconfirmed as a, extrasHint as c, freeStandardColour as d, initialExtras as f, sortCards as g, setSummary as h, sellable as i, filterCards as l, priceBands as m, KomplettradRefusal_default as n, useConfigurator as o, offerOf as p, FitmentPanel_default as r, FitmentDetail_default as s, OFFLINE_ADD as t, flowSum as u };
