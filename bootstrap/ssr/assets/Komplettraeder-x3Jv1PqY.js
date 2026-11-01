import { a as link_default, i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as Icon_default } from "./Icon-Bryl-es8.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as formatMoney } from "./num-Br8qlecZ.js";
import { t as SketchBanner_default } from "./SketchBanner-vN_Jjq_z.js";
import { t as SketchSteps_default } from "./SketchSteps-W82jP70e.js";
import { a as SEASONS, c as VERSIONS, i as RDKS, l as WEIGHTS, m as versionShort, n as MOUNTING_EACH_CENTS, o as TYRES, r as MOUNTING_SET_CENTS, s as TYRE_BRANDS, t as CAR, u as WHEEL } from "./shopDemo-CkuVaHdt.js";
import { t as AppLayout_default } from "./AppLayout-DINvPib0.js";
import { n as ENTRY_REQUIRED, t as ABNAHME_REQUIRED } from "./papers-B4aUsj_q.js";
import { t as VerdictBadge_default } from "./VerdictBadge-D63YxADb.js";
import { t as ProductPhoto_default } from "./ProductPhoto-DTdDKSKx.js";
import { a as initialExtras, c as total, i as fitFor, n as basketLines, o as setPrice, r as filterTyres, s as sizesOf, t as PRICE_BANDS } from "./komplettradSketch-BcLQsC6z.js";
import { t as TyreCard_default } from "./TyreCard-BkOGUCPX.js";
import { t as TyreDetails_default } from "./TyreDetails-0Ao8i7-w.js";
//#region resources/js/Pages/Skizze/Komplettraeder.vue?vue&type=script&setup=true&lang.ts
var FIRST = 6;
var STORAGE = "rimify-skizze-komplettrad";
var Komplettraeder_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Komplettraeder",
	__ssrInlineRender: true,
	props: {
		schritt: {},
		ausfuehrung: {}
	},
	setup(__props) {
		/**
		* The Komplettrad chosen step by step, as a sketch (the Gutachten rework brief §9): 1 Felge — the version from the product
		* page — 2 Reifen, as tiles with pictures, filters and more on request, 3 Extras, never a paid one preselected, 4 Warenkorb.
		* The steps wear the admin's step bar, so the shop and the admin read as one product. Only tyres the paper allows for the
		* car and the version are listed; the real list will read them from the verdict as it is, unchanged. Every choice is
		* shown as the shop shows one: a 2 px blue border and the check, no tint (D-132).
		*/
		const props = __props;
		const STEPS = [
			"Felge",
			"Reifen",
			"Extras",
			"Warenkorb"
		];
		const asked = VERSIONS.find((v) => v.id === props.ausfuehrung) ?? null;
		const approved = VERSIONS.filter((v) => v.forCar === "conditional");
		const version = (asked?.forCar === "conditional" ? asked : null) ?? approved.find((v) => v.finish === asked?.finish && v.diameter === asked?.diameter) ?? approved.find((v) => v.finish === asked?.finish) ?? approved[0] ?? VERSIONS[0];
		const swapped = asked !== null && asked.id !== version.id ? `${asked.forCar === "refused" ? `Die Ausführung ${versionShort(asked)} ist für deinen ${CAR.short} nicht freigegeben` : `Für die Ausführung ${versionShort(asked)} liegt uns für deinen ${CAR.short} keine Freigabe vor`}. Gezeigt wird deshalb ${versionShort(version)}.` : null;
		const finish = WHEEL.finishes.find((f) => f.id === version.finish) ?? WHEEL.finishes[0];
		const sizes = sizesOf(version.diameter);
		const fitted = TYRES.map((tyre) => fitFor(tyre, version.diameter));
		const step = (0, vue_exports.ref)((props.schritt ?? 2) - 1);
		const reached = (0, vue_exports.ref)(Math.max(step.value, 1));
		const filter = (0, vue_exports.reactive)({
			mode: "same",
			seasons: [],
			brands: [],
			price: "alle",
			sort: "preis-auf"
		});
		const all = (0, vue_exports.ref)(false);
		const chosenId = (0, vue_exports.ref)(null);
		const detailsId = (0, vue_exports.ref)(null);
		const detailsOpen = (0, vue_exports.ref)(false);
		const start = initialExtras();
		const weights = (0, vue_exports.ref)(start.weights);
		const rdks = (0, vue_exports.ref)(start.rdks);
		const added = (0, vue_exports.ref)(false);
		const list = (0, vue_exports.computed)(() => filterTyres(fitted, filter));
		const shown = (0, vue_exports.computed)(() => all.value ? list.value : list.value.slice(0, FIRST));
		const chosen = (0, vue_exports.computed)(() => fitted.find((t) => t.id === chosenId.value) ?? null);
		const details = (0, vue_exports.computed)(() => fitted.find((t) => t.id === detailsId.value) ?? null);
		const lines = (0, vue_exports.computed)(() => chosen.value ? basketLines(version, chosen.value, filter.mode, weights.value, rdks.value) : []);
		function address(to) {
			const url = new URL(window.location.href);
			url.searchParams.set("schritt", String(to + 1));
			url.searchParams.set("ausfuehrung", version.id);
			return url;
		}
		function allowed(to) {
			return to >= 2 && chosen.value === null ? 1 : to;
		}
		function go(to, push = true, focus = true) {
			step.value = allowed(to);
			reached.value = Math.max(reached.value, step.value);
			if (typeof window === "undefined") return;
			if (push) window.history.pushState({
				...window.history.state,
				skizzeSchritt: step.value
			}, "", address(step.value));
			if (focus) {
				window.scrollTo({ top: 0 });
				(0, vue_exports.nextTick)(() => document.querySelector(".kr-step__title")?.focus({ preventScroll: true }));
			}
		}
		function back() {
			const at = Number(new URL(window.location.href).searchParams.get("schritt"));
			go(Number.isInteger(at) && at >= 1 && at <= 4 ? at - 1 : 1, false);
		}
		(0, vue_exports.onMounted)(() => {
			try {
				const saved = JSON.parse(sessionStorage.getItem(STORAGE) ?? "null");
				if (saved !== null && saved.version === version.id) {
					filter.mode = saved.mode;
					chosenId.value = saved.tyre;
					weights.value = saved.weights;
					rdks.value = saved.rdks;
				}
			} catch {}
			go(step.value, false, false);
			window.history.replaceState({
				...window.history.state,
				skizzeSchritt: step.value
			}, "", address(step.value));
			window.addEventListener("popstate", back);
			(0, vue_exports.watch)([
				chosenId,
				() => filter.mode,
				weights,
				rdks
			], () => {
				try {
					sessionStorage.setItem(STORAGE, JSON.stringify({
						version: version.id,
						tyre: chosenId.value,
						mode: filter.mode,
						weights: weights.value,
						rdks: rdks.value
					}));
				} catch {}
			});
		});
		(0, vue_exports.onBeforeUnmount)(() => window.removeEventListener("popstate", back));
		function chooseDetails() {
			if (details.value) chosenId.value = details.value.id;
		}
		function openDetails(id) {
			detailsId.value = id;
			detailsOpen.value = true;
		}
		(0, vue_exports.watch)(() => [
			filter.mode,
			filter.price,
			filter.sort,
			filter.seasons.length,
			filter.brands.length
		], () => {
			all.value = false;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Skizze: Kompletträder" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<meta head-key="robots" name="robots" content="noindex" data-v-f59e3267${_scopeId}>`);
					else return [(0, vue_exports.createVNode)("meta", {
						"head-key": "robots",
						name: "robots",
						content: "noindex"
					})];
				}),
				_: 1
			}, _parent));
			_push(`<section class="section-dense" data-v-f59e3267><div class="wrap kr" data-v-f59e3267>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(SketchBanner_default, { note: "So soll die Reifenwahl für ein Komplettrad aussehen. Reifen, Bilder, Preise und Label-Werte sind Beispiele; in den Warenkorb kommt nichts." }, null, _parent));
			if ((0, vue_exports.unref)(swapped)) _push(`<p class="kr-swapped" role="status" data-v-f59e3267>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(swapped))}</p>`);
			else _push(`<!---->`);
			_push(`<header class="kr-head" data-v-f59e3267><h1 class="t-h1" data-v-f59e3267>Kompletträder für deinen ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(CAR).name)}</h1>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(SketchSteps_default, {
				steps: STEPS,
				current: step.value,
				reached: reached.value,
				label: "Schritte zum Komplettrad",
				onGo: go
			}, null, _parent));
			_push(`</header>`);
			if (step.value === 0) {
				_push(`<section class="kr-step" aria-labelledby="kr-wheel-h" data-v-f59e3267><h2 id="kr-wheel-h" class="kr-step__title" tabindex="-1" data-v-f59e3267>Deine Felge</h2><div class="kr-wheel" data-v-f59e3267><div class="well kr-wheel__well" data-v-f59e3267>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(ProductPhoto_default, {
					spokes: (0, vue_exports.unref)(WHEEL).spokes,
					finish: (0, vue_exports.unref)(finish)?.art ?? "graphite",
					size: 220,
					note: false
				}, null, _parent));
				_push(`</div><div class="kr-wheel__facts" data-v-f59e3267><p class="kr-wheel__name" translate="no" data-v-f59e3267>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(WHEEL).brand)} ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(WHEEL).model)} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(finish)?.name)}</p><p class="kr-wheel__spec" data-v-f59e3267>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(versionShort)((0, vue_exports.unref)(version)))} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)((0, vue_exports.unref)(version).setCents))} für 4</p><p class="kr-wheel__verdict" data-v-f59e3267>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, { status: "CONDITIONAL" }, null, _parent));
				_push(` für deinen ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(CAR).name)}</p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					class: "kr-link",
					href: `/skizze/felge?fahrzeug=1&ausfuehrung=${(0, vue_exports.unref)(version).id}`
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Andere Ausführung wählen`);
						else return [(0, vue_exports.createTextVNode)("Andere Ausführung wählen")];
					}),
					_: 1
				}, _parent));
				_push(`</div></div><div class="kr-actions" data-v-f59e3267><button class="btn btn--primary" type="button" data-v-f59e3267>Weiter: Reifen `);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "arrow-right",
					size: 20
				}, null, _parent));
				_push(`</button></div></section>`);
			} else if (step.value === 1) {
				_push(`<section class="kr-step" aria-labelledby="kr-tyres-h" data-v-f59e3267><div class="kr-step__head" data-v-f59e3267><h2 id="kr-tyres-h" class="kr-step__title" tabindex="-1" data-v-f59e3267>Reifen wählen</h2><p class="t-small quiet kr-measure" data-v-f59e3267>Nur Reifen, die das Gutachten für deinen ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(CAR).short)} auf ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(versionShort)((0, vue_exports.unref)(version)))} erlaubt. Nötig sind mindestens Lastindex ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(sizes).li)} und Geschwindigkeitssymbol V; jeder Reifen hier erfüllt beides.</p></div><fieldset class="kr-mode" data-v-f59e3267><legend class="label kr-mode__legend" data-v-f59e3267>Bereifung</legend><label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kr-opt--on": filter.mode === "same" }, "kr-opt"])}" data-v-f59e3267><input class="visually-hidden" type="radio" name="kr-mode" value="same"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(filter.mode === "same") ? " checked" : ""} data-v-f59e3267><span class="kr-opt__name" data-v-f59e3267>Vorne und hinten gleich</span><span class="kr-opt__sub" data-v-f59e3267>4 × ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(sizes).front)}</span><span class="kr-opt__check" aria-hidden="true" data-v-f59e3267>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "check",
					size: 20
				}, null, _parent));
				_push(`</span></label><label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kr-opt--on": filter.mode === "mixed" }, "kr-opt"])}" data-v-f59e3267><input class="visually-hidden" type="radio" name="kr-mode" value="mixed"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(filter.mode === "mixed") ? " checked" : ""} data-v-f59e3267><span class="kr-opt__name" data-v-f59e3267>Vorne und hinten verschieden</span><span class="kr-opt__sub" data-v-f59e3267>2 × ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(sizes).front)} vorne · 2 × ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(sizes).rear)} hinten</span><span class="kr-opt__check" aria-hidden="true" data-v-f59e3267>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "check",
					size: 20
				}, null, _parent));
				_push(`</span></label></fieldset><div class="kr-filters" data-v-f59e3267><div class="kr-filter" role="group" aria-label="Saison" data-v-f59e3267><span class="kr-filter__label" data-v-f59e3267>Saison</span><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(SEASONS), (season) => {
					_push(`<button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", filter.seasons.includes(season.value))} data-v-f59e3267>${(0, server_renderer_exports.ssrInterpolate)(season.label)}</button>`);
				});
				_push(`<!--]--></div><div class="kr-filter" role="group" aria-label="Marke" data-v-f59e3267><span class="kr-filter__label" data-v-f59e3267>Marke</span><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(TYRE_BRANDS), (brand) => {
					_push(`<button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", filter.brands.includes(brand))} data-v-f59e3267>${(0, server_renderer_exports.ssrInterpolate)(brand)}</button>`);
				});
				_push(`<!--]--></div><div class="kr-filter" role="group" aria-label="Preis für 4 Reifen" data-v-f59e3267><span class="kr-filter__label" data-v-f59e3267>Preis für 4</span><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(PRICE_BANDS), (band) => {
					_push(`<button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", filter.price === band.value)} data-v-f59e3267>${(0, server_renderer_exports.ssrInterpolate)(band.label)}</button>`);
				});
				_push(`<!--]--></div></div><div class="kr-listhead" data-v-f59e3267><p class="kr-count" role="status" data-v-f59e3267>${(0, server_renderer_exports.ssrInterpolate)(list.value.length === 1 ? "1 Reifen passt" : `${list.value.length} Reifen passen`)}</p><label class="kr-sort" data-v-f59e3267><span class="kr-sort__label" data-v-f59e3267>Sortieren</span><select class="input kr-sort__select" data-v-f59e3267><option value="preis-auf" data-v-f59e3267${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(filter.sort) ? (0, server_renderer_exports.ssrLooseContain)(filter.sort, "preis-auf") : (0, server_renderer_exports.ssrLooseEqual)(filter.sort, "preis-auf")) ? " selected" : ""}>Preis aufsteigend</option><option value="preis-ab" data-v-f59e3267${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(filter.sort) ? (0, server_renderer_exports.ssrLooseContain)(filter.sort, "preis-ab") : (0, server_renderer_exports.ssrLooseEqual)(filter.sort, "preis-ab")) ? " selected" : ""}>Preis absteigend</option><option value="marke" data-v-f59e3267${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(filter.sort) ? (0, server_renderer_exports.ssrLooseContain)(filter.sort, "marke") : (0, server_renderer_exports.ssrLooseEqual)(filter.sort, "marke")) ? " selected" : ""}>Marke A–Z</option></select></label></div><div class="kr-grid" role="radiogroup" aria-label="Reifen" data-v-f59e3267><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(shown.value, (tyre) => {
					_push((0, server_renderer_exports.ssrRenderComponent)(TyreCard_default, {
						key: tyre.id,
						tyre,
						mode: filter.mode,
						chosen: tyre.id === chosenId.value,
						onChoose: ($event) => chosenId.value = tyre.id,
						onDetails: ($event) => openDetails(tyre.id)
					}, null, _parent));
				});
				_push(`<!--]--></div>`);
				if (list.value.length === 0) _push(`<p class="kr-empty" data-v-f59e3267>Kein Reifen passt zu dieser Auswahl. Nimm einen Filter heraus.</p>`);
				else _push(`<!---->`);
				if (!all.value && list.value.length > FIRST) _push(`<button class="btn btn--secondary kr-more" type="button" data-v-f59e3267>${(0, server_renderer_exports.ssrInterpolate)(list.value.length - FIRST === 1 ? "1 weiteren Reifen anzeigen" : `${list.value.length - FIRST} weitere Reifen anzeigen`)}</button>`);
				else _push(`<!---->`);
				_push(`<aside class="kr-needs" aria-labelledby="kr-needs-h" data-v-f59e3267><h3 id="kr-needs-h" class="kr-needs__title" data-v-f59e3267>Was wir dafür von euch brauchen</h3><ul data-v-f59e3267><li data-v-f59e3267>Fotos je Reifenmodell, bis zu vier (Seite, Lauffläche, Profil, schräg). Bis dahin zeigt der Shop eine neutrale Zeichnung, nie das Foto eines anderen Reifens.</li><li data-v-f59e3267>Die Daten des EU-Reifenlabels je Größe: Kraftstoffeffizienz, Nasshaftung, Rollgeräusch, Schnee- und Eisgriffigkeit, EPREL-Nummer.</li><li data-v-f59e3267>Die Antwort auf die Lieferantenfrage: Kann derselbe Reifen von mehreren Lieferanten mit verschiedenen Preisen kommen, und welcher Preis gilt dann im Shop?</li></ul></aside><div class="kr-actions" data-v-f59e3267><button class="btn btn--secondary kr-actions__left" type="button" data-v-f59e3267>Zurück</button><span class="kr-pick t-small" role="status" data-v-f59e3267>${(0, server_renderer_exports.ssrInterpolate)(chosen.value ? `Gewählt: ${chosen.value.brand} ${chosen.value.model} · ${(0, vue_exports.unref)(formatMoney)((0, vue_exports.unref)(setPrice)(chosen.value, filter.mode))}` : "Wähl zuerst einen Reifen.")}</span><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!chosen.value) ? " disabled" : ""} data-v-f59e3267>Weiter: Extras `);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "arrow-right",
					size: 20
				}, null, _parent));
				_push(`</button></div>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(TyreDetails_default, {
					open: detailsOpen.value,
					"onUpdate:open": ($event) => detailsOpen.value = $event,
					tyre: details.value,
					mode: filter.mode,
					chosen: details.value?.id === chosenId.value,
					onChoose: chooseDetails
				}, null, _parent));
				_push(`</section>`);
			} else if (step.value === 2) {
				_push(`<section class="kr-step" aria-labelledby="kr-extras-h" data-v-f59e3267><h2 id="kr-extras-h" class="kr-step__title" tabindex="-1" data-v-f59e3267>Extras</h2><p class="t-small quiet kr-measure" data-v-f59e3267>Montage und Wuchten gehören zum Komplettrad: ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)((0, vue_exports.unref)(MOUNTING_SET_CENTS)))} für 4 Räder (4 × ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)((0, vue_exports.unref)(MOUNTING_EACH_CENTS)))}). Kein Extra mit Aufpreis ist vorausgewählt.</p><fieldset class="kr-group" data-v-f59e3267><legend class="label" data-v-f59e3267>Wuchtgewichte</legend><p class="t-small quiet" data-v-f59e3267>Die Gewichte sitzen innen an der Felge. Such dir die Farbe aus, die dir besser gefällt.</p><div class="kr-swatches" data-v-f59e3267><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(WEIGHTS), (colour) => {
					_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kr-swatch--on": weights.value === colour.id }, "kr-swatch"])}" data-v-f59e3267><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(weights.value, colour.id)) ? " checked" : ""} class="visually-hidden" type="radio" name="kr-weights"${(0, server_renderer_exports.ssrRenderAttr)("value", colour.id)} data-v-f59e3267><span class="kr-swatch__dot" data-qa-ignore style="${(0, server_renderer_exports.ssrRenderStyle)({ "--swatch": colour.hex })}" aria-hidden="true" data-v-f59e3267></span><span class="kr-swatch__name" data-v-f59e3267>${(0, server_renderer_exports.ssrInterpolate)(colour.name)}</span><span class="kr-swatch__price" data-v-f59e3267>${(0, server_renderer_exports.ssrInterpolate)(colour.eachCents === 0 ? "ohne Aufpreis" : `+ ${(0, vue_exports.unref)(formatMoney)(colour.eachCents)} pro Rad`)}</span></label>`);
				});
				_push(`<!--]--></div></fieldset><fieldset class="kr-group" data-v-f59e3267><legend class="label" data-v-f59e3267>RDKS-Sensoren</legend><p class="t-small quiet" data-v-f59e3267>Misst dein Auto den Reifendruck mit Sensoren in den Rädern, brauchen auch die neuen Räder Sensoren. Ob das so ist, steht in der Betriebsanleitung.</p><div class="kr-opts" data-v-f59e3267><label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kr-opt--on": rdks.value === "ja" }, "kr-opt"])}" data-v-f59e3267><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(rdks.value, "ja")) ? " checked" : ""} class="visually-hidden" type="radio" name="kr-rdks" value="ja" data-v-f59e3267><span class="kr-opt__name" data-v-f59e3267>Mit RDKS-Sensoren</span><span class="kr-opt__sub" data-v-f59e3267>+ ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)((0, vue_exports.unref)(RDKS).setCents))} (4 × ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)((0, vue_exports.unref)(RDKS).eachCents))}) · wir setzen sie gleich mit ein</span><span class="kr-opt__check" aria-hidden="true" data-v-f59e3267>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "check",
					size: 20
				}, null, _parent));
				_push(`</span></label><label class="${(0, server_renderer_exports.ssrRenderClass)([{ "kr-opt--on": rdks.value === "nein" }, "kr-opt"])}" data-v-f59e3267><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(rdks.value, "nein")) ? " checked" : ""} class="visually-hidden" type="radio" name="kr-rdks" value="nein" data-v-f59e3267><span class="kr-opt__name" data-v-f59e3267>Ohne RDKS-Sensoren</span><span class="kr-opt__sub" data-v-f59e3267>ohne Aufpreis</span><span class="kr-opt__check" aria-hidden="true" data-v-f59e3267>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "check",
					size: 20
				}, null, _parent));
				_push(`</span></label></div>`);
				if (rdks.value === null) _push(`<p class="t-small quiet" data-v-f59e3267>Noch nicht beantwortet: Dann fragen wir an der Kasse danach.</p>`);
				else _push(`<!---->`);
				_push(`</fieldset><div class="kr-actions" data-v-f59e3267><button class="btn btn--secondary kr-actions__left" type="button" data-v-f59e3267>Zurück</button><button class="btn btn--primary" type="button" data-v-f59e3267>Weiter: Warenkorb `);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "arrow-right",
					size: 20
				}, null, _parent));
				_push(`</button></div></section>`);
			} else {
				_push(`<section class="kr-step" aria-labelledby="kr-basket-h" data-v-f59e3267><h2 id="kr-basket-h" class="kr-step__title" tabindex="-1" data-v-f59e3267>Dein Komplettrad</h2>`);
				if (chosen.value) {
					_push(`<!--[--><div class="kr-verdict" data-v-f59e3267><p class="kr-verdict__line" data-v-f59e3267>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, { status: "CONDITIONAL" }, null, _parent));
					_push(` für deinen ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(CAR).name)}</p><p class="t-small kr-verdict__text" data-v-f59e3267>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(ABNAHME_REQUIRED))} ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(ENTRY_REQUIRED))}</p></div><table class="kr-basket" data-v-f59e3267><caption class="visually-hidden" data-v-f59e3267>Was in den Warenkorb kommt</caption><tbody data-v-f59e3267><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(lines.value, (line) => {
						_push(`<tr data-v-f59e3267><th scope="row" data-v-f59e3267><span class="kr-basket__cell" data-v-f59e3267><span class="kr-basket__label" data-v-f59e3267>${(0, server_renderer_exports.ssrInterpolate)(line.label)}</span><span class="t-small quiet" data-v-f59e3267>${(0, server_renderer_exports.ssrInterpolate)(line.detail)}</span></span></th><td data-v-f59e3267>${(0, server_renderer_exports.ssrInterpolate)(line.cents === 0 ? "ohne Aufpreis" : (0, vue_exports.unref)(formatMoney)(line.cents))}</td></tr>`);
					});
					_push(`<!--]--></tbody><tfoot data-v-f59e3267><tr data-v-f59e3267><th scope="row" data-v-f59e3267>Summe</th><td data-v-f59e3267>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)((0, vue_exports.unref)(total)(lines.value)))}</td></tr></tfoot></table><p class="t-small quiet" data-v-f59e3267>inkl. MwSt., zzgl. Versandkosten`);
					if (rdks.value === null) _push(`<!--[--> · RDKS-Sensoren: fragen wir an der Kasse<!--]-->`);
					else _push(`<!---->`);
					_push(`</p><div class="kr-actions" data-v-f59e3267><button class="btn btn--secondary kr-actions__left" type="button" data-v-f59e3267>Zurück</button><button class="btn btn--primary" type="button" data-v-f59e3267>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "cart",
						size: 20
					}, null, _parent));
					_push(` In den Warenkorb</button></div>`);
					if (added.value) _push(`<p class="t-small kr-added" role="status" data-v-f59e3267>In der Skizze kommt nichts in den Warenkorb.</p>`);
					else _push(`<!---->`);
					_push(`<!--]-->`);
				} else _push(`<p class="kr-empty" data-v-f59e3267>Noch kein Reifen gewählt. <button class="kr-link" type="button" data-v-f59e3267>Reifen wählen</button></p>`);
				_push(`</section>`);
			}
			_push(`</div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Skizze/Komplettraeder.vue
var _sfc_setup = Komplettraeder_vue_vue_type_script_setup_true_lang_default.setup;
Komplettraeder_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Skizze/Komplettraeder.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Komplettraeder_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Komplettraeder_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f59e3267"]]);
//#endregion
export { Komplettraeder_default as default };
