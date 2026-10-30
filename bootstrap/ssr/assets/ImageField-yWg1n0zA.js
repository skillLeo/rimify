import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as FilePick_default } from "./FilePick-DkpmaeUr.js";
//#region resources/js/lib/xsrf.ts
/** Laravel's XSRF cookie, decoded, as the `X-XSRF-TOKEN` header a `fetch` to the shop is checked against. */
function xsrfToken() {
	const match = /(?:^|;\s*)XSRF-TOKEN=([^;]+)/.exec(typeof document === "undefined" ? "" : document.cookie);
	return match?.[1] ? decodeURIComponent(match[1]) : "";
}
//#endregion
//#region resources/js/Pages/Admin/Seiten/ImageField.vue?vue&type=script&setup=true&lang.ts
var ACCEPT = "image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif";
var ImageField_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ImageField",
	__ssrInlineRender: true,
	props: {
		id: {},
		label: {},
		help: { default: "" },
		pageId: {},
		src: {},
		alt: { default: "" },
		error: { default: "" },
		readonly: {
			type: Boolean,
			default: false
		}
	},
	emits: ["uploaded"],
	setup(__props, { emit: __emit }) {
		/**
		* An article's picture (his admin item 11, D-306): chosen with the panel's own file picker, uploaded at once
		* into our own storage (SeitenController::image), and shown as the article will show it. The picture's address
		* and size go into the block; its description is the block's own field below. Nothing reaches the shop until
		* the article is published.
		*/
		const props = __props;
		const emit = __emit;
		const file = (0, vue_exports.ref)(null);
		const busy = (0, vue_exports.ref)(false);
		const refusal = (0, vue_exports.ref)("");
		/** The name of the file chosen here: the stored one is a generated name nobody would recognise. */
		const uploadedName = (0, vue_exports.ref)("");
		/** The line beside the button: the file just chosen by its own name; a picture kept from before, as kept. */
		const current = (0, vue_exports.computed)(() => props.src === "" ? "" : uploadedName.value || "Bild ausgewählt");
		(0, vue_exports.watch)(file, (chosen) => {
			if (chosen !== null) upload(chosen);
		});
		let pending = null;
		let gone = false;
		(0, vue_exports.onBeforeUnmount)(() => {
			gone = true;
			pending?.abort();
		});
		/** Why an upload was refused, where the answer is not the field's own validation (SEI-27). */
		function failure(status) {
			if (status === 419 || status === 401) return "Deine Anmeldung ist abgelaufen. Lade die Seite neu und wähl das Bild dann noch einmal.";
			if (status === 403) return "Du darfst diesen Artikel nicht mehr bearbeiten. Frag jemanden mit dem Recht dazu.";
			if (status === 413) return "Das Bild ist größer als 10 MB. Verkleinere es bitte und wähl es noch einmal.";
			if (status === 429) return "Das waren viele Bilder in kurzer Zeit. Warte eine Minute und wähl es dann noch einmal.";
			return "Das Bild wurde nicht hochgeladen. Versuch es bitte noch einmal.";
		}
		async function upload(chosen) {
			if (busy.value) return;
			busy.value = true;
			refusal.value = "";
			const body = new FormData();
			body.append("image", chosen);
			pending = new AbortController();
			try {
				const response = await fetch(`/admin/seiten/${props.pageId}/bild`, {
					method: "POST",
					body,
					credentials: "same-origin",
					headers: {
						Accept: "application/json",
						"X-Requested-With": "XMLHttpRequest",
						"X-XSRF-TOKEN": xsrfToken()
					},
					signal: pending.signal
				});
				const answer = await response.json().catch(() => ({}));
				if (gone) return;
				if (response.ok && typeof answer.src === "string") {
					uploadedName.value = chosen.name;
					emit("uploaded", {
						src: answer.src,
						width: typeof answer.width === "number" ? answer.width : null,
						height: typeof answer.height === "number" ? answer.height : null
					});
				} else refusal.value = answer.errors?.image?.[0] ?? failure(response.status);
			} catch {
				if (!gone) refusal.value = "Das Bild wurde nicht hochgeladen, die Verbindung ist abgebrochen. Versuch es bitte noch einmal.";
			} finally {
				pending = null;
				if (!gone) {
					busy.value = false;
					file.value = null;
				}
			}
		}
		function refused(name) {
			refusal.value = `„${name}“ kann der Artikel nicht zeigen. Wähl ein Bild im Format JPG, PNG, WebP oder AVIF.`;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "form-field pg-image" }, _attrs))} data-v-3c516c36><span${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-label`)} class="form-field__label" data-v-3c516c36>${(0, server_renderer_exports.ssrInterpolate)(__props.label)}</span>`);
			if (__props.src) _push(`<figure class="pg-image__frame" data-v-3c516c36><img${(0, server_renderer_exports.ssrRenderAttr)("src", __props.src)}${(0, server_renderer_exports.ssrRenderAttr)("alt", __props.alt)} class="pg-image__img" data-v-3c516c36></figure>`);
			else _push(`<!---->`);
			if (!__props.readonly) _push((0, server_renderer_exports.ssrRenderComponent)(FilePick_default, {
				id: __props.id,
				modelValue: file.value,
				"onUpdate:modelValue": ($event) => file.value = $event,
				accept: ACCEPT,
				label: busy.value ? "Wird hochgeladen …" : __props.src ? "Anderes Bild auswählen" : "Bild auswählen",
				current: current.value,
				disabled: busy.value,
				invalid: Boolean(__props.error || refusal.value),
				describedby: `${__props.id}-label ${__props.id}-help ${__props.id}-err`,
				onRefused: refused
			}, null, _parent));
			else if (!__props.src) _push(`<p class="pg-image__empty" data-v-3c516c36>Noch kein Bild.</p>`);
			else _push(`<!---->`);
			if (__props.help) _push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-help`)} class="form-field__help" data-v-3c516c36>${(0, server_renderer_exports.ssrInterpolate)(__props.help)}</p>`);
			else _push(`<!---->`);
			_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-err`)} class="form-field__error" role="status" data-v-3c516c36>${(0, server_renderer_exports.ssrInterpolate)(refusal.value || __props.error)}</p></div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Seiten/ImageField.vue
var ImageField_exports = /* @__PURE__ */ __exportAll({ default: () => ImageField_default });
var _sfc_setup = ImageField_vue_vue_type_script_setup_true_lang_default.setup;
ImageField_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Seiten/ImageField.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var ImageField_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ImageField_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-3c516c36"]]);
//#endregion
export { ImageField_exports as n, ImageField_default as t };
