# Image credits

A real brand or model name appears only on a photograph of that exact product
(`docs/phase0/ACCURACY.md` D1). The only product photographs on the site are the client's own studio
shots of the MOTEC MCR4 Ultimate. Every free-licence photograph of a wheel is retired: each showed
another maker's wheel on a car, brake disc included, and stood for a demo model it did not depict.
A finish without a photograph draws the line-art outline. The client's legal review of imagery is
listed under "Before launch" in `docs/phase0/OVERHAUL.md`.

No image on the site is AI-generated.

## Client-supplied studio shots (`database/seeders/content/client-photos/`)

Manufacturer renders the client sent as example photographs (2026-09-22). They have no public URL,
so they live in the repository; `wheels:fetch-photos` copies them into place. Each comes with a
grey mask — the alpha of the client's own background removal (removal.ai), 600 px — which the
pipeline scales onto the 1080 px original: the photograph's own pixels, the service's edge. The cap
shows the product brand's own mark and is left as photographed. `php artisan wheels:process-images`
renders them into `storage/app/public/demo/wheels/<slug>/`, and CatalogueSeeder attaches them to the
finish *Light Grey D5*.

| File | Stands for | Source | Use |
|---|---|---|---|
| `client-motec-mcr4-ultimate-front.jpg` | MOTEC MCR4 Ultimate · Light Grey D5, front view | MOTEC (Herstellerbild), vom Kunden bereitgestellt | Card, product page, hero (the shadowless `bare` frame, with measured anchors and the stamp `53810`) |
| `client-motec-mcr4-ultimate-angle.jpg` | the same, *Schräg von vorn* | as above | Card on hover, product page thumbnail |
| `client-motec-mcr4-ultimate-rear.jpg` | the same, *Schräg von hinten* | as above | Product page thumbnail |

The front shot is measured for the hero in source pixels (`wheel-photos.php`, `anchors`): the
centre, the Lochkreis through the bolt-hole centres, the cap over the centre bore, the valve and
the stamped approval mark. The outer lip is derived from the mask, not typed in.

Received but not used: a three-quarter view with no mask (a local background-removal model left
its bright barrel semi-transparent) and a fourth angle only as a 600 px cut-out without its original.

## Retired: free-licence photographs of demo wheels

Retired on 2026-09-22 (accuracy pass, D1). They are no longer in the photograph map, no manifest
names them, and no page shows them. The rendered directories under
`storage/app/public/demo/wheels/<slug>/` from earlier runs are no longer attached and can be
deleted. The credits are kept because the files were used until then. The "Stood for" column gives
the demo model each one was attached to, by its name at the time. None of them showed that product.

