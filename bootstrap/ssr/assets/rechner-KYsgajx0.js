import { c as router, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as Icon_default } from "./Icon-Bryl-es8.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as formatNumber } from "./num-Br8qlecZ.js";
import { s as withUnit } from "./format-6R0uUMt3.js";
import { t as ValueText_default } from "./ValueText-Bpoa8gB7.js";
//#region resources/js/lib/etRechner.ts
/**
* The Felgenrechner, rebuilt close to the client's example (his #11: „replicate it as closely as possible“; the
* operator's brief of 29.10.2026, Batch 2): two setups — the current rim and the new one, each a width, an ET and a
* spacer — and how far the new rim's inner and outer edges sit from the current ones. Arithmetic only; it judges
* nothing (ACCURACY.md §6).
*
* Measured from the hub's face, towards the car positive: the inner edge sits at width/2 + ET − spacer, the outer edge
* at width/2 − ET + spacer, the width in millimetres at 25,4 to the inch. Each change is new − current.
*
* Everything is counted in whole hundredths of a millimetre — a tenth of an inch is 254 of them, half of it 127 — and
* rounded once, half away from zero, to the tenth the page shows. 6,35 mm shows as „6,4 mm“; a float would say 6,3.
*/
/** What each field offers: rim widths in half inches, ET and spacer in whole millimetres. */
var RANGES = {
	widthIn: {
		min: 4,
		max: 13,
		step: .5
	},
	etMm: {
		min: -50,
		max: 80,
		step: 1
	},
	spacerMm: {
		min: 0,
		max: 50,
		step: 1
	}
};
/** His example's first view: 8 Zoll at ET 45 against 8 Zoll at ET 40, no spacer. */
var DEFAULT_ET_STATE = {
	current: {
		widthIn: 8,
		etMm: 45,
		spacerMm: 0
	},
	next: {
		widthIn: 8,
		etMm: 40,
		spacerMm: 0
	}
};
var ET_SIDES = [{
	key: "current",
	title: "Aktuelle Felge"
}, {
	key: "next",
	title: "Neue Felge"
}];
/** Half the rim's width: tenths of an inch × 127 hundredths. A width the form offers has at most one decimal. */
function halfWidth(widthIn) {
	return Math.round(widthIn * 10) * 127;
}
/** The inner edge's distance from the hub's face, towards the car. */
function innerEdge(s) {
	return halfWidth(s.widthIn) + (s.etMm - s.spacerMm) * 100;
}
/** The outer edge's distance from the hub's face, away from the car. */
function outerEdge(s) {
	return halfWidth(s.widthIn) - (s.etMm - s.spacerMm) * 100;
}
/** How far each edge of the new rim moves against the current one, in hundredths of a millimetre. */
function edgeChange(state) {
	return {
		inner: innerEdge(state.next) - innerEdge(state.current),
		outer: outerEdge(state.next) - outerEdge(state.current)
	};
}
/** Hundredths to the tenths the page shows, a half away from zero: 635 → 64, −635 → −64. */
function roundToTenths(hundredths) {
	return Math.sign(hundredths) * Math.floor((Math.abs(hundredths) + 5) / 10);
}
/** Tenths of a millimetre as „6,4 mm“ — the whole millimetres and the tenth apart, so no float is ever rounded. */
function mmText(tenths) {
	const whole = Math.floor(Math.abs(tenths) / 10);
	return withUnit(`${formatNumber(whole, 0)},${Math.abs(tenths) % 10}`, "mm");
}
function innerSentence(tenths) {
	if (tenths === 0) return "Innen: unverändert";
	return `Innen: ${mmText(tenths)} ${tenths > 0 ? "näher am Fahrwerk" : "weiter vom Fahrwerk entfernt"}`;
}
function outerSentence(tenths) {
	if (tenths === 0) return "Außen: unverändert";
	return `Außen: ${mmText(tenths)} ${tenths > 0 ? "weiter heraus" : "weiter hinein"}`;
}
/** `8,5J` · `8J` */
function widthLabel(widthIn) {
	return `${Number.isInteger(widthIn) ? widthIn : String(widthIn).replace(".", ",")}J`;
}
/** `ET 45` · `ET −10` */
function etText(etMm) {
	return `ET ${etMm < 0 ? `−${Math.abs(etMm)}` : etMm}`;
}
/** `8,5J · ET 40` and, with a spacer, `· Distanzscheibe 10 mm` — the label before the value, as in `ET 40`. */
function setupLine(s) {
	return `${widthLabel(s.widthIn)} · ${etText(s.etMm)}${s.spacerMm > 0 ? ` · Distanzscheibe ${withUnit(s.spacerMm, "mm")}` : ""}`;
}
function offered(field, value) {
	const { min, max, step } = RANGES[field];
	return Number.isFinite(value) && value >= min && value <= max && Number.isInteger(Math.round(value * 100) / (step * 100));
}
function isEtSetup(s) {
	return offered("widthIn", s.widthIn) && offered("etMm", s.etMm) && offered("spacerMm", s.spacerMm);
}
function encodeSetup(s) {
	return `${s.widthIn}x${s.etMm}x${s.spacerMm}`;
}
function encodeEtState(state) {
	return `${encodeSetup(state.current)}_${encodeSetup(state.next)}`;
}
//#endregion
//#region resources/js/Components/Rechner/EtCalculator.vue?vue&type=script&setup=true&lang.ts
var EtCalculator_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "EtCalculator",
	__ssrInlineRender: true,
	props: { modelValue: {} },
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		/**
		* The Felgenrechner's form, as the client's example sets it (his #11; the operator's brief of 29.10.2026, Batch 2): two
		* blocks, „Aktuelle Felge“ and „Neue Felge“, each with Breite, Einpresstiefe and Distanzscheibe — minus, the figure,
		* plus, 44 px a step, and the figure typed directly. The arrow keys step too.
		*
		* A typed figure the form does not offer stays as typed, with a sentence under its field, and the drawing keeps the
		* figure the field had before the typing began — never one on the way (`8` on the way to `81`), never a cleared field,
		* never a silent reset (R-09). The state itself belongs to the page; this only proposes the next one.
		*/
		const props = __props;
		const uid = (0, vue_exports.useId)();
		const FIELDS = [
			{
				key: "widthIn",
				label: "Breite",
				unit: "Zoll",
				unitSaid: "Zoll",
				mode: "decimal",
				error: `Gib eine Breite zwischen 4 und 13 Zoll ein, in halben Zoll – zum Beispiel 8,5.`
			},
			{
				key: "etMm",
				label: "Einpresstiefe (ET)",
				unit: "mm",
				unitSaid: "Millimeter",
				mode: "numeric",
				error: `Gib eine Einpresstiefe zwischen −50 und 80 mm ein, in ganzen Millimetern.`
			},
			{
				key: "spacerMm",
				label: "Distanzscheibe je Rad",
				unit: "mm",
				unitSaid: "Millimeter",
				mode: "numeric",
				error: `Gib die Stärke der Distanzscheibe zwischen 0 und 50 mm ein, in ganzen Millimetern. Ohne Distanzscheibe trägst du 0 ein.`
			}
		];
		/** A figure as the field shows it: `8,5`, `−10`. */
		function shown(field, value) {
			return field === "widthIn" ? String(value).replace(".", ",") : String(value).replace("-", "−");
		}
		function textsOf(state) {
			const of = (side) => ({
				widthIn: shown("widthIn", state[side].widthIn),
				etMm: shown("etMm", state[side].etMm),
				spacerMm: shown("spacerMm", state[side].spacerMm)
			});
			return {
				current: of("current"),
				next: of("next")
			};
		}
		const texts = (0, vue_exports.reactive)(textsOf(props.modelValue));
		const errors = (0, vue_exports.reactive)({
			current: {},
			next: {}
		});
		(0, vue_exports.reactive)({
			current: {},
			next: {}
		});
		let editing = null;
		(0, vue_exports.watch)(() => props.modelValue, (state, old) => {
			const next = textsOf(state);
			for (const side of ["current", "next"]) for (const field of [
				"widthIn",
				"etMm",
				"spacerMm"
			]) {
				if (`${side}.${field}` === editing || old?.[side][field] === state[side][field]) continue;
				texts[side][field] = next[side][field];
				errors[side][field] = false;
			}
		}, { deep: true });
		function atEnd(side, field, direction) {
			const value = props.modelValue[side][field];
			return direction === 1 ? value >= RANGES[field].max : value <= RANGES[field].min;
		}
		const fid = (side, field) => `${uid}-${side}-${field}`;
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "etc" }, _attrs))} data-v-a0002b40><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(ET_SIDES), (block) => {
				_push(`<fieldset class="${(0, server_renderer_exports.ssrRenderClass)([`etc__block--${block.key}`, "etc__block"])}" data-v-a0002b40><legend class="etc__title" data-v-a0002b40>${(0, server_renderer_exports.ssrInterpolate)(block.title)}</legend><div class="etc__fields" data-v-a0002b40><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(FIELDS, (field) => {
					_push(`<div class="etc__field" data-v-a0002b40><label class="etc__label"${(0, server_renderer_exports.ssrRenderAttr)("for", fid(block.key, field.key))} data-v-a0002b40>${(0, server_renderer_exports.ssrInterpolate)(field.label)}</label><div class="etc__row" translate="no" data-v-a0002b40><div class="etc__stepper" data-v-a0002b40><button class="etc__step" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${field.label} verringern`)}${(0, server_renderer_exports.ssrRenderAttr)("aria-controls", fid(block.key, field.key))}${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", atEnd(block.key, field.key, -1) ? "true" : void 0)} data-v-a0002b40>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "minus",
						size: 20
					}, null, _parent));
					_push(`</button><input${(0, server_renderer_exports.ssrRenderAttr)("id", fid(block.key, field.key))} class="etc__input tabular" type="text"${(0, server_renderer_exports.ssrRenderAttr)("inputmode", field.mode)} autocomplete="off" spellcheck="false"${(0, server_renderer_exports.ssrRenderAttr)("value", texts[block.key][field.key])}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors[block.key][field.key] ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", errors[block.key][field.key] ? `${fid(block.key, field.key)}-unit ${fid(block.key, field.key)}-error` : `${fid(block.key, field.key)}-unit`)} data-v-a0002b40><button class="etc__step" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${field.label} erhöhen`)}${(0, server_renderer_exports.ssrRenderAttr)("aria-controls", fid(block.key, field.key))}${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", atEnd(block.key, field.key, 1) ? "true" : void 0)} data-v-a0002b40>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "plus",
						size: 20
					}, null, _parent));
					_push(`</button></div><span class="etc__unit" aria-hidden="true" data-v-a0002b40>${(0, server_renderer_exports.ssrInterpolate)(field.unit)}</span><span${(0, server_renderer_exports.ssrRenderAttr)("id", `${fid(block.key, field.key)}-unit`)} class="visually-hidden" data-v-a0002b40>${(0, server_renderer_exports.ssrInterpolate)(field.unitSaid)}</span></div>`);
					if (errors[block.key][field.key]) {
						_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${fid(block.key, field.key)}-error`)} class="form-field__error etc__error" role="alert" data-v-a0002b40><span data-v-a0002b40>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: field.error }, null, _parent));
						_push(`</span></p>`);
					} else _push(`<!---->`);
					_push(`</div>`);
				});
				_push(`<!--]--></div></fieldset>`);
			});
			_push(`<!--]--></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Rechner/EtCalculator.vue
