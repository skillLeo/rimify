# Design image set

The photographs and marque logos the storefront design uses, served locally from
`public/prototype/images/`. Source of truth is `shared/art.js` → `PHOTO` and `LOGO`: every image
is a `data-mount` slot filled at runtime, layered over a drawn SVG fallback.

These are **placeholders for review**. Unsplash is not a licence RIMIFY holds; hero and product
photography will be replaced with the client's own images before launch.

URL form: `U(id,w)` = `https://unsplash.com/photos/<id>/download?force=true&w=<w>`.

| File | Key in `PHOTO` | Unsplash id / URL | Width |
|---|---|---|---|
| hero.jpg | `hero` | `pQ0_oAtnDqI` | 2000 |
| hero-mobile.jpg | `heroM` | `odmg2fspBBU` | 1200 |
| check-car.jpg | `checkCar` | `7L2-sf19x78` | 1600 |
| lager.jpg | `lager` | `ENHqkZBMTMA` | 1400 |
| werkstatt.jpg | `werkstatt` | `images.unsplash.com/photo-1761040100208-07f603acc83f?auto=format&fit=crop&w=1400&q=80` | 1400 |
| tyre.jpg | `tyre` | `l9riyueOA2k` | 900 |
| admin-panel.jpg | `adminPanel` | `images.unsplash.com/photo-1626668893632-6f3a4466d22f?auto=format&fit=crop&w=1600&q=80` | 1600 |
| wheel-1.jpg | `wheels[0]` | `images.unsplash.com/photo-1761040100208-07f603acc83f?auto=format&fit=crop&w=900&q=80` | 900 |
| wheel-2.jpg | `wheels[1]` | `zAfKgmZIbSU` | 900 |
| wheel-3.jpg | `wheels[2]` | `l9riyueOA2k` | 900 |
| wheel-4.jpg | `wheels[3]` | `ENHqkZBMTMA` | 900 |
| wheel-5.jpg | `wheels[4]` | `m8zQivdifx8` | 900 |
| wheel-6.jpg | `wheels[5]` | `pQ0_oAtnDqI` | 900 |
| banner-1.jpg | `banners[0]` | `m8zQivdifx8` | 1200 |
| banner-2.jpg | `banners[1]` | `zAfKgmZIbSU` | 1200 |
| banner-3.jpg | `banners[2]` | `l9riyueOA2k` | 1200 |
| banner-4.jpg | `banners[3]` | `ENHqkZBMTMA` | 1200 |

Nine distinct photographs, reused at different widths across wheels, banners and the hero.

## Marque logos (`LOGO`, used by `ART.makeLogo`, tinted `#0E1116`)

| File | Source |
|---|---|
| logo-bmw.svg | https://cdn.simpleicons.org/bmw/0E1116 |
| logo-audi.svg | https://cdn.simpleicons.org/audi/0E1116 |
| logo-mercedes.svg | https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg (1.5 MB, rendered with `filter:brightness(0)`) |
| logo-vw.svg | https://cdn.simpleicons.org/volkswagen/0E1116 |
| logo-porsche.svg | https://cdn.simpleicons.org/porsche/0E1116 |
| logo-opel.svg | https://cdn.simpleicons.org/opel/0E1116 |
| logo-ford.svg | https://cdn.simpleicons.org/ford/0E1116 |
| logo-skoda.svg | https://cdn.simpleicons.org/skoda/0E1116 (`ŠKODA` key) |
