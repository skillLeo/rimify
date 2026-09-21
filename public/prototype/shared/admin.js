/* RIMIFY — admin pages */
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

  var NAV = [
    ['Übersicht', [['Dashboard', 'grid'], ['Aufgaben', 'check-circle']]],
    ['Katalog', [['Felgenmodelle', 'wheel'], ['Konfigurationen', 'settings'], ['Reifen', 'box'], ['Marken', 'star'], ['Medien', 'eye']]],
    ['Compliance', [['Gutachten', 'document'], ['Fitment-Zeilen', 'check'], ['Auflagen', 'warning'], ['Konflikte', 'info'], ['Fahrzeug-Import', 'truck']]],
    ['Handel', [['Bestellungen', 'cart'], ['Sendungen', 'truck'], ['Kunden', 'user'], ['Nachrichten', 'mail']]],
    ['Inhalte', [['Seiten', 'home'], ['Navigation', 'menu'], ['FAQ', 'info'], ['Rechtstexte', 'shield']]],
    ['System', [['Benutzer', 'user'], ['Rollen', 'lock'], ['Audit-Trail', 'chart'], ['Einstellungen', 'settings']]]
  ];

  function shell(active) {
    var side = m('adm-side'), top = m('adm-top');
    if (side) side.innerHTML = '<div style="padding:20px 16px"><span class="wordmark" style="font-size:21px">RIMIFY</span>' +
      '<span class="micro" style="display:block;margin-top:6px;color:var(--ink3)">Admin</span></div>' +
      NAV.map(function (g) {
        return '<div style="padding:18px 16px 6px"><div class="micro">' + esc(g[0]) + '</div></div>' +
          g[1].map(function (it) {
            var i = it[0], on = i === active;
            var href = i === 'Gutachten' ? 'admin-gutachten.html' : i === 'Rollen' ? 'admin-rollen.html' : i === 'Dashboard' ? 'admin-dashboard.html' : '#';
            return '<a href="' + href + '" class="adm-nav' + (on ? ' on' : '') + '">' +
              '<span class="adm-nav-i">' + A.icon(it[1], 20) + '</span>' + esc(i) + '</a>';
          }).join('');
      }).join('');
    if (top) top.innerHTML = '<div class="crumb"><a href="admin-dashboard.html">RIMIFY Admin</a>›<span class="ink2">' + esc(active) + '</span></div>' +
      '<div class="ffield" style="flex:1;max-width:420px;margin:0 24px;min-width:0"><span class="ic l">' + A.icon('search', 18) + '</span>' +
      '<input class="field pl" data-cmd placeholder="' + (MOB ? 'Suchen' : 'Suchen oder Aktion ausführen') + '" style="height:' + (MOB ? 48 : 40) + 'px;padding-right:' + (MOB ? 16 : 56) + 'px">' +
      (MOB ? '' : '<span class="ic r mono" style="background:var(--ground);border-radius:6px;padding:3px 7px;font-size:11px">⌘K</span>') + '</div>' +
      '<div class="row" style="gap:16px"><span class="pill pill-ink adm-env">Produktion</span>' +
      '<button aria-label="Benachrichtigungen" style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;color:var(--ink2);flex:none">' + A.icon('bell', 20) +
      '<span class="dot" style="position:absolute;top:10px;right:11px;background:var(--blue)"></span></button>' +
      '<div class="row" style="gap:10px"><span style="width:36px;height:36px;border-radius:999px;background:var(--wash);color:var(--blue);display:flex;align-items:center;justify-content:center;font:700 13px/1 Lato,sans-serif;flex:none">SM</span>' +
      '<span class="adm-user"><span style="display:block;font:700 13px/1.2 Lato,sans-serif;white-space:nowrap">Stefan M.</span><span class="micro" style="font-size:10px">Administrator</span></span></div></div>';

    var rail = m('adm-rail');
    if (rail && MOB) {
      var flat = [];
      NAV.forEach(function (g) { g[1].forEach(function (it) { flat.push(it); }); });
      rail.innerHTML = flat.map(function (it) {
        var on = it[0] === active;
        var href = it[0] === 'Gutachten' ? 'admin-gutachten.html' : it[0] === 'Rollen' ? 'admin-rollen.html' : it[0] === 'Dashboard' ? 'admin-dashboard.html' : '#';
        return '<a href="' + href + '" class="adm-rail-i' + (on ? ' on' : '') + '">' +
          '<span style="display:flex">' + A.icon(it[1], 18) + '</span>' + esc(it[0]) + '</a>';
      }).join('');
    }

    d.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette(); }
    });
    var ci = $('[data-cmd]'); if (ci) ci.addEventListener('focus', function () { ci.blur(); palette(); });
  }

  function palette() {
    var groups = [
      ['Bestellungen', R.orders.slice(0, 3).map(function (o) { return o.nr + ' · ' + o.kunde; })],
      ['Felgen', R.wheels.slice(0, 3).map(function (x) { return x.brand + ' ' + x.model + ' · ' + x.sku; })],
      ['Gutachten', ['ABE 47231 · BORBET Havanna', 'Teilegutachten 8199 · OZ Superturismo']],
      ['Fahrzeuge', ['HSN 1860 · TSN AAS', 'HSN 0005 · TSN 582']],
      ['Aktionen', ['Neues Gutachten anlegen', 'Fahrzeug-Import starten', 'Theme wechseln']]
    ];
    var body = '<input class="field" data-pq placeholder="Suchen…" style="height:52px;font-size:16px" autofocus>' +
      '<div data-pres style="margin-top:12px">' + groups.map(function (g) {
        return '<div class="micro" style="margin-top:16px">' + esc(g[0]) + '</div>' + g[1].map(function (r) {
          return '<button class="prow" style="display:flex;align-items:center;justify-content:space-between;width:100%;min-height:48px;padding:10px 12px;border-radius:8px;text-align:left;font:400 14px/1.3 Lato,sans-serif">' +
            esc(r) + '<span class="micro">' + esc(g[0]) + '</span></button>';
        }).join('');
      }).join('') + '</div>';
    var s = P().sheet('Befehlspalette', body, '');
    s.style.cssText += 'left:50%;right:auto;top:8vh;bottom:auto;transform:translateX(-50%);width:min(680px,92vw);border-radius:18px;max-height:80vh';
    requestAnimationFrame(function () { s.style.transform = 'translateX(-50%)'; });
    $$('.prow', s).forEach(function (b) {
      b.addEventListener('mouseenter', function () { b.style.background = 'var(--wash)'; });
      b.addEventListener('mouseleave', function () { b.style.background = 'transparent'; });
      b.addEventListener('click', function () { P().closeAll(); P().toast('Geöffnet: ' + b.textContent.trim()); });
    });
    var q = $('[data-pq]', s);
    if (q) { q.focus(); q.addEventListener('input', function () { $$('.prow', s).forEach(function (b) { b.style.display = b.textContent.toLowerCase().indexOf(q.value.toLowerCase()) >= 0 ? '' : 'none'; }); }); }
  }

  /* ── Login ───────────────────────────────────────────── */
  PAGES['admin-anmelden'] = function () {
    var bp = m('blueprint'); if (bp) bp.innerHTML = A.loginArt(MOB);
    var fails = 0;
    var form = m('adm-login');
    function paintLogin() {
      form.innerHTML =
        (fails >= 2 ? '<div style="background:var(--danger-w);border-radius:10px;padding:14px 16px;margin-bottom:20px">' +
          '<div class="row" style="gap:10px;color:var(--danger)">' + A.icon('warning', 20) +
          '<span style="font:700 13px/1.4 Lato,sans-serif">Nach fünf Versuchen wird das Konto für 15 Minuten gesperrt.</span></div></div>' : '') +
        '<h1 class="h2" style="font-size:30px">Anmelden</h1>' +
        '<p class="body ink2" style="font-size:15px;margin-top:6px">Melde dich mit deinem RIMIFY-Konto an.</p>' +
        '<div style="margin-top:32px"><label class="flabel" for="adm-mail">E-Mail</label>' +
        '<input class="field" id="adm-mail" type="email" value="stefan@rimify.de"></div>' +
        '<div style="margin-top:16px"><label class="flabel" for="adm-pw">Passwort</label>' +
        '<div class="ffield"><input class="field' + (fails ? ' err' : '') + '" id="adm-pw" type="password" value="">' +
        '<button class="ic r" data-eye aria-label="Passwort anzeigen" style="pointer-events:auto;background:none;width:44px;height:44px;display:flex;align-items:center;justify-content:center">' + A.icon('eye', 20) + '</button></div>' +
        (fails ? '<div class="ferr">E-Mail oder Passwort ist nicht korrekt.</div>' : '') + '</div>' +
        '<div class="row" style="justify-content:space-between;margin-top:16px">' +
        '<label class="check"><input type="checkbox"><span style="font:400 14px/1.4 Lato,sans-serif">Angemeldet bleiben</span></label>' +
        '<a href="#" class="tap" style="font:700 14px/1 Lato,sans-serif">Passwort vergessen?</a></div>' +
        '<button class="btn btn-p btn-full btn-lg" data-login style="margin-top:20px">Anmelden</button>' +
        '<div style="position:relative;text-align:center;margin:24px 0"><div class="hr"></div>' +
        '<span class="micro" style="position:absolute;top:-7px;left:50%;transform:translateX(-50%);background:#fff;padding:0 12px">oder</span></div>' +
        '<button class="btn btn-s btn-full btn-lg">Mit Firmen-SSO anmelden</button>' +
        '<p class="ink3" style="font:400 13px/1.5 Lato,sans-serif;margin-top:24px">Probleme beim Anmelden? <a href="#" class="tap">IT kontaktieren</a></p>';
      $('[data-eye]', form).addEventListener('click', function () {
        var p = $('#adm-pw', form); p.type = p.type === 'password' ? 'text' : 'password';
      });
      $('[data-login]', form).addEventListener('click', function (e) {
        var b = e.currentTarget, pw = $('#adm-pw', form).value;
        if (!pw) { fails++; paintLogin(); return; }
        b.style.width = b.offsetWidth + 'px'; b.innerHTML = '<span class="spin"></span>'; b.disabled = true;
        setTimeout(function () { twofa(); }, 900);
      });
    }
    function twofa() {
      form.innerHTML = '<h1 class="h2" style="font-size:30px">Bestätigung in zwei Schritten</h1>' +
        '<p class="body ink2" style="font-size:15px;margin-top:6px">Gib den 6-stelligen Code aus deiner Authenticator-App ein.</p>' +
        '<div class="row" style="gap:12px;margin-top:32px">' + [0, 1, 2, 3, 4, 5].map(function (i) {
          return (i === 3 ? '<span style="width:12px"></span>' : '') +
            '<input class="field otp" data-i="' + i + '" maxlength="1" inputmode="numeric" aria-label="Ziffer ' + (i + 1) + '" ' +
            'style="width:' + (MOB ? 44 : 56) + 'px;height:' + (MOB ? 56 : 64) + 'px;text-align:center;font:500 24px/1 \'IBM Plex Mono\',monospace;padding:0">';
        }).join('') + '</div>' +
        '<button class="btn btn-p btn-full btn-lg" data-ok style="margin-top:24px">Code bestätigen</button>' +
        '<div class="row" style="gap:20px;margin-top:20px"><a href="#" style="font:700 14px/1 Lato,sans-serif">Anderes Verfahren verwenden</a>' +
        '<a href="#" class="ink3" style="font:700 14px/1 Lato,sans-serif" onclick="location.reload()">Abmelden</a></div>';
      var boxes = $$('.otp', form);
      boxes.forEach(function (b, i) {
        b.addEventListener('input', function () { if (b.value && boxes[i + 1]) boxes[i + 1].focus(); });
        b.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
        b.addEventListener('paste', function (e) {
          e.preventDefault();
          var v = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
          boxes.forEach(function (x, j) { x.value = v[j] || ''; });
          if (v.length === 6) boxes[5].focus();
        });
      });
      boxes[0].focus();
      $('[data-ok]', form).addEventListener('click', function () {
        var code = boxes.map(function (b) { return b.value; }).join('');
        if (code.length < 6) { boxes.forEach(function (b) { b.classList.add('err'); }); return; }
        location.href = 'admin-dashboard.html';
      });
    }
    paintLogin();
  };

  /* ── Dashboard ───────────────────────────────────────── */
  function spark(vals, col) {
    var wdt = 120, hgt = 34, mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals);
    var pts = vals.map(function (v, i) { return [i * (wdt / (vals.length - 1)), hgt - ((v - mn) / (mx - mn || 1)) * (hgt - 6) - 3]; });
    return '<svg width="' + wdt + '" height="' + hgt + '" viewBox="0 0 ' + wdt + ' ' + hgt + '" fill="none">' +
      '<path d="M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L') + '" stroke="' + (col || '#1A44D4') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function areaChart() {
    var vals = [28, 31, 27, 36, 34, 42, 39, 47, 44, 52, 49, 58];
    var W = 720, H = 220, pad = 30, mx = 64;
    var pts = vals.map(function (v, i) { return [pad + i * ((W - pad * 2) / (vals.length - 1)), H - 30 - (v / mx) * (H - 60)]; });
    var line = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L');
    var area = line + 'L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (H - 30) + 'L' + pad + ' ' + (H - 30) + 'Z';
    var grid = [0, 1, 2, 3].map(function (i) { var y = 30 + i * ((H - 60) / 3); return '<line x1="' + pad + '" y1="' + y + '" x2="' + (W - pad) + '" y2="' + y + '" stroke="#EEF0F5"/>'; }).join('');
    var mo = ['Okt', 'Nov', 'Dez', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep'];
    var lab = pts.map(function (p, i) { return i % 2 ? '' : '<text x="' + p[0] + '" y="' + (H - 8) + '" text-anchor="middle" font-family="Lato" font-size="11" fill="#7B8394">' + mo[i] + '</text>'; }).join('');
    var last = pts[pts.length - 1];
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" preserveAspectRatio="xMidYMid meet">' +
      '<defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A44D4" stop-opacity=".12"/>' +
      '<stop offset="1" stop-color="#1A44D4" stop-opacity="0"/></linearGradient></defs>' + grid +
      '<path d="' + area + '" fill="url(#ar)"/><path d="' + line + '" stroke="#1A44D4" stroke-width="2" fill="none" stroke-linejoin="round"/>' +
      '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="5" fill="#1A44D4"/>' +
      '<text x="' + (last[0] - 6).toFixed(1) + '" y="' + (last[1] - 14).toFixed(1) + '" text-anchor="end" font-family="Lato" font-weight="700" font-size="13" fill="#0E1116">48.920 €</text>' + lab + '</svg>';
  }
  var PILL = { 'BEZAHLT': 'pill-ok', 'IN BEARBEITUNG': 'pill-blue', 'VERSENDET': 'pill-ink', 'STORNIERT': 'pill-ink', 'PROBLEM': 'pill-danger' };

  PAGES['admin-dashboard'] = function () {
    shell('Dashboard');
    var tiles = [
      ['Offene Bestellungen', '7', 'davon 2 seit gestern', '', ''],
      ['Umsatz (Monat)', '48.920 €', '', spark([28, 31, 27, 36, 34, 42, 47, 52, 58]), '<span class="pill pill-ok">+12 %</span>'],
      ['Konflikte', '2', 'blockieren die Veröffentlichung', '', '', 'var(--danger)'],
      ['Kataloglücken', '14', 'Fahrzeuge ohne freigegebene Felge', '', ''],
      ['Bestand niedrig', '3', 'Konfigurationen unter Schwelle', '', '', 'var(--warn)'],
      ['Letzter Import', 'OK', 'heute 04:12 · Diff ansehen', '', '']
    ];
    var t = m('adm-tiles');
    if (t) t.innerHTML = tiles.map(function (x) {
      return '<a href="#" class="card" style="padding:20px;text-decoration:none;color:inherit;display:block;transition:border-color var(--e1)" ' +
        'onmouseover="this.style.borderColor=\'#1A44D4\'" onmouseout="this.style.borderColor=\'#E5E5E5\'">' +
        '<div class="micro">' + esc(x[0]) + '</div>' +
        '<div class="row" style="justify-content:space-between;margin-top:10px">' +
        '<strong style="font:700 34px/1 Lato,sans-serif;font-variant-numeric:tabular-nums;white-space:nowrap' + (x[5] ? ';color:' + x[5] : '') + '">' + esc(x[1]) + '</strong>' +
        (x[3] || x[4] ? '<span class="row" style="gap:10px">' + x[3] + x[4] + '</span>' : '') + '</div>' +
        (x[2] ? '<div class="ink2" style="font:400 13px/1.4 Lato,sans-serif;margin-top:8px">' + esc(x[2]) + '</div>' : '') + '</a>';
    }).join('');
    var ch = m('adm-chart'); if (ch) ch.innerHTML = areaChart();
    var ord = m('adm-orders');
    if (ord) ord.innerHTML = '<table class="tbl"><thead><tr><th>Bestellung</th><th>Kunde</th><th>Fahrzeug</th><th class="r">Gesamt</th><th class="r">Status</th></tr></thead><tbody>' +
      R.orders.map(function (o) {
        return '<tr><td class="mono">' + esc(o.nr) + '</td><td style="font-size:14px">' + esc(o.kunde) + '</td>' +
          '<td class="ink2" style="font-size:14px">' + esc(o.fzg) + '</td><td class="r mono">' + eur(o.total) + '</td>' +
          '<td class="r"><span class="pill ' + PILL[o.status] + '">' + esc(o.status) + '</span></td></tr>';
      }).join('') + '</tbody></table>';
    var act = m('adm-activity');
    if (act) act.innerHTML = R.aktivitaet.map(function (a, i) {
      return '<div style="padding:14px 0' + (i ? ';border-top:1px solid var(--line-s)' : '') + '">' +
        '<div style="font:400 13px/1.5 Lato,sans-serif"><strong style="font-weight:700">' + esc(a.who) + '</strong> ' + esc(a.what) + '</div>' +
        '<div class="ink3" style="font:400 12px/1 Lato,sans-serif;margin-top:4px">' + esc(a.when) + '</div></div>';
    }).join('');
    var td = m('adm-todo');
    if (td) td.innerHTML = [
      ['Konflikt', 'BBS CI-R 9,5J · zwei Gutachten widersprechen sich', 'danger'],
      ['Konflikt', 'rotiform KPS · Eintragungspflicht unterschiedlich', 'danger'],
      ['Bestand', 'OZ Superturismo GT 18" · 4 Sätze', 'warn'],
      ['Bestand', 'ALUTEC Monstr 20" · 2 Sätze', 'warn'],
      ['Bestand', 'YIDO Grip 19" · 3 Sätze', 'warn']
    ].map(function (r, i) {
      return '<button style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:14px 0;min-height:56px' + (i ? ';border-top:1px solid var(--line-s)' : '') + '">' +
        '<span class="dot" style="background:var(--' + r[2] + ')"></span>' +
        '<span class="grow" style="font:400 13px/1.4 Lato,sans-serif"><strong style="font-weight:700">' + esc(r[0]) + '</strong> · ' + esc(r[1]) + '</span>' +
        '<span class="ink3" style="display:flex">' + A.icon('chevron-right', 18) + '</span></button>';
    }).join('');
    var th = $('[data-theme]');
    if (th) th.addEventListener('click', function () {
      var dark = d.body.classList.toggle('dark');
      th.innerHTML = A.icon(dark ? 'eye' : 'eye-off', 18) + (dark ? 'Hell' : 'Dunkel');
    });
  };

  /* ── Gutachten ───────────────────────────────────────── */
  PAGES['admin-gutachten'] = function () {
    shell('Gutachten');
    var pane = m('gut-doc'); if (pane) pane.innerHTML = A.docSVG('neu');
    var out = m('gut-resolve');
    var hsn = $('[data-ghsn]'), tsn = $('[data-gtsn]');
    function res() {
      if (!out) return;
      var r = R.lookup(hsn ? hsn.value : '', tsn ? tsn.value : '');
      out.innerHTML = !r.length
        ? '<div class="ink3" style="font:400 13px/1.5 Lato,sans-serif;padding:10px 0">Keine Treffer – prüfe die Schlüsselnummern.</div>'
        : '<div class="micro" style="margin-top:12px">' + r.length + ' Treffer</div>' + r.map(function (c) {
          return '<div class="row" style="justify-content:space-between;padding:12px;border-radius:8px;background:var(--ground);margin-top:8px">' +
            '<span><strong style="font:700 14px/1.2 Lato,sans-serif">' + esc(c.variant) + '</strong>' +
            '<span class="mono ink2" style="display:block;margin-top:3px">' + esc(c.years) + ' · ' + c.kw + ' kW · ' + esc(c.body) + ' · ' + c.vmax + ' km/h' + (c.vsn ? ' · VSN ' + c.vsn : '') + '</span></span>' +
            '<label class="check" style="min-height:auto"><input type="checkbox" checked></label></div>';
        }).join('');
    }
    [hsn, tsn].forEach(function (i) { if (i) i.addEventListener('input', function () { i.value = i.value.toUpperCase(); res(); }); });
    res();
    var chips = m('gut-chips');
    if (chips) {
      var sizes = ['245/45 R18 92Y', '235/40 R18 95Y', '225/40 R19 93Y'];
      var conds = ['Eintragung in die Fahrzeugpapiere erforderlich.', 'Nur mit den angegebenen Radschrauben zulässig.'];
      chips.innerHTML = '<div class="micro">Zulässige Reifengrößen</div><div class="chips" style="margin-top:8px">' +
        sizes.map(function (s) { return '<span class="chip" style="background:var(--wash);color:var(--blue);padding:0 14px">' + esc(s) + '</span>'; }).join('') +
        '<button class="chip" data-addsize>' + A.icon('plus', 16) + '</button></div>' +
        '<div class="micro" style="margin-top:24px">Auflagen</div><div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">' +
        conds.map(function (c) {
          return '<div class="row" style="justify-content:space-between;background:var(--warn-w);border-radius:8px;padding:10px 14px">' +
            '<span style="font:400 13px/1.5 Lato,sans-serif">' + esc(c) + '</span>' +
            '<button class="ink3" aria-label="Entfernen" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center">' + A.icon('close', 16) + '</button></div>';
        }).join('') + '</div>';
      var ad = $('[data-addsize]', chips); if (ad) ad.addEventListener('click', function () { P().toast('Reifengröße hinzugefügt.'); });
    }
    var cf = m('gut-conflict');
    if (cf) cf.innerHTML = '<div style="background:var(--warn-w);border-radius:12px;padding:18px">' +
      '<div class="row" style="gap:10px;color:var(--warn)">' + A.icon('warning', 20) +
      '<strong style="font:700 14px/1.3 Lato,sans-serif">Konflikt: zwei Dokumente widersprechen sich</strong></div>' +
      '<p class="body ink2" style="font-size:13px;margin-top:8px">ABE 47231 erlaubt 8,0–9,0J, Teilegutachten 8199 nur 8,0–8,5J für dieselbe Variante. ' +
      'Die Eintragungspflicht unterscheidet sich ebenfalls – bitte vor dem Veröffentlichen klären.</p>' +
      '<div class="row" style="gap:10px;margin-top:14px"><button class="btn btn-s" style="height:44px">Als Schnittmenge veröffentlichen</button>' +
      '<button class="btn btn-q" style="height:44px">Älteres Dokument ablösen</button></div></div>';
    var sv = $('[data-save]'); if (sv) sv.addEventListener('click', function () { P().toast('Entwurf gespeichert.'); });
  };

  /* ── Rollen ──────────────────────────────────────────── */
  PAGES['admin-rollen'] = function () {
    shell('Rollen');
    var MODS = ['Seiten', 'Medien', 'Felgen', 'Gutachten', 'Bestellungen', 'Benutzer'];
    var ACTS = ['Ansehen', 'Anlegen', 'Bearbeiten', 'Löschen', 'Veröffentlichen', 'Exportieren'];
    var ROLES = ['Administrator', 'Compliance Editor', 'Content Editor', 'Fulfilment'];
    var role = 'Content Editor';
    var base = {}, cur = {};
    MODS.forEach(function (mo) {
      ACTS.forEach(function (ac) {
        var k = mo + '|' + ac;
        base[k] = (ac === 'Ansehen') || (mo === 'Seiten' && ac !== 'Löschen' && ac !== 'Veröffentlichen') || (mo === 'Medien' && ac !== 'Veröffentlichen');
        cur[k] = base[k];
      });
    });
    function diff() {
      var add = [], rem = [];
      Object.keys(cur).forEach(function (k) {
        if (cur[k] && !base[k]) add.push('+' + k.split('|')[1] + ' auf ' + k.split('|')[0]);
        if (!cur[k] && base[k]) rem.push('−' + k.split('|')[1] + ' auf ' + k.split('|')[0]);
      });
      return add.concat(rem);
    }
    function paint() {
      var tabs = m('rol-tabs');
      if (tabs) tabs.innerHTML = '<div class="seg">' + ROLES.map(function (r) {
        return '<button data-role="' + esc(r) + '" aria-pressed="' + (r === role) + '">' + esc(r) + '</button>';
      }).join('') + '</div>';
      var t = m('rol-matrix');
      if (t) t.innerHTML = '<table class="tbl" style="min-width:' + (MOB ? '640px' : 'auto') + '"><thead><tr><th>Modul</th>' +
        ACTS.map(function (a) { return '<th class="r">' + esc(a) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        MODS.map(function (mo) {
          return '<tr><td style="font:700 14px/1 Lato,sans-serif">' + esc(mo) + '</td>' + ACTS.map(function (ac) {
            var k = mo + '|' + ac, on = cur[k], chg = on !== base[k];
            return '<td class="r"><button data-k="' + esc(k) + '" role="switch" aria-checked="' + on + '" ' +
              'aria-label="' + esc(mo + ' ' + ac) + '" ' +
              'style="width:44px;height:' + (MOB ? 44 : 26) + 'px;border-radius:999px;position:relative;background:' + (on ? 'var(--blue)' : 'var(--line)') + ';' +
              (chg ? 'box-shadow:0 0 0 2px var(--wash);' : '') + 'transition:background var(--e1)">' +
              '<span style="position:absolute;top:' + (MOB ? 12 : 3) + 'px;left:' + (on ? 21 : 3) + 'px;width:20px;height:20px;border-radius:999px;background:#fff;transition:left var(--e1)"></span></button></td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table>';
      var ds = m('rol-diff'), list = diff();
      if (ds) ds.innerHTML = list.length
        ? '<div class="wash row" style="justify-content:space-between;padding:14px 18px;flex-wrap:wrap;gap:12px">' +
        '<span style="font:400 13px/1.5 Lato,sans-serif"><strong style="font-weight:700">' + esc(role) + ':</strong> ' + esc(list.join(', ')) + '</span>' +
        '<span class="row" style="gap:10px"><button class="btn btn-q" data-undo style="height:44px">Verwerfen</button>' +
        '<button class="btn btn-p" data-savep style="height:44px">Änderungen speichern</button></span></div>'
        : '<div class="ink3" style="font:400 13px/1.5 Lato,sans-serif;padding:14px 0">Keine ausstehenden Änderungen.</div>';
      $$('[data-k]').forEach(function (b) { b.addEventListener('click', function () { cur[b.getAttribute('data-k')] = !cur[b.getAttribute('data-k')]; paint(); }); });
      $$('[data-role]').forEach(function (b) { b.addEventListener('click', function () { role = b.getAttribute('data-role'); paint(); }); });
      var u = $('[data-undo]'); if (u) u.addEventListener('click', function () { Object.keys(base).forEach(function (k) { cur[k] = base[k]; }); paint(); });
      var s = $('[data-savep]'); if (s) s.addEventListener('click', function () { Object.keys(cur).forEach(function (k) { base[k] = cur[k]; }); paint(); P().toast('Berechtigungen gespeichert.'); });
    }
    paint();
  };
})(window, document);
