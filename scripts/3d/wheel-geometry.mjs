// The parametric alloy wheel — geometry only, in millimetres, the axle along +Z (the outer face
// toward +Z, i.e. toward a camera on the positive axis). No textures: the finish is a PBR metal
// parameter set applied at runtime. Nothing here reproduces a trademarked design: a plain
// flange, a drop-centre barrel, N straight chamfered spokes on a concave face, a five-hole hub
// on the catalogue's bolt circle, and a plain domed cap.
//
// Used by build-wheel.mjs (Node → GLB) and by render-frames.mjs (Playwright → image sequence).
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** @typedef {{ widthIn: number, diameterIn: number, etMm: number, spokes: number, boltHoles: number, boltCircleMm: number, boreMm: number }} WheelParams */

/** The hero product's own configuration; the CLI can override any of them. */
export const WHEEL_DEFAULTS = Object.freeze({
    widthIn: 8.5,
    diameterIn: 19,
    etMm: 35,
    spokes: 10,
    boltHoles: 5,
    boltCircleMm: 112,
    boreMm: 66.6,
})

const FLANGE_MM = 14 // the lip stands this far above the bead seat
const WALL_MM = 4 // barrel wall thickness
const LATHE_SEGMENTS = 128
const SPOKE_RINGS = 18

/**
 * Derived dimensions every part agrees on. `rimRadiusMm` is the flange's outer radius — the
 * silhouette a camera sees face-on — and `lipZMm` where that silhouette sits along the axle.
 * @param {WheelParams} p
 */
export function wheelDimensions(p) {
    const seatRadius = (p.diameterIn * 25.4) / 2
    const halfWidth = (p.widthIn * 25.4) / 2
    const rimRadiusMm = seatRadius + FLANGE_MM
    // The mounting face sits `et` outboard of the centre plane; the whole wheel is modelled with
    // the centre plane at z = 0, so the hub's back (the mounting face) is near +et and the outer
    // lip at +halfWidth. The hub is a raised boss whose face is flush with the spoke roots' top
    // faces, so the spokes flow out of its rim instead of lying on it.
    const hubBackZ = p.etMm - 5
    const hubFaceZ = p.etMm + 21
    const hubRadiusMm = Math.max(p.boltCircleMm / 2 + 30, p.boreMm / 2 + 44)

    return {
        seatRadius,
        halfWidth,
        rimRadiusMm,
        lipZMm: halfWidth - 4,
        hubRadiusMm,
        hubFaceZ,
        hubBackZ,
        boltRadius: 7.5,
        spokeInnerR: hubRadiusMm - 6,
        spokeOuterR: seatRadius - 2,
        // The spoke's centreline at the root: its 24 mm depth puts the top face 0,8 mm proud of the
        // boss, so the root's chamfer never lies in the boss face's plane.
        spokeHubZ: hubFaceZ - 12 + 0.8,
        spokeRimZ: halfWidth - 24,
    }
}

/** A lathe profile point; (r, z) → THREE.Vector2(x = r, y = z) so the lathe turns about Y, mapped to Z afterwards. */
function P(r, z) {
    return new THREE.Vector2(r, z)
}

/** Rotate a lathe (about Y) so its axis is Z, with the profile's +z toward +Z. */
function latheAboutZ(points, segments = LATHE_SEGMENTS) {
    const g = new THREE.LatheGeometry(points, segments, 0, Math.PI * 2)
    // (x, y, z) → (x, −z, y): the profile's y (our z) becomes Z, and the turn stays right-handed.
    g.rotateX(Math.PI / 2)
    g.computeVertexNormals()

    return g
}

/**
 * The barrel: front flange, bead seat, safety hump, drop centre, and the same back to the rear
 * flange; then the inner wall traced back, `WALL_MM` thinner, so the mesh is closed and the inside
 * of the barrel shows through the spoke windows. Corner points are doubled so the lathe's smooth
 * normals break there and the lip reads as an edge.
 * @param {ReturnType<typeof wheelDimensions>} d
 */
