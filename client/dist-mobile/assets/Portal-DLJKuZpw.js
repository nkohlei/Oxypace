const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PortalSettingsModal-BgWjXOQW.js","assets/vendor-zfzEpdtL.js","assets/index-QQlpR2xJ.js","assets/socket-oiZhmNYj.js","assets/livekit-BEAUSX0o.js","assets/lucide-MKpLN8jL.js","assets/index-Da_c4h_0.css","assets/ImageCropper-BXvI3gNo.js","assets/ImageCropper-Dk7oVLRB.css","assets/PortalBadges-Cq3z4x2S.js","assets/UserBadges-Cl_OXVsH.js","assets/UserBadges-DFKBzEd_.css","assets/PortalBadges-bryM1aQu.css","assets/PortalSettingsModal-CHDypHKx.css","assets/PortalNotifications-DeKrlWhJ.js","assets/PortalNotifications-zEgqx9Vo.css","assets/VoiceChannel-CHRF9EbQ.js","assets/VoiceChannel-B8b6g0eD.js","assets/VoiceChannel-CoZzLTXb.css","assets/ConferenceChannel-Dt8Ao9sQ.js"])))=>i.map(i=>d[i]);
import{r as n,a4 as e,a2 as ue,a5 as Tt,aq as ts,as as Ts,a7 as Es,ar as Rs,a8 as Ms,a9 as Ls,a3 as xt}from"./vendor-zfzEpdtL.js";import{d as ge,l as os,u as yt,m as cs,i as it,c as Et,b as ss,n as zt,o as $s,p as as,h as Ds,q as Us,a as is}from"./index-QQlpR2xJ.js";import{u as Bs}from"./useVideoTranscoder-CcQ_kTGq.js";import{P as Fs}from"./PostCard-D31ZOAQ2.js";import{c as qs,X as nt,ah as Ks,$ as Os,a5 as Ws,M as Rt,ab as Gs,a4 as Vs,a8 as Ys,e as Hs,a9 as Js,I as Qs,o as Zs,aK as Xs,aL as ea,ag as ta,Q as ns,aE as sa,ac as aa,F as ia,v as na,x as ra,G as la,w as It,j as oa,aM as ds,ax as ca,aN as da,aO as ma}from"./lucide-MKpLN8jL.js";import{U as rs}from"./UserBadges-Cl_OXVsH.js";import{P as At}from"./PortalBadges-Cq3z4x2S.js";import{U as pa}from"./UserBar-Cv4TstmE.js";import{P as ls}from"./PortalInfoModal-Bt_MajLA.js";import{N as at}from"./Navbar-Ba6LX0B4.js";import{S as ua}from"./SubHeader-Cfd814Vl.js";import{S as ha}from"./SEO-hQ3CELhD.js";import"./socket-oiZhmNYj.js";import"./livekit-BEAUSX0o.js";import"./VideoDownloadModal-Dzm4CY2v.js";import"./LinkPreview-B1KzjNjZ.js";import"./UserAvatar-BiWd-CzQ.js";/* empty css                      */import"./Login-f5UHuu64.js";/* empty css             *//* empty css                  */const fa=({portalId:a,onClose:x})=>{const[$,f]=n.useState(""),[Q,y]=n.useState([]),[X,H]=n.useState(!1),[k,S]=n.useState(new Set);n.useEffect(()=>{const T=setTimeout(async()=>{if($.trim().length===0){y([]);return}H(!0);try{const L=await ue.get(`/api/users/search?q=${$}`);y(L.data)}catch{}finally{H(!1)}},500);return()=>clearTimeout(T)},[$]);const G=async I=>{var T,L;try{await Promise.all([ue.post(`/api/portals/${a}/invite`,{userId:I}),ue.post("/api/messages",{recipientId:I,portalId:a,content:"Seni bir portala davet ettim!"})]),S(r=>new Set(r).add(I))}catch(r){alert(((L=(T=r.response)==null?void 0:T.data)==null?void 0:L.message)||"İşlem sırasında bir hata oluştu.")}},A=()=>{const I=`${window.location.origin}/portal/${a}`;navigator.clipboard.writeText(I),alert("Davet bağlantısı kopyalandı!")};return e.jsx("div",{className:"invite-modal-overlay",onClick:x,children:e.jsxs("div",{className:"invite-modal",onClick:I=>I.stopPropagation(),children:[e.jsxs("div",{className:"invite-header",children:[e.jsx("h2",{children:"Kullanıcı Davet Et"}),e.jsxs("div",{className:"header-actions",children:[e.jsxs("button",{className:"copy-link-btn",title:"Bağlantıyı Kopyala",onClick:A,children:[e.jsx(qs,{size:20,strokeWidth:2}),e.jsx("span",{children:"Bağlantı"})]}),e.jsx("button",{className:"close-btn",onClick:x,children:e.jsx(nt,{size:24,strokeWidth:2})})]})]}),e.jsx("div",{className:"invite-search-container",children:e.jsx("input",{type:"text",className:"invite-search-input",placeholder:"Kullanıcı adı ara...",value:$,onChange:I=>f(I.target.value),autoFocus:!0})}),e.jsxs("div",{className:"invite-results custom-scrollbar",children:[X&&e.jsx("div",{className:"loading-text",children:"Aranıyor..."}),!X&&Q.length===0&&$&&e.jsx("div",{className:"no-play-text",children:"Sonuç bulunamadı."}),Q.map(I=>{var r;const T=I._id||I,L=k.has(T);return e.jsxs("div",{className:"invite-user-row",children:[e.jsxs("div",{className:"user-info",children:[e.jsx("img",{src:ge((r=I.profile)==null?void 0:r.avatar),alt:"",className:"user-avatar"}),e.jsx("span",{className:"user-name",children:I.username})]}),e.jsx("button",{className:`invite-btn ${L?"invited":""}`,onClick:()=>!L&&G(T),disabled:L,children:L?"Gönderildi":"Davet Et"})]},T)})]})]})})},ga=({startedAt:a,style:x={},className:$=""})=>{const{roomStartTime:f}=os()||{},[Q,y]=n.useState("00:00");n.useEffect(()=>{const H=f&&a===f?f:a;if(!H){y("00:00");return}const k=()=>{const G=Math.floor((Date.now()-H)/1e3);if(G<0){y("00:00");return}const A=Math.floor(G/3600),I=Math.floor(G%3600/60),T=G%60;y(A>0?`${A.toString().padStart(2,"0")}:${I.toString().padStart(2,"0")}:${T.toString().padStart(2,"0")}`:`${I.toString().padStart(2,"0")}:${T.toString().padStart(2,"0")}`)};k();const S=setInterval(k,1e3);return()=>clearInterval(S)},[a,f]);const X={display:"flex",alignItems:"center",fontSize:"15px",fontWeight:"800",color:"#39FF14",background:"transparent",border:"none",padding:"0 4px"};return e.jsx("div",{style:{...X,...x},className:$,children:Q})},xa=({portal:a,isMember:x,onEdit:$,currentChannel:f,onChangeChannel:Q,className:y,canManage:X,onShowPortalInfo:H})=>{var Oe,Ie;const{user:k}=yt(),[S,G]=n.useState(!1);Tt();const A=cs(),{isMobileView:I}=A||{},T=(A==null?void 0:A.isDesktopSidebarCollapsed)||!1,L=(A==null?void 0:A.setIsDesktopSidebarCollapsed)||(()=>{}),r=it(m=>m.unreadPostsByChannel),b=it(m=>m.clearUnreadForChannel),{roomStartTime:j,activeRoom:K,participants:D}=os(),{socket:t,onlineUsers:R}=Et(),[q,N]=n.useState({}),[se,re]=n.useState(null),ve=n.useRef(null),Ee=(m,z)=>{z.stopPropagation(),ve.current&&clearTimeout(ve.current),re(m),ve.current=setTimeout(()=>{re(null)},1800)};n.useEffect(()=>()=>{ve.current&&clearTimeout(ve.current)},[]);const he=m=>{if(!m)return null;if(typeof m=="string")return m;const z=m._id||m.id;return z?String(z):null},Z=new Set,ae=he(a==null?void 0:a.owner);ae&&Z.add(ae),((a==null?void 0:a.admins)||[]).forEach(m=>{const z=he(m);z&&Z.add(z)}),((a==null?void 0:a.members)||[]).forEach(m=>{const z=he(m);z&&Z.add(z)});const Ye=new Set((R||[]).map(m=>String(m))),fe=k!=null&&k._id?String(k._id):null,De=((Ie=(Oe=k==null?void 0:k.settings)==null?void 0:Oe.privacy)==null?void 0:Ie.showOnlineStatus)!==!1;fe&&Z.has(fe)&&De?Ye.add(fe):fe&&!De&&Ye.delete(fe);let Ue=0;Z.forEach(m=>{Ye.has(m)&&Ue++});const Be=Z.size||(a==null?void 0:a.membersCount)||((a==null?void 0:a.members)||[]).length||0;n.useEffect(()=>{f&&(a!=null&&a._id)&&b(f,a._id)},[f,a==null?void 0:a._id,b]),n.useEffect(()=>{var we;if(!(a!=null&&a._id)||!((we=a==null?void 0:a.channels)!=null&&we.length))return;const m=a.channels.filter(le=>le.type==="voice"||le.type==="conference");if(m.length===0)return;let z=!0;const Ne=async()=>{try{const le=await Promise.all(m.map(async O=>{var Ae,Ge;const _e=O._id||O.id;try{const rt=await ue.get(`/api/voice/rooms/${a._id}/${_e}/participants?t=${Date.now()}`);return{channelId:String(_e),count:((Ge=(Ae=rt.data)==null?void 0:Ae.participants)==null?void 0:Ge.length)||0}}catch{return{channelId:String(_e),count:0}}}));z&&N(O=>{const _e={...O};return le.forEach(Ae=>{_e[Ae.channelId]=Ae.count}),_e})}catch{}};Ne();const We=setInterval(Ne,1e4);return()=>{z=!1,clearInterval(We)}},[a==null?void 0:a._id,a==null?void 0:a.channels]),n.useEffect(()=>{if(!t)return;const m=z=>{!z||!z.channelId||z.portalId&&String(z.portalId)!==String(a==null?void 0:a._id)||N(Ne=>({...Ne,[String(z.channelId)]:Number(z.count)||0}))};return t.on("voice:channel-count-update",m),()=>{t.off("voice:channel-count-update",m)}},[t,a==null?void 0:a._id]);const P=a!=null&&a.channels?[...a.channels].sort((m,z)=>(m.order||0)-(z.order||0)).map(m=>({id:m._id,name:m.name,type:m.type||"text",postCount:m.postCount})):[],ee=P.find(m=>String(m.id)===String(f)),Fe=(ee==null?void 0:ee.type)==="voice"||(ee==null?void 0:ee.type)==="conference";n.useEffect(()=>{!Fe&&T&&L(!1)},[Fe,T,L]);const xe=m=>String(f)===String(m),qe=(a==null?void 0:a.coverImage)||(a==null?void 0:a.banner),je=qe?ge(qe):null,Ke=je?`url("${je}")`:a&&!qe?'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")':"none",[ce,ke]=n.useState(!1),Se=n.useRef(null);return n.useEffect(()=>{if(!je){ke(!0),Se.current=null;return}if(Se.current===je){ke(!0);return}Se.current=je;const m=new window.Image;m.src=je,m.complete?ke(!0):(ke(!1),m.onload=()=>ke(!0),m.onerror=()=>ke(!0))},[je]),a?e.jsxs("div",{className:`channel-sidebar ${T?"collapsed":""} ${y||""}`,style:{height:"calc(100% - 24px)",backgroundColor:"transparent",display:"flex",flexDirection:"column",flexShrink:0,overflow:"visible",position:"relative",borderRight:"none"},children:[!I&&Fe&&e.jsx("button",{className:"sidebar-toggle-btn",onClick:m=>{m.stopPropagation(),L(!T)},title:T?"Menüyü Göster":"Menüyü Gizle",children:T?e.jsx(Ks,{size:16}):e.jsx(Os,{size:16})}),e.jsxs("div",{className:"sidebar-content-wrapper",style:{display:"flex",flexDirection:"column",flex:1,width:"100%",height:"100%",overflow:"hidden",transition:"opacity 0.2s ease, visibility 0.2s ease",opacity:T?0:1,visibility:T?"hidden":"visible",gap:"8px",padding:"0px",boxSizing:"border-box"},children:[e.jsxs("div",{className:"cs-panel cs-panel--banner",children:[e.jsxs("div",{className:"channel-banner-container",onClick:()=>H&&H(),children:[e.jsx("div",{className:"channel-banner-image",style:{backgroundImage:Ke,opacity:ce?1:0}}),e.jsx("div",{className:"channel-banner-overlay"})]}),e.jsxs("div",{className:"portal-quick-info",children:[e.jsxs("div",{className:"portal-info-main",onClick:()=>H&&H(),children:[e.jsxs("h2",{className:"portal-title-text",children:[e.jsx("span",{className:"portal-title-name",children:a.name}),e.jsx(At,{portal:a,size:18})]}),e.jsxs("div",{className:"portal-stats-row",children:[e.jsxs("div",{className:`stat-item ${se==="members"?"stat-tooltip-active":""}`,onClick:m=>Ee("members",m),title:"Üye",children:[e.jsx(Ws,{size:12}),e.jsx("span",{children:Be}),e.jsx("div",{className:"stat-floating-tag",children:"Üye"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${se==="posts"?"stat-tooltip-active":""}`,onClick:m=>Ee("posts",m),title:"Gönderi",children:[e.jsx(Rt,{size:12}),e.jsx("span",{children:a.postCount||0}),e.jsx("div",{className:"stat-floating-tag",children:"Gönderi"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${se==="online"?"stat-tooltip-active":""}`,onClick:m=>Ee("online",m),title:"Çevrimiçi",children:[e.jsx("div",{className:"online-indicator-dot"}),e.jsx("span",{children:Ue}),e.jsx("div",{className:"stat-floating-tag",children:"Çevrimiçi"})]})]})]}),e.jsxs("div",{className:"portal-header-actions",children:[(x||X)&&e.jsx("button",{className:"portal-action-btn-circle",onClick:m=>{m.stopPropagation(),$&&$("notifications")},title:"Bildirim Ayarları",children:e.jsx(Gs,{size:16})}),x&&e.jsx("button",{className:"portal-action-btn-circle",onClick:m=>{m.stopPropagation(),G(!0)},title:"Davet Et",children:e.jsx(Vs,{size:18})})]})]})]}),e.jsxs("div",{className:"cs-panel cs-panel--channels custom-scrollbar",children:[e.jsxs("div",{className:"cs-channels-header",children:[e.jsx("span",{children:"Kanallar"}),X&&e.jsx("div",{onClick:m=>{m.stopPropagation(),$&&$("channels")},className:"cs-add-channel-btn",title:"Kanal Oluştur",children:"+"})]}),e.jsx("div",{className:"cs-channel-list",children:P.map(m=>{var le;const z=xe(m.id),Ne=m.type==="announcement"||m.name.includes("announcements"),We=m.type==="voice"||m.type==="conference";let we=q[String(m.id)]??0;return K&&String(K.channelId)===String(m.id)&&Array.isArray(D)&&(we=D.filter(O=>!O.isScreenSharing&&!String(O.identity).endsWith("-screen")).length),e.jsxs("div",{className:`channel-item ${z?"active":""}`,onClick:()=>Q(m.id),style:{padding:"6px 8px",margin:"2px 0",borderRadius:"4px",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",color:z?"white":"#949ba4",backgroundColor:z?"#3f4147":"transparent",transition:"background-color 0.15s ease, color 0.15s ease"},children:[e.jsx("div",{style:{color:z?"white":"var(--text-secondary)",display:"flex",alignItems:"center",minWidth:"20px",justifyContent:"center"},children:m.type==="conference"?e.jsx(Ys,{size:20,strokeWidth:2}):m.type==="voice"?e.jsx(Hs,{size:20,strokeWidth:2}):Ne?e.jsx(Js,{size:20,strokeWidth:2.5}):m.type==="image"?e.jsx(Qs,{size:20,strokeWidth:2.5,style:{color:"#f59e0b"}}):e.jsx(Zs,{size:20,strokeWidth:2.5})}),e.jsx("span",{style:{fontWeight:z?600:500,fontSize:"16px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:z?"white":"var(--text-primary)",maxWidth:"fit-content"},children:m.name}),We&&e.jsx("span",{className:`vc-channel-active-badge ${we>0?"online":"idle"}`,children:we>0?`${we} aktif`:"aktif yok"}),!z&&((le=r[m.id])==null?void 0:le.length)>0&&e.jsx("div",{style:{backgroundColor:"#f23f43",color:"white",fontSize:"11px",fontWeight:"bold",padding:"0 6px",borderRadius:"8px",minWidth:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.3)",marginLeft:"-4px",flexShrink:0},children:r[m.id].length>9?"9+":r[m.id].length}),e.jsx("div",{style:{flex:1}}),z&&We&&K&&String(K.channelId)===String(m.id)&&j&&e.jsx("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:e.jsx(ga,{startedAt:j,className:"vc-sidebar-timer"})})]},m.id)})})]}),e.jsxs("div",{className:"cs-panel cs-panel--userbar",children:[e.jsx(pa,{currentChannelId:f}),e.jsx("div",{className:"cs-footer-copyright",children:"© 2026 Oxypace. Tüm hakları saklıdır."})]})]}),e.jsx("style",{children:`
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
            `}),S&&e.jsx(fa,{portalId:a._id,onClose:()=>G(!1)})]}):null},ya=({members:a=[],onClose:x})=>{var T,L;const{onlineUsers:$}=Et(),{user:f}=yt(),[,Q]=n.useState(0);n.useEffect(()=>{const r=setInterval(()=>{Q(b=>b+1)},6e4);return()=>clearInterval(r)},[]);const y=r=>{if(!r)return"";const b=new Date,j=new Date(r),K=Math.max(0,b-j),D=Math.floor(K/6e4);if(D<1)return"şimdi";if(D<60)return`${D}dk`;const t=Math.floor(D/60);if(t<24)return`${t}sa`;const R=Math.floor(t/24);if(R<30)return`${R}g`;const q=Math.floor(R/30);return q<12?`${q}ay`:`${Math.floor(q/12)}y`},X=r=>{if(!r)return null;if(typeof r=="string")return r;const b=r._id||r.id;return b?String(b):null},H=new Set(($||[]).map(r=>String(r))),k=f!=null&&f._id?String(f._id):null,S=((L=(T=f==null?void 0:f.settings)==null?void 0:T.privacy)==null?void 0:L.showOnlineStatus)!==!1;k&&S?H.add(k):k&&!S&&H.delete(k);const G=r=>(r==null?void 0:r.role)==="owner"?3:(r==null?void 0:r.role)==="admin"||r!=null&&r.isAdmin?2:1,A=a.filter(r=>{if(!r)return!1;const b=X(r);return b&&H.has(b)}).sort((r,b)=>{var t,R;const j=G(b)-G(r);if(j!==0)return j;const K=((t=r.profile)==null?void 0:t.displayName)||r.username||"",D=((R=b.profile)==null?void 0:R.displayName)||b.username||"";return K.localeCompare(D)}),I=a.filter(r=>{if(!r)return!1;const b=X(r);return b&&!H.has(b)}).sort((r,b)=>{var t,R;const j=G(b)-G(r);if(j!==0)return j;const K=((t=r.profile)==null?void 0:t.displayName)||r.username||"",D=((R=b.profile)==null?void 0:R.displayName)||b.username||"";return K.localeCompare(D)});return e.jsxs("div",{className:"members-sidebar custom-scrollbar",children:[e.jsxs("div",{className:"members-header-top",children:[e.jsx("h3",{children:"ÜYELER"}),x&&e.jsx("button",{onClick:x,className:"close-members-btn","aria-label":"Kapat",children:e.jsx(nt,{size:20,strokeWidth:2})})]}),e.jsxs("div",{className:"members-category",children:["Çevrim içi — ",A.length]}),A.map((r,b)=>{var q,N,se,re;if(!r||typeof r=="string")return null;const j=r.username||"Unknown",K=((q=r.profile)==null?void 0:q.avatar)||r.avatar,D=((N=r.profile)==null?void 0:N.displayName)||j,t=r.role==="owner",R=r.role==="admin"||r.isAdmin;return e.jsxs(ts,{to:`/profile/${j}`,className:"member-item member-link",children:[e.jsxs("div",{className:"member-avatar-wrapper",children:[K?e.jsx("img",{src:ge(K,"thumbnail"),alt:"",className:"member-avatar",loading:"eager",decoding:"async"}):e.jsx("div",{className:"member-avatar-placeholder",children:((se=D[0])==null?void 0:se.toUpperCase())||((re=j[0])==null?void 0:re.toUpperCase())||"?"}),e.jsx("div",{className:"status-indicator online"})]}),e.jsxs("div",{className:"member-info",style:{display:"flex",alignItems:"center",gap:"6px"},children:[e.jsxs("span",{className:"member-name active-role",style:{color:t?"#f1c40f":R?"#3498db":"#2ecc71"},children:[D,t&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!t&&R&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"})]}),e.jsx(rs,{user:r,size:13})]})]},r._id||r.id||b)}),e.jsxs("div",{className:"members-category",children:["Çevrim dışı — ",I.length]}),I.map((r,b)=>{var q,N,se,re;if(!r||typeof r=="string")return null;const j=r.username||"Unknown",K=((q=r.profile)==null?void 0:q.avatar)||r.avatar,D=((N=r.profile)==null?void 0:N.displayName)||j,t=r.role==="owner",R=r.role==="admin"||r.isAdmin;return e.jsxs(ts,{to:`/profile/${j}`,className:"member-item offline member-link",children:[e.jsx("div",{className:"member-avatar-wrapper",children:K?e.jsx("img",{src:ge(K,"thumbnail"),alt:"",className:"member-avatar",loading:"eager",decoding:"async"}):e.jsx("div",{className:"member-avatar-placeholder",style:{backgroundColor:"var(--bg-secondary)"},children:((se=D[0])==null?void 0:se.toUpperCase())||((re=j[0])==null?void 0:re.toUpperCase())||"?"})}),e.jsx("div",{className:"member-info",style:{flex:1},children:e.jsxs("div",{className:"member-name-row",style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("span",{className:"member-name",style:{display:"flex",alignItems:"center",gap:"4px"},children:[D,t&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!t&&R&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"}),e.jsx(rs,{user:r,size:13})]}),r.lastActive&&e.jsx("span",{className:"last-active-time",style:{fontSize:"11px",color:"var(--text-muted)"},children:y(r.lastActive)})]})})]},r._id||r.id||`offline-${b}`)}),e.jsx("style",{children:`
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
            `})]})},ba=()=>{var T,L;const{user:a,updateUser:x}=yt(),$=Tt(),[f,Q]=n.useState(null),[y,X]=n.useState([]),[H,k]=n.useState(!0),[S,G]=n.useState(null);n.useEffect(()=>{let r=!0;return(async()=>{try{const j=await ue.get("/api/portals/showcase");r&&j.data&&(Q(j.data.globalPortal||null),X(Array.isArray(j.data.topPortals)?j.data.topPortals:[]))}catch{}finally{r&&k(!1)}})(),()=>{r=!1}},[]);const A=async(r,b)=>{var j,K,D;if(r.stopPropagation(),!a){$("/login");return}if(b.isMember){$(`/portal/${b._id}`);return}if(!(b.isRequested||S===b._id)){G(b._id);try{const R=((j=(await ue.post(`/api/portals/${b._id}/join`)).data)==null?void 0:j.status)==="requested",q=N=>!N||N._id!==b._id?N:{...N,isMember:!R,isRequested:R,memberCount:R?N.memberCount:(N.memberCount||0)+1};if((f==null?void 0:f._id)===b._id&&Q(q(f)),X(N=>N.map(q)),!R&&a&&x){const N=a.joinedPortals||[];N.some(se=>(se._id||se).toString()===b._id.toString())||x({joinedPortals:[...N,b],portals:[...a.portals||[],b]})}}catch(t){alert(((D=(K=t.response)==null?void 0:K.data)==null?void 0:D.message)||"İşlem gerçekleştirilemedi.")}finally{G(null)}}},I=r=>r!=null&&r.banner?`url(${ge(r.banner)}) center/cover no-repeat`:"#141414";return e.jsxs("div",{className:"tanitim-showcase-wrapper",children:[e.jsxs("section",{className:"tanitim-guide-card",children:[e.jsxs("div",{className:"tanitim-guide-header",children:[e.jsxs("div",{className:"tanitim-guide-tag",children:[e.jsx(Xs,{size:13}),e.jsx("span",{children:"SİSTEM DİREKTİFİ // RESMİ PLATFORM REHBERİ"})]}),e.jsx("h1",{className:"tanitim-guide-title",children:"Oxypace İletişim Protokolü & Kullanım Mimarisi"}),e.jsx("p",{className:"tanitim-guide-lead",children:"Özgür, sansürsüz, yüksek performanslı ve gizlilik odaklı yeni nesil topluluk ekosistemi. Arayüz haritasını ve platformun tüm gelişmiş yeteneklerini aşağıdaki yönergelerden inceleyin."})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// NAVİGASYON VE MENÜ YERLEŞİMİ"}),e.jsx("h2",{className:"sub-section-title",children:"Sayfa Yapısı & Arayüz Konumlandırması"})]}),e.jsxs("div",{className:"tanitim-nav-map-grid",children:[e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(ea,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ SOL NAVİGASYON BARI ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Ana Gezinme Çubuğu"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Doğrudan Mesajlar (DM):"})," Birebir şifreli özel yazışmalar ve anlık bildirim kutusu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portallar Listesi:"})," Üye olduğunuz veya yönettiğiniz tüm portalların dikey simgeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Keşfet Pusulası:"})," Yeni toplulukları, popüler portalları ve kişileri arama alanı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Oluştur (+):"})," Saniyeler içinde kendi özgür topluluğunuzu kurma aracı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kimlik & Hızlı Ayar:"})," En altta mikrofon, kulaklık ve profil hızlı kontrolleri."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(ta,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ PORTAL İÇİ MENÜ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Kanal Hiyerarşisi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Kimliği:"})," Özel afiş, doğrulanmış rozet ve çevrimiçi üye göstergeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Metin Kanalları (#):"})," Tematik konulara göre ayrılmış gönderi ve tartışma akışları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Ses Kanalları (🎙️):"})," Tek dokunuşla girilebilen, gecikmesiz canlı ses odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Sahne Kanalları (🎤):"})," Seminer, podcast ve etkinlikler için konuşmacı odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Yönetimi:"})," Yöneticiler için yeni kanallar açma ve gizlilik kilidi."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(ns,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ ÜST DENETİM & AKIŞ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"İçerik & Üye Denetimi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Üst Başlığı:"})," Aktif kanal adı, açıklaması ve hızlı üye paneli butonu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Üye Listesi Paneli:"})," Sağ tarafta çevrimiçi yöneticiler ve aktif üyeler."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Görsel Akış Alanı:"})," 4K videolar, çoklu galeriler ve doküman önizlemeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Bildirim Zil İkonu:"})," Kanal ve portal bazlı bildirim filtreleme ayarları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Ayarları:"})," Portal sahibi ve yöneticileri için tam yönetim konsolu."]})]})]})]})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// GELİŞMİŞ SİSTEM DİREKLERİ"}),e.jsx("h2",{className:"sub-section-title",children:"Platform Mekanizmaları & Özellikler"})]}),e.jsxs("div",{className:"tanitim-pillars-grid",children:[e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"01"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Rt,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Gelişmiş Mesaj Mekanizması"}),e.jsx("p",{className:"pillar-text",children:"Markdown formatlama, tek tıkla alıntılı yanıtlama (quote reply), kullanıcıyı doğrudan haberdar eden @etiketleme sistemi ve akıllı bağlantı (link preview) ayrıştırma desteği."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Alıntılı Yanıt"}),e.jsx("span",{className:"pillar-tag",children:"@Bahsetmeler"}),e.jsx("span",{className:"pillar-tag",children:"Mesaj Sabitleme"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"02"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(sa,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Canlı Ses Odaları & Sahne Modu"}),e.jsx("p",{className:"pillar-text",children:"Ultra düşük gecikmeli WebRTC ses mimarisi. Herkesin serbestçe katılabildiği sohbet odaları ile seminer ve konferanslar için konuşmacı-dinleyici ayrımı ve el kaldırma desteği sunan Sahne kanalları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Gecikme"}),e.jsx("span",{className:"pillar-tag",children:"Sahne Hiyerarşisi"}),e.jsx("span",{className:"pillar-tag",children:"Arka Planda Ses"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"03"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(aa,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Mobil Ekosistem & PIP Video"}),e.jsx("p",{className:"pillar-text",children:"Yerel Android APK ve tam uyumlu PWA deneyimi. Canlı FCM Push bildirimleri, mobil veri tasarrufu modu ve gezinirken köşede kesintisiz oynayan Kayan Resim İçinde Resim (PIP) video motoru."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Android APK / PWA"}),e.jsx("span",{className:"pillar-tag",children:"Canlı PIP Oynatıcı"}),e.jsx("span",{className:"pillar-tag",children:"FCM Push Bildirim"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"04"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(ia,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Ultra-HD Medya & Transcoding"}),e.jsx("p",{className:"pillar-text",children:"İstemci içi WASM motoru ile 360p'den 4K'ya kadar otomatik optimize edilen video akışı. Tek gönderide 10 adede kadar yüksek kaliteli fotoğraf galerisi ve tek tıkla önizlenebilir PDF dokümanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"4K Video Transcoding"}),e.jsx("span",{className:"pillar-tag",children:"10'lu Görsel Galerisi"}),e.jsx("span",{className:"pillar-tag",children:"PDF Doküman Desteği"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"05"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(ns,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Özelleştirilebilir Sistemler & Temalar"}),e.jsx("p",{className:"pillar-text",children:"Saf OLED siyahı ve yüksek kontrastlı Aydınlık tema desteği. Kişisel profil afişi, biyografi ve avatar özelleştirmeleri. Portallar için özel roller, izin matrisleri ve gizlilik kalkanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"OLED Siyah & Açık Tema"}),e.jsx("span",{className:"pillar-tag",children:"Rol & Yetki Matrisi"}),e.jsx("span",{className:"pillar-tag",children:"Özel Profil Afişi"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"06"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(na,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Kripto-Güvenlik & Sıfır Takip"}),e.jsx("p",{className:"pillar-text",children:"Sıfır veri madenciliği ve ticari profil koruması. IP ve aktif cihaz oturum denetimi, güvenlik anahtarları ile hesap kurtarma ve doğrulanmış resmi topluluk rozetleri."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Veri İzleme"}),e.jsx("span",{className:"pillar-tag",children:"Cihaz & Oturum Denetimi"}),e.jsx("span",{className:"pillar-tag",children:"Onay Rozetleri"})]})]})]})]})]}),f&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ MERKEZ TOPLULUK // 01 ]"}),e.jsx("span",{className:"section-badge",children:"EN POPÜLER PORTAL"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Oxypace Global"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"Platformun en geniş üye kitlesine sahip resmi ana iletişim merkezi."})]}),e.jsxs("div",{className:"oxypace-global-hero-card",onClick:()=>$(`/portal/${f._id}`),children:[e.jsxs("div",{className:"hero-card-banner",style:{background:I(f)},children:[e.jsx("div",{className:"hero-banner-overlay"}),e.jsx("div",{className:"hero-banner-badge",children:e.jsx("span",{children:"ANA TOPLULUK"})})]}),e.jsxs("div",{className:"hero-card-body",children:[e.jsxs("div",{className:"hero-header-row",children:[e.jsx("div",{className:"hero-avatar-box",children:f.avatar?e.jsx("img",{src:ge(f.avatar),alt:f.name,className:"hero-avatar-img"}):e.jsx("div",{className:"hero-avatar-fallback",children:((L=(T=f.name)==null?void 0:T.substring(0,2))==null?void 0:L.toUpperCase())||"OG"})}),e.jsxs("div",{className:"hero-identity-col",children:[e.jsxs("div",{className:"hero-name-row",children:[e.jsx("h3",{className:"hero-portal-name",children:f.name}),e.jsx(At,{portal:f,size:18}),e.jsx("span",{className:"hero-privacy-tag",children:f.privacy==="private"?e.jsxs(e.Fragment,{children:[e.jsx(ra,{size:11})," GİZLİ"]}):e.jsxs(e.Fragment,{children:[e.jsx(la,{size:11})," HERKESE AÇIK"]})})]}),e.jsx("div",{className:"hero-meta-row",children:e.jsxs("div",{className:"hero-member-stat",children:[e.jsx(It,{size:14}),e.jsxs("span",{children:[(f.memberCount||0).toLocaleString("tr-TR")," Üye"]})]})})]}),e.jsx("div",{className:"hero-action-col",children:e.jsx("button",{type:"button",className:`tanitim-sharp-btn hero-btn ${f.isMember?"btn-joined":f.isRequested?"btn-requested":"btn-action"}`,onClick:r=>A(r,f),disabled:S===f._id||f.isRequested,children:S===f._id?"İŞLENİYOR...":f.isMember?e.jsxs(e.Fragment,{children:[e.jsx(oa,{size:14}),"ÜYESİNİZ"]}):f.isRequested?e.jsxs(e.Fragment,{children:[e.jsx(ds,{size:14}),"İSTEK GÖNDERİLDİ"]}):f.privacy==="private"?"ÜYELİK İSTEĞİ GÖNDER":"PORTALA KATIL"})})]}),e.jsx("p",{className:"hero-description",children:f.description||"Oxypace platformunun ana buluşma noktası. Güncel duyurular, teknik tartışmalar ve küresel topluluk etkileşimi."})]})]})]}),y.length>0&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ AKTİF TOPLULUKLAR // 02 ]"}),e.jsx("span",{className:"section-badge",children:"ÖNE ÇIKAN PORTALLAR"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Popüler Topluluklar"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"En çok paylaşıma ve aktif etkileşime sahip seçkin portallar."})]}),e.jsx("div",{className:"tanitim-portals-row",children:y.map(r=>{var b,j;return e.jsxs("div",{className:"tanitim-classic-card",onClick:()=>$(`/portal/${r._id}`),children:[e.jsx("div",{className:"classic-card-banner",style:{background:I(r)},children:e.jsx("div",{className:"classic-banner-overlay"})}),e.jsx("div",{className:"classic-card-icon-wrapper",children:r.avatar?e.jsx("img",{src:ge(r.avatar),alt:r.name,className:"classic-card-icon-img",loading:"lazy"}):e.jsx("div",{className:"classic-card-icon-placeholder",children:((j=(b=r.name)==null?void 0:b.substring(0,2))==null?void 0:j.toUpperCase())||"P"})}),e.jsxs("div",{className:"classic-card-body",children:[e.jsxs("div",{className:"classic-card-title-row",children:[e.jsx("h4",{className:"classic-card-title",children:r.name}),e.jsx(At,{portal:r,size:16})]}),e.jsx("p",{className:"classic-card-desc",children:r.description||"Bu topluluk hakkında henüz bir açıklama girilmemiş."}),e.jsxs("div",{className:"classic-card-footer",children:[e.jsxs("div",{className:"classic-member-count",children:[e.jsx(It,{size:12}),e.jsxs("span",{children:[r.memberCount||0," Üye"]})]}),e.jsx("button",{type:"button",className:`tanitim-sharp-btn small-btn ${r.isMember?"btn-joined":r.isRequested?"btn-requested":"btn-action"}`,onClick:K=>A(K,r),disabled:S===r._id||r.isRequested,children:S===r._id?"...":r.isMember?"ÜYESİNİZ":r.isRequested?"İSTEK":r.privacy==="private"?"İSTEK AT":"KATIL"})]})]})]},r._id)})})]})]})},va=({alerts:a=[]})=>{const[x,$]=n.useState(()=>{try{const k=sessionStorage.getItem("dismissed_portal_alerts");return k?JSON.parse(k):[]}catch{return[]}}),[f,Q]=n.useState(null),y=a.filter(k=>!x.includes(k._id)),X=k=>{Q(k),setTimeout(()=>{const S=[...x,k];$(S);try{sessionStorage.setItem("dismissed_portal_alerts",JSON.stringify(S))}catch{}Q(null)},300)},H=k=>{const S=new Date,A=new Date(k)-S;if(A<=0)return null;const I=Math.floor(A/(1e3*60*60*24)),T=Math.floor(A/(1e3*60*60)%24),L=Math.floor(A/(1e3*60)%60);return I>0?`${I} gün ${T} saat kaldı`:T>0?`${T} saat ${L} dk kaldı`:`${L} dakika kaldı`};return y.length===0?null:e.jsx(e.Fragment,{children:y.map(k=>e.jsx("div",{className:`portal-alert-banner ${f===k._id?"dismissing":""}`,children:e.jsxs("div",{className:"alert-banner-inner",children:[e.jsx("div",{className:"alert-banner-icon",children:e.jsx(ca,{size:18,strokeWidth:2})}),e.jsxs("div",{className:"alert-banner-content",children:[e.jsx("div",{className:"alert-banner-label",children:e.jsx("span",{children:"Yönetici Uyarısı"})}),e.jsx("div",{className:"alert-banner-message",children:k.message}),e.jsx("div",{className:"alert-banner-meta",children:e.jsxs("span",{className:"alert-banner-time",children:[e.jsx(ds,{size:16,strokeWidth:2}),H(k.expiresAt)||"Süresi dolmak üzere"]})})]}),e.jsx("button",{className:"alert-banner-close",onClick:()=>X(k._id),title:"Uyarıyı gizle",children:e.jsx(nt,{size:16,strokeWidth:2.5})})]})},k._id))})},ja=n.lazy(()=>xt(()=>import("./PortalSettingsModal-BgWjXOQW.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13]))),ka=n.lazy(()=>xt(()=>import("./PortalNotifications-DeKrlWhJ.js"),__vite__mapDeps([14,1,2,3,4,5,6,15]))),Sa=n.lazy(()=>xt(()=>import("./VoiceChannel-CHRF9EbQ.js"),__vite__mapDeps([16,1,4,2,3,5,6,17,18]))),Na=n.lazy(()=>xt(()=>import("./ConferenceChannel-Dt8Ao9sQ.js"),__vite__mapDeps([19,1,4,2,3,5,6,17,18]))),Ja=()=>{var Ht,Jt,Qt,Zt,Xt,es;const{id:a}=Ts(),x=Es(),[$]=Rs(),f=$.get("channel"),Q=$.get("post"),{user:y,token:X,updateUser:H,loading:k}=yt(),{socket:S,connected:G}=Et(),A=Tt(),I=cs(),{isSidebarOpen:T,closeSidebar:L,isMobileView:r,mobileChannelOpen:b,setMobileChannelOpen:j}=I||{},K=(I==null?void 0:I.isDesktopSidebarCollapsed)||!1,D=typeof window<"u"&&!!localStorage.getItem("admin_backup_token"),[t,R]=n.useState(()=>{var s;try{const i=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(i){const l=JSON.parse(i);if(Array.isArray(l==null?void 0:l.channels)&&l.channels.length>0)return l}}catch{}return(s=x==null?void 0:x.state)!=null&&s.portal&&(String(x.state.portal._id)===String(a)||String(x.state.portal.id)===String(a))&&Array.isArray(x.state.portal.channels)&&x.state.portal.channels.length>0?x.state.portal:null});n.useEffect(()=>{var s;(s=x==null?void 0:x.state)!=null&&s.portal&&(String(x.state.portal._id)===String(a)||String(x.state.portal.id)===String(a))&&R(i=>Array.isArray(x.state.portal.channels)&&x.state.portal.channels.length>0?x.state.portal:i&&Array.isArray(i.channels)&&i.channels.length>0?{...x.state.portal,channels:i.channels,roles:i.roles||x.state.portal.roles,members:i.members||x.state.portal.members}:i||null)},[a,x.state]);const q=it(s=>s.posts),N=it(s=>s.setPosts),[se,re]=n.useState(()=>{var s;try{const i=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(i){const l=JSON.parse(i);if(Array.isArray(l==null?void 0:l.channels)&&l.channels.length>0)return!1}}catch{}return!((s=x==null?void 0:x.state)!=null&&s.portal&&(String(x.state.portal._id)===String(a)||String(x.state.portal.id)===String(a))&&Array.isArray(x.state.portal.channels)&&x.state.portal.channels.length>0)}),[ve,Ee]=n.useState(!1),[he,Z]=n.useState(""),[ae,Ye]=n.useState(null),[fe,De]=n.useState(null),[Ue,Be]=n.useState(!1),[P,ee]=n.useState(null),[Fe,xe]=n.useState({}),[qe,je]=n.useState(!1),[ye,Ke]=n.useState(""),[ce,ke]=n.useState([]);n.useRef(null);const[Se,Oe]=n.useState(!1),[Ie,m]=n.useState(!1),[z,Ne]=n.useState({show:!1,message:"",type:"info"}),[We,we]=n.useState(!1),[le,O]=n.useState(!1),[_e,Ae]=n.useState({top:0,left:0}),[Ge,rt]=n.useState(""),[Mt,lt]=n.useState(!1),He=n.useRef(null),Lt=n.useRef(null),$t=n.useRef(null),Dt=n.useRef(null),[U,Ce]=n.useState(null),[Pe,Re]=n.useState([]),[Me,Le]=n.useState([]),[V,ot]=n.useState(null),[ms,Je]=n.useState(0),[Ut,bt]=n.useState(!1),Ve=n.useRef(!1);Bs();const ze=ss(s=>s.activeUploads)[`portal-${a}`];n.useEffect(()=>{ze&&ze.status==="uploading"&&N(s=>s.map(i=>i.isOptimistic&&i.mediaType==="video"?{...i,uploadProgress:ze.progress}:i))},[ze==null?void 0:ze.progress,ze==null?void 0:ze.status]);const[ps,ct]=n.useState(!1),dt=!!(t!=null&&t.name&&/Oxypace Tan[ıi]t[ıi]m/i.test(t.name)),us=!!(y&&(((Ht=y.username)==null?void 0:Ht.toLowerCase())==="oxypace"||y.isAdmin)),hs=dt?us:y&&Ue,fs=n.useRef(null),Qe=n.useRef(null),gs=n.useCallback(s=>{s.preventDefault(),s.stopPropagation(),O(i=>{if(!i&&Qe.current){const l=Qe.current.getBoundingClientRect();Ae({top:l.bottom+8,left:l.left})}return!i})},[]);n.useEffect(()=>{if(!le)return;let s=!0;const i=()=>{if(Qe.current){const v=Qe.current.getBoundingClientRect();Ae({top:v.bottom+8,left:v.left})}},l=v=>{if(!s)return;const o=v.target.closest(".plus-menu")||v.target.closest(".portal-plus-menu-portal"),p=v.target.closest(".upload-btn");!o&&!p&&O(!1)},c=setTimeout(()=>{s&&(document.addEventListener("click",l),document.addEventListener("touchstart",l))},0);return window.addEventListener("scroll",i,!0),window.addEventListener("resize",i),()=>{s=!1,clearTimeout(c),document.removeEventListener("click",l),document.removeEventListener("touchstart",l),window.removeEventListener("scroll",i,!0),window.removeEventListener("resize",i)}},[le]),n.useEffect(()=>()=>{O(!1)},[]),n.useEffect(()=>{O(!1)},[P,a]),n.useEffect(()=>{var s;(s=x.state)!=null&&s.quotedPost&&(ot(x.state.quotedPost),x.state.selectedChannelId&&ee(x.state.selectedChannelId),L&&L(),j&&j(!0),A(x.pathname+x.search,{replace:!0,state:{}}))},[x.state,a]),n.useEffect(()=>{let s=!0;const i=async()=>{var p;const c=window.__oxypacePendingChannelShare;if(!c||!c.payload||c.portalId&&String(c.portalId)!==String(a))return;window.__oxypacePendingChannelShare=null;const v=c.payload;c.channelId&&ee(c.channelId),L&&L(),j&&j(!0);const o=(v.text||v.subject||"").trim();if(o&&s&&Ke(d=>d?`${d}
${o}`:o),Array.isArray(v.files)&&v.files.length>0){const d=[];for(const u of v.files)try{let w=null;if(u.base64){const g=atob(u.base64),C=new Array(g.length);for(let _=0;_<g.length;_++)C[_]=g.charCodeAt(_);const E=new Uint8Array(C);w=new Blob([E],{type:u.mimeType||"application/octet-stream"})}else if(u.path&&window.Capacitor){const g=window.Capacitor.convertFileSrc(u.path);w=await(await fetch(g)).blob()}if(w){const g=new File([w],u.name||"shared_file",{type:u.mimeType||w.type||"application/octet-stream"});d.push(g)}}catch{}if(d.length>0&&s){const u=d[0],w=(u.name||"").toLowerCase(),g=u.type==="application/pdf"||w.endsWith(".pdf"),C=u.type.startsWith("video/")||["mp4","webm","ogg","mov","m4v"].includes(w.split(".").pop()),E=u.type==="image/gif"||w.endsWith(".gif");if(g||C||E)Re([]),Le([]),Ce(u),Ve.current=C,O(!1);else{Ce(null),Ve.current=!1;const _=d.slice(0,10),B=[],te=[];for(const de of _)B.push(de),te.push({url:URL.createObjectURL(de),name:de.name,size:de.size,file:de});Re(B),Le(te),O(!1)}}}else if(o&&s){const d=o.match(/https?:\/\/[^\s]+/i),u=d?d[0]:o,w=/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/,g=u.match(w),C=g&&g[2].length===11?g[2]:null;C&&Ce({name:"YouTube Video",type:"youtube",preview:`https://img.youtube.com/vi/${C}/hqdefault.jpg`,url:u})}(p=x.state)!=null&&p.sharedTrigger&&A(x.pathname+x.search,{replace:!0,state:{}})};i();const l=()=>{i()};return window.addEventListener("oxypace:apply_shared_to_channel",l),()=>{s=!1,window.removeEventListener("oxypace:apply_shared_to_channel",l)}},[a,(Jt=x.state)==null?void 0:Jt.sharedTrigger]);const W=(Qt=t==null?void 0:t.channels)==null?void 0:Qt.find(s=>String(s._id)===String(P)),mt=(W==null?void 0:W.type)==="image",Bt=(W==null?void 0:W.type)==="voice"||(W==null?void 0:W.type)==="conference",Ft=Bt&&(!r||b);n.useEffect(()=>{t!=null&&t.channels&&Array.isArray(t.channels)&&xe(s=>{const i={...s};return t.channels.forEach(l=>{const c=String(l._id);l.postCount!==void 0&&(i[c]=l.postCount)}),i})},[t==null?void 0:t.channels]),n.useEffect(()=>{if(!S||!G||!a)return;S.emit("join_portal",a),S.emit("get_online_users"),P&&S.emit("join_channel",P);const s=o=>{var C,E,_,B,te;const p=((C=o.portal)==null?void 0:C._id)||o.portal,d=((E=o.channel)==null?void 0:E._id)||o.channel,u=String(p)===String(a),w=((_=t==null?void 0:t.channels)==null?void 0:_.length)===1,g=String(d)===String(P)||String(d||"general")===String(P||"general")||w||W&&(String(d)===String(W.name)||String(d)===String(W._id));if(u&&g){const de=((B=o.author)==null?void 0:B._id)||((te=o.author)==null?void 0:te.id)||o.author;if(String(de)!==String(y==null?void 0:y._id)){const Y=String(P);xe(oe=>({...oe,[Y]:(oe[Y]!==void 0?oe[Y]:(W==null?void 0:W.postCount)||0)+1}))}N(Y=>{if(Y.some(me=>me._id===o._id))return Y;const oe=o.quotedPost&&(typeof o.quotedPost=="string"?o.quotedPost:o.quotedPost._id);if(oe){const me=Y.find(h=>h._id===oe);me&&typeof me=="object"&&me.author?o.quotedPost=me:V&&oe===V._id&&(o.quotedPost=V)}return[o,...Y]})}},i=o=>{var u;const p=((u=o.portal)==null?void 0:u._id)||o.portal;(!p||String(p)===String(a))&&N(w=>w.map(g=>String(g._id)===String(o._id)?o:g))},l=({postId:o,portalId:p})=>{(!p||String(p)===String(a))&&o&&N(d=>d.filter(u=>String(u._id)!==String(o)))},c=({userId:o,status:p,lastActive:d})=>{p==="offline"&&ke(u=>u.filter(w=>String(w.userId)!==String(o))),R(u=>{if(!u)return u;const w=d||new Date;let g=u.owner;if(u.owner){const _=u.owner._id||u.owner.id||u.owner;String(_)===String(o)&&typeof u.owner=="object"&&(g={...u.owner,lastActive:w})}let C=u.admins;Array.isArray(u.admins)&&(C=u.admins.map(_=>{const B=_._id||_.id||_;return String(B)===String(o)&&typeof _=="object"&&_!==null?{..._,lastActive:w}:_}));let E=u.members;return Array.isArray(u.members)&&(E=u.members.map(_=>{const B=_._id||_.id||_;return String(B)===String(o)&&typeof _=="object"&&_!==null?{..._,lastActive:w}:_})),{...u,owner:g,admins:C,members:E}})},v=({userId:o,username:p,displayName:d,avatar:u,isTyping:w})=>{String(o)!==String(y==null?void 0:y._id)&&ke(g=>w?g.some(C=>String(C.userId)===String(o))?g:[...g,{userId:o,username:p,displayName:d,avatar:u}]:g.filter(C=>String(C.userId)!==String(o)))};return S.on("post:created",s),S.on("post:updated",i),S.on("post:deleted",l),S.on("user_status_change",c),S.on("portal_typing_update",v),()=>{S.off("post:created",s),S.off("post:updated",i),S.off("post:deleted",l),S.off("user_status_change",c),S.off("portal_typing_update",v)}},[S,G,a,P,y==null?void 0:y._id]);const xs=s=>{if(!s)return null;const i=/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,l=s.match(i);return l&&l[2].length===11?l[2]:null},ys=s=>{const i=s.target.value;rt(i)},qt=()=>{const s=xs(Ge);if(!s){ie("Geçersiz YouTube URL'si","error");return}Ce({name:"YouTube Video",type:"youtube",preview:`https://img.youtube.com/vi/${s}/hqdefault.jpg`,url:Ge}),lt(!1),rt("")},[bs,pt]=n.useState(!1),[vs,js]=n.useState(0),vt=n.useRef(null),jt=n.useRef(null),Ze=n.useRef(null),ks=n.useCallback(s=>{const i=s.target;jt.current||(jt.current=requestAnimationFrame(()=>{jt.current=null;const l=i.scrollTop,c=l>300;pt(o=>o!==c?c:o);const v=i.scrollHeight-i.clientHeight;if(v>0){const o=Math.round(l/v*100);js(p=>Math.abs(p-o)>=2?o:p)}}))},[]),kt=n.useCallback(s=>{s&&(s.preventDefault(),s.stopPropagation()),Ze.current&&cancelAnimationFrame(Ze.current);const i=vt.current||document.querySelector(".discord-feed")||document.querySelector(".portal-feed-container");if(!i){window.scrollTo({top:0,behavior:"smooth"});return}const l=i.scrollTop;if(l<=0)return;const c=800,v=performance.now(),o=d=>1-Math.pow(1-d,5),p=d=>{const u=d-v,w=Math.min(u/c,1),g=o(w);i.scrollTop=Math.round(l*(1-g)),w<1?Ze.current=requestAnimationFrame(p):(i.scrollTop=0,Ze.current=null)};Ze.current=requestAnimationFrame(p)},[]);n.useEffect(()=>{const s=()=>{kt(),(!t||!Array.isArray(t.channels)||t.channels.length===0)&&Xe()};return window.addEventListener("oxypace:scroll_portal_top",s),()=>window.removeEventListener("oxypace:scroll_portal_top",s)},[kt,t==null?void 0:t._id,(Zt=t==null?void 0:t.channels)==null?void 0:Zt.length]);const Ss=s=>{ee(s),pt(!1),r&&(L(),j(!0))},ie=n.useCallback((s,i="info")=>{Ne({show:!0,message:s,type:i}),setTimeout(()=>Ne(l=>({...l,show:!1})),4e3)},[]),Ns=s=>{const i=Array.from(s.target.files||[]);if(i.length===0)return;Ce(null),Ve.current=!1;const c=10-Pe.length;if(c<=0){ie("Bir gönderiye en fazla 10 görsel ekleyebilirsiniz.","warning");return}const v=i.slice(0,c);i.length>c&&ie(`En fazla 10 görsel ekleyebilirsiniz. İlk ${c} görsel eklendi.`,"warning");const o=[],p=[];for(const d of v){if(d.size>2*1024*1024*1024){ie(`${d.name} boyutu 2 GB'dan büyük olamaz.`,"error");continue}o.push(d),p.push({url:URL.createObjectURL(d),name:d.name,size:d.size,file:d})}Re(d=>[...d,...o]),Le(d=>[...d,...p]),O(!1),He.current&&(He.current.value="")},ws=s=>{Re(i=>i.filter((l,c)=>c!==s)),Le(i=>{const l=i[s];if(l&&l.url&&l.url.startsWith("blob:"))try{URL.revokeObjectURL(l.url)}catch{}return i.filter((c,v)=>v!==s)})},St=s=>{const i=s.target.files[0];if(i){if(i.size>2*1024*1024*1024){ie("Dosya boyutu 2 GB'dan büyük olamaz.","error");return}Re([]),Le([]),Ce(i),Ve.current=i.type.startsWith("video/")||["mp4","webm","ogg","mov","m4v"].includes(i.name.split(".").pop().toLowerCase()),O(!1)}};n.useEffect(()=>{D||!S||!a||(ye.trim().length>0||U!==null||Pe.length>0?Se||(Oe(!0),S.emit("portal_typing",{portalId:a,isTyping:!0})):Se&&(S.emit("portal_typing",{portalId:a,isTyping:!1}),Oe(!1)))},[ye,U,Pe,a,S,Se,D]),n.useEffect(()=>()=>{!D&&S&&a&&Se&&S.emit("portal_typing",{portalId:a,isTyping:!1})},[a,S,Se,D]);const Kt=async()=>{var g,C;if(D){ie("Hayalet Modu: Salt okunur izleme modundasınız. Gönderi paylaşılamaz.","error");return}const s=ye.trim().length>0,i=!!U,l=Pe.length>0;if(!s&&!i&&!l)return;S&&a&&S.emit("portal_typing",{portalId:a,isTyping:!1}),Oe(!1);const c={content:ye,media:U,mediaFiles:[...Pe],mediaPreviews:[...Me]},v=U&&U.type==="youtube",o=`temp-${Date.now()}`;let p=null,d=null;v?(p=U.url,d="youtube"):l?(p=Me.map(E=>E.url),d="image"):U&&(p=URL.createObjectURL(U),d=U.type.startsWith("video")?"video":U.type.includes("gif")?"gif":"image");const u=d==="video",w={_id:o,content:ye,media:p,mediaType:d||"none",author:y,createdAt:new Date().toISOString(),likes:[],likeCount:0,isOptimistic:!0,quotedPost:V,isProcessing:!!u,processingProgress:0,estimatedTime:u?"Hesaplanıyor...":""};if(N(E=>[w,...E]),P){const E=String(P);xe(_=>({..._,[E]:(_[E]!==void 0?_[E]:(W==null?void 0:W.postCount)||0)+1}))}Ke(""),Ce(null),Re([]),Le([]),O(!1),bt(!0),Je(0);try{let E=null,_=null,B=null,te=null,de=null;if(v)B=c.media.url,te="youtube";else if(c.mediaFiles&&c.mediaFiles.length>0){const h=c.mediaFiles.length,M=new Array(h).fill(0),J=c.mediaFiles.map((F,ne)=>is(F,"post",a,st=>{M[ne]=st;const pe=Math.round(M.reduce((be,Te)=>be+Te,0)/h);Je(pe),N(be=>be.map(Te=>String(Te._id)===String(o)?{...Te,uploadProgress:pe}:Te))}));_=await Promise.all(J)}else if(c.media)if(Ve.current){ss.getState().startVideoUpload({file:c.media,portalId:a,channel:P,content:c.content,quotedPostId:V==null?void 0:V._id,onFinish:(h,M)=>{if(h){if(N(J=>J.filter(F=>String(F._id)!==String(o))),P){const J=String(P);xe(F=>({...F,[J]:Math.max(0,(F[J]||1)-1)}))}ie("Video yükleme başarısız oldu.","error")}else if(M){const J=String(o);N(F=>{const ne=String(M._id);return F.some(pe=>String(pe._id)===ne)?F.filter(pe=>String(pe._id)!==J):F.map(pe=>{if(String(pe._id)===J){const be=M,Te=be.quotedPost&&(typeof be.quotedPost=="string"?be.quotedPost:be.quotedPost._id);return Te&&pe.quotedPost&&Te===pe.quotedPost._id&&(be.quotedPost=pe.quotedPost),be}return pe})})}}}),bt(!1),ot(null);return}else E=await is(c.media,"post",a,h=>{Je(h),N(M=>M.map(J=>String(J._id)===String(o)?{...J,uploadProgress:h}:J))});else Je(100);const Y={content:c.content,portalId:a,channel:P,quotedPostId:V==null?void 0:V._id};_&&_.length>0?(Y.mediaKeys=_,Y.mediaType="image"):E?(Y.mediaKey=E,Ve.current?Y.mediaType="video":c.media&&(c.media.type==="application/pdf"||c.media.name.toLowerCase().endsWith(".pdf"))&&(Y.pdfName=c.media.name,Y.pdfSize=c.media.size)):B&&(Y.media=B,Y.mediaType=te);const oe=await ue.post("/api/posts",Y);ot(null);const me=String(o);N(h=>{const M=String(oe.data._id);return h.some(F=>String(F._id)===M)?h.filter(F=>String(F._id)!==me):h.map(F=>{if(String(F._id)===me){const ne=oe.data,st=ne.quotedPost&&(typeof ne.quotedPost=="string"?ne.quotedPost:ne.quotedPost._id);return st&&F.quotedPost&&st===F.quotedPost._id&&(ne.quotedPost=F.quotedPost),ne}return F})})}catch(E){const _=((C=(g=E.response)==null?void 0:g.data)==null?void 0:C.message)||E.message;if(ie(_,"error"),N(B=>B.filter(te=>String(te._id)!==String(o))),P){const B=String(P);xe(te=>({...te,[B]:Math.max(0,(te[B]||1)-1)}))}Ke(c.content),Ce(c.media),Re(c.mediaFiles||[]),Le(c.mediaPreviews||[])}finally{bt(!1),Je(0)}},[Nt,$e]=n.useState(!1),[wt,ut]=n.useState("overview"),[_a,Ca]=n.useState(!1),[Pa,_s]=n.useState({name:"",description:"",privacy:"public"});n.useRef(null),n.useRef(null);const ht=n.useRef(!1);n.useEffect(()=>{a&&!k&&Xe()},[a,k]),n.useEffect(()=>{a&&!k&&!ht.current&&(!t||!Array.isArray(t.channels)||t.channels.length===0||String(t._id)!==String(a))&&Xe()},[a,k,t==null?void 0:t._id,(Xt=t==null?void 0:t.channels)==null?void 0:Xt.length]),n.useEffect(()=>{$.get("openSettings")==="true"&&(ut("overview"),$e(!0))},[$]),n.useEffect(()=>{if(t&&t._id&&t.name)try{const s=localStorage.getItem("oxypace_portal_visits"),i=s?JSON.parse(s):{},l=String(t._id),c=i[l]||{count:0};i[l]={id:l,name:t.name,avatar:t.avatar,count:(c.count||0)+1,lastVisited:Date.now()},localStorage.setItem("oxypace_portal_visits",JSON.stringify(i));let v=0,o=null;Object.values(i).forEach(p=>{p.count>v&&(v=p.count,o=p)}),o&&localStorage.setItem("oxypace_top_portal",JSON.stringify({id:o.id,name:o.name}))}catch{}},[t==null?void 0:t._id,t==null?void 0:t.name]),n.useEffect(()=>{if(!k&&t&&String(t._id)===String(a)&&t.channels&&t.channels.length>0)if(P){if(f){const i=t.channels.find(l=>String(l._id)===String(f));if(i&&String(i._id)!==String(P)){ee(i._id);return}}if(!t.channels.some(i=>String(i._id)===String(P))){const i=t.channels[0];i&&ee(i._id)}}else{if(f){const i=t.channels.find(l=>String(l._id)===String(f));if(i){ee(i._id);return}}const s=t.channels[0];s&&ee(s._id)}},[t,k,f]),n.useEffect(()=>{const s=i=>{const{portalId:l,channelId:c}=i.detail||{};(!l||String(l)===String(a))&&c&&(ee(c),pt(!1),j&&j(!0))};return window.addEventListener("oxypace:switch_channel",s),()=>window.removeEventListener("oxypace:switch_channel",s)},[a,j]),n.useLayoutEffect(()=>{const s=!!f||$.get("joinVoice")==="true";j&&s&&j(!0)},[a,f,$,j]),n.useEffect(()=>{a&&P&&t&&Pt(t._id,a)&&tt()},[a,P,t==null?void 0:t._id]),n.useEffect(()=>(a&&P&&(!r||b||!!f)?(zt(a,P),$s(a,P),it.getState().clearUnreadForChannel(P,a)):zt(null,null),()=>{zt(null,null)}),[a,P,r,b,f]),n.useEffect(()=>{if(Q&&!qe&&!ve&&Array.isArray(q)&&q.length>0){const s=document.getElementById(`post-${Q}`);s&&setTimeout(()=>{s.scrollIntoView({behavior:"smooth",block:"center"}),s.classList.add("highlight-post"),setTimeout(()=>s.classList.remove("highlight-post"),2e3),je(!0)},100)}},[Q,q,ve,qe]),n.useEffect(()=>{var s,i;if(t&&y){const l=((s=t.members)==null?void 0:s.includes(y._id))||((i=y.joinedPortals)==null?void 0:i.some(c=>c._id===t._id||c===t._id));Be(!!l)}},[t,y]);const Xe=async()=>{var l,c,v,o;if(ht.current)return;ht.current=!0,Z("");let s=null;try{const p=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(p){const d=JSON.parse(p);d&&String(d._id)===String(a)&&Array.isArray(d.channels)&&d.channels.length>0&&(s=d)}}catch{}(!t||String(t._id)!==String(a)||!Array.isArray(t.channels)||t.channels.length===0)&&(s?(R(s),re(!1)):re(!0),pt(!1));let i=null;for(let p=0;p<3;p++)try{const d=await ue.get(`/api/portals/${a}`);R(d.data);try{const g=JSON.stringify(d.data);sessionStorage.setItem(`oxypace_portal_cache_${a}`,g),localStorage.setItem(`oxypace_portal_cache_${a}`,g)}catch{}(l=d.data)!=null&&l.avatar&&as(d.data.avatar,"original");const u=((c=d.data)==null?void 0:c.coverImage)||((v=d.data)==null?void 0:v.banner);u&&as(u,"original");const w=[d.data.owner,...d.data.admins||[],...d.data.members||[]].filter(Boolean);Ds(w),_s({name:d.data.name,description:d.data.description||"",privacy:d.data.privacy||"public"}),Z(""),i=null;break}catch(d){i=d;const u=(o=d.response)==null?void 0:o.status;if(u===403||u===404)break;p<2&&await new Promise(w=>setTimeout(w,1200*(p+1)))}if(i)if(i.response&&i.response.status===403){const p=i.response.data||{};p.portalStatus==="suspended"||p.portalStatus==="closed"?(Ye({portalStatus:p.portalStatus,statusReason:p.statusReason,suspendedUntil:p.suspendedUntil,portalName:p.portalName,portalAvatar:p.portalAvatar}),Z("suspended")):Z("blocked")}else i.response&&i.response.status===404?Z("blocked"):!s&&(!t||String(t._id)!==String(a))&&Z("Portal yüklenemedi");ht.current=!1,re(!1)},ft=n.useRef(null),Ot=n.useRef(q);Ot.current=q;const et=n.useRef(P);et.current=P;const tt=n.useCallback(async(s=!1)=>{var c,v;const i=et.current,l=`portal_posts_${a}_${i}`;if(s)Gt(!0);else{ft.current&&ft.current.abort(),ft.current=new AbortController;let o=!1;try{const p=localStorage.getItem(l)||sessionStorage.getItem(l);if(p){const d=JSON.parse(p);Array.isArray(d)&&d.length>0&&(N(d),Ee(!1),o=!0)}}catch{}o||(Ee(!0),N([])),_t(!0)}try{const o=localStorage.getItem("token"),p={signal:(c=ft.current)==null?void 0:c.signal,...o&&{headers:{Authorization:`Bearer ${o}`}}};if(s&&i!==et.current)return;let d=`/api/portals/${a}/posts?channel=${i}&limit=10`;const u=Ot.current;if(s&&u.length>0){const C=u[u.length-1];d+=`&before=${C.createdAt}`}const w=await ue.get(d,p),g=w.data;if(w.headers&&w.headers["x-total-count"]!==void 0){const C=parseInt(w.headers["x-total-count"],10);isNaN(C)||xe(E=>({...E,[String(i)]:C}))}if(g.length<10&&_t(!1),s)N(C=>{const E=new Set(C.map(B=>B._id)),_=g.filter(B=>!E.has(B._id));return[...C,..._]});else{N(g);try{localStorage.setItem(l,JSON.stringify(g.slice(0,20)))}catch{try{sessionStorage.setItem(l,JSON.stringify(g.slice(0,15)))}catch{}}}Z("")}catch(o){if(ue.isCancel(o))return;((v=o.response)==null?void 0:v.status)===403?Z("private"):Z("Gönderiler yüklenemedi")}finally{s||Ee(!1),Gt(!1),re(!1)}},[a]),[Wt,_t]=n.useState(!0),[Ct,Gt]=n.useState(!1),gt=n.useRef(),Cs=n.useCallback(s=>{Ct||(gt.current&&gt.current.disconnect(),gt.current=new IntersectionObserver(i=>{i[0].isIntersecting&&Wt&&tt(!0)},{root:vt.current,rootMargin:"200px"}),s&&gt.current.observe(s))},[Ct,Wt,tt]);n.useEffect(()=>{N([]),_t(!0),ee(null),R(null),Z(""),j(!1)},[a]);const Ps=n.useCallback(s=>{N(l=>l.filter(c=>String(c._id)!==String(s)));const i=et.current;i&&xe(l=>({...l,[String(i)]:Math.max(0,(l[String(i)]||1)-1)}))},[N]),zs=n.useCallback((s,i)=>{if(i){N(c=>c.filter(v=>String(v._id)!==String(s)));const l=et.current;l&&xe(c=>({...c,[String(l)]:Math.max(0,(c[String(l)]||1)-1)}))}},[N]),Is=n.useCallback(async s=>{try{const l=(await ue.put(`/api/posts/${s}/pin`)).data;N(c=>c.map(o=>o._id===s?l:o).sort((o,p)=>o.isPinned===p.isPinned?new Date(p.createdAt)-new Date(o.createdAt):o.isPinned?-1:1))}catch{ie("Sabitleme işlemi başarısız","error")}},[N,ie]),As=async()=>{var s,i;if(!y){ie("Lütfen giriş yapın veya kaydolun!","warning");return}try{const l=localStorage.getItem("token"),c=l?{headers:{Authorization:`Bearer ${l}`}}:{};if((await ue.post(`/api/portals/${a}/join`,{},c)).data.status==="joined"){Be(!0);const o=Array.isArray(y==null?void 0:y.joinedPortals)?y.joinedPortals:[],p=Array.isArray(y==null?void 0:y.portals)?y.portals:[],d=[...o.filter(g=>{var C;return((C=(g==null?void 0:g._id)||g)==null?void 0:C.toString())!==a.toString()}),t],u=[...p.filter(g=>{var C;return((C=(g==null?void 0:g._id)||g)==null?void 0:C.toString())!==a.toString()}),t],w={...y,joinedPortals:d,portals:u};H(w),R(g=>({...g,members:[...g.members||[],y._id]})),tt(),ie("Portala başarıyla katıldınız!","success")}else ie("Üyelik isteğiniz gönderildi!","info"),R(o=>({...o,isRequested:!0}))}catch(l){ie(((i=(s=l.response)==null?void 0:s.data)==null?void 0:i.message)||"Katılma başarısız","error")}},Pt=(s,i)=>{if(!s||!i)return!1;const l=typeof s=="object"?s.toString():s,c=typeof i=="object"?i.toString():i;return l===c},Vt=y&&t&&t.owner&&Pt(t.owner._id||t.owner,y._id),Yt=Vt||y&&t&&t.admins&&t.admins.some(s=>Pt(s._id||s,y._id));if(n.useEffect(()=>{if(!(ae!=null&&ae.suspendedUntil)){De(null);return}const s=()=>{const l=new Date,v=new Date(ae.suspendedUntil)-l;if(v<=0){De(null),window.location.reload();return}De({days:Math.floor(v/(1e3*60*60*24)),hours:Math.floor(v/(1e3*60*60)%24),minutes:Math.floor(v/(1e3*60)%60),seconds:Math.floor(v/1e3%60)})};s();const i=setInterval(s,1e3);return()=>clearInterval(i)},[ae]),!X&&!k)return e.jsx(Ms,{to:"/",replace:!0});if(he==="suspended"&&ae){const s=ae.portalStatus==="suspended",i=ae.suspendedUntil?new Date(ae.suspendedUntil).toLocaleString("tr-TR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):null;return e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(at,{}),e.jsx("div",{className:"suspension-screen",children:e.jsxs("div",{className:"suspension-card",children:[e.jsx("div",{className:"suspension-icon",children:s?"⏸️":"🔒"}),e.jsx("h1",{className:"suspension-title",children:ae.portalName||"Portal"}),e.jsx("h2",{className:"suspension-subtitle",children:s?"Bu portal geçici olarak askıya alındı":"Bu portal kapatılmıştır"}),ae.statusReason&&e.jsxs("div",{className:"suspension-reason",children:[e.jsx("div",{className:"suspension-reason-label",children:"Sebep"}),e.jsx("p",{children:ae.statusReason})]}),s&&i&&e.jsxs("div",{className:"suspension-unlock",children:[e.jsx("div",{className:"suspension-unlock-label",children:"🔓 Erişim Açılma Tarihi"}),e.jsx("div",{className:"suspension-unlock-date",children:i}),fe&&e.jsxs("div",{className:"suspension-countdown",children:[e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(fe.days).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Gün"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(fe.hours).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saat"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(fe.minutes).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Dakika"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(fe.seconds).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saniye"})]})]})]}),e.jsxs("div",{className:"suspension-policy",children:[e.jsx("span",{children:"📋"}),e.jsxs("p",{children:["Askıya alma nedenleri, platformun ",e.jsx("strong",{children:"Politika ve Koşullar"}),"'ı kapsamında değerlendirilmektedir. Detaylı bilgi için kurallarımızı inceleyebilirsiniz."]})]}),e.jsx("button",{onClick:()=>A("/"),className:"suspension-home-btn",children:"Anasayfaya Dön"})]})})]})}return he&&he!=="suspended"?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(at,{}),e.jsxs("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center",flexDirection:"column",color:"var(--text-muted)"},children:[e.jsx("div",{style:{fontSize:"3rem",marginBottom:"1rem"},children:"🚫"}),e.jsx("h2",{children:he==="blocked"?"Sonuç Bulunamadı":"Bir Hata Oluştu"}),e.jsx("p",{children:he==="blocked"?"Aradığınız portala ulaşılamıyor.":he||"Portal yüklenirken bir sorun oluştu."}),e.jsx("button",{onClick:()=>A("/"),className:"btn-save",style:{marginTop:"20px",float:"none"},children:"Anasayfaya Dön"})]})]}):se||k||!t||!Array.isArray(t.channels)||t.channels.length===0?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(at,{}),e.jsx("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center"},children:e.jsx("div",{className:"spinner"})})]}):t.isNSFW&&!We&&!sessionStorage.getItem(`nsfw_confirmed_${a}`)?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(at,{}),e.jsx("div",{className:"nsfw-gate-overlay",children:e.jsxs("div",{className:"nsfw-gate-card",children:[e.jsx("div",{className:"nsfw-gate-icon",children:e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]})}),e.jsx("div",{className:"nsfw-gate-badge",children:"+18"}),e.jsx("h1",{className:"nsfw-gate-title",children:"Yaş Kısıtlaması"}),e.jsxs("p",{className:"nsfw-gate-desc",children:[e.jsx("strong",{children:t.name})," portalı yetişkin içerik barındırabilir. Bu portala erişmek için 18 yaşından büyük olmanız gerekmektedir."]}),e.jsxs("div",{className:"nsfw-gate-actions",children:[e.jsx("button",{className:"nsfw-gate-confirm",onClick:()=>{sessionStorage.setItem(`nsfw_confirmed_${a}`,"true"),we(!0)},children:"18 yaşından büyüğüm, devam et"}),e.jsx("button",{className:"nsfw-gate-cancel",onClick:()=>A(-1),children:"Geri Dön"})]}),e.jsx("p",{className:"nsfw-gate-legal",children:"Devam ederek, yaşınızın 18'den büyük olduğunu ve yetişkin içerikle ilgili yasal sorumluluğu kabul ettiğinizi onaylarsınız."})]})})]}):e.jsxs("div",{className:`app-wrapper full-height discord-layout ${Ft?"voice-channel-active":""}`,children:[e.jsx(ha,{title:t.name,description:t.description||`${t.name} topluluğuna katılın.`,image:ge(t.avatar),type:"website",schema:{"@context":"https://schema.org","@type":"Community",name:t.name,description:t.description,url:window.location.href,memberCount:((es=t.members)==null?void 0:es.length)||0}}),!Nt&&e.jsx(at,{}),z.show&&e.jsxs("div",{className:`app-toast ${z.type}`,children:[e.jsx("span",{className:"app-toast-icon",children:z.type==="error"?"🚫":z.type==="success"?"✅":z.type==="warning"?"⚠️":"ℹ️"}),z.message]}),e.jsxs("div",{className:`discord-split-view ${r&&b?"mobile-feed-active":""} ${Ft?"voice-room-active":""} ${K?"sidebar-collapsed":""}`,children:[y&&e.jsx(xa,{portal:t,isMember:Ue,canManage:Vt||Yt,onEdit:s=>{ut(typeof s=="string"?s:"overview"),$e(!0)},currentChannel:P,onChangeChannel:Ss,className:`${T?"mobile-open":""} ${r&&b?"mobile-hidden":""}`,onShowPortalInfo:()=>ct(!0)}),e.jsxs("main",{className:`discord-main-content ${r&&!b?"mobile-content-hidden":""} ${Bt?"voice-channel-active":""}`,children:[r&&!b&&e.jsx(ua,{title:(t==null?void 0:t.name)||"Portal",showBack:!1}),(()=>{var v,o,p,d,u,w,g,C,E,_,B,te,de,Y,oe,me;const s=W,i=(s==null?void 0:s.type)||"text",l=(s==null?void 0:s.name)||"...",c=i==="voice"||i==="conference";return e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{display:"flex",flex:1,overflow:"hidden"},children:c?e.jsx("div",{style:{flex:1,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"},children:e.jsx(n.Suspense,{fallback:e.jsx("div",{className:"skeleton-loader",children:e.jsx("p",{children:"Canlı bağlantı odası hazırlanıyor..."})}),children:i==="conference"?e.jsx(Na,{portalId:a,channelId:P,channelName:l,onBack:()=>j(!1)}):e.jsx(Sa,{portalId:a,channelId:P,channelName:l,onBack:()=>j(!1)})})}):e.jsx("div",{className:"channel-messages-area",style:{flex:1,display:"flex",flexDirection:"column"},children:ve?e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"},children:[e.jsx("div",{className:"spinner"}),e.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.9rem"},children:"İçerik yükleniyor..."})]}):e.jsxs(e.Fragment,{children:[!c&&e.jsxs("header",{className:`channel-top-bar ${r?"":"desktop-only"}`,children:[e.jsxs("div",{className:"channel-title-wrapper",children:[r&&e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>j(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",children:i==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",children:l}),(()=>{const h=String((s==null?void 0:s._id)||P||""),M=Fe[h]!==void 0?Fe[h]:(s==null?void 0:s.postCount)??0;return e.jsxs("div",{className:"channel-post-count-badge",title:`${M} Gönderi`,children:[e.jsx(Rt,{size:13}),e.jsx("span",{children:M})]})})()]}),e.jsx("div",{className:"channel-header-actions",children:Ue&&e.jsx("button",{className:`icon-btn ${Ie?"active":""}`,onClick:()=>m(!Ie),title:Ie?"Üyeleri Gizle":"Üyeleri Göster",style:{background:"none",border:"none",color:Ie?"var(--primary-color)":"var(--text-muted)"},children:e.jsx(It,{size:20})})})]}),he==="private"?e.jsx(ls,{portal:t,onClose:()=>{window.history.length>2?A(-1):A("/search")},isMobile:r,onOpenSettings:()=>{ut("overview"),$e(!0)},onJoinStatusChange:h=>{h==="requested"?R(M=>M&&{...M,isRequested:!0}):h==="joined"&&(Be(!0),Z(""),Xe(),tt())}}):e.jsxs(e.Fragment,{children:[(t==null?void 0:t.alerts)&&t.alerts.length>0&&e.jsx(va,{alerts:t.alerts}),e.jsx("div",{className:`portal-feed-container discord-feed ${dt?"tanitim-feed-mode":""}`,onScroll:ks,ref:vt,children:dt?e.jsx(ba,{}):e.jsxs(e.Fragment,{children:[q.length===0&&!se&&e.jsxs("div",{className:"empty-portal",children:[e.jsx("div",{className:"empty-portal-icon",children:"👋"}),e.jsxs("h3",{children:[((o=(v=t==null?void 0:t.channels)==null?void 0:v.find(h=>h._id===P))==null?void 0:o.type)==="voice"?"🎙️":((d=(p=t==null?void 0:t.channels)==null?void 0:p.find(h=>h._id===P))==null?void 0:d.type)==="conference"?"🎤":((w=(u=t==null?void 0:t.channels)==null?void 0:u.find(h=>h._id===P))==null?void 0:w.type)==="image"?"🖼️":"#",((C=(g=t==null?void 0:t.channels)==null?void 0:g.find(h=>String(h._id)===String(P)))==null?void 0:C.name)||"..."," ","kanalına hoş geldin!"]}),e.jsx("p",{children:"Bu kanalda henüz mesaj yok. İlk mesajı sen at!"})]}),Array.isArray(q)&&q.map((h,M)=>{var F;h.isBot===!0||((F=h.author)==null||F.isBot);const J=Us.enableAds;return e.jsxs(n.Fragment,{children:[e.jsx(Fs,{post:h,onDelete:Ps,onPin:Is,onArchive:zs,isAdmin:Yt},h._id),M<q.length-1&&e.jsx("div",{className:"post-separator"}),J]},h._id)}),e.jsx("div",{ref:Cs,style:{height:"40px",margin:"10px 0",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"},children:Ct&&e.jsx("div",{className:"spinner-small"})})]})}),(()=>{const M=2*Math.PI*20,J=M-vs/100*M;return e.jsxs("button",{className:`floating-scroll-top portal-scroll-top ${bs?"visible":""}`,onClick:kt,"aria-label":"Yukarı Çık",children:[e.jsxs("svg",{className:"progress-ring",width:"50",height:"50",viewBox:"0 0 50 50",children:[e.jsx("circle",{className:"progress-ring-track",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25"}),e.jsx("circle",{className:"progress-ring-fill",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25",style:{strokeDasharray:M,strokeDashoffset:J}})]}),e.jsx("div",{className:"scroll-icon",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"m18 15-6-6-6 6"})})})]})})(),dt?null:hs?e.jsxs("div",{className:"channel-input-area",children:[le&&Ls.createPortal(e.jsxs("div",{className:"plus-menu portal-plus-menu-portal",ref:fs,style:{position:"fixed",top:_e.top,left:_e.left,zIndex:99999},children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{He.current.click(),O(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("circle",{cx:"8.5",cy:"8.5",r:"1.5"}),e.jsx("polyline",{points:"21 15 16 10 5 21"})]})}),"Görsel"]}),!mt&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Lt.current.click(),O(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("polygon",{points:"23 7 16 12 23 17 23 7"}),e.jsx("rect",{x:"1",y:"5",width:"15",height:"14",rx:"2",ry:"2"})]})}),"Video"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{$t.current.click(),O(!1)},children:[e.jsx("div",{className:"plus-menu-icon",style:{fontWeight:800,fontSize:"10px"},children:"GIF"}),"GIF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Dt.current.click(),O(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"})]})}),"PDF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{lt(!Mt),O(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"}),e.jsx("polygon",{points:"9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02",fill:"currentColor"})]})}),"YouTube"]})]})]}),document.body),e.jsx("input",{type:"file",ref:He,onChange:Ns,style:{display:"none"},accept:"image/png, image/jpeg, image/jpg, image/webp",multiple:!0}),e.jsx("input",{type:"file",ref:Lt,onChange:St,style:{display:"none"},accept:"video/mp4, video/webm, video/quicktime"}),e.jsx("input",{type:"file",ref:$t,onChange:St,style:{display:"none"},accept:"image/gif"}),e.jsx("input",{type:"file",ref:Dt,onChange:St,style:{display:"none"},accept:".pdf"}),Mt&&e.jsx("div",{className:"edit-modal-overlay",style:{zIndex:9999},children:e.jsxs("div",{className:"edit-modal-modern",style:{maxWidth:"400px",height:"auto",maxHeight:"none"},children:[e.jsxs("div",{className:"edit-modal-header-modern",children:[e.jsx("div",{className:"header-left",children:e.jsx("h3",{className:"header-title-modern",children:"YouTube Videosu Ekle"})}),e.jsx("button",{onClick:()=>lt(!1),className:"close-btn-modern",children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),e.jsxs("div",{className:"edit-modal-content-modern",style:{padding:"20px"},children:[e.jsxs("div",{className:"floating-label-group",children:[e.jsx("label",{className:"floating-label",children:"Video Bağlantısı"}),e.jsx("input",{type:"text",className:"floating-input",placeholder:"https://www.youtube.com/watch?v=...",value:Ge,onChange:ys,autoFocus:!0,onKeyDown:h=>{h.key==="Enter"&&(h.preventDefault(),qt())}})]}),e.jsxs("div",{style:{marginTop:"20px",display:"flex",justifyContent:"flex-end",gap:"10px"},children:[e.jsx("button",{onClick:()=>lt(!1),className:"join-btn outline",style:{padding:"8px 16px"},children:"İptal"}),e.jsx("button",{onClick:qt,className:"join-btn primary",style:{padding:"8px 20px"},children:"Ekle"})]})]})]})}),V&&e.jsxs("div",{className:"input-quoted-preview",children:[e.jsxs("div",{className:"input-quoted-preview-header",children:[(_=(E=V.author)==null?void 0:E.profile)!=null&&_.avatar?e.jsx("img",{src:ge(V.author.profile.avatar),alt:"",className:"quoted-preview-avatar",loading:"lazy",decoding:"async",width:"32",height:"32"}):e.jsx("div",{className:"quoted-preview-avatar-placeholder",children:(te=(B=V.author)==null?void 0:B.username)==null?void 0:te.charAt(0).toUpperCase()}),e.jsxs("div",{className:"quoted-preview-meta",children:[e.jsx("span",{className:"quoted-preview-author",children:((Y=(de=V.author)==null?void 0:de.profile)==null?void 0:Y.displayName)||((oe=V.author)==null?void 0:oe.username)}),e.jsxs("span",{className:"quoted-preview-username",children:["@",(me=V.author)==null?void 0:me.username]})]}),e.jsx("button",{className:"remove-quote-btn",onClick:()=>ot(null),children:e.jsx(nt,{size:16})})]}),e.jsxs("div",{className:"input-quoted-preview-body",children:[e.jsx("p",{className:"input-quoted-preview-text",children:V.content}),V.media&&e.jsx("div",{className:"input-quoted-preview-media",children:V.mediaType==="video"?e.jsxs("div",{className:"media-placeholder",children:[e.jsx(da,{size:20}),e.jsx("span",{children:"Video Alıntısı"})]}):e.jsx("img",{src:ge(V.media),alt:"",loading:"lazy",decoding:"async",width:"120",height:"80"})})]})]}),mt&&ye.trim()&&!U&&Pe.length===0&&e.jsxs("div",{className:"image-channel-warning",style:{backgroundColor:"rgba(239, 68, 68, 0.1)",border:"1px solid rgba(239, 68, 68, 0.25)",color:"#f87171",padding:"8px 12px",borderRadius:"8px",fontSize:"13px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{flexShrink:0},children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]}),e.jsx("span",{children:"Görsel kanallarında paylaşım yapabilmek için mutlaka bir görsel eklemelisiniz."})]}),D?e.jsxs("div",{className:"ghost-channel-notice",style:{backgroundColor:"#0c0c0c",borderTop:"1px solid #222",color:"#888",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",fontSize:"13px"},children:[e.jsxs("svg",{viewBox:"0 0 24 24",width:"18",height:"18",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{opacity:.7},children:[e.jsx("path",{d:"M12 2a5 5 0 0 0-5 5v14l3-2 2 2 2-2 3 2V7a5 5 0 0 0-5-5z"}),e.jsx("circle",{cx:"10",cy:"8",r:"1",fill:"currentColor"}),e.jsx("circle",{cx:"14",cy:"8",r:"1",fill:"currentColor"})]}),e.jsx("span",{children:"Hayalet Modu: Salt okunur izleme modundasınız. Kanalda mesaj ve gönderi paylaşılamaz."})]}):e.jsxs("div",{className:"message-input-wrapper",children:[e.jsx("button",{ref:Qe,className:`input-action-btn upload-btn ${le?"active":""}`,onClick:gs,style:{backgroundColor:"#383a40",borderRadius:"50%",width:"32px",height:"32px",marginRight:"12px",color:le?"var(--primary-color)":"#b9bbbe"},children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z"})})}),U&&e.jsxs("div",{className:"input-media-preview",style:{marginRight:"12px",display:"flex",alignItems:"center",backgroundColor:"var(--bg-secondary)",borderRadius:"8px",padding:"4px",gap:"8px",border:"1px solid var(--border-subtle)"},children:[U.type==="youtube"&&U.preview?e.jsx("img",{src:U.preview,alt:"Video Preview",style:{width:"40px",height:"30px",objectFit:"cover",borderRadius:"4px"},loading:"lazy",decoding:"async",width:"40",height:"30"}):e.jsx("span",{style:{fontSize:"20px",lineHeight:1,padding:"4px"},children:U.type.startsWith("video")?"🎥":U.type.includes("gif")?"👾":U.type==="application/pdf"||U.name&&U.name.toLowerCase().endsWith(".pdf")?"📄":"🖼️"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",maxWidth:"100px"},children:e.jsx("span",{style:{fontSize:"10px",color:"var(--text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:U.name||"Medya"})}),e.jsx("button",{onClick:()=>Ce(null),style:{background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer"},children:"×"})]}),e.jsx("input",{type:"text",placeholder:mt?"Gönderi paylaşmak için bir görsel ekleyin...":`#${(W==null?void 0:W.name)||"..."} kanalına mesaj gönder`,value:ye,onChange:h=>{Ke(h.target.value)},onKeyDown:h=>{h.key==="Enter"&&!h.shiftKey&&(h.preventDefault(),Kt())}}),e.jsx("div",{className:"input-right-actions",children:e.jsx("button",{className:"input-action-btn send-btn",onClick:Kt,disabled:Ut||(mt?!U&&Pe.length===0:!ye.trim()&&!U&&Pe.length===0),title:"Gönder",style:{color:ye.trim()||U||Pe.length>0?"var(--primary-color)":"var(--text-tertiary)"},children:Ut?e.jsxs("div",{className:"compose-spinner-wrapper",style:{width:"20px",height:"20px"},children:[e.jsx("div",{className:"compose-spinner",style:{width:"20px",height:"20px",borderTopColor:"var(--primary-color)"}}),e.jsxs("span",{className:"compose-progress-text",style:{fontSize:"7px",color:"var(--text-primary)"},children:[ms,"%"]})]}):e.jsx(ma,{size:20})})})]}),Me&&Me.length>0&&e.jsxs("div",{className:"portal-image-previews-container",children:[e.jsxs("div",{className:"portal-image-previews-header",children:[e.jsxs("span",{className:"portal-image-previews-count",children:["Seçilen Görseller (",Me.length,"/10)"]}),Me.length<10&&e.jsx("button",{type:"button",className:"portal-add-more-images-btn",onClick:()=>{var h;return(h=He.current)==null?void 0:h.click()},children:"+ Görsel Ekle"})]}),e.jsx("div",{className:"portal-image-previews-list",children:Me.map((h,M)=>e.jsxs("div",{className:"portal-image-preview-item",children:[e.jsx("img",{src:h.url,alt:`Preview ${M+1}`,className:"portal-image-preview-thumb"}),e.jsx("button",{type:"button",className:"portal-image-remove-btn",onClick:()=>ws(M),title:"Görseli Kaldır",children:e.jsx(nt,{size:14})}),e.jsx("span",{className:"portal-image-index-badge",children:M+1})]},M))})]}),ce&&ce.length>0&&e.jsxs("div",{className:"portal-typing-indicator",style:{marginTop:"8px"},children:[e.jsx("div",{className:"typing-avatars-group",children:ce.map(h=>e.jsx("img",{src:ge(h.avatar),alt:h.displayName,className:"typing-avatar",title:h.displayName},h.userId))}),e.jsx("span",{className:"typing-text",children:ce.length===1?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:ce[0].displayName})," yazıyor..."]}):ce.length===2?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:ce[0].displayName})," ve ",e.jsx("strong",{children:ce[1].displayName})," yazıyor..."]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:ce[0].displayName})," ve ",ce.length-1," kişi daha yazıyor..."]})})]})]}):e.jsx("div",{className:"channel-input-area",style:{padding:"0 20px 24px 20px",backgroundColor:"transparent",borderTop:"none"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--glass-bg)",padding:"12px 20px",borderRadius:"8px",border:"1px solid var(--glass-border)",backdropFilter:"blur(20px) saturate(160%)",WebkitBackdropFilter:"blur(20px) saturate(160%)",boxShadow:"var(--glass-shadow)"},children:[e.jsxs("span",{style:{color:"var(--text-secondary)",fontWeight:500,fontSize:"14px"},children:["Bu kanalda mesaj göndermek için ",y?"portala katılmalısın.":"giriş yapmalısın."]}),y?e.jsx("button",{className:"privacy-join-btn",onClick:As,disabled:t.isRequested,style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:t.isRequested?"İstek Gönderildi":"Portala Katıl"}):e.jsx("button",{className:"privacy-join-btn",onClick:()=>A("/login"),style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:"Giriş Yap"})]})})]})]})})}),Ie&&e.jsx(ya,{members:[...t.owner?[{...t.owner,role:"owner"}]:[],...(t.admins||[]).map(h=>({...h,role:"admin"})),...t.members||[]].filter((h,M,J)=>{const F=String(h._id||h.id||h);return h&&J.findIndex(ne=>String(ne._id||ne.id||ne)===F)===M}),onClose:()=>m(!1)})]})})()]})]}),Nt&&wt!=="notifications"&&e.jsx(n.Suspense,{fallback:null,children:e.jsx(ja,{portal:t,currentUser:y,initialTab:wt,onClose:()=>$e(!1),onUpdate:s=>{R(s)}})}),Nt&&wt==="notifications"&&e.jsx("div",{className:"portal-notifications-modal",onClick:()=>$e(!1),children:e.jsxs("div",{className:"notifications-modal-content",onClick:s=>s.stopPropagation(),children:[e.jsx("button",{className:"close-notifications-btn",onClick:()=>$e(!1),children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsx(n.Suspense,{fallback:null,children:e.jsx(ka,{portalId:t._id,portalChannels:t.channels||[],onUpdate:Xe})})]})}),ps&&t&&e.jsx(ls,{portal:t,onClose:()=>ct(!1),isMobile:r,onOpenSettings:()=>{ct(!1),ut("overview"),$e(!0)},onLeave:()=>{ct(!1),Be(!1),A("/")}})]})};export{Ja as default};
