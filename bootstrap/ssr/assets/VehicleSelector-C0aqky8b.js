import { a as usePage, c as vue_exports, i as useForm, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { t as Icon_default } from "./Icon-CPN9Jl2j.js";
import { t as DocFacsimile_default } from "./DocFacsimile-D9bZK4Sy.js";
import { t as mailtoHref } from "./mailto-LEYUvS8P.js";
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
		compact: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* The vehicle selector: the guided route and the key numbers, side by side.
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
		const page = usePage();
		const lookup = (0, vue_exports.computed)(() => page.props.lookup ?? null);
		const query = (0, vue_exports.ref)("");
		const doc = (0, vue_exports.ref)("neu");
		const helpOpen = (0, vue_exports.ref)(false);
		(0, vue_exports.ref)(null);
		const keys = useForm({
			hsn: "",
			tsn: ""
		});
		const choice = useForm({ fahrzeug: 0 });
		const contact = (0, vue_exports.computed)(() => page.props.contact ?? null);
		const missMailHref = (0, vue_exports.computed)(() => {
			const miss = lookup.value;
			return contact.value === null ? "/kontakt" : mailtoHref(contact.value.email, {
				subject: "Fahrzeug nicht gefunden",
				body: `HSN: ${miss?.hsn ?? keys.hsn}\nTSN: ${miss?.tsn ?? keys.tsn}\nMarke und Modell: \n\n`
			});
		});
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
				note: `${m.models} Modelle`,
				blocked: false
			}));
			if (level.value === "model") return props.models.filter((m) => needle === "" || m.model.toLowerCase().includes(needle)).map((m) => ({
				key: m.model,
				label: m.model,
				note: `${m.variants} Varianten`,
				blocked: false
			}));
			return props.variants.filter((v) => needle === "" || v.variant.toLowerCase().includes(needle)).map((v) => ({
				key: String(v.id),
				label: v.variant,
				note: v.buildWindow,
				blocked: v.needsReview
			}));
		});
		(0, vue_exports.watch)(level, () => {
			query.value = "";
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["vsel", { "vsel--compact": __props.compact }] }, _attrs))} data-v-0ff2abe6><section class="vsel__col" aria-labelledby="vsel-drill-title" data-v-0ff2abe6><div class="vsel__head" data-v-0ff2abe6>`);
			if (level.value !== "make") {
				_push(`<button class="vsel__back" type="button" data-v-0ff2abe6>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "chevron-right",
					size: 20
				}, null, _parent));
				_push(` ${(0, server_renderer_exports.ssrInterpolate)(level.value === "variant" ? __props.selectedMake : "Zurück")}</button>`);
			} else _push(`<!---->`);
			_push(`<h3 id="vsel-drill-title" class="t-h3 vsel__title" data-v-0ff2abe6>${(0, server_renderer_exports.ssrInterpolate)(stepLabel.value)}</h3></div><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", `vsel-q-${__props.basePath}`)} data-v-0ff2abe6>Marke oder Modell suchen</label><div class="vsel__search" data-v-0ff2abe6>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "search",
				size: 20
			}, null, _parent));
			_push(`<input${(0, server_renderer_exports.ssrRenderAttr)("id", `vsel-q-${__props.basePath}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="field vsel__input" type="search" placeholder="Suchen" autocomplete="off" data-v-0ff2abe6></div><div class="row-list vsel__rows" data-v-0ff2abe6><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(rows.value, (row) => {
				_push(`<button class="row-item" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(choice).processing) ? " disabled" : ""} data-v-0ff2abe6><span class="vsel__label" data-v-0ff2abe6>${(0, server_renderer_exports.ssrInterpolate)(row.label)} `);
				if (row.blocked) _push(`<span class="tag tag--unknown vsel__flag" data-v-0ff2abe6> Daten unvollständig </span>`);
				else _push(`<!---->`);
				_push(`</span><span class="data vsel__note" data-v-0ff2abe6>${(0, server_renderer_exports.ssrInterpolate)(row.note)}</span></button>`);
			});
			_push(`<!--]-->`);
			if (rows.value.length === 0) _push(`<p class="quiet vsel__empty" data-v-0ff2abe6> Kein Treffer. Prüfe die Schreibweise oder nutze die Schlüsselnummern. </p>`);
			else _push(`<!---->`);
			_push(`</div></section><div class="vsel__divider" aria-hidden="true" data-v-0ff2abe6><span data-v-0ff2abe6>oder</span></div><section class="vsel__col vsel__col--keys" aria-labelledby="vsel-keys-title" data-v-0ff2abe6><h3 id="vsel-keys-title" class="t-h3 vsel__title" data-v-0ff2abe6>Mit Schlüsselnummern</h3><form data-v-0ff2abe6><div class="vsel__keys" data-v-0ff2abe6><div data-v-0ff2abe6><label class="field-label"${(0, server_renderer_exports.ssrRenderAttr)("for", `hsn-${__props.basePath}`)} data-v-0ff2abe6>HSN</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `hsn-${__props.basePath}`)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": (0, vue_exports.unref)(keys).errors.hsn }, "field field--key"])}"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(keys).hsn)} inputmode="numeric" maxlength="4" autocomplete="off" enterkeyhint="next" placeholder="0005"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(keys).errors.hsn ? "true" : void 0)} data-v-0ff2abe6></div><div data-v-0ff2abe6><label class="field-label"${(0, server_renderer_exports.ssrRenderAttr)("for", `tsn-${__props.basePath}`)} data-v-0ff2abe6>TSN</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `tsn-${__props.basePath}`)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": (0, vue_exports.unref)(keys).errors.tsn }, "field field--key"])}"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(keys).tsn)} maxlength="3" autocomplete="off" enterkeyhint="go" placeholder="582"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(keys).errors.tsn ? "true" : void 0)} data-v-0ff2abe6></div></div><span class="field-error" data-v-0ff2abe6>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(keys).errors.hsn ?? (0, vue_exports.unref)(keys).errors.tsn ?? "")}</span><p class="field-help" data-v-0ff2abe6> Beide stehen in deiner Zulassungsbescheinigung Teil I – die HSN in Feld 2.1, die TSN in Feld 2.2. <button class="vsel__helplink" type="button" data-v-0ff2abe6>${(0, server_renderer_exports.ssrInterpolate)(helpOpen.value ? "Abbildung ausblenden" : "Abbildung zeigen")}</button></p><button class="btn btn--primary btn--block vsel__go" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(keys).processing) ? " disabled" : ""} data-v-0ff2abe6>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(keys).processing ? "Wird geprüft …" : "Fahrzeug wählen")}</button></form>`);
			if (lookup.value?.status === "ambiguous" && lookup.value.distinction) {
				_push(`<div class="vsel__chooser" data-v-0ff2abe6><p class="t-h3 vsel__chooser-title" data-v-0ff2abe6> Zu dieser Schlüsselnummer gibt es mehrere Varianten. </p>`);
				if (lookup.value.distinction.indistinguishable) _push(`<p class="quiet vsel__chooser-note" data-v-0ff2abe6> Die Varianten unterscheiden sich in keinem Feld, das wir anzeigen können. Die VSN aus deinem Fahrzeugschein hilft weiter. </p>`);
				else _push(`<!---->`);
				_push(`<!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(lookup.value.distinction.rows, (row) => {
					_push(`<button class="vsel__candidate" type="button" data-v-0ff2abe6><span class="vsel__candidate-text" data-v-0ff2abe6><span class="vsel__candidate-name" data-v-0ff2abe6>${(0, server_renderer_exports.ssrInterpolate)(row.label)}</span><span class="data vsel__candidate-values" data-v-0ff2abe6><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(lookup.value.distinction.attributes, (attribute) => {
						_push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(lookup.value.distinction.labels[attribute])}: ${(0, server_renderer_exports.ssrInterpolate)(row.values[attribute])}<!--]-->`);
					});
					_push(`<!--]-->`);
					if (row.vsn) _push(`<!--[--> VSN ${(0, server_renderer_exports.ssrInterpolate)(row.vsn)}<!--]-->`);
					else _push(`<!---->`);
					_push(`</span></span><span class="btn btn--secondary btn--sm vsel__candidate-cta" data-v-0ff2abe6>Das ist meins</span></button>`);
				});
				_push(`<!--]--></div>`);
			} else if (lookup.value?.status === "not_found") {
				_push(`<div class="vsel__miss" data-v-0ff2abe6><p class="vsel__miss-title" data-v-0ff2abe6>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "warning",
					size: 20
				}, null, _parent));
				_push(` Zu dieser Kombination haben wir kein Fahrzeug gefunden. </p><div class="vsel__miss-actions" data-v-0ff2abe6><button class="btn btn--secondary btn--sm" type="button" data-v-0ff2abe6> Schlüsselnummern prüfen </button>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: __props.basePath,
					class: "btn btn--secondary btn--sm"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(` Stattdessen Marke wählen `);
						else return [(0, vue_exports.createTextVNode)(" Stattdessen Marke wählen ")];
					}),
					_: 1
				}, _parent));
				if (contact.value) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", missMailHref.value)} class="btn btn--quiet btn--sm" data-v-0ff2abe6>Per E-Mail nachfragen</a>`);
				else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/kontakt",
					class: "btn btn--quiet btn--sm"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Zur Kontaktseite`);
						else return [(0, vue_exports.createTextVNode)("Zur Kontaktseite")];
					}),
					_: 1
				}, _parent));
				_push(`</div>`);
				if (contact.value) _push(`<p class="field-help vsel__miss-note" data-v-0ff2abe6> Deine HSN und TSN stehen schon in der E-Mail an <span class="vsel__miss-address" data-v-0ff2abe6>${(0, server_renderer_exports.ssrInterpolate)(contact.value.email)}</span>. </p>`);
				else _push(`<!---->`);
				_push(`</div>`);
			} else _push(`<!---->`);
			if (helpOpen.value) {
				_push(`<div class="vsel__doc" data-v-0ff2abe6><div class="vsel__toggle" role="group" aria-label="Fahrzeugschein" data-v-0ff2abe6><button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pill--on": doc.value === "neu" }, "pill"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", doc.value === "neu")} data-v-0ff2abe6> Neuer Fahrzeugschein </button><button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pill--on": doc.value === "alt" }, "pill"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", doc.value === "alt")} data-v-0ff2abe6> Alter Fahrzeugschein </button></div>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(DocFacsimile_default, {
					variant: doc.value,
					width: 520
				}, null, _parent));
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`</section></div>`);
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
var VehicleSelector_default = /*#__PURE__*/ _plugin_vue_export_helper_default(VehicleSelector_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-0ff2abe6"]]);
//#endregion
export { VehicleSelector_default as t };
