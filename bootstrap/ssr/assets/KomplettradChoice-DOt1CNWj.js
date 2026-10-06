import { a as link_default, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as Icon_default } from "./Icon-DUS6sqAV.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as useOcr } from "./useOcr-B_yIMiO_.js";
import { n as formatNumber } from "./num-Br8qlecZ.js";
import { t as ConditionGroups_default } from "./ConditionGroups-DPIzVLfb.js";
import { f as contactHref } from "./useShortcuts-C7K2MI8O.js";
import { r as papersSVG, t as Svg_default } from "./Svg-BjJf-u_I.js";
import { t as Icon_default$1 } from "./Icon-58DOAUuC.js";
import { i as entryBySize, n as ENTRY_REQUIRED, o as entryLineOrNone, s as papersLine, t as ABNAHME_REQUIRED } from "./papers-B4aUsj_q.js";
import { t as ValueText_default } from "./ValueText-VH6zhCTD.js";
import { t as BuildForm_default } from "./BuildForm-D9IpoIx0.js";
import { t as TyreLabel_default } from "./TyreLabel-CcprBr1T.js";
//#region resources/js/Components/Product/BuyModeChoice.vue?vue&type=script&setup=true&lang.ts
var BuyModeChoice_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "BuyModeChoice",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		rimPrice: {},
		setFrom: {},
		name: {}
	}, {
		"modelValue": { default: "felgen" },
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		/**
		* „Was möchtest du bestellen?“ — Nur Felgen or Komplettrad (the client's #18), two radio tiles, the whole tile the
		* control. The product page and the RIMIFY-Check (#28) ask it the same way; what follows the choice is theirs.
		*
		* Each tile says what it costs in the same words: the rims „je Felge“, the Komplettrad „ab … je Rad“ — figures the server
		* formatted. One selected state for every tile on the page: a 2 px blue border and the check, no tint (D-132).
		*/
		const mode = (0, vue_exports.useModel)(__props, "modelValue");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<fieldset${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "bmc" }, _attrs))} data-v-1ad9d771><legend class="label bmc__legend" data-v-1ad9d771>Was möchtest du bestellen?</legend><div class="bmc__tiles" data-v-1ad9d771><label class="${(0, server_renderer_exports.ssrRenderClass)([{ "bmc-tile--on": mode.value === "felgen" }, "bmc-tile"])}" data-v-1ad9d771><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(mode.value, "felgen")) ? " checked" : ""} class="visually-hidden" type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", __props.name ?? "pdp-mode")} value="felgen" data-v-1ad9d771><span class="bmc-tile__name" data-v-1ad9d771>Nur Felgen</span><span class="bmc-tile__sub" data-v-1ad9d771> Ohne Reifen `);
			if (__props.rimPrice) _push(`<span class="bmc-tile__price" data-v-1ad9d771><span class="num" translate="no" data-v-1ad9d771>${(0, server_renderer_exports.ssrInterpolate)(__props.rimPrice)}</span> je Felge</span>`);
			else _push(`<!---->`);
			_push(`</span><span class="bmc-tile__check" aria-hidden="true" data-v-1ad9d771>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "check",
				size: 20
			}, null, _parent));
			_push(`</span></label><label class="${(0, server_renderer_exports.ssrRenderClass)([{ "bmc-tile--on": mode.value === "komplettrad" }, "bmc-tile"])}" data-v-1ad9d771><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(mode.value, "komplettrad")) ? " checked" : ""} class="visually-hidden" type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", __props.name ?? "pdp-mode")} value="komplettrad" data-v-1ad9d771><span class="bmc-tile__name" data-v-1ad9d771>Komplettrad</span><span class="bmc-tile__sub" data-v-1ad9d771> Mit Reifen, fertig montiert `);
			if (__props.setFrom) _push(`<span class="bmc-tile__price" data-v-1ad9d771>ab <span class="num" translate="no" data-v-1ad9d771>${(0, server_renderer_exports.ssrInterpolate)(__props.setFrom)}</span> je Rad</span>`);
			else _push(`<!---->`);
			_push(`</span><span class="bmc-tile__check" aria-hidden="true" data-v-1ad9d771>`);
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
var _sfc_setup$5 = BuyModeChoice_vue_vue_type_script_setup_true_lang_default.setup;
BuyModeChoice_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/BuyModeChoice.vue");
	return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
