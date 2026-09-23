import { c as vue_exports, n as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { a as Icon_default, o as ICON_NAMES } from "./useShared-B1ZdimaV.js";
import { n as ProductTileSkeleton_default, r as Accordion_default, t as SpecCallout_default } from "./SpecCallout-Lz4w3dfO.js";
import { t as Dialog_default } from "./Dialog-DGnwH3Iu.js";
import { n as Kbd_default, t as AppLayout_default } from "./AppLayout-BVlt5D4s.js";
import { i as TabsRoot_default, n as TabsList_default, r as TabsContent_default, t as TabsTrigger_default } from "./TabsTrigger-Dze308Zc.js";
import { a as Picture_default } from "./useShortcuts-DQyB2dUf.js";
import { n as VerdictBadge_default } from "./rimify-CDsi0i0x.js";
import { i as withUnit, n as euro } from "./format--h649JLD.js";
import { t as ProductTile_default } from "./ProductTile-CO8atwV_.js";
import { t as TyreLabel_default } from "./TyreLabel-BzoHyxL1.js";
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
			["c-unk", "Unbekannt"],
			["c-unk-tint", "Unbekannt, Fläche"],
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
			_push(`<div class="container specimen" data-v-defcc772><header class="specimen__head" data-v-defcc772><h1 class="h1" data-v-defcc772>Design-System</h1><p class="body-l muted prose" data-v-defcc772>Jeder Token und jede Komponente in jedem Zustand. Was hier freigegeben ist, wird auf den Seiten verbaut – nichts anderes.</p></header><section class="specimen__section" aria-labelledby="s-colour" data-v-defcc772><h2 id="s-colour" class="h2" data-v-defcc772>Farbe</h2><ul class="swatches" data-v-defcc772><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(COLOURS, ([token, role]) => {
				_push(`<li class="swatch" data-v-defcc772><span class="swatch__chip" style="${(0, server_renderer_exports.ssrRenderStyle)({ background: `var(--${token})` })}" data-v-defcc772></span><span class="small" data-v-defcc772>${(0, server_renderer_exports.ssrInterpolate)(role)}</span><span class="micro quiet num" data-v-defcc772>--${(0, server_renderer_exports.ssrInterpolate)(token)}</span></li>`);
			});
			_push(`<!--]--></ul></section><section class="specimen__section" aria-labelledby="s-type" data-v-defcc772><h2 id="s-type" class="h2" data-v-defcc772>Schrift</h2><dl class="type-scale" data-v-defcc772><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(TYPE, ([cls, note]) => {
				_push(`<!--[--><dt class="small quiet num" data-v-defcc772>${(0, server_renderer_exports.ssrInterpolate)(note)}</dt><dd class="${(0, server_renderer_exports.ssrRenderClass)(cls)}" data-v-defcc772>Felgen, die an dein Auto dürfen.</dd><!--]-->`);
			});
			_push(`<!--]--></dl><p class="body prose" style="${(0, server_renderer_exports.ssrRenderStyle)({ "margin-top": "var(--sp-24)" })}" data-v-defcc772> Die Kraftfahrzeug-Zulassungsbescheinigung Teil I nennt in Feld 2.1 die Herstellerschlüsselnummer und in Feld 2.2 die Typschlüsselnummer. Ein Reifendruckkontrollsystem ist seit November 2014 für neu zugelassene Pkw Pflicht. Preise wie <span class="num" data-v-defcc772>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(euro)(123400))}</span>, Maße wie <span class="num" data-v-defcc772>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)("72,6", "mm"))}</span> und Größen wie <span class="num" data-v-defcc772>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)("8,5", "J"))} × 19 · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)("ET", "35"))} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)("LK", "5 × 120"))}</span> laufen in Tabellenziffern. </p></section><section class="specimen__section" aria-labelledby="s-space" data-v-defcc772><h2 id="s-space" class="h2" data-v-defcc772>Abstand, Radius, Ebenen</h2><div class="spaces" data-v-defcc772><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(SPACE, (n) => {
				_push(`<div class="space" data-v-defcc772><span class="space__bar" style="${(0, server_renderer_exports.ssrRenderStyle)({ width: `var(--sp-${n})` })}" data-v-defcc772></span><span class="micro quiet num" data-v-defcc772>${(0, server_renderer_exports.ssrInterpolate)(n)}</span></div>`);
			});
			_push(`<!--]--></div><div class="samples" style="${(0, server_renderer_exports.ssrRenderStyle)({ "margin-top": "var(--sp-32)" })}" data-v-defcc772><div class="sample sample--control" data-v-defcc772><span class="small" data-v-defcc772>4 px · Controls</span></div><div class="sample sample--tile" data-v-defcc772><span class="small" data-v-defcc772>8 px · Kacheln, Dialoge</span></div><div class="sample sample--e1" data-v-defcc772><span class="small" data-v-defcc772>--e-1 · Header</span></div><div class="sample sample--e2" data-v-defcc772><span class="small" data-v-defcc772>--e-2 · Menüs, Popover</span></div><div class="sample sample--e3" data-v-defcc772><span class="small" data-v-defcc772>--e-3 · Dialoge</span></div></div></section><section class="specimen__section" aria-labelledby="s-icons" data-v-defcc772><h2 id="s-icons" class="h2" data-v-defcc772>Icons</h2><ul class="icons" data-v-defcc772><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(ICON_NAMES), (name) => {
				_push(`<li class="icons__item" data-v-defcc772>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name,
					size: 24
				}, null, _parent));
				_push(`<span class="micro quiet" data-v-defcc772>${(0, server_renderer_exports.ssrInterpolate)(name)}</span></li>`);
			});
			_push(`<!--]--></ul></section><section class="specimen__section" aria-labelledby="s-buttons" data-v-defcc772><h2 id="s-buttons" class="h2" data-v-defcc772>Buttons</h2><div class="row" data-v-defcc772><button class="btn btn--primary" type="button" data-v-defcc772>147 passende Felgen anzeigen</button><button class="btn btn--secondary" type="button" data-v-defcc772>Fahrzeug ändern</button><button class="btn btn--ghost" type="button" data-v-defcc772>Entfernen</button><button class="btn btn--primary" type="button" disabled data-v-defcc772>Fahrzeug wählen</button><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-defcc772>Wird geprüft</button></div><div class="row" data-v-defcc772><button class="btn btn--primary btn--sm" type="button" data-v-defcc772>Klein</button><button class="btn btn--secondary btn--sm" type="button" data-v-defcc772>Klein</button><button class="btn btn--primary btn--lg" type="button" data-v-defcc772>Groß – In den Warenkorb</button><button class="icon-btn" type="button" aria-label="Suchen" data-v-defcc772>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "search",
				size: 24
			}, null, _parent));
			_push(`</button><button class="link" type="button" data-v-defcc772>Wo finde ich HSN und TSN?</button></div><div class="row dark specimen__dark" data-v-defcc772><button class="btn btn--light" type="button" data-v-defcc772>Kompletträder für mein Fahrzeug</button><button class="btn btn--outline-light" type="button" data-v-defcc772>Was ein Komplettrad ist</button></div></section><section class="specimen__section" aria-labelledby="s-fields" data-v-defcc772><h2 id="s-fields" class="h2" data-v-defcc772>Felder</h2><div class="fields" data-v-defcc772><div class="form-field" data-v-defcc772><label class="form-field__label" for="sp-text" data-v-defcc772>Marke</label><input id="sp-text" class="input" type="text" placeholder="z. B. BMW" data-v-defcc772><span class="form-field__help" data-v-defcc772>Wie in der Zulassungsbescheinigung.</span><span class="form-field__error" data-v-defcc772></span></div><div class="form-field" data-v-defcc772><label class="form-field__label" for="sp-hsn" data-v-defcc772>HSN</label><input id="sp-hsn" class="input input--code" type="text" inputmode="numeric" maxlength="4" value="0005" data-v-defcc772><span class="form-field__help" data-v-defcc772>Feld 2.1</span><span class="form-field__error" data-v-defcc772></span></div><div class="form-field" data-v-defcc772><label class="form-field__label" for="sp-err" data-v-defcc772>TSN</label><input id="sp-err" class="input input--code" type="text" value="5" aria-invalid="true" aria-describedby="sp-err-msg" data-v-defcc772><span class="form-field__help" data-v-defcc772>Feld 2.2, die ersten drei Zeichen</span><span id="sp-err-msg" class="form-field__error" data-v-defcc772>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "warning",
				size: 16
			}, null, _parent));
			_push(` Die TSN hat drei Zeichen.</span></div><div class="form-field" data-v-defcc772><label class="form-field__label" for="sp-select" data-v-defcc772>Modell</label><select id="sp-select" class="input" data-v-defcc772><option data-v-defcc772>3er Coupé (E46)</option><option data-v-defcc772>3er Limousine (E46)</option><option data-v-defcc772>3er Touring (E46)</option></select><span class="form-field__help" data-v-defcc772></span><span class="form-field__error" data-v-defcc772></span></div><div class="form-field" data-v-defcc772><label class="form-field__label" for="sp-dis" data-v-defcc772>Fahrzeug</label><input id="sp-dis" class="input" type="text" disabled placeholder="Erst Modell wählen" data-v-defcc772><span class="form-field__help" data-v-defcc772></span><span class="form-field__error" data-v-defcc772></span></div><div class="form-field" data-v-defcc772><label class="form-field__label" for="sp-search" data-v-defcc772>Suche</label><div class="input-group" data-v-defcc772><span class="input-group__icon" data-v-defcc772>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "search",
				size: 20
			}, null, _parent));
			_push(`</span><input id="sp-search" class="input" type="search" placeholder="Felge, Marke oder Größe" data-v-defcc772></div><span class="form-field__help" data-v-defcc772></span><span class="form-field__error" data-v-defcc772></span></div></div><div class="row" style="${(0, server_renderer_exports.ssrRenderStyle)({ "margin-top": "var(--sp-16)" })}" data-v-defcc772><label class="check" data-v-defcc772><input type="checkbox" checked data-v-defcc772> Ohne Eintragung</label><label class="check" data-v-defcc772><input type="radio" name="sp-r" checked data-v-defcc772> Felgen</label><label class="check" data-v-defcc772><input type="radio" name="sp-r" data-v-defcc772> Kompletträder</label></div></section><section class="specimen__section" aria-labelledby="s-chips" data-v-defcc772><h2 id="s-chips" class="h2" data-v-defcc772>Chips, Badges, Freigaben</h2><div class="chip-row" data-v-defcc772><button class="chip" type="button" data-v-defcc772>17 Zoll</button><button class="chip chip--on" type="button" aria-pressed="true" data-v-defcc772>18 Zoll</button><button class="chip chip--struck" type="button" aria-disabled="true" data-v-defcc772>20 Zoll</button><button class="chip" type="button" data-v-defcc772>BMW 3er Coupé `);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "close",
				size: 16
			}, null, _parent));
			_push(`</button></div><div class="row" style="${(0, server_renderer_exports.ssrRenderStyle)({ "margin-top": "var(--sp-16)" })}" data-v-defcc772><span class="badge" data-v-defcc772>Neu</span><span class="badge badge--count" data-v-defcc772>3</span><span class="stock stock--in" data-v-defcc772>Auf Lager</span><span class="stock stock--low" data-v-defcc772>Nur noch 4</span><span class="stock stock--out" data-v-defcc772>Ausverkauft</span>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, {
				keys: ["K"],
				modifier: ""
			}, null, _parent));
			_push(` `);
			_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["/"] }, null, _parent));
			_push(`</div><div class="row" style="${(0, server_renderer_exports.ssrRenderStyle)({ "margin-top": "var(--sp-16)" })}" data-v-defcc772><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(VERDICTS, (status) => {
				_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, {
					key: status,
					status
				}, null, _parent));
			});
			_push(`<!--]--></div><div class="row" style="${(0, server_renderer_exports.ssrRenderStyle)({ "margin-top": "var(--sp-8)" })}" data-v-defcc772><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(VERDICTS, (status) => {
				_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, {
					key: status,
					status,
					size: "lg"
				}, null, _parent));
			});
			_push(`<!--]--></div></section><section class="specimen__section" aria-labelledby="s-tiles" data-v-defcc772><h2 id="s-tiles" class="h2" data-v-defcc772>Produktkachel</h2><div class="tile-grid" data-v-defcc772><!--[-->`);
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
			_push(`</div><div class="tile-grid" style="${(0, server_renderer_exports.ssrRenderStyle)({ "margin-top": "var(--sp-32)" })}" role="group" aria-label="Ladezustand" data-v-defcc772><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(4, (n) => {
				_push((0, server_renderer_exports.ssrRenderComponent)(ProductTileSkeleton_default, { key: n }, null, _parent));
			});
			_push(`<!--]--></div></section><section class="specimen__section" aria-labelledby="s-callout" data-v-defcc772><h2 id="s-callout" class="h2" data-v-defcc772>Maßangabe im Foto</h2><div class="${(0, server_renderer_exports.ssrRenderClass)([{ "is-ready": frameReady.value }, "frame specimen__frame"])}" data-v-defcc772>`);
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
			_push(`</div><button class="btn btn--secondary btn--sm" type="button" style="${(0, server_renderer_exports.ssrRenderStyle)({ "margin-top": "var(--sp-16)" })}" data-v-defcc772>${(0, server_renderer_exports.ssrInterpolate)(frameReady.value ? "Linien zurücksetzen" : "Linien einzeichnen")}</button></section><section class="specimen__section" aria-labelledby="s-tabs" data-v-defcc772><h2 id="s-tabs" class="h2" data-v-defcc772>Tabs und Akkordeon</h2>`);
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
								if (_push) _push(`<p class="muted" data-v-defcc772${_scopeId}>Die meistgekauften Felgen der letzten 30 Tage.</p>`);
								else return [(0, vue_exports.createVNode)("p", { class: "muted" }, "Die meistgekauften Felgen der letzten 30 Tage.")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsContent_default), {
							value: "neu",
							class: "tabs__content"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<p class="muted" data-v-defcc772${_scopeId}>Neu im Sortiment.</p>`);
								else return [(0, vue_exports.createVNode)("p", { class: "muted" }, "Neu im Sortiment.")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsContent_default), {
							value: "preis",
							class: "tabs__content"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<p class="muted" data-v-defcc772${_scopeId}>Alles unter 200 € pro Felge.</p>`);
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
			_push(`<div class="specimen__faq" data-v-defcc772>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Accordion_default, { items: FAQ }, null, _parent));
			_push(`</div></section><section class="specimen__section" aria-labelledby="s-table" data-v-defcc772><h2 id="s-table" class="h2" data-v-defcc772>Tabelle und Daten</h2><div class="table-scroll" role="region" aria-label="Gutachten-Auszug (Beispiel)" tabindex="0" data-v-defcc772><table class="table table--rows" data-v-defcc772><thead data-v-defcc772><tr data-v-defcc772><th data-v-defcc772>Hersteller</th><th data-v-defcc772>Handelsname</th><th data-v-defcc772>Typ</th><th data-v-defcc772>Genehmigung</th><th class="num" data-v-defcc772>Reifen</th></tr></thead><tbody data-v-defcc772><tr aria-current="true" data-v-defcc772><td data-v-defcc772>BMW</td><td data-v-defcc772>3er Coupé</td><td data-v-defcc772>346C</td><td data-v-defcc772>e1*2001/116*0136*</td><td class="num" data-v-defcc772>225/40 R18</td></tr><tr data-v-defcc772><td data-v-defcc772>BMW</td><td data-v-defcc772>3er Touring</td><td data-v-defcc772>346L</td><td data-v-defcc772>e1*98/14*0090*</td><td class="num" data-v-defcc772>225/45 R17</td></tr><tr data-v-defcc772><td data-v-defcc772>Audi</td><td data-v-defcc772>A4 Avant</td><td data-v-defcc772>B8</td><td data-v-defcc772>e1*2001/116*0430*</td><td class="num" data-v-defcc772>245/40 R18</td></tr></tbody></table></div><dl class="specs specimen__specs" data-v-defcc772><dt data-v-defcc772>Felgenbreite</dt><dd data-v-defcc772>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)("8,5", "J"))}</dd><dt data-v-defcc772>Durchmesser</dt><dd data-v-defcc772>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)(19, "Zoll"))}</dd><dt data-v-defcc772>Einpresstiefe</dt><dd data-v-defcc772>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)("ET", "35"))}</dd><dt data-v-defcc772>Lochkreis</dt><dd data-v-defcc772>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)(5, "× 120"))}</dd><dt data-v-defcc772>Mittenlochbohrung</dt><dd data-v-defcc772>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)("72,6", "mm"))}</dd></dl></section><section class="specimen__section" aria-labelledby="s-tyre" data-v-defcc772><h2 id="s-tyre" class="h2" data-v-defcc772>EU-Reifenlabel</h2>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(TyreLabel_default, {
				fuel: "B",
				wet: "A",
				"noise-db": 71,
				"noise-class": "B",
				title: "Continental PremiumContact 7 · 225/45 R18 95Y"
			}, null, _parent));
			_push(`</section><section class="specimen__section" aria-labelledby="s-overlays" data-v-defcc772><h2 id="s-overlays" class="h2" data-v-defcc772>Dialog, Drawer, Sheet, Hinweise</h2><div class="row" data-v-defcc772><button class="btn btn--secondary" type="button" data-v-defcc772>Dialog öffnen</button><button class="btn btn--secondary" type="button" data-v-defcc772>Drawer öffnen</button><button class="btn btn--secondary" type="button" data-v-defcc772>Sheet öffnen</button></div><div class="notices" data-v-defcc772><div class="notice" data-v-defcc772>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "info",
				size: 20
			}, null, _parent));
			_push(`<p data-v-defcc772>Die Erkennung läuft auf deinem Gerät. Das Foto wird nicht hochgeladen.</p></div><div class="notice notice--warn" data-v-defcc772>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "warning",
				size: 20
			}, null, _parent));
			_push(`<p data-v-defcc772>Für dieses Fahrzeug haben wir noch keine Felge mit Gutachten.</p></div><div class="notice notice--bad" data-v-defcc772>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "close",
				size: 20
			}, null, _parent));
			_push(`<p data-v-defcc772>Die Bestellung wurde nicht ausgelöst. Bitte versuche es erneut oder wähle eine andere Zahlungsart.</p></div><div class="notice notice--ok" data-v-defcc772>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "check",
				size: 20
			}, null, _parent));
			_push(`<p data-v-defcc772>Dein Fahrzeug ist gespeichert.</p></div></div><div class="empty" data-v-defcc772>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "cart",
				size: 24
			}, null, _parent));
			_push(`<p class="empty__title" data-v-defcc772>Noch keine Felgen im Warenkorb</p><p class="empty__text" data-v-defcc772>Wähle dein Fahrzeug, dann zeigen wir dir nur Felgen mit Gutachten dafür.</p><button class="btn btn--primary" type="button" data-v-defcc772>Fahrzeug wählen</button></div></section>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
				open: dialogOpen.value,
				"onUpdate:open": ($event) => dialogOpen.value = $event,
				title: "Fahrzeug entfernen?",
				description: "Dein Warenkorb bleibt erhalten. Die Freigaben werden neu geprüft, sobald du ein Fahrzeug wählst."
			}, {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-defcc772${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="button" data-v-defcc772${_scopeId}>Fahrzeug entfernen</button>`);
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
					if (_push) _push(`<nav aria-label="Menü" data-v-defcc772${_scopeId}><a class="menu__item" href="/felgen" data-v-defcc772${_scopeId}>Felgen</a><a class="menu__item" href="/rimify-check" data-v-defcc772${_scopeId}>RIMIFY-Check</a><a class="menu__item" href="/faq" data-v-defcc772${_scopeId}>FAQ</a><a class="menu__item" href="/kontakt" data-v-defcc772${_scopeId}>Kontakt</a></nav>`);
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
					if (_push) _push(`<button class="btn btn--secondary btn--block" type="button" data-v-defcc772${_scopeId}>Fahrzeug entfernen</button><button class="btn btn--primary btn--block" type="button" data-v-defcc772${_scopeId}>Fahrzeug ändern</button>`);
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
					if (_push) _push(`<p class="h4" data-v-defcc772${_scopeId}>BMW 3er Coupé (E46) 320Ci</p><p class="small muted num" data-v-defcc772${_scopeId}>0005/582 · 1999–2006</p>`);
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
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-defcc772"]]);
//#endregion
export { Index_default as default };
