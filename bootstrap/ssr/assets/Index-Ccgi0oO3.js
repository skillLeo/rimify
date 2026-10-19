import { a as DropdownMenuRoot_default, i as DropdownMenuContent_default, n as DropdownMenuPortal_default, r as DropdownMenuItem_default, t as DropdownMenuTrigger_default } from "./DropdownMenuTrigger-lkcRFLT8.js";
import { n as PeriodSwitcher_default, t as StateChip_default } from "./StateChip-D35is2N8.js";
import { a as useHealth, c as TooltipContent_default, l as TooltipRoot_default, n as AdminLayout_default, o as TooltipTrigger_default, r as railResizing, s as TooltipPortal_default, t as AdminPage_default, u as TooltipProvider_default } from "./AdminPage--fCiRsQr.js";
import { a as link_default, c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { n as formatNumber, r as formatPercent, t as formatMoney } from "./num-Br8qlecZ.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { n as CoverageMatrix_default, t as DashWidget_default } from "./DashWidget-oKfUs4Yd.js";
import { t as AdminState_default } from "./AdminState-QyYV7E7y.js";
//#region node_modules/d3-array/src/ascending.js
function ascending(a, b) {
	return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}
//#endregion
//#region node_modules/d3-array/src/descending.js
function descending(a, b) {
	return a == null || b == null ? NaN : b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
}
//#endregion
//#region node_modules/d3-array/src/bisector.js
function bisector(f) {
	let compare1, compare2, delta;
	if (f.length !== 2) {
		compare1 = ascending;
		compare2 = (d, x) => ascending(f(d), x);
		delta = (d, x) => f(d) - x;
	} else {
		compare1 = f === ascending || f === descending ? f : zero$1;
		compare2 = f;
		delta = f;
	}
	function left(a, x, lo = 0, hi = a.length) {
		if (lo < hi) {
			if (compare1(x, x) !== 0) return hi;
			do {
				const mid = lo + hi >>> 1;
				if (compare2(a[mid], x) < 0) lo = mid + 1;
				else hi = mid;
			} while (lo < hi);
		}
		return lo;
	}
	function right(a, x, lo = 0, hi = a.length) {
		if (lo < hi) {
			if (compare1(x, x) !== 0) return hi;
			do {
				const mid = lo + hi >>> 1;
				if (compare2(a[mid], x) <= 0) lo = mid + 1;
				else hi = mid;
			} while (lo < hi);
		}
		return lo;
	}
	function center(a, x, lo = 0, hi = a.length) {
		const i = left(a, x, lo, hi - 1);
		return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
	}
	return {
		left,
		center,
		right
	};
}
function zero$1() {
	return 0;
}
//#endregion
//#region node_modules/d3-array/src/number.js
function number$1(x) {
	return x === null ? NaN : +x;
}
//#endregion
//#region node_modules/d3-array/src/bisect.js
var ascendingBisect = bisector(ascending);
var bisectRight = ascendingBisect.right;
ascendingBisect.left;
bisector(number$1).center;
//#endregion
//#region node_modules/internmap/src/index.js
var InternMap = class extends Map {
	constructor(entries, key = keyof) {
		super();
		Object.defineProperties(this, {
			_intern: { value: /* @__PURE__ */ new Map() },
			_key: { value: key }
		});
		if (entries != null) for (const [key, value] of entries) this.set(key, value);
	}
	get(key) {
		return super.get(intern_get(this, key));
	}
	has(key) {
		return super.has(intern_get(this, key));
	}
	set(key, value) {
		return super.set(intern_set(this, key), value);
	}
	delete(key) {
		return super.delete(intern_delete(this, key));
	}
};
function intern_get({ _intern, _key }, value) {
	const key = _key(value);
	return _intern.has(key) ? _intern.get(key) : value;
}
function intern_set({ _intern, _key }, value) {
	const key = _key(value);
	if (_intern.has(key)) return _intern.get(key);
	_intern.set(key, value);
	return value;
}
function intern_delete({ _intern, _key }, value) {
	const key = _key(value);
	if (_intern.has(key)) {
		value = _intern.get(key);
		_intern.delete(key);
	}
	return value;
}
function keyof(value) {
	return value !== null && typeof value === "object" ? value.valueOf() : value;
}
//#endregion
//#region node_modules/d3-array/src/ticks.js
var e10 = Math.sqrt(50);
var e5 = Math.sqrt(10);
var e2 = Math.sqrt(2);
function tickSpec(start, stop, count) {
	const step = (stop - start) / Math.max(0, count), power = Math.floor(Math.log10(step)), error = step / Math.pow(10, power), factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
	let i1, i2, inc;
	if (power < 0) {
		inc = Math.pow(10, -power) / factor;
		i1 = Math.round(start * inc);
		i2 = Math.round(stop * inc);
		if (i1 / inc < start) ++i1;
		if (i2 / inc > stop) --i2;
		inc = -inc;
	} else {
		inc = Math.pow(10, power) * factor;
		i1 = Math.round(start / inc);
		i2 = Math.round(stop / inc);
		if (i1 * inc < start) ++i1;
		if (i2 * inc > stop) --i2;
	}
	if (i2 < i1 && .5 <= count && count < 2) return tickSpec(start, stop, count * 2);
	return [
		i1,
		i2,
		inc
	];
}
function ticks(start, stop, count) {
	stop = +stop, start = +start, count = +count;
	if (!(count > 0)) return [];
	if (start === stop) return [start];
	const reverse = stop < start, [i1, i2, inc] = reverse ? tickSpec(stop, start, count) : tickSpec(start, stop, count);
	if (!(i2 >= i1)) return [];
	const n = i2 - i1 + 1, ticks = new Array(n);
	if (reverse) {
		if (inc < 0) for (let i = 0; i < n; ++i) ticks[i] = (i2 - i) / -inc;
		else for (let i = 0; i < n; ++i) ticks[i] = (i2 - i) * inc;
	} else if (inc < 0) for (let i = 0; i < n; ++i) ticks[i] = (i1 + i) / -inc;
	else for (let i = 0; i < n; ++i) ticks[i] = (i1 + i) * inc;
	return ticks;
}
function tickIncrement(start, stop, count) {
	stop = +stop, start = +start, count = +count;
	return tickSpec(start, stop, count)[2];
}
function tickStep(start, stop, count) {
	stop = +stop, start = +start, count = +count;
	const reverse = stop < start, inc = reverse ? tickIncrement(stop, start, count) : tickIncrement(start, stop, count);
	return (reverse ? -1 : 1) * (inc < 0 ? 1 / -inc : inc);
}
//#endregion
//#region node_modules/d3-array/src/range.js
function range(start, stop, step) {
	start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;
	var i = -1, n = Math.max(0, Math.ceil((stop - start) / step)) | 0, range = new Array(n);
	while (++i < n) range[i] = start + i * step;
	return range;
}
//#endregion
//#region node_modules/d3-scale/src/init.js
function initRange(domain, range) {
	switch (arguments.length) {
		case 0: break;
		case 1:
			this.range(domain);
			break;
		default: this.range(range).domain(domain);
	}
	return this;
}
//#endregion
//#region node_modules/d3-scale/src/ordinal.js
var implicit = Symbol("implicit");
function ordinal() {
	var index = new InternMap(), domain = [], range = [], unknown = implicit;
	function scale(d) {
		let i = index.get(d);
		if (i === void 0) {
			if (unknown !== implicit) return unknown;
			index.set(d, i = domain.push(d) - 1);
		}
		return range[i % range.length];
	}
	scale.domain = function(_) {
		if (!arguments.length) return domain.slice();
		domain = [], index = new InternMap();
		for (const value of _) {
			if (index.has(value)) continue;
			index.set(value, domain.push(value) - 1);
		}
		return scale;
	};
	scale.range = function(_) {
		return arguments.length ? (range = Array.from(_), scale) : range.slice();
	};
	scale.unknown = function(_) {
		return arguments.length ? (unknown = _, scale) : unknown;
	};
	scale.copy = function() {
		return ordinal(domain, range).unknown(unknown);
	};
	initRange.apply(scale, arguments);
	return scale;
}
//#endregion
//#region node_modules/d3-scale/src/band.js
function band() {
	var scale = ordinal().unknown(void 0), domain = scale.domain, ordinalRange = scale.range, r0 = 0, r1 = 1, step, bandwidth, round = false, paddingInner = 0, paddingOuter = 0, align = .5;
	delete scale.unknown;
	function rescale() {
		var n = domain().length, reverse = r1 < r0, start = reverse ? r1 : r0, stop = reverse ? r0 : r1;
		step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
		if (round) step = Math.floor(step);
		start += (stop - start - step * (n - paddingInner)) * align;
		bandwidth = step * (1 - paddingInner);
		if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
		var values = range(n).map(function(i) {
			return start + step * i;
		});
		return ordinalRange(reverse ? values.reverse() : values);
	}
	scale.domain = function(_) {
		return arguments.length ? (domain(_), rescale()) : domain();
	};
	scale.range = function(_) {
		return arguments.length ? ([r0, r1] = _, r0 = +r0, r1 = +r1, rescale()) : [r0, r1];
	};
	scale.rangeRound = function(_) {
		return [r0, r1] = _, r0 = +r0, r1 = +r1, round = true, rescale();
	};
	scale.bandwidth = function() {
		return bandwidth;
	};
	scale.step = function() {
		return step;
	};
	scale.round = function(_) {
		return arguments.length ? (round = !!_, rescale()) : round;
	};
	scale.padding = function(_) {
		return arguments.length ? (paddingInner = Math.min(1, paddingOuter = +_), rescale()) : paddingInner;
	};
	scale.paddingInner = function(_) {
		return arguments.length ? (paddingInner = Math.min(1, _), rescale()) : paddingInner;
	};
	scale.paddingOuter = function(_) {
		return arguments.length ? (paddingOuter = +_, rescale()) : paddingOuter;
	};
	scale.align = function(_) {
		return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
	};
	scale.copy = function() {
		return band(domain(), [r0, r1]).round(round).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align);
	};
	return initRange.apply(rescale(), arguments);
}
//#endregion
//#region node_modules/d3-color/src/define.js
function define_default(constructor, factory, prototype) {
	constructor.prototype = factory.prototype = prototype;
	prototype.constructor = constructor;
}
function extend(parent, definition) {
	var prototype = Object.create(parent.prototype);
	for (var key in definition) prototype[key] = definition[key];
	return prototype;
}
//#endregion
//#region node_modules/d3-color/src/color.js
function Color() {}
var darker = .7;
var brighter = 1 / darker;
var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex = /^#([0-9a-f]{3,8})$/;
var reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`);
var reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`);
var reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`);
var reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`);
var reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`);
var reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
var named = {
	aliceblue: 15792383,
	antiquewhite: 16444375,
	aqua: 65535,
	aquamarine: 8388564,
	azure: 15794175,
	beige: 16119260,
	bisque: 16770244,
	black: 0,
	blanchedalmond: 16772045,
	blue: 255,
	blueviolet: 9055202,
	brown: 10824234,
	burlywood: 14596231,
	cadetblue: 6266528,
	chartreuse: 8388352,
	chocolate: 13789470,
	coral: 16744272,
	cornflowerblue: 6591981,
	cornsilk: 16775388,
	crimson: 14423100,
	cyan: 65535,
	darkblue: 139,
	darkcyan: 35723,
	darkgoldenrod: 12092939,
	darkgray: 11119017,
	darkgreen: 25600,
	darkgrey: 11119017,
	darkkhaki: 12433259,
	darkmagenta: 9109643,
	darkolivegreen: 5597999,
	darkorange: 16747520,
	darkorchid: 10040012,
	darkred: 9109504,
	darksalmon: 15308410,
	darkseagreen: 9419919,
	darkslateblue: 4734347,
	darkslategray: 3100495,
	darkslategrey: 3100495,
	darkturquoise: 52945,
	darkviolet: 9699539,
	deeppink: 16716947,
	deepskyblue: 49151,
	dimgray: 6908265,
	dimgrey: 6908265,
	dodgerblue: 2003199,
	firebrick: 11674146,
	floralwhite: 16775920,
	forestgreen: 2263842,
	fuchsia: 16711935,
	gainsboro: 14474460,
	ghostwhite: 16316671,
	gold: 16766720,
	goldenrod: 14329120,
	gray: 8421504,
	green: 32768,
	greenyellow: 11403055,
	grey: 8421504,
	honeydew: 15794160,
	hotpink: 16738740,
	indianred: 13458524,
	indigo: 4915330,
	ivory: 16777200,
	khaki: 15787660,
	lavender: 15132410,
	lavenderblush: 16773365,
	lawngreen: 8190976,
	lemonchiffon: 16775885,
	lightblue: 11393254,
	lightcoral: 15761536,
	lightcyan: 14745599,
	lightgoldenrodyellow: 16448210,
	lightgray: 13882323,
	lightgreen: 9498256,
	lightgrey: 13882323,
	lightpink: 16758465,
	lightsalmon: 16752762,
	lightseagreen: 2142890,
	lightskyblue: 8900346,
	lightslategray: 7833753,
	lightslategrey: 7833753,
	lightsteelblue: 11584734,
	lightyellow: 16777184,
	lime: 65280,
	limegreen: 3329330,
	linen: 16445670,
	magenta: 16711935,
	maroon: 8388608,
	mediumaquamarine: 6737322,
	mediumblue: 205,
	mediumorchid: 12211667,
	mediumpurple: 9662683,
	mediumseagreen: 3978097,
	mediumslateblue: 8087790,
	mediumspringgreen: 64154,
	mediumturquoise: 4772300,
	mediumvioletred: 13047173,
	midnightblue: 1644912,
	mintcream: 16121850,
	mistyrose: 16770273,
	moccasin: 16770229,
	navajowhite: 16768685,
	navy: 128,
	oldlace: 16643558,
	olive: 8421376,
	olivedrab: 7048739,
	orange: 16753920,
	orangered: 16729344,
	orchid: 14315734,
	palegoldenrod: 15657130,
	palegreen: 10025880,
	paleturquoise: 11529966,
	palevioletred: 14381203,
	papayawhip: 16773077,
	peachpuff: 16767673,
	peru: 13468991,
	pink: 16761035,
	plum: 14524637,
	powderblue: 11591910,
	purple: 8388736,
	rebeccapurple: 6697881,
	red: 16711680,
	rosybrown: 12357519,
	royalblue: 4286945,
	saddlebrown: 9127187,
	salmon: 16416882,
	sandybrown: 16032864,
	seagreen: 3050327,
	seashell: 16774638,
	sienna: 10506797,
	silver: 12632256,
	skyblue: 8900331,
	slateblue: 6970061,
	slategray: 7372944,
	slategrey: 7372944,
	snow: 16775930,
	springgreen: 65407,
	steelblue: 4620980,
	tan: 13808780,
	teal: 32896,
	thistle: 14204888,
	tomato: 16737095,
	turquoise: 4251856,
	violet: 15631086,
	wheat: 16113331,
	white: 16777215,
	whitesmoke: 16119285,
	yellow: 16776960,
	yellowgreen: 10145074
};
define_default(Color, color, {
	copy(channels) {
		return Object.assign(new this.constructor(), this, channels);
	},
	displayable() {
		return this.rgb().displayable();
	},
	hex: color_formatHex,
	formatHex: color_formatHex,
	formatHex8: color_formatHex8,
	formatHsl: color_formatHsl,
	formatRgb: color_formatRgb,
	toString: color_formatRgb
});
function color_formatHex() {
	return this.rgb().formatHex();
}
function color_formatHex8() {
	return this.rgb().formatHex8();
}
function color_formatHsl() {
	return hslConvert(this).formatHsl();
}
function color_formatRgb() {
	return this.rgb().formatRgb();
}
function color(format) {
	var m, l;
	format = (format + "").trim().toLowerCase();
	return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) : l === 3 ? new Rgb(m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, (m & 15) << 4 | m & 15, 1) : l === 8 ? rgba(m >> 24 & 255, m >> 16 & 255, m >> 8 & 255, (m & 255) / 255) : l === 4 ? rgba(m >> 12 & 15 | m >> 8 & 240, m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, ((m & 15) << 4 | m & 15) / 255) : null) : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) : named.hasOwnProperty(format) ? rgbn(named[format]) : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
}
function rgbn(n) {
	return new Rgb(n >> 16 & 255, n >> 8 & 255, n & 255, 1);
}
function rgba(r, g, b, a) {
	if (a <= 0) r = g = b = NaN;
	return new Rgb(r, g, b, a);
}
function rgbConvert(o) {
	if (!(o instanceof Color)) o = color(o);
	if (!o) return new Rgb();
	o = o.rgb();
	return new Rgb(o.r, o.g, o.b, o.opacity);
}
function rgb(r, g, b, opacity) {
	return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}
function Rgb(r, g, b, opacity) {
	this.r = +r;
	this.g = +g;
	this.b = +b;
	this.opacity = +opacity;
}
define_default(Rgb, rgb, extend(Color, {
	brighter(k) {
		k = k == null ? brighter : Math.pow(brighter, k);
		return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
	},
	darker(k) {
		k = k == null ? darker : Math.pow(darker, k);
		return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
	},
	rgb() {
		return this;
	},
	clamp() {
		return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
	},
	displayable() {
		return -.5 <= this.r && this.r < 255.5 && -.5 <= this.g && this.g < 255.5 && -.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
	},
	hex: rgb_formatHex,
	formatHex: rgb_formatHex,
	formatHex8: rgb_formatHex8,
	formatRgb: rgb_formatRgb,
	toString: rgb_formatRgb
}));
function rgb_formatHex() {
	return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}
function rgb_formatHex8() {
	return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function rgb_formatRgb() {
	const a = clampa(this.opacity);
	return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
}
function clampa(opacity) {
	return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}
function clampi(value) {
	return Math.max(0, Math.min(255, Math.round(value) || 0));
}
function hex(value) {
	value = clampi(value);
	return (value < 16 ? "0" : "") + value.toString(16);
}
function hsla(h, s, l, a) {
	if (a <= 0) h = s = l = NaN;
	else if (l <= 0 || l >= 1) h = s = NaN;
	else if (s <= 0) h = NaN;
	return new Hsl(h, s, l, a);
}
function hslConvert(o) {
	if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
	if (!(o instanceof Color)) o = color(o);
	if (!o) return new Hsl();
	if (o instanceof Hsl) return o;
	o = o.rgb();
	var r = o.r / 255, g = o.g / 255, b = o.b / 255, min = Math.min(r, g, b), max = Math.max(r, g, b), h = NaN, s = max - min, l = (max + min) / 2;
	if (s) {
		if (r === max) h = (g - b) / s + (g < b) * 6;
		else if (g === max) h = (b - r) / s + 2;
		else h = (r - g) / s + 4;
		s /= l < .5 ? max + min : 2 - max - min;
		h *= 60;
	} else s = l > 0 && l < 1 ? 0 : h;
	return new Hsl(h, s, l, o.opacity);
}
function hsl(h, s, l, opacity) {
	return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}
function Hsl(h, s, l, opacity) {
	this.h = +h;
	this.s = +s;
	this.l = +l;
	this.opacity = +opacity;
}
define_default(Hsl, hsl, extend(Color, {
	brighter(k) {
		k = k == null ? brighter : Math.pow(brighter, k);
		return new Hsl(this.h, this.s, this.l * k, this.opacity);
	},
	darker(k) {
		k = k == null ? darker : Math.pow(darker, k);
		return new Hsl(this.h, this.s, this.l * k, this.opacity);
	},
	rgb() {
		var h = this.h % 360 + (this.h < 0) * 360, s = isNaN(h) || isNaN(this.s) ? 0 : this.s, l = this.l, m2 = l + (l < .5 ? l : 1 - l) * s, m1 = 2 * l - m2;
		return new Rgb(hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2), hsl2rgb(h, m1, m2), hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2), this.opacity);
	},
	clamp() {
		return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
	},
	displayable() {
		return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
	},
	formatHsl() {
		const a = clampa(this.opacity);
		return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
	}
}));
function clamph(value) {
	value = (value || 0) % 360;
	return value < 0 ? value + 360 : value;
}
function clampt(value) {
	return Math.max(0, Math.min(1, value || 0));
}
function hsl2rgb(h, m1, m2) {
	return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
}
//#endregion
//#region node_modules/d3-interpolate/src/constant.js
var constant_default$1 = (x) => () => x;
//#endregion
//#region node_modules/d3-interpolate/src/color.js
function linear$1(a, d) {
	return function(t) {
		return a + t * d;
	};
}
function exponential(a, b, y) {
	return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
		return Math.pow(a + t * b, y);
	};
}
function gamma(y) {
	return (y = +y) === 1 ? nogamma : function(a, b) {
		return b - a ? exponential(a, b, y) : constant_default$1(isNaN(a) ? b : a);
	};
}
function nogamma(a, b) {
	var d = b - a;
	return d ? linear$1(a, d) : constant_default$1(isNaN(a) ? b : a);
}
//#endregion
//#region node_modules/d3-interpolate/src/rgb.js
var rgb_default = (function rgbGamma(y) {
	var color = gamma(y);
	function rgb$1(start, end) {
		var r = color((start = rgb(start)).r, (end = rgb(end)).r), g = color(start.g, end.g), b = color(start.b, end.b), opacity = nogamma(start.opacity, end.opacity);
		return function(t) {
			start.r = r(t);
			start.g = g(t);
			start.b = b(t);
			start.opacity = opacity(t);
			return start + "";
		};
	}
	rgb$1.gamma = rgbGamma;
	return rgb$1;
})(1);
//#endregion
//#region node_modules/d3-interpolate/src/numberArray.js
function numberArray_default(a, b) {
	if (!b) b = [];
	var n = a ? Math.min(b.length, a.length) : 0, c = b.slice(), i;
	return function(t) {
		for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
		return c;
	};
}
function isNumberArray(x) {
	return ArrayBuffer.isView(x) && !(x instanceof DataView);
}
//#endregion
//#region node_modules/d3-interpolate/src/array.js
function genericArray(a, b) {
	var nb = b ? b.length : 0, na = a ? Math.min(nb, a.length) : 0, x = new Array(na), c = new Array(nb), i = 0;
	for (; i < na; ++i) x[i] = value_default(a[i], b[i]);
	for (; i < nb; ++i) c[i] = b[i];
	return function(t) {
		for (i = 0; i < na; ++i) c[i] = x[i](t);
		return c;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/date.js
function date_default(a, b) {
	var d = /* @__PURE__ */ new Date();
	return a = +a, b = +b, function(t) {
		return d.setTime(a * (1 - t) + b * t), d;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/number.js
function number_default(a, b) {
	return a = +a, b = +b, function(t) {
		return a * (1 - t) + b * t;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/object.js
function object_default(a, b) {
	var i = {}, c = {}, k;
	if (a === null || typeof a !== "object") a = {};
	if (b === null || typeof b !== "object") b = {};
	for (k in b) if (k in a) i[k] = value_default(a[k], b[k]);
	else c[k] = b[k];
	return function(t) {
		for (k in i) c[k] = i[k](t);
		return c;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/string.js
var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");
function zero(b) {
	return function() {
		return b;
	};
}
function one(b) {
	return function(t) {
		return b(t) + "";
	};
}
function string_default(a, b) {
	var bi = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i = -1, s = [], q = [];
	a = a + "", b = b + "";
	while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
		if ((bs = bm.index) > bi) {
			bs = b.slice(bi, bs);
			if (s[i]) s[i] += bs;
			else s[++i] = bs;
		}
		if ((am = am[0]) === (bm = bm[0])) {
			if (s[i]) s[i] += bm;
			else s[++i] = bm;
		} else {
			s[++i] = null;
			q.push({
				i,
				x: number_default(am, bm)
			});
		}
		bi = reB.lastIndex;
	}
	if (bi < b.length) {
		bs = b.slice(bi);
		if (s[i]) s[i] += bs;
		else s[++i] = bs;
	}
	return s.length < 2 ? q[0] ? one(q[0].x) : zero(b) : (b = q.length, function(t) {
		for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
		return s.join("");
	});
}
//#endregion
//#region node_modules/d3-interpolate/src/value.js
function value_default(a, b) {
	var t = typeof b, c;
	return b == null || t === "boolean" ? constant_default$1(b) : (t === "number" ? number_default : t === "string" ? (c = color(b)) ? (b = c, rgb_default) : string_default : b instanceof color ? rgb_default : b instanceof Date ? date_default : isNumberArray(b) ? numberArray_default : Array.isArray(b) ? genericArray : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object_default : number_default)(a, b);
}
//#endregion
//#region node_modules/d3-interpolate/src/round.js
function round_default(a, b) {
	return a = +a, b = +b, function(t) {
		return Math.round(a * (1 - t) + b * t);
	};
}
//#endregion
//#region node_modules/d3-scale/src/constant.js
function constants(x) {
	return function() {
		return x;
	};
}
//#endregion
//#region node_modules/d3-scale/src/number.js
function number(x) {
	return +x;
}
//#endregion
//#region node_modules/d3-scale/src/continuous.js
var unit = [0, 1];
function identity(x) {
	return x;
}
function normalize(a, b) {
	return (b -= a = +a) ? function(x) {
		return (x - a) / b;
	} : constants(isNaN(b) ? NaN : .5);
}
function clamper(a, b) {
	var t;
	if (a > b) t = a, a = b, b = t;
	return function(x) {
		return Math.max(a, Math.min(b, x));
	};
}
function bimap(domain, range, interpolate) {
	var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
	if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
	else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
	return function(x) {
		return r0(d0(x));
	};
}
function polymap(domain, range, interpolate) {
	var j = Math.min(domain.length, range.length) - 1, d = new Array(j), r = new Array(j), i = -1;
	if (domain[j] < domain[0]) {
		domain = domain.slice().reverse();
		range = range.slice().reverse();
	}
	while (++i < j) {
		d[i] = normalize(domain[i], domain[i + 1]);
		r[i] = interpolate(range[i], range[i + 1]);
	}
	return function(x) {
		var i = bisectRight(domain, x, 1, j) - 1;
		return r[i](d[i](x));
	};
}
function copy(source, target) {
	return target.domain(source.domain()).range(source.range()).interpolate(source.interpolate()).clamp(source.clamp()).unknown(source.unknown());
}
function transformer() {
	var domain = unit, range = unit, interpolate = value_default, transform, untransform, unknown, clamp = identity, piecewise, output, input;
	function rescale() {
		var n = Math.min(domain.length, range.length);
		if (clamp !== identity) clamp = clamper(domain[0], domain[n - 1]);
		piecewise = n > 2 ? polymap : bimap;
		output = input = null;
		return scale;
	}
	function scale(x) {
		return x == null || isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x)));
	}
	scale.invert = function(y) {
		return clamp(untransform((input || (input = piecewise(range, domain.map(transform), number_default)))(y)));
	};
	scale.domain = function(_) {
		return arguments.length ? (domain = Array.from(_, number), rescale()) : domain.slice();
	};
	scale.range = function(_) {
		return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
	};
	scale.rangeRound = function(_) {
		return range = Array.from(_), interpolate = round_default, rescale();
	};
	scale.clamp = function(_) {
		return arguments.length ? (clamp = _ ? true : identity, rescale()) : clamp !== identity;
	};
	scale.interpolate = function(_) {
		return arguments.length ? (interpolate = _, rescale()) : interpolate;
	};
	scale.unknown = function(_) {
		return arguments.length ? (unknown = _, scale) : unknown;
	};
	return function(t, u) {
		transform = t, untransform = u;
		return rescale();
	};
}
function continuous() {
	return transformer()(identity, identity);
}
//#endregion
//#region node_modules/d3-format/src/formatDecimal.js
function formatDecimal_default(x) {
	return Math.abs(x = Math.round(x)) >= 1e21 ? x.toLocaleString("en").replace(/,/g, "") : x.toString(10);
}
function formatDecimalParts(x, p) {
	if (!isFinite(x) || x === 0) return null;
	var i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e"), coefficient = x.slice(0, i);
	return [coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient, +x.slice(i + 1)];
}
//#endregion
//#region node_modules/d3-format/src/exponent.js
function exponent_default(x) {
	return x = formatDecimalParts(Math.abs(x)), x ? x[1] : NaN;
}
//#endregion
//#region node_modules/d3-format/src/formatGroup.js
function formatGroup_default(grouping, thousands) {
	return function(value, width) {
		var i = value.length, t = [], j = 0, g = grouping[0], length = 0;
		while (i > 0 && g > 0) {
			if (length + g + 1 > width) g = Math.max(1, width - length);
			t.push(value.substring(i -= g, i + g));
			if ((length += g + 1) > width) break;
			g = grouping[j = (j + 1) % grouping.length];
		}
		return t.reverse().join(thousands);
	};
}
//#endregion
//#region node_modules/d3-format/src/formatNumerals.js
function formatNumerals_default(numerals) {
	return function(value) {
		return value.replace(/[0-9]/g, function(i) {
			return numerals[+i];
		});
	};
}
//#endregion
//#region node_modules/d3-format/src/formatSpecifier.js
var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
function formatSpecifier(specifier) {
	if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
	var match;
	return new FormatSpecifier({
		fill: match[1],
		align: match[2],
		sign: match[3],
		symbol: match[4],
		zero: match[5],
		width: match[6],
		comma: match[7],
		precision: match[8] && match[8].slice(1),
		trim: match[9],
		type: match[10]
	});
}
formatSpecifier.prototype = FormatSpecifier.prototype;
function FormatSpecifier(specifier) {
	this.fill = specifier.fill === void 0 ? " " : specifier.fill + "";
	this.align = specifier.align === void 0 ? ">" : specifier.align + "";
	this.sign = specifier.sign === void 0 ? "-" : specifier.sign + "";
	this.symbol = specifier.symbol === void 0 ? "" : specifier.symbol + "";
	this.zero = !!specifier.zero;
	this.width = specifier.width === void 0 ? void 0 : +specifier.width;
	this.comma = !!specifier.comma;
	this.precision = specifier.precision === void 0 ? void 0 : +specifier.precision;
	this.trim = !!specifier.trim;
	this.type = specifier.type === void 0 ? "" : specifier.type + "";
}
FormatSpecifier.prototype.toString = function() {
	return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width === void 0 ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision === void 0 ? "" : "." + Math.max(0, this.precision | 0)) + (this.trim ? "~" : "") + this.type;
};
//#endregion
//#region node_modules/d3-format/src/formatTrim.js
function formatTrim_default(s) {
	out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) switch (s[i]) {
		case ".":
			i0 = i1 = i;
			break;
		case "0":
			if (i0 === 0) i0 = i;
			i1 = i;
			break;
		default:
			if (!+s[i]) break out;
			if (i0 > 0) i0 = 0;
	}
	return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
}
//#endregion
//#region node_modules/d3-format/src/formatPrefixAuto.js
var prefixExponent;
function formatPrefixAuto_default(x, p) {
	var d = formatDecimalParts(x, p);
	if (!d) return prefixExponent = void 0, x.toPrecision(p);
	var coefficient = d[0], exponent = d[1], i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1, n = coefficient.length;
	return i === n ? coefficient : i > n ? coefficient + new Array(i - n + 1).join("0") : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i) : "0." + new Array(1 - i).join("0") + formatDecimalParts(x, Math.max(0, p + i - 1))[0];
}
//#endregion
//#region node_modules/d3-format/src/formatRounded.js
function formatRounded_default(x, p) {
	var d = formatDecimalParts(x, p);
	if (!d) return x + "";
	var coefficient = d[0], exponent = d[1];
	return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1) : coefficient + new Array(exponent - coefficient.length + 2).join("0");
}
//#endregion
//#region node_modules/d3-format/src/formatTypes.js
var formatTypes_default = {
	"%": (x, p) => (x * 100).toFixed(p),
	"b": (x) => Math.round(x).toString(2),
	"c": (x) => x + "",
	"d": formatDecimal_default,
	"e": (x, p) => x.toExponential(p),
	"f": (x, p) => x.toFixed(p),
	"g": (x, p) => x.toPrecision(p),
	"o": (x) => Math.round(x).toString(8),
	"p": (x, p) => formatRounded_default(x * 100, p),
	"r": formatRounded_default,
	"s": formatPrefixAuto_default,
	"X": (x) => Math.round(x).toString(16).toUpperCase(),
	"x": (x) => Math.round(x).toString(16)
};
//#endregion
//#region node_modules/d3-format/src/identity.js
function identity_default(x) {
	return x;
}
//#endregion
//#region node_modules/d3-format/src/locale.js
var map = Array.prototype.map;
var prefixes = [
	"y",
	"z",
	"a",
	"f",
	"p",
	"n",
	"µ",
	"m",
	"",
	"k",
	"M",
	"G",
	"T",
	"P",
	"E",
	"Z",
	"Y"
];
function locale_default(locale) {
	var group = locale.grouping === void 0 || locale.thousands === void 0 ? identity_default : formatGroup_default(map.call(locale.grouping, Number), locale.thousands + ""), currencyPrefix = locale.currency === void 0 ? "" : locale.currency[0] + "", currencySuffix = locale.currency === void 0 ? "" : locale.currency[1] + "", decimal = locale.decimal === void 0 ? "." : locale.decimal + "", numerals = locale.numerals === void 0 ? identity_default : formatNumerals_default(map.call(locale.numerals, String)), percent = locale.percent === void 0 ? "%" : locale.percent + "", minus = locale.minus === void 0 ? "−" : locale.minus + "", nan = locale.nan === void 0 ? "NaN" : locale.nan + "";
	function newFormat(specifier, options) {
		specifier = formatSpecifier(specifier);
		var fill = specifier.fill, align = specifier.align, sign = specifier.sign, symbol = specifier.symbol, zero = specifier.zero, width = specifier.width, comma = specifier.comma, precision = specifier.precision, trim = specifier.trim, type = specifier.type;
		if (type === "n") comma = true, type = "g";
		else if (!formatTypes_default[type]) precision === void 0 && (precision = 12), trim = true, type = "g";
		if (zero || fill === "0" && align === "=") zero = true, fill = "0", align = "=";
		var prefix = (options && options.prefix !== void 0 ? options.prefix : "") + (symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : ""), suffix = (symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "") + (options && options.suffix !== void 0 ? options.suffix : "");
		var formatType = formatTypes_default[type], maybeSuffix = /[defgprs%]/.test(type);
		precision = precision === void 0 ? 6 : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision)) : Math.max(0, Math.min(20, precision));
		function format(value) {
			var valuePrefix = prefix, valueSuffix = suffix, i, n, c;
			if (type === "c") {
				valueSuffix = formatType(value) + valueSuffix;
				value = "";
			} else {
				value = +value;
				var valueNegative = value < 0 || 1 / value < 0;
				value = isNaN(value) ? nan : formatType(Math.abs(value), precision);
				if (trim) value = formatTrim_default(value);
				if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;
				valuePrefix = (valueNegative ? sign === "(" ? sign : minus : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
				valueSuffix = (type === "s" && !isNaN(value) && prefixExponent !== void 0 ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");
				if (maybeSuffix) {
					i = -1, n = value.length;
					while (++i < n) if (c = value.charCodeAt(i), 48 > c || c > 57) {
						valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
						value = value.slice(0, i);
						break;
					}
				}
			}
			if (comma && !zero) value = group(value, Infinity);
			var length = valuePrefix.length + value.length + valueSuffix.length, padding = length < width ? new Array(width - length + 1).join(fill) : "";
			if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";
			switch (align) {
				case "<":
					value = valuePrefix + value + valueSuffix + padding;
					break;
				case "=":
					value = valuePrefix + padding + value + valueSuffix;
					break;
				case "^":
					value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
					break;
				default: value = padding + valuePrefix + value + valueSuffix;
			}
			return numerals(value);
		}
		format.toString = function() {
			return specifier + "";
		};
		return format;
	}
	function formatPrefix(specifier, value) {
		var e = Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3, k = Math.pow(10, -e), f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier), { suffix: prefixes[8 + e / 3] });
		return function(value) {
			return f(k * value);
		};
	}
	return {
		format: newFormat,
		formatPrefix
	};
}
//#endregion
//#region node_modules/d3-format/src/defaultLocale.js
var locale;
var format;
var formatPrefix;
defaultLocale({
	thousands: ",",
	grouping: [3],
	currency: ["$", ""]
});
function defaultLocale(definition) {
	locale = locale_default(definition);
	format = locale.format;
	formatPrefix = locale.formatPrefix;
	return locale;
}
//#endregion
//#region node_modules/d3-format/src/precisionFixed.js
function precisionFixed_default(step) {
	return Math.max(0, -exponent_default(Math.abs(step)));
}
//#endregion
//#region node_modules/d3-format/src/precisionPrefix.js
function precisionPrefix_default(step, value) {
	return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3 - exponent_default(Math.abs(step)));
}
//#endregion
//#region node_modules/d3-format/src/precisionRound.js
function precisionRound_default(step, max) {
	step = Math.abs(step), max = Math.abs(max) - step;
	return Math.max(0, exponent_default(max) - exponent_default(step)) + 1;
}
//#endregion
//#region node_modules/d3-scale/src/tickFormat.js
function tickFormat(start, stop, count, specifier) {
	var step = tickStep(start, stop, count), precision;
	specifier = formatSpecifier(specifier == null ? ",f" : specifier);
	switch (specifier.type) {
		case "s":
			var value = Math.max(Math.abs(start), Math.abs(stop));
			if (specifier.precision == null && !isNaN(precision = precisionPrefix_default(step, value))) specifier.precision = precision;
			return formatPrefix(specifier, value);
		case "":
		case "e":
		case "g":
		case "p":
		case "r":
			if (specifier.precision == null && !isNaN(precision = precisionRound_default(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
			break;
		case "f":
		case "%": if (specifier.precision == null && !isNaN(precision = precisionFixed_default(step))) specifier.precision = precision - (specifier.type === "%") * 2;
	}
	return format(specifier);
}
//#endregion
//#region node_modules/d3-scale/src/linear.js
function linearish(scale) {
	var domain = scale.domain;
	scale.ticks = function(count) {
		var d = domain();
		return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
	};
	scale.tickFormat = function(count, specifier) {
		var d = domain();
		return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
	};
	scale.nice = function(count) {
		if (count == null) count = 10;
		var d = domain();
		var i0 = 0;
		var i1 = d.length - 1;
		var start = d[i0];
		var stop = d[i1];
		var prestep;
		var step;
		var maxIter = 10;
		if (stop < start) {
			step = start, start = stop, stop = step;
			step = i0, i0 = i1, i1 = step;
		}
		while (maxIter-- > 0) {
			step = tickIncrement(start, stop, count);
			if (step === prestep) {
				d[i0] = start;
				d[i1] = stop;
				return domain(d);
			} else if (step > 0) {
				start = Math.floor(start / step) * step;
				stop = Math.ceil(stop / step) * step;
			} else if (step < 0) {
				start = Math.ceil(start * step) / step;
				stop = Math.floor(stop * step) / step;
			} else break;
			prestep = step;
		}
		return scale;
	};
	return scale;
}
function linear() {
	var scale = continuous();
	scale.copy = function() {
		return copy(scale, linear());
	};
	initRange.apply(scale, arguments);
	return linearish(scale);
}
//#endregion
//#region resources/js/Components/Admin/Charts/useWidth.ts
/**
* A chart's own width (and height, where CSS sets it), followed as its panel resizes, so marks and labels are drawn at their true
* size rather than stretched. The server renders at `fallback`; the real width arrives on mount.
*
* A ResizeObserver follows the panel, its reports folded into one per frame. While the rail is being
* dragged the panel changes width on every frame: the chart does not measure at all — its drawing
* scales into its box through the SVG's viewBox meanwhile — and redraws once, when the drag ends
* (railResizing).
*/
function useWidth(fallback = 600, fallbackHeight = 0) {
	const el = (0, vue_exports.ref)(null);
	const width = (0, vue_exports.ref)(fallback);
	/** The box's own height, where CSS sets it (a plot's --adm-plot-h); the fallback until measured. */
	const height = (0, vue_exports.ref)(fallbackHeight);
	let observer = null;
	let frame = 0;
	let waiting = false;
	function measure() {
		if (el.value !== null) {
			const box = el.value.getBoundingClientRect();
			width.value = Math.max(120, Math.round(box.width)) || fallback;
			height.value = Math.round(box.height) || fallbackHeight;
		}
	}
	(0, vue_exports.onMounted)(() => {
		if (el.value === null) return;
		measure();
		if (typeof ResizeObserver === "undefined") return;
		observer = new ResizeObserver(() => {
			if (railResizing.value) {
				waiting = true;
				return;
			}
			if (frame === 0) frame = requestAnimationFrame(() => {
				frame = 0;
				measure();
			});
		});
		observer.observe(el.value);
	});
	const stop = (0, vue_exports.watch)(railResizing, (resizing) => {
		if (!resizing && waiting) {
			waiting = false;
			measure();
		}
	});
	(0, vue_exports.onBeforeUnmount)(() => {
		observer?.disconnect();
		cancelAnimationFrame(frame);
		stop();
	});
	return {
		el,
		width,
		height
	};
}
/** Whether marks may animate in: never with reduced motion, and never outside a browser. */
function mayAnimate() {
	return typeof window !== "undefined" && typeof window.matchMedia === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
//#endregion
//#region resources/js/Components/Admin/Charts/BarChart.vue?vue&type=script&setup=true&lang.ts
var TOP = 7;
var BarChart_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "BarChart",
	__ssrInlineRender: true,
	props: {
		bars: {},
		label: {}
	},
	setup(__props) {
		/**
		* Magnitudes, ranked (BRIEF §5: magnitudes → bars; one series is the story → that series in the
		* accent and the rest grey). Horizontal, the top seven, a 36 px row with 8 px between — so the card
		* is as tall as its data, never taller. The label has two weights on two lines: the Felge, then the
		* size most of its orders took, quieter — a row of fixed height, so its skeleton matches it. The first bar in the
		* accent, every other grey; square at the baseline, rounded at the data end; the figure stands at
		* the tip (the title says what it counts).
		*
		* The widths come from one `d3-scale` linear scale, zero to the largest value; bars grow from the
		* baseline once, on the first paint.
		*/
		const props = __props;
		/** The ranking's length: seven reads at a glance, eight is a list. */
		const growIn = (0, vue_exports.ref)(false);
		(0, vue_exports.onMounted)(() => {
			growIn.value = mayAnimate();
		});
		const rows = (0, vue_exports.computed)(() => {
			const bars = props.bars.slice(0, TOP);
			const max = Math.max(1, ...bars.map((b) => b.value));
			const x = linear().domain([0, max]).range([0, 100]);
			return bars.map((bar, i) => ({
				...bar,
				name: bar.label.replace(/-/g, "‑"),
				share: x(bar.value) / 100,
				lead: i === 0,
				figure: formatNumber(bar.value)
			}));
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<ol${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "bc",
				"aria-label": __props.label
			}, _attrs))} data-v-da1561da><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(rows.value, (row) => {
				_push(`<li class="bc__row" data-v-da1561da><span class="bc__label" data-v-da1561da><span class="bc__name" data-v-da1561da>${(0, server_renderer_exports.ssrInterpolate)(row.name)}</span>`);
				if (row.size) _push(`<span class="bc__size" data-v-da1561da>${(0, server_renderer_exports.ssrInterpolate)(row.size)}</span>`);
				else _push(`<!---->`);
				_push(`</span><span class="bc__track" data-v-da1561da><span class="${(0, server_renderer_exports.ssrRenderClass)([{
					"bc__bar--lead": row.lead,
					"bc__bar--grow": growIn.value
				}, "bc__bar"])}" style="${(0, server_renderer_exports.ssrRenderStyle)({ "--share": row.share })}" aria-hidden="true" data-v-da1561da></span><span class="bc__value" data-v-da1561da>${(0, server_renderer_exports.ssrInterpolate)(row.figure)}<span class="visually-hidden" data-v-da1561da>${(0, server_renderer_exports.ssrInterpolate)(row.value === 1 ? " Bestellung" : " Bestellungen")}</span></span></span></li>`);
			});
			_push(`<!--]--></ol>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Charts/BarChart.vue
var _sfc_setup$13 = BarChart_vue_vue_type_script_setup_true_lang_default.setup;
BarChart_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Charts/BarChart.vue");
	return _sfc_setup$13 ? _sfc_setup$13(props, ctx) : void 0;
};
var BarChart_default = /*#__PURE__*/ _plugin_vue_export_helper_default(BarChart_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-da1561da"]]);
//#endregion
//#region resources/js/Components/Admin/Charts/ChartMenu.vue?vue&type=script&setup=true&lang.ts
var ChartMenu_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ChartMenu",
	__ssrInlineRender: true,
	props: {
		title: {},
		table: { type: Boolean },
		header: {},
		rows: {},
		filename: {}
	},
	emits: ["update:table"],
	setup(__props, { emit: __emit }) {
		/**
		* Every chart's menu (BRIEF §4): „Tabelle anzeigen“ turns the drawing into the same numbers as a
		* table and back; „Als CSV“ saves those numbers. The table is also what a screen reader is offered,
		* so a chart never holds a number that cannot be read without seeing it.
		*/
		const props = __props;
		const emit = __emit;
		function cell(value) {
			const defused = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
			return /[;"\n]/.test(defused) ? `"${defused.replace(/"/g, "\"\"")}"` : defused;
		}
		function download() {
			const text = "﻿" + [props.header, ...props.rows].map((row) => row.map(cell).join(";")).join("\r\n");
			const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
			const link = document.createElement("a");
			link.href = url;
			link.download = `${props.filename}.csv`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.setTimeout(() => URL.revokeObjectURL(url), 1e3);
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), _attrs, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
							class: "adm-iconbtn",
							"aria-label": `Menü: ${__props.title}`
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
									name: "more",
									size: 20
								}, null, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "more",
									size: 20
								})];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuContent_default), {
									class: "adm-menu",
									align: "end",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "adm-menu__item",
												onSelect: ($event) => emit("update:table", !__props.table)
											}, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) {
														_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
															name: __props.table ? "chart" : "table",
															size: 20
														}, null, _parent, _scopeId));
														_push(` ${(0, server_renderer_exports.ssrInterpolate)(__props.table ? "Diagramm anzeigen" : "Tabelle anzeigen")}`);
													} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: __props.table ? "chart" : "table",
														size: 20
													}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(__props.table ? "Diagramm anzeigen" : "Tabelle anzeigen"), 1)];
												}),
												_: 1
											}, _parent, _scopeId));
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "adm-menu__item",
												onSelect: download
											}, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) {
														_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
															name: "export",
															size: 20
														}, null, _parent, _scopeId));
														_push(` Als CSV `);
													} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "export",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Als CSV ")];
												}),
												_: 1
											}, _parent, _scopeId));
										} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
											class: "adm-menu__item",
											onSelect: ($event) => emit("update:table", !__props.table)
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: __props.table ? "chart" : "table",
												size: 20
											}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(__props.table ? "Diagramm anzeigen" : "Tabelle anzeigen"), 1)]),
											_: 1
										}, 8, ["onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
											class: "adm-menu__item",
											onSelect: download
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "export",
												size: 20
											}), (0, vue_exports.createTextVNode)(" Als CSV ")]),
											_: 1
										})];
									}),
									_: 1
								}, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
									class: "adm-menu",
									align: "end",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
										class: "adm-menu__item",
										onSelect: ($event) => emit("update:table", !__props.table)
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: __props.table ? "chart" : "table",
											size: 20
										}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(__props.table ? "Diagramm anzeigen" : "Tabelle anzeigen"), 1)]),
										_: 1
									}, 8, ["onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
										class: "adm-menu__item",
										onSelect: download
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "export",
											size: 20
										}), (0, vue_exports.createTextVNode)(" Als CSV ")]),
										_: 1
									})]),
									_: 1
								})];
							}),
							_: 1
						}, _parent, _scopeId));
					} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
						class: "adm-iconbtn",
						"aria-label": `Menü: ${__props.title}`
					}, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
							name: "more",
							size: 20
						})]),
						_: 1
					}, 8, ["aria-label"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
							class: "adm-menu",
							align: "end",
							"side-offset": 8
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
								class: "adm-menu__item",
								onSelect: ($event) => emit("update:table", !__props.table)
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: __props.table ? "chart" : "table",
									size: 20
								}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(__props.table ? "Diagramm anzeigen" : "Tabelle anzeigen"), 1)]),
								_: 1
							}, 8, ["onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
								class: "adm-menu__item",
								onSelect: download
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "export",
									size: 20
								}), (0, vue_exports.createTextVNode)(" Als CSV ")]),
								_: 1
							})]),
							_: 1
						})]),
						_: 1
					})];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Charts/ChartMenu.vue
