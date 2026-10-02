import { a as link_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-B-w0IEde.js";
import { n as decimal } from "./format-DGFu8Y3r.js";
//#region resources/js/Components/Admin/Dashboard/CoverageMatrix.vue?vue&type=script&setup=true&lang.ts
var CoverageMatrix_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CoverageMatrix",
	__ssrInlineRender: true,
	props: {
		matrix: {},
		selected: { default: null },
		placeholder: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* The Abdeckungs-Matrix: makes down the side, rim sizes across, in each cell the number of that
		* make's variants with at least one wheel of that size a customer may be shown.
		*
		* One hue, light to dark, for magnitude (BRIEF §5: a sequential ramp, never a rainbow); the count is
		* printed in every cell, so the shade only repeats what the number says. Pointing at a cell, or
		* reaching it with the keyboard, names it in a sentence under the grid („BMW, 19 Zoll: 142 von 168
		* Varianten“); each cell opens the list of the variants it counts.
		*
		* It is a table, because it is one: a screen reader reads make, size and count as row, column and
		* cell. From the keyboard it is one stop, not makes × sizes of them: Tab enters at the chosen cell
		* (or the first), the arrow keys, Home and End move inside, Tab leaves. A focused cell says its own
		* sentence, so the caption under the grid is for the eye and announces nothing.
		*
		* `placeholder` draws the same table with skeletons where the names and counts will be — the matrix's
		* own height before it arrives, so nothing under it moves when it does.
		*/
		const props = __props;
		function isSelected(make, cell) {
			return props.selected?.make === make && props.selected.size === cell.size;
		}
		const pointed = (0, vue_exports.ref)(null);
		const caption = (0, vue_exports.computed)(() => pointed.value?.sentence ?? props.matrix.summary.sentence);
		/** From the fifth step on the ramp is dark enough that the count is written in the surface colour. */
		function onDark(level) {
			return level >= 5;
		}
		/** The cell Tab lands on: the one last reached, else the chosen one, else the first. */
		const reached = (0, vue_exports.ref)(null);
		const stop = (0, vue_exports.computed)(() => {
			if (reached.value) return reached.value;
			for (const [r, row] of props.matrix.rows.entries()) {
				const c = row.cells.findIndex((cell) => isSelected(row.make, cell));
				if (c >= 0) return [r, c];
			}
			return [0, 0];
		});
		const grid = (0, vue_exports.ref)(null);
		function cellAt(r, c) {
			return grid.value?.querySelector(`[data-cell="${r}:${c}"]`) ?? null;
		}
		function onFocus(cell, r, c) {
			pointed.value = cell;
			reached.value = [r, c];
		}
		function onKey(event, r, c) {
			const rows = props.matrix.rows.length;
			const cols = props.matrix.sizes.length;
			const next = {
				ArrowRight: [r, Math.min(cols - 1, c + 1)],
				ArrowLeft: [r, Math.max(0, c - 1)],
				ArrowDown: [Math.min(rows - 1, r + 1), c],
				ArrowUp: [Math.max(0, r - 1), c],
				Home: event.ctrlKey ? [0, 0] : [r, 0],
				End: event.ctrlKey ? [rows - 1, cols - 1] : [r, cols - 1]
			}[event.key];
			if (!next) return;
			event.preventDefault();
			reached.value = next;
			(0, vue_exports.nextTick)(() => cellAt(next[0], next[1])?.focus());
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["cm", { "cm--placeholder": __props.placeholder }] }, _attrs))} data-v-99f151fe><div class="cm__scroll" data-v-99f151fe><table class="cm__table" data-v-99f151fe><caption class="visually-hidden" data-v-99f151fe>Abdeckung nach Marke und Felgengröße: Varianten mit mindestens einer freigegebenen Felge</caption><thead data-v-99f151fe><tr data-v-99f151fe><th scope="col" class="cm__corner" data-v-99f151fe>Marke</th><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.matrix.sizes, (size) => {
				_push(`<th scope="col" class="cm__size" data-v-99f151fe>`);
				if (__props.placeholder) _push(`<span class="skeleton cm__ph cm__ph--size" data-v-99f151fe></span>`);
				else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(size.label)}<!--]-->`);
				_push(`</th>`);
			});
			_push(`<!--]--></tr></thead><tbody data-v-99f151fe><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.matrix.rows, (row, r) => {
				_push(`<tr data-v-99f151fe><th scope="row" class="cm__make" data-v-99f151fe>`);
				if (__props.placeholder) _push(`<!--[--><span class="cm__make-name" data-v-99f151fe><span class="skeleton cm__ph cm__ph--name" data-v-99f151fe></span></span><span class="cm__make-count" data-v-99f151fe><span class="skeleton cm__ph cm__ph--count" data-v-99f151fe></span></span><!--]-->`);
				else _push(`<!--[--><span class="cm__make-name" data-v-99f151fe>${(0, server_renderer_exports.ssrInterpolate)(row.make)}</span><span class="cm__make-count" data-v-99f151fe>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(row.covered, 0))} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(row.variants, 0))}</span><!--]-->`);
				_push(`</th><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(row.cells, (cell, c) => {
					_push(`<td class="cm__cell-wrap" data-v-99f151fe>`);
					if (__props.placeholder) _push(`<span class="skeleton cm__cell cm__cell--ph" data-v-99f151fe></span>`);
					else (0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)(cell.href ? (0, vue_exports.unref)(link_default) : "span"), {
						href: cell.href ?? void 0,
						class: ["cm__cell", {
							"cm__cell--dark": onDark(cell.level),
							"cm__cell--none": cell.level === 0,
							"cm__cell--selected": isSelected(row.make, cell)
						}],
						"data-cell": `${r}:${c}`,
						"aria-current": isSelected(row.make, cell) ? "true" : void 0,
						style: cell.level > 0 ? { background: `var(--chart-seq-${cell.level})` } : void 0,
						"aria-label": cell.sentence,
						tabindex: stop.value[0] === r && stop.value[1] === c ? 0 : -1,
						onMouseenter: ($event) => pointed.value = cell,
						onMouseleave: ($event) => pointed.value = null,
						onFocus: ($event) => onFocus(cell, r, c),
						onBlur: ($event) => pointed.value = null,
						onKeydown: ($event) => onKey($event, r, c)
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(cell.count, 0))}`);
							else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(cell.count, 0)), 1)];
						}),
						_: 2
					}), _parent);
					_push(`</td>`);
				});
				_push(`<!--]--></tr>`);
			});
			_push(`<!--]--></tbody></table></div><div class="cm__foot" data-v-99f151fe><p class="cm__caption" data-v-99f151fe>`);
			if (__props.placeholder) _push(`<span class="skeleton cm__ph cm__ph--caption" data-v-99f151fe></span>`);
			else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(caption.value)}<!--]-->`);
			_push(`</p><div class="cm__legend" aria-hidden="true" data-v-99f151fe><span data-v-99f151fe>0</span><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(7, (step) => {
				_push(`<span class="cm__swatch" style="${(0, server_renderer_exports.ssrRenderStyle)({ background: `var(--chart-seq-${step})` })}" data-v-99f151fe></span>`);
			});
			_push(`<!--]--><span data-v-99f151fe>${(0, server_renderer_exports.ssrInterpolate)(__props.placeholder ? "" : (0, vue_exports.unref)(decimal)(__props.matrix.max, 0))}</span></div></div></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Dashboard/CoverageMatrix.vue
var _sfc_setup$1 = CoverageMatrix_vue_vue_type_script_setup_true_lang_default.setup;
CoverageMatrix_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Dashboard/CoverageMatrix.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var CoverageMatrix_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CoverageMatrix_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-99f151fe"]]);
//#endregion
//#region resources/js/Components/Admin/Dashboard/DashWidget.vue?vue&type=script&setup=true&lang.ts
var DashWidget_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "DashWidget",
	__ssrInlineRender: true,
	props: {
		title: {},
		href: { default: null },
		hrefLabel: { default: "Alle ansehen" },
		empty: { default: null },
		emptyLink: { default: null },
		loading: {
			type: Boolean,
			default: false
		},
		skeletonRows: { default: 4 },
		error: { default: null },
		bodyHeight: { default: null }
	},
	emits: ["retry"],
	setup(__props, { emit: __emit }) {
		/**
		* One section of the Übersicht (the brief's craft rules): a flat panel — surface, a 1 px hairline,
		* 8 px corners, 20 px inside — a 15 px title, an optional menu, then its content.
		*
		* Every widget has the same four states, so none of them improvises one: the content; `empty`, one
		* sentence and at most one link, where the content would be; `loading`, a skeleton at the content's
		* own size; `error`, a sentence and "Erneut versuchen". The link beside the title leads to the full
		* list the widget is a slice of, and each call site names it („Alle Bestellungen“, „Ganzes
		* Protokoll“); „Alle ansehen“ is only the fallback.
		*/
		const props = __props;
		const box = (0, vue_exports.computed)(() => props.bodyHeight ? { minHeight: typeof props.bodyHeight === "number" ? `${props.bodyHeight}px` : props.bodyHeight } : void 0);
		const titleId = (0, vue_exports.useId)();
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "widget",
				"aria-labelledby": (0, vue_exports.unref)(titleId),
				"aria-busy": __props.loading ? "true" : void 0
			}, _attrs))} data-v-4cc8e0ca><header class="widget__head" data-v-4cc8e0ca><h2${(0, server_renderer_exports.ssrRenderAttr)("id", (0, vue_exports.unref)(titleId))} class="widget__title" data-v-4cc8e0ca>${(0, server_renderer_exports.ssrInterpolate)(__props.title)}</h2><span class="widget__tools" data-v-4cc8e0ca>`);
			(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "tools", {}, null, _push, _parent);
			if (__props.href) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: __props.href,
				class: "widget__all"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`${(0, server_renderer_exports.ssrInterpolate)(__props.hrefLabel)}<span class="visually-hidden" data-v-4cc8e0ca${_scopeId}>: ${(0, server_renderer_exports.ssrInterpolate)(__props.title)}</span>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: "arrow-right",
							size: 16
						}, null, _parent, _scopeId));
					} else return [
						(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.hrefLabel), 1),
						(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ": " + (0, vue_exports.toDisplayString)(__props.title), 1),
						(0, vue_exports.createVNode)(AdminIcon_default, {
							name: "arrow-right",
							size: 16
						})
					];
				}),
				_: 1
			}, _parent));
			else _push(`<!---->`);
			_push(`</span></header>`);
			if (__props.loading) {
				_push(`<div class="widget__skeleton" style="${(0, server_renderer_exports.ssrRenderStyle)(box.value)}" aria-hidden="true" data-v-4cc8e0ca>`);
				(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "skeleton", {}, () => {
					if (__props.bodyHeight) _push(`<span class="skeleton widget__block" data-v-4cc8e0ca></span>`);
					else {
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.skeletonRows, (n) => {
							_push(`<span class="skeleton widget__bar" data-v-4cc8e0ca></span>`);
						});
						_push(`<!--]-->`);
					}
				}, _push, _parent);
				_push(`</div>`);
			} else if (__props.error) _push(`<div class="widget__state" role="alert" data-v-4cc8e0ca><p class="widget__sentence" data-v-4cc8e0ca>${(0, server_renderer_exports.ssrInterpolate)(__props.error)}</p><button class="btn btn--secondary btn--sm" type="button" data-v-4cc8e0ca>Erneut versuchen</button></div>`);
			else if (__props.empty) {
				_push(`<div class="widget__state" data-v-4cc8e0ca><p class="widget__sentence" data-v-4cc8e0ca>${(0, server_renderer_exports.ssrInterpolate)(__props.empty)}</p>`);
				if (__props.emptyLink) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: __props.emptyLink.href,
					class: "widget__link"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(__props.emptyLink.label)}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.emptyLink.label), 1)];
					}),
					_: 1
				}, _parent));
				else _push(`<!---->`);
				_push(`</div>`);
			} else {
				_push(`<div class="widget__body" data-v-4cc8e0ca>`);
				(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent);
				_push(`</div>`);
			}
			_push(`</section>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Dashboard/DashWidget.vue
var _sfc_setup = DashWidget_vue_vue_type_script_setup_true_lang_default.setup;
DashWidget_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Dashboard/DashWidget.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var DashWidget_default = /*#__PURE__*/ _plugin_vue_export_helper_default(DashWidget_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-4cc8e0ca"]]);
//#endregion
export { CoverageMatrix_default as n, DashWidget_default as t };
