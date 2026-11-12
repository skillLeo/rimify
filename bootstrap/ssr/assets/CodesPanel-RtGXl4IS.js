import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-D0z-a8p_.js";
import { h as useGutachtenPage, m as useEntry } from "./entryStore-wk8wq0su.js";
import { t as CodeDefine_default } from "./CodeDefine-BHsvJiAd.js";
import { t as LegendDialog_default } from "./LegendDialog-BbfBvC3E.js";
//#region resources/js/Pages/Admin/Gutachten/Erfassung/CodesPanel.vue?vue&type=script&setup=true&lang.ts
var CodesPanel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CodesPanel",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* „Auflagen dieses Gutachtens“ (the Gutachten rework §4.5, §7 step 4): every code of this paper with its text, kept per paper —
		* „68B“ means what this paper prints, whatever another one says. Staff describe a code here as they come across it in the PDF;
		* the codes fields complete from this list.
		*/
		const { state } = useEntry();
		const page = useGutachtenPage();
		const query = (0, vue_exports.ref)("");
		const editing = (0, vue_exports.ref)(null);
		const adding = (0, vue_exports.ref)(false);
		const legendOpen = (0, vue_exports.ref)(false);
		const described = (0, vue_exports.computed)(() => new Set(page.props.conditions.map((c) => c.code)));
		const open = (0, vue_exports.computed)(() => state.entry.undescribed.filter((code) => !described.value.has(code)));
		const total = (0, vue_exports.computed)(() => page.props.conditions.length + open.value.length);
		const shown = (0, vue_exports.computed)(() => {
			const q = query.value.trim().toLowerCase();
			const list = [...open.value.map((code) => ({
				code,
				kindLabel: "",
				text: null,
				level: null
			})), ...[...page.props.conditions].sort((a, b) => a.code.localeCompare(b.code, "de", { numeric: true })).map((c) => ({
				code: c.code,
				kindLabel: c.kindLabel,
				text: c.text,
				level: c.level ?? null
			}))];
			return q === "" ? list : list.filter((code) => code.code === editing.value || `${code.code} ${code.text ?? ""}`.toLowerCase().includes(q));
		});
		const panel = (0, vue_exports.ref)(null);
		function closed(selector) {
			(0, vue_exports.nextTick)(() => panel.value?.querySelector(selector)?.focus());
		}
		function closeNew() {
			adding.value = false;
			closed(".ef-codespanel__add");
		}
		function closeEdit(code) {
			editing.value = null;
			closed(`[data-code="${CSS.escape(code)}"]`);
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				ref_key: "panel",
				ref: panel,
				class: "ef-codespanel",
				"aria-labelledby": "ef-panel-h"
			}, _attrs))} data-v-01625ba5><div class="ef-codespanel__head" data-v-01625ba5><h3 id="ef-panel-h" class="ef-side__title" data-v-01625ba5>Auflagen dieses Gutachtens</h3><span class="ef-count" data-v-01625ba5>${(0, server_renderer_exports.ssrInterpolate)(total.value === 1 ? "1 Code" : `${total.value} Codes`)}`);
			if (open.value.length) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(open.value.length)} ohne Beschreibung<!--]-->`);
			else _push(`<!---->`);
			_push(`</span></div><label class="visually-hidden" for="ef-panel-q" data-v-01625ba5>Codes durchsuchen</label><input id="ef-panel-q"${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="input" type="search" placeholder="Code oder Wort im Text" autocomplete="off" data-v-01625ba5>`);
			if (adding.value) {
				_push(`<div class="ef-codespanel__form" data-v-01625ba5>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(CodeDefine_default, {
					code: "",
					"id-prefix": "ef-new-code",
					onDone: closeNew,
					onCancel: closeNew
				}, null, _parent));
				_push(`</div>`);
			} else if ((0, vue_exports.unref)(state).editable) {
				_push(`<div class="ef-codespanel__adds" data-v-01625ba5><button class="btn btn--ghost ef-codespanel__add" type="button" data-v-01625ba5>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "plus",
					size: 20
				}, null, _parent));
				_push(` Code hinzufügen</button><button class="btn btn--ghost ef-codespanel__add" type="button" data-v-01625ba5>Ganze Legende einfügen</button></div>`);
			} else _push(`<!---->`);
			_push(`<ul class="ef-codelist" data-v-01625ba5><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(shown.value, (code) => {
				_push(`<li class="ef-codeitem" data-v-01625ba5><div class="ef-codeitem__head" data-v-01625ba5><span class="${(0, server_renderer_exports.ssrRenderClass)([{ "ef-code--open": code.text === null }, "ef-code"])}" data-v-01625ba5>${(0, server_renderer_exports.ssrInterpolate)(code.code)}</span>`);
				if (code.text !== null) _push(`<span class="ef-codeitem__kind" data-v-01625ba5>${(0, server_renderer_exports.ssrInterpolate)(code.kindLabel)}</span>`);
				else _push(`<span class="adm-tag adm-tag--warn" data-v-01625ba5>ohne Beschreibung</span>`);
				if ((0, vue_exports.unref)(state).editable && editing.value !== code.code) _push(`<button class="ef-codeitem__edit" type="button"${(0, server_renderer_exports.ssrRenderAttr)("data-code", code.code)} data-v-01625ba5>${(0, server_renderer_exports.ssrInterpolate)(code.text === null ? "Beschreiben" : "Ändern")}</button>`);
				else _push(`<!---->`);
				_push(`</div>`);
				if (code.text !== null && editing.value !== code.code) _push(`<p class="ef-codeitem__text"${(0, server_renderer_exports.ssrRenderAttr)("title", code.text)} data-v-01625ba5>${(0, server_renderer_exports.ssrInterpolate)(code.text)}</p>`);
				else _push(`<!---->`);
				if (editing.value === code.code) {
					_push(`<div class="ef-codespanel__form" data-v-01625ba5>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(CodeDefine_default, {
						code: code.code,
						"id-prefix": `ef-edit-${code.code}`,
						onDone: ($event) => closeEdit(code.code),
						onCancel: ($event) => closeEdit(code.code)
					}, null, _parent));
					_push(`</div>`);
				} else _push(`<!---->`);
				_push(`</li>`);
			});
			_push(`<!--]--></ul>`);
			if ((0, vue_exports.unref)(state).editable) _push((0, server_renderer_exports.ssrRenderComponent)(LegendDialog_default, {
				open: legendOpen.value,
				"onUpdate:open": ($event) => legendOpen.value = $event
			}, null, _parent));
			else _push(`<!---->`);
			_push(`</section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Erfassung/CodesPanel.vue
var CodesPanel_exports = /* @__PURE__ */ __exportAll({ default: () => CodesPanel_default });
var _sfc_setup = CodesPanel_vue_vue_type_script_setup_true_lang_default.setup;
CodesPanel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Erfassung/CodesPanel.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var CodesPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CodesPanel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-01625ba5"]]);
//#endregion
export { CodesPanel_exports as n, CodesPanel_default as t };
