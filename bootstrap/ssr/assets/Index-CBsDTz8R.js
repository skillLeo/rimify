import { n as link_default, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
import { r as useShared } from "./useShared-Cs__JTYP.js";
import { t as AppLayout_default } from "./AppLayout-D56ynLLu.js";
import { t as VehicleSelector_default } from "./VehicleSelector-DhI378vn.js";
import { t as ProductCard_default } from "./ProductCard-MeWfBls4.js";
//#region resources/js/Pages/Startseite/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		bestsellers: {},
		makes: {},
		brands: {},
		month: {},
		faq: {}
	},
	setup(__props) {
		/**
		* The homepage.
		*
		* It leads with the tool, not with a picture: the first thing below the header is the question
		* this shop exists to answer — which wheels are approved for your car — and the form that answers
		* it. Everything after that is evidence: real facts with numbers behind them, the real catalogue,
		* a worked example of the verdict, and the answers to the questions people actually ask.
		*
		* One page for every width. The layout reflows at 640 / 900 / 1200px; nothing is served twice.
		*/
		const shared = useShared();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const contact = (0, vue_exports.computed)(() => shared.value.contact);
		const openFaq = (0, vue_exports.ref)(null);
		const PACKAGE_ROWS = [
			{
				label: "Felgen mit Gutachten",
				felgen: true,
				komplett: true
			},
			{
				label: "Anbauset und ABE",
				felgen: true,
				komplett: true
			},
			{
				label: "Reifen montiert",
				felgen: false,
				komplett: true
			},
			{
				label: "Gewuchtet",
				felgen: false,
				komplett: true
			},
			{
				label: "Ventile und Gewichte",
				felgen: false,
				komplett: true
			}
		];
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Felgen mit geprüfter Freigabe" }, null, _parent));
			_push(`<section class="home-hero" data-v-d8dd750a><div class="wrap home-hero__grid" data-v-d8dd750a><div class="home-hero__copy" data-v-d8dd750a><h1 class="t-display" data-v-d8dd750a>Felgen, die zu deinem Auto passen. Garantiert.</h1><p class="t-lead home-hero__lead" data-v-d8dd750a> Wähle dein Fahrzeug – wir zeigen dir nur Felgen, die dafür freigegeben sind. </p><dl class="home-hero__facts" data-v-d8dd750a><div data-v-d8dd750a><dt class="micro" data-v-d8dd750a>Freigabe</dt><dd data-v-d8dd750a>Gutachten zu jeder Felge</dd></div><div data-v-d8dd750a><dt class="micro" data-v-d8dd750a>Lager</dt><dd data-v-d8dd750a>Über 150 Modelle</dd></div><div data-v-d8dd750a><dt class="micro" data-v-d8dd750a>Versand</dt><dd data-v-d8dd750a>Bis 14 Uhr bestellt, am selben Werktag raus</dd></div></dl></div>`);
			if (vehicle.value) {
				_push(`<div class="card home-hero__panel" data-v-d8dd750a><span class="micro" data-v-d8dd750a>Dein Fahrzeug</span><p class="t-h2 home-hero__vehicle" data-v-d8dd750a>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</p><p class="data" data-v-d8dd750a>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.keyNumbers)} · ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.buildWindow)}</p><div class="home-hero__actions" data-v-d8dd750a>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen",
					class: "btn btn--primary btn--lg"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Passende Felgen anzeigen`);
						else return [(0, vue_exports.createTextVNode)("Passende Felgen anzeigen")];
					}),
					_: 1
				}, _parent));
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen-suchen",
					class: "btn btn--secondary btn--lg"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Fahrzeug ändern`);
						else return [(0, vue_exports.createTextVNode)("Fahrzeug ändern")];
					}),
					_: 1
				}, _parent));
				_push(`</div></div>`);
			} else {
				_push(`<div class="card home-hero__panel" data-v-d8dd750a>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(VehicleSelector_default, {
					makes: __props.makes,
					models: [],
					variants: [],
					"selected-make": null,
					"selected-model": null,
					"base-path": "/felgen-suchen",
					compact: ""
				}, null, _parent));
				_push(`</div>`);
			}
			_push(`</div></section><section class="home-trust" aria-label="Service" data-v-d8dd750a><div class="wrap home-trust__row" data-v-d8dd750a>`);
			if (contact.value) {
				_push(`<a class="home-trust__item"${(0, server_renderer_exports.ssrRenderAttr)("href", `tel:${contact.value.phoneIntl.replace(/\s/g, "")}`)} data-v-d8dd750a>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "phone",
					size: 20
				}, null, _parent));
				_push(`<span data-v-d8dd750a><strong class="tabular" data-v-d8dd750a>${(0, server_renderer_exports.ssrInterpolate)(contact.value.phone)}</strong><span class="home-trust__sub" data-v-d8dd750a>${(0, server_renderer_exports.ssrInterpolate)(contact.value.hours)}</span></span></a>`);
			} else _push(`<!---->`);
			_push(`<div class="home-trust__item" data-v-d8dd750a>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "truck",
				size: 20
			}, null, _parent));
			_push(`<span data-v-d8dd750a><strong data-v-d8dd750a>Versand aus Deutschland</strong><span class="home-trust__sub" data-v-d8dd750a>versichert mit DHL</span></span></div><div class="home-trust__item" data-v-d8dd750a>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "document",
				size: 20
			}, null, _parent));
			_push(`<span data-v-d8dd750a><strong data-v-d8dd750a>Gutachten als PDF</strong><span class="home-trust__sub" data-v-d8dd750a>auf jeder Produktseite</span></span></div><div class="home-trust__item" data-v-d8dd750a>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "shield",
				size: 20
			}, null, _parent));
			_push(`<span data-v-d8dd750a><strong data-v-d8dd750a>14 Tage Widerrufsrecht</strong><span class="home-trust__sub" data-v-d8dd750a>auf unmontierte Ware</span></span></div></div></section><section class="section" data-v-d8dd750a><div class="wrap" data-v-d8dd750a><div class="between home-head" data-v-d8dd750a><h2 class="t-h2" data-v-d8dd750a>Bestseller aus ${(0, server_renderer_exports.ssrInterpolate)(__props.month)}</h2>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/felgen",
				class: "btn btn--quiet"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Alle Felgen`);
					else return [(0, vue_exports.createTextVNode)("Alle Felgen")];
				}),
				_: 1
			}, _parent));
			_push(`</div><div class="grid-cards" data-v-d8dd750a><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.bestsellers.slice(0, 4), (card) => {
				_push((0, server_renderer_exports.ssrRenderComponent)(ProductCard_default, {
					key: `${card.modelId}-${card.finishId}`,
					card,
					vehicle: vehicle.value
				}, null, _parent));
			});
			_push(`<!--]--></div></div></section><section class="section-dense band" data-v-d8dd750a><div class="wrap home-browse" data-v-d8dd750a><div data-v-d8dd750a><h2 class="t-h2" data-v-d8dd750a>Nach Automarke</h2><ul class="home-list" data-v-d8dd750a><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.makes, (make) => {
				_push(`<li data-v-d8dd750a>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: `/felgen-suchen?marke=${encodeURIComponent(make.make)}`,
					class: "home-list__link"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`<span data-v-d8dd750a${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(make.make)}</span><span class="data" data-v-d8dd750a${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(make.models)} Modelle</span>`);
						else return [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(make.make), 1), (0, vue_exports.createVNode)("span", { class: "data" }, (0, vue_exports.toDisplayString)(make.models) + " Modelle", 1)];
					}),
					_: 2
				}, _parent));
				_push(`</li>`);
			});
			_push(`<!--]--></ul></div><div data-v-d8dd750a><h2 class="t-h2" data-v-d8dd750a>Nach Felgenmarke</h2><ul class="home-list" data-v-d8dd750a><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.brands, (brand) => {
				_push(`<li data-v-d8dd750a>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: `/felgen?marke=${encodeURIComponent(brand.name)}`,
					class: "home-list__link"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push(`<span data-v-d8dd750a${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(brand.name)}</span>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
								name: "chevron-right",
								size: 20
							}, null, _parent, _scopeId));
						} else return [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(brand.name), 1), (0, vue_exports.createVNode)(Icon_default, {
							name: "chevron-right",
							size: 20
						})];
					}),
					_: 2
				}, _parent));
				_push(`</li>`);
			});
			_push(`<!--]--></ul></div></div></section><section class="section" data-v-d8dd750a><div class="wrap home-check" data-v-d8dd750a><div data-v-d8dd750a><h2 class="t-h2" data-v-d8dd750a>So prüft RIMIFY-CHECK</h2><p class="t-body home-check__body" data-v-d8dd750a> Mit RIMIFY-CHECK prüfen wir die Kompatibilität zwischen Fahrzeug und Felge. So kannst du sicher sein, dass deine Wunschfelge zu deinem Fahrzeug passt und zugelassen ist. </p>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/rimify-check",
				class: "btn btn--secondary home-check__cta"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(` RIMIFY-CHECK starten `);
					else return [(0, vue_exports.createTextVNode)(" RIMIFY-CHECK starten ")];
				}),
				_: 1
			}, _parent));
			_push(`</div><div class="rcheck-panel home-check__panel" data-v-d8dd750a><p class="rcheck-panel__head" data-v-d8dd750a>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "check-circle",
				size: 20
			}, null, _parent));
			_push(` RIMIFY-CHECK</p><dl class="home-check__rows" data-v-d8dd750a><div data-v-d8dd750a><dt class="micro" data-v-d8dd750a>Fahrzeug</dt><dd data-v-d8dd750a>BMW M4 F82</dd></div><div data-v-d8dd750a><dt class="micro" data-v-d8dd750a>Felge</dt><dd data-v-d8dd750a>Wheelforce CF.3</dd></div><div data-v-d8dd750a><dt class="micro" data-v-d8dd750a>Größe</dt><dd class="data" data-v-d8dd750a>9,0J × 19 · ET 29</dd></div></dl><p class="home-check__verdict" data-v-d8dd750a>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "check",
				size: 20
			}, null, _parent));
			_push(` Freigegeben – keine Eintragung erforderlich </p></div></div></section><section class="section-dense band" data-v-d8dd750a><div class="wrap" data-v-d8dd750a><div class="home-narrow" data-v-d8dd750a><h2 class="t-h2" data-v-d8dd750a>Dein Felgenpaket</h2><p class="t-body home-pack__lead" data-v-d8dd750a> Auf Wunsch ziehen wir die Reifen auf und wuchten die Räder bei uns im Haus – auspacken, anschrauben, losfahren. </p><table class="table home-pack" data-v-d8dd750a><thead data-v-d8dd750a><tr data-v-d8dd750a><th scope="col" data-v-d8dd750a>Leistung</th><th scope="col" class="home-pack__col" data-v-d8dd750a>Felgen</th><th scope="col" class="home-pack__col" data-v-d8dd750a>Komplettrad</th></tr></thead><tbody data-v-d8dd750a><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(PACKAGE_ROWS, (row) => {
				_push(`<tr data-v-d8dd750a><th scope="row" class="home-pack__row" data-v-d8dd750a>${(0, server_renderer_exports.ssrInterpolate)(row.label)}</th><td class="home-pack__col" data-v-d8dd750a>`);
				if (row.felgen) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "check",
					size: 20,
					label: "enthalten"
				}, null, _parent));
				else _push(`<span class="quiet" aria-label="nicht enthalten" data-v-d8dd750a>–</span>`);
				_push(`</td><td class="home-pack__col" data-v-d8dd750a>`);
				if (row.komplett) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "check",
					size: 20,
					label: "enthalten"
				}, null, _parent));
				else _push(`<span class="quiet" aria-label="nicht enthalten" data-v-d8dd750a>–</span>`);
				_push(`</td></tr>`);
			});
			_push(`<!--]--></tbody></table>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/felgen-suchen",
				class: "btn btn--primary home-pack__cta"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(` Jetzt Auto wählen und passende Felgen finden `);
					else return [(0, vue_exports.createTextVNode)(" Jetzt Auto wählen und passende Felgen finden ")];
				}),
				_: 1
			}, _parent));
			_push(`</div></div></section>`);
			if (__props.faq.length) {
				_push(`<section class="section" data-v-d8dd750a><div class="wrap" data-v-d8dd750a><div class="home-narrow" data-v-d8dd750a><div class="between home-head" data-v-d8dd750a><h2 class="t-h2" data-v-d8dd750a>Meistgestellte Fragen</h2>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/faq",
					class: "btn btn--quiet"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Alle Fragen`);
						else return [(0, vue_exports.createTextVNode)("Alle Fragen")];
					}),
					_: 1
				}, _parent));
				_push(`</div><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.faq, (entry) => {
					_push(`<div class="acc" data-v-d8dd750a><button class="acc__head" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", openFaq.value === entry.id)}${(0, server_renderer_exports.ssrRenderAttr)("aria-controls", `faq-${entry.id}`)} data-v-d8dd750a>${(0, server_renderer_exports.ssrInterpolate)(entry.question)} `);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: openFaq.value === entry.id ? "minus" : "plus",
						size: 20
					}, null, _parent));
					_push(`</button><div${(0, server_renderer_exports.ssrRenderAttr)("id", `faq-${entry.id}`)} class="acc__body" style="${(0, server_renderer_exports.ssrRenderStyle)(openFaq.value === entry.id ? null : { display: "none" })}" data-v-d8dd750a>${(0, server_renderer_exports.ssrInterpolate)(entry.answer)}</div></div>`);
				});
				_push(`<!--]--></div></div></section>`);
			} else _push(`<!---->`);
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Startseite/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Startseite/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-d8dd750a"]]);
//#endregion
export { Index_default as default };
