<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Vehicle;
use Illuminate\Database\Seeder;

/**
 * The vehicle tree, and the pair that makes the whole product make sense.
 *
 * HSN 1860 + TSN AAS resolves to TWO different vehicles whose top speeds are 280 and 290 km/h and
 * whose front axle loads are 1210 and 1225 kg — precisely the two fields the legal tyre
 * specification is derived from. A resolver returning "the first match" computes the requirement
 * from the wrong car, confidently, on a page headed *passend für dein Fahrzeug*.
 *
 * Both rows are seeded so the disambiguation step is demonstrable rather than theoretical.
 *
 * Two blocks follow. `VEHICLES` is hand-written and every row in it carries a trap the engine has
 * to survive — the duplicate key pair, leading zeros in an HSN, an unparseable import, a car slow
 * enough to reach the bottom of the speed table. `FLEET` is the ordinary volume: eight makes with
 * three to five models each, so the make → model → variant selector drills through something that
 * behaves like a real tree rather than a demo with one branch.
 */
class VehicleSeeder extends Seeder
{
    public function run(): void
    {
        foreach (self::VEHICLES as $vehicle) {
            Vehicle::updateOrCreate(
                ['source_vehicle_id' => $vehicle['source_vehicle_id']],
                $vehicle + ['raw' => $vehicle, 'imported_at' => now()],
            );
        }

        foreach ($this->fleet() as $vehicle) {
            Vehicle::updateOrCreate(
                ['source_vehicle_id' => $vehicle['source_vehicle_id']],
                $vehicle + ['raw' => $vehicle, 'imported_at' => now()],
            );
        }
    }

    /**
     * The compact fleet table, expanded into full vehicle rows.
     *
     * Ids start at 100 so the hand-written block above can grow without renumbering anything —
     * `source_vehicle_id` is the import's own key and re-using one would silently overwrite a row.
     *
     * @return list<array<string, mixed>>
     */
    private function fleet(): array
    {
        $rows = [];
        $id = 100;

        foreach (self::FLEET as [$make, $hsn, $models]) {
            foreach ($models as [$model, $variants]) {
                foreach ($variants as [$variant, $type, $tsn, $body, $drive, $from, $to, $front, $rear, $kmh, $kw, $ccm, $doors, $seats]) {
                    $rows[] = [
                        'source_vehicle_id' => $id,
                        'hsn' => $hsn,
                        'tsn' => $tsn,
                        'vsn' => sprintf('%05d', $id),
                        'make' => $make,
                        'model' => $model,
                        'variant' => $variant,
                        'type_designation' => $type,
                        'eg_nummer_raw' => sprintf('e1*2007/46*%04d*%02d', 1000 + ($id % 900), $id % 20),
                        'body_form' => $body,
                        'drive_axle' => $drive,
                        'build_from' => $from,
                        // NULL means still in production, never today (R-02).
                        'build_to' => $to,
                        'axle_load_front_kg' => $front,
                        'axle_load_rear_kg' => $rear,
                        'max_speed_kmh' => $kmh,
                        'power_kw' => $kw,
                        // PS from kW at the statutory factor, rounded as the papers round it.
                        'power_ps' => (int) round($kw * 1.35962),
                        'displacement_ccm' => $ccm,
                        'doors' => $doors,
                        'seats' => $seats,
                    ];

                    $id++;
                }
            }
        }

        return $rows;
    }

