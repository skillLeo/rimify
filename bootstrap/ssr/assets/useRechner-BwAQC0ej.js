import { c as vue_exports } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { i as TabsRoot_default, n as TabsList_default, r as TabsContent_default, t as TabsTrigger_default } from "./TabsTrigger-BwP2oefZ.js";
import { _ as rearScene, a as outerSentence, b as wholeMmText, c as speedSentence, d as FAUSTREGEL_MAX_PERCENT, f as FAUSTREGEL_MIN_PERCENT, g as rearFrame, h as percentText, i as innerSentence, l as speedoAdjust, m as felgenModel, n as IMPLAUSIBLE, o as sizeFigures, p as REAR, r as R39_NOTE, s as sizeSentence, t as ValueText_default, u as speedoDirection, v as rimSuitsTyre, w as withUnit, x as decimal, y as signedText } from "./ValueText-CkuszrcW.js";
//#region resources/js/lib/rechner.ts
/**
* The Felgenrechner's state: what the form offers, what it starts with, and how a comparison
* travels in a URL (`?rechner=7.5x17-45-225-45_8.5x19-35-225-35`). Shared by the homepage teaser,
* both documents of /felgenrechner and their tests, so no surface can accept a figure another
* would refuse.
*
* The rule for anything that arrives from outside — a prefill from the database, a shared link —
* is the same: only a figure the form itself offers is ever applied. Everything else is ignored
* and the defaults stand (CLAUDE.md §2: fail closed).
*/
function steps(from, to, step) {
	return Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => Math.round((from + i * step) * 10) / 10);
}
var RIM_WIDTHS_IN = steps(5.5, 12, .5);
var DIAMETERS_IN = steps(13, 24, 1);
var TYRE_WIDTHS_MM = steps(135, 355, 10);
var ASPECTS = steps(25, 85, 5);
var OPTIONS = {
	widthIn: RIM_WIDTHS_IN,
	diameterIn: DIAMETERS_IN,
	tyreWidthMm: TYRE_WIDTHS_MM,
	aspect: ASPECTS
};
var SIDES = [{
	key: "current",
	label: "Aktuell"
}, {
	key: "next",
	label: "Neu"
}];
var DEFAULT_STATE = {
	current: {
		widthIn: 7.5,
		diameterIn: 17,
		etMm: 45,
		tyreWidthMm: 225,
		aspect: 45
	},
	next: {
		widthIn: 8.5,
		diameterIn: 19,
		etMm: 35,
		tyreWidthMm: 225,
		aspect: 35
	}
};
/**
* The line under every result, on every surface: the figures are arithmetic, and it points at the
* papers that decide (ACCURACY.md §6). No liability wording of our own (finding #52): that comes
* from the Kanzlei or not at all. It names no verdict — the calculator never judges a size. The
* field numbers are the KBA's for the Zulassungsbescheinigung Teil I (accuracy-research-motec §3e);
* the CoC's item numbers are left out because older CoC formats could not be verified.
*/
var DISCLAIMER = "Rechenwerte ersetzen kein Gutachten. Welche Rad- und Reifengrößen für dein Auto gelten, steht in der Zulassungsbescheinigung Teil I (Felder 15.1 und 15.2), im CoC-Papier, in der Reifenfreigabe und im Gutachten oder in der ABE der Felge.";
function isEt(value) {
	return Number.isInteger(value) && value >= -30 && value <= 70;
}
function isSetup(s) {
	return RIM_WIDTHS_IN.includes(s.widthIn) && DIAMETERS_IN.includes(s.diameterIn) && isEt(s.etMm) && TYRE_WIDTHS_MM.includes(s.tyreWidthMm) && ASPECTS.includes(s.aspect);
}
function isState(state) {
	return state !== null && state !== void 0 && isSetup(state.current) && isSetup(state.next);
}
function cloneState(state) {
	return {
		current: { ...state.current },
		next: { ...state.next }
	};
}
function sameSetup(a, b) {
	return a.widthIn === b.widthIn && a.diameterIn === b.diameterIn && a.etMm === b.etMm && a.tyreWidthMm === b.tyreWidthMm && a.aspect === b.aspect;
}
function sameState(a, b) {
	return sameSetup(a.current, b.current) && sameSetup(a.next, b.next);
}
/**
* The server's prefill as a setup — the smallest size a published Gutachten names for the chosen
* vehicle, not its factory size (finding C3) — or null when it is not one the form offers.
*/
function fromPrefill(p) {
	if (p === null || p === void 0) return null;
	const s = {
		widthIn: p.widthIn,
		diameterIn: p.diameterIn,
		etMm: p.etMm,
		tyreWidthMm: p.tyreWidth,
		aspect: p.aspect
	};
	return isSetup(s) ? s : null;
}
/**
* `W x D - ET - TW - A` for one side, the two sides joined by `_`. The same pattern the server's
* `FelgenrechnerRequest` accepts; a shared link never puts a value into the calculator that the
* calculator could not have produced itself.
*/
var SHARE_PATTERN = /^(\d+(?:\.\d)?)x(\d{2})-(-?\d{1,2})-(\d{3})-(\d{2})$/;
function encodeSetup(s) {
	return `${s.widthIn}x${s.diameterIn}-${s.etMm}-${s.tyreWidthMm}-${s.aspect}`;
}
function decodeSetup(text) {
	const m = SHARE_PATTERN.exec(text);
	if (m === null) return null;
	const s = {
		widthIn: Number(m[1]),
		diameterIn: Number(m[2]),
		etMm: Number(m[3]),
		tyreWidthMm: Number(m[4]),
		aspect: Number(m[5])
	};
	return isSetup(s) ? s : null;
}
function encodeState(state) {
	return `${encodeSetup(state.current)}_${encodeSetup(state.next)}`;
}
function decodeState(param) {
	if (typeof param !== "string") return null;
	const parts = param.split("_");
	if (parts.length !== 2) return null;
	const current = decodeSetup(parts[0] ?? "");
	const next = decodeSetup(parts[1] ?? "");
	return current !== null && next !== null ? {
		current,
		next
	} : null;
}
/** The full page, carrying this comparison. */
function felgenrechnerHref(state) {
	return `/felgenrechner?rechner=${encodeState(state)}`;
}
/** `7,5J` · `8J` — the width figure as R-10 and the server's `GermanFormat::rimWidth()` write it. */
function jLabel(widthIn) {
	return `${decimal(widthIn, Number.isInteger(widthIn) ? 0 : 1)}J`;
}
/** `ET 45` · `ET −10` — a real minus sign, a narrow no-break space. */
function etLabel(etMm) {
	return `ET ${etMm < 0 ? `−${Math.abs(etMm)}` : etMm}`;
}
/** `225/45 R17` */
function tyreLabel(s) {
	return `${s.tyreWidthMm}/${s.aspect} R${s.diameterIn}`;
}
/** `7,5J × 17 · ET 45 · 225/45 R17` — one setup in one line. */
function setupLine(s) {
	return `${jLabel(s.widthIn)} × ${s.diameterIn} · ${etLabel(s.etMm)} · ${tyreLabel(s)}`;
}
//#endregion
//#region resources/js/Components/Ui/ClearanceDrawing.vue?vue&type=script&setup=true&lang.ts
var ClearanceDrawing_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ClearanceDrawing",
	__ssrInlineRender: true,
	props: {
		current: {},
		next: {}
	},
	setup(__props) {
		/**
		* The clearance drawing (signature moment 4): one wheel in its wheel arch, seen from behind — what
		* you see standing behind the car looking at a rear wheel. Across is sideways, inside (the strut,
		* *Federbein*) on the left and outside (the fender, *Kotflügel*) on the right; up is height.
		*
		* - The tyre is a rounded shape as wide as its nominal section width and as high as the tyre; the
		*   rim inside it is as wide as the rim and as high as its diameter. Both wheels are drawn to one
		*   true scale, so a bigger tyre looks bigger.
		* - The mounting face (Anlagefläche, dash-dot) is the car's: one line for both wheels. A positive
		*   ET puts the rim's centre plane that far inboard of it; the tyre is centred on that plane.
		* - The strut and the fender are schematic (their place depends on the car) and the same for both.
		* - The current wheel is dashed, the new one solid and tinted.
		* - Two arrows under the wheels run from each current rim edge to the new one, exactly as long as
		*   the model's shift; an edge that moves by no whole millimetre has no arrow and reads
		*   *unverändert*.
		*
		* Everything is generated by `lib/felgenGeometry` (`rearScene`) from the same `FelgenModel` whose
		* texts are the labels (ACCURACY.md §6). The labels are HTML: the part names in a row above the
		* sheet, split between the strut and the fender; each arrow's label in a row of its own below it,
		* at the arrow's middle, shifted by the same fraction of its own width (`left: f; translateX(−f)`).
		* So a label stays inside the drawing's width, may wrap, and can never overlap another label or
		* the drawing, at any width. Ink and line colours only: nothing here is a verdict.
		*
		* A tyre and a rim that do not belong together (`implausible`) are not drawn at all — the results
		* say so in a sentence instead.
		*
		* Motion: when a value changes, the two wheels' numbers are tweened over `--d-2` with `--ease-std`
		* in a requestAnimationFrame loop and the scene is rebuilt from the in-between numbers. Labels and
		* the aria-label read the target values straight away. Under reduced motion, and on the server,
		* the drawing rests in its end state.
		*/
		const props = __props;
		const model = (0, vue_exports.computed)(() => felgenModel(props.current, props.next));
		const plausible = (0, vue_exports.computed)(() => model.value.implausible.length === 0);
		const target = (0, vue_exports.computed)(() => rearFrame(model.value));
		const SIDE_KEYS = ["current", "next"];
		const FRAME_KEYS = [
			"centreX",
			"tyreWidthMm",
			"diameterMm",
			"rimWidthMm",
			"rimDiameterMm"
		];
		function cloneFrame(f) {
			return {
				current: { ...f.current },
				next: { ...f.next }
			};
		}
		function sameFrame(a, b) {
			return SIDE_KEYS.every((side) => FRAME_KEYS.every((key) => a[side][key] === b[side][key]));
		}
		function lerpFrame(from, to, t) {
			const out = cloneFrame(to);
			for (const side of SIDE_KEYS) for (const key of FRAME_KEYS) out[side][key] = from[side][key] + (to[side][key] - from[side][key]) * t;
			return out;
		}
		/** The CSS timing function as a number-to-number function (the usual Newton–Raphson on x). */
		function cubicBezier(x1, y1, x2, y2) {
			const a = (p1, p2) => 1 - 3 * p2 + 3 * p1;
			const b = (p1, p2) => 3 * p2 - 6 * p1;
			const c = (p1) => 3 * p1;
			const at = (t, p1, p2) => ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t;
			const slope = (t, p1, p2) => 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1);
			return (x) => {
				if (x <= 0) return 0;
				if (x >= 1) return 1;
				let t = x;
				for (let i = 0; i < 8; i++) {
					const dx = at(t, x1, x2) - x;
					const d = slope(t, x1, x2);
					if (Math.abs(dx) < 1e-5 || d === 0) break;
					t -= dx / d;
				}
				return at(t, y1, y2);
			};
		}
		function parseMs(value) {
			const match = /^\s*([\d.]+)\s*(ms|s)\s*$/.exec(value);
			if (match === null || match[1] === void 0) return null;
			const n = Number(match[1]);
			return Number.isFinite(n) ? match[2] === "s" ? n * 1e3 : n : null;
		}
		function parseBezier(value) {
			const parts = /cubic-bezier\(([^)]+)\)/.exec(value)?.[1]?.split(",").map((v) => Number(v.trim())) ?? [];
			if (parts.length !== 4 || parts.some((v) => !Number.isFinite(v))) return null;
			return cubicBezier(parts[0], parts[1], parts[2], parts[3]);
		}
		const frame = (0, vue_exports.ref)(cloneFrame(target.value));
		const motion = (0, vue_exports.ref)(false);
		let raf = 0;
		let duration = 200;
		let ease = cubicBezier(.4, 0, .2, 1);
		(0, vue_exports.onMounted)(() => {
			motion.value = !(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
			const style = getComputedStyle(document.documentElement);
			duration = parseMs(style.getPropertyValue("--d-2")) ?? duration;
			ease = parseBezier(style.getPropertyValue("--ease-std")) ?? ease;
		});
		function stop() {
			if (raf !== 0 && typeof cancelAnimationFrame === "function") cancelAnimationFrame(raf);
			raf = 0;
		}
		(0, vue_exports.watch)(target, (to) => {
			if (sameFrame(to, frame.value)) return;
			stop();
			if (!motion.value || !plausible.value || typeof requestAnimationFrame !== "function") {
				frame.value = cloneFrame(to);
				return;
			}
			const from = cloneFrame(frame.value);
			const started = performance.now();
			const step = (now) => {
				const t = Math.min(1, (now - started) / duration);
				frame.value = lerpFrame(from, to, ease(t));
				raf = t < 1 ? requestAnimationFrame(step) : 0;
			};
			raf = requestAnimationFrame(step);
		});
		(0, vue_exports.onBeforeUnmount)(stop);
		const scene = (0, vue_exports.computed)(() => rearScene(frame.value, model.value));
		const resting = (0, vue_exports.computed)(() => rearScene(target.value, model.value));
		function clampPercent(fraction) {
			return Math.round(Math.min(Math.max(fraction, 0), 1) * 1e3) / 10;
		}
		/** `left: f; translateX(−f)` keeps a label inside its row with its anchor inside the label. */
		function at(fraction) {
			const f = clampPercent(fraction);
			return {
				left: `${f}%`,
				transform: `translateX(-${f}%)`
			};
		}
		const parts = (0, vue_exports.computed)(() => {
			const strut = resting.value.strut.anchor;
			const fender = resting.value.fender.anchor;
			const split = (strut + fender) / 2;
			return {
				row: { gridTemplateColumns: `${clampPercent(split)}% minmax(0, 1fr)` },
				strut: at(strut / split),
				fender: at((fender - split) / (1 - split))
			};
		});
		const labels = (0, vue_exports.computed)(() => ({
			outer: at(resting.value.outer.anchor),
			inner: at(resting.value.inner.anchor)
		}));
		const legend = (0, vue_exports.computed)(() => ({
			current: setupLine(props.current),
			next: setupLine(props.next)
		}));
		const description = (0, vue_exports.computed)(() => `Blick von hinten auf ein Rad im Radhaus, rechnerisch. ${model.value.outer.text}. ${model.value.inner.text}. Federbein und Kotflügel schematisch.`);
		return (_ctx, _push, _parent, _attrs) => {
			if (plausible.value) {
				_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
					class: "cd",
					role: "img",
					"aria-label": description.value
				}, _attrs))} data-v-996470db><div class="cd__stage" data-v-996470db><p class="cd__view small" data-v-996470db>Blick von hinten auf ein Rad im Radhaus</p><div class="cd__parts" style="${(0, server_renderer_exports.ssrRenderStyle)(parts.value.row)}" data-v-996470db><span class="cd__cell" data-v-996470db><span class="cd__part micro" data-part="strut" style="${(0, server_renderer_exports.ssrRenderStyle)(parts.value.strut)}" data-v-996470db>← innen · Federbein</span></span><span class="cd__cell" data-v-996470db><span class="cd__part micro" data-part="fender" style="${(0, server_renderer_exports.ssrRenderStyle)(parts.value.fender)}" data-v-996470db>Kotflügel · außen →</span></span></div><p class="cd__note micro quiet" data-v-996470db>Federbein und Kotflügel: Lage schematisch – je nach Fahrzeug</p><div class="cd__sheet" data-v-996470db><svg class="cd__svg"${(0, server_renderer_exports.ssrRenderAttr)("viewBox", `0 0 ${(0, vue_exports.unref)(REAR).width} ${(0, vue_exports.unref)(REAR).height}`)}${(0, server_renderer_exports.ssrRenderAttr)("data-units-per-mm", scene.value.unitsPerMm)} aria-hidden="true" focusable="false" data-v-996470db><g class="cd__car" data-v-996470db><rect class="cd__line cd__schematic" data-part="strut"${(0, server_renderer_exports.ssrRenderAttr)("x", scene.value.strut.tube.x)}${(0, server_renderer_exports.ssrRenderAttr)("y", scene.value.strut.tube.y)}${(0, server_renderer_exports.ssrRenderAttr)("width", scene.value.strut.tube.width)}${(0, server_renderer_exports.ssrRenderAttr)("height", scene.value.strut.tube.height)} data-v-996470db></rect><path class="cd__line cd__spring"${(0, server_renderer_exports.ssrRenderAttr)("d", scene.value.strut.spring)} data-v-996470db></path><path class="cd__line cd__schematic" data-part="fender"${(0, server_renderer_exports.ssrRenderAttr)("d", scene.value.fender.path)} data-v-996470db></path></g><path class="cd__ring"${(0, server_renderer_exports.ssrRenderAttr)("d", scene.value.next.ring)} fill-rule="evenodd" data-v-996470db></path><g class="old" data-wheel="current" data-v-996470db><rect class="cd__line cd__old cd__tyre"${(0, server_renderer_exports.ssrRenderAttr)("x", scene.value.current.tyre.x)}${(0, server_renderer_exports.ssrRenderAttr)("y", scene.value.current.tyre.y)}${(0, server_renderer_exports.ssrRenderAttr)("width", scene.value.current.tyre.width)}${(0, server_renderer_exports.ssrRenderAttr)("height", scene.value.current.tyre.height)}${(0, server_renderer_exports.ssrRenderAttr)("rx", scene.value.current.tyre.r)} data-v-996470db></rect><rect class="cd__line cd__old cd__rim"${(0, server_renderer_exports.ssrRenderAttr)("x", scene.value.current.rim.x)}${(0, server_renderer_exports.ssrRenderAttr)("y", scene.value.current.rim.y)}${(0, server_renderer_exports.ssrRenderAttr)("width", scene.value.current.rim.width)}${(0, server_renderer_exports.ssrRenderAttr)("height", scene.value.current.rim.height)} data-v-996470db></rect></g><g class="new" data-wheel="next" data-v-996470db><rect class="cd__line cd__new cd__tyre"${(0, server_renderer_exports.ssrRenderAttr)("x", scene.value.next.tyre.x)}${(0, server_renderer_exports.ssrRenderAttr)("y", scene.value.next.tyre.y)}${(0, server_renderer_exports.ssrRenderAttr)("width", scene.value.next.tyre.width)}${(0, server_renderer_exports.ssrRenderAttr)("height", scene.value.next.tyre.height)}${(0, server_renderer_exports.ssrRenderAttr)("rx", scene.value.next.tyre.r)} data-v-996470db></rect><rect class="cd__line cd__new cd__rim"${(0, server_renderer_exports.ssrRenderAttr)("x", scene.value.next.rim.x)}${(0, server_renderer_exports.ssrRenderAttr)("y", scene.value.next.rim.y)}${(0, server_renderer_exports.ssrRenderAttr)("width", scene.value.next.rim.width)}${(0, server_renderer_exports.ssrRenderAttr)("height", scene.value.next.rim.height)} data-v-996470db></rect></g><path class="cd__line cd__face"${(0, server_renderer_exports.ssrRenderAttr)("d", scene.value.face)} data-v-996470db></path>`);
				if (scene.value.outer.extFrom) _push(`<path class="cd__line cd__ext cd__ext--old" data-dim="outer"${(0, server_renderer_exports.ssrRenderAttr)("d", scene.value.outer.extFrom)} data-v-996470db></path>`);
				else _push(`<!---->`);
				if (scene.value.outer.extTo) _push(`<path class="cd__line cd__ext" data-dim="outer"${(0, server_renderer_exports.ssrRenderAttr)("d", scene.value.outer.extTo)} data-v-996470db></path>`);
				else _push(`<!---->`);
				if (scene.value.inner.extFrom) _push(`<path class="cd__line cd__ext cd__ext--old" data-dim="inner"${(0, server_renderer_exports.ssrRenderAttr)("d", scene.value.inner.extFrom)} data-v-996470db></path>`);
				else _push(`<!---->`);
				if (scene.value.inner.extTo) _push(`<path class="cd__line cd__ext" data-dim="inner"${(0, server_renderer_exports.ssrRenderAttr)("d", scene.value.inner.extTo)} data-v-996470db></path>`);
				else _push(`<!---->`);
				if (scene.value.outer.shaft) _push(`<path class="cd__line cd__dim" data-dim="outer"${(0, server_renderer_exports.ssrRenderAttr)("d", scene.value.outer.shaft)} data-v-996470db></path>`);
				else _push(`<!---->`);
				if (scene.value.inner.shaft) _push(`<path class="cd__line cd__dim" data-dim="inner"${(0, server_renderer_exports.ssrRenderAttr)("d", scene.value.inner.shaft)} data-v-996470db></path>`);
				else _push(`<!---->`);
				if (scene.value.outer.head) _push(`<path class="cd__head" data-dim="outer"${(0, server_renderer_exports.ssrRenderAttr)("d", scene.value.outer.head)} data-v-996470db></path>`);
				else _push(`<!---->`);
				if (scene.value.inner.head) _push(`<path class="cd__head" data-dim="inner"${(0, server_renderer_exports.ssrRenderAttr)("d", scene.value.inner.head)} data-v-996470db></path>`);
				else _push(`<!---->`);
				_push(`</svg></div><div class="cd__row" data-v-996470db><span class="cd__label micro" data-dim="outer" style="${(0, server_renderer_exports.ssrRenderStyle)(labels.value.outer)}" data-v-996470db>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: model.value.outer.text }, null, _parent));
				_push(`</span></div><div class="cd__row" data-v-996470db><span class="cd__label micro" data-dim="inner" style="${(0, server_renderer_exports.ssrRenderStyle)(labels.value.inner)}" data-v-996470db>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: model.value.inner.text }, null, _parent));
				_push(`</span></div></div><div class="cd__legend micro muted" data-v-996470db><span class="cd__key" data-key="current" data-v-996470db><svg class="cd__swatch" viewBox="0 0 32 8" width="32" height="8" aria-hidden="true" focusable="false" data-v-996470db><path class="cd__line cd__old" d="M0 4 H32" data-v-996470db></path></svg><span data-v-996470db>bisher `);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: legend.value.current }, null, _parent));
				_push(`</span></span><span class="cd__key" data-key="next" data-v-996470db><svg class="cd__swatch" viewBox="0 0 32 8" width="32" height="8" aria-hidden="true" focusable="false" data-v-996470db><path class="cd__line cd__new" d="M0 4 H32" data-v-996470db></path></svg><span data-v-996470db>neu `);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: legend.value.next }, null, _parent));
				_push(`</span></span><span class="cd__key" data-key="face" data-v-996470db><svg class="cd__swatch" viewBox="0 0 32 8" width="32" height="8" aria-hidden="true" focusable="false" data-v-996470db><path class="cd__line cd__face" d="M0 4 H32" data-v-996470db></path></svg><span data-v-996470db>Anlagefläche: hier wird die Felge angeschraubt</span></span></div><p class="cd__caption micro quiet" data-v-996470db>Rad und Reifen maßstäblich, beide im selben Maßstab. Werte rechnerisch, auf ganze Millimeter gerundet.</p></div>`);
			} else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/ClearanceDrawing.vue
var _sfc_setup$3 = ClearanceDrawing_vue_vue_type_script_setup_true_lang_default.setup;
ClearanceDrawing_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/ClearanceDrawing.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var ClearanceDrawing_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ClearanceDrawing_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-996470db"]]);
//#endregion
//#region resources/js/Components/Home/FitmentCalculator.vue?vue&type=script&setup=true&lang.ts
var SELECT_ERROR = "Bitte einen Wert aus der Liste wählen.";
var FitmentCalculator_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "FitmentCalculator",
	__ssrInlineRender: true,
	props: {
		modelValue: {},
		layout: { default: "row" },
		prefilled: {
			type: Boolean,
			default: false
		}
	},
	emits: ["update:modelValue", "update:valid"],
	setup(__props, { emit: __emit }) {
		/**
		* The Felgenrechner's form: two setups, Aktuell and Neu, five figures each. It owns nothing but
		* the controls — the state lives in `useRechner`, the geometry in `lib/felgenGeometry`, the
		* drawing and the results in their own components — and it hands a comparison up only when every
		* figure is one it offers itself. An ET outside −30 … 70 is explained under its field and never
		* computed with: the parent keeps the last valid comparison and shows a dash meanwhile.
		*
		* Three layouts, one component, chosen by the surface:
		* - `row` (the homepage teaser, desktop): two fieldsets side by side, five fields in a row each;
		* - `table` (/felgenrechner, desktop): the compact table — the label at the left, the two
		*   controls beside it, five rows;
		* - `tabs` (both phone documents): Aktuell · Neu as tabs, the five fields two abreast.
		*
		* Every control is at least 16 px (`.input`), has a visible label or a row-and-column name, and
		* validates on blur. Every control is `translate="no"`: its options are figures (`8,5J`,
		* `17 Zoll`, `225 mm`), and a page translator once turned "5,5 J" into "5.5 years".
		*/
		const props = __props;
		const emit = __emit;
		const FIELDS = [
			{
				key: "widthIn",
				short: "Breite",
				long: "Felgenbreite",
				option: jLabel
			},
			{
				key: "diameterIn",
				short: "Durchmesser",
				long: "Durchmesser",
				option: (v) => withUnit(v, "Zoll")
			},
			{
				key: "etMm",
				short: "ET",
				long: "Einpresstiefe (ET)",
				option: String
			},
			{
				key: "tyreWidthMm",
				short: "Reifenbreite",
				long: "Reifenbreite",
				option: (v) => withUnit(v, "mm")
			},
			{
				key: "aspect",
				short: "Querschnitt",
				long: "Querschnitt",
				option: (v) => withUnit(v, "%")
			}
		];
		const label = (field) => props.layout === "row" ? field.short : field.long;
		const ET_ERROR = `Die Einpresstiefe liegt zwischen ${(-30).toString().replace("-", "−")} und 70 mm.`;
		const local = (0, vue_exports.reactive)(cloneState(props.modelValue));
		const etText = (0, vue_exports.reactive)({
			current: String(local.current.etMm),
			next: String(local.next.etMm)
		});
		const errors = (0, vue_exports.reactive)({
			current: {},
			next: {}
		});
		function parseEt(text) {
			const t = text.trim().replace("−", "-");
			if (!/^-?\d{1,2}$/.test(t)) return null;
			const n = Number(t);
			return isEt(n) ? n : null;
		}
		const valid = (0, vue_exports.computed)(() => isSetup(local.current) && isSetup(local.next) && parseEt(etText.current) !== null && parseEt(etText.next) !== null);
		(0, vue_exports.watch)(() => props.modelValue, (next) => {
			if (sameState(next, local)) return;
			Object.assign(local.current, next.current);
			Object.assign(local.next, next.next);
			etText.current = String(next.current.etMm);
			etText.next = String(next.next.etMm);
			errors.current = {};
			errors.next = {};
			emit("update:valid", true);
		}, { deep: true });
		function commit() {
			emit("update:valid", valid.value);
			if (valid.value) emit("update:modelValue", cloneState(local));
		}
		function onSelect(side, field) {
			errors[side][field] = OPTIONS[field].includes(local[side][field]) ? void 0 : SELECT_ERROR;
			commit();
		}
		function onEtChange(side, event) {
			const text = event.target.value;
			etText[side] = text;
			const n = parseEt(text);
			if (n !== null) local[side].etMm = n;
			errors[side].etMm = n === null ? ET_ERROR : void 0;
			commit();
		}
		function validateEt(side) {
			errors[side].etMm = parseEt(etText[side]) === null ? ET_ERROR : void 0;
		}
		function isInvalid(side, field) {
			return errors[side][field] ? "true" : void 0;
		}
		function prefilledAttr(side) {
			return props.prefilled && side === "current" ? "true" : void 0;
		}
		const uid = (0, vue_exports.useId)();
		function fid(side, field) {
			return `${uid}-${side}-${field}`;
		}
		function eid(side, field) {
			return `${fid(side, field)}-error`;
		}
		/** The table's row labels and column heads, referenced by every control's `aria-labelledby`. */
		function rid(field) {
			return `${uid}-row-${field}`;
		}
		function hid(side) {
			return `${uid}-head-${side}`;
		}
		const tab = (0, vue_exports.ref)("current");
		const setup = (side) => local[side];
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<form${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: ["calc-form", `calc-form--${__props.layout}`],
				novalidate: ""
			}, _attrs))} data-v-7ff38246>`);
			if (__props.layout === "table") {
				_push(`<div class="calc-form__table" role="group" aria-label="Aktuelle und neue Größe" data-v-7ff38246><span class="calc-form__corner" aria-hidden="true" data-v-7ff38246></span><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(SIDES), (side) => {
					_push(`<span${(0, server_renderer_exports.ssrRenderAttr)("id", hid(side.key))} class="label calc-form__head" data-v-7ff38246>${(0, server_renderer_exports.ssrInterpolate)(side.label)}</span>`);
				});
				_push(`<!--]--><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(FIELDS, (field) => {
					_push(`<!--[--><span${(0, server_renderer_exports.ssrRenderAttr)("id", rid(field.key))} class="label calc-form__row-label" data-v-7ff38246>${(0, server_renderer_exports.ssrInterpolate)(label(field))}</span><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(SIDES), (side) => {
						_push(`<span class="input-group calc-form__cell" data-v-7ff38246>`);
						if (field.key === "etMm") _push(`<input${(0, server_renderer_exports.ssrRenderAttr)("id", fid(side.key, field.key))} class="input num calc-form__et" translate="no" type="number"${(0, server_renderer_exports.ssrRenderAttr)("min", (0, vue_exports.unref)(-30))}${(0, server_renderer_exports.ssrRenderAttr)("max", (0, vue_exports.unref)(70))} step="1" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("value", etText[side.key])}${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `${rid(field.key)} ${hid(side.key)}`)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", isInvalid(side.key, field.key))}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", eid(side.key, field.key))}${(0, server_renderer_exports.ssrRenderAttr)("data-prefilled", prefilledAttr(side.key))} data-v-7ff38246>`);
						else {
							_push(`<select${(0, server_renderer_exports.ssrRenderAttr)("id", fid(side.key, field.key))} class="input num" translate="no"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `${rid(field.key)} ${hid(side.key)}`)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", isInvalid(side.key, field.key))}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", eid(side.key, field.key))}${(0, server_renderer_exports.ssrRenderAttr)("data-prefilled", prefilledAttr(side.key))} data-v-7ff38246><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(OPTIONS)[field.key], (option) => {
								_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", option)} data-v-7ff38246${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(setup(side.key)[field.key]) ? (0, server_renderer_exports.ssrLooseContain)(setup(side.key)[field.key], option) : (0, server_renderer_exports.ssrLooseEqual)(setup(side.key)[field.key], option)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(field.option(option))}</option>`);
							});
							_push(`<!--]--></select>`);
						}
						if (field.key === "etMm") _push(`<span class="input-group__suffix" aria-hidden="true" translate="no" data-v-7ff38246>mm</span>`);
						else _push(`<!---->`);
						_push(`</span>`);
					});
					_push(`<!--]--><div class="calc-form__errors" data-v-7ff38246><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(SIDES), (side) => {
						_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", eid(side.key, field.key))} class="form-field__error" data-v-7ff38246>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: errors[side.key][field.key] ?? "" }, null, _parent));
						_push(`</p>`);
					});
					_push(`<!--]--></div><!--]-->`);
				});
				_push(`<!--]--></div>`);
			} else if (__props.layout === "row") {
				_push(`<div class="calc-row" data-v-7ff38246><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(SIDES), (side) => {
					_push(`<fieldset class="calc-form__set" data-v-7ff38246><legend class="label calc-form__legend" data-v-7ff38246>${(0, server_renderer_exports.ssrInterpolate)(side.label)}</legend><div class="calc-form__fields" data-v-7ff38246><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(FIELDS, (field) => {
						_push(`<div class="form-field" data-v-7ff38246><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", fid(side.key, field.key))} data-v-7ff38246>${(0, server_renderer_exports.ssrInterpolate)(label(field))}</label><span class="input-group" data-v-7ff38246>`);
						if (field.key === "etMm") _push(`<input${(0, server_renderer_exports.ssrRenderAttr)("id", fid(side.key, field.key))} class="input num calc-form__et" translate="no" type="number"${(0, server_renderer_exports.ssrRenderAttr)("min", (0, vue_exports.unref)(-30))}${(0, server_renderer_exports.ssrRenderAttr)("max", (0, vue_exports.unref)(70))} step="1" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("value", etText[side.key])}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", isInvalid(side.key, field.key))}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", eid(side.key, field.key))}${(0, server_renderer_exports.ssrRenderAttr)("data-prefilled", prefilledAttr(side.key))} data-v-7ff38246>`);
						else {
							_push(`<select${(0, server_renderer_exports.ssrRenderAttr)("id", fid(side.key, field.key))} class="input num" translate="no"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", isInvalid(side.key, field.key))}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", eid(side.key, field.key))}${(0, server_renderer_exports.ssrRenderAttr)("data-prefilled", prefilledAttr(side.key))} data-v-7ff38246><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(OPTIONS)[field.key], (option) => {
								_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", option)} data-v-7ff38246${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(setup(side.key)[field.key]) ? (0, server_renderer_exports.ssrLooseContain)(setup(side.key)[field.key], option) : (0, server_renderer_exports.ssrLooseEqual)(setup(side.key)[field.key], option)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(field.option(option))}</option>`);
							});
							_push(`<!--]--></select>`);
						}
						if (field.key === "etMm") _push(`<span class="input-group__suffix" aria-hidden="true" translate="no" data-v-7ff38246>mm</span>`);
						else _push(`<!---->`);
						_push(`</span><p${(0, server_renderer_exports.ssrRenderAttr)("id", eid(side.key, field.key))} class="form-field__error" data-v-7ff38246>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: errors[side.key][field.key] ?? "" }, null, _parent));
						_push(`</p></div>`);
					});
					_push(`<!--]--></div></fieldset>`);
				});
				_push(`<!--]--></div>`);
			} else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsRoot_default), {
				modelValue: tab.value,
				"onUpdate:modelValue": ($event) => tab.value = $event,
				class: "calc-form__tabs"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsList_default), {
							class: "tabs__list",
							"aria-label": "Aktuelle oder neue Größe"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<!--[-->`);
									(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(SIDES), (side) => {
										_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsTrigger_default), {
											key: side.key,
											value: side.key,
											class: "tabs__trigger"
										}, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(side.label)}`);
												else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(side.label), 1)];
											}),
											_: 2
										}, _parent, _scopeId));
									});
									_push(`<!--]-->`);
								} else return [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)((0, vue_exports.unref)(SIDES), (side) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(TabsTrigger_default), {
										key: side.key,
										value: side.key,
										class: "tabs__trigger"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(side.label), 1)]),
										_: 2
									}, 1032, ["value"]);
								}), 128))];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(SIDES), (side) => {
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsContent_default), {
								key: side.key,
								value: side.key,
								class: "tabs__content calc-form__fields calc-form__fields--two"
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										_push(`<!--[-->`);
										(0, server_renderer_exports.ssrRenderList)(FIELDS, (field) => {
											_push(`<div class="form-field" data-v-7ff38246${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", fid(side.key, field.key))} data-v-7ff38246${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(label(field))}</label><span class="input-group" data-v-7ff38246${_scopeId}>`);
											if (field.key === "etMm") _push(`<input${(0, server_renderer_exports.ssrRenderAttr)("id", fid(side.key, field.key))} class="input num calc-form__et" translate="no" type="number"${(0, server_renderer_exports.ssrRenderAttr)("min", (0, vue_exports.unref)(-30))}${(0, server_renderer_exports.ssrRenderAttr)("max", (0, vue_exports.unref)(70))} step="1" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("value", etText[side.key])}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", isInvalid(side.key, field.key))}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", eid(side.key, field.key))}${(0, server_renderer_exports.ssrRenderAttr)("data-prefilled", prefilledAttr(side.key))} data-v-7ff38246${_scopeId}>`);
											else {
												_push(`<select${(0, server_renderer_exports.ssrRenderAttr)("id", fid(side.key, field.key))} class="input num" translate="no"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", isInvalid(side.key, field.key))}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", eid(side.key, field.key))}${(0, server_renderer_exports.ssrRenderAttr)("data-prefilled", prefilledAttr(side.key))} data-v-7ff38246${_scopeId}><!--[-->`);
												(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(OPTIONS)[field.key], (option) => {
													_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", option)} data-v-7ff38246${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(setup(side.key)[field.key]) ? (0, server_renderer_exports.ssrLooseContain)(setup(side.key)[field.key], option) : (0, server_renderer_exports.ssrLooseEqual)(setup(side.key)[field.key], option)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(field.option(option))}</option>`);
												});
												_push(`<!--]--></select>`);
											}
											if (field.key === "etMm") _push(`<span class="input-group__suffix" aria-hidden="true" translate="no" data-v-7ff38246${_scopeId}>mm</span>`);
											else _push(`<!---->`);
											_push(`</span><p${(0, server_renderer_exports.ssrRenderAttr)("id", eid(side.key, field.key))} class="form-field__error" data-v-7ff38246${_scopeId}>`);
											_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: errors[side.key][field.key] ?? "" }, null, _parent, _scopeId));
											_push(`</p></div>`);
										});
										_push(`<!--]-->`);
									} else return [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(FIELDS, (field) => {
										return (0, vue_exports.createVNode)("div", {
											key: field.key,
											class: "form-field"
										}, [
											(0, vue_exports.createVNode)("label", {
												class: "form-field__label",
												for: fid(side.key, field.key)
											}, (0, vue_exports.toDisplayString)(label(field)), 9, ["for"]),
											(0, vue_exports.createVNode)("span", { class: "input-group" }, [field.key === "etMm" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("input", {
												key: 0,
												id: fid(side.key, field.key),
												class: "input num calc-form__et",
												translate: "no",
												type: "number",
												min: (0, vue_exports.unref)(-30),
												max: (0, vue_exports.unref)(70),
												step: "1",
												autocomplete: "off",
												value: etText[side.key],
												"aria-invalid": isInvalid(side.key, field.key),
												"aria-describedby": eid(side.key, field.key),
												"data-prefilled": prefilledAttr(side.key),
												onChange: ($event) => onEtChange(side.key, $event),
												onBlur: ($event) => validateEt(side.key)
											}, null, 40, [
												"id",
												"min",
												"max",
												"value",
												"aria-invalid",
												"aria-describedby",
												"data-prefilled",
												"onChange",
												"onBlur"
											])) : (0, vue_exports.withDirectives)(((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("select", {
												key: 1,
												id: fid(side.key, field.key),
												"onUpdate:modelValue": ($event) => setup(side.key)[field.key] = $event,
												class: "input num",
												translate: "no",
												"aria-invalid": isInvalid(side.key, field.key),
												"aria-describedby": eid(side.key, field.key),
												"data-prefilled": prefilledAttr(side.key),
												onChange: ($event) => onSelect(side.key, field.key)
											}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)((0, vue_exports.unref)(OPTIONS)[field.key], (option) => {
												return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
													key: option,
													value: option
												}, (0, vue_exports.toDisplayString)(field.option(option)), 9, ["value"]);
											}), 128))], 40, [
												"id",
												"onUpdate:modelValue",
												"aria-invalid",
												"aria-describedby",
												"data-prefilled",
												"onChange"
											])), [[vue_exports.vModelSelect, setup(side.key)[field.key]]]), field.key === "etMm" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 2,
												class: "input-group__suffix",
												"aria-hidden": "true",
												translate: "no"
											}, "mm")) : (0, vue_exports.createCommentVNode)("", true)]),
											(0, vue_exports.createVNode)("p", {
												id: eid(side.key, field.key),
												class: "form-field__error"
											}, [(0, vue_exports.createVNode)(ValueText_default, { text: errors[side.key][field.key] ?? "" }, null, 8, ["text"])], 8, ["id"])
										]);
									}), 64))];
								}),
								_: 2
							}, _parent, _scopeId));
						});
						_push(`<!--]-->`);
					} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsList_default), {
						class: "tabs__list",
						"aria-label": "Aktuelle oder neue Größe"
					}, {
						default: (0, vue_exports.withCtx)(() => [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)((0, vue_exports.unref)(SIDES), (side) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(TabsTrigger_default), {
								key: side.key,
								value: side.key,
								class: "tabs__trigger"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(side.label), 1)]),
								_: 2
							}, 1032, ["value"]);
						}), 128))]),
						_: 1
					}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)((0, vue_exports.unref)(SIDES), (side) => {
						return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(TabsContent_default), {
							key: side.key,
							value: side.key,
							class: "tabs__content calc-form__fields calc-form__fields--two"
						}, {
							default: (0, vue_exports.withCtx)(() => [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(FIELDS, (field) => {
								return (0, vue_exports.createVNode)("div", {
									key: field.key,
									class: "form-field"
								}, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: fid(side.key, field.key)
									}, (0, vue_exports.toDisplayString)(label(field)), 9, ["for"]),
									(0, vue_exports.createVNode)("span", { class: "input-group" }, [field.key === "etMm" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("input", {
										key: 0,
										id: fid(side.key, field.key),
										class: "input num calc-form__et",
										translate: "no",
										type: "number",
										min: (0, vue_exports.unref)(-30),
										max: (0, vue_exports.unref)(70),
										step: "1",
										autocomplete: "off",
										value: etText[side.key],
										"aria-invalid": isInvalid(side.key, field.key),
										"aria-describedby": eid(side.key, field.key),
										"data-prefilled": prefilledAttr(side.key),
										onChange: ($event) => onEtChange(side.key, $event),
										onBlur: ($event) => validateEt(side.key)
									}, null, 40, [
										"id",
										"min",
										"max",
										"value",
										"aria-invalid",
										"aria-describedby",
										"data-prefilled",
										"onChange",
										"onBlur"
									])) : (0, vue_exports.withDirectives)(((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("select", {
										key: 1,
										id: fid(side.key, field.key),
										"onUpdate:modelValue": ($event) => setup(side.key)[field.key] = $event,
										class: "input num",
										translate: "no",
										"aria-invalid": isInvalid(side.key, field.key),
										"aria-describedby": eid(side.key, field.key),
										"data-prefilled": prefilledAttr(side.key),
										onChange: ($event) => onSelect(side.key, field.key)
									}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)((0, vue_exports.unref)(OPTIONS)[field.key], (option) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
											key: option,
											value: option
										}, (0, vue_exports.toDisplayString)(field.option(option)), 9, ["value"]);
									}), 128))], 40, [
										"id",
										"onUpdate:modelValue",
										"aria-invalid",
										"aria-describedby",
										"data-prefilled",
										"onChange"
									])), [[vue_exports.vModelSelect, setup(side.key)[field.key]]]), field.key === "etMm" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 2,
										class: "input-group__suffix",
										"aria-hidden": "true",
										translate: "no"
									}, "mm")) : (0, vue_exports.createCommentVNode)("", true)]),
									(0, vue_exports.createVNode)("p", {
										id: eid(side.key, field.key),
										class: "form-field__error"
									}, [(0, vue_exports.createVNode)(ValueText_default, { text: errors[side.key][field.key] ?? "" }, null, 8, ["text"])], 8, ["id"])
								]);
							}), 64))]),
							_: 2
						}, 1032, ["value"]);
					}), 128))];
				}),
				_: 1
			}, _parent));
			_push(`</form>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/FitmentCalculator.vue
var _sfc_setup$2 = FitmentCalculator_vue_vue_type_script_setup_true_lang_default.setup;
FitmentCalculator_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/FitmentCalculator.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var FitmentCalculator_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FitmentCalculator_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-7ff38246"]]);
//#endregion
//#region resources/js/Components/Home/FitmentResults.vue?vue&type=script&setup=true&lang.ts
var DASH = "–";
var EDGE_NOTE = "Rechnerisch aus Felgenbreite und Einpresstiefe, auf ganze Millimeter gerundet. Ob Rad und Reifen frei laufen, hängt von Radhaus, Fahrwerk und Bremse ab – die Bedingungen nennt das Gutachten der Felge.";
var SCALE_MIN = -5;
var SCALE_MAX = 5;
var FitmentResults_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "FitmentResults",
	__ssrInlineRender: true,
	props: { result: {} },
	setup(__props) {
		/**
		* The results of the Felgenrechner (ACCURACY.md §6, brief W6): three blocks separated by hairlines —
		* never boxes — *Lage der Felge*, *Radgröße*, *Tacho*. Each says its answer first, in one plain
		* German sentence, large; the figures follow, smaller. Every figure comes from the `FelgenModel` of
		* `lib/felgenGeometry`, every sentence from `lib/felgenSentences`, and the drawing (the `drawing`
		* slot) sits under the position sentence it illustrates.
		*
		* It is arithmetic and says so: millimetres are whole and *rechnerisch*, percentages have two
		* decimals. Nothing here is a verdict. There is no green, amber or red anywhere (C5): the rolling
		* circumference carries a neutral scale against the *häufig genannte Faustregel*, which the copy
		* calls what it is — no legal limit. The speedometer rule is quoted, not applied. What applies to a
		* car stays with its papers and the wheel's Gutachten or ABE. Every figure is kept away from the
		* browser's translator (`ValueText`).
		*
		* With `result` null (the form holds an impossible ET) every answer reads a dash and no scale is
		* drawn: a number nobody computed is never shown. When a tyre and its rim do not belong together
		* the whole comparison is one sentence and nothing else — no drawing, no figure.
		*/
		const props = __props;
		const RULE = `der häufig genannten Faustregel von ${withUnit(signedText(FAUSTREGEL_MIN_PERCENT, 1), "%")} bis ${withUnit(signedText(FAUSTREGEL_MAX_PERCENT, 1), "%")} (keine gesetzliche Grenze)`;
		const RULE_SENTENCE = {
			inside: `Die Änderung liegt innerhalb ${RULE}.`,
			above: `Die Änderung liegt über ${RULE}.`,
			below: `Die Änderung liegt unter ${RULE}.`
		};
		function onScale(percent) {
			const f = (Math.min(Math.max(percent, SCALE_MIN), SCALE_MAX) - SCALE_MIN) / 10;
			return Math.round(f * 1e3) / 10;
		}
		const BAND = {
			left: `${onScale(FAUSTREGEL_MIN_PERCENT)}%`,
			width: `${onScale(FAUSTREGEL_MAX_PERCENT) - onScale(FAUSTREGEL_MIN_PERCENT)}%`
		};
		const ZERO = { left: `${onScale(0)}%` };
		/** The sides whose tyre and rim do not belong together, named as the form names them. */
		const implausible = (0, vue_exports.computed)(() => {
			const sides = props.result?.implausible ?? [];
			return sides.length === 0 ? null : SIDES.filter((s) => sides.includes(s.key)).map((s) => s.label).join(" und ");
		});
		const lage = (0, vue_exports.computed)(() => {
			const r = props.result;
			if (r === null) return {
				say: [DASH],
				figures: null,
				note: null
			};
			const { current, next } = r.input;
			return {
				say: [outerSentence(r), innerSentence(r)],
				figures: `Felge ${jLabel(current.widthIn)} · ${etLabel(current.etMm)} → ${jLabel(next.widthIn)} · ${etLabel(next.etMm)}`,
				note: EDGE_NOTE
			};
		});
		const size = (0, vue_exports.computed)(() => {
			const r = props.result;
			if (r === null || r.faustregel === null) return {
				say: DASH,
				figures: null,
				rule: null,
				position: null,
				mark: null
			};
			return {
				say: sizeSentence(r),
				figures: sizeFigures(r),
				rule: RULE_SENTENCE[r.faustregel],
				position: r.faustregel,
				mark: { left: `${onScale(r.shownPercent)}%` }
			};
		});
		const tacho = (0, vue_exports.computed)(() => {
			const r = props.result;
			if (r === null) return {
				say: DASH,
				direction: null,
				adjust: null
			};
			return {
				say: speedSentence(r),
				direction: speedoDirection(r),
				adjust: speedoAdjust(r)
			};
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "calc-results" }, _attrs))} data-v-d6af7150>`);
			if (implausible.value) _push(`<div class="calc-result" data-result="implausible" data-v-d6af7150><p class="label" data-v-d6af7150>${(0, server_renderer_exports.ssrInterpolate)(implausible.value)}</p><p class="calc-result__say" data-v-d6af7150>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(IMPLAUSIBLE))}</p></div>`);
			else {
				_push(`<!--[--><div class="calc-result" data-result="lage" data-v-d6af7150><p class="label" data-v-d6af7150>Lage der Felge</p><p class="calc-result__say" data-v-d6af7150><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(lage.value.say, (sentence, i) => {
					_push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(i > 0 ? " " : "")}`);
					_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: sentence }, null, _parent));
					_push(`<!--]-->`);
				});
				_push(`<!--]--></p>`);
				if (_ctx.$slots.drawing) {
					_push(`<div class="calc-result__drawing" data-v-d6af7150>`);
					(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "drawing", {}, null, _push, _parent);
					_push(`</div>`);
				} else _push(`<!---->`);
				if (lage.value.figures) {
					_push(`<p class="small muted calc-result__sub" data-v-d6af7150>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: lage.value.figures }, null, _parent));
					_push(`</p>`);
				} else _push(`<!---->`);
				if (lage.value.note) _push(`<p class="small quiet calc-result__sub calc-result__sub--prose" data-v-d6af7150>${(0, server_renderer_exports.ssrInterpolate)(lage.value.note)}</p>`);
				else _push(`<!---->`);
				_push(`</div><div class="calc-result" data-result="groesse"${(0, server_renderer_exports.ssrRenderAttr)("data-faustregel", size.value.position ?? void 0)} data-v-d6af7150><p class="label" data-v-d6af7150>Radgröße</p><p class="calc-result__say" data-v-d6af7150>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: size.value.say }, null, _parent));
				_push(`</p>`);
				if (size.value.figures) {
					_push(`<p class="small muted calc-result__sub" data-v-d6af7150>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: size.value.figures }, null, _parent));
					_push(`</p>`);
				} else _push(`<!---->`);
				if (size.value.rule && size.value.mark) {
					_push(`<!--[--><div class="rule" aria-hidden="true" data-v-d6af7150><span class="rule__axis" data-v-d6af7150></span><span class="rule__band" style="${(0, server_renderer_exports.ssrRenderStyle)(BAND)}" data-v-d6af7150></span><span class="rule__zero" style="${(0, server_renderer_exports.ssrRenderStyle)(ZERO)}" data-v-d6af7150></span><span class="rule__mark" style="${(0, server_renderer_exports.ssrRenderStyle)(size.value.mark)}" data-v-d6af7150></span></div><p class="small muted calc-result__sub calc-result__sub--prose rule__text" data-v-d6af7150>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: size.value.rule }, null, _parent));
					_push(`</p><!--]-->`);
				} else _push(`<!---->`);
				_push(`</div><div class="calc-result" data-result="tacho" data-v-d6af7150><p class="label" data-v-d6af7150>Tacho</p><p class="calc-result__say" data-v-d6af7150>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: tacho.value.say }, null, _parent));
				_push(`</p>`);
				if (tacho.value.direction) _push(`<p class="small muted calc-result__sub" data-say="direction" data-v-d6af7150>${(0, server_renderer_exports.ssrInterpolate)(tacho.value.direction)}</p>`);
				else _push(`<!---->`);
				_push(`<p class="small quiet calc-result__sub calc-result__sub--prose" data-say="r39" data-v-d6af7150>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: (0, vue_exports.unref)(R39_NOTE) }, null, _parent));
				_push(`</p>`);
				if (tacho.value.adjust) _push(`<p class="small muted calc-result__sub calc-result__sub--prose" data-say="tachoangleichung" data-v-d6af7150>${(0, server_renderer_exports.ssrInterpolate)(tacho.value.adjust)}</p>`);
				else _push(`<!---->`);
				_push(`</div><!--]-->`);
			}
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/FitmentResults.vue
var _sfc_setup$1 = FitmentResults_vue_vue_type_script_setup_true_lang_default.setup;
FitmentResults_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/FitmentResults.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var FitmentResults_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FitmentResults_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-d6af7150"]]);
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
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "share" }, _attrs))} data-v-6dc9cf4c><label class="label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(uid)}-share`)} data-v-6dc9cf4c>Link zu dieser Rechnung</label><div class="${(0, server_renderer_exports.ssrRenderClass)([{ "share__row--block": __props.block }, "share__row"])}" data-v-6dc9cf4c><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-share`)} class="input share__input" type="url" readonly${(0, server_renderer_exports.ssrRenderAttr)("value", href.value)} aria-label="Link zu dieser Rechnung" data-v-6dc9cf4c><button class="${(0, server_renderer_exports.ssrRenderClass)([__props.block ? "btn--block" : "btn--sm", "btn btn--secondary"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-6dc9cf4c> Link kopieren </button></div><p class="small quiet share__status" role="status" aria-live="polite" data-v-6dc9cf4c>${(0, server_renderer_exports.ssrInterpolate)(status.value)}</p></div>`);
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
var RechnerShare_default = /*#__PURE__*/ _plugin_vue_export_helper_default(RechnerShare_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-6dc9cf4c"]]);
//#endregion
//#region resources/js/composables/useRechner.ts
/**
* The Felgenrechner's state, shared by the homepage teaser and both documents of /felgenrechner.
*
* Owns the two setups (always valid — the form only hands over figures it offers), whether the
* form currently holds something it could not commit (an impossible ET: the results then read
* a dash and the drawing keeps the last valid comparison), the model from `lib/felgenGeometry`,
* the prefill note, and the URL: every valid change is written to `?rechner=` with
* `history.replaceState`, debounced by `--d-2`, so the address bar is always a share link.
*
* Starting values, in order of precedence: a comparison the server parsed from `?rechner=`
* (the full page), then the prefill — the smallest size a Gutachten names for the chosen car —
* against the next plausible step, then the specification's worked example. On the homepage the
* parameter is read on mount instead, because the page does not carry it as a prop. Nothing here
* touches `window` outside `onMounted`.
*/
function parseMs(value) {
	const match = /^\s*([\d.]+)\s*(ms|s)\s*$/.exec(value);
	if (match === null || match[1] === void 0) return null;
	const n = Number(match[1]);
	return Number.isFinite(n) ? match[2] === "s" ? n * 1e3 : n : null;
}
/**
* The next plausible step up from a size: one inch more, ten points less profile, half an inch
* wider, the ET unchanged — so a page opened with a vehicle shows a real change at first paint
* instead of "nothing changes" under a heading that asks what changes. Every value stays on the
* grid the form offers. It is a comparison to look at, not a recommendation. The width stays put
* where half an inch more would no longer suit the tyre (`rimSuitsTyre`), so a page opened with a
* vehicle never greets the customer with a pairing it flags itself.
*/
function nextStep(s) {
	const wider = {
		...s,
		widthIn: Math.min(12, s.widthIn + .5)
	};
	return {
		...s,
		widthIn: rimSuitsTyre(s) && !rimSuitsTyre(wider) ? s.widthIn : wider.widthIn,
		diameterIn: Math.min(24, s.diameterIn + 1),
		aspect: Math.max(25, s.aspect - 10)
	};
}
/** What the prefill is, said plainly (C3): not the factory size, the smallest size a Gutachten names. */
function prefillSentence(vehicleShort) {
	return `Aktuell ist vorbelegt mit der kleinsten Größe, die ein Gutachten für deinen ${vehicleShort} nennt – nicht unbedingt mit deiner heutigen Bereifung.`;
}
function useRechner(options) {
	const prefilled = fromPrefill(options.prefill());
	const shared = isState(options.state) ? options.state : null;
	const initial = shared ?? (prefilled === null ? DEFAULT_STATE : {
		current: prefilled,
		next: nextStep(prefilled)
	});
	const state = (0, vue_exports.reactive)(cloneState(initial));
	const valid = (0, vue_exports.ref)(true);
	const fromVehicle = (0, vue_exports.ref)(shared === null && prefilled !== null);
	const result = (0, vue_exports.computed)(() => felgenModel(state.current, state.next));
	const shown = (0, vue_exports.computed)(() => valid.value ? result.value : null);
	const implausible = (0, vue_exports.computed)(() => result.value.implausible.length > 0);
	const shareParam = (0, vue_exports.computed)(() => encodeState(state));
	const href = (0, vue_exports.computed)(() => felgenrechnerHref(state));
	const prefillNote = (0, vue_exports.computed)(() => null);
	const prefillLine = (0, vue_exports.computed)(() => {
		const short = options.vehicle()?.short;
		return fromVehicle.value && short !== void 0 && short !== "" ? prefillSentence(short) : null;
	});
	const summary = (s, diameterMm) => implausible.value ? setupLine(s) : `${setupLine(s)} · Ø rechnerisch ${wholeMmText(diameterMm)}`;
	const summaries = (0, vue_exports.computed)(() => ({
		current: summary(state.current, result.value.current.diameterMm),
		next: summary(state.next, result.value.next.diameterMm)
	}));
	const specs = (0, vue_exports.computed)(() => {
		const r = result.value;
		if (implausible.value) return [];
		return [
			{
				key: "rim",
				label: "Felge",
				value: `${jLabel(state.current.widthIn)} × ${state.current.diameterIn} → ${jLabel(state.next.widthIn)} × ${state.next.diameterIn}`
			},
			{
				key: "et",
				label: "Einpresstiefe",
				value: `${etLabel(state.current.etMm)} → ${etLabel(state.next.etMm)}`
			},
			{
				key: "diameter",
				label: "Außendurchmesser, rechnerisch",
				value: `${wholeMmText(r.current.diameterMm)} → ${wholeMmText(r.next.diameterMm)}`
			},
			{
				key: "circumference",
				label: "Umfang (π × Ø), rechnerisch",
				value: `${wholeMmText(r.current.circumferenceMm)} → ${wholeMmText(r.next.circumferenceMm)}`
			},
			{
				key: "abroll",
				label: "Abrollumfang, Änderung",
				value: percentText(r.circumferenceDeltaPercent)
			},
			{
				key: "outer",
				label: "Außenkante, rechnerisch",
				value: r.outer.phrase
			},
			{
				key: "inner",
				label: "Innenkante, rechnerisch",
				value: r.inner.phrase
			}
		];
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
		window.history.replaceState(window.history.state, "", url.toString());
	}
	function scheduleUrl() {
		if (options.writeUrl !== true || typeof window === "undefined") return;
		if (timer !== void 0) clearTimeout(timer);
		timer = setTimeout(writeUrl, delay);
	}
	function update(next) {
		if (!sameState(state, next)) {
			replace(next);
			scheduleUrl();
		}
		fromVehicle.value = false;
	}
	function setValid(next) {
		valid.value = next;
	}
	(0, vue_exports.watch)(options.prefill, (prefill) => {
		const s = fromPrefill(prefill);
		if (s !== null) {
			replace({
				current: s,
				next: nextStep(s)
			});
			fromVehicle.value = true;
		}
	});
	(0, vue_exports.onMounted)(() => {
		delay = parseMs(getComputedStyle(document.documentElement).getPropertyValue("--d-2")) ?? delay;
		if (options.readUrl === true) {
			const fromUrl = decodeState(new URLSearchParams(window.location.search).get("rechner"));
			if (fromUrl !== null) {
				replace(fromUrl);
				fromVehicle.value = false;
			}
		}
		if (options.writeUrl === true && !new URLSearchParams(window.location.search).has("rechner")) writeUrl();
	});
	(0, vue_exports.onBeforeUnmount)(() => {
		if (timer !== void 0) clearTimeout(timer);
	});
	return {
		state,
		valid,
		setValid,
		update,
		result,
		shown,
		implausible,
		shareParam,
		href,
		fromVehicle,
		prefillNote,
		prefillLine,
		summaries,
		specs
	};
}
//#endregion
export { ClearanceDrawing_default as a, FitmentCalculator_default as i, RechnerShare_default as n, DISCLAIMER as o, FitmentResults_default as r, SIDES as s, useRechner as t };
