import { c as vue_exports } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
var decimals = /* @__PURE__ */ new Map();
function formatter(digits) {
	let cached = decimals.get(digits);
	if (cached === void 0) {
		cached = new Intl.NumberFormat("de-DE", {
			minimumFractionDigits: digits,
			maximumFractionDigits: digits
		});
		decimals.set(digits, cached);
	}
	return cached;
}
/** `1.234,5` — thousands point, decimal comma, a fixed number of places. */
function decimal(value, digits = 1) {
	return formatter(digits).format(value);
}
/** `1.234,00 €` from integer cents. */
function euro(cents) {
	return `${decimal(cents / 100, 2)} €`;
}
/** `72,6 mm`, `71 dB`, `ET 35` — a value and its unit, inseparable. */
function withUnit(value, unit) {
	return `${value} ${unit}`;
}
/** `18 Zoll`, `18,5 Zoll`; a list reads `17 · 18 · 19 Zoll`. */
/** `1 Felge` · `12 Felgen` — one spelling for every count of wheels on the site. */
function felgen(count) {
	return `${decimal(count, 0)} ${count === 1 ? "Felge" : "Felgen"}`;
}
function zoll(inches) {
	return withUnit((Array.isArray(inches) ? inches : [inches]).map((v) => typeof v === "number" ? decimal(v, Number.isInteger(v) ? 0 : 1) : v).join(" · "), "Zoll");
}
//#endregion
//#region resources/js/lib/felgenGeometry.ts
/**
* The Felgenrechner's geometry (ACCURACY.md §6): the only place a wheel-and-tyre size becomes a
* millimetre, a percentage or a coordinate of the drawing. The results, the full figures and the
* drawing all read one `FelgenModel`, and the drawing is generated from that same model, so a drawn
* length and its printed figure cannot disagree. Pure functions: no Vue, no DOM.
*
* None of this is a verdict. A figure says how far a rim edge moves or how a circumference
* changes; only the vehicle's papers and the wheel's Gutachten or ABE say what applies to a car
* (CLAUDE.md §2). A value that cannot be computed is `NaN`, is printed as a dash and is never
* judged.
*
* The axis: the mounting face (Anlagefläche) is 0, because it is the one plane bolted to the car,
* and outboard (towards the fender) is positive. A positive ET puts the rim's centre plane inboard
* of the face, so the centre plane sits at −ET, the inner rim edge at −ET − W/2 and the outer rim
* edge at −ET + W/2 (W: the rim width in mm). Seen from the face, the outer edge is W/2 − ET
* outboard and the inner edge W/2 + ET inboard. The tyre is centred on the rim's centre plane.
*/
/**
* Inches to millimetres without floating-point noise: `8.5 × 25.4` is 215,899…98 in binary.
* Multiplying by 254 first keeps every half-inch width the form offers exact.
*/
function inchesToMm(inches) {
	return inches * 254 / 10;
}
/**
* The *häufig genannte Faustregel* for a change of rolling circumference: −2,5 % … +1,5 %. It is a
* rule of thumb from the tyre trade with no legal basis anywhere we could find — not in § 57 StVZO,
* 75/443/EWG, UN R39, the accessible text of VdTÜV-Merkblatt 751 or any Gutachten
* (docs/reviews/accuracy-research-motec.md §3c). The page shows it as a neutral reference and says
* *keine gesetzliche Grenze*; it never lights anything green.
*/
var FAUSTREGEL_MIN_PERCENT = -2.5;
var FAUSTREGEL_MAX_PERCENT = 1.5;
/**
* Rounds half away from zero, so a value and its negative always print as each other's negative
* (`Math.round(−2.5)` would give −2). The small epsilon absorbs binary noise such as 150,4999…97.
*/
function roundHalfAway(value, digits = 0) {
	if (!Number.isFinite(value)) return NaN;
	const factor = 10 ** digits;
	const rounded = Math.round(Math.abs(value) * factor + 1e-9) / factor;
	return rounded === 0 ? 0 : Math.sign(value) * rounded;
}
/**
* A change as German text: a leading `+`, a real minus sign (U+2212), and `±` when the rounded
* value is nothing — `+0,91`, `−19,99`, `±0,00`. A value that does not exist is a dash.
*/
function signedText(value, digits) {
	const rounded = roundHalfAway(value, digits);
	if (!Number.isFinite(rounded)) return "–";
	if (rounded === 0) return `±${decimal(0, digits)}`;
	return `${rounded > 0 ? "+" : "−"}${decimal(Math.abs(rounded), digits)}`;
}
/** `+0,91 %` */
function percentText(value) {
	return Number.isFinite(value) ? withUnit(signedText(value, 2), "%") : "–";
}
/** `634 mm` — whole millimetres. */
function wholeMmText(value) {
	return Number.isFinite(value) ? withUnit(decimal(roundHalfAway(value), 0), "mm") : "–";
}
/** `100,9 km/h` — one decimal, the way a speed is said. */
function kmhText(value) {
	return Number.isFinite(value) ? withUnit(decimal(roundHalfAway(value, 1), 1), "km/h") : "–";
}
/** Sidewall height `h = width × aspect / 100`, in mm. */
function sidewallHeightMm(widthMm, aspect) {
	return widthMm * aspect / 100;
}
/** Tyre outer diameter `D = rim × 25,4 + 2 × width × aspect / 100`, in mm. */
function tyreDiameterMm(rimIn, widthMm, aspect) {
	return inchesToMm(rimIn) + 2 * sidewallHeightMm(widthMm, aspect);
}
function setupGeometry(s) {
	const rimWidthMm = inchesToMm(s.widthIn);
	const diameterMm = tyreDiameterMm(s.diameterIn, s.tyreWidthMm, s.aspect);
	return {
		rimWidthMm,
		rimDiameterMm: inchesToMm(s.diameterIn),
		tyreWidthMm: s.tyreWidthMm,
		sidewallMm: sidewallHeightMm(s.tyreWidthMm, s.aspect),
		diameterMm,
		circumferenceMm: Math.PI * diameterMm,
		centreX: -s.etMm,
		innerEdgeX: -s.etMm - rimWidthMm / 2,
		outerEdgeX: -s.etMm + rimWidthMm / 2
	};
}
/** False when the rim is clearly too narrow or too wide for the tyre (see `RIM_TYRE_RATIO_MIN`). */
function rimSuitsTyre(s) {
	const ratio = inchesToMm(s.widthIn) / s.tyreWidthMm;
	return Number.isFinite(ratio) && ratio >= .599999999 && ratio <= 1.0500000010000001;
}
/**
* How far each rim edge moves, in mm: `outer = ΔW × 25,4 / 2 − ΔET` (outboard positive) and
* `inner = ΔW × 25,4 / 2 + ΔET` (towards the strut positive). Computed from the differences, not
* from the two positions, so a pure width change splits into two exactly equal halves.
*/
function edgeShiftMm(current, next) {
	const halfWidthDelta = inchesToMm(next.widthIn - current.widthIn) / 2;
	const etDelta = next.etMm - current.etMm;
	return {
		outer: halfWidthDelta - etDelta,
		inner: halfWidthDelta + etDelta
	};
}
var EDGE_WORDS = {
	outer: {
		name: "Außenkante",
		plus: "weiter außen",
		minus: "weiter innen"
	},
	inner: {
		name: "Innenkante",
		plus: "näher am Federbein",
		minus: "weiter weg vom Federbein"
	}
};
function edge(side, mm) {
	const words = EDGE_WORDS[side];
	if (!Number.isFinite(mm)) return {
		side,
		mm,
		shownMm: NaN,
		axis: 0,
		value: null,
		way: null,
		phrase: "–",
		text: `${words.name}: –`
	};
	const shownMm = roundHalfAway(mm);
	const sign = shownMm > 0 ? 1 : shownMm < 0 ? -1 : 0;
	const axis = side === "outer" ? sign : -sign;
	const value = sign === 0 ? null : withUnit(decimal(Math.abs(shownMm), 0), "mm");
	const way = sign === 0 ? null : sign > 0 ? words.plus : words.minus;
	const phrase = value === null || way === null ? "unverändert" : `${value} ${way}`;
	return {
		side,
		mm,
		shownMm,
		axis: axis === 0 ? 0 : axis,
		value,
		way,
		phrase,
		text: `${words.name}: ${phrase}`
	};
}
function faustregelOf(shownPercent) {
	if (!Number.isFinite(shownPercent)) return null;
	if (shownPercent < -2.5) return "below";
	return shownPercent > 1.5 ? "above" : "inside";
}
/** Everything the Felgenrechner prints and draws for `current → next`. */
function felgenModel(current, next) {
	const a = setupGeometry(current);
	const b = setupGeometry(next);
	const shift = edgeShiftMm(current, next);
	const valid = a.diameterMm > 0 && b.diameterMm > 0;
	const percent = valid ? (b.diameterMm - a.diameterMm) / a.diameterMm * 100 : NaN;
	const speed = valid ? 100 * (b.diameterMm / a.diameterMm) : NaN;
	const shownPercent = roundHalfAway(percent, 2);
	const shownSpeedDelta = roundHalfAway(speed - 100, 1);
	const implausible = [];
	if (!rimSuitsTyre(current)) implausible.push("current");
	if (!rimSuitsTyre(next)) implausible.push("next");
	return {
		input: {
			current: { ...current },
			next: { ...next }
		},
		current: a,
		next: b,
		implausible,
		outer: edge("outer", shift.outer),
		inner: edge("inner", shift.inner),
		diameterDeltaMm: b.diameterMm - a.diameterMm,
		shownDiameterDeltaMm: roundHalfAway(b.diameterMm - a.diameterMm),
		circumferenceDeltaPercent: percent,
		shownPercent,
		speedAt100KmH: speed,
		shownSpeedDeltaKmH: shownSpeedDelta,
		shownSpeedKmH: 100 + shownSpeedDelta,
		speedoReadingDeltaPercent: valid ? (a.diameterMm / b.diameterMm - 1) * 100 : NaN,
		faustregel: faustregelOf(shownPercent)
	};
}
/**
* The sheet, in drawing units. What you see standing behind the car and looking at a rear wheel:
* across is sideways (inside, the strut, on the left; outside, the fender, on the right), up is
* height. Wheels and tyres are drawn to ONE true scale, `unitsPerMm`, the same for both wheels of a
* comparison; it is chosen so the larger of the two scenes fills the sheet. Under the wheels a band
* of the sheet carries the two dimension arrows.
*/
var REAR = {
	width: 320,
	height: 380,
	pad: 10,
	/** The band under the wheels that carries the dimension arrows. */
	dimBand: 32,
	/** From the lowest point of the tyres down to the dimension arrows. */
	dimDrop: 18,
	/** Extension lines start this far below a rim and run this far past the arrow. */
	gap: 3,
	over: 4,
	/** An arrowhead: this long, and twice `headHalf` high. */
	head: 8,
	headHalf: 3.5
};
/**
* The car's parts, in millimetres — schematic. Where the strut and the fender really are depends on
* the car, and the calculator does not know it; the drawing says so (*Lage schematisch – je nach
* Fahrzeug*). They are the same for both wheels and are set `clearance` off whichever wheel comes
* closer, so neither wheel ever touches them: a touch would read as a verdict nobody computed.
*/
var SCHEMATIC_MM = {
	clearance: 25,
	strutTube: 40,
	strutSpring: 64,
	/** How far the strut rises above the taller tyre. */
	strutAbove: 60,
	/** The arch's underside above the taller tyre, its thickness, and how far its lip hangs down. */
	archGap: 25,
	fender: 12,
	fenderRadius: 30,
	lipDrop: 55,
	/** Half the height of the mounting face that is drawn: the car's hub, not the wheel's. */
	faceHalf: 80
};
function rearFrame(model) {
	const frame = (g) => ({
		centreX: g.centreX,
		tyreWidthMm: g.tyreWidthMm,
		diameterMm: g.diameterMm,
		rimWidthMm: g.rimWidthMm,
		rimDiameterMm: g.rimDiameterMm
	});
	return {
		current: frame(model.current),
		next: frame(model.next)
	};
}
function r2(n) {
	return Math.round(n * 100) / 100;
}
function rectPath(x, y, w, h) {
	return `M${r2(x)} ${r2(y)} H${r2(x + w)} V${r2(y + h)} H${r2(x)} Z`;
}
function roundedRectPath(x, y, w, h, r) {
	const arc = (tx, ty) => `A${r2(r)} ${r2(r)} 0 0 1 ${r2(tx)} ${r2(ty)}`;
	return `M${r2(x + r)} ${r2(y)} H${r2(x + w - r)} ${arc(x + w, y + r)} V${r2(y + h - r)} ${arc(x + w - r, y + h)} H${r2(x + r)} ${arc(x, y + h - r)} V${r2(y + r)} ${arc(x + r, y)} Z`;
}
/**
* Every shape of the rear view from the two wheels' numbers. The component tweens a `RearFrame`
* and calls this for each frame; directions and whether an arrow is drawn come from the model's
* printed values, the labels from its texts.
*/
function rearScene(frame, model) {
	const s = SCHEMATIC_MM;
	const wheels = [frame.current, frame.next];
	const maxR = Math.max(...wheels.map((w) => w.diameterMm / 2));
	const innerMost = Math.min(...wheels.map((w) => w.centreX - Math.max(w.tyreWidthMm, w.rimWidthMm) / 2));
	const outerMost = Math.max(...wheels.map((w) => w.centreX + Math.max(w.tyreWidthMm, w.rimWidthMm) / 2));
	const strutRight = innerMost - s.clearance;
	const strutLeft = strutRight - s.strutSpring;
	const strutCentre = strutRight - s.strutSpring / 2;
	const strutTop = maxR + s.strutAbove;
	const lipX = outerMost + s.clearance;
	const archY = maxR + s.archGap;
	const xMin = Math.min(strutLeft, 0);
	const xMax = Math.max(lipX + s.fender, 0);
	const yMin = -maxR;
	const yMax = Math.max(strutTop, archY + s.fender);
	const areaW = REAR.width - 2 * REAR.pad;
	const areaH = REAR.height - 2 * REAR.pad - REAR.dimBand;
	const k = Math.min(areaW / (xMax - xMin), areaH / (yMax - yMin));
	const left = REAR.pad + (areaW - (xMax - xMin) * k) / 2;
	const floor = REAR.pad + areaH;
	const X = (x) => left + (x - xMin) * k;
	const Y = (y) => floor - (y - yMin) * k;
	const wheel = (w) => {
		const tyreLeftX = X(w.centreX - w.tyreWidthMm / 2);
		const tyreRightX = X(w.centreX + w.tyreWidthMm / 2);
		const innerEdgeX = X(w.centreX - w.rimWidthMm / 2);
		const outerEdgeX = X(w.centreX + w.rimWidthMm / 2);
		const tyreTopY = Y(w.diameterMm / 2);
		const tyreBottomY = Y(-w.diameterMm / 2);
		const rimTopY = Y(w.rimDiameterMm / 2);
		const rimBottomY = Y(-w.rimDiameterMm / 2);
		const tw = tyreRightX - tyreLeftX;
		const th = tyreBottomY - tyreTopY;
		const r = Math.min(tw, th) * .16;
		const holeLeft = Math.max(innerEdgeX, tyreLeftX);
		const holeRight = Math.min(outerEdgeX, tyreRightX);
		return {
			tyre: {
				x: r2(tyreLeftX),
				y: r2(tyreTopY),
				width: r2(tw),
				height: r2(th),
				r: r2(r)
			},
			rim: {
				x: r2(innerEdgeX),
				y: r2(rimTopY),
				width: r2(outerEdgeX - innerEdgeX),
				height: r2(rimBottomY - rimTopY)
			},
			ring: `${roundedRectPath(tyreLeftX, tyreTopY, tw, th, r)} ${rectPath(holeLeft, rimTopY, holeRight - holeLeft, rimBottomY - rimTopY)}`,
			centreX: X(w.centreX),
			innerEdgeX,
			outerEdgeX,
			tyreLeftX,
			tyreRightX,
			rimBottomY,
			tyreTopY,
			tyreBottomY
		};
	};
	const current = wheel(frame.current);
	const next = wheel(frame.next);
	const dimY = floor + REAR.dimDrop;
	const dimension = (side, from, to, fromBottom, toBottom) => {
		const shift = model[side];
		const drawn = shift.axis !== 0;
		const lo = Math.min(from, to);
		const hi = Math.max(from, to);
		const tip = r2(to);
		const base = r2(to - shift.axis * REAR.head);
		const h = REAR.headHalf;
		const ext = (x, bottom) => `M${r2(x)} ${r2(bottom + REAR.gap)} V${r2(dimY + REAR.over)}`;
		return {
			side,
			from,
			to,
			y: dimY,
			drawn,
			shaft: drawn ? `M${r2(lo)} ${r2(dimY)} H${r2(hi)}` : "",
			head: drawn ? `M${base} ${r2(dimY - h)} L${tip} ${r2(dimY)} L${base} ${r2(dimY + h)} Z` : "",
			extFrom: drawn ? ext(from, fromBottom) : "",
			extTo: drawn ? ext(to, toBottom) : "",
			anchor: (drawn ? (from + to) / 2 : to) / REAR.width
		};
	};
	const faceX = X(0);
	const tubeLeft = X(strutCentre - s.strutTube / 2);
	const tubeTop = Y(strutTop);
	const tubeBottom = Y(-.1 * maxR);
	const coilTop = strutTop - 8;
	const coilBottom = .45 * maxR;
	const turns = 7;
	const coil = Array.from({ length: 8 }, (_, i) => {
		const y = Y(coilTop - (coilTop - coilBottom) * i / turns);
		const x = X(i % 2 === 0 ? strutLeft : strutRight);
		return `${i === 0 ? "M" : "L"}${r2(x)} ${r2(y)}`;
	}).join(" ");
	const fx0 = X(strutRight + 8);
	const outerR = s.fenderRadius * k;
	const innerR = (s.fenderRadius - s.fender) * k;
	const fenderPath = `M${r2(fx0)} ${r2(Y(archY + s.fender))} H${r2(X(lipX + s.fender) - outerR)} A${r2(outerR)} ${r2(outerR)} 0 0 1 ${r2(X(lipX + s.fender))} ${r2(Y(archY + s.fender) + outerR)} V${r2(Y(archY - s.lipDrop))} H${r2(X(lipX))} V${r2(Y(archY) + innerR)} A${r2(innerR)} ${r2(innerR)} 0 0 0 ${r2(X(lipX) - innerR)} ${r2(Y(archY))} H${r2(fx0)} Z`;
	return {
		unitsPerMm: k,
		faceX,
		face: `M${r2(faceX)} ${r2(Y(s.faceHalf))} V${r2(Y(-s.faceHalf))}`,
		current,
		next,
		strut: {
			tube: {
				x: r2(tubeLeft),
				y: r2(tubeTop),
				width: r2(s.strutTube * k),
				height: r2(tubeBottom - tubeTop)
			},
			spring: coil,
			rightX: X(strutRight),
			anchor: X(strutCentre) / REAR.width
		},
		fender: {
			path: fenderPath,
			lipX: X(lipX),
			bottomY: Y(archY),
			anchor: X(lipX + s.fender / 2) / REAR.width
		},
		outer: dimension("outer", current.outerEdgeX, next.outerEdgeX, current.rimBottomY, next.rimBottomY),
		inner: dimension("inner", current.innerEdgeX, next.innerEdgeX, current.rimBottomY, next.rimBottomY)
	};
}
//#endregion
//#region resources/js/lib/felgenSentences.ts
/**
* What the Felgenrechner says, in plain German, before it shows a number (ACCURACY.md §6, brief W6):
* one sentence per result, informal *du*, every figure read from the one `FelgenModel`. Nothing
* here is a verdict — no *zulässig*, *passt*, *legal*, *eintragungsfrei*, *erlaubt* or *OK*: the
* sentences say what moves and by how much, and point at the papers that decide.
*
* Absolute values are whole millimetres and say *rechnerisch*; a percentage has two decimals, a
* speed one. Every sentence is a plain string; `valueParts` marks the figures in it, so a page can
* keep the browser's translator off them (`translate="no"`: Chrome once turned "5,5 J" into
* "5.5 years").
*/
/** When the tyre and the rim of a side do not belong together (felgenGeometry `rimSuitsTyre`). */
var IMPLAUSIBLE = "Diese Reifenbreite und diese Maulweite gehören so nicht zusammen – prüf die Angaben.";
/**
* The speedometer rule, quoted (UN R39 para. 5.4 — accuracy-research-motec.md §3b). It is a rule
* about the speedometer, not a statement about this comparison.
*/
var R39_NOTE = `Der Tacho darf nie weniger anzeigen als die tatsächliche Geschwindigkeit, höchstens ${withUnit(10, "%")} + ${withUnit(4, "km/h")} mehr (UN-Regelung Nr. 39).`;
/**
* Only when the new size makes the speedometer read less than before: that moves it towards the
* one thing R39 forbids, reading below the true speed. The Gutachten's Auflagen name the
* speedometer check (ABE 53810, Auflagen G01/G03 — accuracy-research-motec.md §3b), so the line
* points there and decides nothing.
*/
var SPEEDO_ADJUST_NOTE = "Dann kann eine Tachoangleichung nötig werden – das steht im Gutachten.";
var DASH = "–";
var HUNDRED = withUnit(100, "km/h");
function mm(value) {
	return withUnit(decimal(Math.abs(value), 0), "mm");
}
/** `Die neue Felge steht rechnerisch 23 mm weiter außen – näher am Kotflügel.` */
function outerSentence(m) {
	const shown = m.outer.shownMm;
	if (!Number.isFinite(shown)) return DASH;
	if (shown === 0) return "Die Außenkante bleibt rechnerisch, wo sie ist.";
	return shown > 0 ? `Die neue Felge steht rechnerisch ${mm(shown)} weiter außen – näher am Kotflügel.` : `Die neue Felge steht rechnerisch ${mm(shown)} weiter innen – weiter weg vom Kotflügel.`;
}
/** `Die Innenkante rückt rechnerisch 3 mm näher ans Federbein.` */
function innerSentence(m) {
	const shown = m.inner.shownMm;
	if (!Number.isFinite(shown)) return DASH;
	if (shown === 0) return "Die Innenkante bleibt rechnerisch, wo sie ist.";
	return shown > 0 ? `Die Innenkante rückt rechnerisch ${mm(shown)} näher ans Federbein.` : `Die Innenkante rückt rechnerisch ${mm(shown)} weiter weg vom Federbein.`;
}
/** `Das Rad wird rechnerisch 6 mm größer im Durchmesser (+0,91 %).` */
function sizeSentence(m) {
	const shown = m.shownDiameterDeltaMm;
	const percent = percentText(m.circumferenceDeltaPercent);
	if (!Number.isFinite(shown) || !Number.isFinite(m.shownPercent)) return DASH;
	if (shown !== 0) return `Das Rad wird rechnerisch ${mm(shown)} ${shown > 0 ? "größer" : "kleiner"} im Durchmesser (${percent}).`;
	if (m.diameterDeltaMm !== 0) return `Das Rad wird rechnerisch weniger als ${mm(1)} ${m.diameterDeltaMm > 0 ? "größer" : "kleiner"} im Durchmesser (${percent}).`;
	return `Der Durchmesser bleibt rechnerisch gleich (${percent}).`;
}
/** `Zeigt der Tacho 100 km/h, fährst du rechnerisch 100,9 km/h – 0,9 km/h mehr als mit der bisherigen Größe.` */
function speedSentence(m) {
	if (!Number.isFinite(m.shownSpeedKmH)) return DASH;
	const lead = `Zeigt der Tacho ${HUNDRED}, fährst du rechnerisch ${kmhText(m.shownSpeedKmH)}`;
	const raw = m.speedAt100KmH - 100;
	if (raw === 0) return `${lead} – genauso schnell wie mit der bisherigen Größe.`;
	if (m.shownSpeedDeltaKmH === 0) return `${lead} – weniger als ${kmhText(.1)} Unterschied zur bisherigen Größe.`;
	return `${lead} – ${kmhText(Math.abs(m.shownSpeedDeltaKmH))} ${raw > 0 ? "mehr" : "weniger"} als mit der bisherigen Größe.`;
}
/** What the speedometer does against before, judged on the printed percentage (never a hidden digit). */
function speedoDirection(m) {
	if (!Number.isFinite(m.shownPercent)) return null;
	if (m.shownPercent === 0) return "Rechnerisch ändert sich die Tachoanzeige nicht.";
	return `Bei gleicher Geschwindigkeit zeigt der Tacho also ${m.shownPercent > 0 ? "weniger" : "mehr"} an als bisher.`;
}
/** The Tachoangleichung line, or null: only when the speedometer now reads less than before. */
function speedoAdjust(m) {
	return Number.isFinite(m.shownPercent) && m.shownPercent > 0 ? SPEEDO_ADJUST_NOTE : null;
}
/** `Außendurchmesser rechnerisch 634 mm → 640 mm · Abrollumfang +0,91 %` */
function sizeFigures(m) {
	return `Außendurchmesser rechnerisch ${wholeMmText(m.current.diameterMm)} → ${wholeMmText(m.next.diameterMm)} · Abrollumfang ${percentText(m.circumferenceDeltaPercent)}`;
}
var VALUE = /\d{3}\/\d{2}\s?R\d{2}|ET\s[−-]?\d+|[+−±]?\d+(?:[.,]\d+)*(?:J|\s(?:mm|km\/h|%|Zoll|kg))?/gu;
/** Splits a sentence into prose and figures, in order; joined, the parts are the sentence again. */
function valueParts(text) {
	const parts = [];
	let last = 0;
	for (const match of text.matchAll(VALUE)) {
		const at = match.index ?? 0;
		if (at > last) parts.push({
			text: text.slice(last, at),
			value: false
		});
		parts.push({
			text: match[0],
			value: true
		});
		last = at + match[0].length;
	}
	if (last < text.length) parts.push({
		text: text.slice(last),
		value: false
	});
	return parts;
}
//#endregion
//#region resources/js/Components/Ui/ValueText.vue?vue&type=script&setup=true&lang.ts
var ValueText_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ValueText",
	__ssrInlineRender: true,
	props: {
		text: {},
		whole: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* The one place the storefront tells the browser's translator to keep its hands off a value.
		* Chrome's page translation once read "5,5 J" as "5.5 years" and "Zoll" as "Customs".
		*
		* Two shapes, one component:
		*
		* - `<ValueText :text="sentence" />` — a line of German prose whose figures must survive: every
		*   value with a unit or a technical code (`8,5J`, `ET 45`, `225/45 R17`, `23 mm`, `+0,91 %`,
		*   `100,9 km/h`) is wrapped in a `translate="no"` span and the words around it stay translatable.
		* - `<ValueText :text="value" whole />` — the string is nothing but a value or a name
		*   (`66,6 mm`, `189,00 €`, `MOTEC MCR4 Ultimate`): it is wrapped whole, in one span.
		*
		* A figure never breaks across a line. Where the element that holds the value exists already and
		* holds nothing else — a spec cell, a size chip, the hero's spec line — that element carries
		* `translate="no"` itself and no span is added.
		*/
		const props = __props;
		const parts = (0, vue_exports.computed)(() => props.whole ? [{
			text: props.text,
			value: true
		}] : valueParts(props.text));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(parts.value, (part, i) => {
				_push(`<!--[-->`);
				if (part.value) _push(`<span class="value" translate="no" data-v-34fcc750>${(0, server_renderer_exports.ssrInterpolate)(part.text)}</span>`);
				else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(part.text)}<!--]-->`);
				_push(`<!--]-->`);
			});
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/ValueText.vue
var _sfc_setup = ValueText_vue_vue_type_script_setup_true_lang_default.setup;
ValueText_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/ValueText.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var ValueText_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ValueText_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-34fcc750"]]);
//#endregion
export { felgen as C, euro as S, zoll as T, rearScene as _, outerSentence as a, wholeMmText as b, speedSentence as c, FAUSTREGEL_MAX_PERCENT as d, FAUSTREGEL_MIN_PERCENT as f, rearFrame as g, percentText as h, innerSentence as i, speedoAdjust as l, felgenModel as m, IMPLAUSIBLE as n, sizeFigures as o, REAR as p, R39_NOTE as r, sizeSentence as s, ValueText_default as t, speedoDirection as u, rimSuitsTyre as v, withUnit as w, decimal as x, signedText as y };
