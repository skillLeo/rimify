<?php

declare(strict_types=1);

use App\Support\DemoWheels;
use Illuminate\Support\Facades\File;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;
use Tests\Support\DemoWheelFixtures;

/*
 * The sharp path of wheels:process-images, on a drawn fixture: a grey disc with dark spokes on a
 * blue-grey background, so the test owns its input and never depends on a photograph in
 * storage/. Skipped where node or sharp is missing — the pipeline is a development step, not a
 * runtime one.
 */

function nodeWithSharp(): ?string
{
    $node = (new ExecutableFinder)->find('node');

    if ($node === null) {
        return null;
    }

    $probe = new Process([$node, '-e', 'require("sharp")'], base_path(), timeout: 60);
    $probe->run();

    return $probe->isSuccessful() ? $node : null;
}

beforeEach(function (): void {
    $this->node = nodeWithSharp();

    if ($this->node === null) {
        $this->markTestSkipped('node with sharp is not available on this machine');
    }

    $this->dir = DemoWheelFixtures::emptyDir();
    $this->fixture = $this->dir.DIRECTORY_SEPARATOR.'fixture-wheel.jpg';

    // A 900 × 900 photograph stand-in: cool background, a light disc with five dark spokes and a
    // bright hub, centred at (450, 450) with radius 400.
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">'
        .'<rect width="900" height="900" fill="#6d7a8c"/>'
        .'<circle cx="450" cy="450" r="400" fill="#c3c8cf"/>'
        .'<g stroke="#2a2e35" stroke-width="60" stroke-linecap="round">'
        .'<line x1="450" y1="450" x2="450" y2="90"/><line x1="450" y1="450" x2="792" y2="339"/>'
        .'<line x1="450" y1="450" x2="661" y2="741"/><line x1="450" y1="450" x2="239" y2="741"/>'
        .'<line x1="450" y1="450" x2="108" y2="339"/></g>'
        .'<circle cx="450" cy="450" r="90" fill="#e8ebef"/></svg>';

    $script = 'const s=require("sharp");s(Buffer.from(process.argv[1])).jpeg({quality:90}).toFile(process.argv[2]).then(()=>process.exit(0),e=>{console.error(e);process.exit(1)})';
    $make = new Process([$this->node, '-e', $script, $svg, $this->fixture], base_path(), timeout: 120);
    $make->run();

    expect($make->isSuccessful())->toBeTrue($make->getErrorOutput());
});

afterEach(function (): void {
    if (isset($this->dir)) {
        DemoWheelFixtures::remove($this->dir);
    }
});

it('cuts a wheel out along its circle and exports both frames at three widths with a manifest', function (): void {
    $this->artisan('wheels:process-images', [
        'source' => $this->fixture,
        '--slug' => 'test-wheel',
        '--circle' => '450,450,400',
        '--hub' => '450,450,60',
    ])->assertSuccessful();

    $out = $this->dir.DIRECTORY_SEPARATOR.'test-wheel';

    foreach (['test-wheel', 'test-wheel-4x3'] as $name) {
        foreach ([480, 768, 1080] as $width) {
            foreach (['avif', 'webp', 'png', 'jpg'] as $ext) {
                $file = $out.DIRECTORY_SEPARATOR.$name.'-'.$width.'.'.$ext;
                expect(is_file($file) && filesize($file) > 0)->toBeTrue("missing {$name}-{$width}.{$ext}");
            }
        }
    }

    $manifest = DemoWheels::manifest('test-wheel');

    expect($manifest)->not->toBeNull()
        ->and($manifest['name'])->toBe('test-wheel')
        ->and($manifest['base'])->toBe(DemoWheels::publicBase().'/test-wheel/test-wheel')
        ->and($manifest['width'])->toBe(1080)
        ->and($manifest['height'])->toBe(1080)
        ->and($manifest['widths'])->toBe([480, 768, 1080])
        ->and($manifest['fallback'])->toBe('png')
        ->and($manifest['placeholder'])->toStartWith('data:image/png;base64,')
        ->and($manifest['wide']['name'])->toBe('test-wheel-4x3')
        ->and($manifest['wide']['width'])->toBe(1080)
        ->and($manifest['wide']['height'])->toBe(810)
        ->and($manifest['wide']['fallback'])->toBe('png')
        ->and($manifest['fingerprint'])->toBeString()->not->toBe('')
        ->and($manifest['source'])->toBe('fixture-wheel.jpg');

    // The PNG is transparent outside the wheel, opaque on it, and carries the soft shadow beneath
    // it: corner alpha 0, centre alpha 255, a point under the tyre in between.
    $script = 'const s=require("sharp");s(process.argv[1]).raw().toBuffer({resolveWithObject:true}).then(({data,info})=>{'
        .'const a=(x,y)=>data[(y*info.width+x)*info.channels+info.channels-1];'
        .'console.log(JSON.stringify({corner:a(2,2),centre:a(240,226),belowRim:a(240,462),cap:a(240,226)}))})';
    $probe = new Process([$this->node, '-e', $script, $out.DIRECTORY_SEPARATOR.'test-wheel-480.png'], base_path(), timeout: 60);
    $probe->run();

    $alpha = json_decode(trim($probe->getOutput()), true);

    expect($alpha['corner'])->toBe(0)
        ->and($alpha['centre'])->toBe(255)
        ->and($alpha['belowRim'])->toBeGreaterThan(0)
        ->and($alpha['belowRim'])->toBeLessThan(255);
});

