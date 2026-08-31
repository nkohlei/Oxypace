const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PortalSettingsModal-CKrytIeY.js","assets/vendor-Ccz3lySg.js","assets/index-CfBh_GUQ.js","assets/socket-BWmHxjeR.js","assets/livekit-BrEIEo-0.js","assets/lucide-DQ2wz0ea.js","assets/index-C4CPc_Ir.css","assets/ImageCropper-DoRrzA27.js","assets/ImageCropper-D3thH9n0.css","assets/PortalSettingsModal-Dd_9NXFk.css","assets/PortalNotifications-CwUeVvA3.js","assets/PortalNotifications-iCJNwBfZ.css","assets/VoiceChannel-CFDS33Yn.js","assets/VoiceChannel-BgsXpwH7.js","assets/VoiceChannel-B28_F0zo.css","assets/ConferenceChannel-dQmHM4oa.js"])))=>i.map(i=>d[i]);
import{r as a,a1 as e,Z as ce,a2 as $t,ar as Dt,at as ds,a7 as ps,as as ms,a8 as us,ad as Oe}from"./vendor-Ccz3lySg.js";import{d as Z,i as Bt,u as ct,j as qt,f as Ke,c as dt,b as Lt,k as hs,a as Et}from"./index-CfBh_GUQ.js";import{u as xs}from"./useVideoTranscoder-DjXHbr8V.js";import{P as fs}from"./PostCard-BeBATZb5.js";import{c as gs,X as we,Y as vs,q as bs,N as ys,Z as js,_ as ws,d as ks,$ as Ns,W as Ss,a0 as Cs,u as _s,a1 as Ps,U as Is,a2 as zs,a3 as Ts}from"./lucide-DQ2wz0ea.js";import{B as At}from"./Badge-DqdW_Tg2.js";import{U as Ms}from"./UserBar-DDcjspg5.js";import{N as $e}from"./Navbar-DUdqddGM.js";import{S as Rs}from"./SubHeader-Dc5zpmn9.js";import{S as Ds}from"./SEO-CCIYYvtl.js";import"./socket-BWmHxjeR.js";import"./livekit-BrEIEo-0.js";import"./VideoDownloadModal-D0Hcbojh.js";import"./UserBadges-lv8m3aGq.js";import"./LinkPreview-BiLHQBGk.js";import"./UserAvatar-BZrCCmax.js";/* empty css                      *//* empty css                  */const Ls=({portalId:s,onClose:C})=>{const[D,k]=a.useState(""),[L,f]=a.useState([]),[z,_]=a.useState(!1),[c,W]=a.useState(new Set);a.useEffect(()=>{const r=setTimeout(async()=>{if(D.trim().length===0){f([]);return}_(!0);try{const u=await ce.get(`/api/users/search?q=${D}`);f(u.data)}catch{}finally{_(!1)}},500);return()=>clearTimeout(r)},[D]);const M=async v=>{var r,u;try{await Promise.all([ce.post(`/api/portals/${s}/invite`,{userId:v}),ce.post("/api/messages",{recipientId:v,portalId:s,content:"Seni bir portala davet ettim!"})]),W(N=>new Set(N).add(v))}catch(N){alert(((u=(r=N.response)==null?void 0:r.data)==null?void 0:u.message)||"İşlem sırasında bir hata oluştu.")}},b=()=>{const v=`${window.location.origin}/portal/${s}`;navigator.clipboard.writeText(v),alert("Davet bağlantısı kopyalandı!")};return e.jsx("div",{className:"invite-modal-overlay",onClick:C,children:e.jsxs("div",{className:"invite-modal",onClick:v=>v.stopPropagation(),children:[e.jsxs("div",{className:"invite-header",children:[e.jsx("h2",{children:"Kullanıcı Davet Et"}),e.jsxs("div",{className:"header-actions",children:[e.jsxs("button",{className:"copy-link-btn",title:"Bağlantıyı Kopyala",onClick:b,children:[e.jsx(gs,{size:20,strokeWidth:2}),e.jsx("span",{children:"Bağlantı"})]}),e.jsx("button",{className:"close-btn",onClick:C,children:e.jsx(we,{size:24,strokeWidth:2})})]})]}),e.jsx("div",{className:"invite-search-container",children:e.jsx("input",{type:"text",className:"invite-search-input",placeholder:"Kullanıcı adı ara...",value:D,onChange:v=>k(v.target.value),autoFocus:!0})}),e.jsxs("div",{className:"invite-results custom-scrollbar",children:[z&&e.jsx("div",{className:"loading-text",children:"Aranıyor..."}),!z&&L.length===0&&D&&e.jsx("div",{className:"no-play-text",children:"Sonuç bulunamadı."}),L.map(v=>{var N;const r=v._id||v,u=c.has(r);return e.jsxs("div",{className:"invite-user-row",children:[e.jsxs("div",{className:"user-info",children:[e.jsx("img",{src:Z((N=v.profile)==null?void 0:N.avatar),alt:"",className:"user-avatar"}),e.jsx("span",{className:"user-name",children:v.username})]}),e.jsx("button",{className:`invite-btn ${u?"invited":""}`,onClick:()=>!u&&M(r),disabled:u,children:u?"Gönderildi":"Davet Et"})]},r)})]})]})})},Es=({startedAt:s,style:C={},className:D=""})=>{const{roomDuration:k,roomStartTime:L}=Bt()||{},[f,z]=a.useState("00:00");a.useEffect(()=>{if(L&&s===L&&typeof k=="number"){const M=k,b=Math.floor(M/3600),v=Math.floor(M%3600/60),r=M%60;b>0?z(`${b.toString().padStart(2,"0")}:${v.toString().padStart(2,"0")}:${r.toString().padStart(2,"0")}`):z(`${v.toString().padStart(2,"0")}:${r.toString().padStart(2,"0")}`);return}if(!s){z("00:00");return}const c=()=>{const M=Date.now(),b=Math.floor((M-s)/1e3);if(b<0){z("00:00");return}const v=Math.floor(b/3600),r=Math.floor(b%3600/60),u=b%60;v>0?z(`${v.toString().padStart(2,"0")}:${r.toString().padStart(2,"0")}:${u.toString().padStart(2,"0")}`):z(`${r.toString().padStart(2,"0")}:${u.toString().padStart(2,"0")}`)};c();const W=setInterval(c,1e3);return()=>clearInterval(W)},[s,L,k]);const _={display:"flex",alignItems:"center",fontSize:"15px",fontWeight:"800",color:"#39FF14",background:"transparent",border:"none",padding:"0 4px"};return e.jsx("div",{style:{..._,...C},className:D,children:f})},$s=({portal:s,onClose:C,isMobile:D})=>{var i,E;const[k,L]=a.useState(0),[f,z]=a.useState(!1),_=a.useRef(0),c=a.useRef(0);if(!s)return null;const W=S=>{_.current=S.touches[0].clientY,c.current=S.touches[0].clientY,z(!0)},M=S=>{if(!f)return;const w=S.touches[0].clientY;c.current=w;const de=w-_.current;de>0?L(de):L(0)},b=()=>{if(!f)return;z(!1),c.current-_.current>100&&C(),L(0)},v=new Date(s.createdAt).toLocaleDateString("tr-TR",{year:"numeric",month:"long",day:"numeric"}),r=s.privacy==="private"||s.isPrivate===!0,u=s.privacy==="restricted",T=r?{label:"Gizli",icon:e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"3",y:"11",width:"18",height:"11",rx:"3",ry:"3"}),e.jsx("path",{d:"M7 11V7a5 5 0 0 1 10 0v4"}),e.jsx("circle",{cx:"12",cy:"16.5",r:"1.5",fill:"currentColor",stroke:"none"})]})}:u?{label:"Kısıtlı",icon:e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"}),e.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),e.jsx("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]})}:{label:"Kamu",icon:e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("path",{d:"M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20"}),e.jsx("path",{d:"M2 12h20"})]})},F=e.jsxs("div",{className:"portal-info-container",children:[e.jsxs("div",{className:"portal-info-banner",children:[e.jsx("img",{src:s.coverImage?Z(s.coverImage):s.banner?Z(s.banner):"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",alt:s.name}),e.jsx("div",{className:"portal-info-avatar-wrapper",children:e.jsx("img",{src:Z(s.avatar),alt:s.name,className:"portal-info-avatar-img"})}),e.jsx("button",{className:"portal-info-close",onClick:C,"aria-label":"Kapat",children:e.jsx(we,{size:20})})]}),e.jsxs("div",{className:"portal-info-content",children:[e.jsxs("div",{className:"portal-info-header",children:[e.jsxs("h1",{children:[s.name,e.jsx(At,{type:s.isVerified?"verified":(i=s.badges)==null?void 0:i[0],size:20})]}),e.jsx("p",{className:"portal-info-tagline",children:s.description||"Bu portal için bir açıklama bulunmuyor."})]}),e.jsxs("div",{className:"portal-info-stats-grid",children:[e.jsxs("div",{className:"portal-info-stat-card",children:[e.jsx("div",{className:"portal-stat-icon-box",children:e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}),e.jsx("circle",{cx:"9",cy:"7",r:"4"}),e.jsx("path",{d:"M22 21v-2a4 4 0 0 0-3-3.87"}),e.jsx("path",{d:"M16 3.13a4 4 0 0 1 0 7.75"})]})}),e.jsxs("div",{className:"stat-data",children:[e.jsx("span",{className:"stat-value",children:s.membersCount||((E=s.members)==null?void 0:E.length)||0}),e.jsx("span",{className:"stat-label",children:"Üye"})]})]}),e.jsxs("div",{className:"portal-info-stat-card",children:[e.jsx("div",{className:"portal-stat-icon-box",children:T.icon}),e.jsxs("div",{className:"stat-data",children:[e.jsx("span",{className:"stat-value",children:T.label}),e.jsx("span",{className:"stat-label",children:"Görünürlük"})]})]})]}),e.jsxs("div",{className:"portal-info-details",children:[e.jsxs("div",{className:"detail-item",children:[e.jsx("div",{className:"detail-icon-pill",children:e.jsxs("svg",{width:"13",height:"13",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),e.jsx("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),e.jsx("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]})}),e.jsxs("span",{children:["Oluşturulma: ",e.jsx("strong",{children:v})]})]}),e.jsxs("div",{className:"detail-item",children:[e.jsx("div",{className:"detail-icon-pill",children:e.jsxs("svg",{width:"13",height:"13",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"}),e.jsx("polyline",{points:"9 12 11 14 15 10"})]})}),e.jsxs("span",{children:["Durum: ",e.jsx("strong",{children:s.isVerified||s.badges&&s.badges.length>0?"Doğrulanmış Portal":"Standart Portal"})]})]}),e.jsxs("div",{className:"detail-item",children:[e.jsx("div",{className:"detail-icon-pill",children:e.jsxs("svg",{width:"13",height:"13",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"3",y:"3",width:"7",height:"7",rx:"1.5"}),e.jsx("rect",{x:"14",y:"3",width:"7",height:"7",rx:"1.5"}),e.jsx("rect",{x:"14",y:"14",width:"7",height:"7",rx:"1.5"}),e.jsx("rect",{x:"3",y:"14",width:"7",height:"7",rx:"1.5"})]})}),e.jsxs("span",{children:["Kategori: ",e.jsx("strong",{children:s.category||"Genel"})]})]})]})]})]});return D?e.jsx("div",{className:"bottom-sheet-overlay",onClick:C,children:e.jsxs("div",{className:"bottom-sheet-content",onClick:S=>S.stopPropagation(),style:{transform:k>0?`translateY(${k}px)`:void 0,transition:f?"none":"transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"},children:[e.jsx("div",{className:"bottom-sheet-handle-wrapper",onTouchStart:W,onTouchMove:M,onTouchEnd:b,children:e.jsx("div",{className:"bottom-sheet-handle"})}),F]})}):e.jsx("div",{className:"portal-info-modal-overlay",onClick:C,children:e.jsx("div",{className:"portal-info-modal-card",onClick:S=>S.stopPropagation(),children:F})})},Bs=({portal:s,isMember:C,onEdit:D,currentChannel:k,onChangeChannel:L,className:f,canManage:z,onShowPortalInfo:_})=>{var ge,ve,Se,P;const{user:c}=ct(),[W,M]=a.useState(!1);$t();const b=qt(),{isMobileView:v}=b||{},r=(b==null?void 0:b.isDesktopSidebarCollapsed)||!1,u=(b==null?void 0:b.setIsDesktopSidebarCollapsed)||(()=>{}),N=Ke(p=>p.unreadPostsByChannel),T=Ke(p=>p.clearUnreadForChannel),{roomStartTime:F,activeRoom:i}=Bt(),{onlineUsers:E}=dt(),S=p=>{if(!p)return null;if(typeof p=="string")return p;const R=p._id||p.id;return R?String(R):null},w=new Set,de=S(s==null?void 0:s.owner);de&&w.add(de),((s==null?void 0:s.admins)||[]).forEach(p=>{const R=S(p);R&&w.add(R)}),((s==null?void 0:s.members)||[]).forEach(p=>{const R=S(p);R&&w.add(R)});const ue=new Set((E||[]).map(p=>String(p))),re=c!=null&&c._id?String(c._id):null,ke=((ve=(ge=c==null?void 0:c.settings)==null?void 0:ge.privacy)==null?void 0:ve.showOnlineStatus)!==!1;re&&w.has(re)&&ke?ue.add(re):re&&!ke&&ue.delete(re);let fe=0;if(w.forEach(p=>{ue.has(p)&&fe++}),a.useEffect(()=>{k&&(s!=null&&s._id)&&T(k,s._id)},[k,s==null?void 0:s._id,T]),!s)return null;const se=s!=null&&s.channels?[...s.channels].sort((p,R)=>(p.order||0)-(R.order||0)).map(p=>({id:p._id,name:p.name,type:p.type||"text"})):[],A=se.find(p=>p.id===k),Ne=(A==null?void 0:A.type)==="voice"||(A==null?void 0:A.type)==="conference";a.useEffect(()=>{!Ne&&r&&u(!1)},[Ne,r,u]);const he=p=>k===p;return e.jsxs("div",{className:`channel-sidebar ${r?"collapsed":""} ${f||""}`,style:{height:"calc(100% - 24px)",backgroundColor:"transparent",display:"flex",flexDirection:"column",flexShrink:0,overflow:"visible",position:"relative",borderRight:"none"},children:[!v&&Ne&&e.jsx("button",{className:"sidebar-toggle-btn",onClick:p=>{p.stopPropagation(),u(!r)},title:r?"Menüyü Göster":"Menüyü Gizle",children:r?e.jsx(vs,{size:16}):e.jsx(bs,{size:16})}),e.jsxs("div",{className:"sidebar-content-wrapper",style:{display:"flex",flexDirection:"column",flex:1,width:"100%",height:"100%",overflow:"hidden",transition:"opacity 0.2s ease, visibility 0.2s ease",opacity:r?0:1,visibility:r?"hidden":"visible",gap:"8px",padding:"0px",boxSizing:"border-box"},children:[e.jsxs("div",{className:"cs-panel cs-panel--banner",children:[e.jsxs("div",{className:"channel-banner-container",onClick:()=>_&&_(),children:[e.jsx("div",{className:"channel-banner-image",style:{backgroundImage:s.coverImage?`url(${Z(s.coverImage)})`:s.banner?`url(${Z(s.banner)})`:'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")'}}),e.jsx("div",{className:"channel-banner-overlay"})]}),e.jsxs("div",{className:"portal-quick-info",children:[e.jsxs("div",{className:"portal-info-main",onClick:()=>_&&_(),children:[e.jsxs("h2",{className:"portal-title-text",children:[s.name,e.jsx(At,{type:s.isVerified?"verified":(Se=s.badges)==null?void 0:Se[0],size:16})]}),e.jsxs("div",{className:"portal-stats-row",children:[e.jsxs("div",{className:"stat-item",children:[e.jsx(ys,{size:12}),e.jsxs("span",{children:[s.membersCount||((P=s.members)==null?void 0:P.length)||0," Üye"]})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:"stat-item",children:[e.jsx("div",{className:"online-indicator-dot"}),e.jsxs("span",{children:[fe," Çevrimiçi"]})]})]})]}),e.jsxs("div",{className:"portal-header-actions",children:[(C||z)&&e.jsx("button",{className:"portal-action-btn-circle",onClick:p=>{p.stopPropagation(),D&&D("notifications")},title:"Bildirim Ayarları",children:e.jsx(js,{size:16})}),C&&e.jsx("button",{className:"portal-action-btn-circle",onClick:p=>{p.stopPropagation(),M(!0)},title:"Davet Et",children:e.jsx(ws,{size:18})})]})]})]}),e.jsxs("div",{className:"cs-panel cs-panel--channels custom-scrollbar",children:[e.jsxs("div",{className:"cs-channels-header",children:[e.jsx("span",{children:"Kanallar"}),z&&e.jsx("div",{onClick:p=>{p.stopPropagation(),D&&D("channels")},className:"cs-add-channel-btn",title:"Kanal Oluştur",children:"+"})]}),e.jsx("div",{className:"cs-channel-list",children:se.map(p=>{var be;const R=he(p.id),He=p.type==="announcement"||p.name.includes("announcements"),J=p.type==="voice";return e.jsxs("div",{className:`channel-item ${R?"active":""}`,onClick:()=>L(p.id),style:{padding:"6px 8px",margin:"2px 0",borderRadius:"4px",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",color:R?"white":"#949ba4",backgroundColor:R?"#3f4147":"transparent",transition:"all 0.1s"},children:[e.jsx("div",{style:{color:R?"white":"var(--text-secondary)",display:"flex",alignItems:"center",minWidth:"20px",justifyContent:"center"},children:J?e.jsx(ks,{size:20,strokeWidth:2}):He?e.jsx(Ns,{size:20,strokeWidth:2.5}):p.type==="image"?e.jsx(Ss,{size:20,strokeWidth:2.5,style:{color:"#f59e0b"}}):e.jsx(Cs,{size:20,strokeWidth:2.5})}),e.jsx("span",{style:{fontWeight:R?600:500,fontSize:"16px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:R?"white":"var(--text-primary)",maxWidth:"fit-content"},children:p.name}),!R&&((be=N[p.id])==null?void 0:be.length)>0&&e.jsx("div",{style:{backgroundColor:"#f23f43",color:"white",fontSize:"11px",fontWeight:"bold",padding:"0 6px",borderRadius:"8px",minWidth:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.3)",marginLeft:"-4px",flexShrink:0},children:N[p.id].length>9?"9+":N[p.id].length}),e.jsx("div",{style:{flex:1}}),R&&J&&i&&String(i.channelId)===String(p.id)&&F&&e.jsx("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:e.jsx(Es,{startedAt:F,className:"vc-sidebar-timer"})})]},p.id)})})]}),e.jsxs("div",{className:"cs-panel cs-panel--userbar",children:[e.jsx(Ms,{currentChannelId:k}),e.jsx("div",{className:"cs-footer-copyright",children:"© 2026 Oxypace. Tüm hakları saklıdır."})]})]}),e.jsx("style",{children:`
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
            `}),W&&e.jsx(Ls,{portalId:s._id,onClose:()=>M(!1)})]})},qs=({members:s=[],onClose:C})=>{var b,v;const{onlineUsers:D}=dt(),{user:k}=ct(),L=r=>{if(!r)return"";const u=new Date,N=new Date(r),T=Math.max(0,u-N),F=Math.floor(T/6e4);if(F<1)return"şimdi";if(F<60)return`${F}m`;const i=Math.floor(F/60);if(i<24)return`${i}h`;const E=Math.floor(i/24);if(E<30)return`${E}d`;const S=Math.floor(E/30);return S<12?`${S}mo`:`${Math.floor(S/12)}y`},f=r=>{if(!r)return null;if(typeof r=="string")return r;const u=r._id||r.id;return u?String(u):null},z=new Set((D||[]).map(r=>String(r))),_=k!=null&&k._id?String(k._id):null,c=((v=(b=k==null?void 0:k.settings)==null?void 0:b.privacy)==null?void 0:v.showOnlineStatus)!==!1;_&&c?z.add(_):_&&!c&&z.delete(_);const W=s.filter(r=>{if(!r)return!1;const u=f(r);return u&&z.has(u)}),M=s.filter(r=>{if(!r)return!1;const u=f(r);return u&&!z.has(u)});return e.jsxs("div",{className:"members-sidebar custom-scrollbar",children:[e.jsxs("div",{className:"members-header-top",children:[e.jsx("h3",{children:"ÜYELER"}),C&&e.jsx("button",{onClick:C,className:"close-members-btn","aria-label":"Kapat",children:e.jsx(we,{size:20,strokeWidth:2})})]}),e.jsxs("div",{className:"members-category",children:["Çevrim içi — ",W.length]}),W.map((r,u)=>{var F,i,E;if(!r||typeof r=="string")return null;const N=r.username||"Unknown",T=r.avatar||((F=r.profile)==null?void 0:F.avatar);return e.jsxs(Dt,{to:`/profile/${N}`,className:"member-item member-link",children:[e.jsxs("div",{className:"member-avatar-wrapper",children:[T?e.jsx("img",{src:Z(T),alt:"",className:"member-avatar"}):e.jsx("div",{className:"member-avatar-placeholder",children:((i=N[0])==null?void 0:i.toUpperCase())||"?"}),e.jsx("div",{className:"status-indicator online"})]}),e.jsxs("div",{className:"member-info",children:[e.jsxs("span",{className:"member-name active-role",style:{color:"#2ecc71"},children:[((E=r.profile)==null?void 0:E.displayName)||N,(r.role==="owner"||r.isAdmin)&&e.jsx("span",{style:{marginLeft:"4px"},children:"👑"})]}),e.jsx("div",{className:"member-custom-status",children:e.jsx("span",{role:"img","aria-label":"activity",children:"🎮"})})]})]},r._id||r.id||u)}),e.jsxs("div",{className:"members-category",children:["Çevrim dışı — ",M.length]}),M.map((r,u)=>{var F,i,E;if(!r||typeof r=="string")return null;const N=r.username||"Unknown",T=r.avatar||((F=r.profile)==null?void 0:F.avatar);return e.jsxs(Dt,{to:`/profile/${N}`,className:"member-item offline member-link",children:[e.jsx("div",{className:"member-avatar-wrapper",children:T?e.jsx("img",{src:Z(T),alt:"",className:"member-avatar"}):e.jsx("div",{className:"member-avatar-placeholder",style:{backgroundColor:"var(--bg-secondary)"},children:((i=N[0])==null?void 0:i.toUpperCase())||"?"})}),e.jsx("div",{className:"member-info",style:{flex:1},children:e.jsxs("div",{className:"member-name-row",style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx("span",{className:"member-name",children:((E=r.profile)==null?void 0:E.displayName)||N}),r.lastActive&&e.jsx("span",{className:"last-active-time",style:{fontSize:"11px",color:"var(--text-muted)"},children:L(r.lastActive)})]})})]},r._id||r.id||`offline-${u}`)}),e.jsx("style",{children:`
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
            `})]})},As=({alerts:s=[]})=>{const[C,D]=a.useState(()=>{try{const c=sessionStorage.getItem("dismissed_portal_alerts");return c?JSON.parse(c):[]}catch{return[]}}),[k,L]=a.useState(null),f=s.filter(c=>!C.includes(c._id)),z=c=>{L(c),setTimeout(()=>{const W=[...C,c];D(W);try{sessionStorage.setItem("dismissed_portal_alerts",JSON.stringify(W))}catch{}L(null)},300)},_=c=>{const W=new Date,b=new Date(c)-W;if(b<=0)return null;const v=Math.floor(b/(1e3*60*60*24)),r=Math.floor(b/(1e3*60*60)%24),u=Math.floor(b/(1e3*60)%60);return v>0?`${v} gün ${r} saat kaldı`:r>0?`${r} saat ${u} dk kaldı`:`${u} dakika kaldı`};return f.length===0?null:e.jsx(e.Fragment,{children:f.map(c=>e.jsx("div",{className:`portal-alert-banner ${k===c._id?"dismissing":""}`,children:e.jsxs("div",{className:"alert-banner-inner",children:[e.jsx("div",{className:"alert-banner-icon",children:e.jsx(_s,{size:18,strokeWidth:2})}),e.jsxs("div",{className:"alert-banner-content",children:[e.jsx("div",{className:"alert-banner-label",children:e.jsx("span",{children:"Yönetici Uyarısı"})}),e.jsx("div",{className:"alert-banner-message",children:c.message}),e.jsx("div",{className:"alert-banner-meta",children:e.jsxs("span",{className:"alert-banner-time",children:[e.jsx(Ps,{size:16,strokeWidth:2}),_(c.expiresAt)||"Süresi dolmak üzere"]})})]}),e.jsx("button",{className:"alert-banner-close",onClick:()=>z(c._id),title:"Uyarıyı gizle",children:e.jsx(we,{size:16,strokeWidth:2.5})})]})},c._id))})},Us=a.lazy(()=>Oe(()=>import("./PortalSettingsModal-CKrytIeY.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9]))),Ws=a.lazy(()=>Oe(()=>import("./PortalNotifications-CwUeVvA3.js"),__vite__mapDeps([10,1,2,3,4,5,6,11]))),Fs=a.lazy(()=>Oe(()=>import("./VoiceChannel-CFDS33Yn.js"),__vite__mapDeps([12,1,4,2,3,5,6,13,14]))),Vs=a.lazy(()=>Oe(()=>import("./ConferenceChannel-dQmHM4oa.js"),__vite__mapDeps([15,1,4,2,3,5,6,13,14]))),xn=()=>{var Mt,Rt;const{id:s}=ds(),C=ps(),[D]=ms(),k=D.get("channel"),L=D.get("post"),{user:f,updateUser:z,loading:_}=ct(),{socket:c,connected:W}=dt(),M=$t(),b=qt(),{isSidebarOpen:v,closeSidebar:r,isMobileView:u,mobileChannelOpen:N,setMobileChannelOpen:T}=b||{},F=(b==null?void 0:b.isDesktopSidebarCollapsed)||!1,[i,E]=a.useState(null),S=Ke(t=>t.posts),w=Ke(t=>t.setPosts),[de,ue]=a.useState(!0),[re,ke]=a.useState(!1),[fe,se]=a.useState(""),[A,Ne]=a.useState(null),[he,ge]=a.useState(null),[ve,Se]=a.useState(!1),[P,p]=a.useState(null),[R,He]=a.useState(!1),[J,be]=a.useState(""),[ne,pt]=a.useState([]);a.useRef(null);const[Ce,Qe]=a.useState(!1),[_e,mt]=a.useState(!1),[ye,ut]=a.useState({show:!1,message:"",type:"info"}),[Ut,Wt]=a.useState(!1),[Pe,X]=a.useState(!1),[ht,xt]=a.useState({top:0,left:0}),[Ze,ft]=a.useState(""),[gt,Be]=a.useState(!1),Ie=a.useRef(null),vt=a.useRef(null),bt=a.useRef(null),yt=a.useRef(null),[I,je]=a.useState(null),[pe,ze]=a.useState([]),[xe,Te]=a.useState([]),[$,qe]=a.useState(null),[Ft,Me]=a.useState(0),[jt,Je]=a.useState(!1),Ae=a.useRef(!1);xs();const oe=Lt(t=>t.activeUploads)[`portal-${s}`];a.useEffect(()=>{oe&&oe.status==="uploading"&&w(t=>t.map(n=>n.isOptimistic&&n.mediaType==="video"?{...n,uploadProgress:oe.progress}:n))},[oe==null?void 0:oe.progress,oe==null?void 0:oe.status]);const[Vt,wt]=a.useState(!1),Gt=a.useRef(null),Re=a.useRef(null),Yt=a.useCallback(t=>{t.preventDefault(),t.stopPropagation(),X(n=>{if(!n&&Re.current){const o=Re.current.getBoundingClientRect();xt({top:o.bottom+8,left:o.left})}return!n})},[]);a.useEffect(()=>{if(!Pe)return;let t=!0;const n=()=>{if(Re.current){const d=Re.current.getBoundingClientRect();xt({top:d.bottom+8,left:d.left})}},o=d=>{if(!t)return;const h=d.target.closest(".plus-menu")||d.target.closest(".portal-plus-menu-portal"),g=d.target.closest(".upload-btn");!h&&!g&&X(!1)},l=setTimeout(()=>{t&&(document.addEventListener("click",o),document.addEventListener("touchstart",o))},0);return window.addEventListener("scroll",n,!0),window.addEventListener("resize",n),()=>{t=!1,clearTimeout(l),document.removeEventListener("click",o),document.removeEventListener("touchstart",o),window.removeEventListener("scroll",n,!0),window.removeEventListener("resize",n)}},[Pe]),a.useEffect(()=>()=>{X(!1)},[]),a.useEffect(()=>{X(!1)},[P,s]),a.useEffect(()=>{var t;(t=C.state)!=null&&t.quotedPost&&(qe(C.state.quotedPost),C.state.selectedChannelId&&p(C.state.selectedChannelId),M(C.pathname+C.search,{replace:!0,state:{}}))},[C.state,s]);const ee=(Mt=i==null?void 0:i.channels)==null?void 0:Mt.find(t=>t._id===P),Ue=(ee==null?void 0:ee.type)==="image",Kt=((ee==null?void 0:ee.type)==="voice"||(ee==null?void 0:ee.type)==="conference")&&(!u||N);a.useEffect(()=>{if(!c||!W||!s)return;c.emit("join_portal",s),c.emit("get_online_users"),P&&c.emit("join_channel",P);const t=d=>{var y,B;const h=((y=d.portal)==null?void 0:y._id)||d.portal,g=((B=d.channel)==null?void 0:B._id)||d.channel,x=String(h)===String(s),V=String(g)===String(P);x&&V&&w(q=>{if(q.some(U=>U._id===d._id))return q;const K=d.quotedPost&&(typeof d.quotedPost=="string"?d.quotedPost:d.quotedPost._id);if(K){const U=q.find(le=>le._id===K);U&&typeof U=="object"&&U.author?d.quotedPost=U:$&&K===$._id&&(d.quotedPost=$)}return[d,...q]})},n=d=>{var x;const h=((x=d.portal)==null?void 0:x._id)||d.portal;String(h)===String(s)&&w(V=>V.map(y=>y._id===d._id?d:y))},o=({userId:d,status:h,lastActive:g})=>{h==="offline"&&pt(x=>x.filter(V=>String(V.userId)!==String(d))),E(x=>{if(!x||!x.members)return x;const V=x.members.map(y=>{const B=y._id||y.id||y;return String(B)===String(d)&&typeof y=="object"&&y!==null?{...y,lastActive:g||new Date}:y});return{...x,members:V}})},l=({userId:d,username:h,displayName:g,avatar:x,isTyping:V})=>{String(d)!==String(f==null?void 0:f._id)&&pt(y=>V?y.some(B=>String(B.userId)===String(d))?y:[...y,{userId:d,username:h,displayName:g,avatar:x}]:y.filter(B=>String(B.userId)!==String(d)))};return c.on("post:created",t),c.on("post:updated",n),c.on("user_status_change",o),c.on("portal_typing_update",l),()=>{c.off("post:created",t),c.off("post:updated",n),c.off("user_status_change",o),c.off("portal_typing_update",l)}},[c,W,s,P,f==null?void 0:f._id]);const Ot=t=>{if(!t)return null;const n=/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,o=t.match(n);return o&&o[2].length===11?o[2]:null},Ht=t=>{const n=t.target.value;ft(n)},kt=()=>{const t=Ot(Ze);if(!t){H("Geçersiz YouTube URL'si","error");return}je({name:"YouTube Video",type:"youtube",preview:`https://img.youtube.com/vi/${t}/hqdefault.jpg`,url:Ze}),Be(!1),ft("")},[Qt,Xe]=a.useState(!1),[Zt,Jt]=a.useState(0),et=a.useRef(null),tt=a.useRef(null),De=a.useRef(null),Xt=a.useCallback(t=>{const n=t.target;tt.current||(tt.current=requestAnimationFrame(()=>{tt.current=null;const o=n.scrollTop,l=o>300;Xe(h=>h!==l?l:h);const d=n.scrollHeight-n.clientHeight;if(d>0){const h=Math.round(o/d*100);Jt(g=>Math.abs(g-h)>=2?h:g)}}))},[]),es=a.useCallback(t=>{t&&(t.preventDefault(),t.stopPropagation()),De.current&&cancelAnimationFrame(De.current);const n=et.current||document.querySelector(".discord-feed")||document.querySelector(".portal-feed-container");if(!n){window.scrollTo({top:0,behavior:"smooth"});return}const o=n.scrollTop;if(o<=0)return;const l=800,d=performance.now(),h=x=>1-Math.pow(1-x,5),g=x=>{const V=x-d,y=Math.min(V/l,1),B=h(y);n.scrollTop=Math.round(o*(1-B)),y<1?De.current=requestAnimationFrame(g):(n.scrollTop=0,De.current=null)};De.current=requestAnimationFrame(g)},[]),ts=t=>{p(t),Xe(!1),u&&(r(),T(!0))},H=a.useCallback((t,n="info")=>{ut({show:!0,message:t,type:n}),setTimeout(()=>ut(o=>({...o,show:!1})),4e3)},[]),ss=t=>{const n=Array.from(t.target.files||[]);if(n.length===0)return;je(null),Ae.current=!1;const l=10-pe.length;if(l<=0){H("Bir gönderiye en fazla 10 görsel ekleyebilirsiniz.","warning");return}const d=n.slice(0,l);n.length>l&&H(`En fazla 10 görsel ekleyebilirsiniz. İlk ${l} görsel eklendi.`,"warning");const h=[],g=[];for(const x of d){if(x.size>2*1024*1024*1024){H(`${x.name} boyutu 2 GB'dan büyük olamaz.`,"error");continue}h.push(x),g.push({url:URL.createObjectURL(x),name:x.name,size:x.size,file:x})}ze(x=>[...x,...h]),Te(x=>[...x,...g]),X(!1),Ie.current&&(Ie.current.value="")},ns=t=>{ze(n=>n.filter((o,l)=>l!==t)),Te(n=>{const o=n[t];if(o&&o.url&&o.url.startsWith("blob:"))try{URL.revokeObjectURL(o.url)}catch{}return n.filter((l,d)=>d!==t)})},st=t=>{const n=t.target.files[0];if(n){if(n.size>2*1024*1024*1024){H("Dosya boyutu 2 GB'dan büyük olamaz.","error");return}ze([]),Te([]),je(n),Ae.current=n.type.startsWith("video/")||["mp4","webm","ogg","mov","m4v"].includes(n.name.split(".").pop().toLowerCase()),X(!1)}};a.useEffect(()=>{!c||!s||(J.trim().length>0||I!==null||pe.length>0?Ce||(Qe(!0),c.emit("portal_typing",{portalId:s,isTyping:!0})):Ce&&(c.emit("portal_typing",{portalId:s,isTyping:!1}),Qe(!1)))},[J,I,pe,s,c,Ce]),a.useEffect(()=>()=>{c&&s&&Ce&&c.emit("portal_typing",{portalId:s,isTyping:!1})},[s,c,Ce]);const Nt=async()=>{var y,B;const t=J.trim().length>0,n=!!I,o=pe.length>0;if(!t&&!n&&!o)return;c&&s&&c.emit("portal_typing",{portalId:s,isTyping:!1}),Qe(!1);const l={content:J,media:I,mediaFiles:[...pe],mediaPreviews:[...xe]},d=I&&I.type==="youtube",h=`temp-${Date.now()}`;let g=null,x=null;d?(g=I.url,x="youtube"):o?(g=xe.map(q=>q.url),x="image"):I&&(g=URL.createObjectURL(I),x=I.type.startsWith("video")?"video":I.type.includes("gif")?"gif":"image");const V={_id:h,content:J,media:g,mediaType:x||"none",author:f,createdAt:new Date().toISOString(),likes:[],likeCount:0,isOptimistic:!0,quotedPost:$};w(q=>[V,...q]),be(""),je(null),ze([]),Te([]),X(!1),Je(!0),Me(0);try{let q=null,K=null,U=null,le=null,Ye=null;if(d)U=l.media.url,le="youtube";else if(l.mediaFiles&&l.mediaFiles.length>0){const O=l.mediaFiles.length,Q=new Array(O).fill(0),m=l.mediaFiles.map((j,G)=>Et(j,"post",s,ae=>{Q[G]=ae;const Y=Math.round(Q.reduce((ie,me)=>ie+me,0)/O);Me(Y),w(ie=>ie.map(me=>String(me._id)===String(h)?{...me,uploadProgress:Y}:me))}));K=await Promise.all(m)}else if(l.media)if(Ae.current){Lt.getState().startVideoUpload({file:l.media,portalId:s,channel:P,content:l.content,quotedPostId:$==null?void 0:$._id,onFinish:(O,Q)=>{if(O)w(m=>m.filter(j=>String(j._id)!==String(h))),H("Video yükleme başarısız oldu.","error");else if(Q){const m=String(h);w(j=>{const G=String(Q._id);return j.some(Y=>String(Y._id)===G)?j.filter(Y=>String(Y._id)!==m):j.map(Y=>{if(String(Y._id)===m){const ie=Q,me=ie.quotedPost&&(typeof ie.quotedPost=="string"?ie.quotedPost:ie.quotedPost._id);return me&&Y.quotedPost&&me===Y.quotedPost._id&&(ie.quotedPost=Y.quotedPost),ie}return Y})})}}}),Je(!1),qe(null);return}else q=await Et(l.media,"post",s,O=>{Me(O),w(Q=>Q.map(m=>String(m._id)===String(h)?{...m,uploadProgress:O}:m))});else Me(100);const te={content:l.content,portalId:s,channel:P,quotedPostId:$==null?void 0:$._id};K&&K.length>0?(te.mediaKeys=K,te.mediaType="image"):q?(te.mediaKey=q,Ae.current?te.mediaType="video":l.media&&(l.media.type==="application/pdf"||l.media.name.toLowerCase().endsWith(".pdf"))&&(te.pdfName=l.media.name,te.pdfSize=l.media.size)):U&&(te.media=U,te.mediaType=le);const Le=await ce.post("/api/posts",te);qe(null);const Ee=String(h);w(O=>{const Q=String(Le.data._id);return O.some(j=>String(j._id)===Q)?O.filter(j=>String(j._id)!==Ee):O.map(j=>{if(String(j._id)===Ee){const G=Le.data,ae=G.quotedPost&&(typeof G.quotedPost=="string"?G.quotedPost:G.quotedPost._id);return ae&&j.quotedPost&&ae===j.quotedPost._id&&(G.quotedPost=j.quotedPost),G}return j})})}catch(q){const K=((B=(y=q.response)==null?void 0:y.data)==null?void 0:B.message)||q.message;H(K,"error"),w(U=>U.filter(le=>String(le._id)!==String(h))),be(l.content),je(l.media),ze(l.mediaFiles||[]),Te(l.mediaPreviews||[])}finally{Je(!1),Me(0)}},[nt,We]=a.useState(!1),[at,as]=a.useState("overview"),[Ks,Os]=a.useState(!1),[Hs,is]=a.useState({name:"",description:"",privacy:"public"});a.useRef(null),a.useRef(null),a.useEffect(()=>{s&&!_&&St()},[s,_]),a.useEffect(()=>{if(!_&&i&&i.channels&&i.channels.length>0)if(P){if(!i.channels.some(n=>String(n._id)===String(P))){const n=i.channels.find(o=>o.name==="genel"||o.name==="general")||i.channels[0];n&&p(n._id)}}else{if(k){const n=i.channels.find(o=>String(o._id)===String(k));if(n){p(n._id);return}}const t=i.channels.find(n=>n.name==="genel"||n.name==="general")||i.channels[0];t&&p(t._id)}},[i,_]),a.useLayoutEffect(()=>(T&&T(!1),()=>{T&&T(!1)}),[s,T]),a.useEffect(()=>{s&&P&&i&&lt(i._id,s)&&Ve()},[s,P,i==null?void 0:i._id]),a.useEffect(()=>{if(L&&!R&&!re&&Array.isArray(S)&&S.length>0){const t=document.getElementById(`post-${L}`);t&&setTimeout(()=>{t.scrollIntoView({behavior:"smooth",block:"center"}),t.classList.add("highlight-post"),setTimeout(()=>t.classList.remove("highlight-post"),2e3),He(!0)},100)}},[L,S,re,R]),a.useEffect(()=>{var t,n;if(i&&f){const o=((t=i.members)==null?void 0:t.includes(f._id))||((n=f.joinedPortals)==null?void 0:n.some(l=>l._id===i._id||l===i._id));Se(!!o)}},[i,f]);const St=async()=>{(!i||i._id!==s)&&(ue(!0),Xe(!1));try{const t=await ce.get(`/api/portals/${s}`);E(t.data),is({name:t.data.name,description:t.data.description||"",privacy:t.data.privacy||"public"})}catch(t){if(t.response&&t.response.status===403){const n=t.response.data;n.portalStatus==="suspended"||n.portalStatus==="closed"?(Ne({portalStatus:n.portalStatus,statusReason:n.statusReason,suspendedUntil:n.suspendedUntil,portalName:n.portalName,portalAvatar:n.portalAvatar}),se("suspended")):se("blocked")}else t.response&&t.response.status===404?se("blocked"):se("Portal yüklenemedi")}finally{ue(!1)}},Fe=a.useRef(null),Ct=a.useRef(S);Ct.current=S;const it=a.useRef(P);it.current=P;const Ve=a.useCallback(async(t=!1)=>{var n,o;t?Pt(!0):(Fe.current&&Fe.current.abort(),Fe.current=new AbortController,ke(!0),w([]),rt(!0));try{const l=localStorage.getItem("token"),d={signal:(n=Fe.current)==null?void 0:n.signal,...l&&{headers:{Authorization:`Bearer ${l}`}}},h=it.current;if(t&&h!==it.current)return;let g=`/api/portals/${s}/posts?channel=${h}&limit=10`;const x=Ct.current;if(t&&x.length>0){const B=x[x.length-1];g+=`&before=${B.createdAt}`}const y=(await ce.get(g,d)).data;y.length<10&&rt(!1),w(t?B=>{const q=new Set(B.map(U=>U._id)),K=y.filter(U=>!q.has(U._id));return[...B,...K]}:y),se("")}catch(l){if(ce.isCancel(l))return;((o=l.response)==null?void 0:o.status)===403?se("private"):se("Gönderiler yüklenemedi")}finally{t||ke(!1),Pt(!1),ue(!1)}},[s]),[_t,rt]=a.useState(!0),[ot,Pt]=a.useState(!1),Ge=a.useRef(),rs=a.useCallback(t=>{ot||(Ge.current&&Ge.current.disconnect(),Ge.current=new IntersectionObserver(n=>{n[0].isIntersecting&&_t&&Ve(!0)},{root:et.current,rootMargin:"200px"}),t&&Ge.current.observe(t))},[ot,_t,Ve]);a.useEffect(()=>{w([]),rt(!0),p(null),E(null),se(""),T(!1)},[s]);const os=a.useCallback(t=>{w(n=>n.filter(o=>String(o._id)!==String(t)))},[w]),ls=a.useCallback((t,n)=>{n&&w(o=>o.filter(l=>String(l._id)!==String(t)))},[w]),cs=a.useCallback(async t=>{try{const o=(await ce.put(`/api/posts/${t}/pin`)).data;w(l=>l.map(h=>h._id===t?o:h).sort((h,g)=>h.isPinned===g.isPinned?new Date(g.createdAt)-new Date(h.createdAt):h.isPinned?-1:1))}catch{H("Sabitleme işlemi başarısız","error")}},[w,H]),It=async()=>{var t,n;if(!f){H("Lütfen giriş yapın veya kaydolun!","warning");return}try{const o=localStorage.getItem("token"),l=o?{headers:{Authorization:`Bearer ${o}`}}:{};if((await ce.post(`/api/portals/${s}/join`,{},l)).data.status==="joined"){Se(!0);const h={...f,joinedPortals:[...f.joinedPortals||[],i]};z(h),E(g=>({...g,members:[...g.members||[],f._id]})),Ve(),H("Portala başarıyla katıldınız!","success")}else H("Üyelik isteğiniz gönderildi!","info"),E(h=>({...h,isRequested:!0}))}catch(o){H(((n=(t=o.response)==null?void 0:t.data)==null?void 0:n.message)||"Katılma başarısız","error")}},lt=(t,n)=>{if(!t||!n)return!1;const o=typeof t=="object"?t.toString():t,l=typeof n=="object"?n.toString():n;return o===l},zt=f&&i&&i.owner&&lt(i.owner._id||i.owner,f._id),Tt=zt||f&&i&&i.admins&&i.admins.some(t=>lt(t._id||t,f._id));if(a.useEffect(()=>{if(!(A!=null&&A.suspendedUntil)){ge(null);return}const t=()=>{const o=new Date,d=new Date(A.suspendedUntil)-o;if(d<=0){ge(null),window.location.reload();return}ge({days:Math.floor(d/(1e3*60*60*24)),hours:Math.floor(d/(1e3*60*60)%24),minutes:Math.floor(d/(1e3*60)%60),seconds:Math.floor(d/1e3%60)})};t();const n=setInterval(t,1e3);return()=>clearInterval(n)},[A]),fe==="suspended"&&A){const t=A.portalStatus==="suspended",n=A.suspendedUntil?new Date(A.suspendedUntil).toLocaleString("tr-TR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):null;return e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx($e,{}),e.jsx("div",{className:"suspension-screen",children:e.jsxs("div",{className:"suspension-card",children:[e.jsx("div",{className:"suspension-icon",children:t?"⏸️":"🔒"}),e.jsx("h1",{className:"suspension-title",children:A.portalName||"Portal"}),e.jsx("h2",{className:"suspension-subtitle",children:t?"Bu portal geçici olarak askıya alındı":"Bu portal kapatılmıştır"}),A.statusReason&&e.jsxs("div",{className:"suspension-reason",children:[e.jsx("div",{className:"suspension-reason-label",children:"Sebep"}),e.jsx("p",{children:A.statusReason})]}),t&&n&&e.jsxs("div",{className:"suspension-unlock",children:[e.jsx("div",{className:"suspension-unlock-label",children:"🔓 Erişim Açılma Tarihi"}),e.jsx("div",{className:"suspension-unlock-date",children:n}),he&&e.jsxs("div",{className:"suspension-countdown",children:[e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(he.days).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Gün"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(he.hours).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saat"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(he.minutes).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Dakika"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(he.seconds).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saniye"})]})]})]}),e.jsxs("div",{className:"suspension-policy",children:[e.jsx("span",{children:"📋"}),e.jsxs("p",{children:["Askıya alma nedenleri, platformun ",e.jsx("strong",{children:"Politika ve Koşullar"}),"'ı kapsamında değerlendirilmektedir. Detaylı bilgi için kurallarımızı inceleyebilirsiniz."]})]}),e.jsx("button",{onClick:()=>M("/"),className:"suspension-home-btn",children:"Anasayfaya Dön"})]})})]})}return fe==="blocked"?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx($e,{}),e.jsxs("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center",flexDirection:"column",color:"var(--text-muted)"},children:[e.jsx("div",{style:{fontSize:"3rem",marginBottom:"1rem"},children:"🚫"}),e.jsx("h2",{children:"Sonuç Bulunamadı"}),e.jsx("p",{children:"Aradığınız portala ulaşılamıyor."}),e.jsx("button",{onClick:()=>M("/"),className:"btn-save",style:{marginTop:"20px",float:"none"},children:"Anasayfaya Dön"})]})]}):de||_||!i?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx($e,{}),e.jsx("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center"},children:e.jsx("div",{className:"spinner"})})]}):i.isNSFW&&!Ut&&!sessionStorage.getItem(`nsfw_confirmed_${s}`)?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx($e,{}),e.jsx("div",{className:"nsfw-gate-overlay",children:e.jsxs("div",{className:"nsfw-gate-card",children:[e.jsx("div",{className:"nsfw-gate-icon",children:e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]})}),e.jsx("div",{className:"nsfw-gate-badge",children:"+18"}),e.jsx("h1",{className:"nsfw-gate-title",children:"Yaş Kısıtlaması"}),e.jsxs("p",{className:"nsfw-gate-desc",children:[e.jsx("strong",{children:i.name})," portalı yetişkin içerik barındırabilir. Bu portala erişmek için 18 yaşından büyük olmanız gerekmektedir."]}),e.jsxs("div",{className:"nsfw-gate-actions",children:[e.jsx("button",{className:"nsfw-gate-confirm",onClick:()=>{sessionStorage.setItem(`nsfw_confirmed_${s}`,"true"),Wt(!0)},children:"18 yaşından büyüğüm, devam et"}),e.jsx("button",{className:"nsfw-gate-cancel",onClick:()=>M(-1),children:"Geri Dön"})]}),e.jsx("p",{className:"nsfw-gate-legal",children:"Devam ederek, yaşınızın 18'den büyük olduğunu ve yetişkin içerikle ilgili yasal sorumluluğu kabul ettiğinizi onaylarsınız."})]})})]}):e.jsxs("div",{className:`app-wrapper full-height discord-layout ${Kt?"voice-channel-active":""}`,children:[e.jsx(Ds,{title:i.name,description:i.description||`${i.name} topluluğuna katılın.`,image:Z(i.avatar),type:"website",schema:{"@context":"https://schema.org","@type":"Community",name:i.name,description:i.description,url:window.location.href,memberCount:((Rt=i.members)==null?void 0:Rt.length)||0}}),!nt&&e.jsx($e,{}),ye.show&&e.jsxs("div",{className:`app-toast ${ye.type}`,children:[e.jsx("span",{className:"app-toast-icon",children:ye.type==="error"?"🚫":ye.type==="success"?"✅":ye.type==="warning"?"⚠️":"ℹ️"}),ye.message]}),e.jsxs("div",{className:`discord-split-view ${u&&N?"mobile-feed-active":""} ${F?"sidebar-collapsed":""}`,children:[f&&e.jsx(Bs,{portal:i,isMember:ve,canManage:zt||Tt,onEdit:t=>{as(typeof t=="string"?t:"overview"),We(!0)},currentChannel:P,onChangeChannel:ts,className:`${v?"mobile-open":""} ${u&&N?"mobile-hidden":""}`,onShowPortalInfo:()=>wt(!0)}),e.jsxs("main",{className:`discord-main-content ${u&&!N?"mobile-content-hidden":""}`,children:[u&&!N&&e.jsx(Rs,{title:(i==null?void 0:i.name)||"Portal",showBack:!1}),(()=>{var d,h,g,x,V,y,B,q,K,U,le,Ye,te,Le,Ee,O,Q;const t=(d=i==null?void 0:i.channels)==null?void 0:d.find(m=>m._id===P),n=(t==null?void 0:t.type)||"text",o=(t==null?void 0:t.name)||"...",l=n==="voice"||n==="conference";return e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{display:"flex",flex:1,overflow:"hidden"},children:l?e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column"},children:[u&&e.jsx("header",{className:"channel-top-bar",style:{flexShrink:0},children:e.jsxs("div",{className:"channel-title-wrapper",children:[e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>T(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",style:{color:"var(--primary-color)"},children:n==="voice"||n==="conference"?e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{color:"var(--primary-color)"},children:[e.jsx("path",{d:"M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"}),e.jsx("path",{d:"M19 10v2a7 7 0 0 1-14 0v-2"}),e.jsx("line",{x1:"12",y1:"19",x2:"12",y2:"23"})]}):n==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",style:{color:"var(--primary-color)"},children:o})]})}),e.jsx(a.Suspense,{fallback:e.jsx("div",{className:"skeleton-loader",children:e.jsx("p",{children:"Canlı bağlantı odası hazırlanıyor..."})}),children:n==="conference"?e.jsx(Vs,{portalId:s,channelId:P,channelName:o}):e.jsx(Fs,{portalId:s,channelId:P,channelName:o})})]}):e.jsx("div",{className:"channel-messages-area",style:{flex:1,display:"flex",flexDirection:"column"},children:re?e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"},children:[e.jsx("div",{className:"spinner"}),e.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.9rem"},children:"İçerik yükleniyor..."})]}):e.jsxs(e.Fragment,{children:[!l&&e.jsxs("header",{className:`channel-top-bar ${u?"":"desktop-only"}`,children:[e.jsxs("div",{className:"channel-title-wrapper",children:[u&&e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>T(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",children:n==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",children:o})]}),e.jsx("div",{className:"channel-header-actions",children:ve&&e.jsx("button",{className:`icon-btn ${_e?"active":""}`,onClick:()=>mt(!_e),title:_e?"Üyeleri Gizle":"Üyeleri Göster",style:{background:"none",border:"none",color:_e?"var(--primary-color)":"var(--text-muted)"},children:e.jsx(Is,{size:20})})})]}),fe==="private"?e.jsx("div",{className:"portal-privacy-screen",children:e.jsxs("div",{className:"privacy-card",children:[e.jsx("div",{className:"privacy-icon",children:"🔒"}),e.jsx("img",{src:Z(i.avatar),alt:"",className:"privacy-avatar",loading:"lazy",decoding:"async",width:"80",height:"80"}),e.jsx("h2",{children:i.name}),e.jsx("p",{className:"privacy-desc",children:i.description||"Bu portal gizlidir."}),e.jsx("p",{className:"privacy-hint",children:"İçeriği görmek ve mesajlaşmak için üye olmalısın."}),i.isRequested?e.jsx("button",{className:"privacy-join-btn requested",disabled:!0,children:"İstek Gönderildi"}):e.jsx("button",{className:"privacy-join-btn",onClick:It,children:i.privacy==="private"?"Üyelik İsteği Gönder":"Portala Katıl"})]})}):e.jsxs(e.Fragment,{children:[(i==null?void 0:i.alerts)&&i.alerts.length>0&&e.jsx(As,{alerts:i.alerts}),e.jsxs("div",{className:"portal-feed-container discord-feed",onScroll:Xt,ref:et,children:[S.length===0&&!de&&e.jsxs("div",{className:"empty-portal",children:[e.jsx("div",{className:"empty-portal-icon",children:"👋"}),e.jsxs("h3",{children:[((g=(h=i==null?void 0:i.channels)==null?void 0:h.find(m=>m._id===P))==null?void 0:g.type)==="voice"?"🎙️":((V=(x=i==null?void 0:i.channels)==null?void 0:x.find(m=>m._id===P))==null?void 0:V.type)==="conference"?"🎤":((B=(y=i==null?void 0:i.channels)==null?void 0:y.find(m=>m._id===P))==null?void 0:B.type)==="image"?"🖼️":"#",((K=(q=i==null?void 0:i.channels)==null?void 0:q.find(m=>String(m._id)===String(P)))==null?void 0:K.name)||"..."," ","kanalına hoş geldin!"]}),e.jsx("p",{children:"Bu kanalda henüz mesaj yok. İlk mesajı sen at!"})]}),Array.isArray(S)&&S.map((m,j)=>{var ae;m.isBot===!0||((ae=m.author)==null||ae.isBot);const G=hs.enableAds;return e.jsxs(a.Fragment,{children:[e.jsx(fs,{post:m,onDelete:os,onPin:cs,onArchive:ls,isAdmin:Tt},m._id),j<S.length-1&&e.jsx("div",{className:"post-separator"}),G]},m._id)}),e.jsx("div",{ref:rs,style:{height:"40px",margin:"10px 0",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"},children:ot&&e.jsx("div",{className:"spinner-small"})})]}),(()=>{const j=2*Math.PI*20,G=j-Zt/100*j;return e.jsxs("button",{className:`floating-scroll-top portal-scroll-top ${Qt?"visible":""}`,onClick:es,"aria-label":"Yukarı Çık",children:[e.jsxs("svg",{className:"progress-ring",width:"50",height:"50",viewBox:"0 0 50 50",children:[e.jsx("circle",{className:"progress-ring-track",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25"}),e.jsx("circle",{className:"progress-ring-fill",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25",style:{strokeDasharray:j,strokeDashoffset:G}})]}),e.jsx("div",{className:"scroll-icon",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"m18 15-6-6-6 6"})})})]})})(),f&&ve?e.jsxs("div",{className:"channel-input-area",children:[Pe&&us.createPortal(e.jsxs("div",{className:"plus-menu portal-plus-menu-portal",ref:Gt,style:{position:"fixed",top:ht.top,left:ht.left,zIndex:99999},children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Ie.current.click(),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("circle",{cx:"8.5",cy:"8.5",r:"1.5"}),e.jsx("polyline",{points:"21 15 16 10 5 21"})]})}),"Görsel"]}),!Ue&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{vt.current.click(),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("polygon",{points:"23 7 16 12 23 17 23 7"}),e.jsx("rect",{x:"1",y:"5",width:"15",height:"14",rx:"2",ry:"2"})]})}),"Video"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{bt.current.click(),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",style:{fontWeight:800,fontSize:"10px"},children:"GIF"}),"GIF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{yt.current.click(),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"})]})}),"PDF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Be(!gt),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"}),e.jsx("polygon",{points:"9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02",fill:"currentColor"})]})}),"YouTube"]})]})]}),document.body),e.jsx("input",{type:"file",ref:Ie,onChange:ss,style:{display:"none"},accept:"image/png, image/jpeg, image/jpg, image/webp",multiple:!0}),e.jsx("input",{type:"file",ref:vt,onChange:st,style:{display:"none"},accept:"video/mp4, video/webm, video/quicktime"}),e.jsx("input",{type:"file",ref:bt,onChange:st,style:{display:"none"},accept:"image/gif"}),e.jsx("input",{type:"file",ref:yt,onChange:st,style:{display:"none"},accept:".pdf"}),gt&&e.jsx("div",{className:"edit-modal-overlay",style:{zIndex:9999},children:e.jsxs("div",{className:"edit-modal-modern",style:{maxWidth:"400px",height:"auto",maxHeight:"none"},children:[e.jsxs("div",{className:"edit-modal-header-modern",children:[e.jsx("div",{className:"header-left",children:e.jsx("h3",{className:"header-title-modern",children:"YouTube Videosu Ekle"})}),e.jsx("button",{onClick:()=>Be(!1),className:"close-btn-modern",children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),e.jsxs("div",{className:"edit-modal-content-modern",style:{padding:"20px"},children:[e.jsxs("div",{className:"floating-label-group",children:[e.jsx("label",{className:"floating-label",children:"Video Bağlantısı"}),e.jsx("input",{type:"text",className:"floating-input",placeholder:"https://www.youtube.com/watch?v=...",value:Ze,onChange:Ht,autoFocus:!0,onKeyDown:m=>{m.key==="Enter"&&(m.preventDefault(),kt())}})]}),e.jsxs("div",{style:{marginTop:"20px",display:"flex",justifyContent:"flex-end",gap:"10px"},children:[e.jsx("button",{onClick:()=>Be(!1),className:"join-btn outline",style:{padding:"8px 16px"},children:"İptal"}),e.jsx("button",{onClick:kt,className:"join-btn primary",style:{padding:"8px 20px"},children:"Ekle"})]})]})]})}),$&&e.jsxs("div",{className:"input-quoted-preview",children:[e.jsxs("div",{className:"input-quoted-preview-header",children:[(le=(U=$.author)==null?void 0:U.profile)!=null&&le.avatar?e.jsx("img",{src:Z($.author.profile.avatar),alt:"",className:"quoted-preview-avatar",loading:"lazy",decoding:"async",width:"32",height:"32"}):e.jsx("div",{className:"quoted-preview-avatar-placeholder",children:(te=(Ye=$.author)==null?void 0:Ye.username)==null?void 0:te.charAt(0).toUpperCase()}),e.jsxs("div",{className:"quoted-preview-meta",children:[e.jsx("span",{className:"quoted-preview-author",children:((Ee=(Le=$.author)==null?void 0:Le.profile)==null?void 0:Ee.displayName)||((O=$.author)==null?void 0:O.username)}),e.jsxs("span",{className:"quoted-preview-username",children:["@",(Q=$.author)==null?void 0:Q.username]})]}),e.jsx("button",{className:"remove-quote-btn",onClick:()=>qe(null),children:e.jsx(we,{size:16})})]}),e.jsxs("div",{className:"input-quoted-preview-body",children:[e.jsx("p",{className:"input-quoted-preview-text",children:$.content}),$.media&&e.jsx("div",{className:"input-quoted-preview-media",children:$.mediaType==="video"?e.jsxs("div",{className:"media-placeholder",children:[e.jsx(zs,{size:20}),e.jsx("span",{children:"Video Alıntısı"})]}):e.jsx("img",{src:Z($.media),alt:"",loading:"lazy",decoding:"async",width:"120",height:"80"})})]})]}),Ue&&J.trim()&&!I&&e.jsxs("div",{className:"image-channel-warning",style:{backgroundColor:"rgba(239, 68, 68, 0.1)",border:"1px solid rgba(239, 68, 68, 0.25)",color:"#f87171",padding:"8px 12px",borderRadius:"8px",fontSize:"13px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{flexShrink:0},children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]}),e.jsx("span",{children:"Görsel kanallarında paylaşım yapabilmek için mutlaka bir görsel eklemelisiniz."})]}),e.jsxs("div",{className:"message-input-wrapper",children:[e.jsx("button",{ref:Re,className:`input-action-btn upload-btn ${Pe?"active":""}`,onClick:Yt,style:{backgroundColor:"#383a40",borderRadius:"50%",width:"32px",height:"32px",marginRight:"12px",color:Pe?"var(--primary-color)":"#b9bbbe"},children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z"})})}),I&&e.jsxs("div",{className:"input-media-preview",style:{marginRight:"12px",display:"flex",alignItems:"center",backgroundColor:"var(--bg-secondary)",borderRadius:"8px",padding:"4px",gap:"8px",border:"1px solid var(--border-subtle)"},children:[I.type==="youtube"&&I.preview?e.jsx("img",{src:I.preview,alt:"Video Preview",style:{width:"40px",height:"30px",objectFit:"cover",borderRadius:"4px"},loading:"lazy",decoding:"async",width:"40",height:"30"}):e.jsx("span",{style:{fontSize:"20px",lineHeight:1,padding:"4px"},children:I.type.startsWith("video")?"🎥":I.type.includes("gif")?"👾":I.type==="application/pdf"||I.name&&I.name.toLowerCase().endsWith(".pdf")?"📄":"🖼️"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",maxWidth:"100px"},children:e.jsx("span",{style:{fontSize:"10px",color:"var(--text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:I.name||"Medya"})}),e.jsx("button",{onClick:()=>je(null),style:{background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer"},children:"×"})]}),e.jsx("input",{type:"text",placeholder:Ue?"Gönderi paylaşmak için bir görsel ekleyin...":`#${(ee==null?void 0:ee.name)||"..."} kanalına mesaj gönder`,value:J,onChange:m=>{be(m.target.value)},onKeyDown:m=>{m.key==="Enter"&&!m.shiftKey&&(m.preventDefault(),Nt())}}),e.jsx("div",{className:"input-right-actions",children:e.jsx("button",{className:"input-action-btn send-btn",onClick:Nt,disabled:jt||(Ue?!I&&pe.length===0:!J.trim()&&!I&&pe.length===0),title:"Gönder",style:{color:J.trim()||I||pe.length>0?"var(--primary-color)":"var(--text-tertiary)"},children:jt?e.jsxs("div",{className:"compose-spinner-wrapper",style:{width:"20px",height:"20px"},children:[e.jsx("div",{className:"compose-spinner",style:{width:"20px",height:"20px",borderTopColor:"var(--primary-color)"}}),e.jsxs("span",{className:"compose-progress-text",style:{fontSize:"7px",color:"var(--text-primary)"},children:[Ft,"%"]})]}):e.jsx(Ts,{size:20})})})]}),xe&&xe.length>0&&e.jsxs("div",{className:"portal-image-previews-container",children:[e.jsxs("div",{className:"portal-image-previews-header",children:[e.jsxs("span",{className:"portal-image-previews-count",children:["Seçilen Görseller (",xe.length,"/10)"]}),xe.length<10&&e.jsx("button",{type:"button",className:"portal-add-more-images-btn",onClick:()=>{var m;return(m=Ie.current)==null?void 0:m.click()},children:"+ Görsel Ekle"})]}),e.jsx("div",{className:"portal-image-previews-list",children:xe.map((m,j)=>e.jsxs("div",{className:"portal-image-preview-item",children:[e.jsx("img",{src:m.url,alt:`Preview ${j+1}`,className:"portal-image-preview-thumb"}),e.jsx("button",{type:"button",className:"portal-image-remove-btn",onClick:()=>ns(j),title:"Görseli Kaldır",children:e.jsx(we,{size:14})}),e.jsx("span",{className:"portal-image-index-badge",children:j+1})]},j))})]}),ne&&ne.length>0&&e.jsxs("div",{className:"portal-typing-indicator",style:{marginTop:"8px"},children:[e.jsx("div",{className:"typing-avatars-group",children:ne.map(m=>e.jsx("img",{src:Z(m.avatar),alt:m.displayName,className:"typing-avatar",title:m.displayName},m.userId))}),e.jsx("span",{className:"typing-text",children:ne.length===1?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:ne[0].displayName})," yazıyor..."]}):ne.length===2?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:ne[0].displayName})," ve ",e.jsx("strong",{children:ne[1].displayName})," yazıyor..."]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:ne[0].displayName})," ve ",ne.length-1," kişi daha yazıyor..."]})})]})]}):e.jsx("div",{className:"channel-input-area",style:{padding:"0 20px 24px 20px",backgroundColor:"transparent",borderTop:"none"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--glass-bg)",padding:"12px 20px",borderRadius:"8px",border:"1px solid var(--glass-border)",backdropFilter:"blur(20px) saturate(160%)",WebkitBackdropFilter:"blur(20px) saturate(160%)",boxShadow:"var(--glass-shadow)"},children:[e.jsxs("span",{style:{color:"var(--text-secondary)",fontWeight:500,fontSize:"14px"},children:["Bu kanalda mesaj göndermek için ",f?"portala katılmalısın.":"giriş yapmalısın."]}),f?e.jsx("button",{className:"privacy-join-btn",onClick:It,disabled:i.isRequested,style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:i.isRequested?"İstek Gönderildi":"Portala Katıl"}):e.jsx("button",{className:"privacy-join-btn",onClick:()=>M("/login"),style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:"Giriş Yap"})]})})]})]})})}),_e&&e.jsx(qs,{members:[...i.owner?[{...i.owner,role:"owner"}]:[],...(i.admins||[]).map(m=>({...m,role:"admin"})),...i.members||[]].filter((m,j,G)=>{const ae=String(m._id||m.id||m);return m&&G.findIndex(Y=>String(Y._id||Y.id||Y)===ae)===j}),onClose:()=>mt(!1)})]})})()]})]}),nt&&at!=="notifications"&&e.jsx(a.Suspense,{fallback:null,children:e.jsx(Us,{portal:i,currentUser:f,initialTab:at,onClose:()=>We(!1),onUpdate:t=>{E(t)}})}),nt&&at==="notifications"&&e.jsx("div",{className:"portal-notifications-modal",onClick:()=>We(!1),children:e.jsxs("div",{className:"notifications-modal-content",onClick:t=>t.stopPropagation(),children:[e.jsx("button",{className:"close-notifications-btn",onClick:()=>We(!1),children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsx(a.Suspense,{fallback:null,children:e.jsx(Ws,{portalId:i._id,portalChannels:i.channels||[],onUpdate:St})})]})}),Vt&&i&&e.jsx($s,{portal:i,onClose:()=>wt(!1),isMobile:u})]})};export{xn as default};
