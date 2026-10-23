const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PortalSettingsModal-CojnOMpK.js","assets/vendor-BmvFJEG9.js","assets/index-DTvFUJBy.js","assets/socket-BDFnXses.js","assets/livekit-PwOJ_nM-.js","assets/lucide-CdgCr4q8.js","assets/index-AN3-8MZo.css","assets/ImageCropper-Cchx-sG6.js","assets/ImageCropper-Dk7oVLRB.css","assets/PortalBadges-BZk9X3KG.js","assets/UserBadges-Bl6enFw0.js","assets/UserBadges-DFKBzEd_.css","assets/PortalBadges-bryM1aQu.css","assets/PortalSettingsModal-CHDypHKx.css","assets/PortalNotifications-Dea_hZUw.js","assets/PortalNotifications-zEgqx9Vo.css","assets/VoiceChannel-B98HFa4F.js","assets/VoiceChannel-DiJr5X-N.js","assets/VoiceChannel-8DFSTqL9.css","assets/ConferenceChannel-DtZ2SaTY.js"])))=>i.map(i=>d[i]);
import{r as n,a1 as e,Z as de,a2 as zs,ar as Hs,at as _t,a4 as zt,as as Pt,a5 as It,a6 as Tt,aa as xs}from"./vendor-BmvFJEG9.js";import{d as ue,l as tt,u as gs,m as at,i as hs,c as Ps,b as Js,p as Zs,h as At,n as Et,a as Qs}from"./index-DTvFUJBy.js";import{u as Mt}from"./useVideoTranscoder-vuyR0AOB.js";import{P as Rt}from"./PostCard-CKZLdPYo.js";import{c as Lt,X as ss,ae as Dt,Y as $t,a2 as Bt,M as Is,a8 as Ut,a1 as qt,a5 as Ft,e as Kt,a6 as Gt,aC as Wt,aD as Ot,aE as Vt,aF as Yt,ad as Ht,K as Xs,aG as Jt,a9 as Zt,F as Qt,r as Xt,t as ea,G as sa,s as Cs,j as ta,aH as it,at as aa,aI as ia,aJ as na}from"./lucide-CdgCr4q8.js";import{U as et}from"./UserBadges-Bl6enFw0.js";import{P as _s}from"./PortalBadges-BZk9X3KG.js";import{U as ra}from"./UserBar-C4ZFPdGn.js";import{P as st}from"./PortalInfoModal-BEgrpKh0.js";import{N as es}from"./Navbar-CFN0z9H2.js";import{S as la}from"./SubHeader-DGK4Cuzl.js";import{S as oa}from"./SEO-g7eYKtyv.js";import"./socket-BDFnXses.js";import"./livekit-PwOJ_nM-.js";import"./VideoDownloadModal-DBAphuNq.js";import"./LinkPreview-DsLjwz_z.js";import"./UserAvatar-BkF0M0Gd.js";/* empty css                      *//* empty css                  */const ca=({portalId:t,onClose:f})=>{const[A,h]=n.useState(""),[H,x]=n.useState([]),[Z,O]=n.useState(!1),[b,v]=n.useState(new Set);n.useEffect(()=>{const P=setTimeout(async()=>{if(A.trim().length===0){x([]);return}O(!0);try{const L=await de.get(`/api/users/search?q=${A}`);x(L.data)}catch{}finally{O(!1)}},500);return()=>clearTimeout(P)},[A]);const K=async C=>{var P,L;try{await Promise.all([de.post(`/api/portals/${t}/invite`,{userId:C}),de.post("/api/messages",{recipientId:C,portalId:t,content:"Seni bir portala davet ettim!"})]),v(i=>new Set(i).add(C))}catch(i){alert(((L=(P=i.response)==null?void 0:P.data)==null?void 0:L.message)||"İşlem sırasında bir hata oluştu.")}},z=()=>{const C=`${window.location.origin}/portal/${t}`;navigator.clipboard.writeText(C),alert("Davet bağlantısı kopyalandı!")};return e.jsx("div",{className:"invite-modal-overlay",onClick:f,children:e.jsxs("div",{className:"invite-modal",onClick:C=>C.stopPropagation(),children:[e.jsxs("div",{className:"invite-header",children:[e.jsx("h2",{children:"Kullanıcı Davet Et"}),e.jsxs("div",{className:"header-actions",children:[e.jsxs("button",{className:"copy-link-btn",title:"Bağlantıyı Kopyala",onClick:z,children:[e.jsx(Lt,{size:20,strokeWidth:2}),e.jsx("span",{children:"Bağlantı"})]}),e.jsx("button",{className:"close-btn",onClick:f,children:e.jsx(ss,{size:24,strokeWidth:2})})]})]}),e.jsx("div",{className:"invite-search-container",children:e.jsx("input",{type:"text",className:"invite-search-input",placeholder:"Kullanıcı adı ara...",value:A,onChange:C=>h(C.target.value),autoFocus:!0})}),e.jsxs("div",{className:"invite-results custom-scrollbar",children:[Z&&e.jsx("div",{className:"loading-text",children:"Aranıyor..."}),!Z&&H.length===0&&A&&e.jsx("div",{className:"no-play-text",children:"Sonuç bulunamadı."}),H.map(C=>{var i;const P=C._id||C,L=b.has(P);return e.jsxs("div",{className:"invite-user-row",children:[e.jsxs("div",{className:"user-info",children:[e.jsx("img",{src:ue((i=C.profile)==null?void 0:i.avatar),alt:"",className:"user-avatar"}),e.jsx("span",{className:"user-name",children:C.username})]}),e.jsx("button",{className:`invite-btn ${L?"invited":""}`,onClick:()=>!L&&K(P),disabled:L,children:L?"Gönderildi":"Davet Et"})]},P)})]})]})})},da=({startedAt:t,style:f={},className:A=""})=>{const{roomStartTime:h}=tt()||{},[H,x]=n.useState("00:00");n.useEffect(()=>{const O=h&&t===h?h:t;if(!O){x("00:00");return}const b=()=>{const K=Math.floor((Date.now()-O)/1e3);if(K<0){x("00:00");return}const z=Math.floor(K/3600),C=Math.floor(K%3600/60),P=K%60;x(z>0?`${z.toString().padStart(2,"0")}:${C.toString().padStart(2,"0")}:${P.toString().padStart(2,"0")}`:`${C.toString().padStart(2,"0")}:${P.toString().padStart(2,"0")}`)};b();const v=setInterval(b,1e3);return()=>clearInterval(v)},[t,h]);const Z={display:"flex",alignItems:"center",fontSize:"15px",fontWeight:"800",color:"#39FF14",background:"transparent",border:"none",padding:"0 4px"};return e.jsx("div",{style:{...Z,...f},className:A,children:H})},ma=({portal:t,isMember:f,onEdit:A,currentChannel:h,onChangeChannel:H,className:x,canManage:Z,onShowPortalInfo:O})=>{var $e,we;const{user:b}=gs(),[v,K]=n.useState(!1);zs();const z=at(),{isMobileView:C}=z||{},P=(z==null?void 0:z.isDesktopSidebarCollapsed)||!1,L=(z==null?void 0:z.setIsDesktopSidebarCollapsed)||(()=>{}),i=hs(d=>d.unreadPostsByChannel),g=hs(d=>d.clearUnreadForChannel),{roomStartTime:y,activeRoom:F,participants:M}=tt(),{socket:a,onlineUsers:I}=Ps(),[U,j]=n.useState({}),[ee,le]=n.useState(null),fe=n.useRef(null),Pe=(d,S)=>{S.stopPropagation(),fe.current&&clearTimeout(fe.current),le(d),fe.current=setTimeout(()=>{le(null)},1800)};n.useEffect(()=>()=>{fe.current&&clearTimeout(fe.current)},[]);const Ie=d=>{if(!d)return null;if(typeof d=="string")return d;const S=d._id||d.id;return S?String(S):null},X=new Set,se=Ie(t==null?void 0:t.owner);se&&X.add(se),((t==null?void 0:t.admins)||[]).forEach(d=>{const S=Ie(d);S&&X.add(S)}),((t==null?void 0:t.members)||[]).forEach(d=>{const S=Ie(d);S&&X.add(S)});const Fe=new Set((I||[]).map(d=>String(d))),me=b!=null&&b._id?String(b._id):null,Ee=((we=($e=b==null?void 0:b.settings)==null?void 0:$e.privacy)==null?void 0:we.showOnlineStatus)!==!1;me&&X.has(me)&&Ee?Fe.add(me):me&&!Ee&&Fe.delete(me);let Me=0;X.forEach(d=>{Fe.has(d)&&Me++});const Re=X.size||(t==null?void 0:t.membersCount)||((t==null?void 0:t.members)||[]).length||0;n.useEffect(()=>{h&&(t!=null&&t._id)&&g(h,t._id)},[h,t==null?void 0:t._id,g]),n.useEffect(()=>{var ke;if(!(t!=null&&t._id)||!((ke=t==null?void 0:t.channels)!=null&&ke.length))return;const d=t.channels.filter(re=>re.type==="voice"||re.type==="conference");if(d.length===0)return;let S=!0;const je=async()=>{try{const re=await Promise.all(d.map(async Q=>{var Ce,Ue;const Ne=Q._id||Q.id;try{const ts=await de.get(`/api/voice/rooms/${t._id}/${Ne}/participants?t=${Date.now()}`);return{channelId:String(Ne),count:((Ue=(Ce=ts.data)==null?void 0:Ce.participants)==null?void 0:Ue.length)||0}}catch{return{channelId:String(Ne),count:0}}}));S&&j(Q=>{const Ne={...Q};return re.forEach(Ce=>{Ne[Ce.channelId]=Ce.count}),Ne})}catch{}};je();const Be=setInterval(je,1e4);return()=>{S=!1,clearInterval(Be)}},[t==null?void 0:t._id,t==null?void 0:t.channels]),n.useEffect(()=>{if(!a)return;const d=S=>{!S||!S.channelId||S.portalId&&String(S.portalId)!==String(t==null?void 0:t._id)||j(je=>({...je,[String(S.channelId)]:Number(S.count)||0}))};return a.on("voice:channel-count-update",d),()=>{a.off("voice:channel-count-update",d)}},[a,t==null?void 0:t._id]);const _=t!=null&&t.channels?[...t.channels].sort((d,S)=>(d.order||0)-(S.order||0)).map(d=>({id:d._id,name:d.name,type:d.type||"text",postCount:d.postCount})):[],te=_.find(d=>String(d.id)===String(h)),Le=(te==null?void 0:te.type)==="voice"||(te==null?void 0:te.type)==="conference";n.useEffect(()=>{!Le&&P&&L(!1)},[Le,P,L]);const he=d=>String(h)===String(d),De=(t==null?void 0:t.coverImage)||(t==null?void 0:t.banner),be=De?ue(De):null,Ke=be?`url("${be}")`:t&&!De?'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")':"none",[oe,ve]=n.useState(!1),ye=n.useRef(null);return n.useEffect(()=>{if(!be){ve(!0),ye.current=null;return}if(ye.current===be){ve(!0);return}ye.current=be;const d=new window.Image;d.src=be,d.complete?ve(!0):(ve(!1),d.onload=()=>ve(!0),d.onerror=()=>ve(!0))},[be]),t?e.jsxs("div",{className:`channel-sidebar ${P?"collapsed":""} ${x||""}`,style:{height:"calc(100% - 24px)",backgroundColor:"transparent",display:"flex",flexDirection:"column",flexShrink:0,overflow:"visible",position:"relative",borderRight:"none"},children:[!C&&Le&&e.jsx("button",{className:"sidebar-toggle-btn",onClick:d=>{d.stopPropagation(),L(!P)},title:P?"Menüyü Göster":"Menüyü Gizle",children:P?e.jsx(Dt,{size:16}):e.jsx($t,{size:16})}),e.jsxs("div",{className:"sidebar-content-wrapper",style:{display:"flex",flexDirection:"column",flex:1,width:"100%",height:"100%",overflow:"hidden",transition:"opacity 0.2s ease, visibility 0.2s ease",opacity:P?0:1,visibility:P?"hidden":"visible",gap:"8px",padding:"0px",boxSizing:"border-box"},children:[e.jsxs("div",{className:"cs-panel cs-panel--banner",children:[e.jsxs("div",{className:"channel-banner-container",onClick:()=>O&&O(),children:[e.jsx("div",{className:"channel-banner-image",style:{backgroundImage:Ke,opacity:oe?1:0}}),e.jsx("div",{className:"channel-banner-overlay"})]}),e.jsxs("div",{className:"portal-quick-info",children:[e.jsxs("div",{className:"portal-info-main",onClick:()=>O&&O(),children:[e.jsxs("h2",{className:"portal-title-text",children:[e.jsx("span",{className:"portal-title-name",children:t.name}),e.jsx(_s,{portal:t,size:18})]}),e.jsxs("div",{className:"portal-stats-row",children:[e.jsxs("div",{className:`stat-item ${ee==="members"?"stat-tooltip-active":""}`,onClick:d=>Pe("members",d),title:"Üye",children:[e.jsx(Bt,{size:12}),e.jsx("span",{children:Re}),e.jsx("div",{className:"stat-floating-tag",children:"Üye"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${ee==="posts"?"stat-tooltip-active":""}`,onClick:d=>Pe("posts",d),title:"Gönderi",children:[e.jsx(Is,{size:12}),e.jsx("span",{children:t.postCount||0}),e.jsx("div",{className:"stat-floating-tag",children:"Gönderi"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${ee==="online"?"stat-tooltip-active":""}`,onClick:d=>Pe("online",d),title:"Çevrimiçi",children:[e.jsx("div",{className:"online-indicator-dot"}),e.jsx("span",{children:Me}),e.jsx("div",{className:"stat-floating-tag",children:"Çevrimiçi"})]})]})]}),e.jsxs("div",{className:"portal-header-actions",children:[(f||Z)&&e.jsx("button",{className:"portal-action-btn-circle",onClick:d=>{d.stopPropagation(),A&&A("notifications")},title:"Bildirim Ayarları",children:e.jsx(Ut,{size:16})}),f&&e.jsx("button",{className:"portal-action-btn-circle",onClick:d=>{d.stopPropagation(),K(!0)},title:"Davet Et",children:e.jsx(qt,{size:18})})]})]})]}),e.jsxs("div",{className:"cs-panel cs-panel--channels custom-scrollbar",children:[e.jsxs("div",{className:"cs-channels-header",children:[e.jsx("span",{children:"Kanallar"}),Z&&e.jsx("div",{onClick:d=>{d.stopPropagation(),A&&A("channels")},className:"cs-add-channel-btn",title:"Kanal Oluştur",children:"+"})]}),e.jsx("div",{className:"cs-channel-list",children:_.map(d=>{var re;const S=he(d.id),je=d.type==="announcement"||d.name.includes("announcements"),Be=d.type==="voice"||d.type==="conference";let ke=U[String(d.id)]??0;return F&&String(F.channelId)===String(d.id)&&Array.isArray(M)&&(ke=M.length),e.jsxs("div",{className:`channel-item ${S?"active":""}`,onClick:()=>H(d.id),style:{padding:"6px 8px",margin:"2px 0",borderRadius:"4px",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",color:S?"white":"#949ba4",backgroundColor:S?"#3f4147":"transparent",transition:"background-color 0.15s ease, color 0.15s ease"},children:[e.jsx("div",{style:{color:S?"white":"var(--text-secondary)",display:"flex",alignItems:"center",minWidth:"20px",justifyContent:"center"},children:d.type==="conference"?e.jsx(Ft,{size:20,strokeWidth:2}):d.type==="voice"?e.jsx(Kt,{size:20,strokeWidth:2}):je?e.jsx(Gt,{size:20,strokeWidth:2.5}):d.type==="image"?e.jsx(Wt,{size:20,strokeWidth:2.5,style:{color:"#f59e0b"}}):e.jsx(Ot,{size:20,strokeWidth:2.5})}),e.jsx("span",{style:{fontWeight:S?600:500,fontSize:"16px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:S?"white":"var(--text-primary)",maxWidth:"fit-content"},children:d.name}),Be&&e.jsx("span",{className:`vc-channel-active-badge ${ke>0?"online":"idle"}`,children:ke>0?`${ke} aktif`:"aktif yok"}),!S&&((re=i[d.id])==null?void 0:re.length)>0&&e.jsx("div",{style:{backgroundColor:"#f23f43",color:"white",fontSize:"11px",fontWeight:"bold",padding:"0 6px",borderRadius:"8px",minWidth:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.3)",marginLeft:"-4px",flexShrink:0},children:i[d.id].length>9?"9+":i[d.id].length}),e.jsx("div",{style:{flex:1}}),S&&Be&&F&&String(F.channelId)===String(d.id)&&y&&e.jsx("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:e.jsx(da,{startedAt:y,className:"vc-sidebar-timer"})})]},d.id)})})]}),e.jsxs("div",{className:"cs-panel cs-panel--userbar",children:[e.jsx(ra,{currentChannelId:h}),e.jsx("div",{className:"cs-footer-copyright",children:"© 2026 Oxypace. Tüm hakları saklıdır."})]})]}),e.jsx("style",{children:`
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
                border-top-left-radius: 14px;
                border-top-right-radius: 14px;
            }
            .channel-banner-image {
                width: 100%;
                height: 100%;
                background-color: #121316;
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                transition: transform 0.5s ease, opacity 0.25s ease;
                border-top-left-radius: 14px;
                border-top-right-radius: 14px;
            }
            .channel-banner-container:hover .channel-banner-image {
                transform: scale(1.05);
            }
            .channel-banner-overlay {
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%);
                border-top-left-radius: 14px;
                border-top-right-radius: 14px;
            }

            /* ── Portal quick info ── */
            .cs-panel--banner {
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
                overflow: visible !important;
            }
            .portal-quick-info {
                padding: 14px 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: transparent;
                position: relative;
                overflow: visible !important;
            }
            .portal-info-main {
                flex: 1;
                cursor: pointer;
                min-width: 0;
                position: relative;
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
            .portal-title-name {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .portal-title-text .portal-badges-container {
                margin-left: 0 !important;
                gap: 6px;
            }
            .portal-stats-row {
                display: flex;
                align-items: center;
                gap: 6px;
                position: relative;
            }
            .stat-item {
                position: relative;
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                color: var(--text-secondary);
                font-weight: 600;
                cursor: pointer;
                user-select: none;
                padding: 2px 4px;
                border-radius: 6px;
                transition: color 0.15s ease, background-color 0.15s ease;
            }
            .stat-item:hover {
                color: var(--text-primary);
                background-color: rgba(255, 255, 255, 0.08);
            }
            :root[data-theme='light'] .stat-item:hover {
                background-color: rgba(0, 0, 0, 0.05);
            }
            .stat-floating-tag {
                position: absolute;
                bottom: calc(100% + 7px);
                left: 50%;
                transform: translateX(-50%) translateY(4px);
                background: rgba(15, 20, 32, 0.96);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                color: #ffffff;
                font-size: 11px;
                font-weight: 600;
                padding: 3px 8px;
                border-radius: 6px;
                white-space: nowrap;
                pointer-events: none;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.18s;
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
                border: 1px solid rgba(255, 255, 255, 0.14);
                z-index: 1000;
            }
            :root[data-theme='light'] .stat-floating-tag {
                background: rgba(255, 255, 255, 0.98);
                color: #0f172a;
                border-color: rgba(0, 0, 0, 0.12);
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
            }
            .stat-floating-tag::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border-width: 4px;
                border-style: solid;
                border-color: rgba(15, 20, 32, 0.96) transparent transparent transparent;
            }
            :root[data-theme='light'] .stat-floating-tag::after {
                border-color: rgba(255, 255, 255, 0.98) transparent transparent transparent;
            }
            .stat-item:hover .stat-floating-tag,
            .stat-item.stat-tooltip-active .stat-floating-tag {
                opacity: 1;
                visibility: visible;
                transform: translateX(-50%) translateY(0);
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

            /* ── Voice channel minimal active badge (no icons, purely minimal text) ── */
            .vc-channel-active-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 600;
                line-height: 1.2;
                padding: 1px 6px;
                border-radius: 4px;
                white-space: nowrap;
                user-select: none;
                flex-shrink: 0;
                margin-left: 2px;
                letter-spacing: 0.01em;
                transition: all 0.2s ease;
            }
            .vc-channel-active-badge.online {
                background: rgba(34, 197, 94, 0.15);
                color: #4ade80;
                border: 1px solid rgba(34, 197, 94, 0.3);
            }
            .vc-channel-active-badge.idle {
                background: rgba(255, 255, 255, 0.05);
                color: var(--text-tertiary, #949ba4);
                border: 1px solid rgba(255, 255, 255, 0.08);
            }
            [data-theme='light'] .vc-channel-active-badge.online,
            body.light-theme .vc-channel-active-badge.online {
                background: rgba(34, 197, 94, 0.12);
                color: #16a34a;
                border-color: rgba(34, 197, 94, 0.25);
            }
            [data-theme='light'] .vc-channel-active-badge.idle,
            body.light-theme .vc-channel-active-badge.idle {
                background: rgba(0, 0, 0, 0.05);
                color: #64748b;
                border-color: rgba(0, 0, 0, 0.08);
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
            `}),v&&e.jsx(ca,{portalId:t._id,onClose:()=>K(!1)})]}):null},pa=({members:t=[],onClose:f})=>{var P,L;const{onlineUsers:A}=Ps(),{user:h}=gs(),[,H]=n.useState(0);n.useEffect(()=>{const i=setInterval(()=>{H(g=>g+1)},6e4);return()=>clearInterval(i)},[]);const x=i=>{if(!i)return"";const g=new Date,y=new Date(i),F=Math.max(0,g-y),M=Math.floor(F/6e4);if(M<1)return"şimdi";if(M<60)return`${M}dk`;const a=Math.floor(M/60);if(a<24)return`${a}sa`;const I=Math.floor(a/24);if(I<30)return`${I}g`;const U=Math.floor(I/30);return U<12?`${U}ay`:`${Math.floor(U/12)}y`},Z=i=>{if(!i)return null;if(typeof i=="string")return i;const g=i._id||i.id;return g?String(g):null},O=new Set((A||[]).map(i=>String(i))),b=h!=null&&h._id?String(h._id):null,v=((L=(P=h==null?void 0:h.settings)==null?void 0:P.privacy)==null?void 0:L.showOnlineStatus)!==!1;b&&v?O.add(b):b&&!v&&O.delete(b);const K=i=>(i==null?void 0:i.role)==="owner"?3:(i==null?void 0:i.role)==="admin"||i!=null&&i.isAdmin?2:1,z=t.filter(i=>{if(!i)return!1;const g=Z(i);return g&&O.has(g)}).sort((i,g)=>{var a,I;const y=K(g)-K(i);if(y!==0)return y;const F=((a=i.profile)==null?void 0:a.displayName)||i.username||"",M=((I=g.profile)==null?void 0:I.displayName)||g.username||"";return F.localeCompare(M)}),C=t.filter(i=>{if(!i)return!1;const g=Z(i);return g&&!O.has(g)}).sort((i,g)=>{var a,I;const y=K(g)-K(i);if(y!==0)return y;const F=((a=i.profile)==null?void 0:a.displayName)||i.username||"",M=((I=g.profile)==null?void 0:I.displayName)||g.username||"";return F.localeCompare(M)});return e.jsxs("div",{className:"members-sidebar custom-scrollbar",children:[e.jsxs("div",{className:"members-header-top",children:[e.jsx("h3",{children:"ÜYELER"}),f&&e.jsx("button",{onClick:f,className:"close-members-btn","aria-label":"Kapat",children:e.jsx(ss,{size:20,strokeWidth:2})})]}),e.jsxs("div",{className:"members-category",children:["Çevrim içi — ",z.length]}),z.map((i,g)=>{var U,j,ee,le;if(!i||typeof i=="string")return null;const y=i.username||"Unknown",F=((U=i.profile)==null?void 0:U.avatar)||i.avatar,M=((j=i.profile)==null?void 0:j.displayName)||y,a=i.role==="owner",I=i.role==="admin"||i.isAdmin;return e.jsxs(Hs,{to:`/profile/${y}`,className:"member-item member-link",children:[e.jsxs("div",{className:"member-avatar-wrapper",children:[F?e.jsx("img",{src:ue(F,"thumbnail"),alt:"",className:"member-avatar",loading:"eager",decoding:"async"}):e.jsx("div",{className:"member-avatar-placeholder",children:((ee=M[0])==null?void 0:ee.toUpperCase())||((le=y[0])==null?void 0:le.toUpperCase())||"?"}),e.jsx("div",{className:"status-indicator online"})]}),e.jsxs("div",{className:"member-info",style:{display:"flex",alignItems:"center",gap:"6px"},children:[e.jsxs("span",{className:"member-name active-role",style:{color:a?"#f1c40f":I?"#3498db":"#2ecc71"},children:[M,a&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!a&&I&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"})]}),e.jsx(et,{user:i,size:13})]})]},i._id||i.id||g)}),e.jsxs("div",{className:"members-category",children:["Çevrim dışı — ",C.length]}),C.map((i,g)=>{var U,j,ee,le;if(!i||typeof i=="string")return null;const y=i.username||"Unknown",F=((U=i.profile)==null?void 0:U.avatar)||i.avatar,M=((j=i.profile)==null?void 0:j.displayName)||y,a=i.role==="owner",I=i.role==="admin"||i.isAdmin;return e.jsxs(Hs,{to:`/profile/${y}`,className:"member-item offline member-link",children:[e.jsx("div",{className:"member-avatar-wrapper",children:F?e.jsx("img",{src:ue(F,"thumbnail"),alt:"",className:"member-avatar",loading:"eager",decoding:"async"}):e.jsx("div",{className:"member-avatar-placeholder",style:{backgroundColor:"var(--bg-secondary)"},children:((ee=M[0])==null?void 0:ee.toUpperCase())||((le=y[0])==null?void 0:le.toUpperCase())||"?"})}),e.jsx("div",{className:"member-info",style:{flex:1},children:e.jsxs("div",{className:"member-name-row",style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("span",{className:"member-name",style:{display:"flex",alignItems:"center",gap:"4px"},children:[M,a&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!a&&I&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"}),e.jsx(et,{user:i,size:13})]}),i.lastActive&&e.jsx("span",{className:"last-active-time",style:{fontSize:"11px",color:"var(--text-muted)"},children:x(i.lastActive)})]})})]},i._id||i.id||`offline-${g}`)}),e.jsx("style",{children:`
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
            `})]})},ua=()=>{var P,L;const{user:t,updateUser:f}=gs(),A=zs(),[h,H]=n.useState(null),[x,Z]=n.useState([]),[O,b]=n.useState(!0),[v,K]=n.useState(null);n.useEffect(()=>{let i=!0;return(async()=>{try{const y=await de.get("/api/portals/showcase");i&&y.data&&(H(y.data.globalPortal||null),Z(Array.isArray(y.data.topPortals)?y.data.topPortals:[]))}catch{}finally{i&&b(!1)}})(),()=>{i=!1}},[]);const z=async(i,g)=>{var y,F,M;if(i.stopPropagation(),!t){A("/login");return}if(g.isMember){A(`/portal/${g._id}`);return}if(!(g.isRequested||v===g._id)){K(g._id);try{const I=((y=(await de.post(`/api/portals/${g._id}/join`)).data)==null?void 0:y.status)==="requested",U=j=>!j||j._id!==g._id?j:{...j,isMember:!I,isRequested:I,memberCount:I?j.memberCount:(j.memberCount||0)+1};if((h==null?void 0:h._id)===g._id&&H(U(h)),Z(j=>j.map(U)),!I&&t&&f){const j=t.joinedPortals||[];j.some(ee=>(ee._id||ee).toString()===g._id.toString())||f({joinedPortals:[...j,g],portals:[...t.portals||[],g]})}}catch(a){alert(((M=(F=a.response)==null?void 0:F.data)==null?void 0:M.message)||"İşlem gerçekleştirilemedi.")}finally{K(null)}}},C=i=>i!=null&&i.banner?`url(${ue(i.banner)}) center/cover no-repeat`:"#141414";return e.jsxs("div",{className:"tanitim-showcase-wrapper",children:[e.jsxs("section",{className:"tanitim-guide-card",children:[e.jsxs("div",{className:"tanitim-guide-header",children:[e.jsxs("div",{className:"tanitim-guide-tag",children:[e.jsx(Vt,{size:13}),e.jsx("span",{children:"SİSTEM DİREKTİFİ // RESMİ PLATFORM REHBERİ"})]}),e.jsx("h1",{className:"tanitim-guide-title",children:"Oxypace İletişim Protokolü & Kullanım Mimarisi"}),e.jsx("p",{className:"tanitim-guide-lead",children:"Özgür, sansürsüz, yüksek performanslı ve gizlilik odaklı yeni nesil topluluk ekosistemi. Arayüz haritasını ve platformun tüm gelişmiş yeteneklerini aşağıdaki yönergelerden inceleyin."})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// NAVİGASYON VE MENÜ YERLEŞİMİ"}),e.jsx("h2",{className:"sub-section-title",children:"Sayfa Yapısı & Arayüz Konumlandırması"})]}),e.jsxs("div",{className:"tanitim-nav-map-grid",children:[e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(Yt,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ SOL NAVİGASYON BARI ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Ana Gezinme Çubuğu"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Doğrudan Mesajlar (DM):"})," Birebir şifreli özel yazışmalar ve anlık bildirim kutusu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portallar Listesi:"})," Üye olduğunuz veya yönettiğiniz tüm portalların dikey simgeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Keşfet Pusulası:"})," Yeni toplulukları, popüler portalları ve kişileri arama alanı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Oluştur (+):"})," Saniyeler içinde kendi özgür topluluğunuzu kurma aracı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kimlik & Hızlı Ayar:"})," En altta mikrofon, kulaklık ve profil hızlı kontrolleri."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(Ht,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ PORTAL İÇİ MENÜ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Kanal Hiyerarşisi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Kimliği:"})," Özel afiş, doğrulanmış rozet ve çevrimiçi üye göstergeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Metin Kanalları (#):"})," Tematik konulara göre ayrılmış gönderi ve tartışma akışları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Ses Kanalları (🎙️):"})," Tek dokunuşla girilebilen, gecikmesiz canlı ses odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Sahne Kanalları (🎤):"})," Seminer, podcast ve etkinlikler için konuşmacı odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Yönetimi:"})," Yöneticiler için yeni kanallar açma ve gizlilik kilidi."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(Xs,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ ÜST DENETİM & AKIŞ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"İçerik & Üye Denetimi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Üst Başlığı:"})," Aktif kanal adı, açıklaması ve hızlı üye paneli butonu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Üye Listesi Paneli:"})," Sağ tarafta çevrimiçi yöneticiler ve aktif üyeler."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Görsel Akış Alanı:"})," 4K videolar, çoklu galeriler ve doküman önizlemeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Bildirim Zil İkonu:"})," Kanal ve portal bazlı bildirim filtreleme ayarları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Ayarları:"})," Portal sahibi ve yöneticileri için tam yönetim konsolu."]})]})]})]})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// GELİŞMİŞ SİSTEM DİREKLERİ"}),e.jsx("h2",{className:"sub-section-title",children:"Platform Mekanizmaları & Özellikler"})]}),e.jsxs("div",{className:"tanitim-pillars-grid",children:[e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"01"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Is,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Gelişmiş Mesaj Mekanizması"}),e.jsx("p",{className:"pillar-text",children:"Markdown formatlama, tek tıkla alıntılı yanıtlama (quote reply), kullanıcıyı doğrudan haberdar eden @etiketleme sistemi ve akıllı bağlantı (link preview) ayrıştırma desteği."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Alıntılı Yanıt"}),e.jsx("span",{className:"pillar-tag",children:"@Bahsetmeler"}),e.jsx("span",{className:"pillar-tag",children:"Mesaj Sabitleme"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"02"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Jt,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Canlı Ses Odaları & Sahne Modu"}),e.jsx("p",{className:"pillar-text",children:"Ultra düşük gecikmeli WebRTC ses mimarisi. Herkesin serbestçe katılabildiği sohbet odaları ile seminer ve konferanslar için konuşmacı-dinleyici ayrımı ve el kaldırma desteği sunan Sahne kanalları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Gecikme"}),e.jsx("span",{className:"pillar-tag",children:"Sahne Hiyerarşisi"}),e.jsx("span",{className:"pillar-tag",children:"Arka Planda Ses"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"03"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Zt,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Mobil Ekosistem & PIP Video"}),e.jsx("p",{className:"pillar-text",children:"Yerel Android APK ve tam uyumlu PWA deneyimi. Canlı FCM Push bildirimleri, mobil veri tasarrufu modu ve gezinirken köşede kesintisiz oynayan Kayan Resim İçinde Resim (PIP) video motoru."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Android APK / PWA"}),e.jsx("span",{className:"pillar-tag",children:"Canlı PIP Oynatıcı"}),e.jsx("span",{className:"pillar-tag",children:"FCM Push Bildirim"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"04"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Qt,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Ultra-HD Medya & Transcoding"}),e.jsx("p",{className:"pillar-text",children:"İstemci içi WASM motoru ile 360p'den 4K'ya kadar otomatik optimize edilen video akışı. Tek gönderide 10 adede kadar yüksek kaliteli fotoğraf galerisi ve tek tıkla önizlenebilir PDF dokümanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"4K Video Transcoding"}),e.jsx("span",{className:"pillar-tag",children:"10'lu Görsel Galerisi"}),e.jsx("span",{className:"pillar-tag",children:"PDF Doküman Desteği"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"05"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Xs,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Özelleştirilebilir Sistemler & Temalar"}),e.jsx("p",{className:"pillar-text",children:"Saf OLED siyahı ve yüksek kontrastlı Aydınlık tema desteği. Kişisel profil afişi, biyografi ve avatar özelleştirmeleri. Portallar için özel roller, izin matrisleri ve gizlilik kalkanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"OLED Siyah & Açık Tema"}),e.jsx("span",{className:"pillar-tag",children:"Rol & Yetki Matrisi"}),e.jsx("span",{className:"pillar-tag",children:"Özel Profil Afişi"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"06"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Xt,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Kripto-Güvenlik & Sıfır Takip"}),e.jsx("p",{className:"pillar-text",children:"Sıfır veri madenciliği ve ticari profil koruması. IP ve aktif cihaz oturum denetimi, güvenlik anahtarları ile hesap kurtarma ve doğrulanmış resmi topluluk rozetleri."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Veri İzleme"}),e.jsx("span",{className:"pillar-tag",children:"Cihaz & Oturum Denetimi"}),e.jsx("span",{className:"pillar-tag",children:"Onay Rozetleri"})]})]})]})]})]}),h&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ MERKEZ TOPLULUK // 01 ]"}),e.jsx("span",{className:"section-badge",children:"EN POPÜLER PORTAL"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Oxypace Global"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"Platformun en geniş üye kitlesine sahip resmi ana iletişim merkezi."})]}),e.jsxs("div",{className:"oxypace-global-hero-card",onClick:()=>A(`/portal/${h._id}`),children:[e.jsxs("div",{className:"hero-card-banner",style:{background:C(h)},children:[e.jsx("div",{className:"hero-banner-overlay"}),e.jsx("div",{className:"hero-banner-badge",children:e.jsx("span",{children:"ANA TOPLULUK"})})]}),e.jsxs("div",{className:"hero-card-body",children:[e.jsxs("div",{className:"hero-header-row",children:[e.jsx("div",{className:"hero-avatar-box",children:h.avatar?e.jsx("img",{src:ue(h.avatar),alt:h.name,className:"hero-avatar-img"}):e.jsx("div",{className:"hero-avatar-fallback",children:((L=(P=h.name)==null?void 0:P.substring(0,2))==null?void 0:L.toUpperCase())||"OG"})}),e.jsxs("div",{className:"hero-identity-col",children:[e.jsxs("div",{className:"hero-name-row",children:[e.jsx("h3",{className:"hero-portal-name",children:h.name}),e.jsx(_s,{portal:h,size:18}),e.jsx("span",{className:"hero-privacy-tag",children:h.privacy==="private"?e.jsxs(e.Fragment,{children:[e.jsx(ea,{size:11})," GİZLİ"]}):e.jsxs(e.Fragment,{children:[e.jsx(sa,{size:11})," HERKESE AÇIK"]})})]}),e.jsx("div",{className:"hero-meta-row",children:e.jsxs("div",{className:"hero-member-stat",children:[e.jsx(Cs,{size:14}),e.jsxs("span",{children:[(h.memberCount||0).toLocaleString("tr-TR")," Üye"]})]})})]}),e.jsx("div",{className:"hero-action-col",children:e.jsx("button",{type:"button",className:`tanitim-sharp-btn hero-btn ${h.isMember?"btn-joined":h.isRequested?"btn-requested":"btn-action"}`,onClick:i=>z(i,h),disabled:v===h._id||h.isRequested,children:v===h._id?"İŞLENİYOR...":h.isMember?e.jsxs(e.Fragment,{children:[e.jsx(ta,{size:14}),"ÜYESİNİZ"]}):h.isRequested?e.jsxs(e.Fragment,{children:[e.jsx(it,{size:14}),"İSTEK GÖNDERİLDİ"]}):h.privacy==="private"?"ÜYELİK İSTEĞİ GÖNDER":"PORTALA KATIL"})})]}),e.jsx("p",{className:"hero-description",children:h.description||"Oxypace platformunun ana buluşma noktası. Güncel duyurular, teknik tartışmalar ve küresel topluluk etkileşimi."})]})]})]}),x.length>0&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ AKTİF TOPLULUKLAR // 02 ]"}),e.jsx("span",{className:"section-badge",children:"ÖNE ÇIKAN PORTALLAR"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Popüler Topluluklar"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"En çok paylaşıma ve aktif etkileşime sahip seçkin portallar."})]}),e.jsx("div",{className:"tanitim-portals-row",children:x.map(i=>{var g,y;return e.jsxs("div",{className:"tanitim-classic-card",onClick:()=>A(`/portal/${i._id}`),children:[e.jsx("div",{className:"classic-card-banner",style:{background:C(i)},children:e.jsx("div",{className:"classic-banner-overlay"})}),e.jsx("div",{className:"classic-card-icon-wrapper",children:i.avatar?e.jsx("img",{src:ue(i.avatar),alt:i.name,className:"classic-card-icon-img",loading:"lazy"}):e.jsx("div",{className:"classic-card-icon-placeholder",children:((y=(g=i.name)==null?void 0:g.substring(0,2))==null?void 0:y.toUpperCase())||"P"})}),e.jsxs("div",{className:"classic-card-body",children:[e.jsxs("div",{className:"classic-card-title-row",children:[e.jsx("h4",{className:"classic-card-title",children:i.name}),e.jsx(_s,{portal:i,size:16})]}),e.jsx("p",{className:"classic-card-desc",children:i.description||"Bu topluluk hakkında henüz bir açıklama girilmemiş."}),e.jsxs("div",{className:"classic-card-footer",children:[e.jsxs("div",{className:"classic-member-count",children:[e.jsx(Cs,{size:12}),e.jsxs("span",{children:[i.memberCount||0," Üye"]})]}),e.jsx("button",{type:"button",className:`tanitim-sharp-btn small-btn ${i.isMember?"btn-joined":i.isRequested?"btn-requested":"btn-action"}`,onClick:F=>z(F,i),disabled:v===i._id||i.isRequested,children:v===i._id?"...":i.isMember?"ÜYESİNİZ":i.isRequested?"İSTEK":i.privacy==="private"?"İSTEK AT":"KATIL"})]})]})]},i._id)})})]})]})},ha=({alerts:t=[]})=>{const[f,A]=n.useState(()=>{try{const b=sessionStorage.getItem("dismissed_portal_alerts");return b?JSON.parse(b):[]}catch{return[]}}),[h,H]=n.useState(null),x=t.filter(b=>!f.includes(b._id)),Z=b=>{H(b),setTimeout(()=>{const v=[...f,b];A(v);try{sessionStorage.setItem("dismissed_portal_alerts",JSON.stringify(v))}catch{}H(null)},300)},O=b=>{const v=new Date,z=new Date(b)-v;if(z<=0)return null;const C=Math.floor(z/(1e3*60*60*24)),P=Math.floor(z/(1e3*60*60)%24),L=Math.floor(z/(1e3*60)%60);return C>0?`${C} gün ${P} saat kaldı`:P>0?`${P} saat ${L} dk kaldı`:`${L} dakika kaldı`};return x.length===0?null:e.jsx(e.Fragment,{children:x.map(b=>e.jsx("div",{className:`portal-alert-banner ${h===b._id?"dismissing":""}`,children:e.jsxs("div",{className:"alert-banner-inner",children:[e.jsx("div",{className:"alert-banner-icon",children:e.jsx(aa,{size:18,strokeWidth:2})}),e.jsxs("div",{className:"alert-banner-content",children:[e.jsx("div",{className:"alert-banner-label",children:e.jsx("span",{children:"Yönetici Uyarısı"})}),e.jsx("div",{className:"alert-banner-message",children:b.message}),e.jsx("div",{className:"alert-banner-meta",children:e.jsxs("span",{className:"alert-banner-time",children:[e.jsx(it,{size:16,strokeWidth:2}),O(b.expiresAt)||"Süresi dolmak üzere"]})})]}),e.jsx("button",{className:"alert-banner-close",onClick:()=>Z(b._id),title:"Uyarıyı gizle",children:e.jsx(ss,{size:16,strokeWidth:2.5})})]})},b._id))})},xa=n.lazy(()=>xs(()=>import("./PortalSettingsModal-CojnOMpK.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13]))),ga=n.lazy(()=>xs(()=>import("./PortalNotifications-Dea_hZUw.js"),__vite__mapDeps([14,1,2,3,4,5,6,15]))),fa=n.lazy(()=>xs(()=>import("./VoiceChannel-B98HFa4F.js"),__vite__mapDeps([16,1,4,2,3,5,6,17,18]))),ba=n.lazy(()=>xs(()=>import("./ConferenceChannel-DtZ2SaTY.js"),__vite__mapDeps([19,1,4,2,3,5,6,17,18]))),Fa=()=>{var Os,Vs,Ys;const{id:t}=_t(),f=zt(),[A]=Pt(),h=A.get("channel"),H=A.get("post"),{user:x,token:Z,updateUser:O,loading:b}=gs(),{socket:v,connected:K}=Ps(),z=zs(),C=at(),{isSidebarOpen:P,closeSidebar:L,isMobileView:i,mobileChannelOpen:g,setMobileChannelOpen:y}=C||{},F=(C==null?void 0:C.isDesktopSidebarCollapsed)||!1,M=typeof window<"u"&&!!localStorage.getItem("admin_backup_token"),[a,I]=n.useState(()=>{var s;if((s=f==null?void 0:f.state)!=null&&s.portal&&(String(f.state.portal._id)===String(t)||String(f.state.portal.id)===String(t)))return f.state.portal;try{const r=sessionStorage.getItem(`oxypace_portal_cache_${t}`);if(r)return JSON.parse(r)}catch{}return null});n.useEffect(()=>{var s;(s=f==null?void 0:f.state)!=null&&s.portal&&(String(f.state.portal._id)===String(t)||String(f.state.portal.id)===String(t))&&I(f.state.portal)},[t,f.state]);const U=hs(s=>s.posts),j=hs(s=>s.setPosts),[ee,le]=n.useState(()=>{var s;if((s=f==null?void 0:f.state)!=null&&s.portal&&(String(f.state.portal._id)===String(t)||String(f.state.portal.id)===String(t)))return!1;try{return!sessionStorage.getItem(`oxypace_portal_cache_${t}`)}catch{return!0}}),[fe,Pe]=n.useState(!1),[Ie,X]=n.useState(""),[se,Fe]=n.useState(null),[me,Ee]=n.useState(null),[Me,Re]=n.useState(!1),[_,te]=n.useState(null),[Le,he]=n.useState({}),[De,be]=n.useState(!1),[xe,Ke]=n.useState(""),[oe,ve]=n.useState([]);n.useRef(null);const[ye,$e]=n.useState(!1),[we,d]=n.useState(!1),[S,je]=n.useState({show:!1,message:"",type:"info"}),[Be,ke]=n.useState(!1),[re,Q]=n.useState(!1),[Ne,Ce]=n.useState({top:0,left:0}),[Ue,ts]=n.useState(""),[Ts,as]=n.useState(!1),Ge=n.useRef(null),As=n.useRef(null),Es=n.useRef(null),Ms=n.useRef(null),[D,qe]=n.useState(null),[_e,We]=n.useState([]),[Te,Oe]=n.useState([]),[G,is]=n.useState(null),[nt,Ve]=n.useState(0),[Rs,fs]=n.useState(!1),ns=n.useRef(!1);Mt();const Se=Js(s=>s.activeUploads)[`portal-${t}`];n.useEffect(()=>{Se&&Se.status==="uploading"&&j(s=>s.map(r=>r.isOptimistic&&r.mediaType==="video"?{...r,uploadProgress:Se.progress}:r))},[Se==null?void 0:Se.progress,Se==null?void 0:Se.status]);const[rt,rs]=n.useState(!1),ls=!!(a!=null&&a.name&&/Oxypace Tan[ıi]t[ıi]m/i.test(a.name)),lt=!!(x&&(((Os=x.username)==null?void 0:Os.toLowerCase())==="oxypace"||x.isAdmin)),ot=ls?lt:x&&Me,ct=n.useRef(null),Ye=n.useRef(null),dt=n.useCallback(s=>{s.preventDefault(),s.stopPropagation(),Q(r=>{if(!r&&Ye.current){const o=Ye.current.getBoundingClientRect();Ce({top:o.bottom+8,left:o.left})}return!r})},[]);n.useEffect(()=>{if(!re)return;let s=!0;const r=()=>{if(Ye.current){const c=Ye.current.getBoundingClientRect();Ce({top:c.bottom+8,left:c.left})}},o=c=>{if(!s)return;const m=c.target.closest(".plus-menu")||c.target.closest(".portal-plus-menu-portal"),N=c.target.closest(".upload-btn");!m&&!N&&Q(!1)},l=setTimeout(()=>{s&&(document.addEventListener("click",o),document.addEventListener("touchstart",o))},0);return window.addEventListener("scroll",r,!0),window.addEventListener("resize",r),()=>{s=!1,clearTimeout(l),document.removeEventListener("click",o),document.removeEventListener("touchstart",o),window.removeEventListener("scroll",r,!0),window.removeEventListener("resize",r)}},[re]),n.useEffect(()=>()=>{Q(!1)},[]),n.useEffect(()=>{Q(!1)},[_,t]),n.useEffect(()=>{var s;(s=f.state)!=null&&s.quotedPost&&(is(f.state.quotedPost),f.state.selectedChannelId&&te(f.state.selectedChannelId),z(f.pathname+f.search,{replace:!0,state:{}}))},[f.state,t]);const Y=(Vs=a==null?void 0:a.channels)==null?void 0:Vs.find(s=>String(s._id)===String(_)),os=(Y==null?void 0:Y.type)==="image",Ls=(Y==null?void 0:Y.type)==="voice"||(Y==null?void 0:Y.type)==="conference",Ds=Ls&&(!i||g);n.useEffect(()=>{a!=null&&a.channels&&Array.isArray(a.channels)&&he(s=>{const r={...s};return a.channels.forEach(o=>{const l=String(o._id);o.postCount!==void 0&&(r[l]=o.postCount)}),r})},[a==null?void 0:a.channels]),n.useEffect(()=>{if(!v||!K||!t)return;v.emit("join_portal",t),v.emit("get_online_users"),_&&v.emit("join_channel",_);const s=c=>{var E,w,R,k;const m=((E=c.portal)==null?void 0:E._id)||c.portal,N=((w=c.channel)==null?void 0:w._id)||c.channel,p=String(m)===String(t),$=String(N)===String(_);if(p&&$){const W=((R=c.author)==null?void 0:R._id)||((k=c.author)==null?void 0:k.id)||c.author;if(String(W)!==String(x==null?void 0:x._id)){const q=String(_);he(J=>({...J,[q]:(J[q]!==void 0?J[q]:(Y==null?void 0:Y.postCount)||0)+1}))}j(q=>{if(q.some(pe=>pe._id===c._id))return q;const J=c.quotedPost&&(typeof c.quotedPost=="string"?c.quotedPost:c.quotedPost._id);if(J){const pe=q.find(ie=>ie._id===J);pe&&typeof pe=="object"&&pe.author?c.quotedPost=pe:G&&J===G._id&&(c.quotedPost=G)}return[c,...q]})}},r=c=>{var p;const m=((p=c.portal)==null?void 0:p._id)||c.portal;(!m||String(m)===String(t))&&j($=>$.map(E=>String(E._id)===String(c._id)?c:E))},o=({userId:c,status:m,lastActive:N})=>{m==="offline"&&ve(p=>p.filter($=>String($.userId)!==String(c))),I(p=>{if(!p)return p;const $=N||new Date;let E=p.owner;if(p.owner){const k=p.owner._id||p.owner.id||p.owner;String(k)===String(c)&&typeof p.owner=="object"&&(E={...p.owner,lastActive:$})}let w=p.admins;Array.isArray(p.admins)&&(w=p.admins.map(k=>{const W=k._id||k.id||k;return String(W)===String(c)&&typeof k=="object"&&k!==null?{...k,lastActive:$}:k}));let R=p.members;return Array.isArray(p.members)&&(R=p.members.map(k=>{const W=k._id||k.id||k;return String(W)===String(c)&&typeof k=="object"&&k!==null?{...k,lastActive:$}:k})),{...p,owner:E,admins:w,members:R}})},l=({userId:c,username:m,displayName:N,avatar:p,isTyping:$})=>{String(c)!==String(x==null?void 0:x._id)&&ve(E=>$?E.some(w=>String(w.userId)===String(c))?E:[...E,{userId:c,username:m,displayName:N,avatar:p}]:E.filter(w=>String(w.userId)!==String(c)))};return v.on("post:created",s),v.on("post:updated",r),v.on("user_status_change",o),v.on("portal_typing_update",l),()=>{v.off("post:created",s),v.off("post:updated",r),v.off("user_status_change",o),v.off("portal_typing_update",l)}},[v,K,t,_,x==null?void 0:x._id]);const mt=s=>{if(!s)return null;const r=/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,o=s.match(r);return o&&o[2].length===11?o[2]:null},pt=s=>{const r=s.target.value;ts(r)},$s=()=>{const s=mt(Ue);if(!s){ae("Geçersiz YouTube URL'si","error");return}qe({name:"YouTube Video",type:"youtube",preview:`https://img.youtube.com/vi/${s}/hqdefault.jpg`,url:Ue}),as(!1),ts("")},[ut,cs]=n.useState(!1),[ht,xt]=n.useState(0),bs=n.useRef(null),vs=n.useRef(null),He=n.useRef(null),gt=n.useCallback(s=>{const r=s.target;vs.current||(vs.current=requestAnimationFrame(()=>{vs.current=null;const o=r.scrollTop,l=o>300;cs(m=>m!==l?l:m);const c=r.scrollHeight-r.clientHeight;if(c>0){const m=Math.round(o/c*100);xt(N=>Math.abs(N-m)>=2?m:N)}}))},[]),ft=n.useCallback(s=>{s&&(s.preventDefault(),s.stopPropagation()),He.current&&cancelAnimationFrame(He.current);const r=bs.current||document.querySelector(".discord-feed")||document.querySelector(".portal-feed-container");if(!r){window.scrollTo({top:0,behavior:"smooth"});return}const o=r.scrollTop;if(o<=0)return;const l=800,c=performance.now(),m=p=>1-Math.pow(1-p,5),N=p=>{const $=p-c,E=Math.min($/l,1),w=m(E);r.scrollTop=Math.round(o*(1-w)),E<1?He.current=requestAnimationFrame(N):(r.scrollTop=0,He.current=null)};He.current=requestAnimationFrame(N)},[]),bt=s=>{te(s),cs(!1),i&&(L(),y(!0))},ae=n.useCallback((s,r="info")=>{je({show:!0,message:s,type:r}),setTimeout(()=>je(o=>({...o,show:!1})),4e3)},[]),vt=s=>{const r=Array.from(s.target.files||[]);if(r.length===0)return;qe(null),ns.current=!1;const l=10-_e.length;if(l<=0){ae("Bir gönderiye en fazla 10 görsel ekleyebilirsiniz.","warning");return}const c=r.slice(0,l);r.length>l&&ae(`En fazla 10 görsel ekleyebilirsiniz. İlk ${l} görsel eklendi.`,"warning");const m=[],N=[];for(const p of c){if(p.size>2*1024*1024*1024){ae(`${p.name} boyutu 2 GB'dan büyük olamaz.`,"error");continue}m.push(p),N.push({url:URL.createObjectURL(p),name:p.name,size:p.size,file:p})}We(p=>[...p,...m]),Oe(p=>[...p,...N]),Q(!1),Ge.current&&(Ge.current.value="")},yt=s=>{We(r=>r.filter((o,l)=>l!==s)),Oe(r=>{const o=r[s];if(o&&o.url&&o.url.startsWith("blob:"))try{URL.revokeObjectURL(o.url)}catch{}return r.filter((l,c)=>c!==s)})},ys=s=>{const r=s.target.files[0];if(r){if(r.size>2*1024*1024*1024){ae("Dosya boyutu 2 GB'dan büyük olamaz.","error");return}We([]),Oe([]),qe(r),ns.current=r.type.startsWith("video/")||["mp4","webm","ogg","mov","m4v"].includes(r.name.split(".").pop().toLowerCase()),Q(!1)}};n.useEffect(()=>{M||!v||!t||(xe.trim().length>0||D!==null||_e.length>0?ye||($e(!0),v.emit("portal_typing",{portalId:t,isTyping:!0})):ye&&(v.emit("portal_typing",{portalId:t,isTyping:!1}),$e(!1)))},[xe,D,_e,t,v,ye,M]),n.useEffect(()=>()=>{!M&&v&&t&&ye&&v.emit("portal_typing",{portalId:t,isTyping:!1})},[t,v,ye,M]);const Bs=async()=>{var w,R;if(M){ae("Hayalet Modu: Salt okunur izleme modundasınız. Gönderi paylaşılamaz.","error");return}const s=xe.trim().length>0,r=!!D,o=_e.length>0;if(!s&&!r&&!o)return;v&&t&&v.emit("portal_typing",{portalId:t,isTyping:!1}),$e(!1);const l={content:xe,media:D,mediaFiles:[..._e],mediaPreviews:[...Te]},c=D&&D.type==="youtube",m=`temp-${Date.now()}`;let N=null,p=null;c?(N=D.url,p="youtube"):o?(N=Te.map(k=>k.url),p="image"):D&&(N=URL.createObjectURL(D),p=D.type.startsWith("video")?"video":D.type.includes("gif")?"gif":"image");const $=p==="video",E={_id:m,content:xe,media:N,mediaType:p||"none",author:x,createdAt:new Date().toISOString(),likes:[],likeCount:0,isOptimistic:!0,quotedPost:G,isProcessing:!!$,processingProgress:0,estimatedTime:$?"Hesaplanıyor...":""};if(j(k=>[E,...k]),_){const k=String(_);he(W=>({...W,[k]:(W[k]!==void 0?W[k]:(Y==null?void 0:Y.postCount)||0)+1}))}Ke(""),qe(null),We([]),Oe([]),Q(!1),fs(!0),Ve(0);try{let k=null,W=null,q=null,J=null,pe=null;if(c)q=l.media.url,J="youtube";else if(l.mediaFiles&&l.mediaFiles.length>0){const u=l.mediaFiles.length,T=new Array(u).fill(0),V=l.mediaFiles.map((B,ne)=>Qs(B,"post",t,Xe=>{T[ne]=Xe;const ce=Math.round(T.reduce((ge,ze)=>ge+ze,0)/u);Ve(ce),j(ge=>ge.map(ze=>String(ze._id)===String(m)?{...ze,uploadProgress:ce}:ze))}));W=await Promise.all(V)}else if(l.media)if(ns.current){Js.getState().startVideoUpload({file:l.media,portalId:t,channel:_,content:l.content,quotedPostId:G==null?void 0:G._id,onFinish:(u,T)=>{if(u){if(j(V=>V.filter(B=>String(B._id)!==String(m))),_){const V=String(_);he(B=>({...B,[V]:Math.max(0,(B[V]||1)-1)}))}ae("Video yükleme başarısız oldu.","error")}else if(T){const V=String(m);j(B=>{const ne=String(T._id);return B.some(ce=>String(ce._id)===ne)?B.filter(ce=>String(ce._id)!==V):B.map(ce=>{if(String(ce._id)===V){const ge=T,ze=ge.quotedPost&&(typeof ge.quotedPost=="string"?ge.quotedPost:ge.quotedPost._id);return ze&&ce.quotedPost&&ze===ce.quotedPost._id&&(ge.quotedPost=ce.quotedPost),ge}return ce})})}}}),fs(!1),is(null);return}else k=await Qs(l.media,"post",t,u=>{Ve(u),j(T=>T.map(V=>String(V._id)===String(m)?{...V,uploadProgress:u}:V))});else Ve(100);const ie={content:l.content,portalId:t,channel:_,quotedPostId:G==null?void 0:G._id};W&&W.length>0?(ie.mediaKeys=W,ie.mediaType="image"):k?(ie.mediaKey=k,ns.current?ie.mediaType="video":l.media&&(l.media.type==="application/pdf"||l.media.name.toLowerCase().endsWith(".pdf"))&&(ie.pdfName=l.media.name,ie.pdfSize=l.media.size)):q&&(ie.media=q,ie.mediaType=J);const Ze=await de.post("/api/posts",ie);is(null);const Qe=String(m);j(u=>{const T=String(Ze.data._id);return u.some(B=>String(B._id)===T)?u.filter(B=>String(B._id)!==Qe):u.map(B=>{if(String(B._id)===Qe){const ne=Ze.data,Xe=ne.quotedPost&&(typeof ne.quotedPost=="string"?ne.quotedPost:ne.quotedPost._id);return Xe&&B.quotedPost&&Xe===B.quotedPost._id&&(ne.quotedPost=B.quotedPost),ne}return B})})}catch(k){const W=((R=(w=k.response)==null?void 0:w.data)==null?void 0:R.message)||k.message;if(ae(W,"error"),j(q=>q.filter(J=>String(J._id)!==String(m))),_){const q=String(_);he(J=>({...J,[q]:Math.max(0,(J[q]||1)-1)}))}Ke(l.content),qe(l.media),We(l.mediaFiles||[]),Oe(l.mediaPreviews||[])}finally{fs(!1),Ve(0)}},[js,Ae]=n.useState(!1),[ks,ds]=n.useState("overview"),[ya,ja]=n.useState(!1),[ka,jt]=n.useState({name:"",description:"",privacy:"public"});n.useRef(null),n.useRef(null),n.useEffect(()=>{t&&!b&&Us()},[t,b]),n.useEffect(()=>{A.get("openSettings")==="true"&&(ds("overview"),Ae(!0))},[A]),n.useEffect(()=>{if(a&&a._id&&a.name)try{const s=localStorage.getItem("oxypace_portal_visits"),r=s?JSON.parse(s):{},o=String(a._id),l=r[o]||{count:0};r[o]={id:o,name:a.name,avatar:a.avatar,count:(l.count||0)+1,lastVisited:Date.now()},localStorage.setItem("oxypace_portal_visits",JSON.stringify(r));let c=0,m=null;Object.values(r).forEach(N=>{N.count>c&&(c=N.count,m=N)}),m&&localStorage.setItem("oxypace_top_portal",JSON.stringify({id:m.id,name:m.name}))}catch{}},[a==null?void 0:a._id,a==null?void 0:a.name]),n.useEffect(()=>{if(!b&&a&&a.channels&&a.channels.length>0)if(_){if(h){const r=a.channels.find(o=>String(o._id)===String(h));if(r&&String(r._id)!==String(_)){te(r._id);return}}if(!a.channels.some(r=>String(r._id)===String(_))){const r=a.channels[0];r&&te(r._id)}}else{if(h){const r=a.channels.find(o=>String(o._id)===String(h));if(r){te(r._id);return}}const s=a.channels[0];s&&te(s._id)}},[a,b,h]),n.useEffect(()=>{const s=r=>{const{portalId:o,channelId:l}=r.detail||{};(!o||String(o)===String(t))&&l&&(te(l),cs(!1),y&&y(!0))};return window.addEventListener("oxypace:switch_channel",s),()=>window.removeEventListener("oxypace:switch_channel",s)},[t,y]),n.useLayoutEffect(()=>{const s=!!h||A.get("joinVoice")==="true";y&&s&&y(!0)},[t,h,A,y]),n.useEffect(()=>{t&&_&&a&&ws(a._id,t)&&ps()},[t,_,a==null?void 0:a._id]),n.useEffect(()=>{if(H&&!De&&!fe&&Array.isArray(U)&&U.length>0){const s=document.getElementById(`post-${H}`);s&&setTimeout(()=>{s.scrollIntoView({behavior:"smooth",block:"center"}),s.classList.add("highlight-post"),setTimeout(()=>s.classList.remove("highlight-post"),2e3),be(!0)},100)}},[H,U,fe,De]),n.useEffect(()=>{var s,r;if(a&&x){const o=((s=a.members)==null?void 0:s.includes(x._id))||((r=x.joinedPortals)==null?void 0:r.some(l=>l._id===a._id||l===a._id));Re(!!o)}},[a,x]);const Us=async()=>{var s,r,o;(!a||a._id!==t)&&(le(!0),cs(!1));try{const l=await de.get(`/api/portals/${t}`);I(l.data);try{sessionStorage.setItem(`oxypace_portal_cache_${t}`,JSON.stringify(l.data))}catch{}(s=l.data)!=null&&s.avatar&&Zs(l.data.avatar,"original");const c=((r=l.data)==null?void 0:r.coverImage)||((o=l.data)==null?void 0:o.banner);c&&Zs(c,"original");const m=[l.data.owner,...l.data.admins||[],...l.data.members||[]].filter(Boolean);At(m),jt({name:l.data.name,description:l.data.description||"",privacy:l.data.privacy||"public"})}catch(l){if(l.response&&l.response.status===403){const c=l.response.data;c.portalStatus==="suspended"||c.portalStatus==="closed"?(Fe({portalStatus:c.portalStatus,statusReason:c.statusReason,suspendedUntil:c.suspendedUntil,portalName:c.portalName,portalAvatar:c.portalAvatar}),X("suspended")):X("blocked")}else l.response&&l.response.status===404?X("blocked"):X("Portal yüklenemedi")}finally{le(!1)}},ms=n.useRef(null),qs=n.useRef(U);qs.current=U;const Je=n.useRef(_);Je.current=_;const ps=n.useCallback(async(s=!1)=>{var l,c;const r=Je.current,o=`portal_posts_${t}_${r}`;if(s)Ks(!0);else{ms.current&&ms.current.abort(),ms.current=new AbortController;let m=!1;try{const N=sessionStorage.getItem(o);if(N){const p=JSON.parse(N);Array.isArray(p)&&p.length>0&&(j(p),Pe(!1),m=!0)}}catch{}m||(Pe(!0),j([])),Ns(!0)}try{const m=localStorage.getItem("token"),N={signal:(l=ms.current)==null?void 0:l.signal,...m&&{headers:{Authorization:`Bearer ${m}`}}};if(s&&r!==Je.current)return;let p=`/api/portals/${t}/posts?channel=${r}&limit=10`;const $=qs.current;if(s&&$.length>0){const R=$[$.length-1];p+=`&before=${R.createdAt}`}const E=await de.get(p,N),w=E.data;if(E.headers&&E.headers["x-total-count"]!==void 0){const R=parseInt(E.headers["x-total-count"],10);isNaN(R)||he(k=>({...k,[String(r)]:R}))}if(w.length<10&&Ns(!1),s)j(R=>{const k=new Set(R.map(q=>q._id)),W=w.filter(q=>!k.has(q._id));return[...R,...W]});else{j(w);try{sessionStorage.setItem(o,JSON.stringify(w.slice(0,15)))}catch{}}X("")}catch(m){if(de.isCancel(m))return;((c=m.response)==null?void 0:c.status)===403?X("private"):X("Gönderiler yüklenemedi")}finally{s||Pe(!1),Ks(!1),le(!1)}},[t]),[Fs,Ns]=n.useState(!0),[Ss,Ks]=n.useState(!1),us=n.useRef(),kt=n.useCallback(s=>{Ss||(us.current&&us.current.disconnect(),us.current=new IntersectionObserver(r=>{r[0].isIntersecting&&Fs&&ps(!0)},{root:bs.current,rootMargin:"200px"}),s&&us.current.observe(s))},[Ss,Fs,ps]);n.useEffect(()=>{j([]),Ns(!0),te(null),I(null),X(""),y(!1)},[t]);const Nt=n.useCallback(s=>{j(o=>o.filter(l=>String(l._id)!==String(s)));const r=Je.current;r&&he(o=>({...o,[String(r)]:Math.max(0,(o[String(r)]||1)-1)}))},[j]),St=n.useCallback((s,r)=>{if(r){j(l=>l.filter(c=>String(c._id)!==String(s)));const o=Je.current;o&&he(l=>({...l,[String(o)]:Math.max(0,(l[String(o)]||1)-1)}))}},[j]),wt=n.useCallback(async s=>{try{const o=(await de.put(`/api/posts/${s}/pin`)).data;j(l=>l.map(m=>m._id===s?o:m).sort((m,N)=>m.isPinned===N.isPinned?new Date(N.createdAt)-new Date(m.createdAt):m.isPinned?-1:1))}catch{ae("Sabitleme işlemi başarısız","error")}},[j,ae]),Ct=async()=>{var s,r;if(!x){ae("Lütfen giriş yapın veya kaydolun!","warning");return}try{const o=localStorage.getItem("token"),l=o?{headers:{Authorization:`Bearer ${o}`}}:{};if((await de.post(`/api/portals/${t}/join`,{},l)).data.status==="joined"){Re(!0);const m=Array.isArray(x==null?void 0:x.joinedPortals)?x.joinedPortals:[],N=Array.isArray(x==null?void 0:x.portals)?x.portals:[],p=[...m.filter(w=>{var R;return((R=(w==null?void 0:w._id)||w)==null?void 0:R.toString())!==t.toString()}),a],$=[...N.filter(w=>{var R;return((R=(w==null?void 0:w._id)||w)==null?void 0:R.toString())!==t.toString()}),a],E={...x,joinedPortals:p,portals:$};O(E),I(w=>({...w,members:[...w.members||[],x._id]})),ps(),ae("Portala başarıyla katıldınız!","success")}else ae("Üyelik isteğiniz gönderildi!","info"),I(m=>({...m,isRequested:!0}))}catch(o){ae(((r=(s=o.response)==null?void 0:s.data)==null?void 0:r.message)||"Katılma başarısız","error")}},ws=(s,r)=>{if(!s||!r)return!1;const o=typeof s=="object"?s.toString():s,l=typeof r=="object"?r.toString():r;return o===l},Gs=x&&a&&a.owner&&ws(a.owner._id||a.owner,x._id),Ws=Gs||x&&a&&a.admins&&a.admins.some(s=>ws(s._id||s,x._id));if(n.useEffect(()=>{if(!(se!=null&&se.suspendedUntil)){Ee(null);return}const s=()=>{const o=new Date,c=new Date(se.suspendedUntil)-o;if(c<=0){Ee(null),window.location.reload();return}Ee({days:Math.floor(c/(1e3*60*60*24)),hours:Math.floor(c/(1e3*60*60)%24),minutes:Math.floor(c/(1e3*60)%60),seconds:Math.floor(c/1e3%60)})};s();const r=setInterval(s,1e3);return()=>clearInterval(r)},[se]),!Z&&!b)return e.jsx(It,{to:"/",replace:!0});if(Ie==="suspended"&&se){const s=se.portalStatus==="suspended",r=se.suspendedUntil?new Date(se.suspendedUntil).toLocaleString("tr-TR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):null;return e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsx("div",{className:"suspension-screen",children:e.jsxs("div",{className:"suspension-card",children:[e.jsx("div",{className:"suspension-icon",children:s?"⏸️":"🔒"}),e.jsx("h1",{className:"suspension-title",children:se.portalName||"Portal"}),e.jsx("h2",{className:"suspension-subtitle",children:s?"Bu portal geçici olarak askıya alındı":"Bu portal kapatılmıştır"}),se.statusReason&&e.jsxs("div",{className:"suspension-reason",children:[e.jsx("div",{className:"suspension-reason-label",children:"Sebep"}),e.jsx("p",{children:se.statusReason})]}),s&&r&&e.jsxs("div",{className:"suspension-unlock",children:[e.jsx("div",{className:"suspension-unlock-label",children:"🔓 Erişim Açılma Tarihi"}),e.jsx("div",{className:"suspension-unlock-date",children:r}),me&&e.jsxs("div",{className:"suspension-countdown",children:[e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(me.days).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Gün"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(me.hours).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saat"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(me.minutes).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Dakika"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(me.seconds).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saniye"})]})]})]}),e.jsxs("div",{className:"suspension-policy",children:[e.jsx("span",{children:"📋"}),e.jsxs("p",{children:["Askıya alma nedenleri, platformun ",e.jsx("strong",{children:"Politika ve Koşullar"}),"'ı kapsamında değerlendirilmektedir. Detaylı bilgi için kurallarımızı inceleyebilirsiniz."]})]}),e.jsx("button",{onClick:()=>z("/"),className:"suspension-home-btn",children:"Anasayfaya Dön"})]})})]})}return Ie==="blocked"?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsxs("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center",flexDirection:"column",color:"var(--text-muted)"},children:[e.jsx("div",{style:{fontSize:"3rem",marginBottom:"1rem"},children:"🚫"}),e.jsx("h2",{children:"Sonuç Bulunamadı"}),e.jsx("p",{children:"Aradığınız portala ulaşılamıyor."}),e.jsx("button",{onClick:()=>z("/"),className:"btn-save",style:{marginTop:"20px",float:"none"},children:"Anasayfaya Dön"})]})]}):ee||b||!a?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsx("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center"},children:e.jsx("div",{className:"spinner"})})]}):a.isNSFW&&!Be&&!sessionStorage.getItem(`nsfw_confirmed_${t}`)?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsx("div",{className:"nsfw-gate-overlay",children:e.jsxs("div",{className:"nsfw-gate-card",children:[e.jsx("div",{className:"nsfw-gate-icon",children:e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]})}),e.jsx("div",{className:"nsfw-gate-badge",children:"+18"}),e.jsx("h1",{className:"nsfw-gate-title",children:"Yaş Kısıtlaması"}),e.jsxs("p",{className:"nsfw-gate-desc",children:[e.jsx("strong",{children:a.name})," portalı yetişkin içerik barındırabilir. Bu portala erişmek için 18 yaşından büyük olmanız gerekmektedir."]}),e.jsxs("div",{className:"nsfw-gate-actions",children:[e.jsx("button",{className:"nsfw-gate-confirm",onClick:()=>{sessionStorage.setItem(`nsfw_confirmed_${t}`,"true"),ke(!0)},children:"18 yaşından büyüğüm, devam et"}),e.jsx("button",{className:"nsfw-gate-cancel",onClick:()=>z(-1),children:"Geri Dön"})]}),e.jsx("p",{className:"nsfw-gate-legal",children:"Devam ederek, yaşınızın 18'den büyük olduğunu ve yetişkin içerikle ilgili yasal sorumluluğu kabul ettiğinizi onaylarsınız."})]})})]}):e.jsxs("div",{className:`app-wrapper full-height discord-layout ${Ds?"voice-channel-active":""}`,children:[e.jsx(oa,{title:a.name,description:a.description||`${a.name} topluluğuna katılın.`,image:ue(a.avatar),type:"website",schema:{"@context":"https://schema.org","@type":"Community",name:a.name,description:a.description,url:window.location.href,memberCount:((Ys=a.members)==null?void 0:Ys.length)||0}}),!js&&e.jsx(es,{}),S.show&&e.jsxs("div",{className:`app-toast ${S.type}`,children:[e.jsx("span",{className:"app-toast-icon",children:S.type==="error"?"🚫":S.type==="success"?"✅":S.type==="warning"?"⚠️":"ℹ️"}),S.message]}),e.jsxs("div",{className:`discord-split-view ${i&&g?"mobile-feed-active":""} ${Ds?"voice-room-active":""} ${F?"sidebar-collapsed":""}`,children:[x&&e.jsx(ma,{portal:a,isMember:Me,canManage:Gs||Ws,onEdit:s=>{ds(typeof s=="string"?s:"overview"),Ae(!0)},currentChannel:_,onChangeChannel:bt,className:`${P?"mobile-open":""} ${i&&g?"mobile-hidden":""}`,onShowPortalInfo:()=>rs(!0)}),e.jsxs("main",{className:`discord-main-content ${i&&!g?"mobile-content-hidden":""} ${Ls?"voice-channel-active":""}`,children:[i&&!g&&e.jsx(la,{title:(a==null?void 0:a.name)||"Portal",showBack:!1}),(()=>{var c,m,N,p,$,E,w,R,k,W,q,J,pe,ie,Ze,Qe;const s=Y,r=(s==null?void 0:s.type)||"text",o=(s==null?void 0:s.name)||"...",l=r==="voice"||r==="conference";return e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{display:"flex",flex:1,overflow:"hidden"},children:l?e.jsx("div",{style:{flex:1,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"},children:e.jsx(n.Suspense,{fallback:e.jsx("div",{className:"skeleton-loader",children:e.jsx("p",{children:"Canlı bağlantı odası hazırlanıyor..."})}),children:r==="conference"?e.jsx(ba,{portalId:t,channelId:_,channelName:o,onBack:()=>y(!1)}):e.jsx(fa,{portalId:t,channelId:_,channelName:o,onBack:()=>y(!1)})})}):e.jsx("div",{className:"channel-messages-area",style:{flex:1,display:"flex",flexDirection:"column"},children:fe?e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"},children:[e.jsx("div",{className:"spinner"}),e.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.9rem"},children:"İçerik yükleniyor..."})]}):e.jsxs(e.Fragment,{children:[!l&&e.jsxs("header",{className:`channel-top-bar ${i?"":"desktop-only"}`,children:[e.jsxs("div",{className:"channel-title-wrapper",children:[i&&e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>y(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",children:r==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",children:o}),(()=>{const u=String((s==null?void 0:s._id)||_||""),T=Le[u]!==void 0?Le[u]:(s==null?void 0:s.postCount)??0;return e.jsxs("div",{className:"channel-post-count-badge",title:`${T} Gönderi`,children:[e.jsx(Is,{size:13}),e.jsx("span",{children:T})]})})()]}),e.jsx("div",{className:"channel-header-actions",children:Me&&e.jsx("button",{className:`icon-btn ${we?"active":""}`,onClick:()=>d(!we),title:we?"Üyeleri Gizle":"Üyeleri Göster",style:{background:"none",border:"none",color:we?"var(--primary-color)":"var(--text-muted)"},children:e.jsx(Cs,{size:20})})})]}),Ie==="private"?e.jsx(st,{portal:a,onClose:()=>{window.history.length>2?z(-1):z("/search")},isMobile:i,onOpenSettings:()=>{ds("overview"),Ae(!0)},onJoinStatusChange:u=>{u==="requested"?I(T=>T&&{...T,isRequested:!0}):u==="joined"&&(Re(!0),X(""),fetchPosts())}}):e.jsxs(e.Fragment,{children:[(a==null?void 0:a.alerts)&&a.alerts.length>0&&e.jsx(ha,{alerts:a.alerts}),e.jsx("div",{className:`portal-feed-container discord-feed ${ls?"tanitim-feed-mode":""}`,onScroll:gt,ref:bs,children:ls?e.jsx(ua,{}):e.jsxs(e.Fragment,{children:[U.length===0&&!ee&&e.jsxs("div",{className:"empty-portal",children:[e.jsx("div",{className:"empty-portal-icon",children:"👋"}),e.jsxs("h3",{children:[((m=(c=a==null?void 0:a.channels)==null?void 0:c.find(u=>u._id===_))==null?void 0:m.type)==="voice"?"🎙️":((p=(N=a==null?void 0:a.channels)==null?void 0:N.find(u=>u._id===_))==null?void 0:p.type)==="conference"?"🎤":((E=($=a==null?void 0:a.channels)==null?void 0:$.find(u=>u._id===_))==null?void 0:E.type)==="image"?"🖼️":"#",((R=(w=a==null?void 0:a.channels)==null?void 0:w.find(u=>String(u._id)===String(_)))==null?void 0:R.name)||"..."," ","kanalına hoş geldin!"]}),e.jsx("p",{children:"Bu kanalda henüz mesaj yok. İlk mesajı sen at!"})]}),Array.isArray(U)&&U.map((u,T)=>{var B;u.isBot===!0||((B=u.author)==null||B.isBot);const V=Et.enableAds;return e.jsxs(n.Fragment,{children:[e.jsx(Rt,{post:u,onDelete:Nt,onPin:wt,onArchive:St,isAdmin:Ws},u._id),T<U.length-1&&e.jsx("div",{className:"post-separator"}),V]},u._id)}),e.jsx("div",{ref:kt,style:{height:"40px",margin:"10px 0",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"},children:Ss&&e.jsx("div",{className:"spinner-small"})})]})}),(()=>{const T=2*Math.PI*20,V=T-ht/100*T;return e.jsxs("button",{className:`floating-scroll-top portal-scroll-top ${ut?"visible":""}`,onClick:ft,"aria-label":"Yukarı Çık",children:[e.jsxs("svg",{className:"progress-ring",width:"50",height:"50",viewBox:"0 0 50 50",children:[e.jsx("circle",{className:"progress-ring-track",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25"}),e.jsx("circle",{className:"progress-ring-fill",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25",style:{strokeDasharray:T,strokeDashoffset:V}})]}),e.jsx("div",{className:"scroll-icon",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"m18 15-6-6-6 6"})})})]})})(),ls?null:ot?e.jsxs("div",{className:"channel-input-area",children:[re&&Tt.createPortal(e.jsxs("div",{className:"plus-menu portal-plus-menu-portal",ref:ct,style:{position:"fixed",top:Ne.top,left:Ne.left,zIndex:99999},children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Ge.current.click(),Q(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("circle",{cx:"8.5",cy:"8.5",r:"1.5"}),e.jsx("polyline",{points:"21 15 16 10 5 21"})]})}),"Görsel"]}),!os&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{As.current.click(),Q(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("polygon",{points:"23 7 16 12 23 17 23 7"}),e.jsx("rect",{x:"1",y:"5",width:"15",height:"14",rx:"2",ry:"2"})]})}),"Video"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Es.current.click(),Q(!1)},children:[e.jsx("div",{className:"plus-menu-icon",style:{fontWeight:800,fontSize:"10px"},children:"GIF"}),"GIF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Ms.current.click(),Q(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"})]})}),"PDF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{as(!Ts),Q(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"}),e.jsx("polygon",{points:"9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02",fill:"currentColor"})]})}),"YouTube"]})]})]}),document.body),e.jsx("input",{type:"file",ref:Ge,onChange:vt,style:{display:"none"},accept:"image/png, image/jpeg, image/jpg, image/webp",multiple:!0}),e.jsx("input",{type:"file",ref:As,onChange:ys,style:{display:"none"},accept:"video/mp4, video/webm, video/quicktime"}),e.jsx("input",{type:"file",ref:Es,onChange:ys,style:{display:"none"},accept:"image/gif"}),e.jsx("input",{type:"file",ref:Ms,onChange:ys,style:{display:"none"},accept:".pdf"}),Ts&&e.jsx("div",{className:"edit-modal-overlay",style:{zIndex:9999},children:e.jsxs("div",{className:"edit-modal-modern",style:{maxWidth:"400px",height:"auto",maxHeight:"none"},children:[e.jsxs("div",{className:"edit-modal-header-modern",children:[e.jsx("div",{className:"header-left",children:e.jsx("h3",{className:"header-title-modern",children:"YouTube Videosu Ekle"})}),e.jsx("button",{onClick:()=>as(!1),className:"close-btn-modern",children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),e.jsxs("div",{className:"edit-modal-content-modern",style:{padding:"20px"},children:[e.jsxs("div",{className:"floating-label-group",children:[e.jsx("label",{className:"floating-label",children:"Video Bağlantısı"}),e.jsx("input",{type:"text",className:"floating-input",placeholder:"https://www.youtube.com/watch?v=...",value:Ue,onChange:pt,autoFocus:!0,onKeyDown:u=>{u.key==="Enter"&&(u.preventDefault(),$s())}})]}),e.jsxs("div",{style:{marginTop:"20px",display:"flex",justifyContent:"flex-end",gap:"10px"},children:[e.jsx("button",{onClick:()=>as(!1),className:"join-btn outline",style:{padding:"8px 16px"},children:"İptal"}),e.jsx("button",{onClick:$s,className:"join-btn primary",style:{padding:"8px 20px"},children:"Ekle"})]})]})]})}),G&&e.jsxs("div",{className:"input-quoted-preview",children:[e.jsxs("div",{className:"input-quoted-preview-header",children:[(W=(k=G.author)==null?void 0:k.profile)!=null&&W.avatar?e.jsx("img",{src:ue(G.author.profile.avatar),alt:"",className:"quoted-preview-avatar",loading:"lazy",decoding:"async",width:"32",height:"32"}):e.jsx("div",{className:"quoted-preview-avatar-placeholder",children:(J=(q=G.author)==null?void 0:q.username)==null?void 0:J.charAt(0).toUpperCase()}),e.jsxs("div",{className:"quoted-preview-meta",children:[e.jsx("span",{className:"quoted-preview-author",children:((ie=(pe=G.author)==null?void 0:pe.profile)==null?void 0:ie.displayName)||((Ze=G.author)==null?void 0:Ze.username)}),e.jsxs("span",{className:"quoted-preview-username",children:["@",(Qe=G.author)==null?void 0:Qe.username]})]}),e.jsx("button",{className:"remove-quote-btn",onClick:()=>is(null),children:e.jsx(ss,{size:16})})]}),e.jsxs("div",{className:"input-quoted-preview-body",children:[e.jsx("p",{className:"input-quoted-preview-text",children:G.content}),G.media&&e.jsx("div",{className:"input-quoted-preview-media",children:G.mediaType==="video"?e.jsxs("div",{className:"media-placeholder",children:[e.jsx(ia,{size:20}),e.jsx("span",{children:"Video Alıntısı"})]}):e.jsx("img",{src:ue(G.media),alt:"",loading:"lazy",decoding:"async",width:"120",height:"80"})})]})]}),os&&xe.trim()&&!D&&e.jsxs("div",{className:"image-channel-warning",style:{backgroundColor:"rgba(239, 68, 68, 0.1)",border:"1px solid rgba(239, 68, 68, 0.25)",color:"#f87171",padding:"8px 12px",borderRadius:"8px",fontSize:"13px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{flexShrink:0},children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]}),e.jsx("span",{children:"Görsel kanallarında paylaşım yapabilmek için mutlaka bir görsel eklemelisiniz."})]}),M?e.jsxs("div",{className:"ghost-channel-notice",style:{backgroundColor:"#0c0c0c",borderTop:"1px solid #222",color:"#888",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",fontSize:"13px"},children:[e.jsxs("svg",{viewBox:"0 0 24 24",width:"18",height:"18",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{opacity:.7},children:[e.jsx("path",{d:"M12 2a5 5 0 0 0-5 5v14l3-2 2 2 2-2 3 2V7a5 5 0 0 0-5-5z"}),e.jsx("circle",{cx:"10",cy:"8",r:"1",fill:"currentColor"}),e.jsx("circle",{cx:"14",cy:"8",r:"1",fill:"currentColor"})]}),e.jsx("span",{children:"Hayalet Modu: Salt okunur izleme modundasınız. Kanalda mesaj ve gönderi paylaşılamaz."})]}):e.jsxs("div",{className:"message-input-wrapper",children:[e.jsx("button",{ref:Ye,className:`input-action-btn upload-btn ${re?"active":""}`,onClick:dt,style:{backgroundColor:"#383a40",borderRadius:"50%",width:"32px",height:"32px",marginRight:"12px",color:re?"var(--primary-color)":"#b9bbbe"},children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z"})})}),D&&e.jsxs("div",{className:"input-media-preview",style:{marginRight:"12px",display:"flex",alignItems:"center",backgroundColor:"var(--bg-secondary)",borderRadius:"8px",padding:"4px",gap:"8px",border:"1px solid var(--border-subtle)"},children:[D.type==="youtube"&&D.preview?e.jsx("img",{src:D.preview,alt:"Video Preview",style:{width:"40px",height:"30px",objectFit:"cover",borderRadius:"4px"},loading:"lazy",decoding:"async",width:"40",height:"30"}):e.jsx("span",{style:{fontSize:"20px",lineHeight:1,padding:"4px"},children:D.type.startsWith("video")?"🎥":D.type.includes("gif")?"👾":D.type==="application/pdf"||D.name&&D.name.toLowerCase().endsWith(".pdf")?"📄":"🖼️"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",maxWidth:"100px"},children:e.jsx("span",{style:{fontSize:"10px",color:"var(--text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:D.name||"Medya"})}),e.jsx("button",{onClick:()=>qe(null),style:{background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer"},children:"×"})]}),e.jsx("input",{type:"text",placeholder:os?"Gönderi paylaşmak için bir görsel ekleyin...":`#${(Y==null?void 0:Y.name)||"..."} kanalına mesaj gönder`,value:xe,onChange:u=>{Ke(u.target.value)},onKeyDown:u=>{u.key==="Enter"&&!u.shiftKey&&(u.preventDefault(),Bs())}}),e.jsx("div",{className:"input-right-actions",children:e.jsx("button",{className:"input-action-btn send-btn",onClick:Bs,disabled:Rs||(os?!D&&_e.length===0:!xe.trim()&&!D&&_e.length===0),title:"Gönder",style:{color:xe.trim()||D||_e.length>0?"var(--primary-color)":"var(--text-tertiary)"},children:Rs?e.jsxs("div",{className:"compose-spinner-wrapper",style:{width:"20px",height:"20px"},children:[e.jsx("div",{className:"compose-spinner",style:{width:"20px",height:"20px",borderTopColor:"var(--primary-color)"}}),e.jsxs("span",{className:"compose-progress-text",style:{fontSize:"7px",color:"var(--text-primary)"},children:[nt,"%"]})]}):e.jsx(na,{size:20})})})]}),Te&&Te.length>0&&e.jsxs("div",{className:"portal-image-previews-container",children:[e.jsxs("div",{className:"portal-image-previews-header",children:[e.jsxs("span",{className:"portal-image-previews-count",children:["Seçilen Görseller (",Te.length,"/10)"]}),Te.length<10&&e.jsx("button",{type:"button",className:"portal-add-more-images-btn",onClick:()=>{var u;return(u=Ge.current)==null?void 0:u.click()},children:"+ Görsel Ekle"})]}),e.jsx("div",{className:"portal-image-previews-list",children:Te.map((u,T)=>e.jsxs("div",{className:"portal-image-preview-item",children:[e.jsx("img",{src:u.url,alt:`Preview ${T+1}`,className:"portal-image-preview-thumb"}),e.jsx("button",{type:"button",className:"portal-image-remove-btn",onClick:()=>yt(T),title:"Görseli Kaldır",children:e.jsx(ss,{size:14})}),e.jsx("span",{className:"portal-image-index-badge",children:T+1})]},T))})]}),oe&&oe.length>0&&e.jsxs("div",{className:"portal-typing-indicator",style:{marginTop:"8px"},children:[e.jsx("div",{className:"typing-avatars-group",children:oe.map(u=>e.jsx("img",{src:ue(u.avatar),alt:u.displayName,className:"typing-avatar",title:u.displayName},u.userId))}),e.jsx("span",{className:"typing-text",children:oe.length===1?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," yazıyor..."]}):oe.length===2?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," ve ",e.jsx("strong",{children:oe[1].displayName})," yazıyor..."]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," ve ",oe.length-1," kişi daha yazıyor..."]})})]})]}):e.jsx("div",{className:"channel-input-area",style:{padding:"0 20px 24px 20px",backgroundColor:"transparent",borderTop:"none"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--glass-bg)",padding:"12px 20px",borderRadius:"8px",border:"1px solid var(--glass-border)",backdropFilter:"blur(20px) saturate(160%)",WebkitBackdropFilter:"blur(20px) saturate(160%)",boxShadow:"var(--glass-shadow)"},children:[e.jsxs("span",{style:{color:"var(--text-secondary)",fontWeight:500,fontSize:"14px"},children:["Bu kanalda mesaj göndermek için ",x?"portala katılmalısın.":"giriş yapmalısın."]}),x?e.jsx("button",{className:"privacy-join-btn",onClick:Ct,disabled:a.isRequested,style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:a.isRequested?"İstek Gönderildi":"Portala Katıl"}):e.jsx("button",{className:"privacy-join-btn",onClick:()=>z("/login"),style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:"Giriş Yap"})]})})]})]})})}),we&&e.jsx(pa,{members:[...a.owner?[{...a.owner,role:"owner"}]:[],...(a.admins||[]).map(u=>({...u,role:"admin"})),...a.members||[]].filter((u,T,V)=>{const B=String(u._id||u.id||u);return u&&V.findIndex(ne=>String(ne._id||ne.id||ne)===B)===T}),onClose:()=>d(!1)})]})})()]})]}),js&&ks!=="notifications"&&e.jsx(n.Suspense,{fallback:null,children:e.jsx(xa,{portal:a,currentUser:x,initialTab:ks,onClose:()=>Ae(!1),onUpdate:s=>{I(s)}})}),js&&ks==="notifications"&&e.jsx("div",{className:"portal-notifications-modal",onClick:()=>Ae(!1),children:e.jsxs("div",{className:"notifications-modal-content",onClick:s=>s.stopPropagation(),children:[e.jsx("button",{className:"close-notifications-btn",onClick:()=>Ae(!1),children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsx(n.Suspense,{fallback:null,children:e.jsx(ga,{portalId:a._id,portalChannels:a.channels||[],onUpdate:Us})})]})}),rt&&a&&e.jsx(st,{portal:a,onClose:()=>rs(!1),isMobile:i,onOpenSettings:()=>{rs(!1),ds("overview"),Ae(!0)},onLeave:()=>{rs(!1),Re(!1),z("/")}})]})};export{Fa as default};
