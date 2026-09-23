import { c as vue_exports, n as head_default, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { r as useShared } from "./useShared-B1ZdimaV.js";
import { t as AppLayout_default } from "./AppLayout-BVlt5D4s.js";
import { t as mailtoHref } from "./mailto-LEYUvS8P.js";
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
		const shared = useShared();
		const askHref = (0, vue_exports.computed)(() => mailtoHref(shared.value.contact.email, {
			subject: "Anfrage zu meinem RIMIFY-CHECK",
			body: `Meine Ergebnis-Nummer: ${props.token}\n\n`
		}));
		const copy = (0, vue_exports.computed)(() => {
			switch (props.result?.status) {
				case "PERMITTED": return {
					tag: "tag--ok",
					label: "Freigegeben",
					title: "Diese Felge ist für das Fahrzeug freigegeben.",
					body: "Das Gutachten deckt die geprüfte Kombination ab. Gutachten-Nummer und Eintragungspflicht stehen auf der Produktseite der Felge.",
					primary: {
						href: "/felgen",
						label: "Zur Felge"
					}
				};
				case "CONDITIONAL": return {
					tag: "tag--warn",
					label: "Freigegeben mit Auflagen",
					title: "Diese Felge ist mit Auflagen freigegeben.",
					body: "Das Gutachten lässt die Kombination nur unter Bedingungen zu. Jede Auflage steht im Wortlaut auf der Produktseite der Felge – lies sie vor dem Kauf.",
					primary: {
						href: "/felgen",
						label: "Auflagen auf der Produktseite lesen"
					}
				};
				case "NOT_PERMITTED": return {
					tag: "tag--danger",
					label: "Nicht freigegeben",
					title: "Diese Felge ist für das Fahrzeug nicht freigegeben.",
					body: "Für dieses Fahrzeug liegt keine Freigabe vor. Die Liste zeigt dir Felgen, deren Gutachten dein Fahrzeug abdeckt.",
					primary: {
						href: "/felgen",
						label: "Zur passenden Felge"
					}
				};
				case "UNKNOWN": return {
					tag: "tag--unknown",
					label: "Keine Angabe",
					title: "Zu dieser Kombination können wir nichts sagen.",
					body: "Für diese Kombination liegt uns kein Gutachten vor. Das heißt nicht, dass die Felge unzulässig ist – nur, dass wir es nicht belegen können.",
					primary: {
						href: askHref.value,
						label: "Per E-Mail nachfragen",
						mail: true
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
			_push(`<section class="section" data-v-c2c6444b><div class="wrap res" data-v-c2c6444b><h1 class="t-h1" data-v-c2c6444b>${(0, server_renderer_exports.ssrInterpolate)(copy.value.title)}</h1>`);
			if (copy.value.tag) _push(`<p class="res__verdict" data-v-c2c6444b><span class="${(0, server_renderer_exports.ssrRenderClass)([copy.value.tag, "tag"])}" data-v-c2c6444b>${(0, server_renderer_exports.ssrInterpolate)(copy.value.label)}</span></p>`);
			else _push(`<!---->`);
			_push(`<p class="t-body res__body" data-v-c2c6444b>${(0, server_renderer_exports.ssrInterpolate)(copy.value.body)}</p><div class="res__actions" data-v-c2c6444b>`);
			if (copy.value.primary.mail) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", copy.value.primary.href)} class="btn btn--primary" data-v-c2c6444b>${(0, server_renderer_exports.ssrInterpolate)(copy.value.primary.label)}</a>`);
			else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: copy.value.primary.href,
				class: "btn btn--primary"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(copy.value.primary.label)}`);
					else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(copy.value.primary.label), 1)];
				}),
				_: 1
			}, _parent));
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
			_push(`</div><dl class="res__meta" data-v-c2c6444b><dt class="micro" data-v-c2c6444b>Ergebnis-Nummer</dt><dd class="data" data-v-c2c6444b>${(0, server_renderer_exports.ssrInterpolate)(__props.token)}</dd></dl></div></section><!--]-->`);
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
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-c2c6444b"]]);
//#endregion
export { Index_default as default };
