import{S as e,m as t,v as n}from"./app-C-ynDaOw.js";import{t as r}from"./_plugin-vue_export-helper-BDNMzG2s.js";var i=[`innerHTML`],a=r(n({__name:`Svg`,props:{markup:{}},setup(n){return(r,a)=>(e(),t(`span`,{class:`art`,innerHTML:n.markup},null,8,i))}}),[[`__scopeId`,`data-v-87a8f36b`]]),o={graphite:{lipFrom:`#3A3E45`,lipTo:`#1C1F24`,face:`#2A2E34`,spokeLight:`#565B63`},silver:{lipFrom:`#D8DBE0`,lipTo:`#9BA1AA`,face:`#C3C8CF`,spokeLight:`#F1F3F6`},black:{lipFrom:`#1A1C20`,lipTo:`#0A0B0D`,face:`#16181C`,spokeLight:`#34373D`},bronze:{lipFrom:`#8A6A3C`,lipTo:`#4E3A1F`,face:`#6F552F`,spokeLight:`#B9915A`},polished:{lipFrom:`#E9ECEF`,lipTo:`#A8AEB6`,face:`#D5DAE0`,spokeLight:`#FFFFFF`}};Object.keys(o);function s(e){return e in o}function c(e){return s(e)?o[e]:o.graphite}function l(...e){let t=e.join(`|`),n=2166136261;for(let e=0;e<t.length;e++)n^=t.charCodeAt(e),n=Math.imul(n,16777619);return(n>>>0).toString(36)}function u(e,t,n,r){let i=r*Math.PI/180;return[d(e+n*Math.cos(i)),d(t+n*Math.sin(i))]}function d(e){return Math.round(e*1e3)/1e3}function f(e,t,n,r,i){let[a,o]=u(e,t,n,r),[s,c]=u(e,t,n,i);return`M${a} ${o} A${n} ${n} 0 ${+(Math.abs(i-r)>180)} ${+(i>r)} ${s} ${c}`}var p=200,m=.18,h=.32;function g(e={}){let t=_(e.spokes??5),n=e.finish??`graphite`,r=e.size??400,i=c(n),a=l(`wheel`,t,n,e.tyre===!0,e.initial??``),o=(e.initial??`R`).slice(0,1).toUpperCase();return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${r}" height="${r}" ${e.title?`role="img" aria-label="${k(e.title)}"`:`role="presentation" aria-hidden="true"`} focusable="false">
${v(a,i.lipFrom,i.lipTo,i.face,i.spokeLight)}
${y(a)}
${e.tyre===!0?b():``}
${x(a)}
${S()}
${C(a)}
${w(t,a,i.spokeLight)}
${T(i.spokeLight)}
${E(a,o,i.spokeLight)}
${D()}
</svg>`}function _(e){return[5,7,10,20].reduce((t,n)=>Math.abs(n-e)<Math.abs(t-e)?n:t)}function v(e,t,n,r,i){return`<defs>
  <linearGradient id="lip-${e}" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(-45 .5 .5)">
    <stop offset="0" stop-color="${t}"/>
    <stop offset="1" stop-color="${n}"/>
  </linearGradient>
  <radialGradient id="face-${e}" cx="38%" cy="32%" r="78%">
    <stop offset="0" stop-color="${i}" stop-opacity=".55"/>
    <stop offset=".45" stop-color="${r}"/>
    <stop offset="1" stop-color="${r}" stop-opacity=".92"/>
  </radialGradient>
  <radialGradient id="cap-${e}" cx="36%" cy="30%" r="80%">
    <stop offset="0" stop-color="${i}"/>
    <stop offset="1" stop-color="${n}"/>
  </radialGradient>
  <filter id="soft-${e}" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="10"/>
  </filter>
</defs>`}function y(e){return`<ellipse cx="200" cy="378" rx="150" ry="14" fill="#0E1116" opacity=".16" filter="url(#soft-${e})"/>`}function b(){let e=[];for(let t=0;t<28;t++){let n=t*360/28,[r,i]=u(p,p,158,n),[a,o]=u(p,p,192,n);e.push(`<line x1="${r}" y1="${i}" x2="${a}" y2="${o}"/>`)}return`<path d="M200 4 A196 196 0 1 1 199.9 4 Z M200 50 A150 150 0 1 0 200.1 50 Z" fill="#15171B" fill-rule="evenodd"/>
<g stroke="#0B0C0F" stroke-width="7" stroke-linecap="butt">${e.join(``)}</g>`}function x(e){return`<circle cx="200" cy="200" r="150" fill="url(#lip-${e})"/>`}function S(){return`<circle cx="200" cy="200" r="138" fill="#000" opacity=".35"/>`}function C(e){return`<circle cx="200" cy="200" r="132" fill="url(#face-${e})"/>`}function w(e,t,n){let r=360/e,i=r*m,a=r*h,[o,s]=u(p,p,44,-90-i),[c,l]=u(p,p,128,-90-a),[f,g]=u(p,p,128,-90+a),[_,v]=u(p,p,44,-90+i),y=`M${o} ${s} L${c} ${l} A128 128 0 0 1 ${f} ${g} L${_} ${v} A44 44 0 0 0 ${o} ${s} Z`,b=`<path d="${y}" fill="url(#face-${t})"/><path d="${y}" fill="${n}" opacity=".10"/><path d="${`M${o} ${s} L${c} ${l}`}" stroke="${n}" stroke-width="1" fill="none" opacity=".55"/><path d="${`M${_} ${v} L${f} ${g}`}" stroke="#000" stroke-width="1" fill="none" opacity=".35"/>`,x=[];for(let t=0;t<e;t++)x.push(`<g transform="rotate(${d(t*360/e)} 200 200)">${b}</g>`);return x.join(`
`)}function T(e){let t=[];for(let n=0;n<5;n++){let[r,i]=u(p,p,52,-90+n*360/5);t.push(`<circle cx="${r}" cy="${i}" r="9" fill="#0A0B0D" opacity=".85"/><path d="${f(r,i,9,20,160)}" stroke="${e}" stroke-width="1" fill="none" opacity=".45"/>`)}return t.join(``)}function E(e,t,n){return`<circle cx="200" cy="200" r="34" fill="url(#cap-${e})"/>
<circle cx="200" cy="200" r="34" fill="none" stroke="${n}" stroke-width="1" opacity=".5"/>
<text x="200" y="208" text-anchor="middle" font-family="Lato, Arial, sans-serif" font-size="20" font-weight="900" fill="#FFF" opacity=".85">${O(t)}</text>`}function D(){return`<path d="${f(p,p,145,200,320)}" stroke="#FFF" stroke-opacity=".18" stroke-width="5" stroke-linecap="round" fill="none"/>`}function O(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}function k(e){return O(e).replace(/"/g,`&quot;`)}function A(e=`neu`,t={}){let n=t.width??560,r=l(`doc`,e),i=t.title?`role="img" aria-label="${N(t.title)}"`:`role="presentation" aria-hidden="true"`,a=e===`neu`?`Zulassungsbescheinigung Teil I`:`Fahrzeugschein`,o=e===`neu`?`2.1`:`2`,s=e===`neu`?`2.2`:`3`,c=e===`neu`?132:122,u=e===`neu`?166:190;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 400" width="${n}" height="${Math.round(n*400/560)}" ${i} focusable="false">
  <defs>
    <filter id="dsh-${r}" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#0E1116" flood-opacity=".18"/>
    </filter>
  </defs>

  <rect x="20" y="16" width="520" height="368" rx="6" fill="#E8F0E2" stroke="#B9C9AE" stroke-width="1" filter="url(#dsh-${r})"/>

  <text x="44" y="52" font-family="Lato, Arial, sans-serif" font-size="13" font-weight="700" fill="#3C4A34">${M(a)}</text>
  <line x1="44" y1="64" x2="516" y2="64" stroke="#B9C9AE" stroke-width="1"/>

  ${j(r,c,u)}

  <!-- 2.1 / 2 — HSN, ringed in blue -->
  <rect x="40" y="${c-18}" width="214" height="30" rx="4" fill="none" stroke="#1A44D4" stroke-width="2"/>
  <text x="50" y="${c+2}" font-family="Lato, Arial, sans-serif" font-size="11" font-weight="700" fill="#3C4A34">${o}</text>
  <text x="84" y="${c+3}" font-family="'IBM Plex Mono', monospace" font-size="14" font-weight="500" letter-spacing="3" fill="#0E1116">0005</text>
  <path d="M254 ${c-3} H300" stroke="#1A44D4" stroke-width="1.5" fill="none"/>
  <circle cx="302" cy="${c-3}" r="3" fill="#1A44D4"/>
  <text x="312" y="${c+1}" font-family="Lato, Arial, sans-serif" font-size="12" font-weight="900" letter-spacing="1.2" fill="#1A44D4">HSN</text>

  <!-- 2.2 / 3 — TSN, ringed in green -->
  <rect x="40" y="${u-18}" width="214" height="30" rx="4" fill="none" stroke="#2E8B22" stroke-width="2"/>
  <text x="50" y="${u+2}" font-family="Lato, Arial, sans-serif" font-size="11" font-weight="700" fill="#3C4A34">${s}</text>
  <text x="84" y="${u+3}" font-family="'IBM Plex Mono', monospace" font-size="14" font-weight="500" letter-spacing="3" fill="#0E1116">AAS</text>
  <path d="M254 ${u-3} H300" stroke="#2E8B22" stroke-width="1.5" fill="none"/>
  <circle cx="302" cy="${u-3}" r="3" fill="#2E8B22"/>
  <text x="312" y="${u+1}" font-family="Lato, Arial, sans-serif" font-size="12" font-weight="900" letter-spacing="1.2" fill="#2E8B22">TSN</text>
</svg>`}function j(e,t,n){let r=[];for(let e=0;e<9;e++){let i=100+e*32;if(Math.abs(i-t)<20||Math.abs(i-n)<20)continue;let a=150+e*53%120;r.push(`<text x="50" y="${i+2}" font-family="Lato, Arial, sans-serif" font-size="11" font-weight="700" fill="#7C8C74">${e+4}</text><rect x="84" y="${i-9}" width="${a}" height="9" rx="2" fill="#C9D8BF"/><rect x="300" y="${i-9}" width="${110+e*37%100}" height="9" rx="2" fill="#D6E2CD"/>`)}return`<g data-doc="${e}">${r.join(``)}</g>`}function M(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}function N(e){return M(e).replace(/"/g,`&quot;`)}function P(e=56){return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88" width="${e+32}" height="${e+32}" role="presentation" aria-hidden="true" focusable="false">
  <circle cx="44" cy="44" r="44" fill="#E8F4E5"/>
  <path d="M27 45.5 39 57 62 32" fill="none" stroke="#1A44D4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`}function F(e=900){let t=l(`admin-backdrop`),n=[];for(let e=0;e<12;e++){let t=e*360/12*Math.PI/180;n.push(`<line x1="${d(420+60*Math.cos(t))}" y1="${d(300+60*Math.sin(t))}" x2="${d(420+250*Math.cos(t))}" y2="${d(300+250*Math.sin(t))}"/>`)}let r=[];for(let e=0;e<5;e++){let t=(-90+e*360/5)*Math.PI/180,n=d(420+104*Math.cos(t)),i=d(300+104*Math.sin(t));r.push(`<circle cx="${n}" cy="${i}" r="16"/><line x1="${n-24}" y1="${i}" x2="${n+24}" y2="${i}"/><line x1="${n}" y1="${i-24}" x2="${n}" y2="${i+24}"/>`)}return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="${e}" height="${Math.round(e*600/900)}" preserveAspectRatio="xMidYMid slice" role="presentation" aria-hidden="true" focusable="false">
  <g data-drawing="${t}" fill="none" stroke="#FFF" stroke-opacity=".05" stroke-width="1">
    <circle cx="420" cy="300" r="286"/>
    <circle cx="420" cy="300" r="250"/>
    <circle cx="420" cy="300" r="104" stroke-dasharray="8 6"/>
    <circle cx="420" cy="300" r="60"/>
    <circle cx="420" cy="300" r="33"/>
    ${n.join(``)}
    ${r.join(``)}
    <line x1="0" y1="300" x2="900" y2="300" stroke-dasharray="14 8"/>
    <line x1="420" y1="0" x2="420" y2="600" stroke-dasharray="14 8"/>

    <!-- ET: the offset dimension, the number this whole business turns on. -->
    <line x1="706" y1="96" x2="706" y2="14"/>
    <line x1="420" y1="96" x2="420" y2="240"/>
    <line x1="420" y1="112" x2="706" y2="112"/>
    <path d="M420 112 l10 -5 v10 Z M706 112 l-10 -5 v10 Z" fill="#FFF" fill-opacity=".05" stroke="none"/>
    <text x="552" y="102" font-family="'IBM Plex Mono', monospace" font-size="13" fill="#FFF" fill-opacity=".07" stroke="none">ET</text>
  </g>
</svg>`}function I(e,t=720,n=220){let r=e[e.length-1];if(e.length<2||r===void 0)return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${n}" width="${t}" height="${n}" role="presentation" aria-hidden="true" focusable="false"></svg>`;let i=l(`revenue`,e.length,r.value),a=e.map(e=>e.value),o=Math.max(...a),s=Math.min(...a),c=o-s===0?Math.max(1,o):o-s,u=n=>d(8+n*(t-8-56)/(e.length-1)),f=e=>d(n-28-(e-s)/c*(n-16-28)),p=e.map((e,t)=>`${t===0?`M`:`L`}${u(t)} ${f(e.value)}`).join(` `),m=`${p} L${u(e.length-1)} ${n-28} L${u(0)} ${n-28} Z`,h=[];for(let e=0;e<=3;e++){let r=d(16+e*(n-16-28)/3);h.push(`<line x1="8" y1="${r}" x2="${t-56}" y2="${r}"/>`)}let g=u(e.length-1),_=f(r.value);return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${n}" width="${t}" height="${n}" role="presentation" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="fill-${i}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1A44D4" stop-opacity=".12"/>
      <stop offset="1" stop-color="#1A44D4" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g stroke="currentColor" stroke-opacity=".12" stroke-width="1">${h.join(``)}</g>
  <path d="${m}" fill="url(#fill-${i})"/>
  <path d="${p}" fill="none" stroke="#1A44D4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${g}" cy="${_}" r="4" fill="#1A44D4"/>
  <circle cx="${g}" cy="${_}" r="8" fill="none" stroke="#1A44D4" stroke-opacity=".35" stroke-width="1"/>
  <text x="${g+12}" y="${_+4}" font-family="'IBM Plex Mono', monospace" font-size="12" fill="currentColor" fill-opacity=".7">${L(r.label)}</text>
</svg>`}function L(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}function R(e,t={}){return e===`lager`?z(t):B(t)}function z(e){let t=e.width??640,n=l(`scene`,`lager`),r=e.title?`role="img" aria-label="${V(e.title)}"`:`role="presentation" aria-hidden="true"`,i=[],a=[`#171B22`,`#1D222B`,`#242A35`,`#2C3340`];for(let e=0;e<4;e++){let t=118+e*58,n=52-e*7,r=a[3-e],o=6+e;for(let e=0;e<o;e++){let a=40+e*(560-n)/(o-1);i.push(`<circle cx="${Math.round(a)}" cy="${t}" r="${n}" fill="${r}"/><circle cx="${Math.round(a)}" cy="${t}" r="${Math.round(n*.34)}" fill="#0E1116" opacity=".7"/>`)}}return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="${t}" height="${Math.round(t*400/640)}" ${r} focusable="false">
  <defs>
    <linearGradient id="lg-${n}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0B0D12"/>
      <stop offset="1" stop-color="#161B24"/>
    </linearGradient>
    <radialGradient id="lp-${n}" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#7896FF" stop-opacity=".2"/>
      <stop offset="1" stop-color="#7896FF" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="lc-${n}"><rect width="640" height="400" rx="14"/></clipPath>
  </defs>
  <g clip-path="url(#lc-${n})">
    <rect width="640" height="400" fill="url(#lg-${n})"/>
    <ellipse cx="330" cy="300" rx="320" ry="150" fill="url(#lp-${n})"/>
    ${i.join(``)}
  </g>
</svg>`}function B(e){let t=e.width??640,n=l(`scene`,`werkstatt`),r=e.title?`role="img" aria-label="${V(e.title)}"`:`role="presentation" aria-hidden="true"`;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="${t}" height="${Math.round(t*400/640)}" ${r} focusable="false">
  <defs>
    <linearGradient id="wg-${n}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#12141A"/>
      <stop offset="1" stop-color="#1C1F27"/>
    </linearGradient>
    <radialGradient id="wk-${n}" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#F9C112" stop-opacity=".22"/>
      <stop offset="1" stop-color="#F9C112" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="wc-${n}"><rect width="640" height="400" rx="14"/></clipPath>
  </defs>
  <g clip-path="url(#wc-${n})">
    <rect width="640" height="400" fill="url(#wg-${n})"/>
    <ellipse cx="214" cy="120" rx="260" ry="200" fill="url(#wk-${n})"/>

    <!-- The machine: a base, a column and the spindle the wheel is mounted on. -->
    <rect x="392" y="300" width="196" height="76" rx="6" fill="#0B0D12"/>
    <rect x="436" y="120" width="34" height="196" fill="#0B0D12"/>
    <rect x="300" y="196" width="150" height="16" rx="6" fill="#0B0D12"/>
    <rect x="404" y="96" width="176" height="52" rx="8" fill="#0B0D12"/>
    <rect x="422" y="112" width="98" height="22" rx="4" fill="#1A44D4" opacity=".45"/>

    <g transform="translate(96 84)">${g({spokes:10,finish:`graphite`,size:232})}</g>

    <rect x="0" y="376" width="640" height="24" fill="#0B0D12"/>
  </g>
</svg>`}function V(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}var H=200,U=32;function W(e={}){let t=e.label??``,n=e.size??400,r=l(`tyre`,t),i=e.title?`role="img" aria-label="${e.title.replace(/"/g,`&quot;`)}"`:`role="presentation" aria-hidden="true"`,a=[];for(let e=0;e<U;e++){let t=e*360/U,[n,r]=u(H,H,156,t),[i,o]=u(H,H,190,t);a.push(`<line x1="${n}" y1="${r}" x2="${i}" y2="${o}"/>`)}return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${n}" height="${n}" ${i} focusable="false">
  <defs>
    <radialGradient id="carcass-${r}" cx="38%" cy="30%" r="82%">
      <stop offset="0" stop-color="#2B2F36"/>
      <stop offset=".6" stop-color="#15171B"/>
      <stop offset="1" stop-color="#0B0C0F"/>
    </radialGradient>
    <radialGradient id="bore-${r}" cx="40%" cy="32%" r="80%">
      <stop offset="0" stop-color="#8E959F"/>
      <stop offset="1" stop-color="#3A3E45"/>
    </radialGradient>
    <filter id="tsoft-${r}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
    <path id="sidewall-${r}" d="M200 316 A116 116 0 1 1 200.1 316" fill="none"/>
  </defs>

  <ellipse cx="200" cy="378" rx="146" ry="13" fill="#0E1116" opacity=".16" filter="url(#tsoft-${r})"/>

  <circle cx="200" cy="200" r="194" fill="url(#carcass-${r})"/>
  <g stroke="#0B0C0F" stroke-width="8">${a.join(``)}</g>

  <!-- The sidewall ring: one tone lighter, which is what makes the tread read as a separate
       surface rather than a texture painted on a disc. -->
  <circle cx="200" cy="200" r="150" fill="none" stroke="#22262C" stroke-width="56"/>
  <circle cx="200" cy="200" r="178" fill="none" stroke="#000" stroke-width="1" opacity=".5"/>
  <circle cx="200" cy="200" r="122" fill="none" stroke="#000" stroke-width="1" opacity=".5"/>

  <circle cx="200" cy="200" r="120" fill="url(#bore-${r})"/>
  <circle cx="200" cy="200" r="120" fill="none" stroke="#0A0B0D" stroke-width="6" opacity=".6"/>

  <path d="M${d(114)} ${d(264)} A118 118 0 0 1 ${d(108)} ${d(148)}"
        stroke="#FFF" stroke-opacity=".14" stroke-width="5" stroke-linecap="round" fill="none"/>

  ${t===``?``:`<text font-family="'IBM Plex Mono', ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.6" fill="#C3C8CF" fill-opacity=".85">
    <textPath href="#sidewall-${r}" startOffset="50%" text-anchor="middle">${G(t)}</textPath>
  </text>`}
</svg>`}function G(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}export{P as a,a as c,I as i,R as n,A as o,F as r,g as s,W as t};