import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-rIU_td1t.js";
import { a as link_default, o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminConfirm_default } from "./AdminConfirm-DBodxbIw.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { t as stampHeaders } from "./useDirtyForm-Dq1y6dPH.js";
import { n as focusRefused } from "./focusRefused-BCX3fX_F.js";
import { t as IdentityForm_default } from "./IdentityForm-BAXEjFOU.js";
//#region resources/js/Pages/Admin/Fahrzeuge/Show.vue?vue&type=script&setup=true&lang.ts
/** One heading per Gutachten, in the order the server sends them — as Gutachten › Dokument groups by vehicle. */
var Show_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Show",
	__ssrInlineRender: true,
	props: {
		vehicle: {},
		rows: {},
		rowsTotal: {},
		topSpeed: {},
		owed: {},
		can: {},
		stamp: {},
		identity: {},
		bodyForms: {},
		drives: {}
	},
	setup(__props) {
		/**
		* Fahrzeuge › one vehicle — its keys and build period, the legal data a verdict needs (axle loads and
		* top speed, fields 8.1, 8.2 and T of the Zulassungsbescheinigung), and every Gutachten row that names
		* it. Without the axle loads — and the top speed, where a released Gutachten for this car needs it (D-284) —
		* the shop answers the wheel and leaves the tyres „Noch nicht bestätigt“ until a customer enters their own
		* papers (D-286); entered here, they answer every customer at once. Field T is asked only where it is needed,
		* and the page names the documents that need it and why (D-287). Entering all three is the review (R-03).
		*/
		const props = __props;
		const correcting = (0, vue_exports.ref)(false);
		const ruleLine = (0, vue_exports.computed)(() => {
			if (props.identity === void 0) return null;
			return props.identity.correctable ? "Ein Fahrzeug wird nie gelöscht. Seine Angaben kannst du korrigieren, solange nichts darauf verweist." : `Ein Fahrzeug wird nie gelöscht. ${props.identity.why ?? ""}`.trim();
		});
		const groups = (0, vue_exports.computed)(() => {
			const byDocument = /* @__PURE__ */ new Map();
			for (const row of props.rows) {
				const group = byDocument.get(row.documentId) ?? {
					id: row.documentId,
					document: row.document,
					href: row.documentHref,
					rows: []
				};
				group.rows.push(row);
				byDocument.set(row.documentId, group);
			}
			return [...byDocument.values()].map((group) => {
				const released = group.rows.filter((row) => row.status === "published").length;
				const rows = group.rows.length === 1 ? "1 Zeile" : `${decimal(group.rows.length, 0)} Zeilen`;
				return {
					...group,
					summary: released === group.rows.length ? `${rows}, alle freigegeben` : `${rows} · ${decimal(released, 0)} freigegeben`
				};
			});
		});
		const form = useForm({
			axle_load_front_kg: props.vehicle.axleFront === null ? "" : String(props.vehicle.axleFront),
			axle_load_rear_kg: props.vehicle.axleRear === null ? "" : String(props.vehicle.axleRear),
			max_speed_kmh: props.vehicle.maxSpeed === null ? "" : String(props.vehicle.maxSpeed)
		});
		const errors = (0, vue_exports.computed)(() => form.errors);
		const context = (0, vue_exports.computed)(() => `${props.vehicle.keys} · ${props.vehicle.window}`);
		const owedLine = (0, vue_exports.computed)(() => {
			const front = props.owed.includes("8.1");
			const rear = props.owed.includes("8.2");
			const speed = props.owed.includes("T");
			const parts = [front && rear ? "die Achslasten (Felder 8.1 und 8.2)" : front ? "die Achslast vorn (Feld 8.1)" : rear ? "die Achslast hinten (Feld 8.2)" : null, speed ? "die Höchstgeschwindigkeit (Feld T)" : null].filter((part) => part !== null);
			if (parts.length === 0) return null;
			const many = parts.length > 1 || front && rear;
			return `Diesem Fahrzeug ${many ? "fehlen" : "fehlt"} ${parts.join(" und ")}. ${many ? "Solange sie fehlen" : "Solange sie fehlt"}, kann der Shop die Reifen nur für Kunden bestätigen, die ihre Werte aus der Zulassungsbescheinigung Teil I eintragen.`;
		});
		const speedRead = (0, vue_exports.computed)(() => {
			if (props.vehicle.maxSpeed !== null) return `${decimal(props.vehicle.maxSpeed, 0)} km/h`;
			if (props.topSpeed.needed) return "fehlt";
			return props.topSpeed.released > 0 ? "nicht eingetragen – für die Reifen nicht nötig" : "nicht eingetragen";
		});
		const confirmOpen = (0, vue_exports.ref)(false);
		const empties = (0, vue_exports.computed)(() => [
			form.axle_load_front_kg,
			form.axle_load_rear_kg,
			...props.topSpeed.needed ? [form.max_speed_kmh] : []
		].some((value) => String(value).trim() === ""));
		function save() {
			if (props.owed.length === 0 && empties.value && !confirmOpen.value) {
				confirmOpen.value = true;
				return;
			}
			send();
		}
		function send() {
			confirmOpen.value = false;
			form.put(`/admin/fahrzeuge/${props.vehicle.id}`, {
				preserveScroll: true,
				headers: stampHeaders(props.stamp),
				onError: () => focusRefused(".fs-form")
			});
		}
		const STATUS = {
			draft: "Entwurf",
			published: "Freigegeben",
			retired: "Ausgelaufen"
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: __props.vehicle.name,
				context: context.value
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (owedLine.value) _push(`<p class="fs-warn" role="note" data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(owedLine.value)}</p>`);
						else _push(`<!---->`);
						_push(`<section class="adm-section" aria-labelledby="fs-facts-h" data-v-874f2b19${_scopeId}><div class="adm-section__head" data-v-874f2b19${_scopeId}><h2 id="fs-facts-h" class="adm-section__title" data-v-874f2b19${_scopeId}>Angaben</h2>`);
						if (__props.can.edit && __props.identity?.correctable && !correcting.value) _push(`<button class="btn btn--secondary btn--sm" type="button" data-v-874f2b19${_scopeId}>Angaben korrigieren</button>`);
						else _push(`<!---->`);
						_push(`</div>`);
						if (correcting.value && __props.identity?.form) _push((0, server_renderer_exports.ssrRenderComponent)(IdentityForm_default, {
							"vehicle-id": __props.vehicle.id,
							values: __props.identity.form,
							"body-forms": __props.bodyForms ?? [],
							drives: __props.drives ?? [],
							stamp: __props.identity.stamp,
							onDone: ($event) => correcting.value = false,
							onCancel: ($event) => correcting.value = false
						}, null, _parent, _scopeId));
						else {
							_push(`<dl class="adm-facts fs-facts" data-v-874f2b19${_scopeId}><div class="adm-facts__row" data-v-874f2b19${_scopeId}><dt data-v-874f2b19${_scopeId}>HSN/TSN</dt><dd data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.vehicle.keys)}`);
							if (__props.vehicle.vsn) _push(`<!--[--> · VSN ${(0, server_renderer_exports.ssrInterpolate)(__props.vehicle.vsn)}<!--]-->`);
							else _push(`<!---->`);
							_push(`</dd></div>`);
							if (__props.vehicle.typeDesignation) _push(`<div class="adm-facts__row" data-v-874f2b19${_scopeId}><dt data-v-874f2b19${_scopeId}>Typ</dt><dd data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.vehicle.typeDesignation)}</dd></div>`);
							else _push(`<!---->`);
							_push(`<div class="adm-facts__row" data-v-874f2b19${_scopeId}><dt data-v-874f2b19${_scopeId}>Bauzeitraum</dt><dd data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.vehicle.window)}</dd></div>`);
							if (__props.vehicle.power) _push(`<div class="adm-facts__row" data-v-874f2b19${_scopeId}><dt data-v-874f2b19${_scopeId}>Leistung</dt><dd data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.vehicle.power)}</dd></div>`);
							else _push(`<!---->`);
							if (__props.vehicle.bodyForm) _push(`<div class="adm-facts__row" data-v-874f2b19${_scopeId}><dt data-v-874f2b19${_scopeId}>Karosserie</dt><dd data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.vehicle.bodyForm)}</dd></div>`);
							else _push(`<!---->`);
							_push(`</dl>`);
						}
						if (ruleLine.value) _push(`<p class="adm-note fs-rule" data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(ruleLine.value)}</p>`);
						else _push(`<!---->`);
						_push(`</section><section class="adm-section" aria-labelledby="fs-legal-h" data-v-874f2b19${_scopeId}><div class="adm-section__head" data-v-874f2b19${_scopeId}><h2 id="fs-legal-h" class="adm-section__title" data-v-874f2b19${_scopeId}>Daten für die Prüfung</h2></div>`);
						if (__props.can.edit) {
							_push(`<form class="fs-form" novalidate data-v-874f2b19${_scopeId}>`);
							if (errors.value._stamp) _push(`<p class="adm-alert" role="alert" data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value._stamp)}</p>`);
							else _push(`<!---->`);
							_push(`<div class="form-field" data-v-874f2b19${_scopeId}><label class="form-field__label" for="fs-front" data-v-874f2b19${_scopeId}>Achslast vorn in kg (Feld 8.1)</label><input id="fs-front"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).axle_load_front_kg)} class="input" type="text" inputmode="numeric" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.axle_load_front_kg ? "true" : void 0)} aria-describedby="fs-front-err" data-v-874f2b19${_scopeId}><p id="fs-front-err" class="form-field__error" data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.axle_load_front_kg)}</p></div><div class="form-field" data-v-874f2b19${_scopeId}><label class="form-field__label" for="fs-rear" data-v-874f2b19${_scopeId}>Achslast hinten in kg (Feld 8.2)</label><input id="fs-rear"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).axle_load_rear_kg)} class="input" type="text" inputmode="numeric" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.axle_load_rear_kg ? "true" : void 0)} aria-describedby="fs-rear-err" data-v-874f2b19${_scopeId}><p id="fs-rear-err" class="form-field__error" data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.axle_load_rear_kg)}</p></div><div class="form-field" data-v-874f2b19${_scopeId}><label class="form-field__label" for="fs-speed" data-v-874f2b19${_scopeId}>Höchstgeschwindigkeit in km/h (Feld T)</label><input id="fs-speed"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).max_speed_kmh)} class="input" type="text" inputmode="numeric" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.max_speed_kmh ? "true" : void 0)} aria-describedby="fs-speed-why fs-speed-err" data-v-874f2b19${_scopeId}><div id="fs-speed-why" class="fs-why" data-speed-why data-v-874f2b19${_scopeId}>`);
							if (__props.topSpeed.needed) {
								_push(`<!--[--><p class="fs-why__lead" data-v-874f2b19${_scopeId}>Für die Reifen nötig:</p><ul class="fs-why__list" data-v-874f2b19${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.topSpeed.documents, (document) => {
									_push(`<li data-v-874f2b19${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
										href: document.href,
										class: "fs-link"
									}, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(document.label)}`);
											else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(document.label), 1)];
										}),
										_: 2
									}, _parent, _scopeId));
									_push(`: ${(0, server_renderer_exports.ssrInterpolate)(document.why)}</li>`);
								});
								_push(`<!--]--></ul><!--]-->`);
							} else if (__props.topSpeed.released > 0) _push(`<p class="fs-why__lead" data-v-874f2b19${_scopeId}> Für die Reifen nicht nötig: Bei jedem freigegebenen Gutachten zu diesem Fahrzeug sind Lastindex und Geschwindigkeitssymbol bei jeder Reifengröße erfasst. </p>`);
							else _push(`<p class="fs-why__lead" data-v-874f2b19${_scopeId}> Bei uns ist noch kein Gutachten zu diesem Fahrzeug freigegeben. Ob die Höchstgeschwindigkeit für die Reifen nötig ist, hängt davon ab, wie ein Gutachten Lastindex und Geschwindigkeitssymbol angibt. </p>`);
							_push(`</div><p id="fs-speed-err" class="form-field__error" data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.max_speed_kmh)}</p></div><div data-v-874f2b19${_scopeId}><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing || !(0, vue_exports.unref)(form).isDirty) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)} data-v-874f2b19${_scopeId}>Speichern</button></div></form>`);
						} else _push(`<dl class="adm-facts fs-facts" data-v-874f2b19${_scopeId}><div class="adm-facts__row" data-v-874f2b19${_scopeId}><dt data-v-874f2b19${_scopeId}>Achslast vorn</dt><dd data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.vehicle.axleFront === null ? "fehlt" : `${(0, vue_exports.unref)(decimal)(__props.vehicle.axleFront, 0)} kg`)}</dd></div><div class="adm-facts__row" data-v-874f2b19${_scopeId}><dt data-v-874f2b19${_scopeId}>Achslast hinten</dt><dd data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.vehicle.axleRear === null ? "fehlt" : `${(0, vue_exports.unref)(decimal)(__props.vehicle.axleRear, 0)} kg`)}</dd></div><div class="adm-facts__row" data-v-874f2b19${_scopeId}><dt data-v-874f2b19${_scopeId}>Höchstgeschwindigkeit</dt><dd data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(speedRead.value)}</dd></div></dl>`);
						_push(`</section><section class="adm-section" aria-labelledby="fs-rows-h" data-v-874f2b19${_scopeId}><div class="adm-section__head" data-v-874f2b19${_scopeId}><h2 id="fs-rows-h" class="adm-section__title" data-v-874f2b19${_scopeId}>In Gutachten genannt</h2></div>`);
						if (__props.rows.length === 0) _push(`<p class="adm-note" data-v-874f2b19${_scopeId}>Zu diesem Fahrzeug ist noch keine Zeile aus einem Gutachten hinterlegt.</p>`);
						else if (__props.rows.length < (__props.rowsTotal ?? __props.rows.length)) _push(`<p class="adm-note fs-cut" role="status" data-v-874f2b19${_scopeId}> Hier stehen die ersten ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.rows.length, 0))} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.rowsTotal ?? __props.rows.length, 0))} Zeilen, nach Gutachten geordnet. Die übrigen stehen auf der Seite ihres Gutachtens. </p>`);
						else _push(`<!---->`);
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(groups.value, (group) => {
							_push(`<div class="fs-group" data-v-874f2b19${_scopeId}><h3 class="fs-group__title" data-v-874f2b19${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
								href: group.href,
								class: "fs-link"
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(group.document)}`);
									else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(group.document), 1)];
								}),
								_: 2
							}, _parent, _scopeId));
							_push(`<span class="fs-group__meta" data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(group.summary)}</span></h3><div class="adm-panel" data-v-874f2b19${_scopeId}><table class="adm-table" data-v-874f2b19${_scopeId}><caption class="visually-hidden" data-v-874f2b19${_scopeId}>Zeilen aus ${(0, server_renderer_exports.ssrInterpolate)(group.document)}</caption><thead data-v-874f2b19${_scopeId}><tr data-v-874f2b19${_scopeId}><th scope="col" data-v-874f2b19${_scopeId}>Felge</th><th scope="col" data-v-874f2b19${_scopeId}>Eintragung</th><th scope="col" class="num" data-v-874f2b19${_scopeId}>Auflagen</th><th scope="col" data-v-874f2b19${_scopeId}>Stand</th></tr></thead><tbody data-v-874f2b19${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(group.rows, (row) => {
								_push(`<tr data-v-874f2b19${_scopeId}><td data-label="Felge" data-v-874f2b19${_scopeId}><span class="fs-wheel" data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.wheel)}</span><span class="fs-sub" data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.size)}</span></td><td data-label="Eintragung" data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.requiresEntry ? "Ja" : "Nein")}</td><td data-label="Auflagen" class="num" data-phone="hide" data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(row.conditions, 0))}</td><td data-label="Stand" data-phone="status" data-v-874f2b19${_scopeId}>`);
								if (row.status !== "published") _push(`<span class="adm-tag adm-tag--neutral" data-v-874f2b19${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(STATUS[row.status] ?? row.status)}</span>`);
								else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(STATUS[row.status])}<!--]-->`);
								_push(`</td></tr>`);
							});
							_push(`<!--]--></tbody></table></div></div>`);
						});
						_push(`<!--]--></section>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: confirmOpen.value,
							"onUpdate:open": ($event) => confirmOpen.value = $event,
							title: "Angabe entfernen?",
							body: "Ohne diesen Wert bestätigt der Shop die Reifen für dieses Fahrzeug erst wieder, wenn er hier eingetragen ist – bis dahin nur für Kunden, die ihn aus ihrer Zulassungsbescheinigung Teil I eintragen.",
							"confirm-label": "Entfernen und speichern",
							busy: (0, vue_exports.unref)(form).processing,
							onConfirm: send
						}, null, _parent, _scopeId));
					} else return [
						owedLine.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "fs-warn",
							role: "note"
						}, (0, vue_exports.toDisplayString)(owedLine.value), 1)) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "fs-facts-h"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "fs-facts-h",
								class: "adm-section__title"
							}, "Angaben"), __props.can.edit && __props.identity?.correctable && !correcting.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
								key: 0,
								class: "btn btn--secondary btn--sm",
								type: "button",
								onClick: ($event) => correcting.value = true
							}, "Angaben korrigieren", 8, ["onClick"])) : (0, vue_exports.createCommentVNode)("", true)]),
							correcting.value && __props.identity?.form ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(IdentityForm_default, {
								key: 0,
								"vehicle-id": __props.vehicle.id,
								values: __props.identity.form,
								"body-forms": __props.bodyForms ?? [],
								drives: __props.drives ?? [],
								stamp: __props.identity.stamp,
								onDone: ($event) => correcting.value = false,
								onCancel: ($event) => correcting.value = false
							}, null, 8, [
								"vehicle-id",
								"values",
								"body-forms",
								"drives",
								"stamp",
								"onDone",
								"onCancel"
							])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("dl", {
								key: 1,
								class: "adm-facts fs-facts"
							}, [
								(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "HSN/TSN"), (0, vue_exports.createVNode)("dd", null, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.vehicle.keys), 1), __props.vehicle.vsn ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · VSN " + (0, vue_exports.toDisplayString)(__props.vehicle.vsn), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])]),
								__props.vehicle.typeDesignation ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "adm-facts__row"
								}, [(0, vue_exports.createVNode)("dt", null, "Typ"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.vehicle.typeDesignation), 1)])) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Bauzeitraum"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.vehicle.window), 1)]),
								__props.vehicle.power ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 1,
									class: "adm-facts__row"
								}, [(0, vue_exports.createVNode)("dt", null, "Leistung"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.vehicle.power), 1)])) : (0, vue_exports.createCommentVNode)("", true),
								__props.vehicle.bodyForm ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 2,
									class: "adm-facts__row"
								}, [(0, vue_exports.createVNode)("dt", null, "Karosserie"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.vehicle.bodyForm), 1)])) : (0, vue_exports.createCommentVNode)("", true)
							])),
							ruleLine.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 2,
								class: "adm-note fs-rule"
							}, (0, vue_exports.toDisplayString)(ruleLine.value), 1)) : (0, vue_exports.createCommentVNode)("", true)
						]),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "fs-legal-h"
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "fs-legal-h",
							class: "adm-section__title"
						}, "Daten für die Prüfung")]), __props.can.edit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("form", {
							key: 0,
							class: "fs-form",
							novalidate: "",
							onSubmit: (0, vue_exports.withModifiers)(save, ["prevent"])
						}, [
							errors.value._stamp ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-alert",
								role: "alert"
							}, (0, vue_exports.toDisplayString)(errors.value._stamp), 1)) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fs-front"
								}, "Achslast vorn in kg (Feld 8.1)"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "fs-front",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).axle_load_front_kg = $event,
									class: "input",
									type: "text",
									inputmode: "numeric",
									autocomplete: "off",
									"aria-invalid": errors.value.axle_load_front_kg ? "true" : void 0,
									"aria-describedby": "fs-front-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).axle_load_front_kg]]),
								(0, vue_exports.createVNode)("p", {
									id: "fs-front-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.axle_load_front_kg), 1)
							]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fs-rear"
								}, "Achslast hinten in kg (Feld 8.2)"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "fs-rear",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).axle_load_rear_kg = $event,
									class: "input",
									type: "text",
									inputmode: "numeric",
									autocomplete: "off",
									"aria-invalid": errors.value.axle_load_rear_kg ? "true" : void 0,
									"aria-describedby": "fs-rear-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).axle_load_rear_kg]]),
								(0, vue_exports.createVNode)("p", {
									id: "fs-rear-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.axle_load_rear_kg), 1)
							]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fs-speed"
								}, "Höchstgeschwindigkeit in km/h (Feld T)"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "fs-speed",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).max_speed_kmh = $event,
									class: "input",
									type: "text",
									inputmode: "numeric",
									autocomplete: "off",
									"aria-invalid": errors.value.max_speed_kmh ? "true" : void 0,
									"aria-describedby": "fs-speed-why fs-speed-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).max_speed_kmh]]),
								(0, vue_exports.createVNode)("div", {
									id: "fs-speed-why",
									class: "fs-why",
									"data-speed-why": ""
								}, [__props.topSpeed.needed ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)("p", { class: "fs-why__lead" }, "Für die Reifen nötig:"), (0, vue_exports.createVNode)("ul", { class: "fs-why__list" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.topSpeed.documents, (document) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: document.id }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
										href: document.href,
										class: "fs-link"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(document.label), 1)]),
										_: 2
									}, 1032, ["href"]), (0, vue_exports.createTextVNode)(": " + (0, vue_exports.toDisplayString)(document.why), 1)]);
								}), 128))])], 64)) : __props.topSpeed.released > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 1,
									class: "fs-why__lead"
								}, " Für die Reifen nicht nötig: Bei jedem freigegebenen Gutachten zu diesem Fahrzeug sind Lastindex und Geschwindigkeitssymbol bei jeder Reifengröße erfasst. ")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 2,
									class: "fs-why__lead"
								}, " Bei uns ist noch kein Gutachten zu diesem Fahrzeug freigegeben. Ob die Höchstgeschwindigkeit für die Reifen nötig ist, hängt davon ab, wie ein Gutachten Lastindex und Geschwindigkeitssymbol angibt. "))]),
								(0, vue_exports.createVNode)("p", {
									id: "fs-speed-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.max_speed_kmh), 1)
							]),
							(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "submit",
								disabled: (0, vue_exports.unref)(form).processing || !(0, vue_exports.unref)(form).isDirty,
								"aria-busy": (0, vue_exports.unref)(form).processing ? "true" : void 0
							}, "Speichern", 8, ["disabled", "aria-busy"])])
						], 32)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("dl", {
							key: 1,
							class: "adm-facts fs-facts"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Achslast vorn"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.vehicle.axleFront === null ? "fehlt" : `${(0, vue_exports.unref)(decimal)(__props.vehicle.axleFront, 0)} kg`), 1)]),
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Achslast hinten"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.vehicle.axleRear === null ? "fehlt" : `${(0, vue_exports.unref)(decimal)(__props.vehicle.axleRear, 0)} kg`), 1)]),
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Höchstgeschwindigkeit"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(speedRead.value), 1)])
						]))]),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "fs-rows-h"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "fs-rows-h",
								class: "adm-section__title"
							}, "In Gutachten genannt")]),
							__props.rows.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-note"
							}, "Zu diesem Fahrzeug ist noch keine Zeile aus einem Gutachten hinterlegt.")) : __props.rows.length < (__props.rowsTotal ?? __props.rows.length) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 1,
								class: "adm-note fs-cut",
								role: "status"
							}, " Hier stehen die ersten " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.rows.length, 0)) + " von " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.rowsTotal ?? __props.rows.length, 0)) + " Zeilen, nach Gutachten geordnet. Die übrigen stehen auf der Seite ihres Gutachtens. ", 1)) : (0, vue_exports.createCommentVNode)("", true),
							((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(groups.value, (group) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: group.id,
									class: "fs-group"
								}, [(0, vue_exports.createVNode)("h3", { class: "fs-group__title" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
									href: group.href,
									class: "fs-link"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(group.document), 1)]),
									_: 2
								}, 1032, ["href"]), (0, vue_exports.createVNode)("span", { class: "fs-group__meta" }, (0, vue_exports.toDisplayString)(group.summary), 1)]), (0, vue_exports.createVNode)("div", { class: "adm-panel" }, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [
									(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Zeilen aus " + (0, vue_exports.toDisplayString)(group.document), 1),
									(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
										(0, vue_exports.createVNode)("th", { scope: "col" }, "Felge"),
										(0, vue_exports.createVNode)("th", { scope: "col" }, "Eintragung"),
										(0, vue_exports.createVNode)("th", {
											scope: "col",
											class: "num"
										}, "Auflagen"),
										(0, vue_exports.createVNode)("th", { scope: "col" }, "Stand")
									])]),
									(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(group.rows, (row) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: row.id }, [
											(0, vue_exports.createVNode)("td", { "data-label": "Felge" }, [(0, vue_exports.createVNode)("span", { class: "fs-wheel" }, (0, vue_exports.toDisplayString)(row.wheel), 1), (0, vue_exports.createVNode)("span", { class: "fs-sub" }, (0, vue_exports.toDisplayString)(row.size), 1)]),
											(0, vue_exports.createVNode)("td", { "data-label": "Eintragung" }, (0, vue_exports.toDisplayString)(row.requiresEntry ? "Ja" : "Nein"), 1),
											(0, vue_exports.createVNode)("td", {
												"data-label": "Auflagen",
												class: "num",
												"data-phone": "hide"
											}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(row.conditions, 0)), 1),
											(0, vue_exports.createVNode)("td", {
												"data-label": "Stand",
												"data-phone": "status"
											}, [row.status !== "published" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 0,
												class: "adm-tag adm-tag--neutral"
											}, (0, vue_exports.toDisplayString)(STATUS[row.status] ?? row.status), 1)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(STATUS[row.status]), 1)], 64))])
										]);
									}), 128))])
								])])]);
							}), 128))
						]),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: confirmOpen.value,
							"onUpdate:open": ($event) => confirmOpen.value = $event,
							title: "Angabe entfernen?",
							body: "Ohne diesen Wert bestätigt der Shop die Reifen für dieses Fahrzeug erst wieder, wenn er hier eingetragen ist – bis dahin nur für Kunden, die ihn aus ihrer Zulassungsbescheinigung Teil I eintragen.",
							"confirm-label": "Entfernen und speichern",
							busy: (0, vue_exports.unref)(form).processing,
							onConfirm: send
						}, null, 8, [
							"open",
							"onUpdate:open",
							"busy"
						])
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Fahrzeuge/Show.vue
var _sfc_setup = Show_vue_vue_type_script_setup_true_lang_default.setup;
Show_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Fahrzeuge/Show.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Show_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Show_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-874f2b19"]]);
//#endregion
export { Show_default as default };
