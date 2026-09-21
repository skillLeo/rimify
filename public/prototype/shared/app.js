/* RIMIFY — application core: vehicle context, chrome, cart, selector, shared renderers */
(function (w, d) {
  'use strict';
  var R = w.RMF, A = w.ART;

  /* ── storage ───────────────────────────────────────── */
  function ss(k, v) {
    try {
      if (v === undefined) { var r = sessionStorage.getItem(k); return r ? JSON.parse(r) : null; }
      if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v));
    } catch (e) { return null; }
  }
  var S = {
    vehicle: function (v) { return v === undefined ? ss('rmf_vehicle') : ss('rmf_vehicle', v); },
    seenPLP: function (v) { return v === undefined ? ss('rmf_seenPLP') : ss('rmf_seenPLP', v); },
    cart: function (v) { return v === undefined ? (ss('rmf_cart') || []) : ss('rmf_cart', v); },
    opts: function (v) { return v === undefined ? (ss('rmf_opts') || { ventil: 'schwarz', gewicht: 'schwarz', versand: 'dhl' }) : ss('rmf_opts', v); }
  };

  var BOOKING = ['felgen', 'produkt', 'warenkorb'];
  var PAGE = d.body.getAttribute('data-page') || 'startseite';
  var MOB = d.body.classList.contains('is-mobile');

  function eur(n) { return R.eur(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function qs(k) { try { return new URLSearchParams(location.search).get(k); } catch (e) { return null; } }
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function mount(name) { return d.querySelector('[data-mount="' + name + '"]'); }

  function vehicleLabel(v, short) {
    if (!v) return '';
    return short ? v.short : v.label + (v.hsn ? ' (' + v.hsn + '/' + v.tsn + ')' : '');
  }
  function felgenHref() { return S.vehicle() ? 'felgen.html' : 'felgen-suchen.html'; }

  /* ── chrome ────────────────────────────────────────── */
  function headerMode() {
    if (PAGE === 'kasse' || PAGE === 'bestellung' || PAGE.indexOf('admin') === 0) return 'SUPPRESSED';
    var v = S.vehicle();
    if (!v) return 'PLAIN';
    if (BOOKING.indexOf(PAGE) >= 0) return 'WHITE_BOX';
    return S.seenPLP() ? 'BLUE_BAR' : 'PLAIN';
  }

  function cartCount() { return S.cart().reduce(function (a, l) { return a + l.qty; }, 0); }

  function navHTML(active) {
    var items = [
      ['Felgen suchen', felgenHref(), 'felgen'],
      ['FAQ', 'faq.html', 'faq'],
      ['Kontakt', 'kontakt.html', 'kontakt'],
      ['RIMIFY CHECK', 'rimify-check.html', 'rimify-check']
    ];
    return items.map(function (it) {
      var cur = (it[2] === active) || (it[2] === 'felgen' && (active === 'felgen-suchen' || active === 'produkt'));
      return '<a href="' + it[1] + '"' + (cur ? ' aria-current="page"' : '') + '>' + esc(it[0]) +
        (it[2] === 'rimify-check' ? A.checkGlyph(16) : '') + '</a>';
    }).join('');
  }

  function renderChrome() {
    var top = d.getElementById('top'); if (!top) return;
    if (PAGE.indexOf('admin-') === 0) { top.innerHTML = ''; top.classList.add('hide'); return; }
    var mode = headerMode(), v = S.vehicle(), n = cartCount();
    var h = '';

    if (PAGE === 'kasse') {
      h = '<header class="hdr" style="grid-template-columns:1fr;justify-items:center"><span class="wordmark">RIMIFY</span></header>';
      top.innerHTML = h; return;
    }
    if (mode === 'BLUE_BAR') {
      h += '<div class="bluebar">Gewähltes Fahrzeug: <strong>' + esc(v.short) + '</strong><span style="opacity:.45">|</span>' +
        '<a href="felgen.html">Felgen anzeigen</a></div>';
    }
    if (MOB) {
      h += '<header class="hdr"><a href="startseite.html" class="wordmark" style="color:#fff;text-decoration:none">RIMIFY</a>' +
        (mode === 'WHITE_BOX' ? '<button class="vbox" id="vboxBtn" style="padding:6px 12px;margin:0 8px;flex:1;min-width:0">' +
          '<span class="l1">Gewähltes Fahrzeug:</span><span class="l2" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(v.short) + '</span></button>' : '') +
        '<button class="burger" id="burgerBtn" aria-label="Menü öffnen">' + A.icon('menu', 24) + '</button></header>';
    } else {
      h += '<header class="hdr"><a href="startseite.html" class="wordmark" style="color:#fff;text-decoration:none">RIMIFY</a>' +
        (mode === 'WHITE_BOX'
          ? '<button class="vbox" id="vboxBtn"><span class="l1">Gewähltes Fahrzeug:</span><span class="l2">' + esc(vehicleLabel(v)) + '</span></button>'
          : '<nav class="hnav">' + navHTML(PAGE) + '</nav>') +
        '<div class="hright"><a class="hcart" href="warenkorb.html">' + A.icon('cart', 24) + '<span>Warenkorb</span>' +
        (n ? '<span class="badge">' + n + '</span>' : '') + '</a></div></header>';
    }
    top.innerHTML = h;

    var vb = d.getElementById('vboxBtn');
    if (vb) vb.addEventListener('click', function (e) {
      e.stopPropagation();
      var old = $('.vpop'); if (old) { old.remove(); return; }
      var pop = d.createElement('div'); pop.className = 'vpop';
      pop.innerHTML = '<div class="micro" style="padding:8px 12px">Fahrzeug</div>' +
        '<div class="mono" style="padding:0 12px 8px">' + esc(vehicleLabel(v)) + '</div>' +
        '<button data-a="change">Fahrzeug ändern</button><button data-a="clear">Fahrzeug entfernen</button>';
      vb.appendChild(pop);
      pop.addEventListener('click', function (ev) {
        var a = ev.target.getAttribute('data-a');
        if (a === 'change') location.href = 'felgen-suchen.html';
        if (a === 'clear') { S.vehicle(null); S.seenPLP(null); location.href = 'startseite.html'; }
      });
    });
    d.addEventListener('click', function () { var p = $('.vpop'); if (p) p.remove(); });

    var bb = d.getElementById('burgerBtn');
    if (bb) bb.addEventListener('click', openMenuSheet);
  }

  function renderFooter() {
    var b = d.getElementById('bottom'); if (!b) return;
    var soc = [
      ['Facebook', 'M12 20.4a8.4 8.4 0 100-16.8 8.4 8.4 0 000 16.8zM13.9 8.2h-1.3c-.9 0-1.4.5-1.4 1.4v1.5h2.6l-.4 2.6h-2.2v4.9'],
      ['TikTok', 'M8.9 20.6a3.8 3.8 0 100-7.6 3.8 3.8 0 000 7.6zM12.7 16.8V3.4c1.1 2.7 3 4.2 5.7 4.3'],
      ['Instagram', 'M7 3.2h10A3.8 3.8 0 0120.8 7v10A3.8 3.8 0 0117 20.8H7A3.8 3.8 0 013.2 17V7A3.8 3.8 0 017 3.2zM12 16a4 4 0 100-8 4 4 0 000 8zM17.2 6.9v.1'],
      ['WhatsApp', 'M12 3.4c-4.6 0-8.3 3.3-8.3 7.3 0 2 .9 3.8 2.3 5.1l-.8 3.5 3.8-1.6c.9.3 1.9.4 3 .4 4.6 0 8.3-3.3 8.3-7.3S16.6 3.4 12 3.4z']
    ].map(function (s0) {
      return '<a href="#" aria-label="' + s0[0] + '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="' + s0[1] + '"/></svg></a>';
    }).join('');

    var colBrand = '<div><span class="wordmark" style="color:#fff">RIMIFY</span><p>' + esc(R.footerLine) + '</p><div class="soc">' + soc + '</div></div>';
    var colSeiten = '<div><div class="micro">Seiten</div><div class="links">' +
      '<a href="' + felgenHref() + '">Felgen suchen</a><a href="rimify-check.html">RIMIFY-CHECK</a>' +
      '<a href="faq.html">FAQ</a><a href="kontakt.html">Kontakt</a></div></div>';
    var colRecht = '<div><div class="micro">Rechtliches</div><div class="links">' +
      ['impressum', 'datenschutz', 'agb', 'widerruf', 'versand'].map(function (id, i) {
        return '<a href="rechtliches.html?t=' + id + '">' + ['Impressum', 'Datenschutz', 'AGB', 'Widerrufsbelehrung', 'Versand'][i] + '</a>';
      }).join('') + '</div></div>';
    var colNl = '<div class="nl"><div style="font:700 15px/1.3 Lato,sans-serif;color:#fff">Verpasse keine Angebote!</div>' +
      '<p style="margin-top:8px">Jetzt für Newsletter anmelden und profitieren.</p>' +
      '<label class="flabel" style="color:#fff;margin-top:14px">E-Mail<span class="req">*</span></label>' +
      '<input type="email" aria-label="E-Mail"><button class="btn btn-p btn-full" style="margin-top:12px" data-nl>Senden</button></div>';

    b.innerHTML = '<footer class="ftr"><div class="wrap"><div class="cols">' +
      (MOB ? colBrand + colNl + '<div class="two">' + colSeiten + colRecht + '</div>' : colBrand + colSeiten + colRecht + colNl) +
      '</div><div class="btm">© RIMIFY 2026</div></div></footer>' +
      (MOB && PAGE.indexOf('admin') !== 0 ? bnavHTML() : '');

    var nl = $('[data-nl]'); if (nl) nl.addEventListener('click', function () { toast('Danke – du bist angemeldet.'); });
    wireBnav();
  }

  function bnavHTML() {
    var n = cartCount();
    var items = [
      ['Start', 'home', 'startseite.html', 'startseite'],
      ['Felgen', 'wheel', felgenHref(), 'felgen'],
      ['RIMIFY-CHECK', 'check', 'rimify-check.html', 'rimify-check'],
      ['Kontakt', 'mail', 'kontakt.html', 'kontakt'],
      ['Warenkorb', 'cart', 'warenkorb.html', 'warenkorb']
    ];
    return '<nav class="bnav" aria-label="Hauptnavigation">' + items.map(function (it, i) {
      var cur = it[3] === PAGE || (it[3] === 'felgen' && (PAGE === 'produkt' || PAGE === 'felgen-suchen'));
      if (i === 2) return '<div class="mid"><button class="fab" data-go="' + it[2] + '" aria-label="RIMIFY-CHECK">' + A.icon('check', 26) + '</button><span>RIMIFY-CHECK</span></div>';
      return '<button data-go="' + it[2] + '"' + (cur ? ' aria-current="page"' : '') + '>' + A.icon(it[1], 22) + '<span>' + it[0] + '</span>' +
        (i === 4 && n ? '<span class="badge" style="top:2px;right:18px">' + n + '</span>' : '') + '</button>';
    }).join('') + '</nav>';
  }
  function wireBnav() {
    $$('[data-go]').forEach(function (b) { b.addEventListener('click', function () { location.href = b.getAttribute('data-go'); }); });
  }

  function openMenuSheet() {
    var links = [['Start', 'startseite.html'], ['Felgen suchen', felgenHref()], ['RIMIFY-CHECK', 'rimify-check.html'],
    ['FAQ', 'faq.html'], ['Kontakt', 'kontakt.html'], ['Warenkorb', 'warenkorb.html']];
    sheet('Menü', links.map(function (l) {
      return '<a href="' + l[1] + '" style="display:flex;align-items:center;justify-content:space-between;padding:16px 4px;min-height:56px;border-bottom:1px solid var(--line-s);color:var(--ink);font:700 16px/1 Lato,sans-serif">' +
        esc(l[0]) + A.icon('chevron-right', 20) + '</a>';
    }).join(''), '');
  }

  /* ── overlays ──────────────────────────────────────── */
  var _scrim, _sheet, _lastFocus;
  function ensureScrim() {
    if (_scrim) return _scrim;
    _scrim = d.createElement('div'); _scrim.className = 'scrim';
    _scrim.addEventListener('click', closeAll);
    d.body.appendChild(_scrim); return _scrim;
  }
  function sheet(title, body, footer) {
    closeAll(); _lastFocus = d.activeElement;
    ensureScrim().classList.add('on');
    _sheet = d.createElement('div'); _sheet.className = 'sheet'; _sheet.setAttribute('role', 'dialog'); _sheet.setAttribute('aria-modal', 'true');
    _sheet.innerHTML = '<header><strong style="font:700 16px/1 Lato,sans-serif">' + esc(title) + '</strong>' +
      '<button data-close aria-label="Schließen" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center">' + A.icon('close', 22) + '</button></header>' +
      '<div class="sbody">' + body + '</div>' + (footer ? '<footer>' + footer + '</footer>' : '');
    d.body.appendChild(_sheet);
    requestAnimationFrame(function () { _sheet.classList.add('on'); });
    _sheet.querySelector('[data-close]').addEventListener('click', closeAll);
    return _sheet;
  }
  function closeAll() {
    if (_sheet) { _sheet.classList.remove('on'); var s = _sheet; setTimeout(function () { s.remove(); }, 260); _sheet = null; }
    if (_scrim) _scrim.classList.remove('on');
    if (_lastFocus && _lastFocus.focus) _lastFocus.focus();
  }
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });

  var _toastEl;
  function toast(msg) {
    if (!_toastEl) { _toastEl = d.createElement('div'); _toastEl.className = 'toast'; d.body.appendChild(_toastEl); }
    _toastEl.innerHTML = A.checkGlyph(18, '#2E8B22') + '<span>' + esc(msg) + '</span>';
    _toastEl.classList.add('on');
    clearTimeout(_toastEl._t); _toastEl._t = setTimeout(function () { _toastEl.classList.remove('on'); }, 2600);
  }

  /* ── cart ──────────────────────────────────────────── */
  function addToCart(line) {
    var c = S.cart(), hit = null;
    c.forEach(function (l) { if (l.sku === line.sku && l.size === line.size) hit = l; });
    if (hit) hit.qty += line.qty; else c.push(line);
    S.cart(c); renderChrome(); renderFooter(); toast('In den Warenkorb gelegt.');
  }

  /* ── shared renderers ──────────────────────────────── */
  function stockPill(stock) {
    return stock === 'out'
      ? '<span class="pill pill-danger"><span class="dot" style="background:#B01018"></span>ausverkauft</span>'
      : '<span class="pill pill-ok"><span class="dot" style="background:#2E8B22"></span>auf Lager</span>';
  }
  function fitMarker(wheel) {
    var v = S.vehicle();
    if (!v) return '';
    if (wheel.verdict === 'conditional') return '<div class="fit fit-warn"><span class="dot" style="background:#9A6400"></span>Mit Auflagen für ' + esc(v.short) + '</div>';
    return '<div class="fit fit-ok">' + A.checkGlyph(16) + 'Passend für ' + esc(v.short) + '</div>';
  }
  function wheelArt(wheel, tyre) {
    var svg = A.wheelSVG({ spokes: wheel.spokes, finish: wheel.finish, cap: wheel.brand.charAt(0), tyre: !!tyre });
    var h = 0, s = String(wheel.sku);
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
    var tint = {
      black: 'grayscale(1) brightness(.60) contrast(1.18)',
      graphite: 'grayscale(1) brightness(.86) contrast(1.06)',
      silver: 'grayscale(1) brightness(1.16) contrast(.96)',
      polished: 'grayscale(1) brightness(1.28) contrast(1.02)',
      bronze: 'sepia(.9) saturate(1.6) brightness(.92) hue-rotate(-10deg)'
    }[wheel.finish] || '';
    return A.photo(A.PHOTO.wheels[h % A.PHOTO.wheels.length], wheel.brand + ' ' + wheel.model,
      svg, 'center', '11%', tint);
  }

  function productCard(wheel) {
    var sel = wheel.sizes.filter(function (s) { return wheel.blocked.indexOf(s) < 0; })[0];
    return '<article class="pcard" data-sku="' + wheel.sku + '">' +
      '<a href="produkt.html?sku=' + wheel.sku + '" style="text-decoration:none;color:inherit">' +
      '<div class="well"><div class="art">' + wheelArt(wheel) + '</div><div class="stock">' + stockPill(wheel.stock) + '</div></div></a>' +
      '<div class="micro brand">' + esc(wheel.brand) + '</div>' +
      '<div class="model"><a href="produkt.html?sku=' + wheel.sku + '" style="color:inherit;text-decoration:none">' + esc(wheel.model) + '</a></div>' +
      '<div class="fin">' + esc(wheel.finishName) + '</div>' +
      '<div class="rate"><span class="star">★</span><strong style="font:700 13px/1 Lato,sans-serif">' + R.dec(wheel.rating, 1) + '</strong>' +
      '<span class="ink3" style="font-size:13px">(' + wheel.reviews + ')</span></div>' +
      '<div class="micro" style="margin-top:18px">Verfügbare Größen</div>' +
      '<div class="chips" style="margin-top:10px">' + wheel.sizes.map(function (s) {
        var off = wheel.blocked.indexOf(s) >= 0;
        return '<button class="chip"' + (off ? ' disabled title="Für Ihr Fahrzeug nicht freigegeben."' : '') +
          ' aria-pressed="' + (s === sel) + '" data-size="' + s + '">' + s + '</button>';
      }).join('') + '</div>' +
      '<div class="hr-inset" style="margin:20px -20px 0;transform:scaleX(.82)"></div>' +
      '<div class="micro" style="margin-top:18px">ab UVP</div>' +
      '<div class="price">' + eur(wheel.price) + '</div>' +
      '<div class="ink3" style="font:400 12px/1 Lato,sans-serif;margin-top:4px">für 4 Felgen</div>' +
      '<div style="flex:1;min-height:16px"></div>' + fitMarker(wheel) +
      '<a class="btn btn-p btn-full" style="margin-top:12px" href="produkt.html?sku=' + wheel.sku + '">Kompatibilität prüfen</a>' +
      '</article>';
  }
  function wireCards(root) {
    $$('.pcard .chip', root).forEach(function (c) {
      c.addEventListener('click', function () {
        $$('.chip', c.parentNode).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        c.setAttribute('aria-pressed', 'true');
      });
    });
  }

  function accordion(items, openFirst) {
    return '<div class="accs">' + items.map(function (it, i) {
      return '<div class="acc' + (openFirst && i === 0 ? ' open' : '') + '" data-q="' + esc(it.q.toLowerCase()) + '">' +
        '<button aria-expanded="' + (openFirst && i === 0) + '"><span>' + esc(it.q) + '</span>' + A.icon('chevron-down', 18) + '</button>' +
        '<div class="body"><div><p>' + esc(it.a) + '</p></div></div></div>';
    }).join('') + '</div>';
  }
  function wireAccordion(root) {
    $$('.acc > button', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var acc = b.parentNode, open = acc.classList.contains('open');
        $$('.acc', acc.parentNode).forEach(function (a) { a.classList.remove('open'); $('button', a).setAttribute('aria-expanded', 'false'); });
        if (!open) { acc.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
      });
    });
  }

  function contactRows() {
    return '<div style="display:flex;flex-direction:column;gap:16px">' +
      '<div class="row"><span class="bl" style="display:flex">' + A.icon('phone', 20) + '</span><div>' +
      '<div style="font:700 15px/1.2 Lato,sans-serif;font-variant-numeric:tabular-nums">+49 211 1234567</div>' +
      '<div class="ink3" style="font:400 12px/1 Lato,sans-serif;margin-top:3px">Mo–Fr 9:00–18:00 Uhr</div></div></div>' +
      '<div class="row"><span class="bl" style="display:flex">' + A.icon('whatsapp', 20) + '</span><div>' +
      '<div style="font:700 15px/1.2 Lato,sans-serif;font-variant-numeric:tabular-nums">+49 176 4777777</div>' +
      '<div class="ink3" style="font:400 12px/1 Lato,sans-serif;margin-top:3px">WhatsApp</div></div></div></div>';
  }

  /* ── vehicle selector (guided + key numbers) ───────── */
  function selector(el, opt) {
    opt = opt || {};
    var st = { step: 'make', make: null, model: null, variant: null, q: '', cands: null, err: null };
    var preset = qs('marke');
    if (preset) { var m = R.makes.filter(function (x) { return x.name.toLowerCase() === preset.toLowerCase(); })[0]; if (m) { st.make = m; st.step = 'model'; } }

    function rowsHTML() {
      var rows = [], back = '';
      if (st.step === 'make') {
        rows = R.makes.filter(function (m) { return m.name.toLowerCase().indexOf(st.q.toLowerCase()) >= 0; })
          .map(function (m) { return { k: m.name, t: m.name, sub: m.models.length + ' Modelle', o: m }; });
      } else if (st.step === 'model') {
        back = st.make.name;
        rows = st.make.models.filter(function (m) { return m.name.toLowerCase().indexOf(st.q.toLowerCase()) >= 0; })
          .map(function (m) { return { k: m.name, t: m.name, sub: m.variants.length + ' Varianten', o: m }; });
      } else {
        back = st.make.name + ' › ' + st.model.name;
        rows = st.model.variants.map(function (v) { return { k: v.name, t: v.name, sub: v.years + ' · ' + v.kw + ' kW (' + v.ps + ' PS)', o: v }; });
      }
      var list = rows.length ? rows.map(function (r) {
        var on = st.variant && st.variant.name === r.k;
        return '<button class="selrow" data-k="' + esc(r.k) + '" style="display:flex;align-items:center;gap:12px;width:100%;min-height:' + (opt.rowH || 52) + 'px;padding:0 14px;border-radius:8px;text-align:left;' +
          'background:' + (on ? 'var(--wash)' : 'var(--row)') + ';' + (on ? 'box-shadow:inset 2px 0 0 var(--blue);' : '') + 'transition:background var(--e1)">' +
          '<span style="width:28px;height:28px;border-radius:999px;background:#fff;border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font:700 11px/1 Lato,sans-serif;color:var(--ink2);flex:none">' +
          esc(r.t.slice(0, 2).toUpperCase()) + '</span><span style="flex:1;min-width:0"><span style="display:block;font:400 15px/1.2 Lato,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(r.t) + '</span>' +
          '<span class="ink3" style="font:400 12px/1.2 Lato,sans-serif">' + esc(r.sub) + '</span></span>' +
          (on ? '<span class="bl" style="display:flex">' + A.icon('check', 18) + '</span>' : '') + '</button>';
      }).join('') : '<div class="ink3" style="padding:18px 4px;font-size:14px">Keine Treffer.</div>';

      return (back ? '<button data-back style="display:flex;align-items:center;gap:6px;font:700 13px/1 Lato,sans-serif;color:var(--blue);min-height:44px">' +
        A.icon('chevron-left', 16) + esc(back) + '</button>' : '') +
        '<div class="sellist" style="display:flex;flex-direction:column;gap:6px;max-height:' + (opt.listH || 226) + 'px;overflow-y:auto;animation:slideIn .18s cubic-bezier(.2,.8,.2,1)">' + list + '</div>';
    }

    function candHTML() {
      return '<div style="margin-top:14px"><div style="font:700 15px/1.4 Lato,sans-serif">Zu dieser Schlüsselnummer gibt es mehrere Varianten.</div>' +
        '<div class="ink2" style="font:400 13px/1.5 Lato,sans-serif;margin-top:4px">Bitte bestätige deine Variante – Bauzeitraum und Höchstgeschwindigkeit entscheiden über die zulässigen Reifen.</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">' + st.cands.map(function (c, i) {
          return '<button class="candrow" data-i="' + i + '" style="display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:72px;padding:12px 16px;' +
            'background:#fff;border:1px solid var(--line);border-radius:8px;text-align:left;transition:background var(--e1)">' +
            '<span><span style="display:block;font:700 15px/1.3 Lato,sans-serif">' + esc(c.variant) + '</span>' +
            '<span class="mono ink2" style="display:block;margin-top:4px">' + esc(c.years) + ' · ' + c.kw + ' kW (' + c.ps + ' PS) · ' + esc(c.body) + ' · ' + c.vmax + ' km/h</span></span>' +
            '<span class="ink3" style="display:flex">' + A.icon('chevron-right', 20) + '</span></button>';
        }).join('') + '</div></div>';
    }

    function errHTML() {
      return '<div style="margin-top:14px;background:var(--warn-w);border-radius:10px;padding:16px">' +
        '<div style="display:flex;gap:10px;color:var(--warn)">' + A.icon('warning', 20) +
        '<strong style="font:700 14px/1.4 Lato,sans-serif">Zu dieser Kombination haben wir kein Fahrzeug gefunden.</strong></div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' +
        '<button class="btn btn-s" data-doc style="height:44px">Schlüsselnummern prüfen</button>' +
        '<button class="btn btn-s" data-guided style="height:44px">Stattdessen Marke wählen</button>' +
        '<button class="btn btn-q" data-send style="height:44px">Daten an RIMIFY senden</button></div></div>';
    }

    function paint() {
      var ready = !!st.variant;
      el.innerHTML =
        '<div data-part="guided">' +
        '<div style="font:700 ' + (opt.compact ? 13 : 15) + 'px/1 Lato,sans-serif;color:var(--ink2)">Wähle dein Auto</div>' +
        '<div class="ffield" style="margin-top:10px"><span class="ic l">' + A.icon('search', 18) + '</span>' +
        '<input class="field pl" data-q placeholder="Suche" value="' + esc(st.q) + '" aria-label="Marke suchen"></div>' +
        '<div data-rows style="margin-top:14px;position:relative">' + rowsHTML() + '</div>' +
        '<button class="btn btn-p btn-full" data-choose style="margin-top:16px"' + (ready ? '' : ' disabled') + '>Fahrzeug wählen</button>' +
        '</div>' +
        (opt.split ? '' :
          '<div class="hr-s" style="margin:20px 0"></div>' +
          '<div class="row" style="gap:8px"><span class="ink2" style="font:400 13px/1.3 Lato,sans-serif">Oder ganz einfach mit Fahrzeugschein</span>' +
          '<button data-doc class="qmark" aria-label="Wo finde ich HSN und TSN?">?</button></div>' +
          keyHTML());
      wire();
    }

    function keyHTML() {
      return '<div data-part="keys">' +
        '<div style="display:flex;gap:10px;margin-top:12px">' +
        '<input class="field field-mono" data-hsn maxlength="4" inputmode="numeric" placeholder="HSN" aria-label="HSN" style="flex:1;min-width:0' + (opt.tall ? ';height:56px;font-size:18px' : '') + '">' +
        '<input class="field field-mono" data-tsn maxlength="3" placeholder="TSN" aria-label="TSN" style="flex:1;min-width:0' + (opt.tall ? ';height:56px;font-size:18px' : '') + '">' +
        '<button class="btn btn-p" data-lookup style="width:' + (opt.tall ? 56 : 48) + 'px;height:' + (opt.tall ? 56 : 48) + 'px;padding:0;flex:none" aria-label="Fahrzeug suchen">' + A.icon('arrow-right', 18) + '</button></div>' +
        '<div data-res>' + (st.cands ? candHTML() : (st.err ? errHTML() : '')) + '</div></div>';
    }

    function commit(v) {
      S.vehicle(v); S.seenPLP('1');
      location.href = 'felgen.html';
    }

    function wire() {
      var q = $('[data-q]', el);
      if (q) q.addEventListener('input', function () { st.q = q.value; repaintRows(); });
      var back = $('[data-back]', el);
      if (back) back.addEventListener('click', function () {
        if (st.step === 'variant') { st.step = 'model'; st.model = null; } else { st.step = 'make'; st.make = null; }
        st.variant = null; st.q = ''; paint();
      });
      $$('.selrow', el).forEach(function (b) {
        b.addEventListener('mouseenter', function () { if (b.style.background.indexOf('233') < 0) b.style.background = 'var(--wash)'; });
        b.addEventListener('mouseleave', function () { paintRowBg(); });
        b.addEventListener('click', function () {
          var k = b.getAttribute('data-k');
          if (st.step === 'make') { st.make = R.makes.filter(function (m) { return m.name === k; })[0]; st.step = 'model'; st.q = ''; }
          else if (st.step === 'model') { st.model = st.make.models.filter(function (m) { return m.name === k; })[0]; st.step = 'variant'; st.q = ''; }
          else { st.variant = st.model.variants.filter(function (v) { return v.name === k; })[0]; }
          paint();
        });
      });
      var ch = $('[data-choose]', el);
      if (ch) ch.addEventListener('click', function () {
        if (!st.variant) return;
        var v = st.variant;
        commit({
          id: st.make.name + '-' + st.model.name + '-' + v.name, make: st.make.name, model: st.model.name,
          variant: v.name, label: st.make.name + ' ' + st.model.name + ' ' + (v.years.split('–')[0] || ''),
          short: st.make.name + ' ' + st.model.name, hsn: v.hsn || '', tsn: v.tsn || '', years: v.years
        });
      });
      var hsn = $('[data-hsn]', el), tsn = $('[data-tsn]', el);
      if (hsn) hsn.addEventListener('input', function () {
        hsn.value = hsn.value.toUpperCase().replace(/\s/g, '');
        if (hsn.value.length === 4 && tsn) tsn.focus();
      });
      if (tsn) tsn.addEventListener('input', function () { tsn.value = tsn.value.toUpperCase().replace(/\s/g, ''); });
      var lk = $('[data-lookup]', el);
      if (lk) lk.addEventListener('click', doLookup);
      if (tsn) tsn.addEventListener('keydown', function (e) { if (e.key === 'Enter') doLookup(); });
      $$('[data-doc]', el).forEach(function (b) { b.addEventListener('click', openDocHelp); });
      var g = $('[data-guided]', el); if (g) g.addEventListener('click', function () { st.err = null; st.cands = null; paint(); });
      var sd = $('[data-send]', el); if (sd) sd.addEventListener('click', function () { toast('Danke – wir melden uns.'); });
      $$('.candrow', el).forEach(function (b) {
        b.addEventListener('click', function () {
          var c = st.cands[+b.getAttribute('data-i')];
          commit({ id: c.id, make: c.make, model: c.model, variant: c.variant, label: c.label, short: c.short, hsn: c.hsn, tsn: c.tsn, years: c.years });
        });
      });
    }
    function paintRowBg() {
      $$('.selrow', el).forEach(function (x) {
        var on = x.getAttribute('data-k') === (st.variant && st.variant.name);
        x.style.background = on ? 'var(--wash)' : 'var(--row)';
      });
    }
    function repaintRows() { var r = $('[data-rows]', el); if (r) { r.innerHTML = rowsHTML(); wire(); } }
    function doLookup() {
      var h = ($('[data-hsn]', el) || {}).value || '', t = ($('[data-tsn]', el) || {}).value || '';
      var res = R.lookup(h, t);
      st.err = null; st.cands = null;
      if (res.length === 1) return commit(res[0]);
      if (res.length > 1) st.cands = res; else st.err = true;
      var r = $('[data-res]', el); if (r) { r.innerHTML = st.cands ? candHTML() : errHTML(); wire(); }
    }

    paint();
    return { keyHTML: keyHTML, doLookup: doLookup, repaint: paint };
  }

  function openDocHelp() {
    var body = '<div class="seg" style="margin-bottom:16px"><button data-v="neu" aria-pressed="true">Neuer Fahrzeugschein</button>' +
      '<button data-v="alt" aria-pressed="false">Alter Fahrzeugschein</button></div><div data-docart>' + A.docSVG('neu') + '</div>' +
      '<p class="ink2" style="font:400 14px/1.6 Lato,sans-serif;margin-top:14px">In der Zulassungsbescheinigung Teil I stehen sie in den Feldern 2.1 (HSN, vierstellig) und 2.2 (TSN, dreistellig).</p>';
    var s = sheet('Wo finde ich HSN und TSN?', body, '');
    $$('[data-v]', s).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[data-v]', s).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        $('[data-docart]', s).innerHTML = A.docSVG(b.getAttribute('data-v'));
      });
    });
  }

  /* ── boot ──────────────────────────────────────────── */
  function boot() {
    renderChrome(); renderFooter();
    if (w.PAGES && w.PAGES[PAGE]) { try { w.PAGES[PAGE](MOB); } catch (e) { console.error(e); } }
    wireBnav();
  }

  w.APP = {
    S: S, PAGE: PAGE, MOB: MOB, esc: esc, eur: eur, qs: qs, $: $, $$: $$, mount: mount,
    toast: toast, sheet: sheet, closeAll: closeAll, addToCart: addToCart, cartCount: cartCount,
    productCard: productCard, wireCards: wireCards, accordion: accordion, wireAccordion: wireAccordion,
    stockPill: stockPill, fitMarker: fitMarker, wheelArt: wheelArt, contactRows: contactRows,
    selector: selector, openDocHelp: openDocHelp, vehicleLabel: vehicleLabel, felgenHref: felgenHref,
    renderChrome: renderChrome, renderFooter: renderFooter, boot: boot
  };

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})(window, document);
