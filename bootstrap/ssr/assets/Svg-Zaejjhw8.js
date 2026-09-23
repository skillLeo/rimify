import { c as vue_exports } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
//#region resources/js/art/palette.ts
var PALETTES = {
	graphite: {
		lipFrom: "#3A3E45",
		lipTo: "#1C1F24",
		face: "#2A2E34",
		spokeLight: "#565B63"
	},
	silver: {
		lipFrom: "#D8DBE0",
		lipTo: "#9BA1AA",
		face: "#C3C8CF",
		spokeLight: "#F1F3F6"
	},
	black: {
		lipFrom: "#1A1C20",
		lipTo: "#0A0B0D",
		face: "#16181C",
		spokeLight: "#34373D"
	},
	bronze: {
		lipFrom: "#8A6A3C",
		lipTo: "#4E3A1F",
		face: "#6F552F",
		spokeLight: "#B9915A"
	},
	polished: {
		lipFrom: "#E9ECEF",
		lipTo: "#A8AEB6",
		face: "#D5DAE0",
		spokeLight: "#FFFFFF"
	}
};
Object.keys(PALETTES);
function isFinish(value) {
	return value in PALETTES;
}
/** Unknown finish names fall back to graphite rather than throwing — a catalogue row with a
*  colour we have not drawn yet must still produce a card, not a blank grid cell. */
function paletteFor(finish) {
	return isFinish(finish) ? PALETTES[finish] : PALETTES.graphite;
}
/**
* A deterministic id suffix so several wheels on one page never share a gradient.
*
* It must be a pure function of the inputs: a counter or a random value would differ between the
* SSR render and the client render, and Vue would tear the whole tree down as a hydration
* mismatch. Identical inputs producing identical ids is harmless — the gradients are identical too.
*/
function idFor(...parts) {
	const key = parts.join("|");
	let h = 2166136261;
	for (let i = 0; i < key.length; i++) {
		h ^= key.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return (h >>> 0).toString(36);
}
/** Cartesian point on a circle centred at (cx, cy). Degrees, 0° = east, clockwise on screen. */
function polar(cx, cy, r, deg) {
	const rad = deg * Math.PI / 180;
	return [round(cx + r * Math.cos(rad)), round(cy + r * Math.sin(rad))];
}
/** Three decimals is well under a device pixel at any size we render, and keeps the markup small. */
function round(n) {
	return Math.round(n * 1e3) / 1e3;
}
/** An SVG arc segment as a path `d`, drawn the short way round unless it exceeds 180°. */
function arc(cx, cy, r, fromDeg, toDeg) {
	const [x1, y1] = polar(cx, cy, r, fromDeg);
	const [x2, y2] = polar(cx, cy, r, toDeg);
	return `M${x1} ${y1} A${r} ${r} 0 ${Math.abs(toDeg - fromDeg) > 180 ? 1 : 0} ${toDeg > fromDeg ? 1 : 0} ${x2} ${y2}`;
}
//#endregion
//#region resources/js/art/wheel.ts
/**
* `wheelSVG` — the most important function in the build.
*
* A convincing alloy wheel in a 400×400 viewBox, drawn as nine layers back to front
* (artwork spec §1). Rendered once, it appears everywhere: product cards, the PDP gallery,
* cart lines, brand banners, and on the car in the hero.
*
* The ninth layer — one white arc at 18% opacity — is what makes it look like metal rather than a
* diagram of a wheel. It is not optional.
*/
var C = 200;
/** How much of its angular slice a spoke occupies, at the hub and at the rim. */
var HUB_SHARE = .18;
var RIM_SHARE = .32;
function wheelSVG(options = {}) {
	const spokes = normaliseSpokes(options.spokes ?? 5);
	const finish = options.finish ?? "graphite";
	const size = options.size ?? 400;
	const p = paletteFor(finish);
	const id = idFor("wheel", spokes, finish, options.tyre === true, options.initial ?? "");
	const initial = (options.initial ?? "R").slice(0, 1).toUpperCase();
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${size}" height="${size}" ${options.title ? `role="img" aria-label="${escapeAttr$1(options.title)}"` : "role=\"presentation\" aria-hidden=\"true\""} focusable="false">
${defs(id, p.lipFrom, p.lipTo, p.face, p.spokeLight)}
${layer1ContactShadow(id)}
${options.tyre === true ? layer2TyreRing() : ""}
${layer3RimLip(id)}
${layer4BarrelShadow()}
${layer5Face(id)}
${layer6Spokes(spokes, id, p.spokeLight)}
${layer7BoltCircle(p.spokeLight)}
${layer8CentreCap(id, initial, p.spokeLight)}
${layer9Specular()}
</svg>`;
}
/** Only the four counts the spec allows; anything else snaps to the nearest of them. */
function normaliseSpokes(n) {
	return [
		5,
		7,
		10,
		20
	].reduce((best, candidate) => Math.abs(candidate - n) < Math.abs(best - n) ? candidate : best);
}
function defs(id, lipFrom, lipTo, face, light) {
	return `<defs>
  <linearGradient id="lip-${id}" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(-45 .5 .5)">
    <stop offset="0" stop-color="${lipFrom}"/>
    <stop offset="1" stop-color="${lipTo}"/>
  </linearGradient>
  <radialGradient id="face-${id}" cx="38%" cy="32%" r="78%">
    <stop offset="0" stop-color="${light}" stop-opacity=".55"/>
    <stop offset=".45" stop-color="${face}"/>
    <stop offset="1" stop-color="${face}" stop-opacity=".92"/>
  </radialGradient>
  <radialGradient id="cap-${id}" cx="36%" cy="30%" r="80%">
    <stop offset="0" stop-color="${light}"/>
    <stop offset="1" stop-color="${lipTo}"/>
  </radialGradient>
  <filter id="soft-${id}" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="10"/>
  </filter>
</defs>`;
}
function layer1ContactShadow(id) {
	return `<ellipse cx="200" cy="378" rx="150" ry="14" fill="#0E1116" opacity=".16" filter="url(#soft-${id})"/>`;
}
function layer2TyreRing() {
	const treads = [];
	for (let i = 0; i < 28; i++) {
		const deg = i * 360 / 28;
		const [x1, y1] = polar(C, C, 158, deg);
		const [x2, y2] = polar(C, C, 192, deg);
		treads.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`);
	}
	return `<path d="M200 4 A196 196 0 1 1 199.9 4 Z M200 50 A150 150 0 1 0 200.1 50 Z" fill="#15171B" fill-rule="evenodd"/>
<g stroke="#0B0C0F" stroke-width="7" stroke-linecap="butt">${treads.join("")}</g>`;
}
function layer3RimLip(id) {
	return `<circle cx="200" cy="200" r="150" fill="url(#lip-${id})"/>`;
}
function layer4BarrelShadow() {
	return "<circle cx=\"200\" cy=\"200\" r=\"138\" fill=\"#000\" opacity=\".35\"/>";
}
function layer5Face(id) {
	return `<circle cx="200" cy="200" r="132" fill="url(#face-${id})"/>`;
}
function layer6Spokes(n, id, light) {
	const slice = 360 / n;
	const hub = slice * HUB_SHARE;
	const rim = slice * RIM_SHARE;
	const [ix1, iy1] = polar(C, C, 44, -90 - hub);
	const [ox1, oy1] = polar(C, C, 128, -90 - rim);
	const [ox2, oy2] = polar(C, C, 128, -90 + rim);
	const [ix2, iy2] = polar(C, C, 44, -90 + hub);
	const body = `M${ix1} ${iy1} L${ox1} ${oy1} A128 128 0 0 1 ${ox2} ${oy2} L${ix2} ${iy2} A44 44 0 0 0 ${ix1} ${iy1} Z`;
	const one = `<path d="${body}" fill="url(#face-${id})"/><path d="${body}" fill="${light}" opacity=".10"/><path d="${`M${ix1} ${iy1} L${ox1} ${oy1}`}" stroke="${light}" stroke-width="1" fill="none" opacity=".55"/><path d="${`M${ix2} ${iy2} L${ox2} ${oy2}`}" stroke="#000" stroke-width="1" fill="none" opacity=".35"/>`;
	const all = [];
	for (let i = 0; i < n; i++) all.push(`<g transform="rotate(${round(i * 360 / n)} 200 200)">${one}</g>`);
	return all.join("\n");
}
function layer7BoltCircle(light) {
	const holes = [];
	for (let i = 0; i < 5; i++) {
		const [x, y] = polar(C, C, 52, -90 + i * 360 / 5);
		holes.push(`<circle cx="${x}" cy="${y}" r="9" fill="#0A0B0D" opacity=".85"/><path d="${arc(x, y, 9, 20, 160)}" stroke="${light}" stroke-width="1" fill="none" opacity=".45"/>`);
	}
	return holes.join("");
}
function layer8CentreCap(id, initial, light) {
	return `<circle cx="200" cy="200" r="34" fill="url(#cap-${id})"/>
<circle cx="200" cy="200" r="34" fill="none" stroke="${light}" stroke-width="1" opacity=".5"/>
<text x="200" y="208" text-anchor="middle" font-family="Lato, Arial, sans-serif" font-size="20" font-weight="900" fill="#FFF" opacity=".85">${escapeText$2(initial)}</text>`;
}
function layer9Specular() {
	return `<path d="${arc(C, C, 145, 200, 320)}" stroke="#FFF" stroke-opacity=".18" stroke-width="5" stroke-linecap="round" fill="none"/>`;
}
function escapeText$2(s) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr$1(s) {
	return escapeText$2(s).replace(/"/g, "&quot;");
}
//#endregion
//#region resources/js/art/doc.ts
/**
* `docSVG` — the Fahrzeugschein facsimile behind the `?` beside the key-number fields
* (artwork spec §6).
*
* This drawing is the single highest-value piece of help on the site. The customer is holding a
* document and looking for two numbers on it; a paragraph explaining where they are is useless
* next to a picture of the document with the two fields ringed.
*
* Both layouts exist because both are in circulation: the Zulassungsbescheinigung Teil I issued
* since 2005 carries them at 2.1 and 2.2, and the older Fahrzeugschein at 2 and 3. A customer
* shown only the new one and holding the old one is worse off than with no help at all.
*/
function docSVG(variant = "neu", options = {}) {
	const width = options.width ?? 560;
	const id = idFor("doc", variant);
	const a11y = options.title ? `role="img" aria-label="${escapeAttr(options.title)}"` : "role=\"presentation\" aria-hidden=\"true\"";
	const heading = variant === "neu" ? "Zulassungsbescheinigung Teil I" : "Fahrzeugschein";
	const hsnField = variant === "neu" ? "2.1" : "2";
	const tsnField = variant === "neu" ? "2.2" : "3";
	const hsnY = variant === "neu" ? 132 : 122;
	const tsnY = variant === "neu" ? 166 : 190;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 400" width="${width}" height="${Math.round(width * 400 / 560)}" ${a11y} focusable="false">
  <defs>
    <filter id="dsh-${id}" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#0E1116" flood-opacity=".18"/>
    </filter>
  </defs>

  <rect x="20" y="16" width="520" height="368" rx="6" fill="#E8F0E2" stroke="#B9C9AE" stroke-width="1" filter="url(#dsh-${id})"/>

  <text x="44" y="52" font-family="Lato, Arial, sans-serif" font-size="13" font-weight="700" fill="#3C4A34">${escapeText$1(heading)}</text>
  <line x1="44" y1="64" x2="516" y2="64" stroke="#B9C9AE" stroke-width="1"/>

  ${rows(id, hsnY, tsnY)}

  <!-- 2.1 / 2 — HSN, ringed in blue -->
  <rect x="${variant === "neu" ? 40 : 40}" y="${hsnY - 18}" width="214" height="30" rx="4" fill="none" stroke="#1A44D4" stroke-width="2"/>
  <text x="50" y="${hsnY + 2}" font-family="Lato, Arial, sans-serif" font-size="11" font-weight="700" fill="#3C4A34">${hsnField}</text>
  <text x="84" y="${hsnY + 3}" font-family="'IBM Plex Mono', monospace" font-size="14" font-weight="500" letter-spacing="3" fill="#0E1116">0005</text>
  <path d="M254 ${hsnY - 3} H300" stroke="#1A44D4" stroke-width="1.5" fill="none"/>
  <circle cx="302" cy="${hsnY - 3}" r="3" fill="#1A44D4"/>
  <text x="312" y="${hsnY + 1}" font-family="Lato, Arial, sans-serif" font-size="12" font-weight="900" letter-spacing="1.2" fill="#1A44D4">HSN</text>

  <!-- 2.2 / 3 — TSN, ringed in green -->
  <rect x="40" y="${tsnY - 18}" width="214" height="30" rx="4" fill="none" stroke="#2E8B22" stroke-width="2"/>
  <text x="50" y="${tsnY + 2}" font-family="Lato, Arial, sans-serif" font-size="11" font-weight="700" fill="#3C4A34">${tsnField}</text>
  <text x="84" y="${tsnY + 3}" font-family="'IBM Plex Mono', monospace" font-size="14" font-weight="500" letter-spacing="3" fill="#0E1116">AAS</text>
  <path d="M254 ${tsnY - 3} H300" stroke="#2E8B22" stroke-width="1.5" fill="none"/>
  <circle cx="302" cy="${tsnY - 3}" r="3" fill="#2E8B22"/>
  <text x="312" y="${tsnY + 1}" font-family="Lato, Arial, sans-serif" font-size="12" font-weight="900" letter-spacing="1.2" fill="#2E8B22">TSN</text>
</svg>`;
}
/** The numbered field grid the two ringed rows sit inside — greeked, because the document's other
*  fields are not the customer's problem and legible dummy data would only invite reading. */
function rows(id, hsnY, tsnY) {
	const out = [];
	for (let i = 0; i < 9; i++) {
		const y = 100 + i * 32;
		if (Math.abs(y - hsnY) < 20 || Math.abs(y - tsnY) < 20) continue;
		const w = 150 + i * 53 % 120;
		out.push(`<text x="50" y="${y + 2}" font-family="Lato, Arial, sans-serif" font-size="11" font-weight="700" fill="#7C8C74">${i + 4}</text><rect x="84" y="${y - 9}" width="${w}" height="9" rx="2" fill="#C9D8BF"/><rect x="300" y="${y - 9}" width="${110 + i * 37 % 100}" height="9" rx="2" fill="#D6E2CD"/>`);
	}
	return `<g data-doc="${id}">${out.join("")}</g>`;
}
function escapeText$1(s) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s) {
	return escapeText$1(s).replace(/"/g, "&quot;");
}
//#endregion
//#region resources/js/art/misc.ts
/**
* The drawn artwork named outside §4 of the artwork spec (artwork spec §9).
*
* Every one of these replaces something a template would reach for: an emoji tick, a stock
* "secure payment" badge, a gradient login background, a charting library.
*/
/**
* §9 · The dashboard revenue chart: a 2px blue line, a 12% blue fill, faint horizontal grid only,
* the endpoint dotted and labelled.
*
* No library, no axis furniture, no tooltip. Twelve points and a shape.
*/
function revenueChartSVG(points, width = 720, height = 220) {
	const last = points[points.length - 1];
	if (points.length < 2 || last === void 0) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="presentation" aria-hidden="true" focusable="false"></svg>`;
	const id = idFor("revenue", points.length, last.value);
	const padL = 8;
	const padR = 56;
	const padT = 16;
	const padB = 28;
	const values = points.map((p) => p.value);
	const max = Math.max(...values);
	const min = Math.min(...values);
	const span = max - min === 0 ? Math.max(1, max) : max - min;
	const x = (i) => round(padL + i * (width - padL - padR) / (points.length - 1));
	const y = (v) => round(height - padB - (v - min) / span * (height - padT - padB));
	const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(p.value)}`).join(" ");
	const area = `${line} L${x(points.length - 1)} ${height - padB} L${x(0)} ${height - padB} Z`;
	const grid = [];
	for (let g = 0; g <= 3; g++) {
		const gy = round(padT + g * (height - padT - padB) / 3);
		grid.push(`<line x1="${padL}" y1="${gy}" x2="${width - padR}" y2="${gy}"/>`);
	}
	const lastX = x(points.length - 1);
	const lastY = y(last.value);
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="presentation" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="fill-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1A44D4" stop-opacity=".12"/>
      <stop offset="1" stop-color="#1A44D4" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g stroke="currentColor" stroke-opacity=".12" stroke-width="1">${grid.join("")}</g>
  <path d="${area}" fill="url(#fill-${id})"/>
  <path d="${line}" fill="none" stroke="#1A44D4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${lastX}" cy="${lastY}" r="4" fill="#1A44D4"/>
  <circle cx="${lastX}" cy="${lastY}" r="8" fill="none" stroke="#1A44D4" stroke-opacity=".35" stroke-width="1"/>
  <text x="${lastX + 12}" y="${lastY + 4}" font-family="'IBM Plex Mono', monospace" font-size="12" fill="currentColor" fill-opacity=".7">${escapeText(last.label)}</text>
</svg>`;
}
function escapeText(s) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
//#endregion
//#region resources/js/Components/Art/Svg.vue?vue&type=script&setup=true&lang.ts
var Svg_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Svg",
	__ssrInlineRender: true,
	props: { markup: {} },
	setup(__props) {
		/**
		* Renders a generated SVG string.
		*
		* `v-html` is safe here and only here: the markup comes from `resources/js/art/*`, which are pure
		* functions over typed options that escape every value they interpolate. No prop on this component
		* is ever fed a string that arrived from a request, a database row or a CMS block — those go
		* through DOMPurify in the block renderer instead.
		*
		* The wrapper is `display: contents` so it never becomes a layout box of its own; the `<svg>` the
		* generator produced is what the grid sees.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<span${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "art" }, _attrs))} data-v-87a8f36b>${__props.markup ?? ""}</span>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Art/Svg.vue
var _sfc_setup = Svg_vue_vue_type_script_setup_true_lang_default.setup;
Svg_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Art/Svg.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Svg_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Svg_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-87a8f36b"]]);
//#endregion
export { wheelSVG as i, revenueChartSVG as n, docSVG as r, Svg_default as t };
