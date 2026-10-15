<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\AdminUserStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Services\Admin\Approvals\DocumentRelease;
use App\Services\Admin\Approvals\FitmentRows;
use App\Support\GermanFormat;
use Illuminate\Console\Command;
use Illuminate\Validation\ValidationException;

/**
 * `rimify:gutachten-zuruecknehmen`: a release taken back on the operator's written instruction, on a test environment
 * only (D-225) — the counterpart of `rimify:gutachten-freigeben`, with the same guards: the operator's words in the
 * Protokoll, an admin account with the right to release, and the live shop refusing. The document and its rows go back to
 * Entwurf; a person releases them again in the browser once the entry is complete.
 */
final class TakeBackOnInstruction extends Command
{
    /** A reason short enough to say nothing is not a reason. */
    public const MIN_REASON = 20;

    protected $signature = 'rimify:gutachten-zuruecknehmen
        {document : Die Nummer des freigegebenen Gutachtens (Admin › Gutachten › Dokumente, in der Adresse)}
        {--grund= : Warum die Freigabe zurückgenommen wird, in einem Satz fürs Protokoll}
        {--anweisung= : Die schriftliche Anweisung des Betreibers, im Wortlaut fürs Protokoll}
        {--konto= : E-Mail des Admin-Kontos, unter dem die Rücknahme im Protokoll steht}';

    protected $description = 'Testumgebung: die Freigabe eines Gutachtens auf schriftliche Anweisung des Betreibers zurücknehmen, so im Protokoll vermerkt';

    public function handle(DocumentRelease $release): int
    {
        if (! app()->environment(ReleaseOnInstruction::ENVIRONMENTS)) {
            $this->error('Im Live-Shop nimmt eine Person im Browser eine Freigabe zurück, nicht die Kommandozeile.');

            return self::FAILURE;
        }

        $reason = trim((string) $this->option('grund'));
        $instruction = trim((string) $this->option('anweisung'));

        if (mb_strlen($reason) < self::MIN_REASON) {
            $this->error('Ohne einen Grund in einem Satz (--grund, mindestens '.self::MIN_REASON.' Zeichen) wird nichts zurückgenommen.');

            return self::FAILURE;
        }

        if (mb_strlen($instruction) < ReleaseOnInstruction::MIN_INSTRUCTION) {
            $this->error('Ohne die schriftliche Anweisung des Betreibers im Wortlaut (--anweisung, mindestens '.ReleaseOnInstruction::MIN_INSTRUCTION.' Zeichen) wird nichts zurückgenommen.');

            return self::FAILURE;
        }

        $admin = AdminUser::query()->where('email', (string) $this->option('konto'))->first();

        if (! $admin instanceof AdminUser || $admin->status !== AdminUserStatus::Active || ! $admin->may(PermissionModule::Approvals, PermissionAction::Publish)) {
            $this->error('--konto muss ein aktives Admin-Konto mit dem Recht sein, Gutachten freizugeben.');

            return self::FAILURE;
        }

        $document = ApprovalDocument::query()->find((int) $this->argument('document'));

        if (! $document instanceof ApprovalDocument) {
            $this->error('Kein Gutachten mit dieser Nummer.');

            return self::FAILURE;
        }

        $label = FitmentRows::label($document);

        try {
            $rows = $release->takeBack($document, $admin, $reason, $instruction);
        } catch (ValidationException $e) {
            $this->error($label.': '.implode(' ', $e->errors()['release'] ?? [$e->getMessage()]));

            return self::FAILURE;
        }

        $this->info(sprintf('%s zurückgenommen: %s wieder Entwurf, nicht mehr im Shop.', $label, $rows === 1 ? 'eine Zeile' : GermanFormat::integer($rows).' Zeilen'));

        return self::SUCCESS;
    }
}