var _sfc_setup$12 = ChartMenu_vue_vue_type_script_setup_true_lang_default.setup;
ChartMenu_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Charts/ChartMenu.vue");
	return _sfc_setup$12 ? _sfc_setup$12(props, ctx) : void 0;
};
var ChartMenu_default = ChartMenu_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Components/Admin/Charts/ChartTable.vue?vue&type=script&setup=true&lang.ts
var ChartTable_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ChartTable",
	__ssrInlineRender: true,
	props: {
		caption: {},
		header: {},
		rows: {}
	},
	setup(__props) {
		/**
		* A chart's numbers as a table — the „Tabelle anzeigen“ view, and what a screen reader is offered.
		* The first column names the row; the rest are right-aligned figures in tabular digits.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "ct-wrap",
				tabindex: "0",
				role: "region",
				"aria-label": __props.caption
			}, _attrs))} data-v-9c20c58a><table class="ct" data-v-9c20c58a><caption class="visually-hidden" data-v-9c20c58a>${(0, server_renderer_exports.ssrInterpolate)(__props.caption)}</caption><thead data-v-9c20c58a><tr data-v-9c20c58a><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.header, (label, i) => {
				_push(`<th scope="col" class="${(0, server_renderer_exports.ssrRenderClass)({ "ct__num": i > 0 })}" data-v-9c20c58a>${(0, server_renderer_exports.ssrInterpolate)(label)}</th>`);
			});
			_push(`<!--]--></tr></thead><tbody data-v-9c20c58a><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.rows, (row, r) => {
				_push(`<tr data-v-9c20c58a><th scope="row" data-v-9c20c58a>${(0, server_renderer_exports.ssrInterpolate)(row[0])}</th><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(row.slice(1), (value, i) => {
					_push(`<td class="ct__num" data-v-9c20c58a>${(0, server_renderer_exports.ssrInterpolate)(value)}</td>`);
				});
				_push(`<!--]--></tr>`);
			});
			_push(`<!--]--></tbody></table></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Charts/ChartTable.vue
var _sfc_setup$11 = ChartTable_vue_vue_type_script_setup_true_lang_default.setup;
ChartTable_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Charts/ChartTable.vue");
	return _sfc_setup$11 ? _sfc_setup$11(props, ctx) : void 0;
};
var ChartTable_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ChartTable_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-9c20c58a"]]);
//#endregion
//#region node_modules/d3-shape/src/constant.js
function constant_default(x) {
	return function constant() {
		return x;
	};
}
//#endregion
//#region node_modules/d3-path/src/path.js
var pi = Math.PI;
var tau = 2 * pi;
var epsilon = 1e-6;
var tauEpsilon = tau - epsilon;
function append(strings) {
	this._ += strings[0];
	for (let i = 1, n = strings.length; i < n; ++i) this._ += arguments[i] + strings[i];
}
function appendRound(digits) {
	let d = Math.floor(digits);
	if (!(d >= 0)) throw new Error(`invalid digits: ${digits}`);
	if (d > 15) return append;
	const k = 10 ** d;
	return function(strings) {
		this._ += strings[0];
		for (let i = 1, n = strings.length; i < n; ++i) this._ += Math.round(arguments[i] * k) / k + strings[i];
	};
}
var Path = class {
	constructor(digits) {
		this._x0 = this._y0 = this._x1 = this._y1 = null;
		this._ = "";
		this._append = digits == null ? append : appendRound(digits);
	}
	moveTo(x, y) {
		this._append`M${this._x0 = this._x1 = +x},${this._y0 = this._y1 = +y}`;
	}
	closePath() {
		if (this._x1 !== null) {
			this._x1 = this._x0, this._y1 = this._y0;
			this._append`Z`;
		}
	}
	lineTo(x, y) {
		this._append`L${this._x1 = +x},${this._y1 = +y}`;
	}
	quadraticCurveTo(x1, y1, x, y) {
		this._append`Q${+x1},${+y1},${this._x1 = +x},${this._y1 = +y}`;
	}
	bezierCurveTo(x1, y1, x2, y2, x, y) {
		this._append`C${+x1},${+y1},${+x2},${+y2},${this._x1 = +x},${this._y1 = +y}`;
	}
	arcTo(x1, y1, x2, y2, r) {
		x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;
		if (r < 0) throw new Error(`negative radius: ${r}`);
		let x0 = this._x1, y0 = this._y1, x21 = x2 - x1, y21 = y2 - y1, x01 = x0 - x1, y01 = y0 - y1, l01_2 = x01 * x01 + y01 * y01;
		if (this._x1 === null) this._append`M${this._x1 = x1},${this._y1 = y1}`;
		else if (!(l01_2 > epsilon));
		else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) this._append`L${this._x1 = x1},${this._y1 = y1}`;
		else {
			let x20 = x2 - x0, y20 = y2 - y0, l21_2 = x21 * x21 + y21 * y21, l20_2 = x20 * x20 + y20 * y20, l21 = Math.sqrt(l21_2), l01 = Math.sqrt(l01_2), l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2), t01 = l / l01, t21 = l / l21;
			if (Math.abs(t01 - 1) > epsilon) this._append`L${x1 + t01 * x01},${y1 + t01 * y01}`;
			this._append`A${r},${r},0,0,${+(y01 * x20 > x01 * y20)},${this._x1 = x1 + t21 * x21},${this._y1 = y1 + t21 * y21}`;
		}
	}
	arc(x, y, r, a0, a1, ccw) {
		x = +x, y = +y, r = +r, ccw = !!ccw;
		if (r < 0) throw new Error(`negative radius: ${r}`);
		let dx = r * Math.cos(a0), dy = r * Math.sin(a0), x0 = x + dx, y0 = y + dy, cw = 1 ^ ccw, da = ccw ? a0 - a1 : a1 - a0;
		if (this._x1 === null) this._append`M${x0},${y0}`;
		else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) this._append`L${x0},${y0}`;
		if (!r) return;
		if (da < 0) da = da % tau + tau;
		if (da > tauEpsilon) this._append`A${r},${r},0,1,${cw},${x - dx},${y - dy}A${r},${r},0,1,${cw},${this._x1 = x0},${this._y1 = y0}`;
		else if (da > epsilon) this._append`A${r},${r},0,${+(da >= pi)},${cw},${this._x1 = x + r * Math.cos(a1)},${this._y1 = y + r * Math.sin(a1)}`;
	}
	rect(x, y, w, h) {
		this._append`M${this._x0 = this._x1 = +x},${this._y0 = this._y1 = +y}h${w = +w}v${+h}h${-w}Z`;
	}
	toString() {
		return this._;
	}
};
function path() {
	return new Path();
}
path.prototype = Path.prototype;
//#endregion
//#region node_modules/d3-shape/src/path.js
function withPath(shape) {
	let digits = 3;
	shape.digits = function(_) {
		if (!arguments.length) return digits;
		if (_ == null) digits = null;
		else {
			const d = Math.floor(_);
			if (!(d >= 0)) throw new RangeError(`invalid digits: ${_}`);
			digits = d;
		}
		return shape;
	};
	return () => new Path(digits);
}
Array.prototype.slice;
function array_default(x) {
	return typeof x === "object" && "length" in x ? x : Array.from(x);
}
//#endregion
//#region node_modules/d3-shape/src/curve/linear.js
function Linear(context) {
	this._context = context;
}
Linear.prototype = {
	areaStart: function() {
		this._line = 0;
	},
	areaEnd: function() {
		this._line = NaN;
	},
	lineStart: function() {
		this._point = 0;
	},
	lineEnd: function() {
		if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
		this._line = 1 - this._line;
	},
	point: function(x, y) {
		x = +x, y = +y;
		switch (this._point) {
			case 0:
				this._point = 1;
				this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
				break;
			case 1: this._point = 2;
			default: this._context.lineTo(x, y);
		}
	}
};
function linear_default(context) {
	return new Linear(context);
}
//#endregion
//#region node_modules/d3-shape/src/point.js
function x(p) {
	return p[0];
}
function y(p) {
	return p[1];
}
//#endregion
//#region node_modules/d3-shape/src/line.js
function line_default(x$1, y$1) {
	var defined = constant_default(true), context = null, curve = linear_default, output = null, path = withPath(line);
	x$1 = typeof x$1 === "function" ? x$1 : x$1 === void 0 ? x : constant_default(x$1);
	y$1 = typeof y$1 === "function" ? y$1 : y$1 === void 0 ? y : constant_default(y$1);
	function line(data) {
		var i, n = (data = array_default(data)).length, d, defined0 = false, buffer;
		if (context == null) output = curve(buffer = path());
		for (i = 0; i <= n; ++i) {
			if (!(i < n && defined(d = data[i], i, data)) === defined0) {
				if (defined0 = !defined0) output.lineStart();
				else output.lineEnd();
			}
			if (defined0) output.point(+x$1(d, i, data), +y$1(d, i, data));
		}
		if (buffer) return output = null, buffer + "" || null;
	}
	line.x = function(_) {
		return arguments.length ? (x$1 = typeof _ === "function" ? _ : constant_default(+_), line) : x$1;
	};
	line.y = function(_) {
		return arguments.length ? (y$1 = typeof _ === "function" ? _ : constant_default(+_), line) : y$1;
	};
	line.defined = function(_) {
		return arguments.length ? (defined = typeof _ === "function" ? _ : constant_default(!!_), line) : defined;
	};
	line.curve = function(_) {
		return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
	};
	line.context = function(_) {
		return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
	};
	return line;
}
//#endregion
//#region node_modules/d3-shape/src/curve/monotone.js
function sign(x) {
	return x < 0 ? -1 : 1;
}
function slope3(that, x2, y2) {
	var h0 = that._x1 - that._x0, h1 = x2 - that._x1, s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0), s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0), p = (s0 * h1 + s1 * h0) / (h0 + h1);
	return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), .5 * Math.abs(p)) || 0;
}
function slope2(that, t) {
	var h = that._x1 - that._x0;
	return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
}
function point(that, t0, t1) {
	var x0 = that._x0, y0 = that._y0, x1 = that._x1, y1 = that._y1, dx = (x1 - x0) / 3;
	that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
}
function MonotoneX(context) {
	this._context = context;
}
MonotoneX.prototype = {
	areaStart: function() {
		this._line = 0;
	},
	areaEnd: function() {
		this._line = NaN;
	},
	lineStart: function() {
		this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN;
		this._point = 0;
	},
	lineEnd: function() {
		switch (this._point) {
			case 2:
				this._context.lineTo(this._x1, this._y1);
				break;
			case 3: point(this, this._t0, slope2(this, this._t0));
		}
		if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
		this._line = 1 - this._line;
	},
	point: function(x, y) {
		var t1 = NaN;
		x = +x, y = +y;
		if (x === this._x1 && y === this._y1) return;
		switch (this._point) {
			case 0:
				this._point = 1;
				this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
				break;
			case 1:
				this._point = 2;
				break;
			case 2:
				this._point = 3;
				point(this, slope2(this, t1 = slope3(this, x, y)), t1);
				break;
			default: point(this, this._t0, t1 = slope3(this, x, y));
		}
		this._x0 = this._x1, this._x1 = x;
		this._y0 = this._y1, this._y1 = y;
		this._t0 = t1;
	}
};
function MonotoneY(context) {
	this._context = new ReflectContext(context);
}
(MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function(x, y) {
	MonotoneX.prototype.point.call(this, y, x);
};
function ReflectContext(context) {
	this._context = context;
}
ReflectContext.prototype = {
	moveTo: function(x, y) {
		this._context.moveTo(y, x);
	},
	closePath: function() {
		this._context.closePath();
	},
	lineTo: function(x, y) {
		this._context.lineTo(y, x);
	},
	bezierCurveTo: function(x1, y1, x2, y2, x, y) {
		this._context.bezierCurveTo(y1, x1, y2, x2, y, x);
	}
};
function monotoneX(context) {
	return new MonotoneX(context);
}
//#endregion
//#region resources/js/Components/Admin/Charts/LineChart.vue?vue&type=script&setup=true&lang.ts
var TIP_GAP$1 = 12;
/** The server's drawing, before the box is measured: the widest plot's height. */
var LineChart_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "LineChart",
	__ssrInlineRender: true,
	props: {
		points: {},
		previous: { default: null },
		label: {}
	},
	setup(__props) {
		/**
		* A trend over days (BRIEF §5: a trend is a line), hand-built on d3-scale and d3-shape. One measure,
		* one axis: the period in the accent, 2 px with round caps, no fill; with comparing on, the previous
		* period day for day as a 1 px dotted grey line beside it — never a second axis. Gridlines are solid
		* hairlines; the axis text wears ink. The plot's height is the token's (--adm-plot-h: 260 / 200 /
		* 168 px), measured, so the drawing is never stretched.
		*
		* Only the last point carries a dot and its value. Pointing anywhere over the drawing, or moving with
		* the arrow keys once the chart has focus, sets a crosshair on the nearest day and says its date, the
		* Umsatz and the Bestellungen — aloud as well, through a polite live region. On touch a tap pins it;
		* it stays where it was read until the next tap. Amounts go through num.ts's formatMoney, with the
		* cents; only the axis' round ticks drop them.
		*/
		const props = __props;
		const M = {
			top: 28,
			right: 20,
			bottom: 28,
			left: 72
		};
		/** The room between the crosshair and its tip. */
		const { el, width, height } = useWidth(720, 260);
		const active = (0, vue_exports.ref)(null);
		const drawIn = (0, vue_exports.ref)(false);
		(0, vue_exports.onMounted)(() => {
			drawIn.value = mayAnimate();
		});
		/** An amount, as everywhere: `12.345,67 €` (num.ts). */
		const money = (cents) => formatMoney(cents);
		/** The axis' round ticks: whole euros, `12.000 €`. */
		const tick = (cents) => formatMoney(cents, true);
		function orders(n) {
			return n === 1 ? "1 Bestellung" : `${formatNumber(n)} Bestellungen`;
		}
		const geometry = (0, vue_exports.computed)(() => {
			const n = props.points.length;
			const innerW = Math.max(40, width.value - M.left - M.right);
			const innerH = Math.max(40, height.value - M.top - M.bottom);
			const values = [...props.points.map((p) => p.value), ...(props.previous ?? []).map((p) => p.value)];
			const max = Math.max(1, ...values);
			const x = linear().domain([0, Math.max(1, n - 1)]).range([0, innerW]);
			const y = linear().domain([0, max]).range([innerH, 0]).nice(4);
			const draw = line_default().x((_, i) => x(i)).y((p) => y(p.value)).curve(monotoneX);
			const ticks = y.ticks(4).map((value) => ({
				value,
				y: y(value),
				label: tick(value)
			}));
			const xIdx = n <= 2 ? [0, n - 1] : [
				0,
				Math.floor((n - 1) / 2),
				n - 1
			];
			const xLabels = [...new Set(xIdx)].filter((i) => i >= 0).map((i) => ({
				x: x(i),
				label: props.points[i]?.label.slice(0, 6) ?? "",
				anchor: i === 0 ? "start" : i === n - 1 ? "end" : "middle"
			}));
			const last = n - 1;
			const lastPoint = props.points[last];
			return {
				innerW,
				innerH,
				x,
				y,
				path: draw(props.points) ?? "",
				previous: props.previous ? draw(props.previous) ?? "" : null,
				ticks,
				xLabels,
				last: lastPoint ? {
					x: x(last),
					y: y(lastPoint.value),
					text: money(lastPoint.value)
				} : null
			};
		});
		const hovered = (0, vue_exports.computed)(() => {
			if (active.value === null) return null;
			const point = props.points[active.value];
			if (!point) return null;
			const g = geometry.value;
			const px = g.x(active.value);
			return {
				point,
				previous: props.previous?.[active.value] ?? null,
				x: px,
				y: g.y(point.value),
				left: M.left + px
			};
		});
		const tip = (0, vue_exports.ref)(null);
		const tipWidth = (0, vue_exports.ref)(0);
		(0, vue_exports.watch)(hovered, () => void (0, vue_exports.nextTick)(() => tipWidth.value = tip.value?.offsetWidth ?? 0));
		const tipLeft = (0, vue_exports.computed)(() => {
			const at = hovered.value?.left ?? 0;
			const right = at + TIP_GAP$1;
			if (right + tipWidth.value <= width.value) return right;
			return Math.max(0, Math.min(at - TIP_GAP$1 - tipWidth.value, width.value - tipWidth.value));
		});
		const byKeyboard = (0, vue_exports.ref)(false);
		const announcement = (0, vue_exports.computed)(() => {
			const at = hovered.value;
			return byKeyboard.value && at ? `${at.point.label}: ${money(at.point.value)}, ${orders(at.point.orders)}` : "";
		});
		(0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				ref_key: "el",
				ref: el,
				class: "lc"
			}, _attrs))} data-v-3566e82a><svg class="lc__svg"${(0, server_renderer_exports.ssrRenderAttr)("width", (0, vue_exports.unref)(width))}${(0, server_renderer_exports.ssrRenderAttr)("height", (0, vue_exports.unref)(height))}${(0, server_renderer_exports.ssrRenderAttr)("viewBox", `0 0 ${(0, vue_exports.unref)(width)} ${(0, vue_exports.unref)(height)}`)} preserveAspectRatio="xMinYMin meet" role="group"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${__props.label}. Mit den Pfeiltasten von Tag zu Tag.`)} tabindex="0" focusable="true" data-v-3566e82a><g${(0, server_renderer_exports.ssrRenderAttr)("transform", `translate(${M.left},${M.top})`)} data-v-3566e82a><g class="lc__grid" aria-hidden="true" data-v-3566e82a><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(geometry.value.ticks, (tick) => {
				_push(`<!--[--><line${(0, server_renderer_exports.ssrRenderAttr)("x1", 0)}${(0, server_renderer_exports.ssrRenderAttr)("x2", geometry.value.innerW)}${(0, server_renderer_exports.ssrRenderAttr)("y1", tick.y)}${(0, server_renderer_exports.ssrRenderAttr)("y2", tick.y)} data-v-3566e82a></line><text class="lc__tick"${(0, server_renderer_exports.ssrRenderAttr)("x", -12)}${(0, server_renderer_exports.ssrRenderAttr)("y", tick.y)} dy="0.32em" text-anchor="end" data-v-3566e82a>${(0, server_renderer_exports.ssrInterpolate)(tick.label)}</text><!--]-->`);
			});
			_push(`<!--]--><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(geometry.value.xLabels, (label) => {
				_push(`<text class="lc__tick"${(0, server_renderer_exports.ssrRenderAttr)("x", label.x)}${(0, server_renderer_exports.ssrRenderAttr)("y", geometry.value.innerH + 20)}${(0, server_renderer_exports.ssrRenderAttr)("text-anchor", label.anchor)} data-v-3566e82a>${(0, server_renderer_exports.ssrInterpolate)(label.label)}</text>`);
			});
			_push(`<!--]--></g>`);
			if (geometry.value.previous) _push(`<path class="lc__previous"${(0, server_renderer_exports.ssrRenderAttr)("d", geometry.value.previous)} aria-hidden="true" data-v-3566e82a></path>`);
			else _push(`<!---->`);
			_push(`<path class="${(0, server_renderer_exports.ssrRenderClass)([{ "lc__line--draw": drawIn.value }, "lc__line"])}"${(0, server_renderer_exports.ssrRenderAttr)("d", geometry.value.path)} pathLength="1" aria-hidden="true" data-v-3566e82a></path>`);
			if (geometry.value.last && !hovered.value) _push(`<g aria-hidden="true" data-v-3566e82a><circle class="lc__marker"${(0, server_renderer_exports.ssrRenderAttr)("cx", geometry.value.last.x)}${(0, server_renderer_exports.ssrRenderAttr)("cy", geometry.value.last.y)} r="4" data-v-3566e82a></circle><text class="lc__value"${(0, server_renderer_exports.ssrRenderAttr)("x", geometry.value.last.x)}${(0, server_renderer_exports.ssrRenderAttr)("y", geometry.value.last.y - 12)} text-anchor="end" data-v-3566e82a>${(0, server_renderer_exports.ssrInterpolate)(geometry.value.last.text)}</text></g>`);
			else _push(`<!---->`);
			if (hovered.value) _push(`<g aria-hidden="true" data-v-3566e82a><line class="lc__cross"${(0, server_renderer_exports.ssrRenderAttr)("x1", hovered.value.x)}${(0, server_renderer_exports.ssrRenderAttr)("x2", hovered.value.x)}${(0, server_renderer_exports.ssrRenderAttr)("y1", 0)}${(0, server_renderer_exports.ssrRenderAttr)("y2", geometry.value.innerH)} data-v-3566e82a></line><circle class="lc__marker"${(0, server_renderer_exports.ssrRenderAttr)("cx", hovered.value.x)}${(0, server_renderer_exports.ssrRenderAttr)("cy", hovered.value.y)} r="4" data-v-3566e82a></circle></g>`);
			else _push(`<!---->`);
			_push(`<rect${(0, server_renderer_exports.ssrRenderAttr)("width", geometry.value.innerW)}${(0, server_renderer_exports.ssrRenderAttr)("height", geometry.value.innerH)} fill="transparent" data-v-3566e82a></rect></g></svg>`);
			if (hovered.value) {
				_push(`<div class="lc__tip" style="${(0, server_renderer_exports.ssrRenderStyle)({
					left: `${tipLeft.value}px`,
					top: `${M.top}px`
				})}" aria-hidden="true" data-v-3566e82a><span class="lc__tip-date" data-v-3566e82a>${(0, server_renderer_exports.ssrInterpolate)(hovered.value.point.label)}</span><span class="lc__tip-value" data-v-3566e82a>${(0, server_renderer_exports.ssrInterpolate)(money(hovered.value.point.value))}</span><span class="lc__tip-orders" data-v-3566e82a>${(0, server_renderer_exports.ssrInterpolate)(orders(hovered.value.point.orders))}</span>`);
				if (hovered.value.previous) _push(`<span class="lc__tip-prev" data-v-3566e82a>Vorzeitraum: ${(0, server_renderer_exports.ssrInterpolate)(money(hovered.value.previous.value))}</span>`);
				else _push(`<!---->`);
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`<span class="visually-hidden" role="status" data-v-3566e82a>${(0, server_renderer_exports.ssrInterpolate)(announcement.value)}</span></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Charts/LineChart.vue
var _sfc_setup$10 = LineChart_vue_vue_type_script_setup_true_lang_default.setup;
LineChart_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Charts/LineChart.vue");
	return _sfc_setup$10 ? _sfc_setup$10(props, ctx) : void 0;
};
var LineChart_default = /*#__PURE__*/ _plugin_vue_export_helper_default(LineChart_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-3566e82a"]]);
//#endregion
//#region resources/js/Components/Admin/Charts/StackedBar.vue?vue&type=script&setup=true&lang.ts
var GAP = 2;
var RADIUS = 4;
var MAX_BAR = 24;
/** What one week label ("KW 38") needs on the axis, with air on either side. */
var LABEL_ROOM = 44;
/** The room between the column and its tip. */
var TIP_GAP = 16;
var StackedBar_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "StackedBar",
	__ssrInlineRender: true,
	props: {
		chart: {},
		label: {},
		loading: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* Part of a whole, over weeks (BRIEF §5: part of a whole → a stacked bar). One column per week, the
		* series stacked in their fixed order and colours (colour follows the series, never the rank; the
		* verdicts wear --chart-verdict-*, reserved for them). Columns are 24 px at most; touching segments
		* are parted by a 2 px gap in the surface colour, never a stroke; only the data end of a column is
		* rounded, 4 px, its base stays square. The plot's height is the token's (--adm-plot-h).
		*
		* The legend, top right, names every series in words. Pointing at a column, or moving with the arrow keys,
		* shows that week's numbers. Columns grow from the baseline once, on the first paint.
		*/
		const props = __props;
		const M = {
			top: 12,
			right: 8,
			bottom: 28,
			left: 44
		};
		const { el, width, height } = useWidth(360, 260);
		const active = (0, vue_exports.ref)(null);
		const growIn = (0, vue_exports.ref)(false);
		(0, vue_exports.onMounted)(() => {
			growIn.value = mayAnimate();
		});
		/** A rectangle whose top corners are rounded and whose base is square. */
		function column(x, y, w, h, rounded) {
			const r = rounded ? Math.min(RADIUS, w / 2, h) : 0;
			return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
		}
		const geometry = (0, vue_exports.computed)(() => {
			const innerW = Math.max(40, width.value - M.left - M.right);
			const innerH = Math.max(40, height.value - M.top - M.bottom);
			const weeks = props.chart.weeks;
			const max = Math.max(1, ...weeks.map((w) => w.total));
			const x = band().domain(weeks.map((w) => w.key)).range([0, innerW]).paddingInner(.4).paddingOuter(.2);
			const y = linear().domain([0, max]).range([innerH, 0]).nice(4);
			const barW = Math.min(MAX_BAR, x.bandwidth());
			return {
				innerW,
				innerH,
				barW,
				columns: weeks.map((week, index) => {
					const left = (x(week.key) ?? 0) + (x.bandwidth() - barW) / 2;
					const segments = [];
					let base = 0;
					const present = props.chart.series.filter((s) => (week.values[s.key] ?? 0) > 0);
					present.forEach((series, i) => {
						const value = week.values[series.key] ?? 0;
						const top = y(base + value);
						const bottom = y(base) - (i > 0 ? GAP : 0);
						const seriesIndex = props.chart.series.findIndex((s) => s.key === series.key);
						segments.push({
							key: series.key,
							d: column(left, top, barW, Math.max(0, bottom - top), i === present.length - 1),
							fill: colour(series.key, seriesIndex)
						});
						base += value;
					});
					return {
						key: week.key,
						index,
						left,
						center: left + barW / 2,
						segments,
						label: week.label
					};
				}),
				every: Math.max(1, Math.ceil(LABEL_ROOM / Math.max(1, x.step()))),
				ticks: y.ticks(4).map((value) => ({
					value,
					y: y(value),
					label: formatNumber(value)
				})),
				band: x.bandwidth()
			};
		});
		const VERDICT_COLOURS = {
			PERMITTED: "var(--chart-verdict-permitted)",
			CONDITIONAL: "var(--chart-verdict-conditional)",
			NOT_PERMITTED: "var(--chart-verdict-refused)",
			UNKNOWN: "var(--chart-verdict-unknown)"
		};
		function colour(key, index) {
			return VERDICT_COLOURS[key] ?? `var(--chart-cat-${index + 1})`;
		}
		const hovered = (0, vue_exports.computed)(() => {
			if (active.value === null) return null;
			const week = props.chart.weeks[active.value];
			const col = geometry.value.columns[active.value];
			if (!week || !col) return null;
			return {
				week,
				left: M.left + col.center
			};
		});
		const tip = (0, vue_exports.ref)(null);
		const tipWidth = (0, vue_exports.ref)(0);
		(0, vue_exports.watch)(hovered, () => void (0, vue_exports.nextTick)(() => tipWidth.value = tip.value?.offsetWidth ?? 0));
		const tipLeft = (0, vue_exports.computed)(() => {
			const at = hovered.value?.left ?? 0;
			const right = at + TIP_GAP;
			if (right + tipWidth.value <= width.value) return right;
			return Math.max(0, Math.min(at - TIP_GAP - tipWidth.value, width.value - tipWidth.value));
		});
		const byKeyboard = (0, vue_exports.ref)(false);
		const announcement = (0, vue_exports.computed)(() => {
			if (!hovered.value || !byKeyboard.value) return "";
			const { week } = hovered.value;
			return `${week.label}, ${week.range}: ` + props.chart.series.map((s) => `${s.label} ${week.values[s.key] ?? 0}`).join(", ");
		});
		(0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "sb" }, _attrs))} data-v-34df83df><ul class="sb__legend" data-v-34df83df><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.chart.series, (series, i) => {
				_push(`<li class="sb__key" data-v-34df83df><span class="sb__swatch" style="${(0, server_renderer_exports.ssrRenderStyle)({ background: colour(series.key, i) })}" aria-hidden="true" data-v-34df83df></span> ${(0, server_renderer_exports.ssrInterpolate)(series.label)}</li>`);
			});
			_push(`<!--]--></ul>`);
			if (__props.loading) _push(`<span class="skeleton sb__skeleton" aria-hidden="true" data-v-34df83df></span>`);
			else {
				_push(`<div class="sb__plot" data-v-34df83df><svg class="sb__svg"${(0, server_renderer_exports.ssrRenderAttr)("width", (0, vue_exports.unref)(width))}${(0, server_renderer_exports.ssrRenderAttr)("height", (0, vue_exports.unref)(height))}${(0, server_renderer_exports.ssrRenderAttr)("viewBox", `0 0 ${(0, vue_exports.unref)(width)} ${(0, vue_exports.unref)(height)}`)} preserveAspectRatio="xMinYMin meet" role="group"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${__props.label}. Mit den Pfeiltasten von Woche zu Woche.`)} tabindex="0" data-v-34df83df><g${(0, server_renderer_exports.ssrRenderAttr)("transform", `translate(${M.left},${M.top})`)} data-v-34df83df><g class="sb__grid" aria-hidden="true" data-v-34df83df><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(geometry.value.ticks, (tick) => {
					_push(`<!--[--><line${(0, server_renderer_exports.ssrRenderAttr)("x1", 0)}${(0, server_renderer_exports.ssrRenderAttr)("x2", geometry.value.innerW)}${(0, server_renderer_exports.ssrRenderAttr)("y1", tick.y)}${(0, server_renderer_exports.ssrRenderAttr)("y2", tick.y)} data-v-34df83df></line><text class="sb__tick"${(0, server_renderer_exports.ssrRenderAttr)("x", -10)}${(0, server_renderer_exports.ssrRenderAttr)("y", tick.y)} dy="0.32em" text-anchor="end" data-v-34df83df>${(0, server_renderer_exports.ssrInterpolate)(tick.label)}</text><!--]-->`);
				});
				_push(`<!--]--></g><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(geometry.value.columns, (col, i) => {
					_push(`<g class="${(0, server_renderer_exports.ssrRenderClass)([{
						"sb__column--grow": growIn.value,
						"sb__column--dim": hovered.value && active.value !== i
					}, "sb__column"])}" aria-hidden="true" data-v-34df83df><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(col.segments, (segment) => {
						_push(`<path${(0, server_renderer_exports.ssrRenderAttr)("d", segment.d)}${(0, server_renderer_exports.ssrRenderAttr)("fill", segment.fill)} data-v-34df83df></path>`);
					});
					_push(`<!--]-->`);
					if (i % geometry.value.every === 0) _push(`<text class="sb__tick"${(0, server_renderer_exports.ssrRenderAttr)("x", col.center)}${(0, server_renderer_exports.ssrRenderAttr)("y", geometry.value.innerH + 20)} text-anchor="middle" data-v-34df83df>${(0, server_renderer_exports.ssrInterpolate)(col.label)}</text>`);
					else _push(`<!---->`);
					_push(`</g>`);
				});
				_push(`<!--]--></g></svg>`);
				if (hovered.value) {
					_push(`<div class="sb__tip" style="${(0, server_renderer_exports.ssrRenderStyle)({ left: `${tipLeft.value}px` })}" aria-hidden="true" data-v-34df83df><span class="sb__tip-week" data-v-34df83df>${(0, server_renderer_exports.ssrInterpolate)(hovered.value.week.label)} · ${(0, server_renderer_exports.ssrInterpolate)(hovered.value.week.range)}</span><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.chart.series, (series, i) => {
						_push(`<span class="sb__tip-row" data-v-34df83df><span class="sb__swatch" style="${(0, server_renderer_exports.ssrRenderStyle)({ background: colour(series.key, i) })}" data-v-34df83df></span> ${(0, server_renderer_exports.ssrInterpolate)(series.label)} <strong data-v-34df83df>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatNumber)(hovered.value.week.values[series.key] ?? 0))}</strong></span>`);
					});
					_push(`<!--]--></div>`);
				} else _push(`<!---->`);
				_push(`<span class="visually-hidden" role="status" data-v-34df83df>${(0, server_renderer_exports.ssrInterpolate)(announcement.value)}</span></div>`);
			}
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Charts/StackedBar.vue
var _sfc_setup$9 = StackedBar_vue_vue_type_script_setup_true_lang_default.setup;
StackedBar_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Charts/StackedBar.vue");
	return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
