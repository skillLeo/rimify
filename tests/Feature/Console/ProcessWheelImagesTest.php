<?php

declare(strict_types=1);

use App\Support\DemoWheels;
use Illuminate\Process\PendingProcess;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Tests\Support\DemoWheelFixtures;

/*
 * `wheels:process-images` as a command: which photograph it hands the pipeline, with which cut, hub, anchors, stamp and
 * fingerprint — and which it refuses or skips. The pipeline itself (scripts/wheel-image.mjs: node and sharp, real work
 * on real pixels) is faked here and answers with the manifest it would write, so nothing in these tests measures how
 * busy the machine is (the operator's brief of 05.10.2026, §4: a CPU-contention timeout had failed this file). What the
 * pipeline makes of the pixels is WheelImagePipelineTest's, in a group of its own that runs alone.
 */

beforeEach(function (): void {
    $this->dir = DemoWheelFixtures::emptyDir();
    $this->photo = $this->dir.DIRECTORY_SEPARATOR.'fixture-wheel.jpg';
    File::put($this->photo, 'a photograph stand-in: the fake pipeline never reads it');

    // The pipeline, faked: it writes the manifest wheel-image.mjs would, carrying the fingerprint it was handed — and
    // keeps each call, in order. Read from here, not through Process::assertRan, which stops at the first match.
    $this->calls = [];
    Process::fake(function (PendingProcess $process) {
        $args = pipelineArgs($process);

        if (isset($args['--out'], $args['--slug'])) {
            $this->calls[] = $args;
            File::ensureDirectoryExists($args['--out']);
            File::put($args['--out'].DIRECTORY_SEPARATOR.'manifest.json', (string) json_encode([
                ...DemoWheelFixtures::manifest($args['--slug']),
                'fingerprint' => $args['--fingerprint'] ?? '',
            ]));
        }

        return Process::result(output: 'rendered');
    });
});

afterEach(function (): void {
    DemoWheelFixtures::remove($this->dir);
});

/**
 * The `--option value` pairs of the call to scripts/wheel-image.mjs, by option.
 *
 * @return array<string, string>
 */
function pipelineArgs(PendingProcess $process): array
{
    $command = is_array($process->command) ? array_values($process->command) : [];
    $args = [];

    foreach ($command as $i => $part) {
        if (is_string($part) && str_starts_with($part, '--')) {
            $args[$part] = (string) ($command[$i + 1] ?? '');
        }
    }

    return $args;
}

/**
 * The one call the command made to the pipeline.
 *
 * @return array<string, string>
 */
function pipelineCall(): array
{
    $calls = test()->calls;

    expect($calls)->toHaveCount(1);

    return $calls[0];
}

it('hands the pipeline the photograph, its circle, its hub, its anchors and its stamp', function (): void {
    $this->artisan('wheels:process-images', [
        'source' => $this->photo,
        '--slug' => 'test-wheel',
        '--circle' => '450,450,400',
        '--hub' => '450,450,60',
        '--anchors' => '{"centre":[450,450],"valve":[450,800],"kba":[450,850,80,16]}',
        '--stamp' => '53810',
    ])->assertSuccessful();

    $args = pipelineCall();

    expect($args['--source'])->toBe($this->photo)
        ->and($args['--out'])->toBe($this->dir.DIRECTORY_SEPARATOR.'test-wheel')
        ->and($args['--slug'])->toBe('test-wheel')
        ->and($args['--public-base'])->toBe(DemoWheels::publicBase())
        ->and($args['--circle'])->toBe('450,450,400')
        ->and($args['--hub'])->toBe('450,450,60')
        // Numbers, as JSON writes them: 450 and 450.0 are the same pixel.
        ->and(json_decode($args['--anchors'], true))->toEqual(['centre' => [450, 450], 'valve' => [450, 800], 'kba' => [450, 850, 80, 16]])
        ->and($args['--stamp'])->toBe('53810')
        ->and($args['--fingerprint'])->toMatch('/^[0-9a-f]{40}$/')
        ->and($args)->not->toHaveKey('--mask')
        ->and(DemoWheels::manifest('test-wheel'))->not->toBeNull();
});

it('cuts a studio shot along its mask, not a circle, and leaves its cap as photographed', function (): void {
    $mask = $this->dir.DIRECTORY_SEPARATOR.'fixture-wheel.mask.png';
    File::put($mask, 'a mask stand-in');

    $this->artisan('wheels:process-images', ['source' => $this->photo, '--slug' => 'test-masked', '--mask' => $mask, '--hub' => '450,450,60'])
        ->assertSuccessful();

    $args = pipelineCall();

    expect($args['--mask'])->toBe($mask)
        ->and($args)->not->toHaveKey('--circle')
        // A masked shot shows the product brand's own cap: no hub is painted over it.
        ->and($args)->not->toHaveKey('--hub');
});

