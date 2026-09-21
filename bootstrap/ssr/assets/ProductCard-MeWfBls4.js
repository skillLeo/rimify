import { n as link_default, s as vue_exports } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
import { t as ProductPhoto_default } from "./ProductPhoto-BjSB4QEk.js";
//#region resources/js/Components/Product/ProductCard.vue?vue&type=script&setup=true&lang.ts
var ProductCard_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ProductCard",
	__ssrInlineRender: true,
	props: {
		card: {},
		vehicle: { default: null }
	},
	setup(__props) {
		/**
		* The product card. Every card in a listing renders exactly these fields, in this order: frame,
		* brand, model, finish, rating, sizes, price with its legal note, fitment line, action.
		*
		* Two of those are not negotiable.
		*
		* The price carries `inkl. MwSt., zzgl. Versand` wherever it appears — the Preisangabenverordnung
		* requires it next to the price, not once in a footer.
		*
		* The fitment line renders ONLY when a vehicle is chosen, and it names the car. "Passend" on its
		* own means nothing; a card that claims compatibility without naming a vehicle is the exact
		* failure this product exists to prevent.
		*
		* The card is a size container: two cards side by side on a phone are about 170px wide each, and
		* the card tightens itself for that width rather than waiting for a viewport breakpoint.
		*/
		const props = __props;
		const href = (0, vue_exports.computed)(() => `/felgen/${props.card.slug}`);
		const stock = (0, vue_exports.computed)(() => props.card.inStock ? {
			label: "Auf Lager",
			cls: "tag--ok"
		} : {
			label: "Ausverkauft",
			cls: "tag--danger"
		});
		/** With a vehicle: named, and honest about whether the papers need an entry. */
		const fitment = (0, vue_exports.computed)(() => {
			if (props.vehicle === null || props.card.fitment === null) return null;
			return props.card.fitment.requiresEntry ? {
				label: `Mit Auflagen für ${props.vehicle.short}`,
				cls: "is-warn",
				icon: "warning"
			} : {
				label: `Passend für ${props.vehicle.short}`,
				cls: "is-ok",
				icon: "check"
			};
		});
		const rating = (0, vue_exports.computed)(() => {
			if (props.card.rating === null || props.card.ratingCount <= 0) return null;
			const value = props.card.rating.toFixed(1).replace(".", ",");
			return {
				short: `${value} (${props.card.ratingCount})`,
				spoken: `${value} von 5 Sternen, ${props.card.ratingCount} Bewertungen`
			};
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<article${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "pcard" }, _attrs))} data-v-0ac46e33><div class="well" data-v-0ac46e33><span class="${(0, server_renderer_exports.ssrRenderClass)([stock.value.cls, "well__tag tag"])}" data-v-0ac46e33>${(0, server_renderer_exports.ssrInterpolate)(stock.value.label)}</span>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(ProductPhoto_default, {
				spokes: __props.card.art.spokes,
				finish: __props.card.art.finish,
				size: 320
			}, null, _parent));
			_push(`</div><span class="micro pcard__brand" data-v-0ac46e33>${(0, server_renderer_exports.ssrInterpolate)(__props.card.brandName)}</span><h3 class="pcard__model" data-v-0ac46e33>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: href.value,
				class: "pcard__link"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(__props.card.modelName)}`);
					else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.card.modelName), 1)];
				}),
				_: 1
			}, _parent));
			_push(`</h3><p class="pcard__finish" data-v-0ac46e33>${(0, server_renderer_exports.ssrInterpolate)(__props.card.finishName)}</p>`);
			if (rating.value) _push(`<p class="stars pcard__rating"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", rating.value.spoken)} data-v-0ac46e33><span class="stars__glyph" aria-hidden="true" data-v-0ac46e33>★</span><span class="tabular" aria-hidden="true" data-v-0ac46e33>${(0, server_renderer_exports.ssrInterpolate)(rating.value.short)}</span></p>`);
			else _push(`<!---->`);
			if (__props.card.diameters.length) {
				_push(`<div class="pcard__sizes" data-v-0ac46e33><span class="micro" data-v-0ac46e33>Größen in Zoll</span><div class="chip-row pcard__chips" data-v-0ac46e33><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.card.diameters, (size) => {
					_push(`<span class="chip chip--static" data-v-0ac46e33>${(0, server_renderer_exports.ssrInterpolate)(size)}</span>`);
				});
				_push(`<!--]--></div></div>`);
			} else _push(`<!---->`);
			_push(`<hr class="pcard__divider" data-v-0ac46e33><div class="pcard__price" data-v-0ac46e33><p class="price" data-v-0ac46e33><span class="pcard__from" data-v-0ac46e33>ab</span> ${(0, server_renderer_exports.ssrInterpolate)(__props.card.fromPrice)}</p><p class="price-note" data-v-0ac46e33>für 4 Felgen, inkl. MwSt., zzgl. Versand</p></div>`);
			if (fitment.value) {
				_push(`<p class="${(0, server_renderer_exports.ssrRenderClass)([fitment.value.cls, "pcard__fitment"])}" data-v-0ac46e33>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: fitment.value.icon,
					size: 20
				}, null, _parent));
				_push(` ${(0, server_renderer_exports.ssrInterpolate)(fitment.value.label)}</p>`);
			} else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: href.value,
				class: "btn btn--secondary btn--block btn--sm pcard__action"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(` Details `);
					else return [(0, vue_exports.createTextVNode)(" Details ")];
				}),
				_: 1
			}, _parent));
			_push(`</article>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/ProductCard.vue
var _sfc_setup = ProductCard_vue_vue_type_script_setup_true_lang_default.setup;
ProductCard_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/ProductCard.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var ProductCard_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ProductCard_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-0ac46e33"]]);
//#endregion
export { ProductCard_default as t };
