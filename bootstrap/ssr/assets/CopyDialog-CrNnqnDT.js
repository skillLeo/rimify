import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { t as Dialog_default } from "./Dialog-Hg9IsA0U.js";
import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { f as send, m as useEntry, o as carSummary } from "./entryStore-DmyNlH0L.js";
//#region resources/js/Pages/Admin/Gutachten/Erfassung/CopyDialog.vue?vue&type=script&setup=true&lang.ts
var CopyDialog_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CopyDialog",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({ from: {} }, {
		"open": {
			type: Boolean,
			required: true
		},
		"openModifiers": {}
	}),
	emits: ["update:open"],
	setup(__props) {
		/**
		* „Kopieren nach …“ (the client's change of 05.11.2026, the operator's brief): one car's lines copied to other cars, many at once,
		* replacing theirs or added to them, with the count from the server before anything happens. A copied car says where its lines
		* came from until someone edits them.
		*/
		const props = __props;
		const open = (0, vue_exports.useModel)(__props, "open");
		const store = useEntry();
		const { state } = store;
		const targets = (0, vue_exports.ref)([]);
		const mode = (0, vue_exports.ref)("ersetzen");
		const query = (0, vue_exports.ref)("");
		const preview = (0, vue_exports.ref)(null);
		const failure = (0, vue_exports.ref)("");
		const busy = (0, vue_exports.ref)(false);
		const others = (0, vue_exports.computed)(() => state.entry.cars.filter((car) => car.id !== props.from.id && car.combinationId === props.from.combinationId));
		const shown = (0, vue_exports.computed)(() => {
			const q = query.value.trim().toLowerCase();
			return q === "" ? others.value : others.value.filter((car) => `${car.label} ${car.k ?? ""}`.toLowerCase().includes(q));
		});
		const allShown = (0, vue_exports.computed)(() => shown.value.length > 0 && shown.value.every((car) => targets.value.includes(car.id)));
		(0, vue_exports.watch)(open, (value) => {
			if (value) {
				targets.value = others.value.filter((car) => !car.done).map((car) => car.id);
				mode.value = "ersetzen";
				query.value = "";
				failure.value = "";
			}
		});
		function toggleAll() {
			const ids = shown.value.map((car) => car.id);
			targets.value = allShown.value ? targets.value.filter((id) => !ids.includes(id)) : [.../* @__PURE__ */ new Set([...targets.value, ...ids])];
		}
		let asked = 0;
		(0, vue_exports.watch)([
			targets,
			mode,
			open
		], async () => {
			preview.value = null;
			if (!open.value || targets.value.length === 0) return;
			const mine = ++asked;
			const answer = await send("POST", `${store.base}/fahrzeuge/${props.from.id}/kopieren`, {
				ziele: targets.value,
				modus: mode.value,
				vorschau: true
			}).catch(() => null);
			if (answer !== null && mine === asked) preview.value = answer.preview;
		}, { deep: true });
		const hiddenTicks = (0, vue_exports.computed)(() => targets.value.filter((id) => !shown.value.some((car) => car.id === id)).length);
		const previewText = (0, vue_exports.computed)(() => {
			if (targets.value.length === 0) return "Wähl mindestens ein Fahrzeug.";
			if (preview.value === null) return "";
			const { cars, lines } = preview.value;
			const onCars = cars === 1 ? "bei 1 Fahrzeug" : `bei ${cars} Fahrzeugen`;
			if (mode.value === "ersetzen") return `Danach ${lines === 1 ? "steht" : "stehen"} ${onCars} insgesamt ${lines} ${lines === 1 ? "Zeile" : "Zeilen"}.`;
			return lines === 0 ? "Nichts kommt hinzu: Alles steht dort schon." : `Hinzu ${lines === 1 ? "kommt" : "kommen"} insgesamt ${lines} ${lines === 1 ? "Zeile" : "Zeilen"} ${onCars}.`;
		});
		async function copy() {
			busy.value = true;
			failure.value = "";
			try {
				await store.save("POST", `/fahrzeuge/${props.from.id}/kopieren`, {
					ziele: targets.value,
					modus: mode.value
				});
				open.value = false;
			} catch (error) {
				failure.value = error instanceof Error ? error.message : "Das hat nicht geklappt.";
			} finally {
				busy.value = false;
			}
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event,
				title: `Reifen von ${__props.from.label} kopieren`,
				description: "Kopiert Zeilen und allgemeine Codes auf andere Fahrzeuge derselben Felgenkombination. Die Angabe „Seite im Gutachten“ bleibt dort, wie sie ist.",
				"content-class": "adm-dialog",
				wide: ""
			}, _attrs), {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-21cbc10a${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(targets.value.length === 0 || busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-21cbc10a${_scopeId}>Kopieren</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: ($event) => open.value = false
					}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						disabled: targets.value.length === 0 || busy.value,
						"aria-busy": busy.value ? "true" : void 0,
						onClick: copy
					}, "Kopieren", 8, ["disabled", "aria-busy"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="adm-fields" data-v-21cbc10a${_scopeId}><fieldset class="ef-fieldset" data-v-21cbc10a${_scopeId}><legend class="form-field__label" data-v-21cbc10a${_scopeId}>Nach</legend>`);
						if (others.value.length) {
							_push(`<!--[--><div class="ef-copy__tools" data-v-21cbc10a${_scopeId}><label class="visually-hidden" for="ef-copy-q" data-v-21cbc10a${_scopeId}>Fahrzeuge durchsuchen</label><input id="ef-copy-q"${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="input" type="search" placeholder="Modell oder Betriebserlaubnis" autocomplete="off" data-v-21cbc10a${_scopeId}><button class="btn btn--ghost" type="button" data-v-21cbc10a${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(query.value.trim() ? allShown.value ? "Alle Treffer abwählen" : "Alle Treffer auswählen" : allShown.value ? "Alle abwählen" : "Alle auswählen")}</button></div><div class="ef-copy__list" data-v-21cbc10a${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(shown.value, (car) => {
								_push(`<label class="check" data-v-21cbc10a${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(targets.value) ? (0, server_renderer_exports.ssrLooseContain)(targets.value, car.id) : targets.value) ? " checked" : ""} type="checkbox"${(0, server_renderer_exports.ssrRenderAttr)("value", car.id)} data-v-21cbc10a${_scopeId}> ${(0, server_renderer_exports.ssrInterpolate)(car.label)} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(carSummary)(car))}</label>`);
							});
							_push(`<!--]--></div><!--]-->`);
						} else _push(`<p class="adm-note" data-v-21cbc10a${_scopeId}>Bei dieser Felgenkombination steht kein anderes Fahrzeug. Hak in Schritt 3 weitere an.</p>`);
						_push(`</fieldset><fieldset class="ef-fieldset" data-v-21cbc10a${_scopeId}><legend class="form-field__label" data-v-21cbc10a${_scopeId}>Was dort schon steht</legend><label class="check" data-v-21cbc10a${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(mode.value, "ersetzen")) ? " checked" : ""} type="radio" name="ef-copy-mode" value="ersetzen" data-v-21cbc10a${_scopeId}> Ersetzen</label><label class="check" data-v-21cbc10a${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(mode.value, "hinzufuegen")) ? " checked" : ""} type="radio" name="ef-copy-mode" value="hinzufuegen" data-v-21cbc10a${_scopeId}> Behalten und Fehlendes hinzufügen</label></fieldset><p class="ef-count" role="status" data-v-21cbc10a${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(previewText.value)}`);
						if (hiddenTicks.value > 0) _push(`<!--[--> Davon ${(0, server_renderer_exports.ssrInterpolate)(hiddenTicks.value === 1 ? "ist 1 Fahrzeug" : `sind ${hiddenTicks.value} Fahrzeuge`)} gerade ausgeblendet.<!--]-->`);
						else _push(`<!---->`);
						_push(`</p>`);
						if (failure.value) _push(`<p class="adm-alert" role="alert" data-v-21cbc10a${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(failure.value)}</p>`);
						else _push(`<!---->`);
						_push(`</div>`);
					} else return [(0, vue_exports.createVNode)("div", { class: "adm-fields" }, [
						(0, vue_exports.createVNode)("fieldset", { class: "ef-fieldset" }, [(0, vue_exports.createVNode)("legend", { class: "form-field__label" }, "Nach"), others.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)("div", { class: "ef-copy__tools" }, [
							(0, vue_exports.createVNode)("label", {
								class: "visually-hidden",
								for: "ef-copy-q"
							}, "Fahrzeuge durchsuchen"),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "ef-copy-q",
								"onUpdate:modelValue": ($event) => query.value = $event,
								class: "input",
								type: "search",
								placeholder: "Modell oder Betriebserlaubnis",
								autocomplete: "off"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, query.value]]),
							(0, vue_exports.createVNode)("button", {
								class: "btn btn--ghost",
								type: "button",
								onClick: toggleAll
							}, (0, vue_exports.toDisplayString)(query.value.trim() ? allShown.value ? "Alle Treffer abwählen" : "Alle Treffer auswählen" : allShown.value ? "Alle abwählen" : "Alle auswählen"), 1)
						]), (0, vue_exports.createVNode)("div", { class: "ef-copy__list" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(shown.value, (car) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("label", {
								key: car.id,
								class: "check"
							}, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								"onUpdate:modelValue": ($event) => targets.value = $event,
								type: "checkbox",
								value: car.id
							}, null, 8, ["onUpdate:modelValue", "value"]), [[vue_exports.vModelCheckbox, targets.value]]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(car.label) + " · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(carSummary)(car)), 1)]);
						}), 128))])], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 1,
							class: "adm-note"
						}, "Bei dieser Felgenkombination steht kein anderes Fahrzeug. Hak in Schritt 3 weitere an."))]),
						(0, vue_exports.createVNode)("fieldset", { class: "ef-fieldset" }, [
							(0, vue_exports.createVNode)("legend", { class: "form-field__label" }, "Was dort schon steht"),
							(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								"onUpdate:modelValue": ($event) => mode.value = $event,
								type: "radio",
								name: "ef-copy-mode",
								value: "ersetzen"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelRadio, mode.value]]), (0, vue_exports.createTextVNode)(" Ersetzen")]),
							(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								"onUpdate:modelValue": ($event) => mode.value = $event,
								type: "radio",
								name: "ef-copy-mode",
								value: "hinzufuegen"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelRadio, mode.value]]), (0, vue_exports.createTextVNode)(" Behalten und Fehlendes hinzufügen")])
						]),
						(0, vue_exports.createVNode)("p", {
							class: "ef-count",
							role: "status"
						}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(previewText.value), 1), hiddenTicks.value > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" Davon " + (0, vue_exports.toDisplayString)(hiddenTicks.value === 1 ? "ist 1 Fahrzeug" : `sind ${hiddenTicks.value} Fahrzeuge`) + " gerade ausgeblendet.", 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)]),
						failure.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-alert",
							role: "alert"
						}, (0, vue_exports.toDisplayString)(failure.value), 1)) : (0, vue_exports.createCommentVNode)("", true)
					])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Erfassung/CopyDialog.vue
var CopyDialog_exports = /* @__PURE__ */ __exportAll({ default: () => CopyDialog_default });
var _sfc_setup = CopyDialog_vue_vue_type_script_setup_true_lang_default.setup;
CopyDialog_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Erfassung/CopyDialog.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var CopyDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CopyDialog_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-21cbc10a"]]);
//#endregion
export { CopyDialog_exports as n, CopyDialog_default as t };
