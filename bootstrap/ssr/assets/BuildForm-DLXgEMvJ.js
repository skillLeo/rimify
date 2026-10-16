import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Components/Product/BuildForm.vue?vue&type=script&setup=true&lang.ts
var BuildForm_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "BuildForm",
	__ssrInlineRender: true,
	props: {
		vehicleId: {},
		build: {},
		missing: {}
	},
	setup(__props) {
		/**
		* Karosserieform and Antriebsart, where the vehicle data has neither (the operator's last prompt §1.1).
		*
		* Derived first, asked second. What an unambiguous word of the car's name gives (`Touring` → Kombi) stands as a
		* filled answer with „stimmt das?“ and one click to change it. What the answer waits for and nothing gives is
		* asked, in plain words with small silhouettes: „Für dieses Fahrzeug fehlt die Karosserieform. Trag sie ein und
		* wir prüfen sofort.“ — a choice is sent at once and the answer above is given again, with no button to find.
		* Kept with THIS car beside 8.1, 8.2 and T (`rmf_papiere`).
		*/
		const props = __props;
		const BODIES = [
			{
				value: "Limousine",
				label: "Limousine",
				path: "M2 19V14L4 12H13L18 7H30L35 12H45L46 13V19Z"
			},
			{
				value: "Kombi",
				label: "Kombi",
				path: "M2 19V14L4 12H13L18 7H44L46 10V19Z"
			},
			{
				value: "Schrägheck",
				label: "Schrägheck",
				path: "M4 19V14L6 12H14L19 7H32L41 11V19Z"
			},
			{
				value: "Coupe",
				label: "Coupé",
				path: "M2 19V14L4 12H15L21 8.5H27L40 12H45L46 13V19Z"
			},
			{
				value: "Cabrio",
				label: "Cabrio",
				path: "M2 19V14L4 12H45L46 13V19ZM15 12L18 8M31 12L32 10H38L39 12"
			},
			{
				value: "Roadster",
				label: "Roadster",
				path: "M5 19V14L7 12H42L43 13V19ZM18 12L21 8M27 12V8.5H30V12"
			},
			{
				value: "SUV",
				label: "SUV",
				path: "M2 19V11L4 9H12L17 4H42L45 8V19Z"
			},
			{
				value: "Van",
				label: "Van",
				path: "M2 19V10L9 3H45V19Z"
			}
		];
		const WHEELS = [12, 36];
		const DRIVES = [
			{
				value: "Vorderachse",
				label: "Frontantrieb"
			},
			{
				value: "Hinterachse",
				label: "Heckantrieb"
			},
			{
				value: "Allrad",
				label: "Allradantrieb"
			}
		];
		const NAMES = {
			bodyForm: "Karosserieform",
			driveAxle: "Antriebsart"
		};
		const asked = (0, vue_exports.computed)(() => ["bodyForm", "driveAxle"].filter((fact) => props.missing.includes(fact)));
		/** „Für dieses Fahrzeug fehlt die Karosserieform. Trag sie ein und wir prüfen sofort.“ */
		const lead = (0, vue_exports.computed)(() => asked.value.length === 2 ? "Für dieses Fahrzeug fehlen Karosserieform und Antriebsart. Trag sie ein und wir prüfen sofort." : `Für dieses Fahrzeug fehlt die ${NAMES[asked.value[0] ?? "bodyForm"]}. Trag sie ein und wir prüfen sofort.`);
		const given = (0, vue_exports.computed)(() => {
			const build = props.build;
			if (build === null) return [];
			return [[
				"bodyForm",
				build.bodyForm,
				build.bodySource,
				build.bodyWord
			], [
				"driveAxle",
				build.driveAxle,
				build.driveSource,
				build.driveWord
			]].filter(([fact, value, source]) => value !== null && (source === "name" || source === "customer") && !asked.value.includes(fact)).map(([fact, value, source, word]) => ({
				fact,
				value: labelOf(fact, value ?? ""),
				source,
				word
			}));
		});
		function labelOf(fact, value) {
			return (fact === "bodyForm" ? BODIES.find((b) => b.value === value)?.label : DRIVES.find((d) => d.value === value)?.label) ?? value;
		}
		const changing = (0, vue_exports.ref)(null);
		const sending = (0, vue_exports.ref)(null);
		const deleting = (0, vue_exports.ref)(false);
		const error = (0, vue_exports.ref)("");
		const shown = (0, vue_exports.computed)(() => changing.value === null ? asked.value : [changing.value]);
		function current(fact) {
			if (sending.value?.fact === fact) return sending.value.value;
			return fact === "bodyForm" ? props.build?.bodyForm ?? null : props.build?.driveAxle ?? null;
		}
		function isSending(fact, value) {
			return sending.value?.fact === fact && sending.value.value === value;
		}
		const ownAnswers = (0, vue_exports.computed)(() => given.value.some((line) => line.source === "customer"));
		return (_ctx, _push, _parent, _attrs) => {
			if (asked.value.length || given.value.length) {
				_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "bf" }, _attrs))} data-v-708cfb32>`);
				if (asked.value.length && changing.value === null) _push(`<p class="bf__lead" tabindex="-1" data-v-708cfb32>${(0, server_renderer_exports.ssrInterpolate)(lead.value)}</p>`);
				else _push(`<!---->`);
				if (changing.value === null) {
					_push(`<!--[--><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(given.value, (line) => {
						_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `bf-given-${line.fact}`)} class="bf__given" tabindex="-1" data-v-708cfb32><span data-v-708cfb32>${(0, server_renderer_exports.ssrInterpolate)(NAMES[line.fact])}: <strong data-v-708cfb32>${(0, server_renderer_exports.ssrInterpolate)(line.value)}</strong>`);
						if (line.source === "name") _push(`<!--[--> – erkannt an „${(0, server_renderer_exports.ssrInterpolate)(line.word)}“ im Fahrzeugnamen. Stimmt das?<!--]-->`);
						else _push(`<!--[--> – nach deiner Angabe.<!--]-->`);
						_push(`</span><button class="link" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sending.value !== null || deleting.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${NAMES[line.fact]} ändern`)} data-v-708cfb32>Ändern</button></p>`);
					});
					_push(`<!--]-->`);
					if (ownAnswers.value) _push(`<button class="link bf__forget" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sending.value !== null || deleting.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", deleting.value ? "true" : void 0)} data-v-708cfb32> Meine Angaben zu Karosserieform und Antriebsart löschen </button>`);
					else _push(`<!---->`);
					_push(`<!--]-->`);
				} else _push(`<!---->`);
				_push(`<!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(shown.value, (fact) => {
					_push(`<div${(0, server_renderer_exports.ssrRenderAttr)("id", `bf-${fact}`)} class="bf__group" role="group"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `bf-${fact}-h`)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", fact === "bodyForm" ? "bf-bodyForm-hint" : void 0)} data-v-708cfb32><p${(0, server_renderer_exports.ssrRenderAttr)("id", `bf-${fact}-h`)} class="bf__label" data-v-708cfb32>${(0, server_renderer_exports.ssrInterpolate)(NAMES[fact])}</p>`);
					if (fact === "bodyForm") _push(`<p id="bf-bodyForm-hint" class="bf__hint" data-v-708cfb32> Wähle die Form, die dein Auto hat. In der Zulassungsbescheinigung heißt auch manches Schrägheck „Kombilimousine“. </p>`);
					else _push(`<!---->`);
					_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([fact === "bodyForm" ? "bf__options--body" : "bf__options--drive", "bf__options"])}" data-v-708cfb32>`);
					if (fact === "bodyForm") {
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(BODIES, (body) => {
							_push(`<button class="bf__option" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", current(fact) === body.value ? "true" : "false")}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", isSending(fact, body.value) ? "true" : void 0)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sending.value !== null && !isSending(fact, body.value)) ? " disabled" : ""} data-v-708cfb32><span class="bf__art" aria-hidden="true" data-v-708cfb32>`);
							if (isSending(fact, body.value)) _push(`<span class="spinner bf__spinner" data-v-708cfb32></span>`);
							else {
								_push(`<svg class="bf__shape" viewBox="0 0 48 24" focusable="false" data-v-708cfb32><path${(0, server_renderer_exports.ssrRenderAttr)("d", body.path)} data-v-708cfb32></path><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(WHEELS, (x) => {
									_push(`<circle${(0, server_renderer_exports.ssrRenderAttr)("cx", x)} cy="19" r="3.5" data-v-708cfb32></circle>`);
								});
								_push(`<!--]--></svg>`);
							}
							_push(`</span><span class="bf__word" data-v-708cfb32>${(0, server_renderer_exports.ssrInterpolate)(body.label)}</span></button>`);
						});
						_push(`<!--]-->`);
					} else {
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(DRIVES, (drive) => {
							_push(`<button class="bf__option bf__option--text" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", current(fact) === drive.value ? "true" : "false")}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", isSending(fact, drive.value) ? "true" : void 0)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sending.value !== null && !isSending(fact, drive.value)) ? " disabled" : ""} data-v-708cfb32><span class="bf__word" data-v-708cfb32>${(0, server_renderer_exports.ssrInterpolate)(drive.label)}</span>`);
							if (isSending(fact, drive.value)) _push(`<span class="spinner bf__spinner" aria-hidden="true" data-v-708cfb32></span>`);
							else _push(`<!---->`);
							_push(`</button>`);
						});
						_push(`<!--]-->`);
					}
					_push(`</div></div>`);
				});
				_push(`<!--]-->`);
				if (changing.value !== null) _push(`<button class="link bf__cancel" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sending.value !== null) ? " disabled" : ""} data-v-708cfb32>Abbrechen</button>`);
				else _push(`<!---->`);
				if (error.value) _push(`<p class="form-field__error" role="alert" data-v-708cfb32>${(0, server_renderer_exports.ssrInterpolate)(error.value)}</p>`);
				else _push(`<!---->`);
				_push(`<p class="visually-hidden" role="status" data-v-708cfb32>${(0, server_renderer_exports.ssrInterpolate)(sending.value ? "Wird geprüft …" : "")}</p></div>`);
			} else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/BuildForm.vue
var _sfc_setup = BuildForm_vue_vue_type_script_setup_true_lang_default.setup;
BuildForm_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/BuildForm.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var BuildForm_default = /*#__PURE__*/ _plugin_vue_export_helper_default(BuildForm_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-708cfb32"]]);
//#endregion
export { BuildForm_default as t };
