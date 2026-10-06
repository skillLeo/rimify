import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-Bh3el5Y6.js";
import { c as router, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminConfirm_default } from "./AdminConfirm-CJZtnwyX.js";
import { n as formatNumber } from "./num-Br8qlecZ.js";
//#region resources/js/Pages/Admin/System/Zuruecksetzen.vue?vue&type=script&setup=true&lang.ts
var context = "Nur in der Testumgebung, nie im Live-Shop";
var Zuruecksetzen_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Zuruecksetzen",
	__ssrInlineRender: true,
	props: {
		levels: {},
		last: {},
		word: {},
		keepDays: {}
	},
	setup(__props) {
		/**
		* System › Testumgebung zurücksetzen (TestReset): the test environment back to an empty shop, at one of three levels,
		* and back again for seven days. What each level would take is counted before anything is done and shown for the one
		* chosen; the reset waits for the word to be typed (AdminConfirm), and the server asks for it again. That the team,
		* its roles, the settings and the Protokoll stay is said once, at the top, where it is read before the choice.
		*/
		const props = __props;
		/** „Shopdaten“ first: what „alle Daten entfernen“ means to whoever opens this page. */
		const level = (0, vue_exports.ref)("shop");
		const chosen = (0, vue_exports.computed)(() => props.levels.find((l) => l.key === level.value));
		/** Figure and noun on one line (R-10): „12 Felgen“, never „12 / Felgen“. */
		function counted(info) {
			return info.counts.map((c) => `${formatNumber(c.count)}\u00A0${c.label}`).join(", ");
		}
		const empty = (0, vue_exports.computed)(() => (chosen.value?.counts.length ?? 0) === 0);
		const confirming = (0, vue_exports.ref)(false);
		const resetting = (0, vue_exports.ref)(false);
		const confirmBody = (0, vue_exports.computed)(() => {
			const info = chosen.value;
			if (!info) return "";
			const stays = info.key === "demo" ? "Die übrigen Benutzer und Protokolleinträge bleiben, wie sie sind" : "Benutzer, Rollen, Einstellungen und das Protokoll bleiben";
			return `Das wird entfernt: ${counted(info)}. ${stays}, und du bleibst angemeldet. Du kannst das Zurücksetzen ${props.keepDays} Tage lang rückgängig machen.`;
		});
		/** Safari does not focus a clicked button: focused first, the dialog hands the focus back here on „Abbrechen“. */
		function ask(event) {
			(event.submitter ?? event.currentTarget)?.focus();
			if (!chosen.value?.blocked && !empty.value) confirming.value = true;
		}
		function reset() {
			if (resetting.value) return;
			resetting.value = true;
			router.post("/admin/system/zuruecksetzen", {
				level: level.value,
				confirmation: props.word
			}, {
				preserveScroll: true,
				onSuccess: () => confirming.value = false,
				onFinish: () => resetting.value = false
			});
		}
		const confirmingUndo = (0, vue_exports.ref)(false);
		const undoing = (0, vue_exports.ref)(false);
		const undoBody = (0, vue_exports.computed)(() => {
			const last = props.last;
			if (!last) return "";
			const back = last.level === "demo" ? "Die Demodaten kommen zurück" : `Felgen, Gutachten, Fahrzeuge, Bestellungen und die Bilder und PDFs dazu kommen zurück${last.level === "all" ? ", ebenso Seiten, FAQ und Menüs" : ""}`;
			const stays = last.level === "demo" ? "Die übrigen Benutzer und Protokolleinträge bleiben, wie sie sind." : "Benutzer, Rollen, Einstellungen und das Protokoll bleiben, wie sie jetzt sind.";
			return `${back}, wie sie am ${last.atText} waren. Was seitdem im Shop angelegt wurde, geht dabei verloren. ${stays}`;
		});
		function askUndo(event) {
			event.currentTarget.focus();
			confirmingUndo.value = true;
		}
		function undo() {
			if (undoing.value) return;
			undoing.value = true;
			router.post("/admin/system/zuruecksetzen/rueckgaengig", {}, {
				preserveScroll: true,
				onSuccess: () => confirmingUndo.value = false,
				onFinish: () => undoing.value = false
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Testumgebung zurücksetzen",
				context
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="adm-note zs-lead" data-v-2cc57731${_scopeId}> Benutzer, Rollen, Einstellungen und das Protokoll bleiben auf jeder Stufe erhalten – nur „Demodaten“ entfernt das Demo-Team und seine Einträge. Du bleibst angemeldet. </p>`);
						if (__props.last) {
							_push(`<section class="zs-last" aria-labelledby="zs-last-heading" data-v-2cc57731${_scopeId}><h2 id="zs-last-heading" class="adm-form__heading" data-v-2cc57731${_scopeId}>Letztes Zurücksetzen</h2><p class="adm-note" data-v-2cc57731${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.last.label)}, am ${(0, server_renderer_exports.ssrInterpolate)(__props.last.atText)} von ${(0, server_renderer_exports.ssrInterpolate)(__props.last.by)}. `);
							if (__props.last.undone) _push(`<!--[-->Am ${(0, server_renderer_exports.ssrInterpolate)(__props.last.undoneText)} rückgängig gemacht.<!--]-->`);
							else if (__props.last.undoable) _push(`<!--[-->Rückgängig machen ist bis ${(0, server_renderer_exports.ssrInterpolate)(__props.last.until)} möglich (${(0, server_renderer_exports.ssrInterpolate)(__props.last.remaining)}).<!--]-->`);
							else if (__props.last.reason) _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(__props.last.reason)}<!--]-->`);
							else _push(`<!---->`);
							_push(`</p>`);
							if (__props.last.undoable) _push(`<div data-v-2cc57731${_scopeId}><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", undoing.value ? "true" : void 0)} data-v-2cc57731${_scopeId}> Letztes Zurücksetzen rückgängig machen </button></div>`);
							else _push(`<!---->`);
							_push(`</section>`);
						} else _push(`<!---->`);
						_push(`<form class="adm-form zs-form" novalidate data-v-2cc57731${_scopeId}><fieldset class="zs-levels" data-v-2cc57731${_scopeId}><legend class="adm-form__heading zs-levels__legend" data-v-2cc57731${_scopeId}>Was soll weg?</legend><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.levels, (option) => {
							_push(`<label class="check zs-level" data-v-2cc57731${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(level.value, option.key)) ? " checked" : ""} type="radio" name="zs-level"${(0, server_renderer_exports.ssrRenderAttr)("value", option.key)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `zs-${option.key}-removes zs-${option.key}-keeps`)} data-v-2cc57731${_scopeId}><span class="zs-level__text" data-v-2cc57731${_scopeId}><span class="zs-level__name" data-v-2cc57731${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(option.label)}</span><span${(0, server_renderer_exports.ssrRenderAttr)("id", `zs-${option.key}-removes`)} class="zs-level__line" data-v-2cc57731${_scopeId}><span class="zs-level__key" data-v-2cc57731${_scopeId}>Entfernt:</span> ${(0, server_renderer_exports.ssrInterpolate)(option.removes)}</span><span${(0, server_renderer_exports.ssrRenderAttr)("id", `zs-${option.key}-keeps`)} class="zs-level__line" data-v-2cc57731${_scopeId}><span class="zs-level__key" data-v-2cc57731${_scopeId}>Bleibt:</span> ${(0, server_renderer_exports.ssrInterpolate)(option.keeps)}</span></span></label>`);
						});
						_push(`<!--]--></fieldset>`);
						if (chosen.value) {
							_push(`<section class="adm-form__group" aria-labelledby="zs-what-heading" data-v-2cc57731${_scopeId}><h2 id="zs-what-heading" class="adm-form__heading" data-v-2cc57731${_scopeId}>Das wird entfernt</h2>`);
							if (chosen.value.counts.length) {
								_push(`<ul class="zs-counts" aria-live="polite" data-v-2cc57731${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(chosen.value.counts, (item) => {
									_push(`<li class="zs-counts__item" data-v-2cc57731${_scopeId}><span class="zs-counts__n" data-v-2cc57731${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatNumber)(item.count))}</span> ${(0, server_renderer_exports.ssrInterpolate)(item.label)}</li>`);
								});
								_push(`<!--]--></ul>`);
							} else _push(`<p class="adm-note" aria-live="polite" data-v-2cc57731${_scopeId}>Nichts – auf dieser Stufe ist schon alles leer.</p>`);
							if (chosen.value.blocked) _push(`<p class="zs-blocked" role="status" data-v-2cc57731${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(chosen.value.blocked)} Nimm stattdessen „Shopdaten“.</p>`);
							else _push(`<!---->`);
							_push(`</section>`);
						} else _push(`<!---->`);
						_push(`<div class="zs-go" data-v-2cc57731${_scopeId}><button class="btn btn--secondary adm-btn--danger" type="submit"${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", chosen.value?.blocked || empty.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", resetting.value ? "true" : void 0)} data-v-2cc57731${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(chosen.value?.label)} zurücksetzen </button><p class="adm-form__note" data-v-2cc57731${_scopeId}>Vorher wird die ganze Datenbank gesichert. Für ein paar Sekunden zeigt der Shop dann die Wartungsseite.</p></div></form>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: confirming.value,
							"onUpdate:open": ($event) => confirming.value = $event,
							title: `${chosen.value?.label ?? ""} zurücksetzen`,
							body: confirmBody.value,
							"confirm-label": "Zurücksetzen",
							"confirm-word": __props.word,
							busy: resetting.value,
							onConfirm: reset
						}, null, _parent, _scopeId));
						if (__props.last?.undoable) _push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: confirmingUndo.value,
							"onUpdate:open": ($event) => confirmingUndo.value = $event,
							title: "Letztes Zurücksetzen rückgängig machen",
							body: undoBody.value,
							"confirm-label": "Rückgängig machen",
							busy: undoing.value,
							onConfirm: undo
						}, null, _parent, _scopeId));
						else _push(`<!---->`);
					} else return [
						(0, vue_exports.createVNode)("p", { class: "adm-note zs-lead" }, " Benutzer, Rollen, Einstellungen und das Protokoll bleiben auf jeder Stufe erhalten – nur „Demodaten“ entfernt das Demo-Team und seine Einträge. Du bleibst angemeldet. "),
						__props.last ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 0,
							class: "zs-last",
							"aria-labelledby": "zs-last-heading"
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "zs-last-heading",
								class: "adm-form__heading"
							}, "Letztes Zurücksetzen"),
							(0, vue_exports.createVNode)("p", { class: "adm-note" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.last.label) + ", am " + (0, vue_exports.toDisplayString)(__props.last.atText) + " von " + (0, vue_exports.toDisplayString)(__props.last.by) + ". ", 1), __props.last.undone ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("Am " + (0, vue_exports.toDisplayString)(__props.last.undoneText) + " rückgängig gemacht.", 1)], 64)) : __props.last.undoable ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Rückgängig machen ist bis " + (0, vue_exports.toDisplayString)(__props.last.until) + " möglich (" + (0, vue_exports.toDisplayString)(__props.last.remaining) + ").", 1)], 64)) : __props.last.reason ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.last.reason), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)]),
							__props.last.undoable ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", { key: 0 }, [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "button",
								"aria-busy": undoing.value ? "true" : void 0,
								onClick: askUndo
							}, " Letztes Zurücksetzen rückgängig machen ", 8, ["aria-busy"])])) : (0, vue_exports.createCommentVNode)("", true)
						])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("form", {
							class: "adm-form zs-form",
							novalidate: "",
							onSubmit: (0, vue_exports.withModifiers)(ask, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("fieldset", { class: "zs-levels" }, [(0, vue_exports.createVNode)("legend", { class: "adm-form__heading zs-levels__legend" }, "Was soll weg?"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.levels, (option) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("label", {
									key: option.key,
									class: "check zs-level"
								}, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									"onUpdate:modelValue": ($event) => level.value = $event,
									type: "radio",
									name: "zs-level",
									value: option.key,
									"aria-describedby": `zs-${option.key}-removes zs-${option.key}-keeps`
								}, null, 8, [
									"onUpdate:modelValue",
									"value",
									"aria-describedby"
								]), [[vue_exports.vModelRadio, level.value]]), (0, vue_exports.createVNode)("span", { class: "zs-level__text" }, [
									(0, vue_exports.createVNode)("span", { class: "zs-level__name" }, (0, vue_exports.toDisplayString)(option.label), 1),
									(0, vue_exports.createVNode)("span", {
										id: `zs-${option.key}-removes`,
										class: "zs-level__line"
									}, [(0, vue_exports.createVNode)("span", { class: "zs-level__key" }, "Entfernt:"), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(option.removes), 1)], 8, ["id"]),
									(0, vue_exports.createVNode)("span", {
										id: `zs-${option.key}-keeps`,
										class: "zs-level__line"
									}, [(0, vue_exports.createVNode)("span", { class: "zs-level__key" }, "Bleibt:"), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(option.keeps), 1)], 8, ["id"])
								])]);
							}), 128))]),
							chosen.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
								key: 0,
								class: "adm-form__group",
								"aria-labelledby": "zs-what-heading"
							}, [
								(0, vue_exports.createVNode)("h2", {
									id: "zs-what-heading",
									class: "adm-form__heading"
								}, "Das wird entfernt"),
								chosen.value.counts.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ul", {
									key: 0,
									class: "zs-counts",
									"aria-live": "polite"
								}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(chosen.value.counts, (item) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
										key: item.label,
										class: "zs-counts__item"
									}, [(0, vue_exports.createVNode)("span", { class: "zs-counts__n" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatNumber)(item.count)), 1), (0, vue_exports.createTextVNode)("\xA0" + (0, vue_exports.toDisplayString)(item.label), 1)]);
								}), 128))])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 1,
									class: "adm-note",
									"aria-live": "polite"
								}, "Nichts – auf dieser Stufe ist schon alles leer.")),
								chosen.value.blocked ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 2,
									class: "zs-blocked",
									role: "status"
								}, (0, vue_exports.toDisplayString)(chosen.value.blocked) + " Nimm stattdessen „Shopdaten“.", 1)) : (0, vue_exports.createCommentVNode)("", true)
							])) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("div", { class: "zs-go" }, [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary adm-btn--danger",
								type: "submit",
								"aria-disabled": chosen.value?.blocked || empty.value ? "true" : void 0,
								"aria-busy": resetting.value ? "true" : void 0
							}, (0, vue_exports.toDisplayString)(chosen.value?.label) + " zurücksetzen ", 9, ["aria-disabled", "aria-busy"]), (0, vue_exports.createVNode)("p", { class: "adm-form__note" }, "Vorher wird die ganze Datenbank gesichert. Für ein paar Sekunden zeigt der Shop dann die Wartungsseite.")])
						], 32),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: confirming.value,
							"onUpdate:open": ($event) => confirming.value = $event,
							title: `${chosen.value?.label ?? ""} zurücksetzen`,
							body: confirmBody.value,
							"confirm-label": "Zurücksetzen",
							"confirm-word": __props.word,
							busy: resetting.value,
							onConfirm: reset
						}, null, 8, [
							"open",
							"onUpdate:open",
							"title",
							"body",
							"confirm-word",
							"busy"
						]),
						__props.last?.undoable ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminConfirm_default, {
							key: 1,
							open: confirmingUndo.value,
							"onUpdate:open": ($event) => confirmingUndo.value = $event,
							title: "Letztes Zurücksetzen rückgängig machen",
							body: undoBody.value,
							"confirm-label": "Rückgängig machen",
							busy: undoing.value,
							onConfirm: undo
						}, null, 8, [
							"open",
							"onUpdate:open",
							"body",
							"busy"
						])) : (0, vue_exports.createCommentVNode)("", true)
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/System/Zuruecksetzen.vue
var _sfc_setup = Zuruecksetzen_vue_vue_type_script_setup_true_lang_default.setup;
Zuruecksetzen_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/System/Zuruecksetzen.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Zuruecksetzen_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Zuruecksetzen_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-2cc57731"]]);
//#endregion
export { Zuruecksetzen_default as default };
