import { a as DialogOverlay_default, b as DialogClose_default, n as DialogTitle_default, r as DialogPortal_default, s as DialogContent_default, x as DialogRoot_default } from "./Dialog-CAlgTJaP.js";
import { t as AppLayout_default } from "./AppLayout-DRrII9kf.js";
import { a as link_default, i as head_default, o as useForm, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as Icon_default } from "./Icon-Bryl-es8.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { g as usePriceTerms, k as useShared, m as priceTerms, u as contactHref, x as claimBottomEdge } from "./useShopFeedback-CtJFnKEI.js";
import { n as decimal, s as withUnit } from "./format-6R0uUMt3.js";
import { t as ConditionGroups_default } from "./ConditionGroups-D92g-UzQ.js";
import { t as Picture_default } from "./Picture-LERI3lyx.js";
import { n as ENTRY_REQUIRED, t as ABNAHME_REQUIRED } from "./papers-B4aUsj_q.js";
import { a as sellable, c as FitmentDetail_default, i as FitmentPanel_default, l as BuyModeChoice_default, n as setNames, r as waitsForPapers, s as useConfigurator, t as KomplettradChoice_default } from "./KomplettradChoice-BDeWqoF2.js";
import { t as ValueText_default } from "./ValueText-DvGZt5gI.js";
import { t as ProductPhoto_default } from "./ProductPhoto-DTdDKSKx.js";
//#region resources/js/Components/Product/AmountStepper.vue?vue&type=script&setup=true&lang.ts
var AmountStepper_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AmountStepper",
	__ssrInlineRender: true,
	props: {
		modelValue: {},
		min: {},
		max: {},
		label: {},
		disabled: { type: Boolean }
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		const uid = (0, vue_exports.useId)();
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "amt" }, _attrs))} data-v-55171959><span${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-label`)} class="amt__label" data-v-55171959>${(0, server_renderer_exports.ssrInterpolate)(__props.label)}</span><div class="amt__stepper" role="group"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `${(0, vue_exports.unref)(uid)}-label`)} data-v-55171959><button class="amt__step" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${__props.label} verringern`)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.disabled || __props.modelValue <= __props.min) ? " disabled" : ""} data-v-55171959>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "minus",
				size: 20
			}, null, _parent));
			_push(`</button><output class="amt__n tabular" aria-live="polite" data-v-55171959>${(0, server_renderer_exports.ssrInterpolate)(__props.modelValue)}</output><button class="amt__step" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${__props.label} erhöhen`)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.disabled || __props.modelValue >= __props.max) ? " disabled" : ""} data-v-55171959>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "plus",
				size: 20
			}, null, _parent));
			_push(`</button></div></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/AmountStepper.vue
var _sfc_setup$2 = AmountStepper_vue_vue_type_script_setup_true_lang_default.setup;
AmountStepper_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/AmountStepper.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var AmountStepper_default = /*#__PURE__*/ _plugin_vue_export_helper_default(AmountStepper_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-55171959"]]);
//#endregion
//#region resources/js/Components/Product/MischbereifungOffer.vue?vue&type=script&setup=true&lang.ts
var MischbereifungOffer_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "MischbereifungOffer",
	__ssrInlineRender: true,
	props: {
		offer: {},
		wheelConfigId: {},
		weightColourId: { default: null },
		rdks: { default: null }
	},
	setup(__props) {
		/**
		* Mischbereifung on the product page (#20, D-105): the front/rear pairs the released Gutachten's own table lists for
		* the chosen car on this rim, each with the tyre sets that meet both axles — or the one sentence saying why there are
		* none. Shown only where the document prints such a table; elsewhere the server sends null and nothing renders.
		*
		* Nothing here decides anything: the pairs, the sets, the per-axle minimum and every price come from the server
		* (`TyreEligibility`, `KomplettradPricer`, `LinePrice`), and the basket asks the engine again on the click (R-11).
		* The document's own conditions are quoted, never paraphrased: they are what the customer carries in the car.
		*/
		function cardName(set) {
			const names = setNames(set);
			return names.line ?? `vorne ${names.front ?? ""} · hinten ${names.rear ?? ""}`;
		}
		const props = __props;
		const terms = usePriceTerms();
		const chosenKey = (0, vue_exports.ref)(props.offer.pairs[0]?.key ?? null);
		(0, vue_exports.watch)(() => props.offer.pairs.map((pair) => pair.key).join(","), () => {
			if (!props.offer.pairs.some((pair) => pair.key === chosenKey.value)) chosenKey.value = props.offer.pairs[0]?.key ?? null;
		});
		const chosen = (0, vue_exports.computed)(() => props.offer.pairs.find((pair) => pair.key === chosenKey.value) ?? null);
		const rulesPage = (0, vue_exports.computed)(() => props.offer.rulesPage === void 0 ? props.offer.sourcePage : props.offer.rulesPage);
		const form = useForm({
			kind: "WHEEL",
			wheelConfigId: 0,
			tyreVariantId: 0,
			rearTyreVariantId: 0,
			weightColourId: null,
			rdks: null,
			quantity: 2
		});
		const error = (0, vue_exports.computed)(() => form.errors.tyreVariantId ?? form.errors.rearTyreVariantId ?? form.errors.wheelConfigId ?? null);
		function priceOf(set) {
			return set.prices?.find((price) => price.colourId === props.weightColourId) ?? set;
		}
		const pressed = (0, vue_exports.ref)(null);
		function euLines(set) {
			const line = (label, axle) => label && label.fuel && label.wetGrip && label.noiseDb !== null && label.noiseClass ? `${axle ? `${axle}: ` : ""}Kraftstoffeffizienz ${label.fuel} · Nasshaftung ${label.wetGrip} · ${withUnit(label.noiseDb, "dB")}\u00A0(${label.noiseClass})` : null;
			const both = set.frontTyreId === set.rearTyreId;
			return [line(set.frontEu, both ? null : "vorne"), both ? null : line(set.rearEu, "hinten")].filter((l) => l !== null);
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "mix",
				"aria-labelledby": "mix-heading"
			}, _attrs))} data-v-1b404bab><h2 id="mix-heading" class="t-h3" data-v-1b404bab>Mischbereifung – vorne und hinten verschiedene Reifen</h2><p class="mix__lead" data-v-1b404bab> Nur die Kombinationen, die das Gutachten für dein Fahrzeug nennt: ${(0, server_renderer_exports.ssrInterpolate)(__props.offer.perAxle)} Kompletträder für die Vorderachse, ${(0, server_renderer_exports.ssrInterpolate)(__props.offer.perAxle)} für die Hinterachse – montiert und gewuchtet. </p>`);
			if (__props.offer.refusal) {
				_push(`<div class="notice mix__notice" data-v-1b404bab>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "info",
					size: 20
				}, null, _parent));
				_push(`<p class="mix__notice-text" data-v-1b404bab>${(0, server_renderer_exports.ssrInterpolate)(__props.offer.refusal)}</p></div>`);
			} else {
				_push(`<!--[-->`);
				if (__props.offer.pairs.length > 1) {
					_push(`<fieldset class="mix__pairs" data-v-1b404bab><legend class="micro" data-v-1b404bab>Kombination aus dem Gutachten</legend><div class="chip-row" data-v-1b404bab><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.offer.pairs, (pair) => {
						_push(`<button type="button" class="chip"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", pair.key === chosenKey.value)} data-v-1b404bab> vorne ${(0, server_renderer_exports.ssrInterpolate)(pair.front)} · hinten ${(0, server_renderer_exports.ssrInterpolate)(pair.rear)}</button>`);
					});
					_push(`<!--]--></div></fieldset>`);
				} else _push(`<!---->`);
				if (chosen.value) {
					_push(`<!--[--><p class="mix__pair" data-v-1b404bab><span class="data" data-v-1b404bab>vorne ${(0, server_renderer_exports.ssrInterpolate)(chosen.value.front)}</span><span aria-hidden="true" data-v-1b404bab>·</span><span class="data" data-v-1b404bab>hinten ${(0, server_renderer_exports.ssrInterpolate)(chosen.value.rear)}</span><span class="mix__source" data-v-1b404bab> Kombination Nr. ${(0, server_renderer_exports.ssrInterpolate)(chosen.value.number)}`);
					if (__props.offer.sourcePage) _push(`<!--[--> im Gutachten, Seite ${(0, server_renderer_exports.ssrInterpolate)(__props.offer.sourcePage)}<!--]-->`);
					else _push(`<!---->`);
					_push(`</span></p><p class="mix__min" data-v-1b404bab>${(0, server_renderer_exports.ssrInterpolate)(chosen.value.minSentence)}</p>`);
					if (chosen.value.answer) {
						_push(`<div class="mix__answer" data-set-answer data-v-1b404bab><p class="micro" data-v-1b404bab>Das verlangt das Gutachten je Achse</p>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(ConditionGroups_default, { groups: chosen.value.answer }, null, _parent));
						_push(`</div>`);
					} else _push(`<!---->`);
					if (error.value) {
						_push(`<p class="notice notice--bad mix__error" role="alert" data-v-1b404bab>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "warning",
							size: 20
						}, null, _parent));
						_push(`<span data-v-1b404bab>${(0, server_renderer_exports.ssrInterpolate)(error.value)}</span></p>`);
					} else _push(`<!---->`);
					if (chosen.value.sets.length > 0) {
						_push(`<ul class="mix__grid" role="list" data-v-1b404bab><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(chosen.value.sets, (set) => {
							_push(`<li class="mix-card" data-v-1b404bab><span class="micro" data-v-1b404bab>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(setNames)(set).brands.join(" · "))}</span><h3 class="mix-card__name" data-v-1b404bab>${(0, server_renderer_exports.ssrInterpolate)(cardName(set))}</h3><p class="mix-card__meta" data-v-1b404bab>${(0, server_renderer_exports.ssrInterpolate)(set.seasonLabel)}</p><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(euLines(set), (eu) => {
								_push(`<p class="mix-card__eu num" data-v-1b404bab>${(0, server_renderer_exports.ssrInterpolate)(eu)}</p>`);
							});
							_push(`<!--]--><dl class="mix-card__axles" data-v-1b404bab><div data-v-1b404bab><dt data-v-1b404bab>Vorderachse</dt><dd data-v-1b404bab><span class="tabular" data-v-1b404bab>${(0, server_renderer_exports.ssrInterpolate)(__props.offer.perAxle)} ×</span> <span class="data" data-v-1b404bab>${(0, server_renderer_exports.ssrInterpolate)(set.frontLabel)}</span></dd></div><div data-v-1b404bab><dt data-v-1b404bab>Hinterachse</dt><dd data-v-1b404bab><span class="tabular" data-v-1b404bab>${(0, server_renderer_exports.ssrInterpolate)(__props.offer.perAxle)} ×</span> <span class="data" data-v-1b404bab>${(0, server_renderer_exports.ssrInterpolate)(set.rearLabel)}</span></dd></div></dl><div class="mix-card__price" data-v-1b404bab><p class="price" data-v-1b404bab>${(0, server_renderer_exports.ssrInterpolate)(priceOf(set).forFour)}</p><p class="price-note" data-v-1b404bab> für ${(0, server_renderer_exports.ssrInterpolate)(__props.offer.perAxle)} + ${(0, server_renderer_exports.ssrInterpolate)(__props.offer.perAxle)} Kompletträder · pro Rad vorne ${(0, server_renderer_exports.ssrInterpolate)(priceOf(set).perWheelFront)}, hinten ${(0, server_renderer_exports.ssrInterpolate)(priceOf(set).perWheelRear)}</p><p class="price-legal" data-v-1b404bab>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(terms).note)}</p>`);
							if (__props.offer.priceOpen) _push(`<p class="price-note" data-v-1b404bab>Ohne Montage und Auswuchten – der Preis dafür steht noch nicht fest.</p>`);
							else _push(`<!---->`);
							_push(`</div><button type="button" class="btn btn--primary btn--block mix-card__add"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.wheelConfigId === null) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing && pressed.value === set.key ? "true" : void 0)} data-v-1b404bab>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).processing && pressed.value === set.key ? "Wird hinzugefügt …" : "Als Mischbereifung in den Warenkorb")}</button></li>`);
						});
						_push(`<!--]--></ul>`);
					} else {
						_push(`<p class="notice mix__notice" data-v-1b404bab>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "info",
							size: 20
						}, null, _parent));
						_push(`<span data-v-1b404bab>Reifen für diese Kombination können wir dir gerade nicht anbieten. Die Felge allein kannst du bestellen.</span></p>`);
					}
					_push(`<!--]-->`);
				} else _push(`<!---->`);
				if (__props.offer.rules) {
					_push(`<figure class="mix__rules" data-v-1b404bab><figcaption class="micro" data-v-1b404bab>Dazu verlangt das Gutachten`);
					if (rulesPage.value) _push(`<!--[--> (Seite ${(0, server_renderer_exports.ssrInterpolate)(rulesPage.value)})<!--]-->`);
					else _push(`<!---->`);
					_push(`</figcaption><blockquote class="mix__quote" data-v-1b404bab>${(0, server_renderer_exports.ssrInterpolate)(__props.offer.rules)}</blockquote></figure>`);
				} else _push(`<!---->`);
				_push(`<!--]-->`);
			}
			_push(`</section>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/MischbereifungOffer.vue