it('paints the plain cap in the wheel\'s own finish, never as a dark disc', function (): void {
    // The fixture's hub face is light (#e8ebef); the cap painted over it must be light too.
    $this->artisan('wheels:process-images', [
        'source' => $this->fixture,
        '--slug' => 'test-wheel',
        '--circle' => '450,450,400',
        '--hub' => '450,450,60',
    ])->assertSuccessful();

    $png = $this->dir.DIRECTORY_SEPARATOR.'test-wheel'.DIRECTORY_SEPARATOR.'test-wheel-480.png';
    $script = 'const s=require("sharp");s(process.argv[1]).raw().toBuffer({resolveWithObject:true}).then(({data,info})=>{'
        .'const p=(x,y)=>{const i=(y*info.width+x)*info.channels;return [data[i],data[i+1],data[i+2]]};'
        .'console.log(JSON.stringify({cap:p(240,226)}))})';
    $probe = new Process([$this->node, '-e', $script, $png], base_path(), timeout: 60);
    $probe->run();

    [$r, $g, $b] = json_decode(trim($probe->getOutput()), true)['cap'];
    $luminance = 0.2126 * $r + 0.7152 * $g + 0.0722 * $b;

    expect($luminance)->toBeGreaterThan(150);
});

it('cuts an angled studio shot along its mask, not a circle, and frames it by its longer side', function (): void {
    // The mask: a wide ellipse at half the photograph's size — a mask is scaled to its photograph.
    $mask = $this->dir.DIRECTORY_SEPARATOR.'fixture-wheel.mask.png';
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="450" height="450"><rect width="450" height="450" fill="#000"/>'
        .'<ellipse cx="225" cy="225" rx="200" ry="150" fill="#fff"/></svg>';
    $script = 'const s=require("sharp");s(Buffer.from(process.argv[1])).extractChannel(0).png().toFile(process.argv[2]).then(()=>process.exit(0),e=>{console.error(e);process.exit(1)})';
    $make = new Process([$this->node, '-e', $script, $svg, $mask], base_path(), timeout: 120);
    $make->run();
    expect($make->isSuccessful())->toBeTrue($make->getErrorOutput());

    $this->artisan('wheels:process-images', [
        'source' => $this->fixture,
        '--slug' => 'test-masked',
        '--mask' => $mask,
    ])->assertSuccessful();

    // 480 frame: the ellipse is 82 % of the frame wide (394 px) and three quarters of that high,
    // standing on the baseline at 0,47 × 480 + 197. Above it is air — where a circle cut would
    // still have had wheel — and its middle is solid.
    $png = $this->dir.DIRECTORY_SEPARATOR.'test-masked'.DIRECTORY_SEPARATOR.'test-masked-480.png';
    $probe = new Process([$this->node, '-e', 'const s=require("sharp");s(process.argv[1]).raw().toBuffer({resolveWithObject:true}).then(({data,info})=>{'
        .'const a=(x,y)=>data[(y*info.width+x)*info.channels+info.channels-1];'
        .'console.log(JSON.stringify({corner:a(2,2),aboveEllipse:a(240,60),middle:a(240,275)}))})', $png], base_path(), timeout: 60);
    $probe->run();
    $alpha = json_decode(trim($probe->getOutput()), true);

    expect($alpha['corner'])->toBe(0)
        ->and($alpha['aboveEllipse'])->toBe(0)
        ->and($alpha['middle'])->toBe(255);
});

it('refuses a hub without a radius', function (): void {
    $this->artisan('wheels:process-images', [
        'source' => $this->fixture,
        '--slug' => 'test-wheel',
        '--circle' => '450,450,400',
        '--hub' => '450,450,0',
    ])->assertFailed();
});

