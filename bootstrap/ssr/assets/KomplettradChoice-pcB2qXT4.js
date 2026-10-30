import { c as contactHref } from "./useShopFeedback-CzxxZ4Cu.js";
import { a as link_default, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as Icon_default } from "./Icon-Bryl-es8.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { s as withUnit } from "./format-6R0uUMt3.js";
import { t as ConditionGroups_default } from "./ConditionGroups-D92g-UzQ.js";
import { t as TyreLabel_default } from "./TyreLabel-Dt9-zZ9f.js";
import { t as Icon_default$1 } from "./Icon-BMMRRofH.js";
import { i as entryBySize, n as ENTRY_REQUIRED, o as entryLineOrNone, s as papersLine, t as ABNAHME_REQUIRED } from "./papers-B4aUsj_q.js";
import { t as ValueText_default } from "./ValueText-Bpoa8gB7.js";
import { n as BuildForm_default, t as PapersForm_default } from "./PapersForm-DM4rIbMr.js";
//#region resources/js/Components/Product/BuyModeChoice.vue?vue&type=script&setup=true&lang.ts
var BuyModeChoice_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "BuyModeChoice",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		rimPrice: {},
		setFrom: {},
		setFromUnit: {},
		name: {}
	}, {
		"modelValue": { default: "felgen" },
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		/**
		* „Was möchtest du bestellen?“ — Nur Felgen or Kompletträder (the client's #18), two radio tiles, the whole tile the
		* control. The product page and the RIMIFY-Check (#28) ask it the same way; what follows the choice is theirs.
		*
		* Each tile says what it costs in the same words: the rims „pro Felge“, the Kompletträder „ab … pro Rad“ — figures the server
		* formatted. One selected state for every tile on the page: a 2 px blue border and the check, no tint (D-132).
		*/
		const mode = (0, vue_exports.useModel)(__props, "modelValue");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<fieldset${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "bmc" }, _attrs))} data-v-e78fe720><legend class="label bmc__legend" data-v-e78fe720>Was möchtest du bestellen?</legend><div class="bmc__tiles" data-v-e78fe720><label class="${(0, server_renderer_exports.ssrRenderClass)([{ "bmc-tile--on": mode.value === "felgen" }, "bmc-tile"])}" data-v-e78fe720><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(mode.value, "felgen")) ? " checked" : ""} class="visually-hidden" type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", __props.name ?? "pdp-mode")} value="felgen" data-v-e78fe720><span class="bmc-tile__name" data-v-e78fe720>Nur Felgen</span><span class="bmc-tile__sub" data-v-e78fe720> Ohne Reifen `);
			if (__props.rimPrice) _push(`<span class="bmc-tile__price" data-v-e78fe720><span class="num" translate="no" data-v-e78fe720>${(0, server_renderer_exports.ssrInterpolate)(__props.rimPrice)}</span> pro Felge</span>`);
			else _push(`<!---->`);
			_push(`</span><span class="bmc-tile__check" aria-hidden="true" data-v-e78fe720>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "check",
				size: 20
			}, null, _parent));
			_push(`</span></label><label class="${(0, server_renderer_exports.ssrRenderClass)([{ "bmc-tile--on": mode.value === "komplettrad" }, "bmc-tile"])}" data-v-e78fe720><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(mode.value, "komplettrad")) ? " checked" : ""} class="visually-hidden" type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", __props.name ?? "pdp-mode")} value="komplettrad" data-v-e78fe720><span class="bmc-tile__name" data-v-e78fe720>Kompletträder</span><span class="bmc-tile__sub" data-v-e78fe720> Mit Reifen, fertig montiert `);
			if (__props.setFrom) _push(`<span class="bmc-tile__price" data-v-e78fe720>ab <span class="num" translate="no" data-v-e78fe720>${(0, server_renderer_exports.ssrInterpolate)(__props.setFrom)}</span> ${(0, server_renderer_exports.ssrInterpolate)(__props.setFromUnit ?? "pro Rad")}</span>`);
			else _push(`<!---->`);
			_push(`</span><span class="bmc-tile__check" aria-hidden="true" data-v-e78fe720>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "check",
				size: 20
			}, null, _parent));
			_push(`</span></label></div></fieldset>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/BuyModeChoice.vue
var _sfc_setup$3 = BuyModeChoice_vue_vue_type_script_setup_true_lang_default.setup;
BuyModeChoice_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/BuyModeChoice.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var BuyModeChoice_default = /*#__PURE__*/ _plugin_vue_export_helper_default(BuyModeChoice_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-e78fe720"]]);
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
* reachable.
*/
/**
* The wheel half approved, the tyre half without an answer: unverified, which is neither forbidden nor unavailable.
* (A verdict that still waits for a fact of the car is „noch offen“, and is asked for in place — not this.)
*/
function tyreUnconfirmed(verdict) {
	return verdict !== null && verdict !== void 0 && verdict.status === "UNKNOWN" && (verdict.wheelStatus === "PERMITTED" || verdict.wheelStatus === "CONDITIONAL") && verdict.tyre?.status === "UNKNOWN" && (verdict.missing ?? []).length === 0;
}
var FALLBACK_REASON = "Für dein Fahrzeug nicht freigegeben.";
/**
* With no vehicle there is no verdict and no claim: every configuration may be bought. A rim that sells alone while
* its tyres wait for the car's papers (D-289) is a size to buy, not a struck one.
*/
function sellable(config) {
	return config.verdict === null || config.verdict.sellable || config.verdict.rimSellable === true;
}
function answerable(config) {
	return config.verdict !== null && !config.verdict.sellable && config.verdict.status === "UNKNOWN" && (config.verdict.missing ?? []).length > 0;
}
function choosable(config) {
	return sellable(config) || answerable(config);
}
/** Permitted and in stock first, then permitted, then the rest; cheapest within each. */
function best(configs) {
	const rank = (c) => sellable(c) ? c.inStock ? 0 : 1 : 2;
	return [...configs].sort((a, b) => rank(a) - rank(b) || a.priceCents - b.priceCents)[0] ?? null;
}
function reasonFor(configs) {
	return configs.find((c) => c.verdict?.reason)?.verdict?.reason ?? FALLBACK_REASON;
}
function useConfigurator(configs, firstFinishId, initialConfigId = null) {
	const finishId = (0, vue_exports.ref)(firstFinishId);
	const configId = (0, vue_exports.ref)(initialConfigId);
	const forFinish = (0, vue_exports.computed)(() => configs().filter((c) => c.finishId === finishId.value));
	/**
	* The chosen configuration, or the best default: permitted and in stock, cheapest first —
	* never simply the first row, which on a car with a narrow approval would open the page on a
	* disabled chip and a blocked button.
	*/
	const selected = (0, vue_exports.computed)(() => {
		return forFinish.value.find((c) => c.id === configId.value) ?? best(forFinish.value);
	});
	const sizes = (0, vue_exports.computed)(() => {
		const groups = /* @__PURE__ */ new Map();
		for (const config of forFinish.value) groups.set(config.diameterIn, [...groups.get(config.diameterIn) ?? [], config]);
		const current = selected.value;
		return [...groups.entries()].map(([diameter, group]) => {
			const unconfirmed = !group.some(choosable) && group.some((c) => tyreUnconfirmed(c.verdict));
			const blocked = !group.some(choosable) && !unconfirmed;
			const representative = current !== null && group.includes(current) ? current : best(group) ?? group.find((c) => tyreUnconfirmed(c.verdict)) ?? group[0];
			return {
				diameter,
				label: String(diameter).replace(".", ","),
				config: representative,
				blocked,
				unconfirmed,
				reason: blocked || unconfirmed ? reasonFor(group) : null
			};
		}).sort((a, b) => a.diameter - b.diameter);
	});
	const variants = (0, vue_exports.computed)(() => {
		const current = selected.value;
		if (current === null) return [];
		return forFinish.value.filter((c) => c.diameterIn === current.diameterIn).sort((a, b) => a.widthIn - b.widthIn || a.etMm - b.etMm).map((config) => {
			const unconfirmed = !choosable(config) && tyreUnconfirmed(config.verdict);
			const blocked = !choosable(config) && !unconfirmed;
			return {
				id: config.id,
				label: config.sizeLabel,
				config,
				blocked,
				unconfirmed,
				reason: blocked || unconfirmed ? reasonFor([config]) : null
			};
		});
	});
	const fromPrice = (0, vue_exports.computed)(() => {
		return [...forFinish.value].sort((a, b) => a.priceCents - b.priceCents)[0]?.price ?? null;
	});
	/**
	* A new colourway keeps the customer's size where it can: the same width and ET if that
	* finish offers them permitted, otherwise the same diameter. Falling back to the default
	* silently swapped a chosen 19" for an 18" — and its price — on a colour change.
	*/
	function selectFinish(id) {
		const previous = selected.value;
		finishId.value = id;
		configId.value = null;
		if (previous === null) return;
		const candidates = forFinish.value.filter((c) => (choosable(c) || tyreUnconfirmed(c.verdict)) && c.diameterIn === previous.diameterIn);
		const keep = candidates.find((c) => c.widthIn === previous.widthIn && c.etMm === previous.etMm) ?? best(candidates);
		configId.value = keep?.id ?? null;
	}
	function selectSize(option) {
		if (option.blocked) return;
		configId.value = option.config.id;
	}
	function selectVariant(option) {
		if (option.blocked) return;
		configId.value = option.config.id;
	}
	return {
		finishId,
		configId,
		selected,
		sizes,
		variants,
		fromPrice,
		selectFinish,
		selectSize,
		selectVariant
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
				case "CONDITIONAL": return {
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
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["rcheck-panel", tone.value.cls] }, _attrs))} data-v-b2e81967><p class="rcheck-panel__head" data-v-b2e81967>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default$1, {
				name: tone.value.icon,
				size: 20
			}, null, _parent));
			_push(` RIMIFY-Check </p><p class="rcheck-panel__vehicle" data-v-b2e81967>${(0, server_renderer_exports.ssrInterpolate)(headline.value)}</p>`);
			if (openLead.value) _push(`<p class="fit__open" data-open="tyre" data-v-b2e81967>${(0, server_renderer_exports.ssrInterpolate)(openLead.value)}</p>`);
			else _push(`<!---->`);
			if (notesOnly.value) _push(`<p class="fit__notes" data-v-b2e81967>Mit Hinweisen aus dem Gutachten – nichts davon musst du tun.</p>`);
			else _push(`<!---->`);
			if (__props.verdict && verdictEntry.value) {
				_push(`<!--[--><p class="fit__entry fit__entry--verdict" data-v-b2e81967>${(0, server_renderer_exports.ssrInterpolate)(verdictEntry.value)}</p>`);
				if (entryNote.value) _push(`<p class="quiet fit__note" data-v-b2e81967>${(0, server_renderer_exports.ssrInterpolate)(entryNote.value)}</p>`);
				else _push(`<!---->`);
				if (papersExemptLine.value) _push(`<p class="fit__entry fit__papers" data-v-b2e81967>${(0, server_renderer_exports.ssrInterpolate)(papersExemptLine.value)}</p>`);
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
				if (__props.verdict.wheelLabel && __props.verdict.tyre) _push(`<dl class="fit__halves" data-v-b2e81967><div class="fit__half" data-v-b2e81967><dt data-v-b2e81967>Felge</dt><dd data-v-b2e81967>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.wheelLabel)}</dd></div><div class="fit__half"${(0, server_renderer_exports.ssrRenderAttr)("data-tyre", __props.verdict.tyre.status)} data-v-b2e81967><dt data-v-b2e81967>Reifen</dt><dd data-v-b2e81967>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.tyre.label)}</dd></div></dl>`);
				else _push(`<!---->`);
				if (__props.verdict.tyre?.summary) {
					_push(`<!--[--><p class="fit__tyre-summary" data-v-b2e81967>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: __props.verdict.tyre.summary }, null, _parent));
					_push(`</p>`);
					if (__props.verdict.tyre.basis) _push(`<p class="fit__tyre-basis" data-v-b2e81967>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.tyre.basis)}</p>`);
					else _push(`<!---->`);
					if (__props.verdict.tyre.lines.length) {
						_push(`<details class="fit__sum"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.verdict.tyre.open || void 0) ? " open" : ""} data-v-b2e81967><summary class="fit__sum-toggle" data-v-b2e81967>So haben wir gerechnet</summary><ul class="fit__tyre-lines" data-v-b2e81967><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.verdict.tyre.lines, (line) => {
							_push(`<li data-v-b2e81967>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: line }, null, _parent));
							_push(`</li>`);
						});
						_push(`<!--]--></ul></details>`);
					} else _push(`<!---->`);
					_push(`<!--]-->`);
				} else if (__props.verdict.tyre?.lines.length) {
					_push(`<ul class="fit__tyre-lines" data-v-b2e81967><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.verdict.tyre.lines, (line) => {
						_push(`<li data-v-b2e81967>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: line }, null, _parent));
						_push(`</li>`);
					});
					_push(`<!--]--></ul>`);
				} else _push(`<!---->`);
				if (tyreOpen.value && !owed.value.length) {
					_push(`<p class="fit__open-next" data-open="next" data-v-b2e81967> Sobald dazu eine Tragfähigkeitstabelle hinterlegt ist, prüfen wir das automatisch nach. Wenn du deine Wunschreifen nennst, prüfen wir sie vorab von Hand. `);
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
					_push(`<div class="fit__overview" data-v-b2e81967><p class="label fit__overview-h" data-v-b2e81967>Das verlangt das Gutachten`);
					if (chosenSize.value) _push(`<!--[--> mit <span class="data" translate="no" data-v-b2e81967>${(0, server_renderer_exports.ssrInterpolate)(chosenSize.value)}</span><!--]-->`);
					else if (setView.value) _push(`<!--[--> für diese Kombination<!--]-->`);
					else _push(`<!---->`);
					_push(`</p><p class="small fit__overview-line" data-v-b2e81967>${(0, server_renderer_exports.ssrInterpolate)(overview.value.join(" · "))} · <a class="fit__to-detail" href="#auflagen" data-v-b2e81967>alle Auflagen im Wortlaut</a></p></div>`);
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
					_push(`<ul class="fit__conditions" data-v-b2e81967><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(conditions.value, (condition) => {
						_push(`<li data-v-b2e81967>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
					});
					_push(`<!--]--></ul>`);
				} else _push(`<!---->`);
				if (sizes.value.length) _push(`<div class="fit__tyres" data-v-b2e81967><span class="label" data-v-b2e81967>Zulässige Reifengrößen</span><p class="data" data-v-b2e81967>${(0, server_renderer_exports.ssrInterpolate)(sizes.value.join(" · "))}</p></div>`);
				else _push(`<!---->`);
				if (__props.verdict.reason && !(__props.verdict.missing ?? []).length && !(__props.verdict.tyre?.lines ?? []).includes(__props.verdict.reason) && __props.verdict.reason !== __props.verdict.tyre?.summary) _push(`<p class="fit__reason" data-v-b2e81967>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.reason)}</p>`);
				else _push(`<!---->`);
				if (documentLine.value) {
					_push(`<p class="fit__doc" data-v-b2e81967>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default$1, {
						name: "document",
						size: 20
					}, null, _parent));
					_push(`<span class="data" data-v-b2e81967>${(0, server_renderer_exports.ssrInterpolate)(documentLine.value)}</span></p>`);
				} else _push(`<!---->`);
				if (__props.verdict.document?.example) _push(`<p class="fit__example" data-v-b2e81967><span class="tag tag--unknown" data-v-b2e81967>Beispieldaten</span> Dieses Gutachten ist bei uns nur als Beispiel hinterlegt – eine Freigabe daraus ist hier kein Nachweis für dein Fahrzeug. </p>`);
				else _push(`<!---->`);
				_push(`<!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.verdict.document?.notes ?? [], (note) => {
					_push(`<p class="fit__note" data-v-b2e81967>${(0, server_renderer_exports.ssrInterpolate)(note)}</p>`);
				});
				_push(`<!--]-->`);
				if (__props.verdict.document?.pdf) {
					_push(`<p class="fit__pdf" data-v-b2e81967><a class="link"${(0, server_renderer_exports.ssrRenderAttr)("href", __props.verdict.document.pdf.url)} target="_blank" rel="noopener" data-v-b2e81967> Gutachten öffnen (`);
					if (__props.verdict.document.example) _push(`<!--[-->Beispiel, <!--]-->`);
					else _push(`<!---->`);
					_push(`PDF`);
					if (__props.verdict.document.pdf.page) _push(`<!--[-->, Seite ${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.document.pdf.page)}<!--]-->`);
					else _push(`<!---->`);
					_push(`) </a></p>`);
				} else _push(`<!---->`);
				if (elsewhere.value && __props.vehicle) {
					_push(`<p class="fit__pdf fit__elsewhere" data-v-b2e81967>`);
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
				if (__props.vehicle && __props.configId) _push(`<p class="fit__pdf" data-v-b2e81967><button class="link fit__issue" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(issuing.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", issuing.value ? "true" : void 0)} data-v-b2e81967>${(0, server_renderer_exports.ssrInterpolate)(__props.issueLabel)}</button></p>`);
				else _push(`<!---->`);
				_push(`<!--]-->`);
			} else if (__props.vehicle === null) _push(`<p class="quiet fit__note" data-v-b2e81967> Ohne Fahrzeug können wir keine Freigabe bestätigen. </p>`);
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
var FitmentPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FitmentPanel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-b2e81967"]]);
//#endregion
//#region resources/js/lib/papersForm.ts
/** Whether a verdict's tyres wait for fields of the car's papers (`tyre.owed`, D-286). */
function waitsForPapers(verdict) {
	return (verdict?.tyre?.owed ?? []).length > 0;
}
//#endregion
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
//#region resources/js/Components/Product/KomplettradChoice.vue?vue&type=script&setup=true&lang.ts
var FALLBACK_REFUSAL = "Passende Reifen für diese Größe können wir dir gerade nicht anbieten. Die Felge allein kannst du bestellen.";
var SHOWN = 4;
var KomplettradChoice_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "KomplettradChoice",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		offer: {},
		options: { default: null }
	}, {
		"modelValue": { default: null },
		"modelModifiers": {},
		"setKey": { default: null },
		"setKeyModifiers": {},
		"colourId": { default: null },
		"colourIdModifiers": {},
		"rdks": { default: null },
		"rdksModifiers": {}
	}),
	emits: [
		"update:modelValue",
		"update:setKey",
		"update:colourId",
		"update:rdks"
	],
	setup(__props) {
		/**
		* The Komplettrad in the purchase panel (the client's #18): with „Kompletträder“ chosen, the tyres the verdict permits on
		* the chosen size, one of them chosen — or the one sentence saying why there are none, always with a way forward. The
		* page's own button adds the set; nothing here posts.
		*
		* Nothing here decides anything. The server chose the tyres (`TyreEligibility`, R-13), priced them (`KomplettradPricer`)
		* and formatted every figure (R-10); this component prints strings and hands an id to the page. The basket checks the
		* combination again on the server whatever was shown (R-11).
		*
		* The EU tyre label (Regulation (EU) 2020/740) stands with each tyre near its price as its three classes, and in full
		* for the tyre chosen — the label itself, never a class the regulation does not know.
		*
		* The refusal code is never rendered — it only picks which routes forward make sense: the selector when the car is
		* missing, the papers form when the tyres wait for the car's figures (D-286), the contact form when a person has to
		* look at it.
		*
		* Where the Gutachten lists its tyre combinations the Komplettrad is one of them (the operator's decision of
		* 24.10.2026 on the client's item 8, D-335): the combinations the server sends stand in place of the tyres — one
		* chosen, then one of its sets, two wheels per axle in the sizes it names, 2 + 2 and nothing else. A combination the
		* shop has no tyre for on one axle says so and offers no set; nothing fills the gap.
		*/
		const page = usePage();
		const props = __props;
		/** The tyre chosen; the page keeps it, so a size change can choose again. */
		const tyreId = (0, vue_exports.useModel)(__props, "modelValue");
		/** Where the Komplettrad is a combination (D-335): the set chosen, by its key; the page keeps it, as it keeps the tyre. */
		const setKey = (0, vue_exports.useModel)(__props, "setKey");
		/** The Wuchtgewichte colour chosen (#15). */
		const colourId = (0, vue_exports.useModel)(__props, "colourId");
		/** The RDKS answer (#15): unanswered until the visitor answers — the checkout asks then, never a guess either way. */
		const rdks = (0, vue_exports.useModel)(__props, "rdks");
		function perWheel(tyre) {
			return tyre.prices?.find((p) => p.colourId === colourId.value)?.perWheel ?? tyre.perWheel;
		}
		const tpms = (0, vue_exports.computed)(() => props.options?.tpms ?? null);
		const tpmsAskHref = (0, vue_exports.computed)(() => contactHref({
			subject: "Preis für RDKS-Sensoren",
			from: page.url
		}));
		function swatchStyle(hex) {
			return hex ? { "--swatch": hex } : void 0;
		}
		const combinations = (0, vue_exports.computed)(() => props.offer.combinations && props.offer.combinations.length > 0 ? props.offer.combinations : null);
		const refusal = (0, vue_exports.computed)(() => props.offer.refusal ?? (props.offer.tyres.length === 0 && combinations.value === null ? FALLBACK_REFUSAL : null));
		const combinationKey = (0, vue_exports.ref)(null);
		const combination = (0, vue_exports.computed)(() => {
			const all = combinations.value ?? [];
			return all.find((c) => c.key === combinationKey.value) ?? all.find((c) => c.sets.some((s) => s.key === setKey.value)) ?? all.find((c) => c.sets.length > 0) ?? all[0] ?? null;
		});
		(0, vue_exports.watch)(() => (combinations.value ?? []).map((c) => `${c.key}:${c.sets.map((s) => s.key).join(",")}`).join(";"), () => {
			const sets = (combinations.value ?? []).flatMap((c) => c.sets.map((s) => s.key));
			if (setKey.value === null || !sets.includes(setKey.value)) {
				combinationKey.value = null;
				setKey.value = combination.value?.sets[0]?.key ?? null;
			}
		}, { immediate: true });
		function setPriceOf(set) {
			return set.prices?.find((p) => p.colourId === colourId.value)?.forFour ?? set.forFour;
		}
		const chosenSet = (0, vue_exports.computed)(() => combination.value?.sets.find((s) => s.key === setKey.value) ?? null);
		const setsExpanded = (0, vue_exports.ref)(false);
		const shownSets = (0, vue_exports.computed)(() => {
			const sets = combination.value?.sets ?? [];
			if (setsExpanded.value || sets.length <= SHOWN) return sets;
			const first = sets.slice(0, SHOWN);
			const chosen = sets.find((set) => set.key === setKey.value);
			return chosen && !first.includes(chosen) ? [...first.slice(0, 3), chosen] : first;
		});
		(0, vue_exports.useTemplateRef)("setRows");
		const forward = (0, vue_exports.computed)(() => {
			const code = props.offer.refusalCode ?? null;
			return {
				vehicle: code === "NO_VEHICLE" || code === "VERDICT_RESTORED",
				papers: code === "TYRES_AWAIT_PAPERS",
				contact: code !== "NO_VEHICLE" && code !== "TYRES_AWAIT_PAPERS"
			};
		});
		const askHref = (0, vue_exports.computed)(() => contactHref({
			subject: "Frage zum Komplettrad",
			from: page.url
		}));
		const TYRE_CLASSES = [
			"A",
			"B",
			"C",
			"D",
			"E"
		];
		const NOISE_CLASSES = [
			"A",
			"B",
			"C"
		];
		function isTyreClass(value) {
			return value !== null && TYRE_CLASSES.includes(value);
		}
		function isNoiseClass(value) {
			return value !== null && NOISE_CLASSES.includes(value);
		}
		function labelFrom(label, title) {
			if (!label || !isTyreClass(label.fuel) || !isTyreClass(label.wetGrip) || label.noiseDb === null || !isNoiseClass(label.noiseClass)) return null;
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
		function labelOf(tyre) {
			return labelFrom(tyre.label, `${tyre.brandName} ${tyre.name} · ${tyre.sizeLabel}`);
		}
		function setLabels(set) {
			const both = set.frontTyreId === set.rearTyreId;
			const front = labelFrom(set.frontEu, `${set.brandName} ${set.name} · ${set.frontLabel}`);
			const rear = both ? null : labelFrom(set.rearEu, `${set.rearBrandName ?? set.brandName} ${set.rearName ?? set.name} · ${set.rearLabel}`);
			return [...front ? [{
				axle: both ? null : "vorne",
				label: front
			}] : [], ...rear ? [{
				axle: "hinten",
				label: rear
			}] : []];
		}
		const chosenSetLabels = (0, vue_exports.computed)(() => chosenSet.value ? setLabels(chosenSet.value) : []);
		function setAxles(set) {
			const front = labelFrom(set.frontEu, `${set.brandName} ${set.name} · ${set.frontLabel}`);
			if (set.frontTyreId === set.rearTyreId) return [{
				name: "vorne und hinten",
				line: null,
				size: set.frontLabel,
				eu: front
			}];
			const names = setNames(set);
			return [{
				name: "vorne",
				line: names.front,
				size: set.frontLabel,
				eu: front
			}, {
				name: "hinten",
				line: names.rear,
				size: set.rearLabel,
				eu: labelFrom(set.rearEu, `${set.rearBrandName ?? set.brandName} ${set.rearName ?? set.name} · ${set.rearLabel}`)
			}];
		}
		const cards = (0, vue_exports.computed)(() => props.offer.tyres.map((tyre) => ({
			tyre,
			label: labelOf(tyre)
		})));
		const expanded = (0, vue_exports.ref)(false);
		const shownCards = (0, vue_exports.computed)(() => {
			if (expanded.value || cards.value.length <= SHOWN) return cards.value;
			const first = cards.value.slice(0, SHOWN);
			const chosen = cards.value.find((card) => card.tyre.id === tyreId.value);
			return chosen && !first.includes(chosen) ? [...first.slice(0, 3), chosen] : first;
		});
		const chosenLabel = (0, vue_exports.computed)(() => cards.value.find((card) => card.tyre.id === tyreId.value)?.label ?? null);
		(0, vue_exports.useTemplateRef)("rows");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "kc" }, _attrs))} data-v-5b181519>`);
			if (refusal.value) {
				_push(`<div class="notice kc__refusal" data-v-5b181519>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "info",
					size: 20
				}, null, _parent));
				_push(`<div data-v-5b181519><p class="kc__refusal-text" data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(refusal.value)}</p>`);
				if (forward.value.vehicle || forward.value.papers || forward.value.contact) {
					_push(`<p class="kc__routes" data-v-5b181519>`);
					if (forward.value.vehicle) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: "/felgen-suchen",
						class: "btn btn--secondary btn--sm"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`Fahrzeug wählen`);
							else return [(0, vue_exports.createTextVNode)("Fahrzeug wählen")];
						}),
						_: 1
					}, _parent));
					else _push(`<!---->`);
					if (forward.value.papers) _push(`<button class="btn btn--secondary btn--sm" type="button" data-v-5b181519>Werte eintragen</button>`);
					else _push(`<!---->`);
					if (forward.value.contact) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: askHref.value,
						class: "link kc__mail"
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
			} else if (combinations.value) {
				_push(`<fieldset class="kc__group" data-combinations data-v-5b181519><legend class="label kc__legend" data-v-5b181519>Reifenkombination aus dem Gutachten</legend><p class="small muted kc__min" data-v-5b181519> Das Gutachten nennt die Reifengrößen je Achse`);
				if (__props.offer.sourcePage) _push(`<!--[--> (Seite ${(0, server_renderer_exports.ssrInterpolate)(__props.offer.sourcePage)})<!--]-->`);
				else _push(`<!---->`);
				_push(`. Du bekommst zwei Kompletträder für die Vorderachse und zwei für die Hinterachse. </p>`);
				if (combinations.value.length > 1) {
					_push(`<div class="kc__combos" role="group" aria-label="Kombination wählen" data-v-5b181519><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(combinations.value, (item) => {
						_push(`<button type="button" class="chip kc__combo"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", item.key === combination.value?.key)} data-v-5b181519> Nr. ${(0, server_renderer_exports.ssrInterpolate)(item.number)} · `);
						if (item.sameSize) _push(`<!--[-->vorne und hinten <span translate="no" data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(item.front)}</span><!--]-->`);
						else _push(`<!--[-->vorne <span translate="no" data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(item.front)}</span> · hinten <span translate="no" data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(item.rear)}</span><!--]-->`);
						_push(`</button>`);
					});
					_push(`<!--]--></div>`);
				} else _push(`<!---->`);
				if (combination.value) {
					_push(`<!--[-->`);
					if (combinations.value.length === 1) {
						_push(`<p class="kc__pair" data-v-5b181519>`);
						if (combination.value.sameSize) _push(`<!--[--><span class="label" data-v-5b181519>Vorder- und Hinterachse</span> <span class="kc__size" translate="no" data-v-5b181519>je 2 × ${(0, server_renderer_exports.ssrInterpolate)(combination.value.front)}</span><!--]-->`);
						else _push(`<!--[--><span class="label" data-v-5b181519>Vorderachse</span> <span class="kc__size" translate="no" data-v-5b181519>2 × ${(0, server_renderer_exports.ssrInterpolate)(combination.value.front)}</span> <span aria-hidden="true" data-v-5b181519>·</span> <span class="label" data-v-5b181519>Hinterachse</span> <span class="kc__size" translate="no" data-v-5b181519>2 × ${(0, server_renderer_exports.ssrInterpolate)(combination.value.rear)}</span><!--]-->`);
						_push(` <span class="kc__source" data-v-5b181519>Kombination Nr. ${(0, server_renderer_exports.ssrInterpolate)(combination.value.number)}</span></p>`);
					} else _push(`<!---->`);
					_push(`<p class="small muted kc__min" data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(combination.value.minSentence)}</p>`);
					if (combination.value.sets.length === 0) {
						_push(`<p class="notice kc__noset" data-v-5b181519>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "info",
							size: 20
						}, null, _parent));
						_push(`<span data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(combination.value.noSet ?? FALLBACK_REFUSAL)}</span></p>`);
					} else {
						_push(`<ul class="kc__rows" role="list" data-v-5b181519><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(shownSets.value, (set) => {
							_push(`<li data-v-5b181519><label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kc-row--on": set.key === setKey.value }, "kc-row"])}" data-v-5b181519><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(setKey.value, set.key)) ? " checked" : ""} class="kc-row__radio" type="radio" name="kc-set"${(0, server_renderer_exports.ssrRenderAttr)("value", set.key)} data-v-5b181519><span class="kc-row__body" data-v-5b181519><span class="kc-row__name" data-v-5b181519><span class="kc-row__brand" data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(setNames)(set).brands.join(" · "))}</span>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(setNames)(set).line ? ` ${(0, vue_exports.unref)(setNames)(set).line}` : "")}</span><span class="kc-row__meta" data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(set.seasonLabel)}</span><span class="kc-set" data-v-5b181519><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(setAxles(set), (axle) => {
								_push(`<!--[--><span class="kc-set__axle" data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(axle.name)}</span><span class="kc-set__detail" data-v-5b181519>`);
								if (axle.line) _push(`<span class="kc-set__line" translate="no" data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(axle.line)}</span>`);
								else _push(`<!---->`);
								_push(`<span class="data kc-set__size" translate="no" data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(axle.size)}</span>`);
								if (axle.eu) _push(`<span class="kc-row__eu num" data-v-5b181519> Kraftstoffeffizienz ${(0, server_renderer_exports.ssrInterpolate)(axle.eu.fuel)} · Nasshaftung ${(0, server_renderer_exports.ssrInterpolate)(axle.eu.wet)} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)(axle.eu.noiseDb, "dB"))} (${(0, server_renderer_exports.ssrInterpolate)(axle.eu.noiseClass)}) </span>`);
								else _push(`<!---->`);
								_push(`</span><!--]-->`);
							});
							_push(`<!--]--></span></span><span class="kc-row__price" data-v-5b181519><span class="kc-row__amount num" data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(setPriceOf(set))}</span><span class="kc-row__per" data-v-5b181519>für 2 + 2</span></span></label></li>`);
						});
						_push(`<!--]--></ul>`);
					}
					if (combination.value.sets.length > SHOWN && !setsExpanded.value) _push(`<button type="button" class="link kc__more" data-v-5b181519> Alle ${(0, server_renderer_exports.ssrInterpolate)(combination.value.sets.length)} Reifensätze zeigen </button>`);
					else _push(`<!---->`);
					_push(`<!--]-->`);
				} else _push(`<!---->`);
				_push(`<!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(chosenSetLabels.value, (eu) => {
					_push((0, server_renderer_exports.ssrRenderComponent)(TyreLabel_default, (0, vue_exports.mergeProps)({ key: eu.label.eprelId }, { ref_for: true }, eu.label, { class: "kc__label" }), null, _parent));
				});
				_push(`<!--]--></fieldset>`);
			} else {
				_push(`<fieldset class="kc__group" data-v-5b181519><legend class="label kc__legend" data-v-5b181519>Reifen</legend>`);
				if (__props.offer.minSentence) _push(`<p class="small muted kc__min" data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(__props.offer.minSentence)}</p>`);
				else _push(`<!---->`);
				_push(`<ul class="kc__rows" role="list" data-v-5b181519><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(shownCards.value, (card) => {
					_push(`<li data-v-5b181519><label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kc-row--on": card.tyre.id === tyreId.value }, "kc-row"])}" data-v-5b181519><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(tyreId.value, card.tyre.id)) ? " checked" : ""} class="kc-row__radio" type="radio" name="kc-tyre"${(0, server_renderer_exports.ssrRenderAttr)("value", card.tyre.id)} data-v-5b181519><span class="kc-row__body" data-v-5b181519><span class="kc-row__name" data-v-5b181519><span class="kc-row__brand" data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.brandName)}</span> ${(0, server_renderer_exports.ssrInterpolate)(card.tyre.name)}</span><span class="kc-row__meta" data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.seasonLabel)} · <span class="data" data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.sizeLabel)}</span></span>`);
					if (card.label) _push(`<span class="kc-row__eu num" data-v-5b181519> Kraftstoffeffizienz ${(0, server_renderer_exports.ssrInterpolate)(card.label.fuel)} · Nasshaftung ${(0, server_renderer_exports.ssrInterpolate)(card.label.wet)} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)(card.label.noiseDb, "dB"))} (${(0, server_renderer_exports.ssrInterpolate)(card.label.noiseClass)}) </span>`);
					else _push(`<!---->`);
					_push(`</span><span class="kc-row__price" data-v-5b181519><span class="kc-row__amount num" data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(perWheel(card.tyre))}</span><span class="kc-row__per" data-v-5b181519>pro Rad</span></span></label></li>`);
				});
				_push(`<!--]--></ul>`);
				if (cards.value.length > SHOWN && !expanded.value) _push(`<button type="button" class="link kc__more" data-v-5b181519> Alle ${(0, server_renderer_exports.ssrInterpolate)(cards.value.length)} Reifen zeigen </button>`);
				else _push(`<!---->`);
				if (chosenLabel.value) _push((0, server_renderer_exports.ssrRenderComponent)(TyreLabel_default, (0, vue_exports.mergeProps)(chosenLabel.value, { class: "kc__label" }), null, _parent));
				else _push(`<!---->`);
				_push(`</fieldset>`);
			}
			if (!refusal.value && __props.options && __props.options.colours.length > 0) {
				_push(`<fieldset class="kc__group" data-v-5b181519><legend class="label kc__legend" data-v-5b181519>Wuchtgewichte</legend><p class="small muted kc__hint" data-v-5b181519>Die Gewichte sitzen innen an der Felge. Such dir die Farbe aus, die dir besser gefällt.</p><div class="kc__swatches" data-v-5b181519><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.options.colours, (colour) => {
					_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kc-swatch--on": colour.id === colourId.value }, "kc-swatch"])}" data-v-5b181519><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(colourId.value, colour.id)) ? " checked" : ""} class="visually-hidden" type="radio" name="kc-weights"${(0, server_renderer_exports.ssrRenderAttr)("value", colour.id)} data-v-5b181519><span class="kc-swatch__dot" data-qa-ignore style="${(0, server_renderer_exports.ssrRenderStyle)(swatchStyle(colour.swatchHex))}" aria-hidden="true" data-v-5b181519></span><span class="kc-swatch__name" data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(colour.name)}</span><span class="kc-swatch__price num" data-v-5b181519>`);
					if (colour.surchargeCents === 0) _push(`<!--[-->ohne Aufpreis<!--]-->`);
					else _push(`<!--[-->+ ${(0, server_renderer_exports.ssrInterpolate)(colour.surcharge)} pro Rad<!--]-->`);
					_push(`</span></label>`);
				});
				_push(`<!--]--></div></fieldset>`);
			} else _push(`<!---->`);
			if (!refusal.value && tpms.value) {
				_push(`<fieldset class="kc__group" data-v-5b181519><legend class="label kc__legend" data-v-5b181519>RDKS-Sensoren</legend><p class="small muted kc__hint" data-v-5b181519> Misst dein Auto den Reifendruck mit Sensoren in den Rädern, brauchen auch die neuen Räder Sensoren. Ob das so ist, steht in der Betriebsanleitung. </p>`);
				if (!tpms.value.available && tpms.value.notice) {
					_push(`<p class="notice kc__tpms-notice" data-v-5b181519><span data-v-5b181519>${(0, server_renderer_exports.ssrInterpolate)(tpms.value.notice)} `);
					_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: tpmsAskHref.value,
						class: "link"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`Zum Kontaktformular`);
							else return [(0, vue_exports.createTextVNode)("Zum Kontaktformular")];
						}),
						_: 1
					}, _parent));
					_push(`</span></p>`);
				} else _push(`<!---->`);
				_push(`<div class="kc__opts" data-v-5b181519>`);
				if (tpms.value.available) {
					_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kc-opt--on": rdks.value === "ja" }, "kc-opt"])}" data-v-5b181519><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(rdks.value, "ja")) ? " checked" : ""} class="visually-hidden" type="radio" name="kc-rdks" value="ja" data-v-5b181519><span class="kc-opt__name" data-v-5b181519>Mit RDKS-Sensoren</span><span class="kc-opt__price num" data-v-5b181519>+ ${(0, server_renderer_exports.ssrInterpolate)(tpms.value.yesTotal)}`);
					if (tpms.value.line) _push(`<!--[--> (${(0, server_renderer_exports.ssrInterpolate)(tpms.value.line)})<!--]-->`);
					else _push(`<!---->`);
					_push(`</span><span class="kc-opt__sub" data-v-5b181519>Wir setzen die Sensoren gleich mit ein.</span><span class="kc-opt__check" aria-hidden="true" data-v-5b181519>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "check",
						size: 20
					}, null, _parent));
					_push(`</span></label>`);
				} else _push(`<!---->`);
				_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kc-opt--on": rdks.value === "nein" }, "kc-opt"])}" data-v-5b181519><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(rdks.value, "nein")) ? " checked" : ""} class="visually-hidden" type="radio" name="kc-rdks" value="nein" data-v-5b181519><span class="kc-opt__name" data-v-5b181519>Ohne RDKS-Sensoren</span><span class="kc-opt__price" data-v-5b181519>ohne Aufpreis</span><span class="kc-opt__check" aria-hidden="true" data-v-5b181519>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "check",
					size: 20
				}, null, _parent));
				_push(`</span></label></div></fieldset>`);
			} else _push(`<!---->`);
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/KomplettradChoice.vue
var _sfc_setup = KomplettradChoice_vue_vue_type_script_setup_true_lang_default.setup;
KomplettradChoice_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/KomplettradChoice.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var KomplettradChoice_default = /*#__PURE__*/ _plugin_vue_export_helper_default(KomplettradChoice_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-5b181519"]]);
//#endregion
export { sellable as a, FitmentDetail_default as c, FitmentPanel_default as i, BuyModeChoice_default as l, setNames as n, tyreUnconfirmed as o, waitsForPapers as r, useConfigurator as s, KomplettradChoice_default as t };
