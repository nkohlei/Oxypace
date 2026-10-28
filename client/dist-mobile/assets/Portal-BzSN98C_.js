const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PortalSettingsModal-BWxPtRUh.js","assets/vendor-ByEW1neG.js","assets/index-B03FaLbz.js","assets/socket-D8twC75N.js","assets/livekit-BEAUSX0o.js","assets/lucide-B4kKc3cI.js","assets/index-sMVjdI_T.css","assets/ImageCropper-o06TsNQG.js","assets/ImageCropper-Dk7oVLRB.css","assets/PortalBadges-D_RqQGT6.js","assets/UserBadges-BQTuxd13.js","assets/UserBadges-DFKBzEd_.css","assets/PortalBadges-bryM1aQu.css","assets/PortalSettingsModal-CHDypHKx.css","assets/PortalNotifications-huk16S1g.js","assets/PortalNotifications-zEgqx9Vo.css","assets/VoiceChannel-CPwr3nJT.js","assets/VoiceChannel-BUQEk_Ib.js","assets/VoiceChannel-8DFSTqL9.css","assets/ConferenceChannel-DRYaRKQM.js"])))=>i.map(i=>d[i]);
import{r as n,a1 as e,a0 as de,a2 as As,aq as Xs,as as It,a4 as At,ar as Tt,a5 as Et,a6 as Mt,aa as fs}from"./vendor-ByEW1neG.js";import{d as he,l as rt,u as bs,m as lt,i as gs,c as Ts,b as et,p as st,h as Rt,n as Lt,a as tt}from"./index-B03FaLbz.js";import{u as $t}from"./useVideoTranscoder-C41_cfds.js";import{P as Dt}from"./PostCard-Dj52A4Ky.js";import{c as Bt,X as ss,ae as Ut,Y as qt,a2 as Ft,M as Es,a8 as Kt,a1 as Ot,a5 as Gt,e as Wt,a6 as Vt,aG as Yt,aH as Ht,aJ as Jt,aK as Zt,ad as Qt,K as at,aB as Xt,a9 as ea,F as sa,r as ta,t as aa,G as ia,s as Ps,j as na,aL as ot,au as ra,aM as la,aN as oa}from"./lucide-B4kKc3cI.js";import{U as it}from"./UserBadges-BQTuxd13.js";import{P as Is}from"./PortalBadges-D_RqQGT6.js";import{U as ca}from"./UserBar-CFo1JkVV.js";import{P as nt}from"./PortalInfoModal-BdNX_Cn9.js";import{N as es}from"./Navbar-CIIEKgmu.js";import{S as da}from"./SubHeader-uwEmQnOm.js";import{S as ma}from"./SEO-BQswtfUF.js";import"./socket-D8twC75N.js";import"./livekit-BEAUSX0o.js";import"./VideoDownloadModal-u_3IymK7.js";import"./LinkPreview-1D566ppQ.js";import"./UserAvatar-BC13RoIj.js";/* empty css                      */import"./Login-_gIKw0PT.js";/* empty css             *//* empty css                  */const pa=({portalId:a,onClose:f})=>{const[M,h]=n.useState(""),[H,g]=n.useState([]),[Q,W]=n.useState(!1),[y,j]=n.useState(new Set);n.useEffect(()=>{const P=setTimeout(async()=>{if(M.trim().length===0){g([]);return}W(!0);try{const $=await de.get(`/api/users/search?q=${M}`);g($.data)}catch{}finally{W(!1)}},500);return()=>clearTimeout(P)},[M]);const K=async _=>{var P,$;try{await Promise.all([de.post(`/api/portals/${a}/invite`,{userId:_}),de.post("/api/messages",{recipientId:_,portalId:a,content:"Seni bir portala davet ettim!"})]),j(r=>new Set(r).add(_))}catch(r){alert((($=(P=r.response)==null?void 0:P.data)==null?void 0:$.message)||"İşlem sırasında bir hata oluştu.")}},z=()=>{const _=`${window.location.origin}/portal/${a}`;navigator.clipboard.writeText(_),alert("Davet bağlantısı kopyalandı!")};return e.jsx("div",{className:"invite-modal-overlay",onClick:f,children:e.jsxs("div",{className:"invite-modal",onClick:_=>_.stopPropagation(),children:[e.jsxs("div",{className:"invite-header",children:[e.jsx("h2",{children:"Kullanıcı Davet Et"}),e.jsxs("div",{className:"header-actions",children:[e.jsxs("button",{className:"copy-link-btn",title:"Bağlantıyı Kopyala",onClick:z,children:[e.jsx(Bt,{size:20,strokeWidth:2}),e.jsx("span",{children:"Bağlantı"})]}),e.jsx("button",{className:"close-btn",onClick:f,children:e.jsx(ss,{size:24,strokeWidth:2})})]})]}),e.jsx("div",{className:"invite-search-container",children:e.jsx("input",{type:"text",className:"invite-search-input",placeholder:"Kullanıcı adı ara...",value:M,onChange:_=>h(_.target.value),autoFocus:!0})}),e.jsxs("div",{className:"invite-results custom-scrollbar",children:[Q&&e.jsx("div",{className:"loading-text",children:"Aranıyor..."}),!Q&&H.length===0&&M&&e.jsx("div",{className:"no-play-text",children:"Sonuç bulunamadı."}),H.map(_=>{var r;const P=_._id||_,$=y.has(P);return e.jsxs("div",{className:"invite-user-row",children:[e.jsxs("div",{className:"user-info",children:[e.jsx("img",{src:he((r=_.profile)==null?void 0:r.avatar),alt:"",className:"user-avatar"}),e.jsx("span",{className:"user-name",children:_.username})]}),e.jsx("button",{className:`invite-btn ${$?"invited":""}`,onClick:()=>!$&&K(P),disabled:$,children:$?"Gönderildi":"Davet Et"})]},P)})]})]})})},ua=({startedAt:a,style:f={},className:M=""})=>{const{roomStartTime:h}=rt()||{},[H,g]=n.useState("00:00");n.useEffect(()=>{const W=h&&a===h?h:a;if(!W){g("00:00");return}const y=()=>{const K=Math.floor((Date.now()-W)/1e3);if(K<0){g("00:00");return}const z=Math.floor(K/3600),_=Math.floor(K%3600/60),P=K%60;g(z>0?`${z.toString().padStart(2,"0")}:${_.toString().padStart(2,"0")}:${P.toString().padStart(2,"0")}`:`${_.toString().padStart(2,"0")}:${P.toString().padStart(2,"0")}`)};y();const j=setInterval(y,1e3);return()=>clearInterval(j)},[a,h]);const Q={display:"flex",alignItems:"center",fontSize:"15px",fontWeight:"800",color:"#39FF14",background:"transparent",border:"none",padding:"0 4px"};return e.jsx("div",{style:{...Q,...f},className:M,children:H})},ha=({portal:a,isMember:f,onEdit:M,currentChannel:h,onChangeChannel:H,className:g,canManage:Q,onShowPortalInfo:W})=>{var De,_e;const{user:y}=bs(),[j,K]=n.useState(!1);As();const z=lt(),{isMobileView:_}=z||{},P=(z==null?void 0:z.isDesktopSidebarCollapsed)||!1,$=(z==null?void 0:z.setIsDesktopSidebarCollapsed)||(()=>{}),r=gs(c=>c.unreadPostsByChannel),b=gs(c=>c.clearUnreadForChannel),{roomStartTime:k,activeRoom:F,participants:R}=rt(),{socket:s,onlineUsers:A}=Ts(),[U,N]=n.useState({}),[ee,re]=n.useState(null),be=n.useRef(null),Ie=(c,w)=>{w.stopPropagation(),be.current&&clearTimeout(be.current),re(c),be.current=setTimeout(()=>{re(null)},1800)};n.useEffect(()=>()=>{be.current&&clearTimeout(be.current)},[]);const me=c=>{if(!c)return null;if(typeof c=="string")return c;const w=c._id||c.id;return w?String(w):null},J=new Set,se=me(a==null?void 0:a.owner);se&&J.add(se),((a==null?void 0:a.admins)||[]).forEach(c=>{const w=me(c);w&&J.add(w)}),((a==null?void 0:a.members)||[]).forEach(c=>{const w=me(c);w&&J.add(w)});const Fe=new Set((A||[]).map(c=>String(c))),pe=y!=null&&y._id?String(y._id):null,Ee=((_e=(De=y==null?void 0:y.settings)==null?void 0:De.privacy)==null?void 0:_e.showOnlineStatus)!==!1;pe&&J.has(pe)&&Ee?Fe.add(pe):pe&&!Ee&&Fe.delete(pe);let Me=0;J.forEach(c=>{Fe.has(c)&&Me++});const Re=J.size||(a==null?void 0:a.membersCount)||((a==null?void 0:a.members)||[]).length||0;n.useEffect(()=>{h&&(a!=null&&a._id)&&b(h,a._id)},[h,a==null?void 0:a._id,b]),n.useEffect(()=>{var Ne;if(!(a!=null&&a._id)||!((Ne=a==null?void 0:a.channels)!=null&&Ne.length))return;const c=a.channels.filter(le=>le.type==="voice"||le.type==="conference");if(c.length===0)return;let w=!0;const ke=async()=>{try{const le=await Promise.all(c.map(async X=>{var Ce,Ue;const Se=X._id||X.id;try{const ts=await de.get(`/api/voice/rooms/${a._id}/${Se}/participants?t=${Date.now()}`);return{channelId:String(Se),count:((Ue=(Ce=ts.data)==null?void 0:Ce.participants)==null?void 0:Ue.length)||0}}catch{return{channelId:String(Se),count:0}}}));w&&N(X=>{const Se={...X};return le.forEach(Ce=>{Se[Ce.channelId]=Ce.count}),Se})}catch{}};ke();const Be=setInterval(ke,1e4);return()=>{w=!1,clearInterval(Be)}},[a==null?void 0:a._id,a==null?void 0:a.channels]),n.useEffect(()=>{if(!s)return;const c=w=>{!w||!w.channelId||w.portalId&&String(w.portalId)!==String(a==null?void 0:a._id)||N(ke=>({...ke,[String(w.channelId)]:Number(w.count)||0}))};return s.on("voice:channel-count-update",c),()=>{s.off("voice:channel-count-update",c)}},[s,a==null?void 0:a._id]);const C=a!=null&&a.channels?[...a.channels].sort((c,w)=>(c.order||0)-(w.order||0)).map(c=>({id:c._id,name:c.name,type:c.type||"text",postCount:c.postCount})):[],te=C.find(c=>String(c.id)===String(h)),Le=(te==null?void 0:te.type)==="voice"||(te==null?void 0:te.type)==="conference";n.useEffect(()=>{!Le&&P&&$(!1)},[Le,P,$]);const xe=c=>String(h)===String(c),$e=(a==null?void 0:a.coverImage)||(a==null?void 0:a.banner),ye=$e?he($e):null,Ke=ye?`url("${ye}")`:a&&!$e?'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")':"none",[oe,ve]=n.useState(!1),je=n.useRef(null);return n.useEffect(()=>{if(!ye){ve(!0),je.current=null;return}if(je.current===ye){ve(!0);return}je.current=ye;const c=new window.Image;c.src=ye,c.complete?ve(!0):(ve(!1),c.onload=()=>ve(!0),c.onerror=()=>ve(!0))},[ye]),a?e.jsxs("div",{className:`channel-sidebar ${P?"collapsed":""} ${g||""}`,style:{height:"calc(100% - 24px)",backgroundColor:"transparent",display:"flex",flexDirection:"column",flexShrink:0,overflow:"visible",position:"relative",borderRight:"none"},children:[!_&&Le&&e.jsx("button",{className:"sidebar-toggle-btn",onClick:c=>{c.stopPropagation(),$(!P)},title:P?"Menüyü Göster":"Menüyü Gizle",children:P?e.jsx(Ut,{size:16}):e.jsx(qt,{size:16})}),e.jsxs("div",{className:"sidebar-content-wrapper",style:{display:"flex",flexDirection:"column",flex:1,width:"100%",height:"100%",overflow:"hidden",transition:"opacity 0.2s ease, visibility 0.2s ease",opacity:P?0:1,visibility:P?"hidden":"visible",gap:"8px",padding:"0px",boxSizing:"border-box"},children:[e.jsxs("div",{className:"cs-panel cs-panel--banner",children:[e.jsxs("div",{className:"channel-banner-container",onClick:()=>W&&W(),children:[e.jsx("div",{className:"channel-banner-image",style:{backgroundImage:Ke,opacity:oe?1:0}}),e.jsx("div",{className:"channel-banner-overlay"})]}),e.jsxs("div",{className:"portal-quick-info",children:[e.jsxs("div",{className:"portal-info-main",onClick:()=>W&&W(),children:[e.jsxs("h2",{className:"portal-title-text",children:[e.jsx("span",{className:"portal-title-name",children:a.name}),e.jsx(Is,{portal:a,size:18})]}),e.jsxs("div",{className:"portal-stats-row",children:[e.jsxs("div",{className:`stat-item ${ee==="members"?"stat-tooltip-active":""}`,onClick:c=>Ie("members",c),title:"Üye",children:[e.jsx(Ft,{size:12}),e.jsx("span",{children:Re}),e.jsx("div",{className:"stat-floating-tag",children:"Üye"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${ee==="posts"?"stat-tooltip-active":""}`,onClick:c=>Ie("posts",c),title:"Gönderi",children:[e.jsx(Es,{size:12}),e.jsx("span",{children:a.postCount||0}),e.jsx("div",{className:"stat-floating-tag",children:"Gönderi"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${ee==="online"?"stat-tooltip-active":""}`,onClick:c=>Ie("online",c),title:"Çevrimiçi",children:[e.jsx("div",{className:"online-indicator-dot"}),e.jsx("span",{children:Me}),e.jsx("div",{className:"stat-floating-tag",children:"Çevrimiçi"})]})]})]}),e.jsxs("div",{className:"portal-header-actions",children:[(f||Q)&&e.jsx("button",{className:"portal-action-btn-circle",onClick:c=>{c.stopPropagation(),M&&M("notifications")},title:"Bildirim Ayarları",children:e.jsx(Kt,{size:16})}),f&&e.jsx("button",{className:"portal-action-btn-circle",onClick:c=>{c.stopPropagation(),K(!0)},title:"Davet Et",children:e.jsx(Ot,{size:18})})]})]})]}),e.jsxs("div",{className:"cs-panel cs-panel--channels custom-scrollbar",children:[e.jsxs("div",{className:"cs-channels-header",children:[e.jsx("span",{children:"Kanallar"}),Q&&e.jsx("div",{onClick:c=>{c.stopPropagation(),M&&M("channels")},className:"cs-add-channel-btn",title:"Kanal Oluştur",children:"+"})]}),e.jsx("div",{className:"cs-channel-list",children:C.map(c=>{var le;const w=xe(c.id),ke=c.type==="announcement"||c.name.includes("announcements"),Be=c.type==="voice"||c.type==="conference";let Ne=U[String(c.id)]??0;return F&&String(F.channelId)===String(c.id)&&Array.isArray(R)&&(Ne=R.length),e.jsxs("div",{className:`channel-item ${w?"active":""}`,onClick:()=>H(c.id),style:{padding:"6px 8px",margin:"2px 0",borderRadius:"4px",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",color:w?"white":"#949ba4",backgroundColor:w?"#3f4147":"transparent",transition:"background-color 0.15s ease, color 0.15s ease"},children:[e.jsx("div",{style:{color:w?"white":"var(--text-secondary)",display:"flex",alignItems:"center",minWidth:"20px",justifyContent:"center"},children:c.type==="conference"?e.jsx(Gt,{size:20,strokeWidth:2}):c.type==="voice"?e.jsx(Wt,{size:20,strokeWidth:2}):ke?e.jsx(Vt,{size:20,strokeWidth:2.5}):c.type==="image"?e.jsx(Yt,{size:20,strokeWidth:2.5,style:{color:"#f59e0b"}}):e.jsx(Ht,{size:20,strokeWidth:2.5})}),e.jsx("span",{style:{fontWeight:w?600:500,fontSize:"16px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:w?"white":"var(--text-primary)",maxWidth:"fit-content"},children:c.name}),Be&&e.jsx("span",{className:`vc-channel-active-badge ${Ne>0?"online":"idle"}`,children:Ne>0?`${Ne} aktif`:"aktif yok"}),!w&&((le=r[c.id])==null?void 0:le.length)>0&&e.jsx("div",{style:{backgroundColor:"#f23f43",color:"white",fontSize:"11px",fontWeight:"bold",padding:"0 6px",borderRadius:"8px",minWidth:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.3)",marginLeft:"-4px",flexShrink:0},children:r[c.id].length>9?"9+":r[c.id].length}),e.jsx("div",{style:{flex:1}}),w&&Be&&F&&String(F.channelId)===String(c.id)&&k&&e.jsx("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:e.jsx(ua,{startedAt:k,className:"vc-sidebar-timer"})})]},c.id)})})]}),e.jsxs("div",{className:"cs-panel cs-panel--userbar",children:[e.jsx(ca,{currentChannelId:h}),e.jsx("div",{className:"cs-footer-copyright",children:"© 2026 Oxypace. Tüm hakları saklıdır."})]})]}),e.jsx("style",{children:`
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
            `}),j&&e.jsx(pa,{portalId:a._id,onClose:()=>K(!1)})]}):null},xa=({members:a=[],onClose:f})=>{var P,$;const{onlineUsers:M}=Ts(),{user:h}=bs(),[,H]=n.useState(0);n.useEffect(()=>{const r=setInterval(()=>{H(b=>b+1)},6e4);return()=>clearInterval(r)},[]);const g=r=>{if(!r)return"";const b=new Date,k=new Date(r),F=Math.max(0,b-k),R=Math.floor(F/6e4);if(R<1)return"şimdi";if(R<60)return`${R}dk`;const s=Math.floor(R/60);if(s<24)return`${s}sa`;const A=Math.floor(s/24);if(A<30)return`${A}g`;const U=Math.floor(A/30);return U<12?`${U}ay`:`${Math.floor(U/12)}y`},Q=r=>{if(!r)return null;if(typeof r=="string")return r;const b=r._id||r.id;return b?String(b):null},W=new Set((M||[]).map(r=>String(r))),y=h!=null&&h._id?String(h._id):null,j=(($=(P=h==null?void 0:h.settings)==null?void 0:P.privacy)==null?void 0:$.showOnlineStatus)!==!1;y&&j?W.add(y):y&&!j&&W.delete(y);const K=r=>(r==null?void 0:r.role)==="owner"?3:(r==null?void 0:r.role)==="admin"||r!=null&&r.isAdmin?2:1,z=a.filter(r=>{if(!r)return!1;const b=Q(r);return b&&W.has(b)}).sort((r,b)=>{var s,A;const k=K(b)-K(r);if(k!==0)return k;const F=((s=r.profile)==null?void 0:s.displayName)||r.username||"",R=((A=b.profile)==null?void 0:A.displayName)||b.username||"";return F.localeCompare(R)}),_=a.filter(r=>{if(!r)return!1;const b=Q(r);return b&&!W.has(b)}).sort((r,b)=>{var s,A;const k=K(b)-K(r);if(k!==0)return k;const F=((s=r.profile)==null?void 0:s.displayName)||r.username||"",R=((A=b.profile)==null?void 0:A.displayName)||b.username||"";return F.localeCompare(R)});return e.jsxs("div",{className:"members-sidebar custom-scrollbar",children:[e.jsxs("div",{className:"members-header-top",children:[e.jsx("h3",{children:"ÜYELER"}),f&&e.jsx("button",{onClick:f,className:"close-members-btn","aria-label":"Kapat",children:e.jsx(ss,{size:20,strokeWidth:2})})]}),e.jsxs("div",{className:"members-category",children:["Çevrim içi — ",z.length]}),z.map((r,b)=>{var U,N,ee,re;if(!r||typeof r=="string")return null;const k=r.username||"Unknown",F=((U=r.profile)==null?void 0:U.avatar)||r.avatar,R=((N=r.profile)==null?void 0:N.displayName)||k,s=r.role==="owner",A=r.role==="admin"||r.isAdmin;return e.jsxs(Xs,{to:`/profile/${k}`,className:"member-item member-link",children:[e.jsxs("div",{className:"member-avatar-wrapper",children:[F?e.jsx("img",{src:he(F,"thumbnail"),alt:"",className:"member-avatar",loading:"eager",decoding:"async"}):e.jsx("div",{className:"member-avatar-placeholder",children:((ee=R[0])==null?void 0:ee.toUpperCase())||((re=k[0])==null?void 0:re.toUpperCase())||"?"}),e.jsx("div",{className:"status-indicator online"})]}),e.jsxs("div",{className:"member-info",style:{display:"flex",alignItems:"center",gap:"6px"},children:[e.jsxs("span",{className:"member-name active-role",style:{color:s?"#f1c40f":A?"#3498db":"#2ecc71"},children:[R,s&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!s&&A&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"})]}),e.jsx(it,{user:r,size:13})]})]},r._id||r.id||b)}),e.jsxs("div",{className:"members-category",children:["Çevrim dışı — ",_.length]}),_.map((r,b)=>{var U,N,ee,re;if(!r||typeof r=="string")return null;const k=r.username||"Unknown",F=((U=r.profile)==null?void 0:U.avatar)||r.avatar,R=((N=r.profile)==null?void 0:N.displayName)||k,s=r.role==="owner",A=r.role==="admin"||r.isAdmin;return e.jsxs(Xs,{to:`/profile/${k}`,className:"member-item offline member-link",children:[e.jsx("div",{className:"member-avatar-wrapper",children:F?e.jsx("img",{src:he(F,"thumbnail"),alt:"",className:"member-avatar",loading:"eager",decoding:"async"}):e.jsx("div",{className:"member-avatar-placeholder",style:{backgroundColor:"var(--bg-secondary)"},children:((ee=R[0])==null?void 0:ee.toUpperCase())||((re=k[0])==null?void 0:re.toUpperCase())||"?"})}),e.jsx("div",{className:"member-info",style:{flex:1},children:e.jsxs("div",{className:"member-name-row",style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("span",{className:"member-name",style:{display:"flex",alignItems:"center",gap:"4px"},children:[R,s&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!s&&A&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"}),e.jsx(it,{user:r,size:13})]}),r.lastActive&&e.jsx("span",{className:"last-active-time",style:{fontSize:"11px",color:"var(--text-muted)"},children:g(r.lastActive)})]})})]},r._id||r.id||`offline-${b}`)}),e.jsx("style",{children:`
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
            `})]})},ga=()=>{var P,$;const{user:a,updateUser:f}=bs(),M=As(),[h,H]=n.useState(null),[g,Q]=n.useState([]),[W,y]=n.useState(!0),[j,K]=n.useState(null);n.useEffect(()=>{let r=!0;return(async()=>{try{const k=await de.get("/api/portals/showcase");r&&k.data&&(H(k.data.globalPortal||null),Q(Array.isArray(k.data.topPortals)?k.data.topPortals:[]))}catch{}finally{r&&y(!1)}})(),()=>{r=!1}},[]);const z=async(r,b)=>{var k,F,R;if(r.stopPropagation(),!a){M("/login");return}if(b.isMember){M(`/portal/${b._id}`);return}if(!(b.isRequested||j===b._id)){K(b._id);try{const A=((k=(await de.post(`/api/portals/${b._id}/join`)).data)==null?void 0:k.status)==="requested",U=N=>!N||N._id!==b._id?N:{...N,isMember:!A,isRequested:A,memberCount:A?N.memberCount:(N.memberCount||0)+1};if((h==null?void 0:h._id)===b._id&&H(U(h)),Q(N=>N.map(U)),!A&&a&&f){const N=a.joinedPortals||[];N.some(ee=>(ee._id||ee).toString()===b._id.toString())||f({joinedPortals:[...N,b],portals:[...a.portals||[],b]})}}catch(s){alert(((R=(F=s.response)==null?void 0:F.data)==null?void 0:R.message)||"İşlem gerçekleştirilemedi.")}finally{K(null)}}},_=r=>r!=null&&r.banner?`url(${he(r.banner)}) center/cover no-repeat`:"#141414";return e.jsxs("div",{className:"tanitim-showcase-wrapper",children:[e.jsxs("section",{className:"tanitim-guide-card",children:[e.jsxs("div",{className:"tanitim-guide-header",children:[e.jsxs("div",{className:"tanitim-guide-tag",children:[e.jsx(Jt,{size:13}),e.jsx("span",{children:"SİSTEM DİREKTİFİ // RESMİ PLATFORM REHBERİ"})]}),e.jsx("h1",{className:"tanitim-guide-title",children:"Oxypace İletişim Protokolü & Kullanım Mimarisi"}),e.jsx("p",{className:"tanitim-guide-lead",children:"Özgür, sansürsüz, yüksek performanslı ve gizlilik odaklı yeni nesil topluluk ekosistemi. Arayüz haritasını ve platformun tüm gelişmiş yeteneklerini aşağıdaki yönergelerden inceleyin."})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// NAVİGASYON VE MENÜ YERLEŞİMİ"}),e.jsx("h2",{className:"sub-section-title",children:"Sayfa Yapısı & Arayüz Konumlandırması"})]}),e.jsxs("div",{className:"tanitim-nav-map-grid",children:[e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(Zt,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ SOL NAVİGASYON BARI ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Ana Gezinme Çubuğu"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Doğrudan Mesajlar (DM):"})," Birebir şifreli özel yazışmalar ve anlık bildirim kutusu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portallar Listesi:"})," Üye olduğunuz veya yönettiğiniz tüm portalların dikey simgeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Keşfet Pusulası:"})," Yeni toplulukları, popüler portalları ve kişileri arama alanı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Oluştur (+):"})," Saniyeler içinde kendi özgür topluluğunuzu kurma aracı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kimlik & Hızlı Ayar:"})," En altta mikrofon, kulaklık ve profil hızlı kontrolleri."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(Qt,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ PORTAL İÇİ MENÜ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Kanal Hiyerarşisi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Kimliği:"})," Özel afiş, doğrulanmış rozet ve çevrimiçi üye göstergeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Metin Kanalları (#):"})," Tematik konulara göre ayrılmış gönderi ve tartışma akışları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Ses Kanalları (🎙️):"})," Tek dokunuşla girilebilen, gecikmesiz canlı ses odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Sahne Kanalları (🎤):"})," Seminer, podcast ve etkinlikler için konuşmacı odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Yönetimi:"})," Yöneticiler için yeni kanallar açma ve gizlilik kilidi."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(at,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ ÜST DENETİM & AKIŞ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"İçerik & Üye Denetimi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Üst Başlığı:"})," Aktif kanal adı, açıklaması ve hızlı üye paneli butonu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Üye Listesi Paneli:"})," Sağ tarafta çevrimiçi yöneticiler ve aktif üyeler."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Görsel Akış Alanı:"})," 4K videolar, çoklu galeriler ve doküman önizlemeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Bildirim Zil İkonu:"})," Kanal ve portal bazlı bildirim filtreleme ayarları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Ayarları:"})," Portal sahibi ve yöneticileri için tam yönetim konsolu."]})]})]})]})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// GELİŞMİŞ SİSTEM DİREKLERİ"}),e.jsx("h2",{className:"sub-section-title",children:"Platform Mekanizmaları & Özellikler"})]}),e.jsxs("div",{className:"tanitim-pillars-grid",children:[e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"01"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Es,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Gelişmiş Mesaj Mekanizması"}),e.jsx("p",{className:"pillar-text",children:"Markdown formatlama, tek tıkla alıntılı yanıtlama (quote reply), kullanıcıyı doğrudan haberdar eden @etiketleme sistemi ve akıllı bağlantı (link preview) ayrıştırma desteği."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Alıntılı Yanıt"}),e.jsx("span",{className:"pillar-tag",children:"@Bahsetmeler"}),e.jsx("span",{className:"pillar-tag",children:"Mesaj Sabitleme"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"02"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Xt,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Canlı Ses Odaları & Sahne Modu"}),e.jsx("p",{className:"pillar-text",children:"Ultra düşük gecikmeli WebRTC ses mimarisi. Herkesin serbestçe katılabildiği sohbet odaları ile seminer ve konferanslar için konuşmacı-dinleyici ayrımı ve el kaldırma desteği sunan Sahne kanalları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Gecikme"}),e.jsx("span",{className:"pillar-tag",children:"Sahne Hiyerarşisi"}),e.jsx("span",{className:"pillar-tag",children:"Arka Planda Ses"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"03"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(ea,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Mobil Ekosistem & PIP Video"}),e.jsx("p",{className:"pillar-text",children:"Yerel Android APK ve tam uyumlu PWA deneyimi. Canlı FCM Push bildirimleri, mobil veri tasarrufu modu ve gezinirken köşede kesintisiz oynayan Kayan Resim İçinde Resim (PIP) video motoru."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Android APK / PWA"}),e.jsx("span",{className:"pillar-tag",children:"Canlı PIP Oynatıcı"}),e.jsx("span",{className:"pillar-tag",children:"FCM Push Bildirim"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"04"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(sa,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Ultra-HD Medya & Transcoding"}),e.jsx("p",{className:"pillar-text",children:"İstemci içi WASM motoru ile 360p'den 4K'ya kadar otomatik optimize edilen video akışı. Tek gönderide 10 adede kadar yüksek kaliteli fotoğraf galerisi ve tek tıkla önizlenebilir PDF dokümanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"4K Video Transcoding"}),e.jsx("span",{className:"pillar-tag",children:"10'lu Görsel Galerisi"}),e.jsx("span",{className:"pillar-tag",children:"PDF Doküman Desteği"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"05"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(at,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Özelleştirilebilir Sistemler & Temalar"}),e.jsx("p",{className:"pillar-text",children:"Saf OLED siyahı ve yüksek kontrastlı Aydınlık tema desteği. Kişisel profil afişi, biyografi ve avatar özelleştirmeleri. Portallar için özel roller, izin matrisleri ve gizlilik kalkanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"OLED Siyah & Açık Tema"}),e.jsx("span",{className:"pillar-tag",children:"Rol & Yetki Matrisi"}),e.jsx("span",{className:"pillar-tag",children:"Özel Profil Afişi"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"06"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(ta,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Kripto-Güvenlik & Sıfır Takip"}),e.jsx("p",{className:"pillar-text",children:"Sıfır veri madenciliği ve ticari profil koruması. IP ve aktif cihaz oturum denetimi, güvenlik anahtarları ile hesap kurtarma ve doğrulanmış resmi topluluk rozetleri."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Veri İzleme"}),e.jsx("span",{className:"pillar-tag",children:"Cihaz & Oturum Denetimi"}),e.jsx("span",{className:"pillar-tag",children:"Onay Rozetleri"})]})]})]})]})]}),h&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ MERKEZ TOPLULUK // 01 ]"}),e.jsx("span",{className:"section-badge",children:"EN POPÜLER PORTAL"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Oxypace Global"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"Platformun en geniş üye kitlesine sahip resmi ana iletişim merkezi."})]}),e.jsxs("div",{className:"oxypace-global-hero-card",onClick:()=>M(`/portal/${h._id}`),children:[e.jsxs("div",{className:"hero-card-banner",style:{background:_(h)},children:[e.jsx("div",{className:"hero-banner-overlay"}),e.jsx("div",{className:"hero-banner-badge",children:e.jsx("span",{children:"ANA TOPLULUK"})})]}),e.jsxs("div",{className:"hero-card-body",children:[e.jsxs("div",{className:"hero-header-row",children:[e.jsx("div",{className:"hero-avatar-box",children:h.avatar?e.jsx("img",{src:he(h.avatar),alt:h.name,className:"hero-avatar-img"}):e.jsx("div",{className:"hero-avatar-fallback",children:(($=(P=h.name)==null?void 0:P.substring(0,2))==null?void 0:$.toUpperCase())||"OG"})}),e.jsxs("div",{className:"hero-identity-col",children:[e.jsxs("div",{className:"hero-name-row",children:[e.jsx("h3",{className:"hero-portal-name",children:h.name}),e.jsx(Is,{portal:h,size:18}),e.jsx("span",{className:"hero-privacy-tag",children:h.privacy==="private"?e.jsxs(e.Fragment,{children:[e.jsx(aa,{size:11})," GİZLİ"]}):e.jsxs(e.Fragment,{children:[e.jsx(ia,{size:11})," HERKESE AÇIK"]})})]}),e.jsx("div",{className:"hero-meta-row",children:e.jsxs("div",{className:"hero-member-stat",children:[e.jsx(Ps,{size:14}),e.jsxs("span",{children:[(h.memberCount||0).toLocaleString("tr-TR")," Üye"]})]})})]}),e.jsx("div",{className:"hero-action-col",children:e.jsx("button",{type:"button",className:`tanitim-sharp-btn hero-btn ${h.isMember?"btn-joined":h.isRequested?"btn-requested":"btn-action"}`,onClick:r=>z(r,h),disabled:j===h._id||h.isRequested,children:j===h._id?"İŞLENİYOR...":h.isMember?e.jsxs(e.Fragment,{children:[e.jsx(na,{size:14}),"ÜYESİNİZ"]}):h.isRequested?e.jsxs(e.Fragment,{children:[e.jsx(ot,{size:14}),"İSTEK GÖNDERİLDİ"]}):h.privacy==="private"?"ÜYELİK İSTEĞİ GÖNDER":"PORTALA KATIL"})})]}),e.jsx("p",{className:"hero-description",children:h.description||"Oxypace platformunun ana buluşma noktası. Güncel duyurular, teknik tartışmalar ve küresel topluluk etkileşimi."})]})]})]}),g.length>0&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ AKTİF TOPLULUKLAR // 02 ]"}),e.jsx("span",{className:"section-badge",children:"ÖNE ÇIKAN PORTALLAR"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Popüler Topluluklar"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"En çok paylaşıma ve aktif etkileşime sahip seçkin portallar."})]}),e.jsx("div",{className:"tanitim-portals-row",children:g.map(r=>{var b,k;return e.jsxs("div",{className:"tanitim-classic-card",onClick:()=>M(`/portal/${r._id}`),children:[e.jsx("div",{className:"classic-card-banner",style:{background:_(r)},children:e.jsx("div",{className:"classic-banner-overlay"})}),e.jsx("div",{className:"classic-card-icon-wrapper",children:r.avatar?e.jsx("img",{src:he(r.avatar),alt:r.name,className:"classic-card-icon-img",loading:"lazy"}):e.jsx("div",{className:"classic-card-icon-placeholder",children:((k=(b=r.name)==null?void 0:b.substring(0,2))==null?void 0:k.toUpperCase())||"P"})}),e.jsxs("div",{className:"classic-card-body",children:[e.jsxs("div",{className:"classic-card-title-row",children:[e.jsx("h4",{className:"classic-card-title",children:r.name}),e.jsx(Is,{portal:r,size:16})]}),e.jsx("p",{className:"classic-card-desc",children:r.description||"Bu topluluk hakkında henüz bir açıklama girilmemiş."}),e.jsxs("div",{className:"classic-card-footer",children:[e.jsxs("div",{className:"classic-member-count",children:[e.jsx(Ps,{size:12}),e.jsxs("span",{children:[r.memberCount||0," Üye"]})]}),e.jsx("button",{type:"button",className:`tanitim-sharp-btn small-btn ${r.isMember?"btn-joined":r.isRequested?"btn-requested":"btn-action"}`,onClick:F=>z(F,r),disabled:j===r._id||r.isRequested,children:j===r._id?"...":r.isMember?"ÜYESİNİZ":r.isRequested?"İSTEK":r.privacy==="private"?"İSTEK AT":"KATIL"})]})]})]},r._id)})})]})]})},fa=({alerts:a=[]})=>{const[f,M]=n.useState(()=>{try{const y=sessionStorage.getItem("dismissed_portal_alerts");return y?JSON.parse(y):[]}catch{return[]}}),[h,H]=n.useState(null),g=a.filter(y=>!f.includes(y._id)),Q=y=>{H(y),setTimeout(()=>{const j=[...f,y];M(j);try{sessionStorage.setItem("dismissed_portal_alerts",JSON.stringify(j))}catch{}H(null)},300)},W=y=>{const j=new Date,z=new Date(y)-j;if(z<=0)return null;const _=Math.floor(z/(1e3*60*60*24)),P=Math.floor(z/(1e3*60*60)%24),$=Math.floor(z/(1e3*60)%60);return _>0?`${_} gün ${P} saat kaldı`:P>0?`${P} saat ${$} dk kaldı`:`${$} dakika kaldı`};return g.length===0?null:e.jsx(e.Fragment,{children:g.map(y=>e.jsx("div",{className:`portal-alert-banner ${h===y._id?"dismissing":""}`,children:e.jsxs("div",{className:"alert-banner-inner",children:[e.jsx("div",{className:"alert-banner-icon",children:e.jsx(ra,{size:18,strokeWidth:2})}),e.jsxs("div",{className:"alert-banner-content",children:[e.jsx("div",{className:"alert-banner-label",children:e.jsx("span",{children:"Yönetici Uyarısı"})}),e.jsx("div",{className:"alert-banner-message",children:y.message}),e.jsx("div",{className:"alert-banner-meta",children:e.jsxs("span",{className:"alert-banner-time",children:[e.jsx(ot,{size:16,strokeWidth:2}),W(y.expiresAt)||"Süresi dolmak üzere"]})})]}),e.jsx("button",{className:"alert-banner-close",onClick:()=>Q(y._id),title:"Uyarıyı gizle",children:e.jsx(ss,{size:16,strokeWidth:2.5})})]})},y._id))})},ba=n.lazy(()=>fs(()=>import("./PortalSettingsModal-BWxPtRUh.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13]))),ya=n.lazy(()=>fs(()=>import("./PortalNotifications-huk16S1g.js"),__vite__mapDeps([14,1,2,3,4,5,6,15]))),va=n.lazy(()=>fs(()=>import("./VoiceChannel-CPwr3nJT.js"),__vite__mapDeps([16,1,4,2,3,5,6,17,18]))),ja=n.lazy(()=>fs(()=>import("./ConferenceChannel-DRYaRKQM.js"),__vite__mapDeps([19,1,4,2,3,5,6,17,18]))),Va=()=>{var Ys,Hs,Js,Zs,Qs;const{id:a}=It(),f=At(),[M]=Tt(),h=M.get("channel"),H=M.get("post"),{user:g,token:Q,updateUser:W,loading:y}=bs(),{socket:j,connected:K}=Ts(),z=As(),_=lt(),{isSidebarOpen:P,closeSidebar:$,isMobileView:r,mobileChannelOpen:b,setMobileChannelOpen:k}=_||{},F=(_==null?void 0:_.isDesktopSidebarCollapsed)||!1,R=typeof window<"u"&&!!localStorage.getItem("admin_backup_token"),[s,A]=n.useState(()=>{var t;try{const i=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(i){const l=JSON.parse(i);if(Array.isArray(l==null?void 0:l.channels)&&l.channels.length>0)return l}}catch{}return(t=f==null?void 0:f.state)!=null&&t.portal&&(String(f.state.portal._id)===String(a)||String(f.state.portal.id)===String(a))&&Array.isArray(f.state.portal.channels)&&f.state.portal.channels.length>0?f.state.portal:null});n.useEffect(()=>{var t;(t=f==null?void 0:f.state)!=null&&t.portal&&(String(f.state.portal._id)===String(a)||String(f.state.portal.id)===String(a))&&A(i=>Array.isArray(f.state.portal.channels)&&f.state.portal.channels.length>0?f.state.portal:i&&Array.isArray(i.channels)&&i.channels.length>0?{...f.state.portal,channels:i.channels,roles:i.roles||f.state.portal.roles,members:i.members||f.state.portal.members}:i||null)},[a,f.state]);const U=gs(t=>t.posts),N=gs(t=>t.setPosts),[ee,re]=n.useState(()=>{var t;try{const i=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(i){const l=JSON.parse(i);if(Array.isArray(l==null?void 0:l.channels)&&l.channels.length>0)return!1}}catch{}return!((t=f==null?void 0:f.state)!=null&&t.portal&&(String(f.state.portal._id)===String(a)||String(f.state.portal.id)===String(a))&&Array.isArray(f.state.portal.channels)&&f.state.portal.channels.length>0)}),[be,Ie]=n.useState(!1),[me,J]=n.useState(""),[se,Fe]=n.useState(null),[pe,Ee]=n.useState(null),[Me,Re]=n.useState(!1),[C,te]=n.useState(null),[Le,xe]=n.useState({}),[$e,ye]=n.useState(!1),[ge,Ke]=n.useState(""),[oe,ve]=n.useState([]);n.useRef(null);const[je,De]=n.useState(!1),[_e,c]=n.useState(!1),[w,ke]=n.useState({show:!1,message:"",type:"info"}),[Be,Ne]=n.useState(!1),[le,X]=n.useState(!1),[Se,Ce]=n.useState({top:0,left:0}),[Ue,ts]=n.useState(""),[Ms,as]=n.useState(!1),Oe=n.useRef(null),Rs=n.useRef(null),Ls=n.useRef(null),$s=n.useRef(null),[D,qe]=n.useState(null),[ze,Ge]=n.useState([]),[Ae,We]=n.useState([]),[O,is]=n.useState(null),[ct,Ve]=n.useState(0),[Ds,ys]=n.useState(!1),ns=n.useRef(!1);$t();const we=et(t=>t.activeUploads)[`portal-${a}`];n.useEffect(()=>{we&&we.status==="uploading"&&N(t=>t.map(i=>i.isOptimistic&&i.mediaType==="video"?{...i,uploadProgress:we.progress}:i))},[we==null?void 0:we.progress,we==null?void 0:we.status]);const[dt,rs]=n.useState(!1),ls=!!(s!=null&&s.name&&/Oxypace Tan[ıi]t[ıi]m/i.test(s.name)),mt=!!(g&&(((Ys=g.username)==null?void 0:Ys.toLowerCase())==="oxypace"||g.isAdmin)),pt=ls?mt:g&&Me,ut=n.useRef(null),Ye=n.useRef(null),ht=n.useCallback(t=>{t.preventDefault(),t.stopPropagation(),X(i=>{if(!i&&Ye.current){const l=Ye.current.getBoundingClientRect();Ce({top:l.bottom+8,left:l.left})}return!i})},[]);n.useEffect(()=>{if(!le)return;let t=!0;const i=()=>{if(Ye.current){const m=Ye.current.getBoundingClientRect();Ce({top:m.bottom+8,left:m.left})}},l=m=>{if(!t)return;const p=m.target.closest(".plus-menu")||m.target.closest(".portal-plus-menu-portal"),x=m.target.closest(".upload-btn");!p&&!x&&X(!1)},d=setTimeout(()=>{t&&(document.addEventListener("click",l),document.addEventListener("touchstart",l))},0);return window.addEventListener("scroll",i,!0),window.addEventListener("resize",i),()=>{t=!1,clearTimeout(d),document.removeEventListener("click",l),document.removeEventListener("touchstart",l),window.removeEventListener("scroll",i,!0),window.removeEventListener("resize",i)}},[le]),n.useEffect(()=>()=>{X(!1)},[]),n.useEffect(()=>{X(!1)},[C,a]),n.useEffect(()=>{var t;(t=f.state)!=null&&t.quotedPost&&(is(f.state.quotedPost),f.state.selectedChannelId&&te(f.state.selectedChannelId),z(f.pathname+f.search,{replace:!0,state:{}}))},[f.state,a]);const Y=(Hs=s==null?void 0:s.channels)==null?void 0:Hs.find(t=>String(t._id)===String(C)),os=(Y==null?void 0:Y.type)==="image",Bs=(Y==null?void 0:Y.type)==="voice"||(Y==null?void 0:Y.type)==="conference",Us=Bs&&(!r||b);n.useEffect(()=>{s!=null&&s.channels&&Array.isArray(s.channels)&&xe(t=>{const i={...t};return s.channels.forEach(l=>{const d=String(l._id);l.postCount!==void 0&&(i[d]=l.postCount)}),i})},[s==null?void 0:s.channels]),n.useEffect(()=>{if(!j||!K||!a)return;j.emit("join_portal",a),j.emit("get_online_users"),C&&j.emit("join_channel",C);const t=m=>{var I,S,L,v;const p=((I=m.portal)==null?void 0:I._id)||m.portal,x=((S=m.channel)==null?void 0:S._id)||m.channel,o=String(p)===String(a),T=String(x)===String(C);if(o&&T){const G=((L=m.author)==null?void 0:L._id)||((v=m.author)==null?void 0:v.id)||m.author;if(String(G)!==String(g==null?void 0:g._id)){const q=String(C);xe(Z=>({...Z,[q]:(Z[q]!==void 0?Z[q]:(Y==null?void 0:Y.postCount)||0)+1}))}N(q=>{if(q.some(ue=>ue._id===m._id))return q;const Z=m.quotedPost&&(typeof m.quotedPost=="string"?m.quotedPost:m.quotedPost._id);if(Z){const ue=q.find(ie=>ie._id===Z);ue&&typeof ue=="object"&&ue.author?m.quotedPost=ue:O&&Z===O._id&&(m.quotedPost=O)}return[m,...q]})}},i=m=>{var o;const p=((o=m.portal)==null?void 0:o._id)||m.portal;(!p||String(p)===String(a))&&N(T=>T.map(I=>String(I._id)===String(m._id)?m:I))},l=({userId:m,status:p,lastActive:x})=>{p==="offline"&&ve(o=>o.filter(T=>String(T.userId)!==String(m))),A(o=>{if(!o)return o;const T=x||new Date;let I=o.owner;if(o.owner){const v=o.owner._id||o.owner.id||o.owner;String(v)===String(m)&&typeof o.owner=="object"&&(I={...o.owner,lastActive:T})}let S=o.admins;Array.isArray(o.admins)&&(S=o.admins.map(v=>{const G=v._id||v.id||v;return String(G)===String(m)&&typeof v=="object"&&v!==null?{...v,lastActive:T}:v}));let L=o.members;return Array.isArray(o.members)&&(L=o.members.map(v=>{const G=v._id||v.id||v;return String(G)===String(m)&&typeof v=="object"&&v!==null?{...v,lastActive:T}:v})),{...o,owner:I,admins:S,members:L}})},d=({userId:m,username:p,displayName:x,avatar:o,isTyping:T})=>{String(m)!==String(g==null?void 0:g._id)&&ve(I=>T?I.some(S=>String(S.userId)===String(m))?I:[...I,{userId:m,username:p,displayName:x,avatar:o}]:I.filter(S=>String(S.userId)!==String(m)))};return j.on("post:created",t),j.on("post:updated",i),j.on("user_status_change",l),j.on("portal_typing_update",d),()=>{j.off("post:created",t),j.off("post:updated",i),j.off("user_status_change",l),j.off("portal_typing_update",d)}},[j,K,a,C,g==null?void 0:g._id]);const xt=t=>{if(!t)return null;const i=/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,l=t.match(i);return l&&l[2].length===11?l[2]:null},gt=t=>{const i=t.target.value;ts(i)},qs=()=>{const t=xt(Ue);if(!t){ae("Geçersiz YouTube URL'si","error");return}qe({name:"YouTube Video",type:"youtube",preview:`https://img.youtube.com/vi/${t}/hqdefault.jpg`,url:Ue}),as(!1),ts("")},[ft,cs]=n.useState(!1),[bt,yt]=n.useState(0),vs=n.useRef(null),js=n.useRef(null),He=n.useRef(null),vt=n.useCallback(t=>{const i=t.target;js.current||(js.current=requestAnimationFrame(()=>{js.current=null;const l=i.scrollTop,d=l>300;cs(p=>p!==d?d:p);const m=i.scrollHeight-i.clientHeight;if(m>0){const p=Math.round(l/m*100);yt(x=>Math.abs(x-p)>=2?p:x)}}))},[]),ks=n.useCallback(t=>{t&&(t.preventDefault(),t.stopPropagation()),He.current&&cancelAnimationFrame(He.current);const i=vs.current||document.querySelector(".discord-feed")||document.querySelector(".portal-feed-container");if(!i){window.scrollTo({top:0,behavior:"smooth"});return}const l=i.scrollTop;if(l<=0)return;const d=800,m=performance.now(),p=o=>1-Math.pow(1-o,5),x=o=>{const T=o-m,I=Math.min(T/d,1),S=p(I);i.scrollTop=Math.round(l*(1-S)),I<1?He.current=requestAnimationFrame(x):(i.scrollTop=0,He.current=null)};He.current=requestAnimationFrame(x)},[]);n.useEffect(()=>{const t=()=>{ks(),(!s||!Array.isArray(s.channels)||s.channels.length===0)&&ps()};return window.addEventListener("oxypace:scroll_portal_top",t),()=>window.removeEventListener("oxypace:scroll_portal_top",t)},[ks,s==null?void 0:s._id,(Js=s==null?void 0:s.channels)==null?void 0:Js.length]);const jt=t=>{te(t),cs(!1),r&&($(),k(!0))},ae=n.useCallback((t,i="info")=>{ke({show:!0,message:t,type:i}),setTimeout(()=>ke(l=>({...l,show:!1})),4e3)},[]),kt=t=>{const i=Array.from(t.target.files||[]);if(i.length===0)return;qe(null),ns.current=!1;const d=10-ze.length;if(d<=0){ae("Bir gönderiye en fazla 10 görsel ekleyebilirsiniz.","warning");return}const m=i.slice(0,d);i.length>d&&ae(`En fazla 10 görsel ekleyebilirsiniz. İlk ${d} görsel eklendi.`,"warning");const p=[],x=[];for(const o of m){if(o.size>2*1024*1024*1024){ae(`${o.name} boyutu 2 GB'dan büyük olamaz.`,"error");continue}p.push(o),x.push({url:URL.createObjectURL(o),name:o.name,size:o.size,file:o})}Ge(o=>[...o,...p]),We(o=>[...o,...x]),X(!1),Oe.current&&(Oe.current.value="")},Nt=t=>{Ge(i=>i.filter((l,d)=>d!==t)),We(i=>{const l=i[t];if(l&&l.url&&l.url.startsWith("blob:"))try{URL.revokeObjectURL(l.url)}catch{}return i.filter((d,m)=>m!==t)})},Ns=t=>{const i=t.target.files[0];if(i){if(i.size>2*1024*1024*1024){ae("Dosya boyutu 2 GB'dan büyük olamaz.","error");return}Ge([]),We([]),qe(i),ns.current=i.type.startsWith("video/")||["mp4","webm","ogg","mov","m4v"].includes(i.name.split(".").pop().toLowerCase()),X(!1)}};n.useEffect(()=>{R||!j||!a||(ge.trim().length>0||D!==null||ze.length>0?je||(De(!0),j.emit("portal_typing",{portalId:a,isTyping:!0})):je&&(j.emit("portal_typing",{portalId:a,isTyping:!1}),De(!1)))},[ge,D,ze,a,j,je,R]),n.useEffect(()=>()=>{!R&&j&&a&&je&&j.emit("portal_typing",{portalId:a,isTyping:!1})},[a,j,je,R]);const Fs=async()=>{var S,L;if(R){ae("Hayalet Modu: Salt okunur izleme modundasınız. Gönderi paylaşılamaz.","error");return}const t=ge.trim().length>0,i=!!D,l=ze.length>0;if(!t&&!i&&!l)return;j&&a&&j.emit("portal_typing",{portalId:a,isTyping:!1}),De(!1);const d={content:ge,media:D,mediaFiles:[...ze],mediaPreviews:[...Ae]},m=D&&D.type==="youtube",p=`temp-${Date.now()}`;let x=null,o=null;m?(x=D.url,o="youtube"):l?(x=Ae.map(v=>v.url),o="image"):D&&(x=URL.createObjectURL(D),o=D.type.startsWith("video")?"video":D.type.includes("gif")?"gif":"image");const T=o==="video",I={_id:p,content:ge,media:x,mediaType:o||"none",author:g,createdAt:new Date().toISOString(),likes:[],likeCount:0,isOptimistic:!0,quotedPost:O,isProcessing:!!T,processingProgress:0,estimatedTime:T?"Hesaplanıyor...":""};if(N(v=>[I,...v]),C){const v=String(C);xe(G=>({...G,[v]:(G[v]!==void 0?G[v]:(Y==null?void 0:Y.postCount)||0)+1}))}Ke(""),qe(null),Ge([]),We([]),X(!1),ys(!0),Ve(0);try{let v=null,G=null,q=null,Z=null,ue=null;if(m)q=d.media.url,Z="youtube";else if(d.mediaFiles&&d.mediaFiles.length>0){const u=d.mediaFiles.length,E=new Array(u).fill(0),V=d.mediaFiles.map((B,ne)=>tt(B,"post",a,Xe=>{E[ne]=Xe;const ce=Math.round(E.reduce((fe,Pe)=>fe+Pe,0)/u);Ve(ce),N(fe=>fe.map(Pe=>String(Pe._id)===String(p)?{...Pe,uploadProgress:ce}:Pe))}));G=await Promise.all(V)}else if(d.media)if(ns.current){et.getState().startVideoUpload({file:d.media,portalId:a,channel:C,content:d.content,quotedPostId:O==null?void 0:O._id,onFinish:(u,E)=>{if(u){if(N(V=>V.filter(B=>String(B._id)!==String(p))),C){const V=String(C);xe(B=>({...B,[V]:Math.max(0,(B[V]||1)-1)}))}ae("Video yükleme başarısız oldu.","error")}else if(E){const V=String(p);N(B=>{const ne=String(E._id);return B.some(ce=>String(ce._id)===ne)?B.filter(ce=>String(ce._id)!==V):B.map(ce=>{if(String(ce._id)===V){const fe=E,Pe=fe.quotedPost&&(typeof fe.quotedPost=="string"?fe.quotedPost:fe.quotedPost._id);return Pe&&ce.quotedPost&&Pe===ce.quotedPost._id&&(fe.quotedPost=ce.quotedPost),fe}return ce})})}}}),ys(!1),is(null);return}else v=await tt(d.media,"post",a,u=>{Ve(u),N(E=>E.map(V=>String(V._id)===String(p)?{...V,uploadProgress:u}:V))});else Ve(100);const ie={content:d.content,portalId:a,channel:C,quotedPostId:O==null?void 0:O._id};G&&G.length>0?(ie.mediaKeys=G,ie.mediaType="image"):v?(ie.mediaKey=v,ns.current?ie.mediaType="video":d.media&&(d.media.type==="application/pdf"||d.media.name.toLowerCase().endsWith(".pdf"))&&(ie.pdfName=d.media.name,ie.pdfSize=d.media.size)):q&&(ie.media=q,ie.mediaType=Z);const Ze=await de.post("/api/posts",ie);is(null);const Qe=String(p);N(u=>{const E=String(Ze.data._id);return u.some(B=>String(B._id)===E)?u.filter(B=>String(B._id)!==Qe):u.map(B=>{if(String(B._id)===Qe){const ne=Ze.data,Xe=ne.quotedPost&&(typeof ne.quotedPost=="string"?ne.quotedPost:ne.quotedPost._id);return Xe&&B.quotedPost&&Xe===B.quotedPost._id&&(ne.quotedPost=B.quotedPost),ne}return B})})}catch(v){const G=((L=(S=v.response)==null?void 0:S.data)==null?void 0:L.message)||v.message;if(ae(G,"error"),N(q=>q.filter(Z=>String(Z._id)!==String(p))),C){const q=String(C);xe(Z=>({...Z,[q]:Math.max(0,(Z[q]||1)-1)}))}Ke(d.content),qe(d.media),Ge(d.mediaFiles||[]),We(d.mediaPreviews||[])}finally{ys(!1),Ve(0)}},[Ss,Te]=n.useState(!1),[ws,ds]=n.useState("overview"),[Na,Sa]=n.useState(!1),[wa,St]=n.useState({name:"",description:"",privacy:"public"});n.useRef(null),n.useRef(null);const ms=n.useRef(!1);n.useEffect(()=>{a&&!y&&ps()},[a,y]),n.useEffect(()=>{a&&!y&&!ms.current&&(!s||!Array.isArray(s.channels)||s.channels.length===0||String(s._id)!==String(a))&&ps()},[a,y,s==null?void 0:s._id,(Zs=s==null?void 0:s.channels)==null?void 0:Zs.length]),n.useEffect(()=>{M.get("openSettings")==="true"&&(ds("overview"),Te(!0))},[M]),n.useEffect(()=>{if(s&&s._id&&s.name)try{const t=localStorage.getItem("oxypace_portal_visits"),i=t?JSON.parse(t):{},l=String(s._id),d=i[l]||{count:0};i[l]={id:l,name:s.name,avatar:s.avatar,count:(d.count||0)+1,lastVisited:Date.now()},localStorage.setItem("oxypace_portal_visits",JSON.stringify(i));let m=0,p=null;Object.values(i).forEach(x=>{x.count>m&&(m=x.count,p=x)}),p&&localStorage.setItem("oxypace_top_portal",JSON.stringify({id:p.id,name:p.name}))}catch{}},[s==null?void 0:s._id,s==null?void 0:s.name]),n.useEffect(()=>{if(!y&&s&&s.channels&&s.channels.length>0)if(C){if(h){const i=s.channels.find(l=>String(l._id)===String(h));if(i&&String(i._id)!==String(C)){te(i._id);return}}if(!s.channels.some(i=>String(i._id)===String(C))){const i=s.channels[0];i&&te(i._id)}}else{if(h){const i=s.channels.find(l=>String(l._id)===String(h));if(i){te(i._id);return}}const t=s.channels[0];t&&te(t._id)}},[s,y,h]),n.useEffect(()=>{const t=i=>{const{portalId:l,channelId:d}=i.detail||{};(!l||String(l)===String(a))&&d&&(te(d),cs(!1),k&&k(!0))};return window.addEventListener("oxypace:switch_channel",t),()=>window.removeEventListener("oxypace:switch_channel",t)},[a,k]),n.useLayoutEffect(()=>{const t=!!h||M.get("joinVoice")==="true";k&&t&&k(!0)},[a,h,M,k]),n.useEffect(()=>{a&&C&&s&&zs(s._id,a)&&hs()},[a,C,s==null?void 0:s._id]),n.useEffect(()=>{if(H&&!$e&&!be&&Array.isArray(U)&&U.length>0){const t=document.getElementById(`post-${H}`);t&&setTimeout(()=>{t.scrollIntoView({behavior:"smooth",block:"center"}),t.classList.add("highlight-post"),setTimeout(()=>t.classList.remove("highlight-post"),2e3),ye(!0)},100)}},[H,U,be,$e]),n.useEffect(()=>{var t,i;if(s&&g){const l=((t=s.members)==null?void 0:t.includes(g._id))||((i=g.joinedPortals)==null?void 0:i.some(d=>d._id===s._id||d===s._id));Re(!!l)}},[s,g]);const ps=async()=>{var l,d,m,p;if(ms.current)return;ms.current=!0,J("");let t=null;try{const x=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(x){const o=JSON.parse(x);o&&String(o._id)===String(a)&&Array.isArray(o.channels)&&o.channels.length>0&&(t=o)}}catch{}(!s||String(s._id)!==String(a)||!Array.isArray(s.channels)||s.channels.length===0)&&(t?(A(t),re(!1)):re(!0),cs(!1));let i=null;for(let x=0;x<3;x++)try{const o=await de.get(`/api/portals/${a}`);A(o.data);try{const S=JSON.stringify(o.data);sessionStorage.setItem(`oxypace_portal_cache_${a}`,S),localStorage.setItem(`oxypace_portal_cache_${a}`,S)}catch{}(l=o.data)!=null&&l.avatar&&st(o.data.avatar,"original");const T=((d=o.data)==null?void 0:d.coverImage)||((m=o.data)==null?void 0:m.banner);T&&st(T,"original");const I=[o.data.owner,...o.data.admins||[],...o.data.members||[]].filter(Boolean);Rt(I),St({name:o.data.name,description:o.data.description||"",privacy:o.data.privacy||"public"}),J(""),i=null;break}catch(o){i=o;const T=(p=o.response)==null?void 0:p.status;if(T===403||T===404)break;x<2&&await new Promise(I=>setTimeout(I,1200*(x+1)))}if(i)if(i.response&&i.response.status===403){const x=i.response.data||{};x.portalStatus==="suspended"||x.portalStatus==="closed"?(Fe({portalStatus:x.portalStatus,statusReason:x.statusReason,suspendedUntil:x.suspendedUntil,portalName:x.portalName,portalAvatar:x.portalAvatar}),J("suspended")):J("blocked")}else i.response&&i.response.status===404?J("blocked"):!t&&(!s||String(s._id)!==String(a))&&J("Portal yüklenemedi");ms.current=!1,re(!1)},us=n.useRef(null),Ks=n.useRef(U);Ks.current=U;const Je=n.useRef(C);Je.current=C;const hs=n.useCallback(async(t=!1)=>{var d,m;const i=Je.current,l=`portal_posts_${a}_${i}`;if(t)Gs(!0);else{us.current&&us.current.abort(),us.current=new AbortController;let p=!1;try{const x=localStorage.getItem(l)||sessionStorage.getItem(l);if(x){const o=JSON.parse(x);Array.isArray(o)&&o.length>0&&(N(o),Ie(!1),p=!0)}}catch{}p||(Ie(!0),N([])),_s(!0)}try{const p=localStorage.getItem("token"),x={signal:(d=us.current)==null?void 0:d.signal,...p&&{headers:{Authorization:`Bearer ${p}`}}};if(t&&i!==Je.current)return;let o=`/api/portals/${a}/posts?channel=${i}&limit=10`;const T=Ks.current;if(t&&T.length>0){const L=T[T.length-1];o+=`&before=${L.createdAt}`}const I=await de.get(o,x),S=I.data;if(I.headers&&I.headers["x-total-count"]!==void 0){const L=parseInt(I.headers["x-total-count"],10);isNaN(L)||xe(v=>({...v,[String(i)]:L}))}if(S.length<10&&_s(!1),t)N(L=>{const v=new Set(L.map(q=>q._id)),G=S.filter(q=>!v.has(q._id));return[...L,...G]});else{N(S);try{localStorage.setItem(l,JSON.stringify(S.slice(0,20)))}catch{try{sessionStorage.setItem(l,JSON.stringify(S.slice(0,15)))}catch{}}}J("")}catch(p){if(de.isCancel(p))return;((m=p.response)==null?void 0:m.status)===403?J("private"):J("Gönderiler yüklenemedi")}finally{t||Ie(!1),Gs(!1),re(!1)}},[a]),[Os,_s]=n.useState(!0),[Cs,Gs]=n.useState(!1),xs=n.useRef(),wt=n.useCallback(t=>{Cs||(xs.current&&xs.current.disconnect(),xs.current=new IntersectionObserver(i=>{i[0].isIntersecting&&Os&&hs(!0)},{root:vs.current,rootMargin:"200px"}),t&&xs.current.observe(t))},[Cs,Os,hs]);n.useEffect(()=>{N([]),_s(!0),te(null),A(null),J(""),k(!1)},[a]);const _t=n.useCallback(t=>{N(l=>l.filter(d=>String(d._id)!==String(t)));const i=Je.current;i&&xe(l=>({...l,[String(i)]:Math.max(0,(l[String(i)]||1)-1)}))},[N]),Ct=n.useCallback((t,i)=>{if(i){N(d=>d.filter(m=>String(m._id)!==String(t)));const l=Je.current;l&&xe(d=>({...d,[String(l)]:Math.max(0,(d[String(l)]||1)-1)}))}},[N]),zt=n.useCallback(async t=>{try{const l=(await de.put(`/api/posts/${t}/pin`)).data;N(d=>d.map(p=>p._id===t?l:p).sort((p,x)=>p.isPinned===x.isPinned?new Date(x.createdAt)-new Date(p.createdAt):p.isPinned?-1:1))}catch{ae("Sabitleme işlemi başarısız","error")}},[N,ae]),Pt=async()=>{var t,i;if(!g){ae("Lütfen giriş yapın veya kaydolun!","warning");return}try{const l=localStorage.getItem("token"),d=l?{headers:{Authorization:`Bearer ${l}`}}:{};if((await de.post(`/api/portals/${a}/join`,{},d)).data.status==="joined"){Re(!0);const p=Array.isArray(g==null?void 0:g.joinedPortals)?g.joinedPortals:[],x=Array.isArray(g==null?void 0:g.portals)?g.portals:[],o=[...p.filter(S=>{var L;return((L=(S==null?void 0:S._id)||S)==null?void 0:L.toString())!==a.toString()}),s],T=[...x.filter(S=>{var L;return((L=(S==null?void 0:S._id)||S)==null?void 0:L.toString())!==a.toString()}),s],I={...g,joinedPortals:o,portals:T};W(I),A(S=>({...S,members:[...S.members||[],g._id]})),hs(),ae("Portala başarıyla katıldınız!","success")}else ae("Üyelik isteğiniz gönderildi!","info"),A(p=>({...p,isRequested:!0}))}catch(l){ae(((i=(t=l.response)==null?void 0:t.data)==null?void 0:i.message)||"Katılma başarısız","error")}},zs=(t,i)=>{if(!t||!i)return!1;const l=typeof t=="object"?t.toString():t,d=typeof i=="object"?i.toString():i;return l===d},Ws=g&&s&&s.owner&&zs(s.owner._id||s.owner,g._id),Vs=Ws||g&&s&&s.admins&&s.admins.some(t=>zs(t._id||t,g._id));if(n.useEffect(()=>{if(!(se!=null&&se.suspendedUntil)){Ee(null);return}const t=()=>{const l=new Date,m=new Date(se.suspendedUntil)-l;if(m<=0){Ee(null),window.location.reload();return}Ee({days:Math.floor(m/(1e3*60*60*24)),hours:Math.floor(m/(1e3*60*60)%24),minutes:Math.floor(m/(1e3*60)%60),seconds:Math.floor(m/1e3%60)})};t();const i=setInterval(t,1e3);return()=>clearInterval(i)},[se]),!Q&&!y)return e.jsx(Et,{to:"/",replace:!0});if(me==="suspended"&&se){const t=se.portalStatus==="suspended",i=se.suspendedUntil?new Date(se.suspendedUntil).toLocaleString("tr-TR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):null;return e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsx("div",{className:"suspension-screen",children:e.jsxs("div",{className:"suspension-card",children:[e.jsx("div",{className:"suspension-icon",children:t?"⏸️":"🔒"}),e.jsx("h1",{className:"suspension-title",children:se.portalName||"Portal"}),e.jsx("h2",{className:"suspension-subtitle",children:t?"Bu portal geçici olarak askıya alındı":"Bu portal kapatılmıştır"}),se.statusReason&&e.jsxs("div",{className:"suspension-reason",children:[e.jsx("div",{className:"suspension-reason-label",children:"Sebep"}),e.jsx("p",{children:se.statusReason})]}),t&&i&&e.jsxs("div",{className:"suspension-unlock",children:[e.jsx("div",{className:"suspension-unlock-label",children:"🔓 Erişim Açılma Tarihi"}),e.jsx("div",{className:"suspension-unlock-date",children:i}),pe&&e.jsxs("div",{className:"suspension-countdown",children:[e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(pe.days).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Gün"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(pe.hours).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saat"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(pe.minutes).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Dakika"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(pe.seconds).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saniye"})]})]})]}),e.jsxs("div",{className:"suspension-policy",children:[e.jsx("span",{children:"📋"}),e.jsxs("p",{children:["Askıya alma nedenleri, platformun ",e.jsx("strong",{children:"Politika ve Koşullar"}),"'ı kapsamında değerlendirilmektedir. Detaylı bilgi için kurallarımızı inceleyebilirsiniz."]})]}),e.jsx("button",{onClick:()=>z("/"),className:"suspension-home-btn",children:"Anasayfaya Dön"})]})})]})}return me&&me!=="suspended"?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsxs("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center",flexDirection:"column",color:"var(--text-muted)"},children:[e.jsx("div",{style:{fontSize:"3rem",marginBottom:"1rem"},children:"🚫"}),e.jsx("h2",{children:me==="blocked"?"Sonuç Bulunamadı":"Bir Hata Oluştu"}),e.jsx("p",{children:me==="blocked"?"Aradığınız portala ulaşılamıyor.":me||"Portal yüklenirken bir sorun oluştu."}),e.jsx("button",{onClick:()=>z("/"),className:"btn-save",style:{marginTop:"20px",float:"none"},children:"Anasayfaya Dön"})]})]}):ee||y||!s||!Array.isArray(s.channels)||s.channels.length===0?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsx("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center"},children:e.jsx("div",{className:"spinner"})})]}):s.isNSFW&&!Be&&!sessionStorage.getItem(`nsfw_confirmed_${a}`)?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsx("div",{className:"nsfw-gate-overlay",children:e.jsxs("div",{className:"nsfw-gate-card",children:[e.jsx("div",{className:"nsfw-gate-icon",children:e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]})}),e.jsx("div",{className:"nsfw-gate-badge",children:"+18"}),e.jsx("h1",{className:"nsfw-gate-title",children:"Yaş Kısıtlaması"}),e.jsxs("p",{className:"nsfw-gate-desc",children:[e.jsx("strong",{children:s.name})," portalı yetişkin içerik barındırabilir. Bu portala erişmek için 18 yaşından büyük olmanız gerekmektedir."]}),e.jsxs("div",{className:"nsfw-gate-actions",children:[e.jsx("button",{className:"nsfw-gate-confirm",onClick:()=>{sessionStorage.setItem(`nsfw_confirmed_${a}`,"true"),Ne(!0)},children:"18 yaşından büyüğüm, devam et"}),e.jsx("button",{className:"nsfw-gate-cancel",onClick:()=>z(-1),children:"Geri Dön"})]}),e.jsx("p",{className:"nsfw-gate-legal",children:"Devam ederek, yaşınızın 18'den büyük olduğunu ve yetişkin içerikle ilgili yasal sorumluluğu kabul ettiğinizi onaylarsınız."})]})})]}):e.jsxs("div",{className:`app-wrapper full-height discord-layout ${Us?"voice-channel-active":""}`,children:[e.jsx(ma,{title:s.name,description:s.description||`${s.name} topluluğuna katılın.`,image:he(s.avatar),type:"website",schema:{"@context":"https://schema.org","@type":"Community",name:s.name,description:s.description,url:window.location.href,memberCount:((Qs=s.members)==null?void 0:Qs.length)||0}}),!Ss&&e.jsx(es,{}),w.show&&e.jsxs("div",{className:`app-toast ${w.type}`,children:[e.jsx("span",{className:"app-toast-icon",children:w.type==="error"?"🚫":w.type==="success"?"✅":w.type==="warning"?"⚠️":"ℹ️"}),w.message]}),e.jsxs("div",{className:`discord-split-view ${r&&b?"mobile-feed-active":""} ${Us?"voice-room-active":""} ${F?"sidebar-collapsed":""}`,children:[g&&e.jsx(ha,{portal:s,isMember:Me,canManage:Ws||Vs,onEdit:t=>{ds(typeof t=="string"?t:"overview"),Te(!0)},currentChannel:C,onChangeChannel:jt,className:`${P?"mobile-open":""} ${r&&b?"mobile-hidden":""}`,onShowPortalInfo:()=>rs(!0)}),e.jsxs("main",{className:`discord-main-content ${r&&!b?"mobile-content-hidden":""} ${Bs?"voice-channel-active":""}`,children:[r&&!b&&e.jsx(da,{title:(s==null?void 0:s.name)||"Portal",showBack:!1}),(()=>{var m,p,x,o,T,I,S,L,v,G,q,Z,ue,ie,Ze,Qe;const t=Y,i=(t==null?void 0:t.type)||"text",l=(t==null?void 0:t.name)||"...",d=i==="voice"||i==="conference";return e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{display:"flex",flex:1,overflow:"hidden"},children:d?e.jsx("div",{style:{flex:1,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"},children:e.jsx(n.Suspense,{fallback:e.jsx("div",{className:"skeleton-loader",children:e.jsx("p",{children:"Canlı bağlantı odası hazırlanıyor..."})}),children:i==="conference"?e.jsx(ja,{portalId:a,channelId:C,channelName:l,onBack:()=>k(!1)}):e.jsx(va,{portalId:a,channelId:C,channelName:l,onBack:()=>k(!1)})})}):e.jsx("div",{className:"channel-messages-area",style:{flex:1,display:"flex",flexDirection:"column"},children:be?e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"},children:[e.jsx("div",{className:"spinner"}),e.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.9rem"},children:"İçerik yükleniyor..."})]}):e.jsxs(e.Fragment,{children:[!d&&e.jsxs("header",{className:`channel-top-bar ${r?"":"desktop-only"}`,children:[e.jsxs("div",{className:"channel-title-wrapper",children:[r&&e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>k(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",children:i==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",children:l}),(()=>{const u=String((t==null?void 0:t._id)||C||""),E=Le[u]!==void 0?Le[u]:(t==null?void 0:t.postCount)??0;return e.jsxs("div",{className:"channel-post-count-badge",title:`${E} Gönderi`,children:[e.jsx(Es,{size:13}),e.jsx("span",{children:E})]})})()]}),e.jsx("div",{className:"channel-header-actions",children:Me&&e.jsx("button",{className:`icon-btn ${_e?"active":""}`,onClick:()=>c(!_e),title:_e?"Üyeleri Gizle":"Üyeleri Göster",style:{background:"none",border:"none",color:_e?"var(--primary-color)":"var(--text-muted)"},children:e.jsx(Ps,{size:20})})})]}),me==="private"?e.jsx(nt,{portal:s,onClose:()=>{window.history.length>2?z(-1):z("/search")},isMobile:r,onOpenSettings:()=>{ds("overview"),Te(!0)},onJoinStatusChange:u=>{u==="requested"?A(E=>E&&{...E,isRequested:!0}):u==="joined"&&(Re(!0),J(""),fetchPosts())}}):e.jsxs(e.Fragment,{children:[(s==null?void 0:s.alerts)&&s.alerts.length>0&&e.jsx(fa,{alerts:s.alerts}),e.jsx("div",{className:`portal-feed-container discord-feed ${ls?"tanitim-feed-mode":""}`,onScroll:vt,ref:vs,children:ls?e.jsx(ga,{}):e.jsxs(e.Fragment,{children:[U.length===0&&!ee&&e.jsxs("div",{className:"empty-portal",children:[e.jsx("div",{className:"empty-portal-icon",children:"👋"}),e.jsxs("h3",{children:[((p=(m=s==null?void 0:s.channels)==null?void 0:m.find(u=>u._id===C))==null?void 0:p.type)==="voice"?"🎙️":((o=(x=s==null?void 0:s.channels)==null?void 0:x.find(u=>u._id===C))==null?void 0:o.type)==="conference"?"🎤":((I=(T=s==null?void 0:s.channels)==null?void 0:T.find(u=>u._id===C))==null?void 0:I.type)==="image"?"🖼️":"#",((L=(S=s==null?void 0:s.channels)==null?void 0:S.find(u=>String(u._id)===String(C)))==null?void 0:L.name)||"..."," ","kanalına hoş geldin!"]}),e.jsx("p",{children:"Bu kanalda henüz mesaj yok. İlk mesajı sen at!"})]}),Array.isArray(U)&&U.map((u,E)=>{var B;u.isBot===!0||((B=u.author)==null||B.isBot);const V=Lt.enableAds;return e.jsxs(n.Fragment,{children:[e.jsx(Dt,{post:u,onDelete:_t,onPin:zt,onArchive:Ct,isAdmin:Vs},u._id),E<U.length-1&&e.jsx("div",{className:"post-separator"}),V]},u._id)}),e.jsx("div",{ref:wt,style:{height:"40px",margin:"10px 0",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"},children:Cs&&e.jsx("div",{className:"spinner-small"})})]})}),(()=>{const E=2*Math.PI*20,V=E-bt/100*E;return e.jsxs("button",{className:`floating-scroll-top portal-scroll-top ${ft?"visible":""}`,onClick:ks,"aria-label":"Yukarı Çık",children:[e.jsxs("svg",{className:"progress-ring",width:"50",height:"50",viewBox:"0 0 50 50",children:[e.jsx("circle",{className:"progress-ring-track",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25"}),e.jsx("circle",{className:"progress-ring-fill",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25",style:{strokeDasharray:E,strokeDashoffset:V}})]}),e.jsx("div",{className:"scroll-icon",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"m18 15-6-6-6 6"})})})]})})(),ls?null:pt?e.jsxs("div",{className:"channel-input-area",children:[le&&Mt.createPortal(e.jsxs("div",{className:"plus-menu portal-plus-menu-portal",ref:ut,style:{position:"fixed",top:Se.top,left:Se.left,zIndex:99999},children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Oe.current.click(),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("circle",{cx:"8.5",cy:"8.5",r:"1.5"}),e.jsx("polyline",{points:"21 15 16 10 5 21"})]})}),"Görsel"]}),!os&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Rs.current.click(),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("polygon",{points:"23 7 16 12 23 17 23 7"}),e.jsx("rect",{x:"1",y:"5",width:"15",height:"14",rx:"2",ry:"2"})]})}),"Video"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Ls.current.click(),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",style:{fontWeight:800,fontSize:"10px"},children:"GIF"}),"GIF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{$s.current.click(),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"})]})}),"PDF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{as(!Ms),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"}),e.jsx("polygon",{points:"9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02",fill:"currentColor"})]})}),"YouTube"]})]})]}),document.body),e.jsx("input",{type:"file",ref:Oe,onChange:kt,style:{display:"none"},accept:"image/png, image/jpeg, image/jpg, image/webp",multiple:!0}),e.jsx("input",{type:"file",ref:Rs,onChange:Ns,style:{display:"none"},accept:"video/mp4, video/webm, video/quicktime"}),e.jsx("input",{type:"file",ref:Ls,onChange:Ns,style:{display:"none"},accept:"image/gif"}),e.jsx("input",{type:"file",ref:$s,onChange:Ns,style:{display:"none"},accept:".pdf"}),Ms&&e.jsx("div",{className:"edit-modal-overlay",style:{zIndex:9999},children:e.jsxs("div",{className:"edit-modal-modern",style:{maxWidth:"400px",height:"auto",maxHeight:"none"},children:[e.jsxs("div",{className:"edit-modal-header-modern",children:[e.jsx("div",{className:"header-left",children:e.jsx("h3",{className:"header-title-modern",children:"YouTube Videosu Ekle"})}),e.jsx("button",{onClick:()=>as(!1),className:"close-btn-modern",children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),e.jsxs("div",{className:"edit-modal-content-modern",style:{padding:"20px"},children:[e.jsxs("div",{className:"floating-label-group",children:[e.jsx("label",{className:"floating-label",children:"Video Bağlantısı"}),e.jsx("input",{type:"text",className:"floating-input",placeholder:"https://www.youtube.com/watch?v=...",value:Ue,onChange:gt,autoFocus:!0,onKeyDown:u=>{u.key==="Enter"&&(u.preventDefault(),qs())}})]}),e.jsxs("div",{style:{marginTop:"20px",display:"flex",justifyContent:"flex-end",gap:"10px"},children:[e.jsx("button",{onClick:()=>as(!1),className:"join-btn outline",style:{padding:"8px 16px"},children:"İptal"}),e.jsx("button",{onClick:qs,className:"join-btn primary",style:{padding:"8px 20px"},children:"Ekle"})]})]})]})}),O&&e.jsxs("div",{className:"input-quoted-preview",children:[e.jsxs("div",{className:"input-quoted-preview-header",children:[(G=(v=O.author)==null?void 0:v.profile)!=null&&G.avatar?e.jsx("img",{src:he(O.author.profile.avatar),alt:"",className:"quoted-preview-avatar",loading:"lazy",decoding:"async",width:"32",height:"32"}):e.jsx("div",{className:"quoted-preview-avatar-placeholder",children:(Z=(q=O.author)==null?void 0:q.username)==null?void 0:Z.charAt(0).toUpperCase()}),e.jsxs("div",{className:"quoted-preview-meta",children:[e.jsx("span",{className:"quoted-preview-author",children:((ie=(ue=O.author)==null?void 0:ue.profile)==null?void 0:ie.displayName)||((Ze=O.author)==null?void 0:Ze.username)}),e.jsxs("span",{className:"quoted-preview-username",children:["@",(Qe=O.author)==null?void 0:Qe.username]})]}),e.jsx("button",{className:"remove-quote-btn",onClick:()=>is(null),children:e.jsx(ss,{size:16})})]}),e.jsxs("div",{className:"input-quoted-preview-body",children:[e.jsx("p",{className:"input-quoted-preview-text",children:O.content}),O.media&&e.jsx("div",{className:"input-quoted-preview-media",children:O.mediaType==="video"?e.jsxs("div",{className:"media-placeholder",children:[e.jsx(la,{size:20}),e.jsx("span",{children:"Video Alıntısı"})]}):e.jsx("img",{src:he(O.media),alt:"",loading:"lazy",decoding:"async",width:"120",height:"80"})})]})]}),os&&ge.trim()&&!D&&e.jsxs("div",{className:"image-channel-warning",style:{backgroundColor:"rgba(239, 68, 68, 0.1)",border:"1px solid rgba(239, 68, 68, 0.25)",color:"#f87171",padding:"8px 12px",borderRadius:"8px",fontSize:"13px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{flexShrink:0},children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]}),e.jsx("span",{children:"Görsel kanallarında paylaşım yapabilmek için mutlaka bir görsel eklemelisiniz."})]}),R?e.jsxs("div",{className:"ghost-channel-notice",style:{backgroundColor:"#0c0c0c",borderTop:"1px solid #222",color:"#888",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",fontSize:"13px"},children:[e.jsxs("svg",{viewBox:"0 0 24 24",width:"18",height:"18",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{opacity:.7},children:[e.jsx("path",{d:"M12 2a5 5 0 0 0-5 5v14l3-2 2 2 2-2 3 2V7a5 5 0 0 0-5-5z"}),e.jsx("circle",{cx:"10",cy:"8",r:"1",fill:"currentColor"}),e.jsx("circle",{cx:"14",cy:"8",r:"1",fill:"currentColor"})]}),e.jsx("span",{children:"Hayalet Modu: Salt okunur izleme modundasınız. Kanalda mesaj ve gönderi paylaşılamaz."})]}):e.jsxs("div",{className:"message-input-wrapper",children:[e.jsx("button",{ref:Ye,className:`input-action-btn upload-btn ${le?"active":""}`,onClick:ht,style:{backgroundColor:"#383a40",borderRadius:"50%",width:"32px",height:"32px",marginRight:"12px",color:le?"var(--primary-color)":"#b9bbbe"},children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z"})})}),D&&e.jsxs("div",{className:"input-media-preview",style:{marginRight:"12px",display:"flex",alignItems:"center",backgroundColor:"var(--bg-secondary)",borderRadius:"8px",padding:"4px",gap:"8px",border:"1px solid var(--border-subtle)"},children:[D.type==="youtube"&&D.preview?e.jsx("img",{src:D.preview,alt:"Video Preview",style:{width:"40px",height:"30px",objectFit:"cover",borderRadius:"4px"},loading:"lazy",decoding:"async",width:"40",height:"30"}):e.jsx("span",{style:{fontSize:"20px",lineHeight:1,padding:"4px"},children:D.type.startsWith("video")?"🎥":D.type.includes("gif")?"👾":D.type==="application/pdf"||D.name&&D.name.toLowerCase().endsWith(".pdf")?"📄":"🖼️"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",maxWidth:"100px"},children:e.jsx("span",{style:{fontSize:"10px",color:"var(--text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:D.name||"Medya"})}),e.jsx("button",{onClick:()=>qe(null),style:{background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer"},children:"×"})]}),e.jsx("input",{type:"text",placeholder:os?"Gönderi paylaşmak için bir görsel ekleyin...":`#${(Y==null?void 0:Y.name)||"..."} kanalına mesaj gönder`,value:ge,onChange:u=>{Ke(u.target.value)},onKeyDown:u=>{u.key==="Enter"&&!u.shiftKey&&(u.preventDefault(),Fs())}}),e.jsx("div",{className:"input-right-actions",children:e.jsx("button",{className:"input-action-btn send-btn",onClick:Fs,disabled:Ds||(os?!D&&ze.length===0:!ge.trim()&&!D&&ze.length===0),title:"Gönder",style:{color:ge.trim()||D||ze.length>0?"var(--primary-color)":"var(--text-tertiary)"},children:Ds?e.jsxs("div",{className:"compose-spinner-wrapper",style:{width:"20px",height:"20px"},children:[e.jsx("div",{className:"compose-spinner",style:{width:"20px",height:"20px",borderTopColor:"var(--primary-color)"}}),e.jsxs("span",{className:"compose-progress-text",style:{fontSize:"7px",color:"var(--text-primary)"},children:[ct,"%"]})]}):e.jsx(oa,{size:20})})})]}),Ae&&Ae.length>0&&e.jsxs("div",{className:"portal-image-previews-container",children:[e.jsxs("div",{className:"portal-image-previews-header",children:[e.jsxs("span",{className:"portal-image-previews-count",children:["Seçilen Görseller (",Ae.length,"/10)"]}),Ae.length<10&&e.jsx("button",{type:"button",className:"portal-add-more-images-btn",onClick:()=>{var u;return(u=Oe.current)==null?void 0:u.click()},children:"+ Görsel Ekle"})]}),e.jsx("div",{className:"portal-image-previews-list",children:Ae.map((u,E)=>e.jsxs("div",{className:"portal-image-preview-item",children:[e.jsx("img",{src:u.url,alt:`Preview ${E+1}`,className:"portal-image-preview-thumb"}),e.jsx("button",{type:"button",className:"portal-image-remove-btn",onClick:()=>Nt(E),title:"Görseli Kaldır",children:e.jsx(ss,{size:14})}),e.jsx("span",{className:"portal-image-index-badge",children:E+1})]},E))})]}),oe&&oe.length>0&&e.jsxs("div",{className:"portal-typing-indicator",style:{marginTop:"8px"},children:[e.jsx("div",{className:"typing-avatars-group",children:oe.map(u=>e.jsx("img",{src:he(u.avatar),alt:u.displayName,className:"typing-avatar",title:u.displayName},u.userId))}),e.jsx("span",{className:"typing-text",children:oe.length===1?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," yazıyor..."]}):oe.length===2?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," ve ",e.jsx("strong",{children:oe[1].displayName})," yazıyor..."]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," ve ",oe.length-1," kişi daha yazıyor..."]})})]})]}):e.jsx("div",{className:"channel-input-area",style:{padding:"0 20px 24px 20px",backgroundColor:"transparent",borderTop:"none"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--glass-bg)",padding:"12px 20px",borderRadius:"8px",border:"1px solid var(--glass-border)",backdropFilter:"blur(20px) saturate(160%)",WebkitBackdropFilter:"blur(20px) saturate(160%)",boxShadow:"var(--glass-shadow)"},children:[e.jsxs("span",{style:{color:"var(--text-secondary)",fontWeight:500,fontSize:"14px"},children:["Bu kanalda mesaj göndermek için ",g?"portala katılmalısın.":"giriş yapmalısın."]}),g?e.jsx("button",{className:"privacy-join-btn",onClick:Pt,disabled:s.isRequested,style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:s.isRequested?"İstek Gönderildi":"Portala Katıl"}):e.jsx("button",{className:"privacy-join-btn",onClick:()=>z("/login"),style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:"Giriş Yap"})]})})]})]})})}),_e&&e.jsx(xa,{members:[...s.owner?[{...s.owner,role:"owner"}]:[],...(s.admins||[]).map(u=>({...u,role:"admin"})),...s.members||[]].filter((u,E,V)=>{const B=String(u._id||u.id||u);return u&&V.findIndex(ne=>String(ne._id||ne.id||ne)===B)===E}),onClose:()=>c(!1)})]})})()]})]}),Ss&&ws!=="notifications"&&e.jsx(n.Suspense,{fallback:null,children:e.jsx(ba,{portal:s,currentUser:g,initialTab:ws,onClose:()=>Te(!1),onUpdate:t=>{A(t)}})}),Ss&&ws==="notifications"&&e.jsx("div",{className:"portal-notifications-modal",onClick:()=>Te(!1),children:e.jsxs("div",{className:"notifications-modal-content",onClick:t=>t.stopPropagation(),children:[e.jsx("button",{className:"close-notifications-btn",onClick:()=>Te(!1),children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsx(n.Suspense,{fallback:null,children:e.jsx(ya,{portalId:s._id,portalChannels:s.channels||[],onUpdate:ps})})]})}),dt&&s&&e.jsx(nt,{portal:s,onClose:()=>rs(!1),isMobile:r,onOpenSettings:()=>{rs(!1),ds("overview"),Te(!0)},onLeave:()=>{rs(!1),Re(!1),z("/")}})]})};export{Va as default};
