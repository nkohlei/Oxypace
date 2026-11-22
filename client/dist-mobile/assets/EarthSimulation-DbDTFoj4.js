import{r as s,a4 as t,W as me,a2 as oe,ar as fe}from"./vendor-Dpge4IBk.js";import{G as ge}from"./globe-visualization-CLuDGC__.js";import{d as pe}from"./index-txK5jClD.js";import{e as he,E as le}from"./earthAtmosphere-BBGqHwGB.js";import{N as be}from"./Navbar-DroZHEJv.js";import{S as xe}from"./SubHeader-qkxxrDUW.js";import{S as ye}from"./SEO-giVNFBzi.js";import"./socket-ZbpkDx_N.js";import"./livekit-BEAUSX0o.js";import"./lucide-DCJHpWvB.js";import"./UserAvatar-C9CIjHr_.js";import"./Login-Dm-2evzp.js";/* empty css             *//* empty css                  */const ve=6371,N=.004,M=4.2,S={lat:24,lng:22,altitude:2.35},h=(m,U,z)=>Math.max(U,Math.min(z,m)),ie=m=>((m+180)%360+360)%360-180,ce=(m,U)=>{let z=m-U;for(;z>180;)z-=360;for(;z<-180;)z+=360;return z},we=m=>m<.5?16*m*m*m*m*m:1-Math.pow(-2*m+2,5)/2,ke=s.forwardRef(({portals:m=[],onPortalClick:U,activePortalSearch:z,onGlobeClick:K,onTelemetry:Q},V)=>{const b=s.useRef(),R=s.useRef(),P=s.useRef(null),x=s.useRef(Math.log(S.altitude)),j=s.useRef(null),C=s.useRef({x:0,y:0}),y=s.useRef(!1),Y=s.useRef(!1),F=s.useRef({x:0,y:0}),Z=s.useRef(!1),I=s.useRef(null),O=s.useRef({mode:"idle",startDist:0,startLogAlt:Math.log(S.altitude),lastTapTime:0,lastTapX:0,lastTapY:0,tapMoved:!1}),J=s.useRef(0),[re,ae]=s.useState({width:typeof window<"u"?window.innerWidth:1280,height:typeof window<"u"?window.innerHeight:720}),d=s.useCallback(()=>{I.current=null},[]),D=s.useCallback(()=>{var a,p;const e=(p=(a=b.current)==null?void 0:a.pointOfView)==null?void 0:p.call(a);e&&Number.isFinite(e.altitude)&&e.altitude>0&&(x.current=Math.log(h(e.altitude,N,M)))},[]),X=s.useCallback((e,a,p,l=1500)=>{var E;const r=b.current;if(!r)return;const i=(E=r.controls)==null?void 0:E.call(r);i&&(i.autoRotate=!1,i.target.set(0,0,0));const o=r.pointOfView(),f=h((o==null?void 0:o.altitude)||S.altitude,N,M),v=h(p,N,M),L=e-((o==null?void 0:o.lat)||0),c=ce(a,(o==null?void 0:o.lng)||0),w=Math.hypot(L,c),u=Math.max(f,v),k=w>8?h(w/90*1.45,0,2.1):0,$=Math.min(M,Math.max(u,u+k*.55));y.current=!1,j.current=null,x.current=Math.log(v),I.current={startTime:performance.now(),duration:l,startLat:(o==null?void 0:o.lat)||0,startLng:(o==null?void 0:o.lng)||0,dLat:L,dLng:c,startLogAlt:Math.log(f),destLogAlt:Math.log(v),apexLogAlt:Math.log($)}},[]),q=s.useCallback((e,a,p=.45)=>{var k;const l=b.current,r=R.current;if(!l||!r)return;d();const i=(k=l.controls)==null?void 0:k.call(l);i&&(i.autoRotate=!1);const o=r.getBoundingClientRect(),f=e-o.left,v=a-o.top,L=l.pointOfView(),c=h((L==null?void 0:L.altitude)||S.altitude,N,M),w=h(c*p,N,M),u=typeof l.toGlobeCoords=="function"?l.toGlobeCoords(f,v):null;u&&Number.isFinite(u.lat)&&Number.isFinite(u.lng)?X(u.lat,u.lng,w,620):(x.current=Math.log(w),j.current=null,y.current=!0)},[d,X]);s.useImperativeHandle(V,()=>({zoomIn:()=>{d(),b.current&&(b.current.controls().autoRotate=!1),y.current||D();const e=h(Math.exp(x.current)*.52,N,M);x.current=Math.log(e),j.current=null,y.current=!0},zoomOut:()=>{d(),b.current&&(b.current.controls().autoRotate=!1),y.current||D();const e=h(Math.exp(x.current)*1.9,N,M);x.current=Math.log(e),j.current=null,y.current=!0},resetView:()=>{X(S.lat,S.lng,S.altitude,1150),setTimeout(()=>{!I.current&&b.current&&(b.current.controls().autoRotate=!0)},1250)},flyTo:(e,a,p)=>{X(e,a,p||.02,1600)}}),[d,X,D]),s.useEffect(()=>{const e=()=>{if(R.current){const p=R.current.clientWidth,l=R.current.clientHeight;p>0&&l>0&&ae({width:p,height:l})}};e(),window.addEventListener("resize",e);let a=null;return typeof ResizeObserver<"u"&&R.current&&(a=new ResizeObserver(e),a.observe(R.current)),()=>{window.removeEventListener("resize",e),a&&a.disconnect()}},[]),s.useEffect(()=>{const e=a=>{var r,i,o;const p=(i=(r=a.target)==null?void 0:r.tagName)==null?void 0:i.toLowerCase();if(p==="input"||p==="textarea"||(o=a.target)!=null&&o.isContentEditable)return;const l=b.current;l&&(a.key==="+"||a.key==="="?(a.preventDefault(),d(),l.controls().autoRotate=!1,y.current||D(),x.current=Math.log(h(Math.exp(x.current)*.65,N,M)),j.current=null,y.current=!0):a.key==="-"||a.key==="_"?(a.preventDefault(),d(),l.controls().autoRotate=!1,y.current||D(),x.current=Math.log(h(Math.exp(x.current)*1.5,N,M)),j.current=null,y.current=!0):(a.key==="r"||a.key==="R")&&X(S.lat,S.lng,S.altitude,1e3))};return window.addEventListener("keydown",e),()=>window.removeEventListener("keydown",e)},[d,X,D]),s.useEffect(()=>{let e=null,a=performance.now();const p=l=>{var L;e=requestAnimationFrame(p);const r=Math.min((l-a)/1e3,.05);a=l;const i=b.current;if(!i)return;const o=(L=i.controls)==null?void 0:L.call(i);if(o&&(o.target.x!==0||o.target.y!==0||o.target.z!==0)&&o.target.set(0,0,0),I.current){const c=I.current,w=h((l-c.startTime)/c.duration,0,1),u=we(w),k=h(c.startLat+c.dLat*u,-89.5,89.5),$=ie(c.startLng+c.dLng*u),E=1-u,T=E*E*c.startLogAlt+2*E*u*c.apexLogAlt+u*u*c.destLogAlt;i.pointOfView({lat:k,lng:$,altitude:Math.exp(T)},0),w>=1&&(I.current=null,x.current=c.destLogAlt)}else if(y.current){const c=i.pointOfView(),w=h((c==null?void 0:c.altitude)||S.altitude,N,M),u=Math.log(w),k=x.current-u;if(Math.abs(k)<8e-4)y.current=!1,j.current=null;else{const $=1-Math.exp(-11.5*r),E=h(Math.exp(u+k*$),N,M);if(i.pointOfView({lat:c.lat,lng:c.lng,altitude:E},0),j.current&&!Y.current&&typeof i.toGlobeCoords=="function"){const T=i.toGlobeCoords(C.current.x,C.current.y);if(T&&Number.isFinite(T.lat)&&Number.isFinite(T.lng)){const n=k<0?.92:.42,g=h((j.current.lat-T.lat)*n,-10,10),A=h(ce(j.current.lng,T.lng)*n,-16,16),ee=h(c.lat+g,-85,85),te=ie(c.lng+A);i.pointOfView({lat:ee,lng:te,altitude:E},0)}}if(o){const T=o.enableDamping;o.enableDamping=!1,o.update(),o.enableDamping=T}}}else if(o){const c=i.pointOfView(),w=h((c==null?void 0:c.altitude)||S.altitude,N,M),u=h(Math.pow(w,.82)*.29,.018,.56);o.rotateSpeed=u,o.update()}const f=i.pointOfView(),v=h((f==null?void 0:f.altitude)||S.altitude,N,M);P.current&&P.current.update(r,v),Q&&l-J.current>125&&f&&(J.current=l,Q({lat:f.lat,lng:f.lng,altitudeKm:Math.max(1,Math.round(v*ve))}))};return e=requestAnimationFrame(p),()=>{if(e&&cancelAnimationFrame(e),d(),P.current&&(P.current.dispose(),P.current=null),b.current)try{b.current.scene().traverse(r=>{r.geometry&&r.geometry.dispose(),r.material&&(Array.isArray(r.material)?r.material.forEach(i=>i.dispose()):r.material.dispose())})}catch{}}},[d,Q]);const B=s.useCallback(e=>{var v;e.preventDefault();const a=b.current,p=R.current;if(!a||!p)return;d();const l=(v=a.controls)==null?void 0:v.call(a);l&&(l.autoRotate=!1),y.current||D();let r=e.deltaY;e.deltaMode===1?r*=32:e.deltaMode===2&&(r*=240);const i=e.ctrlKey?.0085:.00185,o=h(r*i,-.42,.42),f=h(x.current+o,Math.log(N),Math.log(M));if(x.current=f,typeof a.toGlobeCoords=="function"){const L=p.getBoundingClientRect(),c=e.clientX-L.left,w=e.clientY-L.top;if(Math.hypot(c-C.current.x,w-C.current.y)>3||!y.current||!j.current){const k=a.toGlobeCoords(c,w);k&&Number.isFinite(k.lat)&&Number.isFinite(k.lng)?(j.current=k,C.current={x:c,y:w}):j.current=null}}y.current=!0},[d,D]),G=s.useCallback(e=>{var i;const a=b.current,p=R.current;if(!a||!p)return;d();const l=(i=a.controls)==null?void 0:i.call(a);l&&(l.autoRotate=!1);const r=O.current;if(e.touches.length>=2){e.preventDefault(),r.mode="pinch",r.tapMoved=!0,Y.current=!1,l&&(l.enabled=!1);const o=e.touches[0],f=e.touches[1];r.startDist=Math.max(10,Math.hypot(o.clientX-f.clientX,o.clientY-f.clientY));const v=a.pointOfView(),L=h((v==null?void 0:v.altitude)||S.altitude,N,M);r.startLogAlt=Math.log(L),x.current=r.startLogAlt;const c=p.getBoundingClientRect(),w=(o.clientX+f.clientX)*.5-c.left,u=(o.clientY+f.clientY)*.5-c.top;if(C.current={x:w,y:u},typeof a.toGlobeCoords=="function"){const k=a.toGlobeCoords(w,u);j.current=k&&Number.isFinite(k.lat)?k:null}}else if(e.touches.length===1&&r.mode==="idle"){const o=e.touches[0];r.mode="drag",r.tapMoved=!1,Y.current=!0,y.current=!1,j.current=null,l&&(l.enabled=!0);const f=Date.now(),v=Math.hypot(o.clientX-r.lastTapX,o.clientY-r.lastTapY);if(f-r.lastTapTime<280&&v<36){r.lastTapTime=0,r.tapMoved=!0,q(o.clientX,o.clientY,.45);return}r.lastTapX=o.clientX,r.lastTapY=o.clientY,r.lastTapTime=f}},[d,q]),H=s.useCallback(e=>{const a=b.current,p=R.current;if(!a||!p)return;const l=O.current;if(l.mode==="pinch"&&e.touches.length>=2){e.preventDefault();const r=e.touches[0],i=e.touches[1],o=Math.max(10,Math.hypot(r.clientX-i.clientX,r.clientY-i.clientY)),f=Math.log(l.startDist/o)*1.05;x.current=h(l.startLogAlt+f,Math.log(N),Math.log(M));const v=p.getBoundingClientRect();C.current={x:(r.clientX+i.clientX)*.5-v.left,y:(r.clientY+i.clientY)*.5-v.top},y.current=!0}else if(l.mode==="drag"&&e.touches.length===1){const r=e.touches[0];Math.hypot(r.clientX-l.lastTapX,r.clientY-l.lastTapY)>10&&(l.tapMoved=!0)}},[]),_=s.useCallback(e=>{var r;const a=b.current,p=(r=a==null?void 0:a.controls)==null?void 0:r.call(a),l=O.current;if(l.mode==="pinch"&&e.touches.length===1){l.mode="pinch-cooldown",p&&(p.enabled=!1);return}e.touches.length===0&&(l.mode="idle",Y.current=!1,j.current=null,p&&(p.enabled=!0))},[]);s.useEffect(()=>{const e=R.current;if(e)return e.addEventListener("wheel",B,{passive:!1}),e.addEventListener("touchstart",G,{passive:!1}),e.addEventListener("touchmove",H,{passive:!1}),e.addEventListener("touchend",_,{passive:!0}),e.addEventListener("touchcancel",_,{passive:!0}),()=>{e.removeEventListener("wheel",B),e.removeEventListener("touchstart",G),e.removeEventListener("touchmove",H),e.removeEventListener("touchend",_),e.removeEventListener("touchcancel",_)}},[B,G,H,_]);const se=s.useCallback(()=>{const e=b.current;if(!e)return;const a=e.controls();a.enableDamping=!0,a.dampingFactor=.08,a.enablePan=!1,a.minPolarAngle=.08,a.maxPolarAngle=Math.PI-.08,a.autoRotate=!0,a.autoRotateSpeed=.2,a.rotateSpeed=.45,a.minDistance=100.3,a.enableZoom=!1,a.target.set(0,0,0),e.pointOfView(S,0),x.current=Math.log(S.altitude),P.current&&P.current.dispose(),P.current=he(e,{starCount:4e3,enableClouds:!0,enableStars:!0,cloudDriftSpeed:.0022})},[]);return t.jsxs("div",{ref:R,className:"w-full h-full earth-canvas-stage",onContextMenu:e=>e.preventDefault(),onPointerDown:e=>{d(),Y.current=!0,y.current=!1,j.current=null,F.current={x:e.clientX,y:e.clientY},Z.current=!1,b.current&&(b.current.controls().autoRotate=!1)},onPointerMove:e=>{Y.current&&Math.hypot(e.clientX-F.current.x,e.clientY-F.current.y)>6&&(Z.current=!0)},onPointerUp:()=>{Y.current=!1},onPointerCancel:()=>{Y.current=!1},onDoubleClick:e=>{e.target.closest(".portal-marker-container")||q(e.clientX,e.clientY,.45)},children:[t.jsx(ge,{ref:b,onGlobeReady:se,width:re.width,height:re.height,backgroundColor:"#000003",showAtmosphere:!1,onGlobeClick:(e,a)=>{Z.current||K&&K(e,a)},globeImageUrl:le.day,bumpImageUrl:le.bump,globeTileEngineUrl:le.satelliteTileUrl,tileLayer:{maxZoom:22,attribution:"Google Satellite-DPI"},htmlElementsData:m,htmlElement:e=>{const a=document.createElement("div");a.className="portal-marker-container";let p="portal-circle";if(z&&z.length>0){const r=z.toLowerCase();p=e.name.toLowerCase().includes(r)||(e.label||"").toLowerCase().includes(r)?"portal-circle portal-circle-match":"portal-circle portal-circle-dimmed"}let l="";if(e.avatar){let r=e.avatar;if(r.includes("%3A")||r.includes("%2F"))try{r=decodeURIComponent(r),(r.includes("%3A")||r.includes("%2F"))&&(r=decodeURIComponent(r))}catch{}l=pe(r)}return a.innerHTML=`
                        <div class="${p}" data-name="${e.name[0].toUpperCase()}">
                            ${l?`<img src="${l}" alt="${e.name}" onerror="this.onerror=null;this.src='/assets/default-avatar.png';" />`:`<span class="portal-letter">${e.name[0].toUpperCase()}</span>`}
                        </div>
                        <div class="portal-hover-label">${e.name}</div>
                    `,a.style.position="relative",a.style.cursor="pointer",a.onclick=r=>{r.stopPropagation(),U(e)},a.onpointerdown=r=>{r.stopPropagation()},a},htmlLat:e=>e.lat,htmlLng:e=>e.lng,htmlAltitude:0}),t.jsx("style",{children:`
                .earth-canvas-stage {
                    cursor: grab;
                    background: #000003;
                    touch-action: none;
                    overscroll-behavior: none;
                    user-select: none;
                    -webkit-user-select: none;
                    -webkit-touch-callout: none;
                }
                .earth-canvas-stage:active {
                    cursor: grabbing;
                }
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
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: rgba(10, 14, 22, 0.55);
                    backdrop-filter: blur(8px);
                    border: 1.5px solid rgba(255, 255, 255, 0.55);
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.65);
                    transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease, box-shadow 0.2s ease;
                }
                .portal-marker-container:hover .portal-circle {
                    transform: scale(1.18);
                    border-color: #ffffff;
                    box-shadow: 0 0 24px rgba(170, 212, 255, 0.5);
                }
                .portal-circle img {
                    width: 90%;
                    height: 90%;
                    object-fit: cover;
                    border-radius: 50%;
                }
                .portal-letter {
                    color: white;
                    font-size: 17px;
                    font-weight: 800;
                    font-family: 'Inter', sans-serif;
                    text-shadow: 0 1px 4px rgba(0,0,0,0.5);
                }
                @keyframes matchPulse {
                    0%, 100% { border-color: #ffffff; box-shadow: 0 0 18px rgba(180, 220, 255, 0.75); }
                    50% { border-color: #93c5fd; box-shadow: 0 0 28px rgba(147, 197, 253, 0.95); }
                }
                .portal-circle-match {
                    animation: matchPulse 2.4s ease-in-out infinite !important;
                    transform: scale(1.2) !important;
                }
                .portal-circle-dimmed {
                    opacity: 0.32;
                    filter: grayscale(80%);
                    border-color: rgba(255, 255, 255, 0.15);
                }
                .portal-hover-label {
                    position: absolute;
                    top: 50px;
                    background: rgba(8, 10, 14, 0.9);
                    backdrop-filter: blur(10px);
                    color: #f8fafc;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.18s ease, transform 0.18s ease;
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
                }
                .portal-marker-container:hover .portal-hover-label {
                    opacity: 1;
                    transform: translateY(4px);
                }
            `})]})});function Fe(){var T;const m=s.useRef(null),[U,z]=s.useState(!1),[K,Q]=s.useState(null),[V,b]=s.useState(!1),[R,P]=s.useState(""),[x,j]=s.useState(null),[C,y]=s.useState(""),[Y,F]=s.useState(!1),[Z,I]=s.useState(""),[O,J]=s.useState([]),[re,ae]=s.useState(!0),[d,D]=s.useState(null),[X,q]=s.useState(!1),[B,G]=s.useState(!1),[H,_]=s.useState(!1),[se,e]=s.useState(!1),[a,p]=s.useState({lat:24,lng:22,altitudeKm:14972}),l=n=>{if(!n)return"";let g=n;if(n.includes("%3A")||n.includes("%2F"))try{g=decodeURIComponent(n),(g.includes("%3A")||g.includes("%2F"))&&(g=decodeURIComponent(g))}catch{}return pe(g)};s.useEffect(()=>{e(me.isNativePlatform())},[]),s.useEffect(()=>{(async()=>{try{ae(!0);const g=await oe.get("/api/portals/map");J(g.data)}catch{J([])}finally{ae(!1)}})()},[]);const r=()=>{var n;return(n=m.current)==null?void 0:n.zoomIn()},i=()=>{var n;return(n=m.current)==null?void 0:n.zoomOut()},o=()=>{var n;return(n=m.current)==null?void 0:n.resetView()},f=()=>{var g;const n=C.trim();if(F(!1),I(n),n.length>0){const A=O.find(ee=>ee.name.toLowerCase().includes(n.toLowerCase())||(ee.label||"").toLowerCase().includes(n.toLowerCase()));A?(g=m.current)==null||g.flyTo(A.lat,A.lng,1.2):o()}else o()},v=()=>{y(""),I(""),F(!1)},L=n=>{Q(g=>g===n?null:n)},c=s.useCallback(async n=>{var g;z(!0),j(n),D(null),q(!0),(g=m.current)==null||g.flyTo(n.lat,n.lng,.05);try{const A=await oe.get(`/api/portals/${n._id}`);D(A.data),G(A.data.isMember||!1)}catch{}finally{q(!1)}},[]),w=async()=>{if(d){_(!0);try{const n=await oe.post(`/api/portals/${d._id}/join`);n.data.status==="joined"?G(!0):n.data.status==="requested"&&G("requested")}catch{}finally{_(!1)}}},u=s.useRef(""),k=n=>{P(n.target.value),u.current=n.target.value},$=async n=>{n.preventDefault();const g=u.current.trim();if(!g||!m.current)return;const A=g.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);if(A){const ne=parseFloat(A[1]),W=parseFloat(A[2]);m.current.flyTo(ne,W,1.2);return}const te={istanbul:{lat:41.01,lng:28.98},ankara:{lat:39.93,lng:32.86},london:{lat:51.5,lng:-.12},"new york":{lat:40.71,lng:-74.01},tokyo:{lat:35.68,lng:139.69},paris:{lat:48.85,lng:2.35},dubai:{lat:25.2,lng:55.27},rome:{lat:41.9,lng:12.49},berlin:{lat:52.52,lng:13.4},moscow:{lat:55.75,lng:37.61},beijing:{lat:39.9,lng:116.39},sydney:{lat:-33.87,lng:151.21},cairo:{lat:30.04,lng:31.23},mumbai:{lat:19.07,lng:72.87},"los angeles":{lat:34.05,lng:-118.24},"rio de janeiro":{lat:-22.91,lng:-43.17},singapore:{lat:1.35,lng:103.82},seoul:{lat:37.57,lng:126.97},toronto:{lat:43.65,lng:-79.38},"mexico city":{lat:19.43,lng:-99.13},"buenos aires":{lat:-34.6,lng:-58.38},amsterdam:{lat:52.37,lng:4.9},barcelona:{lat:41.39,lng:2.17},"san francisco":{lat:37.77,lng:-122.42},washington:{lat:38.9,lng:-77.03},chicago:{lat:41.88,lng:-87.63},miami:{lat:25.76,lng:-80.19},izmir:{lat:38.42,lng:27.13},antalya:{lat:36.88,lng:30.69},bursa:{lat:40.18,lng:29.06}}[g.toLowerCase()];if(te){m.current.flyTo(te.lat,te.lng,.05);return}try{const W=await(await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(g)}&format=json&limit=1`)).json();if(W&&W.length>0){const de=parseFloat(W[0].lat),ue=parseFloat(W[0].lon);m.current.flyTo(de,ue,1.2)}}catch{}},E=t.jsx("div",{className:"map-navbar-search",children:t.jsxs("div",{className:"map-navbar-search-inner",children:[t.jsx("span",{onClick:f,className:"material-symbols-outlined map-search-icon",title:"Ara",children:"travel_explore"}),t.jsx("input",{value:C,onChange:n=>{y(n.target.value),F(!0),n.target.value===""&&I("")},onKeyDown:n=>{n.key==="Enter"&&(n.preventDefault(),f())},onFocus:()=>F(!0),onBlur:()=>setTimeout(()=>F(!1),200),className:"map-navbar-search-input",placeholder:"Portal veya konum ara...",type:"text"}),C.length>0&&t.jsx("span",{onClick:v,className:"material-symbols-outlined map-search-clear",title:"Temizle",children:"close"}),Y&&C.length>0&&t.jsx("div",{className:"map-navbar-search-dropdown",children:O.filter(n=>n.name.toLowerCase().includes(C.toLowerCase())||(n.label||"").toLowerCase().includes(C.toLowerCase())).length>0?O.filter(n=>n.name.toLowerCase().includes(C.toLowerCase())||(n.label||"").toLowerCase().includes(C.toLowerCase())).map(n=>t.jsxs("div",{onMouseDown:()=>{y(""),F(!1),c(n)},className:"map-navbar-search-result",children:[t.jsx("span",{className:"material-symbols-outlined map-result-icon",children:"location_on"}),t.jsxs("div",{children:[t.jsx("span",{className:"map-result-name",children:n.name}),t.jsx("span",{className:"map-result-loc",children:n.label||""})]})]},n._id)):t.jsx("div",{className:"map-navbar-no-results",children:"Portal bulunamadı"})})]})});return t.jsxs("div",{className:"map-simulation-page",style:{height:"100vh",display:"flex",flexDirection:"column",background:"#0a0a0d",overflow:"hidden"},children:[t.jsx(ye,{title:"Portal Haritası | Oxypace",description:"Tüm Oxypace portallarını interaktif 3D dünya üzerinde keşfedin."}),t.jsx(be,{centerContent:E,hideThemeToggle:!0,mapMode:!0}),t.jsx("div",{className:"map-back-button-container",children:t.jsx(xe,{variant:"frosted",showBack:!0})}),t.jsxs("main",{style:{flex:1,position:"relative",display:"flex",overflow:"hidden"},children:[t.jsx("div",{style:{position:"absolute",inset:0,zIndex:0},children:t.jsx(ke,{ref:m,portals:O,onPortalClick:c,activePortalSearch:Z,onGlobeClick:()=>z(!1),onTelemetry:p})}),t.jsxs("div",{className:`map-left-panel ${V?"mobile-visible":"mobile-hidden"}`,children:[t.jsxs("div",{className:"map-controls-bar glass-panel borderless",children:[t.jsx("div",{className:"map-ctrl-separator desktop-only"}),t.jsx("button",{onClick:()=>L("search"),className:`map-ctrl-btn ${K==="search"?"active":""}`,title:"Koordinat / Şehir Ara",children:t.jsx("span",{className:"material-symbols-outlined",children:"my_location"})}),t.jsx("div",{className:"map-ctrl-separator"}),t.jsx("button",{onClick:r,className:"map-ctrl-btn",title:"Yakınlaştır",children:t.jsx("span",{className:"material-symbols-outlined",children:"add"})}),t.jsx("button",{onClick:i,className:"map-ctrl-btn",title:"Uzaklaştır",children:t.jsx("span",{className:"material-symbols-outlined",children:"remove"})}),t.jsx("div",{className:"map-ctrl-separator"}),t.jsx("button",{onClick:o,className:"map-ctrl-btn",title:"Görünümü Sıfırla",children:t.jsx("span",{className:"material-symbols-outlined",children:"explore"})})]}),K&&t.jsx("div",{className:"map-expanded-panel glass-panel",children:K==="search"&&t.jsxs("form",{onSubmit:$,style:{padding:"12px",width:"220px"},children:[t.jsx("p",{style:{fontSize:"10px",color:"rgba(148,163,184,0.8)",marginBottom:"8px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"},children:"Koordinat / Şehir Ara"}),t.jsxs("div",{style:{position:"relative"},children:[t.jsx("span",{className:"material-symbols-outlined",style:{position:"absolute",left:"8px",top:"50%",transform:"translateY(-50%)",fontSize:"16px",color:"rgba(148,163,184,0.7)"},children:"search"}),t.jsx("input",{autoFocus:!0,value:R,onChange:k,style:{width:"100%",background:"rgba(255,255,255,0.06)",border:"none",borderRadius:"8px",padding:"8px 10px 8px 30px",fontSize:"13px",color:"white",outline:"none",boxSizing:"border-box"},placeholder:"London, 41.01,28.98...",type:"text"})]}),t.jsx("p",{style:{fontSize:"10px",color:"rgba(148,163,184,0.5)",marginTop:"6px"},children:"Enter'a bas veya 🔍'e tıkla"})]})}),t.jsx("button",{className:`map-mobile-controls-toggle glass-panel borderless ${V?"active":""}`,onClick:()=>b(!V),title:"Kontrolleri Göster/Gizle",children:t.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"20px"},children:V?"keyboard_double_arrow_left":"keyboard_double_arrow_right"})})]}),x&&U&&t.jsxs("aside",{className:"map-portal-card glass-panel",children:[t.jsx("button",{onClick:()=>z(!1),className:"map-portal-card-close",title:"Kapat",children:t.jsx("span",{className:"material-symbols-outlined",children:"close"})}),X?t.jsxs("div",{style:{padding:"14px",display:"flex",gap:"12px",alignItems:"center"},children:[t.jsx("div",{style:{width:"42px",height:"42px",borderRadius:"10px",background:"rgba(255,255,255,0.08)",flexShrink:0,animation:"pulse 1.5s infinite"}}),t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",gap:"6px"},children:[t.jsx("div",{style:{height:"14px",background:"rgba(255,255,255,0.08)",borderRadius:"6px",width:"70%",animation:"pulse 1.5s infinite"}}),t.jsx("div",{style:{height:"11px",background:"rgba(255,255,255,0.05)",borderRadius:"6px",width:"45%",animation:"pulse 1.5s infinite"}})]})]}):d?t.jsxs("div",{className:"map-portal-card-minimal-body",children:[t.jsxs("div",{className:"map-portal-card-header-compact",children:[t.jsx("div",{className:"map-portal-avatar-wrap",children:d.avatar?t.jsx("img",{src:l(d.avatar),alt:d.name,className:"map-portal-avatar-compact",onError:n=>{n.target.onerror=null,n.target.src="/assets/default-avatar.png"}}):t.jsx("div",{className:"map-portal-avatar-compact map-portal-avatar-letter",children:d.name[0]})}),t.jsxs("div",{className:"map-portal-info-compact",children:[t.jsx("h3",{className:"map-portal-name-compact",children:d.name}),t.jsxs("div",{className:"map-portal-badges-row",children:[t.jsxs("span",{className:"map-portal-badge-pill members",children:[t.jsx("span",{className:"dot"}),((T=d.members)==null?void 0:T.length)??x.memberCount??0," üye"]}),t.jsx("span",{className:"map-portal-badge-pill privacy",children:d.privacy==="public"?"Açık":"Gizli"}),(x.label||d.name)&&t.jsxs("span",{className:"map-portal-badge-pill location",children:[t.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"10px"},children:"location_on"}),x.label||d.name]})]})]})]}),d.description&&t.jsx("p",{className:"map-portal-bio-compact",children:d.description}),t.jsxs("div",{className:"map-portal-actions-compact",children:[t.jsxs(fe,{to:`/portal/${d._id}`,className:"map-portal-btn-primary",children:[t.jsx("span",{children:"Portala Git"}),t.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"15px"},children:"arrow_forward"})]}),B===!0?t.jsxs("div",{className:"map-portal-member-badge",children:[t.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"14px"},children:"check_circle"}),t.jsx("span",{children:"Üyesiniz"})]}):B==="requested"?t.jsxs("div",{className:"map-portal-member-badge",style:{color:"#f59e0b",borderColor:"rgba(245,158,11,0.3)"},children:[t.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"14px"},children:"schedule"}),t.jsx("span",{children:"İstendi"})]}):t.jsxs("button",{className:"map-portal-btn-secondary",onClick:w,disabled:H,children:[t.jsx("span",{className:"material-symbols-outlined",style:{fontSize:"14px"},children:"add"}),t.jsx("span",{children:H?"...":"Katıl"})]})]})]}):t.jsx("div",{style:{padding:"16px",textAlign:"center",color:"rgba(148,163,184,0.7)",fontSize:"12px"},children:"Portal bilgileri yüklenemedi."})]}),t.jsxs("div",{className:"map-telemetry-hud","aria-hidden":"true",children:[t.jsxs("span",{children:["Kamera: ",a.altitudeKm.toLocaleString("tr-TR")," km"]}),t.jsx("span",{className:"map-telemetry-sep",children:"·"}),t.jsxs("span",{children:[Math.abs(a.lat).toFixed(2),"°",a.lat>=0?"K":"G"," ",Math.abs(a.lng).toFixed(2),"°",a.lng>=0?"D":"B"]})]})]}),t.jsx("style",{children:`
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

                .map-telemetry-hud {
                    position: absolute;
                    right: 16px;
                    bottom: 14px;
                    z-index: 15;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 5px 11px;
                    border-radius: 999px;
                    background: rgba(4, 6, 12, 0.62);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.09);
                    color: rgba(226, 232, 240, 0.78);
                    font-size: 11px;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    letter-spacing: 0.02em;
                    pointer-events: none;
                    user-select: none;
                }
                .map-telemetry-sep {
                    opacity: 0.4;
                }
                @media (max-width: 768px) {
                    .map-telemetry-hud {
                        right: 10px;
                        bottom: calc(10px + var(--safe-area-bottom, env(safe-area-inset-bottom, 0px)));
                        font-size: 10px;
                        padding: 4px 9px;
                    }
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
            `})]})}export{Fe as default};
