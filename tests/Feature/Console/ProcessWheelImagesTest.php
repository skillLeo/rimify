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

it('refuses a photograph it cannot place', function (): void {
    $this->artisan('wheels:process-images', ['source' => $this->fixture, '--slug' => 'test-wheel'])
        ->assertFailed();

    $this->artisan('wheels:process-images', ['source' => $this->fixture, '--circle' => '1,2,3'])
        ->assertFailed();

    $this->artisan('wheels:process-images', ['source' => $this->dir.DIRECTORY_SEPARATOR.'missing.jpg', '--slug' => 'x', '--circle' => '1,2,3'])
        ->assertFailed();

    expect(File::exists($this->dir.DIRECTORY_SEPARATOR.'test-wheel'))->toBeFalse();
});
