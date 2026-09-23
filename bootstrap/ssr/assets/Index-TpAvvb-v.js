import { c as vue_exports, n as head_default, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { r as useShared } from "./useShared-CY71KcPZ.js";
import { t as Icon_default } from "./Icon-Cd7fU8zT.js";
import { t as AppLayout_default } from "./AppLayout-CIg_X6Ij.js";
import { t as mailtoHref } from "./mailto-LEYUvS8P.js";
import { t as Wheel_default } from "./Wheel-BZs9Wi57.js";
//#region resources/js/Pages/Fehler/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		status: { default: 404 },
		isMobile: {
			type: Boolean,
			default: false
		},
		retryAfter: { default: null },
		failedPath: { default: null }
	},
	setup(__props) {
		/**
		* Every failure the shop has a designed answer for, as one page keyed by status.
		*
		* Rendered by App\Services\Storefront\ErrorPage inside the storefront frame, so the header, the
		* basket and the chosen vehicle all survive a dead link. A visitor who followed a broken link to a
		* wheel still wants a wheel, and a page that only apologises wastes the visit.
		*
		* The shape is the same for every status, because the questions are the same: what happened, what
		* that means for you, and how you get on from here. The third part is not optional — a failure
		* always offers THREE ways forward (R-09), never a cleared form and never a lone "back".
		*
		* On what these sentences may claim: a 500 really is written to the log, and nothing and nobody is
		* notified of it — there is no error reporting service in this application — so the page asks for a
		* message instead of promising that somebody is already looking. The 419 says the session has been
		* renewed because ErrorPage writes a fresh XSRF-TOKEN beside the response; without that the second
		* attempt would fail exactly like the first, and the sentence would be a lie.
		*
		* A release window is NOT rendered here: it is resources/views/errors/503.blade.php, which needs
		* neither this bundle nor the database. One page for every width.
		*/
		const props = __props;
		const shared = useShared();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle ?? null);
		const contact = (0, vue_exports.computed)(() => shared.value.contact ?? null);
		const mailHref = (0, vue_exports.computed)(() => {
			const details = contact.value;
			if (details === null) return "/kontakt";
			return mailtoHref(details.email, {
				subject: `RIMIFY – Fehler ${props.status}`,
				body: `Fehler: ${props.status}\nSeite: ${props.failedPath ?? ""}\n\nWas ich tun wollte:\n\n`
			});
		});
		/** Where the vehicle already chosen leads, and where its absence leads instead. */
		const felgen = (tone) => vehicle.value !== null ? {
			key: "felgen",
			label: "Passende Felgen anzeigen",
			href: "/felgen",
			tone
		} : {
			key: "felgen",
			label: "Fahrzeug wählen",
			href: "/felgen-suchen",
			tone
		};
		const home = (tone) => ({
			key: "home",
			label: "Zur Startseite",
			href: "/",
			tone
		});
		const faq = (tone) => ({
			key: "faq",
			label: "Häufige Fragen lesen",
			href: "/faq",
			tone
		});
		const basket = (tone) => ({
			key: "basket",
			label: "Zum Warenkorb",
			href: "/warenkorb",
			tone
		});
		const signIn = (tone) => ({
			key: "anmelden",
			label: "Mit einem anderen Konto anmelden",
			href: "/admin/anmelden",
			tone
		});
		const reload = (tone) => ({
			key: "reload",
			label: "Diese Seite neu laden",
			href: "",
			tone,
			plain: true
		});
		const ask = (tone) => ({
			key: "kontakt",
			label: contact.value === null ? "Zur Kontaktseite" : "Per E-Mail nachfragen",
			href: mailHref.value,
			tone,
			plain: contact.value !== null
		});
		/**
		* Only ever the figure the server named, phrased as a wait and never as a promise.
		*
		* Declined, because the commonest wait of all is the one the throttler names: `throttle:60,1` sends
		* `Retry-After: 60`, and "In etwa 1 Minuten kannst du es noch einmal versuchen" is the sentence a
		* German customer would then have read.
		*/
		const wait = (0, vue_exports.computed)(() => {
			const seconds = props.retryAfter;
			if (typeof seconds !== "number" || seconds <= 0) return null;
			if (seconds < 60) return seconds === 1 ? "einer Sekunde" : `${seconds} Sekunden`;
			const minutes = Math.ceil(seconds / 60);
			return minutes === 1 ? "einer Minute" : `${minutes} Minuten`;
		});
		const view = (0, vue_exports.computed)(() => {
			if (props.status === 403) return {
				icon: "lock",
				title: "Dafür fehlt dir die Berechtigung.",
				lead: "Am Link liegt es nicht: Die Seite gibt es, dein Konto darf sie nur nicht öffnen.",
				detail: "Wenn du in diesem Bereich arbeiten sollst, lass dein Konto dafür freischalten.",
				routes: [
					signIn("primary"),
					home("secondary"),
					ask("ghost")
				]
			};
			if (props.status === 419) return {
				icon: "clock",
				title: "Deine Sitzung ist abgelaufen.",
				lead: "Das Formular stand zu lange offen, deshalb hat der Server es abgelehnt – so kann niemand sonst in deinem Namen etwas abschicken.",
				detail: "Gespeichert wurde nichts, bestellt hast du nichts. Wir haben deine Sitzung gerade erneuert: Geh im Browser einen Schritt zurück und schick das Formular noch einmal ab.",
				routes: [
					basket("primary"),
					felgen("secondary"),
					ask("ghost")
				]
			};
			if (props.status === 429) return {
				icon: "clock",
				title: "Zu viele Anfragen in kurzer Zeit.",
				lead: "Wir bremsen deine Anfragen gerade ab, damit die Fahrzeugsuche für alle schnell bleibt.",
				detail: wait.value === null ? "Warte einen Moment und versuche es dann noch einmal." : null,
				routes: [
					home("primary"),
					reload("secondary"),
					ask("ghost")
				]
			};
			if (props.status === 404) return {
				icon: "search",
				title: "Diese Seite haben wir nicht gefunden.",
				lead: "Der Link führt ins Leere – vielleicht wurde die Seite verschoben, oder diese Felge steht nicht mehr im Sortiment.",
				detail: "RIMIFY zeigt ausschließlich Felgen, für die ein gültiges Gutachten vorliegt. Sag uns dein Fahrzeug, dann zeigen wir dir genau diese.",
				routes: [
					felgen("primary"),
					home("secondary"),
					faq("ghost")
				]
			};
			if (props.status >= 500) return {
				icon: "warning",
				title: "Da ist etwas schiefgelaufen.",
				lead: "Nicht bei dir, sondern bei uns: Diese Seite konnte der Server nicht fertig ausliefern.",
				detail: "Der Fehler steht in unserem Protokoll. Benachrichtigt wird davon aber niemand automatisch – wenn du nicht weiterkommst, schreib uns kurz, dann sehen wir nach.",
				routes: [
					reload("primary"),
					felgen("secondary"),
					ask("ghost")
				]
			};
			return {
				icon: "info",
				title: "Diese Seite können wir gerade nicht anzeigen.",
				lead: "Der Server hat den Aufruf mit dem Code oben abgelehnt. Was genau dahintersteckt, wissen wir an dieser Stelle nicht – und raten wollen wir lieber nicht.",
				detail: "Sag uns kurz, was du vorhattest, dann sehen wir nach.",
				routes: [
					home("primary"),
					felgen("secondary"),
					ask("ghost")
				]
			};
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: view.value.title }, null, _parent));
			_push(`<section class="section err" data-v-fbdb2632><div class="wrap err__wrap" data-v-fbdb2632><div class="err__text" data-v-fbdb2632><p class="micro err__code" data-v-fbdb2632>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: view.value.icon,
				size: 20
			}, null, _parent));
			_push(`<span data-v-fbdb2632>Fehler <span class="tabular" translate="no" data-v-fbdb2632>${(0, server_renderer_exports.ssrInterpolate)(__props.status)}</span></span></p><h1 class="t-h1 err__title" data-v-fbdb2632>${(0, server_renderer_exports.ssrInterpolate)(view.value.title)}</h1><p class="err__lead" data-v-fbdb2632>${(0, server_renderer_exports.ssrInterpolate)(view.value.lead)}</p>`);
			if (wait.value) _push(`<p class="t-body err__detail" data-v-fbdb2632> In etwa <span translate="no" data-v-fbdb2632>${(0, server_renderer_exports.ssrInterpolate)(wait.value)}</span> kannst du es noch einmal versuchen. </p>`);
			else _push(`<!---->`);
			if (view.value.detail) _push(`<p class="t-body err__detail" data-v-fbdb2632>${(0, server_renderer_exports.ssrInterpolate)(view.value.detail)}</p>`);
			else _push(`<!---->`);
			if (vehicle.value) _push(`<p class="t-body err__detail" data-v-fbdb2632> Dein Fahrzeug bleibt gewählt: <span translate="no" data-v-fbdb2632>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</span>. </p>`);
			else _push(`<!---->`);
			_push(`<nav class="err__routes" aria-label="Wie es weitergeht" data-v-fbdb2632><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(view.value.routes, (route) => {
				_push(`<!--[-->`);
				if (route.plain) _push(`<a class="${(0, server_renderer_exports.ssrRenderClass)([`btn--${route.tone}`, "btn"])}"${(0, server_renderer_exports.ssrRenderAttr)("href", route.href)} data-v-fbdb2632>${(0, server_renderer_exports.ssrInterpolate)(route.label)}</a>`);
				else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					class: ["btn", `btn--${route.tone}`],
					href: route.href
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(route.label)}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(route.label), 1)];
					}),
					_: 2
				}, _parent));
				_push(`<!--]-->`);
			});
			_push(`<!--]--></nav>`);
			if (contact.value) _push(`<p class="t-small err__note" data-v-fbdb2632> Du erreichst uns unter <a class="err__mail"${(0, server_renderer_exports.ssrRenderAttr)("href", mailHref.value)} translate="no" data-v-fbdb2632>${(0, server_renderer_exports.ssrInterpolate)(contact.value.email)}</a>, <span translate="no" data-v-fbdb2632>${(0, server_renderer_exports.ssrInterpolate)(contact.value.hours)}</span>. </p>`);
			else _push(`<!---->`);
			_push(`</div><div class="err__art" aria-hidden="true" data-v-fbdb2632>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Wheel_default, {
				spokes: 7,
				finish: "graphite",
				size: 240
			}, null, _parent));
			_push(`</div></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Fehler/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Fehler/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-fbdb2632"]]);
//#endregion
export { Index_default as default };
