import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-Bh3el5Y6.js";
import { c as router, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as AdminSaveBar_default, t as useDirtyForm } from "./useDirtyForm-D_oy2Apt.js";
//#region resources/js/Pages/Admin/Einstellungen/Speicher.vue?vue&type=script&setup=true&lang.ts
var Speicher_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Speicher",
	__ssrInlineRender: true,
	props: {
		form: {},
		keyMasked: {},
		secretMasked: {},
		source: {},
		pending: { type: Boolean },
		verifiedAt: {},
		test: {},
		buckets: {},
		disks: {}
	},
	setup(__props) {
		/**
		* Einstellungen › Medien und Speicher: the bucket the shop's files live in (SpeicherController).
		*
		* The keys are write-only. The page only ever gets their last four characters, masked; a key stays
		* as stored until „Neuen Schlüssel eintragen“ opens an empty field for a new one. A save is tested
		* at once, and so is „Verbindung testen“ on demand: write, read, compare, delete on private/ — one
		* line per step, the storage's own words where one fails. The page says which set is in force.
		*/
		const props = __props;
		const editor = useDirtyForm({
			...props.form,
			access_key: "",
			secret: ""
		}, {
			method: "put",
			url: "/admin/einstellungen/speicher"
		});
		const form = editor.form;
		/** The two write-only fields: closed (the masked value), or open for a new one. */
		const newKey = (0, vue_exports.ref)(props.keyMasked === null);
		const newSecret = (0, vue_exports.ref)(props.secretMasked === null);
		function replaceKey() {
			newKey.value = true;
			form.access_key = "";
		}
		function replaceSecret() {
			newSecret.value = true;
			form.secret = "";
		}
		const SOURCES = {
			database: "Diese Einstellungen",
			env: "Die Werte aus der .env-Datei – hier ist noch nichts gespeichert und geprüft",
			local: "Lokaler Speicher auf dem Server – noch kein Bucket eingerichtet"
		};
		const listing = (0, vue_exports.ref)(false);
		const bucketNames = (0, vue_exports.computed)(() => {
			const names = props.buckets?.names ?? [];
			return form.bucket && names.length && !names.includes(form.bucket) ? [form.bucket, ...names] : names;
		});
		function listBuckets() {
			if (listing.value) return;
			listing.value = true;
			router.post("/admin/einstellungen/speicher/buckets", {
				region: form.region,
				endpoint: form.endpoint,
				path_style: form.path_style,
				access_key: form.access_key,
				secret: form.secret
			}, {
				preserveScroll: true,
				preserveState: true,
				onFinish: () => listing.value = false
			});
		}
		const testing = (0, vue_exports.ref)(false);
		function testConnection() {
			if (testing.value) return;
			testing.value = true;
			router.post("/admin/einstellungen/speicher/test", { ...form.data() }, {
				preserveScroll: true,
				onFinish: () => testing.value = false
			});
		}
		const VISIBILITY = {
			public: "öffentlich lesbar",
			private: "privat, nur mit signiertem Link"
		};
		const HOLDS = {
			media_products: "Felgenfotos und ihre Größen",
			media_site: "Bilder der Inhaltsseiten",
			docs_public: "Gutachten zum Öffnen im Shop",
			docs_private: "Rechnungen, Exporte, Uploads in Prüfung"
		};
		const disks = (0, vue_exports.computed)(() => Object.entries(props.disks).map(([name, spec]) => ({
			name,
			...spec
		})));
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Medien und Speicher",
				context: `In Kraft: ${SOURCES[__props.source]}`
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.pending) _push(`<p class="adm-alert" role="status" data-v-d3b657e9${_scopeId}> Die zuletzt gespeicherten Werte sind noch nicht aktiv: Die Verbindung klappte damit nicht. Es gelten weiter die bisherigen Einstellungen. </p>`);
						else _push(`<!---->`);
						_push(`<form class="adm-form" novalidate data-v-d3b657e9${_scopeId}><section class="adm-form__group" aria-labelledby="sp-bucket" data-v-d3b657e9${_scopeId}><h2 id="sp-bucket" class="adm-form__heading" data-v-d3b657e9${_scopeId}>Bucket</h2><div class="form-field" data-v-d3b657e9${_scopeId}><label class="form-field__label" for="sp-provider" data-v-d3b657e9${_scopeId}>Anbieter</label><select id="sp-provider" class="input" data-v-d3b657e9${_scopeId}><option value="s3" data-v-d3b657e9${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).provider) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).provider, "s3") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).provider, "s3")) ? " selected" : ""}${_scopeId}>S3-kompatibel (AWS S3 und andere)</option></select></div><div class="adm-fields" data-v-d3b657e9${_scopeId}><div class="form-field" data-v-d3b657e9${_scopeId}><label class="form-field__label" for="sp-region" data-v-d3b657e9${_scopeId}>Region</label><input id="sp-region"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).region)} class="input" type="text" autocomplete="off" spellcheck="false" aria-describedby="sp-region-help sp-region-error"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.region ? "true" : void 0)} data-v-d3b657e9${_scopeId}><p id="sp-region-help" class="form-field__help" data-v-d3b657e9${_scopeId}>Stockholm ist eu-north-1.</p><p id="sp-region-error" class="form-field__error" data-v-d3b657e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.region)}</p></div><div class="form-field" data-v-d3b657e9${_scopeId}><label class="form-field__label" for="sp-bucket-name" data-v-d3b657e9${_scopeId}>Name des Buckets</label>`);
						if (bucketNames.value.length) {
							_push(`<select id="sp-bucket-name" class="input" aria-describedby="sp-bucket-help sp-bucket-error"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.bucket ? "true" : void 0)} data-v-d3b657e9${_scopeId}><option value="" disabled data-v-d3b657e9${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).bucket) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).bucket, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).bucket, "")) ? " selected" : ""}${_scopeId}>Bucket wählen</option><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(bucketNames.value, (name) => {
								_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", name)} data-v-d3b657e9${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).bucket) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).bucket, name) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).bucket, name)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(name)}</option>`);
							});
							_push(`<!--]--></select>`);
						} else _push(`<input id="sp-bucket-name"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).bucket)} class="input" type="text" autocomplete="off" spellcheck="false" aria-describedby="sp-bucket-help sp-bucket-error"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.bucket ? "true" : void 0)} data-v-d3b657e9${_scopeId}>`);
						_push(`<p id="sp-bucket-help" class="form-field__help" data-v-d3b657e9${_scopeId}>`);
						if (__props.buckets?.error) _push(`<!--[-->AWS erlaubt diesem Schlüssel keine Liste (${(0, server_renderer_exports.ssrInterpolate)(__props.buckets.error)}). Trag den Namen bitte genau wie in der AWS-Konsole ein.<!--]-->`);
						else if (bucketNames.value.length) _push(`<!--[-->Die Buckets, die dieser Schlüssel sehen darf – direkt von AWS.<!--]-->`);
						else _push(`<!--[-->Am sichersten aus AWS geladen: ein Zeichen daneben, und AWS antwortet mit „NoSuchBucket“.<!--]-->`);
						_push(`</p><p id="sp-bucket-error" class="form-field__error" data-v-d3b657e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.bucket)}</p><div data-v-d3b657e9${_scopeId}><button class="btn btn--secondary btn--sm" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", listing.value ? "true" : void 0)} data-v-d3b657e9${_scopeId}>Buckets von AWS laden</button></div></div></div><div class="adm-fields" data-v-d3b657e9${_scopeId}><div class="form-field" data-v-d3b657e9${_scopeId}><label class="form-field__label" for="sp-public-url" data-v-d3b657e9${_scopeId}>Öffentliche Adresse oder CDN <span class="form-field__optional" data-v-d3b657e9${_scopeId}>optional</span></label><input id="sp-public-url"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).public_url)} class="input" type="url" inputmode="url" autocomplete="off" spellcheck="false" aria-describedby="sp-public-help sp-public-error"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.public_url ? "true" : void 0)} data-v-d3b657e9${_scopeId}><p id="sp-public-help" class="form-field__help" data-v-d3b657e9${_scopeId}>Leer lassen, dann gilt die Adresse des Buckets selbst.</p><p id="sp-public-error" class="form-field__error" data-v-d3b657e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.public_url)}</p></div><div class="form-field" data-v-d3b657e9${_scopeId}><label class="form-field__label" for="sp-endpoint" data-v-d3b657e9${_scopeId}>Endpunkt <span class="form-field__optional" data-v-d3b657e9${_scopeId}>optional</span></label><input id="sp-endpoint"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).endpoint)} class="input" type="url" inputmode="url" autocomplete="off" spellcheck="false" aria-describedby="sp-endpoint-help sp-endpoint-error"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.endpoint ? "true" : void 0)} data-v-d3b657e9${_scopeId}><p id="sp-endpoint-help" class="form-field__help" data-v-d3b657e9${_scopeId}>Nur für einen Anbieter außer AWS.</p><p id="sp-endpoint-error" class="form-field__error" data-v-d3b657e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.endpoint)}</p></div></div><label class="check" data-v-d3b657e9${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).path_style) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).path_style, null) : (0, vue_exports.unref)(form).path_style) ? " checked" : ""} type="checkbox" data-v-d3b657e9${_scopeId}> Pfad-Stil verwenden (nur wenn der Anbieter es verlangt) </label></section><section class="adm-form__group" aria-labelledby="sp-keys" data-v-d3b657e9${_scopeId}><h2 id="sp-keys" class="adm-form__heading" data-v-d3b657e9${_scopeId}>Zugang</h2><p class="adm-form__note" data-v-d3b657e9${_scopeId}>Die Schlüssel werden verschlüsselt gespeichert und nie wieder angezeigt – nur ihre letzten vier Zeichen.</p><div class="form-field" data-v-d3b657e9${_scopeId}><label class="form-field__label" for="sp-key" data-v-d3b657e9${_scopeId}>Zugriffsschlüssel (Access Key ID)</label>`);
						if (!newKey.value) _push(`<div class="sp-masked" data-v-d3b657e9${_scopeId}><output id="sp-key" class="sp-masked__value" aria-label="Gespeicherter Zugriffsschlüssel, nur die letzten vier Zeichen" data-v-d3b657e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.keyMasked)}</output><button class="btn btn--secondary btn--sm" type="button" data-v-d3b657e9${_scopeId}>Neuen Schlüssel eintragen</button></div>`);
						else _push(`<input id="sp-key"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).access_key)} class="input sp-secret" type="text" autocomplete="off" spellcheck="false" aria-describedby="sp-key-error"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.access_key ? "true" : void 0)} data-v-d3b657e9${_scopeId}>`);
						_push(`<p id="sp-key-error" class="form-field__error" data-v-d3b657e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.access_key)}</p></div><div class="form-field" data-v-d3b657e9${_scopeId}><label class="form-field__label" for="sp-secret" data-v-d3b657e9${_scopeId}>Geheimer Schlüssel (Secret Access Key)</label>`);
						if (!newSecret.value) _push(`<div class="sp-masked" data-v-d3b657e9${_scopeId}><output id="sp-secret" class="sp-masked__value" aria-label="Gespeicherter geheimer Schlüssel, nur die letzten vier Zeichen" data-v-d3b657e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.secretMasked)}</output><button class="btn btn--secondary btn--sm" type="button" data-v-d3b657e9${_scopeId}>Neuen Schlüssel eintragen</button></div>`);
						else _push(`<input id="sp-secret"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).secret)} class="input sp-secret" type="password" autocomplete="new-password" spellcheck="false" aria-describedby="sp-secret-help sp-secret-error"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.secret ? "true" : void 0)} data-v-d3b657e9${_scopeId}>`);
						if (newSecret.value && __props.secretMasked !== null) _push(`<p id="sp-secret-help" class="form-field__help" data-v-d3b657e9${_scopeId}>Leer lassen behält den gespeicherten Schlüssel.</p>`);
						else _push(`<!---->`);
						_push(`<p id="sp-secret-error" class="form-field__error" data-v-d3b657e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.secret)}</p></div></section><section class="adm-form__group" aria-labelledby="sp-test" data-v-d3b657e9${_scopeId}><h2 id="sp-test" class="adm-form__heading" data-v-d3b657e9${_scopeId}>Verbindung</h2><p class="adm-form__note" data-v-d3b657e9${_scopeId}>Schreibt eine kleine Datei nach invoices/, liest sie zurück, vergleicht sie und löscht sie wieder. Jedes Speichern prüft genauso.</p><div data-v-d3b657e9${_scopeId}><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", testing.value ? "true" : void 0)} data-v-d3b657e9${_scopeId}>Verbindung testen</button></div>`);
						if (__props.test) {
							_push(`<ol class="sp-steps" aria-label="Ergebnis der letzten Prüfung" data-v-d3b657e9${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.test.steps, (step) => {
								_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([step.ok ? "sp-step--ok" : "sp-step--bad", "sp-step"])}" data-v-d3b657e9${_scopeId}><span class="${(0, server_renderer_exports.ssrRenderClass)([step.ok ? "adm-health__dot--ok" : "adm-health__dot--bad", "adm-health__dot"])}" aria-hidden="true" data-v-d3b657e9${_scopeId}></span><span class="sp-step__name" data-v-d3b657e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(step.step)}<span class="visually-hidden" data-v-d3b657e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(step.ok ? ": geklappt" : ": fehlgeschlagen")}</span></span>`);
								if (step.detail) _push(`<code class="sp-step__detail" data-v-d3b657e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(step.detail)}</code>`);
								else _push(`<!---->`);
								_push(`</li>`);
							});
							_push(`<!--]--></ol>`);
						} else _push(`<!---->`);
						_push(`</section><section class="adm-form__group" aria-labelledby="sp-disks" data-v-d3b657e9${_scopeId}><h2 id="sp-disks" class="adm-form__heading" data-v-d3b657e9${_scopeId}>Ordner im Bucket</h2><div class="adm-panel" data-v-d3b657e9${_scopeId}><table class="adm-table" data-v-d3b657e9${_scopeId}><caption class="visually-hidden" data-v-d3b657e9${_scopeId}>Die vier Ordner im Bucket</caption><thead data-v-d3b657e9${_scopeId}><tr data-v-d3b657e9${_scopeId}><th scope="col" data-v-d3b657e9${_scopeId}>Ordner</th><th scope="col" data-v-d3b657e9${_scopeId}>Sichtbarkeit</th><th scope="col" data-v-d3b657e9${_scopeId}>Enthält</th></tr></thead><tbody data-v-d3b657e9${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(disks.value, (disk) => {
							_push(`<tr data-v-d3b657e9${_scopeId}><td data-label="Ordner" data-v-d3b657e9${_scopeId}><code data-v-d3b657e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(disk.prefix)}/</code></td><td data-label="Sichtbarkeit" data-v-d3b657e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(VISIBILITY[disk.visibility])}</td><td data-label="Enthält" data-v-d3b657e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(HOLDS[disk.name] ?? "")}</td></tr>`);
						});
						_push(`<!--]--></tbody></table></div></section></form>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminSaveBar_default, { editor: (0, vue_exports.unref)(editor) }, null, _parent, _scopeId));
					} else return [
						__props.pending ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-alert",
							role: "status"
						}, " Die zuletzt gespeicherten Werte sind noch nicht aktiv: Die Verbindung klappte damit nicht. Es gelten weiter die bisherigen Einstellungen. ")) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("form", {
							class: "adm-form",
							novalidate: "",
							onSubmit: (0, vue_exports.withModifiers)((0, vue_exports.unref)(editor).save, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("section", {
								class: "adm-form__group",
								"aria-labelledby": "sp-bucket"
							}, [
								(0, vue_exports.createVNode)("h2", {
									id: "sp-bucket",
									class: "adm-form__heading"
								}, "Bucket"),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "sp-provider"
								}, "Anbieter"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "sp-provider",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).provider = $event,
									class: "input"
								}, [(0, vue_exports.createVNode)("option", { value: "s3" }, "S3-kompatibel (AWS S3 und andere)")], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(form).provider]])]),
								(0, vue_exports.createVNode)("div", { class: "adm-fields" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "sp-region"
									}, "Region"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "sp-region",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).region = $event,
										class: "input",
										type: "text",
										autocomplete: "off",
										spellcheck: "false",
										"aria-describedby": "sp-region-help sp-region-error",
										"aria-invalid": (0, vue_exports.unref)(form).errors.region ? "true" : void 0
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).region]]),
									(0, vue_exports.createVNode)("p", {
										id: "sp-region-help",
										class: "form-field__help"
									}, "Stockholm ist eu-north-1."),
									(0, vue_exports.createVNode)("p", {
										id: "sp-region-error",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).errors.region), 1)
								]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "sp-bucket-name"
									}, "Name des Buckets"),
									bucketNames.value.length ? (0, vue_exports.withDirectives)(((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("select", {
										key: 0,
										id: "sp-bucket-name",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).bucket = $event,
										class: "input",
										"aria-describedby": "sp-bucket-help sp-bucket-error",
										"aria-invalid": (0, vue_exports.unref)(form).errors.bucket ? "true" : void 0
									}, [(0, vue_exports.createVNode)("option", {
										value: "",
										disabled: ""
									}, "Bucket wählen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(bucketNames.value, (name) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
											key: name,
											value: name
										}, (0, vue_exports.toDisplayString)(name), 9, ["value"]);
									}), 128))], 8, ["onUpdate:modelValue", "aria-invalid"])), [[vue_exports.vModelSelect, (0, vue_exports.unref)(form).bucket]]) : (0, vue_exports.withDirectives)(((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("input", {
										key: 1,
										id: "sp-bucket-name",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).bucket = $event,
										class: "input",
										type: "text",
										autocomplete: "off",
										spellcheck: "false",
										"aria-describedby": "sp-bucket-help sp-bucket-error",
										"aria-invalid": (0, vue_exports.unref)(form).errors.bucket ? "true" : void 0
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"])), [[vue_exports.vModelText, (0, vue_exports.unref)(form).bucket]]),
									(0, vue_exports.createVNode)("p", {
										id: "sp-bucket-help",
										class: "form-field__help"
									}, [__props.buckets?.error ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("AWS erlaubt diesem Schlüssel keine Liste (" + (0, vue_exports.toDisplayString)(__props.buckets.error) + "). Trag den Namen bitte genau wie in der AWS-Konsole ein.", 1)], 64)) : bucketNames.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Die Buckets, die dieser Schlüssel sehen darf – direkt von AWS.")], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createTextVNode)("Am sichersten aus AWS geladen: ein Zeichen daneben, und AWS antwortet mit „NoSuchBucket“.")], 64))]),
									(0, vue_exports.createVNode)("p", {
										id: "sp-bucket-error",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).errors.bucket), 1),
									(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("button", {
										class: "btn btn--secondary btn--sm",
										type: "button",
										"aria-busy": listing.value ? "true" : void 0,
										onClick: listBuckets
									}, "Buckets von AWS laden", 8, ["aria-busy"])])
								])]),
								(0, vue_exports.createVNode)("div", { class: "adm-fields" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "sp-public-url"
									}, [(0, vue_exports.createTextVNode)("Öffentliche Adresse oder CDN "), (0, vue_exports.createVNode)("span", { class: "form-field__optional" }, "optional")]),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "sp-public-url",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).public_url = $event,
										class: "input",
										type: "url",
										inputmode: "url",
										autocomplete: "off",
										spellcheck: "false",
										"aria-describedby": "sp-public-help sp-public-error",
										"aria-invalid": (0, vue_exports.unref)(form).errors.public_url ? "true" : void 0
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).public_url]]),
									(0, vue_exports.createVNode)("p", {
										id: "sp-public-help",
										class: "form-field__help"
									}, "Leer lassen, dann gilt die Adresse des Buckets selbst."),
									(0, vue_exports.createVNode)("p", {
										id: "sp-public-error",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).errors.public_url), 1)
								]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "sp-endpoint"
									}, [(0, vue_exports.createTextVNode)("Endpunkt "), (0, vue_exports.createVNode)("span", { class: "form-field__optional" }, "optional")]),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "sp-endpoint",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).endpoint = $event,
										class: "input",
										type: "url",
										inputmode: "url",
										autocomplete: "off",
										spellcheck: "false",
										"aria-describedby": "sp-endpoint-help sp-endpoint-error",
										"aria-invalid": (0, vue_exports.unref)(form).errors.endpoint ? "true" : void 0
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).endpoint]]),
									(0, vue_exports.createVNode)("p", {
										id: "sp-endpoint-help",
										class: "form-field__help"
									}, "Nur für einen Anbieter außer AWS."),
									(0, vue_exports.createVNode)("p", {
										id: "sp-endpoint-error",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).errors.endpoint), 1)
								])]),
								(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).path_style = $event,
									type: "checkbox"
								}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelCheckbox, (0, vue_exports.unref)(form).path_style]]), (0, vue_exports.createTextVNode)(" Pfad-Stil verwenden (nur wenn der Anbieter es verlangt) ")])
							]),
							(0, vue_exports.createVNode)("section", {
								class: "adm-form__group",
								"aria-labelledby": "sp-keys"
							}, [
								(0, vue_exports.createVNode)("h2", {
									id: "sp-keys",
									class: "adm-form__heading"
								}, "Zugang"),
								(0, vue_exports.createVNode)("p", { class: "adm-form__note" }, "Die Schlüssel werden verschlüsselt gespeichert und nie wieder angezeigt – nur ihre letzten vier Zeichen."),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "sp-key"
									}, "Zugriffsschlüssel (Access Key ID)"),
									!newKey.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 0,
										class: "sp-masked"
									}, [(0, vue_exports.createVNode)("output", {
										id: "sp-key",
										class: "sp-masked__value",
										"aria-label": "Gespeicherter Zugriffsschlüssel, nur die letzten vier Zeichen"
									}, (0, vue_exports.toDisplayString)(__props.keyMasked), 1), (0, vue_exports.createVNode)("button", {
										class: "btn btn--secondary btn--sm",
										type: "button",
										onClick: replaceKey
									}, "Neuen Schlüssel eintragen")])) : (0, vue_exports.withDirectives)(((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("input", {
										key: 1,
										id: "sp-key",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).access_key = $event,
										class: "input sp-secret",
										type: "text",
										autocomplete: "off",
										spellcheck: "false",
										"aria-describedby": "sp-key-error",
										"aria-invalid": (0, vue_exports.unref)(form).errors.access_key ? "true" : void 0
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"])), [[vue_exports.vModelText, (0, vue_exports.unref)(form).access_key]]),
									(0, vue_exports.createVNode)("p", {
										id: "sp-key-error",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).errors.access_key), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "sp-secret"
									}, "Geheimer Schlüssel (Secret Access Key)"),
									!newSecret.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 0,
										class: "sp-masked"
									}, [(0, vue_exports.createVNode)("output", {
										id: "sp-secret",
										class: "sp-masked__value",
										"aria-label": "Gespeicherter geheimer Schlüssel, nur die letzten vier Zeichen"
									}, (0, vue_exports.toDisplayString)(__props.secretMasked), 1), (0, vue_exports.createVNode)("button", {
										class: "btn btn--secondary btn--sm",
										type: "button",
										onClick: replaceSecret
									}, "Neuen Schlüssel eintragen")])) : (0, vue_exports.withDirectives)(((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("input", {
										key: 1,
										id: "sp-secret",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).secret = $event,
										class: "input sp-secret",
										type: "password",
										autocomplete: "new-password",
										spellcheck: "false",
										"aria-describedby": "sp-secret-help sp-secret-error",
										"aria-invalid": (0, vue_exports.unref)(form).errors.secret ? "true" : void 0
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"])), [[vue_exports.vModelText, (0, vue_exports.unref)(form).secret]]),
									newSecret.value && __props.secretMasked !== null ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 2,
										id: "sp-secret-help",
										class: "form-field__help"
									}, "Leer lassen behält den gespeicherten Schlüssel.")) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)("p", {
										id: "sp-secret-error",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).errors.secret), 1)
								])
							]),
							(0, vue_exports.createVNode)("section", {
								class: "adm-form__group",
								"aria-labelledby": "sp-test"
							}, [
								(0, vue_exports.createVNode)("h2", {
									id: "sp-test",
									class: "adm-form__heading"
								}, "Verbindung"),
								(0, vue_exports.createVNode)("p", { class: "adm-form__note" }, "Schreibt eine kleine Datei nach invoices/, liest sie zurück, vergleicht sie und löscht sie wieder. Jedes Speichern prüft genauso."),
								(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									"aria-busy": testing.value ? "true" : void 0,
									onClick: testConnection
								}, "Verbindung testen", 8, ["aria-busy"])]),
								__props.test ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ol", {
									key: 0,
									class: "sp-steps",
									"aria-label": "Ergebnis der letzten Prüfung"
								}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.test.steps, (step) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
										key: step.step,
										class: ["sp-step", step.ok ? "sp-step--ok" : "sp-step--bad"]
									}, [
										(0, vue_exports.createVNode)("span", {
											class: ["adm-health__dot", step.ok ? "adm-health__dot--ok" : "adm-health__dot--bad"],
											"aria-hidden": "true"
										}, null, 2),
										(0, vue_exports.createVNode)("span", { class: "sp-step__name" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(step.step), 1), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, (0, vue_exports.toDisplayString)(step.ok ? ": geklappt" : ": fehlgeschlagen"), 1)]),
										step.detail ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("code", {
											key: 0,
											class: "sp-step__detail"
										}, (0, vue_exports.toDisplayString)(step.detail), 1)) : (0, vue_exports.createCommentVNode)("", true)
									], 2);
								}), 128))])) : (0, vue_exports.createCommentVNode)("", true)
							]),
							(0, vue_exports.createVNode)("section", {
								class: "adm-form__group",
								"aria-labelledby": "sp-disks"
							}, [(0, vue_exports.createVNode)("h2", {
								id: "sp-disks",
								class: "adm-form__heading"
							}, "Ordner im Bucket"), (0, vue_exports.createVNode)("div", { class: "adm-panel" }, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [
								(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Die vier Ordner im Bucket"),
								(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Ordner"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Sichtbarkeit"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Enthält")
								])]),
								(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(disks.value, (disk) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: disk.name }, [
										(0, vue_exports.createVNode)("td", { "data-label": "Ordner" }, [(0, vue_exports.createVNode)("code", null, (0, vue_exports.toDisplayString)(disk.prefix) + "/", 1)]),
										(0, vue_exports.createVNode)("td", { "data-label": "Sichtbarkeit" }, (0, vue_exports.toDisplayString)(VISIBILITY[disk.visibility]), 1),
										(0, vue_exports.createVNode)("td", { "data-label": "Enthält" }, (0, vue_exports.toDisplayString)(HOLDS[disk.name] ?? ""), 1)
									]);
								}), 128))])
							])])])
						], 40, ["onSubmit"]),
						(0, vue_exports.createVNode)(AdminSaveBar_default, { editor: (0, vue_exports.unref)(editor) }, null, 8, ["editor"])
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Einstellungen/Speicher.vue
var _sfc_setup = Speicher_vue_vue_type_script_setup_true_lang_default.setup;
Speicher_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Einstellungen/Speicher.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Speicher_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Speicher_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-d3b657e9"]]);
//#endregion
export { Speicher_default as default };