| File | Stood for | Photographer | Licence | Source |
|---|---|---|---|---|
| `unsplash-60ZSTXNgXgM.jpg` | OZ Racing Superturismo GT · Matt Race Silber | Luca Nicoletti | Unsplash License | https://unsplash.com/photos/60ZSTXNgXgM |
| `unsplash-7eCBiZgyr4E.jpg` | OZ Racing Formula HLT · Grigio Corsa | Vlad Grebenyev | Unsplash License | https://unsplash.com/photos/7eCBiZgyr4E |
| `unsplash-OgIik_VHAmU.jpg` | BBS SR · Himalaya Grau | serjan midili | Unsplash License | https://unsplash.com/photos/OgIik_VHAmU |
| `unsplash-RUacGu7OvXs.jpg` | ALUTEC Monstr · Racing Schwarz | J Z | Unsplash License | https://unsplash.com/photos/RUacGu7OvXs |
| `unsplash-Y_251QYX55Y.jpg` | MAM A5 · Palladium | Erik Mclean | Unsplash License | https://unsplash.com/photos/Y_251QYX55Y |
| `unsplash-ej_FX2MqClQ.jpg` | MAM RS4 · Silber | Dillon Kydd | Unsplash License | https://unsplash.com/photos/ej_FX2MqClQ |
| `unsplash-4gxI7gj0l2s.jpg` | BORBET LV5 · Schwarz matt | Volodymyr Dobrovolskyy | Unsplash License | https://unsplash.com/photos/4gxI7gj0l2s |
| `unsplash-Z9jNN_F2PwU.jpg` | Brock B40 · Silber | Toby Hall | Unsplash License | https://unsplash.com/photos/Z9jNN_F2PwU |
| `unsplash-h82zfDTFUP0.jpg` | nothing (retired earlier: a wall showed through the spoke windows) | Mathias Reding | Unsplash License | https://unsplash.com/photos/h82zfDTFUP0 |
| `pexels-12174717.jpg` | AEZ Leipzig · Dark | Mike Bird | Pexels License | https://www.pexels.com/photo/close-up-of-the-wheel-of-a-blue-car-12174717/ |
| `pexels-13387441.jpg` | BBS CI-R · Bronze matt | Malcolm Garret | Pexels License | https://www.pexels.com/photo/gold-and-silver-mag-wheel-of-a-car-13387441/ |
| `pexels-14649125.jpg` | Dezent TZ · Silber (the former hero product) | Ambady Kolazhikkaran | Pexels License | https://www.pexels.com/photo/a-close-up-shot-of-a-wheel-of-a-white-car-14649125/ |
| `pexels-20303843.jpg` | Dezent TN · Silber (a Vauxhall Corsa VXR's wheel) | Mike Bird | Pexels License | https://www.pexels.com/photo/wheel-of-vauxhall-corsa-vxr-20303843/ |
| `pexels-244553.jpg` | YIDO Performance 1 · Silber | Mike Bird | Pexels License | https://www.pexels.com/photo/close-up-photograph-of-chrome-vehicle-wheel-244553/ |
| `pexels-30169820.jpg` | Rotiform KPS · Bronze matt (a Volkswagen wheel) | Vinod Kumar | Pexels License | https://www.pexels.com/photo/stylish-volkswagen-wheel-on-dark-background-30169820/ |
| `pexels-31999237.jpg` | OZ Racing Ultraleggera · Graphite matt | Yahya Gopalani | Pexels License | https://www.pexels.com/photo/close-up-of-stylish-car-alloy-wheel-with-red-brake-31999237/ |
| `pexels-4002394.jpg` | Brock B32 · Kristallsilber (a Mercedes-Benz wheel) | Mike Bird | Pexels License | https://www.pexels.com/photo/silver-mercedes-benz-wheel-with-tire-4002394/ |
| `pexels-4056596.jpg` | Rotiform BLQ · Schwarz matt (a Mercedes-Benz wheel) | Mike Bird | Pexels License | https://www.pexels.com/photo/silver-mercedes-benz-wheel-with-tire-4056596/ |

The demo models these stood for are now neutral demonstration wheels under the brand *Demo*
("Fünfspeiche F-01" …), drawn as outlines.

## Homepage photographs (`scripts/images.mjs` → `public/images/`)

The hero's bundled stand-in cut-out and the Kompletträder band's car-wheel photograph are retired
in wave 2 of the accuracy pass (W4, `ACCURACY.md` §3.1 and §4): the hero shows the MCR4 from the
client's front shot, and a Komplettrad is shown as a generated illustration or as the line art.
Until that lands, these files are still referenced.

| File | Used as | Photographer | Licence | Source |
|---|---|---|---|---|
| `pexels-32726107.jpg` | Hero photograph (`public/images/hero/`, only on `/__design`) | Luke Miller | Pexels License | https://www.pexels.com/photo/close-up-of-sports-car-with-blue-alloy-wheels-32726107/ |
| `pexels-17110820.jpg` | Dark band, Kompletträder (`public/images/komplettrad/`), to be retired (W4) | FBO Media | Pexels License | https://www.pexels.com/photo/close-up-of-a-black-rim-in-a-modern-car-17110820/ |
| `pexels-14649125.jpg` | The hero's bundled stand-in cut-out (`public/images/hero-wheel/`, `scripts/cutout.mjs`), to be retired (W4) | Ambady Kolazhikkaran | Pexels License | https://www.pexels.com/photo/a-close-up-shot-of-a-wheel-of-a-white-car-14649125/ |
| `pexels-16124157.jpg` | Not used (prominent third-party branding) | Jacob Moore | Pexels License | https://www.pexels.com/photo/close-up-of-a-car-wheel-16124157/ |
| `pexels-31574041.jpg` | Not used | Borta | Pexels License | https://www.pexels.com/photo/close-up-of-car-tire-and-wheel-rim-on-road-31574041/ |
| `unsplash-Psw4AAhjHrY.jpg` | Not used (Porsche crest and lettering) | Jorge Segura | Unsplash License | https://unsplash.com/photos/Psw4AAhjHrY |
| `unsplash-xAfVHWAV3EQ.jpg` | Not used (Aston Martin caliper lettering) | Cloud Prod | Unsplash License | https://unsplash.com/photos/xAfVHWAV3EQ |
| `unsplash-yeMpSqF8Z-8.jpg` | Not used (three-quarter view of a wheel on a shelf) | José Pinto | Unsplash License | https://unsplash.com/photos/yeMpSqF8Z-8 |
| `unsplash-_tXpT0WORrQ.jpg` | Not used (rim detail only) | José Pinto | Unsplash License | https://unsplash.com/photos/_tXpT0WORrQ |

Considered and rejected during sourcing, not kept on disk: every Unsplash+ result (not free),
photographs with prominent third-party marks (Lamborghini, Bugatti, AMG and Aston Martin caliper
lettering, an "M Performance" rim print), three-quarter views a circular mask cannot cut cleanly,
and pictures showing only part of a wheel. Wikimedia Commons could not be reached from this
machine (DNS) and contributed nothing.

## The pipeline

`scripts/wheel-image.mjs` (pipeline version 5), run through `php artisan wheels:process-images`,
writes for each photograph a square frame and a 4:3 frame on a baked contact shadow, and the
square frame once more without the shadow (`bare`), each as AVIF, WebP, PNG and JPEG at 480, 768
and 1080 px. A measured photograph's anchors are carried into every frame, normalised to it, and
the approval number it shows is written as `stamp` (the manifest contract is `ACCURACY.md` §4).
Derivatives are replaced, not edited, when the client's photographs change.

## 3D stage (hero and Kompletträder band)

| File | Used as | Author | Licence | Source |
|---|---|---|---|---|
| `public/3d/wheel-10.glb` | The hero's 3D wheel and the band's rim — a parametric mesh (flanged barrel, ten chamfered spokes on a concave face, five-hole hub on LK 112 with a 66,6 mm bore, plain cap) generated from the hero configuration; no third-party design, no mark | RIMIFY (`scripts/3d/wheel-geometry.mjs`, `npm run 3d:assets`) | CC0 1.0 | generated |
| `public/3d/studio_small_09_1k.hdr` | The studio environment lighting the 3D wheel (1K equirectangular, PMREM at load) | Sergej Majboroda, Poly Haven | CC0 1.0 | https://polyhaven.com/a/studio_small_09 |
| `public/3d/draco/*`, `public/3d/basis/*` | glTF decoders copied from three.js by `scripts/3d/decoders.mjs` for a future licensed model; the parametric wheel does not use them (`docs/reviews/hero-3d-build.md`) | three.js authors, Google | MIT, Apache 2.0 | `node_modules/three/examples/jsm/libs/` |
| `public/images/hero-wheel-seq/*` (when built) | The image-sequence fallback, rendered offline from the parametric wheel by `scripts/3d/render-frames.mjs --sequence` | RIMIFY | CC0 1.0 | derived from the two rows above |

The band's tyre is a runtime lathe (`resources/js/Components/Home/Wheel3D/tyre.ts`): plain black
rubber, no sidewall lettering. Nothing in the 3D stage reproduces a manufacturer's wheel.
