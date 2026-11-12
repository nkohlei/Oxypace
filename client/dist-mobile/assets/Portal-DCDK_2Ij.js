const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PortalSettingsModal-Ck1SCGQ3.js","assets/vendor-Dpge4IBk.js","assets/index-B3QUDy4_.js","assets/socket-ZbpkDx_N.js","assets/livekit-BEAUSX0o.js","assets/lucide-CpsT9WSr.js","assets/index-fAvAQeF_.css","assets/ImageCropper-CXvMc6z8.js","assets/ImageCropper-Dk7oVLRB.css","assets/PortalBadges-BLznxIcc.js","assets/UserBadges-DhPLLMVM.js","assets/UserBadges-DFKBzEd_.css","assets/PortalBadges-bryM1aQu.css","assets/PortalSettingsModal-CHDypHKx.css","assets/PortalNotifications-_oUJKppf.js","assets/PortalNotifications-zEgqx9Vo.css","assets/VoiceChannel-BA-euoOs.js","assets/VoiceChannel-BUTP7P-Q.js","assets/VoiceChannel-HgwCndU_.css","assets/ConferenceChannel-Cn9HdTJc.js"])))=>i.map(i=>d[i]);
import{r as i,a2 as ce,a4 as e,a9 as We,a5 as wt,ar as Zt,at as Ts,a7 as Rs,as as Ms,a8 as Ls,a3 as rt}from"./vendor-Dpge4IBk.js";import{d as fe,l as _t,u as lt,m as ns,i as Ve,c as Ct,b as Qt,n as jt,o as Ds,p as Xt,h as $s,q as qs,a as Bs}from"./index-B3QUDy4_.js";import{u as Fs}from"./useVideoTranscoder-D2noaM_b.js";import{P as Us}from"./PostCard-CRo8fOlz.js";import{g as Ks,c as Os}from"./PostAttachments-B4rQUCcV.js";import{a9 as is,X as Ge,aN as Ws,j as kt,c as Vs,q as Gs,ak as Ys,a4 as Hs,aa as Js,M as Pt,af as Zs,t as rs,e as Qs,ad as Xs,I as ls,r as ea,aO as ta,aP as sa,L as aa,m as es,aH as na,ag as ia,F as ra,G as la,N as oa,J as ca,K as St,aQ as os,aA as da,s as ma,u as ha,aR as ua,aS as pa}from"./lucide-CpsT9WSr.js";import{U as ts}from"./UserBadges-DhPLLMVM.js";import{P as Nt}from"./PortalBadges-BLznxIcc.js";import{U as fa}from"./UserBar-Cs5fKYCE.js";import{P as ss}from"./PortalInfoModal-ZaRfbEfL.js";import{N as Ke}from"./Navbar-3rhhF6JV.js";import{S as ga}from"./SubHeader-Bxq8SakB.js";import{S as xa}from"./SEO-giVNFBzi.js";import{C as ba,a as ya,A as va,F as ja}from"./ComposerAttachmentTray-gf3BuZRA.js";import{e as ka,a as as,r as Oe,b as Sa,p as Na,c as wa}from"./mediaAttachments-CR5LPrLZ.js";import"./socket-ZbpkDx_N.js";import"./livekit-BEAUSX0o.js";import"./UserAvatar-Btz4FgaF.js";import"./LinkPreview-nq8z1SaL.js";/* empty css                      */import"./Login-BLpUltAM.js";/* empty css             *//* empty css                  */const _a=({portalId:a,onClose:p})=>{const[M,h]=i.useState(""),[H,b]=i.useState([]),[J,V]=i.useState(!1),[S,N]=i.useState(new Set),[F,E]=i.useState(!1),[K,q]=i.useState(null),L=i.useRef(null),r=Ks(a),x=(j,w="success")=>{q({text:j,type:w}),L.current&&clearTimeout(L.current),L.current=setTimeout(()=>{q(null)},2600)};i.useEffect(()=>{const j=w=>{w.key==="Escape"&&(p==null||p())};return window.addEventListener("keydown",j),()=>{window.removeEventListener("keydown",j),L.current&&clearTimeout(L.current)}},[p]),i.useEffect(()=>{const j=M.trim();if(!j){b([]),V(!1);return}V(!0);const w=setTimeout(async()=>{try{const s=await ce.get(`/api/users/search?q=${encodeURIComponent(j)}`);b(Array.isArray(s.data)?s.data:[])}catch{b([])}finally{V(!1)}},320);return()=>clearTimeout(w)},[M]);const v=async j=>{var w,s;try{await Promise.all([ce.post(`/api/portals/${a}/invite`,{userId:j}),ce.post("/api/messages",{recipientId:j,portalId:a,content:"Seni bir portala davet ettim!"})]),N(A=>new Set(A).add(j)),x("Portal daveti gönderildi.")}catch(A){x(((s=(w=A.response)==null?void 0:w.data)==null?void 0:s.message)||"Davet gönderilemedi.","error")}},D=async()=>{await Os(r)?(E(!0),x("Davet bağlantısı panoya kopyalandı."),setTimeout(()=>E(!1),2200)):x("Bağlantı kopyalanamadı.","error")},$=e.jsx("div",{className:"invite-modal-overlay",onClick:p,role:"presentation",children:e.jsxs("div",{className:"invite-modal",onClick:j=>j.stopPropagation(),role:"dialog","aria-modal":"true","aria-label":"Kullanıcı Davet Et",children:[e.jsxs("header",{className:"invite-header",children:[e.jsxs("div",{className:"invite-header-title",children:[e.jsx(is,{size:17,strokeWidth:2}),e.jsx("h2",{children:"Kullanıcı Davet Et"})]}),e.jsx("button",{type:"button",className:"invite-close-btn",onClick:p,"aria-label":"Kapat",children:e.jsx(Ge,{size:18,strokeWidth:2})})]}),K&&e.jsx("div",{className:`invite-feedback-banner ${K.type==="error"?"is-error":""}`,role:"status",children:e.jsx("span",{children:K.text})}),e.jsxs("div",{className:"invite-link-card",children:[e.jsxs("div",{className:"invite-link-meta",children:[e.jsxs("span",{className:"invite-link-title",children:[e.jsx(Ws,{size:13,strokeWidth:2}),e.jsx("span",{children:"Portal Davet Bağlantısı"})]}),e.jsx("span",{className:"invite-link-url",title:r,children:r.replace(/^https?:\/\//i,"")})]}),e.jsxs("button",{type:"button",className:`invite-copy-link-btn ${F?"is-done":""}`,onClick:D,children:[F?e.jsx(kt,{size:14,strokeWidth:2.4}):e.jsx(Vs,{size:14,strokeWidth:2}),e.jsx("span",{children:F?"Kopyalandı":"Kopyala"})]})]}),e.jsxs("div",{className:"invite-search-container",children:[e.jsx(Gs,{size:15,strokeWidth:2,className:"invite-search-icon"}),e.jsx("input",{type:"text",placeholder:"Kullanıcı adı ara...",value:M,onChange:j=>h(j.target.value)}),M&&e.jsx("button",{type:"button",className:"invite-search-clear",onClick:()=>h(""),"aria-label":"Temizle",children:e.jsx(Ge,{size:13,strokeWidth:2.2})})]}),e.jsxs("div",{className:"invite-results custom-scrollbar",children:[J&&e.jsx("div",{className:"invite-state-text",children:"Aranıyor..."}),!J&&H.length===0&&M.trim().length>0&&e.jsx("div",{className:"invite-state-text",children:"Kullanıcı bulunamadı."}),!J&&M.trim().length===0&&e.jsx("div",{className:"invite-state-text",children:"Davet etmek istediğin kişinin kullanıcı adını yaz."}),H.map(j=>{var B,T,de;const w=j._id||j,s=S.has(w),A=((B=j.profile)==null?void 0:B.fullName)||((T=j.profile)==null?void 0:T.displayName);return e.jsxs("div",{className:"invite-user-row",children:[e.jsxs("div",{className:"invite-user-info",children:[e.jsx("img",{src:fe((de=j.profile)==null?void 0:de.avatar),alt:j.username||"Kullanıcı",className:"invite-avatar"}),e.jsxs("div",{className:"invite-user-meta",children:[e.jsx("span",{className:"invite-user-name",children:A||j.username}),A&&e.jsxs("span",{className:"invite-user-handle",children:["@",j.username]})]})]}),e.jsx("button",{type:"button",className:`invite-action-btn ${s?"invited":""}`,onClick:()=>!s&&v(w),disabled:s,children:s?e.jsxs(e.Fragment,{children:[e.jsx(kt,{size:14,strokeWidth:2.4}),e.jsx("span",{children:"Gönderildi"})]}):e.jsx("span",{children:"Davet Et"})})]},w)})]})]})});return typeof document>"u"?null:We.createPortal($,document.body)},Ca=({startedAt:a,style:p={},className:M=""})=>{const{roomStartTime:h}=_t()||{},[H,b]=i.useState("00:00");i.useEffect(()=>{const V=h&&a===h?h:a;if(!V){b("00:00");return}const S=()=>{const F=Math.floor((Date.now()-V)/1e3);if(F<0){b("00:00");return}const E=Math.floor(F/3600),K=Math.floor(F%3600/60),q=F%60;b(E>0?`${E.toString().padStart(2,"0")}:${K.toString().padStart(2,"0")}:${q.toString().padStart(2,"0")}`:`${K.toString().padStart(2,"0")}:${q.toString().padStart(2,"0")}`)};S();const N=setInterval(S,1e3);return()=>clearInterval(N)},[a,h]);const J={display:"flex",alignItems:"center",fontSize:"15px",fontWeight:"800",color:"#39FF14",background:"transparent",border:"none",padding:"0 4px"};return e.jsx("div",{style:{...J,...p},className:M,children:H})},Pa=({portal:a,isMember:p,onEdit:M,currentChannel:h,onChangeChannel:H,className:b,canManage:J,onShowPortalInfo:V})=>{var Me,_e;const{user:S}=lt(),[N,F]=i.useState(!1);wt();const E=ns(),{isMobileView:K}=E||{},q=(E==null?void 0:E.isDesktopSidebarCollapsed)||!1,L=(E==null?void 0:E.setIsDesktopSidebarCollapsed)||(()=>{}),r=Ve(c=>c.unreadPostsByChannel),x=Ve(c=>c.clearUnreadForChannel),{roomStartTime:v,activeRoom:D,participants:$}=_t(),{socket:j,onlineUsers:w}=Ct(),[s,A]=i.useState({}),[B,T]=i.useState(null),de=i.useRef(null),Ne=(c,I)=>{I.stopPropagation(),de.current&&clearTimeout(de.current),T(c),de.current=setTimeout(()=>{T(null)},1800)};i.useEffect(()=>()=>{de.current&&clearTimeout(de.current)},[]);const Pe=c=>{if(!c)return null;if(typeof c=="string")return c;const I=c._id||c.id;return I?String(I):null},ge=new Set,xe=Pe(a==null?void 0:a.owner);xe&&ge.add(xe),((a==null?void 0:a.admins)||[]).forEach(c=>{const I=Pe(c);I&&ge.add(I)}),((a==null?void 0:a.members)||[]).forEach(c=>{const I=Pe(c);I&&ge.add(I)});const te=new Set((w||[]).map(c=>String(c))),Z=S!=null&&S._id?String(S._id):null,Ye=((_e=(Me=S==null?void 0:S.settings)==null?void 0:Me.privacy)==null?void 0:_e.showOnlineStatus)!==!1;Z&&ge.has(Z)&&Ye?te.add(Z):Z&&!Ye&&te.delete(Z);let we=0;ge.forEach(c=>{te.has(c)&&we++});const Re=ge.size||(a==null?void 0:a.membersCount)||((a==null?void 0:a.members)||[]).length||0;i.useEffect(()=>{h&&(a!=null&&a._id)&&x(h,a._id)},[h,a==null?void 0:a._id,x]),i.useEffect(()=>{var be;if(!(a!=null&&a._id)||!((be=a==null?void 0:a.channels)!=null&&be.length))return;const c=a.channels.filter(ve=>ve.type==="voice"||ve.type==="conference");if(c.length===0)return;let I=!0;const ye=async()=>{try{const ve=await Promise.all(c.map(async je=>{var Q,Le;const oe=je._id||je.id;try{const He=await ce.get(`/api/voice/rooms/${a._id}/${oe}/participants?t=${Date.now()}`);return{channelId:String(oe),count:((Le=(Q=He.data)==null?void 0:Q.participants)==null?void 0:Le.length)||0}}catch{return{channelId:String(oe),count:0}}}));I&&A(je=>{const oe={...je};return ve.forEach(Q=>{oe[Q.channelId]=Q.count}),oe})}catch{}};ye();const pe=setInterval(ye,1e4);return()=>{I=!1,clearInterval(pe)}},[a==null?void 0:a._id,a==null?void 0:a.channels]),i.useEffect(()=>{if(!j)return;const c=I=>{!I||!I.channelId||I.portalId&&String(I.portalId)!==String(a==null?void 0:a._id)||A(ye=>({...ye,[String(I.channelId)]:Number(I.count)||0}))};return j.on("voice:channel-count-update",c),()=>{j.off("voice:channel-count-update",c)}},[j,a==null?void 0:a._id]);const Ee=a!=null&&a.channels?[...a.channels].sort((c,I)=>(c.order||0)-(I.order||0)).map(c=>({id:c._id,name:c.name,type:c.type||"text",postCount:c.postCount})):[],me=Ee.find(c=>String(c.id)===String(h)),_=(me==null?void 0:me.type)==="voice"||(me==null?void 0:me.type)==="conference";i.useEffect(()=>{!_&&q&&L(!1)},[_,q,L]);const he=c=>String(h)===String(c),Te=(a==null?void 0:a.coverImage)||(a==null?void 0:a.banner),ee=Te?fe(Te):null,ct=ee?`url("${ee}")`:a&&!Te?'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")':"none",[le,ue]=i.useState(!1),ae=i.useRef(null);return i.useEffect(()=>{if(!ee){ue(!0),ae.current=null;return}if(ae.current===ee){ue(!0);return}ae.current=ee;const c=new window.Image;c.src=ee,c.complete?ue(!0):(ue(!1),c.onload=()=>ue(!0),c.onerror=()=>ue(!0))},[ee]),a?e.jsxs("div",{className:`channel-sidebar ${q?"collapsed":""} ${b||""}`,style:{height:"calc(100% - 24px)",backgroundColor:"transparent",display:"flex",flexDirection:"column",flexShrink:0,overflow:"visible",position:"relative",borderRight:"none"},children:[!K&&_&&e.jsx("button",{className:"sidebar-toggle-btn",onClick:c=>{c.stopPropagation(),L(!q)},title:q?"Menüyü Göster":"Menüyü Gizle",children:q?e.jsx(Ys,{size:16}):e.jsx(Hs,{size:16})}),e.jsxs("div",{className:"sidebar-content-wrapper",style:{display:"flex",flexDirection:"column",flex:1,width:"100%",height:"100%",overflow:"hidden",transition:"opacity 0.2s ease, visibility 0.2s ease",opacity:q?0:1,visibility:q?"hidden":"visible",gap:"8px",padding:"0px",boxSizing:"border-box"},children:[e.jsxs("div",{className:"cs-panel cs-panel--banner",children:[e.jsxs("div",{className:"channel-banner-container",onClick:()=>V&&V(),children:[e.jsx("div",{className:"channel-banner-image",style:{backgroundImage:ct,opacity:le?1:0}}),e.jsx("div",{className:"channel-banner-overlay"})]}),e.jsxs("div",{className:"portal-quick-info",children:[e.jsxs("div",{className:"portal-info-main",onClick:()=>V&&V(),children:[e.jsxs("h2",{className:"portal-title-text",children:[e.jsx("span",{className:"portal-title-name",children:a.name}),e.jsx(Nt,{portal:a,size:18})]}),e.jsxs("div",{className:"portal-stats-row",children:[e.jsxs("div",{className:`stat-item ${B==="members"?"stat-tooltip-active":""}`,onClick:c=>Ne("members",c),title:"Üye",children:[e.jsx(Js,{size:12}),e.jsx("span",{children:Re}),e.jsx("div",{className:"stat-floating-tag",children:"Üye"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${B==="posts"?"stat-tooltip-active":""}`,onClick:c=>Ne("posts",c),title:"Gönderi",children:[e.jsx(Pt,{size:12}),e.jsx("span",{children:a.postCount||0}),e.jsx("div",{className:"stat-floating-tag",children:"Gönderi"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${B==="online"?"stat-tooltip-active":""}`,onClick:c=>Ne("online",c),title:"Çevrimiçi",children:[e.jsx("div",{className:"online-indicator-dot"}),e.jsx("span",{children:we}),e.jsx("div",{className:"stat-floating-tag",children:"Çevrimiçi"})]})]})]}),e.jsxs("div",{className:"portal-header-actions",children:[(p||J)&&e.jsx("button",{className:"portal-action-btn-circle",onClick:c=>{c.stopPropagation(),M&&M("notifications")},title:"Bildirim Ayarları",children:e.jsx(Zs,{size:16})}),p&&e.jsx("button",{className:"portal-action-btn-circle",onClick:c=>{c.stopPropagation(),F(!0)},title:"Davet Et",children:e.jsx(is,{size:18})})]})]})]}),e.jsxs("div",{className:"cs-panel cs-panel--channels custom-scrollbar",children:[e.jsxs("div",{className:"cs-channels-header",children:[e.jsx("span",{children:"Kanallar"}),J&&e.jsx("div",{onClick:c=>{c.stopPropagation(),M&&M("channels")},className:"cs-add-channel-btn",title:"Kanal Oluştur",children:"+"})]}),e.jsx("div",{className:"cs-channel-list",children:Ee.map(c=>{var ve;const I=he(c.id),ye=c.type==="announcement"||c.name.includes("announcements"),pe=c.type==="voice"||c.type==="conference";let be=s[String(c.id)]??0;return D&&String(D.channelId)===String(c.id)&&Array.isArray($)&&(be=$.filter(je=>!je.isScreenSharing&&!String(je.identity).endsWith("-screen")).length),e.jsxs("div",{className:`channel-item ${I?"active":""}`,onClick:()=>H(c.id),style:{padding:"6px 8px",margin:"2px 0",borderRadius:"4px",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",color:I?"white":"#949ba4",backgroundColor:I?"#3f4147":"transparent",transition:"background-color 0.15s ease, color 0.15s ease"},children:[e.jsx("div",{style:{color:I?"white":"var(--text-secondary)",display:"flex",alignItems:"center",minWidth:"20px",justifyContent:"center"},children:c.type==="conference"?e.jsx(rs,{size:20,strokeWidth:2}):c.type==="voice"?e.jsx(Qs,{size:20,strokeWidth:2}):ye?e.jsx(Xs,{size:20,strokeWidth:2.5}):c.type==="image"?e.jsx(ls,{size:20,strokeWidth:2.5,style:{color:"#f59e0b"}}):e.jsx(ea,{size:20,strokeWidth:2.5})}),e.jsx("span",{style:{fontWeight:I?600:500,fontSize:"16px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:I?"white":"var(--text-primary)",maxWidth:"fit-content"},children:c.name}),pe&&e.jsx("span",{className:`vc-channel-active-badge ${be>0?"online":"idle"}`,children:be>0?`${be} aktif`:"aktif yok"}),!I&&((ve=r[c.id])==null?void 0:ve.length)>0&&e.jsx("div",{style:{backgroundColor:"#f23f43",color:"white",fontSize:"11px",fontWeight:"bold",padding:"0 6px",borderRadius:"8px",minWidth:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.3)",marginLeft:"-4px",flexShrink:0},children:r[c.id].length>9?"9+":r[c.id].length}),e.jsx("div",{style:{flex:1}}),I&&pe&&D&&String(D.channelId)===String(c.id)&&v&&e.jsx("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:e.jsx(Ca,{startedAt:v,className:"vc-sidebar-timer"})})]},c.id)})})]}),e.jsxs("div",{className:"cs-panel cs-panel--userbar",children:[e.jsx(fa,{currentChannelId:h}),e.jsx("div",{className:"cs-footer-copyright",children:"© 2026 Oxypace. Tüm hakları saklıdır."})]})]}),e.jsx("style",{children:`
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
            `}),N&&e.jsx(_a,{portalId:a._id,onClose:()=>F(!1)})]}):null},za=({members:a=[],onClose:p})=>{var q,L;const{onlineUsers:M}=Ct(),{user:h}=lt(),[,H]=i.useState(0);i.useEffect(()=>{const r=setInterval(()=>{H(x=>x+1)},6e4);return()=>clearInterval(r)},[]);const b=r=>{if(!r)return"";const x=new Date,v=new Date(r),D=Math.max(0,x-v),$=Math.floor(D/6e4);if($<1)return"şimdi";if($<60)return`${$}dk`;const j=Math.floor($/60);if(j<24)return`${j}sa`;const w=Math.floor(j/24);if(w<30)return`${w}g`;const s=Math.floor(w/30);return s<12?`${s}ay`:`${Math.floor(s/12)}y`},J=r=>{if(!r)return null;if(typeof r=="string")return r;const x=r._id||r.id;return x?String(x):null},V=new Set((M||[]).map(r=>String(r))),S=h!=null&&h._id?String(h._id):null,N=((L=(q=h==null?void 0:h.settings)==null?void 0:q.privacy)==null?void 0:L.showOnlineStatus)!==!1;S&&N?V.add(S):S&&!N&&V.delete(S);const F=r=>(r==null?void 0:r.role)==="owner"?3:(r==null?void 0:r.role)==="admin"||r!=null&&r.isAdmin?2:1,E=a.filter(r=>{if(!r)return!1;const x=J(r);return x&&V.has(x)}).sort((r,x)=>{var j,w;const v=F(x)-F(r);if(v!==0)return v;const D=((j=r.profile)==null?void 0:j.displayName)||r.username||"",$=((w=x.profile)==null?void 0:w.displayName)||x.username||"";return D.localeCompare($)}),K=a.filter(r=>{if(!r)return!1;const x=J(r);return x&&!V.has(x)}).sort((r,x)=>{var j,w;const v=F(x)-F(r);if(v!==0)return v;const D=((j=r.profile)==null?void 0:j.displayName)||r.username||"",$=((w=x.profile)==null?void 0:w.displayName)||x.username||"";return D.localeCompare($)});return e.jsxs("div",{className:"members-sidebar custom-scrollbar",children:[e.jsxs("div",{className:"members-header-top",children:[e.jsx("h3",{children:"ÜYELER"}),p&&e.jsx("button",{onClick:p,className:"close-members-btn","aria-label":"Kapat",children:e.jsx(Ge,{size:20,strokeWidth:2})})]}),e.jsxs("div",{className:"members-category",children:["Çevrim içi — ",E.length]}),E.map((r,x)=>{var s,A,B,T;if(!r||typeof r=="string")return null;const v=r.username||"Unknown",D=((s=r.profile)==null?void 0:s.avatar)||r.avatar,$=((A=r.profile)==null?void 0:A.displayName)||v,j=r.role==="owner",w=r.role==="admin"||r.isAdmin;return e.jsxs(Zt,{to:`/profile/${v}`,className:"member-item member-link",children:[e.jsxs("div",{className:"member-avatar-wrapper",children:[D?e.jsx("img",{src:fe(D,"thumbnail"),alt:"",className:"member-avatar",loading:"eager",decoding:"async"}):e.jsx("div",{className:"member-avatar-placeholder",children:((B=$[0])==null?void 0:B.toUpperCase())||((T=v[0])==null?void 0:T.toUpperCase())||"?"}),e.jsx("div",{className:"status-indicator online"})]}),e.jsxs("div",{className:"member-info",style:{display:"flex",alignItems:"center",gap:"6px"},children:[e.jsxs("span",{className:"member-name active-role",style:{color:j?"#f1c40f":w?"#3498db":"#2ecc71"},children:[$,j&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!j&&w&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"})]}),e.jsx(ts,{user:r,size:13})]})]},r._id||r.id||x)}),e.jsxs("div",{className:"members-category",children:["Çevrim dışı — ",K.length]}),K.map((r,x)=>{var s,A,B,T;if(!r||typeof r=="string")return null;const v=r.username||"Unknown",D=((s=r.profile)==null?void 0:s.avatar)||r.avatar,$=((A=r.profile)==null?void 0:A.displayName)||v,j=r.role==="owner",w=r.role==="admin"||r.isAdmin;return e.jsxs(Zt,{to:`/profile/${v}`,className:"member-item offline member-link",children:[e.jsx("div",{className:"member-avatar-wrapper",children:D?e.jsx("img",{src:fe(D,"thumbnail"),alt:"",className:"member-avatar",loading:"eager",decoding:"async"}):e.jsx("div",{className:"member-avatar-placeholder",style:{backgroundColor:"var(--bg-secondary)"},children:((B=$[0])==null?void 0:B.toUpperCase())||((T=v[0])==null?void 0:T.toUpperCase())||"?"})}),e.jsx("div",{className:"member-info",style:{flex:1},children:e.jsxs("div",{className:"member-name-row",style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("span",{className:"member-name",style:{display:"flex",alignItems:"center",gap:"4px"},children:[$,j&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!j&&w&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"}),e.jsx(ts,{user:r,size:13})]}),r.lastActive&&e.jsx("span",{className:"last-active-time",style:{fontSize:"11px",color:"var(--text-muted)"},children:b(r.lastActive)})]})})]},r._id||r.id||`offline-${x}`)}),e.jsx("style",{children:`
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
            `})]})},Aa=()=>{var q,L;const{user:a,updateUser:p}=lt(),M=wt(),[h,H]=i.useState(null),[b,J]=i.useState([]),[V,S]=i.useState(!0),[N,F]=i.useState(null);i.useEffect(()=>{let r=!0;return(async()=>{try{const v=await ce.get("/api/portals/showcase");r&&v.data&&(H(v.data.globalPortal||null),J(Array.isArray(v.data.topPortals)?v.data.topPortals:[]))}catch{}finally{r&&S(!1)}})(),()=>{r=!1}},[]);const E=async(r,x)=>{var v,D,$;if(r.stopPropagation(),!a){M("/login");return}if(x.isMember){M(`/portal/${x._id}`);return}if(!(x.isRequested||N===x._id)){F(x._id);try{const w=((v=(await ce.post(`/api/portals/${x._id}/join`)).data)==null?void 0:v.status)==="requested",s=A=>!A||A._id!==x._id?A:{...A,isMember:!w,isRequested:w,memberCount:w?A.memberCount:(A.memberCount||0)+1};if((h==null?void 0:h._id)===x._id&&H(s(h)),J(A=>A.map(s)),!w&&a&&p){const A=a.joinedPortals||[];A.some(B=>(B._id||B).toString()===x._id.toString())||p({joinedPortals:[...A,x],portals:[...a.portals||[],x]})}}catch(j){alert((($=(D=j.response)==null?void 0:D.data)==null?void 0:$.message)||"İşlem gerçekleştirilemedi.")}finally{F(null)}}},K=r=>r!=null&&r.banner?`url(${fe(r.banner)}) center/cover no-repeat`:"#141414";return e.jsxs("div",{className:"tanitim-showcase-wrapper",children:[e.jsxs("section",{className:"tanitim-guide-card",children:[e.jsxs("div",{className:"tanitim-guide-header",children:[e.jsxs("div",{className:"tanitim-guide-tag",children:[e.jsx(ta,{size:13}),e.jsx("span",{children:"SİSTEM DİREKTİFİ // RESMİ PLATFORM REHBERİ"})]}),e.jsx("h1",{className:"tanitim-guide-title",children:"Oxypace İletişim Protokolü & Kullanım Mimarisi"}),e.jsx("p",{className:"tanitim-guide-lead",children:"Özgür, sansürsüz, yüksek performanslı ve gizlilik odaklı yeni nesil topluluk ekosistemi. Arayüz haritasını ve platformun tüm gelişmiş yeteneklerini aşağıdaki yönergelerden inceleyin."})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// NAVİGASYON VE MENÜ YERLEŞİMİ"}),e.jsx("h2",{className:"sub-section-title",children:"Sayfa Yapısı & Arayüz Konumlandırması"})]}),e.jsxs("div",{className:"tanitim-nav-map-grid",children:[e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(sa,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ SOL NAVİGASYON BARI ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Ana Gezinme Çubuğu"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Doğrudan Mesajlar (DM):"})," Birebir şifreli özel yazışmalar ve anlık bildirim kutusu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portallar Listesi:"})," Üye olduğunuz veya yönettiğiniz tüm portalların dikey simgeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Keşfet Pusulası:"})," Yeni toplulukları, popüler portalları ve kişileri arama alanı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Oluştur (+):"})," Saniyeler içinde kendi özgür topluluğunuzu kurma aracı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kimlik & Hızlı Ayar:"})," En altta mikrofon, kulaklık ve profil hızlı kontrolleri."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(aa,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ PORTAL İÇİ MENÜ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Kanal Hiyerarşisi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Kimliği:"})," Özel afiş, doğrulanmış rozet ve çevrimiçi üye göstergeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Metin Kanalları (#):"})," Tematik konulara göre ayrılmış gönderi ve tartışma akışları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Ses Kanalları (🎙️):"})," Tek dokunuşla girilebilen, gecikmesiz canlı ses odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Sahne Kanalları (🎤):"})," Seminer, podcast ve etkinlikler için konuşmacı odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Yönetimi:"})," Yöneticiler için yeni kanallar açma ve gizlilik kilidi."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(es,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ ÜST DENETİM & AKIŞ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"İçerik & Üye Denetimi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Üst Başlığı:"})," Aktif kanal adı, açıklaması ve hızlı üye paneli butonu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Üye Listesi Paneli:"})," Sağ tarafta çevrimiçi yöneticiler ve aktif üyeler."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Görsel Akış Alanı:"})," 4K videolar, çoklu galeriler ve doküman önizlemeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Bildirim Zil İkonu:"})," Kanal ve portal bazlı bildirim filtreleme ayarları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Ayarları:"})," Portal sahibi ve yöneticileri için tam yönetim konsolu."]})]})]})]})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// GELİŞMİŞ SİSTEM DİREKLERİ"}),e.jsx("h2",{className:"sub-section-title",children:"Platform Mekanizmaları & Özellikler"})]}),e.jsxs("div",{className:"tanitim-pillars-grid",children:[e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"01"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Pt,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Gelişmiş Mesaj Mekanizması"}),e.jsx("p",{className:"pillar-text",children:"Markdown formatlama, tek tıkla alıntılı yanıtlama (quote reply), kullanıcıyı doğrudan haberdar eden @etiketleme sistemi ve akıllı bağlantı (link preview) ayrıştırma desteği."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Alıntılı Yanıt"}),e.jsx("span",{className:"pillar-tag",children:"@Bahsetmeler"}),e.jsx("span",{className:"pillar-tag",children:"Mesaj Sabitleme"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"02"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(na,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Canlı Ses Odaları & Sahne Modu"}),e.jsx("p",{className:"pillar-text",children:"Ultra düşük gecikmeli WebRTC ses mimarisi. Herkesin serbestçe katılabildiği sohbet odaları ile seminer ve konferanslar için konuşmacı-dinleyici ayrımı ve el kaldırma desteği sunan Sahne kanalları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Gecikme"}),e.jsx("span",{className:"pillar-tag",children:"Sahne Hiyerarşisi"}),e.jsx("span",{className:"pillar-tag",children:"Arka Planda Ses"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"03"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(ia,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Mobil Ekosistem & PIP Video"}),e.jsx("p",{className:"pillar-text",children:"Yerel Android APK ve tam uyumlu PWA deneyimi. Canlı FCM Push bildirimleri, mobil veri tasarrufu modu ve gezinirken köşede kesintisiz oynayan Kayan Resim İçinde Resim (PIP) video motoru."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Android APK / PWA"}),e.jsx("span",{className:"pillar-tag",children:"Canlı PIP Oynatıcı"}),e.jsx("span",{className:"pillar-tag",children:"FCM Push Bildirim"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"04"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(ra,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Ultra-HD Medya & Transcoding"}),e.jsx("p",{className:"pillar-text",children:"İstemci içi WASM motoru ile 360p'den 4K'ya kadar otomatik optimize edilen video akışı. Tek gönderide 10 adede kadar yüksek kaliteli fotoğraf galerisi ve tek tıkla önizlenebilir PDF dokümanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"4K Video Transcoding"}),e.jsx("span",{className:"pillar-tag",children:"10'lu Görsel Galerisi"}),e.jsx("span",{className:"pillar-tag",children:"PDF Doküman Desteği"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"05"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(es,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Özelleştirilebilir Sistemler & Temalar"}),e.jsx("p",{className:"pillar-text",children:"Saf OLED siyahı ve yüksek kontrastlı Aydınlık tema desteği. Kişisel profil afişi, biyografi ve avatar özelleştirmeleri. Portallar için özel roller, izin matrisleri ve gizlilik kalkanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"OLED Siyah & Açık Tema"}),e.jsx("span",{className:"pillar-tag",children:"Rol & Yetki Matrisi"}),e.jsx("span",{className:"pillar-tag",children:"Özel Profil Afişi"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"06"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(la,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Kripto-Güvenlik & Sıfır Takip"}),e.jsx("p",{className:"pillar-text",children:"Sıfır veri madenciliği ve ticari profil koruması. IP ve aktif cihaz oturum denetimi, güvenlik anahtarları ile hesap kurtarma ve doğrulanmış resmi topluluk rozetleri."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Veri İzleme"}),e.jsx("span",{className:"pillar-tag",children:"Cihaz & Oturum Denetimi"}),e.jsx("span",{className:"pillar-tag",children:"Onay Rozetleri"})]})]})]})]})]}),h&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ MERKEZ TOPLULUK // 01 ]"}),e.jsx("span",{className:"section-badge",children:"EN POPÜLER PORTAL"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Oxypace Global"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"Platformun en geniş üye kitlesine sahip resmi ana iletişim merkezi."})]}),e.jsxs("div",{className:"oxypace-global-hero-card",onClick:()=>M(`/portal/${h._id}`),children:[e.jsxs("div",{className:"hero-card-banner",style:{background:K(h)},children:[e.jsx("div",{className:"hero-banner-overlay"}),e.jsx("div",{className:"hero-banner-badge",children:e.jsx("span",{children:"ANA TOPLULUK"})})]}),e.jsxs("div",{className:"hero-card-body",children:[e.jsxs("div",{className:"hero-header-row",children:[e.jsx("div",{className:"hero-avatar-box",children:h.avatar?e.jsx("img",{src:fe(h.avatar),alt:h.name,className:"hero-avatar-img"}):e.jsx("div",{className:"hero-avatar-fallback",children:((L=(q=h.name)==null?void 0:q.substring(0,2))==null?void 0:L.toUpperCase())||"OG"})}),e.jsxs("div",{className:"hero-identity-col",children:[e.jsxs("div",{className:"hero-name-row",children:[e.jsx("h3",{className:"hero-portal-name",children:h.name}),e.jsx(Nt,{portal:h,size:18}),e.jsx("span",{className:"hero-privacy-tag",children:h.privacy==="private"?e.jsxs(e.Fragment,{children:[e.jsx(oa,{size:11})," GİZLİ"]}):e.jsxs(e.Fragment,{children:[e.jsx(ca,{size:11})," HERKESE AÇIK"]})})]}),e.jsx("div",{className:"hero-meta-row",children:e.jsxs("div",{className:"hero-member-stat",children:[e.jsx(St,{size:14}),e.jsxs("span",{children:[(h.memberCount||0).toLocaleString("tr-TR")," Üye"]})]})})]}),e.jsx("div",{className:"hero-action-col",children:e.jsx("button",{type:"button",className:`tanitim-sharp-btn hero-btn ${h.isMember?"btn-joined":h.isRequested?"btn-requested":"btn-action"}`,onClick:r=>E(r,h),disabled:N===h._id||h.isRequested,children:N===h._id?"İŞLENİYOR...":h.isMember?e.jsxs(e.Fragment,{children:[e.jsx(kt,{size:14}),"ÜYESİNİZ"]}):h.isRequested?e.jsxs(e.Fragment,{children:[e.jsx(os,{size:14}),"İSTEK GÖNDERİLDİ"]}):h.privacy==="private"?"ÜYELİK İSTEĞİ GÖNDER":"PORTALA KATIL"})})]}),e.jsx("p",{className:"hero-description",children:h.description||"Oxypace platformunun ana buluşma noktası. Güncel duyurular, teknik tartışmalar ve küresel topluluk etkileşimi."})]})]})]}),b.length>0&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ AKTİF TOPLULUKLAR // 02 ]"}),e.jsx("span",{className:"section-badge",children:"ÖNE ÇIKAN PORTALLAR"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Popüler Topluluklar"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"En çok paylaşıma ve aktif etkileşime sahip seçkin portallar."})]}),e.jsx("div",{className:"tanitim-portals-row",children:b.map(r=>{var x,v;return e.jsxs("div",{className:"tanitim-classic-card",onClick:()=>M(`/portal/${r._id}`),children:[e.jsx("div",{className:"classic-card-banner",style:{background:K(r)},children:e.jsx("div",{className:"classic-banner-overlay"})}),e.jsx("div",{className:"classic-card-icon-wrapper",children:r.avatar?e.jsx("img",{src:fe(r.avatar),alt:r.name,className:"classic-card-icon-img",loading:"lazy"}):e.jsx("div",{className:"classic-card-icon-placeholder",children:((v=(x=r.name)==null?void 0:x.substring(0,2))==null?void 0:v.toUpperCase())||"P"})}),e.jsxs("div",{className:"classic-card-body",children:[e.jsxs("div",{className:"classic-card-title-row",children:[e.jsx("h4",{className:"classic-card-title",children:r.name}),e.jsx(Nt,{portal:r,size:16})]}),e.jsx("p",{className:"classic-card-desc",children:r.description||"Bu topluluk hakkında henüz bir açıklama girilmemiş."}),e.jsxs("div",{className:"classic-card-footer",children:[e.jsxs("div",{className:"classic-member-count",children:[e.jsx(St,{size:12}),e.jsxs("span",{children:[r.memberCount||0," Üye"]})]}),e.jsx("button",{type:"button",className:`tanitim-sharp-btn small-btn ${r.isMember?"btn-joined":r.isRequested?"btn-requested":"btn-action"}`,onClick:D=>E(D,r),disabled:N===r._id||r.isRequested,children:N===r._id?"...":r.isMember?"ÜYESİNİZ":r.isRequested?"İSTEK":r.privacy==="private"?"İSTEK AT":"KATIL"})]})]})]},r._id)})})]})]})},Ia=({alerts:a=[]})=>{const[p,M]=i.useState(()=>{try{const S=sessionStorage.getItem("dismissed_portal_alerts");return S?JSON.parse(S):[]}catch{return[]}}),[h,H]=i.useState(null),b=a.filter(S=>!p.includes(S._id)),J=S=>{H(S),setTimeout(()=>{const N=[...p,S];M(N);try{sessionStorage.setItem("dismissed_portal_alerts",JSON.stringify(N))}catch{}H(null)},300)},V=S=>{const N=new Date,E=new Date(S)-N;if(E<=0)return null;const K=Math.floor(E/(1e3*60*60*24)),q=Math.floor(E/(1e3*60*60)%24),L=Math.floor(E/(1e3*60)%60);return K>0?`${K} gün ${q} saat kaldı`:q>0?`${q} saat ${L} dk kaldı`:`${L} dakika kaldı`};return b.length===0?null:e.jsx(e.Fragment,{children:b.map(S=>e.jsx("div",{className:`portal-alert-banner ${h===S._id?"dismissing":""}`,children:e.jsxs("div",{className:"alert-banner-inner",children:[e.jsx("div",{className:"alert-banner-icon",children:e.jsx(da,{size:18,strokeWidth:2})}),e.jsxs("div",{className:"alert-banner-content",children:[e.jsx("div",{className:"alert-banner-label",children:e.jsx("span",{children:"Yönetici Uyarısı"})}),e.jsx("div",{className:"alert-banner-message",children:S.message}),e.jsx("div",{className:"alert-banner-meta",children:e.jsxs("span",{className:"alert-banner-time",children:[e.jsx(os,{size:16,strokeWidth:2}),V(S.expiresAt)||"Süresi dolmak üzere"]})})]}),e.jsx("button",{className:"alert-banner-close",onClick:()=>J(S._id),title:"Uyarıyı gizle",children:e.jsx(Ge,{size:16,strokeWidth:2.5})})]})},S._id))})},Ea=i.lazy(()=>rt(()=>import("./PortalSettingsModal-Ck1SCGQ3.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13]))),Ta=i.lazy(()=>rt(()=>import("./PortalNotifications-_oUJKppf.js"),__vite__mapDeps([14,1,2,3,4,5,6,15]))),Ra=i.lazy(()=>rt(()=>import("./VoiceChannel-BA-euoOs.js"),__vite__mapDeps([16,1,4,2,3,5,6,17,18]))),Ma=i.lazy(()=>rt(()=>import("./ConferenceChannel-Cn9HdTJc.js"),__vite__mapDeps([19,1,4,2,3,5,6,17,18]))),dn=()=>{var Wt,Vt,Gt,Yt,Ht,Jt;const{id:a}=Ts(),p=Rs(),[M]=Ms(),h=M.get("channel"),H=M.get("post"),{user:b,token:J,updateUser:V,loading:S}=lt(),{socket:N,connected:F}=Ct(),E=wt(),K=ns(),{isSidebarOpen:q,closeSidebar:L,isMobileView:r,mobileChannelOpen:x,setMobileChannelOpen:v}=K||{},{activeRoom:D}=_t(),$=i.useRef(!1),j=(K==null?void 0:K.isDesktopSidebarCollapsed)||!1,w=typeof window<"u"&&!!localStorage.getItem("admin_backup_token"),[s,A]=i.useState(()=>{var t;try{const n=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(n){const l=JSON.parse(n);if(Array.isArray(l==null?void 0:l.channels)&&l.channels.length>0)return l}}catch{}return(t=p==null?void 0:p.state)!=null&&t.portal&&(String(p.state.portal._id)===String(a)||String(p.state.portal.id)===String(a))&&Array.isArray(p.state.portal.channels)&&p.state.portal.channels.length>0?p.state.portal:null});i.useEffect(()=>{var t;(t=p==null?void 0:p.state)!=null&&t.portal&&(String(p.state.portal._id)===String(a)||String(p.state.portal.id)===String(a))&&A(n=>Array.isArray(p.state.portal.channels)&&p.state.portal.channels.length>0?p.state.portal:n&&Array.isArray(n.channels)&&n.channels.length>0?{...p.state.portal,channels:n.channels,roles:n.roles||p.state.portal.roles,members:n.members||p.state.portal.members}:n||null)},[a,p.state]);const B=Ve(t=>t.posts),T=Ve(t=>t.setPosts),[de,Ne]=i.useState(()=>{var t;try{const n=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(n){const l=JSON.parse(n);if(Array.isArray(l==null?void 0:l.channels)&&l.channels.length>0)return!1}}catch{}return!((t=p==null?void 0:p.state)!=null&&t.portal&&(String(p.state.portal._id)===String(a)||String(p.state.portal.id)===String(a))&&Array.isArray(p.state.portal.channels)&&p.state.portal.channels.length>0)}),[Pe,ge]=i.useState(!1),[xe,te]=i.useState(""),[Z,Ye]=i.useState(null),[we,Re]=i.useState(null),[Ee,me]=i.useState(!1),[_,he]=i.useState(null),[Te,ee]=i.useState({}),[ot,ct]=i.useState(!1),[le,ue]=i.useState(""),[ae,Me]=i.useState([]);i.useRef(null);const[_e,c]=i.useState(!1),[I,ye]=i.useState(!1),[pe,be]=i.useState({show:!1,message:"",type:"info"}),[ve,je]=i.useState(!1),[oe,Q]=i.useState(!1),[Le,He]=i.useState({top:0,left:0}),zt=i.useRef(null),[ke,ze]=i.useState([]),[At,It]=i.useState(!1),[Et,Tt]=i.useState(!1),[Rt,Mt]=i.useState(!1),[se,De]=i.useState(null),[cs,dt]=i.useState(0),[Lt,mt]=i.useState(!1),Dt=i.useMemo(()=>ka(le),[le]);Fs();const Se=Qt(t=>t.activeUploads)[`portal-${a}`];i.useEffect(()=>{Se&&Se.status==="uploading"&&T(t=>t.map(n=>n.isOptimistic&&(n.mediaType==="video"||n.mediaType==="mixed")?{...n,uploadProgress:Se.progress}:n))},[Se==null?void 0:Se.progress,Se==null?void 0:Se.status]);const[ds,Je]=i.useState(!1),Ze=!!(s!=null&&s.name&&/Oxypace Tan[ıi]t[ıi]m/i.test(s.name)),ms=!!(b&&(((Wt=b.username)==null?void 0:Wt.toLowerCase())==="oxypace"||b.isAdmin)),hs=Ze?ms:b&&Ee,us=i.useRef(null),$e=i.useRef(null),ps=i.useCallback(t=>{t.preventDefault(),t.stopPropagation(),Q(n=>{if(!n&&$e.current){const l=$e.current.getBoundingClientRect();He({top:l.bottom+8,left:l.left})}return!n})},[]);i.useEffect(()=>{if(!oe)return;let t=!0;const n=()=>{if($e.current){const k=$e.current.getBoundingClientRect();He({top:k.bottom+8,left:k.left})}},l=k=>{if(!t)return;const o=k.target.closest(".plus-menu")||k.target.closest(".portal-plus-menu-portal"),u=k.target.closest(".upload-btn");!o&&!u&&Q(!1)},m=setTimeout(()=>{t&&(document.addEventListener("click",l),document.addEventListener("touchstart",l))},0);return window.addEventListener("scroll",n,!0),window.addEventListener("resize",n),()=>{t=!1,clearTimeout(m),document.removeEventListener("click",l),document.removeEventListener("touchstart",l),window.removeEventListener("scroll",n,!0),window.removeEventListener("resize",n)}},[oe]),i.useEffect(()=>()=>{Q(!1)},[]),i.useEffect(()=>{Q(!1)},[_,a]),i.useEffect(()=>{var t;(t=p.state)!=null&&t.quotedPost&&(De(p.state.quotedPost),p.state.selectedChannelId&&he(p.state.selectedChannelId),L&&L(),v&&v(!0),E(p.pathname+p.search,{replace:!0,state:{}}))},[p.state,a]),i.useEffect(()=>{let t=!0;const n=async()=>{var u;const m=window.__oxypacePendingChannelShare;if(!m||!m.payload||m.portalId&&String(m.portalId)!==String(a))return;window.__oxypacePendingChannelShare=null;const k=m.payload;m.channelId&&he(m.channelId),L&&L(),v&&v(!0);const o=(k.text||k.subject||"").trim();if(o&&t&&ue(f=>f?`${f}
${o}`:o),Array.isArray(k.files)&&k.files.length>0){const f=[];for(const g of k.files)try{let C=null;if(g.base64){const d=atob(g.base64),P=new Array(d.length);for(let z=0;z<d.length;z++)P[z]=d.charCodeAt(z);const U=new Uint8Array(P);C=new Blob([U],{type:g.mimeType||"application/octet-stream"})}else if(g.path&&window.Capacitor){const d=window.Capacitor.convertFileSrc(g.path);C=await(await fetch(d)).blob()}if(C){const d=new File([C],g.name||"shared_file",{type:g.mimeType||C.type||"application/octet-stream"});f.push(d)}}catch{}f.length>0&&t&&(ze(g=>{const{nextDrafts:C,warnings:d}=as(g,f);return d.length>0&&ne(d[0],"warning"),C}),Q(!1))}else o&&t&&Q(!1);(u=p.state)!=null&&u.sharedTrigger&&E(p.pathname+p.search,{replace:!0,state:{}})};n();const l=()=>{n()};return window.addEventListener("oxypace:apply_shared_to_channel",l),()=>{t=!1,window.removeEventListener("oxypace:apply_shared_to_channel",l)}},[a,(Vt=p.state)==null?void 0:Vt.sharedTrigger]);const O=(Gt=s==null?void 0:s.channels)==null?void 0:Gt.find(t=>String(t._id)===String(_)),Ae=(O==null?void 0:O.type)==="image",Qe=(O==null?void 0:O.type)==="voice"||(O==null?void 0:O.type)==="conference",$t=Qe&&(!r||x);i.useEffect(()=>{s!=null&&s.channels&&Array.isArray(s.channels)&&ee(t=>{const n={...t};return s.channels.forEach(l=>{const m=String(l._id);l.postCount!==void 0&&(n[m]=l.postCount)}),n})},[s==null?void 0:s.channels]),i.useEffect(()=>{if(!N||!F||!a)return;N.emit("join_portal",a),N.emit("get_online_users"),_&&N.emit("join_channel",_);const t=o=>{var P,U,z,W,ie;const u=((P=o.portal)==null?void 0:P._id)||o.portal,f=((U=o.channel)==null?void 0:U._id)||o.channel,g=String(u)===String(a),C=((z=s==null?void 0:s.channels)==null?void 0:z.length)===1,d=String(f)===String(_)||String(f||"general")===String(_||"general")||C||O&&(String(f)===String(O.name)||String(f)===String(O._id));if(g&&d){const X=((W=o.author)==null?void 0:W._id)||((ie=o.author)==null?void 0:ie.id)||o.author;if(String(X)!==String(b==null?void 0:b._id)){const R=String(_);ee(Y=>({...Y,[R]:(Y[R]!==void 0?Y[R]:(O==null?void 0:O.postCount)||0)+1}))}T(R=>{if(R.some(re=>re._id===o._id))return R;const Y=o.quotedPost&&(typeof o.quotedPost=="string"?o.quotedPost:o.quotedPost._id);if(Y){const re=R.find(y=>y._id===Y);re&&typeof re=="object"&&re.author?o.quotedPost=re:se&&Y===se._id&&(o.quotedPost=se)}return[o,...R]})}},n=o=>{var g;const u=((g=o.portal)==null?void 0:g._id)||o.portal;(!u||String(u)===String(a))&&T(C=>C.map(d=>String(d._id)===String(o._id)?o:d))},l=({postId:o,portalId:u})=>{(!u||String(u)===String(a))&&o&&T(f=>f.filter(g=>String(g._id)!==String(o)))},m=({userId:o,status:u,lastActive:f})=>{u==="offline"&&Me(g=>g.filter(C=>String(C.userId)!==String(o))),A(g=>{if(!g)return g;const C=f||new Date;let d=g.owner;if(g.owner){const z=g.owner._id||g.owner.id||g.owner;String(z)===String(o)&&typeof g.owner=="object"&&(d={...g.owner,lastActive:C})}let P=g.admins;Array.isArray(g.admins)&&(P=g.admins.map(z=>{const W=z._id||z.id||z;return String(W)===String(o)&&typeof z=="object"&&z!==null?{...z,lastActive:C}:z}));let U=g.members;return Array.isArray(g.members)&&(U=g.members.map(z=>{const W=z._id||z.id||z;return String(W)===String(o)&&typeof z=="object"&&z!==null?{...z,lastActive:C}:z})),{...g,owner:d,admins:P,members:U}})},k=({userId:o,username:u,displayName:f,avatar:g,isTyping:C})=>{String(o)!==String(b==null?void 0:b._id)&&Me(d=>C?d.some(P=>String(P.userId)===String(o))?d:[...d,{userId:o,username:u,displayName:f,avatar:g}]:d.filter(P=>String(P.userId)!==String(o)))};return N.on("post:created",t),N.on("post:updated",n),N.on("post:deleted",l),N.on("user_status_change",m),N.on("portal_typing_update",k),()=>{N.off("post:created",t),N.off("post:updated",n),N.off("post:deleted",l),N.off("user_status_change",m),N.off("portal_typing_update",k)}},[N,F,a,_,b==null?void 0:b._id]);const[fs,Xe]=i.useState(!1),[gs,xs]=i.useState(0),ht=i.useRef(null),ut=i.useRef(null),qe=i.useRef(null),bs=i.useCallback(t=>{const n=t.target;ut.current||(ut.current=requestAnimationFrame(()=>{ut.current=null;const l=n.scrollTop,m=l>300;Xe(o=>o!==m?m:o);const k=n.scrollHeight-n.clientHeight;if(k>0){const o=Math.round(l/k*100);xs(u=>Math.abs(u-o)>=2?o:u)}}))},[]),pt=i.useCallback(t=>{t&&(t.preventDefault(),t.stopPropagation()),qe.current&&cancelAnimationFrame(qe.current);const n=ht.current||document.querySelector(".discord-feed")||document.querySelector(".portal-feed-container");if(!n){window.scrollTo({top:0,behavior:"smooth"});return}const l=n.scrollTop;if(l<=0)return;const m=800,k=performance.now(),o=f=>1-Math.pow(1-f,5),u=f=>{const g=f-k,C=Math.min(g/m,1),d=o(C);n.scrollTop=Math.round(l*(1-d)),C<1?qe.current=requestAnimationFrame(u):(n.scrollTop=0,qe.current=null)};qe.current=requestAnimationFrame(u)},[]);i.useEffect(()=>{const t=()=>{pt(),(!s||!Array.isArray(s.channels)||s.channels.length===0)&&Be()};return window.addEventListener("oxypace:scroll_portal_top",t),()=>window.removeEventListener("oxypace:scroll_portal_top",t)},[pt,s==null?void 0:s._id,(Yt=s==null?void 0:s.channels)==null?void 0:Yt.length]);const ys=t=>{$.current=!1,he(t),Xe(!1),r&&(L(),v(!0))};i.useEffect(()=>{const t=!!(Qe&&D&&String(D.portalId)===String(a)&&String(D.channelId)===String(_)),n=()=>{!(document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement||document.msFullscreenElement)&&t&&!$.current&&(L==null||L(),v==null||v(!0))};return document.addEventListener("fullscreenchange",n),document.addEventListener("webkitfullscreenchange",n),()=>{document.removeEventListener("fullscreenchange",n),document.removeEventListener("webkitfullscreenchange",n)}},[Qe,D,a,_,L,v]);const ne=i.useCallback((t,n="info")=>{be({show:!0,message:t,type:n}),setTimeout(()=>be(l=>({...l,show:!1})),4e3)},[]),et=i.useCallback((t,n={})=>{!t||t.length===0||ze(l=>{const{nextDrafts:m,warnings:k}=as(l,t,{extra:n,imagesOnly:Ae});return k.length>0&&ne(k[0],"warning"),m})},[Ae,ne]),vs=t=>{const n=Array.from(t.target.files||[]);t.target.value="",n.length!==0&&(et(n),Q(!1))},js=t=>{t&&et([t])},ks=(t,n={})=>{t&&et([t],n)},Ss=t=>{!t||t.length===0||et(t)},Ns=t=>{try{const n=wa(t);if(!n)return;ze(l=>l.length>=15?(Oe(n),ne("Bir gönderiye en fazla 15 dosya veya içerik eklenebilir.","warning"),l):[...l,n])}catch(n){ne((n==null?void 0:n.message)||"Klasör eklenemedi.","error")}},ws=t=>{ze(n=>{const l=n.find(m=>m.id===t);return l&&Oe(l),n.filter(m=>m.id!==t)})},_s=()=>{ze(t=>(t.forEach(Oe),[]))};i.useEffect(()=>{w||!N||!a||(le.trim().length>0||ke.length>0?_e||(c(!0),N.emit("portal_typing",{portalId:a,isTyping:!0})):_e&&(N.emit("portal_typing",{portalId:a,isTyping:!1}),c(!1)))},[le,ke,a,N,_e,w]),i.useEffect(()=>()=>{!w&&N&&a&&_e&&N.emit("portal_typing",{portalId:a,isTyping:!1})},[a,N,_e,w]);const qt=async()=>{var u,f,g,C;if(w){ne("Hayalet Modu: Salt okunur izleme modundasınız. Gönderi paylaşılamaz.","error");return}const t=le.trim().length>0,n=ke.length>0;if(!t&&!n)return;N&&a&&N.emit("portal_typing",{portalId:a,isTyping:!1}),c(!1);const l={content:le,drafts:[...ke],detectedYouTube:Dt,quotedPost:se},m=`temp-${Date.now()}`,k=Sa(l.drafts,l.detectedYouTube),o={_id:m,content:l.content,media:k.media,mediaType:k.mediaType||"none",attachments:k.attachments||[],author:b,createdAt:new Date().toISOString(),likes:[],likeCount:0,isOptimistic:!0,quotedPost:l.quotedPost,isProcessing:k.isVideoUpload,processingProgress:0,estimatedTime:k.isVideoUpload?"Hesaplanıyor...":""};if(T(d=>[o,...d]),_){const d=String(_);ee(P=>({...P,[d]:(P[d]!==void 0?P[d]:(O==null?void 0:O.postCount)||0)+1}))}ue(""),ze([]),Q(!1),mt(!0),dt(0);try{const d=await Na({drafts:l.drafts,uploadFileFn:Bs,targetId:a,hasAutoYouTube:!!l.detectedYouTube,onProgress:W=>{dt(W),T(ie=>ie.map(X=>String(X._id)===String(m)?{...X,uploadProgress:W}:X))}});if(d.mode==="video"){Qt.getState().startVideoUpload({file:d.primaryVideoFile,portalId:a,channel:_,content:l.content,quotedPostId:(u=l.quotedPost)==null?void 0:u._id,extraAttachments:d.extraAttachments,onFinish:(W,ie)=>{if(l.drafts.forEach(Oe),W){if(T(X=>X.filter(R=>String(R._id)!==String(m))),_){const X=String(_);ee(R=>({...R,[X]:Math.max(0,(R[X]||1)-1)}))}ne("Video yükleme başarısız oldu.","error")}else if(ie){const X=String(m);T(R=>{const Y=String(ie._id);return R.some(y=>String(y._id)===Y)?R.filter(y=>String(y._id)!==X):R.map(y=>{if(String(y._id)===X){const G=ie,Ce=G.quotedPost&&(typeof G.quotedPost=="string"?G.quotedPost:G.quotedPost._id);return Ce&&y.quotedPost&&Ce===y.quotedPost._id&&(G.quotedPost=y.quotedPost),G}return y})})}}}),mt(!1),De(null);return}const P={content:l.content,portalId:a,channel:_,quotedPostId:(f=l.quotedPost)==null?void 0:f._id,...d.payloadFields},U=await ce.post("/api/posts",P);De(null),l.drafts.forEach(Oe);const z=String(m);T(W=>{const ie=String(U.data._id);return W.some(R=>String(R._id)===ie)?W.filter(R=>String(R._id)!==z):W.map(R=>{if(String(R._id)===z){const Y=U.data,re=Y.quotedPost&&(typeof Y.quotedPost=="string"?Y.quotedPost:Y.quotedPost._id);return re&&R.quotedPost&&re===R.quotedPost._id&&(Y.quotedPost=R.quotedPost),Y}return R})})}catch(d){const P=((C=(g=d.response)==null?void 0:g.data)==null?void 0:C.message)||d.message;if(ne(P,"error"),T(U=>U.filter(z=>String(z._id)!==String(m))),_){const U=String(_);ee(z=>({...z,[U]:Math.max(0,(z[U]||1)-1)}))}ue(l.content),ze(l.drafts),De(l.quotedPost||null)}finally{mt(!1),dt(0)}},[ft,Ie]=i.useState(!1),[gt,tt]=i.useState("overview"),[Da,$a]=i.useState(!1),[qa,Cs]=i.useState({name:"",description:"",privacy:"public"});i.useRef(null),i.useRef(null);const st=i.useRef(!1);i.useEffect(()=>{a&&!S&&Be()},[a,S]),i.useEffect(()=>{a&&!S&&!st.current&&(!s||!Array.isArray(s.channels)||s.channels.length===0||String(s._id)!==String(a))&&Be()},[a,S,s==null?void 0:s._id,(Ht=s==null?void 0:s.channels)==null?void 0:Ht.length]),i.useEffect(()=>{M.get("openSettings")==="true"&&(tt("overview"),Ie(!0))},[M]),i.useEffect(()=>{if(s&&s._id&&s.name)try{const t=localStorage.getItem("oxypace_portal_visits"),n=t?JSON.parse(t):{},l=String(s._id),m=n[l]||{count:0};n[l]={id:l,name:s.name,avatar:s.avatar,count:(m.count||0)+1,lastVisited:Date.now()},localStorage.setItem("oxypace_portal_visits",JSON.stringify(n));let k=0,o=null;Object.values(n).forEach(u=>{u.count>k&&(k=u.count,o=u)}),o&&localStorage.setItem("oxypace_top_portal",JSON.stringify({id:o.id,name:o.name}))}catch{}},[s==null?void 0:s._id,s==null?void 0:s.name]),i.useEffect(()=>{if(!S&&s&&String(s._id)===String(a)&&s.channels&&s.channels.length>0)if(_){if(h){const n=s.channels.find(l=>String(l._id)===String(h));if(n&&String(n._id)!==String(_)){he(n._id);return}}if(!s.channels.some(n=>String(n._id)===String(_))){const n=s.channels[0];n&&he(n._id)}}else{if(h){const n=s.channels.find(l=>String(l._id)===String(h));if(n){he(n._id);return}}const t=s.channels[0];t&&he(t._id)}},[s,S,h]),i.useEffect(()=>{const t=n=>{const{portalId:l,channelId:m}=n.detail||{};(!l||String(l)===String(a))&&m&&(he(m),Xe(!1),v&&v(!0))};return window.addEventListener("oxypace:switch_channel",t),()=>window.removeEventListener("oxypace:switch_channel",t)},[a,v]),i.useLayoutEffect(()=>{const t=!!h||M.get("joinVoice")==="true";v&&t&&v(!0)},[a,h,M,v]),i.useEffect(()=>{a&&_&&s&&yt(s._id,a)&&Ue()},[a,_,s==null?void 0:s._id]),i.useEffect(()=>(a&&_&&(!r||x||!!h)?(jt(a,_),Ds(a,_),Ve.getState().clearUnreadForChannel(_,a)):jt(null,null),()=>{jt(null,null)}),[a,_,r,x,h]),i.useEffect(()=>{if(H&&!ot&&!Pe&&Array.isArray(B)&&B.length>0){const t=document.getElementById(`post-${H}`);t&&setTimeout(()=>{t.scrollIntoView({behavior:"smooth",block:"center"}),t.classList.add("highlight-post"),setTimeout(()=>t.classList.remove("highlight-post"),2e3),ct(!0)},100)}},[H,B,Pe,ot]),i.useEffect(()=>{var t,n;if(s&&b){const l=((t=s.members)==null?void 0:t.includes(b._id))||((n=b.joinedPortals)==null?void 0:n.some(m=>m._id===s._id||m===s._id));me(!!l)}},[s,b]);const Be=async()=>{var l,m,k,o;if(st.current)return;st.current=!0,te("");let t=null;try{const u=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(u){const f=JSON.parse(u);f&&String(f._id)===String(a)&&Array.isArray(f.channels)&&f.channels.length>0&&(t=f)}}catch{}(!s||String(s._id)!==String(a)||!Array.isArray(s.channels)||s.channels.length===0)&&(t?(A(t),Ne(!1)):Ne(!0),Xe(!1));let n=null;for(let u=0;u<3;u++)try{const f=await ce.get(`/api/portals/${a}`);A(f.data);try{const d=JSON.stringify(f.data);sessionStorage.setItem(`oxypace_portal_cache_${a}`,d),localStorage.setItem(`oxypace_portal_cache_${a}`,d)}catch{}(l=f.data)!=null&&l.avatar&&Xt(f.data.avatar,"original");const g=((m=f.data)==null?void 0:m.coverImage)||((k=f.data)==null?void 0:k.banner);g&&Xt(g,"original");const C=[f.data.owner,...f.data.admins||[],...f.data.members||[]].filter(Boolean);$s(C),Cs({name:f.data.name,description:f.data.description||"",privacy:f.data.privacy||"public"}),te(""),n=null;break}catch(f){n=f;const g=(o=f.response)==null?void 0:o.status;if(g===403||g===404)break;u<2&&await new Promise(C=>setTimeout(C,1200*(u+1)))}if(n)if(n.response&&n.response.status===403){const u=n.response.data||{};u.portalStatus==="suspended"||u.portalStatus==="closed"?(Ye({portalStatus:u.portalStatus,statusReason:u.statusReason,suspendedUntil:u.suspendedUntil,portalName:u.portalName,portalAvatar:u.portalAvatar}),te("suspended")):te("blocked")}else n.response&&n.response.status===404?te("blocked"):!t&&(!s||String(s._id)!==String(a))&&te("Portal yüklenemedi");st.current=!1,Ne(!1)},at=i.useRef(null),Bt=i.useRef(B);Bt.current=B;const Fe=i.useRef(_);Fe.current=_;const Ue=i.useCallback(async(t=!1)=>{var m,k;const n=Fe.current,l=`portal_posts_${a}_${n}`;if(t)Ut(!0);else{at.current&&at.current.abort(),at.current=new AbortController;let o=!1;try{const u=localStorage.getItem(l)||sessionStorage.getItem(l);if(u){const f=JSON.parse(u);Array.isArray(f)&&f.length>0&&(T(f),ge(!1),o=!0)}}catch{}o||(ge(!0),T([])),xt(!0)}try{const o=localStorage.getItem("token"),u={signal:(m=at.current)==null?void 0:m.signal,...o&&{headers:{Authorization:`Bearer ${o}`}}};if(t&&n!==Fe.current)return;let f=`/api/portals/${a}/posts?channel=${n}&limit=10`;const g=Bt.current;if(t&&g.length>0){const P=g[g.length-1];f+=`&before=${P.createdAt}`}const C=await ce.get(f,u),d=C.data;if(C.headers&&C.headers["x-total-count"]!==void 0){const P=parseInt(C.headers["x-total-count"],10);isNaN(P)||ee(U=>({...U,[String(n)]:P}))}if(d.length<10&&xt(!1),t)T(P=>{const U=new Set(P.map(W=>W._id)),z=d.filter(W=>!U.has(W._id));return[...P,...z]});else{T(d);try{localStorage.setItem(l,JSON.stringify(d.slice(0,20)))}catch{try{sessionStorage.setItem(l,JSON.stringify(d.slice(0,15)))}catch{}}}te("")}catch(o){if(ce.isCancel(o))return;((k=o.response)==null?void 0:k.status)===403?te("private"):te("Gönderiler yüklenemedi")}finally{t||ge(!1),Ut(!1),Ne(!1)}},[a]),[Ft,xt]=i.useState(!0),[bt,Ut]=i.useState(!1),nt=i.useRef(),Ps=i.useCallback(t=>{bt||(nt.current&&nt.current.disconnect(),nt.current=new IntersectionObserver(n=>{n[0].isIntersecting&&Ft&&Ue(!0)},{root:ht.current,rootMargin:"200px"}),t&&nt.current.observe(t))},[bt,Ft,Ue]);i.useEffect(()=>{T([]),xt(!0),he(null),A(null),te(""),v(!1)},[a]);const zs=i.useCallback(t=>{T(l=>l.filter(m=>String(m._id)!==String(t)));const n=Fe.current;n&&ee(l=>({...l,[String(n)]:Math.max(0,(l[String(n)]||1)-1)}))},[T]),As=i.useCallback((t,n)=>{if(n){T(m=>m.filter(k=>String(k._id)!==String(t)));const l=Fe.current;l&&ee(m=>({...m,[String(l)]:Math.max(0,(m[String(l)]||1)-1)}))}},[T]),Is=i.useCallback(async t=>{try{const l=(await ce.put(`/api/posts/${t}/pin`)).data;T(m=>m.map(o=>o._id===t?l:o).sort((o,u)=>o.isPinned===u.isPinned?new Date(u.createdAt)-new Date(o.createdAt):o.isPinned?-1:1))}catch{ne("Sabitleme işlemi başarısız","error")}},[T,ne]),Es=async()=>{var t,n;if(!b){ne("Lütfen giriş yapın veya kaydolun!","warning");return}try{const l=localStorage.getItem("token"),m=l?{headers:{Authorization:`Bearer ${l}`}}:{};if((await ce.post(`/api/portals/${a}/join`,{},m)).data.status==="joined"){me(!0);const o=Array.isArray(b==null?void 0:b.joinedPortals)?b.joinedPortals:[],u=Array.isArray(b==null?void 0:b.portals)?b.portals:[],f=[...o.filter(d=>{var P;return((P=(d==null?void 0:d._id)||d)==null?void 0:P.toString())!==a.toString()}),s],g=[...u.filter(d=>{var P;return((P=(d==null?void 0:d._id)||d)==null?void 0:P.toString())!==a.toString()}),s],C={...b,joinedPortals:f,portals:g};V(C),A(d=>({...d,members:[...d.members||[],b._id]})),Ue(),ne("Portala başarıyla katıldınız!","success")}else ne("Üyelik isteğiniz gönderildi!","info"),A(o=>({...o,isRequested:!0}))}catch(l){ne(((n=(t=l.response)==null?void 0:t.data)==null?void 0:n.message)||"Katılma başarısız","error")}},yt=(t,n)=>{if(!t||!n)return!1;const l=typeof t=="object"?t.toString():t,m=typeof n=="object"?n.toString():n;return l===m},Kt=b&&s&&s.owner&&yt(s.owner._id||s.owner,b._id),Ot=Kt||b&&s&&s.admins&&s.admins.some(t=>yt(t._id||t,b._id));if(i.useEffect(()=>{if(!(Z!=null&&Z.suspendedUntil)){Re(null);return}const t=()=>{const l=new Date,k=new Date(Z.suspendedUntil)-l;if(k<=0){Re(null),window.location.reload();return}Re({days:Math.floor(k/(1e3*60*60*24)),hours:Math.floor(k/(1e3*60*60)%24),minutes:Math.floor(k/(1e3*60)%60),seconds:Math.floor(k/1e3%60)})};t();const n=setInterval(t,1e3);return()=>clearInterval(n)},[Z]),!J&&!S)return e.jsx(Ls,{to:"/",replace:!0});if(xe==="suspended"&&Z){const t=Z.portalStatus==="suspended",n=Z.suspendedUntil?new Date(Z.suspendedUntil).toLocaleString("tr-TR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):null;return e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(Ke,{}),e.jsx("div",{className:"suspension-screen",children:e.jsxs("div",{className:"suspension-card",children:[e.jsx("div",{className:"suspension-icon",children:t?"⏸️":"🔒"}),e.jsx("h1",{className:"suspension-title",children:Z.portalName||"Portal"}),e.jsx("h2",{className:"suspension-subtitle",children:t?"Bu portal geçici olarak askıya alındı":"Bu portal kapatılmıştır"}),Z.statusReason&&e.jsxs("div",{className:"suspension-reason",children:[e.jsx("div",{className:"suspension-reason-label",children:"Sebep"}),e.jsx("p",{children:Z.statusReason})]}),t&&n&&e.jsxs("div",{className:"suspension-unlock",children:[e.jsx("div",{className:"suspension-unlock-label",children:"🔓 Erişim Açılma Tarihi"}),e.jsx("div",{className:"suspension-unlock-date",children:n}),we&&e.jsxs("div",{className:"suspension-countdown",children:[e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(we.days).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Gün"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(we.hours).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saat"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(we.minutes).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Dakika"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(we.seconds).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saniye"})]})]})]}),e.jsxs("div",{className:"suspension-policy",children:[e.jsx("span",{children:"📋"}),e.jsxs("p",{children:["Askıya alma nedenleri, platformun ",e.jsx("strong",{children:"Politika ve Koşullar"}),"'ı kapsamında değerlendirilmektedir. Detaylı bilgi için kurallarımızı inceleyebilirsiniz."]})]}),e.jsx("button",{onClick:()=>E("/"),className:"suspension-home-btn",children:"Anasayfaya Dön"})]})})]})}return xe&&xe!=="suspended"?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(Ke,{}),e.jsxs("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center",flexDirection:"column",color:"var(--text-muted)"},children:[e.jsx("div",{style:{fontSize:"3rem",marginBottom:"1rem"},children:"🚫"}),e.jsx("h2",{children:xe==="blocked"?"Sonuç Bulunamadı":"Bir Hata Oluştu"}),e.jsx("p",{children:xe==="blocked"?"Aradığınız portala ulaşılamıyor.":xe||"Portal yüklenirken bir sorun oluştu."}),e.jsx("button",{onClick:()=>E("/"),className:"btn-save",style:{marginTop:"20px",float:"none"},children:"Anasayfaya Dön"})]})]}):de||S||!s||!Array.isArray(s.channels)||s.channels.length===0?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(Ke,{}),e.jsx("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center"},children:e.jsx("div",{className:"spinner"})})]}):s.isNSFW&&!ve&&!sessionStorage.getItem(`nsfw_confirmed_${a}`)?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(Ke,{}),e.jsx("div",{className:"nsfw-gate-overlay",children:e.jsxs("div",{className:"nsfw-gate-card",children:[e.jsx("div",{className:"nsfw-gate-icon",children:e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]})}),e.jsx("div",{className:"nsfw-gate-badge",children:"+18"}),e.jsx("h1",{className:"nsfw-gate-title",children:"Yaş Kısıtlaması"}),e.jsxs("p",{className:"nsfw-gate-desc",children:[e.jsx("strong",{children:s.name})," portalı yetişkin içerik barındırabilir. Bu portala erişmek için 18 yaşından büyük olmanız gerekmektedir."]}),e.jsxs("div",{className:"nsfw-gate-actions",children:[e.jsx("button",{className:"nsfw-gate-confirm",onClick:()=>{sessionStorage.setItem(`nsfw_confirmed_${a}`,"true"),je(!0)},children:"18 yaşından büyüğüm, devam et"}),e.jsx("button",{className:"nsfw-gate-cancel",onClick:()=>E(-1),children:"Geri Dön"})]}),e.jsx("p",{className:"nsfw-gate-legal",children:"Devam ederek, yaşınızın 18'den büyük olduğunu ve yetişkin içerikle ilgili yasal sorumluluğu kabul ettiğinizi onaylarsınız."})]})})]}):e.jsxs("div",{className:`app-wrapper full-height discord-layout ${$t?"voice-channel-active":""}`,children:[e.jsx(xa,{title:s.name,description:s.description||`${s.name} topluluğuna katılın.`,image:fe(s.avatar),type:"website",schema:{"@context":"https://schema.org","@type":"Community",name:s.name,description:s.description,url:window.location.href,memberCount:((Jt=s.members)==null?void 0:Jt.length)||0}}),!ft&&e.jsx(Ke,{}),pe.show&&e.jsxs("div",{className:`app-toast ${pe.type}`,children:[e.jsx("span",{className:"app-toast-icon",children:pe.type==="error"?"🚫":pe.type==="success"?"✅":pe.type==="warning"?"⚠️":"ℹ️"}),pe.message]}),e.jsxs("div",{className:`discord-split-view ${r&&x?"mobile-feed-active":""} ${$t?"voice-room-active":""} ${j?"sidebar-collapsed":""}`,children:[b&&e.jsx(Pa,{portal:s,isMember:Ee,canManage:Kt||Ot,onEdit:t=>{tt(typeof t=="string"?t:"overview"),Ie(!0)},currentChannel:_,onChangeChannel:ys,className:`${q?"mobile-open":""} ${r&&x?"mobile-hidden":""}`,onShowPortalInfo:()=>Je(!0)}),e.jsxs("main",{className:`discord-main-content ${r&&!x?"mobile-content-hidden":""} ${Qe?"voice-channel-active":""}`,children:[r&&!x&&e.jsx(ga,{title:(s==null?void 0:s.name)||"Portal",showBack:!1}),(()=>{var k,o,u,f,g,C,d,P,U,z,W,ie,X,R,Y,re;const t=O,n=(t==null?void 0:t.type)||"text",l=(t==null?void 0:t.name)||"...",m=n==="voice"||n==="conference";return e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{display:"flex",flex:1,overflow:"hidden"},children:m?e.jsx("div",{style:{flex:1,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"},children:e.jsx(i.Suspense,{fallback:e.jsx("div",{className:"skeleton-loader",children:e.jsx("p",{children:"Canlı bağlantı odası hazırlanıyor..."})}),children:n==="conference"?e.jsx(Ma,{portalId:a,channelId:_,channelName:l,onBack:()=>{$.current=!0,v(!1)}}):e.jsx(Ra,{portalId:a,channelId:_,channelName:l,onBack:()=>{$.current=!0,v(!1)}})})}):e.jsx("div",{className:"channel-messages-area",style:{flex:1,display:"flex",flexDirection:"column"},children:Pe?e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"},children:[e.jsx("div",{className:"spinner"}),e.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.9rem"},children:"İçerik yükleniyor..."})]}):e.jsxs(e.Fragment,{children:[!m&&e.jsxs("header",{className:`channel-top-bar ${r?"":"desktop-only"}`,children:[e.jsxs("div",{className:"channel-title-wrapper",children:[r&&e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>v(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",children:n==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",children:l}),(()=>{const y=String((t==null?void 0:t._id)||_||""),G=Te[y]!==void 0?Te[y]:(t==null?void 0:t.postCount)??0;return e.jsxs("div",{className:"channel-post-count-badge",title:`${G} Gönderi`,children:[e.jsx(Pt,{size:13}),e.jsx("span",{children:G})]})})()]}),e.jsx("div",{className:"channel-header-actions",children:Ee&&e.jsx("button",{className:`icon-btn ${I?"active":""}`,onClick:()=>ye(!I),title:I?"Üyeleri Gizle":"Üyeleri Göster",style:{background:"none",border:"none",color:I?"var(--primary-color)":"var(--text-muted)"},children:e.jsx(St,{size:20})})})]}),xe==="private"?e.jsx(ss,{portal:s,onClose:()=>{window.history.length>2?E(-1):E("/search")},isMobile:r,onOpenSettings:()=>{tt("overview"),Ie(!0)},onJoinStatusChange:y=>{y==="requested"?A(G=>G&&{...G,isRequested:!0}):y==="joined"&&(me(!0),te(""),Be(),Ue())}}):e.jsxs(e.Fragment,{children:[(s==null?void 0:s.alerts)&&s.alerts.length>0&&e.jsx(Ia,{alerts:s.alerts}),e.jsx("div",{className:`portal-feed-container discord-feed ${Ze?"tanitim-feed-mode":""}`,onScroll:bs,ref:ht,children:Ze?e.jsx(Aa,{}):e.jsxs(e.Fragment,{children:[B.length===0&&!de&&e.jsxs("div",{className:"empty-portal",children:[e.jsx("div",{className:"empty-portal-icon",children:"👋"}),e.jsxs("h3",{children:[((o=(k=s==null?void 0:s.channels)==null?void 0:k.find(y=>y._id===_))==null?void 0:o.type)==="voice"?"🎙️":((f=(u=s==null?void 0:s.channels)==null?void 0:u.find(y=>y._id===_))==null?void 0:f.type)==="conference"?"🎤":((C=(g=s==null?void 0:s.channels)==null?void 0:g.find(y=>y._id===_))==null?void 0:C.type)==="image"?"🖼️":"#",((P=(d=s==null?void 0:s.channels)==null?void 0:d.find(y=>String(y._id)===String(_)))==null?void 0:P.name)||"..."," ","kanalına hoş geldin!"]}),e.jsx("p",{children:"Bu kanalda henüz mesaj yok. İlk mesajı sen at!"})]}),Array.isArray(B)&&B.map((y,G)=>{var it;y.isBot===!0||((it=y.author)==null||it.isBot);const Ce=qs.enableAds;return e.jsxs(i.Fragment,{children:[e.jsx(Us,{post:y,onDelete:zs,onPin:Is,onArchive:As,isAdmin:Ot},y._id),G<B.length-1&&e.jsx("div",{className:"post-separator"}),Ce]},y._id)}),e.jsx("div",{ref:Ps,style:{height:"40px",margin:"10px 0",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"},children:bt&&e.jsx("div",{className:"spinner-small"})})]})}),(()=>{const G=2*Math.PI*20,Ce=G-gs/100*G;return e.jsxs("button",{className:`floating-scroll-top portal-scroll-top ${fs?"visible":""}`,onClick:pt,"aria-label":"Yukarı Çık",children:[e.jsxs("svg",{className:"progress-ring",width:"50",height:"50",viewBox:"0 0 50 50",children:[e.jsx("circle",{className:"progress-ring-track",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25"}),e.jsx("circle",{className:"progress-ring-fill",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25",style:{strokeDasharray:G,strokeDashoffset:Ce}})]}),e.jsx("div",{className:"scroll-icon",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"m18 15-6-6-6 6"})})})]})})(),Ze?null:hs?e.jsxs("div",{className:"channel-input-area",children:[oe&&We.createPortal(e.jsxs("div",{className:"plus-menu portal-plus-menu-portal",ref:us,style:{position:"fixed",top:Le.top,left:Le.left,zIndex:99999},children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{var y;(y=zt.current)==null||y.click(),Q(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsx(ls,{size:18,strokeWidth:1.9})}),"Galeri"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{It(!0),Q(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsx(ma,{size:18,strokeWidth:1.9})}),"Kamera"]}),!Ae&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Tt(!0),Q(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsx(rs,{size:18,strokeWidth:1.9})}),"Ses"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Mt(!0),Q(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsx(ha,{size:18,strokeWidth:1.9})}),"Dosya"]})]})]}),document.body),e.jsx("input",{type:"file",ref:zt,onChange:vs,style:{display:"none"},accept:Ae?"image/*,.gif":"image/*,video/*,.gif",multiple:!0}),se&&e.jsxs("div",{className:"input-quoted-preview",children:[e.jsxs("div",{className:"input-quoted-preview-header",children:[(z=(U=se.author)==null?void 0:U.profile)!=null&&z.avatar?e.jsx("img",{src:fe(se.author.profile.avatar),alt:"",className:"quoted-preview-avatar",loading:"lazy",decoding:"async",width:"32",height:"32"}):e.jsx("div",{className:"quoted-preview-avatar-placeholder",children:(ie=(W=se.author)==null?void 0:W.username)==null?void 0:ie.charAt(0).toUpperCase()}),e.jsxs("div",{className:"quoted-preview-meta",children:[e.jsx("span",{className:"quoted-preview-author",children:((R=(X=se.author)==null?void 0:X.profile)==null?void 0:R.displayName)||((Y=se.author)==null?void 0:Y.username)}),e.jsxs("span",{className:"quoted-preview-username",children:["@",(re=se.author)==null?void 0:re.username]})]}),e.jsx("button",{className:"remove-quote-btn",onClick:()=>De(null),children:e.jsx(Ge,{size:16})})]}),e.jsxs("div",{className:"input-quoted-preview-body",children:[e.jsx("p",{className:"input-quoted-preview-text",children:se.content}),se.media&&e.jsx("div",{className:"input-quoted-preview-media",children:se.mediaType==="video"?e.jsxs("div",{className:"media-placeholder",children:[e.jsx(ua,{size:20}),e.jsx("span",{children:"Video Alıntısı"})]}):e.jsx("img",{src:fe(se.media),alt:"",loading:"lazy",decoding:"async",width:"120",height:"80"})})]})]}),Ae&&le.trim()&&ke.length===0&&e.jsxs("div",{className:"image-channel-warning",style:{backgroundColor:"rgba(239, 68, 68, 0.1)",border:"1px solid rgba(239, 68, 68, 0.25)",color:"#f87171",padding:"8px 12px",borderRadius:"8px",fontSize:"13px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{flexShrink:0},children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]}),e.jsx("span",{children:"Görsel kanallarında paylaşım yapabilmek için mutlaka bir görsel eklemelisiniz."})]}),!w&&e.jsx(ba,{attachments:ke,detectedYouTube:Dt,onRemoveAttachment:ws,onClearAll:_s}),w?e.jsxs("div",{className:"ghost-channel-notice",style:{backgroundColor:"#0c0c0c",borderTop:"1px solid #222",color:"#888",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",fontSize:"13px"},children:[e.jsxs("svg",{viewBox:"0 0 24 24",width:"18",height:"18",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{opacity:.7},children:[e.jsx("path",{d:"M12 2a5 5 0 0 0-5 5v14l3-2 2 2 2-2 3 2V7a5 5 0 0 0-5-5z"}),e.jsx("circle",{cx:"10",cy:"8",r:"1",fill:"currentColor"}),e.jsx("circle",{cx:"14",cy:"8",r:"1",fill:"currentColor"})]}),e.jsx("span",{children:"Hayalet Modu: Salt okunur izleme modundasınız. Kanalda mesaj ve gönderi paylaşılamaz."})]}):e.jsxs("div",{className:"message-input-wrapper",children:[e.jsx("button",{ref:$e,className:`input-action-btn upload-btn ${oe?"active":""}`,onClick:ps,style:{backgroundColor:"#383a40",borderRadius:"50%",width:"32px",height:"32px",marginRight:"12px",color:oe?"#ffffff":"#b9bbbe"},children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z"})})}),e.jsx("input",{type:"text",placeholder:Ae?"Gönderi paylaşmak için bir görsel ekleyin...":`#${(O==null?void 0:O.name)||"..."} kanalına mesaj gönder`,value:le,onChange:y=>{ue(y.target.value)},onKeyDown:y=>{y.key==="Enter"&&!y.shiftKey&&(y.preventDefault(),qt())}}),e.jsx("div",{className:"input-right-actions",children:e.jsx("button",{className:"input-action-btn send-btn",onClick:qt,disabled:Lt||(Ae||!le.trim())&&ke.length===0,title:"Gönder",style:{color:le.trim()||ke.length>0?"var(--primary-color)":"var(--text-tertiary)"},children:Lt?e.jsxs("div",{className:"compose-spinner-wrapper",style:{width:"20px",height:"20px"},children:[e.jsx("div",{className:"compose-spinner",style:{width:"20px",height:"20px",borderTopColor:"var(--primary-color)"}}),e.jsxs("span",{className:"compose-progress-text",style:{fontSize:"7px",color:"var(--text-primary)"},children:[cs,"%"]})]}):e.jsx(pa,{size:20})})})]}),ae&&ae.length>0&&e.jsxs("div",{className:"portal-typing-indicator",style:{marginTop:"8px"},children:[e.jsx("div",{className:"typing-avatars-group",children:ae.map(y=>e.jsx("img",{src:fe(y.avatar),alt:y.displayName,className:"typing-avatar",title:y.displayName},y.userId))}),e.jsx("span",{className:"typing-text",children:ae.length===1?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:ae[0].displayName})," yazıyor..."]}):ae.length===2?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:ae[0].displayName})," ve ",e.jsx("strong",{children:ae[1].displayName})," yazıyor..."]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:ae[0].displayName})," ve ",ae.length-1," kişi daha yazıyor..."]})})]})]}):e.jsx("div",{className:"channel-input-area",style:{padding:"0 20px 24px 20px",backgroundColor:"transparent",borderTop:"none"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--glass-bg)",padding:"12px 20px",borderRadius:"8px",border:"1px solid var(--glass-border)",backdropFilter:"blur(20px) saturate(160%)",WebkitBackdropFilter:"blur(20px) saturate(160%)",boxShadow:"var(--glass-shadow)"},children:[e.jsxs("span",{style:{color:"var(--text-secondary)",fontWeight:500,fontSize:"14px"},children:["Bu kanalda mesaj göndermek için ",b?"portala katılmalısın.":"giriş yapmalısın."]}),b?e.jsx("button",{className:"privacy-join-btn",onClick:Es,disabled:s.isRequested,style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:s.isRequested?"İstek Gönderildi":"Portala Katıl"}):e.jsx("button",{className:"privacy-join-btn",onClick:()=>E("/login"),style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:"Giriş Yap"})]})})]})]})})}),I&&e.jsx(za,{members:[...s.owner?[{...s.owner,role:"owner"}]:[],...(s.admins||[]).map(y=>({...y,role:"admin"})),...s.members||[]].filter((y,G,Ce)=>{const it=String(y._id||y.id||y);return y&&Ce.findIndex(vt=>String(vt._id||vt.id||vt)===it)===G}),onClose:()=>ye(!1)})]})})()]})]}),ft&&gt!=="notifications"&&e.jsx(i.Suspense,{fallback:null,children:e.jsx(Ea,{portal:s,currentUser:b,initialTab:gt,onClose:()=>Ie(!1),onUpdate:t=>{A(t)}})}),ft&&gt==="notifications"&&e.jsx("div",{className:"portal-notifications-modal",onClick:()=>Ie(!1),children:e.jsxs("div",{className:"notifications-modal-content",onClick:t=>t.stopPropagation(),children:[e.jsx("button",{className:"close-notifications-btn",onClick:()=>Ie(!1),children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsx(i.Suspense,{fallback:null,children:e.jsx(Ta,{portalId:s._id,portalChannels:s.channels||[],onUpdate:Be})})]})}),ds&&s&&e.jsx(ss,{portal:s,onClose:()=>Je(!1),isMobile:r,onOpenSettings:()=>{Je(!1),tt("overview"),Ie(!0)},onLeave:()=>{Je(!1),me(!1),E("/")}}),At&&We.createPortal(e.jsx(ya,{isOpen:At,onClose:()=>It(!1),onCapture:js}),document.body),Et&&We.createPortal(e.jsx(va,{isOpen:Et,onClose:()=>Tt(!1),onAttach:ks}),document.body),Rt&&We.createPortal(e.jsx(ja,{isOpen:Rt,onClose:()=>Mt(!1),onFilesSelected:Ss,onFolderPackaged:Ns}),document.body)]})};export{dn as default};
