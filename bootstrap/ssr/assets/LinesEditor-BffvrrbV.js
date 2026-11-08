import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-D0z-a8p_.js";
import { t as stampHeaders } from "./useDirtyForm-CUSvyfaU.js";
import { a as readTyre, c as whyUnread, n as parseKwBand } from "./tyreInput-CdSJZ98m.js";
import { d as refusedOf, f as send, i as blankLine, l as duplicateKeys, m as useEntry, n as Refused, p as toEditLine, u as misfit } from "./entryStore-XWwzBuxT.js";
import { t as DateField_default } from "./DateField-DBwXoxz-.js";
import { t as createAutosave } from "./autosave-C5HjIjlG.js";
import { t as CodeTags_default } from "./CodeTags-D-OcxxeR.js";
import { t as CopyDialog_default } from "./CopyDialog-B63SqK7l.js";
import { t as PasteDialog_default } from "./PasteDialog-G-1sApzd.js";
//#region resources/js/Pages/Admin/Gutachten/Erfassung/LinesEditor.vue?vue&type=script&setup=true&lang.ts
var KW_UNREAD = "Noch nicht gespeichert: Den kW-Bereich können wir nicht lesen. So geht es: 85-142, der kleinere Wert zuerst.";
var PAGE_UNREAD = "Gib die Seite als ganze Zahl ab 1 an.";
var LinesEditor_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "LinesEditor",
	__ssrInlineRender: true,
	props: {
		car: {},
		wheelName: {},
		combination: {}
	},
	setup(__props) {
		/**
		* The tyres of one car on one wheel combination (the client's change of 05.11.2026: „There should only be fields for tire size
		* combinations“): every line is vorne + hinten + codes, with a power band behind the line's „…“. Typing the front fills the rear
		* with the same size, where both wheels share a diameter, and the rear can be changed. A tyre whose rim is not its axle's wheel is
		* said at once. What is typed is saved as it is typed; what does not read yet is kept, said, and the release waits for it.
		* Warnings say, they never block.
		*
		* Nothing leaves this car unsaved (autosave.ts, entryStore): moving on sends what is owed and waits; a refusal or a lost connection
		* keeps the person here, with the reason in the bar beside the button they pressed. A car whose lines did not load cannot be
		* typed in: an empty list here would be saved over the stored one.
		*/
		const props = __props;
		const mirrors = (0, vue_exports.computed)(() => Math.abs(props.combination.frontDiameter - props.combination.rearDiameter) < .001);
		const store = useEntry();
		const { state } = store;
		const loading = (0, vue_exports.ref)(true);
		const loadFailed = (0, vue_exports.ref)(false);
		const lines = (0, vue_exports.ref)([]);
		const general = (0, vue_exports.ref)([]);
		const notes = (0, vue_exports.ref)({});
		const page = (0, vue_exports.ref)("");
		const stamp = (0, vue_exports.ref)("");
		const openLine = (0, vue_exports.ref)(null);
		const copyOpen = (0, vue_exports.ref)(false);
		const pasteOpen = (0, vue_exports.ref)(false);
		const problem = (0, vue_exports.ref)("");
		const stale = (0, vue_exports.ref)(false);
		const retryable = (0, vue_exports.ref)(false);
		const columns = (0, vue_exports.reactive)({
			entry_note: "",
			entry_override: "",
			entry_override_reason: "",
			build_from: "",
			build_to: "",
			width_min: "",
			width_max: "",
			et_min: "",
			et_max: "",
			centre_bore: ""
		});
		const columnsOpen = (0, vue_exports.ref)(false);
		let storedPage = null;
		let columnsSeen = false;
		let ready = false;
		const duplicates = (0, vue_exports.computed)(() => duplicateKeys(lines.value));
		const anyColumn = (0, vue_exports.computed)(() => Object.values(columns).some((value) => String(value ?? "").trim() !== ""));
		const pageBad = (0, vue_exports.computed)(() => page.value.trim() !== "" && !/^[1-9]\d{0,3}$/.test(page.value.trim()));
		const pageNumber = (0, vue_exports.computed)(() => pageBad.value || page.value.trim() === "" ? pageBad.value ? storedPage : null : Number(page.value.trim()));
		function take(detail) {
			lines.value = detail.lines.map(toEditLine);
			general.value = detail.codes.map((code) => code.code);
			notes.value = Object.fromEntries(detail.codes.map((code) => [code.code, code.note]));
			page.value = detail.page === null ? "" : String(detail.page);
			storedPage = detail.page;
			stamp.value = detail.stamp ?? "";
			for (const key of Object.keys(columns)) {
				const value = detail.columns[key];
				columns[key] = value === null || value === void 0 ? "" : String(value);
			}
			columnsOpen.value = anyColumn.value;
			columnsSeen = anyColumn.value;
		}
		function filled(line) {
			return line.front.trim() !== "" || line.rear.trim() !== "";
		}
		function fields(line) {
			return {
				front: line.front,
				rear: line.rear,
				kw: line.kw,
				codes: line.codes
			};
		}
		const generalCodes = (0, vue_exports.computed)(() => general.value.map((code) => ({
			code,
			note: notes.value[code] ?? null
		})));
		const content = (0, vue_exports.computed)(() => JSON.stringify([
			lines.value.filter(filled).map(fields),
			generalCodes.value,
			pageNumber.value,
			columns
		]));
		const autosave = createAutosave({
			content: () => content.value,
			write,
			delay: 600,
			clean: () => {
				problem.value = "";
				stale.value = false;
				retryable.value = false;
				state.save = "saved";
			}
		});
		(0, vue_exports.watch)(content, () => {
			if (ready && state.editable) autosave.changed();
		});
		async function load() {
			ready = false;
			loading.value = true;
			loadFailed.value = false;
			try {
				take(await send("GET", `${store.base}/fahrzeuge/${props.car.id}`));
				problem.value = "";
				stale.value = false;
				retryable.value = false;
				await (0, vue_exports.nextTick)();
				autosave.mark();
				ready = true;
			} catch {
				loadFailed.value = true;
			} finally {
				loading.value = false;
			}
		}
		let letGo = () => {};
		(0, vue_exports.onMounted)(async () => {
			letGo = store.hold(autosave);
			await load();
			if (state.focusEditor) {
				state.focusEditor = false;
				await (0, vue_exports.nextTick)();
				document.getElementById("ef-editor-h")?.focus();
			}
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			letGo();
			if (autosave.owed()) autosave.flush();
		});
		(0, vue_exports.watch)(columnsOpen, (now) => {
			columnsSeen = columnsSeen || now;
		});
		async function write() {
			const unread = lines.value.find((line) => parseKwBand(line.kw) === null);
			if (unread !== void 0) {
				openLine.value = unread.key;
				problem.value = KW_UNREAD;
				stale.value = false;
				retryable.value = false;
				return false;
			}
			const sent = lines.value.filter(filled);
			try {
				const answer = await store.save("PUT", `/fahrzeuge/${props.car.id}`, {
					lines: lines.value.map((line) => ({
						id: line.id,
						...fields(line)
					})),
					codes: generalCodes.value,
					source_page: pageNumber.value,
					...columnsSeen ? {
						...columns,
						entry_override: columns.entry_override === "" ? null : columns.entry_override
					} : {}
				}, stampHeaders(stamp.value));
				stamp.value = answer.stamp;
				problem.value = "";
				stale.value = false;
				retryable.value = false;
				if (answer.car.lines.length === sent.length) sent.forEach((line, i) => {
					const server = answer.car.lines[i];
					if (server !== void 0) {
						line.id = server.id;
						line.refused = refusedOf(server);
					}
				});
				return true;
			} catch (failure) {
				problem.value = failure instanceof Error ? failure.message : "Das wurde nicht gespeichert.";
				stale.value = failure instanceof Refused && Object.keys(failure.errors).includes("_stamp");
				retryable.value = !(failure instanceof Refused);
				return false;
			}
		}
		function sideHint(line, side) {
			const text = line[side];
			if (text.trim() === "") return {
				ok: true,
				text: ""
			};
			const tyre = readTyre(text);
			if (tyre === null) return {
				ok: false,
				text: whyUnread(text) ?? "Nicht lesbar. Schreib die Größe etwa so: 225/40 R18 88W, 245/45R18 100 oder 235/50R18."
			};
			const refused = line.refused[side];
			if (refused !== null && refused.text === text) return {
				ok: false,
				text: refused.why
			};
			const wrong = misfit(text, side === "front" ? props.combination.frontDiameter : props.combination.rearDiameter, side);
			if (wrong !== null) return {
				ok: false,
				text: wrong
			};
			return {
				ok: true,
				text: `${tyre.li === null ? "ohne Lastindex" : `Lastindex ${tyre.li}`} · ${tyre.si === null ? "ohne Symbol" : `Symbol ${tyre.si}`}`
			};
		}
		function kwOk(line) {
			return parseKwBand(line.kw) !== null;
		}
		function kwTag(line) {
			const band = parseKwBand(line.kw);
			if (band === null || band === void 0) return "";
			return band.kw_min === band.kw_max ? `${band.kw_min} kW` : `${band.kw_min}–${band.kw_max} kW`;
		}
		const readable = (0, vue_exports.computed)(() => lines.value.some((line) => readTyre(line.front) !== null || readTyre(line.rear) !== null));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "ef-editor",
				"aria-labelledby": "ef-editor-h"
			}, _attrs))} data-v-5a88cb01><header class="ef-editor__head" data-v-5a88cb01><h3 id="ef-editor-h" class="ef-editor__title" tabindex="-1" data-v-5a88cb01>${(0, server_renderer_exports.ssrInterpolate)(__props.car.label)}</h3><p class="ef-editor__sub" data-v-5a88cb01><span data-editor-wheel data-v-5a88cb01>Felge ${(0, server_renderer_exports.ssrInterpolate)(__props.wheelName)} · ${(0, server_renderer_exports.ssrInterpolate)(__props.combination.label)}</span>`);
			if (__props.car.finish) _push(`<span class="adm-tag adm-tag--neutral" data-v-5a88cb01>nur ${(0, server_renderer_exports.ssrInterpolate)(__props.car.finish)}</span>`);
			else _push(`<!---->`);
			if (__props.car.axle !== "ALL") _push(`<span class="adm-tag adm-tag--neutral" data-v-5a88cb01>${(0, server_renderer_exports.ssrInterpolate)(__props.car.axle === "FRONT" ? "nur Vorderachse" : "nur Hinterachse")}</span>`);
			else _push(`<!---->`);
			if (__props.car.copiedFrom) _push(`<span class="adm-tag adm-tag--neutral" data-v-5a88cb01>kopiert von ${(0, server_renderer_exports.ssrInterpolate)(__props.car.copiedFrom)}</span>`);
			else _push(`<!---->`);
			_push(`</p>`);
			if (__props.car.k) _push(`<p class="ef-editor__sub" data-v-5a88cb01>Feld K ${(0, server_renderer_exports.ssrInterpolate)(__props.car.k)}</p>`);
			else _push(`<!---->`);
			_push(`</header>`);
			if (__props.car.conflict) _push(`<p class="ef-warn" role="status" data-v-5a88cb01> Dieses Fahrzeug teilt seine Betriebserlaubnis mit mindestens einem anderen, und die Reifenkombinationen unterscheiden sich. Welche es ist, steht in Schritt 5. Trag sie bei allen betroffenen Fahrzeugen ein oder bei keinem. </p>`);
			else _push(`<!---->`);
			if (loading.value) _push(`<p class="adm-note" data-v-5a88cb01>Wird geladen …</p>`);
			else if (loadFailed.value) _push(`<p class="adm-alert" role="alert" data-v-5a88cb01> Die Reifen dieses Fahrzeugs konnten nicht geladen werden, darum lässt sich hier gerade nichts eintragen. Was gespeichert ist, bleibt, wie es ist. <button class="ef-link" type="button" data-v-5a88cb01>Noch einmal laden</button></p>`);
			else {
				_push(`<!--[--><div class="ef-editor__block" data-v-5a88cb01><h4 class="ef-editor__label" data-v-5a88cb01>Reifenkombinationen</h4><ul class="ef-lines" data-v-5a88cb01><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(lines.value, (line, i) => {
					_push(`<li class="ef-line" data-v-5a88cb01><div class="ef-pairfields" data-v-5a88cb01><label class="ef-pairfields__field" data-v-5a88cb01><span class="${(0, server_renderer_exports.ssrRenderClass)([{ "ef-pairfields__label--rest": i > 0 }, "form-field__label"])}" data-v-5a88cb01>Vorne</span><input${(0, server_renderer_exports.ssrRenderAttr)("id", `ef-front-${line.key}`)} class="input" type="text" spellcheck="false" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("value", line.front)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("placeholder", line.oneSided ? "keine" : "z. B. 225/40R18 88W")}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", sideHint(line, "front").ok ? void 0 : "true")} data-v-5a88cb01><span class="${(0, server_renderer_exports.ssrRenderClass)(sideHint(line, "front").ok ? "ef-line__hint" : "ef-line__error")}" data-v-5a88cb01>${(0, server_renderer_exports.ssrInterpolate)(sideHint(line, "front").text)}</span></label><label class="ef-pairfields__field" data-v-5a88cb01><span class="${(0, server_renderer_exports.ssrRenderClass)([{ "ef-pairfields__label--rest": i > 0 }, "form-field__label"])}" data-v-5a88cb01>Hinten</span><input${(0, server_renderer_exports.ssrRenderAttr)("id", `ef-rear-${line.key}`)} class="input" type="text" spellcheck="false" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("value", line.rear)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("placeholder", line.oneSided ? "keine" : mirrors.value ? "wie vorne" : `z. B. 255/35R${__props.combination.rearDiameter} 96Y`)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", sideHint(line, "rear").ok ? void 0 : "true")} data-v-5a88cb01><span class="${(0, server_renderer_exports.ssrRenderClass)(sideHint(line, "rear").ok ? "ef-line__hint" : "ef-line__error")}" data-v-5a88cb01>${(0, server_renderer_exports.ssrInterpolate)(sideHint(line, "rear").text)}</span></label></div>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(CodeTags_default, {
						id: `ef-codes-${line.key}`,
						modelValue: line.codes,
						"onUpdate:modelValue": ($event) => line.codes = $event,
						label: `Codes für ${line.front || "diese Zeile"}`,
						disabled: !(0, vue_exports.unref)(state).editable
					}, null, _parent));
					_push(`<div class="ef-line__more" data-v-5a88cb01><button class="ef-iconbtn" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", openLine.value === line.key)}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Weitere Angaben zu ${line.front || "dieser Zeile"}`)} data-v-5a88cb01>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "more",
						size: 20
					}, null, _parent));
					_push(`</button></div><div class="ef-line__notes" data-v-5a88cb01>`);
					if (line.kw && kwOk(line)) _push(`<span class="adm-tag adm-tag--neutral" data-v-5a88cb01>${(0, server_renderer_exports.ssrInterpolate)(kwTag(line))}</span>`);
					else if (line.kw) _push(`<span class="ef-line__error" data-v-5a88cb01>Den kW-Bereich können wir nicht lesen. So geht es: 85-142, der kleinere Wert zuerst.</span>`);
					else _push(`<!---->`);
					if (line.oneSided) _push(`<span class="adm-tag adm-tag--neutral" data-v-5a88cb01>${(0, server_renderer_exports.ssrInterpolate)(line.front.trim() ? "nur vorne" : "nur hinten")}, aus der bisherigen Eingabe</span>`);
					else _push(`<!---->`);
					if (line.outsideList) _push(`<span class="adm-tag adm-tag--neutral" data-v-5a88cb01>nicht in der Kombinationsliste, aus der bisherigen Eingabe</span>`);
					else _push(`<!---->`);
					if (duplicates.value.includes(line.key)) _push(`<span class="ef-warn" data-v-5a88cb01>Diese Zeile steht schon einmal da.</span>`);
					else _push(`<!---->`);
					_push(`</div>`);
					if (openLine.value === line.key) {
						_push(`<div class="ef-line__extra" data-v-5a88cb01><div class="form-field" data-v-5a88cb01><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `ef-kw-${line.key}`)} data-v-5a88cb01>kW-Bereich</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `ef-kw-${line.key}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", line.kw)} class="input ef-line__kw" type="text" placeholder="z. B. 85-142"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", kwOk(line) ? void 0 : "true")} data-v-5a88cb01></div>`);
						if ((0, vue_exports.unref)(state).editable) {
							_push(`<button class="btn btn--ghost ef-line__remove" type="button" data-v-5a88cb01>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "delete",
								size: 20
							}, null, _parent));
							_push(` Zeile entfernen </button>`);
						} else _push(`<!---->`);
						_push(`</div>`);
					} else _push(`<!---->`);
					_push(`</li>`);
				});
				_push(`<!--]--></ul>`);
				if (lines.value.length === 0) _push(`<p class="ef-empty" data-v-5a88cb01>Noch keine Reifen. Trag die Kombinationen ein, die das Gutachten für dieses Fahrzeug nennt.${(0, server_renderer_exports.ssrInterpolate)(mirrors.value ? " Die hintere Größe übernimmt die vordere, bis du sie änderst." : " Vorne und hinten haben verschiedene Durchmesser: Trag beide Größen ein.")}</p>`);
				else _push(`<!---->`);
				if ((0, vue_exports.unref)(state).editable) {
					_push(`<div class="ef-editor__adds" data-v-5a88cb01><button class="btn btn--secondary" type="button" data-v-5a88cb01>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "plus",
						size: 20
					}, null, _parent));
					_push(` Kombination</button><button class="btn btn--ghost" type="button" data-v-5a88cb01>Mehrere einfügen</button></div>`);
				} else _push(`<!---->`);
				_push(`</div><div class="ef-editor__block" data-v-5a88cb01><h4 id="ef-general-h" class="ef-editor__label" data-v-5a88cb01>Allgemeine Codes dieses Fahrzeugs</h4>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(CodeTags_default, {
					id: "ef-general",
					modelValue: general.value,
					"onUpdate:modelValue": ($event) => general.value = $event,
					label: "Allgemeine Codes dieses Fahrzeugs",
					disabled: !(0, vue_exports.unref)(state).editable
				}, null, _parent));
				_push(`</div><div class="form-field" data-v-5a88cb01><label class="form-field__label" for="ef-page" data-v-5a88cb01>Seite im Gutachten <span class="ef-optional" data-v-5a88cb01>(optional)</span></label><div class="adm-inline" data-v-5a88cb01><input id="ef-page"${(0, server_renderer_exports.ssrRenderAttr)("value", page.value)} class="input ef-editor__pageinput" type="text" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", pageBad.value ? "true" : void 0)} aria-describedby="ef-page-err"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-5a88cb01>`);
				if ((0, vue_exports.unref)(state).editable) _push(`<button class="btn btn--ghost" type="button" data-v-5a88cb01>PDF-Seite ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(state).pdfPage)} übernehmen</button>`);
				else _push(`<!---->`);
				_push(`</div><p id="ef-page-err" class="form-field__error" data-v-5a88cb01>${(0, server_renderer_exports.ssrInterpolate)(pageBad.value ? PAGE_UNREAD : "")}</p></div><details class="ef-more"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(columnsOpen.value) ? " open" : ""} data-v-5a88cb01><summary class="ef-more__summary" data-v-5a88cb01>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					class: "ef-more__marker",
					name: "chevron-right",
					size: 16
				}, null, _parent));
				_push(` <span data-v-5a88cb01>Weitere Angaben zu diesem Fahrzeug <span class="ef-optional" data-v-5a88cb01>(optional)</span></span></summary><div class="ef-more__body ef-columns" data-v-5a88cb01><div class="form-field" data-v-5a88cb01><label class="form-field__label" for="ef-col-note" data-v-5a88cb01>Hinweis zur Eintragung</label><input id="ef-col-note"${(0, server_renderer_exports.ssrRenderAttr)("value", columns.entry_note)} class="input" type="text" maxlength="500"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-5a88cb01></div><div class="form-field" data-v-5a88cb01><label class="form-field__label" for="ef-col-override" data-v-5a88cb01>Eintragung laut Prüfer</label><select id="ef-col-override" class="input"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-5a88cb01><option value="" data-v-5a88cb01${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(columns.entry_override) ? (0, server_renderer_exports.ssrLooseContain)(columns.entry_override, "") : (0, server_renderer_exports.ssrLooseEqual)(columns.entry_override, "")) ? " selected" : ""}>Aus den Codes abgeleitet</option><option value="required" data-v-5a88cb01${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(columns.entry_override) ? (0, server_renderer_exports.ssrLooseContain)(columns.entry_override, "required") : (0, server_renderer_exports.ssrLooseEqual)(columns.entry_override, "required")) ? " selected" : ""}>Erforderlich</option><option value="not_required" data-v-5a88cb01${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(columns.entry_override) ? (0, server_renderer_exports.ssrLooseContain)(columns.entry_override, "not_required") : (0, server_renderer_exports.ssrLooseEqual)(columns.entry_override, "not_required")) ? " selected" : ""}>Nicht erforderlich</option></select></div>`);
				if (columns.entry_override) _push(`<div class="form-field ef-columns__wide" data-v-5a88cb01><label class="form-field__label" for="ef-col-reason" data-v-5a88cb01>Warum weicht das von den Codes ab?</label><input id="ef-col-reason"${(0, server_renderer_exports.ssrRenderAttr)("value", columns.entry_override_reason)} class="input" type="text" maxlength="500"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-5a88cb01></div>`);
				else _push(`<!---->`);
				_push(`<div class="form-field" data-v-5a88cb01><label class="form-field__label" for="ef-col-from" data-v-5a88cb01>Bauzeitraum von</label>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(DateField_default, {
					id: "ef-col-from",
					modelValue: columns.build_from,
					"onUpdate:modelValue": ($event) => columns.build_from = $event
				}, null, _parent));
				_push(`</div><div class="form-field" data-v-5a88cb01><label class="form-field__label" for="ef-col-to" data-v-5a88cb01>Bauzeitraum bis</label>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(DateField_default, {
					id: "ef-col-to",
					modelValue: columns.build_to,
					"onUpdate:modelValue": ($event) => columns.build_to = $event
				}, null, _parent));
				_push(`</div><div class="form-field" data-v-5a88cb01><label class="form-field__label" for="ef-col-wmin" data-v-5a88cb01>Breite von (Zoll)</label><input id="ef-col-wmin"${(0, server_renderer_exports.ssrRenderAttr)("value", columns.width_min)} class="input" type="text" inputmode="decimal"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-5a88cb01></div><div class="form-field" data-v-5a88cb01><label class="form-field__label" for="ef-col-wmax" data-v-5a88cb01>Breite bis (Zoll)</label><input id="ef-col-wmax"${(0, server_renderer_exports.ssrRenderAttr)("value", columns.width_max)} class="input" type="text" inputmode="decimal"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-5a88cb01></div><div class="form-field" data-v-5a88cb01><label class="form-field__label" for="ef-col-etmin" data-v-5a88cb01>ET von</label><input id="ef-col-etmin"${(0, server_renderer_exports.ssrRenderAttr)("value", columns.et_min)} class="input" type="text" inputmode="numeric"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-5a88cb01></div><div class="form-field" data-v-5a88cb01><label class="form-field__label" for="ef-col-etmax" data-v-5a88cb01>ET bis</label><input id="ef-col-etmax"${(0, server_renderer_exports.ssrRenderAttr)("value", columns.et_max)} class="input" type="text" inputmode="numeric"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-5a88cb01></div><div class="form-field" data-v-5a88cb01><label class="form-field__label" for="ef-col-bore" data-v-5a88cb01>Mittenlochbohrung (mm)</label><input id="ef-col-bore"${(0, server_renderer_exports.ssrRenderAttr)("value", columns.centre_bore)} class="input" type="text" inputmode="decimal"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-5a88cb01></div></div></details><div class="ef-actions" data-v-5a88cb01>`);
				if (problem.value) {
					_push(`<p class="adm-alert ef-actions__problem" role="alert" data-v-5a88cb01>${(0, server_renderer_exports.ssrInterpolate)(problem.value)} `);
					if (stale.value) _push(`<button class="ef-link" type="button" data-v-5a88cb01>Neu laden</button>`);
					else if (retryable.value) _push(`<button class="ef-link" type="button" data-v-5a88cb01>Noch einmal versuchen</button>`);
					else _push(`<!---->`);
					_push(`</p>`);
				} else _push(`<!---->`);
				if ((0, vue_exports.unref)(state).editable) {
					_push(`<button class="btn btn--secondary ef-actions__left" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!readable.value) ? " disabled" : ""} data-v-5a88cb01>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "duplicate",
						size: 20
					}, null, _parent));
					_push(` Kopieren nach … </button>`);
				} else _push(`<!---->`);
				_push(`<button class="btn btn--primary" type="button" data-v-5a88cb01>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(store).nextOpen(__props.car.id) ? "Speichern und weiter" : "Speichern, weiter zur Freigabe")} `);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "arrow-right",
					size: 20
				}, null, _parent));
				_push(`</button></div>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(CopyDialog_default, {
					open: copyOpen.value,
					"onUpdate:open": ($event) => copyOpen.value = $event,
					from: __props.car
				}, null, _parent));
				_push((0, server_renderer_exports.ssrRenderComponent)(PasteDialog_default, {
					open: pasteOpen.value,
					"onUpdate:open": ($event) => pasteOpen.value = $event,
					car: __props.car,
					combination: __props.combination,
					onTake: (sides) => {
						lines.value = [...lines.value, ...sides.map((side) => (0, vue_exports.unref)(blankLine)(side.front, side.rear))];
					}
				}, null, _parent));
				_push(`<!--]-->`);
			}
			_push(`</section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Erfassung/LinesEditor.vue
var LinesEditor_exports = /* @__PURE__ */ __exportAll({ default: () => LinesEditor_default });
var _sfc_setup = LinesEditor_vue_vue_type_script_setup_true_lang_default.setup;
LinesEditor_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Erfassung/LinesEditor.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var LinesEditor_default = /*#__PURE__*/ _plugin_vue_export_helper_default(LinesEditor_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-5a88cb01"]]);
//#endregion
export { LinesEditor_exports as n, LinesEditor_default as t };
