import { a as VisuallyHiddenInput_default, i as PopoverRoot_default, n as PopoverPortal_default, o as useFormControl, r as PopoverContent_default, s as isEqual, t as PopoverTrigger_default } from "./PopoverTrigger-Cz2oRGBu.js";
import { D as useForwardExpose, P as useVModel, S as Primitive, U as isNullish } from "./Dialog-CAlgTJaP.js";
import { a as DropdownMenuRoot_default, i as DropdownMenuContent_default, n as DropdownMenuPortal_default, r as DropdownMenuItem_default, s as RovingFocusGroup_default, t as DropdownMenuTrigger_default, x as useDirection } from "./DropdownMenuTrigger-DxgIMivC.js";
import { t as RovingFocusItem_default } from "./RovingFocusItem-DsPUBuuS.js";
import { c as router, n as createContext, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-COuF1lMZ.js";
import { n as formatGermanDay, r as parseGermanDay } from "./days-BEXWaUP_.js";
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/shared/isValueEqualOrExist.js
/**
* The function `isValueEqualOrExist` checks if a value is equal to or exists in another value or
* array.
* @param {T | T[] | undefined} base - It represents the base value that you want to compare with the `current` value.
* @param {T | T[] | undefined} current - The `current` parameter represents the current value that you want to compare with the `base` value or values.
* @returns The `isValueEqualOrExist` function returns a boolean value. It checks if the `base` value
* is equal to the `current` value or if the `current` value exists within the `base` value. The
* function handles cases where `base` can be a single value, an array of values, or undefined.
*/
function isValueEqualOrExist(base, current) {
	if (isNullish(base)) return false;
	if (Array.isArray(base)) return base.some((val) => isEqual(val, current));
	else return isEqual(base, current);
}
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/shared/useForwardScopeId.js
/**
* Returns the parent component's `<style scoped>` id (e.g. `data-v-xxxxxxx`) as a
* bindable attribute object, so it can be manually forwarded onto the chosen root
* element of a multi-root component.
*
* Vue only auto-applies the parent's scope id to a **single-root** component's root.
* When a component renders multiple root nodes (e.g. an interactive control plus a
* sibling hidden form input), that fallthrough is dropped and the parent's scoped
* styles can no longer reach the component. Spread the returned object onto the
* element that should stay styleable by the parent.
*
* @example
* ```ts
* const scopeIdAttrs = useForwardScopeId()
* // <Primitive v-bind="{ ...$attrs, ...scopeIdAttrs }" />
* ```
*/
function useForwardScopeId() {
	const scopeId = ((0, vue_exports.getCurrentInstance)()?.vnode)?.scopeId;
	return scopeId ? { [scopeId]: "" } : {};
}
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/shared/useSingleOrMultipleValue.js
/**
* Validates the props and it makes sure that the types are coherent with each other
*
* 1. If type, defaultValue, and modelValue are all undefined, throw an error.
* 2. If modelValue and defaultValue are defined and not of the same type, throw an error.
* 3. If type is defined:
*    a. If type is 'single' and either modelValue or defaultValue is an array, log an error and return 'multiple'.
*    b. If type is 'multiple' and neither modelValue nor defaultValue is an array, log an error and return 'single'.
* 4. Return 'multiple' if modelValue is an array, else return 'single'.
*/
function validateProps({ type, defaultValue, modelValue }) {
	const value = modelValue || defaultValue;
	if (modelValue !== void 0 || defaultValue !== void 0) return Array.isArray(value) ? "multiple" : "single";
	else return type ?? "single";
}
function getDefaultType({ type, defaultValue, modelValue }) {
	if (type) return type;
	return validateProps({
		type,
		defaultValue,
		modelValue
	});
}
function getDefaultValue({ type, defaultValue }) {
	if (defaultValue !== void 0) return defaultValue;
	return type === "single" ? void 0 : [];
}
function useSingleOrMultipleValue(props, emits) {
	const type = (0, vue_exports.computed)(() => getDefaultType(props));
	const modelValue = useVModel(props, "modelValue", emits, {
		defaultValue: getDefaultValue(props),
		passive: props.modelValue === void 0,
		deep: true
	});
	function changeModelValue(value) {
		if (type.value === "single") modelValue.value = isEqual(value, modelValue.value) ? void 0 : value;
		else {
			const modelValueArray = Array.isArray(modelValue.value) ? [...modelValue.value || []] : [modelValue.value].filter(Boolean);
			if (isValueEqualOrExist(modelValueArray, value)) {
				const index = modelValueArray.findIndex((i) => isEqual(i, value));
				modelValueArray.splice(index, 1);
			} else modelValueArray.push(value);
			modelValue.value = modelValueArray;
		}
	}
	return {
		modelValue,
		changeModelValue,
		isSingle: (0, vue_exports.computed)(() => type.value === "single")
	};
}
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Switch/SwitchRoot.js
var [injectSwitchRootContext, provideSwitchRootContext] = /*#__PURE__*/ createContext("SwitchRoot");
var SwitchRoot_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "SwitchRoot",
	props: {
		defaultValue: {
			type: null,
			required: false
		},
		modelValue: {
			type: null,
			required: false,
			default: void 0
		},
		disabled: {
			type: Boolean,
			required: false
		},
		id: {
			type: String,
			required: false
		},
		value: {
			type: String,
			required: false,
			default: "on"
		},
		trueValue: {
			type: null,
			required: false,
			default: () => true
		},
		falseValue: {
			type: null,
			required: false,
			default: () => false
		},
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false,
			default: "button"
		},
		name: {
			type: String,
			required: false
		},
		required: {
			type: Boolean,
			required: false
		}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const { disabled } = (0, vue_exports.toRefs)(props);
		const modelValue = useVModel(props, "modelValue", emit, {
			defaultValue: props.defaultValue ?? props.falseValue,
			passive: props.modelValue === void 0
		});
		const checked = (0, vue_exports.computed)(() => modelValue.value === props.trueValue);
		function toggleCheck() {
			if (disabled.value) return;
			modelValue.value = checked.value ? props.falseValue : props.trueValue;
		}
		const { forwardRef, currentElement } = useForwardExpose();
		const isFormControl = useFormControl(currentElement);
		const scopeIdAttrs = useForwardScopeId();
		const ariaLabel = (0, vue_exports.computed)(() => props.id && currentElement.value ? document.querySelector(`[for="${props.id}"]`)?.innerText : void 0);
		provideSwitchRootContext({
			checked,
			toggleCheck,
			disabled
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createElementBlock)(vue_exports.Fragment, null, [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)({
				id: _ctx.id,
				ref: (0, vue_exports.unref)(forwardRef),
				role: "switch",
				type: _ctx.as === "button" ? "button" : void 0,
				value: _ctx.value,
				"aria-label": _ctx.$attrs["aria-label"] || ariaLabel.value,
				"aria-checked": checked.value,
				"aria-required": _ctx.required,
				"data-state": checked.value ? "checked" : "unchecked",
				"data-disabled": (0, vue_exports.unref)(disabled) ? "" : void 0,
				"as-child": _ctx.asChild,
				as: _ctx.as,
				disabled: (0, vue_exports.unref)(disabled)
			}, {
				...(0, vue_exports.unref)(scopeIdAttrs),
				..._ctx.$attrs
			}, {
				onClick: toggleCheck,
				onKeydown: (0, vue_exports.withKeys)((0, vue_exports.withModifiers)(toggleCheck, ["prevent"]), ["enter"])
			}), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", {
					modelValue: (0, vue_exports.unref)(modelValue),
					checked: checked.value
				})]),
				_: 3
			}, 16, [
				"id",
				"type",
				"value",
				"aria-label",
				"aria-checked",
				"aria-required",
				"data-state",
				"data-disabled",
				"as-child",
				"as",
				"disabled",
				"onKeydown"
			]), (0, vue_exports.unref)(isFormControl) && _ctx.name ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(VisuallyHiddenInput_default), (0, vue_exports.mergeProps)({
				key: 0,
				type: "checkbox",
				name: _ctx.name,
				disabled: (0, vue_exports.unref)(disabled),
				required: _ctx.required,
				value: _ctx.value,
				checked: checked.value
			}, (0, vue_exports.unref)(scopeIdAttrs)), null, 16, [
				"name",
				"disabled",
				"required",
				"value",
				"checked"
			])) : (0, vue_exports.createCommentVNode)("v-if", true)], 64);
		};
	}
});
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Switch/SwitchThumb.js
var SwitchThumb_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "SwitchThumb",
	props: {
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
		const rootContext = injectSwitchRootContext();
		useForwardExpose();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), {
				"data-state": (0, vue_exports.unref)(rootContext).checked.value ? "checked" : "unchecked",
				"data-disabled": (0, vue_exports.unref)(rootContext).disabled.value ? "" : void 0,
				"as-child": _ctx.asChild,
				as: _ctx.as
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 8, [
				"data-state",
				"data-disabled",
				"as-child",
				"as"
			]);
		};
	}
});
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/ToggleGroup/ToggleGroupRoot.js
var [injectToggleGroupRootContext, provideToggleGroupRootContext] = /*#__PURE__*/ createContext("ToggleGroupRoot");
var ToggleGroupRoot_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "ToggleGroupRoot",
	props: {
		rovingFocus: {
			type: Boolean,
			required: false,
			default: true
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},
		orientation: {
			type: String,
			required: false
		},
		dir: {
			type: String,
			required: false
		},
		loop: {
			type: Boolean,
			required: false,
			default: true
		},
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false
		},
		name: {
			type: String,
			required: false
		},
		required: {
			type: Boolean,
			required: false
		},
		type: {
			type: String,
			required: false
		},
		modelValue: {
			type: null,
			required: false
		},
		defaultValue: {
			type: null,
			required: false
		}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const { loop, rovingFocus, disabled, dir: propDir } = (0, vue_exports.toRefs)(props);
		const dir = useDirection(propDir);
		const { forwardRef, currentElement } = useForwardExpose();
		const { modelValue, changeModelValue, isSingle } = useSingleOrMultipleValue(props, emits);
		const isFormControl = useFormControl(currentElement);
		provideToggleGroupRootContext({
			isSingle,
			modelValue,
			changeModelValue,
			dir,
			orientation: props.orientation,
			loop,
			rovingFocus,
			disabled
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.resolveDynamicComponent)((0, vue_exports.unref)(rovingFocus) ? (0, vue_exports.unref)(RovingFocusGroup_default) : (0, vue_exports.unref)(Primitive)), {
				"as-child": "",
				orientation: (0, vue_exports.unref)(rovingFocus) ? _ctx.orientation : void 0,
				dir: (0, vue_exports.unref)(dir),
				loop: (0, vue_exports.unref)(rovingFocus) ? (0, vue_exports.unref)(loop) : void 0
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), {
					ref: (0, vue_exports.unref)(forwardRef),
					role: "group",
					"as-child": _ctx.asChild,
					as: _ctx.as
				}, {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", { modelValue: (0, vue_exports.unref)(modelValue) }), (0, vue_exports.unref)(isFormControl) && _ctx.name ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(VisuallyHiddenInput_default, {
						key: 0,
						name: _ctx.name,
						required: _ctx.required,
						value: (0, vue_exports.unref)(modelValue)
					}, null, 8, [
						"name",
						"required",
						"value"
					])) : (0, vue_exports.createCommentVNode)("v-if", true)]),
					_: 3
				}, 8, ["as-child", "as"])]),
				_: 3
			}, 8, [
				"orientation",
				"dir",
				"loop"
			]);
		};
	}
});
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Toggle/Toggle.js
var Toggle_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "Toggle",
	props: {
		defaultValue: {
			type: Boolean,
			required: false
		},
		modelValue: {
			type: [Boolean, null],
			required: false,
			default: void 0
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false,
			default: "button"
		},
		name: {
			type: String,
			required: false
		},
		required: {
			type: Boolean,
			required: false
		}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const { forwardRef, currentElement } = useForwardExpose();
		const scopeIdAttrs = useForwardScopeId();
		const toggleGroupContext = injectToggleGroupRootContext(null);
		const modelValue = useVModel(props, "modelValue", emits, {
			defaultValue: props.defaultValue,
			passive: props.modelValue === void 0
		});
		function togglePressed() {
			modelValue.value = !modelValue.value;
		}
		const dataState = (0, vue_exports.computed)(() => {
			return modelValue.value ? "on" : "off";
		});
		const isFormControl = useFormControl(currentElement);
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createElementBlock)(vue_exports.Fragment, null, [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)({
				ref: (0, vue_exports.unref)(forwardRef),
				type: _ctx.as === "button" ? "button" : void 0,
				"as-child": props.asChild,
				as: _ctx.as,
				"aria-pressed": (0, vue_exports.unref)(modelValue),
				"data-state": dataState.value,
				"data-disabled": _ctx.disabled ? "" : void 0,
				disabled: _ctx.disabled
			}, {
				...(0, vue_exports.unref)(scopeIdAttrs),
				..._ctx.$attrs
			}, { onClick: togglePressed }), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", {
					modelValue: (0, vue_exports.unref)(modelValue),
					disabled: _ctx.disabled,
					pressed: (0, vue_exports.unref)(modelValue),
					state: dataState.value
				})]),
				_: 3
			}, 16, [
				"type",
				"as-child",
				"as",
				"aria-pressed",
				"data-state",
				"data-disabled",
				"disabled"
			]), (0, vue_exports.unref)(isFormControl) && _ctx.name && !(0, vue_exports.unref)(toggleGroupContext) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(VisuallyHiddenInput_default, (0, vue_exports.mergeProps)({
				key: 0,
				type: "checkbox",
				name: _ctx.name,
				value: (0, vue_exports.unref)(modelValue),
				required: _ctx.required
			}, (0, vue_exports.unref)(scopeIdAttrs)), null, 16, [
				"name",
				"value",
				"required"
			])) : (0, vue_exports.createCommentVNode)("v-if", true)], 64);
		};
	}
});
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/ToggleGroup/ToggleGroupItem.js
var ToggleGroupItem_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "ToggleGroupItem",
	props: {
		value: {
			type: null,
			required: true
		},
		disabled: {
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
			default: "button"
		}
	},
	setup(__props) {
		const props = __props;
		const rootContext = injectToggleGroupRootContext();
		const disabled = (0, vue_exports.computed)(() => rootContext.disabled?.value || props.disabled);
		const pressed = (0, vue_exports.computed)(() => isValueEqualOrExist(rootContext.modelValue.value, props.value));
		const { forwardRef } = useForwardExpose();
		const scopeIdAttrs = useForwardScopeId();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.resolveDynamicComponent)((0, vue_exports.unref)(rootContext).rovingFocus.value ? (0, vue_exports.unref)(RovingFocusItem_default) : (0, vue_exports.unref)(Primitive)), (0, vue_exports.mergeProps)({ "as-child": "" }, (0, vue_exports.unref)(rootContext).rovingFocus.value ? {
				focusable: !disabled.value,
				active: pressed.value
			} : {}), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Toggle_default), (0, vue_exports.mergeProps)({
					...(0, vue_exports.unref)(scopeIdAttrs),
					...props
				}, {
					ref: (0, vue_exports.unref)(forwardRef),
					disabled: disabled.value,
					"model-value": pressed.value,
					"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => (0, vue_exports.unref)(rootContext).changeModelValue(_ctx.value))
				}), {
					default: (0, vue_exports.withCtx)((slotProps) => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", (0, vue_exports.normalizeProps)((0, vue_exports.guardReactiveProps)(slotProps)))]),
					_: 3
				}, 16, ["disabled", "model-value"])]),
				_: 3
			}, 16);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Dashboard/PeriodSwitcher.vue?vue&type=script&setup=true&lang.ts