var _sfc_setup$2 = EtCalculator_vue_vue_type_script_setup_true_lang_default.setup;
EtCalculator_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Rechner/EtCalculator.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var EtCalculator_default = /*#__PURE__*/ _plugin_vue_export_helper_default(EtCalculator_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-a0002b40"]]);
//#endregion
//#region resources/js/Components/Rechner/OffsetDrawing.vue?vue&type=script&setup=true&lang.ts
var STRUT_X = 262;
var HEIGHT = 380;
var FIGURE_Y = 16;
var BAND_TOP = 104;
var BAND_BOTTOM = 276;
var TYRE_TOP = 34;
var BAND = 16;
var TYRE_BULGE = 14;
var OUTSIDE_ROOM = 80;
var OffsetDrawing_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "OffsetDrawing",
	__ssrInlineRender: true,
	props: { state: {} },
	setup(__props) {
		/**
		* The Felgenrechner's drawing (PROTECTED P7, rebuilt for the client's #11 — „The current illustration is very
		* confusing … add some color (for example old: gray; new: blue)“; the operator's brief of 29.10.2026, Batch 2): the
		* wheel cut through its middle and seen from the front of the car — the tyre top and bottom, the rim with its lips,
		* the disc on the hub — the outside on the left, the hub and the strut on the right, as his example sets them. The
		* current wheel solid gray, the new one a blue outline on top of it, so both read wherever they cover each other; at
		* the edges a chevron the way each rim edge moved, and between them by how much, as in his example („‹ 17,7 mm …
		* 7,7 mm ›“). Under it the key: what each colour is, with its sizes.
		*
		* Schematic: one millimetre is one unit across, the height and the tyre are not to scale, and the strut stands where no
		* rim the form offers reaches — it marks a side, never a clearance (the calculator judges nothing, ACCURACY.md §6). The
		* shapes are SVG; the words and figures are text laid over it at the type scale's sizes, so they read the same on a
		* phone as on a desktop. Everything moves by `transform` alone (DIRECTION §7) — the labels in container units — so a
		* change is seen as a movement; with reduced motion it is set at once.
		*/
		const props = __props;
		const TYRE_H = 70;
		const MIDDLE = 190;
		function wheel(s) {
			return {
				centre: s.etMm - s.spacerMm,
				width: s.widthIn * 25.4,
				inner: innerEdge(s) / 100,
				outer: -outerEdge(s) / 100,
				face: -s.spacerMm,
				spacer: s.spacerMm
			};
		}
		const current = (0, vue_exports.computed)(() => wheel(props.state.current));
		const next = (0, vue_exports.computed)(() => wheel(props.state.next));
		const change = (0, vue_exports.computed)(() => {
			const c = edgeChange(props.state);
			return {
				inner: roundToTenths(c.inner),
				outer: roundToTenths(c.outer)
			};
		});
		const outermost = (0, vue_exports.computed)(() => Math.min(current.value.outer, next.value.outer));
		const innermost = (0, vue_exports.computed)(() => Math.max(current.value.inner, next.value.inner));
		const left = (0, vue_exports.computed)(() => Math.floor(Math.min(-140, outermost.value - TYRE_BULGE - OUTSIDE_ROOM)));
		const right = (0, vue_exports.computed)(() => Math.ceil(Math.max(320, innermost.value + TYRE_BULGE + 30)));
		const move = (x, scale = 1) => ({ transform: `translate(${x}px, 0px) scaleX(${scale})` });
		const outerChevron = (0, vue_exports.computed)(() => outermost.value - TYRE_BULGE - 4);
		const innerChevron = (0, vue_exports.computed)(() => innermost.value + TYRE_BULGE + 4);
		/** A chevron the way an edge moved: the inner edge towards the car points right, the outer edge out of the car left. */
		function chevron(x, pointsRight) {
			const d = pointsRight ? 1 : -1;
			return `M ${x - 5 * d} 8 L ${x + 5 * d} ${FIGURE_Y} L ${x - 5 * d} 24`;
		}
		/**
		* A label at a point of the drawing: across in container units (the stage is the container), so it moves by transform
		* with the wheel; down as a share of the height. `end` puts the text before the point, `middle` around it. Held inside
		* the stage: the drawing shrinks on a phone and its words do not, and „Fahrwerk“ over the strut ran past the right edge.
		*/
		function at(x, y, anchor = "start") {
			const across = (x - left.value) / (right.value - left.value) * 100;
			const shift = anchor === "end" ? " - 100%" : anchor === "middle" ? " - 50%" : "";
			return {
				top: `${y / HEIGHT * 100}%`,
				transform: `translate(clamp(0px, calc(${across.toFixed(3)}cqw${shift}), calc(100cqw - 100%)), -50%)`
			};
		}
		const lines = (0, vue_exports.computed)(() => ({
			current: setupLine(props.state.current),
			next: setupLine(props.state.next)
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<figure${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "odraw calc-drawing" }, _attrs))} data-v-62509acb><div class="odraw__stage" data-v-62509acb><svg class="odraw__svg"${(0, server_renderer_exports.ssrRenderAttr)("viewBox", `${left.value} 0 ${right.value - left.value} ${HEIGHT}`)} role="img" aria-labelledby="odraw-caption odraw-key" data-v-62509acb><g class="odraw__car" aria-hidden="true" data-v-62509acb><rect class="odraw__strut"${(0, server_renderer_exports.ssrRenderAttr)("x", STRUT_X)} y="62" width="44" height="88" rx="4" data-v-62509acb></rect><rect class="odraw__knuckle"${(0, server_renderer_exports.ssrRenderAttr)("x", 240)}${(0, server_renderer_exports.ssrRenderAttr)("y", 140)} width="70" height="100" rx="4" data-v-62509acb></rect><rect class="odraw__hub" x="0"${(0, server_renderer_exports.ssrRenderAttr)("y", 152)}${(0, server_renderer_exports.ssrRenderAttr)("width", 240)} height="76" rx="4" data-v-62509acb></rect><line class="odraw__face" x1="0"${(0, server_renderer_exports.ssrRenderAttr)("y1", 130)} x2="0"${(0, server_renderer_exports.ssrRenderAttr)("y2", 250)} data-v-62509acb></line><line class="odraw__leader"${(0, server_renderer_exports.ssrRenderAttr)("x1", 284)} y1="48"${(0, server_renderer_exports.ssrRenderAttr)("x2", 284)} y2="62" data-v-62509acb></line></g><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)([current.value, next.value], (w, i) => {
				_push(`<g class="${(0, server_renderer_exports.ssrRenderClass)([i === 0 ? "odraw__wheel--current" : "odraw__wheel--next", "odraw__wheel"])}" aria-hidden="true" data-v-62509acb><rect class="odraw__tyre odraw__part" style="${(0, server_renderer_exports.ssrRenderStyle)(move(w.centre, w.width + 28))}" x="-0.5"${(0, server_renderer_exports.ssrRenderAttr)("y", TYRE_TOP)} width="1"${(0, server_renderer_exports.ssrRenderAttr)("height", TYRE_H)} data-v-62509acb></rect><rect class="odraw__tyre odraw__part" style="${(0, server_renderer_exports.ssrRenderStyle)(move(w.centre, w.width + 28))}" x="-0.5"${(0, server_renderer_exports.ssrRenderAttr)("y", BAND_BOTTOM)} width="1"${(0, server_renderer_exports.ssrRenderAttr)("height", TYRE_H)} data-v-62509acb></rect><rect class="odraw__spacer odraw__part" style="${(0, server_renderer_exports.ssrRenderStyle)(move(w.face, Math.max(w.spacer, .001)))}" x="0"${(0, server_renderer_exports.ssrRenderAttr)("y", 140)} width="1" height="100"${(0, server_renderer_exports.ssrRenderAttr)("opacity", w.spacer > 0 ? 1 : 0)} data-v-62509acb></rect><rect class="odraw__disc odraw__part" style="${(0, server_renderer_exports.ssrRenderStyle)(move(w.face))}" x="-7"${(0, server_renderer_exports.ssrRenderAttr)("y", 120)} width="7"${(0, server_renderer_exports.ssrRenderAttr)("height", 140)} data-v-62509acb></rect><rect class="odraw__band odraw__part" style="${(0, server_renderer_exports.ssrRenderStyle)(move(w.centre, w.width))}" x="-0.5"${(0, server_renderer_exports.ssrRenderAttr)("y", BAND_TOP)} width="1"${(0, server_renderer_exports.ssrRenderAttr)("height", BAND)} data-v-62509acb></rect><rect class="odraw__band odraw__part" style="${(0, server_renderer_exports.ssrRenderStyle)(move(w.centre, w.width))}" x="-0.5"${(0, server_renderer_exports.ssrRenderAttr)("y", 260)} width="1"${(0, server_renderer_exports.ssrRenderAttr)("height", BAND)} data-v-62509acb></rect><rect class="odraw__lip odraw__part" style="${(0, server_renderer_exports.ssrRenderStyle)(move(w.outer))}" x="-7"${(0, server_renderer_exports.ssrRenderAttr)("y", 78)} width="7"${(0, server_renderer_exports.ssrRenderAttr)("height", 42)} data-v-62509acb></rect><rect class="odraw__lip odraw__part" style="${(0, server_renderer_exports.ssrRenderStyle)(move(w.outer))}" x="-7"${(0, server_renderer_exports.ssrRenderAttr)("y", 260)} width="7"${(0, server_renderer_exports.ssrRenderAttr)("height", 42)} data-v-62509acb></rect><rect class="odraw__lip odraw__part" style="${(0, server_renderer_exports.ssrRenderStyle)(move(w.inner))}" x="0"${(0, server_renderer_exports.ssrRenderAttr)("y", 78)} width="7"${(0, server_renderer_exports.ssrRenderAttr)("height", 42)} data-v-62509acb></rect><rect class="odraw__lip odraw__part" style="${(0, server_renderer_exports.ssrRenderStyle)(move(w.inner))}" x="0"${(0, server_renderer_exports.ssrRenderAttr)("y", 260)} width="7"${(0, server_renderer_exports.ssrRenderAttr)("height", 42)} data-v-62509acb></rect></g>`);
			});
			_push(`<!--]--><g class="odraw__chevrons" aria-hidden="true" data-v-62509acb>`);
			if (change.value.outer !== 0) _push(`<path class="odraw__chevron"${(0, server_renderer_exports.ssrRenderAttr)("d", chevron(outerChevron.value, change.value.outer < 0))} data-v-62509acb></path>`);
			else _push(`<!---->`);
			if (change.value.inner !== 0) _push(`<path class="odraw__chevron"${(0, server_renderer_exports.ssrRenderAttr)("d", chevron(innerChevron.value, change.value.inner > 0))} data-v-62509acb></path>`);
			else _push(`<!---->`);
			_push(`</g></svg><div class="odraw__labels" aria-hidden="true" data-v-62509acb>`);
			if (change.value.outer !== 0) _push(`<span class="odraw__figure odraw__label" translate="no" style="${(0, server_renderer_exports.ssrRenderStyle)(at(outerChevron.value + 10, FIGURE_Y, "start"))}" data-v-62509acb>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(mmText)(Math.abs(change.value.outer)))}</span>`);
			else _push(`<!---->`);
			if (change.value.inner !== 0) _push(`<span class="odraw__figure odraw__label" translate="no" style="${(0, server_renderer_exports.ssrRenderStyle)(at(innerChevron.value - 10, FIGURE_Y, "end"))}" data-v-62509acb>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(mmText)(Math.abs(change.value.inner)))}</span>`);
			else _push(`<!---->`);
			_push(`<span class="odraw__name odraw__label" style="${(0, server_renderer_exports.ssrRenderStyle)(at(outermost.value - TYRE_BULGE - 10, MIDDLE, "end"))}" data-v-62509acb>außen</span><span class="odraw__name odraw__label" style="${(0, server_renderer_exports.ssrRenderStyle)(at(284, 38, "middle"))}" data-v-62509acb>Fahrwerk</span><span class="odraw__name odraw__label" style="${(0, server_renderer_exports.ssrRenderStyle)(at(150, MIDDLE, "middle"))}" data-v-62509acb>Radnabe</span></div></div><figcaption class="odraw__foot" data-v-62509acb><span id="odraw-caption" class="small muted" data-v-62509acb>Schnitt durch das Rad, schematisch, von vorn gesehen.</span><ul id="odraw-key" class="odraw__key" data-v-62509acb><li class="odraw__key-line small" data-v-62509acb><span class="odraw__sample odraw__sample--current" aria-hidden="true" data-v-62509acb></span><span class="odraw__side" data-v-62509acb>Aktuell:</span> `);
			_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: lines.value.current }, null, _parent));
			_push(`</li><li class="odraw__key-line small" data-v-62509acb><span class="odraw__sample odraw__sample--next" aria-hidden="true" data-v-62509acb></span><span class="odraw__side" data-v-62509acb>Neu:</span> `);
			_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: lines.value.next }, null, _parent));
			_push(`</li></ul></figcaption></figure>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Rechner/OffsetDrawing.vue
var _sfc_setup$1 = OffsetDrawing_vue_vue_type_script_setup_true_lang_default.setup;
OffsetDrawing_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Rechner/OffsetDrawing.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var OffsetDrawing_default = /*#__PURE__*/ _plugin_vue_export_helper_default(OffsetDrawing_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-62509acb"]]);
//#endregion
//#region resources/js/Components/Home/RechnerShare.vue?vue&type=script&setup=true&lang.ts
var RechnerShare_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "RechnerShare",
	__ssrInlineRender: true,
	props: {
		param: {},
		block: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* The share block of /felgenrechner: a read-only field holding the page's own address with the
		* current comparison in `?rechner=`, and *Link kopieren* beside it.
		*
		* Before the component is mounted the field holds the relative address (the same on the server
		* and in the first client frame, so nothing mismatches); once mounted it holds `location.href`
		* with the parameter set, and follows every change of the figures. Copying is attempted with
		* the Clipboard API; when that is refused (an older browser, a page without HTTPS) the line
		* under the block says so and points at the address bar, where the link also is.
		*/
		const props = __props;
		const uid = (0, vue_exports.useId)();
		const origin = (0, vue_exports.ref)(null);
		const status = (0, vue_exports.ref)("");
		const busy = (0, vue_exports.ref)(false);
		let delay = 200;
		const href = (0, vue_exports.computed)(() => {
			if (origin.value === null) return `/felgenrechner?rechner=${props.param}`;
			const url = new URL(origin.value);
			url.searchParams.set("rechner", props.param);
			return url.toString();
		});
		(0, vue_exports.watch)(() => props.param, () => {
			status.value = "";
		});
		function parseMs(value) {
			const match = /^\s*([\d.]+)\s*(ms|s)\s*$/.exec(value);
			if (match === null || match[1] === void 0) return null;
			const n = Number(match[1]);
			return Number.isFinite(n) ? match[2] === "s" ? n * 1e3 : n : null;
		}
		(0, vue_exports.onMounted)(() => {
			origin.value = window.location.href;
			delay = parseMs(getComputedStyle(document.documentElement).getPropertyValue("--d-2")) ?? delay;
		});
		(0, vue_exports.onBeforeUnmount)(() => {});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "share" }, _attrs))} data-v-6d5bb846><button${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-share`)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "btn--block": __props.block }, "btn btn--secondary share__button"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("data-href", href.value)}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-6d5bb846> Link zu dieser Berechnung kopieren </button><p class="small quiet share__status" role="status" aria-live="polite" data-v-6d5bb846>${(0, server_renderer_exports.ssrInterpolate)(status.value)}</p></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/RechnerShare.vue
