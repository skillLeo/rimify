import { D as useForwardExpose, O as useEmitAsProps, P as useVModel, R as reactiveOmit, S as Primitive, h as isIndeterminate, p as getCheckedState, t as Dialog_default, w as Presence_default } from "./Dialog-CAlgTJaP.js";
import { a as DropdownMenuRoot_default, i as DropdownMenuContent_default, n as DropdownMenuPortal_default, o as MenuItem_default, r as DropdownMenuItem_default, t as DropdownMenuTrigger_default, y as useForwardProps } from "./DropdownMenuTrigger-DxgIMivC.js";
import { d as DropdownMenuLabel_default } from "./AdminPage-B8jfLKlm.js";
import { t as DropdownMenuSeparator_default } from "./DropdownMenuSeparator-Bu32GjnF.js";
import { a as link_default, c as router, n as createContext, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-COuF1lMZ.js";
import { l as nextRev } from "./AdminConfirm-DBodxbIw.js";
import { i as parseNumber } from "./num-Br8qlecZ.js";
import { a as toast } from "./toast-Ckkabove.js";
import { t as savePreference } from "./preferences-y4YLrdI-.js";
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Menu/MenuItemIndicator.js
var [injectMenuItemIndicatorContext, provideMenuItemIndicatorContext] = /*#__PURE__*/ createContext(["MenuCheckboxItem", "MenuRadioItem"], "MenuItemIndicatorContext");
var MenuItemIndicator_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "MenuItemIndicator",
	props: {
		forceMount: {
			type: Boolean,
			required: false
		},
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false,
			default: "span"
		}
	},
	setup(__props) {
		const indicatorContext = injectMenuItemIndicatorContext({ modelValue: (0, vue_exports.ref)(false) });
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Presence_default), { present: _ctx.forceMount || (0, vue_exports.unref)(isIndeterminate)((0, vue_exports.unref)(indicatorContext).modelValue.value) || (0, vue_exports.unref)(indicatorContext).modelValue.value === true }, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), {
					as: _ctx.as,
					"as-child": _ctx.asChild,
					"data-state": (0, vue_exports.unref)(getCheckedState)((0, vue_exports.unref)(indicatorContext).modelValue.value)
				}, {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 8, [
					"as",
					"as-child",
					"data-state"
				])]),
				_: 3
			}, 8, ["present"]);
		};
	}
});
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Menu/MenuCheckboxItem.js
var MenuCheckboxItem_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "MenuCheckboxItem",
	props: {
		modelValue: {
			type: [Boolean, String],
			required: false,
			default: false
		},
		disabled: {
			type: Boolean,
			required: false
		},
		textValue: {
			type: String,
			required: false
		},
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false
		}
	},
	emits: ["select", "update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const delegatedProps = reactiveOmit(props, ["modelValue"]);
		const forwarded = useForwardProps(delegatedProps);
		const modelValue = useVModel(props, "modelValue", emits);
		provideMenuItemIndicatorContext({ modelValue });
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(MenuItem_default, (0, vue_exports.mergeProps)({ role: "menuitemcheckbox" }, (0, vue_exports.unref)(forwarded), {
				"aria-checked": (0, vue_exports.unref)(isIndeterminate)((0, vue_exports.unref)(modelValue)) ? "mixed" : (0, vue_exports.unref)(modelValue),
				"data-state": (0, vue_exports.unref)(getCheckedState)((0, vue_exports.unref)(modelValue)),
				onSelect: _cache[0] || (_cache[0] = async (event) => {
					emits("select", event);
					if ((0, vue_exports.unref)(isIndeterminate)((0, vue_exports.unref)(modelValue))) modelValue.value = true;
					else modelValue.value = !(0, vue_exports.unref)(modelValue);
				})
			}), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", { modelValue: (0, vue_exports.unref)(modelValue) })]),
				_: 3
			}, 16, ["aria-checked", "data-state"]);
		};
	}
});
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/DropdownMenu/DropdownMenuCheckboxItem.js
var DropdownMenuCheckboxItem_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DropdownMenuCheckboxItem",
	props: {
		modelValue: {
			type: [Boolean, String],
			required: false
		},
		disabled: {
			type: Boolean,
			required: false
		},
		textValue: {
			type: String,
			required: false
		},
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false
		}
	},
	emits: ["select", "update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emitsAsProps = useEmitAsProps(__emit);
		useForwardExpose();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(MenuCheckboxItem_default), (0, vue_exports.normalizeProps)((0, vue_exports.guardReactiveProps)({
				...props,
				...(0, vue_exports.unref)(emitsAsProps)
			})), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16);
		};
	}
});
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/DropdownMenu/DropdownMenuItemIndicator.js
var DropdownMenuItemIndicator_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DropdownMenuItemIndicator",
	props: {
		forceMount: {
			type: Boolean,
			required: false
		},
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false
		}
	},
	setup(__props) {
		const props = __props;
		useForwardExpose();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(MenuItemIndicator_default), (0, vue_exports.normalizeProps)((0, vue_exports.guardReactiveProps)(props)), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Lists/ColumnChooser.vue?vue&type=script&setup=true&lang.ts
var ColumnChooser_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ColumnChooser",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		list: {},
		columns: {},
		defaults: {},
		sorted: {},
		owner: {}
	}, {
		"shown": { required: true },
		"shownModifiers": {}
	}),
	emits: ["update:shown"],
	setup(__props) {
		/**
		* „Spalten“: which columns of a list this person sees (docs/admin/rest-build-plan.md, step 2.2).
		*
		* A menu of the list's columns, each with a tick; the column that names the row cannot be taken
		* away. A change shows at once and is kept on the account behind it (AdminLists on the server), so
		* the list opens the same way next time, on any machine. „Standard“ puts back the list's own set.
		* The menu stays open while columns are ticked — choosing three columns is one visit, not three.
		*
		* While an open view shows its own columns („Spalten mitspeichern“), the menu changes those: the
		* change stays on screen, the view reads as changed, and its owner can save it into the view. The
		* person's own set is not touched.
		*/
		const props = __props;
		const fixed = (column) => column.required || column.key === props.sorted;
		const shown = (0, vue_exports.useModel)(__props, "shown");
		function inOrder(keys) {
			return props.columns.filter((column) => column.required || keys.has(column.key)).map((column) => column.key);
		}
		let rev = 0;
		function choose(next) {
			shown.value = next;
			if (props.owner !== "view") {
				rev = nextRev(rev, Date.now());
				savePreference({
					list: props.list,
					columns: next,
					rev
				});
			}
		}
		function toggle(column, on) {
			if (fixed(column)) return;
			const keys = new Set(shown.value);
			if (on) keys.add(column.key);
			else keys.delete(column.key);
			choose(inOrder(keys));
		}
		function isDefault() {
			return shown.value.join() === props.defaults.join();
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), _attrs, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), { class: "btn btn--secondary lc-trigger" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "columns",
										size: 20
									}, null, _parent, _scopeId));
									_push(` Spalten `);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "chevron-down",
										size: 16
									}, null, _parent, _scopeId));
								} else return [
									(0, vue_exports.createVNode)(AdminIcon_default, {
										name: "columns",
										size: 20
									}),
									(0, vue_exports.createTextVNode)(" Spalten "),
									(0, vue_exports.createVNode)(AdminIcon_default, {
										name: "chevron-down",
										size: 16
									})
								];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuContent_default), {
									class: "adm-menu lc-menu",
									align: "end",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__caption" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(__props.owner === "view" ? "Spalten dieser Ansicht" : "Spalten in der Liste")}`);
													else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.owner === "view" ? "Spalten dieser Ansicht" : "Spalten in der Liste"), 1)];
												}),
												_: 1
											}, _parent, _scopeId));
											_push(`<!--[-->`);
											(0, server_renderer_exports.ssrRenderList)(__props.columns, (column) => {
												_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuCheckboxItem_default), {
													key: column.key,
													class: "adm-menu__item lc-item",
													"model-value": fixed(column) || shown.value.includes(column.key),
													disabled: fixed(column),
													"onUpdate:modelValue": (on) => toggle(column, on === true),
													onSelect: (event) => event.preventDefault()
												}, {
													default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
														if (_push) {
															_push(`<span class="lc-tick" aria-hidden="true" data-v-f68536ae${_scopeId}>`);
															_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItemIndicator_default), null, {
																default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																	if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																		name: "check",
																		size: 16
																	}, null, _parent, _scopeId));
																	else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "check",
																		size: 16
																	})];
																}),
																_: 2
															}, _parent, _scopeId));
															_push(`</span> ${(0, server_renderer_exports.ssrInterpolate)(column.label)} `);
															if (column.required) _push(`<span class="lc-note" data-v-f68536ae${_scopeId}>immer sichtbar</span>`);
															else if (column.key === __props.sorted) _push(`<span class="lc-note" data-v-f68536ae${_scopeId}>danach sortiert</span>`);
															else _push(`<!---->`);
														} else return [
															(0, vue_exports.createVNode)("span", {
																class: "lc-tick",
																"aria-hidden": "true"
															}, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItemIndicator_default), null, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "check",
																	size: 16
																})]),
																_: 1
															})]),
															(0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(column.label) + " ", 1),
															column.required ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
																key: 0,
																class: "lc-note"
															}, "immer sichtbar")) : column.key === __props.sorted ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
																key: 1,
																class: "lc-note"
															}, "danach sortiert")) : (0, vue_exports.createCommentVNode)("", true)
														];
													}),
													_: 2
												}, _parent, _scopeId));
											});
											_push(`<!--]-->`);
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }, null, _parent, _scopeId));
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "adm-menu__item",
												disabled: isDefault(),
												onSelect: ($event) => choose([...__props.defaults])
											}, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push(`<span class="lc-tick" aria-hidden="true" data-v-f68536ae${_scopeId}></span> Standard wiederherstellen `);
													else return [(0, vue_exports.createVNode)("span", {
														class: "lc-tick",
														"aria-hidden": "true"
													}), (0, vue_exports.createTextVNode)(" Standard wiederherstellen ")];
												}),
												_: 1
											}, _parent, _scopeId));
										} else return [
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__caption" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.owner === "view" ? "Spalten dieser Ansicht" : "Spalten in der Liste"), 1)]),
												_: 1
											}),
											((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.columns, (column) => {
												return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuCheckboxItem_default), {
													key: column.key,
													class: "adm-menu__item lc-item",
													"model-value": fixed(column) || shown.value.includes(column.key),
													disabled: fixed(column),
													"onUpdate:modelValue": (on) => toggle(column, on === true),
													onSelect: (event) => event.preventDefault()
												}, {
													default: (0, vue_exports.withCtx)(() => [
														(0, vue_exports.createVNode)("span", {
															class: "lc-tick",
															"aria-hidden": "true"
														}, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItemIndicator_default), null, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "check",
																size: 16
															})]),
															_: 1
														})]),
														(0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(column.label) + " ", 1),
														column.required ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
															key: 0,
															class: "lc-note"
														}, "immer sichtbar")) : column.key === __props.sorted ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
															key: 1,
															class: "lc-note"
														}, "danach sortiert")) : (0, vue_exports.createCommentVNode)("", true)
													]),
													_: 2
												}, 1032, [
													"model-value",
													"disabled",
													"onUpdate:modelValue",
													"onSelect"
												]);
											}), 128)),
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "adm-menu__item",
												disabled: isDefault(),
												onSelect: ($event) => choose([...__props.defaults])
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", {
													class: "lc-tick",
													"aria-hidden": "true"
												}), (0, vue_exports.createTextVNode)(" Standard wiederherstellen ")]),
												_: 1
											}, 8, ["disabled", "onSelect"])
										];
									}),
									_: 1
								}, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
									class: "adm-menu lc-menu",
									align: "end",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)(() => [
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__caption" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.owner === "view" ? "Spalten dieser Ansicht" : "Spalten in der Liste"), 1)]),
											_: 1
										}),
										((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.columns, (column) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuCheckboxItem_default), {
												key: column.key,
												class: "adm-menu__item lc-item",
												"model-value": fixed(column) || shown.value.includes(column.key),
												disabled: fixed(column),
												"onUpdate:modelValue": (on) => toggle(column, on === true),
												onSelect: (event) => event.preventDefault()
											}, {
												default: (0, vue_exports.withCtx)(() => [
													(0, vue_exports.createVNode)("span", {
														class: "lc-tick",
														"aria-hidden": "true"
													}, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItemIndicator_default), null, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "check",
															size: 16
														})]),
														_: 1
													})]),
													(0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(column.label) + " ", 1),
													column.required ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
														key: 0,
														class: "lc-note"
													}, "immer sichtbar")) : column.key === __props.sorted ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
														key: 1,
														class: "lc-note"
													}, "danach sortiert")) : (0, vue_exports.createCommentVNode)("", true)
												]),
												_: 2
											}, 1032, [
												"model-value",
												"disabled",
												"onUpdate:modelValue",
												"onSelect"
											]);
										}), 128)),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
											class: "adm-menu__item",
											disabled: isDefault(),
											onSelect: ($event) => choose([...__props.defaults])
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", {
												class: "lc-tick",
												"aria-hidden": "true"
											}), (0, vue_exports.createTextVNode)(" Standard wiederherstellen ")]),
											_: 1
										}, 8, ["disabled", "onSelect"])
									]),
									_: 1
								})];
							}),
							_: 1
						}, _parent, _scopeId));
					} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), { class: "btn btn--secondary lc-trigger" }, {
						default: (0, vue_exports.withCtx)(() => [
							(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "columns",
								size: 20
							}),
							(0, vue_exports.createTextVNode)(" Spalten "),
							(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "chevron-down",
								size: 16
							})
						]),
						_: 1
					}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
							class: "adm-menu lc-menu",
							align: "end",
							"side-offset": 8
						}, {
							default: (0, vue_exports.withCtx)(() => [
								(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__caption" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.owner === "view" ? "Spalten dieser Ansicht" : "Spalten in der Liste"), 1)]),
									_: 1
								}),
								((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.columns, (column) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuCheckboxItem_default), {
										key: column.key,
										class: "adm-menu__item lc-item",
										"model-value": fixed(column) || shown.value.includes(column.key),
										disabled: fixed(column),
										"onUpdate:modelValue": (on) => toggle(column, on === true),
										onSelect: (event) => event.preventDefault()
									}, {
										default: (0, vue_exports.withCtx)(() => [
											(0, vue_exports.createVNode)("span", {
												class: "lc-tick",
												"aria-hidden": "true"
											}, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItemIndicator_default), null, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "check",
													size: 16
												})]),
												_: 1
											})]),
											(0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(column.label) + " ", 1),
											column.required ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 0,
												class: "lc-note"
											}, "immer sichtbar")) : column.key === __props.sorted ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 1,
												class: "lc-note"
											}, "danach sortiert")) : (0, vue_exports.createCommentVNode)("", true)
										]),
										_: 2
									}, 1032, [
										"model-value",
										"disabled",
										"onUpdate:modelValue",
										"onSelect"
									]);
								}), 128)),
								(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
								(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
									class: "adm-menu__item",
									disabled: isDefault(),
									onSelect: ($event) => choose([...__props.defaults])
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", {
										class: "lc-tick",
										"aria-hidden": "true"
									}), (0, vue_exports.createTextVNode)(" Standard wiederherstellen ")]),
									_: 1
								}, 8, ["disabled", "onSelect"])
							]),
							_: 1
						})]),
						_: 1
					})];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Lists/ColumnChooser.vue
