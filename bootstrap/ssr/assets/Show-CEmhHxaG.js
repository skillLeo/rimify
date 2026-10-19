import { t as Dialog_default } from "./Dialog-BPdFERzS.js";
import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage--fCiRsQr.js";
import { c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { t as AdminConfirm_default } from "./AdminConfirm-CuIy_ILR.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { t as ConditionGroups_default } from "./ConditionGroups-DPIzVLfb.js";
import { n as focusRefused, t as afterDialogsClose } from "./focusRefused-BCX3fX_F.js";
import { t as Auflagenverzeichnis_default } from "./Auflagenverzeichnis-BYD5Nuhf.js";
import { t as CombinationsCard_default } from "./CombinationsCard-B2SoJ7rP.js";
import { t as CountCard_default } from "./CountCard-igqmvzBq.js";
import { t as DeratingTable_default } from "./DeratingTable-CfsSbq19.js";
import { t as DocumentExtras_default } from "./DocumentExtras-CTyjE1eW.js";
import { t as FactsDialog_default } from "./FactsDialog-DR-GNFGX.js";
import { t as ReleaseDialog_default } from "./ReleaseDialog-BmvqOd9D.js";
import { a as formFromRow, c as unreadable, o as payload, r as codesText, s as settleSizes, t as RowFields_default } from "./RowFields-oIGHC7_9.js";
import { t as RowComposer_default } from "./RowComposer-CmoGNC-9.js";
//#region resources/js/Pages/Admin/Gutachten/derating.ts
/** Whether the section stands whole: the document prints one, as the record says — or a table is entered anyway. */
function deratingShown(source, rows) {
	return source === "table" || rows > 0;
}
/** The folded line: what is not recorded, why no table is asked for, and — while it can be entered — how to ask for it. */
function deratingAbsent(source, mayEnter) {
	return `Zu diesem Gutachten ist keine Tragfähigkeitstabelle für hohe Geschwindigkeit hinterlegt. ${{
		document: "Laut den Angaben stehen Lastindex und Geschwindigkeitssymbol bei jeder Reifengröße. Eine Tabelle erfasst du nur bei einem Gutachten, das laut den Angaben eine druckt.",
		papers: "Laut den Angaben verweist es für Lastindex und Geschwindigkeitssymbol auf die Fahrzeugpapiere. Eine Tabelle erfasst du nur bei einem Gutachten, das laut den Angaben eine druckt.",
		table: "",
		"": "Ob es eine druckt, gibst du unter „Angaben ändern“ an – in der Frage zu Lastindex und Geschwindigkeitssymbol."
	}[source]}${mayEnter && (source === "document" || source === "papers") ? " Druckt dieses Gutachten doch eine, wähl unter „Angaben ändern“ die Tabelle und trag sie dann hier ein." : ""}`.trim();
}
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Show.vue?vue&type=script&setup=true&lang.ts
var ENTRY_LINE = "Eintragung in die Fahrzeugpapiere erforderlich.";
var Show_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Show",
	__ssrInlineRender: true,
	props: {
		document: {},
		rows: {},
		vehicles: {},
		blockers: {},
		preview: {},
		previewVehicle: {},
		conditions: {},
		choices: {},
		unresolved: {},
		kinds: {},
		replaceable: {},
		supplementable: {},
		fasteners: {},
		notices: {},
		reworks: {},
		derating: {},
		combinations: {},
		openConflicts: {},
		can: {},
		revisionDraft: {},
		levels: {},
		levelFloorSentence: {}
	},
	setup(__props) {
		/**
		* Gutachten › one document — the workspace the compliance team enters a Gutachten in (the review
		* release §4.3): its facts and PDF, the Verwendungsbereich rows grouped by vehicle, the form that adds
		* rows for vehicles × sizes, the preview of what the shop will say, and the Freigabe.
		*
		* The Freigabe is the document's, never a row's: all rows become visible at once. What stops it is
		* said above the rows. A page number on a row opens the PDF at that page.
		*/
		const props = __props;
		const page = usePage();
		const draft = (0, vue_exports.computed)(() => props.document.status === "draft");
		const countFirst = (0, vue_exports.computed)(() => draft.value && !props.document.count && props.rows.length === 0);
		const context = (0, vue_exports.computed)(() => {
			const n = props.rows.length;
			const rows = n === 1 ? "1 Zeile" : `${decimal(n, 0)} Zeilen`;
			return `${props.document.statusLabel} · ${rows} · Fassung ${props.document.revision}`;
		});
		/** Rows by vehicle, in the order the server sent them. */
		const groups = (0, vue_exports.computed)(() => {
			const out = [];
			for (const row of props.rows) {
				const last = out[out.length - 1];
				if (last && last.vehicleId === row.vehicleId) last.rows.push(row);
				else out.push({
					vehicleId: row.vehicleId,
					vehicle: row.vehicle,
					rows: [row]
				});
			}
			return out;
		});
		function pageHref(n) {
			return props.document.pdfUrl && n !== null ? `${props.document.pdfUrl}#page=${n}` : null;
		}
		const releaseError = (0, vue_exports.computed)(() => (page.props.errors ?? {}).release ?? "");
		/** The document prints a table of tyre load at speed, as the record says (D-277): entered here, released only with it. */
		const deratingRequired = (0, vue_exports.computed)(() => props.document.shape.tyre_index_source === "table");
		/** Shown whole where the document prints one — or where one is entered all the same; otherwise one line, folded away. */
		const deratingShown$1 = (0, vue_exports.computed)(() => deratingShown(props.document.shape.tyre_index_source, props.derating.rows.length));
		/** The folded line, in finding 104's words, and why no table is asked for (derating.ts, R-17). */
		const deratingAbsent$1 = (0, vue_exports.computed)(() => deratingAbsent(props.document.shape.tyre_index_source, props.can.edit && draft.value));
		const factsOpen = (0, vue_exports.ref)(false);
		const more = (0, vue_exports.computed)(() => {
			const actions = [];
			if (props.document.pdfUrl) actions.push({
				label: "PDF öffnen",
				href: props.document.pdfUrl,
				external: true,
				icon: "documents"
			});
			if (props.can.edit) actions.push({
				label: "Angaben ändern",
				run: () => factsOpen.value = true,
				icon: "edit"
			});
			return actions;
		});
		const releaseOpen = (0, vue_exports.ref)(false);
		const answerOpen = (0, vue_exports.ref)(false);
		const releaseNote = (0, vue_exports.computed)(() => {
			if (props.rows.length === 0) return "Mit der Freigabe übernimmt der Shop die Angaben dieses Grundgutachtens für seine Nachträge. Eigene Zeilen hat es nicht.";
			return props.rows.length === 1 ? "Mit der Freigabe gilt die Zeile sofort im Shop. Prüf sie vorher in der Vorschau unten." : `Mit der Freigabe gelten alle ${decimal(props.rows.length, 0)} Zeilen auf einmal im Shop. Prüf sie vorher in der Vorschau unten.`;
		});
		const releaseBody = (0, vue_exports.computed)(() => {
			return `${props.rows.length === 0 ? "Der Shop übernimmt danach die Angaben dieses Grundgutachtens für seine Nachträge." : `${props.rows.length === 1 ? "Die Zeile gilt" : `Alle ${decimal(props.rows.length, 0)} Zeilen gelten`} danach sofort im Shop.`} Angaben, Codes und Zeilen lassen sich dann nicht mehr ändern – eine Korrektur geht über „Neue Fassung anlegen“, und die neue Fassung ersetzt dieses Gutachten, sobald sie freigegeben ist.`;
		});
		const reviseOpen = (0, vue_exports.ref)(false);
		const reviseBusy = (0, vue_exports.ref)(false);
		function revise() {
			reviseBusy.value = true;
			router.post(`/admin/gutachten/${props.document.id}/neue-fassung`, {}, { onFinish: () => {
				reviseBusy.value = false;
				reviseOpen.value = false;
			} });
		}
		function focusState() {
			(0, vue_exports.nextTick)(() => document.getElementById("gs-state-h")?.focus());
		}
		(0, vue_exports.watch)(() => props.document.status, (now, was) => {
			if (now === "published" && was === "draft") focusState();
		}, { flush: "post" });
		const editing = (0, vue_exports.ref)(null);
		const editForm = (0, vue_exports.ref)(null);
		const editErrors = (0, vue_exports.ref)({});
		const editBusy = (0, vue_exports.ref)(false);
		const editOpen = (0, vue_exports.computed)({
			get: () => editing.value !== null,
			set: (open) => {
				if (!open) editing.value = null;
			}
		});
		function edit(row) {
			editing.value = row;
			editForm.value = formFromRow(row);
			editErrors.value = {};
		}
		function saveRow() {
			const row = editing.value;
			const form = editForm.value;
			if (!row || !form || editBusy.value) return;
			settleSizes(form);
			if (unreadable(form).length > 0) {
				editErrors.value = { ...editErrors.value };
				focusRefused(".gs-dialog");
				return;
			}
			editBusy.value = true;
			router.put(`/admin/gutachten/${props.document.id}/zeilen/${row.id}`, payload(form), {
				preserveScroll: true,
				onSuccess: () => editing.value = null,
				onError: (bag) => {
					editErrors.value = bag;
					focusRefused(".gs-dialog");
				},
				onFinish: () => editBusy.value = false
			});
		}
		function editSizesChanged() {
			editErrors.value = Object.fromEntries(Object.entries(editErrors.value).filter(([key]) => !key.startsWith("tyre_sizes")));
		}
		const removing = (0, vue_exports.ref)(null);
		const removeOpen = (0, vue_exports.computed)({
			get: () => removing.value !== null,
			set: (open) => {
				if (!open) removing.value = null;
			}
		});
		const removeBusy = (0, vue_exports.ref)(false);
		const removeBody = (0, vue_exports.ref)("");
		(0, vue_exports.watch)(removing, (row) => {
			if (row) removeBody.value = `${row.wheel} ${row.size} für ${row.vehicle} wird aus dem Verwendungsbereich entfernt.`;
		});
		function remove() {
			const row = removing.value;
			if (!row || removeBusy.value) return;
			const place = props.rows.findIndex((r) => r.id === row.id);
			removeBusy.value = true;
			removing.value = null;
			afterDialogsClose(() => {
				router.delete(`/admin/gutachten/${props.document.id}/zeilen/${row.id}`, {
					preserveScroll: true,
					onFinish: () => {
						removeBusy.value = false;
						(0, vue_exports.nextTick)(() => {
							const next = props.rows[Math.min(place, props.rows.length - 1)];
							((next ? document.querySelector(`[data-row-edit="${next.id}"]`) : null) ?? document.getElementById("gs-rows-h"))?.focus();
						});
					}
				});
			});
		}
		const previewVehicle = (0, vue_exports.ref)(props.previewVehicle ?? props.vehicles[0]?.id ?? null);
		const previewBusy = (0, vue_exports.ref)(false);
		(0, vue_exports.watch)(() => props.vehicles, (vehicles) => {
			if (previewVehicle.value === null || !vehicles.some((v) => v.id === previewVehicle.value)) previewVehicle.value = props.previewVehicle ?? vehicles[0]?.id ?? null;
		});
		/** The vehicle the verdicts on screen were computed for — named above them, so they are never read as another's. */
		const previewFor = (0, vue_exports.computed)(() => props.vehicles.find((v) => v.id === props.previewVehicle)?.label ?? null);
		function loadPreview() {
			if (previewVehicle.value === null) return;
			previewBusy.value = true;
			router.reload({
				only: ["preview", "previewVehicle"],
				data: { fahrzeug: previewVehicle.value },
				onFinish: () => previewBusy.value = false
			});
		}
		/** The preview's entry line, as the shop's panel says it. */
		const TONE = {
			PERMITTED: null,
			CONDITIONAL: "adm-tag adm-tag--warn",
			NOT_PERMITTED: "adm-tag adm-tag--bad",
			UNKNOWN: "adm-tag adm-tag--neutral"
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: __props.document.label,
				context: context.value,
				more: more.value,
				"read-only": !__props.can.edit && draft.value
			}, _attrs), (0, vue_exports.createSlots)({
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<section class="${(0, server_renderer_exports.ssrRenderClass)([{ "gs-state--blocked": draft.value && __props.blockers.length }, "gs-state"])}" aria-labelledby="gs-state-h" data-v-2f596fdc${_scopeId}><h2 id="gs-state-h" class="gs-state__title" tabindex="-1" data-v-2f596fdc${_scopeId}>`);
						if (draft.value && __props.blockers.length) _push(`<!--[-->Noch nicht freigebbar<!--]-->`);
						else if (draft.value) _push(`<!--[-->Kann freigegeben werden<!--]-->`);
						else {
							_push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(__props.document.statusLabel)}`);
							if (__props.document.status === "published" && __props.document.validFrom) _push(`<!--[--> seit ${(0, server_renderer_exports.ssrInterpolate)(__props.document.validFrom)}<!--]-->`);
							else if (__props.document.status !== "published" && __props.document.validTo) _push(`<!--[--> seit ${(0, server_renderer_exports.ssrInterpolate)(__props.document.validTo)}<!--]-->`);
							else _push(`<!---->`);
							_push(`<!--]-->`);
						}
						_push(`</h2>`);
						if (draft.value && __props.blockers.length) {
							_push(`<ul class="gs-state__list" data-v-2f596fdc${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.blockers, (line) => {
								_push(`<li data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line)}</li>`);
							});
							_push(`<!--]--></ul>`);
						} else if (draft.value) _push(`<p class="adm-note" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(releaseNote.value)}</p>`);
						else if (__props.document.status === "withdrawn") _push(`<p class="adm-note" data-v-2f596fdc${_scopeId}>Dieses Dokument wurde zurückgezogen. Seine Zeilen sind nicht mehr im Shop; Bestellungen darauf bleiben erklärbar.</p>`);
						else if (__props.document.status === "superseded") _push(`<p class="adm-note" data-v-2f596fdc${_scopeId}>Eine neuere Fassung hat dieses Dokument ersetzt. Seine Zeilen sind nicht mehr im Shop; Bestellungen darauf bleiben erklärbar.</p>`);
						else if (__props.revisionDraft) _push(`<p class="adm-note" data-v-2f596fdc${_scopeId}>Angaben, Codes und Zeilen eines freigegebenen Gutachtens lassen sich nicht mehr ändern. Fassung ${(0, server_renderer_exports.ssrInterpolate)(__props.revisionDraft.revision)} ist schon als Entwurf angelegt; sobald sie freigegeben ist, ersetzt sie diese Fassung.</p>`);
						else _push(`<p class="adm-note" data-v-2f596fdc${_scopeId}>Angaben, Codes und Zeilen eines freigegebenen Gutachtens lassen sich nicht mehr ändern. Änderungen gehen über eine neue Fassung: Sie bringt alle Zeilen und Codes mit; sobald sie freigegeben ist, ersetzt sie diese Fassung.</p>`);
						if (__props.document.status === "published") {
							_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([{ "gs-complete--open": !__props.document.completeness }, "gs-complete"])}" data-v-2f596fdc${_scopeId}><p class="adm-note" data-v-2f596fdc${_scopeId}><strong data-v-2f596fdc${_scopeId}>Erfasst:</strong> ${(0, server_renderer_exports.ssrInterpolate)(__props.document.completenessLabel)}`);
							if (__props.document.completenessBy || __props.document.completenessAt) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)([__props.document.completenessBy, __props.document.completenessAt].filter(Boolean).join(", "))}<!--]-->`);
							else _push(`<!---->`);
							_push(`</p>`);
							if (__props.can.answer) _push(`<button class="btn btn--secondary" type="button" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.completeness ? "Antwort ändern" : "Jetzt beantworten")}</button>`);
							else _push(`<!---->`);
							_push(`</div>`);
						} else _push(`<!---->`);
						if (__props.openConflicts) _push(`<p class="adm-note" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.openConflicts === 1 ? "Eine Zeile widerspricht" : `${(0, vue_exports.unref)(decimal)(__props.openConflicts, 0)} Zeilen widersprechen`)} einem anderen Gutachten. Bis unter <a href="/admin/konflikte" data-v-2f596fdc${_scopeId}>Konflikte</a> entschieden ist, sagt der Shop dort „Noch nicht bestätigt“. </p>`);
						else _push(`<!---->`);
						if (releaseError.value) _push(`<p class="adm-alert" role="alert" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(releaseError.value)}</p>`);
						else _push(`<!---->`);
						_push(`</section><section class="adm-section" aria-labelledby="gs-facts-h" data-v-2f596fdc${_scopeId}><div class="adm-section__head" data-v-2f596fdc${_scopeId}><h2 id="gs-facts-h" class="adm-section__title" data-v-2f596fdc${_scopeId}>Angaben</h2>`);
						if (__props.can.edit) {
							_push(`<button class="btn btn--ghost" type="button" data-v-2f596fdc${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "edit",
								size: 20
							}, null, _parent, _scopeId));
							_push(` Ändern </button>`);
						} else _push(`<!---->`);
						_push(`</div><dl class="adm-facts gs-facts" data-v-2f596fdc${_scopeId}><div class="adm-facts__row" data-v-2f596fdc${_scopeId}><dt data-v-2f596fdc${_scopeId}>Art</dt><dd data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.kindLabel)}`);
						if (__props.document.demo) _push(`<span class="adm-tag adm-tag--neutral adm-demo" data-v-2f596fdc${_scopeId}>Demodaten</span>`);
						else _push(`<!---->`);
						_push(`</dd></div>`);
						if (__props.document.kbaNumber) _push(`<div class="adm-facts__row" data-v-2f596fdc${_scopeId}><dt data-v-2f596fdc${_scopeId}>KBA-Nummer</dt><dd data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.kbaNumber)}</dd></div>`);
						else _push(`<!---->`);
						if (__props.document.reportNumber) _push(`<div class="adm-facts__row" data-v-2f596fdc${_scopeId}><dt data-v-2f596fdc${_scopeId}>Gutachten-Nummer</dt><dd data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.reportNumber)}</dd></div>`);
						else _push(`<!---->`);
						if (__props.document.approvalMark) _push(`<div class="adm-facts__row" data-v-2f596fdc${_scopeId}><dt data-v-2f596fdc${_scopeId}>Genehmigungszeichen</dt><dd data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.approvalMark)}</dd></div>`);
						else _push(`<!---->`);
						_push(`<div class="adm-facts__row" data-v-2f596fdc${_scopeId}><dt data-v-2f596fdc${_scopeId}>Aussteller</dt><dd data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.issuer || "–")}</dd></div><div class="adm-facts__row" data-v-2f596fdc${_scopeId}><dt data-v-2f596fdc${_scopeId}>Ausgestellt am</dt><dd data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.issuedOnLabel ?? "–")}</dd></div><div class="adm-facts__row" data-v-2f596fdc${_scopeId}><dt data-v-2f596fdc${_scopeId}>Seiten</dt><dd data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.pageCount ?? "–")}</dd></div><div class="adm-facts__row" data-v-2f596fdc${_scopeId}><dt data-v-2f596fdc${_scopeId}>Fassung</dt><dd data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.revision)}`);
						if (__props.document.supersedesLabel) _push(`<!--[--> · ersetzt ${(0, server_renderer_exports.ssrInterpolate)(__props.document.supersedesLabel)}<!--]-->`);
						else _push(`<!---->`);
						_push(`</dd></div>`);
						if (__props.document.supplementTo) {
							_push(`<div class="adm-facts__row" data-v-2f596fdc${_scopeId}><dt data-v-2f596fdc${_scopeId}>Nachtrag zu</dt><dd data-v-2f596fdc${_scopeId}>`);
							if (__props.document.supplementTo.href) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", __props.document.supplementTo.href)} data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.supplementTo.label)}</a>`);
							else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(__props.document.supplementTo.label)} – liegt uns nicht vor<!--]-->`);
							if (__props.document.baseMissing) _push(`<span class="gs-sub" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.baseMissing)}</span>`);
							else _push(`<!---->`);
							_push(`</dd></div>`);
						} else _push(`<!---->`);
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.document.header, (entry) => {
							_push(`<div class="adm-facts__row" data-v-2f596fdc${_scopeId}><dt data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.label)}</dt><dd data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.value)}</dd></div>`);
						});
						_push(`<!--]-->`);
						if (__props.document.scopeIncomplete) _push(`<div class="adm-facts__row" data-v-2f596fdc${_scopeId}><dt data-v-2f596fdc${_scopeId}>Verwendungsbereich</dt><dd data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.scopeIncomplete)}</dd></div>`);
						else _push(`<!---->`);
						_push(`<div class="adm-facts__row" data-v-2f596fdc${_scopeId}><dt data-v-2f596fdc${_scopeId}>PDF</dt><dd data-v-2f596fdc${_scopeId}>`);
						if (__props.document.pdfUrl) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", __props.document.pdfUrl)} target="_blank" rel="noopener" data-v-2f596fdc${_scopeId}>PDF öffnen</a>`);
						else if (__props.document.pdfMissing) _push(`<!--[-->Die Datei fehlt im Speicher. Lad das PDF über „Ändern“ neu hoch.<!--]-->`);
						else _push(`<!--[-->Kein PDF hinterlegt<!--]-->`);
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.document.samePdf ?? [], (twin) => {
							_push(`<span class="gs-sub gs-same-pdf" data-v-2f596fdc${_scopeId}> Dieselbe Datei liegt auch bei <a${(0, server_renderer_exports.ssrRenderAttr)("href", twin.href)} data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(twin.label)}</a> (${(0, server_renderer_exports.ssrInterpolate)(twin.status)}`);
							if (twin.demo) _push(`<!--[-->, Demodaten<!--]-->`);
							else _push(`<!---->`);
							_push(`). </span>`);
						});
						_push(`<!--]--></dd></div></dl></section>`);
						if (draft.value || __props.document.count) {
							_push(`<section class="adm-section" aria-labelledby="gs-count-h" data-v-2f596fdc${_scopeId}><div class="adm-section__head" data-v-2f596fdc${_scopeId}><h2 id="gs-count-h" class="adm-section__title" data-v-2f596fdc${_scopeId}>Zählung</h2></div>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(CountCard_default, {
								"document-id": __props.document.id,
								count: __props.document.count ?? null,
								editable: __props.can.edit && draft.value,
								"page-count": __props.document.pageCount,
								rows: __props.rows.length
							}, null, _parent, _scopeId));
							_push(`</section>`);
						} else _push(`<!---->`);
						_push(`<section class="adm-section" aria-labelledby="gs-conditions-h" data-v-2f596fdc${_scopeId}><div class="adm-section__head" data-v-2f596fdc${_scopeId}><h2 id="gs-conditions-h" class="adm-section__title" data-v-2f596fdc${_scopeId}>Auflagenverzeichnis</h2></div><p class="adm-note gs-lead" data-v-2f596fdc${_scopeId}>Die Zeilen nennen nur Codes. Was ein Code bedeutet, steht hier – so, wie dieses Gutachten ihn druckt.</p>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Auflagenverzeichnis_default, {
							"document-id": __props.document.id,
							conditions: __props.conditions,
							choices: __props.choices,
							unresolved: __props.unresolved,
							editable: __props.can.edit && draft.value,
							"page-count": __props.document.pageCount,
							levels: __props.levels,
							"levels-editable": __props.can.levels === true,
							"level-floor-sentence": __props.levelFloorSentence
						}, null, _parent, _scopeId));
						_push(`</section><section class="adm-section" aria-labelledby="gs-extras-h" data-v-2f596fdc${_scopeId}><div class="adm-section__head" data-v-2f596fdc${_scopeId}><h2 id="gs-extras-h" class="adm-section__title" data-v-2f596fdc${_scopeId}>Befestigung und Hinweise</h2></div>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(DocumentExtras_default, {
							"document-id": __props.document.id,
							fasteners: __props.fasteners,
							notices: __props.notices,
							reworks: __props.reworks,
							conditions: __props.conditions,
							editable: __props.can.edit && draft.value,
							"page-count": __props.document.pageCount
						}, null, _parent, _scopeId));
						_push(`</section>`);
						if (deratingShown$1.value) {
							_push(`<section class="adm-section" aria-labelledby="gs-derating-h" data-v-2f596fdc${_scopeId}><div class="adm-section__head" data-v-2f596fdc${_scopeId}><h2 id="gs-derating-h" class="adm-section__title" data-v-2f596fdc${_scopeId}>Tragfähigkeit bei hoher Geschwindigkeit</h2>`);
							if (__props.derating.seededFrom) _push(`<span class="adm-tag adm-tag--neutral" data-v-2f596fdc${_scopeId}>Demodaten</span>`);
							else _push(`<!---->`);
							_push(`</div>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(DeratingTable_default, {
								"document-id": __props.document.id,
								derating: __props.derating,
								editable: __props.can.edit && draft.value,
								"page-count": __props.document.pageCount,
								required: deratingRequired.value
							}, null, _parent, _scopeId));
							_push(`</section>`);
						} else _push(`<details class="adm-section gs-fold" data-v-2f596fdc${_scopeId}><summary class="gs-fold__summary" data-v-2f596fdc${_scopeId}><h2 id="gs-derating-h" class="adm-section__title" data-v-2f596fdc${_scopeId}>Tragfähigkeit bei hoher Geschwindigkeit</h2><span class="gs-fold__state" data-v-2f596fdc${_scopeId}>Keine Tabelle hinterlegt</span></summary><p class="adm-note" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(deratingAbsent$1.value)}</p></details>`);
						_push(`<section class="adm-section" aria-labelledby="gs-combinations-h" data-v-2f596fdc${_scopeId}><div class="adm-section__head" data-v-2f596fdc${_scopeId}><h2 id="gs-combinations-h" class="adm-section__title" data-v-2f596fdc${_scopeId}>Bereifungskombinationen</h2></div>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(CombinationsCard_default, {
							"document-id": __props.document.id,
							combinations: __props.combinations,
							editable: __props.can.edit && draft.value,
							"page-count": __props.document.pageCount
						}, null, _parent, _scopeId));
						_push(`</section><section class="adm-section" aria-labelledby="gs-rows-h" data-v-2f596fdc${_scopeId}><div class="adm-section__head" data-v-2f596fdc${_scopeId}><h2 id="gs-rows-h" class="adm-section__title" tabindex="-1" data-v-2f596fdc${_scopeId}>Verwendungsbereich</h2></div>`);
						if (__props.rows.length === 0) _push(`<p class="adm-note" data-v-2f596fdc${_scopeId}>Noch keine Zeile. ${(0, server_renderer_exports.ssrInterpolate)(__props.can.edit ? countFirst.value ? "Erst zählen, dann erfassen: Sobald die Zählung oben gespeichert ist, legst du unten die ersten Zeilen an." : "Leg unten die ersten an: Fahrzeuge und Größen wählen, Reifengrößen und Auflagen eintragen." : "")}</p>`);
						else _push(`<!---->`);
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(groups.value, (group) => {
							_push(`<div class="gs-group" data-v-2f596fdc${_scopeId}><h3 class="gs-group__title" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(group.vehicle)}</h3><div class="adm-panel" data-v-2f596fdc${_scopeId}><table class="adm-table gs-table" data-v-2f596fdc${_scopeId}><caption class="visually-hidden" data-v-2f596fdc${_scopeId}>Zeilen für ${(0, server_renderer_exports.ssrInterpolate)(group.vehicle)}</caption><thead data-v-2f596fdc${_scopeId}><tr data-v-2f596fdc${_scopeId}><th scope="col" data-v-2f596fdc${_scopeId}>Felge</th><th scope="col" data-v-2f596fdc${_scopeId}>Reifen</th><th scope="col" data-v-2f596fdc${_scopeId}>Auflagen</th><th scope="col" data-v-2f596fdc${_scopeId}>Eintragung</th><th scope="col" class="num" data-v-2f596fdc${_scopeId}>Seite</th>`);
							if (__props.can.edit) _push(`<th scope="col" data-v-2f596fdc${_scopeId}><span class="visually-hidden" data-v-2f596fdc${_scopeId}>Aktionen</span></th>`);
							else _push(`<!---->`);
							_push(`</tr></thead><tbody data-v-2f596fdc${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(group.rows, (row) => {
								_push(`<tr data-v-2f596fdc${_scopeId}><td data-label="Felge" data-v-2f596fdc${_scopeId}><span class="gs-wheel" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.wheel)}</span><span class="gs-sub" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.size)}`);
								if (row.finish) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(row.finish)}<!--]-->`);
								else _push(`<!---->`);
								if (row.axle !== "ALL") _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(row.axleLabel)}<!--]-->`);
								else _push(`<!---->`);
								_push(`</span></td><td data-label="Reifen" data-v-2f596fdc${_scopeId}>`);
								if (row.tyreSizes.length === 0) _push(`<span class="gs-missing" data-v-2f596fdc${_scopeId}>Keine Reifengröße – im Shop nicht bestellbar</span>`);
								else {
									_push(`<span data-v-2f596fdc${_scopeId}><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(row.tyreSizes, (size) => {
										_push(`<span class="gs-line" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(size.label)}`);
										if (size.codes.length) _push(`<span class="gs-codes" translate="no" data-v-2f596fdc${_scopeId}> · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(codesText)(size.codes.map((c) => c.code)))}</span>`);
										else _push(`<!---->`);
										_push(`</span>`);
									});
									_push(`<!--]--></span>`);
								}
								_push(`</td><td data-label="Auflagen" data-v-2f596fdc${_scopeId}>`);
								if (row.conditions.length === 0) _push(`<span data-v-2f596fdc${_scopeId}>–</span>`);
								else {
									_push(`<span data-v-2f596fdc${_scopeId}><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(row.conditions, (c) => {
										_push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([{ "gs-undefined": !c.defined }, "gs-line"])}" data-v-2f596fdc${_scopeId}><b class="gs-code" translate="no" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(c.code)}</b> ${(0, server_renderer_exports.ssrInterpolate)(c.text ?? "Nicht im Auflagenverzeichnis")}`);
										if (c.note) _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(c.note)}<!--]-->`);
										else _push(`<!---->`);
										_push(`</span>`);
									});
									_push(`<!--]--></span>`);
								}
								_push(`</td><td data-label="Eintragung" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.requiresEntry ? "Ja" : "Nein")} `);
								if (row.entryOverride) _push(`<span class="gs-sub" data-v-2f596fdc${_scopeId}>laut Prüfer: ${(0, server_renderer_exports.ssrInterpolate)(row.entryOverrideReason)}</span>`);
								else if (row.entrySource.length) _push(`<span class="gs-sub" data-v-2f596fdc${_scopeId}>aus ${(0, server_renderer_exports.ssrInterpolate)(row.entrySource.join(", "))}</span>`);
								else _push(`<!---->`);
								_push(`</td><td data-label="Seite" class="num" data-v-2f596fdc${_scopeId}>`);
								if (pageHref(row.sourcePage)) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", pageHref(row.sourcePage))} target="_blank" rel="noopener" data-v-2f596fdc${_scopeId}>S. ${(0, server_renderer_exports.ssrInterpolate)(row.sourcePage)}</a>`);
								else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(row.sourcePage ?? "–")}<!--]-->`);
								_push(`</td>`);
								if (__props.can.edit) {
									_push(`<td data-label="Aktionen" class="gs-actions" data-v-2f596fdc${_scopeId}><button class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrRenderAttr)("data-row-edit", row.id)}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Zeile ${row.wheel} ${row.size} ändern`)} title="Ändern" data-v-2f596fdc${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "edit",
										size: 20
									}, null, _parent, _scopeId));
									_push(`</button><button class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Zeile ${row.wheel} ${row.size} entfernen`)} title="Entfernen" data-v-2f596fdc${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "delete",
										size: 20
									}, null, _parent, _scopeId));
									_push(`</button></td>`);
								} else _push(`<!---->`);
								_push(`</tr>`);
							});
							_push(`<!--]--></tbody></table></div></div>`);
						});
						_push(`<!--]--></section>`);
						if (__props.can.edit && !countFirst.value) {
							_push(`<section class="adm-section" aria-labelledby="gs-add-h" data-v-2f596fdc${_scopeId}><div class="adm-section__head" data-v-2f596fdc${_scopeId}><h2 id="gs-add-h" class="adm-section__title" data-v-2f596fdc${_scopeId}>Zeilen hinzufügen</h2></div>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(RowComposer_default, {
								"document-id": __props.document.id,
								conditions: __props.conditions,
								"page-count": __props.document.pageCount,
								"body-forms": __props.choices.bodyForms,
								drives: __props.choices.drives
							}, null, _parent, _scopeId));
							_push(`</section>`);
						} else _push(`<!---->`);
						if (__props.vehicles.length) {
							_push(`<section class="adm-section" aria-labelledby="gs-preview-h" data-v-2f596fdc${_scopeId}><div class="adm-section__head" data-v-2f596fdc${_scopeId}><h2 id="gs-preview-h" class="adm-section__title" data-v-2f596fdc${_scopeId}>Vorschau im Shop</h2></div><p class="adm-note" data-v-2f596fdc${_scopeId}>So antwortet der Shop${(0, server_renderer_exports.ssrInterpolate)(draft.value ? " nach der Freigabe" : "")} für dieses Fahrzeug – berechnet von derselben Prüfung, die jede Kundin und jeder Kunde bekommt.</p><form class="gs-preview-pick" data-v-2f596fdc${_scopeId}><label class="visually-hidden" for="gs-preview-vehicle" data-v-2f596fdc${_scopeId}>Fahrzeug für die Vorschau</label><select id="gs-preview-vehicle" class="input" data-v-2f596fdc${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.vehicles, (vehicle) => {
								_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", vehicle.id)} data-v-2f596fdc${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(previewVehicle.value) ? (0, server_renderer_exports.ssrLooseContain)(previewVehicle.value, vehicle.id) : (0, server_renderer_exports.ssrLooseEqual)(previewVehicle.value, vehicle.id)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.label)}</option>`);
							});
							_push(`<!--]--></select><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(previewBusy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", previewBusy.value ? "true" : void 0)} data-v-2f596fdc${_scopeId}>Vorschau zeigen</button></form>`);
							if (__props.preview && previewFor.value) _push(`<p class="gs-preview-for" data-v-2f596fdc${_scopeId}>Vorschau für ${(0, server_renderer_exports.ssrInterpolate)(previewFor.value)}</p>`);
							else _push(`<!---->`);
							if (__props.preview && __props.preview.length) {
								_push(`<ul class="gs-verdicts" aria-live="polite" data-v-2f596fdc${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.preview, (verdict) => {
									_push(`<li class="gs-verdict" data-v-2f596fdc${_scopeId}><div class="gs-verdict__head" data-v-2f596fdc${_scopeId}><span class="gs-verdict__wheel" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(verdict.wheel)}</span>`);
									if (!verdict.notesOnly && TONE[verdict.status]) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)(TONE[verdict.status])}" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(verdict.statusLabel)}</span>`);
									else _push(`<span class="gs-verdict__ok" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(verdict.statusLabel)}</span>`);
									_push(`</div>`);
									if (verdict.reason) _push(`<p class="gs-verdict__line" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(verdict.reason)}</p>`);
									else _push(`<!---->`);
									if (verdict.front.length) {
										_push(`<p class="gs-verdict__line" data-v-2f596fdc${_scopeId}>Reifen: ${(0, server_renderer_exports.ssrInterpolate)(verdict.front.join(", "))}`);
										if (verdict.rear.length && verdict.rear.join() !== verdict.front.join()) _push(`<!--[--> · hinten ${(0, server_renderer_exports.ssrInterpolate)(verdict.rear.join(", "))}<!--]-->`);
										else _push(`<!---->`);
										_push(`</p>`);
									} else _push(`<!---->`);
									if (verdict.requiresEntry) {
										_push(`<p class="gs-verdict__line" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(verdict.entryLine ?? ENTRY_LINE)}`);
										if (verdict.entryNote) _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(verdict.entryNote)}<!--]-->`);
										else _push(`<!---->`);
										_push(`</p>`);
									} else _push(`<!---->`);
									if (verdict.papersLine) _push(`<p class="gs-verdict__line" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(verdict.papersLine)}</p>`);
									else _push(`<!---->`);
									if (verdict.conditionGroups && verdict.conditions.length) _push((0, server_renderer_exports.ssrRenderComponent)(ConditionGroups_default, {
										class: "gs-verdict__groups",
										groups: verdict.conditionGroups,
										omit: verdict.requiresEntry ? [ENTRY_LINE] : []
									}, null, _parent, _scopeId));
									else {
										_push(`<!--[-->`);
										(0, server_renderer_exports.ssrRenderList)(verdict.conditions.filter((s) => !(verdict.requiresEntry && s === ENTRY_LINE)), (sentence, i) => {
											_push(`<p class="gs-verdict__line" data-v-2f596fdc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(sentence)}</p>`);
										});
										_push(`<!--]-->`);
									}
									_push(`</li>`);
								});
								_push(`<!--]--></ul>`);
							} else if (__props.preview) _push(`<p class="adm-note" data-v-2f596fdc${_scopeId}>Für dieses Fahrzeug ist zu diesem Gutachten keine Zeile hinterlegt.</p>`);
							else _push(`<!---->`);
							_push(`</section>`);
						} else _push(`<!---->`);
						if (__props.can.release) _push((0, server_renderer_exports.ssrRenderComponent)(ReleaseDialog_default, {
							open: releaseOpen.value,
							"onUpdate:open": ($event) => releaseOpen.value = $event,
							mode: "release",
							document: __props.document,
							rows: __props.rows.length,
							note: releaseBody.value,
							onDone: focusState
						}, null, _parent, _scopeId));
						else _push(`<!---->`);
						if (__props.can.answer) _push((0, server_renderer_exports.ssrRenderComponent)(ReleaseDialog_default, {
							open: answerOpen.value,
							"onUpdate:open": ($event) => answerOpen.value = $event,
							mode: "answer",
							document: __props.document,
							rows: __props.rows.length
						}, null, _parent, _scopeId));
						else _push(`<!---->`);
						if (__props.can.revise) _push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: reviseOpen.value,
							"onUpdate:open": ($event) => reviseOpen.value = $event,
							title: "Neue Fassung anlegen?",
							body: "Die neue Fassung beginnt als Entwurf mit allen Angaben, Codes und Zeilen dieser Fassung. Im Shop gilt diese Fassung weiter, bis die neue freigegeben ist und sie ersetzt.",
							"confirm-label": "Neue Fassung anlegen",
							busy: reviseBusy.value,
							onConfirm: revise
						}, null, _parent, _scopeId));
						else _push(`<!---->`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: removeOpen.value,
							"onUpdate:open": ($event) => removeOpen.value = $event,
							title: "Zeile entfernen?",
							body: removeBody.value,
							"confirm-label": "Entfernen",
							busy: removeBusy.value,
							onConfirm: remove
						}, null, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
							open: editOpen.value,
							"onUpdate:open": ($event) => editOpen.value = $event,
							title: "Zeile ändern",
							description: editing.value ? `${editing.value.vehicle} · ${editing.value.wheel} ${editing.value.size}` : void 0,
							"content-class": "adm-dialog gs-dialog",
							"initial-focus": "#gs-edit-axle",
							wide: ""
						}, {
							actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-2f596fdc${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="submit" form="gs-edit-form"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(editBusy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", editBusy.value ? "true" : void 0)} data-v-2f596fdc${_scopeId}>Speichern</button>`);
								else return [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									onClick: ($event) => editOpen.value = false
								}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--primary",
									type: "submit",
									form: "gs-edit-form",
									disabled: editBusy.value,
									"aria-busy": editBusy.value ? "true" : void 0
								}, "Speichern", 8, ["disabled", "aria-busy"])];
							}),
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<form id="gs-edit-form" novalidate data-v-2f596fdc${_scopeId}>`);
									if (editForm.value) _push((0, server_renderer_exports.ssrRenderComponent)(RowFields_default, {
										form: editForm.value,
										"onUpdate:form": ($event) => editForm.value = $event,
										conditions: __props.conditions,
										errors: editErrors.value,
										"id-prefix": "gs-edit",
										"page-count": __props.document.pageCount,
										onSizesChanged: editSizesChanged
									}, null, _parent, _scopeId));
									else _push(`<!---->`);
									_push(`</form>`);
								} else return [(0, vue_exports.createVNode)("form", {
									id: "gs-edit-form",
									novalidate: "",
									onSubmit: (0, vue_exports.withModifiers)(saveRow, ["prevent"])
								}, [editForm.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(RowFields_default, {
									key: 0,
									form: editForm.value,
									"onUpdate:form": ($event) => editForm.value = $event,
									conditions: __props.conditions,
									errors: editErrors.value,
									"id-prefix": "gs-edit",
									"page-count": __props.document.pageCount,
									onSizesChanged: editSizesChanged
								}, null, 8, [
									"form",
									"onUpdate:form",
									"conditions",
									"errors",
									"page-count"
								])) : (0, vue_exports.createCommentVNode)("", true)], 32)];
							}),
							_: 1
						}, _parent, _scopeId));
						if (__props.can.edit) _push((0, server_renderer_exports.ssrRenderComponent)(FactsDialog_default, {
							open: factsOpen.value,
							"onUpdate:open": ($event) => factsOpen.value = $event,
							document: __props.document,
							kinds: __props.kinds,
							replaceable: __props.replaceable,
							supplementable: __props.supplementable
						}, null, _parent, _scopeId));
						else _push(`<!---->`);
					} else return [
						(0, vue_exports.createVNode)("section", {
							class: ["gs-state", { "gs-state--blocked": draft.value && __props.blockers.length }],
							"aria-labelledby": "gs-state-h"
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "gs-state-h",
								class: "gs-state__title",
								tabindex: "-1"
							}, [draft.value && __props.blockers.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("Noch nicht freigebbar")], 64)) : draft.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Kann freigegeben werden")], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.document.statusLabel), 1), __props.document.status === "published" && __props.document.validFrom ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" seit " + (0, vue_exports.toDisplayString)(__props.document.validFrom), 1)], 64)) : __props.document.status !== "published" && __props.document.validTo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)(" seit " + (0, vue_exports.toDisplayString)(__props.document.validTo), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)], 64))]),
							draft.value && __props.blockers.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ul", {
								key: 0,
								class: "gs-state__list"
							}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.blockers, (line) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: line }, (0, vue_exports.toDisplayString)(line), 1);
							}), 128))])) : draft.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 1,
								class: "adm-note"
							}, (0, vue_exports.toDisplayString)(releaseNote.value), 1)) : __props.document.status === "withdrawn" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 2,
								class: "adm-note"
							}, "Dieses Dokument wurde zurückgezogen. Seine Zeilen sind nicht mehr im Shop; Bestellungen darauf bleiben erklärbar.")) : __props.document.status === "superseded" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 3,
								class: "adm-note"
							}, "Eine neuere Fassung hat dieses Dokument ersetzt. Seine Zeilen sind nicht mehr im Shop; Bestellungen darauf bleiben erklärbar.")) : __props.revisionDraft ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 4,
								class: "adm-note"
							}, "Angaben, Codes und Zeilen eines freigegebenen Gutachtens lassen sich nicht mehr ändern. Fassung " + (0, vue_exports.toDisplayString)(__props.revisionDraft.revision) + " ist schon als Entwurf angelegt; sobald sie freigegeben ist, ersetzt sie diese Fassung.", 1)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 5,
								class: "adm-note"
							}, "Angaben, Codes und Zeilen eines freigegebenen Gutachtens lassen sich nicht mehr ändern. Änderungen gehen über eine neue Fassung: Sie bringt alle Zeilen und Codes mit; sobald sie freigegeben ist, ersetzt sie diese Fassung.")),
							__props.document.status === "published" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 6,
								class: ["gs-complete", { "gs-complete--open": !__props.document.completeness }]
							}, [(0, vue_exports.createVNode)("p", { class: "adm-note" }, [
								(0, vue_exports.createVNode)("strong", null, "Erfasst:"),
								(0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(__props.document.completenessLabel), 1),
								__props.document.completenessBy || __props.document.completenessAt ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)([__props.document.completenessBy, __props.document.completenessAt].filter(Boolean).join(", ")), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)
							]), __props.can.answer ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
								key: 0,
								class: "btn btn--secondary",
								type: "button",
								onClick: ($event) => answerOpen.value = true
							}, (0, vue_exports.toDisplayString)(__props.document.completeness ? "Antwort ändern" : "Jetzt beantworten"), 9, ["onClick"])) : (0, vue_exports.createCommentVNode)("", true)], 2)) : (0, vue_exports.createCommentVNode)("", true),
							__props.openConflicts ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 7,
								class: "adm-note"
							}, [
								(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.openConflicts === 1 ? "Eine Zeile widerspricht" : `${(0, vue_exports.unref)(decimal)(__props.openConflicts, 0)} Zeilen widersprechen`) + " einem anderen Gutachten. Bis unter ", 1),
								(0, vue_exports.createVNode)("a", { href: "/admin/konflikte" }, "Konflikte"),
								(0, vue_exports.createTextVNode)(" entschieden ist, sagt der Shop dort „Noch nicht bestätigt“. ")
							])) : (0, vue_exports.createCommentVNode)("", true),
							releaseError.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 8,
								class: "adm-alert",
								role: "alert"
							}, (0, vue_exports.toDisplayString)(releaseError.value), 1)) : (0, vue_exports.createCommentVNode)("", true)
						], 2),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "gs-facts-h"
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "gs-facts-h",
							class: "adm-section__title"
						}, "Angaben"), __props.can.edit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
							key: 0,
							class: "btn btn--ghost",
							type: "button",
							onClick: ($event) => factsOpen.value = true
						}, [(0, vue_exports.createVNode)(AdminIcon_default, {
							name: "edit",
							size: 20
						}), (0, vue_exports.createTextVNode)(" Ändern ")], 8, ["onClick"])) : (0, vue_exports.createCommentVNode)("", true)]), (0, vue_exports.createVNode)("dl", { class: "adm-facts gs-facts" }, [
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Art"), (0, vue_exports.createVNode)("dd", null, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.document.kindLabel), 1), __props.document.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 0,
								class: "adm-tag adm-tag--neutral adm-demo"
							}, "Demodaten")) : (0, vue_exports.createCommentVNode)("", true)])]),
							__props.document.kbaNumber ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 0,
								class: "adm-facts__row"
							}, [(0, vue_exports.createVNode)("dt", null, "KBA-Nummer"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.document.kbaNumber), 1)])) : (0, vue_exports.createCommentVNode)("", true),
							__props.document.reportNumber ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 1,
								class: "adm-facts__row"
							}, [(0, vue_exports.createVNode)("dt", null, "Gutachten-Nummer"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.document.reportNumber), 1)])) : (0, vue_exports.createCommentVNode)("", true),
							__props.document.approvalMark ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 2,
								class: "adm-facts__row"
							}, [(0, vue_exports.createVNode)("dt", null, "Genehmigungszeichen"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.document.approvalMark), 1)])) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Aussteller"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.document.issuer || "–"), 1)]),
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Ausgestellt am"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.document.issuedOnLabel ?? "–"), 1)]),
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Seiten"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.document.pageCount ?? "–"), 1)]),
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Fassung"), (0, vue_exports.createVNode)("dd", null, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.document.revision), 1), __props.document.supersedesLabel ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · ersetzt " + (0, vue_exports.toDisplayString)(__props.document.supersedesLabel), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])]),
							__props.document.supplementTo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 3,
								class: "adm-facts__row"
							}, [(0, vue_exports.createVNode)("dt", null, "Nachtrag zu"), (0, vue_exports.createVNode)("dd", null, [__props.document.supplementTo.href ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("a", {
								key: 0,
								href: __props.document.supplementTo.href
							}, (0, vue_exports.toDisplayString)(__props.document.supplementTo.label), 9, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.document.supplementTo.label) + " – liegt uns nicht vor", 1)], 64)), __props.document.baseMissing ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 2,
								class: "gs-sub"
							}, (0, vue_exports.toDisplayString)(__props.document.baseMissing), 1)) : (0, vue_exports.createCommentVNode)("", true)])])) : (0, vue_exports.createCommentVNode)("", true),
							((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.document.header, (entry) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: entry.label,
									class: "adm-facts__row"
								}, [(0, vue_exports.createVNode)("dt", null, (0, vue_exports.toDisplayString)(entry.label), 1), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(entry.value), 1)]);
							}), 128)),
							__props.document.scopeIncomplete ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 4,
								class: "adm-facts__row"
							}, [(0, vue_exports.createVNode)("dt", null, "Verwendungsbereich"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.document.scopeIncomplete), 1)])) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "PDF"), (0, vue_exports.createVNode)("dd", null, [__props.document.pdfUrl ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("a", {
								key: 0,
								href: __props.document.pdfUrl,
								target: "_blank",
								rel: "noopener"
							}, "PDF öffnen", 8, ["href"])) : __props.document.pdfMissing ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Die Datei fehlt im Speicher. Lad das PDF über „Ändern“ neu hoch.")], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createTextVNode)("Kein PDF hinterlegt")], 64)), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.document.samePdf ?? [], (twin) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: twin.href,
									class: "gs-sub gs-same-pdf"
								}, [
									(0, vue_exports.createTextVNode)(" Dieselbe Datei liegt auch bei "),
									(0, vue_exports.createVNode)("a", { href: twin.href }, (0, vue_exports.toDisplayString)(twin.label), 9, ["href"]),
									(0, vue_exports.createTextVNode)(" (" + (0, vue_exports.toDisplayString)(twin.status), 1),
									twin.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(", Demodaten")], 64)) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createTextVNode)("). ")
								]);
							}), 128))])])
						])]),
						draft.value || __props.document.count ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 0,
							class: "adm-section",
							"aria-labelledby": "gs-count-h"
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "gs-count-h",
							class: "adm-section__title"
						}, "Zählung")]), (0, vue_exports.createVNode)(CountCard_default, {
							"document-id": __props.document.id,
							count: __props.document.count ?? null,
							editable: __props.can.edit && draft.value,
							"page-count": __props.document.pageCount,
							rows: __props.rows.length
						}, null, 8, [
							"document-id",
							"count",
							"editable",
							"page-count",
							"rows"
						])])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "gs-conditions-h"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "gs-conditions-h",
								class: "adm-section__title"
							}, "Auflagenverzeichnis")]),
							(0, vue_exports.createVNode)("p", { class: "adm-note gs-lead" }, "Die Zeilen nennen nur Codes. Was ein Code bedeutet, steht hier – so, wie dieses Gutachten ihn druckt."),
							(0, vue_exports.createVNode)(Auflagenverzeichnis_default, {
								"document-id": __props.document.id,
								conditions: __props.conditions,
								choices: __props.choices,
								unresolved: __props.unresolved,
								editable: __props.can.edit && draft.value,
								"page-count": __props.document.pageCount,
								levels: __props.levels,
								"levels-editable": __props.can.levels === true,
								"level-floor-sentence": __props.levelFloorSentence
							}, null, 8, [
								"document-id",
								"conditions",
								"choices",
								"unresolved",
								"editable",
								"page-count",
								"levels",
								"levels-editable",
								"level-floor-sentence"
							])
						]),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "gs-extras-h"
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "gs-extras-h",
							class: "adm-section__title"
						}, "Befestigung und Hinweise")]), (0, vue_exports.createVNode)(DocumentExtras_default, {
							"document-id": __props.document.id,
							fasteners: __props.fasteners,
							notices: __props.notices,
							reworks: __props.reworks,
							conditions: __props.conditions,
							editable: __props.can.edit && draft.value,
							"page-count": __props.document.pageCount
						}, null, 8, [
							"document-id",
							"fasteners",
							"notices",
							"reworks",
							"conditions",
							"editable",
							"page-count"
						])]),
						deratingShown$1.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 1,
							class: "adm-section",
							"aria-labelledby": "gs-derating-h"
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "gs-derating-h",
							class: "adm-section__title"
						}, "Tragfähigkeit bei hoher Geschwindigkeit"), __props.derating.seededFrom ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
							key: 0,
							class: "adm-tag adm-tag--neutral"
						}, "Demodaten")) : (0, vue_exports.createCommentVNode)("", true)]), (0, vue_exports.createVNode)(DeratingTable_default, {
							"document-id": __props.document.id,
							derating: __props.derating,
							editable: __props.can.edit && draft.value,
							"page-count": __props.document.pageCount,
							required: deratingRequired.value
						}, null, 8, [
							"document-id",
							"derating",
							"editable",
							"page-count",
							"required"
						])])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("details", {
							key: 2,
							class: "adm-section gs-fold"
						}, [(0, vue_exports.createVNode)("summary", { class: "gs-fold__summary" }, [(0, vue_exports.createVNode)("h2", {
							id: "gs-derating-h",
							class: "adm-section__title"
						}, "Tragfähigkeit bei hoher Geschwindigkeit"), (0, vue_exports.createVNode)("span", { class: "gs-fold__state" }, "Keine Tabelle hinterlegt")]), (0, vue_exports.createVNode)("p", { class: "adm-note" }, (0, vue_exports.toDisplayString)(deratingAbsent$1.value), 1)])),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "gs-combinations-h"
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "gs-combinations-h",
							class: "adm-section__title"
						}, "Bereifungskombinationen")]), (0, vue_exports.createVNode)(CombinationsCard_default, {
							"document-id": __props.document.id,
							combinations: __props.combinations,
							editable: __props.can.edit && draft.value,
							"page-count": __props.document.pageCount
						}, null, 8, [
							"document-id",
							"combinations",
							"editable",
							"page-count"
						])]),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "gs-rows-h"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "gs-rows-h",
								class: "adm-section__title",
								tabindex: "-1"
							}, "Verwendungsbereich")]),
							__props.rows.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-note"
							}, "Noch keine Zeile. " + (0, vue_exports.toDisplayString)(__props.can.edit ? countFirst.value ? "Erst zählen, dann erfassen: Sobald die Zählung oben gespeichert ist, legst du unten die ersten Zeilen an." : "Leg unten die ersten an: Fahrzeuge und Größen wählen, Reifengrößen und Auflagen eintragen." : ""), 1)) : (0, vue_exports.createCommentVNode)("", true),
							((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(groups.value, (group) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: group.vehicleId,
									class: "gs-group"
								}, [(0, vue_exports.createVNode)("h3", { class: "gs-group__title" }, (0, vue_exports.toDisplayString)(group.vehicle), 1), (0, vue_exports.createVNode)("div", { class: "adm-panel" }, [(0, vue_exports.createVNode)("table", { class: "adm-table gs-table" }, [
									(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Zeilen für " + (0, vue_exports.toDisplayString)(group.vehicle), 1),
									(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
										(0, vue_exports.createVNode)("th", { scope: "col" }, "Felge"),
										(0, vue_exports.createVNode)("th", { scope: "col" }, "Reifen"),
										(0, vue_exports.createVNode)("th", { scope: "col" }, "Auflagen"),
										(0, vue_exports.createVNode)("th", { scope: "col" }, "Eintragung"),
										(0, vue_exports.createVNode)("th", {
											scope: "col",
											class: "num"
										}, "Seite"),
										__props.can.edit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("th", {
											key: 0,
											scope: "col"
										}, [(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, "Aktionen")])) : (0, vue_exports.createCommentVNode)("", true)
									])]),
									(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(group.rows, (row) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: row.id }, [
											(0, vue_exports.createVNode)("td", { "data-label": "Felge" }, [(0, vue_exports.createVNode)("span", { class: "gs-wheel" }, (0, vue_exports.toDisplayString)(row.wheel), 1), (0, vue_exports.createVNode)("span", { class: "gs-sub" }, [
												(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(row.size), 1),
												row.finish ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(row.finish), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true),
												row.axle !== "ALL" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(row.axleLabel), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)
											])]),
											(0, vue_exports.createVNode)("td", { "data-label": "Reifen" }, [row.tyreSizes.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 0,
												class: "gs-missing"
											}, "Keine Reifengröße – im Shop nicht bestellbar")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 1 }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(row.tyreSizes, (size) => {
												return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
													key: size.label,
													class: "gs-line"
												}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(size.label), 1), size.codes.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
													key: 0,
													class: "gs-codes",
													translate: "no"
												}, " · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(codesText)(size.codes.map((c) => c.code))), 1)) : (0, vue_exports.createCommentVNode)("", true)]);
											}), 128))]))]),
											(0, vue_exports.createVNode)("td", { "data-label": "Auflagen" }, [row.conditions.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 0 }, "–")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 1 }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(row.conditions, (c) => {
												return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
													key: c.code,
													class: ["gs-line", { "gs-undefined": !c.defined }]
												}, [
													(0, vue_exports.createVNode)("b", {
														class: "gs-code",
														translate: "no"
													}, (0, vue_exports.toDisplayString)(c.code), 1),
													(0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(c.text ?? "Nicht im Auflagenverzeichnis"), 1),
													c.note ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(c.note), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)
												], 2);
											}), 128))]))]),
											(0, vue_exports.createVNode)("td", { "data-label": "Eintragung" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(row.requiresEntry ? "Ja" : "Nein") + " ", 1), row.entryOverride ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 0,
												class: "gs-sub"
											}, "laut Prüfer: " + (0, vue_exports.toDisplayString)(row.entryOverrideReason), 1)) : row.entrySource.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 1,
												class: "gs-sub"
											}, "aus " + (0, vue_exports.toDisplayString)(row.entrySource.join(", ")), 1)) : (0, vue_exports.createCommentVNode)("", true)]),
											(0, vue_exports.createVNode)("td", {
												"data-label": "Seite",
												class: "num"
											}, [pageHref(row.sourcePage) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("a", {
												key: 0,
												href: pageHref(row.sourcePage),
												target: "_blank",
												rel: "noopener"
											}, "S. " + (0, vue_exports.toDisplayString)(row.sourcePage), 9, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(row.sourcePage ?? "–"), 1)], 64))]),
											__props.can.edit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
												key: 0,
												"data-label": "Aktionen",
												class: "gs-actions"
											}, [(0, vue_exports.createVNode)("button", {
												class: "adm-iconbtn",
												type: "button",
												"data-row-edit": row.id,
												"aria-label": `Zeile ${row.wheel} ${row.size} ändern`,
												title: "Ändern",
												onClick: ($event) => edit(row)
											}, [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "edit",
												size: 20
											})], 8, [
												"data-row-edit",
												"aria-label",
												"onClick"
											]), (0, vue_exports.createVNode)("button", {
												class: "adm-iconbtn",
												type: "button",
												"aria-label": `Zeile ${row.wheel} ${row.size} entfernen`,
												title: "Entfernen",
												onClick: ($event) => removing.value = row
											}, [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "delete",
												size: 20
											})], 8, ["aria-label", "onClick"])])) : (0, vue_exports.createCommentVNode)("", true)
										]);
									}), 128))])
								])])]);
							}), 128))
						]),
						__props.can.edit && !countFirst.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 3,
							class: "adm-section",
							"aria-labelledby": "gs-add-h"
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "gs-add-h",
							class: "adm-section__title"
						}, "Zeilen hinzufügen")]), (0, vue_exports.createVNode)(RowComposer_default, {
							"document-id": __props.document.id,
							conditions: __props.conditions,
							"page-count": __props.document.pageCount,
							"body-forms": __props.choices.bodyForms,
							drives: __props.choices.drives
						}, null, 8, [
							"document-id",
							"conditions",
							"page-count",
							"body-forms",
							"drives"
						])])) : (0, vue_exports.createCommentVNode)("", true),
						__props.vehicles.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 4,
							class: "adm-section",
							"aria-labelledby": "gs-preview-h"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "gs-preview-h",
								class: "adm-section__title"
							}, "Vorschau im Shop")]),
							(0, vue_exports.createVNode)("p", { class: "adm-note" }, "So antwortet der Shop" + (0, vue_exports.toDisplayString)(draft.value ? " nach der Freigabe" : "") + " für dieses Fahrzeug – berechnet von derselben Prüfung, die jede Kundin und jeder Kunde bekommt.", 1),
							(0, vue_exports.createVNode)("form", {
								class: "gs-preview-pick",
								onSubmit: (0, vue_exports.withModifiers)(loadPreview, ["prevent"])
							}, [
								(0, vue_exports.createVNode)("label", {
									class: "visually-hidden",
									for: "gs-preview-vehicle"
								}, "Fahrzeug für die Vorschau"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "gs-preview-vehicle",
									"onUpdate:modelValue": ($event) => previewVehicle.value = $event,
									class: "input",
									onChange: loadPreview
								}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.vehicles, (vehicle) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
										key: vehicle.id,
										value: vehicle.id
									}, (0, vue_exports.toDisplayString)(vehicle.label), 9, ["value"]);
								}), 128))], 40, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, previewVehicle.value]]),
								(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "submit",
									disabled: previewBusy.value,
									"aria-busy": previewBusy.value ? "true" : void 0
								}, "Vorschau zeigen", 8, ["disabled", "aria-busy"])
							], 32),
							__props.preview && previewFor.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "gs-preview-for"
							}, "Vorschau für " + (0, vue_exports.toDisplayString)(previewFor.value), 1)) : (0, vue_exports.createCommentVNode)("", true),
							__props.preview && __props.preview.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ul", {
								key: 1,
								class: "gs-verdicts",
								"aria-live": "polite"
							}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.preview, (verdict) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
									key: verdict.config,
									class: "gs-verdict"
								}, [
									(0, vue_exports.createVNode)("div", { class: "gs-verdict__head" }, [(0, vue_exports.createVNode)("span", { class: "gs-verdict__wheel" }, (0, vue_exports.toDisplayString)(verdict.wheel), 1), !verdict.notesOnly && TONE[verdict.status] ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: TONE[verdict.status]
									}, (0, vue_exports.toDisplayString)(verdict.statusLabel), 3)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 1,
										class: "gs-verdict__ok"
									}, (0, vue_exports.toDisplayString)(verdict.statusLabel), 1))]),
									verdict.reason ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 0,
										class: "gs-verdict__line"
									}, (0, vue_exports.toDisplayString)(verdict.reason), 1)) : (0, vue_exports.createCommentVNode)("", true),
									verdict.front.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 1,
										class: "gs-verdict__line"
									}, [(0, vue_exports.createTextVNode)("Reifen: " + (0, vue_exports.toDisplayString)(verdict.front.join(", ")), 1), verdict.rear.length && verdict.rear.join() !== verdict.front.join() ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · hinten " + (0, vue_exports.toDisplayString)(verdict.rear.join(", ")), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true),
									verdict.requiresEntry ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 2,
										class: "gs-verdict__line"
									}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(verdict.entryLine ?? ENTRY_LINE), 1), verdict.entryNote ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(verdict.entryNote), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true),
									verdict.papersLine ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 3,
										class: "gs-verdict__line"
									}, (0, vue_exports.toDisplayString)(verdict.papersLine), 1)) : (0, vue_exports.createCommentVNode)("", true),
									verdict.conditionGroups && verdict.conditions.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ConditionGroups_default, {
										key: 4,
										class: "gs-verdict__groups",
										groups: verdict.conditionGroups,
										omit: verdict.requiresEntry ? [ENTRY_LINE] : []
									}, null, 8, ["groups", "omit"])) : ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 5 }, (0, vue_exports.renderList)(verdict.conditions.filter((s) => !(verdict.requiresEntry && s === ENTRY_LINE)), (sentence, i) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: i,
											class: "gs-verdict__line"
										}, (0, vue_exports.toDisplayString)(sentence), 1);
									}), 128))
								]);
							}), 128))])) : __props.preview ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 2,
								class: "adm-note"
							}, "Für dieses Fahrzeug ist zu diesem Gutachten keine Zeile hinterlegt.")) : (0, vue_exports.createCommentVNode)("", true)
						])) : (0, vue_exports.createCommentVNode)("", true),
						__props.can.release ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ReleaseDialog_default, {
							key: 5,
							open: releaseOpen.value,
							"onUpdate:open": ($event) => releaseOpen.value = $event,
							mode: "release",
							document: __props.document,
							rows: __props.rows.length,
							note: releaseBody.value,
							onDone: focusState
						}, null, 8, [
							"open",
							"onUpdate:open",
							"document",
							"rows",
							"note"
						])) : (0, vue_exports.createCommentVNode)("", true),
						__props.can.answer ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ReleaseDialog_default, {
							key: 6,
							open: answerOpen.value,
							"onUpdate:open": ($event) => answerOpen.value = $event,
							mode: "answer",
							document: __props.document,
							rows: __props.rows.length
						}, null, 8, [
							"open",
							"onUpdate:open",
							"document",
							"rows"
						])) : (0, vue_exports.createCommentVNode)("", true),
						__props.can.revise ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminConfirm_default, {
							key: 7,
							open: reviseOpen.value,
							"onUpdate:open": ($event) => reviseOpen.value = $event,
							title: "Neue Fassung anlegen?",
							body: "Die neue Fassung beginnt als Entwurf mit allen Angaben, Codes und Zeilen dieser Fassung. Im Shop gilt diese Fassung weiter, bis die neue freigegeben ist und sie ersetzt.",
							"confirm-label": "Neue Fassung anlegen",
							busy: reviseBusy.value,
							onConfirm: revise
						}, null, 8, [
							"open",
							"onUpdate:open",
							"busy"
						])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: removeOpen.value,
							"onUpdate:open": ($event) => removeOpen.value = $event,
							title: "Zeile entfernen?",
							body: removeBody.value,
							"confirm-label": "Entfernen",
							busy: removeBusy.value,
							onConfirm: remove
						}, null, 8, [
							"open",
							"onUpdate:open",
							"body",
							"busy"
						]),
						(0, vue_exports.createVNode)(Dialog_default, {
							open: editOpen.value,
							"onUpdate:open": ($event) => editOpen.value = $event,
							title: "Zeile ändern",
							description: editing.value ? `${editing.value.vehicle} · ${editing.value.wheel} ${editing.value.size}` : void 0,
							"content-class": "adm-dialog gs-dialog",
							"initial-focus": "#gs-edit-axle",
							wide: ""
						}, {
							actions: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "button",
								onClick: ($event) => editOpen.value = false
							}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "submit",
								form: "gs-edit-form",
								disabled: editBusy.value,
								"aria-busy": editBusy.value ? "true" : void 0
							}, "Speichern", 8, ["disabled", "aria-busy"])]),
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("form", {
								id: "gs-edit-form",
								novalidate: "",
								onSubmit: (0, vue_exports.withModifiers)(saveRow, ["prevent"])
							}, [editForm.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(RowFields_default, {
								key: 0,
								form: editForm.value,
								"onUpdate:form": ($event) => editForm.value = $event,
								conditions: __props.conditions,
								errors: editErrors.value,
								"id-prefix": "gs-edit",
								"page-count": __props.document.pageCount,
								onSizesChanged: editSizesChanged
							}, null, 8, [
								"form",
								"onUpdate:form",
								"conditions",
								"errors",
								"page-count"
							])) : (0, vue_exports.createCommentVNode)("", true)], 32)]),
							_: 1
						}, 8, [
							"open",
							"onUpdate:open",
							"description"
						]),
						__props.can.edit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(FactsDialog_default, {
							key: 8,
							open: factsOpen.value,
							"onUpdate:open": ($event) => factsOpen.value = $event,
							document: __props.document,
							kinds: __props.kinds,
							replaceable: __props.replaceable,
							supplementable: __props.supplementable
						}, null, 8, [
							"open",
							"onUpdate:open",
							"document",
							"kinds",
							"replaceable",
							"supplementable"
						])) : (0, vue_exports.createCommentVNode)("", true)
					];
				}),
				_: 2
			}, [__props.can.release ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.blockers.length > 0) ? " disabled" : ""} data-v-2f596fdc${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: "publish",
							size: 20
						}, null, _parent, _scopeId));
						_push(` Freigeben </button>`);
					} else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						disabled: __props.blockers.length > 0,
						onClick: ($event) => releaseOpen.value = true
					}, [(0, vue_exports.createVNode)(AdminIcon_default, {
						name: "publish",
						size: 20
					}), (0, vue_exports.createTextVNode)(" Freigeben ")], 8, ["disabled", "onClick"])];
				}),
				key: "0"
			} : __props.document.status === "published" && (__props.revisionDraft || __props.can.revise) ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.revisionDraft) {
							_push(`<a class="btn btn--primary"${(0, server_renderer_exports.ssrRenderAttr)("href", `/admin/gutachten/${__props.revisionDraft.id}`)} data-v-2f596fdc${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "edit",
								size: 20
							}, null, _parent, _scopeId));
							_push(` Neue Fassung öffnen </a>`);
						} else {
							_push(`<button class="btn btn--primary" type="button" data-v-2f596fdc${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "edit",
								size: 20
							}, null, _parent, _scopeId));
							_push(` Neue Fassung anlegen </button>`);
						}
					} else return [__props.revisionDraft ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("a", {
						key: 0,
						class: "btn btn--primary",
						href: `/admin/gutachten/${__props.revisionDraft.id}`
					}, [(0, vue_exports.createVNode)(AdminIcon_default, {
						name: "edit",
						size: 20
					}), (0, vue_exports.createTextVNode)(" Neue Fassung öffnen ")], 8, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
						key: 1,
						class: "btn btn--primary",
						type: "button",
						onClick: ($event) => reviseOpen.value = true
					}, [(0, vue_exports.createVNode)(AdminIcon_default, {
						name: "edit",
						size: 20
					}), (0, vue_exports.createTextVNode)(" Neue Fassung anlegen ")], 8, ["onClick"]))];
				}),
				key: "1"
			} : void 0]), _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Show.vue
var _sfc_setup = Show_vue_vue_type_script_setup_true_lang_default.setup;
Show_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Show.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Show_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Show_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-2f596fdc"]]);
//#endregion
export { Show_default as default };
