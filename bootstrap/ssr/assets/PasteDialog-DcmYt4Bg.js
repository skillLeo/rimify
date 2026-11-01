import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { t as Dialog_default } from "./Dialog-Bv2Ro0-J.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { E as applyPaste, I as readPaste, R as tyreLabel, m as PASTE_EXAMPLES, o as useSketch } from "./gutachtenStore-DERNJqCs.js";
//#region resources/js/Pages/Admin/Skizze/parts/PasteDialog.vue?vue&type=script&setup=true&lang.ts
var PasteDialog_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "PasteDialog",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({ group: {} }, {
		"open": {
			type: Boolean,
			required: true
		},
		"openModifiers": {}
	}),
	emits: ["update:open"],
	setup(__props) {
		/**
		* „Mehrere einfügen" (the brief §4.4, §7 step 4): several sizes or front/rear pairs typed or pasted at once — one per
		* line, or a paragraph of the paper split at each „Nr." — read into a preview first. What does not read is shown in red
		* with the reason and left out; nothing is taken over until staff confirm.
		*/
		const props = __props;
		const open = (0, vue_exports.useModel)(__props, "open");
		const store = useSketch();
		const text = (0, vue_exports.ref)("");
		(0, vue_exports.watch)(open, (value) => {
			if (value) text.value = "";
		});
		const lines = (0, vue_exports.computed)(() => readPaste(text.value));
		const read = (0, vue_exports.computed)(() => lines.value.filter((line) => line.status !== "unread"));
		const sizes = (0, vue_exports.computed)(() => read.value.reduce((n, line) => n + (line.sizes?.length ?? 0), 0));
		const pairs = (0, vue_exports.computed)(() => read.value.reduce((n, line) => n + (line.pairs?.length ?? 0), 0));
		const confirmLabel = (0, vue_exports.computed)(() => {
			const parts = [sizes.value ? `${sizes.value} Reifen` : "", pairs.value ? `${pairs.value} ${pairs.value === 1 ? "Kombination" : "Kombinationen"}` : ""].filter(Boolean);
			return parts.length ? `${parts.join(" und ")} übernehmen` : "Übernehmen";
		});
		function take() {
			const cell = store.cellOf(props.group.id);
			Object.assign(cell, applyPaste(cell, read.value));
			store.touched(props.group.id);
			open.value = false;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event,
				title: `Mehrere einfügen · ${__props.group.sales}`,
				description: "Eine Größe oder ein Paar je Zeile. Ein Paar trennst du mit –, -, + oder →, auch in der Form „Nr. 1: 215/35R19 – 245/30R19“.",
				"content-class": "adm-dialog",
				"initial-focus": "#sk-paste",
				wide: ""
			}, _attrs), {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-f9b89e90${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(read.value.length === 0) ? " disabled" : ""} data-v-f9b89e90${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(confirmLabel.value)}</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: ($event) => open.value = false
					}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						disabled: read.value.length === 0,
						onClick: take
					}, (0, vue_exports.toDisplayString)(confirmLabel.value), 9, ["disabled"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="sk-paste" data-v-f9b89e90${_scopeId}><div class="form-field" data-v-f9b89e90${_scopeId}><label class="form-field__label" for="sk-paste" data-v-f9b89e90${_scopeId}>Text aus dem Gutachten</label><textarea id="sk-paste" class="input sk-paste__box" rows="8" spellcheck="false" placeholder="225/40R18 88W
255/35R18 90W
225/40R18 – 255/35R18" data-v-f9b89e90${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(text.value)}</textarea><p class="form-field__help" data-v-f9b89e90${_scopeId}><button class="sk-link" type="button" data-v-f9b89e90${_scopeId}>Beispiel aus der Skizze einsetzen</button></p></div><div class="sk-paste__preview" aria-live="polite" data-v-f9b89e90${_scopeId}><p class="form-field__label" data-v-f9b89e90${_scopeId}>Vorschau</p>`);
						if (lines.value.length === 0) _push(`<p class="sk-count" data-v-f9b89e90${_scopeId}>Noch nichts eingefügt.</p>`);
						else {
							_push(`<ol class="sk-paste__list" data-v-f9b89e90${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(lines.value, (line) => {
								_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{ "sk-paste__line--bad": line.status === "unread" }, "sk-paste__line"])}" data-v-f9b89e90${_scopeId}><span class="sk-paste__n" data-v-f9b89e90${_scopeId}>Zeile ${(0, server_renderer_exports.ssrInterpolate)(line.line)}`);
								if (line.number) _push(`<!--[--> · Nr. ${(0, server_renderer_exports.ssrInterpolate)(line.number)}<!--]-->`);
								else _push(`<!---->`);
								_push(`</span>`);
								if (line.status === "single") _push(`<span data-v-f9b89e90${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.sizes?.map((0, vue_exports.unref)(tyreLabel)).join(", "))} · vorne und hinten gleich</span>`);
								else if (line.status === "pair") {
									_push(`<span data-v-f9b89e90${_scopeId}><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(line.pairs, (pair, index) => {
										_push(`<!--[-->vorne ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(tyreLabel)(pair.front))} + hinten ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(tyreLabel)(pair.rear))}`);
										if (index < (line.pairs?.length ?? 0) - 1) _push(`<!--[-->; <!--]-->`);
										else _push(`<!---->`);
										_push(`<!--]-->`);
									});
									_push(`<!--]--></span>`);
								} else _push(`<span data-v-f9b89e90${_scopeId}>„${(0, server_renderer_exports.ssrInterpolate)(line.text)}“ – ${(0, server_renderer_exports.ssrInterpolate)(line.reason)}</span>`);
								_push(`</li>`);
							});
							_push(`<!--]--></ol>`);
						}
						_push(`</div></div>`);
					} else return [(0, vue_exports.createVNode)("div", { class: "sk-paste" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
						(0, vue_exports.createVNode)("label", {
							class: "form-field__label",
							for: "sk-paste"
						}, "Text aus dem Gutachten"),
						(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("textarea", {
							id: "sk-paste",
							"onUpdate:modelValue": ($event) => text.value = $event,
							class: "input sk-paste__box",
							rows: "8",
							spellcheck: "false",
							placeholder: "225/40R18 88W\n255/35R18 90W\n225/40R18 – 255/35R18"
						}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, text.value]]),
						(0, vue_exports.createVNode)("p", { class: "form-field__help" }, [(0, vue_exports.createVNode)("button", {
							class: "sk-link",
							type: "button",
							onClick: ($event) => text.value = (0, vue_exports.unref)(PASTE_EXAMPLES)[__props.group.id] ?? (0, vue_exports.unref)(PASTE_EXAMPLES).m3 ?? ""
						}, "Beispiel aus der Skizze einsetzen", 8, ["onClick"])])
					]), (0, vue_exports.createVNode)("div", {
						class: "sk-paste__preview",
						"aria-live": "polite"
					}, [(0, vue_exports.createVNode)("p", { class: "form-field__label" }, "Vorschau"), lines.value.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
						key: 0,
						class: "sk-count"
					}, "Noch nichts eingefügt.")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ol", {
						key: 1,
						class: "sk-paste__list"
					}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(lines.value, (line) => {
						return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
							key: `${line.line}-${line.text}`,
							class: ["sk-paste__line", { "sk-paste__line--bad": line.status === "unread" }]
						}, [(0, vue_exports.createVNode)("span", { class: "sk-paste__n" }, [(0, vue_exports.createTextVNode)("Zeile " + (0, vue_exports.toDisplayString)(line.line), 1), line.number ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · Nr. " + (0, vue_exports.toDisplayString)(line.number), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)]), line.status === "single" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 0 }, (0, vue_exports.toDisplayString)(line.sizes?.map((0, vue_exports.unref)(tyreLabel)).join(", ")) + " · vorne und hinten gleich", 1)) : line.status === "pair" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 1 }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(line.pairs, (pair, index) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: index }, [(0, vue_exports.createTextVNode)("vorne " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(tyreLabel)(pair.front)) + " + hinten " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(tyreLabel)(pair.rear)), 1), index < (line.pairs?.length ?? 0) - 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("; ")], 64)) : (0, vue_exports.createCommentVNode)("", true)], 64);
						}), 128))])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 2 }, "„" + (0, vue_exports.toDisplayString)(line.text) + "“ – " + (0, vue_exports.toDisplayString)(line.reason), 1))], 2);
					}), 128))]))])])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Skizze/parts/PasteDialog.vue
var PasteDialog_exports = /* @__PURE__ */ __exportAll({ default: () => PasteDialog_default });
var _sfc_setup = PasteDialog_vue_vue_type_script_setup_true_lang_default.setup;
PasteDialog_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Skizze/parts/PasteDialog.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var PasteDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(PasteDialog_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f9b89e90"]]);
//#endregion
export { PasteDialog_exports as n, PasteDialog_default as t };
