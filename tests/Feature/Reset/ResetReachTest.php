<?php

declare(strict_types=1);

use App\Console\Commands\ResetCommand;
use App\Http\Controllers\Admin\ZuruecksetzenController;
use App\Services\Reset\ResetOrigin;
use App\Services\Reset\TestEnvironment;
use App\Services\Reset\TestReset;
use Illuminate\Support\Facades\File;

/*
 * Who can reach Testumgebung zurücksetzen, read off the code (CLAUDE.md R-04.1, R-12.3). The engine and the origin it
 * asks for are used by `rimify:reset` and the screen's controller and by nothing else — no other controller, seeder,
 * factory, job or service; ResetGuardsTest proves at run time that a call from anywhere else is refused. And no code
 * updates, deletes or empties the Protokoll or a Prüfnachweis: the one exception R-12 grants — rows born demo — is
 * DemoPurge's, by a filter rather than a table name, and the probe's statements exist to be refused.
 */

arch('the reset engine is used by rimify:reset and the screen, and by nothing else')
    ->expect(TestReset::class)
    ->toOnlyBeUsedIn([ResetCommand::class, ZuruecksetzenController::class]);

arch('a reset\'s origin is made by rimify:reset and the screen alone')
    ->expect(ResetOrigin::class)
    ->toOnlyBeUsedIn([ResetCommand::class, ZuruecksetzenController::class, TestReset::class, TestEnvironment::class]);

it('has no code that updates, deletes or empties the Protokoll or a Prüfnachweis (R-12.3)', function (): void {
    // ResetProbe: each statement exists to be refused by the trigger, inside a transaction it always rolls back.
    $allowed = ['app/Services/Reset/ResetProbe.php'];
    $write = '/(table\(\s*[\'"](audit_logs|order_line_fitments)[\'"]\s*\)|AuditLog::|OrderLineFitment::)[^;]*->\s*(update|delete|forceDelete|truncate|upsert|updateOrInsert|increment|decrement|incrementEach|decrementEach)\s*\(/s';
    $raw = '/\b(UPDATE|DELETE\s+FROM|TRUNCATE(\s+TABLE)?)\s+`?(audit_logs|order_line_fitments)\b/i';
    $found = [];

    foreach (['app', 'database', 'routes', 'config'] as $root) {
        foreach (File::allFiles(base_path($root)) as $file) {
            if ($file->getExtension() !== 'php') {
                continue;
            }

            $path = str_replace('\\', '/', $root.'/'.$file->getRelativePathname());
            $code = (string) file_get_contents($file->getPathname());

            if (! in_array($path, $allowed, true) && (preg_match($write, $code) === 1 || preg_match($raw, $code) === 1)) {
                $found[] = $path;
            }
        }
    }

    expect($found)->toBe([]);
});