    /**
     * make · HSN · [model · [variant, type, TSN, body, drive, from, to, front kg, rear kg,
     * km/h, kW, ccm, doors, seats]]
     *
     * One HSN per make is how the real table behaves for a manufacturer's main entry, and the TSN
     * is what separates the variants underneath it.
     *
     * @var list<array{0: string, 1: string, 2: list<array{0: string, 1: list<array{0: string, 1: string, 2: string, 3: string, 4: string, 5: string, 6: string|null, 7: int, 8: int, 9: int, 10: int, 11: int|null, 12: int, 13: int}>}>}>
     */
    private const FLEET = [
        ['Audi', '0588', [
            ['A3', [
                ['A3 Sportback 35 TFSI', '8Y', 'AKA', 'Schrägheck', 'Vorderachse', '2020-05-01', null, 1000, 1010, 224, 110, 1498, 5, 5],
                ['A3 Limousine 40 TFSI', '8Y', 'AKB', 'Limousine', 'Allrad', '2020-09-01', null, 1055, 1045, 250, 140, 1984, 4, 5],
                ['S3 Sportback quattro', '8Y', 'AKC', 'Schrägheck', 'Allrad', '2020-11-01', null, 1090, 1060, 250, 228, 1984, 5, 5],
            ]],
            ['A4', [
                ['A4 Avant 40 TDI quattro', 'B9', 'AJD', 'Kombi', 'Allrad', '2019-06-01', '2023-09-30', 1145, 1140, 241, 140, 1968, 5, 5],
                ['A4 Limousine 45 TFSI', 'B9', 'AJE', 'Limousine', 'Allrad', '2019-06-01', '2023-09-30', 1135, 1105, 250, 195, 1984, 4, 5],
            ]],
            ['Q5', [
                ['Q5 40 TDI quattro', 'FY', 'AJQ', 'SUV', 'Allrad', '2020-10-01', null, 1240, 1310, 222, 150, 1968, 5, 5],
                ['SQ5 TDI', 'FY', 'AJR', 'SUV', 'Allrad', '2021-01-01', null, 1290, 1340, 250, 251, 2967, 5, 5],
            ]],
            ['TT', [
                ['TT Coupé 45 TFSI', '8S', 'AHT', 'Coupe', 'Vorderachse', '2018-09-01', '2023-11-30', 920, 860, 250, 180, 1984, 2, 4],
                ['TT RS Coupé', '8S', 'AHU', 'Coupe', 'Allrad', '2019-03-01', '2022-12-31', 1000, 900, 280, 294, 2480, 2, 4],
            ]],
        ]],
        ['BMW', '0005', [
            ['1er', [
                ['118i', 'F40', 'CLA', 'Schrägheck', 'Vorderachse', '2019-09-01', null, 940, 920, 213, 103, 1499, 5, 5],
                ['M135i xDrive', 'F40', 'CLB', 'Schrägheck', 'Allrad', '2019-09-01', null, 1015, 985, 250, 225, 1998, 5, 5],
            ]],
            ['4er', [
                ['420i Coupé', 'G22', 'CMA', 'Coupe', 'Hinterachse', '2020-10-01', null, 960, 1090, 240, 135, 1998, 2, 4],
                ['M440i xDrive Coupé', 'G22', 'CMB', 'Coupe', 'Allrad', '2020-10-01', null, 1020, 1145, 250, 275, 2998, 2, 4],
                ['430i Cabrio', 'G23', 'CMC', 'Cabrio', 'Hinterachse', '2021-03-01', null, 1000, 1120, 250, 180, 1998, 2, 4],
            ]],
            ['5er', [
                ['520d Limousine', 'G30', 'CGA', 'Limousine', 'Hinterachse', '2017-02-01', '2023-06-30', 1050, 1180, 238, 140, 1995, 4, 5],
                ['540i xDrive Touring', 'G31', 'CGB', 'Kombi', 'Allrad', '2017-06-01', '2023-06-30', 1140, 1285, 250, 250, 2998, 5, 5],
            ]],
            ['X3', [
                ['X3 xDrive20d', 'G01', 'CHA', 'SUV', 'Allrad', '2017-11-01', null, 1180, 1310, 213, 140, 1995, 5, 5],
                ['X3 M40i', 'G01', 'CHB', 'SUV', 'Allrad', '2018-03-01', null, 1230, 1355, 250, 265, 2998, 5, 5],
            ]],
        ]],
        ['Volkswagen', '0603', [
            ['Polo', [
                ['Polo 1.0 TSI', 'AW', 'BXA', 'Schrägheck', 'Vorderachse', '2017-10-01', null, 855, 830, 187, 70, 999, 5, 5],
                ['Polo GTI', 'AW', 'BXB', 'Schrägheck', 'Vorderachse', '2018-03-01', null, 940, 880, 240, 152, 1984, 5, 5],
            ]],
            ['Passat', [
                ['Passat Variant 2.0 TDI', 'B8', 'BWA', 'Kombi', 'Vorderachse', '2019-09-01', '2023-12-31', 1140, 1120, 223, 110, 1968, 5, 5],
                ['Passat Variant 2.0 TSI 4MOTION', 'B8', 'BWB', 'Kombi', 'Allrad', '2019-09-01', '2023-12-31', 1180, 1160, 250, 200, 1984, 5, 5],
            ]],
            ['Tiguan', [
                ['Tiguan 1.5 TSI', 'AD1', 'BVA', 'SUV', 'Vorderachse', '2020-10-01', null, 1120, 1170, 204, 110, 1498, 5, 5],
                ['Tiguan R 4MOTION', 'AD1', 'BVB', 'SUV', 'Allrad', '2021-02-01', null, 1215, 1265, 250, 235, 1984, 5, 5],
            ]],
            ['T-Roc', [
                ['T-Roc 1.5 TSI', 'A11', 'BUA', 'SUV', 'Vorderachse', '2019-01-01', null, 1020, 1015, 205, 110, 1498, 5, 5],
                ['T-Roc R 4MOTION', 'A11', 'BUB', 'SUV', 'Allrad', '2019-11-01', null, 1090, 1075, 250, 221, 1984, 5, 5],
            ]],
        ]],
        ['Mercedes-Benz', '1313', [
            ['CLA', [
                ['CLA 200 Coupé', 'C118', 'DAA', 'Coupe', 'Vorderachse', '2019-05-01', null, 960, 940, 230, 120, 1332, 4, 5],
                ['CLA 35 AMG 4MATIC', 'C118', 'DAB', 'Coupe', 'Allrad', '2019-07-01', null, 1030, 1000, 250, 225, 1991, 4, 5],
            ]],
            ['E-Klasse', [
                ['E 220 d Limousine', 'W213', 'DBA', 'Limousine', 'Hinterachse', '2020-09-01', '2023-08-31', 1090, 1180, 240, 143, 1993, 4, 5],
                ['E 300 de T-Modell', 'S213', 'DBB', 'Kombi', 'Hinterachse', '2020-09-01', '2023-08-31', 1180, 1290, 250, 143, 1950, 5, 5],
            ]],
            ['GLC', [
                ['GLC 220 d 4MATIC', 'X254', 'DCA', 'SUV', 'Allrad', '2022-06-01', null, 1240, 1350, 219, 145, 1993, 5, 5],
                ['GLC 300 4MATIC', 'X254', 'DCB', 'SUV', 'Allrad', '2022-06-01', null, 1250, 1360, 240, 190, 1999, 5, 5],
            ]],
        ]],
        ['Porsche', '0583', [
            ['718', [
                ['718 Cayman', '982', 'AQA', 'Coupe', 'Hinterachse', '2016-04-01', null, 700, 830, 275, 220, 1988, 2, 2],
                ['718 Cayman GTS 4.0', '982', 'AQB', 'Coupe', 'Hinterachse', '2020-03-01', null, 730, 865, 293, 294, 3995, 2, 2],
                ['718 Boxster S', '982', 'AQC', 'Cabrio', 'Hinterachse', '2016-04-01', null, 715, 845, 285, 257, 2497, 2, 2],
            ]],
            ['Macan', [
                ['Macan', '95B', 'ARA', 'SUV', 'Allrad', '2021-09-01', null, 1160, 1290, 232, 195, 1984, 5, 5],
                ['Macan GTS', '95B', 'ARB', 'SUV', 'Allrad', '2021-09-01', null, 1195, 1330, 272, 324, 2894, 5, 5],
            ]],
            ['Cayenne', [
                ['Cayenne', '9YA', 'ASA', 'SUV', 'Allrad', '2018-08-01', null, 1310, 1480, 245, 250, 2995, 5, 5],
                ['Cayenne S Coupé', '9YB', 'ASB', 'Coupe', 'Allrad', '2019-10-01', null, 1345, 1520, 273, 324, 2894, 5, 4],
            ]],
        ]],
        ['Opel', '1844', [
            ['Corsa', [
                ['Corsa 1.2', 'F', 'CJA', 'Schrägheck', 'Vorderachse', '2019-11-01', null, 830, 790, 180, 55, 1199, 5, 5],
                ['Corsa GS Line 1.2 Turbo', 'F', 'CJB', 'Schrägheck', 'Vorderachse', '2020-02-01', null, 860, 810, 208, 96, 1199, 5, 5],
            ]],
            ['Insignia', [
                ['Insignia Sports Tourer 2.0 D', 'B', 'CKA', 'Kombi', 'Vorderachse', '2018-06-01', '2022-03-31', 1120, 1100, 220, 128, 1956, 5, 5],
                ['Insignia GSi 4x4', 'B', 'CKB', 'Kombi', 'Allrad', '2018-09-01', '2022-03-31', 1180, 1160, 250, 169, 1998, 5, 5],
            ]],
            ['Mokka', [
                ['Mokka 1.2 Turbo', 'B', 'CLA', 'SUV', 'Vorderachse', '2020-09-01', null, 900, 890, 200, 96, 1199, 5, 5],
                // An EV has no displacement. NULL, never 0 — a zero here would be a measurement.
                ['Mokka-e', 'B', 'CLB', 'SUV', 'Vorderachse', '2021-01-01', null, 990, 950, 150, 100, null, 5, 5],
            ]],
        ]],
        ['Ford', '8566', [
            ['Fiesta', [
                ['Fiesta 1.0 EcoBoost', 'MK8', 'AHA', 'Schrägheck', 'Vorderachse', '2017-06-01', '2023-06-30', 860, 820, 190, 74, 999, 5, 5],
                ['Fiesta ST', 'MK8', 'AHB', 'Schrägheck', 'Vorderachse', '2018-03-01', '2023-06-30', 920, 860, 232, 147, 1497, 3, 5],
            ]],
            ['Kuga', [
                ['Kuga 1.5 EcoBoost', 'MK3', 'AJA', 'SUV', 'Vorderachse', '2019-09-01', null, 1090, 1120, 200, 110, 1497, 5, 5],
                ['Kuga ST-Line X PHEV', 'MK3', 'AJB', 'SUV', 'Vorderachse', '2020-03-01', null, 1170, 1190, 200, 165, 2488, 5, 5],
            ]],
            ['Puma', [
                ['Puma 1.0 EcoBoost Hybrid', 'J2K', 'AKA', 'SUV', 'Vorderachse', '2019-12-01', null, 930, 910, 191, 92, 999, 5, 5],
                ['Puma ST', 'J2K', 'AKB', 'SUV', 'Vorderachse', '2021-02-01', null, 980, 940, 220, 147, 1497, 5, 5],
            ]],
        ]],
        ['Škoda', '8004', [
            ['Fabia', [
                ['Fabia 1.0 TSI', 'PJ', 'AMA', 'Schrägheck', 'Vorderachse', '2021-10-01', null, 860, 830, 195, 81, 999, 5, 5],
                ['Fabia Monte Carlo 1.5 TSI', 'PJ', 'AMB', 'Schrägheck', 'Vorderachse', '2022-03-01', null, 900, 860, 225, 110, 1498, 5, 5],
            ]],
            ['Superb', [
                ['Superb Combi 2.0 TDI', '3V', 'ANA', 'Kombi', 'Vorderachse', '2019-08-01', '2023-10-31', 1150, 1160, 223, 110, 1968, 5, 5],
                ['Superb Combi 2.0 TSI 4x4', '3V', 'ANB', 'Kombi', 'Allrad', '2019-08-01', '2023-10-31', 1195, 1205, 250, 200, 1984, 5, 5],
            ]],
            ['Kodiaq', [
                ['Kodiaq 2.0 TDI 4x4', 'NS', 'APA', 'SUV', 'Allrad', '2021-04-01', null, 1240, 1360, 205, 110, 1968, 5, 7],
                ['Kodiaq RS', 'NS', 'APB', 'SUV', 'Allrad', '2021-06-01', null, 1290, 1400, 234, 180, 1984, 5, 7],
            ]],
            ['Enyaq', [
                ['Enyaq iV 60', '5AZ', 'AQA', 'SUV', 'Hinterachse', '2021-03-01', null, 1160, 1280, 160, 132, null, 5, 5],
                ['Enyaq RS iV', '5AZ', 'AQB', 'SUV', 'Allrad', '2022-01-01', null, 1240, 1370, 180, 220, null, 5, 5],
            ]],
        ]],
    ];