var StackedBar_default = /*#__PURE__*/ _plugin_vue_export_helper_default(StackedBar_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-34df83df"]]);
//#endregion
//#region resources/js/Components/Admin/Dashboard/DemandGaps.vue?vue&type=script&setup=true&lang.ts
var DemandGaps_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "DemandGaps",
	__ssrInlineRender: true,
	props: { rows: {} },
	setup(__props) {
		/**
		* Nachfrage-Lücken on the Übersicht: the open gaps most in demand, ranked (Demand: recent asks and
		* waiting customers weigh more). Each row names the car, how often it was asked for in the Zeitraum —
		* with a bar that measures exactly that number against the largest, never the hidden ranking score
		* (M1-13) — and how many people are waiting; each opens its row on the full list.
		*/
		const props = __props;
		const most = (0, vue_exports.computed)(() => Math.max(1, ...props.rows.map((gap) => gap.asked)));
		/** `v:12` → `gap-v-12`: the full list's row for this gap. */
		function anchor(key) {
			return `gap-${key.replace(":", "-")}`;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<ol${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "dg" }, _attrs))} data-v-fc34546f><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.rows, (gap, i) => {
				_push(`<li class="dg__row" data-v-fc34546f><span class="dg__rank" aria-hidden="true" data-v-fc34546f>${(0, server_renderer_exports.ssrInterpolate)(i + 1)}</span><span class="dg__text" data-v-fc34546f>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: `/admin/nachfrage#${anchor(gap.key)}`,
					class: "dg__link"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(gap.title)}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(gap.title), 1)];
					}),
					_: 2
				}, _parent));
				_push(`<span class="dg__detail" data-v-fc34546f>${(0, server_renderer_exports.ssrInterpolate)(gap.detail)}</span></span><span class="dg__figures" data-v-fc34546f><span class="dg__asked" data-v-fc34546f>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(gap.asked, 0))}×<span class="visually-hidden" data-v-fc34546f> gefragt</span></span><span class="dg__bar" aria-hidden="true" data-v-fc34546f><span style="${(0, server_renderer_exports.ssrRenderStyle)({ width: `${gap.asked / most.value * 100}%` })}" data-v-fc34546f></span></span>`);
				if (gap.waiting) _push(`<span class="dg__waiting" data-v-fc34546f>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(gap.waiting, 0))} ${(0, server_renderer_exports.ssrInterpolate)(gap.waiting === 1 ? "wartet" : "warten")}</span>`);
				else _push(`<!---->`);
				_push(`</span></li>`);
			});
			_push(`<!--]--></ol>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Dashboard/DemandGaps.vue
var _sfc_setup$8 = DemandGaps_vue_vue_type_script_setup_true_lang_default.setup;
DemandGaps_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Dashboard/DemandGaps.vue");
	return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
var DemandGaps_default = /*#__PURE__*/ _plugin_vue_export_helper_default(DemandGaps_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-fc34546f"]]);
//#endregion
//#region resources/js/Components/Admin/Dashboard/CoverageRow.vue?vue&type=script&setup=true&lang.ts
var DEMAND_HEIGHT = "calc(28px + 5 * var(--dg-row-h))";
var FAILED$1 = "Diese Auswertung konnte nicht geladen werden. Die übrigen Zahlen der Übersicht sind davon nicht betroffen.";
var CoverageRow_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CoverageRow",
	__ssrInlineRender: true,
	props: {
		charts: {},
		keys: {},
		rows: {},
		failed: { type: Boolean },
		periodQuery: {},
		coverageStyle: {},
		demandStyle: {}
	},
	emits: ["retry"],
	setup(__props, { emit: __emit }) {
		/**
		* The Übersicht's coverage pair: the Abdeckungs-Matrix and the Nachfrage-Lücken — what the shop may
		* show, and what customers asked for that it may not show yet. Two cells of the page's grid, each
		* placed by the page (`coverageStyle`, `demandStyle`: its spans); its own component because the
		* Gutachten role sees it straight under the figures, the others further down.
		*
		* Both arrive with the page's deferred charts. Until then each stands in its own final size — the
		* matrix as a skeleton of as many makes as it will show (`rows`, counted with the page), the list as
		* five rows under its lead line — so nothing on the page moves when they land. If they cannot load,
		* each says so and offers „Erneut versuchen“.
		*/
		const props = __props;
		const emit = __emit;
		/**
		* A lead line and five rows: the list's box, loaded or not. A row is two lines — the car, its key numbers — and on a
		* phone three, where a car's name may wrap (UEB-02, 14.10.2026: „Mercedes-Benz C-Klasse C 43 AMG“ grew the loaded list
		* past its skeleton). The row's height is one variable, set below for the widget and read by DemandGaps' rows.
		*/
		function failedOne(key) {
			return props.failed || props.charts?.failed.includes(key) ? FAILED$1 : null;
		}
		/** The matrix as it will be drawn, without its words: as many makes, five sizes. */
		const skeleton = (0, vue_exports.computed)(() => {
			const sizes = Array.from({ length: 5 }, (_, i) => ({
				key: `s${i}`,
				label: ""
			}));
			return {
				sizes,
				rows: Array.from({ length: Math.max(1, props.rows) }, (_, i) => ({
					make: `m${i}`,
					variants: 0,
					covered: 0,
					cells: sizes.map((size) => ({
						size: size.key,
						count: 0,
						level: 0,
						sentence: "",
						href: null
					}))
				})),
				max: 0,
				summary: {
					fitments: "",
					variants: "",
					sentence: ""
				},
				computedAt: ""
			};
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			if (__props.keys.includes("coverage")) {
				_push(`<!--[-->`);
				if (!__props.charts || !__props.charts.coverage) _push((0, server_renderer_exports.ssrRenderComponent)(DashWidget_default, {
					class: "dash__cell",
					style: __props.coverageStyle,
					title: "Abdeckung",
					loading: !__props.charts && !__props.failed,
					error: failedOne("coverage"),
					onRetry: ($event) => emit("retry")
				}, {
					skeleton: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(CoverageMatrix_default, {
							matrix: skeleton.value,
							placeholder: ""
						}, null, _parent, _scopeId));
						else return [(0, vue_exports.createVNode)(CoverageMatrix_default, {
							matrix: skeleton.value,
							placeholder: ""
						}, null, 8, ["matrix"])];
					}),
					_: 1
				}, _parent));
				else _push((0, server_renderer_exports.ssrRenderComponent)(DashWidget_default, {
					class: "dash__cell",
					style: __props.coverageStyle,
					title: "Abdeckung",
					href: "/admin/abdeckung",
					"href-label": "Abdeckung öffnen",
					empty: __props.charts.coverage.rows.length ? null : "Noch kein Fahrzeug im Katalog. Die Matrix füllt sich, sobald Fahrzeuge in einem Gutachten eingetragen sind oder der Fahrzeugdatensatz eingespielt ist.",
					"empty-link": __props.charts.coverage.rows.length ? null : {
						label: "Zu den Gutachten",
						href: "/admin/gutachten"
					}
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(CoverageMatrix_default, { matrix: __props.charts.coverage }, null, _parent, _scopeId));
						else return [(0, vue_exports.createVNode)(CoverageMatrix_default, { matrix: __props.charts.coverage }, null, 8, ["matrix"])];
					}),
					_: 1
				}, _parent));
				_push(`<!--]-->`);
			} else _push(`<!---->`);
			if (__props.keys.includes("demand")) {
				_push(`<!--[-->`);
				if (!__props.charts || !__props.charts.demand) _push((0, server_renderer_exports.ssrRenderComponent)(DashWidget_default, {
					class: "dash__cell demand-widget",
					style: __props.demandStyle,
					title: "Nachfrage-Lücken",
					"body-height": DEMAND_HEIGHT,
					loading: !__props.charts && !__props.failed,
					error: failedOne("demand"),
					onRetry: ($event) => emit("retry")
				}, null, _parent));
				else _push((0, server_renderer_exports.ssrRenderComponent)(DashWidget_default, {
					class: "dash__cell demand-widget",
					style: __props.demandStyle,
					title: "Nachfrage-Lücken",
					href: `/admin/nachfrage${__props.periodQuery}`,
					"href-label": "Alle offenen Lücken",
					"body-height": DEMAND_HEIGHT,
					empty: __props.charts.demand.rows.length ? null : "Im Zeitraum hat niemand nach einem Auto gefragt, für das der Shop keine Felge zeigen kann."
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push(`<p class="demand-lead" data-v-ae8e9329${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatNumber)(__props.charts.demand.counts.offen))} ${(0, server_renderer_exports.ssrInterpolate)(__props.charts.demand.counts.offen === 1 ? "offene Lücke" : "offene Lücken")}, ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatNumber)(__props.charts.demand.asks))}-mal gefragt`);
							if (__props.charts.demand.waiting) _push(`<!--[-->, ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatNumber)(__props.charts.demand.waiting))} ${(0, server_renderer_exports.ssrInterpolate)(__props.charts.demand.waiting === 1 ? "Person wartet" : "Personen warten")}<!--]-->`);
							else _push(`<!---->`);
							_push(`. </p>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(DemandGaps_default, { rows: __props.charts.demand.rows }, null, _parent, _scopeId));
						} else return [(0, vue_exports.createVNode)("p", { class: "demand-lead" }, [
							(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatNumber)(__props.charts.demand.counts.offen)) + " " + (0, vue_exports.toDisplayString)(__props.charts.demand.counts.offen === 1 ? "offene Lücke" : "offene Lücken") + ", " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatNumber)(__props.charts.demand.asks)) + "-mal gefragt", 1),
							__props.charts.demand.waiting ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(", " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatNumber)(__props.charts.demand.waiting)) + " " + (0, vue_exports.toDisplayString)(__props.charts.demand.waiting === 1 ? "Person wartet" : "Personen warten"), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createTextVNode)(". ")
						]), (0, vue_exports.createVNode)(DemandGaps_default, { rows: __props.charts.demand.rows }, null, 8, ["rows"])];
					}),
					_: 1
				}, _parent));
				_push(`<!--]-->`);
			} else _push(`<!---->`);
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Dashboard/CoverageRow.vue
var _sfc_setup$7 = CoverageRow_vue_vue_type_script_setup_true_lang_default.setup;
CoverageRow_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Dashboard/CoverageRow.vue");
	return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
