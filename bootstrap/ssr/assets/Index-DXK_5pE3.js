import { t as AppLayout_default } from "./AppLayout-qhvrT7Ox.js";
import { a as link_default, i as head_default, o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as Icon_default } from "./Icon-DUS6sqAV.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Pages/Bewertung/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		number: {},
		lines: {},
		action: {}
	},
	setup(__props) {
		/**
		* `/bewertung/{number}` — the page the review invitation links to (the client's #19, D-103). The rims of one delivered
		* order, each rated once: five stars as a radio group (arrow keys move, each star names its count), and a sentence if
		* the buyer likes. A rim already rated shows its stars and stays as it is. The form goes back to the same signed
		* address, so the signature that proves the purchase travels with it.
		*/
		const props = __props;
		const open = (0, vue_exports.computed)(() => props.lines.filter((l) => l.review === null));
		const form = useForm({ reviews: Object.fromEntries(props.lines.filter((l) => l.review === null).map((l) => [l.line, {
			rating: 0,
			body: ""
		}])) });
		const ready = (0, vue_exports.computed)(() => Object.values(form.reviews).some((r) => r.rating > 0));
		function starsLabel(n) {
			return n === 1 ? "1 Stern" : `${n} Sterne`;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Felgen bewerten" }, null, _parent));
			_push(`<section class="section-dense" data-v-4a5f1c5c><div class="wrap bw" data-v-4a5f1c5c><h1 class="t-h1" data-v-4a5f1c5c>Wie zufrieden bist du mit deinen Felgen?</h1><p class="t-lead bw__lead" data-v-4a5f1c5c> Bestellung <span class="num" translate="no" data-v-4a5f1c5c>${(0, server_renderer_exports.ssrInterpolate)(__props.number)}</span>. Ein paar Sterne genügen, ein Satz dazu ist freiwillig. </p>`);
			if (open.value.length > 0) {
				_push(`<form class="bw__form" novalidate data-v-4a5f1c5c><ul class="bw__lines" data-v-4a5f1c5c><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.lines, (line) => {
					_push(`<li class="card bw__line" data-v-4a5f1c5c><p class="bw__label" data-v-4a5f1c5c>${(0, server_renderer_exports.ssrInterpolate)(line.label)}</p><p class="t-small quiet" data-v-4a5f1c5c>${(0, server_renderer_exports.ssrInterpolate)(line.quantity === 1 ? "1 Stück" : `${line.quantity} Stück`)}</p>`);
					if (line.review) {
						_push(`<!--[--><p class="bw__given"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Du hast ${starsLabel(line.review.rating)} gegeben`)} data-v-4a5f1c5c><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(5, (n) => {
							_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
								key: n,
								name: "star",
								size: 24,
								class: n <= line.review.rating ? "bw__on" : "bw__off"
							}, null, _parent));
						});
						_push(`<!--]--></p>`);
						if (line.review.body) _push(`<p class="bw__body" data-v-4a5f1c5c>„${(0, server_renderer_exports.ssrInterpolate)(line.review.body)}“</p>`);
						else _push(`<!---->`);
						_push(`<p class="t-small quiet" data-v-4a5f1c5c>Danke, diese Felge hast du schon bewertet.</p><!--]-->`);
					} else if ((0, vue_exports.unref)(form).reviews[line.line]) {
						_push(`<!--[--><fieldset class="bw__stars" data-v-4a5f1c5c><legend class="visually-hidden" data-v-4a5f1c5c>Sterne für ${(0, server_renderer_exports.ssrInterpolate)(line.label)}</legend><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(5, (n) => {
							_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "bw__on": n <= (0, vue_exports.unref)(form).reviews[line.line].rating }, "bw__star"])}" data-v-4a5f1c5c><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).reviews[line.line].rating, n)) ? " checked" : ""} type="radio" class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("name", `bw-${line.line}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", n)} data-v-4a5f1c5c>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
								name: "star",
								size: 24
							}, null, _parent));
							_push(`<span class="visually-hidden" data-v-4a5f1c5c>${(0, server_renderer_exports.ssrInterpolate)(starsLabel(n))}</span></label>`);
						});
						_push(`<!--]--></fieldset><div class="form-field bw__field" data-v-4a5f1c5c><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `bw-text-${line.line}`)} data-v-4a5f1c5c>Was möchtest du anderen dazu sagen? (freiwillig)</label><textarea${(0, server_renderer_exports.ssrRenderAttr)("id", `bw-text-${line.line}`)} class="input bw__area" rows="3" maxlength="1000" data-v-4a5f1c5c>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).reviews[line.line].body)}</textarea></div><!--]-->`);
					} else _push(`<!---->`);
					_push(`</li>`);
				});
				_push(`<!--]--></ul><p class="t-small quiet bw__note" data-v-4a5f1c5c> Deine Bewertung erscheint auf der Seite der Felge – ohne deinen Namen, als Bewertung eines geprüften Kaufs. </p>`);
				if ((0, vue_exports.unref)(form).errors.reviews) _push(`<p class="form-field__error" role="alert" data-v-4a5f1c5c>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.reviews)}</p>`);
				else _push(`<!---->`);
				_push(`<button class="btn btn--primary btn--lg bw__go" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!ready.value || (0, vue_exports.unref)(form).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)} data-v-4a5f1c5c> Bewertung abschicken </button></form>`);
			} else {
				_push(`<div class="card bw__done" data-v-4a5f1c5c><p class="t-body" data-v-4a5f1c5c>Danke! Du hast alle Felgen dieser Bestellung bewertet.</p><ul class="bw__lines" data-v-4a5f1c5c><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.lines, (line) => {
					_push(`<li class="bw__done-line" data-v-4a5f1c5c><span data-v-4a5f1c5c>${(0, server_renderer_exports.ssrInterpolate)(line.label)}</span>`);
					if (line.review) {
						_push(`<span class="bw__given"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", starsLabel(line.review.rating))} data-v-4a5f1c5c><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(5, (n) => {
							_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
								key: n,
								name: "star",
								size: 20,
								class: n <= line.review.rating ? "bw__on" : "bw__off"
							}, null, _parent));
						});
						_push(`<!--]--></span>`);
					} else _push(`<!---->`);
					_push(`</li>`);
				});
				_push(`<!--]--></ul>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen",
					class: "btn btn--secondary"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Zu den Felgen`);
						else return [(0, vue_exports.createTextVNode)("Zu den Felgen")];
					}),
					_: 1
				}, _parent));
				_push(`</div>`);
			}
			_push(`</div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Bewertung/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Bewertung/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-4a5f1c5c"]]);
//#endregion
export { Index_default as default };
