//#region resources/js/Pages/Admin/Gutachten/derating.ts
/** Whether the section stands whole: the document prints one, as the record says — or a table is entered anyway. */
function deratingShown(source, rows) {
	return source === "table" || rows > 0;
}
/** The folded line: what is not recorded, why no table is asked for, and — while it can be entered — how to ask for it. */
function deratingAbsent(source, mayEnter) {
	return `Zu diesem Gutachten ist keine Tragfähigkeitstabelle für hohe Geschwindigkeit hinterlegt. ${{
		document: "Laut den Angaben stehen Lastindex und Geschwindigkeitssymbol bei jeder Reifengröße. Eine Tabelle erfasst du nur bei einem Gutachten, das laut den Angaben eine druckt.",
		papers: "Laut den Angaben verweist es für Lastindex und Geschwindigkeitssymbol auf die Fahrzeugpapiere. Eine Tabelle erfasst du nur bei einem Gutachten, das laut den Angaben eine druckt.",
		table: "",
		"": "Ob es eine druckt, gibst du unter „Angaben ändern“ an – in der Frage zu Lastindex und Geschwindigkeitssymbol."
	}[source]}${mayEnter && (source === "document" || source === "papers") ? " Druckt dieses Gutachten doch eine, wähl unter „Angaben ändern“ die Tabelle und trag sie dann hier ein." : ""}`.trim();
}
//#endregion
export { deratingShown as n, deratingAbsent as t };