it('is idempotent: an unchanged photograph is skipped, --force renders it again', function (): void {
    $arguments = [
        'source' => $this->fixture,
        '--slug' => 'test-wheel',
        '--circle' => '450,450,400',
    ];

    $this->artisan('wheels:process-images', $arguments)->assertSuccessful();

    $manifest = $this->dir.DIRECTORY_SEPARATOR.'test-wheel'.DIRECTORY_SEPARATOR.'manifest.json';
    $first = File::get($manifest);

    $this->artisan('wheels:process-images', $arguments)
        ->expectsOutputToContain('unchanged, skipped')
        ->assertSuccessful();

    expect(File::get($manifest))->toBe($first);

    // A changed parameter is a changed fingerprint, so the same photograph renders again.
    $this->artisan('wheels:process-images', $arguments + ['--hub' => '450,450,40'])
        ->doesntExpectOutputToContain('unchanged, skipped')
        ->assertSuccessful();

    expect(json_decode(File::get($manifest), true)['fingerprint'])->not->toBe(json_decode($first, true)['fingerprint']);
});

/**
 * Where a colour lands in a rendered PNG: the centroid of the pixels that are clearly that colour,
 * as pixel positions (a pixel's centre is its index plus a half).
 *
 * @return array{x: float, y: float, n: int}
 */
function colourCentroid(string $node, string $png, string $channel): array
{
    $script = 'const s=require("sharp");s(process.argv[1]).raw().toBuffer({resolveWithObject:true}).then(({data,info})=>{'
        .'const c=process.argv[2];let sx=0,sy=0,n=0;'
        .'for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const i=(y*info.width+x)*info.channels;'
        .'const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];'
        .'const hit=a>200&&(c==="red"?(r>190&&g<70&&b<70):(b>190&&r<70&&g<90));'
        .'if(hit){sx+=x+0.5;sy+=y+0.5;n++}}'
        .'console.log(JSON.stringify({x:n?sx/n:-1,y:n?sy/n:-1,n}))})';

    $probe = new Process([$node, '-e', $script, $png, $channel], base_path(), timeout: 60);
    $probe->run();

    return json_decode(trim($probe->getOutput()), true);
}

