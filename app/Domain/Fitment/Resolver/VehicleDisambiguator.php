<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Resolver;

use App\Domain\Fitment\Data\VehicleRecord;
use App\Support\GermanFormat;
use Illuminate\Support\Collection;

/**
 * Decides what the disambiguation chooser shows.
 *
 * The rule is subtractive, and that is the point: take the candidate set, drop every attribute
 * whose value is identical across all of them, and show what remains. Because it is driven by
 * "which attributes differ" rather than by a hand-maintained list, it needs no rules per make and
 * stays correct as the national dataset grows — and the attributes it keeps are, by construction,
 * exactly the ones a customer needs in order to choose.
 *
 * Display order is the order an owner recognises their own car: when it was built, how much power
 * it has, what shape it is, how fast it goes, then how many doors and seats.
 */
final readonly class VehicleDisambiguator
{
    /**
     * Attribute keys in display priority. Top speed sits below body form because an owner rarely
     * knows it — but it is shown when it differs, because it is one of the two fields the legal
     * answer is derived from.
     *
     * @var list<string>
     */
    public const PRIORITY = [
        'build_period',
        'power',
        'body_form',
        'max_speed',
        'doors',
        'seats',
        'drive_axle',
        'axle_load_front',
    ];

    /** @param Collection<int, VehicleRecord>|list<VehicleRecord> $candidates */
    public function distinguish(Collection|array $candidates): VehicleDistinction
    {
        $list = array_values($candidates instanceof Collection ? $candidates->all() : $candidates);

        if (count($list) < 2) {
            return VehicleDistinction::none($list);
        }

        $differing = [];

        foreach (self::PRIORITY as $attribute) {
            $values = array_map(
                fn (VehicleRecord $vehicle): string => self::value($vehicle, $attribute),
                $list,
            );

            // Identical across every candidate: showing it would be noise, and noise in a chooser
            // is what makes the extra tap feel like an obstacle rather than a confirmation.
            if (count(array_unique($values)) > 1) {
                $differing[] = $attribute;
            }
        }

        $rows = [];

        foreach ($list as $vehicle) {
            $values = [];

            foreach ($differing as $attribute) {
                $values[$attribute] = self::value($vehicle, $attribute);
            }

            $rows[] = [
                'id' => $vehicle->id,
                'label' => $vehicle->label(),
                'vsn' => $vehicle->vsn,
                'values' => $values,
            ];
        }

        return new VehicleDistinction($differing, $rows, $differing === []);
    }

    /**
     * Every attribute is rendered to its DISPLAY string before comparison, so two candidates are
     * treated as different only when a customer could actually see the difference. Comparing raw
     * values would offer a chooser whose rows look identical.
     */
    public static function value(VehicleRecord $vehicle, string $attribute): string
    {
        return match ($attribute) {
            'build_period' => $vehicle->buildWindow->labelDe(),
            'power' => $vehicle->powerKw === null && $vehicle->powerPs === null
                ? '—'
                : sprintf('%s kW (%s PS)', $vehicle->powerKw ?? '?', $vehicle->powerPs ?? '?'),
            'body_form' => $vehicle->bodyForm ?? '—',
            'max_speed' => $vehicle->maxSpeedKmh === null
                ? '—'
                : GermanFormat::integer($vehicle->maxSpeedKmh).' km/h',
            'doors' => $vehicle->doors === null ? '—' : $vehicle->doors.' Türen',
            'seats' => $vehicle->seats === null ? '—' : $vehicle->seats.' Sitze',
            'drive_axle' => $vehicle->driveAxle ?? '—',
            'axle_load_front' => $vehicle->axleLoadFrontKg === null
                ? '—'
                : GermanFormat::integer($vehicle->axleLoadFrontKg).' kg',
            default => '—',
        };
    }

    public static function labelDe(string $attribute): string
    {
        return match ($attribute) {
            'build_period' => 'Bauzeitraum',
            'power' => 'Leistung',
            'body_form' => 'Karosserie',
            'max_speed' => 'Höchstgeschwindigkeit',
            'doors' => 'Türen',
            'seats' => 'Sitze',
            'drive_axle' => 'Antrieb',
            'axle_load_front' => 'Achslast vorn',
            default => $attribute,
        };
    }

    /** Shown when nothing displayable differs: the customer reads the variant off their papers. */
    public const READING_HELP_DE = 'Die Variante steht in deiner Zulassungsbescheinigung.';

    public const HEADING_DE = 'Zu dieser Schlüsselnummer gibt es mehrere Varianten.';
}
