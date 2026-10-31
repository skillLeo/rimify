/**
 * The Gutachten sketch's data, in memory only (the Gutachten rework brief §11, Phase 1): the example of the proposal — the
 * Nachtrag N1 to ABE 53841, Borbet DB8GT2 8,5 × 18 ET 35, and its rows for the BMW M3, X3 and Z3. The codes are the ones
 * the acceptance set holds for that paper (database/seeders/content/abnahme/gutachten.php), as printed; three are left
 * undescribed on purpose, so the sketch can show what happens to a code nobody has described yet. Cars, HSN/TSN and the
 * tyres of the X3 and Z3 rows are examples.
 */

import { decimal, withUnit } from '../../../format'

export type KindValue =
    | 'abnahme'
    | 'karosseriearbeit'
    | 'karosserieform'
    | 'antrieb'
    | 'befestigung'
    | 'reifen_tragfaehigkeit'
    | 'reifen_achse'
    | 'reifen_kombination'
    | 'tacho'
    | 'verbot'
    | 'hinweis'
    | 'nacharbeitsprofil'

export type LevelValue = 'hinweis' | 'auflage' | 'nicht_zulaessig'

/** The kinds as the admin names them (ConditionKind::labelDe), with the one value a kind needs. */
export const KINDS: { value: KindValue; label: string; needs?: string }[] = [
    { value: 'abnahme', label: 'Abnahme durch einen Prüfer' },
    { value: 'karosseriearbeit', label: 'Arbeit an der Karosserie' },
    { value: 'karosserieform', label: 'Nur für bestimmte Karosserieformen', needs: 'Karosserieformen' },
    { value: 'antrieb', label: 'Nur mit / ohne bestimmten Antrieb', needs: 'Antrieb' },
    { value: 'befestigung', label: 'Befestigungsmittel' },
    { value: 'reifen_tragfaehigkeit', label: 'Reifen: Tragfähigkeit', needs: 'Achslast in kg' },
    { value: 'reifen_achse', label: 'Reifen: nur auf einer Achse', needs: 'Achse' },
    { value: 'reifen_kombination', label: 'Reifen: erlaubte Kombinationen' },
    { value: 'tacho', label: 'Tachometer prüfen' },
    { value: 'verbot', label: 'Verbot' },
    { value: 'hinweis', label: 'Hinweis' },
    { value: 'nacharbeitsprofil', label: 'Nacharbeit mit Maßen' },
]

export const LEVELS: { value: LevelValue; label: string }[] = [
    { value: 'hinweis', label: 'Hinweis' },
    { value: 'auflage', label: 'Auflage' },
    { value: 'nicht_zulaessig', label: 'Nicht zulässig' },
]

/** An Abnahme or work on the body is always at least an Auflage (ConditionLevel::floorFor). */
export function levelFloor(kind: KindValue | null): LevelValue {
    return kind === 'abnahme' || kind === 'karosseriearbeit' ? 'auflage' : 'hinweis'
}

export interface PaperCode {
    code: string
    kind: KindValue | null
    level: LevelValue | null
    /** As printed; null while nobody has described it. */
    text: string | null
    page: number | null
}

export const PAPER = {
    kind: 'ABE',
    number: '53841',
    supplement: 'Nachtrag 366-0350-21-WIRD/N1',
    issuer: 'TÜV Austria',
    issuedOn: '2025-07-02',
    file: 'DB8GT2-8518_18_abe.pdf',
    pages: 24,
}

export interface WheelSize {
    id: string
    diameter: number
    width: number
    et: number
    holes: number
    circle: number
    bore: number
    colours: { name: string; hex: string }[]
}

export interface DemoWheel {
    id: string
    brand: string
    model: string
    sizes: WheelSize[]
}

const SCHWARZ = { name: 'Schwarz matt', hex: '#26282B' }
const BRONZE = { name: 'Bronze matt', hex: '#7C6142' }

