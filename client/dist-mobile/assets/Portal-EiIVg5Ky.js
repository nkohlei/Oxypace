const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PortalSettingsModal-C2kwcEiG.js","assets/vendor-BdW1UWN9.js","assets/index-B9zMaGKE.js","assets/socket-0ErsV37H.js","assets/livekit-BEAUSX0o.js","assets/lucide-BR4Hu8CX.js","assets/index-Cd_Hcj3m.css","assets/ImageCropper-mIiyACBP.js","assets/ImageCropper-Dk7oVLRB.css","assets/PortalBadges-CwSQtWWK.js","assets/UserBadges-YbBpEQv4.js","assets/UserBadges-DFKBzEd_.css","assets/PortalBadges-bryM1aQu.css","assets/PortalSettingsModal-CHDypHKx.css","assets/PortalNotifications-DfplPN_1.js","assets/PortalNotifications-zEgqx9Vo.css","assets/VoiceChannel-QA9XOJhB.js","assets/VoiceChannel-Cke8508Z.js","assets/VoiceChannel-D16FzM1I.css","assets/ConferenceChannel-BUBrWUR3.js"])))=>i.map(i=>d[i]);
import{r as n,a2 as e,a0 as pe,a3 as As,aq as Xs,as as It,a5 as At,ar as Tt,a6 as Et,a7 as Mt,a1 as fs}from"./vendor-BdW1UWN9.js";import{d as xe,l as rt,u as bs,m as lt,i as gs,c as Ts,b as et,p as st,h as Rt,n as Lt,a as tt}from"./index-B9zMaGKE.js";import{u as $t}from"./useVideoTranscoder-DQsYh-aX.js";import{P as Dt}from"./PostCard-COfz5asb.js";import{c as Bt,X as ss,ae as Ut,Y as qt,a2 as Ft,M as Es,a8 as Kt,a1 as Ot,a5 as Gt,e as Wt,a6 as Vt,aG as Yt,aH as Ht,aJ as Jt,aK as Zt,ad as Qt,K as at,aB as Xt,a9 as ea,F as sa,r as ta,t as aa,G as ia,s as Ps,j as na,aL as ot,au as ra,aM as la,aN as oa}from"./lucide-BR4Hu8CX.js";import{U as it}from"./UserBadges-YbBpEQv4.js";import{P as Is}from"./PortalBadges-CwSQtWWK.js";import{U as ca}from"./UserBar-sWG8X-iv.js";import{P as nt}from"./PortalInfoModal-CM9ZTP8t.js";import{N as es}from"./Navbar-D8DfUFbd.js";import{S as da}from"./SubHeader-BWbVe6cf.js";import{S as ma}from"./SEO-Br5ahskw.js";import"./socket-0ErsV37H.js";import"./livekit-BEAUSX0o.js";import"./VideoDownloadModal-HoxUzmBt.js";import"./LinkPreview-C6xDZjU2.js";import"./UserAvatar-ASnGxDnf.js";/* empty css                      */import"./Login-JmuZHnmk.js";/* empty css             *//* empty css                  */const pa=({portalId:a,onClose:g})=>{const[R,h]=n.useState(""),[J,x]=n.useState([]),[Q,Y]=n.useState(!1),[y,v]=n.useState(new Set);n.useEffect(()=>{const I=setTimeout(async()=>{if(R.trim().length===0){x([]);return}Y(!0);try{const D=await pe.get(`/api/users/search?q=${R}`);x(D.data)}catch{}finally{Y(!1)}},500);return()=>clearTimeout(I)},[R]);const G=async C=>{var I,D;try{await Promise.all([pe.post(`/api/portals/${a}/invite`,{userId:C}),pe.post("/api/messages",{recipientId:C,portalId:a,content:"Seni bir portala davet ettim!"})]),v(r=>new Set(r).add(C))}catch(r){alert(((D=(I=r.response)==null?void 0:I.data)==null?void 0:D.message)||"İşlem sırasında bir hata oluştu.")}},P=()=>{const C=`${window.location.origin}/portal/${a}`;navigator.clipboard.writeText(C),alert("Davet bağlantısı kopyalandı!")};return e.jsx("div",{className:"invite-modal-overlay",onClick:g,children:e.jsxs("div",{className:"invite-modal",onClick:C=>C.stopPropagation(),children:[e.jsxs("div",{className:"invite-header",children:[e.jsx("h2",{children:"Kullanıcı Davet Et"}),e.jsxs("div",{className:"header-actions",children:[e.jsxs("button",{className:"copy-link-btn",title:"Bağlantıyı Kopyala",onClick:P,children:[e.jsx(Bt,{size:20,strokeWidth:2}),e.jsx("span",{children:"Bağlantı"})]}),e.jsx("button",{className:"close-btn",onClick:g,children:e.jsx(ss,{size:24,strokeWidth:2})})]})]}),e.jsx("div",{className:"invite-search-container",children:e.jsx("input",{type:"text",className:"invite-search-input",placeholder:"Kullanıcı adı ara...",value:R,onChange:C=>h(C.target.value),autoFocus:!0})}),e.jsxs("div",{className:"invite-results custom-scrollbar",children:[Q&&e.jsx("div",{className:"loading-text",children:"Aranıyor..."}),!Q&&J.length===0&&R&&e.jsx("div",{className:"no-play-text",children:"Sonuç bulunamadı."}),J.map(C=>{var r;const I=C._id||C,D=y.has(I);return e.jsxs("div",{className:"invite-user-row",children:[e.jsxs("div",{className:"user-info",children:[e.jsx("img",{src:xe((r=C.profile)==null?void 0:r.avatar),alt:"",className:"user-avatar"}),e.jsx("span",{className:"user-name",children:C.username})]}),e.jsx("button",{className:`invite-btn ${D?"invited":""}`,onClick:()=>!D&&G(I),disabled:D,children:D?"Gönderildi":"Davet Et"})]},I)})]})]})})},ua=({startedAt:a,style:g={},className:R=""})=>{const{roomStartTime:h}=rt()||{},[J,x]=n.useState("00:00");n.useEffect(()=>{const Y=h&&a===h?h:a;if(!Y){x("00:00");return}const y=()=>{const G=Math.floor((Date.now()-Y)/1e3);if(G<0){x("00:00");return}const P=Math.floor(G/3600),C=Math.floor(G%3600/60),I=G%60;x(P>0?`${P.toString().padStart(2,"0")}:${C.toString().padStart(2,"0")}:${I.toString().padStart(2,"0")}`:`${C.toString().padStart(2,"0")}:${I.toString().padStart(2,"0")}`)};y();const v=setInterval(y,1e3);return()=>clearInterval(v)},[a,h]);const Q={display:"flex",alignItems:"center",fontSize:"15px",fontWeight:"800",color:"#39FF14",background:"transparent",border:"none",padding:"0 4px"};return e.jsx("div",{style:{...Q,...g},className:R,children:J})},ha=({portal:a,isMember:g,onEdit:R,currentChannel:h,onChangeChannel:J,className:x,canManage:Q,onShowPortalInfo:Y})=>{var Be,Ce;const{user:y}=bs(),[v,G]=n.useState(!1);As();const P=lt(),{isMobileView:C}=P||{},I=(P==null?void 0:P.isDesktopSidebarCollapsed)||!1,D=(P==null?void 0:P.setIsDesktopSidebarCollapsed)||(()=>{}),r=gs(c=>c.unreadPostsByChannel),f=gs(c=>c.clearUnreadForChannel),{roomStartTime:S,activeRoom:F,participants:$}=rt(),{socket:s,onlineUsers:A}=Ts(),[q,j]=n.useState({}),[ee,ne]=n.useState(null),ye=n.useRef(null),Ae=(c,w)=>{w.stopPropagation(),ye.current&&clearTimeout(ye.current),ne(c),ye.current=setTimeout(()=>{ne(null)},1800)};n.useEffect(()=>()=>{ye.current&&clearTimeout(ye.current)},[]);const ue=c=>{if(!c)return null;if(typeof c=="string")return c;const w=c._id||c.id;return w?String(w):null},Z=new Set,se=ue(a==null?void 0:a.owner);se&&Z.add(se),((a==null?void 0:a.admins)||[]).forEach(c=>{const w=ue(c);w&&Z.add(w)}),((a==null?void 0:a.members)||[]).forEach(c=>{const w=ue(c);w&&Z.add(w)});const Oe=new Set((A||[]).map(c=>String(c))),he=y!=null&&y._id?String(y._id):null,Me=((Ce=(Be=y==null?void 0:y.settings)==null?void 0:Be.privacy)==null?void 0:Ce.showOnlineStatus)!==!1;he&&Z.has(he)&&Me?Oe.add(he):he&&!Me&&Oe.delete(he);let Re=0;Z.forEach(c=>{Oe.has(c)&&Re++});const Le=Z.size||(a==null?void 0:a.membersCount)||((a==null?void 0:a.members)||[]).length||0;n.useEffect(()=>{h&&(a!=null&&a._id)&&f(h,a._id)},[h,a==null?void 0:a._id,f]),n.useEffect(()=>{var Se;if(!(a!=null&&a._id)||!((Se=a==null?void 0:a.channels)!=null&&Se.length))return;const c=a.channels.filter(re=>re.type==="voice"||re.type==="conference");if(c.length===0)return;let w=!0;const Ne=async()=>{try{const re=await Promise.all(c.map(async X=>{var ze,qe;const we=X._id||X.id;try{const ts=await pe.get(`/api/voice/rooms/${a._id}/${we}/participants?t=${Date.now()}`);return{channelId:String(we),count:((qe=(ze=ts.data)==null?void 0:ze.participants)==null?void 0:qe.length)||0}}catch{return{channelId:String(we),count:0}}}));w&&j(X=>{const we={...X};return re.forEach(ze=>{we[ze.channelId]=ze.count}),we})}catch{}};Ne();const Ue=setInterval(Ne,1e4);return()=>{w=!1,clearInterval(Ue)}},[a==null?void 0:a._id,a==null?void 0:a.channels]),n.useEffect(()=>{if(!s)return;const c=w=>{!w||!w.channelId||w.portalId&&String(w.portalId)!==String(a==null?void 0:a._id)||j(Ne=>({...Ne,[String(w.channelId)]:Number(w.count)||0}))};return s.on("voice:channel-count-update",c),()=>{s.off("voice:channel-count-update",c)}},[s,a==null?void 0:a._id]);const z=a!=null&&a.channels?[...a.channels].sort((c,w)=>(c.order||0)-(w.order||0)).map(c=>({id:c._id,name:c.name,type:c.type||"text",postCount:c.postCount})):[],te=z.find(c=>String(c.id)===String(h)),$e=(te==null?void 0:te.type)==="voice"||(te==null?void 0:te.type)==="conference";n.useEffect(()=>{!$e&&I&&D(!1)},[$e,I,D]);const ge=c=>String(h)===String(c),De=(a==null?void 0:a.coverImage)||(a==null?void 0:a.banner),ve=De?xe(De):null,Ge=ve?`url("${ve}")`:a&&!De?'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")':"none",[ce,je]=n.useState(!1),ke=n.useRef(null);return n.useEffect(()=>{if(!ve){je(!0),ke.current=null;return}if(ke.current===ve){je(!0);return}ke.current=ve;const c=new window.Image;c.src=ve,c.complete?je(!0):(je(!1),c.onload=()=>je(!0),c.onerror=()=>je(!0))},[ve]),a?e.jsxs("div",{className:`channel-sidebar ${I?"collapsed":""} ${x||""}`,style:{height:"calc(100% - 24px)",backgroundColor:"transparent",display:"flex",flexDirection:"column",flexShrink:0,overflow:"visible",position:"relative",borderRight:"none"},children:[!C&&$e&&e.jsx("button",{className:"sidebar-toggle-btn",onClick:c=>{c.stopPropagation(),D(!I)},title:I?"Menüyü Göster":"Menüyü Gizle",children:I?e.jsx(Ut,{size:16}):e.jsx(qt,{size:16})}),e.jsxs("div",{className:"sidebar-content-wrapper",style:{display:"flex",flexDirection:"column",flex:1,width:"100%",height:"100%",overflow:"hidden",transition:"opacity 0.2s ease, visibility 0.2s ease",opacity:I?0:1,visibility:I?"hidden":"visible",gap:"8px",padding:"0px",boxSizing:"border-box"},children:[e.jsxs("div",{className:"cs-panel cs-panel--banner",children:[e.jsxs("div",{className:"channel-banner-container",onClick:()=>Y&&Y(),children:[e.jsx("div",{className:"channel-banner-image",style:{backgroundImage:Ge,opacity:ce?1:0}}),e.jsx("div",{className:"channel-banner-overlay"})]}),e.jsxs("div",{className:"portal-quick-info",children:[e.jsxs("div",{className:"portal-info-main",onClick:()=>Y&&Y(),children:[e.jsxs("h2",{className:"portal-title-text",children:[e.jsx("span",{className:"portal-title-name",children:a.name}),e.jsx(Is,{portal:a,size:18})]}),e.jsxs("div",{className:"portal-stats-row",children:[e.jsxs("div",{className:`stat-item ${ee==="members"?"stat-tooltip-active":""}`,onClick:c=>Ae("members",c),title:"Üye",children:[e.jsx(Ft,{size:12}),e.jsx("span",{children:Le}),e.jsx("div",{className:"stat-floating-tag",children:"Üye"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${ee==="posts"?"stat-tooltip-active":""}`,onClick:c=>Ae("posts",c),title:"Gönderi",children:[e.jsx(Es,{size:12}),e.jsx("span",{children:a.postCount||0}),e.jsx("div",{className:"stat-floating-tag",children:"Gönderi"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${ee==="online"?"stat-tooltip-active":""}`,onClick:c=>Ae("online",c),title:"Çevrimiçi",children:[e.jsx("div",{className:"online-indicator-dot"}),e.jsx("span",{children:Re}),e.jsx("div",{className:"stat-floating-tag",children:"Çevrimiçi"})]})]})]}),e.jsxs("div",{className:"portal-header-actions",children:[(g||Q)&&e.jsx("button",{className:"portal-action-btn-circle",onClick:c=>{c.stopPropagation(),R&&R("notifications")},title:"Bildirim Ayarları",children:e.jsx(Kt,{size:16})}),g&&e.jsx("button",{className:"portal-action-btn-circle",onClick:c=>{c.stopPropagation(),G(!0)},title:"Davet Et",children:e.jsx(Ot,{size:18})})]})]})]}),e.jsxs("div",{className:"cs-panel cs-panel--channels custom-scrollbar",children:[e.jsxs("div",{className:"cs-channels-header",children:[e.jsx("span",{children:"Kanallar"}),Q&&e.jsx("div",{onClick:c=>{c.stopPropagation(),R&&R("channels")},className:"cs-add-channel-btn",title:"Kanal Oluştur",children:"+"})]}),e.jsx("div",{className:"cs-channel-list",children:z.map(c=>{var re;const w=ge(c.id),Ne=c.type==="announcement"||c.name.includes("announcements"),Ue=c.type==="voice"||c.type==="conference";let Se=q[String(c.id)]??0;return F&&String(F.channelId)===String(c.id)&&Array.isArray($)&&(Se=$.length),e.jsxs("div",{className:`channel-item ${w?"active":""}`,onClick:()=>J(c.id),style:{padding:"6px 8px",margin:"2px 0",borderRadius:"4px",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",color:w?"white":"#949ba4",backgroundColor:w?"#3f4147":"transparent",transition:"background-color 0.15s ease, color 0.15s ease"},children:[e.jsx("div",{style:{color:w?"white":"var(--text-secondary)",display:"flex",alignItems:"center",minWidth:"20px",justifyContent:"center"},children:c.type==="conference"?e.jsx(Gt,{size:20,strokeWidth:2}):c.type==="voice"?e.jsx(Wt,{size:20,strokeWidth:2}):Ne?e.jsx(Vt,{size:20,strokeWidth:2.5}):c.type==="image"?e.jsx(Yt,{size:20,strokeWidth:2.5,style:{color:"#f59e0b"}}):e.jsx(Ht,{size:20,strokeWidth:2.5})}),e.jsx("span",{style:{fontWeight:w?600:500,fontSize:"16px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:w?"white":"var(--text-primary)",maxWidth:"fit-content"},children:c.name}),Ue&&e.jsx("span",{className:`vc-channel-active-badge ${Se>0?"online":"idle"}`,children:Se>0?`${Se} aktif`:"aktif yok"}),!w&&((re=r[c.id])==null?void 0:re.length)>0&&e.jsx("div",{style:{backgroundColor:"#f23f43",color:"white",fontSize:"11px",fontWeight:"bold",padding:"0 6px",borderRadius:"8px",minWidth:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.3)",marginLeft:"-4px",flexShrink:0},children:r[c.id].length>9?"9+":r[c.id].length}),e.jsx("div",{style:{flex:1}}),w&&Ue&&F&&String(F.channelId)===String(c.id)&&S&&e.jsx("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:e.jsx(ua,{startedAt:S,className:"vc-sidebar-timer"})})]},c.id)})})]}),e.jsxs("div",{className:"cs-panel cs-panel--userbar",children:[e.jsx(ca,{currentChannelId:h}),e.jsx("div",{className:"cs-footer-copyright",children:"© 2026 Oxypace. Tüm hakları saklıdır."})]})]}),e.jsx("style",{children:`
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
            `}),v&&e.jsx(pa,{portalId:a._id,onClose:()=>G(!1)})]}):null},xa=({members:a=[],onClose:g})=>{var I,D;const{onlineUsers:R}=Ts(),{user:h}=bs(),[,J]=n.useState(0);n.useEffect(()=>{const r=setInterval(()=>{J(f=>f+1)},6e4);return()=>clearInterval(r)},[]);const x=r=>{if(!r)return"";const f=new Date,S=new Date(r),F=Math.max(0,f-S),$=Math.floor(F/6e4);if($<1)return"şimdi";if($<60)return`${$}dk`;const s=Math.floor($/60);if(s<24)return`${s}sa`;const A=Math.floor(s/24);if(A<30)return`${A}g`;const q=Math.floor(A/30);return q<12?`${q}ay`:`${Math.floor(q/12)}y`},Q=r=>{if(!r)return null;if(typeof r=="string")return r;const f=r._id||r.id;return f?String(f):null},Y=new Set((R||[]).map(r=>String(r))),y=h!=null&&h._id?String(h._id):null,v=((D=(I=h==null?void 0:h.settings)==null?void 0:I.privacy)==null?void 0:D.showOnlineStatus)!==!1;y&&v?Y.add(y):y&&!v&&Y.delete(y);const G=r=>(r==null?void 0:r.role)==="owner"?3:(r==null?void 0:r.role)==="admin"||r!=null&&r.isAdmin?2:1,P=a.filter(r=>{if(!r)return!1;const f=Q(r);return f&&Y.has(f)}).sort((r,f)=>{var s,A;const S=G(f)-G(r);if(S!==0)return S;const F=((s=r.profile)==null?void 0:s.displayName)||r.username||"",$=((A=f.profile)==null?void 0:A.displayName)||f.username||"";return F.localeCompare($)}),C=a.filter(r=>{if(!r)return!1;const f=Q(r);return f&&!Y.has(f)}).sort((r,f)=>{var s,A;const S=G(f)-G(r);if(S!==0)return S;const F=((s=r.profile)==null?void 0:s.displayName)||r.username||"",$=((A=f.profile)==null?void 0:A.displayName)||f.username||"";return F.localeCompare($)});return e.jsxs("div",{className:"members-sidebar custom-scrollbar",children:[e.jsxs("div",{className:"members-header-top",children:[e.jsx("h3",{children:"ÜYELER"}),g&&e.jsx("button",{onClick:g,className:"close-members-btn","aria-label":"Kapat",children:e.jsx(ss,{size:20,strokeWidth:2})})]}),e.jsxs("div",{className:"members-category",children:["Çevrim içi — ",P.length]}),P.map((r,f)=>{var q,j,ee,ne;if(!r||typeof r=="string")return null;const S=r.username||"Unknown",F=((q=r.profile)==null?void 0:q.avatar)||r.avatar,$=((j=r.profile)==null?void 0:j.displayName)||S,s=r.role==="owner",A=r.role==="admin"||r.isAdmin;return e.jsxs(Xs,{to:`/profile/${S}`,className:"member-item member-link",children:[e.jsxs("div",{className:"member-avatar-wrapper",children:[F?e.jsx("img",{src:xe(F,"thumbnail"),alt:"",className:"member-avatar",loading:"eager",decoding:"async"}):e.jsx("div",{className:"member-avatar-placeholder",children:((ee=$[0])==null?void 0:ee.toUpperCase())||((ne=S[0])==null?void 0:ne.toUpperCase())||"?"}),e.jsx("div",{className:"status-indicator online"})]}),e.jsxs("div",{className:"member-info",style:{display:"flex",alignItems:"center",gap:"6px"},children:[e.jsxs("span",{className:"member-name active-role",style:{color:s?"#f1c40f":A?"#3498db":"#2ecc71"},children:[$,s&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!s&&A&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"})]}),e.jsx(it,{user:r,size:13})]})]},r._id||r.id||f)}),e.jsxs("div",{className:"members-category",children:["Çevrim dışı — ",C.length]}),C.map((r,f)=>{var q,j,ee,ne;if(!r||typeof r=="string")return null;const S=r.username||"Unknown",F=((q=r.profile)==null?void 0:q.avatar)||r.avatar,$=((j=r.profile)==null?void 0:j.displayName)||S,s=r.role==="owner",A=r.role==="admin"||r.isAdmin;return e.jsxs(Xs,{to:`/profile/${S}`,className:"member-item offline member-link",children:[e.jsx("div",{className:"member-avatar-wrapper",children:F?e.jsx("img",{src:xe(F,"thumbnail"),alt:"",className:"member-avatar",loading:"eager",decoding:"async"}):e.jsx("div",{className:"member-avatar-placeholder",style:{backgroundColor:"var(--bg-secondary)"},children:((ee=$[0])==null?void 0:ee.toUpperCase())||((ne=S[0])==null?void 0:ne.toUpperCase())||"?"})}),e.jsx("div",{className:"member-info",style:{flex:1},children:e.jsxs("div",{className:"member-name-row",style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("span",{className:"member-name",style:{display:"flex",alignItems:"center",gap:"4px"},children:[$,s&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!s&&A&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"}),e.jsx(it,{user:r,size:13})]}),r.lastActive&&e.jsx("span",{className:"last-active-time",style:{fontSize:"11px",color:"var(--text-muted)"},children:x(r.lastActive)})]})})]},r._id||r.id||`offline-${f}`)}),e.jsx("style",{children:`
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
            `})]})},ga=()=>{var I,D;const{user:a,updateUser:g}=bs(),R=As(),[h,J]=n.useState(null),[x,Q]=n.useState([]),[Y,y]=n.useState(!0),[v,G]=n.useState(null);n.useEffect(()=>{let r=!0;return(async()=>{try{const S=await pe.get("/api/portals/showcase");r&&S.data&&(J(S.data.globalPortal||null),Q(Array.isArray(S.data.topPortals)?S.data.topPortals:[]))}catch{}finally{r&&y(!1)}})(),()=>{r=!1}},[]);const P=async(r,f)=>{var S,F,$;if(r.stopPropagation(),!a){R("/login");return}if(f.isMember){R(`/portal/${f._id}`);return}if(!(f.isRequested||v===f._id)){G(f._id);try{const A=((S=(await pe.post(`/api/portals/${f._id}/join`)).data)==null?void 0:S.status)==="requested",q=j=>!j||j._id!==f._id?j:{...j,isMember:!A,isRequested:A,memberCount:A?j.memberCount:(j.memberCount||0)+1};if((h==null?void 0:h._id)===f._id&&J(q(h)),Q(j=>j.map(q)),!A&&a&&g){const j=a.joinedPortals||[];j.some(ee=>(ee._id||ee).toString()===f._id.toString())||g({joinedPortals:[...j,f],portals:[...a.portals||[],f]})}}catch(s){alert((($=(F=s.response)==null?void 0:F.data)==null?void 0:$.message)||"İşlem gerçekleştirilemedi.")}finally{G(null)}}},C=r=>r!=null&&r.banner?`url(${xe(r.banner)}) center/cover no-repeat`:"#141414";return e.jsxs("div",{className:"tanitim-showcase-wrapper",children:[e.jsxs("section",{className:"tanitim-guide-card",children:[e.jsxs("div",{className:"tanitim-guide-header",children:[e.jsxs("div",{className:"tanitim-guide-tag",children:[e.jsx(Jt,{size:13}),e.jsx("span",{children:"SİSTEM DİREKTİFİ // RESMİ PLATFORM REHBERİ"})]}),e.jsx("h1",{className:"tanitim-guide-title",children:"Oxypace İletişim Protokolü & Kullanım Mimarisi"}),e.jsx("p",{className:"tanitim-guide-lead",children:"Özgür, sansürsüz, yüksek performanslı ve gizlilik odaklı yeni nesil topluluk ekosistemi. Arayüz haritasını ve platformun tüm gelişmiş yeteneklerini aşağıdaki yönergelerden inceleyin."})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// NAVİGASYON VE MENÜ YERLEŞİMİ"}),e.jsx("h2",{className:"sub-section-title",children:"Sayfa Yapısı & Arayüz Konumlandırması"})]}),e.jsxs("div",{className:"tanitim-nav-map-grid",children:[e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(Zt,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ SOL NAVİGASYON BARI ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Ana Gezinme Çubuğu"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Doğrudan Mesajlar (DM):"})," Birebir şifreli özel yazışmalar ve anlık bildirim kutusu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portallar Listesi:"})," Üye olduğunuz veya yönettiğiniz tüm portalların dikey simgeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Keşfet Pusulası:"})," Yeni toplulukları, popüler portalları ve kişileri arama alanı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Oluştur (+):"})," Saniyeler içinde kendi özgür topluluğunuzu kurma aracı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kimlik & Hızlı Ayar:"})," En altta mikrofon, kulaklık ve profil hızlı kontrolleri."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(Qt,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ PORTAL İÇİ MENÜ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Kanal Hiyerarşisi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Kimliği:"})," Özel afiş, doğrulanmış rozet ve çevrimiçi üye göstergeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Metin Kanalları (#):"})," Tematik konulara göre ayrılmış gönderi ve tartışma akışları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Ses Kanalları (🎙️):"})," Tek dokunuşla girilebilen, gecikmesiz canlı ses odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Sahne Kanalları (🎤):"})," Seminer, podcast ve etkinlikler için konuşmacı odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Yönetimi:"})," Yöneticiler için yeni kanallar açma ve gizlilik kilidi."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(at,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ ÜST DENETİM & AKIŞ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"İçerik & Üye Denetimi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Üst Başlığı:"})," Aktif kanal adı, açıklaması ve hızlı üye paneli butonu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Üye Listesi Paneli:"})," Sağ tarafta çevrimiçi yöneticiler ve aktif üyeler."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Görsel Akış Alanı:"})," 4K videolar, çoklu galeriler ve doküman önizlemeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Bildirim Zil İkonu:"})," Kanal ve portal bazlı bildirim filtreleme ayarları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Ayarları:"})," Portal sahibi ve yöneticileri için tam yönetim konsolu."]})]})]})]})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// GELİŞMİŞ SİSTEM DİREKLERİ"}),e.jsx("h2",{className:"sub-section-title",children:"Platform Mekanizmaları & Özellikler"})]}),e.jsxs("div",{className:"tanitim-pillars-grid",children:[e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"01"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Es,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Gelişmiş Mesaj Mekanizması"}),e.jsx("p",{className:"pillar-text",children:"Markdown formatlama, tek tıkla alıntılı yanıtlama (quote reply), kullanıcıyı doğrudan haberdar eden @etiketleme sistemi ve akıllı bağlantı (link preview) ayrıştırma desteği."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Alıntılı Yanıt"}),e.jsx("span",{className:"pillar-tag",children:"@Bahsetmeler"}),e.jsx("span",{className:"pillar-tag",children:"Mesaj Sabitleme"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"02"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Xt,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Canlı Ses Odaları & Sahne Modu"}),e.jsx("p",{className:"pillar-text",children:"Ultra düşük gecikmeli WebRTC ses mimarisi. Herkesin serbestçe katılabildiği sohbet odaları ile seminer ve konferanslar için konuşmacı-dinleyici ayrımı ve el kaldırma desteği sunan Sahne kanalları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Gecikme"}),e.jsx("span",{className:"pillar-tag",children:"Sahne Hiyerarşisi"}),e.jsx("span",{className:"pillar-tag",children:"Arka Planda Ses"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"03"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(ea,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Mobil Ekosistem & PIP Video"}),e.jsx("p",{className:"pillar-text",children:"Yerel Android APK ve tam uyumlu PWA deneyimi. Canlı FCM Push bildirimleri, mobil veri tasarrufu modu ve gezinirken köşede kesintisiz oynayan Kayan Resim İçinde Resim (PIP) video motoru."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Android APK / PWA"}),e.jsx("span",{className:"pillar-tag",children:"Canlı PIP Oynatıcı"}),e.jsx("span",{className:"pillar-tag",children:"FCM Push Bildirim"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"04"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(sa,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Ultra-HD Medya & Transcoding"}),e.jsx("p",{className:"pillar-text",children:"İstemci içi WASM motoru ile 360p'den 4K'ya kadar otomatik optimize edilen video akışı. Tek gönderide 10 adede kadar yüksek kaliteli fotoğraf galerisi ve tek tıkla önizlenebilir PDF dokümanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"4K Video Transcoding"}),e.jsx("span",{className:"pillar-tag",children:"10'lu Görsel Galerisi"}),e.jsx("span",{className:"pillar-tag",children:"PDF Doküman Desteği"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"05"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(at,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Özelleştirilebilir Sistemler & Temalar"}),e.jsx("p",{className:"pillar-text",children:"Saf OLED siyahı ve yüksek kontrastlı Aydınlık tema desteği. Kişisel profil afişi, biyografi ve avatar özelleştirmeleri. Portallar için özel roller, izin matrisleri ve gizlilik kalkanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"OLED Siyah & Açık Tema"}),e.jsx("span",{className:"pillar-tag",children:"Rol & Yetki Matrisi"}),e.jsx("span",{className:"pillar-tag",children:"Özel Profil Afişi"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"06"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(ta,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Kripto-Güvenlik & Sıfır Takip"}),e.jsx("p",{className:"pillar-text",children:"Sıfır veri madenciliği ve ticari profil koruması. IP ve aktif cihaz oturum denetimi, güvenlik anahtarları ile hesap kurtarma ve doğrulanmış resmi topluluk rozetleri."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Veri İzleme"}),e.jsx("span",{className:"pillar-tag",children:"Cihaz & Oturum Denetimi"}),e.jsx("span",{className:"pillar-tag",children:"Onay Rozetleri"})]})]})]})]})]}),h&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ MERKEZ TOPLULUK // 01 ]"}),e.jsx("span",{className:"section-badge",children:"EN POPÜLER PORTAL"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Oxypace Global"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"Platformun en geniş üye kitlesine sahip resmi ana iletişim merkezi."})]}),e.jsxs("div",{className:"oxypace-global-hero-card",onClick:()=>R(`/portal/${h._id}`),children:[e.jsxs("div",{className:"hero-card-banner",style:{background:C(h)},children:[e.jsx("div",{className:"hero-banner-overlay"}),e.jsx("div",{className:"hero-banner-badge",children:e.jsx("span",{children:"ANA TOPLULUK"})})]}),e.jsxs("div",{className:"hero-card-body",children:[e.jsxs("div",{className:"hero-header-row",children:[e.jsx("div",{className:"hero-avatar-box",children:h.avatar?e.jsx("img",{src:xe(h.avatar),alt:h.name,className:"hero-avatar-img"}):e.jsx("div",{className:"hero-avatar-fallback",children:((D=(I=h.name)==null?void 0:I.substring(0,2))==null?void 0:D.toUpperCase())||"OG"})}),e.jsxs("div",{className:"hero-identity-col",children:[e.jsxs("div",{className:"hero-name-row",children:[e.jsx("h3",{className:"hero-portal-name",children:h.name}),e.jsx(Is,{portal:h,size:18}),e.jsx("span",{className:"hero-privacy-tag",children:h.privacy==="private"?e.jsxs(e.Fragment,{children:[e.jsx(aa,{size:11})," GİZLİ"]}):e.jsxs(e.Fragment,{children:[e.jsx(ia,{size:11})," HERKESE AÇIK"]})})]}),e.jsx("div",{className:"hero-meta-row",children:e.jsxs("div",{className:"hero-member-stat",children:[e.jsx(Ps,{size:14}),e.jsxs("span",{children:[(h.memberCount||0).toLocaleString("tr-TR")," Üye"]})]})})]}),e.jsx("div",{className:"hero-action-col",children:e.jsx("button",{type:"button",className:`tanitim-sharp-btn hero-btn ${h.isMember?"btn-joined":h.isRequested?"btn-requested":"btn-action"}`,onClick:r=>P(r,h),disabled:v===h._id||h.isRequested,children:v===h._id?"İŞLENİYOR...":h.isMember?e.jsxs(e.Fragment,{children:[e.jsx(na,{size:14}),"ÜYESİNİZ"]}):h.isRequested?e.jsxs(e.Fragment,{children:[e.jsx(ot,{size:14}),"İSTEK GÖNDERİLDİ"]}):h.privacy==="private"?"ÜYELİK İSTEĞİ GÖNDER":"PORTALA KATIL"})})]}),e.jsx("p",{className:"hero-description",children:h.description||"Oxypace platformunun ana buluşma noktası. Güncel duyurular, teknik tartışmalar ve küresel topluluk etkileşimi."})]})]})]}),x.length>0&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ AKTİF TOPLULUKLAR // 02 ]"}),e.jsx("span",{className:"section-badge",children:"ÖNE ÇIKAN PORTALLAR"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Popüler Topluluklar"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"En çok paylaşıma ve aktif etkileşime sahip seçkin portallar."})]}),e.jsx("div",{className:"tanitim-portals-row",children:x.map(r=>{var f,S;return e.jsxs("div",{className:"tanitim-classic-card",onClick:()=>R(`/portal/${r._id}`),children:[e.jsx("div",{className:"classic-card-banner",style:{background:C(r)},children:e.jsx("div",{className:"classic-banner-overlay"})}),e.jsx("div",{className:"classic-card-icon-wrapper",children:r.avatar?e.jsx("img",{src:xe(r.avatar),alt:r.name,className:"classic-card-icon-img",loading:"lazy"}):e.jsx("div",{className:"classic-card-icon-placeholder",children:((S=(f=r.name)==null?void 0:f.substring(0,2))==null?void 0:S.toUpperCase())||"P"})}),e.jsxs("div",{className:"classic-card-body",children:[e.jsxs("div",{className:"classic-card-title-row",children:[e.jsx("h4",{className:"classic-card-title",children:r.name}),e.jsx(Is,{portal:r,size:16})]}),e.jsx("p",{className:"classic-card-desc",children:r.description||"Bu topluluk hakkında henüz bir açıklama girilmemiş."}),e.jsxs("div",{className:"classic-card-footer",children:[e.jsxs("div",{className:"classic-member-count",children:[e.jsx(Ps,{size:12}),e.jsxs("span",{children:[r.memberCount||0," Üye"]})]}),e.jsx("button",{type:"button",className:`tanitim-sharp-btn small-btn ${r.isMember?"btn-joined":r.isRequested?"btn-requested":"btn-action"}`,onClick:F=>P(F,r),disabled:v===r._id||r.isRequested,children:v===r._id?"...":r.isMember?"ÜYESİNİZ":r.isRequested?"İSTEK":r.privacy==="private"?"İSTEK AT":"KATIL"})]})]})]},r._id)})})]})]})},fa=({alerts:a=[]})=>{const[g,R]=n.useState(()=>{try{const y=sessionStorage.getItem("dismissed_portal_alerts");return y?JSON.parse(y):[]}catch{return[]}}),[h,J]=n.useState(null),x=a.filter(y=>!g.includes(y._id)),Q=y=>{J(y),setTimeout(()=>{const v=[...g,y];R(v);try{sessionStorage.setItem("dismissed_portal_alerts",JSON.stringify(v))}catch{}J(null)},300)},Y=y=>{const v=new Date,P=new Date(y)-v;if(P<=0)return null;const C=Math.floor(P/(1e3*60*60*24)),I=Math.floor(P/(1e3*60*60)%24),D=Math.floor(P/(1e3*60)%60);return C>0?`${C} gün ${I} saat kaldı`:I>0?`${I} saat ${D} dk kaldı`:`${D} dakika kaldı`};return x.length===0?null:e.jsx(e.Fragment,{children:x.map(y=>e.jsx("div",{className:`portal-alert-banner ${h===y._id?"dismissing":""}`,children:e.jsxs("div",{className:"alert-banner-inner",children:[e.jsx("div",{className:"alert-banner-icon",children:e.jsx(ra,{size:18,strokeWidth:2})}),e.jsxs("div",{className:"alert-banner-content",children:[e.jsx("div",{className:"alert-banner-label",children:e.jsx("span",{children:"Yönetici Uyarısı"})}),e.jsx("div",{className:"alert-banner-message",children:y.message}),e.jsx("div",{className:"alert-banner-meta",children:e.jsxs("span",{className:"alert-banner-time",children:[e.jsx(ot,{size:16,strokeWidth:2}),Y(y.expiresAt)||"Süresi dolmak üzere"]})})]}),e.jsx("button",{className:"alert-banner-close",onClick:()=>Q(y._id),title:"Uyarıyı gizle",children:e.jsx(ss,{size:16,strokeWidth:2.5})})]})},y._id))})},ba=n.lazy(()=>fs(()=>import("./PortalSettingsModal-C2kwcEiG.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13]))),ya=n.lazy(()=>fs(()=>import("./PortalNotifications-DfplPN_1.js"),__vite__mapDeps([14,1,2,3,4,5,6,15]))),va=n.lazy(()=>fs(()=>import("./VoiceChannel-QA9XOJhB.js"),__vite__mapDeps([16,1,4,2,3,5,6,17,18]))),ja=n.lazy(()=>fs(()=>import("./ConferenceChannel-BUBrWUR3.js"),__vite__mapDeps([19,1,4,2,3,5,6,17,18]))),Va=()=>{var Ys,Hs,Js,Zs,Qs;const{id:a}=It(),g=At(),[R]=Tt(),h=R.get("channel"),J=R.get("post"),{user:x,token:Q,updateUser:Y,loading:y}=bs(),{socket:v,connected:G}=Ts(),P=As(),C=lt(),{isSidebarOpen:I,closeSidebar:D,isMobileView:r,mobileChannelOpen:f,setMobileChannelOpen:S}=C||{},F=(C==null?void 0:C.isDesktopSidebarCollapsed)||!1,$=typeof window<"u"&&!!localStorage.getItem("admin_backup_token"),[s,A]=n.useState(()=>{var t;try{const i=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(i){const l=JSON.parse(i);if(Array.isArray(l==null?void 0:l.channels)&&l.channels.length>0)return l}}catch{}return(t=g==null?void 0:g.state)!=null&&t.portal&&(String(g.state.portal._id)===String(a)||String(g.state.portal.id)===String(a))&&Array.isArray(g.state.portal.channels)&&g.state.portal.channels.length>0?g.state.portal:null});n.useEffect(()=>{var t;(t=g==null?void 0:g.state)!=null&&t.portal&&(String(g.state.portal._id)===String(a)||String(g.state.portal.id)===String(a))&&A(i=>Array.isArray(g.state.portal.channels)&&g.state.portal.channels.length>0?g.state.portal:i&&Array.isArray(i.channels)&&i.channels.length>0?{...g.state.portal,channels:i.channels,roles:i.roles||g.state.portal.roles,members:i.members||g.state.portal.members}:i||null)},[a,g.state]);const q=gs(t=>t.posts),j=gs(t=>t.setPosts),[ee,ne]=n.useState(()=>{var t;try{const i=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(i){const l=JSON.parse(i);if(Array.isArray(l==null?void 0:l.channels)&&l.channels.length>0)return!1}}catch{}return!((t=g==null?void 0:g.state)!=null&&t.portal&&(String(g.state.portal._id)===String(a)||String(g.state.portal.id)===String(a))&&Array.isArray(g.state.portal.channels)&&g.state.portal.channels.length>0)}),[ye,Ae]=n.useState(!1),[ue,Z]=n.useState(""),[se,Oe]=n.useState(null),[he,Me]=n.useState(null),[Re,Le]=n.useState(!1),[z,te]=n.useState(null),[$e,ge]=n.useState({}),[De,ve]=n.useState(!1),[fe,Ge]=n.useState(""),[ce,je]=n.useState([]);n.useRef(null);const[ke,Be]=n.useState(!1),[Ce,c]=n.useState(!1),[w,Ne]=n.useState({show:!1,message:"",type:"info"}),[Ue,Se]=n.useState(!1),[re,X]=n.useState(!1),[we,ze]=n.useState({top:0,left:0}),[qe,ts]=n.useState(""),[Ms,as]=n.useState(!1),We=n.useRef(null),Rs=n.useRef(null),Ls=n.useRef(null),$s=n.useRef(null),[B,Fe]=n.useState(null),[Pe,Ve]=n.useState([]),[Te,Ye]=n.useState([]),[W,is]=n.useState(null),[ct,He]=n.useState(0),[Ds,ys]=n.useState(!1),ns=n.useRef(!1);$t();const _e=et(t=>t.activeUploads)[`portal-${a}`];n.useEffect(()=>{_e&&_e.status==="uploading"&&j(t=>t.map(i=>i.isOptimistic&&i.mediaType==="video"?{...i,uploadProgress:_e.progress}:i))},[_e==null?void 0:_e.progress,_e==null?void 0:_e.status]);const[dt,rs]=n.useState(!1),ls=!!(s!=null&&s.name&&/Oxypace Tan[ıi]t[ıi]m/i.test(s.name)),mt=!!(x&&(((Ys=x.username)==null?void 0:Ys.toLowerCase())==="oxypace"||x.isAdmin)),pt=ls?mt:x&&Re,ut=n.useRef(null),Je=n.useRef(null),ht=n.useCallback(t=>{t.preventDefault(),t.stopPropagation(),X(i=>{if(!i&&Je.current){const l=Je.current.getBoundingClientRect();ze({top:l.bottom+8,left:l.left})}return!i})},[]);n.useEffect(()=>{if(!re)return;let t=!0;const i=()=>{if(Je.current){const k=Je.current.getBoundingClientRect();ze({top:k.bottom+8,left:k.left})}},l=k=>{if(!t)return;const o=k.target.closest(".plus-menu")||k.target.closest(".portal-plus-menu-portal"),p=k.target.closest(".upload-btn");!o&&!p&&X(!1)},d=setTimeout(()=>{t&&(document.addEventListener("click",l),document.addEventListener("touchstart",l))},0);return window.addEventListener("scroll",i,!0),window.addEventListener("resize",i),()=>{t=!1,clearTimeout(d),document.removeEventListener("click",l),document.removeEventListener("touchstart",l),window.removeEventListener("scroll",i,!0),window.removeEventListener("resize",i)}},[re]),n.useEffect(()=>()=>{X(!1)},[]),n.useEffect(()=>{X(!1)},[z,a]),n.useEffect(()=>{var t;(t=g.state)!=null&&t.quotedPost&&(is(g.state.quotedPost),g.state.selectedChannelId&&te(g.state.selectedChannelId),P(g.pathname+g.search,{replace:!0,state:{}}))},[g.state,a]);const K=(Hs=s==null?void 0:s.channels)==null?void 0:Hs.find(t=>String(t._id)===String(z)),os=(K==null?void 0:K.type)==="image",Bs=(K==null?void 0:K.type)==="voice"||(K==null?void 0:K.type)==="conference",Us=Bs&&(!r||f);n.useEffect(()=>{s!=null&&s.channels&&Array.isArray(s.channels)&&ge(t=>{const i={...t};return s.channels.forEach(l=>{const d=String(l._id);l.postCount!==void 0&&(i[d]=l.postCount)}),i})},[s==null?void 0:s.channels]),n.useEffect(()=>{if(!v||!G||!a)return;v.emit("join_portal",a),v.emit("get_online_users"),z&&v.emit("join_channel",z);const t=o=>{var E,L,_,O,le;const p=((E=o.portal)==null?void 0:E._id)||o.portal,m=((L=o.channel)==null?void 0:L._id)||o.channel,b=String(p)===String(a),T=((_=s==null?void 0:s.channels)==null?void 0:_.length)===1,N=String(m)===String(z)||String(m||"general")===String(z||"general")||T||K&&(String(m)===String(K.name)||String(m)===String(K._id));if(b&&N){const Ke=((O=o.author)==null?void 0:O._id)||((le=o.author)==null?void 0:le.id)||o.author;if(String(Ke)!==String(x==null?void 0:x._id)){const V=String(z);ge(oe=>({...oe,[V]:(oe[V]!==void 0?oe[V]:(K==null?void 0:K.postCount)||0)+1}))}j(V=>{if(V.some(de=>de._id===o._id))return V;const oe=o.quotedPost&&(typeof o.quotedPost=="string"?o.quotedPost:o.quotedPost._id);if(oe){const de=V.find(u=>u._id===oe);de&&typeof de=="object"&&de.author?o.quotedPost=de:W&&oe===W._id&&(o.quotedPost=W)}return[o,...V]})}},i=o=>{var b;const p=((b=o.portal)==null?void 0:b._id)||o.portal;(!p||String(p)===String(a))&&j(T=>T.map(N=>String(N._id)===String(o._id)?o:N))},l=({postId:o,portalId:p})=>{(!p||String(p)===String(a))&&o&&j(m=>m.filter(b=>String(b._id)!==String(o)))},d=({userId:o,status:p,lastActive:m})=>{p==="offline"&&je(b=>b.filter(T=>String(T.userId)!==String(o))),A(b=>{if(!b)return b;const T=m||new Date;let N=b.owner;if(b.owner){const _=b.owner._id||b.owner.id||b.owner;String(_)===String(o)&&typeof b.owner=="object"&&(N={...b.owner,lastActive:T})}let E=b.admins;Array.isArray(b.admins)&&(E=b.admins.map(_=>{const O=_._id||_.id||_;return String(O)===String(o)&&typeof _=="object"&&_!==null?{..._,lastActive:T}:_}));let L=b.members;return Array.isArray(b.members)&&(L=b.members.map(_=>{const O=_._id||_.id||_;return String(O)===String(o)&&typeof _=="object"&&_!==null?{..._,lastActive:T}:_})),{...b,owner:N,admins:E,members:L}})},k=({userId:o,username:p,displayName:m,avatar:b,isTyping:T})=>{String(o)!==String(x==null?void 0:x._id)&&je(N=>T?N.some(E=>String(E.userId)===String(o))?N:[...N,{userId:o,username:p,displayName:m,avatar:b}]:N.filter(E=>String(E.userId)!==String(o)))};return v.on("post:created",t),v.on("post:updated",i),v.on("post:deleted",l),v.on("user_status_change",d),v.on("portal_typing_update",k),()=>{v.off("post:created",t),v.off("post:updated",i),v.off("post:deleted",l),v.off("user_status_change",d),v.off("portal_typing_update",k)}},[v,G,a,z,x==null?void 0:x._id]);const xt=t=>{if(!t)return null;const i=/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,l=t.match(i);return l&&l[2].length===11?l[2]:null},gt=t=>{const i=t.target.value;ts(i)},qs=()=>{const t=xt(qe);if(!t){ae("Geçersiz YouTube URL'si","error");return}Fe({name:"YouTube Video",type:"youtube",preview:`https://img.youtube.com/vi/${t}/hqdefault.jpg`,url:qe}),as(!1),ts("")},[ft,cs]=n.useState(!1),[bt,yt]=n.useState(0),vs=n.useRef(null),js=n.useRef(null),Ze=n.useRef(null),vt=n.useCallback(t=>{const i=t.target;js.current||(js.current=requestAnimationFrame(()=>{js.current=null;const l=i.scrollTop,d=l>300;cs(o=>o!==d?d:o);const k=i.scrollHeight-i.clientHeight;if(k>0){const o=Math.round(l/k*100);yt(p=>Math.abs(p-o)>=2?o:p)}}))},[]),ks=n.useCallback(t=>{t&&(t.preventDefault(),t.stopPropagation()),Ze.current&&cancelAnimationFrame(Ze.current);const i=vs.current||document.querySelector(".discord-feed")||document.querySelector(".portal-feed-container");if(!i){window.scrollTo({top:0,behavior:"smooth"});return}const l=i.scrollTop;if(l<=0)return;const d=800,k=performance.now(),o=m=>1-Math.pow(1-m,5),p=m=>{const b=m-k,T=Math.min(b/d,1),N=o(T);i.scrollTop=Math.round(l*(1-N)),T<1?Ze.current=requestAnimationFrame(p):(i.scrollTop=0,Ze.current=null)};Ze.current=requestAnimationFrame(p)},[]);n.useEffect(()=>{const t=()=>{ks(),(!s||!Array.isArray(s.channels)||s.channels.length===0)&&ps()};return window.addEventListener("oxypace:scroll_portal_top",t),()=>window.removeEventListener("oxypace:scroll_portal_top",t)},[ks,s==null?void 0:s._id,(Js=s==null?void 0:s.channels)==null?void 0:Js.length]);const jt=t=>{te(t),cs(!1),r&&(D(),S(!0))},ae=n.useCallback((t,i="info")=>{Ne({show:!0,message:t,type:i}),setTimeout(()=>Ne(l=>({...l,show:!1})),4e3)},[]),kt=t=>{const i=Array.from(t.target.files||[]);if(i.length===0)return;Fe(null),ns.current=!1;const d=10-Pe.length;if(d<=0){ae("Bir gönderiye en fazla 10 görsel ekleyebilirsiniz.","warning");return}const k=i.slice(0,d);i.length>d&&ae(`En fazla 10 görsel ekleyebilirsiniz. İlk ${d} görsel eklendi.`,"warning");const o=[],p=[];for(const m of k){if(m.size>2*1024*1024*1024){ae(`${m.name} boyutu 2 GB'dan büyük olamaz.`,"error");continue}o.push(m),p.push({url:URL.createObjectURL(m),name:m.name,size:m.size,file:m})}Ve(m=>[...m,...o]),Ye(m=>[...m,...p]),X(!1),We.current&&(We.current.value="")},Nt=t=>{Ve(i=>i.filter((l,d)=>d!==t)),Ye(i=>{const l=i[t];if(l&&l.url&&l.url.startsWith("blob:"))try{URL.revokeObjectURL(l.url)}catch{}return i.filter((d,k)=>k!==t)})},Ns=t=>{const i=t.target.files[0];if(i){if(i.size>2*1024*1024*1024){ae("Dosya boyutu 2 GB'dan büyük olamaz.","error");return}Ve([]),Ye([]),Fe(i),ns.current=i.type.startsWith("video/")||["mp4","webm","ogg","mov","m4v"].includes(i.name.split(".").pop().toLowerCase()),X(!1)}};n.useEffect(()=>{$||!v||!a||(fe.trim().length>0||B!==null||Pe.length>0?ke||(Be(!0),v.emit("portal_typing",{portalId:a,isTyping:!0})):ke&&(v.emit("portal_typing",{portalId:a,isTyping:!1}),Be(!1)))},[fe,B,Pe,a,v,ke,$]),n.useEffect(()=>()=>{!$&&v&&a&&ke&&v.emit("portal_typing",{portalId:a,isTyping:!1})},[a,v,ke,$]);const Fs=async()=>{var N,E;if($){ae("Hayalet Modu: Salt okunur izleme modundasınız. Gönderi paylaşılamaz.","error");return}const t=fe.trim().length>0,i=!!B,l=Pe.length>0;if(!t&&!i&&!l)return;v&&a&&v.emit("portal_typing",{portalId:a,isTyping:!1}),Be(!1);const d={content:fe,media:B,mediaFiles:[...Pe],mediaPreviews:[...Te]},k=B&&B.type==="youtube",o=`temp-${Date.now()}`;let p=null,m=null;k?(p=B.url,m="youtube"):l?(p=Te.map(L=>L.url),m="image"):B&&(p=URL.createObjectURL(B),m=B.type.startsWith("video")?"video":B.type.includes("gif")?"gif":"image");const b=m==="video",T={_id:o,content:fe,media:p,mediaType:m||"none",author:x,createdAt:new Date().toISOString(),likes:[],likeCount:0,isOptimistic:!0,quotedPost:W,isProcessing:!!b,processingProgress:0,estimatedTime:b?"Hesaplanıyor...":""};if(j(L=>[T,...L]),z){const L=String(z);ge(_=>({..._,[L]:(_[L]!==void 0?_[L]:(K==null?void 0:K.postCount)||0)+1}))}Ge(""),Fe(null),Ve([]),Ye([]),X(!1),ys(!0),He(0);try{let L=null,_=null,O=null,le=null,Ke=null;if(k)O=d.media.url,le="youtube";else if(d.mediaFiles&&d.mediaFiles.length>0){const u=d.mediaFiles.length,M=new Array(u).fill(0),H=d.mediaFiles.map((U,ie)=>tt(U,"post",a,Xe=>{M[ie]=Xe;const me=Math.round(M.reduce((be,Ie)=>be+Ie,0)/u);He(me),j(be=>be.map(Ie=>String(Ie._id)===String(o)?{...Ie,uploadProgress:me}:Ie))}));_=await Promise.all(H)}else if(d.media)if(ns.current){et.getState().startVideoUpload({file:d.media,portalId:a,channel:z,content:d.content,quotedPostId:W==null?void 0:W._id,onFinish:(u,M)=>{if(u){if(j(H=>H.filter(U=>String(U._id)!==String(o))),z){const H=String(z);ge(U=>({...U,[H]:Math.max(0,(U[H]||1)-1)}))}ae("Video yükleme başarısız oldu.","error")}else if(M){const H=String(o);j(U=>{const ie=String(M._id);return U.some(me=>String(me._id)===ie)?U.filter(me=>String(me._id)!==H):U.map(me=>{if(String(me._id)===H){const be=M,Ie=be.quotedPost&&(typeof be.quotedPost=="string"?be.quotedPost:be.quotedPost._id);return Ie&&me.quotedPost&&Ie===me.quotedPost._id&&(be.quotedPost=me.quotedPost),be}return me})})}}}),ys(!1),is(null);return}else L=await tt(d.media,"post",a,u=>{He(u),j(M=>M.map(H=>String(H._id)===String(o)?{...H,uploadProgress:u}:H))});else He(100);const V={content:d.content,portalId:a,channel:z,quotedPostId:W==null?void 0:W._id};_&&_.length>0?(V.mediaKeys=_,V.mediaType="image"):L?(V.mediaKey=L,ns.current?V.mediaType="video":d.media&&(d.media.type==="application/pdf"||d.media.name.toLowerCase().endsWith(".pdf"))&&(V.pdfName=d.media.name,V.pdfSize=d.media.size)):O&&(V.media=O,V.mediaType=le);const oe=await pe.post("/api/posts",V);is(null);const de=String(o);j(u=>{const M=String(oe.data._id);return u.some(U=>String(U._id)===M)?u.filter(U=>String(U._id)!==de):u.map(U=>{if(String(U._id)===de){const ie=oe.data,Xe=ie.quotedPost&&(typeof ie.quotedPost=="string"?ie.quotedPost:ie.quotedPost._id);return Xe&&U.quotedPost&&Xe===U.quotedPost._id&&(ie.quotedPost=U.quotedPost),ie}return U})})}catch(L){const _=((E=(N=L.response)==null?void 0:N.data)==null?void 0:E.message)||L.message;if(ae(_,"error"),j(O=>O.filter(le=>String(le._id)!==String(o))),z){const O=String(z);ge(le=>({...le,[O]:Math.max(0,(le[O]||1)-1)}))}Ge(d.content),Fe(d.media),Ve(d.mediaFiles||[]),Ye(d.mediaPreviews||[])}finally{ys(!1),He(0)}},[Ss,Ee]=n.useState(!1),[ws,ds]=n.useState("overview"),[Na,Sa]=n.useState(!1),[wa,St]=n.useState({name:"",description:"",privacy:"public"});n.useRef(null),n.useRef(null);const ms=n.useRef(!1);n.useEffect(()=>{a&&!y&&ps()},[a,y]),n.useEffect(()=>{a&&!y&&!ms.current&&(!s||!Array.isArray(s.channels)||s.channels.length===0||String(s._id)!==String(a))&&ps()},[a,y,s==null?void 0:s._id,(Zs=s==null?void 0:s.channels)==null?void 0:Zs.length]),n.useEffect(()=>{R.get("openSettings")==="true"&&(ds("overview"),Ee(!0))},[R]),n.useEffect(()=>{if(s&&s._id&&s.name)try{const t=localStorage.getItem("oxypace_portal_visits"),i=t?JSON.parse(t):{},l=String(s._id),d=i[l]||{count:0};i[l]={id:l,name:s.name,avatar:s.avatar,count:(d.count||0)+1,lastVisited:Date.now()},localStorage.setItem("oxypace_portal_visits",JSON.stringify(i));let k=0,o=null;Object.values(i).forEach(p=>{p.count>k&&(k=p.count,o=p)}),o&&localStorage.setItem("oxypace_top_portal",JSON.stringify({id:o.id,name:o.name}))}catch{}},[s==null?void 0:s._id,s==null?void 0:s.name]),n.useEffect(()=>{if(!y&&s&&s.channels&&s.channels.length>0)if(z){if(h){const i=s.channels.find(l=>String(l._id)===String(h));if(i&&String(i._id)!==String(z)){te(i._id);return}}if(!s.channels.some(i=>String(i._id)===String(z))){const i=s.channels[0];i&&te(i._id)}}else{if(h){const i=s.channels.find(l=>String(l._id)===String(h));if(i){te(i._id);return}}const t=s.channels[0];t&&te(t._id)}},[s,y,h]),n.useEffect(()=>{const t=i=>{const{portalId:l,channelId:d}=i.detail||{};(!l||String(l)===String(a))&&d&&(te(d),cs(!1),S&&S(!0))};return window.addEventListener("oxypace:switch_channel",t),()=>window.removeEventListener("oxypace:switch_channel",t)},[a,S]),n.useLayoutEffect(()=>{const t=!!h||R.get("joinVoice")==="true";S&&t&&S(!0)},[a,h,R,S]),n.useEffect(()=>{a&&z&&s&&zs(s._id,a)&&hs()},[a,z,s==null?void 0:s._id]),n.useEffect(()=>{if(J&&!De&&!ye&&Array.isArray(q)&&q.length>0){const t=document.getElementById(`post-${J}`);t&&setTimeout(()=>{t.scrollIntoView({behavior:"smooth",block:"center"}),t.classList.add("highlight-post"),setTimeout(()=>t.classList.remove("highlight-post"),2e3),ve(!0)},100)}},[J,q,ye,De]),n.useEffect(()=>{var t,i;if(s&&x){const l=((t=s.members)==null?void 0:t.includes(x._id))||((i=x.joinedPortals)==null?void 0:i.some(d=>d._id===s._id||d===s._id));Le(!!l)}},[s,x]);const ps=async()=>{var l,d,k,o;if(ms.current)return;ms.current=!0,Z("");let t=null;try{const p=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(p){const m=JSON.parse(p);m&&String(m._id)===String(a)&&Array.isArray(m.channels)&&m.channels.length>0&&(t=m)}}catch{}(!s||String(s._id)!==String(a)||!Array.isArray(s.channels)||s.channels.length===0)&&(t?(A(t),ne(!1)):ne(!0),cs(!1));let i=null;for(let p=0;p<3;p++)try{const m=await pe.get(`/api/portals/${a}`);A(m.data);try{const N=JSON.stringify(m.data);sessionStorage.setItem(`oxypace_portal_cache_${a}`,N),localStorage.setItem(`oxypace_portal_cache_${a}`,N)}catch{}(l=m.data)!=null&&l.avatar&&st(m.data.avatar,"original");const b=((d=m.data)==null?void 0:d.coverImage)||((k=m.data)==null?void 0:k.banner);b&&st(b,"original");const T=[m.data.owner,...m.data.admins||[],...m.data.members||[]].filter(Boolean);Rt(T),St({name:m.data.name,description:m.data.description||"",privacy:m.data.privacy||"public"}),Z(""),i=null;break}catch(m){i=m;const b=(o=m.response)==null?void 0:o.status;if(b===403||b===404)break;p<2&&await new Promise(T=>setTimeout(T,1200*(p+1)))}if(i)if(i.response&&i.response.status===403){const p=i.response.data||{};p.portalStatus==="suspended"||p.portalStatus==="closed"?(Oe({portalStatus:p.portalStatus,statusReason:p.statusReason,suspendedUntil:p.suspendedUntil,portalName:p.portalName,portalAvatar:p.portalAvatar}),Z("suspended")):Z("blocked")}else i.response&&i.response.status===404?Z("blocked"):!t&&(!s||String(s._id)!==String(a))&&Z("Portal yüklenemedi");ms.current=!1,ne(!1)},us=n.useRef(null),Ks=n.useRef(q);Ks.current=q;const Qe=n.useRef(z);Qe.current=z;const hs=n.useCallback(async(t=!1)=>{var d,k;const i=Qe.current,l=`portal_posts_${a}_${i}`;if(t)Gs(!0);else{us.current&&us.current.abort(),us.current=new AbortController;let o=!1;try{const p=localStorage.getItem(l)||sessionStorage.getItem(l);if(p){const m=JSON.parse(p);Array.isArray(m)&&m.length>0&&(j(m),Ae(!1),o=!0)}}catch{}o||(Ae(!0),j([])),_s(!0)}try{const o=localStorage.getItem("token"),p={signal:(d=us.current)==null?void 0:d.signal,...o&&{headers:{Authorization:`Bearer ${o}`}}};if(t&&i!==Qe.current)return;let m=`/api/portals/${a}/posts?channel=${i}&limit=10`;const b=Ks.current;if(t&&b.length>0){const E=b[b.length-1];m+=`&before=${E.createdAt}`}const T=await pe.get(m,p),N=T.data;if(T.headers&&T.headers["x-total-count"]!==void 0){const E=parseInt(T.headers["x-total-count"],10);isNaN(E)||ge(L=>({...L,[String(i)]:E}))}if(N.length<10&&_s(!1),t)j(E=>{const L=new Set(E.map(O=>O._id)),_=N.filter(O=>!L.has(O._id));return[...E,..._]});else{j(N);try{localStorage.setItem(l,JSON.stringify(N.slice(0,20)))}catch{try{sessionStorage.setItem(l,JSON.stringify(N.slice(0,15)))}catch{}}}Z("")}catch(o){if(pe.isCancel(o))return;((k=o.response)==null?void 0:k.status)===403?Z("private"):Z("Gönderiler yüklenemedi")}finally{t||Ae(!1),Gs(!1),ne(!1)}},[a]),[Os,_s]=n.useState(!0),[Cs,Gs]=n.useState(!1),xs=n.useRef(),wt=n.useCallback(t=>{Cs||(xs.current&&xs.current.disconnect(),xs.current=new IntersectionObserver(i=>{i[0].isIntersecting&&Os&&hs(!0)},{root:vs.current,rootMargin:"200px"}),t&&xs.current.observe(t))},[Cs,Os,hs]);n.useEffect(()=>{j([]),_s(!0),te(null),A(null),Z(""),S(!1)},[a]);const _t=n.useCallback(t=>{j(l=>l.filter(d=>String(d._id)!==String(t)));const i=Qe.current;i&&ge(l=>({...l,[String(i)]:Math.max(0,(l[String(i)]||1)-1)}))},[j]),Ct=n.useCallback((t,i)=>{if(i){j(d=>d.filter(k=>String(k._id)!==String(t)));const l=Qe.current;l&&ge(d=>({...d,[String(l)]:Math.max(0,(d[String(l)]||1)-1)}))}},[j]),zt=n.useCallback(async t=>{try{const l=(await pe.put(`/api/posts/${t}/pin`)).data;j(d=>d.map(o=>o._id===t?l:o).sort((o,p)=>o.isPinned===p.isPinned?new Date(p.createdAt)-new Date(o.createdAt):o.isPinned?-1:1))}catch{ae("Sabitleme işlemi başarısız","error")}},[j,ae]),Pt=async()=>{var t,i;if(!x){ae("Lütfen giriş yapın veya kaydolun!","warning");return}try{const l=localStorage.getItem("token"),d=l?{headers:{Authorization:`Bearer ${l}`}}:{};if((await pe.post(`/api/portals/${a}/join`,{},d)).data.status==="joined"){Le(!0);const o=Array.isArray(x==null?void 0:x.joinedPortals)?x.joinedPortals:[],p=Array.isArray(x==null?void 0:x.portals)?x.portals:[],m=[...o.filter(N=>{var E;return((E=(N==null?void 0:N._id)||N)==null?void 0:E.toString())!==a.toString()}),s],b=[...p.filter(N=>{var E;return((E=(N==null?void 0:N._id)||N)==null?void 0:E.toString())!==a.toString()}),s],T={...x,joinedPortals:m,portals:b};Y(T),A(N=>({...N,members:[...N.members||[],x._id]})),hs(),ae("Portala başarıyla katıldınız!","success")}else ae("Üyelik isteğiniz gönderildi!","info"),A(o=>({...o,isRequested:!0}))}catch(l){ae(((i=(t=l.response)==null?void 0:t.data)==null?void 0:i.message)||"Katılma başarısız","error")}},zs=(t,i)=>{if(!t||!i)return!1;const l=typeof t=="object"?t.toString():t,d=typeof i=="object"?i.toString():i;return l===d},Ws=x&&s&&s.owner&&zs(s.owner._id||s.owner,x._id),Vs=Ws||x&&s&&s.admins&&s.admins.some(t=>zs(t._id||t,x._id));if(n.useEffect(()=>{if(!(se!=null&&se.suspendedUntil)){Me(null);return}const t=()=>{const l=new Date,k=new Date(se.suspendedUntil)-l;if(k<=0){Me(null),window.location.reload();return}Me({days:Math.floor(k/(1e3*60*60*24)),hours:Math.floor(k/(1e3*60*60)%24),minutes:Math.floor(k/(1e3*60)%60),seconds:Math.floor(k/1e3%60)})};t();const i=setInterval(t,1e3);return()=>clearInterval(i)},[se]),!Q&&!y)return e.jsx(Et,{to:"/",replace:!0});if(ue==="suspended"&&se){const t=se.portalStatus==="suspended",i=se.suspendedUntil?new Date(se.suspendedUntil).toLocaleString("tr-TR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):null;return e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsx("div",{className:"suspension-screen",children:e.jsxs("div",{className:"suspension-card",children:[e.jsx("div",{className:"suspension-icon",children:t?"⏸️":"🔒"}),e.jsx("h1",{className:"suspension-title",children:se.portalName||"Portal"}),e.jsx("h2",{className:"suspension-subtitle",children:t?"Bu portal geçici olarak askıya alındı":"Bu portal kapatılmıştır"}),se.statusReason&&e.jsxs("div",{className:"suspension-reason",children:[e.jsx("div",{className:"suspension-reason-label",children:"Sebep"}),e.jsx("p",{children:se.statusReason})]}),t&&i&&e.jsxs("div",{className:"suspension-unlock",children:[e.jsx("div",{className:"suspension-unlock-label",children:"🔓 Erişim Açılma Tarihi"}),e.jsx("div",{className:"suspension-unlock-date",children:i}),he&&e.jsxs("div",{className:"suspension-countdown",children:[e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(he.days).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Gün"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(he.hours).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saat"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(he.minutes).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Dakika"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(he.seconds).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saniye"})]})]})]}),e.jsxs("div",{className:"suspension-policy",children:[e.jsx("span",{children:"📋"}),e.jsxs("p",{children:["Askıya alma nedenleri, platformun ",e.jsx("strong",{children:"Politika ve Koşullar"}),"'ı kapsamında değerlendirilmektedir. Detaylı bilgi için kurallarımızı inceleyebilirsiniz."]})]}),e.jsx("button",{onClick:()=>P("/"),className:"suspension-home-btn",children:"Anasayfaya Dön"})]})})]})}return ue&&ue!=="suspended"?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsxs("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center",flexDirection:"column",color:"var(--text-muted)"},children:[e.jsx("div",{style:{fontSize:"3rem",marginBottom:"1rem"},children:"🚫"}),e.jsx("h2",{children:ue==="blocked"?"Sonuç Bulunamadı":"Bir Hata Oluştu"}),e.jsx("p",{children:ue==="blocked"?"Aradığınız portala ulaşılamıyor.":ue||"Portal yüklenirken bir sorun oluştu."}),e.jsx("button",{onClick:()=>P("/"),className:"btn-save",style:{marginTop:"20px",float:"none"},children:"Anasayfaya Dön"})]})]}):ee||y||!s||!Array.isArray(s.channels)||s.channels.length===0?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsx("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center"},children:e.jsx("div",{className:"spinner"})})]}):s.isNSFW&&!Ue&&!sessionStorage.getItem(`nsfw_confirmed_${a}`)?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsx("div",{className:"nsfw-gate-overlay",children:e.jsxs("div",{className:"nsfw-gate-card",children:[e.jsx("div",{className:"nsfw-gate-icon",children:e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]})}),e.jsx("div",{className:"nsfw-gate-badge",children:"+18"}),e.jsx("h1",{className:"nsfw-gate-title",children:"Yaş Kısıtlaması"}),e.jsxs("p",{className:"nsfw-gate-desc",children:[e.jsx("strong",{children:s.name})," portalı yetişkin içerik barındırabilir. Bu portala erişmek için 18 yaşından büyük olmanız gerekmektedir."]}),e.jsxs("div",{className:"nsfw-gate-actions",children:[e.jsx("button",{className:"nsfw-gate-confirm",onClick:()=>{sessionStorage.setItem(`nsfw_confirmed_${a}`,"true"),Se(!0)},children:"18 yaşından büyüğüm, devam et"}),e.jsx("button",{className:"nsfw-gate-cancel",onClick:()=>P(-1),children:"Geri Dön"})]}),e.jsx("p",{className:"nsfw-gate-legal",children:"Devam ederek, yaşınızın 18'den büyük olduğunu ve yetişkin içerikle ilgili yasal sorumluluğu kabul ettiğinizi onaylarsınız."})]})})]}):e.jsxs("div",{className:`app-wrapper full-height discord-layout ${Us?"voice-channel-active":""}`,children:[e.jsx(ma,{title:s.name,description:s.description||`${s.name} topluluğuna katılın.`,image:xe(s.avatar),type:"website",schema:{"@context":"https://schema.org","@type":"Community",name:s.name,description:s.description,url:window.location.href,memberCount:((Qs=s.members)==null?void 0:Qs.length)||0}}),!Ss&&e.jsx(es,{}),w.show&&e.jsxs("div",{className:`app-toast ${w.type}`,children:[e.jsx("span",{className:"app-toast-icon",children:w.type==="error"?"🚫":w.type==="success"?"✅":w.type==="warning"?"⚠️":"ℹ️"}),w.message]}),e.jsxs("div",{className:`discord-split-view ${r&&f?"mobile-feed-active":""} ${Us?"voice-room-active":""} ${F?"sidebar-collapsed":""}`,children:[x&&e.jsx(ha,{portal:s,isMember:Re,canManage:Ws||Vs,onEdit:t=>{ds(typeof t=="string"?t:"overview"),Ee(!0)},currentChannel:z,onChangeChannel:jt,className:`${I?"mobile-open":""} ${r&&f?"mobile-hidden":""}`,onShowPortalInfo:()=>rs(!0)}),e.jsxs("main",{className:`discord-main-content ${r&&!f?"mobile-content-hidden":""} ${Bs?"voice-channel-active":""}`,children:[r&&!f&&e.jsx(da,{title:(s==null?void 0:s.name)||"Portal",showBack:!1}),(()=>{var k,o,p,m,b,T,N,E,L,_,O,le,Ke,V,oe,de;const t=K,i=(t==null?void 0:t.type)||"text",l=(t==null?void 0:t.name)||"...",d=i==="voice"||i==="conference";return e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{display:"flex",flex:1,overflow:"hidden"},children:d?e.jsx("div",{style:{flex:1,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"},children:e.jsx(n.Suspense,{fallback:e.jsx("div",{className:"skeleton-loader",children:e.jsx("p",{children:"Canlı bağlantı odası hazırlanıyor..."})}),children:i==="conference"?e.jsx(ja,{portalId:a,channelId:z,channelName:l,onBack:()=>S(!1)}):e.jsx(va,{portalId:a,channelId:z,channelName:l,onBack:()=>S(!1)})})}):e.jsx("div",{className:"channel-messages-area",style:{flex:1,display:"flex",flexDirection:"column"},children:ye?e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"},children:[e.jsx("div",{className:"spinner"}),e.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.9rem"},children:"İçerik yükleniyor..."})]}):e.jsxs(e.Fragment,{children:[!d&&e.jsxs("header",{className:`channel-top-bar ${r?"":"desktop-only"}`,children:[e.jsxs("div",{className:"channel-title-wrapper",children:[r&&e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>S(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",children:i==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",children:l}),(()=>{const u=String((t==null?void 0:t._id)||z||""),M=$e[u]!==void 0?$e[u]:(t==null?void 0:t.postCount)??0;return e.jsxs("div",{className:"channel-post-count-badge",title:`${M} Gönderi`,children:[e.jsx(Es,{size:13}),e.jsx("span",{children:M})]})})()]}),e.jsx("div",{className:"channel-header-actions",children:Re&&e.jsx("button",{className:`icon-btn ${Ce?"active":""}`,onClick:()=>c(!Ce),title:Ce?"Üyeleri Gizle":"Üyeleri Göster",style:{background:"none",border:"none",color:Ce?"var(--primary-color)":"var(--text-muted)"},children:e.jsx(Ps,{size:20})})})]}),ue==="private"?e.jsx(nt,{portal:s,onClose:()=>{window.history.length>2?P(-1):P("/search")},isMobile:r,onOpenSettings:()=>{ds("overview"),Ee(!0)},onJoinStatusChange:u=>{u==="requested"?A(M=>M&&{...M,isRequested:!0}):u==="joined"&&(Le(!0),Z(""),fetchPosts())}}):e.jsxs(e.Fragment,{children:[(s==null?void 0:s.alerts)&&s.alerts.length>0&&e.jsx(fa,{alerts:s.alerts}),e.jsx("div",{className:`portal-feed-container discord-feed ${ls?"tanitim-feed-mode":""}`,onScroll:vt,ref:vs,children:ls?e.jsx(ga,{}):e.jsxs(e.Fragment,{children:[q.length===0&&!ee&&e.jsxs("div",{className:"empty-portal",children:[e.jsx("div",{className:"empty-portal-icon",children:"👋"}),e.jsxs("h3",{children:[((o=(k=s==null?void 0:s.channels)==null?void 0:k.find(u=>u._id===z))==null?void 0:o.type)==="voice"?"🎙️":((m=(p=s==null?void 0:s.channels)==null?void 0:p.find(u=>u._id===z))==null?void 0:m.type)==="conference"?"🎤":((T=(b=s==null?void 0:s.channels)==null?void 0:b.find(u=>u._id===z))==null?void 0:T.type)==="image"?"🖼️":"#",((E=(N=s==null?void 0:s.channels)==null?void 0:N.find(u=>String(u._id)===String(z)))==null?void 0:E.name)||"..."," ","kanalına hoş geldin!"]}),e.jsx("p",{children:"Bu kanalda henüz mesaj yok. İlk mesajı sen at!"})]}),Array.isArray(q)&&q.map((u,M)=>{var U;u.isBot===!0||((U=u.author)==null||U.isBot);const H=Lt.enableAds;return e.jsxs(n.Fragment,{children:[e.jsx(Dt,{post:u,onDelete:_t,onPin:zt,onArchive:Ct,isAdmin:Vs},u._id),M<q.length-1&&e.jsx("div",{className:"post-separator"}),H]},u._id)}),e.jsx("div",{ref:wt,style:{height:"40px",margin:"10px 0",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"},children:Cs&&e.jsx("div",{className:"spinner-small"})})]})}),(()=>{const M=2*Math.PI*20,H=M-bt/100*M;return e.jsxs("button",{className:`floating-scroll-top portal-scroll-top ${ft?"visible":""}`,onClick:ks,"aria-label":"Yukarı Çık",children:[e.jsxs("svg",{className:"progress-ring",width:"50",height:"50",viewBox:"0 0 50 50",children:[e.jsx("circle",{className:"progress-ring-track",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25"}),e.jsx("circle",{className:"progress-ring-fill",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25",style:{strokeDasharray:M,strokeDashoffset:H}})]}),e.jsx("div",{className:"scroll-icon",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"m18 15-6-6-6 6"})})})]})})(),ls?null:pt?e.jsxs("div",{className:"channel-input-area",children:[re&&Mt.createPortal(e.jsxs("div",{className:"plus-menu portal-plus-menu-portal",ref:ut,style:{position:"fixed",top:we.top,left:we.left,zIndex:99999},children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{We.current.click(),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("circle",{cx:"8.5",cy:"8.5",r:"1.5"}),e.jsx("polyline",{points:"21 15 16 10 5 21"})]})}),"Görsel"]}),!os&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Rs.current.click(),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("polygon",{points:"23 7 16 12 23 17 23 7"}),e.jsx("rect",{x:"1",y:"5",width:"15",height:"14",rx:"2",ry:"2"})]})}),"Video"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Ls.current.click(),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",style:{fontWeight:800,fontSize:"10px"},children:"GIF"}),"GIF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{$s.current.click(),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"})]})}),"PDF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{as(!Ms),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"}),e.jsx("polygon",{points:"9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02",fill:"currentColor"})]})}),"YouTube"]})]})]}),document.body),e.jsx("input",{type:"file",ref:We,onChange:kt,style:{display:"none"},accept:"image/png, image/jpeg, image/jpg, image/webp",multiple:!0}),e.jsx("input",{type:"file",ref:Rs,onChange:Ns,style:{display:"none"},accept:"video/mp4, video/webm, video/quicktime"}),e.jsx("input",{type:"file",ref:Ls,onChange:Ns,style:{display:"none"},accept:"image/gif"}),e.jsx("input",{type:"file",ref:$s,onChange:Ns,style:{display:"none"},accept:".pdf"}),Ms&&e.jsx("div",{className:"edit-modal-overlay",style:{zIndex:9999},children:e.jsxs("div",{className:"edit-modal-modern",style:{maxWidth:"400px",height:"auto",maxHeight:"none"},children:[e.jsxs("div",{className:"edit-modal-header-modern",children:[e.jsx("div",{className:"header-left",children:e.jsx("h3",{className:"header-title-modern",children:"YouTube Videosu Ekle"})}),e.jsx("button",{onClick:()=>as(!1),className:"close-btn-modern",children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),e.jsxs("div",{className:"edit-modal-content-modern",style:{padding:"20px"},children:[e.jsxs("div",{className:"floating-label-group",children:[e.jsx("label",{className:"floating-label",children:"Video Bağlantısı"}),e.jsx("input",{type:"text",className:"floating-input",placeholder:"https://www.youtube.com/watch?v=...",value:qe,onChange:gt,autoFocus:!0,onKeyDown:u=>{u.key==="Enter"&&(u.preventDefault(),qs())}})]}),e.jsxs("div",{style:{marginTop:"20px",display:"flex",justifyContent:"flex-end",gap:"10px"},children:[e.jsx("button",{onClick:()=>as(!1),className:"join-btn outline",style:{padding:"8px 16px"},children:"İptal"}),e.jsx("button",{onClick:qs,className:"join-btn primary",style:{padding:"8px 20px"},children:"Ekle"})]})]})]})}),W&&e.jsxs("div",{className:"input-quoted-preview",children:[e.jsxs("div",{className:"input-quoted-preview-header",children:[(_=(L=W.author)==null?void 0:L.profile)!=null&&_.avatar?e.jsx("img",{src:xe(W.author.profile.avatar),alt:"",className:"quoted-preview-avatar",loading:"lazy",decoding:"async",width:"32",height:"32"}):e.jsx("div",{className:"quoted-preview-avatar-placeholder",children:(le=(O=W.author)==null?void 0:O.username)==null?void 0:le.charAt(0).toUpperCase()}),e.jsxs("div",{className:"quoted-preview-meta",children:[e.jsx("span",{className:"quoted-preview-author",children:((V=(Ke=W.author)==null?void 0:Ke.profile)==null?void 0:V.displayName)||((oe=W.author)==null?void 0:oe.username)}),e.jsxs("span",{className:"quoted-preview-username",children:["@",(de=W.author)==null?void 0:de.username]})]}),e.jsx("button",{className:"remove-quote-btn",onClick:()=>is(null),children:e.jsx(ss,{size:16})})]}),e.jsxs("div",{className:"input-quoted-preview-body",children:[e.jsx("p",{className:"input-quoted-preview-text",children:W.content}),W.media&&e.jsx("div",{className:"input-quoted-preview-media",children:W.mediaType==="video"?e.jsxs("div",{className:"media-placeholder",children:[e.jsx(la,{size:20}),e.jsx("span",{children:"Video Alıntısı"})]}):e.jsx("img",{src:xe(W.media),alt:"",loading:"lazy",decoding:"async",width:"120",height:"80"})})]})]}),os&&fe.trim()&&!B&&e.jsxs("div",{className:"image-channel-warning",style:{backgroundColor:"rgba(239, 68, 68, 0.1)",border:"1px solid rgba(239, 68, 68, 0.25)",color:"#f87171",padding:"8px 12px",borderRadius:"8px",fontSize:"13px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{flexShrink:0},children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]}),e.jsx("span",{children:"Görsel kanallarında paylaşım yapabilmek için mutlaka bir görsel eklemelisiniz."})]}),$?e.jsxs("div",{className:"ghost-channel-notice",style:{backgroundColor:"#0c0c0c",borderTop:"1px solid #222",color:"#888",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",fontSize:"13px"},children:[e.jsxs("svg",{viewBox:"0 0 24 24",width:"18",height:"18",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{opacity:.7},children:[e.jsx("path",{d:"M12 2a5 5 0 0 0-5 5v14l3-2 2 2 2-2 3 2V7a5 5 0 0 0-5-5z"}),e.jsx("circle",{cx:"10",cy:"8",r:"1",fill:"currentColor"}),e.jsx("circle",{cx:"14",cy:"8",r:"1",fill:"currentColor"})]}),e.jsx("span",{children:"Hayalet Modu: Salt okunur izleme modundasınız. Kanalda mesaj ve gönderi paylaşılamaz."})]}):e.jsxs("div",{className:"message-input-wrapper",children:[e.jsx("button",{ref:Je,className:`input-action-btn upload-btn ${re?"active":""}`,onClick:ht,style:{backgroundColor:"#383a40",borderRadius:"50%",width:"32px",height:"32px",marginRight:"12px",color:re?"var(--primary-color)":"#b9bbbe"},children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z"})})}),B&&e.jsxs("div",{className:"input-media-preview",style:{marginRight:"12px",display:"flex",alignItems:"center",backgroundColor:"var(--bg-secondary)",borderRadius:"8px",padding:"4px",gap:"8px",border:"1px solid var(--border-subtle)"},children:[B.type==="youtube"&&B.preview?e.jsx("img",{src:B.preview,alt:"Video Preview",style:{width:"40px",height:"30px",objectFit:"cover",borderRadius:"4px"},loading:"lazy",decoding:"async",width:"40",height:"30"}):e.jsx("span",{style:{fontSize:"20px",lineHeight:1,padding:"4px"},children:B.type.startsWith("video")?"🎥":B.type.includes("gif")?"👾":B.type==="application/pdf"||B.name&&B.name.toLowerCase().endsWith(".pdf")?"📄":"🖼️"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",maxWidth:"100px"},children:e.jsx("span",{style:{fontSize:"10px",color:"var(--text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:B.name||"Medya"})}),e.jsx("button",{onClick:()=>Fe(null),style:{background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer"},children:"×"})]}),e.jsx("input",{type:"text",placeholder:os?"Gönderi paylaşmak için bir görsel ekleyin...":`#${(K==null?void 0:K.name)||"..."} kanalına mesaj gönder`,value:fe,onChange:u=>{Ge(u.target.value)},onKeyDown:u=>{u.key==="Enter"&&!u.shiftKey&&(u.preventDefault(),Fs())}}),e.jsx("div",{className:"input-right-actions",children:e.jsx("button",{className:"input-action-btn send-btn",onClick:Fs,disabled:Ds||(os?!B&&Pe.length===0:!fe.trim()&&!B&&Pe.length===0),title:"Gönder",style:{color:fe.trim()||B||Pe.length>0?"var(--primary-color)":"var(--text-tertiary)"},children:Ds?e.jsxs("div",{className:"compose-spinner-wrapper",style:{width:"20px",height:"20px"},children:[e.jsx("div",{className:"compose-spinner",style:{width:"20px",height:"20px",borderTopColor:"var(--primary-color)"}}),e.jsxs("span",{className:"compose-progress-text",style:{fontSize:"7px",color:"var(--text-primary)"},children:[ct,"%"]})]}):e.jsx(oa,{size:20})})})]}),Te&&Te.length>0&&e.jsxs("div",{className:"portal-image-previews-container",children:[e.jsxs("div",{className:"portal-image-previews-header",children:[e.jsxs("span",{className:"portal-image-previews-count",children:["Seçilen Görseller (",Te.length,"/10)"]}),Te.length<10&&e.jsx("button",{type:"button",className:"portal-add-more-images-btn",onClick:()=>{var u;return(u=We.current)==null?void 0:u.click()},children:"+ Görsel Ekle"})]}),e.jsx("div",{className:"portal-image-previews-list",children:Te.map((u,M)=>e.jsxs("div",{className:"portal-image-preview-item",children:[e.jsx("img",{src:u.url,alt:`Preview ${M+1}`,className:"portal-image-preview-thumb"}),e.jsx("button",{type:"button",className:"portal-image-remove-btn",onClick:()=>Nt(M),title:"Görseli Kaldır",children:e.jsx(ss,{size:14})}),e.jsx("span",{className:"portal-image-index-badge",children:M+1})]},M))})]}),ce&&ce.length>0&&e.jsxs("div",{className:"portal-typing-indicator",style:{marginTop:"8px"},children:[e.jsx("div",{className:"typing-avatars-group",children:ce.map(u=>e.jsx("img",{src:xe(u.avatar),alt:u.displayName,className:"typing-avatar",title:u.displayName},u.userId))}),e.jsx("span",{className:"typing-text",children:ce.length===1?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:ce[0].displayName})," yazıyor..."]}):ce.length===2?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:ce[0].displayName})," ve ",e.jsx("strong",{children:ce[1].displayName})," yazıyor..."]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:ce[0].displayName})," ve ",ce.length-1," kişi daha yazıyor..."]})})]})]}):e.jsx("div",{className:"channel-input-area",style:{padding:"0 20px 24px 20px",backgroundColor:"transparent",borderTop:"none"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--glass-bg)",padding:"12px 20px",borderRadius:"8px",border:"1px solid var(--glass-border)",backdropFilter:"blur(20px) saturate(160%)",WebkitBackdropFilter:"blur(20px) saturate(160%)",boxShadow:"var(--glass-shadow)"},children:[e.jsxs("span",{style:{color:"var(--text-secondary)",fontWeight:500,fontSize:"14px"},children:["Bu kanalda mesaj göndermek için ",x?"portala katılmalısın.":"giriş yapmalısın."]}),x?e.jsx("button",{className:"privacy-join-btn",onClick:Pt,disabled:s.isRequested,style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:s.isRequested?"İstek Gönderildi":"Portala Katıl"}):e.jsx("button",{className:"privacy-join-btn",onClick:()=>P("/login"),style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:"Giriş Yap"})]})})]})]})})}),Ce&&e.jsx(xa,{members:[...s.owner?[{...s.owner,role:"owner"}]:[],...(s.admins||[]).map(u=>({...u,role:"admin"})),...s.members||[]].filter((u,M,H)=>{const U=String(u._id||u.id||u);return u&&H.findIndex(ie=>String(ie._id||ie.id||ie)===U)===M}),onClose:()=>c(!1)})]})})()]})]}),Ss&&ws!=="notifications"&&e.jsx(n.Suspense,{fallback:null,children:e.jsx(ba,{portal:s,currentUser:x,initialTab:ws,onClose:()=>Ee(!1),onUpdate:t=>{A(t)}})}),Ss&&ws==="notifications"&&e.jsx("div",{className:"portal-notifications-modal",onClick:()=>Ee(!1),children:e.jsxs("div",{className:"notifications-modal-content",onClick:t=>t.stopPropagation(),children:[e.jsx("button",{className:"close-notifications-btn",onClick:()=>Ee(!1),children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsx(n.Suspense,{fallback:null,children:e.jsx(ya,{portalId:s._id,portalChannels:s.channels||[],onUpdate:ps})})]})}),dt&&s&&e.jsx(nt,{portal:s,onClose:()=>rs(!1),isMobile:r,onOpenSettings:()=>{rs(!1),ds("overview"),Ee(!0)},onLeave:()=>{rs(!1),Le(!1),P("/")}})]})};export{Va as default};
