/* RIMIFY — pages part 2: check, cart, checkout, confirmation, faq, contact, legal, 404 */
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
  var PAGES = w.PAGES;

  /* ── RIMIFY-CHECK ────────────────────────────────────── */
  var chk = { step: 1, vehicle: null, wheel: null, size: 18, q: '' };

  function verdictOf() {
    if (!chk.wheel) return 'none';
    if (chk.wheel.stock === 'out' && chk.size === 20) return 'no';
    if (chk.wheel.verdict === 'conditional') return 'warn';
    if (chk.wheel.blocked.indexOf(chk.size) >= 0) return 'no';
    if (chk.wheel.sku === 'YID-GRP-POL') return 'unknown';
    return 'ok';
  }
  function verdictBlock(kind, veh, wh, size) {
    var conf = {
      ok: { bg: 'var(--ok-w)', bd: 'var(--ok)', col: 'var(--ok)', ic: 'check', label: 'FREIGEGEBEN', h: 'Freigegeben für ' + veh },
      warn: { bg: 'var(--warn-w)', bd: 'transparent', col: 'var(--warn)', ic: 'warning', label: 'MIT AUFLAGEN', h: 'Freigegeben mit Auflagen' },
      no: { bg: 'var(--danger-w)', bd: 'transparent', col: 'var(--danger)', ic: 'close', label: 'NICHT FREIGEGEBEN', h: 'Nicht freigegeben für ' + veh },
      unknown: { bg: 'var(--ground)', bd: 'transparent', col: 'var(--ink2)', ic: 'info', label: 'KEINE ANGABE', h: 'Für diese Kombination liegt uns kein Gutachten vor.' }
    }[kind];
    var rows = [
      ['Gutachten', kind === 'unknown' ? '—' : 'ABE 47231-' + (wh ? wh.sku.slice(-3) : '000')],
      ['Eintragung', kind === 'ok' ? 'Nicht erforderlich' : kind === 'warn' ? 'Erforderlich' : '—'],
      ['Reifengrößen', kind === 'unknown' ? '—' : '245/45 R' + size + ' 92Y · 235/40 R' + size + ' 92Y']
    ];
    var html = '<div style="background:' + conf.bg + ';border:1px solid ' + conf.bd + ';border-radius:18px;padding:' + (MOB ? '20px' : '32px') + '">' +
      '<div class="row" style="align-items:flex-start;gap:14px"><span style="color:' + conf.col + ';display:flex">' + A.icon(conf.ic, 32) + '</span>' +
      '<div><div class="micro" style="color:' + conf.col + '">' + conf.label + '</div>' +
      '<h3 class="h2" style="font-size:' + (MOB ? 22 : 28) + 'px;margin-top:6px">' + esc(conf.h) + '</h3>' +
      (wh ? '<div class="mono ink2" style="margin-top:6px">' + esc(wh.brand + ' ' + wh.model) + ' · 8,5J × ' + size + ' · ET ' + wh.et + ' · 5/112</div>' : '') +
      '</div></div>';
    if (kind === 'warn' && wh) {
      html += '<ul style="margin-top:18px;display:flex;flex-direction:column;gap:10px">' + wh.conditions.map(function (c) {
        return '<li class="row" style="align-items:flex-start;gap:10px"><span class="dot" style="background:var(--warn);margin-top:8px"></span>' +
          '<span style="font:400 15px/1.55 Lato,sans-serif">' + esc(c) + '</span></li>';
      }).join('') + '</ul>';
    }
    if (kind !== 'unknown') {
      html += '<div style="margin-top:20px;display:grid;grid-template-columns:' + (MOB ? '1fr' : 'repeat(3,1fr)') + ';gap:16px">' +
        rows.map(function (r) {
          return '<div><div class="micro">' + esc(r[0]) + '</div><div class="mono" style="margin-top:6px;font-size:14px">' + esc(r[1]) + '</div></div>';
        }).join('') + '</div>';
    }
    if (kind === 'no') {
      html += '<div style="margin-top:24px;background:#fff;border-radius:14px;padding:20px">' +
        '<div class="micro">Freigegebene Alternativen in ' + size + " Zoll</div>" +
        '<div style="display:grid;grid-template-columns:' + (MOB ? '1fr' : 'repeat(3,1fr)') + ';gap:12px;margin-top:12px">' +
        R.wheels.filter(function (x) { return x.verdict === 'ok' && x.stock !== 'out'; }).slice(0, 3).map(function (x) {
          return '<a href="produkt.html?sku=' + x.sku + '" style="display:flex;gap:12px;align-items:center;padding:10px;border-radius:10px;background:var(--ground);text-decoration:none;color:inherit">' +
            '<span style="width:56px;height:56px;flex:none">' + A.wheelSVG({ spokes: x.spokes, finish: x.finish, cap: x.brand.charAt(0), shadow: false }) + '</span>' +
            '<span><span class="micro" style="display:block">' + esc(x.brand) + '</span>' +
            '<span style="display:block;font:700 14px/1.2 Lato,sans-serif;margin-top:4px">' + esc(x.model) + '</span>' +
            '<span class="mono ink3" style="display:block;margin-top:2px">ab ' + eur(x.price) + '</span></span></a>';
        }).join('') + '</div></div>';
    }
    html += '<div class="row" style="margin-top:24px;flex-wrap:wrap;gap:12px">' +
      (kind === 'unknown'
        ? '<button class="btn btn-p" data-anfrage>Anfrage senden</button>'
        : '<a class="btn btn-p" href="produkt.html' + (wh ? '?sku=' + wh.sku : '') + '">Zur Felge</a>' +
        '<button class="btn btn-s">' + A.icon('document', 18) + 'Gutachten als PDF</button>' +
        '<button class="btn btn-q" data-share>' + A.icon('share', 18) + 'Ergebnis teilen</button>') +
      '</div></div>';
    return html;
  }

  function renderCheck() {
    var v = P().S.vehicle();
    if (v && !chk.vehicle) chk.vehicle = v;
    var s1 = m('chk-step1'), s2 = m('chk-step2'), res = m('chk-result');
    if (s1) {
      s1.innerHTML = chk.vehicle
        ? '<div class="row" style="justify-content:space-between"><div class="row">' + A.checkGlyph(20) +
        '<div><div class="micro">Fahrzeug</div><div style="font:700 15px/1.3 Lato,sans-serif;margin-top:4px">' + esc(chk.vehicle.label) + '</div></div></div>' +
        '<button class="btn btn-q" data-chg style="height:44px">Ändern</button></div>'
        : '<div data-sel></div>';
      if (!chk.vehicle) P().selector($('[data-sel]', s1), { listH: 240, rowH: 52 });
    }
    if (s2) {
      var list = R.wheels.filter(function (x) { return (x.brand + ' ' + x.model).toLowerCase().indexOf(chk.q.toLowerCase()) >= 0; });
      s2.innerHTML = !chk.vehicle
        ? '<div class="ink3" style="font:400 14px/1.5 Lato,sans-serif">Wähle zuerst dein Fahrzeug.</div>'
        : (chk.wheel
          ? '<div class="row" style="justify-content:space-between"><div class="row"><span style="width:44px;height:44px;flex:none">' +
          A.wheelSVG({ spokes: chk.wheel.spokes, finish: chk.wheel.finish, cap: chk.wheel.brand.charAt(0), shadow: false }) + '</span>' +
          '<div><div class="micro">Felge</div><div style="font:700 15px/1.3 Lato,sans-serif;margin-top:4px">' + esc(chk.wheel.brand + ' ' + chk.wheel.model) + '</div></div></div>' +
          '<button class="btn btn-q" data-chgw style="height:44px">Ändern</button></div>' +
          '<div class="micro" style="margin-top:18px">Größe</div><div class="chips" style="margin-top:10px">' +
          chk.wheel.sizes.map(function (z) { return '<button class="chip" data-cs="' + z + '" aria-pressed="' + (z === chk.size) + '">' + z + '</button>'; }).join('') + '</div>'
          : '<div class="ffield"><span class="ic l">' + A.icon('search', 18) + '</span>' +
          '<input class="field pl" data-wq placeholder="Felge suchen" value="' + esc(chk.q) + '"></div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;margin-top:12px;max-height:280px;overflow:auto">' +
          list.map(function (x) {
            return '<button data-wsel="' + x.sku + '" style="display:flex;align-items:center;gap:12px;min-height:56px;padding:6px 12px;border-radius:8px;background:var(--row);text-align:left">' +
              '<span style="width:40px;height:40px;flex:none">' + A.wheelSVG({ spokes: x.spokes, finish: x.finish, cap: x.brand.charAt(0), shadow: false }) + '</span>' +
              '<span><span class="micro" style="display:block">' + esc(x.brand) + '</span>' +
              '<span style="display:block;font:700 14px/1.2 Lato,sans-serif;margin-top:3px">' + esc(x.model) + ' · ' + esc(x.finishName) + '</span></span></button>';
          }).join('') + '</div>');
    }
    if (res) res.innerHTML = (chk.vehicle && chk.wheel)
      ? verdictBlock(verdictOf(), chk.vehicle.short, chk.wheel, chk.size)
      : '<div class="ink3" style="text-align:center;font:400 15px/1.5 Lato,sans-serif;padding:32px 0">Das Ergebnis erscheint, sobald Fahrzeug und Felge gewählt sind.</div>';

    var ch = $('[data-chg]'); if (ch) ch.addEventListener('click', function () { chk.vehicle = null; renderCheck(); });
    var cw = $('[data-chgw]'); if (cw) cw.addEventListener('click', function () { chk.wheel = null; renderCheck(); });
    var wq = $('[data-wq]'); if (wq) wq.addEventListener('input', function () { chk.q = wq.value; renderCheck(); $('[data-wq]').focus(); });
    $$('[data-wsel]').forEach(function (b) {
      b.addEventListener('click', function () {
        chk.wheel = R.wheels.filter(function (x) { return x.sku === b.getAttribute('data-wsel'); })[0];
        chk.size = chk.wheel.sizes[0]; renderCheck();
      });
    });
    $$('[data-cs]').forEach(function (b) { b.addEventListener('click', function () { chk.size = +b.getAttribute('data-cs'); renderCheck(); }); });
    var sh = $('[data-share]'); if (sh) sh.addEventListener('click', function () { P().toast('Link kopiert.'); });
    var an = $('[data-anfrage]'); if (an) an.addEventListener('click', function () { P().toast('Anfrage gesendet.'); });
  }
  PAGES['rimify-check'] = function () { PAGES._fillAll(); renderCheck(); };

  PAGES['check-ergebnis'] = function () {
    PAGES._fillAll();
    var v = P().S.vehicle(), wh = R.wheels[0];
    var res = m('erg-result');
    if (res) res.innerHTML = verdictBlock('ok', v ? v.short : 'BMW 3er Coupe', wh, 18);
    var meta = m('erg-meta');
    if (meta) meta.innerHTML = '<div class="micro">Geprüft am 19.09.2026</div>' +
      '<div class="mono ink2" style="margin-top:6px">Dokument ABE 47231-HAV · Revision 2 · SHA 9f2c…a41</div>';
    var sh = $('[data-share]'); if (sh) sh.addEventListener('click', function () { P().toast('Link kopiert.'); });
    var pr = $('[data-print]'); if (pr) pr.addEventListener('click', function () { w.print(); });
  };

  /* ── WARENKORB ───────────────────────────────────────── */
  var SHIP = { dhl: { t: 'Standard DHL', p: 25 }, express: { t: 'Express', p: 39 } };
  function seedCart() {
    if (P().S.cart().length || sessionStorage.getItem('rmf_seeded')) return;
    try { sessionStorage.setItem('rmf_seeded', '1'); } catch (e) { }
    P().S.cart([
      { sku: 'BOR-HAV-GRM', name: 'Borbet HAVANNA', finish: 'Grau', size: '8,5 x 18', qty: 4, price: 250, kind: 'felge', entry: false },
      { sku: 'BRI-SOM-225', name: 'Bridgestone', finish: 'Sommer', size: '225 / 35 R18', qty: 4, price: 100, kind: 'reifen', entry: true }
    ]);
  }
  function cartTotals() {
    var c = P().S.cart(), o = P().S.opts();
    var sum = c.reduce(function (a, l) { return a + l.price * l.qty; }, 0);
    var ship = c.length ? SHIP[o.versand].p : 0;
    return { sum: sum, ship: ship, total: sum + ship };
  }
  function lineArt(l) {
    if (l.kind === 'reifen') return A.tyreSVG({ label: l.size });
    var wh = R.wheels.filter(function (x) { return x.sku === l.sku; })[0] || R.wheels[0];
    return A.wheelSVG({ spokes: wh.spokes, finish: wh.finish, cap: wh.brand.charAt(0), shadow: false, tyre: l.kind === 'komplettrad' });
  }
  function renderCart() {
    var c = P().S.cart(), v = P().S.vehicle(), body = m('cart-lines'), t = cartTotals();
    if (body) {
      if (!c.length) {
        body.innerHTML = '<div style="text-align:center;padding:56px 20px">' +
          '<div style="opacity:.25;display:flex;justify-content:center">' + A.icon('cart', 56) + '</div>' +
          '<h3 class="h3" style="margin-top:16px">Dein Warenkorb ist noch leer.</h3>' +
          '<a class="btn btn-p" style="margin-top:20px" href="felgen.html">Felgen' + (v ? ' für ' + esc(v.short) : '') + ' ansehen</a></div>';
      } else if (MOB) {
        body.innerHTML = c.map(function (l, i) {
          return '<div class="card raised" style="padding:16px;margin-bottom:12px">' +
            '<div class="row" style="align-items:flex-start"><span style="width:72px;height:72px;flex:none;border-radius:8px;background:linear-gradient(#fff,#FAFBFE);padding:4px">' + lineArt(l) + '</span>' +
            '<div class="grow"><div class="row" style="gap:6px"><strong style="font:700 16px/1.2 Lato,sans-serif">' + esc(l.name) + '</strong>' + A.checkGlyph(16) + '</div>' +
            '<div class="ink2" style="font:400 13px/1.5 Lato,sans-serif">' + esc(l.finish) + '</div>' +
            '<div class="mono ink2">' + esc(l.size) + '</div>' +
            (v ? '<div class="ink3" style="font:400 12px/1.4 Lato,sans-serif;margin-top:4px">Passend für ' + esc(v.short) + '</div>' : '') +
            (l.entry ? '<div class="row" style="gap:6px;margin-top:4px"><span class="dot" style="background:var(--warn)"></span><span style="font:700 12px/1.3 Lato,sans-serif;color:var(--warn)">Eintragung erforderlich</span></div>' : '') +
            '</div><button data-del="' + i + '" class="ink3" aria-label="Entfernen" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center">' + A.icon('trash', 20) + '</button></div>' +
            '<div class="hr-s" style="margin:14px 0"></div>' +
            '<div class="row" style="justify-content:space-between"><span class="micro">Anzahl</span><span class="step"><button data-qm="' + i + '">' + A.icon('minus', 16) + '</button><input value="' + l.qty + '" readonly><button data-qp="' + i + '">' + A.icon('plus', 16) + '</button></span></div>' +
            '<div class="row" style="justify-content:space-between;margin-top:10px"><span class="micro">Preis</span><span class="mono">' + eur(l.price) + '</span></div>' +
            '<div class="row" style="justify-content:space-between;margin-top:8px"><span class="micro">Gesamt</span><strong class="mono" style="font-size:15px">' + eur(l.price * l.qty) + '</strong></div></div>';
        }).join('');
      } else {
        body.innerHTML = '<table class="tbl"><thead><tr><th>Produkt</th><th style="width:140px">Anzahl</th>' +
          '<th class="r" style="width:120px">Preis</th><th class="r" style="width:140px">Gesamt</th><th style="width:44px"></th></tr></thead><tbody>' +
          c.map(function (l, i) {
            return '<tr><td><div class="row" style="gap:16px"><span style="width:72px;height:72px;flex:none;border-radius:8px;background:linear-gradient(#fff,#FAFBFE);padding:4px">' + lineArt(l) + '</span>' +
              '<div><div class="row" style="gap:6px"><strong style="font:700 16px/1.2 Lato,sans-serif">' + esc(l.name) + '</strong>' + A.checkGlyph(16) + '</div>' +
              '<div class="ink2" style="font:400 13px/1.6 Lato,sans-serif">' + esc(l.finish) + '</div>' +
              '<div class="mono ink2">' + esc(l.size) + '</div>' +
              (v ? '<div class="ink3" style="font:400 12px/1.4 Lato,sans-serif;margin-top:4px">Passend für ' + esc(v.short) + '</div>' : '') +
              (l.entry ? '<div class="row" style="gap:6px;margin-top:4px"><span class="dot" style="background:var(--warn)"></span><span style="font:700 12px/1.3 Lato,sans-serif;color:var(--warn)">Eintragung erforderlich</span></div>' : '') +
              '</div></div></td>' +
              '<td><span class="step"><button data-qm="' + i + '" aria-label="weniger">' + A.icon('minus', 16) + '</button><input value="' + l.qty + '" readonly aria-label="Anzahl"><button data-qp="' + i + '" aria-label="mehr">' + A.icon('plus', 16) + '</button></span></td>' +
              '<td class="r mono">' + eur(l.price) + '</td><td class="r mono" style="font-weight:700">' + eur(l.price * l.qty) + '</td>' +
              '<td><button data-del="' + i + '" class="ink3" aria-label="Entfernen" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center">' + A.icon('trash', 20) + '</button></td></tr>';
          }).join('') + '</tbody></table>';
      }
    }
    var sum = m('cart-sum'), o = P().S.opts();
    if (sum) sum.innerHTML = '<div class="row" style="justify-content:space-between"><span class="micro">Summe:</span><span class="mono" style="font-size:15px">' + eur(t.sum) + '</span></div>' +
      '<div class="row" style="justify-content:space-between;margin-top:14px"><span style="font:400 14px/1 Lato,sans-serif">Versand</span>' +
      '<select class="field" data-ship style="width:190px;height:44px">' + Object.keys(SHIP).map(function (k) {
        return '<option value="' + k + '"' + (o.versand === k ? ' selected' : '') + '>' + SHIP[k].t + '</option>';
      }).join('') + '</select><span class="mono">' + eur(t.ship) + '</span></div>' +
      '<div class="hr" style="margin:18px 0"></div>' +
      '<div class="row" style="justify-content:space-between;align-items:flex-start"><span style="font:700 18px/1 Lato,sans-serif">Gesamt:</span>' +
      '<span style="text-align:right"><strong style="font:700 24px/1 Lato,sans-serif;font-variant-numeric:tabular-nums">' + eur(t.total) + '</strong>' +
      '<span class="ink3" style="display:block;font:400 12px/1 Lato,sans-serif;margin-top:4px">inkl. MwSt.</span></span></div>' +
      '<a class="btn btn-p btn-full btn-lg" style="margin-top:18px" href="kasse.html">Bestellen</a>' +
      '<div class="row ink3" style="justify-content:center;gap:8px;margin-top:14px">' + A.icon('lock', 18) + '<span class="micro">SSL secured</span></div>';

    var opt = m('cart-options');
    if (opt) opt.innerHTML = ['ventil', 'gewicht'].map(function (kind) {
      var title = kind === 'ventil' ? 'Ventile' : 'Gewichte';
      return '<div style="margin-top:32px"><h3 class="h3">' + title + '</h3>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:14px;max-width:420px">' +
        ['silber', 'schwarz'].map(function (c) {
          var on = o[kind] === c;
          return '<button class="tile" data-opt="' + kind + '" data-val="' + c + '" aria-pressed="' + on + '">' +
            '<span class="tick">' + A.icon('check', 18) + '</span>' +
            '<span style="display:block;height:84px;border-radius:10px;background:linear-gradient(#fff,#FAFBFE);padding:8px">' +
            A.wheelSVG({ spokes: 5, finish: c === 'silber' ? 'polished' : 'black', cap: '', shadow: false }) + '</span>' +
            '<span style="display:block;font:400 14px/1.3 Lato,sans-serif;margin-top:10px">' + (kind === 'ventil' ? 'Ventil' : 'Gewicht') + ' (' + c + ')</span>' +
            '<span class="mono ink3" style="display:block;margin-top:2px">0,00 €</span></button>';
        }).join('') + '</div></div>';
    }).join('');

    $$('[data-qm]').forEach(function (b) { b.addEventListener('click', function () { chg(+b.getAttribute('data-qm'), -1); }); });
    $$('[data-qp]').forEach(function (b) { b.addEventListener('click', function () { chg(+b.getAttribute('data-qp'), 1); }); });
    $$('[data-del]').forEach(function (b) { b.addEventListener('click', function () { var c2 = P().S.cart(); c2.splice(+b.getAttribute('data-del'), 1); P().S.cart(c2); P().renderChrome(); P().renderFooter(); renderCart(); }); });
    var sp = $('[data-ship]'); if (sp) sp.addEventListener('change', function () { var oo = P().S.opts(); oo.versand = sp.value; P().S.opts(oo); renderCart(); });
    $$('[data-opt]').forEach(function (b) {
      b.addEventListener('click', function () {
        var oo = P().S.opts(); oo[b.getAttribute('data-opt')] = b.getAttribute('data-val'); P().S.opts(oo); renderCart();
      });
    });
    function chg(i, dv) {
      var c2 = P().S.cart(); c2[i].qty = Math.max(1, c2[i].qty + dv); P().S.cart(c2);
      P().renderChrome(); P().renderFooter(); renderCart();
    }
  }
  PAGES.warenkorb = function () { seedCart(); PAGES._fillAll(); renderCart(); };

  /* ── KASSE ───────────────────────────────────────────── */
  PAGES.kasse = function () {
    seedCart(); PAGES._fillAll();
    var t = cartTotals(), c = P().S.cart(), v = P().S.vehicle();
    var s = m('kasse-summary');
    if (s) s.innerHTML = '<div class="micro">Deine Bestellung</div>' +
      (v ? '<div class="mono ink2" style="margin-top:8px">' + esc(P().vehicleLabel(v)) + '</div>' : '') +
      '<div style="margin-top:14px;display:flex;flex-direction:column;gap:12px">' + c.map(function (l) {
        return '<div class="row"><span style="width:48px;height:48px;flex:none;border-radius:8px;background:linear-gradient(#fff,#FAFBFE);padding:3px">' + lineArt(l) + '</span>' +
          '<span class="grow"><span style="display:block;font:700 14px/1.2 Lato,sans-serif">' + esc(l.name) + '</span>' +
          '<span class="mono ink3" style="display:block">' + esc(l.size) + ' · ' + l.qty + '×</span></span>' +
          '<span class="mono">' + eur(l.price * l.qty) + '</span></div>';
      }).join('') + '</div>' +
      (c.some(function (l) { return l.entry; }) ? '<div class="row" style="gap:8px;margin-top:14px"><span class="dot" style="background:var(--warn)"></span>' +
        '<span style="font:700 12px/1.4 Lato,sans-serif;color:var(--warn)">Eintragung erforderlich</span></div>' : '') +
      '<div class="hr-s" style="margin:16px 0"></div>' +
      '<div class="row" style="justify-content:space-between"><span class="ink2" style="font-size:14px">Zwischensumme</span><span class="mono">' + eur(t.sum) + '</span></div>' +
      '<div class="row" style="justify-content:space-between;margin-top:8px"><span class="ink2" style="font-size:14px">Versand</span><span class="mono">' + eur(t.ship) + '</span></div>' +
      '<div class="hr" style="margin:14px 0"></div>' +
      '<div class="row" style="justify-content:space-between"><strong style="font:700 16px/1 Lato,sans-serif">Gesamt</strong>' +
      '<strong class="mono" style="font-size:20px">' + eur(t.total) + '</strong></div>';

    var rb = $('[data-billing]'), blk = m('kasse-billing');
    if (rb && blk) {
      blk.style.display = 'none';
      rb.addEventListener('change', function () { blk.style.display = rb.checked ? 'none' : 'block'; });
    }
    $$('[data-tile]').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[data-tile="' + b.getAttribute('data-tile') + '"]').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
      });
    });
    $$('input[required], input[data-req]').forEach(function (i) {
      i.addEventListener('blur', function () {
        var bad = !i.value.trim() || (i.type === 'email' && i.value.indexOf('@') < 0);
        i.classList.toggle('err', bad);
        var e = i.parentNode.querySelector('.ferr');
        if (bad && !e) { var n = d.createElement('div'); n.className = 'ferr'; n.textContent = 'Bitte ausfüllen – wir brauchen das für die Lieferung.'; i.parentNode.appendChild(n); }
        if (!bad && e) e.remove();
      });
    });
    var pay = $('[data-pay]');
    if (pay) pay.addEventListener('click', function () {
      var bad = $$('input[required]').filter(function (i) { return !i.value.trim(); });
      if (bad.length) { bad[0].focus(); bad[0].classList.add('err'); P().toast('Bitte fülle die Pflichtfelder aus.'); return; }
      try { sessionStorage.setItem('rmf_order', 'RMF-2026-0' + (4700 + Math.floor(Math.random() * 99))); } catch (e) { }
      location.href = 'bestellung.html';
    });
  };

  PAGES.bestellung = function () {
    PAGES._fillAll();
    var nr = 'RMF-2026-04711';
    try { nr = sessionStorage.getItem('rmf_order') || nr; } catch (e) { }
    var el = m('best-nr'); if (el) el.textContent = 'Bestellnummer ' + nr;
    var c = P().S.cart(), t = cartTotals(), v = P().S.vehicle();
    var s = m('best-summary');
    if (s) s.innerHTML = (v ? '<div class="micro">Fahrzeug</div><div class="mono" style="margin-top:6px">' + esc(P().vehicleLabel(v)) + '</div><div class="hr-s" style="margin:16px 0"></div>' : '') +
      c.map(function (l) {
        return '<div class="row" style="margin-bottom:12px"><span style="width:56px;height:56px;flex:none;border-radius:8px;background:linear-gradient(#fff,#FAFBFE);padding:4px">' + lineArt(l) + '</span>' +
          '<span class="grow"><span style="display:block;font:700 14px/1.2 Lato,sans-serif">' + esc(l.name) + '</span>' +
          '<span class="mono ink3" style="display:block">' + esc(l.size) + ' · ' + l.qty + '×</span></span><span class="mono">' + eur(l.price * l.qty) + '</span></div>';
      }).join('') +
      '<div class="hr" style="margin:14px 0"></div>' +
      '<div class="row" style="justify-content:space-between"><strong style="font:700 16px/1 Lato,sans-serif">Gesamt</strong><strong class="mono" style="font-size:20px">' + eur(t.total) + '</strong></div>' +
      '<div class="row" style="gap:10px;margin-top:14px;color:var(--blue)">' + A.icon('truck', 20) +
      '<span class="ink2" style="font:400 14px/1.4 Lato,sans-serif">Voraussichtliche Lieferung 21.11.2025</span></div>';
    var pr = $('[data-print]'); if (pr) pr.addEventListener('click', function () { w.print(); });
  };

  /* ── FAQ ─────────────────────────────────────────────── */
  PAGES.faq = function () {
    PAGES._fillAll();
    var q = $('[data-faqq]');
    if (q) q.addEventListener('input', function () {
      var term = q.value.trim().toLowerCase();
      $$('.acc').forEach(function (a) {
        var hit = !term || a.getAttribute('data-q').indexOf(term) >= 0 || a.textContent.toLowerCase().indexOf(term) >= 0;
        a.style.display = hit ? '' : 'none';
        var lbl = $('button > span', a);
        var txt = lbl.textContent;
        lbl.innerHTML = term && txt.toLowerCase().indexOf(term) >= 0
          ? esc(txt).replace(new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>')
          : esc(txt);
      });
    });
  };

  /* ── KONTAKT ─────────────────────────────────────────── */
  PAGES.kontakt = function () {
    PAGES._fillAll();
    var form = m('kontakt-form');
    if (!form) return;
    var send = $('[data-send]', form);
    if (send) send.addEventListener('click', function () {
      var bad = $$('input[required], textarea[required]', form).filter(function (i) { return !i.value.trim(); });
      bad.forEach(function (i) { i.classList.add('err'); });
      if (bad.length) { bad[0].focus(); return; }
      form.style.transition = 'opacity 240ms';
      form.style.opacity = '0';
      setTimeout(function () {
        form.innerHTML = '<div style="text-align:center;padding:40px 0">' +
          '<div style="width:56px;height:56px;border-radius:999px;background:var(--ok-w);color:var(--ok);display:flex;align-items:center;justify-content:center;margin:0 auto">' + A.icon('check', 30) + '</div>' +
          '<h3 class="h3" style="margin-top:18px">Danke – deine Nachricht ist bei uns.</h3>' +
          '<p class="body ink2" style="margin-top:8px">Wir melden uns meist am selben Werktag.</p>' +
          '<button class="btn btn-q" style="margin-top:18px" onclick="location.reload()">Weitere Nachricht senden</button></div>';
        form.style.opacity = '1';
      }, 240);
    });
  };

  /* ── RECHTLICHES ─────────────────────────────────────── */
  PAGES.rechtliches = function () {
    PAGES._fillAll();
    var cur = P().qs('t') || 'impressum';
    var tabs = m('legal-tabs'), body = m('legal-body');
    function paint() {
      var item = R.legal.filter(function (x) { return x.id === cur; })[0] || R.legal[0];
      if (tabs) tabs.innerHTML = MOB
        ? '<select class="field" data-lt>' + R.legal.map(function (x) { return '<option value="' + x.id + '"' + (x.id === cur ? ' selected' : '') + '>' + esc(x.t) + '</option>'; }).join('') + '</select>'
        : R.legal.map(function (x) {
          var on = x.id === cur;
          return '<button data-lt="' + x.id + '" style="display:block;width:100%;text-align:left;padding:12px 16px;border-radius:8px;min-height:44px;' +
            'font:700 14px/1.3 Lato,sans-serif;' + (on ? 'background:var(--wash);color:var(--blue);box-shadow:inset 2px 0 0 var(--blue)' : 'color:var(--ink2)') + '">' + esc(x.t) + '</button>';
        }).join('');
      if (body) body.innerHTML = '<h1 class="h2">' + esc(item.t) + '</h1>' +
        item.h.map(function (h) {
          return '<h2 class="h3" style="margin-top:32px">' + esc(h) + '</h2>' +
            '<p class="body ink2" style="margin-top:10px;max-width:68ch">RIMIFY GmbH · Beispielstraße 12 · 40210 Düsseldorf. ' +
            'Dieser Abschnitt beschreibt ' + esc(h.toLowerCase()) + ' für den Betrieb des RIMIFY-Onlineshops. ' +
            '<span class="mono ink3">[Rechtstext folgt von der Kanzlei]</span></p>';
        }).join('');
      $$('[data-lt]').forEach(function (b) {
        if (b.tagName === 'SELECT') b.addEventListener('change', function () { cur = b.value; paint(); });
        else b.addEventListener('click', function () { cur = b.getAttribute('data-lt'); paint(); });
      });
    }
    paint();
  };

  PAGES['404'] = function () {
    PAGES._fillAll();
    var g = m('nf-grid');
    if (g) { g.innerHTML = R.wheels.slice(0, 4).map(function (x) { return P().productCard(x); }).join(''); P().wireCards(g); }
  };
})(window, document);
