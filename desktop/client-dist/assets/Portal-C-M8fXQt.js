const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PortalSettingsModal-BxT5NuZ0.js","assets/vendor-CpkDV8T3.js","assets/index-B0COkHRm.js","assets/socket-DZTJH316.js","assets/livekit-Ctw0-e6C.js","assets/lucide-BlbXcz3e.js","assets/index-BWdJ7hNB.css","assets/ImageCropper-3NIPoMFB.js","assets/ImageCropper-D3thH9n0.css","assets/PortalSettingsModal-Dd_9NXFk.css","assets/PortalNotifications-np_Awytv.js","assets/PortalNotifications-iCJNwBfZ.css","assets/VoiceChannel-B42LR_47.js","assets/VoiceChannel-DvWxzXeA.js","assets/VoiceChannel-C_zHZVsn.css","assets/ConferenceChannel-Ct4Crasr.js"])))=>i.map(i=>d[i]);
import{r as t,$ as e,Z as te,a0 as Ns,aq as ks,as as Js,a4 as Zs,ar as Xs,a5 as et,a9 as Re}from"./vendor-CpkDV8T3.js";import{d as U,h as Ss,i as Cs,e as De,c as Oe,u as st,a as ws,j as tt,b as at}from"./index-B0COkHRm.js";import{u as nt}from"./useVideoTranscoder-CiYz4jEk.js";import{P as it}from"./PostCard-Dpe-KfJS.js";import{c as rt,X as ye,U as ot,G as lt,Q as ct,m as dt,W as pt,Y as mt,q as ut,J as ht,Z as xt,_ as ft,d as gt,$ as bt,a0 as vt,a1 as yt,u as jt,a2 as kt,a3 as wt}from"./lucide-BlbXcz3e.js";import{B as _s}from"./Badge-DqTxGvEL.js";import{U as Nt}from"./UserBar-Cxo0jZi6.js";import{N as ve}from"./Navbar-B0IRVkK0.js";import{S as St}from"./SubHeader-Dpjze8UT.js";import{S as Ct}from"./SEO-DCTIT5Yd.js";import"./socket-DZTJH316.js";import"./livekit-Ctw0-e6C.js";import"./VideoDownloadModal-Dto_2Z19.js";import"./UserBadges-BkP9DgTh.js";import"./downloadHelper-Z56KqUib.js";import"./UserAvatar-IZ3ETmms.js";/* empty css                      *//* empty css                  */const _t=({portalId:a,onClose:N})=>{const[I,P]=t.useState(""),[T,m]=t.useState([]),[l,g]=t.useState(!1),[r,_]=t.useState(new Set);t.useEffect(()=>{const b=setTimeout(async()=>{if(I.trim().length===0){m([]);return}g(!0);try{const h=await te.get(`/api/users/search?q=${I}`);m(h.data)}catch{}finally{g(!1)}},500);return()=>clearTimeout(b)},[I]);const u=async c=>{var b,h;try{await Promise.all([te.post(`/api/portals/${a}/invite`,{userId:c}),te.post("/api/messages",{recipientId:c,portalId:a,content:"Seni bir portala davet ettim!"})]),_(q=>new Set(q).add(c))}catch(q){alert(((h=(b=q.response)==null?void 0:b.data)==null?void 0:h.message)||"İşlem sırasında bir hata oluştu.")}},x=()=>{const c=`${window.location.origin}/portal/${a}`;navigator.clipboard.writeText(c),alert("Davet bağlantısı kopyalandı!")};return e.jsx("div",{className:"invite-modal-overlay",onClick:N,children:e.jsxs("div",{className:"invite-modal",onClick:c=>c.stopPropagation(),children:[e.jsxs("div",{className:"invite-header",children:[e.jsx("h2",{children:"Kullanıcı Davet Et"}),e.jsxs("div",{className:"header-actions",children:[e.jsxs("button",{className:"copy-link-btn",title:"Bağlantıyı Kopyala",onClick:x,children:[e.jsx(rt,{size:20,strokeWidth:2}),e.jsx("span",{children:"Bağlantı"})]}),e.jsx("button",{className:"close-btn",onClick:N,children:e.jsx(ye,{size:24,strokeWidth:2})})]})]}),e.jsx("div",{className:"invite-search-container",children:e.jsx("input",{type:"text",className:"invite-search-input",placeholder:"Kullanıcı adı ara...",value:I,onChange:c=>P(c.target.value),autoFocus:!0})}),e.jsxs("div",{className:"invite-results custom-scrollbar",children:[l&&e.jsx("div",{className:"loading-text",children:"Aranıyor..."}),!l&&T.length===0&&I&&e.jsx("div",{className:"no-play-text",children:"Sonuç bulunamadı."}),T.map(c=>{var q;const b=c._id||c,h=r.has(b);return e.jsxs("div",{className:"invite-user-row",children:[e.jsxs("div",{className:"user-info",children:[e.jsx("img",{src:U((q=c.profile)==null?void 0:q.avatar),alt:"",className:"user-avatar"}),e.jsx("span",{className:"user-name",children:c.username})]}),e.jsx("button",{className:`invite-btn ${h?"invited":""}`,onClick:()=>!h&&u(b),disabled:h,children:h?"Gönderildi":"Davet Et"})]},b)})]})]})})},zt=({startedAt:a,style:N={},className:I=""})=>{const{roomDuration:P,roomStartTime:T}=Ss()||{},[m,l]=t.useState("00:00");t.useEffect(()=>{if(T&&a===T&&typeof P=="number"){const u=P,x=Math.floor(u/3600),c=Math.floor(u%3600/60),b=u%60;x>0?l(`${x.toString().padStart(2,"0")}:${c.toString().padStart(2,"0")}:${b.toString().padStart(2,"0")}`):l(`${c.toString().padStart(2,"0")}:${b.toString().padStart(2,"0")}`);return}if(!a){l("00:00");return}const r=()=>{const u=Date.now(),x=Math.floor((u-a)/1e3);if(x<0){l("00:00");return}const c=Math.floor(x/3600),b=Math.floor(x%3600/60),h=x%60;c>0?l(`${c.toString().padStart(2,"0")}:${b.toString().padStart(2,"0")}:${h.toString().padStart(2,"0")}`):l(`${b.toString().padStart(2,"0")}:${h.toString().padStart(2,"0")}`)};r();const _=setInterval(r,1e3);return()=>clearInterval(_)},[a,T,P]);const g={display:"flex",alignItems:"center",fontSize:"15px",fontWeight:"800",color:"#39FF14",background:"transparent",border:"none",padding:"0 4px"};return e.jsx("div",{style:{...g,...N},className:I,children:m})},It=({portal:a,onClose:N,isMobile:I})=>{var h,q;const[P,T]=t.useState(0),[m,l]=t.useState(!1),g=t.useRef(0),r=t.useRef(0);if(!a)return null;const _=D=>{g.current=D.touches[0].clientY,r.current=D.touches[0].clientY,l(!0)},u=D=>{if(!m)return;const ie=D.touches[0].clientY;r.current=ie;const i=ie-g.current;i>0?T(i):T(0)},x=()=>{if(!m)return;l(!1),r.current-g.current>100&&N(),T(0)},c=new Date(a.createdAt).toLocaleDateString("tr-TR",{year:"numeric",month:"long",day:"numeric"}),b=e.jsxs("div",{className:"portal-info-container",children:[e.jsxs("div",{className:"portal-info-banner",children:[e.jsx("img",{src:a.coverImage?U(a.coverImage):a.banner?U(a.banner):"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",alt:a.name}),e.jsx("div",{className:"portal-info-avatar-wrapper",children:e.jsx("img",{src:U(a.avatar),alt:a.name,className:"portal-info-avatar-img"})}),e.jsx("button",{className:"portal-info-close",onClick:N,children:e.jsx(ye,{size:20})})]}),e.jsxs("div",{className:"portal-info-content",children:[e.jsxs("div",{className:"portal-info-header",children:[e.jsxs("h1",{children:[a.name,e.jsx(_s,{type:a.isVerified?"verified":(h=a.badges)==null?void 0:h[0],size:20})]}),e.jsx("p",{className:"portal-info-tagline",children:a.description||"Bu portal için bir açıklama bulunmuyor."})]}),e.jsxs("div",{className:"portal-info-stats-grid",children:[e.jsxs("div",{className:"portal-info-stat-card",children:[e.jsx(ot,{size:18,className:"stat-icon"}),e.jsxs("div",{className:"stat-data",children:[e.jsx("span",{className:"stat-value",children:a.membersCount||((q=a.members)==null?void 0:q.length)||0}),e.jsx("span",{className:"stat-label",children:"Üye"})]})]}),e.jsxs("div",{className:"portal-info-stat-card",children:[e.jsx(lt,{size:18,className:"stat-icon"}),e.jsxs("div",{className:"stat-data",children:[e.jsx("span",{className:"stat-value",children:"Kamu"}),e.jsx("span",{className:"stat-label",children:"Görünürlük"})]})]})]}),e.jsxs("div",{className:"portal-info-details",children:[e.jsxs("div",{className:"detail-item",children:[e.jsx(ct,{size:18}),e.jsxs("span",{children:["Oluşturulma: ",e.jsx("strong",{children:c})]})]}),e.jsxs("div",{className:"detail-item",children:[e.jsx(dt,{size:18}),e.jsx("span",{children:"Doğrulanmış Portal"})]}),e.jsxs("div",{className:"detail-item",children:[e.jsx(pt,{size:18}),e.jsxs("span",{children:["Kategori: ",e.jsx("strong",{children:a.category||"Genel"})]})]})]})]})]});return I?e.jsx("div",{className:"bottom-sheet-overlay",onClick:N,children:e.jsxs("div",{className:"bottom-sheet-content",onClick:D=>D.stopPropagation(),style:{transform:P>0?`translateY(${P}px)`:void 0,transition:m?"none":"transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"},children:[e.jsx("div",{className:"bottom-sheet-handle-wrapper",onTouchStart:_,onTouchMove:u,onTouchEnd:x,children:e.jsx("div",{className:"bottom-sheet-handle"})}),b]})}):e.jsx("div",{className:"portal-info-modal-overlay",onClick:N,children:e.jsx("div",{className:"portal-info-modal-card",onClick:D=>D.stopPropagation(),children:b})})},Pt=({portal:a,isMember:N,onEdit:I,currentChannel:P,onChangeChannel:T,className:m,canManage:l,onShowPortalInfo:g})=>{var ue,oe;const[r,_]=t.useState(!1);Ns();const u=Cs(),{isMobileView:x}=u||{},c=(u==null?void 0:u.isDesktopSidebarCollapsed)||!1,b=(u==null?void 0:u.setIsDesktopSidebarCollapsed)||(()=>{}),h=De(d=>d.unreadPostsByChannel),q=De(d=>d.clearUnreadForChannel),{roomStartTime:D,activeRoom:ie}=Ss(),{socket:i,onlineUsers:ae}=Oe(),G=((a==null?void 0:a.members)||[]).filter(d=>{const S=d._id||d.id||d;return ae.includes(String(S))}).length;if(t.useEffect(()=>{P&&(a!=null&&a._id)&&q(P,a._id)},[P,a==null?void 0:a._id,q]),!a)return null;const R=a!=null&&a.channels?[...a.channels].sort((d,S)=>(d.order||0)-(S.order||0)).map(d=>({id:d._id,name:d.name,type:d.type||"text"})):[],Z=R.find(d=>d.id===P),re=(Z==null?void 0:Z.type)==="voice"||(Z==null?void 0:Z.type)==="conference";t.useEffect(()=>{!re&&c&&b(!1)},[re,c,b]);const me=d=>P===d;return e.jsxs("div",{className:`channel-sidebar ${c?"collapsed":""} ${m||""}`,style:{height:"calc(100% - 24px)",backgroundColor:"transparent",display:"flex",flexDirection:"column",flexShrink:0,overflow:"visible",position:"relative",borderRight:"none"},children:[!x&&re&&e.jsx("button",{className:"sidebar-toggle-btn",onClick:d=>{d.stopPropagation(),b(!c)},title:c?"Menüyü Göster":"Menüyü Gizle",children:c?e.jsx(mt,{size:16}):e.jsx(ut,{size:16})}),e.jsxs("div",{className:"sidebar-content-wrapper",style:{display:"flex",flexDirection:"column",flex:1,width:"100%",height:"100%",overflow:"hidden",transition:"opacity 0.2s ease, visibility 0.2s ease",opacity:c?0:1,visibility:c?"hidden":"visible",gap:"8px",padding:"8px",boxSizing:"border-box"},children:[e.jsxs("div",{className:"cs-panel cs-panel--banner",children:[e.jsxs("div",{className:"channel-banner-container",onClick:()=>g&&g(),children:[e.jsx("div",{className:"channel-banner-image",style:{backgroundImage:a.coverImage?`url(${U(a.coverImage)})`:a.banner?`url(${U(a.banner)})`:'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")'}}),e.jsx("div",{className:"channel-banner-overlay"})]}),e.jsxs("div",{className:"portal-quick-info",children:[e.jsxs("div",{className:"portal-info-main",onClick:()=>g&&g(),children:[e.jsxs("h2",{className:"portal-title-text",children:[a.name,e.jsx(_s,{type:a.isVerified?"verified":(ue=a.badges)==null?void 0:ue[0],size:16})]}),e.jsxs("div",{className:"portal-stats-row",children:[e.jsxs("div",{className:"stat-item",children:[e.jsx(ht,{size:12}),e.jsxs("span",{children:[a.membersCount||((oe=a.members)==null?void 0:oe.length)||0," Üye"]})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:"stat-item",children:[e.jsx("div",{className:"online-indicator-dot"}),e.jsxs("span",{children:[G," Çevrimiçi"]})]})]})]}),e.jsxs("div",{className:"portal-header-actions",children:[(N||l)&&e.jsx("button",{className:"portal-action-btn-circle",onClick:d=>{d.stopPropagation(),I&&I("notifications")},title:"Bildirim Ayarları",children:e.jsx(xt,{size:16})}),N&&e.jsx("button",{className:"portal-action-btn-circle",onClick:d=>{d.stopPropagation(),_(!0)},title:"Davet Et",children:e.jsx(ft,{size:18})})]})]})]}),e.jsxs("div",{className:"cs-panel cs-panel--channels custom-scrollbar",children:[e.jsxs("div",{className:"cs-channels-header",children:[e.jsx("span",{children:"Kanallar"}),l&&e.jsx("div",{onClick:d=>{d.stopPropagation(),I&&I("channels")},className:"cs-add-channel-btn",title:"Kanal Oluştur",children:"+"})]}),e.jsx("div",{className:"cs-channel-list",children:R.map(d=>{var le;const S=me(d.id),Me=d.type==="announcement"||d.name.includes("announcements"),ne=d.type==="voice";return e.jsxs("div",{className:`channel-item ${S?"active":""}`,onClick:()=>T(d.id),style:{padding:"6px 8px",margin:"2px 0",borderRadius:"4px",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",color:S?"white":"#949ba4",backgroundColor:S?"#3f4147":"transparent",transition:"all 0.1s"},children:[e.jsx("div",{style:{color:S?"white":"var(--text-secondary)",display:"flex",alignItems:"center",minWidth:"20px",justifyContent:"center"},children:ne?e.jsx(gt,{size:20,strokeWidth:2}):Me?e.jsx(bt,{size:20,strokeWidth:2.5}):d.type==="image"?e.jsx(vt,{size:20,strokeWidth:2.5,style:{color:"#f59e0b"}}):e.jsx(yt,{size:20,strokeWidth:2.5})}),e.jsx("span",{style:{fontWeight:S?600:500,fontSize:"16px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:S?"white":"var(--text-primary)",maxWidth:"fit-content"},children:d.name}),!S&&((le=h[d.id])==null?void 0:le.length)>0&&e.jsx("div",{style:{backgroundColor:"#f23f43",color:"white",fontSize:"11px",fontWeight:"bold",padding:"0 6px",borderRadius:"8px",minWidth:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.3)",marginLeft:"-4px",flexShrink:0},children:h[d.id].length>9?"9+":h[d.id].length}),e.jsx("div",{style:{flex:1}}),S&&ne&&ie&&String(ie.channelId)===String(d.id)&&D&&e.jsx("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:e.jsx(zt,{startedAt:D,className:"vc-sidebar-timer"})})]},d.id)})})]}),e.jsxs("div",{className:"cs-panel cs-panel--userbar",children:[e.jsx(Nt,{currentChannelId:P}),e.jsx("div",{className:"cs-footer-copyright",children:"© 2026 Oxypace. Tüm hakları saklıdır."})]})]}),e.jsx("style",{children:`
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
            `}),r&&e.jsx(_t,{portalId:a._id,onClose:()=>_(!1)})]})},Tt=({members:a=[],onClose:N})=>{const{onlineUsers:I}=Oe(),P=l=>{if(!l)return"";const g=new Date,r=new Date(l),_=Math.max(0,g-r),u=Math.floor(_/6e4);if(u<1)return"şimdi";if(u<60)return`${u}m`;const x=Math.floor(u/60);if(x<24)return`${x}h`;const c=Math.floor(x/24);if(c<30)return`${c}d`;const b=Math.floor(c/30);return b<12?`${b}mo`:`${Math.floor(b/12)}y`},T=a.filter(l=>{const g=l._id||l.id||l;return I.includes(g)}),m=a.filter(l=>{const g=l._id||l.id||l;return!I.includes(g)});return e.jsxs("div",{className:"members-sidebar custom-scrollbar",children:[e.jsxs("div",{className:"members-header-top",children:[e.jsx("h3",{children:"ÜYELER"}),N&&e.jsx("button",{onClick:N,className:"close-members-btn","aria-label":"Kapat",children:e.jsx(ye,{size:20,strokeWidth:2})})]}),e.jsxs("div",{className:"members-category",children:["Çevrim içi — ",T.length]}),T.map((l,g)=>{var u,x,c;if(!l||typeof l=="string")return null;const r=l.username||"Unknown",_=l.avatar||((u=l.profile)==null?void 0:u.avatar);return e.jsxs(ks,{to:`/profile/${r}`,className:"member-item member-link",children:[e.jsxs("div",{className:"member-avatar-wrapper",children:[_?e.jsx("img",{src:U(_),alt:"",className:"member-avatar"}):e.jsx("div",{className:"member-avatar-placeholder",children:((x=r[0])==null?void 0:x.toUpperCase())||"?"}),e.jsx("div",{className:"status-indicator online"})]}),e.jsxs("div",{className:"member-info",children:[e.jsxs("span",{className:"member-name active-role",style:{color:"#2ecc71"},children:[((c=l.profile)==null?void 0:c.displayName)||r,(l.role==="owner"||l.isAdmin)&&e.jsx("span",{style:{marginLeft:"4px"},children:"👑"})]}),e.jsx("div",{className:"member-custom-status",children:e.jsx("span",{role:"img","aria-label":"activity",children:"🎮"})})]})]},l._id||l.id||g)}),e.jsxs("div",{className:"members-category",children:["Çevrim dışı — ",m.length]}),m.map((l,g)=>{var u,x,c;if(!l||typeof l=="string")return null;const r=l.username||"Unknown",_=l.avatar||((u=l.profile)==null?void 0:u.avatar);return e.jsxs(ks,{to:`/profile/${r}`,className:"member-item offline member-link",children:[e.jsx("div",{className:"member-avatar-wrapper",children:_?e.jsx("img",{src:U(_),alt:"",className:"member-avatar"}):e.jsx("div",{className:"member-avatar-placeholder",style:{backgroundColor:"var(--bg-secondary)"},children:((x=r[0])==null?void 0:x.toUpperCase())||"?"})}),e.jsx("div",{className:"member-info",style:{flex:1},children:e.jsxs("div",{className:"member-name-row",style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx("span",{className:"member-name",children:((c=l.profile)==null?void 0:c.displayName)||r}),l.lastActive&&e.jsx("span",{className:"last-active-time",style:{fontSize:"11px",color:"var(--text-muted)"},children:P(l.lastActive)})]})})]},l._id||l.id||`offline-${g}`)}),e.jsx("style",{children:`
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
            `})]})},Dt=({alerts:a=[]})=>{const[N,I]=t.useState(()=>{try{const r=sessionStorage.getItem("dismissed_portal_alerts");return r?JSON.parse(r):[]}catch{return[]}}),[P,T]=t.useState(null),m=a.filter(r=>!N.includes(r._id)),l=r=>{T(r),setTimeout(()=>{const _=[...N,r];I(_);try{sessionStorage.setItem("dismissed_portal_alerts",JSON.stringify(_))}catch{}T(null)},300)},g=r=>{const _=new Date,x=new Date(r)-_;if(x<=0)return null;const c=Math.floor(x/(1e3*60*60*24)),b=Math.floor(x/(1e3*60*60)%24),h=Math.floor(x/(1e3*60)%60);return c>0?`${c} gün ${b} saat kaldı`:b>0?`${b} saat ${h} dk kaldı`:`${h} dakika kaldı`};return m.length===0?null:e.jsx(e.Fragment,{children:m.map(r=>e.jsx("div",{className:`portal-alert-banner ${P===r._id?"dismissing":""}`,children:e.jsxs("div",{className:"alert-banner-inner",children:[e.jsx("div",{className:"alert-banner-icon",children:e.jsx(jt,{size:18,strokeWidth:2})}),e.jsxs("div",{className:"alert-banner-content",children:[e.jsx("div",{className:"alert-banner-label",children:e.jsx("span",{children:"Yönetici Uyarısı"})}),e.jsx("div",{className:"alert-banner-message",children:r.message}),e.jsx("div",{className:"alert-banner-meta",children:e.jsxs("span",{className:"alert-banner-time",children:[e.jsx(kt,{size:16,strokeWidth:2}),g(r.expiresAt)||"Süresi dolmak üzere"]})})]}),e.jsx("button",{className:"alert-banner-close",onClick:()=>l(r._id),title:"Uyarıyı gizle",children:e.jsx(ye,{size:16,strokeWidth:2.5})})]})},r._id))})},Rt=t.lazy(()=>Re(()=>import("./PortalSettingsModal-BxT5NuZ0.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9]))),Mt=t.lazy(()=>Re(()=>import("./PortalNotifications-np_Awytv.js"),__vite__mapDeps([10,1,2,3,4,5,6,11]))),$t=t.lazy(()=>Re(()=>import("./VoiceChannel-B42LR_47.js"),__vite__mapDeps([12,1,4,2,3,5,6,13,14]))),Et=t.lazy(()=>Re(()=>import("./ConferenceChannel-Ct4Crasr.js"),__vite__mapDeps([15,1,4,2,3,5,6,13,14]))),ra=()=>{var vs,ys;const{id:a}=Js(),N=Zs(),[I]=Xs(),P=I.get("channel"),T=I.get("post"),{user:m,updateUser:l,loading:g}=st(),{socket:r,connected:_}=Oe(),u=Ns(),x=Cs(),{isSidebarOpen:c,closeSidebar:b,isMobileView:h,mobileChannelOpen:q,setMobileChannelOpen:D}=x||{},ie=(x==null?void 0:x.isDesktopSidebarCollapsed)||!1,[i,ae]=t.useState(null),G=De(s=>s.posts),R=De(s=>s.setPosts),[Z,re]=t.useState(!0),[me,ue]=t.useState(!1),[oe,d]=t.useState(""),[S,Me]=t.useState(null),[ne,le]=t.useState(null),[$e,Qe]=t.useState(!1),[M,ce]=t.useState(null),[Je,zs]=t.useState(!1),[X,Ee]=t.useState(""),[Q,Ze]=t.useState([]);t.useRef(null);const[he,qe]=t.useState(!1),[xe,Xe]=t.useState(!1),[de,es]=t.useState({show:!1,message:"",type:"info"}),[Is,Ps]=t.useState(!1),[fe,K]=t.useState(!1),[ss,Ts]=t.useState({top:0,left:0}),[Ae,ts]=t.useState(""),[as,je]=t.useState(!1),ns=t.useRef(null),is=t.useRef(null),rs=t.useRef(null),os=t.useRef(null),[C,ge]=t.useState(null),[E,ke]=t.useState(null),[Ds,we]=t.useState(0),[ls,Be]=t.useState(!1),Ue=t.useRef(!1);nt();const ee=ws(s=>s.activeUploads)[`portal-${a}`];t.useEffect(()=>{ee&&ee.status==="uploading"&&R(s=>s.map(n=>n.isOptimistic&&n.mediaType==="video"?{...n,uploadProgress:ee.progress}:n))},[ee==null?void 0:ee.progress,ee==null?void 0:ee.status]);const[Rs,cs]=t.useState(!1),Ms=t.useRef(null),Le=t.useRef(null),$s=t.useCallback(s=>{s.preventDefault(),s.stopPropagation(),K(n=>{if(!n&&Le.current){const o=Le.current.getBoundingClientRect();Ts({top:o.bottom+8,left:o.left})}return!n})},[]);t.useEffect(()=>{if(!fe)return;let s=!0;const n=v=>{if(!s)return;const p=v.target.closest(".plus-menu")||v.target.closest(".portal-plus-menu-portal"),y=v.target.closest(".upload-btn");!p&&!y&&K(!1)},o=setTimeout(()=>{s&&(document.addEventListener("click",n),document.addEventListener("touchstart",n))},0);return()=>{s=!1,clearTimeout(o),document.removeEventListener("click",n),document.removeEventListener("touchstart",n)}},[fe]),t.useEffect(()=>()=>{K(!1)},[]),t.useEffect(()=>{K(!1)},[M,a]),t.useEffect(()=>{var s;(s=N.state)!=null&&s.quotedPost&&(ke(N.state.quotedPost),N.state.selectedChannelId&&ce(N.state.selectedChannelId),u(N.pathname+N.search,{replace:!0,state:{}}))},[N.state,a]);const L=(vs=i==null?void 0:i.channels)==null?void 0:vs.find(s=>s._id===M),Ne=(L==null?void 0:L.type)==="image",Es=((L==null?void 0:L.type)==="voice"||(L==null?void 0:L.type)==="conference")&&(!h||q);t.useEffect(()=>{if(!r||!_||!a)return;r.emit("join_portal",a),M&&r.emit("join_channel",M);const s=p=>{var j,z;const y=((j=p.portal)==null?void 0:j._id)||p.portal,k=((z=p.channel)==null?void 0:z._id)||p.channel,w=String(y)===String(a),A=String(k)===String(M);w&&A&&R(W=>{if(W.some($=>$._id===p._id))return W;const H=p.quotedPost&&(typeof p.quotedPost=="string"?p.quotedPost:p.quotedPost._id);if(H){const $=W.find(V=>V._id===H);$&&typeof $=="object"&&$.author?p.quotedPost=$:E&&H===E._id&&(p.quotedPost=E)}return[p,...W]})},n=p=>{var w;const y=((w=p.portal)==null?void 0:w._id)||p.portal;String(y)===String(a)&&R(A=>A.map(j=>j._id===p._id?p:j))},o=({userId:p,status:y,lastActive:k})=>{y==="offline"&&Ze(w=>w.filter(A=>String(A.userId)!==String(p))),ae(w=>{if(!w||!w.members)return w;const A=w.members.map(j=>{const z=j._id||j.id||j;return String(z)===String(p)&&typeof j=="object"&&j!==null?{...j,lastActive:k||new Date}:j});return{...w,members:A}})},v=({userId:p,username:y,displayName:k,avatar:w,isTyping:A})=>{String(p)!==String(m==null?void 0:m._id)&&Ze(j=>A?j.some(z=>String(z.userId)===String(p))?j:[...j,{userId:p,username:y,displayName:k,avatar:w}]:j.filter(z=>String(z.userId)!==String(p)))};return r.on("post:created",s),r.on("post:updated",n),r.on("user_status_change",o),r.on("portal_typing_update",v),()=>{r.off("post:created",s),r.off("post:updated",n),r.off("user_status_change",o),r.off("portal_typing_update",v)}},[r,_,a,M,m==null?void 0:m._id]);const qs=s=>{if(!s)return null;const n=/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,o=s.match(n);return o&&o[2].length===11?o[2]:null},As=s=>{const n=s.target.value;ts(n)},ds=()=>{const s=qs(Ae);if(!s){J("Geçersiz YouTube URL'si","error");return}ge({name:"YouTube Video",type:"youtube",preview:`https://img.youtube.com/vi/${s}/hqdefault.jpg`,url:Ae}),je(!1),ts("")},[Bs,Se]=t.useState(!1),[Us,Ls]=t.useState(0),Ce=t.useRef(null),Ws=s=>{const n=s.target;n.scrollTop>300?Se(!0):Se(!1);const o=n.scrollHeight-n.clientHeight,v=o>0?n.scrollTop/o*100:0;Ls(v)},Vs=()=>{Ce.current&&Ce.current.scrollTo({top:0,behavior:"smooth"})},Fs=s=>{ce(s),Se(!1),h&&(b(),D(!0))},J=t.useCallback((s,n="info")=>{es({show:!0,message:s,type:n}),setTimeout(()=>es(o=>({...o,show:!1})),4e3)},[]),_e=s=>{const n=s.target.files[0];if(n){if(n.size>2*1024*1024*1024){J("Dosya boyutu 2 GB'dan büyük olamaz.","error");return}ge(n),Ue.current=n.type.startsWith("video/")||["mp4","webm","ogg","mov","m4v"].includes(n.name.split(".").pop().toLowerCase()),K(!1)}};t.useEffect(()=>{!r||!a||(X.trim().length>0||C!==null?he||(qe(!0),r.emit("portal_typing",{portalId:a,isTyping:!0})):he&&(r.emit("portal_typing",{portalId:a,isTyping:!1}),qe(!1)))},[X,C,a,r,he]),t.useEffect(()=>()=>{r&&a&&he&&r.emit("portal_typing",{portalId:a,isTyping:!1})},[a,r,he]);const ps=async()=>{var p,y;if(!X.trim()&&!C)return;r&&a&&r.emit("portal_typing",{portalId:a,isTyping:!1}),qe(!1);const s={content:X,media:C},n=C&&C.type==="youtube",o=`temp-${Date.now()}`,v={_id:o,content:X,media:n?C.url:C?URL.createObjectURL(C):null,mediaType:n?"youtube":C?C.type.startsWith("video")?"video":"image":null,author:m,createdAt:new Date().toISOString(),likes:[],likeCount:0,isOptimistic:!0,quotedPost:E};R(k=>[v,...k]),Ee(""),ge(null),K(!1),Be(!0),we(0);try{let k=null,w=null,A=null,j=null;if(n)w=s.media.url,A="youtube";else if(s.media)if(Ue.current){ws.getState().startVideoUpload({file:s.media,portalId:a,channel:M,content:s.content,quotedPostId:E==null?void 0:E._id,onFinish:($,V)=>{if($)R(F=>F.filter(B=>String(B._id)!==String(o))),J("Video yükleme başarısız oldu.","error");else if(V){const F=String(o);R(B=>{const O=String(V._id);return B.some(Y=>String(Y._id)===O)?B.filter(Y=>String(Y._id)!==F):B.map(Y=>{if(String(Y._id)===F){const se=V,f=se.quotedPost&&(typeof se.quotedPost=="string"?se.quotedPost:se.quotedPost._id);return f&&Y.quotedPost&&f===Y.quotedPost._id&&(se.quotedPost=Y.quotedPost),se}return Y})})}}}),Be(!1),ke(null);return}else k=await at(s.media,"post",a,$=>{we($),R(V=>V.map(F=>String(F._id)===String(o)?{...F,uploadProgress:$}:F))});else we(100);const z={content:s.content,portalId:a,channel:M,quotedPostId:E==null?void 0:E._id};k?(z.mediaKey=k,Ue.current?z.mediaType="video":s.media&&(s.media.type==="application/pdf"||s.media.name.toLowerCase().endsWith(".pdf"))&&(z.pdfName=s.media.name,z.pdfSize=s.media.size)):w&&(z.media=w,z.mediaType=A);const W=await te.post("/api/posts",z);ke(null);const H=String(o);R($=>{const V=String(W.data._id);return $.some(B=>String(B._id)===V)?$.filter(B=>String(B._id)!==H):$.map(B=>{if(String(B._id)===H){const O=W.data,pe=O.quotedPost&&(typeof O.quotedPost=="string"?O.quotedPost:O.quotedPost._id);return pe&&B.quotedPost&&pe===B.quotedPost._id&&(O.quotedPost=B.quotedPost),O}return B})})}catch(k){const w=((y=(p=k.response)==null?void 0:p.data)==null?void 0:y.message)||k.message;J(w,"error"),R(A=>A.filter(j=>String(j._id)!==String(o))),Ee(s.content),ge(s.media)}finally{Be(!1),we(0)}},[We,ze]=t.useState(!1),[Ve,Ys]=t.useState("overview"),[Bt,Ut]=t.useState(!1),[Lt,Gs]=t.useState({name:"",description:"",privacy:"public"});t.useRef(null),t.useRef(null),t.useEffect(()=>{a&&!g&&ms()},[a,g]),t.useEffect(()=>{if(!g&&i&&i.channels&&i.channels.length>0)if(M){if(!i.channels.some(n=>String(n._id)===String(M))){const n=i.channels.find(o=>o.name==="genel"||o.name==="general")||i.channels[0];n&&ce(n._id)}}else{if(P){const n=i.channels.find(o=>String(o._id)===String(P));if(n){ce(n._id);return}}const s=i.channels.find(n=>n.name==="genel"||n.name==="general")||i.channels[0];s&&ce(s._id)}},[i,g]),t.useLayoutEffect(()=>(D&&D(!1),()=>{D&&D(!1)}),[a,D]),t.useEffect(()=>{a&&M&&i&&Ke(i._id,a)&&Pe()},[a,M,i==null?void 0:i._id]),t.useEffect(()=>{if(T&&!Je&&!me&&Array.isArray(G)&&G.length>0){const s=document.getElementById(`post-${T}`);s&&setTimeout(()=>{s.scrollIntoView({behavior:"smooth",block:"center"}),s.classList.add("highlight-post"),setTimeout(()=>s.classList.remove("highlight-post"),2e3),zs(!0)},100)}},[T,G,me,Je]),t.useEffect(()=>{var s,n;if(i&&m){const o=((s=i.members)==null?void 0:s.includes(m._id))||((n=m.joinedPortals)==null?void 0:n.some(v=>v._id===i._id||v===i._id));Qe(!!o)}},[i,m]);const ms=async()=>{(!i||i._id!==a)&&(re(!0),Se(!1));try{const s=await te.get(`/api/portals/${a}`);ae(s.data),Gs({name:s.data.name,description:s.data.description||"",privacy:s.data.privacy||"public"})}catch(s){if(s.response&&s.response.status===403){const n=s.response.data;n.portalStatus==="suspended"||n.portalStatus==="closed"?(Me({portalStatus:n.portalStatus,statusReason:n.statusReason,suspendedUntil:n.suspendedUntil,portalName:n.portalName,portalAvatar:n.portalAvatar}),d("suspended")):d("blocked")}else s.response&&s.response.status===404?d("blocked"):d("Portal yüklenemedi")}finally{re(!1)}},Ie=t.useRef(null),us=t.useRef(G);us.current=G;const Fe=t.useRef(M);Fe.current=M;const Pe=t.useCallback(async(s=!1)=>{var n,o;s?xs(!0):(Ie.current&&Ie.current.abort(),Ie.current=new AbortController,ue(!0),R([]),Ye(!0));try{const v=localStorage.getItem("token"),p={signal:(n=Ie.current)==null?void 0:n.signal,...v&&{headers:{Authorization:`Bearer ${v}`}}},y=Fe.current;if(s&&y!==Fe.current)return;let k=`/api/portals/${a}/posts?channel=${y}&limit=10`;const w=us.current;if(s&&w.length>0){const z=w[w.length-1];k+=`&before=${z.createdAt}`}const j=(await te.get(k,p)).data;j.length<10&&Ye(!1),R(s?z=>{const W=new Set(z.map($=>$._id)),H=j.filter($=>!W.has($._id));return[...z,...H]}:j),d("")}catch(v){if(te.isCancel(v))return;((o=v.response)==null?void 0:o.status)===403?d("private"):d("Gönderiler yüklenemedi")}finally{s||ue(!1),xs(!1),re(!1)}},[a]),[hs,Ye]=t.useState(!0),[Ge,xs]=t.useState(!1),Te=t.useRef(),Ks=t.useCallback(s=>{Ge||(Te.current&&Te.current.disconnect(),Te.current=new IntersectionObserver(n=>{n[0].isIntersecting&&hs&&Pe(!0)},{root:Ce.current,rootMargin:"200px"}),s&&Te.current.observe(s))},[Ge,hs,Pe]);t.useEffect(()=>{R([]),Ye(!0),ce(null),ae(null),d(""),D(!1)},[a]);const Hs=t.useCallback(s=>{R(n=>n.filter(o=>String(o._id)!==String(s)))},[R]),Os=t.useCallback((s,n)=>{n&&R(o=>o.filter(v=>String(v._id)!==String(s)))},[R]),Qs=t.useCallback(async s=>{try{const o=(await te.put(`/api/posts/${s}/pin`)).data;R(v=>v.map(y=>y._id===s?o:y).sort((y,k)=>y.isPinned===k.isPinned?new Date(k.createdAt)-new Date(y.createdAt):y.isPinned?-1:1))}catch{J("Sabitleme işlemi başarısız","error")}},[R,J]),fs=async()=>{var s,n;if(!m){J("Lütfen giriş yapın veya kaydolun!","warning");return}try{const o=localStorage.getItem("token"),v=o?{headers:{Authorization:`Bearer ${o}`}}:{};if((await te.post(`/api/portals/${a}/join`,{},v)).data.status==="joined"){Qe(!0);const y={...m,joinedPortals:[...m.joinedPortals||[],i]};l(y),ae(k=>({...k,members:[...k.members||[],m._id]})),Pe(),J("Portala başarıyla katıldınız!","success")}else J("Üyelik isteğiniz gönderildi!","info"),ae(y=>({...y,isRequested:!0}))}catch(o){J(((n=(s=o.response)==null?void 0:s.data)==null?void 0:n.message)||"Katılma başarısız","error")}},Ke=(s,n)=>{if(!s||!n)return!1;const o=typeof s=="object"?s.toString():s,v=typeof n=="object"?n.toString():n;return o===v},gs=m&&i&&i.owner&&Ke(i.owner._id||i.owner,m._id),bs=gs||m&&i&&i.admins&&i.admins.some(s=>Ke(s._id||s,m._id));if(t.useEffect(()=>{if(!(S!=null&&S.suspendedUntil)){le(null);return}const s=()=>{const o=new Date,p=new Date(S.suspendedUntil)-o;if(p<=0){le(null),window.location.reload();return}le({days:Math.floor(p/(1e3*60*60*24)),hours:Math.floor(p/(1e3*60*60)%24),minutes:Math.floor(p/(1e3*60)%60),seconds:Math.floor(p/1e3%60)})};s();const n=setInterval(s,1e3);return()=>clearInterval(n)},[S]),oe==="suspended"&&S){const s=S.portalStatus==="suspended",n=S.suspendedUntil?new Date(S.suspendedUntil).toLocaleString("tr-TR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):null;return e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(ve,{}),e.jsx("div",{className:"suspension-screen",children:e.jsxs("div",{className:"suspension-card",children:[e.jsx("div",{className:"suspension-icon",children:s?"⏸️":"🔒"}),e.jsx("h1",{className:"suspension-title",children:S.portalName||"Portal"}),e.jsx("h2",{className:"suspension-subtitle",children:s?"Bu portal geçici olarak askıya alındı":"Bu portal kapatılmıştır"}),S.statusReason&&e.jsxs("div",{className:"suspension-reason",children:[e.jsx("div",{className:"suspension-reason-label",children:"Sebep"}),e.jsx("p",{children:S.statusReason})]}),s&&n&&e.jsxs("div",{className:"suspension-unlock",children:[e.jsx("div",{className:"suspension-unlock-label",children:"🔓 Erişim Açılma Tarihi"}),e.jsx("div",{className:"suspension-unlock-date",children:n}),ne&&e.jsxs("div",{className:"suspension-countdown",children:[e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(ne.days).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Gün"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(ne.hours).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saat"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(ne.minutes).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Dakika"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(ne.seconds).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saniye"})]})]})]}),e.jsxs("div",{className:"suspension-policy",children:[e.jsx("span",{children:"📋"}),e.jsxs("p",{children:["Askıya alma nedenleri, platformun ",e.jsx("strong",{children:"Politika ve Koşullar"}),"'ı kapsamında değerlendirilmektedir. Detaylı bilgi için kurallarımızı inceleyebilirsiniz."]})]}),e.jsx("button",{onClick:()=>u("/"),className:"suspension-home-btn",children:"Anasayfaya Dön"})]})})]})}return oe==="blocked"?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(ve,{}),e.jsxs("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center",flexDirection:"column",color:"var(--text-muted)"},children:[e.jsx("div",{style:{fontSize:"3rem",marginBottom:"1rem"},children:"🚫"}),e.jsx("h2",{children:"Sonuç Bulunamadı"}),e.jsx("p",{children:"Aradığınız portala ulaşılamıyor."}),e.jsx("button",{onClick:()=>u("/"),className:"btn-save",style:{marginTop:"20px",float:"none"},children:"Anasayfaya Dön"})]})]}):Z||g||!i?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(ve,{}),e.jsx("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center"},children:e.jsx("div",{className:"spinner"})})]}):i.isNSFW&&!Is&&!sessionStorage.getItem(`nsfw_confirmed_${a}`)?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(ve,{}),e.jsx("div",{className:"nsfw-gate-overlay",children:e.jsxs("div",{className:"nsfw-gate-card",children:[e.jsx("div",{className:"nsfw-gate-icon",children:e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]})}),e.jsx("div",{className:"nsfw-gate-badge",children:"+18"}),e.jsx("h1",{className:"nsfw-gate-title",children:"Yaş Kısıtlaması"}),e.jsxs("p",{className:"nsfw-gate-desc",children:[e.jsx("strong",{children:i.name})," portalı yetişkin içerik barındırabilir. Bu portala erişmek için 18 yaşından büyük olmanız gerekmektedir."]}),e.jsxs("div",{className:"nsfw-gate-actions",children:[e.jsx("button",{className:"nsfw-gate-confirm",onClick:()=>{sessionStorage.setItem(`nsfw_confirmed_${a}`,"true"),Ps(!0)},children:"18 yaşından büyüğüm, devam et"}),e.jsx("button",{className:"nsfw-gate-cancel",onClick:()=>u(-1),children:"Geri Dön"})]}),e.jsx("p",{className:"nsfw-gate-legal",children:"Devam ederek, yaşınızın 18'den büyük olduğunu ve yetişkin içerikle ilgili yasal sorumluluğu kabul ettiğinizi onaylarsınız."})]})})]}):e.jsxs("div",{className:`app-wrapper full-height discord-layout ${Es?"voice-channel-active":""}`,children:[e.jsx(Ct,{title:i.name,description:i.description||`${i.name} topluluğuna katılın.`,image:U(i.avatar),type:"website",schema:{"@context":"https://schema.org","@type":"Community",name:i.name,description:i.description,url:window.location.href,memberCount:((ys=i.members)==null?void 0:ys.length)||0}}),!We&&e.jsx(ve,{}),de.show&&e.jsxs("div",{className:`app-toast ${de.type}`,children:[e.jsx("span",{className:"app-toast-icon",children:de.type==="error"?"🚫":de.type==="success"?"✅":de.type==="warning"?"⚠️":"ℹ️"}),de.message]}),e.jsxs("div",{className:`discord-split-view ${h&&q?"mobile-feed-active":""} ${ie?"sidebar-collapsed":""}`,children:[m&&e.jsx(Pt,{portal:i,isMember:$e,canManage:gs||bs,onEdit:s=>{Ys(typeof s=="string"?s:"overview"),ze(!0)},currentChannel:M,onChangeChannel:Fs,className:`${c?"mobile-open":""} ${h&&q?"mobile-hidden":""}`,onShowPortalInfo:()=>cs(!0)}),e.jsxs("main",{className:`discord-main-content ${h&&!q?"mobile-content-hidden":""}`,children:[h&&!q&&e.jsx(St,{title:(i==null?void 0:i.name)||"Portal",showBack:!1}),(()=>{var p,y,k,w,A,j,z,W,H,$,V,F,B,O,pe,Y,se;const s=(p=i==null?void 0:i.channels)==null?void 0:p.find(f=>f._id===M),n=(s==null?void 0:s.type)||"text",o=(s==null?void 0:s.name)||"...",v=n==="voice"||n==="conference";return e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{display:"flex",flex:1,overflow:"hidden"},children:v?e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column"},children:[h&&e.jsx("header",{className:"channel-top-bar",style:{flexShrink:0},children:e.jsxs("div",{className:"channel-title-wrapper",children:[e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>D(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",style:{color:"var(--primary-color)"},children:n==="voice"||n==="conference"?e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{color:"var(--primary-color)"},children:[e.jsx("path",{d:"M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"}),e.jsx("path",{d:"M19 10v2a7 7 0 0 1-14 0v-2"}),e.jsx("line",{x1:"12",y1:"19",x2:"12",y2:"23"})]}):n==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",style:{color:"var(--primary-color)"},children:o})]})}),e.jsx(t.Suspense,{fallback:e.jsx("div",{className:"skeleton-loader",children:e.jsx("p",{children:"Canlı bağlantı odası hazırlanıyor..."})}),children:n==="conference"?e.jsx(Et,{portalId:a,channelId:M,channelName:o}):e.jsx($t,{portalId:a,channelId:M,channelName:o})})]}):e.jsx("div",{className:"channel-messages-area",style:{flex:1,display:"flex",flexDirection:"column"},children:me?e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"},children:[e.jsx("div",{className:"spinner"}),e.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.9rem"},children:"İçerik yükleniyor..."})]}):e.jsxs(e.Fragment,{children:[!v&&e.jsxs("header",{className:`channel-top-bar ${h?"":"desktop-only"}`,children:[e.jsxs("div",{className:"channel-title-wrapper",children:[h&&e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>D(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",children:n==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",children:o})]}),e.jsx("div",{className:"channel-header-actions",children:$e&&e.jsx("button",{className:`icon-btn ${xe?"active":""}`,onClick:()=>Xe(!xe),title:xe?"Üyeleri Gizle":"Üyeleri Göster",style:{background:"none",border:"none",color:xe?"var(--primary-color)":"var(--text-muted)"},children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"24",height:"24",children:[e.jsx("path",{d:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"}),e.jsx("circle",{cx:"9",cy:"7",r:"4"}),e.jsx("path",{d:"M23 21v-2a4 4 0 0 0-3-3.87"}),e.jsx("path",{d:"M16 3.13a4 4 0 0 1 0 7.75"})]})})})]}),oe==="private"?e.jsx("div",{className:"portal-privacy-screen",children:e.jsxs("div",{className:"privacy-card",children:[e.jsx("div",{className:"privacy-icon",children:"🔒"}),e.jsx("img",{src:U(i.avatar),alt:"",className:"privacy-avatar",loading:"lazy",decoding:"async",width:"80",height:"80"}),e.jsx("h2",{children:i.name}),e.jsx("p",{className:"privacy-desc",children:i.description||"Bu portal gizlidir."}),e.jsx("p",{className:"privacy-hint",children:"İçeriği görmek ve mesajlaşmak için üye olmalısın."}),i.isRequested?e.jsx("button",{className:"privacy-join-btn requested",disabled:!0,children:"İstek Gönderildi"}):e.jsx("button",{className:"privacy-join-btn",onClick:fs,children:i.privacy==="private"?"Üyelik İsteği Gönder":"Portala Katıl"})]})}):e.jsxs(e.Fragment,{children:[(i==null?void 0:i.alerts)&&i.alerts.length>0&&e.jsx(Dt,{alerts:i.alerts}),e.jsxs("div",{className:"portal-feed-container discord-feed",onScroll:Ws,ref:Ce,children:[G.length===0&&!Z&&e.jsxs("div",{className:"empty-portal",children:[e.jsx("div",{className:"empty-portal-icon",children:"👋"}),e.jsxs("h3",{children:[((k=(y=i==null?void 0:i.channels)==null?void 0:y.find(f=>f._id===M))==null?void 0:k.type)==="voice"?"🎙️":((A=(w=i==null?void 0:i.channels)==null?void 0:w.find(f=>f._id===M))==null?void 0:A.type)==="conference"?"🎤":((z=(j=i==null?void 0:i.channels)==null?void 0:j.find(f=>f._id===M))==null?void 0:z.type)==="image"?"🖼️":"#",((H=(W=i==null?void 0:i.channels)==null?void 0:W.find(f=>String(f._id)===String(M)))==null?void 0:H.name)||"..."," ","kanalına hoş geldin!"]}),e.jsx("p",{children:"Bu kanalda henüz mesaj yok. İlk mesajı sen at!"})]}),Array.isArray(G)&&G.map((f,be)=>{var js;f.isBot===!0||((js=f.author)==null||js.isBot);const He=tt.enableAds;return e.jsxs(t.Fragment,{children:[e.jsx(it,{post:f,onDelete:Hs,onPin:Qs,onArchive:Os,isAdmin:bs},f._id),be<G.length-1&&e.jsx("div",{className:"post-separator"}),He]},f._id)}),e.jsx("div",{ref:Ks,style:{height:"40px",margin:"10px 0",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"},children:Ge&&e.jsx("div",{className:"spinner-small"})})]}),(()=>{const be=2*Math.PI*20,He=be-Us/100*be;return e.jsxs("button",{className:`floating-scroll-top portal-scroll-top ${Bs?"visible":""}`,onClick:Vs,"aria-label":"Yukarı Çık",children:[e.jsxs("svg",{className:"progress-ring",width:"50",height:"50",viewBox:"0 0 50 50",children:[e.jsx("circle",{className:"progress-ring-track",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25"}),e.jsx("circle",{className:"progress-ring-fill",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25",style:{strokeDasharray:be,strokeDashoffset:He}})]}),e.jsx("div",{className:"scroll-icon",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"m18 15-6-6-6 6"})})})]})})(),m&&$e?e.jsxs("div",{className:"channel-input-area",children:[fe&&et.createPortal(e.jsxs("div",{className:"plus-menu portal-plus-menu-portal",ref:Ms,style:{position:"fixed",top:ss.top,left:ss.left,zIndex:99999},children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{ns.current.click(),K(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("circle",{cx:"8.5",cy:"8.5",r:"1.5"}),e.jsx("polyline",{points:"21 15 16 10 5 21"})]})}),"Görsel"]}),!Ne&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{is.current.click(),K(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("polygon",{points:"23 7 16 12 23 17 23 7"}),e.jsx("rect",{x:"1",y:"5",width:"15",height:"14",rx:"2",ry:"2"})]})}),"Video"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{rs.current.click(),K(!1)},children:[e.jsx("div",{className:"plus-menu-icon",style:{fontWeight:800,fontSize:"10px"},children:"GIF"}),"GIF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{os.current.click(),K(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"})]})}),"PDF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{je(!as),K(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"}),e.jsx("polygon",{points:"9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02",fill:"currentColor"})]})}),"YouTube"]})]})]}),document.body),e.jsx("input",{type:"file",ref:ns,onChange:_e,style:{display:"none"},accept:"image/png, image/jpeg, image/jpg"}),e.jsx("input",{type:"file",ref:is,onChange:_e,style:{display:"none"},accept:"video/mp4, video/webm, video/quicktime"}),e.jsx("input",{type:"file",ref:rs,onChange:_e,style:{display:"none"},accept:"image/gif"}),e.jsx("input",{type:"file",ref:os,onChange:_e,style:{display:"none"},accept:".pdf"}),as&&e.jsx("div",{className:"edit-modal-overlay",style:{zIndex:9999},children:e.jsxs("div",{className:"edit-modal-modern",style:{maxWidth:"400px",height:"auto",maxHeight:"none"},children:[e.jsxs("div",{className:"edit-modal-header-modern",children:[e.jsx("div",{className:"header-left",children:e.jsx("h3",{className:"header-title-modern",children:"YouTube Videosu Ekle"})}),e.jsx("button",{onClick:()=>je(!1),className:"close-btn-modern",children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),e.jsxs("div",{className:"edit-modal-content-modern",style:{padding:"20px"},children:[e.jsxs("div",{className:"floating-label-group",children:[e.jsx("label",{className:"floating-label",children:"Video Bağlantısı"}),e.jsx("input",{type:"text",className:"floating-input",placeholder:"https://www.youtube.com/watch?v=...",value:Ae,onChange:As,autoFocus:!0,onKeyDown:f=>{f.key==="Enter"&&(f.preventDefault(),ds())}})]}),e.jsxs("div",{style:{marginTop:"20px",display:"flex",justifyContent:"flex-end",gap:"10px"},children:[e.jsx("button",{onClick:()=>je(!1),className:"join-btn outline",style:{padding:"8px 16px"},children:"İptal"}),e.jsx("button",{onClick:ds,className:"join-btn primary",style:{padding:"8px 20px"},children:"Ekle"})]})]})]})}),E&&e.jsxs("div",{className:"input-quoted-preview",children:[e.jsxs("div",{className:"input-quoted-preview-header",children:[(V=($=E.author)==null?void 0:$.profile)!=null&&V.avatar?e.jsx("img",{src:U(E.author.profile.avatar),alt:"",className:"quoted-preview-avatar",loading:"lazy",decoding:"async",width:"32",height:"32"}):e.jsx("div",{className:"quoted-preview-avatar-placeholder",children:(B=(F=E.author)==null?void 0:F.username)==null?void 0:B.charAt(0).toUpperCase()}),e.jsxs("div",{className:"quoted-preview-meta",children:[e.jsx("span",{className:"quoted-preview-author",children:((pe=(O=E.author)==null?void 0:O.profile)==null?void 0:pe.displayName)||((Y=E.author)==null?void 0:Y.username)}),e.jsxs("span",{className:"quoted-preview-username",children:["@",(se=E.author)==null?void 0:se.username]})]}),e.jsx("button",{className:"remove-quote-btn",onClick:()=>ke(null),children:e.jsx(ye,{size:16})})]}),e.jsxs("div",{className:"input-quoted-preview-body",children:[e.jsx("p",{className:"input-quoted-preview-text",children:E.content}),E.media&&e.jsx("div",{className:"input-quoted-preview-media",children:E.mediaType==="video"?e.jsxs("div",{className:"media-placeholder",children:[e.jsx(wt,{size:20}),e.jsx("span",{children:"Video Alıntısı"})]}):e.jsx("img",{src:U(E.media),alt:"",loading:"lazy",decoding:"async",width:"120",height:"80"})})]})]}),Ne&&X.trim()&&!C&&e.jsxs("div",{className:"image-channel-warning",style:{backgroundColor:"rgba(239, 68, 68, 0.1)",border:"1px solid rgba(239, 68, 68, 0.25)",color:"#f87171",padding:"8px 12px",borderRadius:"8px",fontSize:"13px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{flexShrink:0},children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]}),e.jsx("span",{children:"Görsel kanallarında paylaşım yapabilmek için mutlaka bir görsel eklemelisiniz."})]}),e.jsxs("div",{className:"message-input-wrapper",children:[e.jsx("button",{ref:Le,className:`input-action-btn upload-btn ${fe?"active":""}`,onClick:$s,style:{backgroundColor:"#383a40",borderRadius:"50%",width:"32px",height:"32px",marginRight:"12px",color:fe?"var(--primary-color)":"#b9bbbe"},children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z"})})}),C&&e.jsxs("div",{className:"input-media-preview",style:{marginRight:"12px",display:"flex",alignItems:"center",backgroundColor:"var(--bg-secondary)",borderRadius:"8px",padding:"4px",gap:"8px",border:"1px solid var(--border-subtle)"},children:[C.type==="youtube"&&C.preview?e.jsx("img",{src:C.preview,alt:"Video Preview",style:{width:"40px",height:"30px",objectFit:"cover",borderRadius:"4px"},loading:"lazy",decoding:"async",width:"40",height:"30"}):e.jsx("span",{style:{fontSize:"20px",lineHeight:1,padding:"4px"},children:C.type.startsWith("video")?"🎥":C.type.includes("gif")?"👾":C.type==="application/pdf"||C.name&&C.name.toLowerCase().endsWith(".pdf")?"📄":"🖼️"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",maxWidth:"100px"},children:e.jsx("span",{style:{fontSize:"10px",color:"var(--text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:C.name||"Medya"})}),e.jsx("button",{onClick:()=>ge(null),style:{background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer"},children:"×"})]}),e.jsx("input",{type:"text",placeholder:Ne?"Gönderi paylaşmak için bir görsel ekleyin...":`#${(L==null?void 0:L.name)||"..."} kanalına mesaj gönder`,value:X,onChange:f=>{Ee(f.target.value)},onKeyDown:f=>{f.key==="Enter"&&!f.shiftKey&&(f.preventDefault(),ps())}}),e.jsx("div",{className:"input-right-actions",children:e.jsx("button",{className:"input-action-btn send-btn",onClick:ps,disabled:ls||(Ne||!X.trim())&&!C,title:"Gönder",style:{color:X.trim()||C?"var(--primary-color)":"var(--text-tertiary)"},children:ls?e.jsxs("div",{className:"compose-spinner-wrapper",style:{width:"20px",height:"20px"},children:[e.jsx("div",{className:"compose-spinner",style:{width:"20px",height:"20px",borderTopColor:"var(--primary-color)"}}),e.jsxs("span",{className:"compose-progress-text",style:{fontSize:"7px",color:"var(--text-primary)"},children:[Ds,"%"]})]}):e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"22",y1:"2",x2:"11",y2:"13"}),e.jsx("polygon",{points:"22 2 15 22 11 13 2 9 22 2"})]})})})]}),Q&&Q.length>0&&e.jsxs("div",{className:"portal-typing-indicator",style:{marginTop:"8px"},children:[e.jsx("div",{className:"typing-avatars-group",children:Q.map(f=>e.jsx("img",{src:U(f.avatar),alt:f.displayName,className:"typing-avatar",title:f.displayName},f.userId))}),e.jsx("span",{className:"typing-text",children:Q.length===1?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:Q[0].displayName})," yazıyor..."]}):Q.length===2?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:Q[0].displayName})," ve ",e.jsx("strong",{children:Q[1].displayName})," yazıyor..."]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:Q[0].displayName})," ve ",Q.length-1," kişi daha yazıyor..."]})})]})]}):e.jsx("div",{className:"channel-input-area",style:{padding:"0 20px 24px 20px",backgroundColor:"transparent",borderTop:"none"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--glass-bg)",padding:"12px 20px",borderRadius:"8px",border:"1px solid var(--glass-border)",backdropFilter:"blur(20px) saturate(160%)",WebkitBackdropFilter:"blur(20px) saturate(160%)",boxShadow:"var(--glass-shadow)"},children:[e.jsxs("span",{style:{color:"var(--text-secondary)",fontWeight:500,fontSize:"14px"},children:["Bu kanalda mesaj göndermek için ",m?"portala katılmalısın.":"giriş yapmalısın."]}),m?e.jsx("button",{className:"privacy-join-btn",onClick:fs,disabled:i.isRequested,style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:i.isRequested?"İstek Gönderildi":"Portala Katıl"}):e.jsx("button",{className:"privacy-join-btn",onClick:()=>u("/login"),style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:"Giriş Yap"})]})})]})]})})}),xe&&e.jsx(Tt,{members:i.members,onClose:()=>Xe(!1)})]})})()]})]}),We&&Ve!=="notifications"&&e.jsx(t.Suspense,{fallback:null,children:e.jsx(Rt,{portal:i,currentUser:m,initialTab:Ve,onClose:()=>ze(!1),onUpdate:s=>{ae(s)}})}),We&&Ve==="notifications"&&e.jsx("div",{className:"portal-notifications-modal",onClick:()=>ze(!1),children:e.jsxs("div",{className:"notifications-modal-content",onClick:s=>s.stopPropagation(),children:[e.jsx("button",{className:"close-notifications-btn",onClick:()=>ze(!1),children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsx(t.Suspense,{fallback:null,children:e.jsx(Mt,{portalId:i._id,portalChannels:i.channels||[],onUpdate:ms})})]})}),Rs&&i&&e.jsx(It,{portal:i,onClose:()=>cs(!1),isMobile:h})]})};export{ra as default};
