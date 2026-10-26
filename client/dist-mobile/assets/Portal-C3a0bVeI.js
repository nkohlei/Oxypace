const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PortalSettingsModal-BdWhqprw.js","assets/vendor-DZPcF3hk.js","assets/index-CcGUEvZD.js","assets/socket-CKAwNobV.js","assets/livekit-PwOJ_nM-.js","assets/lucide-B1LdSyZS.js","assets/index-DqjNERQH.css","assets/ImageCropper-CGuk02xe.js","assets/ImageCropper-Dk7oVLRB.css","assets/PortalBadges-D2zQKd4C.js","assets/UserBadges-JPlbSscQ.js","assets/UserBadges-DFKBzEd_.css","assets/PortalBadges-bryM1aQu.css","assets/PortalSettingsModal-CHDypHKx.css","assets/PortalNotifications-DIekFj-h.js","assets/PortalNotifications-zEgqx9Vo.css","assets/VoiceChannel-BPiAC3Kk.js","assets/VoiceChannel-CQm0T-IP.js","assets/VoiceChannel-8DFSTqL9.css","assets/ConferenceChannel-DEU9XBim.js"])))=>i.map(i=>d[i]);
import{r as n,a1 as e,$ as de,a2 as As,aq as Xs,as as It,a4 as At,ar as Tt,a5 as Et,a6 as Mt,aa as gs}from"./vendor-DZPcF3hk.js";import{d as he,l as rt,u as bs,m as lt,i as fs,c as Ts,b as et,p as st,h as Rt,n as Lt,a as tt}from"./index-CcGUEvZD.js";import{u as Dt}from"./useVideoTranscoder-F29RdM0Q.js";import{P as $t}from"./PostCard-p-imfVsh.js";import{c as Bt,X as ss,ae as Ut,Y as qt,a2 as Kt,M as Es,a8 as Ft,a1 as Gt,a5 as Ot,e as Wt,a6 as Vt,aG as Yt,aH as Ht,aJ as Jt,aK as Zt,ad as Qt,K as at,aB as Xt,a9 as ea,F as sa,r as ta,t as aa,G as ia,s as Ps,j as na,aL as ot,au as ra,aM as la,aN as oa}from"./lucide-B1LdSyZS.js";import{U as it}from"./UserBadges-JPlbSscQ.js";import{P as Is}from"./PortalBadges-D2zQKd4C.js";import{U as ca}from"./UserBar-CFuX1-fQ.js";import{P as nt}from"./PortalInfoModal-BC4t5E_l.js";import{N as es}from"./Navbar-B_r14cDU.js";import{S as da}from"./SubHeader-D14Mv2Rf.js";import{S as ma}from"./SEO-Bf_1XcCd.js";import"./socket-CKAwNobV.js";import"./livekit-PwOJ_nM-.js";import"./VideoDownloadModal-BW0aM9xj.js";import"./LinkPreview-z3OFq8l8.js";import"./UserAvatar-DCdthC1T.js";/* empty css                      */import"./Login-Bg-9eyyc.js";/* empty css             *//* empty css                  */const pa=({portalId:a,onClose:f})=>{const[T,h]=n.useState(""),[H,x]=n.useState([]),[Z,W]=n.useState(!1),[b,y]=n.useState(new Set);n.useEffect(()=>{const P=setTimeout(async()=>{if(T.trim().length===0){x([]);return}W(!0);try{const L=await de.get(`/api/users/search?q=${T}`);x(L.data)}catch{}finally{W(!1)}},500);return()=>clearTimeout(P)},[T]);const F=async C=>{var P,L;try{await Promise.all([de.post(`/api/portals/${a}/invite`,{userId:C}),de.post("/api/messages",{recipientId:C,portalId:a,content:"Seni bir portala davet ettim!"})]),y(r=>new Set(r).add(C))}catch(r){alert(((L=(P=r.response)==null?void 0:P.data)==null?void 0:L.message)||"İşlem sırasında bir hata oluştu.")}},z=()=>{const C=`${window.location.origin}/portal/${a}`;navigator.clipboard.writeText(C),alert("Davet bağlantısı kopyalandı!")};return e.jsx("div",{className:"invite-modal-overlay",onClick:f,children:e.jsxs("div",{className:"invite-modal",onClick:C=>C.stopPropagation(),children:[e.jsxs("div",{className:"invite-header",children:[e.jsx("h2",{children:"Kullanıcı Davet Et"}),e.jsxs("div",{className:"header-actions",children:[e.jsxs("button",{className:"copy-link-btn",title:"Bağlantıyı Kopyala",onClick:z,children:[e.jsx(Bt,{size:20,strokeWidth:2}),e.jsx("span",{children:"Bağlantı"})]}),e.jsx("button",{className:"close-btn",onClick:f,children:e.jsx(ss,{size:24,strokeWidth:2})})]})]}),e.jsx("div",{className:"invite-search-container",children:e.jsx("input",{type:"text",className:"invite-search-input",placeholder:"Kullanıcı adı ara...",value:T,onChange:C=>h(C.target.value),autoFocus:!0})}),e.jsxs("div",{className:"invite-results custom-scrollbar",children:[Z&&e.jsx("div",{className:"loading-text",children:"Aranıyor..."}),!Z&&H.length===0&&T&&e.jsx("div",{className:"no-play-text",children:"Sonuç bulunamadı."}),H.map(C=>{var r;const P=C._id||C,L=b.has(P);return e.jsxs("div",{className:"invite-user-row",children:[e.jsxs("div",{className:"user-info",children:[e.jsx("img",{src:he((r=C.profile)==null?void 0:r.avatar),alt:"",className:"user-avatar"}),e.jsx("span",{className:"user-name",children:C.username})]}),e.jsx("button",{className:`invite-btn ${L?"invited":""}`,onClick:()=>!L&&F(P),disabled:L,children:L?"Gönderildi":"Davet Et"})]},P)})]})]})})},ua=({startedAt:a,style:f={},className:T=""})=>{const{roomStartTime:h}=rt()||{},[H,x]=n.useState("00:00");n.useEffect(()=>{const W=h&&a===h?h:a;if(!W){x("00:00");return}const b=()=>{const F=Math.floor((Date.now()-W)/1e3);if(F<0){x("00:00");return}const z=Math.floor(F/3600),C=Math.floor(F%3600/60),P=F%60;x(z>0?`${z.toString().padStart(2,"0")}:${C.toString().padStart(2,"0")}:${P.toString().padStart(2,"0")}`:`${C.toString().padStart(2,"0")}:${P.toString().padStart(2,"0")}`)};b();const y=setInterval(b,1e3);return()=>clearInterval(y)},[a,h]);const Z={display:"flex",alignItems:"center",fontSize:"15px",fontWeight:"800",color:"#39FF14",background:"transparent",border:"none",padding:"0 4px"};return e.jsx("div",{style:{...Z,...f},className:T,children:H})},ha=({portal:a,isMember:f,onEdit:T,currentChannel:h,onChangeChannel:H,className:x,canManage:Z,onShowPortalInfo:W})=>{var $e,Ce;const{user:b}=bs(),[y,F]=n.useState(!1);As();const z=lt(),{isMobileView:C}=z||{},P=(z==null?void 0:z.isDesktopSidebarCollapsed)||!1,L=(z==null?void 0:z.setIsDesktopSidebarCollapsed)||(()=>{}),r=fs(d=>d.unreadPostsByChannel),g=fs(d=>d.clearUnreadForChannel),{roomStartTime:v,activeRoom:K,participants:M}=rt(),{socket:s,onlineUsers:I}=Ts(),[U,j]=n.useState({}),[ee,le]=n.useState(null),be=n.useRef(null),Ie=(d,S)=>{S.stopPropagation(),be.current&&clearTimeout(be.current),le(d),be.current=setTimeout(()=>{le(null)},1800)};n.useEffect(()=>()=>{be.current&&clearTimeout(be.current)},[]);const me=d=>{if(!d)return null;if(typeof d=="string")return d;const S=d._id||d.id;return S?String(S):null},Q=new Set,se=me(a==null?void 0:a.owner);se&&Q.add(se),((a==null?void 0:a.admins)||[]).forEach(d=>{const S=me(d);S&&Q.add(S)}),((a==null?void 0:a.members)||[]).forEach(d=>{const S=me(d);S&&Q.add(S)});const Ke=new Set((I||[]).map(d=>String(d))),pe=b!=null&&b._id?String(b._id):null,Ee=((Ce=($e=b==null?void 0:b.settings)==null?void 0:$e.privacy)==null?void 0:Ce.showOnlineStatus)!==!1;pe&&Q.has(pe)&&Ee?Ke.add(pe):pe&&!Ee&&Ke.delete(pe);let Me=0;Q.forEach(d=>{Ke.has(d)&&Me++});const Re=Q.size||(a==null?void 0:a.membersCount)||((a==null?void 0:a.members)||[]).length||0;n.useEffect(()=>{h&&(a!=null&&a._id)&&g(h,a._id)},[h,a==null?void 0:a._id,g]),n.useEffect(()=>{var Ne;if(!(a!=null&&a._id)||!((Ne=a==null?void 0:a.channels)!=null&&Ne.length))return;const d=a.channels.filter(re=>re.type==="voice"||re.type==="conference");if(d.length===0)return;let S=!0;const ke=async()=>{try{const re=await Promise.all(d.map(async X=>{var _e,Ue;const Se=X._id||X.id;try{const ts=await de.get(`/api/voice/rooms/${a._id}/${Se}/participants?t=${Date.now()}`);return{channelId:String(Se),count:((Ue=(_e=ts.data)==null?void 0:_e.participants)==null?void 0:Ue.length)||0}}catch{return{channelId:String(Se),count:0}}}));S&&j(X=>{const Se={...X};return re.forEach(_e=>{Se[_e.channelId]=_e.count}),Se})}catch{}};ke();const Be=setInterval(ke,1e4);return()=>{S=!1,clearInterval(Be)}},[a==null?void 0:a._id,a==null?void 0:a.channels]),n.useEffect(()=>{if(!s)return;const d=S=>{!S||!S.channelId||S.portalId&&String(S.portalId)!==String(a==null?void 0:a._id)||j(ke=>({...ke,[String(S.channelId)]:Number(S.count)||0}))};return s.on("voice:channel-count-update",d),()=>{s.off("voice:channel-count-update",d)}},[s,a==null?void 0:a._id]);const _=a!=null&&a.channels?[...a.channels].sort((d,S)=>(d.order||0)-(S.order||0)).map(d=>({id:d._id,name:d.name,type:d.type||"text",postCount:d.postCount})):[],te=_.find(d=>String(d.id)===String(h)),Le=(te==null?void 0:te.type)==="voice"||(te==null?void 0:te.type)==="conference";n.useEffect(()=>{!Le&&P&&L(!1)},[Le,P,L]);const xe=d=>String(h)===String(d),De=(a==null?void 0:a.coverImage)||(a==null?void 0:a.banner),ye=De?he(De):null,Fe=ye?`url("${ye}")`:a&&!De?'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")':"none",[oe,ve]=n.useState(!1),je=n.useRef(null);return n.useEffect(()=>{if(!ye){ve(!0),je.current=null;return}if(je.current===ye){ve(!0);return}je.current=ye;const d=new window.Image;d.src=ye,d.complete?ve(!0):(ve(!1),d.onload=()=>ve(!0),d.onerror=()=>ve(!0))},[ye]),a?e.jsxs("div",{className:`channel-sidebar ${P?"collapsed":""} ${x||""}`,style:{height:"calc(100% - 24px)",backgroundColor:"transparent",display:"flex",flexDirection:"column",flexShrink:0,overflow:"visible",position:"relative",borderRight:"none"},children:[!C&&Le&&e.jsx("button",{className:"sidebar-toggle-btn",onClick:d=>{d.stopPropagation(),L(!P)},title:P?"Menüyü Göster":"Menüyü Gizle",children:P?e.jsx(Ut,{size:16}):e.jsx(qt,{size:16})}),e.jsxs("div",{className:"sidebar-content-wrapper",style:{display:"flex",flexDirection:"column",flex:1,width:"100%",height:"100%",overflow:"hidden",transition:"opacity 0.2s ease, visibility 0.2s ease",opacity:P?0:1,visibility:P?"hidden":"visible",gap:"8px",padding:"0px",boxSizing:"border-box"},children:[e.jsxs("div",{className:"cs-panel cs-panel--banner",children:[e.jsxs("div",{className:"channel-banner-container",onClick:()=>W&&W(),children:[e.jsx("div",{className:"channel-banner-image",style:{backgroundImage:Fe,opacity:oe?1:0}}),e.jsx("div",{className:"channel-banner-overlay"})]}),e.jsxs("div",{className:"portal-quick-info",children:[e.jsxs("div",{className:"portal-info-main",onClick:()=>W&&W(),children:[e.jsxs("h2",{className:"portal-title-text",children:[e.jsx("span",{className:"portal-title-name",children:a.name}),e.jsx(Is,{portal:a,size:18})]}),e.jsxs("div",{className:"portal-stats-row",children:[e.jsxs("div",{className:`stat-item ${ee==="members"?"stat-tooltip-active":""}`,onClick:d=>Ie("members",d),title:"Üye",children:[e.jsx(Kt,{size:12}),e.jsx("span",{children:Re}),e.jsx("div",{className:"stat-floating-tag",children:"Üye"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${ee==="posts"?"stat-tooltip-active":""}`,onClick:d=>Ie("posts",d),title:"Gönderi",children:[e.jsx(Es,{size:12}),e.jsx("span",{children:a.postCount||0}),e.jsx("div",{className:"stat-floating-tag",children:"Gönderi"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${ee==="online"?"stat-tooltip-active":""}`,onClick:d=>Ie("online",d),title:"Çevrimiçi",children:[e.jsx("div",{className:"online-indicator-dot"}),e.jsx("span",{children:Me}),e.jsx("div",{className:"stat-floating-tag",children:"Çevrimiçi"})]})]})]}),e.jsxs("div",{className:"portal-header-actions",children:[(f||Z)&&e.jsx("button",{className:"portal-action-btn-circle",onClick:d=>{d.stopPropagation(),T&&T("notifications")},title:"Bildirim Ayarları",children:e.jsx(Ft,{size:16})}),f&&e.jsx("button",{className:"portal-action-btn-circle",onClick:d=>{d.stopPropagation(),F(!0)},title:"Davet Et",children:e.jsx(Gt,{size:18})})]})]})]}),e.jsxs("div",{className:"cs-panel cs-panel--channels custom-scrollbar",children:[e.jsxs("div",{className:"cs-channels-header",children:[e.jsx("span",{children:"Kanallar"}),Z&&e.jsx("div",{onClick:d=>{d.stopPropagation(),T&&T("channels")},className:"cs-add-channel-btn",title:"Kanal Oluştur",children:"+"})]}),e.jsx("div",{className:"cs-channel-list",children:_.map(d=>{var re;const S=xe(d.id),ke=d.type==="announcement"||d.name.includes("announcements"),Be=d.type==="voice"||d.type==="conference";let Ne=U[String(d.id)]??0;return K&&String(K.channelId)===String(d.id)&&Array.isArray(M)&&(Ne=M.length),e.jsxs("div",{className:`channel-item ${S?"active":""}`,onClick:()=>H(d.id),style:{padding:"6px 8px",margin:"2px 0",borderRadius:"4px",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",color:S?"white":"#949ba4",backgroundColor:S?"#3f4147":"transparent",transition:"background-color 0.15s ease, color 0.15s ease"},children:[e.jsx("div",{style:{color:S?"white":"var(--text-secondary)",display:"flex",alignItems:"center",minWidth:"20px",justifyContent:"center"},children:d.type==="conference"?e.jsx(Ot,{size:20,strokeWidth:2}):d.type==="voice"?e.jsx(Wt,{size:20,strokeWidth:2}):ke?e.jsx(Vt,{size:20,strokeWidth:2.5}):d.type==="image"?e.jsx(Yt,{size:20,strokeWidth:2.5,style:{color:"#f59e0b"}}):e.jsx(Ht,{size:20,strokeWidth:2.5})}),e.jsx("span",{style:{fontWeight:S?600:500,fontSize:"16px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:S?"white":"var(--text-primary)",maxWidth:"fit-content"},children:d.name}),Be&&e.jsx("span",{className:`vc-channel-active-badge ${Ne>0?"online":"idle"}`,children:Ne>0?`${Ne} aktif`:"aktif yok"}),!S&&((re=r[d.id])==null?void 0:re.length)>0&&e.jsx("div",{style:{backgroundColor:"#f23f43",color:"white",fontSize:"11px",fontWeight:"bold",padding:"0 6px",borderRadius:"8px",minWidth:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.3)",marginLeft:"-4px",flexShrink:0},children:r[d.id].length>9?"9+":r[d.id].length}),e.jsx("div",{style:{flex:1}}),S&&Be&&K&&String(K.channelId)===String(d.id)&&v&&e.jsx("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:e.jsx(ua,{startedAt:v,className:"vc-sidebar-timer"})})]},d.id)})})]}),e.jsxs("div",{className:"cs-panel cs-panel--userbar",children:[e.jsx(ca,{currentChannelId:h}),e.jsx("div",{className:"cs-footer-copyright",children:"© 2026 Oxypace. Tüm hakları saklıdır."})]})]}),e.jsx("style",{children:`
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
            `}),y&&e.jsx(pa,{portalId:a._id,onClose:()=>F(!1)})]}):null},xa=({members:a=[],onClose:f})=>{var P,L;const{onlineUsers:T}=Ts(),{user:h}=bs(),[,H]=n.useState(0);n.useEffect(()=>{const r=setInterval(()=>{H(g=>g+1)},6e4);return()=>clearInterval(r)},[]);const x=r=>{if(!r)return"";const g=new Date,v=new Date(r),K=Math.max(0,g-v),M=Math.floor(K/6e4);if(M<1)return"şimdi";if(M<60)return`${M}dk`;const s=Math.floor(M/60);if(s<24)return`${s}sa`;const I=Math.floor(s/24);if(I<30)return`${I}g`;const U=Math.floor(I/30);return U<12?`${U}ay`:`${Math.floor(U/12)}y`},Z=r=>{if(!r)return null;if(typeof r=="string")return r;const g=r._id||r.id;return g?String(g):null},W=new Set((T||[]).map(r=>String(r))),b=h!=null&&h._id?String(h._id):null,y=((L=(P=h==null?void 0:h.settings)==null?void 0:P.privacy)==null?void 0:L.showOnlineStatus)!==!1;b&&y?W.add(b):b&&!y&&W.delete(b);const F=r=>(r==null?void 0:r.role)==="owner"?3:(r==null?void 0:r.role)==="admin"||r!=null&&r.isAdmin?2:1,z=a.filter(r=>{if(!r)return!1;const g=Z(r);return g&&W.has(g)}).sort((r,g)=>{var s,I;const v=F(g)-F(r);if(v!==0)return v;const K=((s=r.profile)==null?void 0:s.displayName)||r.username||"",M=((I=g.profile)==null?void 0:I.displayName)||g.username||"";return K.localeCompare(M)}),C=a.filter(r=>{if(!r)return!1;const g=Z(r);return g&&!W.has(g)}).sort((r,g)=>{var s,I;const v=F(g)-F(r);if(v!==0)return v;const K=((s=r.profile)==null?void 0:s.displayName)||r.username||"",M=((I=g.profile)==null?void 0:I.displayName)||g.username||"";return K.localeCompare(M)});return e.jsxs("div",{className:"members-sidebar custom-scrollbar",children:[e.jsxs("div",{className:"members-header-top",children:[e.jsx("h3",{children:"ÜYELER"}),f&&e.jsx("button",{onClick:f,className:"close-members-btn","aria-label":"Kapat",children:e.jsx(ss,{size:20,strokeWidth:2})})]}),e.jsxs("div",{className:"members-category",children:["Çevrim içi — ",z.length]}),z.map((r,g)=>{var U,j,ee,le;if(!r||typeof r=="string")return null;const v=r.username||"Unknown",K=((U=r.profile)==null?void 0:U.avatar)||r.avatar,M=((j=r.profile)==null?void 0:j.displayName)||v,s=r.role==="owner",I=r.role==="admin"||r.isAdmin;return e.jsxs(Xs,{to:`/profile/${v}`,className:"member-item member-link",children:[e.jsxs("div",{className:"member-avatar-wrapper",children:[K?e.jsx("img",{src:he(K,"thumbnail"),alt:"",className:"member-avatar",loading:"eager",decoding:"async"}):e.jsx("div",{className:"member-avatar-placeholder",children:((ee=M[0])==null?void 0:ee.toUpperCase())||((le=v[0])==null?void 0:le.toUpperCase())||"?"}),e.jsx("div",{className:"status-indicator online"})]}),e.jsxs("div",{className:"member-info",style:{display:"flex",alignItems:"center",gap:"6px"},children:[e.jsxs("span",{className:"member-name active-role",style:{color:s?"#f1c40f":I?"#3498db":"#2ecc71"},children:[M,s&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!s&&I&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"})]}),e.jsx(it,{user:r,size:13})]})]},r._id||r.id||g)}),e.jsxs("div",{className:"members-category",children:["Çevrim dışı — ",C.length]}),C.map((r,g)=>{var U,j,ee,le;if(!r||typeof r=="string")return null;const v=r.username||"Unknown",K=((U=r.profile)==null?void 0:U.avatar)||r.avatar,M=((j=r.profile)==null?void 0:j.displayName)||v,s=r.role==="owner",I=r.role==="admin"||r.isAdmin;return e.jsxs(Xs,{to:`/profile/${v}`,className:"member-item offline member-link",children:[e.jsx("div",{className:"member-avatar-wrapper",children:K?e.jsx("img",{src:he(K,"thumbnail"),alt:"",className:"member-avatar",loading:"eager",decoding:"async"}):e.jsx("div",{className:"member-avatar-placeholder",style:{backgroundColor:"var(--bg-secondary)"},children:((ee=M[0])==null?void 0:ee.toUpperCase())||((le=v[0])==null?void 0:le.toUpperCase())||"?"})}),e.jsx("div",{className:"member-info",style:{flex:1},children:e.jsxs("div",{className:"member-name-row",style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("span",{className:"member-name",style:{display:"flex",alignItems:"center",gap:"4px"},children:[M,s&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!s&&I&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"}),e.jsx(it,{user:r,size:13})]}),r.lastActive&&e.jsx("span",{className:"last-active-time",style:{fontSize:"11px",color:"var(--text-muted)"},children:x(r.lastActive)})]})})]},r._id||r.id||`offline-${g}`)}),e.jsx("style",{children:`
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
            `})]})},fa=()=>{var P,L;const{user:a,updateUser:f}=bs(),T=As(),[h,H]=n.useState(null),[x,Z]=n.useState([]),[W,b]=n.useState(!0),[y,F]=n.useState(null);n.useEffect(()=>{let r=!0;return(async()=>{try{const v=await de.get("/api/portals/showcase");r&&v.data&&(H(v.data.globalPortal||null),Z(Array.isArray(v.data.topPortals)?v.data.topPortals:[]))}catch{}finally{r&&b(!1)}})(),()=>{r=!1}},[]);const z=async(r,g)=>{var v,K,M;if(r.stopPropagation(),!a){T("/login");return}if(g.isMember){T(`/portal/${g._id}`);return}if(!(g.isRequested||y===g._id)){F(g._id);try{const I=((v=(await de.post(`/api/portals/${g._id}/join`)).data)==null?void 0:v.status)==="requested",U=j=>!j||j._id!==g._id?j:{...j,isMember:!I,isRequested:I,memberCount:I?j.memberCount:(j.memberCount||0)+1};if((h==null?void 0:h._id)===g._id&&H(U(h)),Z(j=>j.map(U)),!I&&a&&f){const j=a.joinedPortals||[];j.some(ee=>(ee._id||ee).toString()===g._id.toString())||f({joinedPortals:[...j,g],portals:[...a.portals||[],g]})}}catch(s){alert(((M=(K=s.response)==null?void 0:K.data)==null?void 0:M.message)||"İşlem gerçekleştirilemedi.")}finally{F(null)}}},C=r=>r!=null&&r.banner?`url(${he(r.banner)}) center/cover no-repeat`:"#141414";return e.jsxs("div",{className:"tanitim-showcase-wrapper",children:[e.jsxs("section",{className:"tanitim-guide-card",children:[e.jsxs("div",{className:"tanitim-guide-header",children:[e.jsxs("div",{className:"tanitim-guide-tag",children:[e.jsx(Jt,{size:13}),e.jsx("span",{children:"SİSTEM DİREKTİFİ // RESMİ PLATFORM REHBERİ"})]}),e.jsx("h1",{className:"tanitim-guide-title",children:"Oxypace İletişim Protokolü & Kullanım Mimarisi"}),e.jsx("p",{className:"tanitim-guide-lead",children:"Özgür, sansürsüz, yüksek performanslı ve gizlilik odaklı yeni nesil topluluk ekosistemi. Arayüz haritasını ve platformun tüm gelişmiş yeteneklerini aşağıdaki yönergelerden inceleyin."})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// NAVİGASYON VE MENÜ YERLEŞİMİ"}),e.jsx("h2",{className:"sub-section-title",children:"Sayfa Yapısı & Arayüz Konumlandırması"})]}),e.jsxs("div",{className:"tanitim-nav-map-grid",children:[e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(Zt,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ SOL NAVİGASYON BARI ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Ana Gezinme Çubuğu"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Doğrudan Mesajlar (DM):"})," Birebir şifreli özel yazışmalar ve anlık bildirim kutusu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portallar Listesi:"})," Üye olduğunuz veya yönettiğiniz tüm portalların dikey simgeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Keşfet Pusulası:"})," Yeni toplulukları, popüler portalları ve kişileri arama alanı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Oluştur (+):"})," Saniyeler içinde kendi özgür topluluğunuzu kurma aracı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kimlik & Hızlı Ayar:"})," En altta mikrofon, kulaklık ve profil hızlı kontrolleri."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(Qt,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ PORTAL İÇİ MENÜ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Kanal Hiyerarşisi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Kimliği:"})," Özel afiş, doğrulanmış rozet ve çevrimiçi üye göstergeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Metin Kanalları (#):"})," Tematik konulara göre ayrılmış gönderi ve tartışma akışları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Ses Kanalları (🎙️):"})," Tek dokunuşla girilebilen, gecikmesiz canlı ses odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Sahne Kanalları (🎤):"})," Seminer, podcast ve etkinlikler için konuşmacı odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Yönetimi:"})," Yöneticiler için yeni kanallar açma ve gizlilik kilidi."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(at,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ ÜST DENETİM & AKIŞ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"İçerik & Üye Denetimi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Üst Başlığı:"})," Aktif kanal adı, açıklaması ve hızlı üye paneli butonu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Üye Listesi Paneli:"})," Sağ tarafta çevrimiçi yöneticiler ve aktif üyeler."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Görsel Akış Alanı:"})," 4K videolar, çoklu galeriler ve doküman önizlemeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Bildirim Zil İkonu:"})," Kanal ve portal bazlı bildirim filtreleme ayarları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Ayarları:"})," Portal sahibi ve yöneticileri için tam yönetim konsolu."]})]})]})]})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// GELİŞMİŞ SİSTEM DİREKLERİ"}),e.jsx("h2",{className:"sub-section-title",children:"Platform Mekanizmaları & Özellikler"})]}),e.jsxs("div",{className:"tanitim-pillars-grid",children:[e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"01"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Es,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Gelişmiş Mesaj Mekanizması"}),e.jsx("p",{className:"pillar-text",children:"Markdown formatlama, tek tıkla alıntılı yanıtlama (quote reply), kullanıcıyı doğrudan haberdar eden @etiketleme sistemi ve akıllı bağlantı (link preview) ayrıştırma desteği."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Alıntılı Yanıt"}),e.jsx("span",{className:"pillar-tag",children:"@Bahsetmeler"}),e.jsx("span",{className:"pillar-tag",children:"Mesaj Sabitleme"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"02"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Xt,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Canlı Ses Odaları & Sahne Modu"}),e.jsx("p",{className:"pillar-text",children:"Ultra düşük gecikmeli WebRTC ses mimarisi. Herkesin serbestçe katılabildiği sohbet odaları ile seminer ve konferanslar için konuşmacı-dinleyici ayrımı ve el kaldırma desteği sunan Sahne kanalları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Gecikme"}),e.jsx("span",{className:"pillar-tag",children:"Sahne Hiyerarşisi"}),e.jsx("span",{className:"pillar-tag",children:"Arka Planda Ses"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"03"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(ea,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Mobil Ekosistem & PIP Video"}),e.jsx("p",{className:"pillar-text",children:"Yerel Android APK ve tam uyumlu PWA deneyimi. Canlı FCM Push bildirimleri, mobil veri tasarrufu modu ve gezinirken köşede kesintisiz oynayan Kayan Resim İçinde Resim (PIP) video motoru."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Android APK / PWA"}),e.jsx("span",{className:"pillar-tag",children:"Canlı PIP Oynatıcı"}),e.jsx("span",{className:"pillar-tag",children:"FCM Push Bildirim"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"04"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(sa,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Ultra-HD Medya & Transcoding"}),e.jsx("p",{className:"pillar-text",children:"İstemci içi WASM motoru ile 360p'den 4K'ya kadar otomatik optimize edilen video akışı. Tek gönderide 10 adede kadar yüksek kaliteli fotoğraf galerisi ve tek tıkla önizlenebilir PDF dokümanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"4K Video Transcoding"}),e.jsx("span",{className:"pillar-tag",children:"10'lu Görsel Galerisi"}),e.jsx("span",{className:"pillar-tag",children:"PDF Doküman Desteği"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"05"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(at,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Özelleştirilebilir Sistemler & Temalar"}),e.jsx("p",{className:"pillar-text",children:"Saf OLED siyahı ve yüksek kontrastlı Aydınlık tema desteği. Kişisel profil afişi, biyografi ve avatar özelleştirmeleri. Portallar için özel roller, izin matrisleri ve gizlilik kalkanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"OLED Siyah & Açık Tema"}),e.jsx("span",{className:"pillar-tag",children:"Rol & Yetki Matrisi"}),e.jsx("span",{className:"pillar-tag",children:"Özel Profil Afişi"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"06"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(ta,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Kripto-Güvenlik & Sıfır Takip"}),e.jsx("p",{className:"pillar-text",children:"Sıfır veri madenciliği ve ticari profil koruması. IP ve aktif cihaz oturum denetimi, güvenlik anahtarları ile hesap kurtarma ve doğrulanmış resmi topluluk rozetleri."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Veri İzleme"}),e.jsx("span",{className:"pillar-tag",children:"Cihaz & Oturum Denetimi"}),e.jsx("span",{className:"pillar-tag",children:"Onay Rozetleri"})]})]})]})]})]}),h&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ MERKEZ TOPLULUK // 01 ]"}),e.jsx("span",{className:"section-badge",children:"EN POPÜLER PORTAL"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Oxypace Global"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"Platformun en geniş üye kitlesine sahip resmi ana iletişim merkezi."})]}),e.jsxs("div",{className:"oxypace-global-hero-card",onClick:()=>T(`/portal/${h._id}`),children:[e.jsxs("div",{className:"hero-card-banner",style:{background:C(h)},children:[e.jsx("div",{className:"hero-banner-overlay"}),e.jsx("div",{className:"hero-banner-badge",children:e.jsx("span",{children:"ANA TOPLULUK"})})]}),e.jsxs("div",{className:"hero-card-body",children:[e.jsxs("div",{className:"hero-header-row",children:[e.jsx("div",{className:"hero-avatar-box",children:h.avatar?e.jsx("img",{src:he(h.avatar),alt:h.name,className:"hero-avatar-img"}):e.jsx("div",{className:"hero-avatar-fallback",children:((L=(P=h.name)==null?void 0:P.substring(0,2))==null?void 0:L.toUpperCase())||"OG"})}),e.jsxs("div",{className:"hero-identity-col",children:[e.jsxs("div",{className:"hero-name-row",children:[e.jsx("h3",{className:"hero-portal-name",children:h.name}),e.jsx(Is,{portal:h,size:18}),e.jsx("span",{className:"hero-privacy-tag",children:h.privacy==="private"?e.jsxs(e.Fragment,{children:[e.jsx(aa,{size:11})," GİZLİ"]}):e.jsxs(e.Fragment,{children:[e.jsx(ia,{size:11})," HERKESE AÇIK"]})})]}),e.jsx("div",{className:"hero-meta-row",children:e.jsxs("div",{className:"hero-member-stat",children:[e.jsx(Ps,{size:14}),e.jsxs("span",{children:[(h.memberCount||0).toLocaleString("tr-TR")," Üye"]})]})})]}),e.jsx("div",{className:"hero-action-col",children:e.jsx("button",{type:"button",className:`tanitim-sharp-btn hero-btn ${h.isMember?"btn-joined":h.isRequested?"btn-requested":"btn-action"}`,onClick:r=>z(r,h),disabled:y===h._id||h.isRequested,children:y===h._id?"İŞLENİYOR...":h.isMember?e.jsxs(e.Fragment,{children:[e.jsx(na,{size:14}),"ÜYESİNİZ"]}):h.isRequested?e.jsxs(e.Fragment,{children:[e.jsx(ot,{size:14}),"İSTEK GÖNDERİLDİ"]}):h.privacy==="private"?"ÜYELİK İSTEĞİ GÖNDER":"PORTALA KATIL"})})]}),e.jsx("p",{className:"hero-description",children:h.description||"Oxypace platformunun ana buluşma noktası. Güncel duyurular, teknik tartışmalar ve küresel topluluk etkileşimi."})]})]})]}),x.length>0&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ AKTİF TOPLULUKLAR // 02 ]"}),e.jsx("span",{className:"section-badge",children:"ÖNE ÇIKAN PORTALLAR"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Popüler Topluluklar"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"En çok paylaşıma ve aktif etkileşime sahip seçkin portallar."})]}),e.jsx("div",{className:"tanitim-portals-row",children:x.map(r=>{var g,v;return e.jsxs("div",{className:"tanitim-classic-card",onClick:()=>T(`/portal/${r._id}`),children:[e.jsx("div",{className:"classic-card-banner",style:{background:C(r)},children:e.jsx("div",{className:"classic-banner-overlay"})}),e.jsx("div",{className:"classic-card-icon-wrapper",children:r.avatar?e.jsx("img",{src:he(r.avatar),alt:r.name,className:"classic-card-icon-img",loading:"lazy"}):e.jsx("div",{className:"classic-card-icon-placeholder",children:((v=(g=r.name)==null?void 0:g.substring(0,2))==null?void 0:v.toUpperCase())||"P"})}),e.jsxs("div",{className:"classic-card-body",children:[e.jsxs("div",{className:"classic-card-title-row",children:[e.jsx("h4",{className:"classic-card-title",children:r.name}),e.jsx(Is,{portal:r,size:16})]}),e.jsx("p",{className:"classic-card-desc",children:r.description||"Bu topluluk hakkında henüz bir açıklama girilmemiş."}),e.jsxs("div",{className:"classic-card-footer",children:[e.jsxs("div",{className:"classic-member-count",children:[e.jsx(Ps,{size:12}),e.jsxs("span",{children:[r.memberCount||0," Üye"]})]}),e.jsx("button",{type:"button",className:`tanitim-sharp-btn small-btn ${r.isMember?"btn-joined":r.isRequested?"btn-requested":"btn-action"}`,onClick:K=>z(K,r),disabled:y===r._id||r.isRequested,children:y===r._id?"...":r.isMember?"ÜYESİNİZ":r.isRequested?"İSTEK":r.privacy==="private"?"İSTEK AT":"KATIL"})]})]})]},r._id)})})]})]})},ga=({alerts:a=[]})=>{const[f,T]=n.useState(()=>{try{const b=sessionStorage.getItem("dismissed_portal_alerts");return b?JSON.parse(b):[]}catch{return[]}}),[h,H]=n.useState(null),x=a.filter(b=>!f.includes(b._id)),Z=b=>{H(b),setTimeout(()=>{const y=[...f,b];T(y);try{sessionStorage.setItem("dismissed_portal_alerts",JSON.stringify(y))}catch{}H(null)},300)},W=b=>{const y=new Date,z=new Date(b)-y;if(z<=0)return null;const C=Math.floor(z/(1e3*60*60*24)),P=Math.floor(z/(1e3*60*60)%24),L=Math.floor(z/(1e3*60)%60);return C>0?`${C} gün ${P} saat kaldı`:P>0?`${P} saat ${L} dk kaldı`:`${L} dakika kaldı`};return x.length===0?null:e.jsx(e.Fragment,{children:x.map(b=>e.jsx("div",{className:`portal-alert-banner ${h===b._id?"dismissing":""}`,children:e.jsxs("div",{className:"alert-banner-inner",children:[e.jsx("div",{className:"alert-banner-icon",children:e.jsx(ra,{size:18,strokeWidth:2})}),e.jsxs("div",{className:"alert-banner-content",children:[e.jsx("div",{className:"alert-banner-label",children:e.jsx("span",{children:"Yönetici Uyarısı"})}),e.jsx("div",{className:"alert-banner-message",children:b.message}),e.jsx("div",{className:"alert-banner-meta",children:e.jsxs("span",{className:"alert-banner-time",children:[e.jsx(ot,{size:16,strokeWidth:2}),W(b.expiresAt)||"Süresi dolmak üzere"]})})]}),e.jsx("button",{className:"alert-banner-close",onClick:()=>Z(b._id),title:"Uyarıyı gizle",children:e.jsx(ss,{size:16,strokeWidth:2.5})})]})},b._id))})},ba=n.lazy(()=>gs(()=>import("./PortalSettingsModal-BdWhqprw.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13]))),ya=n.lazy(()=>gs(()=>import("./PortalNotifications-DIekFj-h.js"),__vite__mapDeps([14,1,2,3,4,5,6,15]))),va=n.lazy(()=>gs(()=>import("./VoiceChannel-BPiAC3Kk.js"),__vite__mapDeps([16,1,4,2,3,5,6,17,18]))),ja=n.lazy(()=>gs(()=>import("./ConferenceChannel-DEU9XBim.js"),__vite__mapDeps([19,1,4,2,3,5,6,17,18]))),Va=()=>{var Ys,Hs,Js,Zs,Qs;const{id:a}=It(),f=At(),[T]=Tt(),h=T.get("channel"),H=T.get("post"),{user:x,token:Z,updateUser:W,loading:b}=bs(),{socket:y,connected:F}=Ts(),z=As(),C=lt(),{isSidebarOpen:P,closeSidebar:L,isMobileView:r,mobileChannelOpen:g,setMobileChannelOpen:v}=C||{},K=(C==null?void 0:C.isDesktopSidebarCollapsed)||!1,M=typeof window<"u"&&!!localStorage.getItem("admin_backup_token"),[s,I]=n.useState(()=>{var t;try{const i=sessionStorage.getItem(`oxypace_portal_cache_${a}`);if(i){const l=JSON.parse(i);if(Array.isArray(l==null?void 0:l.channels)&&l.channels.length>0)return l}}catch{}return(t=f==null?void 0:f.state)!=null&&t.portal&&(String(f.state.portal._id)===String(a)||String(f.state.portal.id)===String(a))&&Array.isArray(f.state.portal.channels)&&f.state.portal.channels.length>0?f.state.portal:null});n.useEffect(()=>{var t;(t=f==null?void 0:f.state)!=null&&t.portal&&(String(f.state.portal._id)===String(a)||String(f.state.portal.id)===String(a))&&I(i=>Array.isArray(f.state.portal.channels)&&f.state.portal.channels.length>0?f.state.portal:i&&Array.isArray(i.channels)&&i.channels.length>0?{...f.state.portal,channels:i.channels,roles:i.roles||f.state.portal.roles,members:i.members||f.state.portal.members}:i||null)},[a,f.state]);const U=fs(t=>t.posts),j=fs(t=>t.setPosts),[ee,le]=n.useState(()=>{var t;try{const i=sessionStorage.getItem(`oxypace_portal_cache_${a}`);if(i){const l=JSON.parse(i);if(Array.isArray(l==null?void 0:l.channels)&&l.channels.length>0)return!1}}catch{}return!((t=f==null?void 0:f.state)!=null&&t.portal&&(String(f.state.portal._id)===String(a)||String(f.state.portal.id)===String(a))&&Array.isArray(f.state.portal.channels)&&f.state.portal.channels.length>0)}),[be,Ie]=n.useState(!1),[me,Q]=n.useState(""),[se,Ke]=n.useState(null),[pe,Ee]=n.useState(null),[Me,Re]=n.useState(!1),[_,te]=n.useState(null),[Le,xe]=n.useState({}),[De,ye]=n.useState(!1),[fe,Fe]=n.useState(""),[oe,ve]=n.useState([]);n.useRef(null);const[je,$e]=n.useState(!1),[Ce,d]=n.useState(!1),[S,ke]=n.useState({show:!1,message:"",type:"info"}),[Be,Ne]=n.useState(!1),[re,X]=n.useState(!1),[Se,_e]=n.useState({top:0,left:0}),[Ue,ts]=n.useState(""),[Ms,as]=n.useState(!1),Ge=n.useRef(null),Rs=n.useRef(null),Ls=n.useRef(null),Ds=n.useRef(null),[D,qe]=n.useState(null),[ze,Oe]=n.useState([]),[Ae,We]=n.useState([]),[G,is]=n.useState(null),[ct,Ve]=n.useState(0),[$s,ys]=n.useState(!1),ns=n.useRef(!1);Dt();const we=et(t=>t.activeUploads)[`portal-${a}`];n.useEffect(()=>{we&&we.status==="uploading"&&j(t=>t.map(i=>i.isOptimistic&&i.mediaType==="video"?{...i,uploadProgress:we.progress}:i))},[we==null?void 0:we.progress,we==null?void 0:we.status]);const[dt,rs]=n.useState(!1),ls=!!(s!=null&&s.name&&/Oxypace Tan[ıi]t[ıi]m/i.test(s.name)),mt=!!(x&&(((Ys=x.username)==null?void 0:Ys.toLowerCase())==="oxypace"||x.isAdmin)),pt=ls?mt:x&&Me,ut=n.useRef(null),Ye=n.useRef(null),ht=n.useCallback(t=>{t.preventDefault(),t.stopPropagation(),X(i=>{if(!i&&Ye.current){const l=Ye.current.getBoundingClientRect();_e({top:l.bottom+8,left:l.left})}return!i})},[]);n.useEffect(()=>{if(!re)return;let t=!0;const i=()=>{if(Ye.current){const c=Ye.current.getBoundingClientRect();_e({top:c.bottom+8,left:c.left})}},l=c=>{if(!t)return;const m=c.target.closest(".plus-menu")||c.target.closest(".portal-plus-menu-portal"),N=c.target.closest(".upload-btn");!m&&!N&&X(!1)},o=setTimeout(()=>{t&&(document.addEventListener("click",l),document.addEventListener("touchstart",l))},0);return window.addEventListener("scroll",i,!0),window.addEventListener("resize",i),()=>{t=!1,clearTimeout(o),document.removeEventListener("click",l),document.removeEventListener("touchstart",l),window.removeEventListener("scroll",i,!0),window.removeEventListener("resize",i)}},[re]),n.useEffect(()=>()=>{X(!1)},[]),n.useEffect(()=>{X(!1)},[_,a]),n.useEffect(()=>{var t;(t=f.state)!=null&&t.quotedPost&&(is(f.state.quotedPost),f.state.selectedChannelId&&te(f.state.selectedChannelId),z(f.pathname+f.search,{replace:!0,state:{}}))},[f.state,a]);const Y=(Hs=s==null?void 0:s.channels)==null?void 0:Hs.find(t=>String(t._id)===String(_)),os=(Y==null?void 0:Y.type)==="image",Bs=(Y==null?void 0:Y.type)==="voice"||(Y==null?void 0:Y.type)==="conference",Us=Bs&&(!r||g);n.useEffect(()=>{s!=null&&s.channels&&Array.isArray(s.channels)&&xe(t=>{const i={...t};return s.channels.forEach(l=>{const o=String(l._id);l.postCount!==void 0&&(i[o]=l.postCount)}),i})},[s==null?void 0:s.channels]),n.useEffect(()=>{if(!y||!F||!a)return;y.emit("join_portal",a),y.emit("get_online_users"),_&&y.emit("join_channel",_);const t=c=>{var E,w,R,k;const m=((E=c.portal)==null?void 0:E._id)||c.portal,N=((w=c.channel)==null?void 0:w._id)||c.channel,p=String(m)===String(a),$=String(N)===String(_);if(p&&$){const O=((R=c.author)==null?void 0:R._id)||((k=c.author)==null?void 0:k.id)||c.author;if(String(O)!==String(x==null?void 0:x._id)){const q=String(_);xe(J=>({...J,[q]:(J[q]!==void 0?J[q]:(Y==null?void 0:Y.postCount)||0)+1}))}j(q=>{if(q.some(ue=>ue._id===c._id))return q;const J=c.quotedPost&&(typeof c.quotedPost=="string"?c.quotedPost:c.quotedPost._id);if(J){const ue=q.find(ie=>ie._id===J);ue&&typeof ue=="object"&&ue.author?c.quotedPost=ue:G&&J===G._id&&(c.quotedPost=G)}return[c,...q]})}},i=c=>{var p;const m=((p=c.portal)==null?void 0:p._id)||c.portal;(!m||String(m)===String(a))&&j($=>$.map(E=>String(E._id)===String(c._id)?c:E))},l=({userId:c,status:m,lastActive:N})=>{m==="offline"&&ve(p=>p.filter($=>String($.userId)!==String(c))),I(p=>{if(!p)return p;const $=N||new Date;let E=p.owner;if(p.owner){const k=p.owner._id||p.owner.id||p.owner;String(k)===String(c)&&typeof p.owner=="object"&&(E={...p.owner,lastActive:$})}let w=p.admins;Array.isArray(p.admins)&&(w=p.admins.map(k=>{const O=k._id||k.id||k;return String(O)===String(c)&&typeof k=="object"&&k!==null?{...k,lastActive:$}:k}));let R=p.members;return Array.isArray(p.members)&&(R=p.members.map(k=>{const O=k._id||k.id||k;return String(O)===String(c)&&typeof k=="object"&&k!==null?{...k,lastActive:$}:k})),{...p,owner:E,admins:w,members:R}})},o=({userId:c,username:m,displayName:N,avatar:p,isTyping:$})=>{String(c)!==String(x==null?void 0:x._id)&&ve(E=>$?E.some(w=>String(w.userId)===String(c))?E:[...E,{userId:c,username:m,displayName:N,avatar:p}]:E.filter(w=>String(w.userId)!==String(c)))};return y.on("post:created",t),y.on("post:updated",i),y.on("user_status_change",l),y.on("portal_typing_update",o),()=>{y.off("post:created",t),y.off("post:updated",i),y.off("user_status_change",l),y.off("portal_typing_update",o)}},[y,F,a,_,x==null?void 0:x._id]);const xt=t=>{if(!t)return null;const i=/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,l=t.match(i);return l&&l[2].length===11?l[2]:null},ft=t=>{const i=t.target.value;ts(i)},qs=()=>{const t=xt(Ue);if(!t){ae("Geçersiz YouTube URL'si","error");return}qe({name:"YouTube Video",type:"youtube",preview:`https://img.youtube.com/vi/${t}/hqdefault.jpg`,url:Ue}),as(!1),ts("")},[gt,cs]=n.useState(!1),[bt,yt]=n.useState(0),vs=n.useRef(null),js=n.useRef(null),He=n.useRef(null),vt=n.useCallback(t=>{const i=t.target;js.current||(js.current=requestAnimationFrame(()=>{js.current=null;const l=i.scrollTop,o=l>300;cs(m=>m!==o?o:m);const c=i.scrollHeight-i.clientHeight;if(c>0){const m=Math.round(l/c*100);yt(N=>Math.abs(N-m)>=2?m:N)}}))},[]),ks=n.useCallback(t=>{t&&(t.preventDefault(),t.stopPropagation()),He.current&&cancelAnimationFrame(He.current);const i=vs.current||document.querySelector(".discord-feed")||document.querySelector(".portal-feed-container");if(!i){window.scrollTo({top:0,behavior:"smooth"});return}const l=i.scrollTop;if(l<=0)return;const o=800,c=performance.now(),m=p=>1-Math.pow(1-p,5),N=p=>{const $=p-c,E=Math.min($/o,1),w=m(E);i.scrollTop=Math.round(l*(1-w)),E<1?He.current=requestAnimationFrame(N):(i.scrollTop=0,He.current=null)};He.current=requestAnimationFrame(N)},[]);n.useEffect(()=>{const t=()=>{ks(),(!s||!Array.isArray(s.channels)||s.channels.length===0)&&ps()};return window.addEventListener("oxypace:scroll_portal_top",t),()=>window.removeEventListener("oxypace:scroll_portal_top",t)},[ks,s==null?void 0:s._id,(Js=s==null?void 0:s.channels)==null?void 0:Js.length]);const jt=t=>{te(t),cs(!1),r&&(L(),v(!0))},ae=n.useCallback((t,i="info")=>{ke({show:!0,message:t,type:i}),setTimeout(()=>ke(l=>({...l,show:!1})),4e3)},[]),kt=t=>{const i=Array.from(t.target.files||[]);if(i.length===0)return;qe(null),ns.current=!1;const o=10-ze.length;if(o<=0){ae("Bir gönderiye en fazla 10 görsel ekleyebilirsiniz.","warning");return}const c=i.slice(0,o);i.length>o&&ae(`En fazla 10 görsel ekleyebilirsiniz. İlk ${o} görsel eklendi.`,"warning");const m=[],N=[];for(const p of c){if(p.size>2*1024*1024*1024){ae(`${p.name} boyutu 2 GB'dan büyük olamaz.`,"error");continue}m.push(p),N.push({url:URL.createObjectURL(p),name:p.name,size:p.size,file:p})}Oe(p=>[...p,...m]),We(p=>[...p,...N]),X(!1),Ge.current&&(Ge.current.value="")},Nt=t=>{Oe(i=>i.filter((l,o)=>o!==t)),We(i=>{const l=i[t];if(l&&l.url&&l.url.startsWith("blob:"))try{URL.revokeObjectURL(l.url)}catch{}return i.filter((o,c)=>c!==t)})},Ns=t=>{const i=t.target.files[0];if(i){if(i.size>2*1024*1024*1024){ae("Dosya boyutu 2 GB'dan büyük olamaz.","error");return}Oe([]),We([]),qe(i),ns.current=i.type.startsWith("video/")||["mp4","webm","ogg","mov","m4v"].includes(i.name.split(".").pop().toLowerCase()),X(!1)}};n.useEffect(()=>{M||!y||!a||(fe.trim().length>0||D!==null||ze.length>0?je||($e(!0),y.emit("portal_typing",{portalId:a,isTyping:!0})):je&&(y.emit("portal_typing",{portalId:a,isTyping:!1}),$e(!1)))},[fe,D,ze,a,y,je,M]),n.useEffect(()=>()=>{!M&&y&&a&&je&&y.emit("portal_typing",{portalId:a,isTyping:!1})},[a,y,je,M]);const Ks=async()=>{var w,R;if(M){ae("Hayalet Modu: Salt okunur izleme modundasınız. Gönderi paylaşılamaz.","error");return}const t=fe.trim().length>0,i=!!D,l=ze.length>0;if(!t&&!i&&!l)return;y&&a&&y.emit("portal_typing",{portalId:a,isTyping:!1}),$e(!1);const o={content:fe,media:D,mediaFiles:[...ze],mediaPreviews:[...Ae]},c=D&&D.type==="youtube",m=`temp-${Date.now()}`;let N=null,p=null;c?(N=D.url,p="youtube"):l?(N=Ae.map(k=>k.url),p="image"):D&&(N=URL.createObjectURL(D),p=D.type.startsWith("video")?"video":D.type.includes("gif")?"gif":"image");const $=p==="video",E={_id:m,content:fe,media:N,mediaType:p||"none",author:x,createdAt:new Date().toISOString(),likes:[],likeCount:0,isOptimistic:!0,quotedPost:G,isProcessing:!!$,processingProgress:0,estimatedTime:$?"Hesaplanıyor...":""};if(j(k=>[E,...k]),_){const k=String(_);xe(O=>({...O,[k]:(O[k]!==void 0?O[k]:(Y==null?void 0:Y.postCount)||0)+1}))}Fe(""),qe(null),Oe([]),We([]),X(!1),ys(!0),Ve(0);try{let k=null,O=null,q=null,J=null,ue=null;if(c)q=o.media.url,J="youtube";else if(o.mediaFiles&&o.mediaFiles.length>0){const u=o.mediaFiles.length,A=new Array(u).fill(0),V=o.mediaFiles.map((B,ne)=>tt(B,"post",a,Xe=>{A[ne]=Xe;const ce=Math.round(A.reduce((ge,Pe)=>ge+Pe,0)/u);Ve(ce),j(ge=>ge.map(Pe=>String(Pe._id)===String(m)?{...Pe,uploadProgress:ce}:Pe))}));O=await Promise.all(V)}else if(o.media)if(ns.current){et.getState().startVideoUpload({file:o.media,portalId:a,channel:_,content:o.content,quotedPostId:G==null?void 0:G._id,onFinish:(u,A)=>{if(u){if(j(V=>V.filter(B=>String(B._id)!==String(m))),_){const V=String(_);xe(B=>({...B,[V]:Math.max(0,(B[V]||1)-1)}))}ae("Video yükleme başarısız oldu.","error")}else if(A){const V=String(m);j(B=>{const ne=String(A._id);return B.some(ce=>String(ce._id)===ne)?B.filter(ce=>String(ce._id)!==V):B.map(ce=>{if(String(ce._id)===V){const ge=A,Pe=ge.quotedPost&&(typeof ge.quotedPost=="string"?ge.quotedPost:ge.quotedPost._id);return Pe&&ce.quotedPost&&Pe===ce.quotedPost._id&&(ge.quotedPost=ce.quotedPost),ge}return ce})})}}}),ys(!1),is(null);return}else k=await tt(o.media,"post",a,u=>{Ve(u),j(A=>A.map(V=>String(V._id)===String(m)?{...V,uploadProgress:u}:V))});else Ve(100);const ie={content:o.content,portalId:a,channel:_,quotedPostId:G==null?void 0:G._id};O&&O.length>0?(ie.mediaKeys=O,ie.mediaType="image"):k?(ie.mediaKey=k,ns.current?ie.mediaType="video":o.media&&(o.media.type==="application/pdf"||o.media.name.toLowerCase().endsWith(".pdf"))&&(ie.pdfName=o.media.name,ie.pdfSize=o.media.size)):q&&(ie.media=q,ie.mediaType=J);const Ze=await de.post("/api/posts",ie);is(null);const Qe=String(m);j(u=>{const A=String(Ze.data._id);return u.some(B=>String(B._id)===A)?u.filter(B=>String(B._id)!==Qe):u.map(B=>{if(String(B._id)===Qe){const ne=Ze.data,Xe=ne.quotedPost&&(typeof ne.quotedPost=="string"?ne.quotedPost:ne.quotedPost._id);return Xe&&B.quotedPost&&Xe===B.quotedPost._id&&(ne.quotedPost=B.quotedPost),ne}return B})})}catch(k){const O=((R=(w=k.response)==null?void 0:w.data)==null?void 0:R.message)||k.message;if(ae(O,"error"),j(q=>q.filter(J=>String(J._id)!==String(m))),_){const q=String(_);xe(J=>({...J,[q]:Math.max(0,(J[q]||1)-1)}))}Fe(o.content),qe(o.media),Oe(o.mediaFiles||[]),We(o.mediaPreviews||[])}finally{ys(!1),Ve(0)}},[Ss,Te]=n.useState(!1),[ws,ds]=n.useState("overview"),[Na,Sa]=n.useState(!1),[wa,St]=n.useState({name:"",description:"",privacy:"public"});n.useRef(null),n.useRef(null);const ms=n.useRef(!1);n.useEffect(()=>{a&&!b&&ps()},[a,b]),n.useEffect(()=>{a&&!b&&!ms.current&&(!s||!Array.isArray(s.channels)||s.channels.length===0||String(s._id)!==String(a))&&ps()},[a,b,s==null?void 0:s._id,(Zs=s==null?void 0:s.channels)==null?void 0:Zs.length]),n.useEffect(()=>{T.get("openSettings")==="true"&&(ds("overview"),Te(!0))},[T]),n.useEffect(()=>{if(s&&s._id&&s.name)try{const t=localStorage.getItem("oxypace_portal_visits"),i=t?JSON.parse(t):{},l=String(s._id),o=i[l]||{count:0};i[l]={id:l,name:s.name,avatar:s.avatar,count:(o.count||0)+1,lastVisited:Date.now()},localStorage.setItem("oxypace_portal_visits",JSON.stringify(i));let c=0,m=null;Object.values(i).forEach(N=>{N.count>c&&(c=N.count,m=N)}),m&&localStorage.setItem("oxypace_top_portal",JSON.stringify({id:m.id,name:m.name}))}catch{}},[s==null?void 0:s._id,s==null?void 0:s.name]),n.useEffect(()=>{if(!b&&s&&s.channels&&s.channels.length>0)if(_){if(h){const i=s.channels.find(l=>String(l._id)===String(h));if(i&&String(i._id)!==String(_)){te(i._id);return}}if(!s.channels.some(i=>String(i._id)===String(_))){const i=s.channels[0];i&&te(i._id)}}else{if(h){const i=s.channels.find(l=>String(l._id)===String(h));if(i){te(i._id);return}}const t=s.channels[0];t&&te(t._id)}},[s,b,h]),n.useEffect(()=>{const t=i=>{const{portalId:l,channelId:o}=i.detail||{};(!l||String(l)===String(a))&&o&&(te(o),cs(!1),v&&v(!0))};return window.addEventListener("oxypace:switch_channel",t),()=>window.removeEventListener("oxypace:switch_channel",t)},[a,v]),n.useLayoutEffect(()=>{const t=!!h||T.get("joinVoice")==="true";v&&t&&v(!0)},[a,h,T,v]),n.useEffect(()=>{a&&_&&s&&zs(s._id,a)&&hs()},[a,_,s==null?void 0:s._id]),n.useEffect(()=>{if(H&&!De&&!be&&Array.isArray(U)&&U.length>0){const t=document.getElementById(`post-${H}`);t&&setTimeout(()=>{t.scrollIntoView({behavior:"smooth",block:"center"}),t.classList.add("highlight-post"),setTimeout(()=>t.classList.remove("highlight-post"),2e3),ye(!0)},100)}},[H,U,be,De]),n.useEffect(()=>{var t,i;if(s&&x){const l=((t=s.members)==null?void 0:t.includes(x._id))||((i=x.joinedPortals)==null?void 0:i.some(o=>o._id===s._id||o===s._id));Re(!!l)}},[s,x]);const ps=async()=>{var t,i,l;if(!ms.current){ms.current=!0,(!s||String(s._id)!==String(a)||!Array.isArray(s.channels)||s.channels.length===0)&&(le(!0),cs(!1));try{const o=await de.get(`/api/portals/${a}`);I(o.data);try{sessionStorage.setItem(`oxypace_portal_cache_${a}`,JSON.stringify(o.data))}catch{}(t=o.data)!=null&&t.avatar&&st(o.data.avatar,"original");const c=((i=o.data)==null?void 0:i.coverImage)||((l=o.data)==null?void 0:l.banner);c&&st(c,"original");const m=[o.data.owner,...o.data.admins||[],...o.data.members||[]].filter(Boolean);Rt(m),St({name:o.data.name,description:o.data.description||"",privacy:o.data.privacy||"public"}),Q("")}catch(o){if(o.response&&o.response.status===403){const c=o.response.data;c.portalStatus==="suspended"||c.portalStatus==="closed"?(Ke({portalStatus:c.portalStatus,statusReason:c.statusReason,suspendedUntil:c.suspendedUntil,portalName:c.portalName,portalAvatar:c.portalAvatar}),Q("suspended")):Q("blocked")}else o.response&&o.response.status===404?Q("blocked"):Q("Portal yüklenemedi")}finally{ms.current=!1,le(!1)}}},us=n.useRef(null),Fs=n.useRef(U);Fs.current=U;const Je=n.useRef(_);Je.current=_;const hs=n.useCallback(async(t=!1)=>{var o,c;const i=Je.current,l=`portal_posts_${a}_${i}`;if(t)Os(!0);else{us.current&&us.current.abort(),us.current=new AbortController;let m=!1;try{const N=sessionStorage.getItem(l);if(N){const p=JSON.parse(N);Array.isArray(p)&&p.length>0&&(j(p),Ie(!1),m=!0)}}catch{}m||(Ie(!0),j([])),Cs(!0)}try{const m=localStorage.getItem("token"),N={signal:(o=us.current)==null?void 0:o.signal,...m&&{headers:{Authorization:`Bearer ${m}`}}};if(t&&i!==Je.current)return;let p=`/api/portals/${a}/posts?channel=${i}&limit=10`;const $=Fs.current;if(t&&$.length>0){const R=$[$.length-1];p+=`&before=${R.createdAt}`}const E=await de.get(p,N),w=E.data;if(E.headers&&E.headers["x-total-count"]!==void 0){const R=parseInt(E.headers["x-total-count"],10);isNaN(R)||xe(k=>({...k,[String(i)]:R}))}if(w.length<10&&Cs(!1),t)j(R=>{const k=new Set(R.map(q=>q._id)),O=w.filter(q=>!k.has(q._id));return[...R,...O]});else{j(w);try{sessionStorage.setItem(l,JSON.stringify(w.slice(0,15)))}catch{}}Q("")}catch(m){if(de.isCancel(m))return;((c=m.response)==null?void 0:c.status)===403?Q("private"):Q("Gönderiler yüklenemedi")}finally{t||Ie(!1),Os(!1),le(!1)}},[a]),[Gs,Cs]=n.useState(!0),[_s,Os]=n.useState(!1),xs=n.useRef(),wt=n.useCallback(t=>{_s||(xs.current&&xs.current.disconnect(),xs.current=new IntersectionObserver(i=>{i[0].isIntersecting&&Gs&&hs(!0)},{root:vs.current,rootMargin:"200px"}),t&&xs.current.observe(t))},[_s,Gs,hs]);n.useEffect(()=>{j([]),Cs(!0),te(null),I(null),Q(""),v(!1)},[a]);const Ct=n.useCallback(t=>{j(l=>l.filter(o=>String(o._id)!==String(t)));const i=Je.current;i&&xe(l=>({...l,[String(i)]:Math.max(0,(l[String(i)]||1)-1)}))},[j]),_t=n.useCallback((t,i)=>{if(i){j(o=>o.filter(c=>String(c._id)!==String(t)));const l=Je.current;l&&xe(o=>({...o,[String(l)]:Math.max(0,(o[String(l)]||1)-1)}))}},[j]),zt=n.useCallback(async t=>{try{const l=(await de.put(`/api/posts/${t}/pin`)).data;j(o=>o.map(m=>m._id===t?l:m).sort((m,N)=>m.isPinned===N.isPinned?new Date(N.createdAt)-new Date(m.createdAt):m.isPinned?-1:1))}catch{ae("Sabitleme işlemi başarısız","error")}},[j,ae]),Pt=async()=>{var t,i;if(!x){ae("Lütfen giriş yapın veya kaydolun!","warning");return}try{const l=localStorage.getItem("token"),o=l?{headers:{Authorization:`Bearer ${l}`}}:{};if((await de.post(`/api/portals/${a}/join`,{},o)).data.status==="joined"){Re(!0);const m=Array.isArray(x==null?void 0:x.joinedPortals)?x.joinedPortals:[],N=Array.isArray(x==null?void 0:x.portals)?x.portals:[],p=[...m.filter(w=>{var R;return((R=(w==null?void 0:w._id)||w)==null?void 0:R.toString())!==a.toString()}),s],$=[...N.filter(w=>{var R;return((R=(w==null?void 0:w._id)||w)==null?void 0:R.toString())!==a.toString()}),s],E={...x,joinedPortals:p,portals:$};W(E),I(w=>({...w,members:[...w.members||[],x._id]})),hs(),ae("Portala başarıyla katıldınız!","success")}else ae("Üyelik isteğiniz gönderildi!","info"),I(m=>({...m,isRequested:!0}))}catch(l){ae(((i=(t=l.response)==null?void 0:t.data)==null?void 0:i.message)||"Katılma başarısız","error")}},zs=(t,i)=>{if(!t||!i)return!1;const l=typeof t=="object"?t.toString():t,o=typeof i=="object"?i.toString():i;return l===o},Ws=x&&s&&s.owner&&zs(s.owner._id||s.owner,x._id),Vs=Ws||x&&s&&s.admins&&s.admins.some(t=>zs(t._id||t,x._id));if(n.useEffect(()=>{if(!(se!=null&&se.suspendedUntil)){Ee(null);return}const t=()=>{const l=new Date,c=new Date(se.suspendedUntil)-l;if(c<=0){Ee(null),window.location.reload();return}Ee({days:Math.floor(c/(1e3*60*60*24)),hours:Math.floor(c/(1e3*60*60)%24),minutes:Math.floor(c/(1e3*60)%60),seconds:Math.floor(c/1e3%60)})};t();const i=setInterval(t,1e3);return()=>clearInterval(i)},[se]),!Z&&!b)return e.jsx(Et,{to:"/",replace:!0});if(me==="suspended"&&se){const t=se.portalStatus==="suspended",i=se.suspendedUntil?new Date(se.suspendedUntil).toLocaleString("tr-TR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):null;return e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsx("div",{className:"suspension-screen",children:e.jsxs("div",{className:"suspension-card",children:[e.jsx("div",{className:"suspension-icon",children:t?"⏸️":"🔒"}),e.jsx("h1",{className:"suspension-title",children:se.portalName||"Portal"}),e.jsx("h2",{className:"suspension-subtitle",children:t?"Bu portal geçici olarak askıya alındı":"Bu portal kapatılmıştır"}),se.statusReason&&e.jsxs("div",{className:"suspension-reason",children:[e.jsx("div",{className:"suspension-reason-label",children:"Sebep"}),e.jsx("p",{children:se.statusReason})]}),t&&i&&e.jsxs("div",{className:"suspension-unlock",children:[e.jsx("div",{className:"suspension-unlock-label",children:"🔓 Erişim Açılma Tarihi"}),e.jsx("div",{className:"suspension-unlock-date",children:i}),pe&&e.jsxs("div",{className:"suspension-countdown",children:[e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(pe.days).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Gün"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(pe.hours).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saat"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(pe.minutes).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Dakika"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(pe.seconds).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saniye"})]})]})]}),e.jsxs("div",{className:"suspension-policy",children:[e.jsx("span",{children:"📋"}),e.jsxs("p",{children:["Askıya alma nedenleri, platformun ",e.jsx("strong",{children:"Politika ve Koşullar"}),"'ı kapsamında değerlendirilmektedir. Detaylı bilgi için kurallarımızı inceleyebilirsiniz."]})]}),e.jsx("button",{onClick:()=>z("/"),className:"suspension-home-btn",children:"Anasayfaya Dön"})]})})]})}return me&&me!=="suspended"?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsxs("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center",flexDirection:"column",color:"var(--text-muted)"},children:[e.jsx("div",{style:{fontSize:"3rem",marginBottom:"1rem"},children:"🚫"}),e.jsx("h2",{children:me==="blocked"?"Sonuç Bulunamadı":"Bir Hata Oluştu"}),e.jsx("p",{children:me==="blocked"?"Aradığınız portala ulaşılamıyor.":me||"Portal yüklenirken bir sorun oluştu."}),e.jsx("button",{onClick:()=>z("/"),className:"btn-save",style:{marginTop:"20px",float:"none"},children:"Anasayfaya Dön"})]})]}):ee||b||!s||!Array.isArray(s.channels)||s.channels.length===0?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsx("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center"},children:e.jsx("div",{className:"spinner"})})]}):s.isNSFW&&!Be&&!sessionStorage.getItem(`nsfw_confirmed_${a}`)?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(es,{}),e.jsx("div",{className:"nsfw-gate-overlay",children:e.jsxs("div",{className:"nsfw-gate-card",children:[e.jsx("div",{className:"nsfw-gate-icon",children:e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]})}),e.jsx("div",{className:"nsfw-gate-badge",children:"+18"}),e.jsx("h1",{className:"nsfw-gate-title",children:"Yaş Kısıtlaması"}),e.jsxs("p",{className:"nsfw-gate-desc",children:[e.jsx("strong",{children:s.name})," portalı yetişkin içerik barındırabilir. Bu portala erişmek için 18 yaşından büyük olmanız gerekmektedir."]}),e.jsxs("div",{className:"nsfw-gate-actions",children:[e.jsx("button",{className:"nsfw-gate-confirm",onClick:()=>{sessionStorage.setItem(`nsfw_confirmed_${a}`,"true"),Ne(!0)},children:"18 yaşından büyüğüm, devam et"}),e.jsx("button",{className:"nsfw-gate-cancel",onClick:()=>z(-1),children:"Geri Dön"})]}),e.jsx("p",{className:"nsfw-gate-legal",children:"Devam ederek, yaşınızın 18'den büyük olduğunu ve yetişkin içerikle ilgili yasal sorumluluğu kabul ettiğinizi onaylarsınız."})]})})]}):e.jsxs("div",{className:`app-wrapper full-height discord-layout ${Us?"voice-channel-active":""}`,children:[e.jsx(ma,{title:s.name,description:s.description||`${s.name} topluluğuna katılın.`,image:he(s.avatar),type:"website",schema:{"@context":"https://schema.org","@type":"Community",name:s.name,description:s.description,url:window.location.href,memberCount:((Qs=s.members)==null?void 0:Qs.length)||0}}),!Ss&&e.jsx(es,{}),S.show&&e.jsxs("div",{className:`app-toast ${S.type}`,children:[e.jsx("span",{className:"app-toast-icon",children:S.type==="error"?"🚫":S.type==="success"?"✅":S.type==="warning"?"⚠️":"ℹ️"}),S.message]}),e.jsxs("div",{className:`discord-split-view ${r&&g?"mobile-feed-active":""} ${Us?"voice-room-active":""} ${K?"sidebar-collapsed":""}`,children:[x&&e.jsx(ha,{portal:s,isMember:Me,canManage:Ws||Vs,onEdit:t=>{ds(typeof t=="string"?t:"overview"),Te(!0)},currentChannel:_,onChangeChannel:jt,className:`${P?"mobile-open":""} ${r&&g?"mobile-hidden":""}`,onShowPortalInfo:()=>rs(!0)}),e.jsxs("main",{className:`discord-main-content ${r&&!g?"mobile-content-hidden":""} ${Bs?"voice-channel-active":""}`,children:[r&&!g&&e.jsx(da,{title:(s==null?void 0:s.name)||"Portal",showBack:!1}),(()=>{var c,m,N,p,$,E,w,R,k,O,q,J,ue,ie,Ze,Qe;const t=Y,i=(t==null?void 0:t.type)||"text",l=(t==null?void 0:t.name)||"...",o=i==="voice"||i==="conference";return e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{display:"flex",flex:1,overflow:"hidden"},children:o?e.jsx("div",{style:{flex:1,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"},children:e.jsx(n.Suspense,{fallback:e.jsx("div",{className:"skeleton-loader",children:e.jsx("p",{children:"Canlı bağlantı odası hazırlanıyor..."})}),children:i==="conference"?e.jsx(ja,{portalId:a,channelId:_,channelName:l,onBack:()=>v(!1)}):e.jsx(va,{portalId:a,channelId:_,channelName:l,onBack:()=>v(!1)})})}):e.jsx("div",{className:"channel-messages-area",style:{flex:1,display:"flex",flexDirection:"column"},children:be?e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"},children:[e.jsx("div",{className:"spinner"}),e.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.9rem"},children:"İçerik yükleniyor..."})]}):e.jsxs(e.Fragment,{children:[!o&&e.jsxs("header",{className:`channel-top-bar ${r?"":"desktop-only"}`,children:[e.jsxs("div",{className:"channel-title-wrapper",children:[r&&e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>v(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",children:i==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",children:l}),(()=>{const u=String((t==null?void 0:t._id)||_||""),A=Le[u]!==void 0?Le[u]:(t==null?void 0:t.postCount)??0;return e.jsxs("div",{className:"channel-post-count-badge",title:`${A} Gönderi`,children:[e.jsx(Es,{size:13}),e.jsx("span",{children:A})]})})()]}),e.jsx("div",{className:"channel-header-actions",children:Me&&e.jsx("button",{className:`icon-btn ${Ce?"active":""}`,onClick:()=>d(!Ce),title:Ce?"Üyeleri Gizle":"Üyeleri Göster",style:{background:"none",border:"none",color:Ce?"var(--primary-color)":"var(--text-muted)"},children:e.jsx(Ps,{size:20})})})]}),me==="private"?e.jsx(nt,{portal:s,onClose:()=>{window.history.length>2?z(-1):z("/search")},isMobile:r,onOpenSettings:()=>{ds("overview"),Te(!0)},onJoinStatusChange:u=>{u==="requested"?I(A=>A&&{...A,isRequested:!0}):u==="joined"&&(Re(!0),Q(""),fetchPosts())}}):e.jsxs(e.Fragment,{children:[(s==null?void 0:s.alerts)&&s.alerts.length>0&&e.jsx(ga,{alerts:s.alerts}),e.jsx("div",{className:`portal-feed-container discord-feed ${ls?"tanitim-feed-mode":""}`,onScroll:vt,ref:vs,children:ls?e.jsx(fa,{}):e.jsxs(e.Fragment,{children:[U.length===0&&!ee&&e.jsxs("div",{className:"empty-portal",children:[e.jsx("div",{className:"empty-portal-icon",children:"👋"}),e.jsxs("h3",{children:[((m=(c=s==null?void 0:s.channels)==null?void 0:c.find(u=>u._id===_))==null?void 0:m.type)==="voice"?"🎙️":((p=(N=s==null?void 0:s.channels)==null?void 0:N.find(u=>u._id===_))==null?void 0:p.type)==="conference"?"🎤":((E=($=s==null?void 0:s.channels)==null?void 0:$.find(u=>u._id===_))==null?void 0:E.type)==="image"?"🖼️":"#",((R=(w=s==null?void 0:s.channels)==null?void 0:w.find(u=>String(u._id)===String(_)))==null?void 0:R.name)||"..."," ","kanalına hoş geldin!"]}),e.jsx("p",{children:"Bu kanalda henüz mesaj yok. İlk mesajı sen at!"})]}),Array.isArray(U)&&U.map((u,A)=>{var B;u.isBot===!0||((B=u.author)==null||B.isBot);const V=Lt.enableAds;return e.jsxs(n.Fragment,{children:[e.jsx($t,{post:u,onDelete:Ct,onPin:zt,onArchive:_t,isAdmin:Vs},u._id),A<U.length-1&&e.jsx("div",{className:"post-separator"}),V]},u._id)}),e.jsx("div",{ref:wt,style:{height:"40px",margin:"10px 0",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"},children:_s&&e.jsx("div",{className:"spinner-small"})})]})}),(()=>{const A=2*Math.PI*20,V=A-bt/100*A;return e.jsxs("button",{className:`floating-scroll-top portal-scroll-top ${gt?"visible":""}`,onClick:ks,"aria-label":"Yukarı Çık",children:[e.jsxs("svg",{className:"progress-ring",width:"50",height:"50",viewBox:"0 0 50 50",children:[e.jsx("circle",{className:"progress-ring-track",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25"}),e.jsx("circle",{className:"progress-ring-fill",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25",style:{strokeDasharray:A,strokeDashoffset:V}})]}),e.jsx("div",{className:"scroll-icon",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"m18 15-6-6-6 6"})})})]})})(),ls?null:pt?e.jsxs("div",{className:"channel-input-area",children:[re&&Mt.createPortal(e.jsxs("div",{className:"plus-menu portal-plus-menu-portal",ref:ut,style:{position:"fixed",top:Se.top,left:Se.left,zIndex:99999},children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Ge.current.click(),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("circle",{cx:"8.5",cy:"8.5",r:"1.5"}),e.jsx("polyline",{points:"21 15 16 10 5 21"})]})}),"Görsel"]}),!os&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Rs.current.click(),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("polygon",{points:"23 7 16 12 23 17 23 7"}),e.jsx("rect",{x:"1",y:"5",width:"15",height:"14",rx:"2",ry:"2"})]})}),"Video"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Ls.current.click(),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",style:{fontWeight:800,fontSize:"10px"},children:"GIF"}),"GIF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Ds.current.click(),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"})]})}),"PDF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{as(!Ms),X(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"}),e.jsx("polygon",{points:"9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02",fill:"currentColor"})]})}),"YouTube"]})]})]}),document.body),e.jsx("input",{type:"file",ref:Ge,onChange:kt,style:{display:"none"},accept:"image/png, image/jpeg, image/jpg, image/webp",multiple:!0}),e.jsx("input",{type:"file",ref:Rs,onChange:Ns,style:{display:"none"},accept:"video/mp4, video/webm, video/quicktime"}),e.jsx("input",{type:"file",ref:Ls,onChange:Ns,style:{display:"none"},accept:"image/gif"}),e.jsx("input",{type:"file",ref:Ds,onChange:Ns,style:{display:"none"},accept:".pdf"}),Ms&&e.jsx("div",{className:"edit-modal-overlay",style:{zIndex:9999},children:e.jsxs("div",{className:"edit-modal-modern",style:{maxWidth:"400px",height:"auto",maxHeight:"none"},children:[e.jsxs("div",{className:"edit-modal-header-modern",children:[e.jsx("div",{className:"header-left",children:e.jsx("h3",{className:"header-title-modern",children:"YouTube Videosu Ekle"})}),e.jsx("button",{onClick:()=>as(!1),className:"close-btn-modern",children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),e.jsxs("div",{className:"edit-modal-content-modern",style:{padding:"20px"},children:[e.jsxs("div",{className:"floating-label-group",children:[e.jsx("label",{className:"floating-label",children:"Video Bağlantısı"}),e.jsx("input",{type:"text",className:"floating-input",placeholder:"https://www.youtube.com/watch?v=...",value:Ue,onChange:ft,autoFocus:!0,onKeyDown:u=>{u.key==="Enter"&&(u.preventDefault(),qs())}})]}),e.jsxs("div",{style:{marginTop:"20px",display:"flex",justifyContent:"flex-end",gap:"10px"},children:[e.jsx("button",{onClick:()=>as(!1),className:"join-btn outline",style:{padding:"8px 16px"},children:"İptal"}),e.jsx("button",{onClick:qs,className:"join-btn primary",style:{padding:"8px 20px"},children:"Ekle"})]})]})]})}),G&&e.jsxs("div",{className:"input-quoted-preview",children:[e.jsxs("div",{className:"input-quoted-preview-header",children:[(O=(k=G.author)==null?void 0:k.profile)!=null&&O.avatar?e.jsx("img",{src:he(G.author.profile.avatar),alt:"",className:"quoted-preview-avatar",loading:"lazy",decoding:"async",width:"32",height:"32"}):e.jsx("div",{className:"quoted-preview-avatar-placeholder",children:(J=(q=G.author)==null?void 0:q.username)==null?void 0:J.charAt(0).toUpperCase()}),e.jsxs("div",{className:"quoted-preview-meta",children:[e.jsx("span",{className:"quoted-preview-author",children:((ie=(ue=G.author)==null?void 0:ue.profile)==null?void 0:ie.displayName)||((Ze=G.author)==null?void 0:Ze.username)}),e.jsxs("span",{className:"quoted-preview-username",children:["@",(Qe=G.author)==null?void 0:Qe.username]})]}),e.jsx("button",{className:"remove-quote-btn",onClick:()=>is(null),children:e.jsx(ss,{size:16})})]}),e.jsxs("div",{className:"input-quoted-preview-body",children:[e.jsx("p",{className:"input-quoted-preview-text",children:G.content}),G.media&&e.jsx("div",{className:"input-quoted-preview-media",children:G.mediaType==="video"?e.jsxs("div",{className:"media-placeholder",children:[e.jsx(la,{size:20}),e.jsx("span",{children:"Video Alıntısı"})]}):e.jsx("img",{src:he(G.media),alt:"",loading:"lazy",decoding:"async",width:"120",height:"80"})})]})]}),os&&fe.trim()&&!D&&e.jsxs("div",{className:"image-channel-warning",style:{backgroundColor:"rgba(239, 68, 68, 0.1)",border:"1px solid rgba(239, 68, 68, 0.25)",color:"#f87171",padding:"8px 12px",borderRadius:"8px",fontSize:"13px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{flexShrink:0},children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]}),e.jsx("span",{children:"Görsel kanallarında paylaşım yapabilmek için mutlaka bir görsel eklemelisiniz."})]}),M?e.jsxs("div",{className:"ghost-channel-notice",style:{backgroundColor:"#0c0c0c",borderTop:"1px solid #222",color:"#888",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",fontSize:"13px"},children:[e.jsxs("svg",{viewBox:"0 0 24 24",width:"18",height:"18",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{opacity:.7},children:[e.jsx("path",{d:"M12 2a5 5 0 0 0-5 5v14l3-2 2 2 2-2 3 2V7a5 5 0 0 0-5-5z"}),e.jsx("circle",{cx:"10",cy:"8",r:"1",fill:"currentColor"}),e.jsx("circle",{cx:"14",cy:"8",r:"1",fill:"currentColor"})]}),e.jsx("span",{children:"Hayalet Modu: Salt okunur izleme modundasınız. Kanalda mesaj ve gönderi paylaşılamaz."})]}):e.jsxs("div",{className:"message-input-wrapper",children:[e.jsx("button",{ref:Ye,className:`input-action-btn upload-btn ${re?"active":""}`,onClick:ht,style:{backgroundColor:"#383a40",borderRadius:"50%",width:"32px",height:"32px",marginRight:"12px",color:re?"var(--primary-color)":"#b9bbbe"},children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z"})})}),D&&e.jsxs("div",{className:"input-media-preview",style:{marginRight:"12px",display:"flex",alignItems:"center",backgroundColor:"var(--bg-secondary)",borderRadius:"8px",padding:"4px",gap:"8px",border:"1px solid var(--border-subtle)"},children:[D.type==="youtube"&&D.preview?e.jsx("img",{src:D.preview,alt:"Video Preview",style:{width:"40px",height:"30px",objectFit:"cover",borderRadius:"4px"},loading:"lazy",decoding:"async",width:"40",height:"30"}):e.jsx("span",{style:{fontSize:"20px",lineHeight:1,padding:"4px"},children:D.type.startsWith("video")?"🎥":D.type.includes("gif")?"👾":D.type==="application/pdf"||D.name&&D.name.toLowerCase().endsWith(".pdf")?"📄":"🖼️"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",maxWidth:"100px"},children:e.jsx("span",{style:{fontSize:"10px",color:"var(--text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:D.name||"Medya"})}),e.jsx("button",{onClick:()=>qe(null),style:{background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer"},children:"×"})]}),e.jsx("input",{type:"text",placeholder:os?"Gönderi paylaşmak için bir görsel ekleyin...":`#${(Y==null?void 0:Y.name)||"..."} kanalına mesaj gönder`,value:fe,onChange:u=>{Fe(u.target.value)},onKeyDown:u=>{u.key==="Enter"&&!u.shiftKey&&(u.preventDefault(),Ks())}}),e.jsx("div",{className:"input-right-actions",children:e.jsx("button",{className:"input-action-btn send-btn",onClick:Ks,disabled:$s||(os?!D&&ze.length===0:!fe.trim()&&!D&&ze.length===0),title:"Gönder",style:{color:fe.trim()||D||ze.length>0?"var(--primary-color)":"var(--text-tertiary)"},children:$s?e.jsxs("div",{className:"compose-spinner-wrapper",style:{width:"20px",height:"20px"},children:[e.jsx("div",{className:"compose-spinner",style:{width:"20px",height:"20px",borderTopColor:"var(--primary-color)"}}),e.jsxs("span",{className:"compose-progress-text",style:{fontSize:"7px",color:"var(--text-primary)"},children:[ct,"%"]})]}):e.jsx(oa,{size:20})})})]}),Ae&&Ae.length>0&&e.jsxs("div",{className:"portal-image-previews-container",children:[e.jsxs("div",{className:"portal-image-previews-header",children:[e.jsxs("span",{className:"portal-image-previews-count",children:["Seçilen Görseller (",Ae.length,"/10)"]}),Ae.length<10&&e.jsx("button",{type:"button",className:"portal-add-more-images-btn",onClick:()=>{var u;return(u=Ge.current)==null?void 0:u.click()},children:"+ Görsel Ekle"})]}),e.jsx("div",{className:"portal-image-previews-list",children:Ae.map((u,A)=>e.jsxs("div",{className:"portal-image-preview-item",children:[e.jsx("img",{src:u.url,alt:`Preview ${A+1}`,className:"portal-image-preview-thumb"}),e.jsx("button",{type:"button",className:"portal-image-remove-btn",onClick:()=>Nt(A),title:"Görseli Kaldır",children:e.jsx(ss,{size:14})}),e.jsx("span",{className:"portal-image-index-badge",children:A+1})]},A))})]}),oe&&oe.length>0&&e.jsxs("div",{className:"portal-typing-indicator",style:{marginTop:"8px"},children:[e.jsx("div",{className:"typing-avatars-group",children:oe.map(u=>e.jsx("img",{src:he(u.avatar),alt:u.displayName,className:"typing-avatar",title:u.displayName},u.userId))}),e.jsx("span",{className:"typing-text",children:oe.length===1?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," yazıyor..."]}):oe.length===2?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," ve ",e.jsx("strong",{children:oe[1].displayName})," yazıyor..."]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:oe[0].displayName})," ve ",oe.length-1," kişi daha yazıyor..."]})})]})]}):e.jsx("div",{className:"channel-input-area",style:{padding:"0 20px 24px 20px",backgroundColor:"transparent",borderTop:"none"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--glass-bg)",padding:"12px 20px",borderRadius:"8px",border:"1px solid var(--glass-border)",backdropFilter:"blur(20px) saturate(160%)",WebkitBackdropFilter:"blur(20px) saturate(160%)",boxShadow:"var(--glass-shadow)"},children:[e.jsxs("span",{style:{color:"var(--text-secondary)",fontWeight:500,fontSize:"14px"},children:["Bu kanalda mesaj göndermek için ",x?"portala katılmalısın.":"giriş yapmalısın."]}),x?e.jsx("button",{className:"privacy-join-btn",onClick:Pt,disabled:s.isRequested,style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:s.isRequested?"İstek Gönderildi":"Portala Katıl"}):e.jsx("button",{className:"privacy-join-btn",onClick:()=>z("/login"),style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:"Giriş Yap"})]})})]})]})})}),Ce&&e.jsx(xa,{members:[...s.owner?[{...s.owner,role:"owner"}]:[],...(s.admins||[]).map(u=>({...u,role:"admin"})),...s.members||[]].filter((u,A,V)=>{const B=String(u._id||u.id||u);return u&&V.findIndex(ne=>String(ne._id||ne.id||ne)===B)===A}),onClose:()=>d(!1)})]})})()]})]}),Ss&&ws!=="notifications"&&e.jsx(n.Suspense,{fallback:null,children:e.jsx(ba,{portal:s,currentUser:x,initialTab:ws,onClose:()=>Te(!1),onUpdate:t=>{I(t)}})}),Ss&&ws==="notifications"&&e.jsx("div",{className:"portal-notifications-modal",onClick:()=>Te(!1),children:e.jsxs("div",{className:"notifications-modal-content",onClick:t=>t.stopPropagation(),children:[e.jsx("button",{className:"close-notifications-btn",onClick:()=>Te(!1),children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsx(n.Suspense,{fallback:null,children:e.jsx(ya,{portalId:s._id,portalChannels:s.channels||[],onUpdate:ps})})]})}),dt&&s&&e.jsx(nt,{portal:s,onClose:()=>rs(!1),isMobile:r,onOpenSettings:()=>{rs(!1),ds("overview"),Te(!0)},onLeave:()=>{rs(!1),Re(!1),z("/")}})]})};export{Va as default};
