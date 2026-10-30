import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { t as Dialog_default } from "./Dialog-BPdFERzS.js";
import { c as router, o as useForm, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { t as stampHeaders } from "./useDirtyForm-jjlNVm-n.js";
import { n as useFocusAfter } from "./useFocusAfter-B30tsjKa.js";
//#region resources/js/Pages/Admin/Gutachten/CombinationsCard.vue?vue&type=script&setup=true&lang.ts
var BAG = "kombinationen";
var CombinationsCard_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CombinationsCard",
	__ssrInlineRender: true,
	props: {
		documentId: {},
		combinations: {},
		editable: { type: Boolean },
		pageCount: {},
		stamp: {}
	},
	setup(__props) {
		/**
		* The document's own „Bereifungskombinationen“ (D-256; the client's item 8), per vehicle type since his admin item 19
		* (D-358: „the Bereifungskombinationen should be adjustable per EG-Typgenehmigungsnummer“) — as the PDF prints them: a
		* Verwendungsbereich lists the types by their EG type-approval number, and each type its own combinations, each with its
		* number, the size on the front axle and the size on the rear (`225/40 R18`). Once a type has any, the shop offers it no
		* tyres on this document but these; a car whose EG number has none is told its tyres are not confirmed yet.
		*
		* The EG number is chosen first. Its list is saved whole, into its own error bag (`kombinationen`); „Kombinationen
		* kopieren von …“ fills the form with another number's list to check before saving, and „Auf mehrere EG-Nummern
		* anwenden“ puts one combination on several numbers at once.
		*/
		const props = __props;
		useFocusAfter();
		const page = usePage();
		const entries = (0, vue_exports.computed)(() => props.combinations.entries);
		const selected = (0, vue_exports.ref)(entries.value[0]?.eg ?? "");
		const current = (0, vue_exports.computed)(() => entries.value.find((e) => e.eg === selected.value) ?? null);
		const others = (0, vue_exports.computed)(() => entries.value.filter((e) => e.eg !== selected.value));
		const canApply = (0, vue_exports.computed)(() => props.editable && others.value.length > 0);
		function entryLabel(entry) {
			const cars = entry.cars.length > 0 ? ` – ${entry.cars.join(", ")}` : "";
			const count = entry.combinations.length === 1 ? "1 Kombination" : `${entry.combinations.length} Kombinationen`;
			return `${entry.eg}${cars} (${count})`;
		}
		const rowsOf = (list) => list.map((c) => ({
			number: c.number,
			front: c.front,
			rear: c.rear
		}));
		const form = useForm({
			entry: selected.value,
			source_page: props.combinations.sourcePage ?? "",
			combinations: rowsOf(current.value?.combinations ?? [])
		});
		const editing = (0, vue_exports.ref)(false);
		const empty = (0, vue_exports.computed)(() => (current.value?.combinations.length ?? 0) === 0);
		const errors = (0, vue_exports.computed)(() => (page.props.errors ?? {})[BAG] ?? {});
		(0, vue_exports.watch)([selected, () => props.combinations], () => {
			if (!editing.value) {
				form.entry = selected.value;
				form.combinations = rowsOf(current.value?.combinations ?? []);
				form.defaults();
			}
		});
		const copyFrom = (0, vue_exports.ref)("");
		const copied = (0, vue_exports.ref)("");
		function fieldError(i, field) {
			return errors.value[`combinations.${i}.${field}`] ?? "";
		}
		const applying = (0, vue_exports.ref)(null);
		const targets = (0, vue_exports.ref)([]);
		const sending = (0, vue_exports.ref)(false);
		const applyOpen = (0, vue_exports.computed)({
			get: () => applying.value !== null,
			set: (open) => {
				if (!open) applying.value = null;
			}
		});
		function apply() {
			if (applying.value === null || targets.value.length === 0 || sending.value) return;
			sending.value = true;
			router.post(`/admin/gutachten/${props.documentId}/bereifungskombinationen/anwenden`, {
				combination: applying.value.id,
				targets: targets.value
			}, {
				preserveScroll: true,
				errorBag: BAG,
				headers: stampHeaders(props.stamp),
				onSuccess: () => {
					applying.value = null;
				},
				onFinish: () => {
					sending.value = false;
				}
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "kb" }, _attrs))} data-v-c7cf0b6c><p class="adm-note" data-v-c7cf0b6c> Nennt das Gutachten Bereifungskombinationen, trag sie je Fahrzeugtyp ein: bei der EG-Typgenehmigungsnummer, unter der das Gutachten den Typ führt, jede mit ihrer Nummer, wie sie im Gutachten steht. Der Shop bietet für diesen Typ dann nur diese Kombinationen an – vier gleiche Reifen also nur, wenn eine Kombination vorne und hinten dieselbe Größe nennt. Ist für die EG-Nummer eines Fahrzeugs hier keine Kombination eingetragen, bestätigt der Shop dessen Reifen nicht. </p>`);
			if (__props.combinations.unassigned.length > 0) _push(`<p class="adm-alert" role="status" data-v-c7cf0b6c>${(0, server_renderer_exports.ssrInterpolate)(__props.combinations.unassigned.length === 1 ? "Eine Kombination ist" : `${__props.combinations.unassigned.length} Kombinationen sind`)} ohne EG-Typgenehmigungsnummer erfasst und ${(0, server_renderer_exports.ssrInterpolate)(__props.combinations.unassigned.length === 1 ? "gilt" : "gelten")} deshalb für kein Fahrzeug. Trag ${(0, server_renderer_exports.ssrInterpolate)(__props.combinations.unassigned.length === 1 ? "sie" : "sie jeweils")} bei der passenden EG-Nummer ein. </p>`);
			else _push(`<!---->`);
			if (entries.value.length === 0) _push(`<p class="adm-note" data-v-c7cf0b6c> Zu diesem Gutachten ist bei uns noch kein Fahrzeug mit EG-Typgenehmigungsnummer erfasst. Leg zuerst die Fahrzeuge seines Verwendungsbereichs an, danach trägst du hier die Kombinationen je EG-Nummer ein. </p>`);
			else {
				_push(`<!--[--><div class="form-field kb-entry" data-v-c7cf0b6c><label class="form-field__label" for="kb-entry" data-v-c7cf0b6c>Fahrzeugtyp (EG-Typgenehmigungsnummer)</label><select id="kb-entry" class="input"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(editing.value) ? " disabled" : ""} data-v-c7cf0b6c><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(entries.value, (entry) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", entry.eg)} data-v-c7cf0b6c${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(selected.value) ? (0, server_renderer_exports.ssrLooseContain)(selected.value, entry.eg) : (0, server_renderer_exports.ssrLooseEqual)(selected.value, entry.eg)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(entryLabel(entry))}</option>`);
				});
				_push(`<!--]--></select></div>`);
				if (!editing.value) {
					_push(`<!--[-->`);
					if (current.value?.carriedOver) _push(`<p class="adm-note kb-carried" data-v-c7cf0b6c><span class="adm-tag adm-tag--warn" data-v-c7cf0b6c>Übernommen, bitte prüfen</span> Diese Liste war bisher bei uns für alle Fahrzeuge des Gutachtens hinterlegt. Prüf sie für diese EG-Nummer und speichere sie. </p>`);
					else _push(`<!---->`);
					if (empty.value) _push(`<p class="adm-note" data-v-c7cf0b6c>Für diese EG-Nummer sind keine Bereifungskombinationen hinterlegt.</p>`);
					else {
						_push(`<div class="kb-scroll" data-v-c7cf0b6c><table class="adm-table kb-table" data-v-c7cf0b6c><caption class="visually-hidden" data-v-c7cf0b6c>Bereifungskombinationen für ${(0, server_renderer_exports.ssrInterpolate)(selected.value)}</caption><thead data-v-c7cf0b6c><tr data-v-c7cf0b6c><th scope="col" class="num" data-v-c7cf0b6c>Nr.</th><th scope="col" data-v-c7cf0b6c>Vorderachse</th><th scope="col" data-v-c7cf0b6c>Hinterachse</th>`);
						if (canApply.value) _push(`<th scope="col" data-v-c7cf0b6c><span class="visually-hidden" data-v-c7cf0b6c>Aktionen</span></th>`);
						else _push(`<!---->`);
						_push(`</tr></thead><tbody data-v-c7cf0b6c><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(current.value?.combinations ?? [], (row) => {
							_push(`<tr data-v-c7cf0b6c><th scope="row" class="num kb-nr" data-v-c7cf0b6c>${(0, server_renderer_exports.ssrInterpolate)(row.number)}</th><td class="num" data-label="Vorderachse" data-v-c7cf0b6c>${(0, server_renderer_exports.ssrInterpolate)(row.front)}</td><td class="num" data-label="Hinterachse" data-v-c7cf0b6c>${(0, server_renderer_exports.ssrInterpolate)(row.rear)}</td>`);
							if (canApply.value) _push(`<td data-label="Aktionen" data-v-c7cf0b6c><button class="btn btn--ghost btn--sm" type="button" data-v-c7cf0b6c> Auf mehrere EG-Nummern anwenden<span class="visually-hidden" data-v-c7cf0b6c>: Kombination ${(0, server_renderer_exports.ssrInterpolate)(row.number)}</span></button></td>`);
							else _push(`<!---->`);
							_push(`</tr>`);
						});
						_push(`<!--]--></tbody></table></div>`);
					}
					if (!empty.value && __props.combinations.sourcePage) _push(`<p class="adm-note" data-v-c7cf0b6c>Seite ${(0, server_renderer_exports.ssrInterpolate)(__props.combinations.sourcePage)} im Gutachten.</p>`);
					else _push(`<!---->`);
					if (__props.editable) {
						_push(`<button id="kb-edit" class="btn btn--ghost" type="button" data-v-c7cf0b6c>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: empty.value ? "plus" : "edit",
							size: 20
						}, null, _parent));
						_push(` ${(0, server_renderer_exports.ssrInterpolate)(empty.value ? "Kombinationen eintragen" : "Kombinationen ändern")}</button>`);
					} else _push(`<!---->`);
					_push(`<!--]-->`);
				} else {
					_push(`<form class="kb-form" novalidate aria-labelledby="kb-form-h" data-v-c7cf0b6c>`);
					if (errors.value._stamp) _push(`<p class="adm-alert" role="alert" data-v-c7cf0b6c>${(0, server_renderer_exports.ssrInterpolate)(errors.value._stamp)}</p>`);
					else _push(`<!---->`);
					if (errors.value.entry) _push(`<p class="adm-alert" role="alert" data-v-c7cf0b6c>${(0, server_renderer_exports.ssrInterpolate)(errors.value.entry)}</p>`);
					else _push(`<!---->`);
					_push(`<p id="kb-form-h" class="form-field__label" data-v-c7cf0b6c>Bereifungskombinationen für ${(0, server_renderer_exports.ssrInterpolate)(selected.value)}</p><p class="form-field__help" data-v-c7cf0b6c>Je Kombination die Nummer und die beiden Größen, so wie das Gutachten sie druckt, etwa 225/40 R18. Lastindex und Geschwindigkeitssymbol lässt du weg.</p>`);
					if (others.value.length > 0) {
						_push(`<div class="kb-copy" data-v-c7cf0b6c><div class="form-field" data-v-c7cf0b6c><label class="form-field__label" for="kb-copy-from" data-v-c7cf0b6c>Kombinationen kopieren von …</label><select id="kb-copy-from" class="input" data-v-c7cf0b6c><option value="" data-v-c7cf0b6c${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(copyFrom.value) ? (0, server_renderer_exports.ssrLooseContain)(copyFrom.value, "") : (0, server_renderer_exports.ssrLooseEqual)(copyFrom.value, "")) ? " selected" : ""}>EG-Nummer wählen</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(others.value, (entry) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", entry.eg)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(entry.combinations.length === 0) ? " disabled" : ""} data-v-c7cf0b6c${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(copyFrom.value) ? (0, server_renderer_exports.ssrLooseContain)(copyFrom.value, entry.eg) : (0, server_renderer_exports.ssrLooseEqual)(copyFrom.value, entry.eg)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(entryLabel(entry))}</option>`);
						});
						_push(`<!--]--></select></div><button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(copyFrom.value === "") ? " disabled" : ""} data-v-c7cf0b6c>Übernehmen</button>`);
						if (copied.value) _push(`<p class="adm-note kb-copied" role="status" data-v-c7cf0b6c>${(0, server_renderer_exports.ssrInterpolate)(copied.value)}</p>`);
						else _push(`<!---->`);
						_push(`</div>`);
					} else _push(`<!---->`);
					_push(`<div class="form-field kb-page" data-v-c7cf0b6c><label class="form-field__label" for="kb-page" data-v-c7cf0b6c>Seite im Gutachten</label><input id="kb-page"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).source_page)} class="input" type="number" min="1"${(0, server_renderer_exports.ssrRenderAttr)("max", __props.pageCount ?? void 0)} inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.source_page ? "true" : void 0)} aria-describedby="kb-page-err" data-v-c7cf0b6c><p id="kb-page-err" class="form-field__error" data-v-c7cf0b6c>${(0, server_renderer_exports.ssrInterpolate)(errors.value.source_page)}</p></div><div class="kb-scroll" data-v-c7cf0b6c><table class="kb-grid" data-v-c7cf0b6c><thead data-v-c7cf0b6c><tr data-v-c7cf0b6c><th scope="col" data-v-c7cf0b6c>Nr.</th><th scope="col" data-v-c7cf0b6c>Vorderachse</th><th scope="col" data-v-c7cf0b6c>Hinterachse</th><th scope="col" data-v-c7cf0b6c><span class="visually-hidden" data-v-c7cf0b6c>Kombination entfernen</span></th></tr></thead><tbody data-v-c7cf0b6c><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(form).combinations, (row, i) => {
						_push(`<tr data-v-c7cf0b6c><td data-v-c7cf0b6c><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", `kb-number-${i}`)} data-v-c7cf0b6c>Nummer der Kombination in Zeile ${(0, server_renderer_exports.ssrInterpolate)(i + 1)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `kb-number-${i}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", row.number)} class="input kb-number" type="number" min="1" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", fieldError(i, "number") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `kb-number-${i}-err`)} data-v-c7cf0b6c><p${(0, server_renderer_exports.ssrRenderAttr)("id", `kb-number-${i}-err`)} class="form-field__error" data-v-c7cf0b6c>${(0, server_renderer_exports.ssrInterpolate)(fieldError(i, "number"))}</p></td><td data-v-c7cf0b6c><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", `kb-front-${i}`)} data-v-c7cf0b6c>Kombination ${(0, server_renderer_exports.ssrInterpolate)(row.number || i + 1)}, Vorderachse</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `kb-front-${i}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", row.front)} class="input kb-size" type="text" maxlength="20" autocomplete="off" spellcheck="false" placeholder="225/40 R18"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", fieldError(i, "front") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `kb-front-${i}-err`)} data-v-c7cf0b6c><p${(0, server_renderer_exports.ssrRenderAttr)("id", `kb-front-${i}-err`)} class="form-field__error" data-v-c7cf0b6c>${(0, server_renderer_exports.ssrInterpolate)(fieldError(i, "front"))}</p></td><td data-v-c7cf0b6c><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", `kb-rear-${i}`)} data-v-c7cf0b6c>Kombination ${(0, server_renderer_exports.ssrInterpolate)(row.number || i + 1)}, Hinterachse</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `kb-rear-${i}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", row.rear)} class="input kb-size" type="text" maxlength="20" autocomplete="off" spellcheck="false" placeholder="245/35 R18"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", fieldError(i, "rear") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `kb-rear-${i}-err`)} data-v-c7cf0b6c><p${(0, server_renderer_exports.ssrRenderAttr)("id", `kb-rear-${i}-err`)} class="form-field__error" data-v-c7cf0b6c>${(0, server_renderer_exports.ssrInterpolate)(fieldError(i, "rear"))}</p></td><td data-v-c7cf0b6c><button class="btn btn--ghost btn--icon" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Kombination ${row.number || i + 1} entfernen`)} data-v-c7cf0b6c>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: "close",
							size: 20
						}, null, _parent));
						_push(`</button></td></tr>`);
					});
					_push(`<!--]--></tbody></table></div><div class="kb-actions" data-v-c7cf0b6c><button id="kb-add-row" class="btn btn--ghost" type="button" data-v-c7cf0b6c>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "plus",
						size: 20
					}, null, _parent));
					_push(` Kombination hinzufügen </button></div>`);
					if (errors.value.combinations) _push(`<p id="kb-list-err" class="form-field__error" role="alert" data-v-c7cf0b6c>${(0, server_renderer_exports.ssrInterpolate)(errors.value.combinations)}</p>`);
					else _push(`<!---->`);
					_push(`<div class="kb-actions" data-v-c7cf0b6c><button id="kb-save" class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", errors.value.combinations ? "kb-list-err" : void 0)} data-v-c7cf0b6c> Kombinationen speichern </button><button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""} data-v-c7cf0b6c>Abbrechen</button></div></form>`);
				}
				_push(`<!--]-->`);
			}
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
				open: applyOpen.value,
				"onUpdate:open": ($event) => applyOpen.value = $event,
				title: `Kombination ${applying.value?.number ?? ""} auf mehrere EG-Nummern anwenden`,
				"content-class": "adm-dialog adm-dialog--narrow"
			}, {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-c7cf0b6c${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(targets.value.length === 0 || sending.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", sending.value ? "true" : void 0)} data-v-c7cf0b6c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(targets.value.length === 1 ? "Für eine EG-Nummer eintragen" : `Für ${targets.value.length} EG-Nummern eintragen`)}</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: ($event) => applying.value = null
					}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						disabled: targets.value.length === 0 || sending.value,
						"aria-busy": sending.value ? "true" : void 0,
						onClick: apply
					}, (0, vue_exports.toDisplayString)(targets.value.length === 1 ? "Für eine EG-Nummer eintragen" : `Für ${targets.value.length} EG-Nummern eintragen`), 9, ["disabled", "aria-busy"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="adm-fields" data-v-c7cf0b6c${_scopeId}><p class="adm-note" data-v-c7cf0b6c${_scopeId}> Vorne ${(0, server_renderer_exports.ssrInterpolate)(applying.value?.front)}, hinten ${(0, server_renderer_exports.ssrInterpolate)(applying.value?.rear)}: für welche EG-Nummern dieses Gutachtens gilt die Kombination auch? Wo sie schon steht, bleibt alles, wie es ist. </p><fieldset class="kb-targets" data-v-c7cf0b6c${_scopeId}><legend class="visually-hidden" data-v-c7cf0b6c${_scopeId}>EG-Nummern</legend><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(others.value, (entry) => {
							_push(`<label class="check" data-v-c7cf0b6c${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(targets.value) ? (0, server_renderer_exports.ssrLooseContain)(targets.value, entry.eg) : targets.value) ? " checked" : ""} type="checkbox"${(0, server_renderer_exports.ssrRenderAttr)("value", entry.eg)} data-v-c7cf0b6c${_scopeId}> ${(0, server_renderer_exports.ssrInterpolate)(entryLabel(entry))}</label>`);
						});
						_push(`<!--]--></fieldset>`);
						if (errors.value.targets || errors.value.combination) _push(`<p class="adm-alert" role="alert" data-v-c7cf0b6c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.targets ?? errors.value.combination)}</p>`);
						else _push(`<!---->`);
						_push(`</div>`);
					} else return [(0, vue_exports.createVNode)("div", { class: "adm-fields" }, [
						(0, vue_exports.createVNode)("p", { class: "adm-note" }, " Vorne " + (0, vue_exports.toDisplayString)(applying.value?.front) + ", hinten " + (0, vue_exports.toDisplayString)(applying.value?.rear) + ": für welche EG-Nummern dieses Gutachtens gilt die Kombination auch? Wo sie schon steht, bleibt alles, wie es ist. ", 1),
						(0, vue_exports.createVNode)("fieldset", { class: "kb-targets" }, [(0, vue_exports.createVNode)("legend", { class: "visually-hidden" }, "EG-Nummern"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(others.value, (entry) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("label", {
								key: entry.eg,
								class: "check"
							}, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								"onUpdate:modelValue": ($event) => targets.value = $event,
								type: "checkbox",
								value: entry.eg
							}, null, 8, ["onUpdate:modelValue", "value"]), [[vue_exports.vModelCheckbox, targets.value]]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(entryLabel(entry)), 1)]);
						}), 128))]),
						errors.value.targets || errors.value.combination ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-alert",
							role: "alert"
						}, (0, vue_exports.toDisplayString)(errors.value.targets ?? errors.value.combination), 1)) : (0, vue_exports.createCommentVNode)("", true)
					])];
				}),
				_: 1
			}, _parent));
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/CombinationsCard.vue
var CombinationsCard_exports = /* @__PURE__ */ __exportAll({ default: () => CombinationsCard_default });
var _sfc_setup = CombinationsCard_vue_vue_type_script_setup_true_lang_default.setup;
CombinationsCard_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/CombinationsCard.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var CombinationsCard_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CombinationsCard_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-c7cf0b6c"]]);
//#endregion
export { CombinationsCard_exports as n, CombinationsCard_default as t };
