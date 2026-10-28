import { n as Accordion_default, t as SpecCallout_default } from "./SpecCallout-Dlo-jy1g.js";
import { a as link_default, i as head_default, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { i as isIconName, t as Icon_default } from "./Icon-Bryl-es8.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { a as WheelOutline_default, k as useShared, u as contactHref } from "./useShopFeedback-CtJFnKEI.js";
import { C as ZERO_LABEL, D as cleanHsn, E as BrandWall_default, O as cleanTsn, S as HeroHelp_default, T as useRowMarker, _ as companionScene, a as bandWheelAlt, b as heroScene, c as komplettrad_illustration_default, g as PHONE_PAIR_LAYOUT, h as PHONE_LAYOUT, i as rimFactsOf, m as PHONE_COMPANION, n as TITLE, o as bandWheelCaption, p as HERO_SIZES_PHONE, r as RimCode_default, s as bandWheelStyle, t as DESCRIPTION, v as companionStyle, w as zeroSentence, x as rollStyle, y as frameStyle } from "./meta-B6PqbtAV.js";
import { n as ListRow_default, r as BottomSheet_default } from "./Toast-DN4EY0J0.js";
import { i as modelle, n as decimal, o as passendeAnzeigen, r as felgen, s as withUnit, t as anzahl } from "./format-6R0uUMt3.js";
import { t as Picture_default } from "./Picture-LERI3lyx.js";
import { t as TyreLabel_default } from "./TyreLabel-Dt9-zZ9f.js";
import { t as VerdictBadge_default } from "./VerdictBadge-D63YxADb.js";
import { t as DocFacsimile_default } from "./DocFacsimile-CyZvGC_-.js";
import { t as ProductTile_default } from "./ProductTile-S1kCO5mF.js";
import { t as Skeleton_default } from "./Skeleton-KjU59WB6.js";
import { t as MobileLayout_default } from "./MobileLayout-DjN0hBL1.js";
//#region resources/js/Components/Mobile/Home/GutachtenStory.vue?vue&type=script&setup=true&lang.ts
var GutachtenStory_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "GutachtenStory",
	__ssrInlineRender: true,
	props: { stats: { default: null } },
	setup(__props) {
		/**
		* The Gutachten story on a phone (H4, signature moment 2 "Textmarker"), static: three blocks,
		* each with its own crop of the example document in that step's state — the type columns
		* marked, then the whole row, then the row with its tyre sizes and the verdict stamp. Nothing
		* scrolls, nothing animates; the marker is already on the paper.
		*
		* The document is fictional (a made-up test centre, made-up approval numbers) and says so. It
		* is the one place on the site where an Auflage may appear as a code, because that is what a
		* Gutachten looks like — the steps beside it write the answer out in sentences (R-15).
		*/
		const props = __props;
		const facts = (0, vue_exports.computed)(() => {
			const s = props.stats;
			if (s === null || s.gutachten <= 0 || s.variants <= 0 || s.wheels <= 0) return null;
			return `${anzahl(s.gutachten, "Gutachten", "Gutachten")} · ${anzahl(s.variants, "Fahrzeugvariante", "Fahrzeugvarianten")} · ${anzahl(s.wheels, "Felgenmodell", "Felgenmodelle")} mit Gutachten`;
		});
		const rows = [
			{
				maker: "Audi",
				trade: "A4 Avant",
				type: "B8",
				approval: "e1*2001/116*0430*",
				tyres: "235/40 R18, 245/40 R18",
				conditions: "A02"
			},
			{
				maker: "VW",
				trade: "Golf VII",
				type: "5G",
				approval: "e1*2007/46*0300*",
				tyres: "225/40 R18, 225/45 R17",
				conditions: "–"
			},
			{
				maker: "Mercedes-Benz",
				trade: "C-Klasse",
				type: "W205",
				approval: "e1*2007/46*0402*",
				tyres: "225/45 R17, 245/40 R18",
				conditions: "A11"
			},
			{
				maker: "BMW",
				trade: "3er Coupé",
				type: "346C",
				approval: "e1*2001/116*0136*",
				tyres: "225/40 R18, 225/45 R17",
				conditions: "–"
			},
			{
				maker: "Škoda",
				trade: "Octavia",
				type: "5E",
				approval: "e11*2007/46*0122*",
				tyres: "225/45 R17, 225/40 R18",
				conditions: "K1a"
			},
			{
				maker: "Ford",
				trade: "Focus",
				type: "DEH",
				approval: "e13*2007/46*0350*",
				tyres: "215/45 R17, 235/35 R19",
				conditions: "A02"
			},
			{
				maker: "Opel",
				trade: "Astra",
				type: "K",
				approval: "e1*2007/46*0519*",
				tyres: "225/45 R17, 225/40 R18",
				conditions: "–"
			},
			{
				maker: "Seat",
				trade: "Leon",
				type: "5F",
				approval: "e9*2007/46*0141*",
				tyres: "225/40 R18, 225/45 R17",
				conditions: "A11"
			},
			{
				maker: "VW",
				trade: "Passat",
				type: "3G",
				approval: "e1*2007/46*0396*",
				tyres: "235/45 R17, 235/40 R18",
				conditions: "K1a"
			}
		].slice(2, 5).map((row) => ({
			...row,
			tyre: row.tyres.split(",")[0]?.trim() ?? row.tyres
		}));
		const STEPS = [
			{
				n: 1,
				title: "Fahrzeug eindeutig erkennen",
				text: "Aus Marke, Modell und Variante – oder aus HSN und TSN – bestimmen wir die Typgenehmigung deines Fahrzeugs. Gehören zu einer Schlüsselnummer mehrere Fahrzeuge, fragen wir nach, statt zu raten.",
				strokes: [1],
				stamp: false
			},
			{
				n: 2,
				title: "Gutachten abgleichen",
				text: "Wir suchen die Zeile, in der genau dein Fahrzeug steht – mit der Felgengröße, der Einpresstiefe und den Reifengrößen, die dort freigegeben sind.",
				strokes: [2, 3],
				stamp: false
			},
			{
				n: 3,
				title: "Klare Antwort",
				text: "Du bekommst eine von vier Antworten: freigegeben, mit Auflagen, nicht freigegeben oder noch nicht bestätigt. Nennt das Gutachten Auflagen, schreiben wir sie aus:",
				strokes: [
					1,
					2,
					3
				],
				stamp: true
			}
		];
		const STROKES = {
			1: "M 234 13 C 340 11.5 510 16 648 14",
			2: "M -6 14.5 C 250 12.5 700 16.5 1008 13.5",
			3: "M 634 13 C 760 15 900 11.5 1008 14"
		};
		const markedRow = (0, vue_exports.ref)(null);
		const markerStyle = useRowMarker(markedRow, {
			top: 56,
			height: 28
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "story" }, _attrs))} data-v-a51289fc>`);
			if (facts.value) _push(`<p class="body num muted story__facts" data-v-a51289fc>${(0, server_renderer_exports.ssrInterpolate)(facts.value)}</p>`);
			else _push(`<!---->`);
			_push(`<ol class="story__steps" data-v-a51289fc><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(STEPS, (step) => {
				_push(`<li class="story__step" data-v-a51289fc><h3 class="h3 story__title" data-v-a51289fc><span class="story__n num" data-v-a51289fc>${(0, server_renderer_exports.ssrInterpolate)(step.n)}</span> ${(0, server_renderer_exports.ssrInterpolate)(step.title)}</h3><div class="doc doc--crop" role="img" aria-label="Beispiel eines Gutachten-Auszugs; die Zeile eines Beispielfahrzeugs ist markiert" data-v-a51289fc><div class="doc__head" data-v-a51289fc><span class="doc__title" data-v-a51289fc>Teilegutachten Nr. 12-3456 (Beispiel)</span><span class="doc__page" data-v-a51289fc>Seite 4 von 12</span></div><p class="doc__issuer" data-v-a51289fc>Technischer Dienst Musterstadt · Auszug aus Abschnitt 4: Verwendungsbereich</p><div class="doc__table-wrap" data-v-a51289fc><table class="doc__table" data-v-a51289fc><thead data-v-a51289fc><tr data-v-a51289fc><th class="doc__c1" data-v-a51289fc>Hersteller</th><th class="doc__c2" data-v-a51289fc>Typ</th><th class="doc__c3" data-v-a51289fc>Genehmigungsnr.</th><th class="doc__c4" data-v-a51289fc>Reifengrößen</th><th class="doc__c5" data-v-a51289fc>Auflagen</th></tr></thead><tbody data-v-a51289fc><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(rows), (row, r) => {
					_push(`<tr data-v-a51289fc><td data-v-a51289fc>${(0, server_renderer_exports.ssrInterpolate)(row.maker)}</td><td data-v-a51289fc>${(0, server_renderer_exports.ssrInterpolate)(row.type)}</td><td data-v-a51289fc>${(0, server_renderer_exports.ssrInterpolate)(row.approval)}</td><td data-v-a51289fc>${(0, server_renderer_exports.ssrInterpolate)(row.tyre)}</td><td data-v-a51289fc>${(0, server_renderer_exports.ssrInterpolate)(row.conditions)}</td></tr>`);
				});
				_push(`<!--]--></tbody></table><svg class="marker" style="${(0, server_renderer_exports.ssrRenderStyle)((0, vue_exports.unref)(markerStyle))}" viewBox="0 0 1000 28" preserveAspectRatio="none" aria-hidden="true" focusable="false" data-v-a51289fc><defs data-v-a51289fc><linearGradient${(0, server_renderer_exports.ssrRenderAttr)("id", `marker-ink-${step.n}`)} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0" data-v-a51289fc><stop offset="0%" class="marker__stop marker__stop--a" data-v-a51289fc></stop><stop offset="45%" class="marker__stop marker__stop--b" data-v-a51289fc></stop><stop offset="100%" class="marker__stop marker__stop--c" data-v-a51289fc></stop></linearGradient></defs><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(step.strokes, (n) => {
					_push(`<!--[--><path${(0, server_renderer_exports.ssrRenderAttr)("d", STROKES[n])} class="marker__stroke"${(0, server_renderer_exports.ssrRenderAttr)("stroke", `url(#marker-ink-${step.n})`)} data-v-a51289fc></path><path${(0, server_renderer_exports.ssrRenderAttr)("d", STROKES[n])} class="marker__stroke marker__stroke--echo"${(0, server_renderer_exports.ssrRenderAttr)("stroke", `url(#marker-ink-${step.n})`)} transform="translate(0 1)" data-v-a51289fc></path><!--]-->`);
				});
				_push(`<!--]--></svg>`);
				if (step.stamp) {
					_push(`<span class="doc__stamp" data-v-a51289fc>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, {
						status: "PERMITTED",
						size: "lg"
					}, null, _parent));
					_push(`</span>`);
				} else _push(`<!---->`);
				_push(`</div><p class="micro quiet doc__caption" data-v-a51289fc>Gutachten-Auszug (Beispiel)</p></div><p class="body muted story__text" data-v-a51289fc>${(0, server_renderer_exports.ssrInterpolate)(step.text)}</p>`);
				if (step.stamp) {
					_push(`<div class="story__example" data-v-a51289fc>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, { status: "CONDITIONAL" }, null, _parent));
					_push(`<ul class="story__conditions small" data-v-a51289fc><li data-v-a51289fc>Die Verwendung ist nur mit Reifen der Größe 225/40 R18 zulässig.</li><li data-v-a51289fc>Die Änderung ist in die Fahrzeugpapiere einzutragen.</li></ul></div>`);
				} else _push(`<!---->`);
				_push(`</li>`);
			});
			_push(`<!--]--></ol></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Mobile/Home/GutachtenStory.vue
var _sfc_setup$5 = GutachtenStory_vue_vue_type_script_setup_true_lang_default.setup;
GutachtenStory_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Mobile/Home/GutachtenStory.vue");
	return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
var GutachtenStory_default = /*#__PURE__*/ _plugin_vue_export_helper_default(GutachtenStory_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-a51289fc"]]);
//#endregion
//#region resources/js/Components/Mobile/Home/HeroFrame.vue?vue&type=script&setup=true&lang.ts
var CAPTION = "Abbildung zeigt das Design; Werte der gezeigten Ausführung.";
var SYMBOLIC = "Symbolbild – Werte einer Beispielkonfiguration";
var DEMO = "Demodaten – Beispielsortiment; Preise und Bestände sind Beispielwerte.";
var HeroFrame_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "HeroFrame",
	__ssrInlineRender: true,
	props: { heroPhoto: { default: null } },
	setup(__props) {
		/**
		* The hero frame on a phone: the same photograph and the same anchors as the desktop stage
		* (`calloutSlots.ts`, docs/phase0/ACCURACY.md §4) — the product's shadowless `bare` cut-out on one
		* CSS contact shadow in a pool of studio light, and two leaders: the Lochkreis, a dashed circle
		* through the bolt-hole centres, and the KBA number at the stamp (only when the photographed stamp
		* is this configuration's number). Under the frame: the spec line, the caption naming the product (no price and
		* no link, the client's #4), the line saying what the picture shows, and the Demodaten line.
		*
		* The photograph is the brand's (`heroPhoto`, chosen in Inhalte; PROTECTED.md P1) and stands whatever the catalogue holds,
		* with its leaders, spec line and caption: the wheel's own values as its document states them for the stamped size
		* (`heroPhoto.facts`) — no product query, so they stand with the shop empty too (the client's #4). Only where the release
		* shipped without the photograph is the outline drawn — with no brand, no model, no price, no link and no leader.
		*
		* The frame stands at the foot of the first screen — its top between 838 and 861 px on a 390 × 844 phone, and well
		* inside on a taller one — so neither wheel is lazy (the image rule of 14.10.2026, D-219) and neither is preloaded:
		* both are `soon`, asked for at once at low priority. The page's first paint needs the document alone; measured on a
		* throttled phone (Slow 4G, CPU × 4, seven interleaved loads) FCP and LCP stand where they stood with the wheels lazy
		* (1,94 s / 3,39 s against 1,96 s / 3,12 s) and the wheel is there 1,9 s sooner. Until then they were `late`, lazy
		* and last (the operator's brief of 05.10.2026, §5), on the measurement that put the frame's top at 861 px.
		* Once, on load, the wheel rolls in and the leaders draw after it; the resting frame is the default,
		* so without JavaScript and under reduced motion everything simply stands there.
		*/
		const props = __props;
		const page = usePage();
		const source = (0, vue_exports.computed)(() => props.heroPhoto ?? null);
		const facts = (0, vue_exports.computed)(() => props.heroPhoto?.facts ?? null);
		const layout = (0, vue_exports.computed)(() => source.value?.companion?.imageManifest ? PHONE_PAIR_LAYOUT : PHONE_LAYOUT);
		const scene = (0, vue_exports.computed)(() => heroScene(source.value, layout.value, facts.value));
		const failed = (0, vue_exports.ref)(false);
		const photo = (0, vue_exports.computed)(() => failed.value ? null : scene.value.picture);
		const pairFailed = (0, vue_exports.ref)(false);
		const pair = (0, vue_exports.computed)(() => photo.value === null || pairFailed.value ? null : companionScene(source.value, scene.value, layout.value, PHONE_COMPANION));
		const pairStyle = (0, vue_exports.computed)(() => pair.value === null ? {} : companionStyle(pair.value));
		const pairAlt = (0, vue_exports.computed)(() => source.value?.companion && source.value.brand ? `${source.value.brand} ${source.value.name} in ${source.value.companion.finish}, Ansicht von vorn` : "");
		const finishes = (0, vue_exports.computed)(() => source.value === null ? "" : pair.value !== null && source.value.companion ? `${source.value.finish} und ${source.value.companion.finish}` : source.value.finish);
		const callouts = (0, vue_exports.computed)(() => photo.value === null ? [] : scene.value.callouts);
		const kba = (0, vue_exports.computed)(() => callouts.value.find((c) => c.key === "kba") ?? null);
		const named = (0, vue_exports.computed)(() => facts.value !== null && photo.value !== null && source.value !== null && source.value.brand !== "");
		const alt = (0, vue_exports.computed)(() => source.value === null || !source.value.brand ? "Felge, Ansicht von vorn" : `${source.value.brand} ${source.value.name} in ${source.value.finish}, Ansicht von vorn`);
		const frameVars = (0, vue_exports.computed)(() => ({
			...frameStyle(layout.value),
			"--callout-delay": scene.value.roll === null ? "0ms" : pair.value === null ? "var(--d-roll)" : `calc(var(--d-roll) + 160ms)`
		}));
		const pictureStyle = (0, vue_exports.computed)(() => rollStyle(scene.value));
		const root = (0, vue_exports.ref)(null);
		(0, vue_exports.onMounted)(() => {
			const img = root.value?.querySelector("img") ?? null;
			if (img !== null && img.complete && img.getAttribute("src") !== null && img.naturalWidth === 0) failed.value = true;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				ref_key: "root",
				ref: root,
				class: "hero-mobile",
				"data-hero": facts.value ? "values" : "photo"
			}, _attrs))} data-v-ea28bc11><div class="frame hero-frame" style="${(0, server_renderer_exports.ssrRenderStyle)(frameVars.value)}" data-v-ea28bc11><span class="hero-studio" aria-hidden="true" data-v-ea28bc11></span>`);
			if (pair.value) {
				_push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([{ "hero-frame__pair--rolling": pair.value.roll !== null }, "hero-frame__pair"])}" style="${(0, server_renderer_exports.ssrRenderStyle)(pairStyle.value)}" data-v-ea28bc11>`);
				if (pair.value.shadow) _push(`<span class="hero-contact" aria-hidden="true" data-v-ea28bc11></span>`);
				else _push(`<!---->`);
				_push(`<span class="hero-frame__spin" data-v-ea28bc11>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
					image: pair.value.picture,
					alt: pairAlt.value,
					sizes: (0, vue_exports.unref)(HERO_SIZES_PHONE),
					soon: ""
				}, null, _parent));
				_push(`</span></span>`);
			} else _push(`<!---->`);
			if (photo.value) {
				_push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([{ "hero-frame__roll--rolling": scene.value.roll !== null }, "hero-frame__roll"])}" style="${(0, server_renderer_exports.ssrRenderStyle)(pictureStyle.value)}" data-v-ea28bc11>`);
				if (scene.value.shadow) _push(`<span class="hero-contact" aria-hidden="true" data-v-ea28bc11></span>`);
				else _push(`<!---->`);
				_push(`<span class="hero-frame__spin" data-v-ea28bc11>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
					image: photo.value,
					alt: alt.value,
					sizes: (0, vue_exports.unref)(HERO_SIZES_PHONE),
					soon: ""
				}, null, _parent));
				_push(`</span></span>`);
			} else {
				_push(`<span class="hero-frame__outline" aria-hidden="true" data-v-ea28bc11>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(WheelOutline_default, {
					bolts: 5,
					size: "82%"
				}, null, _parent));
				_push(`</span>`);
			}
			_push(`<!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(callouts.value, (c) => {
				_push((0, server_renderer_exports.ssrRenderComponent)(SpecCallout_default, {
					key: c.key,
					"data-callout": c.key,
					label: c.label,
					value: c.value,
					note: c.note,
					side: c.side,
					x: c.x,
					y: c.y,
					tx: c.tx,
					ty: c.ty,
					elbow: c.elbow,
					ring: c.ring,
					ratio: layout.value.ratio,
					weight: layout.value.weight
				}, null, _parent));
			});
			_push(`<!--]--></div>`);
			if (facts.value) {
				_push(`<!--[--><p class="small num muted hero-mobile__spec" translate="no" data-v-ea28bc11>${(0, server_renderer_exports.ssrInterpolate)(facts.value.specLine)}`);
				if (kba.value) _push(`<span class="visually-hidden" data-v-ea28bc11> · ${(0, server_renderer_exports.ssrInterpolate)(kba.value.label)} ${(0, server_renderer_exports.ssrInterpolate)(kba.value.value)}</span>`);
				else _push(`<!---->`);
				_push(`</p>`);
				if (named.value) _push(`<p class="hero-mobile__caption" data-v-ea28bc11><span class="small hero-mobile__name" translate="no" data-v-ea28bc11>${(0, server_renderer_exports.ssrInterpolate)(source.value?.brand)} ${(0, server_renderer_exports.ssrInterpolate)(source.value?.name)} · ${(0, server_renderer_exports.ssrInterpolate)(finishes.value)}</span></p>`);
				else _push(`<!---->`);
				if (photo.value) _push(`<p class="micro quiet hero-mobile__shown" data-v-ea28bc11>${(0, server_renderer_exports.ssrInterpolate)(CAPTION)}</p>`);
				else _push(`<p class="micro quiet hero-mobile__symbolic" data-v-ea28bc11>${(0, server_renderer_exports.ssrInterpolate)(SYMBOLIC)}</p>`);
				_push(`<!--]-->`);
			} else _push(`<!---->`);
			if ((0, vue_exports.unref)(page).props.demo) _push(`<p class="micro quiet demo-note" data-v-ea28bc11>${(0, server_renderer_exports.ssrInterpolate)(DEMO)}</p>`);
			else _push(`<!---->`);
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Mobile/Home/HeroFrame.vue
var _sfc_setup$4 = HeroFrame_vue_vue_type_script_setup_true_lang_default.setup;
HeroFrame_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Mobile/Home/HeroFrame.vue");
	return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
var HeroFrame_default = /*#__PURE__*/ _plugin_vue_export_helper_default(HeroFrame_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-ea28bc11"]]);
//#endregion
//#region resources/js/Components/Mobile/Home/KomplettradWheel.vue?vue&type=script&setup=true&lang.ts
var KomplettradWheel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "KomplettradWheel",
	__ssrInlineRender: true,
	props: { wheel: { default: null } },
	setup(__props) {
		/**
		* The wheel in the dark band (H7, signature moment 3) on a phone: a 240 px illustration of a
		* complete wheel, centred and labelled "Illustration", that turns with the scroll — a scroll-driven
		* animation where the browser has one, and simply a still wheel everywhere else. There is no scroll
		* listener, ever. Under reduced motion it stands at 0°. The picture is square and centred, so the
		* turn never changes the layout box.
		*
		* The wheel is a real product where one is photographed (the client's #9): the hero's wheel in its other finish, from
		* the client's own cut-out, captioned „Felge im Bild: …“ (lib/bandWheel). Without one it is the illustration, generated
		* and never photographed (docs/phase0/ACCURACY.md §3.1): the parametric rim with a parametric tyre, rendered by
		* scripts/3d/render-komplettrad.mjs — no brand, no size claimed. The alt text says what the picture is.
		*/
		const props = __props;
		const photo = (0, vue_exports.computed)(() => props.wheel === null ? null : {
			image: props.wheel.image,
			alt: bandWheelAlt(props.wheel),
			caption: bandWheelCaption(props.wheel),
			style: bandWheelStyle(props.wheel)
		});
		const failed = (0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<figure${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "komplett-figure" }, _attrs))} data-v-2135e487><div class="komplett-wheel" data-v-2135e487>`);
			if (!failed.value) {
				_push(`<span class="komplett-wheel__turn" data-v-2135e487>`);
				if (photo.value) {
					_push(`<span class="komplett-wheel__photo" style="${(0, server_renderer_exports.ssrRenderStyle)(photo.value.style)}" data-v-2135e487>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
						image: photo.value.image,
						alt: photo.value.alt,
						sizes: "280px"
					}, null, _parent));
					_push(`</span>`);
				} else _push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
					image: (0, vue_exports.unref)(komplettrad_illustration_default),
					alt: "Illustration eines Komplettrads aus Felge und Reifen, Ansicht von vorn",
					sizes: "240px"
				}, null, _parent));
				_push(`</span>`);
			} else {
				_push(`<span class="komplett-wheel__fallback" aria-hidden="true" data-v-2135e487>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(WheelOutline_default, { size: "60%" }, null, _parent));
				_push(`</span>`);
			}
			_push(`</div><figcaption class="micro quiet komplett-figure__label" data-v-2135e487>`);
			if (photo.value && !failed.value && __props.wheel?.href) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: __props.wheel.href,
				class: "komplett-figure__link"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(photo.value.caption)}`);
					else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(photo.value.caption), 1)];
				}),
				_: 1
			}, _parent));
			else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(photo.value && !failed.value ? photo.value.caption : "Illustration")}<!--]-->`);
			_push(`</figcaption></figure>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Mobile/Home/KomplettradWheel.vue
var _sfc_setup$3 = KomplettradWheel_vue_vue_type_script_setup_true_lang_default.setup;
KomplettradWheel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Mobile/Home/KomplettradWheel.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var KomplettradWheel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(KomplettradWheel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-2135e487"]]);
//#endregion
//#region resources/js/composables/mobile/useVehiclePicker.ts
/**
* The homepage selector's state on a phone: two routes to one vehicle id.
*
*   guided   Marke → Modell → Fahrzeug, each step a fetch of the next list
*   keys     HSN + TSN, one fetch that answers with one vehicle, several, or none
*
* Both end in the same place — the live count for the vehicle — and both fail closed: a list
* that cannot be loaded is reported as such, a count that cannot be loaded leaves the button
* honest ("Passende Felgen anzeigen"), and several vehicles behind one key pair are shown, never
* guessed (R-01). Every request aborts the one before it, and a late answer is dropped.
*
* Nothing here touches `window` until a watcher fires, so the server renders the resting state.
*/
async function fetchJson(url, signal) {
	const response = await fetch(url, {
		headers: { Accept: "application/json" },
		credentials: "same-origin",
		signal
	});
	if (!response.ok) throw new Error(String(response.status));
	return await response.json();
}
/** A request slot: starting a new one aborts the last and outranks any late answer. */
function slot() {
	let controller;
	let sequence = 0;
	return {
		async run(url, apply, fail) {
			controller?.abort();
			controller = new AbortController();
			const mine = ++sequence;
			try {
				const data = await fetchJson(url, controller.signal);
				if (mine === sequence) apply(data);
			} catch (error) {
				if (error.name !== "AbortError" && mine === sequence) fail();
			}
		},
		cancel() {
			controller?.abort();
			sequence++;
		}
	};
}
function useVehiclePicker() {
	const route = (0, vue_exports.ref)("guided");
	const make = (0, vue_exports.ref)("");
	const model = (0, vue_exports.ref)("");
	const variantId = (0, vue_exports.ref)(null);
	const models = (0, vue_exports.ref)([]);
	const variants = (0, vue_exports.ref)([]);
	const modelsLoading = (0, vue_exports.ref)(false);
	const variantsLoading = (0, vue_exports.ref)(false);
	const modelsFailed = (0, vue_exports.ref)(false);
	const variantsFailed = (0, vue_exports.ref)(false);
	const modelsSlot = slot();
	const variantsSlot = slot();
	const countSlot = slot();
	const count = (0, vue_exports.ref)({ status: "idle" });
	(0, vue_exports.watch)(make, (value) => {
		model.value = "";
		variantId.value = null;
		models.value = [];
		variants.value = [];
		modelsFailed.value = false;
		count.value = { status: "idle" };
		variantsSlot.cancel();
		countSlot.cancel();
		if (value === "") {
			modelsSlot.cancel();
			modelsLoading.value = false;
			return;
		}
		modelsLoading.value = true;
		modelsSlot.run(`/api/v1/vehicles/models?marke=${encodeURIComponent(value)}`, (data) => {
			models.value = data.models;
			modelsLoading.value = false;
		}, () => {
			modelsFailed.value = true;
			modelsLoading.value = false;
		});
	});
	(0, vue_exports.watch)(model, (value) => {
		variantId.value = null;
		variants.value = [];
		variantsFailed.value = false;
		count.value = { status: "idle" };
		countSlot.cancel();
		if (value === "") {
			variantsSlot.cancel();
			variantsLoading.value = false;
			return;
		}
		variantsLoading.value = true;
		variantsSlot.run(`/api/v1/vehicles/variants?marke=${encodeURIComponent(make.value)}&modell=${encodeURIComponent(value)}`, (data) => {
			variants.value = data.variants;
			variantsLoading.value = false;
		}, () => {
			variantsFailed.value = true;
			variantsLoading.value = false;
		});
	});
	(0, vue_exports.watch)(variantId, (id) => {
		if (id === null) {
			countSlot.cancel();
			count.value = { status: "idle" };
			return;
		}
		loadCount(`/api/v1/fitment/count?fahrzeug=${id}`);
	});
	const hsn = (0, vue_exports.ref)("");
	const tsn = (0, vue_exports.ref)("");
	const keysComplete = (0, vue_exports.computed)(() => hsn.value.length === 4 && tsn.value.length === 3);
	(0, vue_exports.watch)([hsn, tsn], () => {
		if (route.value !== "keys") return;
		if (!keysComplete.value) {
			countSlot.cancel();
			count.value = { status: "idle" };
			return;
		}
		loadCount(`/api/v1/fitment/count?hsn=${encodeURIComponent(hsn.value)}&tsn=${encodeURIComponent(tsn.value)}`);
	});
	(0, vue_exports.watch)(route, (value) => {
		countSlot.cancel();
		count.value = { status: "idle" };
		if (value === "keys" && keysComplete.value) loadCount(`/api/v1/fitment/count?hsn=${encodeURIComponent(hsn.value)}&tsn=${encodeURIComponent(tsn.value)}`);
		else if (value === "guided" && variantId.value !== null) loadCount(`/api/v1/fitment/count?fahrzeug=${variantId.value}`);
	});
	function loadCount(url) {
		count.value = { status: "loading" };
		countSlot.run(url, (data) => {
			if (data.ambiguous.length > 0) count.value = {
				status: "ambiguous",
				rows: data.ambiguous
			};
			else if (data.vehicle === null) count.value = { status: "not_found" };
			else count.value = {
				status: "ready",
				count: data.count,
				vehicle: data.vehicle,
				shopEmpty: data.shopEmpty === true
			};
		}, () => {
			count.value = { status: "failed" };
		});
	}
	/** Chosen from the chooser (R-01): from now on the count is that vehicle's. */
	function resolveAmbiguity(id) {
		loadCount(`/api/v1/fitment/count?fahrzeug=${id}`);
	}
	return {
		route,
		make,
		model,
		variantId,
		models,
		variants,
		modelsLoading,
		variantsLoading,
		modelsFailed,
		variantsFailed,
		hsn,
		tsn,
		keysComplete,
		count,
		chosenId: (0, vue_exports.computed)(() => {
			if (count.value.status === "ready") return count.value.vehicle.id;
			return route.value === "guided" ? variantId.value : null;
		}),
		resolveAmbiguity
	};
}
//#endregion
//#region resources/js/Components/Mobile/Home/VehiclePanel.vue?vue&type=script&setup=true&lang.ts
var VehiclePanel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "VehiclePanel",
	__ssrInlineRender: true,
	props: {
		makes: {},
		total: { default: null },
		shopEmpty: {
			type: Boolean,
			default: false
		},
		garage: { default: () => [] }
	},
	setup(__props) {
		/**
		* The selector panel of the phone homepage (H2): the camera first, then the two routes to a
		* vehicle — Marke & Modell as native selects, or HSN/TSN — with the live count under the fields
		* and the primary button carrying it. With a vehicle already chosen, the panel names it and
		* offers the listing instead of asking again.
		*
		* Three things it never does: guess between two vehicles behind one key pair (R-01), claim a
		* count it could not load, or leave a failure without a way forward (R-09).
		*
		* The scan hands the photo to `Components/Home/DocumentScan.vue`, loaded only on the tap. While
		* that component does not exist in the build, the button still opens the camera and then sends
		* the visitor to the HSN/TSN fields, so nothing here depends on it.
		*/
		const props = __props;
		const shared = useShared();
		const page = usePage();
		const keysClosed = (0, vue_exports.computed)(() => page.props.keyNumbersClosed ?? null);
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const contact = (0, vue_exports.computed)(() => shared.value.contact);
		const lookup = (0, vue_exports.computed)(() => page.props.lookup ?? null);
		const reach = (0, vue_exports.computed)(() => {
			const { phone, phoneIntl, email } = contact.value;
			const hsn = picker.hsn.value || lookup.value?.hsn;
			const tsn = picker.tsn.value || lookup.value?.tsn;
			return phone ? {
				href: `tel:${(phoneIntl ?? phone).replace(/\s/g, "")}`,
				label: `Anrufen: ${phone}`,
				sentence: `ruf uns an: ${phone}`,
				form: false
			} : {
				href: contactHref({
					subject: hsn && tsn ? `Fahrzeug nicht gefunden: HSN ${hsn} · TSN ${tsn}` : null,
					from: page.url
				}),
				label: "Schreib uns",
				sentence: `schreib uns: ${email}`,
				form: true
			};
		});
		const askHref = (0, vue_exports.computed)(() => contactHref({
			subject: "Felge für mein Fahrzeug gesucht",
			from: page.url
		}));
		const noCars = (0, vue_exports.computed)(() => props.makes.length === 0);
		const emptyHref = (0, vue_exports.computed)(() => contactHref({
			subject: "Mein Fahrzeug ist nicht dabei",
			from: page.url
		}));
		const picker = useVehiclePicker();
		const uid = (0, vue_exports.useId)();
		const scanLoader = (/* @__PURE__ */ Object.assign({ "../../Home/DocumentScan.vue": () => import("./DocumentScan-DHDDBQyc.js").then((n) => n.n) }))["../../Home/DocumentScan.vue"];
		const DocumentScan = scanLoader ? (0, vue_exports.defineAsyncComponent)(scanLoader) : null;
		(0, vue_exports.ref)(null);
		const scanFile = (0, vue_exports.ref)(null);
		const scanOpen = (0, vue_exports.ref)(false);
		const scanUnavailable = (0, vue_exports.ref)(false);
		const hsnField = (0, vue_exports.ref)(null);
		(0, vue_exports.ref)(null);
		async function onScanResult(result) {
			scanOpen.value = false;
			picker.route.value = "keys";
			picker.hsn.value = cleanHsn(result.hsn);
			picker.tsn.value = cleanTsn(result.tsn);
			await (0, vue_exports.nextTick)();
			hsnField.value?.focus();
		}
		async function onScanFailed() {
			scanOpen.value = false;
			scanUnavailable.value = true;
			picker.route.value = "keys";
			await (0, vue_exports.nextTick)();
			hsnField.value?.focus();
		}
		const hsnError = (0, vue_exports.ref)("");
		const tsnError = (0, vue_exports.ref)("");
		const helpOpen = (0, vue_exports.ref)(false);
		const doc = (0, vue_exports.ref)("neu");
		const candidate = (0, vue_exports.ref)(null);
		(0, vue_exports.watch)(() => picker.count.value.status, () => {
			candidate.value = null;
		});
		function variantLabel(v) {
			const power = v.powerPs === null ? null : withUnit(decimal(Math.round(v.powerPs * .7355), 0), "kW");
			return `${[
				v.variant,
				power,
				v.approvalShort ?? v.buildWindow
			].filter((p) => p !== null && p !== "").join(" · ")}${v.needsReview ? " (unvollständige Daten)" : ""}`;
		}
		const chosenApproval = (0, vue_exports.computed)(() => picker.variants.value.find((v) => v.id === picker.variantId.value)?.approval ?? null);
		const count = (0, vue_exports.computed)(() => picker.count.value);
		const zero = (0, vue_exports.computed)(() => count.value.status === "ready" && count.value.count === 0);
		const canSubmit = (0, vue_exports.computed)(() => {
			if (zero.value) return false;
			if (picker.chosenId.value !== null) return true;
			return picker.route.value === "keys" && picker.keysComplete.value && count.value.status === "failed";
		});
		const buttonLabel = (0, vue_exports.computed)(() => {
			if (zero.value) return ZERO_LABEL;
			if (count.value.status === "ready") return passendeAnzeigen(count.value.count);
			return canSubmit.value ? "Passende Felgen anzeigen" : "Fahrzeug wählen";
		});
		const submitting = (0, vue_exports.ref)(false);
		const waiting = (0, vue_exports.computed)(() => !canSubmit.value && !zero.value && !submitting.value && count.value.status !== "not_found" && count.value.status !== "ambiguous");
		const waitingWhy = (0, vue_exports.computed)(() => picker.route.value === "guided" ? "Noch kein Fahrzeug gewählt: Wähle Marke, Modell und Variante." : "Noch kein Fahrzeug gewählt: Trag HSN und TSN ein.");
		const notifyEmail = (0, vue_exports.ref)("");
		const notifyState = (0, vue_exports.ref)("idle");
		const notifyError = (0, vue_exports.ref)("");
		const totalLabel = (0, vue_exports.computed)(() => props.total === null ? null : decimal(props.total, 0));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			if (vehicle.value) {
				_push(`<div class="vpanel vpanel--vehicle" data-v-7e8efd2a><span class="label" data-v-7e8efd2a>Dein Fahrzeug</span><p class="h3" data-v-7e8efd2a>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</p><p class="small num muted" data-v-7e8efd2a>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.approval ?? `${vehicle.value.keyNumbers} · ${vehicle.value.buildWindow}`)}</p>`);
				if (__props.total === 0) _push(`<p class="small vpanel__count" data-v-7e8efd2a>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(zeroSentence)(__props.shopEmpty))}</p>`);
				else if (totalLabel.value !== null) _push(`<p class="small num vpanel__count" data-v-7e8efd2a><strong data-v-7e8efd2a>${(0, server_renderer_exports.ssrInterpolate)(totalLabel.value)}</strong> ${(0, server_renderer_exports.ssrInterpolate)(__props.total === 1 ? "Felge" : "Felgen")} mit Gutachten für ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</p>`);
				else _push(`<!---->`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen",
					class: "btn btn--primary btn--lg btn--block vpanel__go",
					"data-primary": "",
					prefetch: ""
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(__props.total === 0 ? (0, vue_exports.unref)(ZERO_LABEL) : __props.total !== null ? (0, vue_exports.unref)(passendeAnzeigen)(__props.total) : "Passende Felgen anzeigen")}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.total === 0 ? (0, vue_exports.unref)(ZERO_LABEL) : __props.total !== null ? (0, vue_exports.unref)(passendeAnzeigen)(__props.total) : "Passende Felgen anzeigen"), 1)];
					}),
					_: 1
				}, _parent));
				_push(`<div class="vpanel__links" data-v-7e8efd2a>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen-suchen",
					class: "link"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Fahrzeug ändern`);
						else return [(0, vue_exports.createTextVNode)("Fahrzeug ändern")];
					}),
					_: 1
				}, _parent));
				_push(`<button class="link" type="button" data-v-7e8efd2a>Fahrzeug entfernen</button></div></div>`);
			} else {
				_push(`<div class="vpanel" data-v-7e8efd2a>`);
				if (!keysClosed.value) {
					_push(`<!--[--><button class="btn btn--secondary btn--block m-press" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${(0, vue_exports.unref)(uid)}-scan-how`)} data-v-7e8efd2a>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "camera",
						size: 20
					}, null, _parent));
					_push(` Fahrzeugschein scannen </button><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-scan-how`)} class="small quiet" data-v-7e8efd2a>Foto aufnehmen</p><input class="visually-hidden" type="file" accept="image/*" capture="environment" tabindex="-1" aria-hidden="true" data-v-7e8efd2a><p class="small quiet vpanel__scan-note" data-v-7e8efd2a>Die Erkennung läuft auf deinem Gerät. Das Foto wird nicht hochgeladen.</p>`);
					if (scanUnavailable.value) _push(`<p class="notice vpanel__notice" role="status" data-v-7e8efd2a> Wir konnten HSN und TSN nicht lesen. Trag sie bitte von Hand ein. </p>`);
					else _push(`<!---->`);
					_push(`<!--]-->`);
				} else _push(`<!---->`);
				_push(`<div class="tabs__list" role="tablist" aria-label="Fahrzeug wählen" data-v-7e8efd2a><button${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-tab-guided`)} class="tabs__trigger" type="button" role="tab"${(0, server_renderer_exports.ssrRenderAttr)("aria-selected", (0, vue_exports.unref)(picker).route.value === "guided")}${(0, server_renderer_exports.ssrRenderAttr)("tabindex", (0, vue_exports.unref)(picker).route.value === "guided" ? 0 : -1)}${(0, server_renderer_exports.ssrRenderAttr)("aria-controls", `${(0, vue_exports.unref)(uid)}-panel-guided`)}${(0, server_renderer_exports.ssrRenderAttr)("data-state", (0, vue_exports.unref)(picker).route.value === "guided" ? "active" : "inactive")} data-v-7e8efd2a> Marke &amp; Modell </button><button${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-tab-keys`)} class="tabs__trigger" type="button" role="tab"${(0, server_renderer_exports.ssrRenderAttr)("aria-selected", (0, vue_exports.unref)(picker).route.value === "keys")}${(0, server_renderer_exports.ssrRenderAttr)("tabindex", (0, vue_exports.unref)(picker).route.value === "keys" ? 0 : -1)}${(0, server_renderer_exports.ssrRenderAttr)("aria-controls", `${(0, vue_exports.unref)(uid)}-panel-keys`)}${(0, server_renderer_exports.ssrRenderAttr)("data-state", (0, vue_exports.unref)(picker).route.value === "keys" ? "active" : "inactive")} data-v-7e8efd2a> HSN/TSN </button></div><div class="vpanel__panels" data-v-7e8efd2a><div${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-panel-guided`)} class="vpanel__fields"${(0, server_renderer_exports.ssrRenderAttr)("data-state", (0, vue_exports.unref)(picker).route.value === "guided" ? "active" : "inactive")} role="tabpanel"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `${(0, vue_exports.unref)(uid)}-tab-guided`)} data-v-7e8efd2a><div class="form-field" data-v-7e8efd2a><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(uid)}-marke`)} data-v-7e8efd2a>Marke</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-marke`)} class="input" autocomplete="off" data-v-7e8efd2a><option value="" data-v-7e8efd2a${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(picker).make.value) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(picker).make.value, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(picker).make.value, "")) ? " selected" : ""}>z. B. BMW</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.makes, (m) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", m.make)} data-v-7e8efd2a${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(picker).make.value) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(picker).make.value, m.make) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(picker).make.value, m.make)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(m.make)}</option>`);
				});
				_push(`<!--]--></select>`);
				if (noCars.value) {
					_push(`<p class="form-field__help vpanel__no-cars" data-v-7e8efd2a> Hier ist noch kein Fahrzeug hinterlegt. `);
					_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						class: "link",
						href: emptyHref.value
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`Schreib uns, welches Auto du fährst`);
							else return [(0, vue_exports.createTextVNode)("Schreib uns, welches Auto du fährst")];
						}),
						_: 1
					}, _parent));
					_push(`. </p>`);
				} else _push(`<!---->`);
				_push(`</div><div class="form-field" data-v-7e8efd2a><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(uid)}-modell`)} data-v-7e8efd2a>Modell</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-modell`)} class="input" autocomplete="off"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(picker).make.value === "" || (0, vue_exports.unref)(picker).modelsLoading.value || (0, vue_exports.unref)(picker).modelsFailed.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(picker).modelsLoading.value ? "true" : void 0)} data-v-7e8efd2a><option value="" data-v-7e8efd2a${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(picker).model.value) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(picker).model.value, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(picker).model.value, "")) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(picker).modelsLoading.value ? "Wird geladen …" : "z. B. 3er Coupé")}</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(picker).models.value, (m) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", m.model)} data-v-7e8efd2a${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(picker).model.value) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(picker).model.value, m.model) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(picker).model.value, m.model)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(m.model)}</option>`);
				});
				_push(`<!--]--></select>`);
				if ((0, vue_exports.unref)(picker).modelsFailed.value) {
					_push(`<p class="form-field__error" data-v-7e8efd2a> Die Modelle lassen sich gerade nicht laden. `);
					_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: `/felgen-suchen?marke=${encodeURIComponent((0, vue_exports.unref)(picker).make.value)}`,
						class: "link small"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`Auf der Fahrzeugseite weitermachen`);
							else return [(0, vue_exports.createTextVNode)("Auf der Fahrzeugseite weitermachen")];
						}),
						_: 1
					}, _parent));
					_push(`</p>`);
				} else _push(`<!---->`);
				_push(`</div><div class="form-field" data-v-7e8efd2a><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(uid)}-fahrzeug`)} data-v-7e8efd2a>Variante</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-fahrzeug`)} class="input" autocomplete="off"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(picker).model.value === "" || (0, vue_exports.unref)(picker).variantsLoading.value || (0, vue_exports.unref)(picker).variantsFailed.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(picker).variantsLoading.value ? "true" : void 0)} data-v-7e8efd2a><option${(0, server_renderer_exports.ssrRenderAttr)("value", null)} data-v-7e8efd2a${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(picker).variantId.value) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(picker).variantId.value, null) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(picker).variantId.value, null)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(picker).variantsLoading.value ? "Wird geladen …" : "Variante, Baujahr, kW")}</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(picker).variants.value, (v) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", v.id)} data-v-7e8efd2a${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(picker).variantId.value) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(picker).variantId.value, v.id) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(picker).variantId.value, v.id)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(variantLabel(v))}</option>`);
				});
				_push(`<!--]--></select>`);
				if ((0, vue_exports.unref)(picker).variantsFailed.value) _push(`<p class="form-field__error" data-v-7e8efd2a>Die Varianten lassen sich gerade nicht laden.</p>`);
				else if (chosenApproval.value) _push(`<p class="form-field__help num" data-v-7e8efd2a>${(0, server_renderer_exports.ssrInterpolate)(chosenApproval.value)}</p>`);
				else _push(`<!---->`);
				_push(`</div></div><div${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-panel-keys`)} class="vpanel__fields"${(0, server_renderer_exports.ssrRenderAttr)("data-state", (0, vue_exports.unref)(picker).route.value === "keys" ? "active" : "inactive")} role="tabpanel"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `${(0, vue_exports.unref)(uid)}-tab-keys`)} data-v-7e8efd2a>`);
				if (keysClosed.value) {
					_push(`<div class="notice vpanel__notice vpanel__closed" data-v-7e8efd2a><p data-v-7e8efd2a>${(0, server_renderer_exports.ssrInterpolate)(keysClosed.value)}</p>`);
					if (!noCars.value) _push(`<button class="link" type="button" data-v-7e8efd2a>Marke &amp; Modell wählen</button>`);
					else _push(`<!---->`);
					_push(`</div>`);
				} else {
					_push(`<!--[--><div class="vpanel__keys" data-v-7e8efd2a><div class="form-field" data-v-7e8efd2a><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(uid)}-hsn`)} data-v-7e8efd2a>HSN (Feld 2.1)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-hsn`)} class="input input--code num" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="next"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(picker).hsn.value)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", hsnError.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${(0, vue_exports.unref)(uid)}-keys-error`)} data-v-7e8efd2a></div><div class="form-field" data-v-7e8efd2a><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(uid)}-tsn`)} data-v-7e8efd2a>TSN (Feld 2.2)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-tsn`)} class="input input--code" type="text" autocapitalize="characters"${(0, server_renderer_exports.ssrRenderAttr)("maxlength", (0, vue_exports.unref)(3))} autocomplete="off" enterkeyhint="go"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(picker).tsn.value)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", tsnError.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${(0, vue_exports.unref)(uid)}-keys-error`)} data-v-7e8efd2a></div></div><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-keys-error`)} class="form-field__error" data-v-7e8efd2a>${(0, server_renderer_exports.ssrInterpolate)(hsnError.value || tsnError.value)}</p><button class="link small vpanel__help" type="button" data-v-7e8efd2a>Wo finde ich HSN und TSN?</button>`);
					if (count.value.status === "ambiguous") {
						_push(`<div class="vpanel__chooser" data-v-7e8efd2a><p class="h4" data-v-7e8efd2a>${(0, server_renderer_exports.ssrInterpolate)(count.value.rows.length)} Fahrzeuge passen zu ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(picker).hsn.value)}/${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(picker).tsn.value)} – welches ist deins?</p><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(count.value.rows, (row) => {
							_push(`<label class="check" data-v-7e8efd2a><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(candidate.value, row.id)) ? " checked" : ""} type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", `${(0, vue_exports.unref)(uid)}-kandidat`)}${(0, server_renderer_exports.ssrRenderAttr)("value", row.id)} data-v-7e8efd2a><span data-v-7e8efd2a>${(0, server_renderer_exports.ssrInterpolate)(row.label)}</span></label>`);
						});
						_push(`<!--]--><button class="btn btn--secondary btn--block" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(candidate.value === null) ? " disabled" : ""} data-v-7e8efd2a> Dieses Fahrzeug wählen </button><button class="link small" type="button" data-v-7e8efd2a>Andere Nummern eingeben</button></div>`);
					} else _push(`<!---->`);
					if (count.value.status === "not_found" || lookup.value?.status === "not_found") {
						_push(`<div class="notice vpanel__notice" data-v-7e8efd2a>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "warning",
							size: 20
						}, null, _parent));
						_push(`<div class="vpanel__miss" data-v-7e8efd2a><p data-v-7e8efd2a>Zu ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(picker).hsn.value || lookup.value?.hsn)}/${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(picker).tsn.value || lookup.value?.tsn)} haben wir die Daten für dieses Fahrzeug noch nicht hinterlegt.</p><button class="link" type="button" data-v-7e8efd2a>Nochmal prüfen</button><button class="link" type="button" data-v-7e8efd2a>Über Marke &amp; Modell wählen</button>`);
						(0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)(reach.value.form ? (0, vue_exports.unref)(link_default) : "a"), {
							class: "link num",
							href: reach.value.href
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(reach.value.label)}`);
								else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(reach.value.label), 1)];
							}),
							_: 1
						}), _parent);
						_push(`</div></div>`);
					} else _push(`<!---->`);
					_push(`<!--]-->`);
				}
				_push(`</div></div><div class="vpanel__count" aria-live="polite" data-v-7e8efd2a>`);
				if (count.value.status === "loading") _push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
					width: "60%",
					height: "var(--lh-small)"
				}, null, _parent));
				else if (count.value.status === "failed") _push(`<p class="small muted" data-v-7e8efd2a>Die Anzahl lässt sich gerade nicht laden.</p>`);
				else if (count.value.status === "ready" && count.value.count > 0) _push(`<p class="small num" data-v-7e8efd2a><strong data-v-7e8efd2a>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(count.value.count, 0))}</strong> ${(0, server_renderer_exports.ssrInterpolate)(count.value.count === 1 ? "Felge" : "Felgen")} mit Gutachten für ${(0, server_renderer_exports.ssrInterpolate)(count.value.vehicle.label)}</p>`);
				else if (zero.value) {
					_push(`<div class="notice vpanel__zero" data-v-7e8efd2a><div data-v-7e8efd2a><p data-v-7e8efd2a>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(zeroSentence)(count.value.status === "ready" && count.value.shopEmpty === true))}</p>`);
					if ((0, vue_exports.unref)(shared).notifyByMail !== true) {
						_push(`<p class="small muted" data-v-7e8efd2a>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							class: "link",
							href: askHref.value
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Schreib uns`);
								else return [(0, vue_exports.createTextVNode)("Schreib uns")];
							}),
							_: 1
						}, _parent));
						_push(` – wir sehen nach, was es dafür gibt. </p>`);
					} else if (notifyState.value === "done") _push(`<p class="small muted" data-v-7e8efd2a>Danke. Bestätige bitte den Link in der E-Mail, die wir dir gerade geschickt haben.</p>`);
					else {
						_push(`<form class="vpanel__notify" data-v-7e8efd2a><p class="small muted" data-v-7e8efd2a>Sag uns deine E-Mail-Adresse – wir melden uns, sobald ein Gutachten dein Fahrzeug nennt.</p><div class="form-field" data-v-7e8efd2a><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(uid)}-mail`)} data-v-7e8efd2a>E-Mail-Adresse</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-mail`)}${(0, server_renderer_exports.ssrRenderAttr)("value", notifyEmail.value)} class="input" type="email" autocomplete="email" inputmode="email" enterkeyhint="send" required data-v-7e8efd2a><p class="form-field__error" data-v-7e8efd2a>`);
						if (notifyState.value === "failed") _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(notifyError.value || `Das hat nicht geklappt. Versuch es bitte noch einmal oder ${reach.value.sentence}.`)}<!--]-->`);
						else _push(`<!---->`);
						_push(`</p></div><button class="btn btn--secondary btn--block" type="submit"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", notifyState.value === "busy" ? "true" : void 0)} data-v-7e8efd2a>Bescheid geben</button><p class="micro quiet" data-v-7e8efd2a>Du bekommst zuerst eine Bestätigungsmail. Abmelden geht jederzeit mit einem Klick.</p></form>`);
					}
					_push(`</div></div>`);
				} else _push(`<!---->`);
				_push(`</div><button class="${(0, server_renderer_exports.ssrRenderClass)([{ "vpanel__go--waiting": waiting.value }, "btn btn--primary btn--lg btn--block vpanel__go"])}" type="button" data-primary${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!waiting.value && (!canSubmit.value || submitting.value)) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", waiting.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", waiting.value ? `${(0, vue_exports.unref)(uid)}-why` : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", submitting.value ? "true" : void 0)} data-v-7e8efd2a>${(0, server_renderer_exports.ssrInterpolate)(buttonLabel.value)}</button>`);
				if (waiting.value) _push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-why`)} class="micro quiet vpanel__why" data-v-7e8efd2a>${(0, server_renderer_exports.ssrInterpolate)(waitingWhy.value)}</p>`);
				else _push(`<!---->`);
				if (__props.garage.length) {
					_push(`<div class="vpanel__garage" data-v-7e8efd2a><span class="label" data-v-7e8efd2a>Zuletzt gewählt:</span><div class="chip-row" data-v-7e8efd2a><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.garage, (entry) => {
						_push(`<button class="chip m-press" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", entry.range ? `${entry.label} · ${entry.range}` : entry.label)} data-v-7e8efd2a>${(0, server_renderer_exports.ssrInterpolate)(entry.short)}`);
						if (entry.range) _push(`<span class="vpanel__chip-range num" data-v-7e8efd2a> · ${(0, server_renderer_exports.ssrInterpolate)(entry.range)}</span>`);
						else _push(`<!---->`);
						_push(`</button>`);
					});
					_push(`<!--]--></div></div>`);
				} else _push(`<!---->`);
				_push(`</div>`);
			}
			_push((0, server_renderer_exports.ssrRenderComponent)(BottomSheet_default, {
				id: "hsn-hilfe",
				open: helpOpen.value,
				"onUpdate:open": ($event) => helpOpen.value = $event,
				title: "Wo finde ich HSN und TSN?"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="chip-row vpanel__doc-toggle" role="group" aria-label="Ausgabe des Fahrzeugscheins" data-v-7e8efd2a${_scopeId}><button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", doc.value === "neu")} data-v-7e8efd2a${_scopeId}>Neue Zulassungsbescheinigung</button><button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", doc.value === "alt")} data-v-7e8efd2a${_scopeId}>Alter Fahrzeugschein</button></div><div class="vpanel__doc" data-v-7e8efd2a${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(DocFacsimile_default, {
							variant: doc.value,
							width: 350
						}, null, _parent, _scopeId));
						_push(`</div><p class="small muted" data-v-7e8efd2a${_scopeId}>Die HSN steht in Feld 2.1, die TSN sind die ersten drei Zeichen von Feld 2.2 deiner Zulassungsbescheinigung Teil I.</p>`);
					} else return [
						(0, vue_exports.createVNode)("div", {
							class: "chip-row vpanel__doc-toggle",
							role: "group",
							"aria-label": "Ausgabe des Fahrzeugscheins"
						}, [(0, vue_exports.createVNode)("button", {
							class: "chip",
							type: "button",
							"aria-pressed": doc.value === "neu",
							onClick: ($event) => doc.value = "neu"
						}, "Neue Zulassungsbescheinigung", 8, ["aria-pressed", "onClick"]), (0, vue_exports.createVNode)("button", {
							class: "chip",
							type: "button",
							"aria-pressed": doc.value === "alt",
							onClick: ($event) => doc.value = "alt"
						}, "Alter Fahrzeugschein", 8, ["aria-pressed", "onClick"])]),
						(0, vue_exports.createVNode)("div", { class: "vpanel__doc" }, [(0, vue_exports.createVNode)(DocFacsimile_default, {
							variant: doc.value,
							width: 350
						}, null, 8, ["variant"])]),
						(0, vue_exports.createVNode)("p", { class: "small muted" }, "Die HSN steht in Feld 2.1, die TSN sind die ersten drei Zeichen von Feld 2.2 deiner Zulassungsbescheinigung Teil I.")
					];
				}),
				_: 1
			}, _parent));
			if ((0, vue_exports.unref)(DocumentScan)) _push((0, server_renderer_exports.ssrRenderComponent)(BottomSheet_default, {
				id: "scan",
				open: scanOpen.value,
				"onUpdate:open": ($event) => scanOpen.value = $event,
				title: "Fahrzeugschein",
				snap: "half"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (scanFile.value) (0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)((0, vue_exports.unref)(DocumentScan)), {
							file: scanFile.value,
							onConfirm: onScanResult,
							onFailed: onScanFailed
						}, null), _parent, _scopeId);
						else _push(`<!---->`);
					} else return [scanFile.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.resolveDynamicComponent)((0, vue_exports.unref)(DocumentScan)), {
						key: 0,
						file: scanFile.value,
						onConfirm: onScanResult,
						onFailed: onScanFailed
					}, null, 40, ["file"])) : (0, vue_exports.createCommentVNode)("", true)];
				}),
				_: 1
			}, _parent));
			else _push(`<!---->`);
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Mobile/Home/VehiclePanel.vue
var _sfc_setup$2 = VehiclePanel_vue_vue_type_script_setup_true_lang_default.setup;
VehiclePanel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Mobile/Home/VehiclePanel.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var VehiclePanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(VehiclePanel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-7e8efd2a"]]);
//#endregion
//#region resources/js/Components/Mobile/Shelf.vue?vue&type=script&setup=true&lang.ts
var Shelf_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Shelf",
	__ssrInlineRender: true,
	props: {
		title: {},
		href: { default: void 0 },
		linkLabel: { default: "Alle ansehen" },
		headingLevel: { default: 2 },
		width: { default: void 0 },
		listLabel: { default: void 0 },
		bare: {
			type: Boolean,
			default: false
		},
		hideHead: {
			type: Boolean,
			default: false
		},
		focusable: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* A horizontal shelf: a row header with "Alle ansehen", then tiles that snap as they scroll,
		* 2.2 of them visible so the cut-off third says "there is more" without a hint. The track bleeds
		* to the viewport edges and its scroll padding equals the page margin, so a snapped tile sits
		* exactly on the page grid.
		*/
		const props = __props;
		const uid = (0, vue_exports.useId)();
		const style = (0, vue_exports.computed)(() => props.width ? { "--shelf-w": props.width } : void 0);
		return (_ctx, _push, _parent, _attrs) => {
			(0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)(__props.bare ? "div" : "section"), (0, vue_exports.mergeProps)({
				class: "mshelf",
				"aria-labelledby": __props.bare ? void 0 : `${(0, vue_exports.unref)(uid)}-title`
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (!__props.hideHead) {
							_push(`<div class="mshelf__head" data-v-1c954006${_scopeId}>`);
							(0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)(`h${__props.headingLevel}`), {
								id: `${(0, vue_exports.unref)(uid)}-title`,
								class: "h3 mshelf__title"
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(__props.title)}`);
									else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.title), 1)];
								}),
								_: 1
							}), _parent, _scopeId);
							if (__props.href) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
								href: __props.href,
								class: "mshelf__all",
								prefetch: ""
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(__props.linkLabel)}`);
									else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.linkLabel), 1)];
								}),
								_: 1
							}, _parent, _scopeId));
							else _push(`<!---->`);
							_push(`</div>`);
						} else _push(`<!---->`);
						_push(`<ul class="mshelf__track" style="${(0, server_renderer_exports.ssrRenderStyle)(style.value)}"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", __props.listLabel ?? __props.title)}${(0, server_renderer_exports.ssrRenderAttr)("tabindex", __props.focusable ? 0 : void 0)} data-v-1c954006${_scopeId}>`);
						(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent, _scopeId);
						_push(`</ul>`);
					} else return [!__props.hideHead ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
						key: 0,
						class: "mshelf__head"
					}, [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.resolveDynamicComponent)(`h${__props.headingLevel}`), {
						id: `${(0, vue_exports.unref)(uid)}-title`,
						class: "h3 mshelf__title"
					}, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.title), 1)]),
						_: 1
					}, 8, ["id"])), __props.href ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
						key: 0,
						href: __props.href,
						class: "mshelf__all",
						prefetch: ""
					}, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.linkLabel), 1)]),
						_: 1
					}, 8, ["href"])) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)("ul", {
						class: "mshelf__track",
						style: style.value,
						"aria-label": __props.listLabel ?? __props.title,
						tabindex: __props.focusable ? 0 : void 0
					}, [(0, vue_exports.renderSlot)(_ctx.$slots, "default", {}, void 0, true)], 12, ["aria-label", "tabindex"])];
				}),
				_: 3
			}), _parent);
		};
	}
});
//#endregion
//#region resources/js/Components/Mobile/Shelf.vue
var _sfc_setup$1 = Shelf_vue_vue_type_script_setup_true_lang_default.setup;
Shelf_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Mobile/Shelf.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var Shelf_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Shelf_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-1c954006"]]);
//#endregion
//#region resources/js/Pages/Startseite/Mobile.vue?vue&type=script&setup=true&lang.ts
var PHONE_SUBLINE = "Nur Felgen, deren Gutachten dein Fahrzeug nennt – mit Reifengrößen und Auflagen.";
var Mobile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: MobileLayout_default,
	__name: "Mobile",
	__ssrInlineRender: true,
	props: {
		hero: {},
		stats: {},
		photoWheel: {},
		selector: {},
		fitmentCount: {},
		promises: {},
		popular: {},
		shopEmpty: { type: Boolean },
		recentlyViewed: {},
		sizes: {},
		brands: {},
		komplettrad: {},
		calculator: {},
		partners: {},
		guides: {},
		faq: {},
		demo: { type: Boolean }
	},
	setup(__props) {
		/**
		* The homepage as an app screen (docs/design/sections/home.md, phone column).
		*
		* One column of blocks: the question and the panel that answers it, then evidence — the promise
		* row, the Gutachten story, the real catalogue as shelves, two shortcuts into it, the tyre label,
		* what the numbers on a wheel mean, the guides, a person to ask. Sections alternate surface and band by position
		* over the sections actually rendered (§0.3), so an absent block never leaves two bands touching.
		*
		* Same props as the desktop document; the split is presentation only.
		*/
		const props = __props;
		const shared = useShared();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const contact = (0, vue_exports.computed)(() => shared.value.contact);
		const garage = (0, vue_exports.computed)(() => shared.value.garage ?? []);
		const service = (0, vue_exports.computed)(() => shared.value.serviceStatus ?? null);
		/** The phone sentence from home.md, for a homepage whose block carries no phone sentence of its own. */
		const title = (0, vue_exports.computed)(() => vehicle.value ? `Felgen mit Gutachten für ${vehicle.value.short}.` : props.hero.title);
		const subline = (0, vue_exports.computed)(() => props.hero.sublineMobile || PHONE_SUBLINE);
		/** F1 for the shared vehicle, in the first paint; the listing's total is the same figure's fallback. */
		const vehicleCount = (0, vue_exports.computed)(() => props.fitmentCount?.count ?? props.popular?.total ?? null);
		/** `1 passende Felge` · `9 passende Felgen` — `felgen()` with the adjective between the number and the noun. */
		const passende = (count) => felgen(count).replace(" ", ` passende `);
		const promiseIcon = (name) => isIconName(name) ? name : "check";
		const popularTitle = (0, vue_exports.computed)(() => props.popular?.title ?? "");
		const listingLabel = (0, vue_exports.computed)(() => vehicle.value && vehicleCount.value !== null ? `${passende(vehicleCount.value)} anzeigen` : "Alle Felgen ansehen");
		const sizes = (0, vue_exports.computed)(() => props.sizes.filter((s) => s.count > 0).map((s) => {
			const fitting = vehicle.value ? s.fitting : null;
			return {
				...s,
				none: fitting === 0,
				line: fitting === null ? modelle(s.count) : passende(fitting)
			};
		}));
		const tyre = (0, vue_exports.computed)(() => props.komplettrad.tyre);
		const komplettradHref = (0, vue_exports.computed)(() => vehicle.value ? "/felgen" : "/felgen-suchen");
		const plz = (0, vue_exports.ref)("");
		const partnerState = (0, vue_exports.ref)("idle");
		const faqItems = (0, vue_exports.computed)(() => props.faq.slice(0, 5).map((f) => ({
			id: f.id,
			title: f.question,
			body: f.answer
		})));
		const statusLine = (0, vue_exports.computed)(() => service.value?.label ?? contact.value.hours);
		const telHref = (0, vue_exports.computed)(() => `tel:${(contact.value.phoneIntl ?? contact.value.phone ?? "").replace(/\s/g, "")}`);
		const waHref = (0, vue_exports.computed)(() => `https://wa.me/${(contact.value.whatsapp ?? "").replace(/\D/g, "")}`);
		const rendered = (0, vue_exports.computed)(() => {
			const list = [
				{
					id: "h4",
					on: true
				},
				{
					id: "h5",
					on: props.popular !== null || props.recentlyViewed.length > 0
				},
				{
					id: "h6",
					on: sizes.value.length > 0 || props.brands.length > 0
				},
				{
					id: "h7",
					on: tyre.value !== null || (props.komplettrad.wheel ?? null) !== null,
					dark: true
				},
				{
					id: "h8",
					on: rimFactsOf(props.photoWheel) !== null
				},
				{
					id: "h9",
					on: props.partners.enabled
				},
				{
					id: "h10",
					on: props.guides.length > 0
				},
				{
					id: "h11",
					on: true
				}
			];
			const out = {};
			let position = 0;
			let light = 0;
			for (const s of list) {
				if (!s.on) continue;
				const padding = position % 2 === 0 ? "section" : "section--tight";
				let tone = "dark";
				if (!s.dark) {
					tone = light % 2 === 0 ? "band" : "surface";
					light++;
				}
				out[s.id] = `${tone} ${padding} home-below`;
				position++;
			}
			return out;
		});
		const cls = (id) => rendered.value[id] ?? "surface section";
		function measure() {
			const sections = [...document.querySelectorAll(".home-below")];
			const anchor = [...document.querySelectorAll("main section[id]")].find((s) => s.getBoundingClientRect().bottom > 0);
			const before = anchor?.getBoundingClientRect().top ?? 0;
			sections.forEach((section) => section.classList.add("home-below--measured"));
			if (anchor !== void 0 && window.scrollY > 0) window.scrollBy(0, anchor.getBoundingClientRect().top - before);
			requestAnimationFrame(() => requestAnimationFrame(() => sections.forEach((section) => section.classList.remove("home-below--measured"))));
		}
		let width = 0;
		let again;
		function onResize() {
			if (window.innerWidth === width) return;
			width = window.innerWidth;
			clearTimeout(again);
			again = setTimeout(measure, 150);
		}
		(0, vue_exports.onMounted)(() => {
			width = window.innerWidth;
			measure();
			window.addEventListener("resize", onResize);
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			window.removeEventListener("resize", onResize);
			clearTimeout(again);
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: (0, vue_exports.unref)(TITLE) }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<meta name="description"${(0, server_renderer_exports.ssrRenderAttr)("content", (0, vue_exports.unref)(DESCRIPTION))} head-key="description" data-v-dbcea679${_scopeId}>`);
					else return [(0, vue_exports.createVNode)("meta", {
						name: "description",
						content: (0, vue_exports.unref)(DESCRIPTION),
						"head-key": "description"
					}, null, 8, ["content"])];
				}),
				_: 1
			}, _parent));
			_push(`<section id="h2" data-section="H2" class="home-hero band" aria-labelledby="h2-title" data-v-dbcea679><div class="container" data-v-dbcea679><h1 id="h2-title" class="h1 home-hero__title" data-v-dbcea679>${(0, server_renderer_exports.ssrInterpolate)(title.value)}</h1><p class="body-l muted home-hero__sub" data-v-dbcea679>${(0, server_renderer_exports.ssrInterpolate)(subline.value)}</p><div class="home-hero__panel" data-v-dbcea679>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(VehiclePanel_default, {
				makes: __props.selector.makes,
				total: vehicleCount.value,
				"shop-empty": __props.fitmentCount?.shopEmpty ?? __props.shopEmpty,
				garage: garage.value
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(HeroHelp_default, { class: "home-hero__help" }, null, _parent));
			_push(`</div><div class="home-hero__frame" data-v-dbcea679>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(HeroFrame_default, { "hero-photo": __props.hero.photo ?? null }, null, _parent));
			_push(`</div></div></section>`);
			if (__props.promises.length) {
				_push(`<section id="h3" data-section="H3" class="home-promises" aria-label="Was wir zusagen" data-v-dbcea679><ul class="container home-promises__list" data-v-dbcea679><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.promises, (item) => {
					_push(`<li class="home-promises__item" data-v-dbcea679>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: promiseIcon(item.icon),
						size: 20
					}, null, _parent));
					_push(`<span class="home-promises__title" data-v-dbcea679>${(0, server_renderer_exports.ssrInterpolate)(item.title)}</span><span class="small muted" data-v-dbcea679>${(0, server_renderer_exports.ssrInterpolate)(item.text)}</span></li>`);
				});
				_push(`<!--]--></ul></section>`);
			} else _push(`<!---->`);
			_push(`<section id="h4" data-section="H4" class="${(0, server_renderer_exports.ssrRenderClass)(cls("h4"))}" aria-labelledby="h4-title" data-v-dbcea679><div class="container" data-v-dbcea679><h2 id="h4-title" class="h2 home-h2" data-v-dbcea679>Wir lesen das Gutachten. Du bekommst die Antwort.</h2>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(GutachtenStory_default, { stats: __props.stats }, null, _parent));
			_push(`</div></section>`);
			if (rendered.value.h5) {
				_push(`<section id="h5" data-section="H5"${(0, server_renderer_exports.ssrRenderAttr)("data-ranking", __props.popular?.ranking)} class="${(0, server_renderer_exports.ssrRenderClass)(cls("h5"))}"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", __props.popular ? "h5-title" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", __props.popular ? void 0 : "Zuletzt angesehen")} data-v-dbcea679>`);
				if (__props.popular) {
					_push(`<!--[--><div class="container" data-v-dbcea679><h2 id="h5-title" class="h2 home-h2" data-v-dbcea679>${(0, server_renderer_exports.ssrInterpolate)(popularTitle.value)}</h2>`);
					if (vehicle.value) _push(`<p class="body muted home-h5__for" data-v-dbcea679>Passend für ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.short)}</p>`);
					else _push(`<!---->`);
					_push(`</div>`);
					if (__props.popular.cards.length) _push((0, server_renderer_exports.ssrRenderComponent)(Shelf_default, {
						bare: "",
						"hide-head": "",
						title: popularTitle.value,
						width: "62vw",
						"list-label": "Felgen"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push(`<!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.popular.cards, (card) => {
									_push(`<li data-v-dbcea679${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(ProductTile_default, {
										card,
										vehicle: vehicle.value,
										compare: ""
									}, null, _parent, _scopeId));
									_push(`</li>`);
								});
								_push(`<!--]-->`);
							} else return [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.popular.cards, (card) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: `${card.modelId}-${card.finishId}` }, [(0, vue_exports.createVNode)(ProductTile_default, {
									card,
									vehicle: vehicle.value,
									compare: ""
								}, null, 8, ["card", "vehicle"])]);
							}), 128))];
						}),
						_: 1
					}, _parent));
					else _push(`<div class="container empty" data-v-dbcea679><p class="empty__title" data-v-dbcea679>Für dein Fahrzeug ist hier gerade keine dabei.</p><p class="empty__text" data-v-dbcea679>In der Felgenliste siehst du jede Felge, deren Freigabe für dein Fahrzeug bei uns hinterlegt ist.</p></div>`);
					_push(`<div class="container home-h5__foot" data-v-dbcea679>`);
					_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: "/felgen",
						class: "btn btn--secondary btn--block",
						prefetch: ""
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(listingLabel.value)}`);
							else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(listingLabel.value), 1)];
						}),
						_: 1
					}, _parent));
					_push(`</div><!--]-->`);
				} else _push(`<!---->`);
				if (__props.recentlyViewed.length) {
					_push(`<div id="h5b" data-section="H5b" class="home-h5b" data-v-dbcea679>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Shelf_default, {
						bare: "",
						title: "Zuletzt angesehen",
						width: "62vw",
						"heading-level": 2
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push(`<!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.recentlyViewed.slice(0, 12), (card) => {
									_push(`<li data-v-dbcea679${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(ProductTile_default, {
										card,
										vehicle: vehicle.value
									}, null, _parent, _scopeId));
									_push(`</li>`);
								});
								_push(`<!--]-->`);
							} else return [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.recentlyViewed.slice(0, 12), (card) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: `rv-${card.modelId}-${card.finishId}` }, [(0, vue_exports.createVNode)(ProductTile_default, {
									card,
									vehicle: vehicle.value
								}, null, 8, ["card", "vehicle"])]);
							}), 128))];
						}),
						_: 1
					}, _parent));
					_push(`</div>`);
				} else _push(`<!---->`);
				_push(`</section>`);
			} else _push(`<!---->`);
			if (rendered.value.h6) {
				_push(`<section id="h6" data-section="H6" class="${(0, server_renderer_exports.ssrRenderClass)(cls("h6"))}" aria-labelledby="h6-title" data-v-dbcea679><div class="container" data-v-dbcea679><h2 id="h6-title" class="h2 home-h2" data-v-dbcea679>${(0, server_renderer_exports.ssrInterpolate)(sizes.value.length ? "Nach Zollgröße" : "Nach Marke")}</h2></div>`);
				if (sizes.value.length) _push((0, server_renderer_exports.ssrRenderComponent)(Shelf_default, {
					bare: "",
					"hide-head": "",
					title: "Nach Zollgröße",
					width: "96px",
					"list-label": "Zollgrößen"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push(`<!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(sizes.value, (size) => {
								_push(`<li data-v-dbcea679${_scopeId}>`);
								if (size.none) _push(`<span class="size-tile size-tile--none" aria-disabled="true" data-v-dbcea679${_scopeId}><span class="display num size-tile__n" data-v-dbcea679${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(size.inch)}</span><span class="small quiet" data-v-dbcea679${_scopeId}>Zoll</span><span class="small num quiet" data-v-dbcea679${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(size.line)}</span></span>`);
								else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: size.href,
									class: "size-tile m-press"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`<span class="display num size-tile__n" data-v-dbcea679${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(size.inch)}</span><span class="small muted" data-v-dbcea679${_scopeId}>Zoll</span><span class="small num muted" data-v-dbcea679${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(size.line)}</span>`);
										else return [
											(0, vue_exports.createVNode)("span", { class: "display num size-tile__n" }, (0, vue_exports.toDisplayString)(size.inch), 1),
											(0, vue_exports.createVNode)("span", { class: "small muted" }, "Zoll"),
											(0, vue_exports.createVNode)("span", { class: "small num muted" }, (0, vue_exports.toDisplayString)(size.line), 1)
										];
									}),
									_: 2
								}, _parent, _scopeId));
								_push(`</li>`);
							});
							_push(`<!--]-->`);
						} else return [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(sizes.value, (size) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: size.inch }, [size.none ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 0,
								class: "size-tile size-tile--none",
								"aria-disabled": "true"
							}, [
								(0, vue_exports.createVNode)("span", { class: "display num size-tile__n" }, (0, vue_exports.toDisplayString)(size.inch), 1),
								(0, vue_exports.createVNode)("span", { class: "small quiet" }, "Zoll"),
								(0, vue_exports.createVNode)("span", { class: "small num quiet" }, (0, vue_exports.toDisplayString)(size.line), 1)
							])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
								key: 1,
								href: size.href,
								class: "size-tile m-press"
							}, {
								default: (0, vue_exports.withCtx)(() => [
									(0, vue_exports.createVNode)("span", { class: "display num size-tile__n" }, (0, vue_exports.toDisplayString)(size.inch), 1),
									(0, vue_exports.createVNode)("span", { class: "small muted" }, "Zoll"),
									(0, vue_exports.createVNode)("span", { class: "small num muted" }, (0, vue_exports.toDisplayString)(size.line), 1)
								]),
								_: 2
							}, 1032, ["href"]))]);
						}), 128))];
					}),
					_: 1
				}, _parent));
				else _push(`<!---->`);
				if (__props.brands.length) {
					_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([{ "home-brands--after-sizes": sizes.value.length > 0 }, "container home-brands"])}" data-v-dbcea679>`);
					if (sizes.value.length) _push(`<h2 class="h2 home-h2" data-v-dbcea679>Nach Marke</h2>`);
					else _push(`<!---->`);
					_push((0, server_renderer_exports.ssrRenderComponent)(BrandWall_default, {
						brands: __props.brands,
						vehicle: vehicle.value,
						flush: ""
					}, null, _parent));
					_push(`</div>`);
				} else _push(`<!---->`);
				_push(`</section>`);
			} else _push(`<!---->`);
			if (rendered.value.h7) {
				_push(`<section id="h7" data-section="H7" class="${(0, server_renderer_exports.ssrRenderClass)(cls("h7"))}" aria-labelledby="h7-title" data-v-dbcea679><div class="container home-komplett" data-v-dbcea679><h2 id="h7-title" class="h2 home-h2" data-v-dbcea679>Kompletträder – <br data-v-dbcea679>montiert und gewuchtet.</h2><p class="body-l home-komplett__text" data-v-dbcea679>Felge und Reifen kommen zusammen bei dir an.</p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(KomplettradWheel_default, {
					class: "home-komplett__wheel",
					wheel: __props.komplettrad.wheel ?? null
				}, null, _parent));
				if (tyre.value) _push((0, server_renderer_exports.ssrRenderComponent)(TyreLabel_default, {
					title: tyre.value.title,
					fuel: tyre.value.fuel,
					wet: tyre.value.wet,
					"noise-db": tyre.value.noiseDb,
					"noise-class": tyre.value.noiseClass,
					"snow-grip": tyre.value.snowGrip,
					"ice-grip": tyre.value.iceGrip,
					"eprel-id": tyre.value.eprelId,
					class: "home-komplett__label"
				}, null, _parent));
				else _push(`<!---->`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: komplettradHref.value,
					class: "btn btn--light btn--block",
					prefetch: ""
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Kompletträder für dein Fahrzeug anzeigen`);
						else return [(0, vue_exports.createTextVNode)("Kompletträder für dein Fahrzeug anzeigen")];
					}),
					_: 1
				}, _parent));
				_push(`</div></section>`);
			} else _push(`<!---->`);
			if (rendered.value.h8) {
				_push(`<section id="h8" data-section="H8" class="${(0, server_renderer_exports.ssrRenderClass)(cls("h8"))}" aria-labelledby="h8-title" data-v-dbcea679><div class="container" data-v-dbcea679><h2 id="h8-title" class="h2 home-h2" data-v-dbcea679>Was die Zahlen auf einer Felge bedeuten</h2><p class="body muted home-lead" data-v-dbcea679>Tippe auf einen Wert – das Foto oder die Schnittzeichnung zeigt, wo er an der Felge liegt.</p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(RimCode_default, {
					product: __props.photoWheel,
					layout: "phone"
				}, null, _parent));
				_push(`</div></section>`);
			} else _push(`<!---->`);
			if (__props.partners.enabled) {
				_push(`<section id="h9" data-section="H9" class="${(0, server_renderer_exports.ssrRenderClass)(cls("h9"))}" aria-labelledby="h9-title" data-v-dbcea679><div class="container home-partners" data-v-dbcea679><div class="home-partners__head" data-v-dbcea679><h2 id="h9-title" class="h2 home-h2" data-v-dbcea679>Montage in deiner Nähe</h2>`);
				if (__props.partners.demo) _push(`<span class="badge" data-v-dbcea679>Beispieldaten</span>`);
				else _push(`<!---->`);
				_push(`</div><form class="home-partners__form" data-v-dbcea679><div class="form-field" data-v-dbcea679><label class="form-field__label" for="plz" data-v-dbcea679>Postleitzahl</label><input id="plz"${(0, server_renderer_exports.ssrRenderAttr)("value", plz.value)} class="input num" type="text" inputmode="numeric" maxlength="5" autocomplete="postal-code" enterkeyhint="search" data-v-dbcea679><p class="form-field__error" data-v-dbcea679>`);
				if (partnerState.value === "failed") _push(`<!--[-->Die Partnersuche ist gerade nicht erreichbar.<!--]-->`);
				else _push(`<!---->`);
				_push(`</p></div><button class="btn btn--primary btn--block" type="submit"${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", !/^\d{5}$/.test(plz.value) ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", partnerState.value === "busy" ? "true" : void 0)} data-v-dbcea679>${(0, server_renderer_exports.ssrInterpolate)(/^\d{5}$/.test(plz.value) ? "Partner finden" : "Postleitzahl eingeben")}</button></form><p class="body muted" data-v-dbcea679>Gib deine Postleitzahl ein – wir zeigen dir die drei nächsten Montagepartner.</p></div></section>`);
			} else _push(`<!---->`);
			if (__props.guides.length) {
				_push(`<section id="h10" data-section="H10" class="${(0, server_renderer_exports.ssrRenderClass)(cls("h10"))}" aria-labelledby="h10-title" data-v-dbcea679><div class="container" data-v-dbcea679><h2 id="h10-title" class="h2 home-h2" data-v-dbcea679>Wissen, bevor du kaufst</h2></div>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Shelf_default, {
					bare: "",
					"hide-head": "",
					title: "Wissen, bevor du kaufst",
					width: "78vw",
					"list-label": "Ratgeber"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push(`<!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.guides, (guide) => {
								_push(`<li data-v-dbcea679${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: `/ratgeber/${guide.slug}`,
									class: "guide m-press",
									prefetch: ""
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`<span class="h4 guide__title" data-v-dbcea679${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(guide.title)}</span><span class="small quiet num" data-v-dbcea679${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(guide.minutes)} Min. Lesezeit</span>`);
										else return [(0, vue_exports.createVNode)("span", { class: "h4 guide__title" }, (0, vue_exports.toDisplayString)(guide.title), 1), (0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(guide.minutes) + " Min. Lesezeit", 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								_push(`</li>`);
							});
							_push(`<!--]-->`);
						} else return [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.guides, (guide) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: guide.slug }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
								href: `/ratgeber/${guide.slug}`,
								class: "guide m-press",
								prefetch: ""
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "h4 guide__title" }, (0, vue_exports.toDisplayString)(guide.title), 1), (0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(guide.minutes) + " Min. Lesezeit", 1)]),
								_: 2
							}, 1032, ["href"])]);
						}), 128))];
					}),
					_: 1
				}, _parent));
				_push(`</section>`);
			} else _push(`<!---->`);
			_push(`<section id="h11" data-section="H11" class="${(0, server_renderer_exports.ssrRenderClass)(cls("h11"))}" aria-labelledby="h11-title" data-v-dbcea679><div class="container" data-v-dbcea679><h2 id="h11-title" class="h2 home-h2" data-v-dbcea679>Fragen zu einer Felge? Wir schauen mit dir drauf.</h2><p class="${(0, server_renderer_exports.ssrRenderClass)([{ "home-status--open": service.value?.open }, "small home-status"])}" data-v-dbcea679>${(0, server_renderer_exports.ssrInterpolate)(statusLine.value)}</p></div><div class="home-contact" data-v-dbcea679>`);
			if (contact.value.phone) _push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
				icon: "phone",
				title: contact.value.phone,
				href: telHref.value,
				external: "",
				chevron: false
			}, null, _parent));
			else _push(`<!---->`);
			if (contact.value.whatsapp) _push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
				title: `WhatsApp: ${contact.value.whatsapp}`,
				href: waHref.value,
				external: "",
				chevron: false
			}, {
				leading: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<span class="home-contact__slot" aria-hidden="true" data-v-dbcea679${_scopeId}></span>`);
					else return [(0, vue_exports.createVNode)("span", {
						class: "home-contact__slot",
						"aria-hidden": "true"
					})];
				}),
				_: 1
			}, _parent));
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
				icon: "mail",
				title: contact.value.email,
				sub: "Nachricht schreiben",
				href: (0, vue_exports.unref)(contactHref)({
					subject: "Frage zu einer Felge",
					from: "/"
				})
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
				icon: "clock",
				title: contact.value.hours,
				static: ""
			}, null, _parent));
			_push(`</div><div class="container home-faq" data-v-dbcea679>`);
			if (faqItems.value.length) _push((0, server_renderer_exports.ssrRenderComponent)(Accordion_default, {
				items: faqItems.value,
				level: 3
			}, null, _parent));
			else _push(`<p class="body muted" data-v-dbcea679>Die häufigsten Fragen beantworten wir gerade neu.</p>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/faq",
				class: "btn btn--secondary btn--block home-faq__all",
				prefetch: ""
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Alle Fragen ansehen`);
					else return [(0, vue_exports.createTextVNode)("Alle Fragen ansehen")];
				}),
				_: 1
			}, _parent));
			_push(`</div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Startseite/Mobile.vue
var _sfc_setup = Mobile_vue_vue_type_script_setup_true_lang_default.setup;
Mobile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Startseite/Mobile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Mobile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Mobile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-dbcea679"]]);
//#endregion
export { Mobile_default as default };
