const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PortalSettingsModal-CV76vx5N.js","assets/vendor-B3xEjD7t.js","assets/index-i_Wh1zxt.js","assets/socket-ZblPs630.js","assets/livekit-C_vxKPn8.js","assets/lucide-DAo17mVr.js","assets/index-BJzwLr0R.css","assets/ImageCropper-CbAT5Xgh.js","assets/ImageCropper-D3thH9n0.css","assets/PortalSettingsModal-Dd_9NXFk.css","assets/PortalNotifications-Cl8STU5f.js","assets/PortalNotifications-zEgqx9Vo.css","assets/VoiceChannel-DHPmjfp_.js","assets/VoiceChannel-QWCOBfU-.js","assets/VoiceChannel-DogQS1Pc.css","assets/ConferenceChannel-B72n2V_u.js"])))=>i.map(i=>d[i]);
import{r as a,a1 as e,Z as me,a2 as qt,ar as Et,at as ms,a7 as us,as as hs,a8 as xs,ad as He}from"./vendor-B3xEjD7t.js";import{d as ee,i as Ut,u as dt,j as Wt,f as Oe,c as pt,b as Bt,k as fs,a as $t}from"./index-i_Wh1zxt.js";import{u as gs}from"./useVideoTranscoder-DO4VvwPR.js";import{P as vs}from"./PostCard-Z_Zsbm2s.js";import{c as ys,X as ke,Y as bs,q as js,N as ws,Z as ks,_ as Ns,d as Ss,$ as Cs,W as _s,a0 as Ps,u as Is,a1 as zs,U as Ts,a2 as Ms,a3 as Rs}from"./lucide-DAo17mVr.js";import{B as Ft}from"./Badge-0zCK24tM.js";import{U as Ds}from"./UserBar-hL_EYDDV.js";import{N as Be}from"./Navbar-Ck2UayLB.js";import{S as Ls}from"./SubHeader-CjyL3OGz.js";import{S as As}from"./SEO-D2-z0JXN.js";import"./socket-ZblPs630.js";import"./livekit-C_vxKPn8.js";import"./VideoDownloadModal-CJmtqEmd.js";import"./UserBadges-CsgK8z3i.js";import"./LinkPreview-CSirjvOb.js";import"./UserAvatar-C2MZzT8f.js";/* empty css                      *//* empty css                  */const Es=({portalId:s,onClose:_})=>{const[R,w]=a.useState(""),[W,g]=a.useState([]),[Y,S]=a.useState(!1),[l,F]=a.useState(new Set);a.useEffect(()=>{const k=setTimeout(async()=>{if(R.trim().length===0){g([]);return}S(!0);try{const j=await me.get(`/api/users/search?q=${R}`);g(j.data)}catch{}finally{S(!1)}},500);return()=>clearTimeout(k)},[R]);const D=async N=>{var k,j;try{await Promise.all([me.post(`/api/portals/${s}/invite`,{userId:N}),me.post("/api/messages",{recipientId:N,portalId:s,content:"Seni bir portala davet ettim!"})]),F(r=>new Set(r).add(N))}catch(r){alert(((j=(k=r.response)==null?void 0:k.data)==null?void 0:j.message)||"İşlem sırasında bir hata oluştu.")}},C=()=>{const N=`${window.location.origin}/portal/${s}`;navigator.clipboard.writeText(N),alert("Davet bağlantısı kopyalandı!")};return e.jsx("div",{className:"invite-modal-overlay",onClick:_,children:e.jsxs("div",{className:"invite-modal",onClick:N=>N.stopPropagation(),children:[e.jsxs("div",{className:"invite-header",children:[e.jsx("h2",{children:"Kullanıcı Davet Et"}),e.jsxs("div",{className:"header-actions",children:[e.jsxs("button",{className:"copy-link-btn",title:"Bağlantıyı Kopyala",onClick:C,children:[e.jsx(ys,{size:20,strokeWidth:2}),e.jsx("span",{children:"Bağlantı"})]}),e.jsx("button",{className:"close-btn",onClick:_,children:e.jsx(ke,{size:24,strokeWidth:2})})]})]}),e.jsx("div",{className:"invite-search-container",children:e.jsx("input",{type:"text",className:"invite-search-input",placeholder:"Kullanıcı adı ara...",value:R,onChange:N=>w(N.target.value),autoFocus:!0})}),e.jsxs("div",{className:"invite-results custom-scrollbar",children:[Y&&e.jsx("div",{className:"loading-text",children:"Aranıyor..."}),!Y&&W.length===0&&R&&e.jsx("div",{className:"no-play-text",children:"Sonuç bulunamadı."}),W.map(N=>{var r;const k=N._id||N,j=l.has(k);return e.jsxs("div",{className:"invite-user-row",children:[e.jsxs("div",{className:"user-info",children:[e.jsx("img",{src:ee((r=N.profile)==null?void 0:r.avatar),alt:"",className:"user-avatar"}),e.jsx("span",{className:"user-name",children:N.username})]}),e.jsx("button",{className:`invite-btn ${j?"invited":""}`,onClick:()=>!j&&D(k),disabled:j,children:j?"Gönderildi":"Davet Et"})]},k)})]})]})})},Bs=({startedAt:s,style:_={},className:R=""})=>{const{roomStartTime:w}=Ut()||{},[W,g]=a.useState("00:00");a.useEffect(()=>{const S=w&&s===w?w:s;if(!S){g("00:00");return}const l=()=>{const D=Math.floor((Date.now()-S)/1e3);if(D<0){g("00:00");return}const C=Math.floor(D/3600),N=Math.floor(D%3600/60),k=D%60;g(C>0?`${C.toString().padStart(2,"0")}:${N.toString().padStart(2,"0")}:${k.toString().padStart(2,"0")}`:`${N.toString().padStart(2,"0")}:${k.toString().padStart(2,"0")}`)};l();const F=setInterval(l,1e3);return()=>clearInterval(F)},[s,w]);const Y={display:"flex",alignItems:"center",fontSize:"15px",fontWeight:"800",color:"#39FF14",background:"transparent",border:"none",padding:"0 4px"};return e.jsx("div",{style:{...Y,..._},className:R,children:W})},$s=({portal:s,onClose:_,isMobile:R})=>{var i,P;const[w,W]=a.useState(0),[g,Y]=a.useState(!1),S=a.useRef(0),l=a.useRef(0);if(!s)return null;const F=v=>{S.current=v.touches[0].clientY,l.current=v.touches[0].clientY,Y(!0)},D=v=>{if(!g)return;const x=v.touches[0].clientY;l.current=x;const V=x-S.current;V>0?W(V):W(0)},C=()=>{if(!g)return;Y(!1),l.current-S.current>100&&_(),W(0)},N=new Date(s.createdAt).toLocaleDateString("tr-TR",{year:"numeric",month:"long",day:"numeric"}),k=s.privacy==="private"||s.isPrivate===!0,j=s.privacy==="restricted",f=k?{label:"Gizli",icon:e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"3",y:"11",width:"18",height:"11",rx:"3",ry:"3"}),e.jsx("path",{d:"M7 11V7a5 5 0 0 1 10 0v4"}),e.jsx("circle",{cx:"12",cy:"16.5",r:"1.5",fill:"currentColor",stroke:"none"})]})}:j?{label:"Kısıtlı",icon:e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"}),e.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),e.jsx("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]})}:{label:"Kamu",icon:e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("path",{d:"M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20"}),e.jsx("path",{d:"M2 12h20"})]})},L=e.jsxs("div",{className:"portal-info-container",children:[e.jsxs("div",{className:"portal-info-banner",children:[e.jsx("img",{src:s.coverImage?ee(s.coverImage):s.banner?ee(s.banner):"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",alt:s.name}),e.jsx("div",{className:"portal-info-avatar-wrapper",children:e.jsx("img",{src:ee(s.avatar),alt:s.name,className:"portal-info-avatar-img"})}),e.jsx("button",{className:"portal-info-close",onClick:_,"aria-label":"Kapat",children:e.jsx(ke,{size:20})})]}),e.jsxs("div",{className:"portal-info-content",children:[e.jsxs("div",{className:"portal-info-header",children:[e.jsxs("h1",{children:[s.name,e.jsx(Ft,{type:s.isVerified?"verified":(i=s.badges)==null?void 0:i[0],size:20})]}),e.jsx("p",{className:"portal-info-tagline",children:s.description||"Bu portal için bir açıklama bulunmuyor."})]}),e.jsxs("div",{className:"portal-info-stats-grid",children:[e.jsxs("div",{className:"portal-info-stat-card",children:[e.jsx("div",{className:"portal-stat-icon-box",children:e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}),e.jsx("circle",{cx:"9",cy:"7",r:"4"}),e.jsx("path",{d:"M22 21v-2a4 4 0 0 0-3-3.87"}),e.jsx("path",{d:"M16 3.13a4 4 0 0 1 0 7.75"})]})}),e.jsxs("div",{className:"stat-data",children:[e.jsx("span",{className:"stat-value",children:s.membersCount||((P=s.members)==null?void 0:P.length)||0}),e.jsx("span",{className:"stat-label",children:"Üye"})]})]}),e.jsxs("div",{className:"portal-info-stat-card",children:[e.jsx("div",{className:"portal-stat-icon-box",children:f.icon}),e.jsxs("div",{className:"stat-data",children:[e.jsx("span",{className:"stat-value",children:f.label}),e.jsx("span",{className:"stat-label",children:"Görünürlük"})]})]})]}),e.jsxs("div",{className:"portal-info-details",children:[e.jsxs("div",{className:"detail-item",children:[e.jsx("div",{className:"detail-icon-pill",children:e.jsxs("svg",{width:"13",height:"13",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),e.jsx("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),e.jsx("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]})}),e.jsxs("span",{children:["Oluşturulma: ",e.jsx("strong",{children:N})]})]}),e.jsxs("div",{className:"detail-item",children:[e.jsx("div",{className:"detail-icon-pill",children:e.jsxs("svg",{width:"13",height:"13",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"}),e.jsx("polyline",{points:"9 12 11 14 15 10"})]})}),e.jsxs("span",{children:["Durum: ",e.jsx("strong",{children:s.isVerified||s.badges&&s.badges.length>0?"Doğrulanmış Portal":"Standart Portal"})]})]}),e.jsxs("div",{className:"detail-item",children:[e.jsx("div",{className:"detail-icon-pill",children:e.jsxs("svg",{width:"13",height:"13",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"3",y:"3",width:"7",height:"7",rx:"1.5"}),e.jsx("rect",{x:"14",y:"3",width:"7",height:"7",rx:"1.5"}),e.jsx("rect",{x:"14",y:"14",width:"7",height:"7",rx:"1.5"}),e.jsx("rect",{x:"3",y:"14",width:"7",height:"7",rx:"1.5"})]})}),e.jsxs("span",{children:["Kategori: ",e.jsx("strong",{children:s.category||"Genel"})]})]})]})]})]});return R?e.jsx("div",{className:"bottom-sheet-overlay",onClick:_,children:e.jsxs("div",{className:"bottom-sheet-content",onClick:v=>v.stopPropagation(),style:{transform:w>0?`translateY(${w}px)`:void 0,transition:g?"none":"transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"},children:[e.jsx("div",{className:"bottom-sheet-handle-wrapper",onTouchStart:F,onTouchMove:D,onTouchEnd:C,children:e.jsx("div",{className:"bottom-sheet-handle"})}),L]})}):e.jsx("div",{className:"portal-info-modal-overlay",onClick:_,children:e.jsx("div",{className:"portal-info-modal-card",onClick:v=>v.stopPropagation(),children:L})})},qs=({portal:s,isMember:_,onEdit:R,currentChannel:w,onChangeChannel:W,className:g,canManage:Y,onShowPortalInfo:S})=>{var ye,Se,T;const{user:l}=dt(),[F,D]=a.useState(!1);qt();const C=Wt(),{isMobileView:N}=C||{},k=(C==null?void 0:C.isDesktopSidebarCollapsed)||!1,j=(C==null?void 0:C.setIsDesktopSidebarCollapsed)||(()=>{}),r=Oe(p=>p.unreadPostsByChannel),f=Oe(p=>p.clearUnreadForChannel),{roomStartTime:L,activeRoom:i}=Ut(),{onlineUsers:P}=pt(),v=p=>{if(!p)return null;if(typeof p=="string")return p;const E=p._id||p.id;return E?String(E):null},x=new Set,V=v(s==null?void 0:s.owner);V&&x.add(V),((s==null?void 0:s.admins)||[]).forEach(p=>{const E=v(p);E&&x.add(E)}),((s==null?void 0:s.members)||[]).forEach(p=>{const E=v(p);E&&x.add(E)});const Z=new Set((P||[]).map(p=>String(p))),K=l!=null&&l._id?String(l._id):null,ie=((Se=(ye=l==null?void 0:l.settings)==null?void 0:ye.privacy)==null?void 0:Se.showOnlineStatus)!==!1;K&&x.has(K)&&ie?Z.add(K):K&&!ie&&Z.delete(K);let ve=0;x.forEach(p=>{Z.has(p)&&ve++});const re=x.size||(s==null?void 0:s.membersCount)||((s==null?void 0:s.members)||[]).length||0;if(a.useEffect(()=>{w&&(s!=null&&s._id)&&f(w,s._id)},[w,s==null?void 0:s._id,f]),!s)return null;const O=s!=null&&s.channels?[...s.channels].sort((p,E)=>(p.order||0)-(E.order||0)).map(p=>({id:p._id,name:p.name,type:p.type||"text"})):[],ue=O.find(p=>p.id===w),de=(ue==null?void 0:ue.type)==="voice"||(ue==null?void 0:ue.type)==="conference";a.useEffect(()=>{!de&&k&&j(!1)},[de,k,j]);const Ne=p=>w===p;return e.jsxs("div",{className:`channel-sidebar ${k?"collapsed":""} ${g||""}`,style:{height:"calc(100% - 24px)",backgroundColor:"transparent",display:"flex",flexDirection:"column",flexShrink:0,overflow:"visible",position:"relative",borderRight:"none"},children:[!N&&de&&e.jsx("button",{className:"sidebar-toggle-btn",onClick:p=>{p.stopPropagation(),j(!k)},title:k?"Menüyü Göster":"Menüyü Gizle",children:k?e.jsx(bs,{size:16}):e.jsx(js,{size:16})}),e.jsxs("div",{className:"sidebar-content-wrapper",style:{display:"flex",flexDirection:"column",flex:1,width:"100%",height:"100%",overflow:"hidden",transition:"opacity 0.2s ease, visibility 0.2s ease",opacity:k?0:1,visibility:k?"hidden":"visible",gap:"8px",padding:"0px",boxSizing:"border-box"},children:[e.jsxs("div",{className:"cs-panel cs-panel--banner",children:[e.jsxs("div",{className:"channel-banner-container",onClick:()=>S&&S(),children:[e.jsx("div",{className:"channel-banner-image",style:{backgroundImage:s.coverImage?`url(${ee(s.coverImage)})`:s.banner?`url(${ee(s.banner)})`:'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")'}}),e.jsx("div",{className:"channel-banner-overlay"})]}),e.jsxs("div",{className:"portal-quick-info",children:[e.jsxs("div",{className:"portal-info-main",onClick:()=>S&&S(),children:[e.jsxs("h2",{className:"portal-title-text",children:[s.name,e.jsx(Ft,{type:s.isVerified?"verified":(T=s.badges)==null?void 0:T[0],size:16})]}),e.jsxs("div",{className:"portal-stats-row",children:[e.jsxs("div",{className:"stat-item",children:[e.jsx(ws,{size:12}),e.jsxs("span",{children:[re," Üye"]})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:"stat-item",children:[e.jsx("div",{className:"online-indicator-dot"}),e.jsxs("span",{children:[ve," Çevrimiçi"]})]})]})]}),e.jsxs("div",{className:"portal-header-actions",children:[(_||Y)&&e.jsx("button",{className:"portal-action-btn-circle",onClick:p=>{p.stopPropagation(),R&&R("notifications")},title:"Bildirim Ayarları",children:e.jsx(ks,{size:16})}),_&&e.jsx("button",{className:"portal-action-btn-circle",onClick:p=>{p.stopPropagation(),D(!0)},title:"Davet Et",children:e.jsx(Ns,{size:18})})]})]})]}),e.jsxs("div",{className:"cs-panel cs-panel--channels custom-scrollbar",children:[e.jsxs("div",{className:"cs-channels-header",children:[e.jsx("span",{children:"Kanallar"}),Y&&e.jsx("div",{onClick:p=>{p.stopPropagation(),R&&R("channels")},className:"cs-add-channel-btn",title:"Kanal Oluştur",children:"+"})]}),e.jsx("div",{className:"cs-channel-list",children:O.map(p=>{var be;const E=Ne(p.id),Qe=p.type==="announcement"||p.name.includes("announcements"),te=p.type==="voice";return e.jsxs("div",{className:`channel-item ${E?"active":""}`,onClick:()=>W(p.id),style:{padding:"6px 8px",margin:"2px 0",borderRadius:"4px",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",color:E?"white":"#949ba4",backgroundColor:E?"#3f4147":"transparent",transition:"all 0.1s"},children:[e.jsx("div",{style:{color:E?"white":"var(--text-secondary)",display:"flex",alignItems:"center",minWidth:"20px",justifyContent:"center"},children:te?e.jsx(Ss,{size:20,strokeWidth:2}):Qe?e.jsx(Cs,{size:20,strokeWidth:2.5}):p.type==="image"?e.jsx(_s,{size:20,strokeWidth:2.5,style:{color:"#f59e0b"}}):e.jsx(Ps,{size:20,strokeWidth:2.5})}),e.jsx("span",{style:{fontWeight:E?600:500,fontSize:"16px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:E?"white":"var(--text-primary)",maxWidth:"fit-content"},children:p.name}),!E&&((be=r[p.id])==null?void 0:be.length)>0&&e.jsx("div",{style:{backgroundColor:"#f23f43",color:"white",fontSize:"11px",fontWeight:"bold",padding:"0 6px",borderRadius:"8px",minWidth:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.3)",marginLeft:"-4px",flexShrink:0},children:r[p.id].length>9?"9+":r[p.id].length}),e.jsx("div",{style:{flex:1}}),E&&te&&i&&String(i.channelId)===String(p.id)&&L&&e.jsx("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:e.jsx(Bs,{startedAt:L,className:"vc-sidebar-timer"})})]},p.id)})})]}),e.jsxs("div",{className:"cs-panel cs-panel--userbar",children:[e.jsx(Ds,{currentChannelId:w}),e.jsx("div",{className:"cs-footer-copyright",children:"© 2026 Oxypace. Tüm hakları saklıdır."})]})]}),e.jsx("style",{children:`
            /* ── Channel Sidebar Shell ── */
            .channel-sidebar {
                width: 350px;
                transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                flex-shrink: 0;
                max-width: 100vw;
                /* Transparent shell — panels carry their own glass */
                background: transparent !important;
                border: none !important;
                border-radius: 0 !important;
                margin: 12px 12px 12px 0 !important;
                height: calc(100% - 24px) !important;
                overflow: visible !important;
                box-shadow: none !important;
                position: relative;
            }

            .channel-sidebar.collapsed {
                width: 0px !important;
                min-width: 0px !important;
                margin-right: 0px !important;
            }

            /* ── Three-Panel Layout ── */
            .sidebar-content-wrapper {
                scrollbar-width: none;
            }

            /* Shared panel base */
            .cs-panel {
                width: 100%;
                background: var(--glass-bg);
                backdrop-filter: blur(20px) saturate(160%);
                -webkit-backdrop-filter: blur(20px) saturate(160%);
                border: 1px solid var(--glass-border);
                border-radius: 14px;
                overflow: hidden;
                flex-shrink: 0;
                box-shadow: var(--glass-shadow);
            }

            /* Panel 1 – Banner + portal info (fixed height) */
            .cs-panel--banner {
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
            }

            /* Panel 2 – Channels (takes remaining space, scrollable) */
            .cs-panel--channels {
                flex: 1 1 0;
                min-height: 0;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                padding: 0 8px 8px 8px;
            }

            /* Panel 3 – UserBar + footer (fixed height) */
            .cs-panel--userbar {
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
            }

            /* Channels header inside panel 2 */
            .cs-channels-header {
                padding: 12px 8px 4px 8px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                color: var(--text-tertiary);
                text-transform: uppercase;
                font-size: 12px;
                font-weight: 700;
                font-family: var(--font-primary);
                letter-spacing: 0.04em;
                flex-shrink: 0;
            }

            .cs-add-channel-btn {
                cursor: pointer;
                padding: 0 4px;
                font-size: 18px;
                font-weight: bold;
                color: var(--text-tertiary);
                transition: color 0.15s;
            }
            .cs-add-channel-btn:hover { color: var(--text-primary); }

            .cs-channel-list {
                display: flex;
                flex-direction: column;
                flex: 1;
            }

            /* Footer copyright inside panel 3 */
            .cs-footer-copyright {
                padding: 4px 0 8px 0;
                font-size: 11px;
                color: var(--text-tertiary);
                text-align: center;
                opacity: 0.6;
                user-select: none;
                border-top: 1px solid var(--border-subtle);
            }

            /* ── Toggle button (Glass vertical pill attached to top panel) ── */
            .sidebar-toggle-btn {
                position: absolute;
                right: -24px;
                top: 8px;
                width: 24px;
                height: 140px;
                background: rgba(18, 18, 24, 0.75) !important;
                backdrop-filter: blur(16px) saturate(180%);
                -webkit-backdrop-filter: blur(16px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.14) !important;
                border-left: 1px solid rgba(255, 255, 255, 0.06) !important;
                border-radius: 0 10px 10px 0 !important;
                color: #94a3b8;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 1000;
                box-shadow: 4px 0 16px rgba(0, 0, 0, 0.35);
                transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, opacity 0.3s ease, visibility 0.3s ease;
                transform: none !important;
                padding: 0;
            }
            [data-theme='light'] .sidebar-toggle-btn {
                background: rgba(255, 255, 255, 0.85) !important;
                border: 1px solid rgba(0, 0, 0, 0.12) !important;
                border-left: 1px solid rgba(0, 0, 0, 0.05) !important;
                color: #334155;
                box-shadow: 4px 0 16px rgba(0, 0, 0, 0.08);
            }
            .sidebar-toggle-btn:hover {
                color: #ffffff;
                background: rgba(35, 38, 50, 0.9) !important;
                border-color: rgba(255, 255, 255, 0.25) !important;
            }
            [data-theme='light'] .sidebar-toggle-btn:hover {
                color: #0f172a;
                background: rgba(241, 245, 249, 0.95) !important;
                border-color: rgba(0, 0, 0, 0.2) !important;
            }
            .sidebar-toggle-btn svg {
                transition: transform 0.2s ease;
            }
            .sidebar-toggle-btn:hover svg {
                transform: scale(1.2);
            }

            /* ── Banner ── */
            .channel-banner-container {
                height: 160px;
                position: relative;
                cursor: pointer;
                overflow: hidden;
                flex-shrink: 0;
                transition: height 0.3s ease;
            }
            .channel-banner-image {
                width: 100%;
                height: 100%;
                background-size: cover;
                background-position: center;
                transition: transform 0.5s ease;
            }
            .channel-banner-container:hover .channel-banner-image {
                transform: scale(1.05);
            }
            .channel-banner-overlay {
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%);
            }

            /* ── Portal quick info ── */
            .portal-quick-info {
                padding: 14px 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: transparent;
            }
            .portal-info-main {
                flex: 1;
                cursor: pointer;
                min-width: 0;
            }
            .portal-title-text {
                font-size: 18px;
                font-weight: 800;
                color: var(--text-primary);
                margin: 0 0 4px 0;
                display: flex;
                align-items: center;
                gap: 6px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .portal-stats-row {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .stat-item {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                color: var(--text-secondary);
                font-weight: 500;
            }
            .online-indicator-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #23a559;
            }
            .stat-dot {
                width: 3px;
                height: 3px;
                border-radius: 50%;
                background: var(--text-tertiary);
                opacity: 0.5;
            }
            .portal-header-actions {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-left: 12px;
            }
            .portal-action-btn-circle {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--bg-tertiary);
                color: var(--text-secondary);
                border: 1px solid var(--border-subtle);
                cursor: pointer;
                transition: all 0.2s;
                flex-shrink: 0;
            }
            .portal-action-btn-circle:hover {
                background: var(--primary-color);
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
            }

            /* ── Channel items ── */
            .channel-item:hover {
                background-color: var(--bg-hover) !important;
                color: var(--text-primary) !important;
            }
            .channel-item.active {
                background-color: var(--bg-hover) !important;
                color: var(--text-primary) !important;
            }
            .channel-item.active svg {
                color: var(--primary-color);
            }

            /* ── Scrollbar ── */
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: var(--border-subtle);
                border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track { background-color: transparent; }

            /* ── Responsive ── */
            @media (max-width: 768px) {
                .channel-banner-container { height: 120px; }
                .portal-title-text { font-size: 16px; }
            }
            `}),F&&e.jsx(Es,{portalId:s._id,onClose:()=>D(!1)})]})},Us=({members:s=[],onClose:_})=>{var k,j;const{onlineUsers:R}=pt(),{user:w}=dt(),[,W]=a.useState(0);a.useEffect(()=>{const r=setInterval(()=>{W(f=>f+1)},6e4);return()=>clearInterval(r)},[]);const g=r=>{if(!r)return"";const f=new Date,L=new Date(r),i=Math.max(0,f-L),P=Math.floor(i/6e4);if(P<1)return"şimdi";if(P<60)return`${P}dk`;const v=Math.floor(P/60);if(v<24)return`${v}sa`;const x=Math.floor(v/24);if(x<30)return`${x}g`;const V=Math.floor(x/30);return V<12?`${V}ay`:`${Math.floor(V/12)}y`},Y=r=>{if(!r)return null;if(typeof r=="string")return r;const f=r._id||r.id;return f?String(f):null},S=new Set((R||[]).map(r=>String(r))),l=w!=null&&w._id?String(w._id):null,F=((j=(k=w==null?void 0:w.settings)==null?void 0:k.privacy)==null?void 0:j.showOnlineStatus)!==!1;l&&F?S.add(l):l&&!F&&S.delete(l);const D=r=>(r==null?void 0:r.role)==="owner"?3:(r==null?void 0:r.role)==="admin"||r!=null&&r.isAdmin?2:1,C=s.filter(r=>{if(!r)return!1;const f=Y(r);return f&&S.has(f)}).sort((r,f)=>{var v,x;const L=D(f)-D(r);if(L!==0)return L;const i=((v=r.profile)==null?void 0:v.displayName)||r.username||"",P=((x=f.profile)==null?void 0:x.displayName)||f.username||"";return i.localeCompare(P)}),N=s.filter(r=>{if(!r)return!1;const f=Y(r);return f&&!S.has(f)}).sort((r,f)=>{var v,x;const L=D(f)-D(r);if(L!==0)return L;const i=((v=r.profile)==null?void 0:v.displayName)||r.username||"",P=((x=f.profile)==null?void 0:x.displayName)||f.username||"";return i.localeCompare(P)});return e.jsxs("div",{className:"members-sidebar custom-scrollbar",children:[e.jsxs("div",{className:"members-header-top",children:[e.jsx("h3",{children:"ÜYELER"}),_&&e.jsx("button",{onClick:_,className:"close-members-btn","aria-label":"Kapat",children:e.jsx(ke,{size:20,strokeWidth:2})})]}),e.jsxs("div",{className:"members-category",children:["Çevrim içi — ",C.length]}),C.map((r,f)=>{var V,Z,K,ie;if(!r||typeof r=="string")return null;const L=r.username||"Unknown",i=((V=r.profile)==null?void 0:V.avatar)||r.avatar,P=((Z=r.profile)==null?void 0:Z.displayName)||L,v=r.role==="owner",x=r.role==="admin"||r.isAdmin;return e.jsxs(Et,{to:`/profile/${L}`,className:"member-item member-link",children:[e.jsxs("div",{className:"member-avatar-wrapper",children:[i?e.jsx("img",{src:ee(i),alt:"",className:"member-avatar"}):e.jsx("div",{className:"member-avatar-placeholder",children:((K=P[0])==null?void 0:K.toUpperCase())||((ie=L[0])==null?void 0:ie.toUpperCase())||"?"}),e.jsx("div",{className:"status-indicator online"})]}),e.jsx("div",{className:"member-info",children:e.jsxs("span",{className:"member-name active-role",style:{color:v?"#f1c40f":x?"#3498db":"#2ecc71"},children:[P,v&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!v&&x&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"})]})})]},r._id||r.id||f)}),e.jsxs("div",{className:"members-category",children:["Çevrim dışı — ",N.length]}),N.map((r,f)=>{var V,Z,K,ie;if(!r||typeof r=="string")return null;const L=r.username||"Unknown",i=((V=r.profile)==null?void 0:V.avatar)||r.avatar,P=((Z=r.profile)==null?void 0:Z.displayName)||L,v=r.role==="owner",x=r.role==="admin"||r.isAdmin;return e.jsxs(Et,{to:`/profile/${L}`,className:"member-item offline member-link",children:[e.jsx("div",{className:"member-avatar-wrapper",children:i?e.jsx("img",{src:ee(i),alt:"",className:"member-avatar"}):e.jsx("div",{className:"member-avatar-placeholder",style:{backgroundColor:"var(--bg-secondary)"},children:((K=P[0])==null?void 0:K.toUpperCase())||((ie=L[0])==null?void 0:ie.toUpperCase())||"?"})}),e.jsx("div",{className:"member-info",style:{flex:1},children:e.jsxs("div",{className:"member-name-row",style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("span",{className:"member-name",children:[P,v&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!v&&x&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"})]}),r.lastActive&&e.jsx("span",{className:"last-active-time",style:{fontSize:"11px",color:"var(--text-muted)"},children:g(r.lastActive)})]})})]},r._id||r.id||`offline-${f}`)}),e.jsx("style",{children:`
                .members-sidebar {
                    width: 240px;
                    background-color: var(--bg-secondary);
                    height: 100%;
                    overflow-y: auto;
                    flex-shrink: 0;
                    padding: 0 8px 8px 16px; /* Adjusted padding top */
                }
                
                .members-header-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 0 8px 0;
                    margin-bottom: 8px;
                }

                .members-header-top h3 {
                    font-size: 12px;
                    font-weight: 700;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                    margin: 0;
                }

                .close-members-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .close-members-btn:hover {
                    color: var(--text-primary);
                    background-color: var(--bg-hover);
                }

                .members-category {
                    font-size: 12px;
                    font-weight: 700;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                    margin: 24px 0 8px 0;
                }
                .members-category:first-child { margin-top: 0; }
                
                .member-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 6px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-bottom: 2px;
                    color: var(--text-secondary);
                    text-decoration: none;
                }
                .member-link {
                    text-decoration: none;
                    color: inherit;
                }
                .member-item:hover {
                    background-color: var(--bg-hover);
                    color: var(--text-primary);
                }
                .member-item.offline {
                    opacity: 0.7;
                }
                .member-item.offline:hover {
                    opacity: 1;
                }
                .member-avatar-wrapper {
                    position: relative;
                    width: 32px;
                    height: 32px;
                }
                .member-avatar, .member-avatar-placeholder {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }
                .member-avatar-placeholder {
                    background-color: var(--primary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 500;
                    font-size: 12px;
                }
                .status-indicator {
                    position: absolute;
                    bottom: -2px;
                    right: -2px;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    border: 3px solid var(--bg-secondary);
                }
                .status-indicator.online { background-color: #23a559; }

                .member-info {
                    display: flex;
                    flex-direction: column;
                }
                .member-name {
                    font-size: 14px;
                    font-weight: 500;
                    color: inherit;
                }
                .active-role {
                    color: #2ecc71 !important; /* Keep role color specific */
                }
                .member-custom-status {
                    font-size: 12px;
                    margin-top: 2px;
                    color: var(--text-tertiary);
                }
            `})]})},Ws=({alerts:s=[]})=>{const[_,R]=a.useState(()=>{try{const l=sessionStorage.getItem("dismissed_portal_alerts");return l?JSON.parse(l):[]}catch{return[]}}),[w,W]=a.useState(null),g=s.filter(l=>!_.includes(l._id)),Y=l=>{W(l),setTimeout(()=>{const F=[..._,l];R(F);try{sessionStorage.setItem("dismissed_portal_alerts",JSON.stringify(F))}catch{}W(null)},300)},S=l=>{const F=new Date,C=new Date(l)-F;if(C<=0)return null;const N=Math.floor(C/(1e3*60*60*24)),k=Math.floor(C/(1e3*60*60)%24),j=Math.floor(C/(1e3*60)%60);return N>0?`${N} gün ${k} saat kaldı`:k>0?`${k} saat ${j} dk kaldı`:`${j} dakika kaldı`};return g.length===0?null:e.jsx(e.Fragment,{children:g.map(l=>e.jsx("div",{className:`portal-alert-banner ${w===l._id?"dismissing":""}`,children:e.jsxs("div",{className:"alert-banner-inner",children:[e.jsx("div",{className:"alert-banner-icon",children:e.jsx(Is,{size:18,strokeWidth:2})}),e.jsxs("div",{className:"alert-banner-content",children:[e.jsx("div",{className:"alert-banner-label",children:e.jsx("span",{children:"Yönetici Uyarısı"})}),e.jsx("div",{className:"alert-banner-message",children:l.message}),e.jsx("div",{className:"alert-banner-meta",children:e.jsxs("span",{className:"alert-banner-time",children:[e.jsx(zs,{size:16,strokeWidth:2}),S(l.expiresAt)||"Süresi dolmak üzere"]})})]}),e.jsx("button",{className:"alert-banner-close",onClick:()=>Y(l._id),title:"Uyarıyı gizle",children:e.jsx(ke,{size:16,strokeWidth:2.5})})]})},l._id))})},Fs=a.lazy(()=>He(()=>import("./PortalSettingsModal-CV76vx5N.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9]))),Vs=a.lazy(()=>He(()=>import("./PortalNotifications-Cl8STU5f.js"),__vite__mapDeps([10,1,2,3,4,5,6,11]))),Ys=a.lazy(()=>He(()=>import("./VoiceChannel-DHPmjfp_.js"),__vite__mapDeps([12,1,4,2,3,5,6,13,14]))),Gs=a.lazy(()=>He(()=>import("./ConferenceChannel-B72n2V_u.js"),__vite__mapDeps([15,1,4,2,3,5,6,13,14]))),fn=()=>{var Lt,At;const{id:s}=ms(),_=us(),[R]=hs(),w=R.get("channel"),W=R.get("post"),{user:g,updateUser:Y,loading:S}=dt(),{socket:l,connected:F}=pt(),D=qt(),C=Wt(),{isSidebarOpen:N,closeSidebar:k,isMobileView:j,mobileChannelOpen:r,setMobileChannelOpen:f}=C||{},L=(C==null?void 0:C.isDesktopSidebarCollapsed)||!1,[i,P]=a.useState(null),v=Oe(t=>t.posts),x=Oe(t=>t.setPosts),[V,Z]=a.useState(!0),[K,ie]=a.useState(!1),[ve,re]=a.useState(""),[O,ue]=a.useState(null),[de,Ne]=a.useState(null),[ye,Se]=a.useState(!1),[T,p]=a.useState(null),[E,Qe]=a.useState(!1),[te,be]=a.useState(""),[oe,mt]=a.useState([]);a.useRef(null);const[Ce,Ze]=a.useState(!1),[_e,ut]=a.useState(!1),[je,ht]=a.useState({show:!1,message:"",type:"info"}),[Vt,Yt]=a.useState(!1),[Pe,se]=a.useState(!1),[xt,ft]=a.useState({top:0,left:0}),[Je,gt]=a.useState(""),[vt,$e]=a.useState(!1),Ie=a.useRef(null),yt=a.useRef(null),bt=a.useRef(null),jt=a.useRef(null),[I,we]=a.useState(null),[he,ze]=a.useState([]),[fe,Te]=a.useState([]),[q,qe]=a.useState(null),[Gt,Me]=a.useState(0),[wt,Xe]=a.useState(!1),Ue=a.useRef(!1);gs();const pe=Bt(t=>t.activeUploads)[`portal-${s}`];a.useEffect(()=>{pe&&pe.status==="uploading"&&x(t=>t.map(n=>n.isOptimistic&&n.mediaType==="video"?{...n,uploadProgress:pe.progress}:n))},[pe==null?void 0:pe.progress,pe==null?void 0:pe.status]);const[Kt,kt]=a.useState(!1),Ot=a.useRef(null),Re=a.useRef(null),Ht=a.useCallback(t=>{t.preventDefault(),t.stopPropagation(),se(n=>{if(!n&&Re.current){const o=Re.current.getBoundingClientRect();ft({top:o.bottom+8,left:o.left})}return!n})},[]);a.useEffect(()=>{if(!Pe)return;let t=!0;const n=()=>{if(Re.current){const d=Re.current.getBoundingClientRect();ft({top:d.bottom+8,left:d.left})}},o=d=>{if(!t)return;const h=d.target.closest(".plus-menu")||d.target.closest(".portal-plus-menu-portal"),b=d.target.closest(".upload-btn");!h&&!b&&se(!1)},c=setTimeout(()=>{t&&(document.addEventListener("click",o),document.addEventListener("touchstart",o))},0);return window.addEventListener("scroll",n,!0),window.addEventListener("resize",n),()=>{t=!1,clearTimeout(c),document.removeEventListener("click",o),document.removeEventListener("touchstart",o),window.removeEventListener("scroll",n,!0),window.removeEventListener("resize",n)}},[Pe]),a.useEffect(()=>()=>{se(!1)},[]),a.useEffect(()=>{se(!1)},[T,s]),a.useEffect(()=>{var t;(t=_.state)!=null&&t.quotedPost&&(qe(_.state.quotedPost),_.state.selectedChannelId&&p(_.state.selectedChannelId),D(_.pathname+_.search,{replace:!0,state:{}}))},[_.state,s]);const J=(Lt=i==null?void 0:i.channels)==null?void 0:Lt.find(t=>t._id===T),We=(J==null?void 0:J.type)==="image",Nt=(J==null?void 0:J.type)==="voice"||(J==null?void 0:J.type)==="conference",St=Nt&&(!j||r);a.useEffect(()=>{if(!l||!F||!s)return;l.emit("join_portal",s),l.emit("get_online_users"),T&&l.emit("join_channel",T);const t=d=>{var z,B;const h=((z=d.portal)==null?void 0:z._id)||d.portal,b=((B=d.channel)==null?void 0:B._id)||d.channel,m=String(h)===String(s),U=String(b)===String(T);m&&U&&x(H=>{if(H.some(M=>M._id===d._id))return H;const y=d.quotedPost&&(typeof d.quotedPost=="string"?d.quotedPost:d.quotedPost._id);if(y){const M=H.find(le=>le._id===y);M&&typeof M=="object"&&M.author?d.quotedPost=M:q&&y===q._id&&(d.quotedPost=q)}return[d,...H]})},n=d=>{var m;const h=((m=d.portal)==null?void 0:m._id)||d.portal;(!h||String(h)===String(s))&&x(U=>U.map(z=>String(z._id)===String(d._id)?d:z))},o=({userId:d,status:h,lastActive:b})=>{h==="offline"&&mt(m=>m.filter(U=>String(U.userId)!==String(d))),P(m=>{if(!m)return m;const U=b||new Date;let z=m.owner;if(m.owner){const y=m.owner._id||m.owner.id||m.owner;String(y)===String(d)&&typeof m.owner=="object"&&(z={...m.owner,lastActive:U})}let B=m.admins;Array.isArray(m.admins)&&(B=m.admins.map(y=>{const M=y._id||y.id||y;return String(M)===String(d)&&typeof y=="object"&&y!==null?{...y,lastActive:U}:y}));let H=m.members;return Array.isArray(m.members)&&(H=m.members.map(y=>{const M=y._id||y.id||y;return String(M)===String(d)&&typeof y=="object"&&y!==null?{...y,lastActive:U}:y})),{...m,owner:z,admins:B,members:H}})},c=({userId:d,username:h,displayName:b,avatar:m,isTyping:U})=>{String(d)!==String(g==null?void 0:g._id)&&mt(z=>U?z.some(B=>String(B.userId)===String(d))?z:[...z,{userId:d,username:h,displayName:b,avatar:m}]:z.filter(B=>String(B.userId)!==String(d)))};return l.on("post:created",t),l.on("post:updated",n),l.on("user_status_change",o),l.on("portal_typing_update",c),()=>{l.off("post:created",t),l.off("post:updated",n),l.off("user_status_change",o),l.off("portal_typing_update",c)}},[l,F,s,T,g==null?void 0:g._id]);const Qt=t=>{if(!t)return null;const n=/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,o=t.match(n);return o&&o[2].length===11?o[2]:null},Zt=t=>{const n=t.target.value;gt(n)},Ct=()=>{const t=Qt(Je);if(!t){X("Geçersiz YouTube URL'si","error");return}we({name:"YouTube Video",type:"youtube",preview:`https://img.youtube.com/vi/${t}/hqdefault.jpg`,url:Je}),$e(!1),gt("")},[Jt,et]=a.useState(!1),[Xt,es]=a.useState(0),tt=a.useRef(null),st=a.useRef(null),De=a.useRef(null),ts=a.useCallback(t=>{const n=t.target;st.current||(st.current=requestAnimationFrame(()=>{st.current=null;const o=n.scrollTop,c=o>300;et(h=>h!==c?c:h);const d=n.scrollHeight-n.clientHeight;if(d>0){const h=Math.round(o/d*100);es(b=>Math.abs(b-h)>=2?h:b)}}))},[]),ss=a.useCallback(t=>{t&&(t.preventDefault(),t.stopPropagation()),De.current&&cancelAnimationFrame(De.current);const n=tt.current||document.querySelector(".discord-feed")||document.querySelector(".portal-feed-container");if(!n){window.scrollTo({top:0,behavior:"smooth"});return}const o=n.scrollTop;if(o<=0)return;const c=800,d=performance.now(),h=m=>1-Math.pow(1-m,5),b=m=>{const U=m-d,z=Math.min(U/c,1),B=h(z);n.scrollTop=Math.round(o*(1-B)),z<1?De.current=requestAnimationFrame(b):(n.scrollTop=0,De.current=null)};De.current=requestAnimationFrame(b)},[]),ns=t=>{p(t),et(!1),j&&(k(),f(!0))},X=a.useCallback((t,n="info")=>{ht({show:!0,message:t,type:n}),setTimeout(()=>ht(o=>({...o,show:!1})),4e3)},[]),as=t=>{const n=Array.from(t.target.files||[]);if(n.length===0)return;we(null),Ue.current=!1;const c=10-he.length;if(c<=0){X("Bir gönderiye en fazla 10 görsel ekleyebilirsiniz.","warning");return}const d=n.slice(0,c);n.length>c&&X(`En fazla 10 görsel ekleyebilirsiniz. İlk ${c} görsel eklendi.`,"warning");const h=[],b=[];for(const m of d){if(m.size>2*1024*1024*1024){X(`${m.name} boyutu 2 GB'dan büyük olamaz.`,"error");continue}h.push(m),b.push({url:URL.createObjectURL(m),name:m.name,size:m.size,file:m})}ze(m=>[...m,...h]),Te(m=>[...m,...b]),se(!1),Ie.current&&(Ie.current.value="")},is=t=>{ze(n=>n.filter((o,c)=>c!==t)),Te(n=>{const o=n[t];if(o&&o.url&&o.url.startsWith("blob:"))try{URL.revokeObjectURL(o.url)}catch{}return n.filter((c,d)=>d!==t)})},nt=t=>{const n=t.target.files[0];if(n){if(n.size>2*1024*1024*1024){X("Dosya boyutu 2 GB'dan büyük olamaz.","error");return}ze([]),Te([]),we(n),Ue.current=n.type.startsWith("video/")||["mp4","webm","ogg","mov","m4v"].includes(n.name.split(".").pop().toLowerCase()),se(!1)}};a.useEffect(()=>{!l||!s||(te.trim().length>0||I!==null||he.length>0?Ce||(Ze(!0),l.emit("portal_typing",{portalId:s,isTyping:!0})):Ce&&(l.emit("portal_typing",{portalId:s,isTyping:!1}),Ze(!1)))},[te,I,he,s,l,Ce]),a.useEffect(()=>()=>{l&&s&&Ce&&l.emit("portal_typing",{portalId:s,isTyping:!1})},[s,l,Ce]);const _t=async()=>{var B,H;const t=te.trim().length>0,n=!!I,o=he.length>0;if(!t&&!n&&!o)return;l&&s&&l.emit("portal_typing",{portalId:s,isTyping:!1}),Ze(!1);const c={content:te,media:I,mediaFiles:[...he],mediaPreviews:[...fe]},d=I&&I.type==="youtube",h=`temp-${Date.now()}`;let b=null,m=null;d?(b=I.url,m="youtube"):o?(b=fe.map(y=>y.url),m="image"):I&&(b=URL.createObjectURL(I),m=I.type.startsWith("video")?"video":I.type.includes("gif")?"gif":"image");const U=m==="video",z={_id:h,content:te,media:b,mediaType:m||"none",author:g,createdAt:new Date().toISOString(),likes:[],likeCount:0,isOptimistic:!0,quotedPost:q,isProcessing:!!U,processingProgress:0,estimatedTime:U?"Hesaplanıyor...":""};x(y=>[z,...y]),be(""),we(null),ze([]),Te([]),se(!1),Xe(!0),Me(0);try{let y=null,M=null,le=null,ge=null,Ke=null;if(d)le=c.media.url,ge="youtube";else if(c.mediaFiles&&c.mediaFiles.length>0){const u=c.mediaFiles.length,A=new Array(u).fill(0),G=c.mediaFiles.map(($,Q)=>$t($,"post",s,Ee=>{A[Q]=Ee;const ae=Math.round(A.reduce((ce,xe)=>ce+xe,0)/u);Me(ae),x(ce=>ce.map(xe=>String(xe._id)===String(h)?{...xe,uploadProgress:ae}:xe))}));M=await Promise.all(G)}else if(c.media)if(Ue.current){Bt.getState().startVideoUpload({file:c.media,portalId:s,channel:T,content:c.content,quotedPostId:q==null?void 0:q._id,onFinish:(u,A)=>{if(u)x(G=>G.filter($=>String($._id)!==String(h))),X("Video yükleme başarısız oldu.","error");else if(A){const G=String(h);x($=>{const Q=String(A._id);return $.some(ae=>String(ae._id)===Q)?$.filter(ae=>String(ae._id)!==G):$.map(ae=>{if(String(ae._id)===G){const ce=A,xe=ce.quotedPost&&(typeof ce.quotedPost=="string"?ce.quotedPost:ce.quotedPost._id);return xe&&ae.quotedPost&&xe===ae.quotedPost._id&&(ce.quotedPost=ae.quotedPost),ce}return ae})})}}}),Xe(!1),qe(null);return}else y=await $t(c.media,"post",s,u=>{Me(u),x(A=>A.map(G=>String(G._id)===String(h)?{...G,uploadProgress:u}:G))});else Me(100);const ne={content:c.content,portalId:s,channel:T,quotedPostId:q==null?void 0:q._id};M&&M.length>0?(ne.mediaKeys=M,ne.mediaType="image"):y?(ne.mediaKey=y,Ue.current?ne.mediaType="video":c.media&&(c.media.type==="application/pdf"||c.media.name.toLowerCase().endsWith(".pdf"))&&(ne.pdfName=c.media.name,ne.pdfSize=c.media.size)):le&&(ne.media=le,ne.mediaType=ge);const Le=await me.post("/api/posts",ne);qe(null);const Ae=String(h);x(u=>{const A=String(Le.data._id);return u.some($=>String($._id)===A)?u.filter($=>String($._id)!==Ae):u.map($=>{if(String($._id)===Ae){const Q=Le.data,Ee=Q.quotedPost&&(typeof Q.quotedPost=="string"?Q.quotedPost:Q.quotedPost._id);return Ee&&$.quotedPost&&Ee===$.quotedPost._id&&(Q.quotedPost=$.quotedPost),Q}return $})})}catch(y){const M=((H=(B=y.response)==null?void 0:B.data)==null?void 0:H.message)||y.message;X(M,"error"),x(le=>le.filter(ge=>String(ge._id)!==String(h))),be(c.content),we(c.media),ze(c.mediaFiles||[]),Te(c.mediaPreviews||[])}finally{Xe(!1),Me(0)}},[at,Fe]=a.useState(!1),[it,rs]=a.useState("overview"),[Os,Hs]=a.useState(!1),[Qs,os]=a.useState({name:"",description:"",privacy:"public"});a.useRef(null),a.useRef(null),a.useEffect(()=>{s&&!S&&Pt()},[s,S]),a.useEffect(()=>{if(!S&&i&&i.channels&&i.channels.length>0)if(T){if(!i.channels.some(n=>String(n._id)===String(T))){const n=i.channels.find(o=>o.name==="genel"||o.name==="general")||i.channels[0];n&&p(n._id)}}else{if(w){const n=i.channels.find(o=>String(o._id)===String(w));if(n){p(n._id);return}}const t=i.channels.find(n=>n.name==="genel"||n.name==="general")||i.channels[0];t&&p(t._id)}},[i,S]),a.useLayoutEffect(()=>{const t=!!w||R.get("joinVoice")==="true";return f&&f(!!t),()=>{f&&f(!1)}},[s,w,R,f]),a.useEffect(()=>{s&&T&&i&&ct(i._id,s)&&Ye()},[s,T,i==null?void 0:i._id]),a.useEffect(()=>{if(W&&!E&&!K&&Array.isArray(v)&&v.length>0){const t=document.getElementById(`post-${W}`);t&&setTimeout(()=>{t.scrollIntoView({behavior:"smooth",block:"center"}),t.classList.add("highlight-post"),setTimeout(()=>t.classList.remove("highlight-post"),2e3),Qe(!0)},100)}},[W,v,K,E]),a.useEffect(()=>{var t,n;if(i&&g){const o=((t=i.members)==null?void 0:t.includes(g._id))||((n=g.joinedPortals)==null?void 0:n.some(c=>c._id===i._id||c===i._id));Se(!!o)}},[i,g]);const Pt=async()=>{(!i||i._id!==s)&&(Z(!0),et(!1));try{const t=await me.get(`/api/portals/${s}`);P(t.data),os({name:t.data.name,description:t.data.description||"",privacy:t.data.privacy||"public"})}catch(t){if(t.response&&t.response.status===403){const n=t.response.data;n.portalStatus==="suspended"||n.portalStatus==="closed"?(ue({portalStatus:n.portalStatus,statusReason:n.statusReason,suspendedUntil:n.suspendedUntil,portalName:n.portalName,portalAvatar:n.portalAvatar}),re("suspended")):re("blocked")}else t.response&&t.response.status===404?re("blocked"):re("Portal yüklenemedi")}finally{Z(!1)}},Ve=a.useRef(null),It=a.useRef(v);It.current=v;const rt=a.useRef(T);rt.current=T;const Ye=a.useCallback(async(t=!1)=>{var n,o;t?Tt(!0):(Ve.current&&Ve.current.abort(),Ve.current=new AbortController,ie(!0),x([]),ot(!0));try{const c=localStorage.getItem("token"),d={signal:(n=Ve.current)==null?void 0:n.signal,...c&&{headers:{Authorization:`Bearer ${c}`}}},h=rt.current;if(t&&h!==rt.current)return;let b=`/api/portals/${s}/posts?channel=${h}&limit=10`;const m=It.current;if(t&&m.length>0){const B=m[m.length-1];b+=`&before=${B.createdAt}`}const z=(await me.get(b,d)).data;z.length<10&&ot(!1),x(t?B=>{const H=new Set(B.map(M=>M._id)),y=z.filter(M=>!H.has(M._id));return[...B,...y]}:z),re("")}catch(c){if(me.isCancel(c))return;((o=c.response)==null?void 0:o.status)===403?re("private"):re("Gönderiler yüklenemedi")}finally{t||ie(!1),Tt(!1),Z(!1)}},[s]),[zt,ot]=a.useState(!0),[lt,Tt]=a.useState(!1),Ge=a.useRef(),ls=a.useCallback(t=>{lt||(Ge.current&&Ge.current.disconnect(),Ge.current=new IntersectionObserver(n=>{n[0].isIntersecting&&zt&&Ye(!0)},{root:tt.current,rootMargin:"200px"}),t&&Ge.current.observe(t))},[lt,zt,Ye]);a.useEffect(()=>{x([]),ot(!0),p(null),P(null),re(""),f(!1)},[s]);const cs=a.useCallback(t=>{x(n=>n.filter(o=>String(o._id)!==String(t)))},[x]),ds=a.useCallback((t,n)=>{n&&x(o=>o.filter(c=>String(c._id)!==String(t)))},[x]),ps=a.useCallback(async t=>{try{const o=(await me.put(`/api/posts/${t}/pin`)).data;x(c=>c.map(h=>h._id===t?o:h).sort((h,b)=>h.isPinned===b.isPinned?new Date(b.createdAt)-new Date(h.createdAt):h.isPinned?-1:1))}catch{X("Sabitleme işlemi başarısız","error")}},[x,X]),Mt=async()=>{var t,n;if(!g){X("Lütfen giriş yapın veya kaydolun!","warning");return}try{const o=localStorage.getItem("token"),c=o?{headers:{Authorization:`Bearer ${o}`}}:{};if((await me.post(`/api/portals/${s}/join`,{},c)).data.status==="joined"){Se(!0);const h={...g,joinedPortals:[...g.joinedPortals||[],i]};Y(h),P(b=>({...b,members:[...b.members||[],g._id]})),Ye(),X("Portala başarıyla katıldınız!","success")}else X("Üyelik isteğiniz gönderildi!","info"),P(h=>({...h,isRequested:!0}))}catch(o){X(((n=(t=o.response)==null?void 0:t.data)==null?void 0:n.message)||"Katılma başarısız","error")}},ct=(t,n)=>{if(!t||!n)return!1;const o=typeof t=="object"?t.toString():t,c=typeof n=="object"?n.toString():n;return o===c},Rt=g&&i&&i.owner&&ct(i.owner._id||i.owner,g._id),Dt=Rt||g&&i&&i.admins&&i.admins.some(t=>ct(t._id||t,g._id));if(a.useEffect(()=>{if(!(O!=null&&O.suspendedUntil)){Ne(null);return}const t=()=>{const o=new Date,d=new Date(O.suspendedUntil)-o;if(d<=0){Ne(null),window.location.reload();return}Ne({days:Math.floor(d/(1e3*60*60*24)),hours:Math.floor(d/(1e3*60*60)%24),minutes:Math.floor(d/(1e3*60)%60),seconds:Math.floor(d/1e3%60)})};t();const n=setInterval(t,1e3);return()=>clearInterval(n)},[O]),ve==="suspended"&&O){const t=O.portalStatus==="suspended",n=O.suspendedUntil?new Date(O.suspendedUntil).toLocaleString("tr-TR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):null;return e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(Be,{}),e.jsx("div",{className:"suspension-screen",children:e.jsxs("div",{className:"suspension-card",children:[e.jsx("div",{className:"suspension-icon",children:t?"⏸️":"🔒"}),e.jsx("h1",{className:"suspension-title",children:O.portalName||"Portal"}),e.jsx("h2",{className:"suspension-subtitle",children:t?"Bu portal geçici olarak askıya alındı":"Bu portal kapatılmıştır"}),O.statusReason&&e.jsxs("div",{className:"suspension-reason",children:[e.jsx("div",{className:"suspension-reason-label",children:"Sebep"}),e.jsx("p",{children:O.statusReason})]}),t&&n&&e.jsxs("div",{className:"suspension-unlock",children:[e.jsx("div",{className:"suspension-unlock-label",children:"🔓 Erişim Açılma Tarihi"}),e.jsx("div",{className:"suspension-unlock-date",children:n}),de&&e.jsxs("div",{className:"suspension-countdown",children:[e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(de.days).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Gün"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(de.hours).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saat"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(de.minutes).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Dakika"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(de.seconds).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saniye"})]})]})]}),e.jsxs("div",{className:"suspension-policy",children:[e.jsx("span",{children:"📋"}),e.jsxs("p",{children:["Askıya alma nedenleri, platformun ",e.jsx("strong",{children:"Politika ve Koşullar"}),"'ı kapsamında değerlendirilmektedir. Detaylı bilgi için kurallarımızı inceleyebilirsiniz."]})]}),e.jsx("button",{onClick:()=>D("/"),className:"suspension-home-btn",children:"Anasayfaya Dön"})]})})]})}return ve==="blocked"?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(Be,{}),e.jsxs("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center",flexDirection:"column",color:"var(--text-muted)"},children:[e.jsx("div",{style:{fontSize:"3rem",marginBottom:"1rem"},children:"🚫"}),e.jsx("h2",{children:"Sonuç Bulunamadı"}),e.jsx("p",{children:"Aradığınız portala ulaşılamıyor."}),e.jsx("button",{onClick:()=>D("/"),className:"btn-save",style:{marginTop:"20px",float:"none"},children:"Anasayfaya Dön"})]})]}):V||S||!i?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(Be,{}),e.jsx("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center"},children:e.jsx("div",{className:"spinner"})})]}):i.isNSFW&&!Vt&&!sessionStorage.getItem(`nsfw_confirmed_${s}`)?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(Be,{}),e.jsx("div",{className:"nsfw-gate-overlay",children:e.jsxs("div",{className:"nsfw-gate-card",children:[e.jsx("div",{className:"nsfw-gate-icon",children:e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]})}),e.jsx("div",{className:"nsfw-gate-badge",children:"+18"}),e.jsx("h1",{className:"nsfw-gate-title",children:"Yaş Kısıtlaması"}),e.jsxs("p",{className:"nsfw-gate-desc",children:[e.jsx("strong",{children:i.name})," portalı yetişkin içerik barındırabilir. Bu portala erişmek için 18 yaşından büyük olmanız gerekmektedir."]}),e.jsxs("div",{className:"nsfw-gate-actions",children:[e.jsx("button",{className:"nsfw-gate-confirm",onClick:()=>{sessionStorage.setItem(`nsfw_confirmed_${s}`,"true"),Yt(!0)},children:"18 yaşından büyüğüm, devam et"}),e.jsx("button",{className:"nsfw-gate-cancel",onClick:()=>D(-1),children:"Geri Dön"})]}),e.jsx("p",{className:"nsfw-gate-legal",children:"Devam ederek, yaşınızın 18'den büyük olduğunu ve yetişkin içerikle ilgili yasal sorumluluğu kabul ettiğinizi onaylarsınız."})]})})]}):e.jsxs("div",{className:`app-wrapper full-height discord-layout ${St?"voice-channel-active":""}`,children:[e.jsx(As,{title:i.name,description:i.description||`${i.name} topluluğuna katılın.`,image:ee(i.avatar),type:"website",schema:{"@context":"https://schema.org","@type":"Community",name:i.name,description:i.description,url:window.location.href,memberCount:((At=i.members)==null?void 0:At.length)||0}}),!at&&e.jsx(Be,{}),je.show&&e.jsxs("div",{className:`app-toast ${je.type}`,children:[e.jsx("span",{className:"app-toast-icon",children:je.type==="error"?"🚫":je.type==="success"?"✅":je.type==="warning"?"⚠️":"ℹ️"}),je.message]}),e.jsxs("div",{className:`discord-split-view ${j&&r?"mobile-feed-active":""} ${St?"voice-room-active":""} ${L?"sidebar-collapsed":""}`,children:[g&&e.jsx(qs,{portal:i,isMember:ye,canManage:Rt||Dt,onEdit:t=>{rs(typeof t=="string"?t:"overview"),Fe(!0)},currentChannel:T,onChangeChannel:ns,className:`${N?"mobile-open":""} ${j&&r?"mobile-hidden":""}`,onShowPortalInfo:()=>kt(!0)}),e.jsxs("main",{className:`discord-main-content ${j&&!r?"mobile-content-hidden":""} ${Nt?"voice-channel-active":""}`,children:[j&&!r&&e.jsx(Ls,{title:(i==null?void 0:i.name)||"Portal",showBack:!1}),(()=>{var d,h,b,m,U,z,B,H,y,M,le,ge,Ke,ne,Le,Ae;const t=J,n=(t==null?void 0:t.type)||"text",o=(t==null?void 0:t.name)||"...",c=n==="voice"||n==="conference";return e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{display:"flex",flex:1,overflow:"hidden"},children:c?e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column"},children:[j&&e.jsx("header",{className:"channel-top-bar",style:{flexShrink:0},children:e.jsxs("div",{className:"channel-title-wrapper",children:[e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>f(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",style:{color:"var(--primary-color)"},children:n==="voice"||n==="conference"?e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{color:"var(--primary-color)"},children:[e.jsx("path",{d:"M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"}),e.jsx("path",{d:"M19 10v2a7 7 0 0 1-14 0v-2"}),e.jsx("line",{x1:"12",y1:"19",x2:"12",y2:"23"})]}):n==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",style:{color:"var(--primary-color)"},children:o})]})}),e.jsx(a.Suspense,{fallback:e.jsx("div",{className:"skeleton-loader",children:e.jsx("p",{children:"Canlı bağlantı odası hazırlanıyor..."})}),children:n==="conference"?e.jsx(Gs,{portalId:s,channelId:T,channelName:o,onBack:()=>f(!1)}):e.jsx(Ys,{portalId:s,channelId:T,channelName:o,onBack:()=>f(!1)})})]}):e.jsx("div",{className:"channel-messages-area",style:{flex:1,display:"flex",flexDirection:"column"},children:K?e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"},children:[e.jsx("div",{className:"spinner"}),e.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.9rem"},children:"İçerik yükleniyor..."})]}):e.jsxs(e.Fragment,{children:[!c&&e.jsxs("header",{className:`channel-top-bar ${j?"":"desktop-only"}`,children:[e.jsxs("div",{className:"channel-title-wrapper",children:[j&&e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>f(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",children:n==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",children:o})]}),e.jsx("div",{className:"channel-header-actions",children:ye&&e.jsx("button",{className:`icon-btn ${_e?"active":""}`,onClick:()=>ut(!_e),title:_e?"Üyeleri Gizle":"Üyeleri Göster",style:{background:"none",border:"none",color:_e?"var(--primary-color)":"var(--text-muted)"},children:e.jsx(Ts,{size:20})})})]}),ve==="private"?e.jsx("div",{className:"portal-privacy-screen",children:e.jsxs("div",{className:"privacy-card",children:[e.jsx("div",{className:"privacy-icon",children:"🔒"}),e.jsx("img",{src:ee(i.avatar),alt:"",className:"privacy-avatar",loading:"lazy",decoding:"async",width:"80",height:"80"}),e.jsx("h2",{children:i.name}),e.jsx("p",{className:"privacy-desc",children:i.description||"Bu portal gizlidir."}),e.jsx("p",{className:"privacy-hint",children:"İçeriği görmek ve mesajlaşmak için üye olmalısın."}),i.isRequested?e.jsx("button",{className:"privacy-join-btn requested",disabled:!0,children:"İstek Gönderildi"}):e.jsx("button",{className:"privacy-join-btn",onClick:Mt,children:i.privacy==="private"?"Üyelik İsteği Gönder":"Portala Katıl"})]})}):e.jsxs(e.Fragment,{children:[(i==null?void 0:i.alerts)&&i.alerts.length>0&&e.jsx(Ws,{alerts:i.alerts}),e.jsxs("div",{className:"portal-feed-container discord-feed",onScroll:ts,ref:tt,children:[v.length===0&&!V&&e.jsxs("div",{className:"empty-portal",children:[e.jsx("div",{className:"empty-portal-icon",children:"👋"}),e.jsxs("h3",{children:[((h=(d=i==null?void 0:i.channels)==null?void 0:d.find(u=>u._id===T))==null?void 0:h.type)==="voice"?"🎙️":((m=(b=i==null?void 0:i.channels)==null?void 0:b.find(u=>u._id===T))==null?void 0:m.type)==="conference"?"🎤":((z=(U=i==null?void 0:i.channels)==null?void 0:U.find(u=>u._id===T))==null?void 0:z.type)==="image"?"🖼️":"#",((H=(B=i==null?void 0:i.channels)==null?void 0:B.find(u=>String(u._id)===String(T)))==null?void 0:H.name)||"..."," ","kanalına hoş geldin!"]}),e.jsx("p",{children:"Bu kanalda henüz mesaj yok. İlk mesajı sen at!"})]}),Array.isArray(v)&&v.map((u,A)=>{var $;u.isBot===!0||(($=u.author)==null||$.isBot);const G=fs.enableAds;return e.jsxs(a.Fragment,{children:[e.jsx(vs,{post:u,onDelete:cs,onPin:ps,onArchive:ds,isAdmin:Dt},u._id),A<v.length-1&&e.jsx("div",{className:"post-separator"}),G]},u._id)}),e.jsx("div",{ref:ls,style:{height:"40px",margin:"10px 0",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"},children:lt&&e.jsx("div",{className:"spinner-small"})})]}),(()=>{const A=2*Math.PI*20,G=A-Xt/100*A;return e.jsxs("button",{className:`floating-scroll-top portal-scroll-top ${Jt?"visible":""}`,onClick:ss,"aria-label":"Yukarı Çık",children:[e.jsxs("svg",{className:"progress-ring",width:"50",height:"50",viewBox:"0 0 50 50",children:[e.jsx("circle",{className:"progress-ring-track",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25"}),e.jsx("circle",{className:"progress-ring-fill",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25",style:{strokeDasharray:A,strokeDashoffset:G}})]}),e.jsx("div",{className:"scroll-icon",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"m18 15-6-6-6 6"})})})]})})(),g&&ye?e.jsxs("div",{className:"channel-input-area",children:[Pe&&xs.createPortal(e.jsxs("div",{className:"plus-menu portal-plus-menu-portal",ref:Ot,style:{position:"fixed",top:xt.top,left:xt.left,zIndex:99999},children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Ie.current.click(),se(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("circle",{cx:"8.5",cy:"8.5",r:"1.5"}),e.jsx("polyline",{points:"21 15 16 10 5 21"})]})}),"Görsel"]}),!We&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{yt.current.click(),se(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("polygon",{points:"23 7 16 12 23 17 23 7"}),e.jsx("rect",{x:"1",y:"5",width:"15",height:"14",rx:"2",ry:"2"})]})}),"Video"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{bt.current.click(),se(!1)},children:[e.jsx("div",{className:"plus-menu-icon",style:{fontWeight:800,fontSize:"10px"},children:"GIF"}),"GIF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{jt.current.click(),se(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"})]})}),"PDF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{$e(!vt),se(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"}),e.jsx("polygon",{points:"9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02",fill:"currentColor"})]})}),"YouTube"]})]})]}),document.body),e.jsx("input",{type:"file",ref:Ie,onChange:as,style:{display:"none"},accept:"image/png, image/jpeg, image/jpg, image/webp",multiple:!0}),e.jsx("input",{type:"file",ref:yt,onChange:nt,style:{display:"none"},accept:"video/mp4, video/webm, video/quicktime"}),e.jsx("input",{type:"file",ref:bt,onChange:nt,style:{display:"none"},accept:"image/gif"}),e.jsx("input",{type:"file",ref:jt,onChange:nt,style:{display:"none"},accept:".pdf"}),vt&&e.jsx("div",{className:"edit-modal-overlay",style:{zIndex:9999},children:e.jsxs("div",{className:"edit-modal-modern",style:{maxWidth:"400px",height:"auto",maxHeight:"none"},children:[e.jsxs("div",{className:"edit-modal-header-modern",children:[e.jsx("div",{className:"header-left",children:e.jsx("h3",{className:"header-title-modern",children:"YouTube Videosu Ekle"})}),e.jsx("button",{onClick:()=>$e(!1),className:"close-btn-modern",children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),e.jsxs("div",{className:"edit-modal-content-modern",style:{padding:"20px"},children:[e.jsxs("div",{className:"floating-label-group",children:[e.jsx("label",{className:"floating-label",children:"Video Bağlantısı"}),e.jsx("input",{type:"text",className:"floating-input",placeholder:"https://www.youtube.com/watch?v=...",value:Je,onChange:Zt,autoFocus:!0,onKeyDown:u=>{u.key==="Enter"&&(u.preventDefault(),Ct())}})]}),e.jsxs("div",{style:{marginTop:"20px",display:"flex",justifyContent:"flex-end",gap:"10px"},children:[e.jsx("button",{onClick:()=>$e(!1),className:"join-btn outline",style:{padding:"8px 16px"},children:"İptal"}),e.jsx("button",{onClick:Ct,className:"join-btn primary",style:{padding:"8px 20px"},children:"Ekle"})]})]})]})}),q&&e.jsxs("div",{className:"input-quoted-preview",children:[e.jsxs("div",{className:"input-quoted-preview-header",children:[(M=(y=q.author)==null?void 0:y.profile)!=null&&M.avatar?e.jsx("img",{src:ee(q.author.profile.avatar),alt:"",className:"quoted-preview-avatar",loading:"lazy",decoding:"async",width:"32",height:"32"}):e.jsx("div",{className:"quoted-preview-avatar-placeholder",children:(ge=(le=q.author)==null?void 0:le.username)==null?void 0:ge.charAt(0).toUpperCase()}),e.jsxs("div",{className:"quoted-preview-meta",children:[e.jsx("span",{className:"quoted-preview-author",children:((ne=(Ke=q.author)==null?void 0:Ke.profile)==null?void 0:ne.displayName)||((Le=q.author)==null?void 0:Le.username)}),e.jsxs("span",{className:"quoted-preview-username",children:["@",(Ae=q.author)==null?void 0:Ae.username]})]}),e.jsx("button",{className:"remove-quote-btn",onClick:()=>qe(null),children:e.jsx(ke,{size:16})})]}),e.jsxs("div",{className:"input-quoted-preview-body",children:[e.jsx("p",{className:"input-quoted-preview-text",children:q.content}),q.media&&e.jsx("div",{className:"input-quoted-preview-media",children:q.mediaType==="video"?e.jsxs("div",{className:"media-placeholder",children:[e.jsx(Ms,{size:20}),e.jsx("span",{children:"Video Alıntısı"})]}):e.jsx("img",{src:ee(q.media),alt:"",loading:"lazy",decoding:"async",width:"120",height:"80"})})]})]}),We&&te.trim()&&!I&&e.jsxs("div",{className:"image-channel-warning",style:{backgroundColor:"rgba(239, 68, 68, 0.1)",border:"1px solid rgba(239, 68, 68, 0.25)",color:"#f87171",padding:"8px 12px",borderRadius:"8px",fontSize:"13px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{flexShrink:0},children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]}),e.jsx("span",{children:"Görsel kanallarında paylaşım yapabilmek için mutlaka bir görsel eklemelisiniz."})]}),e.jsxs("div",{className:"message-input-wrapper",children:[e.jsx("button",{ref:Re,className:`input-action-btn upload-btn ${Pe?"active":""}`,onClick:Ht,style:{backgroundColor:"#383a40",borderRadius:"50%",width:"32px",height:"32px",marginRight:"12px",color:Pe?"var(--primary-color)":"#b9bbbe"},children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z"})})}),I&&e.jsxs("div",{className:"input-media-preview",style:{marginRight:"12px",display:"flex",alignItems:"center",backgroundColor:"var(--bg-secondary)",borderRadius:"8px",padding:"4px",gap:"8px",border:"1px solid var(--border-subtle)"},children:[I.type==="youtube"&&I.preview?e.jsx("img",{src:I.preview,alt:"Video Preview",style:{width:"40px",height:"30px",objectFit:"cover",borderRadius:"4px"},loading:"lazy",decoding:"async",width:"40",height:"30"}):e.jsx("span",{style:{fontSize:"20px",lineHeight:1,padding:"4px"},children:I.type.startsWith("video")?"🎥":I.type.includes("gif")?"👾":I.type==="application/pdf"||I.name&&I.name.toLowerCase().endsWith(".pdf")?"📄":"🖼️"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",maxWidth:"100px"},children:e.jsx("span",{style:{fontSize:"10px",color:"var(--text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:I.name||"Medya"})}),e.jsx("button",{onClick:()=>we(null),style:{background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer"},children:"×"})]}),e.jsx("input",{type:"text",placeholder:We?"Gönderi paylaşmak için bir görsel ekleyin...":`#${(J==null?void 0:J.name)||"..."} kanalına mesaj gönder`,value:te,onChange:u=>{be(u.target.value)},onKeyDown:u=>{u.key==="Enter"&&!u.shiftKey&&(u.preventDefault(),_t())}}),e.jsx("div",{className:"input-right-actions",children:e.jsx("button",{className:"input-action-btn send-btn",onClick:_t,disabled:wt||(We?!I&&he.length===0:!te.trim()&&!I&&he.length===0),title:"Gönder",style:{color:te.trim()||I||he.length>0?"var(--primary-color)":"var(--text-tertiary)"},children:wt?e.jsxs("div",{className:"compose-spinner-wrapper",style:{width:"20px",height:"20px"},children:[e.jsx("div",{className:"compose-spinner",style:{width:"20px",height:"20px",borderTopColor:"var(--primary-color)"}}),e.jsxs("span",{className:"compose-progress-text",style:{fontSize:"7px",color:"var(--text-primary)"},children:[Gt,"%"]})]}):e.jsx(Rs,{size:20})})})]}),fe&&fe.length>0&&e.jsxs("div",{className:"portal-image-previews-container",children:[e.jsxs("div",{className:"portal-image-previews-header",children:[e.jsxs("span",{className:"portal-image-previews-count",children:["Seçilen Görseller (",fe.length,"/10)"]}),fe.length<10&&e.jsx("button",{type:"button",className:"portal-add-more-images-btn",onClick:()=>{var u;return(u=Ie.current)==null?void 0:u.click()},children:"+ Görsel Ekle"})]}),e.jsx("div",{className:"portal-image-previews-list",children:fe.map((u,A)=>e.jsxs("div",{className:"portal-image-preview-item",children:[e.jsx("img",{src:u.url,alt:`Preview ${A+1}`,className:"portal-image-preview-thumb"}),e.jsx("button",{type:"button",className:"portal-image-remove-btn",onClick:()=>is(A),title:"Görseli Kaldır",children:e.jsx(ke,{size:14})}),e.jsx("span",{className:"portal-image-index-badge",children:A+1})]},A))})]}),oe&&oe.length>0&&e.jsxs("div",{className:"portal-typing-indicator",style:{marginTop:"8px"},children:[e.jsx("div",{className:"typing-avatars-group",children:oe.map(u=>e.jsx("img",{src:ee(u.avatar),alt:u.displayName,className:"typing-avatar",title:u.displayName},u.userId))}),e.jsx("span",{className:"typing-text",children:oe.length===1?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," yazıyor..."]}):oe.length===2?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," ve ",e.jsx("strong",{children:oe[1].displayName})," yazıyor..."]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," ve ",oe.length-1," kişi daha yazıyor..."]})})]})]}):e.jsx("div",{className:"channel-input-area",style:{padding:"0 20px 24px 20px",backgroundColor:"transparent",borderTop:"none"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--glass-bg)",padding:"12px 20px",borderRadius:"8px",border:"1px solid var(--glass-border)",backdropFilter:"blur(20px) saturate(160%)",WebkitBackdropFilter:"blur(20px) saturate(160%)",boxShadow:"var(--glass-shadow)"},children:[e.jsxs("span",{style:{color:"var(--text-secondary)",fontWeight:500,fontSize:"14px"},children:["Bu kanalda mesaj göndermek için ",g?"portala katılmalısın.":"giriş yapmalısın."]}),g?e.jsx("button",{className:"privacy-join-btn",onClick:Mt,disabled:i.isRequested,style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:i.isRequested?"İstek Gönderildi":"Portala Katıl"}):e.jsx("button",{className:"privacy-join-btn",onClick:()=>D("/login"),style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:"Giriş Yap"})]})})]})]})})}),_e&&e.jsx(Us,{members:[...i.owner?[{...i.owner,role:"owner"}]:[],...(i.admins||[]).map(u=>({...u,role:"admin"})),...i.members||[]].filter((u,A,G)=>{const $=String(u._id||u.id||u);return u&&G.findIndex(Q=>String(Q._id||Q.id||Q)===$)===A}),onClose:()=>ut(!1)})]})})()]})]}),at&&it!=="notifications"&&e.jsx(a.Suspense,{fallback:null,children:e.jsx(Fs,{portal:i,currentUser:g,initialTab:it,onClose:()=>Fe(!1),onUpdate:t=>{P(t)}})}),at&&it==="notifications"&&e.jsx("div",{className:"portal-notifications-modal",onClick:()=>Fe(!1),children:e.jsxs("div",{className:"notifications-modal-content",onClick:t=>t.stopPropagation(),children:[e.jsx("button",{className:"close-notifications-btn",onClick:()=>Fe(!1),children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsx(a.Suspense,{fallback:null,children:e.jsx(Vs,{portalId:i._id,portalChannels:i.channels||[],onUpdate:Pt})})]})}),Kt&&i&&e.jsx($s,{portal:i,onClose:()=>kt(!1),isMobile:j})]})};export{fn as default};