export const WHEELS: DemoWheel[] = [
    {
        id: 'db8gt2',
        brand: 'Borbet',
        model: 'DB8GT2',
        sizes: [
            { id: 'db8gt2-18', diameter: 18, width: 8.5, et: 35, holes: 5, circle: 120, bore: 72.5, colours: [SCHWARZ, BRONZE] },
            { id: 'db8gt2-19', diameter: 19, width: 8.5, et: 35, holes: 5, circle: 120, bore: 72.6, colours: [SCHWARZ, BRONZE] },
            { id: 'db8gt2-18-112', diameter: 18, width: 8, et: 40, holes: 5, circle: 112, bore: 66.6, colours: [SCHWARZ] },
        ],
    },
    {
        id: 'lm124',
        brand: 'BBS',
        model: 'LeMans LM124',
        sizes: [
            { id: 'lm124-18', diameter: 18, width: 8.5, et: 30, holes: 5, circle: 120, bore: 72.5, colours: [{ name: 'Black Gloss', hex: '#141518' }, { name: 'Blue Gloss', hex: '#1F3E73' }] },
        ],
    },
]

/** The paper's own wheel data, as printed on page 1, beside the choice. */
export const PAPER_WHEEL = 'Radgröße 8 1/2 J × 18 H2 · Einpresstiefe 35 · Lochkreis 120/5 · Mittenloch 72,5'

export type Provenance = 'import' | 'gutachten' | 'manuell' | 'entwicklung'

export interface DemoCar {
    id: string
    name: string
    hsn: string
    tsn: string
    kw: number | null
    k: string
    provenance: Provenance
}

export interface DemoGroup {
    id: string
    sales: string
    type: string
    approvals: string[]
    kwMin: number
    kwMax: number
    /** The row's plain text, as printed: „Pkw geschlossen; Cabrio;". */
    notes: string
    page: number
    cars: DemoCar[]
    /** Cars whose field K matches but which carry no kW: never linked by the range, offered to add by hand. */
    withoutKw: DemoCar[]
}

export const GROUPS: DemoGroup[] = [
    {
        id: 'm3',
        sales: 'BMW M3',
        type: 'M3B',
        approvals: ['G191'],
        kwMin: 210,
        kwMax: 217,
        notes: 'Pkw geschlossen; Cabrio;',
        page: 6,
        cars: [
            { id: 'm3-1', name: 'BMW M3 Coupé 3.0', hsn: '0005', tsn: '563', kw: 210, k: 'G191', provenance: 'import' },
            { id: 'm3-2', name: 'BMW M3 Cabrio 3.2', hsn: '0005', tsn: '590', kw: 217, k: 'G191', provenance: 'import' },
        ],
        withoutKw: [],
    },
    {
        id: 'x3',
        sales: 'BMW X3',
        type: 'X83',
        approvals: ['e1*2001/116*0249*..'],
        kwMin: 100,
        kwMax: 210,
        notes: 'Allradantrieb;',
        page: 6,
        cars: [
            { id: 'x3-1', name: 'BMW X3 (E83) 2.0i', hsn: '0005', tsn: 'AHH', kw: 110, k: 'e1*2001/116*0249*00', provenance: 'import' },
            { id: 'x3-2', name: 'BMW X3 (E83) 2.5i', hsn: '0005', tsn: 'AHJ', kw: 141, k: 'e1*2001/116*0249*00', provenance: 'import' },
            { id: 'x3-3', name: 'BMW X3 (E83) 3.0i', hsn: '0005', tsn: 'AHK', kw: 170, k: 'e1*2001/116*0249*02', provenance: 'import' },
            { id: 'x3-4', name: 'BMW X3 (E83) 2.0d', hsn: '0005', tsn: 'AHL', kw: 110, k: 'e1*2001/116*0249*04', provenance: 'gutachten' },
            { id: 'x3-5', name: 'BMW X3 (E83) 3.0d', hsn: '0005', tsn: 'AHM', kw: 150, k: 'e1*2001/116*0249*04', provenance: 'import' },
            { id: 'x3-6', name: 'BMW X3 (E83) 3.0sd', hsn: '0005', tsn: 'AHN', kw: 210, k: 'e1*2001/116*0249*07', provenance: 'entwicklung' },
        ],
        withoutKw: [{ id: 'x3-7', name: 'BMW X3 (E83) 2.0d xDrive', hsn: '0005', tsn: 'AHP', kw: null, k: 'e1*2001/116*0249*09', provenance: 'gutachten' }],
    },
    {
        id: 'z3',
        sales: 'BMW Z3',
        type: 'R/C',
        approvals: ['e1*93/81*0029*..'],
        kwMin: 85,
        kwMax: 170,
        notes: 'Roadster; Coupé;',
        page: 7,
        cars: [
            { id: 'z3-1', name: 'BMW Z3 Roadster 1.8', hsn: '0005', tsn: '692', kw: 85, k: 'e1*93/81*0029*08', provenance: 'entwicklung' },
            { id: 'z3-2', name: 'BMW Z3 Roadster 2.2i', hsn: '0005', tsn: '717', kw: 125, k: 'e1*93/81*0029*12', provenance: 'import' },
            { id: 'z3-3', name: 'BMW Z3 Coupé 3.0i', hsn: '0005', tsn: '718', kw: 170, k: 'e1*93/81*0029*12', provenance: 'import' },
        ],
        withoutKw: [],
    },
]

