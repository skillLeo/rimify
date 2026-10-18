import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BSZH2tn1.js";
import { c as router, o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { t as AdminState_default } from "./AdminState-QyYV7E7y.js";
//#region resources/js/Pages/Admin/Review/Feedback.vue?vue&type=script&setup=true&lang.ts
var Feedback_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Feedback",
	__ssrInlineRender: true,
	props: {
		items: {},
		filters: {},
		total: {},
		types: {},
		statuses: {},
		screens: {},
		team: {},
		can: {}
	},
	setup(__props) {
		/**
		* Review › Rückmeldungen (the review release §3): every point of the review with where it was made,
		* what it looked like and what was said — and our answer: its state (neu, angenommen, erledigt,
		* abgelehnt with a reason), who has it, and what we say back. Filtered by kind, screen and state.
		* `R` gives a new point from anywhere; `php artisan review:report` writes these out.
		*/
		const props = __props;
		const typ = (0, vue_exports.ref)(props.filters.typ);
		const seite = (0, vue_exports.ref)(props.filters.seite);
		const status = (0, vue_exports.ref)(props.filters.status);
		(0, vue_exports.watch)(() => props.filters, (filters) => {
			typ.value = filters.typ;
			seite.value = filters.seite;
			status.value = filters.status;
		});
		function apply() {
			const query = {};
			if (typ.value) query.typ = typ.value;
			if (seite.value) query.seite = seite.value;
			if (status.value && status.value !== "offen") query.status = status.value;
			router.get("/admin/review/rueckmeldungen", query, {
				preserveScroll: true,
				preserveState: true
			});
		}
		function resetFilters() {
			typ.value = "";
			seite.value = "";
			status.value = "alle";
			apply();
		}
		const editing = (0, vue_exports.ref)(null);
		const answer = useForm({
			status: "neu",
			answer: "",
			assignee_id: null
		});
		const drafts = /* @__PURE__ */ new Map();
		function edit(item) {
			if (editing.value !== null && editing.value !== item.id && answer.isDirty) drafts.set(editing.value, {
				status: answer.status,
				answer: answer.answer,
				assignee_id: answer.assignee_id
			});
			editing.value = item.id;
			answer.defaults({
				status: item.status,
				answer: item.answer,
				assignee_id: item.assigneeId
			});
			answer.reset();
			answer.clearErrors();
			const draft = drafts.get(item.id);
			if (draft) Object.assign(answer, draft);
			(0, vue_exports.nextTick)(() => document.getElementById(`rf-a-status-${item.id}`)?.focus());
		}
		function close(id) {
			editing.value = null;
			(0, vue_exports.nextTick)(() => document.querySelector(`[data-answer="${id}"]`)?.focus());
		}
		function save(item) {
			if (answer.processing) return;
			answer.patch(`/admin/review/rueckmeldungen/${item.id}`, {
				preserveScroll: true,
				onSuccess: () => {
					drafts.delete(item.id);
					close(item.id);
				},
				onError: () => void (0, vue_exports.nextTick)(() => document.querySelector(".rf-answer [aria-invalid=\"true\"]")?.focus())
			});
		}
		function tag(stateValue) {
			return stateValue === "neu" ? "adm-tag adm-tag--neutral" : null;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Rückmeldungen",
				context: __props.items.length === 1 ? "1 Rückmeldung" : `${(0, vue_exports.unref)(decimal)(__props.items.length, 0)} Rückmeldungen`
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<form class="rf-filters" data-v-8b108054${_scopeId}><div class="form-field" data-v-8b108054${_scopeId}><label class="form-field__label" for="rf-typ" data-v-8b108054${_scopeId}>Art</label><select id="rf-typ" class="input" data-v-8b108054${_scopeId}><option value="" data-v-8b108054${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(typ.value) ? (0, server_renderer_exports.ssrLooseContain)(typ.value, "") : (0, server_renderer_exports.ssrLooseEqual)(typ.value, "")) ? " selected" : ""}${_scopeId}>Alle</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.types, (option) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", option.value)} data-v-8b108054${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(typ.value) ? (0, server_renderer_exports.ssrLooseContain)(typ.value, option.value) : (0, server_renderer_exports.ssrLooseEqual)(typ.value, option.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(option.label)}</option>`);
						});
						_push(`<!--]--></select></div><div class="form-field" data-v-8b108054${_scopeId}><label class="form-field__label" for="rf-seite" data-v-8b108054${_scopeId}>Seite</label><select id="rf-seite" class="input" data-v-8b108054${_scopeId}><option value="" data-v-8b108054${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(seite.value) ? (0, server_renderer_exports.ssrLooseContain)(seite.value, "") : (0, server_renderer_exports.ssrLooseEqual)(seite.value, "")) ? " selected" : ""}${_scopeId}>Alle</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.screens, (screen) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", screen)} data-v-8b108054${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(seite.value) ? (0, server_renderer_exports.ssrLooseContain)(seite.value, screen) : (0, server_renderer_exports.ssrLooseEqual)(seite.value, screen)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(screen)}</option>`);
						});
						_push(`<!--]--></select></div><div class="form-field" data-v-8b108054${_scopeId}><label class="form-field__label" for="rf-status" data-v-8b108054${_scopeId}>Stand</label><select id="rf-status" class="input" data-v-8b108054${_scopeId}><option value="offen" data-v-8b108054${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(status.value) ? (0, server_renderer_exports.ssrLooseContain)(status.value, "offen") : (0, server_renderer_exports.ssrLooseEqual)(status.value, "offen")) ? " selected" : ""}${_scopeId}>Offen (neu und angenommen)</option><option value="alle" data-v-8b108054${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(status.value) ? (0, server_renderer_exports.ssrLooseContain)(status.value, "alle") : (0, server_renderer_exports.ssrLooseEqual)(status.value, "alle")) ? " selected" : ""}${_scopeId}>Alle</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.statuses, (option) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", option.value)} data-v-8b108054${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(status.value) ? (0, server_renderer_exports.ssrLooseContain)(status.value, option.value) : (0, server_renderer_exports.ssrLooseEqual)(status.value, option.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(option.label)}</option>`);
						});
						_push(`<!--]--></select></div><div class="rf-filters__go" data-v-8b108054${_scopeId}><button class="btn btn--secondary" type="submit" data-v-8b108054${_scopeId}>Anwenden</button></div></form>`);
						if (__props.items.length === 0 && __props.total === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Hier erscheint jede Rückmeldung aus der Abnahme. Gib die erste mit „Rückmeldung geben“ – am Rechner auch mit der Taste R."
						}, null, _parent, _scopeId));
						else if (__props.items.length === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "filtered",
							total: __props.total,
							onReset: resetFilters
						}, null, _parent, _scopeId));
						else {
							_push(`<ol class="rf-list" data-v-8b108054${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.items, (item) => {
								_push(`<li class="rf-item" data-v-8b108054${_scopeId}><div class="rf-item__head" data-v-8b108054${_scopeId}><span class="rf-item__id" data-v-8b108054${_scopeId}>#${(0, server_renderer_exports.ssrInterpolate)(item.id)}</span><span class="rf-item__kind" data-v-8b108054${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.typeLabel)} · ${(0, server_renderer_exports.ssrInterpolate)(item.screen)}</span>`);
								if (tag(item.status)) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)(tag(item.status))}" data-v-8b108054${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.statusLabel)}</span>`);
								else {
									_push(`<span class="rf-item__state" data-v-8b108054${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.statusLabel)}`);
									if (item.closedAt) _push(`<!--[--> am ${(0, server_renderer_exports.ssrInterpolate)(item.closedAt)}<!--]-->`);
									else _push(`<!---->`);
									_push(`</span>`);
								}
								_push(`</div><div class="rf-item__body" data-v-8b108054${_scopeId}>`);
								if (item.image) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", item.image)} target="_blank" rel="noopener" class="rf-item__shot" data-v-8b108054${_scopeId}><img${(0, server_renderer_exports.ssrRenderAttr)("src", item.image)}${(0, server_renderer_exports.ssrRenderAttr)("alt", `Bildschirmfoto zu Rückmeldung ${item.id}`)} loading="lazy" data-v-8b108054${_scopeId}></a>`);
								else _push(`<!---->`);
								_push(`<div class="rf-item__text" data-v-8b108054${_scopeId}><p class="rf-item__sentence" data-v-8b108054${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.sentence)}</p><p class="rf-item__meta" data-v-8b108054${_scopeId}><a${(0, server_renderer_exports.ssrRenderAttr)("href", item.url)} data-v-8b108054${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.url)}</a> · ${(0, server_renderer_exports.ssrInterpolate)(item.viewport)} · ${(0, server_renderer_exports.ssrInterpolate)(item.browser)}`);
								if (item.role) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(item.role)}<!--]-->`);
								else _push(`<!---->`);
								_push(` · ${(0, server_renderer_exports.ssrInterpolate)(item.by ?? "unbekannt")}, ${(0, server_renderer_exports.ssrInterpolate)(item.at)}</p>`);
								if (item.answer && editing.value !== item.id) _push(`<p class="rf-item__answer" data-v-8b108054${_scopeId}><strong data-v-8b108054${_scopeId}>Unsere Antwort:</strong> ${(0, server_renderer_exports.ssrInterpolate)(item.answer)}</p>`);
								else _push(`<!---->`);
								if (item.assignee && editing.value !== item.id) _push(`<p class="rf-item__meta" data-v-8b108054${_scopeId}>Bei ${(0, server_renderer_exports.ssrInterpolate)(item.assignee)}</p>`);
								else _push(`<!---->`);
								if (__props.can.answer) {
									_push(`<div class="rf-item__actions" data-v-8b108054${_scopeId}>`);
									if (editing.value !== item.id) _push(`<button class="btn btn--secondary rf-item__answerbtn" type="button"${(0, server_renderer_exports.ssrRenderAttr)("data-answer", item.id)} data-v-8b108054${_scopeId}>Beantworten</button>`);
									else {
										_push(`<form class="rf-answer" data-v-8b108054${_scopeId}><div class="rf-answer__pair" data-v-8b108054${_scopeId}><div class="form-field" data-v-8b108054${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `rf-a-status-${item.id}`)} data-v-8b108054${_scopeId}>Stand</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `rf-a-status-${item.id}`)} class="input" data-v-8b108054${_scopeId}><!--[-->`);
										(0, server_renderer_exports.ssrRenderList)(__props.statuses, (option) => {
											_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", option.value)} data-v-8b108054${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(answer).status) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(answer).status, option.value) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(answer).status, option.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(option.label)}</option>`);
										});
										_push(`<!--]--></select></div><div class="form-field" data-v-8b108054${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `rf-a-who-${item.id}`)} data-v-8b108054${_scopeId}>Zuständig</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `rf-a-who-${item.id}`)} class="input" data-v-8b108054${_scopeId}><option${(0, server_renderer_exports.ssrRenderAttr)("value", null)} data-v-8b108054${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(answer).assignee_id) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(answer).assignee_id, null) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(answer).assignee_id, null)) ? " selected" : ""}${_scopeId}>Niemand</option><!--[-->`);
										(0, server_renderer_exports.ssrRenderList)(__props.team, (person) => {
											_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", person.value)} data-v-8b108054${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(answer).assignee_id) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(answer).assignee_id, person.value) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(answer).assignee_id, person.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(person.label)}</option>`);
										});
										_push(`<!--]--></select></div></div><div class="form-field" data-v-8b108054${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `rf-a-text-${item.id}`)} data-v-8b108054${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(answer).status === "abgelehnt" ? "Begründung" : "Antwort")}</label><textarea${(0, server_renderer_exports.ssrRenderAttr)("id", `rf-a-text-${item.id}`)} class="input rf-area" rows="3" maxlength="2000"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(answer).errors.answer ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `rf-a-text-${item.id}-err`)} data-v-8b108054${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(answer).answer)}</textarea><p${(0, server_renderer_exports.ssrRenderAttr)("id", `rf-a-text-${item.id}-err`)} class="form-field__error" data-v-8b108054${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(answer).errors.answer)}</p></div><div class="rf-answer__go" data-v-8b108054${_scopeId}><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(answer).processing) ? " disabled" : ""} data-v-8b108054${_scopeId}>Speichern</button><button class="btn btn--ghost" type="button" data-v-8b108054${_scopeId}>Abbrechen</button></div></form>`);
									}
									_push(`</div>`);
								} else _push(`<!---->`);
								_push(`</div></div></li>`);
							});
							_push(`<!--]--></ol>`);
						}
					} else return [(0, vue_exports.createVNode)("form", {
						class: "rf-filters",
						onSubmit: (0, vue_exports.withModifiers)(apply, ["prevent"])
					}, [
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
							class: "form-field__label",
							for: "rf-typ"
						}, "Art"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
							id: "rf-typ",
							"onUpdate:modelValue": ($event) => typ.value = $event,
							class: "input"
						}, [(0, vue_exports.createVNode)("option", { value: "" }, "Alle"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.types, (option) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
								key: option.value,
								value: option.value
							}, (0, vue_exports.toDisplayString)(option.label), 9, ["value"]);
						}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, typ.value]])]),
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
							class: "form-field__label",
							for: "rf-seite"
						}, "Seite"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
							id: "rf-seite",
							"onUpdate:modelValue": ($event) => seite.value = $event,
							class: "input"
						}, [(0, vue_exports.createVNode)("option", { value: "" }, "Alle"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.screens, (screen) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
								key: screen,
								value: screen
							}, (0, vue_exports.toDisplayString)(screen), 9, ["value"]);
						}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, seite.value]])]),
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
							class: "form-field__label",
							for: "rf-status"
						}, "Stand"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
							id: "rf-status",
							"onUpdate:modelValue": ($event) => status.value = $event,
							class: "input"
						}, [
							(0, vue_exports.createVNode)("option", { value: "offen" }, "Offen (neu und angenommen)"),
							(0, vue_exports.createVNode)("option", { value: "alle" }, "Alle"),
							((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.statuses, (option) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
									key: option.value,
									value: option.value
								}, (0, vue_exports.toDisplayString)(option.label), 9, ["value"]);
							}), 128))
						], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, status.value]])]),
						(0, vue_exports.createVNode)("div", { class: "rf-filters__go" }, [(0, vue_exports.createVNode)("button", {
							class: "btn btn--secondary",
							type: "submit"
						}, "Anwenden")])
					], 32), __props.items.length === 0 && __props.total === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
						key: 0,
						kind: "empty",
						text: "Hier erscheint jede Rückmeldung aus der Abnahme. Gib die erste mit „Rückmeldung geben“ – am Rechner auch mit der Taste R."
					})) : __props.items.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
						key: 1,
						kind: "filtered",
						total: __props.total,
						onReset: resetFilters
					}, null, 8, ["total"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ol", {
						key: 2,
						class: "rf-list"
					}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.items, (item) => {
						return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
							key: item.id,
							class: "rf-item"
						}, [(0, vue_exports.createVNode)("div", { class: "rf-item__head" }, [
							(0, vue_exports.createVNode)("span", { class: "rf-item__id" }, "#" + (0, vue_exports.toDisplayString)(item.id), 1),
							(0, vue_exports.createVNode)("span", { class: "rf-item__kind" }, (0, vue_exports.toDisplayString)(item.typeLabel) + " · " + (0, vue_exports.toDisplayString)(item.screen), 1),
							tag(item.status) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 0,
								class: tag(item.status)
							}, (0, vue_exports.toDisplayString)(item.statusLabel), 3)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 1,
								class: "rf-item__state"
							}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.statusLabel), 1), item.closedAt ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" am " + (0, vue_exports.toDisplayString)(item.closedAt), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)]))
						]), (0, vue_exports.createVNode)("div", { class: "rf-item__body" }, [item.image ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("a", {
							key: 0,
							href: item.image,
							target: "_blank",
							rel: "noopener",
							class: "rf-item__shot"
						}, [(0, vue_exports.createVNode)("img", {
							src: item.image,
							alt: `Bildschirmfoto zu Rückmeldung ${item.id}`,
							loading: "lazy"
						}, null, 8, ["src", "alt"])], 8, ["href"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)("div", { class: "rf-item__text" }, [
							(0, vue_exports.createVNode)("p", { class: "rf-item__sentence" }, (0, vue_exports.toDisplayString)(item.sentence), 1),
							(0, vue_exports.createVNode)("p", { class: "rf-item__meta" }, [
								(0, vue_exports.createVNode)("a", { href: item.url }, (0, vue_exports.toDisplayString)(item.url), 9, ["href"]),
								(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(item.viewport) + " · " + (0, vue_exports.toDisplayString)(item.browser), 1),
								item.role ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(item.role), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(item.by ?? "unbekannt") + ", " + (0, vue_exports.toDisplayString)(item.at), 1)
							]),
							item.answer && editing.value !== item.id ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "rf-item__answer"
							}, [(0, vue_exports.createVNode)("strong", null, "Unsere Antwort:"), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(item.answer), 1)])) : (0, vue_exports.createCommentVNode)("", true),
							item.assignee && editing.value !== item.id ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 1,
								class: "rf-item__meta"
							}, "Bei " + (0, vue_exports.toDisplayString)(item.assignee), 1)) : (0, vue_exports.createCommentVNode)("", true),
							__props.can.answer ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 2,
								class: "rf-item__actions"
							}, [editing.value !== item.id ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
								key: 0,
								class: "btn btn--secondary rf-item__answerbtn",
								type: "button",
								"data-answer": item.id,
								onClick: ($event) => edit(item)
							}, "Beantworten", 8, ["data-answer", "onClick"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("form", {
								key: 1,
								class: "rf-answer",
								onSubmit: (0, vue_exports.withModifiers)(($event) => save(item), ["prevent"])
							}, [
								(0, vue_exports.createVNode)("div", { class: "rf-answer__pair" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: `rf-a-status-${item.id}`
								}, "Stand", 8, ["for"]), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: `rf-a-status-${item.id}`,
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(answer).status = $event,
									class: "input"
								}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.statuses, (option) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
										key: option.value,
										value: option.value
									}, (0, vue_exports.toDisplayString)(option.label), 9, ["value"]);
								}), 128))], 8, ["id", "onUpdate:modelValue"]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(answer).status]])]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: `rf-a-who-${item.id}`
								}, "Zuständig", 8, ["for"]), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: `rf-a-who-${item.id}`,
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(answer).assignee_id = $event,
									class: "input"
								}, [(0, vue_exports.createVNode)("option", { value: null }, "Niemand"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.team, (person) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
										key: person.value,
										value: person.value
									}, (0, vue_exports.toDisplayString)(person.label), 9, ["value"]);
								}), 128))], 8, ["id", "onUpdate:modelValue"]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(answer).assignee_id]])])]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: `rf-a-text-${item.id}`
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(answer).status === "abgelehnt" ? "Begründung" : "Antwort"), 9, ["for"]),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("textarea", {
										id: `rf-a-text-${item.id}`,
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(answer).answer = $event,
										class: "input rf-area",
										rows: "3",
										maxlength: "2000",
										"aria-invalid": (0, vue_exports.unref)(answer).errors.answer ? "true" : void 0,
										"aria-describedby": `rf-a-text-${item.id}-err`
									}, null, 8, [
										"id",
										"onUpdate:modelValue",
										"aria-invalid",
										"aria-describedby"
									]), [[vue_exports.vModelText, (0, vue_exports.unref)(answer).answer]]),
									(0, vue_exports.createVNode)("p", {
										id: `rf-a-text-${item.id}-err`,
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(answer).errors.answer), 9, ["id"])
								]),
								(0, vue_exports.createVNode)("div", { class: "rf-answer__go" }, [(0, vue_exports.createVNode)("button", {
									class: "btn btn--primary",
									type: "submit",
									disabled: (0, vue_exports.unref)(answer).processing
								}, "Speichern", 8, ["disabled"]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--ghost",
									type: "button",
									onClick: ($event) => close(item.id)
								}, "Abbrechen", 8, ["onClick"])])
							], 40, ["onSubmit"]))])) : (0, vue_exports.createCommentVNode)("", true)
						])])]);
					}), 128))]))];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Review/Feedback.vue
var _sfc_setup = Feedback_vue_vue_type_script_setup_true_lang_default.setup;
Feedback_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Review/Feedback.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Feedback_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Feedback_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-8b108054"]]);
//#endregion
export { Feedback_default as default };
