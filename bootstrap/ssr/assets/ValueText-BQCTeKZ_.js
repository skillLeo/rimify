import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { s as withUnit } from "./format-6R0uUMt3.js";
`${withUnit(10, "%")}${withUnit(4, "km/h")}`;
withUnit(100, "km/h");
var VALUE = /\d{3}\/\d{2}\s?R\d{2}|ET\s[−-]?\d+|[+−±]?\d+(?:[.,]\d+)*(?:J|\s(?:mm|km\/h|%|Zoll|kg))?/gu;
/** Splits a sentence into prose and figures, in order; joined, the parts are the sentence again. */
function valueParts(text) {
	const parts = [];
	let last = 0;
	for (const match of text.matchAll(VALUE)) {
		const at = match.index ?? 0;
		if (at > last) parts.push({
			text: text.slice(last, at),
			value: false
		});
		parts.push({
			text: match[0],
			value: true
		});
		last = at + match[0].length;
	}
	if (last < text.length) parts.push({
		text: text.slice(last),
		value: false
	});
	return parts;
}
//#endregion
//#region resources/js/Components/Ui/ValueText.vue?vue&type=script&setup=true&lang.ts
var ValueText_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ValueText",
	__ssrInlineRender: true,
	props: {
		text: {},
		whole: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* The one place the storefront tells the browser's translator to keep its hands off a value.
		* Chrome's page translation once read "5,5 J" as "5.5 years" and "Zoll" as "Customs".
		*
		* Two shapes, one component:
		*
		* - `<ValueText :text="sentence" />` — a line of German prose whose figures must survive: every
		*   value with a unit or a technical code (`8,5J`, `ET 45`, `225/45 R17`, `23 mm`, `+0,91 %`,
		*   `100,9 km/h`) is wrapped in a `translate="no"` span and the words around it stay translatable.
		* - `<ValueText :text="value" whole />` — the string is nothing but a value or a name
		*   (`66,6 mm`, `189,00 €`, `Bergsteig Gipfel`): it is wrapped whole, in one span.
		*
		* A figure never breaks across a line. Where the element that holds the value exists already and
		* holds nothing else — a spec cell, a size chip, the hero's spec line — that element carries
		* `translate="no"` itself and no span is added.
		*/
		const props = __props;
		const parts = (0, vue_exports.computed)(() => {
			if (props.whole) return [{
				text: props.text,
				value: true
			}];
			const out = valueParts(props.text).map((part) => ({ ...part }));
			out.forEach((part, i) => {
				if (!part.value) return;
				const before = out[i - 1];
				const after = out[i + 1];
				if (before !== void 0 && !before.value && / $/.test(before.text)) {
					before.text = before.text.slice(0, -1);
					part.text = ` ${part.text}`;
				}
				if (after !== void 0 && !after.value && /^ /.test(after.text)) {
					after.text = after.text.slice(1);
					part.text = `${part.text} `;
				}
			});
			return out.filter((part) => part.text !== "");
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(parts.value, (part, i) => {
				_push(`<!--[-->`);
				if (part.value) _push(`<span class="value" translate="no" data-v-0297347d>${(0, server_renderer_exports.ssrInterpolate)(part.text)}</span>`);
				else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(part.text)}<!--]-->`);
				_push(`<!--]-->`);
			});
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/ValueText.vue
var _sfc_setup = ValueText_vue_vue_type_script_setup_true_lang_default.setup;
ValueText_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/ValueText.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var ValueText_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ValueText_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-0297347d"]]);
//#endregion
export { ValueText_default as t };
