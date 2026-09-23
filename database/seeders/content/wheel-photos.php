<?php

declare(strict_types=1);

// The demo wheels' photographs: which picture stands for which finish, where the wheel is in it,
// and who took it. Data only — `wheels:process-images` renders from it and CatalogueSeeder attaches
// the results; docs/image-credits.md is written from the same credits.
//
// A real brand or model name appears only on a photograph of that exact product
// (docs/phase0/ACCURACY.md D1). So only the client's own studio shots of the MOTEC MCR4 Ultimate
// remain. Every free-licence photograph is retired — each showed another maker's wheel on a car,
// brake disc included — and its credit is kept under "Retired" in docs/image-credits.md. A finish
// without a photograph draws the line-art outline.
//
// Keyed by the file name. Studio shots the client supplies (`credit.source` = `Kunde`, files named
// `client-…`) live in database/seeders/content/client-photos/ — they have no public URL to fetch
// them from — and come with a `mask`: a grey image of the background-removal service's alpha, next
// to the photograph. `slug` names the output directory under storage/app/public/demo/wheels/ and is
// `<model slug>-<finish>`. `hub` is null: the cap carries the product brand's own mark and is left
// as photographed. `colour` is `none`: a studio shot has no daylight cast to correct. An entry with
// a `view` is a further angle of a finish that already has its front view, and is attached to it as
// a labelled thumbnail.
//
// `anchors` are measured on the front shot, in source pixels (1080 × 1080): `centre` [x, y]; `pcd`
// [x, y, r], r the radius through the bolt-hole centres; `bore` [x, y, r], the cap covering the
// centre bore; `valve` [x, y]; `kba` [x, y, width, height], the stamped approval mark. The `wheel`
// anchor (the outer lip) is not typed in: scripts/wheel-image.mjs derives it from the mask. `stamp`
// is the approval number the photograph shows (ABE 53810 → 8,5J × 19).
return [
    'client-motec-mcr4-ultimate-front.jpg' => [
        'slug' => 'motec-mcr4-ultimate-light-grey',
        'model' => 'motec-mcr4-ultimate',
        'finish' => 'Light Grey D5',
        'mask' => 'client-motec-mcr4-ultimate-front.mask.png',
        'hub' => null,
        'colour' => 'none',
        'anchors' => [
            'centre' => [539, 534],
            'pcd' => [539, 534, 108],
            'bore' => [540, 537, 70],
            'valve' => [537, 972],
            'kba' => [540, 1013, 88, 18],
        ],
        'stamp' => '53810',
        'credit' => ['source' => 'Kunde', 'photographer' => 'MOTEC (Herstellerbild)', 'licence' => 'Vom Kunden bereitgestellt', 'url' => ''],
    ],
    'client-motec-mcr4-ultimate-angle.jpg' => [
        'slug' => 'motec-mcr4-ultimate-light-grey-schraeg',
        'model' => 'motec-mcr4-ultimate',
        'finish' => 'Light Grey D5',
        'view' => 'Schräg von vorn',
        'mask' => 'client-motec-mcr4-ultimate-angle.mask.png',
        'hub' => null,
        'colour' => 'none',
        'credit' => ['source' => 'Kunde', 'photographer' => 'MOTEC (Herstellerbild)', 'licence' => 'Vom Kunden bereitgestellt', 'url' => ''],
    ],
    'client-motec-mcr4-ultimate-rear.jpg' => [
        'slug' => 'motec-mcr4-ultimate-light-grey-hinten',
        'model' => 'motec-mcr4-ultimate',
        'finish' => 'Light Grey D5',
        'view' => 'Schräg von hinten',
        'mask' => 'client-motec-mcr4-ultimate-rear.mask.png',
        'hub' => null,
        'colour' => 'none',
        'credit' => ['source' => 'Kunde', 'photographer' => 'MOTEC (Herstellerbild)', 'licence' => 'Vom Kunden bereitgestellt', 'url' => ''],
    ],
];
