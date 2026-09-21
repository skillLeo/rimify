import { n as link_default, r as useForm, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
import { r as useShared } from "./useShared-Cs__JTYP.js";
import { t as AppLayout_default } from "./AppLayout-D56ynLLu.js";
import { t as ProductPhoto_default } from "./ProductPhoto-BjSB4QEk.js";
//#region resources/js/Components/Product/FitmentPanel.vue?vue&type=script&setup=true&lang.ts
var FitmentPanel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "FitmentPanel",
	__ssrInlineRender: true,
	props: {
		verdict: {},
		vehicle: {}
	},
	setup(__props) {
		/**
		* The RIMIFY-CHECK panel, at panel density.
		*
		* It ALWAYS names the vehicle. `Passend` on its own is meaningless — the entire claim of this
		* product is that the answer is about one specific car, and a panel that omits the car has thrown
		* that away.
		*
		* Four states, and `UNKNOWN` is not dressed as a refusal: "we hold no document" and "the document
		* does not cover this" are different facts, and only one of them is about the customer's car.
		*/
		const props = __props;
		const tone = (0, vue_exports.computed)(() => {
			if (props.vehicle === null || props.verdict === null) return {
				cls: "rcheck-panel--unknown",
				icon: "info"
			};
			switch (props.verdict.status) {
				case "PERMITTED": return {
					cls: "",
					icon: "check-circle"
				};
				case "CONDITIONAL": return {
					cls: "rcheck-panel--warn",
					icon: "warning"
				};
				case "NOT_PERMITTED": return {
					cls: "rcheck-panel--danger",
					icon: "close"
				};
				default: return {
					cls: "rcheck-panel--unknown",
					icon: "info"
				};
			}
		});
		const headline = (0, vue_exports.computed)(() => {
			if (props.vehicle === null) return "Noch kein Fahrzeug gewählt.";
			if (props.verdict === null) return `Prüfung für ${props.vehicle.label}`;
			switch (props.verdict.status) {
				case "PERMITTED": return `Freigegeben für ${props.vehicle.label}`;
				case "CONDITIONAL": return `Mit Auflagen freigegeben für ${props.vehicle.label}`;
				case "NOT_PERMITTED": return `Nicht freigegeben für ${props.vehicle.label}`;
				default: return `Keine Freigabe hinterlegt für ${props.vehicle.label}`;
			}
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["rcheck-panel", tone.value.cls] }, _attrs))} data-v-8a5dc0af><p class="rcheck-panel__head" data-v-8a5dc0af>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: tone.value.icon,
				size: 20
			}, null, _parent));
			_push(` RIMIFY-CHECK </p><p class="rcheck-panel__vehicle" data-v-8a5dc0af>${(0, server_renderer_exports.ssrInterpolate)(headline.value)}</p>`);
			if (__props.verdict) {
				_push(`<!--[--><p class="fit__entry" data-v-8a5dc0af>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.requiresEntry ? "Eintragung in die Fahrzeugpapiere erforderlich." : "Keine Eintragung erforderlich.")}</p>`);
				if (__props.verdict.entryNoteDe) _push(`<p class="quiet fit__note" data-v-8a5dc0af>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.entryNoteDe)}</p>`);
				else _push(`<!---->`);
				if (__props.verdict.conditions.length) {
					_push(`<ul class="fit__conditions" data-v-8a5dc0af><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.verdict.conditions, (condition) => {
						_push(`<li data-v-8a5dc0af>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
					});
					_push(`<!--]--></ul>`);
				} else _push(`<!---->`);
				if (__props.verdict.tyreSizes.length) _push(`<div class="fit__tyres" data-v-8a5dc0af><span class="micro" data-v-8a5dc0af>Passende Reifengrößen</span><p class="data" data-v-8a5dc0af>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.tyreSizes.join(" · "))}</p></div>`);
				else _push(`<!---->`);
				if (__props.verdict.reason) _push(`<p class="fit__reason" data-v-8a5dc0af>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.reason)}</p>`);
				else _push(`<!---->`);
				if (__props.verdict.document) {
					_push(`<p class="fit__doc" data-v-8a5dc0af>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "document",
						size: 20
					}, null, _parent));
					_push(`<span class="data" data-v-8a5dc0af>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.document.issuer)} · ${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.document.number)}</span></p>`);
				} else _push(`<!---->`);
				_push(`<!--]-->`);
			} else if (__props.vehicle === null) _push(`<p class="quiet fit__note" data-v-8a5dc0af> Ohne Fahrzeug können wir keine Freigabe bestätigen. </p>`);
			else _push(`<!---->`);
			(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent);
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/FitmentPanel.vue
var _sfc_setup$1 = FitmentPanel_vue_vue_type_script_setup_true_lang_default.setup;
FitmentPanel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/FitmentPanel.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var FitmentPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FitmentPanel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-8a5dc0af"]]);
//#endregion
//#region resources/js/composables/useConfigurator.ts
/**
* The product configurator.
*
* Two rules, and both are the difference between a shop and a compliance tool:
*
* 1. Configuration NARROWS, it never rejects. A size that exists but is not permitted on the
*    chosen car is shown, disabled, with the reason — hiding it would let the customer believe the
*    wheel is not made in that size, which is a different and false statement.
*
* 2. Price, stock and verdict change in ONE commit. They come from the same config object, so
*    there is no frame in which the page shows a new price beside an old legal answer. That frame
*    is short, and it is exactly the kind of thing that ends up in a screenshot.
*/
function useConfigurator(configs, firstFinishId) {
	const finishId = (0, vue_exports.ref)(firstFinishId);
	const configId = (0, vue_exports.ref)(null);
	const forFinish = (0, vue_exports.computed)(() => configs().filter((c) => c.finishId === finishId.value));
	const sizes = (0, vue_exports.computed)(() => {
		const seen = /* @__PURE__ */ new Map();
		for (const config of forFinish.value) {
			if (seen.has(config.diameterIn)) continue;
			const verdict = config.verdict;
			const blocked = verdict !== null && !verdict.sellable;
			seen.set(config.diameterIn, {
				diameter: config.diameterIn,
				label: String(config.diameterIn).replace(".", ","),
				config,
				blocked,
				reason: blocked ? verdict.reason ?? "Für Ihr Fahrzeug nicht freigegeben." : null
			});
		}
		return [...seen.values()].sort((a, b) => a.diameter - b.diameter);
	});
	/**
	* The chosen configuration, or the best default.
	*
	* The default is the cheapest size that is actually permitted — never simply the first, which
	* on a car with a narrow approval would open the page on a disabled chip and a blocked button.
	*/
	const selected = (0, vue_exports.computed)(() => {
		const explicit = forFinish.value.find((c) => c.id === configId.value);
		if (explicit) return explicit;
		return forFinish.value.filter((c) => c.verdict === null || c.verdict.sellable).sort((a, b) => a.priceCents - b.priceCents)[0] ?? forFinish.value[0] ?? null;
	});
	const fromPrice = (0, vue_exports.computed)(() => {
		return [...forFinish.value].sort((a, b) => a.priceCents - b.priceCents)[0]?.price ?? null;
	});
	function selectFinish(id) {
		finishId.value = id;
		configId.value = null;
	}
	function selectSize(option) {
		if (option.blocked) return;
		configId.value = option.config.id;
	}
	return {
		finishId,
		configId,
		selected,
		sizes,
		fromPrice,
		selectFinish,
		selectSize
	};
}
//#endregion
//#region resources/js/Pages/Produkt/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		product: {},
		finishes: {},
		configs: {},
		hasVehicle: { type: Boolean }
	},
	setup(__props) {
		/**
		* The product page.
		*
		* Two rules govern it. Configuration NARROWS but never rejects: a size that exists but is not
		* permitted on the chosen car is shown, struck through, with the reason — hiding it would let the
		* customer believe the wheel is not made in that size. And price, stock and verdict change in ONE
		* commit when a size is chosen; they come from the same config object, so there is no frame in
		* which a new price sits beside an old legal answer.
		*
		* The verdict sits directly above the basket button, never beside or below it: the legal status is
		* never separated from the control that acts on it.
		*
		* On a phone the price and the button follow the customer down the page once the main button has
		* scrolled away — the one persistent bar the storefront uses, because it is the page's next action.
		*/
		const props = __props;
		const shared = useShared();
		const config = useConfigurator(() => props.configs, props.finishes[0]?.id ?? 0);
		const finish = (0, vue_exports.computed)(() => props.finishes.find((f) => f.id === config.finishId.value) ?? null);
		const selected = (0, vue_exports.computed)(() => config.selected.value);
		const basket = useForm({
			kind: "WHEEL",
			wheelConfigId: 0,
			tyreVariantId: null,
			quantity: 4
		});
		const canBuy = (0, vue_exports.computed)(() => {
			const current = selected.value;
			if (current === null || !current.inStock) return false;
			return current.verdict === null || current.verdict.sellable;
		});
		const buyLabel = (0, vue_exports.computed)(() => {
			if (basket.processing) return "Wird hinzugefügt …";
			if (selected.value !== null && !selected.value.inStock) return "Ausverkauft";
			return "In den Warenkorb";
		});
		const weight = (0, vue_exports.computed)(() => {
			const grams = selected.value?.weightG;
			return grams === null || grams === void 0 ? null : `${(grams / 1e3).toFixed(1).replace(".", ",")} kg`;
		});
		const buyButton = (0, vue_exports.ref)(null);
		const buyVisible = (0, vue_exports.ref)(true);
		let observer = null;
		(0, vue_exports.onMounted)(() => {
			if (buyButton.value === null || typeof IntersectionObserver === "undefined") return;
			observer = new IntersectionObserver(([entry]) => {
				buyVisible.value = entry?.isIntersecting ?? true;
			});
			observer.observe(buyButton.value);
		});
		(0, vue_exports.onBeforeUnmount)(() => observer?.disconnect());
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: `${__props.product.brandName} ${__props.product.modelName}` }, null, _parent));
			_push(`<section class="section-dense" data-v-ccb551e0><div class="wrap" data-v-ccb551e0><nav class="pdp__crumbs t-small" aria-label="Brotkrumen" data-v-ccb551e0>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Startseite`);
					else return [(0, vue_exports.createTextVNode)("Startseite")];
				}),
				_: 1
			}, _parent));
			_push(`<span aria-hidden="true" data-v-ccb551e0>/</span>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/felgen" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Felgen`);
					else return [(0, vue_exports.createTextVNode)("Felgen")];
				}),
				_: 1
			}, _parent));
			_push(`<span aria-hidden="true" data-v-ccb551e0>/</span><span aria-current="page" data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(__props.product.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(__props.product.modelName)}</span></nav><div class="pdp" data-v-ccb551e0><div class="pdp__gallery" data-v-ccb551e0><div class="well pdp__well" data-v-ccb551e0>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(ProductPhoto_default, {
				spokes: __props.product.spokes,
				finish: finish.value?.artFinish ?? "graphite",
				size: 560
			}, null, _parent));
			_push(`</div>`);
			if (__props.finishes.length > 1) {
				_push(`<div class="pdp__thumbs" role="group" aria-label="Ausführung" data-v-ccb551e0><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.finishes, (item) => {
					_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pdp__thumb--on": item.id === (0, vue_exports.unref)(config).finishId.value }, "pdp__thumb"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", item.id === (0, vue_exports.unref)(config).finishId.value)}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", item.name)} data-v-ccb551e0>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(ProductPhoto_default, {
						spokes: __props.product.spokes,
						finish: item.artFinish,
						size: 96,
						note: false
					}, null, _parent));
					_push(`</button>`);
				});
				_push(`<!--]--></div>`);
			} else _push(`<!---->`);
			_push(`</div><div class="pdp__buy" data-v-ccb551e0><span class="micro" data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(__props.product.brandName)}</span><h1 class="t-h1 pdp__title" data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(__props.product.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(__props.product.modelName)}</h1>`);
			if (__props.product.typeDesignation) _push(`<p class="data" data-v-ccb551e0>Typ ${(0, server_renderer_exports.ssrInterpolate)(__props.product.typeDesignation)}</p>`);
			else _push(`<!---->`);
			if (__props.product.rating !== null && __props.product.ratingCount > 0) _push(`<p class="stars pdp__rating" data-v-ccb551e0><span class="stars__glyph" aria-hidden="true" data-v-ccb551e0>★</span><span class="tabular" data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(__props.product.ratingLabel)}</span></p>`);
			else _push(`<!---->`);
			_push(`<div class="pdp__block" data-v-ccb551e0><span class="micro" data-v-ccb551e0>Farbe · ${(0, server_renderer_exports.ssrInterpolate)(finish.value?.name)}</span><div class="pdp__swatches" data-v-ccb551e0><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.finishes, (item) => {
				_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pdp__swatch--on": item.id === (0, vue_exports.unref)(config).finishId.value }, "pdp__swatch"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", item.id === (0, vue_exports.unref)(config).finishId.value)} data-v-ccb551e0><span class="pdp__dot" style="${(0, server_renderer_exports.ssrRenderStyle)(item.hex ? { "--swatch": item.hex } : void 0)}" data-v-ccb551e0></span> ${(0, server_renderer_exports.ssrInterpolate)(item.name)}</button>`);
			});
			_push(`<!--]--></div></div><div class="pdp__block" data-v-ccb551e0><span class="micro" data-v-ccb551e0>Durchmesser (Zoll)</span><div class="chip-row pdp__chips" data-v-ccb551e0><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(config).sizes.value, (size) => {
				_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{
					"chip--on": selected.value?.id === size.config.id,
					"chip--blocked": size.blocked
				}, "chip"])}" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(size.blocked) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", selected.value?.id === size.config.id)}${(0, server_renderer_exports.ssrRenderAttr)("title", size.reason ?? void 0)} data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(size.label)}</button>`);
			});
			_push(`<!--]--></div>`);
			if ((0, vue_exports.unref)(config).sizes.value.some((s) => s.blocked)) _push(`<p class="t-small quiet pdp__note" data-v-ccb551e0> Durchgestrichene Größen sind für dein Fahrzeug nicht freigegeben. </p>`);
			else _push(`<!---->`);
			_push(`</div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(FitmentPanel_default, {
				class: "pdp__fit",
				verdict: selected.value?.verdict ?? null,
				vehicle: (0, vue_exports.unref)(shared).vehicle
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (!__props.hasVehicle) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: "/felgen-suchen",
							class: "btn btn--secondary btn--sm pdp__fit-cta"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(` Fahrzeug wählen `);
								else return [(0, vue_exports.createTextVNode)(" Fahrzeug wählen ")];
							}),
							_: 1
						}, _parent, _scopeId));
						else _push(`<!---->`);
					} else return [!__props.hasVehicle ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
						key: 0,
						href: "/felgen-suchen",
						class: "btn btn--secondary btn--sm pdp__fit-cta"
					}, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)(" Fahrzeug wählen ")]),
						_: 1
					})) : (0, vue_exports.createCommentVNode)("", true)];
				}),
				_: 1
			}, _parent));
			_push(`<div class="pdp__price" data-v-ccb551e0><p class="price price--lg" data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(selected.value?.price ?? (0, vue_exports.unref)(config).fromPrice.value)}</p><p class="price-note" data-v-ccb551e0>für 4 Felgen, inkl. MwSt., zzgl. Versand</p><span class="${(0, server_renderer_exports.ssrRenderClass)([selected.value?.inStock ? "tag--ok" : "tag--danger", "tag pdp__stock"])}" data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(selected.value?.inStock ? "Auf Lager" : "Ausverkauft")}</span></div><div data-v-ccb551e0><button class="btn btn--primary btn--block btn--lg pdp__add" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!canBuy.value || (0, vue_exports.unref)(basket).processing) ? " disabled" : ""} data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(buyLabel.value)}</button></div></div></div>`);
			if (selected.value) {
				_push(`<section class="pdp__specs" aria-labelledby="pdp-specs" data-v-ccb551e0><h2 id="pdp-specs" class="t-h2" data-v-ccb551e0>Felgendetails</h2><p class="t-small quiet pdp__specs-for" data-v-ccb551e0>Für ${(0, server_renderer_exports.ssrInterpolate)(selected.value.fullLabel)}</p><dl class="spec" data-v-ccb551e0><div class="spec__row" data-v-ccb551e0><dt data-v-ccb551e0>Größe</dt><dd class="t-mono" data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(selected.value.sizeLabel)}</dd></div><div class="spec__row" data-v-ccb551e0><dt data-v-ccb551e0>Lochkreis</dt><dd class="t-mono" data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(selected.value.boltPattern)}</dd></div><div class="spec__row" data-v-ccb551e0><dt data-v-ccb551e0>Mittenlochbohrung</dt><dd class="t-mono" data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(selected.value.centreBore)}</dd></div><div class="spec__row" data-v-ccb551e0><dt data-v-ccb551e0>Einpresstiefe (ET)</dt><dd class="t-mono" data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(selected.value.etMm)} mm</dd></div>`);
				if (weight.value) _push(`<div class="spec__row" data-v-ccb551e0><dt data-v-ccb551e0>Gewicht pro Felge</dt><dd class="t-mono" data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(weight.value)}</dd></div>`);
				else _push(`<!---->`);
				if (selected.value.kbaNumber) _push(`<div class="spec__row" data-v-ccb551e0><dt data-v-ccb551e0>KBA-Nummer</dt><dd class="t-mono" data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(selected.value.kbaNumber)}</dd></div>`);
				else _push(`<!---->`);
				_push(`<div class="spec__row" data-v-ccb551e0><dt data-v-ccb551e0>Artikelnummer</dt><dd class="t-mono" data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(selected.value.sku)}</dd></div></dl>`);
				if (__props.product.descriptionDe) _push(`<p class="t-body pdp__desc" data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(__props.product.descriptionDe)}</p>`);
				else _push(`<!---->`);
				_push(`</section>`);
			} else _push(`<!---->`);
			_push(`</div></section>`);
			if (!buyVisible.value && selected.value) _push(`<div class="stickybar pdp__sticky" data-v-ccb551e0><div class="pdp__sticky-price" data-v-ccb551e0><p class="price" data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(selected.value.price)}</p><p class="price-note" data-v-ccb551e0>für 4 Felgen, inkl. MwSt.</p></div><button class="btn btn--primary pdp__sticky-btn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!canBuy.value || (0, vue_exports.unref)(basket).processing) ? " disabled" : ""} data-v-ccb551e0>${(0, server_renderer_exports.ssrInterpolate)(buyLabel.value)}</button></div>`);
			else _push(`<!---->`);
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Produkt/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Produkt/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-ccb551e0"]]);
//#endregion
export { Index_default as default };
