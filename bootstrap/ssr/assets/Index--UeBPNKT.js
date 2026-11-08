import { D as useShared, c as contactHref, f as priceTerms } from "./useShopFeedback-kI2ariWw.js";
import { a as link_default, c as useRemember, d as vue_exports, i as head_default, o as useForm, s as usePage } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as Icon_default } from "./Icon-D4PPT3t7.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import "./toast-Ckkabove.js";
import { t as AppLayout_default } from "./AppLayout-BEDih_l3.js";
import { n as ENTRY_REQUIRED, t as ABNAHME_REQUIRED } from "./papers-B4aUsj_q.js";
import { a as tyreUnconfirmed, h as setSummary, n as KomplettradRefusal_default, r as FitmentPanel_default, s as FitmentDetail_default } from "./basketAdd-DWvRQK5i.js";
import { n as BuyModeChoice_default, t as waitsForPapers } from "./papersForm-3qEdmhgT.js";
import { t as VerdictBadge_default } from "./VerdictBadge-DN_QDpGr.js";
import { t as VehicleSelector_default } from "./VehicleSelector-B-Nu2WTk.js";
//#region resources/js/Pages/Check/Index.vue?vue&type=script&setup=true&lang.ts
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
		const sellable = (0, vue_exports.computed)(() => config.value?.onlyInSet !== true && (config.value?.verdict?.sellable === true || config.value?.verdict?.rimSellable === true));
		const kept = useRemember((0, vue_exports.reactive)({ mode: "felgen" }), "check-kauf");
		const mode = (0, vue_exports.toRef)(kept, "mode");
		const isSet = (0, vue_exports.computed)(() => mode.value === "komplettrad");
		const setOffer = (0, vue_exports.computed)(() => setSummary(config.value));
		const setFrom = (0, vue_exports.computed)(() => setOffer.value.from);
		const setFromUnit = (0, vue_exports.computed)(() => setOffer.value.fromUnit);
		const komplettradHref = (0, vue_exports.computed)(() => config.value ? `/komplettraeder?groesse=${config.value.id}` : "/felgen");
		const rimAmount = (0, vue_exports.computed)(() => 4);
		const rimPrice = (0, vue_exports.computed)(() => config.value?.amounts?.find((a) => a.quantity === rimAmount.value) ?? null);
		const shownPrice = (0, vue_exports.computed)(() => {
			if (isSet.value) return setFrom.value === null ? null : `ab ${setFrom.value}`;
			return rimPrice.value?.text ?? config.value?.price ?? null;
		});
		const shownNote = (0, vue_exports.computed)(() => {
			if (isSet.value) return setFrom.value === null ? "" : `${setFromUnit.value}, ${setOffer.value.priceOpen ? "Komplettrad" : "Komplettrad mit Montage"}, ${terms.value.note}`;
			return rimAmount.value === 1 ? `für 1 Felge, ${terms.value.note}` : `für ${rimAmount.value} Felgen, pro Felge ${config.value?.price ?? ""}, ${terms.value.note}`;
		});
		const basket = useForm({
			kind: "WHEEL",
			wheelConfigId: 0,
			tyreVariantId: null,
			quantity: 4,
			vehicleId: null
		});
		const leaving = (0, vue_exports.ref)(false);
		const canBuy = (0, vue_exports.computed)(() => {
			const current = config.value;
			if (current === null || !sellable.value || !current.inStock || pending.value) return false;
			return !isSet.value;
		});
		const setAwaitsPapers = (0, vue_exports.computed)(() => isSet.value && config.value !== null && config.value.inStock && waitsForPapers(config.value.verdict));
		const buyLabel = (0, vue_exports.computed)(() => {
			if (basket.processing || leaving.value) return "Wird hinzugefügt …";
			if (pending.value) return "Antwort wird geladen …";
			if (config.value !== null && !config.value.inStock) return "Nicht verfügbar";
			if (setAwaitsPapers.value) return "Werte eintragen";
			if (isSet.value) return "Komplettrad gerade nicht möglich";
			return "Jetzt kaufen";
		});
		const buyOffline = (0, vue_exports.ref)(false);
		const addError = (0, vue_exports.computed)(() => basket.errors.tyreVariantId ?? basket.errors.wheelConfigId ?? basket.errors.quantity ?? (buyOffline.value ? "Keine Verbindung – es wurde nichts in den Warenkorb gelegt. Versuch es gleich noch einmal." : null));
		(0, vue_exports.watch)([() => props.answer?.config.id, mode], () => {
			basket.clearErrors();
			buyOffline.value = false;
		});
		const productHref = (0, vue_exports.computed)(() => {
			const answer = props.answer;
			return answer === null ? "/felgen" : `/felgen/${answer.product.slug}?ausfuehrung=${answer.product.finishId}&groesse=${answer.config.id}`;
		});
		const noSale = (0, vue_exports.computed)(() => {
			const verdict = config.value?.verdict ?? null;
			if (config.value?.onlyInSet === true) return config.value.setKey ? "Für dein Fahrzeug ist diese Ausführung nur zusammen mit einer anderen für die zweite Achse freigegeben, nicht als vier gleiche Felgen. Den Satz findest du auf der Produktseite." : "Für dein Fahrzeug ist diese Ausführung nur für eine Achse freigegeben, nicht als vier gleiche Felgen.";
			if (tyreUnconfirmed(verdict)) {
				const approved = verdict?.wheelStatus === "CONDITIONAL" ? "Die Felge ist für dein Auto mit Auflagen freigegeben." : "Die Felge ist für dein Auto freigegeben.";
				return waitsForPapers(verdict) ? `${approved} Die Reifen dazu können wir erst bestätigen, wenn du die Werte aus deiner Zulassungsbescheinigung Teil I eingetragen hast – bis dahin bieten wir die Felge dafür nicht an.` : `${approved} Für die Reifen dazu fehlen in unseren Daten noch Angaben – bis sie hinterlegt sind, bieten wir die Felge dafür nicht an.`;
			}
			switch (verdict?.status) {
				case "NOT_PERMITTED": return "In dieser Größe ist die Felge für dein Auto nicht freigegeben, deshalb bieten wir sie dafür nicht an.";
				default: return "Eine Freigabe dieser Felge für dein Auto können wir nicht belegen, deshalb bieten wir sie dafür nicht an.";
			}
		});
		const askHref = (0, vue_exports.computed)(() => contactHref({
			subject: props.answer ? `RIMIFY-Check: ${props.answer.product.brandName} ${props.answer.product.modelName}` : "RIMIFY-Check",
			from: page.url
		}));
		const papersFirst = (0, vue_exports.computed)(() => tyreUnconfirmed(config.value?.verdict ?? null) && waitsForPapers(config.value?.verdict));
		const STATES = [
			{
				status: "PERMITTED",
				text: "Das Gutachten deckt dein Fahrzeug in dieser Größe ab. Wir nennen dir die Gutachten-Nummer und sagen, ob eine Eintragung nötig ist."
			},
			{
				status: "CONDITIONAL",
				text: "Zulässig unter den Auflagen des Gutachtens, etwa nur mit bestimmten Radschrauben. Jede Auflage steht ausformuliert dabei."
			},
			{
				status: "NOT_PERMITTED",
				text: "Das Gutachten deckt diese Größe für dein Fahrzeug nicht ab. Steht der Grund im Gutachten, nennen wir ihn."
			},
			{
				status: "UNKNOWN",
				text: "Für diese Kombination liegt uns kein Gutachten vor, oder dein Fahrzeug ist darin bei uns noch nicht erfasst. Das heißt nicht, dass die Felge unzulässig ist – nur, dass wir noch nicht belegen können, dass sie zulässig ist."
			}
		];
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "RIMIFY-Check" }, null, _parent));
			_push(`<section class="section-dense" data-v-49f3e1b3><div class="container chk" data-v-49f3e1b3><h1 class="t-h1" data-v-49f3e1b3>Darf diese Felge an mein Auto?</h1><p class="t-lead chk__lead" data-v-49f3e1b3> Wähle dein Auto und die Felge. Du bekommst eine Antwort für genau diese Kombination – mit dem Gutachten, seinen Auflagen und der Seite, auf der das steht. </p><div class="${(0, server_renderer_exports.ssrRenderClass)([{ "chk__pick--choosing": choosingVehicle.value }, "chk__pick"])}" data-v-49f3e1b3><section class="chk__step" aria-labelledby="chk-car-h" data-v-49f3e1b3><h2 id="chk-car-h" class="chk__step-h" tabindex="-1" data-v-49f3e1b3>Dein Auto</h2>`);
			if (!choosingVehicle.value && vehicle.value) _push(`<div class="chk__car" data-v-49f3e1b3><div class="chk__car-text" data-v-49f3e1b3><p class="chk__vehicle" data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</p><p class="data" data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.approval ?? `${vehicle.value.keyNumbers} · ${vehicle.value.buildWindow}`)}</p></div><button class="btn btn--quiet" type="button" data-v-49f3e1b3> Ändern<span class="visually-hidden" data-v-49f3e1b3> (Fahrzeug)</span></button></div>`);
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
				if (vehicle.value) _push(`<p class="chk__cancel" data-v-49f3e1b3><button class="link" type="button" data-v-49f3e1b3>Abbrechen – ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.short)} behalten</button></p>`);
				else _push(`<!---->`);
				_push(`<!--]-->`);
			}
			_push(`</section><section class="chk__step" aria-labelledby="chk-wheel-h" data-v-49f3e1b3><h2 id="chk-wheel-h" class="chk__step-h" data-v-49f3e1b3>Deine Felge</h2>`);
			if (__props.wheelBrands.length === 0) {
				_push(`<p class="chk__none" data-v-49f3e1b3> Noch ist keine Felge im Sortiment. Sobald die ersten freigegeben sind, prüfst du sie hier. `);
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
				_push(`<div class="chk__fields" data-v-49f3e1b3><div class="form-field" data-v-49f3e1b3><label class="form-field__label" for="chk-brand" data-v-49f3e1b3>Hersteller</label><select id="chk-brand" class="input"${(0, server_renderer_exports.ssrRenderAttr)("value", __props.chosen.brand ?? "")} data-v-49f3e1b3><option value="" disabled${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!__props.chosen.brand) ? " selected" : ""} data-v-49f3e1b3>Hersteller wählen</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.wheelBrands, (brand) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", brand.slug)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(brand.slug === __props.chosen.brand) ? " selected" : ""} data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(brand.name)}</option>`);
				});
				_push(`<!--]--></select></div><div class="form-field" data-v-49f3e1b3><label class="form-field__label" for="chk-wheel" data-v-49f3e1b3>Felge</label><select id="chk-wheel" class="input"${(0, server_renderer_exports.ssrRenderAttr)("value", __props.chosen.wheel ?? "")}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.wheelModels.length === 0) ? " disabled" : ""} data-v-49f3e1b3><option value="" disabled${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!__props.chosen.wheel) ? " selected" : ""} data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(__props.chosen.brand ? "Felge wählen" : "Zuerst den Hersteller")}</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.wheelModels, (model) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", model.slug)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(model.slug === __props.chosen.wheel) ? " selected" : ""} data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(model.name)}</option>`);
				});
				_push(`<!--]--></select></div><div class="form-field" data-v-49f3e1b3><label class="form-field__label" for="chk-finish" data-v-49f3e1b3>Ausführung</label><select id="chk-finish" class="input"${(0, server_renderer_exports.ssrRenderAttr)("value", __props.chosen.finish ?? "")}${(0, server_renderer_exports.ssrIncludeBooleanAttr)((__props.wheelFinishes ?? []).length === 0) ? " disabled" : ""} data-v-49f3e1b3><option value="" disabled${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!__props.chosen.finish) ? " selected" : ""} data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(__props.chosen.wheel ? "Ausführung wählen" : "Zuerst die Felge")}</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.wheelFinishes ?? [], (finish) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", finish.id)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(finish.id === __props.chosen.finish) ? " selected" : ""} data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(finish.name)}</option>`);
				});
				_push(`<!--]--></select></div><div class="form-field" data-v-49f3e1b3><label class="form-field__label" for="chk-size" data-v-49f3e1b3>Größe</label><select id="chk-size" class="input"${(0, server_renderer_exports.ssrRenderAttr)("value", __props.chosen.size ?? "")}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.wheelSizes.length === 0) ? " disabled" : ""} data-v-49f3e1b3><option value="" disabled${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!__props.chosen.size) ? " selected" : ""} data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(__props.chosen.wheel ? "Größe wählen" : "Zuerst die Felge")}</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.wheelSizes, (size) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", size.id)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(size.id === __props.chosen.size) ? " selected" : ""} data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(size.label)}</option>`);
				});
				_push(`<!--]--></select></div></div>`);
			}
			if (offline.value) {
				_push(`<p class="notice notice--bad chk__lost" role="alert" data-v-49f3e1b3>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "warning",
					size: 20
				}, null, _parent));
				_push(`<span data-v-49f3e1b3>Keine Verbindung – deine Auswahl konnte nicht geladen werden. Versuch es gleich noch einmal.</span></p>`);
			} else _push(`<!---->`);
			if (__props.notFound) {
				_push(`<p class="notice chk__lost" role="status" data-v-49f3e1b3>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "info",
					size: 20
				}, null, _parent));
				_push(`<span data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(__props.notFound === "wheel" ? "Die Felge aus dem Link gibt es bei uns nicht mehr. Wähle einen Hersteller und eine andere Felge." : "Diese Felge gibt es in der Größe aus dem Link nicht mehr. Wähle oben eine andere Größe.")}</span></p>`);
			} else _push(`<!---->`);
			_push(`</section></div><p class="visually-hidden" role="status" aria-live="polite" data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(announce.value)}</p>`);
			if (__props.answer && config.value && vehicle.value) {
				_push(`<section id="antwort" class="${(0, server_renderer_exports.ssrRenderClass)([{ "chk__answer--pending": pending.value }, "chk__answer"])}" aria-labelledby="chk-answer-h"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", pending.value ? "true" : void 0)} data-v-49f3e1b3><h2 id="chk-answer-h" class="visually-hidden" data-v-49f3e1b3>Die Antwort</h2><p class="chk__pair" data-v-49f3e1b3><span translate="no" data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(__props.answer.product.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(__props.answer.product.modelName)}</span> · <span translate="no" data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(__props.answer.product.finishName)}</span> · <span class="tabular chk__size" translate="no" data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(config.value.sizeLabel)}</span><span class="chk__for" data-v-49f3e1b3> für ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</span></p><div class="chk__answer-grid" data-v-49f3e1b3>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(FitmentPanel_default, {
					verdict: config.value.verdict ?? null,
					vehicle: vehicle.value,
					"config-id": config.value.onlyInSet ? null : config.value.id,
					"issue-label": "RIMIFY-Check drucken"
				}, null, _parent));
				_push(`<div class="chk__buy" data-v-49f3e1b3>`);
				if (sellable.value) {
					_push(`<!--[-->`);
					_push((0, server_renderer_exports.ssrRenderComponent)(BuyModeChoice_default, {
						modelValue: mode.value,
						"onUpdate:modelValue": ($event) => mode.value = $event,
						name: "chk-mode",
						"rim-price": config.value.price,
						"set-from": setFrom.value,
						"set-from-unit": setFromUnit.value
					}, null, _parent));
					if (isSet.value && setOffer.value.refusal) _push((0, server_renderer_exports.ssrRenderComponent)(KomplettradRefusal_default, {
						sentence: setOffer.value.refusal,
						code: setOffer.value.refusalCode
					}, null, _parent));
					else _push(`<!---->`);
					if (shownPrice.value) _push(`<div class="chk__price" data-v-49f3e1b3><p class="price" translate="no" data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(shownPrice.value)}</p><p class="price-note" data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(shownNote.value)}</p></div>`);
					else _push(`<!---->`);
					if (isSet.value && setOffer.value.ready && !setAwaitsPapers.value && config.value.inStock) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: komplettradHref.value,
						class: "btn btn--primary btn--block btn--lg chk__next"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push(` Weiter zum Komplettrad `);
								_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
									name: "arrow-right",
									size: 20
								}, null, _parent, _scopeId));
							} else return [(0, vue_exports.createTextVNode)(" Weiter zum Komplettrad "), (0, vue_exports.createVNode)(Icon_default, {
								name: "arrow-right",
								size: 20
							})];
						}),
						_: 1
					}, _parent));
					else _push(`<button class="btn btn--primary btn--block btn--lg chk__go" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!canBuy.value && !(0, vue_exports.unref)(basket).processing && !leaving.value && !setAwaitsPapers.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(basket).processing || leaving.value ? "true" : void 0)} data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(buyLabel.value)}</button>`);
					if (addError.value) {
						_push(`<p class="notice notice--bad chk__error" role="alert" data-v-49f3e1b3>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "warning",
							size: 20
						}, null, _parent));
						_push(`<span data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(addError.value)}</span></p>`);
					} else _push(`<!---->`);
					_push(`<!--]-->`);
				} else {
					_push(`<div class="notice chk__nosale" data-v-49f3e1b3>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "info",
						size: 20
					}, null, _parent));
					_push(`<div data-v-49f3e1b3><p class="chk__nosale-text" data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(noSale.value)}</p>`);
					if (papersFirst.value) _push(`<p class="chk__nosale-go" data-v-49f3e1b3><button class="btn btn--secondary btn--sm" type="button" data-v-49f3e1b3>Werte eintragen</button></p>`);
					else {
						_push(`<p class="chk__nosale-go" data-v-49f3e1b3>`);
						if (config.value.setKey) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: `${productHref.value}&satz=${config.value.setKey}`,
							class: "btn btn--primary btn--sm",
							"data-go-set": ""
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Zum Satz`);
								else return [(0, vue_exports.createTextVNode)("Zum Satz")];
							}),
							_: 1
						}, _parent));
						else _push(`<!---->`);
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
						_push(`</p>`);
					}
					_push(`</div></div>`);
				}
				_push(`<p class="chk__more" data-v-49f3e1b3>`);
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
				_push(`<button class="link chk__copy" type="button" data-v-49f3e1b3>Link zu dieser Antwort kopieren</button></p></div></div>`);
				if (config.value.verdict?.detail) _push((0, server_renderer_exports.ssrRenderComponent)(FitmentDetail_default, {
					detail: config.value.verdict.detail,
					"vehicle-label": vehicle.value.label,
					omit: [(0, vue_exports.unref)(ENTRY_REQUIRED), (0, vue_exports.unref)(ABNAHME_REQUIRED)]
				}, null, _parent));
				else _push(`<!---->`);
				_push(`</section>`);
			} else if (__props.chosen.size && !vehicle.value) {
				_push(`<p class="notice chk__ask" data-v-49f3e1b3>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "info",
					size: 20
				}, null, _parent));
				_push(`<span data-v-49f3e1b3>Wähle oben dein Auto – dann prüfen wir genau diese Felge dafür.</span></p>`);
			} else _push(`<!---->`);
			_push(`</div></section><section class="section band" data-v-49f3e1b3><div class="container" data-v-49f3e1b3><h2 class="t-h2" data-v-49f3e1b3>Vier mögliche Ergebnisse</h2><dl class="chk__states" data-v-49f3e1b3><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(STATES, (state) => {
				_push(`<div class="chk__state" data-v-49f3e1b3><dt data-v-49f3e1b3>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, { status: state.status }, null, _parent));
				_push(`</dt><dd class="t-body" data-v-49f3e1b3>${(0, server_renderer_exports.ssrInterpolate)(state.text)}</dd></div>`);
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
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-49f3e1b3"]]);
//#endregion
export { Index_default as default };
