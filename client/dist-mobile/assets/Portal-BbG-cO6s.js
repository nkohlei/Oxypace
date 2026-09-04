const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PortalSettingsModal-MAJR2DVw.js","assets/vendor-jO-Cpt0r.js","assets/index-CEAavaNg.js","assets/socket-CLibEh-w.js","assets/livekit-aTqtZGx_.js","assets/lucide-BocR4IYo.js","assets/index-98MiI0F0.css","assets/ImageCropper-c9mf6QhY.js","assets/ImageCropper-D3thH9n0.css","assets/PortalSettingsModal-Dd_9NXFk.css","assets/PortalNotifications-BD0OtLxp.js","assets/PortalNotifications-iCJNwBfZ.css","assets/VoiceChannel-Bk1KERR0.js","assets/VoiceChannel-ka3B8ivq.js","assets/VoiceChannel-DptTuBzV.css","assets/ConferenceChannel-9Up5ZG1-.js"])))=>i.map(i=>d[i]);
import{r as a,a1 as e,Z as ue,a2 as $t,ar as Lt,at as ps,a7 as ms,as as us,a8 as hs,ad as He}from"./vendor-jO-Cpt0r.js";import{d as X,i as Bt,u as dt,j as qt,f as Oe,c as pt,b as At,k as xs,a as Et}from"./index-CEAavaNg.js";import{u as fs}from"./useVideoTranscoder-B5WDd4nV.js";import{P as gs}from"./PostCard-DEOOOpvV.js";import{c as ys,X as Ne,Y as vs,q as bs,N as js,Z as ws,_ as ks,d as Ns,$ as Ss,W as Cs,a0 as _s,u as Ps,a1 as Is,U as zs,a2 as Ts,a3 as Ms}from"./lucide-BocR4IYo.js";import{B as Ut}from"./Badge-B4Xxzr9C.js";import{U as Rs}from"./UserBar-B0s3d3AF.js";import{N as $e}from"./Navbar-Bv1vF-iV.js";import{S as Ds}from"./SubHeader-DwYb5gL6.js";import{S as Ls}from"./SEO-DprGRyn_.js";import"./socket-CLibEh-w.js";import"./livekit-aTqtZGx_.js";import"./VideoDownloadModal-Ceq939wp.js";import"./UserBadges-CsMne-Yh.js";import"./LinkPreview-vDTC8XTn.js";import"./UserAvatar-DQQA0xSd.js";/* empty css                      *//* empty css                  */const As=({portalId:s,onClose:C})=>{const[q,S]=a.useState(""),[U,f]=a.useState([]),[E,_]=a.useState(!1),[l,V]=a.useState(new Set);a.useEffect(()=>{const j=setTimeout(async()=>{if(q.trim().length===0){f([]);return}_(!0);try{const b=await ue.get(`/api/users/search?q=${q}`);f(b.data)}catch{}finally{_(!1)}},500);return()=>clearTimeout(j)},[q]);const M=async k=>{var j,b;try{await Promise.all([ue.post(`/api/portals/${s}/invite`,{userId:k}),ue.post("/api/messages",{recipientId:k,portalId:s,content:"Seni bir portala davet ettim!"})]),V(r=>new Set(r).add(k))}catch(r){alert(((b=(j=r.response)==null?void 0:j.data)==null?void 0:b.message)||"İşlem sırasında bir hata oluştu.")}},N=()=>{const k=`${window.location.origin}/portal/${s}`;navigator.clipboard.writeText(k),alert("Davet bağlantısı kopyalandı!")};return e.jsx("div",{className:"invite-modal-overlay",onClick:C,children:e.jsxs("div",{className:"invite-modal",onClick:k=>k.stopPropagation(),children:[e.jsxs("div",{className:"invite-header",children:[e.jsx("h2",{children:"Kullanıcı Davet Et"}),e.jsxs("div",{className:"header-actions",children:[e.jsxs("button",{className:"copy-link-btn",title:"Bağlantıyı Kopyala",onClick:N,children:[e.jsx(ys,{size:20,strokeWidth:2}),e.jsx("span",{children:"Bağlantı"})]}),e.jsx("button",{className:"close-btn",onClick:C,children:e.jsx(Ne,{size:24,strokeWidth:2})})]})]}),e.jsx("div",{className:"invite-search-container",children:e.jsx("input",{type:"text",className:"invite-search-input",placeholder:"Kullanıcı adı ara...",value:q,onChange:k=>S(k.target.value),autoFocus:!0})}),e.jsxs("div",{className:"invite-results custom-scrollbar",children:[E&&e.jsx("div",{className:"loading-text",children:"Aranıyor..."}),!E&&U.length===0&&q&&e.jsx("div",{className:"no-play-text",children:"Sonuç bulunamadı."}),U.map(k=>{var r;const j=k._id||k,b=l.has(j);return e.jsxs("div",{className:"invite-user-row",children:[e.jsxs("div",{className:"user-info",children:[e.jsx("img",{src:X((r=k.profile)==null?void 0:r.avatar),alt:"",className:"user-avatar"}),e.jsx("span",{className:"user-name",children:k.username})]}),e.jsx("button",{className:`invite-btn ${b?"invited":""}`,onClick:()=>!b&&M(j),disabled:b,children:b?"Gönderildi":"Davet Et"})]},j)})]})]})})},Es=({startedAt:s,style:C={},className:q=""})=>{const{roomDuration:S,roomStartTime:U}=Bt()||{},[f,E]=a.useState("00:00");a.useEffect(()=>{if(U&&s===U&&typeof S=="number"){const M=S,N=Math.floor(M/3600),k=Math.floor(M%3600/60),j=M%60;N>0?E(`${N.toString().padStart(2,"0")}:${k.toString().padStart(2,"0")}:${j.toString().padStart(2,"0")}`):E(`${k.toString().padStart(2,"0")}:${j.toString().padStart(2,"0")}`);return}if(!s){E("00:00");return}const l=()=>{const M=Date.now(),N=Math.floor((M-s)/1e3);if(N<0){E("00:00");return}const k=Math.floor(N/3600),j=Math.floor(N%3600/60),b=N%60;k>0?E(`${k.toString().padStart(2,"0")}:${j.toString().padStart(2,"0")}:${b.toString().padStart(2,"0")}`):E(`${j.toString().padStart(2,"0")}:${b.toString().padStart(2,"0")}`)};l();const V=setInterval(l,1e3);return()=>clearInterval(V)},[s,U,S]);const _={display:"flex",alignItems:"center",fontSize:"15px",fontWeight:"800",color:"#39FF14",background:"transparent",border:"none",padding:"0 4px"};return e.jsx("div",{style:{..._,...C},className:q,children:f})},$s=({portal:s,onClose:C,isMobile:q})=>{var i,P;const[S,U]=a.useState(0),[f,E]=a.useState(!1),_=a.useRef(0),l=a.useRef(0);if(!s)return null;const V=y=>{_.current=y.touches[0].clientY,l.current=y.touches[0].clientY,E(!0)},M=y=>{if(!f)return;const x=y.touches[0].clientY;l.current=x;const Y=x-_.current;Y>0?U(Y):U(0)},N=()=>{if(!f)return;E(!1),l.current-_.current>100&&C(),U(0)},k=new Date(s.createdAt).toLocaleDateString("tr-TR",{year:"numeric",month:"long",day:"numeric"}),j=s.privacy==="private"||s.isPrivate===!0,b=s.privacy==="restricted",g=j?{label:"Gizli",icon:e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"3",y:"11",width:"18",height:"11",rx:"3",ry:"3"}),e.jsx("path",{d:"M7 11V7a5 5 0 0 1 10 0v4"}),e.jsx("circle",{cx:"12",cy:"16.5",r:"1.5",fill:"currentColor",stroke:"none"})]})}:b?{label:"Kısıtlı",icon:e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"}),e.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),e.jsx("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]})}:{label:"Kamu",icon:e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("path",{d:"M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20"}),e.jsx("path",{d:"M2 12h20"})]})},L=e.jsxs("div",{className:"portal-info-container",children:[e.jsxs("div",{className:"portal-info-banner",children:[e.jsx("img",{src:s.coverImage?X(s.coverImage):s.banner?X(s.banner):"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",alt:s.name}),e.jsx("div",{className:"portal-info-avatar-wrapper",children:e.jsx("img",{src:X(s.avatar),alt:s.name,className:"portal-info-avatar-img"})}),e.jsx("button",{className:"portal-info-close",onClick:C,"aria-label":"Kapat",children:e.jsx(Ne,{size:20})})]}),e.jsxs("div",{className:"portal-info-content",children:[e.jsxs("div",{className:"portal-info-header",children:[e.jsxs("h1",{children:[s.name,e.jsx(Ut,{type:s.isVerified?"verified":(i=s.badges)==null?void 0:i[0],size:20})]}),e.jsx("p",{className:"portal-info-tagline",children:s.description||"Bu portal için bir açıklama bulunmuyor."})]}),e.jsxs("div",{className:"portal-info-stats-grid",children:[e.jsxs("div",{className:"portal-info-stat-card",children:[e.jsx("div",{className:"portal-stat-icon-box",children:e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}),e.jsx("circle",{cx:"9",cy:"7",r:"4"}),e.jsx("path",{d:"M22 21v-2a4 4 0 0 0-3-3.87"}),e.jsx("path",{d:"M16 3.13a4 4 0 0 1 0 7.75"})]})}),e.jsxs("div",{className:"stat-data",children:[e.jsx("span",{className:"stat-value",children:s.membersCount||((P=s.members)==null?void 0:P.length)||0}),e.jsx("span",{className:"stat-label",children:"Üye"})]})]}),e.jsxs("div",{className:"portal-info-stat-card",children:[e.jsx("div",{className:"portal-stat-icon-box",children:g.icon}),e.jsxs("div",{className:"stat-data",children:[e.jsx("span",{className:"stat-value",children:g.label}),e.jsx("span",{className:"stat-label",children:"Görünürlük"})]})]})]}),e.jsxs("div",{className:"portal-info-details",children:[e.jsxs("div",{className:"detail-item",children:[e.jsx("div",{className:"detail-icon-pill",children:e.jsxs("svg",{width:"13",height:"13",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),e.jsx("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),e.jsx("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]})}),e.jsxs("span",{children:["Oluşturulma: ",e.jsx("strong",{children:k})]})]}),e.jsxs("div",{className:"detail-item",children:[e.jsx("div",{className:"detail-icon-pill",children:e.jsxs("svg",{width:"13",height:"13",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"}),e.jsx("polyline",{points:"9 12 11 14 15 10"})]})}),e.jsxs("span",{children:["Durum: ",e.jsx("strong",{children:s.isVerified||s.badges&&s.badges.length>0?"Doğrulanmış Portal":"Standart Portal"})]})]}),e.jsxs("div",{className:"detail-item",children:[e.jsx("div",{className:"detail-icon-pill",children:e.jsxs("svg",{width:"13",height:"13",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"3",y:"3",width:"7",height:"7",rx:"1.5"}),e.jsx("rect",{x:"14",y:"3",width:"7",height:"7",rx:"1.5"}),e.jsx("rect",{x:"14",y:"14",width:"7",height:"7",rx:"1.5"}),e.jsx("rect",{x:"3",y:"14",width:"7",height:"7",rx:"1.5"})]})}),e.jsxs("span",{children:["Kategori: ",e.jsx("strong",{children:s.category||"Genel"})]})]})]})]})]});return q?e.jsx("div",{className:"bottom-sheet-overlay",onClick:C,children:e.jsxs("div",{className:"bottom-sheet-content",onClick:y=>y.stopPropagation(),style:{transform:S>0?`translateY(${S}px)`:void 0,transition:f?"none":"transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"},children:[e.jsx("div",{className:"bottom-sheet-handle-wrapper",onTouchStart:V,onTouchMove:M,onTouchEnd:N,children:e.jsx("div",{className:"bottom-sheet-handle"})}),L]})}):e.jsx("div",{className:"portal-info-modal-overlay",onClick:C,children:e.jsx("div",{className:"portal-info-modal-card",onClick:y=>y.stopPropagation(),children:L})})},Bs=({portal:s,isMember:C,onEdit:q,currentChannel:S,onChangeChannel:U,className:f,canManage:E,onShowPortalInfo:_})=>{var be,Ce,I;const{user:l}=dt(),[V,M]=a.useState(!1);$t();const N=qt(),{isMobileView:k}=N||{},j=(N==null?void 0:N.isDesktopSidebarCollapsed)||!1,b=(N==null?void 0:N.setIsDesktopSidebarCollapsed)||(()=>{}),r=Oe(p=>p.unreadPostsByChannel),g=Oe(p=>p.clearUnreadForChannel),{roomStartTime:L,activeRoom:i}=Bt(),{onlineUsers:P}=pt(),y=p=>{if(!p)return null;if(typeof p=="string")return p;const $=p._id||p.id;return $?String($):null},x=new Set,Y=y(s==null?void 0:s.owner);Y&&x.add(Y),((s==null?void 0:s.admins)||[]).forEach(p=>{const $=y(p);$&&x.add($)}),((s==null?void 0:s.members)||[]).forEach(p=>{const $=y(p);$&&x.add($)});const Z=new Set((P||[]).map(p=>String(p))),G=l!=null&&l._id?String(l._id):null,ie=((Ce=(be=l==null?void 0:l.settings)==null?void 0:be.privacy)==null?void 0:Ce.showOnlineStatus)!==!1;G&&x.has(G)&&ie?Z.add(G):G&&!ie&&Z.delete(G);let ve=0;x.forEach(p=>{Z.has(p)&&ve++});const re=x.size||(s==null?void 0:s.membersCount)||((s==null?void 0:s.members)||[]).length||0;if(a.useEffect(()=>{S&&(s!=null&&s._id)&&g(S,s._id)},[S,s==null?void 0:s._id,g]),!s)return null;const K=s!=null&&s.channels?[...s.channels].sort((p,$)=>(p.order||0)-($.order||0)).map(p=>({id:p._id,name:p.name,type:p.type||"text"})):[],he=K.find(p=>p.id===S),de=(he==null?void 0:he.type)==="voice"||(he==null?void 0:he.type)==="conference";a.useEffect(()=>{!de&&j&&b(!1)},[de,j,b]);const Se=p=>S===p;return e.jsxs("div",{className:`channel-sidebar ${j?"collapsed":""} ${f||""}`,style:{height:"calc(100% - 24px)",backgroundColor:"transparent",display:"flex",flexDirection:"column",flexShrink:0,overflow:"visible",position:"relative",borderRight:"none"},children:[!k&&de&&e.jsx("button",{className:"sidebar-toggle-btn",onClick:p=>{p.stopPropagation(),b(!j)},title:j?"Menüyü Göster":"Menüyü Gizle",children:j?e.jsx(vs,{size:16}):e.jsx(bs,{size:16})}),e.jsxs("div",{className:"sidebar-content-wrapper",style:{display:"flex",flexDirection:"column",flex:1,width:"100%",height:"100%",overflow:"hidden",transition:"opacity 0.2s ease, visibility 0.2s ease",opacity:j?0:1,visibility:j?"hidden":"visible",gap:"8px",padding:"0px",boxSizing:"border-box"},children:[e.jsxs("div",{className:"cs-panel cs-panel--banner",children:[e.jsxs("div",{className:"channel-banner-container",onClick:()=>_&&_(),children:[e.jsx("div",{className:"channel-banner-image",style:{backgroundImage:s.coverImage?`url(${X(s.coverImage)})`:s.banner?`url(${X(s.banner)})`:'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")'}}),e.jsx("div",{className:"channel-banner-overlay"})]}),e.jsxs("div",{className:"portal-quick-info",children:[e.jsxs("div",{className:"portal-info-main",onClick:()=>_&&_(),children:[e.jsxs("h2",{className:"portal-title-text",children:[s.name,e.jsx(Ut,{type:s.isVerified?"verified":(I=s.badges)==null?void 0:I[0],size:16})]}),e.jsxs("div",{className:"portal-stats-row",children:[e.jsxs("div",{className:"stat-item",children:[e.jsx(js,{size:12}),e.jsxs("span",{children:[re," Üye"]})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:"stat-item",children:[e.jsx("div",{className:"online-indicator-dot"}),e.jsxs("span",{children:[ve," Çevrimiçi"]})]})]})]}),e.jsxs("div",{className:"portal-header-actions",children:[(C||E)&&e.jsx("button",{className:"portal-action-btn-circle",onClick:p=>{p.stopPropagation(),q&&q("notifications")},title:"Bildirim Ayarları",children:e.jsx(ws,{size:16})}),C&&e.jsx("button",{className:"portal-action-btn-circle",onClick:p=>{p.stopPropagation(),M(!0)},title:"Davet Et",children:e.jsx(ks,{size:18})})]})]})]}),e.jsxs("div",{className:"cs-panel cs-panel--channels custom-scrollbar",children:[e.jsxs("div",{className:"cs-channels-header",children:[e.jsx("span",{children:"Kanallar"}),E&&e.jsx("div",{onClick:p=>{p.stopPropagation(),q&&q("channels")},className:"cs-add-channel-btn",title:"Kanal Oluştur",children:"+"})]}),e.jsx("div",{className:"cs-channel-list",children:K.map(p=>{var je;const $=Se(p.id),Qe=p.type==="announcement"||p.name.includes("announcements"),ee=p.type==="voice";return e.jsxs("div",{className:`channel-item ${$?"active":""}`,onClick:()=>U(p.id),style:{padding:"6px 8px",margin:"2px 0",borderRadius:"4px",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",color:$?"white":"#949ba4",backgroundColor:$?"#3f4147":"transparent",transition:"all 0.1s"},children:[e.jsx("div",{style:{color:$?"white":"var(--text-secondary)",display:"flex",alignItems:"center",minWidth:"20px",justifyContent:"center"},children:ee?e.jsx(Ns,{size:20,strokeWidth:2}):Qe?e.jsx(Ss,{size:20,strokeWidth:2.5}):p.type==="image"?e.jsx(Cs,{size:20,strokeWidth:2.5,style:{color:"#f59e0b"}}):e.jsx(_s,{size:20,strokeWidth:2.5})}),e.jsx("span",{style:{fontWeight:$?600:500,fontSize:"16px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:$?"white":"var(--text-primary)",maxWidth:"fit-content"},children:p.name}),!$&&((je=r[p.id])==null?void 0:je.length)>0&&e.jsx("div",{style:{backgroundColor:"#f23f43",color:"white",fontSize:"11px",fontWeight:"bold",padding:"0 6px",borderRadius:"8px",minWidth:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.3)",marginLeft:"-4px",flexShrink:0},children:r[p.id].length>9?"9+":r[p.id].length}),e.jsx("div",{style:{flex:1}}),$&&ee&&i&&String(i.channelId)===String(p.id)&&L&&e.jsx("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:e.jsx(Es,{startedAt:L,className:"vc-sidebar-timer"})})]},p.id)})})]}),e.jsxs("div",{className:"cs-panel cs-panel--userbar",children:[e.jsx(Rs,{currentChannelId:S}),e.jsx("div",{className:"cs-footer-copyright",children:"© 2026 Oxypace. Tüm hakları saklıdır."})]})]}),e.jsx("style",{children:`
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
            `}),V&&e.jsx(As,{portalId:s._id,onClose:()=>M(!1)})]})},qs=({members:s=[],onClose:C})=>{var j,b;const{onlineUsers:q}=pt(),{user:S}=dt(),[,U]=a.useState(0);a.useEffect(()=>{const r=setInterval(()=>{U(g=>g+1)},6e4);return()=>clearInterval(r)},[]);const f=r=>{if(!r)return"";const g=new Date,L=new Date(r),i=Math.max(0,g-L),P=Math.floor(i/6e4);if(P<1)return"şimdi";if(P<60)return`${P}dk`;const y=Math.floor(P/60);if(y<24)return`${y}sa`;const x=Math.floor(y/24);if(x<30)return`${x}g`;const Y=Math.floor(x/30);return Y<12?`${Y}ay`:`${Math.floor(Y/12)}y`},E=r=>{if(!r)return null;if(typeof r=="string")return r;const g=r._id||r.id;return g?String(g):null},_=new Set((q||[]).map(r=>String(r))),l=S!=null&&S._id?String(S._id):null,V=((b=(j=S==null?void 0:S.settings)==null?void 0:j.privacy)==null?void 0:b.showOnlineStatus)!==!1;l&&V?_.add(l):l&&!V&&_.delete(l);const M=r=>(r==null?void 0:r.role)==="owner"?3:(r==null?void 0:r.role)==="admin"||r!=null&&r.isAdmin?2:1,N=s.filter(r=>{if(!r)return!1;const g=E(r);return g&&_.has(g)}).sort((r,g)=>{var y,x;const L=M(g)-M(r);if(L!==0)return L;const i=((y=r.profile)==null?void 0:y.displayName)||r.username||"",P=((x=g.profile)==null?void 0:x.displayName)||g.username||"";return i.localeCompare(P)}),k=s.filter(r=>{if(!r)return!1;const g=E(r);return g&&!_.has(g)}).sort((r,g)=>{var y,x;const L=M(g)-M(r);if(L!==0)return L;const i=((y=r.profile)==null?void 0:y.displayName)||r.username||"",P=((x=g.profile)==null?void 0:x.displayName)||g.username||"";return i.localeCompare(P)});return e.jsxs("div",{className:"members-sidebar custom-scrollbar",children:[e.jsxs("div",{className:"members-header-top",children:[e.jsx("h3",{children:"ÜYELER"}),C&&e.jsx("button",{onClick:C,className:"close-members-btn","aria-label":"Kapat",children:e.jsx(Ne,{size:20,strokeWidth:2})})]}),e.jsxs("div",{className:"members-category",children:["Çevrim içi — ",N.length]}),N.map((r,g)=>{var Y,Z,G,ie;if(!r||typeof r=="string")return null;const L=r.username||"Unknown",i=((Y=r.profile)==null?void 0:Y.avatar)||r.avatar,P=((Z=r.profile)==null?void 0:Z.displayName)||L,y=r.role==="owner",x=r.role==="admin"||r.isAdmin;return e.jsxs(Lt,{to:`/profile/${L}`,className:"member-item member-link",children:[e.jsxs("div",{className:"member-avatar-wrapper",children:[i?e.jsx("img",{src:X(i),alt:"",className:"member-avatar"}):e.jsx("div",{className:"member-avatar-placeholder",children:((G=P[0])==null?void 0:G.toUpperCase())||((ie=L[0])==null?void 0:ie.toUpperCase())||"?"}),e.jsx("div",{className:"status-indicator online"})]}),e.jsx("div",{className:"member-info",children:e.jsxs("span",{className:"member-name active-role",style:{color:y?"#f1c40f":x?"#3498db":"#2ecc71"},children:[P,y&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!y&&x&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"})]})})]},r._id||r.id||g)}),e.jsxs("div",{className:"members-category",children:["Çevrim dışı — ",k.length]}),k.map((r,g)=>{var Y,Z,G,ie;if(!r||typeof r=="string")return null;const L=r.username||"Unknown",i=((Y=r.profile)==null?void 0:Y.avatar)||r.avatar,P=((Z=r.profile)==null?void 0:Z.displayName)||L,y=r.role==="owner",x=r.role==="admin"||r.isAdmin;return e.jsxs(Lt,{to:`/profile/${L}`,className:"member-item offline member-link",children:[e.jsx("div",{className:"member-avatar-wrapper",children:i?e.jsx("img",{src:X(i),alt:"",className:"member-avatar"}):e.jsx("div",{className:"member-avatar-placeholder",style:{backgroundColor:"var(--bg-secondary)"},children:((G=P[0])==null?void 0:G.toUpperCase())||((ie=L[0])==null?void 0:ie.toUpperCase())||"?"})}),e.jsx("div",{className:"member-info",style:{flex:1},children:e.jsxs("div",{className:"member-name-row",style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("span",{className:"member-name",children:[P,y&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!y&&x&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"})]}),r.lastActive&&e.jsx("span",{className:"last-active-time",style:{fontSize:"11px",color:"var(--text-muted)"},children:f(r.lastActive)})]})})]},r._id||r.id||`offline-${g}`)}),e.jsx("style",{children:`
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
            `})]})},Us=({alerts:s=[]})=>{const[C,q]=a.useState(()=>{try{const l=sessionStorage.getItem("dismissed_portal_alerts");return l?JSON.parse(l):[]}catch{return[]}}),[S,U]=a.useState(null),f=s.filter(l=>!C.includes(l._id)),E=l=>{U(l),setTimeout(()=>{const V=[...C,l];q(V);try{sessionStorage.setItem("dismissed_portal_alerts",JSON.stringify(V))}catch{}U(null)},300)},_=l=>{const V=new Date,N=new Date(l)-V;if(N<=0)return null;const k=Math.floor(N/(1e3*60*60*24)),j=Math.floor(N/(1e3*60*60)%24),b=Math.floor(N/(1e3*60)%60);return k>0?`${k} gün ${j} saat kaldı`:j>0?`${j} saat ${b} dk kaldı`:`${b} dakika kaldı`};return f.length===0?null:e.jsx(e.Fragment,{children:f.map(l=>e.jsx("div",{className:`portal-alert-banner ${S===l._id?"dismissing":""}`,children:e.jsxs("div",{className:"alert-banner-inner",children:[e.jsx("div",{className:"alert-banner-icon",children:e.jsx(Ps,{size:18,strokeWidth:2})}),e.jsxs("div",{className:"alert-banner-content",children:[e.jsx("div",{className:"alert-banner-label",children:e.jsx("span",{children:"Yönetici Uyarısı"})}),e.jsx("div",{className:"alert-banner-message",children:l.message}),e.jsx("div",{className:"alert-banner-meta",children:e.jsxs("span",{className:"alert-banner-time",children:[e.jsx(Is,{size:16,strokeWidth:2}),_(l.expiresAt)||"Süresi dolmak üzere"]})})]}),e.jsx("button",{className:"alert-banner-close",onClick:()=>E(l._id),title:"Uyarıyı gizle",children:e.jsx(Ne,{size:16,strokeWidth:2.5})})]})},l._id))})},Ws=a.lazy(()=>He(()=>import("./PortalSettingsModal-MAJR2DVw.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9]))),Fs=a.lazy(()=>He(()=>import("./PortalNotifications-BD0OtLxp.js"),__vite__mapDeps([10,1,2,3,4,5,6,11]))),Vs=a.lazy(()=>He(()=>import("./VoiceChannel-Bk1KERR0.js"),__vite__mapDeps([12,1,4,2,3,5,6,13,14]))),Ys=a.lazy(()=>He(()=>import("./ConferenceChannel-9Up5ZG1-.js"),__vite__mapDeps([15,1,4,2,3,5,6,13,14]))),fn=()=>{var Rt,Dt;const{id:s}=ps(),C=ms(),[q]=us(),S=q.get("channel"),U=q.get("post"),{user:f,updateUser:E,loading:_}=dt(),{socket:l,connected:V}=pt(),M=$t(),N=qt(),{isSidebarOpen:k,closeSidebar:j,isMobileView:b,mobileChannelOpen:r,setMobileChannelOpen:g}=N||{},L=(N==null?void 0:N.isDesktopSidebarCollapsed)||!1,[i,P]=a.useState(null),y=Oe(t=>t.posts),x=Oe(t=>t.setPosts),[Y,Z]=a.useState(!0),[G,ie]=a.useState(!1),[ve,re]=a.useState(""),[K,he]=a.useState(null),[de,Se]=a.useState(null),[be,Ce]=a.useState(!1),[I,p]=a.useState(null),[$,Qe]=a.useState(!1),[ee,je]=a.useState(""),[oe,mt]=a.useState([]);a.useRef(null);const[_e,Ze]=a.useState(!1),[Pe,ut]=a.useState(!1),[we,ht]=a.useState({show:!1,message:"",type:"info"}),[Wt,Ft]=a.useState(!1),[Ie,te]=a.useState(!1),[xt,ft]=a.useState({top:0,left:0}),[Je,gt]=a.useState(""),[yt,Be]=a.useState(!1),ze=a.useRef(null),vt=a.useRef(null),bt=a.useRef(null),jt=a.useRef(null),[z,ke]=a.useState(null),[xe,Te]=a.useState([]),[ge,Me]=a.useState([]),[W,qe]=a.useState(null),[Vt,Re]=a.useState(0),[wt,Xe]=a.useState(!1),Ue=a.useRef(!1);fs();const pe=At(t=>t.activeUploads)[`portal-${s}`];a.useEffect(()=>{pe&&pe.status==="uploading"&&x(t=>t.map(n=>n.isOptimistic&&n.mediaType==="video"?{...n,uploadProgress:pe.progress}:n))},[pe==null?void 0:pe.progress,pe==null?void 0:pe.status]);const[Yt,kt]=a.useState(!1),Gt=a.useRef(null),De=a.useRef(null),Kt=a.useCallback(t=>{t.preventDefault(),t.stopPropagation(),te(n=>{if(!n&&De.current){const o=De.current.getBoundingClientRect();ft({top:o.bottom+8,left:o.left})}return!n})},[]);a.useEffect(()=>{if(!Ie)return;let t=!0;const n=()=>{if(De.current){const d=De.current.getBoundingClientRect();ft({top:d.bottom+8,left:d.left})}},o=d=>{if(!t)return;const h=d.target.closest(".plus-menu")||d.target.closest(".portal-plus-menu-portal"),w=d.target.closest(".upload-btn");!h&&!w&&te(!1)},c=setTimeout(()=>{t&&(document.addEventListener("click",o),document.addEventListener("touchstart",o))},0);return window.addEventListener("scroll",n,!0),window.addEventListener("resize",n),()=>{t=!1,clearTimeout(c),document.removeEventListener("click",o),document.removeEventListener("touchstart",o),window.removeEventListener("scroll",n,!0),window.removeEventListener("resize",n)}},[Ie]),a.useEffect(()=>()=>{te(!1)},[]),a.useEffect(()=>{te(!1)},[I,s]),a.useEffect(()=>{var t;(t=C.state)!=null&&t.quotedPost&&(qe(C.state.quotedPost),C.state.selectedChannelId&&p(C.state.selectedChannelId),M(C.pathname+C.search,{replace:!0,state:{}}))},[C.state,s]);const se=(Rt=i==null?void 0:i.channels)==null?void 0:Rt.find(t=>t._id===I),We=(se==null?void 0:se.type)==="image",Ot=((se==null?void 0:se.type)==="voice"||(se==null?void 0:se.type)==="conference")&&(!b||r);a.useEffect(()=>{if(!l||!V||!s)return;l.emit("join_portal",s),l.emit("get_online_users"),I&&l.emit("join_channel",I);const t=d=>{var T,B;const h=((T=d.portal)==null?void 0:T._id)||d.portal,w=((B=d.channel)==null?void 0:B._id)||d.channel,m=String(h)===String(s),F=String(w)===String(I);m&&F&&x(O=>{if(O.some(R=>R._id===d._id))return O;const v=d.quotedPost&&(typeof d.quotedPost=="string"?d.quotedPost:d.quotedPost._id);if(v){const R=O.find(le=>le._id===v);R&&typeof R=="object"&&R.author?d.quotedPost=R:W&&v===W._id&&(d.quotedPost=W)}return[d,...O]})},n=d=>{var m;const h=((m=d.portal)==null?void 0:m._id)||d.portal;(!h||String(h)===String(s))&&x(F=>F.map(T=>String(T._id)===String(d._id)?d:T))},o=({userId:d,status:h,lastActive:w})=>{h==="offline"&&mt(m=>m.filter(F=>String(F.userId)!==String(d))),P(m=>{if(!m)return m;const F=w||new Date;let T=m.owner;if(m.owner){const v=m.owner._id||m.owner.id||m.owner;String(v)===String(d)&&typeof m.owner=="object"&&(T={...m.owner,lastActive:F})}let B=m.admins;Array.isArray(m.admins)&&(B=m.admins.map(v=>{const R=v._id||v.id||v;return String(R)===String(d)&&typeof v=="object"&&v!==null?{...v,lastActive:F}:v}));let O=m.members;return Array.isArray(m.members)&&(O=m.members.map(v=>{const R=v._id||v.id||v;return String(R)===String(d)&&typeof v=="object"&&v!==null?{...v,lastActive:F}:v})),{...m,owner:T,admins:B,members:O}})},c=({userId:d,username:h,displayName:w,avatar:m,isTyping:F})=>{String(d)!==String(f==null?void 0:f._id)&&mt(T=>F?T.some(B=>String(B.userId)===String(d))?T:[...T,{userId:d,username:h,displayName:w,avatar:m}]:T.filter(B=>String(B.userId)!==String(d)))};return l.on("post:created",t),l.on("post:updated",n),l.on("user_status_change",o),l.on("portal_typing_update",c),()=>{l.off("post:created",t),l.off("post:updated",n),l.off("user_status_change",o),l.off("portal_typing_update",c)}},[l,V,s,I,f==null?void 0:f._id]);const Ht=t=>{if(!t)return null;const n=/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,o=t.match(n);return o&&o[2].length===11?o[2]:null},Qt=t=>{const n=t.target.value;gt(n)},Nt=()=>{const t=Ht(Je);if(!t){J("Geçersiz YouTube URL'si","error");return}ke({name:"YouTube Video",type:"youtube",preview:`https://img.youtube.com/vi/${t}/hqdefault.jpg`,url:Je}),Be(!1),gt("")},[Zt,et]=a.useState(!1),[Jt,Xt]=a.useState(0),tt=a.useRef(null),st=a.useRef(null),Le=a.useRef(null),es=a.useCallback(t=>{const n=t.target;st.current||(st.current=requestAnimationFrame(()=>{st.current=null;const o=n.scrollTop,c=o>300;et(h=>h!==c?c:h);const d=n.scrollHeight-n.clientHeight;if(d>0){const h=Math.round(o/d*100);Xt(w=>Math.abs(w-h)>=2?h:w)}}))},[]),ts=a.useCallback(t=>{t&&(t.preventDefault(),t.stopPropagation()),Le.current&&cancelAnimationFrame(Le.current);const n=tt.current||document.querySelector(".discord-feed")||document.querySelector(".portal-feed-container");if(!n){window.scrollTo({top:0,behavior:"smooth"});return}const o=n.scrollTop;if(o<=0)return;const c=800,d=performance.now(),h=m=>1-Math.pow(1-m,5),w=m=>{const F=m-d,T=Math.min(F/c,1),B=h(T);n.scrollTop=Math.round(o*(1-B)),T<1?Le.current=requestAnimationFrame(w):(n.scrollTop=0,Le.current=null)};Le.current=requestAnimationFrame(w)},[]),ss=t=>{p(t),et(!1),b&&(j(),g(!0))},J=a.useCallback((t,n="info")=>{ht({show:!0,message:t,type:n}),setTimeout(()=>ht(o=>({...o,show:!1})),4e3)},[]),ns=t=>{const n=Array.from(t.target.files||[]);if(n.length===0)return;ke(null),Ue.current=!1;const c=10-xe.length;if(c<=0){J("Bir gönderiye en fazla 10 görsel ekleyebilirsiniz.","warning");return}const d=n.slice(0,c);n.length>c&&J(`En fazla 10 görsel ekleyebilirsiniz. İlk ${c} görsel eklendi.`,"warning");const h=[],w=[];for(const m of d){if(m.size>2*1024*1024*1024){J(`${m.name} boyutu 2 GB'dan büyük olamaz.`,"error");continue}h.push(m),w.push({url:URL.createObjectURL(m),name:m.name,size:m.size,file:m})}Te(m=>[...m,...h]),Me(m=>[...m,...w]),te(!1),ze.current&&(ze.current.value="")},as=t=>{Te(n=>n.filter((o,c)=>c!==t)),Me(n=>{const o=n[t];if(o&&o.url&&o.url.startsWith("blob:"))try{URL.revokeObjectURL(o.url)}catch{}return n.filter((c,d)=>d!==t)})},nt=t=>{const n=t.target.files[0];if(n){if(n.size>2*1024*1024*1024){J("Dosya boyutu 2 GB'dan büyük olamaz.","error");return}Te([]),Me([]),ke(n),Ue.current=n.type.startsWith("video/")||["mp4","webm","ogg","mov","m4v"].includes(n.name.split(".").pop().toLowerCase()),te(!1)}};a.useEffect(()=>{!l||!s||(ee.trim().length>0||z!==null||xe.length>0?_e||(Ze(!0),l.emit("portal_typing",{portalId:s,isTyping:!0})):_e&&(l.emit("portal_typing",{portalId:s,isTyping:!1}),Ze(!1)))},[ee,z,xe,s,l,_e]),a.useEffect(()=>()=>{l&&s&&_e&&l.emit("portal_typing",{portalId:s,isTyping:!1})},[s,l,_e]);const St=async()=>{var B,O;const t=ee.trim().length>0,n=!!z,o=xe.length>0;if(!t&&!n&&!o)return;l&&s&&l.emit("portal_typing",{portalId:s,isTyping:!1}),Ze(!1);const c={content:ee,media:z,mediaFiles:[...xe],mediaPreviews:[...ge]},d=z&&z.type==="youtube",h=`temp-${Date.now()}`;let w=null,m=null;d?(w=z.url,m="youtube"):o?(w=ge.map(v=>v.url),m="image"):z&&(w=URL.createObjectURL(z),m=z.type.startsWith("video")?"video":z.type.includes("gif")?"gif":"image");const F=m==="video",T={_id:h,content:ee,media:w,mediaType:m||"none",author:f,createdAt:new Date().toISOString(),likes:[],likeCount:0,isOptimistic:!0,quotedPost:W,isProcessing:!!F,processingProgress:0,estimatedTime:F?"Hesaplanıyor...":""};x(v=>[T,...v]),je(""),ke(null),Te([]),Me([]),te(!1),Xe(!0),Re(0);try{let v=null,R=null,le=null,ye=null,Ke=null;if(d)le=c.media.url,ye="youtube";else if(c.mediaFiles&&c.mediaFiles.length>0){const Q=c.mediaFiles.length,u=new Array(Q).fill(0),D=c.mediaFiles.map((A,H)=>Et(A,"post",s,me=>{u[H]=me;const ae=Math.round(u.reduce((ce,fe)=>ce+fe,0)/Q);Re(ae),x(ce=>ce.map(fe=>String(fe._id)===String(h)?{...fe,uploadProgress:ae}:fe))}));R=await Promise.all(D)}else if(c.media)if(Ue.current){At.getState().startVideoUpload({file:c.media,portalId:s,channel:I,content:c.content,quotedPostId:W==null?void 0:W._id,onFinish:(Q,u)=>{if(Q)x(D=>D.filter(A=>String(A._id)!==String(h))),J("Video yükleme başarısız oldu.","error");else if(u){const D=String(h);x(A=>{const H=String(u._id);return A.some(ae=>String(ae._id)===H)?A.filter(ae=>String(ae._id)!==D):A.map(ae=>{if(String(ae._id)===D){const ce=u,fe=ce.quotedPost&&(typeof ce.quotedPost=="string"?ce.quotedPost:ce.quotedPost._id);return fe&&ae.quotedPost&&fe===ae.quotedPost._id&&(ce.quotedPost=ae.quotedPost),ce}return ae})})}}}),Xe(!1),qe(null);return}else v=await Et(c.media,"post",s,Q=>{Re(Q),x(u=>u.map(D=>String(D._id)===String(h)?{...D,uploadProgress:Q}:D))});else Re(100);const ne={content:c.content,portalId:s,channel:I,quotedPostId:W==null?void 0:W._id};R&&R.length>0?(ne.mediaKeys=R,ne.mediaType="image"):v?(ne.mediaKey=v,Ue.current?ne.mediaType="video":c.media&&(c.media.type==="application/pdf"||c.media.name.toLowerCase().endsWith(".pdf"))&&(ne.pdfName=c.media.name,ne.pdfSize=c.media.size)):le&&(ne.media=le,ne.mediaType=ye);const Ae=await ue.post("/api/posts",ne);qe(null);const Ee=String(h);x(Q=>{const u=String(Ae.data._id);return Q.some(A=>String(A._id)===u)?Q.filter(A=>String(A._id)!==Ee):Q.map(A=>{if(String(A._id)===Ee){const H=Ae.data,me=H.quotedPost&&(typeof H.quotedPost=="string"?H.quotedPost:H.quotedPost._id);return me&&A.quotedPost&&me===A.quotedPost._id&&(H.quotedPost=A.quotedPost),H}return A})})}catch(v){const R=((O=(B=v.response)==null?void 0:B.data)==null?void 0:O.message)||v.message;J(R,"error"),x(le=>le.filter(ye=>String(ye._id)!==String(h))),je(c.content),ke(c.media),Te(c.mediaFiles||[]),Me(c.mediaPreviews||[])}finally{Xe(!1),Re(0)}},[at,Fe]=a.useState(!1),[it,is]=a.useState("overview"),[Os,Hs]=a.useState(!1),[Qs,rs]=a.useState({name:"",description:"",privacy:"public"});a.useRef(null),a.useRef(null),a.useEffect(()=>{s&&!_&&Ct()},[s,_]),a.useEffect(()=>{if(!_&&i&&i.channels&&i.channels.length>0)if(I){if(!i.channels.some(n=>String(n._id)===String(I))){const n=i.channels.find(o=>o.name==="genel"||o.name==="general")||i.channels[0];n&&p(n._id)}}else{if(S){const n=i.channels.find(o=>String(o._id)===String(S));if(n){p(n._id);return}}const t=i.channels.find(n=>n.name==="genel"||n.name==="general")||i.channels[0];t&&p(t._id)}},[i,_]),a.useLayoutEffect(()=>(g&&g(!1),()=>{g&&g(!1)}),[s,g]),a.useEffect(()=>{s&&I&&i&&ct(i._id,s)&&Ye()},[s,I,i==null?void 0:i._id]),a.useEffect(()=>{if(U&&!$&&!G&&Array.isArray(y)&&y.length>0){const t=document.getElementById(`post-${U}`);t&&setTimeout(()=>{t.scrollIntoView({behavior:"smooth",block:"center"}),t.classList.add("highlight-post"),setTimeout(()=>t.classList.remove("highlight-post"),2e3),Qe(!0)},100)}},[U,y,G,$]),a.useEffect(()=>{var t,n;if(i&&f){const o=((t=i.members)==null?void 0:t.includes(f._id))||((n=f.joinedPortals)==null?void 0:n.some(c=>c._id===i._id||c===i._id));Ce(!!o)}},[i,f]);const Ct=async()=>{(!i||i._id!==s)&&(Z(!0),et(!1));try{const t=await ue.get(`/api/portals/${s}`);P(t.data),rs({name:t.data.name,description:t.data.description||"",privacy:t.data.privacy||"public"})}catch(t){if(t.response&&t.response.status===403){const n=t.response.data;n.portalStatus==="suspended"||n.portalStatus==="closed"?(he({portalStatus:n.portalStatus,statusReason:n.statusReason,suspendedUntil:n.suspendedUntil,portalName:n.portalName,portalAvatar:n.portalAvatar}),re("suspended")):re("blocked")}else t.response&&t.response.status===404?re("blocked"):re("Portal yüklenemedi")}finally{Z(!1)}},Ve=a.useRef(null),_t=a.useRef(y);_t.current=y;const rt=a.useRef(I);rt.current=I;const Ye=a.useCallback(async(t=!1)=>{var n,o;t?It(!0):(Ve.current&&Ve.current.abort(),Ve.current=new AbortController,ie(!0),x([]),ot(!0));try{const c=localStorage.getItem("token"),d={signal:(n=Ve.current)==null?void 0:n.signal,...c&&{headers:{Authorization:`Bearer ${c}`}}},h=rt.current;if(t&&h!==rt.current)return;let w=`/api/portals/${s}/posts?channel=${h}&limit=10`;const m=_t.current;if(t&&m.length>0){const B=m[m.length-1];w+=`&before=${B.createdAt}`}const T=(await ue.get(w,d)).data;T.length<10&&ot(!1),x(t?B=>{const O=new Set(B.map(R=>R._id)),v=T.filter(R=>!O.has(R._id));return[...B,...v]}:T),re("")}catch(c){if(ue.isCancel(c))return;((o=c.response)==null?void 0:o.status)===403?re("private"):re("Gönderiler yüklenemedi")}finally{t||ie(!1),It(!1),Z(!1)}},[s]),[Pt,ot]=a.useState(!0),[lt,It]=a.useState(!1),Ge=a.useRef(),os=a.useCallback(t=>{lt||(Ge.current&&Ge.current.disconnect(),Ge.current=new IntersectionObserver(n=>{n[0].isIntersecting&&Pt&&Ye(!0)},{root:tt.current,rootMargin:"200px"}),t&&Ge.current.observe(t))},[lt,Pt,Ye]);a.useEffect(()=>{x([]),ot(!0),p(null),P(null),re(""),g(!1)},[s]);const ls=a.useCallback(t=>{x(n=>n.filter(o=>String(o._id)!==String(t)))},[x]),cs=a.useCallback((t,n)=>{n&&x(o=>o.filter(c=>String(c._id)!==String(t)))},[x]),ds=a.useCallback(async t=>{try{const o=(await ue.put(`/api/posts/${t}/pin`)).data;x(c=>c.map(h=>h._id===t?o:h).sort((h,w)=>h.isPinned===w.isPinned?new Date(w.createdAt)-new Date(h.createdAt):h.isPinned?-1:1))}catch{J("Sabitleme işlemi başarısız","error")}},[x,J]),zt=async()=>{var t,n;if(!f){J("Lütfen giriş yapın veya kaydolun!","warning");return}try{const o=localStorage.getItem("token"),c=o?{headers:{Authorization:`Bearer ${o}`}}:{};if((await ue.post(`/api/portals/${s}/join`,{},c)).data.status==="joined"){Ce(!0);const h={...f,joinedPortals:[...f.joinedPortals||[],i]};E(h),P(w=>({...w,members:[...w.members||[],f._id]})),Ye(),J("Portala başarıyla katıldınız!","success")}else J("Üyelik isteğiniz gönderildi!","info"),P(h=>({...h,isRequested:!0}))}catch(o){J(((n=(t=o.response)==null?void 0:t.data)==null?void 0:n.message)||"Katılma başarısız","error")}},ct=(t,n)=>{if(!t||!n)return!1;const o=typeof t=="object"?t.toString():t,c=typeof n=="object"?n.toString():n;return o===c},Tt=f&&i&&i.owner&&ct(i.owner._id||i.owner,f._id),Mt=Tt||f&&i&&i.admins&&i.admins.some(t=>ct(t._id||t,f._id));if(a.useEffect(()=>{if(!(K!=null&&K.suspendedUntil)){Se(null);return}const t=()=>{const o=new Date,d=new Date(K.suspendedUntil)-o;if(d<=0){Se(null),window.location.reload();return}Se({days:Math.floor(d/(1e3*60*60*24)),hours:Math.floor(d/(1e3*60*60)%24),minutes:Math.floor(d/(1e3*60)%60),seconds:Math.floor(d/1e3%60)})};t();const n=setInterval(t,1e3);return()=>clearInterval(n)},[K]),ve==="suspended"&&K){const t=K.portalStatus==="suspended",n=K.suspendedUntil?new Date(K.suspendedUntil).toLocaleString("tr-TR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):null;return e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx($e,{}),e.jsx("div",{className:"suspension-screen",children:e.jsxs("div",{className:"suspension-card",children:[e.jsx("div",{className:"suspension-icon",children:t?"⏸️":"🔒"}),e.jsx("h1",{className:"suspension-title",children:K.portalName||"Portal"}),e.jsx("h2",{className:"suspension-subtitle",children:t?"Bu portal geçici olarak askıya alındı":"Bu portal kapatılmıştır"}),K.statusReason&&e.jsxs("div",{className:"suspension-reason",children:[e.jsx("div",{className:"suspension-reason-label",children:"Sebep"}),e.jsx("p",{children:K.statusReason})]}),t&&n&&e.jsxs("div",{className:"suspension-unlock",children:[e.jsx("div",{className:"suspension-unlock-label",children:"🔓 Erişim Açılma Tarihi"}),e.jsx("div",{className:"suspension-unlock-date",children:n}),de&&e.jsxs("div",{className:"suspension-countdown",children:[e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(de.days).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Gün"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(de.hours).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saat"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(de.minutes).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Dakika"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(de.seconds).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saniye"})]})]})]}),e.jsxs("div",{className:"suspension-policy",children:[e.jsx("span",{children:"📋"}),e.jsxs("p",{children:["Askıya alma nedenleri, platformun ",e.jsx("strong",{children:"Politika ve Koşullar"}),"'ı kapsamında değerlendirilmektedir. Detaylı bilgi için kurallarımızı inceleyebilirsiniz."]})]}),e.jsx("button",{onClick:()=>M("/"),className:"suspension-home-btn",children:"Anasayfaya Dön"})]})})]})}return ve==="blocked"?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx($e,{}),e.jsxs("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center",flexDirection:"column",color:"var(--text-muted)"},children:[e.jsx("div",{style:{fontSize:"3rem",marginBottom:"1rem"},children:"🚫"}),e.jsx("h2",{children:"Sonuç Bulunamadı"}),e.jsx("p",{children:"Aradığınız portala ulaşılamıyor."}),e.jsx("button",{onClick:()=>M("/"),className:"btn-save",style:{marginTop:"20px",float:"none"},children:"Anasayfaya Dön"})]})]}):Y||_||!i?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx($e,{}),e.jsx("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center"},children:e.jsx("div",{className:"spinner"})})]}):i.isNSFW&&!Wt&&!sessionStorage.getItem(`nsfw_confirmed_${s}`)?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx($e,{}),e.jsx("div",{className:"nsfw-gate-overlay",children:e.jsxs("div",{className:"nsfw-gate-card",children:[e.jsx("div",{className:"nsfw-gate-icon",children:e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]})}),e.jsx("div",{className:"nsfw-gate-badge",children:"+18"}),e.jsx("h1",{className:"nsfw-gate-title",children:"Yaş Kısıtlaması"}),e.jsxs("p",{className:"nsfw-gate-desc",children:[e.jsx("strong",{children:i.name})," portalı yetişkin içerik barındırabilir. Bu portala erişmek için 18 yaşından büyük olmanız gerekmektedir."]}),e.jsxs("div",{className:"nsfw-gate-actions",children:[e.jsx("button",{className:"nsfw-gate-confirm",onClick:()=>{sessionStorage.setItem(`nsfw_confirmed_${s}`,"true"),Ft(!0)},children:"18 yaşından büyüğüm, devam et"}),e.jsx("button",{className:"nsfw-gate-cancel",onClick:()=>M(-1),children:"Geri Dön"})]}),e.jsx("p",{className:"nsfw-gate-legal",children:"Devam ederek, yaşınızın 18'den büyük olduğunu ve yetişkin içerikle ilgili yasal sorumluluğu kabul ettiğinizi onaylarsınız."})]})})]}):e.jsxs("div",{className:`app-wrapper full-height discord-layout ${Ot?"voice-channel-active":""}`,children:[e.jsx(Ls,{title:i.name,description:i.description||`${i.name} topluluğuna katılın.`,image:X(i.avatar),type:"website",schema:{"@context":"https://schema.org","@type":"Community",name:i.name,description:i.description,url:window.location.href,memberCount:((Dt=i.members)==null?void 0:Dt.length)||0}}),!at&&e.jsx($e,{}),we.show&&e.jsxs("div",{className:`app-toast ${we.type}`,children:[e.jsx("span",{className:"app-toast-icon",children:we.type==="error"?"🚫":we.type==="success"?"✅":we.type==="warning"?"⚠️":"ℹ️"}),we.message]}),e.jsxs("div",{className:`discord-split-view ${b&&r?"mobile-feed-active":""} ${L?"sidebar-collapsed":""}`,children:[f&&e.jsx(Bs,{portal:i,isMember:be,canManage:Tt||Mt,onEdit:t=>{is(typeof t=="string"?t:"overview"),Fe(!0)},currentChannel:I,onChangeChannel:ss,className:`${k?"mobile-open":""} ${b&&r?"mobile-hidden":""}`,onShowPortalInfo:()=>kt(!0)}),e.jsxs("main",{className:`discord-main-content ${b&&!r?"mobile-content-hidden":""}`,children:[b&&!r&&e.jsx(Ds,{title:(i==null?void 0:i.name)||"Portal",showBack:!1}),(()=>{var d,h,w,m,F,T,B,O,v,R,le,ye,Ke,ne,Ae,Ee,Q;const t=(d=i==null?void 0:i.channels)==null?void 0:d.find(u=>u._id===I),n=(t==null?void 0:t.type)||"text",o=(t==null?void 0:t.name)||"...",c=n==="voice"||n==="conference";return e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{display:"flex",flex:1,overflow:"hidden"},children:c?e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column"},children:[b&&e.jsx("header",{className:"channel-top-bar",style:{flexShrink:0},children:e.jsxs("div",{className:"channel-title-wrapper",children:[e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>g(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",style:{color:"var(--primary-color)"},children:n==="voice"||n==="conference"?e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{color:"var(--primary-color)"},children:[e.jsx("path",{d:"M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"}),e.jsx("path",{d:"M19 10v2a7 7 0 0 1-14 0v-2"}),e.jsx("line",{x1:"12",y1:"19",x2:"12",y2:"23"})]}):n==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",style:{color:"var(--primary-color)"},children:o})]})}),e.jsx(a.Suspense,{fallback:e.jsx("div",{className:"skeleton-loader",children:e.jsx("p",{children:"Canlı bağlantı odası hazırlanıyor..."})}),children:n==="conference"?e.jsx(Ys,{portalId:s,channelId:I,channelName:o}):e.jsx(Vs,{portalId:s,channelId:I,channelName:o})})]}):e.jsx("div",{className:"channel-messages-area",style:{flex:1,display:"flex",flexDirection:"column"},children:G?e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"},children:[e.jsx("div",{className:"spinner"}),e.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.9rem"},children:"İçerik yükleniyor..."})]}):e.jsxs(e.Fragment,{children:[!c&&e.jsxs("header",{className:`channel-top-bar ${b?"":"desktop-only"}`,children:[e.jsxs("div",{className:"channel-title-wrapper",children:[b&&e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>g(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",children:n==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",children:o})]}),e.jsx("div",{className:"channel-header-actions",children:be&&e.jsx("button",{className:`icon-btn ${Pe?"active":""}`,onClick:()=>ut(!Pe),title:Pe?"Üyeleri Gizle":"Üyeleri Göster",style:{background:"none",border:"none",color:Pe?"var(--primary-color)":"var(--text-muted)"},children:e.jsx(zs,{size:20})})})]}),ve==="private"?e.jsx("div",{className:"portal-privacy-screen",children:e.jsxs("div",{className:"privacy-card",children:[e.jsx("div",{className:"privacy-icon",children:"🔒"}),e.jsx("img",{src:X(i.avatar),alt:"",className:"privacy-avatar",loading:"lazy",decoding:"async",width:"80",height:"80"}),e.jsx("h2",{children:i.name}),e.jsx("p",{className:"privacy-desc",children:i.description||"Bu portal gizlidir."}),e.jsx("p",{className:"privacy-hint",children:"İçeriği görmek ve mesajlaşmak için üye olmalısın."}),i.isRequested?e.jsx("button",{className:"privacy-join-btn requested",disabled:!0,children:"İstek Gönderildi"}):e.jsx("button",{className:"privacy-join-btn",onClick:zt,children:i.privacy==="private"?"Üyelik İsteği Gönder":"Portala Katıl"})]})}):e.jsxs(e.Fragment,{children:[(i==null?void 0:i.alerts)&&i.alerts.length>0&&e.jsx(Us,{alerts:i.alerts}),e.jsxs("div",{className:"portal-feed-container discord-feed",onScroll:es,ref:tt,children:[y.length===0&&!Y&&e.jsxs("div",{className:"empty-portal",children:[e.jsx("div",{className:"empty-portal-icon",children:"👋"}),e.jsxs("h3",{children:[((w=(h=i==null?void 0:i.channels)==null?void 0:h.find(u=>u._id===I))==null?void 0:w.type)==="voice"?"🎙️":((F=(m=i==null?void 0:i.channels)==null?void 0:m.find(u=>u._id===I))==null?void 0:F.type)==="conference"?"🎤":((B=(T=i==null?void 0:i.channels)==null?void 0:T.find(u=>u._id===I))==null?void 0:B.type)==="image"?"🖼️":"#",((v=(O=i==null?void 0:i.channels)==null?void 0:O.find(u=>String(u._id)===String(I)))==null?void 0:v.name)||"..."," ","kanalına hoş geldin!"]}),e.jsx("p",{children:"Bu kanalda henüz mesaj yok. İlk mesajı sen at!"})]}),Array.isArray(y)&&y.map((u,D)=>{var H;u.isBot===!0||((H=u.author)==null||H.isBot);const A=xs.enableAds;return e.jsxs(a.Fragment,{children:[e.jsx(gs,{post:u,onDelete:ls,onPin:ds,onArchive:cs,isAdmin:Mt},u._id),D<y.length-1&&e.jsx("div",{className:"post-separator"}),A]},u._id)}),e.jsx("div",{ref:os,style:{height:"40px",margin:"10px 0",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"},children:lt&&e.jsx("div",{className:"spinner-small"})})]}),(()=>{const D=2*Math.PI*20,A=D-Jt/100*D;return e.jsxs("button",{className:`floating-scroll-top portal-scroll-top ${Zt?"visible":""}`,onClick:ts,"aria-label":"Yukarı Çık",children:[e.jsxs("svg",{className:"progress-ring",width:"50",height:"50",viewBox:"0 0 50 50",children:[e.jsx("circle",{className:"progress-ring-track",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25"}),e.jsx("circle",{className:"progress-ring-fill",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25",style:{strokeDasharray:D,strokeDashoffset:A}})]}),e.jsx("div",{className:"scroll-icon",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"m18 15-6-6-6 6"})})})]})})(),f&&be?e.jsxs("div",{className:"channel-input-area",children:[Ie&&hs.createPortal(e.jsxs("div",{className:"plus-menu portal-plus-menu-portal",ref:Gt,style:{position:"fixed",top:xt.top,left:xt.left,zIndex:99999},children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{ze.current.click(),te(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("circle",{cx:"8.5",cy:"8.5",r:"1.5"}),e.jsx("polyline",{points:"21 15 16 10 5 21"})]})}),"Görsel"]}),!We&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{vt.current.click(),te(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("polygon",{points:"23 7 16 12 23 17 23 7"}),e.jsx("rect",{x:"1",y:"5",width:"15",height:"14",rx:"2",ry:"2"})]})}),"Video"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{bt.current.click(),te(!1)},children:[e.jsx("div",{className:"plus-menu-icon",style:{fontWeight:800,fontSize:"10px"},children:"GIF"}),"GIF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{jt.current.click(),te(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"})]})}),"PDF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Be(!yt),te(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"}),e.jsx("polygon",{points:"9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02",fill:"currentColor"})]})}),"YouTube"]})]})]}),document.body),e.jsx("input",{type:"file",ref:ze,onChange:ns,style:{display:"none"},accept:"image/png, image/jpeg, image/jpg, image/webp",multiple:!0}),e.jsx("input",{type:"file",ref:vt,onChange:nt,style:{display:"none"},accept:"video/mp4, video/webm, video/quicktime"}),e.jsx("input",{type:"file",ref:bt,onChange:nt,style:{display:"none"},accept:"image/gif"}),e.jsx("input",{type:"file",ref:jt,onChange:nt,style:{display:"none"},accept:".pdf"}),yt&&e.jsx("div",{className:"edit-modal-overlay",style:{zIndex:9999},children:e.jsxs("div",{className:"edit-modal-modern",style:{maxWidth:"400px",height:"auto",maxHeight:"none"},children:[e.jsxs("div",{className:"edit-modal-header-modern",children:[e.jsx("div",{className:"header-left",children:e.jsx("h3",{className:"header-title-modern",children:"YouTube Videosu Ekle"})}),e.jsx("button",{onClick:()=>Be(!1),className:"close-btn-modern",children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),e.jsxs("div",{className:"edit-modal-content-modern",style:{padding:"20px"},children:[e.jsxs("div",{className:"floating-label-group",children:[e.jsx("label",{className:"floating-label",children:"Video Bağlantısı"}),e.jsx("input",{type:"text",className:"floating-input",placeholder:"https://www.youtube.com/watch?v=...",value:Je,onChange:Qt,autoFocus:!0,onKeyDown:u=>{u.key==="Enter"&&(u.preventDefault(),Nt())}})]}),e.jsxs("div",{style:{marginTop:"20px",display:"flex",justifyContent:"flex-end",gap:"10px"},children:[e.jsx("button",{onClick:()=>Be(!1),className:"join-btn outline",style:{padding:"8px 16px"},children:"İptal"}),e.jsx("button",{onClick:Nt,className:"join-btn primary",style:{padding:"8px 20px"},children:"Ekle"})]})]})]})}),W&&e.jsxs("div",{className:"input-quoted-preview",children:[e.jsxs("div",{className:"input-quoted-preview-header",children:[(le=(R=W.author)==null?void 0:R.profile)!=null&&le.avatar?e.jsx("img",{src:X(W.author.profile.avatar),alt:"",className:"quoted-preview-avatar",loading:"lazy",decoding:"async",width:"32",height:"32"}):e.jsx("div",{className:"quoted-preview-avatar-placeholder",children:(Ke=(ye=W.author)==null?void 0:ye.username)==null?void 0:Ke.charAt(0).toUpperCase()}),e.jsxs("div",{className:"quoted-preview-meta",children:[e.jsx("span",{className:"quoted-preview-author",children:((Ae=(ne=W.author)==null?void 0:ne.profile)==null?void 0:Ae.displayName)||((Ee=W.author)==null?void 0:Ee.username)}),e.jsxs("span",{className:"quoted-preview-username",children:["@",(Q=W.author)==null?void 0:Q.username]})]}),e.jsx("button",{className:"remove-quote-btn",onClick:()=>qe(null),children:e.jsx(Ne,{size:16})})]}),e.jsxs("div",{className:"input-quoted-preview-body",children:[e.jsx("p",{className:"input-quoted-preview-text",children:W.content}),W.media&&e.jsx("div",{className:"input-quoted-preview-media",children:W.mediaType==="video"?e.jsxs("div",{className:"media-placeholder",children:[e.jsx(Ts,{size:20}),e.jsx("span",{children:"Video Alıntısı"})]}):e.jsx("img",{src:X(W.media),alt:"",loading:"lazy",decoding:"async",width:"120",height:"80"})})]})]}),We&&ee.trim()&&!z&&e.jsxs("div",{className:"image-channel-warning",style:{backgroundColor:"rgba(239, 68, 68, 0.1)",border:"1px solid rgba(239, 68, 68, 0.25)",color:"#f87171",padding:"8px 12px",borderRadius:"8px",fontSize:"13px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{flexShrink:0},children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]}),e.jsx("span",{children:"Görsel kanallarında paylaşım yapabilmek için mutlaka bir görsel eklemelisiniz."})]}),e.jsxs("div",{className:"message-input-wrapper",children:[e.jsx("button",{ref:De,className:`input-action-btn upload-btn ${Ie?"active":""}`,onClick:Kt,style:{backgroundColor:"#383a40",borderRadius:"50%",width:"32px",height:"32px",marginRight:"12px",color:Ie?"var(--primary-color)":"#b9bbbe"},children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z"})})}),z&&e.jsxs("div",{className:"input-media-preview",style:{marginRight:"12px",display:"flex",alignItems:"center",backgroundColor:"var(--bg-secondary)",borderRadius:"8px",padding:"4px",gap:"8px",border:"1px solid var(--border-subtle)"},children:[z.type==="youtube"&&z.preview?e.jsx("img",{src:z.preview,alt:"Video Preview",style:{width:"40px",height:"30px",objectFit:"cover",borderRadius:"4px"},loading:"lazy",decoding:"async",width:"40",height:"30"}):e.jsx("span",{style:{fontSize:"20px",lineHeight:1,padding:"4px"},children:z.type.startsWith("video")?"🎥":z.type.includes("gif")?"👾":z.type==="application/pdf"||z.name&&z.name.toLowerCase().endsWith(".pdf")?"📄":"🖼️"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",maxWidth:"100px"},children:e.jsx("span",{style:{fontSize:"10px",color:"var(--text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:z.name||"Medya"})}),e.jsx("button",{onClick:()=>ke(null),style:{background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer"},children:"×"})]}),e.jsx("input",{type:"text",placeholder:We?"Gönderi paylaşmak için bir görsel ekleyin...":`#${(se==null?void 0:se.name)||"..."} kanalına mesaj gönder`,value:ee,onChange:u=>{je(u.target.value)},onKeyDown:u=>{u.key==="Enter"&&!u.shiftKey&&(u.preventDefault(),St())}}),e.jsx("div",{className:"input-right-actions",children:e.jsx("button",{className:"input-action-btn send-btn",onClick:St,disabled:wt||(We?!z&&xe.length===0:!ee.trim()&&!z&&xe.length===0),title:"Gönder",style:{color:ee.trim()||z||xe.length>0?"var(--primary-color)":"var(--text-tertiary)"},children:wt?e.jsxs("div",{className:"compose-spinner-wrapper",style:{width:"20px",height:"20px"},children:[e.jsx("div",{className:"compose-spinner",style:{width:"20px",height:"20px",borderTopColor:"var(--primary-color)"}}),e.jsxs("span",{className:"compose-progress-text",style:{fontSize:"7px",color:"var(--text-primary)"},children:[Vt,"%"]})]}):e.jsx(Ms,{size:20})})})]}),ge&&ge.length>0&&e.jsxs("div",{className:"portal-image-previews-container",children:[e.jsxs("div",{className:"portal-image-previews-header",children:[e.jsxs("span",{className:"portal-image-previews-count",children:["Seçilen Görseller (",ge.length,"/10)"]}),ge.length<10&&e.jsx("button",{type:"button",className:"portal-add-more-images-btn",onClick:()=>{var u;return(u=ze.current)==null?void 0:u.click()},children:"+ Görsel Ekle"})]}),e.jsx("div",{className:"portal-image-previews-list",children:ge.map((u,D)=>e.jsxs("div",{className:"portal-image-preview-item",children:[e.jsx("img",{src:u.url,alt:`Preview ${D+1}`,className:"portal-image-preview-thumb"}),e.jsx("button",{type:"button",className:"portal-image-remove-btn",onClick:()=>as(D),title:"Görseli Kaldır",children:e.jsx(Ne,{size:14})}),e.jsx("span",{className:"portal-image-index-badge",children:D+1})]},D))})]}),oe&&oe.length>0&&e.jsxs("div",{className:"portal-typing-indicator",style:{marginTop:"8px"},children:[e.jsx("div",{className:"typing-avatars-group",children:oe.map(u=>e.jsx("img",{src:X(u.avatar),alt:u.displayName,className:"typing-avatar",title:u.displayName},u.userId))}),e.jsx("span",{className:"typing-text",children:oe.length===1?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," yazıyor..."]}):oe.length===2?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," ve ",e.jsx("strong",{children:oe[1].displayName})," yazıyor..."]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," ve ",oe.length-1," kişi daha yazıyor..."]})})]})]}):e.jsx("div",{className:"channel-input-area",style:{padding:"0 20px 24px 20px",backgroundColor:"transparent",borderTop:"none"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--glass-bg)",padding:"12px 20px",borderRadius:"8px",border:"1px solid var(--glass-border)",backdropFilter:"blur(20px) saturate(160%)",WebkitBackdropFilter:"blur(20px) saturate(160%)",boxShadow:"var(--glass-shadow)"},children:[e.jsxs("span",{style:{color:"var(--text-secondary)",fontWeight:500,fontSize:"14px"},children:["Bu kanalda mesaj göndermek için ",f?"portala katılmalısın.":"giriş yapmalısın."]}),f?e.jsx("button",{className:"privacy-join-btn",onClick:zt,disabled:i.isRequested,style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:i.isRequested?"İstek Gönderildi":"Portala Katıl"}):e.jsx("button",{className:"privacy-join-btn",onClick:()=>M("/login"),style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:"Giriş Yap"})]})})]})]})})}),Pe&&e.jsx(qs,{members:[...i.owner?[{...i.owner,role:"owner"}]:[],...(i.admins||[]).map(u=>({...u,role:"admin"})),...i.members||[]].filter((u,D,A)=>{const H=String(u._id||u.id||u);return u&&A.findIndex(me=>String(me._id||me.id||me)===H)===D}),onClose:()=>ut(!1)})]})})()]})]}),at&&it!=="notifications"&&e.jsx(a.Suspense,{fallback:null,children:e.jsx(Ws,{portal:i,currentUser:f,initialTab:it,onClose:()=>Fe(!1),onUpdate:t=>{P(t)}})}),at&&it==="notifications"&&e.jsx("div",{className:"portal-notifications-modal",onClick:()=>Fe(!1),children:e.jsxs("div",{className:"notifications-modal-content",onClick:t=>t.stopPropagation(),children:[e.jsx("button",{className:"close-notifications-btn",onClick:()=>Fe(!1),children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsx(a.Suspense,{fallback:null,children:e.jsx(Fs,{portalId:i._id,portalChannels:i.channels||[],onUpdate:Ct})})]})}),Yt&&i&&e.jsx($s,{portal:i,onClose:()=>kt(!1),isMobile:b})]})};export{fn as default};