export function rimGeometry(d) {
    const R = d.rimRadiusMm
    const S = d.seatRadius
    const H = d.halfWidth

    const outer = [
        P(R - 3, H), // flange tip, rounded
        P(R, H - 3),
        P(R, H - 8),
        P(R, H - 8),
        P(S + 4, H - 12),
        P(S, H - 14),
        P(S, H - 14),
        P(S, H - 24), // bead seat
        P(S - 3, H - 28), // safety hump
        P(S - 3, H - 28),
        P(S - 6, H - 38),
        P(S - 20, H - 52),
        P(S - 24, H - 60), // well floor front
        P(S - 24, -H + 40), // well floor rear
        P(S - 18, -H + 30),
        P(S - 6, -H + 24),
        P(S - 3, -H + 20),
        P(S, -H + 14),
        P(S, -H + 14),
        P(S + 4, -H + 12),
        P(R, -H + 8),
        P(R, -H + 8),
        P(R, -H + 3),
        P(R - 3, -H),
    ]

    // The inner wall: the same path, `WALL_MM` inward radially, back to the front tip.
    const inner = outer
        .slice()
        .reverse()
        .map((v) => P(v.x - WALL_MM, v.y))

    return latheAboutZ([...outer, ...inner, outer[0]])
}

/**
 * One spoke: a chamfered bar swept from the hub face out to the barrel along a shallow bowl
 * (the face is concave), tapering in width and depth. Eight side strips with their own vertices
 * so the chamfers stay crisp while each face is smooth along its length; two end caps close it.
 * @param {ReturnType<typeof wheelDimensions>} d
 */
export function spokeGeometry(d) {
    const rings = SPOKE_RINGS
    const centre = (t) => {
        const r = THREE.MathUtils.lerp(d.spokeInnerR, d.spokeOuterR, t)
        // Concave: deepest at the hub, rising toward the lip with a soft knee.
        const z = THREE.MathUtils.lerp(d.spokeHubZ, d.spokeRimZ, Math.pow(t, 1.55))

        return new THREE.Vector3(r, 0, z)
    }
    const width = (t) => THREE.MathUtils.lerp(30, 21, t)
    const depth = (t) => THREE.MathUtils.lerp(24, 18, t)
    const chamfer = 2.4

    /** The eight corners of the cross-section in (u along the wheel's tangent, v along the face normal). */
    const corners = (w, h) => [
        [-w / 2 + chamfer, -h / 2],
        [w / 2 - chamfer, -h / 2],
        [w / 2, -h / 2 + chamfer],
        [w / 2, h / 2 - chamfer],
        [w / 2 - chamfer, h / 2],
        [-w / 2 + chamfer, h / 2],
        [-w / 2, h / 2 - chamfer],
        [-w / 2, -h / 2 + chamfer],
    ]

    const frames = []
    for (let k = 0; k < rings; k++) {
        const t = k / (rings - 1)
        const c = centre(t)
        const tangent = centre(Math.min(1, t + 0.001)).sub(centre(Math.max(0, t - 0.001))).normalize()
        const N = new THREE.Vector3(0, 1, 0)
        const B = new THREE.Vector3().crossVectors(tangent, N).normalize()
        frames.push({ c, N, B, corners: corners(width(t), depth(t)) })
    }

    const parts = []

    // Eight strips, one per side face.
    for (let s = 0; s < 8; s++) {
        const positions = []
        const indices = []
        for (let k = 0; k < rings; k++) {
            const f = frames[k]
            for (const ci of [s, (s + 1) % 8]) {
                const [u, v] = f.corners[ci]
                const p = f.c.clone().addScaledVector(f.N, u).addScaledVector(f.B, v)
                positions.push(p.x, p.y, p.z)
            }
        }
        for (let k = 0; k < rings - 1; k++) {
            const a = k * 2
            const b = a + 1
            const c = a + 2
            const dd = a + 3
            indices.push(a, c, b, b, c, dd)
        }
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
        g.setIndex(indices)
        g.computeVertexNormals()
        parts.push(g)
    }

    // End caps (fans), wound so their normals point outward along the sweep.
    for (const [k, flip] of [
        [0, true],
        [rings - 1, false],
    ]) {
        const f = frames[k]
        const positions = []
        for (const [u, v] of f.corners) {
            const p = f.c.clone().addScaledVector(f.N, u).addScaledVector(f.B, v)
            positions.push(p.x, p.y, p.z)
        }
        const indices = []
        for (let i = 1; i < 7; i++) {
            indices.push(0, flip ? i + 1 : i, flip ? i : i + 1)
        }
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
        g.setIndex(indices)
        g.computeVertexNormals()
        parts.push(g)
    }

    return mergeGeometries(parts, false)
}