/** A row of the paper with no car in the database yet: „Fahrzeug anlegen", in the flow. */
export const EMPTY_ROW = {
    id: 'e46',
    sales: 'BMW 3er',
    type: '3/B',
    approvals: ['e1*93/81*0016*..'],
    kwMin: 75,
    kwMax: 142,
    notes: 'Limousine; Stufenheck;',
    page: 7,
}

/** The paper's codes as printed (the acceptance set's Nachtrag N1); 721, 725 and 74A not yet described. */
export const CODES: PaperCode[] = [
    { code: '10B', kind: 'hinweis', level: 'hinweis', page: 10, text: 'Die mindestens erforderlichen Geschwindigkeitsbereiche der zu verwendenden Reifen sind, mit Ausnahme der Winterreifen Profile, den Fahrzeugpapieren zu entnehmen. Die für gesetzeskonforme Winterreifen zulässige Höchstgeschwindigkeit ist im Blickfeld des Fahrzeugführer sinnfällig anzugeben und im Betrieb nicht zu überschreiten.' },
    { code: '11A', kind: 'abnahme', level: 'auflage', page: 10, text: 'Der vorschriftsmäßige Zustand des Fahrzeuges ist durch einen amtlich anerkannten Sachverständigen oder Prüfer für den Kraftfahrzeugverkehr oder einen Prüfingenieur einer Überwachungsorganisation oder einen Angestellten nach Abschnitt 4 der Anlage VIIIb zur StVZO unter Angabe von FAHRZEUGHERSTELLER, FAHRZEUGTYP und FAHRZEUGIDENTIFIZIERUNGSNUMMER auf einem Nachweis entsprechend dem im Beispielkatalog zum §19 StVZO veröffentlichten Muster bescheinigen zu lassen.' },
    { code: '11B', kind: 'hinweis', level: 'hinweis', page: 11, text: 'Wird eine in diesem Gutachten aufgeführte Reifengröße verwendet, die nicht bereits in der Fahrzeuggenehmigung für diesen Fahrzeug-Typ/ -Variante/ -Version bzw. Fahrzeugausführung genannt ist, so sind die Angaben über die Reifengrößen in den Fahrzeugpapieren bei der nächsten Befassung mit den Fahrzeugpapieren durch die Zulassungsstelle berichtigen zu lassen.' },
    { code: '11G', kind: 'hinweis', level: 'hinweis', page: 11, text: 'Die Brems-, Lenkungsaggregate und das Fahrwerk mit Ausnahme von Sonder-Fahrwerksfedern müssen, sofern diese durch keine weiteren Auflagen berührt werden, dem Serienstand entsprechen.' },
    { code: '11H', kind: 'hinweis', level: 'hinweis', page: 11, text: 'Wird das serienmäßige Ersatzrad verwendet, soll mit mäßiger Geschwindigkeit und nicht länger als erforderlich gefahren werden. Hierbei müssen die serienmäßigen Befestigungsteile verwendet werden.' },
    { code: '12A', kind: 'verbot', level: 'hinweis', page: 11, text: 'Die Verwendung von Schneeketten ist nicht möglich, es sei denn, dass für den hier aufgeführten Fahrzeugtyp eine weitere Umrüstmöglichkeit im Gutachten aufgeführt ist.' },
    { code: '21B', kind: 'karosseriearbeit', level: 'auflage', page: 11, text: 'Durch Anlegen der vorderen Radhausausschnittkanten und Kunststoffinnenkotflügel über die gesamte Radhausausschnittkantenlänge ist die Freigängigkeit der Rad/Reifen-Kombination herzustellen.' },
    { code: '22B', kind: 'karosseriearbeit', level: 'auflage', page: 11, text: 'Durch Anlegen bzw. Bearbeiten der hinteren Radhausausschnittkanten und Kunststoffinnenkotflügel über die gesamte Radhausausschnittkantenlänge ist die Freigängigkeit der Rad/Reifen-Kombination herzustellen.' },
    { code: '22F', kind: 'karosseriearbeit', level: 'auflage', page: 11, text: 'Durch Aufweiten bzw. Ausstellen der hinteren Radhäuser im Bereich der Radaußenseite über die gesamte Radhausausschnittkantenlänge ist die Freigängigkeit der Rad/Reifen-Kombination herzustellen.' },
    { code: '24D', kind: 'karosseriearbeit', level: 'auflage', page: 13, text: 'Die Radabdeckung an Achse 2 ist durch Ausstellen der Heckschürze und des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 30 Grad vor der Radmitte und 50 Grad hinter der Radmitte herzustellen.' },
    { code: '24J', kind: 'karosseriearbeit', level: 'auflage', page: 13, text: 'Die Radabdeckung an Achse 1 ist durch Ausstellen der Frontschürze und des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 30 Grad vor der Radmitte und 50 Grad hinter der Radmitte herzustellen.' },
    { code: '51A', kind: 'hinweis', level: 'hinweis', page: 14, text: 'Der vom Fahrzeughersteller (siehe Betriebsanleitung oder Reifenfülldruckhinweis am Fahrzeug) bzw. Reifenhersteller vorgeschriebene Reifenfülldruck ist zu beachten.' },
    { code: '57E', kind: 'reifen_achse', level: 'auflage', page: 14, text: 'Die Verwendung der angegebenen Reifengröße ist auf dieser Radgröße nur an der Vorderachse zulässig. Sie kann jedoch im Einzelfall auf einer anderen Radgröße an der Hinterachse kombiniert werden.' },
    { code: '57F', kind: 'reifen_achse', level: 'auflage', page: 14, text: 'Die Verwendung der angegebenen Reifengröße ist auf dieser Radgröße nur an der Hinterachse zulässig. Sie kann jedoch im Einzelfall auf einer anderen Radgröße an der Vorderachse kombiniert werden.' },
    { code: '68B', kind: 'reifen_kombination', level: 'hinweis', page: 15, text: 'Folgende Rad/Reifen-Kombination ist zulässig: Reifengröße: Vorderachse: 225/40R18 Hinterachse: 255/35R18 Ist eine der beiden Reifengrößen im Gutachten nicht aufgeführt, so ist die nicht aufgeführte Reifengröße nur auf einer anderen Felgengröße zulässig. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten. An Fahrzeugausführungen mit automatischem Blockierverhinderer (ABV) bzw. Antriebsschlupfregelung (ASR) dürfen nur Reifen verwendet werden, deren Differenz im Abrollumfang kleiner als 1% ist. Es ist eine Bestätigung des Reifenherstellers über die tatsächlichen Abrollumfänge erforderlich; es wird empfohlen den Nachweis der Eignung bei den Fahrzeugpapieren mitzuführen. Alle an ein und derselben Achse montierten Reifen müssen vom gleichen Reifentyp sein.' },
    { code: '71C', kind: 'hinweis', level: 'hinweis', page: 16, text: 'Zum Auswuchten der Sonderräder dürfen an der Felgeninnenseite nur Klebegewichte angebracht werden.' },
    { code: '71K', kind: 'hinweis', level: 'hinweis', page: 16, text: 'Zum Auswuchten dürfen nur Klebegewichte unterhalb des Tiefbetts an der Felgeninnenseite angebracht werden.' },
    { code: '73C', kind: 'hinweis', level: 'hinweis', page: 16, text: 'Es ist nur die Verwendung von schlauchlosen Reifen zulässig.' },
    { code: '721', kind: null, level: null, page: null, text: null },
    { code: '725', kind: null, level: null, page: null, text: null },
    { code: '74A', kind: null, level: null, page: null, text: null },
]

