import { a as link_default, d as vue_exports, i as head_default, l as router, o as useForm, s as usePage } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DBu8iEu8.js";
import { c as extrasHint, d as freeStandardColour, f as initialExtras, g as sortCards, l as filterCards, m as priceBands, n as KomplettradRefusal_default, p as offerOf, r as FitmentPanel_default, s as FitmentDetail_default, u as flowSum } from "./basketAdd-yiQEPZGC.js";
import { t as ProductPhoto_default } from "./ProductPhoto-B_zukh2W.js";
import { t as Icon_default } from "./Icon-Dtt5GxoH.js";
import { t as Picture_default } from "./Picture-DHjcoc5m.js";
import { t as StepBar_default } from "./StepBar-BWZ05iZb.js";
import { O as useShared, S as claimBottomEdge, c as contactHref, h as usePriceTerms } from "./useShopFeedback-Dly7FSUZ.js";
import { n as ENTRY_REQUIRED, t as ABNAHME_REQUIRED } from "./papers-CLjNHZni.js";
import { t as formatMoney } from "./num-Dee3nUwD.js";
import { t as AppLayout_default } from "./AppLayout-GLNiqhIh.js";
import { t as ChosenCheck_default } from "./ChosenCheck-BH7e3qzY.js";
import { t as TyreCard_default } from "./TyreCard-ez6r-JAy.js";
import { t as TyreDetails_default } from "./TyreDetails-HOXF79rU.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-DjkACiAr.js";
// resources/js/Pages/Komplettrad/Index.vue?vue&type=script&setup=true&lang.ts
var FIRST = 6;
var PAIR_TILES = 8;
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		product: {},
		config: {},
		options: {},
		photos: {},
		mounting: {},
		schritt: {},
		inBasket: {},
		rimChoices: {}
	},
	setup(__props) {
		/**
		* The Komplettrad, step by step (the Gutachten rework §9): 1 Reifen, as tiles with pictures, filters and more on request, 2 Extras,
		* nothing chosen for the customer, 3 Warenkorb. The address names the step, so Back goes one step back and a link opens the step it
		* names. What was chosen stays for this version in this browser's session.
		*
		* Since D-489 (the client's round of 18.11.2026, item 5) there is no step „Felge“: it only repeated the rim chosen on the product
		* page. What it held moved into the tyre step — the rim in one line with its photo and price, the other dimensions to switch to
		* (D-488), „Andere Ausführung wählen“, a refusal with its way on — and „Zurück“ there leads to the product page, the rim in the
		* address. The RIMIFY-Check for the sizes chosen stands right above „Weiter“ (D-488), and again, whole, in the last step.
		*
		* Nothing here decides whether a tyre may be fitted: only what the server sent is a card (TyreEligibility, R-13), and the basket asks
		* the engine again on the add (R-11). Every figure is the server's.
		*/
		const props = __props;
		const STEPS = [
			"Reifen",
			"Extras",
			"Warenkorb"
		];
		const STEP_NAMES = [
			"reifen",
			"extras",
			"warenkorb"
		];
		const shared = useShared();
		const terms = usePriceTerms();
		const page = usePage();
		const offer = (0, vue_exports.computed)(() => offerOf(props.config, props.photos));
		const tpms = (0, vue_exports.computed)(() => props.options?.tpms ?? null);
		const colours = (0, vue_exports.computed)(() => props.options?.colours ?? []);
		const productHref = (0, vue_exports.computed)(() => `/felgen/${props.product.slug}?ausfuehrung=${props.product.finishId}&groesse=${props.config.id}${props.config.rearId ? `&satz=${props.config.id}-${props.config.rearId}` : ""}`);
		const canGoOn = (0, vue_exports.computed)(() => props.config.inStock && offer.value.refusal === null);
		const start = initialExtras();
		const colourId = (0, vue_exports.ref)(start.colourId);
		const rdks = (0, vue_exports.ref)(start.rdks);
		const chosenKey = (0, vue_exports.ref)(null);
		const mode = (0, vue_exports.ref)(offer.value.same.length > 0 ? "same" : "mixed");
		const pairKey = (0, vue_exports.ref)(offer.value.pairs.find((pair) => pair.cards.length > 0)?.key ?? offer.value.pairs[0]?.key ?? null);
		const pair = (0, vue_exports.computed)(() => offer.value.pairs.find((item) => item.key === pairKey.value) ?? null);
		const chosenMinimum = (0, vue_exports.computed)(() => (mode.value === "same" ? offer.value.minSentence : pair.value?.minSentence) ?? null);
		const inMode = (0, vue_exports.computed)(() => mode.value === "same" ? offer.value.same : pair.value?.cards ?? []);
		const allCards = (0, vue_exports.computed)(() => [...offer.value.same, ...offer.value.pairs.flatMap((item) => item.cards)]);
		const chosen = (0, vue_exports.computed)(() => allCards.value.find((card) => card.key === chosenKey.value) ?? null);
		const colour = (0, vue_exports.computed)(() => colours.value.find((item) => item.id === colourId.value) ?? null);
		const standardColour = (0, vue_exports.computed)(() => freeStandardColour(colours.value));
		const shownColour = (0, vue_exports.computed)(() => colour.value ?? standardColour.value);
		const extrasOpen = (0, vue_exports.computed)(() => extrasHint(tpms.value, rdks.value, colours.value, colourId.value));
		const rimChoices = (0, vue_exports.computed)(() => props.rimChoices ?? []);
		const currentRim = (0, vue_exports.computed)(() => rimChoices.value.find((choice) => choice.current) ?? null);
		const checkFor = (0, vue_exports.computed)(() => {
			if (mode.value === "mixed") return pair.value?.answer ? {
				answer: pair.value.answer,
				sizes: pairLine(pair.value)
			} : null;
			const card = chosen.value?.mode === "same" ? chosen.value : null;
			const only = [...new Set(offer.value.same.map((item) => item.answer?.chosen ?? ""))].length === 1 ? offer.value.same[0] ?? null : null;
			const shown = card ?? only;
			return shown?.answer ? {
				answer: shown.answer,
				sizes: shown.answer.chosen ?? ""
			} : null;
		});
		const checkDocument = (0, vue_exports.computed)(() => {
			const document = props.config.verdict?.document;
			return document?.pdf ? {
				url: document.pdf.url,
				page: document.pdf.page ?? null,
				example: document.example === true
			} : null;
		});
		const STANDING_WORD = {
			auflagen: "Mit Auflagen",
			hinweise: "Mit Hinweisen",
			keine: "Ohne Auflagen"
		};
		function standingOf(answer) {
			return answer?.standing ?? null;
		}
		function toneOf(answer) {
			const standing = standingOf(answer);
			if (standing === "auflagen") return answer?.hint ?? "yellow";
			return standing === "keine" ? "green" : "quiet";
		}
		const filter = (0, vue_exports.reactive)({
			seasons: [],
			brands: [],
			band: ""
		});
		const filtersOpen = (0, vue_exports.ref)(false);
		const filterable = (0, vue_exports.computed)(() => seasons.value.length > 1 || brands.value.length > 1 || bands.value.length > 0);
		const filtersOn = (0, vue_exports.computed)(() => filter.seasons.length + filter.brands.length + (filter.band === "" ? 0 : 1));
		const sort = (0, vue_exports.ref)("preis-auf");
		const all = (0, vue_exports.ref)(false);
		(0, vue_exports.ref)(null);
		const detailsKey = (0, vue_exports.ref)(null);
		const detailsOpen = (0, vue_exports.ref)(false);
		const bands = (0, vue_exports.computed)(() => priceBands(inMode.value));
		const seasons = (0, vue_exports.computed)(() => [...new Map(inMode.value.map((card) => [card.season, card.seasonLabel])).entries()]);
		const brands = (0, vue_exports.computed)(() => [...new Set(inMode.value.flatMap((card) => card.brands))].sort((a, b) => a.localeCompare(b, "de")));
		const list = (0, vue_exports.computed)(() => sortCards(filterCards(inMode.value, filter, bands.value), sort.value));
		const shown = (0, vue_exports.computed)(() => {
			if (all.value || list.value.length <= FIRST) return list.value;
			const first = list.value.slice(0, FIRST);
			const own = list.value.find((card) => card.key === chosenKey.value);
			return own && !first.includes(own) ? [...first.slice(0, 5), own] : first;
		});
		const details = (0, vue_exports.computed)(() => allCards.value.find((card) => card.key === detailsKey.value) ?? null);
		function pairLine(item) {
			return item.sameSize === true ? `vorne und hinten ${item.front}` : `vorne ${item.front} · hinten ${item.rear}`;
		}
		(0, vue_exports.watch)([
			filter,
			sort,
			mode,
			pairKey
		], () => {
			all.value = false;
		});
		function openDetails(key) {
			detailsKey.value = key;
			detailsOpen.value = true;
		}
		function allowed(to) {
			if (to >= 1 && (!canGoOn.value || chosen.value === null)) return 0;
			return to >= 2 && extrasOpen.value !== null ? 1 : to;
		}
		const step = (0, vue_exports.ref)(allowed((props.schritt ?? 1) - 1));
		const reached = (0, vue_exports.ref)(step.value);
		const settled = (0, vue_exports.ref)((props.schritt ?? 1) <= 1);
		(0, vue_exports.watch)(() => allowed(step.value), (fit) => {
			step.value = fit;
		});
		const tyreGone = (0, vue_exports.ref)(false);
		(0, vue_exports.watch)(allCards, (cards) => {
			if (chosenKey.value !== null && !cards.some((card) => card.key === chosenKey.value)) {
				chosenKey.value = null;
				tyreGone.value = true;
			}
		});
		(0, vue_exports.watch)(chosenKey, (key) => {
			if (key !== null) tyreGone.value = false;
		});
		(0, vue_exports.watch)([colours, tpms], () => {
			if (colourId.value !== null && !colours.value.some((item) => item.id === colourId.value)) colourId.value = null;
			if (rdks.value === "ja" && tpms.value?.available !== true) rdks.value = null;
		});
		(0, vue_exports.watch)(() => shared.value.vehicle?.id, () => {
			chosenKey.value = null;
			colourId.value = null;
			rdks.value = null;
		});
		(0, vue_exports.watch)(() => props.schritt, (now) => {
			step.value = allowed((now ?? 1) - 1);
			reached.value = Math.max(reached.value, step.value);
		});
		const STORE_KEY = (0, vue_exports.computed)(() => `rimify-komplettrad-${props.config.id}-${props.config.rearId ?? ""}-${shared.value.vehicle?.id ?? "ohne"}`);
		function go(to) {
			step.value = allowed(to);
			reached.value = Math.max(reached.value, step.value);
			const url = new URL(window.location.href);
			url.searchParams.set("schritt", STEP_NAMES[step.value] ?? "reifen");
			router.push({
				url: url.pathname + url.search,
				preserveScroll: true,
				preserveState: true,
				props: (current) => ({
					...current,
					schritt: step.value + 1
				})
			});
			window.scrollTo({ top: 0 });
			(0, vue_exports.nextTick)(() => document.querySelector(".kf-step__title")?.focus({ preventScroll: true }));
		}
		(0, vue_exports.onMounted)(() => {
			try {
				const saved = JSON.parse(sessionStorage.getItem(STORE_KEY.value) ?? "null");
				if (saved !== null) {
					const found = allCards.value.some((card) => card.key === saved.key);
					mode.value = saved.mode === "same" && offer.value.same.length > 0 ? "same" : offer.value.pairs.length > 0 ? "mixed" : "same";
					pairKey.value = offer.value.pairs.some((item) => item.key === saved.pair) ? saved.pair : pairKey.value;
					chosenKey.value = found ? saved.key : null;
					tyreGone.value = saved.key !== null && !found;
					colourId.value = colours.value.some((item) => item.id === saved.colour) ? saved.colour : null;
					rdks.value = saved.rdks === "nein" || saved.rdks === "ja" && tpms.value?.available === true ? saved.rdks : null;
					Object.assign(filter, {
						seasons: saved.seasons ?? [],
						brands: saved.brands ?? [],
						band: saved.band ?? ""
					});
					sort.value = saved.sort ?? sort.value;
					reached.value = Math.max(reached.value, saved.reached ?? 0);
				}
			} catch {}
			step.value = allowed((props.schritt ?? 1) - 1);
			reached.value = Math.max(reached.value, step.value);
			settled.value = true;
			(0, vue_exports.watch)([
				chosenKey,
				mode,
				pairKey,
				colourId,
				rdks,
				filter,
				sort,
				reached
			], () => {
				try {
					sessionStorage.setItem(STORE_KEY.value, JSON.stringify({
						key: chosenKey.value,
						mode: mode.value,
						pair: pairKey.value,
						colour: colourId.value,
						rdks: rdks.value,
						...filter,
						sort: sort.value,
						reached: reached.value
					}));
				} catch {}
			}, { deep: true });
		});
		const held = (0, vue_exports.computed)(() => {
			const card = chosen.value;
			return card !== null && props.inBasket.keys.includes(`wheel:${props.config.id}${props.config.rearId ? `:satz:${props.config.rearId}` : ""}:tyre:${card.frontTyreId}${card.rearTyreId === null ? "" : `:rear:${card.rearTyreId}`}`);
		});
		const rdksShared = (0, vue_exports.computed)(() => {
			const wheels = props.inBasket.wheels;
			const before = tpms.value?.choice === "ja" ? "Mit RDKS-Sensoren" : tpms.value?.choice === "nein" ? "Ohne RDKS-Sensoren" : null;
			if (wheels === 0) return null;
			return before === null ? `Deine Antwort gilt auch für die ${wheels} Räder in deinem Warenkorb.` : `Für die ${wheels} Räder in deinem Warenkorb steht „${before}“. Deine Antwort hier gilt für alle Räder im Warenkorb.`;
		});
		const rdksNote = (0, vue_exports.computed)(() => {
			const wheels = props.inBasket.wheels;
			if (wheels === 0 || rdks.value === null) return null;
			if (rdks.value === "ja") return `Die Sensoren für die ${wheels} Räder, die schon im Warenkorb liegen, sind in der Summe enthalten.`;
			return tpms.value?.choice === "ja" ? `Ohne RDKS-Sensoren gilt auch für die ${wheels} Räder, die schon im Warenkorb liegen.` : null;
		});
		const sum = (0, vue_exports.computed)(() => chosen.value ? flowSum(props.config, chosen.value, props.mounting, shownColour.value, tpms.value, rdks.value, props.inBasket.wheels) : null);
		const basket = useForm({
			kind: "WHEEL",
			wheelConfigId: props.config.id,
			rearWheelConfigId: props.config.rearId ?? null,
			tyreVariantId: null,
			rearTyreVariantId: null,
			weightColourId: null,
			rdks: null,
			quantity: 4,
			vehicleId: null
		});
		const offline = (0, vue_exports.ref)(false);
		const addError = (0, vue_exports.computed)(() => {
			const errors = basket.errors;
			return errors.tyreVariantId ?? errors.rearTyreVariantId ?? errors.wheelConfigId ?? errors.quantity ?? errors.weightColourId ?? errors.rdks ?? (offline.value ? "Keine Verbindung – es wurde nichts in den Warenkorb gelegt. Versuch es gleich noch einmal." : null);
		});
		(0, vue_exports.watch)([
			chosenKey,
			colourId,
			rdks
		], () => basket.clearErrors());
		claimBottomEdge(() => true);
		const askHref = (0, vue_exports.computed)(() => contactHref({
			subject: `Frage zum Komplettrad: ${props.product.brandName} ${props.product.modelName}, ${props.config.sizeLabel}`,
			from: page.url
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: `Komplettrad: ${__props.product.brandName} ${__props.product.modelName}` }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<meta head-key="robots" name="robots" content="noindex" data-v-02a2e4b7${_scopeId}>`);
					else return [(0, vue_exports.createVNode)("meta", {
						"head-key": "robots",
						name: "robots",
						content: "noindex"
					})];
				}),
				_: 1
			}, _parent));
			_push(`<section class="section--tight" data-v-02a2e4b7><div class="container kf" data-v-02a2e4b7><header class="kf-head" data-v-02a2e4b7><h1 class="h1" data-v-02a2e4b7>Komplettrad`);
			if ((0, vue_exports.unref)(shared).vehicle) _push(`<!--[--> für ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(shared).vehicle.short)}<!--]-->`);
			else _push(`<!---->`);
			_push(`</h1>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(StepBar_default, {
				steps: STEPS,
				current: step.value,
				reached: reached.value,
				label: "Schritte zum Komplettrad",
				onGo: go
			}, null, _parent));
			_push(`</header>`);
			if (addError.value && step.value !== 2) {
				_push(`<p class="notice notice--bad" role="alert" data-v-02a2e4b7>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "warning",
					size: 20
				}, null, _parent));
				_push(`<span data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(addError.value)}</span></p>`);
			} else _push(`<!---->`);
			if (!settled.value) _push(`<p class="kf-loading" role="status" data-v-02a2e4b7>Wird geladen …</p>`);
			else if (step.value === 0) {
				_push(`<section class="kf-step" aria-labelledby="kf-tyres-h" data-v-02a2e4b7><div class="kf-rim" data-kf-rim data-v-02a2e4b7><div class="well kf-rim__well" data-v-02a2e4b7>`);
				if (__props.product.image) _push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
					image: __props.product.image,
					alt: `${__props.product.brandName} ${__props.product.modelName} in ${__props.product.finishName}`,
					sizes: "64px"
				}, null, _parent));
				else _push((0, server_renderer_exports.ssrRenderComponent)(ProductPhoto_default, {
					spokes: __props.product.art.spokes,
					finish: __props.product.art.finish,
					size: 64,
					note: false
				}, null, _parent));
				_push(`</div><div class="kf-rim__facts" data-v-02a2e4b7><p class="kf-rim__name" translate="no" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(__props.product.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(__props.product.modelName)} · ${(0, server_renderer_exports.ssrInterpolate)(__props.product.finishName)}</p>`);
				if (rimChoices.value.length > 1) {
					_push(`<div class="kf-rim__choice" data-v-02a2e4b7><label class="kf-rim__label" for="kf-rim" data-v-02a2e4b7>Felge</label><select id="kf-rim" class="input kf-rim__select"${(0, server_renderer_exports.ssrRenderAttr)("value", currentRim.value?.href ?? "")} data-v-02a2e4b7>`);
					if (currentRim.value === null) _push(`<option value="" disabled data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(__props.config.setAxles ? __props.config.setAxles.join(" · ") : __props.config.sizeLabel)}</option>`);
					else _push(`<!---->`);
					_push(`<!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(rimChoices.value, (choice) => {
						_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", choice.href)} data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(choice.set ? `Satz: ${choice.label}` : choice.label)}</option>`);
					});
					_push(`<!--]--></select></div>`);
				} else {
					_push(`<!--[--><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.config.setAxles ?? [], (axle) => {
						_push(`<p class="kf-rim__spec" translate="no" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(axle)}</p>`);
					});
					_push(`<!--]-->`);
					if (!__props.config.setAxles) _push(`<p class="kf-rim__spec" translate="no" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(__props.config.fullLabel)}</p>`);
					else _push(`<!---->`);
					_push(`<!--]-->`);
				}
				if (__props.config.priceForFour) {
					_push(`<p class="kf-rim__spec" data-v-02a2e4b7><span translate="no" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(__props.config.priceForFour)}</span> für 4 Felgen`);
					if (__props.config.setPriceNote) _push(`<!--[-->: <span translate="no" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(__props.config.setPriceNote)}</span><!--]-->`);
					else _push(`<!---->`);
					_push(`</p>`);
				} else _push(`<!---->`);
				_push(`</div>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					class: "link kf-link kf-rim__other",
					href: productHref.value
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Andere Ausführung wählen`);
						else return [(0, vue_exports.createTextVNode)("Andere Ausführung wählen")];
					}),
					_: 1
				}, _parent));
				_push(`</div><div class="kf-step__head" data-v-02a2e4b7><h2 id="kf-tyres-h" class="h3 kf-step__title" tabindex="-1" data-v-02a2e4b7>Reifen wählen</h2></div>`);
				if (offer.value.refusal) _push((0, server_renderer_exports.ssrRenderComponent)(KomplettradRefusal_default, {
					sentence: offer.value.refusal,
					code: offer.value.refusalCode
				}, null, _parent));
				else if (!__props.config.inStock) {
					_push(`<p class="notice" role="status" data-rim-out data-v-02a2e4b7>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "info",
						size: 20
					}, null, _parent));
					_push(`<span data-v-02a2e4b7>Diese Felge ist gerade nicht lieferbar. Ein Komplettrad darauf können wir dir im Moment nicht anbieten.</span></p>`);
				} else _push(`<!---->`);
				if (tyreGone.value) {
					_push(`<p class="notice notice--bad" role="alert" data-tyre-gone data-v-02a2e4b7>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "warning",
						size: 20
					}, null, _parent));
					_push(`<span data-v-02a2e4b7>Der gewählte Reifen ist gerade nicht mehr verfügbar. Wähl bitte einen anderen.</span></p>`);
				} else _push(`<!---->`);
				if (offer.value.same.length > 0 && offer.value.pairs.length > 0) {
					_push(`<fieldset class="kf-mode" data-v-02a2e4b7><legend class="label kf-mode__legend" data-v-02a2e4b7>Bereifung</legend><label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kf-opt--on": mode.value === "same" }, "kf-opt"])}" data-v-02a2e4b7><input class="visually-hidden" type="radio" name="kf-mode" value="same"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(mode.value === "same") ? " checked" : ""} data-v-02a2e4b7><span class="kf-opt__name" data-v-02a2e4b7>Vorne und hinten gleich</span><span class="kf-opt__sub" data-v-02a2e4b7>4 gleiche Reifen</span><span class="kf-opt__check" aria-hidden="true" data-v-02a2e4b7>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "check",
						size: 20
					}, null, _parent));
					_push(`</span></label><label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kf-opt--on": mode.value === "mixed" }, "kf-opt"])}" data-v-02a2e4b7><input class="visually-hidden" type="radio" name="kf-mode" value="mixed"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(mode.value === "mixed") ? " checked" : ""} data-v-02a2e4b7><span class="kf-opt__name" data-v-02a2e4b7>Vorne und hinten verschieden</span><span class="kf-opt__sub" data-v-02a2e4b7>2 vorne, 2 hinten</span><span class="kf-opt__check" aria-hidden="true" data-v-02a2e4b7>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "check",
						size: 20
					}, null, _parent));
					_push(`</span></label></fieldset>`);
				} else if (offer.value.same.length > 0 && offer.value.mixedRefusal) _push(`<p class="small quiet kf-measure" data-v-02a2e4b7>Vorne und hinten verschieden: ${(0, server_renderer_exports.ssrInterpolate)(offer.value.mixedRefusal)}</p>`);
				else _push(`<!---->`);
				if (mode.value === "mixed" && offer.value.pairs.length > 1 && offer.value.pairs.length <= PAIR_TILES) {
					_push(`<fieldset class="kf-mode kf-pairs" data-v-02a2e4b7><legend class="label kf-mode__legend" data-v-02a2e4b7>Kombination aus dem Gutachten</legend><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(offer.value.pairs, (item) => {
						_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kf-opt--on": item.key === pairKey.value }, "kf-opt kf-pair"])}" data-v-02a2e4b7><input class="visually-hidden" type="radio" name="kf-pair"${(0, server_renderer_exports.ssrRenderAttr)("value", item.key)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(item.key === pairKey.value) ? " checked" : ""} data-v-02a2e4b7><span class="kf-opt__name" translate="no" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(pairLine(item))}</span><span class="kf-opt__sub" data-v-02a2e4b7>Kombination Nr. ${(0, server_renderer_exports.ssrInterpolate)(item.number)}</span>`);
						if (standingOf(item.answer)) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([`kf-opt__tag--${toneOf(item.answer)}`, "kf-opt__tag"])}" data-standing data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(STANDING_WORD[standingOf(item.answer)])}</span>`);
						else _push(`<!---->`);
						_push(`<span class="kf-opt__check" aria-hidden="true" data-v-02a2e4b7>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "check",
							size: 20
						}, null, _parent));
						_push(`</span></label>`);
					});
					_push(`<!--]--></fieldset>`);
				} else if (mode.value === "mixed" && offer.value.pairs.length > PAIR_TILES) {
					_push(`<div class="kf-pairlist" data-v-02a2e4b7><label class="label" for="kf-pair" data-v-02a2e4b7>Kombination aus dem Gutachten</label><select id="kf-pair" class="input"${(0, server_renderer_exports.ssrRenderAttr)("value", pairKey.value)} data-v-02a2e4b7><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(offer.value.pairs, (item) => {
						_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", item.key)} data-v-02a2e4b7>Nr. ${(0, server_renderer_exports.ssrInterpolate)(item.number)} · ${(0, server_renderer_exports.ssrInterpolate)(pairLine(item))}`);
						if (standingOf(item.answer)) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(STANDING_WORD[standingOf(item.answer)])}<!--]-->`);
						else _push(`<!---->`);
						_push(`</option>`);
					});
					_push(`<!--]--></select></div>`);
				} else if (mode.value === "mixed" && pair.value) {
					_push(`<p class="kf-onepair" data-v-02a2e4b7>`);
					if (pair.value.sameSize) _push(`<!--[-->Vorne und hinten <span class="kf-size" translate="no" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(pair.value.front)}</span><!--]-->`);
					else _push(`<!--[-->Vorne <span class="kf-size" translate="no" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(pair.value.front)}</span> · hinten <span class="kf-size" translate="no" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(pair.value.rear)}</span><!--]-->`);
					_push(`</p>`);
				} else _push(`<!---->`);
				if (mode.value === "mixed" && pair.value) {
					_push(`<p class="small quiet kf-source" data-v-02a2e4b7>Kombination Nr. ${(0, server_renderer_exports.ssrInterpolate)(pair.value.number)}`);
					if (offer.value.sourcePage) _push(`<!--[--> im Gutachten, Seite ${(0, server_renderer_exports.ssrInterpolate)(offer.value.sourcePage)}<!--]-->`);
					else _push(`<!---->`);
					_push(`</p>`);
				} else _push(`<!---->`);
				if (mode.value === "mixed" && pair.value && pair.value.cards.length === 0) {
					_push(`<p class="notice kf-noset" data-v-02a2e4b7>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "info",
						size: 20
					}, null, _parent));
					_push(`<span data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(pair.value.noSet ?? "Reifen für diese Kombination können wir dir gerade nicht anbieten. Die Felge allein kannst du bestellen.")}</span></p>`);
				} else _push(`<!---->`);
				if (inMode.value.length > 0) {
					_push(`<!--[-->`);
					if (filterable.value) {
						_push(`<button class="btn btn--secondary kf-filters__toggle" type="button" aria-controls="kf-filters"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", filtersOpen.value)} data-v-02a2e4b7>Filter`);
						if (filtersOn.value > 0) _push(`<!--[--> (${(0, server_renderer_exports.ssrInterpolate)(filtersOn.value)})<!--]-->`);
						else _push(`<!---->`);
						_push(`</button>`);
					} else _push(`<!---->`);
					_push(`<div id="kf-filters" class="${(0, server_renderer_exports.ssrRenderClass)([{ "kf-filters--open": filtersOpen.value }, "kf-filters"])}" data-v-02a2e4b7>`);
					if (seasons.value.length > 1) {
						_push(`<div class="kf-filter" role="group" aria-label="Saison" data-v-02a2e4b7><span class="kf-filter__label" data-v-02a2e4b7>Saison</span><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(seasons.value, ([value, label]) => {
							_push(`<button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", filter.seasons.includes(value))} data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(label)}</button>`);
						});
						_push(`<!--]--></div>`);
					} else _push(`<!---->`);
					if (brands.value.length > 1) {
						_push(`<div class="kf-filter" role="group" aria-label="Marke" data-v-02a2e4b7><span class="kf-filter__label" data-v-02a2e4b7>Marke</span><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(brands.value, (brand) => {
							_push(`<button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", filter.brands.includes(brand))} translate="no" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(brand)}</button>`);
						});
						_push(`<!--]--></div>`);
					} else _push(`<!---->`);
					if (bands.value.length > 0) {
						_push(`<div class="kf-filter" role="group" aria-label="Preis für die Reifen" data-v-02a2e4b7><span class="kf-filter__label" data-v-02a2e4b7>Preis</span><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(bands.value, (band) => {
							_push(`<button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", filter.band === band.value)} data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(band.label)}</button>`);
						});
						_push(`<!--]--></div>`);
					} else _push(`<!---->`);
					_push(`</div><div class="kf-listhead" data-v-02a2e4b7><p class="kf-count" role="status" tabindex="-1" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(mode.value === "mixed" ? list.value.length === 1 ? "1 Reifensatz passt" : `${list.value.length} Reifensätze passen` : list.value.length === 1 ? "1 Reifen passt" : `${list.value.length} Reifen passen`)}</p><label class="kf-sort" data-v-02a2e4b7><span class="kf-sort__label" data-v-02a2e4b7>Sortieren</span><select class="input kf-sort__select" data-v-02a2e4b7><option value="preis-auf" data-v-02a2e4b7${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(sort.value) ? (0, server_renderer_exports.ssrLooseContain)(sort.value, "preis-auf") : (0, server_renderer_exports.ssrLooseEqual)(sort.value, "preis-auf")) ? " selected" : ""}>Preis aufsteigend</option><option value="preis-ab" data-v-02a2e4b7${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(sort.value) ? (0, server_renderer_exports.ssrLooseContain)(sort.value, "preis-ab") : (0, server_renderer_exports.ssrLooseEqual)(sort.value, "preis-ab")) ? " selected" : ""}>Preis absteigend</option><option value="marke" data-v-02a2e4b7${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(sort.value) ? (0, server_renderer_exports.ssrLooseContain)(sort.value, "marke") : (0, server_renderer_exports.ssrLooseEqual)(sort.value, "marke")) ? " selected" : ""}>Marke A–Z</option></select></label></div>`);
					if (list.value.length > 0) {
						_push(`<div class="kf-grid" role="radiogroup" aria-label="Reifen" data-v-02a2e4b7><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(shown.value, (card) => {
							_push((0, server_renderer_exports.ssrRenderComponent)(TyreCard_default, {
								key: card.key,
								card,
								chosen: card.key === chosenKey.value,
								"papers-exempt": __props.config.verdict?.papersExempt === true,
								onChoose: ($event) => chosenKey.value = card.key,
								onDetails: ($event) => openDetails(card.key)
							}, null, _parent));
						});
						_push(`<!--]--></div>`);
					} else _push(`<p class="kf-empty" data-v-02a2e4b7> Kein Reifen passt zu diesen Filtern. <button class="link" type="button" data-v-02a2e4b7>Filter zurücksetzen</button></p>`);
					if (list.value.length > shown.value.length) _push(`<button class="btn btn--secondary kf-more" type="button" data-v-02a2e4b7>Mehr anzeigen (${(0, server_renderer_exports.ssrInterpolate)(list.value.length - shown.value.length)})</button>`);
					else _push(`<!---->`);
					_push(`<!--]-->`);
				} else _push(`<!---->`);
				if (checkFor.value && (0, vue_exports.unref)(shared).vehicle) _push((0, server_renderer_exports.ssrRenderComponent)(ChosenCheck_default, {
					class: "kf-check",
					"data-set-answer": mode.value === "mixed" ? "" : void 0,
					answer: checkFor.value.answer,
					vehicle: (0, vue_exports.unref)(shared).vehicle.label,
					sizes: checkFor.value.sizes,
					"papers-exempt": __props.config.verdict?.papersExempt === true,
					document: checkDocument.value
				}, null, _parent));
				else _push(`<!---->`);
				if (mode.value === "mixed" && offer.value.rules) {
					_push(`<figure class="kf-rules" data-v-02a2e4b7><figcaption class="label" data-v-02a2e4b7>Dazu verlangt das Gutachten`);
					if (offer.value.rulesPage) _push(`<!--[--> (Seite ${(0, server_renderer_exports.ssrInterpolate)(offer.value.rulesPage)})<!--]-->`);
					else _push(`<!---->`);
					_push(`</figcaption><blockquote class="kf-quote" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(offer.value.rules)}</blockquote></figure>`);
				} else _push(`<!---->`);
				_push(`<div class="kf-actions" data-v-02a2e4b7>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					class: "btn btn--secondary kf-actions__left",
					href: productHref.value
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Zurück`);
						else return [(0, vue_exports.createTextVNode)("Zurück")];
					}),
					_: 1
				}, _parent));
				_push(`<span class="kf-pick small" role="status" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(chosen.value ? `Gewählt: ${[chosen.value.brands.join(" · "), chosen.value.name].filter(Boolean).join(" ")} · ${held.value ? "liegt schon im Warenkorb" : chosen.value.set}` : "Wähl zuerst einen Reifen.")}</span>`);
				if (held.value) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/warenkorb",
					class: "btn btn--primary"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push(`Zum Warenkorb `);
							_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
								name: "arrow-right",
								size: 20
							}, null, _parent, _scopeId));
						} else return [(0, vue_exports.createTextVNode)("Zum Warenkorb "), (0, vue_exports.createVNode)(Icon_default, {
							name: "arrow-right",
							size: 20
						})];
					}),
					_: 1
				}, _parent));
				else {
					_push(`<button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!chosen.value || !canGoOn.value) ? " disabled" : ""} data-v-02a2e4b7>Weiter: Extras `);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "arrow-right",
						size: 20
					}, null, _parent));
					_push(`</button>`);
				}
				_push(`</div>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(TyreDetails_default, {
					open: detailsOpen.value,
					"onUpdate:open": ($event) => detailsOpen.value = $event,
					card: details.value,
					chosen: details.value?.key === chosenKey.value,
					onChoose: ($event) => chosenKey.value = detailsKey.value
				}, null, _parent));
				if (__props.config.verdict?.detail && (0, vue_exports.unref)(shared).vehicle) _push((0, server_renderer_exports.ssrRenderComponent)(FitmentDetail_default, {
					detail: __props.config.verdict.detail,
					"vehicle-label": (0, vue_exports.unref)(shared).vehicle.label,
					omit: [(0, vue_exports.unref)(ENTRY_REQUIRED), (0, vue_exports.unref)(ABNAHME_REQUIRED)]
				}, null, _parent));
				else _push(`<!---->`);
				_push(`</section>`);
			} else if (step.value === 1) {
				_push(`<section class="kf-step" aria-labelledby="kf-extras-h" data-v-02a2e4b7><div class="kf-step__head" data-v-02a2e4b7><h2 id="kf-extras-h" class="h3 kf-step__title" tabindex="-1" data-v-02a2e4b7>Extras</h2><p class="small quiet kf-measure" data-v-02a2e4b7>`);
				if (__props.mounting) _push(`<!--[-->Montage und Auswuchten gehören zum Komplettrad: ${(0, server_renderer_exports.ssrInterpolate)(__props.mounting.total)} für 4 Räder (je ${(0, server_renderer_exports.ssrInterpolate)(__props.mounting.each)}). <!--]-->`);
				else _push(`<!---->`);
				_push(` Extras mit Aufpreis kommen nur dazu, wenn du sie auswählst. </p></div>`);
				if (colours.value.length > 0) {
					_push(`<fieldset class="kf-group" data-weights data-v-02a2e4b7><legend class="label" data-v-02a2e4b7>Wuchtgewichte</legend><p class="small quiet" data-v-02a2e4b7>Die Gewichte sitzen innen an der Felge. Such dir die Farbe aus, die dir besser gefällt.`);
					if (standardColour.value) _push(`<!--[--> Ohne Wahl setzen wir ${(0, server_renderer_exports.ssrInterpolate)(standardColour.value.name)} ein.<!--]-->`);
					else _push(`<!---->`);
					_push(`</p><div class="kf-swatches" data-v-02a2e4b7><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(colours.value, (item) => {
						_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kf-swatch--on": item.id === colourId.value }, "kf-swatch"])}" data-v-02a2e4b7><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(colourId.value, item.id)) ? " checked" : ""} class="visually-hidden" type="radio" name="kf-weights"${(0, server_renderer_exports.ssrRenderAttr)("value", item.id)} data-v-02a2e4b7><span class="kf-swatch__dot" data-qa-ignore style="${(0, server_renderer_exports.ssrRenderStyle)(item.swatchHex ? { "--swatch": item.swatchHex } : void 0)}" aria-hidden="true" data-v-02a2e4b7></span><span class="kf-swatch__name" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(item.name)}</span><span class="kf-swatch__price" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(item.surchargeCents === 0 ? "ohne Aufpreis" : `+ ${item.surcharge} pro Rad`)}</span><span class="kf-swatch__check" aria-hidden="true" data-v-02a2e4b7>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "check",
							size: 16
						}, null, _parent));
						_push(`</span></label>`);
					});
					_push(`<!--]--></div></fieldset>`);
				} else _push(`<!---->`);
				if (tpms.value) {
					_push(`<fieldset class="kf-group" data-rdks data-v-02a2e4b7><legend class="label" data-v-02a2e4b7>RDKS-Sensoren</legend><p class="small quiet" data-v-02a2e4b7>Misst dein Auto den Reifendruck mit Sensoren in den Rädern, brauchen auch die neuen Räder Sensoren. Ob das so ist, steht in der Betriebsanleitung.</p>`);
					if (rdksShared.value) _push(`<p class="small" data-rdks-shared data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(rdksShared.value)}</p>`);
					else _push(`<!---->`);
					if (!tpms.value.available && tpms.value.notice) {
						_push(`<p class="notice" data-v-02a2e4b7><span data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(tpms.value.notice)} `);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: (0, vue_exports.unref)(contactHref)({
								subject: "Preis für RDKS-Sensoren",
								from: (0, vue_exports.unref)(page).url
							}),
							class: "link"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Zum Kontaktformular`);
								else return [(0, vue_exports.createTextVNode)("Zum Kontaktformular")];
							}),
							_: 1
						}, _parent));
						_push(`</span></p>`);
					} else _push(`<!---->`);
					_push(`<div class="kf-opts" data-v-02a2e4b7>`);
					if (tpms.value.available) {
						_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kf-opt--on": rdks.value === "ja" }, "kf-opt"])}" data-v-02a2e4b7><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(rdks.value, "ja")) ? " checked" : ""} class="visually-hidden" type="radio" name="kf-rdks" value="ja" data-v-02a2e4b7><span class="kf-opt__name" data-v-02a2e4b7>Mit RDKS-Sensoren</span><span class="kf-opt__price" data-v-02a2e4b7>+ ${(0, server_renderer_exports.ssrInterpolate)(tpms.value.yesTotal)}`);
						if (tpms.value.line) _push(`<!--[--> (${(0, server_renderer_exports.ssrInterpolate)(tpms.value.line)})<!--]-->`);
						else _push(`<!---->`);
						_push(`</span><span class="kf-opt__sub" data-v-02a2e4b7>Wir setzen sie gleich mit ein.</span><span class="kf-opt__check" aria-hidden="true" data-v-02a2e4b7>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "check",
							size: 20
						}, null, _parent));
						_push(`</span></label>`);
					} else _push(`<!---->`);
					_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kf-opt--on": rdks.value === "nein" }, "kf-opt"])}" data-v-02a2e4b7><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(rdks.value, "nein")) ? " checked" : ""} class="visually-hidden" type="radio" name="kf-rdks" value="nein" data-v-02a2e4b7><span class="kf-opt__name" data-v-02a2e4b7>Ohne RDKS-Sensoren</span><span class="kf-opt__price" data-v-02a2e4b7>ohne Aufpreis</span><span class="kf-opt__check" aria-hidden="true" data-v-02a2e4b7>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "check",
						size: 20
					}, null, _parent));
					_push(`</span></label></div></fieldset>`);
				} else _push(`<!---->`);
				_push(`<div class="kf-actions kf-actions--measure" data-v-02a2e4b7><button class="btn btn--secondary kf-actions__left" type="button" data-v-02a2e4b7>Zurück</button>`);
				if (extrasOpen.value) _push(`<span id="kf-rdks-hint" class="kf-pick small" role="status" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(extrasOpen.value)}</span>`);
				else _push(`<!---->`);
				_push(`<button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(extrasOpen.value !== null) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", extrasOpen.value ? "kf-rdks-hint" : void 0)} data-v-02a2e4b7>Weiter: Warenkorb `);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "arrow-right",
					size: 20
				}, null, _parent));
				_push(`</button></div></section>`);
			} else {
				_push(`<section class="kf-step" aria-labelledby="kf-basket-h" data-v-02a2e4b7><h2 id="kf-basket-h" class="h3 kf-step__title" tabindex="-1" data-v-02a2e4b7>Dein Komplettrad</h2>`);
				if (chosen.value && held.value) {
					_push(`<!--[--><p class="notice notice--ok kf-panel" role="status" data-held data-v-02a2e4b7>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "check",
						size: 20
					}, null, _parent));
					_push(`<span data-v-02a2e4b7>Dieses Komplettrad liegt in deinem Warenkorb.</span></p><div class="kf-actions kf-actions--measure" data-v-02a2e4b7><button class="btn btn--secondary kf-actions__left" type="button" data-v-02a2e4b7>Anderen Reifen wählen</button>`);
					_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: "/warenkorb",
						class: "btn btn--primary"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push(`Zum Warenkorb `);
								_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
									name: "arrow-right",
									size: 20
								}, null, _parent, _scopeId));
							} else return [(0, vue_exports.createTextVNode)("Zum Warenkorb "), (0, vue_exports.createVNode)(Icon_default, {
								name: "arrow-right",
								size: 20
							})];
						}),
						_: 1
					}, _parent));
					_push(`</div><!--]-->`);
				} else if (chosen.value && sum.value) {
					_push(`<!--[-->`);
					_push((0, server_renderer_exports.ssrRenderComponent)(FitmentPanel_default, {
						class: "kf-panel",
						verdict: __props.config.verdict ?? null,
						vehicle: (0, vue_exports.unref)(shared).vehicle,
						"config-id": __props.config.rearId ? null : __props.config.id,
						chosen: chosen.value.answer,
						"tyre-summary": chosenMinimum.value,
						"ask-href": askHref.value
					}, null, _parent));
					_push(`<div class="kf-sum" data-v-02a2e4b7><table class="kf-basket" data-v-02a2e4b7><caption class="visually-hidden" data-v-02a2e4b7>Was in den Warenkorb kommt</caption><tbody data-v-02a2e4b7><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(sum.value.lines, (line) => {
						_push(`<tr data-v-02a2e4b7><th scope="row" data-v-02a2e4b7><span class="kf-basket__cell" data-v-02a2e4b7><span class="kf-basket__label" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(line.label)}</span><span class="small quiet" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(line.detail)}</span></span></th><td data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(line.price)}</td></tr>`);
					});
					_push(`<!--]--></tbody><tfoot data-v-02a2e4b7><tr data-v-02a2e4b7><th scope="row" data-v-02a2e4b7>Summe</th><td data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(sum.value.totalCents))}</td></tr></tfoot></table><p class="small quiet" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(terms).note)}</p>`);
					if (sum.value.open) _push(`<p class="small quiet" data-v-02a2e4b7>Summe ohne Montage und Auswuchten.</p>`);
					else _push(`<!---->`);
					if (rdksNote.value) _push(`<p class="small quiet" data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(rdksNote.value)}</p>`);
					else _push(`<!---->`);
					_push(`</div>`);
					if (addError.value) {
						_push(`<p class="notice notice--bad" role="alert" data-v-02a2e4b7>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "warning",
							size: 20
						}, null, _parent));
						_push(`<span data-v-02a2e4b7>${(0, server_renderer_exports.ssrInterpolate)(addError.value)}</span></p>`);
					} else _push(`<!---->`);
					_push(`<div class="kf-actions kf-actions--measure" data-v-02a2e4b7><button class="btn btn--secondary kf-actions__left" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(basket).processing) ? " disabled" : ""} data-v-02a2e4b7>Zurück</button><button class="btn btn--primary kf-add" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(basket).processing ? "true" : void 0)} data-v-02a2e4b7>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "cart",
						size: 20
					}, null, _parent));
					_push(` ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(basket).processing ? "Wird hinzugefügt …" : "In den Warenkorb")}</button></div>`);
					if (__props.config.verdict?.detail && (0, vue_exports.unref)(shared).vehicle) _push((0, server_renderer_exports.ssrRenderComponent)(FitmentDetail_default, {
						detail: __props.config.verdict.detail,
						"vehicle-label": (0, vue_exports.unref)(shared).vehicle.label,
						omit: [(0, vue_exports.unref)(ENTRY_REQUIRED), (0, vue_exports.unref)(ABNAHME_REQUIRED)]
					}, null, _parent));
					else _push(`<!---->`);
					_push(`<!--]-->`);
				} else _push(`<p class="kf-empty" data-v-02a2e4b7>Noch kein Reifen gewählt. <button class="link" type="button" data-v-02a2e4b7>Reifen wählen</button></p>`);
				_push(`</section>`);
			}
			_push(`</div></section><!--]-->`);
		};
	}
});
// resources/js/Pages/Komplettrad/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Komplettrad/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-02a2e4b7"]]);
export { Index_default as default };
