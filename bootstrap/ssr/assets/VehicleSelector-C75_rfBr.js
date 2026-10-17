import { a as link_default, o as useForm, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { u as contactHref } from "./useShopFeedback-DOGyiD0l.js";
import { t as anzahl } from "./format-6R0uUMt3.js";
import { t as Icon_default } from "./Icon-58DOAUuC.js";
import { t as DocFacsimile_default } from "./DocFacsimile-DzKB6PUL.js";
//#region resources/js/Components/Vehicle/VehicleSelector.vue?vue&type=script&setup=true&lang.ts
var VehicleSelector_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "VehicleSelector",
	__ssrInlineRender: true,
	props: {
		makes: {},
		models: {},
		variants: {},
		selectedMake: {},
		selectedModel: {},
		basePath: { default: "/felgen-suchen" },
		baseQuery: { default: () => ({}) },
		returnTo: { default: null },
		compact: {
			type: Boolean,
			default: false
		},
		headingLevel: { default: 3 }
	},
	setup(__props) {
		/**
		* The vehicle selector: the key numbers and the guided route, side by side from 900 px — in that order in the markup,
		* so what is seen first is what Tab and a screen reader reach first.
		*
		* Two routes in, because the two halves of this audience are genuinely different. Someone who
		* knows their car picks Marke → Modell → Variante; someone holding their Fahrzeugschein types four
		* characters and three, which is faster — and is also the only route that can resolve to two cars.
		*
		* Three outcomes, and none of them is a dead end (R-09):
		*   one match       → the vehicle is written and the listing opens;
		*   several matches → the card expands into a chooser. NEVER an error — a confirmation;
		*   no match        → everything typed stays on screen and three ways forward are offered.
		*
		* The drill is server-driven, so the back button works and a chosen make is a shareable URL.
		*
		* Where the key numbers are found is written next to the fields, not hidden in the FAQ: it is the
		* question this form is asked most often, and an answer one tap away is not an answer.
		*/
		const props = __props;
		function drill(params) {
			return Object.fromEntries(Object.entries({
				...props.baseQuery,
				...params
			}).filter((entry) => entry[1] !== null && entry[1] !== ""));
		}
		const restartHref = (0, vue_exports.computed)(() => {
			const query = new URLSearchParams(Object.entries(drill({})).map(([k, v]) => [k, String(v)])).toString();
			return query === "" ? props.basePath : `${props.basePath}?${query}`;
		});
		const page = usePage();
		const keysClosed = (0, vue_exports.computed)(() => page.props.keyNumbersClosed ?? null);
		const lookup = (0, vue_exports.computed)(() => page.props.lookup ?? null);
		const query = (0, vue_exports.ref)("");
		const doc = (0, vue_exports.ref)("neu");
		const helpOpen = (0, vue_exports.ref)(false);
		(0, vue_exports.ref)(null);
		const keys = useForm({
			hsn: "",
			tsn: "",
			zurueck: null
		});
		const choice = useForm({
			fahrzeug: 0,
			zurueck: null
		});
		const missHref = (0, vue_exports.computed)(() => {
			const miss = lookup.value;
			return contactHref({
				subject: `Fahrzeug nicht gefunden: HSN ${miss?.hsn ?? keys.hsn} · TSN ${miss?.tsn ?? keys.tsn}`,
				from: page.url
			});
		});
		const emptyHref = (0, vue_exports.computed)(() => contactHref({
			subject: "Mein Fahrzeug ist nicht dabei",
			from: page.url
		}));
		const level = (0, vue_exports.computed)(() => {
			if (props.selectedMake === null) return "make";
			return props.selectedModel === null ? "model" : "variant";
		});
		const stepLabel = (0, vue_exports.computed)(() => {
			if (level.value === "make") return "Marke wählen";
			return level.value === "model" ? "Modell wählen" : "Variante wählen";
		});
		const rows = (0, vue_exports.computed)(() => {
			const needle = query.value.trim().toLowerCase();
			if (level.value === "make") return props.makes.filter((m) => needle === "" || m.make.toLowerCase().includes(needle)).map((m) => ({
				key: m.make,
				label: m.make,
				sub: null,
				note: anzahl(m.models, "Modell", "Modelle"),
				blocked: false
			}));
			if (level.value === "model") return props.models.filter((m) => needle === "" || m.model.toLowerCase().includes(needle)).map((m) => ({
				key: m.model,
				label: m.model,
				sub: null,
				note: anzahl(m.variants, "Variante", "Varianten"),
				blocked: false
			}));
			return props.variants.filter((v) => needle === "" || v.variant.toLowerCase().includes(needle)).map((v) => ({
				key: String(v.id),
				label: v.variant,
				sub: v.approval ?? null,
				note: v.approval && v.buildKnown === false ? "" : v.buildWindow,
				blocked: v.needsReview
			}));
		});
		(0, vue_exports.watch)(level, () => {
			query.value = "";
		});
		const drilling = (0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["vsel", { "vsel--compact": __props.compact }] }, _attrs))} data-v-205b8a22><section class="vsel__col vsel__col--keys" aria-labelledby="vsel-keys-title" data-v-205b8a22>`);
			(0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)(`h${__props.headingLevel}`), {
				id: "vsel-keys-title",
				class: "t-h3 vsel__title"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Mit Schlüsselnummern`);
					else return [(0, vue_exports.createTextVNode)("Mit Schlüsselnummern")];
				}),
				_: 1
			}), _parent);
			if (keysClosed.value) _push(`<p class="vsel__closed" data-v-205b8a22>${(0, server_renderer_exports.ssrInterpolate)(keysClosed.value)}</p>`);
			else _push(`<form data-v-205b8a22><div class="vsel__keys" data-v-205b8a22><div data-v-205b8a22><label class="field-label"${(0, server_renderer_exports.ssrRenderAttr)("for", `hsn-${__props.basePath}`)} data-v-205b8a22>HSN</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `hsn-${__props.basePath}`)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": (0, vue_exports.unref)(keys).errors.hsn }, "field field--key"])}"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(keys).hsn)} inputmode="numeric" autocomplete="off" enterkeyhint="next" placeholder="0005"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(keys).errors.hsn ? "true" : void 0)} data-v-205b8a22></div><div data-v-205b8a22><label class="field-label"${(0, server_renderer_exports.ssrRenderAttr)("for", `tsn-${__props.basePath}`)} data-v-205b8a22>TSN</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `tsn-${__props.basePath}`)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": (0, vue_exports.unref)(keys).errors.tsn }, "field field--key"])}"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(keys).tsn)} maxlength="3" autocomplete="off" enterkeyhint="go" placeholder="582"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(keys).errors.tsn ? "true" : void 0)} data-v-205b8a22></div></div><span class="field-error" data-v-205b8a22>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(keys).errors.hsn ?? (0, vue_exports.unref)(keys).errors.tsn ?? "")}</span><p class="field-help" data-v-205b8a22> Beide stehen in deiner Zulassungsbescheinigung Teil I – die HSN in Feld 2.1, die TSN in Feld 2.2. <button class="vsel__helplink" type="button" data-v-205b8a22>${(0, server_renderer_exports.ssrInterpolate)(helpOpen.value ? "Abbildung ausblenden" : "Abbildung zeigen")}</button></p><button class="btn btn--primary btn--block vsel__go" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(keys).processing) ? " disabled" : ""} data-v-205b8a22>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(keys).processing ? "Wird geprüft …" : "Fahrzeug wählen")}</button></form>`);
			if (lookup.value?.status === "ambiguous" && lookup.value.distinction) {
				_push(`<div class="vsel__chooser" data-v-205b8a22><p class="t-h3 vsel__chooser-title" data-v-205b8a22> Zu dieser Schlüsselnummer gibt es mehrere Varianten. </p>`);
				if (lookup.value.distinction.indistinguishable) _push(`<p class="quiet vsel__chooser-note" data-v-205b8a22> Die Varianten unterscheiden sich in keinem Feld, das wir anzeigen können. Die VSN aus deiner Zulassungsbescheinigung hilft weiter. </p>`);
				else _push(`<!---->`);
				_push(`<!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(lookup.value.distinction.rows, (row) => {
					_push(`<button class="vsel__candidate" type="button" data-v-205b8a22><span class="vsel__candidate-text" data-v-205b8a22><span class="vsel__candidate-name" data-v-205b8a22>${(0, server_renderer_exports.ssrInterpolate)(row.label)}</span><span class="data vsel__candidate-values" data-v-205b8a22><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(lookup.value.distinction.attributes, (attribute) => {
						_push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(lookup.value.distinction.labels[attribute])}: ${(0, server_renderer_exports.ssrInterpolate)(row.values[attribute])}<!--]-->`);
					});
					_push(`<!--]-->`);
					if (row.vsn) _push(`<!--[--> VSN ${(0, server_renderer_exports.ssrInterpolate)(row.vsn)}<!--]-->`);
					else _push(`<!---->`);
					_push(`</span></span><span class="btn btn--secondary btn--sm vsel__candidate-cta" data-v-205b8a22>Das ist meins</span></button>`);
				});
				_push(`<!--]--></div>`);
			} else if (lookup.value?.status === "not_found") {
				_push(`<div class="vsel__miss" data-v-205b8a22><p class="vsel__miss-title" data-v-205b8a22>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "warning",
					size: 20
				}, null, _parent));
				_push(` Zu dieser Kombination haben wir die Daten für dieses Fahrzeug noch nicht hinterlegt. </p><div class="vsel__miss-actions" data-v-205b8a22><button class="btn btn--secondary btn--sm" type="button" data-v-205b8a22> Schlüsselnummern prüfen </button>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: restartHref.value,
					class: "btn btn--secondary btn--sm"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(` Stattdessen Marke wählen `);
						else return [(0, vue_exports.createTextVNode)(" Stattdessen Marke wählen ")];
					}),
					_: 1
				}, _parent));
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: missHref.value,
					class: "btn btn--quiet btn--sm"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Bei uns nachfragen`);
						else return [(0, vue_exports.createTextVNode)("Bei uns nachfragen")];
					}),
					_: 1
				}, _parent));
				_push(`</div><p class="field-help vsel__miss-note" data-v-205b8a22>Deine HSN und TSN stehen dann schon im Betreff.</p></div>`);
			} else _push(`<!---->`);
			if (helpOpen.value) {
				_push(`<div class="vsel__doc" data-v-205b8a22><div class="vsel__toggle" role="group" aria-label="Fahrzeugschein" data-v-205b8a22><button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pill--on": doc.value === "neu" }, "pill"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", doc.value === "neu")} data-v-205b8a22> Neue Zulassungsbescheinigung </button><button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pill--on": doc.value === "alt" }, "pill"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", doc.value === "alt")} data-v-205b8a22> Alter Fahrzeugschein </button></div>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(DocFacsimile_default, {
					variant: doc.value,
					width: 520
				}, null, _parent));
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`</section><div class="vsel__divider" aria-hidden="true" data-v-205b8a22><span data-v-205b8a22>oder</span></div><section class="vsel__col" aria-labelledby="vsel-drill-title" data-v-205b8a22><div class="vsel__head" data-v-205b8a22>`);
			if (level.value !== "make") {
				_push(`<button class="vsel__back" type="button" data-v-205b8a22>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "chevron-right",
					size: 20
				}, null, _parent));
				_push(` ${(0, server_renderer_exports.ssrInterpolate)(level.value === "variant" ? __props.selectedMake : "Zurück")}</button>`);
			} else _push(`<!---->`);
			(0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)(`h${__props.headingLevel}`), {
				id: "vsel-drill-title",
				class: "t-h3 vsel__title"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(stepLabel.value)}`);
					else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(stepLabel.value), 1)];
				}),
				_: 1
			}), _parent);
			_push(`</div><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", `vsel-q-${__props.basePath}`)} data-v-205b8a22>Marke oder Modell suchen</label><div class="vsel__search" data-v-205b8a22>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "search",
				size: 20
			}, null, _parent));
			_push(`<input${(0, server_renderer_exports.ssrRenderAttr)("id", `vsel-q-${__props.basePath}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="field vsel__input" type="search" placeholder="Suchen" autocomplete="off" data-v-205b8a22></div><div class="row-list vsel__rows" data-v-205b8a22><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(rows.value, (row) => {
				_push(`<button class="row-item" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(choice).processing || drilling.value) ? " disabled" : ""} data-v-205b8a22><span class="vsel__main" data-v-205b8a22><span class="vsel__label" data-v-205b8a22>${(0, server_renderer_exports.ssrInterpolate)(row.label)} `);
				if (row.blocked) _push(`<span class="tag tag--unknown vsel__flag" data-v-205b8a22> Daten unvollständig </span>`);
				else _push(`<!---->`);
				_push(`</span>`);
				if (row.sub) _push(`<span class="data vsel__sub" data-v-205b8a22>${(0, server_renderer_exports.ssrInterpolate)(row.sub)}</span>`);
				else _push(`<!---->`);
				_push(`</span>`);
				if (row.note) _push(`<span class="data vsel__note" data-v-205b8a22>${(0, server_renderer_exports.ssrInterpolate)(row.note)}</span>`);
				else _push(`<!---->`);
				_push(`</button>`);
			});
			_push(`<!--]-->`);
			if (rows.value.length === 0 && query.value.trim() !== "") _push(`<p class="quiet vsel__empty" data-v-205b8a22> Kein Treffer. Prüfe die Schreibweise oder nutze die Schlüsselnummern. </p>`);
			else if (rows.value.length === 0) {
				_push(`<p class="quiet vsel__empty" data-v-205b8a22> Hier ist noch kein Fahrzeug hinterlegt. `);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: emptyHref.value }, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Schreib uns, welches Auto du fährst`);
						else return [(0, vue_exports.createTextVNode)("Schreib uns, welches Auto du fährst")];
					}),
					_: 1
				}, _parent));
				_push(`. </p>`);
			} else _push(`<!---->`);
			_push(`</div></section></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Vehicle/VehicleSelector.vue
var _sfc_setup = VehicleSelector_vue_vue_type_script_setup_true_lang_default.setup;
VehicleSelector_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Vehicle/VehicleSelector.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var VehicleSelector_default = /*#__PURE__*/ _plugin_vue_export_helper_default(VehicleSelector_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-205b8a22"]]);
//#endregion
export { VehicleSelector_default as t };
