import { c as vue_exports, n as head_default, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { r as useShared } from "./useShared-B1ZdimaV.js";
import { t as Icon_default } from "./Icon-CPN9Jl2j.js";
import { t as AppLayout_default } from "./AppLayout-BVlt5D4s.js";
import { t as VehicleSelector_default } from "./VehicleSelector-C0aqky8b.js";
//#region resources/js/Pages/Check/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		makes: {},
		models: {},
		variants: {},
		selectedMake: {},
		selectedModel: {}
	},
	setup(__props) {
		/**
		* RIMIFY-CHECK as its own page: "does THIS wheel fit my car", asked directly.
		*
		* Two steps, and the stepper says which one is on screen — it never marks a step current while
		* showing another step's content. Step one is the vehicle. Step two is the wheel, and the answer
		* to it is the verdict panel on that wheel's product page, which names the car, the Gutachten and
		* every Auflage. There is no second, lighter check that could disagree with it.
		*
		* Choosing a vehicle writes it and opens the listing (FahrzeugController::adopt). Coming back here
		* with a vehicle set shows step one as done.
		*
		* One page for every width.
		*/
		const props = __props;
		const shared = useShared();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const changing = (0, vue_exports.ref)(false);
		const choosingVehicle = (0, vue_exports.computed)(() => vehicle.value === null || changing.value || props.selectedMake !== null);
		const STATES = [
			{
				tag: "tag--ok",
				label: "Freigegeben",
				text: "Das Gutachten deckt dein Fahrzeug in dieser Größe ab. Wir nennen die Gutachten-Nummer und ob eine Eintragung nötig ist."
			},
			{
				tag: "tag--warn",
				label: "Freigegeben mit Auflagen",
				text: "Zulässig unter Bedingungen aus dem Gutachten, etwa nur mit bestimmten Radschrauben. Jede Auflage steht als ganzer Satz da."
			},
			{
				tag: "tag--danger",
				label: "Nicht freigegeben",
				text: "Das Gutachten deckt diese Größe für dein Fahrzeug nicht ab. Steht der Grund im Gutachten, nennen wir ihn."
			},
			{
				tag: "tag--unknown",
				label: "Keine Angabe",
				text: "Für diese Kombination liegt uns kein Gutachten vor. Das heißt nicht, dass die Felge unzulässig ist – nur, dass wir es nicht belegen können."
			}
		];
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "RIMIFY-CHECK" }, null, _parent));
			_push(`<section class="section-dense" data-v-fce24440><div class="wrap chk" data-v-fce24440><h1 class="t-h1" data-v-fce24440>Passt diese Felge auf dein Auto?</h1><p class="t-lead chk__lead" data-v-fce24440> In zwei Schritten zur Antwort: Wir sagen dir, was das Gutachten erlaubt – und wenn uns keins vorliegt, sagen wir auch das. </p><ol class="steps chk__steps" aria-label="Fortschritt" data-v-fce24440><li class="${(0, server_renderer_exports.ssrRenderClass)([choosingVehicle.value ? "steps__item--on" : "steps__item--done", "steps__item"])}"${(0, server_renderer_exports.ssrRenderAttr)("aria-current", choosingVehicle.value ? "step" : void 0)} data-v-fce24440><span class="steps__num" data-v-fce24440>`);
			if (!choosingVehicle.value) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "check",
				size: 20
			}, null, _parent));
			else _push(`<!--[-->1<!--]-->`);
			_push(`</span> Fahrzeug wählen </li><li class="${(0, server_renderer_exports.ssrRenderClass)([{ "steps__item--on": !choosingVehicle.value }, "steps__item"])}"${(0, server_renderer_exports.ssrRenderAttr)("aria-current", !choosingVehicle.value ? "step" : void 0)} data-v-fce24440><span class="steps__num" data-v-fce24440>2</span> Felge wählen </li></ol>`);
			if (choosingVehicle.value) {
				_push(`<div class="chk__panel" data-v-fce24440>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(VehicleSelector_default, {
					makes: __props.makes,
					models: __props.models,
					variants: __props.variants,
					"selected-make": __props.selectedMake,
					"selected-model": __props.selectedModel,
					"base-path": "/rimify-check"
				}, null, _parent));
				_push(`</div>`);
			} else if (vehicle.value) {
				_push(`<!--[--><div class="chk__done" data-v-fce24440><div class="chk__done-text" data-v-fce24440><span class="micro" data-v-fce24440>Fahrzeug</span><p class="chk__vehicle" data-v-fce24440>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</p><p class="data" data-v-fce24440>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.keyNumbers)} · ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.buildWindow)}</p></div><button class="btn btn--quiet" type="button" data-v-fce24440> Ändern<span class="visually-hidden" data-v-fce24440> (Fahrzeug)</span></button></div><div class="chk__panel chk__step2" data-v-fce24440><h2 class="t-h3" data-v-fce24440>Felge wählen</h2><p class="t-body chk__step2-text" data-v-fce24440> Die Liste zeigt nur Felgen mit gültigem Gutachten für deinen ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.short)}. Auf jeder Produktseite steht das Ergebnis für die gewählte Größe – mit Gutachten-Nummer und allen Auflagen im Wortlaut. </p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen",
					class: "btn btn--primary chk__go"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(` Felgen für ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.short)} ansehen `);
						else return [(0, vue_exports.createTextVNode)(" Felgen für " + (0, vue_exports.toDisplayString)(vehicle.value.short) + " ansehen ", 1)];
					}),
					_: 1
				}, _parent));
				_push(`</div><!--]-->`);
			} else _push(`<!---->`);
			_push(`</div></section><section class="section band" data-v-fce24440><div class="wrap" data-v-fce24440><h2 class="t-h2" data-v-fce24440>Vier mögliche Ergebnisse</h2><dl class="chk__states" data-v-fce24440><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(STATES, (state) => {
				_push(`<div class="chk__state" data-v-fce24440><dt data-v-fce24440><span class="${(0, server_renderer_exports.ssrRenderClass)([state.tag, "tag"])}" data-v-fce24440>${(0, server_renderer_exports.ssrInterpolate)(state.label)}</span></dt><dd class="t-body" data-v-fce24440>${(0, server_renderer_exports.ssrInterpolate)(state.text)}</dd></div>`);
			});
			_push(`<!--]--></dl></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Check/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Check/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-fce24440"]]);
//#endregion
export { Index_default as default };
