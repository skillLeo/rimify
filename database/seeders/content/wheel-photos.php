<?php

declare(strict_types=1);

// The demo wheels' photographs: which picture stands for which finish, where the wheel is in it,
// and who took it. Data only — `wheels:process-images` renders from it and CatalogueSeeder attaches
// the results; docs/image-credits.md is written from the same credits.
//
// Empty, on purpose (the review release §2): example data never carries a maker's photograph. The
// last entries were the MOTEC MCR4 Ultimate's studio shots (MOTEC's own images, supplied by the
// client); that wheel is now the invented Bergsteig Gipfel, and a photograph of the real product on
// it would present an invented wheel as that product. The files stay in
// database/seeders/content/client-photos/ for the day the client's catalogue brings the real
// product back. Every finish draws the line-art outline until then.
//
// An entry, when there is one: keyed by the file name; `slug` names the output directory under
// storage/app/public/demo/wheels/ (`<model slug>-<finish>`); `model`, `finish`; `circle` [x, y, r] or
// `mask`; `hub` [x, y, r] or null; `colour`; `anchors` and `stamp` for the hero; `view` for a further
// angle; `credit` {source, photographer, licence, url}.
return [];
