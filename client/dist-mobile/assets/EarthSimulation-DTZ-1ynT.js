import{r,a1 as e,a0 as le,Z as X,aq as ie}from"./vendor-yfUlz74V.js";import{G as ce,T as pe,D as de,A as me,S as W,M as ue,a as be,b as Q,c as J,d as he,B as ge,V as xe,e as fe}from"./globe-visualization-BCgUTwKB.js";import{d as ee}from"./index-PbaffhiJ.js";import{N as ye}from"./Navbar-Bp1ZENtA.js";import{S as ve}from"./SubHeader-CowMU5zN.js";import{S as we}from"./SEO-BiXzaUTk.js";import"./socket-CN53UXqw.js";import"./livekit-C_vxKPn8.js";import"./lucide-CvMDHPSq.js";import"./UserAvatar-aknlveFd.js";/* empty css                  */const ke=r.forwardRef(({portals:y=[],onPortalClick:_,activePortalSearch:S,onGlobeClick:G},$)=>{const o=r.useRef(),k=r.useRef(),h=r.useRef(2.5),x=r.useRef(null),j=r.useRef({x:0,y:0}),b=r.useRef(!1),[w,T]=r.useState({width:window.innerWidth,height:window.innerHeight}),[K,N]=r.useState(!1),U=r.useRef(!1),M=r.useRef(0),R=r.useRef(30),f=r.useCallback(()=>{const t=performance.now();if(t-M.current<1e3/R.current){requestAnimationFrame(f);return}if(M.current=t,!o.current||!b.current)return;const l=o.current.pointOfView(),i=h.current-l.altitude,c=l.altitude<=.8;if(c!==U.current&&(U.current=c,N(c)),Math.abs(i)<1e-4){b.current=!1,x.current=null;return}const n=l.altitude+i*.1;let g=l.lat,p=l.lng;if(x.current&&k.current&&typeof o.current.toGlobeCoords=="function"){const u=o.current.toGlobeCoords(j.current.x,j.current.y);if(u){let E=x.current.lat-u.lat,C=x.current.lng-u.lng;C=((C+180)%360+360)%360-180;const L=.15;g+=E*L,p+=C*L}}g=Math.max(-90,Math.min(90,g)),p=((p+180)%360+360)%360-180,o.current.pointOfView({lat:g,lng:p,altitude:n},0),requestAnimationFrame(f)},[]);r.useImperativeHandle($,()=>({zoomIn:()=>{h.current=Math.max(.002,h.current*.5),x.current=null,b.current||(b.current=!0,requestAnimationFrame(f))},zoomOut:()=>{h.current=Math.min(4,h.current*2),x.current=null,b.current||(b.current=!0,requestAnimationFrame(f))},resetView:()=>{h.current=2.5,b.current=!1,o.current&&o.current.pointOfView({lat:20,lng:30,altitude:2.5},1500)},flyTo:(t,s,l)=>{const i=l||.012;h.current=i,b.current=!1,o.current&&o.current.pointOfView({lat:t,lng:s,altitude:i},2500)}})),r.useEffect(()=>{const t=()=>{k.current&&T({width:k.current.clientWidth,height:k.current.clientHeight})};if(window.addEventListener("resize",t),setTimeout(t,50),o.current){const s=o.current.controls();s.autoRotate=!0,s.autoRotateSpeed=.3,s.rotateSpeed=.4,s.minDistance=100.2,s.enableZoom=!1,o.current.pointOfView({lat:20,lng:30,altitude:2.5},0)}return()=>{window.removeEventListener("resize",t),o.current&&o.current.scene().traverse(l=>{l.geometry&&l.geometry.dispose(),l.material&&(Array.isArray(l.material)?l.material.forEach(i=>i.dispose()):l.material.dispose())})}},[]);const Y=r.useCallback(t=>{if(t.preventDefault(),!o.current)return;o.current.controls().autoRotate=!1;const l=t.deltaY<0?.85:1.15;if(h.current=Math.max(.002,Math.min(4,h.current*l)),k.current&&typeof o.current.toGlobeCoords=="function"){const i=k.current.getBoundingClientRect(),c=t.clientX-i.left,n=t.clientY-i.top;if(Math.hypot(c-j.current.x,n-j.current.y)>2||!b.current||!x.current){const p=o.current.toGlobeCoords(c,n);p?(x.current=p,j.current={x:c,y:n}):x.current=null}}b.current||(b.current=!0,requestAnimationFrame(f))},[f]),z=r.useRef(null),m=r.useRef(null),D=r.useRef(0),F=r.useCallback(t=>{if(o.current){if(o.current.controls().autoRotate=!1,t.touches.length===2){o.current.controls().enabled=!1,x.current=null;const s=t.touches[0].clientX-t.touches[1].clientX,l=t.touches[0].clientY-t.touches[1].clientY;z.current=Math.hypot(s,l),m.current=h.current}else if(t.touches.length===1){const s=Date.now();s-D.current<300&&(h.current=Math.max(.002,h.current*.5),b.current||(b.current=!0,requestAnimationFrame(f))),D.current=s}}},[f]),A=r.useCallback(t=>{if(t.touches.length===2&&o.current&&z.current!==null){t.preventDefault();const s=t.touches[0].clientX-t.touches[1].clientX,l=t.touches[0].clientY-t.touches[1].clientY,i=Math.hypot(s,l),c=z.current/i;h.current=Math.max(.002,Math.min(4,m.current*c)),b.current||(b.current=!0,requestAnimationFrame(f))}},[f]),P=r.useCallback(t=>{t.touches.length<2&&o.current&&(z.current=null,o.current.controls().enabled=!0)},[]);r.useEffect(()=>{const t=k.current;if(t)return t.addEventListener("wheel",Y,{passive:!1}),t.addEventListener("touchstart",F,{passive:!1}),t.addEventListener("touchmove",A,{passive:!1}),t.addEventListener("touchend",P),()=>{t.removeEventListener("wheel",Y),t.removeEventListener("touchstart",F),t.removeEventListener("touchmove",A),t.removeEventListener("touchend",P)}},[Y,F,A,P]);const O=(t,s,l)=>`https://mt1.google.com/vt/lyrs=s&x=${t}&y=${s}&z=${l}&scale=2`;return e.jsxs("div",{ref:k,className:"w-full h-full",onPointerDown:()=>{o.current&&(o.current.controls().autoRotate=!1),x.current=null},children:[e.jsx(ce,{ref:o,onGlobeReady:()=>{if(!o.current)return;const t=o.current.scene(),s=o.current.getGlobeRadius?o.current.getGlobeRadius():100,l=new pe;t.traverse(n=>{n.isMesh&&n.material&&!["cloudLayer","volumetricAtmosphere"].includes(n.name)&&(n.material.shininess=10)});const i=t.getObjectByName("globe");if(i&&i.material&&(i.material.emissiveIntensity=0,i.material.emissive&&i.material.emissive.setHex(0),i.material.shininess!==void 0&&(i.material.shininess=5)),!t.getObjectByName("realSun")){const n=new de(16777215,4.5);n.name="realSun",t.add(n)}if(!t.getObjectByName("zifiriGece")){const n=new me(14544639,.7);n.name="zifiriGece",t.add(n)}const c=()=>{var g;const n=(g=o.current)==null?void 0:g.camera();if(n){n.children.forEach(u=>{u.isLight&&(u.intensity=0)});const p=t.getObjectByName("realSun");if(p){const u=new xe(-1,.1,.2).normalize();u.applyQuaternion(n.quaternion),u.multiplyScalar(500),p.position.copy(n.position).add(u)}}t.children.forEach(p=>{p.isLight&&p.name!=="realSun"&&p.name!=="zifiriGece"&&(p.intensity=0)}),requestAnimationFrame(c)};if(c(),!t.getObjectByName("cloudLayer")){const n=new W(s*1.006,64,64),g=l.load("/textures/earth-clouds.png"),p=new ue({map:g,transparent:!0,opacity:.8,blending:Q,depthWrite:!1,side:be}),u=new J(n,p);u.name="cloudLayer",t.add(u);const E=()=>{if(u&&o.current){u.rotation.y+=2e-4;const C=o.current.pointOfView().altitude,L=fe.clamp((C-.1)*1.5,0,.8);p.opacity=L}requestAnimationFrame(E)};E()}if(!t.getObjectByName("volumetricAtmosphere")){const n=new W(s*1.18,64,64),g=new he({vertexShader:`
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
                            `,transparent:!0,blending:Q,side:ge,depthWrite:!1}),p=new J(n,g);p.name="volumetricAtmosphere",t.add(p)}},width:w.width,height:w.height,backgroundColor:"#010206",showAtmosphere:!1,onGlobeClick:G,globeImageUrl:"//unpkg.com/three-globe@2.24.0/example/img/earth-blue-marble.jpg",bumpImageUrl:"//unpkg.com/three-globe@2.24.0/example/img/earth-topology.png",backgroundImageUrl:"//unpkg.com/three-globe@2.24.0/example/img/night-sky.png",globeTileEngineUrl:O,tileLayer:{maxZoom:22,attribution:"Google Satellite-DPI"},htmlElementsData:y,htmlElement:t=>{const s=document.createElement("div");s.className="portal-marker-container";let l="portal-circle";if(S&&S.length>0){const c=S.toLowerCase();t.name.toLowerCase().includes(c)||(t.label||"").toLowerCase().includes(c)?l="portal-circle portal-circle-match":l="portal-circle portal-circle-dimmed"}let i="";if(t.avatar){const c=t.avatar;let n=c;if(c.includes("%3A")||c.includes("%2F"))try{n=decodeURIComponent(c),(n.includes("%3A")||n.includes("%2F"))&&(n=decodeURIComponent(n))}catch{}i=ee(n)}return s.innerHTML=`
                        <div class="${l}" data-name="${t.name[0].toUpperCase()}">
                            ${i?`<img src="${i}" alt="${t.name}" onerror="this.onerror=null;this.src='/assets/default-avatar.png';" />`:`<span class="portal-letter">${t.name[0].toUpperCase()}</span>`}
                        </div>
                        <div class="portal-hover-label">${t.name}</div>
                    `,s.style.position="relative",s.style.cursor="pointer",s.onclick=c=>{c.stopPropagation(),_(t)},s.onpointerdown=c=>{c.stopPropagation()},s},htmlLat:t=>t.lat,htmlLng:t=>t.lng,htmlAltitude:0}),e.jsx("style",{children:`
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
            `})]})});function Ie(){var H;const y=r.useRef(null),[_,S]=r.useState(!1),[G,$]=r.useState(null),[o,k]=r.useState(!1),[h,x]=r.useState(""),[j,b]=r.useState(null),[w,T]=r.useState(""),[K,N]=r.useState(!1),[U,M]=r.useState(""),[R,f]=r.useState([]),[Y,z]=r.useState(!0),[m,D]=r.useState(null),[F,A]=r.useState(!1),[P,O]=r.useState(!1),[t,s]=r.useState(!1),[l,i]=r.useState(!1),c=a=>{if(!a)return"";let d=a;if(a.includes("%3A")||a.includes("%2F"))try{d=decodeURIComponent(a),(d.includes("%3A")||d.includes("%2F"))&&(d=decodeURIComponent(d))}catch{}return ee(d)};r.useEffect(()=>{i(le.isNativePlatform())},[]),r.useEffect(()=>{(async()=>{try{z(!0);const d=await X.get("/api/portals/map");f(d.data)}catch{f([])}finally{z(!1)}})()},[]);const n=()=>{var a;return(a=y.current)==null?void 0:a.zoomIn()},g=()=>{var a;return(a=y.current)==null?void 0:a.zoomOut()},p=()=>{var a;return(a=y.current)==null?void 0:a.resetView()},u=()=>{var d;const a=w.trim();if(N(!1),M(a),a.length>0){const v=R.find(q=>q.name.toLowerCase().includes(a.toLowerCase())||(q.label||"").toLowerCase().includes(a.toLowerCase()));v?(d=y.current)==null||d.flyTo(v.lat,v.lng,1.2):p()}else p()},E=()=>{T(""),M(""),N(!1)},C=a=>{$(d=>d===a?null:a)},L=r.useCallback(async a=>{var d;S(!0),b(a),D(null),A(!0),(d=y.current)==null||d.flyTo(a.lat,a.lng,.05);try{const v=await X.get(`/api/portals/${a._id}`);D(v.data),O(v.data.isMember||!1)}catch{}finally{A(!1)}},[]),te=async()=>{if(m){s(!0);try{const a=await X.post(`/api/portals/${m._id}/join`);a.data.status==="joined"?O(!0):a.data.status==="requested"&&O("requested")}catch{}finally{s(!1)}}},Z=r.useRef(""),ae=a=>{x(a.target.value),Z.current=a.target.value},re=async a=>{a.preventDefault();const d=Z.current.trim();if(!d||!y.current)return;const v=d.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);if(v){const V=parseFloat(v[1]),I=parseFloat(v[2]);y.current.flyTo(V,I,1.2);return}const B={istanbul:{lat:41.01,lng:28.98},ankara:{lat:39.93,lng:32.86},london:{lat:51.5,lng:-.12},"new york":{lat:40.71,lng:-74.01},tokyo:{lat:35.68,lng:139.69},paris:{lat:48.85,lng:2.35},dubai:{lat:25.2,lng:55.27},rome:{lat:41.9,lng:12.49},berlin:{lat:52.52,lng:13.4},moscow:{lat:55.75,lng:37.61},beijing:{lat:39.9,lng:116.39},sydney:{lat:-33.87,lng:151.21},cairo:{lat:30.04,lng:31.23},mumbai:{lat:19.07,lng:72.87},"los angeles":{lat:34.05,lng:-118.24},"rio de janeiro":{lat:-22.91,lng:-43.17},singapore:{lat:1.35,lng:103.82},seoul:{lat:37.57,lng:126.97},toronto:{lat:43.65,lng:-79.38},"mexico city":{lat:19.43,lng:-99.13},"buenos aires":{lat:-34.6,lng:-58.38},amsterdam:{lat:52.37,lng:4.9},barcelona:{lat:41.39,lng:2.17},"san francisco":{lat:37.77,lng:-122.42},washington:{lat:38.9,lng:-77.03},chicago:{lat:41.88,lng:-87.63},miami:{lat:25.76,lng:-80.19},izmir:{lat:38.42,lng:27.13},antalya:{lat:36.88,lng:30.69},bursa:{lat:40.18,lng:29.06}}[d.toLowerCase()];if(B){y.current.flyTo(B.lat,B.lng,.05);return}try{const I=await(await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(d)}&format=json&limit=1`)).json();if(I&&I.length>0){const ne=parseFloat(I[0].lat),se=parseFloat(I[0].lon);y.current.flyTo(ne,se,1.2)}}catch{}},oe=e.jsx("div",{className:"map-navbar-search",children:e.jsxs("div",{className:"map-navbar-search-inner",children:[e.jsx("span",{onClick:u,className:"material-symbols-outlined map-search-icon",title:"Ara",children:"travel_explore"}),e.jsx("input",{value:w,onChange:a=>{T(a.target.value),N(!0),a.target.value===""&&M("")},onKeyDown:a=>{a.key==="Enter"&&(a.preventDefault(),u())},onFocus:()=>N(!0),onBlur:()=>setTimeout(()=>N(!1),200),className:"map-navbar-search-input",placeholder:"Portal veya konum ara...",type:"text"}),w.length>0&&e.jsx("span",{onClick:E,className:"material-symbols-outlined map-search-clear",title:"Temizle",children:"close"}),K&&w.length>0&&e.jsx("div",{className:"map-navbar-search-dropdown",children:R.filter(a=>a.name.toLowerCase().includes(w.toLowerCase())||(a.label||"").toLowerCase().includes(w.toLowerCase())).length>0?R.filter(a=>a.name.toLowerCase().includes(w.toLowerCase())||(a.label||"").toLowerCase().includes(w.toLowerCase())).map(a=>e.jsxs("div",{onMouseDown:()=>{T(""),N(!1),L(a)},className:"map-navbar-search-result",children:[e.jsx("span",{className:"material-symbols-outlined map-result-icon",children:"location_on"}),e.jsxs("div",{children:[e.jsx("span",{className:"map-result-name",children:a.name}),e.jsx("span",{className:"map-result-loc",children:a.label||""})]})]},a._id)):e.jsx("div",{className:"map-navbar-no-results",children:"Portal bulunamadı"})})]})});return e.jsxs("div",{className:"map-simulation-page",style:{height:"100vh",display:"flex",flexDirection:"column",background:"#0a0a0d",overflow:"hidden"},children:[e.jsx(we,{title:"Portal Haritası | Oxypace",description:"Tüm Oxypace portallarını interaktif 3D dünya üzerinde keşfedin."}),e.jsx(ye,{centerContent:oe,hideThemeToggle:!0,mapMode:!0}),e.jsx("div",{className:"map-back-button-container",children:e.jsx(ve,{variant:"frosted",showBack:!0})}),e.jsxs("main",{style:{flex:1,position:"relative",display:"flex",overflow:"hidden"},children:[e.jsx("div",{style:{position:"absolute",inset:0,zIndex:0},children:e.jsx(ke,{ref:y,portals:R,onPortalClick:L,activePortalSearch:U,onGlobeClick:()=>S(!1)})}),e.jsxs("div",{className:`map-left-panel ${o?"mobile-visible":"mobile-hidden"}`,children:[e.jsxs("div",{className:"map-controls-bar glass-panel borderless",children:[e.jsx("div",{className:"map-ctrl-separator desktop-only"}),e.jsx("button",{onClick:()=>C("search"),className:`map-ctrl-btn ${G==="search"?"active":""}`,title:"Koordinat / Şehir Ara",children:e.jsx("span",{className:"material-symbols-outlined",children:"my_location"})}),e.jsx("div",{className:"map-ctrl-separator"}),e.jsx("button",{onClick:n,className:"map-ctrl-btn",title:"Yakınlaştır",children:e.jsx("span",{className:"material-symbols-outlined",children:"add"})}),e.jsx("button",{onClick:g,className:"map-ctrl-btn",title:"Uzaklaştır",children:e.jsx("span",{className:"material-symbols-outlined",children:"remove"})}),e.jsx("div",{className:"map-ctrl-separator"}),e.jsx("button",{onClick:p,className:"map-ctrl-btn",title:"Görünümü Sıfırla",children:e.jsx("span",{className:"material-symbols-outlined",children:"explore"})})]}),G&&e.jsx("div",{className:"map-expanded-panel glass-panel",children:G==="search"&&e.jsxs("form",{onSubmit:re,style:{padding:"12px",width:"220px"},children:[e.jsx("p",{style:{fontSize:"10px",color:"rgba(148,163,184,0.8)",marginBottom:"8px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"},children:"Koordinat / Şehir Ara"}),e.jsxs("div",{style:{position:"relative"},children:[e.jsx("span",{className:"material-symbols-outlined",style:{position:"absolute",left:"8px",top:"50%",transform:"translateY(-50%)",fontSize:"16px",color:"rgba(148,163,184,0.7)"},children:"search"}),e.jsx("input",{autoFocus:!0,value:h,onChange:ae,style:{width:"100%",background:"rgba(255,255,255,0.06)",border:"none",borderRadius:"8px",padding:"8px 10px 8px 30px",fontSize:"13px",color:"white",outline:"none",boxSizing:"border-box"},placeholder:"London, 41.01,28.98...",type:"text"})]}),e.jsx("p",{style:{fontSize:"10px",color:"rgba(148,163,184,0.5)",marginTop:"6px"},children:"Enter'a bas veya 🔍'e tıkla"})]})}),e.jsx("button",{className:`map-mobile-controls-toggle glass-panel borderless ${o?"active":""}`,onClick:()=>k(!o),title:"Kontrolleri Göster/Gizle",children:e.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"20px"},children:o?"keyboard_double_arrow_left":"keyboard_double_arrow_right"})})]}),j&&_&&e.jsxs("aside",{className:"map-portal-card glass-panel",children:[e.jsx("button",{onClick:()=>S(!1),className:"map-portal-card-close",title:"Kapat",children:e.jsx("span",{className:"material-symbols-outlined",children:"close"})}),F?e.jsxs("div",{style:{padding:"14px",display:"flex",gap:"12px",alignItems:"center"},children:[e.jsx("div",{style:{width:"42px",height:"42px",borderRadius:"10px",background:"rgba(255,255,255,0.08)",flexShrink:0,animation:"pulse 1.5s infinite"}}),e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("div",{style:{height:"14px",background:"rgba(255,255,255,0.08)",borderRadius:"6px",width:"70%",animation:"pulse 1.5s infinite"}}),e.jsx("div",{style:{height:"11px",background:"rgba(255,255,255,0.05)",borderRadius:"6px",width:"45%",animation:"pulse 1.5s infinite"}})]})]}):m?e.jsxs("div",{className:"map-portal-card-minimal-body",children:[e.jsxs("div",{className:"map-portal-card-header-compact",children:[e.jsx("div",{className:"map-portal-avatar-wrap",children:m.avatar?e.jsx("img",{src:c(m.avatar),alt:m.name,className:"map-portal-avatar-compact",onError:a=>{a.target.onerror=null,a.target.src="/assets/default-avatar.png"}}):e.jsx("div",{className:"map-portal-avatar-compact map-portal-avatar-letter",children:m.name[0]})}),e.jsxs("div",{className:"map-portal-info-compact",children:[e.jsx("h3",{className:"map-portal-name-compact",children:m.name}),e.jsxs("div",{className:"map-portal-badges-row",children:[e.jsxs("span",{className:"map-portal-badge-pill members",children:[e.jsx("span",{className:"dot"}),((H=m.members)==null?void 0:H.length)??j.memberCount??0," üye"]}),e.jsx("span",{className:"map-portal-badge-pill privacy",children:m.privacy==="public"?"Açık":"Gizli"}),(j.label||m.name)&&e.jsxs("span",{className:"map-portal-badge-pill location",children:[e.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"10px"},children:"location_on"}),j.label||m.name]})]})]})]}),m.description&&e.jsx("p",{className:"map-portal-bio-compact",children:m.description}),e.jsxs("div",{className:"map-portal-actions-compact",children:[e.jsxs(ie,{to:`/portal/${m._id}`,className:"map-portal-btn-primary",children:[e.jsx("span",{children:"Portala Git"}),e.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"15px"},children:"arrow_forward"})]}),P===!0?e.jsxs("div",{className:"map-portal-member-badge",children:[e.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"14px"},children:"check_circle"}),e.jsx("span",{children:"Üyesiniz"})]}):P==="requested"?e.jsxs("div",{className:"map-portal-member-badge",style:{color:"#f59e0b",borderColor:"rgba(245,158,11,0.3)"},children:[e.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"14px"},children:"schedule"}),e.jsx("span",{children:"İstendi"})]}):e.jsxs("button",{className:"map-portal-btn-secondary",onClick:te,disabled:t,children:[e.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"14px"},children:"add"}),e.jsx("span",{children:t?"...":"Katıl"})]})]})]}):e.jsx("div",{style:{padding:"16px",textAlign:"center",color:"rgba(148,163,184,0.7)",fontSize:"12px"},children:"Portal bilgileri yüklenemedi."})]})]}),e.jsx("style",{children:`
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

                /* ── Minimal Portal Detail Card ── */
                .map-portal-card {
                    position: absolute;
                    top: 76px;
                    right: 20px;
                    width: 290px;
                    border-radius: 16px;
                    overflow: hidden;
                    z-index: 50;
                    border: 1px solid rgba(255,255,255,0.12);
                    background: rgba(14, 16, 22, 0.92) !important;
                    box-shadow: 0 16px 40px rgba(0,0,0,0.65);
                    display: flex;
                    flex-direction: column;
                    animation: cardSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes cardSlideIn {
                    from { opacity: 0; transform: translateY(-8px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .map-portal-card-minimal-body {
                    padding: 12px 14px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .map-portal-card-header-compact {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding-right: 24px;
                }
                .map-portal-avatar-compact {
                    width: 42px;
                    height: 42px;
                    border-radius: 10px;
                    object-fit: cover;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    flex-shrink: 0;
                }
                .map-portal-avatar-letter {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #6366f1, #818cf8);
                    font-size: 18px;
                    font-weight: 800;
                    color: white;
                }
                .map-portal-info-compact {
                    flex: 1;
                    min-width: 0;
                }
                .map-portal-name-compact {
                    font-size: 14px;
                    font-weight: 700;
                    color: #ffffff;
                    margin: 0 0 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    letter-spacing: -0.2px;
                }
                .map-portal-badges-row {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    flex-wrap: wrap;
                }
                .map-portal-badge-pill {
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 6px;
                    font-weight: 500;
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                }
                .map-portal-badge-pill.members {
                    background: rgba(34, 197, 94, 0.12);
                    color: #4ade80;
                    border: 1px solid rgba(34, 197, 94, 0.25);
                }
                .map-portal-badge-pill.members .dot {
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: #22c55e;
                }
                .map-portal-badge-pill.privacy {
                    background: rgba(255, 255, 255, 0.06);
                    color: rgba(203, 213, 225, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .map-portal-badge-pill.location {
                    background: rgba(99, 102, 241, 0.12);
                    color: #a5b4fc;
                    border: 1px solid rgba(99, 102, 241, 0.25);
                    max-width: 90px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .map-portal-bio-compact {
                    font-size: 11px;
                    color: rgba(203, 213, 225, 0.7);
                    line-height: 1.4;
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .map-portal-actions-compact {
                    display: flex;
                    gap: 8px;
                    margin-top: 2px;
                }
                .map-portal-btn-primary {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 7px 12px;
                    background: linear-gradient(135deg, #6366f1, #818cf8);
                    color: white;
                    font-size: 12px;
                    font-weight: 600;
                    border-radius: 8px;
                    text-decoration: none;
                    transition: opacity 0.2s, transform 0.2s;
                    box-shadow: 0 4px 14px rgba(99,102,241,0.35);
                }
                .map-portal-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
                .map-portal-btn-secondary {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    padding: 7px 12px;
                    background: rgba(255,255,255,0.07);
                    border: 1px solid rgba(255,255,255,0.12);
                    color: rgba(203,213,225,0.9);
                    font-size: 12px;
                    font-weight: 600;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .map-portal-btn-secondary:hover { background: rgba(255,255,255,0.12); }
                .map-portal-member-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 7px 10px;
                    background: rgba(46,204,113,0.08);
                    border: 1px solid rgba(46,204,113,0.25);
                    border-radius: 8px;
                    color: #2ecc71;
                    font-size: 11.5px;
                    font-weight: 600;
                }
                .map-portal-card-close {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: rgba(255,255,255,0.7);
                    transition: all 0.2s;
                    z-index: 10;
                }
                .map-portal-card-close:hover {
                    background: rgba(255,255,255,0.15);
                    color: #fff;
                }
                .map-portal-card-close .material-symbols-outlined { font-size: 15px; }

                /* Skeleton pulse */
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

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

                    .map-portal-card {
                        top: auto !important;
                        bottom: calc(16px + var(--safe-area-bottom, env(safe-area-inset-bottom, 0px))) !important;
                        left: 12px !important;
                        right: 12px !important;
                        width: calc(100% - 24px) !important;
                        max-width: 380px !important;
                        margin: 0 auto !important;
                        animation: cardSlideUpMobile 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    }
                    @keyframes cardSlideUpMobile {
                        from { opacity: 0; transform: translateY(14px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                }
            `})]})}export{Ie as default};
