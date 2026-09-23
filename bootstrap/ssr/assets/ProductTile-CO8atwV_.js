import { c as vue_exports, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import "./useShared-B1ZdimaV.js";
import { a as Picture_default, i as WheelOutline_default, r as useCompare } from "./useShortcuts-DQyB2dUf.js";
import { n as VerdictBadge_default, t as compareKeyOf } from "./rimify-CDsi0i0x.js";
import { a as zoll, n as euro } from "./format--h649JLD.js";
//#region resources/js/Components/Ui/ProductTile.vue?vue&type=script&setup=true&lang.ts
var ProductTile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ProductTile",
	__ssrInlineRender: true,
	props: {
		card: {},
		vehicle: { default: null },
		eager: {
			type: Boolean,
			default: false
		},
		compare: {
			type: Boolean,
			default: false
		},
		sizes: { default: "(min-width: 1280px) 306px, (min-width: 1024px) 22vw, (min-width: 768px) 30vw, 62vw" }
	},
	setup(__props) {
		/**
		* The product card, v2 (docs/design/sections/home-overhaul.md §1): one card everywhere a wheel is
		* listed. It shows the wheel as an object, names it, prices it per wheel with its legal line,
		* states the verdict when a vehicle is known, and offers one action — *Details ansehen*, the
		* card's only link, stretched over the whole card. The compare checkbox sits after it in the DOM,
		* above the stretched link, so a keyboard reaches the CTA and then the checkbox.
		*
		* With a vehicle chosen, the engine's verdict sits in the image corner, and a `CONDITIONAL`
		* verdict brings its Auflagen with it as sentences (R-15). Without a vehicle, no compatibility
		* claim is made at all. A size no document permits on the car is greyed and named as such for
		* assistive technology — never struck.
		*
		* The cut-out comes from the catalogue. When there is none, or it fails to load, the flat
		* technical drawing stands in without a caption — never a stock photo, never a drawing dressed
		* as one — and the card says so in `data-fallback` for the page gate that counts them.
		*/
		const props = __props;
		const href = (0, vue_exports.computed)(() => `/felgen/${props.card.slug}?ausfuehrung=${props.card.finishId}`);
		const fullName = (0, vue_exports.computed)(() => `${props.card.brandName} ${props.card.modelName} ${props.card.finishName}`);
		const failed = (0, vue_exports.ref)(false);
		(0, vue_exports.watch)(() => props.card.image, () => {
			failed.value = false;
		});
		const photo = (0, vue_exports.computed)(() => props.card.image && !failed.value ? props.card.image : null);
		const alt = (0, vue_exports.computed)(() => `${props.card.brandName} ${props.card.modelName} in ${props.card.finishName}, Ansicht von vorn`);
		const hoverView = (0, vue_exports.computed)(() => photo.value?.views?.[0] ?? null);
		const verdict = (0, vue_exports.computed)(() => {
			if (props.vehicle === null || props.card.fitment === null) return null;
			const { status = "PERMITTED", requiresEntry, conditions = [] } = props.card.fitment;
			const effective = status === "PERMITTED" && requiresEntry ? "CONDITIONAL" : status;
			return {
				status: effective,
				conditions: effective === "CONDITIONAL" ? conditions : []
			};
		});
		/** With a vehicle and the server's subset, each size knows whether a document permits it. */
		const sizedByVehicle = (0, vue_exports.computed)(() => props.vehicle !== null && Array.isArray(props.card.diametersFitting));
		const sizeList = (0, vue_exports.computed)(() => {
			const fitting = new Set(props.card.diametersFitting ?? []);
			return props.card.diameters.map((label) => ({
				label,
				none: sizedByVehicle.value && !fitting.has(label)
			}));
		});
		const sizesPlain = (0, vue_exports.computed)(() => props.card.diameters.length ? zoll(props.card.diameters) : "");
		const perWheel = (0, vue_exports.computed)(() => euro(Math.round(props.card.fromPriceCents / 4)));
		const store = props.compare ? useCompare() : null;
		const key = (0, vue_exports.computed)(() => compareKeyOf(props.card));
		const inCompare = (0, vue_exports.computed)(() => store?.has(key.value) ?? false);
		/** At the cap and not ticked: the input is disabled and the label explains through the toast. */
		const capped = (0, vue_exports.computed)(() => (store?.isFull ?? false) && !inCompare.value);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<article${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "tile",
				"data-demo": __props.card.isDemo ? "true" : void 0,
				"data-fallback": photo.value ? void 0 : "true"
			}, _attrs))} data-v-8a133b91><div class="tile__media" data-v-8a133b91>`);
			if (photo.value) _push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
				image: photo.value,
				alt: alt.value,
				sizes: __props.sizes,
				eager: __props.eager,
				class: "tile__picture"
			}, null, _parent));
			else _push((0, server_renderer_exports.ssrRenderComponent)(WheelOutline_default, {
				spokes: __props.card.art.spokes,
				size: "60%"
			}, null, _parent));
			if (hoverView.value) _push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
				image: hoverView.value,
				alt: "",
				sizes: __props.sizes,
				class: "tile__picture tile__media--alt",
				"aria-hidden": "true"
			}, null, _parent));
			else _push(`<!---->`);
			if (verdict.value) _push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, {
				status: verdict.value.status,
				class: "tile__badge"
			}, null, _parent));
			else _push(`<!---->`);
			_push(`</div><span class="tile__brand" data-v-8a133b91>${(0, server_renderer_exports.ssrInterpolate)(__props.card.brandName)}</span><h3 class="tile__title" data-v-8a133b91><span class="tile__name" data-v-8a133b91>${(0, server_renderer_exports.ssrInterpolate)(__props.card.modelName)}</span></h3><span class="tile__meta" data-v-8a133b91><span class="tile__finish" data-v-8a133b91>${(0, server_renderer_exports.ssrInterpolate)(__props.card.finishName)}</span>`);
			if (__props.card.diameters.length) _push(`<span class="tile__sep" aria-hidden="true" data-v-8a133b91> · </span>`);
			else _push(`<!---->`);
			if (sizedByVehicle.value && __props.card.diameters.length) {
				_push(`<span class="tile__sizes num" data-v-8a133b91><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(sizeList.value, (size, i) => {
					_push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(i > 0 ? " · " : "")}<span class="${(0, server_renderer_exports.ssrRenderClass)({ "tile__size--none": size.none })}" data-v-8a133b91>${(0, server_renderer_exports.ssrInterpolate)(size.label)}`);
					if (size.none) _push(`<span class="visually-hidden" data-v-8a133b91> (keine Freigabe für dein Fahrzeug)</span>`);
					else _push(`<!---->`);
					_push(`</span><!--]-->`);
				});
				_push(`<!--]-->${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(" "))}Zoll</span>`);
			} else if (sizesPlain.value) _push(`<span class="tile__sizes num" data-v-8a133b91>${(0, server_renderer_exports.ssrInterpolate)(sizesPlain.value)}</span>`);
			else _push(`<!---->`);
			_push(`</span><p class="tile__price" data-v-8a133b91>ab ${(0, server_renderer_exports.ssrInterpolate)(perWheel.value)} <small data-v-8a133b91>pro Felge</small></p><span class="tile__legal" data-v-8a133b91>inkl. MwSt., zzgl. Versand</span>`);
			if (verdict.value && verdict.value.conditions.length) {
				_push(`<ul class="tile__conditions" data-v-8a133b91><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(verdict.value.conditions, (condition) => {
					_push(`<li data-v-8a133b91>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
				});
				_push(`<!--]--></ul>`);
			} else _push(`<!---->`);
			if (!__props.card.inStock) _push(`<span class="stock stock--out" data-v-8a133b91>Ausverkauft</span>`);
			else _push(`<!---->`);
			_push(`<div class="tile__actions" data-v-8a133b91>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: href.value,
				class: "tile__cta btn btn--primary btn--sm",
				"aria-label": `${fullName.value}: Details ansehen`,
				prefetch: ""
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Details ansehen`);
					else return [(0, vue_exports.createTextVNode)("Details ansehen")];
				}),
				_: 1
			}, _parent));
			if (__props.compare) _push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "tile__compare--full": capped.value }, "tile__compare"])}" data-v-8a133b91><input type="checkbox" class="tile__compare-input" name="vergleich"${(0, server_renderer_exports.ssrRenderAttr)("value", key.value)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(inCompare.value) ? " checked" : ""}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(capped.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${fullName.value} vergleichen`)} data-v-8a133b91> Vergleichen </label>`);
			else _push(`<!---->`);
			_push(`</div></article>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/ProductTile.vue
var _sfc_setup = ProductTile_vue_vue_type_script_setup_true_lang_default.setup;
ProductTile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/ProductTile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var ProductTile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ProductTile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-8a133b91"]]);
//#endregion
export { ProductTile_default as t };
