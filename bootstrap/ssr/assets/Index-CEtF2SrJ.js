import { c as vue_exports, i as useForm, n as head_default, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { a as Icon_default, r as useShared } from "./useShared-CY71KcPZ.js";
import { t as Icon_default$1 } from "./Icon-Cd7fU8zT.js";
import { a as DialogOverlay_default, n as DialogTitle_default, r as DialogPortal_default, s as DialogContent_default, v as DialogClose_default, y as DialogRoot_default } from "./Dialog-D0E0ckTw.js";
import { a as Picture_default } from "./useShortcuts-XJHE0tId.js";
import { t as AppLayout_default } from "./AppLayout-CIg_X6Ij.js";
import { t as ValueText_default, w as withUnit, x as decimal } from "./ValueText-CkuszrcW.js";
import { t as TyreLabel_default } from "./TyreLabel-BXu8SZ4k.js";
import { t as ProductPhoto_default } from "./ProductPhoto-DdGgOQm-.js";
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
		const entryLine = (0, vue_exports.computed)(() => {
			const verdict = props.verdict;
			if (verdict === null || verdict.status !== "PERMITTED" && verdict.status !== "CONDITIONAL") return null;
			return verdict.requiresEntry ? "Eintragung in die Fahrzeugpapiere erforderlich." : "Keine Eintragung erforderlich.";
		});
		const documentLine = (0, vue_exports.computed)(() => {
			const document = props.verdict?.document;
			if (!document) return null;
			const parts = [document.issuer, document.number].filter((part) => typeof part === "string" && part.trim() !== "");
			return parts.length > 0 ? parts.join(" · ") : null;
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
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["rcheck-panel", tone.value.cls] }, _attrs))} data-v-8df9447a><p class="rcheck-panel__head" data-v-8df9447a>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default$1, {
				name: tone.value.icon,
				size: 20
			}, null, _parent));
			_push(` RIMIFY-CHECK </p><p class="rcheck-panel__vehicle" data-v-8df9447a>${(0, server_renderer_exports.ssrInterpolate)(headline.value)}</p>`);
			if (__props.verdict) {
				_push(`<!--[-->`);
				if (entryLine.value) _push(`<p class="fit__entry" data-v-8df9447a>${(0, server_renderer_exports.ssrInterpolate)(entryLine.value)}</p>`);
				else _push(`<!---->`);
				if (entryLine.value && __props.verdict.entryNoteDe) _push(`<p class="quiet fit__note" data-v-8df9447a>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.entryNoteDe)}</p>`);
				else _push(`<!---->`);
				if (__props.verdict.conditions.length) {
					_push(`<ul class="fit__conditions" data-v-8df9447a><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.verdict.conditions, (condition) => {
						_push(`<li data-v-8df9447a>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
					});
					_push(`<!--]--></ul>`);
				} else _push(`<!---->`);
				if (__props.verdict.tyreSizes.length) _push(`<div class="fit__tyres" data-v-8df9447a><span class="micro" data-v-8df9447a>Passende Reifengrößen</span><p class="data" data-v-8df9447a>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.tyreSizes.join(" · "))}</p></div>`);
				else _push(`<!---->`);
				if (__props.verdict.reason) _push(`<p class="fit__reason" data-v-8df9447a>${(0, server_renderer_exports.ssrInterpolate)(__props.verdict.reason)}</p>`);
				else _push(`<!---->`);
				if (documentLine.value) {
					_push(`<p class="fit__doc" data-v-8df9447a>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default$1, {
						name: "document",
						size: 20
					}, null, _parent));
					_push(`<span class="data" data-v-8df9447a>${(0, server_renderer_exports.ssrInterpolate)(documentLine.value)}</span></p>`);
				} else _push(`<!---->`);
				_push(`<!--]-->`);
			} else if (__props.vehicle === null) _push(`<p class="quiet fit__note" data-v-8df9447a> Ohne Fahrzeug können wir keine Freigabe bestätigen. </p>`);
			else _push(`<!---->`);
			(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent);
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/FitmentPanel.vue
var _sfc_setup$2 = FitmentPanel_vue_vue_type_script_setup_true_lang_default.setup;
FitmentPanel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/FitmentPanel.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var FitmentPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FitmentPanel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-8df9447a"]]);
//#endregion
//#region resources/js/Components/Product/KomplettradOffer.vue?vue&type=script&setup=true&lang.ts
var FALLBACK_REFUSAL = "Passende Reifen für diese Größe haben wir gerade nicht vorrätig. Die Felge allein kannst du bestellen.";
var KomplettradOffer_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "KomplettradOffer",
	__ssrInlineRender: true,
	props: {
		offer: {},
		wheelConfigId: {},
		contactEmail: {}
	},
	setup(__props) {
		/**
		* The Komplettrad offer on the product page: every tyre the verdict permits on the chosen size,
		* priced per wheel on the server — or the one sentence saying why there is none, always with a
		* way forward. Never an empty panel and never a dead end (R-09 in spirit).
		*
		* Nothing here decides anything. The server chose the tyres (`TyreEligibility`, R-13), priced
		* them (`KomplettradPricer`) and formatted every figure (R-10); this component prints strings and
		* posts an id. The basket checks the combination again on the server whatever was shown (R-11).
		*
		* The refusal code is never rendered — it only picks which routes forward make sense: the
		* selector when the car is missing, the shop's e-mail when a person has to look at it, and the
		* plain Felgen purchase whenever the rim alone is still buyable.
		*/
		const props = __props;
		const form = useForm({
			kind: "WHEEL",
			wheelConfigId: 0,
			tyreVariantId: 0,
			quantity: 4
		});
		const refusal = (0, vue_exports.computed)(() => {
			const offer = props.offer;
			if (offer === null) return null;
			return offer.refusal ?? (offer.tyres.length === 0 ? FALLBACK_REFUSAL : null);
		});
		const forward = (0, vue_exports.computed)(() => {
			const code = props.offer?.refusalCode ?? null;
			return {
				vehicle: code === "NO_VEHICLE" || code === "VERDICT_RESTORED",
				contact: code !== "NO_VEHICLE",
				wheelsOnly: code !== "VERDICT_NOT_PERMITTED" && code !== "VERDICT_RESTORED"
			};
		});
		const mailto = (0, vue_exports.computed)(() => `mailto:${props.contactEmail}`);
		const error = (0, vue_exports.computed)(() => form.errors.tyreVariantId ?? form.errors.wheelConfigId ?? null);
		const TYRE_CLASSES = [
			"A",
			"B",
			"C",
			"D",
			"E"
		];
		const NOISE_CLASSES = [
			"A",
			"B",
			"C"
		];
		function isTyreClass(value) {
			return value !== null && TYRE_CLASSES.includes(value);
		}
		function isNoiseClass(value) {
			return value !== null && NOISE_CLASSES.includes(value);
		}
		function labelOf(tyre) {
			const label = tyre.label;
			if (label === null || !isTyreClass(label.fuel) || !isTyreClass(label.wetGrip) || label.noiseDb === null || !isNoiseClass(label.noiseClass)) return null;
			return {
				fuel: label.fuel,
				wet: label.wetGrip,
				noiseDb: label.noiseDb,
				noiseClass: label.noiseClass,
				eprelId: label.eprelId,
				title: `${tyre.brandName} ${tyre.name} · ${tyre.sizeLabel}`
			};
		}
		const cards = (0, vue_exports.computed)(() => (props.offer?.tyres ?? []).map((tyre) => ({
			tyre,
			label: labelOf(tyre)
		})));
		return (_ctx, _push, _parent, _attrs) => {
			if (__props.offer) {
				_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
					class: "kr",
					"aria-labelledby": "kr-heading"
				}, _attrs))} data-v-029ec1d1><h2 id="kr-heading" class="t-h2" data-v-029ec1d1>Komplettrad – Felge mit Reifen, montiert und gewuchtet</h2><p class="t-body kr__lead" data-v-029ec1d1> Wir ziehen den Reifen auf die Felge, wuchten das Rad aus und liefern es fertig montiert. Die Farbe der Wuchtgewichte wählst du im Warenkorb. </p>`);
				if (__props.offer.minSentence) _push(`<p class="t-small kr__min" data-v-029ec1d1>${(0, server_renderer_exports.ssrInterpolate)(__props.offer.minSentence)}</p>`);
				else _push(`<!---->`);
				if (refusal.value) {
					_push(`<div class="notice kr__refusal" data-v-029ec1d1>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "info",
						size: 20
					}, null, _parent));
					_push(`<div data-v-029ec1d1><p class="kr__refusal-text" data-v-029ec1d1>${(0, server_renderer_exports.ssrInterpolate)(refusal.value)}</p><p class="kr__routes" data-v-029ec1d1>`);
					if (forward.value.vehicle) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: "/felgen-suchen",
						class: "btn btn--secondary btn--sm"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(` Fahrzeug wählen `);
							else return [(0, vue_exports.createTextVNode)(" Fahrzeug wählen ")];
						}),
						_: 1
					}, _parent));
					else _push(`<!---->`);
					if (forward.value.contact) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", mailto.value)} class="link kr__mail" data-v-029ec1d1>Schreib uns</a>`);
					else _push(`<!---->`);
					if (forward.value.wheelsOnly) _push(`<a href="#felgen-kaufen" class="link kr__wheels-only" data-v-029ec1d1> Nur die Felgen bestellen </a>`);
					else _push(`<!---->`);
					_push(`</p></div></div>`);
				} else {
					_push(`<!--[-->`);
					if (error.value) {
						_push(`<p class="notice notice--bad kr__error" role="alert" data-v-029ec1d1>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "warning",
							size: 20
						}, null, _parent));
						_push(`<span data-v-029ec1d1>${(0, server_renderer_exports.ssrInterpolate)(error.value)}</span></p>`);
					} else _push(`<!---->`);
					_push(`<ul class="kr__grid" role="list" data-v-029ec1d1><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(cards.value, (card) => {
						_push(`<li class="kr-card" data-v-029ec1d1><span class="micro" data-v-029ec1d1>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.brandName)}</span><h3 class="kr-card__name" data-v-029ec1d1>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.name)}</h3><p class="kr-card__meta" data-v-029ec1d1>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.seasonLabel)} · <span class="data" data-v-029ec1d1>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.sizeLabel)}</span></p>`);
						if (card.label) _push((0, server_renderer_exports.ssrRenderComponent)(TyreLabel_default, (0, vue_exports.mergeProps)({ ref_for: true }, card.label, { class: "kr-card__label" }), null, _parent));
						else _push(`<!---->`);
						_push(`<div class="kr-card__price" data-v-029ec1d1><p class="price" data-v-029ec1d1>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.perWheel)}</p><p class="price-note" data-v-029ec1d1>Preis je Rad, inklusive Reifen, Montage und Wuchtgewichten.</p><p class="price-note" data-v-029ec1d1>inkl. MwSt., zzgl. Versand</p><p class="t-small kr-card__set" data-v-029ec1d1><span class="tabular" data-v-029ec1d1>${(0, server_renderer_exports.ssrInterpolate)(card.tyre.forFour)}</span> für 4 Kompletträder </p>`);
						if (__props.offer.priceOpen) _push(`<p class="t-small quiet kr-card__open" data-v-029ec1d1> Der Preis für Montage und Auswuchten steht noch nicht fest. </p>`);
						else _push(`<!---->`);
						_push(`</div><button type="button" class="btn btn--primary btn--block kr-card__add"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing || __props.wheelConfigId === null) ? " disabled" : ""} data-v-029ec1d1>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).processing ? "Wird hinzugefügt …" : "Als Komplettrad in den Warenkorb")}</button></li>`);
					});
					_push(`<!--]--></ul><p class="kr__fallback" data-v-029ec1d1><a href="#felgen-kaufen" class="link kr__wheels-only" data-v-029ec1d1>Nur die Felgen bestellen</a></p><!--]-->`);
				}
				_push(`</section>`);
			} else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/KomplettradOffer.vue
var _sfc_setup$1 = KomplettradOffer_vue_vue_type_script_setup_true_lang_default.setup;
KomplettradOffer_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/KomplettradOffer.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var KomplettradOffer_default = /*#__PURE__*/ _plugin_vue_export_helper_default(KomplettradOffer_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-029ec1d1"]]);
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
*
* A diameter can hold several configurations — 8J ET45 and 8,5J ET40 are both "18 Zoll" — and
* they can carry different verdicts. So a diameter is struck through only when NONE of its
* configurations is permitted: striking 18" because its first row is not permitted, while another
* 18" row is, tells the customer something false about their car. The width/ET options inside the
* chosen diameter are offered separately (`variants`), so every permitted configuration is
* reachable.
*/
var FALLBACK_REASON = "Für dein Fahrzeug nicht freigegeben.";
/** With no vehicle there is no verdict and no claim: every configuration may be bought. */
function sellable(config) {
	return config.verdict === null || config.verdict.sellable;
}
/** Permitted and in stock first, then permitted, then the rest; cheapest within each. */
function best(configs) {
	const rank = (c) => sellable(c) ? c.inStock ? 0 : 1 : 2;
	return [...configs].sort((a, b) => rank(a) - rank(b) || a.priceCents - b.priceCents)[0] ?? null;
}
function reasonFor(configs) {
	return configs.find((c) => c.verdict?.reason)?.verdict?.reason ?? FALLBACK_REASON;
}
function useConfigurator(configs, firstFinishId) {
	const finishId = (0, vue_exports.ref)(firstFinishId);
	const configId = (0, vue_exports.ref)(null);
	const forFinish = (0, vue_exports.computed)(() => configs().filter((c) => c.finishId === finishId.value));
	/**
	* The chosen configuration, or the best default: permitted and in stock, cheapest first —
	* never simply the first row, which on a car with a narrow approval would open the page on a
	* disabled chip and a blocked button.
	*/
	const selected = (0, vue_exports.computed)(() => {
		return forFinish.value.find((c) => c.id === configId.value) ?? best(forFinish.value);
	});
	const sizes = (0, vue_exports.computed)(() => {
		const groups = /* @__PURE__ */ new Map();
		for (const config of forFinish.value) groups.set(config.diameterIn, [...groups.get(config.diameterIn) ?? [], config]);
		const current = selected.value;
		return [...groups.entries()].map(([diameter, group]) => {
			const blocked = !group.some(sellable);
			const representative = current !== null && group.includes(current) ? current : best(group) ?? group[0];
			return {
				diameter,
				label: String(diameter).replace(".", ","),
				config: representative,
				blocked,
				reason: blocked ? reasonFor(group) : null
			};
		}).sort((a, b) => a.diameter - b.diameter);
	});
	const variants = (0, vue_exports.computed)(() => {
		const current = selected.value;
		if (current === null) return [];
		return forFinish.value.filter((c) => c.diameterIn === current.diameterIn).sort((a, b) => a.widthIn - b.widthIn || a.etMm - b.etMm).map((config) => ({
			id: config.id,
			label: config.sizeLabel,
			config,
			blocked: !sellable(config),
			reason: sellable(config) ? null : reasonFor([config])
		}));
	});
	const fromPrice = (0, vue_exports.computed)(() => {
		return [...forFinish.value].sort((a, b) => a.priceCents - b.priceCents)[0]?.price ?? null;
	});
	/**
	* A new colourway keeps the customer's size where it can: the same width and ET if that
	* finish offers them permitted, otherwise the same diameter. Falling back to the default
	* silently swapped a chosen 19" for an 18" — and its price — on a colour change.
	*/
	function selectFinish(id) {
		const previous = selected.value;
		finishId.value = id;
		configId.value = null;
		if (previous === null) return;
		const candidates = forFinish.value.filter((c) => sellable(c) && c.diameterIn === previous.diameterIn);
		const keep = candidates.find((c) => c.widthIn === previous.widthIn && c.etMm === previous.etMm) ?? best(candidates);
		configId.value = keep?.id ?? null;
	}
	function selectSize(option) {
		if (option.blocked) return;
		configId.value = option.config.id;
	}
	function selectVariant(option) {
		if (option.blocked) return;
		configId.value = option.config.id;
	}
	return {
		finishId,
		configId,
		selected,
		sizes,
		variants,
		fromPrice,
		selectFinish,
		selectSize,
		selectVariant
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
		hasVehicle: { type: Boolean },
		demo: { type: Boolean }
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
		* Beneath the purchase panel the page offers the same size as a Komplettrad — only the tyres the
		* verdict permits, priced on the server, or the one sentence saying why there are none. The offer
		* travels inside the configuration, so a size change swaps it in the same commit as the price.
		*
		* On a phone the price and the button follow the customer down the page once the main button has
		* scrolled away — the one persistent bar the storefront uses, because it is the page's next action.
		*
		* A seeded demonstration model (`demo`) shows "Beispielbestand" rather than "Auf Lager" and says it
		* cannot be ordered yet. Its basket button stays usable, so the flow can be reviewed; the server
		* refuses the order at the checkout (ACCURACY.md D4).
		*
		* The main photograph opens large in a dialog: a button around the image, focus trapped while it
		* is open, Escape or the close button to leave, focus back on the photograph after.
		*/
		/** The load rating per wheel travels with each configuration; null where none is verified. */
		const props = __props;
		const shared = useShared();
		const config = useConfigurator(() => props.configs, props.finishes[0]?.id ?? 0);
		const finish = (0, vue_exports.computed)(() => props.finishes.find((f) => f.id === config.finishId.value) ?? null);
		const selected = (0, vue_exports.computed)(() => config.selected.value);
		const shots = (0, vue_exports.computed)(() => {
			const image = finish.value?.image ?? null;
			if (image === null) return [];
			const { views = [], ...front } = image;
			return [{
				...front,
				label: "Ansicht von vorn"
			}, ...views];
		});
		const shotIndex = (0, vue_exports.ref)(0);
		const shot = (0, vue_exports.computed)(() => shots.value[shotIndex.value] ?? null);
		const shotAlt = (0, vue_exports.computed)(() => `${props.product.brandName} ${props.product.modelName} in ${finish.value?.name ?? ""}, ${shot.value?.label ?? ""}`);
		(0, vue_exports.watch)(() => config.finishId.value, () => {
			shotIndex.value = 0;
		});
		const zoomOpen = (0, vue_exports.ref)(false);
		const basket = useForm({
			kind: "WHEEL",
			wheelConfigId: 0,
			quantity: 4
		});
		const stockLabel = (0, vue_exports.computed)(() => {
			const inStock = selected.value?.inStock === true;
			if (props.demo === true) return inStock ? "Beispielbestand" : "Beispielbestand · ausverkauft";
			return inStock ? "Auf Lager" : "Ausverkauft";
		});
		const stockTone = (0, vue_exports.computed)(() => {
			if (props.demo === true) return "tag--unknown";
			return selected.value?.inStock === true ? "tag--ok" : "tag--danger";
		});
		const documentBore = (0, vue_exports.computed)(() => selected.value?.verdict?.centreBore ?? null);
		const boreConflict = (0, vue_exports.computed)(() => selected.value?.verdict?.centreBoreSource === "CONFLICTING");
		const rimBoreLabel = (0, vue_exports.computed)(() => selected.value?.verdict ? "Mittenlochbohrung der Felge" : "Mittenlochbohrung");
		const hump = (0, vue_exports.computed)(() => selected.value?.hump ?? null);
		const maxLoad = (0, vue_exports.computed)(() => {
			const kg = selected.value?.maxLoadKg;
			return typeof kg === "number" && kg > 0 ? withUnit(decimal(kg, 0), "kg") : null;
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
			_push(`<section class="section-dense" data-v-2d173525><div class="wrap" data-v-2d173525><nav class="pdp__crumbs t-small" aria-label="Brotkrumen" data-v-2d173525>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Startseite`);
					else return [(0, vue_exports.createTextVNode)("Startseite")];
				}),
				_: 1
			}, _parent));
			_push(`<span aria-hidden="true" data-v-2d173525>/</span>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/felgen" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Felgen`);
					else return [(0, vue_exports.createTextVNode)("Felgen")];
				}),
				_: 1
			}, _parent));
			_push(`<span aria-hidden="true" data-v-2d173525>/</span><span aria-current="page" translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(__props.product.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(__props.product.modelName)}</span></nav><div class="pdp" data-v-2d173525><div class="pdp__gallery" data-v-2d173525><div class="well pdp__well" data-v-2d173525>`);
			if (shot.value) {
				_push(`<button type="button" class="pdp__zoom" aria-haspopup="dialog"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Foto vergrößern: ${shotAlt.value}`)} data-v-2d173525>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
					key: shot.value.name,
					image: shot.value,
					alt: shotAlt.value,
					sizes: "(min-width: 900px) 56vw, 100vw",
					eager: "",
					class: "pdp__picture"
				}, null, _parent));
				_push(`</button>`);
			} else _push((0, server_renderer_exports.ssrRenderComponent)(ProductPhoto_default, {
				spokes: __props.product.spokes,
				finish: finish.value?.artFinish ?? "graphite",
				size: 560
			}, null, _parent));
			_push(`</div>`);
			if (shots.value.length > 1) {
				_push(`<div class="pdp__thumbs" role="group" aria-label="Ansichten" data-v-2d173525><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(shots.value, (view, i) => {
					_push(`<button type="button" class="pdp__thumb"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", i === shotIndex.value)}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", view.label)} data-v-2d173525>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
						image: view,
						alt: "",
						sizes: "72px",
						class: "pdp__thumb-picture"
					}, null, _parent));
					_push(`</button>`);
				});
				_push(`<!--]--></div>`);
			} else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogRoot_default), {
				open: zoomOpen.value,
				"onUpdate:open": ($event) => zoomOpen.value = $event
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogPortal_default), null, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogOverlay_default), { class: "overlay" }, null, _parent, _scopeId));
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogContent_default), {
									class: "dialog pdp-zoom",
									"aria-describedby": ""
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push(`<div class="dialog__head" data-v-2d173525${_scopeId}>`);
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogTitle_default), { class: "pdp-zoom__title" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(shotAlt.value)}`);
													else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(shotAlt.value), 1)];
												}),
												_: 1
											}, _parent, _scopeId));
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogClose_default), {
												class: "icon-btn dialog__close",
												"aria-label": "Schließen"
											}, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
														name: "close",
														size: 24
													}, null, _parent, _scopeId));
													else return [(0, vue_exports.createVNode)(Icon_default, {
														name: "close",
														size: 24
													})];
												}),
												_: 1
											}, _parent, _scopeId));
											_push(`</div><div class="pdp-zoom__frame" data-v-2d173525${_scopeId}>`);
											if (shot.value) _push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
												key: `zoom-${shot.value.name}`,
												image: shot.value,
												alt: shotAlt.value,
												sizes: "(min-width: 900px) 80vw, 100vw",
												eager: "",
												class: "pdp-zoom__picture"
											}, null, _parent, _scopeId));
											else _push(`<!---->`);
											_push(`</div>`);
										} else return [(0, vue_exports.createVNode)("div", { class: "dialog__head" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "pdp-zoom__title" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(shotAlt.value), 1)]),
											_: 1
										}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogClose_default), {
											class: "icon-btn dialog__close",
											"aria-label": "Schließen"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
												name: "close",
												size: 24
											})]),
											_: 1
										})]), (0, vue_exports.createVNode)("div", { class: "pdp-zoom__frame" }, [shot.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(Picture_default, {
											key: `zoom-${shot.value.name}`,
											image: shot.value,
											alt: shotAlt.value,
											sizes: "(min-width: 900px) 80vw, 100vw",
											eager: "",
											class: "pdp-zoom__picture"
										}, null, 8, ["image", "alt"])) : (0, vue_exports.createCommentVNode)("", true)])];
									}),
									_: 1
								}, _parent, _scopeId));
							} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogOverlay_default), { class: "overlay" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogContent_default), {
								class: "dialog pdp-zoom",
								"aria-describedby": ""
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("div", { class: "dialog__head" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "pdp-zoom__title" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(shotAlt.value), 1)]),
									_: 1
								}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogClose_default), {
									class: "icon-btn dialog__close",
									"aria-label": "Schließen"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
										name: "close",
										size: 24
									})]),
									_: 1
								})]), (0, vue_exports.createVNode)("div", { class: "pdp-zoom__frame" }, [shot.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(Picture_default, {
									key: `zoom-${shot.value.name}`,
									image: shot.value,
									alt: shotAlt.value,
									sizes: "(min-width: 900px) 80vw, 100vw",
									eager: "",
									class: "pdp-zoom__picture"
								}, null, 8, ["image", "alt"])) : (0, vue_exports.createCommentVNode)("", true)])]),
								_: 1
							})];
						}),
						_: 1
					}, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogPortal_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogOverlay_default), { class: "overlay" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogContent_default), {
							class: "dialog pdp-zoom",
							"aria-describedby": ""
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("div", { class: "dialog__head" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "pdp-zoom__title" }, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(shotAlt.value), 1)]),
								_: 1
							}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogClose_default), {
								class: "icon-btn dialog__close",
								"aria-label": "Schließen"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
									name: "close",
									size: 24
								})]),
								_: 1
							})]), (0, vue_exports.createVNode)("div", { class: "pdp-zoom__frame" }, [shot.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(Picture_default, {
								key: `zoom-${shot.value.name}`,
								image: shot.value,
								alt: shotAlt.value,
								sizes: "(min-width: 900px) 80vw, 100vw",
								eager: "",
								class: "pdp-zoom__picture"
							}, null, 8, ["image", "alt"])) : (0, vue_exports.createCommentVNode)("", true)])]),
							_: 1
						})]),
						_: 1
					})];
				}),
				_: 1
			}, _parent));
			_push(`</div><div class="pdp__buy" data-v-2d173525><h1 class="t-h1" translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(__props.product.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(__props.product.modelName)}</h1>`);
			if (__props.product.typeDesignation) {
				_push(`<p class="data pdp__type" data-v-2d173525>Typ `);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, {
					text: __props.product.typeDesignation,
					whole: ""
				}, null, _parent));
				_push(`</p>`);
			} else _push(`<!---->`);
			if (__props.product.rating !== null && __props.product.ratingCount > 0) {
				_push(`<p class="stars pdp__rating" data-v-2d173525><span class="stars__glyph" aria-hidden="true" data-v-2d173525>★</span><span class="tabular" data-v-2d173525>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: __props.product.ratingLabel ?? "" }, null, _parent));
				_push(`</span></p>`);
			} else _push(`<!---->`);
			_push(`<div class="pdp__block" data-v-2d173525><span class="micro" data-v-2d173525>Farbe · <span translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(finish.value?.name)}</span></span><div class="pdp__swatches" data-v-2d173525><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.finishes, (item) => {
				_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pdp__swatch--on": item.id === (0, vue_exports.unref)(config).finishId.value }, "pdp__swatch"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", item.id === (0, vue_exports.unref)(config).finishId.value)} data-v-2d173525><span class="pdp__dot" data-qa-ignore style="${(0, server_renderer_exports.ssrRenderStyle)(item.hex ? { "--swatch": item.hex } : void 0)}" data-v-2d173525></span><span translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(item.name)}</span></button>`);
			});
			_push(`<!--]--></div></div><div id="groessen" class="pdp__block" data-v-2d173525><span class="micro" data-v-2d173525>Durchmesser (<span translate="no" data-v-2d173525>Zoll</span>)</span><div class="chip-row pdp__chips" data-v-2d173525><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(config).sizes.value, (size) => {
				_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{
					"chip--on": selected.value?.id === size.config.id,
					"chip--blocked": size.blocked
				}, "chip"])}" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(size.blocked) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", selected.value?.id === size.config.id)}${(0, server_renderer_exports.ssrRenderAttr)("title", size.reason ?? void 0)} data-v-2d173525><span translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(size.label)}</span></button>`);
			});
			_push(`<!--]--></div>`);
			if ((0, vue_exports.unref)(config).sizes.value.some((s) => s.blocked)) _push(`<p class="t-small quiet pdp__note" data-v-2d173525> Durchgestrichene Größen sind für dein Fahrzeug nicht freigegeben. </p>`);
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
			_push(`<div class="pdp__price" data-v-2d173525><p class="price price--lg" translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(selected.value?.price ?? (0, vue_exports.unref)(config).fromPrice.value)}</p><p class="price-note" data-v-2d173525>für 4 Felgen, inkl. MwSt., zzgl. Versand</p><span class="${(0, server_renderer_exports.ssrRenderClass)([stockTone.value, "tag pdp__stock"])}" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(stockLabel.value)}</span>`);
			if (__props.demo) _push(`<p class="t-small pdp__demo" data-v-2d173525> Beispielsortiment: Diese Felge kannst du dir ansehen und in den Warenkorb legen, bestellen kannst du sie noch nicht. </p>`);
			else _push(`<!---->`);
			_push(`</div><div id="felgen-kaufen" data-v-2d173525><button class="btn btn--primary btn--block btn--lg pdp__add" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!canBuy.value || (0, vue_exports.unref)(basket).processing) ? " disabled" : ""} data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(buyLabel.value)}</button></div></div></div>`);
			if (selected.value && selected.value.komplettrad) _push((0, server_renderer_exports.ssrRenderComponent)(KomplettradOffer_default, {
				class: "pdp__komplettrad",
				offer: selected.value.komplettrad,
				"wheel-config-id": selected.value.id,
				"contact-email": (0, vue_exports.unref)(shared).contact.email
			}, null, _parent));
			else _push(`<!---->`);
			if (selected.value) {
				_push(`<section class="pdp__specs" aria-labelledby="pdp-specs" data-v-2d173525><h2 id="pdp-specs" class="t-h2" data-v-2d173525>Felgendetails</h2><p class="t-small quiet pdp__specs-for" data-v-2d173525>Für `);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: selected.value.fullLabel }, null, _parent));
				_push(`</p><dl class="spec" data-v-2d173525><div class="spec__row" data-v-2d173525><dt data-v-2d173525>Größe</dt><dd class="t-mono" translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(selected.value.sizeLabel)}</dd></div><div class="spec__row" data-v-2d173525><dt data-v-2d173525>Lochkreis</dt><dd class="t-mono" translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(selected.value.boltPattern)}</dd></div>`);
				if (documentBore.value) _push(`<div class="spec__row spec__row--doc" data-v-2d173525><dt data-v-2d173525> Mittenlochbohrung für dein Fahrzeug <span class="spec__hint" data-v-2d173525>laut Gutachten</span></dt><dd class="t-mono" translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(documentBore.value)}</dd></div>`);
				else _push(`<!---->`);
				_push(`<div class="spec__row" data-v-2d173525><dt data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(rimBoreLabel.value)}</dt><dd class="t-mono" translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(selected.value.centreBore)}</dd></div><div class="spec__row" data-v-2d173525><dt data-v-2d173525>Einpresstiefe (ET)</dt><dd class="t-mono" translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(selected.value.etMm)} mm</dd></div>`);
				if (hump.value) _push(`<div class="spec__row" data-v-2d173525><dt data-v-2d173525>Hump</dt><dd class="t-mono" translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(hump.value)}</dd></div>`);
				else _push(`<!---->`);
				if (finish.value) _push(`<div class="spec__row" data-v-2d173525><dt data-v-2d173525>Farbe</dt><dd class="t-mono" translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(finish.value.name)}</dd></div>`);
				else _push(`<!---->`);
				if (__props.product.spokes > 0) _push(`<div class="spec__row" data-v-2d173525><dt data-v-2d173525>Speichen</dt><dd class="t-mono" translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(__props.product.spokes)}</dd></div>`);
				else _push(`<!---->`);
				if (weight.value) _push(`<div class="spec__row" data-v-2d173525><dt data-v-2d173525>Gewicht pro Felge</dt><dd class="t-mono" translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(weight.value)}</dd></div>`);
				else _push(`<!---->`);
				if (maxLoad.value) _push(`<div class="spec__row" data-v-2d173525><dt data-v-2d173525>Traglast</dt><dd class="t-mono" translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(maxLoad.value)}</dd></div>`);
				else _push(`<!---->`);
				if (selected.value.kbaNumber) _push(`<div class="spec__row" data-v-2d173525><dt data-v-2d173525>KBA-Nummer</dt><dd class="t-mono" translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(selected.value.kbaNumber)}</dd></div>`);
				else _push(`<!---->`);
				_push(`<div class="spec__row" data-v-2d173525><dt data-v-2d173525>Artikelnummer</dt><dd class="t-mono" translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(selected.value.sku)}</dd></div></dl>`);
				if (boreConflict.value) _push(`<p class="t-small quiet pdp__specs-note" data-v-2d173525> Für dein Fahrzeug nennen die Gutachten unterschiedliche Mittenlochbohrungen. Wir zeigen dir deshalb nur das Maß der Felge. </p>`);
				else _push(`<!---->`);
				if (__props.product.descriptionDe) _push(`<p class="t-body pdp__desc" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(__props.product.descriptionDe)}</p>`);
				else _push(`<!---->`);
				_push(`</section>`);
			} else _push(`<!---->`);
			_push(`</div></section>`);
			if (!buyVisible.value && selected.value) _push(`<div class="stickybar pdp__sticky" data-v-2d173525><div class="pdp__sticky-price" data-v-2d173525><p class="price" translate="no" data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(selected.value.price)}</p><p class="price-note" data-v-2d173525>für 4 Felgen, inkl. MwSt., zzgl. Versand</p></div><button class="btn btn--primary pdp__sticky-btn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!canBuy.value || (0, vue_exports.unref)(basket).processing) ? " disabled" : ""} data-v-2d173525>${(0, server_renderer_exports.ssrInterpolate)(buyLabel.value)}</button></div>`);
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
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-2d173525"]]);
//#endregion
export { Index_default as default };