var CoverageRow_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CoverageRow_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-ae8e9329"]]);
//#endregion
//#region resources/js/Components/Admin/Charts/Sparkline.vue?vue&type=script&setup=true&lang.ts
var WIDTH = 200;
var PAD = 3;
var Sparkline_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Sparkline",
	__ssrInlineRender: true,
	props: {
		values: {},
		height: { default: 40 }
	},
	setup(__props) {
		/**
		* A figure's curve, 40 px high, the full width of its tile (BRIEF §5: our own SVG, `d3-scale` and
		* `d3-shape` for the maths only).
		*
		* The line is 2 px with round caps in the accent, its baseline zero — a revenue curve that starts
		* mid-air would exaggerate every wobble. A day without a value (an average on a day without orders)
		* is a gap in the line, not a dip to zero. The last point carries an 8 px marker ringed in the
		* surface colour; it is placed in HTML, so it stays round however the tile stretches the drawing.
		*
		* Decoration beside the figure it belongs to: the tile says the value and the change in words, so
		* the drawing is hidden from a screen reader rather than read as "image".
		*/
		const props = __props;
		/** The drawing's own width; the SVG stretches it to the tile, the stroke keeps its 2 px. */
		const geometry = (0, vue_exports.computed)(() => {
			const values = props.values;
			const known = values.filter((v) => v !== null);
			if (values.length < 2 || known.length === 0) return null;
			const x = linear().domain([0, values.length - 1]).range([PAD, 197]);
			const max = Math.max(...known);
			const y = linear().domain([0, max > 0 ? max : 1]).range([props.height - PAD, PAD]);
			const path = line_default().defined((v) => v !== null).x((_, i) => x(i)).y((v) => y(v ?? 0)).curve(monotoneX)(values);
			let last = values.length - 1;
			while (last >= 0 && values[last] === null) last--;
			return {
				path: path ?? "",
				marker: last < 0 ? null : {
					left: x(last) / WIDTH * 100,
					top: y(values[last]) / props.height * 100
				}
			};
		});
		return (_ctx, _push, _parent, _attrs) => {
			if (geometry.value) {
				_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
					class: "spark",
					style: { height: `${__props.height}px` },
					"aria-hidden": "true"
				}, _attrs))} data-v-f903db90><svg class="spark__svg"${(0, server_renderer_exports.ssrRenderAttr)("viewBox", `0 0 ${WIDTH} ${__props.height}`)} preserveAspectRatio="none" focusable="false" data-v-f903db90><path class="spark__line"${(0, server_renderer_exports.ssrRenderAttr)("d", geometry.value.path)} data-v-f903db90></path></svg>`);
				if (geometry.value.marker) _push(`<span class="spark__marker" style="${(0, server_renderer_exports.ssrRenderStyle)({
					left: `${geometry.value.marker.left}%`,
					top: `${geometry.value.marker.top}%`
				})}" data-v-f903db90></span>`);
				else _push(`<!---->`);
				_push(`</div>`);
			} else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Charts/Sparkline.vue