var _sfc_setup$1 = MischbereifungOffer_vue_vue_type_script_setup_true_lang_default.setup;
MischbereifungOffer_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/MischbereifungOffer.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var MischbereifungOffer_default = /*#__PURE__*/ _plugin_vue_export_helper_default(MischbereifungOffer_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-1b404bab"]]);
//#endregion
//#region resources/js/Pages/Produkt/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		product: {},
		reviews: {},
		finishes: {},
		configs: {},
		hasVehicle: { type: Boolean },
		shipping: {},
		komplettradOptions: {},
		demo: { type: Boolean },
		acceptance: { type: Boolean }
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
		* The panel asks one question before the price: Nur Felgen or Komplettrad (the client's #18). The
		* Komplettrad shows the tyres the verdict permits on the size on screen, priced on the server, or the
		* one sentence saying why there are none; the offer travels inside the configuration, so a size change
		* swaps it in the same commit as the price. Switching keeps the finish, the size, the amount of rims
		* and the tyre picked, and the one button adds whichever is chosen.
		*
		* On a phone the price and the button follow the customer down the page once the main button has
		* scrolled away — the one persistent bar the storefront uses, because it is the page's next action.
		*
		* A seeded demonstration model (`demo`) shows "Beispielsortiment" rather than "Auf Lager" and says it
		* cannot be ordered yet. Its basket button stays usable, so the flow can be reviewed; the server
		* refuses the order at the checkout (ACCURACY.md D4).
		*
		* The main photograph opens large in a dialog: a button around the image, focus trapped while it
		* is open, Escape or the close button to leave, focus back on the photograph after.
		*/
		/** The load rating per wheel travels with each configuration; null where none is verified. */
		const props = __props;
		const shared = useShared();
		const terms = (0, vue_exports.computed)(() => priceTerms(shared.value.smallBusiness === true));
		const page = usePage();
		const linkedSize = Number(new URLSearchParams((page.url ?? "").split("?")[1] ?? "").get("groesse")) || null;
		const config = useConfigurator(() => props.configs, props.finishes[0]?.id ?? 0, linkedSize);
		const finish = (0, vue_exports.computed)(() => props.finishes.find((f) => f.id === config.finishId.value) ?? null);
		const selected = (0, vue_exports.computed)(() => config.selected.value);
		/**
		* GPSR's electronic address: a web address as its link, an e-mail address as text to copy — no button on the shop opens
		* a mail program (the client's #26); the maker's address is the maker's, so it cannot lead to our contact form either.
		*/
		function webAddress(contact) {
			return /^https?:\/\//i.test(contact.trim()) ? contact.trim() : null;
		}
		const askAboutMaker = (0, vue_exports.computed)(() => contactHref({
			subject: `Herstellerangaben: ${props.product.brandName} ${props.product.modelName}`,
			from: page.url
		}));
		const askAboutTyres = (0, vue_exports.computed)(() => contactHref({
			subject: `Wunschreifen prüfen: ${props.product.brandName} ${props.product.modelName}${selected.value ? `, ${selected.value.sizeLabel}` : ""}`,
			from: page.url
		}));
		const shots = (0, vue_exports.computed)(() => {
			const image = finish.value?.image ?? null;
			if (image === null) return [];
			const { views = [], ...front } = image;
			return [{
				...front,
				label: front.label ?? "Ansicht von vorn"
			}, ...views];
		});
		const shotIndex = (0, vue_exports.ref)(0);
		const shot = (0, vue_exports.computed)(() => shots.value[shotIndex.value] ?? null);
		const shotAlt = (0, vue_exports.computed)(() => shot.value?.alt ?? `${props.product.brandName} ${props.product.modelName} in ${finish.value?.name ?? ""}, ${shot.value?.label ?? ""}`);
		const photoNote = (0, vue_exports.computed)(() => {
			const stamp = finish.value?.image?.stamp;
			const current = selected.value;
			if (!stamp || current === null || !current.kbaNumber || current.kbaNumber === stamp) return null;
			const pictured = props.configs.find((c) => c.kbaNumber === stamp);
			return pictured ? `Abbildung zeigt die ${decimal(pictured.diameterIn, Number.isInteger(pictured.diameterIn) ? 0 : 1)}-Zoll-Ausführung.` : null;
		});
		const blockedNote = (0, vue_exports.computed)(() => {
			const statuses = new Set(config.sizes.value.filter((s) => s.blocked).map((s) => s.config.verdict?.status));
			if (statuses.size === 0) return null;
			const refused = statuses.has("NOT_PERMITTED");
			const open = [...statuses].some((status) => status !== "NOT_PERMITTED");
			if (refused && open) return "Durchgestrichene Größen sind für dein Fahrzeug nicht freigegeben, oder uns liegt für sie keine Freigabe vor.";
			return refused ? "Durchgestrichene Größen sind für dein Fahrzeug nicht freigegeben." : "Für durchgestrichene Größen liegt uns für dein Fahrzeug keine Freigabe vor.";
		});
		const unconfirmedNote = (0, vue_exports.computed)(() => config.sizes.value.some((s) => s.unconfirmed && !waitsForPapers(s.config.verdict)) ? "Grau markierte Größen können wir für dein Fahrzeug noch nicht bestätigen. Das heißt nicht, dass sie unzulässig sind, sondern dass uns die Unterlagen dazu fehlen." : null);
		(0, vue_exports.watch)(() => config.finishId.value, () => {
			shotIndex.value = 0;
		});
		const proofLine = (0, vue_exports.computed)(() => {
			const proof = props.product.proof;
			if (!proof || proof.gutachten === 0) return null;
			return `${proof.gutachten === 1 ? "1 Gutachten" : `${decimal(proof.gutachten, 0)} Gutachten`} · ${proof.variants === 1 ? "für 1 Fahrzeugvariante freigegeben" : `für ${decimal(proof.variants, 0)} Fahrzeugvarianten freigegeben`} · Freigabe vor dem Kauf geprüft`;
		});
		const reviews = (0, vue_exports.computed)(() => props.reviews ?? []);
		function starsLabel(n) {
			return n === 1 ? "1 von 5 Sternen" : `${n} von 5 Sternen`;
		}
		const zoomOpen = (0, vue_exports.ref)(false);
		const basket = useForm({
			kind: "WHEEL",
			wheelConfigId: 0,
			tyreVariantId: null,
			rearTyreVariantId: null,
			weightColourId: null,
			rdks: null,
			quantity: 4
		});
		const mode = (0, vue_exports.ref)("felgen");
		const isSet = (0, vue_exports.computed)(() => mode.value === "komplettrad");
		const offer = (0, vue_exports.computed)(() => selected.value?.komplettrad ?? null);
		const tyreId = (0, vue_exports.ref)(null);
		(0, vue_exports.watch)(offer, (current) => {
			const ids = current?.tyres.map((t) => t.id) ?? [];
			if (tyreId.value === null || !ids.includes(tyreId.value)) tyreId.value = ids[0] ?? null;
		}, { immediate: true });
		const tyre = (0, vue_exports.computed)(() => offer.value?.tyres.find((t) => t.id === tyreId.value) ?? null);
		const combinations = (0, vue_exports.computed)(() => offer.value?.combinations?.length ? offer.value.combinations : null);
		const setKey = (0, vue_exports.ref)(null);
		const chosenSet = (0, vue_exports.computed)(() => combinations.value?.flatMap((c) => c.sets).find((s) => s.key === setKey.value) ?? null);
		const chosenCombination = (0, vue_exports.computed)(() => combinations.value?.find((c) => c.sets.some((s) => s.key === setKey.value)) ?? null);
		const chosenAnswer = (0, vue_exports.computed)(() => {
			if (!isSet.value) return null;
			return combinations.value ? chosenCombination.value?.answer ?? null : tyre.value?.answer ?? null;
		});
		const options = (0, vue_exports.computed)(() => props.komplettradOptions ?? null);
		const colourId = (0, vue_exports.ref)(options.value?.colours.find((c) => c.isDefault)?.id ?? options.value?.colours[0]?.id ?? null);
		const rdks = (0, vue_exports.ref)(options.value?.tpms.choice ?? null);
		const setPrice = (0, vue_exports.computed)(() => {
			const set = chosenSet.value;
			if (set !== null) {
				const priced = set.prices?.find((p) => p.colourId === colourId.value) ?? set;
				return {
					perWheel: null,
					forFour: priced.forFour,
					perWheelFront: priced.perWheelFront,
					perWheelRear: priced.perWheelRear
				};
			}
			const current = tyre.value;
			if (current === null) return null;
			const priced = current.prices?.find((p) => p.colourId === colourId.value) ?? {
				perWheel: current.perWheel,
				forFour: current.forFour
			};
			return {
				perWheel: priced.perWheel,
				forFour: priced.forFour,
				perWheelFront: null,
				perWheelRear: null
			};
		});
		const sensorLine = (0, vue_exports.computed)(() => {
			const tpms = options.value?.tpms;
			return isSet.value && rdks.value === "ja" && tpms?.available && tpms.yesTotal ? `+ ${tpms.yesTotal} für ${tpms.quantity} RDKS-Sensoren` : null;
		});
		const setFrom = (0, vue_exports.computed)(() => {
			if (combinations.value) {
				const sets = combinations.value.flatMap((c) => c.sets).map((s) => s.prices?.find((p) => p.colourId === colourId.value) ?? s);
				return sets.length === 0 ? null : sets.reduce((low, p) => p.forFourCents < low.forFourCents ? p : low).forFour;
			}
			const priced = (offer.value?.tyres ?? []).map((t) => t.prices?.find((p) => p.colourId === colourId.value) ?? {
				perWheel: t.perWheel,
				forFourCents: t.forFourCents
			});
			return priced.length === 0 ? null : priced.reduce((low, p) => p.forFourCents < low.forFourCents ? p : low).perWheel;
		});
		const setFromUnit = (0, vue_exports.computed)(() => combinations.value ? "für 2 + 2" : "pro Rad");
		(0, vue_exports.watch)([
			mode,
			() => selected.value?.id,
			tyreId,
			setKey,
			colourId
		], () => basket.clearErrors());
		const amount = (0, vue_exports.ref)(4);
		const designationApart = (0, vue_exports.computed)(() => {
			const designation = props.product.typeDesignation?.trim() ?? "";
			return designation !== "" && !`${props.product.brandName} ${props.product.modelName}`.toLocaleLowerCase("de-DE").includes(designation.toLocaleLowerCase("de-DE"));
		});
		const maxAmount = (0, vue_exports.computed)(() => {
			const offered = selected.value?.amounts?.map((a) => a.quantity) ?? [];
			return Math.max(1, ...offered);
		});
		(0, vue_exports.watch)(maxAmount, (max) => {
			amount.value = Math.min(Math.max(1, amount.value), max);
		}, { immediate: true });
		(0, vue_exports.watch)(amount, () => basket.clearErrors());
		const amountPrice = (0, vue_exports.computed)(() => selected.value?.amounts?.find((a) => a.quantity === amount.value) ?? null);
		const amountNote = (0, vue_exports.computed)(() => {
			const current = selected.value;
			if (current === null || amountPrice.value === null) return `pro Felge, ${terms.value.note}`;
			return `${amount.value} × ${current.price} = ${amountPrice.value.text}, ${terms.value.note}`;
		});
		const stockLabel = (0, vue_exports.computed)(() => {
			const inStock = selected.value?.inStock === true;
			if (props.demo === true) return inStock ? "Beispielsortiment" : "Beispielsortiment · nicht verfügbar";
			return inStock ? "Verfügbar" : "Nicht verfügbar";
		});
		const unavailableHint = (0, vue_exports.computed)(() => {
			const current = selected.value;
			if (current === null || current.inStock) return "";
			if (props.configs.some((c) => c.id !== current.id && c.inStock && sellable(c))) return "Wähl eine andere Größe oder Farbe.";
			return current.verdict === null ? "Diese Felge ist zurzeit in keiner Größe oder Farbe verfügbar." : "Für dein Fahrzeug ist diese Felge zurzeit in keiner anderen Größe oder Farbe verfügbar.";
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
			if (isSet.value) return combinations.value ? chosenSet.value !== null : tyre.value !== null;
			return current.verdict === null || current.verdict.sellable || current.verdict.rimSellable === true;
		});
		const papersFirst = (0, vue_exports.computed)(() => selected.value !== null && selected.value.inStock && waitsForPapers(selected.value.verdict) && (isSet.value || selected.value.verdict?.rimSellable !== true));
		const buyLabel = (0, vue_exports.computed)(() => {
			if (basket.processing) return "Wird hinzugefügt …";
			if (selected.value !== null && !selected.value.inStock) return "In den Warenkorb";
			if (papersFirst.value) return "Werte eintragen";
			if (isSet.value) return (combinations.value ? chosenSet.value === null : tyre.value === null) ? "Komplettrad gerade nicht möglich" : "Als Komplettrad in den Warenkorb";
			return "In den Warenkorb";
		});
		const shownPrice = (0, vue_exports.computed)(() => {
			if (isSet.value) return setPrice.value?.forFour ?? null;
			return amountPrice.value?.text ?? selected.value?.price ?? config.fromPrice.value;
		});
		const shownNote = (0, vue_exports.computed)(() => {
			if (!isSet.value) return amountNote.value;
			const set = offer.value?.quantity ?? 4;
			const price = setPrice.value;
			if (price === null) return "";
			if (price.perWheelFront !== null && price.perWheelRear !== null) return price.perWheelFront === price.perWheelRear ? `für 2 + 2 Kompletträder, pro Rad ${price.perWheelFront}` : `für 2 + 2 Kompletträder, pro Rad vorne ${price.perWheelFront}, hinten ${price.perWheelRear}`;
			return `für ${set} Kompletträder, pro Rad ${price.perWheel}, ${terms.value.note}`;
		});
		const setLegal = (0, vue_exports.computed)(() => isSet.value && chosenSet.value !== null ? terms.value.note : null);
		const addError = (0, vue_exports.computed)(() => basket.errors.tyreVariantId ?? basket.errors.rearTyreVariantId ?? basket.errors.wheelConfigId ?? basket.errors.rdks ?? basket.errors.weightColourId ?? null);
		const weight = (0, vue_exports.computed)(() => {
			const grams = selected.value?.weightG;
			return grams === null || grams === void 0 ? null : withUnit(decimal(grams / 1e3, 1), "kg");
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
		const stickyShown = (0, vue_exports.computed)(() => !buyVisible.value && Boolean(selected.value));
		claimBottomEdge(() => stickyShown.value);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: `${__props.product.brandName} ${__props.product.modelName}` }, null, _parent));
			_push(`<section class="section-dense" data-v-a4272c8a><div class="wrap" data-v-a4272c8a><nav class="pdp__crumbs t-small" aria-label="Brotkrumen" data-v-a4272c8a>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Startseite`);
					else return [(0, vue_exports.createTextVNode)("Startseite")];
				}),
				_: 1
			}, _parent));
			_push(`<span aria-hidden="true" data-v-a4272c8a>/</span>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/felgen" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Felgen`);
					else return [(0, vue_exports.createTextVNode)("Felgen")];
				}),
				_: 1
			}, _parent));
			_push(`<span aria-hidden="true" data-v-a4272c8a>/</span><span aria-current="page" translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(__props.product.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(__props.product.modelName)}</span></nav><div class="pdp" data-v-a4272c8a><div class="pdp__gallery" data-v-a4272c8a><div class="well pdp__well" data-v-a4272c8a>`);
			if (shot.value) {
				_push(`<button type="button" class="pdp__zoom" aria-haspopup="dialog"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Foto vergrößern: ${shotAlt.value}`)} data-v-a4272c8a>`);
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
				_push(`<div class="pdp__thumbs" role="group" aria-label="Ansichten" data-v-a4272c8a><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(shots.value, (view, i) => {
					_push(`<button type="button" class="pdp__thumb"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", i === shotIndex.value)}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", view.label)} data-v-a4272c8a>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
						image: view,
						alt: "",
						sizes: "72px",
						soon: "",
						class: "pdp__thumb-picture"
					}, null, _parent));
					_push(`</button>`);
				});
				_push(`<!--]--></div>`);
			} else _push(`<!---->`);
			if (photoNote.value) _push(`<p class="t-small quiet pdp__photo-note" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(photoNote.value)}</p>`);
			else _push(`<!---->`);
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
											_push(`<div class="dialog__head" data-v-a4272c8a${_scopeId}>`);
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
											_push(`</div><div class="pdp-zoom__frame" data-v-a4272c8a${_scopeId}>`);
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
			_push(`</div><div class="pdp__buy" data-v-a4272c8a><h1 class="t-h1" translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(__props.product.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(__props.product.modelName)}</h1>`);
			if (designationApart.value) {
				_push(`<p class="data pdp__type" data-v-a4272c8a>Radtypenbezeichnung `);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, {
					text: __props.product.typeDesignation ?? "",
					whole: ""
				}, null, _parent));
				_push(`</p>`);
			} else _push(`<!---->`);
			if (__props.product.rating !== null && __props.product.ratingCount > 0) {
				_push(`<a href="#bewertungen" class="stars pdp__rating" data-v-a4272c8a><span class="stars__glyph" aria-hidden="true" data-v-a4272c8a>★</span><span class="tabular" data-v-a4272c8a>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: __props.product.ratingLabel ?? "" }, null, _parent));
				_push(`</span></a>`);
			} else if (proofLine.value) _push(`<p class="t-small pdp__proof" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(proofLine.value)}</p>`);
			else _push(`<!---->`);
			_push(`<div class="pdp__block" data-v-a4272c8a><span class="label" data-v-a4272c8a>Farbe · <span translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(finish.value?.name)}</span></span><div class="pdp__swatches" data-v-a4272c8a><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.finishes, (item) => {
				_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pdp__swatch--on": item.id === (0, vue_exports.unref)(config).finishId.value }, "pdp__swatch"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", item.id === (0, vue_exports.unref)(config).finishId.value)} data-v-a4272c8a><span class="pdp__dot" data-qa-ignore style="${(0, server_renderer_exports.ssrRenderStyle)(item.hex ? { "--swatch": item.hex } : void 0)}" data-v-a4272c8a></span><span translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(item.name)}</span></button>`);
			});
			_push(`<!--]--></div></div><div id="groessen" class="pdp__block" data-v-a4272c8a><span class="label" data-v-a4272c8a>Durchmesser (<span translate="no" data-v-a4272c8a>Zoll</span>)</span><div class="chip-row pdp__chips" data-v-a4272c8a><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(config).sizes.value, (size) => {
				_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{
					"chip--on": selected.value?.id === size.config.id,
					"chip--blocked": size.blocked,
					"chip--unconfirmed": size.unconfirmed
				}, "chip"])}" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(size.blocked) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", selected.value?.id === size.config.id)}${(0, server_renderer_exports.ssrRenderAttr)("title", size.reason ?? void 0)} data-v-a4272c8a><span translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(size.label)}</span></button>`);
			});
			_push(`<!--]--></div>`);
			if (blockedNote.value) _push(`<p class="t-small quiet pdp__note" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(blockedNote.value)}</p>`);
			else _push(`<!---->`);
			if (unconfirmedNote.value) _push(`<p class="t-small quiet pdp__note" data-note="unconfirmed" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(unconfirmedNote.value)}</p>`);
			else _push(`<!---->`);
			_push(`</div>`);
			if ((0, vue_exports.unref)(config).variants.value.length > 1) {
				_push(`<div class="pdp__block pdp__variants" data-v-a4272c8a><span id="pdp-variants-label" class="label" data-v-a4272c8a>Breite und Einpresstiefe (ET)</span><div class="chip-row pdp__chips" role="group" aria-labelledby="pdp-variants-label" data-v-a4272c8a><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(config).variants.value, (variant) => {
					_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{
						"chip--on": selected.value?.id === variant.id,
						"chip--blocked": variant.blocked,
						"chip--unconfirmed": variant.unconfirmed
					}, "chip"])}" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(variant.blocked) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", selected.value?.id === variant.id)}${(0, server_renderer_exports.ssrRenderAttr)("title", variant.reason ?? void 0)} data-v-a4272c8a><span translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(variant.label)}</span></button>`);
				});
				_push(`<!--]--></div></div>`);
			} else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(FitmentPanel_default, {
				class: "pdp__fit",
				verdict: selected.value?.verdict ?? null,
				vehicle: (0, vue_exports.unref)(shared).vehicle,
				"config-id": selected.value?.id ?? null,
				chosen: chosenAnswer.value,
				"ask-href": askAboutTyres.value
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
			_push((0, server_renderer_exports.ssrRenderComponent)(BuyModeChoice_default, {
				modelValue: mode.value,
				"onUpdate:modelValue": ($event) => mode.value = $event,
				class: "pdp__block pdp__mode",
				"rim-price": selected.value?.price ?? null,
				"set-from": setFrom.value,
				"set-from-unit": setFromUnit.value
			}, null, _parent));
			if (isSet.value && offer.value) _push((0, server_renderer_exports.ssrRenderComponent)(KomplettradChoice_default, {
				modelValue: tyreId.value,
				"onUpdate:modelValue": ($event) => tyreId.value = $event,
				"set-key": setKey.value,
				"onUpdate:setKey": ($event) => setKey.value = $event,
				"colour-id": colourId.value,
				"onUpdate:colourId": ($event) => colourId.value = $event,
				rdks: rdks.value,
				"onUpdate:rdks": ($event) => rdks.value = $event,
				class: "pdp__block",
				offer: offer.value,
				options: options.value
			}, null, _parent));
			else _push(`<!---->`);
			_push(`<div class="pdp__price" data-v-a4272c8a>`);
			if (shownPrice.value) {
				_push(`<div class="pdp__price-row" data-v-a4272c8a><div data-v-a4272c8a><p class="price price--lg pdp__total" translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(shownPrice.value)}</p><p class="price-note pdp__each" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(shownNote.value)}</p>`);
				if (setLegal.value) _push(`<p class="price-legal" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(setLegal.value)}</p>`);
				else _push(`<!---->`);
				if (isSet.value && offer.value?.priceOpen) _push(`<p class="price-note" data-v-a4272c8a>Ohne Montage und Auswuchten – der Preis dafür steht noch nicht fest.</p>`);
				else _push(`<!---->`);
				if (sensorLine.value) _push(`<p class="price-note pdp__sensors" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(sensorLine.value)}</p>`);
				else _push(`<!---->`);
				_push(`</div>`);
				if (!isSet.value && selected.value && amountPrice.value) _push((0, server_renderer_exports.ssrRenderComponent)(AmountStepper_default, {
					modelValue: amount.value,
					"onUpdate:modelValue": ($event) => amount.value = $event,
					class: "pdp__amount",
					label: "Anzahl",
					min: 1,
					max: maxAmount.value,
					disabled: !canBuy.value
				}, null, _parent));
				else _push(`<!---->`);
				_push(`</div>`);
			} else _push(`<!---->`);
			if (__props.shipping) _push(`<p class="price-note pdp__shipping" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(__props.shipping)}</p>`);
			else _push(`<!---->`);
			_push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([stockTone.value, "tag pdp__stock"])}" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(stockLabel.value)}</span>`);
			if (unavailableHint.value) _push(`<p id="pdp-unavailable" class="t-small pdp__unavailable" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(unavailableHint.value)}</p>`);
			else _push(`<!---->`);
			if (__props.demo) _push(`<p class="t-small pdp__demo" data-v-a4272c8a> Beispielsortiment: Diese Felge kannst du dir ansehen und in den Warenkorb legen, bestellen kannst du sie noch nicht. </p>`);
			else if (__props.acceptance) _push(`<p class="t-small pdp__demo" data-v-a4272c8a> Demodaten zum Ausprobieren: Bestellen geht hier nur mit der Testzahlung, verschickt wird nichts. </p>`);
			else _push(`<!---->`);
			_push(`</div><div data-v-a4272c8a><button class="btn btn--primary btn--block btn--lg pdp__add" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!canBuy.value && !papersFirst.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(basket).processing ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", unavailableHint.value ? "pdp-unavailable" : void 0)} data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(buyLabel.value)}</button>`);
			if (addError.value) {
				_push(`<p class="notice notice--bad pdp__add-error" role="alert" data-v-a4272c8a>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "warning",
					size: 20
				}, null, _parent));
				_push(`<span data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(addError.value)}</span></p>`);
			} else _push(`<!---->`);
			_push(`</div></div></div>`);
			if (selected.value?.verdict?.detail && (0, vue_exports.unref)(shared).vehicle) _push((0, server_renderer_exports.ssrRenderComponent)(FitmentDetail_default, {
				detail: selected.value.verdict.detail,
				"vehicle-label": (0, vue_exports.unref)(shared).vehicle.label,
				omit: [(0, vue_exports.unref)(ENTRY_REQUIRED), (0, vue_exports.unref)(ABNAHME_REQUIRED)]
			}, null, _parent));
			else _push(`<!---->`);
			if (isSet.value && selected.value && selected.value.mischbereifung) _push((0, server_renderer_exports.ssrRenderComponent)(MischbereifungOffer_default, {
				"weight-colour-id": colourId.value,
				rdks: rdks.value,
				class: "pdp__komplettrad",
				offer: selected.value.mischbereifung,
				"wheel-config-id": selected.value.id
			}, null, _parent));
			else _push(`<!---->`);
			if (selected.value) {
				_push(`<section class="pdp__specs" aria-labelledby="pdp-specs" data-v-a4272c8a><h2 id="pdp-specs" class="t-h2" data-v-a4272c8a>Felgendetails</h2><p class="t-small quiet pdp__specs-for" data-v-a4272c8a>Für `);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: selected.value.fullLabel }, null, _parent));
				_push(`</p><dl class="spec" data-v-a4272c8a><div class="spec__row" data-v-a4272c8a><dt data-v-a4272c8a>Größe</dt><dd class="t-mono" translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(selected.value.sizeLabel)}</dd></div><div class="spec__row" data-v-a4272c8a><dt data-v-a4272c8a>Lochkreis</dt><dd class="t-mono" translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(selected.value.boltPattern)}</dd></div>`);
				if (documentBore.value) _push(`<div class="spec__row spec__row--doc" data-v-a4272c8a><dt data-v-a4272c8a> Mittenlochbohrung für dein Fahrzeug <span class="spec__hint" data-v-a4272c8a>laut Gutachten</span></dt><dd class="t-mono" translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(documentBore.value)}</dd></div>`);
				else _push(`<!---->`);
				_push(`<div class="spec__row" data-v-a4272c8a><dt data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(rimBoreLabel.value)}</dt><dd class="t-mono" translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(selected.value.centreBore)}</dd></div><div class="spec__row" data-v-a4272c8a><dt data-v-a4272c8a>Einpresstiefe (ET)</dt><dd class="t-mono" translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)(selected.value.etMm, "mm"))}</dd></div>`);
				if (hump.value) _push(`<div class="spec__row" data-v-a4272c8a><dt data-v-a4272c8a>Hump</dt><dd class="t-mono" translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(hump.value)}</dd></div>`);
				else _push(`<!---->`);
				if (finish.value) _push(`<div class="spec__row" data-v-a4272c8a><dt data-v-a4272c8a>Farbe</dt><dd class="t-mono" translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(finish.value.name)}</dd></div>`);
				else _push(`<!---->`);
				if (__props.product.spokes > 0) _push(`<div class="spec__row" data-v-a4272c8a><dt data-v-a4272c8a>Speichen</dt><dd class="t-mono" translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(__props.product.spokes)}</dd></div>`);
				else _push(`<!---->`);
				if (weight.value) _push(`<div class="spec__row" data-v-a4272c8a><dt data-v-a4272c8a>Gewicht pro Felge</dt><dd class="t-mono" translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(weight.value)}</dd></div>`);
				else _push(`<!---->`);
				if (maxLoad.value) _push(`<div class="spec__row" data-v-a4272c8a><dt data-v-a4272c8a>Traglast</dt><dd class="t-mono" translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(maxLoad.value)}</dd></div>`);
				else _push(`<!---->`);
				if (selected.value.kbaNumber) _push(`<div class="spec__row" data-v-a4272c8a><dt data-v-a4272c8a>KBA-Nummer</dt><dd class="t-mono" translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(selected.value.kbaNumber)}</dd></div>`);
				else _push(`<!---->`);
				_push(`<div class="spec__row" data-v-a4272c8a><dt data-v-a4272c8a>Artikelnummer</dt><dd class="t-mono" translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(selected.value.sku)}</dd></div></dl>`);
				if (boreConflict.value) _push(`<p class="t-small quiet pdp__specs-note" data-v-a4272c8a> Für dein Fahrzeug nennen die Gutachten unterschiedliche Mittenlochbohrungen. Wir zeigen dir deshalb nur das Maß der Felge. </p>`);
				else _push(`<!---->`);
				if (__props.product.descriptionDe) _push(`<p class="t-body pdp__desc" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(__props.product.descriptionDe)}</p>`);
				else _push(`<!---->`);
				_push(`</section>`);
			} else _push(`<!---->`);
			if (reviews.value.length > 0) {
				_push(`<section id="bewertungen" class="pdp__reviews" aria-labelledby="pdp-reviews" data-v-a4272c8a><h2 id="pdp-reviews" class="t-h2" data-v-a4272c8a>Bewertungen</h2>`);
				if (__props.product.ratingLabel) {
					_push(`<p class="stars pdp__reviews-sum" data-v-a4272c8a><span class="stars__glyph" aria-hidden="true" data-v-a4272c8a>★</span><span class="tabular" data-v-a4272c8a>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: __props.product.ratingLabel }, null, _parent));
					_push(`</span></p>`);
				} else _push(`<!---->`);
				_push(`<p class="t-small quiet pdp__reviews-check" data-v-a4272c8a> Alle Bewertungen stammen von Kundinnen und Kunden, die diese Felge hier gekauft haben. Wir prüfen das über die Bestellnummer. </p><ul class="pdp__review-list" data-v-a4272c8a><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(reviews.value, (review) => {
					_push(`<li class="pdp__review" data-v-a4272c8a><p class="pdp__review-head" data-v-a4272c8a><span class="pdp__review-stars" role="img"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", starsLabel(review.rating))} data-v-a4272c8a><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(5, (n) => {
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							key: n,
							name: "star",
							size: 16,
							class: n <= review.rating ? "pdp__star-on" : "pdp__star-off"
						}, null, _parent));
					});
					_push(`<!--]--></span><span class="t-small quiet" data-v-a4272c8a>Geprüfter Kauf`);
					if (review.at) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(review.at)}<!--]-->`);
					else _push(`<!---->`);
					_push(`</span></p>`);
					if (review.body) _push(`<p class="t-body pdp__review-body" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(review.body)}</p>`);
					else _push(`<!---->`);
					if (review.reply) _push(`<p class="t-small pdp__review-reply" data-v-a4272c8a><strong data-v-a4272c8a>Antwort von RIMIFY:</strong> ${(0, server_renderer_exports.ssrInterpolate)(review.reply)}</p>`);
					else _push(`<!---->`);
					_push(`</li>`);
				});
				_push(`<!--]--></ul></section>`);
			} else _push(`<!---->`);
			_push(`<section class="pdp__gpsr" aria-labelledby="pdp-gpsr" data-v-a4272c8a><h2 id="pdp-gpsr" class="t-h3" data-v-a4272c8a>Hersteller und Produktsicherheit</h2>`);
			if (__props.product.manufacturer) {
				_push(`<dl class="pdp__gpsr-list" data-v-a4272c8a><div class="pdp__gpsr-row" data-v-a4272c8a><dt data-v-a4272c8a>Hersteller</dt><dd class="pdp__gpsr-value" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.name)}<br data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.address)}<br data-v-a4272c8a>`);
				if (webAddress(__props.product.manufacturer.contact)) _push(`<a class="link"${(0, server_renderer_exports.ssrRenderAttr)("href", webAddress(__props.product.manufacturer.contact) ?? void 0)} rel="noopener" target="_blank" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.contact)}</a>`);
				else _push(`<span translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.contact)}</span>`);
				_push(`</dd></div>`);
				if (__props.product.manufacturer.euResponsible) {
					_push(`<div class="pdp__gpsr-row" data-v-a4272c8a><dt data-v-a4272c8a>Verantwortliche Person in der EU</dt><dd class="pdp__gpsr-value" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.euResponsible.name)}`);
					if (__props.product.manufacturer.euResponsible.address) _push(`<!--[--><br data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.euResponsible.address)}<!--]-->`);
					else _push(`<!---->`);
					if (__props.product.manufacturer.euResponsible.contact) _push(`<!--[--><br data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.euResponsible.contact)}<!--]-->`);
					else _push(`<!---->`);
					_push(`</dd></div>`);
				} else _push(`<!---->`);
				_push(`<div class="pdp__gpsr-row" data-v-a4272c8a><dt data-v-a4272c8a>Produkt</dt><dd class="pdp__gpsr-value" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(__props.product.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(__props.product.modelName)}`);
				if (designationApart.value) _push(`<!--[--> · Radtypenbezeichnung ${(0, server_renderer_exports.ssrInterpolate)(__props.product.typeDesignation)}<!--]-->`);
				else _push(`<!---->`);
				if (selected.value) _push(`<!--[--> · Artikelnummer ${(0, server_renderer_exports.ssrInterpolate)(selected.value.sku)}<!--]-->`);
				else _push(`<!---->`);
				_push(`</dd></div>`);
				if (__props.product.manufacturer.safetyNote) _push(`<div class="pdp__gpsr-row" data-v-a4272c8a><dt data-v-a4272c8a>Sicherheitshinweise</dt><dd class="pdp__gpsr-value" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.safetyNote)}</dd></div>`);
				else _push(`<!---->`);
				_push(`</dl>`);
			} else {
				_push(`<p class="t-small quiet" data-v-a4272c8a> Die Angaben des Herstellers zu dieser Felge liegen uns noch nicht vor. Fragen dazu beantworten wir dir gern – `);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: askAboutMaker.value }, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`schreib uns`);
						else return [(0, vue_exports.createTextVNode)("schreib uns")];
					}),
					_: 1
				}, _parent));
				_push(`. </p>`);
			}
			_push(`</section></div></section>`);
			if (stickyShown.value) {
				_push(`<div class="stickybar pdp__sticky" data-v-a4272c8a>`);
				if (shownPrice.value) {
					_push(`<div class="pdp__sticky-price" data-v-a4272c8a><p class="price" translate="no" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(shownPrice.value)}</p>`);
					if (isSet.value) _push(`<p class="price-note" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(chosenSet.value ? "für 2 + 2 Kompletträder" : `für ${offer.value?.quantity ?? 4} Kompletträder`)}</p>`);
					else _push(`<p class="price-note" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(amountPrice.value ? amount.value === 1 ? "für 1 Felge" : `für ${amount.value} Felgen` : "pro Felge")}</p>`);
					_push(`<p class="price-legal pdp__sticky-legal" data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(terms.value.note)}</p></div>`);
				} else _push(`<!---->`);
				_push(`<button class="btn btn--primary pdp__sticky-btn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!canBuy.value && !papersFirst.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(basket).processing ? "true" : void 0)} data-v-a4272c8a>${(0, server_renderer_exports.ssrInterpolate)(unavailableHint.value ? "Nicht verfügbar" : isSet.value && canBuy.value && !(0, vue_exports.unref)(basket).processing ? "In den Warenkorb" : buyLabel.value)}</button></div>`);
			} else _push(`<!---->`);
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
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-a4272c8a"]]);
//#endregion
export { Index_default as default };
