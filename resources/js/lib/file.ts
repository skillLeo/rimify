/**
 * A chosen file, checked before it is sent. The browser keeps a chosen file as it was when it was chosen; once it
 * is saved anew on disk — made smaller after a refusal, say — Chromium refuses to send it, and the request fails as
 * if the connection were gone (K2-29). Reading its first byte asks the same question beforehand, so the form can
 * ask for the file again instead.
 */
export const FILE_CHANGED = 'Die Datei hat sich geändert, seit du sie ausgewählt hast. Wähl sie bitte noch einmal aus.'

export async function stillReadable(file: File): Promise<boolean> {
    try {
        await file.slice(0, 1).arrayBuffer()

        return true
    } catch {
        return false
    }
}
