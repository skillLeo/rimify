// Checklist 1 on /__design: twelve widths in Chromium, WebKit and Firefox, phone landscape, and a
// live resize from 320 to 1920. Fails on horizontal overflow, anything drawn outside its box or
// clipped, cut text, and the overlaps the inspector knows about. Screenshots land in
// docs/qa/shots/design-system/.
//
//   node scripts/qa/probes/design-viewports.mjs [--browsers chromium,webkit,firefox] [--no-shots]
import { parseArgs } from '../lib.mjs'
import { ALL_WIDTHS, PHONE_WIDTHS, SHOTS, inspectPage, launch, open, options, report, watchConsole } from './design-lib.mjs'

const args = parseArgs()
const browsers = (typeof args.browsers === 'string' ? args.browsers : 'chromium,webkit,firefox').split(',')
const problems = []
const consoleProblems = []

for (const name of browsers) {
    const browser = await launch(name)

    // Portrait at every width; landscape for the phone widths.
    const runs = [
        ...ALL_WIDTHS.map((w) => ({ width: w, landscape: false })),
        ...PHONE_WIDTHS.map((w) => ({ width: w, landscape: true })),
    ]

    for (const run of runs) {
        const context = await browser.newContext(options(name, run.width, { landscape: run.landscape }))
        const page = await context.newPage()
        const messages = watchConsole(page, `${name}@${run.width}${run.landscape ? 'L' : ''}`)
        await open(page)

        const label = `${name.padEnd(8)} ${String(run.width).padStart(4)}${run.landscape ? ' landscape' : ''}`
        problems.push(...report(label, await inspectPage(page)))

        // Every tile with its compare control revealed (hover on a pointer, always on touch).
        if (run.width >= 640) {
            await page.locator('.tile').nth(2).hover()
            await page.waitForTimeout(200)
            const hovered = await inspectPage(page)
            problems.push(...report(label + ' (tile hovered)', { ...hovered, spill: [], cut: [], over: 0 }))
            await page.mouse.move(0, 0)
        }

        // The callout lines drawn in, since the button is the only way to see that state.
        await page.getByRole('button', { name: 'Linien einzeichnen' }).click()
        await page.waitForTimeout(900)
        const drawn = await inspectPage(page)
        problems.push(...report(label + ' (lines drawn)', { ...drawn, overlaps: [] }))

        if (!args['no-shots']) {
            const full = name === 'chromium' || [390, 1440].includes(run.width)
            const stem = `${SHOTS}/${name}-${run.width}${run.landscape ? '-landscape' : ''}`
            await page.screenshot({ path: `${stem}${full ? '-full' : '-fold'}.png`, fullPage: full, animations: 'disabled' })
        }

        consoleProblems.push(...messages)
        await page.close()
        await context.close()
    }

    // Live resize: one page, 320 -> 1920 in 20px steps, the inspector after every step.
    const context = await browser.newContext(options(name, 1440))
    const page = await context.newPage()
    const messages = watchConsole(page, `${name} resize`)
    await open(page)
    const seen = new Set()

    for (let w = 320; w <= 1920; w += 20) {
        await page.setViewportSize({ width: w, height: 900 })
        await page.waitForTimeout(40)
        const r = await inspectPage(page)
        for (const line of report(`${name.padEnd(8)} resize->${w}`, r)) {
            // The same finding at consecutive widths is one finding.
            const key = line.replace(/resize->\d+/, '').replace(/\[[^\]]*\]/g, '')
            if (seen.has(key)) continue
            seen.add(key)
            problems.push(line)
        }
    }

    consoleProblems.push(...messages)
    await page.close()
    await context.close()
    await browser.close()
}

if (consoleProblems.length) {
    console.log('console during viewport runs:')
    console.log(consoleProblems.map((m) => '  ' + m).join('\n'))
}

if (problems.length === 0) {
    console.log(`viewports clean in ${browsers.join(', ')}`)
    process.exit(0)
}

console.log(problems.join('\n'))
process.exit(1)
