import { a as usePage, c as vue_exports, n as head_default, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { a as Icon_default, c as isIconName, r as useShared } from "./useShared-CY71KcPZ.js";
import { n as ProductTileSkeleton_default, r as Accordion_default, t as SpecCallout_default } from "./SpecCallout-CTexFu-U.js";
import { a as Picture_default, i as WheelOutline_default, o as ListRow_default, s as BottomSheet_default } from "./useShortcuts-XJHE0tId.js";
import { t as DocFacsimile_default } from "./DocFacsimile-D9bZK4Sy.js";
import { C as felgen, S as euro, t as ValueText_default, x as decimal } from "./ValueText-CkuszrcW.js";
import { n as VerdictBadge_default } from "./rimify-CVWv3bVl.js";
import { t as ProductTile_default } from "./ProductTile-CM5ArmPB.js";
import { t as Skeleton_default } from "./Skeleton-CJiktMEO.js";
import { t as TyreLabel_default } from "./TyreLabel-BXu8SZ4k.js";
import { t as MobileLayout_default } from "./MobileLayout-B3JQsM8N.js";
import { a as komplettrad_illustration_default, c as HERO_SIZES_PHONE, d as heroScene, f as rollStyle, i as rimFactsOf, l as PHONE_LAYOUT, n as TITLE, p as BrandWall_default, r as RimCode_default, t as DESCRIPTION, u as frameStyle } from "./meta-BOHDUgfV.js";
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
			return `${decimal(s.gutachten, 0)} Gutachten · ${decimal(s.variants, 0)} Fahrzeugvarianten · ${decimal(s.wheels, 0)} Felgen mit Gutachten`;
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
				text: "Aus Marke, Modell und Variante – oder aus HSN und TSN – bestimmen wir die Typgenehmigung deines Fahrzeugs. Stehen zwei Fahrzeuge hinter einem Schlüssel, fragen wir nach, statt zu raten.",
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
				text: "Du bekommst eine von vier Antworten: freigegeben, mit Auflagen, nicht freigegeben oder unbekannt. Nennt das Gutachten Auflagen, schreiben wir sie aus:",
				strokes: [
					1,
					2,
					3
				],
				stamp: true
			}
		];
		const STROKES = {
			1: "M 234 69 C 340 67.5 510 72 648 70",
			2: "M -6 70.5 C 250 68.5 700 72.5 1008 69.5",
			3: "M 634 69 C 760 71 900 67.5 1008 70"
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "story" }, _attrs))} data-v-f0bcc47f>`);
			if (facts.value) _push(`<p class="body num muted story__facts" data-v-f0bcc47f>${(0, server_renderer_exports.ssrInterpolate)(facts.value)}</p>`);
			else _push(`<!---->`);
			_push(`<ol class="story__steps" data-v-f0bcc47f><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(STEPS, (step) => {
				_push(`<li class="story__step" data-v-f0bcc47f><h3 class="h3 story__title" data-v-f0bcc47f><span class="story__n num" data-v-f0bcc47f>${(0, server_renderer_exports.ssrInterpolate)(step.n)}</span> ${(0, server_renderer_exports.ssrInterpolate)(step.title)}</h3><div class="doc doc--crop" role="img" aria-label="Beispiel eines Gutachten-Auszugs; die Zeile des gewählten Fahrzeugs ist markiert" data-v-f0bcc47f><div class="doc__head" data-v-f0bcc47f><span class="doc__title" data-v-f0bcc47f>Teilegutachten Nr. 12-3456 (Beispiel)</span><span class="doc__page" data-v-f0bcc47f>Seite 4 von 12</span></div><p class="doc__issuer" data-v-f0bcc47f>Technischer Dienst Musterstadt · Auszug aus Abschnitt 4: Verwendungsbereich</p><div class="doc__table-wrap" data-v-f0bcc47f><table class="doc__table" data-v-f0bcc47f><thead data-v-f0bcc47f><tr data-v-f0bcc47f><th class="doc__c1" data-v-f0bcc47f>Hersteller</th><th class="doc__c2" data-v-f0bcc47f>Typ</th><th class="doc__c3" data-v-f0bcc47f>Genehmigungsnr.</th><th class="doc__c4" data-v-f0bcc47f>Reifengrößen</th><th class="doc__c5" data-v-f0bcc47f>Auflagen</th></tr></thead><tbody data-v-f0bcc47f><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(rows), (row) => {
					_push(`<tr data-v-f0bcc47f><td data-v-f0bcc47f>${(0, server_renderer_exports.ssrInterpolate)(row.maker)}</td><td data-v-f0bcc47f>${(0, server_renderer_exports.ssrInterpolate)(row.type)}</td><td data-v-f0bcc47f>${(0, server_renderer_exports.ssrInterpolate)(row.approval)}</td><td data-v-f0bcc47f>${(0, server_renderer_exports.ssrInterpolate)(row.tyre)}</td><td data-v-f0bcc47f>${(0, server_renderer_exports.ssrInterpolate)(row.conditions)}</td></tr>`);
				});
				_push(`<!--]--></tbody></table><svg class="marker" viewBox="0 0 1000 112" preserveAspectRatio="none" aria-hidden="true" focusable="false" data-v-f0bcc47f><defs data-v-f0bcc47f><linearGradient${(0, server_renderer_exports.ssrRenderAttr)("id", `marker-ink-${step.n}`)} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0" data-v-f0bcc47f><stop offset="0%" class="marker__stop marker__stop--a" data-v-f0bcc47f></stop><stop offset="45%" class="marker__stop marker__stop--b" data-v-f0bcc47f></stop><stop offset="100%" class="marker__stop marker__stop--c" data-v-f0bcc47f></stop></linearGradient></defs><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(step.strokes, (n) => {
					_push(`<!--[--><path${(0, server_renderer_exports.ssrRenderAttr)("d", STROKES[n])} class="marker__stroke"${(0, server_renderer_exports.ssrRenderAttr)("stroke", `url(#marker-ink-${step.n})`)} data-v-f0bcc47f></path><path${(0, server_renderer_exports.ssrRenderAttr)("d", STROKES[n])} class="marker__stroke marker__stroke--echo"${(0, server_renderer_exports.ssrRenderAttr)("stroke", `url(#marker-ink-${step.n})`)} transform="translate(0 1)" data-v-f0bcc47f></path><!--]-->`);
				});
				_push(`<!--]--></svg>`);
				if (step.stamp) {
					_push(`<span class="doc__stamp" data-v-f0bcc47f>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, {
						status: "PERMITTED",
						size: "lg"
					}, null, _parent));
					_push(`</span>`);
				} else _push(`<!---->`);
				_push(`</div><p class="micro quiet doc__caption" data-v-f0bcc47f>Gutachten-Auszug (Beispiel)</p></div><p class="body muted story__text" data-v-f0bcc47f>${(0, server_renderer_exports.ssrInterpolate)(step.text)}</p>`);
				if (step.stamp) {
					_push(`<div class="story__example" data-v-f0bcc47f>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, { status: "CONDITIONAL" }, null, _parent));
					_push(`<ul class="story__conditions small" data-v-f0bcc47f><li data-v-f0bcc47f>Die Verwendung ist nur mit Reifen der Größe 225/40 R18 zulässig.</li><li data-v-f0bcc47f>Die Änderung ist in die Fahrzeugpapiere einzutragen.</li></ul></div>`);
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
var GutachtenStory_default = /*#__PURE__*/ _plugin_vue_export_helper_default(GutachtenStory_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f0bcc47f"]]);
//#endregion
//#region resources/js/Components/Mobile/Home/HeroFrame.vue?vue&type=script&setup=true&lang.ts
var CAPTION = "Abbildung zeigt das Design; Werte der gezeigten Ausführung.";
var SYMBOLIC = "Symbolbild – Werte einer Beispielkonfiguration";
var DEMO = "Demodaten – Beispielsortiment; Preise und Bestände sind Beispielwerte.";
var HeroFrame_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "HeroFrame",
	__ssrInlineRender: true,
	props: { product: {} },
	setup(__props) {
		/**
		* The hero frame on a phone: the same photograph and the same anchors as the desktop stage
		* (`calloutSlots.ts`, docs/phase0/ACCURACY.md §4) — the product's shadowless `bare` cut-out on one
		* CSS contact shadow in a pool of studio light, and two leaders: the Lochkreis, a dashed circle
		* through the bolt-hole centres, and the KBA number at the stamp (only when the photographed stamp
		* is this configuration's number). Under the frame: the spec line, the caption that is the link to
		* the product, the line saying what the picture shows, and the Demodaten line.
		*
		* With no photograph of the product the frame draws the outline and names no product: no brand,
		* no model, no price, no link, no leader — the spec line and one sentence saying what the drawing
		* is. The bundled stand-in photograph is retired.
		*
		* On a tall phone the frame is in the first viewport and its picture is the LCP, so it loads
		* eagerly (app.blade.php preloads it with the same `sizes`). Once, on load, the wheel rolls in and
		* the leaders draw after it; the resting frame is the default, so without JavaScript and under
		* reduced motion everything simply stands there.
		*/
		const props = __props;
		const page = usePage();
		const scene = (0, vue_exports.computed)(() => heroScene(props.product, PHONE_LAYOUT));
		const failed = (0, vue_exports.ref)(false);
		const photo = (0, vue_exports.computed)(() => failed.value ? null : scene.value.picture);
		const callouts = (0, vue_exports.computed)(() => photo.value === null ? [] : scene.value.callouts);
		const kba = (0, vue_exports.computed)(() => callouts.value.find((c) => c.key === "kba") ?? null);
		const named = (0, vue_exports.computed)(() => !props.product.symbolic && photo.value !== null);
		const href = (0, vue_exports.computed)(() => `/felgen/${props.product.slug}`);
		const alt = (0, vue_exports.computed)(() => `${props.product.brand} ${props.product.name} in ${props.product.finish}, Ansicht von vorn`);
		const perWheel = (0, vue_exports.computed)(() => euro(Math.round(props.product.fromPriceCents / 4)));
		const frameVars = (0, vue_exports.computed)(() => ({
			...frameStyle(PHONE_LAYOUT),
			"--callout-delay": scene.value.roll === null ? "0ms" : "var(--d-roll)"
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
				class: "hero-mobile"
			}, _attrs))} data-v-9be8d594>`);
			(0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)(named.value ? (0, vue_exports.unref)(link_default) : "div"), {
				href: named.value ? href.value : void 0,
				class: "frame hero-frame",
				style: frameVars.value,
				prefetch: named.value ? true : void 0
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<span class="hero-studio" aria-hidden="true" data-v-9be8d594${_scopeId}></span>`);
						if (photo.value) {
							_push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([{ "hero-frame__roll--rolling": scene.value.roll !== null }, "hero-frame__roll"])}" style="${(0, server_renderer_exports.ssrRenderStyle)(pictureStyle.value)}" data-v-9be8d594${_scopeId}>`);
							if (scene.value.shadow) _push(`<span class="hero-contact" aria-hidden="true" data-v-9be8d594${_scopeId}></span>`);
							else _push(`<!---->`);
							_push(`<span class="hero-frame__spin" data-v-9be8d594${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
								image: photo.value,
								alt: alt.value,
								sizes: (0, vue_exports.unref)(HERO_SIZES_PHONE),
								eager: ""
							}, null, _parent, _scopeId));
							_push(`</span></span>`);
						} else {
							_push(`<span class="hero-frame__outline" aria-hidden="true" data-v-9be8d594${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(WheelOutline_default, {
								bolts: __props.product.config.boltHoles,
								size: "82%"
							}, null, _parent, _scopeId));
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
								ratio: (0, vue_exports.unref)(PHONE_LAYOUT).ratio,
								weight: (0, vue_exports.unref)(PHONE_LAYOUT).weight
							}, null, _parent, _scopeId));
						});
						_push(`<!--]-->`);
					} else return [
						(0, vue_exports.createVNode)("span", {
							class: "hero-studio",
							"aria-hidden": "true"
						}),
						photo.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
							key: 0,
							class: ["hero-frame__roll", { "hero-frame__roll--rolling": scene.value.roll !== null }],
							style: pictureStyle.value,
							onErrorCapture: ($event) => failed.value = true
						}, [scene.value.shadow ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
							key: 0,
							class: "hero-contact",
							"aria-hidden": "true"
						})) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)("span", { class: "hero-frame__spin" }, [(0, vue_exports.createVNode)(Picture_default, {
							image: photo.value,
							alt: alt.value,
							sizes: (0, vue_exports.unref)(HERO_SIZES_PHONE),
							eager: ""
						}, null, 8, [
							"image",
							"alt",
							"sizes"
						])])], 46, ["onErrorCapture"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
							key: 1,
							class: "hero-frame__outline",
							"aria-hidden": "true"
						}, [(0, vue_exports.createVNode)(WheelOutline_default, {
							bolts: __props.product.config.boltHoles,
							size: "82%"
						}, null, 8, ["bolts"])])),
						((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(callouts.value, (c) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(SpecCallout_default, {
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
								ratio: (0, vue_exports.unref)(PHONE_LAYOUT).ratio,
								weight: (0, vue_exports.unref)(PHONE_LAYOUT).weight
							}, null, 8, [
								"data-callout",
								"label",
								"value",
								"note",
								"side",
								"x",
								"y",
								"tx",
								"ty",
								"elbow",
								"ring",
								"ratio",
								"weight"
							]);
						}), 128))
					];
				}),
				_: 1
			}), _parent);
			_push(`<p class="small num muted hero-mobile__spec" translate="no" data-v-9be8d594>${(0, server_renderer_exports.ssrInterpolate)(__props.product.facts.specLine)}`);
			if (kba.value) _push(`<span class="visually-hidden" data-v-9be8d594> · ${(0, server_renderer_exports.ssrInterpolate)(kba.value.label)} ${(0, server_renderer_exports.ssrInterpolate)(kba.value.value)}</span>`);
			else _push(`<!---->`);
			_push(`</p>`);
			if (named.value) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: href.value,
				class: "hero-mobile__caption",
				prefetch: ""
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<span class="small hero-mobile__name" translate="no" data-v-9be8d594${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.product.brand)} ${(0, server_renderer_exports.ssrInterpolate)(__props.product.name)} · ${(0, server_renderer_exports.ssrInterpolate)(__props.product.finish)}</span><span class="small num muted" data-v-9be8d594${_scopeId}>ab `);
						_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, {
							text: perWheel.value,
							whole: ""
						}, null, _parent, _scopeId));
						_push(` · pro Felge</span>`);
					} else return [(0, vue_exports.createVNode)("span", {
						class: "small hero-mobile__name",
						translate: "no"
					}, (0, vue_exports.toDisplayString)(__props.product.brand) + " " + (0, vue_exports.toDisplayString)(__props.product.name) + " · " + (0, vue_exports.toDisplayString)(__props.product.finish), 1), (0, vue_exports.createVNode)("span", { class: "small num muted" }, [
						(0, vue_exports.createTextVNode)("ab "),
						(0, vue_exports.createVNode)(ValueText_default, {
							text: perWheel.value,
							whole: ""
						}, null, 8, ["text"]),
						(0, vue_exports.createTextVNode)(" · pro Felge")
					])];
				}),
				_: 1
			}, _parent));
			else _push(`<!---->`);
			if (photo.value) _push(`<p class="micro quiet hero-mobile__shown" data-v-9be8d594>${(0, server_renderer_exports.ssrInterpolate)(CAPTION)}</p>`);
			else _push(`<p class="micro quiet hero-mobile__symbolic" data-v-9be8d594>${(0, server_renderer_exports.ssrInterpolate)(SYMBOLIC)}</p>`);
			if ((0, vue_exports.unref)(page).props.demo) _push(`<p class="micro quiet demo-note" data-v-9be8d594>${(0, server_renderer_exports.ssrInterpolate)(DEMO)}</p>`);
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
var HeroFrame_default = /*#__PURE__*/ _plugin_vue_export_helper_default(HeroFrame_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-9be8d594"]]);
//#endregion
//#region resources/js/Components/Mobile/Home/KomplettradWheel.vue?vue&type=script&setup=true&lang.ts
var KomplettradWheel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "KomplettradWheel",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The wheel in the dark band (H7, signature moment 3) on a phone: a 240 px illustration of a
		* complete wheel, centred and labelled "Illustration", that turns with the scroll — a scroll-driven
		* animation where the browser has one, and simply a still wheel everywhere else. There is no scroll
		* listener, ever. Under reduced motion it stands at 0°. The picture is square and centred, so the
		* turn never changes the layout box.
		*
		* The illustration is generated, never photographed (docs/phase0/ACCURACY.md §3.1): the parametric
		* rim with a parametric tyre, rendered by scripts/3d/render-komplettrad.mjs — no car, no brake, no
		* brand, no lettering, and no size claimed. The alt text says what the picture is.
		*/
		const failed = (0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<figure${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "komplett-figure" }, _attrs))} data-v-90f6c7db><div class="komplett-wheel" data-v-90f6c7db>`);
			if (!failed.value) {
				_push(`<span class="komplett-wheel__turn" data-v-90f6c7db>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
					image: (0, vue_exports.unref)(komplettrad_illustration_default),
					alt: "Illustration eines Komplettrads aus Felge und Reifen, Ansicht von vorn",
					sizes: "240px"
				}, null, _parent));
				_push(`</span>`);
			} else {
				_push(`<span class="komplett-wheel__fallback" aria-hidden="true" data-v-90f6c7db>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(WheelOutline_default, { size: "60%" }, null, _parent));
				_push(`</span>`);
			}
			_push(`</div><figcaption class="micro quiet komplett-figure__label" data-v-90f6c7db>Illustration</figcaption></figure>`);
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
var KomplettradWheel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(KomplettradWheel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-90f6c7db"]]);
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
	(0, vue_exports.watch)(route, () => {
		countSlot.cancel();
		count.value = { status: "idle" };
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
				vehicle: data.vehicle
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
/** Four digits; pasted text may carry spaces. */
function cleanHsn(raw) {
	return raw.replace(/\s+/g, "").toUpperCase().slice(0, 4);
}
/** Three characters, capitals; the first three of field 2.2 when more were pasted. */
function cleanTsn(raw) {
	return raw.replace(/\s+/g, "").toUpperCase().slice(0, 3);
}
//#endregion
//#region resources/js/Components/Mobile/Home/VehiclePanel.vue?vue&type=script&setup=true&lang.ts
var VehiclePanel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "VehiclePanel",
	__ssrInlineRender: true,
	props: {
		makes: {},
		total: { default: null },
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
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const contact = (0, vue_exports.computed)(() => shared.value.contact);
		const lookup = (0, vue_exports.computed)(() => page.props.lookup ?? null);
		const reach = (0, vue_exports.computed)(() => {
			const { phone, phoneIntl, email } = contact.value;
			return phone ? {
				href: `tel:${(phoneIntl ?? phone).replace(/\s/g, "")}`,
				label: `Anrufen: ${phone}`,
				sentence: `ruf uns an: ${phone}`
			} : {
				href: `mailto:${email}`,
				label: `Schreib uns: ${email}`,
				sentence: `schreib uns: ${email}`
			};
		});
		const picker = useVehiclePicker();
		const uid = (0, vue_exports.useId)();
		const scanLoader = (/* @__PURE__ */ Object.assign({ "../../Home/DocumentScan.vue": () => import("./DocumentScan-DFExdDbw.js").then((n) => n.n) }))["../../Home/DocumentScan.vue"];
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
			const power = v.powerPs === null ? null : `${decimal(Math.round(v.powerPs * .7355), 0)} kW`;
			return `${[
				v.variant,
				power,
				v.buildWindow
			].filter((p) => p !== null && p !== "").join(" · ")}${v.needsReview ? " (unvollständige Daten)" : ""}`;
		}
		const count = (0, vue_exports.computed)(() => picker.count.value);
		const zero = (0, vue_exports.computed)(() => count.value.status === "ready" && count.value.count === 0);
		const canSubmit = (0, vue_exports.computed)(() => {
			if (zero.value) return false;
			if (picker.chosenId.value !== null) return true;
			return picker.route.value === "keys" && picker.keysComplete.value && count.value.status === "failed";
		});
		const buttonLabel = (0, vue_exports.computed)(() => {
			if (zero.value) return "Keine Felgen für dieses Fahrzeug";
			if (count.value.status === "ready") return `${decimal(count.value.count, 0)} passende Felgen anzeigen`;
			return canSubmit.value ? "Passende Felgen anzeigen" : "Fahrzeug wählen";
		});
		const submitting = (0, vue_exports.ref)(false);
		const notifyEmail = (0, vue_exports.ref)("");
		const notifyState = (0, vue_exports.ref)("idle");
		const notifyError = (0, vue_exports.ref)("");
		const totalLabel = (0, vue_exports.computed)(() => props.total === null ? null : decimal(props.total, 0));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			if (vehicle.value) {
				_push(`<div class="vpanel vpanel--vehicle" data-v-f6b67715><span class="label" data-v-f6b67715>Dein Fahrzeug</span><p class="h3" data-v-f6b67715>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</p><p class="small num muted" data-v-f6b67715>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.keyNumbers)} · ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.buildWindow)}</p>`);
				if (totalLabel.value !== null) _push(`<p class="small num vpanel__count" data-v-f6b67715><strong data-v-f6b67715>${(0, server_renderer_exports.ssrInterpolate)(totalLabel.value)}</strong> Felgen mit Gutachten für ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</p>`);
				else _push(`<!---->`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen",
					class: "btn btn--primary btn--lg btn--block vpanel__go",
					"data-primary": "",
					prefetch: ""
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(totalLabel.value !== null ? `${totalLabel.value} passende Felgen anzeigen` : "Passende Felgen anzeigen")}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(totalLabel.value !== null ? `${totalLabel.value} passende Felgen anzeigen` : "Passende Felgen anzeigen"), 1)];
					}),
					_: 1
				}, _parent));
				_push(`<div class="vpanel__links" data-v-f6b67715>`);
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
				_push(`<button class="link" type="button" data-v-f6b67715>Fahrzeug entfernen</button></div></div>`);
			} else {
				_push(`<div class="vpanel" data-v-f6b67715><button class="btn btn--secondary btn--block m-press" type="button" data-v-f6b67715>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "camera",
					size: 20
				}, null, _parent));
				_push(` Fahrzeugschein fotografieren </button><input class="visually-hidden" type="file" accept="image/*" capture="environment" tabindex="-1" aria-hidden="true" data-v-f6b67715><p class="small quiet vpanel__scan-note" data-v-f6b67715>Die Erkennung läuft auf deinem Gerät. Das Foto wird nicht hochgeladen.</p>`);
				if (scanUnavailable.value) _push(`<p class="notice vpanel__notice" role="status" data-v-f6b67715> Wir konnten HSN und TSN nicht lesen. Trag sie bitte von Hand ein. </p>`);
				else _push(`<!---->`);
				_push(`<div class="tabs__list" role="tablist" aria-label="Fahrzeug wählen" data-v-f6b67715><button${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-tab-guided`)} class="tabs__trigger" type="button" role="tab"${(0, server_renderer_exports.ssrRenderAttr)("aria-selected", (0, vue_exports.unref)(picker).route.value === "guided")}${(0, server_renderer_exports.ssrRenderAttr)("aria-controls", `${(0, vue_exports.unref)(uid)}-panel-guided`)}${(0, server_renderer_exports.ssrRenderAttr)("data-state", (0, vue_exports.unref)(picker).route.value === "guided" ? "active" : "inactive")} data-v-f6b67715> Marke &amp; Modell </button><button${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-tab-keys`)} class="tabs__trigger" type="button" role="tab"${(0, server_renderer_exports.ssrRenderAttr)("aria-selected", (0, vue_exports.unref)(picker).route.value === "keys")}${(0, server_renderer_exports.ssrRenderAttr)("aria-controls", `${(0, vue_exports.unref)(uid)}-panel-keys`)}${(0, server_renderer_exports.ssrRenderAttr)("data-state", (0, vue_exports.unref)(picker).route.value === "keys" ? "active" : "inactive")} data-v-f6b67715> HSN/TSN </button></div><div${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-panel-guided`)} class="vpanel__fields" role="tabpanel"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `${(0, vue_exports.unref)(uid)}-tab-guided`)} style="${(0, server_renderer_exports.ssrRenderStyle)((0, vue_exports.unref)(picker).route.value === "guided" ? null : { display: "none" })}" data-v-f6b67715><div class="form-field" data-v-f6b67715><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(uid)}-marke`)} data-v-f6b67715>Marke</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-marke`)} class="input" autocomplete="off" data-v-f6b67715><option value="" data-v-f6b67715${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(picker).make.value) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(picker).make.value, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(picker).make.value, "")) ? " selected" : ""}>z. B. BMW</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.makes, (m) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", m.make)} data-v-f6b67715${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(picker).make.value) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(picker).make.value, m.make) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(picker).make.value, m.make)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(m.make)}</option>`);
				});
				_push(`<!--]--></select></div><div class="form-field" data-v-f6b67715><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(uid)}-modell`)} data-v-f6b67715>Modell</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-modell`)} class="input" autocomplete="off"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(picker).make.value === "" || (0, vue_exports.unref)(picker).modelsLoading.value || (0, vue_exports.unref)(picker).modelsFailed.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(picker).modelsLoading.value ? "true" : void 0)} data-v-f6b67715><option value="" data-v-f6b67715${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(picker).model.value) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(picker).model.value, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(picker).model.value, "")) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(picker).modelsLoading.value ? "Wird geladen …" : "z. B. 3er Coupé")}</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(picker).models.value, (m) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", m.model)} data-v-f6b67715${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(picker).model.value) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(picker).model.value, m.model) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(picker).model.value, m.model)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(m.model)}</option>`);
				});
				_push(`<!--]--></select>`);
				if ((0, vue_exports.unref)(picker).modelsFailed.value) {
					_push(`<p class="form-field__error" data-v-f6b67715> Die Modelle lassen sich gerade nicht laden. `);
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
				_push(`</div><div class="form-field" data-v-f6b67715><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(uid)}-fahrzeug`)} data-v-f6b67715>Fahrzeug</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-fahrzeug`)} class="input" autocomplete="off"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(picker).model.value === "" || (0, vue_exports.unref)(picker).variantsLoading.value || (0, vue_exports.unref)(picker).variantsFailed.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(picker).variantsLoading.value ? "true" : void 0)} data-v-f6b67715><option${(0, server_renderer_exports.ssrRenderAttr)("value", null)} data-v-f6b67715${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(picker).variantId.value) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(picker).variantId.value, null) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(picker).variantId.value, null)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(picker).variantsLoading.value ? "Wird geladen …" : "Variante, Baujahr, kW")}</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(picker).variants.value, (v) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", v.id)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(v.needsReview) ? " disabled" : ""} data-v-f6b67715${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(picker).variantId.value) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(picker).variantId.value, v.id) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(picker).variantId.value, v.id)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(variantLabel(v))}</option>`);
				});
				_push(`<!--]--></select>`);
				if ((0, vue_exports.unref)(picker).variantsFailed.value) _push(`<p class="form-field__error" data-v-f6b67715>Die Varianten lassen sich gerade nicht laden.</p>`);
				else _push(`<!---->`);
				_push(`</div></div><div${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-panel-keys`)} class="vpanel__fields" role="tabpanel"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `${(0, vue_exports.unref)(uid)}-tab-keys`)} style="${(0, server_renderer_exports.ssrRenderStyle)((0, vue_exports.unref)(picker).route.value === "keys" ? null : { display: "none" })}" data-v-f6b67715><div class="vpanel__keys" data-v-f6b67715><div class="form-field" data-v-f6b67715><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(uid)}-hsn`)} data-v-f6b67715>HSN (Feld 2.1)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-hsn`)} class="input input--code num" type="text" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("maxlength", (0, vue_exports.unref)(4))} autocomplete="off" enterkeyhint="next"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(picker).hsn.value)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", hsnError.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${(0, vue_exports.unref)(uid)}-keys-error`)} data-v-f6b67715></div><div class="form-field" data-v-f6b67715><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(uid)}-tsn`)} data-v-f6b67715>TSN (Feld 2.2)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-tsn`)} class="input input--code" type="text" autocapitalize="characters"${(0, server_renderer_exports.ssrRenderAttr)("maxlength", (0, vue_exports.unref)(3))} autocomplete="off" enterkeyhint="go"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(picker).tsn.value)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", tsnError.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${(0, vue_exports.unref)(uid)}-keys-error`)} data-v-f6b67715></div></div><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-keys-error`)} class="form-field__error" data-v-f6b67715>${(0, server_renderer_exports.ssrInterpolate)(hsnError.value || tsnError.value)}</p><button class="link small vpanel__help" type="button" data-v-f6b67715>Wo finde ich HSN und TSN?</button>`);
				if (count.value.status === "ambiguous") {
					_push(`<div class="vpanel__chooser" data-v-f6b67715><p class="h4" data-v-f6b67715>${(0, server_renderer_exports.ssrInterpolate)(count.value.rows.length)} Fahrzeuge passen zu ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(picker).hsn.value)}/${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(picker).tsn.value)} – welches ist deins?</p><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(count.value.rows, (row) => {
						_push(`<label class="check" data-v-f6b67715><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(candidate.value, row.id)) ? " checked" : ""} type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", `${(0, vue_exports.unref)(uid)}-kandidat`)}${(0, server_renderer_exports.ssrRenderAttr)("value", row.id)} data-v-f6b67715><span data-v-f6b67715>${(0, server_renderer_exports.ssrInterpolate)(row.label)}</span></label>`);
					});
					_push(`<!--]--><button class="btn btn--secondary btn--block" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(candidate.value === null) ? " disabled" : ""} data-v-f6b67715> Dieses Fahrzeug wählen </button><button class="link small" type="button" data-v-f6b67715>Andere Nummern eingeben</button></div>`);
				} else _push(`<!---->`);
				if (count.value.status === "not_found" || lookup.value?.status === "not_found") {
					_push(`<div class="notice vpanel__notice" data-v-f6b67715>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "warning",
						size: 20
					}, null, _parent));
					_push(`<div class="vpanel__miss" data-v-f6b67715><p data-v-f6b67715>Zu ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(picker).hsn.value || lookup.value?.hsn)}/${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(picker).tsn.value || lookup.value?.tsn)} haben wir kein Fahrzeug gefunden.</p><button class="link" type="button" data-v-f6b67715>Nochmal prüfen</button><button class="link" type="button" data-v-f6b67715>Über Marke &amp; Modell wählen</button><a class="link num"${(0, server_renderer_exports.ssrRenderAttr)("href", reach.value.href)} data-v-f6b67715>${(0, server_renderer_exports.ssrInterpolate)(reach.value.label)}</a></div></div>`);
				} else _push(`<!---->`);
				_push(`</div><div class="vpanel__count" aria-live="polite" data-v-f6b67715>`);
				if (count.value.status === "loading") _push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
					width: "60%",
					height: "var(--lh-small)"
				}, null, _parent));
				else if (count.value.status === "failed") _push(`<p class="small muted" data-v-f6b67715>Die Anzahl lässt sich gerade nicht laden.</p>`);
				else if (count.value.status === "ready" && count.value.count > 0) _push(`<p class="small num" data-v-f6b67715><strong data-v-f6b67715>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(count.value.count, 0))}</strong> Felgen mit Gutachten für ${(0, server_renderer_exports.ssrInterpolate)(count.value.vehicle.label)}</p>`);
				else if (zero.value) {
					_push(`<div class="notice vpanel__zero" data-v-f6b67715><div data-v-f6b67715><p data-v-f6b67715>Für dieses Fahrzeug haben wir noch keine Felge mit Gutachten.</p>`);
					if ((0, vue_exports.unref)(shared).notifyByMail !== true) _push(`<p class="small muted" data-v-f6b67715> Schreib uns gern eine E-Mail an <a class="link"${(0, server_renderer_exports.ssrRenderAttr)("href", `mailto:${contact.value.email}`)} data-v-f6b67715>${(0, server_renderer_exports.ssrInterpolate)(contact.value.email)}</a>. </p>`);
					else if (notifyState.value === "done") _push(`<p class="small muted" data-v-f6b67715>Danke. Bestätige bitte den Link in der E-Mail, die wir dir gerade geschickt haben.</p>`);
					else {
						_push(`<form class="vpanel__notify" data-v-f6b67715><p class="small muted" data-v-f6b67715>Sag uns deine E-Mail-Adresse – wir melden uns, sobald ein Gutachten dein Fahrzeug nennt.</p><div class="form-field" data-v-f6b67715><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(uid)}-mail`)} data-v-f6b67715>E-Mail-Adresse</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-mail`)}${(0, server_renderer_exports.ssrRenderAttr)("value", notifyEmail.value)} class="input" type="email" autocomplete="email" inputmode="email" enterkeyhint="send" required data-v-f6b67715><p class="form-field__error" data-v-f6b67715>`);
						if (notifyState.value === "failed") _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(notifyError.value || `Das hat nicht geklappt. Versuch es bitte noch einmal oder ${reach.value.sentence}.`)}<!--]-->`);
						else _push(`<!---->`);
						_push(`</p></div><button class="btn btn--secondary btn--block" type="submit"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", notifyState.value === "busy" ? "true" : void 0)} data-v-f6b67715>Bescheid geben</button><p class="micro quiet" data-v-f6b67715>Du bekommst zuerst eine Bestätigungsmail. Abmelden geht jederzeit mit einem Klick.</p></form>`);
					}
					_push(`</div></div>`);
				} else _push(`<!---->`);
				_push(`</div><button class="btn btn--primary btn--lg btn--block vpanel__go" type="button" data-primary${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!canSubmit.value || submitting.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", submitting.value ? "true" : void 0)} data-v-f6b67715>${(0, server_renderer_exports.ssrInterpolate)(buttonLabel.value)}</button>`);
				if (__props.garage.length) {
					_push(`<div class="vpanel__garage" data-v-f6b67715><span class="label" data-v-f6b67715>Zuletzt gewählt:</span><div class="chip-row" data-v-f6b67715><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.garage, (entry) => {
						_push(`<button class="chip m-press" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", entry.label)} data-v-f6b67715>${(0, server_renderer_exports.ssrInterpolate)(entry.short)}</button>`);
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
						_push(`<div class="chip-row vpanel__doc-toggle" role="group" aria-label="Ausgabe des Fahrzeugscheins" data-v-f6b67715${_scopeId}><button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", doc.value === "neu")} data-v-f6b67715${_scopeId}>Neue Zulassungsbescheinigung</button><button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", doc.value === "alt")} data-v-f6b67715${_scopeId}>Alter Fahrzeugschein</button></div><div class="vpanel__doc" data-v-f6b67715${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(DocFacsimile_default, {
							variant: doc.value,
							width: 350
						}, null, _parent, _scopeId));
						_push(`</div><p class="small muted" data-v-f6b67715${_scopeId}>Die HSN steht in Feld 2.1, die TSN sind die ersten drei Zeichen von Feld 2.2 deiner Zulassungsbescheinigung Teil I.</p>`);
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
							onResult: onScanResult,
							onFailed: onScanFailed,
							onClose: ($event) => scanOpen.value = false
						}, null), _parent, _scopeId);
						else _push(`<!---->`);
					} else return [scanFile.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.resolveDynamicComponent)((0, vue_exports.unref)(DocumentScan)), {
						key: 0,
						file: scanFile.value,
						onResult: onScanResult,
						onFailed: onScanFailed,
						onClose: ($event) => scanOpen.value = false
					}, null, 40, ["file", "onClose"])) : (0, vue_exports.createCommentVNode)("", true)];
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
var VehiclePanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(VehiclePanel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f6b67715"]]);
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
		selector: {},
		fitmentCount: {},
		promises: {},
		popular: {},
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
		/** The phone sentence from home.md, used while the CMS block only echoes the desktop one. */
		const title = (0, vue_exports.computed)(() => vehicle.value ? `Felgen, die an deinen ${vehicle.value.short} dürfen.` : props.hero.title);
		const subline = (0, vue_exports.computed)(() => {
			const mobile = props.hero.sublineMobile;
			return mobile && mobile !== props.hero.subline ? mobile : PHONE_SUBLINE;
		});
		/** F1 for the shared vehicle, in the first paint; the listing's total is the same figure's fallback. */
		const vehicleCount = (0, vue_exports.computed)(() => props.fitmentCount?.count ?? props.popular.total);
		/** `1 passende Felge` · `9 passende Felgen` — `felgen()` with the adjective between the number and the noun. */
		const passende = (count) => felgen(count).replace(" ", ` passende `);
		const promiseIcon = (name) => isIconName(name) ? name : "check";
		const popularTitle = (0, vue_exports.computed)(() => vehicle.value ? `Passend für deinen ${vehicle.value.short}` : props.popular.title ?? "Felgen mit den meisten Freigaben");
		const popularLoading = (0, vue_exports.ref)(false);
		const popularFailed = (0, vue_exports.ref)(false);
		const listingLabel = (0, vue_exports.computed)(() => vehicle.value && vehicleCount.value !== null ? `${passende(vehicleCount.value)} anzeigen` : "Alle Felgen ansehen");
		const sizes = (0, vue_exports.computed)(() => props.sizes.filter((s) => s.count > 0).map((s) => {
			const fitting = vehicle.value ? s.fitting : null;
			return {
				...s,
				none: fitting === 0,
				line: fitting === null ? felgen(s.count) : passende(fitting)
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
					on: true
				},
				{
					id: "h6",
					on: sizes.value.length > 0 || props.brands.length > 0
				},
				{
					id: "h7",
					on: tyre.value !== null,
					dark: true
				},
				{
					id: "h8",
					on: rimFactsOf(props.hero.product) !== null
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
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: (0, vue_exports.unref)(TITLE) }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<meta name="description"${(0, server_renderer_exports.ssrRenderAttr)("content", (0, vue_exports.unref)(DESCRIPTION))} head-key="description" data-v-5bc8ab1e${_scopeId}>`);
					else return [(0, vue_exports.createVNode)("meta", {
						name: "description",
						content: (0, vue_exports.unref)(DESCRIPTION),
						"head-key": "description"
					}, null, 8, ["content"])];
				}),
				_: 1
			}, _parent));
			_push(`<section id="h2" data-section="H2" class="home-hero band" aria-labelledby="h2-title" data-v-5bc8ab1e><div class="container" data-v-5bc8ab1e><h1 id="h2-title" class="h1 home-hero__title" data-v-5bc8ab1e>${(0, server_renderer_exports.ssrInterpolate)(title.value)}</h1><p class="body-l muted home-hero__sub" data-v-5bc8ab1e>${(0, server_renderer_exports.ssrInterpolate)(subline.value)}</p><div class="home-hero__panel" data-v-5bc8ab1e>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(VehiclePanel_default, {
				makes: __props.selector.makes,
				total: vehicleCount.value,
				garage: garage.value
			}, null, _parent));
			_push(`</div>`);
			if (__props.hero.product) {
				_push(`<div class="home-hero__frame" data-v-5bc8ab1e>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(HeroFrame_default, { product: __props.hero.product }, null, _parent));
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`</div></section>`);
			if (__props.promises.length) {
				_push(`<section id="h3" data-section="H3" class="home-promises" aria-label="Was RIMIFY zusagt" data-v-5bc8ab1e><ul class="container home-promises__list" data-v-5bc8ab1e><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.promises, (item) => {
					_push(`<li class="home-promises__item" data-v-5bc8ab1e>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: promiseIcon(item.icon),
						size: 20
					}, null, _parent));
					_push(`<span class="home-promises__title" data-v-5bc8ab1e>${(0, server_renderer_exports.ssrInterpolate)(item.title)}</span><span class="small muted" data-v-5bc8ab1e>${(0, server_renderer_exports.ssrInterpolate)(item.text)}</span></li>`);
				});
				_push(`<!--]--></ul></section>`);
			} else _push(`<!---->`);
			_push(`<section id="h4" data-section="H4" class="${(0, server_renderer_exports.ssrRenderClass)(cls("h4"))}" aria-labelledby="h4-title" data-v-5bc8ab1e><div class="container" data-v-5bc8ab1e><h2 id="h4-title" class="h2 home-h2" data-v-5bc8ab1e>Wir lesen das Gutachten. Du bekommst die Antwort.</h2>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(GutachtenStory_default, { stats: __props.hero.stats }, null, _parent));
			_push(`</div></section><section id="h5" data-section="H5" class="${(0, server_renderer_exports.ssrRenderClass)(cls("h5"))}" aria-labelledby="h5-title" data-v-5bc8ab1e><div class="container" data-v-5bc8ab1e><h2 id="h5-title" class="h2 home-h2" data-v-5bc8ab1e>${(0, server_renderer_exports.ssrInterpolate)(popularTitle.value)}</h2>`);
			if (__props.popular.tabs.length) {
				_push(`<div class="tabs__list home-tabs" role="tablist" aria-label="Auswahl" data-v-5bc8ab1e><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.popular.tabs, (tab) => {
					_push(`<button class="tabs__trigger" type="button" role="tab"${(0, server_renderer_exports.ssrRenderAttr)("aria-selected", tab.key === __props.popular.active)}${(0, server_renderer_exports.ssrRenderAttr)("data-state", tab.key === __props.popular.active ? "active" : "inactive")} data-v-5bc8ab1e>${(0, server_renderer_exports.ssrInterpolate)(tab.label)}</button>`);
				});
				_push(`<!--]--></div>`);
			} else _push(`<!---->`);
			_push(`</div><div${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", popularLoading.value ? "true" : void 0)} data-v-5bc8ab1e>`);
			if (popularLoading.value && __props.popular.cards.length === 0) _push((0, server_renderer_exports.ssrRenderComponent)(Shelf_default, {
				bare: "",
				"hide-head": "",
				title: popularTitle.value,
				width: "62vw",
				"list-label": "Felgen werden geladen"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(4, (n) => {
							_push(`<li data-v-5bc8ab1e${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(ProductTileSkeleton_default, null, null, _parent, _scopeId));
							_push(`</li>`);
						});
						_push(`<!--]-->`);
					} else return [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(4, (n) => {
						return (0, vue_exports.createVNode)("li", { key: n }, [(0, vue_exports.createVNode)(ProductTileSkeleton_default)]);
					}), 64))];
				}),
				_: 1
			}, _parent));
			else if (__props.popular.cards.length) _push((0, server_renderer_exports.ssrRenderComponent)(Shelf_default, {
				bare: "",
				"hide-head": "",
				title: popularTitle.value,
				width: "62vw",
				"list-label": "Felgen"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.popular.cards, (card, i) => {
							_push(`<li data-v-5bc8ab1e${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(ProductTile_default, {
								card,
								vehicle: vehicle.value,
								eager: i < 2,
								compare: ""
							}, null, _parent, _scopeId));
							_push(`</li>`);
						});
						_push(`<!--]-->`);
					} else return [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.popular.cards, (card, i) => {
						return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: `${card.modelId}-${card.finishId}` }, [(0, vue_exports.createVNode)(ProductTile_default, {
							card,
							vehicle: vehicle.value,
							eager: i < 2,
							compare: ""
						}, null, 8, [
							"card",
							"vehicle",
							"eager"
						])]);
					}), 128))];
				}),
				_: 1
			}, _parent));
			else _push(`<div class="container empty" data-v-5bc8ab1e><p class="empty__title" data-v-5bc8ab1e>In dieser Auswahl ist gerade nichts.</p><p class="empty__text" data-v-5bc8ab1e>Schau unter „Meiste Freigaben“ oder „Neu“ – oder sieh dir alle Felgen an.</p></div>`);
			_push(`</div><div class="container home-h5__foot" data-v-5bc8ab1e>`);
			if (popularFailed.value) {
				_push(`<div class="notice notice--bad" data-v-5bc8ab1e>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "warning",
					size: 20
				}, null, _parent));
				_push(`<div class="home-notice__body" data-v-5bc8ab1e><p data-v-5bc8ab1e>Die Felgen lassen sich gerade nicht laden.</p><button class="btn btn--secondary btn--sm" type="button" data-v-5bc8ab1e>Erneut versuchen</button></div></div>`);
			} else _push(`<!---->`);
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
			_push(`</div>`);
			if (__props.recentlyViewed.length) {
				_push(`<div id="h5b" data-section="H5b" class="home-h5b" data-v-5bc8ab1e>`);
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
								_push(`<li data-v-5bc8ab1e${_scopeId}>`);
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
			if (rendered.value.h6) {
				_push(`<section id="h6" data-section="H6" class="${(0, server_renderer_exports.ssrRenderClass)(cls("h6"))}" aria-labelledby="h6-title" data-v-5bc8ab1e><div class="container" data-v-5bc8ab1e><h2 id="h6-title" class="h2 home-h2" data-v-5bc8ab1e>${(0, server_renderer_exports.ssrInterpolate)(sizes.value.length ? "Nach Zollgröße" : "Nach Marke")}</h2></div>`);
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
								_push(`<li data-v-5bc8ab1e${_scopeId}>`);
								if (size.none) _push(`<span class="size-tile size-tile--none" aria-disabled="true" data-v-5bc8ab1e${_scopeId}><span class="display num size-tile__n" data-v-5bc8ab1e${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(size.inch)}</span><span class="small quiet" data-v-5bc8ab1e${_scopeId}>Zoll</span><span class="small num quiet" data-v-5bc8ab1e${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(size.line)}</span></span>`);
								else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: size.href,
									class: "size-tile m-press"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`<span class="display num size-tile__n" data-v-5bc8ab1e${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(size.inch)}</span><span class="small muted" data-v-5bc8ab1e${_scopeId}>Zoll</span><span class="small num muted" data-v-5bc8ab1e${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(size.line)}</span>`);
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
					_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([{ "home-brands--after-sizes": sizes.value.length > 0 }, "container home-brands"])}" data-v-5bc8ab1e>`);
					if (sizes.value.length) _push(`<h2 class="h2 home-h2" data-v-5bc8ab1e>Nach Marke</h2>`);
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
			if (tyre.value) {
				_push(`<section id="h7" data-section="H7" class="${(0, server_renderer_exports.ssrRenderClass)(cls("h7"))}" aria-labelledby="h7-title" data-v-5bc8ab1e><div class="container home-komplett" data-v-5bc8ab1e><h2 id="h7-title" class="h2 home-h2" data-v-5bc8ab1e>Kompletträder – <br data-v-5bc8ab1e>montiert und gewuchtet.</h2><p class="body-l home-komplett__text" data-v-5bc8ab1e>Felge und Reifen kommen fertig montiert und gewuchtet bei dir an.</p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(KomplettradWheel_default, { class: "home-komplett__wheel" }, null, _parent));
				_push((0, server_renderer_exports.ssrRenderComponent)(TyreLabel_default, {
					title: tyre.value.title,
					fuel: tyre.value.fuel,
					wet: tyre.value.wet,
					"noise-db": tyre.value.noiseDb,
					"noise-class": tyre.value.noiseClass,
					"eprel-id": tyre.value.eprelId,
					class: "home-komplett__label"
				}, null, _parent));
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: komplettradHref.value,
					class: "btn btn--light btn--block",
					prefetch: ""
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Kompletträder für mein Fahrzeug`);
						else return [(0, vue_exports.createTextVNode)("Kompletträder für mein Fahrzeug")];
					}),
					_: 1
				}, _parent));
				_push(`</div></section>`);
			} else _push(`<!---->`);
			if (rendered.value.h8) {
				_push(`<section id="h8" data-section="H8" class="${(0, server_renderer_exports.ssrRenderClass)(cls("h8"))}" aria-labelledby="h8-title" data-v-5bc8ab1e><div class="container" data-v-5bc8ab1e><h2 id="h8-title" class="h2 home-h2" data-v-5bc8ab1e>Was die Zahlen auf einer Felge bedeuten</h2><p class="body muted home-lead" data-v-5bc8ab1e>Tippe auf einen Wert – das Foto oder die Schnittzeichnung zeigt, wo er an der Felge liegt.</p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(RimCode_default, {
					product: __props.hero.product,
					layout: "phone"
				}, null, _parent));
				_push(`</div></section>`);
			} else _push(`<!---->`);
			if (__props.partners.enabled) {
				_push(`<section id="h9" data-section="H9" class="${(0, server_renderer_exports.ssrRenderClass)(cls("h9"))}" aria-labelledby="h9-title" data-v-5bc8ab1e><div class="container home-partners" data-v-5bc8ab1e><div class="home-partners__head" data-v-5bc8ab1e><h2 id="h9-title" class="h2 home-h2" data-v-5bc8ab1e>Montage in deiner Nähe</h2>`);
				if (__props.partners.demo) _push(`<span class="badge" data-v-5bc8ab1e>Beispieldaten</span>`);
				else _push(`<!---->`);
				_push(`</div><form class="home-partners__form" data-v-5bc8ab1e><div class="form-field" data-v-5bc8ab1e><label class="form-field__label" for="plz" data-v-5bc8ab1e>Postleitzahl</label><input id="plz"${(0, server_renderer_exports.ssrRenderAttr)("value", plz.value)} class="input num" type="text" inputmode="numeric" maxlength="5" autocomplete="postal-code" enterkeyhint="search" data-v-5bc8ab1e><p class="form-field__error" data-v-5bc8ab1e>`);
				if (partnerState.value === "failed") _push(`<!--[-->Die Partnersuche ist gerade nicht erreichbar.<!--]-->`);
				else _push(`<!---->`);
				_push(`</p></div><button class="btn btn--primary btn--block" type="submit"${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", !/^\d{5}$/.test(plz.value) ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", partnerState.value === "busy" ? "true" : void 0)} data-v-5bc8ab1e>${(0, server_renderer_exports.ssrInterpolate)(/^\d{5}$/.test(plz.value) ? "Partner finden" : "Postleitzahl eingeben")}</button></form><p class="body muted" data-v-5bc8ab1e>Gib deine Postleitzahl ein – wir zeigen dir die drei nächsten Montagepartner.</p></div></section>`);
			} else _push(`<!---->`);
			if (__props.guides.length) {
				_push(`<section id="h10" data-section="H10" class="${(0, server_renderer_exports.ssrRenderClass)(cls("h10"))}" aria-labelledby="h10-title" data-v-5bc8ab1e><div class="container" data-v-5bc8ab1e><h2 id="h10-title" class="h2 home-h2" data-v-5bc8ab1e>Wissen, bevor du kaufst</h2></div>`);
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
								_push(`<li data-v-5bc8ab1e${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: `/ratgeber/${guide.slug}`,
									class: "guide m-press",
									prefetch: ""
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`<span class="h4 guide__title" data-v-5bc8ab1e${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(guide.title)}</span><span class="small quiet num" data-v-5bc8ab1e${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(guide.minutes)} Min. Lesezeit</span>`);
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
			_push(`<section id="h11" data-section="H11" class="${(0, server_renderer_exports.ssrRenderClass)(cls("h11"))}" aria-labelledby="h11-title" data-v-5bc8ab1e><div class="container" data-v-5bc8ab1e><h2 id="h11-title" class="h2 home-h2" data-v-5bc8ab1e>Fragen zur Passform? Wir schauen mit dir drauf.</h2><p class="${(0, server_renderer_exports.ssrRenderClass)([{ "home-status--open": service.value?.open }, "small home-status"])}" data-v-5bc8ab1e>${(0, server_renderer_exports.ssrInterpolate)(statusLine.value)}</p></div><div class="home-contact" data-v-5bc8ab1e>`);
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
					if (_push) _push(`<span class="home-contact__slot" aria-hidden="true" data-v-5bc8ab1e${_scopeId}></span>`);
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
				href: `mailto:${contact.value.email}`,
				external: "",
				chevron: false
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
				icon: "clock",
				title: contact.value.hours,
				static: ""
			}, null, _parent));
			_push(`</div><div class="container home-faq" data-v-5bc8ab1e>`);
			if (faqItems.value.length) _push((0, server_renderer_exports.ssrRenderComponent)(Accordion_default, {
				items: faqItems.value,
				level: 3
			}, null, _parent));
			else _push(`<p class="body muted" data-v-5bc8ab1e>Die häufigsten Fragen beantworten wir gerade neu.</p>`);
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
var Mobile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Mobile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-5bc8ab1e"]]);
//#endregion
export { Mobile_default as default };
