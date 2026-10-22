import{r as p,a1 as e,a2 as P,ar as u}from"./vendor-BrF3pmtZ.js";import{u as W}from"./index-BGv3zY9i.js";import{S as I}from"./SEO-D5isRFHT.js";import"./socket-7HXqYNpq.js";import"./livekit-BEAUSX0o.js";import"./lucide-DlmZynBI.js";const D=`
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,V=`
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_dpr;
uniform vec4 u_text_zone;

void main() {
  // Normalize device pixels to CSS coordinates
  vec2 coord = gl_FragCoord.xy / u_dpr;
  vec2 res = u_resolution;
  
  // Flip Y to standard DOM coordinates (0 at top, res.y at bottom)
  float x = coord.x;
  float y = res.y - coord.y;
  
  // Dense matrix grid spacing matching reference visual
  float spacing = res.x < 768.0 ? 6.5 : 7.2;
  
  // Grid cell index and center of the nearest dot in CSS pixels
  vec2 cellIndex = floor(vec2(x, y) / spacing);
  vec2 dotCenter = (cellIndex + 0.5) * spacing;
  
  // Distance from current pixel to center of this dot
  float distToCenter = length(vec2(x, y) - dotCenter);
  
  // Normalized height: s in [0, 1]
  float s = dotCenter.y / res.y;
  
  // Multi-directional organic fluid time variables
  float t = u_time * 0.26;
  float tY = u_time * 0.35;
  
  // Ribbon trajectory parameters across height
  float ribbonWidth1 = res.x * 0.20;
  float ribbonWidth2 = res.x * 0.16;
  
  // Primary billowing 3D silk S-curve center
  float cx1 = res.x * (0.48 +
    sin(s * 6.2831853 + t * 0.52) * 0.25 +
    cos(s * 10.681415 - t * 0.32) * 0.09);
    
  // Secondary counter-flowing silk fold
  float cx2 = res.x * (0.52 +
    cos(s * 6.9115038 - t * 0.42) * 0.26 +
    sin(s * 5.0265482 + t * 0.28) * 0.11);
    
  // Traveling transverse fluid waves along the ribbon (multi-directional flow)
  float travelingWave1 = sin(s * 15.707963 - tY * 1.2) * 0.18;
  float travelingWave2 = cos(s * 21.991148 + tY * 0.9) * 0.12;
  
  // Gaussian bell curves
  float dx1 = dotCenter.x - cx1;
  float dx2 = dotCenter.x - cx2;
  
  float inv2Sigma1 = 1.0 / (2.0 * ribbonWidth1 * ribbonWidth1);
  float inv2Sigma2 = 1.0 / (2.0 * ribbonWidth2 * ribbonWidth2);
  
  float g1 = exp(-dx1 * dx1 * inv2Sigma1);
  float g2 = exp(-dx2 * dx2 * inv2Sigma2);
  
  // Combined undulating elevation
  float rawElevation = g1 * (0.76 + travelingWave1) + g2 * (0.52 + travelingWave2);
  float elevation = clamp(rawElevation, 0.0, 1.0);
  
  // Contrast curve: elevation^1.7 * 0.68
  float intensity = pow(elevation, 1.7) * 0.68;
  
  // Subtitle reading protection zone:
  // Ultra-smooth, feathered transition with NO dark hole and NO sharp edges.
  float textFactor = 1.0;
  if (u_text_zone.z > 0.0) {
    vec2 innerCore = u_text_zone.zw * 0.50;
    vec2 delta = max(abs(dotCenter - u_text_zone.xy) - innerCore, 0.0);
    vec2 feather = vec2(220.0, 90.0);
    float d = length(delta / feather);
    textFactor = smoothstep(0.0, 1.0, clamp(d, 0.0, 1.0));
  }

  // Broad, elegant cursor interaction
  float mouseRadius = res.x < 768.0 ? 280.0 : 380.0;
  float cursorGlow = 0.0;
  vec2 mouseDOM = vec2(u_mouse.x, u_mouse.y);
  float mdist = length(dotCenter - mouseDOM);
  if (mdist < mouseRadius) {
    float factor = 1.0 - mdist / mouseRadius;
    float bell = factor * factor * (3.0 - 2.0 * factor);
    cursorGlow = bell * 0.32 * mix(0.70, 1.0, textFactor);
  }
  
  float rawV = clamp(intensity + cursorGlow, 0.0, 1.0);
  
  // Soft non-linear compression to prevent blinding glare behind text
  float softCeiling = mix(0.26, 1.0, textFactor);
  float finalVal = rawV > softCeiling ? softCeiling + (rawV - softCeiling) * mix(0.12, 1.0, textFactor) : rawV;
  
  // Continuous dot radius calculation:
  float targetRadius = 0.50;
  if (finalVal > 0.08) {
    targetRadius = 0.50 + (finalVal - 0.08) * 2.2;
  }
  
  // Anti-aliased subpixel circle edge
  float circle = smoothstep(targetRadius + 0.45, targetRadius - 0.45, distToCenter);
  
  if (circle <= 0.001) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  
  // Metallic Colors matching reference visual:
  vec3 cBase = vec3(70.0/255.0, 85.0/255.0, 110.0/255.0); // Gunmetal ambient
  vec3 cBlue = vec3(125.0/255.0, 175.0/255.0, 230.0/255.0); // Icy steel-blue
  vec3 cGold = vec3(238.0/255.0, 222.0/255.0, 202.0/255.0); // Champagne platinum
  vec3 cCrest = vec3(242.0/255.0, 246.0/255.0, 252.0/255.0); // Polished liquid mercury
  vec3 cWhite = vec3(1.0, 1.0, 1.0); // Specular white chrome
  
  // Dual-tone flank blend
  float normDx = dx1 / ribbonWidth1;
  float blueFactor = clamp(0.5 - normDx * 0.75, 0.0, 1.0);
  float goldFactor = clamp(0.5 + normDx * 0.75, 0.0, 1.0);
  
  vec3 flankColor = mix(cBlue, cGold, goldFactor / (blueFactor + goldFactor + 0.0001));
  
  // Blend from ambient base to flank color to mercury crest to white peak
  float waveStrength = smoothstep(0.08, 0.35, finalVal);
  float crestStrength = smoothstep(0.32, 0.58, finalVal);
  float whiteStrength = smoothstep(0.54, 0.85, finalVal);
  
  vec3 col = mix(cBase, flankColor, waveStrength);
  col = mix(col, cCrest, crestStrength);
  col = mix(col, cWhite, whiteStrength);
  
  // Alpha luminance depth
  float alpha = mix(0.20, 0.95, waveStrength);
  
  gl_FragColor = vec4(col * circle * alpha, 1.0);
}
`;function G(){const c=p.useRef(null);return p.useEffect(()=>{const d=c.current;if(!d)return;let t=d.getContext("webgl",{alpha:!1,depth:!1,stencil:!1,antialias:!1,powerPreference:"high-performance"});if(t||(t=d.getContext("experimental-webgl",{alpha:!1,depth:!1,stencil:!1,antialias:!1})),!t)return;const g=(o,r)=>{const j=t.createShader(o);return t.shaderSource(j,r),t.compileShader(j),j},v=g(t.VERTEX_SHADER,D),w=g(t.FRAGMENT_SHADER,V),s=t.createProgram();t.attachShader(s,v),t.attachShader(s,w),t.linkProgram(s),t.useProgram(s);const m=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,m),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),t.STATIC_DRAW);const i=t.getAttribLocation(s,"position");t.enableVertexAttribArray(i),t.vertexAttribPointer(i,2,t.FLOAT,!1,0,0);const C=t.getUniformLocation(s,"u_resolution"),x=t.getUniformLocation(s,"u_time"),l=t.getUniformLocation(s,"u_mouse"),a=t.getUniformLocation(s,"u_dpr"),z=t.getUniformLocation(s,"u_text_zone");let h=0,f=0,k=1,b=[0,0,0,0];const y=()=>{const o=document.querySelector(".oxy-hero-subtitle");if(o){const r=o.getBoundingClientRect(),j=(r.left+r.right)*.5,T=(r.top+r.bottom)*.5,F=r.width*.5,O=r.height*.5;b=[j,T,F,O]}else b=[window.innerWidth*.5,325,Math.min(290,window.innerWidth*.38),35]},n={x:-4e3,y:-4e3,targetX:-4e3,targetY:-4e3},R=o=>{n.targetX=o.clientX,n.targetY=o.clientY},E=()=>{n.targetX=-4e3,n.targetY=-4e3};window.addEventListener("mousemove",R,{passive:!0}),window.addEventListener("mouseleave",E,{passive:!0});const _=()=>{k=Math.min(window.devicePixelRatio||1,1.5),h=window.innerWidth,f=window.innerHeight;const o=Math.floor(h*k),r=Math.floor(f*k);d.width=o,d.height=r,d.style.width=`${h}px`,d.style.height=`${f}px`,t.viewport(0,0,o,r)};_(),y(),window.addEventListener("resize",()=>{_(),y()}),window.addEventListener("scroll",y,{passive:!0});let S=!0,N,L=0;const M=()=>{S=!document.hidden,S&&(N=requestAnimationFrame(A))};document.addEventListener("visibilitychange",M);const B=performance.now(),A=o=>{if(!S)return;L++,L%60===0&&y(),n.x+=(n.targetX-n.x)*.12,n.y+=(n.targetY-n.y)*.12;const r=(o-B)*.001;t.uniform2f(C,h,f),t.uniform1f(x,r),t.uniform2f(l,n.x,n.y),t.uniform1f(a,k),t.uniform4f(z,b[0],b[1],b[2],b[3]),t.drawArrays(t.TRIANGLES,0,6),N=requestAnimationFrame(A)};return N=requestAnimationFrame(A),()=>{window.removeEventListener("resize",_),window.removeEventListener("scroll",y),window.removeEventListener("mousemove",R),window.removeEventListener("mouseleave",E),document.removeEventListener("visibilitychange",M),cancelAnimationFrame(N),t&&(t.deleteBuffer(m),t.deleteProgram(s),t.deleteShader(v),t.deleteShader(w))}},[]),e.jsx("canvas",{ref:c,className:"oxy-canvas-bg select-none pointer-events-none"})}function Z(){const{user:c,loading:d}=W(),t=P(),[g,v]=p.useState("watch-party"),[w,s]=p.useState(0),m=p.useRef(null),i=[{id:"watch-party",title:"Birlikte Film İzle",subtitle:"Milisaniyelik eşzamanlama ve sıfır desenkron ile sinema keyfi.",image:"/onboarding-showcase/slide-3-watch-party.webp",alt:"Oxypace Birlikte Film İzleme ve Watch Party Arayüzü",badge:"Sıfır Gecikmeli Canlı Oynatıcı"},{id:"portals",title:"Kendi Portalını Kur",subtitle:"Sınırsız kanal, ses odaları ve gelişmiş yetkilendirme.",image:"/onboarding-showcase/slide-1-portal.webp",alt:"Oxypace Portallar ve Kanal Hiyerarşisi Arayüzü",badge:"Özelleştirilebilir Topluluk Portalı"},{id:"posts",title:"Topluluk Akışı",subtitle:"Görseller, tartışma başlıkları ve anlık canlı etkileşim.",image:"/onboarding-showcase/slide-2-post.webp",alt:"Oxypace Gönderi ve Etkileşim Duvarı",badge:"Canlı Akış ve Sosyal Katılım"},{id:"network",title:"Küresel Bağlantı Ağı",subtitle:"Dünyanın her yerinden üyelerle düşük gecikmeli WebRTC odaları.",image:"/onboarding-showcase/slide-4-globe.webp",alt:"Oxypace Küresel Ağ ve Canlı Odalar",badge:"WebRTC Düşük Gecikme Altyapısı"}];p.useEffect(()=>{if(!d&&c){const l=localStorage.getItem("oxypace_top_portal");if(l)try{const a=JSON.parse(l);if(a&&a.id){t(`/portal/${a.id}`,{replace:!0});return}}catch{}if(c.joinedPortals&&c.joinedPortals.length>0){const a=typeof c.joinedPortals[0]=="string"?c.joinedPortals[0]:c.joinedPortals[0]._id;t(`/portal/${a}`,{replace:!0})}else t("/messages",{replace:!0})}},[c,d,t]),p.useEffect(()=>((()=>{m.current&&clearInterval(m.current),m.current=setInterval(()=>{v(a=>{const h=(i.findIndex(f=>f.id===a)+1)%i.length;return i[h].id}),s(a=>a+1)},4500)})(),()=>{m.current&&clearInterval(m.current)}),[i.length]);const C=l=>{v(l),s(a=>a+1),m.current&&clearInterval(m.current),m.current=setInterval(()=>{v(a=>{const h=(i.findIndex(f=>f.id===a)+1)%i.length;return i[h].id}),s(a=>a+1)},4500)},x=i.find(l=>l.id===g)||i[0];return!d&&c?null:e.jsxs("div",{className:"oxypace-landing relative",children:[e.jsx(I,{title:"Oxypace - Topluluk Kur ve Birlikte Film İzle",description:"Arkadaşlarınla kendi portalını oluştur, kristal netliğinde sesli odalarda sıfır gecikmeyle birlikte film izle."}),e.jsx(G,{}),e.jsx("div",{className:"oxy-nav-left-corridor",children:e.jsx(u,{to:"/",className:"pointer-events-auto inline-flex items-center transition-transform hover:scale-105",title:"Oxypace Anasayfa",children:e.jsx("img",{src:"/oxypace-ice-logo.png",alt:"Oxypace",width:"56",height:"56",className:"w-11 h-11 sm:w-13 sm:h-13 object-contain filter drop-shadow-[0_4px_18px_rgba(255,255,255,0.45)]"})})}),e.jsx("div",{className:"oxy-nav-right-corridor",children:e.jsx(u,{to:"/login",className:"pointer-events-auto oxy-btn-glass px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-tight shadow-xl",children:"Giriş Yap"})}),e.jsxs("section",{className:"relative z-10 pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center",children:[e.jsxs("h1",{className:"oxy-hero-title oxy-civa-title text-[2.15rem] min-[390px]:text-[2.5rem] min-[440px]:text-[2.9rem] sm:text-5xl md:text-6xl xl:text-[3.8rem] font-extrabold tracking-tight leading-[1.08] mb-6 w-full max-w-5xl mx-auto",children:[e.jsx("span",{className:"block",children:"TOPLULUK KUR."}),e.jsxs("span",{className:"block mt-2 sm:mt-3",children:[e.jsx("span",{className:"block sm:inline",children:"BİRLİKTE "}),e.jsx("span",{className:"block sm:inline",children:"FİLM İZLE."})]})]}),e.jsx("p",{className:"oxy-hero-subtitle max-w-xl mx-auto text-base sm:text-lg md:text-xl text-slate-200 font-medium leading-relaxed mb-10",children:"Arkadaşlarınla kendi portalını oluştur, kristal netliğinde sesli odalarda sıfır gecikmeyle birlikte film izle."}),e.jsxs("div",{className:"flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16",children:[e.jsxs(u,{to:"/login",className:"oxy-btn-mercury w-full sm:w-auto px-8 py-3.5 rounded-full text-sm sm:text-base font-bold shadow-2xl flex items-center justify-center gap-2 group",children:[e.jsx("span",{children:"Web'de Hemen Başla"}),e.jsx("svg",{className:"w-4 h-4 group-hover:translate-x-1 transition-transform",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2.5,d:"M9 5l7 7-7 7"})})]}),e.jsxs("a",{href:"/downloads/oxypace.apk",className:"oxy-btn-glass w-full sm:w-auto px-7 py-3.5 rounded-full text-sm sm:text-base font-semibold flex items-center justify-center gap-2",children:[e.jsx("svg",{className:"w-5 h-5 text-slate-200",fill:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{d:"M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0007s.4482-1.0006.9993-1.0006c.5516 0 1.0003.4485 1.0003 1.0006s-.4487 1.0007-1.0003 1.0007m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0007s.4482-1.0006.9993-1.0006c.5516 0 1.0003.4485 1.0003 1.0006s-.4487 1.0007-1.0003 1.0007m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.411 13.8559 8.1 12 8.1s-3.5902.311-5.1368.8504L4.8409 5.4474a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.784h24c-.3432-4.1251-2.6889-7.5973-6.1185-9.4626"})}),e.jsx("span",{children:"Android APK"})]})]}),e.jsxs("div",{className:"max-w-5xl mx-auto",children:[e.jsx("div",{className:"flex flex-wrap items-center justify-center gap-1 sm:gap-2 p-1 sm:p-1.5 oxy-tab-container mb-5 sm:mb-6 max-w-fit mx-auto",children:i.map(l=>{const a=g===l.id;return e.jsxs("button",{type:"button",onClick:()=>C(l.id),className:`oxy-tab-pill text-xs sm:text-sm ${a?"active":""}`,children:[e.jsx("span",{className:"relative z-10",children:l.title}),a&&e.jsx("div",{className:"oxy-tab-timer-line"},`timer-pill-${l.id}-${w}`)]},l.id)})}),e.jsxs("div",{className:"oxy-showcase-frame text-left",children:[e.jsx("div",{className:"oxy-showcase-timer-bar"},`showcase-bar-${g}-${w}`),e.jsxs("div",{className:"px-3.5 sm:px-5 py-2 sm:py-2.5 bg-white/[0.03] flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"w-2 h-2 rounded-full bg-slate-600 inline-block"}),e.jsx("span",{className:"w-2 h-2 rounded-full bg-slate-700 inline-block"}),e.jsx("span",{className:"w-2 h-2 rounded-full bg-slate-800 inline-block"}),e.jsx("span",{className:"ml-1.5 text-[11px] sm:text-xs font-mono text-slate-300",children:x.badge})]}),e.jsxs("div",{className:"flex items-center gap-2 text-[11px] sm:text-xs font-mono text-slate-200",children:[e.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#ffffff]"}),e.jsx("span",{className:"hidden sm:inline",children:"Canlı Senkronizasyon"})]})]}),e.jsxs("div",{className:"relative aspect-[16/9] sm:aspect-[16/8.5] w-full bg-[#050608] overflow-hidden group",children:[e.jsx("img",{src:x.image,alt:x.alt,className:"w-full h-full object-contain object-top p-2 sm:p-4 transition-transform duration-500 group-hover:scale-[1.01]",loading:"eager"},x.id),e.jsxs("div",{className:"absolute bottom-0 inset-x-0 p-4 sm:p-5 bg-gradient-to-t from-black via-black/85 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-sm sm:text-base font-bold text-white tracking-tight",children:x.title}),e.jsx("p",{className:"text-xs text-slate-300 max-w-md",children:x.subtitle})]}),e.jsx(u,{to:"/login",className:"oxy-btn-mercury px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap",children:"Dene →"})]})]})]}),e.jsxs("div",{className:"mt-8 p-6 sm:p-8 oxy-card-horizon flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 text-left shadow-2xl",children:[e.jsxs("div",{className:"flex-1",children:[e.jsxs("div",{className:"inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 text-[11px] font-mono uppercase tracking-widest text-slate-300 mb-2.5",children:[e.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#ffffff]"}),"OXYPACE EKOSİSTEMİ // BİLİM ARŞİVİ"]}),e.jsx("h3",{className:"text-lg sm:text-xl font-bold text-white tracking-tight",children:"EVENT HORIZON — Bağımsız Popüler Bilim & Astrofizik Portalı"}),e.jsx("p",{className:"text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed",children:"Evrenin fizik sınırları, kara delikler ve uzay-zaman geometrisi üzerine interaktif makale ve simülasyon arşivi. Oxypace topluluğunun bağımsız bilim alanı."})]}),e.jsx("a",{href:"/blog",className:"oxy-btn-glass px-6 py-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap hover:scale-105 transition-transform",children:"EVENT HORIZON'a Git →"})]})]})]}),e.jsx("section",{className:"relative z-10 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-5",children:[e.jsx("div",{className:"oxy-card-mercury p-6 rounded-2xl flex flex-col justify-between",children:e.jsxs("div",{children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 text-white",children:e.jsx("svg",{className:"w-5 h-5 text-slate-200",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:1.8,d:"M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"})})}),e.jsx("h3",{className:"text-base font-bold text-white mb-2",children:"Birlikte Film İzle"}),e.jsx("p",{className:"text-xs text-slate-400 leading-relaxed",children:"Buffer senkronizasyonu ile arkadaşlarınla aynı anda başlat, durdur ve kesintisiz izle."})]})}),e.jsx("div",{className:"oxy-card-mercury p-6 rounded-2xl flex flex-col justify-between",children:e.jsxs("div",{children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 text-white",children:e.jsx("svg",{className:"w-5 h-5 text-slate-200",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:1.8,d:"M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"})})}),e.jsx("h3",{className:"text-base font-bold text-white mb-2",children:"Özel Portallar"}),e.jsx("p",{className:"text-xs text-slate-400 leading-relaxed",children:"Kendi kurallarını koyduğun, sınırsız ses ve metin kanallarına sahip bağımsız alanlar kur."})]})}),e.jsx("div",{className:"oxy-card-mercury p-6 rounded-2xl flex flex-col justify-between",children:e.jsxs("div",{children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 text-white",children:e.jsx("svg",{className:"w-5 h-5 text-slate-200",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:1.8,d:"M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"})})}),e.jsx("h3",{className:"text-base font-bold text-white mb-2",children:"Kristal Netliğinde Ses"}),e.jsx("p",{className:"text-xs text-slate-400 leading-relaxed",children:"WebRTC tabanlı düşük gecikmeli, gürültü filtreli ve arka planda çalışan ses motoru."})]})})]})}),e.jsx("footer",{className:"relative z-10 bg-black pt-12 pb-6 px-4 sm:px-6 lg:px-8 border-t border-white/[0.05]",children:e.jsxs("div",{className:"max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6",children:[e.jsx("div",{className:"w-full sm:w-auto flex items-center justify-start",children:e.jsx(u,{to:"/",className:"inline-flex items-center transition-transform hover:scale-105 active:scale-95",title:"Oxypace",children:e.jsx("img",{src:"/oxypace-ice-logo.png",alt:"Oxypace",width:"40",height:"40",className:"w-9 h-9 sm:w-10 sm:h-10 object-contain filter drop-shadow-[0_2px_12px_rgba(255,255,255,0.35)]"})})}),e.jsxs("div",{className:"w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-4 sm:gap-5 text-slate-400",children:[e.jsxs("div",{className:"flex items-center gap-3 sm:gap-4 font-medium text-[11px] sm:text-xs tracking-wide",children:[e.jsx(u,{to:"/privacy",className:"hover:text-white transition-colors",children:"Gizlilik"}),e.jsx("span",{className:"w-1 h-1 rounded-full bg-slate-700"}),e.jsx(u,{to:"/terms",className:"hover:text-white transition-colors",children:"Şartlar"})]}),e.jsx("div",{className:"hidden sm:block h-3.5 w-px bg-white/10"}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("a",{href:"https://x.com/oxypace",target:"_blank",rel:"noopener noreferrer","aria-label":"X (Twitter)",className:"oxy-social-btn",title:"X (Twitter)",children:e.jsx("svg",{className:"w-3.5 h-3.5",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"})})}),e.jsx("a",{href:"https://discord.gg",target:"_blank",rel:"noopener noreferrer","aria-label":"Discord",className:"oxy-social-btn",title:"Discord",children:e.jsx("svg",{className:"w-3.5 h-3.5",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"})})}),e.jsx("a",{href:"https://github.com/nkohlei/Oxypace",target:"_blank",rel:"noopener noreferrer","aria-label":"GitHub",className:"oxy-social-btn",title:"GitHub",children:e.jsx("svg",{className:"w-3.5 h-3.5",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"})})}),e.jsx("a",{href:"https://instagram.com/oxypace",target:"_blank",rel:"noopener noreferrer","aria-label":"Instagram",className:"oxy-social-btn",title:"Instagram",children:e.jsx("svg",{className:"w-3.5 h-3.5",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"})})})]})]})]})}),e.jsx("section",{className:"relative z-10 oxy-banner-container",children:e.jsx("div",{className:"w-full max-w-[1440px] mx-auto px-0 sm:px-6 flex items-center justify-center overflow-hidden",children:e.jsx("img",{src:"/oxypace-brand-banner-ultra.webp?v=5",alt:"Oxypace Banner",className:"oxy-banner-image select-none pointer-events-none"})})})]})}export{Z as default};