it('carries measured anchors into every frame, normalised to it, and writes the stamp', function (): void {
    // The same wheel, with a red valve at (450, 800) and a blue mark at (300, 450) — pixel indices.
    $marked = $this->dir.DIRECTORY_SEPARATOR.'marked-wheel.png';
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">'
        .'<rect width="900" height="900" fill="#6d7a8c"/><circle cx="450" cy="450" r="400" fill="#c3c8cf"/>'
        .'<circle cx="450.5" cy="800.5" r="12" fill="#ff0000"/><circle cx="300.5" cy="450.5" r="12" fill="#0000ff"/></svg>';
    $make = new Process([$this->node, '-e', 'const s=require("sharp");s(Buffer.from(process.argv[1])).png().toFile(process.argv[2]).then(()=>process.exit(0),e=>{console.error(e);process.exit(1)})', $svg, $marked], base_path(), timeout: 120);
    $make->run();
    expect($make->isSuccessful())->toBeTrue($make->getErrorOutput());

    $this->artisan('wheels:process-images', [
        'source' => $marked,
        '--slug' => 'test-anchored',
        '--circle' => '450,450,400',
        '--anchors' => (string) json_encode(['centre' => [450, 450], 'valve' => [450, 800], 'bore' => [300, 450, 12], 'kba' => [450, 850, 80, 16]]),
        '--stamp' => '53810',
    ])->assertSuccessful();

    $manifest = DemoWheels::manifest('test-anchored');
    $out = $this->dir.DIRECTORY_SEPARATOR.'test-anchored'.DIRECTORY_SEPARATOR;

    expect($manifest)->not->toBeNull()
        ->and($manifest['stamp'])->toBe('53810')
        ->and($manifest['pipeline'])->toBe(5)
        ->and(DemoWheels::anchorsWellFormed($manifest['anchors']))->toBeTrue()
        ->and(DemoWheels::anchorsWellFormed($manifest['wide']['anchors']))->toBeTrue()
        // `bare` has the square frame's geometry, so its anchors are the square frame's.
        ->and($manifest['bare']['anchors'])->toBe($manifest['anchors']);

    // Worked by hand for the square frame: the 800 px cut fills 886 px (82 %), placed at x 97 and
    // y 65 (standing on 0,47 × 1080 + 443). The valve's centre, 750,5 px into the cut, lands at
    // 65 + 750,5 × 886/800 = 896,2 px, which is 0,8298 of the frame.
    expect($manifest['anchors']['valve']['x'])->toEqualWithDelta(0.5005, 0.001)
        ->and($manifest['anchors']['valve']['y'])->toEqualWithDelta(0.8298, 0.001)
        // The outer lip is the circle itself: 82 % of the frame across, centred.
        ->and($manifest['anchors']['wheel']['r'])->toEqualWithDelta(0.41, 0.001)
        ->and($manifest['anchors']['wheel']['x'])->toEqualWithDelta(0.5, 0.001)
        ->and($manifest['anchors']['kba']['w'])->toEqualWithDelta(80 * 886 / 800 / 1080, 0.001)
        ->and($manifest['anchors']['kba']['h'])->toEqualWithDelta(16 * 886 / 800 / 1080, 0.001);

    // And what the manifest says is where the pixels are, in both frames.
    foreach ([
        ['test-anchored-1080.png', $manifest['anchors'], 1080, 1080],
        ['test-anchored-4x3-1080.png', $manifest['wide']['anchors'], 1080, 810],
        ['test-anchored-bare-1080.png', $manifest['bare']['anchors'], 1080, 1080],
    ] as [$file, $anchors, $width, $height]) {
        $red = colourCentroid($this->node, $out.$file, 'red');
        $blue = colourCentroid($this->node, $out.$file, 'blue');

        expect($red['n'])->toBeGreaterThan(50)
            ->and($red['x'])->toEqualWithDelta($anchors['valve']['x'] * $width, 1.5)
            ->and($red['y'])->toEqualWithDelta($anchors['valve']['y'] * $height, 1.5)
            ->and($blue['n'])->toBeGreaterThan(50)
            ->and($blue['x'])->toEqualWithDelta($anchors['bore']['x'] * $width, 1.5)
            ->and($blue['y'])->toEqualWithDelta($anchors['bore']['y'] * $height, 1.5);
    }

    // The 4:3 frame is smaller in the wheel (78 % of its height), so its own numbers differ.
    expect($manifest['wide']['anchors']['wheel']['r'])->toEqualWithDelta(0.78 * 810 / 2 / 1080, 0.001)
        ->and($manifest['wide']['anchors']['valve']['y'])->not->toBe($manifest['anchors']['valve']['y']);
});

it('exports a bare frame with the square frame\'s geometry and no shadow under the wheel', function (): void {
    $this->artisan('wheels:process-images', [
        'source' => $this->fixture,
        '--slug' => 'test-wheel',
        '--circle' => '450,450,400',
    ])->assertSuccessful();

    $manifest = DemoWheels::manifest('test-wheel');
    $out = $this->dir.DIRECTORY_SEPARATOR.'test-wheel'.DIRECTORY_SEPARATOR;

    expect($manifest['bare']['name'])->toBe('test-wheel-bare')
        ->and($manifest['bare']['base'])->toBe(DemoWheels::publicBase().'/test-wheel/test-wheel-bare')
        ->and($manifest['bare']['width'])->toBe(1080)
        ->and($manifest['bare']['height'])->toBe(1080)
        ->and($manifest['bare']['widths'])->toBe([480, 768, 1080])
        ->and($manifest['bare']['fallback'])->toBe('png')
        // No anchors measured, none written: a page draws no highlight it cannot place.
        ->and($manifest)->not->toHaveKeys(['anchors', 'stamp']);

    foreach ([480, 768, 1080] as $width) {
        foreach (['avif', 'webp', 'png', 'jpg'] as $ext) {
            expect(is_file($out.'test-wheel-bare-'.$width.'.'.$ext))->toBeTrue("missing test-wheel-bare-{$width}.{$ext}");
        }
    }

    // In the 480 frame the wheel stands on y = 0,47 × 480 + 0,82 × 480 / 2 = 422,4. Below it the
    // square frame carries the baked shadow; the bare frame carries nothing at all.
    $script = 'const s=require("sharp");Promise.all([process.argv[1],process.argv[2]].map(f=>s(f).raw().toBuffer({resolveWithObject:true}))).then(([sq,bare])=>{'
        .'const a=(img,x,y)=>img.data[(y*img.info.width+x)*img.info.channels+img.info.channels-1];'
        .'let maxBelow=0;for(let y=426;y<480;y++)for(let x=0;x<480;x++)maxBelow=Math.max(maxBelow,a(bare,x,y));'
        .'console.log(JSON.stringify({maxBelow,squareBelow:a(sq,240,462),bareCentre:a(bare,240,226),squareCentre:a(sq,240,226)}))})';
    $probe = new Process([$this->node, '-e', $script, $out.'test-wheel-480.png', $out.'test-wheel-bare-480.png'], base_path(), timeout: 60);
    $probe->run();
    $alpha = json_decode(trim($probe->getOutput()), true);

    expect($alpha['squareBelow'])->toBeGreaterThan(0)
        ->and($alpha['maxBelow'])->toBe(0)
        ->and($alpha['bareCentre'])->toBe(255)
        ->and($alpha['squareCentre'])->toBe(255);
});

