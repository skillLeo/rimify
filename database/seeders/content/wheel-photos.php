<?php

declare(strict_types=1);

// The wheels' photographs: which picture stands for which finish, where the wheel is in it, and who
// took it. Data only — `wheels:process-images` renders from it, and CatalogueSeeder and
// GoldenRecordSeeder attach the results; docs/image-credits.md is written from the same credits.
//
// Real products only (the review release §2 and CLAUDE.md, "Placeholder imagery"): example data never
// carries a maker's photograph, and a real product carries only its own. The entries are the four
// official Borbet DB8GT2 pictures the client sent on 27.09.2026 (matt black and matt bronze, from the
// front and at an angle), licensed to the client for selling the wheel. The MOTEC studio shots stay in
// client-photos/ for the day that product comes back.
//
// Keyed by the file name. Client studio shots (`credit.source` = `Kunde`, files named `client-…`) live
// in database/seeders/content/client-photos/ with a `mask` beside each: a grey image of the wheel's
// silhouette, cut from the white studio background (the barrel seen through the spokes stays in).
// `slug` names the output directory and is `<model slug>-<finish>`. `hub` is null: the cap carries
// Borbet's own mark and is left as photographed. `colour` is `none`: a studio shot has no daylight
// cast to correct. An entry with a `view` is a further angle of a finish that already has its front
// view, and is attached to it as a labelled thumbnail.
//
// The front shots also carry the wheel's `brand` and `name` as a person reads them: they are the homepage hero's
// photographs (App\Support\HeroPhotos), shown whether or not the wheel is in the shop, and named in their alt text.
//
// `anchors` are measured on the front shots, in source pixels (1080 × 1080): `centre` [x, y], the
// centre of the bolt circle; `wheel` [x, y, r], the front Felgenhorn's outer edge (typed in: the
// mask's box would include the barrel the angle shows on the right); `pcd` [x, y, r], r the radius
// through the bolt-hole centres; `bore` [x, y, r], the cap covering the centre bore; `valve` [x, y];
// `kba` [x, y, width, height], the stamped approval mark on the inner lip; `bead` [x, y, height], the
// diameter at the bead seat as a vertical line — the Felgenhorn's outer edge less its 17,5 mm height
// (ETRTO, J flange) top and bottom, at the photograph's own scale; `flanges` [x, y, width], the barrel
// between the two Felgenhörner where the photograph shows it, on the right. `stamp` is the approval
// number on the wheel:
// "KBA 53841", legible on both angle shots of the same wheels (docs/review/DATA-CONFLICTS.md, conflict
// 4) — the 18-inch approval, so the hero states the 18-inch configuration's values.
//
// `facts` are those values, as the document states them for the stamped size: what the hero's leaders, caption and spec
// line say about the wheel in the photograph, in every state of the catalogue (the client's #4, the operator's brief
// „THE 34“: the hero makes no product query). 8,5J × 18 H2, ET 35, LK 5/120, Mittenloch 72,5 mm, Radlast 650 kg —
// Gutachten 366-0350-21-WIRD/N1, page 1, the Nachtrag to ABE 53841 (GoldenRecordSeeder).
$stamped = ['width_in' => 8.5, 'diameter_in' => 18.0, 'et_mm' => 35, 'bolt_holes' => 5, 'bolt_circle_mm' => 120.0, 'centre_bore_mm' => 72.5, 'max_load_kg' => 650];

return [
    'client-borbet-db8gt2-bronze-front.jpg' => [
        'slug' => 'borbet-db8gt2-bronze-matt',
        'model' => 'borbet-db8gt2',
        'brand' => 'Borbet',
        'name' => 'DB8GT2',
        'finish' => 'Bronze matt',
        'mask' => 'client-borbet-db8gt2-bronze-front.mask.png',
        'hub' => null,
        'colour' => 'none',
        'anchors' => [
            'centre' => [523, 535],
            'wheel' => [498, 540, 513],
            'pcd' => [523, 535, 109],
            'bore' => [507, 540, 66],
            'valve' => [508, 979],
            'kba' => [158, 746, 48, 78],
            'bead' => [498, 540, 954],
            'flanges' => [1006, 540, 48],
        ],
        'stamp' => '53841',
        'facts' => $stamped,
        'credit' => ['source' => 'Kunde', 'photographer' => 'Borbet (Herstellerbild)', 'licence' => 'Vom Kunden bereitgestellt', 'url' => ''],
    ],
    'client-borbet-db8gt2-bronze-angle.jpg' => [
        'slug' => 'borbet-db8gt2-bronze-matt-schraeg',
        'model' => 'borbet-db8gt2',
        'finish' => 'Bronze matt',
        'view' => 'Schräg von vorn',
        'mask' => 'client-borbet-db8gt2-bronze-angle.mask.png',
        'hub' => null,
        'colour' => 'none',
        'credit' => ['source' => 'Kunde', 'photographer' => 'Borbet (Herstellerbild)', 'licence' => 'Vom Kunden bereitgestellt', 'url' => ''],
    ],
    'client-borbet-db8gt2-schwarz-front.jpg' => [
        'slug' => 'borbet-db8gt2-schwarz-matt',
        'model' => 'borbet-db8gt2',
        'brand' => 'Borbet',
        'name' => 'DB8GT2',
        'finish' => 'Schwarz matt',
        'mask' => 'client-borbet-db8gt2-schwarz-front.mask.png',
        'hub' => null,
        'colour' => 'none',
        'anchors' => [
            'centre' => [526, 533],
            'wheel' => [504, 540, 523],
            'pcd' => [526, 533, 107],
            'bore' => [508, 539, 67],
            'valve' => [509, 989],
            'kba' => [156, 748, 56, 75],
            'bead' => [504, 540, 971],
            'flanges' => [1024, 540, 42],
        ],
        'stamp' => '53841',
        'facts' => $stamped,
        'credit' => ['source' => 'Kunde', 'photographer' => 'Borbet (Herstellerbild)', 'licence' => 'Vom Kunden bereitgestellt', 'url' => ''],
    ],
    'client-borbet-db8gt2-schwarz-angle.jpg' => [
        'slug' => 'borbet-db8gt2-schwarz-matt-schraeg',
        'model' => 'borbet-db8gt2',
        'finish' => 'Schwarz matt',
        'view' => 'Schräg von vorn',
        'mask' => 'client-borbet-db8gt2-schwarz-angle.mask.png',
        'hub' => null,
        'colour' => 'none',
        'credit' => ['source' => 'Kunde', 'photographer' => 'Borbet (Herstellerbild)', 'licence' => 'Vom Kunden bereitgestellt', 'url' => ''],
    ],
];
