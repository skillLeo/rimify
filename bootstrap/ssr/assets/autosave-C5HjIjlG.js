//#region resources/js/Pages/Admin/Gutachten/Erfassung/autosave.ts
function createAutosave({ content, write, delay, clean }) {
	let saved = null;
	let forced = false;
	let running = null;
	let timer;
	function differs() {
		return saved !== null && (forced || content() !== saved);
	}
	async function flush() {
		clearTimeout(timer);
		while (running !== null) await running;
		if (!differs()) return true;
		const sending = content();
		const sent = forced;
		forced = false;
		running = write().catch(() => false).then((ok) => {
			running = null;
			if (ok) saved = sending;
			else forced = sent;
			return ok;
		});
		return await running ? flush() : false;
	}
	return {
		changed() {
			clearTimeout(timer);
			if (differs()) timer = setTimeout(() => void flush(), delay);
			else if (running === null) clean?.();
		},
		flush,
		mark() {
			clearTimeout(timer);
			saved = content();
			forced = false;
		},
		force() {
			forced = true;
		},
		owed() {
			return running !== null || differs();
		}
	};
}
//#endregion
export { createAutosave as t };
