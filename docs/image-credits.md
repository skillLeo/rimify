# Image credits

Free-licence photography stands in until the client's own material arrives (see
`docs/phase0/ASSET-REQUEST.md`). Every file below is licensed under the Unsplash License or the
Pexels License, both of which permit commercial use without attribution; the attribution is given
anyway. Free-licence photographs clear copyright, not trademarks: the wheels pictured are other
manufacturers' designs and are shown as *Demodaten* only (`wheel_models.is_demo`). A centre cap
that carries another company's mark (a car maker, another wheel brand) is painted over with a plain
cap in the wheel's own finish (`scripts/lib/plain-cap.mjs`); a cap with the product brand's own
mark (the two BBS photographs) is left as photographed. The client's legal review of imagery is
listed under "Before launch" in `docs/phase0/OVERHAUL.md`.

Sources live in `storage/app/public/placeholder/`. No image on the site is AI-generated.

## Homepage photographs (`scripts/images.mjs` → `public/images/`)

| File | Used as | Photographer | Licence | Source |
|---|---|---|---|---|
| `pexels-32726107.jpg` | Hero photograph (`public/images/hero/`) | Luke Miller | Pexels License | https://www.pexels.com/photo/close-up-of-sports-car-with-blue-alloy-wheels-32726107/ |
| `pexels-17110820.jpg` | Dark band, Kompletträder (`public/images/komplettrad/`) | FBO Media | Pexels License | https://www.pexels.com/photo/close-up-of-a-black-rim-in-a-modern-car-17110820/ |
| `pexels-16124157.jpg` | Not used (prominent third-party branding) | Jacob Moore | Pexels License | https://www.pexels.com/photo/close-up-of-a-car-wheel-16124157/ |
| `pexels-31574041.jpg` | Not used | Borta | Pexels License | https://www.pexels.com/photo/close-up-of-car-tire-and-wheel-rim-on-road-31574041/ |
| `pexels-14649125.jpg` | Hero cut-out, the bundled stand-in (`public/images/hero-wheel/`, `scripts/cutout.mjs`) and demo wheel below | Ambady Kolazhikkaran | Pexels License | https://www.pexels.com/photo/a-close-up-shot-of-a-wheel-of-a-white-car-14649125/ |
| `unsplash-h82zfDTFUP0.jpg` | Not used any more (a wall shows through the spoke windows) | Mathias Reding | Unsplash License | https://unsplash.com/photos/h82zfDTFUP0 |
| `unsplash-Psw4AAhjHrY.jpg` | Not used (Porsche crest and lettering) | Jorge Segura | Unsplash License | https://unsplash.com/photos/Psw4AAhjHrY |
| `unsplash-xAfVHWAV3EQ.jpg` | Not used (Aston Martin caliper lettering) | Cloud Prod | Unsplash License | https://unsplash.com/photos/xAfVHWAV3EQ |
| `unsplash-yeMpSqF8Z-8.jpg` | Not used (three-quarter view of a wheel on a shelf) | José Pinto | Unsplash License | https://unsplash.com/photos/yeMpSqF8Z-8 |
| `unsplash-_tXpT0WORrQ.jpg` | Not used (rim detail only) | José Pinto | Unsplash License | https://unsplash.com/photos/_tXpT0WORrQ |

## Demo wheels (`php artisan wheels:process-images` → `storage/app/public/demo/wheels/<slug>/`)

Face-on photographs only, one per model at most, cut along the rim's outer lip and stood on a
contact shadow. The rim circle, the hub circle and the finish each one stands for are recorded in
`database/seeders/content/wheel-photos.php`; the credit below is copied from the same map into
each manifest.

