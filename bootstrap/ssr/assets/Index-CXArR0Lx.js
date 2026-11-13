import { _ as DialogClose_default, i as DialogOverlay_default, n as DialogTitle_default, o as DialogContent_default, r as DialogPortal_default, v as DialogRoot_default } from "./Dialog-Hg9IsA0U.js";
import { D as useShared, c as contactHref, f as priceTerms, x as claimBottomEdge, y as useVehicleChangeHref } from "./useShopFeedback-kI2ariWw.js";
import { a as link_default, c as useRemember, d as vue_exports, i as head_default, l as router, o as useForm, s as usePage } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as Icon_default } from "./Icon-D4PPT3t7.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as decimal, s as withUnit } from "./format-6R0uUMt3.js";
import { t as Picture_default } from "./Picture-BCiP7qkM.js";
import { t as AppLayout_default } from "./AppLayout-BEDih_l3.js";
import { n as ENTRY_REQUIRED, t as ABNAHME_REQUIRED } from "./papers-B4aUsj_q.js";
import { h as setSummary, i as sellable, n as KomplettradRefusal_default, o as useConfigurator, r as FitmentPanel_default, s as FitmentDetail_default } from "./basketAdd-D0LLI9A1.js";
import { n as BuyModeChoice_default, t as waitsForPapers } from "./papersForm-3qEdmhgT.js";
import { t as ValueText_default } from "./ValueText-YEd3Pu5w.js";
import { t as ProductPhoto_default } from "./ProductPhoto-D-w9M_-d.js";
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
var _sfc_setup$1 = AmountStepper_vue_vue_type_script_setup_true_lang_default.setup;
AmountStepper_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/AmountStepper.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var AmountStepper_default = /*#__PURE__*/ _plugin_vue_export_helper_default(AmountStepper_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-55171959"]]);
//#endregion
//#region resources/js/Pages/Produkt/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		wheelSets: {},
		product: {},
		reviews: {},
		finishes: {},
		configs: {},
		openOn: {},
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
		* Komplettrad goes on in its own steps from the size on screen (the Gutachten rework §9), or the page says in one sentence why there
		* is none; the offer travels inside the configuration, so a size change swaps it in the same commit as the price. Switching keeps the
		* finish, the size and the amount of rims.
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
		const linked = new URL(page.url ?? "/", "http://localhost").searchParams;
		const linkedSize = Number(linked.get("groesse")) || null;
		const linkedFinish = props.finishes.find((item) => item.id === Number(linked.get("ausfuehrung")))?.id ?? null;
		const linkedSetFinish = (props.wheelSets ?? []).find((item) => item.key === linked.get("satz"))?.finishId ?? null;
		const openingFinish = props.configs.find((item) => item.id === linkedSize)?.finishId ?? linkedSetFinish ?? linkedFinish ?? props.finishes[0]?.id ?? 0;
		const config = useConfigurator(() => props.configs, openingFinish, linkedSize, () => props.openOn ?? {}, () => props.wheelSets ?? [], linked.get("satz"));
		const finish = (0, vue_exports.computed)(() => props.finishes.find((f) => f.id === config.finishId.value) ?? null);
		const selected = (0, vue_exports.computed)(() => config.selected.value);
		const chosenSet = (0, vue_exports.computed)(() => config.selectedSet.value);
		const offerNow = (0, vue_exports.computed)(() => chosenSet.value ?? selected.value);
		(0, vue_exports.watch)([
			config.finishId,
			config.configId,
			config.setKey
		], ([finishId, configId, setKey]) => {
			const url = new URL(window.location.href);
			if (setKey === null) url.searchParams.delete("satz");
			else url.searchParams.set("satz", setKey);
			url.searchParams.set("ausfuehrung", String(finishId));
			if (configId === null) url.searchParams.delete("groesse");
			else url.searchParams.set("groesse", String(configId));
			router.replace({
				url: url.pathname + url.search + url.hash,
				preserveScroll: true,
				preserveState: true
			});
		});
		const othersAsked = (0, vue_exports.ref)(false);
		const selectedIsOther = (0, vue_exports.computed)(() => config.others.value.some((other) => other.id === selected.value?.id));
		const othersShown = (0, vue_exports.computed)(() => othersAsked.value || selectedIsOther.value);
		(0, vue_exports.watch)([config.finishId, () => selected.value?.diameterIn], () => {
			othersAsked.value = false;
		});
		const STANDING_WORD = {
			refused: "nicht freigegeben",
			none: "keine Freigabe vorliegend",
			open: "noch nicht bestätigt",
			axle: "nur für eine Achse freigegeben"
		};
		const othersLine = (0, vue_exports.computed)(() => {
			const count = (standing) => config.others.value.filter((other) => other.standing === standing).length;
			const more = config.versions.value.length > 0 ? "weitere " : "";
			const stated = (n, word) => `${n} ${more}${n === 1 ? "Ausführung ist" : "Ausführungen sind"} für dein Fahrzeug ${word}`;
			const none = count("none");
			const line = [
				count("refused") > 0 ? stated(count("refused"), "nicht freigegeben") : "",
				none > 0 ? `für ${none} ${more}${none === 1 ? "Ausführung" : "Ausführungen"} liegt uns für dein Fahrzeug keine Freigabe vor` : "",
				count("open") > 0 ? stated(count("open"), "noch nicht bestätigt") : "",
				count("axle") > 0 ? stated(count("axle"), "nur für eine Achse freigegeben") : ""
			].filter(Boolean).join("; ");
			return `${line.charAt(0).toUpperCase()}${line.slice(1)}.`;
		});
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
			const standings = new Set(config.sizes.value.flatMap((s) => s.standings));
			if (standings.has("axle") && standings.size === 1) return "Durchgestrichene Größen sind für dein Fahrzeug nur für eine Achse freigegeben.";
			const refused = standings.has("refused");
			const none = standings.has("none");
			const open = standings.has("open");
			if (refused && none) return open ? "Durchgestrichene Größen: für dein Fahrzeug nicht freigegeben, keine Freigabe vorliegend oder noch nicht bestätigt." : "Durchgestrichene Größen sind für dein Fahrzeug nicht freigegeben, oder uns liegt für sie keine Freigabe vor.";
			if (refused) return `Durchgestrichene Größen sind für dein Fahrzeug nicht freigegeben${open ? ", oder wir können sie noch nicht bestätigen." : "."}`;
			if (none) return `Für durchgestrichene Größen liegt uns für dein Fahrzeug keine Freigabe vor${open ? ", oder wir können sie noch nicht bestätigen." : "."}`;
			return open ? "Durchgestrichene Größen können wir für dein Fahrzeug noch nicht bestätigen." : null;
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
		const carHref = useVehicleChangeHref();
		const zoomOpen = (0, vue_exports.ref)(false);
		const basket = useForm({
			kind: "WHEEL",
			wheelConfigId: 0,
			rearWheelConfigId: null,
			tyreVariantId: null,
			quantity: 4,
			vehicleId: null
		});
		const offline = (0, vue_exports.ref)(false);
		const kept = useRemember((0, vue_exports.reactive)({
			mode: "felgen",
			amount: 4
		}), `produkt-${props.product.modelId}`);
		const mode = (0, vue_exports.toRef)(kept, "mode");
		const isSet = (0, vue_exports.computed)(() => mode.value === "komplettrad");
		const setOffer = (0, vue_exports.computed)(() => setSummary(offerNow.value));
		const setFrom = (0, vue_exports.computed)(() => setOffer.value.from);
		const setFromUnit = (0, vue_exports.computed)(() => setOffer.value.fromUnit);
		const setWords = (0, vue_exports.computed)(() => setOffer.value.priceOpen ? "Komplettrad" : "Komplettrad mit Montage");
		const komplettradHref = (0, vue_exports.computed)(() => {
			if (chosenSet.value !== null) return `/komplettraeder?groesse=${chosenSet.value.frontId}&hinten=${chosenSet.value.rearId}`;
			return selected.value ? `/komplettraeder?groesse=${selected.value.id}` : "/felgen";
		});
		(0, vue_exports.watch)([
			mode,
			() => selected.value?.id,
			config.setKey
		], () => {
			basket.clearErrors();
			offline.value = false;
		});
		const amount = (0, vue_exports.toRef)(kept, "amount");
		const designationApart = (0, vue_exports.computed)(() => {
			const designation = props.product.typeDesignation?.trim() ?? "";
			return designation !== "" && !`${props.product.brandName} ${props.product.modelName}`.toLocaleLowerCase("de-DE").includes(designation.toLocaleLowerCase("de-DE"));
		});
		const maxAmount = (0, vue_exports.computed)(() => {
			const offered = selected.value?.amounts?.map((a) => a.quantity) ?? [];
			return Math.max(1, ...offered);
		});
		(0, vue_exports.watch)(maxAmount, (max) => {
			if ((selected.value?.amounts?.length ?? 0) > 0) amount.value = Math.min(Math.max(1, amount.value), max);
		}, { immediate: true });
		(0, vue_exports.watch)(amount, () => basket.clearErrors());
		const amountPrice = (0, vue_exports.computed)(() => selected.value?.amounts?.find((a) => a.quantity === amount.value) ?? null);
		const amountNote = (0, vue_exports.computed)(() => {
			const current = selected.value;
			if (current === null || amountPrice.value === null) return `pro Felge, ${terms.value.note}`;
			return `${amount.value} × ${current.price} = ${amountPrice.value.text}, ${terms.value.note}`;
		});
		const enquiryHref = (0, vue_exports.computed)(() => {
			const current = offerNow.value;
			return current === null || current.inStock || !current.enquiry || selectedIsOther.value ? null : contactHref({
				subject: current.enquiry,
				from: page.url
			});
		});
		const stockLabel = (0, vue_exports.computed)(() => {
			const inStock = offerNow.value?.inStock === true;
			if (props.demo === true) return inStock ? "Beispielsortiment" : "Beispielsortiment · nicht verfügbar";
			return inStock ? "Verfügbar" : "Nicht verfügbar";
		});
		const unavailableHint = (0, vue_exports.computed)(() => {
			const current = offerNow.value;
			if (current === null || current.inStock) return "";
			if (props.configs.some((c) => c.id !== selected.value?.id && c.inStock && sellable(c)) || (props.wheelSets ?? []).some((set) => set.key !== chosenSet.value?.key && set.inStock)) return "Wähl eine andere Größe oder Farbe.";
			return current.verdict === null ? "Diese Felge ist zurzeit in keiner Größe oder Farbe verfügbar." : "Für dein Fahrzeug ist diese Felge zurzeit in keiner anderen Größe oder Farbe verfügbar.";
		});
		const stockTone = (0, vue_exports.computed)(() => {
			if (props.demo === true) return "tag--unknown";
			return offerNow.value?.inStock === true ? "tag--ok" : "tag--danger";
		});
		function specView(config, title) {
			const kg = config.maxLoadKg;
			const grams = config.weightG;
			return {
				title,
				config,
				documentBore: config.verdict?.centreBore ?? null,
				boreConflict: config.verdict?.centreBoreSource === "CONFLICTING",
				rimBoreLabel: config.verdict ? "Mittenlochbohrung der Felge" : "Mittenlochbohrung",
				maxLoad: typeof kg === "number" && kg > 0 ? withUnit(decimal(kg, 0), "kg") : null,
				weight: grams === null || grams === void 0 ? null : withUnit(decimal(grams / 1e3, 1), "kg")
			};
		}
		const specViews = (0, vue_exports.computed)(() => {
			const set = chosenSet.value;
			const versionOf = (id) => props.configs.find((config) => config.id === id);
			if (set !== null) {
				const front = versionOf(set.frontId);
				const rear = versionOf(set.rearId);
				if (front !== void 0 && rear !== void 0) return [specView(front, "Vorne"), specView(rear, "Hinten")];
			}
			return selected.value === null ? [] : [specView(selected.value, null)];
		});
		const canBuy = (0, vue_exports.computed)(() => {
			const current = offerNow.value;
			if (current === null || !current.inStock) return false;
			if (chosenSet.value === null && selected.value?.onlyInSet === true) return false;
			if (isSet.value) return false;
			return current.verdict === null || current.verdict.sellable || current.verdict.rimSellable === true;
		});
		const papersFirst = (0, vue_exports.computed)(() => offerNow.value !== null && offerNow.value.inStock && waitsForPapers(offerNow.value.verdict) && (isSet.value || offerNow.value.verdict?.rimSellable !== true));
		const buyLabel = (0, vue_exports.computed)(() => {
			if (basket.processing) return "Wird hinzugefügt …";
			if (offerNow.value !== null && !offerNow.value.inStock) return "In den Warenkorb";
			if (papersFirst.value) return "Werte eintragen";
			if (isSet.value) return "Komplettrad gerade nicht möglich";
			return "In den Warenkorb";
		});
		const shownPrice = (0, vue_exports.computed)(() => {
			if (isSet.value) return setFrom.value === null ? null : `ab ${setFrom.value}`;
			if (chosenSet.value !== null) return chosenSet.value.price;
			return amountPrice.value?.text ?? selected.value?.price ?? config.fromPrice.value;
		});
		const shownNote = (0, vue_exports.computed)(() => {
			if (!isSet.value) return chosenSet.value !== null ? `${chosenSet.value.priceNote}, ${terms.value.note}` : amountNote.value;
			return setFrom.value === null ? "" : `${setFromUnit.value}, ${setWords.value}, ${terms.value.note}`;
		});
		const addError = (0, vue_exports.computed)(() => basket.errors.tyreVariantId ?? basket.errors.wheelConfigId ?? basket.errors.quantity ?? (offline.value ? "Keine Verbindung – es wurde nichts in den Warenkorb gelegt. Versuch es gleich noch einmal." : null));
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
			_push(`<section class="section-dense" data-v-0f390cd6><div class="wrap" data-v-0f390cd6><nav class="pdp__crumbs t-small" aria-label="Brotkrumen" data-v-0f390cd6>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Startseite`);
					else return [(0, vue_exports.createTextVNode)("Startseite")];
				}),
				_: 1
			}, _parent));
			_push(`<span aria-hidden="true" data-v-0f390cd6>/</span>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/felgen" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Felgen`);
					else return [(0, vue_exports.createTextVNode)("Felgen")];
				}),
				_: 1
			}, _parent));
			_push(`<span aria-hidden="true" data-v-0f390cd6>/</span><span aria-current="page" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(__props.product.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(__props.product.modelName)}</span></nav><div class="pdp" data-v-0f390cd6><div class="pdp__gallery" data-v-0f390cd6><div class="well pdp__well" data-v-0f390cd6>`);
			if (shot.value) {
				_push(`<button type="button" class="pdp__zoom" aria-haspopup="dialog"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Foto vergrößern: ${shotAlt.value}`)} data-v-0f390cd6>`);
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
				_push(`<div class="pdp__thumbs" role="group" aria-label="Ansichten" data-v-0f390cd6><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(shots.value, (view, i) => {
					_push(`<button type="button" class="pdp__thumb"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", i === shotIndex.value)}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", view.label)} data-v-0f390cd6>`);
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
			if (photoNote.value) _push(`<p class="t-small quiet pdp__photo-note" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(photoNote.value)}</p>`);
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
											_push(`<div class="dialog__head" data-v-0f390cd6${_scopeId}>`);
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
											_push(`</div><div class="pdp-zoom__frame" data-v-0f390cd6${_scopeId}>`);
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
			_push(`</div><div class="pdp__buy" data-v-0f390cd6><h1 class="t-h1" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(__props.product.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(__props.product.modelName)}</h1>`);
			if (designationApart.value) {
				_push(`<p class="data pdp__type" data-v-0f390cd6>Radtypenbezeichnung `);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, {
					text: __props.product.typeDesignation ?? "",
					whole: ""
				}, null, _parent));
				_push(`</p>`);
			} else _push(`<!---->`);
			if (__props.product.statedRating) {
				_push(`<p class="stars pdp__rating pdp__rating--stated" data-stated-rating data-v-0f390cd6><span class="stars__glyph" aria-hidden="true" data-v-0f390cd6>★</span> <span class="tabular" data-v-0f390cd6>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: __props.product.statedRating.label }, null, _parent));
				_push(`</span><span class="pdp__rating-origin" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(" – " + __props.product.statedRating.disclosure)}</span></p>`);
			} else if (__props.product.rating !== null && __props.product.ratingCount > 0) {
				_push(`<a href="#bewertungen" class="stars pdp__rating" data-v-0f390cd6><span class="stars__glyph" aria-hidden="true" data-v-0f390cd6>★</span><span class="tabular" data-v-0f390cd6>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: __props.product.ratingLabel ?? "" }, null, _parent));
				_push(`</span></a>`);
			} else if (proofLine.value) _push(`<p class="t-small pdp__proof" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(proofLine.value)}</p>`);
			else _push(`<!---->`);
			_push(`<div class="pdp__block" data-v-0f390cd6><span class="label" data-v-0f390cd6>Farbe · <span translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(finish.value?.name)}</span></span><div class="pdp__swatches" data-v-0f390cd6><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.finishes, (item) => {
				_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pdp__swatch--on": item.id === (0, vue_exports.unref)(config).finishId.value }, "pdp__swatch"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", item.id === (0, vue_exports.unref)(config).finishId.value)} data-v-0f390cd6><span class="pdp__dot" data-qa-ignore style="${(0, server_renderer_exports.ssrRenderStyle)(item.hex ? { "--swatch": item.hex } : void 0)}" data-v-0f390cd6></span><span translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(item.name)}</span></button>`);
			});
			_push(`<!--]--></div>`);
			if ((0, vue_exports.unref)(config).colourLacks.value && selected.value) {
				_push(`<p class="t-small pdp__colour-note" role="status" data-v-0f390cd6>In <span translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(finish.value?.name)}</span> führen wir `);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: (0, vue_exports.unref)(config).colourLacks.value.fullLabel }, null, _parent));
				_push(` nicht. Du siehst stattdessen `);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: selected.value.fullLabel }, null, _parent));
				_push(`.</p>`);
			} else _push(`<!---->`);
			_push(`</div><div id="groessen" class="pdp__block" data-v-0f390cd6><span class="label" data-v-0f390cd6>Durchmesser (<span translate="no" data-v-0f390cd6>Zoll</span>)</span><div class="chip-row pdp__chips" data-v-0f390cd6><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(config).sizes.value, (size) => {
				_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{
					"chip--on": chosenSet.value ? chosenSet.value.diameters.includes(size.diameter) : selected.value?.id === size.config.id,
					"chip--blocked": size.blocked,
					"chip--unconfirmed": size.unconfirmed
				}, "chip"])}" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(size.blocked) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", chosenSet.value ? chosenSet.value.diameters.includes(size.diameter) : selected.value?.id === size.config.id)}${(0, server_renderer_exports.ssrRenderAttr)("title", size.reason ?? void 0)} data-v-0f390cd6><span translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(size.label)}</span></button>`);
			});
			_push(`<!--]--></div>`);
			if (blockedNote.value) _push(`<p class="t-small quiet pdp__note" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(blockedNote.value)}</p>`);
			else _push(`<!---->`);
			if (unconfirmedNote.value) _push(`<p class="t-small quiet pdp__note" data-note="unconfirmed" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(unconfirmedNote.value)}</p>`);
			else _push(`<!---->`);
			_push(`</div>`);
			if ((0, vue_exports.unref)(config).setsHere.value.length) {
				_push(`<div class="pdp__block pdp__sets" data-wheel-sets data-v-0f390cd6><span id="pdp-sets-label" class="label" data-v-0f390cd6>Satz, vorne und hinten verschieden</span><div class="pdp__versions" role="group" aria-labelledby="pdp-sets-label" data-v-0f390cd6><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(config).setsHere.value, (item) => {
					_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pdp__version--on": chosenSet.value?.key === item.key }, "pdp__version pdp__version--set"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", chosenSet.value?.key === item.key)} data-v-0f390cd6><span class="pdp__version-spec" translate="no" data-v-0f390cd6><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(item.axles, (axle) => {
						_push(`<span class="pdp__version-axle" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(axle)}</span>`);
					});
					_push(`<!--]--><span class="pdp__version-bolt" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(item.bolt)}</span></span><span class="pdp__version-price" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(item.price)}</span>`);
					if (!item.inStock) _push(`<span class="tag tag--unknown pdp__version-tag" data-v-0f390cd6>Auf Anfrage</span>`);
					else _push(`<!---->`);
					_push(`<span class="pdp__version-check" aria-hidden="true" data-v-0f390cd6>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "check",
						size: 20
					}, null, _parent));
					_push(`</span></button>`);
				});
				_push(`<!--]--></div><p class="price-note pdp__version-terms" data-v-0f390cd6>Preis für 4 Felgen, ${(0, server_renderer_exports.ssrInterpolate)(terms.value.note)}</p></div>`);
			} else _push(`<!---->`);
			if ((0, vue_exports.unref)(config).variants.value.length) {
				_push(`<div class="pdp__block pdp__variants" data-v-0f390cd6><span id="pdp-variants-label" class="label" data-v-0f390cd6>Ausführung</span>`);
				if ((0, vue_exports.unref)(config).versions.value.length) {
					_push(`<div class="pdp__versions" role="group" aria-labelledby="pdp-variants-label" data-v-0f390cd6><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(config).versions.value, (version) => {
						_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{
							"pdp__version--on": selected.value?.id === version.id,
							"pdp__version--unconfirmed": version.unconfirmed
						}, "pdp__version"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", selected.value?.id === version.id)}${(0, server_renderer_exports.ssrRenderAttr)("title", version.reason ?? void 0)} data-v-0f390cd6><span class="pdp__version-spec" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(version.label)}</span><span class="pdp__version-price" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(version.config.price)}</span>`);
						if (!version.config.inStock) _push(`<span class="tag tag--unknown pdp__version-tag" data-v-0f390cd6>Auf Anfrage</span>`);
						else _push(`<!---->`);
						if (version.unconfirmed) _push(`<span class="tag tag--unknown pdp__version-tag" data-v-0f390cd6>Noch nicht bestätigt</span>`);
						else _push(`<!---->`);
						_push(`<span class="pdp__version-check" aria-hidden="true" data-v-0f390cd6>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "check",
							size: 20
						}, null, _parent));
						_push(`</span></button>`);
					});
					_push(`<!--]--></div>`);
				} else _push(`<!---->`);
				if ((0, vue_exports.unref)(config).versions.value.length) _push(`<p class="price-note pdp__version-terms" data-v-0f390cd6>Preise pro Felge, ${(0, server_renderer_exports.ssrInterpolate)(terms.value.note)}</p>`);
				else _push(`<!---->`);
				if (!__props.hasVehicle) {
					_push(`<p class="t-small pdp__version-hint pdp__version-hint--car" data-v-0f390cd6>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "car",
						size: 20
					}, null, _parent));
					_push(`<span data-v-0f390cd6>Wähle dein Fahrzeug, dann zeigen wir nur die Ausführungen, die dafür freigegeben sind.</span></p>`);
				} else if ((0, vue_exports.unref)(config).others.value.length) {
					_push(`<p class="t-small pdp__version-hint" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(othersLine.value)} `);
					if (!selectedIsOther.value) _push(`<button class="link pdp__version-more" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", othersAsked.value)} data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(othersAsked.value ? "Ausblenden" : "Anzeigen")}</button>`);
					else _push(`<!---->`);
					_push(`</p>`);
				} else _push(`<!---->`);
				if (othersShown.value && (0, vue_exports.unref)(config).others.value.length) {
					_push(`<div class="pdp__versions pdp__versions--others" data-v-0f390cd6><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(config).others.value, (version) => {
						_push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([{
							"pdp__version--on": selected.value?.id === version.id,
							"pdp__version--open": version.standing === "open"
						}, "pdp__version pdp__version--struck"])}" data-v-0f390cd6><span class="pdp__version-spec" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(version.label)}</span><span class="pdp__version-why" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(version.standing ? STANDING_WORD[version.standing] : "")}</span></span>`);
					});
					_push(`<!--]--></div>`);
				} else _push(`<!---->`);
				if (selected.value && !chosenSet.value) {
					_push(`<p class="t-small quiet pdp__chosen" data-v-0f390cd6>Gewählt: `);
					_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: selected.value.fullLabel }, null, _parent));
					_push(`</p>`);
				} else _push(`<!---->`);
				_push(`</div>`);
			} else _push(`<!---->`);
			if (chosenSet.value) {
				_push(`<div class="t-small quiet pdp__chosen pdp__chosen--set" data-set-chosen data-v-0f390cd6><p data-v-0f390cd6>Vorne: `);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: chosenSet.value.frontFull }, null, _parent));
				_push(`</p><p data-v-0f390cd6>Hinten: `);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: chosenSet.value.rearFull }, null, _parent));
				_push(`</p></div>`);
			} else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(FitmentPanel_default, {
				class: "pdp__fit",
				verdict: offerNow.value?.verdict ?? null,
				vehicle: (0, vue_exports.unref)(shared).vehicle,
				"config-id": chosenSet.value ? null : selected.value?.id ?? null,
				"ask-href": askAboutTyres.value
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (!__props.hasVehicle) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: (0, vue_exports.unref)(carHref),
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
						href: (0, vue_exports.unref)(carHref),
						class: "btn btn--secondary btn--sm pdp__fit-cta"
					}, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)(" Fahrzeug wählen ")]),
						_: 1
					}, 8, ["href"])) : (0, vue_exports.createCommentVNode)("", true)];
				}),
				_: 1
			}, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(BuyModeChoice_default, {
				modelValue: mode.value,
				"onUpdate:modelValue": ($event) => mode.value = $event,
				class: "pdp__block pdp__mode",
				"rim-price": offerNow.value?.price ?? null,
				"rim-price-unit": chosenSet.value ? "für 4 Felgen" : "pro Felge",
				"set-from": setFrom.value,
				"set-from-unit": setFromUnit.value
			}, null, _parent));
			if (isSet.value && setOffer.value.refusal) _push((0, server_renderer_exports.ssrRenderComponent)(KomplettradRefusal_default, {
				class: "pdp__block",
				sentence: setOffer.value.refusal,
				code: setOffer.value.refusalCode
			}, null, _parent));
			else _push(`<!---->`);
			_push(`<div class="pdp__price" data-v-0f390cd6>`);
			if (shownPrice.value) {
				_push(`<div class="pdp__price-row" data-v-0f390cd6><div data-v-0f390cd6><p class="price price--lg pdp__total" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(shownPrice.value)}</p><p class="price-note pdp__each" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(shownNote.value)}</p>`);
				if (isSet.value && selected.value?.komplettrad?.priceOpen) _push(`<p class="price-note" data-v-0f390cd6>Ohne Montage und Auswuchten – der Preis dafür steht noch nicht fest.</p>`);
				else _push(`<!---->`);
				_push(`</div>`);
				if (!isSet.value && selected.value && amountPrice.value && !chosenSet.value) _push((0, server_renderer_exports.ssrRenderComponent)(AmountStepper_default, {
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
			if (__props.shipping) _push(`<p class="price-note pdp__shipping" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(__props.shipping)}</p>`);
			else _push(`<!---->`);
			_push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([stockTone.value, "tag pdp__stock"])}" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(stockLabel.value)}</span>`);
			if (unavailableHint.value) _push(`<p id="pdp-unavailable" class="t-small pdp__unavailable" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(unavailableHint.value)}</p>`);
			else _push(`<!---->`);
			if (__props.demo) _push(`<p class="t-small pdp__demo" data-v-0f390cd6> Beispielsortiment: Diese Felge kannst du dir ansehen und in den Warenkorb legen, bestellen kannst du sie noch nicht. </p>`);
			else if (__props.acceptance) _push(`<p class="t-small pdp__demo" data-v-0f390cd6> Demodaten zum Ausprobieren: Bestellen geht hier nur mit der Testzahlung, verschickt wird nichts. </p>`);
			else _push(`<!---->`);
			_push(`</div><div data-v-0f390cd6>`);
			if (enquiryHref.value) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: enquiryHref.value,
				class: "btn btn--primary btn--block btn--lg pdp__enquiry",
				"aria-describedby": unavailableHint.value ? "pdp-unavailable" : void 0
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(` Anfrage `);
					else return [(0, vue_exports.createTextVNode)(" Anfrage ")];
				}),
				_: 1
			}, _parent));
			else if (isSet.value && setOffer.value.ready && !papersFirst.value) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: komplettradHref.value,
				class: "btn btn--primary btn--block btn--lg pdp__next"
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
			else _push(`<button class="btn btn--primary btn--block btn--lg pdp__add" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!canBuy.value && !papersFirst.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(basket).processing ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", unavailableHint.value ? "pdp-unavailable" : void 0)} data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(buyLabel.value)}</button>`);
			if (addError.value) {
				_push(`<p class="notice notice--bad pdp__add-error" role="alert" data-v-0f390cd6>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "warning",
					size: 20
				}, null, _parent));
				_push(`<span data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(addError.value)}</span></p>`);
			} else _push(`<!---->`);
			_push(`</div></div></div>`);
			if (offerNow.value?.verdict?.detail && (0, vue_exports.unref)(shared).vehicle) _push((0, server_renderer_exports.ssrRenderComponent)(FitmentDetail_default, {
				detail: offerNow.value.verdict.detail,
				"vehicle-label": (0, vue_exports.unref)(shared).vehicle.label,
				omit: [(0, vue_exports.unref)(ENTRY_REQUIRED), (0, vue_exports.unref)(ABNAHME_REQUIRED)]
			}, null, _parent));
			else _push(`<!---->`);
			if (selected.value) {
				_push(`<section class="pdp__specs" aria-labelledby="pdp-specs" data-v-0f390cd6><h2 id="pdp-specs" class="t-h2" data-v-0f390cd6>Felgendetails</h2><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(specViews.value, (view) => {
					_push(`<!--[-->`);
					if (view.title) _push(`<h3 class="t-h3 pdp__specs-axle"${(0, server_renderer_exports.ssrRenderAttr)("data-spec-axle", view.title)} data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(view.title)}</h3>`);
					else _push(`<!---->`);
					_push(`<p class="t-small quiet pdp__specs-for" data-v-0f390cd6>Für `);
					_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: view.config.fullLabel }, null, _parent));
					_push(`</p><dl class="spec" data-v-0f390cd6><div class="spec__row" data-v-0f390cd6><dt data-v-0f390cd6>Größe</dt><dd class="t-mono" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(view.config.sizeLabel)}</dd></div><div class="spec__row" data-v-0f390cd6><dt data-v-0f390cd6>Lochkreis</dt><dd class="t-mono" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(view.config.boltPattern)}</dd></div>`);
					if (view.documentBore) _push(`<div class="spec__row spec__row--doc" data-v-0f390cd6><dt data-v-0f390cd6> Mittenlochbohrung für dein Fahrzeug <span class="spec__hint" data-v-0f390cd6>laut Gutachten</span></dt><dd class="t-mono" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(view.documentBore)}</dd></div>`);
					else _push(`<!---->`);
					_push(`<div class="spec__row" data-v-0f390cd6><dt data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(view.rimBoreLabel)}</dt><dd class="t-mono" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(view.config.centreBore)}</dd></div><div class="spec__row" data-v-0f390cd6><dt data-v-0f390cd6>Einpresstiefe (ET)</dt><dd class="t-mono" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)(view.config.etMm, "mm"))}</dd></div>`);
					if (view.config.hump) _push(`<div class="spec__row" data-v-0f390cd6><dt data-v-0f390cd6>Hump</dt><dd class="t-mono" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(view.config.hump)}</dd></div>`);
					else _push(`<!---->`);
					if (finish.value) _push(`<div class="spec__row" data-v-0f390cd6><dt data-v-0f390cd6>Farbe</dt><dd class="t-mono" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(finish.value.name)}</dd></div>`);
					else _push(`<!---->`);
					if (__props.product.spokes > 0) _push(`<div class="spec__row" data-v-0f390cd6><dt data-v-0f390cd6>Speichen</dt><dd class="t-mono" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(__props.product.spokes)}</dd></div>`);
					else _push(`<!---->`);
					if (view.weight) _push(`<div class="spec__row" data-v-0f390cd6><dt data-v-0f390cd6>Gewicht pro Felge</dt><dd class="t-mono" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(view.weight)}</dd></div>`);
					else _push(`<!---->`);
					if (view.maxLoad) _push(`<div class="spec__row" data-v-0f390cd6><dt data-v-0f390cd6>Traglast</dt><dd class="t-mono" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(view.maxLoad)}</dd></div>`);
					else _push(`<!---->`);
					if (view.config.kbaNumber) _push(`<div class="spec__row" data-v-0f390cd6><dt data-v-0f390cd6>KBA-Nummer</dt><dd class="t-mono" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(view.config.kbaNumber)}</dd></div>`);
					else _push(`<!---->`);
					_push(`<div class="spec__row" data-v-0f390cd6><dt data-v-0f390cd6>Artikelnummer</dt><dd class="t-mono" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(view.config.sku)}</dd></div></dl>`);
					if (view.boreConflict) _push(`<p class="t-small quiet pdp__specs-note" data-v-0f390cd6> Für dein Fahrzeug nennen die Gutachten unterschiedliche Mittenlochbohrungen. Wir zeigen dir deshalb nur das Maß der Felge. </p>`);
					else _push(`<!---->`);
					_push(`<!--]-->`);
				});
				_push(`<!--]-->`);
				if (__props.product.descriptionDe) _push(`<p class="t-body pdp__desc" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(__props.product.descriptionDe)}</p>`);
				else _push(`<!---->`);
				_push(`</section>`);
			} else _push(`<!---->`);
			if (reviews.value.length > 0) {
				_push(`<section id="bewertungen" class="pdp__reviews" aria-labelledby="pdp-reviews" data-v-0f390cd6><h2 id="pdp-reviews" class="t-h2" data-v-0f390cd6>Bewertungen</h2>`);
				if (__props.product.ratingLabel) {
					_push(`<p class="stars pdp__reviews-sum" data-v-0f390cd6><span class="stars__glyph" aria-hidden="true" data-v-0f390cd6>★</span><span class="tabular" data-v-0f390cd6>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: __props.product.ratingLabel }, null, _parent));
					_push(`</span></p>`);
				} else _push(`<!---->`);
				_push(`<p class="t-small quiet pdp__reviews-check" data-v-0f390cd6> Diese Bewertungen stammen von Kundinnen und Kunden, die diese Felge hier gekauft haben. Wir prüfen das über die Bestellnummer. </p><ul class="pdp__review-list" data-v-0f390cd6><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(reviews.value, (review) => {
					_push(`<li class="pdp__review" data-v-0f390cd6><p class="pdp__review-head" data-v-0f390cd6><span class="pdp__review-stars" role="img"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", starsLabel(review.rating))} data-v-0f390cd6><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(5, (n) => {
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							key: n,
							name: "star",
							size: 16,
							class: n <= review.rating ? "pdp__star-on" : "pdp__star-off"
						}, null, _parent));
					});
					_push(`<!--]--></span><span class="t-small quiet" data-v-0f390cd6>Geprüfter Kauf`);
					if (review.at) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(review.at)}<!--]-->`);
					else _push(`<!---->`);
					_push(`</span></p>`);
					if (review.body) _push(`<p class="t-body pdp__review-body" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(review.body)}</p>`);
					else _push(`<!---->`);
					if (review.reply) _push(`<p class="t-small pdp__review-reply" data-v-0f390cd6><strong data-v-0f390cd6>Antwort von RIMIFY:</strong> ${(0, server_renderer_exports.ssrInterpolate)(review.reply)}</p>`);
					else _push(`<!---->`);
					_push(`</li>`);
				});
				_push(`<!--]--></ul></section>`);
			} else _push(`<!---->`);
			_push(`<section class="pdp__gpsr" aria-labelledby="pdp-gpsr" data-v-0f390cd6><h2 id="pdp-gpsr" class="t-h3" data-v-0f390cd6>Hersteller und Produktsicherheit</h2>`);
			if (__props.product.manufacturer) {
				_push(`<dl class="pdp__gpsr-list" data-v-0f390cd6><div class="pdp__gpsr-row" data-v-0f390cd6><dt data-v-0f390cd6>Hersteller</dt><dd class="pdp__gpsr-value" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.name)}<br data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.address)}<br data-v-0f390cd6>`);
				if (webAddress(__props.product.manufacturer.contact)) _push(`<a class="link"${(0, server_renderer_exports.ssrRenderAttr)("href", webAddress(__props.product.manufacturer.contact) ?? void 0)} rel="noopener" target="_blank" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.contact)}</a>`);
				else _push(`<span translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.contact)}</span>`);
				_push(`</dd></div>`);
				if (__props.product.manufacturer.euResponsible) {
					_push(`<div class="pdp__gpsr-row" data-v-0f390cd6><dt data-v-0f390cd6>Verantwortliche Person in der EU</dt><dd class="pdp__gpsr-value" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.euResponsible.name)}`);
					if (__props.product.manufacturer.euResponsible.address) _push(`<!--[--><br data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.euResponsible.address)}<!--]-->`);
					else _push(`<!---->`);
					if (__props.product.manufacturer.euResponsible.contact) _push(`<!--[--><br data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.euResponsible.contact)}<!--]-->`);
					else _push(`<!---->`);
					_push(`</dd></div>`);
				} else _push(`<!---->`);
				_push(`<div class="pdp__gpsr-row" data-v-0f390cd6><dt data-v-0f390cd6>Produkt</dt><dd class="pdp__gpsr-value" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(__props.product.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(__props.product.modelName)}`);
				if (designationApart.value) _push(`<!--[--> · Radtypenbezeichnung ${(0, server_renderer_exports.ssrInterpolate)(__props.product.typeDesignation)}<!--]-->`);
				else _push(`<!---->`);
				if (selected.value) _push(`<!--[--> · Artikelnummer ${(0, server_renderer_exports.ssrInterpolate)(selected.value.sku)}<!--]-->`);
				else _push(`<!---->`);
				_push(`</dd></div>`);
				if (__props.product.manufacturer.safetyNote) _push(`<div class="pdp__gpsr-row" data-v-0f390cd6><dt data-v-0f390cd6>Sicherheitshinweise</dt><dd class="pdp__gpsr-value" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(__props.product.manufacturer.safetyNote)}</dd></div>`);
				else _push(`<!---->`);
				_push(`</dl>`);
			} else {
				_push(`<p class="t-small quiet" data-v-0f390cd6> Die Angaben des Herstellers zu dieser Felge liegen uns noch nicht vor. Fragen dazu beantworten wir dir gern – `);
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
				_push(`<div class="stickybar pdp__sticky" data-v-0f390cd6>`);
				if (shownPrice.value) {
					_push(`<div class="pdp__sticky-price" data-v-0f390cd6><p class="price" translate="no" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(shownPrice.value)}</p>`);
					if (isSet.value) _push(`<p class="price-note" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(setFromUnit.value)}, ${(0, server_renderer_exports.ssrInterpolate)(setWords.value)}</p>`);
					else _push(`<p class="price-note" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(chosenSet.value ? "für 4 Felgen" : amountPrice.value ? amount.value === 1 ? "für 1 Felge" : `für ${amount.value} Felgen` : "pro Felge")}</p>`);
					_push(`<p class="price-legal pdp__sticky-legal" data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(terms.value.note)}</p></div>`);
				} else _push(`<!---->`);
				if (enquiryHref.value) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: enquiryHref.value,
					class: "btn btn--primary pdp__sticky-btn"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Anfrage`);
						else return [(0, vue_exports.createTextVNode)("Anfrage")];
					}),
					_: 1
				}, _parent));
				else if (isSet.value && setOffer.value.ready && !papersFirst.value) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: komplettradHref.value,
					class: "btn btn--primary pdp__sticky-btn"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Weiter zum Komplettrad`);
						else return [(0, vue_exports.createTextVNode)("Weiter zum Komplettrad")];
					}),
					_: 1
				}, _parent));
				else _push(`<button class="btn btn--primary pdp__sticky-btn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!canBuy.value && !papersFirst.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(basket).processing ? "true" : void 0)} data-v-0f390cd6>${(0, server_renderer_exports.ssrInterpolate)(unavailableHint.value ? "Nicht verfügbar" : buyLabel.value)}</button>`);
				_push(`</div>`);
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
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-0f390cd6"]]);
//#endregion
export { Index_default as default };
