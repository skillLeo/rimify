import { t as Dialog_default } from "./Dialog-BPdFERzS.js";
import { n as Accordion_default, t as SpecCallout_default } from "./SpecCallout-BswbZJuO.js";
import { t as Kbd_default } from "./Kbd-BLfKuRhr.js";
import { t as AppLayout_default } from "./AppLayout-Cpv58bz_.js";
import { i as TabsRoot_default, n as TabsList_default, r as TabsContent_default, t as TabsTrigger_default } from "./TabsTrigger-DxXaR9DR.js";
import { i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { n as ICON_NAMES, t as Icon_default } from "./Icon-eiBrxJ_i.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as formatMoney } from "./num-Br8qlecZ.js";
import { s as withUnit } from "./format-6R0uUMt3.js";
import { t as Picture_default } from "./Picture-Fl6hr1l0.js";
import { t as TyreLabel_default } from "./TyreLabel-Da4LgdfR.js";
import { t as VerdictBadge_default } from "./VerdictBadge-Bpw_FqPS.js";
import { t as ProductTile_default } from "./ProductTile-D6chpLD0.js";
import { t as Skeleton_default } from "./Skeleton-h8OaRjBz.js";
//#region resources/js/Components/Ui/ProductTileSkeleton.vue?vue&type=script&setup=true&lang.ts
var ProductTileSkeleton_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ProductTileSkeleton",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The tile while its data loads: the same lines, at the same heights, in the same grid, and the
		* CTA's block where the CTA will be — so the row does not move when the cards arrive.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "tile tile--skeleton",
				"aria-hidden": "true"
			}, _attrs))} data-v-837136ff>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
				tile: "",
				height: "auto",
				class: "tile__media"
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
				width: "38%",
				height: "var(--lh-small)"
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
				width: "72%",
				height: "var(--lh-body)"
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
				width: "48%",
				height: "var(--lh-small)"
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
				width: "56%",
				height: "var(--lh-small)"
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
				width: "60%",
				height: "var(--lh-body)",
				class: "tile__skeleton-price"
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
				width: "66%",
				height: "var(--lh-micro)"
			}, null, _parent));
			_push(`<div class="tile__actions" data-v-837136ff><span class="skeleton tile__skeleton-cta" data-v-837136ff></span></div></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/ProductTileSkeleton.vue
var _sfc_setup$1 = ProductTileSkeleton_vue_vue_type_script_setup_true_lang_default.setup;
ProductTileSkeleton_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/ProductTileSkeleton.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var ProductTileSkeleton_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ProductTileSkeleton_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-837136ff"]]);
var hero_default = {
	name: "hero",
	base: "/images/hero/hero",
	width: 1920,
	height: 1440,
	widths: [
		480,
		768,
		1080,
		1440,
		1920
	],
	placeholder: "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAASABgDASIAAhEBAxEB/8QAGAABAQEBAQAAAAAAAAAAAAAAAAUEAQb/xAAjEAACAgEDBAMBAAAAAAAAAAABAgADEQQSIQUiMVETFXFh/8QAFgEBAQEAAAAAAAAAAAAAAAAAAQAC/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAEh/9oADAMBAAIRAxEAPwDydHV9fprGvo1NiMw2lg2SR65j7XqJv+Y628WDPdu8THuQkcBRkZAmi9lZUSsFSi87mBBP89RjNUdH1i+vVC7di8+WGe79iRFYljiIaVDXV1qeEUfgkwk8jPERKKuRESL/2Q==",
	source: "pexels-32726107.jpg"
};
//#endregion
//#region resources/js/Pages/Design/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	__name: "Index",
	__ssrInlineRender: true,
	props: { cards: {} },
	setup(__props) {
		/**
		* The design specimen: every token and every component in every state, on one page, so that a
		* component is reviewed once here before any page is built on it. Local and test only.
		*/
		const dialogOpen = (0, vue_exports.ref)(false);
		const drawerOpen = (0, vue_exports.ref)(false);
		const sheetOpen = (0, vue_exports.ref)(false);
		const frameReady = (0, vue_exports.ref)(false);
		const busy = (0, vue_exports.ref)(false);
		const COLOURS = [
			["c-ink", "Text"],
			["c-ink-2", "Text, sekundär"],
			["c-ink-3", "Text, tertiär"],
			["c-line", "Trennlinie"],
			["c-line-2", "Rahmen, stark"],
			["c-surface", "Fläche"],
			["c-band", "Band"],
			["c-dark", "Dunkles Band"],
			["c-dark-2", "Dunkel, sekundär"],
			["c-on-dark-2", "Text auf dunkel"],
			["c-blue", "Aktion"],
			["c-blue-hover", "Aktion, hover"],
			["c-blue-press", "Aktion, gedrückt"],
			["c-blue-tint", "Aktion, Fläche"],
			["c-ok", "Freigegeben"],
			["c-ok-tint", "Freigegeben, Fläche"],
			["c-warn", "Mit Auflagen"],
			["c-warn-tint", "Mit Auflagen, Fläche"],
			["c-bad", "Nicht freigegeben"],
			["c-bad-tint", "Nicht freigegeben, Fläche"],
			["c-unk", "Noch nicht bestätigt"],
			["c-unk-tint", "Noch nicht bestätigt, Fläche"],
			["c-star", "Bewertung"]
		];
		const TYPE = [
			["display", "Display · 64/68 · 700 · 112 %"],
			["h1", "H1 · 48/54 · 700 · 110 %"],
			["h2", "H2 · 36/42 · 700 · 110 %"],
			["h3", "H3 · 24/30 · 600"],
			["h4", "H4 · 20/28 · 600"],
			["body-l", "Body L · 18/28"],
			["body", "Body · 16/24"],
			["small", "Small · 14/20"],
			["micro", "Micro · 12/16"]
		];
		const SPACE = [
			4,
			8,
			12,
			16,
			20,
			24,
			32,
			40,
			48,
			64,
			80,
			96,
			128
		];
		const VERDICTS = [
			"PERMITTED",
			"CONDITIONAL",
			"NOT_PERMITTED",
			"UNKNOWN"
		];
		const FAQ = [
			{
				id: 1,
				title: "Woher weiß RIMIFY, welche Felge an mein Auto darf?",
				body: "Aus dem Gutachten. Jede Felge hat ein Gutachten oder eine ABE, in der die freigegebenen Fahrzeuge mit Typ und Genehmigungsnummer stehen. Wir lesen genau diese Liste und zeigen dir nur Felgen, in deren Liste dein Fahrzeug steht."
			},
			{
				id: 2,
				title: "Was bedeutet „Mit Auflagen“?",
				body: "Die Felge ist freigegeben, aber das Gutachten nennt Bedingungen – zum Beispiel bestimmte Reifengrößen, Radschrauben oder eine Eintragung in die Fahrzeugpapiere. Wir schreiben dir jede Auflage als Satz dazu."
			},
			{
				id: 3,
				title: "Wo finde ich HSN und TSN?",
				body: "In der Zulassungsbescheinigung Teil I: die HSN in Feld 2.1, die TSN in den ersten drei Zeichen von Feld 2.2."
			}
		];
		const vehicle = {
			id: 1,
			make: "BMW",
			model: "3er",
			variant: "3er Coupé (E46) 320Ci",
			label: "BMW 3er Coupé (E46) 320Ci",
			short: "BMW 3er",
			hsn: "0005",
			tsn: "582",
			keyNumbers: "0005/582",
			buildWindow: "1999–2006"
		};
		const conditionalCard = (card) => ({
			...card,
			fitment: {
				status: "CONDITIONAL",
				requiresEntry: true,
				conditions: ["Nur mit den angegebenen Radschrauben zulässig.", "Eintragung in die Fahrzeugpapiere erforderlich."]
			}
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Design" }, null, _parent));
			_push(`<div class="container specimen" data-v-2d8f4931><header class="specimen__head" data-v-2d8f4931><h1 class="h1" data-v-2d8f4931>Design-System</h1><p class="body-l muted prose" data-v-2d8f4931>Jeder Token und jede Komponente in jedem Zustand. Was hier freigegeben ist, wird auf den Seiten verbaut – nichts anderes.</p></header><section class="specimen__section" aria-labelledby="s-colour" data-v-2d8f4931><h2 id="s-colour" class="h2" data-v-2d8f4931>Farbe</h2><ul class="swatches" data-v-2d8f4931><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(COLOURS, ([token, role]) => {
				_push(`<li class="swatch" data-v-2d8f4931><span class="swatch__chip" style="${(0, server_renderer_exports.ssrRenderStyle)({ background: `var(--${token})` })}" data-v-2d8f4931></span><span class="small" data-v-2d8f4931>${(0, server_renderer_exports.ssrInterpolate)(role)}</span><span class="micro quiet num" data-v-2d8f4931>--${(0, server_renderer_exports.ssrInterpolate)(token)}</span></li>`);
			});
			_push(`<!--]--></ul></section><section class="specimen__section" aria-labelledby="s-type" data-v-2d8f4931><h2 id="s-type" class="h2" data-v-2d8f4931>Schrift</h2><dl class="type-scale" data-v-2d8f4931><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(TYPE, ([cls, note]) => {
				_push(`<!--[--><dt class="small quiet num" data-v-2d8f4931>${(0, server_renderer_exports.ssrInterpolate)(note)}</dt><dd class="${(0, server_renderer_exports.ssrRenderClass)(cls)}" data-v-2d8f4931>Felgen, die an dein Auto dürfen.</dd><!--]-->`);
			});
			_push(`<!--]--></dl><p class="body prose" style="${(0, server_renderer_exports.ssrRenderStyle)({ "margin-top": "var(--sp-24)" })}" data-v-2d8f4931> Die Kraftfahrzeug-Zulassungsbescheinigung Teil I nennt in Feld 2.1 die Herstellerschlüsselnummer und in Feld 2.2 die Typschlüsselnummer. Ein Reifendruckkontrollsystem ist seit November 2014 für neu zugelassene Pkw Pflicht. Preise wie <span class="num" data-v-2d8f4931>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(123400))}</span>, Maße wie <span class="num" data-v-2d8f4931>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)("72,6", "mm"))}</span> und Größen wie <span class="num" data-v-2d8f4931>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)("8,5", "J"))} × 19 · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)("ET", "35"))} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)("LK", "5 × 120"))}</span> laufen in Tabellenziffern. </p></section><section class="specimen__section" aria-labelledby="s-space" data-v-2d8f4931><h2 id="s-space" class="h2" data-v-2d8f4931>Abstand, Radius, Ebenen</h2><div class="spaces" data-v-2d8f4931><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(SPACE, (n) => {
				_push(`<div class="space" data-v-2d8f4931><span class="space__bar" style="${(0, server_renderer_exports.ssrRenderStyle)({ width: `var(--sp-${n})` })}" data-v-2d8f4931></span><span class="micro quiet num" data-v-2d8f4931>${(0, server_renderer_exports.ssrInterpolate)(n)}</span></div>`);
			});
			_push(`<!--]--></div><div class="samples" style="${(0, server_renderer_exports.ssrRenderStyle)({ "margin-top": "var(--sp-32)" })}" data-v-2d8f4931><div class="sample sample--control" data-v-2d8f4931><span class="small" data-v-2d8f4931>4 px · Controls</span></div><div class="sample sample--tile" data-v-2d8f4931><span class="small" data-v-2d8f4931>8 px · Kacheln, Dialoge</span></div><div class="sample sample--e1" data-v-2d8f4931><span class="small" data-v-2d8f4931>--e-1 · Header</span></div><div class="sample sample--e2" data-v-2d8f4931><span class="small" data-v-2d8f4931>--e-2 · Menüs, Popover</span></div><div class="sample sample--e3" data-v-2d8f4931><span class="small" data-v-2d8f4931>--e-3 · Dialoge</span></div></div></section><section class="specimen__section" aria-labelledby="s-icons" data-v-2d8f4931><h2 id="s-icons" class="h2" data-v-2d8f4931>Icons</h2><ul class="icons" data-v-2d8f4931><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(ICON_NAMES), (name) => {
				_push(`<li class="icons__item" data-v-2d8f4931>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name,
					size: 24
				}, null, _parent));
				_push(`<span class="micro quiet" data-v-2d8f4931>${(0, server_renderer_exports.ssrInterpolate)(name)}</span></li>`);
			});
			_push(`<!--]--></ul></section><section class="specimen__section" aria-labelledby="s-buttons" data-v-2d8f4931><h2 id="s-buttons" class="h2" data-v-2d8f4931>Buttons</h2><div class="row" data-v-2d8f4931><button class="btn btn--primary" type="button" data-v-2d8f4931>147 passende Felgen anzeigen</button><button class="btn btn--secondary" type="button" data-v-2d8f4931>Fahrzeug ändern</button><button class="btn btn--ghost" type="button" data-v-2d8f4931>Entfernen</button><button class="btn btn--primary" type="button" disabled data-v-2d8f4931>Fahrzeug wählen</button><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-2d8f4931>Wird geprüft</button></div><div class="row" data-v-2d8f4931><button class="btn btn--primary btn--sm" type="button" data-v-2d8f4931>Klein</button><button class="btn btn--secondary btn--sm" type="button" data-v-2d8f4931>Klein</button><button class="btn btn--primary btn--lg" type="button" data-v-2d8f4931>Groß – In den Warenkorb</button><button class="icon-btn" type="button" aria-label="Suchen" data-v-2d8f4931>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "search",
				size: 24
			}, null, _parent));
			_push(`</button><button class="link" type="button" data-v-2d8f4931>Wo finde ich HSN und TSN?</button></div><div class="row dark specimen__dark" data-v-2d8f4931><button class="btn btn--light" type="button" data-v-2d8f4931>Kompletträder für mein Fahrzeug</button><button class="btn btn--outline-light" type="button" data-v-2d8f4931>Was ein Komplettrad ist</button></div></section><section class="specimen__section" aria-labelledby="s-fields" data-v-2d8f4931><h2 id="s-fields" class="h2" data-v-2d8f4931>Felder</h2><div class="fields" data-v-2d8f4931><div class="form-field" data-v-2d8f4931><label class="form-field__label" for="sp-text" data-v-2d8f4931>Marke</label><input id="sp-text" class="input" type="text" placeholder="z. B. BMW" data-v-2d8f4931><span class="form-field__help" data-v-2d8f4931>Wie in der Zulassungsbescheinigung.</span><span class="form-field__error" data-v-2d8f4931></span></div><div class="form-field" data-v-2d8f4931><label class="form-field__label" for="sp-hsn" data-v-2d8f4931>HSN</label><input id="sp-hsn" class="input input--code" type="text" inputmode="numeric" maxlength="4" value="0005" data-v-2d8f4931><span class="form-field__help" data-v-2d8f4931>Feld 2.1</span><span class="form-field__error" data-v-2d8f4931></span></div><div class="form-field" data-v-2d8f4931><label class="form-field__label" for="sp-err" data-v-2d8f4931>TSN</label><input id="sp-err" class="input input--code" type="text" value="5" aria-invalid="true" aria-describedby="sp-err-msg" data-v-2d8f4931><span class="form-field__help" data-v-2d8f4931>Feld 2.2, die ersten drei Zeichen</span><span id="sp-err-msg" class="form-field__error" data-v-2d8f4931>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "warning",
				size: 16
			}, null, _parent));
			_push(` Die TSN hat drei Zeichen.</span></div><div class="form-field" data-v-2d8f4931><label class="form-field__label" for="sp-select" data-v-2d8f4931>Modell</label><select id="sp-select" class="input" data-v-2d8f4931><option data-v-2d8f4931>3er Coupé (E46)</option><option data-v-2d8f4931>3er Limousine (E46)</option><option data-v-2d8f4931>3er Touring (E46)</option></select><span class="form-field__help" data-v-2d8f4931></span><span class="form-field__error" data-v-2d8f4931></span></div><div class="form-field" data-v-2d8f4931><label class="form-field__label" for="sp-dis" data-v-2d8f4931>Fahrzeug</label><input id="sp-dis" class="input" type="text" disabled placeholder="Erst Modell wählen" data-v-2d8f4931><span class="form-field__help" data-v-2d8f4931></span><span class="form-field__error" data-v-2d8f4931></span></div><div class="form-field" data-v-2d8f4931><label class="form-field__label" for="sp-search" data-v-2d8f4931>Suche</label><div class="input-group" data-v-2d8f4931><span class="input-group__icon" data-v-2d8f4931>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "search",
				size: 20
			}, null, _parent));
			_push(`</span><input id="sp-search" class="input" type="search" placeholder="Felge, Marke oder Größe" data-v-2d8f4931></div><span class="form-field__help" data-v-2d8f4931></span><span class="form-field__error" data-v-2d8f4931></span></div></div><div class="row" style="${(0, server_renderer_exports.ssrRenderStyle)({ "margin-top": "var(--sp-16)" })}" data-v-2d8f4931><label class="check" data-v-2d8f4931><input type="checkbox" checked data-v-2d8f4931> Ohne Eintragung</label><label class="check" data-v-2d8f4931><input type="radio" name="sp-r" checked data-v-2d8f4931> Felgen</label><label class="check" data-v-2d8f4931><input type="radio" name="sp-r" data-v-2d8f4931> Kompletträder</label></div></section><section class="specimen__section" aria-labelledby="s-chips" data-v-2d8f4931><h2 id="s-chips" class="h2" data-v-2d8f4931>Chips, Badges, Freigaben</h2><div class="chip-row" data-v-2d8f4931><button class="chip" type="button" data-v-2d8f4931>17 Zoll</button><button class="chip chip--on" type="button" aria-pressed="true" data-v-2d8f4931>18 Zoll</button><button class="chip chip--struck" type="button" aria-disabled="true" data-v-2d8f4931>20 Zoll</button><button class="chip" type="button" data-v-2d8f4931>BMW 3er Coupé `);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "close",
				size: 16
			}, null, _parent));
			_push(`</button></div><div class="row" style="${(0, server_renderer_exports.ssrRenderStyle)({ "margin-top": "var(--sp-16)" })}" data-v-2d8f4931><span class="badge" data-v-2d8f4931>Neu</span><span class="badge badge--count" data-v-2d8f4931>3</span><span class="stock stock--in" data-v-2d8f4931>Auf Lager</span><span class="stock stock--low" data-v-2d8f4931>Nur noch 4</span><span class="stock stock--out" data-v-2d8f4931>Ausverkauft</span>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, {
				keys: ["K"],
				modifier: ""
			}, null, _parent));
			_push(` `);
			_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["/"] }, null, _parent));
			_push(`</div><div class="row" style="${(0, server_renderer_exports.ssrRenderStyle)({ "margin-top": "var(--sp-16)" })}" data-v-2d8f4931><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(VERDICTS, (status) => {
				_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, {
					key: status,
					status
				}, null, _parent));
			});
			_push(`<!--]--></div><div class="row" style="${(0, server_renderer_exports.ssrRenderStyle)({ "margin-top": "var(--sp-8)" })}" data-v-2d8f4931><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(VERDICTS, (status) => {
				_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, {
					key: status,
					status,
					size: "lg"
				}, null, _parent));
			});
			_push(`<!--]--></div></section><section class="specimen__section" aria-labelledby="s-tiles" data-v-2d8f4931><h2 id="s-tiles" class="h2" data-v-2d8f4931>Produktkachel</h2><div class="tile-grid" data-v-2d8f4931><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.cards.slice(0, 2), (card, i) => {
				_push((0, server_renderer_exports.ssrRenderComponent)(ProductTile_default, {
					key: card.finishId,
					card,
					eager: i === 0,
					compare: ""
				}, null, _parent));
			});
			_push(`<!--]-->`);
			if (__props.cards[2]) _push((0, server_renderer_exports.ssrRenderComponent)(ProductTile_default, {
				card: {
					...__props.cards[2],
					fitment: {
						status: "PERMITTED",
						requiresEntry: false,
						conditions: []
					}
				},
				vehicle,
				compare: ""
			}, null, _parent));
			else _push(`<!---->`);
			if (__props.cards[3]) _push((0, server_renderer_exports.ssrRenderComponent)(ProductTile_default, {
				card: conditionalCard(__props.cards[3]),
				vehicle,
				compare: ""
			}, null, _parent));
			else _push(`<!---->`);
			_push(`</div><div class="tile-grid" style="${(0, server_renderer_exports.ssrRenderStyle)({ "margin-top": "var(--sp-32)" })}" role="group" aria-label="Ladezustand" data-v-2d8f4931><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(4, (n) => {
				_push((0, server_renderer_exports.ssrRenderComponent)(ProductTileSkeleton_default, { key: n }, null, _parent));
			});
			_push(`<!--]--></div></section><section class="specimen__section" aria-labelledby="s-callout" data-v-2d8f4931><h2 id="s-callout" class="h2" data-v-2d8f4931>Maßangabe im Foto</h2><div class="${(0, server_renderer_exports.ssrRenderClass)([{ "is-ready": frameReady.value }, "frame specimen__frame"])}" data-v-2d8f4931>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
				image: (0, vue_exports.unref)(hero_default),
				alt: "Ein schwarzer Sportwagen mit blauer Leichtmetallfelge, von vorn und tief aufgenommen",
				sizes: "(min-width: 1024px) 880px, 100vw",
				class: "specimen__photo",
				onLoaded: ($event) => frameReady.value = true
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(SpecCallout_default, {
				label: "Breite × Durchmesser",
				value: "8,5 J × 19",
				x: 8,
				y: 14,
				tx: 46,
				ty: 52
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(SpecCallout_default, {
				label: "Einpresstiefe",
				value: "ET 35",
				x: 70,
				y: 20,
				tx: 58,
				ty: 46
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(SpecCallout_default, {
				label: "Lochkreis",
				value: "LK 5 × 120",
				x: 66,
				y: 72,
				tx: 55,
				ty: 60
			}, null, _parent));
			_push(`</div><button class="btn btn--secondary btn--sm" type="button" style="${(0, server_renderer_exports.ssrRenderStyle)({ "margin-top": "var(--sp-16)" })}" data-v-2d8f4931>${(0, server_renderer_exports.ssrInterpolate)(frameReady.value ? "Linien zurücksetzen" : "Linien einzeichnen")}</button></section><section class="specimen__section" aria-labelledby="s-tabs" data-v-2d8f4931><h2 id="s-tabs" class="h2" data-v-2d8f4931>Tabs und Akkordeon</h2>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsRoot_default), {
				"default-value": "beliebt",
				class: "tabs"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsList_default), {
							class: "tabs__list",
							"aria-label": "Auswahl"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsTrigger_default), {
										value: "beliebt",
										class: "tabs__trigger"
									}, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) _push(`Beliebt`);
											else return [(0, vue_exports.createTextVNode)("Beliebt")];
										}),
										_: 1
									}, _parent, _scopeId));
									_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsTrigger_default), {
										value: "neu",
										class: "tabs__trigger"
									}, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) _push(`Neu`);
											else return [(0, vue_exports.createTextVNode)("Neu")];
										}),
										_: 1
									}, _parent, _scopeId));
									_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsTrigger_default), {
										value: "preis",
										class: "tabs__trigger"
									}, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) _push(`Bis 200 €`);
											else return [(0, vue_exports.createTextVNode)("Bis 200 €")];
										}),
										_: 1
									}, _parent, _scopeId));
								} else return [
									(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsTrigger_default), {
										value: "beliebt",
										class: "tabs__trigger"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Beliebt")]),
										_: 1
									}),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsTrigger_default), {
										value: "neu",
										class: "tabs__trigger"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Neu")]),
										_: 1
									}),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsTrigger_default), {
										value: "preis",
										class: "tabs__trigger"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Bis 200 €")]),
										_: 1
									})
								];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsContent_default), {
							value: "beliebt",
							class: "tabs__content"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<p class="muted" data-v-2d8f4931${_scopeId}>Die meistgekauften Felgen der letzten 30 Tage.</p>`);
								else return [(0, vue_exports.createVNode)("p", { class: "muted" }, "Die meistgekauften Felgen der letzten 30 Tage.")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsContent_default), {
							value: "neu",
							class: "tabs__content"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<p class="muted" data-v-2d8f4931${_scopeId}>Neu im Sortiment.</p>`);
								else return [(0, vue_exports.createVNode)("p", { class: "muted" }, "Neu im Sortiment.")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsContent_default), {
							value: "preis",
							class: "tabs__content"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<p class="muted" data-v-2d8f4931${_scopeId}>Alles unter 200 € pro Felge.</p>`);
								else return [(0, vue_exports.createVNode)("p", { class: "muted" }, "Alles unter 200 € pro Felge.")];
							}),
							_: 1
						}, _parent, _scopeId));
					} else return [
						(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsList_default), {
							class: "tabs__list",
							"aria-label": "Auswahl"
						}, {
							default: (0, vue_exports.withCtx)(() => [
								(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsTrigger_default), {
									value: "beliebt",
									class: "tabs__trigger"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Beliebt")]),
									_: 1
								}),
								(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsTrigger_default), {
									value: "neu",
									class: "tabs__trigger"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Neu")]),
									_: 1
								}),
								(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsTrigger_default), {
									value: "preis",
									class: "tabs__trigger"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Bis 200 €")]),
									_: 1
								})
							]),
							_: 1
						}),
						(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsContent_default), {
							value: "beliebt",
							class: "tabs__content"
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("p", { class: "muted" }, "Die meistgekauften Felgen der letzten 30 Tage.")]),
							_: 1
						}),
						(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsContent_default), {
							value: "neu",
							class: "tabs__content"
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("p", { class: "muted" }, "Neu im Sortiment.")]),
							_: 1
						}),
						(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsContent_default), {
							value: "preis",
							class: "tabs__content"
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("p", { class: "muted" }, "Alles unter 200 € pro Felge.")]),
							_: 1
						})
					];
				}),
				_: 1
			}, _parent));
			_push(`<div class="specimen__faq" data-v-2d8f4931>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Accordion_default, { items: FAQ }, null, _parent));
			_push(`</div></section><section class="specimen__section" aria-labelledby="s-table" data-v-2d8f4931><h2 id="s-table" class="h2" data-v-2d8f4931>Tabelle und Daten</h2><div class="table-scroll" role="region" aria-label="Gutachten-Auszug (Beispiel)" tabindex="0" data-v-2d8f4931><table class="table table--rows" data-v-2d8f4931><thead data-v-2d8f4931><tr data-v-2d8f4931><th data-v-2d8f4931>Hersteller</th><th data-v-2d8f4931>Handelsname</th><th data-v-2d8f4931>Typ</th><th data-v-2d8f4931>Genehmigung</th><th class="num" data-v-2d8f4931>Reifen</th></tr></thead><tbody data-v-2d8f4931><tr aria-current="true" data-v-2d8f4931><td data-v-2d8f4931>BMW</td><td data-v-2d8f4931>3er Coupé</td><td data-v-2d8f4931>346C</td><td data-v-2d8f4931>e1*2001/116*0136*</td><td class="num" data-v-2d8f4931>225/40 R18</td></tr><tr data-v-2d8f4931><td data-v-2d8f4931>BMW</td><td data-v-2d8f4931>3er Touring</td><td data-v-2d8f4931>346L</td><td data-v-2d8f4931>e1*98/14*0090*</td><td class="num" data-v-2d8f4931>225/45 R17</td></tr><tr data-v-2d8f4931><td data-v-2d8f4931>Audi</td><td data-v-2d8f4931>A4 Avant</td><td data-v-2d8f4931>B8</td><td data-v-2d8f4931>e1*2001/116*0430*</td><td class="num" data-v-2d8f4931>245/40 R18</td></tr></tbody></table></div><dl class="specs specimen__specs" data-v-2d8f4931><dt data-v-2d8f4931>Felgenbreite</dt><dd data-v-2d8f4931>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)("8,5", "J"))}</dd><dt data-v-2d8f4931>Durchmesser</dt><dd data-v-2d8f4931>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)(19, "Zoll"))}</dd><dt data-v-2d8f4931>Einpresstiefe</dt><dd data-v-2d8f4931>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)("ET", "35"))}</dd><dt data-v-2d8f4931>Lochkreis</dt><dd data-v-2d8f4931>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)(5, "× 120"))}</dd><dt data-v-2d8f4931>Mittenlochbohrung</dt><dd data-v-2d8f4931>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)("72,6", "mm"))}</dd></dl></section><section class="specimen__section" aria-labelledby="s-tyre" data-v-2d8f4931><h2 id="s-tyre" class="h2" data-v-2d8f4931>EU-Reifenlabel</h2>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(TyreLabel_default, {
				fuel: "B",
				wet: "A",
				"noise-db": 71,
				"noise-class": "B",
				title: "Continental PremiumContact 7 · 225/45 R18 95Y"
			}, null, _parent));
			_push(`</section><section class="specimen__section" aria-labelledby="s-overlays" data-v-2d8f4931><h2 id="s-overlays" class="h2" data-v-2d8f4931>Dialog, Drawer, Sheet, Hinweise</h2><div class="row" data-v-2d8f4931><button class="btn btn--secondary" type="button" data-v-2d8f4931>Dialog öffnen</button><button class="btn btn--secondary" type="button" data-v-2d8f4931>Drawer öffnen</button><button class="btn btn--secondary" type="button" data-v-2d8f4931>Sheet öffnen</button></div><div class="notices" data-v-2d8f4931><div class="notice" data-v-2d8f4931>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "info",
				size: 20
			}, null, _parent));
			_push(`<p data-v-2d8f4931>Die Erkennung läuft auf deinem Gerät. Das Foto wird nicht hochgeladen.</p></div><div class="notice notice--warn" data-v-2d8f4931>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "warning",
				size: 20
			}, null, _parent));
			_push(`<p data-v-2d8f4931>Für dieses Fahrzeug haben wir noch keine Felge mit Gutachten.</p></div><div class="notice notice--bad" data-v-2d8f4931>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "close",
				size: 20
			}, null, _parent));
			_push(`<p data-v-2d8f4931>Die Bestellung wurde nicht ausgelöst. Bitte versuche es erneut oder wähle eine andere Zahlungsart.</p></div><div class="notice notice--ok" data-v-2d8f4931>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "check",
				size: 20
			}, null, _parent));
			_push(`<p data-v-2d8f4931>Dein Fahrzeug ist gespeichert.</p></div></div><div class="empty" data-v-2d8f4931>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "cart",
				size: 24
			}, null, _parent));
			_push(`<p class="empty__title" data-v-2d8f4931>Noch keine Felgen im Warenkorb</p><p class="empty__text" data-v-2d8f4931>Wähle dein Fahrzeug, dann zeigen wir dir nur Felgen mit Gutachten dafür.</p><button class="btn btn--primary" type="button" data-v-2d8f4931>Fahrzeug wählen</button></div></section>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
				open: dialogOpen.value,
				"onUpdate:open": ($event) => dialogOpen.value = $event,
				title: "Fahrzeug entfernen?",
				description: "Dein Warenkorb bleibt erhalten. Die Freigaben werden neu geprüft, sobald du ein Fahrzeug wählst."
			}, {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-2d8f4931${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="button" data-v-2d8f4931${_scopeId}>Fahrzeug entfernen</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: ($event) => dialogOpen.value = false
					}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						onClick: ($event) => dialogOpen.value = false
					}, "Fahrzeug entfernen", 8, ["onClick"])];
				}),
				_: 1
			}, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
				open: drawerOpen.value,
				"onUpdate:open": ($event) => drawerOpen.value = $event,
				variant: "drawer",
				title: "Menü"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<nav aria-label="Menü" data-v-2d8f4931${_scopeId}><a class="menu__item" href="/felgen" data-v-2d8f4931${_scopeId}>Felgen</a><a class="menu__item" href="/rimify-check" data-v-2d8f4931${_scopeId}>RIMIFY-Check</a><a class="menu__item" href="/faq" data-v-2d8f4931${_scopeId}>FAQ</a><a class="menu__item" href="/kontakt" data-v-2d8f4931${_scopeId}>Kontakt</a></nav>`);
					else return [(0, vue_exports.createVNode)("nav", { "aria-label": "Menü" }, [
						(0, vue_exports.createVNode)("a", {
							class: "menu__item",
							href: "/felgen"
						}, "Felgen"),
						(0, vue_exports.createVNode)("a", {
							class: "menu__item",
							href: "/rimify-check"
						}, "RIMIFY-Check"),
						(0, vue_exports.createVNode)("a", {
							class: "menu__item",
							href: "/faq"
						}, "FAQ"),
						(0, vue_exports.createVNode)("a", {
							class: "menu__item",
							href: "/kontakt"
						}, "Kontakt")
					])];
				}),
				_: 1
			}, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
				open: sheetOpen.value,
				"onUpdate:open": ($event) => sheetOpen.value = $event,
				variant: "sheet",
				title: "Dein Fahrzeug"
			}, {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary btn--block" type="button" data-v-2d8f4931${_scopeId}>Fahrzeug entfernen</button><button class="btn btn--primary btn--block" type="button" data-v-2d8f4931${_scopeId}>Fahrzeug ändern</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary btn--block",
						type: "button",
						onClick: ($event) => sheetOpen.value = false
					}, "Fahrzeug entfernen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
						class: "btn btn--primary btn--block",
						type: "button",
						onClick: ($event) => sheetOpen.value = false
					}, "Fahrzeug ändern", 8, ["onClick"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<p class="h4" data-v-2d8f4931${_scopeId}>BMW 3er Coupé (E46) 320Ci</p><p class="small muted num" data-v-2d8f4931${_scopeId}>0005/582 · 1999–2006</p>`);
					else return [(0, vue_exports.createVNode)("p", { class: "h4" }, "BMW 3er Coupé (E46) 320Ci"), (0, vue_exports.createVNode)("p", { class: "small muted num" }, "0005/582 · 1999–2006")];
				}),
				_: 1
			}, _parent));
			_push(`</div><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Design/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Design/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-2d8f4931"]]);
//#endregion
export { Index_default as default };
