import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-D0z-a8p_.js";
import { t as AdminConfirm_default } from "./AdminConfirm-sC9Lzvnq.js";
import { h as useGutachtenPage, m as useEntry } from "./entryStore-58zM2Q96.js";
import { n as freshReload } from "./freshReload-CFXbzVlA.js";
import { t as CodeDefine_default } from "./CodeDefine-DzkwNNa1.js";
import { t as LegendDialog_default } from "./LegendDialog-Dn4MyOaL.js";
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
		const { state, base, save, settled } = useEntry();
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
		const deleting = (0, vue_exports.ref)(null);
		const deleteOpen = (0, vue_exports.ref)(false);
		const deleteBusy = (0, vue_exports.ref)(false);
		const deleteError = (0, vue_exports.ref)("");
		async function confirmDelete() {
			if (deleting.value === null) return;
			deleteBusy.value = true;
			try {
				await save("POST", "/codes/loeschen", {
					code: deleting.value.code,
					seen: deleting.value.uses
				});
				deleteOpen.value = false;
				freshReload("erfassung-codes", { only: ["conditions"] });
			} catch (failure) {
				deleteOpen.value = false;
				deleteError.value = failure instanceof Error ? failure.message : String(failure);
			} finally {
				deleteBusy.value = false;
			}
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				ref_key: "panel",
				ref: panel,
				class: "ef-codespanel",
				"aria-labelledby": "ef-panel-h"
			}, _attrs))} data-v-f9a80da0><div class="ef-codespanel__head" data-v-f9a80da0><h3 id="ef-panel-h" class="ef-side__title" data-v-f9a80da0>Auflagen dieses Gutachtens</h3><span class="ef-count" data-v-f9a80da0>${(0, server_renderer_exports.ssrInterpolate)(total.value === 1 ? "1 Code" : `${total.value} Codes`)}`);
			if (open.value.length) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(open.value.length)} ohne Beschreibung<!--]-->`);
			else _push(`<!---->`);
			_push(`</span></div><label class="visually-hidden" for="ef-panel-q" data-v-f9a80da0>Codes durchsuchen</label><input id="ef-panel-q"${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="input" type="search" placeholder="Code oder Wort im Text" autocomplete="off" data-v-f9a80da0>`);
			if (adding.value) {
				_push(`<div class="ef-codespanel__form" data-v-f9a80da0>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(CodeDefine_default, {
					code: "",
					"id-prefix": "ef-new-code",
					onDone: closeNew,
					onCancel: closeNew
				}, null, _parent));
				_push(`</div>`);
			} else if ((0, vue_exports.unref)(state).editable) {
				_push(`<div class="ef-codespanel__adds" data-v-f9a80da0><button class="btn btn--ghost ef-codespanel__add" type="button" data-v-f9a80da0>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "plus",
					size: 20
				}, null, _parent));
				_push(` Code hinzufügen</button><button class="btn btn--ghost ef-codespanel__add" type="button" data-v-f9a80da0>Ganze Legende einfügen</button></div>`);
			} else _push(`<!---->`);
			_push(`<ul class="ef-codelist" data-v-f9a80da0><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(shown.value, (code) => {
				_push(`<li class="ef-codeitem" data-v-f9a80da0><div class="ef-codeitem__head" data-v-f9a80da0><span class="${(0, server_renderer_exports.ssrRenderClass)([{ "ef-code--open": code.text === null }, "ef-code"])}" data-v-f9a80da0>${(0, server_renderer_exports.ssrInterpolate)(code.code)}</span>`);
				if (code.text !== null) _push(`<span class="ef-codeitem__kind" data-v-f9a80da0>${(0, server_renderer_exports.ssrInterpolate)(code.kindLabel)}</span>`);
				else _push(`<span class="adm-tag adm-tag--warn" data-v-f9a80da0>ohne Beschreibung</span>`);
				if ((0, vue_exports.unref)(state).editable && editing.value !== code.code) _push(`<button class="ef-codeitem__edit" type="button"${(0, server_renderer_exports.ssrRenderAttr)("data-code", code.code)} data-v-f9a80da0>${(0, server_renderer_exports.ssrInterpolate)(code.text === null ? "Beschreiben" : "Ändern")}</button>`);
				else _push(`<!---->`);
				if ((0, vue_exports.unref)(state).editable && editing.value !== code.code) _push(`<button class="ef-codeitem__delete" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${code.code} aus diesem Gutachten löschen`)} data-v-f9a80da0>Löschen</button>`);
				else _push(`<!---->`);
				_push(`</div>`);
				if (code.text !== null && editing.value !== code.code) _push(`<p class="ef-codeitem__text"${(0, server_renderer_exports.ssrRenderAttr)("title", code.text)} data-v-f9a80da0>${(0, server_renderer_exports.ssrInterpolate)(code.text)}</p>`);
				else _push(`<!---->`);
				if (editing.value === code.code) {
					_push(`<div class="ef-codespanel__form" data-v-f9a80da0>`);
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
			if (deleteError.value) _push(`<p class="form-field__error ef-codespanel__error" role="alert" data-v-f9a80da0>${(0, server_renderer_exports.ssrInterpolate)(deleteError.value)}</p>`);
			else _push(`<!---->`);
			if ((0, vue_exports.unref)(state).editable) _push((0, server_renderer_exports.ssrRenderComponent)(LegendDialog_default, {
				open: legendOpen.value,
				"onUpdate:open": ($event) => legendOpen.value = $event
			}, null, _parent));
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
				open: deleteOpen.value,
				"onUpdate:open": ($event) => deleteOpen.value = $event,
				title: deleting.value ? `„${deleting.value.code}“ überall löschen?` : "",
				body: deleting.value ? `${deleting.value.sentence} Gelöscht verschwindet er überall in diesem Gutachten, im Shop mit der Freigabe. Bestellungen behalten ihren Nachweis.` : "",
				"confirm-label": "Überall löschen",
				busy: deleteBusy.value,
				onConfirm: confirmDelete
			}, null, _parent));
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
var CodesPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CodesPanel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f9a80da0"]]);
//#endregion
export { CodesPanel_exports as n, CodesPanel_default as t };
