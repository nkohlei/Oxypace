const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PortalSettingsModal-LzYwsMEi.js","assets/vendor-CJCR4Cdx.js","assets/index-D4pjRFVQ.js","assets/socket-KtS637i9.js","assets/livekit-BEAUSX0o.js","assets/lucide-Km5ZLk7G.js","assets/index-Z_oFmjBt.css","assets/ImageCropper-XFdhkmdX.js","assets/ImageCropper-Dk7oVLRB.css","assets/PortalBadges-BcXo8yQH.js","assets/UserBadges--eua7oek.js","assets/UserBadges-DFKBzEd_.css","assets/PortalBadges-bryM1aQu.css","assets/PortalSettingsModal-CHDypHKx.css","assets/PortalNotifications-4N8A-vi8.js","assets/PortalNotifications-zEgqx9Vo.css","assets/VoiceChannel-DQosQ-sc.js","assets/VoiceChannel-0lJSgsyN.js","assets/VoiceChannel-CoZzLTXb.css","assets/ConferenceChannel-DhNP7Vhh.js"])))=>i.map(i=>d[i]);
import{r,a4 as e,a2 as oe,a5 as kt,aq as Wt,as as As,a7 as zs,ar as Is,a8 as Ts,a9 as nt,a3 as it}from"./vendor-CJCR4Cdx.js";import{d as pe,l as es,u as rt,m as ts,i as Ye,c as St,b as Yt,n as yt,o as Es,p as Ht,h as Ms,q as Rs,a as Ds}from"./index-D4pjRFVQ.js";import{u as Ls}from"./useVideoTranscoder-CziI2jfT.js";import{P as $s}from"./PostCard-DPwQbY9o.js";import{g as qs,c as Bs}from"./PostAttachments-BrCJcNuZ.js";import{c as Us,X as lt,aj as Fs,a2 as Ks,a8 as Os,M as Nt,ad as Vs,a7 as Gs,q as ss,e as Ws,ab as Ys,I as as,o as Hs,aM as Js,aN as Zs,ai as Qs,Z as Jt,aG as Xs,ae as ea,F as ta,y as sa,B as aa,G as na,z as vt,j as ia,aO as ns,az as ra,p as la,r as oa,aP as ca,aQ as da}from"./lucide-Km5ZLk7G.js";import{U as Zt}from"./UserBadges--eua7oek.js";import{P as jt}from"./PortalBadges-BcXo8yQH.js";import{U as ma}from"./UserBar-BRqgDEnX.js";import{P as Qt}from"./PortalInfoModal-H-V0gSqI.js";import{N as Ge}from"./Navbar-BCMrRWNW.js";import{S as ha}from"./SubHeader-C7qF7oF_.js";import{S as pa}from"./SEO-bvlJdcCl.js";import{C as ua,a as fa,A as ga,F as xa}from"./ComposerAttachmentTray-C9phw8JX.js";import{e as ba,a as Xt,r as We,b as ya,p as va,c as ja}from"./mediaAttachments-r4yvXCD2.js";import"./socket-KtS637i9.js";import"./livekit-BEAUSX0o.js";import"./UserAvatar-D4lldI8k.js";import"./LinkPreview-Dpkh5s1w.js";/* empty css                      */import"./Login-CCc-v2ZZ.js";/* empty css             *//* empty css                  */const ka=({portalId:a,onClose:g})=>{const[D,p]=r.useState(""),[Y,x]=r.useState([]),[J,V]=r.useState(!1),[k,S]=r.useState(new Set);r.useEffect(()=>{const I=setTimeout(async()=>{if(D.trim().length===0){x([]);return}V(!0);try{const R=await oe.get(`/api/users/search?q=${D}`);x(R.data)}catch{}finally{V(!1)}},500);return()=>clearTimeout(I)},[D]);const K=async z=>{var I,R;try{await Promise.all([oe.post(`/api/portals/${a}/invite`,{userId:z}),oe.post("/api/messages",{recipientId:z,portalId:a,content:"Seni bir portala davet ettim!"})]),S(i=>new Set(i).add(z))}catch(i){alert(((R=(I=i.response)==null?void 0:I.data)==null?void 0:R.message)||"İşlem sırasında bir hata oluştu.")}},T=async()=>{const z=qs(a),I=await Bs(z);alert(I?"Davet bağlantısı kopyalandı!":`Bağlantı kopyalanamadı: ${z}`)};return e.jsx("div",{className:"invite-modal-overlay",onClick:g,children:e.jsxs("div",{className:"invite-modal",onClick:z=>z.stopPropagation(),children:[e.jsxs("div",{className:"invite-header",children:[e.jsx("h2",{children:"Kullanıcı Davet Et"}),e.jsxs("div",{className:"header-actions",children:[e.jsxs("button",{className:"copy-link-btn",title:"Bağlantıyı Kopyala",onClick:T,children:[e.jsx(Us,{size:20,strokeWidth:2}),e.jsx("span",{children:"Bağlantı"})]}),e.jsx("button",{className:"close-btn",onClick:g,children:e.jsx(lt,{size:24,strokeWidth:2})})]})]}),e.jsx("div",{className:"invite-search-container",children:e.jsx("input",{type:"text",className:"invite-search-input",placeholder:"Kullanıcı adı ara...",value:D,onChange:z=>p(z.target.value),autoFocus:!0})}),e.jsxs("div",{className:"invite-results custom-scrollbar",children:[J&&e.jsx("div",{className:"loading-text",children:"Aranıyor..."}),!J&&Y.length===0&&D&&e.jsx("div",{className:"no-play-text",children:"Sonuç bulunamadı."}),Y.map(z=>{var i;const I=z._id||z,R=k.has(I);return e.jsxs("div",{className:"invite-user-row",children:[e.jsxs("div",{className:"user-info",children:[e.jsx("img",{src:pe((i=z.profile)==null?void 0:i.avatar),alt:"",className:"user-avatar"}),e.jsx("span",{className:"user-name",children:z.username})]}),e.jsx("button",{className:`invite-btn ${R?"invited":""}`,onClick:()=>!R&&K(I),disabled:R,children:R?"Gönderildi":"Davet Et"})]},I)})]})]})})},Sa=({startedAt:a,style:g={},className:D=""})=>{const{roomStartTime:p}=es()||{},[Y,x]=r.useState("00:00");r.useEffect(()=>{const V=p&&a===p?p:a;if(!V){x("00:00");return}const k=()=>{const K=Math.floor((Date.now()-V)/1e3);if(K<0){x("00:00");return}const T=Math.floor(K/3600),z=Math.floor(K%3600/60),I=K%60;x(T>0?`${T.toString().padStart(2,"0")}:${z.toString().padStart(2,"0")}:${I.toString().padStart(2,"0")}`:`${z.toString().padStart(2,"0")}:${I.toString().padStart(2,"0")}`)};k();const S=setInterval(k,1e3);return()=>clearInterval(S)},[a,p]);const J={display:"flex",alignItems:"center",fontSize:"15px",fontWeight:"800",color:"#39FF14",background:"transparent",border:"none",padding:"0 4px"};return e.jsx("div",{style:{...J,...g},className:D,children:Y})},Na=({portal:a,isMember:g,onEdit:D,currentChannel:p,onChangeChannel:Y,className:x,canManage:J,onShowPortalInfo:V})=>{var De,Se;const{user:k}=rt(),[S,K]=r.useState(!1);kt();const T=ts(),{isMobileView:z}=T||{},I=(T==null?void 0:T.isDesktopSidebarCollapsed)||!1,R=(T==null?void 0:T.setIsDesktopSidebarCollapsed)||(()=>{}),i=Ye(c=>c.unreadPostsByChannel),y=Ye(c=>c.clearUnreadForChannel),{roomStartTime:j,activeRoom:q,participants:L}=es(),{socket:s,onlineUsers:E}=St(),[$,N]=r.useState({}),[X,ae]=r.useState(null),fe=r.useRef(null),_e=(c,P)=>{P.stopPropagation(),fe.current&&clearTimeout(fe.current),ae(c),fe.current=setTimeout(()=>{ae(null)},1800)};r.useEffect(()=>()=>{fe.current&&clearTimeout(fe.current)},[]);const ce=c=>{if(!c)return null;if(typeof c=="string")return c;const P=c._id||c.id;return P?String(P):null},H=new Set,ee=ce(a==null?void 0:a.owner);ee&&H.add(ee),((a==null?void 0:a.admins)||[]).forEach(c=>{const P=ce(c);P&&H.add(P)}),((a==null?void 0:a.members)||[]).forEach(c=>{const P=ce(c);P&&H.add(P)});const $e=new Set((E||[]).map(c=>String(c))),de=k!=null&&k._id?String(k._id):null,ze=((Se=(De=k==null?void 0:k.settings)==null?void 0:De.privacy)==null?void 0:Se.showOnlineStatus)!==!1;de&&H.has(de)&&ze?$e.add(de):de&&!ze&&$e.delete(de);let Ie=0;H.forEach(c=>{$e.has(c)&&Ie++});const Te=H.size||(a==null?void 0:a.membersCount)||((a==null?void 0:a.members)||[]).length||0;r.useEffect(()=>{p&&(a!=null&&a._id)&&y(p,a._id)},[p,a==null?void 0:a._id,y]),r.useEffect(()=>{var ve;if(!(a!=null&&a._id)||!((ve=a==null?void 0:a.channels)!=null&&ve.length))return;const c=a.channels.filter(ne=>ne.type==="voice"||ne.type==="conference");if(c.length===0)return;let P=!0;const ye=async()=>{try{const ne=await Promise.all(c.map(async G=>{var Ne,qe;const je=G._id||G.id;try{const he=await oe.get(`/api/voice/rooms/${a._id}/${je}/participants?t=${Date.now()}`);return{channelId:String(je),count:((qe=(Ne=he.data)==null?void 0:Ne.participants)==null?void 0:qe.length)||0}}catch{return{channelId:String(je),count:0}}}));P&&N(G=>{const je={...G};return ne.forEach(Ne=>{je[Ne.channelId]=Ne.count}),je})}catch{}};ye();const Le=setInterval(ye,1e4);return()=>{P=!1,clearInterval(Le)}},[a==null?void 0:a._id,a==null?void 0:a.channels]),r.useEffect(()=>{if(!s)return;const c=P=>{!P||!P.channelId||P.portalId&&String(P.portalId)!==String(a==null?void 0:a._id)||N(ye=>({...ye,[String(P.channelId)]:Number(P.count)||0}))};return s.on("voice:channel-count-update",c),()=>{s.off("voice:channel-count-update",c)}},[s,a==null?void 0:a._id]);const _=a!=null&&a.channels?[...a.channels].sort((c,P)=>(c.order||0)-(P.order||0)).map(c=>({id:c._id,name:c.name,type:c.type||"text",postCount:c.postCount})):[],Q=_.find(c=>String(c.id)===String(p)),Ee=(Q==null?void 0:Q.type)==="voice"||(Q==null?void 0:Q.type)==="conference";r.useEffect(()=>{!Ee&&I&&R(!1)},[Ee,I,R]);const ue=c=>String(p)===String(c),Me=(a==null?void 0:a.coverImage)||(a==null?void 0:a.banner),ge=Me?pe(Me):null,Re=ge?`url("${ge}")`:a&&!Me?'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")':"none",[le,xe]=r.useState(!1),be=r.useRef(null);return r.useEffect(()=>{if(!ge){xe(!0),be.current=null;return}if(be.current===ge){xe(!0);return}be.current=ge;const c=new window.Image;c.src=ge,c.complete?xe(!0):(xe(!1),c.onload=()=>xe(!0),c.onerror=()=>xe(!0))},[ge]),a?e.jsxs("div",{className:`channel-sidebar ${I?"collapsed":""} ${x||""}`,style:{height:"calc(100% - 24px)",backgroundColor:"transparent",display:"flex",flexDirection:"column",flexShrink:0,overflow:"visible",position:"relative",borderRight:"none"},children:[!z&&Ee&&e.jsx("button",{className:"sidebar-toggle-btn",onClick:c=>{c.stopPropagation(),R(!I)},title:I?"Menüyü Göster":"Menüyü Gizle",children:I?e.jsx(Fs,{size:16}):e.jsx(Ks,{size:16})}),e.jsxs("div",{className:"sidebar-content-wrapper",style:{display:"flex",flexDirection:"column",flex:1,width:"100%",height:"100%",overflow:"hidden",transition:"opacity 0.2s ease, visibility 0.2s ease",opacity:I?0:1,visibility:I?"hidden":"visible",gap:"8px",padding:"0px",boxSizing:"border-box"},children:[e.jsxs("div",{className:"cs-panel cs-panel--banner",children:[e.jsxs("div",{className:"channel-banner-container",onClick:()=>V&&V(),children:[e.jsx("div",{className:"channel-banner-image",style:{backgroundImage:Re,opacity:le?1:0}}),e.jsx("div",{className:"channel-banner-overlay"})]}),e.jsxs("div",{className:"portal-quick-info",children:[e.jsxs("div",{className:"portal-info-main",onClick:()=>V&&V(),children:[e.jsxs("h2",{className:"portal-title-text",children:[e.jsx("span",{className:"portal-title-name",children:a.name}),e.jsx(jt,{portal:a,size:18})]}),e.jsxs("div",{className:"portal-stats-row",children:[e.jsxs("div",{className:`stat-item ${X==="members"?"stat-tooltip-active":""}`,onClick:c=>_e("members",c),title:"Üye",children:[e.jsx(Os,{size:12}),e.jsx("span",{children:Te}),e.jsx("div",{className:"stat-floating-tag",children:"Üye"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${X==="posts"?"stat-tooltip-active":""}`,onClick:c=>_e("posts",c),title:"Gönderi",children:[e.jsx(Nt,{size:12}),e.jsx("span",{children:a.postCount||0}),e.jsx("div",{className:"stat-floating-tag",children:"Gönderi"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${X==="online"?"stat-tooltip-active":""}`,onClick:c=>_e("online",c),title:"Çevrimiçi",children:[e.jsx("div",{className:"online-indicator-dot"}),e.jsx("span",{children:Ie}),e.jsx("div",{className:"stat-floating-tag",children:"Çevrimiçi"})]})]})]}),e.jsxs("div",{className:"portal-header-actions",children:[(g||J)&&e.jsx("button",{className:"portal-action-btn-circle",onClick:c=>{c.stopPropagation(),D&&D("notifications")},title:"Bildirim Ayarları",children:e.jsx(Vs,{size:16})}),g&&e.jsx("button",{className:"portal-action-btn-circle",onClick:c=>{c.stopPropagation(),K(!0)},title:"Davet Et",children:e.jsx(Gs,{size:18})})]})]})]}),e.jsxs("div",{className:"cs-panel cs-panel--channels custom-scrollbar",children:[e.jsxs("div",{className:"cs-channels-header",children:[e.jsx("span",{children:"Kanallar"}),J&&e.jsx("div",{onClick:c=>{c.stopPropagation(),D&&D("channels")},className:"cs-add-channel-btn",title:"Kanal Oluştur",children:"+"})]}),e.jsx("div",{className:"cs-channel-list",children:_.map(c=>{var ne;const P=ue(c.id),ye=c.type==="announcement"||c.name.includes("announcements"),Le=c.type==="voice"||c.type==="conference";let ve=$[String(c.id)]??0;return q&&String(q.channelId)===String(c.id)&&Array.isArray(L)&&(ve=L.filter(G=>!G.isScreenSharing&&!String(G.identity).endsWith("-screen")).length),e.jsxs("div",{className:`channel-item ${P?"active":""}`,onClick:()=>Y(c.id),style:{padding:"6px 8px",margin:"2px 0",borderRadius:"4px",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",color:P?"white":"#949ba4",backgroundColor:P?"#3f4147":"transparent",transition:"background-color 0.15s ease, color 0.15s ease"},children:[e.jsx("div",{style:{color:P?"white":"var(--text-secondary)",display:"flex",alignItems:"center",minWidth:"20px",justifyContent:"center"},children:c.type==="conference"?e.jsx(ss,{size:20,strokeWidth:2}):c.type==="voice"?e.jsx(Ws,{size:20,strokeWidth:2}):ye?e.jsx(Ys,{size:20,strokeWidth:2.5}):c.type==="image"?e.jsx(as,{size:20,strokeWidth:2.5,style:{color:"#f59e0b"}}):e.jsx(Hs,{size:20,strokeWidth:2.5})}),e.jsx("span",{style:{fontWeight:P?600:500,fontSize:"16px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:P?"white":"var(--text-primary)",maxWidth:"fit-content"},children:c.name}),Le&&e.jsx("span",{className:`vc-channel-active-badge ${ve>0?"online":"idle"}`,children:ve>0?`${ve} aktif`:"aktif yok"}),!P&&((ne=i[c.id])==null?void 0:ne.length)>0&&e.jsx("div",{style:{backgroundColor:"#f23f43",color:"white",fontSize:"11px",fontWeight:"bold",padding:"0 6px",borderRadius:"8px",minWidth:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.3)",marginLeft:"-4px",flexShrink:0},children:i[c.id].length>9?"9+":i[c.id].length}),e.jsx("div",{style:{flex:1}}),P&&Le&&q&&String(q.channelId)===String(c.id)&&j&&e.jsx("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:e.jsx(Sa,{startedAt:j,className:"vc-sidebar-timer"})})]},c.id)})})]}),e.jsxs("div",{className:"cs-panel cs-panel--userbar",children:[e.jsx(ma,{currentChannelId:p}),e.jsx("div",{className:"cs-footer-copyright",children:"© 2026 Oxypace. Tüm hakları saklıdır."})]})]}),e.jsx("style",{children:`
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
            `}),S&&e.jsx(ka,{portalId:a._id,onClose:()=>K(!1)})]}):null},wa=({members:a=[],onClose:g})=>{var I,R;const{onlineUsers:D}=St(),{user:p}=rt(),[,Y]=r.useState(0);r.useEffect(()=>{const i=setInterval(()=>{Y(y=>y+1)},6e4);return()=>clearInterval(i)},[]);const x=i=>{if(!i)return"";const y=new Date,j=new Date(i),q=Math.max(0,y-j),L=Math.floor(q/6e4);if(L<1)return"şimdi";if(L<60)return`${L}dk`;const s=Math.floor(L/60);if(s<24)return`${s}sa`;const E=Math.floor(s/24);if(E<30)return`${E}g`;const $=Math.floor(E/30);return $<12?`${$}ay`:`${Math.floor($/12)}y`},J=i=>{if(!i)return null;if(typeof i=="string")return i;const y=i._id||i.id;return y?String(y):null},V=new Set((D||[]).map(i=>String(i))),k=p!=null&&p._id?String(p._id):null,S=((R=(I=p==null?void 0:p.settings)==null?void 0:I.privacy)==null?void 0:R.showOnlineStatus)!==!1;k&&S?V.add(k):k&&!S&&V.delete(k);const K=i=>(i==null?void 0:i.role)==="owner"?3:(i==null?void 0:i.role)==="admin"||i!=null&&i.isAdmin?2:1,T=a.filter(i=>{if(!i)return!1;const y=J(i);return y&&V.has(y)}).sort((i,y)=>{var s,E;const j=K(y)-K(i);if(j!==0)return j;const q=((s=i.profile)==null?void 0:s.displayName)||i.username||"",L=((E=y.profile)==null?void 0:E.displayName)||y.username||"";return q.localeCompare(L)}),z=a.filter(i=>{if(!i)return!1;const y=J(i);return y&&!V.has(y)}).sort((i,y)=>{var s,E;const j=K(y)-K(i);if(j!==0)return j;const q=((s=i.profile)==null?void 0:s.displayName)||i.username||"",L=((E=y.profile)==null?void 0:E.displayName)||y.username||"";return q.localeCompare(L)});return e.jsxs("div",{className:"members-sidebar custom-scrollbar",children:[e.jsxs("div",{className:"members-header-top",children:[e.jsx("h3",{children:"ÜYELER"}),g&&e.jsx("button",{onClick:g,className:"close-members-btn","aria-label":"Kapat",children:e.jsx(lt,{size:20,strokeWidth:2})})]}),e.jsxs("div",{className:"members-category",children:["Çevrim içi — ",T.length]}),T.map((i,y)=>{var $,N,X,ae;if(!i||typeof i=="string")return null;const j=i.username||"Unknown",q=(($=i.profile)==null?void 0:$.avatar)||i.avatar,L=((N=i.profile)==null?void 0:N.displayName)||j,s=i.role==="owner",E=i.role==="admin"||i.isAdmin;return e.jsxs(Wt,{to:`/profile/${j}`,className:"member-item member-link",children:[e.jsxs("div",{className:"member-avatar-wrapper",children:[q?e.jsx("img",{src:pe(q,"thumbnail"),alt:"",className:"member-avatar",loading:"eager",decoding:"async"}):e.jsx("div",{className:"member-avatar-placeholder",children:((X=L[0])==null?void 0:X.toUpperCase())||((ae=j[0])==null?void 0:ae.toUpperCase())||"?"}),e.jsx("div",{className:"status-indicator online"})]}),e.jsxs("div",{className:"member-info",style:{display:"flex",alignItems:"center",gap:"6px"},children:[e.jsxs("span",{className:"member-name active-role",style:{color:s?"#f1c40f":E?"#3498db":"#2ecc71"},children:[L,s&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!s&&E&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"})]}),e.jsx(Zt,{user:i,size:13})]})]},i._id||i.id||y)}),e.jsxs("div",{className:"members-category",children:["Çevrim dışı — ",z.length]}),z.map((i,y)=>{var $,N,X,ae;if(!i||typeof i=="string")return null;const j=i.username||"Unknown",q=(($=i.profile)==null?void 0:$.avatar)||i.avatar,L=((N=i.profile)==null?void 0:N.displayName)||j,s=i.role==="owner",E=i.role==="admin"||i.isAdmin;return e.jsxs(Wt,{to:`/profile/${j}`,className:"member-item offline member-link",children:[e.jsx("div",{className:"member-avatar-wrapper",children:q?e.jsx("img",{src:pe(q,"thumbnail"),alt:"",className:"member-avatar",loading:"eager",decoding:"async"}):e.jsx("div",{className:"member-avatar-placeholder",style:{backgroundColor:"var(--bg-secondary)"},children:((X=L[0])==null?void 0:X.toUpperCase())||((ae=j[0])==null?void 0:ae.toUpperCase())||"?"})}),e.jsx("div",{className:"member-info",style:{flex:1},children:e.jsxs("div",{className:"member-name-row",style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("span",{className:"member-name",style:{display:"flex",alignItems:"center",gap:"4px"},children:[L,s&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!s&&E&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"}),e.jsx(Zt,{user:i,size:13})]}),i.lastActive&&e.jsx("span",{className:"last-active-time",style:{fontSize:"11px",color:"var(--text-muted)"},children:x(i.lastActive)})]})})]},i._id||i.id||`offline-${y}`)}),e.jsx("style",{children:`
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
            `})]})},_a=()=>{var I,R;const{user:a,updateUser:g}=rt(),D=kt(),[p,Y]=r.useState(null),[x,J]=r.useState([]),[V,k]=r.useState(!0),[S,K]=r.useState(null);r.useEffect(()=>{let i=!0;return(async()=>{try{const j=await oe.get("/api/portals/showcase");i&&j.data&&(Y(j.data.globalPortal||null),J(Array.isArray(j.data.topPortals)?j.data.topPortals:[]))}catch{}finally{i&&k(!1)}})(),()=>{i=!1}},[]);const T=async(i,y)=>{var j,q,L;if(i.stopPropagation(),!a){D("/login");return}if(y.isMember){D(`/portal/${y._id}`);return}if(!(y.isRequested||S===y._id)){K(y._id);try{const E=((j=(await oe.post(`/api/portals/${y._id}/join`)).data)==null?void 0:j.status)==="requested",$=N=>!N||N._id!==y._id?N:{...N,isMember:!E,isRequested:E,memberCount:E?N.memberCount:(N.memberCount||0)+1};if((p==null?void 0:p._id)===y._id&&Y($(p)),J(N=>N.map($)),!E&&a&&g){const N=a.joinedPortals||[];N.some(X=>(X._id||X).toString()===y._id.toString())||g({joinedPortals:[...N,y],portals:[...a.portals||[],y]})}}catch(s){alert(((L=(q=s.response)==null?void 0:q.data)==null?void 0:L.message)||"İşlem gerçekleştirilemedi.")}finally{K(null)}}},z=i=>i!=null&&i.banner?`url(${pe(i.banner)}) center/cover no-repeat`:"#141414";return e.jsxs("div",{className:"tanitim-showcase-wrapper",children:[e.jsxs("section",{className:"tanitim-guide-card",children:[e.jsxs("div",{className:"tanitim-guide-header",children:[e.jsxs("div",{className:"tanitim-guide-tag",children:[e.jsx(Js,{size:13}),e.jsx("span",{children:"SİSTEM DİREKTİFİ // RESMİ PLATFORM REHBERİ"})]}),e.jsx("h1",{className:"tanitim-guide-title",children:"Oxypace İletişim Protokolü & Kullanım Mimarisi"}),e.jsx("p",{className:"tanitim-guide-lead",children:"Özgür, sansürsüz, yüksek performanslı ve gizlilik odaklı yeni nesil topluluk ekosistemi. Arayüz haritasını ve platformun tüm gelişmiş yeteneklerini aşağıdaki yönergelerden inceleyin."})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// NAVİGASYON VE MENÜ YERLEŞİMİ"}),e.jsx("h2",{className:"sub-section-title",children:"Sayfa Yapısı & Arayüz Konumlandırması"})]}),e.jsxs("div",{className:"tanitim-nav-map-grid",children:[e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(Zs,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ SOL NAVİGASYON BARI ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Ana Gezinme Çubuğu"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Doğrudan Mesajlar (DM):"})," Birebir şifreli özel yazışmalar ve anlık bildirim kutusu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portallar Listesi:"})," Üye olduğunuz veya yönettiğiniz tüm portalların dikey simgeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Keşfet Pusulası:"})," Yeni toplulukları, popüler portalları ve kişileri arama alanı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Oluştur (+):"})," Saniyeler içinde kendi özgür topluluğunuzu kurma aracı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kimlik & Hızlı Ayar:"})," En altta mikrofon, kulaklık ve profil hızlı kontrolleri."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(Qs,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ PORTAL İÇİ MENÜ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Kanal Hiyerarşisi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Kimliği:"})," Özel afiş, doğrulanmış rozet ve çevrimiçi üye göstergeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Metin Kanalları (#):"})," Tematik konulara göre ayrılmış gönderi ve tartışma akışları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Ses Kanalları (🎙️):"})," Tek dokunuşla girilebilen, gecikmesiz canlı ses odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Sahne Kanalları (🎤):"})," Seminer, podcast ve etkinlikler için konuşmacı odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Yönetimi:"})," Yöneticiler için yeni kanallar açma ve gizlilik kilidi."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(Jt,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ ÜST DENETİM & AKIŞ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"İçerik & Üye Denetimi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Üst Başlığı:"})," Aktif kanal adı, açıklaması ve hızlı üye paneli butonu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Üye Listesi Paneli:"})," Sağ tarafta çevrimiçi yöneticiler ve aktif üyeler."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Görsel Akış Alanı:"})," 4K videolar, çoklu galeriler ve doküman önizlemeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Bildirim Zil İkonu:"})," Kanal ve portal bazlı bildirim filtreleme ayarları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Ayarları:"})," Portal sahibi ve yöneticileri için tam yönetim konsolu."]})]})]})]})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// GELİŞMİŞ SİSTEM DİREKLERİ"}),e.jsx("h2",{className:"sub-section-title",children:"Platform Mekanizmaları & Özellikler"})]}),e.jsxs("div",{className:"tanitim-pillars-grid",children:[e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"01"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Nt,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Gelişmiş Mesaj Mekanizması"}),e.jsx("p",{className:"pillar-text",children:"Markdown formatlama, tek tıkla alıntılı yanıtlama (quote reply), kullanıcıyı doğrudan haberdar eden @etiketleme sistemi ve akıllı bağlantı (link preview) ayrıştırma desteği."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Alıntılı Yanıt"}),e.jsx("span",{className:"pillar-tag",children:"@Bahsetmeler"}),e.jsx("span",{className:"pillar-tag",children:"Mesaj Sabitleme"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"02"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Xs,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Canlı Ses Odaları & Sahne Modu"}),e.jsx("p",{className:"pillar-text",children:"Ultra düşük gecikmeli WebRTC ses mimarisi. Herkesin serbestçe katılabildiği sohbet odaları ile seminer ve konferanslar için konuşmacı-dinleyici ayrımı ve el kaldırma desteği sunan Sahne kanalları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Gecikme"}),e.jsx("span",{className:"pillar-tag",children:"Sahne Hiyerarşisi"}),e.jsx("span",{className:"pillar-tag",children:"Arka Planda Ses"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"03"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(ea,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Mobil Ekosistem & PIP Video"}),e.jsx("p",{className:"pillar-text",children:"Yerel Android APK ve tam uyumlu PWA deneyimi. Canlı FCM Push bildirimleri, mobil veri tasarrufu modu ve gezinirken köşede kesintisiz oynayan Kayan Resim İçinde Resim (PIP) video motoru."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Android APK / PWA"}),e.jsx("span",{className:"pillar-tag",children:"Canlı PIP Oynatıcı"}),e.jsx("span",{className:"pillar-tag",children:"FCM Push Bildirim"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"04"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(ta,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Ultra-HD Medya & Transcoding"}),e.jsx("p",{className:"pillar-text",children:"İstemci içi WASM motoru ile 360p'den 4K'ya kadar otomatik optimize edilen video akışı. Tek gönderide 10 adede kadar yüksek kaliteli fotoğraf galerisi ve tek tıkla önizlenebilir PDF dokümanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"4K Video Transcoding"}),e.jsx("span",{className:"pillar-tag",children:"10'lu Görsel Galerisi"}),e.jsx("span",{className:"pillar-tag",children:"PDF Doküman Desteği"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"05"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Jt,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Özelleştirilebilir Sistemler & Temalar"}),e.jsx("p",{className:"pillar-text",children:"Saf OLED siyahı ve yüksek kontrastlı Aydınlık tema desteği. Kişisel profil afişi, biyografi ve avatar özelleştirmeleri. Portallar için özel roller, izin matrisleri ve gizlilik kalkanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"OLED Siyah & Açık Tema"}),e.jsx("span",{className:"pillar-tag",children:"Rol & Yetki Matrisi"}),e.jsx("span",{className:"pillar-tag",children:"Özel Profil Afişi"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"06"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(sa,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Kripto-Güvenlik & Sıfır Takip"}),e.jsx("p",{className:"pillar-text",children:"Sıfır veri madenciliği ve ticari profil koruması. IP ve aktif cihaz oturum denetimi, güvenlik anahtarları ile hesap kurtarma ve doğrulanmış resmi topluluk rozetleri."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Veri İzleme"}),e.jsx("span",{className:"pillar-tag",children:"Cihaz & Oturum Denetimi"}),e.jsx("span",{className:"pillar-tag",children:"Onay Rozetleri"})]})]})]})]})]}),p&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ MERKEZ TOPLULUK // 01 ]"}),e.jsx("span",{className:"section-badge",children:"EN POPÜLER PORTAL"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Oxypace Global"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"Platformun en geniş üye kitlesine sahip resmi ana iletişim merkezi."})]}),e.jsxs("div",{className:"oxypace-global-hero-card",onClick:()=>D(`/portal/${p._id}`),children:[e.jsxs("div",{className:"hero-card-banner",style:{background:z(p)},children:[e.jsx("div",{className:"hero-banner-overlay"}),e.jsx("div",{className:"hero-banner-badge",children:e.jsx("span",{children:"ANA TOPLULUK"})})]}),e.jsxs("div",{className:"hero-card-body",children:[e.jsxs("div",{className:"hero-header-row",children:[e.jsx("div",{className:"hero-avatar-box",children:p.avatar?e.jsx("img",{src:pe(p.avatar),alt:p.name,className:"hero-avatar-img"}):e.jsx("div",{className:"hero-avatar-fallback",children:((R=(I=p.name)==null?void 0:I.substring(0,2))==null?void 0:R.toUpperCase())||"OG"})}),e.jsxs("div",{className:"hero-identity-col",children:[e.jsxs("div",{className:"hero-name-row",children:[e.jsx("h3",{className:"hero-portal-name",children:p.name}),e.jsx(jt,{portal:p,size:18}),e.jsx("span",{className:"hero-privacy-tag",children:p.privacy==="private"?e.jsxs(e.Fragment,{children:[e.jsx(aa,{size:11})," GİZLİ"]}):e.jsxs(e.Fragment,{children:[e.jsx(na,{size:11})," HERKESE AÇIK"]})})]}),e.jsx("div",{className:"hero-meta-row",children:e.jsxs("div",{className:"hero-member-stat",children:[e.jsx(vt,{size:14}),e.jsxs("span",{children:[(p.memberCount||0).toLocaleString("tr-TR")," Üye"]})]})})]}),e.jsx("div",{className:"hero-action-col",children:e.jsx("button",{type:"button",className:`tanitim-sharp-btn hero-btn ${p.isMember?"btn-joined":p.isRequested?"btn-requested":"btn-action"}`,onClick:i=>T(i,p),disabled:S===p._id||p.isRequested,children:S===p._id?"İŞLENİYOR...":p.isMember?e.jsxs(e.Fragment,{children:[e.jsx(ia,{size:14}),"ÜYESİNİZ"]}):p.isRequested?e.jsxs(e.Fragment,{children:[e.jsx(ns,{size:14}),"İSTEK GÖNDERİLDİ"]}):p.privacy==="private"?"ÜYELİK İSTEĞİ GÖNDER":"PORTALA KATIL"})})]}),e.jsx("p",{className:"hero-description",children:p.description||"Oxypace platformunun ana buluşma noktası. Güncel duyurular, teknik tartışmalar ve küresel topluluk etkileşimi."})]})]})]}),x.length>0&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ AKTİF TOPLULUKLAR // 02 ]"}),e.jsx("span",{className:"section-badge",children:"ÖNE ÇIKAN PORTALLAR"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Popüler Topluluklar"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"En çok paylaşıma ve aktif etkileşime sahip seçkin portallar."})]}),e.jsx("div",{className:"tanitim-portals-row",children:x.map(i=>{var y,j;return e.jsxs("div",{className:"tanitim-classic-card",onClick:()=>D(`/portal/${i._id}`),children:[e.jsx("div",{className:"classic-card-banner",style:{background:z(i)},children:e.jsx("div",{className:"classic-banner-overlay"})}),e.jsx("div",{className:"classic-card-icon-wrapper",children:i.avatar?e.jsx("img",{src:pe(i.avatar),alt:i.name,className:"classic-card-icon-img",loading:"lazy"}):e.jsx("div",{className:"classic-card-icon-placeholder",children:((j=(y=i.name)==null?void 0:y.substring(0,2))==null?void 0:j.toUpperCase())||"P"})}),e.jsxs("div",{className:"classic-card-body",children:[e.jsxs("div",{className:"classic-card-title-row",children:[e.jsx("h4",{className:"classic-card-title",children:i.name}),e.jsx(jt,{portal:i,size:16})]}),e.jsx("p",{className:"classic-card-desc",children:i.description||"Bu topluluk hakkında henüz bir açıklama girilmemiş."}),e.jsxs("div",{className:"classic-card-footer",children:[e.jsxs("div",{className:"classic-member-count",children:[e.jsx(vt,{size:12}),e.jsxs("span",{children:[i.memberCount||0," Üye"]})]}),e.jsx("button",{type:"button",className:`tanitim-sharp-btn small-btn ${i.isMember?"btn-joined":i.isRequested?"btn-requested":"btn-action"}`,onClick:q=>T(q,i),disabled:S===i._id||i.isRequested,children:S===i._id?"...":i.isMember?"ÜYESİNİZ":i.isRequested?"İSTEK":i.privacy==="private"?"İSTEK AT":"KATIL"})]})]})]},i._id)})})]})]})},Ca=({alerts:a=[]})=>{const[g,D]=r.useState(()=>{try{const k=sessionStorage.getItem("dismissed_portal_alerts");return k?JSON.parse(k):[]}catch{return[]}}),[p,Y]=r.useState(null),x=a.filter(k=>!g.includes(k._id)),J=k=>{Y(k),setTimeout(()=>{const S=[...g,k];D(S);try{sessionStorage.setItem("dismissed_portal_alerts",JSON.stringify(S))}catch{}Y(null)},300)},V=k=>{const S=new Date,T=new Date(k)-S;if(T<=0)return null;const z=Math.floor(T/(1e3*60*60*24)),I=Math.floor(T/(1e3*60*60)%24),R=Math.floor(T/(1e3*60)%60);return z>0?`${z} gün ${I} saat kaldı`:I>0?`${I} saat ${R} dk kaldı`:`${R} dakika kaldı`};return x.length===0?null:e.jsx(e.Fragment,{children:x.map(k=>e.jsx("div",{className:`portal-alert-banner ${p===k._id?"dismissing":""}`,children:e.jsxs("div",{className:"alert-banner-inner",children:[e.jsx("div",{className:"alert-banner-icon",children:e.jsx(ra,{size:18,strokeWidth:2})}),e.jsxs("div",{className:"alert-banner-content",children:[e.jsx("div",{className:"alert-banner-label",children:e.jsx("span",{children:"Yönetici Uyarısı"})}),e.jsx("div",{className:"alert-banner-message",children:k.message}),e.jsx("div",{className:"alert-banner-meta",children:e.jsxs("span",{className:"alert-banner-time",children:[e.jsx(ns,{size:16,strokeWidth:2}),V(k.expiresAt)||"Süresi dolmak üzere"]})})]}),e.jsx("button",{className:"alert-banner-close",onClick:()=>J(k._id),title:"Uyarıyı gizle",children:e.jsx(lt,{size:16,strokeWidth:2.5})})]})},k._id))})},Pa=r.lazy(()=>it(()=>import("./PortalSettingsModal-LzYwsMEi.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13]))),Aa=r.lazy(()=>it(()=>import("./PortalNotifications-4N8A-vi8.js"),__vite__mapDeps([14,1,2,3,4,5,6,15]))),za=r.lazy(()=>it(()=>import("./VoiceChannel-DQosQ-sc.js"),__vite__mapDeps([16,1,4,2,3,5,6,17,18]))),Ia=r.lazy(()=>it(()=>import("./ConferenceChannel-DhNP7Vhh.js"),__vite__mapDeps([19,1,4,2,3,5,6,17,18]))),rn=()=>{var Ut,Ft,Kt,Ot,Vt,Gt;const{id:a}=As(),g=zs(),[D]=Is(),p=D.get("channel"),Y=D.get("post"),{user:x,token:J,updateUser:V,loading:k}=rt(),{socket:S,connected:K}=St(),T=kt(),z=ts(),{isSidebarOpen:I,closeSidebar:R,isMobileView:i,mobileChannelOpen:y,setMobileChannelOpen:j}=z||{},q=(z==null?void 0:z.isDesktopSidebarCollapsed)||!1,L=typeof window<"u"&&!!localStorage.getItem("admin_backup_token"),[s,E]=r.useState(()=>{var t;try{const n=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(n){const l=JSON.parse(n);if(Array.isArray(l==null?void 0:l.channels)&&l.channels.length>0)return l}}catch{}return(t=g==null?void 0:g.state)!=null&&t.portal&&(String(g.state.portal._id)===String(a)||String(g.state.portal.id)===String(a))&&Array.isArray(g.state.portal.channels)&&g.state.portal.channels.length>0?g.state.portal:null});r.useEffect(()=>{var t;(t=g==null?void 0:g.state)!=null&&t.portal&&(String(g.state.portal._id)===String(a)||String(g.state.portal.id)===String(a))&&E(n=>Array.isArray(g.state.portal.channels)&&g.state.portal.channels.length>0?g.state.portal:n&&Array.isArray(n.channels)&&n.channels.length>0?{...g.state.portal,channels:n.channels,roles:n.roles||g.state.portal.roles,members:n.members||g.state.portal.members}:n||null)},[a,g.state]);const $=Ye(t=>t.posts),N=Ye(t=>t.setPosts),[X,ae]=r.useState(()=>{var t;try{const n=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(n){const l=JSON.parse(n);if(Array.isArray(l==null?void 0:l.channels)&&l.channels.length>0)return!1}}catch{}return!((t=g==null?void 0:g.state)!=null&&t.portal&&(String(g.state.portal._id)===String(a)||String(g.state.portal.id)===String(a))&&Array.isArray(g.state.portal.channels)&&g.state.portal.channels.length>0)}),[fe,_e]=r.useState(!1),[ce,H]=r.useState(""),[ee,$e]=r.useState(null),[de,ze]=r.useState(null),[Ie,Te]=r.useState(!1),[_,Q]=r.useState(null),[Ee,ue]=r.useState({}),[Me,ge]=r.useState(!1),[me,Re]=r.useState(""),[le,xe]=r.useState([]);r.useRef(null);const[be,De]=r.useState(!1),[Se,c]=r.useState(!1),[P,ye]=r.useState({show:!1,message:"",type:"info"}),[Le,ve]=r.useState(!1),[ne,G]=r.useState(!1),[je,Ne]=r.useState({top:0,left:0}),qe=r.useRef(null),[he,Ce]=r.useState([]),[wt,_t]=r.useState(!1),[Ct,Pt]=r.useState(!1),[At,zt]=r.useState(!1),[te,Be]=r.useState(null),[is,ot]=r.useState(0),[It,ct]=r.useState(!1),Tt=r.useMemo(()=>ba(me),[me]);Ls();const ke=Yt(t=>t.activeUploads)[`portal-${a}`];r.useEffect(()=>{ke&&ke.status==="uploading"&&N(t=>t.map(n=>n.isOptimistic&&(n.mediaType==="video"||n.mediaType==="mixed")?{...n,uploadProgress:ke.progress}:n))},[ke==null?void 0:ke.progress,ke==null?void 0:ke.status]);const[rs,He]=r.useState(!1),Je=!!(s!=null&&s.name&&/Oxypace Tan[ıi]t[ıi]m/i.test(s.name)),ls=!!(x&&(((Ut=x.username)==null?void 0:Ut.toLowerCase())==="oxypace"||x.isAdmin)),os=Je?ls:x&&Ie,cs=r.useRef(null),Ue=r.useRef(null),ds=r.useCallback(t=>{t.preventDefault(),t.stopPropagation(),G(n=>{if(!n&&Ue.current){const l=Ue.current.getBoundingClientRect();Ne({top:l.bottom+8,left:l.left})}return!n})},[]);r.useEffect(()=>{if(!ne)return;let t=!0;const n=()=>{if(Ue.current){const v=Ue.current.getBoundingClientRect();Ne({top:v.bottom+8,left:v.left})}},l=v=>{if(!t)return;const o=v.target.closest(".plus-menu")||v.target.closest(".portal-plus-menu-portal"),h=v.target.closest(".upload-btn");!o&&!h&&G(!1)},m=setTimeout(()=>{t&&(document.addEventListener("click",l),document.addEventListener("touchstart",l))},0);return window.addEventListener("scroll",n,!0),window.addEventListener("resize",n),()=>{t=!1,clearTimeout(m),document.removeEventListener("click",l),document.removeEventListener("touchstart",l),window.removeEventListener("scroll",n,!0),window.removeEventListener("resize",n)}},[ne]),r.useEffect(()=>()=>{G(!1)},[]),r.useEffect(()=>{G(!1)},[_,a]),r.useEffect(()=>{var t;(t=g.state)!=null&&t.quotedPost&&(Be(g.state.quotedPost),g.state.selectedChannelId&&Q(g.state.selectedChannelId),R&&R(),j&&j(!0),T(g.pathname+g.search,{replace:!0,state:{}}))},[g.state,a]),r.useEffect(()=>{let t=!0;const n=async()=>{var h;const m=window.__oxypacePendingChannelShare;if(!m||!m.payload||m.portalId&&String(m.portalId)!==String(a))return;window.__oxypacePendingChannelShare=null;const v=m.payload;m.channelId&&Q(m.channelId),R&&R(),j&&j(!0);const o=(v.text||v.subject||"").trim();if(o&&t&&Re(u=>u?`${u}
${o}`:o),Array.isArray(v.files)&&v.files.length>0){const u=[];for(const f of v.files)try{let w=null;if(f.base64){const d=atob(f.base64),C=new Array(d.length);for(let A=0;A<d.length;A++)C[A]=d.charCodeAt(A);const B=new Uint8Array(C);w=new Blob([B],{type:f.mimeType||"application/octet-stream"})}else if(f.path&&window.Capacitor){const d=window.Capacitor.convertFileSrc(f.path);w=await(await fetch(d)).blob()}if(w){const d=new File([w],f.name||"shared_file",{type:f.mimeType||w.type||"application/octet-stream"});u.push(d)}}catch{}u.length>0&&t&&(Ce(f=>{const{nextDrafts:w,warnings:d}=Xt(f,u);return d.length>0&&se(d[0],"warning"),w}),G(!1))}else o&&t&&G(!1);(h=g.state)!=null&&h.sharedTrigger&&T(g.pathname+g.search,{replace:!0,state:{}})};n();const l=()=>{n()};return window.addEventListener("oxypace:apply_shared_to_channel",l),()=>{t=!1,window.removeEventListener("oxypace:apply_shared_to_channel",l)}},[a,(Ft=g.state)==null?void 0:Ft.sharedTrigger]);const U=(Kt=s==null?void 0:s.channels)==null?void 0:Kt.find(t=>String(t._id)===String(_)),Pe=(U==null?void 0:U.type)==="image",Et=(U==null?void 0:U.type)==="voice"||(U==null?void 0:U.type)==="conference",Mt=Et&&(!i||y);r.useEffect(()=>{s!=null&&s.channels&&Array.isArray(s.channels)&&ue(t=>{const n={...t};return s.channels.forEach(l=>{const m=String(l._id);l.postCount!==void 0&&(n[m]=l.postCount)}),n})},[s==null?void 0:s.channels]),r.useEffect(()=>{if(!S||!K||!a)return;S.emit("join_portal",a),S.emit("get_online_users"),_&&S.emit("join_channel",_);const t=o=>{var C,B,A,F,ie;const h=((C=o.portal)==null?void 0:C._id)||o.portal,u=((B=o.channel)==null?void 0:B._id)||o.channel,f=String(h)===String(a),w=((A=s==null?void 0:s.channels)==null?void 0:A.length)===1,d=String(u)===String(_)||String(u||"general")===String(_||"general")||w||U&&(String(u)===String(U.name)||String(u)===String(U._id));if(f&&d){const Z=((F=o.author)==null?void 0:F._id)||((ie=o.author)==null?void 0:ie.id)||o.author;if(String(Z)!==String(x==null?void 0:x._id)){const M=String(_);ue(W=>({...W,[M]:(W[M]!==void 0?W[M]:(U==null?void 0:U.postCount)||0)+1}))}N(M=>{if(M.some(re=>re._id===o._id))return M;const W=o.quotedPost&&(typeof o.quotedPost=="string"?o.quotedPost:o.quotedPost._id);if(W){const re=M.find(b=>b._id===W);re&&typeof re=="object"&&re.author?o.quotedPost=re:te&&W===te._id&&(o.quotedPost=te)}return[o,...M]})}},n=o=>{var f;const h=((f=o.portal)==null?void 0:f._id)||o.portal;(!h||String(h)===String(a))&&N(w=>w.map(d=>String(d._id)===String(o._id)?o:d))},l=({postId:o,portalId:h})=>{(!h||String(h)===String(a))&&o&&N(u=>u.filter(f=>String(f._id)!==String(o)))},m=({userId:o,status:h,lastActive:u})=>{h==="offline"&&xe(f=>f.filter(w=>String(w.userId)!==String(o))),E(f=>{if(!f)return f;const w=u||new Date;let d=f.owner;if(f.owner){const A=f.owner._id||f.owner.id||f.owner;String(A)===String(o)&&typeof f.owner=="object"&&(d={...f.owner,lastActive:w})}let C=f.admins;Array.isArray(f.admins)&&(C=f.admins.map(A=>{const F=A._id||A.id||A;return String(F)===String(o)&&typeof A=="object"&&A!==null?{...A,lastActive:w}:A}));let B=f.members;return Array.isArray(f.members)&&(B=f.members.map(A=>{const F=A._id||A.id||A;return String(F)===String(o)&&typeof A=="object"&&A!==null?{...A,lastActive:w}:A})),{...f,owner:d,admins:C,members:B}})},v=({userId:o,username:h,displayName:u,avatar:f,isTyping:w})=>{String(o)!==String(x==null?void 0:x._id)&&xe(d=>w?d.some(C=>String(C.userId)===String(o))?d:[...d,{userId:o,username:h,displayName:u,avatar:f}]:d.filter(C=>String(C.userId)!==String(o)))};return S.on("post:created",t),S.on("post:updated",n),S.on("post:deleted",l),S.on("user_status_change",m),S.on("portal_typing_update",v),()=>{S.off("post:created",t),S.off("post:updated",n),S.off("post:deleted",l),S.off("user_status_change",m),S.off("portal_typing_update",v)}},[S,K,a,_,x==null?void 0:x._id]);const[ms,Ze]=r.useState(!1),[hs,ps]=r.useState(0),dt=r.useRef(null),mt=r.useRef(null),Fe=r.useRef(null),us=r.useCallback(t=>{const n=t.target;mt.current||(mt.current=requestAnimationFrame(()=>{mt.current=null;const l=n.scrollTop,m=l>300;Ze(o=>o!==m?m:o);const v=n.scrollHeight-n.clientHeight;if(v>0){const o=Math.round(l/v*100);ps(h=>Math.abs(h-o)>=2?o:h)}}))},[]),ht=r.useCallback(t=>{t&&(t.preventDefault(),t.stopPropagation()),Fe.current&&cancelAnimationFrame(Fe.current);const n=dt.current||document.querySelector(".discord-feed")||document.querySelector(".portal-feed-container");if(!n){window.scrollTo({top:0,behavior:"smooth"});return}const l=n.scrollTop;if(l<=0)return;const m=800,v=performance.now(),o=u=>1-Math.pow(1-u,5),h=u=>{const f=u-v,w=Math.min(f/m,1),d=o(w);n.scrollTop=Math.round(l*(1-d)),w<1?Fe.current=requestAnimationFrame(h):(n.scrollTop=0,Fe.current=null)};Fe.current=requestAnimationFrame(h)},[]);r.useEffect(()=>{const t=()=>{ht(),(!s||!Array.isArray(s.channels)||s.channels.length===0)&&Ke()};return window.addEventListener("oxypace:scroll_portal_top",t),()=>window.removeEventListener("oxypace:scroll_portal_top",t)},[ht,s==null?void 0:s._id,(Ot=s==null?void 0:s.channels)==null?void 0:Ot.length]);const fs=t=>{Q(t),Ze(!1),i&&(R(),j(!0))},se=r.useCallback((t,n="info")=>{ye({show:!0,message:t,type:n}),setTimeout(()=>ye(l=>({...l,show:!1})),4e3)},[]),Qe=r.useCallback((t,n={})=>{!t||t.length===0||Ce(l=>{const{nextDrafts:m,warnings:v}=Xt(l,t,{extra:n,imagesOnly:Pe});return v.length>0&&se(v[0],"warning"),m})},[Pe,se]),gs=t=>{const n=Array.from(t.target.files||[]);t.target.value="",n.length!==0&&(Qe(n),G(!1))},xs=t=>{t&&Qe([t])},bs=(t,n={})=>{t&&Qe([t],n)},ys=t=>{!t||t.length===0||Qe(t)},vs=t=>{try{const n=ja(t);if(!n)return;Ce(l=>l.length>=15?(We(n),se("Bir gönderiye en fazla 15 dosya veya içerik eklenebilir.","warning"),l):[...l,n])}catch(n){se((n==null?void 0:n.message)||"Klasör eklenemedi.","error")}},js=t=>{Ce(n=>{const l=n.find(m=>m.id===t);return l&&We(l),n.filter(m=>m.id!==t)})},ks=()=>{Ce(t=>(t.forEach(We),[]))};r.useEffect(()=>{L||!S||!a||(me.trim().length>0||he.length>0?be||(De(!0),S.emit("portal_typing",{portalId:a,isTyping:!0})):be&&(S.emit("portal_typing",{portalId:a,isTyping:!1}),De(!1)))},[me,he,a,S,be,L]),r.useEffect(()=>()=>{!L&&S&&a&&be&&S.emit("portal_typing",{portalId:a,isTyping:!1})},[a,S,be,L]);const Rt=async()=>{var h,u,f,w;if(L){se("Hayalet Modu: Salt okunur izleme modundasınız. Gönderi paylaşılamaz.","error");return}const t=me.trim().length>0,n=he.length>0;if(!t&&!n)return;S&&a&&S.emit("portal_typing",{portalId:a,isTyping:!1}),De(!1);const l={content:me,drafts:[...he],detectedYouTube:Tt,quotedPost:te},m=`temp-${Date.now()}`,v=ya(l.drafts,l.detectedYouTube),o={_id:m,content:l.content,media:v.media,mediaType:v.mediaType||"none",attachments:v.attachments||[],author:x,createdAt:new Date().toISOString(),likes:[],likeCount:0,isOptimistic:!0,quotedPost:l.quotedPost,isProcessing:v.isVideoUpload,processingProgress:0,estimatedTime:v.isVideoUpload?"Hesaplanıyor...":""};if(N(d=>[o,...d]),_){const d=String(_);ue(C=>({...C,[d]:(C[d]!==void 0?C[d]:(U==null?void 0:U.postCount)||0)+1}))}Re(""),Ce([]),G(!1),ct(!0),ot(0);try{const d=await va({drafts:l.drafts,uploadFileFn:Ds,targetId:a,hasAutoYouTube:!!l.detectedYouTube,onProgress:F=>{ot(F),N(ie=>ie.map(Z=>String(Z._id)===String(m)?{...Z,uploadProgress:F}:Z))}});if(d.mode==="video"){Yt.getState().startVideoUpload({file:d.primaryVideoFile,portalId:a,channel:_,content:l.content,quotedPostId:(h=l.quotedPost)==null?void 0:h._id,extraAttachments:d.extraAttachments,onFinish:(F,ie)=>{if(l.drafts.forEach(We),F){if(N(Z=>Z.filter(M=>String(M._id)!==String(m))),_){const Z=String(_);ue(M=>({...M,[Z]:Math.max(0,(M[Z]||1)-1)}))}se("Video yükleme başarısız oldu.","error")}else if(ie){const Z=String(m);N(M=>{const W=String(ie._id);return M.some(b=>String(b._id)===W)?M.filter(b=>String(b._id)!==Z):M.map(b=>{if(String(b._id)===Z){const O=ie,we=O.quotedPost&&(typeof O.quotedPost=="string"?O.quotedPost:O.quotedPost._id);return we&&b.quotedPost&&we===b.quotedPost._id&&(O.quotedPost=b.quotedPost),O}return b})})}}}),ct(!1),Be(null);return}const C={content:l.content,portalId:a,channel:_,quotedPostId:(u=l.quotedPost)==null?void 0:u._id,...d.payloadFields},B=await oe.post("/api/posts",C);Be(null),l.drafts.forEach(We);const A=String(m);N(F=>{const ie=String(B.data._id);return F.some(M=>String(M._id)===ie)?F.filter(M=>String(M._id)!==A):F.map(M=>{if(String(M._id)===A){const W=B.data,re=W.quotedPost&&(typeof W.quotedPost=="string"?W.quotedPost:W.quotedPost._id);return re&&M.quotedPost&&re===M.quotedPost._id&&(W.quotedPost=M.quotedPost),W}return M})})}catch(d){const C=((w=(f=d.response)==null?void 0:f.data)==null?void 0:w.message)||d.message;if(se(C,"error"),N(B=>B.filter(A=>String(A._id)!==String(m))),_){const B=String(_);ue(A=>({...A,[B]:Math.max(0,(A[B]||1)-1)}))}Re(l.content),Ce(l.drafts),Be(l.quotedPost||null)}finally{ct(!1),ot(0)}},[pt,Ae]=r.useState(!1),[ut,Xe]=r.useState("overview"),[Ea,Ma]=r.useState(!1),[Ra,Ss]=r.useState({name:"",description:"",privacy:"public"});r.useRef(null),r.useRef(null);const et=r.useRef(!1);r.useEffect(()=>{a&&!k&&Ke()},[a,k]),r.useEffect(()=>{a&&!k&&!et.current&&(!s||!Array.isArray(s.channels)||s.channels.length===0||String(s._id)!==String(a))&&Ke()},[a,k,s==null?void 0:s._id,(Vt=s==null?void 0:s.channels)==null?void 0:Vt.length]),r.useEffect(()=>{D.get("openSettings")==="true"&&(Xe("overview"),Ae(!0))},[D]),r.useEffect(()=>{if(s&&s._id&&s.name)try{const t=localStorage.getItem("oxypace_portal_visits"),n=t?JSON.parse(t):{},l=String(s._id),m=n[l]||{count:0};n[l]={id:l,name:s.name,avatar:s.avatar,count:(m.count||0)+1,lastVisited:Date.now()},localStorage.setItem("oxypace_portal_visits",JSON.stringify(n));let v=0,o=null;Object.values(n).forEach(h=>{h.count>v&&(v=h.count,o=h)}),o&&localStorage.setItem("oxypace_top_portal",JSON.stringify({id:o.id,name:o.name}))}catch{}},[s==null?void 0:s._id,s==null?void 0:s.name]),r.useEffect(()=>{if(!k&&s&&String(s._id)===String(a)&&s.channels&&s.channels.length>0)if(_){if(p){const n=s.channels.find(l=>String(l._id)===String(p));if(n&&String(n._id)!==String(_)){Q(n._id);return}}if(!s.channels.some(n=>String(n._id)===String(_))){const n=s.channels[0];n&&Q(n._id)}}else{if(p){const n=s.channels.find(l=>String(l._id)===String(p));if(n){Q(n._id);return}}const t=s.channels[0];t&&Q(t._id)}},[s,k,p]),r.useEffect(()=>{const t=n=>{const{portalId:l,channelId:m}=n.detail||{};(!l||String(l)===String(a))&&m&&(Q(m),Ze(!1),j&&j(!0))};return window.addEventListener("oxypace:switch_channel",t),()=>window.removeEventListener("oxypace:switch_channel",t)},[a,j]),r.useLayoutEffect(()=>{const t=!!p||D.get("joinVoice")==="true";j&&t&&j(!0)},[a,p,D,j]),r.useEffect(()=>{a&&_&&s&&xt(s._id,a)&&Ve()},[a,_,s==null?void 0:s._id]),r.useEffect(()=>(a&&_&&(!i||y||!!p)?(yt(a,_),Es(a,_),Ye.getState().clearUnreadForChannel(_,a)):yt(null,null),()=>{yt(null,null)}),[a,_,i,y,p]),r.useEffect(()=>{if(Y&&!Me&&!fe&&Array.isArray($)&&$.length>0){const t=document.getElementById(`post-${Y}`);t&&setTimeout(()=>{t.scrollIntoView({behavior:"smooth",block:"center"}),t.classList.add("highlight-post"),setTimeout(()=>t.classList.remove("highlight-post"),2e3),ge(!0)},100)}},[Y,$,fe,Me]),r.useEffect(()=>{var t,n;if(s&&x){const l=((t=s.members)==null?void 0:t.includes(x._id))||((n=x.joinedPortals)==null?void 0:n.some(m=>m._id===s._id||m===s._id));Te(!!l)}},[s,x]);const Ke=async()=>{var l,m,v,o;if(et.current)return;et.current=!0,H("");let t=null;try{const h=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(h){const u=JSON.parse(h);u&&String(u._id)===String(a)&&Array.isArray(u.channels)&&u.channels.length>0&&(t=u)}}catch{}(!s||String(s._id)!==String(a)||!Array.isArray(s.channels)||s.channels.length===0)&&(t?(E(t),ae(!1)):ae(!0),Ze(!1));let n=null;for(let h=0;h<3;h++)try{const u=await oe.get(`/api/portals/${a}`);E(u.data);try{const d=JSON.stringify(u.data);sessionStorage.setItem(`oxypace_portal_cache_${a}`,d),localStorage.setItem(`oxypace_portal_cache_${a}`,d)}catch{}(l=u.data)!=null&&l.avatar&&Ht(u.data.avatar,"original");const f=((m=u.data)==null?void 0:m.coverImage)||((v=u.data)==null?void 0:v.banner);f&&Ht(f,"original");const w=[u.data.owner,...u.data.admins||[],...u.data.members||[]].filter(Boolean);Ms(w),Ss({name:u.data.name,description:u.data.description||"",privacy:u.data.privacy||"public"}),H(""),n=null;break}catch(u){n=u;const f=(o=u.response)==null?void 0:o.status;if(f===403||f===404)break;h<2&&await new Promise(w=>setTimeout(w,1200*(h+1)))}if(n)if(n.response&&n.response.status===403){const h=n.response.data||{};h.portalStatus==="suspended"||h.portalStatus==="closed"?($e({portalStatus:h.portalStatus,statusReason:h.statusReason,suspendedUntil:h.suspendedUntil,portalName:h.portalName,portalAvatar:h.portalAvatar}),H("suspended")):H("blocked")}else n.response&&n.response.status===404?H("blocked"):!t&&(!s||String(s._id)!==String(a))&&H("Portal yüklenemedi");et.current=!1,ae(!1)},tt=r.useRef(null),Dt=r.useRef($);Dt.current=$;const Oe=r.useRef(_);Oe.current=_;const Ve=r.useCallback(async(t=!1)=>{var m,v;const n=Oe.current,l=`portal_posts_${a}_${n}`;if(t)$t(!0);else{tt.current&&tt.current.abort(),tt.current=new AbortController;let o=!1;try{const h=localStorage.getItem(l)||sessionStorage.getItem(l);if(h){const u=JSON.parse(h);Array.isArray(u)&&u.length>0&&(N(u),_e(!1),o=!0)}}catch{}o||(_e(!0),N([])),ft(!0)}try{const o=localStorage.getItem("token"),h={signal:(m=tt.current)==null?void 0:m.signal,...o&&{headers:{Authorization:`Bearer ${o}`}}};if(t&&n!==Oe.current)return;let u=`/api/portals/${a}/posts?channel=${n}&limit=10`;const f=Dt.current;if(t&&f.length>0){const C=f[f.length-1];u+=`&before=${C.createdAt}`}const w=await oe.get(u,h),d=w.data;if(w.headers&&w.headers["x-total-count"]!==void 0){const C=parseInt(w.headers["x-total-count"],10);isNaN(C)||ue(B=>({...B,[String(n)]:C}))}if(d.length<10&&ft(!1),t)N(C=>{const B=new Set(C.map(F=>F._id)),A=d.filter(F=>!B.has(F._id));return[...C,...A]});else{N(d);try{localStorage.setItem(l,JSON.stringify(d.slice(0,20)))}catch{try{sessionStorage.setItem(l,JSON.stringify(d.slice(0,15)))}catch{}}}H("")}catch(o){if(oe.isCancel(o))return;((v=o.response)==null?void 0:v.status)===403?H("private"):H("Gönderiler yüklenemedi")}finally{t||_e(!1),$t(!1),ae(!1)}},[a]),[Lt,ft]=r.useState(!0),[gt,$t]=r.useState(!1),st=r.useRef(),Ns=r.useCallback(t=>{gt||(st.current&&st.current.disconnect(),st.current=new IntersectionObserver(n=>{n[0].isIntersecting&&Lt&&Ve(!0)},{root:dt.current,rootMargin:"200px"}),t&&st.current.observe(t))},[gt,Lt,Ve]);r.useEffect(()=>{N([]),ft(!0),Q(null),E(null),H(""),j(!1)},[a]);const ws=r.useCallback(t=>{N(l=>l.filter(m=>String(m._id)!==String(t)));const n=Oe.current;n&&ue(l=>({...l,[String(n)]:Math.max(0,(l[String(n)]||1)-1)}))},[N]),_s=r.useCallback((t,n)=>{if(n){N(m=>m.filter(v=>String(v._id)!==String(t)));const l=Oe.current;l&&ue(m=>({...m,[String(l)]:Math.max(0,(m[String(l)]||1)-1)}))}},[N]),Cs=r.useCallback(async t=>{try{const l=(await oe.put(`/api/posts/${t}/pin`)).data;N(m=>m.map(o=>o._id===t?l:o).sort((o,h)=>o.isPinned===h.isPinned?new Date(h.createdAt)-new Date(o.createdAt):o.isPinned?-1:1))}catch{se("Sabitleme işlemi başarısız","error")}},[N,se]),Ps=async()=>{var t,n;if(!x){se("Lütfen giriş yapın veya kaydolun!","warning");return}try{const l=localStorage.getItem("token"),m=l?{headers:{Authorization:`Bearer ${l}`}}:{};if((await oe.post(`/api/portals/${a}/join`,{},m)).data.status==="joined"){Te(!0);const o=Array.isArray(x==null?void 0:x.joinedPortals)?x.joinedPortals:[],h=Array.isArray(x==null?void 0:x.portals)?x.portals:[],u=[...o.filter(d=>{var C;return((C=(d==null?void 0:d._id)||d)==null?void 0:C.toString())!==a.toString()}),s],f=[...h.filter(d=>{var C;return((C=(d==null?void 0:d._id)||d)==null?void 0:C.toString())!==a.toString()}),s],w={...x,joinedPortals:u,portals:f};V(w),E(d=>({...d,members:[...d.members||[],x._id]})),Ve(),se("Portala başarıyla katıldınız!","success")}else se("Üyelik isteğiniz gönderildi!","info"),E(o=>({...o,isRequested:!0}))}catch(l){se(((n=(t=l.response)==null?void 0:t.data)==null?void 0:n.message)||"Katılma başarısız","error")}},xt=(t,n)=>{if(!t||!n)return!1;const l=typeof t=="object"?t.toString():t,m=typeof n=="object"?n.toString():n;return l===m},qt=x&&s&&s.owner&&xt(s.owner._id||s.owner,x._id),Bt=qt||x&&s&&s.admins&&s.admins.some(t=>xt(t._id||t,x._id));if(r.useEffect(()=>{if(!(ee!=null&&ee.suspendedUntil)){ze(null);return}const t=()=>{const l=new Date,v=new Date(ee.suspendedUntil)-l;if(v<=0){ze(null),window.location.reload();return}ze({days:Math.floor(v/(1e3*60*60*24)),hours:Math.floor(v/(1e3*60*60)%24),minutes:Math.floor(v/(1e3*60)%60),seconds:Math.floor(v/1e3%60)})};t();const n=setInterval(t,1e3);return()=>clearInterval(n)},[ee]),!J&&!k)return e.jsx(Ts,{to:"/",replace:!0});if(ce==="suspended"&&ee){const t=ee.portalStatus==="suspended",n=ee.suspendedUntil?new Date(ee.suspendedUntil).toLocaleString("tr-TR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):null;return e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(Ge,{}),e.jsx("div",{className:"suspension-screen",children:e.jsxs("div",{className:"suspension-card",children:[e.jsx("div",{className:"suspension-icon",children:t?"⏸️":"🔒"}),e.jsx("h1",{className:"suspension-title",children:ee.portalName||"Portal"}),e.jsx("h2",{className:"suspension-subtitle",children:t?"Bu portal geçici olarak askıya alındı":"Bu portal kapatılmıştır"}),ee.statusReason&&e.jsxs("div",{className:"suspension-reason",children:[e.jsx("div",{className:"suspension-reason-label",children:"Sebep"}),e.jsx("p",{children:ee.statusReason})]}),t&&n&&e.jsxs("div",{className:"suspension-unlock",children:[e.jsx("div",{className:"suspension-unlock-label",children:"🔓 Erişim Açılma Tarihi"}),e.jsx("div",{className:"suspension-unlock-date",children:n}),de&&e.jsxs("div",{className:"suspension-countdown",children:[e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(de.days).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Gün"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(de.hours).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saat"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(de.minutes).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Dakika"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(de.seconds).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saniye"})]})]})]}),e.jsxs("div",{className:"suspension-policy",children:[e.jsx("span",{children:"📋"}),e.jsxs("p",{children:["Askıya alma nedenleri, platformun ",e.jsx("strong",{children:"Politika ve Koşullar"}),"'ı kapsamında değerlendirilmektedir. Detaylı bilgi için kurallarımızı inceleyebilirsiniz."]})]}),e.jsx("button",{onClick:()=>T("/"),className:"suspension-home-btn",children:"Anasayfaya Dön"})]})})]})}return ce&&ce!=="suspended"?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(Ge,{}),e.jsxs("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center",flexDirection:"column",color:"var(--text-muted)"},children:[e.jsx("div",{style:{fontSize:"3rem",marginBottom:"1rem"},children:"🚫"}),e.jsx("h2",{children:ce==="blocked"?"Sonuç Bulunamadı":"Bir Hata Oluştu"}),e.jsx("p",{children:ce==="blocked"?"Aradığınız portala ulaşılamıyor.":ce||"Portal yüklenirken bir sorun oluştu."}),e.jsx("button",{onClick:()=>T("/"),className:"btn-save",style:{marginTop:"20px",float:"none"},children:"Anasayfaya Dön"})]})]}):X||k||!s||!Array.isArray(s.channels)||s.channels.length===0?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(Ge,{}),e.jsx("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center"},children:e.jsx("div",{className:"spinner"})})]}):s.isNSFW&&!Le&&!sessionStorage.getItem(`nsfw_confirmed_${a}`)?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(Ge,{}),e.jsx("div",{className:"nsfw-gate-overlay",children:e.jsxs("div",{className:"nsfw-gate-card",children:[e.jsx("div",{className:"nsfw-gate-icon",children:e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]})}),e.jsx("div",{className:"nsfw-gate-badge",children:"+18"}),e.jsx("h1",{className:"nsfw-gate-title",children:"Yaş Kısıtlaması"}),e.jsxs("p",{className:"nsfw-gate-desc",children:[e.jsx("strong",{children:s.name})," portalı yetişkin içerik barındırabilir. Bu portala erişmek için 18 yaşından büyük olmanız gerekmektedir."]}),e.jsxs("div",{className:"nsfw-gate-actions",children:[e.jsx("button",{className:"nsfw-gate-confirm",onClick:()=>{sessionStorage.setItem(`nsfw_confirmed_${a}`,"true"),ve(!0)},children:"18 yaşından büyüğüm, devam et"}),e.jsx("button",{className:"nsfw-gate-cancel",onClick:()=>T(-1),children:"Geri Dön"})]}),e.jsx("p",{className:"nsfw-gate-legal",children:"Devam ederek, yaşınızın 18'den büyük olduğunu ve yetişkin içerikle ilgili yasal sorumluluğu kabul ettiğinizi onaylarsınız."})]})})]}):e.jsxs("div",{className:`app-wrapper full-height discord-layout ${Mt?"voice-channel-active":""}`,children:[e.jsx(pa,{title:s.name,description:s.description||`${s.name} topluluğuna katılın.`,image:pe(s.avatar),type:"website",schema:{"@context":"https://schema.org","@type":"Community",name:s.name,description:s.description,url:window.location.href,memberCount:((Gt=s.members)==null?void 0:Gt.length)||0}}),!pt&&e.jsx(Ge,{}),P.show&&e.jsxs("div",{className:`app-toast ${P.type}`,children:[e.jsx("span",{className:"app-toast-icon",children:P.type==="error"?"🚫":P.type==="success"?"✅":P.type==="warning"?"⚠️":"ℹ️"}),P.message]}),e.jsxs("div",{className:`discord-split-view ${i&&y?"mobile-feed-active":""} ${Mt?"voice-room-active":""} ${q?"sidebar-collapsed":""}`,children:[x&&e.jsx(Na,{portal:s,isMember:Ie,canManage:qt||Bt,onEdit:t=>{Xe(typeof t=="string"?t:"overview"),Ae(!0)},currentChannel:_,onChangeChannel:fs,className:`${I?"mobile-open":""} ${i&&y?"mobile-hidden":""}`,onShowPortalInfo:()=>He(!0)}),e.jsxs("main",{className:`discord-main-content ${i&&!y?"mobile-content-hidden":""} ${Et?"voice-channel-active":""}`,children:[i&&!y&&e.jsx(ha,{title:(s==null?void 0:s.name)||"Portal",showBack:!1}),(()=>{var v,o,h,u,f,w,d,C,B,A,F,ie,Z,M,W,re;const t=U,n=(t==null?void 0:t.type)||"text",l=(t==null?void 0:t.name)||"...",m=n==="voice"||n==="conference";return e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{display:"flex",flex:1,overflow:"hidden"},children:m?e.jsx("div",{style:{flex:1,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"},children:e.jsx(r.Suspense,{fallback:e.jsx("div",{className:"skeleton-loader",children:e.jsx("p",{children:"Canlı bağlantı odası hazırlanıyor..."})}),children:n==="conference"?e.jsx(Ia,{portalId:a,channelId:_,channelName:l,onBack:()=>j(!1)}):e.jsx(za,{portalId:a,channelId:_,channelName:l,onBack:()=>j(!1)})})}):e.jsx("div",{className:"channel-messages-area",style:{flex:1,display:"flex",flexDirection:"column"},children:fe?e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"},children:[e.jsx("div",{className:"spinner"}),e.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.9rem"},children:"İçerik yükleniyor..."})]}):e.jsxs(e.Fragment,{children:[!m&&e.jsxs("header",{className:`channel-top-bar ${i?"":"desktop-only"}`,children:[e.jsxs("div",{className:"channel-title-wrapper",children:[i&&e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>j(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",children:n==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",children:l}),(()=>{const b=String((t==null?void 0:t._id)||_||""),O=Ee[b]!==void 0?Ee[b]:(t==null?void 0:t.postCount)??0;return e.jsxs("div",{className:"channel-post-count-badge",title:`${O} Gönderi`,children:[e.jsx(Nt,{size:13}),e.jsx("span",{children:O})]})})()]}),e.jsx("div",{className:"channel-header-actions",children:Ie&&e.jsx("button",{className:`icon-btn ${Se?"active":""}`,onClick:()=>c(!Se),title:Se?"Üyeleri Gizle":"Üyeleri Göster",style:{background:"none",border:"none",color:Se?"var(--primary-color)":"var(--text-muted)"},children:e.jsx(vt,{size:20})})})]}),ce==="private"?e.jsx(Qt,{portal:s,onClose:()=>{window.history.length>2?T(-1):T("/search")},isMobile:i,onOpenSettings:()=>{Xe("overview"),Ae(!0)},onJoinStatusChange:b=>{b==="requested"?E(O=>O&&{...O,isRequested:!0}):b==="joined"&&(Te(!0),H(""),Ke(),Ve())}}):e.jsxs(e.Fragment,{children:[(s==null?void 0:s.alerts)&&s.alerts.length>0&&e.jsx(Ca,{alerts:s.alerts}),e.jsx("div",{className:`portal-feed-container discord-feed ${Je?"tanitim-feed-mode":""}`,onScroll:us,ref:dt,children:Je?e.jsx(_a,{}):e.jsxs(e.Fragment,{children:[$.length===0&&!X&&e.jsxs("div",{className:"empty-portal",children:[e.jsx("div",{className:"empty-portal-icon",children:"👋"}),e.jsxs("h3",{children:[((o=(v=s==null?void 0:s.channels)==null?void 0:v.find(b=>b._id===_))==null?void 0:o.type)==="voice"?"🎙️":((u=(h=s==null?void 0:s.channels)==null?void 0:h.find(b=>b._id===_))==null?void 0:u.type)==="conference"?"🎤":((w=(f=s==null?void 0:s.channels)==null?void 0:f.find(b=>b._id===_))==null?void 0:w.type)==="image"?"🖼️":"#",((C=(d=s==null?void 0:s.channels)==null?void 0:d.find(b=>String(b._id)===String(_)))==null?void 0:C.name)||"..."," ","kanalına hoş geldin!"]}),e.jsx("p",{children:"Bu kanalda henüz mesaj yok. İlk mesajı sen at!"})]}),Array.isArray($)&&$.map((b,O)=>{var at;b.isBot===!0||((at=b.author)==null||at.isBot);const we=Rs.enableAds;return e.jsxs(r.Fragment,{children:[e.jsx($s,{post:b,onDelete:ws,onPin:Cs,onArchive:_s,isAdmin:Bt},b._id),O<$.length-1&&e.jsx("div",{className:"post-separator"}),we]},b._id)}),e.jsx("div",{ref:Ns,style:{height:"40px",margin:"10px 0",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"},children:gt&&e.jsx("div",{className:"spinner-small"})})]})}),(()=>{const O=2*Math.PI*20,we=O-hs/100*O;return e.jsxs("button",{className:`floating-scroll-top portal-scroll-top ${ms?"visible":""}`,onClick:ht,"aria-label":"Yukarı Çık",children:[e.jsxs("svg",{className:"progress-ring",width:"50",height:"50",viewBox:"0 0 50 50",children:[e.jsx("circle",{className:"progress-ring-track",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25"}),e.jsx("circle",{className:"progress-ring-fill",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25",style:{strokeDasharray:O,strokeDashoffset:we}})]}),e.jsx("div",{className:"scroll-icon",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"m18 15-6-6-6 6"})})})]})})(),Je?null:os?e.jsxs("div",{className:"channel-input-area",children:[ne&&nt.createPortal(e.jsxs("div",{className:"plus-menu portal-plus-menu-portal",ref:cs,style:{position:"fixed",top:je.top,left:je.left,zIndex:99999},children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{var b;(b=qe.current)==null||b.click(),G(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsx(as,{size:18,strokeWidth:1.9})}),"Galeri"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{_t(!0),G(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsx(la,{size:18,strokeWidth:1.9})}),"Kamera"]}),!Pe&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Pt(!0),G(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsx(ss,{size:18,strokeWidth:1.9})}),"Ses"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{zt(!0),G(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsx(oa,{size:18,strokeWidth:1.9})}),"Dosya"]})]})]}),document.body),e.jsx("input",{type:"file",ref:qe,onChange:gs,style:{display:"none"},accept:Pe?"image/*,.gif":"image/*,video/*,.gif",multiple:!0}),te&&e.jsxs("div",{className:"input-quoted-preview",children:[e.jsxs("div",{className:"input-quoted-preview-header",children:[(A=(B=te.author)==null?void 0:B.profile)!=null&&A.avatar?e.jsx("img",{src:pe(te.author.profile.avatar),alt:"",className:"quoted-preview-avatar",loading:"lazy",decoding:"async",width:"32",height:"32"}):e.jsx("div",{className:"quoted-preview-avatar-placeholder",children:(ie=(F=te.author)==null?void 0:F.username)==null?void 0:ie.charAt(0).toUpperCase()}),e.jsxs("div",{className:"quoted-preview-meta",children:[e.jsx("span",{className:"quoted-preview-author",children:((M=(Z=te.author)==null?void 0:Z.profile)==null?void 0:M.displayName)||((W=te.author)==null?void 0:W.username)}),e.jsxs("span",{className:"quoted-preview-username",children:["@",(re=te.author)==null?void 0:re.username]})]}),e.jsx("button",{className:"remove-quote-btn",onClick:()=>Be(null),children:e.jsx(lt,{size:16})})]}),e.jsxs("div",{className:"input-quoted-preview-body",children:[e.jsx("p",{className:"input-quoted-preview-text",children:te.content}),te.media&&e.jsx("div",{className:"input-quoted-preview-media",children:te.mediaType==="video"?e.jsxs("div",{className:"media-placeholder",children:[e.jsx(ca,{size:20}),e.jsx("span",{children:"Video Alıntısı"})]}):e.jsx("img",{src:pe(te.media),alt:"",loading:"lazy",decoding:"async",width:"120",height:"80"})})]})]}),Pe&&me.trim()&&he.length===0&&e.jsxs("div",{className:"image-channel-warning",style:{backgroundColor:"rgba(239, 68, 68, 0.1)",border:"1px solid rgba(239, 68, 68, 0.25)",color:"#f87171",padding:"8px 12px",borderRadius:"8px",fontSize:"13px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{flexShrink:0},children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]}),e.jsx("span",{children:"Görsel kanallarında paylaşım yapabilmek için mutlaka bir görsel eklemelisiniz."})]}),!L&&e.jsx(ua,{attachments:he,detectedYouTube:Tt,onRemoveAttachment:js,onClearAll:ks}),L?e.jsxs("div",{className:"ghost-channel-notice",style:{backgroundColor:"#0c0c0c",borderTop:"1px solid #222",color:"#888",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",fontSize:"13px"},children:[e.jsxs("svg",{viewBox:"0 0 24 24",width:"18",height:"18",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{opacity:.7},children:[e.jsx("path",{d:"M12 2a5 5 0 0 0-5 5v14l3-2 2 2 2-2 3 2V7a5 5 0 0 0-5-5z"}),e.jsx("circle",{cx:"10",cy:"8",r:"1",fill:"currentColor"}),e.jsx("circle",{cx:"14",cy:"8",r:"1",fill:"currentColor"})]}),e.jsx("span",{children:"Hayalet Modu: Salt okunur izleme modundasınız. Kanalda mesaj ve gönderi paylaşılamaz."})]}):e.jsxs("div",{className:"message-input-wrapper",children:[e.jsx("button",{ref:Ue,className:`input-action-btn upload-btn ${ne?"active":""}`,onClick:ds,style:{backgroundColor:"#383a40",borderRadius:"50%",width:"32px",height:"32px",marginRight:"12px",color:ne?"#ffffff":"#b9bbbe"},children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z"})})}),e.jsx("input",{type:"text",placeholder:Pe?"Gönderi paylaşmak için bir görsel ekleyin...":`#${(U==null?void 0:U.name)||"..."} kanalına mesaj gönder`,value:me,onChange:b=>{Re(b.target.value)},onKeyDown:b=>{b.key==="Enter"&&!b.shiftKey&&(b.preventDefault(),Rt())}}),e.jsx("div",{className:"input-right-actions",children:e.jsx("button",{className:"input-action-btn send-btn",onClick:Rt,disabled:It||(Pe||!me.trim())&&he.length===0,title:"Gönder",style:{color:me.trim()||he.length>0?"var(--primary-color)":"var(--text-tertiary)"},children:It?e.jsxs("div",{className:"compose-spinner-wrapper",style:{width:"20px",height:"20px"},children:[e.jsx("div",{className:"compose-spinner",style:{width:"20px",height:"20px",borderTopColor:"var(--primary-color)"}}),e.jsxs("span",{className:"compose-progress-text",style:{fontSize:"7px",color:"var(--text-primary)"},children:[is,"%"]})]}):e.jsx(da,{size:20})})})]}),le&&le.length>0&&e.jsxs("div",{className:"portal-typing-indicator",style:{marginTop:"8px"},children:[e.jsx("div",{className:"typing-avatars-group",children:le.map(b=>e.jsx("img",{src:pe(b.avatar),alt:b.displayName,className:"typing-avatar",title:b.displayName},b.userId))}),e.jsx("span",{className:"typing-text",children:le.length===1?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:le[0].displayName})," yazıyor..."]}):le.length===2?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:le[0].displayName})," ve ",e.jsx("strong",{children:le[1].displayName})," yazıyor..."]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:le[0].displayName})," ve ",le.length-1," kişi daha yazıyor..."]})})]})]}):e.jsx("div",{className:"channel-input-area",style:{padding:"0 20px 24px 20px",backgroundColor:"transparent",borderTop:"none"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--glass-bg)",padding:"12px 20px",borderRadius:"8px",border:"1px solid var(--glass-border)",backdropFilter:"blur(20px) saturate(160%)",WebkitBackdropFilter:"blur(20px) saturate(160%)",boxShadow:"var(--glass-shadow)"},children:[e.jsxs("span",{style:{color:"var(--text-secondary)",fontWeight:500,fontSize:"14px"},children:["Bu kanalda mesaj göndermek için ",x?"portala katılmalısın.":"giriş yapmalısın."]}),x?e.jsx("button",{className:"privacy-join-btn",onClick:Ps,disabled:s.isRequested,style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:s.isRequested?"İstek Gönderildi":"Portala Katıl"}):e.jsx("button",{className:"privacy-join-btn",onClick:()=>T("/login"),style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:"Giriş Yap"})]})})]})]})})}),Se&&e.jsx(wa,{members:[...s.owner?[{...s.owner,role:"owner"}]:[],...(s.admins||[]).map(b=>({...b,role:"admin"})),...s.members||[]].filter((b,O,we)=>{const at=String(b._id||b.id||b);return b&&we.findIndex(bt=>String(bt._id||bt.id||bt)===at)===O}),onClose:()=>c(!1)})]})})()]})]}),pt&&ut!=="notifications"&&e.jsx(r.Suspense,{fallback:null,children:e.jsx(Pa,{portal:s,currentUser:x,initialTab:ut,onClose:()=>Ae(!1),onUpdate:t=>{E(t)}})}),pt&&ut==="notifications"&&e.jsx("div",{className:"portal-notifications-modal",onClick:()=>Ae(!1),children:e.jsxs("div",{className:"notifications-modal-content",onClick:t=>t.stopPropagation(),children:[e.jsx("button",{className:"close-notifications-btn",onClick:()=>Ae(!1),children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsx(r.Suspense,{fallback:null,children:e.jsx(Aa,{portalId:s._id,portalChannels:s.channels||[],onUpdate:Ke})})]})}),rs&&s&&e.jsx(Qt,{portal:s,onClose:()=>He(!1),isMobile:i,onOpenSettings:()=>{He(!1),Xe("overview"),Ae(!0)},onLeave:()=>{He(!1),Te(!1),T("/")}}),wt&&nt.createPortal(e.jsx(fa,{isOpen:wt,onClose:()=>_t(!1),onCapture:xs}),document.body),Ct&&nt.createPortal(e.jsx(ga,{isOpen:Ct,onClose:()=>Pt(!1),onAttach:bs}),document.body),At&&nt.createPortal(e.jsx(xa,{isOpen:At,onClose:()=>zt(!1),onFilesSelected:ys,onFolderPackaged:vs}),document.body)]})};export{rn as default};
