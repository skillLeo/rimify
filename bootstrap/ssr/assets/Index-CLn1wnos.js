import { c as vue_exports, n as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { t as AdminLayout_default } from "./AdminLayout-2mZo5V0P.js";
//#region resources/js/Pages/Admin/Gutachten/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: { documents: {} },
	setup(__props) {
		/**
		* Gutachten-Erfassung, list view.
		*
		* The Freigaben column shows published against total on purpose: a document with twenty rows
		* entered and none published is the most common half-finished state in this workflow, and it is
		* invisible unless the list says so.
		*
		* Status and type narrow the list in place. A draft renders neutral, never red: "not yet checked"
		* is not "refused" (R-03, R-07).
		*
		* One table for every width. Below 900px each row lays itself out as a block — same fields, same
		* order — with its column name beside each value.
		*/
		const props = __props;
		const KIND_LABEL = {
			ABE: "ABE",
			TEILEGUTACHTEN: "Teilegutachten",
			ECE: "ECE",
			EC: "EG-Genehmigung"
		};
		const STATUS = {
			published: {
				label: "Veröffentlicht",
				cls: "tag--ok"
			},
			draft: {
				label: "Entwurf",
				cls: "tag--unknown"
			},
			superseded: {
				label: "Ersetzt",
				cls: "tag--warn"
			},
			withdrawn: {
				label: "Zurückgezogen",
				cls: "tag--danger"
			}
		};
		function statusOf(status) {
			return STATUS[status] ?? {
				label: status,
				cls: "tag--unknown"
			};
		}
		const status = (0, vue_exports.ref)(null);
		const kind = (0, vue_exports.ref)(null);
		/** Only the values that actually occur, each with its count. */
		const statusOptions = (0, vue_exports.computed)(() => countBy((d) => d.status));
		const kindOptions = (0, vue_exports.computed)(() => countBy((d) => d.kind));
		function countBy(key) {
			const counts = /* @__PURE__ */ new Map();
			for (const doc of props.documents) counts.set(key(doc), (counts.get(key(doc)) ?? 0) + 1);
			return [...counts.entries()].map(([value, count]) => ({
				value,
				count
			}));
		}
		const rows = (0, vue_exports.computed)(() => props.documents.filter((d) => (status.value === null || d.status === status.value) && (kind.value === null || d.kind === kind.value)));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Gutachten" }, null, _parent));
			_push(`<div class="gut__head" data-v-573ec21d><h1 class="t-h1" data-v-573ec21d>Gutachten</h1><p class="gut__count" data-v-573ec21d><span class="tabular" data-v-573ec21d>${(0, server_renderer_exports.ssrInterpolate)(__props.documents.length)}</span> Dokumente erfasst</p></div>`);
			if (__props.documents.length > 0) {
				_push(`<div class="gut__filters" data-v-573ec21d><div class="gut__filter" role="group" aria-label="Status" data-v-573ec21d><span class="gut__filter-label" data-v-573ec21d>Status</span><button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pill--on": status.value === null }, "pill"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", status.value === null)} data-v-573ec21d> Alle </button><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(statusOptions.value, (option) => {
					_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pill--on": status.value === option.value }, "pill"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", status.value === option.value)} data-v-573ec21d>${(0, server_renderer_exports.ssrInterpolate)(statusOf(option.value).label)} <span class="gut__n tabular" data-v-573ec21d>${(0, server_renderer_exports.ssrInterpolate)(option.count)}</span></button>`);
				});
				_push(`<!--]--></div><div class="gut__filter" role="group" aria-label="Art" data-v-573ec21d><span class="gut__filter-label" data-v-573ec21d>Art</span><button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pill--on": kind.value === null }, "pill"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", kind.value === null)} data-v-573ec21d> Alle </button><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(kindOptions.value, (option) => {
					_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pill--on": kind.value === option.value }, "pill"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", kind.value === option.value)} data-v-573ec21d>${(0, server_renderer_exports.ssrInterpolate)(KIND_LABEL[option.value] ?? option.value)} <span class="gut__n tabular" data-v-573ec21d>${(0, server_renderer_exports.ssrInterpolate)(option.count)}</span></button>`);
				});
				_push(`<!--]--></div></div>`);
			} else _push(`<!---->`);
			_push(`<div class="gut__box" data-v-573ec21d>`);
			if (rows.value.length > 0) {
				_push(`<table class="table gut__table" data-v-573ec21d><thead data-v-573ec21d><tr data-v-573ec21d><th scope="col" data-v-573ec21d>Nummer</th><th scope="col" data-v-573ec21d>Art</th><th scope="col" data-v-573ec21d>Aussteller</th><th scope="col" class="num" data-v-573ec21d>Ausgestellt</th><th scope="col" data-v-573ec21d>Status</th><th scope="col" class="num" data-v-573ec21d>Freigaben</th></tr></thead><tbody data-v-573ec21d><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(rows.value, (doc) => {
					_push(`<tr data-v-573ec21d><td data-label="Nummer" data-v-573ec21d><div data-v-573ec21d><span class="gut__num" data-v-573ec21d>${(0, server_renderer_exports.ssrInterpolate)(doc.reportNumber)}</span>`);
					if (doc.kbaNumber) _push(`<span class="data gut__kba" data-v-573ec21d>KBA ${(0, server_renderer_exports.ssrInterpolate)(doc.kbaNumber)}</span>`);
					else _push(`<!---->`);
					_push(`</div></td><td data-label="Art" data-v-573ec21d>${(0, server_renderer_exports.ssrInterpolate)(KIND_LABEL[doc.kind] ?? doc.kind)}</td><td data-label="Aussteller" data-v-573ec21d>${(0, server_renderer_exports.ssrInterpolate)(doc.issuer)}</td><td data-label="Ausgestellt" class="num data" data-v-573ec21d>${(0, server_renderer_exports.ssrInterpolate)(doc.issuedOn ?? "–")}</td><td data-label="Status" data-v-573ec21d><div data-v-573ec21d><span class="${(0, server_renderer_exports.ssrRenderClass)([statusOf(doc.status).cls, "tag"])}" data-v-573ec21d>${(0, server_renderer_exports.ssrInterpolate)(statusOf(doc.status).label)}</span><span class="data gut__rev" data-v-573ec21d>Fassung ${(0, server_renderer_exports.ssrInterpolate)(doc.revision)}</span></div></td><td data-label="Freigaben" class="num data" data-v-573ec21d>${(0, server_renderer_exports.ssrInterpolate)(doc.publishedCount)} von ${(0, server_renderer_exports.ssrInterpolate)(doc.fitmentCount)} veröffentlicht </td></tr>`);
				});
				_push(`<!--]--></tbody></table>`);
			} else {
				_push(`<div class="state gut__empty" data-v-573ec21d><p class="state__title" data-v-573ec21d>${(0, server_renderer_exports.ssrInterpolate)(__props.documents.length === 0 ? "Noch keine Gutachten erfasst." : "Kein Gutachten passt zu diesen Filtern.")}</p>`);
				if (__props.documents.length > 0) _push(`<button class="btn btn--secondary" type="button" data-v-573ec21d> Filter zurücksetzen </button>`);
				else _push(`<!---->`);
				_push(`</div>`);
			}
			_push(`</div><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-573ec21d"]]);
//#endregion
export { Index_default as default };