/**
 * All spokes: copies of one spoke about Z. The first spoke stands at 0° so a five-hole bolt ring
 * placed at 90° + k · 72° never coincides with a spoke root when N is even.
 * @param {ReturnType<typeof wheelDimensions>} d
 */
export function spokesGeometry(d, spokes) {
    const one = spokeGeometry(d)
    const copies = []
    for (let i = 0; i < spokes; i++) {
        const g = one.clone()
        g.rotateZ((i / spokes) * Math.PI * 2)
        copies.push(g)
    }

    return mergeGeometries(copies, false)
}

/**
 * The hub: a plate with the centre bore and the bolt holes cut through it, every edge chamfered by
 * the extrusion's bevel — which also reads as the countersink of a bolt seat.
 * @param {ReturnType<typeof wheelDimensions>} d
 * @param {WheelParams} p
 */
export function hubGeometry(d, p) {
    const shape = new THREE.Shape()
    shape.absarc(0, 0, d.hubRadiusMm, 0, Math.PI * 2, false)

    const bore = new THREE.Path()
    bore.absarc(0, 0, p.boreMm / 2, 0, Math.PI * 2, true)
    shape.holes.push(bore)

    for (let k = 0; k < p.boltHoles; k++) {
        const a = Math.PI / 2 + (k / p.boltHoles) * Math.PI * 2
        const hole = new THREE.Path()
        hole.absarc((p.boltCircleMm / 2) * Math.cos(a), (p.boltCircleMm / 2) * Math.sin(a), d.boltRadius, 0, Math.PI * 2, true)
        shape.holes.push(hole)
    }

    const thickness = d.hubFaceZ - d.hubBackZ
    const g = new THREE.ExtrudeGeometry(shape, {
        depth: thickness - 3,
        bevelEnabled: true,
        bevelThickness: 1.5,
        bevelSize: 1.5,
        bevelSegments: 2,
        curveSegments: 48,
    })
    g.translate(0, 0, d.hubBackZ + 1.5)
    g.computeVertexNormals()

    return g
}

/** A plain domed cap over the bore. No mark, no lettering. */
export function capGeometry(d, p) {
    const r = p.boreMm / 2 - 2
    const z0 = d.hubFaceZ - 4
    const top = d.hubFaceZ + 5
    const pts = [
        P(0, top),
        P(r * 0.35, top - 0.4),
        P(r * 0.7, top - 1.6),
        P(r * 0.9, top - 3.2),
        P(r, top - 5),
        P(r, top - 5),
        P(r, z0),
        P(0, z0),
        P(0, top),
    ]

    return latheAboutZ(pts, 96)
}

/**
 * The whole wheel as named parts, in millimetres.
 * @param {Partial<WheelParams>} overrides
 */
export function buildWheel(overrides = {}) {
    const p = { ...WHEEL_DEFAULTS, ...overrides }
    const d = wheelDimensions(p)

    return {
        params: p,
        dims: d,
        parts: {
            rim: rimGeometry(d),
            spokes: spokesGeometry(d, p.spokes),
            hub: hubGeometry(d, p),
            cap: capGeometry(d, p),
        },
    }
}

/**
 * The four callout targets in model millimetres — features that lie on circles about the axle,
 * so a roll about the axle never moves them: the lip at 10 o'clock, the hub face just right of
 * the bore, the bolt ring at 4 o'clock (the bolt at 306°), the bore's edge at 8 o'clock.
 * @param {WheelParams} p
 * @param {ReturnType<typeof wheelDimensions>} d
 */
export function calloutTargets3d(p, d) {
    const deg = (a) => (a * Math.PI) / 180
    const at = (r, angleDeg, z) => [round(r * Math.cos(deg(angleDeg))), round(r * Math.sin(deg(angleDeg))), round(z)]

    return {
        widthDiameter: at(d.rimRadiusMm, 150, d.lipZMm),
        offset: at(p.boreMm / 2 + 12, 8, d.hubFaceZ),
        boltCircle: at(p.boltCircleMm / 2, 306, d.hubFaceZ),
        centreBore: at(p.boreMm / 2, 205, d.hubFaceZ),
    }
}

function round(v) {
    return Math.round(v * 10) / 10
}
