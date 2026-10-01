import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-CUJcjiDR.js";
import { t as decimal } from "./format-B7xaqJ38.js";
//#region resources/js/Pages/Admin/Rollen/RoleDiffList.vue?vue&type=script&setup=true&lang.ts
var RoleDiffList_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "RoleDiffList",
	__ssrInlineRender: true,
	props: {
		diff: {},
		roleLabel: {}
	},
	setup(__props) {
		/**
		* What saving would change, before it is saved (BRIEF.md §2): the rights a role gains and the ones
		* it loses, each named the way the grid names it — "Katalog · Löschen" — and nothing else. The
		* count in the summary is the list's own length, never an estimate.
		*/
		const props = __props;
		function rights(n) {
			return `${decimal(n, 0)} ${n === 1 ? "Recht" : "Rechte"}`;
		}
		const summary = (0, vue_exports.computed)(() => {
			const gained = props.diff.gained.length;
			const lost = props.diff.lost.length;
			const who = `„${props.roleLabel}“`;
			if (gained > 0 && lost > 0) return `${who} bekommt ${rights(gained)} dazu und verliert ${rights(lost)}.`;
			return gained > 0 ? `${who} bekommt ${rights(gained)} dazu.` : `${who} verliert ${rights(lost)}.`;
		});
		const empty = (0, vue_exports.computed)(() => props.diff.gained.length === 0 && props.diff.lost.length === 0);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "rol-diff" }, _attrs))} data-v-120eefbf>`);
			if (empty.value) _push(`<p class="adm-note" data-v-120eefbf>Es ändert sich nichts: „${(0, server_renderer_exports.ssrInterpolate)(__props.roleLabel)}“ hat schon genau diese Rechte.</p>`);
			else {
				_push(`<!--[--><p class="rol-diff__sum" data-v-120eefbf>${(0, server_renderer_exports.ssrInterpolate)(summary.value)}</p>`);
				if (__props.diff.gained.length) {
					_push(`<div class="rol-diff__block" data-v-120eefbf><h3 class="rol-diff__title" data-v-120eefbf>Kommt dazu</h3><ul class="rol-diff__list" data-v-120eefbf><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.diff.gained, (change) => {
						_push(`<li class="rol-diff__item" data-v-120eefbf>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							class: "rol-diff__gain",
							name: "plus",
							size: 16
						}, null, _parent));
						_push(` ${(0, server_renderer_exports.ssrInterpolate)(change.label)}</li>`);
					});
					_push(`<!--]--></ul></div>`);
				} else _push(`<!---->`);
				if (__props.diff.lost.length) {
					_push(`<div class="rol-diff__block" data-v-120eefbf><h3 class="rol-diff__title" data-v-120eefbf>Fällt weg</h3><ul class="rol-diff__list" data-v-120eefbf><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.diff.lost, (change) => {
						_push(`<li class="rol-diff__item" data-v-120eefbf>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							class: "rol-diff__loss",
							name: "minus",
							size: 16
						}, null, _parent));
						_push(` ${(0, server_renderer_exports.ssrInterpolate)(change.label)}</li>`);
					});
					_push(`<!--]--></ul></div>`);
				} else _push(`<!---->`);
				_push(`<!--]-->`);
			}
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Rollen/RoleDiffList.vue
var RoleDiffList_exports = /* @__PURE__ */ __exportAll({ default: () => RoleDiffList_default });
var _sfc_setup = RoleDiffList_vue_vue_type_script_setup_true_lang_default.setup;
RoleDiffList_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Rollen/RoleDiffList.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var RoleDiffList_default = /*#__PURE__*/ _plugin_vue_export_helper_default(RoleDiffList_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-120eefbf"]]);
//#endregion
export { RoleDiffList_exports as n, RoleDiffList_default as t };
