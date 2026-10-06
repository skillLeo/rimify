import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-ziTZL4Iw.js";
import { a as link_default, c as router, o as useForm, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminConfirm_default } from "./AdminConfirm-CJZtnwyX.js";
import { n as decimal } from "./format-DGFu8Y3r.js";
//#region resources/js/Pages/Admin/Katalog/ImportRun.vue?vue&type=script&setup=true&lang.ts
var ImportRun_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "ImportRun",
	__ssrInlineRender: true,
	props: {
		run: {},
		fields: {},
		headers: {},
		examples: {},
		mapping: {},
		missing: {},
		rows: {},
		hiddenRows: {},
		can: {}
	},
	setup(__props) {
		/**
		* Katalog › Import › one run: which column holds what, what the Probelauf found, and the import itself
		* — or, once imported, taking it back (CatalogueImporter).
		*
		* The mapping can change without a new upload: the file's cells were kept as read. The import applies
		* exactly the Probelauf on screen; if the catalogue changed in between, the server asks for a new one.
		*/
		const props = __props;
		const page = usePage();
		const mappingForm = useForm({
			mapping: Object.fromEntries(props.fields.map((field) => [field.key, props.mapping[field.key] ?? ""])),
			dezimal: props.run.decimal
		});
		(0, vue_exports.watch)(() => [props.mapping, props.run.decimal], ([mapping, dec]) => {
			mappingForm.defaults({
				mapping: Object.fromEntries(props.fields.map((field) => [field.key, mapping[field.key] ?? ""])),
				dezimal: dec
			});
			mappingForm.reset();
		});
		function remap() {
			mappingForm.post(`/admin/katalog/import/${props.run.id}/zuordnung`, { preserveScroll: true });
		}
		const s = (0, vue_exports.computed)(() => props.run.summary);
		const ready = (0, vue_exports.computed)(() => props.missing.length === 0);
		const importable = (0, vue_exports.computed)(() => (s.value.create ?? 0) + (s.value.update ?? 0));
		const context = (0, vue_exports.computed)(() => {
			const rows = props.run.rowCount === 1 ? "1 Zeile" : `${decimal(props.run.rowCount, 0)} Zeilen`;
			return `${props.run.statusLabel}${props.run.supplier ? ` · ${props.run.supplier}` : ""} · ${rows} · ${props.run.format}${props.run.at ? ` · ${props.run.at}` : ""}`;
		});
		const serverError = (0, vue_exports.computed)(() => {
			return (page.props.errors ?? {}).import ?? "";
		});
		const ACTIONS = {
			create: {
				label: "Neu",
				tag: null
			},
			update: {
				label: "Wird geändert",
				tag: null
			},
			unchanged: {
				label: "Unverändert",
				tag: "adm-tag adm-tag--neutral"
			},
			refused: {
				label: "Abgelehnt",
				tag: "adm-tag adm-tag--bad"
			}
		};
		function newParts(row) {
			const parts = [];
			if (row.new.brand) parts.push("neue Marke");
			if (row.new.model) parts.push("neues Modell");
			if (row.new.finish) parts.push("neue Ausführung");
			const text = parts.join(", ");
			return text.charAt(0).toUpperCase() + text.slice(1);
		}
		const step = (0, vue_exports.ref)(null);
		const busy = (0, vue_exports.ref)(false);
		const confirmOpen = (0, vue_exports.computed)({
			get: () => step.value !== null,
			set: (open) => {
				if (!open) step.value = null;
			}
		});
		const confirmText = (0, vue_exports.computed)(() => {
			if (step.value === "zuruecknehmen") return {
				title: "Import zurücknehmen?",
				body: "Geänderte Preise und Bestände bekommen ihren alten Wert zurück, neu angelegte Größen, Ausführungen, Modelle und Marken werden gelöscht.",
				label: "Zurücknehmen"
			};
			const create = s.value.create ?? 0;
			const update = s.value.update ?? 0;
			return {
				title: `${[create ? `${decimal(create, 0)} ${create === 1 ? "Größe anlegen" : "Größen anlegen"}` : "", update ? `${decimal(update, 0)} ${update === 1 ? "Größe ändern" : "Größen ändern"}` : ""].filter(Boolean).join(" und ")}?`,
				body: "Neue Felgen sind Entwürfe, bis du sie veröffentlichst. Geänderte Preise und Bestände gelten sofort im Shop. Du kannst den Import zurücknehmen, solange nichts darauf aufbaut.",
				label: "Importieren"
			};
		});
		/** The first value of the column mapped to a field, as the file has it. */
		function example(field) {
			const header = mappingForm.mapping[field] ?? "";
			return header === "" ? "–" : props.examples[header] ?? "–";
		}
		function runStep() {
			if (step.value === null) return;
			busy.value = true;
			router.post(`/admin/katalog/import/${props.run.id}/${step.value}`, {}, {
				preserveScroll: true,
				onFinish: () => {
					busy.value = false;
					step.value = null;
				}
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: __props.run.file,
				context: context.value
			}, _attrs), (0, vue_exports.createSlots)({
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (serverError.value) _push(`<p class="adm-alert" role="alert" data-v-686b2c54${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(serverError.value)}</p>`);
						else _push(`<!---->`);
						if (__props.run.status === "applied") _push(`<p class="adm-note im-state" data-v-686b2c54${_scopeId}>Importiert am ${(0, server_renderer_exports.ssrInterpolate)(__props.run.appliedAt)}.</p>`);
						else if (__props.run.status === "rolled_back") _push(`<p class="adm-note im-state" data-v-686b2c54${_scopeId}>Importiert am ${(0, server_renderer_exports.ssrInterpolate)(__props.run.appliedAt)}, zurückgenommen am ${(0, server_renderer_exports.ssrInterpolate)(__props.run.rolledBackAt)}.</p>`);
						else _push(`<!---->`);
						if (ready.value) {
							_push(`<section class="adm-section" aria-labelledby="ir-h-result" data-v-686b2c54${_scopeId}><div class="adm-section__head" data-v-686b2c54${_scopeId}><h2 id="ir-h-result" class="adm-section__title" data-v-686b2c54${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.run.status === "previewed" ? "Probelauf" : "Ergebnis")}</h2></div><dl class="ir-counts" data-v-686b2c54${_scopeId}><div class="ir-count" data-v-686b2c54${_scopeId}><dt data-v-686b2c54${_scopeId}>Neue Größen</dt><dd data-v-686b2c54${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(s.value.create ?? 0, 0))}</dd></div><div class="ir-count" data-v-686b2c54${_scopeId}><dt data-v-686b2c54${_scopeId}>Geänderte Größen</dt><dd data-v-686b2c54${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(s.value.update ?? 0, 0))}</dd></div><div class="ir-count" data-v-686b2c54${_scopeId}><dt data-v-686b2c54${_scopeId}>Unverändert</dt><dd data-v-686b2c54${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(s.value.unchanged ?? 0, 0))}</dd></div><div class="${(0, server_renderer_exports.ssrRenderClass)([{ "ir-count--bad": (s.value.refused ?? 0) > 0 }, "ir-count"])}" data-v-686b2c54${_scopeId}><dt data-v-686b2c54${_scopeId}>Abgelehnt</dt><dd data-v-686b2c54${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(s.value.refused ?? 0, 0))}</dd></div></dl>`);
							if ((s.value.brands ?? 0) + (s.value.models ?? 0) + (s.value.finishes ?? 0) > 0) _push(`<p class="adm-note" data-v-686b2c54${_scopeId}> Dabei neu: ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(s.value.brands ?? 0, 0))} ${(0, server_renderer_exports.ssrInterpolate)(s.value.brands === 1 ? "Marke" : "Marken")}, ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(s.value.models ?? 0, 0))} ${(0, server_renderer_exports.ssrInterpolate)(s.value.models === 1 ? "Modell" : "Modelle")}, ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(s.value.finishes ?? 0, 0))} ${(0, server_renderer_exports.ssrInterpolate)(s.value.finishes === 1 ? "Ausführung" : "Ausführungen")}. Neue Modelle sind Entwürfe. </p>`);
							else _push(`<!---->`);
							if (__props.run.status === "previewed" && importable.value === 0) _push(`<p class="adm-note" data-v-686b2c54${_scopeId}>Nichts zu importieren: Jede Zeile ist entweder schon so im Katalog oder abgelehnt.</p>`);
							else _push(`<!---->`);
							if (__props.run.refusedHref) _push(`<p class="adm-note" data-v-686b2c54${_scopeId}><a${(0, server_renderer_exports.ssrRenderAttr)("href", __props.run.refusedHref)} download data-v-686b2c54${_scopeId}>Abgelehnte Zeilen als CSV</a> – mit dem Grund und der Zeile, wie sie in der Datei stand. Korrigiert kannst du sie wieder hochladen. </p>`);
							else _push(`<!---->`);
							if (__props.rows.length) {
								_push(`<div class="adm-panel ir-rows" data-v-686b2c54${_scopeId}><table class="adm-table" data-v-686b2c54${_scopeId}><caption class="visually-hidden" data-v-686b2c54${_scopeId}>Zeilen der Datei, die sich ändern oder abgelehnt sind</caption><thead data-v-686b2c54${_scopeId}><tr data-v-686b2c54${_scopeId}><th scope="col" class="num" data-v-686b2c54${_scopeId}>Zeile</th><th scope="col" data-v-686b2c54${_scopeId}>SKU</th><th scope="col" data-v-686b2c54${_scopeId}>Felge</th><th scope="col" data-v-686b2c54${_scopeId}>Änderung</th><th scope="col" data-v-686b2c54${_scopeId}>Einzelheiten</th></tr></thead><tbody data-v-686b2c54${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.rows, (row) => {
									_push(`<tr data-v-686b2c54${_scopeId}><td data-label="Zeile" class="num" data-v-686b2c54${_scopeId}><span class="ir-line-word" data-v-686b2c54${_scopeId}>Zeile </span>${(0, server_renderer_exports.ssrInterpolate)(row.line)}</td><td data-label="SKU" class="ir-sku" data-v-686b2c54${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.sku || "–")}</td><td data-label="Felge" class="ir-label" data-v-686b2c54${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.label)}</td><td data-label="Änderung" data-phone="status" data-v-686b2c54${_scopeId}>`);
									if (ACTIONS[row.action].tag) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)(ACTIONS[row.action].tag)}" data-v-686b2c54${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(ACTIONS[row.action].label)}</span>`);
									else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(ACTIONS[row.action].label)}<!--]-->`);
									_push(`</td><td data-label="Einzelheiten" class="ir-detail" data-v-686b2c54${_scopeId}>`);
									if (row.action === "refused") {
										_push(`<!--[-->`);
										(0, server_renderer_exports.ssrRenderList)(row.reasons, (reason) => {
											_push(`<span class="ir-line" data-v-686b2c54${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(reason)}</span>`);
										});
										_push(`<!--]-->`);
									} else if (row.action === "update") {
										_push(`<!--[-->`);
										(0, server_renderer_exports.ssrRenderList)(row.changes, (change) => {
											_push(`<span class="ir-line" data-v-686b2c54${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(change.field)}: ${(0, server_renderer_exports.ssrInterpolate)(change.from)} → ${(0, server_renderer_exports.ssrInterpolate)(change.to)}</span>`);
										});
										_push(`<!--]-->`);
									} else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(newParts(row) || "Neue Größe")}<!--]-->`);
									_push(`</td></tr>`);
								});
								_push(`<!--]--></tbody></table></div>`);
							} else _push(`<!---->`);
							if (__props.hiddenRows === 1) _push(`<p class="adm-note" data-v-686b2c54${_scopeId}>Eine weitere Zeile ist in den Zahlen oben enthalten, aber hier nicht aufgeführt.</p>`);
							else if (__props.hiddenRows) _push(`<p class="adm-note" data-v-686b2c54${_scopeId}>Weitere ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.hiddenRows, 0))} Zeilen sind in den Zahlen oben enthalten, aber hier nicht aufgeführt.</p>`);
							else _push(`<!---->`);
							_push(`</section>`);
						} else _push(`<!---->`);
						_push(`<section class="adm-section" aria-labelledby="ir-h-map" data-v-686b2c54${_scopeId}><div class="adm-section__head" data-v-686b2c54${_scopeId}><h2 id="ir-h-map" class="adm-section__title" data-v-686b2c54${_scopeId}>Zuordnung der Spalten</h2></div>`);
						if (!ready.value) _push(`<p class="adm-alert" role="alert" data-v-686b2c54${_scopeId}>Diese Felder brauchen noch eine Spalte aus der Datei: ${(0, server_renderer_exports.ssrInterpolate)(__props.missing.join(", "))}. Erst dann kann der Probelauf die Zeilen prüfen.</p>`);
						else _push(`<!---->`);
						if (__props.run.mappingRemembered) _push(`<p class="adm-note" data-v-686b2c54${_scopeId}> Übernommen aus dem letzten Import ${(0, server_renderer_exports.ssrInterpolate)(__props.run.supplier ? `für „${__props.run.supplier}“` : "ohne Lieferantennamen")}. </p>`);
						else if (__props.run.status === "previewed" && importable.value > 0) _push(`<p class="adm-note" data-v-686b2c54${_scopeId}> Erkannt an den Spaltennamen. Mit dem Import wird diese Zuordnung${(0, server_renderer_exports.ssrInterpolate)(__props.run.supplier ? ` für „${__props.run.supplier}“` : "")} gespeichert. </p>`);
						else _push(`<!---->`);
						_push(`<form class="ir-map" data-v-686b2c54${_scopeId}><div class="adm-panel" data-v-686b2c54${_scopeId}><table class="adm-table" data-v-686b2c54${_scopeId}><caption class="visually-hidden" data-v-686b2c54${_scopeId}>Welche Spalte der Datei welches Feld füllt</caption><thead data-v-686b2c54${_scopeId}><tr data-v-686b2c54${_scopeId}><th scope="col" data-v-686b2c54${_scopeId}>Feld</th><th scope="col" data-v-686b2c54${_scopeId}>Spalte aus der Datei</th><th scope="col" data-v-686b2c54${_scopeId}>Erster Wert</th></tr></thead><tbody data-v-686b2c54${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.fields, (field) => {
							_push(`<tr data-v-686b2c54${_scopeId}><td data-label="Feld" data-v-686b2c54${_scopeId}><label${(0, server_renderer_exports.ssrRenderAttr)("for", `ir-map-${field.key}`)} class="ir-field" data-v-686b2c54${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(field.label)}</label>`);
							if (field.required) _push(`<span class="ir-req" data-v-686b2c54${_scopeId}>Pflicht</span>`);
							else _push(`<!---->`);
							_push(`</td><td data-label="Spalte" data-v-686b2c54${_scopeId}><select${(0, server_renderer_exports.ssrRenderAttr)("id", `ir-map-${field.key}`)} class="input ir-select"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!__props.can.remap) ? " disabled" : ""} data-v-686b2c54${_scopeId}><option value="" data-v-686b2c54${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(mappingForm).mapping[field.key]) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(mappingForm).mapping[field.key], "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(mappingForm).mapping[field.key], "")) ? " selected" : ""}${_scopeId}>– keine –</option><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.headers, (header) => {
								_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", header)} data-v-686b2c54${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(mappingForm).mapping[field.key]) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(mappingForm).mapping[field.key], header) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(mappingForm).mapping[field.key], header)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(header)}</option>`);
							});
							_push(`<!--]--></select></td><td data-label="Erster Wert" class="ir-example" data-v-686b2c54${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(example(field.key))}</td></tr>`);
						});
						_push(`<!--]--></tbody></table></div>`);
						if (__props.run.format === "CSV") _push(`<div class="form-field ir-decimal" data-v-686b2c54${_scopeId}><label class="form-field__label" for="ir-decimal" data-v-686b2c54${_scopeId}>Kommazahlen in der Datei</label><select id="ir-decimal" class="input"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!__props.can.remap) ? " disabled" : ""} data-v-686b2c54${_scopeId}><option value="komma" data-v-686b2c54${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(mappingForm).dezimal) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(mappingForm).dezimal, "komma") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(mappingForm).dezimal, "komma")) ? " selected" : ""}${_scopeId}>mit Komma: 8,5 und 189,00</option><option value="punkt" data-v-686b2c54${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(mappingForm).dezimal) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(mappingForm).dezimal, "punkt") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(mappingForm).dezimal, "punkt")) ? " selected" : ""}${_scopeId}>mit Punkt: 8.5 und 189.00</option></select></div>`);
						else _push(`<!---->`);
						if (__props.can.remap) {
							_push(`<div class="ir-map__actions" data-v-686b2c54${_scopeId}><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(mappingForm).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(mappingForm).processing ? "true" : void 0)} data-v-686b2c54${_scopeId}>Neu prüfen</button>`);
							if ((0, vue_exports.unref)(mappingForm).isDirty) _push(`<p class="adm-note" data-v-686b2c54${_scopeId}>Die Zuordnung ist geändert. Prüf neu, bevor du importierst.</p>`);
							else _push(`<!---->`);
							_push(`</div>`);
						} else _push(`<!---->`);
						_push(`</form></section><p class="im-back" data-v-686b2c54${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/admin/katalog/import" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Zurück zum Import`);
								else return [(0, vue_exports.createTextVNode)("Zurück zum Import")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`</p>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: confirmOpen.value,
							"onUpdate:open": ($event) => confirmOpen.value = $event,
							title: confirmText.value.title,
							body: confirmText.value.body,
							"confirm-label": confirmText.value.label,
							busy: busy.value,
							onConfirm: runStep
						}, null, _parent, _scopeId));
					} else return [
						serverError.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-alert",
							role: "alert"
						}, (0, vue_exports.toDisplayString)(serverError.value), 1)) : (0, vue_exports.createCommentVNode)("", true),
						__props.run.status === "applied" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 1,
							class: "adm-note im-state"
						}, "Importiert am " + (0, vue_exports.toDisplayString)(__props.run.appliedAt) + ".", 1)) : __props.run.status === "rolled_back" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 2,
							class: "adm-note im-state"
						}, "Importiert am " + (0, vue_exports.toDisplayString)(__props.run.appliedAt) + ", zurückgenommen am " + (0, vue_exports.toDisplayString)(__props.run.rolledBackAt) + ".", 1)) : (0, vue_exports.createCommentVNode)("", true),
						ready.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 3,
							class: "adm-section",
							"aria-labelledby": "ir-h-result"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "ir-h-result",
								class: "adm-section__title"
							}, (0, vue_exports.toDisplayString)(__props.run.status === "previewed" ? "Probelauf" : "Ergebnis"), 1)]),
							(0, vue_exports.createVNode)("dl", { class: "ir-counts" }, [
								(0, vue_exports.createVNode)("div", { class: "ir-count" }, [(0, vue_exports.createVNode)("dt", null, "Neue Größen"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(s.value.create ?? 0, 0)), 1)]),
								(0, vue_exports.createVNode)("div", { class: "ir-count" }, [(0, vue_exports.createVNode)("dt", null, "Geänderte Größen"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(s.value.update ?? 0, 0)), 1)]),
								(0, vue_exports.createVNode)("div", { class: "ir-count" }, [(0, vue_exports.createVNode)("dt", null, "Unverändert"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(s.value.unchanged ?? 0, 0)), 1)]),
								(0, vue_exports.createVNode)("div", { class: ["ir-count", { "ir-count--bad": (s.value.refused ?? 0) > 0 }] }, [(0, vue_exports.createVNode)("dt", null, "Abgelehnt"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(s.value.refused ?? 0, 0)), 1)], 2)
							]),
							(s.value.brands ?? 0) + (s.value.models ?? 0) + (s.value.finishes ?? 0) > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-note"
							}, " Dabei neu: " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(s.value.brands ?? 0, 0)) + " " + (0, vue_exports.toDisplayString)(s.value.brands === 1 ? "Marke" : "Marken") + ", " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(s.value.models ?? 0, 0)) + " " + (0, vue_exports.toDisplayString)(s.value.models === 1 ? "Modell" : "Modelle") + ", " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(s.value.finishes ?? 0, 0)) + " " + (0, vue_exports.toDisplayString)(s.value.finishes === 1 ? "Ausführung" : "Ausführungen") + ". Neue Modelle sind Entwürfe. ", 1)) : (0, vue_exports.createCommentVNode)("", true),
							__props.run.status === "previewed" && importable.value === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 1,
								class: "adm-note"
							}, "Nichts zu importieren: Jede Zeile ist entweder schon so im Katalog oder abgelehnt.")) : (0, vue_exports.createCommentVNode)("", true),
							__props.run.refusedHref ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 2,
								class: "adm-note"
							}, [(0, vue_exports.createVNode)("a", {
								href: __props.run.refusedHref,
								download: ""
							}, "Abgelehnte Zeilen als CSV", 8, ["href"]), (0, vue_exports.createTextVNode)(" – mit dem Grund und der Zeile, wie sie in der Datei stand. Korrigiert kannst du sie wieder hochladen. ")])) : (0, vue_exports.createCommentVNode)("", true),
							__props.rows.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 3,
								class: "adm-panel ir-rows"
							}, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [
								(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Zeilen der Datei, die sich ändern oder abgelehnt sind"),
								(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
									(0, vue_exports.createVNode)("th", {
										scope: "col",
										class: "num"
									}, "Zeile"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "SKU"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Felge"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Änderung"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Einzelheiten")
								])]),
								(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.rows, (row) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: row.line }, [
										(0, vue_exports.createVNode)("td", {
											"data-label": "Zeile",
											class: "num"
										}, [(0, vue_exports.createVNode)("span", { class: "ir-line-word" }, "Zeile "), (0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(row.line), 1)]),
										(0, vue_exports.createVNode)("td", {
											"data-label": "SKU",
											class: "ir-sku"
										}, (0, vue_exports.toDisplayString)(row.sku || "–"), 1),
										(0, vue_exports.createVNode)("td", {
											"data-label": "Felge",
											class: "ir-label"
										}, (0, vue_exports.toDisplayString)(row.label), 1),
										(0, vue_exports.createVNode)("td", {
											"data-label": "Änderung",
											"data-phone": "status"
										}, [ACTIONS[row.action].tag ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: ACTIONS[row.action].tag
										}, (0, vue_exports.toDisplayString)(ACTIONS[row.action].label), 3)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(ACTIONS[row.action].label), 1)], 64))]),
										(0, vue_exports.createVNode)("td", {
											"data-label": "Einzelheiten",
											class: "ir-detail"
										}, [row.action === "refused" ? ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, (0, vue_exports.renderList)(row.reasons, (reason) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: reason,
												class: "ir-line"
											}, (0, vue_exports.toDisplayString)(reason), 1);
										}), 128)) : row.action === "update" ? ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, (0, vue_exports.renderList)(row.changes, (change) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: change.field,
												class: "ir-line"
											}, (0, vue_exports.toDisplayString)(change.field) + ": " + (0, vue_exports.toDisplayString)(change.from) + " → " + (0, vue_exports.toDisplayString)(change.to), 1);
										}), 128)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(newParts(row) || "Neue Größe"), 1)], 64))])
									]);
								}), 128))])
							])])) : (0, vue_exports.createCommentVNode)("", true),
							__props.hiddenRows === 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 4,
								class: "adm-note"
							}, "Eine weitere Zeile ist in den Zahlen oben enthalten, aber hier nicht aufgeführt.")) : __props.hiddenRows ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 5,
								class: "adm-note"
							}, "Weitere " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.hiddenRows, 0)) + " Zeilen sind in den Zahlen oben enthalten, aber hier nicht aufgeführt.", 1)) : (0, vue_exports.createCommentVNode)("", true)
						])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "ir-h-map"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "ir-h-map",
								class: "adm-section__title"
							}, "Zuordnung der Spalten")]),
							!ready.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-alert",
								role: "alert"
							}, "Diese Felder brauchen noch eine Spalte aus der Datei: " + (0, vue_exports.toDisplayString)(__props.missing.join(", ")) + ". Erst dann kann der Probelauf die Zeilen prüfen.", 1)) : (0, vue_exports.createCommentVNode)("", true),
							__props.run.mappingRemembered ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 1,
								class: "adm-note"
							}, " Übernommen aus dem letzten Import " + (0, vue_exports.toDisplayString)(__props.run.supplier ? `für „${__props.run.supplier}“` : "ohne Lieferantennamen") + ". ", 1)) : __props.run.status === "previewed" && importable.value > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 2,
								class: "adm-note"
							}, " Erkannt an den Spaltennamen. Mit dem Import wird diese Zuordnung" + (0, vue_exports.toDisplayString)(__props.run.supplier ? ` für „${__props.run.supplier}“` : "") + " gespeichert. ", 1)) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("form", {
								class: "ir-map",
								onSubmit: (0, vue_exports.withModifiers)(remap, ["prevent"])
							}, [
								(0, vue_exports.createVNode)("div", { class: "adm-panel" }, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [
									(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Welche Spalte der Datei welches Feld füllt"),
									(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
										(0, vue_exports.createVNode)("th", { scope: "col" }, "Feld"),
										(0, vue_exports.createVNode)("th", { scope: "col" }, "Spalte aus der Datei"),
										(0, vue_exports.createVNode)("th", { scope: "col" }, "Erster Wert")
									])]),
									(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.fields, (field) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: field.key }, [
											(0, vue_exports.createVNode)("td", { "data-label": "Feld" }, [(0, vue_exports.createVNode)("label", {
												for: `ir-map-${field.key}`,
												class: "ir-field"
											}, (0, vue_exports.toDisplayString)(field.label), 9, ["for"]), field.required ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 0,
												class: "ir-req"
											}, "Pflicht")) : (0, vue_exports.createCommentVNode)("", true)]),
											(0, vue_exports.createVNode)("td", { "data-label": "Spalte" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
												id: `ir-map-${field.key}`,
												"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(mappingForm).mapping[field.key] = $event,
												class: "input ir-select",
												disabled: !__props.can.remap
											}, [(0, vue_exports.createVNode)("option", { value: "" }, "– keine –"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.headers, (header) => {
												return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
													key: header,
													value: header
												}, (0, vue_exports.toDisplayString)(header), 9, ["value"]);
											}), 128))], 8, [
												"id",
												"onUpdate:modelValue",
												"disabled"
											]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(mappingForm).mapping[field.key]]])]),
											(0, vue_exports.createVNode)("td", {
												"data-label": "Erster Wert",
												class: "ir-example"
											}, (0, vue_exports.toDisplayString)(example(field.key)), 1)
										]);
									}), 128))])
								])]),
								__props.run.format === "CSV" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "form-field ir-decimal"
								}, [(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "ir-decimal"
								}, "Kommazahlen in der Datei"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "ir-decimal",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(mappingForm).dezimal = $event,
									class: "input",
									disabled: !__props.can.remap
								}, [(0, vue_exports.createVNode)("option", { value: "komma" }, "mit Komma: 8,5 und 189,00"), (0, vue_exports.createVNode)("option", { value: "punkt" }, "mit Punkt: 8.5 und 189.00")], 8, ["onUpdate:modelValue", "disabled"]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(mappingForm).dezimal]])])) : (0, vue_exports.createCommentVNode)("", true),
								__props.can.remap ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 1,
									class: "ir-map__actions"
								}, [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "submit",
									disabled: (0, vue_exports.unref)(mappingForm).processing,
									"aria-busy": (0, vue_exports.unref)(mappingForm).processing ? "true" : void 0
								}, "Neu prüfen", 8, ["disabled", "aria-busy"]), (0, vue_exports.unref)(mappingForm).isDirty ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 0,
									class: "adm-note"
								}, "Die Zuordnung ist geändert. Prüf neu, bevor du importierst.")) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true)
							], 32)
						]),
						(0, vue_exports.createVNode)("p", { class: "im-back" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), { href: "/admin/katalog/import" }, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Zurück zum Import")]),
							_: 1
						})]),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: confirmOpen.value,
							"onUpdate:open": ($event) => confirmOpen.value = $event,
							title: confirmText.value.title,
							body: confirmText.value.body,
							"confirm-label": confirmText.value.label,
							busy: busy.value,
							onConfirm: runStep
						}, null, 8, [
							"open",
							"onUpdate:open",
							"title",
							"body",
							"confirm-label",
							"busy"
						])
					];
				}),
				_: 2
			}, [__props.can.apply && ready.value && importable.value > 0 ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(mappingForm).isDirty) ? " disabled" : ""} data-v-686b2c54${_scopeId}>Importieren</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						disabled: (0, vue_exports.unref)(mappingForm).isDirty,
						onClick: ($event) => step.value = "importieren"
					}, "Importieren", 8, ["disabled", "onClick"])];
				}),
				key: "0"
			} : __props.can.rollback ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-686b2c54${_scopeId}>Import zurücknehmen</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: ($event) => step.value = "zuruecknehmen"
					}, "Import zurücknehmen", 8, ["onClick"])];
				}),
				key: "1"
			} : void 0]), _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Katalog/ImportRun.vue
var _sfc_setup = ImportRun_vue_vue_type_script_setup_true_lang_default.setup;
ImportRun_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Katalog/ImportRun.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var ImportRun_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ImportRun_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-686b2c54"]]);
//#endregion
export { ImportRun_default as default };
