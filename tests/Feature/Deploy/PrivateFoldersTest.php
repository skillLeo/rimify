<?php

declare(strict_types=1);

use Symfony\Component\Process\Process;

/*
 * The project is the document root on the host, so what keeps storage/ off the web is the server's configuration
 * (the operator's brief of 05.10.2026, §2.2). Two layers, each in the repository so every release carries them: the
 * root .htaccess rewrites every request to public/ and serves nothing at all without mod_rewrite, and the folders that
 * hold customers' data — the reset's safety copies under storage/app/private, the logs, the framework's working files —
 * refuse every request on their own. rimify:smoke asks the real server after each release (PrivateFilesProbe).
 */

it('keeps a deny rule in every folder that holds customers\' data, and every one is in the repository', function (): void {
    $process = new Process(['git', 'ls-files', 'storage/app/private/.htaccess', 'storage/framework/.htaccess', 'storage/logs/.htaccess'], base_path());
    $process->run();

    foreach (['storage/app/private', 'storage/framework', 'storage/logs'] as $folder) {
        $rules = (string) file_get_contents(base_path($folder.'/.htaccess'));

        expect($rules)->toContain('Require all denied', 'Deny from all')
            ->and($process->getOutput())->toContain($folder.'/.htaccess');
    }
});

it('serves only public/ from the project root, and nothing at all without mod_rewrite', function (): void {
    $root = (string) file_get_contents(base_path('.htaccess'));

    expect($root)->toContain('RewriteRule ^(.*)$ public/$1 [L]', 'RewriteRule (^|/)\. - [F,L]')
        ->and($root)->toMatch('/<IfModule !mod_rewrite\.c>.*?Require all denied.*?<\/IfModule>/s');
});