/**
 * What the paper prints that the sketch has not recorded: the three codes nobody described yet, on their pages, and the
 * rows of its Verwendungsbereich as the PDF panel's placeholder pages show them.
 */
export const PRINTED_ONLY: Record<string, { page: number; text: string }> = {
    '721': { page: 16, text: 'Es ist nur die Verwendung von Gummiventilen oder Metallschraubventilen mit Überwurfmutter von außen, die weitgehend den Normen (DIN, E.T.R.T.O. bzw. Tire and Rim) entsprechen und die für einen Ventilloch-Nenndurchmesser von 11,3 mm geeignet sind, zulässig. Das Ventil darf nicht über den Felgenrand hinausragen.' },
    '725': { page: 16, text: 'Bei Fahrzeugen mit einer bauartbedingten Höchstgeschwindigkeit über 210 km/h sind nur Metallschraubventile zulässig. Es sind die Montagehinweise des Ventilherstellers zu beachten.' },
    '74A': { page: 17, text: 'Es dürfen nur die vom Radhersteller mitzuliefernden Radbefestigungsteile verwendet werden, dabei ist die Gewindegröße der serienmäßigen Befestigungsteile zu beachten.' },
}

export interface PrintedRow {
    group: string
    type: string
    approval: string
    kw: string
    tyres: { size: string; codes: string }[]
    general: string
}

