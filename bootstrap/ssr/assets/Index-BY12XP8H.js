import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-DOqx1LBl.js";
import { a as link_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as decimal } from "./format-DGFu8Y3r.js";
import { t as AdminState_default } from "./AdminState-CuiJB2h1.js";
//#region resources/js/Pages/Admin/Auflagen/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: { documents: {} },
	setup(__props) {
		/**
		* Gutachten › Auflagen — every document's own Auflagenverzeichnis, one after the other, to read (the
		* corrections memo §1). There is no catalogue shared between documents any more: `A01` of one Gutachten and
		* `A01` of another are two entries, each with its own sentence. A list is written on its Gutachten, while it
		* is a draft; this page only shows them — and the codes a document's rows carry that it does not define,
		* which keep those rows „Unbekannt“ and the document unreleased.
		*/
		const props = __props;
		const context = (0, vue_exports.computed)(() => props.documents.length === 1 ? "1 Gutachten" : `${decimal(props.documents.length, 0)} Gutachten`);
		const STATUS = {
			draft: "Entwurf",
			published: "Freigegeben",
			superseded: "Ersetzt",
			withdrawn: "Zurückgezogen"
		};
		/** The parameter a filter or tyre kind carries, as the admin entered it. */
		function parameter(c) {
			if (c.bodyForms.length) return `Nur ${c.bodyForms.join(", ")}`;
			if (c.drive) return `${c.drive.mode === "only" ? "Nur mit" : "Nicht mit"} ${c.drive.drive}`;
			if (c.maxAxleLoadKg !== null) return `Bis ${decimal(c.maxAxleLoadKg, 0)} kg Achslast`;
			if (c.axle) return c.axle === "FRONT" ? "Nur Vorderachse" : "Nur Hinterachse";
			return "";
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Auflagen",
				context: context.value
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="adm-note al-intro" data-v-13f422ee${_scopeId}> Jedes Gutachten hat sein eigenes Auflagenverzeichnis; derselbe Code kann in zwei Gutachten Verschiedenes bedeuten. Geschrieben wird es beim Gutachten selbst, solange es ein Entwurf ist. </p>`);
						if (__props.documents.length === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Hier steht das Auflagenverzeichnis jedes Gutachtens, sobald das erste einen Code hat."
						}, null, _parent, _scopeId));
						else _push(`<!---->`);
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.documents, (doc) => {
							_push(`<section class="adm-section al-doc"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `al-doc-${doc.id}`)} data-v-13f422ee${_scopeId}><div class="adm-section__head" data-v-13f422ee${_scopeId}><h2${(0, server_renderer_exports.ssrRenderAttr)("id", `al-doc-${doc.id}`)} class="adm-section__title" data-v-13f422ee${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: doc.href }, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(doc.label)}`);
									else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(doc.label), 1)];
								}),
								_: 2
							}, _parent, _scopeId));
							_push(`</h2><span class="al-status" data-v-13f422ee${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(STATUS[doc.status])}</span></div>`);
							if (doc.unresolved.length) _push(`<p class="adm-alert" role="status" data-v-13f422ee${_scopeId}> Nicht im Auflagenverzeichnis: ${(0, server_renderer_exports.ssrInterpolate)(doc.unresolved.map((u) => `${u.code} (${u.rows === 1 ? "1 Zeile" : `${(0, vue_exports.unref)(decimal)(u.rows, 0)} Zeilen`})`).join(", "))}. Diese Zeilen bleiben „Unbekannt“, bis der Code dort steht. </p>`);
							else _push(`<!---->`);
							if (doc.conditions.length) {
								_push(`<div class="adm-panel" data-v-13f422ee${_scopeId}><table class="adm-table" data-v-13f422ee${_scopeId}><caption class="visually-hidden" data-v-13f422ee${_scopeId}>Auflagenverzeichnis von ${(0, server_renderer_exports.ssrInterpolate)(doc.label)}</caption><thead data-v-13f422ee${_scopeId}><tr data-v-13f422ee${_scopeId}><th scope="col" data-v-13f422ee${_scopeId}>Code</th><th scope="col" data-v-13f422ee${_scopeId}>Art</th><th scope="col" data-v-13f422ee${_scopeId}>Satz aus dem Gutachten</th><th scope="col" class="num" data-v-13f422ee${_scopeId}>Seite</th><th scope="col" class="num" data-v-13f422ee${_scopeId}>Verwendet</th></tr></thead><tbody data-v-13f422ee${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(doc.conditions, (c) => {
									_push(`<tr data-v-13f422ee${_scopeId}><td data-label="Code" data-v-13f422ee${_scopeId}><span class="adm-table__key" translate="no" data-v-13f422ee${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(c.code)}</span></td><td data-label="Art" data-v-13f422ee${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(c.kindLabel)} `);
									if (parameter(c)) _push(`<span class="adm-table__sub" data-v-13f422ee${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(parameter(c))}</span>`);
									else _push(`<!---->`);
									_push(`</td><td data-label="Satz" class="al-text" data-v-13f422ee${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(c.text)}</td><td data-label="Seite" class="num" data-v-13f422ee${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(c.page ?? "–")}</td><td data-label="Verwendet" class="num" data-phone="hide" data-v-13f422ee${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(c.uses === 0 ? "–" : (0, vue_exports.unref)(decimal)(c.uses, 0))}</td></tr>`);
								});
								_push(`<!--]--></tbody></table></div>`);
							} else _push(`<!---->`);
							_push(`</section>`);
						});
						_push(`<!--]-->`);
					} else return [
						(0, vue_exports.createVNode)("p", { class: "adm-note al-intro" }, " Jedes Gutachten hat sein eigenes Auflagenverzeichnis; derselbe Code kann in zwei Gutachten Verschiedenes bedeuten. Geschrieben wird es beim Gutachten selbst, solange es ein Entwurf ist. "),
						__props.documents.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 0,
							kind: "empty",
							text: "Hier steht das Auflagenverzeichnis jedes Gutachtens, sobald das erste einen Code hat."
						})) : (0, vue_exports.createCommentVNode)("", true),
						((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.documents, (doc) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
								key: doc.id,
								class: "adm-section al-doc",
								"aria-labelledby": `al-doc-${doc.id}`
							}, [
								(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
									id: `al-doc-${doc.id}`,
									class: "adm-section__title"
								}, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), { href: doc.href }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(doc.label), 1)]),
									_: 2
								}, 1032, ["href"])], 8, ["id"]), (0, vue_exports.createVNode)("span", { class: "al-status" }, (0, vue_exports.toDisplayString)(STATUS[doc.status]), 1)]),
								doc.unresolved.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 0,
									class: "adm-alert",
									role: "status"
								}, " Nicht im Auflagenverzeichnis: " + (0, vue_exports.toDisplayString)(doc.unresolved.map((u) => `${u.code} (${u.rows === 1 ? "1 Zeile" : `${(0, vue_exports.unref)(decimal)(u.rows, 0)} Zeilen`})`).join(", ")) + ". Diese Zeilen bleiben „Unbekannt“, bis der Code dort steht. ", 1)) : (0, vue_exports.createCommentVNode)("", true),
								doc.conditions.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 1,
									class: "adm-panel"
								}, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [
									(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Auflagenverzeichnis von " + (0, vue_exports.toDisplayString)(doc.label), 1),
									(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
										(0, vue_exports.createVNode)("th", { scope: "col" }, "Code"),
										(0, vue_exports.createVNode)("th", { scope: "col" }, "Art"),
										(0, vue_exports.createVNode)("th", { scope: "col" }, "Satz aus dem Gutachten"),
										(0, vue_exports.createVNode)("th", {
											scope: "col",
											class: "num"
										}, "Seite"),
										(0, vue_exports.createVNode)("th", {
											scope: "col",
											class: "num"
										}, "Verwendet")
									])]),
									(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(doc.conditions, (c) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: c.id }, [
											(0, vue_exports.createVNode)("td", { "data-label": "Code" }, [(0, vue_exports.createVNode)("span", {
												class: "adm-table__key",
												translate: "no"
											}, (0, vue_exports.toDisplayString)(c.code), 1)]),
											(0, vue_exports.createVNode)("td", { "data-label": "Art" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(c.kindLabel) + " ", 1), parameter(c) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 0,
												class: "adm-table__sub"
											}, (0, vue_exports.toDisplayString)(parameter(c)), 1)) : (0, vue_exports.createCommentVNode)("", true)]),
											(0, vue_exports.createVNode)("td", {
												"data-label": "Satz",
												class: "al-text"
											}, (0, vue_exports.toDisplayString)(c.text), 1),
											(0, vue_exports.createVNode)("td", {
												"data-label": "Seite",
												class: "num"
											}, (0, vue_exports.toDisplayString)(c.page ?? "–"), 1),
											(0, vue_exports.createVNode)("td", {
												"data-label": "Verwendet",
												class: "num",
												"data-phone": "hide"
											}, (0, vue_exports.toDisplayString)(c.uses === 0 ? "–" : (0, vue_exports.unref)(decimal)(c.uses, 0)), 1)
										]);
									}), 128))])
								])])) : (0, vue_exports.createCommentVNode)("", true)
							], 8, ["aria-labelledby"]);
						}), 128))
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Auflagen/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Auflagen/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-13f422ee"]]);
//#endregion
export { Index_default as default };