var _sfc_setup = RechnerShare_vue_vue_type_script_setup_true_lang_default.setup;
RechnerShare_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/RechnerShare.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var RechnerShare_default = /*#__PURE__*/ _plugin_vue_export_helper_default(RechnerShare_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-6d5bb846"]]);
//#endregion
//#region resources/js/composables/useEtRechner.ts
/**
* The Felgenrechner's state, on both documents of /felgenrechner, since its rebuild after the client's example (his #11;
* the operator's brief of 29.10.2026, Batch 2): the two setups, how far each edge moves, the sentence about a prefill,
* and the address.
*
* Starting values, in this order: the comparison the server read from `?rechner=`; then the chosen car's prefill — the
* smallest size a Gutachten names for it (finding C3), half an inch wider at the same ET beside it, so the first paint
* shows a change; then his example. Every change is written to `?rechner=` with `history.replaceState`, debounced by
* `--d-2`, so the address bar is always the share link. Nothing here touches `window` outside `onMounted`.
*/
/** The car's smallest Gutachten size as the current rim, without a spacer — or null when the form does not offer it. */
function fromPrefill(p) {
	if (p === null || p === void 0) return null;
	const s = {
		widthIn: p.widthIn,
		etMm: p.etMm,
		spacerMm: 0
	};
	return isEtSetup(s) ? s : null;
}
/** Beside a prefill: half an inch wider at the same ET — a comparison to look at, never a recommendation. */
function wider(s) {
	return {
		...s,
		widthIn: Math.min(RANGES.widthIn.max, s.widthIn + .5)
	};
}
/**
* What the prefill is, said plainly (C3) and of our record (R-17): the smallest size we hold a Gutachten for — the car
* by its whole name, since the Gutachten on record are the variant's, not the model's.
*/
function prefillSentence(vehicleLabel) {
	return `„Aktuelle Felge“ ist mit der kleinsten Größe aus den bei uns hinterlegten Gutachten für ${vehicleLabel} vorbelegt. Das ist nicht unbedingt die Felge, die du heute fährst.`;
}
function isEtState(state) {
	return state !== null && state !== void 0 && isEtSetup(state.current) && isEtSetup(state.next);
}
function same(a, b) {
	return encodeEtState(a) === encodeEtState(b);
}
function parseMs(value) {
	const match = /^\s*([\d.]+)\s*(ms|s)\s*$/.exec(value);
	if (match === null || match[1] === void 0) return null;
	const n = Number(match[1]);
	return Number.isFinite(n) ? match[2] === "s" ? n * 1e3 : n : null;
}
function useEtRechner(options) {
	const prefilled = fromPrefill(options.prefill());
	const shared = isEtState(options.state) ? options.state : null;
	const initial = shared ?? (prefilled === null ? DEFAULT_ET_STATE : {
		current: prefilled,
		next: wider(prefilled)
	});
	const state = (0, vue_exports.reactive)({
		current: { ...initial.current },
		next: { ...initial.next }
	});
	const fromVehicle = (0, vue_exports.ref)(shared === null && prefilled !== null);
	const change = (0, vue_exports.computed)(() => {
		const c = edgeChange(state);
		return {
			inner: roundToTenths(c.inner),
			outer: roundToTenths(c.outer)
		};
	});
	const sentences = (0, vue_exports.computed)(() => ({
		inner: innerSentence(change.value.inner),
		outer: outerSentence(change.value.outer)
	}));
	const lines = (0, vue_exports.computed)(() => ({
		current: setupLine(state.current),
		next: setupLine(state.next)
	}));
	const shareParam = (0, vue_exports.computed)(() => encodeEtState(state));
	const prefillLine = (0, vue_exports.computed)(() => {
		const label = options.vehicle()?.label;
		return fromVehicle.value && label !== void 0 && label !== "" ? prefillSentence(label) : null;
	});
	function replace(next) {
		Object.assign(state.current, next.current);
		Object.assign(state.next, next.next);
	}
	let timer;
	let delay = 200;
	function writeUrl() {
		const url = new URL(window.location.href);
		url.searchParams.set("rechner", shareParam.value);
		const comparison = {
			current: { ...state.current },
			next: { ...state.next }
		};
		router.replace({
			url: url.pathname + url.search + url.hash,
			preserveScroll: true,
			preserveState: true,
			props: (props) => ({
				...props,
				state: comparison
			})
		});
	}
	function scheduleUrl() {
		if (options.writeUrl !== true || typeof window === "undefined") return;
		if (timer !== void 0) clearTimeout(timer);
		timer = setTimeout(writeUrl, delay);
	}
	function update(next) {
		if (!same(state, next)) {
			replace(next);
			scheduleUrl();
		}
		fromVehicle.value = false;
	}
	(0, vue_exports.watch)(options.prefill, (prefill) => {
		const s = fromPrefill(prefill);
		if (s !== null) {
			replace({
				current: s,
				next: wider(s)
			});
			fromVehicle.value = true;
			scheduleUrl();
		}
	});
	let offFirstPage;
	(0, vue_exports.onMounted)(() => {
		delay = parseMs(getComputedStyle(document.documentElement).getPropertyValue("--d-2")) ?? delay;
		const stale = () => new URLSearchParams(window.location.search).get("rechner") !== shareParam.value;
		if (options.writeUrl === true && stale()) {
			writeUrl();
			offFirstPage = router.on("navigate", () => {
				offFirstPage?.();
				offFirstPage = void 0;
				if (stale()) writeUrl();
			});
		}
	});
	(0, vue_exports.onBeforeUnmount)(() => {
		offFirstPage?.();
		if (timer !== void 0) clearTimeout(timer);
	});
	return {
		state,
		update,
		change,
		sentences,
		lines,
		shareParam,
		fromVehicle,
		prefillLine
	};
}
//#endregion
//#region resources/js/lib/rechner.ts
function steps(from, to, step) {
	return Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => Math.round((from + i * step) * 10) / 10);
}
steps(5.5, 12, .5);
steps(13, 24, 1);
steps(135, 355, 10);
steps(25, 85, 5);
/**
* The line under every result, on every surface: the figures are arithmetic, and it points at the
* papers that decide (ACCURACY.md §6). No liability wording of our own (finding #52): that comes
* from the Kanzlei or not at all. It names no verdict — the calculator never judges a size. The
* field numbers are the KBA's for the Zulassungsbescheinigung Teil I (accuracy-research-motec §3e);
* the CoC's item numbers are left out because older CoC formats could not be verified.
*/
var DISCLAIMER = "Rechenwerte ersetzen kein Gutachten. Welche Rad- und Reifengrößen für dein Auto gelten, steht in der Zulassungsbescheinigung Teil I (Felder 15.1 und 15.2), im CoC-Papier, in der Reifenfreigabe und im Gutachten oder in der ABE der Felge.";
//#endregion
export { EtCalculator_default as a, OffsetDrawing_default as i, useEtRechner as n, RechnerShare_default as r, DISCLAIMER as t };
