import{b as e,k as t,mt as n}from"./runtime-core.esm-bundler-B8D2lM98.js";import{t as r}from"./_plugin-vue_export-helper-BDNMzG2s.js";var i={graphite:{lipFrom:`#3A3E45`,lipTo:`#1C1F24`,face:`#2A2E34`,spokeLight:`#565B63`},silver:{lipFrom:`#D8DBE0`,lipTo:`#9BA1AA`,face:`#C3C8CF`,spokeLight:`#F1F3F6`},black:{lipFrom:`#1A1C20`,lipTo:`#0A0B0D`,face:`#16181C`,spokeLight:`#34373D`},bronze:{lipFrom:`#8A6A3C`,lipTo:`#4E3A1F`,face:`#6F552F`,spokeLight:`#B9915A`},polished:{lipFrom:`#E9ECEF`,lipTo:`#A8AEB6`,face:`#D5DAE0`,spokeLight:`#FFFFFF`}};Object.keys(i);function a(e){return e in i}function o(e){return a(e)?i[e]:i.graphite}function s(...e){let t=e.join(`|`),n=2166136261;for(let e=0;e<t.length;e++)n^=t.charCodeAt(e),n=Math.imul(n,16777619);return(n>>>0).toString(36)}function c(e,t,n,r){let i=r*Math.PI/180;return[l(e+n*Math.cos(i)),l(t+n*Math.sin(i))]}function l(e){return Math.round(e*1e3)/1e3}function u(e,t,n,r,i){let[a,o]=c(e,t,n,r),[s,l]=c(e,t,n,i);return`M${a} ${o} A${n} ${n} 0 ${+(Math.abs(i-r)>180)} ${+(i>r)} ${s} ${l}`}var d=200,f=.18,p=.32;function m(e={}){let t=h(e.spokes??5),n=e.finish??`graphite`,r=e.size??400,i=o(n),a=s(`wheel`,t,n,e.tyre===!0,e.initial??``),c=(e.initial??`R`).slice(0,1).toUpperCase();return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${r}" height="${r}" ${e.title?`role="img" aria-label="${D(e.title)}"`:`role="presentation" aria-hidden="true"`} focusable="false">
${g(a,i.lipFrom,i.lipTo,i.face,i.spokeLight)}
${_(a)}
${e.tyre===!0?v():``}
${y(a)}
${b()}
${x(a)}
${S(t,a,i.spokeLight)}
${C(i.spokeLight)}
${w(a,c,i.spokeLight)}
${T()}
</svg>`}function h(e){return[5,7,10,20].reduce((t,n)=>Math.abs(n-e)<Math.abs(t-e)?n:t)}function g(e,t,n,r,i){return`<defs>
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
</defs>`}function _(e){return`<ellipse cx="200" cy="378" rx="150" ry="14" fill="#0E1116" opacity=".16" filter="url(#soft-${e})"/>`}function v(){let e=[];for(let t=0;t<28;t++){let n=t*360/28,[r,i]=c(d,d,158,n),[a,o]=c(d,d,192,n);e.push(`<line x1="${r}" y1="${i}" x2="${a}" y2="${o}"/>`)}return`<path d="M200 4 A196 196 0 1 1 199.9 4 Z M200 50 A150 150 0 1 0 200.1 50 Z" fill="#15171B" fill-rule="evenodd"/>
<g stroke="#0B0C0F" stroke-width="7" stroke-linecap="butt">${e.join(``)}</g>`}function y(e){return`<circle cx="200" cy="200" r="150" fill="url(#lip-${e})"/>`}function b(){return`<circle cx="200" cy="200" r="138" fill="#000" opacity=".35"/>`}function x(e){return`<circle cx="200" cy="200" r="132" fill="url(#face-${e})"/>`}function S(e,t,n){let r=360/e,i=r*f,a=r*p,[o,s]=c(d,d,44,-90-i),[u,m]=c(d,d,128,-90-a),[h,g]=c(d,d,128,-90+a),[_,v]=c(d,d,44,-90+i),y=`M${o} ${s} L${u} ${m} A128 128 0 0 1 ${h} ${g} L${_} ${v} A44 44 0 0 0 ${o} ${s} Z`,b=`<path d="${y}" fill="url(#face-${t})"/><path d="${y}" fill="${n}" opacity=".10"/><path d="${`M${o} ${s} L${u} ${m}`}" stroke="${n}" stroke-width="1" fill="none" opacity=".55"/><path d="${`M${_} ${v} L${h} ${g}`}" stroke="#000" stroke-width="1" fill="none" opacity=".35"/>`,x=[];for(let t=0;t<e;t++)x.push(`<g transform="rotate(${l(t*360/e)} 200 200)">${b}</g>`);return x.join(`
`)}function C(e){let t=[];for(let n=0;n<5;n++){let[r,i]=c(d,d,52,-90+n*360/5);t.push(`<circle cx="${r}" cy="${i}" r="9" fill="#0A0B0D" opacity=".85"/><path d="${u(r,i,9,20,160)}" stroke="${e}" stroke-width="1" fill="none" opacity=".45"/>`)}return t.join(``)}function w(e,t,n){return`<circle cx="200" cy="200" r="34" fill="url(#cap-${e})"/>
<circle cx="200" cy="200" r="34" fill="none" stroke="${n}" stroke-width="1" opacity=".5"/>
<text x="200" y="208" text-anchor="middle" font-family="Lato, Arial, sans-serif" font-size="20" font-weight="900" fill="#FFF" opacity=".85">${E(t)}</text>`}function T(){return`<path d="${u(d,d,145,200,320)}" stroke="#FFF" stroke-opacity=".18" stroke-width="5" stroke-linecap="round" fill="none"/>`}function E(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}function D(e){return E(e).replace(/"/g,`&quot;`)}function O(e=`neu`,t={}){let n=t.width??560,r=s(`doc`,e),i=t.title?`role="img" aria-label="${j(t.title)}"`:`role="presentation" aria-hidden="true"`,a=e===`neu`?`Zulassungsbescheinigung Teil I`:`Fahrzeugschein`,o=e===`neu`?`2.1`:`2`,c=e===`neu`?`2.2`:`3`,l=e===`neu`?132:122,u=e===`neu`?166:190;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 400" width="${n}" height="${Math.round(n*400/560)}" ${i} focusable="false">
  <defs>
    <filter id="dsh-${r}" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#0E1116" flood-opacity=".18"/>
    </filter>
  </defs>

  <rect x="20" y="16" width="520" height="368" rx="6" fill="#E8F0E2" stroke="#B9C9AE" stroke-width="1" filter="url(#dsh-${r})"/>

  <text x="44" y="52" font-family="Lato, Arial, sans-serif" font-size="13" font-weight="700" fill="#3C4A34">${A(a)}</text>
  <line x1="44" y1="64" x2="516" y2="64" stroke="#B9C9AE" stroke-width="1"/>

  ${k(r,l,u)}

  <!-- 2.1 / 2 — HSN, ringed in blue -->
  <rect x="40" y="${l-18}" width="214" height="30" rx="4" fill="none" stroke="#1A44D4" stroke-width="2"/>
  <text x="50" y="${l+2}" font-family="Lato, Arial, sans-serif" font-size="11" font-weight="700" fill="#3C4A34">${o}</text>
  <text x="84" y="${l+3}" font-family="'IBM Plex Mono', monospace" font-size="14" font-weight="500" letter-spacing="3" fill="#0E1116">0005</text>
  <path d="M254 ${l-3} H300" stroke="#1A44D4" stroke-width="1.5" fill="none"/>
  <circle cx="302" cy="${l-3}" r="3" fill="#1A44D4"/>
  <text x="312" y="${l+1}" font-family="Lato, Arial, sans-serif" font-size="12" font-weight="900" letter-spacing="1.2" fill="#1A44D4">HSN</text>

  <!-- 2.2 / 3 — TSN, ringed in green -->
  <rect x="40" y="${u-18}" width="214" height="30" rx="4" fill="none" stroke="#2E8B22" stroke-width="2"/>
  <text x="50" y="${u+2}" font-family="Lato, Arial, sans-serif" font-size="11" font-weight="700" fill="#3C4A34">${c}</text>
  <text x="84" y="${u+3}" font-family="'IBM Plex Mono', monospace" font-size="14" font-weight="500" letter-spacing="3" fill="#0E1116">AAS</text>
  <path d="M254 ${u-3} H300" stroke="#2E8B22" stroke-width="1.5" fill="none"/>
  <circle cx="302" cy="${u-3}" r="3" fill="#2E8B22"/>
  <text x="312" y="${u+1}" font-family="Lato, Arial, sans-serif" font-size="12" font-weight="900" letter-spacing="1.2" fill="#2E8B22">TSN</text>
</svg>`}function k(e,t,n){let r=[];for(let e=0;e<9;e++){let i=100+e*32;if(Math.abs(i-t)<20||Math.abs(i-n)<20)continue;let a=150+e*53%120;r.push(`<text x="50" y="${i+2}" font-family="Lato, Arial, sans-serif" font-size="11" font-weight="700" fill="#7C8C74">${e+4}</text><rect x="84" y="${i-9}" width="${a}" height="9" rx="2" fill="#C9D8BF"/><rect x="300" y="${i-9}" width="${110+e*37%100}" height="9" rx="2" fill="#D6E2CD"/>`)}return`<g data-doc="${e}">${r.join(``)}</g>`}function A(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}function j(e){return A(e).replace(/"/g,`&quot;`)}function M(e,t=720,n=220){let r=e[e.length-1];if(e.length<2||r===void 0)return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${n}" width="${t}" height="${n}" role="presentation" aria-hidden="true" focusable="false"></svg>`;let i=s(`revenue`,e.length,r.value),a=e.map(e=>e.value),o=Math.max(...a),c=Math.min(...a),u=o-c===0?Math.max(1,o):o-c,d=n=>l(8+n*(t-8-56)/(e.length-1)),f=e=>l(n-28-(e-c)/u*(n-16-28)),p=e.map((e,t)=>`${t===0?`M`:`L`}${d(t)} ${f(e.value)}`).join(` `),m=`${p} L${d(e.length-1)} ${n-28} L${d(0)} ${n-28} Z`,h=[];for(let e=0;e<=3;e++){let r=l(16+e*(n-16-28)/3);h.push(`<line x1="8" y1="${r}" x2="${t-56}" y2="${r}"/>`)}let g=d(e.length-1),_=f(r.value);return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${n}" width="${t}" height="${n}" role="presentation" aria-hidden="true" focusable="false">
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
  <text x="${g+12}" y="${_+4}" font-family="'IBM Plex Mono', monospace" font-size="12" fill="currentColor" fill-opacity=".7">${N(r.label)}</text>
</svg>`}function N(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}var P=[`innerHTML`],F=r(t({__name:`Svg`,props:{markup:{}},setup(t){return(r,i)=>(n(),e(`span`,{class:`art`,innerHTML:t.markup},null,8,P))}}),[[`__scopeId`,`data-v-87a8f36b`]]);export{m as i,M as n,O as r,F as t};