var _sfc_setup$6 = Sparkline_vue_vue_type_script_setup_true_lang_default.setup;
Sparkline_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Charts/Sparkline.vue");
	return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
var Sparkline_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Sparkline_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f903db90"]]);
//#endregion
//#region resources/js/Components/Admin/Dashboard/KpiTile.vue?vue&type=script&setup=true&lang.ts
var TAIL = " zum Vorzeitraum";
var KpiTile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "KpiTile",
	__ssrInlineRender: true,
	props: { kpi: {} },
	setup(__props) {
		/**
		* One figure on the Übersicht: its label, the figure and its unit in tabular figures (money through
		* num.ts's formatMoney, from minor units: `59.748,00 €`), exactly one line under it, and a 40 px curve
		* of the same measure — and the whole tile is the link to the list that shows what it counts.
		*
		* Zero is a figure: `0,00 €`, `0`. A dash stands only where no figure can be computed (an average of no
		* orders), and the line under it says why. The line is the change against the previous period — an
		* arrow and a sign in ink, never a colour alone — or one fact about the figure.
		*
		* What the figure counts is one sentence: it appears beside the label on hover, and when the tile
		* takes the keyboard's focus, and a screen reader hears it with the link (aria-describedby).
		*/
		const props = __props;
		/**
		* The figure and its unit, written by num.ts — money from minor units with its cents, `59.748,00 €`
		* — and parted only at the no-break space, so the unit can be set smaller without being retyped.
		*/
		const parts = (0, vue_exports.computed)(() => {
			const value = props.kpi.value;
			if (value === null) return null;
			if (props.kpi.unit !== "EUR") return {
				figure: formatNumber(value),
				unit: null
			};
			const [figure = "", unit = ""] = formatMoney(value).split(" ");
			return {
				figure,
				unit: ` ${unit}`
			};
		});
		const hintId = (0, vue_exports.useId)();
		const hovered = (0, vue_exports.ref)(false);
		const hoveringHint = (0, vue_exports.ref)(false);
		const focused = (0, vue_exports.ref)(false);
		const dismissed = (0, vue_exports.ref)(false);
		const hintOpen = (0, vue_exports.computed)(() => (hovered.value || hoveringHint.value || focused.value) && !dismissed.value);
		function onPointer(event, over) {
			if (event.pointerType !== "mouse") return;
			hovered.value = over;
			if (!over && !focused.value) dismissed.value = false;
		}
		function onFocus(on) {
			focused.value = on;
			if (!on) dismissed.value = false;
		}
		const arrow = (0, vue_exports.computed)(() => props.kpi.sub.kind === "delta" && props.kpi.sub.direction !== "flat" ? props.kpi.sub.direction === "up" ? "arrow-up" : "arrow-down" : null);
		/**
		* A change's words after its figure (SalesFigures: „+15,0 % zum Vorzeitraum“). On a tile too narrow
		* for the whole line the words are heard, not shown — the switch above already says what is compared,
		* and the line stays one line (M1-07).
		*/
		const subParts = (0, vue_exports.computed)(() => {
			const text = props.kpi.sub.text;
			return props.kpi.sub.kind === "delta" && text.endsWith(TAIL) ? {
				lead: text.slice(0, -16),
				tail: TAIL
			} : {
				lead: text,
				tail: ""
			};
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipProvider_default), (0, vue_exports.mergeProps)({ "delay-duration": 200 }, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) (0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)(__props.kpi.href ? (0, vue_exports.unref)(link_default) : "div"), {
						href: __props.kpi.href ?? void 0,
						class: ["kpi", {
							"kpi--link": __props.kpi.href,
							"kpi--empty": __props.kpi.value === null
						}],
						"aria-describedby": (0, vue_exports.unref)(hintId),
						onFocus: ($event) => onFocus(true),
						onBlur: ($event) => onFocus(false),
						onKeydown: ($event) => dismissed.value = true
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push(`<span class="kpi__head" data-v-ad3a35a5${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipRoot_default), { open: hintOpen.value }, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipTrigger_default), { "as-child": "" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) {
														_push(`<span class="kpi__label" data-v-ad3a35a5${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.kpi.label)} `);
														_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
															class: "kpi__info",
															name: "info",
															size: 16
														}, null, _parent, _scopeId));
														_push(`</span>`);
													} else return [(0, vue_exports.createVNode)("span", {
														class: "kpi__label",
														onPointerenter: ($event) => onPointer($event, true),
														onPointerleave: ($event) => onPointer($event, false)
													}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.kpi.label) + " ", 1), (0, vue_exports.createVNode)(AdminIcon_default, {
														class: "kpi__info",
														name: "info",
														size: 16
													})], 40, ["onPointerenter", "onPointerleave"])];
												}),
												_: 1
											}, _parent, _scopeId));
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipPortal_default), null, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipContent_default), {
														class: "adm-tooltip kpi__tooltip",
														side: "top",
														align: "start",
														"side-offset": 6,
														onPointerenter: ($event) => hoveringHint.value = true,
														onPointerleave: ($event) => hoveringHint.value = false,
														onEscapeKeyDown: ($event) => dismissed.value = true
													}, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(__props.kpi.hint)}`);
															else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.kpi.hint), 1)];
														}),
														_: 1
													}, _parent, _scopeId));
													else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipContent_default), {
														class: "adm-tooltip kpi__tooltip",
														side: "top",
														align: "start",
														"side-offset": 6,
														onPointerenter: ($event) => hoveringHint.value = true,
														onPointerleave: ($event) => hoveringHint.value = false,
														onEscapeKeyDown: ($event) => dismissed.value = true
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.kpi.hint), 1)]),
														_: 1
													}, 8, [
														"onPointerenter",
														"onPointerleave",
														"onEscapeKeyDown"
													])];
												}),
												_: 1
											}, _parent, _scopeId));
										} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipTrigger_default), { "as-child": "" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", {
												class: "kpi__label",
												onPointerenter: ($event) => onPointer($event, true),
												onPointerleave: ($event) => onPointer($event, false)
											}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.kpi.label) + " ", 1), (0, vue_exports.createVNode)(AdminIcon_default, {
												class: "kpi__info",
												name: "info",
												size: 16
											})], 40, ["onPointerenter", "onPointerleave"])]),
											_: 1
										}), (0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipPortal_default), null, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipContent_default), {
												class: "adm-tooltip kpi__tooltip",
												side: "top",
												align: "start",
												"side-offset": 6,
												onPointerenter: ($event) => hoveringHint.value = true,
												onPointerleave: ($event) => hoveringHint.value = false,
												onEscapeKeyDown: ($event) => dismissed.value = true
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.kpi.hint), 1)]),
												_: 1
											}, 8, [
												"onPointerenter",
												"onPointerleave",
												"onEscapeKeyDown"
											])]),
											_: 1
										})];
									}),
									_: 1
								}, _parent, _scopeId));
								if (__props.kpi.href) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
									class: "kpi__go",
									name: "arrow-right",
									size: 16
								}, null, _parent, _scopeId));
								else _push(`<!---->`);
								_push(`</span><span${(0, server_renderer_exports.ssrRenderAttr)("id", (0, vue_exports.unref)(hintId))} class="visually-hidden" aria-hidden="true" data-v-ad3a35a5${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.kpi.hint)}</span>`);
								if (parts.value) {
									_push(`<span class="kpi__value" data-v-ad3a35a5${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(parts.value.figure)}`);
									if (parts.value.unit) _push(`<span class="kpi__unit" data-v-ad3a35a5${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(parts.value.unit)}</span>`);
									else _push(`<!---->`);
									_push(`</span>`);
								} else _push(`<span class="kpi__value kpi__value--none" data-v-ad3a35a5${_scopeId}><span aria-hidden="true" data-v-ad3a35a5${_scopeId}>—</span><span class="visually-hidden" data-v-ad3a35a5${_scopeId}>keine Zahl</span></span>`);
								_push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([[`kpi__sub--${__props.kpi.sub.kind}`, __props.kpi.sub.direction ? `kpi__sub--${__props.kpi.sub.direction}` : null], "kpi__sub"])}" data-v-ad3a35a5${_scopeId}>`);
								if (arrow.value) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
									name: arrow.value,
									size: 16
								}, null, _parent, _scopeId));
								else _push(`<!---->`);
								_push(`<span data-v-ad3a35a5${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(subParts.value.lead)}`);
								if (subParts.value.tail) _push(`<span class="kpi__sub-tail" data-v-ad3a35a5${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(subParts.value.tail)}</span>`);
								else _push(`<!---->`);
								_push(`</span></span>`);
								if (__props.kpi.series.length > 1) _push((0, server_renderer_exports.ssrRenderComponent)(Sparkline_default, {
									class: "kpi__spark",
									values: __props.kpi.series
								}, null, _parent, _scopeId));
								else _push(`<!---->`);
							} else return [
								(0, vue_exports.createVNode)("span", { class: "kpi__head" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipRoot_default), { open: hintOpen.value }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipTrigger_default), { "as-child": "" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", {
											class: "kpi__label",
											onPointerenter: ($event) => onPointer($event, true),
											onPointerleave: ($event) => onPointer($event, false)
										}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.kpi.label) + " ", 1), (0, vue_exports.createVNode)(AdminIcon_default, {
											class: "kpi__info",
											name: "info",
											size: 16
										})], 40, ["onPointerenter", "onPointerleave"])]),
										_: 1
									}), (0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipPortal_default), null, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipContent_default), {
											class: "adm-tooltip kpi__tooltip",
											side: "top",
											align: "start",
											"side-offset": 6,
											onPointerenter: ($event) => hoveringHint.value = true,
											onPointerleave: ($event) => hoveringHint.value = false,
											onEscapeKeyDown: ($event) => dismissed.value = true
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.kpi.hint), 1)]),
											_: 1
										}, 8, [
											"onPointerenter",
											"onPointerleave",
											"onEscapeKeyDown"
										])]),
										_: 1
									})]),
									_: 1
								}, 8, ["open"]), __props.kpi.href ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
									key: 0,
									class: "kpi__go",
									name: "arrow-right",
									size: 16
								})) : (0, vue_exports.createCommentVNode)("", true)]),
								(0, vue_exports.createVNode)("span", {
									id: (0, vue_exports.unref)(hintId),
									class: "visually-hidden",
									"aria-hidden": "true"
								}, (0, vue_exports.toDisplayString)(__props.kpi.hint), 9, ["id"]),
								parts.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: "kpi__value"
								}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(parts.value.figure), 1), parts.value.unit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: "kpi__unit"
								}, (0, vue_exports.toDisplayString)(parts.value.unit), 1)) : (0, vue_exports.createCommentVNode)("", true)])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 1,
									class: "kpi__value kpi__value--none"
								}, [(0, vue_exports.createVNode)("span", { "aria-hidden": "true" }, "—"), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, "keine Zahl")])),
								(0, vue_exports.createVNode)("span", { class: ["kpi__sub", [`kpi__sub--${__props.kpi.sub.kind}`, __props.kpi.sub.direction ? `kpi__sub--${__props.kpi.sub.direction}` : null]] }, [arrow.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
									key: 0,
									name: arrow.value,
									size: 16
								}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)("span", null, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(subParts.value.lead), 1), subParts.value.tail ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: "kpi__sub-tail"
								}, (0, vue_exports.toDisplayString)(subParts.value.tail), 1)) : (0, vue_exports.createCommentVNode)("", true)])], 2),
								__props.kpi.series.length > 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(Sparkline_default, {
									key: 2,
									class: "kpi__spark",
									values: __props.kpi.series
								}, null, 8, ["values"])) : (0, vue_exports.createCommentVNode)("", true)
							];
						}),
						_: 1
					}), _parent, _scopeId);
					else return [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.resolveDynamicComponent)(__props.kpi.href ? (0, vue_exports.unref)(link_default) : "div"), {
						href: __props.kpi.href ?? void 0,
						class: ["kpi", {
							"kpi--link": __props.kpi.href,
							"kpi--empty": __props.kpi.value === null
						}],
						"aria-describedby": (0, vue_exports.unref)(hintId),
						onFocus: ($event) => onFocus(true),
						onBlur: ($event) => onFocus(false),
						onKeydown: (0, vue_exports.withKeys)(($event) => dismissed.value = true, ["esc"])
					}, {
						default: (0, vue_exports.withCtx)(() => [
							(0, vue_exports.createVNode)("span", { class: "kpi__head" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipRoot_default), { open: hintOpen.value }, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipTrigger_default), { "as-child": "" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", {
										class: "kpi__label",
										onPointerenter: ($event) => onPointer($event, true),
										onPointerleave: ($event) => onPointer($event, false)
									}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.kpi.label) + " ", 1), (0, vue_exports.createVNode)(AdminIcon_default, {
										class: "kpi__info",
										name: "info",
										size: 16
									})], 40, ["onPointerenter", "onPointerleave"])]),
									_: 1
								}), (0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipPortal_default), null, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipContent_default), {
										class: "adm-tooltip kpi__tooltip",
										side: "top",
										align: "start",
										"side-offset": 6,
										onPointerenter: ($event) => hoveringHint.value = true,
										onPointerleave: ($event) => hoveringHint.value = false,
										onEscapeKeyDown: ($event) => dismissed.value = true
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.kpi.hint), 1)]),
										_: 1
									}, 8, [
										"onPointerenter",
										"onPointerleave",
										"onEscapeKeyDown"
									])]),
									_: 1
								})]),
								_: 1
							}, 8, ["open"]), __props.kpi.href ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
								key: 0,
								class: "kpi__go",
								name: "arrow-right",
								size: 16
							})) : (0, vue_exports.createCommentVNode)("", true)]),
							(0, vue_exports.createVNode)("span", {
								id: (0, vue_exports.unref)(hintId),
								class: "visually-hidden",
								"aria-hidden": "true"
							}, (0, vue_exports.toDisplayString)(__props.kpi.hint), 9, ["id"]),
							parts.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 0,
								class: "kpi__value"
							}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(parts.value.figure), 1), parts.value.unit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 0,
								class: "kpi__unit"
							}, (0, vue_exports.toDisplayString)(parts.value.unit), 1)) : (0, vue_exports.createCommentVNode)("", true)])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 1,
								class: "kpi__value kpi__value--none"
							}, [(0, vue_exports.createVNode)("span", { "aria-hidden": "true" }, "—"), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, "keine Zahl")])),
							(0, vue_exports.createVNode)("span", { class: ["kpi__sub", [`kpi__sub--${__props.kpi.sub.kind}`, __props.kpi.sub.direction ? `kpi__sub--${__props.kpi.sub.direction}` : null]] }, [arrow.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
								key: 0,
								name: arrow.value,
								size: 16
							}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)("span", null, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(subParts.value.lead), 1), subParts.value.tail ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 0,
								class: "kpi__sub-tail"
							}, (0, vue_exports.toDisplayString)(subParts.value.tail), 1)) : (0, vue_exports.createCommentVNode)("", true)])], 2),
							__props.kpi.series.length > 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(Sparkline_default, {
								key: 2,
								class: "kpi__spark",
								values: __props.kpi.series
							}, null, 8, ["values"])) : (0, vue_exports.createCommentVNode)("", true)
						]),
						_: 1
					}, 40, [
						"href",
						"class",
						"aria-describedby",
						"onFocus",
						"onBlur",
						"onKeydown"
					]))];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Dashboard/KpiTile.vue
