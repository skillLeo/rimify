import { c as vue_exports, n as head_default, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { n as revenueChartSVG, t as Svg_default } from "./Svg-Zaejjhw8.js";
import { t as AdminLayout_default } from "./AdminLayout-2mZo5V0P.js";
//#region resources/js/Components/Art/RevenueChart.vue?vue&type=script&setup=true&lang.ts
var RevenueChart_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "RevenueChart",
	__ssrInlineRender: true,
	props: {
		points: {},
		width: { default: 720 },
		height: { default: 220 }
	},
	setup(__props) {
		/** The admin dashboard revenue line. No charting library: twelve points and a shape. */
		const props = __props;
		const markup = (0, vue_exports.computed)(() => revenueChartSVG(props.points, props.width, props.height));
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Svg_default, (0, vue_exports.mergeProps)({ markup: markup.value }, _attrs), null, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Art/RevenueChart.vue
var _sfc_setup$1 = RevenueChart_vue_vue_type_script_setup_true_lang_default.setup;
RevenueChart_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Art/RevenueChart.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var RevenueChart_default = RevenueChart_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Pages/Admin/Dashboard/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		tiles: {},
		revenue: {},
		conflicts: {}
	},
	setup(__props) {
		/**
		* The dashboard: the operational figures, twelve months of revenue, and the open-conflict queue.
		*
		* Every figure is a real query (AdminDashboardController). A figure with a list behind it links
		* to that list; the others are plain, because a link to nowhere is worse than no link.
		*
		* The conflicts are here and not behind a menu because they are the one thing on this screen that
		* costs money while ignored: an unresolved disagreement is a fitment nobody can publish.
		*
		* One page for every width: the figures run 2-up on a phone, 3-up from 900px and 6-up from
		* 1440px; the chart and the queue stack until 1200px.
		*/
		const props = __props;
		const points = (0, vue_exports.computed)(() => props.revenue.map((r) => ({
			label: r.label,
			value: r.value
		})));
		/** Where a figure's underlying list lives. Only lists that exist are named. */
		const TILE_HREF = { documents: "/admin/gutachten" };
		const KIND_LABEL = {
			ENTRY_REQUIREMENT: "Eintragungspflicht",
			TYRE_SIZES: "Reifengrößen",
			WIDTH_ET_RANGE: "Breite / ET",
			CONDITIONS: "Auflagen"
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Dashboard" }, null, _parent));
			_push(`<h1 class="t-h1 dash__title" data-v-7ec2de05>Dashboard</h1><div class="metrics dash__metrics" data-v-7ec2de05><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.tiles, (tile) => {
				_push(`<!--[-->`);
				if (TILE_HREF[tile.key]) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: TILE_HREF[tile.key] ?? "",
					class: "metric dash__metric--link"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`<span class="micro" data-v-7ec2de05${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(tile.label)}</span><p class="metric__value" data-v-7ec2de05${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(tile.value)}</p>`);
						else return [(0, vue_exports.createVNode)("span", { class: "micro" }, (0, vue_exports.toDisplayString)(tile.label), 1), (0, vue_exports.createVNode)("p", { class: "metric__value" }, (0, vue_exports.toDisplayString)(tile.value), 1)];
					}),
					_: 2
				}, _parent));
				else _push(`<div class="metric" data-v-7ec2de05><span class="micro" data-v-7ec2de05>${(0, server_renderer_exports.ssrInterpolate)(tile.label)}</span><p class="metric__value" data-v-7ec2de05>${(0, server_renderer_exports.ssrInterpolate)(tile.value)}</p></div>`);
				_push(`<!--]-->`);
			});
			_push(`<!--]--></div><div class="dash__row" data-v-7ec2de05><section class="card dash__chart" aria-labelledby="dash-revenue" data-v-7ec2de05><h2 id="dash-revenue" class="t-h3" data-v-7ec2de05>Umsatz der letzten 12 Monate</h2><div class="dash__svg" data-v-7ec2de05>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(RevenueChart_default, {
				points: points.value,
				width: 720,
				height: 220
			}, null, _parent));
			_push(`</div></section><section class="card" aria-labelledby="dash-conflicts" data-v-7ec2de05><h2 id="dash-conflicts" class="t-h3" data-v-7ec2de05>Offene Konflikte</h2>`);
			if (__props.conflicts.length > 0) {
				_push(`<ul class="dash__conflicts" data-v-7ec2de05><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.conflicts, (conflict) => {
					_push(`<li class="dash__conflict" data-v-7ec2de05><div class="dash__conflict-text" data-v-7ec2de05><p class="dash__vehicle" data-v-7ec2de05>${(0, server_renderer_exports.ssrInterpolate)(conflict.vehicle)}</p><p class="data" data-v-7ec2de05>${(0, server_renderer_exports.ssrInterpolate)(conflict.keyNumbers)}</p></div><span class="${(0, server_renderer_exports.ssrRenderClass)([conflict.blocking ? "tag--danger" : "tag--warn", "tag"])}" data-v-7ec2de05>${(0, server_renderer_exports.ssrInterpolate)(KIND_LABEL[conflict.kind] ?? conflict.kind)}</span></li>`);
				});
				_push(`<!--]--></ul>`);
			} else _push(`<p class="t-body quiet dash__empty" data-v-7ec2de05>Keine offenen Konflikte.</p>`);
			_push(`</section></div><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Dashboard/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Dashboard/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-7ec2de05"]]);
//#endregion
export { Index_default as default };
