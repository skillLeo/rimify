import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BSZH2tn1.js";
import { c as router, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as AdminSaveBar_default, t as useDirtyForm } from "./useDirtyForm-C7Mj8OnD.js";
//#region resources/js/Pages/Admin/Einstellungen/Email.vue?vue&type=script&setup=true&lang.ts
var Email_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Email",
	__ssrInlineRender: true,
	props: {
		form: {},
		region: {},
		keyMasked: {},
		secretMasked: {},
		pending: { type: Boolean },
		verifiedAt: {},
		sending: { type: Boolean },
		mailer: {},
		test: {},
		dns: {},
		domain: {},
		webhookUrl: {},
		suppressions: {}
	},
	setup(__props) {
		/**
		* Einstellungen › E-Mail: the Amazon SES key the shop sends its mail with (EmailController), built as Medien und
		* Speicher — write-only keys, a save tested at once, „Verbindung testen“ on demand, one line per step in SES's own
		* words. Beside it what SES needs from the world, as it stands: the sender's DNS records, the address SNS reports
		* bounces and complaints to, and the addresses on the shop's block list.
		*/
		const props = __props;
		const editor = useDirtyForm({
			...props.form,
			access_key: "",
			secret: ""
		}, {
			method: "put",
			url: "/admin/einstellungen/e-mail"
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
		const testing = (0, vue_exports.ref)(false);
		function testConnection() {
			if (testing.value) return;
			testing.value = true;
			router.post("/admin/einstellungen/e-mail/test", { ...form.data() }, {
				preserveScroll: true,
				onFinish: () => testing.value = false
			});
		}
		const releasing = (0, vue_exports.ref)(null);
		function release(id) {
			if (releasing.value !== null) return;
			releasing.value = id;
			router.delete(`/admin/einstellungen/e-mail/sperren/${id}`, {
				preserveScroll: true,
				onFinish: () => releasing.value = null
			});
		}
		const context = props.sending ? "In Kraft: Versand über Amazon SES" : `In Kraft: Versand über „${props.mailer}“ – noch nicht über Amazon SES`;
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "E-Mail",
				context: (0, vue_exports.unref)(context)
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.pending) _push(`<p class="adm-alert" role="status" data-v-fcfccb68${_scopeId}> Die zuletzt gespeicherten Werte sind noch nicht aktiv: Der Zugang zu Amazon SES klappte damit nicht. Es gelten weiter die bisherigen Einstellungen. </p>`);
						else if (!__props.sending) _push(`<p class="adm-alert" role="status" data-v-fcfccb68${_scopeId}> Die Mails des Shops gehen noch nicht über Amazon SES. Das geschieht erst, wenn die Prüfung unten keine offenen Punkte mehr nennt: Zugang, Produktionszugang, bestätigte Absenderdomain. </p>`);
						else _push(`<!---->`);
						_push(`<form class="adm-form" novalidate data-v-fcfccb68${_scopeId}><section class="adm-form__group" aria-labelledby="em-sender" data-v-fcfccb68${_scopeId}><h2 id="em-sender" class="adm-form__heading" data-v-fcfccb68${_scopeId}>Absender</h2><div class="adm-fields" data-v-fcfccb68${_scopeId}><div class="form-field" data-v-fcfccb68${_scopeId}><label class="form-field__label" for="em-from" data-v-fcfccb68${_scopeId}>Absenderadresse</label><input id="em-from"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).from_address)} class="input" type="email" inputmode="email" autocomplete="off" spellcheck="false" aria-describedby="em-from-help em-from-error"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.from_address ? "true" : void 0)} data-v-fcfccb68${_scopeId}><p id="em-from-help" class="form-field__help" data-v-fcfccb68${_scopeId}>Eine Adresse der Domain, die in SES bestätigt ist, z. B. bestellung@rimify.de.</p><p id="em-from-error" class="form-field__error" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.from_address)}</p></div><div class="form-field" data-v-fcfccb68${_scopeId}><label class="form-field__label" for="em-name" data-v-fcfccb68${_scopeId}>Absendername <span class="form-field__optional" data-v-fcfccb68${_scopeId}>optional</span></label><input id="em-name"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).from_name)} class="input" type="text" autocomplete="off" aria-describedby="em-name-error"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.from_name ? "true" : void 0)} data-v-fcfccb68${_scopeId}><p id="em-name-error" class="form-field__error" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.from_name)}</p></div></div><div class="form-field" data-v-fcfccb68${_scopeId}><span class="form-field__label" data-v-fcfccb68${_scopeId}>Region</span><p class="em-fixed" data-v-fcfccb68${_scopeId}><code data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.region)}</code> – dieselbe wie beim Bucket.</p></div></section><section class="adm-form__group" aria-labelledby="em-keys" data-v-fcfccb68${_scopeId}><h2 id="em-keys" class="adm-form__heading" data-v-fcfccb68${_scopeId}>Zugang</h2><p class="adm-form__note" data-v-fcfccb68${_scopeId}>Ein eigener Schlüssel nur für SES. Er wird verschlüsselt gespeichert und nie wieder angezeigt – nur seine letzten vier Zeichen.</p><div class="form-field" data-v-fcfccb68${_scopeId}><label class="form-field__label" for="em-key" data-v-fcfccb68${_scopeId}>Zugriffsschlüssel (Access Key ID)</label>`);
						if (!newKey.value) _push(`<div class="em-masked" data-v-fcfccb68${_scopeId}><output id="em-key" class="em-masked__value" aria-label="Gespeicherter Zugriffsschlüssel, nur die letzten vier Zeichen" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.keyMasked)}</output><button class="btn btn--secondary btn--sm" type="button" data-v-fcfccb68${_scopeId}>Neuen Schlüssel eintragen</button></div>`);
						else _push(`<input id="em-key"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).access_key)} class="input em-secret" type="text" autocomplete="off" spellcheck="false" aria-describedby="em-key-error"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.access_key ? "true" : void 0)} data-v-fcfccb68${_scopeId}>`);
						_push(`<p id="em-key-error" class="form-field__error" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.access_key)}</p></div><div class="form-field" data-v-fcfccb68${_scopeId}><label class="form-field__label" for="em-secret" data-v-fcfccb68${_scopeId}>Geheimer Schlüssel (Secret Access Key)</label>`);
						if (!newSecret.value) _push(`<div class="em-masked" data-v-fcfccb68${_scopeId}><output id="em-secret" class="em-masked__value" aria-label="Gespeicherter geheimer Schlüssel, nur die letzten vier Zeichen" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.secretMasked)}</output><button class="btn btn--secondary btn--sm" type="button" data-v-fcfccb68${_scopeId}>Neuen Schlüssel eintragen</button></div>`);
						else _push(`<input id="em-secret"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).secret)} class="input em-secret" type="password" autocomplete="new-password" spellcheck="false" aria-describedby="em-secret-help em-secret-error"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.secret ? "true" : void 0)} data-v-fcfccb68${_scopeId}>`);
						if (newSecret.value && __props.secretMasked !== null) _push(`<p id="em-secret-help" class="form-field__help" data-v-fcfccb68${_scopeId}>Leer lassen behält den gespeicherten Schlüssel.</p>`);
						else _push(`<!---->`);
						_push(`<p id="em-secret-error" class="form-field__error" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.secret)}</p></div></section><section class="adm-form__group" aria-labelledby="em-test" data-v-fcfccb68${_scopeId}><h2 id="em-test" class="adm-form__heading" data-v-fcfccb68${_scopeId}>Verbindung</h2><p class="adm-form__note" data-v-fcfccb68${_scopeId}>Fragt SES nach dem Konto und der Absenderdomain. Verschickt nichts. Jedes Speichern prüft genauso.</p><div data-v-fcfccb68${_scopeId}><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", testing.value ? "true" : void 0)} data-v-fcfccb68${_scopeId}>Verbindung testen</button></div>`);
						if (__props.test) {
							_push(`<ol class="em-steps" aria-label="Ergebnis der letzten Prüfung" data-v-fcfccb68${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.test.steps, (step) => {
								_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([step.ok ? "em-step--ok" : "em-step--bad", "em-step"])}" data-v-fcfccb68${_scopeId}><span class="${(0, server_renderer_exports.ssrRenderClass)([step.ok ? "adm-health__dot--ok" : "adm-health__dot--bad", "adm-health__dot"])}" aria-hidden="true" data-v-fcfccb68${_scopeId}></span><span class="em-step__name" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(step.step)}<span class="visually-hidden" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(step.ok ? ": geklappt" : ": offen")}</span></span>`);
								if (step.detail) _push(`<span class="em-step__detail" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(step.detail)}</span>`);
								else _push(`<!---->`);
								_push(`</li>`);
							});
							_push(`<!--]--></ol>`);
						} else _push(`<!---->`);
						_push(`</section><section class="adm-form__group" aria-labelledby="em-dns" data-v-fcfccb68${_scopeId}><h2 id="em-dns" class="adm-form__heading" data-v-fcfccb68${_scopeId}>DNS-Einträge der Absenderdomain</h2>`);
						if (__props.domain === null) _push(`<p class="adm-form__note" data-v-fcfccb68${_scopeId}>Erst mit einer Absenderadresse lässt sich sagen, welche Einträge die Domain braucht.</p>`);
						else {
							_push(`<!--[--><p class="adm-form__note" data-v-fcfccb68${_scopeId}>So, wie sie für ${(0, server_renderer_exports.ssrInterpolate)(__props.domain)} gerade im öffentlichen DNS stehen (alle zehn Minuten neu abgefragt). Einzutragen beim Anbieter der Domain.</p><div class="adm-panel" data-v-fcfccb68${_scopeId}><table class="adm-table" data-v-fcfccb68${_scopeId}><caption class="visually-hidden" data-v-fcfccb68${_scopeId}>Die DNS-Einträge, die Amazon SES für die Absenderdomain braucht</caption><thead data-v-fcfccb68${_scopeId}><tr data-v-fcfccb68${_scopeId}><th scope="col" data-v-fcfccb68${_scopeId}>Zweck</th><th scope="col" data-v-fcfccb68${_scopeId}>Typ</th><th scope="col" data-v-fcfccb68${_scopeId}>Name</th><th scope="col" data-v-fcfccb68${_scopeId}>Wert</th><th scope="col" data-v-fcfccb68${_scopeId}>Stand</th></tr></thead><tbody data-v-fcfccb68${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.dns, (record) => {
								_push(`<tr data-v-fcfccb68${_scopeId}><td data-label="Zweck" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(record.kind)}</td><td data-label="Typ" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(record.type)}</td><td data-label="Name" data-v-fcfccb68${_scopeId}><code class="em-dns__text" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(record.name)}</code></td><td data-label="Wert" data-v-fcfccb68${_scopeId}><code class="em-dns__text" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(record.value)}</code></td><td data-label="Stand" data-v-fcfccb68${_scopeId}><span class="${(0, server_renderer_exports.ssrRenderClass)([record.found ? "em-dns__state--ok" : "em-dns__state--bad", "em-dns__state"])}" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(record.found ? "gefunden" : "fehlt")}</span></td></tr>`);
							});
							_push(`<!--]--></tbody></table></div><!--]-->`);
						}
						_push(`</section><section class="adm-form__group" aria-labelledby="em-sns" data-v-fcfccb68${_scopeId}><h2 id="em-sns" class="adm-form__heading" data-v-fcfccb68${_scopeId}>Unzustellbare Adressen und Beschwerden</h2><p class="adm-form__note" data-v-fcfccb68${_scopeId}> SES meldet sie über ein SNS-Thema an <code class="em-dns__text" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.webhookUrl)}</code>. Der Shop schickt einer gemeldeten Adresse nichts mehr; SES führt zusätzlich eine eigene Sperrliste. </p><div class="form-field" data-v-fcfccb68${_scopeId}><label class="form-field__label" for="em-topic" data-v-fcfccb68${_scopeId}>SNS-Thema (ARN) <span class="form-field__optional" data-v-fcfccb68${_scopeId}>optional</span></label><input id="em-topic"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).topic_arn)} class="input" type="text" autocomplete="off" spellcheck="false" aria-describedby="em-topic-help em-topic-error"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.topic_arn ? "true" : void 0)} data-v-fcfccb68${_scopeId}><p id="em-topic-help" class="form-field__help" data-v-fcfccb68${_scopeId}>Nur Meldungen dieses Themas nimmt der Shop an. Leer lassen heißt: Er nimmt keine an.</p><p id="em-topic-error" class="form-field__error" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.topic_arn)}</p></div>`);
						if (!__props.suppressions.length) _push(`<p class="adm-form__note" data-v-fcfccb68${_scopeId}>Keine Adresse gesperrt.</p>`);
						else {
							_push(`<div class="adm-panel" data-v-fcfccb68${_scopeId}><table class="adm-table" data-v-fcfccb68${_scopeId}><caption class="visually-hidden" data-v-fcfccb68${_scopeId}>Gesperrte Adressen</caption><thead data-v-fcfccb68${_scopeId}><tr data-v-fcfccb68${_scopeId}><th scope="col" data-v-fcfccb68${_scopeId}>Adresse</th><th scope="col" data-v-fcfccb68${_scopeId}>Grund</th><th scope="col" data-v-fcfccb68${_scopeId}>Gemeldet</th><th scope="col" data-v-fcfccb68${_scopeId}><span class="visually-hidden" data-v-fcfccb68${_scopeId}>Aktion</span></th></tr></thead><tbody data-v-fcfccb68${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.suppressions, (row) => {
								_push(`<tr data-v-fcfccb68${_scopeId}><td data-label="Adresse" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.email)}</td><td data-label="Grund" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.reason)}`);
								if (row.detail) _push(`<!--[--> (${(0, server_renderer_exports.ssrInterpolate)(row.detail)})<!--]-->`);
								else _push(`<!---->`);
								_push(`</td><td data-label="Gemeldet" data-v-fcfccb68${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.at)}</td><td data-label="Aktion" data-v-fcfccb68${_scopeId}><button class="btn btn--secondary btn--sm" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", releasing.value === row.id ? "true" : void 0)} data-v-fcfccb68${_scopeId}>Sperre aufheben</button></td></tr>`);
							});
							_push(`<!--]--></tbody></table></div>`);
						}
						_push(`</section></form>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminSaveBar_default, { editor: (0, vue_exports.unref)(editor) }, null, _parent, _scopeId));
					} else return [
						__props.pending ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-alert",
							role: "status"
						}, " Die zuletzt gespeicherten Werte sind noch nicht aktiv: Der Zugang zu Amazon SES klappte damit nicht. Es gelten weiter die bisherigen Einstellungen. ")) : !__props.sending ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 1,
							class: "adm-alert",
							role: "status"
						}, " Die Mails des Shops gehen noch nicht über Amazon SES. Das geschieht erst, wenn die Prüfung unten keine offenen Punkte mehr nennt: Zugang, Produktionszugang, bestätigte Absenderdomain. ")) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("form", {
							class: "adm-form",
							novalidate: "",
							onSubmit: (0, vue_exports.withModifiers)((0, vue_exports.unref)(editor).save, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("section", {
								class: "adm-form__group",
								"aria-labelledby": "em-sender"
							}, [
								(0, vue_exports.createVNode)("h2", {
									id: "em-sender",
									class: "adm-form__heading"
								}, "Absender"),
								(0, vue_exports.createVNode)("div", { class: "adm-fields" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "em-from"
									}, "Absenderadresse"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "em-from",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).from_address = $event,
										class: "input",
										type: "email",
										inputmode: "email",
										autocomplete: "off",
										spellcheck: "false",
										"aria-describedby": "em-from-help em-from-error",
										"aria-invalid": (0, vue_exports.unref)(form).errors.from_address ? "true" : void 0
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).from_address]]),
									(0, vue_exports.createVNode)("p", {
										id: "em-from-help",
										class: "form-field__help"
									}, "Eine Adresse der Domain, die in SES bestätigt ist, z. B. bestellung@rimify.de."),
									(0, vue_exports.createVNode)("p", {
										id: "em-from-error",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).errors.from_address), 1)
								]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "em-name"
									}, [(0, vue_exports.createTextVNode)("Absendername "), (0, vue_exports.createVNode)("span", { class: "form-field__optional" }, "optional")]),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "em-name",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).from_name = $event,
										class: "input",
										type: "text",
										autocomplete: "off",
										"aria-describedby": "em-name-error",
										"aria-invalid": (0, vue_exports.unref)(form).errors.from_name ? "true" : void 0
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).from_name]]),
									(0, vue_exports.createVNode)("p", {
										id: "em-name-error",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).errors.from_name), 1)
								])]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("span", { class: "form-field__label" }, "Region"), (0, vue_exports.createVNode)("p", { class: "em-fixed" }, [(0, vue_exports.createVNode)("code", null, (0, vue_exports.toDisplayString)(__props.region), 1), (0, vue_exports.createTextVNode)(" – dieselbe wie beim Bucket.")])])
							]),
							(0, vue_exports.createVNode)("section", {
								class: "adm-form__group",
								"aria-labelledby": "em-keys"
							}, [
								(0, vue_exports.createVNode)("h2", {
									id: "em-keys",
									class: "adm-form__heading"
								}, "Zugang"),
								(0, vue_exports.createVNode)("p", { class: "adm-form__note" }, "Ein eigener Schlüssel nur für SES. Er wird verschlüsselt gespeichert und nie wieder angezeigt – nur seine letzten vier Zeichen."),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "em-key"
									}, "Zugriffsschlüssel (Access Key ID)"),
									!newKey.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 0,
										class: "em-masked"
									}, [(0, vue_exports.createVNode)("output", {
										id: "em-key",
										class: "em-masked__value",
										"aria-label": "Gespeicherter Zugriffsschlüssel, nur die letzten vier Zeichen"
									}, (0, vue_exports.toDisplayString)(__props.keyMasked), 1), (0, vue_exports.createVNode)("button", {
										class: "btn btn--secondary btn--sm",
										type: "button",
										onClick: replaceKey
									}, "Neuen Schlüssel eintragen")])) : (0, vue_exports.withDirectives)(((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("input", {
										key: 1,
										id: "em-key",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).access_key = $event,
										class: "input em-secret",
										type: "text",
										autocomplete: "off",
										spellcheck: "false",
										"aria-describedby": "em-key-error",
										"aria-invalid": (0, vue_exports.unref)(form).errors.access_key ? "true" : void 0
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"])), [[vue_exports.vModelText, (0, vue_exports.unref)(form).access_key]]),
									(0, vue_exports.createVNode)("p", {
										id: "em-key-error",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).errors.access_key), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "em-secret"
									}, "Geheimer Schlüssel (Secret Access Key)"),
									!newSecret.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 0,
										class: "em-masked"
									}, [(0, vue_exports.createVNode)("output", {
										id: "em-secret",
										class: "em-masked__value",
										"aria-label": "Gespeicherter geheimer Schlüssel, nur die letzten vier Zeichen"
									}, (0, vue_exports.toDisplayString)(__props.secretMasked), 1), (0, vue_exports.createVNode)("button", {
										class: "btn btn--secondary btn--sm",
										type: "button",
										onClick: replaceSecret
									}, "Neuen Schlüssel eintragen")])) : (0, vue_exports.withDirectives)(((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("input", {
										key: 1,
										id: "em-secret",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).secret = $event,
										class: "input em-secret",
										type: "password",
										autocomplete: "new-password",
										spellcheck: "false",
										"aria-describedby": "em-secret-help em-secret-error",
										"aria-invalid": (0, vue_exports.unref)(form).errors.secret ? "true" : void 0
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"])), [[vue_exports.vModelText, (0, vue_exports.unref)(form).secret]]),
									newSecret.value && __props.secretMasked !== null ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 2,
										id: "em-secret-help",
										class: "form-field__help"
									}, "Leer lassen behält den gespeicherten Schlüssel.")) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)("p", {
										id: "em-secret-error",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).errors.secret), 1)
								])
							]),
							(0, vue_exports.createVNode)("section", {
								class: "adm-form__group",
								"aria-labelledby": "em-test"
							}, [
								(0, vue_exports.createVNode)("h2", {
									id: "em-test",
									class: "adm-form__heading"
								}, "Verbindung"),
								(0, vue_exports.createVNode)("p", { class: "adm-form__note" }, "Fragt SES nach dem Konto und der Absenderdomain. Verschickt nichts. Jedes Speichern prüft genauso."),
								(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									"aria-busy": testing.value ? "true" : void 0,
									onClick: testConnection
								}, "Verbindung testen", 8, ["aria-busy"])]),
								__props.test ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ol", {
									key: 0,
									class: "em-steps",
									"aria-label": "Ergebnis der letzten Prüfung"
								}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.test.steps, (step) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
										key: step.step,
										class: ["em-step", step.ok ? "em-step--ok" : "em-step--bad"]
									}, [
										(0, vue_exports.createVNode)("span", {
											class: ["adm-health__dot", step.ok ? "adm-health__dot--ok" : "adm-health__dot--bad"],
											"aria-hidden": "true"
										}, null, 2),
										(0, vue_exports.createVNode)("span", { class: "em-step__name" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(step.step), 1), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, (0, vue_exports.toDisplayString)(step.ok ? ": geklappt" : ": offen"), 1)]),
										step.detail ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: "em-step__detail"
										}, (0, vue_exports.toDisplayString)(step.detail), 1)) : (0, vue_exports.createCommentVNode)("", true)
									], 2);
								}), 128))])) : (0, vue_exports.createCommentVNode)("", true)
							]),
							(0, vue_exports.createVNode)("section", {
								class: "adm-form__group",
								"aria-labelledby": "em-dns"
							}, [(0, vue_exports.createVNode)("h2", {
								id: "em-dns",
								class: "adm-form__heading"
							}, "DNS-Einträge der Absenderdomain"), __props.domain === null ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-form__note"
							}, "Erst mit einer Absenderadresse lässt sich sagen, welche Einträge die Domain braucht.")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createVNode)("p", { class: "adm-form__note" }, "So, wie sie für " + (0, vue_exports.toDisplayString)(__props.domain) + " gerade im öffentlichen DNS stehen (alle zehn Minuten neu abgefragt). Einzutragen beim Anbieter der Domain.", 1), (0, vue_exports.createVNode)("div", { class: "adm-panel" }, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [
								(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Die DNS-Einträge, die Amazon SES für die Absenderdomain braucht"),
								(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Zweck"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Typ"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Name"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Wert"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Stand")
								])]),
								(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.dns, (record) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: record.type + record.name }, [
										(0, vue_exports.createVNode)("td", { "data-label": "Zweck" }, (0, vue_exports.toDisplayString)(record.kind), 1),
										(0, vue_exports.createVNode)("td", { "data-label": "Typ" }, (0, vue_exports.toDisplayString)(record.type), 1),
										(0, vue_exports.createVNode)("td", { "data-label": "Name" }, [(0, vue_exports.createVNode)("code", { class: "em-dns__text" }, (0, vue_exports.toDisplayString)(record.name), 1)]),
										(0, vue_exports.createVNode)("td", { "data-label": "Wert" }, [(0, vue_exports.createVNode)("code", { class: "em-dns__text" }, (0, vue_exports.toDisplayString)(record.value), 1)]),
										(0, vue_exports.createVNode)("td", { "data-label": "Stand" }, [(0, vue_exports.createVNode)("span", { class: ["em-dns__state", record.found ? "em-dns__state--ok" : "em-dns__state--bad"] }, (0, vue_exports.toDisplayString)(record.found ? "gefunden" : "fehlt"), 3)])
									]);
								}), 128))])
							])])], 64))]),
							(0, vue_exports.createVNode)("section", {
								class: "adm-form__group",
								"aria-labelledby": "em-sns"
							}, [
								(0, vue_exports.createVNode)("h2", {
									id: "em-sns",
									class: "adm-form__heading"
								}, "Unzustellbare Adressen und Beschwerden"),
								(0, vue_exports.createVNode)("p", { class: "adm-form__note" }, [
									(0, vue_exports.createTextVNode)(" SES meldet sie über ein SNS-Thema an "),
									(0, vue_exports.createVNode)("code", { class: "em-dns__text" }, (0, vue_exports.toDisplayString)(__props.webhookUrl), 1),
									(0, vue_exports.createTextVNode)(". Der Shop schickt einer gemeldeten Adresse nichts mehr; SES führt zusätzlich eine eigene Sperrliste. ")
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "em-topic"
									}, [(0, vue_exports.createTextVNode)("SNS-Thema (ARN) "), (0, vue_exports.createVNode)("span", { class: "form-field__optional" }, "optional")]),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "em-topic",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).topic_arn = $event,
										class: "input",
										type: "text",
										autocomplete: "off",
										spellcheck: "false",
										"aria-describedby": "em-topic-help em-topic-error",
										"aria-invalid": (0, vue_exports.unref)(form).errors.topic_arn ? "true" : void 0
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).topic_arn]]),
									(0, vue_exports.createVNode)("p", {
										id: "em-topic-help",
										class: "form-field__help"
									}, "Nur Meldungen dieses Themas nimmt der Shop an. Leer lassen heißt: Er nimmt keine an."),
									(0, vue_exports.createVNode)("p", {
										id: "em-topic-error",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).errors.topic_arn), 1)
								]),
								!__props.suppressions.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 0,
									class: "adm-form__note"
								}, "Keine Adresse gesperrt.")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 1,
									class: "adm-panel"
								}, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [
									(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Gesperrte Adressen"),
									(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
										(0, vue_exports.createVNode)("th", { scope: "col" }, "Adresse"),
										(0, vue_exports.createVNode)("th", { scope: "col" }, "Grund"),
										(0, vue_exports.createVNode)("th", { scope: "col" }, "Gemeldet"),
										(0, vue_exports.createVNode)("th", { scope: "col" }, [(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, "Aktion")])
									])]),
									(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.suppressions, (row) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: row.id }, [
											(0, vue_exports.createVNode)("td", { "data-label": "Adresse" }, (0, vue_exports.toDisplayString)(row.email), 1),
											(0, vue_exports.createVNode)("td", { "data-label": "Grund" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(row.reason), 1), row.detail ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" (" + (0, vue_exports.toDisplayString)(row.detail) + ")", 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)]),
											(0, vue_exports.createVNode)("td", { "data-label": "Gemeldet" }, (0, vue_exports.toDisplayString)(row.at), 1),
											(0, vue_exports.createVNode)("td", { "data-label": "Aktion" }, [(0, vue_exports.createVNode)("button", {
												class: "btn btn--secondary btn--sm",
												type: "button",
												"aria-busy": releasing.value === row.id ? "true" : void 0,
												onClick: ($event) => release(row.id)
											}, "Sperre aufheben", 8, ["aria-busy", "onClick"])])
										]);
									}), 128))])
								])]))
							])
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
//#region resources/js/Pages/Admin/Einstellungen/Email.vue
var _sfc_setup = Email_vue_vue_type_script_setup_true_lang_default.setup;
Email_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Einstellungen/Email.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Email_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Email_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-fcfccb68"]]);
//#endregion
export { Email_default as default };
