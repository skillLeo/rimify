import { a as DialogOverlay_default, b as DialogClose_default, n as DialogTitle_default, r as DialogPortal_default, s as DialogContent_default, x as DialogRoot_default } from "./Dialog-BCc6LoyQ.js";
import { t as AppLayout_default } from "./AppLayout-D_djfKQR.js";
import { a as link_default, i as head_default, o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as Icon_default } from "./Icon-3RhMd4kb.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as useOcr } from "./useOcr-B_yIMiO_.js";
import { n as formatNumber } from "./num-Br8qlecZ.js";
import { i as withUnit, t as decimal } from "./format-BSciVE2Q.js";
import { t as Picture_default } from "./Picture-BWxCcOOb.js";
import { _ as useShared, l as usePriceTerms, s as priceTerms } from "./useShortcuts-ClS45_r5.js";
import { r as papersSVG, t as Svg_default } from "./Svg-BjJf-u_I.js";
import { t as Icon_default$1 } from "./Icon-BQovY8K8.js";
import { i as papersLine, r as entryLineOrNone } from "./papers-BnjNDdzi.js";
import { t as ValueText_default } from "./ValueText-BNPeepkT.js";
import { t as TyreLabel_default } from "./TyreLabel-iiA4vM5K.js";
import { t as BuildForm_default } from "./BuildForm-D9IpoIx0.js";
import { t as ProductPhoto_default } from "./ProductPhoto-DEWysAOS.js";
//#region resources/js/Components/Product/FitmentDetail.vue?vue&type=script&setup=true&lang.ts
var FitmentDetail_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "FitmentDetail",
	__ssrInlineRender: true,
	props: {
		detail: {},
		vehicleLabel: {}
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
			items: props.detail.sections.find((s) => s.title === title)?.items ?? []
		})).filter((section) => section.items.length > 0 || section.title === "Befestigung" && props.detail.fasteners.length > 0 || section.title === "Reifen" && props.detail.tyres.length > 0));
		const notes = (0, vue_exports.computed)(() => props.detail.sections.find((s) => s.title === "Hinweise")?.items ?? []);
		function forSizes(sizes) {
			if (!sizes?.length) return null;
			return `Nur bei ${sizes.length === 1 ? sizes[0] : `${sizes.slice(0, -1).join(", ")} und ${sizes[sizes.length - 1]}`}`;
		}
		const hasOwn = (0, vue_exports.computed)(() => props.detail.sections.some((s) => s.items.some((i) => i.own)));
		const namesNachtrag = (0, vue_exports.computed)(() => props.detail.fasteners.some((f) => /Nachtrag/.test(f.limit ?? "")));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				id: "auflagen",
				class: "fdt",
				"aria-labelledby": "fdt-h"
			}, _attrs))} data-v-24163c41><h2 id="fdt-h" class="h2 fdt__h" tabindex="-1" data-v-24163c41>Was das Gutachten für deinen ${(0, server_renderer_exports.ssrInterpolate)(__props.vehicleLabel)} verlangt</h2><p class="small muted fdt__lede" data-v-24163c41> Wörtlich aus dem Gutachten.`);
			if (hasOwn.value) _push(`<!--[--> Was mit „Unser Hinweis“ beginnt, kommt von uns.<!--]-->`);
			else _push(`<!---->`);
			_push(`</p><div class="fdt__cols" data-v-24163c41><div class="fdt__main" data-v-24163c41><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(todo.value, (section) => {
				_push(`<div class="fdt__sec" data-v-24163c41><h3 class="h4 fdt__sec-h" data-v-24163c41>${(0, server_renderer_exports.ssrInterpolate)(section.title)}</h3>`);
				if (section.items.length) {
					_push(`<ul class="fdt__list" data-v-24163c41><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(section.items, (item) => {
						_push(`<li data-v-24163c41>`);
						if (forSizes(item.sizes)) _push(`<span class="fdt__for" data-v-24163c41>${(0, server_renderer_exports.ssrInterpolate)(forSizes(item.sizes))}</span>`);
						else _push(`<!---->`);
						if (item.own) _push(`<span class="fdt__own" data-v-24163c41>Unser Hinweis: </span>`);
						else _push(`<!---->`);
						_push(`${(0, server_renderer_exports.ssrInterpolate)(item.text)} `);
						if (item.measures.length) {
							_push(`<ul class="fdt__measures" data-v-24163c41><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(item.measures, (measure) => {
								_push(`<li data-v-24163c41>${(0, server_renderer_exports.ssrInterpolate)(measure)}</li>`);
							});
							_push(`<!--]--></ul>`);
						} else _push(`<!---->`);
						_push(`</li>`);
					});
					_push(`<!--]--></ul>`);
				} else _push(`<!---->`);
				if (section.title === "Befestigung" && __props.detail.fasteners.length) {
					_push(`<table class="fdt__table" data-v-24163c41><thead data-v-24163c41><tr data-v-24163c41><th scope="col" data-v-24163c41>Schraube</th><th scope="col" data-v-24163c41>Anzugsmoment</th><th scope="col" data-v-24163c41>Artikel</th><th scope="col" data-v-24163c41>Gilt</th></tr></thead><tbody data-v-24163c41><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.detail.fasteners, (bolt) => {
						_push(`<tr data-v-24163c41><td data-label="Schraube" class="fdt__key" data-v-24163c41>`);
						if (bolt.number) _push(`<!--[-->Nr. ${(0, server_renderer_exports.ssrInterpolate)(bolt.number)} · <!--]-->`);
						else _push(`<!---->`);
						_push(`${(0, server_renderer_exports.ssrInterpolate)(bolt.label)}</td><td data-label="Anzugsmoment" class="fdt__num" data-v-24163c41>${(0, server_renderer_exports.ssrInterpolate)(bolt.torque ?? "–")}</td><td data-label="Artikel" data-v-24163c41>${(0, server_renderer_exports.ssrInterpolate)(bolt.article ?? "–")}</td><td data-label="Gilt" data-v-24163c41>${(0, server_renderer_exports.ssrInterpolate)(bolt.limit ?? "für diesen Typ")}</td></tr>`);
					});
					_push(`<!--]--></tbody></table>`);
				} else _push(`<!---->`);
				if (section.title === "Befestigung" && namesNachtrag.value) _push(`<p class="small muted fdt__aside" data-v-24163c41> „Nachtrag“ meint hier den Stand der EG-Typgenehmigung deines Fahrzeugs, nicht den des Gutachtens. Er steht in Feld K der Zulassungsbescheinigung Teil I: die Ziffern nach dem letzten Sternchen, bei …*04 also „04“. </p>`);
				else _push(`<!---->`);
				if (section.title === "Reifen" && __props.detail.tyres.length) {
					_push(`<table class="fdt__table" data-v-24163c41><thead data-v-24163c41><tr data-v-24163c41><th scope="col" data-v-24163c41>Größe</th><th scope="col" data-v-24163c41>Achse</th><th scope="col" data-v-24163c41>Leistung</th><th scope="col" data-v-24163c41>Mindestens laut Gutachten</th></tr></thead><tbody data-v-24163c41><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.detail.tyres, (size) => {
						_push(`<tr data-v-24163c41><td data-label="Größe" class="fdt__key fdt__num" data-v-24163c41>${(0, server_renderer_exports.ssrInterpolate)(size.label)}</td><td data-label="Achse" data-v-24163c41>${(0, server_renderer_exports.ssrInterpolate)(size.axle)}</td><td data-label="Leistung" class="fdt__num" data-v-24163c41>${(0, server_renderer_exports.ssrInterpolate)(size.band ?? "–")}</td><td data-label="Mindestens laut Gutachten" data-v-24163c41>${(0, server_renderer_exports.ssrInterpolate)(size.minimum ?? "–")}</td></tr>`);
					});
					_push(`<!--]--></tbody></table>`);
				} else _push(`<!---->`);
				_push(`</div>`);
			});
			_push(`<!--]--></div>`);
			if (notes.value.length || __props.detail.notices.length) {
				_push(`<div class="fdt__side" data-v-24163c41>`);
				if (notes.value.length) {
					_push(`<div class="fdt__sec" data-v-24163c41><h3 class="h4 fdt__sec-h" data-v-24163c41>Hinweise</h3><ul class="fdt__list fdt__list--note" data-v-24163c41><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(notes.value, (item) => {
						_push(`<li data-v-24163c41>`);
						if (forSizes(item.sizes)) _push(`<span class="fdt__for" data-v-24163c41>${(0, server_renderer_exports.ssrInterpolate)(forSizes(item.sizes))}</span>`);
						else _push(`<!---->`);
						if (item.own) _push(`<span class="fdt__own" data-v-24163c41>Unser Hinweis: </span>`);
						else _push(`<!---->`);
						_push(`${(0, server_renderer_exports.ssrInterpolate)(item.text)}</li>`);
					});
					_push(`<!--]--></ul></div>`);
				} else _push(`<!---->`);
				if (__props.detail.notices.length) {
					_push(`<div class="fdt__sec" data-v-24163c41><h3 class="h4 fdt__sec-h" data-v-24163c41>Hinweise des Gutachtens</h3><ul class="fdt__list fdt__list--note" data-v-24163c41><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.detail.notices, (notice) => {
						_push(`<li data-v-24163c41>${(0, server_renderer_exports.ssrInterpolate)(notice)}</li>`);
					});
					_push(`<!--]--></ul></div>`);
				} else _push(`<!---->`);
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`</div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/FitmentDetail.vue
var _sfc_setup$5 = FitmentDetail_vue_vue_type_script_setup_true_lang_default.setup;
FitmentDetail_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/FitmentDetail.vue");
	return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
var FitmentDetail_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FitmentDetail_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-24163c41"]]);
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
var _sfc_setup$4 = PapersFacsimile_vue_vue_type_script_setup_true_lang_default.setup;
PapersFacsimile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Art/PapersFacsimile.vue");
	return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
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
var _sfc_setup$3 = PapersForm_vue_vue_type_script_setup_true_lang_default.setup;
PapersForm_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/PapersForm.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
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
		configId: {}
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
		const issuing = (0, vue_exports.ref)(false);
		const tone = (0, vue_exports.computed)(() => {
			if (props.vehicle === null || props.verdict === null) return {
				cls: "rcheck-panel--unknown",
				icon: "info"
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
			return entryLineOrNone(verdict.requiresEntry, verdict.papersExempt === true);
		});
		const papersExemptLine = (0, vue_exports.computed)(() => entryLine.value === null ? null : papersLine(props.verdict?.papersExempt === true));
		const conditions = (0, vue_exports.computed)(() => (props.verdict?.conditions ?? []).filter((condition) => condition !== entryLine.value));
		const detail = (0, vue_exports.computed)(() => props.verdict?.detail ?? null);
		const overview = (0, vue_exports.computed)(() => {
			const view = detail.value;
			if (view === null) return [];
			const lines = [];
			const items = (title) => view.sections.find((s) => s.title === title)?.items.filter((i) => i.text !== entryLine.value).length ?? 0;
			const work = items("Arbeiten am Fahrzeug");
			const first = view.fasteners[0];
			const bySize = view.sections.find((s) => s.title === "Arbeiten am Fahrzeug")?.items.some((i) => i.sizes?.length) ?? false;
			if (items("Abnahme") > 0) lines.push("Abnahme beim Prüfer");
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
			switch (props.verdict.status) {
				case "PERMITTED": return `Freigegeben für ${props.vehicle.label}`;
				case "CONDITIONAL": return `Mit Auflagen freigegeben für ${props.vehicle.label}`;
				case "NOT_PERMITTED": return `Nicht freigegeben für ${props.vehicle.label}`;
				default: return (props.verdict.missing ?? []).length > 0 ? `Noch offen für ${props.vehicle.label}` : `Keine Freigabe hinterlegt für ${props.vehicle.label}`;
			}
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["rcheck-panel", tone.value.cls] }, _attrs))} data-v-fdd7bfcf><p class="rcheck-panel__head" data-v-fdd7bfcf>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default$1, {
				name: tone.value.icon,
				size: 20
			}, null, _parent));
			_push(` RIMIFY-CHECK </p><p class="rcheck-panel__vehicle" data-v-fdd7bfcf>${(0, server_renderer_exports.ssrInterpolate)(headline.value)}</p>`);
			if (__props.verdict) {
				_push(`<!--[-->`);
				if (__props.vehicle) _push((0, server_renderer_exports.ssrRenderComponent)(BuildForm_default, {
					key: `build-${__props.vehicle.id}`,
					"vehicle-id": __props.vehicle.id,
					build: __props.vehicle.build ?? null,
					missing: __props.verdict.missing ?? []
				}, null, _parent));
				else _push(`<!---->`);
				if (__props.verdict.wheelLabel && __props.verdict.tyre) _push(`<dl class="fit__halves" data-v-fdd7bfcf><div class="fit__half" data-v-fdd7bfcf><dt data-v-fdd7bfcf>Felge</dt><dd data-v-fdd7bfcf>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.wheelLabel)}</dd></div><div class="fit__half"${(0, server_renderer_exports.ssrRenderAttr)("data-tyre", __props.verdict.tyre.status)} data-v-fdd7bfcf><dt data-v-fdd7bfcf>Reifen</dt><dd data-v-fdd7bfcf>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.tyre.label)}</dd></div></dl>`);
				else _push(`<!---->`);
				if (__props.verdict.tyre?.summary) {
					_push(`<!--[--><p class="fit__tyre-summary" data-v-fdd7bfcf>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: __props.verdict.tyre.summary }, null, _parent));
					_push(`</p>`);
					if (__props.verdict.tyre.basis) _push(`<p class="fit__tyre-basis" data-v-fdd7bfcf>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.tyre.basis)}</p>`);
					else _push(`<!---->`);
					if (__props.verdict.tyre.lines.length) {
						_push(`<details class="fit__sum"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.verdict.tyre.open || void 0) ? " open" : ""} data-v-fdd7bfcf><summary class="fit__sum-toggle" data-v-fdd7bfcf>So haben wir gerechnet</summary><ul class="fit__tyre-lines" data-v-fdd7bfcf><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.verdict.tyre.lines, (line) => {
							_push(`<li data-v-fdd7bfcf>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: line }, null, _parent));
							_push(`</li>`);
						});
						_push(`<!--]--></ul></details>`);
					} else _push(`<!---->`);
					_push(`<!--]-->`);
				} else if (__props.verdict.tyre?.lines.length) {
					_push(`<ul class="fit__tyre-lines" data-v-fdd7bfcf><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.verdict.tyre.lines, (line) => {
						_push(`<li data-v-fdd7bfcf>`);
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
				if (entryLine.value) _push(`<p class="fit__entry" data-v-fdd7bfcf>${(0, server_renderer_exports.ssrInterpolate)(entryLine.value)}</p>`);
				else _push(`<!---->`);
				if (entryLine.value && __props.verdict.entryNoteDe) _push(`<p class="quiet fit__note" data-v-fdd7bfcf>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.entryNoteDe)}</p>`);
				else _push(`<!---->`);
				if (papersExemptLine.value) _push(`<p class="fit__entry fit__papers" data-v-fdd7bfcf>${(0, server_renderer_exports.ssrInterpolate)(papersExemptLine.value)}</p>`);
				else _push(`<!---->`);
				if (detail.value && overview.value.length) _push(`<div class="fit__overview" data-v-fdd7bfcf><p class="label fit__overview-h" data-v-fdd7bfcf>Das verlangt das Gutachten</p><p class="small fit__overview-line" data-v-fdd7bfcf>${(0, server_renderer_exports.ssrInterpolate)(overview.value.join(" · "))} · <a class="fit__to-detail" href="#auflagen" data-v-fdd7bfcf>alle Auflagen im Wortlaut</a></p></div>`);
				else if (!detail.value && conditions.value.length) {
					_push(`<ul class="fit__conditions" data-v-fdd7bfcf><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(conditions.value, (condition) => {
						_push(`<li data-v-fdd7bfcf>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
					});
					_push(`<!--]--></ul>`);
				} else _push(`<!---->`);
				if (sizes.value.length) _push(`<div class="fit__tyres" data-v-fdd7bfcf><span class="micro" data-v-fdd7bfcf>Passende Reifengrößen</span><p class="data" data-v-fdd7bfcf>${(0, server_renderer_exports.ssrInterpolate)(sizes.value.join(" · "))}</p></div>`);
				else _push(`<!---->`);
				if (__props.verdict.reason && !(__props.verdict.missing ?? []).length && !(__props.verdict.tyre?.lines ?? []).includes(__props.verdict.reason) && __props.verdict.reason !== __props.verdict.tyre?.summary) _push(`<p class="fit__reason" data-v-fdd7bfcf>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.reason)}</p>`);
				else _push(`<!---->`);
				if (documentLine.value) {
					_push(`<p class="fit__doc" data-v-fdd7bfcf>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default$1, {
						name: "document",
						size: 20
					}, null, _parent));
					_push(`<span class="data" data-v-fdd7bfcf>${(0, server_renderer_exports.ssrInterpolate)(documentLine.value)}</span></p>`);
				} else _push(`<!---->`);
				_push(`<!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.verdict.document?.notes ?? [], (note) => {
					_push(`<p class="fit__note" data-v-fdd7bfcf>${(0, server_renderer_exports.ssrInterpolate)(note)}</p>`);
				});
				_push(`<!--]-->`);
				if (__props.verdict.document?.pdf) {
					_push(`<p class="fit__pdf" data-v-fdd7bfcf><a${(0, server_renderer_exports.ssrRenderAttr)("href", __props.verdict.document.pdf.url)} target="_blank" rel="noopener" data-v-fdd7bfcf> Gutachten öffnen (PDF`);
					if (__props.verdict.document.pdf.page) _push(`<!--[-->, Seite ${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.document.pdf.page)}<!--]-->`);
					else _push(`<!---->`);
					_push(`) </a></p>`);
				} else _push(`<!---->`);
				if (__props.vehicle && __props.configId) _push(`<p class="fit__pdf" data-v-fdd7bfcf><button class="link fit__issue" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(issuing.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", issuing.value ? "true" : void 0)} data-v-fdd7bfcf> RIMIFY-Check drucken oder teilen </button></p>`);
				else _push(`<!---->`);
				_push(`<!--]-->`);
			} else if (__props.vehicle === null) _push(`<p class="quiet fit__note" data-v-fdd7bfcf> Ohne Fahrzeug können wir keine Freigabe bestätigen. </p>`);
			else _push(`<!---->`);
			(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent);
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/FitmentPanel.vue
var _sfc_setup$2 = FitmentPanel_vue_vue_type_script_setup_true_lang_default.setup;
FitmentPanel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/FitmentPanel.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var FitmentPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FitmentPanel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-fdd7bfcf"]]);
//#endregion
//#region resources/js/Components/Product/KomplettradOffer.vue?vue&type=script&setup=true&lang.ts
var FALLBACK_REFUSAL = "Passende Reifen für diese Größe haben wir gerade nicht vorrätig. Die Felge allein kannst du bestellen.";
var KomplettradOffer_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "KomplettradOffer",
	__ssrInlineRender: true,
	props: {
		offer: {},
		wheelConfigId: {},
		contactEmail: {}
	},
	setup(__props) {
		/**
		* The Komplettrad offer on the product page: every tyre the verdict permits on the chosen size,
		* priced per wheel on the server — or the one sentence saying why there is none, always with a
		* way forward. Never an empty panel and never a dead end (R-09 in spirit).
		*
		* Nothing here decides anything. The server chose the tyres (`TyreEligibility`, R-13), priced
		* them (`KomplettradPricer`) and formatted every figure (R-10); this component prints strings and
		* posts an id. The basket checks the combination again on the server whatever was shown (R-11).
		*
		* The refusal code is never rendered — it only picks which routes forward make sense: the
		* selector when the car is missing, the shop's e-mail when a person has to look at it, and the
		* plain Felgen purchase whenever the rim alone is still buyable.
		*/
		const terms = usePriceTerms();
		const props = __props;
		const form = useForm({
			kind: "WHEEL",
			wheelConfigId: 0,
			tyreVariantId: 0,
			quantity: 4
		});
		const refusal = (0, vue_exports.computed)(() => {
			const offer = props.offer;
			if (offer === null) return null;
			return offer.refusal ?? (offer.tyres.length === 0 ? FALLBACK_REFUSAL : null);
		});
		const RIM_NOT_SOLD = [
			"VERDICT_NOT_PERMITTED",
			"VERDICT_UNKNOWN",
			"VERDICT_RESTORED",
			"TYRES_UNKNOWN",
			"TYRES_NOT_PERMITTED"
		];
		const forward = (0, vue_exports.computed)(() => {
			const code = props.offer?.refusalCode ?? null;
			return {
				vehicle: code === "NO_VEHICLE" || code === "VERDICT_RESTORED",
				contact: code !== "NO_VEHICLE",
				wheelsOnly: code === null || !RIM_NOT_SOLD.includes(code)
			};
		});
		const mailto = (0, vue_exports.computed)(() => `mailto:${props.contactEmail}`);
		const error = (0, vue_exports.computed)(() => form.errors.tyreVariantId ?? form.errors.wheelConfigId ?? null);
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
		const cards = (0, vue_exports.computed)(() => (props.offer?.tyres ?? []).map((tyre) => ({
			tyre,
			label: labelOf(tyre)
		})));
		return (_ctx, _push, _parent, _attrs) => {
			if (__props.offer) {
				_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
					class: "kr",
					"aria-labelledby": "kr-heading"
				}, _attrs))} data-v-5a44ee58><h2 id="kr-heading" class="t-h2" data-v-5a44ee58>Komplettrad – Felge mit Reifen, montiert und gewuchtet</h2><p class="t-body kr__lead" data-v-5a44ee58> Wir ziehen den Reifen auf die Felge, wuchten das Rad aus und liefern es fertig montiert. Die Farbe der Wuchtgewichte wählst du im Warenkorb. </p>`);
				if (__props.offer.minSentence) _push(`<p class="t-small kr__min" data-v-5a44ee58>${(0, server_renderer_exports.ssrInterpolate)(__props.offer.minSentence)}</p>`);
				else _push(`<!---->`);
				if (refusal.value) {
					_push(`<div class="notice kr__refusal" data-v-5a44ee58>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "info",
						size: 20
					}, null, _parent));
					_push(`<div data-v-5a44ee58><p class="kr__refusal-text" data-v-5a44ee58>${(0, server_renderer_exports.ssrInterpolate)(refusal.value)}</p><p class="kr__routes" data-v-5a44ee58>`);
					if (forward.value.vehicle) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: "/felgen-suchen",
						class: "btn btn--secondary btn--sm"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(` Fahrzeug wählen `);
							else return [(0, vue_exports.createTextVNode)(" Fahrzeug wählen ")];
						}),
						_: 1
					}, _parent));
					else _push(`<!---->`);
					if (forward.value.contact) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", mailto.value)} class="link kr__mail" data-v-5a44ee58>Schreib uns</a>`);
					else _push(`<!---->`);
					if (forward.value.wheelsOnly) _push(`<a href="#felgen-kaufen" class="link kr__wheels-only" data-v-5a44ee58> Nur die Felgen bestellen </a>`);
					else _push(`<!---->`);
					_push(`</p></div></div>`);
				} else {
					_push(`<!--[-->`);
					if (error.value) {
						_push(`<p class="notice notice--bad kr__error" role="alert" data-v-5a44ee58>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "warning",
							size: 20
						}, null, _parent));
						_push(`<span data-v-5a44ee58>${(0, server_renderer_exports.ssrInterpolate)(error.value)}</span></p>`);
					} else _push(`<!---->`);
					_push(`<ul class="kr__grid" role="list" data-v-5a44ee58><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(cards.value, (card) => {
						_push(`<li class="kr-card" data-v-5a44ee58><span class="micro" data-v-5a44ee58>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.brandName)}</span><h3 class="kr-card__name" data-v-5a44ee58>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.name)}</h3><p class="kr-card__meta" data-v-5a44ee58>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.seasonLabel)} · <span class="data" data-v-5a44ee58>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.sizeLabel)}</span></p>`);
						if (card.label) _push((0, server_renderer_exports.ssrRenderComponent)(TyreLabel_default, (0, vue_exports.mergeProps)({ ref_for: true }, card.label, { class: "kr-card__label" }), null, _parent));
						else _push(`<!---->`);
						_push(`<div class="kr-card__price" data-v-5a44ee58><p class="price" data-v-5a44ee58>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.perWheel)}</p><p class="price-note" data-v-5a44ee58>Preis je Rad, inklusive Reifen, Montage und Wuchtgewichten.</p><p class="price-note" data-v-5a44ee58>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(terms).note)}</p><p class="t-small kr-card__set" data-v-5a44ee58><span class="tabular" data-v-5a44ee58>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.forFour)}</span> für 4 Kompletträder </p>`);
						if (__props.offer.priceOpen) _push(`<p class="t-small quiet kr-card__open" data-v-5a44ee58> Der Preis für Montage und Auswuchten steht noch nicht fest. </p>`);
						else _push(`<!---->`);
						_push(`</div><button type="button" class="btn btn--primary btn--block kr-card__add"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing || __props.wheelConfigId === null) ? " disabled" : ""} data-v-5a44ee58>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).processing ? "Wird hinzugefügt …" : "Als Komplettrad in den Warenkorb")}</button></li>`);
					});
					_push(`<!--]--></ul><p class="kr__fallback" data-v-5a44ee58><a href="#felgen-kaufen" class="link kr__wheels-only" data-v-5a44ee58>Nur die Felgen bestellen</a></p><!--]-->`);
				}
				_push(`</section>`);
			} else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/KomplettradOffer.vue
var _sfc_setup$1 = KomplettradOffer_vue_vue_type_script_setup_true_lang_default.setup;
KomplettradOffer_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/KomplettradOffer.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var KomplettradOffer_default = /*#__PURE__*/ _plugin_vue_export_helper_default(KomplettradOffer_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-5a44ee58"]]);
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
var FALLBACK_REASON = "Für dein Fahrzeug nicht freigegeben.";
/** With no vehicle there is no verdict and no claim: every configuration may be bought. */
function sellable(config) {
	return config.verdict === null || config.verdict.sellable;
}
/** Permitted and in stock first, then permitted, then the rest; cheapest within each. */
function best(configs) {
	const rank = (c) => sellable(c) ? c.inStock ? 0 : 1 : 2;
	return [...configs].sort((a, b) => rank(a) - rank(b) || a.priceCents - b.priceCents)[0] ?? null;
}
function reasonFor(configs) {
	return configs.find((c) => c.verdict?.reason)?.verdict?.reason ?? FALLBACK_REASON;
}
function useConfigurator(configs, firstFinishId) {
	const finishId = (0, vue_exports.ref)(firstFinishId);
	const configId = (0, vue_exports.ref)(null);
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
			const blocked = !group.some(sellable);
			const representative = current !== null && group.includes(current) ? current : best(group) ?? group[0];
			return {
				diameter,
				label: String(diameter).replace(".", ","),
				config: representative,
				blocked,
				reason: blocked ? reasonFor(group) : null
			};
		}).sort((a, b) => a.diameter - b.diameter);
	});
	const variants = (0, vue_exports.computed)(() => {
		const current = selected.value;
		if (current === null) return [];
		return forFinish.value.filter((c) => c.diameterIn === current.diameterIn).sort((a, b) => a.widthIn - b.widthIn || a.etMm - b.etMm).map((config) => ({
			id: config.id,
			label: config.sizeLabel,
			config,
			blocked: !sellable(config),
			reason: sellable(config) ? null : reasonFor([config])
		}));
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
		const candidates = forFinish.value.filter((c) => sellable(c) && c.diameterIn === previous.diameterIn);
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
//#region resources/js/Pages/Produkt/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		product: {},
		finishes: {},
		configs: {},
		hasVehicle: { type: Boolean },
		shipping: {},
		demo: { type: Boolean }
	},
	setup(__props) {
		/**
		* The product page.
		*
		* Two rules govern it. Configuration NARROWS but never rejects: a size that exists but is not
		* permitted on the chosen car is shown, struck through, with the reason — hiding it would let the
		* customer believe the wheel is not made in that size. And price, stock and verdict change in ONE
		* commit when a size is chosen; they come from the same config object, so there is no frame in
		* which a new price sits beside an old legal answer.
		*
		* The verdict sits directly above the basket button, never beside or below it: the legal status is
		* never separated from the control that acts on it.
		*
		* Beneath the purchase panel the page offers the same size as a Komplettrad — only the tyres the
		* verdict permits, priced on the server, or the one sentence saying why there are none. The offer
		* travels inside the configuration, so a size change swaps it in the same commit as the price.
		*
		* On a phone the price and the button follow the customer down the page once the main button has
		* scrolled away — the one persistent bar the storefront uses, because it is the page's next action.
		*
		* A seeded demonstration model (`demo`) shows "Beispielbestand" rather than "Auf Lager" and says it
		* cannot be ordered yet. Its basket button stays usable, so the flow can be reviewed; the server
		* refuses the order at the checkout (ACCURACY.md D4).
		*
		* The main photograph opens large in a dialog: a button around the image, focus trapped while it
		* is open, Escape or the close button to leave, focus back on the photograph after.
		*/
		/** The load rating per wheel travels with each configuration; null where none is verified. */
		const props = __props;
		const shared = useShared();
		const terms = (0, vue_exports.computed)(() => priceTerms(shared.value.smallBusiness === true));
		const config = useConfigurator(() => props.configs, props.finishes[0]?.id ?? 0);
		const finish = (0, vue_exports.computed)(() => props.finishes.find((f) => f.id === config.finishId.value) ?? null);
		const selected = (0, vue_exports.computed)(() => config.selected.value);
		/** GPSR's electronic address as a link: an e-mail opens the mail program, a web address its page. */
		function contactHref(contact) {
			return contact.includes("@") && !contact.startsWith("http") ? `mailto:${contact}` : contact;
		}
		const shots = (0, vue_exports.computed)(() => {
			const image = finish.value?.image ?? null;
			if (image === null) return [];
			const { views = [], ...front } = image;
			return [{
				...front,
				label: front.label ?? "Ansicht von vorn"
			}, ...views];
		});
		const shotIndex = (0, vue_exports.ref)(0);
		const shot = (0, vue_exports.computed)(() => shots.value[shotIndex.value] ?? null);
		const shotAlt = (0, vue_exports.computed)(() => shot.value?.alt ?? `${props.product.brandName} ${props.product.modelName} in ${finish.value?.name ?? ""}, ${shot.value?.label ?? ""}`);
		const photoNote = (0, vue_exports.computed)(() => {
			const stamp = finish.value?.image?.stamp;
			const current = selected.value;
			if (!stamp || current === null || !current.kbaNumber || current.kbaNumber === stamp) return null;
			const pictured = props.configs.find((c) => c.kbaNumber === stamp);
			return pictured ? `Abbildung zeigt die ${decimal(pictured.diameterIn, Number.isInteger(pictured.diameterIn) ? 0 : 1)}-Zoll-Ausführung.` : null;
		});
		const blockedNote = (0, vue_exports.computed)(() => {
			const statuses = new Set(config.sizes.value.filter((s) => s.blocked).map((s) => s.config.verdict?.status));
			if (statuses.size === 0) return null;
			const refused = statuses.has("NOT_PERMITTED");
			const open = [...statuses].some((status) => status !== "NOT_PERMITTED");
			if (refused && open) return "Durchgestrichene Größen sind für dein Fahrzeug nicht freigegeben, oder uns liegt für sie keine Freigabe vor.";
			return refused ? "Durchgestrichene Größen sind für dein Fahrzeug nicht freigegeben." : "Für durchgestrichene Größen liegt uns für dein Fahrzeug keine Freigabe vor.";
		});
		(0, vue_exports.watch)(() => config.finishId.value, () => {
			shotIndex.value = 0;
		});
		const zoomOpen = (0, vue_exports.ref)(false);
		const basket = useForm({
			kind: "WHEEL",
			wheelConfigId: 0,
			quantity: 4
		});
		const stockLabel = (0, vue_exports.computed)(() => {
			const inStock = selected.value?.inStock === true;
			if (props.demo === true) return inStock ? "Beispielbestand" : "Beispielbestand · ausverkauft";
			return inStock ? "Auf Lager" : "Ausverkauft";
		});
		const stockTone = (0, vue_exports.computed)(() => {
			if (props.demo === true) return "tag--unknown";
			return selected.value?.inStock === true ? "tag--ok" : "tag--danger";
		});
		const documentBore = (0, vue_exports.computed)(() => selected.value?.verdict?.centreBore ?? null);
		const boreConflict = (0, vue_exports.computed)(() => selected.value?.verdict?.centreBoreSource === "CONFLICTING");
		const rimBoreLabel = (0, vue_exports.computed)(() => selected.value?.verdict ? "Mittenlochbohrung der Felge" : "Mittenlochbohrung");
		const hump = (0, vue_exports.computed)(() => selected.value?.hump ?? null);
		const maxLoad = (0, vue_exports.computed)(() => {
			const kg = selected.value?.maxLoadKg;
			return typeof kg === "number" && kg > 0 ? withUnit(decimal(kg, 0), "kg") : null;
		});
		const canBuy = (0, vue_exports.computed)(() => {
			const current = selected.value;
			if (current === null || !current.inStock) return false;
			return current.verdict === null || current.verdict.sellable;
		});
		const buyLabel = (0, vue_exports.computed)(() => {
			if (basket.processing) return "Wird hinzugefügt …";
			if (selected.value !== null && !selected.value.inStock) return "Ausverkauft";
			return "In den Warenkorb";
		});
		const weight = (0, vue_exports.computed)(() => {
			const grams = selected.value?.weightG;
			return grams === null || grams === void 0 ? null : `${(grams / 1e3).toFixed(1).replace(".", ",")} kg`;
		});
		const buyButton = (0, vue_exports.ref)(null);
		const buyVisible = (0, vue_exports.ref)(true);
		let observer = null;
		(0, vue_exports.onMounted)(() => {
			if (buyButton.value === null || typeof IntersectionObserver === "undefined") return;
			observer = new IntersectionObserver(([entry]) => {
				buyVisible.value = entry?.isIntersecting ?? true;
			});
			observer.observe(buyButton.value);
		});
		(0, vue_exports.onBeforeUnmount)(() => observer?.disconnect());
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: `${__props.product.brandName} ${__props.product.modelName}` }, null, _parent));
			_push(`<section class="section-dense" data-v-b840e244><div class="wrap" data-v-b840e244><nav class="pdp__crumbs t-small" aria-label="Brotkrumen" data-v-b840e244>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Startseite`);
					else return [(0, vue_exports.createTextVNode)("Startseite")];
				}),
				_: 1
			}, _parent));
			_push(`<span aria-hidden="true" data-v-b840e244>/</span>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/felgen" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Felgen`);
					else return [(0, vue_exports.createTextVNode)("Felgen")];
				}),
				_: 1
			}, _parent));
			_push(`<span aria-hidden="true" data-v-b840e244>/</span><span aria-current="page" translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(__props.product.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(__props.product.modelName)}</span></nav><div class="pdp" data-v-b840e244><div class="pdp__gallery" data-v-b840e244><div class="well pdp__well" data-v-b840e244>`);
			if (shot.value) {
				_push(`<button type="button" class="pdp__zoom" aria-haspopup="dialog"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Foto vergrößern: ${shotAlt.value}`)} data-v-b840e244>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
					key: shot.value.name,
					image: shot.value,
					alt: shotAlt.value,
					sizes: "(min-width: 900px) 56vw, 100vw",
					eager: "",
					class: "pdp__picture"
				}, null, _parent));
				_push(`</button>`);
			} else _push((0, server_renderer_exports.ssrRenderComponent)(ProductPhoto_default, {
				spokes: __props.product.spokes,
				finish: finish.value?.artFinish ?? "graphite",
				size: 560
			}, null, _parent));
			_push(`</div>`);
			if (shots.value.length > 1) {
				_push(`<div class="pdp__thumbs" role="group" aria-label="Ansichten" data-v-b840e244><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(shots.value, (view, i) => {
					_push(`<button type="button" class="pdp__thumb"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", i === shotIndex.value)}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", view.label)} data-v-b840e244>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
						image: view,
						alt: "",
						sizes: "72px",
						class: "pdp__thumb-picture"
					}, null, _parent));
					_push(`</button>`);
				});
				_push(`<!--]--></div>`);
			} else _push(`<!---->`);
			if (photoNote.value) _push(`<p class="t-small quiet pdp__photo-note" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(photoNote.value)}</p>`);
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogRoot_default), {
				open: zoomOpen.value,
				"onUpdate:open": ($event) => zoomOpen.value = $event
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogPortal_default), null, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogOverlay_default), { class: "overlay" }, null, _parent, _scopeId));
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogContent_default), {
									class: "dialog pdp-zoom",
									"aria-describedby": ""
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push(`<div class="dialog__head" data-v-b840e244${_scopeId}>`);
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogTitle_default), { class: "pdp-zoom__title" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(shotAlt.value)}`);
													else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(shotAlt.value), 1)];
												}),
												_: 1
											}, _parent, _scopeId));
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogClose_default), {
												class: "icon-btn dialog__close",
												"aria-label": "Schließen"
											}, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
														name: "close",
														size: 24
													}, null, _parent, _scopeId));
													else return [(0, vue_exports.createVNode)(Icon_default, {
														name: "close",
														size: 24
													})];
												}),
												_: 1
											}, _parent, _scopeId));
											_push(`</div><div class="pdp-zoom__frame" data-v-b840e244${_scopeId}>`);
											if (shot.value) _push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
												key: `zoom-${shot.value.name}`,
												image: shot.value,
												alt: shotAlt.value,
												sizes: "(min-width: 900px) 80vw, 100vw",
												eager: "",
												class: "pdp-zoom__picture"
											}, null, _parent, _scopeId));
											else _push(`<!---->`);
											_push(`</div>`);
										} else return [(0, vue_exports.createVNode)("div", { class: "dialog__head" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "pdp-zoom__title" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(shotAlt.value), 1)]),
											_: 1
										}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogClose_default), {
											class: "icon-btn dialog__close",
											"aria-label": "Schließen"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
												name: "close",
												size: 24
											})]),
											_: 1
										})]), (0, vue_exports.createVNode)("div", { class: "pdp-zoom__frame" }, [shot.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(Picture_default, {
											key: `zoom-${shot.value.name}`,
											image: shot.value,
											alt: shotAlt.value,
											sizes: "(min-width: 900px) 80vw, 100vw",
											eager: "",
											class: "pdp-zoom__picture"
										}, null, 8, ["image", "alt"])) : (0, vue_exports.createCommentVNode)("", true)])];
									}),
									_: 1
								}, _parent, _scopeId));
							} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogOverlay_default), { class: "overlay" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogContent_default), {
								class: "dialog pdp-zoom",
								"aria-describedby": ""
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("div", { class: "dialog__head" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "pdp-zoom__title" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(shotAlt.value), 1)]),
									_: 1
								}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogClose_default), {
									class: "icon-btn dialog__close",
									"aria-label": "Schließen"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
										name: "close",
										size: 24
									})]),
									_: 1
								})]), (0, vue_exports.createVNode)("div", { class: "pdp-zoom__frame" }, [shot.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(Picture_default, {
									key: `zoom-${shot.value.name}`,
									image: shot.value,
									alt: shotAlt.value,
									sizes: "(min-width: 900px) 80vw, 100vw",
									eager: "",
									class: "pdp-zoom__picture"
								}, null, 8, ["image", "alt"])) : (0, vue_exports.createCommentVNode)("", true)])]),
								_: 1
							})];
						}),
						_: 1
					}, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogPortal_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogOverlay_default), { class: "overlay" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogContent_default), {
							class: "dialog pdp-zoom",
							"aria-describedby": ""
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("div", { class: "dialog__head" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "pdp-zoom__title" }, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(shotAlt.value), 1)]),
								_: 1
							}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogClose_default), {
								class: "icon-btn dialog__close",
								"aria-label": "Schließen"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
									name: "close",
									size: 24
								})]),
								_: 1
							})]), (0, vue_exports.createVNode)("div", { class: "pdp-zoom__frame" }, [shot.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(Picture_default, {
								key: `zoom-${shot.value.name}`,
								image: shot.value,
								alt: shotAlt.value,
								sizes: "(min-width: 900px) 80vw, 100vw",
								eager: "",
								class: "pdp-zoom__picture"
							}, null, 8, ["image", "alt"])) : (0, vue_exports.createCommentVNode)("", true)])]),
							_: 1
						})]),
						_: 1
					})];
				}),
				_: 1
			}, _parent));
			_push(`</div><div class="pdp__buy" data-v-b840e244><h1 class="t-h1" translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(__props.product.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(__props.product.modelName)}</h1>`);
			if (__props.product.typeDesignation) {
				_push(`<p class="data pdp__type" data-v-b840e244>Typ `);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, {
					text: __props.product.typeDesignation,
					whole: ""
				}, null, _parent));
				_push(`</p>`);
			} else _push(`<!---->`);
			if (__props.product.rating !== null && __props.product.ratingCount > 0) {
				_push(`<p class="stars pdp__rating" data-v-b840e244><span class="stars__glyph" aria-hidden="true" data-v-b840e244>★</span><span class="tabular" data-v-b840e244>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: __props.product.ratingLabel ?? "" }, null, _parent));
				_push(`</span></p>`);
			} else _push(`<!---->`);
			_push(`<div class="pdp__block" data-v-b840e244><span class="micro" data-v-b840e244>Farbe · <span translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(finish.value?.name)}</span></span><div class="pdp__swatches" data-v-b840e244><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.finishes, (item) => {
				_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pdp__swatch--on": item.id === (0, vue_exports.unref)(config).finishId.value }, "pdp__swatch"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", item.id === (0, vue_exports.unref)(config).finishId.value)} data-v-b840e244><span class="pdp__dot" data-qa-ignore style="${(0, server_renderer_exports.ssrRenderStyle)(item.hex ? { "--swatch": item.hex } : void 0)}" data-v-b840e244></span><span translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(item.name)}</span></button>`);
			});
			_push(`<!--]--></div></div><div id="groessen" class="pdp__block" data-v-b840e244><span class="micro" data-v-b840e244>Durchmesser (<span translate="no" data-v-b840e244>Zoll</span>)</span><div class="chip-row pdp__chips" data-v-b840e244><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(config).sizes.value, (size) => {
				_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{
					"chip--on": selected.value?.id === size.config.id,
					"chip--blocked": size.blocked
				}, "chip"])}" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(size.blocked) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", selected.value?.id === size.config.id)}${(0, server_renderer_exports.ssrRenderAttr)("title", size.reason ?? void 0)} data-v-b840e244><span translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(size.label)}</span></button>`);
			});
			_push(`<!--]--></div>`);
			if (blockedNote.value) _push(`<p class="t-small quiet pdp__note" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(blockedNote.value)}</p>`);
			else _push(`<!---->`);
			_push(`</div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(FitmentPanel_default, {
				class: "pdp__fit",
				verdict: selected.value?.verdict ?? null,
				vehicle: (0, vue_exports.unref)(shared).vehicle,
				"config-id": selected.value?.id ?? null
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (!__props.hasVehicle) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: "/felgen-suchen",
							class: "btn btn--secondary btn--sm pdp__fit-cta"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(` Fahrzeug wählen `);
								else return [(0, vue_exports.createTextVNode)(" Fahrzeug wählen ")];
							}),
							_: 1
						}, _parent, _scopeId));
						else _push(`<!---->`);
					} else return [!__props.hasVehicle ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
						key: 0,
						href: "/felgen-suchen",
						class: "btn btn--secondary btn--sm pdp__fit-cta"
					}, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)(" Fahrzeug wählen ")]),
						_: 1
					})) : (0, vue_exports.createCommentVNode)("", true)];
				}),
				_: 1
			}, _parent));
			_push(`<div class="pdp__price" data-v-b840e244><p class="price price--lg" translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(selected.value?.price ?? (0, vue_exports.unref)(config).fromPrice.value)}</p><p class="price-note" data-v-b840e244>pro Felge, ${(0, server_renderer_exports.ssrInterpolate)(terms.value.note)}</p>`);
			if (selected.value?.priceForFour) _push(`<p class="price-note pdp__four" data-v-b840e244>4 Felgen: <span class="num" translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(selected.value.priceForFour)}</span></p>`);
			else _push(`<!---->`);
			if (__props.shipping) _push(`<p class="price-note pdp__shipping" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(__props.shipping)}</p>`);
			else _push(`<!---->`);
			_push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([stockTone.value, "tag pdp__stock"])}" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(stockLabel.value)}</span>`);
			if (__props.demo) _push(`<p class="t-small pdp__demo" data-v-b840e244> Beispielsortiment: Diese Felge kannst du dir ansehen und in den Warenkorb legen, bestellen kannst du sie noch nicht. </p>`);
			else _push(`<!---->`);
			_push(`</div><div id="felgen-kaufen" data-v-b840e244><button class="btn btn--primary btn--block btn--lg pdp__add" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!canBuy.value || (0, vue_exports.unref)(basket).processing) ? " disabled" : ""} data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(buyLabel.value)}</button></div></div></div>`);
			if (selected.value?.verdict?.detail && (0, vue_exports.unref)(shared).vehicle) _push((0, server_renderer_exports.ssrRenderComponent)(FitmentDetail_default, {
				detail: selected.value.verdict.detail,
				"vehicle-label": (0, vue_exports.unref)(shared).vehicle.label
			}, null, _parent));
			else _push(`<!---->`);
			if (selected.value && selected.value.komplettrad) _push((0, server_renderer_exports.ssrRenderComponent)(KomplettradOffer_default, {
				class: "pdp__komplettrad",
				offer: selected.value.komplettrad,
				"wheel-config-id": selected.value.id,
				"contact-email": (0, vue_exports.unref)(shared).contact.email
			}, null, _parent));
			else _push(`<!---->`);
			if (selected.value) {
				_push(`<section class="pdp__specs" aria-labelledby="pdp-specs" data-v-b840e244><h2 id="pdp-specs" class="t-h2" data-v-b840e244>Felgendetails</h2><p class="t-small quiet pdp__specs-for" data-v-b840e244>Für `);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: selected.value.fullLabel }, null, _parent));
				_push(`</p><dl class="spec" data-v-b840e244><div class="spec__row" data-v-b840e244><dt data-v-b840e244>Größe</dt><dd class="t-mono" translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(selected.value.sizeLabel)}</dd></div><div class="spec__row" data-v-b840e244><dt data-v-b840e244>Lochkreis</dt><dd class="t-mono" translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(selected.value.boltPattern)}</dd></div>`);
				if (documentBore.value) _push(`<div class="spec__row spec__row--doc" data-v-b840e244><dt data-v-b840e244> Mittenlochbohrung für dein Fahrzeug <span class="spec__hint" data-v-b840e244>laut Gutachten</span></dt><dd class="t-mono" translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(documentBore.value)}</dd></div>`);
				else _push(`<!---->`);
				_push(`<div class="spec__row" data-v-b840e244><dt data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(rimBoreLabel.value)}</dt><dd class="t-mono" translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(selected.value.centreBore)}</dd></div><div class="spec__row" data-v-b840e244><dt data-v-b840e244>Einpresstiefe (ET)</dt><dd class="t-mono" translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(selected.value.etMm)} mm</dd></div>`);
				if (hump.value) _push(`<div class="spec__row" data-v-b840e244><dt data-v-b840e244>Hump</dt><dd class="t-mono" translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(hump.value)}</dd></div>`);
				else _push(`<!---->`);
				if (finish.value) _push(`<div class="spec__row" data-v-b840e244><dt data-v-b840e244>Farbe</dt><dd class="t-mono" translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(finish.value.name)}</dd></div>`);
				else _push(`<!---->`);
				if (__props.product.spokes > 0) _push(`<div class="spec__row" data-v-b840e244><dt data-v-b840e244>Speichen</dt><dd class="t-mono" translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(__props.product.spokes)}</dd></div>`);
				else _push(`<!---->`);
				if (weight.value) _push(`<div class="spec__row" data-v-b840e244><dt data-v-b840e244>Gewicht pro Felge</dt><dd class="t-mono" translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(weight.value)}</dd></div>`);
				else _push(`<!---->`);
				if (maxLoad.value) _push(`<div class="spec__row" data-v-b840e244><dt data-v-b840e244>Traglast</dt><dd class="t-mono" translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(maxLoad.value)}</dd></div>`);
				else _push(`<!---->`);
				if (selected.value.kbaNumber) _push(`<div class="spec__row" data-v-b840e244><dt data-v-b840e244>KBA-Nummer</dt><dd class="t-mono" translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(selected.value.kbaNumber)}</dd></div>`);
				else _push(`<!---->`);
				_push(`<div class="spec__row" data-v-b840e244><dt data-v-b840e244>Artikelnummer</dt><dd class="t-mono" translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(selected.value.sku)}</dd></div></dl>`);
				if (boreConflict.value) _push(`<p class="t-small quiet pdp__specs-note" data-v-b840e244> Für dein Fahrzeug nennen die Gutachten unterschiedliche Mittenlochbohrungen. Wir zeigen dir deshalb nur das Maß der Felge. </p>`);
				else _push(`<!---->`);
				if (__props.product.descriptionDe) _push(`<p class="t-body pdp__desc" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(__props.product.descriptionDe)}</p>`);
				else _push(`<!---->`);
				_push(`</section>`);
			} else _push(`<!---->`);
			_push(`<section class="pdp__gpsr" aria-labelledby="pdp-gpsr" data-v-b840e244><h2 id="pdp-gpsr" class="t-h3" data-v-b840e244>Hersteller und Produktsicherheit</h2>`);
			if (__props.product.manufacturer) {
				_push(`<dl class="pdp__gpsr-list" data-v-b840e244><div class="pdp__gpsr-row" data-v-b840e244><dt data-v-b840e244>Hersteller</dt><dd class="pdp__gpsr-value" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.name)}<br data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.address)}<br data-v-b840e244><a class="link"${(0, server_renderer_exports.ssrRenderAttr)("href", contactHref(__props.product.manufacturer.contact))} data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.contact)}</a></dd></div>`);
				if (__props.product.manufacturer.euResponsible) {
					_push(`<div class="pdp__gpsr-row" data-v-b840e244><dt data-v-b840e244>Verantwortliche Person in der EU</dt><dd class="pdp__gpsr-value" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.euResponsible.name)}`);
					if (__props.product.manufacturer.euResponsible.address) _push(`<!--[--><br data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.euResponsible.address)}<!--]-->`);
					else _push(`<!---->`);
					if (__props.product.manufacturer.euResponsible.contact) _push(`<!--[--><br data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.euResponsible.contact)}<!--]-->`);
					else _push(`<!---->`);
					_push(`</dd></div>`);
				} else _push(`<!---->`);
				_push(`<div class="pdp__gpsr-row" data-v-b840e244><dt data-v-b840e244>Produkt</dt><dd class="pdp__gpsr-value" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(__props.product.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(__props.product.modelName)}`);
				if (__props.product.typeDesignation) _push(`<!--[--> · Typ ${(0, server_renderer_exports.ssrInterpolate)(__props.product.typeDesignation)}<!--]-->`);
				else _push(`<!---->`);
				if (selected.value) _push(`<!--[--> · Artikelnummer ${(0, server_renderer_exports.ssrInterpolate)(selected.value.sku)}<!--]-->`);
				else _push(`<!---->`);
				_push(`</dd></div>`);
				if (__props.product.manufacturer.safetyNote) _push(`<div class="pdp__gpsr-row" data-v-b840e244><dt data-v-b840e244>Sicherheitshinweise</dt><dd class="pdp__gpsr-value" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.safetyNote)}</dd></div>`);
				else _push(`<!---->`);
				_push(`</dl>`);
			} else _push(`<p class="t-small quiet" data-v-b840e244> Die Angaben des Herstellers zu dieser Felge liegen uns noch nicht vor. Fragen dazu beantworten wir dir unter <a${(0, server_renderer_exports.ssrRenderAttr)("href", `mailto:${(0, vue_exports.unref)(shared).contact.email}`)} data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(shared).contact.email)}</a>. </p>`);
			_push(`</section></div></section>`);
			if (!buyVisible.value && selected.value) _push(`<div class="stickybar pdp__sticky" data-v-b840e244><div class="pdp__sticky-price" data-v-b840e244><p class="price" translate="no" data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(selected.value.price)}</p><p class="price-note" data-v-b840e244>pro Felge, ${(0, server_renderer_exports.ssrInterpolate)(terms.value.note)}</p></div><button class="btn btn--primary pdp__sticky-btn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!canBuy.value || (0, vue_exports.unref)(basket).processing) ? " disabled" : ""} data-v-b840e244>${(0, server_renderer_exports.ssrInterpolate)(buyLabel.value)}</button></div>`);
			else _push(`<!---->`);
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Produkt/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Produkt/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-b840e244"]]);
//#endregion
export { Index_default as default };