var _sfc_setup$2 = ColumnChooser_vue_vue_type_script_setup_true_lang_default.setup;
ColumnChooser_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Lists/ColumnChooser.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var ColumnChooser_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ColumnChooser_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f68536ae"]]);
//#endregion
//#region resources/js/Components/Admin/Lists/SaveViewDialog.vue?vue&type=script&setup=true&lang.ts
var SaveViewDialog_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "SaveViewDialog",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		list: {},
		query: {},
		columns: {},
		shareOptions: {},
		view: {}
	}, {
		"open": {
			type: Boolean,
			default: false
		},
		"openModifiers": {}
	}),
	emits: /*@__PURE__*/ (0, vue_exports.mergeModels)(["saved"], ["update:open"]),
	setup(__props, { emit: __emit }) {
		/**
		* Saving a Gespeicherte Ansicht, or changing one's name and who it is shared with.
		*
		* A name, and „Teilen“: for the person alone, or for everybody in a role that may open the list —
		* only those roles are offered (ListViews). „Spalten mitspeichern“, off unless ticked: a view answers
		* a question with its filters, and leaves everyone's columns alone — ticked, it keeps the columns on
		* screen and shows them to whoever opens it. The server refuses what this does not, in its own words
		* under the field (SavedViewStoreRequest, SavedViewUpdateRequest); a refused name takes focus again,
		* so the sentence is heard and the fix starts there.
		*/
		const props = __props;
		const open = (0, vue_exports.useModel)(__props, "open");
		/** Saved: the bar puts the focus on the view, since the button that opened this is gone with it. */
		const emit = __emit;
		let justSaved = false;
		function onClosed(event) {
			if (justSaved) {
				justSaved = false;
				event.preventDefault();
				emit("saved");
			}
		}
		const page = usePage();
		const name = (0, vue_exports.ref)("");
		const role = (0, vue_exports.ref)("");
		const keepColumns = (0, vue_exports.ref)(false);
		const busy = (0, vue_exports.ref)(false);
		const sent = (0, vue_exports.ref)(false);
		const editing = (0, vue_exports.computed)(() => props.view !== null);
		const title = (0, vue_exports.computed)(() => editing.value ? "Ansicht umbenennen und teilen" : "Als Ansicht speichern");
		(0, vue_exports.watch)(open, (value) => {
			if (value) {
				name.value = props.view?.name ?? "";
				role.value = props.view?.roleId ? String(props.view.roleId) : "";
				keepColumns.value = props.view?.storesColumns ?? false;
				sent.value = false;
			}
		});
		const errors = (0, vue_exports.computed)(() => {
			const raw = page.props.errors;
			return sent.value && raw !== null && typeof raw === "object" ? raw : {};
		});
		const nameError = (0, vue_exports.computed)(() => errors.value.name ?? errors.value.query ?? errors.value.list ?? "");
		const roleError = (0, vue_exports.computed)(() => errors.value.role_id ?? "");
		const columnsError = (0, vue_exports.computed)(() => errors.value.columns ?? errors.value.stores_columns ?? "");
		function save() {
			if (busy.value) return;
			busy.value = true;
			sent.value = true;
			const roleId = role.value === "" ? null : Number(role.value);
			const options = {
				preserveScroll: true,
				onSuccess: () => {
					justSaved = true;
					open.value = false;
				},
				onError: () => void (0, vue_exports.nextTick)(() => document.getElementById("sv-name")?.focus()),
				onFinish: () => {
					busy.value = false;
				}
			};
			if (props.view === null) {
				router.post("/admin/ansichten", {
					list: props.list,
					name: name.value,
					query: props.query,
					role_id: roleId,
					stores_columns: keepColumns.value,
					columns: keepColumns.value ? props.columns : null
				}, options);
				return;
			}
			const changes = {};
			if (name.value.trim() !== props.view.name) changes.name = name.value;
			if (roleId !== props.view.roleId) changes.role_id = roleId;
			if (keepColumns.value !== props.view.storesColumns) {
				changes.stores_columns = keepColumns.value;
				if (keepColumns.value) changes.columns = props.columns;
			}
			if (Object.keys(changes).length === 0) {
				busy.value = false;
				open.value = false;
				return;
			}
			router.patch(`/admin/ansichten/${props.view.id}`, changes, options);
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event,
				title: title.value,
				"content-class": "adm-dialog adm-dialog--narrow",
				"initial-focus": "#sv-name",
				onCloseAutoFocus: onClosed
			}, _attrs), {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button"${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="submit" form="sv-form"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)}${_scopeId}> Speichern </button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: ($event) => open.value = false
					}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "submit",
						form: "sv-form",
						"aria-busy": busy.value ? "true" : void 0
					}, " Speichern ", 8, ["aria-busy"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<form id="sv-form" class="adm-fields" novalidate${_scopeId}><div class="form-field"${_scopeId}><label class="form-field__label" for="sv-name"${_scopeId}>Name</label><input id="sv-name"${(0, server_renderer_exports.ssrRenderAttr)("value", name.value)} class="input" type="text" maxlength="60" autocomplete="off" aria-required="true" aria-describedby="sv-name-help sv-name-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", nameError.value ? "true" : void 0)}${_scopeId}><p id="sv-name-help" class="form-field__help"${_scopeId}>Zum Beispiel „Bezahlt, noch nicht versendet“.</p><p id="sv-name-err" class="form-field__error"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(nameError.value)}</p></div><div class="form-field"${_scopeId}><label class="form-field__label" for="sv-role"${_scopeId}>Teilen</label><select id="sv-role" class="input" aria-describedby="sv-role-help sv-role-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", roleError.value ? "true" : void 0)}${_scopeId}><option value=""${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(role.value) ? (0, server_renderer_exports.ssrLooseContain)(role.value, "") : (0, server_renderer_exports.ssrLooseEqual)(role.value, "")) ? " selected" : ""}${_scopeId}>Nur für mich</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.shareOptions, (option) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", String(option.id))}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(role.value) ? (0, server_renderer_exports.ssrLooseContain)(role.value, String(option.id)) : (0, server_renderer_exports.ssrLooseEqual)(role.value, String(option.id))) ? " selected" : ""}${_scopeId}>Für alle mit der Rolle „${(0, server_renderer_exports.ssrInterpolate)(option.label)}“</option>`);
						});
						_push(`<!--]--></select><p id="sv-role-help" class="form-field__help"${_scopeId}>Geteilte Ansichten sehen alle mit der gewählten Rolle. Ändern kannst nur du sie.</p><p id="sv-role-err" class="form-field__error"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(roleError.value)}</p></div><div class="form-field"${_scopeId}><label class="check"${_scopeId}><input id="sv-columns"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(keepColumns.value) ? (0, server_renderer_exports.ssrLooseContain)(keepColumns.value, null) : keepColumns.value) ? " checked" : ""} type="checkbox" aria-describedby="sv-columns-help sv-columns-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", columnsError.value ? "true" : void 0)}${_scopeId}> Spalten mitspeichern </label><p id="sv-columns-help" class="form-field__help"${_scopeId}>Wer die Ansicht öffnet, sieht dann diese Spalten statt der eigenen.</p><p id="sv-columns-err" class="form-field__error"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(columnsError.value)}</p></div></form>`);
					} else return [(0, vue_exports.createVNode)("form", {
						id: "sv-form",
						class: "adm-fields",
						novalidate: "",
						onSubmit: (0, vue_exports.withModifiers)(save, ["prevent"])
					}, [
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "sv-name"
							}, "Name"),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "sv-name",
								"onUpdate:modelValue": ($event) => name.value = $event,
								class: "input",
								type: "text",
								maxlength: "60",
								autocomplete: "off",
								"aria-required": "true",
								"aria-describedby": "sv-name-help sv-name-err",
								"aria-invalid": nameError.value ? "true" : void 0
							}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, name.value]]),
							(0, vue_exports.createVNode)("p", {
								id: "sv-name-help",
								class: "form-field__help"
							}, "Zum Beispiel „Bezahlt, noch nicht versendet“."),
							(0, vue_exports.createVNode)("p", {
								id: "sv-name-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(nameError.value), 1)
						]),
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "sv-role"
							}, "Teilen"),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
								id: "sv-role",
								"onUpdate:modelValue": ($event) => role.value = $event,
								class: "input",
								"aria-describedby": "sv-role-help sv-role-err",
								"aria-invalid": roleError.value ? "true" : void 0
							}, [(0, vue_exports.createVNode)("option", { value: "" }, "Nur für mich"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.shareOptions, (option) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
									key: option.id,
									value: String(option.id)
								}, "Für alle mit der Rolle „" + (0, vue_exports.toDisplayString)(option.label) + "“", 9, ["value"]);
							}), 128))], 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelSelect, role.value]]),
							(0, vue_exports.createVNode)("p", {
								id: "sv-role-help",
								class: "form-field__help"
							}, "Geteilte Ansichten sehen alle mit der gewählten Rolle. Ändern kannst nur du sie."),
							(0, vue_exports.createVNode)("p", {
								id: "sv-role-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(roleError.value), 1)
						]),
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "sv-columns",
								"onUpdate:modelValue": ($event) => keepColumns.value = $event,
								type: "checkbox",
								"aria-describedby": "sv-columns-help sv-columns-err",
								"aria-invalid": columnsError.value ? "true" : void 0
							}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelCheckbox, keepColumns.value]]), (0, vue_exports.createTextVNode)(" Spalten mitspeichern ")]),
							(0, vue_exports.createVNode)("p", {
								id: "sv-columns-help",
								class: "form-field__help"
							}, "Wer die Ansicht öffnet, sieht dann diese Spalten statt der eigenen."),
							(0, vue_exports.createVNode)("p", {
								id: "sv-columns-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(columnsError.value), 1)
						])
					], 32)];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Lists/SaveViewDialog.vue
