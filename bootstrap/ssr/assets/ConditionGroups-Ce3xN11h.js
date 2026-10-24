import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Components/Fitment/ConditionGroups.vue?vue&type=script&setup=true&lang.ts
var ConditionGroups_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ConditionGroups",
	__ssrInlineRender: true,
	props: {
		groups: {},
		omit: { default: () => [] }
	},
	setup(__props) {
		/**
		* The Auflagen as the document hangs them (App\Domain\Fitment\Verdict\ConditionGroups) — the one way any page shows a
		* verdict's Auflagen: the combination's once, then each permitted tyre size with its own, under „Nur bei …“ as the
		* full wording says it (D-04). ABE 55255 gives the BMW X3 X83 fine-link snow chains on the rear axle with 235/45R19
		* and 245/40R19 and no chains at all with 255/40R19; in one list the customer would read both and believe neither.
		* With a size chosen (a Komplettrad), just what applies to it.
		*
		* Only sentences, never codes (R-15). The papers' line (Abnahme, Eintragung) stays the page's own — per size where the
		* sizes differ (fitment/papers.ts entryBySize).
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "cgroups",
				"data-condition-groups": ""
			}, _attrs))} data-v-6358b3d3>`);
			if (__props.groups.chosen) {
				_push(`<!--[--><p class="cgroups__head" data-v-6358b3d3>Für ${(0, server_renderer_exports.ssrInterpolate)(__props.groups.chosen)}</p>`);
				if (__props.groups.combination.filter((c) => !__props.omit.includes(c)).length) {
					_push(`<ul class="cgroups__list" data-v-6358b3d3><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.groups.combination.filter((c) => !__props.omit.includes(c)), (condition) => {
						_push(`<li data-v-6358b3d3>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
					});
					_push(`<!--]--></ul>`);
				} else _push(`<!---->`);
				_push(`<!--]-->`);
			} else {
				_push(`<!--[-->`);
				if (__props.groups.combination.filter((c) => !__props.omit.includes(c)).length) {
					_push(`<!--[-->`);
					if (__props.groups.sizes.length) _push(`<p class="cgroups__head" data-v-6358b3d3>Für jede zulässige Reifengröße</p>`);
					else _push(`<!---->`);
					_push(`<ul class="cgroups__list" data-v-6358b3d3><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.groups.combination.filter((c) => !__props.omit.includes(c)), (condition) => {
						_push(`<li data-v-6358b3d3>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
					});
					_push(`<!--]--></ul><!--]-->`);
				} else _push(`<!---->`);
				_push(`<!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.groups.sizes, (size) => {
					_push(`<section class="cgroups__size"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Auflagen nur bei ${size.size}`)} data-v-6358b3d3><p class="cgroups__head" data-v-6358b3d3> Nur bei <span class="data" translate="no" data-v-6358b3d3>${(0, server_renderer_exports.ssrInterpolate)(size.size)}</span> <span class="cgroups__axle" data-v-6358b3d3>· ${(0, server_renderer_exports.ssrInterpolate)(size.axle)}</span></p>`);
					if (size.conditions.filter((c) => !__props.omit.includes(c)).length) {
						_push(`<ul class="cgroups__list" data-v-6358b3d3><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(size.conditions.filter((c) => !__props.omit.includes(c)), (condition) => {
							_push(`<li data-v-6358b3d3>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
						});
						_push(`<!--]--></ul>`);
					} else _push(`<p class="cgroups__none" data-v-6358b3d3>Keine weiteren Auflagen.</p>`);
					_push(`</section>`);
				});
				_push(`<!--]--><!--]-->`);
			}
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Fitment/ConditionGroups.vue
var _sfc_setup = ConditionGroups_vue_vue_type_script_setup_true_lang_default.setup;
ConditionGroups_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Fitment/ConditionGroups.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var ConditionGroups_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ConditionGroups_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-6358b3d3"]]);
//#endregion
export { ConditionGroups_default as t };
