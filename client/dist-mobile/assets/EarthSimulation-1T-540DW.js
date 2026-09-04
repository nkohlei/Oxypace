import{r,a1 as e,a0 as pe,Z as K,ar as de}from"./vendor-jO-Cpt0r.js";import{G as me,T as ue,D as ge,A as xe,S as ee,M as be,a as he,b as ae,c as te,d as fe,B as ye,V as ve,e as we}from"./globe-visualization-D6wS5QU9.js";import{d as re}from"./index-BqJvg9cq.js";import{N as ke}from"./Navbar-YJgUK93y.js";import{S as je}from"./SubHeader-DwYb5gL6.js";import{S as Ne}from"./SEO-DprGRyn_.js";import"./socket-CLibEh-w.js";import"./livekit-aTqtZGx_.js";import"./lucide-BocR4IYo.js";import"./UserAvatar-C6VNvd15.js";/* empty css                  */const ze=r.forwardRef(({portals:y=[],onPortalClick:Y,activePortalSearch:z,onGlobeClick:I},$)=>{const o=r.useRef(),k=r.useRef(),x=r.useRef(2.5),h=r.useRef(null),j=r.useRef({x:0,y:0}),g=r.useRef(!1),[w,G]=r.useState({width:window.innerWidth,height:window.innerHeight}),[X,N]=r.useState(!1),U=r.useRef(!1),M=r.useRef(0),R=r.useRef(30),f=r.useCallback(()=>{const a=performance.now();if(a-M.current<1e3/R.current){requestAnimationFrame(f);return}if(M.current=a,!o.current||!g.current)return;const l=o.current.pointOfView(),p=x.current-l.altitude,c=l.altitude<=.8;if(c!==U.current&&(U.current=c,N(c)),Math.abs(p)<1e-4){g.current=!1,h.current=null;return}const n=l.altitude+p*.1;let b=l.lat,d=l.lng;if(h.current&&k.current&&typeof o.current.toGlobeCoords=="function"){const u=o.current.toGlobeCoords(j.current.x,j.current.y);if(u){let E=h.current.lat-u.lat,C=h.current.lng-u.lng;C=((C+180)%360+360)%360-180;const L=.15;b+=E*L,d+=C*L}}b=Math.max(-90,Math.min(90,b)),d=((d+180)%360+360)%360-180,o.current.pointOfView({lat:b,lng:d,altitude:n},0),requestAnimationFrame(f)},[]);r.useImperativeHandle($,()=>({zoomIn:()=>{x.current=Math.max(.002,x.current*.5),h.current=null,g.current||(g.current=!0,requestAnimationFrame(f))},zoomOut:()=>{x.current=Math.min(4,x.current*2),h.current=null,g.current||(g.current=!0,requestAnimationFrame(f))},resetView:()=>{x.current=2.5,g.current=!1,o.current&&o.current.pointOfView({lat:20,lng:30,altitude:2.5},1500)},flyTo:(a,s,l)=>{const p=l||.012;x.current=p,g.current=!1,o.current&&o.current.pointOfView({lat:a,lng:s,altitude:p},2500)}})),r.useEffect(()=>{const a=()=>{k.current&&G({width:k.current.clientWidth,height:k.current.clientHeight})};if(window.addEventListener("resize",a),setTimeout(a,50),o.current){const s=o.current.controls();s.autoRotate=!0,s.autoRotateSpeed=.3,s.rotateSpeed=.4,s.minDistance=100.2,s.enableZoom=!1,o.current.pointOfView({lat:20,lng:30,altitude:2.5},0)}return()=>{window.removeEventListener("resize",a),o.current&&o.current.scene().traverse(l=>{l.geometry&&l.geometry.dispose(),l.material&&(Array.isArray(l.material)?l.material.forEach(p=>p.dispose()):l.material.dispose())})}},[]);const B=r.useCallback(a=>{if(a.preventDefault(),!o.current)return;o.current.controls().autoRotate=!1;const l=a.deltaY<0?.85:1.15;if(x.current=Math.max(.002,Math.min(4,x.current*l)),k.current&&typeof o.current.toGlobeCoords=="function"){const p=k.current.getBoundingClientRect(),c=a.clientX-p.left,n=a.clientY-p.top;if(Math.hypot(c-j.current.x,n-j.current.y)>2||!g.current||!h.current){const d=o.current.toGlobeCoords(c,n);d?(h.current=d,j.current={x:c,y:n}):h.current=null}}g.current||(g.current=!0,requestAnimationFrame(f))},[f]),S=r.useRef(null),i=r.useRef(null),T=r.useRef(0),O=r.useCallback(a=>{if(o.current){if(o.current.controls().autoRotate=!1,a.touches.length===2){o.current.controls().enabled=!1,h.current=null;const s=a.touches[0].clientX-a.touches[1].clientX,l=a.touches[0].clientY-a.touches[1].clientY;S.current=Math.hypot(s,l),i.current=x.current}else if(a.touches.length===1){const s=Date.now();s-T.current<300&&(x.current=Math.max(.002,x.current*.5),g.current||(g.current=!0,requestAnimationFrame(f))),T.current=s}}},[f]),A=r.useCallback(a=>{if(a.touches.length===2&&o.current&&S.current!==null){a.preventDefault();const s=a.touches[0].clientX-a.touches[1].clientX,l=a.touches[0].clientY-a.touches[1].clientY,p=Math.hypot(s,l),c=S.current/p;x.current=Math.max(.002,Math.min(4,i.current*c)),g.current||(g.current=!0,requestAnimationFrame(f))}},[f]),P=r.useCallback(a=>{a.touches.length<2&&o.current&&(S.current=null,o.current.controls().enabled=!0)},[]);r.useEffect(()=>{const a=k.current;if(a)return a.addEventListener("wheel",B,{passive:!1}),a.addEventListener("touchstart",O,{passive:!1}),a.addEventListener("touchmove",A,{passive:!1}),a.addEventListener("touchend",P),()=>{a.removeEventListener("wheel",B),a.removeEventListener("touchstart",O),a.removeEventListener("touchmove",A),a.removeEventListener("touchend",P)}},[B,O,A,P]);const F=(a,s,l)=>`https://mt1.google.com/vt/lyrs=s&x=${a}&y=${s}&z=${l}&scale=2`;return e.jsxs("div",{ref:k,className:"w-full h-full",onPointerDown:()=>{o.current&&(o.current.controls().autoRotate=!1),h.current=null},children:[e.jsx(me,{ref:o,onGlobeReady:()=>{if(!o.current)return;const a=o.current.scene(),s=o.current.getGlobeRadius?o.current.getGlobeRadius():100,l=new ue;a.traverse(n=>{n.isMesh&&n.material&&!["cloudLayer","volumetricAtmosphere"].includes(n.name)&&(n.material.shininess=10)});const p=a.getObjectByName("globe");if(p&&p.material&&(p.material.emissiveIntensity=0,p.material.emissive&&p.material.emissive.setHex(0),p.material.shininess!==void 0&&(p.material.shininess=5)),!a.getObjectByName("realSun")){const n=new ge(16777215,4.5);n.name="realSun",a.add(n)}if(!a.getObjectByName("zifiriGece")){const n=new xe(14544639,.7);n.name="zifiriGece",a.add(n)}const c=()=>{var b;const n=(b=o.current)==null?void 0:b.camera();if(n){n.children.forEach(u=>{u.isLight&&(u.intensity=0)});const d=a.getObjectByName("realSun");if(d){const u=new ve(-1,.1,.2).normalize();u.applyQuaternion(n.quaternion),u.multiplyScalar(500),d.position.copy(n.position).add(u)}}a.children.forEach(d=>{d.isLight&&d.name!=="realSun"&&d.name!=="zifiriGece"&&(d.intensity=0)}),requestAnimationFrame(c)};if(c(),!a.getObjectByName("cloudLayer")){const n=new ee(s*1.006,64,64),b=l.load("/textures/earth-clouds.png"),d=new be({map:b,transparent:!0,opacity:.8,blending:ae,depthWrite:!1,side:he}),u=new te(n,d);u.name="cloudLayer",a.add(u);const E=()=>{if(u&&o.current){u.rotation.y+=2e-4;const C=o.current.pointOfView().altitude,L=we.clamp((C-.1)*1.5,0,.8);d.opacity=L}requestAnimationFrame(E)};E()}if(!a.getObjectByName("volumetricAtmosphere")){const n=new ee(s*1.18,64,64),b=new fe({vertexShader:`
                                varying vec3 vNormal;
                                varying vec3 vPositionNormal;
                                void main() {
                                    vNormal = normalize(normalMatrix * normal);
                                    vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
                                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                                }
                            `,fragmentShader:`
                                varying vec3 vNormal;
                                varying vec3 vPositionNormal;
                                void main() {
                                    float dotNL = dot(vNormal, vec3(0, 0, 1.0));
                                    
                                    // Sadece en dış kenarda (ufuk çizgisinde) parlama yarat
                                    float intensity = pow(0.65 - dotNL, 8.0);
                                    
                                    // Tüy efekti: Dış kenarlara doğru çok daha geniş bir alanda eriyerek kaybolsun
                                    float feather = smoothstep(-0.1, 0.6, dotNL);
                                    
                                    vec3 atmosphereBaseColor = vec3(0.2, 0.5, 1.0); // Koyu Mavi
                                    vec3 atmosphereEdgeColor = vec3(0.85, 0.95, 1.0); // Parlak Beyaz/Açık Mavi
                                    
                                    // Kenara doğru (dotNL azaldıkça) rengi beyaza/açık maviye karıştır
                                    float colorMix = smoothstep(0.1, 0.5, dotNL); // 0.1'de tam beyaz, 0.5'te tam mavi
                                    vec3 finalColor = mix(atmosphereEdgeColor, atmosphereBaseColor, colorMix);
                                    
                                    // Çok daha güçlü bir parlaklık çarpanı
                                    gl_FragColor = vec4(finalColor, intensity * feather * 3.0); 
                                }
                            `,transparent:!0,blending:ae,side:ye,depthWrite:!1}),d=new te(n,b);d.name="volumetricAtmosphere",a.add(d)}},width:w.width,height:w.height,backgroundColor:"#010206",showAtmosphere:!1,onGlobeClick:I,globeImageUrl:"//unpkg.com/three-globe@2.24.0/example/img/earth-blue-marble.jpg",bumpImageUrl:"//unpkg.com/three-globe@2.24.0/example/img/earth-topology.png",backgroundImageUrl:"//unpkg.com/three-globe@2.24.0/example/img/night-sky.png",globeTileEngineUrl:F,tileLayer:{maxZoom:22,attribution:"Google Satellite-DPI"},htmlElementsData:y,htmlElement:a=>{const s=document.createElement("div");s.className="portal-marker-container";let l="portal-circle";if(z&&z.length>0){const c=z.toLowerCase();a.name.toLowerCase().includes(c)||(a.label||"").toLowerCase().includes(c)?l="portal-circle portal-circle-match":l="portal-circle portal-circle-dimmed"}let p="";if(a.avatar){const c=a.avatar;let n=c;if(c.includes("%3A")||c.includes("%2F"))try{n=decodeURIComponent(c),(n.includes("%3A")||n.includes("%2F"))&&(n=decodeURIComponent(n))}catch{}p=re(n)}return s.innerHTML=`
                        <div class="${l}" data-name="${a.name[0].toUpperCase()}">
                            ${p?`<img src="${p}" alt="${a.name}" onerror="this.onerror=null;this.src='/assets/default-avatar.png';" />`:`<span class="portal-letter">${a.name[0].toUpperCase()}</span>`}
                        </div>
                        <div class="portal-hover-label">${a.name}</div>
                    `,s.style.position="relative",s.style.cursor="pointer",s.onclick=c=>{c.stopPropagation(),Y(a)},s.onpointerdown=c=>{c.stopPropagation()},s},htmlLat:a=>a.lat,htmlLng:a=>a.lng,htmlAltitude:0}),e.jsx("style",{children:`
                .portal-marker-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    pointer-events: auto !important;
                    user-select: none;
                    transform: translate(-50%, -50%);
                }

                .portal-marker-container:hover {
                    z-index: 100 !important;
                }

                .portal-circle {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: rgba(16, 22, 34, 0.4);
                    backdrop-filter: blur(8px);
                    border: 2px solid rgba(255, 255, 255, 0.4);
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
                    transition: all 0.2s ease-out;
                }

                .portal-marker-container:hover .portal-circle {
                    transform: scale(1.2);
                    border-color: #135bec;
                    box-shadow: 0 0 25px rgba(19, 91, 236, 0.4);
                }

                .portal-circle img {
                    width: 90%;
                    height: 90%;
                    object-fit: cover;
                    border-radius: 50%;
                }

                .portal-letter {
                    color: white;
                    font-size: 18px;
                    font-weight: 800;
                    font-family: 'Inter', sans-serif;
                    text-shadow: 0 1px 4px rgba(0,0,0,0.5);
                }

                .no-avatar {
                    background: linear-gradient(135deg, #135bec, #7928ca);
                }

                .no-avatar::after {
                    content: attr(data-name);
                    color: white;
                    font-size: 18px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                }

                @keyframes iridescentGlow {
                    0% { border-color: #ff0080; box-shadow: 0 0 25px rgba(255, 0, 128, 0.8), inset 0 0 10px rgba(255, 0, 128, 0.5); }
                    33% { border-color: #00d4ff; box-shadow: 0 0 25px rgba(0, 212, 255, 0.8), inset 0 0 10px rgba(0, 212, 255, 0.5); }
                    66% { border-color: #7928ca; box-shadow: 0 0 25px rgba(121, 40, 202, 0.8), inset 0 0 10px rgba(121, 40, 202, 0.5); }
                    100% { border-color: #ff0080; box-shadow: 0 0 25px rgba(255, 0, 128, 0.8), inset 0 0 10px rgba(255, 0, 128, 0.5); }
                }

                .portal-circle-match {
                    animation: iridescentGlow 4s linear infinite !important;
                    transform: scale(1.2) !important;
                }

                .portal-circle-dimmed {
                    opacity: 0.35;
                    filter: grayscale(80%);
                    border-color: rgba(255, 255, 255, 0.1);
                }

                .portal-hover-label {
                    position: absolute;
                    top: 55px;
                    background: rgba(16, 22, 34, 0.95);
                    backdrop-filter: blur(10px);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 700;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.2s ease-out;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
                }

                .portal-marker-container:hover .portal-hover-label {
                    opacity: 1;
                    transform: translateY(5px);
                }
            `})]})});function Te(){var H,Z,Q,J;const y=r.useRef(null),[Y,z]=r.useState(!1),[I,$]=r.useState(null),[o,k]=r.useState(!1),[x,h]=r.useState(""),[j,g]=r.useState(null),[w,G]=r.useState(""),[X,N]=r.useState(!1),[U,M]=r.useState(""),[R,f]=r.useState([]),[B,S]=r.useState(!0),[i,T]=r.useState(null),[O,A]=r.useState(!1),[P,F]=r.useState(!1),[a,s]=r.useState(!1),[l,p]=r.useState(!1),c=t=>{if(!t)return"";let m=t;if(t.includes("%3A")||t.includes("%2F"))try{m=decodeURIComponent(t),(m.includes("%3A")||m.includes("%2F"))&&(m=decodeURIComponent(m))}catch{}return re(m)};r.useEffect(()=>{p(pe.isNativePlatform())},[]),r.useEffect(()=>{(async()=>{try{S(!0);const m=await K.get("/api/portals/map");f(m.data)}catch{f([])}finally{S(!1)}})()},[]);const n=()=>{var t;return(t=y.current)==null?void 0:t.zoomIn()},b=()=>{var t;return(t=y.current)==null?void 0:t.zoomOut()},d=()=>{var t;return(t=y.current)==null?void 0:t.resetView()},u=()=>{var m;const t=w.trim();if(N(!1),M(t),t.length>0){const v=R.find(_=>_.name.toLowerCase().includes(t.toLowerCase())||(_.label||"").toLowerCase().includes(t.toLowerCase()));v?(m=y.current)==null||m.flyTo(v.lat,v.lng,1.2):d()}else d()},E=()=>{G(""),M(""),N(!1)},C=t=>{$(m=>m===t?null:t)},L=r.useCallback(async t=>{var m;z(!0),g(t),T(null),A(!0),(m=y.current)==null||m.flyTo(t.lat,t.lng,.05);try{const v=await K.get(`/api/portals/${t._id}`);T(v.data),F(v.data.isMember||!1)}catch{}finally{A(!1)}},[]),oe=async()=>{if(i){s(!0);try{const t=await K.post(`/api/portals/${i._id}/join`);t.data.status==="joined"?F(!0):t.data.status==="requested"&&F("requested")}catch{}finally{s(!1)}}},W=r.useRef(""),ne=t=>{h(t.target.value),W.current=t.target.value},se=async t=>{t.preventDefault();const m=W.current.trim();if(!m||!y.current)return;const v=m.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);if(v){const V=parseFloat(v[1]),D=parseFloat(v[2]);y.current.flyTo(V,D,1.2);return}const q={istanbul:{lat:41.01,lng:28.98},ankara:{lat:39.93,lng:32.86},london:{lat:51.5,lng:-.12},"new york":{lat:40.71,lng:-74.01},tokyo:{lat:35.68,lng:139.69},paris:{lat:48.85,lng:2.35},dubai:{lat:25.2,lng:55.27},rome:{lat:41.9,lng:12.49},berlin:{lat:52.52,lng:13.4},moscow:{lat:55.75,lng:37.61},beijing:{lat:39.9,lng:116.39},sydney:{lat:-33.87,lng:151.21},cairo:{lat:30.04,lng:31.23},mumbai:{lat:19.07,lng:72.87},"los angeles":{lat:34.05,lng:-118.24},"rio de janeiro":{lat:-22.91,lng:-43.17},singapore:{lat:1.35,lng:103.82},seoul:{lat:37.57,lng:126.97},toronto:{lat:43.65,lng:-79.38},"mexico city":{lat:19.43,lng:-99.13},"buenos aires":{lat:-34.6,lng:-58.38},amsterdam:{lat:52.37,lng:4.9},barcelona:{lat:41.39,lng:2.17},"san francisco":{lat:37.77,lng:-122.42},washington:{lat:38.9,lng:-77.03},chicago:{lat:41.88,lng:-87.63},miami:{lat:25.76,lng:-80.19},izmir:{lat:38.42,lng:27.13},antalya:{lat:36.88,lng:30.69},bursa:{lat:40.18,lng:29.06}}[m.toLowerCase()];if(q){y.current.flyTo(q.lat,q.lng,.05);return}try{const D=await(await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(m)}&format=json&limit=1`)).json();if(D&&D.length>0){const ie=parseFloat(D[0].lat),ce=parseFloat(D[0].lon);y.current.flyTo(ie,ce,1.2)}}catch{}},le=e.jsx("div",{className:"map-navbar-search",children:e.jsxs("div",{className:"map-navbar-search-inner",children:[e.jsx("span",{onClick:u,className:"material-symbols-outlined map-search-icon",title:"Ara",children:"travel_explore"}),e.jsx("input",{value:w,onChange:t=>{G(t.target.value),N(!0),t.target.value===""&&M("")},onKeyDown:t=>{t.key==="Enter"&&(t.preventDefault(),u())},onFocus:()=>N(!0),onBlur:()=>setTimeout(()=>N(!1),200),className:"map-navbar-search-input",placeholder:"Portal veya konum ara...",type:"text"}),w.length>0&&e.jsx("span",{onClick:E,className:"material-symbols-outlined map-search-clear",title:"Temizle",children:"close"}),X&&w.length>0&&e.jsx("div",{className:"map-navbar-search-dropdown",children:R.filter(t=>t.name.toLowerCase().includes(w.toLowerCase())||(t.label||"").toLowerCase().includes(w.toLowerCase())).length>0?R.filter(t=>t.name.toLowerCase().includes(w.toLowerCase())||(t.label||"").toLowerCase().includes(w.toLowerCase())).map(t=>e.jsxs("div",{onMouseDown:()=>{G(""),N(!1),L(t)},className:"map-navbar-search-result",children:[e.jsx("span",{className:"material-symbols-outlined map-result-icon",children:"location_on"}),e.jsxs("div",{children:[e.jsx("span",{className:"map-result-name",children:t.name}),e.jsx("span",{className:"map-result-loc",children:t.label||""})]})]},t._id)):e.jsx("div",{className:"map-navbar-no-results",children:"Portal bulunamadı"})})]})});return e.jsxs("div",{className:"map-simulation-page",style:{height:"100vh",display:"flex",flexDirection:"column",background:"#0a0a0d",overflow:"hidden"},children:[e.jsx(Ne,{title:"Portal Haritası | Oxypace",description:"Tüm Oxypace portallarını interaktif 3D dünya üzerinde keşfedin."}),e.jsx(ke,{centerContent:le,hideThemeToggle:!0,mapMode:!0}),e.jsx("div",{className:"map-back-button-container",children:e.jsx(je,{variant:"frosted",showBack:!0})}),e.jsxs("main",{style:{flex:1,position:"relative",display:"flex",overflow:"hidden"},children:[e.jsx("div",{style:{position:"absolute",inset:0,zIndex:0},children:l?e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",color:"rgba(255,255,255,0.6)",padding:"24px",textAlign:"center"},children:[e.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"48px",marginBottom:"16px",opacity:.5},children:"public_off"}),e.jsx("h2",{style:{fontSize:"18px",fontWeight:"bold",color:"white",marginBottom:"8px"},children:"Mobil Uygulama Görünümü Devre Dışı"}),e.jsx("p",{style:{fontSize:"14px",maxWidth:"300px"},children:"Yüksek performans gerektiren 3D dünya simülasyonu, mobil uygulamada pil ve performans tasarrufu amacıyla devre dışı bırakılmıştır. Web sürümünden erişebilirsiniz."})]}):e.jsx(ze,{ref:y,portals:R,onPortalClick:L,activePortalSearch:U,onGlobeClick:()=>z(!1)})}),e.jsxs("div",{className:`map-left-panel ${o?"mobile-visible":"mobile-hidden"}`,children:[e.jsxs("div",{className:"map-controls-bar glass-panel borderless",children:[e.jsx("div",{className:"map-ctrl-separator desktop-only"}),e.jsx("button",{onClick:()=>C("search"),className:`map-ctrl-btn ${I==="search"?"active":""}`,title:"Koordinat / Şehir Ara",children:e.jsx("span",{className:"material-symbols-outlined",children:"my_location"})}),e.jsx("div",{className:"map-ctrl-separator"}),e.jsx("button",{onClick:n,className:"map-ctrl-btn",title:"Yakınlaştır",children:e.jsx("span",{className:"material-symbols-outlined",children:"add"})}),e.jsx("button",{onClick:b,className:"map-ctrl-btn",title:"Uzaklaştır",children:e.jsx("span",{className:"material-symbols-outlined",children:"remove"})}),e.jsx("div",{className:"map-ctrl-separator"}),e.jsx("button",{onClick:d,className:"map-ctrl-btn",title:"Görünümü Sıfırla",children:e.jsx("span",{className:"material-symbols-outlined",children:"explore"})})]}),I&&e.jsx("div",{className:"map-expanded-panel glass-panel",children:I==="search"&&e.jsxs("form",{onSubmit:se,style:{padding:"12px",width:"220px"},children:[e.jsx("p",{style:{fontSize:"10px",color:"rgba(148,163,184,0.8)",marginBottom:"8px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"},children:"Koordinat / Şehir Ara"}),e.jsxs("div",{style:{position:"relative"},children:[e.jsx("span",{className:"material-symbols-outlined",style:{position:"absolute",left:"8px",top:"50%",transform:"translateY(-50%)",fontSize:"16px",color:"rgba(148,163,184,0.7)"},children:"search"}),e.jsx("input",{autoFocus:!0,value:x,onChange:ne,style:{width:"100%",background:"rgba(255,255,255,0.06)",border:"none",borderRadius:"8px",padding:"8px 10px 8px 30px",fontSize:"13px",color:"white",outline:"none",boxSizing:"border-box"},placeholder:"London, 41.01,28.98...",type:"text"})]}),e.jsx("p",{style:{fontSize:"10px",color:"rgba(148,163,184,0.5)",marginTop:"6px"},children:"Enter'a bas veya 🔍'e tıkla"})]})}),e.jsx("button",{className:`map-mobile-controls-toggle glass-panel borderless ${o?"active":""}`,onClick:()=>k(!o),title:"Kontrolleri Göster/Gizle",children:e.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"20px"},children:o?"keyboard_double_arrow_left":"keyboard_double_arrow_right"})})]}),j&&Y&&e.jsxs("aside",{className:"map-portal-card glass-panel",children:[e.jsx("button",{onClick:()=>z(!1),className:"map-portal-card-close",title:"Kapat",children:e.jsx("span",{className:"material-symbols-outlined",children:"close"})}),O?e.jsxs("div",{style:{padding:"16px",display:"flex",flexDirection:"column",gap:"12px"},children:[e.jsx("div",{style:{height:"120px",background:"rgba(255,255,255,0.06)",borderRadius:"10px",animation:"pulse 1.5s infinite"}}),e.jsxs("div",{style:{display:"flex",gap:"12px",alignItems:"center"},children:[e.jsx("div",{style:{width:"52px",height:"52px",borderRadius:"50%",background:"rgba(255,255,255,0.08)",flexShrink:0,animation:"pulse 1.5s infinite"}}),e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("div",{style:{height:"14px",background:"rgba(255,255,255,0.08)",borderRadius:"6px",width:"60%",animation:"pulse 1.5s infinite"}}),e.jsx("div",{style:{height:"11px",background:"rgba(255,255,255,0.05)",borderRadius:"6px",width:"40%",animation:"pulse 1.5s infinite"}})]})]}),e.jsx("div",{style:{height:"60px",background:"rgba(255,255,255,0.05)",borderRadius:"8px",animation:"pulse 1.5s infinite"}})]}):i?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"map-portal-card-banner",children:[i.banner?e.jsx("img",{src:c(i.banner),alt:"",className:"map-portal-banner-img",onError:t=>{t.target.onerror=null,t.target.src="/assets/default-cover.png"}}):e.jsx("img",{src:"/assets/default-cover.png",alt:"",className:"map-portal-banner-img"}),e.jsx("div",{className:"map-portal-banner-gradient"})]}),e.jsxs("div",{className:"map-portal-card-identity",children:[e.jsx("div",{className:"map-portal-card-avatar-wrap",children:i.avatar?e.jsx("img",{src:c(i.avatar),alt:i.name,className:"map-portal-card-avatar",onError:t=>{t.target.onerror=null,t.target.src="/assets/default-avatar.png"}}):e.jsx("div",{className:"map-portal-card-avatar-letter",children:i.name[0]})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("h2",{className:"map-portal-card-title",children:i.name}),e.jsxs("p",{className:"map-portal-card-loc",children:[e.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"13px"},children:"location_on"}),j.label||i.name]})]})]}),e.jsxs("div",{className:"map-portal-card-stats",children:[e.jsxs("div",{className:"map-portal-stat",children:[e.jsx("span",{className:"map-portal-stat-label",children:"Üyeler"}),e.jsx("span",{className:"map-portal-stat-value",style:{color:"#4ade80"},children:((H=i.members)==null?void 0:H.length)??j.memberCount??0})]}),e.jsxs("div",{className:"map-portal-stat",children:[e.jsx("span",{className:"map-portal-stat-label",children:"Gizlilik"}),e.jsx("span",{className:"map-portal-stat-value",style:{color:"#60a5fa",textTransform:"capitalize"},children:i.privacy==="public"?"Herkese Açık":i.privacy==="private"?"Gizli":"Kısıtlı"})]}),e.jsxs("div",{className:"map-portal-stat",children:[e.jsx("span",{className:"map-portal-stat-label",children:"Kuruluş"}),e.jsx("span",{className:"map-portal-stat-value",style:{fontSize:"10px"},children:i.createdAt?new Date(i.createdAt).toLocaleDateString("tr-TR",{year:"numeric",month:"short"}):"—"})]})]}),i.description&&e.jsx("div",{className:"map-portal-card-bio",children:e.jsx("p",{className:"map-portal-bio-text",children:i.description})}),i.owner&&e.jsxs("div",{className:"map-portal-owner-row",children:[(Z=i.owner.profile)!=null&&Z.avatar?e.jsx("img",{src:c(i.owner.profile.avatar),alt:"",className:"map-portal-owner-avatar",onError:t=>{t.target.onerror=null,t.target.src="/assets/default-avatar.png"}}):e.jsx("div",{className:"map-portal-owner-avatar map-portal-owner-letter",children:(((Q=i.owner.profile)==null?void 0:Q.displayName)||i.owner.username||"?")[0].toUpperCase()}),e.jsxs("div",{children:[e.jsx("span",{className:"map-portal-owner-label",children:"Kurucu"}),e.jsx("span",{className:"map-portal-owner-name",children:((J=i.owner.profile)==null?void 0:J.displayName)||i.owner.username})]})]}),e.jsxs("div",{className:"map-portal-card-actions",children:[e.jsxs(de,{to:`/portal/${i._id}`,className:"map-portal-btn-primary",children:["Git",e.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"16px"},children:"arrow_forward"})]}),P===!0?e.jsxs("div",{className:"map-portal-member-badge",children:[e.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"15px"},children:"check_circle"}),"Üyesiniz"]}):P==="requested"?e.jsxs("div",{className:"map-portal-member-badge",style:{color:"#f59e0b",borderColor:"rgba(245,158,11,0.3)"},children:[e.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"15px"},children:"schedule"}),"İstek Gönderildi"]}):e.jsxs("button",{className:"map-portal-btn-secondary",onClick:oe,disabled:a,children:[e.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"15px"},children:"add"}),a?"Katılınıyor...":"Üye Ol"]})]})]}):e.jsx("div",{style:{padding:"24px",textAlign:"center",color:"rgba(148,163,184,0.7)",fontSize:"13px"},children:"Portal bilgileri yüklenemedi."})]})]}),e.jsx("style",{children:`
                /* ── Map Page Scoped Styles ─────────────────────────────── */

                /* Map Mode Navbar Overrides */
                .navbar-map-mode {
                    background: rgba(13, 17, 28, 0.45) !important;
                    backdrop-filter: blur(16px) !important;
                    border-bottom: none !important;
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1) !important;
                }

                .borderless {
                    border: none !important;
                    box-shadow: none !important;
                    background: rgba(13, 17, 28, 0.45) !important;
                    backdrop-filter: blur(16px) !important;
                }

                /* Navbar portal search bar */
                .map-navbar-search {
                    width: 100%;
                    max-width: 420px;
                    position: relative;
                }
                .map-navbar-search-inner {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .map-search-icon {
                    position: absolute;
                    left: 10px;
                    font-size: 18px;
                    color: rgba(148,163,184,0.7);
                    cursor: pointer;
                    transition: color 0.2s;
                    z-index: 1;
                    user-select: none;
                }
                .map-search-icon:hover { color: white; }
                .map-navbar-search-input {
                    width: 100%;
                    background: rgba(255,255,255,0.06);
                    border: none;
                    border-radius: 10px;
                    padding: 7px 36px 7px 36px;
                    font-size: 13px;
                    color: white;
                    outline: none;
                    transition: background 0.2s;
                }
                .map-navbar-search-input::placeholder { color: rgba(148,163,184,0.6); }
                .map-navbar-search-input:focus {
                    background: rgba(255,255,255,0.12);
                }
                .map-search-clear {
                    position: absolute;
                    right: 10px;
                    font-size: 16px;
                    color: rgba(148,163,184,0.6);
                    cursor: pointer;
                    transition: color 0.2s;
                    user-select: none;
                }
                .map-search-clear:hover { color: white; }
                .map-navbar-search-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    right: 0;
                    background: rgba(13,17,28,0.97);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    overflow: hidden;
                    z-index: 2000;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    animation: mapDropdown 0.18s ease-out;
                }
                @keyframes mapDropdown {
                    from { opacity: 0; transform: translateY(-6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .map-navbar-search-result {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 14px;
                    cursor: pointer;
                    transition: background 0.15s;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .map-navbar-search-result:last-child { border-bottom: none; }
                .map-navbar-search-result:hover { background: rgba(255,255,255,0.07); }
                .map-result-icon {
                    font-size: 18px;
                    color: #6366f1;
                    flex-shrink: 0;
                }
                .map-result-name {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: white;
                }
                .map-result-loc {
                    display: block;
                    font-size: 11px;
                    color: rgba(148,163,184,0.7);
                }
                .map-navbar-no-results {
                    padding: 14px;
                    text-align: center;
                    font-size: 12px;
                    color: rgba(148,163,184,0.6);
                }

                /* ── Left Controls Panel ── */
                .map-mobile-controls-toggle {
                    display: none;
                    position: absolute;
                    left: 100%;
                    top: 16px; 
                    margin-left: 0px;
                    z-index: -1;
                    width: 38px;
                    height: 48px;
                    border-radius: 0 14px 14px 0 !important;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    cursor: pointer;
                    box-shadow: 4px 4px 16px rgba(0,0,0,0.3);
                    pointer-events: auto;
                }
                .map-mobile-controls-toggle:active {
                    background: rgba(255,255,255,0.1) !important;
                }
                .map-left-panel {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 10;
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    pointer-events: none;
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .map-controls-bar {
                    pointer-events: auto;
                    border-radius: 14px;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    width: 44px;
                    align-items: center;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                }
                .map-ctrl-btn {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    background: transparent;
                    border: none;
                    color: rgba(148,163,184,0.8);
                    cursor: pointer;
                    transition: background 0.2s, color 0.2s;
                }
                .map-ctrl-btn:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }
                .map-ctrl-btn.active {
                    background: rgba(99,102,241,0.3);
                    color: #818cf8;
                }
                .map-ctrl-btn .material-symbols-outlined { font-size: 18px; }
                .map-ctrl-separator {
                    width: 100%;
                    height: 1px;
                    background: rgba(255,255,255,0.08);
                    margin: 2px 0;
                }
                .map-expanded-panel {
                    pointer-events: auto;
                    border-radius: 14px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                    overflow: hidden;
                    animation: mapPanelIn 0.2s ease-out;
                }
                @keyframes mapPanelIn {
                    from { opacity: 0; transform: translateX(-8px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                /* ── Portal Detail Card ── */
                .map-portal-card {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 300px;
                    border-radius: 20px;
                    overflow: hidden;
                    z-index: 50;
                    border: 1px solid rgba(255,255,255,0.15);
                    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                    animation: cardSlideIn 0.35s cubic-bezier(0.4,0,0.2,1);
                }
                @keyframes cardSlideIn {
                    from { opacity: 0; transform: translateX(24px) scale(0.97); }
                    to { opacity: 1; transform: translateX(0) scale(1); }
                }
                .map-portal-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 16px 16px 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                }
                .map-portal-card-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: white;
                    margin: 0 0 3px;
                    letter-spacing: -0.3px;
                }
                .map-portal-card-loc {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    font-size: 11px;
                    color: rgba(148,163,184,0.8);
                    margin: 0;
                }
                .map-portal-card-close {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0,0,0,0.5);
                    border: none;
                    border-radius: 8px;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: rgba(255,255,255,0.8);
                    transition: background 0.2s;
                    z-index: 10;
                    flex-shrink: 0;
                }
                .map-portal-card-close:hover { background: rgba(0,0,0,0.75); color: white; }
                .map-portal-card-close .material-symbols-outlined { font-size: 16px; }

                /* Banner */
                .map-portal-card-banner {
                    position: relative;
                    height: 110px;
                    overflow: hidden;
                    flex-shrink: 0;
                }
                .map-portal-banner-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .map-portal-banner-fallback {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #1a1f3c 0%, #0d1117 100%);
                }
                .map-portal-banner-gradient {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(13,17,28,0.9) 0%, rgba(13,17,28,0.2) 60%, transparent 100%);
                }

                /* Identity row */
                .map-portal-card-identity {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 0 14px 12px;
                    margin-top: -24px;
                    position: relative;
                    z-index: 2;
                }
                .map-portal-card-avatar-wrap {
                    flex-shrink: 0;
                }
                .map-portal-card-avatar {
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    border: 3px solid rgba(13,17,28,1);
                    object-fit: cover;
                }
                .map-portal-card-avatar-letter {
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    border: 3px solid rgba(13,17,28,1);
                    background: linear-gradient(135deg, #6366f1, #818cf8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 22px;
                    font-weight: 800;
                    color: white;
                }
                .map-portal-card-title {
                    font-size: 15px;
                    font-weight: 700;
                    color: white;
                    margin: 0 0 3px;
                    letter-spacing: -0.3px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .map-portal-card-loc {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    font-size: 11px;
                    color: rgba(148,163,184,0.8);
                    margin: 0;
                }

                /* Owner row */
                .map-portal-owner-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 14px;
                    border-top: 1px solid rgba(255,255,255,0.06);
                }
                .map-portal-owner-avatar {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    object-fit: cover;
                    flex-shrink: 0;
                }
                .map-portal-owner-letter {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #6366f1, #818cf8);
                    font-size: 13px;
                    font-weight: 700;
                    color: white;
                }
                .map-portal-owner-label {
                    display: block;
                    font-size: 9px;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: rgba(148,163,184,0.5);
                    font-weight: 700;
                }
                .map-portal-owner-name {
                    display: block;
                    font-size: 12px;
                    font-weight: 600;
                    color: rgba(203,213,225,0.9);
                }

                /* Member badge */
                .map-portal-member-badge {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 8px 12px;
                    background: rgba(46,204,113,0.08);
                    border: 1px solid rgba(46,204,113,0.25);
                    border-radius: 10px;
                    color: #2ecc71;
                    font-size: 12px;
                    font-weight: 600;
                }

                /* Skeleton pulse */
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .map-portal-card-stats {
                    display: grid;
                    grid-template-columns: repeat(3,1fr);
                    gap: 1px;
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                    background: rgba(255,255,255,0.04);
                }
                .map-portal-stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 10px 6px;
                    background: rgba(13,17,28,0.7);
                    gap: 2px;
                }
                .map-portal-stat-label {
                    font-size: 9px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: rgba(148,163,184,0.6);
                }
                .map-portal-stat-value {
                    font-size: 13px;
                    font-weight: 700;
                    color: white;
                    font-family: monospace;
                }
                .map-portal-card-bio {
                    padding: 12px 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                }
                .map-portal-bio-label {
                    font-size: 9px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: rgba(148,163,184,0.55);
                    margin: 0 0 6px;
                }
                .map-portal-bio-text {
                    font-size: 11.5px;
                    color: rgba(203,213,225,0.85);
                    line-height: 1.6;
                    margin: 0;
                    font-style: italic;
                    display: -webkit-box;
                    -webkit-line-clamp: 4;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .map-portal-card-actions {
                    display: flex;
                    gap: 8px;
                    padding: 12px 16px;
                }
                .map-portal-btn-primary {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 9px 12px;
                    background: linear-gradient(135deg, #6366f1, #818cf8);
                    color: white;
                    font-size: 12px;
                    font-weight: 600;
                    border-radius: 10px;
                    text-decoration: none;
                    transition: opacity 0.2s, transform 0.2s;
                    box-shadow: 0 4px 14px rgba(99,102,241,0.35);
                }
                .map-portal-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
                .map-portal-btn-secondary {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 9px 12px;
                    background: rgba(255,255,255,0.07);
                    border: 1px solid rgba(255,255,255,0.12);
                    color: rgba(203,213,225,0.9);
                    font-size: 12px;
                    font-weight: 600;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .map-portal-btn-secondary:hover { background: rgba(255,255,255,0.12); }

                /* ── Glass panel shared ── */
                .glass-panel {
                    background: rgba(13,17,28,0.75);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                /* Slider thumb */
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #6366f1;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 0 6px rgba(99,102,241,0.6);
                }

                /* ── Responsive Overrides ── */
                @media (max-width: 768px) {
                    .map-mobile-controls-toggle {
                        display: flex; /* Sadece mobilde göster */
                    }
                    
                    .map-left-panel.mobile-hidden {
                        transform: translateY(-50%) translateX(calc(-100% - 16px));
                    }
                    .map-left-panel.mobile-visible {
                        transform: translateY(-50%) translateX(0);
                    }

                    .map-portal-card-drawer {
                        width: 100%;
                        max-width: none;
                        top: auto;
                        bottom: 0;
                        left: 0;
                        transform: translateY(100%);
                        border-radius: 20px 20px 0 0;
                        border-left: none;
                        border-bottom: none;
                        border-right: none;
                        border-top: 1px solid rgba(255,255,255,0.1);
                    }
                    .map-portal-card-drawer.open {
                        transform: translateY(0);
                    }
                }
            `})]})}export{Te as default};
