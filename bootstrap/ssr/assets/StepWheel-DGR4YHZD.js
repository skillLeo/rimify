import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-COuF1lMZ.js";
import { n as decimal, s as withUnit } from "./format-6R0uUMt3.js";
import { _ as WHEELS, o as useSketch, p as PAPER_WHEEL, w as sizeName } from "./gutachtenStore-DERNJqCs.js";
//#region resources/js/Pages/Admin/Skizze/parts/StepWheel.vue?vue&type=script&setup=true&lang.ts
var StepWheel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "StepWheel",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* Step 2, Felge (the brief §7, changed in v2): one paper is for one wheel in one size, so the step asks for exactly one
		* size — listed by dimension, its colours as dots beneath. Colours are not chosen: every colour of the size is covered.
		*/
		const { state, go } = useSketch();
		const query = (0, vue_exports.ref)("DB8GT2");
		const found = (0, vue_exports.computed)(() => {
			const q = query.value.trim().toLowerCase();
			return q === "" ? WHEELS : WHEELS.filter((wheel) => `${wheel.brand} ${wheel.model}`.toLowerCase().includes(q));
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "sk-step",
				"aria-labelledby": "sk-wheel-h"
			}, _attrs))} data-v-5daeb0df><h2 id="sk-wheel-h" class="adm-section__title" tabindex="-1" data-v-5daeb0df>Für welche Felge gilt das Gutachten?</h2><p class="adm-note" data-v-5daeb0df>Ein Gutachten gilt für eine Felge in einer Größe. Wähl die Größe; ihre Farben gelten alle mit.</p><div class="sk-wheel" data-v-5daeb0df><div class="form-field sk-wheel__search" data-v-5daeb0df><label class="form-field__label" for="sk-wheel-q" data-v-5daeb0df>Felge suchen</label><input id="sk-wheel-q"${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="input" type="search" placeholder="Marke, Modell oder Radtyp" autocomplete="off" data-v-5daeb0df></div><p class="sk-wheel__paper" data-v-5daeb0df><strong data-v-5daeb0df>Im Gutachten:</strong> ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(PAPER_WHEEL))}</p><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(found.value, (wheel) => {
				_push(`<fieldset class="sk-fieldset sk-wheel__model" data-v-5daeb0df><legend class="sk-wheel__name" data-v-5daeb0df>${(0, server_renderer_exports.ssrInterpolate)(wheel.brand)} ${(0, server_renderer_exports.ssrInterpolate)(wheel.model)}</legend><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(wheel.sizes, (size) => {
					_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "sk-size--on": (0, vue_exports.unref)(state).sizeId === size.id }, "sk-size"])}" data-v-5daeb0df><input class="sk-size__radio" type="radio" name="sk-size"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(state).sizeId === size.id) ? " checked" : ""} data-v-5daeb0df><span class="sk-size__text" data-v-5daeb0df><span class="sk-size__dim" data-v-5daeb0df>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(sizeName)(size))} · Mittenloch ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)((0, vue_exports.unref)(decimal)(size.bore, 1), "mm"))}</span><span class="sk-size__colours" data-v-5daeb0df><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(size.colours, (colour) => {
						_push(`<span class="sk-size__colour" data-v-5daeb0df><span class="sk-dot" data-qa-ignore style="${(0, server_renderer_exports.ssrRenderStyle)({ "--swatch": colour.hex })}" data-v-5daeb0df></span> ${(0, server_renderer_exports.ssrInterpolate)(colour.name)}</span>`);
					});
					_push(`<!--]-->`);
					if (size.colours.length === 1) _push(`<span class="sk-size__only" data-v-5daeb0df>nur in dieser Farbe</span>`);
					else _push(`<!---->`);
					_push(`</span></span></label>`);
				});
				_push(`<!--]--></fieldset>`);
			});
			_push(`<!--]-->`);
			if (found.value.length === 0) _push(`<p class="adm-note" data-v-5daeb0df>Keine Felge gefunden. In der Skizze gibt es Borbet DB8GT2 und BBS LeMans.</p>`);
			else _push(`<!---->`);
			_push(`<p class="adm-note sk-wheel__colours" data-v-5daeb0df> Farben wählst du hier nicht. Das Gutachten gilt für jede Farbe dieser Größe, auch für eine, die später dazukommt. </p></div><div class="sk-actions" data-v-5daeb0df><button class="btn btn--secondary sk-actions__left" type="button" data-v-5daeb0df>Zurück</button><button class="btn btn--primary" type="button" data-v-5daeb0df> Weiter: Fahrzeuge `);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "arrow-right",
				size: 20
			}, null, _parent));
			_push(`</button></div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Skizze/parts/StepWheel.vue
var StepWheel_exports = /* @__PURE__ */ __exportAll({ default: () => StepWheel_default });
var _sfc_setup = StepWheel_vue_vue_type_script_setup_true_lang_default.setup;
StepWheel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Skizze/parts/StepWheel.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var StepWheel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(StepWheel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-5daeb0df"]]);
//#endregion
export { StepWheel_exports as n, StepWheel_default as t };
