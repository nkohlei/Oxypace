const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PortalSettingsModal-BPpMJfh7.js","assets/vendor-DZn7Y_Ga.js","assets/index-D0-2N6nC.js","assets/socket-CPOVpB-_.js","assets/livekit-C_vxKPn8.js","assets/lucide-CV5hQB6b.js","assets/index-B7jA2iO3.css","assets/ImageCropper-Q9-67jTc.js","assets/ImageCropper-Dk7oVLRB.css","assets/PortalSettingsModal-CdjZ8JKp.css","assets/PortalNotifications-BVSkMFfU.js","assets/PortalNotifications-zEgqx9Vo.css","assets/VoiceChannel-BNTLJb5V.js","assets/VoiceChannel-DCecl7AS.js","assets/VoiceChannel-8DFSTqL9.css","assets/ConferenceChannel-49dzQHes.js"])))=>i.map(i=>d[i]);
import{r as n,a1 as e,Z as ce,a2 as ys,aq as Ws,as as ya,a5 as ja,ar as ka,a6 as Na,aa as as}from"./vendor-DZn7Y_Ga.js";import{d as ie,j as Ys,u as ts,k as Hs,f as ss,c as js,b as Gs,l as wa,a as Vs}from"./index-D0-2N6nC.js";import{u as Sa}from"./useVideoTranscoder-CGY8XvuY.js";import{P as Ca}from"./PostCard-uuWU8F37.js";import{c as za,X as Fe,aa as Pa,z as _a,W as Ia,a1 as Ta,O as Aa,_ as Ma,d as Ra,$ as Ea,az as La,aA as Da,aB as $a,aC as qa,a9 as Ua,a8 as Os,M as Ba,aD as Fa,a2 as Ka,F as Wa,q as Ga,s as Va,G as Oa,r as vs,j as Ya,aE as Zs,aq as Ha,aF as Za,aG as Ja}from"./lucide-CV5hQB6b.js";import{B as bs}from"./Badge-c06vmZZu.js";import{U as Qa}from"./UserBar-DgCI09R5.js";import{P as Xa}from"./PortalInfoModal-BHR--JSs.js";import{N as Be}from"./Navbar-XBPQ7j1i.js";import{S as et}from"./SubHeader-DQny_cIU.js";import{S as st}from"./SEO-B_SVYD4k.js";import"./socket-CPOVpB-_.js";import"./livekit-C_vxKPn8.js";import"./VideoDownloadModal-DtV7VUV8.js";import"./UserBadges-kUuiPQxb.js";import"./LinkPreview-DqNLe-36.js";import"./UserAvatar-B6bnBoiO.js";/* empty css                      *//* empty css                  */const at=({portalId:t,onClose:R})=>{const[I,u]=n.useState(""),[G,g]=n.useState([]),[V,E]=n.useState(!1),[m,U]=n.useState(new Set);n.useEffect(()=>{const N=setTimeout(async()=>{if(I.trim().length===0){g([]);return}E(!0);try{const j=await ce.get(`/api/users/search?q=${I}`);g(j.data)}catch{}finally{E(!1)}},500);return()=>clearTimeout(N)},[I]);const T=async S=>{var N,j;try{await Promise.all([ce.post(`/api/portals/${t}/invite`,{userId:S}),ce.post("/api/messages",{recipientId:S,portalId:t,content:"Seni bir portala davet ettim!"})]),U(a=>new Set(a).add(S))}catch(a){alert(((j=(N=a.response)==null?void 0:N.data)==null?void 0:j.message)||"İşlem sırasında bir hata oluştu.")}},_=()=>{const S=`${window.location.origin}/portal/${t}`;navigator.clipboard.writeText(S),alert("Davet bağlantısı kopyalandı!")};return e.jsx("div",{className:"invite-modal-overlay",onClick:R,children:e.jsxs("div",{className:"invite-modal",onClick:S=>S.stopPropagation(),children:[e.jsxs("div",{className:"invite-header",children:[e.jsx("h2",{children:"Kullanıcı Davet Et"}),e.jsxs("div",{className:"header-actions",children:[e.jsxs("button",{className:"copy-link-btn",title:"Bağlantıyı Kopyala",onClick:_,children:[e.jsx(za,{size:20,strokeWidth:2}),e.jsx("span",{children:"Bağlantı"})]}),e.jsx("button",{className:"close-btn",onClick:R,children:e.jsx(Fe,{size:24,strokeWidth:2})})]})]}),e.jsx("div",{className:"invite-search-container",children:e.jsx("input",{type:"text",className:"invite-search-input",placeholder:"Kullanıcı adı ara...",value:I,onChange:S=>u(S.target.value),autoFocus:!0})}),e.jsxs("div",{className:"invite-results custom-scrollbar",children:[V&&e.jsx("div",{className:"loading-text",children:"Aranıyor..."}),!V&&G.length===0&&I&&e.jsx("div",{className:"no-play-text",children:"Sonuç bulunamadı."}),G.map(S=>{var a;const N=S._id||S,j=m.has(N);return e.jsxs("div",{className:"invite-user-row",children:[e.jsxs("div",{className:"user-info",children:[e.jsx("img",{src:ie((a=S.profile)==null?void 0:a.avatar),alt:"",className:"user-avatar"}),e.jsx("span",{className:"user-name",children:S.username})]}),e.jsx("button",{className:`invite-btn ${j?"invited":""}`,onClick:()=>!j&&T(N),disabled:j,children:j?"Gönderildi":"Davet Et"})]},N)})]})]})})},tt=({startedAt:t,style:R={},className:I=""})=>{const{roomStartTime:u}=Ys()||{},[G,g]=n.useState("00:00");n.useEffect(()=>{const E=u&&t===u?u:t;if(!E){g("00:00");return}const m=()=>{const T=Math.floor((Date.now()-E)/1e3);if(T<0){g("00:00");return}const _=Math.floor(T/3600),S=Math.floor(T%3600/60),N=T%60;g(_>0?`${_.toString().padStart(2,"0")}:${S.toString().padStart(2,"0")}:${N.toString().padStart(2,"0")}`:`${S.toString().padStart(2,"0")}:${N.toString().padStart(2,"0")}`)};m();const U=setInterval(m,1e3);return()=>clearInterval(U)},[t,u]);const V={display:"flex",alignItems:"center",fontSize:"15px",fontWeight:"800",color:"#39FF14",background:"transparent",border:"none",padding:"0 4px"};return e.jsx("div",{style:{...V,...R},className:I,children:G})},it=({portal:t,isMember:R,onEdit:I,currentChannel:u,onChangeChannel:G,className:g,canManage:V,onShowPortalInfo:E})=>{var xe,_e,We;const{user:m}=ts(),[U,T]=n.useState(!1);ys();const _=Hs(),{isMobileView:S}=_||{},N=(_==null?void 0:_.isDesktopSidebarCollapsed)||!1,j=(_==null?void 0:_.setIsDesktopSidebarCollapsed)||(()=>{}),a=ss(l=>l.unreadPostsByChannel),p=ss(l=>l.clearUnreadForChannel),{roomStartTime:w,activeRoom:P,participants:i}=Ys(),{socket:C,onlineUsers:z}=js(),[b,D]=n.useState({}),H=l=>{if(!l)return null;if(typeof l=="string")return l;const k=l._id||l.id;return k?String(k):null},Z=new Set,Pe=H(t==null?void 0:t.owner);Pe&&Z.add(Pe),((t==null?void 0:t.admins)||[]).forEach(l=>{const k=H(l);k&&Z.add(k)}),((t==null?void 0:t.members)||[]).forEach(l=>{const k=H(l);k&&Z.add(k)});const ye=new Set((z||[]).map(l=>String(l))),X=m!=null&&m._id?String(m._id):null,J=((_e=(xe=m==null?void 0:m.settings)==null?void 0:xe.privacy)==null?void 0:_e.showOnlineStatus)!==!1;X&&Z.has(X)&&J?ye.add(X):X&&!J&&ye.delete(X);let Ke=0;Z.forEach(l=>{ye.has(l)&&Ke++});const je=Z.size||(t==null?void 0:t.membersCount)||((t==null?void 0:t.members)||[]).length||0;if(n.useEffect(()=>{u&&(t!=null&&t._id)&&p(u,t._id)},[u,t==null?void 0:t._id,p]),n.useEffect(()=>{var ae;if(!(t!=null&&t._id)||!((ae=t==null?void 0:t.channels)!=null&&ae.length))return;const l=t.channels.filter(de=>de.type==="voice"||de.type==="conference");if(l.length===0)return;let k=!0;const O=async()=>{try{const de=await Promise.all(l.map(async pe=>{var ne,Ie;const fe=pe._id||pe.id;try{const is=await ce.get(`/api/voice/rooms/${t._id}/${fe}/participants?t=${Date.now()}`);return{channelId:String(fe),count:((Ie=(ne=is.data)==null?void 0:ne.participants)==null?void 0:Ie.length)||0}}catch{return{channelId:String(fe),count:0}}}));k&&D(pe=>{const fe={...pe};return de.forEach(ne=>{fe[ne.channelId]=ne.count}),fe})}catch{}};O();const Ne=setInterval(O,1e4);return()=>{k=!1,clearInterval(Ne)}},[t==null?void 0:t._id,t==null?void 0:t.channels]),n.useEffect(()=>{if(!C)return;const l=k=>{!k||!k.channelId||k.portalId&&String(k.portalId)!==String(t==null?void 0:t._id)||D(O=>({...O,[String(k.channelId)]:Number(k.count)||0}))};return C.on("voice:channel-count-update",l),()=>{C.off("voice:channel-count-update",l)}},[C,t==null?void 0:t._id]),!t)return null;const Ce=t!=null&&t.channels?[...t.channels].sort((l,k)=>(l.order||0)-(k.order||0)).map(l=>({id:l._id,name:l.name,type:l.type||"text"})):[],me=Ce.find(l=>l.id===u),ke=(me==null?void 0:me.type)==="voice"||(me==null?void 0:me.type)==="conference";n.useEffect(()=>{!ke&&N&&j(!1)},[ke,N,j]);const $=l=>u===l;return e.jsxs("div",{className:`channel-sidebar ${N?"collapsed":""} ${g||""}`,style:{height:"calc(100% - 24px)",backgroundColor:"transparent",display:"flex",flexDirection:"column",flexShrink:0,overflow:"visible",position:"relative",borderRight:"none"},children:[!S&&ke&&e.jsx("button",{className:"sidebar-toggle-btn",onClick:l=>{l.stopPropagation(),j(!N)},title:N?"Menüyü Göster":"Menüyü Gizle",children:N?e.jsx(Pa,{size:16}):e.jsx(_a,{size:16})}),e.jsxs("div",{className:"sidebar-content-wrapper",style:{display:"flex",flexDirection:"column",flex:1,width:"100%",height:"100%",overflow:"hidden",transition:"opacity 0.2s ease, visibility 0.2s ease",opacity:N?0:1,visibility:N?"hidden":"visible",gap:"8px",padding:"0px",boxSizing:"border-box"},children:[e.jsxs("div",{className:"cs-panel cs-panel--banner",children:[e.jsxs("div",{className:"channel-banner-container",onClick:()=>E&&E(),children:[e.jsx("div",{className:"channel-banner-image",style:{backgroundImage:t.coverImage?`url(${ie(t.coverImage)})`:t.banner?`url(${ie(t.banner)})`:'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")'}}),e.jsx("div",{className:"channel-banner-overlay"})]}),e.jsxs("div",{className:"portal-quick-info",children:[e.jsxs("div",{className:"portal-info-main",onClick:()=>E&&E(),children:[e.jsxs("h2",{className:"portal-title-text",children:[t.name,e.jsx(bs,{type:t.isVerified?"verified":(We=t.badges)==null?void 0:We[0],size:16})]}),e.jsxs("div",{className:"portal-stats-row",children:[e.jsxs("div",{className:"stat-item",children:[e.jsx(Ia,{size:12}),e.jsxs("span",{children:[je," Üye"]})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:"stat-item",children:[e.jsx("div",{className:"online-indicator-dot"}),e.jsxs("span",{children:[Ke," Çevrimiçi"]})]})]})]}),e.jsxs("div",{className:"portal-header-actions",children:[(R||V)&&e.jsx("button",{className:"portal-action-btn-circle",onClick:l=>{l.stopPropagation(),I&&I("notifications")},title:"Bildirim Ayarları",children:e.jsx(Ta,{size:16})}),R&&e.jsx("button",{className:"portal-action-btn-circle",onClick:l=>{l.stopPropagation(),T(!0)},title:"Davet Et",children:e.jsx(Aa,{size:18})})]})]})]}),e.jsxs("div",{className:"cs-panel cs-panel--channels custom-scrollbar",children:[e.jsxs("div",{className:"cs-channels-header",children:[e.jsx("span",{children:"Kanallar"}),V&&e.jsx("div",{onClick:l=>{l.stopPropagation(),I&&I("channels")},className:"cs-add-channel-btn",title:"Kanal Oluştur",children:"+"})]}),e.jsx("div",{className:"cs-channel-list",children:Ce.map(l=>{var de;const k=$(l.id),O=l.type==="announcement"||l.name.includes("announcements"),Ne=l.type==="voice"||l.type==="conference";let ae=b[String(l.id)]??0;return P&&String(P.channelId)===String(l.id)&&Array.isArray(i)&&(ae=i.length),e.jsxs("div",{className:`channel-item ${k?"active":""}`,onClick:()=>G(l.id),style:{padding:"6px 8px",margin:"2px 0",borderRadius:"4px",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",color:k?"white":"#949ba4",backgroundColor:k?"#3f4147":"transparent",transition:"background-color 0.15s ease, color 0.15s ease"},children:[e.jsx("div",{style:{color:k?"white":"var(--text-secondary)",display:"flex",alignItems:"center",minWidth:"20px",justifyContent:"center"},children:l.type==="conference"?e.jsx(Ma,{size:20,strokeWidth:2}):l.type==="voice"?e.jsx(Ra,{size:20,strokeWidth:2}):O?e.jsx(Ea,{size:20,strokeWidth:2.5}):l.type==="image"?e.jsx(La,{size:20,strokeWidth:2.5,style:{color:"#f59e0b"}}):e.jsx(Da,{size:20,strokeWidth:2.5})}),e.jsx("span",{style:{fontWeight:k?600:500,fontSize:"16px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:k?"white":"var(--text-primary)",maxWidth:"fit-content"},children:l.name}),Ne&&e.jsx("span",{className:`vc-channel-active-badge ${ae>0?"online":"idle"}`,children:ae>0?`${ae} aktif`:"aktif yok"}),!k&&((de=a[l.id])==null?void 0:de.length)>0&&e.jsx("div",{style:{backgroundColor:"#f23f43",color:"white",fontSize:"11px",fontWeight:"bold",padding:"0 6px",borderRadius:"8px",minWidth:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.3)",marginLeft:"-4px",flexShrink:0},children:a[l.id].length>9?"9+":a[l.id].length}),e.jsx("div",{style:{flex:1}}),k&&Ne&&P&&String(P.channelId)===String(l.id)&&w&&e.jsx("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:e.jsx(tt,{startedAt:w,className:"vc-sidebar-timer"})})]},l.id)})})]}),e.jsxs("div",{className:"cs-panel cs-panel--userbar",children:[e.jsx(Qa,{currentChannelId:u}),e.jsx("div",{className:"cs-footer-copyright",children:"© 2026 Oxypace. Tüm hakları saklıdır."})]})]}),e.jsx("style",{children:`
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
            `}),U&&e.jsx(at,{portalId:t._id,onClose:()=>T(!1)})]})},nt=({members:t=[],onClose:R})=>{var N,j;const{onlineUsers:I}=js(),{user:u}=ts(),[,G]=n.useState(0);n.useEffect(()=>{const a=setInterval(()=>{G(p=>p+1)},6e4);return()=>clearInterval(a)},[]);const g=a=>{if(!a)return"";const p=new Date,w=new Date(a),P=Math.max(0,p-w),i=Math.floor(P/6e4);if(i<1)return"şimdi";if(i<60)return`${i}dk`;const C=Math.floor(i/60);if(C<24)return`${C}sa`;const z=Math.floor(C/24);if(z<30)return`${z}g`;const b=Math.floor(z/30);return b<12?`${b}ay`:`${Math.floor(b/12)}y`},V=a=>{if(!a)return null;if(typeof a=="string")return a;const p=a._id||a.id;return p?String(p):null},E=new Set((I||[]).map(a=>String(a))),m=u!=null&&u._id?String(u._id):null,U=((j=(N=u==null?void 0:u.settings)==null?void 0:N.privacy)==null?void 0:j.showOnlineStatus)!==!1;m&&U?E.add(m):m&&!U&&E.delete(m);const T=a=>(a==null?void 0:a.role)==="owner"?3:(a==null?void 0:a.role)==="admin"||a!=null&&a.isAdmin?2:1,_=t.filter(a=>{if(!a)return!1;const p=V(a);return p&&E.has(p)}).sort((a,p)=>{var C,z;const w=T(p)-T(a);if(w!==0)return w;const P=((C=a.profile)==null?void 0:C.displayName)||a.username||"",i=((z=p.profile)==null?void 0:z.displayName)||p.username||"";return P.localeCompare(i)}),S=t.filter(a=>{if(!a)return!1;const p=V(a);return p&&!E.has(p)}).sort((a,p)=>{var C,z;const w=T(p)-T(a);if(w!==0)return w;const P=((C=a.profile)==null?void 0:C.displayName)||a.username||"",i=((z=p.profile)==null?void 0:z.displayName)||p.username||"";return P.localeCompare(i)});return e.jsxs("div",{className:"members-sidebar custom-scrollbar",children:[e.jsxs("div",{className:"members-header-top",children:[e.jsx("h3",{children:"ÜYELER"}),R&&e.jsx("button",{onClick:R,className:"close-members-btn","aria-label":"Kapat",children:e.jsx(Fe,{size:20,strokeWidth:2})})]}),e.jsxs("div",{className:"members-category",children:["Çevrim içi — ",_.length]}),_.map((a,p)=>{var b,D,H,Z;if(!a||typeof a=="string")return null;const w=a.username||"Unknown",P=((b=a.profile)==null?void 0:b.avatar)||a.avatar,i=((D=a.profile)==null?void 0:D.displayName)||w,C=a.role==="owner",z=a.role==="admin"||a.isAdmin;return e.jsxs(Ws,{to:`/profile/${w}`,className:"member-item member-link",children:[e.jsxs("div",{className:"member-avatar-wrapper",children:[P?e.jsx("img",{src:ie(P),alt:"",className:"member-avatar"}):e.jsx("div",{className:"member-avatar-placeholder",children:((H=i[0])==null?void 0:H.toUpperCase())||((Z=w[0])==null?void 0:Z.toUpperCase())||"?"}),e.jsx("div",{className:"status-indicator online"})]}),e.jsx("div",{className:"member-info",children:e.jsxs("span",{className:"member-name active-role",style:{color:C?"#f1c40f":z?"#3498db":"#2ecc71"},children:[i,C&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!C&&z&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"})]})})]},a._id||a.id||p)}),e.jsxs("div",{className:"members-category",children:["Çevrim dışı — ",S.length]}),S.map((a,p)=>{var b,D,H,Z;if(!a||typeof a=="string")return null;const w=a.username||"Unknown",P=((b=a.profile)==null?void 0:b.avatar)||a.avatar,i=((D=a.profile)==null?void 0:D.displayName)||w,C=a.role==="owner",z=a.role==="admin"||a.isAdmin;return e.jsxs(Ws,{to:`/profile/${w}`,className:"member-item offline member-link",children:[e.jsx("div",{className:"member-avatar-wrapper",children:P?e.jsx("img",{src:ie(P),alt:"",className:"member-avatar"}):e.jsx("div",{className:"member-avatar-placeholder",style:{backgroundColor:"var(--bg-secondary)"},children:((H=i[0])==null?void 0:H.toUpperCase())||((Z=w[0])==null?void 0:Z.toUpperCase())||"?"})}),e.jsx("div",{className:"member-info",style:{flex:1},children:e.jsxs("div",{className:"member-name-row",style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("span",{className:"member-name",children:[i,C&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!C&&z&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"})]}),a.lastActive&&e.jsx("span",{className:"last-active-time",style:{fontSize:"11px",color:"var(--text-muted)"},children:g(a.lastActive)})]})})]},a._id||a.id||`offline-${p}`)}),e.jsx("style",{children:`
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
            `})]})},rt=()=>{var N,j;const{user:t,updateUser:R}=ts(),I=ys(),[u,G]=n.useState(null),[g,V]=n.useState([]),[E,m]=n.useState(!0),[U,T]=n.useState(null);n.useEffect(()=>{let a=!0;return(async()=>{try{const w=await ce.get("/api/portals/showcase");a&&w.data&&(G(w.data.globalPortal||null),V(Array.isArray(w.data.topPortals)?w.data.topPortals:[]))}catch{}finally{a&&m(!1)}})(),()=>{a=!1}},[]);const _=async(a,p)=>{var w,P,i;if(a.stopPropagation(),!t){I("/login");return}if(p.isMember){I(`/portal/${p._id}`);return}if(!(p.isRequested||U===p._id)){T(p._id);try{const z=((w=(await ce.post(`/api/portals/${p._id}/join`)).data)==null?void 0:w.status)==="requested",b=D=>!D||D._id!==p._id?D:{...D,isMember:!z,isRequested:z,memberCount:z?D.memberCount:(D.memberCount||0)+1};if((u==null?void 0:u._id)===p._id&&G(b(u)),V(D=>D.map(b)),!z&&t&&R){const D=t.joinedPortals||[];D.some(H=>(H._id||H).toString()===p._id.toString())||R({joinedPortals:[...D,p],portals:[...t.portals||[],p]})}}catch(C){alert(((i=(P=C.response)==null?void 0:P.data)==null?void 0:i.message)||"İşlem gerçekleştirilemedi.")}finally{T(null)}}},S=a=>a!=null&&a.banner?`url(${ie(a.banner)}) center/cover no-repeat`:"#141414";return e.jsxs("div",{className:"tanitim-showcase-wrapper",children:[e.jsxs("section",{className:"tanitim-guide-card",children:[e.jsxs("div",{className:"tanitim-guide-header",children:[e.jsxs("div",{className:"tanitim-guide-tag",children:[e.jsx($a,{size:13}),e.jsx("span",{children:"SİSTEM DİREKTİFİ // RESMİ PLATFORM REHBERİ"})]}),e.jsx("h1",{className:"tanitim-guide-title",children:"Oxypace İletişim Protokolü & Kullanım Mimarisi"}),e.jsx("p",{className:"tanitim-guide-lead",children:"Özgür, sansürsüz, yüksek performanslı ve gizlilik odaklı yeni nesil topluluk ekosistemi. Arayüz haritasını ve platformun tüm gelişmiş yeteneklerini aşağıdaki yönergelerden inceleyin."})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// NAVİGASYON VE MENÜ YERLEŞİMİ"}),e.jsx("h2",{className:"sub-section-title",children:"Sayfa Yapısı & Arayüz Konumlandırması"})]}),e.jsxs("div",{className:"tanitim-nav-map-grid",children:[e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(qa,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ SOL NAVİGASYON BARI ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Ana Gezinme Çubuğu"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Doğrudan Mesajlar (DM):"})," Birebir şifreli özel yazışmalar ve anlık bildirim kutusu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portallar Listesi:"})," Üye olduğunuz veya yönettiğiniz tüm portalların dikey simgeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Keşfet Pusulası:"})," Yeni toplulukları, popüler portalları ve kişileri arama alanı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Oluştur (+):"})," Saniyeler içinde kendi özgür topluluğunuzu kurma aracı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kimlik & Hızlı Ayar:"})," En altta mikrofon, kulaklık ve profil hızlı kontrolleri."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(Ua,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ PORTAL İÇİ MENÜ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Kanal Hiyerarşisi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Kimliği:"})," Özel afiş, doğrulanmış rozet ve çevrimiçi üye göstergeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Metin Kanalları (#):"})," Tematik konulara göre ayrılmış gönderi ve tartışma akışları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Ses Kanalları (🎙️):"})," Tek dokunuşla girilebilen, gecikmesiz canlı ses odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Sahne Kanalları (🎤):"})," Seminer, podcast ve etkinlikler için konuşmacı odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Yönetimi:"})," Yöneticiler için yeni kanallar açma ve gizlilik kilidi."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(Os,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ ÜST DENETİM & AKIŞ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"İçerik & Üye Denetimi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Üst Başlığı:"})," Aktif kanal adı, açıklaması ve hızlı üye paneli butonu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Üye Listesi Paneli:"})," Sağ tarafta çevrimiçi yöneticiler ve aktif üyeler."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Görsel Akış Alanı:"})," 4K videolar, çoklu galeriler ve doküman önizlemeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Bildirim Zil İkonu:"})," Kanal ve portal bazlı bildirim filtreleme ayarları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Ayarları:"})," Portal sahibi ve yöneticileri için tam yönetim konsolu."]})]})]})]})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// GELİŞMİŞ SİSTEM DİREKLERİ"}),e.jsx("h2",{className:"sub-section-title",children:"Platform Mekanizmaları & Özellikler"})]}),e.jsxs("div",{className:"tanitim-pillars-grid",children:[e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"01"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Ba,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Gelişmiş Mesaj Mekanizması"}),e.jsx("p",{className:"pillar-text",children:"Markdown formatlama, tek tıkla alıntılı yanıtlama (quote reply), kullanıcıyı doğrudan haberdar eden @etiketleme sistemi ve akıllı bağlantı (link preview) ayrıştırma desteği."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Alıntılı Yanıt"}),e.jsx("span",{className:"pillar-tag",children:"@Bahsetmeler"}),e.jsx("span",{className:"pillar-tag",children:"Mesaj Sabitleme"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"02"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Fa,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Canlı Ses Odaları & Sahne Modu"}),e.jsx("p",{className:"pillar-text",children:"Ultra düşük gecikmeli WebRTC ses mimarisi. Herkesin serbestçe katılabildiği sohbet odaları ile seminer ve konferanslar için konuşmacı-dinleyici ayrımı ve el kaldırma desteği sunan Sahne kanalları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Gecikme"}),e.jsx("span",{className:"pillar-tag",children:"Sahne Hiyerarşisi"}),e.jsx("span",{className:"pillar-tag",children:"Arka Planda Ses"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"03"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Ka,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Mobil Ekosistem & PIP Video"}),e.jsx("p",{className:"pillar-text",children:"Yerel Android APK ve tam uyumlu PWA deneyimi. Canlı FCM Push bildirimleri, mobil veri tasarrufu modu ve gezinirken köşede kesintisiz oynayan Kayan Resim İçinde Resim (PIP) video motoru."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Android APK / PWA"}),e.jsx("span",{className:"pillar-tag",children:"Canlı PIP Oynatıcı"}),e.jsx("span",{className:"pillar-tag",children:"FCM Push Bildirim"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"04"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Wa,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Ultra-HD Medya & Transcoding"}),e.jsx("p",{className:"pillar-text",children:"İstemci içi WASM motoru ile 360p'den 4K'ya kadar otomatik optimize edilen video akışı. Tek gönderide 10 adede kadar yüksek kaliteli fotoğraf galerisi ve tek tıkla önizlenebilir PDF dokümanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"4K Video Transcoding"}),e.jsx("span",{className:"pillar-tag",children:"10'lu Görsel Galerisi"}),e.jsx("span",{className:"pillar-tag",children:"PDF Doküman Desteği"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"05"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Os,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Özelleştirilebilir Sistemler & Temalar"}),e.jsx("p",{className:"pillar-text",children:"Saf OLED siyahı ve yüksek kontrastlı Aydınlık tema desteği. Kişisel profil afişi, biyografi ve avatar özelleştirmeleri. Portallar için özel roller, izin matrisleri ve gizlilik kalkanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"OLED Siyah & Açık Tema"}),e.jsx("span",{className:"pillar-tag",children:"Rol & Yetki Matrisi"}),e.jsx("span",{className:"pillar-tag",children:"Özel Profil Afişi"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"06"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Ga,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Kripto-Güvenlik & Sıfır Takip"}),e.jsx("p",{className:"pillar-text",children:"Sıfır veri madenciliği ve ticari profil koruması. IP ve aktif cihaz oturum denetimi, güvenlik anahtarları ile hesap kurtarma ve doğrulanmış resmi topluluk rozetleri."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Veri İzleme"}),e.jsx("span",{className:"pillar-tag",children:"Cihaz & Oturum Denetimi"}),e.jsx("span",{className:"pillar-tag",children:"Onay Rozetleri"})]})]})]})]})]}),u&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ MERKEZ TOPLULUK // 01 ]"}),e.jsx("span",{className:"section-badge",children:"EN POPÜLER PORTAL"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Oxypace Global"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"Platformun en geniş üye kitlesine sahip resmi ana iletişim merkezi."})]}),e.jsxs("div",{className:"oxypace-global-hero-card",onClick:()=>I(`/portal/${u._id}`),children:[e.jsxs("div",{className:"hero-card-banner",style:{background:S(u)},children:[e.jsx("div",{className:"hero-banner-overlay"}),e.jsx("div",{className:"hero-banner-badge",children:e.jsx("span",{children:"ANA TOPLULUK"})})]}),e.jsxs("div",{className:"hero-card-body",children:[e.jsxs("div",{className:"hero-header-row",children:[e.jsx("div",{className:"hero-avatar-box",children:u.avatar?e.jsx("img",{src:ie(u.avatar),alt:u.name,className:"hero-avatar-img"}):e.jsx("div",{className:"hero-avatar-fallback",children:((j=(N=u.name)==null?void 0:N.substring(0,2))==null?void 0:j.toUpperCase())||"OG"})}),e.jsxs("div",{className:"hero-identity-col",children:[e.jsxs("div",{className:"hero-name-row",children:[e.jsx("h3",{className:"hero-portal-name",children:u.name}),e.jsx(bs,{type:u.isVerified?"verified":"official",size:18}),e.jsx("span",{className:"hero-privacy-tag",children:u.privacy==="private"?e.jsxs(e.Fragment,{children:[e.jsx(Va,{size:11})," GİZLİ"]}):e.jsxs(e.Fragment,{children:[e.jsx(Oa,{size:11})," HERKESE AÇIK"]})})]}),e.jsx("div",{className:"hero-meta-row",children:e.jsxs("div",{className:"hero-member-stat",children:[e.jsx(vs,{size:14}),e.jsxs("span",{children:[(u.memberCount||0).toLocaleString("tr-TR")," Üye"]})]})})]}),e.jsx("div",{className:"hero-action-col",children:e.jsx("button",{type:"button",className:`tanitim-sharp-btn hero-btn ${u.isMember?"btn-joined":u.isRequested?"btn-requested":"btn-action"}`,onClick:a=>_(a,u),disabled:U===u._id||u.isRequested,children:U===u._id?"İŞLENİYOR...":u.isMember?e.jsxs(e.Fragment,{children:[e.jsx(Ya,{size:14}),"ÜYESİNİZ"]}):u.isRequested?e.jsxs(e.Fragment,{children:[e.jsx(Zs,{size:14}),"İSTEK GÖNDERİLDİ"]}):u.privacy==="private"?"ÜYELİK İSTEĞİ GÖNDER":"PORTALA KATIL"})})]}),e.jsx("p",{className:"hero-description",children:u.description||"Oxypace platformunun ana buluşma noktası. Güncel duyurular, teknik tartışmalar ve küresel topluluk etkileşimi."})]})]})]}),g.length>0&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ AKTİF TOPLULUKLAR // 02 ]"}),e.jsx("span",{className:"section-badge",children:"ÖNE ÇIKAN PORTALLAR"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Popüler Topluluklar"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"En çok paylaşıma ve aktif etkileşime sahip seçkin portallar."})]}),e.jsx("div",{className:"tanitim-portals-row",children:g.map(a=>{var p,w,P;return e.jsxs("div",{className:"tanitim-classic-card",onClick:()=>I(`/portal/${a._id}`),children:[e.jsx("div",{className:"classic-card-banner",style:{background:S(a)},children:e.jsx("div",{className:"classic-banner-overlay"})}),e.jsx("div",{className:"classic-card-icon-wrapper",children:a.avatar?e.jsx("img",{src:ie(a.avatar),alt:a.name,className:"classic-card-icon-img",loading:"lazy"}):e.jsx("div",{className:"classic-card-icon-placeholder",children:((w=(p=a.name)==null?void 0:p.substring(0,2))==null?void 0:w.toUpperCase())||"P"})}),e.jsxs("div",{className:"classic-card-body",children:[e.jsxs("div",{className:"classic-card-title-row",children:[e.jsx("h4",{className:"classic-card-title",children:a.name}),e.jsx(bs,{type:a.isVerified?"verified":(P=a.badges)==null?void 0:P[0],size:16})]}),e.jsx("p",{className:"classic-card-desc",children:a.description||"Bu topluluk hakkında henüz bir açıklama girilmemiş."}),e.jsxs("div",{className:"classic-card-footer",children:[e.jsxs("div",{className:"classic-member-count",children:[e.jsx(vs,{size:12}),e.jsxs("span",{children:[a.memberCount||0," Üye"]})]}),e.jsx("button",{type:"button",className:`tanitim-sharp-btn small-btn ${a.isMember?"btn-joined":a.isRequested?"btn-requested":"btn-action"}`,onClick:i=>_(i,a),disabled:U===a._id||a.isRequested,children:U===a._id?"...":a.isMember?"ÜYESİNİZ":a.isRequested?"İSTEK":a.privacy==="private"?"İSTEK AT":"KATIL"})]})]})]},a._id)})})]})]})},lt=({alerts:t=[]})=>{const[R,I]=n.useState(()=>{try{const m=sessionStorage.getItem("dismissed_portal_alerts");return m?JSON.parse(m):[]}catch{return[]}}),[u,G]=n.useState(null),g=t.filter(m=>!R.includes(m._id)),V=m=>{G(m),setTimeout(()=>{const U=[...R,m];I(U);try{sessionStorage.setItem("dismissed_portal_alerts",JSON.stringify(U))}catch{}G(null)},300)},E=m=>{const U=new Date,_=new Date(m)-U;if(_<=0)return null;const S=Math.floor(_/(1e3*60*60*24)),N=Math.floor(_/(1e3*60*60)%24),j=Math.floor(_/(1e3*60)%60);return S>0?`${S} gün ${N} saat kaldı`:N>0?`${N} saat ${j} dk kaldı`:`${j} dakika kaldı`};return g.length===0?null:e.jsx(e.Fragment,{children:g.map(m=>e.jsx("div",{className:`portal-alert-banner ${u===m._id?"dismissing":""}`,children:e.jsxs("div",{className:"alert-banner-inner",children:[e.jsx("div",{className:"alert-banner-icon",children:e.jsx(Ha,{size:18,strokeWidth:2})}),e.jsxs("div",{className:"alert-banner-content",children:[e.jsx("div",{className:"alert-banner-label",children:e.jsx("span",{children:"Yönetici Uyarısı"})}),e.jsx("div",{className:"alert-banner-message",children:m.message}),e.jsx("div",{className:"alert-banner-meta",children:e.jsxs("span",{className:"alert-banner-time",children:[e.jsx(Zs,{size:16,strokeWidth:2}),E(m.expiresAt)||"Süresi dolmak üzere"]})})]}),e.jsx("button",{className:"alert-banner-close",onClick:()=>V(m._id),title:"Uyarıyı gizle",children:e.jsx(Fe,{size:16,strokeWidth:2.5})})]})},m._id))})},ot=n.lazy(()=>as(()=>import("./PortalSettingsModal-BPpMJfh7.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9]))),ct=n.lazy(()=>as(()=>import("./PortalNotifications-BVSkMFfU.js"),__vite__mapDeps([10,1,2,3,4,5,6,11]))),dt=n.lazy(()=>as(()=>import("./VoiceChannel-BNTLJb5V.js"),__vite__mapDeps([12,1,4,2,3,5,6,13,14]))),mt=n.lazy(()=>as(()=>import("./ConferenceChannel-49dzQHes.js"),__vite__mapDeps([15,1,4,2,3,5,6,13,14]))),Et=()=>{var Bs,Fs,Ks;const{id:t}=ya(),R=ja(),[I]=ka(),u=I.get("channel"),G=I.get("post"),{user:g,updateUser:V,loading:E}=ts(),{socket:m,connected:U}=js(),T=ys(),_=Hs(),{isSidebarOpen:S,closeSidebar:N,isMobileView:j,mobileChannelOpen:a,setMobileChannelOpen:p}=_||{},w=(_==null?void 0:_.isDesktopSidebarCollapsed)||!1,P=typeof window<"u"&&!!localStorage.getItem("admin_backup_token"),[i,C]=n.useState(null),z=ss(s=>s.posts),b=ss(s=>s.setPosts),[D,H]=n.useState(!0),[Z,Pe]=n.useState(!1),[ye,X]=n.useState(""),[J,Ke]=n.useState(null),[je,Ce]=n.useState(null),[me,ke]=n.useState(!1),[$,xe]=n.useState(null),[_e,We]=n.useState(!1),[l,k]=n.useState(""),[O,Ne]=n.useState([]);n.useRef(null);const[ae,de]=n.useState(!1),[pe,fe]=n.useState(!1),[ne,Ie]=n.useState({show:!1,message:"",type:"info"}),[is,Js]=n.useState(!1),[Te,re]=n.useState(!1),[ks,Ns]=n.useState({top:0,left:0}),[ns,ws]=n.useState(""),[Ss,Ge]=n.useState(!1),Ae=n.useRef(null),Cs=n.useRef(null),zs=n.useRef(null),Ps=n.useRef(null),[A,ze]=n.useState(null),[ve,Me]=n.useState([]),[we,Re]=n.useState([]),[K,Ve]=n.useState(null),[Qs,Ee]=n.useState(0),[_s,rs]=n.useState(!1),Oe=n.useRef(!1);Sa();const ge=Gs(s=>s.activeUploads)[`portal-${t}`];n.useEffect(()=>{ge&&ge.status==="uploading"&&b(s=>s.map(r=>r.isOptimistic&&r.mediaType==="video"?{...r,uploadProgress:ge.progress}:r))},[ge==null?void 0:ge.progress,ge==null?void 0:ge.status]);const[Xs,ls]=n.useState(!1),Ye=!!(i!=null&&i.name&&/Oxypace Tan[ıi]t[ıi]m/i.test(i.name)),ea=!!(g&&(((Bs=g.username)==null?void 0:Bs.toLowerCase())==="oxypace"||g.isAdmin)),sa=Ye?ea:g&&me,aa=n.useRef(null),Le=n.useRef(null),ta=n.useCallback(s=>{s.preventDefault(),s.stopPropagation(),re(r=>{if(!r&&Le.current){const o=Le.current.getBoundingClientRect();Ns({top:o.bottom+8,left:o.left})}return!r})},[]);n.useEffect(()=>{if(!Te)return;let s=!0;const r=()=>{if(Le.current){const d=Le.current.getBoundingClientRect();Ns({top:d.bottom+8,left:d.left})}},o=d=>{if(!s)return;const f=d.target.closest(".plus-menu")||d.target.closest(".portal-plus-menu-portal"),y=d.target.closest(".upload-btn");!f&&!y&&re(!1)},c=setTimeout(()=>{s&&(document.addEventListener("click",o),document.addEventListener("touchstart",o))},0);return window.addEventListener("scroll",r,!0),window.addEventListener("resize",r),()=>{s=!1,clearTimeout(c),document.removeEventListener("click",o),document.removeEventListener("touchstart",o),window.removeEventListener("scroll",r,!0),window.removeEventListener("resize",r)}},[Te]),n.useEffect(()=>()=>{re(!1)},[]),n.useEffect(()=>{re(!1)},[$,t]),n.useEffect(()=>{var s;(s=R.state)!=null&&s.quotedPost&&(Ve(R.state.quotedPost),R.state.selectedChannelId&&xe(R.state.selectedChannelId),T(R.pathname+R.search,{replace:!0,state:{}}))},[R.state,t]);const te=(Fs=i==null?void 0:i.channels)==null?void 0:Fs.find(s=>s._id===$),He=(te==null?void 0:te.type)==="image",Is=(te==null?void 0:te.type)==="voice"||(te==null?void 0:te.type)==="conference",Ts=Is&&(!j||a);n.useEffect(()=>{if(!m||!U||!t)return;m.emit("join_portal",t),m.emit("get_online_users"),$&&m.emit("join_channel",$);const s=d=>{var M,B;const f=((M=d.portal)==null?void 0:M._id)||d.portal,y=((B=d.channel)==null?void 0:B._id)||d.channel,h=String(f)===String(t),W=String(y)===String($);h&&W&&b(Q=>{if(Q.some(L=>L._id===d._id))return Q;const v=d.quotedPost&&(typeof d.quotedPost=="string"?d.quotedPost:d.quotedPost._id);if(v){const L=Q.find(ue=>ue._id===v);L&&typeof L=="object"&&L.author?d.quotedPost=L:K&&v===K._id&&(d.quotedPost=K)}return[d,...Q]})},r=d=>{var h;const f=((h=d.portal)==null?void 0:h._id)||d.portal;(!f||String(f)===String(t))&&b(W=>W.map(M=>String(M._id)===String(d._id)?d:M))},o=({userId:d,status:f,lastActive:y})=>{f==="offline"&&Ne(h=>h.filter(W=>String(W.userId)!==String(d))),C(h=>{if(!h)return h;const W=y||new Date;let M=h.owner;if(h.owner){const v=h.owner._id||h.owner.id||h.owner;String(v)===String(d)&&typeof h.owner=="object"&&(M={...h.owner,lastActive:W})}let B=h.admins;Array.isArray(h.admins)&&(B=h.admins.map(v=>{const L=v._id||v.id||v;return String(L)===String(d)&&typeof v=="object"&&v!==null?{...v,lastActive:W}:v}));let Q=h.members;return Array.isArray(h.members)&&(Q=h.members.map(v=>{const L=v._id||v.id||v;return String(L)===String(d)&&typeof v=="object"&&v!==null?{...v,lastActive:W}:v})),{...h,owner:M,admins:B,members:Q}})},c=({userId:d,username:f,displayName:y,avatar:h,isTyping:W})=>{String(d)!==String(g==null?void 0:g._id)&&Ne(M=>W?M.some(B=>String(B.userId)===String(d))?M:[...M,{userId:d,username:f,displayName:y,avatar:h}]:M.filter(B=>String(B.userId)!==String(d)))};return m.on("post:created",s),m.on("post:updated",r),m.on("user_status_change",o),m.on("portal_typing_update",c),()=>{m.off("post:created",s),m.off("post:updated",r),m.off("user_status_change",o),m.off("portal_typing_update",c)}},[m,U,t,$,g==null?void 0:g._id]);const ia=s=>{if(!s)return null;const r=/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,o=s.match(r);return o&&o[2].length===11?o[2]:null},na=s=>{const r=s.target.value;ws(r)},As=()=>{const s=ia(ns);if(!s){ee("Geçersiz YouTube URL'si","error");return}ze({name:"YouTube Video",type:"youtube",preview:`https://img.youtube.com/vi/${s}/hqdefault.jpg`,url:ns}),Ge(!1),ws("")},[ra,os]=n.useState(!1),[la,oa]=n.useState(0),cs=n.useRef(null),ds=n.useRef(null),De=n.useRef(null),ca=n.useCallback(s=>{const r=s.target;ds.current||(ds.current=requestAnimationFrame(()=>{ds.current=null;const o=r.scrollTop,c=o>300;os(f=>f!==c?c:f);const d=r.scrollHeight-r.clientHeight;if(d>0){const f=Math.round(o/d*100);oa(y=>Math.abs(y-f)>=2?f:y)}}))},[]),da=n.useCallback(s=>{s&&(s.preventDefault(),s.stopPropagation()),De.current&&cancelAnimationFrame(De.current);const r=cs.current||document.querySelector(".discord-feed")||document.querySelector(".portal-feed-container");if(!r){window.scrollTo({top:0,behavior:"smooth"});return}const o=r.scrollTop;if(o<=0)return;const c=800,d=performance.now(),f=h=>1-Math.pow(1-h,5),y=h=>{const W=h-d,M=Math.min(W/c,1),B=f(M);r.scrollTop=Math.round(o*(1-B)),M<1?De.current=requestAnimationFrame(y):(r.scrollTop=0,De.current=null)};De.current=requestAnimationFrame(y)},[]),ma=s=>{xe(s),os(!1),j&&(N(),p(!0))},ee=n.useCallback((s,r="info")=>{Ie({show:!0,message:s,type:r}),setTimeout(()=>Ie(o=>({...o,show:!1})),4e3)},[]),pa=s=>{const r=Array.from(s.target.files||[]);if(r.length===0)return;ze(null),Oe.current=!1;const c=10-ve.length;if(c<=0){ee("Bir gönderiye en fazla 10 görsel ekleyebilirsiniz.","warning");return}const d=r.slice(0,c);r.length>c&&ee(`En fazla 10 görsel ekleyebilirsiniz. İlk ${c} görsel eklendi.`,"warning");const f=[],y=[];for(const h of d){if(h.size>2*1024*1024*1024){ee(`${h.name} boyutu 2 GB'dan büyük olamaz.`,"error");continue}f.push(h),y.push({url:URL.createObjectURL(h),name:h.name,size:h.size,file:h})}Me(h=>[...h,...f]),Re(h=>[...h,...y]),re(!1),Ae.current&&(Ae.current.value="")},ua=s=>{Me(r=>r.filter((o,c)=>c!==s)),Re(r=>{const o=r[s];if(o&&o.url&&o.url.startsWith("blob:"))try{URL.revokeObjectURL(o.url)}catch{}return r.filter((c,d)=>d!==s)})},ms=s=>{const r=s.target.files[0];if(r){if(r.size>2*1024*1024*1024){ee("Dosya boyutu 2 GB'dan büyük olamaz.","error");return}Me([]),Re([]),ze(r),Oe.current=r.type.startsWith("video/")||["mp4","webm","ogg","mov","m4v"].includes(r.name.split(".").pop().toLowerCase()),re(!1)}};n.useEffect(()=>{P||!m||!t||(l.trim().length>0||A!==null||ve.length>0?ae||(de(!0),m.emit("portal_typing",{portalId:t,isTyping:!0})):ae&&(m.emit("portal_typing",{portalId:t,isTyping:!1}),de(!1)))},[l,A,ve,t,m,ae,P]),n.useEffect(()=>()=>{!P&&m&&t&&ae&&m.emit("portal_typing",{portalId:t,isTyping:!1})},[t,m,ae,P]);const Ms=async()=>{var B,Q;if(P){ee("Hayalet Modu: Salt okunur izleme modundasınız. Gönderi paylaşılamaz.","error");return}const s=l.trim().length>0,r=!!A,o=ve.length>0;if(!s&&!r&&!o)return;m&&t&&m.emit("portal_typing",{portalId:t,isTyping:!1}),de(!1);const c={content:l,media:A,mediaFiles:[...ve],mediaPreviews:[...we]},d=A&&A.type==="youtube",f=`temp-${Date.now()}`;let y=null,h=null;d?(y=A.url,h="youtube"):o?(y=we.map(v=>v.url),h="image"):A&&(y=URL.createObjectURL(A),h=A.type.startsWith("video")?"video":A.type.includes("gif")?"gif":"image");const W=h==="video",M={_id:f,content:l,media:y,mediaType:h||"none",author:g,createdAt:new Date().toISOString(),likes:[],likeCount:0,isOptimistic:!0,quotedPost:K,isProcessing:!!W,processingProgress:0,estimatedTime:W?"Hesaplanıyor...":""};b(v=>[M,...v]),k(""),ze(null),Me([]),Re([]),re(!1),rs(!0),Ee(0);try{let v=null,L=null,ue=null,Se=null,es=null;if(d)ue=c.media.url,Se="youtube";else if(c.mediaFiles&&c.mediaFiles.length>0){const x=c.mediaFiles.length,q=new Array(x).fill(0),Y=c.mediaFiles.map((F,se)=>Vs(F,"post",t,Ue=>{q[se]=Ue;const oe=Math.round(q.reduce((he,be)=>he+be,0)/x);Ee(oe),b(he=>he.map(be=>String(be._id)===String(f)?{...be,uploadProgress:oe}:be))}));L=await Promise.all(Y)}else if(c.media)if(Oe.current){Gs.getState().startVideoUpload({file:c.media,portalId:t,channel:$,content:c.content,quotedPostId:K==null?void 0:K._id,onFinish:(x,q)=>{if(x)b(Y=>Y.filter(F=>String(F._id)!==String(f))),ee("Video yükleme başarısız oldu.","error");else if(q){const Y=String(f);b(F=>{const se=String(q._id);return F.some(oe=>String(oe._id)===se)?F.filter(oe=>String(oe._id)!==Y):F.map(oe=>{if(String(oe._id)===Y){const he=q,be=he.quotedPost&&(typeof he.quotedPost=="string"?he.quotedPost:he.quotedPost._id);return be&&oe.quotedPost&&be===oe.quotedPost._id&&(he.quotedPost=oe.quotedPost),he}return oe})})}}}),rs(!1),Ve(null);return}else v=await Vs(c.media,"post",t,x=>{Ee(x),b(q=>q.map(Y=>String(Y._id)===String(f)?{...Y,uploadProgress:x}:Y))});else Ee(100);const le={content:c.content,portalId:t,channel:$,quotedPostId:K==null?void 0:K._id};L&&L.length>0?(le.mediaKeys=L,le.mediaType="image"):v?(le.mediaKey=v,Oe.current?le.mediaType="video":c.media&&(c.media.type==="application/pdf"||c.media.name.toLowerCase().endsWith(".pdf"))&&(le.pdfName=c.media.name,le.pdfSize=c.media.size)):ue&&(le.media=ue,le.mediaType=Se);const $e=await ce.post("/api/posts",le);Ve(null);const qe=String(f);b(x=>{const q=String($e.data._id);return x.some(F=>String(F._id)===q)?x.filter(F=>String(F._id)!==qe):x.map(F=>{if(String(F._id)===qe){const se=$e.data,Ue=se.quotedPost&&(typeof se.quotedPost=="string"?se.quotedPost:se.quotedPost._id);return Ue&&F.quotedPost&&Ue===F.quotedPost._id&&(se.quotedPost=F.quotedPost),se}return F})})}catch(v){const L=((Q=(B=v.response)==null?void 0:B.data)==null?void 0:Q.message)||v.message;ee(L,"error"),b(ue=>ue.filter(Se=>String(Se._id)!==String(f))),k(c.content),ze(c.media),Me(c.mediaFiles||[]),Re(c.mediaPreviews||[])}finally{rs(!1),Ee(0)}},[ps,Ze]=n.useState(!1),[us,ha]=n.useState("overview"),[ut,ht]=n.useState(!1),[xt,xa]=n.useState({name:"",description:"",privacy:"public"});n.useRef(null),n.useRef(null),n.useEffect(()=>{t&&!E&&Rs()},[t,E]),n.useEffect(()=>{if(!E&&i&&i.channels&&i.channels.length>0)if($){if(!i.channels.some(r=>String(r._id)===String($))){const r=i.channels.find(o=>o.name==="genel"||o.name==="general")||i.channels[0];r&&xe(r._id)}}else{if(u){const r=i.channels.find(o=>String(o._id)===String(u));if(r){xe(r._id);return}}const s=i.channels.find(r=>r.name==="genel"||r.name==="general")||i.channels[0];s&&xe(s._id)}},[i,E]),n.useLayoutEffect(()=>{const s=!!u||I.get("joinVoice")==="true";return p&&p(!!s),()=>{p&&p(!1)}},[t,u,I,p]),n.useEffect(()=>{t&&$&&i&&gs(i._id,t)&&Qe()},[t,$,i==null?void 0:i._id]),n.useEffect(()=>{if(G&&!_e&&!Z&&Array.isArray(z)&&z.length>0){const s=document.getElementById(`post-${G}`);s&&setTimeout(()=>{s.scrollIntoView({behavior:"smooth",block:"center"}),s.classList.add("highlight-post"),setTimeout(()=>s.classList.remove("highlight-post"),2e3),We(!0)},100)}},[G,z,Z,_e]),n.useEffect(()=>{var s,r;if(i&&g){const o=((s=i.members)==null?void 0:s.includes(g._id))||((r=g.joinedPortals)==null?void 0:r.some(c=>c._id===i._id||c===i._id));ke(!!o)}},[i,g]);const Rs=async()=>{(!i||i._id!==t)&&(H(!0),os(!1));try{const s=await ce.get(`/api/portals/${t}`);C(s.data),xa({name:s.data.name,description:s.data.description||"",privacy:s.data.privacy||"public"})}catch(s){if(s.response&&s.response.status===403){const r=s.response.data;r.portalStatus==="suspended"||r.portalStatus==="closed"?(Ke({portalStatus:r.portalStatus,statusReason:r.statusReason,suspendedUntil:r.suspendedUntil,portalName:r.portalName,portalAvatar:r.portalAvatar}),X("suspended")):X("blocked")}else s.response&&s.response.status===404?X("blocked"):X("Portal yüklenemedi")}finally{H(!1)}},Je=n.useRef(null),Es=n.useRef(z);Es.current=z;const hs=n.useRef($);hs.current=$;const Qe=n.useCallback(async(s=!1)=>{var r,o;s?Ds(!0):(Je.current&&Je.current.abort(),Je.current=new AbortController,Pe(!0),b([]),xs(!0));try{const c=localStorage.getItem("token"),d={signal:(r=Je.current)==null?void 0:r.signal,...c&&{headers:{Authorization:`Bearer ${c}`}}},f=hs.current;if(s&&f!==hs.current)return;let y=`/api/portals/${t}/posts?channel=${f}&limit=10`;const h=Es.current;if(s&&h.length>0){const B=h[h.length-1];y+=`&before=${B.createdAt}`}const M=(await ce.get(y,d)).data;M.length<10&&xs(!1),b(s?B=>{const Q=new Set(B.map(L=>L._id)),v=M.filter(L=>!Q.has(L._id));return[...B,...v]}:M),X("")}catch(c){if(ce.isCancel(c))return;((o=c.response)==null?void 0:o.status)===403?X("private"):X("Gönderiler yüklenemedi")}finally{s||Pe(!1),Ds(!1),H(!1)}},[t]),[Ls,xs]=n.useState(!0),[fs,Ds]=n.useState(!1),Xe=n.useRef(),fa=n.useCallback(s=>{fs||(Xe.current&&Xe.current.disconnect(),Xe.current=new IntersectionObserver(r=>{r[0].isIntersecting&&Ls&&Qe(!0)},{root:cs.current,rootMargin:"200px"}),s&&Xe.current.observe(s))},[fs,Ls,Qe]);n.useEffect(()=>{b([]),xs(!0),xe(null),C(null),X(""),p(!1)},[t]);const ga=n.useCallback(s=>{b(r=>r.filter(o=>String(o._id)!==String(s)))},[b]),va=n.useCallback((s,r)=>{r&&b(o=>o.filter(c=>String(c._id)!==String(s)))},[b]),ba=n.useCallback(async s=>{try{const o=(await ce.put(`/api/posts/${s}/pin`)).data;b(c=>c.map(f=>f._id===s?o:f).sort((f,y)=>f.isPinned===y.isPinned?new Date(y.createdAt)-new Date(f.createdAt):f.isPinned?-1:1))}catch{ee("Sabitleme işlemi başarısız","error")}},[b,ee]),$s=async()=>{var s,r;if(!g){ee("Lütfen giriş yapın veya kaydolun!","warning");return}try{const o=localStorage.getItem("token"),c=o?{headers:{Authorization:`Bearer ${o}`}}:{};if((await ce.post(`/api/portals/${t}/join`,{},c)).data.status==="joined"){ke(!0);const f={...g,joinedPortals:[...g.joinedPortals||[],i]};V(f),C(y=>({...y,members:[...y.members||[],g._id]})),Qe(),ee("Portala başarıyla katıldınız!","success")}else ee("Üyelik isteğiniz gönderildi!","info"),C(f=>({...f,isRequested:!0}))}catch(o){ee(((r=(s=o.response)==null?void 0:s.data)==null?void 0:r.message)||"Katılma başarısız","error")}},gs=(s,r)=>{if(!s||!r)return!1;const o=typeof s=="object"?s.toString():s,c=typeof r=="object"?r.toString():r;return o===c},qs=g&&i&&i.owner&&gs(i.owner._id||i.owner,g._id),Us=qs||g&&i&&i.admins&&i.admins.some(s=>gs(s._id||s,g._id));if(n.useEffect(()=>{if(!(J!=null&&J.suspendedUntil)){Ce(null);return}const s=()=>{const o=new Date,d=new Date(J.suspendedUntil)-o;if(d<=0){Ce(null),window.location.reload();return}Ce({days:Math.floor(d/(1e3*60*60*24)),hours:Math.floor(d/(1e3*60*60)%24),minutes:Math.floor(d/(1e3*60)%60),seconds:Math.floor(d/1e3%60)})};s();const r=setInterval(s,1e3);return()=>clearInterval(r)},[J]),ye==="suspended"&&J){const s=J.portalStatus==="suspended",r=J.suspendedUntil?new Date(J.suspendedUntil).toLocaleString("tr-TR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):null;return e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(Be,{}),e.jsx("div",{className:"suspension-screen",children:e.jsxs("div",{className:"suspension-card",children:[e.jsx("div",{className:"suspension-icon",children:s?"⏸️":"🔒"}),e.jsx("h1",{className:"suspension-title",children:J.portalName||"Portal"}),e.jsx("h2",{className:"suspension-subtitle",children:s?"Bu portal geçici olarak askıya alındı":"Bu portal kapatılmıştır"}),J.statusReason&&e.jsxs("div",{className:"suspension-reason",children:[e.jsx("div",{className:"suspension-reason-label",children:"Sebep"}),e.jsx("p",{children:J.statusReason})]}),s&&r&&e.jsxs("div",{className:"suspension-unlock",children:[e.jsx("div",{className:"suspension-unlock-label",children:"🔓 Erişim Açılma Tarihi"}),e.jsx("div",{className:"suspension-unlock-date",children:r}),je&&e.jsxs("div",{className:"suspension-countdown",children:[e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(je.days).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Gün"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(je.hours).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saat"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(je.minutes).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Dakika"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(je.seconds).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saniye"})]})]})]}),e.jsxs("div",{className:"suspension-policy",children:[e.jsx("span",{children:"📋"}),e.jsxs("p",{children:["Askıya alma nedenleri, platformun ",e.jsx("strong",{children:"Politika ve Koşullar"}),"'ı kapsamında değerlendirilmektedir. Detaylı bilgi için kurallarımızı inceleyebilirsiniz."]})]}),e.jsx("button",{onClick:()=>T("/"),className:"suspension-home-btn",children:"Anasayfaya Dön"})]})})]})}return ye==="blocked"?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(Be,{}),e.jsxs("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center",flexDirection:"column",color:"var(--text-muted)"},children:[e.jsx("div",{style:{fontSize:"3rem",marginBottom:"1rem"},children:"🚫"}),e.jsx("h2",{children:"Sonuç Bulunamadı"}),e.jsx("p",{children:"Aradığınız portala ulaşılamıyor."}),e.jsx("button",{onClick:()=>T("/"),className:"btn-save",style:{marginTop:"20px",float:"none"},children:"Anasayfaya Dön"})]})]}):D||E||!i?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(Be,{}),e.jsx("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center"},children:e.jsx("div",{className:"spinner"})})]}):i.isNSFW&&!is&&!sessionStorage.getItem(`nsfw_confirmed_${t}`)?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(Be,{}),e.jsx("div",{className:"nsfw-gate-overlay",children:e.jsxs("div",{className:"nsfw-gate-card",children:[e.jsx("div",{className:"nsfw-gate-icon",children:e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]})}),e.jsx("div",{className:"nsfw-gate-badge",children:"+18"}),e.jsx("h1",{className:"nsfw-gate-title",children:"Yaş Kısıtlaması"}),e.jsxs("p",{className:"nsfw-gate-desc",children:[e.jsx("strong",{children:i.name})," portalı yetişkin içerik barındırabilir. Bu portala erişmek için 18 yaşından büyük olmanız gerekmektedir."]}),e.jsxs("div",{className:"nsfw-gate-actions",children:[e.jsx("button",{className:"nsfw-gate-confirm",onClick:()=>{sessionStorage.setItem(`nsfw_confirmed_${t}`,"true"),Js(!0)},children:"18 yaşından büyüğüm, devam et"}),e.jsx("button",{className:"nsfw-gate-cancel",onClick:()=>T(-1),children:"Geri Dön"})]}),e.jsx("p",{className:"nsfw-gate-legal",children:"Devam ederek, yaşınızın 18'den büyük olduğunu ve yetişkin içerikle ilgili yasal sorumluluğu kabul ettiğinizi onaylarsınız."})]})})]}):e.jsxs("div",{className:`app-wrapper full-height discord-layout ${Ts?"voice-channel-active":""}`,children:[e.jsx(st,{title:i.name,description:i.description||`${i.name} topluluğuna katılın.`,image:ie(i.avatar),type:"website",schema:{"@context":"https://schema.org","@type":"Community",name:i.name,description:i.description,url:window.location.href,memberCount:((Ks=i.members)==null?void 0:Ks.length)||0}}),!ps&&e.jsx(Be,{}),ne.show&&e.jsxs("div",{className:`app-toast ${ne.type}`,children:[e.jsx("span",{className:"app-toast-icon",children:ne.type==="error"?"🚫":ne.type==="success"?"✅":ne.type==="warning"?"⚠️":"ℹ️"}),ne.message]}),e.jsxs("div",{className:`discord-split-view ${j&&a?"mobile-feed-active":""} ${Ts?"voice-room-active":""} ${w?"sidebar-collapsed":""}`,children:[g&&e.jsx(it,{portal:i,isMember:me,canManage:qs||Us,onEdit:s=>{ha(typeof s=="string"?s:"overview"),Ze(!0)},currentChannel:$,onChangeChannel:ma,className:`${S?"mobile-open":""} ${j&&a?"mobile-hidden":""}`,onShowPortalInfo:()=>ls(!0)}),e.jsxs("main",{className:`discord-main-content ${j&&!a?"mobile-content-hidden":""} ${Is?"voice-channel-active":""}`,children:[j&&!a&&e.jsx(et,{title:(i==null?void 0:i.name)||"Portal",showBack:!1}),(()=>{var d,f,y,h,W,M,B,Q,v,L,ue,Se,es,le,$e,qe;const s=te,r=(s==null?void 0:s.type)||"text",o=(s==null?void 0:s.name)||"...",c=r==="voice"||r==="conference";return e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{display:"flex",flex:1,overflow:"hidden"},children:c?e.jsx("div",{style:{flex:1,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"},children:e.jsx(n.Suspense,{fallback:e.jsx("div",{className:"skeleton-loader",children:e.jsx("p",{children:"Canlı bağlantı odası hazırlanıyor..."})}),children:r==="conference"?e.jsx(mt,{portalId:t,channelId:$,channelName:o,onBack:()=>p(!1)}):e.jsx(dt,{portalId:t,channelId:$,channelName:o,onBack:()=>p(!1)})})}):e.jsx("div",{className:"channel-messages-area",style:{flex:1,display:"flex",flexDirection:"column"},children:Z?e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"},children:[e.jsx("div",{className:"spinner"}),e.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.9rem"},children:"İçerik yükleniyor..."})]}):e.jsxs(e.Fragment,{children:[!c&&e.jsxs("header",{className:`channel-top-bar ${j?"":"desktop-only"}`,children:[e.jsxs("div",{className:"channel-title-wrapper",children:[j&&e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>p(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",children:r==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",children:o})]}),e.jsx("div",{className:"channel-header-actions",children:me&&e.jsx("button",{className:`icon-btn ${pe?"active":""}`,onClick:()=>fe(!pe),title:pe?"Üyeleri Gizle":"Üyeleri Göster",style:{background:"none",border:"none",color:pe?"var(--primary-color)":"var(--text-muted)"},children:e.jsx(vs,{size:20})})})]}),ye==="private"?e.jsx("div",{className:"portal-privacy-screen",children:e.jsxs("div",{className:"privacy-card",children:[e.jsx("div",{className:"privacy-icon",children:"🔒"}),e.jsx("img",{src:ie(i.avatar),alt:"",className:"privacy-avatar",loading:"lazy",decoding:"async",width:"80",height:"80"}),e.jsx("h2",{children:i.name}),e.jsx("p",{className:"privacy-desc",children:i.description||"Bu portal gizlidir."}),e.jsx("p",{className:"privacy-hint",children:"İçeriği görmek ve mesajlaşmak için üye olmalısın."}),i.isRequested?e.jsx("button",{className:"privacy-join-btn requested",disabled:!0,children:"İstek Gönderildi"}):e.jsx("button",{className:"privacy-join-btn",onClick:$s,children:i.privacy==="private"?"Üyelik İsteği Gönder":"Portala Katıl"})]})}):e.jsxs(e.Fragment,{children:[(i==null?void 0:i.alerts)&&i.alerts.length>0&&e.jsx(lt,{alerts:i.alerts}),e.jsx("div",{className:`portal-feed-container discord-feed ${Ye?"tanitim-feed-mode":""}`,onScroll:ca,ref:cs,children:Ye?e.jsx(rt,{}):e.jsxs(e.Fragment,{children:[z.length===0&&!D&&e.jsxs("div",{className:"empty-portal",children:[e.jsx("div",{className:"empty-portal-icon",children:"👋"}),e.jsxs("h3",{children:[((f=(d=i==null?void 0:i.channels)==null?void 0:d.find(x=>x._id===$))==null?void 0:f.type)==="voice"?"🎙️":((h=(y=i==null?void 0:i.channels)==null?void 0:y.find(x=>x._id===$))==null?void 0:h.type)==="conference"?"🎤":((M=(W=i==null?void 0:i.channels)==null?void 0:W.find(x=>x._id===$))==null?void 0:M.type)==="image"?"🖼️":"#",((Q=(B=i==null?void 0:i.channels)==null?void 0:B.find(x=>String(x._id)===String($)))==null?void 0:Q.name)||"..."," ","kanalına hoş geldin!"]}),e.jsx("p",{children:"Bu kanalda henüz mesaj yok. İlk mesajı sen at!"})]}),Array.isArray(z)&&z.map((x,q)=>{var F;x.isBot===!0||((F=x.author)==null||F.isBot);const Y=wa.enableAds;return e.jsxs(n.Fragment,{children:[e.jsx(Ca,{post:x,onDelete:ga,onPin:ba,onArchive:va,isAdmin:Us},x._id),q<z.length-1&&e.jsx("div",{className:"post-separator"}),Y]},x._id)}),e.jsx("div",{ref:fa,style:{height:"40px",margin:"10px 0",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"},children:fs&&e.jsx("div",{className:"spinner-small"})})]})}),(()=>{const q=2*Math.PI*20,Y=q-la/100*q;return e.jsxs("button",{className:`floating-scroll-top portal-scroll-top ${ra?"visible":""}`,onClick:da,"aria-label":"Yukarı Çık",children:[e.jsxs("svg",{className:"progress-ring",width:"50",height:"50",viewBox:"0 0 50 50",children:[e.jsx("circle",{className:"progress-ring-track",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25"}),e.jsx("circle",{className:"progress-ring-fill",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25",style:{strokeDasharray:q,strokeDashoffset:Y}})]}),e.jsx("div",{className:"scroll-icon",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"m18 15-6-6-6 6"})})})]})})(),Ye?null:sa?e.jsxs("div",{className:"channel-input-area",children:[Te&&Na.createPortal(e.jsxs("div",{className:"plus-menu portal-plus-menu-portal",ref:aa,style:{position:"fixed",top:ks.top,left:ks.left,zIndex:99999},children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Ae.current.click(),re(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("circle",{cx:"8.5",cy:"8.5",r:"1.5"}),e.jsx("polyline",{points:"21 15 16 10 5 21"})]})}),"Görsel"]}),!He&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Cs.current.click(),re(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("polygon",{points:"23 7 16 12 23 17 23 7"}),e.jsx("rect",{x:"1",y:"5",width:"15",height:"14",rx:"2",ry:"2"})]})}),"Video"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{zs.current.click(),re(!1)},children:[e.jsx("div",{className:"plus-menu-icon",style:{fontWeight:800,fontSize:"10px"},children:"GIF"}),"GIF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Ps.current.click(),re(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"})]})}),"PDF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Ge(!Ss),re(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"}),e.jsx("polygon",{points:"9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02",fill:"currentColor"})]})}),"YouTube"]})]})]}),document.body),e.jsx("input",{type:"file",ref:Ae,onChange:pa,style:{display:"none"},accept:"image/png, image/jpeg, image/jpg, image/webp",multiple:!0}),e.jsx("input",{type:"file",ref:Cs,onChange:ms,style:{display:"none"},accept:"video/mp4, video/webm, video/quicktime"}),e.jsx("input",{type:"file",ref:zs,onChange:ms,style:{display:"none"},accept:"image/gif"}),e.jsx("input",{type:"file",ref:Ps,onChange:ms,style:{display:"none"},accept:".pdf"}),Ss&&e.jsx("div",{className:"edit-modal-overlay",style:{zIndex:9999},children:e.jsxs("div",{className:"edit-modal-modern",style:{maxWidth:"400px",height:"auto",maxHeight:"none"},children:[e.jsxs("div",{className:"edit-modal-header-modern",children:[e.jsx("div",{className:"header-left",children:e.jsx("h3",{className:"header-title-modern",children:"YouTube Videosu Ekle"})}),e.jsx("button",{onClick:()=>Ge(!1),className:"close-btn-modern",children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),e.jsxs("div",{className:"edit-modal-content-modern",style:{padding:"20px"},children:[e.jsxs("div",{className:"floating-label-group",children:[e.jsx("label",{className:"floating-label",children:"Video Bağlantısı"}),e.jsx("input",{type:"text",className:"floating-input",placeholder:"https://www.youtube.com/watch?v=...",value:ns,onChange:na,autoFocus:!0,onKeyDown:x=>{x.key==="Enter"&&(x.preventDefault(),As())}})]}),e.jsxs("div",{style:{marginTop:"20px",display:"flex",justifyContent:"flex-end",gap:"10px"},children:[e.jsx("button",{onClick:()=>Ge(!1),className:"join-btn outline",style:{padding:"8px 16px"},children:"İptal"}),e.jsx("button",{onClick:As,className:"join-btn primary",style:{padding:"8px 20px"},children:"Ekle"})]})]})]})}),K&&e.jsxs("div",{className:"input-quoted-preview",children:[e.jsxs("div",{className:"input-quoted-preview-header",children:[(L=(v=K.author)==null?void 0:v.profile)!=null&&L.avatar?e.jsx("img",{src:ie(K.author.profile.avatar),alt:"",className:"quoted-preview-avatar",loading:"lazy",decoding:"async",width:"32",height:"32"}):e.jsx("div",{className:"quoted-preview-avatar-placeholder",children:(Se=(ue=K.author)==null?void 0:ue.username)==null?void 0:Se.charAt(0).toUpperCase()}),e.jsxs("div",{className:"quoted-preview-meta",children:[e.jsx("span",{className:"quoted-preview-author",children:((le=(es=K.author)==null?void 0:es.profile)==null?void 0:le.displayName)||(($e=K.author)==null?void 0:$e.username)}),e.jsxs("span",{className:"quoted-preview-username",children:["@",(qe=K.author)==null?void 0:qe.username]})]}),e.jsx("button",{className:"remove-quote-btn",onClick:()=>Ve(null),children:e.jsx(Fe,{size:16})})]}),e.jsxs("div",{className:"input-quoted-preview-body",children:[e.jsx("p",{className:"input-quoted-preview-text",children:K.content}),K.media&&e.jsx("div",{className:"input-quoted-preview-media",children:K.mediaType==="video"?e.jsxs("div",{className:"media-placeholder",children:[e.jsx(Za,{size:20}),e.jsx("span",{children:"Video Alıntısı"})]}):e.jsx("img",{src:ie(K.media),alt:"",loading:"lazy",decoding:"async",width:"120",height:"80"})})]})]}),He&&l.trim()&&!A&&e.jsxs("div",{className:"image-channel-warning",style:{backgroundColor:"rgba(239, 68, 68, 0.1)",border:"1px solid rgba(239, 68, 68, 0.25)",color:"#f87171",padding:"8px 12px",borderRadius:"8px",fontSize:"13px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{flexShrink:0},children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]}),e.jsx("span",{children:"Görsel kanallarında paylaşım yapabilmek için mutlaka bir görsel eklemelisiniz."})]}),P?e.jsxs("div",{className:"ghost-channel-notice",style:{backgroundColor:"#0c0c0c",borderTop:"1px solid #222",color:"#888",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",fontSize:"13px"},children:[e.jsxs("svg",{viewBox:"0 0 24 24",width:"18",height:"18",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{opacity:.7},children:[e.jsx("path",{d:"M12 2a5 5 0 0 0-5 5v14l3-2 2 2 2-2 3 2V7a5 5 0 0 0-5-5z"}),e.jsx("circle",{cx:"10",cy:"8",r:"1",fill:"currentColor"}),e.jsx("circle",{cx:"14",cy:"8",r:"1",fill:"currentColor"})]}),e.jsx("span",{children:"Hayalet Modu: Salt okunur izleme modundasınız. Kanalda mesaj ve gönderi paylaşılamaz."})]}):e.jsxs("div",{className:"message-input-wrapper",children:[e.jsx("button",{ref:Le,className:`input-action-btn upload-btn ${Te?"active":""}`,onClick:ta,style:{backgroundColor:"#383a40",borderRadius:"50%",width:"32px",height:"32px",marginRight:"12px",color:Te?"var(--primary-color)":"#b9bbbe"},children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z"})})}),A&&e.jsxs("div",{className:"input-media-preview",style:{marginRight:"12px",display:"flex",alignItems:"center",backgroundColor:"var(--bg-secondary)",borderRadius:"8px",padding:"4px",gap:"8px",border:"1px solid var(--border-subtle)"},children:[A.type==="youtube"&&A.preview?e.jsx("img",{src:A.preview,alt:"Video Preview",style:{width:"40px",height:"30px",objectFit:"cover",borderRadius:"4px"},loading:"lazy",decoding:"async",width:"40",height:"30"}):e.jsx("span",{style:{fontSize:"20px",lineHeight:1,padding:"4px"},children:A.type.startsWith("video")?"🎥":A.type.includes("gif")?"👾":A.type==="application/pdf"||A.name&&A.name.toLowerCase().endsWith(".pdf")?"📄":"🖼️"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",maxWidth:"100px"},children:e.jsx("span",{style:{fontSize:"10px",color:"var(--text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:A.name||"Medya"})}),e.jsx("button",{onClick:()=>ze(null),style:{background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer"},children:"×"})]}),e.jsx("input",{type:"text",placeholder:He?"Gönderi paylaşmak için bir görsel ekleyin...":`#${(te==null?void 0:te.name)||"..."} kanalına mesaj gönder`,value:l,onChange:x=>{k(x.target.value)},onKeyDown:x=>{x.key==="Enter"&&!x.shiftKey&&(x.preventDefault(),Ms())}}),e.jsx("div",{className:"input-right-actions",children:e.jsx("button",{className:"input-action-btn send-btn",onClick:Ms,disabled:_s||(He?!A&&ve.length===0:!l.trim()&&!A&&ve.length===0),title:"Gönder",style:{color:l.trim()||A||ve.length>0?"var(--primary-color)":"var(--text-tertiary)"},children:_s?e.jsxs("div",{className:"compose-spinner-wrapper",style:{width:"20px",height:"20px"},children:[e.jsx("div",{className:"compose-spinner",style:{width:"20px",height:"20px",borderTopColor:"var(--primary-color)"}}),e.jsxs("span",{className:"compose-progress-text",style:{fontSize:"7px",color:"var(--text-primary)"},children:[Qs,"%"]})]}):e.jsx(Ja,{size:20})})})]}),we&&we.length>0&&e.jsxs("div",{className:"portal-image-previews-container",children:[e.jsxs("div",{className:"portal-image-previews-header",children:[e.jsxs("span",{className:"portal-image-previews-count",children:["Seçilen Görseller (",we.length,"/10)"]}),we.length<10&&e.jsx("button",{type:"button",className:"portal-add-more-images-btn",onClick:()=>{var x;return(x=Ae.current)==null?void 0:x.click()},children:"+ Görsel Ekle"})]}),e.jsx("div",{className:"portal-image-previews-list",children:we.map((x,q)=>e.jsxs("div",{className:"portal-image-preview-item",children:[e.jsx("img",{src:x.url,alt:`Preview ${q+1}`,className:"portal-image-preview-thumb"}),e.jsx("button",{type:"button",className:"portal-image-remove-btn",onClick:()=>ua(q),title:"Görseli Kaldır",children:e.jsx(Fe,{size:14})}),e.jsx("span",{className:"portal-image-index-badge",children:q+1})]},q))})]}),O&&O.length>0&&e.jsxs("div",{className:"portal-typing-indicator",style:{marginTop:"8px"},children:[e.jsx("div",{className:"typing-avatars-group",children:O.map(x=>e.jsx("img",{src:ie(x.avatar),alt:x.displayName,className:"typing-avatar",title:x.displayName},x.userId))}),e.jsx("span",{className:"typing-text",children:O.length===1?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:O[0].displayName})," yazıyor..."]}):O.length===2?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:O[0].displayName})," ve ",e.jsx("strong",{children:O[1].displayName})," yazıyor..."]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:O[0].displayName})," ve ",O.length-1," kişi daha yazıyor..."]})})]})]}):e.jsx("div",{className:"channel-input-area",style:{padding:"0 20px 24px 20px",backgroundColor:"transparent",borderTop:"none"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--glass-bg)",padding:"12px 20px",borderRadius:"8px",border:"1px solid var(--glass-border)",backdropFilter:"blur(20px) saturate(160%)",WebkitBackdropFilter:"blur(20px) saturate(160%)",boxShadow:"var(--glass-shadow)"},children:[e.jsxs("span",{style:{color:"var(--text-secondary)",fontWeight:500,fontSize:"14px"},children:["Bu kanalda mesaj göndermek için ",g?"portala katılmalısın.":"giriş yapmalısın."]}),g?e.jsx("button",{className:"privacy-join-btn",onClick:$s,disabled:i.isRequested,style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:i.isRequested?"İstek Gönderildi":"Portala Katıl"}):e.jsx("button",{className:"privacy-join-btn",onClick:()=>T("/login"),style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:"Giriş Yap"})]})})]})]})})}),pe&&e.jsx(nt,{members:[...i.owner?[{...i.owner,role:"owner"}]:[],...(i.admins||[]).map(x=>({...x,role:"admin"})),...i.members||[]].filter((x,q,Y)=>{const F=String(x._id||x.id||x);return x&&Y.findIndex(se=>String(se._id||se.id||se)===F)===q}),onClose:()=>fe(!1)})]})})()]})]}),ps&&us!=="notifications"&&e.jsx(n.Suspense,{fallback:null,children:e.jsx(ot,{portal:i,currentUser:g,initialTab:us,onClose:()=>Ze(!1),onUpdate:s=>{C(s)}})}),ps&&us==="notifications"&&e.jsx("div",{className:"portal-notifications-modal",onClick:()=>Ze(!1),children:e.jsxs("div",{className:"notifications-modal-content",onClick:s=>s.stopPropagation(),children:[e.jsx("button",{className:"close-notifications-btn",onClick:()=>Ze(!1),children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsx(n.Suspense,{fallback:null,children:e.jsx(ct,{portalId:i._id,portalChannels:i.channels||[],onUpdate:Rs})})]})}),Xs&&i&&e.jsx(Xa,{portal:i,onClose:()=>ls(!1),isMobile:j,onLeave:()=>{ls(!1),ke(!1),T("/")}})]})};export{Et as default};