| File | Stands for | Photographer | Licence | Source |
|---|---|---|---|---|
| `unsplash-60ZSTXNgXgM.jpg` | OZ Racing Superturismo GT · Matt Race Silber | Luca Nicoletti | Unsplash License | https://unsplash.com/photos/60ZSTXNgXgM |
| `unsplash-7eCBiZgyr4E.jpg` | OZ Racing Formula HLT · Grigio Corsa | Vlad Grebenyev | Unsplash License | https://unsplash.com/photos/7eCBiZgyr4E |
| `unsplash-OgIik_VHAmU.jpg` | BBS SR · Himalaya Grau | serjan midili | Unsplash License | https://unsplash.com/photos/OgIik_VHAmU |
| `unsplash-RUacGu7OvXs.jpg` | ALUTEC Monstr · Racing Schwarz | J Z | Unsplash License | https://unsplash.com/photos/RUacGu7OvXs |
| `unsplash-Y_251QYX55Y.jpg` | MAM A5 · Palladium | Erik Mclean | Unsplash License | https://unsplash.com/photos/Y_251QYX55Y |
| `unsplash-ej_FX2MqClQ.jpg` | MAM RS4 · Silber | Dillon Kydd | Unsplash License | https://unsplash.com/photos/ej_FX2MqClQ |
| `unsplash-4gxI7gj0l2s.jpg` | BORBET LV5 · Schwarz matt | Volodymyr Dobrovolskyy | Unsplash License | https://unsplash.com/photos/4gxI7gj0l2s |
| `unsplash-Z9jNN_F2PwU.jpg` | Brock B40 · Silber | Toby Hall | Unsplash License | https://unsplash.com/photos/Z9jNN_F2PwU |
| `pexels-12174717.jpg` | AEZ Leipzig · Dark | Mike Bird | Pexels License | https://www.pexels.com/photo/close-up-of-the-wheel-of-a-blue-car-12174717/ |
| `pexels-13387441.jpg` | BBS CI-R · Bronze matt | Malcolm Garret | Pexels License | https://www.pexels.com/photo/gold-and-silver-mag-wheel-of-a-car-13387441/ |
| `pexels-14649125.jpg` | Dezent TZ · Silber (hero product) | Ambady Kolazhikkaran | Pexels License | https://www.pexels.com/photo/a-close-up-shot-of-a-wheel-of-a-white-car-14649125/ |
| `pexels-20303843.jpg` | Dezent TN · Silber | Mike Bird | Pexels License | https://www.pexels.com/photo/wheel-of-vauxhall-corsa-vxr-20303843/ |
| `pexels-244553.jpg` | YIDO Performance 1 · Silber | Mike Bird | Pexels License | https://www.pexels.com/photo/close-up-photograph-of-chrome-vehicle-wheel-244553/ |
| `pexels-30169820.jpg` | Rotiform KPS · Bronze matt | Vinod Kumar | Pexels License | https://www.pexels.com/photo/stylish-volkswagen-wheel-on-dark-background-30169820/ |
| `pexels-31999237.jpg` | OZ Racing Ultraleggera · Graphite matt | Yahya Gopalani | Pexels License | https://www.pexels.com/photo/close-up-of-stylish-car-alloy-wheel-with-red-brake-31999237/ |
| `pexels-4002394.jpg` | Brock B32 · Kristallsilber | Mike Bird | Pexels License | https://www.pexels.com/photo/silver-mercedes-benz-wheel-with-tire-4002394/ |
| `pexels-4056596.jpg` | Rotiform BLQ · Schwarz matt | Mike Bird | Pexels License | https://www.pexels.com/photo/silver-mercedes-benz-wheel-with-tire-4056596/ |

Not pictured (outline drawing on the card): ALUTEC Grip, YIDO Performance 2, BORBET Havanna.

Considered and rejected during sourcing, not kept on disk: every Unsplash+ result (not free),
photographs with prominent third-party marks (Lamborghini, Bugatti, AMG and Aston Martin caliper
lettering, an "M Performance" rim print), three-quarter views a circular mask cannot cut cleanly,
and pictures showing only part of a wheel. Wikimedia Commons could not be reached from this
machine (DNS) and contributed nothing.

Derivatives in `public/images/` are produced by `scripts/images.mjs` and `scripts/cutout.mjs`;
those in `storage/app/public/demo/wheels/` by `scripts/wheel-image.mjs` through the artisan
command. All are replaced, not edited, when the client's photographs arrive.

## 3D stage (hero and Kompletträder band)

| File | Used as | Author | Licence | Source |
|---|---|---|---|---|
| `public/3d/wheel-10.glb` | The hero's 3D wheel and the band's rim — a parametric mesh (flanged barrel, ten chamfered spokes on a concave face, five-hole hub on LK 112 with a 66,6 mm bore, plain cap) generated from the hero configuration; no third-party design, no mark | RIMIFY (`scripts/3d/wheel-geometry.mjs`, `npm run 3d:assets`) | CC0 1.0 | generated |
| `public/3d/studio_small_09_1k.hdr` | The studio environment lighting the 3D wheel (1K equirectangular, PMREM at load) | Sergej Majboroda, Poly Haven | CC0 1.0 | https://polyhaven.com/a/studio_small_09 |
| `public/3d/draco/*`, `public/3d/basis/*` | glTF decoders copied from three.js by `scripts/3d/decoders.mjs` for a future licensed model; the parametric wheel does not use them (`docs/reviews/hero-3d-build.md`) | three.js authors, Google | MIT, Apache 2.0 | `node_modules/three/examples/jsm/libs/` |
| `public/images/hero-wheel-seq/*` (when built) | The image-sequence fallback, rendered offline from the parametric wheel by `scripts/3d/render-frames.mjs --sequence` | RIMIFY | CC0 1.0 | derived from the two rows above |

The band's tyre is a runtime lathe (`resources/js/Components/Home/Wheel3D/tyre.ts`): plain black
rubber, no sidewall lettering. Nothing in the 3D stage reproduces a manufacturer's wheel.
