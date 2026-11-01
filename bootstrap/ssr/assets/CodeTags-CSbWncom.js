import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { i as PopoverRoot_default, n as PopoverPortal_default, r as PopoverContent_default, t as PopoverTrigger_default } from "./PopoverTrigger-D3ZkZeYI.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { l as KINDS, o as useSketch } from "./gutachtenStore-DERNJqCs.js";
import { t as CodeDefine_default } from "./CodeDefine-CY60qhqz.js";
//#region resources/js/Pages/Admin/Skizze/parts/CodeTags.vue?vue&type=script&setup=true&lang.ts
var CodeTags_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CodeTags",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		id: {},
		label: {}
	}, {
		"modelValue": { required: true },
		"modelModifiers": {}
	}),
	emits: /*@__PURE__*/ (0, vue_exports.mergeModels)(["changed"], ["update:modelValue"]),
	setup(__props, { emit: __emit }) {
		/**
		* Codes typed beside a tyre, a pair or a row, as short tags (the brief §7 step 4): the paper's own list completes them,
		* the text shows on hover, never printed in full in a row (screen 11). A code the list does not describe yet stays amber
		* and offers „… definieren" in place — one click, a small popover, no page change.
		*/
		const props = __props;
		const codes = (0, vue_exports.useModel)(__props, "modelValue");
		const emit = __emit;
		const store = useSketch();
		const typed = (0, vue_exports.ref)("");
		const defining = (0, vue_exports.ref)(null);
		function hint(code) {
			const entry = store.codeOf(code);
			if (entry === void 0 || entry.text === null) return `${code}: noch ohne Beschreibung`;
			return `${code} · ${KINDS.find((k) => k.value === entry.kind)?.label ?? ""}\n${entry.text.length > 280 ? `${entry.text.slice(0, 280)} …` : entry.text}`;
		}
		function remove(code) {
			codes.value = codes.value.filter((c) => c !== code);
			emit("changed");
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "sk-tags",
				role: "group",
				"aria-label": props.label
			}, _attrs))} data-v-edc4463f><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(codes.value, (code) => {
				_push(`<!--[-->`);
				if ((0, vue_exports.unref)(store).described(code)) {
					_push(`<span class="sk-code"${(0, server_renderer_exports.ssrRenderAttr)("title", hint(code))} data-v-edc4463f>${(0, server_renderer_exports.ssrInterpolate)(code)} <button class="sk-tags__x" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${code} entfernen`)} data-v-edc4463f>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "close",
						size: 16
					}, null, _parent));
					_push(`</button></span>`);
				} else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(PopoverRoot_default), {
					open: defining.value === code,
					"onUpdate:open": (open) => defining.value = open ? code : null
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push(`<span class="sk-code sk-code--open" data-v-edc4463f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(code)} `);
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(PopoverTrigger_default), { class: "sk-tags__define" }, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push(`beschreiben`);
									else return [(0, vue_exports.createTextVNode)("beschreiben")];
								}),
								_: 2
							}, _parent, _scopeId));
							_push(`<button class="sk-tags__x" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${code} entfernen`)} data-v-edc4463f${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "close",
								size: 16
							}, null, _parent, _scopeId));
							_push(`</button></span>`);
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(PopoverPortal_default), null, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(PopoverContent_default), {
										class: "adm-menu sk-popover",
										side: "bottom",
										align: "start",
										"side-offset": 8,
										"collision-padding": 16
									}, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) {
												_push(`<p class="sk-popover__title" data-v-edc4463f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(code)} beschreiben</p>`);
												_push((0, server_renderer_exports.ssrRenderComponent)(CodeDefine_default, {
													code,
													"id-prefix": `${__props.id}-def-${code}`,
													onDone: ($event) => defining.value = null,
													onCancel: ($event) => defining.value = null
												}, null, _parent, _scopeId));
											} else return [(0, vue_exports.createVNode)("p", { class: "sk-popover__title" }, (0, vue_exports.toDisplayString)(code) + " beschreiben", 1), (0, vue_exports.createVNode)(CodeDefine_default, {
												code,
												"id-prefix": `${__props.id}-def-${code}`,
												onDone: ($event) => defining.value = null,
												onCancel: ($event) => defining.value = null
											}, null, 8, [
												"code",
												"id-prefix",
												"onDone",
												"onCancel"
											])];
										}),
										_: 2
									}, _parent, _scopeId));
									else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverContent_default), {
										class: "adm-menu sk-popover",
										side: "bottom",
										align: "start",
										"side-offset": 8,
										"collision-padding": 16
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("p", { class: "sk-popover__title" }, (0, vue_exports.toDisplayString)(code) + " beschreiben", 1), (0, vue_exports.createVNode)(CodeDefine_default, {
											code,
											"id-prefix": `${__props.id}-def-${code}`,
											onDone: ($event) => defining.value = null,
											onCancel: ($event) => defining.value = null
										}, null, 8, [
											"code",
											"id-prefix",
											"onDone",
											"onCancel"
										])]),
										_: 2
									}, 1024)];
								}),
								_: 2
							}, _parent, _scopeId));
						} else return [(0, vue_exports.createVNode)("span", { class: "sk-code sk-code--open" }, [
							(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(code) + " ", 1),
							(0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverTrigger_default), { class: "sk-tags__define" }, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("beschreiben")]),
								_: 1
							}),
							(0, vue_exports.createVNode)("button", {
								class: "sk-tags__x",
								type: "button",
								"aria-label": `${code} entfernen`,
								onClick: ($event) => remove(code)
							}, [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "close",
								size: 16
							})], 8, ["aria-label", "onClick"])
						]), (0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverPortal_default), null, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverContent_default), {
								class: "adm-menu sk-popover",
								side: "bottom",
								align: "start",
								"side-offset": 8,
								"collision-padding": 16
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("p", { class: "sk-popover__title" }, (0, vue_exports.toDisplayString)(code) + " beschreiben", 1), (0, vue_exports.createVNode)(CodeDefine_default, {
									code,
									"id-prefix": `${__props.id}-def-${code}`,
									onDone: ($event) => defining.value = null,
									onCancel: ($event) => defining.value = null
								}, null, 8, [
									"code",
									"id-prefix",
									"onDone",
									"onCancel"
								])]),
								_: 2
							}, 1024)]),
							_: 2
						}, 1024)];
					}),
					_: 2
				}, _parent));
				_push(`<!--]-->`);
			});
			_push(`<!--]--><input${(0, server_renderer_exports.ssrRenderAttr)("id", __props.id)}${(0, server_renderer_exports.ssrRenderAttr)("value", typed.value)} class="sk-tags__input" type="text"${(0, server_renderer_exports.ssrRenderAttr)("list", `${__props.id}-list`)}${(0, server_renderer_exports.ssrRenderAttr)("placeholder", codes.value.length ? "" : "Codes, z. B. 11A 68B")}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${props.label}: Code eingeben`)} spellcheck="false" autocomplete="off" data-v-edc4463f><datalist${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-list`)} data-v-edc4463f><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(store).state.codes, (entry) => {
				_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", entry.code)} data-v-edc4463f>${(0, server_renderer_exports.ssrInterpolate)(entry.text ? (0, vue_exports.unref)(KINDS).find((k) => k.value === entry.kind)?.label : "noch ohne Beschreibung")}</option>`);
			});
			_push(`<!--]--></datalist></div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Skizze/parts/CodeTags.vue
var CodeTags_exports = /* @__PURE__ */ __exportAll({ default: () => CodeTags_default });
var _sfc_setup = CodeTags_vue_vue_type_script_setup_true_lang_default.setup;
CodeTags_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Skizze/parts/CodeTags.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var CodeTags_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CodeTags_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-edc4463f"]]);
//#endregion
export { CodeTags_exports as n, CodeTags_default as t };
