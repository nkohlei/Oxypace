const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PortalSettingsModal-CRRduw6S.js","assets/vendor-BrF3pmtZ.js","assets/index-BGv3zY9i.js","assets/socket-7HXqYNpq.js","assets/livekit-BEAUSX0o.js","assets/lucide-DlmZynBI.js","assets/index-B8YYXVxo.css","assets/ImageCropper-Z5pB-BvP.js","assets/ImageCropper-Dk7oVLRB.css","assets/PortalBadges-d-SBW748.js","assets/UserBadges-_fRVc8Zb.js","assets/UserBadges-tq8A1kgp.css","assets/PortalBadges-CRlIF4Nd.css","assets/PortalSettingsModal-CHDypHKx.css","assets/PortalNotifications-BLb4sSq1.js","assets/PortalNotifications-zEgqx9Vo.css","assets/VoiceChannel-BZ3koJ2s.js","assets/VoiceChannel-BHpAj8hU.js","assets/VoiceChannel-8DFSTqL9.css","assets/ConferenceChannel-D800Jc3r.js"])))=>i.map(i=>d[i]);
import{r as n,a1 as e,Z as de,a2 as zs,ar as Ys,at as St,a4 as Ct,as as zt,a5 as _t,a6 as Pt,aa as xs}from"./vendor-BrF3pmtZ.js";import{d as ue,j as et,u as fs,k as st,f as hs,c as _s,b as Hs,l as It,a as Js}from"./index-BGv3zY9i.js";import{u as Tt}from"./useVideoTranscoder-D1LiFImV.js";import{P as At}from"./PostCard-Dxj104TA.js";import{c as Et,X as ss,ae as Mt,Y as Rt,a2 as Lt,M as Ps,a8 as Dt,a1 as $t,a5 as Bt,d as qt,a6 as Ut,aC as Ft,aD as Kt,aE as Gt,aF as Wt,ad as Vt,K as Zs,aG as Ot,a9 as Yt,F as Ht,r as Jt,t as Zt,G as Qt,s as Cs,j as Xt,aH as tt,at as ea,aI as sa,aJ as ta}from"./lucide-DlmZynBI.js";import{B as Qs}from"./UserBadges-_fRVc8Zb.js";import{P as aa}from"./PortalBadges-d-SBW748.js";import{U as ia}from"./UserBar-Btj4PMfJ.js";import{P as Xs}from"./PortalInfoModal-BiX93DyV.js";import{N as es}from"./Navbar-Z5Q--ALF.js";import{S as na}from"./SubHeader-0OmIvEBl.js";import{S as ra}from"./SEO-D5isRFHT.js";import"./socket-7HXqYNpq.js";import"./livekit-BEAUSX0o.js";import"./VideoDownloadModal-4Q4-jIpM.js";import"./LinkPreview-BT90quL_.js";import"./UserAvatar-DhPKythw.js";/* empty css                      *//* empty css                  */const la=({portalId:a,onClose:w})=>{const[E,p]=n.useState(""),[H,h]=n.useState([]),[Z,W]=n.useState(!1),[g,b]=n.useState(new Set);n.useEffect(()=>{const P=setTimeout(async()=>{if(E.trim().length===0){h([]);return}W(!0);try{const L=await de.get(`/api/users/search?q=${E}`);h(L.data)}catch{}finally{W(!1)}},500);return()=>clearTimeout(P)},[E]);const F=async C=>{var P,L;try{await Promise.all([de.post(`/api/portals/${a}/invite`,{userId:C}),de.post("/api/messages",{recipientId:C,portalId:a,content:"Seni bir portala davet ettim!"})]),b(i=>new Set(i).add(C))}catch(i){alert(((L=(P=i.response)==null?void 0:P.data)==null?void 0:L.message)||"İşlem sırasında bir hata oluştu.")}},_=()=>{const C=`${window.location.origin}/portal/${a}`;navigator.clipboard.writeText(C),alert("Davet bağlantısı kopyalandı!")};return e.jsx("div",{className:"invite-modal-overlay",onClick:w,children:e.jsxs("div",{className:"invite-modal",onClick:C=>C.stopPropagation(),children:[e.jsxs("div",{className:"invite-header",children:[e.jsx("h2",{children:"Kullanıcı Davet Et"}),e.jsxs("div",{className:"header-actions",children:[e.jsxs("button",{className:"copy-link-btn",title:"Bağlantıyı Kopyala",onClick:_,children:[e.jsx(Et,{size:20,strokeWidth:2}),e.jsx("span",{children:"Bağlantı"})]}),e.jsx("button",{className:"close-btn",onClick:w,children:e.jsx(ss,{size:24,strokeWidth:2})})]})]}),e.jsx("div",{className:"invite-search-container",children:e.jsx("input",{type:"text",className:"invite-search-input",placeholder:"Kullanıcı adı ara...",value:E,onChange:C=>p(C.target.value),autoFocus:!0})}),e.jsxs("div",{className:"invite-results custom-scrollbar",children:[Z&&e.jsx("div",{className:"loading-text",children:"Aranıyor..."}),!Z&&H.length===0&&E&&e.jsx("div",{className:"no-play-text",children:"Sonuç bulunamadı."}),H.map(C=>{var i;const P=C._id||C,L=g.has(P);return e.jsxs("div",{className:"invite-user-row",children:[e.jsxs("div",{className:"user-info",children:[e.jsx("img",{src:ue((i=C.profile)==null?void 0:i.avatar),alt:"",className:"user-avatar"}),e.jsx("span",{className:"user-name",children:C.username})]}),e.jsx("button",{className:`invite-btn ${L?"invited":""}`,onClick:()=>!L&&F(P),disabled:L,children:L?"Gönderildi":"Davet Et"})]},P)})]})]})})},oa=({startedAt:a,style:w={},className:E=""})=>{const{roomStartTime:p}=et()||{},[H,h]=n.useState("00:00");n.useEffect(()=>{const W=p&&a===p?p:a;if(!W){h("00:00");return}const g=()=>{const F=Math.floor((Date.now()-W)/1e3);if(F<0){h("00:00");return}const _=Math.floor(F/3600),C=Math.floor(F%3600/60),P=F%60;h(_>0?`${_.toString().padStart(2,"0")}:${C.toString().padStart(2,"0")}:${P.toString().padStart(2,"0")}`:`${C.toString().padStart(2,"0")}:${P.toString().padStart(2,"0")}`)};g();const b=setInterval(g,1e3);return()=>clearInterval(b)},[a,p]);const Z={display:"flex",alignItems:"center",fontSize:"15px",fontWeight:"800",color:"#39FF14",background:"transparent",border:"none",padding:"0 4px"};return e.jsx("div",{style:{...Z,...w},className:E,children:H})},ca=({portal:a,isMember:w,onEdit:E,currentChannel:p,onChangeChannel:H,className:h,canManage:Z,onShowPortalInfo:W})=>{var $e,Se;const{user:g}=fs(),[b,F]=n.useState(!1);zs();const _=st(),{isMobileView:C}=_||{},P=(_==null?void 0:_.isDesktopSidebarCollapsed)||!1,L=(_==null?void 0:_.setIsDesktopSidebarCollapsed)||(()=>{}),i=hs(l=>l.unreadPostsByChannel),f=hs(l=>l.clearUnreadForChannel),{roomStartTime:v,activeRoom:B,participants:A}=et(),{socket:t,onlineUsers:I}=_s(),[q,y]=n.useState({}),[ee,le]=n.useState(null),ge=n.useRef(null),Ae=(l,k)=>{k.stopPropagation(),ge.current&&clearTimeout(ge.current),le(l),ge.current=setTimeout(()=>{le(null)},1800)};n.useEffect(()=>()=>{ge.current&&clearTimeout(ge.current)},[]);const Pe=l=>{if(!l)return null;if(typeof l=="string")return l;const k=l._id||l.id;return k?String(k):null},X=new Set,se=Pe(a==null?void 0:a.owner);se&&X.add(se),((a==null?void 0:a.admins)||[]).forEach(l=>{const k=Pe(l);k&&X.add(k)}),((a==null?void 0:a.members)||[]).forEach(l=>{const k=Pe(l);k&&X.add(k)});const Fe=new Set((I||[]).map(l=>String(l))),me=g!=null&&g._id?String(g._id):null,Ee=((Se=($e=g==null?void 0:g.settings)==null?void 0:$e.privacy)==null?void 0:Se.showOnlineStatus)!==!1;me&&X.has(me)&&Ee?Fe.add(me):me&&!Ee&&Fe.delete(me);let Me=0;X.forEach(l=>{Fe.has(l)&&Me++});const Re=X.size||(a==null?void 0:a.membersCount)||((a==null?void 0:a.members)||[]).length||0;n.useEffect(()=>{p&&(a!=null&&a._id)&&f(p,a._id)},[p,a==null?void 0:a._id,f]),n.useEffect(()=>{var ke;if(!(a!=null&&a._id)||!((ke=a==null?void 0:a.channels)!=null&&ke.length))return;const l=a.channels.filter(re=>re.type==="voice"||re.type==="conference");if(l.length===0)return;let k=!0;const je=async()=>{try{const re=await Promise.all(l.map(async Q=>{var Ce,qe;const Ne=Q._id||Q.id;try{const ts=await de.get(`/api/voice/rooms/${a._id}/${Ne}/participants?t=${Date.now()}`);return{channelId:String(Ne),count:((qe=(Ce=ts.data)==null?void 0:Ce.participants)==null?void 0:qe.length)||0}}catch{return{channelId:String(Ne),count:0}}}));k&&y(Q=>{const Ne={...Q};return re.forEach(Ce=>{Ne[Ce.channelId]=Ce.count}),Ne})}catch{}};je();const Be=setInterval(je,1e4);return()=>{k=!1,clearInterval(Be)}},[a==null?void 0:a._id,a==null?void 0:a.channels]),n.useEffect(()=>{if(!t)return;const l=k=>{!k||!k.channelId||k.portalId&&String(k.portalId)!==String(a==null?void 0:a._id)||y(je=>({...je,[String(k.channelId)]:Number(k.count)||0}))};return t.on("voice:channel-count-update",l),()=>{t.off("voice:channel-count-update",l)}},[t,a==null?void 0:a._id]);const z=a!=null&&a.channels?[...a.channels].sort((l,k)=>(l.order||0)-(k.order||0)).map(l=>({id:l._id,name:l.name,type:l.type||"text",postCount:l.postCount})):[],te=z.find(l=>String(l.id)===String(p)),Le=(te==null?void 0:te.type)==="voice"||(te==null?void 0:te.type)==="conference";n.useEffect(()=>{!Le&&P&&L(!1)},[Le,P,L]);const he=l=>String(p)===String(l),De=(a==null?void 0:a.coverImage)||(a==null?void 0:a.banner),be=De?ue(De):null,Ke=be?`url("${be}")`:a&&!De?'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")':"none",[oe,ve]=n.useState(!1),ye=n.useRef(null);return n.useEffect(()=>{if(!be){ve(!0),ye.current=null;return}if(ye.current===be){ve(!0);return}ye.current=be;const l=new window.Image;l.src=be,l.complete?ve(!0):(ve(!1),l.onload=()=>ve(!0),l.onerror=()=>ve(!0))},[be]),a?e.jsxs("div",{className:`channel-sidebar ${P?"collapsed":""} ${h||""}`,style:{height:"calc(100% - 24px)",backgroundColor:"transparent",display:"flex",flexDirection:"column",flexShrink:0,overflow:"visible",position:"relative",borderRight:"none"},children:[!C&&Le&&e.jsx("button",{className:"sidebar-toggle-btn",onClick:l=>{l.stopPropagation(),L(!P)},title:P?"Menüyü Göster":"Menüyü Gizle",children:P?e.jsx(Mt,{size:16}):e.jsx(Rt,{size:16})}),e.jsxs("div",{className:"sidebar-content-wrapper",style:{display:"flex",flexDirection:"column",flex:1,width:"100%",height:"100%",overflow:"hidden",transition:"opacity 0.2s ease, visibility 0.2s ease",opacity:P?0:1,visibility:P?"hidden":"visible",gap:"8px",padding:"0px",boxSizing:"border-box"},children:[e.jsxs("div",{className:"cs-panel cs-panel--banner",children:[e.jsxs("div",{className:"channel-banner-container",onClick:()=>W&&W(),children:[e.jsx("div",{className:"channel-banner-image",style:{backgroundImage:Ke,opacity:oe?1:0}}),e.jsx("div",{className:"channel-banner-overlay"})]}),e.jsxs("div",{className:"portal-quick-info",children:[e.jsxs("div",{className:"portal-info-main",onClick:()=>W&&W(),children:[e.jsxs("h2",{className:"portal-title-text",children:[e.jsx("span",{className:"portal-title-name",children:a.name}),e.jsx(aa,{portal:a,size:18})]}),e.jsxs("div",{className:"portal-stats-row",children:[e.jsxs("div",{className:`stat-item ${ee==="members"?"stat-tooltip-active":""}`,onClick:l=>Ae("members",l),title:"Üye",children:[e.jsx(Lt,{size:12}),e.jsx("span",{children:Re}),e.jsx("div",{className:"stat-floating-tag",children:"Üye"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${ee==="posts"?"stat-tooltip-active":""}`,onClick:l=>Ae("posts",l),title:"Gönderi",children:[e.jsx(Ps,{size:12}),e.jsx("span",{children:a.postCount||0}),e.jsx("div",{className:"stat-floating-tag",children:"Gönderi"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${ee==="online"?"stat-tooltip-active":""}`,onClick:l=>Ae("online",l),title:"Çevrimiçi",children:[e.jsx("div",{className:"online-indicator-dot"}),e.jsx("span",{children:Me}),e.jsx("div",{className:"stat-floating-tag",children:"Çevrimiçi"})]})]})]}),e.jsxs("div",{className:"portal-header-actions",children:[(w||Z)&&e.jsx("button",{className:"portal-action-btn-circle",onClick:l=>{l.stopPropagation(),E&&E("notifications")},title:"Bildirim Ayarları",children:e.jsx(Dt,{size:16})}),w&&e.jsx("button",{className:"portal-action-btn-circle",onClick:l=>{l.stopPropagation(),F(!0)},title:"Davet Et",children:e.jsx($t,{size:18})})]})]})]}),e.jsxs("div",{className:"cs-panel cs-panel--channels custom-scrollbar",children:[e.jsxs("div",{className:"cs-channels-header",children:[e.jsx("span",{children:"Kanallar"}),Z&&e.jsx("div",{onClick:l=>{l.stopPropagation(),E&&E("channels")},className:"cs-add-channel-btn",title:"Kanal Oluştur",children:"+"})]}),e.jsx("div",{className:"cs-channel-list",children:z.map(l=>{var re;const k=he(l.id),je=l.type==="announcement"||l.name.includes("announcements"),Be=l.type==="voice"||l.type==="conference";let ke=q[String(l.id)]??0;return B&&String(B.channelId)===String(l.id)&&Array.isArray(A)&&(ke=A.length),e.jsxs("div",{className:`channel-item ${k?"active":""}`,onClick:()=>H(l.id),style:{padding:"6px 8px",margin:"2px 0",borderRadius:"4px",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",color:k?"white":"#949ba4",backgroundColor:k?"#3f4147":"transparent",transition:"background-color 0.15s ease, color 0.15s ease"},children:[e.jsx("div",{style:{color:k?"white":"var(--text-secondary)",display:"flex",alignItems:"center",minWidth:"20px",justifyContent:"center"},children:l.type==="conference"?e.jsx(Bt,{size:20,strokeWidth:2}):l.type==="voice"?e.jsx(qt,{size:20,strokeWidth:2}):je?e.jsx(Ut,{size:20,strokeWidth:2.5}):l.type==="image"?e.jsx(Ft,{size:20,strokeWidth:2.5,style:{color:"#f59e0b"}}):e.jsx(Kt,{size:20,strokeWidth:2.5})}),e.jsx("span",{style:{fontWeight:k?600:500,fontSize:"16px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:k?"white":"var(--text-primary)",maxWidth:"fit-content"},children:l.name}),Be&&e.jsx("span",{className:`vc-channel-active-badge ${ke>0?"online":"idle"}`,children:ke>0?`${ke} aktif`:"aktif yok"}),!k&&((re=i[l.id])==null?void 0:re.length)>0&&e.jsx("div",{style:{backgroundColor:"#f23f43",color:"white",fontSize:"11px",fontWeight:"bold",padding:"0 6px",borderRadius:"8px",minWidth:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.3)",marginLeft:"-4px",flexShrink:0},children:i[l.id].length>9?"9+":i[l.id].length}),e.jsx("div",{style:{flex:1}}),k&&Be&&B&&String(B.channelId)===String(l.id)&&v&&e.jsx("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:e.jsx(oa,{startedAt:v,className:"vc-sidebar-timer"})})]},l.id)})})]}),e.jsxs("div",{className:"cs-panel cs-panel--userbar",children:[e.jsx(ia,{currentChannelId:p}),e.jsx("div",{className:"cs-footer-copyright",children:"© 2026 Oxypace. Tüm hakları saklıdır."})]})]}),e.jsx("style",{children:`
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
            `}),b&&e.jsx(la,{portalId:a._id,onClose:()=>F(!1)})]}):null},da=({members:a=[],onClose:w})=>{var P,L;const{onlineUsers:E}=_s(),{user:p}=fs(),[,H]=n.useState(0);n.useEffect(()=>{const i=setInterval(()=>{H(f=>f+1)},6e4);return()=>clearInterval(i)},[]);const h=i=>{if(!i)return"";const f=new Date,v=new Date(i),B=Math.max(0,f-v),A=Math.floor(B/6e4);if(A<1)return"şimdi";if(A<60)return`${A}dk`;const t=Math.floor(A/60);if(t<24)return`${t}sa`;const I=Math.floor(t/24);if(I<30)return`${I}g`;const q=Math.floor(I/30);return q<12?`${q}ay`:`${Math.floor(q/12)}y`},Z=i=>{if(!i)return null;if(typeof i=="string")return i;const f=i._id||i.id;return f?String(f):null},W=new Set((E||[]).map(i=>String(i))),g=p!=null&&p._id?String(p._id):null,b=((L=(P=p==null?void 0:p.settings)==null?void 0:P.privacy)==null?void 0:L.showOnlineStatus)!==!1;g&&b?W.add(g):g&&!b&&W.delete(g);const F=i=>(i==null?void 0:i.role)==="owner"?3:(i==null?void 0:i.role)==="admin"||i!=null&&i.isAdmin?2:1,_=a.filter(i=>{if(!i)return!1;const f=Z(i);return f&&W.has(f)}).sort((i,f)=>{var t,I;const v=F(f)-F(i);if(v!==0)return v;const B=((t=i.profile)==null?void 0:t.displayName)||i.username||"",A=((I=f.profile)==null?void 0:I.displayName)||f.username||"";return B.localeCompare(A)}),C=a.filter(i=>{if(!i)return!1;const f=Z(i);return f&&!W.has(f)}).sort((i,f)=>{var t,I;const v=F(f)-F(i);if(v!==0)return v;const B=((t=i.profile)==null?void 0:t.displayName)||i.username||"",A=((I=f.profile)==null?void 0:I.displayName)||f.username||"";return B.localeCompare(A)});return e.jsxs("div",{className:"members-sidebar custom-scrollbar",children:[e.jsxs("div",{className:"members-header-top",children:[e.jsx("h3",{children:"ÜYELER"}),w&&e.jsx("button",{onClick:w,className:"close-members-btn","aria-label":"Kapat",children:e.jsx(ss,{size:20,strokeWidth:2})})]}),e.jsxs("div",{className:"members-category",children:["Çevrim içi — ",_.length]}),_.map((i,f)=>{var q,y,ee,le;if(!i||typeof i=="string")return null;const v=i.username||"Unknown",B=((q=i.profile)==null?void 0:q.avatar)||i.avatar,A=((y=i.profile)==null?void 0:y.displayName)||v,t=i.role==="owner",I=i.role==="admin"||i.isAdmin;return e.jsxs(Ys,{to:`/profile/${v}`,className:"member-item member-link",children:[e.jsxs("div",{className:"member-avatar-wrapper",children:[B?e.jsx("img",{src:ue(B),alt:"",className:"member-avatar"}):e.jsx("div",{className:"member-avatar-placeholder",children:((ee=A[0])==null?void 0:ee.toUpperCase())||((le=v[0])==null?void 0:le.toUpperCase())||"?"}),e.jsx("div",{className:"status-indicator online"})]}),e.jsx("div",{className:"member-info",children:e.jsxs("span",{className:"member-name active-role",style:{color:t?"#f1c40f":I?"#3498db":"#2ecc71"},children:[A,t&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!t&&I&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"})]})})]},i._id||i.id||f)}),e.jsxs("div",{className:"members-category",children:["Çevrim dışı — ",C.length]}),C.map((i,f)=>{var q,y,ee,le;if(!i||typeof i=="string")return null;const v=i.username||"Unknown",B=((q=i.profile)==null?void 0:q.avatar)||i.avatar,A=((y=i.profile)==null?void 0:y.displayName)||v,t=i.role==="owner",I=i.role==="admin"||i.isAdmin;return e.jsxs(Ys,{to:`/profile/${v}`,className:"member-item offline member-link",children:[e.jsx("div",{className:"member-avatar-wrapper",children:B?e.jsx("img",{src:ue(B),alt:"",className:"member-avatar"}):e.jsx("div",{className:"member-avatar-placeholder",style:{backgroundColor:"var(--bg-secondary)"},children:((ee=A[0])==null?void 0:ee.toUpperCase())||((le=v[0])==null?void 0:le.toUpperCase())||"?"})}),e.jsx("div",{className:"member-info",style:{flex:1},children:e.jsxs("div",{className:"member-name-row",style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("span",{className:"member-name",children:[A,t&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!t&&I&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"})]}),i.lastActive&&e.jsx("span",{className:"last-active-time",style:{fontSize:"11px",color:"var(--text-muted)"},children:h(i.lastActive)})]})})]},i._id||i.id||`offline-${f}`)}),e.jsx("style",{children:`
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
            `})]})},ma=()=>{var P,L;const{user:a,updateUser:w}=fs(),E=zs(),[p,H]=n.useState(null),[h,Z]=n.useState([]),[W,g]=n.useState(!0),[b,F]=n.useState(null);n.useEffect(()=>{let i=!0;return(async()=>{try{const v=await de.get("/api/portals/showcase");i&&v.data&&(H(v.data.globalPortal||null),Z(Array.isArray(v.data.topPortals)?v.data.topPortals:[]))}catch{}finally{i&&g(!1)}})(),()=>{i=!1}},[]);const _=async(i,f)=>{var v,B,A;if(i.stopPropagation(),!a){E("/login");return}if(f.isMember){E(`/portal/${f._id}`);return}if(!(f.isRequested||b===f._id)){F(f._id);try{const I=((v=(await de.post(`/api/portals/${f._id}/join`)).data)==null?void 0:v.status)==="requested",q=y=>!y||y._id!==f._id?y:{...y,isMember:!I,isRequested:I,memberCount:I?y.memberCount:(y.memberCount||0)+1};if((p==null?void 0:p._id)===f._id&&H(q(p)),Z(y=>y.map(q)),!I&&a&&w){const y=a.joinedPortals||[];y.some(ee=>(ee._id||ee).toString()===f._id.toString())||w({joinedPortals:[...y,f],portals:[...a.portals||[],f]})}}catch(t){alert(((A=(B=t.response)==null?void 0:B.data)==null?void 0:A.message)||"İşlem gerçekleştirilemedi.")}finally{F(null)}}},C=i=>i!=null&&i.banner?`url(${ue(i.banner)}) center/cover no-repeat`:"#141414";return e.jsxs("div",{className:"tanitim-showcase-wrapper",children:[e.jsxs("section",{className:"tanitim-guide-card",children:[e.jsxs("div",{className:"tanitim-guide-header",children:[e.jsxs("div",{className:"tanitim-guide-tag",children:[e.jsx(Gt,{size:13}),e.jsx("span",{children:"SİSTEM DİREKTİFİ // RESMİ PLATFORM REHBERİ"})]}),e.jsx("h1",{className:"tanitim-guide-title",children:"Oxypace İletişim Protokolü & Kullanım Mimarisi"}),e.jsx("p",{className:"tanitim-guide-lead",children:"Özgür, sansürsüz, yüksek performanslı ve gizlilik odaklı yeni nesil topluluk ekosistemi. Arayüz haritasını ve platformun tüm gelişmiş yeteneklerini aşağıdaki yönergelerden inceleyin."})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// NAVİGASYON VE MENÜ YERLEŞİMİ"}),e.jsx("h2",{className:"sub-section-title",children:"Sayfa Yapısı & Arayüz Konumlandırması"})]}),e.jsxs("div",{className:"tanitim-nav-map-grid",children:[e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(Wt,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ SOL NAVİGASYON BARI ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Ana Gezinme Çubuğu"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Doğrudan Mesajlar (DM):"})," Birebir şifreli özel yazışmalar ve anlık bildirim kutusu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portallar Listesi:"})," Üye olduğunuz veya yönettiğiniz tüm portalların dikey simgeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Keşfet Pusulası:"})," Yeni toplulukları, popüler portalları ve kişileri arama alanı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Oluştur (+):"})," Saniyeler içinde kendi özgür topluluğunuzu kurma aracı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kimlik & Hızlı Ayar:"})," En altta mikrofon, kulaklık ve profil hızlı kontrolleri."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(Vt,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ PORTAL İÇİ MENÜ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Kanal Hiyerarşisi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Kimliği:"})," Özel afiş, doğrulanmış rozet ve çevrimiçi üye göstergeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Metin Kanalları (#):"})," Tematik konulara göre ayrılmış gönderi ve tartışma akışları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Ses Kanalları (🎙️):"})," Tek dokunuşla girilebilen, gecikmesiz canlı ses odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Sahne Kanalları (🎤):"})," Seminer, podcast ve etkinlikler için konuşmacı odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Yönetimi:"})," Yöneticiler için yeni kanallar açma ve gizlilik kilidi."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(Zs,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ ÜST DENETİM & AKIŞ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"İçerik & Üye Denetimi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Üst Başlığı:"})," Aktif kanal adı, açıklaması ve hızlı üye paneli butonu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Üye Listesi Paneli:"})," Sağ tarafta çevrimiçi yöneticiler ve aktif üyeler."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Görsel Akış Alanı:"})," 4K videolar, çoklu galeriler ve doküman önizlemeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Bildirim Zil İkonu:"})," Kanal ve portal bazlı bildirim filtreleme ayarları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Ayarları:"})," Portal sahibi ve yöneticileri için tam yönetim konsolu."]})]})]})]})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// GELİŞMİŞ SİSTEM DİREKLERİ"}),e.jsx("h2",{className:"sub-section-title",children:"Platform Mekanizmaları & Özellikler"})]}),e.jsxs("div",{className:"tanitim-pillars-grid",children:[e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"01"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Ps,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Gelişmiş Mesaj Mekanizması"}),e.jsx("p",{className:"pillar-text",children:"Markdown formatlama, tek tıkla alıntılı yanıtlama (quote reply), kullanıcıyı doğrudan haberdar eden @etiketleme sistemi ve akıllı bağlantı (link preview) ayrıştırma desteği."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Alıntılı Yanıt"}),e.jsx("span",{className:"pillar-tag",children:"@Bahsetmeler"}),e.jsx("span",{className:"pillar-tag",children:"Mesaj Sabitleme"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"02"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Ot,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Canlı Ses Odaları & Sahne Modu"}),e.jsx("p",{className:"pillar-text",children:"Ultra düşük gecikmeli WebRTC ses mimarisi. Herkesin serbestçe katılabildiği sohbet odaları ile seminer ve konferanslar için konuşmacı-dinleyici ayrımı ve el kaldırma desteği sunan Sahne kanalları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Gecikme"}),e.jsx("span",{className:"pillar-tag",children:"Sahne Hiyerarşisi"}),e.jsx("span",{className:"pillar-tag",children:"Arka Planda Ses"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"03"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Yt,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Mobil Ekosistem & PIP Video"}),e.jsx("p",{className:"pillar-text",children:"Yerel Android APK ve tam uyumlu PWA deneyimi. Canlı FCM Push bildirimleri, mobil veri tasarrufu modu ve gezinirken köşede kesintisiz oynayan Kayan Resim İçinde Resim (PIP) video motoru."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Android APK / PWA"}),e.jsx("span",{className:"pillar-tag",children:"Canlı PIP Oynatıcı"}),e.jsx("span",{className:"pillar-tag",children:"FCM Push Bildirim"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"04"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Ht,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Ultra-HD Medya & Transcoding"}),e.jsx("p",{className:"pillar-text",children:"İstemci içi WASM motoru ile 360p'den 4K'ya kadar otomatik optimize edilen video akışı. Tek gönderide 10 adede kadar yüksek kaliteli fotoğraf galerisi ve tek tıkla önizlenebilir PDF dokümanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"4K Video Transcoding"}),e.jsx("span",{className:"pillar-tag",children:"10'lu Görsel Galerisi"}),e.jsx("span",{className:"pillar-tag",children:"PDF Doküman Desteği"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"05"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Zs,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Özelleştirilebilir Sistemler & Temalar"}),e.jsx("p",{className:"pillar-text",children:"Saf OLED siyahı ve yüksek kontrastlı Aydınlık tema desteği. Kişisel profil afişi, biyografi ve avatar özelleştirmeleri. Portallar için özel roller, izin matrisleri ve gizlilik kalkanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"OLED Siyah & Açık Tema"}),e.jsx("span",{className:"pillar-tag",children:"Rol & Yetki Matrisi"}),e.jsx("span",{className:"pillar-tag",children:"Özel Profil Afişi"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"06"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Jt,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Kripto-Güvenlik & Sıfır Takip"}),e.jsx("p",{className:"pillar-text",children:"Sıfır veri madenciliği ve ticari profil koruması. IP ve aktif cihaz oturum denetimi, güvenlik anahtarları ile hesap kurtarma ve doğrulanmış resmi topluluk rozetleri."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Veri İzleme"}),e.jsx("span",{className:"pillar-tag",children:"Cihaz & Oturum Denetimi"}),e.jsx("span",{className:"pillar-tag",children:"Onay Rozetleri"})]})]})]})]})]}),p&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ MERKEZ TOPLULUK // 01 ]"}),e.jsx("span",{className:"section-badge",children:"EN POPÜLER PORTAL"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Oxypace Global"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"Platformun en geniş üye kitlesine sahip resmi ana iletişim merkezi."})]}),e.jsxs("div",{className:"oxypace-global-hero-card",onClick:()=>E(`/portal/${p._id}`),children:[e.jsxs("div",{className:"hero-card-banner",style:{background:C(p)},children:[e.jsx("div",{className:"hero-banner-overlay"}),e.jsx("div",{className:"hero-banner-badge",children:e.jsx("span",{children:"ANA TOPLULUK"})})]}),e.jsxs("div",{className:"hero-card-body",children:[e.jsxs("div",{className:"hero-header-row",children:[e.jsx("div",{className:"hero-avatar-box",children:p.avatar?e.jsx("img",{src:ue(p.avatar),alt:p.name,className:"hero-avatar-img"}):e.jsx("div",{className:"hero-avatar-fallback",children:((L=(P=p.name)==null?void 0:P.substring(0,2))==null?void 0:L.toUpperCase())||"OG"})}),e.jsxs("div",{className:"hero-identity-col",children:[e.jsxs("div",{className:"hero-name-row",children:[e.jsx("h3",{className:"hero-portal-name",children:p.name}),e.jsx(Qs,{type:p.isVerified?"verified":"official",size:18}),e.jsx("span",{className:"hero-privacy-tag",children:p.privacy==="private"?e.jsxs(e.Fragment,{children:[e.jsx(Zt,{size:11})," GİZLİ"]}):e.jsxs(e.Fragment,{children:[e.jsx(Qt,{size:11})," HERKESE AÇIK"]})})]}),e.jsx("div",{className:"hero-meta-row",children:e.jsxs("div",{className:"hero-member-stat",children:[e.jsx(Cs,{size:14}),e.jsxs("span",{children:[(p.memberCount||0).toLocaleString("tr-TR")," Üye"]})]})})]}),e.jsx("div",{className:"hero-action-col",children:e.jsx("button",{type:"button",className:`tanitim-sharp-btn hero-btn ${p.isMember?"btn-joined":p.isRequested?"btn-requested":"btn-action"}`,onClick:i=>_(i,p),disabled:b===p._id||p.isRequested,children:b===p._id?"İŞLENİYOR...":p.isMember?e.jsxs(e.Fragment,{children:[e.jsx(Xt,{size:14}),"ÜYESİNİZ"]}):p.isRequested?e.jsxs(e.Fragment,{children:[e.jsx(tt,{size:14}),"İSTEK GÖNDERİLDİ"]}):p.privacy==="private"?"ÜYELİK İSTEĞİ GÖNDER":"PORTALA KATIL"})})]}),e.jsx("p",{className:"hero-description",children:p.description||"Oxypace platformunun ana buluşma noktası. Güncel duyurular, teknik tartışmalar ve küresel topluluk etkileşimi."})]})]})]}),h.length>0&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ AKTİF TOPLULUKLAR // 02 ]"}),e.jsx("span",{className:"section-badge",children:"ÖNE ÇIKAN PORTALLAR"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Popüler Topluluklar"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"En çok paylaşıma ve aktif etkileşime sahip seçkin portallar."})]}),e.jsx("div",{className:"tanitim-portals-row",children:h.map(i=>{var f,v,B;return e.jsxs("div",{className:"tanitim-classic-card",onClick:()=>E(`/portal/${i._id}`),children:[e.jsx("div",{className:"classic-card-banner",style:{background:C(i)},children:e.jsx("div",{className:"classic-banner-overlay"})}),e.jsx("div",{className:"classic-card-icon-wrapper",children:i.avatar?e.jsx("img",{src:ue(i.avatar),alt:i.name,className:"classic-card-icon-img",loading:"lazy"}):e.jsx("div",{className:"classic-card-icon-placeholder",children:((v=(f=i.name)==null?void 0:f.substring(0,2))==null?void 0:v.toUpperCase())||"P"})}),e.jsxs("div",{className:"classic-card-body",children:[e.jsxs("div",{className:"classic-card-title-row",children:[e.jsx("h4",{className:"classic-card-title",children:i.name}),e.jsx(Qs,{type:i.isVerified?"verified":(B=i.badges)==null?void 0:B[0],size:16})]}),e.jsx("p",{className:"classic-card-desc",children:i.description||"Bu topluluk hakkında henüz bir açıklama girilmemiş."}),e.jsxs("div",{className:"classic-card-footer",children:[e.jsxs("div",{className:"classic-member-count",children:[e.jsx(Cs,{size:12}),e.jsxs("span",{children:[i.memberCount||0," Üye"]})]}),e.jsx("button",{type:"button",className:`tanitim-sharp-btn small-btn ${i.isMember?"btn-joined":i.isRequested?"btn-requested":"btn-action"}`,onClick:A=>_(A,i),disabled:b===i._id||i.isRequested,children:b===i._id?"...":i.isMember?"ÜYESİNİZ":i.isRequested?"İSTEK":i.privacy==="private"?"İSTEK AT":"KATIL"})]})]})]},i._id)})})]})]})},pa=({alerts:a=[]})=>{const[w,E]=n.useState(()=>{try{const g=sessionStorage.getItem("dismissed_portal_alerts");return g?JSON.parse(g):[]}catch{return[]}}),[p,H]=n.useState(null),h=a.filter(g=>!w.includes(g._id)),Z=g=>{H(g),setTimeout(()=>{const b=[...w,g];E(b);try{sessionStorage.setItem("dismissed_portal_alerts",JSON.stringify(b))}catch{}H(null)},300)},W=g=>{const b=new Date,_=new Date(g)-b;if(_<=0)return null;const C=Math.floor(_/(1e3*60*60*24)),P=Math.floor(_/(1e3*60*60)%24),L=Math.floor(_/(1e3*60)%60);return C>0?`${C} gün ${P} saat kaldı`:P>0?`${P} saat ${L} dk kaldı`:`${L} dakika kaldı`};return h.length===0?null:e.jsx(e.Fragment,{children:h.map(g=>e.jsx("div",{className:`portal-alert-banner ${p===g._id?"dismissing":""}`,children:e.jsxs("div",{className:"alert-banner-inner",children:[e.jsx("div",{className:"alert-banner-icon",children:e.jsx(ea,{size:18,strokeWidth:2})}),e.jsxs("div",{className:"alert-banner-content",children:[e.jsx("div",{className:"alert-banner-label",children:e.jsx("span",{children:"Yönetici Uyarısı"})}),e.jsx("div",{className:"alert-banner-message",children:g.message}),e.jsx("div",{className:"alert-banner-meta",children:e.jsxs("span",{className:"alert-banner-time",children:[e.jsx(tt,{size:16,strokeWidth:2}),W(g.expiresAt)||"Süresi dolmak üzere"]})})]}),e.jsx("button",{className:"alert-banner-close",onClick:()=>Z(g._id),title:"Uyarıyı gizle",children:e.jsx(ss,{size:16,strokeWidth:2.5})})]})},g._id))})},ua=n.lazy(()=>xs(()=>import("./PortalSettingsModal-CRRduw6S.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13]))),ha=n.lazy(()=>xs(()=>import("./PortalNotifications-BLb4sSq1.js"),__vite__mapDeps([14,1,2,3,4,5,6,15]))),xa=n.lazy(()=>xs(()=>import("./VoiceChannel-BZ3koJ2s.js"),__vite__mapDeps([16,1,4,2,3,5,6,17,18]))),fa=n.lazy(()=>xs(()=>import("./ConferenceChannel-D800Jc3r.js"),__vite__mapDeps([19,1,4,2,3,5,6,17,18]))),qa=()=>{var Ws,Vs,Os;const{id:a}=St(),w=Ct(),[E]=zt(),p=E.get("channel"),H=E.get("post"),{user:h,token:Z,updateUser:W,loading:g}=fs(),{socket:b,connected:F}=_s(),_=zs(),C=st(),{isSidebarOpen:P,closeSidebar:L,isMobileView:i,mobileChannelOpen:f,setMobileChannelOpen:v}=C||{},B=(C==null?void 0:C.isDesktopSidebarCollapsed)||!1,A=typeof window<"u"&&!!localStorage.getItem("admin_backup_token"),[t,I]=n.useState(()=>{var s;return(s=w==null?void 0:w.state)!=null&&s.portal&&(String(w.state.portal._id)===String(a)||String(w.state.portal.id)===String(a))?w.state.portal:null});n.useEffect(()=>{var s;(s=w==null?void 0:w.state)!=null&&s.portal&&(String(w.state.portal._id)===String(a)||String(w.state.portal.id)===String(a))&&I(w.state.portal)},[a,w.state]);const q=hs(s=>s.posts),y=hs(s=>s.setPosts),[ee,le]=n.useState(!0),[ge,Ae]=n.useState(!1),[Pe,X]=n.useState(""),[se,Fe]=n.useState(null),[me,Ee]=n.useState(null),[Me,Re]=n.useState(!1),[z,te]=n.useState(null),[Le,he]=n.useState({}),[De,be]=n.useState(!1),[xe,Ke]=n.useState(""),[oe,ve]=n.useState([]);n.useRef(null);const[ye,$e]=n.useState(!1),[Se,l]=n.useState(!1),[k,je]=n.useState({show:!1,message:"",type:"info"}),[Be,ke]=n.useState(!1),[re,Q]=n.useState(!1),[Ne,Ce]=n.useState({top:0,left:0}),[qe,ts]=n.useState(""),[Is,as]=n.useState(!1),Ge=n.useRef(null),Ts=n.useRef(null),As=n.useRef(null),Es=n.useRef(null),[D,Ue]=n.useState(null),[ze,We]=n.useState([]),[Ie,Ve]=n.useState([]),[K,is]=n.useState(null),[at,Oe]=n.useState(0),[Ms,gs]=n.useState(!1),ns=n.useRef(!1);Tt();const we=Hs(s=>s.activeUploads)[`portal-${a}`];n.useEffect(()=>{we&&we.status==="uploading"&&y(s=>s.map(r=>r.isOptimistic&&r.mediaType==="video"?{...r,uploadProgress:we.progress}:r))},[we==null?void 0:we.progress,we==null?void 0:we.status]);const[it,rs]=n.useState(!1),ls=!!(t!=null&&t.name&&/Oxypace Tan[ıi]t[ıi]m/i.test(t.name)),nt=!!(h&&(((Ws=h.username)==null?void 0:Ws.toLowerCase())==="oxypace"||h.isAdmin)),rt=ls?nt:h&&Me,lt=n.useRef(null),Ye=n.useRef(null),ot=n.useCallback(s=>{s.preventDefault(),s.stopPropagation(),Q(r=>{if(!r&&Ye.current){const o=Ye.current.getBoundingClientRect();Ce({top:o.bottom+8,left:o.left})}return!r})},[]);n.useEffect(()=>{if(!re)return;let s=!0;const r=()=>{if(Ye.current){const d=Ye.current.getBoundingClientRect();Ce({top:d.bottom+8,left:d.left})}},o=d=>{if(!s)return;const x=d.target.closest(".plus-menu")||d.target.closest(".portal-plus-menu-portal"),S=d.target.closest(".upload-btn");!x&&!S&&Q(!1)},c=setTimeout(()=>{s&&(document.addEventListener("click",o),document.addEventListener("touchstart",o))},0);return window.addEventListener("scroll",r,!0),window.addEventListener("resize",r),()=>{s=!1,clearTimeout(c),document.removeEventListener("click",o),document.removeEventListener("touchstart",o),window.removeEventListener("scroll",r,!0),window.removeEventListener("resize",r)}},[re]),n.useEffect(()=>()=>{Q(!1)},[]),n.useEffect(()=>{Q(!1)},[z,a]),n.useEffect(()=>{var s;(s=w.state)!=null&&s.quotedPost&&(is(w.state.quotedPost),w.state.selectedChannelId&&te(w.state.selectedChannelId),_(w.pathname+w.search,{replace:!0,state:{}}))},[w.state,a]);const Y=(Vs=t==null?void 0:t.channels)==null?void 0:Vs.find(s=>String(s._id)===String(z)),os=(Y==null?void 0:Y.type)==="image",Rs=(Y==null?void 0:Y.type)==="voice"||(Y==null?void 0:Y.type)==="conference",Ls=Rs&&(!i||f);n.useEffect(()=>{t!=null&&t.channels&&Array.isArray(t.channels)&&he(s=>{const r={...s};return t.channels.forEach(o=>{const c=String(o._id);o.postCount!==void 0&&(r[c]=o.postCount)}),r})},[t==null?void 0:t.channels]),n.useEffect(()=>{if(!b||!F||!a)return;b.emit("join_portal",a),b.emit("get_online_users"),z&&b.emit("join_channel",z);const s=d=>{var M,N,G,j;const x=((M=d.portal)==null?void 0:M._id)||d.portal,S=((N=d.channel)==null?void 0:N._id)||d.channel,u=String(x)===String(a),R=String(S)===String(z);if(u&&R){const U=((G=d.author)==null?void 0:G._id)||((j=d.author)==null?void 0:j.id)||d.author;if(String(U)!==String(h==null?void 0:h._id)){const V=String(z);he(J=>({...J,[V]:(J[V]!==void 0?J[V]:(Y==null?void 0:Y.postCount)||0)+1}))}y(V=>{if(V.some(pe=>pe._id===d._id))return V;const J=d.quotedPost&&(typeof d.quotedPost=="string"?d.quotedPost:d.quotedPost._id);if(J){const pe=V.find(ie=>ie._id===J);pe&&typeof pe=="object"&&pe.author?d.quotedPost=pe:K&&J===K._id&&(d.quotedPost=K)}return[d,...V]})}},r=d=>{var u;const x=((u=d.portal)==null?void 0:u._id)||d.portal;(!x||String(x)===String(a))&&y(R=>R.map(M=>String(M._id)===String(d._id)?d:M))},o=({userId:d,status:x,lastActive:S})=>{x==="offline"&&ve(u=>u.filter(R=>String(R.userId)!==String(d))),I(u=>{if(!u)return u;const R=S||new Date;let M=u.owner;if(u.owner){const j=u.owner._id||u.owner.id||u.owner;String(j)===String(d)&&typeof u.owner=="object"&&(M={...u.owner,lastActive:R})}let N=u.admins;Array.isArray(u.admins)&&(N=u.admins.map(j=>{const U=j._id||j.id||j;return String(U)===String(d)&&typeof j=="object"&&j!==null?{...j,lastActive:R}:j}));let G=u.members;return Array.isArray(u.members)&&(G=u.members.map(j=>{const U=j._id||j.id||j;return String(U)===String(d)&&typeof j=="object"&&j!==null?{...j,lastActive:R}:j})),{...u,owner:M,admins:N,members:G}})},c=({userId:d,username:x,displayName:S,avatar:u,isTyping:R})=>{String(d)!==String(h==null?void 0:h._id)&&ve(M=>R?M.some(N=>String(N.userId)===String(d))?M:[...M,{userId:d,username:x,displayName:S,avatar:u}]:M.filter(N=>String(N.userId)!==String(d)))};return b.on("post:created",s),b.on("post:updated",r),b.on("user_status_change",o),b.on("portal_typing_update",c),()=>{b.off("post:created",s),b.off("post:updated",r),b.off("user_status_change",o),b.off("portal_typing_update",c)}},[b,F,a,z,h==null?void 0:h._id]);const ct=s=>{if(!s)return null;const r=/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,o=s.match(r);return o&&o[2].length===11?o[2]:null},dt=s=>{const r=s.target.value;ts(r)},Ds=()=>{const s=ct(qe);if(!s){ae("Geçersiz YouTube URL'si","error");return}Ue({name:"YouTube Video",type:"youtube",preview:`https://img.youtube.com/vi/${s}/hqdefault.jpg`,url:qe}),as(!1),ts("")},[mt,cs]=n.useState(!1),[pt,ut]=n.useState(0),bs=n.useRef(null),vs=n.useRef(null),He=n.useRef(null),ht=n.useCallback(s=>{const r=s.target;vs.current||(vs.current=requestAnimationFrame(()=>{vs.current=null;const o=r.scrollTop,c=o>300;cs(x=>x!==c?c:x);const d=r.scrollHeight-r.clientHeight;if(d>0){const x=Math.round(o/d*100);ut(S=>Math.abs(S-x)>=2?x:S)}}))},[]),xt=n.useCallback(s=>{s&&(s.preventDefault(),s.stopPropagation()),He.current&&cancelAnimationFrame(He.current);const r=bs.current||document.querySelector(".discord-feed")||document.querySelector(".portal-feed-container");if(!r){window.scrollTo({top:0,behavior:"smooth"});return}const o=r.scrollTop;if(o<=0)return;const c=800,d=performance.now(),x=u=>1-Math.pow(1-u,5),S=u=>{const R=u-d,M=Math.min(R/c,1),N=x(M);r.scrollTop=Math.round(o*(1-N)),M<1?He.current=requestAnimationFrame(S):(r.scrollTop=0,He.current=null)};He.current=requestAnimationFrame(S)},[]),ft=s=>{te(s),cs(!1),i&&(L(),v(!0))},ae=n.useCallback((s,r="info")=>{je({show:!0,message:s,type:r}),setTimeout(()=>je(o=>({...o,show:!1})),4e3)},[]),gt=s=>{const r=Array.from(s.target.files||[]);if(r.length===0)return;Ue(null),ns.current=!1;const c=10-ze.length;if(c<=0){ae("Bir gönderiye en fazla 10 görsel ekleyebilirsiniz.","warning");return}const d=r.slice(0,c);r.length>c&&ae(`En fazla 10 görsel ekleyebilirsiniz. İlk ${c} görsel eklendi.`,"warning");const x=[],S=[];for(const u of d){if(u.size>2*1024*1024*1024){ae(`${u.name} boyutu 2 GB'dan büyük olamaz.`,"error");continue}x.push(u),S.push({url:URL.createObjectURL(u),name:u.name,size:u.size,file:u})}We(u=>[...u,...x]),Ve(u=>[...u,...S]),Q(!1),Ge.current&&(Ge.current.value="")},bt=s=>{We(r=>r.filter((o,c)=>c!==s)),Ve(r=>{const o=r[s];if(o&&o.url&&o.url.startsWith("blob:"))try{URL.revokeObjectURL(o.url)}catch{}return r.filter((c,d)=>d!==s)})},ys=s=>{const r=s.target.files[0];if(r){if(r.size>2*1024*1024*1024){ae("Dosya boyutu 2 GB'dan büyük olamaz.","error");return}We([]),Ve([]),Ue(r),ns.current=r.type.startsWith("video/")||["mp4","webm","ogg","mov","m4v"].includes(r.name.split(".").pop().toLowerCase()),Q(!1)}};n.useEffect(()=>{A||!b||!a||(xe.trim().length>0||D!==null||ze.length>0?ye||($e(!0),b.emit("portal_typing",{portalId:a,isTyping:!0})):ye&&(b.emit("portal_typing",{portalId:a,isTyping:!1}),$e(!1)))},[xe,D,ze,a,b,ye,A]),n.useEffect(()=>()=>{!A&&b&&a&&ye&&b.emit("portal_typing",{portalId:a,isTyping:!1})},[a,b,ye,A]);const $s=async()=>{var N,G;if(A){ae("Hayalet Modu: Salt okunur izleme modundasınız. Gönderi paylaşılamaz.","error");return}const s=xe.trim().length>0,r=!!D,o=ze.length>0;if(!s&&!r&&!o)return;b&&a&&b.emit("portal_typing",{portalId:a,isTyping:!1}),$e(!1);const c={content:xe,media:D,mediaFiles:[...ze],mediaPreviews:[...Ie]},d=D&&D.type==="youtube",x=`temp-${Date.now()}`;let S=null,u=null;d?(S=D.url,u="youtube"):o?(S=Ie.map(j=>j.url),u="image"):D&&(S=URL.createObjectURL(D),u=D.type.startsWith("video")?"video":D.type.includes("gif")?"gif":"image");const R=u==="video",M={_id:x,content:xe,media:S,mediaType:u||"none",author:h,createdAt:new Date().toISOString(),likes:[],likeCount:0,isOptimistic:!0,quotedPost:K,isProcessing:!!R,processingProgress:0,estimatedTime:R?"Hesaplanıyor...":""};if(y(j=>[M,...j]),z){const j=String(z);he(U=>({...U,[j]:(U[j]!==void 0?U[j]:(Y==null?void 0:Y.postCount)||0)+1}))}Ke(""),Ue(null),We([]),Ve([]),Q(!1),gs(!0),Oe(0);try{let j=null,U=null,V=null,J=null,pe=null;if(d)V=c.media.url,J="youtube";else if(c.mediaFiles&&c.mediaFiles.length>0){const m=c.mediaFiles.length,T=new Array(m).fill(0),O=c.mediaFiles.map(($,ne)=>Js($,"post",a,Xe=>{T[ne]=Xe;const ce=Math.round(T.reduce((fe,_e)=>fe+_e,0)/m);Oe(ce),y(fe=>fe.map(_e=>String(_e._id)===String(x)?{..._e,uploadProgress:ce}:_e))}));U=await Promise.all(O)}else if(c.media)if(ns.current){Hs.getState().startVideoUpload({file:c.media,portalId:a,channel:z,content:c.content,quotedPostId:K==null?void 0:K._id,onFinish:(m,T)=>{if(m){if(y(O=>O.filter($=>String($._id)!==String(x))),z){const O=String(z);he($=>({...$,[O]:Math.max(0,($[O]||1)-1)}))}ae("Video yükleme başarısız oldu.","error")}else if(T){const O=String(x);y($=>{const ne=String(T._id);return $.some(ce=>String(ce._id)===ne)?$.filter(ce=>String(ce._id)!==O):$.map(ce=>{if(String(ce._id)===O){const fe=T,_e=fe.quotedPost&&(typeof fe.quotedPost=="string"?fe.quotedPost:fe.quotedPost._id);return _e&&ce.quotedPost&&_e===ce.quotedPost._id&&(fe.quotedPost=ce.quotedPost),fe}return ce})})}}}),gs(!1),is(null);return}else j=await Js(c.media,"post",a,m=>{Oe(m),y(T=>T.map(O=>String(O._id)===String(x)?{...O,uploadProgress:m}:O))});else Oe(100);const ie={content:c.content,portalId:a,channel:z,quotedPostId:K==null?void 0:K._id};U&&U.length>0?(ie.mediaKeys=U,ie.mediaType="image"):j?(ie.mediaKey=j,ns.current?ie.mediaType="video":c.media&&(c.media.type==="application/pdf"||c.media.name.toLowerCase().endsWith(".pdf"))&&(ie.pdfName=c.media.name,ie.pdfSize=c.media.size)):V&&(ie.media=V,ie.mediaType=J);const Ze=await de.post("/api/posts",ie);is(null);const Qe=String(x);y(m=>{const T=String(Ze.data._id);return m.some($=>String($._id)===T)?m.filter($=>String($._id)!==Qe):m.map($=>{if(String($._id)===Qe){const ne=Ze.data,Xe=ne.quotedPost&&(typeof ne.quotedPost=="string"?ne.quotedPost:ne.quotedPost._id);return Xe&&$.quotedPost&&Xe===$.quotedPost._id&&(ne.quotedPost=$.quotedPost),ne}return $})})}catch(j){const U=((G=(N=j.response)==null?void 0:N.data)==null?void 0:G.message)||j.message;if(ae(U,"error"),y(V=>V.filter(J=>String(J._id)!==String(x))),z){const V=String(z);he(J=>({...J,[V]:Math.max(0,(J[V]||1)-1)}))}Ke(c.content),Ue(c.media),We(c.mediaFiles||[]),Ve(c.mediaPreviews||[])}finally{gs(!1),Oe(0)}},[js,Te]=n.useState(!1),[ks,ds]=n.useState("overview"),[ba,va]=n.useState(!1),[ya,vt]=n.useState({name:"",description:"",privacy:"public"});n.useRef(null),n.useRef(null),n.useEffect(()=>{a&&!g&&Bs()},[a,g]),n.useEffect(()=>{E.get("openSettings")==="true"&&(ds("overview"),Te(!0))},[E]),n.useEffect(()=>{if(t&&t._id&&t.name)try{const s=localStorage.getItem("oxypace_portal_visits"),r=s?JSON.parse(s):{},o=String(t._id),c=r[o]||{count:0};r[o]={id:o,name:t.name,avatar:t.avatar,count:(c.count||0)+1,lastVisited:Date.now()},localStorage.setItem("oxypace_portal_visits",JSON.stringify(r));let d=0,x=null;Object.values(r).forEach(S=>{S.count>d&&(d=S.count,x=S)}),x&&localStorage.setItem("oxypace_top_portal",JSON.stringify({id:x.id,name:x.name}))}catch{}},[t==null?void 0:t._id,t==null?void 0:t.name]),n.useEffect(()=>{if(!g&&t&&t.channels&&t.channels.length>0)if(z){if(p){const r=t.channels.find(o=>String(o._id)===String(p));if(r&&String(r._id)!==String(z)){te(r._id);return}}if(!t.channels.some(r=>String(r._id)===String(z))){const r=t.channels[0];r&&te(r._id)}}else{if(p){const r=t.channels.find(o=>String(o._id)===String(p));if(r){te(r._id);return}}const s=t.channels[0];s&&te(s._id)}},[t,g,p]),n.useEffect(()=>{const s=r=>{const{portalId:o,channelId:c}=r.detail||{};(!o||String(o)===String(a))&&c&&(te(c),cs(!1),v&&v(!0))};return window.addEventListener("oxypace:switch_channel",s),()=>window.removeEventListener("oxypace:switch_channel",s)},[a,v]),n.useLayoutEffect(()=>{const s=!!p||E.get("joinVoice")==="true";v&&s&&v(!0)},[a,p,E,v]),n.useEffect(()=>{a&&z&&t&&Ss(t._id,a)&&ps()},[a,z,t==null?void 0:t._id]),n.useEffect(()=>{if(H&&!De&&!ge&&Array.isArray(q)&&q.length>0){const s=document.getElementById(`post-${H}`);s&&setTimeout(()=>{s.scrollIntoView({behavior:"smooth",block:"center"}),s.classList.add("highlight-post"),setTimeout(()=>s.classList.remove("highlight-post"),2e3),be(!0)},100)}},[H,q,ge,De]),n.useEffect(()=>{var s,r;if(t&&h){const o=((s=t.members)==null?void 0:s.includes(h._id))||((r=h.joinedPortals)==null?void 0:r.some(c=>c._id===t._id||c===t._id));Re(!!o)}},[t,h]);const Bs=async()=>{(!t||t._id!==a)&&(le(!0),cs(!1));try{const s=await de.get(`/api/portals/${a}`);I(s.data),vt({name:s.data.name,description:s.data.description||"",privacy:s.data.privacy||"public"})}catch(s){if(s.response&&s.response.status===403){const r=s.response.data;r.portalStatus==="suspended"||r.portalStatus==="closed"?(Fe({portalStatus:r.portalStatus,statusReason:r.statusReason,suspendedUntil:r.suspendedUntil,portalName:r.portalName,portalAvatar:r.portalAvatar}),X("suspended")):X("blocked")}else s.response&&s.response.status===404?X("blocked"):X("Portal yüklenemedi")}finally{le(!1)}},ms=n.useRef(null),qs=n.useRef(q);qs.current=q;const Je=n.useRef(z);Je.current=z;const ps=n.useCallback(async(s=!1)=>{var r,o;s?Fs(!0):(ms.current&&ms.current.abort(),ms.current=new AbortController,Ae(!0),y([]),Ns(!0));try{const c=localStorage.getItem("token"),d={signal:(r=ms.current)==null?void 0:r.signal,...c&&{headers:{Authorization:`Bearer ${c}`}}},x=Je.current;if(s&&x!==Je.current)return;let S=`/api/portals/${a}/posts?channel=${x}&limit=10`;const u=qs.current;if(s&&u.length>0){const N=u[u.length-1];S+=`&before=${N.createdAt}`}const R=await de.get(S,d),M=R.data;if(R.headers&&R.headers["x-total-count"]!==void 0){const N=parseInt(R.headers["x-total-count"],10);isNaN(N)||he(G=>({...G,[String(x)]:N}))}M.length<10&&Ns(!1),y(s?N=>{const G=new Set(N.map(U=>U._id)),j=M.filter(U=>!G.has(U._id));return[...N,...j]}:M),X("")}catch(c){if(de.isCancel(c))return;((o=c.response)==null?void 0:o.status)===403?X("private"):X("Gönderiler yüklenemedi")}finally{s||Ae(!1),Fs(!1),le(!1)}},[a]),[Us,Ns]=n.useState(!0),[ws,Fs]=n.useState(!1),us=n.useRef(),yt=n.useCallback(s=>{ws||(us.current&&us.current.disconnect(),us.current=new IntersectionObserver(r=>{r[0].isIntersecting&&Us&&ps(!0)},{root:bs.current,rootMargin:"200px"}),s&&us.current.observe(s))},[ws,Us,ps]);n.useEffect(()=>{y([]),Ns(!0),te(null),I(null),X(""),v(!1)},[a]);const jt=n.useCallback(s=>{y(o=>o.filter(c=>String(c._id)!==String(s)));const r=Je.current;r&&he(o=>({...o,[String(r)]:Math.max(0,(o[String(r)]||1)-1)}))},[y]),kt=n.useCallback((s,r)=>{if(r){y(c=>c.filter(d=>String(d._id)!==String(s)));const o=Je.current;o&&he(c=>({...c,[String(o)]:Math.max(0,(c[String(o)]||1)-1)}))}},[y]),Nt=n.useCallback(async s=>{try{const o=(await de.put(`/api/posts/${s}/pin`)).data;y(c=>c.map(x=>x._id===s?o:x).sort((x,S)=>x.isPinned===S.isPinned?new Date(S.createdAt)-new Date(x.createdAt):x.isPinned?-1:1))}catch{ae("Sabitleme işlemi başarısız","error")}},[y,ae]),wt=async()=>{var s,r;if(!h){ae("Lütfen giriş yapın veya kaydolun!","warning");return}try{const o=localStorage.getItem("token"),c=o?{headers:{Authorization:`Bearer ${o}`}}:{};if((await de.post(`/api/portals/${a}/join`,{},c)).data.status==="joined"){Re(!0);const x=Array.isArray(h==null?void 0:h.joinedPortals)?h.joinedPortals:[],S=Array.isArray(h==null?void 0:h.portals)?h.portals:[],u=[...x.filter(N=>{var G;return((G=(N==null?void 0:N._id)||N)==null?void 0:G.toString())!==a.toString()}),t],R=[...S.filter(N=>{var G;return((G=(N==null?void 0:N._id)||N)==null?void 0:G.toString())!==a.toString()}),t],M={...h,joinedPortals:u,portals:R};W(M),I(N=>({...N,members:[...N.members||[],h._id]})),ps(),ae("Portala başarıyla katıldınız!","success")}else ae("Üyelik isteğiniz gönderildi!","info"),I(x=>({...x,isRequested:!0}))}catch(o){ae(((r=(s=o.response)==null?void 0:s.data)==null?void 0:r.message)||"Katılma başarısız","error")}},Ss=(s,r)=>{if(!s||!r)return!1;const o=typeof s=="object"?s.toString():s,c=typeof r=="object"?r.toString():r;return o===c},Ks=h&&t&&t.owner&&Ss(t.owner._id||t.owner,h._id),Gs=Ks||h&&t&&t.admins&&t.admins.some(s=>Ss(s._id||s,h._id));if(n.useEffect(()=>{if(!(se!=null&&se.suspendedUntil)){Ee(null);return}const s=()=>{const o=new Date,d=new Date(se.suspendedUntil)-o;if(d<=0){Ee(null),window.location.reload();return}Ee({days:Math.floor(d/(1e3*60*60*24)),hours:Math.floor(d/(1e3*60*60)%24),minutes:Math.floor(d/(1e3*60)%60),seconds:Math.floor(d/1e3%60)})};s();const r=setInterval(s,1e3);return()=>clearInterval(r)},[se]),!Z&&!g)return e.jsx(_t,{to:"/",replace:!0});if(Pe==="suspended"&&se){const s=se.portalStatus==="suspended",r=se.suspendedUntil?new Date(se.suspendedUntil).toLocaleString("tr-TR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):null;return e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsx("div",{className:"suspension-screen",children:e.jsxs("div",{className:"suspension-card",children:[e.jsx("div",{className:"suspension-icon",children:s?"⏸️":"🔒"}),e.jsx("h1",{className:"suspension-title",children:se.portalName||"Portal"}),e.jsx("h2",{className:"suspension-subtitle",children:s?"Bu portal geçici olarak askıya alındı":"Bu portal kapatılmıştır"}),se.statusReason&&e.jsxs("div",{className:"suspension-reason",children:[e.jsx("div",{className:"suspension-reason-label",children:"Sebep"}),e.jsx("p",{children:se.statusReason})]}),s&&r&&e.jsxs("div",{className:"suspension-unlock",children:[e.jsx("div",{className:"suspension-unlock-label",children:"🔓 Erişim Açılma Tarihi"}),e.jsx("div",{className:"suspension-unlock-date",children:r}),me&&e.jsxs("div",{className:"suspension-countdown",children:[e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(me.days).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Gün"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(me.hours).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saat"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(me.minutes).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Dakika"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(me.seconds).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saniye"})]})]})]}),e.jsxs("div",{className:"suspension-policy",children:[e.jsx("span",{children:"📋"}),e.jsxs("p",{children:["Askıya alma nedenleri, platformun ",e.jsx("strong",{children:"Politika ve Koşullar"}),"'ı kapsamında değerlendirilmektedir. Detaylı bilgi için kurallarımızı inceleyebilirsiniz."]})]}),e.jsx("button",{onClick:()=>_("/"),className:"suspension-home-btn",children:"Anasayfaya Dön"})]})})]})}return Pe==="blocked"?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsxs("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center",flexDirection:"column",color:"var(--text-muted)"},children:[e.jsx("div",{style:{fontSize:"3rem",marginBottom:"1rem"},children:"🚫"}),e.jsx("h2",{children:"Sonuç Bulunamadı"}),e.jsx("p",{children:"Aradığınız portala ulaşılamıyor."}),e.jsx("button",{onClick:()=>_("/"),className:"btn-save",style:{marginTop:"20px",float:"none"},children:"Anasayfaya Dön"})]})]}):ee||g||!t?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsx("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center"},children:e.jsx("div",{className:"spinner"})})]}):t.isNSFW&&!Be&&!sessionStorage.getItem(`nsfw_confirmed_${a}`)?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsx("div",{className:"nsfw-gate-overlay",children:e.jsxs("div",{className:"nsfw-gate-card",children:[e.jsx("div",{className:"nsfw-gate-icon",children:e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]})}),e.jsx("div",{className:"nsfw-gate-badge",children:"+18"}),e.jsx("h1",{className:"nsfw-gate-title",children:"Yaş Kısıtlaması"}),e.jsxs("p",{className:"nsfw-gate-desc",children:[e.jsx("strong",{children:t.name})," portalı yetişkin içerik barındırabilir. Bu portala erişmek için 18 yaşından büyük olmanız gerekmektedir."]}),e.jsxs("div",{className:"nsfw-gate-actions",children:[e.jsx("button",{className:"nsfw-gate-confirm",onClick:()=>{sessionStorage.setItem(`nsfw_confirmed_${a}`,"true"),ke(!0)},children:"18 yaşından büyüğüm, devam et"}),e.jsx("button",{className:"nsfw-gate-cancel",onClick:()=>_(-1),children:"Geri Dön"})]}),e.jsx("p",{className:"nsfw-gate-legal",children:"Devam ederek, yaşınızın 18'den büyük olduğunu ve yetişkin içerikle ilgili yasal sorumluluğu kabul ettiğinizi onaylarsınız."})]})})]}):e.jsxs("div",{className:`app-wrapper full-height discord-layout ${Ls?"voice-channel-active":""}`,children:[e.jsx(ra,{title:t.name,description:t.description||`${t.name} topluluğuna katılın.`,image:ue(t.avatar),type:"website",schema:{"@context":"https://schema.org","@type":"Community",name:t.name,description:t.description,url:window.location.href,memberCount:((Os=t.members)==null?void 0:Os.length)||0}}),!js&&e.jsx(es,{}),k.show&&e.jsxs("div",{className:`app-toast ${k.type}`,children:[e.jsx("span",{className:"app-toast-icon",children:k.type==="error"?"🚫":k.type==="success"?"✅":k.type==="warning"?"⚠️":"ℹ️"}),k.message]}),e.jsxs("div",{className:`discord-split-view ${i&&f?"mobile-feed-active":""} ${Ls?"voice-room-active":""} ${B?"sidebar-collapsed":""}`,children:[h&&e.jsx(ca,{portal:t,isMember:Me,canManage:Ks||Gs,onEdit:s=>{ds(typeof s=="string"?s:"overview"),Te(!0)},currentChannel:z,onChangeChannel:ft,className:`${P?"mobile-open":""} ${i&&f?"mobile-hidden":""}`,onShowPortalInfo:()=>rs(!0)}),e.jsxs("main",{className:`discord-main-content ${i&&!f?"mobile-content-hidden":""} ${Rs?"voice-channel-active":""}`,children:[i&&!f&&e.jsx(na,{title:(t==null?void 0:t.name)||"Portal",showBack:!1}),(()=>{var d,x,S,u,R,M,N,G,j,U,V,J,pe,ie,Ze,Qe;const s=Y,r=(s==null?void 0:s.type)||"text",o=(s==null?void 0:s.name)||"...",c=r==="voice"||r==="conference";return e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{display:"flex",flex:1,overflow:"hidden"},children:c?e.jsx("div",{style:{flex:1,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"},children:e.jsx(n.Suspense,{fallback:e.jsx("div",{className:"skeleton-loader",children:e.jsx("p",{children:"Canlı bağlantı odası hazırlanıyor..."})}),children:r==="conference"?e.jsx(fa,{portalId:a,channelId:z,channelName:o,onBack:()=>v(!1)}):e.jsx(xa,{portalId:a,channelId:z,channelName:o,onBack:()=>v(!1)})})}):e.jsx("div",{className:"channel-messages-area",style:{flex:1,display:"flex",flexDirection:"column"},children:ge?e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"},children:[e.jsx("div",{className:"spinner"}),e.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.9rem"},children:"İçerik yükleniyor..."})]}):e.jsxs(e.Fragment,{children:[!c&&e.jsxs("header",{className:`channel-top-bar ${i?"":"desktop-only"}`,children:[e.jsxs("div",{className:"channel-title-wrapper",children:[i&&e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>v(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",children:r==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",children:o}),(()=>{const m=String((s==null?void 0:s._id)||z||""),T=Le[m]!==void 0?Le[m]:(s==null?void 0:s.postCount)??0;return e.jsxs("div",{className:"channel-post-count-badge",title:`${T} Gönderi`,children:[e.jsx(Ps,{size:13}),e.jsx("span",{children:T})]})})()]}),e.jsx("div",{className:"channel-header-actions",children:Me&&e.jsx("button",{className:`icon-btn ${Se?"active":""}`,onClick:()=>l(!Se),title:Se?"Üyeleri Gizle":"Üyeleri Göster",style:{background:"none",border:"none",color:Se?"var(--primary-color)":"var(--text-muted)"},children:e.jsx(Cs,{size:20})})})]}),Pe==="private"?e.jsx(Xs,{portal:t,onClose:()=>{window.history.length>2?_(-1):_("/search")},isMobile:i,onOpenSettings:()=>{ds("overview"),Te(!0)},onJoinStatusChange:m=>{m==="requested"?I(T=>T&&{...T,isRequested:!0}):m==="joined"&&(Re(!0),X(""),fetchPosts())}}):e.jsxs(e.Fragment,{children:[(t==null?void 0:t.alerts)&&t.alerts.length>0&&e.jsx(pa,{alerts:t.alerts}),e.jsx("div",{className:`portal-feed-container discord-feed ${ls?"tanitim-feed-mode":""}`,onScroll:ht,ref:bs,children:ls?e.jsx(ma,{}):e.jsxs(e.Fragment,{children:[q.length===0&&!ee&&e.jsxs("div",{className:"empty-portal",children:[e.jsx("div",{className:"empty-portal-icon",children:"👋"}),e.jsxs("h3",{children:[((x=(d=t==null?void 0:t.channels)==null?void 0:d.find(m=>m._id===z))==null?void 0:x.type)==="voice"?"🎙️":((u=(S=t==null?void 0:t.channels)==null?void 0:S.find(m=>m._id===z))==null?void 0:u.type)==="conference"?"🎤":((M=(R=t==null?void 0:t.channels)==null?void 0:R.find(m=>m._id===z))==null?void 0:M.type)==="image"?"🖼️":"#",((G=(N=t==null?void 0:t.channels)==null?void 0:N.find(m=>String(m._id)===String(z)))==null?void 0:G.name)||"..."," ","kanalına hoş geldin!"]}),e.jsx("p",{children:"Bu kanalda henüz mesaj yok. İlk mesajı sen at!"})]}),Array.isArray(q)&&q.map((m,T)=>{var $;m.isBot===!0||(($=m.author)==null||$.isBot);const O=It.enableAds;return e.jsxs(n.Fragment,{children:[e.jsx(At,{post:m,onDelete:jt,onPin:Nt,onArchive:kt,isAdmin:Gs},m._id),T<q.length-1&&e.jsx("div",{className:"post-separator"}),O]},m._id)}),e.jsx("div",{ref:yt,style:{height:"40px",margin:"10px 0",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"},children:ws&&e.jsx("div",{className:"spinner-small"})})]})}),(()=>{const T=2*Math.PI*20,O=T-pt/100*T;return e.jsxs("button",{className:`floating-scroll-top portal-scroll-top ${mt?"visible":""}`,onClick:xt,"aria-label":"Yukarı Çık",children:[e.jsxs("svg",{className:"progress-ring",width:"50",height:"50",viewBox:"0 0 50 50",children:[e.jsx("circle",{className:"progress-ring-track",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25"}),e.jsx("circle",{className:"progress-ring-fill",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25",style:{strokeDasharray:T,strokeDashoffset:O}})]}),e.jsx("div",{className:"scroll-icon",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"m18 15-6-6-6 6"})})})]})})(),ls?null:rt?e.jsxs("div",{className:"channel-input-area",children:[re&&Pt.createPortal(e.jsxs("div",{className:"plus-menu portal-plus-menu-portal",ref:lt,style:{position:"fixed",top:Ne.top,left:Ne.left,zIndex:99999},children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Ge.current.click(),Q(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("circle",{cx:"8.5",cy:"8.5",r:"1.5"}),e.jsx("polyline",{points:"21 15 16 10 5 21"})]})}),"Görsel"]}),!os&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Ts.current.click(),Q(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("polygon",{points:"23 7 16 12 23 17 23 7"}),e.jsx("rect",{x:"1",y:"5",width:"15",height:"14",rx:"2",ry:"2"})]})}),"Video"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{As.current.click(),Q(!1)},children:[e.jsx("div",{className:"plus-menu-icon",style:{fontWeight:800,fontSize:"10px"},children:"GIF"}),"GIF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Es.current.click(),Q(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"})]})}),"PDF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{as(!Is),Q(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"}),e.jsx("polygon",{points:"9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02",fill:"currentColor"})]})}),"YouTube"]})]})]}),document.body),e.jsx("input",{type:"file",ref:Ge,onChange:gt,style:{display:"none"},accept:"image/png, image/jpeg, image/jpg, image/webp",multiple:!0}),e.jsx("input",{type:"file",ref:Ts,onChange:ys,style:{display:"none"},accept:"video/mp4, video/webm, video/quicktime"}),e.jsx("input",{type:"file",ref:As,onChange:ys,style:{display:"none"},accept:"image/gif"}),e.jsx("input",{type:"file",ref:Es,onChange:ys,style:{display:"none"},accept:".pdf"}),Is&&e.jsx("div",{className:"edit-modal-overlay",style:{zIndex:9999},children:e.jsxs("div",{className:"edit-modal-modern",style:{maxWidth:"400px",height:"auto",maxHeight:"none"},children:[e.jsxs("div",{className:"edit-modal-header-modern",children:[e.jsx("div",{className:"header-left",children:e.jsx("h3",{className:"header-title-modern",children:"YouTube Videosu Ekle"})}),e.jsx("button",{onClick:()=>as(!1),className:"close-btn-modern",children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),e.jsxs("div",{className:"edit-modal-content-modern",style:{padding:"20px"},children:[e.jsxs("div",{className:"floating-label-group",children:[e.jsx("label",{className:"floating-label",children:"Video Bağlantısı"}),e.jsx("input",{type:"text",className:"floating-input",placeholder:"https://www.youtube.com/watch?v=...",value:qe,onChange:dt,autoFocus:!0,onKeyDown:m=>{m.key==="Enter"&&(m.preventDefault(),Ds())}})]}),e.jsxs("div",{style:{marginTop:"20px",display:"flex",justifyContent:"flex-end",gap:"10px"},children:[e.jsx("button",{onClick:()=>as(!1),className:"join-btn outline",style:{padding:"8px 16px"},children:"İptal"}),e.jsx("button",{onClick:Ds,className:"join-btn primary",style:{padding:"8px 20px"},children:"Ekle"})]})]})]})}),K&&e.jsxs("div",{className:"input-quoted-preview",children:[e.jsxs("div",{className:"input-quoted-preview-header",children:[(U=(j=K.author)==null?void 0:j.profile)!=null&&U.avatar?e.jsx("img",{src:ue(K.author.profile.avatar),alt:"",className:"quoted-preview-avatar",loading:"lazy",decoding:"async",width:"32",height:"32"}):e.jsx("div",{className:"quoted-preview-avatar-placeholder",children:(J=(V=K.author)==null?void 0:V.username)==null?void 0:J.charAt(0).toUpperCase()}),e.jsxs("div",{className:"quoted-preview-meta",children:[e.jsx("span",{className:"quoted-preview-author",children:((ie=(pe=K.author)==null?void 0:pe.profile)==null?void 0:ie.displayName)||((Ze=K.author)==null?void 0:Ze.username)}),e.jsxs("span",{className:"quoted-preview-username",children:["@",(Qe=K.author)==null?void 0:Qe.username]})]}),e.jsx("button",{className:"remove-quote-btn",onClick:()=>is(null),children:e.jsx(ss,{size:16})})]}),e.jsxs("div",{className:"input-quoted-preview-body",children:[e.jsx("p",{className:"input-quoted-preview-text",children:K.content}),K.media&&e.jsx("div",{className:"input-quoted-preview-media",children:K.mediaType==="video"?e.jsxs("div",{className:"media-placeholder",children:[e.jsx(sa,{size:20}),e.jsx("span",{children:"Video Alıntısı"})]}):e.jsx("img",{src:ue(K.media),alt:"",loading:"lazy",decoding:"async",width:"120",height:"80"})})]})]}),os&&xe.trim()&&!D&&e.jsxs("div",{className:"image-channel-warning",style:{backgroundColor:"rgba(239, 68, 68, 0.1)",border:"1px solid rgba(239, 68, 68, 0.25)",color:"#f87171",padding:"8px 12px",borderRadius:"8px",fontSize:"13px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{flexShrink:0},children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]}),e.jsx("span",{children:"Görsel kanallarında paylaşım yapabilmek için mutlaka bir görsel eklemelisiniz."})]}),A?e.jsxs("div",{className:"ghost-channel-notice",style:{backgroundColor:"#0c0c0c",borderTop:"1px solid #222",color:"#888",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",fontSize:"13px"},children:[e.jsxs("svg",{viewBox:"0 0 24 24",width:"18",height:"18",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{opacity:.7},children:[e.jsx("path",{d:"M12 2a5 5 0 0 0-5 5v14l3-2 2 2 2-2 3 2V7a5 5 0 0 0-5-5z"}),e.jsx("circle",{cx:"10",cy:"8",r:"1",fill:"currentColor"}),e.jsx("circle",{cx:"14",cy:"8",r:"1",fill:"currentColor"})]}),e.jsx("span",{children:"Hayalet Modu: Salt okunur izleme modundasınız. Kanalda mesaj ve gönderi paylaşılamaz."})]}):e.jsxs("div",{className:"message-input-wrapper",children:[e.jsx("button",{ref:Ye,className:`input-action-btn upload-btn ${re?"active":""}`,onClick:ot,style:{backgroundColor:"#383a40",borderRadius:"50%",width:"32px",height:"32px",marginRight:"12px",color:re?"var(--primary-color)":"#b9bbbe"},children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z"})})}),D&&e.jsxs("div",{className:"input-media-preview",style:{marginRight:"12px",display:"flex",alignItems:"center",backgroundColor:"var(--bg-secondary)",borderRadius:"8px",padding:"4px",gap:"8px",border:"1px solid var(--border-subtle)"},children:[D.type==="youtube"&&D.preview?e.jsx("img",{src:D.preview,alt:"Video Preview",style:{width:"40px",height:"30px",objectFit:"cover",borderRadius:"4px"},loading:"lazy",decoding:"async",width:"40",height:"30"}):e.jsx("span",{style:{fontSize:"20px",lineHeight:1,padding:"4px"},children:D.type.startsWith("video")?"🎥":D.type.includes("gif")?"👾":D.type==="application/pdf"||D.name&&D.name.toLowerCase().endsWith(".pdf")?"📄":"🖼️"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",maxWidth:"100px"},children:e.jsx("span",{style:{fontSize:"10px",color:"var(--text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:D.name||"Medya"})}),e.jsx("button",{onClick:()=>Ue(null),style:{background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer"},children:"×"})]}),e.jsx("input",{type:"text",placeholder:os?"Gönderi paylaşmak için bir görsel ekleyin...":`#${(Y==null?void 0:Y.name)||"..."} kanalına mesaj gönder`,value:xe,onChange:m=>{Ke(m.target.value)},onKeyDown:m=>{m.key==="Enter"&&!m.shiftKey&&(m.preventDefault(),$s())}}),e.jsx("div",{className:"input-right-actions",children:e.jsx("button",{className:"input-action-btn send-btn",onClick:$s,disabled:Ms||(os?!D&&ze.length===0:!xe.trim()&&!D&&ze.length===0),title:"Gönder",style:{color:xe.trim()||D||ze.length>0?"var(--primary-color)":"var(--text-tertiary)"},children:Ms?e.jsxs("div",{className:"compose-spinner-wrapper",style:{width:"20px",height:"20px"},children:[e.jsx("div",{className:"compose-spinner",style:{width:"20px",height:"20px",borderTopColor:"var(--primary-color)"}}),e.jsxs("span",{className:"compose-progress-text",style:{fontSize:"7px",color:"var(--text-primary)"},children:[at,"%"]})]}):e.jsx(ta,{size:20})})})]}),Ie&&Ie.length>0&&e.jsxs("div",{className:"portal-image-previews-container",children:[e.jsxs("div",{className:"portal-image-previews-header",children:[e.jsxs("span",{className:"portal-image-previews-count",children:["Seçilen Görseller (",Ie.length,"/10)"]}),Ie.length<10&&e.jsx("button",{type:"button",className:"portal-add-more-images-btn",onClick:()=>{var m;return(m=Ge.current)==null?void 0:m.click()},children:"+ Görsel Ekle"})]}),e.jsx("div",{className:"portal-image-previews-list",children:Ie.map((m,T)=>e.jsxs("div",{className:"portal-image-preview-item",children:[e.jsx("img",{src:m.url,alt:`Preview ${T+1}`,className:"portal-image-preview-thumb"}),e.jsx("button",{type:"button",className:"portal-image-remove-btn",onClick:()=>bt(T),title:"Görseli Kaldır",children:e.jsx(ss,{size:14})}),e.jsx("span",{className:"portal-image-index-badge",children:T+1})]},T))})]}),oe&&oe.length>0&&e.jsxs("div",{className:"portal-typing-indicator",style:{marginTop:"8px"},children:[e.jsx("div",{className:"typing-avatars-group",children:oe.map(m=>e.jsx("img",{src:ue(m.avatar),alt:m.displayName,className:"typing-avatar",title:m.displayName},m.userId))}),e.jsx("span",{className:"typing-text",children:oe.length===1?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," yazıyor..."]}):oe.length===2?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," ve ",e.jsx("strong",{children:oe[1].displayName})," yazıyor..."]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," ve ",oe.length-1," kişi daha yazıyor..."]})})]})]}):e.jsx("div",{className:"channel-input-area",style:{padding:"0 20px 24px 20px",backgroundColor:"transparent",borderTop:"none"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--glass-bg)",padding:"12px 20px",borderRadius:"8px",border:"1px solid var(--glass-border)",backdropFilter:"blur(20px) saturate(160%)",WebkitBackdropFilter:"blur(20px) saturate(160%)",boxShadow:"var(--glass-shadow)"},children:[e.jsxs("span",{style:{color:"var(--text-secondary)",fontWeight:500,fontSize:"14px"},children:["Bu kanalda mesaj göndermek için ",h?"portala katılmalısın.":"giriş yapmalısın."]}),h?e.jsx("button",{className:"privacy-join-btn",onClick:wt,disabled:t.isRequested,style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:t.isRequested?"İstek Gönderildi":"Portala Katıl"}):e.jsx("button",{className:"privacy-join-btn",onClick:()=>_("/login"),style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:"Giriş Yap"})]})})]})]})})}),Se&&e.jsx(da,{members:[...t.owner?[{...t.owner,role:"owner"}]:[],...(t.admins||[]).map(m=>({...m,role:"admin"})),...t.members||[]].filter((m,T,O)=>{const $=String(m._id||m.id||m);return m&&O.findIndex(ne=>String(ne._id||ne.id||ne)===$)===T}),onClose:()=>l(!1)})]})})()]})]}),js&&ks!=="notifications"&&e.jsx(n.Suspense,{fallback:null,children:e.jsx(ua,{portal:t,currentUser:h,initialTab:ks,onClose:()=>Te(!1),onUpdate:s=>{I(s)}})}),js&&ks==="notifications"&&e.jsx("div",{className:"portal-notifications-modal",onClick:()=>Te(!1),children:e.jsxs("div",{className:"notifications-modal-content",onClick:s=>s.stopPropagation(),children:[e.jsx("button",{className:"close-notifications-btn",onClick:()=>Te(!1),children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsx(n.Suspense,{fallback:null,children:e.jsx(ha,{portalId:t._id,portalChannels:t.channels||[],onUpdate:Bs})})]})}),it&&t&&e.jsx(Xs,{portal:t,onClose:()=>rs(!1),isMobile:i,onOpenSettings:()=>{rs(!1),ds("overview"),Te(!0)},onLeave:()=>{rs(!1),Re(!1),_("/")}})]})};export{qa as default};
