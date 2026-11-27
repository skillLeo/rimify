import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BA7BbMo6.js";
import { d as vue_exports, l as router, s as usePage } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminConfirm_default } from "./AdminConfirm-sC9Lzvnq.js";
import { t as AdminState_default } from "./AdminState-DSdumcrf.js";
//#region resources/js/Pages/Admin/Einstellungen/Versand.vue?vue&type=script&setup=true&lang.ts
var BASE = "/admin/einstellungen/versand";
var Versand_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Versand",
	__ssrInlineRender: true,
	props: {
		methods: {},
		countries: {},
		productTypes: {},
		productLine: {},
		fromEnv: {},
		canEdit: { type: Boolean }
	},
	setup(__props) {
		/**
		* Einstellungen › Versand (VersandartenController, D-449): the shipping methods the checkout offers. One form serves a new
		* method and an existing one: „Bearbeiten“ loads the row into it, „Abbrechen“ empties it again. Prices are posted as typed
		* — the server reads them (Money::fromGerman) and refuses anything ambiguous; nothing on this page multiplies cents.
		*
		* A method is never deleted: an order keeps its own copy of what it was sent by, and a method no longer wanted is switched
		* off. The order of the list is the order the checkout offers them in; the cheapest active one is what the customer gets
		* until they choose another, and what the product page names. Every write is authorised on the server (R-11).
		*/
		const props = __props;
		function blank() {
			return {
				name: "",
				description: "",
				price: "",
				free_from: "",
				min_days: "",
				max_days: "",
				countries: Object.keys(props.countries),
				product_types: [],
				active: true
			};
		}
		const page = usePage();
		const form = (0, vue_exports.reactive)(blank());
		const nameField = (0, vue_exports.ref)(null);
		/** The id being edited, or null while the form makes a new method. */
		const editing = (0, vue_exports.ref)(null);
		/** True once a request went out from this form: only then do the server's messages belong to it. */
		const sent = (0, vue_exports.ref)(false);
		const busy = (0, vue_exports.ref)(false);
		const errors = (0, vue_exports.computed)(() => {
			const raw = page.props.errors;
			return sent.value && raw !== null && typeof raw === "object" ? raw : {};
		});
		const editingMethod = (0, vue_exports.computed)(() => props.methods.find((m) => m.id === editing.value) ?? null);
		const formTitle = (0, vue_exports.computed)(() => editingMethod.value === null ? "Neue Versandart" : `Versandart bearbeiten: ${editingMethod.value.name}`);
		const submitLabel = (0, vue_exports.computed)(() => editing.value === null ? "Versandart anlegen" : "Änderungen speichern");
		const active = (0, vue_exports.computed)(() => props.methods.filter((m) => m.active).length);
		const context = (0, vue_exports.computed)(() => {
			const total = props.methods.length;
			return total === 0 ? "Noch keine Versandart" : `${total} ${total === 1 ? "Versandart" : "Versandarten"}, davon ${active.value} aktiv`;
		});
		/** What a method ships, in the list's words: every product, or the ones it names. */
		function shipsLabel(method) {
			return method.productTypes.length === 0 ? "Alles" : method.productTypes.map((t) => props.productTypes[t] ?? t).join(", ");
		}
		function reset() {
			Object.assign(form, blank());
			editing.value = null;
			sent.value = false;
		}
		function edit(method) {
			Object.assign(form, {
				name: method.name,
				description: method.description,
				price: method.priceTyped,
				free_from: method.freeFromTyped,
				min_days: method.minDays,
				max_days: method.maxDays,
				countries: [...method.countries],
				product_types: [...method.productTypes],
				active: method.active
			});
			editing.value = method.id;
			sent.value = false;
			nameField.value?.focus();
		}
		function submit() {
			sent.value = true;
			busy.value = true;
			const options = {
				preserveScroll: true,
				onSuccess: reset,
				onFinish: () => busy.value = false
			};
			if (editing.value === null) router.post(BASE, { ...form }, options);
			else router.put(`${BASE}/${editing.value}`, { ...form }, options);
		}
		/** „Aktivieren“ / „Deaktivieren“ from the list: the row as it stands, the one switch turned. */
		function toggle(method) {
			sent.value = true;
			busy.value = true;
			router.put(`${BASE}/${method.id}`, {
				name: method.name,
				description: method.description,
				price: method.priceTyped,
				free_from: method.freeFromTyped,
				min_days: method.minDays,
				max_days: method.maxDays,
				countries: method.countries,
				product_types: method.productTypes,
				active: !method.active
			}, {
				preserveScroll: true,
				onFinish: () => busy.value = false
			});
		}
		const deleteOpen = (0, vue_exports.ref)(false);
		const deleting = (0, vue_exports.ref)(null);
		function askDelete(method) {
			deleting.value = method;
			deleteOpen.value = true;
		}
		function destroy() {
			const method = deleting.value;
			if (method === null) return;
			sent.value = true;
			busy.value = true;
			router.delete(`${BASE}/${method.id}`, {
				preserveScroll: true,
				onSuccess: () => {
					deleteOpen.value = false;
					if (editing.value === method.id) reset();
				},
				onFinish: () => busy.value = false
			});
		}
		/** „Nach oben“ / „Nach unten“: the whole order, sent as one list. */
		function move(method, by) {
			const ids = props.methods.map((m) => m.id);
			const from = ids.indexOf(method.id);
			const to = from + by;
			if (to < 0 || to >= ids.length) return;
			const [moved] = ids.splice(from, 1);
			ids.splice(to, 0, moved);
			sent.value = true;
			busy.value = true;
			router.put(`${BASE}/reihenfolge`, { ids }, {
				preserveScroll: true,
				onFinish: () => busy.value = false
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Versand",
				context: context.value,
				"read-only": !__props.canEdit
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="adm-note vs__lead" data-v-c345cd6f${_scopeId}> Die Kasse bietet die aktiven Versandarten in dieser Reihenfolge an, mit Preis und Lieferzeit vor dem Bestellknopf. Bis jemand eine andere wählt, gilt die günstigste. Ausgeschaltet bleibt eine Versandart in der Liste, gelöscht ist sie weg: Bestellungen behalten in beiden Fällen, womit sie verschickt werden. </p>`);
						if (__props.productLine) _push(`<p class="vs__line" data-v-c345cd6f${_scopeId}><span class="vs__line-label" data-v-c345cd6f${_scopeId}>Auf der Produktseite</span> ${(0, server_renderer_exports.ssrInterpolate)(__props.productLine)}</p>`);
						else if (__props.fromEnv) _push(`<p class="adm-note vs__line" data-v-c345cd6f${_scopeId}>Noch keine Versandart angelegt. Bis dahin gelten die Werte aus der .env-Datei: ${(0, server_renderer_exports.ssrInterpolate)(__props.fromEnv)}.</p>`);
						else _push(`<!---->`);
						if (__props.methods.length > 0 && active.value === 0) _push(`<p class="adm-alert" role="status" data-v-c345cd6f${_scopeId}>Keine Versandart ist aktiv. Solange nimmt der Shop keine echte Bestellung an.</p>`);
						else _push(`<!---->`);
						if (errors.value.ids) _push(`<p class="adm-alert" role="alert" data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.ids)}</p>`);
						else _push(`<!---->`);
						if (__props.canEdit) {
							_push(`<section class="adm-section" aria-labelledby="vs-form-title" data-v-c345cd6f${_scopeId}><form class="vs__form"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} novalidate data-v-c345cd6f${_scopeId}><h2 id="vs-form-title" class="adm-section__title vs__form-title" data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(formTitle.value)}</h2><div class="adm-fields vs__fields" data-v-c345cd6f${_scopeId}><div class="form-field" data-v-c345cd6f${_scopeId}><label class="form-field__label" for="vs-name" data-v-c345cd6f${_scopeId}>Name</label><input id="vs-name"${(0, server_renderer_exports.ssrRenderAttr)("value", form.name)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": errors.value.name }, "input"])}" type="text" maxlength="80" autocomplete="off" aria-required="true" aria-describedby="vs-name-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.name ? "true" : void 0)} data-v-c345cd6f${_scopeId}><p id="vs-name-err" class="form-field__error" data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.name ?? "")}</p></div><div class="form-field" data-v-c345cd6f${_scopeId}><label class="form-field__label" for="vs-price" data-v-c345cd6f${_scopeId}>Preis (mit MwSt.)</label><input id="vs-price"${(0, server_renderer_exports.ssrRenderAttr)("value", form.price)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": errors.value.price }, "input vs__num vs__money"])}" type="text" inputmode="decimal" autocomplete="off" maxlength="32" aria-required="true" aria-describedby="vs-price-help vs-price-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.price ? "true" : void 0)} data-v-c345cd6f${_scopeId}><p id="vs-price-help" class="form-field__help" data-v-c345cd6f${_scopeId}>In Euro, mit Komma – zum Beispiel 4,90. Kostenlos ist 0,00.</p><p id="vs-price-err" class="form-field__error" data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.price ?? "")}</p></div><fieldset class="form-field vs__days" data-v-c345cd6f${_scopeId}><legend class="form-field__label" data-v-c345cd6f${_scopeId}>Lieferzeit in Werktagen</legend><div class="vs__days-row" data-v-c345cd6f${_scopeId}><label class="vs__day" data-v-c345cd6f${_scopeId}><span data-v-c345cd6f${_scopeId}>von</span><input id="vs-min-days"${(0, server_renderer_exports.ssrRenderAttr)("value", form.min_days)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": errors.value.min_days }, "input vs__num"])}" type="number" min="1" max="60" step="1" aria-describedby="vs-days-help vs-days-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.min_days ? "true" : void 0)} data-v-c345cd6f${_scopeId}></label><label class="vs__day" data-v-c345cd6f${_scopeId}><span data-v-c345cd6f${_scopeId}>bis</span><input id="vs-max-days"${(0, server_renderer_exports.ssrRenderAttr)("value", form.max_days)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": errors.value.max_days }, "input vs__num"])}" type="number" min="1" max="60" step="1" aria-describedby="vs-days-help vs-days-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.max_days ? "true" : void 0)} data-v-c345cd6f${_scopeId}></label></div><p id="vs-days-help" class="form-field__help" data-v-c345cd6f${_scopeId}>Ab Zahlungseingang. Bei einer festen Zahl steht in beiden Feldern dieselbe.</p><p id="vs-days-err" class="form-field__error" data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.min_days ?? errors.value.max_days ?? "")}</p></fieldset><div class="form-field" data-v-c345cd6f${_scopeId}><label class="form-field__label" for="vs-free" data-v-c345cd6f${_scopeId}>Versandkostenfrei ab <span class="vs__optional" data-v-c345cd6f${_scopeId}>(optional)</span></label><input id="vs-free"${(0, server_renderer_exports.ssrRenderAttr)("value", form.free_from)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": errors.value.free_from }, "input vs__num vs__money"])}" type="text" inputmode="decimal" autocomplete="off" maxlength="32" aria-describedby="vs-free-help vs-free-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.free_from ? "true" : void 0)} data-v-c345cd6f${_scopeId}><p id="vs-free-help" class="form-field__help" data-v-c345cd6f${_scopeId}>Warenwert mit MwSt., ab dem diese Versandart nichts kostet. Leer: nie.</p><p id="vs-free-err" class="form-field__error" data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.free_from ?? "")}</p></div><fieldset class="form-field vs__group" data-v-c345cd6f${_scopeId}><legend class="form-field__label" data-v-c345cd6f${_scopeId}>Länder</legend><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.countries, (name, code) => {
								_push(`<label class="check" data-v-c345cd6f${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.countries) ? (0, server_renderer_exports.ssrLooseContain)(form.countries, code) : form.countries) ? " checked" : ""} type="checkbox"${(0, server_renderer_exports.ssrRenderAttr)("value", code)} data-v-c345cd6f${_scopeId}> ${(0, server_renderer_exports.ssrInterpolate)(name)}</label>`);
							});
							_push(`<!--]--><p class="form-field__help" data-v-c345cd6f${_scopeId}>Die Kasse liefert bisher nur nach Deutschland.</p><p class="form-field__error" data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.countries ?? "")}</p></fieldset><fieldset class="form-field vs__group" data-v-c345cd6f${_scopeId}><legend class="form-field__label" data-v-c345cd6f${_scopeId}>Gilt für <span class="vs__optional" data-v-c345cd6f${_scopeId}>(optional)</span></legend><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.productTypes, (name, type) => {
								_push(`<label class="check" data-v-c345cd6f${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.product_types) ? (0, server_renderer_exports.ssrLooseContain)(form.product_types, type) : form.product_types) ? " checked" : ""} type="checkbox"${(0, server_renderer_exports.ssrRenderAttr)("value", type)} data-v-c345cd6f${_scopeId}> ${(0, server_renderer_exports.ssrInterpolate)(name)}</label>`);
							});
							_push(`<!--]--><p class="form-field__help" data-v-c345cd6f${_scopeId}>Nichts angehakt: für alles. Ein Warenkorb mit Felgen und Kompletträdern braucht eine Versandart, die beides verschickt.</p><p class="form-field__error" data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.product_types ?? "")}</p></fieldset><div class="form-field vs__wide" data-v-c345cd6f${_scopeId}><label class="form-field__label" for="vs-description" data-v-c345cd6f${_scopeId}>Beschreibung <span class="vs__optional" data-v-c345cd6f${_scopeId}>(optional)</span></label><textarea id="vs-description" class="input vs__text" rows="2" maxlength="300" aria-describedby="vs-description-help vs-description-err" data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(form.description)}</textarea><p id="vs-description-help" class="form-field__help" data-v-c345cd6f${_scopeId}>Steht in der Kasse unter dem Namen, etwa „Versichert, mit Sendungsverfolgung“.</p><p id="vs-description-err" class="form-field__error" data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.description ?? "")}</p></div><div class="adm-fields__checks" data-v-c345cd6f${_scopeId}><label class="check" data-v-c345cd6f${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.active) ? (0, server_renderer_exports.ssrLooseContain)(form.active, null) : form.active) ? " checked" : ""} type="checkbox" data-v-c345cd6f${_scopeId}> In der Kasse anbieten </label></div></div><div class="adm-fields__actions" data-v-c345cd6f${_scopeId}><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(submitLabel.value)}</button>`);
							if (editing.value !== null) _push(`<button class="btn btn--secondary" type="button" data-v-c345cd6f${_scopeId}>Abbrechen</button>`);
							else _push(`<!---->`);
							_push(`</div></form></section>`);
						} else _push(`<!---->`);
						_push(`<section class="adm-section" aria-labelledby="vs-list-title" data-v-c345cd6f${_scopeId}><div class="adm-section__head" data-v-c345cd6f${_scopeId}><h2 id="vs-list-title" class="adm-section__title" data-v-c345cd6f${_scopeId}>Versandarten</h2></div>`);
						if (__props.methods.length > 0) {
							_push(`<div class="adm-panel" data-v-c345cd6f${_scopeId}><table class="adm-table" data-v-c345cd6f${_scopeId}><thead data-v-c345cd6f${_scopeId}><tr data-v-c345cd6f${_scopeId}><th scope="col" data-v-c345cd6f${_scopeId}>Name</th><th scope="col" class="num" data-v-c345cd6f${_scopeId}>Preis</th><th scope="col" data-v-c345cd6f${_scopeId}>Lieferzeit</th><th scope="col" data-v-c345cd6f${_scopeId}>Versandkostenfrei ab</th><th scope="col" data-v-c345cd6f${_scopeId}>Gilt für</th><th scope="col" data-v-c345cd6f${_scopeId}>Im Shop</th>`);
							if (__props.canEdit) _push(`<th scope="col" data-v-c345cd6f${_scopeId}><span class="visually-hidden" data-v-c345cd6f${_scopeId}>Aktionen</span></th>`);
							else _push(`<!---->`);
							_push(`</tr></thead><tbody data-v-c345cd6f${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.methods, (method, i) => {
								_push(`<tr${(0, server_renderer_exports.ssrRenderAttr)("aria-current", editing.value === method.id ? "true" : void 0)} data-v-c345cd6f${_scopeId}><td data-label="Name" data-v-c345cd6f${_scopeId}><span class="adm-table__key" data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(method.name)}</span>`);
								if (method.demo) _push(`<span class="adm-tag adm-tag--neutral adm-demo" data-v-c345cd6f${_scopeId}>Demodaten</span>`);
								else _push(`<!---->`);
								if (method.description) _push(`<span class="adm-table__sub" data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(method.description)}</span>`);
								else _push(`<!---->`);
								_push(`</td><td data-label="Preis" class="num" data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(method.price)}</td><td data-label="Lieferzeit" data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(method.deliveryTime)}</td><td data-label="Versandkostenfrei ab" data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(method.freeFrom ?? "–")}</td><td data-label="Gilt für" data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(shipsLabel(method))}</td><td data-label="Im Shop" data-phone="status" data-v-c345cd6f${_scopeId}>`);
								if (method.active) _push(`<!--[-->Aktiv<!--]-->`);
								else _push(`<span class="adm-tag adm-tag--neutral" data-v-c345cd6f${_scopeId}>Aus</span>`);
								_push(`</td>`);
								if (__props.canEdit) _push(`<td data-label="Aktionen" data-v-c345cd6f${_scopeId}><div class="adm-table__actions" data-v-c345cd6f${_scopeId}><button class="btn btn--secondary btn--sm" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-c345cd6f${_scopeId}> Bearbeiten<span class="visually-hidden" data-v-c345cd6f${_scopeId}>: ${(0, server_renderer_exports.ssrInterpolate)(method.name)}</span></button><button class="btn btn--secondary btn--sm" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-c345cd6f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(method.active ? "Ausschalten" : "Einschalten")}<span class="visually-hidden" data-v-c345cd6f${_scopeId}>: ${(0, server_renderer_exports.ssrInterpolate)(method.name)}</span></button><button class="btn btn--secondary btn--sm" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value || i === 0) ? " disabled" : ""} data-v-c345cd6f${_scopeId}> Nach oben<span class="visually-hidden" data-v-c345cd6f${_scopeId}>: ${(0, server_renderer_exports.ssrInterpolate)(method.name)}</span></button><button class="btn btn--secondary btn--sm" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value || i === __props.methods.length - 1) ? " disabled" : ""} data-v-c345cd6f${_scopeId}> Nach unten<span class="visually-hidden" data-v-c345cd6f${_scopeId}>: ${(0, server_renderer_exports.ssrInterpolate)(method.name)}</span></button><button class="btn btn--secondary btn--sm" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-c345cd6f${_scopeId}> Löschen<span class="visually-hidden" data-v-c345cd6f${_scopeId}>: ${(0, server_renderer_exports.ssrInterpolate)(method.name)}</span></button></div></td>`);
								else _push(`<!---->`);
								_push(`</tr>`);
							});
							_push(`<!--]--></tbody></table></div>`);
						} else _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Noch keine Versandart angelegt."
						}, null, _parent, _scopeId));
						_push(`</section>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: deleteOpen.value,
							"onUpdate:open": ($event) => deleteOpen.value = $event,
							title: `Versandart „${deleting.value?.name ?? ""}“ löschen?`,
							body: "Sie verschwindet aus der Kasse und aus dieser Liste. Bestellungen, die schon mit ihr verschickt werden, behalten Namen, Preis und Lieferzeit.",
							"confirm-label": "Löschen",
							busy: busy.value,
							onConfirm: destroy
						}, null, _parent, _scopeId));
					} else return [
						(0, vue_exports.createVNode)("p", { class: "adm-note vs__lead" }, " Die Kasse bietet die aktiven Versandarten in dieser Reihenfolge an, mit Preis und Lieferzeit vor dem Bestellknopf. Bis jemand eine andere wählt, gilt die günstigste. Ausgeschaltet bleibt eine Versandart in der Liste, gelöscht ist sie weg: Bestellungen behalten in beiden Fällen, womit sie verschickt werden. "),
						__props.productLine ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "vs__line"
						}, [(0, vue_exports.createVNode)("span", { class: "vs__line-label" }, "Auf der Produktseite"), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(__props.productLine), 1)])) : __props.fromEnv ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 1,
							class: "adm-note vs__line"
						}, "Noch keine Versandart angelegt. Bis dahin gelten die Werte aus der .env-Datei: " + (0, vue_exports.toDisplayString)(__props.fromEnv) + ".", 1)) : (0, vue_exports.createCommentVNode)("", true),
						__props.methods.length > 0 && active.value === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 2,
							class: "adm-alert",
							role: "status"
						}, "Keine Versandart ist aktiv. Solange nimmt der Shop keine echte Bestellung an.")) : (0, vue_exports.createCommentVNode)("", true),
						errors.value.ids ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 3,
							class: "adm-alert",
							role: "alert"
						}, (0, vue_exports.toDisplayString)(errors.value.ids), 1)) : (0, vue_exports.createCommentVNode)("", true),
						__props.canEdit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 4,
							class: "adm-section",
							"aria-labelledby": "vs-form-title"
						}, [(0, vue_exports.createVNode)("form", {
							class: "vs__form",
							"aria-busy": busy.value ? "true" : void 0,
							novalidate: "",
							onSubmit: (0, vue_exports.withModifiers)(submit, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "vs-form-title",
								class: "adm-section__title vs__form-title"
							}, (0, vue_exports.toDisplayString)(formTitle.value), 1),
							(0, vue_exports.createVNode)("div", { class: "adm-fields vs__fields" }, [
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "vs-name"
									}, "Name"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "vs-name",
										ref_key: "nameField",
										ref: nameField,
										"onUpdate:modelValue": ($event) => form.name = $event,
										class: ["input", { "input--error": errors.value.name }],
										type: "text",
										maxlength: "80",
										autocomplete: "off",
										"aria-required": "true",
										"aria-describedby": "vs-name-err",
										"aria-invalid": errors.value.name ? "true" : void 0
									}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, form.name]]),
									(0, vue_exports.createVNode)("p", {
										id: "vs-name-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(errors.value.name ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "vs-price"
									}, "Preis (mit MwSt.)"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "vs-price",
										"onUpdate:modelValue": ($event) => form.price = $event,
										class: ["input vs__num vs__money", { "input--error": errors.value.price }],
										type: "text",
										inputmode: "decimal",
										autocomplete: "off",
										maxlength: "32",
										"aria-required": "true",
										"aria-describedby": "vs-price-help vs-price-err",
										"aria-invalid": errors.value.price ? "true" : void 0
									}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, form.price]]),
									(0, vue_exports.createVNode)("p", {
										id: "vs-price-help",
										class: "form-field__help"
									}, "In Euro, mit Komma – zum Beispiel 4,90. Kostenlos ist 0,00."),
									(0, vue_exports.createVNode)("p", {
										id: "vs-price-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(errors.value.price ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("fieldset", { class: "form-field vs__days" }, [
									(0, vue_exports.createVNode)("legend", { class: "form-field__label" }, "Lieferzeit in Werktagen"),
									(0, vue_exports.createVNode)("div", { class: "vs__days-row" }, [(0, vue_exports.createVNode)("label", { class: "vs__day" }, [(0, vue_exports.createVNode)("span", null, "von"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "vs-min-days",
										"onUpdate:modelValue": ($event) => form.min_days = $event,
										class: ["input vs__num", { "input--error": errors.value.min_days }],
										type: "number",
										min: "1",
										max: "60",
										step: "1",
										"aria-describedby": "vs-days-help vs-days-err",
										"aria-invalid": errors.value.min_days ? "true" : void 0
									}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[
										vue_exports.vModelText,
										form.min_days,
										void 0,
										{ number: true }
									]])]), (0, vue_exports.createVNode)("label", { class: "vs__day" }, [(0, vue_exports.createVNode)("span", null, "bis"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "vs-max-days",
										"onUpdate:modelValue": ($event) => form.max_days = $event,
										class: ["input vs__num", { "input--error": errors.value.max_days }],
										type: "number",
										min: "1",
										max: "60",
										step: "1",
										"aria-describedby": "vs-days-help vs-days-err",
										"aria-invalid": errors.value.max_days ? "true" : void 0
									}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[
										vue_exports.vModelText,
										form.max_days,
										void 0,
										{ number: true }
									]])])]),
									(0, vue_exports.createVNode)("p", {
										id: "vs-days-help",
										class: "form-field__help"
									}, "Ab Zahlungseingang. Bei einer festen Zahl steht in beiden Feldern dieselbe."),
									(0, vue_exports.createVNode)("p", {
										id: "vs-days-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(errors.value.min_days ?? errors.value.max_days ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "vs-free"
									}, [(0, vue_exports.createTextVNode)("Versandkostenfrei ab "), (0, vue_exports.createVNode)("span", { class: "vs__optional" }, "(optional)")]),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "vs-free",
										"onUpdate:modelValue": ($event) => form.free_from = $event,
										class: ["input vs__num vs__money", { "input--error": errors.value.free_from }],
										type: "text",
										inputmode: "decimal",
										autocomplete: "off",
										maxlength: "32",
										"aria-describedby": "vs-free-help vs-free-err",
										"aria-invalid": errors.value.free_from ? "true" : void 0
									}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, form.free_from]]),
									(0, vue_exports.createVNode)("p", {
										id: "vs-free-help",
										class: "form-field__help"
									}, "Warenwert mit MwSt., ab dem diese Versandart nichts kostet. Leer: nie."),
									(0, vue_exports.createVNode)("p", {
										id: "vs-free-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(errors.value.free_from ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("fieldset", { class: "form-field vs__group" }, [
									(0, vue_exports.createVNode)("legend", { class: "form-field__label" }, "Länder"),
									((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.countries, (name, code) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("label", {
											key: code,
											class: "check"
										}, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											"onUpdate:modelValue": ($event) => form.countries = $event,
											type: "checkbox",
											value: code
										}, null, 8, ["onUpdate:modelValue", "value"]), [[vue_exports.vModelCheckbox, form.countries]]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(name), 1)]);
									}), 128)),
									(0, vue_exports.createVNode)("p", { class: "form-field__help" }, "Die Kasse liefert bisher nur nach Deutschland."),
									(0, vue_exports.createVNode)("p", { class: "form-field__error" }, (0, vue_exports.toDisplayString)(errors.value.countries ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("fieldset", { class: "form-field vs__group" }, [
									(0, vue_exports.createVNode)("legend", { class: "form-field__label" }, [(0, vue_exports.createTextVNode)("Gilt für "), (0, vue_exports.createVNode)("span", { class: "vs__optional" }, "(optional)")]),
									((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.productTypes, (name, type) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("label", {
											key: type,
											class: "check"
										}, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											"onUpdate:modelValue": ($event) => form.product_types = $event,
											type: "checkbox",
											value: type
										}, null, 8, ["onUpdate:modelValue", "value"]), [[vue_exports.vModelCheckbox, form.product_types]]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(name), 1)]);
									}), 128)),
									(0, vue_exports.createVNode)("p", { class: "form-field__help" }, "Nichts angehakt: für alles. Ein Warenkorb mit Felgen und Kompletträdern braucht eine Versandart, die beides verschickt."),
									(0, vue_exports.createVNode)("p", { class: "form-field__error" }, (0, vue_exports.toDisplayString)(errors.value.product_types ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field vs__wide" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "vs-description"
									}, [(0, vue_exports.createTextVNode)("Beschreibung "), (0, vue_exports.createVNode)("span", { class: "vs__optional" }, "(optional)")]),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("textarea", {
										id: "vs-description",
										"onUpdate:modelValue": ($event) => form.description = $event,
										class: "input vs__text",
										rows: "2",
										maxlength: "300",
										"aria-describedby": "vs-description-help vs-description-err"
									}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, form.description]]),
									(0, vue_exports.createVNode)("p", {
										id: "vs-description-help",
										class: "form-field__help"
									}, "Steht in der Kasse unter dem Namen, etwa „Versichert, mit Sendungsverfolgung“."),
									(0, vue_exports.createVNode)("p", {
										id: "vs-description-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(errors.value.description ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "adm-fields__checks" }, [(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									"onUpdate:modelValue": ($event) => form.active = $event,
									type: "checkbox"
								}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelCheckbox, form.active]]), (0, vue_exports.createTextVNode)(" In der Kasse anbieten ")])])
							]),
							(0, vue_exports.createVNode)("div", { class: "adm-fields__actions" }, [(0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "submit",
								disabled: busy.value
							}, (0, vue_exports.toDisplayString)(submitLabel.value), 9, ["disabled"]), editing.value !== null ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
								key: 0,
								class: "btn btn--secondary",
								type: "button",
								onClick: reset
							}, "Abbrechen")) : (0, vue_exports.createCommentVNode)("", true)])
						], 40, ["aria-busy"])])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "vs-list-title"
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "vs-list-title",
							class: "adm-section__title"
						}, "Versandarten")]), __props.methods.length > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 0,
							class: "adm-panel"
						}, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Name"),
							(0, vue_exports.createVNode)("th", {
								scope: "col",
								class: "num"
							}, "Preis"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Lieferzeit"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Versandkostenfrei ab"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Gilt für"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Im Shop"),
							__props.canEdit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("th", {
								key: 0,
								scope: "col"
							}, [(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, "Aktionen")])) : (0, vue_exports.createCommentVNode)("", true)
						])]), (0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.methods, (method, i) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", {
								key: method.id,
								"aria-current": editing.value === method.id ? "true" : void 0
							}, [
								(0, vue_exports.createVNode)("td", { "data-label": "Name" }, [
									(0, vue_exports.createVNode)("span", { class: "adm-table__key" }, (0, vue_exports.toDisplayString)(method.name), 1),
									method.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "adm-tag adm-tag--neutral adm-demo"
									}, "Demodaten")) : (0, vue_exports.createCommentVNode)("", true),
									method.description ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 1,
										class: "adm-table__sub"
									}, (0, vue_exports.toDisplayString)(method.description), 1)) : (0, vue_exports.createCommentVNode)("", true)
								]),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Preis",
									class: "num"
								}, (0, vue_exports.toDisplayString)(method.price), 1),
								(0, vue_exports.createVNode)("td", { "data-label": "Lieferzeit" }, (0, vue_exports.toDisplayString)(method.deliveryTime), 1),
								(0, vue_exports.createVNode)("td", { "data-label": "Versandkostenfrei ab" }, (0, vue_exports.toDisplayString)(method.freeFrom ?? "–"), 1),
								(0, vue_exports.createVNode)("td", { "data-label": "Gilt für" }, (0, vue_exports.toDisplayString)(shipsLabel(method)), 1),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Im Shop",
									"data-phone": "status"
								}, [method.active ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("Aktiv")], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 1,
									class: "adm-tag adm-tag--neutral"
								}, "Aus"))]),
								__props.canEdit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
									key: 0,
									"data-label": "Aktionen"
								}, [(0, vue_exports.createVNode)("div", { class: "adm-table__actions" }, [
									(0, vue_exports.createVNode)("button", {
										class: "btn btn--secondary btn--sm",
										type: "button",
										disabled: busy.value,
										onClick: ($event) => edit(method)
									}, [(0, vue_exports.createTextVNode)(" Bearbeiten"), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ": " + (0, vue_exports.toDisplayString)(method.name), 1)], 8, ["disabled", "onClick"]),
									(0, vue_exports.createVNode)("button", {
										class: "btn btn--secondary btn--sm",
										type: "button",
										disabled: busy.value,
										onClick: ($event) => toggle(method)
									}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(method.active ? "Ausschalten" : "Einschalten"), 1), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ": " + (0, vue_exports.toDisplayString)(method.name), 1)], 8, ["disabled", "onClick"]),
									(0, vue_exports.createVNode)("button", {
										class: "btn btn--secondary btn--sm",
										type: "button",
										disabled: busy.value || i === 0,
										onClick: ($event) => move(method, -1)
									}, [(0, vue_exports.createTextVNode)(" Nach oben"), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ": " + (0, vue_exports.toDisplayString)(method.name), 1)], 8, ["disabled", "onClick"]),
									(0, vue_exports.createVNode)("button", {
										class: "btn btn--secondary btn--sm",
										type: "button",
										disabled: busy.value || i === __props.methods.length - 1,
										onClick: ($event) => move(method, 1)
									}, [(0, vue_exports.createTextVNode)(" Nach unten"), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ": " + (0, vue_exports.toDisplayString)(method.name), 1)], 8, ["disabled", "onClick"]),
									(0, vue_exports.createVNode)("button", {
										class: "btn btn--secondary btn--sm",
										type: "button",
										disabled: busy.value,
										onClick: ($event) => askDelete(method)
									}, [(0, vue_exports.createTextVNode)(" Löschen"), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ": " + (0, vue_exports.toDisplayString)(method.name), 1)], 8, ["disabled", "onClick"])
								])])) : (0, vue_exports.createCommentVNode)("", true)
							], 8, ["aria-current"]);
						}), 128))])])])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 1,
							kind: "empty",
							text: "Noch keine Versandart angelegt."
						}))]),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: deleteOpen.value,
							"onUpdate:open": ($event) => deleteOpen.value = $event,
							title: `Versandart „${deleting.value?.name ?? ""}“ löschen?`,
							body: "Sie verschwindet aus der Kasse und aus dieser Liste. Bestellungen, die schon mit ihr verschickt werden, behalten Namen, Preis und Lieferzeit.",
							"confirm-label": "Löschen",
							busy: busy.value,
							onConfirm: destroy
						}, null, 8, [
							"open",
							"onUpdate:open",
							"title",
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
//#region resources/js/Pages/Admin/Einstellungen/Versand.vue
var _sfc_setup = Versand_vue_vue_type_script_setup_true_lang_default.setup;
Versand_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Einstellungen/Versand.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Versand_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Versand_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-c345cd6f"]]);
//#endregion
export { Versand_default as default };