var MAX_DAYS = 366;
var PeriodSwitcher_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "PeriodSwitcher",
	__ssrInlineRender: true,
	props: {
		period: {},
		exportUrl: {},
		base: { default: "/admin" },
		comparable: {
			type: Boolean,
			default: true
		},
		keep: { default: () => ({}) }
	},
	setup(__props) {
		/**
		* The Übersicht's one Zeitraum, applied to every widget and remembered on the account: 7, 30 or 90
		* days, or an own range typed the German way (TT.MM.JJJJ) — plus „Mit dem Vorzeitraum vergleichen“, and
		* the page's menu (CSV, print).
		*
		* The presets are a toggle group: one pressed at a time, arrows move between them (reka). An own
		* range opens a small popover with two fields and "Anwenden"; its errors are the admin's shared date
		* rules, said under the fields before anything is sent.
		*/
		const props = __props;
		/** Period::MAX_DAYS: a year and a day, so a year compares with the year before. */
		const PRESETS = [
			{
				key: "7",
				label: "7 Tage"
			},
			{
				key: "30",
				label: "30 Tage"
			},
			{
				key: "90",
				label: "90 Tage"
			}
		];
		const busy = (0, vue_exports.ref)(false);
		const customOpen = (0, vue_exports.ref)(false);
		const von = (0, vue_exports.ref)(formatGermanDay(props.period.von));
		const bis = (0, vue_exports.ref)(formatGermanDay(props.period.bis));
		const error = (0, vue_exports.ref)("");
		const preset = (0, vue_exports.computed)({
			get: () => props.period.key === "eigen" ? "" : props.period.key,
			set: (key) => {
				if (key && key !== props.period.key) go({ zeitraum: key });
			}
		});
		/**
		* The Zeitraum as it stands on screen. Every change sends all of it, so what the reader sees is what
		* the next page counts — even after the browser's Back has shown an older page than the one the
		* account last remembered.
		*/
		function shown() {
			const days = props.period.key === "eigen" ? {
				zeitraum: "eigen",
				von: props.period.von,
				bis: props.period.bis
			} : { zeitraum: props.period.key };
			return props.comparable ? {
				...days,
				vergleich: props.period.compare ? "1" : "0"
			} : days;
		}
		function go(change) {
			if (busy.value) return;
			busy.value = true;
			const query = {
				...props.keep,
				...shown(),
				...change
			};
			if (query.zeitraum !== "eigen") {
				delete query.von;
				delete query.bis;
			}
			router.get(props.base, query, {
				preserveScroll: true,
				preserveState: true,
				onFinish: () => busy.value = false
			});
		}
		function openCustom(open) {
			customOpen.value = open;
			if (open) {
				von.value = formatGermanDay(props.period.von);
				bis.value = formatGermanDay(props.period.bis);
				error.value = "";
			}
		}
		function applyCustom() {
			const from = parseGermanDay(von.value);
			const to = parseGermanDay(bis.value);
			if (from === null || to === null) {
				error.value = "Bitte schreib das Datum als TT.MM.JJJJ, zum Beispiel 01.09.2026.";
				return;
			}
			if (to < from) {
				error.value = "Das Enddatum liegt vor dem Anfangsdatum.";
				return;
			}
			if (from < "2000-01-01" || to > "2099-12-31") {
				error.value = "Bitte wähl ein Datum zwischen dem 01.01.2000 und dem 31.12.2099.";
				return;
			}
			if ((Date.parse(to) - Date.parse(from)) / 864e5 + 1 > MAX_DAYS) {
				error.value = "Der Zeitraum ist zu lang. Bitte kürz ihn auf höchstens 366 Tage.";
				return;
			}
			customOpen.value = false;
			go({
				zeitraum: "eigen",
				von: from,
				bis: to
			});
		}
		function setCompare(on) {
			go({ vergleich: on ? "1" : "0" });
		}
		function print() {
			window.print();
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "period" }, _attrs))} data-v-9fc9ab38>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ToggleGroupRoot_default), {
				modelValue: preset.value,
				"onUpdate:modelValue": ($event) => preset.value = $event,
				type: "single",
				class: "period__group",
				"aria-label": "Zeitraum",
				"aria-busy": busy.value ? "true" : void 0
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(PRESETS, (item) => {
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ToggleGroupItem_default), {
								key: item.key,
								value: item.key,
								class: "period__seg"
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(item.label)}`);
									else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label), 1)];
								}),
								_: 2
							}, _parent, _scopeId));
						});
						_push(`<!--]-->`);
					} else return [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(PRESETS, (item) => {
						return (0, vue_exports.createVNode)((0, vue_exports.unref)(ToggleGroupItem_default), {
							key: item.key,
							value: item.key,
							class: "period__seg"
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label), 1)]),
							_: 2
						}, 1032, ["value"]);
					}), 64))];
				}),
				_: 1
			}, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(PopoverRoot_default), {
				open: customOpen.value,
				"onUpdate:open": openCustom
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(PopoverTrigger_default), {
							class: ["period__seg period__custom", { "period__seg--on": __props.period.key === "eigen" }],
							"aria-pressed": __props.period.key === "eigen"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "calendar",
										size: 16
									}, null, _parent, _scopeId));
									_push(`<span class="period__custom-label" data-v-9fc9ab38${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.period.key === "eigen" ? __props.period.range : "Eigener Zeitraum")}</span><span class="period__custom-short" aria-hidden="true" data-v-9fc9ab38${_scopeId}>Eigen</span>`);
								} else return [
									(0, vue_exports.createVNode)(AdminIcon_default, {
										name: "calendar",
										size: 16
									}),
									(0, vue_exports.createVNode)("span", { class: "period__custom-label" }, (0, vue_exports.toDisplayString)(__props.period.key === "eigen" ? __props.period.range : "Eigener Zeitraum"), 1),
									(0, vue_exports.createVNode)("span", {
										class: "period__custom-short",
										"aria-hidden": "true"
									}, "Eigen")
								];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(PopoverPortal_default), null, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(PopoverContent_default), {
									class: "adm-menu period__popover",
									align: "end",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`<form class="period__form" data-v-9fc9ab38${_scopeId}><div class="form-field" data-v-9fc9ab38${_scopeId}><label class="form-field__label" for="period-von" data-v-9fc9ab38${_scopeId}>Von</label><input id="period-von"${(0, server_renderer_exports.ssrRenderAttr)("value", von.value)} class="input" inputmode="numeric" placeholder="TT.MM.JJJJ" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", error.value ? "true" : void 0)} aria-describedby="period-error" data-v-9fc9ab38${_scopeId}></div><div class="form-field" data-v-9fc9ab38${_scopeId}><label class="form-field__label" for="period-bis" data-v-9fc9ab38${_scopeId}>Bis</label><input id="period-bis"${(0, server_renderer_exports.ssrRenderAttr)("value", bis.value)} class="input" inputmode="numeric" placeholder="TT.MM.JJJJ" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", error.value ? "true" : void 0)} aria-describedby="period-error" data-v-9fc9ab38${_scopeId}></div><p id="period-error" class="form-field__error period__error" data-v-9fc9ab38${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(error.value)}</p><button class="btn btn--primary" type="submit" data-v-9fc9ab38${_scopeId}>Anwenden</button></form>`);
										else return [(0, vue_exports.createVNode)("form", {
											class: "period__form",
											onSubmit: (0, vue_exports.withModifiers)(applyCustom, ["prevent"])
										}, [
											(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
												class: "form-field__label",
												for: "period-von"
											}, "Von"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
												id: "period-von",
												"onUpdate:modelValue": ($event) => von.value = $event,
												class: "input",
												inputmode: "numeric",
												placeholder: "TT.MM.JJJJ",
												autocomplete: "off",
												"aria-invalid": error.value ? "true" : void 0,
												"aria-describedby": "period-error"
											}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, von.value]])]),
											(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
												class: "form-field__label",
												for: "period-bis"
											}, "Bis"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
												id: "period-bis",
												"onUpdate:modelValue": ($event) => bis.value = $event,
												class: "input",
												inputmode: "numeric",
												placeholder: "TT.MM.JJJJ",
												autocomplete: "off",
												"aria-invalid": error.value ? "true" : void 0,
												"aria-describedby": "period-error"
											}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, bis.value]])]),
											(0, vue_exports.createVNode)("p", {
												id: "period-error",
												class: "form-field__error period__error"
											}, (0, vue_exports.toDisplayString)(error.value), 1),
											(0, vue_exports.createVNode)("button", {
												class: "btn btn--primary",
												type: "submit"
											}, "Anwenden")
										], 32)];
									}),
									_: 1
								}, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverContent_default), {
									class: "adm-menu period__popover",
									align: "end",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("form", {
										class: "period__form",
										onSubmit: (0, vue_exports.withModifiers)(applyCustom, ["prevent"])
									}, [
										(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "period-von"
										}, "Von"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											id: "period-von",
											"onUpdate:modelValue": ($event) => von.value = $event,
											class: "input",
											inputmode: "numeric",
											placeholder: "TT.MM.JJJJ",
											autocomplete: "off",
											"aria-invalid": error.value ? "true" : void 0,
											"aria-describedby": "period-error"
										}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, von.value]])]),
										(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "period-bis"
										}, "Bis"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											id: "period-bis",
											"onUpdate:modelValue": ($event) => bis.value = $event,
											class: "input",
											inputmode: "numeric",
											placeholder: "TT.MM.JJJJ",
											autocomplete: "off",
											"aria-invalid": error.value ? "true" : void 0,
											"aria-describedby": "period-error"
										}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, bis.value]])]),
										(0, vue_exports.createVNode)("p", {
											id: "period-error",
											class: "form-field__error period__error"
										}, (0, vue_exports.toDisplayString)(error.value), 1),
										(0, vue_exports.createVNode)("button", {
											class: "btn btn--primary",
											type: "submit"
										}, "Anwenden")
									], 32)]),
									_: 1
								})];
							}),
							_: 1
						}, _parent, _scopeId));
					} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverTrigger_default), {
						class: ["period__seg period__custom", { "period__seg--on": __props.period.key === "eigen" }],
						"aria-pressed": __props.period.key === "eigen"
					}, {
						default: (0, vue_exports.withCtx)(() => [
							(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "calendar",
								size: 16
							}),
							(0, vue_exports.createVNode)("span", { class: "period__custom-label" }, (0, vue_exports.toDisplayString)(__props.period.key === "eigen" ? __props.period.range : "Eigener Zeitraum"), 1),
							(0, vue_exports.createVNode)("span", {
								class: "period__custom-short",
								"aria-hidden": "true"
							}, "Eigen")
						]),
						_: 1
					}, 8, ["class", "aria-pressed"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverPortal_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverContent_default), {
							class: "adm-menu period__popover",
							align: "end",
							"side-offset": 8
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("form", {
								class: "period__form",
								onSubmit: (0, vue_exports.withModifiers)(applyCustom, ["prevent"])
							}, [
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "period-von"
								}, "Von"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "period-von",
									"onUpdate:modelValue": ($event) => von.value = $event,
									class: "input",
									inputmode: "numeric",
									placeholder: "TT.MM.JJJJ",
									autocomplete: "off",
									"aria-invalid": error.value ? "true" : void 0,
									"aria-describedby": "period-error"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, von.value]])]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "period-bis"
								}, "Bis"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "period-bis",
									"onUpdate:modelValue": ($event) => bis.value = $event,
									class: "input",
									inputmode: "numeric",
									placeholder: "TT.MM.JJJJ",
									autocomplete: "off",
									"aria-invalid": error.value ? "true" : void 0,
									"aria-describedby": "period-error"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, bis.value]])]),
								(0, vue_exports.createVNode)("p", {
									id: "period-error",
									class: "form-field__error period__error"
								}, (0, vue_exports.toDisplayString)(error.value), 1),
								(0, vue_exports.createVNode)("button", {
									class: "btn btn--primary",
									type: "submit"
								}, "Anwenden")
							], 32)]),
							_: 1
						})]),
						_: 1
					})];
				}),
				_: 1
			}, _parent));
			if (__props.comparable) {
				_push(`<label class="period__compare" data-v-9fc9ab38>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(SwitchRoot_default), {
					class: "period__switch",
					"model-value": __props.period.compare,
					"onUpdate:modelValue": setCompare
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(SwitchThumb_default), { class: "period__thumb" }, null, _parent, _scopeId));
						else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(SwitchThumb_default), { class: "period__thumb" })];
					}),
					_: 1
				}, _parent));
				_push(` Mit dem Vorzeitraum vergleichen </label>`);
			} else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
							class: "adm-iconbtn",
							"aria-label": "Weitere Aktionen"
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
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuContent_default), {
									class: "adm-menu",
									align: "end",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											if (__props.exportUrl) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) {
														_push(`<a class="adm-menu__item"${(0, server_renderer_exports.ssrRenderAttr)("href", __props.exportUrl)} download data-v-9fc9ab38${_scopeId}>`);
														_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
															name: "export",
															size: 20
														}, null, _parent, _scopeId));
														_push(` Als CSV exportieren </a>`);
													} else return [(0, vue_exports.createVNode)("a", {
														class: "adm-menu__item",
														href: __props.exportUrl,
														download: ""
													}, [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "export",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Als CSV exportieren ")], 8, ["href"])];
												}),
												_: 1
											}, _parent, _scopeId));
											else _push(`<!---->`);
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "adm-menu__item",
												onSelect: print
											}, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) {
														_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
															name: "print",
															size: 20
														}, null, _parent, _scopeId));
														_push(` Als PDF drucken `);
													} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "print",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Als PDF drucken ")];
												}),
												_: 1
											}, _parent, _scopeId));
										} else return [__props.exportUrl ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
											key: 0,
											"as-child": ""
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
												class: "adm-menu__item",
												href: __props.exportUrl,
												download: ""
											}, [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "export",
												size: 20
											}), (0, vue_exports.createTextVNode)(" Als CSV exportieren ")], 8, ["href"])]),
											_: 1
										})) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
											class: "adm-menu__item",
											onSelect: print
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "print",
												size: 20
											}), (0, vue_exports.createTextVNode)(" Als PDF drucken ")]),
											_: 1
										})];
									}),
									_: 1
								}, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
									class: "adm-menu",
									align: "end",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)(() => [__props.exportUrl ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
										key: 0,
										"as-child": ""
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
											class: "adm-menu__item",
											href: __props.exportUrl,
											download: ""
										}, [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "export",
											size: 20
										}), (0, vue_exports.createTextVNode)(" Als CSV exportieren ")], 8, ["href"])]),
										_: 1
									})) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
										class: "adm-menu__item",
										onSelect: print
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "print",
											size: 20
										}), (0, vue_exports.createTextVNode)(" Als PDF drucken ")]),
										_: 1
									})]),
									_: 1
								})];
							}),
							_: 1
						}, _parent, _scopeId));
					} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
						class: "adm-iconbtn",
						"aria-label": "Weitere Aktionen"
					}, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
							name: "more",
							size: 20
						})]),
						_: 1
					}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
							class: "adm-menu",
							align: "end",
							"side-offset": 8
						}, {
							default: (0, vue_exports.withCtx)(() => [__props.exportUrl ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
								key: 0,
								"as-child": ""
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
									class: "adm-menu__item",
									href: __props.exportUrl,
									download: ""
								}, [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "export",
									size: 20
								}), (0, vue_exports.createTextVNode)(" Als CSV exportieren ")], 8, ["href"])]),
								_: 1
							})) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
								class: "adm-menu__item",
								onSelect: print
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "print",
									size: 20
								}), (0, vue_exports.createTextVNode)(" Als PDF drucken ")]),
								_: 1
							})]),
							_: 1
						})]),
						_: 1
					})];
				}),
				_: 1
			}, _parent));
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Dashboard/PeriodSwitcher.vue
var _sfc_setup$1 = PeriodSwitcher_vue_vue_type_script_setup_true_lang_default.setup;
PeriodSwitcher_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Dashboard/PeriodSwitcher.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var PeriodSwitcher_default = /*#__PURE__*/ _plugin_vue_export_helper_default(PeriodSwitcher_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-9fc9ab38"]]);
//#endregion
//#region resources/js/Components/Admin/Dashboard/StateChip.vue?vue&type=script&setup=true&lang.ts
var StateChip_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "StateChip",
	__ssrInlineRender: true,
	props: {
		label: {},
		tone: {}
	},
	setup(__props) {
		/**
		* A state in the Übersicht's tables, by the list rule: an ordinary state is plain text („bezahlt“,
		* „versandt“), and only an exception wears a chip with a dot, in the status palette (`warn`, `bad`) —
		* never a verdict's chart colour; the word carries the meaning, the dot only repeats it. A column of
		* chips on every row says nothing; one chip among plain words is read. Nothing to say (tone `none`:
		* „noch nicht versandt“, „entfällt“) is quiet text.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			if (__props.label === "–") _push(`<span${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "chip-none" }, _attrs))} data-v-9ffa7f43><span aria-hidden="true" data-v-9ffa7f43>–</span><span class="visually-hidden" data-v-9ffa7f43>nichts zu tun</span></span>`);
			else if (__props.tone === "warn" || __props.tone === "bad") _push(`<span${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["chip", `chip--${__props.tone}`] }, _attrs))} data-v-9ffa7f43><span class="chip__dot" aria-hidden="true" data-v-9ffa7f43></span> ${(0, server_renderer_exports.ssrInterpolate)(__props.label)}</span>`);
			else _push(`<span${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: __props.tone === "plain" ? "chip-plain" : "chip-none" }, _attrs))} data-v-9ffa7f43>${(0, server_renderer_exports.ssrInterpolate)(__props.label)}</span>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Dashboard/StateChip.vue
var _sfc_setup = StateChip_vue_vue_type_script_setup_true_lang_default.setup;
StateChip_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Dashboard/StateChip.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var StateChip_default = /*#__PURE__*/ _plugin_vue_export_helper_default(StateChip_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-9ffa7f43"]]);
//#endregion
export { PeriodSwitcher_default as n, StateChip_default as t };
