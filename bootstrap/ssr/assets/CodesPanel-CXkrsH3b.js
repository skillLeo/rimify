import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-COuF1lMZ.js";
import { P as undescribedCodes, l as KINDS, o as useSketch, u as LEVELS } from "./gutachtenStore-DERNJqCs.js";
import { t as CodeDefine_default } from "./CodeDefine-9FJkBZOa.js";
//#region resources/js/Pages/Admin/Skizze/parts/CodesPanel.vue?vue&type=script&setup=true&lang.ts
var CodesPanel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CodesPanel",
	__ssrInlineRender: true,
	setup(__props) {
		const { state } = useSketch();
		const query = (0, vue_exports.ref)("");
		const editing = (0, vue_exports.ref)(null);
		const adding = (0, vue_exports.ref)(false);
		const open = (0, vue_exports.computed)(() => undescribedCodes(state.cells, state.codes));
		const shown = (0, vue_exports.computed)(() => {
			const q = query.value.trim().toLowerCase();
			const list = [...state.codes].sort((a, b) => Number(a.text !== null) - Number(b.text !== null) || a.code.localeCompare(b.code, "de", { numeric: true }));
			return q === "" ? list : list.filter((code) => `${code.code} ${code.text ?? ""}`.toLowerCase().includes(q));
		});
		function kindLabel(kind) {
			return KINDS.find((k) => k.value === kind)?.label ?? "";
		}
		function levelLabel(level) {
			return LEVELS.find((l) => l.value === level)?.label ?? "";
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "sk-codespanel",
				"aria-labelledby": "sk-codes-h"
			}, _attrs))} data-v-b73e8629><div class="sk-codespanel__head" data-v-b73e8629><h3 id="sk-codes-h" class="sk-side__title" data-v-b73e8629>Auflagen dieses Gutachtens</h3><span class="sk-count" data-v-b73e8629>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(state).codes.length)} Codes`);
			if (open.value.length) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(open.value.length)} ohne Beschreibung<!--]-->`);
			else _push(`<!---->`);
			_push(`</span></div><label class="visually-hidden" for="sk-codes-q" data-v-b73e8629>Codes durchsuchen</label><input id="sk-codes-q"${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="input" type="search" placeholder="Code oder Wort im Text" autocomplete="off" data-v-b73e8629>`);
			if (adding.value) {
				_push(`<div class="sk-codespanel__form" data-v-b73e8629>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(CodeDefine_default, {
					code: "",
					"id-prefix": "sk-new-code",
					onDone: ($event) => adding.value = false,
					onCancel: ($event) => adding.value = false
				}, null, _parent));
				_push(`</div>`);
			} else {
				_push(`<button class="btn btn--ghost sk-codespanel__add" type="button" data-v-b73e8629>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "plus",
					size: 20
				}, null, _parent));
				_push(` Code hinzufügen</button>`);
			}
			_push(`<ul class="sk-codelist" data-v-b73e8629><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(shown.value, (code) => {
				_push(`<li class="sk-codeitem" data-v-b73e8629><div class="sk-codeitem__head" data-v-b73e8629><span class="${(0, server_renderer_exports.ssrRenderClass)([{ "sk-code--open": code.text === null }, "sk-code"])}" data-v-b73e8629>${(0, server_renderer_exports.ssrInterpolate)(code.code)}</span>`);
				if (code.text !== null) {
					_push(`<span class="sk-codeitem__kind" data-v-b73e8629>${(0, server_renderer_exports.ssrInterpolate)(kindLabel(code.kind))}`);
					if (levelLabel(code.level) !== kindLabel(code.kind)) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(levelLabel(code.level))}<!--]-->`);
					else _push(`<!---->`);
					_push(`</span>`);
				} else _push(`<span class="adm-tag adm-tag--warn" data-v-b73e8629>ohne Beschreibung</span>`);
				if (editing.value !== code.code) _push(`<button class="sk-codeitem__edit" type="button" data-v-b73e8629>${(0, server_renderer_exports.ssrInterpolate)(code.text === null ? "Beschreiben" : "Ändern")}</button>`);
				else _push(`<!---->`);
				_push(`</div>`);
				if (code.text !== null && editing.value !== code.code) _push(`<p class="sk-codeitem__text"${(0, server_renderer_exports.ssrRenderAttr)("title", code.text)} data-v-b73e8629>${(0, server_renderer_exports.ssrInterpolate)(code.text)}</p>`);
				else _push(`<!---->`);
				if (editing.value === code.code) {
					_push(`<div class="sk-codespanel__form" data-v-b73e8629>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(CodeDefine_default, {
						code: code.code,
						"id-prefix": `sk-edit-${code.code}`,
						onDone: ($event) => editing.value = null,
						onCancel: ($event) => editing.value = null
					}, null, _parent));
					_push(`</div>`);
				} else _push(`<!---->`);
				_push(`</li>`);
			});
			_push(`<!--]--></ul></section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Skizze/parts/CodesPanel.vue
var CodesPanel_exports = /* @__PURE__ */ __exportAll({ default: () => CodesPanel_default });
var _sfc_setup = CodesPanel_vue_vue_type_script_setup_true_lang_default.setup;
CodesPanel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Skizze/parts/CodesPanel.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var CodesPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CodesPanel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-b73e8629"]]);
//#endregion
export { CodesPanel_exports as n, CodesPanel_default as t };
