import { t as AppLayout_default } from "./AppLayout-DhCuH0p_.js";
import { a as link_default, i as head_default, o as useForm, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as Icon_default } from "./Icon-DUS6sqAV.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import "./Toast-BAo4c4LN.js";
import { f as contactHref, l as priceTerms, x as useShared } from "./useShortcuts-B6ckgfRC.js";
import { n as ENTRY_REQUIRED, t as ABNAHME_REQUIRED } from "./papers-B4aUsj_q.js";
import { i as BuyModeChoice_default, n as FitmentPanel_default, r as FitmentDetail_default, t as KomplettradChoice_default } from "./KomplettradChoice-CyD5ZhNs.js";
import { t as VerdictBadge_default } from "./VerdictBadge-Chiz2jxt.js";
import { t as VehicleSelector_default } from "./VehicleSelector-dK695rr8.js";
//#region resources/js/Pages/Check/Index.vue?vue&type=script&setup=true&lang.ts
var OFFLINE_ADD = "Keine Verbindung – es wurde nichts in den Warenkorb gelegt. Versuch es gleich noch einmal.";
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		wheelBrands: {},
		wheelModels: {},
		wheelFinishes: {},
		wheelSizes: {},
		chosen: {},
		notFound: {},
		changing: { type: Boolean },
		answer: {},
		makes: {},
		models: {},
		variants: {},
		selectedMake: {},
		selectedModel: {}
	},
	setup(__props) {
		/**
		* RIMIFY-Check (the client's #28): one question — „Passt diese Felge auf mein Auto?“ — and one answer for one pair.
		*
		* The car on the left, the wheel on the right (Hersteller, Felge, Ausführung und Größe), and below them the answer:
		* the verdict, every Auflage, the document and the page it stands on — the product page's own RIMIFY-Check panel,
		* fed the product page's own row for that size and that car (FelgenController::answerFor), so the two pages can never
		* disagree. Then „Jetzt kaufen“ for exactly that combination, with the Komplettrad beside it.
		*
		* Everything chosen lives in the address (`fahrzeug`, `hersteller`, `felge`, `groesse`): the page is the answer
		* whoever opens the link — the one a customer sends to a friend. Choosing the car here brings the visitor back here.
		*
		* One page for every width.
		*/
		const props = __props;
		const shared = useShared();
		const page = usePage();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const terms = (0, vue_exports.computed)(() => priceTerms(shared.value.smallBusiness === true));
		const choosingVehicle = (0, vue_exports.computed)(() => vehicle.value === null || props.changing === true || props.selectedMake !== null);
		const wheelQuery = (0, vue_exports.computed)(() => ({
			hersteller: props.chosen.brand,
			felge: props.chosen.wheel,
			ausfuehrung: props.chosen.finish ?? null,
			groesse: props.chosen.size
		}));
		(0, vue_exports.computed)(() => ({
			marke: props.selectedMake,
			modell: props.selectedModel,
			aendern: props.changing ? 1 : null
		}));
		const selectorQuery = (0, vue_exports.computed)(() => clean({
			...wheelQuery.value,
			aendern: props.changing ? 1 : null
		}));
		function clean(query) {
			return Object.fromEntries(Object.entries(query).filter((entry) => entry[1] !== null && entry[1] !== void 0 && entry[1] !== ""));
		}
		const returnTo = (0, vue_exports.computed)(() => {
			const query = new URLSearchParams(Object.entries(clean(wheelQuery.value)).map(([k, v]) => [k, String(v)])).toString();
			return query === "" ? "/rimify-check" : `/rimify-check?${query}`;
		});
		const pending = (0, vue_exports.ref)(false);
		const offline = (0, vue_exports.ref)(false);
		(0, vue_exports.ref)(0);
		const announce = (0, vue_exports.ref)("");
		(0, vue_exports.onBeforeUnmount)(() => {});
		const carHeading = (0, vue_exports.useTemplateRef)("carHeading");
		const changeButton = (0, vue_exports.useTemplateRef)("changeButton");
		(0, vue_exports.watch)(choosingVehicle, (open) => {
			(0, vue_exports.nextTick)(() => (open ? carHeading.value : changeButton.value)?.focus());
		});
		const config = (0, vue_exports.computed)(() => props.answer?.config ?? null);
		const sellable = (0, vue_exports.computed)(() => config.value?.verdict?.sellable === true);
		const mode = (0, vue_exports.ref)("felgen");
		const isSet = (0, vue_exports.computed)(() => mode.value === "komplettrad");
		const offer = (0, vue_exports.computed)(() => config.value?.komplettrad ?? null);
		const options = (0, vue_exports.computed)(() => props.answer?.komplettradOptions ?? null);
		const tyreId = (0, vue_exports.ref)(null);
		const colourId = (0, vue_exports.ref)(null);
		const rdks = (0, vue_exports.ref)(null);
		(0, vue_exports.watch)(() => props.answer, () => {
			const tyres = offer.value?.tyres.map((t) => t.id) ?? [];
			const colours = options.value?.colours ?? [];
			if (tyreId.value === null || !tyres.includes(tyreId.value)) tyreId.value = tyres[0] ?? null;
			if (colourId.value === null || !colours.some((c) => c.id === colourId.value)) colourId.value = colours.find((c) => c.isDefault)?.id ?? colours[0]?.id ?? null;
			rdks.value ??= options.value?.tpms.choice ?? null;
		}, { immediate: true });
		const tyre = (0, vue_exports.computed)(() => offer.value?.tyres.find((t) => t.id === tyreId.value) ?? null);
		const setFrom = (0, vue_exports.computed)(() => {
			const priced = (offer.value?.tyres ?? []).map((t) => t.prices?.find((p) => p.colourId === colourId.value) ?? {
				perWheel: t.perWheel,
				forFourCents: t.forFourCents
			});
			return priced.length === 0 ? null : priced.reduce((low, p) => p.forFourCents < low.forFourCents ? p : low).perWheel;
		});
		const setPrice = (0, vue_exports.computed)(() => {
			const current = tyre.value;
			return current === null ? null : current.prices?.find((p) => p.colourId === colourId.value) ?? {
				perWheel: current.perWheel,
				forFour: current.forFour
			};
		});
		const rimAmount = (0, vue_exports.computed)(() => Math.max(1, Math.min(4, config.value?.stockQty ?? 4)));
		const rimPrice = (0, vue_exports.computed)(() => config.value?.amounts?.find((a) => a.quantity === rimAmount.value) ?? null);
		const shownPrice = (0, vue_exports.computed)(() => isSet.value ? setPrice.value?.forFour ?? null : rimPrice.value?.text ?? config.value?.price ?? null);
		const shownNote = (0, vue_exports.computed)(() => {
			if (isSet.value) return setPrice.value === null ? "" : `für ${offer.value?.quantity ?? 4} Kompletträder, je Rad ${setPrice.value.perWheel}, ${terms.value.note}`;
			return rimAmount.value === 1 ? `für 1 Felge, ${terms.value.note}` : `für ${rimAmount.value} Felgen, je ${config.value?.price ?? ""}, ${terms.value.note}`;
		});
		const sensorLine = (0, vue_exports.computed)(() => {
			const tpms = options.value?.tpms;
			return isSet.value && rdks.value === "ja" && tpms?.available && tpms.yesTotal ? `+ ${tpms.yesTotal} für ${tpms.quantity} RDKS-Sensoren` : null;
		});
		const basket = useForm({
			kind: "WHEEL",
			wheelConfigId: 0,
			tyreVariantId: null,
			weightColourId: null,
			rdks: null,
			quantity: 4
		});
		const leaving = (0, vue_exports.ref)(false);
		const canBuy = (0, vue_exports.computed)(() => {
			const current = config.value;
			if (current === null || !sellable.value || !current.inStock || pending.value) return false;
			return isSet.value ? tyre.value !== null && current.stockQty >= (offer.value?.quantity ?? 4) : true;
		});
		const buyLabel = (0, vue_exports.computed)(() => {
			if (basket.processing || leaving.value) return "Wird hinzugefügt …";
			if (pending.value) return "Antwort wird geladen …";
			if (config.value !== null && !config.value.inStock) return "Ausverkauft";
			if (isSet.value && (tyre.value === null || setShort.value !== null)) return "Komplettrad gerade nicht möglich";
			return "Jetzt kaufen";
		});
		const setShort = (0, vue_exports.computed)(() => {
			const current = config.value;
			const needed = offer.value?.quantity ?? 4;
			return isSet.value && current !== null && current.inStock && current.stockQty < needed ? `Von dieser Felge haben wir nur noch ${current.stockQty} Stück auf Lager – für einen Satz Kompletträder brauchen wir ${needed}.` : null;
		});
		const buyOffline = (0, vue_exports.ref)(false);
		const addError = (0, vue_exports.computed)(() => basket.errors.tyreVariantId ?? basket.errors.wheelConfigId ?? basket.errors.rdks ?? basket.errors.quantity ?? (buyOffline.value ? OFFLINE_ADD : null));
		(0, vue_exports.watch)([
			() => props.answer?.config.id,
			mode,
			tyreId,
			colourId
		], () => {
			basket.clearErrors();
			buyOffline.value = false;
		});
		const productHref = (0, vue_exports.computed)(() => {
			const answer = props.answer;
			return answer === null ? "/felgen" : `/felgen/${answer.product.slug}?ausfuehrung=${answer.product.finishId}&groesse=${answer.config.id}`;
		});
		const noSale = (0, vue_exports.computed)(() => {
			switch (config.value?.verdict?.status) {
				case "NOT_PERMITTED": return "In dieser Größe ist die Felge für dein Auto nicht freigegeben, deshalb bieten wir sie dafür nicht an.";
				default: return "Eine Freigabe dieser Felge für dein Auto können wir nicht belegen, deshalb bieten wir sie dafür nicht an.";
			}
		});
		const askHref = (0, vue_exports.computed)(() => contactHref({
			subject: props.answer ? `RIMIFY-Check: ${props.answer.product.brandName} ${props.answer.product.modelName}` : "RIMIFY-Check",
			from: page.url
		}));
		const STATES = [
			{
				status: "PERMITTED",
				text: "Das Gutachten deckt dein Fahrzeug in dieser Größe ab. Wir nennen dir die Gutachten-Nummer und sagen, ob eine Eintragung nötig ist."
			},
			{
				status: "CONDITIONAL",
				text: "Zulässig unter den Bedingungen aus dem Gutachten, etwa nur mit bestimmten Radschrauben. Jede Auflage steht ausformuliert dabei."
			},
			{
				status: "NOT_PERMITTED",
				text: "Das Gutachten deckt diese Größe für dein Fahrzeug nicht ab. Steht der Grund im Gutachten, nennen wir ihn."
			},
			{
				status: "UNKNOWN",
				text: "Für diese Kombination liegt uns kein Gutachten vor. Das heißt nicht, dass die Felge unzulässig ist – nur, dass wir es nicht belegen können."
			}
		];
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "RIMIFY-Check" }, null, _parent));
			_push(`<section class="section-dense" data-v-511ea4c6><div class="container chk" data-v-511ea4c6><h1 class="t-h1" data-v-511ea4c6>Passt diese Felge auf mein Auto?</h1><p class="t-lead chk__lead" data-v-511ea4c6> Wähl dein Auto und die Felge. Du bekommst eine Antwort für genau diese Kombination – mit dem Gutachten, seinen Auflagen und der Seite, auf der das steht. </p><div class="${(0, server_renderer_exports.ssrRenderClass)([{ "chk__pick--choosing": choosingVehicle.value }, "chk__pick"])}" data-v-511ea4c6><section class="chk__step" aria-labelledby="chk-car-h" data-v-511ea4c6><h2 id="chk-car-h" class="chk__step-h" tabindex="-1" data-v-511ea4c6>Dein Auto</h2>`);
			if (!choosingVehicle.value && vehicle.value) _push(`<div class="chk__car" data-v-511ea4c6><div class="chk__car-text" data-v-511ea4c6><p class="chk__vehicle" data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</p><p class="data" data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.approval ?? `${vehicle.value.keyNumbers} · ${vehicle.value.buildWindow}`)}</p></div><button class="btn btn--quiet" type="button" data-v-511ea4c6> Ändern<span class="visually-hidden" data-v-511ea4c6> (Fahrzeug)</span></button></div>`);
			else {
				_push(`<!--[-->`);
				_push((0, server_renderer_exports.ssrRenderComponent)(VehicleSelector_default, {
					makes: __props.makes,
					models: __props.models,
					variants: __props.variants,
					"selected-make": __props.selectedMake,
					"selected-model": __props.selectedModel,
					"base-path": "/rimify-check",
					"base-query": selectorQuery.value,
					"return-to": returnTo.value,
					compact: ""
				}, null, _parent));
				if (vehicle.value) _push(`<p class="chk__cancel" data-v-511ea4c6><button class="link" type="button" data-v-511ea4c6>Abbrechen – ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.short)} behalten</button></p>`);
				else _push(`<!---->`);
				_push(`<!--]-->`);
			}
			_push(`</section><section class="chk__step" aria-labelledby="chk-wheel-h" data-v-511ea4c6><h2 id="chk-wheel-h" class="chk__step-h" data-v-511ea4c6>Deine Felge</h2>`);
			if (__props.wheelBrands.length === 0) {
				_push(`<p class="chk__none" data-v-511ea4c6> Noch ist keine Felge im Sortiment. Sobald die ersten freigegeben sind, prüfst du sie hier. `);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: (0, vue_exports.unref)(contactHref)({
					subject: "Ich suche eine Felge",
					from: "/rimify-check"
				}) }, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Schreib uns, welche du suchst`);
						else return [(0, vue_exports.createTextVNode)("Schreib uns, welche du suchst")];
					}),
					_: 1
				}, _parent));
				_push(`. </p>`);
			} else {
				_push(`<div class="chk__fields" data-v-511ea4c6><div class="form-field" data-v-511ea4c6><label class="form-field__label" for="chk-brand" data-v-511ea4c6>Hersteller</label><select id="chk-brand" class="input"${(0, server_renderer_exports.ssrRenderAttr)("value", __props.chosen.brand ?? "")} data-v-511ea4c6><option value="" disabled${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!__props.chosen.brand) ? " selected" : ""} data-v-511ea4c6>Hersteller wählen</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.wheelBrands, (brand) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", brand.slug)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(brand.slug === __props.chosen.brand) ? " selected" : ""} data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(brand.name)}</option>`);
				});
				_push(`<!--]--></select></div><div class="form-field" data-v-511ea4c6><label class="form-field__label" for="chk-wheel" data-v-511ea4c6>Felge</label><select id="chk-wheel" class="input"${(0, server_renderer_exports.ssrRenderAttr)("value", __props.chosen.wheel ?? "")}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.wheelModels.length === 0) ? " disabled" : ""} data-v-511ea4c6><option value="" disabled${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!__props.chosen.wheel) ? " selected" : ""} data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(__props.chosen.brand ? "Felge wählen" : "Zuerst den Hersteller")}</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.wheelModels, (model) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", model.slug)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(model.slug === __props.chosen.wheel) ? " selected" : ""} data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(model.name)}</option>`);
				});
				_push(`<!--]--></select></div><div class="form-field" data-v-511ea4c6><label class="form-field__label" for="chk-finish" data-v-511ea4c6>Ausführung</label><select id="chk-finish" class="input"${(0, server_renderer_exports.ssrRenderAttr)("value", __props.chosen.finish ?? "")}${(0, server_renderer_exports.ssrIncludeBooleanAttr)((__props.wheelFinishes ?? []).length === 0) ? " disabled" : ""} data-v-511ea4c6><option value="" disabled${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!__props.chosen.finish) ? " selected" : ""} data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(__props.chosen.wheel ? "Ausführung wählen" : "Zuerst die Felge")}</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.wheelFinishes ?? [], (finish) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", finish.id)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(finish.id === __props.chosen.finish) ? " selected" : ""} data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(finish.name)}</option>`);
				});
				_push(`<!--]--></select></div><div class="form-field" data-v-511ea4c6><label class="form-field__label" for="chk-size" data-v-511ea4c6>Größe</label><select id="chk-size" class="input"${(0, server_renderer_exports.ssrRenderAttr)("value", __props.chosen.size ?? "")}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.wheelSizes.length === 0) ? " disabled" : ""} data-v-511ea4c6><option value="" disabled${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!__props.chosen.size) ? " selected" : ""} data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(__props.chosen.wheel ? "Größe wählen" : "Zuerst die Felge")}</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.wheelSizes, (size) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", size.id)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(size.id === __props.chosen.size) ? " selected" : ""} data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(size.label)}</option>`);
				});
				_push(`<!--]--></select></div></div>`);
			}
			if (offline.value) {
				_push(`<p class="notice notice--bad chk__lost" role="alert" data-v-511ea4c6>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "warning",
					size: 20
				}, null, _parent));
				_push(`<span data-v-511ea4c6>Keine Verbindung – deine Auswahl konnte nicht geladen werden. Versuch es gleich noch einmal.</span></p>`);
			} else _push(`<!---->`);
			if (__props.notFound) {
				_push(`<p class="notice chk__lost" role="status" data-v-511ea4c6>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "info",
					size: 20
				}, null, _parent));
				_push(`<span data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(__props.notFound === "wheel" ? "Die Felge aus dem Link gibt es bei uns nicht mehr. Wähl einen Hersteller und eine andere Felge." : "Diese Felge gibt es in der Größe aus dem Link nicht mehr. Wähl oben eine andere Größe.")}</span></p>`);
			} else _push(`<!---->`);
			_push(`</section></div><p class="visually-hidden" role="status" aria-live="polite" data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(announce.value)}</p>`);
			if (__props.answer && config.value && vehicle.value) {
				_push(`<section id="antwort" class="${(0, server_renderer_exports.ssrRenderClass)([{ "chk__answer--pending": pending.value }, "chk__answer"])}" aria-labelledby="chk-answer-h"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", pending.value ? "true" : void 0)} data-v-511ea4c6><h2 id="chk-answer-h" class="visually-hidden" data-v-511ea4c6>Die Antwort</h2><p class="chk__pair" data-v-511ea4c6><span translate="no" data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(__props.answer.product.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(__props.answer.product.modelName)}</span> · <span translate="no" data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(__props.answer.product.finishName)}</span> · <span class="tabular chk__size" translate="no" data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(config.value.sizeLabel)}</span><span class="chk__for" data-v-511ea4c6> für ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</span></p><div class="chk__answer-grid" data-v-511ea4c6>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(FitmentPanel_default, {
					verdict: config.value.verdict ?? null,
					vehicle: vehicle.value,
					"config-id": config.value.id,
					"issue-label": "RIMIFY-Check drucken"
				}, null, _parent));
				_push(`<div class="chk__buy" data-v-511ea4c6>`);
				if (sellable.value) {
					_push(`<!--[-->`);
					_push((0, server_renderer_exports.ssrRenderComponent)(BuyModeChoice_default, {
						modelValue: mode.value,
						"onUpdate:modelValue": ($event) => mode.value = $event,
						name: "chk-mode",
						"rim-price": config.value.price,
						"set-from": setFrom.value
					}, null, _parent));
					if (isSet.value && offer.value) _push((0, server_renderer_exports.ssrRenderComponent)(KomplettradChoice_default, {
						modelValue: tyreId.value,
						"onUpdate:modelValue": ($event) => tyreId.value = $event,
						"colour-id": colourId.value,
						"onUpdate:colourId": ($event) => colourId.value = $event,
						rdks: rdks.value,
						"onUpdate:rdks": ($event) => rdks.value = $event,
						offer: offer.value,
						options: options.value
					}, null, _parent));
					else _push(`<!---->`);
					if (shownPrice.value) {
						_push(`<div class="chk__price" data-v-511ea4c6><p class="price" translate="no" data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(shownPrice.value)}</p><p class="price-note" data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(shownNote.value)}</p>`);
						if (sensorLine.value) _push(`<p class="price-note" data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(sensorLine.value)}</p>`);
						else _push(`<!---->`);
						_push(`</div>`);
					} else _push(`<!---->`);
					_push(`<button class="btn btn--primary btn--block btn--lg chk__go" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!canBuy.value && !(0, vue_exports.unref)(basket).processing && !leaving.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(basket).processing || leaving.value ? "true" : void 0)} data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(buyLabel.value)}</button>`);
					if (setShort.value) _push(`<p class="price-note chk__why" data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(setShort.value)}</p>`);
					else _push(`<!---->`);
					if (addError.value) {
						_push(`<p class="notice notice--bad chk__error" role="alert" data-v-511ea4c6>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "warning",
							size: 20
						}, null, _parent));
						_push(`<span data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(addError.value)}</span></p>`);
					} else _push(`<!---->`);
					_push(`<!--]-->`);
				} else {
					_push(`<div class="notice chk__nosale" data-v-511ea4c6>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "info",
						size: 20
					}, null, _parent));
					_push(`<div data-v-511ea4c6><p class="chk__nosale-text" data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(noSale.value)}</p><p class="chk__nosale-go" data-v-511ea4c6>`);
					_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: "/felgen",
						class: "btn btn--secondary btn--sm"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`Passende Felgen für ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.short)}`);
							else return [(0, vue_exports.createTextVNode)("Passende Felgen für " + (0, vue_exports.toDisplayString)(vehicle.value.short), 1)];
						}),
						_: 1
					}, _parent));
					_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: askHref.value,
						class: "link"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`Bei uns nachfragen`);
							else return [(0, vue_exports.createTextVNode)("Bei uns nachfragen")];
						}),
						_: 1
					}, _parent));
					_push(`</p></div></div>`);
				}
				_push(`<p class="chk__more" data-v-511ea4c6>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: productHref.value,
					class: "link"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Alles zur Felge auf der Produktseite`);
						else return [(0, vue_exports.createTextVNode)("Alles zur Felge auf der Produktseite")];
					}),
					_: 1
				}, _parent));
				_push(`<button class="link chk__copy" type="button" data-v-511ea4c6>Link zu dieser Antwort kopieren</button></p></div></div>`);
				if (config.value.verdict?.detail) _push((0, server_renderer_exports.ssrRenderComponent)(FitmentDetail_default, {
					detail: config.value.verdict.detail,
					"vehicle-label": vehicle.value.label,
					omit: [(0, vue_exports.unref)(ENTRY_REQUIRED), (0, vue_exports.unref)(ABNAHME_REQUIRED)]
				}, null, _parent));
				else _push(`<!---->`);
				_push(`</section>`);
			} else if (__props.chosen.size && !vehicle.value) {
				_push(`<p class="notice chk__ask" data-v-511ea4c6>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "info",
					size: 20
				}, null, _parent));
				_push(`<span data-v-511ea4c6>Wähl oben dein Auto – dann prüfen wir genau diese Felge dafür.</span></p>`);
			} else _push(`<!---->`);
			_push(`</div></section><section class="section band" data-v-511ea4c6><div class="container" data-v-511ea4c6><h2 class="t-h2" data-v-511ea4c6>Vier mögliche Ergebnisse</h2><dl class="chk__states" data-v-511ea4c6><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(STATES, (state) => {
				_push(`<div class="chk__state" data-v-511ea4c6><dt data-v-511ea4c6>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, { status: state.status }, null, _parent));
				_push(`</dt><dd class="t-body" data-v-511ea4c6>${(0, server_renderer_exports.ssrInterpolate)(state.text)}</dd></div>`);
			});
			_push(`<!--]--></dl></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Check/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Check/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-511ea4c6"]]);
//#endregion
export { Index_default as default };