var BuyModeChoice_default = /*#__PURE__*/ _plugin_vue_export_helper_default(BuyModeChoice_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-1ad9d771"]]);
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
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				id: "auflagen",
				class: "fdt",
				"aria-labelledby": "fdt-h"
			}, _attrs))} data-v-b35fc52e><h2 id="fdt-h" class="h2 fdt__h" tabindex="-1" data-v-b35fc52e>Was das Gutachten für ${(0, server_renderer_exports.ssrInterpolate)(__props.vehicleLabel)} verlangt</h2><p class="small muted fdt__lede" data-v-b35fc52e> Wörtlich aus dem Gutachten.`);
			if (hasOwn.value) _push(`<!--[--> Was mit „Unser Hinweis“ beginnt, kommt von uns.<!--]-->`);
			else _push(`<!---->`);
			_push(`</p><div class="fdt__cols" data-v-b35fc52e><div class="fdt__main" data-v-b35fc52e><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(todo.value, (section) => {
				_push(`<div class="fdt__sec" data-v-b35fc52e><h3 class="h4 fdt__sec-h" data-v-b35fc52e>${(0, server_renderer_exports.ssrInterpolate)(section.title)}</h3><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(section.groups, (group) => {
					_push(`<!--[-->`);
					if (group.label) _push(`<p class="fdt__for" data-v-b35fc52e>${(0, server_renderer_exports.ssrInterpolate)(group.label)}</p>`);
					else _push(`<!---->`);
					_push(`<ul class="fdt__list" data-v-b35fc52e><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(group.items, (item) => {
						_push(`<li data-v-b35fc52e>`);
						if (item.own) _push(`<span class="fdt__own" data-v-b35fc52e>Unser Hinweis: </span>`);
						else _push(`<!---->`);
						_push(`${(0, server_renderer_exports.ssrInterpolate)(item.text)} `);
						if (item.measures.length) {
							_push(`<ul class="fdt__measures" data-v-b35fc52e><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(item.measures, (measure) => {
								_push(`<li data-v-b35fc52e>${(0, server_renderer_exports.ssrInterpolate)(measure)}</li>`);
							});
							_push(`<!--]--></ul>`);
						} else _push(`<!---->`);
						_push(`</li>`);
					});
					_push(`<!--]--></ul><!--]-->`);
				});
				_push(`<!--]-->`);
				if (section.title === "Befestigung" && __props.detail.fasteners.length) {
					_push(`<table class="fdt__table" data-v-b35fc52e><thead data-v-b35fc52e><tr data-v-b35fc52e><th scope="col" data-v-b35fc52e>Schraube</th><th scope="col" data-v-b35fc52e>Anzugsmoment</th><th scope="col" data-v-b35fc52e>Artikel</th><th scope="col" data-v-b35fc52e>Gilt</th></tr></thead><tbody data-v-b35fc52e><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.detail.fasteners, (bolt) => {
						_push(`<tr data-v-b35fc52e><td data-label="Schraube" class="fdt__key" data-v-b35fc52e>`);
						if (bolt.number) _push(`<!--[-->Nr. ${(0, server_renderer_exports.ssrInterpolate)(bolt.number)} · <!--]-->`);
						else _push(`<!---->`);
						_push(`${(0, server_renderer_exports.ssrInterpolate)(bolt.label)}</td><td data-label="Anzugsmoment" class="fdt__num" data-v-b35fc52e>${(0, server_renderer_exports.ssrInterpolate)(bolt.torque ?? "–")}</td><td data-label="Artikel" data-v-b35fc52e>${(0, server_renderer_exports.ssrInterpolate)(bolt.article ?? "–")}</td><td data-label="Gilt" data-v-b35fc52e>${(0, server_renderer_exports.ssrInterpolate)(bolt.limit ?? "für diesen Typ")}</td></tr>`);
					});
					_push(`<!--]--></tbody></table>`);
				} else _push(`<!---->`);
				if (section.title === "Befestigung" && namesNachtrag.value) _push(`<p class="small muted fdt__aside" data-v-b35fc52e> „Nachtrag“ meint hier den Stand der EG-Typgenehmigung deines Fahrzeugs, nicht den des Gutachtens. Er steht in Feld K der Zulassungsbescheinigung Teil I: die Ziffern nach dem letzten Sternchen, bei …*04 also „04“. </p>`);
				else _push(`<!---->`);
				if (section.title === "Reifen" && __props.detail.tyres.length) {
					_push(`<table class="fdt__table" data-v-b35fc52e><thead data-v-b35fc52e><tr data-v-b35fc52e><th scope="col" data-v-b35fc52e>Größe</th><th scope="col" data-v-b35fc52e>Achse</th><th scope="col" data-v-b35fc52e>Leistung</th><th scope="col" data-v-b35fc52e>Mindestens laut Gutachten</th></tr></thead><tbody data-v-b35fc52e><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.detail.tyres, (size) => {
						_push(`<tr data-v-b35fc52e><td data-label="Größe" class="fdt__key fdt__num" data-v-b35fc52e>${(0, server_renderer_exports.ssrInterpolate)(size.label)}</td><td data-label="Achse" data-v-b35fc52e>${(0, server_renderer_exports.ssrInterpolate)(size.axle)}</td><td data-label="Leistung" class="fdt__num" data-v-b35fc52e>${(0, server_renderer_exports.ssrInterpolate)(size.band ?? "–")}</td><td data-label="Mindestens laut Gutachten" data-v-b35fc52e>${(0, server_renderer_exports.ssrInterpolate)(size.minimum ?? "–")}</td></tr>`);
					});
					_push(`<!--]--></tbody></table>`);
				} else _push(`<!---->`);
				_push(`</div>`);
			});
			_push(`<!--]--></div>`);
			if (notes.value.length || __props.detail.notices.length) {
				_push(`<div class="fdt__side" data-v-b35fc52e>`);
				if (notes.value.length) {
					_push(`<div class="fdt__sec" data-v-b35fc52e><h3 class="h4 fdt__sec-h" data-v-b35fc52e>Hinweise</h3><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(notes.value, (group) => {
						_push(`<!--[-->`);
						if (group.label) _push(`<p class="fdt__for" data-v-b35fc52e>${(0, server_renderer_exports.ssrInterpolate)(group.label)}</p>`);
						else _push(`<!---->`);
						_push(`<ul class="fdt__list fdt__list--note" data-v-b35fc52e><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(group.items, (item) => {
							_push(`<li data-v-b35fc52e>`);
							if (item.own) _push(`<span class="fdt__own" data-v-b35fc52e>Unser Hinweis: </span>`);
							else _push(`<!---->`);
							_push(`${(0, server_renderer_exports.ssrInterpolate)(item.text)}</li>`);
						});
						_push(`<!--]--></ul><!--]-->`);
					});
					_push(`<!--]--></div>`);
				} else _push(`<!---->`);
				if (__props.detail.notices.length) {
					_push(`<div class="fdt__sec" data-v-b35fc52e><h3 class="h4 fdt__sec-h" data-v-b35fc52e>Hinweise des Gutachtens</h3><ul class="fdt__list fdt__list--note" data-v-b35fc52e><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.detail.notices, (notice) => {
						_push(`<li data-v-b35fc52e>${(0, server_renderer_exports.ssrInterpolate)(notice)}</li>`);
					});
					_push(`<!--]--></ul></div>`);
				} else _push(`<!---->`);
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`</div>`);
			if (original.value.length) {
				_push(`<details class="fdt__original" data-original data-v-b35fc52e><summary class="fdt__original-toggle" data-v-b35fc52e>Originaltext anzeigen</summary><p class="small muted fdt__original-lede" data-v-b35fc52e>So steht es im Gutachten – ohne unsere Gliederung und ohne Auslassungen.</p><ul class="fdt__list fdt__list--note" data-v-b35fc52e><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(original.value, (item) => {
					_push(`<li data-v-b35fc52e>${(0, server_renderer_exports.ssrInterpolate)(item.text)}`);
					if (item.page) _push(`<span class="fdt__page" data-v-b35fc52e> (Seite ${(0, server_renderer_exports.ssrInterpolate)(item.page)})</span>`);
					else _push(`<!---->`);
					_push(`</li>`);
				});
				_push(`<!--]--></ul></details>`);
			} else _push(`<!---->`);
			_push(`</section>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/FitmentDetail.vue
var _sfc_setup$4 = FitmentDetail_vue_vue_type_script_setup_true_lang_default.setup;
FitmentDetail_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/FitmentDetail.vue");
	return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
var FitmentDetail_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FitmentDetail_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-b35fc52e"]]);
//#endregion
//#region resources/js/Components/Art/PapersFacsimile.vue?vue&type=script&setup=true&lang.ts
var PapersFacsimile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "PapersFacsimile",
	__ssrInlineRender: true,
	props: {
		variant: { default: "neu" },
		width: { default: 560 },
		title: { default: void 0 }
	},
	setup(__props) {
		/**
		* Where the tyre check's figures stand in the papers: 8.1 and 8.2 (the permitted axle loads), T (the top
		* speed) and P.2 (the power) on the Zulassungsbescheinigung Teil I — Ziffer 16, 6 and 7 on the older
		* Fahrzeugschein. Both layouts, because both are in circulation.
		*/
		const props = __props;
		const markup = (0, vue_exports.computed)(() => papersSVG(props.variant, {
			width: props.width,
			title: props.title
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Svg_default, (0, vue_exports.mergeProps)({ markup: markup.value }, _attrs), null, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Art/PapersFacsimile.vue
var _sfc_setup$3 = PapersFacsimile_vue_vue_type_script_setup_true_lang_default.setup;
PapersFacsimile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Art/PapersFacsimile.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var PapersFacsimile_default = PapersFacsimile_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Components/Product/PapersForm.vue?vue&type=script&setup=true&lang.ts
var NBSP = "\xA0";
var PapersForm_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "PapersForm",
	__ssrInlineRender: true,
	props: {
		vehicleId: {},
		papers: {},
		powerKw: {}
	},
	setup(__props) {
		/**
		* The three figures the tyre half needs, from the customer's own papers (Block C, item 10): 8.1 and 8.2,
		* the permitted axle loads front and rear, and T, the top speed. Optional — without them the wheel answer
		* stands and the tyre answer says what to compare; with them the tyre answer is definite and shows its sum.
		*
		* A drawing rings where the fields stand, on the certificate issued since 2005 and on the older
		* Fahrzeugschein. The figures are kept with THIS car in the browser (a cookie keyed by the vehicle, so two
		* saved cars never overwrite each other) until customer accounts exist, and the server reads them for every
		* answer about this car.
		*
		* A photo of the papers fills the fields (`useOcr`, on the device, never uploaded): 8.1, 8.2 and T go into
		* the fields for the customer to check before anything is kept; P.2 is compared with the chosen variant's
		* power, because the wheel answer rests on the variant, and a mismatch is said at once.
		*/
		const props = __props;
		const variant = (0, vue_exports.ref)("neu");
		const open = (0, vue_exports.ref)(false);
		const busy = (0, vue_exports.ref)(false);
		const errors = (0, vue_exports.ref)({});
		const FIELDS = (0, vue_exports.computed)(() => [
			{
				key: "axle_front_kg",
				label: "8.1 · zulässige Achslast vorn",
				unit: "kg",
				min: 300,
				max: 4e3
			},
			{
				key: "axle_rear_kg",
				label: "8.2 · zulässige Achslast hinten",
				unit: "kg",
				min: 300,
				max: 4e3
			},
			{
				key: "top_speed_kmh",
				label: "T · Höchstgeschwindigkeit",
				unit: "km/h",
				min: 60,
				max: 420
			},
			...props.powerKw == null ? [{
				key: "power_kw",
				label: "P.2 · Leistung (erste Zahl)",
				unit: "kW",
				min: 10,
				max: 1e3
			}] : []
		]);
		const form = (0, vue_exports.reactive)({
			axle_front_kg: props.papers?.axleFrontKg ?? "",
			axle_rear_kg: props.papers?.axleRearKg ?? "",
			top_speed_kmh: props.papers?.topSpeedKmh ?? "",
			power_kw: props.papers?.powerKw ?? ""
		});
		const entered = (0, vue_exports.computed)(() => props.papers !== null);
		/** The form as the kept figures say, nothing typed since — for „Ändern“ and „Abbrechen“. */
		function fromPapers() {
			form.axle_front_kg = props.papers?.axleFrontKg ?? "";
			form.axle_rear_kg = props.papers?.axleRearKg ?? "";
			form.top_speed_kmh = props.papers?.topSpeedKmh ?? "";
			form.power_kw = props.papers?.powerKw ?? "";
			errors.value = {};
		}
		(0, vue_exports.watch)(() => props.papers, () => {
			if (!open.value || props.papers === null) fromPapers();
		});
		const kg = (n) => `${formatNumber(n)}${NBSP}kg`;
		useOcr();
		(0, vue_exports.ref)(null);
		const scan = (0, vue_exports.ref)("idle");
		const readPowerKw = (0, vue_exports.ref)(null);
		const powerMismatch = (0, vue_exports.computed)(() => readPowerKw.value !== null && props.powerKw != null && readPowerKw.value !== props.powerKw);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "pp" }, _attrs))} data-v-23e539b7>`);
			if (__props.papers && !open.value) {
				_push(`<!--[--><p class="pp__summary" data-v-23e539b7><span data-v-23e539b7>Nach deinen Angaben: 8.1 ${(0, server_renderer_exports.ssrInterpolate)(kg(__props.papers.axleFrontKg))} · 8.2 ${(0, server_renderer_exports.ssrInterpolate)(kg(__props.papers.axleRearKg))} · T ${(0, server_renderer_exports.ssrInterpolate)(__props.papers.topSpeedKmh)} km/h`);
				if (__props.papers.powerKw) _push(`<!--[--> · P.2 ${(0, server_renderer_exports.ssrInterpolate)(__props.papers.powerKw)} kW<!--]-->`);
				else _push(`<!---->`);
				_push(`</span><button id="pp-change" class="btn btn--ghost btn--sm" type="button" data-v-23e539b7>Ändern</button></p><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.papers.notes, (note) => {
					_push(`<p class="pp__help" data-v-23e539b7>${(0, server_renderer_exports.ssrInterpolate)(note)}</p>`);
				});
				_push(`<!--]--><!--]-->`);
			} else if (!open.value) _push(`<button id="pp-open" class="btn btn--secondary btn--sm pp__open" type="button" data-v-23e539b7> Werte aus der Zulassungsbescheinigung eintragen </button>`);
			else {
				_push(`<form class="pp__form" novalidate aria-labelledby="pp-h" data-v-23e539b7><div class="pp__head" data-v-23e539b7><p id="pp-h" class="pp__title" data-v-23e539b7>Werte aus deiner Zulassungsbescheinigung</p><p class="pp__help" data-v-23e539b7> Freiwillig: Mit der zulässigen Achslast und der Höchstgeschwindigkeit sagen wir dir genau, welche Reifen du fahren darfst. Die Werte bleiben in deinem Browser, bei diesem Fahrzeug. </p></div><div class="pp__scan" data-v-23e539b7><label for="pp-photo" class="visually-hidden" data-v-23e539b7>Foto der Zulassungsbescheinigung Teil I</label><input id="pp-photo" class="visually-hidden" type="file" accept="image/*" capture="environment" tabindex="-1" data-v-23e539b7><button class="btn btn--secondary btn--sm" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(scan.value === "busy") ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", scan.value === "busy" ? "true" : void 0)} data-v-23e539b7>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "camera",
					size: 20
				}, null, _parent));
				_push(` Zulassungsbescheinigung fotografieren </button><p class="pp__help" data-v-23e539b7>Die Erkennung läuft auf deinem Gerät. Das Foto wird nicht hochgeladen.</p>`);
				if (scan.value === "busy") _push(`<p class="pp__help" role="status" data-v-23e539b7>Erkennung läuft …</p>`);
				else if (scan.value === "read") _push(`<p class="pp__help" role="status" data-v-23e539b7>Aus dem Foto gelesen. Prüf die Werte, bevor du sie übernimmst.</p>`);
				else if (scan.value === "failed") {
					_push(`<p class="notice notice--warn" role="alert" data-v-23e539b7>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "warning",
						size: 20
					}, null, _parent));
					_push(`<span data-v-23e539b7>Wir konnten 8.1, 8.2 und T nicht lesen. Trag sie bitte von Hand ein.</span></p>`);
				} else _push(`<!---->`);
				if (powerMismatch.value) {
					_push(`<p class="notice notice--warn" role="alert" data-v-23e539b7>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "warning",
						size: 20
					}, null, _parent));
					_push(`<span data-v-23e539b7> Laut Foto hat dein Fahrzeug ${(0, server_renderer_exports.ssrInterpolate)(readPowerKw.value)} kW (Feld P.2), gewählt ist eine Variante mit ${(0, server_renderer_exports.ssrInterpolate)(__props.powerKw)} kW. Prüf bitte, ob du die richtige Variante gewählt hast – davon hängt ab, welche Felgen freigegeben sind. </span></p>`);
				} else _push(`<!---->`);
				_push(`</div><div class="pp__grid" data-v-23e539b7><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(FIELDS.value, (field) => {
					_push(`<div class="form-field" data-v-23e539b7><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `pp-${field.key}`)} data-v-23e539b7>${(0, server_renderer_exports.ssrInterpolate)(field.label)}<span class="visually-hidden" data-v-23e539b7> (${(0, server_renderer_exports.ssrInterpolate)(field.unit)})</span></label><div class="input-group" data-v-23e539b7><input${(0, server_renderer_exports.ssrRenderAttr)("id", `pp-${field.key}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", form[field.key])} class="input" type="number"${(0, server_renderer_exports.ssrRenderAttr)("min", field.min)}${(0, server_renderer_exports.ssrRenderAttr)("max", field.max)} inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value[field.key] ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `pp-${field.key}-err`)} data-v-23e539b7><span class="input-group__suffix" aria-hidden="true" translate="no" data-v-23e539b7>${(0, server_renderer_exports.ssrInterpolate)(field.unit)}</span></div><p${(0, server_renderer_exports.ssrRenderAttr)("id", `pp-${field.key}-err`)} class="form-field__error" data-v-23e539b7>${(0, server_renderer_exports.ssrInterpolate)(errors.value[field.key])}</p></div>`);
				});
				_push(`<!--]--></div><figure class="pp__figure" data-v-23e539b7><div class="pp__variants" role="group" aria-label="Welches Dokument hast du?" data-v-23e539b7><button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", variant.value === "neu" ? "true" : "false")} data-v-23e539b7>Zulassungsbescheinigung Teil I</button><button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", variant.value === "alt" ? "true" : "false")} data-v-23e539b7>Alter Fahrzeugschein</button></div>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(PapersFacsimile_default, {
					variant: variant.value,
					width: 360,
					title: variant.value === "neu" ? "Zulassungsbescheinigung Teil I: die Felder 8.1, 8.2, T und P.2 sind markiert" : "Alter Fahrzeugschein: die Ziffern 6, 7 und 16 sind markiert"
				}, null, _parent));
				_push(`<figcaption class="pp__caption" data-v-23e539b7>${(0, server_renderer_exports.ssrInterpolate)(variant.value === "neu" ? "Die Achslasten stehen in 8.1 und 8.2, die Höchstgeschwindigkeit in T." : "Im alten Fahrzeugschein: Achslasten in Ziffer 16, Höchstgeschwindigkeit in Ziffer 6.")}</figcaption></figure><div class="pp__actions" data-v-23e539b7><button id="pp-save" class="btn btn--secondary btn--sm" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-23e539b7>Werte übernehmen</button><button class="btn btn--ghost btn--sm" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-23e539b7>Abbrechen</button>`);
				if (entered.value) _push(`<button class="btn btn--ghost btn--sm" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-23e539b7>Werte löschen</button>`);
				else _push(`<!---->`);
				_push(`</div></form>`);
			}
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/PapersForm.vue
var _sfc_setup$2 = PapersForm_vue_vue_type_script_setup_true_lang_default.setup;
PapersForm_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/PapersForm.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var PapersForm_default = /*#__PURE__*/ _plugin_vue_export_helper_default(PapersForm_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-23e539b7"]]);
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
		chosen: { default: null }
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
		const entryLine = (0, vue_exports.computed)(() => {
			const verdict = props.verdict;
			if (verdict === null || verdict.status !== "PERMITTED" && verdict.status !== "CONDITIONAL") return null;
			if (chosenSize.value !== null) return entryLineOrNone(props.chosen?.entry ?? verdict.requiresEntry, verdict.papersExempt === true);
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
			const chosen = chosenSize.value;
			const applies = (i) => chosen === null || !i.sizes?.length || i.sizes.includes(chosen);
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
				default: return (props.verdict.missing ?? []).length > 0 ? `Noch offen für ${props.vehicle.label}` : `Keine Freigabe hinterlegt für ${props.vehicle.label}`;
			}
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["rcheck-panel", tone.value.cls] }, _attrs))} data-v-0a546491><p class="rcheck-panel__head" data-v-0a546491>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default$1, {
				name: tone.value.icon,
				size: 20
			}, null, _parent));
			_push(` RIMIFY-Check </p><p class="rcheck-panel__vehicle" data-v-0a546491>${(0, server_renderer_exports.ssrInterpolate)(headline.value)}</p>`);
			if (notesOnly.value) _push(`<p class="fit__notes" data-v-0a546491>Mit Hinweisen aus dem Gutachten – nichts davon musst du tun.</p>`);
			else _push(`<!---->`);
			if (__props.verdict && verdictEntry.value) {
				_push(`<!--[--><p class="fit__entry fit__entry--verdict" data-v-0a546491>${(0, server_renderer_exports.ssrInterpolate)(verdictEntry.value)}</p>`);
				if (entryNote.value) _push(`<p class="quiet fit__note" data-v-0a546491>${(0, server_renderer_exports.ssrInterpolate)(entryNote.value)}</p>`);
				else _push(`<!---->`);
				if (papersExemptLine.value) _push(`<p class="fit__entry fit__papers" data-v-0a546491>${(0, server_renderer_exports.ssrInterpolate)(papersExemptLine.value)}</p>`);
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
				if (__props.verdict.wheelLabel && __props.verdict.tyre) _push(`<dl class="fit__halves" data-v-0a546491><div class="fit__half" data-v-0a546491><dt data-v-0a546491>Felge</dt><dd data-v-0a546491>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.wheelLabel)}</dd></div><div class="fit__half"${(0, server_renderer_exports.ssrRenderAttr)("data-tyre", __props.verdict.tyre.status)} data-v-0a546491><dt data-v-0a546491>Reifen</dt><dd data-v-0a546491>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.tyre.label)}</dd></div></dl>`);
				else _push(`<!---->`);
				if (__props.verdict.tyre?.summary) {
					_push(`<!--[--><p class="fit__tyre-summary" data-v-0a546491>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: __props.verdict.tyre.summary }, null, _parent));
					_push(`</p>`);
					if (__props.verdict.tyre.basis) _push(`<p class="fit__tyre-basis" data-v-0a546491>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.tyre.basis)}</p>`);
					else _push(`<!---->`);
					if (__props.verdict.tyre.lines.length) {
						_push(`<details class="fit__sum"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.verdict.tyre.open || void 0) ? " open" : ""} data-v-0a546491><summary class="fit__sum-toggle" data-v-0a546491>So haben wir gerechnet</summary><ul class="fit__tyre-lines" data-v-0a546491><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.verdict.tyre.lines, (line) => {
							_push(`<li data-v-0a546491>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: line }, null, _parent));
							_push(`</li>`);
						});
						_push(`<!--]--></ul></details>`);
					} else _push(`<!---->`);
					_push(`<!--]-->`);
				} else if (__props.verdict.tyre?.lines.length) {
					_push(`<ul class="fit__tyre-lines" data-v-0a546491><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.verdict.tyre.lines, (line) => {
						_push(`<li data-v-0a546491>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: line }, null, _parent));
						_push(`</li>`);
					});
					_push(`<!--]--></ul>`);
				} else _push(`<!---->`);
				if (__props.vehicle && __props.verdict.tyre) _push((0, server_renderer_exports.ssrRenderComponent)(PapersForm_default, {
					key: __props.vehicle.id,
					"vehicle-id": __props.vehicle.id,
					papers: __props.vehicle.papers ?? null,
					"power-kw": __props.vehicle.powerKw ?? null
				}, null, _parent));
				else _push(`<!---->`);
				if (detail.value && overview.value.length) {
					_push(`<div class="fit__overview" data-v-0a546491><p class="label fit__overview-h" data-v-0a546491>Das verlangt das Gutachten`);
					if (chosenSize.value) _push(`<!--[--> mit <span class="data" translate="no" data-v-0a546491>${(0, server_renderer_exports.ssrInterpolate)(chosenSize.value)}</span><!--]-->`);
					else _push(`<!---->`);
					_push(`</p><p class="small fit__overview-line" data-v-0a546491>${(0, server_renderer_exports.ssrInterpolate)(overview.value.join(" · "))} · <a class="fit__to-detail" href="#auflagen" data-v-0a546491>alle Auflagen im Wortlaut</a></p></div>`);
				} else if (!detail.value && __props.chosen) _push((0, server_renderer_exports.ssrRenderComponent)(ConditionGroups_default, {
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
					_push(`<ul class="fit__conditions" data-v-0a546491><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(conditions.value, (condition) => {
						_push(`<li data-v-0a546491>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
					});
					_push(`<!--]--></ul>`);
				} else _push(`<!---->`);
				if (sizes.value.length) _push(`<div class="fit__tyres" data-v-0a546491><span class="label" data-v-0a546491>Zulässige Reifengrößen</span><p class="data" data-v-0a546491>${(0, server_renderer_exports.ssrInterpolate)(sizes.value.join(" · "))}</p></div>`);
				else _push(`<!---->`);
				if (__props.verdict.reason && !(__props.verdict.missing ?? []).length && !(__props.verdict.tyre?.lines ?? []).includes(__props.verdict.reason) && __props.verdict.reason !== __props.verdict.tyre?.summary) _push(`<p class="fit__reason" data-v-0a546491>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.reason)}</p>`);
				else _push(`<!---->`);
				if (documentLine.value) {
					_push(`<p class="fit__doc" data-v-0a546491>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default$1, {
						name: "document",
						size: 20
					}, null, _parent));
					_push(`<span class="data" data-v-0a546491>${(0, server_renderer_exports.ssrInterpolate)(documentLine.value)}</span></p>`);
				} else _push(`<!---->`);
				_push(`<!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.verdict.document?.notes ?? [], (note) => {
					_push(`<p class="fit__note" data-v-0a546491>${(0, server_renderer_exports.ssrInterpolate)(note)}</p>`);
				});
				_push(`<!--]-->`);
				if (__props.verdict.document?.pdf) {
					_push(`<p class="fit__pdf" data-v-0a546491><a class="link"${(0, server_renderer_exports.ssrRenderAttr)("href", __props.verdict.document.pdf.url)} target="_blank" rel="noopener" data-v-0a546491> Gutachten öffnen (PDF`);
					if (__props.verdict.document.pdf.page) _push(`<!--[-->, Seite ${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.document.pdf.page)}<!--]-->`);
					else _push(`<!---->`);
					_push(`) </a></p>`);
				} else _push(`<!---->`);
				if (__props.vehicle && __props.configId) _push(`<p class="fit__pdf" data-v-0a546491><button class="link fit__issue" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(issuing.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", issuing.value ? "true" : void 0)} data-v-0a546491>${(0, server_renderer_exports.ssrInterpolate)(__props.issueLabel)}</button></p>`);
				else _push(`<!---->`);
				_push(`<!--]-->`);
			} else if (__props.vehicle === null) _push(`<p class="quiet fit__note" data-v-0a546491> Ohne Fahrzeug können wir keine Freigabe bestätigen. </p>`);
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
var FitmentPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FitmentPanel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-0a546491"]]);
//#endregion
//#region resources/js/Components/Product/KomplettradChoice.vue?vue&type=script&setup=true&lang.ts
var FALLBACK_REFUSAL = "Passende Reifen für diese Größe haben wir gerade nicht vorrätig. Die Felge allein kannst du bestellen.";
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
		"colourId": { default: null },
		"colourIdModifiers": {},
		"rdks": { default: null },
		"rdksModifiers": {}
	}),
	emits: [
		"update:modelValue",
		"update:colourId",
		"update:rdks"
	],
	setup(__props) {
		/**
		* The Komplettrad in the purchase panel (the client's #18): with „Komplettrad“ chosen, the tyres the verdict permits on
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
		* missing, the contact form when a person has to look at it.
		*/
		const page = usePage();
		const props = __props;
		/** The tyre chosen; the page keeps it, so a size change can choose again. */
		const tyreId = (0, vue_exports.useModel)(__props, "modelValue");
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
		const refusal = (0, vue_exports.computed)(() => props.offer.refusal ?? (props.offer.tyres.length === 0 ? FALLBACK_REFUSAL : null));
		const forward = (0, vue_exports.computed)(() => {
			const code = props.offer.refusalCode ?? null;
			return {
				vehicle: code === "NO_VEHICLE" || code === "VERDICT_RESTORED",
				contact: code !== "NO_VEHICLE"
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
		function labelOf(tyre) {
			const label = tyre.label;
			if (label === null || !isTyreClass(label.fuel) || !isTyreClass(label.wetGrip) || label.noiseDb === null || !isNoiseClass(label.noiseClass)) return null;
			return {
				fuel: label.fuel,
				wet: label.wetGrip,
				noiseDb: label.noiseDb,
				noiseClass: label.noiseClass,
				eprelId: label.eprelId,
				title: `${tyre.brandName} ${tyre.name} · ${tyre.sizeLabel}`
			};
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
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "kc" }, _attrs))} data-v-525564ed>`);
			if (refusal.value) {
				_push(`<div class="notice kc__refusal" data-v-525564ed>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "info",
					size: 20
				}, null, _parent));
				_push(`<div data-v-525564ed><p class="kc__refusal-text" data-v-525564ed>${(0, server_renderer_exports.ssrInterpolate)(refusal.value)}</p>`);
				if (forward.value.vehicle || forward.value.contact) {
					_push(`<p class="kc__routes" data-v-525564ed>`);
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
			} else {
				_push(`<fieldset class="kc__group" data-v-525564ed><legend class="label kc__legend" data-v-525564ed>Reifen</legend>`);
				if (__props.offer.minSentence) _push(`<p class="small muted kc__min" data-v-525564ed>${(0, server_renderer_exports.ssrInterpolate)(__props.offer.minSentence)}</p>`);
				else _push(`<!---->`);
				_push(`<ul class="kc__rows" role="list" data-v-525564ed><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(shownCards.value, (card) => {
					_push(`<li data-v-525564ed><label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kc-row--on": card.tyre.id === tyreId.value }, "kc-row"])}" data-v-525564ed><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(tyreId.value, card.tyre.id)) ? " checked" : ""} class="kc-row__radio" type="radio" name="kc-tyre"${(0, server_renderer_exports.ssrRenderAttr)("value", card.tyre.id)} data-v-525564ed><span class="kc-row__body" data-v-525564ed><span class="kc-row__name" data-v-525564ed><span class="kc-row__brand" data-v-525564ed>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.brandName)}</span> ${(0, server_renderer_exports.ssrInterpolate)(card.tyre.name)}</span><span class="kc-row__meta" data-v-525564ed>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.seasonLabel)} · <span class="data" data-v-525564ed>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.sizeLabel)}</span></span>`);
					if (card.label) _push(`<span class="kc-row__eu num" data-v-525564ed> Kraftstoffeffizienz ${(0, server_renderer_exports.ssrInterpolate)(card.label.fuel)} · Nasshaftung ${(0, server_renderer_exports.ssrInterpolate)(card.label.wet)} · ${(0, server_renderer_exports.ssrInterpolate)(card.label.noiseDb)} dB (${(0, server_renderer_exports.ssrInterpolate)(card.label.noiseClass)}) </span>`);
					else _push(`<!---->`);
					_push(`</span><span class="kc-row__price" data-v-525564ed><span class="kc-row__amount num" data-v-525564ed>${(0, server_renderer_exports.ssrInterpolate)(perWheel(card.tyre))}</span><span class="kc-row__per" data-v-525564ed>je Rad</span></span></label></li>`);
				});
				_push(`<!--]--></ul>`);
				if (cards.value.length > SHOWN && !expanded.value) _push(`<button type="button" class="link kc__more" data-v-525564ed> Alle ${(0, server_renderer_exports.ssrInterpolate)(cards.value.length)} Reifen zeigen </button>`);
				else _push(`<!---->`);
				if (chosenLabel.value) _push((0, server_renderer_exports.ssrRenderComponent)(TyreLabel_default, (0, vue_exports.mergeProps)(chosenLabel.value, { class: "kc__label" }), null, _parent));
				else _push(`<!---->`);
				_push(`</fieldset>`);
			}
			if (!refusal.value && __props.options && __props.options.colours.length > 0) {
				_push(`<fieldset class="kc__group" data-v-525564ed><legend class="label kc__legend" data-v-525564ed>Wuchtgewichte</legend><p class="small muted kc__hint" data-v-525564ed>Die Gewichte sitzen innen an der Felge. Such dir die Farbe aus, die dir besser gefällt.</p><div class="kc__swatches" data-v-525564ed><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.options.colours, (colour) => {
					_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kc-swatch--on": colour.id === colourId.value }, "kc-swatch"])}" data-v-525564ed><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(colourId.value, colour.id)) ? " checked" : ""} class="visually-hidden" type="radio" name="kc-weights"${(0, server_renderer_exports.ssrRenderAttr)("value", colour.id)} data-v-525564ed><span class="kc-swatch__dot" data-qa-ignore style="${(0, server_renderer_exports.ssrRenderStyle)(swatchStyle(colour.swatchHex))}" aria-hidden="true" data-v-525564ed></span><span class="kc-swatch__name" data-v-525564ed>${(0, server_renderer_exports.ssrInterpolate)(colour.name)}</span><span class="kc-swatch__price num" data-v-525564ed>`);
					if (colour.surchargeCents === 0) _push(`<!--[-->ohne Aufpreis<!--]-->`);
					else _push(`<!--[-->+ ${(0, server_renderer_exports.ssrInterpolate)(colour.surcharge)} je Rad<!--]-->`);
					_push(`</span></label>`);
				});
				_push(`<!--]--></div></fieldset>`);
			} else _push(`<!---->`);
			if (!refusal.value && tpms.value) {
				_push(`<fieldset class="kc__group" data-v-525564ed><legend class="label kc__legend" data-v-525564ed>RDKS-Sensoren</legend><p class="small muted kc__hint" data-v-525564ed> Misst dein Auto den Reifendruck mit Sensoren in den Rädern, brauchen auch die neuen Räder Sensoren. Ob das so ist, steht in der Betriebsanleitung. </p>`);
				if (!tpms.value.available && tpms.value.notice) {
					_push(`<p class="notice kc__tpms-notice" data-v-525564ed><span data-v-525564ed>${(0, server_renderer_exports.ssrInterpolate)(tpms.value.notice)} `);
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
				_push(`<div class="kc__opts" data-v-525564ed>`);
				if (tpms.value.available) {
					_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kc-opt--on": rdks.value === "ja" }, "kc-opt"])}" data-v-525564ed><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(rdks.value, "ja")) ? " checked" : ""} class="visually-hidden" type="radio" name="kc-rdks" value="ja" data-v-525564ed><span class="kc-opt__name" data-v-525564ed>Mit RDKS-Sensoren</span><span class="kc-opt__price num" data-v-525564ed>+ ${(0, server_renderer_exports.ssrInterpolate)(tpms.value.yesTotal)}`);
					if (tpms.value.line) _push(`<!--[--> (${(0, server_renderer_exports.ssrInterpolate)(tpms.value.line)})<!--]-->`);
					else _push(`<!---->`);
					_push(`</span><span class="kc-opt__sub" data-v-525564ed>Wir setzen die Sensoren gleich mit ein.</span><span class="kc-opt__check" aria-hidden="true" data-v-525564ed>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "check",
						size: 20
					}, null, _parent));
					_push(`</span></label>`);
				} else _push(`<!---->`);
				_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kc-opt--on": rdks.value === "nein" }, "kc-opt"])}" data-v-525564ed><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(rdks.value, "nein")) ? " checked" : ""} class="visually-hidden" type="radio" name="kc-rdks" value="nein" data-v-525564ed><span class="kc-opt__name" data-v-525564ed>Ohne RDKS-Sensoren</span><span class="kc-opt__price" data-v-525564ed>ohne Aufpreis</span><span class="kc-opt__check" aria-hidden="true" data-v-525564ed>`);
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
var KomplettradChoice_default = /*#__PURE__*/ _plugin_vue_export_helper_default(KomplettradChoice_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-525564ed"]]);
//#endregion
export { BuyModeChoice_default as i, FitmentPanel_default as n, FitmentDetail_default as r, KomplettradChoice_default as t };