var _sfc_setup$1 = SaveViewDialog_vue_vue_type_script_setup_true_lang_default.setup;
SaveViewDialog_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Lists/SaveViewDialog.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var SaveViewDialog_default = SaveViewDialog_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/lib/viewState.ts
/**
* What a saved view's state *means*, so two states that mean the same compare equal (SV-13): `1000`,
* `1.000`, ` 1000 ` and the number 1000 are one amount; `null`, `''` and a missing key are one
* absence; the order of keys and of a list's entries means nothing.
*
* Used on both sides of the dirty check — the view as saved and the filters on screen — and never on
* formatted strings: compare meanings, not spellings.
*/
function normalizeValue(value) {
	if (value === null || value === void 0) return;
	if (typeof value === "boolean" || typeof value === "number") return typeof value === "number" && !Number.isFinite(value) ? void 0 : value;
	if (typeof value === "string") {
		const text = value.trim();
		if (text === "") return;
		if (text === "true" || text === "false") return text === "true";
		return parseNumber(text) ?? text;
	}
	if (Array.isArray(value)) return value.map(normalizeValue).filter((item) => item !== void 0).sort((a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : JSON.stringify(a) > JSON.stringify(b) ? 1 : 0);
	if (typeof value === "object") return normalizeViewState(value);
}
/** The state with its keys sorted, its numbers numbers, its booleans booleans and its blanks gone. */
function normalizeViewState(state) {
	const normalized = {};
	for (const key of Object.keys(state).sort()) {
		const value = normalizeValue(state[key]);
		if (value !== void 0) normalized[key] = value;
	}
	return normalized;
}
/** Whether two states mean the same. */
function sameViewState(a, b) {
	return JSON.stringify(normalizeViewState(a)) === JSON.stringify(normalizeViewState(b));
}
//#endregion
//#region resources/js/Components/Admin/Lists/ListViews.vue?vue&type=script&setup=true&lang.ts
var ListViews_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ListViews",
	__ssrInlineRender: true,
	props: {
		list: {},
		base: {},
		allLabel: {},
		views: {},
		query: {},
		columns: {}
	},
	emits: ["ownColumns"],
	setup(__props, { emit: __emit }) {
		/**
		* The Gespeicherte Ansichten above a list (docs/admin/rest-build-plan.md, step 2.2): the whole list,
		* then this person's own views, then those shared with their role — each a link, so Back, a bookmark
		* and a pasted address all work. The admin's tab row (AdminSectionTabs), not ARIA tabs.
		*
		* With filters on screen that no view keeps, „Als Ansicht speichern“ offers to keep them. With the
		* person's own view open and its filters changed, „Änderungen speichern“ saves over it and
		* „Verwerfen“ opens it as it was. The open view of one's own has a menu: rename and share, delete —
		* and a deleted view comes back with „Rückgängig“ in the toast. Shared views are for using: only
		* their owner changes them.
		*
		* „Geändert“ is decided here, on what the filters mean (normalizeViewState on both sides, SV-13):
		* `1000` typed where the view keeps `1.000` is the same view. A view saved with its columns shows
		* them, says so next to its name, and gives the person's own back with one button — the view stays.
		*/
		const props = __props;
		const activeView = (0, vue_exports.computed)(() => props.views.items.find((view) => view.id === props.views.active) ?? null);
		const filtersOn = (0, vue_exports.computed)(() => Object.keys(props.query).length > 0);
		/** „Alle“ is where one is with no view and nothing filtered — in whatever order: all is all. */
		const allCurrent = (0, vue_exports.computed)(() => props.views.active === null && Object.keys(props.query).every((key) => key === "sort" || key === "richtung"));
		/** The open view's own columns changed on screen — only while they are the ones shown. */
		const columnsChanged = (0, vue_exports.computed)(() => {
			const view = activeView.value;
			return view !== null && props.columns.fromView && !sameViewState({ columns: view.columns ?? [] }, { columns: props.columns.keys });
		});
		/** The open view, no longer as it was saved: its filters, or its own columns. */
		const modified = (0, vue_exports.computed)(() => {
			const view = activeView.value;
			return view !== null && (!sameViewState(view.query, props.query) || columnsChanged.value);
		});
		/** Filters (or a view's columns) on screen that no view keeps as they are. */
		const wantsSave = (0, vue_exports.computed)(() => (filtersOn.value || columnsChanged.value) && (activeView.value === null || modified.value));
		const offerSave = (0, vue_exports.computed)(() => props.views.canSave && wantsSave.value);
		/** The same wish at the limit of views: said, rather than the button simply gone. */
		const atLimit = (0, vue_exports.computed)(() => !props.views.canSave && wantsSave.value);
		/** The person's own view, open and changed. */
		const offerSaveOver = (0, vue_exports.computed)(() => activeView.value !== null && activeView.value.mine && modified.value);
		const dialogOpen = (0, vue_exports.ref)(false);
		const editing = (0, vue_exports.ref)(null);
		const busy = (0, vue_exports.ref)(false);
		function openEdit(view) {
			editing.value = view;
			dialogOpen.value = true;
		}
		const bar = (0, vue_exports.ref)(null);
		function focusTab(target) {
			const root = bar.value;
			if (root === null) return;
			((target === "current" ? root.querySelector(".lv__tabs [aria-current=\"page\"]") : target === "all" ? null : root.querySelector(`[data-view="${target}"]`)) ?? root.querySelector(".adm-tabs__item"))?.focus();
		}
		function revealCurrent() {
			const tab = bar.value?.querySelector(".lv__tabs [aria-current=\"page\"]");
			(tab?.closest(".lv__item") ?? tab)?.scrollIntoView({
				block: "nearest",
				inline: "nearest"
			});
		}
		(0, vue_exports.onMounted)(() => {
			revealCurrent();
			document.fonts?.ready.then(revealCurrent);
		});
		(0, vue_exports.watch)(() => props.views.active, () => void (0, vue_exports.nextTick)(revealCurrent));
		function remove(view) {
			router.delete(`/admin/ansichten/${view.id}`, {
				preserveScroll: true,
				onSuccess: () => {
					(0, vue_exports.nextTick)(() => focusTab("all"));
					toast.show({
						text: `Ansicht „${view.name}“ gelöscht.`,
						icon: "info",
						action: {
							label: "Rückgängig",
							run: () => router.post(`/admin/ansichten/${view.id}/wiederherstellen`, {}, {
								preserveScroll: true,
								onSuccess: () => void (0, vue_exports.nextTick)(() => focusTab(view.id))
							})
						}
					});
				}
			});
		}
		function sharedNote(view) {
			if (view.owner) return `, geteilt von ${view.owner}`;
			return view.sharedWith ? `, geteilt mit der Rolle „${view.sharedWith}“` : "";
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[--><div class="lv" data-v-c8faf0d1><nav class="adm-tabs lv__tabs" aria-label="Ansichten" data-v-c8faf0d1>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: __props.base,
				class: "adm-tabs__item",
				"aria-current": allCurrent.value ? "page" : void 0
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(__props.allLabel)}`);
					else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.allLabel), 1)];
				}),
				_: 1
			}, _parent));
			_push(`<!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.views.items, (view) => {
				_push(`<span class="lv__item" data-v-c8faf0d1>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: view.href,
					class: "adm-tabs__item lv__view",
					"data-view": view.id,
					"aria-current": view.id === __props.views.active ? "page" : void 0
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							if (view.owner || view.sharedWith) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "customers",
								size: 20
							}, null, _parent, _scopeId));
							else _push(`<!---->`);
							_push(` ${(0, server_renderer_exports.ssrInterpolate)(view.name)} <span class="visually-hidden" data-v-c8faf0d1${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(sharedNote(view))}</span>`);
							if (view.id === __props.views.active && modified.value) _push(`<!--[--><span class="visually-hidden" data-v-c8faf0d1${_scopeId}>, </span><span class="lv__changed" data-v-c8faf0d1${_scopeId}>geändert</span><!--]-->`);
							else _push(`<!---->`);
						} else return [
							view.owner || view.sharedWith ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
								key: 0,
								name: "customers",
								size: 20
							})) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(view.name) + " ", 1),
							(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, (0, vue_exports.toDisplayString)(sharedNote(view)), 1),
							view.id === __props.views.active && modified.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ", "), (0, vue_exports.createVNode)("span", { class: "lv__changed" }, "geändert")], 64)) : (0, vue_exports.createCommentVNode)("", true)
						];
					}),
					_: 2
				}, _parent));
				if (view.mine && view.id === __props.views.active) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
								class: "adm-iconbtn lv__more",
								"aria-label": `Aktionen für die Ansicht „${view.name}“`
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "more",
										size: 20
									}, null, _parent, _scopeId));
									else return [(0, vue_exports.createVNode)(AdminIcon_default, {
										name: "more",
										size: 20
									})];
								}),
								_: 2
							}, _parent, _scopeId));
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuContent_default), {
										class: "adm-menu",
										align: "start",
										"side-offset": 8
									}, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) {
												_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item",
													onSelect: ($event) => openEdit(view)
												}, {
													default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
														if (_push) {
															_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																name: "edit",
																size: 20
															}, null, _parent, _scopeId));
															_push(` Umbenennen und teilen `);
														} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "edit",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Umbenennen und teilen ")];
													}),
													_: 2
												}, _parent, _scopeId));
												_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }, null, _parent, _scopeId));
												_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item adm-menu__item--danger",
													onSelect: ($event) => remove(view)
												}, {
													default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
														if (_push) {
															_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																name: "delete",
																size: 20
															}, null, _parent, _scopeId));
															_push(` Löschen `);
														} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "delete",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Löschen ")];
													}),
													_: 2
												}, _parent, _scopeId));
											} else return [
												(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item",
													onSelect: ($event) => openEdit(view)
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "edit",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Umbenennen und teilen ")]),
													_: 1
												}, 8, ["onSelect"]),
												(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
												(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item adm-menu__item--danger",
													onSelect: ($event) => remove(view)
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "delete",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Löschen ")]),
													_: 1
												}, 8, ["onSelect"])
											];
										}),
										_: 2
									}, _parent, _scopeId));
									else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
										class: "adm-menu",
										align: "start",
										"side-offset": 8
									}, {
										default: (0, vue_exports.withCtx)(() => [
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "adm-menu__item",
												onSelect: ($event) => openEdit(view)
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "edit",
													size: 20
												}), (0, vue_exports.createTextVNode)(" Umbenennen und teilen ")]),
												_: 1
											}, 8, ["onSelect"]),
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "adm-menu__item adm-menu__item--danger",
												onSelect: ($event) => remove(view)
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "delete",
													size: 20
												}), (0, vue_exports.createTextVNode)(" Löschen ")]),
												_: 1
											}, 8, ["onSelect"])
										]),
										_: 2
									}, 1024)];
								}),
								_: 2
							}, _parent, _scopeId));
						} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
							class: "adm-iconbtn lv__more",
							"aria-label": `Aktionen für die Ansicht „${view.name}“`
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "more",
								size: 20
							})]),
							_: 1
						}, 8, ["aria-label"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
								class: "adm-menu",
								align: "start",
								"side-offset": 8
							}, {
								default: (0, vue_exports.withCtx)(() => [
									(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
										class: "adm-menu__item",
										onSelect: ($event) => openEdit(view)
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "edit",
											size: 20
										}), (0, vue_exports.createTextVNode)(" Umbenennen und teilen ")]),
										_: 1
									}, 8, ["onSelect"]),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
										class: "adm-menu__item adm-menu__item--danger",
										onSelect: ($event) => remove(view)
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "delete",
											size: 20
										}), (0, vue_exports.createTextVNode)(" Löschen ")]),
										_: 1
									}, 8, ["onSelect"])
								]),
								_: 2
							}, 1024)]),
							_: 2
						}, 1024)];
					}),
					_: 2
				}, _parent));
				else _push(`<!---->`);
				if (view.id === __props.views.active && __props.columns.fromView) _push(`<span class="lv__cols" data-v-c8faf0d1> Spalten aus dieser Ansicht <button class="lv__own" type="button" data-v-c8faf0d1>Meine Spalten wiederherstellen</button></span>`);
				else _push(`<!---->`);
				_push(`</span>`);
			});
			_push(`<!--]--></nav>`);
			if (offerSaveOver.value || offerSave.value || atLimit.value) {
				_push(`<div class="lv__actions" data-v-c8faf0d1>`);
				if (offerSaveOver.value && activeView.value) {
					_push(`<!--[--><button class="btn btn--secondary btn--sm" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-c8faf0d1> Änderungen speichern </button>`);
					_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: activeView.value.href,
						class: "btn btn--ghost btn--sm",
						"preserve-scroll": ""
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`Verwerfen`);
							else return [(0, vue_exports.createTextVNode)("Verwerfen")];
						}),
						_: 1
					}, _parent));
					_push(`<!--]-->`);
				} else _push(`<!---->`);
				if (offerSave.value) {
					_push(`<button class="btn btn--ghost btn--sm" type="button" data-v-c8faf0d1>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "bookmark",
						size: 20
					}, null, _parent));
					_push(` Als Ansicht speichern </button>`);
				} else if (atLimit.value) _push(`<p class="lv__limit" data-v-c8faf0d1>${(0, server_renderer_exports.ssrInterpolate)(__props.views.limit)} von ${(0, server_renderer_exports.ssrInterpolate)(__props.views.limit)} Ansichten gespeichert. Lösch eine, um diese Filter zu speichern.</p>`);
				else _push(`<!---->`);
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`</div>`);
			if (__props.views.missing) _push(`<p class="lv__missing" role="status" data-v-c8faf0d1> Die verlinkte Ansicht gibt es nicht mehr oder sie ist nicht mit dir geteilt. Die Filter aus dem Link gelten trotzdem. </p>`);
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(SaveViewDialog_default, {
				open: dialogOpen.value,
				"onUpdate:open": ($event) => dialogOpen.value = $event,
				list: __props.list,
				query: __props.query,
				columns: __props.columns.keys,
				"share-options": __props.views.shareOptions,
				view: editing.value,
				onSaved: ($event) => focusTab("current")
			}, null, _parent));
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Lists/ListViews.vue
var _sfc_setup = ListViews_vue_vue_type_script_setup_true_lang_default.setup;
ListViews_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Lists/ListViews.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var ListViews_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ListViews_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-c8faf0d1"]]);
//#endregion
export { ColumnChooser_default as n, ListViews_default as t };
