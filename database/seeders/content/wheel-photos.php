<?php

declare(strict_types=1);

// The demo wheels' photographs: which free-licence picture stands for which finish, where the
// wheel is in it, and who took it. Data only — `wheels:process-images` renders from it and
// CatalogueSeeder attaches the results; docs/image-credits.md is written from the same credits.
//
// Keyed by the file in storage/app/public/placeholder/. `slug` names the output directory under
// storage/app/public/demo/wheels/ and is `<model slug>-<finish>`. `circle` is the rim's outer lip
// as cx, cy, r in source pixels — measured once on a grid, never guessed. `hub` is the centre cap
// as cx, cy, r in source pixels, measured the same way and on its own: a photograph taken a little
// off-axis puts the hub well away from the rim's centre. Where the cap carries another company's
// mark (a car maker, another wheel brand) the pipeline paints a plain cap in the wheel's own finish
// over it; `null` leaves the cap as photographed, for a mark that is the product brand's own.
// `colour` may be `none` to skip the daylight-cast curve. One photograph serves at most one model;
// a model may have two photographs for two finishes.
//
// Every free-licence photograph is face-on: the sharp path cuts along a circle, and a
// three-quarter view would leave a sliver of tyre on one side. Licences: Unsplash License (free
// for commercial use, no attribution required) and Pexels License (the same). Attribution is
// given anyway.
//
// Studio shots the client supplies (`credit.source` = `Kunde`, files named `client-…`) live in
// database/seeders/content/client-photos/ — they have no public URL to fetch them from — and come
// with a `mask` instead of a circle: a grey image of the background-removal service's alpha, next
// to the photograph. They may be angled. An entry with a `view` is a further angle of a finish
// that already has its front view, and is attached to it as a labelled thumbnail.
return [
    'client-motec-mcr4-ultimate-front.jpg' => [
        'slug' => 'motec-mcr4-ultimate-light-grey',
        'model' => 'motec-mcr4-ultimate',
        'finish' => 'Light Grey',
        'mask' => 'client-motec-mcr4-ultimate-front.mask.png',
        'hub' => null,
        'colour' => 'none',
        'credit' => ['source' => 'Kunde', 'photographer' => 'MOTEC (Herstellerbild)', 'licence' => 'Vom Kunden bereitgestellt', 'url' => ''],
    ],
    'client-motec-mcr4-ultimate-angle.jpg' => [
        'slug' => 'motec-mcr4-ultimate-light-grey-schraeg',
        'model' => 'motec-mcr4-ultimate',
        'finish' => 'Light Grey',
        'view' => 'Schräg von vorn',
        'mask' => 'client-motec-mcr4-ultimate-angle.mask.png',
        'hub' => null,
        'colour' => 'none',
        'credit' => ['source' => 'Kunde', 'photographer' => 'MOTEC (Herstellerbild)', 'licence' => 'Vom Kunden bereitgestellt', 'url' => ''],
    ],
    'client-motec-mcr4-ultimate-rear.jpg' => [
        'slug' => 'motec-mcr4-ultimate-light-grey-hinten',
        'model' => 'motec-mcr4-ultimate',
        'finish' => 'Light Grey',
        'view' => 'Schräg von hinten',
        'mask' => 'client-motec-mcr4-ultimate-rear.mask.png',
        'hub' => null,
        'colour' => 'none',
        'credit' => ['source' => 'Kunde', 'photographer' => 'MOTEC (Herstellerbild)', 'licence' => 'Vom Kunden bereitgestellt', 'url' => ''],
    ],
    // unsplash-h82zfDTFUP0.jpg (Mathias Reding, Unsplash License) is retired: a wall shows through
    // every spoke window and the circular mask cannot cut windows. Its finish draws the outline.
    'unsplash-60ZSTXNgXgM.jpg' => [
        'slug' => 'oz-racing-superturismo-gt-matt-race-silber',
        'model' => 'oz-racing-superturismo-gt',
        'finish' => 'Matt Race Silber',
        'circle' => [810, 553, 440],
        'hub' => [810, 551, 70],
        'credit' => ['source' => 'Unsplash', 'photographer' => 'Luca Nicoletti', 'licence' => 'Unsplash License', 'url' => 'https://unsplash.com/photos/60ZSTXNgXgM'],
    ],
    'unsplash-7eCBiZgyr4E.jpg' => [
        'slug' => 'oz-racing-formula-hlt-grigio-corsa',
        'model' => 'oz-racing-formula-hlt',
        'finish' => 'Grigio Corsa',
        'circle' => [2938, 1352, 955],
        'hub' => [2938, 1318, 176],
        'credit' => ['source' => 'Unsplash', 'photographer' => 'Vlad Grebenyev', 'licence' => 'Unsplash License', 'url' => 'https://unsplash.com/photos/7eCBiZgyr4E'],
    ],
    'unsplash-OgIik_VHAmU.jpg' => [
        'slug' => 'bbs-sr-himalaya-grau',
        'model' => 'bbs-sr',
        'finish' => 'Himalaya Grau',
        'circle' => [1795, 2935, 1165],
        'hub' => null,
        'credit' => ['source' => 'Unsplash', 'photographer' => 'serjan midili', 'licence' => 'Unsplash License', 'url' => 'https://unsplash.com/photos/OgIik_VHAmU'],
    ],
    'unsplash-RUacGu7OvXs.jpg' => [
        'slug' => 'alutec-monstr-racing-schwarz',
        'model' => 'alutec-monstr',
        'finish' => 'Racing Schwarz',
        'circle' => [1520, 900, 665],
        'hub' => [1570, 1022, 124],
        'credit' => ['source' => 'Unsplash', 'photographer' => 'J Z', 'licence' => 'Unsplash License', 'url' => 'https://unsplash.com/photos/RUacGu7OvXs'],
    ],
    'unsplash-Y_251QYX55Y.jpg' => [
        'slug' => 'mam-a5-palladium',
        'model' => 'mam-a5',
        'finish' => 'Palladium',
        'circle' => [1290, 1320, 528],
        'hub' => [1287, 1345, 70],
        'credit' => ['source' => 'Unsplash', 'photographer' => 'Erik Mclean', 'licence' => 'Unsplash License', 'url' => 'https://unsplash.com/photos/Y_251QYX55Y'],
    ],
    'unsplash-ej_FX2MqClQ.jpg' => [
        'slug' => 'mam-rs4-silber',
        'model' => 'mam-rs4',
        'finish' => 'Silber',
        'circle' => [1341, 1650, 400],
        'hub' => [1369, 1745, 62],
        'credit' => ['source' => 'Unsplash', 'photographer' => 'Dillon Kydd', 'licence' => 'Unsplash License', 'url' => 'https://unsplash.com/photos/ej_FX2MqClQ'],
    ],
    'unsplash-4gxI7gj0l2s.jpg' => [
        'slug' => 'borbet-lv5-schwarz-matt',
        'model' => 'borbet-lv5',
        'finish' => 'Schwarz matt',
        'circle' => [1062, 2642, 540],
        'hub' => [987, 2725, 72],
        'credit' => ['source' => 'Unsplash', 'photographer' => 'Volodymyr Dobrovolskyy', 'licence' => 'Unsplash License', 'url' => 'https://unsplash.com/photos/4gxI7gj0l2s'],
    ],
    'unsplash-Z9jNN_F2PwU.jpg' => [
        'slug' => 'brock-b40-silber',
        'model' => 'brock-b40',
        'finish' => 'Silber',
        'circle' => [1111, 1623, 1025],
        'hub' => [1111, 1666, 190],
        'credit' => ['source' => 'Unsplash', 'photographer' => 'Toby Hall', 'licence' => 'Unsplash License', 'url' => 'https://unsplash.com/photos/Z9jNN_F2PwU'],
    ],
    'pexels-12174717.jpg' => [
        'slug' => 'aez-leipzig-dark',
        'model' => 'aez-leipzig',
        'finish' => 'Dark',
        'circle' => [2712, 2082, 962],
        'hub' => [2712, 2058, 170],
        'credit' => ['source' => 'Pexels', 'photographer' => 'Mike Bird', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/close-up-of-the-wheel-of-a-blue-car-12174717/'],
    ],
    'pexels-13387441.jpg' => [
        'slug' => 'bbs-ci-r-bronze-matt',
        'model' => 'bbs-ci-r',
        'finish' => 'Bronze matt',
        'circle' => [3480, 2495, 1290],
        'hub' => null,
        'credit' => ['source' => 'Pexels', 'photographer' => 'Malcolm Garret', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/gold-and-silver-mag-wheel-of-a-car-13387441/'],
    ],
    'pexels-14649125.jpg' => [
        'slug' => 'dezent-tz-silber',
        'model' => 'dezent-tz',
        'finish' => 'Silber',
        'circle' => [2365, 2642, 785],
        'hub' => [2373, 2602, 94],
        'credit' => ['source' => 'Pexels', 'photographer' => 'Ambady Kolazhikkaran', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/a-close-up-shot-of-a-wheel-of-a-white-car-14649125/'],
    ],
    'pexels-20303843.jpg' => [
        'slug' => 'dezent-tn-silber',
        'model' => 'dezent-tn',
        'finish' => 'Silber',
        'circle' => [3040, 1858, 1245],
        'hub' => [3005, 1810, 172],
        'credit' => ['source' => 'Pexels', 'photographer' => 'Mike Bird', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/wheel-of-vauxhall-corsa-vxr-20303843/'],
    ],
    'pexels-244553.jpg' => [
        'slug' => 'yido-performance-1-silber',
        'model' => 'yido-performance-1',
        'finish' => 'Silber',
        'circle' => [2975, 1895, 1275],
        'hub' => [2929, 1828, 176],
        'credit' => ['source' => 'Pexels', 'photographer' => 'Mike Bird', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/close-up-photograph-of-chrome-vehicle-wheel-244553/'],
    ],
    'pexels-30169820.jpg' => [
        'slug' => 'rotiform-kps-bronze-matt',
        'model' => 'rotiform-kps',
        'finish' => 'Bronze matt',
        'circle' => [1794, 1541, 1025],
        'hub' => [1630, 1566, 130],
        'credit' => ['source' => 'Pexels', 'photographer' => 'Vinod Kumar', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/stylish-volkswagen-wheel-on-dark-background-30169820/'],
    ],
    'pexels-31999237.jpg' => [
        'slug' => 'oz-racing-ultraleggera-graphite-matt',
        'model' => 'oz-racing-ultraleggera',
        'finish' => 'Graphite matt',
        'circle' => [955, 1300, 905],
        'hub' => [950, 1320, 110],
        'credit' => ['source' => 'Pexels', 'photographer' => 'Yahya Gopalani', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/close-up-of-stylish-car-alloy-wheel-with-red-brake-31999237/'],
    ],
    'pexels-4002394.jpg' => [
        'slug' => 'brock-b32-kristallsilber',
        'model' => 'brock-b32',
        'finish' => 'Kristallsilber',
        'circle' => [2595, 1815, 1015],
        'hub' => [2482, 1775, 158],
        'credit' => ['source' => 'Pexels', 'photographer' => 'Mike Bird', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/silver-mercedes-benz-wheel-with-tire-4002394/'],
    ],
    'pexels-4056596.jpg' => [
        'slug' => 'rotiform-blq-schwarz-matt',
        'model' => 'rotiform-blq',
        'finish' => 'Schwarz matt',
        'circle' => [2225, 1426, 1050],
        'hub' => [2225, 1470, 185],
        'credit' => ['source' => 'Pexels', 'photographer' => 'Mike Bird', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/silver-mercedes-benz-wheel-with-tire-4056596/'],
    ],
];
