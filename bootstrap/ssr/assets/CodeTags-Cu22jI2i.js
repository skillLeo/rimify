import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { i as PopoverRoot_default, n as PopoverPortal_default, r as PopoverContent_default, t as PopoverTrigger_default } from "./PopoverTrigger-CSGbWA9F.js";
import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-D0z-a8p_.js";
import { h as useGutachtenPage } from "./entryStore-wk8wq0su.js";
import { t as CodeDefine_default } from "./CodeDefine-BHsvJiAd.js";
//#region resources/js/Pages/Admin/Gutachten/Erfassung/CodeTags.vue?vue&type=script&setup=true&lang.ts
var CodeTags_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CodeTags",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		id: {},
		label: {},
		disabled: { type: Boolean }
	}, {
		"modelValue": { required: true },
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		/**
		* Codes typed beside a tyre or a car, as short tags (the Gutachten rework §7 step 4): the paper's own list completes them, the
		* text shows on hover and is never printed in full in a row (screen 11). A code the list does not describe yet stays amber and
		* offers „… beschreiben“ in place — one click, a small popover, no page change.
		*/
		const props = __props;
		const codes = (0, vue_exports.useModel)(__props, "modelValue");
		const page = useGutachtenPage();
		const list = (0, vue_exports.computed)(() => page.props.conditions);
		const typed = (0, vue_exports.ref)("");
		const defining = (0, vue_exports.ref)(null);
		function entry(code) {
			return list.value.find((c) => c.code === code);
		}
		function hint(code) {
			const found = entry(code);
			if (found === void 0) return `${code}: noch ohne Beschreibung`;
			return `${code} · ${found.kindLabel}\n${found.text.length > 280 ? `${found.text.slice(0, 280)} …` : found.text}`;
		}
		function focusField() {
			(0, vue_exports.nextTick)(() => document.getElementById(props.id)?.focus());
		}
		function remove(code) {
			codes.value = codes.value.filter((c) => c !== code);
			focusField();
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "ef-tags",
				role: "group",
				"aria-label": props.label
			}, _attrs))} data-v-55f5da65><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(codes.value, (code) => {
				_push(`<!--[-->`);
				if (entry(code)) {
					_push(`<span class="ef-code"${(0, server_renderer_exports.ssrRenderAttr)("title", hint(code))} data-v-55f5da65>${(0, server_renderer_exports.ssrInterpolate)(code)} `);
					if (!__props.disabled) {
						_push(`<button class="ef-tags__x" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${code} entfernen`)} data-v-55f5da65>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: "close",
							size: 16
						}, null, _parent));
						_push(`</button>`);
					} else _push(`<!---->`);
					_push(`</span>`);
				} else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(PopoverRoot_default), {
					open: defining.value === code,
					"onUpdate:open": (open) => defining.value = open ? code : null
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push(`<span class="ef-code ef-code--open" data-v-55f5da65${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(code)} `);
							if (!__props.disabled) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(PopoverTrigger_default), { class: "ef-tags__define" }, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push(`beschreiben`);
									else return [(0, vue_exports.createTextVNode)("beschreiben")];
								}),
								_: 2
							}, _parent, _scopeId));
							else _push(`<!---->`);
							if (!__props.disabled) {
								_push(`<button class="ef-tags__x" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${code} entfernen`)} data-v-55f5da65${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
									name: "close",
									size: 16
								}, null, _parent, _scopeId));
								_push(`</button>`);
							} else _push(`<!---->`);
							_push(`</span>`);
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(PopoverPortal_default), null, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(PopoverContent_default), {
										class: "adm-menu ef-popover",
										side: "bottom",
										align: "start",
										"side-offset": 8,
										"collision-padding": 16,
										onCloseAutoFocus: (event) => {
											event.preventDefault();
											focusField();
										}
									}, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) {
												_push(`<p class="ef-popover__title" data-v-55f5da65${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(code)} beschreiben</p>`);
												_push((0, server_renderer_exports.ssrRenderComponent)(CodeDefine_default, {
													code,
													"id-prefix": `${__props.id}-def-${code}`,
													onDone: ($event) => defining.value = null,
													onCancel: ($event) => defining.value = null
												}, null, _parent, _scopeId));
											} else return [(0, vue_exports.createVNode)("p", { class: "ef-popover__title" }, (0, vue_exports.toDisplayString)(code) + " beschreiben", 1), (0, vue_exports.createVNode)(CodeDefine_default, {
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
										class: "adm-menu ef-popover",
										side: "bottom",
										align: "start",
										"side-offset": 8,
										"collision-padding": 16,
										onCloseAutoFocus: (event) => {
											event.preventDefault();
											focusField();
										}
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("p", { class: "ef-popover__title" }, (0, vue_exports.toDisplayString)(code) + " beschreiben", 1), (0, vue_exports.createVNode)(CodeDefine_default, {
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
									}, 1032, ["onCloseAutoFocus"])];
								}),
								_: 2
							}, _parent, _scopeId));
						} else return [(0, vue_exports.createVNode)("span", { class: "ef-code ef-code--open" }, [
							(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(code) + " ", 1),
							!__props.disabled ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(PopoverTrigger_default), {
								key: 0,
								class: "ef-tags__define"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("beschreiben")]),
								_: 1
							})) : (0, vue_exports.createCommentVNode)("", true),
							!__props.disabled ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
								key: 1,
								class: "ef-tags__x",
								type: "button",
								"aria-label": `${code} entfernen`,
								onClick: ($event) => remove(code)
							}, [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "close",
								size: 16
							})], 8, ["aria-label", "onClick"])) : (0, vue_exports.createCommentVNode)("", true)
						]), (0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverPortal_default), null, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverContent_default), {
								class: "adm-menu ef-popover",
								side: "bottom",
								align: "start",
								"side-offset": 8,
								"collision-padding": 16,
								onCloseAutoFocus: (event) => {
									event.preventDefault();
									focusField();
								}
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("p", { class: "ef-popover__title" }, (0, vue_exports.toDisplayString)(code) + " beschreiben", 1), (0, vue_exports.createVNode)(CodeDefine_default, {
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
							}, 1032, ["onCloseAutoFocus"])]),
							_: 2
						}, 1024)];
					}),
					_: 2
				}, _parent));
				_push(`<!--]-->`);
			});
			_push(`<!--]-->`);
			if (!__props.disabled) _push(`<input${(0, server_renderer_exports.ssrRenderAttr)("id", __props.id)}${(0, server_renderer_exports.ssrRenderAttr)("value", typed.value)} class="ef-tags__input" type="text"${(0, server_renderer_exports.ssrRenderAttr)("list", `${__props.id}-list`)}${(0, server_renderer_exports.ssrRenderAttr)("placeholder", codes.value.length ? "" : "Codes, z. B. 11A 68B")}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${props.label}: Code eingeben`)} spellcheck="false" autocomplete="off" data-v-55f5da65>`);
			else _push(`<!---->`);
			_push(`<datalist${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-list`)} data-v-55f5da65><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(list.value, (c) => {
				_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", c.code)} data-v-55f5da65>${(0, server_renderer_exports.ssrInterpolate)(c.kindLabel)}</option>`);
			});
			_push(`<!--]--></datalist></div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Erfassung/CodeTags.vue
var CodeTags_exports = /* @__PURE__ */ __exportAll({ default: () => CodeTags_default });
var _sfc_setup = CodeTags_vue_vue_type_script_setup_true_lang_default.setup;
CodeTags_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Erfassung/CodeTags.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var CodeTags_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CodeTags_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-55f5da65"]]);
//#endregion
export { CodeTags_exports as n, CodeTags_default as t };
