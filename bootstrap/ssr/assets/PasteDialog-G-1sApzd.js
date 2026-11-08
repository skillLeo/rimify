import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { t as Dialog_default } from "./Dialog-Hg9IsA0U.js";
import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { i as readPaste, r as pasteToSides, s as tyreLabel, t as checkPaste } from "./tyreInput-CdSJZ98m.js";
//#region resources/js/Pages/Admin/Gutachten/Erfassung/PasteDialog.vue?vue&type=script&setup=true&lang.ts
var PasteDialog_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "PasteDialog",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		car: {},
		combination: {}
	}, {
		"open": {
			type: Boolean,
			required: true
		},
		"openModifiers": {}
	}),
	emits: /*@__PURE__*/ (0, vue_exports.mergeModels)(["take"], ["update:open"]),
	setup(__props, { emit: __emit }) {
		/**
		* „Mehrere einfügen“ (the Gutachten rework §4.4, §7 step 4, the client's change of 05.11.2026): several sizes or front/rear pairs
		* typed or pasted at once — one per line, or a paragraph of the paper split at each „Nr.“ — read into a preview first. A line with
		* one size is vorne = hinten, where both wheels share its diameter, a pair a pair. What does not read or does not fit is shown in red
		* with the reason and left out; nothing is taken over until staff confirm.
		*/
		const props = __props;
		const open = (0, vue_exports.useModel)(__props, "open");
		const emit = __emit;
		const text = (0, vue_exports.ref)("");
		const lines = (0, vue_exports.computed)(() => checkPaste(readPaste(text.value), {
			front: props.combination.frontDiameter,
			rear: props.combination.rearDiameter
		}));
		const read = (0, vue_exports.computed)(() => lines.value.filter((line) => line.status !== "unread"));
		const count = (0, vue_exports.computed)(() => pasteToSides(read.value).length);
		const confirmLabel = (0, vue_exports.computed)(() => count.value === 0 ? "Übernehmen" : count.value === 1 ? "1 Zeile übernehmen" : `${count.value} Zeilen übernehmen`);
		function take() {
			emit("take", pasteToSides(read.value));
			text.value = "";
			open.value = false;
		}
		function cancel() {
			text.value = "";
			open.value = false;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event,
				title: `Mehrere einfügen · ${__props.car.label}`,
				description: "Eine Größe oder ein Paar je Zeile. Ein Paar trennst du mit –, -, + oder →, auch in der Form „Nr. 1: 215/35R19 – 245/30R19“.",
				"content-class": "adm-dialog",
				"initial-focus": "#ef-paste",
				wide: ""
			}, _attrs), {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-6acca66a${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(count.value === 0) ? " disabled" : ""} data-v-6acca66a${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(confirmLabel.value)}</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: cancel
					}, "Abbrechen"), (0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						disabled: count.value === 0,
						onClick: take
					}, (0, vue_exports.toDisplayString)(confirmLabel.value), 9, ["disabled"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="ef-paste" data-v-6acca66a${_scopeId}><div class="form-field" data-v-6acca66a${_scopeId}><label class="form-field__label" for="ef-paste" data-v-6acca66a${_scopeId}>Text aus dem Gutachten</label><textarea id="ef-paste" class="input ef-paste__box" rows="8" spellcheck="false" placeholder="225/40R18 88W
255/35R18 90W
225/40R18 – 255/35R18" data-v-6acca66a${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(text.value)}</textarea></div><div class="ef-paste__preview" aria-live="polite" data-v-6acca66a${_scopeId}><p class="form-field__label" data-v-6acca66a${_scopeId}>Vorschau</p>`);
						if (lines.value.length === 0) _push(`<p class="ef-count" data-v-6acca66a${_scopeId}>Noch nichts eingefügt.</p>`);
						else {
							_push(`<ol class="ef-paste__list" data-v-6acca66a${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(lines.value, (line) => {
								_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{ "ef-paste__line--bad": line.status === "unread" }, "ef-paste__line"])}" data-v-6acca66a${_scopeId}><span class="ef-paste__n" data-v-6acca66a${_scopeId}>Zeile ${(0, server_renderer_exports.ssrInterpolate)(line.line)}`);
								if (line.number) _push(`<!--[--> · Nr. ${(0, server_renderer_exports.ssrInterpolate)(line.number)}<!--]-->`);
								else _push(`<!---->`);
								_push(`</span>`);
								if (line.status === "single") _push(`<span data-v-6acca66a${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.sizes?.map((0, vue_exports.unref)(tyreLabel)).join(", "))} · vorne und hinten gleich</span>`);
								else if (line.status === "pair") {
									_push(`<span data-v-6acca66a${_scopeId}><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(line.pairs, (pair, index) => {
										_push(`<!--[-->vorne ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(tyreLabel)(pair.front))} + hinten ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(tyreLabel)(pair.rear))}`);
										if (index < (line.pairs?.length ?? 0) - 1) _push(`<!--[-->; <!--]-->`);
										else _push(`<!---->`);
										_push(`<!--]-->`);
									});
									_push(`<!--]--></span>`);
								} else _push(`<span data-v-6acca66a${_scopeId}>„${(0, server_renderer_exports.ssrInterpolate)(line.text)}“ – ${(0, server_renderer_exports.ssrInterpolate)(line.reason)}</span>`);
								_push(`</li>`);
							});
							_push(`<!--]--></ol>`);
						}
						_push(`</div></div>`);
					} else return [(0, vue_exports.createVNode)("div", { class: "ef-paste" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
						class: "form-field__label",
						for: "ef-paste"
					}, "Text aus dem Gutachten"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("textarea", {
						id: "ef-paste",
						"onUpdate:modelValue": ($event) => text.value = $event,
						class: "input ef-paste__box",
						rows: "8",
						spellcheck: "false",
						placeholder: "225/40R18 88W\n255/35R18 90W\n225/40R18 – 255/35R18"
					}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, text.value]])]), (0, vue_exports.createVNode)("div", {
						class: "ef-paste__preview",
						"aria-live": "polite"
					}, [(0, vue_exports.createVNode)("p", { class: "form-field__label" }, "Vorschau"), lines.value.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
						key: 0,
						class: "ef-count"
					}, "Noch nichts eingefügt.")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ol", {
						key: 1,
						class: "ef-paste__list"
					}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(lines.value, (line) => {
						return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
							key: `${line.line}-${line.text}`,
							class: ["ef-paste__line", { "ef-paste__line--bad": line.status === "unread" }]
						}, [(0, vue_exports.createVNode)("span", { class: "ef-paste__n" }, [(0, vue_exports.createTextVNode)("Zeile " + (0, vue_exports.toDisplayString)(line.line), 1), line.number ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · Nr. " + (0, vue_exports.toDisplayString)(line.number), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)]), line.status === "single" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 0 }, (0, vue_exports.toDisplayString)(line.sizes?.map((0, vue_exports.unref)(tyreLabel)).join(", ")) + " · vorne und hinten gleich", 1)) : line.status === "pair" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 1 }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(line.pairs, (pair, index) => {
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
//#region resources/js/Pages/Admin/Gutachten/Erfassung/PasteDialog.vue
var PasteDialog_exports = /* @__PURE__ */ __exportAll({ default: () => PasteDialog_default });
var _sfc_setup = PasteDialog_vue_vue_type_script_setup_true_lang_default.setup;
PasteDialog_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Erfassung/PasteDialog.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var PasteDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(PasteDialog_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-6acca66a"]]);
//#endregion
export { PasteDialog_exports as n, PasteDialog_default as t };
