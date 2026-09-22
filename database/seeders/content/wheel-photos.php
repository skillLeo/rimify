<?php

declare(strict_types=1);

// The demo wheels' photographs: which free-licence picture stands for which finish, where the
// wheel is in it, and who took it. Data only — `wheels:process-images` renders from it and
// CatalogueSeeder attaches the results; docs/image-credits.md is written from the same credits.
//
// Keyed by the file in storage/app/public/placeholder/. `slug` names the output directory under
// storage/app/public/demo/wheels/ and is `<model slug>-<finish>`. `circle` is the rim's outer lip
// as cx, cy, r in source pixels — measured once on a grid, never guessed — and `cap` is the radius
// of the plain disc that covers a branded centre cap (0 for none). `colour` may be `none` to skip
// the daylight-cast curve. One photograph serves at most one model; a model may have two
// photographs for two finishes.
//
// Every photograph is face-on: the sharp path cuts along a circle, and a three-quarter view would
// leave a sliver of tyre on one side. Licences: Unsplash License (free for commercial use, no
// attribution required) and Pexels License (the same). Attribution is given anyway.
return [
    // unsplash-h82zfDTFUP0.jpg (Mathias Reding, Unsplash License) is retired: a wall shows through
    // every spoke window and the circular mask cannot cut windows. Its finish draws the outline.
    'unsplash-60ZSTXNgXgM.jpg' => [
        'slug' => 'oz-racing-superturismo-gt-matt-race-silber',
        'model' => 'oz-racing-superturismo-gt',
        'finish' => 'Matt Race Silber',
        'circle' => [810, 553, 440],
        'cap' => 55,
        'credit' => ['source' => 'Unsplash', 'photographer' => 'Luca Nicoletti', 'licence' => 'Unsplash License', 'url' => 'https://unsplash.com/photos/60ZSTXNgXgM'],
    ],
    'unsplash-7eCBiZgyr4E.jpg' => [
        'slug' => 'oz-racing-formula-hlt-grigio-corsa',
        'model' => 'oz-racing-formula-hlt',
        'finish' => 'Grigio Corsa',
        'circle' => [2938, 1352, 955],
        'cap' => 80,
        'credit' => ['source' => 'Unsplash', 'photographer' => 'Vlad Grebenyev', 'licence' => 'Unsplash License', 'url' => 'https://unsplash.com/photos/7eCBiZgyr4E'],
    ],
    'unsplash-OgIik_VHAmU.jpg' => [
        'slug' => 'bbs-sr-himalaya-grau',
        'model' => 'bbs-sr',
        'finish' => 'Himalaya Grau',
        'circle' => [1795, 2935, 1165],
        'cap' => 175,
        'credit' => ['source' => 'Unsplash', 'photographer' => 'serjan midili', 'licence' => 'Unsplash License', 'url' => 'https://unsplash.com/photos/OgIik_VHAmU'],
    ],
    'unsplash-RUacGu7OvXs.jpg' => [
        'slug' => 'alutec-monstr-racing-schwarz',
        'model' => 'alutec-monstr',
        'finish' => 'Racing Schwarz',
        'circle' => [1520, 900, 665],
        'cap' => 80,
        'credit' => ['source' => 'Unsplash', 'photographer' => 'J Z', 'licence' => 'Unsplash License', 'url' => 'https://unsplash.com/photos/RUacGu7OvXs'],
    ],
    'unsplash-Y_251QYX55Y.jpg' => [
        'slug' => 'mam-a5-palladium',
        'model' => 'mam-a5',
        'finish' => 'Palladium',
        'circle' => [1290, 1320, 528],
        'cap' => 70,
        'credit' => ['source' => 'Unsplash', 'photographer' => 'Erik Mclean', 'licence' => 'Unsplash License', 'url' => 'https://unsplash.com/photos/Y_251QYX55Y'],
    ],
    'unsplash-ej_FX2MqClQ.jpg' => [
        'slug' => 'mam-rs4-silber',
        'model' => 'mam-rs4',
        'finish' => 'Silber',
        'circle' => [1341, 1650, 400],
        // 0,2 r: the roundel on the hub is a third-party mark and must be covered whole.
        'cap' => 80,
        'credit' => ['source' => 'Unsplash', 'photographer' => 'Dillon Kydd', 'licence' => 'Unsplash License', 'url' => 'https://unsplash.com/photos/ej_FX2MqClQ'],
    ],
    'unsplash-4gxI7gj0l2s.jpg' => [
        'slug' => 'borbet-lv5-schwarz-matt',
        'model' => 'borbet-lv5',
        'finish' => 'Schwarz matt',
        'circle' => [1062, 2642, 540],
        // 0,22 r: the four rings on the hub are a third-party mark and must be covered whole.
        'cap' => 120,
        'credit' => ['source' => 'Unsplash', 'photographer' => 'Volodymyr Dobrovolskyy', 'licence' => 'Unsplash License', 'url' => 'https://unsplash.com/photos/4gxI7gj0l2s'],
    ],
    'unsplash-Z9jNN_F2PwU.jpg' => [
        'slug' => 'brock-b40-silber',
        'model' => 'brock-b40',
        'finish' => 'Silber',
        'circle' => [1111, 1623, 1025],
        'cap' => 150,
        'credit' => ['source' => 'Unsplash', 'photographer' => 'Toby Hall', 'licence' => 'Unsplash License', 'url' => 'https://unsplash.com/photos/Z9jNN_F2PwU'],
    ],
    'pexels-12174717.jpg' => [
        'slug' => 'aez-leipzig-dark',
        'model' => 'aez-leipzig',
        'finish' => 'Dark',
        'circle' => [2712, 2082, 962],
        'cap' => 100,
        'credit' => ['source' => 'Pexels', 'photographer' => 'Mike Bird', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/close-up-of-the-wheel-of-a-blue-car-12174717/'],
    ],
    'pexels-13387441.jpg' => [
        'slug' => 'bbs-ci-r-bronze-matt',
        'model' => 'bbs-ci-r',
        'finish' => 'Bronze matt',
        'circle' => [3480, 2495, 1290],
        'cap' => 230,
        'credit' => ['source' => 'Pexels', 'photographer' => 'Malcolm Garret', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/gold-and-silver-mag-wheel-of-a-car-13387441/'],
    ],
    'pexels-14649125.jpg' => [
        'slug' => 'dezent-tz-silber',
        'model' => 'dezent-tz',
        'finish' => 'Silber',
        'circle' => [2365, 2642, 785],
        'cap' => 100,
        'credit' => ['source' => 'Pexels', 'photographer' => 'Ambady Kolazhikkaran', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/a-close-up-shot-of-a-wheel-of-a-white-car-14649125/'],
    ],
    'pexels-20303843.jpg' => [
        'slug' => 'dezent-tn-silber',
        'model' => 'dezent-tn',
        'finish' => 'Silber',
        'circle' => [3040, 1858, 1245],
        'cap' => 190,
        'credit' => ['source' => 'Pexels', 'photographer' => 'Mike Bird', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/wheel-of-vauxhall-corsa-vxr-20303843/'],
    ],
    'pexels-244553.jpg' => [
        'slug' => 'yido-performance-1-silber',
        'model' => 'yido-performance-1',
        'finish' => 'Silber',
        'circle' => [2975, 1895, 1275],
        'cap' => 220,
        'credit' => ['source' => 'Pexels', 'photographer' => 'Mike Bird', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/close-up-photograph-of-chrome-vehicle-wheel-244553/'],
    ],
    'pexels-30169820.jpg' => [
        'slug' => 'rotiform-kps-bronze-matt',
        'model' => 'rotiform-kps',
        'finish' => 'Bronze matt',
        'circle' => [1794, 1541, 1025],
        'cap' => 130,
        'credit' => ['source' => 'Pexels', 'photographer' => 'Vinod Kumar', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/stylish-volkswagen-wheel-on-dark-background-30169820/'],
    ],
    'pexels-31999237.jpg' => [
        'slug' => 'oz-racing-ultraleggera-graphite-matt',
        'model' => 'oz-racing-ultraleggera',
        'finish' => 'Graphite matt',
        'circle' => [955, 1300, 905],
        'cap' => 110,
        'credit' => ['source' => 'Pexels', 'photographer' => 'Yahya Gopalani', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/close-up-of-stylish-car-alloy-wheel-with-red-brake-31999237/'],
    ],
    'pexels-4002394.jpg' => [
        'slug' => 'brock-b32-kristallsilber',
        'model' => 'brock-b32',
        'finish' => 'Kristallsilber',
        'circle' => [2595, 1815, 1015],
        'cap' => 160,
        'credit' => ['source' => 'Pexels', 'photographer' => 'Mike Bird', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/silver-mercedes-benz-wheel-with-tire-4002394/'],
    ],
    'pexels-4056596.jpg' => [
        'slug' => 'rotiform-blq-schwarz-matt',
        'model' => 'rotiform-blq',
        'finish' => 'Schwarz matt',
        'circle' => [2225, 1426, 1050],
        'cap' => 165,
        'credit' => ['source' => 'Pexels', 'photographer' => 'Mike Bird', 'licence' => 'Pexels License', 'url' => 'https://www.pexels.com/photo/silver-mercedes-benz-wheel-with-tire-4056596/'],
    ],
];
