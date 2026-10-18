import { expect, test } from '../fixtures';
import { SHOTS, openEditor, sections, signIn } from './seiten-support';

/*
 * SEI-23 (S2) — a picture still uploading lands in the wrong block once the blocks move (docs/qa/BUGS.md, review
 * SEI-BLOCKS-2026-10-19).
 *
 * Bearbeiten.vue keys every section by its position (`:key="section-${index}"`) and writes the upload's answer with
 * `@uploaded="setImage(index, …)"`, the index the slot holds when the answer arrives. Move (or remove) a block while a
 * picture uploads and the slot — with ImageField's busy state, its file name and the pending answer — now shows the
 * neighbour: the picture replaces the neighbour's, and the block it was chosen for stays empty. When the slot now holds
 * another kind of block, ImageField is unmounted and the answer is dropped without a word (Vue's emit returns on an
 * unmounted instance).
 *
 * Nothing is saved and nothing is uploaded: the upload is answered in the browser.
 */
test('SEI-23 a picture uploading while its block moves stays with its block', async ({ page }) => {
    await signIn(page);
    await openEditor(page, 'HSN und TSN finden');

    const all = sections(page);
    const before = await all.count();

    await page.locator('#pg-add-figure').click();
    await page.locator('#pg-add-figure').click();
    await expect(all).toHaveCount(before + 2);

    const chosenFor = all.nth(before);
    const firstLabel = ((await all.nth(before).locator('h2').textContent()) ?? '').trim();
    const secondLabel = ((await all.nth(before + 1).locator('h2').textContent()) ?? '').trim();

    expect(firstLabel, 'rig: two new pictures at the end').toMatch(/^Bild \d+$/);
    expect(secondLabel, 'rig: two new pictures at the end').toMatch(/^Bild \d+$/);

    // The upload is held until the move is done, then answered as SeitenController::image answers.
    let answer: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
        answer = resolve;
    });

    await page.route('**/admin/seiten/*/bild', async (route) => {
        await held;
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ src: '/storage/website-images/blog/qa/sei-23-erstes.jpg', width: 1200, height: 800 }),
        });
    });

    await chosenFor.locator('input[type="file"]').setInputFiles({
        name: 'sei-23-erstes.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
    });
    await expect(chosenFor.locator('.adm-filepick__button')).toHaveText(/Wird hochgeladen/);

    // While it uploads, the other picture is moved above it: the chosen block is now the last section.
    await page.getByRole('button', { name: `${secondLabel} nach oben`, exact: true }).click();
    answer();

    const pictures = page.locator('section[id^="pg-section-"] .pg-image__img');

    await expect(pictures).toHaveCount(1);

    const owner = await all.evaluateAll(
        (list, file) => list.findIndex((section) => section.querySelector(`img[src*="${file}"]`) !== null),
        'sei-23-erstes.jpg',
    );

    await page.screenshot({ path: `${SHOTS}/sei-23-upload-after-move-${test.info().project.name}.png`, fullPage: true });

    expect(owner, `the picture should be in the block it was chosen for (section ${before + 1}, now the last); it is in section ${owner}`).toBe(before + 1);
});