export const PRINTED_ROWS: Record<number, PrintedRow[]> = {
    6: [
        { group: 'BMW M3', type: 'M3B', approval: 'G191', kw: '210-217', tyres: [{ size: '225/40R18 88W', codes: '11A; 21B; 24J; 57E; 68B' }, { size: '255/35R18 90W', codes: '11A; 22B; 22F; 24D; 57F; 68B' }], general: '10B 11B 11G 11H 12A 51A 71C 71K 721 725 73C 74A; Pkw geschlossen; Cabrio;' },
        { group: 'BMW X3', type: 'X83', approval: 'e1*2001/116*0249*..', kw: '100-210', tyres: [{ size: '235/50R18', codes: '' }, { size: '245/45R18 100', codes: '' }, { size: '245/45R18 96W', codes: '' }, { size: '255/45R18 99', codes: '' }], general: '10B 11B 11G 11H 12A 51A 71C 71K 721 725 73C 74A 75I; Allradantrieb;' },
    ],
    7: [
        { group: 'BMW Z3', type: 'R/C', approval: 'e1*93/81*0029*..', kw: '85-170', tyres: [{ size: '225/40R18-88 (85-142 kW)', codes: '11A; 21B' }, { size: '245/35R18 88 (85-170 kW)', codes: '11A; 22B' }, { size: '255/35R18-90 (85-170 kW)', codes: '11A; 22B; 22F' }, { size: '225/40R18 88 (170 kW)', codes: '11A' }], general: '10B 11B 12A 71C 73C 74A; Roadster; Coupé;' },
        { group: 'BMW 3er', type: '3/B', approval: 'e1*93/81*0016*..', kw: '75-142', tyres: [{ size: '225/40R18 88W', codes: '11A; 21B' }, { size: '235/40R18 91', codes: '11A; 21B; 22B' }], general: '10B 11B 12A 71C 73C 74A; Limousine; Stufenheck;' },
    ],
}

/** The page headings of the placeholder PDF, where the sketch knows one. */
export const PAGE_TITLES: Record<number, string> = {
    1: 'Gutachten 366-0350-21-WIRD/N1 · Raddaten',
    2: 'Befestigungsteile und Anzugsmomente',
    6: 'Verwendungsbereich',
    7: 'Verwendungsbereich (Fortsetzung)',
    10: 'Auflagen und Hinweise',
}

