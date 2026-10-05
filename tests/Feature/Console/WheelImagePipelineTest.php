<?php

declare(strict_types=1);

use App\Support\DemoWheels;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;
use Tests\Support\DemoWheelFixtures;

/*
 * The image pipeline itself — scripts/wheel-image.mjs, node and sharp — on drawn fixtures the test owns, never a
 * photograph in storage/: the cut along a circle and along a mask, the cap painted in the wheel's finish, the anchors
 * carried into every frame where the pixels are, the shadowless `bare` frame and the `open` frame a studio shot gets.
 *
 * Real work, so it is tested once, here, and alone (the operator's brief of 05.10.2026, §4): the group `pipeline` is left
 * out of the parallel run and runs on its own after it (CI, composer test:pipeline), with ten minutes for every step —
 * a slow machine makes it slow, never wrong. What the command hands the pipeline is ProcessWheelImagesTest's, faked.
 * Skipped where node or sharp is missing: the pipeline is a development step, not a runtime one.
 */

const PIPELINE_TIMEOUT = 600;

function pipelineNode(): ?string
{
    $node = (new ExecutableFinder)->find('node');

    if ($node === null) {
        return null;
    }

    $probe = new Process([$node, '-e', 'require("sharp")'], base_path(), timeout: PIPELINE_TIMEOUT);
    $probe->run();

    return $probe->isSuccessful() ? $node : null;
}

/** Runs a short node script with sharp loaded and returns its JSON answer. */
function sharpProbe(string $node, string $script, string ...$args): mixed
{
    $process = new Process([$node, '-e', $script, ...$args], base_path(), timeout: PIPELINE_TIMEOUT);
    $process->run();

    expect($process->isSuccessful())->toBeTrue($process->getErrorOutput());

    return json_decode(trim($process->getOutput()), true);
}

/** Draws an SVG to a file (PNG, or JPEG for a `.jpg` name; a single channel for a mask). */
function drawFixture(string $node, string $svg, string $path, bool $mask = false): void
{
    $chain = $mask ? '.extractChannel(0).png()' : (str_ends_with($path, '.jpg') ? '.jpeg({quality:90})' : '.png()');

    sharpProbe($node, 'const s=require("sharp");s(Buffer.from(process.argv[1]))'.$chain.'.toFile(process.argv[2]).then(()=>console.log("true"),e=>{console.error(e);process.exit(1)})', $svg, $path);
}

/**
 * Where a colour lands in a rendered PNG: the centroid of the pixels that are clearly that colour, as pixel positions
 * (a pixel's centre is its index plus a half).
 *
 * @return array{x: float, y: float, n: int}
 */
function pipelineCentroid(string $node, string $png, string $channel): array
{
    return sharpProbe($node, 'const s=require("sharp");s(process.argv[1]).raw().toBuffer({resolveWithObject:true}).then(({data,info})=>{'
        .'const c=process.argv[2];let sx=0,sy=0,n=0;'
        .'for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const i=(y*info.width+x)*info.channels;'
        .'const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];'
        .'const hit=a>200&&(c==="red"?(r>190&&g<70&&b<70):(b>190&&r<70&&g<90));'
        .'if(hit){sx+=x+0.5;sy+=y+0.5;n++}}'
        .'console.log(JSON.stringify({x:n?sx/n:-1,y:n?sy/n:-1,n}))})', $png, $channel);
}

