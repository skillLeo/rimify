// A plain centre cap over a hub that carries another company's mark, painted in the wheel's own
// finish so it reads as an unbranded cap rather than as something laid on top of the photograph.
//
// The colour is the wheel's, read from the photograph: the ring of hub face just outside the cap
// (1,15 … 1,6 × its radius), sorted by luminance, averaged over the 40th–80th percentile so lug
// holes, bolt heads and specular hot spots do not pull it. The cap is then a shallow dome in that
// colour — lighter towards the top left, darker at the edge, a thin bevel, a faint inset ring — on
// a soft seat shadow, and the whole layer is blurred by about one per cent of its radius so its
// edge is as soft as the photograph's own.
//
// Used by scripts/wheel-image.mjs (the demo catalogue) and scripts/cutout.mjs (the bundled hero).
import sharp from 'sharp'

/**
 * The composite layer that covers the hub.
 *
 * @param {Buffer} square  the wheel's square crop (any format sharp reads, alpha allowed)
 * @param {{ x: number, y: number, r: number }} hub  the cap's centre and radius in the square's pixels
 * @returns {Promise<{ input: Buffer, left: number, top: number, blend: 'over' }>}
 */
export async function plainCap(square, hub) {
    const { data, info } = await sharp(square).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const base = faceColour(data, info.width, info.height, info.channels, hub)

    const light = mix(base, [255, 255, 255], 0.3)
    const dark = mix(base, [0, 0, 0], 0.42)
    const bevel = mix(base, [0, 0, 0], 0.55)
    const inset = mix(base, [255, 255, 255], 0.2)

    // The layer is the cap's bounding box plus room for the seat shadow and the softening blur.
    const pad = Math.ceil(hub.r * 0.2)
    const side = Math.ceil(hub.r * 2 + pad * 2)
    const c = side / 2
    const bevelWidth = Math.max(1, hub.r * 0.035)
    const shadowBlur = Math.max(1, hub.r * 0.05)

    const svg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}">
            <defs>
                <radialGradient id="dome" cx="50%" cy="50%" r="50%" fx="36%" fy="30%">
                    <stop offset="0%" stop-color="${hex(light)}"/>
                    <stop offset="62%" stop-color="${hex(base)}"/>
                    <stop offset="100%" stop-color="${hex(dark)}"/>
                </radialGradient>
                <filter id="seat" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="${shadowBlur}"/>
                </filter>
            </defs>
            <circle cx="${c + hub.r * 0.02}" cy="${c + hub.r * 0.04}" r="${hub.r * 1.03}" fill="#0b0f14" fill-opacity="0.38" filter="url(#seat)"/>
            <circle cx="${c}" cy="${c}" r="${hub.r}" fill="url(#dome)"/>
            <circle cx="${c}" cy="${c}" r="${hub.r - bevelWidth / 2}" fill="none" stroke="${hex(bevel)}" stroke-width="${bevelWidth}"/>
            <circle cx="${c}" cy="${c}" r="${hub.r * 0.82}" fill="none" stroke="${hex(inset)}" stroke-opacity="0.35" stroke-width="${bevelWidth * 0.6}"/>
        </svg>`,
    )

    const soften = Math.max(0.3, hub.r * 0.012)
    const layer = await sharp(svg).ensureAlpha().blur(soften).png().toBuffer()

    const left = Math.round(hub.x - c)
    const top = Math.round(hub.y - c)

    // sharp refuses an overlay that runs past the image, so a cap near the edge is clipped first.
    const clipLeft = Math.max(0, -left)
    const clipTop = Math.max(0, -top)
    const width = Math.min(side - clipLeft, info.width - Math.max(0, left))
    const height = Math.min(side - clipTop, info.height - Math.max(0, top))

    if (width <= 0 || height <= 0) {
        throw new Error(`hub ${hub.x},${hub.y},${hub.r} lies outside the ${info.width}×${info.height} crop`)
    }

    const input = clipLeft || clipTop || width < side || height < side
        ? await sharp(layer).extract({ left: clipLeft, top: clipTop, width, height }).png().toBuffer()
        : layer

    return { input, left: Math.max(0, left), top: Math.max(0, top), blend: 'over' }
}

/** The finish colour of the hub face around the cap, as [r, g, b]. */
function faceColour(data, width, height, channels, hub) {
    const inner = hub.r * 1.15
    const outer = hub.r * 1.6
    const samples = []
    const step = Math.max(1, Math.round(hub.r / 60))

    for (let y = Math.max(0, Math.floor(hub.y - outer)); y < Math.min(height, Math.ceil(hub.y + outer)); y += step) {
        for (let x = Math.max(0, Math.floor(hub.x - outer)); x < Math.min(width, Math.ceil(hub.x + outer)); x += step) {
            const d = Math.hypot(x - hub.x, y - hub.y)

            if (d < inner || d > outer) {
                continue
            }

            const i = (y * width + x) * channels

            if (data[i + channels - 1] < 200) {
                continue
            }

            const rgb = [data[i], data[i + 1], data[i + 2]]
            samples.push([0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2], rgb])
        }
    }

    if (samples.length === 0) {
        return [128, 131, 136]
    }

    samples.sort((a, b) => a[0] - b[0])

    const from = Math.floor(samples.length * 0.4)
    const to = Math.max(from + 1, Math.floor(samples.length * 0.8))
    const band = samples.slice(from, to)
    const sum = band.reduce((acc, [, rgb]) => [acc[0] + rgb[0], acc[1] + rgb[1], acc[2] + rgb[2]], [0, 0, 0])

    return sum.map((v) => Math.round(v / band.length))
}

function mix(a, b, t) {
    return a.map((v, i) => Math.round(v + (b[i] - v) * t))
}

function hex(rgb) {
    return `#${rgb.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`
}
