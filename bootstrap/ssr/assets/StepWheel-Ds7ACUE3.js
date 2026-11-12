import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-D0z-a8p_.js";
import { t as AdminConfirm_default } from "./AdminConfirm-sC9Lzvnq.js";
import { f as send, m as useEntry, n as Refused } from "./entryStore-wk8wq0su.js";
import { t as createAutosave } from "./autosave-C5HjIjlG.js";
//#region resources/js/Pages/Admin/Gutachten/Erfassung/StepWheel.vue?vue&type=script&setup=true&lang.ts
var StepWheel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "StepWheel",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* Step 2, Felge (the Gutachten rework §7; the client's change of 07.11.2026): one paper is for one specific wheel, but it may allow
		* different versions of it front and rear. So the step builds wheel combinations: the model, then per combination a version for the
		* front axle and one for the rear, listed by dimension with their colours beneath. Colours are not chosen: every colour of a version
		* is covered. Picking the front takes the same version for the rear, until someone changes it; the same version front and rear is the
		* normal case. A paper can hold several combinations, each with its own cars' tyres.
		*
		* Beside it what the paper itself prints for the wheel, typed by staff: its Radtyp next to the wheel's Radtypenbezeichnung, so they
		* can see the two match (the second real paper sells as Rotiform NUE and prints RC200 8,5x20), and its Raddaten, one row per size it
		* names, compared with the versions chosen. A difference is a warning, never a block, and so are two bolt patterns on one car (the
		* operator's notes of 06.11.2026 and 07.11.2026). Saved as it is typed (autosave.ts).
		*/
		const store = useEntry();
		const { state, go } = store;
		const combinations = (0, vue_exports.computed)(() => state.entry.combinations);
		const sizes = (0, vue_exports.computed)(() => state.entry.wheelSizes);
		const severalModels = (0, vue_exports.computed)(() => new Set(sizes.value.map((size) => size.wheelModelId)).size > 1);
		const paperModelId = (0, vue_exports.computed)(() => sizes.value[0]?.wheelModelId ?? null);
		const query = (0, vue_exports.ref)(sizes.value[0]?.wheel ?? "");
		const found = (0, vue_exports.ref)([]);
		const more = (0, vue_exports.ref)(false);
		const searching = (0, vue_exports.ref)(false);
		const searched = (0, vue_exports.ref)(false);
		const searchFailed = (0, vue_exports.ref)(false);
		const failure = (0, vue_exports.ref)("");
		const errors = (0, vue_exports.ref)({});
		const model = (0, vue_exports.ref)(null);
		const frontKey = (0, vue_exports.ref)(null);
		const rearKey = (0, vue_exports.ref)(null);
		const rearFollows = (0, vue_exports.ref)(true);
		const editing = (0, vue_exports.ref)(null);
		const removing = (0, vue_exports.ref)(null);
		const removeOpen = (0, vue_exports.computed)({
			get: () => removing.value !== null,
			set: (open) => {
				if (!open) removing.value = null;
			}
		});
		const busy = (0, vue_exports.ref)(false);
		const changeOpen = (0, vue_exports.ref)(false);
		const leaveOpen = (0, vue_exports.ref)(false);
		const versions = (0, vue_exports.computed)(() => model.value?.sizes ?? []);
		const front = (0, vue_exports.computed)(() => versions.value.find((version) => version.key === frontKey.value) ?? null);
		const rear = (0, vue_exports.computed)(() => versions.value.find((version) => version.key === rearKey.value) ?? null);
		const same = (0, vue_exports.computed)(() => front.value !== null && front.value.key === rear.value?.key);
		const duplicate = (0, vue_exports.computed)(() => combinations.value.some((c) => c.id !== editing.value && c.frontKey === frontKey.value && c.rearKey === rearKey.value));
		const boltsDiffer = (0, vue_exports.computed)(() => front.value !== null && rear.value !== null && boltsOf(front.value) !== boltsOf(rear.value));
		const diametersDiffer = (0, vue_exports.computed)(() => front.value !== null && rear.value !== null && front.value.diameter !== rear.value.diameter);
		const editingNow = (0, vue_exports.computed)(() => combinations.value.find((c) => c.id === editing.value) ?? null);
		const swapping = (0, vue_exports.computed)(() => {
			const was = editingNow.value;
			return was !== null && !was.same && was.frontKey === rearKey.value && was.rearKey === frontKey.value;
		});
		const pending = (0, vue_exports.computed)(() => {
			if (front.value === null || rear.value === null || duplicate.value) return false;
			const was = editingNow.value;
			return was === null ? combinations.value.every((c) => c.frontKey !== frontKey.value || c.rearKey !== rearKey.value) : was.frontKey !== frontKey.value || was.rearKey !== rearKey.value;
		});
		const pendingLabel = (0, vue_exports.computed)(() => same.value ? `Vorne und hinten ${front.value?.short ?? ""}` : `Vorne ${front.value?.short ?? ""} · Hinten ${rear.value?.short ?? ""}`);
		function filled(id) {
			return state.entry.cars.some((car) => car.combinationId === id && car.lines + car.unread + car.codes > 0);
		}
		const changeBody = (0, vue_exports.computed)(() => {
			const label = editingNow.value?.label ?? "";
			return swapping.value ? `Bei ${label} sind schon Reifen eingetragen. Die Reifen tauschen mit: Was vorne steht, steht danach hinten.` : `Bei ${label} sind schon Reifen eingetragen. Sie bleiben stehen. Was nicht mehr zur neuen Felge passt, ist in Schritt 4 markiert, und die Freigabe wartet darauf.`;
		});
		function boltsOf(version) {
			return version.detail.split(" · ")[0] ?? "";
		}
		function resetChoice() {
			editing.value = null;
			frontKey.value = null;
			rearKey.value = null;
			rearFollows.value = true;
		}
		async function save() {
			if (front.value === null || rear.value === null || busy.value) return;
			if (editing.value !== null && !changeOpen.value && pending.value && filled(editing.value)) {
				changeOpen.value = true;
				return;
			}
			busy.value = true;
			failure.value = "";
			changeOpen.value = false;
			try {
				const body = {
					front_config_id: front.value.configId,
					rear_config_id: rear.value.configId
				};
				if (editing.value === null) await store.save("POST", "/kombinationen", body);
				else await store.save("PUT", `/kombinationen/${editing.value}`, body);
				resetChoice();
			} catch (error) {
				failure.value = error instanceof Refused ? Object.values(error.errors)[0]?.[0] ?? error.message : error instanceof Error ? error.message : "Das wurde nicht gespeichert.";
			} finally {
				busy.value = false;
			}
		}
		async function remove(combination) {
			if (busy.value) return;
			busy.value = true;
			failure.value = "";
			try {
				await store.save("DELETE", `/kombinationen/${combination.id}`);
				if (editing.value === combination.id) resetChoice();
			} catch (error) {
				failure.value = error instanceof Refused ? Object.values(error.errors)[0]?.[0] ?? error.message : error instanceof Error ? error.message : "Das wurde nicht gespeichert.";
			} finally {
				removing.value = null;
				busy.value = false;
			}
		}
		async function addAndLeave() {
			leaveOpen.value = false;
			changeOpen.value = editing.value !== null;
			await save();
			if (failure.value === "") go(2);
		}
		const blankRow = () => ({
			type: "",
			size: "",
			et: "",
			bolts: ""
		});
		const printedFilled = (0, vue_exports.computed)(() => state.entry.printed.length > 0);
		const printed = (0, vue_exports.reactive)(state.entry.printed.length > 0 ? state.entry.printed.map((row) => ({
			type: row.type ?? "",
			size: row.size,
			et: row.et === null ? "" : String(row.et),
			bolts: row.bolts
		})) : [blankRow()]);
		async function write() {
			errors.value = {};
			try {
				await store.save("PUT", "/felge", { printed: printed.map((row) => ({
					type: row.type,
					size: row.size,
					et: row.et.trim() === "" ? null : row.et.trim(),
					bolts: row.bolts
				})) });
				return true;
			} catch (error) {
				if (error instanceof Refused) errors.value = Object.fromEntries(Object.entries(error.errors).map(([key, list]) => [key, list[0] ?? ""]));
				else failure.value = error instanceof Error ? error.message : "Das wurde nicht gespeichert.";
				return false;
			}
		}
		const autosave = createAutosave({
			content: () => JSON.stringify(printed),
			write,
			delay: 700,
			clean: () => {
				errors.value = {};
				state.save = "saved";
			}
		});
		(0, vue_exports.watch)(printed, () => autosave.changed());
		let timer;
		let asked = 0;
		async function search() {
			const mine = ++asked;
			searching.value = true;
			searchFailed.value = false;
			try {
				const answer = await send("GET", `/admin/gutachten/suche/felgen?q=${encodeURIComponent(query.value.trim())}`);
				if (mine === asked) {
					found.value = answer.groups;
					more.value = answer.more;
					searched.value = true;
				}
			} catch {
				if (mine === asked) {
					found.value = [];
					searchFailed.value = true;
				}
			} finally {
				if (mine === asked) searching.value = false;
			}
		}
		(0, vue_exports.watch)(query, () => {
			if (model.value === null) {
				clearTimeout(timer);
				timer = setTimeout(() => void search(), 250);
			}
		});
		const modelFailed = (0, vue_exports.ref)(null);
		let modelAsked = 0;
		async function loadModel(id) {
			const mine = ++modelAsked;
			modelFailed.value = null;
			try {
				const answer = await send("GET", `/admin/gutachten/suche/felgen?q=&modell=${id}`);
				if (mine === modelAsked) model.value = answer.groups[0] ?? null;
			} catch {
				if (mine === modelAsked) modelFailed.value = id;
			}
		}
		let letGo = () => {};
		(0, vue_exports.onMounted)(() => {
			autosave.mark();
			letGo = store.hold(autosave);
			if (paperModelId.value !== null && !severalModels.value) loadModel(paperModelId.value);
			else if (query.value.trim() !== "") search();
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			letGo();
			clearTimeout(timer);
			if (autosave.owed()) autosave.flush();
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "ef-step",
				"aria-labelledby": "ef-wheel-h"
			}, _attrs))} data-v-33856634><h2 id="ef-wheel-h" class="adm-section__title" tabindex="-1" data-v-33856634>Für welche Felgenkombination gilt das Gutachten?</h2><p class="adm-note" data-v-33856634>Wähl die Ausführung der Felge für vorne und hinten. Meist ist es dieselbe. Gibt das Gutachten vorne und hinten verschiedene Größen frei, trag sie als eigene Kombination ein. Farben wählst du hier nicht: Der Eintrag gilt für jede Farbe einer Ausführung, auch für eine, die später dazukommt.</p>`);
			if (severalModels.value) {
				_push(`<div class="ef-wheel" data-v-33856634><p class="adm-note" data-v-33856634>Bei diesem Gutachten sind aus der früheren Erfassung mehrere Felgen hinterlegt. Sie bleiben, wie sie sind:</p><ul class="ef-wheel__list" data-v-33856634><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(combinations.value, (combination) => {
					_push(`<li data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(combination.label)}</li>`);
				});
				_push(`<!--]--></ul></div>`);
			} else {
				_push(`<div class="ef-wheel" data-v-33856634><div class="ef-wheel__main" data-v-33856634>`);
				if (model.value === null) _push(`<div class="form-field ef-wheel__search" data-v-33856634><label class="form-field__label" for="ef-wheel-q" data-v-33856634>Felge suchen</label><input id="ef-wheel-q"${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="input" type="search" placeholder="Marke, Modell oder Radtyp" autocomplete="off"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-33856634></div>`);
				else _push(`<!---->`);
				if (model.value === null) {
					_push(`<div class="ef-wheel__hits" data-v-33856634><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(found.value, (hit) => {
						_push(`<button class="ef-model" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-33856634><span class="ef-model__name" data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(hit.model)}</span>`);
						if (hit.demo) _push(`<span class="adm-tag adm-tag--neutral" data-v-33856634>Demodaten</span>`);
						else _push(`<!---->`);
						_push(`<span class="ef-model__sub" data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(hit.sizes.length)} ${(0, server_renderer_exports.ssrInterpolate)(hit.sizes.length === 1 ? "Ausführung" : "Ausführungen")}`);
						if (hit.wheelType) _push(`<!--[--> · Radtyp ${(0, server_renderer_exports.ssrInterpolate)(hit.wheelType)}<!--]-->`);
						else _push(`<!---->`);
						_push(`</span></button>`);
					});
					_push(`<!--]-->`);
					if (searchFailed.value) _push(`<p class="adm-alert" role="alert" data-v-33856634>Die Suche hat nicht geantwortet. Versuch es noch einmal.</p>`);
					else if (searched.value && !searching.value && found.value.length === 0) _push(`<p class="adm-note" data-v-33856634>Keine Felge gefunden. Felgen legst du unter Katalog › Felgen an.</p>`);
					else _push(`<!---->`);
					if (more.value) _push(`<p class="adm-note" data-v-33856634>Es gibt mehr Treffer. Grenz die Suche ein.</p>`);
					else _push(`<!---->`);
					_push(`</div>`);
				} else {
					_push(`<div class="ef-wheel__model" data-v-33856634><p class="ef-wheel__chosen" data-v-33856634><strong data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(model.value.model)}</strong>`);
					if (model.value.wheelType) _push(`<!--[--> · Radtyp bei der Felge: ${(0, server_renderer_exports.ssrInterpolate)(model.value.wheelType)}<!--]-->`);
					else _push(`<!---->`);
					if ((0, vue_exports.unref)(state).editable && combinations.value.length === 0) _push(`<button class="ef-link" type="button" data-v-33856634>Andere Felge</button>`);
					else _push(`<!---->`);
					_push(`</p></div>`);
				}
				if (modelFailed.value !== null) _push(`<p class="adm-alert" role="alert" data-v-33856634> Die Ausführungen dieser Felge haben nicht geladen. <button class="ef-link" type="button" data-v-33856634>Noch einmal laden</button></p>`);
				else _push(`<!---->`);
				if (model.value) {
					_push(`<div id="ef-axles" class="ef-axles" data-v-33856634><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(["front", "rear"], (side) => {
						_push(`<fieldset class="ef-fieldset ef-axle" data-v-33856634><legend class="ef-axle__title" data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(side === "front" ? "Vorderachse" : "Hinterachse")}</legend><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(versions.value, (version) => {
							_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "ef-size--on": (side === "front" ? frontKey.value : rearKey.value) === version.key }, "ef-size"])}" data-v-33856634><input class="ef-size__radio" type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", `ef-version-${side}`)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)((side === "front" ? frontKey.value : rearKey.value) === version.key) ? " checked" : ""}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("data-version", version.short)} data-v-33856634><span class="ef-size__text" data-v-33856634><span class="ef-size__dim" data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(version.short)}</span><span class="ef-size__detail" data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(version.detail)}</span><span class="ef-size__colours" data-v-33856634><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(version.colours, (colour) => {
								_push(`<span class="ef-size__colour" data-v-33856634><span class="ef-dot" data-qa-ignore style="${(0, server_renderer_exports.ssrRenderStyle)(colour.hex ? { "--swatch": colour.hex } : void 0)}" data-v-33856634></span> ${(0, server_renderer_exports.ssrInterpolate)(colour.name)}</span>`);
							});
							_push(`<!--]-->`);
							if (version.colours.length === 1) _push(`<span class="ef-size__only" data-v-33856634>nur in dieser Farbe</span>`);
							else _push(`<!---->`);
							_push(`</span></span></label>`);
						});
						_push(`<!--]--></fieldset>`);
					});
					_push(`<!--]--></div>`);
				} else _push(`<!---->`);
				_push(`<details class="ef-more"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(printedFilled.value) ? " open" : ""} data-v-33856634><summary class="ef-more__summary" data-v-33856634>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "chevron-down",
					size: 16,
					class: "ef-more__marker"
				}, null, _parent));
				_push(` Felge so eintragen, wie sie im Gutachten steht (optional) </summary><div class="ef-more__body" data-v-33856634><fieldset class="ef-fieldset ef-printed" data-v-33856634><p class="form-field__help" data-v-33856634>Zum Vergleich mit den gewählten Ausführungen. Weicht etwas ab, sagen wir es dir; freigeben kannst du trotzdem. Nennt das Gutachten mehrere Größen, trag sie einzeln ein.</p><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(printed, (row, i) => {
					_push(`<div class="ef-printed__grid" data-v-33856634><div class="form-field" data-v-33856634><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `ef-printed-type-${i}`)} data-v-33856634>Radtyp</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `ef-printed-type-${i}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", row.type)} class="input" type="text" maxlength="64" spellcheck="false" placeholder="z. B. RC200 8,5x20"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-33856634></div><div class="form-field" data-v-33856634><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `ef-printed-size-${i}`)} data-v-33856634>Radgröße</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `ef-printed-size-${i}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", row.size)} class="input" type="text" maxlength="32" spellcheck="false" placeholder="z. B. 8 1/2 J X 18 H2"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value[`printed.${i}.size`] ? "true" : void 0)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-33856634><p class="form-field__error" data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(errors.value[`printed.${i}.size`])}</p></div><div class="form-field" data-v-33856634><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `ef-printed-et-${i}`)} data-v-33856634>Einpresstiefe</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `ef-printed-et-${i}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", row.et)} class="input" type="text" inputmode="numeric" maxlength="16" placeholder="z. B. 35"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value[`printed.${i}.et`] ? "true" : void 0)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-33856634><p class="form-field__error" data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(errors.value[`printed.${i}.et`])}</p></div><div class="form-field" data-v-33856634><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `ef-printed-bolts-${i}`)} data-v-33856634>Lochkreis</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `ef-printed-bolts-${i}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", row.bolts)} class="input" type="text" maxlength="16" spellcheck="false" placeholder="z. B. 120/5"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value[`printed.${i}.bolts`] ? "true" : void 0)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-33856634><p class="form-field__error" data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(errors.value[`printed.${i}.bolts`])}</p></div>`);
					if (printed.length > 1 && (0, vue_exports.unref)(state).editable) _push(`<button class="ef-link ef-printed__remove" type="button" data-v-33856634>Zeile entfernen</button>`);
					else _push(`<!---->`);
					_push(`</div>`);
				});
				_push(`<!--]-->`);
				if ((0, vue_exports.unref)(state).editable && printed.length < 8) {
					_push(`<button class="btn btn--ghost ef-printed__add" type="button" data-v-33856634>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "plus",
						size: 20
					}, null, _parent));
					_push(` Weitere Größe aus dem Gutachten </button>`);
				} else _push(`<!---->`);
				_push(`</fieldset></div></details></div><aside class="ef-wheel__side" aria-label="Felgenkombinationen" data-v-33856634>`);
				if (model.value) {
					_push(`<section class="ef-pick" aria-labelledby="ef-pick-h" data-v-33856634><h3 id="ef-pick-h" class="ef-side__title" data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(editing.value === null ? "Neue Felgenkombination" : "Felgenkombination ändern")}</h3>`);
					if (front.value === null) _push(`<p class="adm-note" data-v-33856634>Wähl zuerst die Ausführung für vorne. Hinten nehmen wir dieselbe, bis du eine andere wählst.</p>`);
					else {
						_push(`<!--[--><p class="ef-pick__line" data-v-33856634><span class="ef-pick__axle" data-v-33856634>Vorne</span> ${(0, server_renderer_exports.ssrInterpolate)(front.value.short)}</p><p class="ef-pick__line" data-v-33856634><span class="ef-pick__axle" data-v-33856634>Hinten</span> ${(0, server_renderer_exports.ssrInterpolate)(rear.value?.short ?? "–")}</p><span class="adm-tag adm-tag--neutral" data-pick-badge data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(same.value ? "gleich vorne und hinten" : "vorne und hinten verschieden")}</span>`);
						if ((0, vue_exports.unref)(state).editable && !same.value) _push(`<button class="ef-link" type="button" data-v-33856634>Achsen tauschen</button>`);
						else _push(`<!---->`);
						if (boltsDiffer.value) _push(`<p class="ef-warn" role="status" data-v-33856634>Vorne und hinten haben verschiedene Lochkreise: ${(0, server_renderer_exports.ssrInterpolate)(boltsOf(front.value))} und ${(0, server_renderer_exports.ssrInterpolate)(rear.value ? boltsOf(rear.value) : "")}.</p>`);
						else _push(`<!---->`);
						if (diametersDiffer.value) _push(`<p class="adm-note" data-v-33856634>Die Felgen haben vorne und hinten verschiedene Durchmesser: In Schritt 4 trägst du je Zeile beide Reifengrößen ein.</p>`);
						else _push(`<!---->`);
						if (duplicate.value) _push(`<p class="ef-warn" role="status" data-v-33856634>Diese Kombination ist schon eingetragen.</p>`);
						else _push(`<!---->`);
						_push(`<!--]-->`);
					}
					if (failure.value) _push(`<p class="adm-alert" role="alert" data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(failure.value)}</p>`);
					else _push(`<!---->`);
					if ((0, vue_exports.unref)(state).editable) {
						_push(`<div class="ef-pick__actions" data-v-33856634><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(front.value === null || rear.value === null || duplicate.value || busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-33856634>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: editing.value === null ? "plus" : "check",
							size: 20
						}, null, _parent));
						_push(` ${(0, server_renderer_exports.ssrInterpolate)(editing.value === null ? "Felgenkombination hinzufügen" : "Änderung speichern")}</button>`);
						if (editing.value !== null || front.value !== null) _push(`<button class="btn btn--ghost" type="button" data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(editing.value === null ? "Auswahl verwerfen" : "Abbrechen")}</button>`);
						else _push(`<!---->`);
						_push(`</div>`);
					} else _push(`<!---->`);
					_push(`</section>`);
				} else _push(`<!---->`);
				_push(`<section class="ef-combos" aria-labelledby="ef-combos-h" data-v-33856634><h3 id="ef-combos-h" class="ef-side__title" data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(combinations.value.length === 1 ? "1 Felgenkombination eingetragen" : `${combinations.value.length} Felgenkombinationen eingetragen`)}</h3>`);
				if (combinations.value.length === 0) _push(`<p class="adm-note" data-v-33856634>Noch keine. Wähl die Felge, dann vorne und hinten eine Ausführung.</p>`);
				else {
					_push(`<ul class="ef-combos__list" data-v-33856634><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(combinations.value, (combination) => {
						_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{ "ef-combo--on": editing.value === combination.id }, "ef-combo"])}"${(0, server_renderer_exports.ssrRenderAttr)("data-combination", combination.id)} data-v-33856634><p class="ef-combo__label" data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(combination.label)}</p><span class="adm-tag adm-tag--neutral" data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(combination.badge)}</span><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(combination.warnings, (warning) => {
							_push(`<p class="ef-warn" role="status" data-v-33856634>${(0, server_renderer_exports.ssrInterpolate)(warning)}</p>`);
						});
						_push(`<!--]-->`);
						if ((0, vue_exports.unref)(state).editable) _push(`<div class="ef-combo__actions" data-v-33856634><button class="ef-link" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(model.value === null) ? " disabled" : ""} data-v-33856634>Bearbeiten</button><button class="ef-link" type="button" data-v-33856634>Entfernen</button></div>`);
						else _push(`<!---->`);
						_push(`</li>`);
					});
					_push(`<!--]--></ul>`);
				}
				_push(`</section></aside></div>`);
			}
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
				open: removeOpen.value,
				"onUpdate:open": ($event) => removeOpen.value = $event,
				title: "Kombination entfernen?",
				body: removing.value ? `${removing.value.label} wird aus dieser Erfassung entfernt, mit den Reifen, die dafür bei den Fahrzeugen eingetragen sind.` : "",
				"confirm-label": "Entfernen",
				busy: busy.value,
				onConfirm: ($event) => removing.value && remove(removing.value)
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
				open: changeOpen.value,
				"onUpdate:open": ($event) => changeOpen.value = $event,
				title: "Kombination ändern?",
				body: changeBody.value,
				"confirm-label": swapping.value ? "Achsen tauschen" : "Ändern",
				busy: busy.value,
				onConfirm: save
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
				open: leaveOpen.value,
				"onUpdate:open": ($event) => leaveOpen.value = $event,
				title: "Auswahl noch nicht eingetragen",
				body: `${pendingLabel.value} ist noch nicht eingetragen.`,
				"confirm-label": editing.value === null ? "Hinzufügen und weiter" : "Speichern und weiter",
				busy: busy.value,
				onConfirm: addAndLeave
			}, null, _parent));
			_push(`<div class="ef-actions" data-v-33856634><button class="btn btn--secondary ef-actions__left" type="button" data-v-33856634>Zurück</button>`);
			if (pending.value) _push(`<p class="adm-note ef-actions__note" role="status" data-v-33856634>Deine Auswahl ist noch nicht eingetragen.</p>`);
			else _push(`<!---->`);
			_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([pending.value ? "btn--secondary" : "btn--primary", "btn"])}" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(combinations.value.length === 0) ? " disabled" : ""} data-v-33856634> Weiter: Fahrzeuge `);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "arrow-right",
				size: 20
			}, null, _parent));
			_push(`</button></div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Erfassung/StepWheel.vue
var StepWheel_exports = /* @__PURE__ */ __exportAll({ default: () => StepWheel_default });
var _sfc_setup = StepWheel_vue_vue_type_script_setup_true_lang_default.setup;
StepWheel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Erfassung/StepWheel.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var StepWheel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(StepWheel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-33856634"]]);
//#endregion
export { StepWheel_exports as n, StepWheel_default as t };