it('turns photographs into the cut-outs the shop shows: along a circle, along a mask, and opened for a dark ground', function (): void {
    $node = pipelineNode();

    if ($node === null) {
        $this->markTestSkipped('node with sharp is not available on this machine');
    }

    $dir = DemoWheelFixtures::emptyDir();

    try {
        /* ── 1 · A wheel off a car, cut along its circle, with a hub, measured anchors and a stamp ───────────── */

        // 900 × 900: a cool background, a light disc (r 400) with five dark spokes and a bright hub, a red valve at
        // (450, 800) and a blue mark at (300, 450) — pixel indices.
        $wheel = $dir.DIRECTORY_SEPARATOR.'fixture-wheel.jpg';
        $marked = $dir.DIRECTORY_SEPARATOR.'marked-wheel.png';
        $spokes = '<g stroke="#2a2e35" stroke-width="60" stroke-linecap="round">'
            .'<line x1="450" y1="450" x2="450" y2="90"/><line x1="450" y1="450" x2="792" y2="339"/>'
            .'<line x1="450" y1="450" x2="661" y2="741"/><line x1="450" y1="450" x2="239" y2="741"/>'
            .'<line x1="450" y1="450" x2="108" y2="339"/></g>';
        drawFixture($node, '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><rect width="900" height="900" fill="#6d7a8c"/>'
            .'<circle cx="450" cy="450" r="400" fill="#c3c8cf"/>'.$spokes.'<circle cx="450" cy="450" r="90" fill="#e8ebef"/></svg>', $wheel);
        drawFixture($node, '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><rect width="900" height="900" fill="#6d7a8c"/>'
            .'<circle cx="450" cy="450" r="400" fill="#c3c8cf"/><circle cx="450.5" cy="800.5" r="12" fill="#ff0000"/>'
            .'<circle cx="300.5" cy="450.5" r="12" fill="#0000ff"/></svg>', $marked);

        $this->artisan('wheels:process-images', ['source' => $wheel, '--slug' => 'test-wheel', '--circle' => '450,450,400', '--hub' => '450,450,60'])->assertSuccessful();
        $this->artisan('wheels:process-images', [
            'source' => $marked,
            '--slug' => 'test-anchored',
            '--circle' => '450,450,400',
            '--anchors' => (string) json_encode(['centre' => [450, 450], 'valve' => [450, 800], 'bore' => [300, 450, 12], 'kba' => [450, 850, 80, 16]]),
            '--stamp' => '53810',
        ])->assertSuccessful();

        $out = $dir.DIRECTORY_SEPARATOR.'test-wheel'.DIRECTORY_SEPARATOR;

        foreach (['test-wheel', 'test-wheel-4x3', 'test-wheel-bare'] as $name) {
            foreach ([480, 768, 1080] as $width) {
                foreach (['avif', 'webp', 'png', 'jpg'] as $ext) {
                    expect(is_file($out.$name.'-'.$width.'.'.$ext) && filesize($out.$name.'-'.$width.'.'.$ext) > 0)->toBeTrue("missing {$name}-{$width}.{$ext}");
                }
            }
        }

        $manifest = DemoWheels::manifest('test-wheel');

        expect($manifest)->not->toBeNull()
            ->and($manifest['base'])->toBe(DemoWheels::publicBase().'/test-wheel/test-wheel')
            ->and([$manifest['width'], $manifest['height'], $manifest['widths'], $manifest['fallback']])->toBe([1080, 1080, [480, 768, 1080], 'png'])
            ->and($manifest['placeholder'])->toStartWith('data:image/png;base64,')
            ->and([$manifest['wide']['name'], $manifest['wide']['width'], $manifest['wide']['height']])->toBe(['test-wheel-4x3', 1080, 810])
            ->and($manifest['bare']['name'])->toBe('test-wheel-bare')
            ->and($manifest['fingerprint'])->toBeString()->not->toBe('')
            ->and($manifest['source'])->toBe('fixture-wheel.jpg')
            // No anchors measured, none written: a page draws no highlight it cannot place.
            ->and($manifest)->not->toHaveKeys(['anchors', 'stamp'])
            // A circle cut is a wheel off a car: no studio white to key, no `open` frame.
            ->and($manifest)->not->toHaveKey('open');

        // Transparent outside the wheel, opaque on it, the soft shadow under it — and the cap painted in the wheel's own
        // light finish, never a dark disc. In the 480 frame the wheel stands on y = 0,47 × 480 + 0,82 × 480 / 2 = 422,4:
        // below it the square frame carries the baked shadow, the bare frame nothing at all.
        $pixels = sharpProbe($node, 'const s=require("sharp");Promise.all([process.argv[1],process.argv[2]].map(f=>s(f).raw().toBuffer({resolveWithObject:true}))).then(([sq,bare])=>{'
            .'const a=(img,x,y)=>img.data[(y*img.info.width+x)*img.info.channels+img.info.channels-1];'
            .'const p=(img,x,y)=>{const i=(y*img.info.width+x)*img.info.channels;return [img.data[i],img.data[i+1],img.data[i+2]]};'
            .'let maxBelow=0;for(let y=426;y<480;y++)for(let x=0;x<480;x++)maxBelow=Math.max(maxBelow,a(bare,x,y));'
            .'console.log(JSON.stringify({corner:a(sq,2,2),centre:a(sq,240,226),below:a(sq,240,462),bareBelow:maxBelow,bareCentre:a(bare,240,226),cap:p(sq,240,226)}))})',
            $out.'test-wheel-480.png', $out.'test-wheel-bare-480.png');
        [$r, $g, $b] = $pixels['cap'];

        expect($pixels['corner'])->toBe(0)
            ->and($pixels['centre'])->toBe(255)
            ->and($pixels['below'])->toBeGreaterThan(0)->toBeLessThan(255)
            ->and($pixels['bareBelow'])->toBe(0)
            ->and($pixels['bareCentre'])->toBe(255)
            ->and(0.2126 * $r + 0.7152 * $g + 0.0722 * $b)->toBeGreaterThan(150);

        // The anchors, in every frame, normalised to it — and where the pixels are. Worked by hand for the square frame:
        // the 800 px cut fills 886 px (82 %), placed at x 97 and y 65; the valve's centre, 750,5 px into the cut, lands at
        // 65 + 750,5 × 886 / 800 = 896,2 px, 0,8298 of the frame.
        $anchored = DemoWheels::manifest('test-anchored');
        $marks = $dir.DIRECTORY_SEPARATOR.'test-anchored'.DIRECTORY_SEPARATOR;

        expect($anchored['stamp'])->toBe('53810')
            ->and($anchored['pipeline'])->toBe(6)
            ->and(DemoWheels::anchorsWellFormed($anchored['anchors']))->toBeTrue()
            ->and(DemoWheels::anchorsWellFormed($anchored['wide']['anchors']))->toBeTrue()
            ->and($anchored['bare']['anchors'])->toBe($anchored['anchors'])
            ->and($anchored['anchors']['valve']['x'])->toEqualWithDelta(0.5005, 0.001)
            ->and($anchored['anchors']['valve']['y'])->toEqualWithDelta(0.8298, 0.001)
            ->and($anchored['anchors']['wheel']['r'])->toEqualWithDelta(0.41, 0.001)
            ->and($anchored['anchors']['wheel']['x'])->toEqualWithDelta(0.5, 0.001)
            ->and($anchored['anchors']['kba']['w'])->toEqualWithDelta(80 * 886 / 800 / 1080, 0.001)
            ->and($anchored['anchors']['kba']['h'])->toEqualWithDelta(16 * 886 / 800 / 1080, 0.001)
            // The 4:3 frame is smaller in the wheel (78 % of its height), so its own numbers differ.
            ->and($anchored['wide']['anchors']['wheel']['r'])->toEqualWithDelta(0.78 * 810 / 2 / 1080, 0.001)
            ->and($anchored['wide']['anchors']['valve']['y'])->not->toBe($anchored['anchors']['valve']['y']);

        foreach ([
            ['test-anchored-1080.png', $anchored['anchors'], 1080, 1080],
            ['test-anchored-4x3-1080.png', $anchored['wide']['anchors'], 1080, 810],
            ['test-anchored-bare-1080.png', $anchored['bare']['anchors'], 1080, 1080],
        ] as [$file, $anchors, $width, $height]) {
            $red = pipelineCentroid($node, $marks.$file, 'red');
            $blue = pipelineCentroid($node, $marks.$file, 'blue');

            expect($red['n'])->toBeGreaterThan(50)
                ->and($red['x'])->toEqualWithDelta($anchors['valve']['x'] * $width, 1.5)
                ->and($red['y'])->toEqualWithDelta($anchors['valve']['y'] * $height, 1.5)
                ->and($blue['n'])->toBeGreaterThan(50)
                ->and($blue['x'])->toEqualWithDelta($anchors['bore']['x'] * $width, 1.5)
                ->and($blue['y'])->toEqualWithDelta($anchors['bore']['y'] * $height, 1.5);
        }

        /* ── 2 · An angled studio shot, cut along its mask, its outer lip read off the mask ─────────────────── */

        // The mask: a wide ellipse at half the photograph's size, 800 × 600 px once scaled to the photograph.
        $ellipse = $dir.DIRECTORY_SEPARATOR.'fixture-wheel.mask.png';
        drawFixture($node, '<svg xmlns="http://www.w3.org/2000/svg" width="450" height="450"><rect width="450" height="450" fill="#000"/>'
            .'<ellipse cx="225" cy="225" rx="200" ry="150" fill="#fff"/></svg>', $ellipse, mask: true);

        $this->artisan('wheels:process-images', ['source' => $wheel, '--slug' => 'test-masked', '--mask' => $ellipse, '--anchors' => '{"centre":[450,450]}'])->assertSuccessful();

        // 480 frame: the ellipse 82 % of the frame wide and three quarters of that high; above it air — where a circle
        // cut would still have had wheel — and its middle solid. The lip is half the box's longer side: 0,41.
        $masked = sharpProbe($node, 'const s=require("sharp");s(process.argv[1]).raw().toBuffer({resolveWithObject:true}).then(({data,info})=>{'
            .'const a=(x,y)=>data[(y*info.width+x)*info.channels+info.channels-1];'
            .'console.log(JSON.stringify({corner:a(2,2),aboveEllipse:a(240,60),middle:a(240,275)}))})',
            $dir.DIRECTORY_SEPARATOR.'test-masked'.DIRECTORY_SEPARATOR.'test-masked-480.png');
        $lip = DemoWheels::manifest('test-masked')['anchors'];

        expect($masked)->toBe(['corner' => 0, 'aboveEllipse' => 0, 'middle' => 255])
            ->and($lip['wheel']['r'])->toEqualWithDelta(0.41, 0.003)
            ->and($lip['wheel']['x'])->toEqualWithDelta(0.5, 0.002)
            ->and($lip['centre']['x'])->toEqualWithDelta(0.5, 0.003);

        /* ── 3 · A studio shot opened for a dark ground: the white between the spokes keyed out (#9) ────────── */

        // White background, a rim ring, five dark spokes, a grey hub with a small white mark — the background seen
        // through the spokes is the studio's white, which the silhouette mask (a full disc) keeps.
        $studio = $dir.DIRECTORY_SEPARATOR.'studio-wheel.png';
        $disc = $dir.DIRECTORY_SEPARATOR.'studio-wheel.mask.png';
        drawFixture($node, '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><rect width="900" height="900" fill="#ffffff"/>'
            .'<circle cx="450" cy="450" r="380" fill="none" stroke="#8a7a66" stroke-width="40"/>'.$spokes
            .'<circle cx="450" cy="450" r="90" fill="#9a9ea6"/><rect x="430" y="444" width="40" height="12" fill="#ffffff"/></svg>', $studio);
        drawFixture($node, '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><rect width="900" height="900" fill="#000"/>'
            .'<circle cx="450" cy="450" r="400" fill="#fff"/></svg>', $disc, mask: true);

        $this->artisan('wheels:process-images', ['source' => $studio, '--slug' => 'test-studio', '--mask' => $disc])->assertSuccessful();

        $open = DemoWheels::manifest('test-studio')['open'];
        $frames = $dir.DIRECTORY_SEPARATOR.'test-studio'.DIRECTORY_SEPARATOR;

        // The 1080 frames: the wheel's centre at (540, 0,47 × 1080), its radius 0,41 × 1080. Between the top spoke and
        // the next (−54°, at 0,55 of the radius) an opening; on the top spoke, on the hub's white mark and on the rim
        // ring, wheel.
        $keyed = sharpProbe($node, 'const s=require("sharp");Promise.all([process.argv[1],process.argv[2]].map(f=>s(f).raw().toBuffer({resolveWithObject:true}))).then(([bare,open])=>{'
            .'const a=(img,x,y)=>img.data[(Math.round(y)*img.info.width+Math.round(x))*img.info.channels+img.info.channels-1];'
            .'const cx=540,cy=0.47*1080,r=0.41*1080,at=(deg,f)=>[cx+Math.cos(deg*Math.PI/180)*f*r,cy+Math.sin(deg*Math.PI/180)*f*r];'
            .'const gap=at(-54,0.55),spoke=at(-90,0.55),ring=at(-54,0.95);'
            .'console.log(JSON.stringify({bareGap:a(bare,...gap),openGap:a(open,...gap),openSpoke:a(open,...spoke),openMark:a(open,cx,cy),openRing:a(open,...ring)}))})',
            $frames.'test-studio-bare-1080.png', $frames.'test-studio-open-1080.png');

        expect([$open['name'], $open['base']])->toBe(['test-studio-open', DemoWheels::publicBase().'/test-studio/test-studio-open'])
            ->and(is_file($frames.'test-studio-open-480.png'))->toBeTrue()
            ->and($keyed)->toBe(['bareGap' => 255, 'openGap' => 0, 'openSpoke' => 255, 'openMark' => 255, 'openRing' => 255]);
    } finally {
        DemoWheelFixtures::remove($dir);
    }
})->group('pipeline');