it('derives the outer lip of a masked shot from the mask, not from anything typed in', function (): void {
    // A wide ellipse at half the photograph's size: 800 × 600 px once scaled to the photograph.
    $mask = $this->dir.DIRECTORY_SEPARATOR.'fixture-wheel.mask.png';
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="450" height="450"><rect width="450" height="450" fill="#000"/>'
        .'<ellipse cx="225" cy="225" rx="200" ry="150" fill="#fff"/></svg>';
    $make = new Process([$this->node, '-e', 'const s=require("sharp");s(Buffer.from(process.argv[1])).extractChannel(0).png().toFile(process.argv[2]).then(()=>process.exit(0),e=>{console.error(e);process.exit(1)})', $svg, $mask], base_path(), timeout: 120);
    $make->run();
    expect($make->isSuccessful())->toBeTrue($make->getErrorOutput());

    $this->artisan('wheels:process-images', [
        'source' => $this->fixture,
        '--slug' => 'test-masked',
        '--mask' => $mask,
        '--anchors' => '{"centre":[450,450]}',
    ])->assertSuccessful();

    $anchors = DemoWheels::manifest('test-masked')['anchors'];

    // Half the box's longer side, which fills 82 % of the square frame.
    expect($anchors['wheel']['r'])->toEqualWithDelta(0.41, 0.003)
        ->and($anchors['wheel']['x'])->toEqualWithDelta(0.5, 0.002)
        ->and($anchors['centre']['x'])->toEqualWithDelta(0.5, 0.003);
});

it('refuses anchors without a centre, an unknown anchor and a stamp that is not a number', function (): void {
    foreach ([
        ['--anchors' => '{"pcd":[450,450,100]}'],
        ['--anchors' => '{"centre":[450,450],"hub":[1,2,3]}'],
        ['--anchors' => '{"centre":[450]}'],
        ['--anchors' => 'not json'],
        ['--stamp' => 'KBA 53810'],
    ] as $option) {
        $this->artisan('wheels:process-images', ['source' => $this->fixture, '--slug' => 'test-wheel', '--circle' => '450,450,400'] + $option)
            ->assertFailed();
    }

    expect(File::exists($this->dir.DIRECTORY_SEPARATOR.'test-wheel'))->toBeFalse();
});

it('renders again when the anchors or the stamp change', function (): void {
    $arguments = ['source' => $this->fixture, '--slug' => 'test-wheel', '--circle' => '450,450,400', '--anchors' => '{"centre":[450,450]}'];

    $this->artisan('wheels:process-images', $arguments)->assertSuccessful();
    $first = DemoWheels::manifest('test-wheel')['fingerprint'];

    $this->artisan('wheels:process-images', $arguments + ['--stamp' => '53810'])
        ->doesntExpectOutputToContain('unchanged, skipped')
        ->assertSuccessful();

    $second = DemoWheels::manifest('test-wheel')['fingerprint'];

    $this->artisan('wheels:process-images', ['--anchors' => '{"centre":[451,450]}'] + $arguments + ['--stamp' => '53810'])
        ->doesntExpectOutputToContain('unchanged, skipped')
        ->assertSuccessful();

    expect($second)->not->toBe($first)
        ->and(DemoWheels::manifest('test-wheel')['fingerprint'])->not->toBe($second);
});

it('refuses a photograph it cannot place', function (): void {
    $this->artisan('wheels:process-images', ['source' => $this->fixture, '--slug' => 'test-wheel'])
        ->assertFailed();

    $this->artisan('wheels:process-images', ['source' => $this->fixture, '--circle' => '1,2,3'])
        ->assertFailed();

    $this->artisan('wheels:process-images', ['source' => $this->dir.DIRECTORY_SEPARATOR.'missing.jpg', '--slug' => 'x', '--circle' => '1,2,3'])
        ->assertFailed();

    expect(File::exists($this->dir.DIRECTORY_SEPARATOR.'test-wheel'))->toBeFalse();
});
