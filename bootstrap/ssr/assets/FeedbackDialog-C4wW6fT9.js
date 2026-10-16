import { t as Dialog_default } from "./Dialog-CzCvzZac.js";
import { c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/composables/admin/useAdminShortcuts.ts
/**
* The admin's keyboard, bound once by the layout (docs/design/sections/admin-shell.md §10.2).
*
* ⌘K / Strg K opens the palette anywhere, even inside a field — it is a modifier combination and
* steals nothing. The single keys (`/`, `[`, `?`, and the `g` sequences) fire only when focus is not
* somewhere text is typed, so nobody navigates away mid-sentence.
*
* The `g` sequences go only where the viewer can actually go: a target that is not in their tree —
* not permitted, or not built — is not bound at all, so a shortcut can never lead to a 403.
*/
/**
* The second key of a `g` sequence and where it goes (admin-shell.md §10.2): either one page, or a
* group — meaning that group's first page the viewer has, whichever that is today.
*/
var GO_TARGETS = [
	{
		key: "u",
		page: "/admin"
	},
	{
		key: "b",
		page: "/admin/bestellungen"
	},
	{
		key: "k",
		group: "katalog"
	},
	{
		key: "f",
		group: "fahrzeuge"
	},
	{
		key: "g",
		page: "/admin/gutachten"
	},
	{
		key: "e",
		group: "einstellungen"
	}
];
/** Long enough to type two keys without hurrying; short enough that a stray letter later is not a jump. */
var SEQUENCE_MS = 1200;
/** The `g` targets this viewer has, named the way the rail names them. */
function goTargets(nav) {
	const targets = [];
	for (const target of GO_TARGETS) {
		if (target.page) {
			const page = nav.flatMap((g) => g.pages).find((p) => p.href === target.page);
			if (page) targets.push({
				key: target.key,
				label: page.label,
				href: page.href
			});
			continue;
		}
		const group = nav.find((g) => g.key === target.group);
		const first = group?.pages[0];
		if (group && first) targets.push({
			key: target.key,
			label: group.label,
			href: first.href
		});
	}
	return targets;
}
/** Whether a menu or a dialog is open — reka marks both with `data-state="open"`. */
function overlayOpen() {
	return document.querySelector("[role=\"menu\"][data-state=\"open\"], [role=\"dialog\"][data-state=\"open\"], [role=\"alertdialog\"][data-state=\"open\"]") !== null;
}
/** Whether the keystroke belongs to something being typed. */
function isTyping(target) {
	if (!(target instanceof HTMLElement)) return false;
	return target.isContentEditable || [
		"INPUT",
		"TEXTAREA",
		"SELECT"
	].includes(target.tagName);
}
function useAdminShortcuts(shell, nav) {
	let pendingG = 0;
	function onKeydown(event) {
		const altGr = event.getModifierState("AltGraph");
		const mod = (event.metaKey || event.ctrlKey) && !altGr;
		const alt = event.altKey && !altGr;
		if (mod && !alt && event.key.toLowerCase() === "k") {
			event.preventDefault();
			shell.paletteOpen.value = true;
			return;
		}
		if (mod && !alt && event.key.toLowerCase() === "s") {
			event.preventDefault();
			return;
		}
		if (event.defaultPrevented || mod || event.repeat || isTyping(event.target) || shell.paletteOpen.value || shell.shortcutsOpen.value || overlayOpen()) return;
		if (alt && ![
			"/",
			"?",
			"["
		].includes(event.key)) {
			pendingG = 0;
			return;
		}
		if (pendingG && Date.now() - pendingG <= SEQUENCE_MS) {
			pendingG = 0;
			const target = goTargets(nav.value).find((t) => t.key === event.key.toLowerCase());
			if (target) {
				event.preventDefault();
				router.visit(target.href);
			}
			return;
		}
		pendingG = 0;
		switch (event.key) {
			case "/":
				event.preventDefault();
				shell.paletteOpen.value = true;
				break;
			case "[":
				if (window.matchMedia("(min-width: 1024px)").matches) {
					event.preventDefault();
					shell.toggleRail();
				}
				break;
			case "?":
				event.preventDefault();
				shell.shortcutsOpen.value = true;
				break;
			case "g": pendingG = Date.now();
		}
	}
	(0, vue_exports.onMounted)(() => window.addEventListener("keydown", onKeydown));
	(0, vue_exports.onBeforeUnmount)(() => window.removeEventListener("keydown", onKeydown));
}
//#endregion
//#region resources/js/composables/admin/useFeedback.ts
/**
* The review's feedback button (the review release §3): one point about the screen in front of you,
* sent with where it was made — the address, the window, the browser — and what it looked like.
*
* The screenshot is taken before the dialog opens, so the dialog is not in it; it is the admin's own
* page as far as the window shows it, drawn in the browser (html-to-image) and sent as a PNG. If the browser cannot draw it, the
* point goes without one — the sentence is what matters.
*
* One dialog for the whole panel (FeedbackDialog in the layout); the rail foot, the phone's „Mehr“
* and the `R` key only open it.
*/
var FEEDBACK_TYPES = [
	{
		value: "fehler",
		label: "Fehler"
	},
	{
		value: "design",
		label: "Design"
	},
	{
		value: "text",
		label: "Text"
	},
	{
		value: "wunsch",
		label: "Wunsch"
	}
];
var feedback = (0, vue_exports.reactive)({
	open: false,
	capturing: false,
	screenshot: null,
	url: "",
	viewport: "",
	browser: ""
});
/** `Chrome 128`, `Firefox 131`, `Safari 18` — enough to reproduce, nothing more of the user agent. */
function browserName(agent) {
	for (const [pattern, name] of [
		[/Edg\/(\d+)/, "Edge"],
		[/OPR\/(\d+)/, "Opera"],
		[/Firefox\/(\d+)/, "Firefox"],
		[/Chrome\/(\d+)/, "Chrome"],
		[/Version\/(\d+)[\d.]* .*Safari/, "Safari"]
	]) {
		const m = agent.match(pattern);
		if (m) return `${name} ${m[1]}${/Mobile|Android|iPhone|iPad/.test(agent) ? " (mobil)" : ""}`;
	}
	return agent.slice(0, 60) || "unbekannt";
}
var fontCss = null;
async function fontEmbedCss(root, read) {
	fontCss ??= read(root).catch(() => "");
	return fontCss;
}
/**
* How long the picture may take; after that the point goes without one rather than keep the person waiting. A long
* page on a phone takes several seconds (measured 03.10.2026: up to ~9 s with every image fetched afresh), so this
* is a stop for a picture that never comes, not a budget.
*/
var CAPTURE_TIMEOUT_MS = 3e4;
async function capture() {
	const { toCanvas, getFontEmbedCSS } = await import("./es-CPMBOOog.js");
	const root = document.querySelector(".adm") ?? document.body;
	const fonts = await fontEmbedCss(root, getFontEmbedCSS);
	const width = window.innerWidth;
	const height = window.innerHeight;
	const top = Math.max(0, Math.round(-root.getBoundingClientRect().top));
	const page = await toCanvas(root, {
		width,
		height: top + height,
		canvasWidth: width,
		canvasHeight: top + height,
		pixelRatio: 1,
		cacheBust: false,
		...fonts === "" ? { skipFonts: true } : { fontEmbedCSS: fonts },
		onImageErrorHandler: () => void 0,
		filter: (node) => !(node instanceof HTMLSourceElement) && !(node instanceof HTMLElement && node.dataset.feedbackSkip !== void 0)
	});
	const view = document.createElement("canvas");
	view.width = width;
	view.height = height;
	view.getContext("2d")?.drawImage(page, 0, top, width, height, 0, 0, width, height);
	return view.toDataURL("image/png");
}
async function startFeedback() {
	if (feedback.capturing || feedback.open || typeof window === "undefined") return;
	feedback.capturing = true;
	feedback.url = `${window.location.pathname}${window.location.search}`;
	feedback.viewport = `${window.innerWidth}×${window.innerHeight}`;
	feedback.browser = browserName(window.navigator.userAgent);
	feedback.screenshot = null;
	let timer;
	try {
		feedback.screenshot = await Promise.race([capture(), new Promise((resolve) => {
			timer = setTimeout(() => resolve(null), CAPTURE_TIMEOUT_MS);
		})]);
	} catch {
		feedback.screenshot = null;
	} finally {
		clearTimeout(timer);
		feedback.capturing = false;
		feedback.open = true;
	}
}
//#endregion
//#region resources/js/Components/Admin/FeedbackDialog.vue?vue&type=script&setup=true&lang.ts
var FeedbackDialog_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "FeedbackDialog",
	__ssrInlineRender: true,
	props: { surface: { default: "admin" } },
	setup(__props) {
		/**
		* „Rückmeldung geben“ (the review release §3): one sentence and what kind of point it is — Fehler,
		* Design, Text, Wunsch. The page's address, the window, the browser, the role and a screenshot go
		* with it on their own, and the dialog says so. The `R` key opens it wherever nobody is typing.
		*
		* `surface`: the admin's frame, or the shop's own pages (ShopFeedback, D-142) — the same form in the
		* design system of the page it is opened on.
		*/
		const props = __props;
		const shop = (0, vue_exports.computed)(() => props.surface === "shop");
		const page = usePage();
		const type = (0, vue_exports.ref)("fehler");
		const sentence = (0, vue_exports.ref)("");
		const busy = (0, vue_exports.ref)(false);
		const errors = (0, vue_exports.ref)({});
		const open = (0, vue_exports.computed)({
			get: () => feedback.open,
			set: (value) => feedback.open = value
		});
		let sentenceFor = "";
		(0, vue_exports.watch)(open, (value) => {
			if (value) {
				errors.value = {};
				if (feedback.url !== sentenceFor) {
					sentence.value = "";
					type.value = "fehler";
				}
				sentenceFor = feedback.url;
			}
		});
		/** The server refused the picture: the point can still go, without it. */
		function sendWithout() {
			feedback.screenshot = null;
			send();
		}
		const viewportLabel = (0, vue_exports.computed)(() => feedback.viewport.replace("×", " × "));
		const role = (0, vue_exports.computed)(() => {
			const shared = page.props;
			return shared.admin?.account?.role ?? shared.reviewer?.role ?? null;
		});
		function refused(status) {
			if (status === 401 || status === 403 || status === 419) return "Deine Anmeldung ist abgelaufen. Melde dich im Admin neu an und schick die Rückmeldung dann noch einmal.";
			if (status === 429) return "Das waren viele Rückmeldungen in kurzer Zeit. Warte eine Minute und schick diese dann noch einmal.";
			return "Die Rückmeldung ist nicht angekommen. Dein Satz ist noch da – versuch es gleich noch einmal.";
		}
		function send() {
			if (busy.value) return;
			busy.value = true;
			router.post("/admin/review/rueckmeldungen", {
				type: type.value,
				sentence: sentence.value,
				url: feedback.url,
				viewport: feedback.viewport,
				browser: feedback.browser,
				screenshot: feedback.screenshot
			}, {
				preserveScroll: true,
				preserveState: true,
				onSuccess: () => {
					feedback.open = false;
					sentence.value = "";
					type.value = "fehler";
					feedback.screenshot = null;
				},
				onError: (bag) => errors.value = bag,
				onHttpException: (response) => {
					errors.value = response.status === 413 && feedback.screenshot ? { screenshot: "Das Bildschirmfoto ist zu groß. Schick die Rückmeldung bitte ohne." } : { send: refused(response.status) };
					return false;
				},
				onNetworkError: () => {
					errors.value = { send: "Keine Verbindung zum Server. Dein Satz ist noch da – prüf die Verbindung und versuch es noch einmal." };
					return false;
				},
				onFinish: () => busy.value = false
			});
		}
		let stopNavigate;
		(0, vue_exports.onMounted)(() => {
			stopNavigate = router.on("navigate", (event) => {
				if (feedback.open && event.detail.page.url !== feedback.url) feedback.open = false;
			});
		});
		(0, vue_exports.onBeforeUnmount)(() => stopNavigate?.());
		function onKeydown(event) {
			if (event.key !== "r" && event.key !== "R") return;
			if (event.metaKey || event.ctrlKey || event.altKey || event.repeat || isTyping(event.target) || overlayOpen()) return;
			event.preventDefault();
			startFeedback();
		}
		(0, vue_exports.onMounted)(() => window.addEventListener("keydown", onKeydown));
		(0, vue_exports.onBeforeUnmount)(() => window.removeEventListener("keydown", onKeydown));
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event,
				title: "Rückmeldung geben",
				"content-class": shop.value ? void 0 : "adm-dialog",
				"initial-focus": "#fb-sentence"
			}, _attrs), {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-f12a36d7${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-f12a36d7${_scopeId}>Senden</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: ($event) => open.value = false
					}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						disabled: busy.value,
						"aria-busy": busy.value ? "true" : void 0,
						onClick: send
					}, "Senden", 8, ["disabled", "aria-busy"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<form class="fb" novalidate data-v-f12a36d7${_scopeId}><fieldset class="fb-types" data-v-f12a36d7${_scopeId}><legend class="form-field__label" data-v-f12a36d7${_scopeId}>Worum geht es?</legend><div class="fb-types__row" data-v-f12a36d7${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(FEEDBACK_TYPES), (option) => {
							_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([shop.value ? ["chip", { "chip--on": type.value === option.value }] : "adm-chip", "fb-type"])}" data-v-f12a36d7${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(type.value, option.value)) ? " checked" : ""} class="visually-hidden" type="radio" name="fb-type"${(0, server_renderer_exports.ssrRenderAttr)("value", option.value)} data-v-f12a36d7${_scopeId}> ${(0, server_renderer_exports.ssrInterpolate)(option.label)}</label>`);
						});
						_push(`<!--]--></div></fieldset><div class="form-field" data-v-f12a36d7${_scopeId}><label class="form-field__label" for="fb-sentence" data-v-f12a36d7${_scopeId}>Was ist dir aufgefallen?</label><textarea id="fb-sentence" class="input fb-area" rows="3" maxlength="2000" placeholder="Ein Satz reicht, zum Beispiel: Der Preis steht hier ohne Mehrwertsteuer."${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.sentence ? "true" : void 0)} aria-describedby="fb-sentence-err fb-context" data-v-f12a36d7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(sentence.value)}</textarea><p id="fb-sentence-err" class="form-field__error" aria-live="polite" data-v-f12a36d7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.send ?? errors.value.sentence ?? errors.value.type ?? errors.value.url ?? errors.value.viewport ?? errors.value.browser ?? errors.value.screenshot)}</p>`);
						if (errors.value.screenshot && (0, vue_exports.unref)(feedback).screenshot) _push(`<button class="btn btn--ghost fb-without" type="button" data-v-f12a36d7${_scopeId}>Ohne Bildschirmfoto senden</button>`);
						else _push(`<!---->`);
						_push(`</div><div id="fb-context" class="fb-context" data-v-f12a36d7${_scopeId}>`);
						if ((0, vue_exports.unref)(feedback).screenshot) _push(`<img class="fb-shot"${(0, server_renderer_exports.ssrRenderAttr)("src", (0, vue_exports.unref)(feedback).screenshot)} alt="Bildschirmfoto dieser Seite, wie es mitgeschickt wird" data-v-f12a36d7${_scopeId}>`);
						else _push(`<!---->`);
						_push(`<p class="${(0, server_renderer_exports.ssrRenderClass)(shop.value ? "small muted" : "adm-note")}" data-v-f12a36d7${_scopeId}> Mitgeschickt werden: diese Seite (${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(feedback).url)}), Fenster ${(0, server_renderer_exports.ssrInterpolate)(viewportLabel.value)}, ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(feedback).browser)}`);
						if (role.value) _push(`<!--[-->, deine Rolle „${(0, server_renderer_exports.ssrInterpolate)(role.value)}“<!--]-->`);
						else _push(`<!---->`);
						_push(`${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(feedback).screenshot ? " und das Bildschirmfoto." : ". Ein Bildschirmfoto ließ sich hier nicht machen.")}</p></div></form>`);
					} else return [(0, vue_exports.createVNode)("form", {
						class: "fb",
						novalidate: "",
						onSubmit: (0, vue_exports.withModifiers)(send, ["prevent"])
					}, [
						(0, vue_exports.createVNode)("fieldset", { class: "fb-types" }, [(0, vue_exports.createVNode)("legend", { class: "form-field__label" }, "Worum geht es?"), (0, vue_exports.createVNode)("div", { class: "fb-types__row" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)((0, vue_exports.unref)(FEEDBACK_TYPES), (option) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("label", {
								key: option.value,
								class: ["fb-type", shop.value ? ["chip", { "chip--on": type.value === option.value }] : "adm-chip"]
							}, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								"onUpdate:modelValue": ($event) => type.value = $event,
								class: "visually-hidden",
								type: "radio",
								name: "fb-type",
								value: option.value
							}, null, 8, ["onUpdate:modelValue", "value"]), [[vue_exports.vModelRadio, type.value]]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(option.label), 1)], 2);
						}), 128))])]),
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "fb-sentence"
							}, "Was ist dir aufgefallen?"),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("textarea", {
								id: "fb-sentence",
								"onUpdate:modelValue": ($event) => sentence.value = $event,
								class: "input fb-area",
								rows: "3",
								maxlength: "2000",
								placeholder: "Ein Satz reicht, zum Beispiel: Der Preis steht hier ohne Mehrwertsteuer.",
								"aria-invalid": errors.value.sentence ? "true" : void 0,
								"aria-describedby": "fb-sentence-err fb-context"
							}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, sentence.value]]),
							(0, vue_exports.createVNode)("p", {
								id: "fb-sentence-err",
								class: "form-field__error",
								"aria-live": "polite"
							}, (0, vue_exports.toDisplayString)(errors.value.send ?? errors.value.sentence ?? errors.value.type ?? errors.value.url ?? errors.value.viewport ?? errors.value.browser ?? errors.value.screenshot), 1),
							errors.value.screenshot && (0, vue_exports.unref)(feedback).screenshot ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
								key: 0,
								class: "btn btn--ghost fb-without",
								type: "button",
								onClick: sendWithout
							}, "Ohne Bildschirmfoto senden")) : (0, vue_exports.createCommentVNode)("", true)
						]),
						(0, vue_exports.createVNode)("div", {
							id: "fb-context",
							class: "fb-context"
						}, [(0, vue_exports.unref)(feedback).screenshot ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("img", {
							key: 0,
							class: "fb-shot",
							src: (0, vue_exports.unref)(feedback).screenshot,
							alt: "Bildschirmfoto dieser Seite, wie es mitgeschickt wird"
						}, null, 8, ["src"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)("p", { class: shop.value ? "small muted" : "adm-note" }, [
							(0, vue_exports.createTextVNode)(" Mitgeschickt werden: diese Seite (" + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(feedback).url) + "), Fenster " + (0, vue_exports.toDisplayString)(viewportLabel.value) + ", " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(feedback).browser), 1),
							role.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(", deine Rolle „" + (0, vue_exports.toDisplayString)(role.value) + "“", 1)], 64)) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)((0, vue_exports.unref)(feedback).screenshot ? " und das Bildschirmfoto." : ". Ein Bildschirmfoto ließ sich hier nicht machen."), 1)
						], 2)])
					], 32)];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/FeedbackDialog.vue
var _sfc_setup = FeedbackDialog_vue_vue_type_script_setup_true_lang_default.setup;
FeedbackDialog_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/FeedbackDialog.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var FeedbackDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FeedbackDialog_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f12a36d7"]]);
//#endregion
export { useAdminShortcuts as a, goTargets as i, feedback as n, startFeedback as r, FeedbackDialog_default as t };
