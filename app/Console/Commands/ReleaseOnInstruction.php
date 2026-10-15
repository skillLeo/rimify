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
use App\Services\Admin\Approvals\ReleaseDeclaration;
use App\Support\GermanFormat;
use Illuminate\Console\Command;
use Illuminate\Validation\ValidationException;

/**
 * `rimify:gutachten-freigeben`: a Gutachten released on the operator's written instruction, on a test environment only.
 *
 * Releasing stays a human decision. On staging the operator may give it in writing, with the field comparison in
 * front of them, and have it carried out here; the Protokoll entry then says so in words — the instruction itself,
 * and that it came through the command line — so the trail names who decided instead of suggesting that someone
 * pressed „Freigeben“. The live shop refuses this command, and `rimify:preflight` says NO-GO if a release of this
 * kind ever reaches its database: there every release is pressed by a person in the browser.
 *
 * The same checks as the button (DocumentRelease::check), the same transaction, the same event.
 */
final class ReleaseOnInstruction extends Command
{
    /** Where it may run. Not "anything but production": a misspelt APP_ENV must refuse, not pass. */
    public const ENVIRONMENTS = ['staging', 'local', 'testing'];

    /** An instruction short enough to say nothing ("ok") is not a written instruction. */
    public const MIN_INSTRUCTION = 40;

    protected $signature = 'rimify:gutachten-freigeben
        {document : Die Nummer des Entwurfs (Admin › Gutachten › Dokumente, in der Adresse)}
        {--anweisung= : Die schriftliche Anweisung des Betreibers, im Wortlaut fürs Protokoll}
        {--konto= : E-Mail des Admin-Kontos, unter dem die Freigabe im Protokoll steht}
        {--erfasst= : Sind alle Anlagen und alle Fahrzeuge erfasst? alle, teilweise oder unbekannt (D-227)}
        {--fehlt= : Bei „teilweise“: welche Anlagen oder Bereiche fehlen}
        {--codes= : Wie viele Auflagen-Codes der Verwendungsbereich für die erfassten Fahrzeuge druckt (D-228)}
        {--groessen= : Wie viele Reifengrößen er für sie nennt}
        {--achslast= : Die Achslastgrenze in kg, die er nennt – leer, wenn keine}
        {--abnahme= : Ob er eine Abnahme verlangt: alle (bei jeder Kombination), einige oder keine}';

    /** The command's words for the three answers. */
    private const ANSWERS = ['alle' => ApprovalDocument::COMPLETE, 'teilweise' => ApprovalDocument::PARTIAL, 'unbekannt' => ApprovalDocument::UNKNOWN];

    protected $description = 'Testumgebung: einen Gutachten-Entwurf auf schriftliche Anweisung des Betreibers freigeben, so im Protokoll vermerkt';

    public function handle(DocumentRelease $release): int
    {
        if (! app()->environment(self::ENVIRONMENTS)) {
            $this->error('Im Live-Shop gibt jede Freigabe eine Person im Browser: Admin › Gutachten › Dokumente › „Freigeben“.');

            return self::FAILURE;
        }

        $instruction = trim((string) $this->option('anweisung'));

        if (mb_strlen($instruction) < self::MIN_INSTRUCTION) {
            $this->error('Ohne die schriftliche Anweisung des Betreibers im Wortlaut (--anweisung, mindestens '.self::MIN_INSTRUCTION.' Zeichen) wird nichts freigegeben.');

            return self::FAILURE;
        }

        $admin = AdminUser::query()->where('email', (string) $this->option('konto'))->first();

        // The right the button asks for (ApprovalDocumentPolicy::publish); whether the document is a draft, check() says.
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
        $answer = self::ANSWERS[(string) $this->option('erfasst')] ?? null;

        if ($answer === null) {
            $this->error('Ohne die Antwort, ob alle Anlagen und alle Fahrzeuge erfasst sind (--erfasst=alle, teilweise oder unbekannt), wird nichts freigegeben.');

            return self::FAILURE;
        }

        $int = fn (string $option): ?int => is_numeric($this->option($option)) ? (int) $this->option($option) : null;
        $declaration = new ReleaseDeclaration(
            completeness: $answer,
            missing: $this->option('fehlt') === null ? null : trim((string) $this->option('fehlt')),
            codes: $int('codes'),
            sizes: $int('groessen'),
            axleLimitKg: $int('achslast'),
            abnahme: match ((string) $this->option('abnahme')) {
                'alle' => ReleaseDeclaration::ABNAHME_ALL,
                'einige' => ReleaseDeclaration::ABNAHME_SOME,
                'keine' => ReleaseDeclaration::ABNAHME_NONE,
                default => null,
            },
        );

        try {
            $result = $release->release($document, $admin, $instruction, $declaration);
        } catch (ValidationException $e) {
            $this->error($label.': '.implode(' ', $e->errors()['release'] ?? [$e->getMessage()]));

            return self::FAILURE;
        }

        $this->info(sprintf(
            '%s freigegeben: %s. %s',
            $label,
            $result['rows'] === 0 ? 'keine eigenen Zeilen, seine Angaben gelten für seine Nachträge' : GermanFormat::integer($result['rows']).($result['rows'] === 1 ? ' Zeile im Shop' : ' Zeilen im Shop'),
            $result['conflicts'] === 0 ? 'Kein Widerspruch zu anderen Gutachten.' : GermanFormat::integer($result['conflicts']).' Widerspruch/Widersprüche erkannt – Admin › Gutachten › Konflikte.',
        ));

        return self::SUCCESS;
    }
}
