const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PortalSettingsModal-zTb4tRZS.js","assets/vendor-DCF_9uAb.js","assets/index-DVsmvx6l.js","assets/socket-B6pAuna8.js","assets/livekit-BEAUSX0o.js","assets/lucide-584uTv_n.js","assets/index-BAEaGqd4.css","assets/ImageCropper-CayCUjkW.js","assets/ImageCropper-Dk7oVLRB.css","assets/PortalBadges--IARgkBI.js","assets/UserBadges-BPB7uWDn.js","assets/UserBadges-DFKBzEd_.css","assets/PortalBadges-bryM1aQu.css","assets/earthAtmosphere-yKs3wKrd.js","assets/globe-visualization-DPa5d3FQ.js","assets/PortalSettingsModal-CMYDHfO7.css","assets/PortalNotifications-DFzg5GZR.js","assets/PortalNotifications-zEgqx9Vo.css","assets/VoiceChannel-CY4ziDi8.js","assets/VoiceChannel-DxwCmfw1.js","assets/VoiceChannel-DqtXDlrU.css","assets/ConferenceChannel-PZLmJtUU.js"])))=>i.map(i=>d[i]);
import{r as i,a2 as ce,a6 as e,aa as Ze,a7 as It,as,au as qs,a8 as Bs,at as Fs,a9 as Us,a5 as mt}from"./vendor-DCF_9uAb.js";import{d as ve,l as Et,u as ut,m as ds,i as Qe,c as Tt,b as ns,n as Pt,o as Ks,p as is,h as Os,q as Ws,a as Vs}from"./index-DVsmvx6l.js";import{u as Gs}from"./useVideoTranscoder-BLHGZVG7.js";import{P as Ys}from"./PostCard-BnmQjLE7.js";import{g as Hs,c as Js}from"./shareUtils-aZ4YI3iv.js";import{ap as ms,X as Xe,b0 as Zs,j as dt,c as Qs,o as Xs,aA as ea,am as ta,b1 as sa,aq as aa,M as Mt,a4 as na,r as us,e as ia,at as ra,I as ps,p as la,b2 as oa,b3 as ca,az as da,k as rs,aW as ma,av as ua,F as pa,G as ha,v as fa,J as ga,K as zt,b4 as hs,aL as xa,q as ba,t as ya,s as va,b5 as ja,b6 as ka}from"./lucide-584uTv_n.js";import{U as ls}from"./UserBadges-BPB7uWDn.js";import{P as At}from"./PortalBadges--IARgkBI.js";import{U as Sa}from"./UserBar-CS3DoaF_.js";import{P as os}from"./PortalInfoModal-BaoQynNj.js";import{N as He}from"./Navbar-BmT2fH_f.js";import{S as Na}from"./SubHeader-70CzrPWE.js";import{S as wa}from"./SEO-g1ybexhv.js";import{C as _a,a as Ca,A as Pa,F as za}from"./ComposerAttachmentTray-B3f0G0Wp.js";import{e as Aa,a as cs,b as Ia,c as Ea,r as Je,f as Ta,p as Ma,d as Ra}from"./mediaAttachments-DvN1KPsH.js";import"./socket-B6pAuna8.js";import"./livekit-BEAUSX0o.js";import"./PostAttachments-qiuGziyW.js";import"./UserAvatar-CfU27TcC.js";import"./ReportModal-D3W5wPg5.js";import"./Login-DfmLp-Oq.js";/* empty css             *//* empty css                  */const La=({portalId:a,onClose:p})=>{const[T,b]=i.useState(""),[B,V]=i.useState([]),[G,g]=i.useState(!1),[A,Y]=i.useState(new Set),[$,k]=i.useState(new Set),[Z,M]=i.useState(!1),[H,l]=i.useState(null),h=i.useRef(null),S=Hs(a),E=(N,v="success")=>{l({text:N,type:v}),h.current&&clearTimeout(h.current),h.current=setTimeout(()=>{l(null)},2600)};i.useEffect(()=>{if(!a)return;let N=!1;return ce.get(`/api/portals/${a}`).then(v=>{if(N||!v.data)return;const s=new Set;v.data.owner&&s.add(String(v.data.owner._id||v.data.owner)),(v.data.members||[]).forEach(D=>s.add(String(D._id||D))),k(s)}).catch(()=>{}),()=>{N=!0}},[a]),i.useEffect(()=>{const N=v=>{v.key==="Escape"&&(p==null||p())};return window.addEventListener("keydown",N),()=>{window.removeEventListener("keydown",N),h.current&&clearTimeout(h.current)}},[p]),i.useEffect(()=>{const N=T.trim();if(!N){V([]),g(!1);return}g(!0);const v=setTimeout(async()=>{try{const s=await ce.get(`/api/users/search?q=${encodeURIComponent(N)}`);V(Array.isArray(s.data)?s.data:[])}catch{V([])}finally{g(!1)}},320);return()=>clearTimeout(v)},[T]);const _=async N=>{var s,D;const v=String(N);if($.has(v)){E("Bu kullanıcı zaten bu portalın üyesi.","error");return}try{await ce.post(`/api/portals/${a}/invite`,{userId:N}),await ce.post("/api/messages",{recipientId:N,portalId:a,content:"Seni bir portala davet ettim!"}),Y(K=>new Set(K).add(N)),E("Portal daveti gönderildi.")}catch(K){E(((D=(s=K.response)==null?void 0:s.data)==null?void 0:D.message)||"Davet gönderilemedi.","error")}},R=async()=>{await Js(S)?(M(!0),E("Davet bağlantısı panoya kopyalandı."),setTimeout(()=>M(!1),2200)):E("Bağlantı kopyalanamadı.","error")},F=e.jsx("div",{className:"invite-modal-overlay",onClick:p,role:"presentation",children:e.jsxs("div",{className:"invite-modal",onClick:N=>N.stopPropagation(),role:"dialog","aria-modal":"true","aria-label":"Kullanıcı Davet Et",children:[e.jsxs("header",{className:"invite-header",children:[e.jsxs("div",{className:"invite-header-title",children:[e.jsx(ms,{size:17,strokeWidth:2}),e.jsx("h2",{children:"Kullanıcı Davet Et"})]}),e.jsx("button",{type:"button",className:"invite-close-btn",onClick:p,"aria-label":"Kapat",children:e.jsx(Xe,{size:18,strokeWidth:2})})]}),H&&e.jsx("div",{className:`invite-feedback-banner ${H.type==="error"?"is-error":""}`,role:"status",children:e.jsx("span",{children:H.text})}),e.jsxs("div",{className:"invite-link-card",children:[e.jsxs("div",{className:"invite-link-meta",children:[e.jsxs("span",{className:"invite-link-title",children:[e.jsx(Zs,{size:13,strokeWidth:2}),e.jsx("span",{children:"Portal Davet Bağlantısı"})]}),e.jsx("span",{className:"invite-link-url",title:S,children:S.replace(/^https?:\/\//i,"")})]}),e.jsxs("button",{type:"button",className:`invite-copy-link-btn ${Z?"is-done":""}`,onClick:R,children:[Z?e.jsx(dt,{size:14,strokeWidth:2.4}):e.jsx(Qs,{size:14,strokeWidth:2}),e.jsx("span",{children:Z?"Kopyalandı":"Kopyala"})]})]}),e.jsxs("div",{className:"invite-search-container",children:[e.jsx(Xs,{size:15,strokeWidth:2,className:"invite-search-icon"}),e.jsx("input",{type:"text",placeholder:"Kullanıcı adı ara...",value:T,onChange:N=>b(N.target.value)}),T&&e.jsx("button",{type:"button",className:"invite-search-clear",onClick:()=>b(""),"aria-label":"Temizle",children:e.jsx(Xe,{size:13,strokeWidth:2.2})})]}),e.jsxs("div",{className:"invite-results custom-scrollbar",children:[G&&e.jsx("div",{className:"invite-state-text",children:"Aranıyor..."}),!G&&B.length===0&&T.trim().length>0&&e.jsx("div",{className:"invite-state-text",children:"Kullanıcı bulunamadı."}),!G&&T.trim().length===0&&e.jsx("div",{className:"invite-state-text",children:"Davet etmek istediğin kişinin kullanıcı adını yaz."}),B.map(N=>{var q,je,ie;const v=N._id||N,s=$.has(String(v)),D=A.has(v),K=((q=N.profile)==null?void 0:q.fullName)||((je=N.profile)==null?void 0:je.displayName);return e.jsxs("div",{className:"invite-user-row",children:[e.jsxs("div",{className:"invite-user-info",children:[e.jsx("img",{src:ve((ie=N.profile)==null?void 0:ie.avatar),alt:N.username||"Kullanıcı",className:"invite-avatar"}),e.jsxs("div",{className:"invite-user-meta",children:[e.jsx("span",{className:"invite-user-name",children:K||N.username}),K&&e.jsxs("span",{className:"invite-user-handle",children:["@",N.username]})]})]}),e.jsx("button",{type:"button",className:`invite-action-btn ${D||s?"invited":""}`,onClick:()=>!D&&!s&&_(v),disabled:D||s,children:s?e.jsxs(e.Fragment,{children:[e.jsx(dt,{size:14,strokeWidth:2.4}),e.jsx("span",{children:"Üye"})]}):D?e.jsxs(e.Fragment,{children:[e.jsx(dt,{size:14,strokeWidth:2.4}),e.jsx("span",{children:"Gönderildi"})]}):e.jsx("span",{children:"Davet Et"})})]},v)})]})]})});return typeof document>"u"?null:Ze.createPortal(F,document.body)},Da=({startedAt:a,style:p={},className:T=""})=>{const{roomStartTime:b}=Et()||{},[B,V]=i.useState("00:00");i.useEffect(()=>{const g=b&&a===b?b:a;if(!g){V("00:00");return}const A=()=>{const $=Math.floor((Date.now()-g)/1e3);if($<0){V("00:00");return}const k=Math.floor($/3600),Z=Math.floor($%3600/60),M=$%60;V(k>0?`${k.toString().padStart(2,"0")}:${Z.toString().padStart(2,"0")}:${M.toString().padStart(2,"0")}`:`${Z.toString().padStart(2,"0")}:${M.toString().padStart(2,"0")}`)};A();const Y=setInterval(A,1e3);return()=>clearInterval(Y)},[a,b]);const G={display:"flex",alignItems:"center",fontSize:"15px",fontWeight:"800",color:"#39FF14",background:"transparent",border:"none",padding:"0 4px"};return e.jsx("div",{style:{...G,...p},className:T,children:B})},$a=({portal:a,isMember:p,onEdit:T,currentChannel:b,onChangeChannel:B,className:V,canManage:G,onShowPortalInfo:g})=>{var Ee,me;const{user:A}=ut(),[Y,$]=i.useState(!1);It();const k=ds(),{isMobileView:Z}=k||{},M=(k==null?void 0:k.isDesktopSidebarCollapsed)||!1,H=(k==null?void 0:k.setIsDesktopSidebarCollapsed)||(()=>{}),l=Qe(c=>c.unreadPostsByChannel),h=Qe(c=>c.clearUnreadForChannel),{roomStartTime:S,activeRoom:E,participants:_}=Et(),{socket:R,onlineUsers:F}=Tt(),[N,v]=i.useState({}),[s,D]=i.useState(null),K=i.useRef(null),q=(c,I)=>{I.stopPropagation(),K.current&&clearTimeout(K.current),D(c),K.current=setTimeout(()=>{D(null)},1800)};i.useEffect(()=>()=>{K.current&&clearTimeout(K.current)},[]);const je=c=>{if(!c)return null;if(typeof c=="string")return c;const I=c._id||c.id;return I?String(I):null},ie=new Set,$e=je(a==null?void 0:a.owner);$e&&ie.add($e),((a==null?void 0:a.admins)||[]).forEach(c=>{const I=je(c);I&&ie.add(I)}),((a==null?void 0:a.members)||[]).forEach(c=>{const I=je(c);I&&ie.add(I)});const Ae=new Set((F||[]).map(c=>String(c))),de=A!=null&&A._id?String(A._id):null,re=((me=(Ee=A==null?void 0:A.settings)==null?void 0:Ee.privacy)==null?void 0:me.showOnlineStatus)!==!1;de&&ie.has(de)&&re?Ae.add(de):de&&!re&&Ae.delete(de);let se=0;ie.forEach(c=>{Ae.has(c)&&se++});const pt=ie.size||(a==null?void 0:a.membersCount)||((a==null?void 0:a.members)||[]).length||0;i.useEffect(()=>{b&&(a!=null&&a._id)&&h(b,a._id)},[b,a==null?void 0:a._id,h]),i.useEffect(()=>{var be;if(!(a!=null&&a._id)||!((be=a==null?void 0:a.channels)!=null&&be.length))return;const c=a.channels.filter(oe=>oe.type==="voice"||oe.type==="conference");if(c.length===0)return;let I=!0;const ge=async()=>{try{const oe=await Promise.all(c.map(async ye=>{var Te,Ce;const _e=ye._id||ye.id;try{const te=await ce.get(`/api/voice/rooms/${a._id}/${_e}/participants?t=${Date.now()}`);return{channelId:String(_e),count:((Ce=(Te=te.data)==null?void 0:Te.participants)==null?void 0:Ce.length)||0}}catch{return{channelId:String(_e),count:0}}}));I&&v(ye=>{const _e={...ye};return oe.forEach(Te=>{_e[Te.channelId]=Te.count}),_e})}catch{}};ge();const xe=setInterval(ge,1e4);return()=>{I=!1,clearInterval(xe)}},[a==null?void 0:a._id,a==null?void 0:a.channels]),i.useEffect(()=>{if(!R)return;const c=I=>{!I||!I.channelId||I.portalId&&String(I.portalId)!==String(a==null?void 0:a._id)||v(ge=>({...ge,[String(I.channelId)]:Number(I.count)||0}))};return R.on("voice:channel-count-update",c),()=>{R.off("voice:channel-count-update",c)}},[R,a==null?void 0:a._id]);const Ne=a!=null&&a.channels?[...a.channels].sort((c,I)=>(c.order||0)-(I.order||0)).map(c=>({id:c._id,name:c.name,type:c.type||"text",postCount:c.postCount})):[],he=Ne.find(c=>String(c.id)===String(b)),Ie=(he==null?void 0:he.type)==="voice"||(he==null?void 0:he.type)==="conference";i.useEffect(()=>{!Ie&&M&&H(!1)},[Ie,M,H]);const qe=c=>String(b)===String(c),w=(a==null?void 0:a.coverImage)||(a==null?void 0:a.banner),X=w?ve(w):null,fe=X?`url("${X}")`:a&&!w?'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")':"none",[et,we]=i.useState(!1),le=i.useRef(null);return i.useEffect(()=>{if(!X){we(!0),le.current=null;return}if(le.current===X){we(!0);return}le.current=X;const c=new window.Image;c.src=X,c.complete?we(!0):(we(!1),c.onload=()=>we(!0),c.onerror=()=>we(!0))},[X]),a?e.jsxs("div",{className:`channel-sidebar ${M?"collapsed":""} ${V||""}`,style:{height:"calc(100% - 24px)",backgroundColor:"transparent",display:"flex",flexDirection:"column",flexShrink:0,overflow:"visible",position:"relative",borderRight:"none"},children:[!Z&&Ie&&e.jsx("button",{type:"button",className:"sidebar-toggle-btn",onClick:c=>{c.stopPropagation(),H(!M)},title:M?"Menüyü Göster":"Menüyü Gizle","aria-label":M?"Menüyü Göster":"Menüyü Gizle",children:M?e.jsx(ea,{size:16}):e.jsx(ta,{size:16})}),e.jsxs("div",{className:"sidebar-content-wrapper",style:{display:"flex",flexDirection:"column",flex:1,width:"100%",height:"100%",overflow:"hidden",transition:"opacity 0.2s ease, visibility 0.2s ease",opacity:M?0:1,visibility:M?"hidden":"visible",gap:"8px",padding:"0px",boxSizing:"border-box"},children:[e.jsxs("div",{className:"cs-panel cs-panel--banner",children:[e.jsxs("div",{className:"channel-banner-container",onClick:()=>g&&g(),children:[e.jsx("div",{className:"channel-banner-image",style:{backgroundImage:fe,opacity:et?1:0}}),e.jsx("div",{className:"channel-banner-overlay"}),G&&e.jsx("button",{type:"button",className:"channel-banner-settings-btn",onClick:c=>{c.stopPropagation(),T&&T("overview")},title:"Portal Ayarları","aria-label":"Portal Ayarları",children:e.jsx(sa,{size:15,strokeWidth:2})})]}),e.jsxs("div",{className:"portal-quick-info",children:[e.jsxs("div",{className:"portal-info-main",onClick:()=>g&&g(),children:[e.jsxs("h2",{className:"portal-title-text",children:[e.jsx("span",{className:"portal-title-name",children:a.name}),e.jsx(At,{portal:a,size:18})]}),e.jsxs("div",{className:"portal-stats-row",children:[e.jsxs("div",{className:`stat-item ${s==="members"?"stat-tooltip-active":""}`,onClick:c=>q("members",c),title:"Üye",children:[e.jsx(aa,{size:12}),e.jsx("span",{children:pt}),e.jsx("div",{className:"stat-floating-tag",children:"Üye"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${s==="posts"?"stat-tooltip-active":""}`,onClick:c=>q("posts",c),title:"Gönderi",children:[e.jsx(Mt,{size:12}),e.jsx("span",{children:a.postCount||0}),e.jsx("div",{className:"stat-floating-tag",children:"Gönderi"})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:`stat-item ${s==="online"?"stat-tooltip-active":""}`,onClick:c=>q("online",c),title:"Çevrimiçi",children:[e.jsx("div",{className:"online-indicator-dot"}),e.jsx("span",{children:se}),e.jsx("div",{className:"stat-floating-tag",children:"Çevrimiçi"})]})]})]}),e.jsxs("div",{className:"portal-header-actions",children:[(p||G)&&e.jsx("button",{className:"portal-action-btn-circle",onClick:c=>{c.stopPropagation(),T&&T("notifications")},title:"Bildirim Ayarları",children:e.jsx(na,{size:16})}),p&&e.jsx("button",{className:"portal-action-btn-circle",onClick:c=>{c.stopPropagation(),$(!0)},title:"Davet Et",children:e.jsx(ms,{size:18})})]})]})]}),e.jsxs("div",{className:"cs-panel cs-panel--channels custom-scrollbar",children:[e.jsxs("div",{className:"cs-channels-header",children:[e.jsx("span",{children:"Kanallar"}),G&&e.jsx("div",{onClick:c=>{c.stopPropagation(),T&&T("channels")},className:"cs-add-channel-btn",title:"Kanal Oluştur",children:"+"})]}),e.jsx("div",{className:"cs-channel-list",children:Ne.map(c=>{var oe;const I=qe(c.id),ge=c.type==="announcement"||c.name.includes("announcements"),xe=c.type==="voice"||c.type==="conference";let be=N[String(c.id)]??0;return E&&String(E.channelId)===String(c.id)&&Array.isArray(_)&&(be=_.filter(ye=>!ye.isScreenSharing&&!String(ye.identity).endsWith("-screen")).length),e.jsxs("div",{className:`channel-item ${I?"active":""}`,onClick:()=>B(c.id),style:{padding:"6px 8px",margin:"2px 0",borderRadius:"4px",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",color:I?"white":"#949ba4",backgroundColor:I?"#3f4147":"transparent",transition:"background-color 0.15s ease, color 0.15s ease"},children:[e.jsx("div",{style:{color:I?"white":"var(--text-secondary)",display:"flex",alignItems:"center",minWidth:"20px",justifyContent:"center"},children:c.type==="conference"?e.jsx(us,{size:20,strokeWidth:2}):c.type==="voice"?e.jsx(ia,{size:20,strokeWidth:2}):ge?e.jsx(ra,{size:20,strokeWidth:2.5}):c.type==="image"?e.jsx(ps,{size:20,strokeWidth:2.5,style:{color:"#f59e0b"}}):e.jsx(la,{size:20,strokeWidth:2.5})}),e.jsx("span",{style:{fontWeight:I?600:500,fontSize:"16px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:I?"white":"var(--text-primary)",maxWidth:"fit-content"},children:c.name}),xe&&e.jsx("span",{className:`vc-channel-active-badge ${be>0?"online":"idle"}`,children:be>0?`${be} aktif`:"aktif yok"}),!I&&((oe=l[c.id])==null?void 0:oe.length)>0&&e.jsx("div",{style:{backgroundColor:"#f23f43",color:"white",fontSize:"11px",fontWeight:"bold",padding:"0 6px",borderRadius:"8px",minWidth:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.3)",marginLeft:"-4px",flexShrink:0},children:l[c.id].length>9?"9+":l[c.id].length}),e.jsx("div",{style:{flex:1}}),I&&xe&&E&&String(E.channelId)===String(c.id)&&S&&e.jsx("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:e.jsx(Da,{startedAt:S,className:"vc-sidebar-timer"})})]},c.id)})})]}),e.jsxs("div",{className:"cs-panel cs-panel--userbar",children:[e.jsx(Sa,{currentChannelId:b}),e.jsx("div",{className:"cs-footer-copyright",children:"© 2026 Oxypace. Tüm hakları saklıdır."})]})]}),e.jsx("style",{children:`
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
            .channel-banner-settings-btn {
                position: absolute;
                top: 8px;
                right: 8px;
                z-index: 5;
                width: 28px;
                height: 28px;
                border-radius: 0 !important;
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                border: none !important;
                color: #ffffff !important;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                padding: 0 !important;
                box-shadow: none !important;
                filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.85));
                transition: opacity 0.16s ease, transform 0.2s ease;
                opacity: 0.9;
            }
            .channel-banner-settings-btn:hover {
                background: transparent !important;
                background-image: none !important;
                border: none !important;
                opacity: 1;
                transform: rotate(22deg);
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
            `}),Y&&e.jsx(La,{portalId:a._id,onClose:()=>$(!1)})]}):null},qa=({members:a=[],onClose:p})=>{var M,H;const{onlineUsers:T}=Tt(),{user:b}=ut(),[,B]=i.useState(0);i.useEffect(()=>{const l=setInterval(()=>{B(h=>h+1)},6e4);return()=>clearInterval(l)},[]);const V=l=>{if(!l)return"";const h=new Date,S=new Date(l),E=Math.max(0,h-S),_=Math.floor(E/6e4);if(_<1)return"şimdi";if(_<60)return`${_}dk`;const R=Math.floor(_/60);if(R<24)return`${R}sa`;const F=Math.floor(R/24);if(F<30)return`${F}g`;const N=Math.floor(F/30);return N<12?`${N}ay`:`${Math.floor(N/12)}y`},G=l=>{if(!l)return null;if(typeof l=="string")return l;const h=l._id||l.id;return h?String(h):null},g=new Set((T||[]).map(l=>String(l))),A=b!=null&&b._id?String(b._id):null,Y=((H=(M=b==null?void 0:b.settings)==null?void 0:M.privacy)==null?void 0:H.showOnlineStatus)!==!1;A&&Y?g.add(A):A&&!Y&&g.delete(A);const $=l=>(l==null?void 0:l.role)==="owner"?3:(l==null?void 0:l.role)==="admin"||l!=null&&l.isAdmin?2:1,k=a.filter(l=>{if(!l)return!1;const h=G(l);return h&&g.has(h)}).sort((l,h)=>{var R,F;const S=$(h)-$(l);if(S!==0)return S;const E=((R=l.profile)==null?void 0:R.displayName)||l.username||"",_=((F=h.profile)==null?void 0:F.displayName)||h.username||"";return E.localeCompare(_)}),Z=a.filter(l=>{if(!l)return!1;const h=G(l);return h&&!g.has(h)}).sort((l,h)=>{var R,F;const S=$(h)-$(l);if(S!==0)return S;const E=((R=l.profile)==null?void 0:R.displayName)||l.username||"",_=((F=h.profile)==null?void 0:F.displayName)||h.username||"";return E.localeCompare(_)});return e.jsxs("div",{className:"members-sidebar custom-scrollbar",children:[e.jsxs("div",{className:"members-header-top",children:[e.jsx("h3",{children:"ÜYELER"}),p&&e.jsx("button",{onClick:p,className:"close-members-btn","aria-label":"Kapat",children:e.jsx(Xe,{size:20,strokeWidth:2})})]}),e.jsxs("div",{className:"members-category",children:["Çevrim içi — ",k.length]}),k.map((l,h)=>{var N,v,s,D;if(!l||typeof l=="string")return null;const S=l.username||"Unknown",E=((N=l.profile)==null?void 0:N.avatar)||l.avatar,_=((v=l.profile)==null?void 0:v.displayName)||S,R=l.role==="owner",F=l.role==="admin"||l.isAdmin;return e.jsxs(as,{to:`/profile/${S}`,className:"member-item member-link",children:[e.jsxs("div",{className:"member-avatar-wrapper",children:[E?e.jsx("img",{src:ve(E,"thumbnail"),alt:"",className:"member-avatar",loading:"eager",decoding:"async"}):e.jsx("div",{className:"member-avatar-placeholder",children:((s=_[0])==null?void 0:s.toUpperCase())||((D=S[0])==null?void 0:D.toUpperCase())||"?"}),e.jsx("div",{className:"status-indicator online"})]}),e.jsxs("div",{className:"member-info",style:{display:"flex",alignItems:"center",gap:"6px"},children:[e.jsxs("span",{className:"member-name active-role",style:{color:R?"#f1c40f":F?"#3498db":"#2ecc71"},children:[_,R&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!R&&F&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"})]}),e.jsx(ls,{user:l,size:13})]})]},l._id||l.id||h)}),e.jsxs("div",{className:"members-category",children:["Çevrim dışı — ",Z.length]}),Z.map((l,h)=>{var N,v,s,D;if(!l||typeof l=="string")return null;const S=l.username||"Unknown",E=((N=l.profile)==null?void 0:N.avatar)||l.avatar,_=((v=l.profile)==null?void 0:v.displayName)||S,R=l.role==="owner",F=l.role==="admin"||l.isAdmin;return e.jsxs(as,{to:`/profile/${S}`,className:"member-item offline member-link",children:[e.jsx("div",{className:"member-avatar-wrapper",children:E?e.jsx("img",{src:ve(E,"thumbnail"),alt:"",className:"member-avatar",loading:"eager",decoding:"async"}):e.jsx("div",{className:"member-avatar-placeholder",style:{backgroundColor:"var(--bg-secondary)"},children:((s=_[0])==null?void 0:s.toUpperCase())||((D=S[0])==null?void 0:D.toUpperCase())||"?"})}),e.jsx("div",{className:"member-info",style:{flex:1},children:e.jsxs("div",{className:"member-name-row",style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("span",{className:"member-name",style:{display:"flex",alignItems:"center",gap:"4px"},children:[_,R&&e.jsx("span",{style:{marginLeft:"4px"},title:"Portal Sahibi",children:"👑"}),!R&&F&&e.jsx("span",{style:{marginLeft:"4px"},title:"Yönetici",children:"🛡️"}),e.jsx(ls,{user:l,size:13})]}),l.lastActive&&e.jsx("span",{className:"last-active-time",style:{fontSize:"11px",color:"var(--text-muted)"},children:V(l.lastActive)})]})})]},l._id||l.id||`offline-${h}`)}),e.jsx("style",{children:`
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
            `})]})},Ba=()=>{var M,H;const{user:a,updateUser:p}=ut(),T=It(),[b,B]=i.useState(null),[V,G]=i.useState([]),[g,A]=i.useState(!0),[Y,$]=i.useState(null);i.useEffect(()=>{let l=!0;return(async()=>{try{const S=await ce.get("/api/portals/showcase");l&&S.data&&(B(S.data.globalPortal||null),G(Array.isArray(S.data.topPortals)?S.data.topPortals:[]))}catch{}finally{l&&A(!1)}})(),()=>{l=!1}},[]);const k=async(l,h)=>{var S,E,_;if(l.stopPropagation(),!a){T("/login");return}if(h.isMember){T(`/portal/${h._id}`);return}if(!(h.isRequested||Y===h._id)){$(h._id);try{const F=((S=(await ce.post(`/api/portals/${h._id}/join`)).data)==null?void 0:S.status)==="requested",N=v=>!v||v._id!==h._id?v:{...v,isMember:!F,isRequested:F,memberCount:F?v.memberCount:(v.memberCount||0)+1};if((b==null?void 0:b._id)===h._id&&B(N(b)),G(v=>v.map(N)),!F&&a&&p){const v=a.joinedPortals||[];v.some(s=>(s._id||s).toString()===h._id.toString())||p({joinedPortals:[...v,h],portals:[...a.portals||[],h]})}}catch(R){alert(((_=(E=R.response)==null?void 0:E.data)==null?void 0:_.message)||"İşlem gerçekleştirilemedi.")}finally{$(null)}}},Z=l=>l!=null&&l.banner?`url(${ve(l.banner)}) center/cover no-repeat`:"#141414";return e.jsxs("div",{className:"tanitim-showcase-wrapper",children:[e.jsxs("section",{className:"tanitim-guide-card",children:[e.jsxs("div",{className:"tanitim-guide-header",children:[e.jsxs("div",{className:"tanitim-guide-tag",children:[e.jsx(oa,{size:13}),e.jsx("span",{children:"SİSTEM DİREKTİFİ // RESMİ PLATFORM REHBERİ"})]}),e.jsx("h1",{className:"tanitim-guide-title",children:"Oxypace İletişim Protokolü & Kullanım Mimarisi"}),e.jsx("p",{className:"tanitim-guide-lead",children:"Özgür, sansürsüz, yüksek performanslı ve gizlilik odaklı yeni nesil topluluk ekosistemi. Arayüz haritasını ve platformun tüm gelişmiş yeteneklerini aşağıdaki yönergelerden inceleyin."})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// NAVİGASYON VE MENÜ YERLEŞİMİ"}),e.jsx("h2",{className:"sub-section-title",children:"Sayfa Yapısı & Arayüz Konumlandırması"})]}),e.jsxs("div",{className:"tanitim-nav-map-grid",children:[e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(ca,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ SOL NAVİGASYON BARI ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Ana Gezinme Çubuğu"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Doğrudan Mesajlar (DM):"})," Birebir şifreli özel yazışmalar ve anlık bildirim kutusu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portallar Listesi:"})," Üye olduğunuz veya yönettiğiniz tüm portalların dikey simgeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Keşfet Pusulası:"})," Yeni toplulukları, popüler portalları ve kişileri arama alanı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Oluştur (+):"})," Saniyeler içinde kendi özgür topluluğunuzu kurma aracı."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kimlik & Hızlı Ayar:"})," En altta mikrofon, kulaklık ve profil hızlı kontrolleri."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(da,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ PORTAL İÇİ MENÜ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"Kanal Hiyerarşisi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Kimliği:"})," Özel afiş, doğrulanmış rozet ve çevrimiçi üye göstergeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Metin Kanalları (#):"})," Tematik konulara göre ayrılmış gönderi ve tartışma akışları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Ses Kanalları (🎙️):"})," Tek dokunuşla girilebilen, gecikmesiz canlı ses odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Sahne Kanalları (🎤):"})," Seminer, podcast ve etkinlikler için konuşmacı odaları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Yönetimi:"})," Yöneticiler için yeni kanallar açma ve gizlilik kilidi."]})]})]}),e.jsxs("div",{className:"nav-map-card",children:[e.jsxs("div",{className:"nav-map-header",children:[e.jsx(rs,{size:16}),e.jsx("span",{className:"nav-map-code",children:"[ ÜST DENETİM & AKIŞ ]"})]}),e.jsx("h3",{className:"nav-map-title",children:"İçerik & Üye Denetimi"}),e.jsxs("ul",{className:"nav-map-list",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Kanal Üst Başlığı:"})," Aktif kanal adı, açıklaması ve hızlı üye paneli butonu."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Üye Listesi Paneli:"})," Sağ tarafta çevrimiçi yöneticiler ve aktif üyeler."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Görsel Akış Alanı:"})," 4K videolar, çoklu galeriler ve doküman önizlemeleri."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Bildirim Zil İkonu:"})," Kanal ve portal bazlı bildirim filtreleme ayarları."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Portal Ayarları:"})," Portal sahibi ve yöneticileri için tam yönetim konsolu."]})]})]})]})]}),e.jsxs("div",{className:"tanitim-sub-section",children:[e.jsxs("div",{className:"sub-section-header",children:[e.jsx("span",{className:"sub-section-tag",children:"// GELİŞMİŞ SİSTEM DİREKLERİ"}),e.jsx("h2",{className:"sub-section-title",children:"Platform Mekanizmaları & Özellikler"})]}),e.jsxs("div",{className:"tanitim-pillars-grid",children:[e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"01"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(Mt,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Gelişmiş Mesaj Mekanizması"}),e.jsx("p",{className:"pillar-text",children:"Markdown formatlama, tek tıkla alıntılı yanıtlama (quote reply), kullanıcıyı doğrudan haberdar eden @etiketleme sistemi ve akıllı bağlantı (link preview) ayrıştırma desteği."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Alıntılı Yanıt"}),e.jsx("span",{className:"pillar-tag",children:"@Bahsetmeler"}),e.jsx("span",{className:"pillar-tag",children:"Mesaj Sabitleme"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"02"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(ma,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Canlı Ses Odaları & Sahne Modu"}),e.jsx("p",{className:"pillar-text",children:"Ultra düşük gecikmeli WebRTC ses mimarisi. Herkesin serbestçe katılabildiği sohbet odaları ile seminer ve konferanslar için konuşmacı-dinleyici ayrımı ve el kaldırma desteği sunan Sahne kanalları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Gecikme"}),e.jsx("span",{className:"pillar-tag",children:"Sahne Hiyerarşisi"}),e.jsx("span",{className:"pillar-tag",children:"Arka Planda Ses"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"03"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(ua,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Mobil Ekosistem & PIP Video"}),e.jsx("p",{className:"pillar-text",children:"Yerel Android APK ve tam uyumlu PWA deneyimi. Canlı FCM Push bildirimleri, mobil veri tasarrufu modu ve gezinirken köşede kesintisiz oynayan Kayan Resim İçinde Resim (PIP) video motoru."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Android APK / PWA"}),e.jsx("span",{className:"pillar-tag",children:"Canlı PIP Oynatıcı"}),e.jsx("span",{className:"pillar-tag",children:"FCM Push Bildirim"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"04"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(pa,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Ultra-HD Medya & Transcoding"}),e.jsx("p",{className:"pillar-text",children:"İstemci içi WASM motoru ile 360p'den 4K'ya kadar otomatik optimize edilen video akışı. Tek gönderide 10 adede kadar yüksek kaliteli fotoğraf galerisi ve tek tıkla önizlenebilir PDF dokümanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"4K Video Transcoding"}),e.jsx("span",{className:"pillar-tag",children:"10'lu Görsel Galerisi"}),e.jsx("span",{className:"pillar-tag",children:"PDF Doküman Desteği"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"05"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(rs,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Özelleştirilebilir Sistemler & Temalar"}),e.jsx("p",{className:"pillar-text",children:"Saf OLED siyahı ve yüksek kontrastlı Aydınlık tema desteği. Kişisel profil afişi, biyografi ve avatar özelleştirmeleri. Portallar için özel roller, izin matrisleri ve gizlilik kalkanları."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"OLED Siyah & Açık Tema"}),e.jsx("span",{className:"pillar-tag",children:"Rol & Yetki Matrisi"}),e.jsx("span",{className:"pillar-tag",children:"Özel Profil Afişi"})]})]}),e.jsxs("div",{className:"tanitim-pillar-item",children:[e.jsxs("div",{className:"pillar-header",children:[e.jsx("span",{className:"pillar-index",children:"06"}),e.jsx("div",{className:"pillar-icon-box",children:e.jsx(ha,{size:18})})]}),e.jsx("h3",{className:"pillar-title",children:"Kripto-Güvenlik & Sıfır Takip"}),e.jsx("p",{className:"pillar-text",children:"Sıfır veri madenciliği ve ticari profil koruması. IP ve aktif cihaz oturum denetimi, güvenlik anahtarları ile hesap kurtarma ve doğrulanmış resmi topluluk rozetleri."}),e.jsxs("div",{className:"pillar-features",children:[e.jsx("span",{className:"pillar-tag",children:"Sıfır Veri İzleme"}),e.jsx("span",{className:"pillar-tag",children:"Cihaz & Oturum Denetimi"}),e.jsx("span",{className:"pillar-tag",children:"Onay Rozetleri"})]})]})]})]})]}),b&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ MERKEZ TOPLULUK // 01 ]"}),e.jsx("span",{className:"section-badge",children:"EN POPÜLER PORTAL"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Oxypace Global"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"Platformun en geniş üye kitlesine sahip resmi ana iletişim merkezi."})]}),e.jsxs("div",{className:"oxypace-global-hero-card",onClick:()=>T(`/portal/${b._id}`),children:[e.jsxs("div",{className:"hero-card-banner",style:{background:Z(b)},children:[e.jsx("div",{className:"hero-banner-overlay"}),e.jsx("div",{className:"hero-banner-badge",children:e.jsx("span",{children:"ANA TOPLULUK"})})]}),e.jsxs("div",{className:"hero-card-body",children:[e.jsxs("div",{className:"hero-header-row",children:[e.jsx("div",{className:"hero-avatar-box",children:b.avatar?e.jsx("img",{src:ve(b.avatar),alt:b.name,className:"hero-avatar-img"}):e.jsx("div",{className:"hero-avatar-fallback",children:((H=(M=b.name)==null?void 0:M.substring(0,2))==null?void 0:H.toUpperCase())||"OG"})}),e.jsxs("div",{className:"hero-identity-col",children:[e.jsxs("div",{className:"hero-name-row",children:[e.jsx("h3",{className:"hero-portal-name",children:b.name}),e.jsx(At,{portal:b,size:18}),e.jsx("span",{className:"hero-privacy-tag",children:b.privacy==="private"?e.jsxs(e.Fragment,{children:[e.jsx(fa,{size:11})," GİZLİ"]}):e.jsxs(e.Fragment,{children:[e.jsx(ga,{size:11})," HERKESE AÇIK"]})})]}),e.jsx("div",{className:"hero-meta-row",children:e.jsxs("div",{className:"hero-member-stat",children:[e.jsx(zt,{size:14}),e.jsxs("span",{children:[(b.memberCount||0).toLocaleString("tr-TR")," Üye"]})]})})]}),e.jsx("div",{className:"hero-action-col",children:e.jsx("button",{type:"button",className:`tanitim-sharp-btn hero-btn ${b.isMember?"btn-joined":b.isRequested?"btn-requested":"btn-action"}`,onClick:l=>k(l,b),disabled:Y===b._id||b.isRequested,children:Y===b._id?"İŞLENİYOR...":b.isMember?e.jsxs(e.Fragment,{children:[e.jsx(dt,{size:14}),"ÜYESİNİZ"]}):b.isRequested?e.jsxs(e.Fragment,{children:[e.jsx(hs,{size:14}),"İSTEK GÖNDERİLDİ"]}):b.privacy==="private"?"ÜYELİK İSTEĞİ GÖNDER":"PORTALA KATIL"})})]}),e.jsx("p",{className:"hero-description",children:b.description||"Oxypace platformunun ana buluşma noktası. Güncel duyurular, teknik tartışmalar ve küresel topluluk etkileşimi."})]})]})]}),V.length>0&&e.jsxs("section",{className:"tanitim-section",children:[e.jsxs("div",{className:"tanitim-section-header",children:[e.jsxs("div",{className:"section-label-row",children:[e.jsx("span",{className:"section-code",children:"[ AKTİF TOPLULUKLAR // 02 ]"}),e.jsx("span",{className:"section-badge",children:"ÖNE ÇIKAN PORTALLAR"})]}),e.jsx("h2",{className:"tanitim-section-title",children:"Popüler Topluluklar"}),e.jsx("p",{className:"tanitim-section-subtitle",children:"En çok paylaşıma ve aktif etkileşime sahip seçkin portallar."})]}),e.jsx("div",{className:"tanitim-portals-row",children:V.map(l=>{var h,S;return e.jsxs("div",{className:"tanitim-classic-card",onClick:()=>T(`/portal/${l._id}`),children:[e.jsx("div",{className:"classic-card-banner",style:{background:Z(l)},children:e.jsx("div",{className:"classic-banner-overlay"})}),e.jsx("div",{className:"classic-card-icon-wrapper",children:l.avatar?e.jsx("img",{src:ve(l.avatar),alt:l.name,className:"classic-card-icon-img",loading:"lazy"}):e.jsx("div",{className:"classic-card-icon-placeholder",children:((S=(h=l.name)==null?void 0:h.substring(0,2))==null?void 0:S.toUpperCase())||"P"})}),e.jsxs("div",{className:"classic-card-body",children:[e.jsxs("div",{className:"classic-card-title-row",children:[e.jsx("h4",{className:"classic-card-title",children:l.name}),e.jsx(At,{portal:l,size:16})]}),e.jsx("p",{className:"classic-card-desc",children:l.description||"Bu topluluk hakkında henüz bir açıklama girilmemiş."}),e.jsxs("div",{className:"classic-card-footer",children:[e.jsxs("div",{className:"classic-member-count",children:[e.jsx(zt,{size:12}),e.jsxs("span",{children:[l.memberCount||0," Üye"]})]}),e.jsx("button",{type:"button",className:`tanitim-sharp-btn small-btn ${l.isMember?"btn-joined":l.isRequested?"btn-requested":"btn-action"}`,onClick:E=>k(E,l),disabled:Y===l._id||l.isRequested,children:Y===l._id?"...":l.isMember?"ÜYESİNİZ":l.isRequested?"İSTEK":l.privacy==="private"?"İSTEK AT":"KATIL"})]})]})]},l._id)})})]})]})},Fa=({alerts:a=[]})=>{const[p,T]=i.useState(()=>{try{const A=sessionStorage.getItem("dismissed_portal_alerts");return A?JSON.parse(A):[]}catch{return[]}}),[b,B]=i.useState(null),V=a.filter(A=>!p.includes(A._id)),G=A=>{B(A),setTimeout(()=>{const Y=[...p,A];T(Y);try{sessionStorage.setItem("dismissed_portal_alerts",JSON.stringify(Y))}catch{}B(null)},300)},g=A=>{const Y=new Date,k=new Date(A)-Y;if(k<=0)return null;const Z=Math.floor(k/(1e3*60*60*24)),M=Math.floor(k/(1e3*60*60)%24),H=Math.floor(k/(1e3*60)%60);return Z>0?`${Z} gün ${M} saat kaldı`:M>0?`${M} saat ${H} dk kaldı`:`${H} dakika kaldı`};return V.length===0?null:e.jsx(e.Fragment,{children:V.map(A=>e.jsx("div",{className:`portal-alert-banner ${b===A._id?"dismissing":""}`,children:e.jsxs("div",{className:"alert-banner-inner",children:[e.jsx("div",{className:"alert-banner-icon",children:e.jsx(xa,{size:18,strokeWidth:2})}),e.jsxs("div",{className:"alert-banner-content",children:[e.jsx("div",{className:"alert-banner-label",children:e.jsx("span",{children:"Yönetici Uyarısı"})}),e.jsx("div",{className:"alert-banner-message",children:A.message}),e.jsx("div",{className:"alert-banner-meta",children:e.jsxs("span",{className:"alert-banner-time",children:[e.jsx(hs,{size:16,strokeWidth:2}),g(A.expiresAt)||"Süresi dolmak üzere"]})})]}),e.jsx("button",{className:"alert-banner-close",onClick:()=>G(A._id),title:"Uyarıyı gizle",children:e.jsx(Xe,{size:16,strokeWidth:2.5})})]})},A._id))})},Ua=i.lazy(()=>mt(()=>import("./PortalSettingsModal-zTb4tRZS.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]))),Ka=i.lazy(()=>mt(()=>import("./PortalNotifications-DFzg5GZR.js"),__vite__mapDeps([16,1,2,3,4,5,6,17]))),Oa=i.lazy(()=>mt(()=>import("./VoiceChannel-CY4ziDi8.js"),__vite__mapDeps([18,1,4,2,3,5,6,19,20]))),Wa=i.lazy(()=>mt(()=>import("./ConferenceChannel-PZLmJtUU.js"),__vite__mapDeps([21,1,4,2,3,5,6,19,20]))),vn=()=>{var Zt,Qt,Xt,es,ts,ss;const{id:a}=qs(),p=Bs(),[T,b]=Fs(),B=T.get("channel"),V=T.get("post"),G=i.useRef(null),{user:g,token:A,updateUser:Y,loading:$}=ut(),{socket:k,connected:Z}=Tt(),M=It(),H=ds(),{isSidebarOpen:l,closeSidebar:h,isMobileView:S,mobileChannelOpen:E,setMobileChannelOpen:_}=H||{},{activeRoom:R}=Et(),F=i.useRef(!1),N=(H==null?void 0:H.isDesktopSidebarCollapsed)||!1,v=typeof window<"u"&&!!localStorage.getItem("admin_backup_token"),[s,D]=i.useState(()=>{var t;try{const n=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(n){const r=JSON.parse(n);if(Array.isArray(r==null?void 0:r.channels)&&r.channels.length>0)return r}}catch{}return(t=p==null?void 0:p.state)!=null&&t.portal&&(String(p.state.portal._id)===String(a)||String(p.state.portal.id)===String(a))&&Array.isArray(p.state.portal.channels)&&p.state.portal.channels.length>0?p.state.portal:null});i.useEffect(()=>{var t;(t=p==null?void 0:p.state)!=null&&t.portal&&(String(p.state.portal._id)===String(a)||String(p.state.portal.id)===String(a))&&D(n=>Array.isArray(p.state.portal.channels)&&p.state.portal.channels.length>0?p.state.portal:n&&Array.isArray(n.channels)&&n.channels.length>0?{...p.state.portal,channels:n.channels,roles:n.roles||p.state.portal.roles,members:n.members||p.state.portal.members}:n||null)},[a,p.state]);const K=Qe(t=>t.posts),q=Qe(t=>t.setPosts),[je,ie]=i.useState(()=>{var t;try{const n=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(n){const r=JSON.parse(n);if(Array.isArray(r==null?void 0:r.channels)&&r.channels.length>0)return!1}}catch{}return!((t=p==null?void 0:p.state)!=null&&t.portal&&(String(p.state.portal._id)===String(a)||String(p.state.portal.id)===String(a))&&Array.isArray(p.state.portal.channels)&&p.state.portal.channels.length>0)}),[$e,Ae]=i.useState(!1),[de,re]=i.useState(""),[se,pt]=i.useState(null),[Ne,he]=i.useState(null),[Ie,qe]=i.useState(!1),[w,X]=i.useState(null),[ht,fe]=i.useState({}),[et,we]=i.useState(!1),[le,Ee]=i.useState(""),[me,c]=i.useState([]);i.useRef(null);const[I,ge]=i.useState(!1),[xe,be]=i.useState(!1),[oe,ye]=i.useState({show:!1,message:"",type:"info"}),[_e,Te]=i.useState(!1),[Ce,te]=i.useState(!1),[Rt,Lt]=i.useState({top:0,left:0}),Dt=i.useRef(null),[ke,Me]=i.useState([]),[$t,qt]=i.useState(!1),[Bt,Ft]=i.useState(!1),[Ut,Kt]=i.useState(!1),[ae,Be]=i.useState(null),[fs,ft]=i.useState(0),[Fe,gt]=i.useState(!1),Ot=i.useMemo(()=>Aa(le),[le]);Gs();const Se=ns(t=>t.activeUploads)[`portal-${a}`];i.useEffect(()=>{Se&&Se.status==="uploading"&&q(t=>t.map(n=>n.isOptimistic&&(n.mediaType==="video"||n.mediaType==="mixed")?{...n,uploadProgress:Se.progress}:n))},[Se==null?void 0:Se.progress,Se==null?void 0:Se.status]);const[gs,tt]=i.useState(!1),Pe=!!(s!=null&&s.name&&/Oxypace Tan[ıi]t[ıi]m/i.test(s.name)),xs=!!(g&&(((Zt=g.username)==null?void 0:Zt.toLowerCase())==="oxypace"||g.isAdmin)),Ue=Pe?xs:g&&Ie,bs=i.useRef(null),Ke=i.useRef(null),ys=i.useCallback(t=>{t.preventDefault(),t.stopPropagation(),te(n=>{if(!n&&Ke.current){const r=Ke.current.getBoundingClientRect();Lt({top:r.bottom+8,left:r.left})}return!n})},[]);i.useEffect(()=>{if(!Ce)return;let t=!0;const n=()=>{if(Ke.current){const j=Ke.current.getBoundingClientRect();Lt({top:j.bottom+8,left:j.left})}},r=j=>{if(!t)return;const o=j.target.closest(".plus-menu")||j.target.closest(".portal-plus-menu-portal"),u=j.target.closest(".upload-btn");!o&&!u&&te(!1)},d=setTimeout(()=>{t&&(document.addEventListener("click",r),document.addEventListener("touchstart",r))},0);return window.addEventListener("scroll",n,!0),window.addEventListener("resize",n),()=>{t=!1,clearTimeout(d),document.removeEventListener("click",r),document.removeEventListener("touchstart",r),window.removeEventListener("scroll",n,!0),window.removeEventListener("resize",n)}},[Ce]),i.useEffect(()=>()=>{te(!1)},[]),i.useEffect(()=>{te(!1)},[w,a]),i.useEffect(()=>{var t;(t=p.state)!=null&&t.quotedPost&&(Be(p.state.quotedPost),p.state.selectedChannelId&&X(p.state.selectedChannelId),h&&h(),_&&_(!0),M(p.pathname+p.search,{replace:!0,state:{}}))},[p.state,a]),i.useEffect(()=>{let t=!0;const n=async()=>{var u;const d=window.__oxypacePendingChannelShare;if(!d||!d.payload||d.portalId&&String(d.portalId)!==String(a))return;window.__oxypacePendingChannelShare=null;const j=d.payload;d.channelId&&X(d.channelId),h&&h(),_&&_(!0);const o=(j.text||j.subject||"").trim();if(o&&t&&Ee(f=>f?`${f}
${o}`:o),Array.isArray(j.files)&&j.files.length>0){const f=[];for(const x of j.files)try{let C=null;if(x.base64){const m=atob(x.base64),P=new Array(m.length);for(let z=0;z<m.length;z++)P[z]=m.charCodeAt(z);const U=new Uint8Array(P);C=new Blob([U],{type:x.mimeType||"application/octet-stream"})}else if(x.path&&window.Capacitor){const m=window.Capacitor.convertFileSrc(x.path);C=await(await fetch(m)).blob()}if(C){const m=new File([C],x.name||"shared_file",{type:x.mimeType||C.type||"application/octet-stream"});f.push(m)}}catch{}f.length>0&&t&&(Me(x=>{const{nextDrafts:C,warnings:m}=cs(x,f);return m.length>0&&ne(m[0],"warning"),C}),te(!1))}else o&&t&&te(!1);(u=p.state)!=null&&u.sharedTrigger&&M(p.pathname+p.search,{replace:!0,state:{}})};n();const r=()=>{n()};return window.addEventListener("oxypace:apply_shared_to_channel",r),()=>{t=!1,window.removeEventListener("oxypace:apply_shared_to_channel",r)}},[a,(Qt=p.state)==null?void 0:Qt.sharedTrigger]);const O=(Xt=s==null?void 0:s.channels)==null?void 0:Xt.find(t=>String(t._id)===String(w)),Re=(O==null?void 0:O.type)==="image",st=(O==null?void 0:O.type)==="voice"||(O==null?void 0:O.type)==="conference",Oe=st&&(!S||E);i.useEffect(()=>{s!=null&&s.channels&&Array.isArray(s.channels)&&fe(t=>{const n={...t};return s.channels.forEach(r=>{const d=String(r._id);r.postCount!==void 0&&(n[d]=r.postCount)}),n})},[s==null?void 0:s.channels]),i.useEffect(()=>{if(!k||!Z||!a)return;k.emit("join_portal",a),k.emit("get_online_users"),w&&k.emit("join_channel",w);const t=o=>{var P,U,z,W,ue;const u=((P=o.portal)==null?void 0:P._id)||o.portal,f=((U=o.channel)==null?void 0:U._id)||o.channel,x=String(u)===String(a),C=((z=s==null?void 0:s.channels)==null?void 0:z.length)===1,m=String(f)===String(w)||String(f||"general")===String(w||"general")||C||O&&(String(f)===String(O.name)||String(f)===String(O._id));if(x&&m){const ee=((W=o.author)==null?void 0:W._id)||((ue=o.author)==null?void 0:ue.id)||o.author;if(String(ee)!==String(g==null?void 0:g._id)){const L=String(w);fe(Q=>({...Q,[L]:(Q[L]!==void 0?Q[L]:(O==null?void 0:O.postCount)||0)+1}))}q(L=>{if(L.some(pe=>pe._id===o._id))return L;const Q=o.quotedPost&&(typeof o.quotedPost=="string"?o.quotedPost:o.quotedPost._id);if(Q){const pe=L.find(y=>y._id===Q);pe&&typeof pe=="object"&&pe.author?o.quotedPost=pe:ae&&Q===ae._id&&(o.quotedPost=ae)}return[o,...L]})}},n=o=>{var x;const u=((x=o.portal)==null?void 0:x._id)||o.portal;(!u||String(u)===String(a))&&q(C=>C.map(m=>String(m._id)===String(o._id)?o:m))},r=({postId:o,portalId:u})=>{(!u||String(u)===String(a))&&o&&q(f=>f.filter(x=>String(x._id)!==String(o)))},d=({userId:o,status:u,lastActive:f})=>{u==="offline"&&c(x=>x.filter(C=>String(C.userId)!==String(o))),D(x=>{if(!x)return x;const C=f||new Date;let m=x.owner;if(x.owner){const z=x.owner._id||x.owner.id||x.owner;String(z)===String(o)&&typeof x.owner=="object"&&(m={...x.owner,lastActive:C})}let P=x.admins;Array.isArray(x.admins)&&(P=x.admins.map(z=>{const W=z._id||z.id||z;return String(W)===String(o)&&typeof z=="object"&&z!==null?{...z,lastActive:C}:z}));let U=x.members;return Array.isArray(x.members)&&(U=x.members.map(z=>{const W=z._id||z.id||z;return String(W)===String(o)&&typeof z=="object"&&z!==null?{...z,lastActive:C}:z})),{...x,owner:m,admins:P,members:U}})},j=({userId:o,username:u,displayName:f,avatar:x,isTyping:C})=>{String(o)!==String(g==null?void 0:g._id)&&c(m=>C?m.some(P=>String(P.userId)===String(o))?m:[...m,{userId:o,username:u,displayName:f,avatar:x}]:m.filter(P=>String(P.userId)!==String(o)))};return k.on("post:created",t),k.on("post:updated",n),k.on("post:deleted",r),k.on("user_status_change",d),k.on("portal_typing_update",j),()=>{k.off("post:created",t),k.off("post:updated",n),k.off("post:deleted",r),k.off("user_status_change",d),k.off("portal_typing_update",j)}},[k,Z,a,w,g==null?void 0:g._id]);const[vs,at]=i.useState(!1),[js,ks]=i.useState(0),xt=i.useRef(null),bt=i.useRef(null),We=i.useRef(null),Ss=i.useCallback(t=>{const n=t.target;bt.current||(bt.current=requestAnimationFrame(()=>{bt.current=null;const r=n.scrollTop,d=r>300;at(o=>o!==d?d:o);const j=n.scrollHeight-n.clientHeight;if(j>0){const o=Math.round(r/j*100);ks(u=>Math.abs(u-o)>=2?o:u)}}))},[]),yt=i.useCallback(t=>{t&&(t.preventDefault(),t.stopPropagation()),We.current&&cancelAnimationFrame(We.current);const n=xt.current||document.querySelector(".discord-feed")||document.querySelector(".portal-feed-container");if(!n){window.scrollTo({top:0,behavior:"smooth"});return}const r=n.scrollTop;if(r<=0)return;const d=800,j=performance.now(),o=f=>1-Math.pow(1-f,5),u=f=>{const x=f-j,C=Math.min(x/d,1),m=o(C);n.scrollTop=Math.round(r*(1-m)),C<1?We.current=requestAnimationFrame(u):(n.scrollTop=0,We.current=null)};We.current=requestAnimationFrame(u)},[]);i.useEffect(()=>{const t=()=>{yt(),(!s||!Array.isArray(s.channels)||s.channels.length===0)&&Ve()};return window.addEventListener("oxypace:scroll_portal_top",t),()=>window.removeEventListener("oxypace:scroll_portal_top",t)},[yt,s==null?void 0:s._id,(es=s==null?void 0:s.channels)==null?void 0:es.length]);const vt=i.useCallback(()=>{if(T.has("channel")||T.has("joinVoice")){const t=new URLSearchParams(T);t.delete("channel"),t.delete("joinVoice"),b(t,{replace:!0})}},[T,b]),nt=i.useCallback(()=>{F.current=!0,vt(),_&&_(!1)},[vt,_]),Ns=t=>{F.current=!1,vt(),X(t),at(!1),S&&(h(),_(!0))};i.useEffect(()=>{const t=!!(st&&R&&String(R.portalId)===String(a)&&String(R.channelId)===String(w)),n=()=>{!(document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement||document.msFullscreenElement)&&t&&!F.current&&(h==null||h(),_==null||_(!0))};return document.addEventListener("fullscreenchange",n),document.addEventListener("webkitfullscreenchange",n),()=>{document.removeEventListener("fullscreenchange",n),document.removeEventListener("webkitfullscreenchange",n)}},[st,R,a,w,h,_]);const ne=i.useCallback((t,n="info")=>{ye({show:!0,message:t,type:n}),setTimeout(()=>ye(r=>({...r,show:!1})),4e3)},[]),Le=i.useCallback((t,n={})=>{!t||t.length===0||Me(r=>{const{nextDrafts:d,warnings:j}=cs(r,t,{extra:n,imagesOnly:Re});return j.length>0&&ne(j[0],"warning"),d})},[Re,ne]),ws=t=>{const n=Array.from(t.target.files||[]);t.target.value="",n.length!==0&&(Le(n),te(!1))},_s=t=>{t&&Le([t])},Cs=(t,n={})=>{t&&Le([t],n)},Ps=t=>{!t||t.length===0||Le(t)},zs=t=>{try{const n=Ra(t);if(!n)return;Me(r=>r.length>=15?(Je(n),ne("Bir gönderiye en fazla 15 dosya veya içerik eklenebilir.","warning"),r):[...r,n])}catch(n){ne((n==null?void 0:n.message)||"Klasör eklenemedi.","error")}},As=t=>{Me(n=>{const r=n.find(d=>d.id===t);return r&&Je(r),n.filter(d=>d.id!==t)})},Is=()=>{Me(t=>(t.forEach(Je),[]))},jt=i.useCallback(t=>{if(!Ue||v||Pe||Fe||t.defaultPrevented)return;const n=Ia(t.clipboardData);n.length>0&&(t.preventDefault(),t.stopPropagation(),Le(n),te(!1))},[Le,Ue,v,Pe,Fe]);i.useEffect(()=>{if(!Ue||v||Pe||Oe)return;const t=n=>{var d;if(n.defaultPrevented)return;const r=document.activeElement;r&&(r.tagName==="INPUT"||r.tagName==="TEXTAREA"||r.isContentEditable)&&!((d=r.closest)!=null&&d.call(r,".channel-input-area"))||jt(n)};return window.addEventListener("paste",t),()=>window.removeEventListener("paste",t)},[Ue,jt,v,Pe,Oe]);const Es=async()=>{if(te(!1),Fe)return;const{files:t,error:n}=await Ea();t.length>0?Le(t):n&&ne(n,"warning")};i.useEffect(()=>{v||!k||!a||(le.trim().length>0||ke.length>0?I||(ge(!0),k.emit("portal_typing",{portalId:a,isTyping:!0})):I&&(k.emit("portal_typing",{portalId:a,isTyping:!1}),ge(!1)))},[le,ke,a,k,I,v]),i.useEffect(()=>()=>{!v&&k&&a&&I&&k.emit("portal_typing",{portalId:a,isTyping:!1})},[a,k,I,v]);const Wt=async()=>{var u,f,x,C;if(v){ne("Hayalet Modu: Salt okunur izleme modundasınız. Gönderi paylaşılamaz.","error");return}const t=le.trim().length>0,n=ke.length>0;if(!t&&!n)return;k&&a&&k.emit("portal_typing",{portalId:a,isTyping:!1}),ge(!1);const r={content:le,drafts:[...ke],detectedYouTube:Ot,quotedPost:ae},d=`temp-${Date.now()}`,j=Ta(r.drafts,r.detectedYouTube),o={_id:d,content:r.content,media:j.media,mediaType:j.mediaType||"none",attachments:j.attachments||[],author:g,createdAt:new Date().toISOString(),likes:[],likeCount:0,isOptimistic:!0,quotedPost:r.quotedPost,isProcessing:j.isVideoUpload,processingProgress:0,estimatedTime:j.isVideoUpload?"Hesaplanıyor...":""};if(q(m=>[o,...m]),w){const m=String(w);fe(P=>({...P,[m]:(P[m]!==void 0?P[m]:(O==null?void 0:O.postCount)||0)+1}))}Ee(""),Me([]),te(!1),gt(!0),ft(0);try{const m=await Ma({drafts:r.drafts,uploadFileFn:Vs,targetId:a,hasAutoYouTube:!!r.detectedYouTube,onProgress:W=>{ft(W),q(ue=>ue.map(ee=>String(ee._id)===String(d)?{...ee,uploadProgress:W}:ee))}});if(m.mode==="video"){ns.getState().startVideoUpload({file:m.primaryVideoFile,portalId:a,channel:w,content:r.content,quotedPostId:(u=r.quotedPost)==null?void 0:u._id,extraAttachments:m.extraAttachments,onFinish:(W,ue)=>{if(r.drafts.forEach(Je),W){if(q(ee=>ee.filter(L=>String(L._id)!==String(d))),w){const ee=String(w);fe(L=>({...L,[ee]:Math.max(0,(L[ee]||1)-1)}))}ne("Video yükleme başarısız oldu.","error")}else if(ue){const ee=String(d);q(L=>{const Q=String(ue._id);return L.some(y=>String(y._id)===Q)?L.filter(y=>String(y._id)!==ee):L.map(y=>{if(String(y._id)===ee){const J=ue,ze=J.quotedPost&&(typeof J.quotedPost=="string"?J.quotedPost:J.quotedPost._id);return ze&&y.quotedPost&&ze===y.quotedPost._id&&(J.quotedPost=y.quotedPost),J}return y})})}}}),gt(!1),Be(null);return}const P={content:r.content,portalId:a,channel:w,quotedPostId:(f=r.quotedPost)==null?void 0:f._id,...m.payloadFields},U=await ce.post("/api/posts",P);Be(null),r.drafts.forEach(Je);const z=String(d);q(W=>{const ue=String(U.data._id);return W.some(L=>String(L._id)===ue)?W.filter(L=>String(L._id)!==z):W.map(L=>{if(String(L._id)===z){const Q=U.data,pe=Q.quotedPost&&(typeof Q.quotedPost=="string"?Q.quotedPost:Q.quotedPost._id);return pe&&L.quotedPost&&pe===L.quotedPost._id&&(Q.quotedPost=L.quotedPost),Q}return L})})}catch(m){const P=((C=(x=m.response)==null?void 0:x.data)==null?void 0:C.message)||m.message;if(ne(P,"error"),q(U=>U.filter(z=>String(z._id)!==String(d))),w){const U=String(w);fe(z=>({...z,[U]:Math.max(0,(z[U]||1)-1)}))}Ee(r.content),Me(r.drafts),Be(r.quotedPost||null)}finally{gt(!1),ft(0)}},[kt,De]=i.useState(!1),[St,it]=i.useState("overview"),[Ga,Ya]=i.useState(!1),[Ha,Ts]=i.useState({name:"",description:"",privacy:"public"});i.useRef(null),i.useRef(null);const rt=i.useRef(!1);i.useEffect(()=>{a&&!$&&Ve()},[a,$]),i.useEffect(()=>{a&&!$&&!rt.current&&(!s||!Array.isArray(s.channels)||s.channels.length===0||String(s._id)!==String(a))&&Ve()},[a,$,s==null?void 0:s._id,(ts=s==null?void 0:s.channels)==null?void 0:ts.length]),i.useEffect(()=>{T.get("openSettings")==="true"&&(it("overview"),De(!0))},[T]),i.useEffect(()=>{if(s&&s._id&&s.name)try{const t=localStorage.getItem("oxypace_portal_visits"),n=t?JSON.parse(t):{},r=String(s._id),d=n[r]||{count:0};n[r]={id:r,name:s.name,avatar:s.avatar,count:(d.count||0)+1,lastVisited:Date.now()},localStorage.setItem("oxypace_portal_visits",JSON.stringify(n));let j=0,o=null;Object.values(n).forEach(u=>{u.count>j&&(j=u.count,o=u)}),o&&localStorage.setItem("oxypace_top_portal",JSON.stringify({id:o.id,name:o.name}))}catch{}},[s==null?void 0:s._id,s==null?void 0:s.name]),i.useEffect(()=>{if(!$&&s&&String(s._id)===String(a)&&s.channels&&s.channels.length>0)if(w){if(B&&G.current!==String(B)){const n=s.channels.find(r=>String(r._id)===String(B));if(n){G.current=String(B),String(n._id)!==String(w)&&X(n._id);return}}if(!s.channels.some(n=>String(n._id)===String(w))){const n=s.channels[0];n&&X(n._id)}}else{if(B){const n=s.channels.find(r=>String(r._id)===String(B));if(n){G.current=String(B),X(n._id);return}}const t=s.channels[0];t&&X(t._id)}},[s,$,B,a,w]),i.useEffect(()=>{const t=n=>{const{portalId:r,channelId:d}=n.detail||{};(!r||String(r)===String(a))&&d&&(X(d),at(!1),_&&_(!0))};return window.addEventListener("oxypace:switch_channel",t),()=>window.removeEventListener("oxypace:switch_channel",t)},[a,_]),i.useLayoutEffect(()=>{const t=!!B||T.get("joinVoice")==="true";_&&t&&_(!0)},[a,B,T,_]),i.useEffect(()=>{a&&w&&s&&_t(s._id,a)&&Ye()},[a,w,s==null?void 0:s._id]),i.useEffect(()=>(a&&w&&(!S||E||!!B)?(Pt(a,w),Ks(a,w),Qe.getState().clearUnreadForChannel(w,a)):Pt(null,null),()=>{Pt(null,null)}),[a,w,S,E,B]),i.useEffect(()=>{if(V&&!et&&!$e&&Array.isArray(K)&&K.length>0){const t=document.getElementById(`post-${V}`);t&&setTimeout(()=>{t.scrollIntoView({behavior:"smooth",block:"center"}),t.classList.add("highlight-post"),setTimeout(()=>t.classList.remove("highlight-post"),2e3),we(!0)},100)}},[V,K,$e,et]),i.useEffect(()=>{var t,n;if(s&&g){const r=((t=s.members)==null?void 0:t.includes(g._id))||((n=g.joinedPortals)==null?void 0:n.some(d=>d._id===s._id||d===s._id));qe(!!r)}},[s,g]);const Ve=async()=>{var r,d,j,o;if(rt.current)return;rt.current=!0,re("");let t=null;try{const u=sessionStorage.getItem(`oxypace_portal_cache_${a}`)||localStorage.getItem(`oxypace_portal_cache_${a}`);if(u){const f=JSON.parse(u);f&&String(f._id)===String(a)&&Array.isArray(f.channels)&&f.channels.length>0&&(t=f)}}catch{}(!s||String(s._id)!==String(a)||!Array.isArray(s.channels)||s.channels.length===0)&&(t?(D(t),ie(!1)):ie(!0),at(!1));let n=null;for(let u=0;u<3;u++)try{const f=await ce.get(`/api/portals/${a}`);D(f.data);try{const m=JSON.stringify(f.data);sessionStorage.setItem(`oxypace_portal_cache_${a}`,m),localStorage.setItem(`oxypace_portal_cache_${a}`,m)}catch{}(r=f.data)!=null&&r.avatar&&is(f.data.avatar,"original");const x=((d=f.data)==null?void 0:d.coverImage)||((j=f.data)==null?void 0:j.banner);x&&is(x,"original");const C=[f.data.owner,...f.data.admins||[],...f.data.members||[]].filter(Boolean);Os(C),Ts({name:f.data.name,description:f.data.description||"",privacy:f.data.privacy||"public"}),re(""),n=null;break}catch(f){n=f;const x=(o=f.response)==null?void 0:o.status;if(x===403||x===404)break;u<2&&await new Promise(C=>setTimeout(C,1200*(u+1)))}if(n)if(n.response&&n.response.status===403){const u=n.response.data||{};u.portalStatus==="suspended"||u.portalStatus==="closed"?(pt({portalStatus:u.portalStatus,statusReason:u.statusReason,suspendedUntil:u.suspendedUntil,portalName:u.portalName,portalAvatar:u.portalAvatar}),re("suspended")):re("blocked")}else n.response&&n.response.status===404?re("blocked"):!t&&(!s||String(s._id)!==String(a))&&re("Portal yüklenemedi");rt.current=!1,ie(!1)},lt=i.useRef(null),Vt=i.useRef(K);Vt.current=K;const Ge=i.useRef(w);Ge.current=w;const Ye=i.useCallback(async(t=!1)=>{var d,j;const n=Ge.current,r=`portal_posts_${a}_${n}`;if(t)Yt(!0);else{lt.current&&lt.current.abort(),lt.current=new AbortController;let o=!1;try{const u=localStorage.getItem(r)||sessionStorage.getItem(r);if(u){const f=JSON.parse(u);Array.isArray(f)&&f.length>0&&(q(f),Ae(!1),o=!0)}}catch{}o||(Ae(!0),q([])),Nt(!0)}try{const o=localStorage.getItem("token"),u={signal:(d=lt.current)==null?void 0:d.signal,...o&&{headers:{Authorization:`Bearer ${o}`}}};if(t&&n!==Ge.current)return;let f=`/api/portals/${a}/posts?channel=${n}&limit=10`;const x=Vt.current;if(t&&x.length>0){const P=x[x.length-1];f+=`&before=${P.createdAt}`}const C=await ce.get(f,u),m=C.data;if(C.headers&&C.headers["x-total-count"]!==void 0){const P=parseInt(C.headers["x-total-count"],10);isNaN(P)||fe(U=>({...U,[String(n)]:P}))}if(m.length<10&&Nt(!1),t)q(P=>{const U=new Set(P.map(W=>W._id)),z=m.filter(W=>!U.has(W._id));return[...P,...z]});else{q(m);try{localStorage.setItem(r,JSON.stringify(m.slice(0,20)))}catch{try{sessionStorage.setItem(r,JSON.stringify(m.slice(0,15)))}catch{}}}re("")}catch(o){if(ce.isCancel(o))return;((j=o.response)==null?void 0:j.status)===403?re("private"):re("Gönderiler yüklenemedi")}finally{t||Ae(!1),Yt(!1),ie(!1)}},[a]),[Gt,Nt]=i.useState(!0),[wt,Yt]=i.useState(!1),ot=i.useRef(),Ms=i.useCallback(t=>{wt||(ot.current&&ot.current.disconnect(),ot.current=new IntersectionObserver(n=>{n[0].isIntersecting&&Gt&&Ye(!0)},{root:xt.current,rootMargin:"200px"}),t&&ot.current.observe(t))},[wt,Gt,Ye]);i.useEffect(()=>{q([]),Nt(!0),X(null),D(null),re(""),_(!1)},[a]);const Rs=i.useCallback(t=>{q(r=>r.filter(d=>String(d._id)!==String(t)));const n=Ge.current;n&&fe(r=>({...r,[String(n)]:Math.max(0,(r[String(n)]||1)-1)}))},[q]),Ls=i.useCallback((t,n)=>{if(n){q(d=>d.filter(j=>String(j._id)!==String(t)));const r=Ge.current;r&&fe(d=>({...d,[String(r)]:Math.max(0,(d[String(r)]||1)-1)}))}},[q]),Ds=i.useCallback(async t=>{try{const r=(await ce.put(`/api/posts/${t}/pin`)).data;q(d=>d.map(o=>o._id===t?r:o).sort((o,u)=>o.isPinned===u.isPinned?new Date(u.createdAt)-new Date(o.createdAt):o.isPinned?-1:1))}catch{ne("Sabitleme işlemi başarısız","error")}},[q,ne]),$s=async()=>{var t,n;if(!g){ne("Lütfen giriş yapın veya kaydolun!","warning");return}try{const r=localStorage.getItem("token"),d=r?{headers:{Authorization:`Bearer ${r}`}}:{};if((await ce.post(`/api/portals/${a}/join`,{},d)).data.status==="joined"){qe(!0);const o=Array.isArray(g==null?void 0:g.joinedPortals)?g.joinedPortals:[],u=Array.isArray(g==null?void 0:g.portals)?g.portals:[],f=[...o.filter(m=>{var P;return((P=(m==null?void 0:m._id)||m)==null?void 0:P.toString())!==a.toString()}),s],x=[...u.filter(m=>{var P;return((P=(m==null?void 0:m._id)||m)==null?void 0:P.toString())!==a.toString()}),s],C={...g,joinedPortals:f,portals:x};Y(C),D(m=>({...m,members:[...m.members||[],g._id]})),Ye(),ne("Portala başarıyla katıldınız!","success")}else ne("Üyelik isteğiniz gönderildi!","info"),D(o=>({...o,isRequested:!0}))}catch(r){ne(((n=(t=r.response)==null?void 0:t.data)==null?void 0:n.message)||"Katılma başarısız","error")}},_t=(t,n)=>{if(!t||!n)return!1;const r=typeof t=="object"?t.toString():t,d=typeof n=="object"?n.toString():n;return r===d},Ht=g&&s&&s.owner&&_t(s.owner._id||s.owner,g._id),Jt=Ht||g&&s&&s.admins&&s.admins.some(t=>_t(t._id||t,g._id));if(i.useEffect(()=>{if(!(se!=null&&se.suspendedUntil)){he(null);return}const t=()=>{const r=new Date,j=new Date(se.suspendedUntil)-r;if(j<=0){he(null),window.location.reload();return}he({days:Math.floor(j/(1e3*60*60*24)),hours:Math.floor(j/(1e3*60*60)%24),minutes:Math.floor(j/(1e3*60)%60),seconds:Math.floor(j/1e3%60)})};t();const n=setInterval(t,1e3);return()=>clearInterval(n)},[se]),!A&&!$)return e.jsx(Us,{to:"/",replace:!0});if(de==="suspended"&&se){const t=se.portalStatus==="suspended",n=se.suspendedUntil?new Date(se.suspendedUntil).toLocaleString("tr-TR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):null;return e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(He,{}),e.jsx("div",{className:"suspension-screen",children:e.jsxs("div",{className:"suspension-card",children:[e.jsx("div",{className:"suspension-icon",children:t?"⏸️":"🔒"}),e.jsx("h1",{className:"suspension-title",children:se.portalName||"Portal"}),e.jsx("h2",{className:"suspension-subtitle",children:t?"Bu portal geçici olarak askıya alındı":"Bu portal kapatılmıştır"}),se.statusReason&&e.jsxs("div",{className:"suspension-reason",children:[e.jsx("div",{className:"suspension-reason-label",children:"Sebep"}),e.jsx("p",{children:se.statusReason})]}),t&&n&&e.jsxs("div",{className:"suspension-unlock",children:[e.jsx("div",{className:"suspension-unlock-label",children:"🔓 Erişim Açılma Tarihi"}),e.jsx("div",{className:"suspension-unlock-date",children:n}),Ne&&e.jsxs("div",{className:"suspension-countdown",children:[e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(Ne.days).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Gün"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(Ne.hours).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saat"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(Ne.minutes).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Dakika"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(Ne.seconds).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saniye"})]})]})]}),e.jsxs("div",{className:"suspension-policy",children:[e.jsx("span",{children:"📋"}),e.jsxs("p",{children:["Askıya alma nedenleri, platformun ",e.jsx("strong",{children:"Politika ve Koşullar"}),"'ı kapsamında değerlendirilmektedir. Detaylı bilgi için kurallarımızı inceleyebilirsiniz."]})]}),e.jsx("button",{onClick:()=>M("/"),className:"suspension-home-btn",children:"Anasayfaya Dön"})]})})]})}return de&&de!=="suspended"?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(He,{}),e.jsxs("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center",flexDirection:"column",color:"var(--text-muted)"},children:[e.jsx("div",{style:{fontSize:"3rem",marginBottom:"1rem"},children:"🚫"}),e.jsx("h2",{children:de==="blocked"?"Sonuç Bulunamadı":"Bir Hata Oluştu"}),e.jsx("p",{children:de==="blocked"?"Aradığınız portala ulaşılamıyor.":de||"Portal yüklenirken bir sorun oluştu."}),e.jsx("button",{onClick:()=>M("/"),className:"btn-save",style:{marginTop:"20px",float:"none"},children:"Anasayfaya Dön"})]})]}):je||$||!s||!Array.isArray(s.channels)||s.channels.length===0?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(He,{}),e.jsx("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center"},children:e.jsx("div",{className:"spinner"})})]}):s.isNSFW&&!_e&&!sessionStorage.getItem(`nsfw_confirmed_${a}`)?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(He,{}),e.jsx("div",{className:"nsfw-gate-overlay",children:e.jsxs("div",{className:"nsfw-gate-card",children:[e.jsx("div",{className:"nsfw-gate-icon",children:e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]})}),e.jsx("div",{className:"nsfw-gate-badge",children:"+18"}),e.jsx("h1",{className:"nsfw-gate-title",children:"Yaş Kısıtlaması"}),e.jsxs("p",{className:"nsfw-gate-desc",children:[e.jsx("strong",{children:s.name})," portalı yetişkin içerik barındırabilir. Bu portala erişmek için 18 yaşından büyük olmanız gerekmektedir."]}),e.jsxs("div",{className:"nsfw-gate-actions",children:[e.jsx("button",{className:"nsfw-gate-confirm",onClick:()=>{sessionStorage.setItem(`nsfw_confirmed_${a}`,"true"),Te(!0)},children:"18 yaşından büyüğüm, devam et"}),e.jsx("button",{className:"nsfw-gate-cancel",onClick:()=>M(-1),children:"Geri Dön"})]}),e.jsx("p",{className:"nsfw-gate-legal",children:"Devam ederek, yaşınızın 18'den büyük olduğunu ve yetişkin içerikle ilgili yasal sorumluluğu kabul ettiğinizi onaylarsınız."})]})})]}):e.jsxs("div",{className:`app-wrapper full-height discord-layout ${Oe?"voice-channel-active":""}`,children:[e.jsx(wa,{title:s.name,description:s.description||`${s.name} topluluğuna katılın.`,image:`${(ce.defaults.baseURL||"https://api.oxypace.com.tr").replace(/\/$/,"")}/api/preview/portal-card/${s._id}?v=4`,type:"website",schema:{"@context":"https://schema.org","@type":"Community",name:s.name,description:s.description,url:window.location.href,memberCount:((ss=s.members)==null?void 0:ss.length)||0}}),!kt&&e.jsx(He,{}),oe.show&&e.jsxs("div",{className:`app-toast ${oe.type}`,children:[e.jsx("span",{className:"app-toast-icon",children:oe.type==="error"?"🚫":oe.type==="success"?"✅":oe.type==="warning"?"⚠️":"ℹ️"}),oe.message]}),e.jsxs("div",{className:`discord-split-view ${S&&E?"mobile-feed-active":""} ${Oe?"voice-room-active":""} ${N?"sidebar-collapsed":""}`,children:[g&&S&&E&&Oe&&e.jsx("button",{type:"button",className:"sidebar-toggle-btn mobile-live-portal-toggle-btn",onClick:nt,title:"Portal Menüsüne Dön","aria-label":"Portal Menüsüne Dön",children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"16",height:"16",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"9 18 15 12 9 6"})})}),g&&e.jsx($a,{portal:s,isMember:Ie,canManage:Ht||Jt,onEdit:t=>{it(typeof t=="string"?t:"overview"),De(!0)},currentChannel:w,onChangeChannel:Ns,className:`${l?"mobile-open":""} ${S&&E?"mobile-hidden":""}`,onShowPortalInfo:()=>tt(!0)}),e.jsxs("main",{className:`discord-main-content ${S&&!E?"mobile-content-hidden":""} ${st?"voice-channel-active":""}`,children:[S&&!E&&e.jsx(Na,{title:(s==null?void 0:s.name)||"Portal",showBack:!1}),(()=>{var j,o,u,f,x,C,m,P,U,z,W,ue,ee,L,Q,pe;const t=O,n=(t==null?void 0:t.type)||"text",r=(t==null?void 0:t.name)||"...",d=n==="voice"||n==="conference";return e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{display:"flex",flex:1,overflow:"hidden"},children:d?e.jsx("div",{style:{flex:1,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"},children:e.jsx(i.Suspense,{fallback:e.jsx("div",{className:"skeleton-loader",children:e.jsx("p",{children:"Canlı bağlantı odası hazırlanıyor..."})}),children:n==="conference"?e.jsx(Wa,{portalId:a,channelId:w,channelName:r,onBack:nt}):e.jsx(Oa,{portalId:a,channelId:w,channelName:r,onBack:nt})})}):e.jsx("div",{className:"channel-messages-area",style:{flex:1,display:"flex",flexDirection:"column"},children:$e?e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"},children:[e.jsx("div",{className:"spinner"}),e.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.9rem"},children:"İçerik yükleniyor..."})]}):e.jsxs(e.Fragment,{children:[!d&&e.jsxs("header",{className:`channel-top-bar ${S?"":"desktop-only"}`,children:[e.jsxs("div",{className:"channel-title-wrapper",children:[S&&e.jsx("button",{className:"mobile-back-btn-inline",onClick:nt,children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",children:n==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",children:r}),(()=>{const y=String((t==null?void 0:t._id)||w||""),J=ht[y]!==void 0?ht[y]:(t==null?void 0:t.postCount)??0;return e.jsxs("div",{className:"channel-post-count-badge",title:`${J} Gönderi`,children:[e.jsx(Mt,{size:13}),e.jsx("span",{children:J})]})})()]}),e.jsx("div",{className:"channel-header-actions",children:Ie&&e.jsx("button",{className:`icon-btn ${xe?"active":""}`,onClick:()=>be(!xe),title:xe?"Üyeleri Gizle":"Üyeleri Göster",style:{background:"none",border:"none",color:xe?"var(--primary-color)":"var(--text-muted)"},children:e.jsx(zt,{size:20})})})]}),de==="private"?e.jsx(os,{portal:s,onClose:()=>{window.history.length>2?M(-1):M("/search")},isMobile:S,onOpenSettings:()=>{it("overview"),De(!0)},onJoinStatusChange:y=>{y==="requested"?D(J=>J&&{...J,isRequested:!0}):y==="joined"&&(qe(!0),re(""),Ve(),Ye())}}):e.jsxs(e.Fragment,{children:[(s==null?void 0:s.alerts)&&s.alerts.length>0&&e.jsx(Fa,{alerts:s.alerts}),e.jsx("div",{className:`portal-feed-container discord-feed ${Pe?"tanitim-feed-mode":""}`,onScroll:Ss,ref:xt,children:Pe?e.jsx(Ba,{}):e.jsxs(e.Fragment,{children:[K.length===0&&!je&&e.jsxs("div",{className:"empty-portal",children:[e.jsx("div",{className:"empty-portal-icon",children:"👋"}),e.jsxs("h3",{children:[((o=(j=s==null?void 0:s.channels)==null?void 0:j.find(y=>y._id===w))==null?void 0:o.type)==="voice"?"🎙️":((f=(u=s==null?void 0:s.channels)==null?void 0:u.find(y=>y._id===w))==null?void 0:f.type)==="conference"?"🎤":((C=(x=s==null?void 0:s.channels)==null?void 0:x.find(y=>y._id===w))==null?void 0:C.type)==="image"?"🖼️":"#",((P=(m=s==null?void 0:s.channels)==null?void 0:m.find(y=>String(y._id)===String(w)))==null?void 0:P.name)||"..."," ","kanalına hoş geldin!"]}),e.jsx("p",{children:"Bu kanalda henüz mesaj yok. İlk mesajı sen at!"})]}),Array.isArray(K)&&K.map((y,J)=>{var ct;y.isBot===!0||((ct=y.author)==null||ct.isBot);const ze=Ws.enableAds;return e.jsxs(i.Fragment,{children:[e.jsx(Ys,{post:y,onDelete:Rs,onPin:Ds,onArchive:Ls,isAdmin:Jt},y._id),J<K.length-1&&e.jsx("div",{className:"post-separator"}),ze]},y._id)}),e.jsx("div",{ref:Ms,style:{height:"40px",margin:"10px 0",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"},children:wt&&e.jsx("div",{className:"spinner-small"})})]})}),(()=>{const J=2*Math.PI*20,ze=J-js/100*J;return e.jsxs("button",{className:`floating-scroll-top portal-scroll-top ${vs?"visible":""}`,onClick:yt,"aria-label":"Yukarı Çık",children:[e.jsxs("svg",{className:"progress-ring",width:"50",height:"50",viewBox:"0 0 50 50",children:[e.jsx("circle",{className:"progress-ring-track",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25"}),e.jsx("circle",{className:"progress-ring-fill",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25",style:{strokeDasharray:J,strokeDashoffset:ze}})]}),e.jsx("div",{className:"scroll-icon",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"m18 15-6-6-6 6"})})})]})})(),Pe?null:Ue?e.jsxs("div",{className:"channel-input-area",children:[Ce&&Ze.createPortal(e.jsxs("div",{className:"plus-menu portal-plus-menu-portal",ref:bs,style:{position:"fixed",top:Rt.top,left:Rt.left,zIndex:99999},children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{var y;(y=Dt.current)==null||y.click(),te(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsx(ps,{size:18,strokeWidth:1.9})}),"Galeri"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{qt(!0),te(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsx(ba,{size:18,strokeWidth:1.9})}),"Kamera"]}),e.jsxs("div",{className:"plus-menu-item",onClick:Es,children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsx(ya,{size:18,strokeWidth:1.9})}),"Panodan Yapıştır"]}),!Re&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Ft(!0),te(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsx(us,{size:18,strokeWidth:1.9})}),"Ses"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{Kt(!0),te(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsx(va,{size:18,strokeWidth:1.9})}),"Dosya"]})]})]}),document.body),e.jsx("input",{type:"file",ref:Dt,onChange:ws,style:{display:"none"},accept:Re?"image/*,.gif":"image/*,video/*,.gif",multiple:!0}),ae&&e.jsxs("div",{className:"input-quoted-preview",children:[e.jsxs("div",{className:"input-quoted-preview-header",children:[(z=(U=ae.author)==null?void 0:U.profile)!=null&&z.avatar?e.jsx("img",{src:ve(ae.author.profile.avatar),alt:"",className:"quoted-preview-avatar",loading:"lazy",decoding:"async",width:"32",height:"32"}):e.jsx("div",{className:"quoted-preview-avatar-placeholder",children:(ue=(W=ae.author)==null?void 0:W.username)==null?void 0:ue.charAt(0).toUpperCase()}),e.jsxs("div",{className:"quoted-preview-meta",children:[e.jsx("span",{className:"quoted-preview-author",children:((L=(ee=ae.author)==null?void 0:ee.profile)==null?void 0:L.displayName)||((Q=ae.author)==null?void 0:Q.username)}),e.jsxs("span",{className:"quoted-preview-username",children:["@",(pe=ae.author)==null?void 0:pe.username]})]}),e.jsx("button",{className:"remove-quote-btn",onClick:()=>Be(null),children:e.jsx(Xe,{size:16})})]}),e.jsxs("div",{className:"input-quoted-preview-body",children:[e.jsx("p",{className:"input-quoted-preview-text",children:ae.content}),ae.media&&e.jsx("div",{className:"input-quoted-preview-media",children:ae.mediaType==="video"?e.jsxs("div",{className:"media-placeholder",children:[e.jsx(ja,{size:20}),e.jsx("span",{children:"Video Alıntısı"})]}):e.jsx("img",{src:ve(ae.media),alt:"",loading:"lazy",decoding:"async",width:"120",height:"80"})})]})]}),Re&&le.trim()&&ke.length===0&&e.jsxs("div",{className:"image-channel-warning",style:{backgroundColor:"rgba(239, 68, 68, 0.1)",border:"1px solid rgba(239, 68, 68, 0.25)",color:"#f87171",padding:"8px 12px",borderRadius:"8px",fontSize:"13px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{flexShrink:0},children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]}),e.jsx("span",{children:"Görsel kanallarında paylaşım yapabilmek için mutlaka bir görsel eklemelisiniz."})]}),!v&&e.jsx(_a,{attachments:ke,detectedYouTube:Ot,onRemoveAttachment:As,onClearAll:Is}),v?e.jsxs("div",{className:"ghost-channel-notice",style:{backgroundColor:"#0c0c0c",borderTop:"1px solid #222",color:"#888",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",fontSize:"13px"},children:[e.jsxs("svg",{viewBox:"0 0 24 24",width:"18",height:"18",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{opacity:.7},children:[e.jsx("path",{d:"M12 2a5 5 0 0 0-5 5v14l3-2 2 2 2-2 3 2V7a5 5 0 0 0-5-5z"}),e.jsx("circle",{cx:"10",cy:"8",r:"1",fill:"currentColor"}),e.jsx("circle",{cx:"14",cy:"8",r:"1",fill:"currentColor"})]}),e.jsx("span",{children:"Hayalet Modu: Salt okunur izleme modundasınız. Kanalda mesaj ve gönderi paylaşılamaz."})]}):e.jsxs("div",{className:"message-input-wrapper",children:[e.jsx("button",{ref:Ke,className:`input-action-btn upload-btn ${Ce?"active":""}`,onClick:ys,style:{backgroundColor:"#383a40",borderRadius:"50%",width:"32px",height:"32px",marginRight:"12px",color:Ce?"#ffffff":"#b9bbbe"},children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z"})})}),e.jsx("input",{type:"text",placeholder:Re?"Gönderi paylaşmak için bir görsel ekleyin...":`#${(O==null?void 0:O.name)||"..."} kanalına mesaj gönder`,value:le,onChange:y=>{Ee(y.target.value)},onPaste:jt,onKeyDown:y=>{y.key==="Enter"&&!y.shiftKey&&(y.preventDefault(),Wt())}}),e.jsx("div",{className:"input-right-actions",children:e.jsx("button",{className:"input-action-btn send-btn",onClick:Wt,disabled:Fe||(Re||!le.trim())&&ke.length===0,title:"Gönder",style:{color:le.trim()||ke.length>0?"var(--primary-color)":"var(--text-tertiary)"},children:Fe?e.jsxs("div",{className:"compose-spinner-wrapper",style:{width:"20px",height:"20px"},children:[e.jsx("div",{className:"compose-spinner",style:{width:"20px",height:"20px",borderTopColor:"var(--primary-color)"}}),e.jsxs("span",{className:"compose-progress-text",style:{fontSize:"7px",color:"var(--text-primary)"},children:[fs,"%"]})]}):e.jsx(ka,{size:20})})})]}),me&&me.length>0&&e.jsxs("div",{className:"portal-typing-indicator",style:{marginTop:"8px"},children:[e.jsx("div",{className:"typing-avatars-group",children:me.map(y=>e.jsx("img",{src:ve(y.avatar),alt:y.displayName,className:"typing-avatar",title:y.displayName},y.userId))}),e.jsx("span",{className:"typing-text",children:me.length===1?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:me[0].displayName})," yazıyor..."]}):me.length===2?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:me[0].displayName})," ve ",e.jsx("strong",{children:me[1].displayName})," yazıyor..."]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:me[0].displayName})," ve ",me.length-1," kişi daha yazıyor..."]})})]})]}):e.jsx("div",{className:"channel-input-area",style:{padding:"0 20px 24px 20px",backgroundColor:"transparent",borderTop:"none"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--glass-bg)",padding:"12px 20px",borderRadius:"8px",border:"1px solid var(--glass-border)",backdropFilter:"blur(20px) saturate(160%)",WebkitBackdropFilter:"blur(20px) saturate(160%)",boxShadow:"var(--glass-shadow)"},children:[e.jsxs("span",{style:{color:"var(--text-secondary)",fontWeight:500,fontSize:"14px"},children:["Bu kanalda mesaj göndermek için ",g?"portala katılmalısın.":"giriş yapmalısın."]}),g?e.jsx("button",{className:"privacy-join-btn",onClick:$s,disabled:s.isRequested,style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:s.isRequested?"İstek Gönderildi":"Portala Katıl"}):e.jsx("button",{className:"privacy-join-btn",onClick:()=>M("/login"),style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:"Giriş Yap"})]})})]})]})})}),xe&&e.jsx(qa,{members:[...s.owner?[{...s.owner,role:"owner"}]:[],...(s.admins||[]).map(y=>({...y,role:"admin"})),...s.members||[]].filter((y,J,ze)=>{const ct=String(y._id||y.id||y);return y&&ze.findIndex(Ct=>String(Ct._id||Ct.id||Ct)===ct)===J}),onClose:()=>be(!1)})]})})()]})]}),kt&&St!=="notifications"&&e.jsx(i.Suspense,{fallback:null,children:e.jsx(Ua,{portal:s,currentUser:g,initialTab:St,onClose:()=>De(!1),onUpdate:t=>{D(t)}})}),kt&&St==="notifications"&&e.jsx("div",{className:"portal-notifications-modal",onClick:()=>De(!1),children:e.jsxs("div",{className:"notifications-modal-content",onClick:t=>t.stopPropagation(),children:[e.jsx("button",{className:"close-notifications-btn",onClick:()=>De(!1),children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsx(i.Suspense,{fallback:null,children:e.jsx(Ka,{portalId:s._id,portalChannels:s.channels||[],onUpdate:Ve})})]})}),gs&&s&&e.jsx(os,{portal:s,onClose:()=>tt(!1),isMobile:S,onOpenSettings:()=>{tt(!1),it("overview"),De(!0)},onLeave:()=>{tt(!1),qe(!1),M("/")}}),$t&&Ze.createPortal(e.jsx(Ca,{isOpen:$t,onClose:()=>qt(!1),onCapture:_s}),document.body),Bt&&Ze.createPortal(e.jsx(Pa,{isOpen:Bt,onClose:()=>Ft(!1),onAttach:Cs}),document.body),Ut&&Ze.createPortal(e.jsx(za,{isOpen:Ut,onClose:()=>Kt(!1),onFilesSelected:Ps,onFolderPackaged:zs}),document.body)]})};export{vn as default};
