import { s as __toESM } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
//#region resources/js/composables/useOcr.ts
var OCR_BASE = "/ocr";
var LONGEST_SIDE_PX = 1600;
var CONTRAST = 1.5;
var TIMEOUT_MS = 45e3;
var OCR_PARAMETERS = { debug_file: "/dev/null" };
async function load(file) {
	if (typeof createImageBitmap === "function") {
		const bitmap = await createImageBitmap(file);
		return {
			source: bitmap,
			width: bitmap.width,
			height: bitmap.height,
			release: () => bitmap.close()
		};
	}
	const url = URL.createObjectURL(file);
	const image = new Image();
	await new Promise((resolve, reject) => {
		image.onload = () => resolve();
		image.onerror = () => reject(/* @__PURE__ */ new Error("Bild konnte nicht gelesen werden."));
		image.src = url;
	});
	return {
		source: image,
		width: image.naturalWidth,
		height: image.naturalHeight,
		release: () => URL.revokeObjectURL(url)
	};
}
async function preprocess(file) {
	const drawable = await load(file);
	try {
		const scale = Math.min(1, LONGEST_SIDE_PX / Math.max(drawable.width, drawable.height));
		const canvas = document.createElement("canvas");
		canvas.width = Math.max(1, Math.round(drawable.width * scale));
		canvas.height = Math.max(1, Math.round(drawable.height * scale));
		const context = canvas.getContext("2d", { willReadFrequently: true });
		if (context === null) throw new Error("Kein Canvas.");
		context.drawImage(drawable.source, 0, 0, canvas.width, canvas.height);
		const image = context.getImageData(0, 0, canvas.width, canvas.height);
		const data = image.data;
		for (let i = 0; i < data.length; i += 4) {
			const luminance = .299 * (data[i] ?? 0) + .587 * (data[i + 1] ?? 0) + .114 * (data[i + 2] ?? 0);
			const value = Math.max(0, Math.min(255, (luminance - 128) * CONTRAST + 128));
			data[i] = value;
			data[i + 1] = value;
			data[i + 2] = value;
		}
		context.putImageData(image, 0, 0);
		return canvas;
	} finally {
		drawable.release();
	}
}
function withTimeout(promise, ms) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(/* @__PURE__ */ new Error("Zeitüberschreitung.")), ms);
		promise.then((value) => {
			clearTimeout(timer);
			resolve(value);
		}, (error) => {
			clearTimeout(timer);
			reject(error instanceof Error ? error : new Error(String(error)));
		});
	});
}
function useOcr() {
	let worker = null;
	let generation = 0;
	async function recognise(file) {
		const mine = generation;
		const canvas = await preprocess(file);
		const { createWorker, PSM } = await import("./src-Bw1n3AZ9.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1));
		if (worker === null) {
			const created = await createWorker("deu", 1, {
				workerPath: `${OCR_BASE}/worker.min.js`,
				corePath: OCR_BASE,
				langPath: OCR_BASE,
				workerBlobURL: false,
				gzip: true,
				errorHandler: () => {}
			});
			if (mine !== generation) {
				created.terminate();
				throw new Error("Abgebrochen.");
			}
			worker = created;
			await worker.setParameters({
				tessedit_pageseg_mode: PSM.AUTO,
				...OCR_PARAMETERS
			});
		}
		const { data } = await worker.recognize(canvas);
		return data.text;
	}
	function dispose() {
		generation++;
		worker?.terminate();
		worker = null;
	}
	(0, vue_exports.onBeforeUnmount)(dispose);
	return {
		read: (file) => withTimeout(recognise(file), TIMEOUT_MS),
		dispose
	};
}
//#endregion
export { useOcr as t };
