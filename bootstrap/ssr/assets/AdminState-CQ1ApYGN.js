import { a as link_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as AdminIcon_default } from "./AdminIcon-CUJcjiDR.js";
import { t as decimal } from "./format-B7xaqJ38.js";
//#region resources/js/Components/Admin/AdminState.vue?vue&type=script&setup=true&lang.ts
var AdminState_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminState",
	__ssrInlineRender: true,
	props: {
		kind: {},
		text: { default: void 0 },
		total: { default: 0 },
		module: { default: void 0 }
	},
	emits: ["reset", "retry"],
	setup(__props, { emit: __emit }) {
		/**
		* The four states that are not "here is your data" (admin-shell.md §9), rendered where the content
		* would be: left-aligned on the page's reading line, never a centred poster in an empty warehouse.
		*
		*   empty     — nothing exists yet. The page says what will appear and who puts it there, and
		*               repeats its primary action in the slot.
		*   filtered  — things exist, the filters exclude them all. Never the same words as `empty`: telling
		*               somebody with 12.000 orders that there are none is the most common panel bug.
		*   error     — the list did not load. A load failure is never a toast; it stays until it is fixed.
		*   forbidden — a pasted link or a role changed mid-session. The rail never leads here.
		*/
		const props = __props;
		const icon = (0, vue_exports.computed)(() => ({
			empty: null,
			filtered: "filter",
			error: "warning",
			forbidden: "lock"
		})[props.kind]);
		const heading = (0, vue_exports.computed)(() => ({
			empty: "Hier ist noch nichts.",
			filtered: "Kein Treffer für diese Filter.",
			error: "Die Liste konnte nicht geladen werden.",
			forbidden: "Dafür fehlt dir die Berechtigung."
		})[props.kind]);
		const sentence = (0, vue_exports.computed)(() => {
			switch (props.kind) {
				case "empty": return props.text ?? null;
				case "filtered": return `${decimal(props.total, 0)} ${props.total === 1 ? "Eintrag" : "Einträge"} insgesamt — die Filter schließen ${props.total === 1 ? "ihn" : "sie alle"} aus.`;
				case "error": return "Der Server hat nicht geantwortet.";
				case "forbidden": return props.module ? `Diese Seite gehört zum Bereich „${props.module}“. Bitte wende dich an eine Person, die Rollen und Rechte verwaltet.` : "Bitte wende dich an eine Person, die Rollen und Rechte verwaltet.";
			}
			return null;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: ["adm-state", `adm-state--${__props.kind}`],
				role: __props.kind === "error" ? "alert" : void 0
			}, _attrs))}>`);
			if (icon.value) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				class: "adm-state__icon",
				name: icon.value,
				size: 20
			}, null, _parent));
			else _push(`<!---->`);
			_push(`<h2 class="adm-state__heading">${(0, server_renderer_exports.ssrInterpolate)(heading.value)}</h2>`);
			if (sentence.value) _push(`<p class="adm-state__text">${(0, server_renderer_exports.ssrInterpolate)(sentence.value)}</p>`);
			else _push(`<!---->`);
			if (__props.kind === "filtered") _push(`<div class="adm-state__action"><button class="btn btn--secondary" type="button">Filter zurücksetzen</button></div>`);
			else if (__props.kind === "error") _push(`<div class="adm-state__action"><button class="btn btn--secondary" type="button">Erneut laden</button></div>`);
			else if (__props.kind === "forbidden") {
				_push(`<div class="adm-state__action">`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/admin",
					class: "btn btn--secondary"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Zur Übersicht`);
						else return [(0, vue_exports.createTextVNode)("Zur Übersicht")];
					}),
					_: 1
				}, _parent));
				_push(`</div>`);
			} else if (_ctx.$slots.default) {
				_push(`<div class="adm-state__action">`);
				(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent);
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`</section>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminState.vue
var _sfc_setup = AdminState_vue_vue_type_script_setup_true_lang_default.setup;
AdminState_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminState.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var AdminState_default = AdminState_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { AdminState_default as t };