it('is idempotent: an unchanged photograph is skipped, --force and a changed parameter render it again', function (): void {
    $arguments = ['source' => $this->photo, '--slug' => 'test-wheel', '--circle' => '450,450,400'];

    $this->artisan('wheels:process-images', $arguments)->assertSuccessful();
    $first = DemoWheels::manifest('test-wheel')['fingerprint'];

    $this->artisan('wheels:process-images', $arguments)->expectsOutputToContain('unchanged, skipped')->assertSuccessful();
    Process::assertRanTimes(fn (PendingProcess $p): bool => isset(pipelineArgs($p)['--slug']), 1);

    $this->artisan('wheels:process-images', $arguments + ['--force' => true])->assertSuccessful();
    Process::assertRanTimes(fn (PendingProcess $p): bool => isset(pipelineArgs($p)['--slug']), 2);

    // A changed parameter is a changed fingerprint: the same photograph renders again, without --force.
    foreach ([['--hub' => '450,450,40'], ['--anchors' => '{"centre":[451,450]}'], ['--stamp' => '53810']] as $change) {
        $this->artisan('wheels:process-images', $arguments + $change)->doesntExpectOutputToContain('unchanged, skipped')->assertSuccessful();
        expect(DemoWheels::manifest('test-wheel')['fingerprint'])->not->toBe($first);
    }
});

it('renders every photograph in the map when none is named', function (): void {
    DemoWheelFixtures::photoMap($this->dir, DemoWheelFixtures::photoPair('test-model', 'Silber'));
    // The sources in the test's own directory, as the map names them.
    config(['rimify.demo.sources_dir' => $this->dir]);
    File::put($this->dir.DIRECTORY_SEPARATOR.'fixture-front.jpg', 'front');
    File::put($this->dir.DIRECTORY_SEPARATOR.'fixture-angle.jpg', 'angle');

    $this->artisan('wheels:process-images')->assertSuccessful();

    expect(array_column($this->calls, '--slug'))->toBe(['test-model-front', 'test-model-angle']);
});

it('says so when the pipeline fails, and when it leaves no manifest', function (): void {
    Process::fake(fn () => Process::result(errorOutput: 'sharp: input file is missing', exitCode: 1));
    $this->artisan('wheels:process-images', ['source' => $this->photo, '--slug' => 'test-wheel', '--circle' => '450,450,400'])
        ->expectsOutputToContain('wheel-image.mjs failed')
        ->assertFailed();

    Process::fake(fn () => Process::result(output: 'rendered'));
    $this->artisan('wheels:process-images', ['source' => $this->photo, '--slug' => 'test-wheel', '--circle' => '450,450,400'])
        ->expectsOutputToContain('no well-formed manifest was written')
        ->assertFailed();
});

it('refuses a hub without a radius, anchors without a centre or of an unknown kind, and a stamp that is not a number', function (): void {
    foreach ([
        ['--hub' => '450,450,0'],
        ['--anchors' => '{"pcd":[450,450,100]}'],
        ['--anchors' => '{"centre":[450,450],"hub":[1,2,3]}'],
        ['--anchors' => '{"centre":[450]}'],
        ['--anchors' => 'not json'],
        ['--stamp' => 'KBA 53810'],
    ] as $option) {
        $this->artisan('wheels:process-images', ['source' => $this->photo, '--slug' => 'test-wheel', '--circle' => '450,450,400'] + $option)
            ->assertFailed();
    }

    Process::assertNothingRan();
    expect(File::exists($this->dir.DIRECTORY_SEPARATOR.'test-wheel'))->toBeFalse();
});

it('refuses a photograph it cannot place: no slug, no circle and no mask, a file that is not there', function (): void {
    $this->artisan('wheels:process-images', ['source' => $this->photo, '--slug' => 'test-wheel'])->assertFailed();
    $this->artisan('wheels:process-images', ['source' => $this->photo, '--circle' => '1,2,3'])->assertFailed();
    $this->artisan('wheels:process-images', ['source' => $this->dir.DIRECTORY_SEPARATOR.'missing.jpg', '--slug' => 'x', '--circle' => '1,2,3'])->assertFailed();
    $this->artisan('wheels:process-images', ['source' => $this->photo, '--slug' => 'x', '--mask' => $this->dir.DIRECTORY_SEPARATOR.'missing.png'])->assertFailed();

    Process::assertNothingRan();
});
