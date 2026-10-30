import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-CfOJdYqk.js";
import { c as router, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { t as AdminConfirm_default } from "./AdminConfirm-CuIy_ILR.js";
import { n as useDirtyForm } from "./useDirtyForm-jjlNVm-n.js";
import { t as AdminSaveBar_default } from "./AdminSaveBar-BwfIFyA9.js";
import { t as TyreLabel_default } from "./TyreLabel-Da4LgdfR.js";
//#region resources/js/Pages/Admin/Reifen/Edit.vue?vue&type=script&setup=true&lang.ts
var NEW_BRAND = -1;
var Edit_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Edit",
	__ssrInlineRender: true,
	props: {
		stamp: {},
		tyre: {},
		template: {},
		brands: {},
		options: {},
		can: {}
	},
	setup(__props) {
		/**
		* Katalog › Reifen › one tyre, or a new one (his admin item 10, D-302): one size of one profile — its brand, profile and
		* season, its size with load index and speed symbol, its EU tyre label (Regulation (EU) 2020/740) and how it is sold —
		* saved together through the save bar.
		*
		* Above the form stands what the shop does with the tyre now, read from the saved row: offered, or why not — not
		* available (D-301), or its label not complete on record (D-303). The label may be saved incomplete; the shop does not
		* offer the tyre until every entry is there. The two pictograms are answered „Ja“ or „Nein“ — unanswered is not „Nein“.
		* A demonstration tyre is shown and never changed.
		*/
		const props = __props;
		function fromProps() {
			const tyre = props.tyre;
			const template = props.template;
			return {
				brand_id: tyre?.brandId ?? template?.brandId ?? null,
				brand_new: "",
				name: tyre?.name ?? template?.name ?? "",
				season: tyre?.season ?? template?.season ?? "",
				width_mm: tyre?.width ?? "",
				aspect: tyre?.aspect ?? "",
				diameter_in: tyre?.diameter ?? "",
				load_index: tyre?.loadIndex ?? "",
				speed_symbol: tyre?.speedSymbol ?? "",
				eu_fuel_class: tyre?.fuel ?? "",
				eu_wet_grip_class: tyre?.wet ?? "",
				eu_noise_db: tyre?.noiseDb ?? "",
				eu_noise_class: tyre?.noiseClass ?? "",
				eu_snow_grip: tyre?.snow ?? null,
				eu_ice_grip: tyre?.ice ?? null,
				eprel_id: tyre?.eprelId ?? "",
				price: tyre?.price ?? "",
				available: tyre?.available ?? true
			};
		}
		const editor = useDirtyForm(fromProps(), {
			method: () => props.tyre ? "put" : "post",
			url: () => props.tyre ? `/admin/reifen/${props.tyre.id}` : "/admin/reifen",
			stamp: () => props.stamp,
			onSaved: () => sync()
		});
		const form = editor.form;
		form.transform((data) => ({
			...data,
			brand_id: data.brand_id === NEW_BRAND ? null : data.brand_id,
			brand_new: data.brand_id === NEW_BRAND ? data.brand_new : ""
		}));
		/** After a save the server's row is the truth. */
		function sync() {
			form.defaults(fromProps());
			form.reset();
			form.clearErrors();
		}
		(0, vue_exports.watch)(() => props.tyre?.id, () => sync());
		const demo = (0, vue_exports.computed)(() => props.tyre?.demo === true);
		const editable = (0, vue_exports.computed)(() => !demo.value && (props.tyre ? props.can.edit : props.can.create));
		const readonly = (0, vue_exports.computed)(() => !editable.value);
		const sizeLocked = (0, vue_exports.computed)(() => readonly.value || props.tyre?.sold === true);
		const errors = (0, vue_exports.computed)(() => form.errors);
		function err(field) {
			return errors.value[field] ?? "";
		}
		const errorCount = (0, vue_exports.computed)(() => Object.values(errors.value).filter((value) => typeof value === "string" && value !== "").length);
		const brandName = (0, vue_exports.computed)(() => form.brand_id === NEW_BRAND ? form.brand_new.trim() : props.brands.find((b) => b.value === form.brand_id)?.label ?? "");
		/** `225/45 R18 95Y` — once every part is there. */
		const sizeLabel = (0, vue_exports.computed)(() => {
			const parts = [
				form.width_mm,
				form.aspect,
				form.diameter_in,
				form.load_index,
				form.speed_symbol
			].map((part) => String(part).trim());
			return parts.every((part) => part !== "") ? `${parts[0]}/${parts[1]} R${parts[2]} ${parts[3]}${parts[4]}` : "";
		});
		const title = (0, vue_exports.computed)(() => props.tyre ? props.tyre.fullTitle : "Neuer Reifen");
		const context = (0, vue_exports.computed)(() => {
			if (!props.tyre) return props.template ? `Weitere Größe von ${[brandName.value, props.template.name].filter(Boolean).join(" ")}` : "Noch nicht gespeichert";
			return props.tyre.updated ? `Geändert am ${props.tyre.updated}` : "Gespeichert";
		});
		const CLASSES = [
			"A",
			"B",
			"C",
			"D",
			"E"
		];
		/** The preview once the four figures are typed; the shop shows the label only with its EPREL number too (D-303). */
		const preview = (0, vue_exports.computed)(() => {
			const noise = Number(form.eu_noise_db);
			if (!CLASSES.includes(form.eu_fuel_class) || !CLASSES.includes(form.eu_wet_grip_class) || ![
				"A",
				"B",
				"C"
			].includes(form.eu_noise_class) || !Number.isInteger(noise) || noise <= 0) return null;
			return {
				title: [
					brandName.value,
					form.name.trim(),
					sizeLabel.value
				].filter(Boolean).join(" · ") || "Neuer Reifen",
				fuel: form.eu_fuel_class,
				wet: form.eu_wet_grip_class,
				noiseDb: noise,
				noiseClass: form.eu_noise_class,
				snowGrip: form.eu_snow_grip,
				iceGrip: form.eu_ice_grip,
				eprelId: /^\d+$/.test(form.eprel_id.trim()) ? form.eprel_id.trim() : null
			};
		});
		const removeOpen = (0, vue_exports.ref)(false);
		const removing = (0, vue_exports.ref)(false);
		function remove() {
			if (!props.tyre) return;
			removing.value = true;
			router.delete(`/admin/reifen/${props.tyre.id}`, { onFinish: () => {
				removing.value = false;
				removeOpen.value = false;
			} });
		}
		const more = (0, vue_exports.computed)(() => {
			const actions = [];
			const tyre = props.tyre;
			if (!tyre || tyre.demo) return actions;
			if (props.can.create) actions.push({
				label: "Weitere Größe anlegen",
				href: `/admin/reifen/neu?wie=${tyre.id}`,
				icon: "plus"
			});
			if (props.can.delete) actions.push({
				label: "Entfernen",
				run: () => removeOpen.value = true,
				danger: true
			});
			return actions;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: title.value,
				context: context.value,
				more: more.value,
				"read-only": readonly.value && !demo.value
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.tyre) {
							_push(`<section class="${(0, server_renderer_exports.ssrRenderClass)([{ "rf-state--off": !__props.tyre.offered && !__props.tyre.demo }, "rf-state"])}" aria-labelledby="rf-state-h" data-v-348ea753${_scopeId}><h2 id="rf-state-h" class="rf-state__title" data-v-348ea753${_scopeId}> Im Shop <span class="rf-state__verdict" data-v-348ea753${_scopeId}>`);
							if (__props.tyre.demo) _push(`<!--[-->Aus den Demodaten<!--]-->`);
							else if (__props.tyre.offered) _push(`<!--[-->Wird angeboten<!--]-->`);
							else _push(`<!--[-->Wird nicht angeboten<!--]-->`);
							_push(`</span></h2><ul class="rf-state__list" data-v-348ea753${_scopeId}>`);
							if (__props.tyre.demo) {
								_push(`<li class="rf-state__item" data-v-348ea753${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
									name: "info",
									size: 16
								}, null, _parent, _scopeId));
								_push(` Ein Reifen aus den Demodaten: Er zeigt, wie ein Komplettrad aussieht, und lässt sich hier nicht ändern. </li>`);
							} else {
								_push(`<!--[-->`);
								if (__props.tyre.offered) {
									_push(`<li class="rf-state__item" data-v-348ea753${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "check",
										size: 16
									}, null, _parent, _scopeId));
									_push(` Der Shop bietet ihn als Komplettrad an: auf Felgen, deren Gutachten diese Reifengröße für das Fahrzeug des Kunden freigibt, wenn er dessen Mindestwerte erfüllt. </li>`);
								} else _push(`<!---->`);
								if (!__props.tyre.available) {
									_push(`<li class="rf-state__item rf-state__item--bad" data-v-348ea753${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "warning",
										size: 16
									}, null, _parent, _scopeId));
									_push(` Er ist als „Nicht verfügbar“ markiert. </li>`);
								} else _push(`<!---->`);
								if (__props.tyre.missingLabel.length) {
									_push(`<li class="rf-state__item rf-state__item--bad" data-v-348ea753${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "warning",
										size: 16
									}, null, _parent, _scopeId));
									_push(` Das EU-Reifenlabel ist noch unvollständig. Noch nicht eingetragen: ${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.missingLabel.join(", "))}. </li>`);
								} else _push(`<!---->`);
								_push(`<!--]-->`);
							}
							_push(`</ul></section>`);
						} else _push(`<p class="adm-note rf-first" data-v-348ea753${_scopeId}>Der Shop bietet einen Reifen erst an, wenn er verfügbar ist und sein EU-Reifenlabel vollständig eingetragen ist.</p>`);
						if (errorCount.value) _push(`<p class="adm-alert" role="alert" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errorCount.value === 1 ? "Eine Angabe muss noch korrigiert werden." : `${errorCount.value} Angaben müssen noch korrigiert werden.`)} Die Hinweise stehen bei den Feldern. </p>`);
						else _push(`<!---->`);
						_push(`<form class="rf-form" novalidate data-v-348ea753${_scopeId}><section class="adm-section" aria-labelledby="rf-h-tyre" data-v-348ea753${_scopeId}><div class="adm-section__head" data-v-348ea753${_scopeId}><h2 id="rf-h-tyre" class="adm-section__title" data-v-348ea753${_scopeId}>Der Reifen</h2></div><div class="adm-fields rf-narrow" data-v-348ea753${_scopeId}><div class="form-field" data-v-348ea753${_scopeId}><label class="form-field__label" for="rf-brand" data-v-348ea753${_scopeId}>Marke</label><select id="rf-brand" class="input"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("brand_id") ? "true" : void 0)} aria-describedby="rf-brand-err" data-v-348ea753${_scopeId}><option${(0, server_renderer_exports.ssrRenderAttr)("value", null)} disabled data-v-348ea753${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).brand_id) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).brand_id, null) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).brand_id, null)) ? " selected" : ""}${_scopeId}>Marke wählen</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.brands, (brand) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", brand.value)} data-v-348ea753${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).brand_id) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).brand_id, brand.value) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).brand_id, brand.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(brand.label)}</option>`);
						});
						_push(`<!--]--><option${(0, server_renderer_exports.ssrRenderAttr)("value", NEW_BRAND)} data-v-348ea753${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).brand_id) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).brand_id, NEW_BRAND) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).brand_id, NEW_BRAND)) ? " selected" : ""}${_scopeId}>Neue Marke anlegen …</option></select><p id="rf-brand-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("brand_id"))}</p></div>`);
						if ((0, vue_exports.unref)(form).brand_id === NEW_BRAND) _push(`<div class="form-field" data-v-348ea753${_scopeId}><label class="form-field__label" for="rf-brand-new" data-v-348ea753${_scopeId}>Name der neuen Marke</label><input id="rf-brand-new"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).brand_new)} class="input" type="text" maxlength="60"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("brand_new") ? "true" : void 0)} aria-describedby="rf-brand-new-err" data-v-348ea753${_scopeId}><p id="rf-brand-new-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("brand_new"))}</p></div>`);
						else _push(`<!---->`);
						_push(`<div class="form-field" data-v-348ea753${_scopeId}><label class="form-field__label" for="rf-name" data-v-348ea753${_scopeId}>Profil</label><input id="rf-name"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).name)} class="input" type="text" maxlength="80" placeholder="PremiumContact 7"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("name") ? "true" : void 0)} aria-describedby="rf-name-help rf-name-err" data-v-348ea753${_scopeId}><p id="rf-name-help" class="form-field__help" data-v-348ea753${_scopeId}>Der Name der Profilreihe, so wie der Hersteller ihn schreibt.</p><p id="rf-name-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("name"))}</p></div><div class="form-field" data-v-348ea753${_scopeId}><label class="form-field__label" for="rf-season" data-v-348ea753${_scopeId}>Saison</label><select id="rf-season" class="input rf-mid"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("season") ? "true" : void 0)} aria-describedby="rf-season-err" data-v-348ea753${_scopeId}><option value="" disabled data-v-348ea753${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).season) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).season, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).season, "")) ? " selected" : ""}${_scopeId}>Saison wählen</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.options.seasons, (season) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", season.value)} data-v-348ea753${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).season) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).season, season.value) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).season, season.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(season.label)}</option>`);
						});
						_push(`<!--]--></select><p id="rf-season-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("season"))}</p></div></div></section><section class="adm-section" aria-labelledby="rf-h-size" data-v-348ea753${_scopeId}><div class="adm-section__head" data-v-348ea753${_scopeId}><h2 id="rf-h-size" class="adm-section__title" data-v-348ea753${_scopeId}>Größe</h2>`);
						if (sizeLabel.value) _push(`<p class="rf-size-preview" aria-live="polite" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(sizeLabel.value)}</p>`);
						else _push(`<!---->`);
						_push(`</div><div class="adm-fields" data-v-348ea753${_scopeId}>`);
						if (__props.tyre?.sold && !readonly.value) _push(`<p class="adm-note" data-v-348ea753${_scopeId}> Dieser Reifen wurde schon bestellt. Größe, Lastindex und Geschwindigkeitssymbol lassen sich deshalb nicht mehr ändern. Für andere Werte leg über „Weitere Größe anlegen“ im Menü einen neuen Reifen an. </p>`);
						else _push(`<!---->`);
						_push(`<div class="rf-row" data-v-348ea753${_scopeId}><div class="form-field" data-v-348ea753${_scopeId}><label class="form-field__label" for="rf-width" data-v-348ea753${_scopeId}>Breite in mm</label><input id="rf-width"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).width_mm)} class="input num" type="text" inputmode="numeric" maxlength="3" placeholder="225"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sizeLocked.value) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("width_mm") ? "true" : void 0)} aria-describedby="rf-width-err" data-v-348ea753${_scopeId}><p id="rf-width-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("width_mm"))}</p></div><div class="form-field" data-v-348ea753${_scopeId}><label class="form-field__label" for="rf-aspect" data-v-348ea753${_scopeId}>Querschnitt in %</label><input id="rf-aspect"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).aspect)} class="input num" type="text" inputmode="numeric" maxlength="2" placeholder="45"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sizeLocked.value) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("aspect") ? "true" : void 0)} aria-describedby="rf-aspect-err" data-v-348ea753${_scopeId}><p id="rf-aspect-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("aspect"))}</p></div><div class="form-field" data-v-348ea753${_scopeId}><label class="form-field__label" for="rf-diameter" data-v-348ea753${_scopeId}>Durchmesser in Zoll</label><input id="rf-diameter"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).diameter_in)} class="input num" type="text" inputmode="numeric" maxlength="2" placeholder="18"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sizeLocked.value) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("diameter_in") ? "true" : void 0)} aria-describedby="rf-diameter-err" data-v-348ea753${_scopeId}><p id="rf-diameter-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("diameter_in"))}</p></div></div><div class="rf-row" data-v-348ea753${_scopeId}><div class="form-field" data-v-348ea753${_scopeId}><label class="form-field__label" for="rf-load" data-v-348ea753${_scopeId}>Lastindex</label><input id="rf-load"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).load_index)} class="input num" type="text" inputmode="numeric" maxlength="3" placeholder="95"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sizeLocked.value) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("load_index") ? "true" : void 0)} aria-describedby="rf-load-err" data-v-348ea753${_scopeId}><p id="rf-load-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("load_index"))}</p></div><div class="form-field" data-v-348ea753${_scopeId}><label class="form-field__label" for="rf-speed" data-v-348ea753${_scopeId}>Geschwindigkeitssymbol</label><select id="rf-speed" class="input"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sizeLocked.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("speed_symbol") ? "true" : void 0)} aria-describedby="rf-speed-err" data-v-348ea753${_scopeId}><option value="" disabled data-v-348ea753${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).speed_symbol) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).speed_symbol, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).speed_symbol, "")) ? " selected" : ""}${_scopeId}>Symbol wählen</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.options.speedSymbols, (symbol) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", symbol)} data-v-348ea753${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).speed_symbol) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).speed_symbol, symbol) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).speed_symbol, symbol)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(symbol)}</option>`);
						});
						_push(`<!--]--></select><p id="rf-speed-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("speed_symbol"))}</p></div></div></div></section><section class="adm-section" aria-labelledby="rf-h-label" data-v-348ea753${_scopeId}><div class="adm-section__head" data-v-348ea753${_scopeId}><h2 id="rf-h-label" class="adm-section__title" data-v-348ea753${_scopeId}>EU-Reifenlabel</h2></div><p class="rf-section-note" data-v-348ea753${_scopeId}>Trag die Werte so ein, wie sie auf dem Label und in EPREL stehen. Erst wenn alle eingetragen sind, bietet der Shop den Reifen an.</p><div class="rf-label-grid" data-v-348ea753${_scopeId}><div class="adm-fields" data-v-348ea753${_scopeId}><div class="rf-row rf-row--label" data-v-348ea753${_scopeId}><div class="form-field" data-v-348ea753${_scopeId}><label class="form-field__label" for="rf-fuel" data-v-348ea753${_scopeId}>Kraftstoffeffizienz</label><select id="rf-fuel" class="input"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("eu_fuel_class") ? "true" : void 0)} aria-describedby="rf-fuel-err" data-v-348ea753${_scopeId}><option value="" data-v-348ea753${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).eu_fuel_class) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).eu_fuel_class, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).eu_fuel_class, "")) ? " selected" : ""}${_scopeId}>Noch nicht eingetragen</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.options.classes, (c) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", c)} data-v-348ea753${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).eu_fuel_class) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).eu_fuel_class, c) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).eu_fuel_class, c)) ? " selected" : ""}${_scopeId}>Klasse ${(0, server_renderer_exports.ssrInterpolate)(c)}</option>`);
						});
						_push(`<!--]--></select><p id="rf-fuel-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("eu_fuel_class"))}</p></div><div class="form-field" data-v-348ea753${_scopeId}><label class="form-field__label" for="rf-wet" data-v-348ea753${_scopeId}>Nasshaftung</label><select id="rf-wet" class="input"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("eu_wet_grip_class") ? "true" : void 0)} aria-describedby="rf-wet-err" data-v-348ea753${_scopeId}><option value="" data-v-348ea753${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).eu_wet_grip_class) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).eu_wet_grip_class, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).eu_wet_grip_class, "")) ? " selected" : ""}${_scopeId}>Noch nicht eingetragen</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.options.classes, (c) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", c)} data-v-348ea753${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).eu_wet_grip_class) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).eu_wet_grip_class, c) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).eu_wet_grip_class, c)) ? " selected" : ""}${_scopeId}>Klasse ${(0, server_renderer_exports.ssrInterpolate)(c)}</option>`);
						});
						_push(`<!--]--></select><p id="rf-wet-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("eu_wet_grip_class"))}</p></div></div><div class="rf-row rf-row--label" data-v-348ea753${_scopeId}><div class="form-field" data-v-348ea753${_scopeId}><label class="form-field__label" for="rf-noise" data-v-348ea753${_scopeId}>Externes Rollgeräusch in dB</label><input id="rf-noise"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).eu_noise_db)} class="input num" type="text" inputmode="numeric" maxlength="2" placeholder="71"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("eu_noise_db") ? "true" : void 0)} aria-describedby="rf-noise-err" data-v-348ea753${_scopeId}><p id="rf-noise-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("eu_noise_db"))}</p></div><div class="form-field" data-v-348ea753${_scopeId}><label class="form-field__label" for="rf-noise-class" data-v-348ea753${_scopeId}>Rollgeräuschklasse</label><select id="rf-noise-class" class="input"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("eu_noise_class") ? "true" : void 0)} aria-describedby="rf-noise-class-err" data-v-348ea753${_scopeId}><option value="" data-v-348ea753${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).eu_noise_class) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).eu_noise_class, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).eu_noise_class, "")) ? " selected" : ""}${_scopeId}>Noch nicht eingetragen</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.options.noiseClasses, (c) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", c)} data-v-348ea753${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).eu_noise_class) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).eu_noise_class, c) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).eu_noise_class, c)) ? " selected" : ""}${_scopeId}>Klasse ${(0, server_renderer_exports.ssrInterpolate)(c)}</option>`);
						});
						_push(`<!--]--></select><p id="rf-noise-class-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("eu_noise_class"))}</p></div></div><div class="rf-row rf-row--label" data-v-348ea753${_scopeId}><fieldset class="form-field rf-choice"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("eu_snow_grip") ? "true" : void 0)} aria-describedby="rf-snow-help rf-snow-err" data-v-348ea753${_scopeId}><legend class="form-field__label" data-v-348ea753${_scopeId}>Schneegriffigkeit</legend><div class="rf-choice__options" data-v-348ea753${_scopeId}><label class="rf-choice__option" data-v-348ea753${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).eu_snow_grip, true)) ? " checked" : ""} type="radio" name="rf-snow"${(0, server_renderer_exports.ssrRenderAttr)("value", true)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " disabled" : ""} data-v-348ea753${_scopeId}> Ja</label><label class="rf-choice__option" data-v-348ea753${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).eu_snow_grip, false)) ? " checked" : ""} type="radio" name="rf-snow"${(0, server_renderer_exports.ssrRenderAttr)("value", false)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " disabled" : ""} data-v-348ea753${_scopeId}> Nein</label></div><p id="rf-snow-help" class="form-field__help" data-v-348ea753${_scopeId}>Ja, wenn das Label das Schnee-Piktogramm zeigt (Berg mit Schneeflocke). Fehlt es, wähl Nein.</p><p id="rf-snow-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("eu_snow_grip"))}</p></fieldset><fieldset class="form-field rf-choice"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("eu_ice_grip") ? "true" : void 0)} aria-describedby="rf-ice-help rf-ice-err" data-v-348ea753${_scopeId}><legend class="form-field__label" data-v-348ea753${_scopeId}>Eisgriffigkeit</legend><div class="rf-choice__options" data-v-348ea753${_scopeId}><label class="rf-choice__option" data-v-348ea753${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).eu_ice_grip, true)) ? " checked" : ""} type="radio" name="rf-ice"${(0, server_renderer_exports.ssrRenderAttr)("value", true)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " disabled" : ""} data-v-348ea753${_scopeId}> Ja</label><label class="rf-choice__option" data-v-348ea753${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).eu_ice_grip, false)) ? " checked" : ""} type="radio" name="rf-ice"${(0, server_renderer_exports.ssrRenderAttr)("value", false)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " disabled" : ""} data-v-348ea753${_scopeId}> Nein</label></div><p id="rf-ice-help" class="form-field__help" data-v-348ea753${_scopeId}>Ja, wenn das Label das Eis-Piktogramm zeigt. Fehlt es, wähl Nein.</p><p id="rf-ice-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("eu_ice_grip"))}</p></fieldset></div><div class="form-field" data-v-348ea753${_scopeId}><label class="form-field__label" for="rf-eprel" data-v-348ea753${_scopeId}>EPREL-Nummer</label><input id="rf-eprel"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).eprel_id)} class="input num rf-mid" type="text" inputmode="numeric" maxlength="16" spellcheck="false" autocomplete="off" placeholder="381090"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("eprel_id") ? "true" : void 0)} aria-describedby="rf-eprel-help rf-eprel-err" data-v-348ea753${_scopeId}><p id="rf-eprel-help" class="form-field__help" data-v-348ea753${_scopeId}>Die Registriernummer des Reifens in der EU-Produktdatenbank EPREL. Der QR-Code auf dem Label öffnet seine EPREL-Seite, dort steht sie. Der Shop verlinkt das Label auf diese Seite.</p><p id="rf-eprel-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("eprel_id"))}</p></div></div><div class="rf-preview" data-v-348ea753${_scopeId}><p class="rf-preview__head" data-v-348ea753${_scopeId}>Vorschau</p>`);
						if (preview.value) _push((0, server_renderer_exports.ssrRenderComponent)(TyreLabel_default, preview.value, null, _parent, _scopeId));
						else _push(`<p class="rf-preview__empty" data-v-348ea753${_scopeId}>Die Vorschau erscheint, sobald Kraftstoffeffizienz, Nasshaftung, Rollgeräusch und Rollgeräuschklasse eingetragen sind.</p>`);
						_push(`</div></div></section><section class="adm-section" aria-labelledby="rf-h-sale" data-v-348ea753${_scopeId}><div class="adm-section__head" data-v-348ea753${_scopeId}><h2 id="rf-h-sale" class="adm-section__title" data-v-348ea753${_scopeId}>Verkauf</h2></div><div class="adm-fields" data-v-348ea753${_scopeId}><div class="rf-row" data-v-348ea753${_scopeId}><div class="form-field" data-v-348ea753${_scopeId}><label class="form-field__label" for="rf-price" data-v-348ea753${_scopeId}>Preis je Reifen in €</label><input id="rf-price"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).price)} class="input num" type="text" inputmode="decimal" maxlength="12" placeholder="129,00"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("price") ? "true" : void 0)} aria-describedby="rf-price-help rf-price-err" data-v-348ea753${_scopeId}><p id="rf-price-help" class="form-field__help" data-v-348ea753${_scopeId}>Mit Mehrwertsteuer, ohne Montage und Auswuchten.</p><p id="rf-price-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("price"))}</p></div><div class="form-field" data-v-348ea753${_scopeId}><label class="form-field__label" for="rf-available" data-v-348ea753${_scopeId}>Verfügbarkeit</label><select id="rf-available" class="input"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " disabled" : ""} aria-describedby="rf-available-err" data-v-348ea753${_scopeId}><option${(0, server_renderer_exports.ssrRenderAttr)("value", true)} data-v-348ea753${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).available) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).available, true) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).available, true)) ? " selected" : ""}${_scopeId}>Verfügbar</option><option${(0, server_renderer_exports.ssrRenderAttr)("value", false)} data-v-348ea753${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).available) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).available, false) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).available, false)) ? " selected" : ""}${_scopeId}>Nicht verfügbar</option></select><p id="rf-available-err" class="form-field__error" data-v-348ea753${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("available"))}</p></div></div></div></section></form>`);
						if (editable.value) _push((0, server_renderer_exports.ssrRenderComponent)(AdminSaveBar_default, { editor: (0, vue_exports.unref)(editor) }, null, _parent, _scopeId));
						else _push(`<!---->`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: removeOpen.value,
							"onUpdate:open": ($event) => removeOpen.value = $event,
							title: "Reifen entfernen?",
							body: "Der Shop bietet ihn danach nicht mehr an. Bestellungen, in denen er steht, behalten ihn.",
							"confirm-label": "Entfernen",
							busy: removing.value,
							onConfirm: remove
						}, null, _parent, _scopeId));
					} else return [
						__props.tyre ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 0,
							class: ["rf-state", { "rf-state--off": !__props.tyre.offered && !__props.tyre.demo }],
							"aria-labelledby": "rf-state-h"
						}, [(0, vue_exports.createVNode)("h2", {
							id: "rf-state-h",
							class: "rf-state__title"
						}, [(0, vue_exports.createTextVNode)(" Im Shop "), (0, vue_exports.createVNode)("span", { class: "rf-state__verdict" }, [__props.tyre.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("Aus den Demodaten")], 64)) : __props.tyre.offered ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Wird angeboten")], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createTextVNode)("Wird nicht angeboten")], 64))])]), (0, vue_exports.createVNode)("ul", { class: "rf-state__list" }, [__props.tyre.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
							key: 0,
							class: "rf-state__item"
						}, [(0, vue_exports.createVNode)(AdminIcon_default, {
							name: "info",
							size: 16
						}), (0, vue_exports.createTextVNode)(" Ein Reifen aus den Demodaten: Er zeigt, wie ein Komplettrad aussieht, und lässt sich hier nicht ändern. ")])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [
							__props.tyre.offered ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
								key: 0,
								class: "rf-state__item"
							}, [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "check",
								size: 16
							}), (0, vue_exports.createTextVNode)(" Der Shop bietet ihn als Komplettrad an: auf Felgen, deren Gutachten diese Reifengröße für das Fahrzeug des Kunden freigibt, wenn er dessen Mindestwerte erfüllt. ")])) : (0, vue_exports.createCommentVNode)("", true),
							!__props.tyre.available ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
								key: 1,
								class: "rf-state__item rf-state__item--bad"
							}, [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "warning",
								size: 16
							}), (0, vue_exports.createTextVNode)(" Er ist als „Nicht verfügbar“ markiert. ")])) : (0, vue_exports.createCommentVNode)("", true),
							__props.tyre.missingLabel.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
								key: 2,
								class: "rf-state__item rf-state__item--bad"
							}, [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "warning",
								size: 16
							}), (0, vue_exports.createTextVNode)(" Das EU-Reifenlabel ist noch unvollständig. Noch nicht eingetragen: " + (0, vue_exports.toDisplayString)(__props.tyre.missingLabel.join(", ")) + ". ", 1)])) : (0, vue_exports.createCommentVNode)("", true)
						], 64))])], 2)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 1,
							class: "adm-note rf-first"
						}, "Der Shop bietet einen Reifen erst an, wenn er verfügbar ist und sein EU-Reifenlabel vollständig eingetragen ist.")),
						errorCount.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 2,
							class: "adm-alert",
							role: "alert"
						}, (0, vue_exports.toDisplayString)(errorCount.value === 1 ? "Eine Angabe muss noch korrigiert werden." : `${errorCount.value} Angaben müssen noch korrigiert werden.`) + " Die Hinweise stehen bei den Feldern. ", 1)) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("form", {
							class: "rf-form",
							novalidate: "",
							onSubmit: (0, vue_exports.withModifiers)((0, vue_exports.unref)(editor).save, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("section", {
								class: "adm-section",
								"aria-labelledby": "rf-h-tyre"
							}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "rf-h-tyre",
								class: "adm-section__title"
							}, "Der Reifen")]), (0, vue_exports.createVNode)("div", { class: "adm-fields rf-narrow" }, [
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "rf-brand"
									}, "Marke"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "rf-brand",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).brand_id = $event,
										class: "input",
										disabled: readonly.value,
										"aria-invalid": err("brand_id") ? "true" : void 0,
										"aria-describedby": "rf-brand-err"
									}, [
										(0, vue_exports.createVNode)("option", {
											value: null,
											disabled: ""
										}, "Marke wählen"),
										((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.brands, (brand) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
												key: brand.value,
												value: brand.value
											}, (0, vue_exports.toDisplayString)(brand.label), 9, ["value"]);
										}), 128)),
										(0, vue_exports.createVNode)("option", { value: NEW_BRAND }, "Neue Marke anlegen …")
									], 8, [
										"onUpdate:modelValue",
										"disabled",
										"aria-invalid"
									]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(form).brand_id]]),
									(0, vue_exports.createVNode)("p", {
										id: "rf-brand-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(err("brand_id")), 1)
								]),
								(0, vue_exports.unref)(form).brand_id === NEW_BRAND ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "form-field"
								}, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "rf-brand-new"
									}, "Name der neuen Marke"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "rf-brand-new",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).brand_new = $event,
										class: "input",
										type: "text",
										maxlength: "60",
										"aria-invalid": err("brand_new") ? "true" : void 0,
										"aria-describedby": "rf-brand-new-err"
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).brand_new]]),
									(0, vue_exports.createVNode)("p", {
										id: "rf-brand-new-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(err("brand_new")), 1)
								])) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "rf-name"
									}, "Profil"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "rf-name",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).name = $event,
										class: "input",
										type: "text",
										maxlength: "80",
										placeholder: "PremiumContact 7",
										readonly: readonly.value,
										"aria-invalid": err("name") ? "true" : void 0,
										"aria-describedby": "rf-name-help rf-name-err"
									}, null, 8, [
										"onUpdate:modelValue",
										"readonly",
										"aria-invalid"
									]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).name]]),
									(0, vue_exports.createVNode)("p", {
										id: "rf-name-help",
										class: "form-field__help"
									}, "Der Name der Profilreihe, so wie der Hersteller ihn schreibt."),
									(0, vue_exports.createVNode)("p", {
										id: "rf-name-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(err("name")), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "rf-season"
									}, "Saison"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "rf-season",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).season = $event,
										class: "input rf-mid",
										disabled: readonly.value,
										"aria-invalid": err("season") ? "true" : void 0,
										"aria-describedby": "rf-season-err"
									}, [(0, vue_exports.createVNode)("option", {
										value: "",
										disabled: ""
									}, "Saison wählen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.options.seasons, (season) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
											key: season.value,
											value: season.value
										}, (0, vue_exports.toDisplayString)(season.label), 9, ["value"]);
									}), 128))], 8, [
										"onUpdate:modelValue",
										"disabled",
										"aria-invalid"
									]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(form).season]]),
									(0, vue_exports.createVNode)("p", {
										id: "rf-season-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(err("season")), 1)
								])
							])]),
							(0, vue_exports.createVNode)("section", {
								class: "adm-section",
								"aria-labelledby": "rf-h-size"
							}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "rf-h-size",
								class: "adm-section__title"
							}, "Größe"), sizeLabel.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "rf-size-preview",
								"aria-live": "polite"
							}, (0, vue_exports.toDisplayString)(sizeLabel.value), 1)) : (0, vue_exports.createCommentVNode)("", true)]), (0, vue_exports.createVNode)("div", { class: "adm-fields" }, [
								__props.tyre?.sold && !readonly.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 0,
									class: "adm-note"
								}, " Dieser Reifen wurde schon bestellt. Größe, Lastindex und Geschwindigkeitssymbol lassen sich deshalb nicht mehr ändern. Für andere Werte leg über „Weitere Größe anlegen“ im Menü einen neuen Reifen an. ")) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("div", { class: "rf-row" }, [
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "rf-width"
										}, "Breite in mm"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											id: "rf-width",
											"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).width_mm = $event,
											class: "input num",
											type: "text",
											inputmode: "numeric",
											maxlength: "3",
											placeholder: "225",
											readonly: sizeLocked.value,
											"aria-invalid": err("width_mm") ? "true" : void 0,
											"aria-describedby": "rf-width-err"
										}, null, 8, [
											"onUpdate:modelValue",
											"readonly",
											"aria-invalid"
										]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).width_mm]]),
										(0, vue_exports.createVNode)("p", {
											id: "rf-width-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(err("width_mm")), 1)
									]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "rf-aspect"
										}, "Querschnitt in %"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											id: "rf-aspect",
											"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).aspect = $event,
											class: "input num",
											type: "text",
											inputmode: "numeric",
											maxlength: "2",
											placeholder: "45",
											readonly: sizeLocked.value,
											"aria-invalid": err("aspect") ? "true" : void 0,
											"aria-describedby": "rf-aspect-err"
										}, null, 8, [
											"onUpdate:modelValue",
											"readonly",
											"aria-invalid"
										]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).aspect]]),
										(0, vue_exports.createVNode)("p", {
											id: "rf-aspect-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(err("aspect")), 1)
									]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "rf-diameter"
										}, "Durchmesser in Zoll"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											id: "rf-diameter",
											"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).diameter_in = $event,
											class: "input num",
											type: "text",
											inputmode: "numeric",
											maxlength: "2",
											placeholder: "18",
											readonly: sizeLocked.value,
											"aria-invalid": err("diameter_in") ? "true" : void 0,
											"aria-describedby": "rf-diameter-err"
										}, null, 8, [
											"onUpdate:modelValue",
											"readonly",
											"aria-invalid"
										]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).diameter_in]]),
										(0, vue_exports.createVNode)("p", {
											id: "rf-diameter-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(err("diameter_in")), 1)
									])
								]),
								(0, vue_exports.createVNode)("div", { class: "rf-row" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "rf-load"
									}, "Lastindex"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "rf-load",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).load_index = $event,
										class: "input num",
										type: "text",
										inputmode: "numeric",
										maxlength: "3",
										placeholder: "95",
										readonly: sizeLocked.value,
										"aria-invalid": err("load_index") ? "true" : void 0,
										"aria-describedby": "rf-load-err"
									}, null, 8, [
										"onUpdate:modelValue",
										"readonly",
										"aria-invalid"
									]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).load_index]]),
									(0, vue_exports.createVNode)("p", {
										id: "rf-load-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(err("load_index")), 1)
								]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "rf-speed"
									}, "Geschwindigkeitssymbol"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "rf-speed",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).speed_symbol = $event,
										class: "input",
										disabled: sizeLocked.value,
										"aria-invalid": err("speed_symbol") ? "true" : void 0,
										"aria-describedby": "rf-speed-err"
									}, [(0, vue_exports.createVNode)("option", {
										value: "",
										disabled: ""
									}, "Symbol wählen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.options.speedSymbols, (symbol) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
											key: symbol,
											value: symbol
										}, (0, vue_exports.toDisplayString)(symbol), 9, ["value"]);
									}), 128))], 8, [
										"onUpdate:modelValue",
										"disabled",
										"aria-invalid"
									]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(form).speed_symbol]]),
									(0, vue_exports.createVNode)("p", {
										id: "rf-speed-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(err("speed_symbol")), 1)
								])])
							])]),
							(0, vue_exports.createVNode)("section", {
								class: "adm-section",
								"aria-labelledby": "rf-h-label"
							}, [
								(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
									id: "rf-h-label",
									class: "adm-section__title"
								}, "EU-Reifenlabel")]),
								(0, vue_exports.createVNode)("p", { class: "rf-section-note" }, "Trag die Werte so ein, wie sie auf dem Label und in EPREL stehen. Erst wenn alle eingetragen sind, bietet der Shop den Reifen an."),
								(0, vue_exports.createVNode)("div", { class: "rf-label-grid" }, [(0, vue_exports.createVNode)("div", { class: "adm-fields" }, [
									(0, vue_exports.createVNode)("div", { class: "rf-row rf-row--label" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "rf-fuel"
										}, "Kraftstoffeffizienz"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
											id: "rf-fuel",
											"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).eu_fuel_class = $event,
											class: "input",
											disabled: readonly.value,
											"aria-invalid": err("eu_fuel_class") ? "true" : void 0,
											"aria-describedby": "rf-fuel-err"
										}, [(0, vue_exports.createVNode)("option", { value: "" }, "Noch nicht eingetragen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.options.classes, (c) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
												key: c,
												value: c
											}, "Klasse " + (0, vue_exports.toDisplayString)(c), 9, ["value"]);
										}), 128))], 8, [
											"onUpdate:modelValue",
											"disabled",
											"aria-invalid"
										]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(form).eu_fuel_class]]),
										(0, vue_exports.createVNode)("p", {
											id: "rf-fuel-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(err("eu_fuel_class")), 1)
									]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "rf-wet"
										}, "Nasshaftung"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
											id: "rf-wet",
											"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).eu_wet_grip_class = $event,
											class: "input",
											disabled: readonly.value,
											"aria-invalid": err("eu_wet_grip_class") ? "true" : void 0,
											"aria-describedby": "rf-wet-err"
										}, [(0, vue_exports.createVNode)("option", { value: "" }, "Noch nicht eingetragen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.options.classes, (c) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
												key: c,
												value: c
											}, "Klasse " + (0, vue_exports.toDisplayString)(c), 9, ["value"]);
										}), 128))], 8, [
											"onUpdate:modelValue",
											"disabled",
											"aria-invalid"
										]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(form).eu_wet_grip_class]]),
										(0, vue_exports.createVNode)("p", {
											id: "rf-wet-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(err("eu_wet_grip_class")), 1)
									])]),
									(0, vue_exports.createVNode)("div", { class: "rf-row rf-row--label" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "rf-noise"
										}, "Externes Rollgeräusch in dB"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											id: "rf-noise",
											"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).eu_noise_db = $event,
											class: "input num",
											type: "text",
											inputmode: "numeric",
											maxlength: "2",
											placeholder: "71",
											readonly: readonly.value,
											"aria-invalid": err("eu_noise_db") ? "true" : void 0,
											"aria-describedby": "rf-noise-err"
										}, null, 8, [
											"onUpdate:modelValue",
											"readonly",
											"aria-invalid"
										]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).eu_noise_db]]),
										(0, vue_exports.createVNode)("p", {
											id: "rf-noise-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(err("eu_noise_db")), 1)
									]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "rf-noise-class"
										}, "Rollgeräuschklasse"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
											id: "rf-noise-class",
											"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).eu_noise_class = $event,
											class: "input",
											disabled: readonly.value,
											"aria-invalid": err("eu_noise_class") ? "true" : void 0,
											"aria-describedby": "rf-noise-class-err"
										}, [(0, vue_exports.createVNode)("option", { value: "" }, "Noch nicht eingetragen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.options.noiseClasses, (c) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
												key: c,
												value: c
											}, "Klasse " + (0, vue_exports.toDisplayString)(c), 9, ["value"]);
										}), 128))], 8, [
											"onUpdate:modelValue",
											"disabled",
											"aria-invalid"
										]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(form).eu_noise_class]]),
										(0, vue_exports.createVNode)("p", {
											id: "rf-noise-class-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(err("eu_noise_class")), 1)
									])]),
									(0, vue_exports.createVNode)("div", { class: "rf-row rf-row--label" }, [(0, vue_exports.createVNode)("fieldset", {
										class: "form-field rf-choice",
										"aria-invalid": err("eu_snow_grip") ? "true" : void 0,
										"aria-describedby": "rf-snow-help rf-snow-err"
									}, [
										(0, vue_exports.createVNode)("legend", { class: "form-field__label" }, "Schneegriffigkeit"),
										(0, vue_exports.createVNode)("div", { class: "rf-choice__options" }, [(0, vue_exports.createVNode)("label", { class: "rf-choice__option" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).eu_snow_grip = $event,
											type: "radio",
											name: "rf-snow",
											value: true,
											disabled: readonly.value
										}, null, 8, ["onUpdate:modelValue", "disabled"]), [[vue_exports.vModelRadio, (0, vue_exports.unref)(form).eu_snow_grip]]), (0, vue_exports.createTextVNode)(" Ja")]), (0, vue_exports.createVNode)("label", { class: "rf-choice__option" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).eu_snow_grip = $event,
											type: "radio",
											name: "rf-snow",
											value: false,
											disabled: readonly.value
										}, null, 8, ["onUpdate:modelValue", "disabled"]), [[vue_exports.vModelRadio, (0, vue_exports.unref)(form).eu_snow_grip]]), (0, vue_exports.createTextVNode)(" Nein")])]),
										(0, vue_exports.createVNode)("p", {
											id: "rf-snow-help",
											class: "form-field__help"
										}, "Ja, wenn das Label das Schnee-Piktogramm zeigt (Berg mit Schneeflocke). Fehlt es, wähl Nein."),
										(0, vue_exports.createVNode)("p", {
											id: "rf-snow-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(err("eu_snow_grip")), 1)
									], 8, ["aria-invalid"]), (0, vue_exports.createVNode)("fieldset", {
										class: "form-field rf-choice",
										"aria-invalid": err("eu_ice_grip") ? "true" : void 0,
										"aria-describedby": "rf-ice-help rf-ice-err"
									}, [
										(0, vue_exports.createVNode)("legend", { class: "form-field__label" }, "Eisgriffigkeit"),
										(0, vue_exports.createVNode)("div", { class: "rf-choice__options" }, [(0, vue_exports.createVNode)("label", { class: "rf-choice__option" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).eu_ice_grip = $event,
											type: "radio",
											name: "rf-ice",
											value: true,
											disabled: readonly.value
										}, null, 8, ["onUpdate:modelValue", "disabled"]), [[vue_exports.vModelRadio, (0, vue_exports.unref)(form).eu_ice_grip]]), (0, vue_exports.createTextVNode)(" Ja")]), (0, vue_exports.createVNode)("label", { class: "rf-choice__option" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).eu_ice_grip = $event,
											type: "radio",
											name: "rf-ice",
											value: false,
											disabled: readonly.value
										}, null, 8, ["onUpdate:modelValue", "disabled"]), [[vue_exports.vModelRadio, (0, vue_exports.unref)(form).eu_ice_grip]]), (0, vue_exports.createTextVNode)(" Nein")])]),
										(0, vue_exports.createVNode)("p", {
											id: "rf-ice-help",
											class: "form-field__help"
										}, "Ja, wenn das Label das Eis-Piktogramm zeigt. Fehlt es, wähl Nein."),
										(0, vue_exports.createVNode)("p", {
											id: "rf-ice-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(err("eu_ice_grip")), 1)
									], 8, ["aria-invalid"])]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "rf-eprel"
										}, "EPREL-Nummer"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											id: "rf-eprel",
											"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).eprel_id = $event,
											class: "input num rf-mid",
											type: "text",
											inputmode: "numeric",
											maxlength: "16",
											spellcheck: "false",
											autocomplete: "off",
											placeholder: "381090",
											readonly: readonly.value,
											"aria-invalid": err("eprel_id") ? "true" : void 0,
											"aria-describedby": "rf-eprel-help rf-eprel-err"
										}, null, 8, [
											"onUpdate:modelValue",
											"readonly",
											"aria-invalid"
										]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).eprel_id]]),
										(0, vue_exports.createVNode)("p", {
											id: "rf-eprel-help",
											class: "form-field__help"
										}, "Die Registriernummer des Reifens in der EU-Produktdatenbank EPREL. Der QR-Code auf dem Label öffnet seine EPREL-Seite, dort steht sie. Der Shop verlinkt das Label auf diese Seite."),
										(0, vue_exports.createVNode)("p", {
											id: "rf-eprel-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(err("eprel_id")), 1)
									])
								]), (0, vue_exports.createVNode)("div", { class: "rf-preview" }, [(0, vue_exports.createVNode)("p", { class: "rf-preview__head" }, "Vorschau"), preview.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(TyreLabel_default, (0, vue_exports.mergeProps)({ key: 0 }, preview.value), null, 16)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 1,
									class: "rf-preview__empty"
								}, "Die Vorschau erscheint, sobald Kraftstoffeffizienz, Nasshaftung, Rollgeräusch und Rollgeräuschklasse eingetragen sind."))])])
							]),
							(0, vue_exports.createVNode)("section", {
								class: "adm-section",
								"aria-labelledby": "rf-h-sale"
							}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "rf-h-sale",
								class: "adm-section__title"
							}, "Verkauf")]), (0, vue_exports.createVNode)("div", { class: "adm-fields" }, [(0, vue_exports.createVNode)("div", { class: "rf-row" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rf-price"
								}, "Preis je Reifen in €"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "rf-price",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).price = $event,
									class: "input num",
									type: "text",
									inputmode: "decimal",
									maxlength: "12",
									placeholder: "129,00",
									readonly: readonly.value,
									"aria-invalid": err("price") ? "true" : void 0,
									"aria-describedby": "rf-price-help rf-price-err"
								}, null, 8, [
									"onUpdate:modelValue",
									"readonly",
									"aria-invalid"
								]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).price]]),
								(0, vue_exports.createVNode)("p", {
									id: "rf-price-help",
									class: "form-field__help"
								}, "Mit Mehrwertsteuer, ohne Montage und Auswuchten."),
								(0, vue_exports.createVNode)("p", {
									id: "rf-price-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(err("price")), 1)
							]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rf-available"
								}, "Verfügbarkeit"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "rf-available",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).available = $event,
									class: "input",
									disabled: readonly.value,
									"aria-describedby": "rf-available-err"
								}, [(0, vue_exports.createVNode)("option", { value: true }, "Verfügbar"), (0, vue_exports.createVNode)("option", { value: false }, "Nicht verfügbar")], 8, ["onUpdate:modelValue", "disabled"]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(form).available]]),
								(0, vue_exports.createVNode)("p", {
									id: "rf-available-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(err("available")), 1)
							])])])])
						], 40, ["onSubmit"]),
						editable.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminSaveBar_default, {
							key: 3,
							editor: (0, vue_exports.unref)(editor)
						}, null, 8, ["editor"])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: removeOpen.value,
							"onUpdate:open": ($event) => removeOpen.value = $event,
							title: "Reifen entfernen?",
							body: "Der Shop bietet ihn danach nicht mehr an. Bestellungen, in denen er steht, behalten ihn.",
							"confirm-label": "Entfernen",
							busy: removing.value,
							onConfirm: remove
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
//#region resources/js/Pages/Admin/Reifen/Edit.vue
var _sfc_setup = Edit_vue_vue_type_script_setup_true_lang_default.setup;
Edit_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Reifen/Edit.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Edit_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Edit_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-348ea753"]]);
//#endregion
export { Edit_default as default };
