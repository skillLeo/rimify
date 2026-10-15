import { a as DropdownMenuRoot_default, i as DropdownMenuContent_default, n as DropdownMenuPortal_default, r as DropdownMenuItem_default, t as DropdownMenuTrigger_default } from "./DropdownMenuTrigger-DR2ieCu7.js";
import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-CzJXz77H.js";
import { t as DropdownMenuSeparator_default } from "./DropdownMenuSeparator-KcmMgHOf.js";
import { c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { t as AdminConfirm_default } from "./AdminConfirm-CJZtnwyX.js";
import { t as AdminState_default } from "./AdminState-QyYV7E7y.js";
import { t as MENU_ROOM } from "./menu-CcR9FXu6.js";
import { n as useFocusAfter } from "./useFocusAfter-B30tsjKa.js";
//#region resources/js/Pages/Admin/Marken/Index.vue?vue&type=script&setup=true&lang.ts
var BASE = "/admin/marken";
var LOGO_HINT = "SVG oder PNG/WebP mit transparentem Hintergrund, höchstens 1 MB. Die Markenwand zeichnet die Form des Logos in der Schriftfarbe des Shops.";
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		brands: {},
		nextSortOrder: {},
		can: {}
	},
	setup(__props) {
		/**
		* Katalog › Marken: every brand the shop knows, with its logo.
		*
		* A brand is created here, by the import or by the Felge form; its logo only here (MarkenController). The
		* brand wall on the homepage draws a logo as a shape in the shop's own ink, so a logo is an SVG or a PNG /
		* WebP with a transparent ground — the server reads the file and refuses anything else in a sentence under
		* the row it was sent from. One form serves a new brand and an existing one, like Zubehörpreise.
		*
		* The keyboard never falls to `<body>`: every action names where the focus goes next and useFocusAfter
		* puts it there once the page has settled (K2-03, K2-05, K2-11).
		*
		* Every write is authorised on the server (R-11); `can` only decides what is drawn.
		*/
		const props = __props;
		function blank() {
			return {
				name: "",
				isWheelBrand: true,
				sortOrder: props.nextSortOrder
			};
		}
		const page = usePage();
		const focus = useFocusAfter();
		const form = (0, vue_exports.reactive)(blank());
		const editing = (0, vue_exports.ref)(null);
		const sent = (0, vue_exports.ref)(false);
		const busy = (0, vue_exports.ref)(false);
		/** The row whose logo was just sent: only it shows the server's word about a logo. */
		const logoRow = (0, vue_exports.ref)(null);
		const confirming = (0, vue_exports.ref)(null);
		/** A row just created or changed: tinted once, so the eye finds it. */
		const fresh = (0, vue_exports.ref)(null);
		const bag = (0, vue_exports.computed)(() => {
			const raw = page.props.errors;
			return raw !== null && typeof raw === "object" ? raw : {};
		});
		const errors = (0, vue_exports.computed)(() => sent.value ? bag.value : {});
		const logoError = (0, vue_exports.computed)(() => bag.value.logo ?? "");
		/** Why a brand could not be removed — the Policy's own sentence (K2-16). */
		const brandError = (0, vue_exports.computed)(() => bag.value.brand ?? "");
		const spoken = (0, vue_exports.computed)(() => errors.value.name ?? errors.value.slug ?? errors.value.sortOrder ?? logoError.value);
		const canWrite = (0, vue_exports.computed)(() => props.can.create || props.can.update);
		const editingBrand = (0, vue_exports.computed)(() => props.brands.find((b) => b.id === editing.value) ?? null);
		const formTitle = (0, vue_exports.computed)(() => editingBrand.value === null ? "Neue Marke" : `Marke bearbeiten: ${editingBrand.value.name}`);
		const context = (0, vue_exports.computed)(() => {
			const total = props.brands.length;
			const onWall = props.brands.filter((b) => b.isWheelBrand).length;
			const withLogo = props.brands.filter((b) => b.logo !== null).length;
			return total === 0 ? "Noch keine Marke" : `${total} ${total === 1 ? "Marke" : "Marken"} · ${onWall} auf der Markenwand · ${withLogo} mit Logo`;
		});
		const confirmOpen = (0, vue_exports.computed)({
			get: () => confirming.value !== null,
			set: (open) => {
				if (!open) confirming.value = null;
			}
		});
		const more = (id) => `mk-more-${id}`;
		function reset() {
			Object.assign(form, blank());
			editing.value = null;
			sent.value = false;
		}
		/** „Abbrechen“: the form is new again, and the keyboard stays in it. */
		function cancel() {
			reset();
			focus.request("mk-name");
		}
		/** From a row's menu: the form, far above on a phone, is brought into view with the focus in Name (K2-05). */
		function edit(brand) {
			form.name = brand.name;
			form.isWheelBrand = brand.isWheelBrand;
			form.sortOrder = brand.sortOrder;
			editing.value = brand.id;
			sent.value = false;
			focus.request("mk-name", { scroll: true });
		}
		function submit() {
			sent.value = true;
			busy.value = true;
			const name = form.name.trim();
			const options = {
				preserveScroll: true,
				onSuccess: () => {
					reset();
					fresh.value = props.brands.find((b) => b.name === name)?.id ?? null;
				},
				onFinish: () => {
					busy.value = false;
					focus.request("mk-name");
				}
			};
			if (editing.value === null) router.post(BASE, { ...form }, options);
			else router.put(`${BASE}/${editing.value}`, { ...form }, options);
		}
		/** The brand whose manufacturer is being entered; its form opens below the list's head. */
		const manufacturing = (0, vue_exports.ref)(null);
		const maker = (0, vue_exports.reactive)({
			manufacturerName: "",
			manufacturerAddress: "",
			manufacturerContact: "",
			euResponsibleName: "",
			euResponsibleAddress: "",
			euResponsibleContact: "",
			safetyNote: ""
		});
		const makerSent = (0, vue_exports.ref)(false);
		const makerErrors = (0, vue_exports.computed)(() => makerSent.value ? bag.value : {});
		function editManufacturer(brand) {
			for (const key of Object.keys(maker)) maker[key] = brand.manufacturer[key] ?? "";
			manufacturing.value = brand;
			makerSent.value = false;
			focus.request("mk-maker-name", { scroll: true });
		}
		function closeManufacturer() {
			const id = manufacturing.value?.id;
			manufacturing.value = null;
			if (id !== void 0) focus.request(more(id));
		}
		function saveManufacturer() {
			const brand = manufacturing.value;
			if (brand === null) return;
			makerSent.value = true;
			busy.value = true;
			router.put(`${BASE}/${brand.id}/hersteller`, { ...maker }, {
				preserveScroll: true,
				onSuccess: () => {
					fresh.value = brand.id;
					closeManufacturer();
				},
				onFinish: () => {
					busy.value = false;
				}
			});
		}
		function upload(brand, event) {
			const input = event.target;
			const file = input.files?.[0];
			if (file === void 0) return;
			logoRow.value = brand.id;
			busy.value = true;
			router.post(`${BASE}/${brand.id}/logo`, { logo: file }, {
				forceFormData: true,
				preserveScroll: true,
				onSuccess: () => {
					fresh.value = brand.id;
				},
				onFinish: () => {
					busy.value = false;
					input.value = "";
					focus.request(more(brand.id));
				}
			});
		}
		function removeLogo(brand) {
			logoRow.value = brand.id;
			busy.value = true;
			router.delete(`${BASE}/${brand.id}/logo`, {
				preserveScroll: true,
				onFinish: () => {
					busy.value = false;
					focus.request(more(brand.id));
				}
			});
		}
		function remove() {
			const brand = confirming.value;
			if (brand === null) return;
			const index = props.brands.findIndex((b) => b.id === brand.id);
			const targets = [props.brands[index + 1]?.id, props.brands[index - 1]?.id].filter((id) => id !== void 0).map(more);
			busy.value = true;
			router.delete(`${BASE}/${brand.id}`, {
				preserveScroll: true,
				onSuccess: () => {
					confirming.value = null;
					focus.request([
						...targets,
						"mk-name",
						"mk-list-title"
					]);
					if (editing.value === brand.id) reset();
				},
				onError: () => {
					confirming.value = null;
					focus.request(more(brand.id));
				},
				onFinish: () => {
					busy.value = false;
				}
			});
		}
		/** A brand that carries nothing — not even a removed Felge — may go; the server says the same (BrandPolicy). */
		function mayRemove(brand) {
			return props.can.delete && brand.wheels === 0 && brand.removedWheels === 0 && brand.tyres === 0;
		}
		function hasMenu(brand) {
			return props.can.update || mayRemove(brand);
		}
		/** The menu closes and hands the focus back to its trigger; the row's own picker opens then. */
		function pickLogo(brand) {
			window.setTimeout(() => document.getElementById(`mk-file-${brand.id}`)?.click(), 0);
		}
		function counts(brand) {
			const parts = [brand.wheels === 1 ? "1 Felge" : `${brand.wheels} Felgen`];
			if (brand.removedWheels > 0) parts.push(brand.removedWheels === 1 ? "1 entfernte Felge" : `${brand.removedWheels} entfernte Felgen`);
			if (brand.tyres > 0) parts.push(brand.tyres === 1 ? "1 Reifen" : `${brand.tyres} Reifen`);
			return parts.join(" · ");
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Marken",
				context: context.value,
				"read-only": !canWrite.value
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="adm-note mk__lead" data-v-ab440ed6${_scopeId}> Eine Marke entsteht hier, beim Import oder beim Anlegen einer Felge. Ein Logo lädst du nur hier hoch. Marken mit Häkchen „Markenwand“ stehen auf der Startseite – als Link erst, wenn sie eine Felge auf Lager haben. </p>`);
						if (canWrite.value && !manufacturing.value) {
							_push(`<section class="adm-section" aria-labelledby="mk-form-title" data-v-ab440ed6${_scopeId}><form class="mk__form"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-ab440ed6${_scopeId}><div class="adm-section__head" data-v-ab440ed6${_scopeId}><h2 id="mk-form-title" class="adm-section__title" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(formTitle.value)}</h2></div><div class="adm-fields" data-v-ab440ed6${_scopeId}><div class="form-field" data-v-ab440ed6${_scopeId}><label class="form-field__label" for="mk-name" data-v-ab440ed6${_scopeId}>Name</label><input id="mk-name"${(0, server_renderer_exports.ssrRenderAttr)("value", form.name)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": errors.value.name || errors.value.slug }, "input"])}" type="text" maxlength="60" autocomplete="off" aria-required="true" aria-describedby="mk-name-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.name || errors.value.slug ? "true" : void 0)} data-v-ab440ed6${_scopeId}><p id="mk-name-err" class="form-field__error" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.name ?? errors.value.slug ?? "")}</p></div><div class="form-field" data-v-ab440ed6${_scopeId}><label class="form-field__label" for="mk-sort" data-v-ab440ed6${_scopeId}>Position auf der Markenwand</label><input id="mk-sort"${(0, server_renderer_exports.ssrRenderAttr)("value", form.sortOrder)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": errors.value.sortOrder }, "input mk__num"])}" type="number" min="0" max="9999" step="1" aria-describedby="mk-sort-help mk-sort-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.sortOrder ? "true" : void 0)} data-v-ab440ed6${_scopeId}><p id="mk-sort-help" class="form-field__help" data-v-ab440ed6${_scopeId}>Kleinere Zahlen stehen weiter vorn. Eine neue Marke steht am Ende.</p><p id="mk-sort-err" class="form-field__error" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.sortOrder ?? "")}</p></div><div class="adm-fields__checks" data-v-ab440ed6${_scopeId}><label class="check" data-v-ab440ed6${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.isWheelBrand) ? (0, server_renderer_exports.ssrLooseContain)(form.isWheelBrand, null) : form.isWheelBrand) ? " checked" : ""} type="checkbox" data-v-ab440ed6${_scopeId}> Felgenmarke – auf der Markenwand zeigen </label></div></div><div class="adm-fields__actions" data-v-ab440ed6${_scopeId}><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(editing.value === null ? "Marke anlegen" : "Änderungen speichern")}</button>`);
							if (editing.value !== null) _push(`<button class="btn btn--secondary" type="button" data-v-ab440ed6${_scopeId}>Abbrechen</button>`);
							else _push(`<!---->`);
							_push(`</div></form></section>`);
						} else _push(`<!---->`);
						if (manufacturing.value) _push(`<section class="adm-section" aria-labelledby="mk-maker-title" data-v-ab440ed6${_scopeId}><form class="mk__form"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-ab440ed6${_scopeId}><div class="adm-section__head" data-v-ab440ed6${_scopeId}><h2 id="mk-maker-title" class="adm-section__title" data-v-ab440ed6${_scopeId}>Herstellerangaben: ${(0, server_renderer_exports.ssrInterpolate)(manufacturing.value.name)}</h2></div><p class="form-field__help mk__hint" data-v-ab440ed6${_scopeId}> Die Allgemeine Produktsicherheitsverordnung (GPSR) verlangt sie auf jeder Produktseite: Name, Postanschrift und elektronische Adresse des Herstellers – so, wie er sie selbst angibt. Sitzt er außerhalb der EU, dazu die verantwortliche Person in der EU. Leer bleibt leer: der Shop ergänzt nichts. </p><div class="adm-fields" data-v-ab440ed6${_scopeId}><div class="form-field" data-v-ab440ed6${_scopeId}><label class="form-field__label" for="mk-maker-name" data-v-ab440ed6${_scopeId}>Hersteller</label><input id="mk-maker-name"${(0, server_renderer_exports.ssrRenderAttr)("value", maker.manufacturerName)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": makerErrors.value.manufacturerName }, "input"])}" type="text" maxlength="190" autocomplete="off" aria-describedby="mk-maker-name-err" data-v-ab440ed6${_scopeId}><p id="mk-maker-name-err" class="form-field__error" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(makerErrors.value.manufacturerName ?? "")}</p></div><div class="form-field" data-v-ab440ed6${_scopeId}><label class="form-field__label" for="mk-maker-address" data-v-ab440ed6${_scopeId}>Postanschrift</label><textarea id="mk-maker-address" class="input" rows="3" maxlength="500" aria-describedby="mk-maker-address-err" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(maker.manufacturerAddress)}</textarea><p id="mk-maker-address-err" class="form-field__error" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(makerErrors.value.manufacturerAddress ?? "")}</p></div><div class="form-field" data-v-ab440ed6${_scopeId}><label class="form-field__label" for="mk-maker-contact" data-v-ab440ed6${_scopeId}>Kontakt</label><input id="mk-maker-contact"${(0, server_renderer_exports.ssrRenderAttr)("value", maker.manufacturerContact)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": makerErrors.value.manufacturerContact }, "input"])}" type="text" inputmode="email" maxlength="190" autocomplete="off" aria-describedby="mk-maker-contact-help mk-maker-contact-err" data-v-ab440ed6${_scopeId}><p id="mk-maker-contact-help" class="form-field__help" data-v-ab440ed6${_scopeId}>Eine E-Mail-Adresse oder eine Webadresse mit https://.</p><p id="mk-maker-contact-err" class="form-field__error" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(makerErrors.value.manufacturerContact ?? "")}</p></div><fieldset class="mk__fieldset" data-v-ab440ed6${_scopeId}><legend class="mk__legend" data-v-ab440ed6${_scopeId}>Verantwortliche Person in der EU</legend><p class="form-field__help" data-v-ab440ed6${_scopeId}>Nur nötig, wenn der Hersteller außerhalb der EU sitzt.</p><div class="form-field" data-v-ab440ed6${_scopeId}><label class="form-field__label" for="mk-eu-name" data-v-ab440ed6${_scopeId}>Name</label><input id="mk-eu-name"${(0, server_renderer_exports.ssrRenderAttr)("value", maker.euResponsibleName)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": makerErrors.value.euResponsibleName }, "input"])}" type="text" maxlength="190" autocomplete="off" aria-describedby="mk-eu-name-err" data-v-ab440ed6${_scopeId}><p id="mk-eu-name-err" class="form-field__error" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(makerErrors.value.euResponsibleName ?? "")}</p></div><div class="form-field" data-v-ab440ed6${_scopeId}><label class="form-field__label" for="mk-eu-address" data-v-ab440ed6${_scopeId}>Postanschrift</label><textarea id="mk-eu-address" class="input" rows="3" maxlength="500" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(maker.euResponsibleAddress)}</textarea></div><div class="form-field" data-v-ab440ed6${_scopeId}><label class="form-field__label" for="mk-eu-contact" data-v-ab440ed6${_scopeId}>Kontakt</label><input id="mk-eu-contact"${(0, server_renderer_exports.ssrRenderAttr)("value", maker.euResponsibleContact)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": makerErrors.value.euResponsibleContact }, "input"])}" type="text" maxlength="190" autocomplete="off" aria-describedby="mk-eu-contact-err" data-v-ab440ed6${_scopeId}><p id="mk-eu-contact-err" class="form-field__error" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(makerErrors.value.euResponsibleContact ?? "")}</p></div></fieldset><div class="form-field" data-v-ab440ed6${_scopeId}><label class="form-field__label" for="mk-safety" data-v-ab440ed6${_scopeId}>Sicherheitshinweise des Herstellers</label><textarea id="mk-safety" class="input" rows="4" maxlength="4000" aria-describedby="mk-safety-help" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(maker.safetyNote)}</textarea><p id="mk-safety-help" class="form-field__help" data-v-ab440ed6${_scopeId}>Auf Deutsch, wie der Hersteller sie gibt – etwa zur Montage. Die Produktseite zeigt sie unter „Hersteller und Produktsicherheit“.</p></div></div><div class="adm-fields__actions" data-v-ab440ed6${_scopeId}><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-ab440ed6${_scopeId}>Herstellerangaben speichern</button><button class="btn btn--secondary" type="button" data-v-ab440ed6${_scopeId}>Abbrechen</button></div></form></section>`);
						else _push(`<!---->`);
						_push(`<section class="adm-section" aria-labelledby="mk-list-title" data-v-ab440ed6${_scopeId}><div class="adm-section__head" data-v-ab440ed6${_scopeId}><h2 id="mk-list-title" class="adm-section__title mk__list-title" tabindex="-1" data-v-ab440ed6${_scopeId}>Marken</h2></div><p class="form-field__help mk__hint" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(LOGO_HINT)}</p>`);
						if (brandError.value) _push(`<p class="adm-alert" role="alert" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(brandError.value)}</p>`);
						else _push(`<!---->`);
						if (__props.brands.length > 0) {
							_push(`<div class="adm-panel" data-v-ab440ed6${_scopeId}><table class="adm-table mk__table" data-v-ab440ed6${_scopeId}><thead data-v-ab440ed6${_scopeId}><tr data-v-ab440ed6${_scopeId}><th scope="col" data-v-ab440ed6${_scopeId}>Marke</th><th scope="col" data-v-ab440ed6${_scopeId}>Logo</th><th scope="col" data-v-ab440ed6${_scopeId}>Markenwand</th><th scope="col" class="num" data-v-ab440ed6${_scopeId}>Position</th><th scope="col" data-v-ab440ed6${_scopeId}>Im Katalog</th><th scope="col" data-v-ab440ed6${_scopeId}>Hersteller (GPSR)</th>`);
							if (__props.can.update || __props.can.delete) _push(`<th scope="col" data-v-ab440ed6${_scopeId}><span class="visually-hidden" data-v-ab440ed6${_scopeId}>Aktionen</span></th>`);
							else _push(`<!---->`);
							_push(`</tr></thead><tbody data-v-ab440ed6${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.brands, (brand) => {
								_push(`<tr class="${(0, server_renderer_exports.ssrRenderClass)({ "adm-row--fresh": fresh.value === brand.id })}"${(0, server_renderer_exports.ssrRenderAttr)("aria-current", editing.value === brand.id ? "true" : void 0)} data-v-ab440ed6${_scopeId}><td data-label="Marke" data-v-ab440ed6${_scopeId}><span class="adm-table__key" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(brand.name)}</span><span class="adm-table__sub" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(brand.slug)}</span>`);
								if (logoRow.value === brand.id && logoError.value) _push(`<p class="form-field__error mk__row-error" role="alert" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(logoError.value)}</p>`);
								else _push(`<!---->`);
								_push(`</td><td data-label="Logo" data-v-ab440ed6${_scopeId}><span class="mk__logo" data-v-ab440ed6${_scopeId}>`);
								if (brand.logo) _push(`<img${(0, server_renderer_exports.ssrRenderAttr)("src", brand.logo.url)}${(0, server_renderer_exports.ssrRenderAttr)("alt", `Logo ${brand.name}`)} width="96"${(0, server_renderer_exports.ssrRenderAttr)("height", Math.round(96 / brand.logo.aspect))} data-v-ab440ed6${_scopeId}>`);
								else if (brand.logoBroken) _push(`<span class="adm-tag adm-tag--warn" data-v-ab440ed6${_scopeId}>Datei fehlt</span>`);
								else _push(`<span class="mk__none" data-v-ab440ed6${_scopeId}>kein Logo</span>`);
								_push(`</span></td><td data-label="Markenwand" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(brand.isWheelBrand ? "Ja" : "Nein")}</td><td data-label="Position" data-phone="hide" class="num" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(brand.sortOrder)}</td><td data-label="Im Katalog" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(counts(brand))}</td><td data-label="Hersteller (GPSR)" data-v-ab440ed6${_scopeId}>`);
								if (brand.manufacturerComplete) _push(`<span data-v-ab440ed6${_scopeId}>Angegeben</span>`);
								else if (brand.wheels > 0) _push(`<span class="adm-tag adm-tag--warn" data-v-ab440ed6${_scopeId}>Fehlt</span>`);
								else _push(`<span class="mk__none" data-v-ab440ed6${_scopeId}>–</span>`);
								_push(`</td>`);
								if (__props.can.update || __props.can.delete) {
									_push(`<td data-label="Aktionen" data-phone="menu" class="mk__actions" data-v-ab440ed6${_scopeId}>`);
									if (__props.can.update) _push(`<input${(0, server_renderer_exports.ssrRenderAttr)("id", `mk-file-${brand.id}`)} class="visually-hidden" type="file" tabindex="-1" aria-hidden="true" accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-ab440ed6${_scopeId}>`);
									else _push(`<!---->`);
									if (hasMenu(brand)) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) {
												_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
													"data-focus": more(brand.id),
													class: "adm-iconbtn",
													disabled: busy.value,
													"aria-label": `Aktionen für ${brand.name}`
												}, {
													default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
														if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
															name: "more",
															size: 20
														}, null, _parent, _scopeId));
														else return [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "more",
															size: 20
														})];
													}),
													_: 2
												}, _parent, _scopeId));
												_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
													default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
														if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuContent_default), {
															class: "adm-menu",
															align: "end",
															"side-offset": 4,
															"collision-padding": (0, vue_exports.unref)(MENU_ROOM),
															onCloseAutoFocus: (0, vue_exports.unref)(focus).onMenuClose
														}, {
															default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																if (_push) {
																	if (__props.can.update) {
																		_push(`<!--[-->`);
																		_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																			class: "adm-menu__item",
																			onSelect: ($event) => edit(brand)
																		}, {
																			default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																				if (_push) {
																					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																						name: "edit",
																						size: 20
																					}, null, _parent, _scopeId));
																					_push(` Bearbeiten `);
																				} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																					name: "edit",
																					size: 20
																				}), (0, vue_exports.createTextVNode)(" Bearbeiten ")];
																			}),
																			_: 2
																		}, _parent, _scopeId));
																		_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																			class: "adm-menu__item",
																			onSelect: ($event) => editManufacturer(brand)
																		}, {
																			default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																				if (_push) {
																					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																						name: "shield",
																						size: 20
																					}, null, _parent, _scopeId));
																					_push(` Herstellerangaben `);
																				} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																					name: "shield",
																					size: 20
																				}), (0, vue_exports.createTextVNode)(" Herstellerangaben ")];
																			}),
																			_: 2
																		}, _parent, _scopeId));
																		_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																			class: "adm-menu__item",
																			onSelect: ($event) => pickLogo(brand)
																		}, {
																			default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																				if (_push) {
																					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																						name: "media",
																						size: 20
																					}, null, _parent, _scopeId));
																					_push(` ${(0, server_renderer_exports.ssrInterpolate)(brand.logo ? "Logo ersetzen" : "Logo hochladen")}`);
																				} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																					name: "media",
																					size: 20
																				}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(brand.logo ? "Logo ersetzen" : "Logo hochladen"), 1)];
																			}),
																			_: 2
																		}, _parent, _scopeId));
																		if (brand.logo) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																			class: "adm-menu__item",
																			onSelect: ($event) => removeLogo(brand)
																		}, {
																			default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																				if (_push) {
																					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																						name: "close",
																						size: 20
																					}, null, _parent, _scopeId));
																					_push(` Logo entfernen `);
																				} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																					name: "close",
																					size: 20
																				}), (0, vue_exports.createTextVNode)(" Logo entfernen ")];
																			}),
																			_: 2
																		}, _parent, _scopeId));
																		else _push(`<!---->`);
																		_push(`<!--]-->`);
																	} else _push(`<!---->`);
																	if (mayRemove(brand)) {
																		_push(`<!--[-->`);
																		if (__props.can.update) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }, null, _parent, _scopeId));
																		else _push(`<!---->`);
																		_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																			class: "adm-menu__item adm-menu__item--danger",
																			onSelect: ($event) => confirming.value = brand
																		}, {
																			default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																				if (_push) {
																					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																						name: "delete",
																						size: 20
																					}, null, _parent, _scopeId));
																					_push(` Entfernen `);
																				} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																					name: "delete",
																					size: 20
																				}), (0, vue_exports.createTextVNode)(" Entfernen ")];
																			}),
																			_: 2
																		}, _parent, _scopeId));
																		_push(`<!--]-->`);
																	} else _push(`<!---->`);
																} else return [__props.can.update ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [
																	(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item",
																		onSelect: ($event) => edit(brand)
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "edit",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" Bearbeiten ")]),
																		_: 1
																	}, 8, ["onSelect"]),
																	(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item",
																		onSelect: ($event) => editManufacturer(brand)
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "shield",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" Herstellerangaben ")]),
																		_: 1
																	}, 8, ["onSelect"]),
																	(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item",
																		onSelect: ($event) => pickLogo(brand)
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "media",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(brand.logo ? "Logo ersetzen" : "Logo hochladen"), 1)]),
																		_: 2
																	}, 1032, ["onSelect"]),
																	brand.logo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		key: 0,
																		class: "adm-menu__item",
																		onSelect: ($event) => removeLogo(brand)
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "close",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" Logo entfernen ")]),
																		_: 1
																	}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true)
																], 64)) : (0, vue_exports.createCommentVNode)("", true), mayRemove(brand) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [__props.can.update ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuSeparator_default), {
																	key: 0,
																	class: "adm-menu__sep"
																})) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	class: "adm-menu__item adm-menu__item--danger",
																	onSelect: ($event) => confirming.value = brand
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "delete",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
																	_: 1
																}, 8, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true)];
															}),
															_: 2
														}, _parent, _scopeId));
														else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
															class: "adm-menu",
															align: "end",
															"side-offset": 4,
															"collision-padding": (0, vue_exports.unref)(MENU_ROOM),
															onCloseAutoFocus: (0, vue_exports.unref)(focus).onMenuClose
														}, {
															default: (0, vue_exports.withCtx)(() => [__props.can.update ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [
																(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	class: "adm-menu__item",
																	onSelect: ($event) => edit(brand)
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "edit",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Bearbeiten ")]),
																	_: 1
																}, 8, ["onSelect"]),
																(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	class: "adm-menu__item",
																	onSelect: ($event) => editManufacturer(brand)
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "shield",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Herstellerangaben ")]),
																	_: 1
																}, 8, ["onSelect"]),
																(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	class: "adm-menu__item",
																	onSelect: ($event) => pickLogo(brand)
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "media",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(brand.logo ? "Logo ersetzen" : "Logo hochladen"), 1)]),
																	_: 2
																}, 1032, ["onSelect"]),
																brand.logo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	key: 0,
																	class: "adm-menu__item",
																	onSelect: ($event) => removeLogo(brand)
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "close",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Logo entfernen ")]),
																	_: 1
																}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true)
															], 64)) : (0, vue_exports.createCommentVNode)("", true), mayRemove(brand) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [__props.can.update ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuSeparator_default), {
																key: 0,
																class: "adm-menu__sep"
															})) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																class: "adm-menu__item adm-menu__item--danger",
																onSelect: ($event) => confirming.value = brand
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "delete",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
																_: 1
															}, 8, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true)]),
															_: 2
														}, 1032, ["collision-padding", "onCloseAutoFocus"])];
													}),
													_: 2
												}, _parent, _scopeId));
											} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
												"data-focus": more(brand.id),
												class: "adm-iconbtn",
												disabled: busy.value,
												"aria-label": `Aktionen für ${brand.name}`
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "more",
													size: 20
												})]),
												_: 1
											}, 8, [
												"data-focus",
												"disabled",
												"aria-label"
											]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
													class: "adm-menu",
													align: "end",
													"side-offset": 4,
													"collision-padding": (0, vue_exports.unref)(MENU_ROOM),
													onCloseAutoFocus: (0, vue_exports.unref)(focus).onMenuClose
												}, {
													default: (0, vue_exports.withCtx)(() => [__props.can.update ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [
														(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
															class: "adm-menu__item",
															onSelect: ($event) => edit(brand)
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "edit",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Bearbeiten ")]),
															_: 1
														}, 8, ["onSelect"]),
														(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
															class: "adm-menu__item",
															onSelect: ($event) => editManufacturer(brand)
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "shield",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Herstellerangaben ")]),
															_: 1
														}, 8, ["onSelect"]),
														(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
															class: "adm-menu__item",
															onSelect: ($event) => pickLogo(brand)
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "media",
																size: 20
															}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(brand.logo ? "Logo ersetzen" : "Logo hochladen"), 1)]),
															_: 2
														}, 1032, ["onSelect"]),
														brand.logo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
															key: 0,
															class: "adm-menu__item",
															onSelect: ($event) => removeLogo(brand)
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "close",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Logo entfernen ")]),
															_: 1
														}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true)
													], 64)) : (0, vue_exports.createCommentVNode)("", true), mayRemove(brand) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [__props.can.update ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuSeparator_default), {
														key: 0,
														class: "adm-menu__sep"
													})) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item adm-menu__item--danger",
														onSelect: ($event) => confirming.value = brand
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "delete",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
														_: 1
													}, 8, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true)]),
													_: 2
												}, 1032, ["collision-padding", "onCloseAutoFocus"])]),
												_: 2
											}, 1024)];
										}),
										_: 2
									}, _parent, _scopeId));
									else _push(`<!---->`);
									_push(`</td>`);
								} else _push(`<!---->`);
								_push(`</tr>`);
							});
							_push(`<!--]--></tbody></table></div>`);
						} else _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Noch keine Marke. Marken entstehen hier, beim Import einer Lieferantendatei oder beim Anlegen einer Felge."
						}, null, _parent, _scopeId));
						_push(`</section><p class="visually-hidden" aria-live="assertive" data-v-ab440ed6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(spoken.value)}</p>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: confirmOpen.value,
							"onUpdate:open": ($event) => confirmOpen.value = $event,
							title: `Marke „${confirming.value?.name ?? ""}“ entfernen?`,
							body: "Sie führt keine Felge und keinen Reifen mehr. Das Protokoll hält fest, wer sie entfernt hat.",
							"confirm-label": "Entfernen",
							busy: busy.value,
							onConfirm: remove
						}, null, _parent, _scopeId));
					} else return [
						(0, vue_exports.createVNode)("p", { class: "adm-note mk__lead" }, " Eine Marke entsteht hier, beim Import oder beim Anlegen einer Felge. Ein Logo lädst du nur hier hoch. Marken mit Häkchen „Markenwand“ stehen auf der Startseite – als Link erst, wenn sie eine Felge auf Lager haben. "),
						canWrite.value && !manufacturing.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 0,
							class: "adm-section",
							"aria-labelledby": "mk-form-title"
						}, [(0, vue_exports.createVNode)("form", {
							class: "mk__form",
							"aria-busy": busy.value ? "true" : void 0,
							onSubmit: (0, vue_exports.withModifiers)(submit, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "mk-form-title",
								class: "adm-section__title"
							}, (0, vue_exports.toDisplayString)(formTitle.value), 1)]),
							(0, vue_exports.createVNode)("div", { class: "adm-fields" }, [
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "mk-name"
									}, "Name"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "mk-name",
										"onUpdate:modelValue": ($event) => form.name = $event,
										class: ["input", { "input--error": errors.value.name || errors.value.slug }],
										type: "text",
										maxlength: "60",
										autocomplete: "off",
										"aria-required": "true",
										"aria-describedby": "mk-name-err",
										"aria-invalid": errors.value.name || errors.value.slug ? "true" : void 0
									}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, form.name]]),
									(0, vue_exports.createVNode)("p", {
										id: "mk-name-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(errors.value.name ?? errors.value.slug ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "mk-sort"
									}, "Position auf der Markenwand"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "mk-sort",
										"onUpdate:modelValue": ($event) => form.sortOrder = $event,
										class: ["input mk__num", { "input--error": errors.value.sortOrder }],
										type: "number",
										min: "0",
										max: "9999",
										step: "1",
										"aria-describedby": "mk-sort-help mk-sort-err",
										"aria-invalid": errors.value.sortOrder ? "true" : void 0
									}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[
										vue_exports.vModelText,
										form.sortOrder,
										void 0,
										{ number: true }
									]]),
									(0, vue_exports.createVNode)("p", {
										id: "mk-sort-help",
										class: "form-field__help"
									}, "Kleinere Zahlen stehen weiter vorn. Eine neue Marke steht am Ende."),
									(0, vue_exports.createVNode)("p", {
										id: "mk-sort-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(errors.value.sortOrder ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "adm-fields__checks" }, [(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									"onUpdate:modelValue": ($event) => form.isWheelBrand = $event,
									type: "checkbox"
								}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelCheckbox, form.isWheelBrand]]), (0, vue_exports.createTextVNode)(" Felgenmarke – auf der Markenwand zeigen ")])])
							]),
							(0, vue_exports.createVNode)("div", { class: "adm-fields__actions" }, [(0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "submit",
								disabled: busy.value
							}, (0, vue_exports.toDisplayString)(editing.value === null ? "Marke anlegen" : "Änderungen speichern"), 9, ["disabled"]), editing.value !== null ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
								key: 0,
								class: "btn btn--secondary",
								type: "button",
								onClick: cancel
							}, "Abbrechen")) : (0, vue_exports.createCommentVNode)("", true)])
						], 40, ["aria-busy"])])) : (0, vue_exports.createCommentVNode)("", true),
						manufacturing.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 1,
							class: "adm-section",
							"aria-labelledby": "mk-maker-title"
						}, [(0, vue_exports.createVNode)("form", {
							class: "mk__form",
							"aria-busy": busy.value ? "true" : void 0,
							onSubmit: (0, vue_exports.withModifiers)(saveManufacturer, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "mk-maker-title",
								class: "adm-section__title"
							}, "Herstellerangaben: " + (0, vue_exports.toDisplayString)(manufacturing.value.name), 1)]),
							(0, vue_exports.createVNode)("p", { class: "form-field__help mk__hint" }, " Die Allgemeine Produktsicherheitsverordnung (GPSR) verlangt sie auf jeder Produktseite: Name, Postanschrift und elektronische Adresse des Herstellers – so, wie er sie selbst angibt. Sitzt er außerhalb der EU, dazu die verantwortliche Person in der EU. Leer bleibt leer: der Shop ergänzt nichts. "),
							(0, vue_exports.createVNode)("div", { class: "adm-fields" }, [
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "mk-maker-name"
									}, "Hersteller"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "mk-maker-name",
										"onUpdate:modelValue": ($event) => maker.manufacturerName = $event,
										class: ["input", { "input--error": makerErrors.value.manufacturerName }],
										type: "text",
										maxlength: "190",
										autocomplete: "off",
										"aria-describedby": "mk-maker-name-err"
									}, null, 10, ["onUpdate:modelValue"]), [[vue_exports.vModelText, maker.manufacturerName]]),
									(0, vue_exports.createVNode)("p", {
										id: "mk-maker-name-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(makerErrors.value.manufacturerName ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "mk-maker-address"
									}, "Postanschrift"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("textarea", {
										id: "mk-maker-address",
										"onUpdate:modelValue": ($event) => maker.manufacturerAddress = $event,
										class: "input",
										rows: "3",
										maxlength: "500",
										"aria-describedby": "mk-maker-address-err"
									}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, maker.manufacturerAddress]]),
									(0, vue_exports.createVNode)("p", {
										id: "mk-maker-address-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(makerErrors.value.manufacturerAddress ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "mk-maker-contact"
									}, "Kontakt"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "mk-maker-contact",
										"onUpdate:modelValue": ($event) => maker.manufacturerContact = $event,
										class: ["input", { "input--error": makerErrors.value.manufacturerContact }],
										type: "text",
										inputmode: "email",
										maxlength: "190",
										autocomplete: "off",
										"aria-describedby": "mk-maker-contact-help mk-maker-contact-err"
									}, null, 10, ["onUpdate:modelValue"]), [[vue_exports.vModelText, maker.manufacturerContact]]),
									(0, vue_exports.createVNode)("p", {
										id: "mk-maker-contact-help",
										class: "form-field__help"
									}, "Eine E-Mail-Adresse oder eine Webadresse mit https://."),
									(0, vue_exports.createVNode)("p", {
										id: "mk-maker-contact-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(makerErrors.value.manufacturerContact ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("fieldset", { class: "mk__fieldset" }, [
									(0, vue_exports.createVNode)("legend", { class: "mk__legend" }, "Verantwortliche Person in der EU"),
									(0, vue_exports.createVNode)("p", { class: "form-field__help" }, "Nur nötig, wenn der Hersteller außerhalb der EU sitzt."),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "mk-eu-name"
										}, "Name"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											id: "mk-eu-name",
											"onUpdate:modelValue": ($event) => maker.euResponsibleName = $event,
											class: ["input", { "input--error": makerErrors.value.euResponsibleName }],
											type: "text",
											maxlength: "190",
											autocomplete: "off",
											"aria-describedby": "mk-eu-name-err"
										}, null, 10, ["onUpdate:modelValue"]), [[vue_exports.vModelText, maker.euResponsibleName]]),
										(0, vue_exports.createVNode)("p", {
											id: "mk-eu-name-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(makerErrors.value.euResponsibleName ?? ""), 1)
									]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "mk-eu-address"
									}, "Postanschrift"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("textarea", {
										id: "mk-eu-address",
										"onUpdate:modelValue": ($event) => maker.euResponsibleAddress = $event,
										class: "input",
										rows: "3",
										maxlength: "500"
									}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, maker.euResponsibleAddress]])]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "mk-eu-contact"
										}, "Kontakt"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											id: "mk-eu-contact",
											"onUpdate:modelValue": ($event) => maker.euResponsibleContact = $event,
											class: ["input", { "input--error": makerErrors.value.euResponsibleContact }],
											type: "text",
											maxlength: "190",
											autocomplete: "off",
											"aria-describedby": "mk-eu-contact-err"
										}, null, 10, ["onUpdate:modelValue"]), [[vue_exports.vModelText, maker.euResponsibleContact]]),
										(0, vue_exports.createVNode)("p", {
											id: "mk-eu-contact-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(makerErrors.value.euResponsibleContact ?? ""), 1)
									])
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "mk-safety"
									}, "Sicherheitshinweise des Herstellers"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("textarea", {
										id: "mk-safety",
										"onUpdate:modelValue": ($event) => maker.safetyNote = $event,
										class: "input",
										rows: "4",
										maxlength: "4000",
										"aria-describedby": "mk-safety-help"
									}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, maker.safetyNote]]),
									(0, vue_exports.createVNode)("p", {
										id: "mk-safety-help",
										class: "form-field__help"
									}, "Auf Deutsch, wie der Hersteller sie gibt – etwa zur Montage. Die Produktseite zeigt sie unter „Hersteller und Produktsicherheit“.")
								])
							]),
							(0, vue_exports.createVNode)("div", { class: "adm-fields__actions" }, [(0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "submit",
								disabled: busy.value
							}, "Herstellerangaben speichern", 8, ["disabled"]), (0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "button",
								onClick: closeManufacturer
							}, "Abbrechen")])
						], 40, ["aria-busy"])])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "mk-list-title"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "mk-list-title",
								class: "adm-section__title mk__list-title",
								tabindex: "-1"
							}, "Marken")]),
							(0, vue_exports.createVNode)("p", { class: "form-field__help mk__hint" }, (0, vue_exports.toDisplayString)(LOGO_HINT)),
							brandError.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-alert",
								role: "alert"
							}, (0, vue_exports.toDisplayString)(brandError.value), 1)) : (0, vue_exports.createCommentVNode)("", true),
							__props.brands.length > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 1,
								class: "adm-panel"
							}, [(0, vue_exports.createVNode)("table", { class: "adm-table mk__table" }, [(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Marke"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Logo"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Markenwand"),
								(0, vue_exports.createVNode)("th", {
									scope: "col",
									class: "num"
								}, "Position"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Im Katalog"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Hersteller (GPSR)"),
								__props.can.update || __props.can.delete ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("th", {
									key: 0,
									scope: "col"
								}, [(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, "Aktionen")])) : (0, vue_exports.createCommentVNode)("", true)
							])]), (0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.brands, (brand) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", {
									key: brand.id,
									class: { "adm-row--fresh": fresh.value === brand.id },
									"aria-current": editing.value === brand.id ? "true" : void 0,
									onAnimationend: ($event) => fresh.value = null
								}, [
									(0, vue_exports.createVNode)("td", { "data-label": "Marke" }, [
										(0, vue_exports.createVNode)("span", { class: "adm-table__key" }, (0, vue_exports.toDisplayString)(brand.name), 1),
										(0, vue_exports.createVNode)("span", { class: "adm-table__sub" }, (0, vue_exports.toDisplayString)(brand.slug), 1),
										logoRow.value === brand.id && logoError.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 0,
											class: "form-field__error mk__row-error",
											role: "alert"
										}, (0, vue_exports.toDisplayString)(logoError.value), 1)) : (0, vue_exports.createCommentVNode)("", true)
									]),
									(0, vue_exports.createVNode)("td", { "data-label": "Logo" }, [(0, vue_exports.createVNode)("span", { class: "mk__logo" }, [brand.logo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("img", {
										key: 0,
										src: brand.logo.url,
										alt: `Logo ${brand.name}`,
										width: "96",
										height: Math.round(96 / brand.logo.aspect)
									}, null, 8, [
										"src",
										"alt",
										"height"
									])) : brand.logoBroken ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 1,
										class: "adm-tag adm-tag--warn"
									}, "Datei fehlt")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 2,
										class: "mk__none"
									}, "kein Logo"))])]),
									(0, vue_exports.createVNode)("td", { "data-label": "Markenwand" }, (0, vue_exports.toDisplayString)(brand.isWheelBrand ? "Ja" : "Nein"), 1),
									(0, vue_exports.createVNode)("td", {
										"data-label": "Position",
										"data-phone": "hide",
										class: "num"
									}, (0, vue_exports.toDisplayString)(brand.sortOrder), 1),
									(0, vue_exports.createVNode)("td", { "data-label": "Im Katalog" }, (0, vue_exports.toDisplayString)(counts(brand)), 1),
									(0, vue_exports.createVNode)("td", { "data-label": "Hersteller (GPSR)" }, [brand.manufacturerComplete ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 0 }, "Angegeben")) : brand.wheels > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 1,
										class: "adm-tag adm-tag--warn"
									}, "Fehlt")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 2,
										class: "mk__none"
									}, "–"))]),
									__props.can.update || __props.can.delete ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
										key: 0,
										"data-label": "Aktionen",
										"data-phone": "menu",
										class: "mk__actions"
									}, [__props.can.update ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("input", {
										key: 0,
										id: `mk-file-${brand.id}`,
										class: "visually-hidden",
										type: "file",
										tabindex: "-1",
										"aria-hidden": "true",
										accept: ".svg,.png,.webp,image/svg+xml,image/png,image/webp",
										disabled: busy.value,
										onChange: ($event) => upload(brand, $event)
									}, null, 40, [
										"id",
										"disabled",
										"onChange"
									])) : (0, vue_exports.createCommentVNode)("", true), hasMenu(brand) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuRoot_default), { key: 1 }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
											"data-focus": more(brand.id),
											class: "adm-iconbtn",
											disabled: busy.value,
											"aria-label": `Aktionen für ${brand.name}`
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "more",
												size: 20
											})]),
											_: 1
										}, 8, [
											"data-focus",
											"disabled",
											"aria-label"
										]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
												class: "adm-menu",
												align: "end",
												"side-offset": 4,
												"collision-padding": (0, vue_exports.unref)(MENU_ROOM),
												onCloseAutoFocus: (0, vue_exports.unref)(focus).onMenuClose
											}, {
												default: (0, vue_exports.withCtx)(() => [__props.can.update ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [
													(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														onSelect: ($event) => edit(brand)
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "edit",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Bearbeiten ")]),
														_: 1
													}, 8, ["onSelect"]),
													(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														onSelect: ($event) => editManufacturer(brand)
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "shield",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Herstellerangaben ")]),
														_: 1
													}, 8, ["onSelect"]),
													(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														onSelect: ($event) => pickLogo(brand)
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "media",
															size: 20
														}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(brand.logo ? "Logo ersetzen" : "Logo hochladen"), 1)]),
														_: 2
													}, 1032, ["onSelect"]),
													brand.logo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
														key: 0,
														class: "adm-menu__item",
														onSelect: ($event) => removeLogo(brand)
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "close",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Logo entfernen ")]),
														_: 1
													}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true)
												], 64)) : (0, vue_exports.createCommentVNode)("", true), mayRemove(brand) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [__props.can.update ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuSeparator_default), {
													key: 0,
													class: "adm-menu__sep"
												})) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item adm-menu__item--danger",
													onSelect: ($event) => confirming.value = brand
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "delete",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
													_: 1
												}, 8, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true)]),
												_: 2
											}, 1032, ["collision-padding", "onCloseAutoFocus"])]),
											_: 2
										}, 1024)]),
										_: 2
									}, 1024)) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true)
								], 42, ["aria-current", "onAnimationend"]);
							}), 128))])])])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
								key: 2,
								kind: "empty",
								text: "Noch keine Marke. Marken entstehen hier, beim Import einer Lieferantendatei oder beim Anlegen einer Felge."
							}))
						]),
						(0, vue_exports.createVNode)("p", {
							class: "visually-hidden",
							"aria-live": "assertive"
						}, (0, vue_exports.toDisplayString)(spoken.value), 1),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: confirmOpen.value,
							"onUpdate:open": ($event) => confirmOpen.value = $event,
							title: `Marke „${confirming.value?.name ?? ""}“ entfernen?`,
							body: "Sie führt keine Felge und keinen Reifen mehr. Das Protokoll hält fest, wer sie entfernt hat.",
							"confirm-label": "Entfernen",
							busy: busy.value,
							onConfirm: remove
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
//#region resources/js/Pages/Admin/Marken/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Marken/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-ab440ed6"]]);
//#endregion
export { Index_default as default };
