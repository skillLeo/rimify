/* RIMIFY — seed data */
(function (w) {
  'use strict';

  var eur = function (n) {
    return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  };
  var dec = function (n, d) {
    return n.toLocaleString('de-DE', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  };

  /* ── 12 wheels ─────────────────────────────────────── */
  var wheels = [
    { sku:'BOR-HAV-GRM', brand:'BORBET', model:'Havanna', finish:'graphite', finishName:'Graphite matt',
      spokes:20, design:'Mehrspeichen', sizes:[17,18,19,20], widths:[7.5,8,8.5,9], et:35, price:750.29,
      rating:4.8, reviews:555, stock:'in', verdict:'ok', conditions:[], sale:false, blocked:[] },
    { sku:'OZ-STG-SIL', brand:'OZ RACING', model:'Superturismo GT', finish:'silver', finishName:'Matt Race Silver',
      spokes:10, design:'Y-Speiche', sizes:[17,18,19], widths:[7.5,8,8.5], et:40, price:689.00,
      rating:4.7, reviews:312, stock:'in', verdict:'ok', conditions:[], sale:true, blocked:[17] },
    { sku:'ALU-MON-BLK', brand:'ALUTEC', model:'Monstr', finish:'black', finishName:'Racing Schwarz',
      spokes:5, design:'Fünfspeiche', sizes:[18,19,20], widths:[8,8.5,9], et:45, price:812.40,
      rating:4.6, reviews:198, stock:'in', verdict:'conditional', sale:false, blocked:[],
      conditions:['Eintragung in die Fahrzeugpapiere erforderlich.','Nur mit den angegebenen Radschrauben zulässig.'] },
    { sku:'BBS-CIR-PLA', brand:'BBS', model:'CI-R', finish:'polished', finishName:'Platinum Silber',
      spokes:10, design:'Kreuzspeiche', sizes:[18,19,20], widths:[8,8.5,9.5], et:32, price:1196.00,
      rating:4.9, reviews:87, stock:'out', verdict:'ok', conditions:[], sale:false, blocked:[20] },
    { sku:'YID-GRP-BRZ', brand:'YIDO', model:'Grip', finish:'bronze', finishName:'Bronze matt',
      spokes:7, design:'Fünfspeiche', sizes:[18,19], widths:[8,8.5], et:38, price:729.50,
      rating:4.4, reviews:141, stock:'in', verdict:'ok', conditions:[], sale:false, blocked:[] },
    { sku:'ROT-KPS-BLK', brand:'rotiform', model:'KPS', finish:'black', finishName:'Tiefschwarz glänzend',
      spokes:5, design:'Fünfspeiche', sizes:[17,18,19], widths:[7.5,8,8.5], et:30, price:865.00,
      rating:4.5, reviews:203, stock:'in', verdict:'conditional', sale:false, blocked:[],
      conditions:['Bördeln der Radläufe erforderlich.','Eintragung in die Fahrzeugpapiere erforderlich.'] },
    { sku:'BOR-HAV-SIL', brand:'BORBET', model:'Havanna', finish:'silver', finishName:'Brillantsilber',
      spokes:20, design:'Mehrspeichen', sizes:[17,18,19], widths:[7.5,8,8.5], et:35, price:718.90,
      rating:4.7, reviews:412, stock:'in', verdict:'ok', conditions:[], sale:true, blocked:[] },
    { sku:'OZ-STG-BLK', brand:'OZ RACING', model:'Superturismo GT', finish:'black', finishName:'Matt Black',
      spokes:10, design:'Y-Speiche', sizes:[18,19,20], widths:[8,8.5,9], et:42, price:934.00,
      rating:4.8, reviews:266, stock:'in', verdict:'ok', conditions:[], sale:false, blocked:[] },
    { sku:'ALU-MON-GRM', brand:'ALUTEC', model:'Monstr', finish:'graphite', finishName:'Graphit poliert',
      spokes:5, design:'Fünfspeiche', sizes:[19,20], widths:[8.5,9], et:45, price:889.00,
      rating:4.2, reviews:64, stock:'out', verdict:'ok', conditions:[], sale:false, blocked:[] },
    { sku:'BBS-CIR-BRZ', brand:'BBS', model:'CI-R', finish:'bronze', finishName:'Satin Bronze',
      spokes:10, design:'Kreuzspeiche', sizes:[18,19,20], widths:[8,8.5,9.5], et:32, price:1149.00,
      rating:4.9, reviews:118, stock:'in', verdict:'conditional', sale:false, blocked:[],
      conditions:['Verwendung von Schneeketten nicht zulässig.'] },
    { sku:'YID-GRP-POL', brand:'YIDO', model:'Grip', finish:'polished', finishName:'Hochglanz poliert',
      spokes:7, design:'Fünfspeiche', sizes:[17,18,19,20], widths:[7.5,8,8.5,9], et:38, price:798.00,
      rating:4.3, reviews:95, stock:'in', verdict:'ok', conditions:[], sale:false, blocked:[17] },
    { sku:'ROT-KPS-GRM', brand:'rotiform', model:'KPS', finish:'graphite', finishName:'Anthrazit matt',
      spokes:5, design:'Fünfspeiche', sizes:[18,19,20], widths:[8,8.5,9], et:30, price:902.50,
      rating:4.6, reviews:177, stock:'in', verdict:'ok', conditions:[], sale:true, blocked:[] }
  ];

  /* ── tyres ─────────────────────────────────────────── */
  var tyres = [
    { brand:'NEXEN TIRES', model:'N Fera Sport', season:'Sommerreifen', size:'245/45 R18 92Y', price:1599.15, rating:5, reviews:15, best:true },
    { brand:'NEXEN TIRES', model:'N Blue 4Season', season:'Ganzjahresreifen', size:'245/45 R18 92Y', price:1489.00, rating:5, reviews:15, best:false },
    { brand:'BRIDGESTONE', model:'Potenza Sport', season:'Sommerreifen', size:'245/45 R18 96Y', price:1812.40, rating:5, reviews:42, best:false },
    { brand:'CONTINENTAL', model:'PremiumContact 7', season:'Sommerreifen', size:'245/45 R18 92Y', price:1725.00, rating:5, reviews:88, best:false },
    { brand:'MICHELIN', model:'Pilot Sport 5', season:'Sommerreifen', size:'245/45 R18 96Y', price:1968.00, rating:5, reviews:61, best:false },
    { brand:'BRIDGESTONE', model:'Blizzak LM005', season:'Winterreifen', size:'225/35 R18 87V', price:1394.00, rating:4, reviews:27, best:false }
  ];

  /* ── makes → models → variants ─────────────────────── */
  var makes = [
    { name:'BMW', models:[
      { name:'3er Coupe', variants:[
        { name:'320i Coupe', years:'1997–1999', kw:110, ps:150, body:'Coupé', vmax:216, hsn:'0005', tsn:'582' },
        { name:'328i Coupe', years:'1997–2000', kw:142, ps:193, body:'Coupé', vmax:240, hsn:'0005', tsn:'583' } ] },
      { name:'M4', variants:[
        { name:'M4 Competition F82', years:'2016–2020', kw:331, ps:450, body:'Coupé', vmax:290, hsn:'0005', tsn:'CJH' },
        { name:'M4 F82', years:'2014–2016', kw:317, ps:431, body:'Coupé', vmax:250, hsn:'0005', tsn:'CJG' } ] },
      { name:'Z8', variants:[
        { name:'Z8 4.9 E52', years:'1999–2003', kw:294, ps:400, body:'Roadster', vmax:250, hsn:'0005', tsn:'674' } ] },
      { name:'5er Touring', variants:[
        { name:'530d Touring G31', years:'2017–2020', kw:195, ps:265, body:'Kombi', vmax:250, hsn:'0005', tsn:'BPH' } ] } ] },
    { name:'Audi', models:[
      { name:'RS 4 Avant', variants:[
        { name:'RS 4 Avant Quattro B9', years:'03/2018–11/2019', kw:331, ps:450, body:'Kombi', vmax:280, hsn:'1860', tsn:'AAS', vsn:'00001' },
        { name:'RS 4 Avant Quattro B9 FL', years:'12/2019–heute', kw:331, ps:450, body:'Kombi', vmax:290, hsn:'1860', tsn:'AAS', vsn:'00017' },
        { name:'RS4 2.7 Avant B5', years:'2000–2001', kw:279, ps:380, body:'Kombi', vmax:250, hsn:'7967', tsn:'307' } ] },
      { name:'A3 Sportback', variants:[
        { name:'A3 Sportback 35 TFSI', years:'2020–heute', kw:110, ps:150, body:'Schrägheck', vmax:224, hsn:'0588', tsn:'AAH' } ] },
      { name:'Q5', variants:[
        { name:'Q5 40 TDI quattro', years:'2019–heute', kw:150, ps:204, body:'SUV', vmax:222, hsn:'0588', tsn:'BLQ' } ] } ] },
    { name:'Mercedes-Benz', models:[
      { name:'C-Klasse', variants:[
        { name:'C 220 d W205', years:'2018–2021', kw:143, ps:194, body:'Limousine', vmax:245, hsn:'1313', tsn:'HGX' },
        { name:'C 300 W206', years:'2021–heute', kw:190, ps:258, body:'Limousine', vmax:250, hsn:'1313', tsn:'KTA' } ] },
      { name:'A-Klasse', variants:[
        { name:'A 200 W177', years:'2018–heute', kw:120, ps:163, body:'Schrägheck', vmax:225, hsn:'1313', tsn:'HPN' } ] },
      { name:'GLC', variants:[
        { name:'GLC 300 d 4MATIC', years:'2019–2022', kw:180, ps:245, body:'SUV', vmax:238, hsn:'1313', tsn:'JBB' } ] } ] },
    { name:'Volkswagen', models:[
      { name:'Golf', variants:[
        { name:'Golf VIII 1.5 TSI', years:'2020–heute', kw:110, ps:150, body:'Schrägheck', vmax:224, hsn:'0603', tsn:'CKF' },
        { name:'Golf VII GTI', years:'2013–2020', kw:169, ps:230, body:'Schrägheck', vmax:250, hsn:'0603', tsn:'BGV' } ] },
      { name:'Passat Variant', variants:[
        { name:'Passat Variant 2.0 TDI B8', years:'2019–2023', kw:110, ps:150, body:'Kombi', vmax:216, hsn:'0603', tsn:'BZK' } ] },
      { name:'Fox', variants:[
        { name:'Fox 1.2 5Z', years:'2005–2011', kw:40, ps:55, body:'Schrägheck', vmax:148, hsn:'0603', tsn:'AAT' } ] } ] },
    { name:'Porsche', models:[
      { name:'911', variants:[
        { name:'911 Carrera 992', years:'2019–heute', kw:283, ps:385, body:'Coupé', vmax:293, hsn:'0583', tsn:'AKQ' } ] },
      { name:'Macan', variants:[
        { name:'Macan S', years:'2019–heute', kw:260, ps:354, body:'SUV', vmax:259, hsn:'0583', tsn:'ADH' } ] },
      { name:'928', variants:[
        { name:'928 4.5', years:'1977–1982', kw:177, ps:240, body:'Coupé', vmax:230, hsn:'0583', tsn:'344' } ] } ] },
    { name:'Opel', models:[
      { name:'Astra', variants:[
        { name:'Astra L 1.2 Turbo', years:'2022–heute', kw:96, ps:130, body:'Schrägheck', vmax:210, hsn:'1844', tsn:'BAT' } ] },
      { name:'Insignia', variants:[
        { name:'Insignia Sports Tourer 2.0', years:'2017–2022', kw:147, ps:200, body:'Kombi', vmax:235, hsn:'1844', tsn:'AGR' } ] },
      { name:'Corsa', variants:[
        { name:'Corsa F 1.2', years:'2019–heute', kw:55, ps:75, body:'Schrägheck', vmax:174, hsn:'1844', tsn:'AZP' } ] } ] },
    { name:'Ford', models:[
      { name:'Focus', variants:[
        { name:'Focus ST Mk4', years:'2019–heute', kw:206, ps:280, body:'Schrägheck', vmax:250, hsn:'8566', tsn:'BQK' } ] },
      { name:'Kuga', variants:[
        { name:'Kuga 2.5 PHEV', years:'2020–heute', kw:165, ps:225, body:'SUV', vmax:200, hsn:'8566', tsn:'BRD' } ] },
      { name:'Mustang', variants:[
        { name:'Mustang GT 5.0', years:'2018–2023', kw:331, ps:450, body:'Coupé', vmax:250, hsn:'8566', tsn:'AXP' } ] } ] },
    { name:'Škoda', models:[
      { name:'Octavia', variants:[
        { name:'Octavia Combi 2.0 TDI', years:'2020–heute', kw:110, ps:150, body:'Kombi', vmax:224, hsn:'8004', tsn:'BAH' } ] },
      { name:'Superb', variants:[
        { name:'Superb Combi 2.0 TSI 4x4', years:'2019–2023', kw:200, ps:272, body:'Kombi', vmax:250, hsn:'8004', tsn:'AQM' } ] },
      { name:'Kodiaq', variants:[
        { name:'Kodiaq 2.0 TDI 4x4', years:'2021–heute', kw:147, ps:200, body:'SUV', vmax:215, hsn:'8004', tsn:'BDF' } ] } ] }
  ];

  /* ── HSN/TSN lookup ────────────────────────────────── */
  var keyIndex = [];
  makes.forEach(function (mk) {
    mk.models.forEach(function (md) {
      md.variants.forEach(function (v) {
        if (!v.hsn) return;
        keyIndex.push({
          id: (v.hsn + '-' + v.tsn + '-' + (v.vsn || md.name)).replace(/\s+/g, ''),
          make: mk.name, model: md.name, variant: v.name,
          label: mk.name + ' ' + md.name + ' ' + v.name.replace(mk.name + ' ', ''),
          short: mk.name + ' ' + md.name,
          hsn: v.hsn, tsn: v.tsn, vsn: v.vsn || null,
          years: v.years, kw: v.kw, ps: v.ps, body: v.body, vmax: v.vmax
        });
      });
    });
  });

  function lookup(hsn, tsn) {
    var h = String(hsn || '').trim().toUpperCase();
    var t = String(tsn || '').trim().toUpperCase();
    return keyIndex.filter(function (v) { return v.hsn === h && v.tsn === t; });
  }

  /* ── FAQ ───────────────────────────────────────────── */
  var faq = [
    { g:'KOMPATIBILITÄT & FREIGABE', q:'Was ist RIMIFY?',
      a:'RIMIFY ist ein Felgenshop für den deutschen Markt. Du gibst dein Fahrzeug an, wir zeigen dir ausschließlich Felgen, die für genau dieses Fahrzeug eine gültige Freigabe haben. Reifen und fertig montierte Kompletträder bekommst du auf Wunsch dazu.' },
    { g:'KOMPATIBILITÄT & FREIGABE', q:'Woher weiß ich, ob eine Felge zu meinem Auto passt?',
      a:'Sobald du dein Fahrzeug gewählt hast, prüfen wir jede Felge gegen das zugehörige Gutachten – Felgenbreite, Einpresstiefe, zulässige Reifengrößen und Auflagen. Was dir angezeigt wird, ist freigegeben. Einzelne Kombinationen kannst du jederzeit über RIMIFY-CHECK nachprüfen.' },
    { g:'KOMPATIBILITÄT & FREIGABE', q:'Was bedeutet „Eintragung erforderlich“?',
      a:'Bei manchen Felgen verlangt das Gutachten, dass die Änderung von einer amtlich anerkannten Prüfstelle abgenommen und in die Fahrzeugpapiere eingetragen wird. Wir weisen darauf hin, bevor du die Felge in den Warenkorb legst – und du kannst gezielt nach Felgen ohne Eintragungspflicht filtern.' },
    { g:'KOMPATIBILITÄT & FREIGABE', q:'Wo finde ich HSN und TSN in meinen Fahrzeugpapieren?',
      a:'In der Zulassungsbescheinigung Teil I stehen sie in den Feldern 2.1 (HSN, vierstellig) und 2.2 (TSN, dreistellig). Im älteren Fahrzeugschein stehen dieselben Nummern an anderer Stelle – beide Varianten zeigen wir dir in der Fahrzeugauswahl.' },
    { g:'KOMPATIBILITÄT & FREIGABE', q:'Was ist, wenn zu meiner Schlüsselnummer mehrere Fahrzeuge angezeigt werden?',
      a:'Das ist normal. Eine Kombination aus HSN und TSN kann mehrere Varianten umfassen, die sich in Bauzeitraum, Leistung oder Achslast unterscheiden. Wir fragen dann kurz nach, weil genau diese Unterschiede darüber entscheiden, welche Reifen zulässig sind.' },
    { g:'BESTELLUNG & VERSAND', q:'Was ist ein Komplettrad und was ist enthalten?',
      a:'Ein Komplettrad ist eine Felge mit bereits aufgezogenem und gewuchtetem Reifen. Enthalten sind Montage, Wuchten, Ventile, Anbauset und ABE. Du musst die Räder nur noch anschrauben.' },
    { g:'BESTELLUNG & VERSAND', q:'Wie lange dauert die Lieferung?',
      a:'Lagerware verlässt unser Haus in der Regel innerhalb von ein bis zwei Werktagen, Kompletträder innerhalb von zwei bis vier Werktagen, da sie montiert und gewuchtet werden. Das voraussichtliche Lieferdatum siehst du im Warenkorb.' },
    { g:'BESTELLUNG & VERSAND', q:'Kann ich Felgen zurückgeben?',
      a:'Ja. Es gilt das gesetzliche Widerrufsrecht von 14 Tagen. Montierte und gefahrene Kompletträder können wir nur zurücknehmen, wenn sie unbeschädigt und unbenutzt sind. Melde dich einfach vorher kurz bei uns.' }
  ];

  var warum = [
    { icon:'shield', t:'Geprüfte Freigabe, kein Risiko',
      b:'Jede Felge, die wir dir zeigen, ist für dein Fahrzeug durch ein Gutachten freigegeben. Auflagen nennen wir im Klartext – vor dem Kauf, nicht danach. Das Gutachten kannst du auf jeder Produktseite herunterladen.' },
    { icon:'wheel', t:'Komplettrad, fertig montiert',
      b:'Auf Wunsch ziehen wir die Reifen auf und wuchten die Räder bei uns im Haus. Du bekommst fertige Räder inklusive Ventilen, Anbauset und ABE – auspacken, anschrauben, losfahren.' },
    { icon:'truck', t:'Versand aus Deutschland',
      b:'Über 150 Modelle liegen bei uns auf Lager. Bestellungen bis 14 Uhr gehen am selben Werktag raus, versichert mit DHL. Fragen beantworten wir am Telefon, nicht per Formularbrief.' }
  ];

  var orders = [
    { nr:'RMF-2026-04711', kunde:'M. Hartmann', fzg:'BMW 3er Coupe', total:1425.00, status:'BEZAHLT' },
    { nr:'RMF-2026-04710', kunde:'S. Weiß', fzg:'Audi RS 4 Avant', total:2189.00, status:'IN BEARBEITUNG' },
    { nr:'RMF-2026-04709', kunde:'T. Bergmann', fzg:'VW Golf VIII', total:864.50, status:'VERSENDET' },
    { nr:'RMF-2026-04708', kunde:'K. Lorenz', fzg:'Porsche Macan S', total:3120.00, status:'PROBLEM' },
    { nr:'RMF-2026-04707', kunde:'A. Neumann', fzg:'Mercedes C-Klasse', total:1078.90, status:'BEZAHLT' },
    { nr:'RMF-2026-04706', kunde:'J. Kraus', fzg:'Škoda Octavia', total:932.00, status:'STORNIERT' }
  ];

  var aktivitaet = [
    { who:'Stefan M.', what:'Gutachten ABE 47231 veröffentlicht', when:'vor 12 Min.' },
    { who:'Import', what:'PKW-Liste eingelesen · 25 Fahrzeuge geprüft', when:'heute 04:12' },
    { who:'Nadine K.', what:'Konflikt bei BBS CI-R 9,5J gemeldet', when:'gestern 17:40' },
    { who:'Stefan M.', what:'Preis BORBET Havanna 18" angepasst', when:'gestern 15:02' },
    { who:'System', what:'Bestand OZ Superturismo unter Schwelle', when:'gestern 09:18' }
  ];

  var legal = [
    { id:'impressum', t:'Impressum', h:['Angaben gemäß § 5 TMG','Vertreten durch','Kontakt','Umsatzsteuer-ID','Streitschlichtung'] },
    { id:'datenschutz', t:'Datenschutz', h:['Verantwortliche Stelle','Erhebung und Verarbeitung','Cookies und Reichweitenmessung','Deine Rechte','Aufbewahrungsfristen'] },
    { id:'agb', t:'AGB', h:['Geltungsbereich','Vertragsschluss','Preise und Versandkosten','Lieferung','Eigentumsvorbehalt','Gewährleistung'] },
    { id:'widerruf', t:'Widerrufsbelehrung', h:['Widerrufsrecht','Folgen des Widerrufs','Muster-Widerrufsformular','Ausschluss des Widerrufsrechts'] },
    { id:'versand', t:'Versand', h:['Versandkosten','Lieferzeiten','Kompletträder','Speditionsversand','Sendungsverfolgung'] }
  ];

  w.RMF = {
    wheels: wheels, tyres: tyres, makes: makes, keyIndex: keyIndex, lookup: lookup,
    faq: faq, warum: warum, orders: orders, aktivitaet: aktivitaet, legal: legal,
    eur: eur, dec: dec,
    brands: ['BBS','YIDO','BORBET','OZ RACING','ALUTEC','rotiform'],
    tiles: ['BMW','AUDI','MERCEDES','VW','PORSCHE','OPEL','FORD','ŠKODA'],
    trust: ['Über 150 Modelle auf Lager','Gutachten zu jeder Felge','Versand aus Deutschland','Komplettrad montiert & gewuchtet'],
    footerLine: 'RIMIFY liefert Felgen und Kompletträder für den deutschen Markt. Jede Felge mit gültigem Gutachten, jedes Rad geprüft, montiert und gewuchtet – versendet aus Deutschland.',
    kontaktIntro: 'Fragen zur Passgenauigkeit, zu einer Bestellung oder zu einem Gutachten? Schreib uns oder ruf einfach an – wir antworten in der Regel noch am selben Werktag.',
    pages: [
      ['startseite','Startseite'],['felgen-suchen','Felgen suchen'],['felgen','Felgen (PLP)'],
      ['produkt','Produkt (PDP)'],['rimify-check','RIMIFY-CHECK'],['check-ergebnis','Check-Ergebnis'],
      ['warenkorb','Warenkorb'],['kasse','Kasse'],['bestellung','Bestellbestätigung'],
      ['faq','FAQ'],['kontakt','Kontakt'],['rechtliches','Rechtliches'],['404','404'],
      ['admin-anmelden','Admin · Anmelden'],['admin-dashboard','Admin · Dashboard'],
      ['admin-gutachten','Admin · Gutachten'],['admin-rollen','Admin · Rollen']
    ]
  };
})(window);