var _sfc_setup$5 = KpiTile_vue_vue_type_script_setup_true_lang_default.setup;
KpiTile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Dashboard/KpiTile.vue");
	return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
var KpiTile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(KpiTile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-ad3a35a5"]]);
//#endregion
//#region resources/js/Components/Admin/Dashboard/QualityList.vue?vue&type=script&setup=true&lang.ts
var QualityList_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "QualityList",
	__ssrInlineRender: true,
	props: { rows: {} },
	setup(__props) {
		/**
		* „Datenqualität“ for the Katalog role: the Felgen in the shop with something missing — price, photo,
		* weight or the load rating the fitment check needs — the most incomplete first, each gap named.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<ul${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "ql" }, _attrs))} data-v-7e8d21e6><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.rows, (row) => {
				_push(`<li class="ql__row" data-v-7e8d21e6><span class="ql__text" data-v-7e8d21e6><span class="ql__title" data-v-7e8d21e6>${(0, server_renderer_exports.ssrInterpolate)(row.title)}</span><span class="ql__detail" data-v-7e8d21e6>${(0, server_renderer_exports.ssrInterpolate)(row.detail)}</span></span><span class="ql__missing" data-v-7e8d21e6><span class="visually-hidden" data-v-7e8d21e6>Es fehlt: </span><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(row.missing, (item) => {
					_push(`<span class="adm-tag adm-tag--warn" data-v-7e8d21e6>${(0, server_renderer_exports.ssrInterpolate)(item)}</span>`);
				});
				_push(`<!--]--></span></li>`);
			});
			_push(`<!--]--></ul>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Dashboard/QualityList.vue
var _sfc_setup$4 = QualityList_vue_vue_type_script_setup_true_lang_default.setup;
QualityList_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Dashboard/QualityList.vue");
	return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
var QualityList_default = /*#__PURE__*/ _plugin_vue_export_helper_default(QualityList_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-7e8d21e6"]]);
//#endregion
//#region resources/js/Components/Admin/Dashboard/RecentOrders.vue?vue&type=script&setup=true&lang.ts
var RecentOrders_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "RecentOrders",
	__ssrInlineRender: true,
	props: { orders: {} },
	setup(__props) {
		/**
		* „Neueste Bestellungen“ — seeded orders are said once above the figures, not on every row. Eight
		* rows; only the number is a link — the row itself is not clickable. Its actions („Öffnen“, „Alle
		* Bestellungen dieser Person“) appear while the row is pointed at or holds the keyboard's focus,
		* and are always there on a touch screen. 13 px, 44 px rows, hairlines, no zebra; the amount right-
		* aligned in tabular figures; payment and shipping as chips in the status palette; nothing to ship
		* said quietly in words; the age as a colleague would say it.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "dt-wrap" }, _attrs))} data-v-62f2a5ba><table class="dt" data-v-62f2a5ba><thead data-v-62f2a5ba><tr data-v-62f2a5ba><th scope="col" data-v-62f2a5ba>Nummer</th><th scope="col" data-v-62f2a5ba>Kunde</th><th scope="col" class="dt__num" data-v-62f2a5ba>Betrag</th><th scope="col" data-v-62f2a5ba>Zahlung</th><th scope="col" data-v-62f2a5ba>Versand</th><th scope="col" class="dt__num" data-v-62f2a5ba>Alter</th><th scope="col" class="dt__actions-head" data-v-62f2a5ba><span class="visually-hidden" data-v-62f2a5ba>Aktionen</span></th></tr></thead><tbody data-v-62f2a5ba><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.orders, (order) => {
				_push(`<tr class="dt__row" data-v-62f2a5ba><td data-v-62f2a5ba>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: order.href,
					class: "dt__link"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(order.number)}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(order.number), 1)];
					}),
					_: 2
				}, _parent));
				_push(`</td><td class="dt__text" data-v-62f2a5ba><span class="dt__clip" data-v-62f2a5ba>${(0, server_renderer_exports.ssrInterpolate)(order.customer)}</span></td><td class="dt__num" data-v-62f2a5ba>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(order.total))}</td><td data-v-62f2a5ba>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(StateChip_default, {
					label: order.payment.label,
					tone: order.payment.tone
				}, null, _parent));
				_push(`</td><td data-v-62f2a5ba>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(StateChip_default, {
					label: order.fulfilment.label,
					tone: order.fulfilment.tone
				}, null, _parent));
				_push(`</td><td class="dt__num dt__age" data-v-62f2a5ba><time${(0, server_renderer_exports.ssrRenderAttr)("datetime", order.iso ?? void 0)} data-v-62f2a5ba>${(0, server_renderer_exports.ssrInterpolate)(order.ago ?? "–")}</time></td><td class="dt__actions" data-v-62f2a5ba>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: order.href,
					class: "adm-iconbtn dt__action",
					tabindex: "-1",
					"aria-label": `Bestellung ${order.number} öffnen`
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: "arrow-right",
							size: 16
						}, null, _parent, _scopeId));
						else return [(0, vue_exports.createVNode)(AdminIcon_default, {
							name: "arrow-right",
							size: 16
						})];
					}),
					_: 2
				}, _parent));
				if (order.customerHref) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: order.customerHref,
					class: "adm-iconbtn dt__action",
					"aria-label": `Alle Bestellungen von ${order.customer}`
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: "customers",
							size: 16
						}, null, _parent, _scopeId));
						else return [(0, vue_exports.createVNode)(AdminIcon_default, {
							name: "customers",
							size: 16
						})];
					}),
					_: 2
				}, _parent));
				else _push(`<!---->`);
				_push(`</td></tr>`);
			});
			_push(`<!--]--></tbody></table></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Dashboard/RecentOrders.vue
var _sfc_setup$3 = RecentOrders_vue_vue_type_script_setup_true_lang_default.setup;
RecentOrders_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Dashboard/RecentOrders.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var RecentOrders_default = /*#__PURE__*/ _plugin_vue_export_helper_default(RecentOrders_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-62f2a5ba"]]);
//#endregion
//#region resources/js/Components/Admin/Dashboard/TodayCard.vue?vue&type=script&setup=true&lang.ts
var TodayCard_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "TodayCard",
	__ssrInlineRender: true,
	props: { items: {} },
	setup(__props) {
		/**
		* „Heute“: at most three sentences telling this role what to do now, each with the button that
		* starts it. The Übersicht's grid places it: beside the Umsatz curve from 1280 px, beside Verdikte
		* from 900 px, and after the Umsatz card in the one column below that — in the page's order, so the
		* keyboard reads it where the eye does (M1-04).
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(DashWidget_default, (0, vue_exports.mergeProps)({
				title: "Heute",
				empty: __props.items.length ? null : "Heute ist nichts offen. Neues erscheint hier, sobald es dich betrifft."
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<ul class="today" data-v-c2cae51a${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.items, (item) => {
							_push(`<li class="today__row" data-v-c2cae51a${_scopeId}><p class="today__sentence" data-v-c2cae51a${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.sentence)}</p>`);
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
								href: item.href,
								class: "btn btn--secondary btn--sm"
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(item.action)}`);
									else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.action), 1)];
								}),
								_: 2
							}, _parent, _scopeId));
							_push(`</li>`);
						});
						_push(`<!--]--></ul>`);
					} else return [(0, vue_exports.createVNode)("ul", { class: "today" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.items, (item) => {
						return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
							key: item.key,
							class: "today__row"
						}, [(0, vue_exports.createVNode)("p", { class: "today__sentence" }, (0, vue_exports.toDisplayString)(item.sentence), 1), (0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
							href: item.href,
							class: "btn btn--secondary btn--sm"
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.action), 1)]),
							_: 2
						}, 1032, ["href"])]);
					}), 128))])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Dashboard/TodayCard.vue
var _sfc_setup$2 = TodayCard_vue_vue_type_script_setup_true_lang_default.setup;
TodayCard_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Dashboard/TodayCard.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var TodayCard_default = /*#__PURE__*/ _plugin_vue_export_helper_default(TodayCard_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-c2cae51a"]]);
//#endregion
//#region resources/js/Components/Admin/Dashboard/TodoList.vue?vue&type=script&setup=true&lang.ts
var TodoList_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "TodoList",
	__ssrInlineRender: true,
	props: { items: {} },
	setup(__props) {
		/**
		* „Zu erledigen“: one list of everything waiting on this role — orders to send, Gutachten to check,
		* customers waiting on a document, failed jobs — the oldest first, each row the link to where it is
		* done. Its kind is a tag only while the list holds more than one kind: a column that says the same
		* word on every row says nothing.
		*/
		const props = __props;
		const mixed = (0, vue_exports.computed)(() => new Set(props.items.map((item) => item.type)).size > 1);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<ul${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["todo", { "todo--one-kind": !mixed.value }] }, _attrs))} data-v-d39dccdf><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.items, (item) => {
				_push(`<li class="todo__row" data-v-d39dccdf>`);
				if (mixed.value) _push(`<span class="todo__type adm-tag adm-tag--neutral" data-v-d39dccdf>${(0, server_renderer_exports.ssrInterpolate)(item.type)}</span>`);
				else _push(`<!---->`);
				_push(`<span class="todo__text" data-v-d39dccdf>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: item.href,
					class: "todo__link"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(item.title)}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.title), 1)];
					}),
					_: 2
				}, _parent));
				if (item.detail) _push(`<span class="todo__detail" data-v-d39dccdf>${(0, server_renderer_exports.ssrInterpolate)(item.detail)}</span>`);
				else _push(`<!---->`);
				_push(`</span><time class="todo__age"${(0, server_renderer_exports.ssrRenderAttr)("datetime", item.iso ?? void 0)} data-v-d39dccdf>${(0, server_renderer_exports.ssrInterpolate)(item.ago ?? "")}</time>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					class: "todo__go",
					name: "chevron-right",
					size: 16
				}, null, _parent));
				_push(`</li>`);
			});
			_push(`<!--]--></ul>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Dashboard/TodoList.vue
var _sfc_setup$1 = TodoList_vue_vue_type_script_setup_true_lang_default.setup;
TodoList_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Dashboard/TodoList.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var TodoList_default = /*#__PURE__*/ _plugin_vue_export_helper_default(TodoList_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-d39dccdf"]]);
//#endregion
//#region resources/js/Pages/Admin/Uebersicht/layout.ts
var WIDE = {
	revenue: 8,
	today: 4,
	verdicts: 5,
	topWheels: 4,
	health: 3,
	coverage: 7,
	demand: 5,
	orders: 12,
	quality: 12,
	todo: 8,
	activity: 4
};
var MID = {
	revenue: 12,
	today: 6,
	verdicts: 6,
	topWheels: 6,
	health: 6,
	coverage: 12,
	demand: 12,
	orders: 12,
	quality: 12,
	todo: 6,
	activity: 6
};
/** The spans of these cards, in this order, filling rows of twelve with no row left short. */
function place(slots, spans) {
	const placed = {};
	let row = [];
	let used = 0;
	const close = () => {
		const last = row[row.length - 1];
		if (last !== void 0 && used < 12) placed[last] = (placed[last] ?? 0) + 12 - used;
		row = [];
		used = 0;
	};
	for (const slot of slots) {
		const span = Math.min(12, spans[slot]);
		if (used + span > 12) close();
		placed[slot] = span;
		row.push(slot);
		used += span;
	}
	close();
	return placed;
}
/** A card's place as the grid reads it: its span at both widths, as custom properties. */
function cellStyle(wide, mid) {
	return {
		"--span-wide": wide ?? 12,
		"--span-mid": mid ?? 12
	};
}
//#endregion
//#region resources/js/Pages/Admin/Uebersicht/Index.vue?vue&type=script&setup=true&lang.ts
var FAILED = "Diese Auswertung konnte nicht geladen werden. Die übrigen Zahlen der Übersicht sind davon nicht betroffen.";
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		asOf: {},
		period: {},
		variant: {},
		kpis: {},
		quality: {},
		demo: { type: Boolean },
		recentOrders: {},
		todo: {},
		today: {},
		activity: {},
		topWheels: {},
		charts: {},
		chartKeys: {},
		coverageRows: {},
		can: {}
	},
	setup(__props) {
		/**
		* Übersicht: the admin's first screen (docs/admin/rest-build-plan.md, „Übersicht und Shell“; the
		* density brief).
		*
		* One Zeitraum for everything on it (PeriodSwitcher, remembered on the account). The figures come
		* first; under them one twelve-column grid whose cards take the brief's spans — Umsatz 8 / Heute 4 ·
		* Verdikte 5 / Top-Felgen 4 / Systemzustand 3 · Abdeckung 7 / Nachfrage-Lücken 5 · Neueste
		* Bestellungen 12 · Zu erledigen 8 / Letzte Aktivität 4 — rows as tall as their content, cards as
		* tall as theirs; a card with nothing to show shrinks to its sentence (layout.ts places them, and a
		* role without a card never leaves a hole). Where seeded demonstration orders are among the ones
		* counted, the page says so once, above the figures.
		*/
		const props = __props;
		const health = useHealth();
		const exportUrl = (0, vue_exports.computed)(() => {
			if (!props.can.export) return null;
			const query = props.period.key === "eigen" ? {
				zeitraum: "eigen",
				von: props.period.von,
				bis: props.period.bis
			} : { zeitraum: props.period.key };
			return `/admin/uebersicht/export?${new URLSearchParams(query).toString()}`;
		});
		/** Which chart shows its numbers as a table instead ("Tabelle anzeigen"). */
		const tables = (0, vue_exports.reactive)({
			revenue: false,
			verdicts: false,
			topWheels: false
		});
		const revenueTable = (0, vue_exports.computed)(() => {
			const chart = props.charts?.revenue;
			const previous = props.period.compare && chart ? chart.previous : null;
			return {
				header: previous ? [
					"Tag",
					"Umsatz",
					"Bestellungen",
					"Umsatz im Vorzeitraum"
				] : [
					"Tag",
					"Umsatz",
					"Bestellungen"
				],
				rows: chart ? chart.points.map((p, i) => {
					const before = previous?.[i];
					return previous ? [
						p.label,
						formatMoney(p.value),
						formatNumber(p.orders),
						before ? formatMoney(before.value) : ""
					] : [
						p.label,
						formatMoney(p.value),
						formatNumber(p.orders)
					];
				}) : []
			};
		});
		const verdictTable = (0, vue_exports.computed)(() => {
			const chart = props.charts?.verdicts;
			return {
				header: [
					"Woche",
					...chart ? chart.series.map((s) => s.label) : [],
					"Zusammen"
				],
				rows: chart ? chart.weeks.map((w) => [
					`${w.label} (${w.range})`,
					...chart.series.map((s) => formatNumber(w.values[s.key] ?? 0)),
					formatNumber(w.total)
				]) : []
			};
		});
		const topTable = (0, vue_exports.computed)(() => ({
			header: [
				"Felge",
				"Größe",
				"Bestellungen"
			],
			rows: (props.topWheels ?? []).map((b) => [
				b.label,
				b.size ?? "",
				formatNumber(b.value)
			])
		}));
		/** „1.411 Prüfungen im Zeitraum, 63,2 % davon freigegeben.“ — the Freigabequote is PERMITTED ÷ all. */
		const verdictSummary = (0, vue_exports.computed)(() => {
			const chart = props.charts?.verdicts;
			if (!chart || chart.checks === 0) return null;
			return `${formatNumber(chart.checks)} ${chart.checks === 1 ? "Prüfung" : "Prüfungen"} im Zeitraum, ${formatPercent(chart.permitted / chart.checks * 100, 1, false)} davon freigegeben.`;
		});
		const page = usePage();
		/** The charts' own request failed (no answer, a bare error): every chart widget offers a retry. */
		const loadFailed = (0, vue_exports.ref)(false);
		/** The server could not build the charts at all (Inertia's `rescue`): the same. */
		const rescued = (0, vue_exports.computed)(() => (page.rescuedProps ?? []).includes("charts"));
		const chartsFailed = (0, vue_exports.computed)(() => props.charts === void 0 && (loadFailed.value || rescued.value));
		const chartsLoading = (0, vue_exports.computed)(() => props.charts === void 0 && !chartsFailed.value);
		function has(key) {
			return props.chartKeys.includes(key);
		}
		function failedOne(key) {
			return chartsFailed.value || props.charts?.failed.includes(key) ? FAILED : null;
		}
		function isChartsVisit(visit) {
			const only = visit.only;
			return Array.isArray(only) && only.includes("charts");
		}
		let unbind = [];
		(0, vue_exports.onMounted)(() => {
			unbind = [router.on("start", (event) => {
				if (isChartsVisit(event.detail.visit)) loadFailed.value = false;
			}), router.on("finish", (event) => {
				if (isChartsVisit(event.detail.visit) && page.props.charts === void 0) loadFailed.value = true;
			})];
		});
		(0, vue_exports.onBeforeUnmount)(() => unbind.forEach((off) => off()));
		function retryCharts() {
			loadFailed.value = false;
			router.reload({ only: ["charts"] });
		}
		/** The four verdicts, in the server's words (ChartData::VERDICTS), for the legend of the skeleton. */
		const VERDICT_SKELETON = {
			series: [
				{
					key: "PERMITTED",
					label: "Freigegeben"
				},
				{
					key: "CONDITIONAL",
					label: "Mit Auflagen"
				},
				{
					key: "NOT_PERMITTED",
					label: "Nicht freigegeben"
				},
				{
					key: "UNKNOWN",
					label: "Noch nicht bestätigt"
				}
			],
			weeks: [],
			since: null,
			checks: 0,
			permitted: 0
		};
		/** The Übersicht's Zeitraum as a query: a list opened from a widget counts the same days. */
		const periodQuery = (0, vue_exports.computed)(() => {
			const query = props.period.key === "eigen" ? {
				zeitraum: "eigen",
				von: props.period.von,
				bis: props.period.bis
			} : { zeitraum: props.period.key };
			return `?${new URLSearchParams(query).toString()}`;
		});
		/** Four tiles share a row as four, three as three: the row always fills its twelve columns. */
		const kpiSpan = (0, vue_exports.computed)(() => props.kpis.length > 0 ? Math.max(3, Math.floor(12 / props.kpis.length)) : 12);
		const slots = (0, vue_exports.computed)(() => {
			const coverage = [...has("coverage") ? ["coverage"] : [], ...has("demand") ? ["demand"] : []];
			const sales = [
				...has("revenue") ? ["revenue"] : [],
				"today",
				...has("verdicts") ? ["verdicts"] : [],
				...props.topWheels ? ["topWheels"] : [],
				...health.value ? ["health"] : []
			];
			const lists = [
				...props.recentOrders ? ["orders"] : [],
				...props.quality ? ["quality"] : [],
				"todo",
				...props.activity ? ["activity"] : []
			];
			return props.variant === "gutachten" ? [
				...coverage,
				...sales,
				...lists
			] : [
				...sales,
				...coverage,
				...lists
			];
		});
		const wide = (0, vue_exports.computed)(() => place(slots.value, WIDE));
		const mid = (0, vue_exports.computed)(() => place(slots.value, MID));
		function cell(slot) {
			return cellStyle(wide.value[slot], mid.value[slot]);
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Übersicht",
				dashboard: "",
				context: `Stand: ${__props.asOf}`
			}, _attrs), {
				primary: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(PeriodSwitcher_default, {
						period: __props.period,
						"export-url": exportUrl.value
					}, null, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)(PeriodSwitcher_default, {
						period: __props.period,
						"export-url": exportUrl.value
					}, null, 8, ["period", "export-url"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="dash" data-v-7e697525${_scopeId}><p class="dash__period" data-v-7e697525${_scopeId}><span class="dash__period-name" data-v-7e697525${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.period.label)}</span><span class="dash__period-range" data-v-7e697525${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.period.range)}</span>`);
						if (__props.period.compare) _push(`<span class="dash__period-compare" data-v-7e697525${_scopeId}>gegenüber dem Vorzeitraum ${(0, server_renderer_exports.ssrInterpolate)(__props.period.previousRange)}</span>`);
						else _push(`<!---->`);
						_push(`</p>`);
						if (__props.demo) _push(`<p class="dash__demo" role="note" data-v-7e697525${_scopeId}> Unter den gezählten Bestellungen sind Demodaten. Die Zahlen zeigen, wie die Übersicht arbeitet, nicht, wie der Shop läuft. </p>`);
						else _push(`<!---->`);
						if (__props.kpis.length) {
							_push(`<section class="dash__kpis" aria-label="Kennzahlen" style="${(0, server_renderer_exports.ssrRenderStyle)({ "--kpi-span": kpiSpan.value })}" data-v-7e697525${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.kpis, (kpi) => {
								_push((0, server_renderer_exports.ssrRenderComponent)(KpiTile_default, {
									key: kpi.key,
									kpi
								}, null, _parent, _scopeId));
							});
							_push(`<!--]--></section>`);
						} else _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Für deine Rolle gibt es hier noch keine Kennzahlen. Deine Bereiche findest du in der Navigation."
						}, null, _parent, _scopeId));
						_push(`<div class="dash__grid" data-v-7e697525${_scopeId}>`);
						if (__props.variant === "gutachten" && (has("coverage") || has("demand"))) _push((0, server_renderer_exports.ssrRenderComponent)(CoverageRow_default, {
							charts: __props.charts,
							keys: __props.chartKeys,
							rows: __props.coverageRows,
							failed: chartsFailed.value,
							"period-query": periodQuery.value,
							"coverage-style": cell("coverage"),
							"demand-style": cell("demand"),
							onRetry: retryCharts
						}, null, _parent, _scopeId));
						else _push(`<!---->`);
						if (has("revenue")) {
							_push(`<!--[-->`);
							if (!__props.charts || !__props.charts.revenue && failedOne("revenue")) _push((0, server_renderer_exports.ssrRenderComponent)(DashWidget_default, {
								class: "dash__cell",
								style: cell("revenue"),
								title: "Umsatz über die Zeit",
								loading: chartsLoading.value,
								error: failedOne("revenue"),
								onRetry: retryCharts
							}, {
								skeleton: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										_push(`<div class="chart-skeleton" data-v-7e697525${_scopeId}><span class="skeleton chart-skeleton__plot" data-v-7e697525${_scopeId}></span>`);
										if (__props.period.compare) _push(`<p class="chart-legend" data-v-7e697525${_scopeId}><span class="chart-legend__line" data-v-7e697525${_scopeId}></span> ${(0, server_renderer_exports.ssrInterpolate)(__props.period.range)} <span class="chart-legend__line chart-legend__line--previous" data-v-7e697525${_scopeId}></span> Vorzeitraum ${(0, server_renderer_exports.ssrInterpolate)(__props.period.previousRange)}</p>`);
										else _push(`<!---->`);
										_push(`</div>`);
									} else return [(0, vue_exports.createVNode)("div", { class: "chart-skeleton" }, [(0, vue_exports.createVNode)("span", { class: "skeleton chart-skeleton__plot" }), __props.period.compare ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 0,
										class: "chart-legend"
									}, [
										(0, vue_exports.createVNode)("span", { class: "chart-legend__line" }),
										(0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(__props.period.range) + " ", 1),
										(0, vue_exports.createVNode)("span", { class: "chart-legend__line chart-legend__line--previous" }),
										(0, vue_exports.createTextVNode)(" Vorzeitraum " + (0, vue_exports.toDisplayString)(__props.period.previousRange), 1)
									])) : (0, vue_exports.createCommentVNode)("", true)])];
								}),
								_: 1
							}, _parent, _scopeId));
							else _push((0, server_renderer_exports.ssrRenderComponent)(DashWidget_default, {
								class: "dash__cell",
								style: cell("revenue"),
								title: "Umsatz über die Zeit",
								empty: __props.charts.revenue ? null : "Noch kein Umsatz in diesem Zeitraum. Die Linie beginnt mit der ersten bezahlten Bestellung."
							}, (0, vue_exports.createSlots)({
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										if (__props.charts.revenue) {
											_push(`<!--[-->`);
											if (tables.revenue) _push((0, server_renderer_exports.ssrRenderComponent)(ChartTable_default, {
												caption: "Umsatz je Tag",
												header: revenueTable.value.header,
												rows: revenueTable.value.rows
											}, null, _parent, _scopeId));
											else _push((0, server_renderer_exports.ssrRenderComponent)(LineChart_default, {
												points: __props.charts.revenue.points,
												previous: __props.period.compare ? __props.charts.revenue.previous : null,
												label: `Umsatz je Tag, ${__props.period.range}, zusammen ${(0, vue_exports.unref)(formatMoney)(__props.charts.revenue.total)}`
											}, null, _parent, _scopeId));
											if (__props.period.compare && __props.charts.revenue.previous) _push(`<p class="chart-legend" data-v-7e697525${_scopeId}><span class="chart-legend__line" aria-hidden="true" data-v-7e697525${_scopeId}></span> ${(0, server_renderer_exports.ssrInterpolate)(__props.period.range)} <span class="chart-legend__line chart-legend__line--previous" aria-hidden="true" data-v-7e697525${_scopeId}></span> Vorzeitraum ${(0, server_renderer_exports.ssrInterpolate)(__props.period.previousRange)}</p>`);
											else _push(`<!---->`);
											_push(`<!--]-->`);
										} else _push(`<!---->`);
									} else return [__props.charts.revenue ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [tables.revenue ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ChartTable_default, {
										key: 0,
										caption: "Umsatz je Tag",
										header: revenueTable.value.header,
										rows: revenueTable.value.rows
									}, null, 8, ["header", "rows"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(LineChart_default, {
										key: 1,
										points: __props.charts.revenue.points,
										previous: __props.period.compare ? __props.charts.revenue.previous : null,
										label: `Umsatz je Tag, ${__props.period.range}, zusammen ${(0, vue_exports.unref)(formatMoney)(__props.charts.revenue.total)}`
									}, null, 8, [
										"points",
										"previous",
										"label"
									])), __props.period.compare && __props.charts.revenue.previous ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 2,
										class: "chart-legend"
									}, [
										(0, vue_exports.createVNode)("span", {
											class: "chart-legend__line",
											"aria-hidden": "true"
										}),
										(0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(__props.period.range) + " ", 1),
										(0, vue_exports.createVNode)("span", {
											class: "chart-legend__line chart-legend__line--previous",
											"aria-hidden": "true"
										}),
										(0, vue_exports.createTextVNode)(" Vorzeitraum " + (0, vue_exports.toDisplayString)(__props.period.previousRange), 1)
									])) : (0, vue_exports.createCommentVNode)("", true)], 64)) : (0, vue_exports.createCommentVNode)("", true)];
								}),
								_: 2
							}, [__props.charts.revenue ? {
								name: "tools",
								fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										_push(`<span class="chart-total" data-v-7e697525${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(__props.charts.revenue.total))}</span>`);
										_push((0, server_renderer_exports.ssrRenderComponent)(ChartMenu_default, {
											table: tables.revenue,
											"onUpdate:table": ($event) => tables.revenue = $event,
											title: "Umsatz über die Zeit",
											header: revenueTable.value.header,
											rows: revenueTable.value.rows,
											filename: `umsatz-${__props.period.von}-bis-${__props.period.bis}`
										}, null, _parent, _scopeId));
									} else return [(0, vue_exports.createVNode)("span", { class: "chart-total" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(__props.charts.revenue.total)), 1), (0, vue_exports.createVNode)(ChartMenu_default, {
										table: tables.revenue,
										"onUpdate:table": ($event) => tables.revenue = $event,
										title: "Umsatz über die Zeit",
										header: revenueTable.value.header,
										rows: revenueTable.value.rows,
										filename: `umsatz-${__props.period.von}-bis-${__props.period.bis}`
									}, null, 8, [
										"table",
										"onUpdate:table",
										"header",
										"rows",
										"filename"
									])];
								}),
								key: "0"
							} : void 0]), _parent, _scopeId));
							_push(`<!--]-->`);
						} else _push(`<!---->`);
						_push((0, server_renderer_exports.ssrRenderComponent)(TodayCard_default, {
							items: __props.today,
							class: "dash__cell dash__today",
							style: cell("today")
						}, null, _parent, _scopeId));
						if (has("verdicts")) {
							_push(`<!--[-->`);
							if (!__props.charts || !__props.charts.verdicts && failedOne("verdicts")) _push((0, server_renderer_exports.ssrRenderComponent)(DashWidget_default, {
								class: "dash__cell",
								style: cell("verdicts"),
								title: "Ergebnisse der Prüfungen",
								loading: chartsLoading.value,
								error: failedOne("verdicts"),
								onRetry: retryCharts
							}, {
								skeleton: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										_push(`<div class="chart-skeleton" data-v-7e697525${_scopeId}>`);
										_push((0, server_renderer_exports.ssrRenderComponent)(StackedBar_default, {
											chart: VERDICT_SKELETON,
											label: "",
											loading: ""
										}, null, _parent, _scopeId));
										_push(`<p class="chart-caption" aria-hidden="true" data-v-7e697525${_scopeId}> <br data-v-7e697525${_scopeId}> </p></div>`);
									} else return [(0, vue_exports.createVNode)("div", { class: "chart-skeleton" }, [(0, vue_exports.createVNode)(StackedBar_default, {
										chart: VERDICT_SKELETON,
										label: "",
										loading: ""
									}), (0, vue_exports.createVNode)("p", {
										class: "chart-caption",
										"aria-hidden": "true"
									}, [
										(0, vue_exports.createTextVNode)("\xA0"),
										(0, vue_exports.createVNode)("br"),
										(0, vue_exports.createTextVNode)("\xA0")
									])])];
								}),
								_: 1
							}, _parent, _scopeId));
							else _push((0, server_renderer_exports.ssrRenderComponent)(DashWidget_default, {
								class: "dash__cell",
								style: cell("verdicts"),
								title: "Ergebnisse der Prüfungen",
								empty: __props.charts.verdicts ? null : "Der Shop zählt jede Prüfung einer Felge an einem Auto. Sobald Kundinnen und Kunden prüfen, zeigt sich hier je Woche, wie oft die Antwort freigegeben, mit Auflagen, nicht freigegeben oder noch nicht bestätigt war."
							}, (0, vue_exports.createSlots)({
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										if (__props.charts.verdicts) {
											_push(`<!--[-->`);
											if (tables.verdicts) _push((0, server_renderer_exports.ssrRenderComponent)(ChartTable_default, {
												caption: "Prüfergebnisse je Woche",
												header: verdictTable.value.header,
												rows: verdictTable.value.rows
											}, null, _parent, _scopeId));
											else _push((0, server_renderer_exports.ssrRenderComponent)(StackedBar_default, {
												chart: __props.charts.verdicts,
												label: `Prüfergebnisse je Woche, ${__props.period.range}`
											}, null, _parent, _scopeId));
											_push(`<p class="chart-caption" data-v-7e697525${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(verdictSummary.value)} `);
											if (__props.charts.verdicts.since) _push(`<!--[-->Gezählt seit ${(0, server_renderer_exports.ssrInterpolate)(__props.charts.verdicts.since)}.<!--]-->`);
											else _push(`<!---->`);
											_push(`</p><!--]-->`);
										} else _push(`<!---->`);
									} else return [__props.charts.verdicts ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [tables.verdicts ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ChartTable_default, {
										key: 0,
										caption: "Prüfergebnisse je Woche",
										header: verdictTable.value.header,
										rows: verdictTable.value.rows
									}, null, 8, ["header", "rows"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(StackedBar_default, {
										key: 1,
										chart: __props.charts.verdicts,
										label: `Prüfergebnisse je Woche, ${__props.period.range}`
									}, null, 8, ["chart", "label"])), (0, vue_exports.createVNode)("p", { class: "chart-caption" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(verdictSummary.value) + " ", 1), __props.charts.verdicts.since ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("Gezählt seit " + (0, vue_exports.toDisplayString)(__props.charts.verdicts.since) + ".", 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])], 64)) : (0, vue_exports.createCommentVNode)("", true)];
								}),
								_: 2
							}, [__props.charts.verdicts ? {
								name: "tools",
								fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(ChartMenu_default, {
										table: tables.verdicts,
										"onUpdate:table": ($event) => tables.verdicts = $event,
										title: "Ergebnisse der Prüfungen",
										header: verdictTable.value.header,
										rows: verdictTable.value.rows,
										filename: `pruefergebnisse-${__props.period.von}-bis-${__props.period.bis}`
									}, null, _parent, _scopeId));
									else return [(0, vue_exports.createVNode)(ChartMenu_default, {
										table: tables.verdicts,
										"onUpdate:table": ($event) => tables.verdicts = $event,
										title: "Ergebnisse der Prüfungen",
										header: verdictTable.value.header,
										rows: verdictTable.value.rows,
										filename: `pruefergebnisse-${__props.period.von}-bis-${__props.period.bis}`
									}, null, 8, [
										"table",
										"onUpdate:table",
										"header",
										"rows",
										"filename"
									])];
								}),
								key: "0"
							} : void 0]), _parent, _scopeId));
							_push(`<!--]-->`);
						} else _push(`<!---->`);
						if (__props.topWheels) _push((0, server_renderer_exports.ssrRenderComponent)(DashWidget_default, {
							class: "dash__cell",
							style: cell("topWheels"),
							title: "Meistbestellte Felgen",
							empty: __props.topWheels.length ? null : "Noch keine bezahlte Bestellung mit Felgen in diesem Zeitraum."
						}, (0, vue_exports.createSlots)({
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									if (tables.topWheels) _push((0, server_renderer_exports.ssrRenderComponent)(ChartTable_default, {
										caption: "Meistbestellte Felgen",
										header: topTable.value.header,
										rows: topTable.value.rows
									}, null, _parent, _scopeId));
									else _push((0, server_renderer_exports.ssrRenderComponent)(BarChart_default, {
										bars: __props.topWheels,
										label: `Meistbestellte Felgen, ${__props.period.range}`
									}, null, _parent, _scopeId));
								} else return [tables.topWheels ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ChartTable_default, {
									key: 0,
									caption: "Meistbestellte Felgen",
									header: topTable.value.header,
									rows: topTable.value.rows
								}, null, 8, ["header", "rows"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(BarChart_default, {
									key: 1,
									bars: __props.topWheels,
									label: `Meistbestellte Felgen, ${__props.period.range}`
								}, null, 8, ["bars", "label"]))];
							}),
							_: 2
						}, [__props.topWheels.length ? {
							name: "tools",
							fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(ChartMenu_default, {
									table: tables.topWheels,
									"onUpdate:table": ($event) => tables.topWheels = $event,
									title: "Meistbestellte Felgen",
									header: topTable.value.header,
									rows: topTable.value.rows,
									filename: `top-felgen-${__props.period.von}-bis-${__props.period.bis}`
								}, null, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)(ChartMenu_default, {
									table: tables.topWheels,
									"onUpdate:table": ($event) => tables.topWheels = $event,
									title: "Meistbestellte Felgen",
									header: topTable.value.header,
									rows: topTable.value.rows,
									filename: `top-felgen-${__props.period.von}-bis-${__props.period.bis}`
								}, null, 8, [
									"table",
									"onUpdate:table",
									"header",
									"rows",
									"filename"
								])];
							}),
							key: "0"
						} : void 0]), _parent, _scopeId));
						else _push(`<!---->`);
						if ((0, vue_exports.unref)(health)) _push((0, server_renderer_exports.ssrRenderComponent)(DashWidget_default, {
							class: "dash__cell",
							style: cell("health"),
							title: "Systemzustand",
							href: (0, vue_exports.unref)(health).href,
							"href-label": "Alle Systemprüfungen"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<p class="${(0, server_renderer_exports.ssrRenderClass)([`health--${(0, vue_exports.unref)(health).state}`, "health"])}" data-v-7e697525${_scopeId}><span class="${(0, server_renderer_exports.ssrRenderClass)([`adm-health__dot--${(0, vue_exports.unref)(health).state}`, "adm-health__dot"])}" aria-hidden="true" data-v-7e697525${_scopeId}></span> ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(health).sentence)}</p><p class="health__note" data-v-7e697525${_scopeId}>Wird jede Minute neu geprüft.</p>`);
								else return [(0, vue_exports.createVNode)("p", { class: ["health", `health--${(0, vue_exports.unref)(health).state}`] }, [(0, vue_exports.createVNode)("span", {
									class: ["adm-health__dot", `adm-health__dot--${(0, vue_exports.unref)(health).state}`],
									"aria-hidden": "true"
								}, null, 2), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(health).sentence), 1)], 2), (0, vue_exports.createVNode)("p", { class: "health__note" }, "Wird jede Minute neu geprüft.")];
							}),
							_: 1
						}, _parent, _scopeId));
						else _push(`<!---->`);
						if (__props.variant !== "gutachten" && (has("coverage") || has("demand"))) _push((0, server_renderer_exports.ssrRenderComponent)(CoverageRow_default, {
							charts: __props.charts,
							keys: __props.chartKeys,
							rows: __props.coverageRows,
							failed: chartsFailed.value,
							"period-query": periodQuery.value,
							"coverage-style": cell("coverage"),
							"demand-style": cell("demand"),
							onRetry: retryCharts
						}, null, _parent, _scopeId));
						else _push(`<!---->`);
						if (__props.recentOrders) _push((0, server_renderer_exports.ssrRenderComponent)(DashWidget_default, {
							class: "dash__cell",
							style: cell("orders"),
							title: "Neueste Bestellungen",
							href: "/admin/bestellungen",
							"href-label": "Alle Bestellungen",
							empty: __props.recentOrders.length ? null : "Hier erscheinen die neuesten Bestellungen, sobald jemand im Shop bestellt."
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(RecentOrders_default, { orders: __props.recentOrders }, null, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)(RecentOrders_default, { orders: __props.recentOrders }, null, 8, ["orders"])];
							}),
							_: 1
						}, _parent, _scopeId));
						else _push(`<!---->`);
						if (__props.quality) _push((0, server_renderer_exports.ssrRenderComponent)(DashWidget_default, {
							class: "dash__cell",
							style: cell("quality"),
							title: "Datenqualität",
							empty: __props.quality.length ? null : "Bei jeder Ausführung im Shop sind Preis, Foto, Gewicht und Traglast gepflegt."
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(QualityList_default, { rows: __props.quality }, null, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)(QualityList_default, { rows: __props.quality }, null, 8, ["rows"])];
							}),
							_: 1
						}, _parent, _scopeId));
						else _push(`<!---->`);
						_push((0, server_renderer_exports.ssrRenderComponent)(DashWidget_default, {
							class: "dash__cell",
							style: cell("todo"),
							title: "Zu erledigen",
							empty: __props.todo.length ? null : "Alles erledigt. Was auf dich wartet, erscheint hier – das Älteste zuerst."
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(TodoList_default, { items: __props.todo }, null, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)(TodoList_default, { items: __props.todo }, null, 8, ["items"])];
							}),
							_: 1
						}, _parent, _scopeId));
						if (__props.activity) _push((0, server_renderer_exports.ssrRenderComponent)(DashWidget_default, {
							class: "dash__cell",
							style: cell("activity"),
							title: "Letzte Aktivität",
							href: "/admin/protokoll",
							"href-label": "Ganzes Protokoll",
							empty: __props.activity.length ? null : "Jede Änderung im Admin erscheint hier, sobald jemand aus dem Team sie speichert."
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<ul class="activity" data-v-7e697525${_scopeId}><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(__props.activity, (entry) => {
										_push(`<li class="activity__row" data-v-7e697525${_scopeId}><span class="activity__who" data-v-7e697525${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.person)}</span><span class="activity__what" data-v-7e697525${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.sentence)}</span><time class="activity__when"${(0, server_renderer_exports.ssrRenderAttr)("datetime", entry.iso ?? void 0)} data-v-7e697525${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.ago)}</time></li>`);
									});
									_push(`<!--]--></ul>`);
								} else return [(0, vue_exports.createVNode)("ul", { class: "activity" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.activity, (entry) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
										key: entry.id,
										class: "activity__row"
									}, [
										(0, vue_exports.createVNode)("span", { class: "activity__who" }, (0, vue_exports.toDisplayString)(entry.person), 1),
										(0, vue_exports.createVNode)("span", { class: "activity__what" }, (0, vue_exports.toDisplayString)(entry.sentence), 1),
										(0, vue_exports.createVNode)("time", {
											class: "activity__when",
											datetime: entry.iso ?? void 0
										}, (0, vue_exports.toDisplayString)(entry.ago), 9, ["datetime"])
									]);
								}), 128))])];
							}),
							_: 1
						}, _parent, _scopeId));
						else _push(`<!---->`);
						_push(`</div></div>`);
					} else return [(0, vue_exports.createVNode)("div", { class: "dash" }, [
						(0, vue_exports.createVNode)("p", { class: "dash__period" }, [
							(0, vue_exports.createVNode)("span", { class: "dash__period-name" }, (0, vue_exports.toDisplayString)(__props.period.label), 1),
							(0, vue_exports.createVNode)("span", { class: "dash__period-range" }, (0, vue_exports.toDisplayString)(__props.period.range), 1),
							__props.period.compare ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 0,
								class: "dash__period-compare"
							}, "gegenüber dem Vorzeitraum " + (0, vue_exports.toDisplayString)(__props.period.previousRange), 1)) : (0, vue_exports.createCommentVNode)("", true)
						]),
						__props.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "dash__demo",
							role: "note"
						}, " Unter den gezählten Bestellungen sind Demodaten. Die Zahlen zeigen, wie die Übersicht arbeitet, nicht, wie der Shop läuft. ")) : (0, vue_exports.createCommentVNode)("", true),
						__props.kpis.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 1,
							class: "dash__kpis",
							"aria-label": "Kennzahlen",
							style: { "--kpi-span": kpiSpan.value }
						}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.kpis, (kpi) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(KpiTile_default, {
								key: kpi.key,
								kpi
							}, null, 8, ["kpi"]);
						}), 128))], 4)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 2,
							kind: "empty",
							text: "Für deine Rolle gibt es hier noch keine Kennzahlen. Deine Bereiche findest du in der Navigation."
						})),
						(0, vue_exports.createVNode)("div", { class: "dash__grid" }, [
							__props.variant === "gutachten" && (has("coverage") || has("demand")) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(CoverageRow_default, {
								key: 0,
								charts: __props.charts,
								keys: __props.chartKeys,
								rows: __props.coverageRows,
								failed: chartsFailed.value,
								"period-query": periodQuery.value,
								"coverage-style": cell("coverage"),
								"demand-style": cell("demand"),
								onRetry: retryCharts
							}, null, 8, [
								"charts",
								"keys",
								"rows",
								"failed",
								"period-query",
								"coverage-style",
								"demand-style"
							])) : (0, vue_exports.createCommentVNode)("", true),
							has("revenue") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [!__props.charts || !__props.charts.revenue && failedOne("revenue") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(DashWidget_default, {
								key: 0,
								class: "dash__cell",
								style: cell("revenue"),
								title: "Umsatz über die Zeit",
								loading: chartsLoading.value,
								error: failedOne("revenue"),
								onRetry: retryCharts
							}, {
								skeleton: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("div", { class: "chart-skeleton" }, [(0, vue_exports.createVNode)("span", { class: "skeleton chart-skeleton__plot" }), __props.period.compare ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 0,
									class: "chart-legend"
								}, [
									(0, vue_exports.createVNode)("span", { class: "chart-legend__line" }),
									(0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(__props.period.range) + " ", 1),
									(0, vue_exports.createVNode)("span", { class: "chart-legend__line chart-legend__line--previous" }),
									(0, vue_exports.createTextVNode)(" Vorzeitraum " + (0, vue_exports.toDisplayString)(__props.period.previousRange), 1)
								])) : (0, vue_exports.createCommentVNode)("", true)])]),
								_: 1
							}, 8, [
								"style",
								"loading",
								"error"
							])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(DashWidget_default, {
								key: 1,
								class: "dash__cell",
								style: cell("revenue"),
								title: "Umsatz über die Zeit",
								empty: __props.charts.revenue ? null : "Noch kein Umsatz in diesem Zeitraum. Die Linie beginnt mit der ersten bezahlten Bestellung."
							}, (0, vue_exports.createSlots)({
								default: (0, vue_exports.withCtx)(() => [__props.charts.revenue ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [tables.revenue ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ChartTable_default, {
									key: 0,
									caption: "Umsatz je Tag",
									header: revenueTable.value.header,
									rows: revenueTable.value.rows
								}, null, 8, ["header", "rows"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(LineChart_default, {
									key: 1,
									points: __props.charts.revenue.points,
									previous: __props.period.compare ? __props.charts.revenue.previous : null,
									label: `Umsatz je Tag, ${__props.period.range}, zusammen ${(0, vue_exports.unref)(formatMoney)(__props.charts.revenue.total)}`
								}, null, 8, [
									"points",
									"previous",
									"label"
								])), __props.period.compare && __props.charts.revenue.previous ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 2,
									class: "chart-legend"
								}, [
									(0, vue_exports.createVNode)("span", {
										class: "chart-legend__line",
										"aria-hidden": "true"
									}),
									(0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(__props.period.range) + " ", 1),
									(0, vue_exports.createVNode)("span", {
										class: "chart-legend__line chart-legend__line--previous",
										"aria-hidden": "true"
									}),
									(0, vue_exports.createTextVNode)(" Vorzeitraum " + (0, vue_exports.toDisplayString)(__props.period.previousRange), 1)
								])) : (0, vue_exports.createCommentVNode)("", true)], 64)) : (0, vue_exports.createCommentVNode)("", true)]),
								_: 2
							}, [__props.charts.revenue ? {
								name: "tools",
								fn: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "chart-total" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(__props.charts.revenue.total)), 1), (0, vue_exports.createVNode)(ChartMenu_default, {
									table: tables.revenue,
									"onUpdate:table": ($event) => tables.revenue = $event,
									title: "Umsatz über die Zeit",
									header: revenueTable.value.header,
									rows: revenueTable.value.rows,
									filename: `umsatz-${__props.period.von}-bis-${__props.period.bis}`
								}, null, 8, [
									"table",
									"onUpdate:table",
									"header",
									"rows",
									"filename"
								])]),
								key: "0"
							} : void 0]), 1032, ["style", "empty"]))], 64)) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)(TodayCard_default, {
								items: __props.today,
								class: "dash__cell dash__today",
								style: cell("today")
							}, null, 8, ["items", "style"]),
							has("verdicts") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [!__props.charts || !__props.charts.verdicts && failedOne("verdicts") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(DashWidget_default, {
								key: 0,
								class: "dash__cell",
								style: cell("verdicts"),
								title: "Ergebnisse der Prüfungen",
								loading: chartsLoading.value,
								error: failedOne("verdicts"),
								onRetry: retryCharts
							}, {
								skeleton: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("div", { class: "chart-skeleton" }, [(0, vue_exports.createVNode)(StackedBar_default, {
									chart: VERDICT_SKELETON,
									label: "",
									loading: ""
								}), (0, vue_exports.createVNode)("p", {
									class: "chart-caption",
									"aria-hidden": "true"
								}, [
									(0, vue_exports.createTextVNode)("\xA0"),
									(0, vue_exports.createVNode)("br"),
									(0, vue_exports.createTextVNode)("\xA0")
								])])]),
								_: 1
							}, 8, [
								"style",
								"loading",
								"error"
							])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(DashWidget_default, {
								key: 1,
								class: "dash__cell",
								style: cell("verdicts"),
								title: "Ergebnisse der Prüfungen",
								empty: __props.charts.verdicts ? null : "Der Shop zählt jede Prüfung einer Felge an einem Auto. Sobald Kundinnen und Kunden prüfen, zeigt sich hier je Woche, wie oft die Antwort freigegeben, mit Auflagen, nicht freigegeben oder noch nicht bestätigt war."
							}, (0, vue_exports.createSlots)({
								default: (0, vue_exports.withCtx)(() => [__props.charts.verdicts ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [tables.verdicts ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ChartTable_default, {
									key: 0,
									caption: "Prüfergebnisse je Woche",
									header: verdictTable.value.header,
									rows: verdictTable.value.rows
								}, null, 8, ["header", "rows"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(StackedBar_default, {
									key: 1,
									chart: __props.charts.verdicts,
									label: `Prüfergebnisse je Woche, ${__props.period.range}`
								}, null, 8, ["chart", "label"])), (0, vue_exports.createVNode)("p", { class: "chart-caption" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(verdictSummary.value) + " ", 1), __props.charts.verdicts.since ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("Gezählt seit " + (0, vue_exports.toDisplayString)(__props.charts.verdicts.since) + ".", 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])], 64)) : (0, vue_exports.createCommentVNode)("", true)]),
								_: 2
							}, [__props.charts.verdicts ? {
								name: "tools",
								fn: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(ChartMenu_default, {
									table: tables.verdicts,
									"onUpdate:table": ($event) => tables.verdicts = $event,
									title: "Ergebnisse der Prüfungen",
									header: verdictTable.value.header,
									rows: verdictTable.value.rows,
									filename: `pruefergebnisse-${__props.period.von}-bis-${__props.period.bis}`
								}, null, 8, [
									"table",
									"onUpdate:table",
									"header",
									"rows",
									"filename"
								])]),
								key: "0"
							} : void 0]), 1032, ["style", "empty"]))], 64)) : (0, vue_exports.createCommentVNode)("", true),
							__props.topWheels ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(DashWidget_default, {
								key: 3,
								class: "dash__cell",
								style: cell("topWheels"),
								title: "Meistbestellte Felgen",
								empty: __props.topWheels.length ? null : "Noch keine bezahlte Bestellung mit Felgen in diesem Zeitraum."
							}, (0, vue_exports.createSlots)({
								default: (0, vue_exports.withCtx)(() => [tables.topWheels ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ChartTable_default, {
									key: 0,
									caption: "Meistbestellte Felgen",
									header: topTable.value.header,
									rows: topTable.value.rows
								}, null, 8, ["header", "rows"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(BarChart_default, {
									key: 1,
									bars: __props.topWheels,
									label: `Meistbestellte Felgen, ${__props.period.range}`
								}, null, 8, ["bars", "label"]))]),
								_: 2
							}, [__props.topWheels.length ? {
								name: "tools",
								fn: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(ChartMenu_default, {
									table: tables.topWheels,
									"onUpdate:table": ($event) => tables.topWheels = $event,
									title: "Meistbestellte Felgen",
									header: topTable.value.header,
									rows: topTable.value.rows,
									filename: `top-felgen-${__props.period.von}-bis-${__props.period.bis}`
								}, null, 8, [
									"table",
									"onUpdate:table",
									"header",
									"rows",
									"filename"
								])]),
								key: "0"
							} : void 0]), 1032, ["style", "empty"])) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.unref)(health) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(DashWidget_default, {
								key: 4,
								class: "dash__cell",
								style: cell("health"),
								title: "Systemzustand",
								href: (0, vue_exports.unref)(health).href,
								"href-label": "Alle Systemprüfungen"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("p", { class: ["health", `health--${(0, vue_exports.unref)(health).state}`] }, [(0, vue_exports.createVNode)("span", {
									class: ["adm-health__dot", `adm-health__dot--${(0, vue_exports.unref)(health).state}`],
									"aria-hidden": "true"
								}, null, 2), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(health).sentence), 1)], 2), (0, vue_exports.createVNode)("p", { class: "health__note" }, "Wird jede Minute neu geprüft.")]),
								_: 1
							}, 8, ["style", "href"])) : (0, vue_exports.createCommentVNode)("", true),
							__props.variant !== "gutachten" && (has("coverage") || has("demand")) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(CoverageRow_default, {
								key: 5,
								charts: __props.charts,
								keys: __props.chartKeys,
								rows: __props.coverageRows,
								failed: chartsFailed.value,
								"period-query": periodQuery.value,
								"coverage-style": cell("coverage"),
								"demand-style": cell("demand"),
								onRetry: retryCharts
							}, null, 8, [
								"charts",
								"keys",
								"rows",
								"failed",
								"period-query",
								"coverage-style",
								"demand-style"
							])) : (0, vue_exports.createCommentVNode)("", true),
							__props.recentOrders ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(DashWidget_default, {
								key: 6,
								class: "dash__cell",
								style: cell("orders"),
								title: "Neueste Bestellungen",
								href: "/admin/bestellungen",
								"href-label": "Alle Bestellungen",
								empty: __props.recentOrders.length ? null : "Hier erscheinen die neuesten Bestellungen, sobald jemand im Shop bestellt."
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(RecentOrders_default, { orders: __props.recentOrders }, null, 8, ["orders"])]),
								_: 1
							}, 8, ["style", "empty"])) : (0, vue_exports.createCommentVNode)("", true),
							__props.quality ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(DashWidget_default, {
								key: 7,
								class: "dash__cell",
								style: cell("quality"),
								title: "Datenqualität",
								empty: __props.quality.length ? null : "Bei jeder Ausführung im Shop sind Preis, Foto, Gewicht und Traglast gepflegt."
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(QualityList_default, { rows: __props.quality }, null, 8, ["rows"])]),
								_: 1
							}, 8, ["style", "empty"])) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)(DashWidget_default, {
								class: "dash__cell",
								style: cell("todo"),
								title: "Zu erledigen",
								empty: __props.todo.length ? null : "Alles erledigt. Was auf dich wartet, erscheint hier – das Älteste zuerst."
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(TodoList_default, { items: __props.todo }, null, 8, ["items"])]),
								_: 1
							}, 8, ["style", "empty"]),
							__props.activity ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(DashWidget_default, {
								key: 8,
								class: "dash__cell",
								style: cell("activity"),
								title: "Letzte Aktivität",
								href: "/admin/protokoll",
								"href-label": "Ganzes Protokoll",
								empty: __props.activity.length ? null : "Jede Änderung im Admin erscheint hier, sobald jemand aus dem Team sie speichert."
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("ul", { class: "activity" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.activity, (entry) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
										key: entry.id,
										class: "activity__row"
									}, [
										(0, vue_exports.createVNode)("span", { class: "activity__who" }, (0, vue_exports.toDisplayString)(entry.person), 1),
										(0, vue_exports.createVNode)("span", { class: "activity__what" }, (0, vue_exports.toDisplayString)(entry.sentence), 1),
										(0, vue_exports.createVNode)("time", {
											class: "activity__when",
											datetime: entry.iso ?? void 0
										}, (0, vue_exports.toDisplayString)(entry.ago), 9, ["datetime"])
									]);
								}), 128))])]),
								_: 1
							}, 8, ["style", "empty"])) : (0, vue_exports.createCommentVNode)("", true)
						])
					])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Uebersicht/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Uebersicht/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-7e697525"]]);
//#endregion
export { Index_default as default };