    /**
     * Build windows use the first of the start month and the last of the end month. A NULL
     * `build_to` means still in production — never today's date.
     *
     * @var list<array<string, mixed>>
     */
    private const VEHICLES = [
        // ── The disambiguation pair ─────────────────────────────────────────────────
        [
            'source_vehicle_id' => 1, 'hsn' => '1860', 'tsn' => 'AAS', 'vsn' => '00001',
            'make' => 'Audi', 'model' => 'RS 4', 'variant' => 'RS 4 Avant Quattro',
            'type_designation' => 'B9', 'eg_nummer_raw' => 'e1*2001/116*0447*11',
            'body_form' => 'Kombi', 'drive_axle' => 'Allrad',
            'build_from' => '2018-03-01', 'build_to' => '2019-11-30',
            'axle_load_front_kg' => 1210, 'axle_load_rear_kg' => 1235, 'max_speed_kmh' => 280,
            'power_kw' => 331, 'power_ps' => 450, 'displacement_ccm' => 2894, 'doors' => 5, 'seats' => 5,
        ],
        [
            'source_vehicle_id' => 2, 'hsn' => '1860', 'tsn' => 'AAS', 'vsn' => '00017',
            'make' => 'Audi', 'model' => 'RS 4', 'variant' => 'RS 4 Avant Quattro',
            'type_designation' => 'B9', 'eg_nummer_raw' => 'e1*2001/116*0447*15',
            'body_form' => 'Kombi', 'drive_axle' => 'Allrad',
            'build_from' => '2019-12-01', 'build_to' => null,
            'axle_load_front_kg' => 1225, 'axle_load_rear_kg' => 1235, 'max_speed_kmh' => 290,
            'power_kw' => 331, 'power_ps' => 450, 'displacement_ccm' => 2894, 'doors' => 5, 'seats' => 5,
        ],

        // ── HSN with significant leading zeros ──────────────────────────────────────
        [
            'source_vehicle_id' => 3, 'hsn' => '0005', 'tsn' => '582', 'vsn' => '00003',
            'make' => 'BMW', 'model' => '3er', 'variant' => '3er Coupé',
            'type_designation' => 'E36', 'eg_nummer_raw' => 'E1*98/14*0105*',
            'body_form' => 'Coupe', 'drive_axle' => 'Hinterachse',
            'build_from' => '1995-01-01', 'build_to' => '1999-12-31',
            'axle_load_front_kg' => 900, 'axle_load_rear_kg' => 1020, 'max_speed_kmh' => 225,
            'power_kw' => 142, 'power_ps' => 193, 'displacement_ccm' => 2494, 'doors' => 2, 'seats' => 4,
        ],
        [
            'source_vehicle_id' => 4, 'hsn' => '0005', 'tsn' => '674', 'vsn' => '00004',
            'make' => 'BMW', 'model' => 'Z8', 'variant' => 'Z8 4.9',
            'type_designation' => 'E52', 'eg_nummer_raw' => 'A333*',
            'body_form' => 'Cabrio', 'drive_axle' => 'Hinterachse',
            'build_from' => '2000-03-01', 'build_to' => '2003-06-30',
            'axle_load_front_kg' => 920, 'axle_load_rear_kg' => 1070, 'max_speed_kmh' => 250,
            'power_kw' => 294, 'power_ps' => 400, 'displacement_ccm' => 4941, 'doors' => 2, 'seats' => 2,
        ],

        // ── One HSN spanning several TSNs and generations ───────────────────────────
        [
            'source_vehicle_id' => 5, 'hsn' => '7967', 'tsn' => '307', 'vsn' => '00005',
            'make' => 'Audi', 'model' => 'RS 4', 'variant' => 'RS4 2.7 Avant',
            'type_designation' => 'B5', 'eg_nummer_raw' => 'e1*98/14*0105',
            'body_form' => 'Kombi', 'drive_axle' => 'Allrad',
            'build_from' => '2000-06-01', 'build_to' => '2001-09-30',
            'axle_load_front_kg' => 1145, 'axle_load_rear_kg' => 1140, 'max_speed_kmh' => 250,
            'power_kw' => 279, 'power_ps' => 380, 'displacement_ccm' => 2671, 'doors' => 5, 'seats' => 5,
        ],
        [
            // The 4.2 RS4 of 2005–2008 is the B7, with the naturally aspirated 4.2 FSI.
            'source_vehicle_id' => 6, 'hsn' => '7967', 'tsn' => 'AAE', 'vsn' => '00006',
            'make' => 'Audi', 'model' => 'RS 4', 'variant' => 'RS4 4.2 FSI Quattro',
            'type_designation' => 'B7', 'eg_nummer_raw' => 'C640*',
            'body_form' => 'Limousine', 'drive_axle' => 'Allrad',
            'build_from' => '2005-06-01', 'build_to' => '2008-06-30',
            'axle_load_front_kg' => 1230, 'axle_load_rear_kg' => 1100, 'max_speed_kmh' => 280,
            'power_kw' => 309, 'power_ps' => 420, 'displacement_ccm' => 4163, 'doors' => 4, 'seats' => 5,
        ],

        // ── A slow car, so the low end of the speed table is exercised ──────────────
        [
            'source_vehicle_id' => 7, 'hsn' => '0603', 'tsn' => 'AAT', 'vsn' => '00007',
            'make' => 'Volkswagen', 'model' => 'Fox', 'variant' => 'Fox 1.2',
            'type_designation' => '5Z', 'eg_nummer_raw' => 'E611*',
            'body_form' => 'Schrägheck', 'drive_axle' => 'Vorderachse',
            'build_from' => '2005-04-01', 'build_to' => '2011-12-31',
            'axle_load_front_kg' => 765, 'axle_load_rear_kg' => 750, 'max_speed_kmh' => 148,
            'power_kw' => 40, 'power_ps' => 55, 'displacement_ccm' => 1198, 'doors' => 3, 'seats' => 5,
        ],

        // ── A vehicle the importer could not fully parse (R-03) ─────────────────────
        // Present on purpose: it must never produce a positive verdict anywhere, and the
        // asymmetry suite and the admin "needs review" queue both need a real example.
        [
            // 1313 is Mercedes-Benz's HSN, as in the fleet below; 0035 is Opel's.
            'source_vehicle_id' => 8, 'hsn' => '1313', 'tsn' => 'AKJ', 'vsn' => '00008',
            'make' => 'Mercedes-Benz', 'model' => 'C-Klasse', 'variant' => 'C 43 AMG',
            'type_designation' => 'W205', 'eg_nummer_raw' => ' e1**2007/46*0123 ',
            'body_form' => 'Limousine', 'drive_axle' => 'Allrad',
            'build_from' => '2016-06-01', 'build_to' => null,
            'axle_load_front_kg' => null, 'axle_load_rear_kg' => null, 'max_speed_kmh' => null,
            'power_kw' => 287, 'power_ps' => 390, 'displacement_ccm' => 2996, 'doors' => 4, 'seats' => 5,
            'needs_review' => true,
        ],

        // ── Ordinary volume cars, for a selector that looks real ────────────────────
        [
            'source_vehicle_id' => 9, 'hsn' => '0603', 'tsn' => 'BGU', 'vsn' => '00009',
            'make' => 'Volkswagen', 'model' => 'Golf', 'variant' => 'Golf GTI',
            'type_designation' => 'MK8', 'eg_nummer_raw' => 'e1*2007/46*0623*07',
            'body_form' => 'Schrägheck', 'drive_axle' => 'Vorderachse',
            'build_from' => '2020-03-01', 'build_to' => null,
            'axle_load_front_kg' => 1080, 'axle_load_rear_kg' => 1010, 'max_speed_kmh' => 250,
            'power_kw' => 180, 'power_ps' => 245, 'displacement_ccm' => 1984, 'doors' => 5, 'seats' => 5,
        ],
        [
            'source_vehicle_id' => 10, 'hsn' => '0583', 'tsn' => 'AQF', 'vsn' => '00010',
            'make' => 'Porsche', 'model' => '911', 'variant' => '911 Carrera S',
            'type_designation' => '992', 'eg_nummer_raw' => 'e1*2007/46*1234*03',
            'body_form' => 'Coupe', 'drive_axle' => 'Hinterachse',
            'build_from' => '2019-02-01', 'build_to' => null,
            'axle_load_front_kg' => 830, 'axle_load_rear_kg' => 1090, 'max_speed_kmh' => 308,
            'power_kw' => 331, 'power_ps' => 450, 'displacement_ccm' => 2981, 'doors' => 2, 'seats' => 4,
        ],
        [
            'source_vehicle_id' => 11, 'hsn' => '0035', 'tsn' => 'CJA', 'vsn' => '00011',
            'make' => 'Opel', 'model' => 'Astra', 'variant' => 'Astra 1.4 Turbo',
            'type_designation' => 'K', 'eg_nummer_raw' => 'e1*2007/46*0777*02',
            'body_form' => 'Schrägheck', 'drive_axle' => 'Vorderachse',
            'build_from' => '2015-10-01', 'build_to' => '2021-08-31',
            'axle_load_front_kg' => 950, 'axle_load_rear_kg' => 900, 'max_speed_kmh' => 210,
            'power_kw' => 92, 'power_ps' => 125, 'displacement_ccm' => 1399, 'doors' => 5, 'seats' => 5,
        ],
        [
            'source_vehicle_id' => 12, 'hsn' => '8566', 'tsn' => 'AHK', 'vsn' => '00012',
            'make' => 'Ford', 'model' => 'Focus', 'variant' => 'Focus ST',
            'type_designation' => 'MK4', 'eg_nummer_raw' => 'e13*2007/46*0456*05',
            'body_form' => 'Schrägheck', 'drive_axle' => 'Vorderachse',
            'build_from' => '2019-05-01', 'build_to' => null,
            'axle_load_front_kg' => 1075, 'axle_load_rear_kg' => 985, 'max_speed_kmh' => 250,
            'power_kw' => 206, 'power_ps' => 280, 'displacement_ccm' => 2261, 'doors' => 5, 'seats' => 5,
        ],
        [
            'source_vehicle_id' => 13, 'hsn' => '8004', 'tsn' => 'AMG', 'vsn' => '00013',
            'make' => 'Škoda', 'model' => 'Octavia', 'variant' => 'Octavia RS',
            'type_designation' => 'NX', 'eg_nummer_raw' => 'e1*2007/46*0899*01',
            'body_form' => 'Kombi', 'drive_axle' => 'Vorderachse',
            'build_from' => '2020-09-01', 'build_to' => null,
            'axle_load_front_kg' => 1120, 'axle_load_rear_kg' => 1070, 'max_speed_kmh' => 250,
            'power_kw' => 180, 'power_ps' => 245, 'displacement_ccm' => 1984, 'doors' => 5, 'seats' => 5,
        ],
        [
            'source_vehicle_id' => 14, 'hsn' => '0005', 'tsn' => 'CKT', 'vsn' => '00014',
            'make' => 'BMW', 'model' => '3er', 'variant' => '330i Limousine',
            'type_designation' => 'G20', 'eg_nummer_raw' => 'e1*2007/46*1111*09',
            'body_form' => 'Limousine', 'drive_axle' => 'Hinterachse',
            'build_from' => '2019-03-01', 'build_to' => null,
            'axle_load_front_kg' => 960, 'axle_load_rear_kg' => 1105, 'max_speed_kmh' => 250,
            'power_kw' => 190, 'power_ps' => 258, 'displacement_ccm' => 1998, 'doors' => 4, 'seats' => 5,
        ],
        [
            'source_vehicle_id' => 15, 'hsn' => '1313', 'tsn' => 'AAB', 'vsn' => '00015',
            'make' => 'Mercedes-Benz', 'model' => 'A-Klasse', 'variant' => 'A 200',
            'type_designation' => 'W177', 'eg_nummer_raw' => 'e1*2007/46*0345*04',
            'body_form' => 'Schrägheck', 'drive_axle' => 'Vorderachse',
            'build_from' => '2018-05-01', 'build_to' => null,
            'axle_load_front_kg' => 930, 'axle_load_rear_kg' => 900, 'max_speed_kmh' => 225,
            'power_kw' => 120, 'power_ps' => 163, 'displacement_ccm' => 1332, 'doors' => 5, 'seats' => 5,
        ],
    ];
}
