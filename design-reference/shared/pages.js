/* RIMIFY — mount fillers + per-page behaviour */
(function (w, d) {
  'use strict';
  var R = w.RMF, A = w.ART;
  function P() { return w.APP; }
  function esc(s) { return P().esc(s); }
  function eur(n) { return R.eur(n); }
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function m(n) { return d.querySelector('[data-mount="' + n + '"]'); }
  var MOB = d.body.classList.contains('is-mobile');

  /* ═══ generic mount fillers ═══════════════════════════ */
  var FILL = {
    'hero-scene': function () {
      return A.photo(MOB ? A.PHOTO.heroM : A.PHOTO.hero, 'Sportwagen bei Nacht',
        A.heroSceneSVG({ mobile: MOB }), MOB ? '58% 50%' : '62% 54%');
    },
    'car-check': function () {
      return A.photo(A.PHOTO.checkCar, 'Fahrzeug im RIMIFY-CHECK',
        A.carSVG({ variant: 'light', wheel: 'silver', spokes: 7 }), '50% 58%');
    },
    'scene-lager': function () {
      return '<div style="position:relative;aspect-ratio:4/3;overflow:hidden">' +
        A.photo(A.PHOTO.lager, 'Felgen im Lager', A.sceneSVG('lager'), 'center') + '</div>';
    },
    'scene-werkstatt': function () {
      return '<div style="position:relative;aspect-ratio:16/9;overflow:hidden">' +
        A.photo(A.PHOTO.werkstatt, 'Montage in der Werkstatt', A.sceneSVG('werkstatt'), 'center') + '</div>';
    },
    'blueprint': function () { return A.loginArt(MOB); },

    'trust': function () {
      if (MOB) return R.trust.map(function (t) {
        return '<div style="flex:none;scroll-snap-align:start;display:flex;align-items:center;gap:8px;height:40px;padding:0 16px;border-radius:999px;background:#fff;border:1px solid var(--line)">' +
          '<span class="bl" style="display:flex">' + A.icon('check', 16) + '</span>' +
          '<span class="ink2" style="font:400 13px/1 Lato,sans-serif;white-space:nowrap">' + esc(t) + '</span></div>';
      }).join('');
      return R.trust.map(function (t, i) {
        return '<div style="display:flex;align-items:center;gap:10px;padding:0 28px' + (i < 3 ? ';border-right:1px solid rgba(255,255,255,.14)' : '') + '">' +
          '<span style="display:flex;color:rgba(255,255,255,.86)">' + A.icon('check', 16) + '</span>' +
          '<span style="font:400 13px/1 Lato,sans-serif;color:rgba(255,255,255,.86);white-space:nowrap">' + esc(t) + '</span></div>';
      }).join('');
    },

    'brandstrip': function () {
      var LOCK = {
        'BBS': '<span style="font:900 19px/1 Lato,sans-serif;letter-spacing:.2em">BBS</span>',
        'YIDO': '<span style="font:900 20px/1 Lato,sans-serif;letter-spacing:.1em">YIDO</span>',
        'BORBET': '<span style="font:900 21px/1 Lato,sans-serif;letter-spacing:.06em">BORBET</span>',
        'OZ RACING': '<span style="display:block;text-align:center"><span style="font:900 21px/1 Lato,sans-serif;letter-spacing:.06em">OZ</span>' +
          '<span style="display:block;font:700 9px/1 Lato,sans-serif;letter-spacing:.34em;margin-top:4px">RACING</span></span>',
        'ALUTEC': '<span style="font:900 italic 21px/1 Lato,sans-serif;letter-spacing:.01em">ALUTEC</span>',
        'rotiform': '<span style="font:700 22px/1 Lato,sans-serif;letter-spacing:-.01em">rotiform</span>'
      };
      var sep = '<span aria-hidden="true" style="flex:none;width:1px;height:26px;background:var(--line)"></span>';
      var out = R.brands.map(function (b) {
        return '<span style="flex:' + (MOB ? 'none;scroll-snap-align:center' : '1 1 0;justify-content:center') +
          ';display:flex;align-items:center;height:34px;white-space:nowrap;color:var(--ink);opacity:.34;' +
          'transition:opacity 160ms ease-out" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.34">' +
          (LOCK[b] || esc(b)) + '</span>';
      });
      return MOB ? out.join('') : out.join(sep);
    },

    'brandcards': function () {
      var set = [['BORBET', 'graphite', 20], ['OZ RACING', 'silver', 10], ['ALUTEC', 'black', 5], ['BBS', 'polished', 10]];
      return set.map(function (s, i) {
        return '<article class="card raised" style="overflow:hidden;padding:0">' +
          '<div style="position:relative;aspect-ratio:16/9;overflow:hidden;background:radial-gradient(120% 90% at 78% 40%,#1B2333 0%,#0B0D11 70%)"><div class="bnr" style="transition:transform var(--e2);position:absolute;inset:0">' +
          A.photo(A.PHOTO.banners[i % A.PHOTO.banners.length], s[0], '', 'center') + '</div>' +
          '<div style="position:absolute;inset:0;background:linear-gradient(72deg,rgba(5,7,11,.88) 0%,rgba(5,7,11,.42) 52%,rgba(5,7,11,.08) 100%)"></div>' +
          '<div style="position:absolute;left:24px;bottom:22px">' +
          '<div style="font:700 11px/1 Lato,sans-serif;letter-spacing:.2em;color:#8FA6FF">FELGEN MIT GUTACHTEN</div>' +
          '<div style="font:900 30px/1 Lato,sans-serif;letter-spacing:-.01em;color:#fff;margin-top:10px">' + esc(s[0]) + '</div></div></div>' +
          '<div style="padding:20px;display:' + (MOB ? 'block' : 'flex') + ';align-items:center;justify-content:space-between;gap:24px">' +
          '<div class="row"><span class="dot" style="background:var(--ok)"></span>' +
          '<span class="ink2" style="font:400 14px/1.45 Lato,sans-serif">Über 150 Modelle auf Lager und sofort lieferbar</span></div>' +
          '<a class="btn btn-p' + (MOB ? ' btn-full" style="margin-top:14px"' : '" style="flex:none"') + ' href="felgen-suchen.html?marke=' + encodeURIComponent(s[0]) + '">' +
          'Felgen ansehen' + A.icon('arrow-right', 16) + '</a></div></article>';
      }).join('');
    },

    'tiles': function () {
      return R.tiles.map(function (t) {
        return '<a class="mtile" href="felgen-suchen.html?marke=' + encodeURIComponent(t === 'MERCEDES' ? 'Mercedes-Benz' : t === 'VW' ? 'Volkswagen' : t === 'ŠKODA' ? 'Škoda' : t.charAt(0) + t.slice(1).toLowerCase()) +
          '" style="text-decoration:none;color:inherit">' +
          '<span class="mtile-l">' + A.makeLogo(t, MOB ? 28 : 38) + '</span>' +
          '<span class="mtile-n">' + esc(t) + '</span></a>';
      }).join('');
    },

    'bestseller': function () {
      return [R.wheels[0], R.wheels[1], R.wheels[2], R.wheels[3]].map(function (x) {
        return MOB ? '<div style="width:300px">' + P().productCard(x) + '</div>' : P().productCard(x);
      }).join('');
    },

    'warum': function () {
      return R.warum.map(function (x, i) {
        var st = MOB
          ? (i === 1 ? 'padding:28px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)' : (i === 0 ? 'padding-bottom:28px' : 'padding-top:28px'))
          : (i === 1 ? 'padding:0 48px;border-left:1px solid var(--line);border-right:1px solid var(--line)' : (i === 0 ? 'padding-right:48px' : 'padding-left:48px'));
        return '<div style="' + st + '"><span class="bl" style="display:block">' + A.icon(x.icon, 28) + '</span>' +
          '<h3 class="h3" style="margin-top:16px">' + esc(x.t) + '</h3>' +
          '<p class="body ink2" style="margin-top:10px;font-size:15px;line-height:1.65">' + esc(x.b) + '</p></div>';
      }).join('');
    },

    'faq-home': function () { return P().accordion(R.faq.slice(0, 5), true); },
    'faq-list': function () {
      var g1 = R.faq.filter(function (x) { return x.g.indexOf('KOMPAT') === 0; });
      var g2 = R.faq.filter(function (x) { return x.g.indexOf('BESTELL') === 0; });
      return '<div class="micro">Kompatibilität &amp; Freigabe</div><div style="margin-top:12px">' + P().accordion(g1, true) + '</div>' +
        '<div class="micro" style="margin-top:32px">Bestellung &amp; Versand</div><div style="margin-top:12px">' + P().accordion(g2, false) + '</div>';
    },

    'contact-rows': function () { return P().contactRows(); },
    'doc': function () { return A.docSVG('neu'); }
  };

  function fillAll() {
    $$('[data-mount]').forEach(function (el) {
      var k = el.getAttribute('data-mount');
      if (FILL[k] && !el.getAttribute('data-filled')) { el.innerHTML = FILL[k](); el.setAttribute('data-filled', '1'); }
    });
    P().wireCards(); P().wireAccordion();
    $$('.card.raised').forEach(function (c) {
      var b = $('.bnr', c); if (!b) return;
      c.addEventListener('mouseenter', function () { b.style.transform = 'scale(1.03)'; });
      c.addEventListener('mouseleave', function () { b.style.transform = 'none'; });
    });
  }

  /* ═══ pages ═══════════════════════════════════════════ */
  var PAGES = {};

  PAGES.startseite = function () {
    fillAll();
    var sel = m('hero-selector'); if (sel) P().selector(sel, { listH: MOB ? 174 : 226 });
  };

  PAGES['felgen-suchen'] = function () {
    fillAll();
    var g = m('sel-guided'), k = m('sel-keys');
    if (g) {
      var inst = P().selector(g, { split: true, listH: 248, rowH: 56 });
      if (k) { k.innerHTML = inst.keyHTML(); wireKeys(k, inst); }
    }
    var doc = m('doc-toggle');
    if (doc) {
      $$('[data-v]', doc).forEach(function (b) {
        b.addEventListener('click', function () {
          $$('[data-v]', doc).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          m('doc').innerHTML = A.docSVG(b.getAttribute('data-v'));
        });
      });
    }
    $$('[data-openhelp]').forEach(function (b) { b.addEventListener('click', P().openDocHelp); });
  };
  function wireKeys(k, inst) {
    var hsn = $('[data-hsn]', k), tsn = $('[data-tsn]', k), lk = $('[data-lookup]', k);
    if (hsn) hsn.addEventListener('input', function () { hsn.value = hsn.value.toUpperCase().replace(/\s/g, ''); if (hsn.value.length === 4 && tsn) tsn.focus(); });
    if (tsn) tsn.addEventListener('input', function () { tsn.value = tsn.value.toUpperCase().replace(/\s/g, ''); });
    function go() {
      var res = R.lookup(hsn ? hsn.value : '', tsn ? tsn.value : '');
      var box = $('[data-res]', k);
      if (res.length === 1) { P().S.vehicle(res[0]); P().S.seenPLP('1'); location.href = 'felgen.html'; return; }
      if (res.length > 1) {
        box.innerHTML = '<div style="margin-top:14px"><div style="font:700 15px/1.4 Lato,sans-serif">Zu dieser Schlüsselnummer gibt es mehrere Varianten.</div>' +
          '<div class="ink2" style="font:400 13px/1.5 Lato,sans-serif;margin-top:4px">Bauzeitraum und Höchstgeschwindigkeit entscheiden über die zulässigen Reifen.</div>' +
          '<div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">' + res.map(function (c, i) {
            return '<button data-c="' + i + '" style="display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:72px;padding:12px 16px;background:#fff;border:1px solid var(--line);border-radius:8px;text-align:left">' +
              '<span><span style="display:block;font:700 15px/1.3 Lato,sans-serif">' + esc(c.variant) + '</span>' +
              '<span class="mono ink2" style="display:block;margin-top:4px">' + esc(c.years) + ' · ' + c.kw + ' kW (' + c.ps + ' PS) · ' + esc(c.body) + ' · ' + c.vmax + ' km/h</span></span>' +
              '<span class="ink3" style="display:flex">' + A.icon('chevron-right', 20) + '</span></button>';
          }).join('') + '</div></div>';
        $$('[data-c]', box).forEach(function (b) {
          b.addEventListener('mouseenter', function () { b.style.background = 'var(--wash)'; });
          b.addEventListener('mouseleave', function () { b.style.background = '#fff'; });
          b.addEventListener('click', function () { P().S.vehicle(res[+b.getAttribute('data-c')]); P().S.seenPLP('1'); location.href = 'felgen.html'; });
        });
      } else {
        box.innerHTML = '<div style="margin-top:14px;background:var(--warn-w);border-radius:10px;padding:16px">' +
          '<div style="display:flex;gap:10px;color:var(--warn)">' + A.icon('warning', 20) +
          '<strong style="font:700 14px/1.4 Lato,sans-serif">Zu dieser Kombination haben wir kein Fahrzeug gefunden.</strong></div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' +
          '<button class="btn btn-s" data-openhelp style="height:44px">Schlüsselnummern prüfen</button>' +
          '<button class="btn btn-q" data-send style="height:44px">Daten an RIMIFY senden</button></div></div>';
        $$('[data-openhelp]', box).forEach(function (b) { b.addEventListener('click', P().openDocHelp); });
        $('[data-send]', box).addEventListener('click', function () { P().toast('Danke – wir melden uns.'); });
      }
    }
    if (lk) lk.addEventListener('click', go);
    if (tsn) tsn.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
  }

  /* ── PLP ─────────────────────────────────────────────── */
  var FACETS = [
    { k: 'brand', t: 'Marke', get: function (x) { return [x.brand]; } },
    { k: 'zoll', t: 'Zoll', get: function (x) { return x.sizes.map(String); } },
    { k: 'breite', t: 'Breite', get: function (x) { return x.widths.map(function (b) { return R.dec(b, 1).replace(',0', ''); }); } },
    { k: 'et', t: 'ET', get: function (x) { return ['ET ' + x.et]; } },
    { k: 'farbe', t: 'Farbe', get: function (x) { return [x.finishName]; } },
    { k: 'design', t: 'Design', get: function (x) { return [x.design]; } },
    { k: 'preis', t: 'Preis', get: function (x) { return [x.price < 800 ? 'bis 800 €' : x.price < 1000 ? '800–1.000 €' : 'ab 1.000 €']; } },
    { k: 'verf', t: 'Verfügbarkeit', get: function (x) { return [x.stock === 'out' ? 'ausverkauft' : 'auf Lager']; } }
  ];
  var plp = { sel: {}, ohne: false, seg: 'alle', sort: 'Beliebt', page: 1 };

  function plpMatch(x, skip) {
    if (plp.ohne && x.verdict === 'conditional') return false;
    if (plp.seg === 'sale' && !x.sale) return false;
    for (var i = 0; i < FACETS.length; i++) {
      var f = FACETS[i]; if (f.k === skip) continue;
      var on = plp.sel[f.k]; if (!on || !on.length) continue;
      var vals = f.get(x);
      if (!on.some(function (v) { return vals.indexOf(v) >= 0; })) return false;
    }
    return true;
  }
  function plpResults() {
    var out = R.wheels.filter(function (x) { return plpMatch(x); });
    if (plp.sort === 'Preis aufsteigend') out.sort(function (a, b) { return a.price - b.price; });
    else if (plp.sort === 'Preis absteigend') out.sort(function (a, b) { return b.price - a.price; });
    else if (plp.sort === 'Bewertung') out.sort(function (a, b) { return b.rating - a.rating; });
    return out;
  }
  function facetOptions(f) {
    var seen = {}, out = [];
    R.wheels.forEach(function (x) { f.get(x).forEach(function (v) { if (!seen[v]) { seen[v] = 1; out.push(v); } }); });
    return out.map(function (v) {
      var n = R.wheels.filter(function (x) { return plpMatch(x, f.k) && f.get(x).indexOf(v) >= 0; }).length;
      return { v: v, n: n };
    });
  }
  function anyFilter() { return plp.ohne || Object.keys(plp.sel).some(function (k) { return plp.sel[k] && plp.sel[k].length; }); }

  function renderPLP() {
    var res = plpResults(), grid = m('plp-grid');
    var cnt = m('plp-count'); if (cnt) cnt.textContent = res.length + ' Felgen mit gültiger Freigabe für dieses Fahrzeug.';
    var seg = m('plp-seg');
    if (seg) seg.innerHTML = '<div class="seg"><button data-seg="alle" aria-pressed="' + (plp.seg === 'alle') + '">Alle Felgen (' + R.wheels.length + ')</button>' +
      '<button data-seg="sale" aria-pressed="' + (plp.seg === 'sale') + '"><span class="bl">SALE %</span>&nbsp;(' + R.wheels.filter(function (x) { return x.sale; }).length + ')</button></div>';
    if (grid) {
      grid.innerHTML = res.length
        ? res.map(function (x) { return P().productCard(x); }).join('')
        : '<div style="grid-column:1/-1;background:#fff;border:1px solid var(--line);border-radius:14px;padding:48px;text-align:center">' +
        '<div class="ink3" style="display:flex;justify-content:center">' + A.icon('search', 28) + '</div>' +
        '<h3 class="h3" style="margin-top:14px">Für dieses Fahrzeug haben wir noch keine freigegebenen Felgen.</h3>' +
        '<p class="body ink2" style="margin-top:8px;max-width:520px;margin-inline:auto">Wir zeigen nur Felgen mit gültigem Gutachten. Sag uns Bescheid, dann besorgen wir die Freigabe.</p>' +
        '<div class="row" style="justify-content:center;margin-top:20px;flex-wrap:wrap">' +
        '<button class="btn btn-p">Benachrichtigen, sobald verfügbar</button>' +
        '<a class="btn btn-s" href="felgen-suchen.html">Anderes Fahrzeug wählen</a></div></div>';
      P().wireCards(grid);
    }
    var pg = m('plp-pager');
    if (pg) pg.innerHTML = res.length ? ['‹', '1', '2', '3', '…', '61', '›'].map(function (p) {
      return '<button' + (p === '1' ? ' aria-current="page"' : '') + '>' + p + '</button>';
    }).join('') : '';
    var bar = m('plp-filters'); if (bar) renderFilterBar(bar);
    var mb = m('plp-mobilebtn');
    if (mb) mb.innerHTML = '<button class="btn btn-s btn-full" data-sheet style="justify-content:space-between">Filtern nach Größe, Farbe, etc.' + A.icon('chevron-down', 18) + '</button>';
    var resetTop = m('plp-reset');
    if (resetTop) resetTop.innerHTML = anyFilter() ? '<button class="link" data-reset>Alle Filter zurücksetzen</button>' : '';
    wirePLP();
  }
  function renderFilterBar(bar) {
    bar.innerHTML = '<div class="fbar">' +
      '<button class="toggle" data-ohne aria-pressed="' + plp.ohne + '">' + A.icon('check', 18) + 'Ohne Eintragung</button>' +
      '<span class="sep"></span>' +
      FACETS.map(function (f, i) {
        var n = (plp.sel[f.k] || []).length;
        return (i ? '<span class="sep"></span>' : '') + '<span style="position:relative"><button class="fpill" data-f="' + f.k + '" aria-expanded="false">' +
          esc(f.t) + (n ? '<span class="cnt">' + n + '</span>' : '') + A.icon('chevron-down', 16) + '</button></span>';
      }).join('') + '</div>';
  }
  function wirePLP() {
    var o = $('[data-ohne]'); if (o) o.addEventListener('click', function () { plp.ohne = !plp.ohne; renderPLP(); });
    $$('[data-reset]').forEach(function (b) { b.addEventListener('click', function () { plp.sel = {}; plp.ohne = false; renderPLP(); }); });
    $$('[data-seg]').forEach(function (b) { b.addEventListener('click', function () { plp.seg = b.getAttribute('data-seg'); renderPLP(); }); });
    $$('[data-f]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = $('.fdrop'); if (open) open.remove();
        if (b.getAttribute('aria-expanded') === 'true') { b.setAttribute('aria-expanded', 'false'); return; }
        $$('[data-f]').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
        b.setAttribute('aria-expanded', 'true');
        var f = FACETS.filter(function (x) { return x.k === b.getAttribute('data-f'); })[0];
        var dd = d.createElement('div'); dd.className = 'fdrop';
        dd.innerHTML = facetOptions(f).map(function (op) {
          var on = (plp.sel[f.k] || []).indexOf(op.v) >= 0;
          return '<label class="' + (op.n ? '' : 'off') + '"><input type="checkbox" ' + (on ? 'checked ' : '') + (op.n ? '' : 'disabled ') +
            'data-v="' + esc(op.v) + '"><span>' + esc(op.v) + '</span><span class="n">' + op.n + '</span></label>';
        }).join('');
        b.parentNode.appendChild(dd);
        dd.addEventListener('click', function (ev) { ev.stopPropagation(); });
        $$('input', dd).forEach(function (inp) {
          inp.addEventListener('change', function () {
            var arr = plp.sel[f.k] || [], v = inp.getAttribute('data-v');
            if (inp.checked) arr.push(v); else arr = arr.filter(function (x) { return x !== v; });
            plp.sel[f.k] = arr; renderPLP();
          });
        });
      });
    });
    d.addEventListener('click', function () { var x = $('.fdrop'); if (x) { x.remove(); $$('[data-f]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); } });
    var srt = $('[data-sort]');
    if (srt) srt.addEventListener('change', function () { plp.sort = srt.value; renderPLP(); });
    var sh = $('[data-sheet]');
    if (sh) sh.addEventListener('click', openFilterSheet);
  }
  function openFilterSheet() {
    var body = '<button class="toggle" data-ohne aria-pressed="' + plp.ohne + '" style="width:100%;justify-content:flex-start;height:52px">' +
      A.icon('check', 18) + 'Ohne Eintragung</button>' +
      FACETS.map(function (f) {
        return '<div style="margin-top:20px"><div class="micro">' + esc(f.t) + '</div><div style="margin-top:8px">' +
          facetOptions(f).map(function (op) {
            var on = (plp.sel[f.k] || []).indexOf(op.v) >= 0;
            return '<label style="display:flex;align-items:center;gap:10px;min-height:48px;' + (op.n ? '' : 'opacity:.4;') + '">' +
              '<input type="checkbox" style="width:20px;height:20px;accent-color:var(--blue)" ' + (on ? 'checked ' : '') + (op.n ? '' : 'disabled ') +
              'data-fk="' + f.k + '" data-v="' + esc(op.v) + '"><span style="flex:1">' + esc(op.v) + '</span><span class="mono ink3">' + op.n + '</span></label>';
          }).join('') + '</div></div>';
      }).join('');
    var s = P().sheet('Filter', body, '<button class="btn btn-p btn-full" data-apply>' + plpResults().length + ' Felgen anzeigen</button>');
    var hdr = $('header', s);
    var rst = d.createElement('button'); rst.className = 'link'; rst.textContent = 'Zurücksetzen';
    rst.addEventListener('click', function () { plp.sel = {}; plp.ohne = false; P().closeAll(); renderPLP(); });
    hdr.insertBefore(rst, hdr.lastChild);
    var oo = $('[data-ohne]', s); if (oo) oo.addEventListener('click', function () { plp.ohne = !plp.ohne; oo.setAttribute('aria-pressed', plp.ohne); upd(); });
    $$('input[data-fk]', s).forEach(function (inp) {
      inp.addEventListener('change', function () {
        var k = inp.getAttribute('data-fk'), v = inp.getAttribute('data-v'), arr = plp.sel[k] || [];
        if (inp.checked) arr.push(v); else arr = arr.filter(function (x) { return x !== v; });
        plp.sel[k] = arr; upd();
      });
    });
    function upd() { $('[data-apply]', s).textContent = plpResults().length + ' Felgen anzeigen'; }
    $('[data-apply]', s).addEventListener('click', function () { P().closeAll(); renderPLP(); });
  }

  PAGES.felgen = function () {
    fillAll();
    var v = P().S.vehicle();
    if (v) P().S.seenPLP('1');
    var h = m('plp-head');
    if (h) h.innerHTML = v
      ? 'Unser gesamtes Felgensortiment für deinen ' + esc(v.short)
      : 'Unser gesamtes Felgensortiment';
    var strip = m('plp-novehicle');
    if (strip && !v) strip.innerHTML = '<div class="wash row" style="justify-content:space-between;padding:16px 20px">' +
      '<span style="font:700 15px/1.4 Lato,sans-serif">Wähle dein Fahrzeug, um nur freigegebene Felgen zu sehen.</span>' +
      '<a class="btn btn-p" href="felgen-suchen.html" style="height:44px">Fahrzeug wählen</a></div>';
    renderPLP();
  };

  /* ── PDP ─────────────────────────────────────────────── */
  var pdp = { w: null, size: null, qty: 4, ack: false, img: 0 };
  function pdpVariants() { return R.wheels.filter(function (x) { return x.model === pdp.w.model; }); }
  function pdpPrice() { return pdp.w.price * (pdp.qty / 4); }
  function verdictPanel() {
    var v = P().S.vehicle(), wh = pdp.w;
    if (!v) return '<div class="wash" style="padding:14px 16px"><div class="row">' + A.checkGlyph(20) +
      '<div><div class="micro bl">RIMIFY-CHECK</div><div style="font:700 15px/1.3 Lato,sans-serif;margin-top:4px">Passt diese Felge auf dein Auto?</div></div></div>' +
      '<a class="btn btn-s btn-full" href="felgen-suchen.html" style="margin-top:12px">Fahrzeug wählen</a></div>';
    if (wh.verdict === 'conditional') {
      return '<div style="background:var(--warn-w);border-radius:10px;padding:14px 16px">' +
        '<div class="row" style="align-items:flex-start;color:var(--warn)">' + A.icon('warning', 20) +
        '<div><div class="micro" style="color:var(--warn)">RIMIFY-CHECK</div>' +
        '<div style="font:700 15px/1.3 Lato,sans-serif;color:var(--ink);margin-top:4px">Freigegeben mit Auflagen für ' + esc(v.short) + '</div></div></div>' +
        '<ul style="margin-top:12px;display:flex;flex-direction:column;gap:8px">' + wh.conditions.map(function (c) {
          return '<li class="row" style="align-items:flex-start;gap:8px"><span class="dot" style="background:var(--warn);margin-top:7px"></span>' +
            '<span class="ink2" style="font:400 13px/1.5 Lato,sans-serif">' + esc(c) + '</span></li>';
        }).join('') + '</ul>' +
        '<label class="check" style="margin-top:10px"><input type="checkbox" data-ack' + (pdp.ack ? ' checked' : '') + '>' +
        '<span style="font:700 13px/1.4 Lato,sans-serif">Ich habe die Auflagen gelesen</span></label>' +
        '<a class="link" href="#" style="margin-top:6px">' + A.icon('document', 16) + 'Gutachten ansehen (PDF)</a></div>';
    }
    return '<div class="wash" style="padding:14px 16px">' +
      '<div class="row" style="align-items:flex-start">' + A.checkGlyph(20) +
      '<div><div class="micro bl">RIMIFY-CHECK</div>' +
      '<div style="font:700 15px/1.3 Lato,sans-serif;margin-top:4px">Passend für ' + esc(v.short) + '</div>' +
      '<div class="ink2" style="font:400 13px/1.5 Lato,sans-serif;margin-top:4px">Keine Eintragung in die Fahrzeugpapiere erforderlich.</div>' +
      '<a class="link" href="#" style="margin-top:8px">' + A.icon('document', 16) + 'Gutachten ansehen (PDF)</a></div></div></div>';
  }
  function renderPDP() {
    var wh = pdp.w, v = P().S.vehicle();
    var g = m('pdp-gallery');
    if (g) g.innerHTML = '<div class="well" style="border-radius:10px"><div class="art">' + P().wheelArt(wh, pdp.img === 4) + '</div></div>';
    var th = m('pdp-thumbs');
    if (th) th.innerHTML = '<button class="btn btn-q" data-th="-1" aria-label="zurück" style="width:36px;height:72px;padding:0">' + A.icon('chevron-left', 18) + '</button>' +
      [0, 1, 2, 3, 4].map(function (i) {
        return '<button data-thi="' + i + '" style="width:72px;height:72px;border-radius:8px;background:linear-gradient(#fff,#FAFBFE);padding:6px;' +
          'border:' + (i === pdp.img ? '2px solid var(--blue)' : '1px solid var(--line)') + '">' +
          A.wheelSVG({ spokes: [wh.spokes, 5, 10, 7, wh.spokes][i], finish: wh.finish, cap: wh.brand.charAt(0), shadow: false, tyre: i === 4 }) + '</button>';
      }).join('') + '<button class="btn btn-q" data-th="1" aria-label="weiter" style="width:36px;height:72px;padding:0">' + A.icon('chevron-right', 18) + '</button>';

    var t = m('pdp-title'); if (t) t.textContent = wh.brand + ' ' + wh.model;
    var rt = m('pdp-rating'); if (rt) rt.innerHTML = A.stars(5, 16) + '<a href="#bew" class="ink3 rev-link" style="font:400 14px/1 Lato,sans-serif;margin-left:8px">' + wh.reviews + ' Bewertungen</a>';
    var sw = m('pdp-swatch');
    if (sw) sw.innerHTML = pdpVariants().map(function (x) {
      var on = x.sku === wh.sku;
      return '<button data-sw="' + x.sku + '" title="' + esc(x.finishName) + '" style="width:' + (MOB ? 46 : 40) + 'px;height:' + (MOB ? 46 : 40) + 'px;border-radius:999px;overflow:hidden;padding:0;' +
        'box-shadow:' + (on ? '0 0 0 2px var(--blue)' : '0 0 0 1px var(--line)') + ';outline-offset:3px">' +
        A.wheelSVG({ spokes: x.spokes, finish: x.finish, cap: '', shadow: false }) + '</button>';
    }).join('') + '<div class="ink2" style="width:100%;font:400 13px/1 Lato,sans-serif;margin-top:8px">' + esc(wh.finishName) + '</div>';
    var ch = m('pdp-sizes');
    if (ch) ch.innerHTML = wh.sizes.map(function (s) {
      var off = wh.blocked.indexOf(s) >= 0;
      return '<button class="chip" data-size="' + s + '" aria-pressed="' + (s === pdp.size) + '"' +
        (off ? ' disabled title="Für Ihr Fahrzeug nicht freigegeben."' : '') + '>' + s + '</button>';
    }).join('');
    var se = m('pdp-select');
    if (se) se.innerHTML = '<select class="field mono" aria-label="Größe und Einpresstiefe">' + wh.widths.map(function (b) {
      return '<option>' + R.dec(b, 1) + ' x ' + pdp.size + ' | ET ' + wh.et + '</option>';
    }).join('') + '</select>';
    var vp = m('pdp-verdict'); if (vp) vp.innerHTML = verdictPanel();
    var pr = m('pdp-price');
    if (pr) pr.innerHTML = '<div class="micro">Preis für ' + pdp.qty + ' Felgen</div>' +
      '<div class="row" style="margin-top:8px;gap:16px"><span class="step"><button data-q="-1" aria-label="weniger">' + A.icon('minus', 18) + '</button>' +
      '<input value="' + pdp.qty + '" readonly aria-label="Anzahl"><button data-q="1" aria-label="mehr">' + A.icon('plus', 18) + '</button></span>' +
      '<strong style="font:700 30px/1 Lato,sans-serif;font-variant-numeric:tabular-nums">' + eur(pdpPrice()) + '</strong></div>';
    var ad = m('pdp-add');
    var blocked = wh.stock === 'out' || (wh.verdict === 'conditional' && v && !pdp.ack);
    if (ad) ad.innerHTML = '<button class="btn btn-p btn-full btn-lg" data-add' + (blocked ? ' disabled' : '') + '>' + A.icon('cart', 20) +
      (wh.stock === 'out' ? 'Zurzeit ausverkauft' : 'In den Warenkorb') + '</button>' +
      '<div class="ink3" style="font:400 13px/1 Lato,sans-serif;margin-top:10px;text-align:center">Express-Versand innerhalb weniger Werktage</div>';

    var det = m('pdp-details');
    if (det) det.innerHTML = '<dl class="deflist">' + [
      ['Marke', wh.brand], ['Modell', wh.model], ['Farbe', wh.finishName], ['Größe', String(pdp.size)],
      ['Breite', R.dec(wh.widths[Math.floor(wh.widths.length / 2)], 1) + 'J'], ['ET', String(wh.et)],
      ['Lochkreis', '5/112'], ['Mittenlochbohrung', '66,6 mm']
    ].map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>';

    var st = m('pdp-sticky');
    if (st) st.innerHTML = '<div><div style="font:700 17px/1 Lato,sans-serif;font-variant-numeric:tabular-nums">' + eur(pdpPrice()) + '</div>' +
      '<div class="ink3" style="font:400 11px/1 Lato,sans-serif;margin-top:3px">für ' + pdp.qty + ' Felgen</div></div>' +
      (v ? '<div class="row" style="gap:6px;color:var(--blue)">' + A.icon('check', 18) + '<span style="font:700 13px/1 Lato,sans-serif">' +
        (wh.verdict === 'conditional' ? 'Auflagen' : 'Passend') + '</span></div>' : '') +
      '<button class="btn btn-p" data-add>In den Warenkorb</button>';

    wirePDP();
  }
  function wirePDP() {
    $$('[data-sw]').forEach(function (b) {
      b.addEventListener('click', function () {
        pdp.w = R.wheels.filter(function (x) { return x.sku === b.getAttribute('data-sw'); })[0];
        if (pdp.w.sizes.indexOf(pdp.size) < 0) pdp.size = pdp.w.sizes[0];
        pdp.ack = false; renderPDP();
      });
    });
    $$('[data-size]').forEach(function (b) {
      if (b.disabled) return;
      b.addEventListener('click', function () { pdp.size = +b.getAttribute('data-size'); renderPDP(); });
    });
    $$('[data-thi]').forEach(function (b) { b.addEventListener('click', function () { pdp.img = +b.getAttribute('data-thi'); renderPDP(); }); });
    $$('[data-th]').forEach(function (b) { b.addEventListener('click', function () { pdp.img = Math.max(0, Math.min(4, pdp.img + (+b.getAttribute('data-th')))); renderPDP(); }); });
    $$('[data-q]').forEach(function (b) { b.addEventListener('click', function () { pdp.qty = Math.max(1, pdp.qty + (+b.getAttribute('data-q'))); renderPDP(); }); });
    var ack = $('[data-ack]'); if (ack) ack.addEventListener('change', function () { pdp.ack = ack.checked; renderPDP(); });
    $$('[data-add]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.disabled) return;
        P().addToCart({ sku: pdp.w.sku, name: pdp.w.brand + ' ' + pdp.w.model, finish: pdp.w.finishName, size: R.dec(pdp.w.widths[1] || 8.5, 1) + ' x ' + pdp.size, qty: pdp.qty, price: pdp.w.price / 4, kind: 'felge', entry: pdp.w.verdict === 'conditional' });
      });
    });
  }
  PAGES.produkt = function () {
    var sku = P().qs('sku');
    pdp.w = R.wheels.filter(function (x) { return x.sku === sku; })[0] || R.wheels[0];
    pdp.size = pdp.w.sizes.filter(function (s) { return pdp.w.blocked.indexOf(s) < 0; })[0];
    fillAll();
    var cr = m('pdp-crumb'); var v = P().S.vehicle();
    if (cr) cr.innerHTML = '<a href="startseite.html">RIMIFY</a>›<a href="felgen.html">Felgen</a>' + (v ? '›<span class="ink2">' + esc(v.short) + '</span>' : '');
    var ty = m('pdp-tyres');
    if (ty) ty.innerHTML = R.tyres.slice(0, 4).map(function (t) {
      return '<article class="card' + (t.best ? '' : ' raised') + '" style="padding:16px;display:flex;flex-direction:column;' + (t.best ? 'border-color:var(--blue);box-shadow:var(--sh-1)' : '') + (MOB ? ';flex:none;width:280px;scroll-snap-align:start' : '') + '">' +
        '<div class="well" style="position:relative"><div class="art">' + A.photo(A.PHOTO.tyre, 'Reifen ' + t.size, A.tyreSVG({ label: t.size }), 'center', '8%') + '</div>' +
        (t.best ? '<span class="pill pill-blue" style="position:absolute;top:12px;left:12px">Empfohlen</span>' : '') + '</div>' +
        '<div class="micro" style="margin-top:14px">' + esc(t.brand) + '</div>' +
        '<div style="font:700 16px/1.2 Lato,sans-serif;margin-top:6px">' + esc(t.model) + '</div>' +
        '<div style="margin-top:6px">' + A.stars(t.rating, 13) + '<span class="ink3" style="font-size:12px;margin-left:6px">(' + t.reviews + ')</span></div>' +
        '<div style="font:700 22px/1 Lato,sans-serif;font-variant-numeric:tabular-nums;margin-top:12px">' + eur(t.price) + '</div>' +
        '<div class="ink3" style="font:400 12px/1.4 Lato,sans-serif;margin-top:4px">für 4 Kompletträder.<br>Bezogen und gewuchtet</div>' +
        '<div style="flex:1;min-height:12px"></div>' +
        '<button class="btn btn-p btn-full" data-kr="' + esc(t.brand + ' ' + t.model) + '" data-krp="' + t.price + '">Zum Komplettrad machen</button></article>';
    }).join('');
    renderPDP();
    $$('[data-kr]').forEach(function (b) {
      b.addEventListener('click', function () {
        P().addToCart({ sku: 'KR-' + b.getAttribute('data-kr'), name: b.getAttribute('data-kr'), finish: 'Komplettrad', size: '245/45 R18', qty: 4, price: (+b.getAttribute('data-krp')) / 4, kind: 'komplettrad' });
      });
    });
    if (MOB) {
      var bar = $('.sticky-bar');
      if (bar) w.addEventListener('scroll', function () { bar.classList.toggle('on', w.scrollY > 700); }, { passive: true });
    }
  };

  w.PAGES = PAGES;
  w.PAGES._fillAll = fillAll;
  w.PAGES._renderPLP = renderPLP;
})(window, document);
