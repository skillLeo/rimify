import { t as AppLayout_default } from "./AppLayout-jJytylAs.js";
import { a as link_default, i as head_default, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { u as contactHref } from "./useShopFeedback-KvE3Q5Fp.js";
import { n as formatNumber } from "./num-Br8qlecZ.js";
import { t as ConditionGroups_default } from "./ConditionGroups-DPIzVLfb.js";
import { a as entryLine, i as entryBySize, r as PAPERS_EXEMPT } from "./papers-B4aUsj_q.js";
//#region resources/js/Pages/CheckErgebnis/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		token: {},
		result: {}
	},
	setup(__props) {
		/**
		* The shareable check result.
		*
		* Addressed by a token rather than a query string, because the point of this page is that it can
		* be sent to a workshop, printed, and still say the same thing next week. It opens cold, from a
		* link someone else sent, so the H1 states the answer in words rather than leaving it to a badge.
		*
		* Four states plus an expired link. `UNKNOWN` is a neutral answer and never dressed as a refusal
		* (R-07): it gets the neutral tag and its own explanation.
		*
		* One page for every width.
		*/
		const props = __props;
		const page = usePage();
		const askHref = (0, vue_exports.computed)(() => contactHref({
			subject: `Anfrage zu meinem RIMIFY-Check (Ergebnis ${props.token})`,
			from: page.url
		}));
		const copy = (0, vue_exports.computed)(() => {
			if (props.result?.status === "CONDITIONAL" && props.result.notesOnly === true) return {
				tag: "tag--ok",
				label: "Freigegeben",
				title: "Diese Felge ist für das Fahrzeug freigegeben.",
				body: "Das Gutachten deckt die geprüfte Kombination ab und nennt dazu nur Hinweise – nichts, was du tun musst. Jeder Hinweis steht im Wortlaut auf der Produktseite der Felge.",
				primary: {
					href: "/felgen",
					label: "Passende Felgen anzeigen"
				}
			};
			switch (props.result?.status) {
				case "PERMITTED": return {
					tag: "tag--ok",
					label: "Freigegeben",
					title: "Diese Felge ist für das Fahrzeug freigegeben.",
					body: "Das Gutachten deckt die geprüfte Kombination ab. Gutachten-Nummer und Eintragungspflicht stehen auf der Produktseite der Felge.",
					primary: {
						href: "/felgen",
						label: "Passende Felgen anzeigen"
					}
				};
				case "CONDITIONAL": return {
					tag: "tag--warn",
					label: "Freigegeben mit Auflagen",
					title: "Diese Felge ist mit Auflagen freigegeben.",
					body: "Das Gutachten lässt die Kombination nur unter Bedingungen zu. Jede Auflage steht im Wortlaut auf der Produktseite der Felge – lies sie vor dem Kauf.",
					primary: {
						href: "/felgen",
						label: "Passende Felgen anzeigen"
					}
				};
				case "NOT_PERMITTED": return {
					tag: "tag--danger",
					label: "Nicht freigegeben",
					title: "Diese Felge ist für das Fahrzeug nicht freigegeben.",
					body: "Das Gutachten lässt diese Kombination für das Fahrzeug nicht zu. Die Liste zeigt dir Felgen, deren Gutachten dein Fahrzeug abdeckt.",
					primary: {
						href: "/felgen",
						label: "Passende Felgen anzeigen"
					}
				};
				case "UNKNOWN": return {
					tag: "tag--unknown",
					label: "Noch nicht bestätigt",
					title: "Für diese Kombination können wir die Freigabe nicht bestätigen.",
					body: props.result?.wheelLabel ? "Die Felge ist freigegeben, die Reifen dazu können wir aber nicht bestätigen. Das heißt nicht, dass sie unzulässig sind – nur, dass wir nicht belegen können, dass sie zulässig sind." : "Für diese Kombination liegt uns kein Gutachten vor. Das heißt nicht, dass die Felge unzulässig ist – nur, dass wir nicht belegen können, dass sie zulässig ist.",
					primary: {
						href: askHref.value,
						label: "Bei uns nachfragen"
					}
				};
				default: return {
					tag: null,
					label: null,
					title: "Dieses Ergebnis ist nicht mehr verfügbar.",
					body: "Ergebnis-Links verfallen, wenn sich die zugrunde liegende Freigabe geändert hat. Führe die Prüfung erneut durch, damit du den aktuellen Stand erhältst.",
					primary: {
						href: "/rimify-check",
						label: "Neue Prüfung starten"
					}
				};
			}
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Ergebnis" }, null, _parent));
			_push(`<section class="section" data-v-d5eb335b><div class="wrap res" data-v-d5eb335b><h1 class="t-h1" data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)(copy.value.title)}</h1>`);
			if (copy.value.tag) _push(`<p class="res__verdict" data-v-d5eb335b><span class="${(0, server_renderer_exports.ssrRenderClass)([copy.value.tag, "tag"])}" data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)(copy.value.label)}</span></p>`);
			else _push(`<!---->`);
			_push(`<p class="t-body res__body" data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)(copy.value.body)}</p>`);
			if (__props.result) {
				_push(`<div class="res__detail" data-v-d5eb335b><dl class="res__facts" data-v-d5eb335b>`);
				if (__props.result.vehicle) _push(`<div data-v-d5eb335b><dt data-v-d5eb335b>Fahrzeug</dt><dd data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)(__props.result.vehicle)}</dd></div>`);
				else _push(`<!---->`);
				if (__props.result.wheel) {
					_push(`<div data-v-d5eb335b><dt data-v-d5eb335b>Felge</dt><dd data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)(__props.result.wheel)}`);
					if (__props.result.wheelLabel) _push(`<!--[--> – ${(0, server_renderer_exports.ssrInterpolate)(__props.result.wheelLabel)}<!--]-->`);
					else _push(`<!---->`);
					_push(`</dd></div>`);
				} else _push(`<!---->`);
				if (__props.result.tyre) _push(`<div data-v-d5eb335b><dt data-v-d5eb335b>Reifen</dt><dd data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)(__props.result.tyre.statusLabel)}</dd></div>`);
				else _push(`<!---->`);
				if (__props.result.document) {
					_push(`<div data-v-d5eb335b><dt data-v-d5eb335b>Gutachten</dt><dd data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)(__props.result.document.label)}, Fassung ${(0, server_renderer_exports.ssrInterpolate)(__props.result.document.revision)}`);
					if (__props.result.document.issuer) _push(`<!--[--> (${(0, server_renderer_exports.ssrInterpolate)(__props.result.document.issuer)})<!--]-->`);
					else _push(`<!---->`);
					if (__props.result.document.page) _push(`<!--[-->, Seite ${(0, server_renderer_exports.ssrInterpolate)(__props.result.document.page)}<!--]-->`);
					else _push(`<!---->`);
					if (__props.result.document.example) _push(`<!--[--> · <span class="tag tag--unknown" data-v-d5eb335b>Beispieldaten</span><!--]-->`);
					else _push(`<!---->`);
					_push(`</dd></div>`);
				} else _push(`<!---->`);
				if (__props.result.papers) _push(`<div data-v-d5eb335b><dt data-v-d5eb335b>Deine Angaben</dt><dd data-v-d5eb335b>8.1 ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatNumber)(__props.result.papers.axleFrontKg))} kg · 8.2 ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatNumber)(__props.result.papers.axleRearKg))} kg · T ${(0, server_renderer_exports.ssrInterpolate)(__props.result.papers.topSpeedKmh)} km/h</dd></div>`);
				else _push(`<!---->`);
				_push(`<!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.result.build ?? [], (line) => {
					_push(`<div data-v-d5eb335b><dt data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)(line.fact)}</dt><dd data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)(line.value)} – ${(0, server_renderer_exports.ssrInterpolate)(line.source)}</dd></div>`);
				});
				_push(`<!--]--></dl>`);
				if (__props.result.reason && __props.result.reason !== __props.result.tyre?.summary) _push(`<p class="res__reason" data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)(__props.result.reason)}</p>`);
				else _push(`<!---->`);
				if (__props.result.tyre) {
					_push(`<section class="res__block" aria-labelledby="res-tyre-h" data-v-d5eb335b><h2 id="res-tyre-h" class="h4" data-v-d5eb335b>Reifen</h2>`);
					if (__props.result.tyre.summary) _push(`<p class="res__summary" data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)(__props.result.tyre.summary)}</p>`);
					else _push(`<!---->`);
					if (__props.result.tyre.basis) _push(`<p class="res__note" data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)(__props.result.tyre.basis)}</p>`);
					else _push(`<!---->`);
					if (__props.result.tyre.stricterByPapers) _push(`<p class="res__note" data-v-d5eb335b>Deine Angaben aus den Fahrzeugpapieren haben die Antwort strenger gemacht.</p>`);
					else _push(`<!---->`);
					if (__props.result.tyre.lines.length) {
						_push(`<ol class="res__sum" aria-label="So haben wir gerechnet" data-v-d5eb335b><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.result.tyre.lines, (line) => {
							_push(`<li data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)(line)}</li>`);
						});
						_push(`<!--]--></ol>`);
					} else _push(`<!---->`);
					_push(`</section>`);
				} else _push(`<!---->`);
				if (__props.result.requiresEntry || __props.result.papersExempt || __props.result.conditions.length) {
					_push(`<section class="res__block" aria-labelledby="res-cond-h" data-v-d5eb335b><h2 id="res-cond-h" class="h4" data-v-d5eb335b>Auflagen</h2>`);
					if ((0, vue_exports.unref)(entryBySize)(__props.result.conditionGroups?.sizes, __props.result.papersExempt === true)) _push(`<p class="res__note" data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(entryBySize)(__props.result.conditionGroups?.sizes, __props.result.papersExempt === true))}</p>`);
					else if (__props.result.requiresEntry) {
						_push(`<p class="res__note" data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(entryLine)(true, __props.result.papersExempt === true))}`);
						if (__props.result.entryNote) _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(__props.result.entryNote)}<!--]-->`);
						else _push(`<!---->`);
						_push(`</p>`);
					} else _push(`<!---->`);
					if (__props.result.papersExempt) _push(`<p class="res__note" data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(PAPERS_EXEMPT))}</p>`);
					else _push(`<!---->`);
					if (__props.result.conditionGroups && __props.result.conditions.length) _push((0, server_renderer_exports.ssrRenderComponent)(ConditionGroups_default, {
						class: "res__groups",
						groups: __props.result.conditionGroups
					}, null, _parent));
					else if (__props.result.conditions.length) {
						_push(`<ul class="res__sum" data-v-d5eb335b><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.result.conditions, (condition) => {
							_push(`<li data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
						});
						_push(`<!--]--></ul>`);
					} else _push(`<!---->`);
					_push(`</section>`);
				} else _push(`<!---->`);
				if (__props.result.front.length) {
					_push(`<p class="res__note" data-v-d5eb335b> Zulässige Reifengrößen: ${(0, server_renderer_exports.ssrInterpolate)(__props.result.front.join(" · "))}`);
					if (__props.result.rear.length && __props.result.rear.join() !== __props.result.front.join()) _push(`<!--[--> · hinten ${(0, server_renderer_exports.ssrInterpolate)(__props.result.rear.join(" · "))}<!--]-->`);
					else _push(`<!---->`);
					_push(`</p>`);
				} else _push(`<!---->`);
				if (__props.result.documentToday) _push(`<p class="notice notice--warn res__today" data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)(__props.result.documentToday)}</p>`);
				else _push(`<!---->`);
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`<div class="res__actions" data-v-d5eb335b>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: copy.value.primary.href,
				class: "btn btn--primary"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(copy.value.primary.label)}`);
					else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(copy.value.primary.label), 1)];
				}),
				_: 1
			}, _parent));
			if (__props.result !== null) _push(`<button class="btn btn--secondary" type="button" data-v-d5eb335b>Drucken</button>`);
			else _push(`<!---->`);
			if (__props.result !== null) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/rimify-check",
				class: "btn btn--secondary"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(` Neue Prüfung starten `);
					else return [(0, vue_exports.createTextVNode)(" Neue Prüfung starten ")];
				}),
				_: 1
			}, _parent));
			else _push(`<!---->`);
			_push(`</div><dl class="res__meta" data-v-d5eb335b><div data-v-d5eb335b><dt class="micro" data-v-d5eb335b>Ergebnis-Nummer</dt><dd class="data" data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)(__props.token)}</dd></div>`);
			if (__props.result?.issuedAt) _push(`<div data-v-d5eb335b><dt class="micro" data-v-d5eb335b>Geprüft am</dt><dd class="data" data-v-d5eb335b>${(0, server_renderer_exports.ssrInterpolate)(__props.result.issuedAt)}</dd></div>`);
			else _push(`<!---->`);
			_push(`</dl></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/CheckErgebnis/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/CheckErgebnis/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-d5eb335b"]]);
//#endregion
export { Index_default as default };