export interface TyreLine {
    id: number
    text: string
    codes: string[]
    /** `85-142`, as the paper prints a band beside a size; empty for the whole row. */
    kw: string
    axle: 'ALL' | 'FRONT' | 'REAR'
}

export interface PairLine {
    id: number
    front: string
    rear: string
    codes: string[]
}

export interface Cell {
    groupId: string
    tyres: TyreLine[]
    pairs: PairLine[]
    general: string[]
    page: string
    /** „kopiert von BMW M3" until the cell is edited. */
    copiedFrom: string | null
}

export function initialCells(): Cell[] {
    return [
        {
            groupId: 'm3',
            tyres: [
                { id: 1, text: '225/40 R18 88W', codes: ['11A', '21B', '24J', '57E', '68B'], kw: '', axle: 'ALL' },
                { id: 2, text: '255/35 R18 90W', codes: ['11A', '22B', '22F', '24D', '57F', '68B'], kw: '', axle: 'ALL' },
            ],
            pairs: [{ id: 3, front: '225/40 R18', rear: '255/35 R18', codes: ['68B'] }],
            general: ['10B', '11B', '11G', '11H', '12A', '51A', '71C', '71K', '721', '725', '73C', '74A'],
            page: '6',
            copiedFrom: null,
        },
        { groupId: 'x3', tyres: [], pairs: [], general: [], page: '', copiedFrom: null },
        { groupId: 'z3', tyres: [], pairs: [], general: [], page: '', copiedFrom: null },
    ]
}

/** What „Beispiel einsetzen" puts into „Mehrere einfügen" for a row: the paper's lines, as staff would paste them. */
export const PASTE_EXAMPLES: Record<string, string> = {
    m3: '225/40R18 88W\n255/35R18 90W\n225/40R18 – 255/35R18',
    x3: '235/50R18\n245/45R18 100\n245/45R18 96W\n255/45R18 99',
    z3: '225/40R18-88\n245/35R18 88\n255/35R18-90\nNr. 1: 225/40R18 – 255/35R18',
    e46: '225/40R18 88W\n235/40R18 91',
}

/** Where a car's data came from, as the release door reads it: an import, a paper, a check by hand — or none on record. */
export function provenanceLabel(provenance: Provenance): string {
    return {
        import: 'aus einem Import der Fahrzeugdaten',
        gutachten: 'aus einem Gutachten',
        manuell: 'von Hand geprüft',
        entwicklung: 'aus den Entwicklungsdaten',
    }[provenance]
}

export function documented(provenance: Provenance): boolean {
    return provenance !== 'entwicklung'
}

/** `8,5 × 18 · ET 35 · 5 × 120` — a wheel size as the flow names it. */
export function sizeName(size: Pick<WheelSize, 'diameter' | 'width' | 'et' | 'holes' | 'circle'>): string {
    return `${widthText(size.width)} × ${size.diameter} · ET ${size.et} · ${size.holes} × ${size.circle}`
}

/** `8,5`, `9` — a rim width as the paper and the admin write it. */
export function widthText(width: number): string {
    return decimal(width, Number.isInteger(width) ? 0 : 1)
}

/** `210–217 kW` — a power band as the paper prints it, the unit held to the figures (R-10). */
export function kwRange(min: number | string, max?: number | string): string {
    return withUnit(max === undefined ? String(min) : `${min}–${max}`, 'kW')
}

/** `1 Fahrzeug` · `6 Fahrzeuge` */
export function carCount(n: number): string {
    return n === 1 ? '1 Fahrzeug' : `${n} Fahrzeuge`
}

/** `BMW M3 · M3B · G191 · 210–217 kW` */
export function groupName(group: Pick<DemoGroup, 'sales' | 'type' | 'approvals' | 'kwMin' | 'kwMax'>): string {
    return `${group.sales} · ${group.type} · ${group.approvals.join(', ')} · ${kwRange(group.kwMin, group.kwMax)}`
}
