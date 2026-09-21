/* RIMIFY — SVG artwork generators. Everything visual on the site is drawn here. */
(function (w) {
  'use strict';

  var uidn = 0;
  function uid(p) { uidn += 1; return (p || 'a') + uidn; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  var FIN = {
    graphite: { a:'#3A3E45', b:'#1C1F24', face:'#2A2E34', lo:'#14171B', li:'#565B63', cap:'#4A4F57' },
    silver:   { a:'#D8DBE0', b:'#9BA1AA', face:'#C3C8CF', lo:'#7C838D', li:'#F1F3F6', cap:'#CFD4DA' },
    black:    { a:'#1A1C20', b:'#0A0B0D', face:'#16181C', lo:'#050607', li:'#34373D', cap:'#2A2D33' },
    bronze:   { a:'#8A6A3C', b:'#4E3A1F', face:'#6F552F', lo:'#372813', li:'#B9915A', cap:'#7E5F33' },
    polished: { a:'#E9ECEF', b:'#A8AEB6', face:'#D5DAE0', lo:'#8B929B', li:'#FFFFFF', cap:'#DEE3E8' }
  };

  function pt(cx, cy, r, deg) {
    var a = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }
  function f(n) { return Math.round(n * 100) / 100; }

  /* ── 4.1 wheelSVG ───────────────────────────────────── */
  function wheelSVG(o) {
    o = o || {};
    var n = o.spokes || 10, fin = FIN[o.finish] || FIN.graphite, cap = (o.cap || 'R').charAt(0);
    var tyre = !!o.tyre, shadow = o.shadow !== false;
    var id = uid('w'), C = 200;
    var s = [];

    s.push('<defs>');
    s.push('<linearGradient id="lip' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + fin.a + '"/><stop offset=".48" stop-color="' + fin.b + '"/>' +
      '<stop offset=".72" stop-color="' + fin.a + '"/><stop offset="1" stop-color="' + fin.lo + '"/></linearGradient>');
    s.push('<radialGradient id="fc' + id + '" cx="38%" cy="32%" r="82%">' +
      '<stop offset="0" stop-color="#1B1F26"/><stop offset=".6" stop-color="#0C0E12"/>' +
      '<stop offset="1" stop-color="#040507"/></radialGradient>');
    s.push('<linearGradient id="sp' + id + '" x1=".15" y1="0" x2=".85" y2="1">' +
      '<stop offset="0" stop-color="' + fin.li + '"/><stop offset=".42" stop-color="' + fin.a + '"/>' +
      '<stop offset=".78" stop-color="' + fin.face + '"/><stop offset="1" stop-color="' + fin.lo + '"/></linearGradient>');
    s.push('<radialGradient id="cp' + id + '" cx="36%" cy="30%" r="80%">' +
      '<stop offset="0" stop-color="' + fin.li + '"/><stop offset="1" stop-color="' + fin.lo + '"/></radialGradient>');
    if (shadow) s.push('<filter id="bl' + id + '" x="-30%" y="-60%" width="160%" height="260%"><feGaussianBlur stdDeviation="9"/></filter>');
    s.push('</defs>');

    if (shadow) s.push('<ellipse cx="200" cy="' + (tyre ? 384 : 352) + '" rx="150" ry="14" fill="#0E1116" opacity=".16" filter="url(#bl' + id + ')"/>');

    if (tyre) {
      s.push('<circle cx="200" cy="200" r="196" fill="#15171B"/>');
      s.push('<circle cx="200" cy="200" r="196" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="2"/>');
      var tread = [];
      for (var t = 0; t < 34; t++) {
        var a1 = pt(C, C, 196, t * (360 / 34)), a2 = pt(C, C, 176, t * (360 / 34) + 3.2);
        tread.push('M' + f(a1[0]) + ' ' + f(a1[1]) + 'L' + f(a2[0]) + ' ' + f(a2[1]));
      }
      s.push('<path d="' + tread.join('') + '" stroke="#0B0C0F" stroke-width="7" stroke-linecap="round" fill="none"/>');
      s.push('<circle cx="200" cy="200" r="168" fill="none" stroke="#24272C" stroke-width="3"/>');
      s.push('<circle cx="200" cy="200" r="158" fill="#1B1E23"/>');
    }

    s.push('<circle cx="200" cy="200" r="150" fill="url(#lip' + id + ')"/>');
    s.push('<circle cx="200" cy="200" r="142" fill="none" stroke="' + fin.li + '" stroke-opacity=".35" stroke-width="1.5"/>');
    s.push('<circle cx="200" cy="200" r="136" fill="#000" opacity=".5"/>');
    s.push('<circle cx="200" cy="200" r="131" fill="url(#fc' + id + ')"/>');

    /* spokes */
    var ri = 44, ro = 130;
    var ai = (Math.PI / n) * 0.24, ao = (Math.PI / n) * 0.48;
    function P(r, rad) { return [f(C + r * Math.sin(rad)), f(C - r * Math.cos(rad))]; }
    var p1 = P(ri, -ai), p2 = P(ro, -ao), p3 = P(ro, ao), p4 = P(ri, ai);
    var d = 'M' + p1[0] + ' ' + p1[1] + 'L' + p2[0] + ' ' + p2[1] +
      'A' + ro + ' ' + ro + ' 0 0 1 ' + p3[0] + ' ' + p3[1] +
      'L' + p4[0] + ' ' + p4[1] + 'A' + ri + ' ' + ri + ' 0 0 0 ' + p1[0] + ' ' + p1[1] + 'Z';
    s.push('<g>');
    for (var i = 0; i < n; i++) {
      var rot = i * 360 / n;
      s.push('<path d="' + d + '" fill="url(#sp' + id + ')" stroke="' + fin.lo + '" stroke-width="1" stroke-opacity=".9" transform="rotate(' + f(rot) + ' 200 200)"/>');
      s.push('<path d="' + d + '" fill="none" stroke="' + fin.li + '" stroke-width="1" stroke-opacity=".5" transform="rotate(' + f(rot) + ' 200 200) translate(-1.4 -1.4)"/>');
    }
    s.push('</g>');

    /* hub plate */
    s.push('<circle cx="200" cy="200" r="64" fill="url(#sp' + id + ')"/>');
    s.push('<circle cx="200" cy="200" r="64" fill="none" stroke="' + fin.lo + '" stroke-width="1" stroke-opacity=".8"/>');

    /* bolt circle */
    for (var b = 0; b < 5; b++) {
      var bp = pt(C, C, 52, b * 72 + 18);
      s.push('<circle cx="' + f(bp[0]) + '" cy="' + f(bp[1]) + '" r="9" fill="' + fin.lo + '"/>');
      s.push('<path d="M' + f(bp[0] - 7.5) + ' ' + f(bp[1] + 3) + 'A9 9 0 0 0 ' + f(bp[0] + 7.5) + ' ' + f(bp[1] + 3) + '" fill="none" stroke="' + fin.li + '" stroke-opacity=".5" stroke-width="1.4"/>');
    }

    /* centre cap */
    s.push('<circle cx="200" cy="200" r="34" fill="url(#cp' + id + ')"/>');
    s.push('<circle cx="200" cy="200" r="34" fill="none" stroke="' + fin.lo + '" stroke-width="1.2"/>');
    s.push('<text x="200" y="208" text-anchor="middle" font-family="Lato,sans-serif" font-weight="900" font-size="20" fill="' + (o.finish === 'silver' || o.finish === 'polished' ? '#3A3E45' : '#EDEFF3') + '" opacity=".85">' + esc(cap) + '</text>');

    /* specular */
    var sa = pt(C, C, 145, 200), sb = pt(C, C, 145, 320);
    s.push('<path d="M' + f(sa[0]) + ' ' + f(sa[1]) + 'A145 145 0 0 1 ' + f(sb[0]) + ' ' + f(sb[1]) + '" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="5" stroke-linecap="round"/>');
    var sc = pt(C, C, 148, 318), sd = pt(C, C, 148, 352);
    s.push('<path d="M' + f(sc[0]) + ' ' + f(sc[1]) + 'A148 148 0 0 1 ' + f(sd[0]) + ' ' + f(sd[1]) + '" fill="none" stroke="#fff" stroke-opacity=".10" stroke-width="3" stroke-linecap="round"/>');

    return '<svg viewBox="0 0 400 400" width="100%" height="100%" role="img" aria-label="Felge">' + s.join('') + '</svg>';
  }

  /* ── 4.2 carSVG ─────────────────────────────────────── */
  function carSVG(o) {
    o = o || {};
    var dark = o.variant === 'dark';
    var id = uid('c');
    var g1 = dark ? '#23262B' : '#E8EAEE', g2 = dark ? '#0E1014' : '#A9AFB8';
    var body = 'M72 362C66 330 78 300 104 288L300 250L392 246C430 244 452 232 470 212L556 150' +
      'C572 138 592 132 614 132L742 132C790 132 828 146 856 170L946 240L1058 248' +
      'C1102 252 1126 272 1132 308L1136 342C1138 366 1126 380 1104 382L1060 384' +
      'A96 96 0 0 0 868 384L452 390A104 104 0 0 0 244 390L96 388C80 386 72 376 72 362Z';
    var s = [];
    s.push('<defs><linearGradient id="bd' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + g1 + '"/><stop offset=".55" stop-color="' + g2 + '"/>' +
      '<stop offset="1" stop-color="' + (dark ? '#06070A' : '#7E858F') + '"/></linearGradient>' +
      '<filter id="gs' + id + '" x="-20%" y="-60%" width="140%" height="260%"><feGaussianBlur stdDeviation="14"/></filter></defs>');
    s.push('<ellipse cx="620" cy="452" rx="470" ry="26" fill="#05070B" opacity=".55" filter="url(#gs' + id + ')"/>');
    /* wheel wells */
    s.push('<circle cx="348" cy="384" r="112" fill="#06080C"/><circle cx="964" cy="384" r="104" fill="#06080C"/>');
    /* wheels behind body */
    s.push('<svg x="240" y="276" width="216" height="216" viewBox="0 0 400 400">' + wheelSVG({ spokes: o.spokes || 10, finish: o.wheel || 'graphite', cap: 'R', shadow: false }) + '</svg>');
    s.push('<svg x="864" y="284" width="200" height="200" viewBox="0 0 400 400">' + wheelSVG({ spokes: o.spokes || 10, finish: o.wheel || 'graphite', cap: 'R', shadow: false }) + '</svg>');
    s.push('<path d="' + body + '" fill="url(#bd' + id + ')"/>');
    /* glass */
    s.push('<path d="M486 210L562 154C578 142 596 140 616 140L738 140C780 140 814 152 838 176L910 232Z" fill="#151A22" opacity=".9"/>');
    s.push('<path d="M628 140L634 232" stroke="#0B0E13" stroke-width="5" opacity=".7"/>');
    /* shoulder specular */
    s.push('<path d="M118 288L300 252L392 248C432 246 456 234 474 214" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>');
    s.push('<path d="M470 316L1080 302" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="2"/>');
    /* lights */
    s.push('<path d="M96 300L184 286C196 284 204 290 204 300L204 312C204 320 198 324 190 324L98 322Z" fill="' + (dark ? '#8FA6FF' : '#F2F5FC') + '" opacity=".85"/>');
    s.push('<path d="M1096 292L1130 296C1136 298 1138 302 1138 308L1136 322L1094 320Z" fill="#B01018" opacity=".7"/>');
    /* sill shadow */
    s.push('<path d="M452 390L868 384" stroke="#05070B" stroke-opacity=".45" stroke-width="10"/>');
    return '<svg viewBox="0 0 1200 520" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Fahrzeug">' + s.join('') + '</svg>';
  }

  /* ── 4.3 heroSceneSVG ───────────────────────────────── */
  function heroSceneSVG(o) {
    o = o || {};
    var mob = !!o.mobile, id = uid('h');
    var W = mob ? 780 : 1440, H = mob ? 975 : 880;
    var s = [];
    s.push('<defs>');
    s.push('<linearGradient id="bg' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070B"/>' +
      '<stop offset=".55" stop-color="#0C1018"/><stop offset="1" stop-color="#101726"/></linearGradient>');
    s.push('<radialGradient id="pool' + id + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7896FF" stop-opacity=".16"/>' +
      '<stop offset="1" stop-color="#7896FF" stop-opacity="0"/></radialGradient>');
    s.push('<filter id="str' + id + '" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="26"/></filter>');
    s.push('<linearGradient id="gfade' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient>');
    s.push('<mask id="gm' + id + '"><rect x="0" y="' + (H * 0.34) + '" width="' + W + '" height="' + (H * 0.66) + '" fill="url(#gfade' + id + ')"/></mask>');
    s.push('<pattern id="grid' + id + '" width="40" height="40" patternUnits="userSpaceOnUse">' +
      '<path d="M40 0H0V40" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1"/></pattern>');
    s.push('</defs>');
    s.push('<rect width="' + W + '" height="' + H + '" fill="url(#bg' + id + ')"/>');
    s.push('<g opacity=".11" mask="url(#gm' + id + ')"><rect width="' + W + '" height="' + H + '" fill="url(#grid' + id + ')"/></g>');
    s.push('<ellipse cx="' + (W * 0.62) + '" cy="' + (H * 0.64) + '" rx="' + (W * 0.52) + '" ry="' + (H * 0.30) + '" fill="url(#pool' + id + ')"/>');
    s.push('<g filter="url(#str' + id + ')" opacity=".5">' +
      '<path d="M' + (-W * 0.1) + ' ' + (H * 0.02) + 'L' + (W * 0.52) + ' ' + (-H * 0.1) + 'L' + (W * 0.66) + ' ' + (H * 0.06) + 'L' + (W * 0.04) + ' ' + (H * 0.22) + 'Z" fill="#fff" fill-opacity=".10"/>' +
      '<path d="M' + (W * 0.2) + ' ' + (-H * 0.06) + 'L' + (W * 0.9) + ' ' + (H * 0.1) + 'L' + (W * 0.95) + ' ' + (H * 0.2) + 'L' + (W * 0.3) + ' ' + (H * 0.1) + 'Z" fill="#8FA6FF" fill-opacity=".08"/>' +
      '</g>');
    if (mob) {
      s.push('<svg x="' + (-W * 0.10) + '" y="' + (H * 0.30) + '" width="' + (W * 1.22) + '" height="' + (H * 0.50) + '" viewBox="0 0 1200 520">' + carSVG({ variant: 'light', wheel: 'graphite' }) + '</svg>');
    } else {
      s.push('<svg x="' + (W * 0.38) + '" y="' + (H * 0.24) + '" width="' + (W * 0.70) + '" height="' + (H * 0.62) + '" viewBox="0 0 1200 520">' + carSVG({ variant: 'light', wheel: 'graphite' }) + '</svg>');
    }
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">' + s.join('') + '</svg>';
  }

  /* ── 4.4 tyreSVG ────────────────────────────────────── */
  function tyreSVG(o) {
    o = o || {};
    var id = uid('t'), label = o.label || '245/45 R18 92Y', s = [];
    s.push('<defs><radialGradient id="tg' + id + '" cx="38%" cy="30%" r="78%">' +
      '<stop offset="0" stop-color="#3A3F46"/><stop offset=".6" stop-color="#1A1D22"/><stop offset="1" stop-color="#0A0B0E"/></radialGradient>' +
      '<filter id="tb' + id + '" x="-30%" y="-60%" width="160%" height="260%"><feGaussianBlur stdDeviation="9"/></filter></defs>');
    s.push('<ellipse cx="200" cy="384" rx="150" ry="14" fill="#0E1116" opacity=".18" filter="url(#tb' + id + ')"/>');
    s.push('<circle cx="200" cy="200" r="192" fill="url(#tg' + id + ')"/>');
    var tr = [];
    for (var i = 0; i < 36; i++) {
      var a = i * 10, p1 = pt(200, 200, 192, a), p2 = pt(200, 200, 168, a + 3);
      tr.push('M' + f(p1[0]) + ' ' + f(p1[1]) + 'L' + f(p2[0]) + ' ' + f(p2[1]));
    }
    s.push('<path d="' + tr.join('') + '" stroke="#07080A" stroke-width="8" stroke-linecap="round" fill="none"/>');
    s.push('<circle cx="200" cy="200" r="158" fill="none" stroke="#2B2F35" stroke-width="2"/>');
    s.push('<circle cx="200" cy="200" r="150" fill="#202429"/>');
    s.push('<circle cx="200" cy="200" r="150" fill="none" stroke="#33383F" stroke-width="1.5"/>');
    s.push('<path d="M60 250A150 150 0 0 0 340 250" fill="none" stroke="#6C737D" stroke-width=".8" opacity=".9"/>');
    s.push('<text x="200" y="300" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="17" fill="#9AA2AD" letter-spacing="1">' + esc(label) + '</text>');
    s.push('<circle cx="200" cy="200" r="96" fill="#101317"/>');
    s.push('<circle cx="200" cy="200" r="96" fill="none" stroke="#2A2E34" stroke-width="2"/>');
    s.push('<path d="M136 168A96 96 0 0 1 264 168" fill="none" stroke="#fff" stroke-opacity=".10" stroke-width="5" stroke-linecap="round"/>');
    return '<svg viewBox="0 0 400 400" width="100%" height="100%" role="img" aria-label="Reifen">' + s.join('') + '</svg>';
  }

  /* ── 4.4 brandBannerSVG ─────────────────────────────── */
  function brandBannerSVG(brand, finish, spokes) {
    var id = uid('b'), s = [];
    s.push('<defs><linearGradient id="bb' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#0E1116"/><stop offset=".62" stop-color="#1A2440"/><stop offset="1" stop-color="#1A44D4"/></linearGradient>' +
      '<pattern id="dl' + id + '" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<path d="M0 0V14" stroke="#fff" stroke-opacity=".5" stroke-width="1"/></pattern></defs>');
    s.push('<rect width="640" height="360" fill="url(#bb' + id + ')"/>');
    s.push('<rect width="640" height="360" fill="url(#dl' + id + ')" opacity=".03"/>');
    s.push('<g opacity=".72" transform="rotate(12 470 190)"><svg x="300" y="20" width="340" height="340" viewBox="0 0 400 400">' +
      wheelSVG({ spokes: spokes || 10, finish: finish || 'graphite', cap: brand.charAt(0), shadow: false }) + '</svg></g>');
    s.push('<text x="36" y="316" font-family="Lato,sans-serif" font-weight="900" font-size="34" fill="#fff" letter-spacing="-.5">' + esc(brand) + '</text>');
    s.push('<text x="36" y="66" font-family="Lato,sans-serif" font-weight="700" font-size="12" fill="#8FA6FF" letter-spacing="2.4">FELGEN MIT GUTACHTEN</text>');
    return '<svg viewBox="0 0 640 360" width="100%" height="100%" role="img" aria-label="' + esc(brand) + '">' + s.join('') + '</svg>';
  }

  /* ── 4.4 docSVG — Zulassungsbescheinigung facsimile ─── */
  function docSVG(variant) {
    var alt = variant === 'alt', s = [], id = uid('d');
    s.push('<rect width="640" height="400" fill="#F7F8FD"/>');
    s.push('<rect x="20" y="20" width="600" height="360" rx="6" fill="#E8F0E2" stroke="#BFD3B4" stroke-width="1.5"/>');
    s.push('<text x="320" y="52" text-anchor="middle" font-family="Lato,sans-serif" font-weight="700" font-size="15" fill="#2E5C39">' +
      (alt ? 'FAHRZEUGSCHEIN (alte Ausführung)' : 'ZULASSUNGSBESCHEINIGUNG TEIL I') + '</text>');
    s.push('<line x1="44" y1="66" x2="596" y2="66" stroke="#BFD3B4"/>');
    var rows = alt
      ? [['1','Fahrzeugklasse','Pkw'],['2','Hersteller','VOLKSWAGEN-VW'],['3','Typ / Schlüsselnummer zu 2','0588 / AAH'],['4','Handelsbezeichnung','GOLF'],['5','Fahrzeug-Ident.-Nr.','WVW…0759'],['6','Datum der Erstzulassung','06.07.2018']]
      : [['A','Amtl. Kennzeichen','D · WOB'],['B','Erstzulassung','06.07.2018'],['2.1','Hersteller-Schlüsselnummer','0588'],['2.2','Typ-Schlüsselnummer','AAH'],['2.3','Prüfziffer','0687'],['D.1','Marke','VOLKSWAGEN-VW']];
    rows.forEach(function (r, i) {
      var y = 86 + i * 46;
      var hi = (!alt && (r[0] === '2.1' || r[0] === '2.2')) || (alt && r[0] === '3');
      s.push('<rect x="44" y="' + y + '" width="552" height="38" rx="4" fill="#fff" fill-opacity="' + (hi ? '1' : '.55') + '" stroke="' + (hi ? (r[0] === '2.2' ? '#2E8B22' : '#1A44D4') : '#CFDCC6') + '" stroke-width="' + (hi ? 2 : 1) + '"/>');
      s.push('<text x="58" y="' + (y + 24) + '" font-family="IBM Plex Mono,monospace" font-size="12" fill="#4A5160">' + esc(r[0]) + '</text>');
      s.push('<text x="96" y="' + (y + 24) + '" font-family="Lato,sans-serif" font-size="13" fill="#0E1116">' + esc(r[1]) + '</text>');
      s.push('<text x="580" y="' + (y + 24) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-weight="500" font-size="14" fill="#0E1116">' + esc(r[2]) + '</text>');
    });
    var yH = alt ? 86 + 2 * 46 : 86 + 2 * 46, yT = alt ? 86 + 2 * 46 : 86 + 3 * 46;
    s.push('<g><rect x="-2" y="' + (yH + 2) + '" width="46" height="34" rx="17" fill="#1A44D4"/>' +
      '<text x="21" y="' + (yH + 24) + '" text-anchor="middle" font-family="Lato,sans-serif" font-weight="700" font-size="13" fill="#fff">HSN</text></g>');
    if (!alt) s.push('<g><rect x="-2" y="' + (yT + 2) + '" width="46" height="34" rx="17" fill="#2E8B22"/>' +
      '<text x="21" y="' + (yT + 24) + '" text-anchor="middle" font-family="Lato,sans-serif" font-weight="700" font-size="13" fill="#fff">TSN</text></g>');
    else s.push('<text x="52" y="' + (yT + 62) + '" font-family="Lato,sans-serif" font-size="12" fill="#4A5160">HSN und TSN stehen hier gemeinsam in Feld 3.</text>');
    return '<svg viewBox="0 0 640 400" width="100%" height="100%" role="img" aria-label="Fahrzeugschein">' + s.join('') + '</svg>';
  }

  /* ── 4.4 sceneSVG ───────────────────────────────────── */
  function sceneSVG(kind) {
    var id = uid('s'), s = [];
    if (kind === 'werkstatt') {
      s.push('<defs><linearGradient id="wk' + id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#141821"/><stop offset="1" stop-color="#090B0F"/></linearGradient>' +
        '<radialGradient id="key' + id + '" cx="30%" cy="22%" r="62%"><stop offset="0" stop-color="#FFE3B0" stop-opacity=".22"/>' +
        '<stop offset="1" stop-color="#FFE3B0" stop-opacity="0"/></radialGradient>' +
        '<filter id="wb' + id + '" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter></defs>');
      s.push('<rect width="640" height="400" fill="url(#wk' + id + ')"/>');
      s.push('<rect width="640" height="400" fill="url(#key' + id + ')"/>');
      s.push('<rect x="0" y="300" width="640" height="100" fill="#0B0E13"/>');
      s.push('<rect x="286" y="120" width="18" height="230" fill="#161A21"/>');
      s.push('<rect x="210" y="336" width="170" height="26" rx="6" fill="#1B2028"/>');
      s.push('<rect x="240" y="96" width="110" height="26" rx="4" fill="#1B2028"/>');
      s.push('<svg x="150" y="110" width="230" height="230" viewBox="0 0 400 400">' + wheelSVG({ spokes: 10, finish: 'graphite', cap: 'R', shadow: false }) + '</svg>');
      s.push('<g opacity=".5"><rect x="430" y="150" width="150" height="10" rx="3" fill="#232935"/><rect x="430" y="180" width="150" height="10" rx="3" fill="#232935"/>' +
        '<rect x="430" y="210" width="150" height="10" rx="3" fill="#232935"/></g>');
      s.push('<svg x="452" y="216" width="110" height="110" viewBox="0 0 400 400" opacity=".55">' + wheelSVG({ spokes: 5, finish: 'black', cap: 'R', shadow: false }) + '</svg>');
      s.push('<ellipse cx="270" cy="352" rx="120" ry="12" fill="#000" opacity=".5" filter="url(#wb' + id + ')"/>');
      return '<svg viewBox="0 0 640 400" width="100%" height="100%" role="img" aria-label="Werkstatt">' + s.join('') + '</svg>';
    }
    /* lager */
    s.push('<defs><linearGradient id="lg' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#0E1219"/><stop offset="1" stop-color="#05070B"/></linearGradient>' +
      '<radialGradient id="lp' + id + '" cx="50%" cy="38%" r="58%"><stop offset="0" stop-color="#7896FF" stop-opacity=".18"/>' +
      '<stop offset="1" stop-color="#7896FF" stop-opacity="0"/></radialGradient></defs>');
    s.push('<rect width="640" height="400" fill="url(#lg' + id + ')"/>');
    s.push('<rect width="640" height="400" fill="url(#lp' + id + ')"/>');
    var bands = [[0.14, '#151A23'], [0.30, '#1A2130'], [0.48, '#20293B']];
    bands.forEach(function (b, bi) {
      var y = 90 + bi * 62, op = 0.35 + bi * 0.22, sc = 46 + bi * 14;
      for (var i = 0; i < 7; i++) {
        s.push('<svg x="' + (i * 92 - bi * 26) + '" y="' + y + '" width="' + sc * 1.7 + '" height="' + sc * 1.7 + '" viewBox="0 0 400 400" opacity="' + op + '">' +
          wheelSVG({ spokes: [5, 10, 7][bi], finish: 'black', cap: '', shadow: false }) + '</svg>');
      }
      s.push('<rect x="0" y="' + (y + sc * 1.7 - 6) + '" width="640" height="12" fill="' + b[1] + '"/>');
    });
    s.push('<rect x="0" y="330" width="640" height="70" fill="#0A0D13"/>');
    s.push('<svg x="220" y="228" width="200" height="200" viewBox="0 0 400 400">' + wheelSVG({ spokes: 20, finish: 'silver', cap: 'R', shadow: false }) + '</svg>');
    return '<svg viewBox="0 0 640 400" width="100%" height="100%" role="img" aria-label="Lager">' + s.join('') + '</svg>';
  }

  /* ── technical line drawing (admin brand panel) ─────── */
  function blueprintSVG() {
    var s = [], C = 300;
    s.push('<circle cx="300" cy="300" r="250" fill="none" stroke="#fff" stroke-width="1"/>');
    s.push('<circle cx="300" cy="300" r="228" fill="none" stroke="#fff" stroke-width="1"/>');
    s.push('<circle cx="300" cy="300" r="96" fill="none" stroke="#fff" stroke-width="1"/>');
    s.push('<circle cx="300" cy="300" r="56" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="6 5"/>');
    for (var i = 0; i < 5; i++) {
      var p = pt(C, C, 96, i * 72 + 18);
      s.push('<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="16" fill="none" stroke="#fff" stroke-width="1"/>');
      s.push('<line x1="300" y1="300" x2="' + f(p[0]) + '" y2="' + f(p[1]) + '" stroke="#fff" stroke-width="1" stroke-dasharray="4 6"/>');
    }
    for (var j = 0; j < 10; j++) {
      var a = pt(C, C, 110, j * 36), b = pt(C, C, 224, j * 36);
      s.push('<line x1="' + f(a[0]) + '" y1="' + f(a[1]) + '" x2="' + f(b[0]) + '" y2="' + f(b[1]) + '" stroke="#fff" stroke-width="1"/>');
    }
    s.push('<line x1="20" y1="300" x2="580" y2="300" stroke="#fff" stroke-width="1" stroke-dasharray="10 6"/>');
    s.push('<line x1="300" y1="20" x2="300" y2="580" stroke="#fff" stroke-width="1" stroke-dasharray="10 6"/>');
    s.push('<g><line x1="300" y1="566" x2="550" y2="566" stroke="#fff" stroke-width="1"/>' +
      '<path d="M300 566l10-5v10zM550 566l-10-5v10z" fill="#fff"/>' +
      '<text x="425" y="556" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="16" fill="#fff">ET 35</text></g>');
    s.push('<text x="300" y="88" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="16" fill="#fff">LK 5/112</text>');
    s.push('<text x="300" y="286" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="14" fill="#fff">66,6</text>');
    return '<svg viewBox="0 0 600 600" width="100%" height="100%" aria-hidden="true">' + s.join('') + '</svg>';
  }

  /* ── icons — one set, 1.5px stroke, currentColor ────── */
  var P = {
    check: 'M4.5 12.5l4.5 4.5L19.5 6.5',
    'chevron-down': 'M6 9.5l6 6 6-6',
    'chevron-right': 'M9.5 6l6 6-6 6',
    'chevron-left': 'M14.5 6l-6 6 6 6',
    'arrow-right': 'M4 12h14M13.5 6.5L19 12l-5.5 5.5',
    'arrow-left': 'M20 12H6M10.5 6.5L5 12l5.5 5.5',
    search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM16.2 16.2L21 21',
    cart: 'M2.5 3.2h2.4l2.4 10.6h9.4l2.1-7.4H6.4',
    phone: 'M5.3 4h3.6l1.5 3.6-2.2 1.7a12.2 12.2 0 005.6 5.6l1.7-2.2 3.6 1.5v3.6c0 .7-.6 1.3-1.3 1.2C9.4 18.4 5.6 14.6 4.1 5.3 4 4.6 4.6 4 5.3 4z',
    whatsapp: 'M12 3.4c-4.6 0-8.3 3.3-8.3 7.3 0 2 .9 3.8 2.3 5.1l-.8 3.5 3.8-1.6c.9.3 1.9.4 3 .4 4.6 0 8.3-3.3 8.3-7.3S16.6 3.4 12 3.4z',
    mail: 'M3.2 5.2h17.6v13.6H3.2zM3.8 6.4L12 12.6l8.2-6.2',
    truck: 'M2.5 6.2h11.6v9.6H2.5zM14.1 9.4h4.2l3.2 3.2v3.2h-7.4M6.5 20a2 2 0 100-4 2 2 0 000 4zM17.5 20a2 2 0 100-4 2 2 0 000 4z',
    shield: 'M12 3l7.5 2.8v5.1c0 4.7-3.1 8-7.5 9.3-4.4-1.3-7.5-4.6-7.5-9.3V5.8L12 3zM8.5 11.8l2.5 2.5 4.7-4.8',
    document: 'M6 3h7.5L19 8.5V21H6zM13.5 3v5.5H19M9 13h6M9 16.5h6',
    filter: 'M3.5 5.5h17l-6.6 7.7V20l-3.8-2.2v-4.6z',
    close: 'M6 6l12 12M18 6L6 18',
    menu: 'M4 7h16M4 12h16M4 17h16',
    home: 'M3.6 10.4L12 3.8l8.4 6.6V20a.9.9 0 01-.9.9h-4.7v-6H9.2v6H4.5a.9.9 0 01-.9-.9z',
    wheel: 'M12 20.8a8.8 8.8 0 100-17.6 8.8 8.8 0 000 17.6zM12 14.8a2.8 2.8 0 100-5.6 2.8 2.8 0 000 5.6zM12 3.2v6M12 14.8v6M3.2 12h6M14.8 12h6',
    star: 'M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z',
    info: 'M12 20.8a8.8 8.8 0 100-17.6 8.8 8.8 0 000 17.6zM12 11v5.5M12 7.6v.2',
    warning: 'M12 3.8L21.5 20H2.5zM12 10v4.4M12 17v.2',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    trash: 'M4.5 6.5h15M9 6.5V4h6v2.5M6.5 6.5L7.6 20h8.8l1.1-13.5M10 10v6.5M14 10v6.5',
    eye: 'M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
    'eye-off': 'M4 4l16 16M9.6 9.7A3 3 0 0012 15a3 3 0 002.3-1.1M6.3 7C3.9 8.6 2.5 12 2.5 12s3.5 6.2 9.5 6.2c1.6 0 3-.4 4.2-1M17.4 16.3c2.6-1.6 4.1-4.3 4.1-4.3s-3.5-6.2-9.5-6.2c-.8 0-1.5.1-2.2.3',
    lock: 'M6 10.5h12V21H6zM8.6 10.5V7.4a3.4 3.4 0 016.8 0v3.1',
    user: 'M12 12.2a4 4 0 100-8 4 4 0 000 8zM4.5 20.5c.6-3.6 3.8-5.6 7.5-5.6s6.9 2 7.5 5.6',
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    box: 'M3.5 7.5L12 3.5l8.5 4v9L12 20.5l-8.5-4zM3.5 7.5L12 11.5l8.5-4M12 11.5v9',
    chart: 'M4 20V9M10 20V4M16 20v-7M22 20H2',
    settings: 'M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4zM19.4 13.6l1.8 1.4-1.8 3.1-2.2-.7a7.5 7.5 0 01-1.8 1l-.4 2.3h-3.6l-.4-2.3a7.5 7.5 0 01-1.8-1l-2.2.7-1.8-3.1 1.8-1.4a7.6 7.6 0 010-2.1L2.8 8.9l1.8-3.1 2.2.7a7.5 7.5 0 011.8-1l.4-2.3h3.6l.4 2.3c.6.3 1.2.6 1.8 1l2.2-.7 1.8 3.1-1.8 1.4c.1.7.1 1.4 0 2.1z',
    logout: 'M9 4.5H4.5v15H9M15 8l4 4-4 4M19 12H8.5',
    share: 'M6 14.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM17.5 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM17.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM8.2 10.8l7.1-3.6M8.2 13.2l7.1 3.6',
    print: 'M7 9V3.5h10V9M7 18.5H4.5V9h15v9.5H17M7 14.5h10V21H7z',
    bell: 'M12 3.5a5.5 5.5 0 00-5.5 5.5c0 5-2 6.5-2 6.5h15s-2-1.5-2-6.5A5.5 5.5 0 0012 3.5zM10.3 19a2 2 0 003.4 0',
    copy: 'M8.5 8.5h11v11h-11zM5.5 15.5h-1v-11h11v1'
  };
  function icon(name, size, cls) {
    var d = P[name] || P.info;
    return '<svg class="' + (cls || '') + '" width="' + (size || 24) + '" height="' + (size || 24) + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  }
  function checkGlyph(size, bg) {
    var s = size || 20;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 20 20" fill="none" aria-hidden="true" style="flex:none">' +
      '<circle cx="10" cy="10" r="10" fill="' + (bg || '#1A44D4') + '"/>' +
      '<path d="M5.8 10.3l2.7 2.7 5.7-5.9" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function stars(n, size) {
    var out = '', s = size || 14;
    for (var i = 0; i < 5; i++) out += '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="' + (i < n ? '#F9C112' : '#E5E5E5') + '" aria-hidden="true"><path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z"/></svg>';
    return '<span style="display:inline-flex;gap:1px;vertical-align:-2px">' + out + '</span>';
  }

  /* ── photography ─────────────────────────────────────
     Real Unsplash photos by URL. Every photo sits on top of the drawn SVG,
     so a blocked or slow image never leaves an empty box.               */
  function u(id, w) { return 'https://unsplash.com/photos/' + id + '/download?force=true&w=' + (w || 1200); }
  var PHOTO = {
    hero:      u('pQ0_oAtnDqI', 2000),
    heroM:     u('odmg2fspBBU', 1200),
    checkCar:  u('7L2-sf19x78', 1600),
    lager:     u('ENHqkZBMTMA', 1400),
    werkstatt: 'https://images.unsplash.com/photo-1761040100208-07f603acc83f?auto=format&fit=crop&w=1400&q=80',
    tyre:      u('l9riyueOA2k', 900),
    adminPanel: 'https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?auto=format&fit=crop&w=1600&q=80',
    wheels: [
      'https://images.unsplash.com/photo-1761040100208-07f603acc83f?auto=format&fit=crop&w=900&q=80',
      u('zAfKgmZIbSU', 900), u('l9riyueOA2k', 900), u('ENHqkZBMTMA', 900),
      u('m8zQivdifx8', 900), u('pQ0_oAtnDqI', 900)
    ],
    banners: [u('m8zQivdifx8', 1200), u('zAfKgmZIbSU', 1200), u('l9riyueOA2k', 1200), u('ENHqkZBMTMA', 1200)]
  };

  /** Photo layered over an SVG fallback. Fills its (positioned) container. */
  function photo(url, alt, fallback, pos, inset, filter) {
    return '<div style="position:absolute;inset:0;overflow:hidden">' +
      '<div data-fb style="position:absolute;inset:' + (inset || '0') + ';opacity:0">' + (fallback || '') + '</div>' +
      '<img src="' + url + '" alt="' + esc(alt) + '" decoding="async" ' +
      'onerror="var p=this.parentNode.querySelector(\'[data-fb]\');if(p)p.style.opacity=1;this.remove()" ' +
      'style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;' +
      (filter ? 'filter:' + filter + ';' : '') +
      'object-position:' + (pos || 'center') + '">' +
      '</div>';
  }

  /** Admin brand panel: dark workshop photograph + construction lines + scrim. */
  function loginArt(mobile) {
    return '<div style="position:absolute;inset:0;overflow:hidden">' +
      photo(PHOTO.adminPanel, 'Fahrzeug in der RIMIFY-Werkstatt',
        sceneSVG('werkstatt'), mobile ? '62% 52%' : '72% 56%', '0',
        'grayscale(.4) contrast(1.06) brightness(.62)') +
      '<div style="position:absolute;inset:0;background:' +
        (mobile
          ? 'linear-gradient(180deg,rgba(6,8,12,.78),rgba(6,8,12,.4) 45%,rgba(6,8,12,.88))'
          : 'linear-gradient(104deg,rgba(6,8,12,.94) 0%,rgba(6,8,12,.78) 38%,rgba(8,12,22,.5) 74%,rgba(10,16,30,.34) 100%)') +
        '"></div>' +
      '<div style="position:absolute;inset:' + (mobile ? '-30% -18%' : '-12% -22% -18% -14%') +
        ';opacity:.13;mix-blend-mode:screen;pointer-events:none">' + blueprintSVG() + '</div>' +
      '<div style="position:absolute;inset:0;background:radial-gradient(60% 45% at 78% 28%,rgba(120,150,255,.16),transparent 70%)"></div>' +
      '</div>';
  }

  var LOGO = {
    'BMW': 'https://cdn.simpleicons.org/bmw/0E1116',
    'AUDI': 'https://cdn.simpleicons.org/audi/0E1116',
    'MERCEDES': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg',
    'VW': 'https://cdn.simpleicons.org/volkswagen/0E1116',
    'PORSCHE': 'https://cdn.simpleicons.org/porsche/0E1116',
    'OPEL': 'https://cdn.simpleicons.org/opel/0E1116',
    'FORD': 'https://cdn.simpleicons.org/ford/0E1116',
    'ŠKODA': 'https://cdn.simpleicons.org/skoda/0E1116'
  };

  /** Manufacturer mark, tinted to one ink; falls back to the wordmark if the file fails. */
  function makeLogo(name, h) {
    var src = LOGO[name];
    var fb = '<b style=\'font:900 ' + Math.round(h * .42) + 'px/1 Lato,sans-serif;letter-spacing:.06em;color:var(--ink)\'>' + esc(name) + '</b>';
    if (!src) return fb;
    return '<img src="' + src + '" alt="' + esc(name) + '" ' +
      'style="width:' + h + 'px;height:' + h + 'px;object-fit:contain;flex:none;' +
      (name === 'MERCEDES' ? 'filter:brightness(0);' : '') + '" ' +
      'onerror="this.parentNode.innerHTML=&quot;' + fb.replace(/"/g, '&quot;') + '&quot;">';
  }

  w.ART = {
    makeLogo: makeLogo,
    wheelSVG: wheelSVG, carSVG: carSVG, heroSceneSVG: heroSceneSVG, tyreSVG: tyreSVG,
    brandBannerSVG: brandBannerSVG, docSVG: docSVG, sceneSVG: sceneSVG, blueprintSVG: blueprintSVG,
    loginArt: loginArt,
    icon: icon, checkGlyph: checkGlyph, stars: stars, photo: photo, PHOTO: PHOTO
  };
})(window);
