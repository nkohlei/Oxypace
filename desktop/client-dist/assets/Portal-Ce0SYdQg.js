const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PortalSettingsModal-COGGYomd.js","assets/vendor-DS-rbv8Y.js","assets/index-DJQq0hck.js","assets/socket-DX935JAz.js","assets/livekit-PwOJ_nM-.js","assets/lucide-DBnVNvlz.js","assets/index-A67IXF4U.css","assets/ImageCropper-BkAnb2Z9.js","assets/ImageCropper-D3thH9n0.css","assets/PortalSettingsModal-CtTdviLQ.css","assets/PortalNotifications-6Ydn6TDd.js","assets/PortalNotifications-iCJNwBfZ.css","assets/PortalInfoModal-DPxsNLh-.js","assets/Badge-Cu6iwuw3.js","assets/Badge-CXY9i3Fa.css","assets/useVideoTranscoder-B1sapXIg.js","assets/PostCard-BUxEc_4X.js","assets/VideoDownloadModal-2VsUYT15.js","assets/UserBadges-CPKyPsRP.js","assets/UserBadges-CLdNbPa_.css","assets/downloadHelper-CBX5oQi1.js","assets/downloadHelper-nMoTxJdb.css","assets/UserAvatar-C61vze7f.js","assets/VideoDownloadModal-WZ-2oC3I.css","assets/PostCard-BvgMAbQ4.css","assets/MessageBubble-6sTmPinG.css","assets/UserBar-CK4MhUKk.js","assets/Navbar-C4qJsoVP.js","assets/Navbar-DdM2nRqn.css","assets/SubHeader-J-KWe7BV.js","assets/SubHeader-BzCIywiH.css","assets/SEO-Bjt3cy3b.js","assets/VoiceChannel-CeN_ZZhY.js","assets/VoiceChannel-DOtLiuvP.js","assets/VoiceChannel-CoXiouzV.css","assets/ConferenceChannel-B7ef5O3M.js"])))=>i.map(i=>d[i]);
import{r as n,$ as e,Z as te,a0 as Nt,ap as kt,ar as Qt,a4 as Jt,aq as Zt,a5 as Xt,a9 as ve}from"./vendor-DS-rbv8Y.js";import{g as Q,f as St,h as Ct,d as Te,c as Oe,u as es,a as wt,i as ts,b as ss}from"./index-DJQq0hck.js";import{u as ns}from"./useVideoTranscoder-B1sapXIg.js";import{P as as}from"./PostCard-BUxEc_4X.js";import{c as is,X as De,v as rs,w as os,x as ls,d as cs,y as ds,I as ps,z as ms,p as us,J as hs,Y as xs}from"./lucide-DBnVNvlz.js";import{B as fs}from"./Badge-Cu6iwuw3.js";import{U as gs}from"./UserBar-CK4MhUKk.js";import{N as ye}from"./Navbar-C4qJsoVP.js";import{S as ys}from"./SubHeader-J-KWe7BV.js";import{S as vs}from"./SEO-Bjt3cy3b.js";import"./socket-DX935JAz.js";import"./livekit-PwOJ_nM-.js";import"./VideoDownloadModal-2VsUYT15.js";import"./UserBadges-CPKyPsRP.js";import"./downloadHelper-CBX5oQi1.js";import"./UserAvatar-C61vze7f.js";/* empty css                      *//* empty css                  */const bs=({portalId:i,onClose:T})=>{const[R,M]=n.useState(""),[$,m]=n.useState([]),[l,j]=n.useState(!1),[r,_]=n.useState(new Set);n.useEffect(()=>{const b=setTimeout(async()=>{if(R.trim().length===0){m([]);return}j(!0);try{const f=await te.get(`/api/users/search?q=${R}`);m(f.data)}catch{}finally{j(!1)}},500);return()=>clearTimeout(b)},[R]);const u=async d=>{var b,f;try{await Promise.all([te.post(`/api/portals/${i}/invite`,{userId:d}),te.post("/api/messages",{recipientId:d,portalId:i,content:"Seni bir portala davet ettim!"})]),_(q=>new Set(q).add(d))}catch(q){alert(((f=(b=q.response)==null?void 0:b.data)==null?void 0:f.message)||"İşlem sırasında bir hata oluştu.")}},x=()=>{const d=`${window.location.origin}/portal/${i}`;navigator.clipboard.writeText(d),alert("Davet bağlantısı kopyalandı!")};return e.jsx("div",{className:"invite-modal-overlay",onClick:T,children:e.jsxs("div",{className:"invite-modal",onClick:d=>d.stopPropagation(),children:[e.jsxs("div",{className:"invite-header",children:[e.jsx("h2",{children:"Kullanıcı Davet Et"}),e.jsxs("div",{className:"header-actions",children:[e.jsxs("button",{className:"copy-link-btn",title:"Bağlantıyı Kopyala",onClick:x,children:[e.jsx(is,{size:20,strokeWidth:2}),e.jsx("span",{children:"Bağlantı"})]}),e.jsx("button",{className:"close-btn",onClick:T,children:e.jsx(De,{size:24,strokeWidth:2})})]})]}),e.jsx("div",{className:"invite-search-container",children:e.jsx("input",{type:"text",className:"invite-search-input",placeholder:"Kullanıcı adı ara...",value:R,onChange:d=>M(d.target.value),autoFocus:!0})}),e.jsxs("div",{className:"invite-results custom-scrollbar",children:[l&&e.jsx("div",{className:"loading-text",children:"Aranıyor..."}),!l&&$.length===0&&R&&e.jsx("div",{className:"no-play-text",children:"Sonuç bulunamadı."}),$.map(d=>{var q;const b=d._id||d,f=r.has(b);return e.jsxs("div",{className:"invite-user-row",children:[e.jsxs("div",{className:"user-info",children:[e.jsx("img",{src:Q((q=d.profile)==null?void 0:q.avatar),alt:"",className:"user-avatar"}),e.jsx("span",{className:"user-name",children:d.username})]}),e.jsx("button",{className:`invite-btn ${f?"invited":""}`,onClick:()=>!f&&u(b),disabled:f,children:f?"Gönderildi":"Davet Et"})]},b)})]})]})})},js=({startedAt:i,style:T={},className:R=""})=>{const{roomDuration:M,roomStartTime:$}=St()||{},[m,l]=n.useState("00:00");n.useEffect(()=>{if($&&i===$&&typeof M=="number"){const u=M,x=Math.floor(u/3600),d=Math.floor(u%3600/60),b=u%60;x>0?l(`${x.toString().padStart(2,"0")}:${d.toString().padStart(2,"0")}:${b.toString().padStart(2,"0")}`):l(`${d.toString().padStart(2,"0")}:${b.toString().padStart(2,"0")}`);return}if(!i){l("00:00");return}const r=()=>{const u=Date.now(),x=Math.floor((u-i)/1e3);if(x<0){l("00:00");return}const d=Math.floor(x/3600),b=Math.floor(x%3600/60),f=x%60;d>0?l(`${d.toString().padStart(2,"0")}:${b.toString().padStart(2,"0")}:${f.toString().padStart(2,"0")}`):l(`${b.toString().padStart(2,"0")}:${f.toString().padStart(2,"0")}`)};r();const _=setInterval(r,1e3);return()=>clearInterval(_)},[i,$,M]);const j={display:"flex",alignItems:"center",fontSize:"15px",fontWeight:"800",color:"#39FF14",background:"transparent",border:"none",padding:"0 4px"};return e.jsx("div",{style:{...j,...T},className:R,children:m})},ks=({portal:i,isMember:T,onEdit:R,currentChannel:M,onChangeChannel:$,className:m,canManage:l,onShowPortalInfo:j})=>{var me,re;const[r,_]=n.useState(!1);Nt();const u=Ct(),{isMobileView:x}=u||{},d=(u==null?void 0:u.isDesktopSidebarCollapsed)||!1,b=(u==null?void 0:u.setIsDesktopSidebarCollapsed)||(()=>{}),f=Te(c=>c.unreadPostsByChannel),q=Te(c=>c.clearUnreadForChannel),{roomStartTime:ae,activeRoom:be}=St(),{socket:a,onlineUsers:se}=Oe(),F=((i==null?void 0:i.members)||[]).filter(c=>{const N=c._id||c.id||c;return se.includes(String(N))}).length;if(n.useEffect(()=>{M&&q(M)},[M,q]),!i)return null;const I=i!=null&&i.channels?[...i.channels].sort((c,N)=>(c.order||0)-(N.order||0)).map(c=>({id:c._id,name:c.name,type:c.type||"text"})):[],J=I.find(c=>c.id===M),ie=(J==null?void 0:J.type)==="voice"||(J==null?void 0:J.type)==="conference";n.useEffect(()=>{!ie&&d&&b(!1)},[ie,d,b]);const pe=c=>M===c;return e.jsxs("div",{className:`channel-sidebar ${d?"collapsed":""} ${m||""}`,style:{height:d?"0":"calc(100% - 24px)",backgroundColor:"transparent",display:"flex",flexDirection:"column",flexShrink:0,overflow:"visible",position:"relative",borderRight:"none"},children:[!x&&ie&&e.jsx("button",{className:"sidebar-toggle-btn",onClick:c=>{c.stopPropagation(),b(!d)},title:d?"Menüyü Göster":"Menüyü Gizle",children:e.jsx("span",{className:"toggle-text",children:d?"GÖSTER":"GİZLE"})}),e.jsxs("div",{className:"sidebar-content-wrapper",style:{display:"flex",flexDirection:"column",flex:1,width:"100%",height:"100%",overflow:"hidden",transition:"opacity 0.2s ease, visibility 0.2s ease",opacity:d?0:1,visibility:d?"hidden":"visible"},children:[e.jsxs("div",{className:"channel-banner-container",onClick:()=>j&&j(),children:[e.jsx("div",{className:"channel-banner-image",style:{backgroundImage:i.coverImage?`url(${Q(i.coverImage)})`:i.banner?`url(${Q(i.banner)})`:'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")'}}),e.jsx("div",{className:"channel-banner-overlay"})]}),e.jsxs("div",{className:"portal-quick-info",children:[e.jsxs("div",{className:"portal-info-main",onClick:()=>j&&j(),children:[e.jsxs("h2",{className:"portal-title-text",children:[i.name,e.jsx(fs,{type:i.isVerified?"verified":(me=i.badges)==null?void 0:me[0],size:16})]}),e.jsxs("div",{className:"portal-stats-row",children:[e.jsxs("div",{className:"stat-item",children:[e.jsx(rs,{size:12}),e.jsxs("span",{children:[i.membersCount||((re=i.members)==null?void 0:re.length)||0," Üye"]})]}),e.jsx("div",{className:"stat-dot"}),e.jsxs("div",{className:"stat-item",children:[e.jsx("div",{className:"online-indicator-dot"}),e.jsxs("span",{children:[F," Çevrimiçi"]})]})]})]}),e.jsxs("div",{className:"portal-header-actions",children:[(T||l)&&e.jsx("button",{className:"portal-action-btn-circle",onClick:c=>{c.stopPropagation(),R&&R("notifications")},title:"Bildirimler",children:e.jsx(os,{size:18})}),T&&e.jsx("button",{className:"portal-action-btn-circle",onClick:c=>{c.stopPropagation(),_(!0)},title:"Davet Et",children:e.jsx(ls,{size:18})})]})]}),"            ",e.jsxs("div",{className:"custom-scrollbar",style:{flex:1,padding:"0 8px 8px 8px",overflowY:"auto",display:"flex",flexDirection:"column"},children:[e.jsxs("div",{style:{padding:"16px 8px 4px 8px",display:"flex",alignItems:"center",justifyContent:"space-between",color:"var(--text-tertiary)",textTransform:"uppercase",fontSize:"12px",fontWeight:"bold",fontFamily:"var(--font-primary)"},children:[e.jsx("span",{children:"Kanallar"}),l&&e.jsx("div",{onClick:c=>{c.stopPropagation(),R&&R("channels")},style:{cursor:"pointer",padding:"0 4px",fontSize:"18px",fontWeight:"bold"},title:"Kanal Oluştur",children:"+"})]}),I.map(c=>{var oe;const N=pe(c.id),Re=c.type==="announcement"||c.name.includes("announcements"),ne=c.type==="voice";return e.jsxs("div",{className:`channel-item ${N?"active":""}`,onClick:()=>$(c.id),style:{padding:"6px 8px",margin:"2px 0",borderRadius:"4px",display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",color:N?"white":"#949ba4",backgroundColor:N?"#3f4147":"transparent",transition:"all 0.1s"},children:[e.jsx("div",{style:{color:N?"white":"var(--text-secondary)",display:"flex",alignItems:"center",minWidth:"20px",justifyContent:"center"},children:ne?e.jsx(cs,{size:20,strokeWidth:2}):Re?e.jsx(ds,{size:20,strokeWidth:2.5}):c.type==="image"?e.jsx(ps,{size:20,strokeWidth:2.5,style:{color:"#f59e0b"}}):e.jsx(ms,{size:20,strokeWidth:2.5})}),e.jsx("span",{style:{fontWeight:N?600:500,fontSize:"16px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:N?"white":"var(--text-primary)",maxWidth:"fit-content"},children:c.name}),!N&&((oe=f[c.id])==null?void 0:oe.length)>0&&e.jsx("div",{style:{backgroundColor:"#f23f43",color:"white",fontSize:"11px",fontWeight:"bold",padding:"0 6px",borderRadius:"8px",minWidth:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.3)",marginLeft:"-4px",flexShrink:0},children:f[c.id].length>9?"9+":f[c.id].length}),e.jsx("div",{style:{flex:1}}),N&&ne&&be&&String(be.channelId)===String(c.id)&&ae&&e.jsx("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:e.jsx(js,{startedAt:ae,className:"vc-sidebar-timer"})})]},c.id)})]}),e.jsx(gs,{currentChannelId:M}),e.jsx("div",{style:{paddingTop:"4px",paddingBottom:"8px",fontSize:"11px",color:"var(--text-tertiary)",textAlign:"center",opacity:.6,userSelect:"none",backgroundColor:"transparent",borderTop:"1px solid var(--border-subtle)"},children:"© 2026 Oxypace. Tüm hakları saklıdır."})]}),e.jsx("style",{children:`
            .channel-sidebar {
                width: 350px;
                transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), border 0.3s ease;
                flex-shrink: 0;
                max-width: 100vw;
                background: var(--glass-bg) !important;
                backdrop-filter: blur(20px) saturate(160%);
                -webkit-backdrop-filter: blur(20px) saturate(160%);
                border: 1px solid var(--glass-border) !important;
                border-radius: 16px !important;
                margin: 12px 12px 12px 0 !important;
                height: calc(100% - 24px) !important;
                overflow: hidden !important;
                box-shadow: var(--glass-shadow) !important;
            }
            
            .channel-sidebar.collapsed {
                width: 0px !important;
                min-width: 0px !important;
                border-right: none !important;
            }
            
            .sidebar-toggle-btn {
                position: absolute;
                right: -24px;
                top: 0;
                width: 24px;
                height: 160px;
                background: #383a40 !important;
                border: none !important;
                border-radius: 0 !important;
                color: #dbdee1;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 1000;
                box-shadow: 4px 0 8px rgba(0, 0, 0, 0.2);
                transition: color 0.2s ease;
                transform: none !important;
            }
            
            .sidebar-toggle-btn:hover {
                color: #ffffff;
                background: #383a40 !important;
                transform: none !important;
            }

            .sidebar-toggle-btn .toggle-text {
                writing-mode: vertical-rl;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 2px;
                color: #dbdee1;
                user-select: none;
                white-space: nowrap;
                transition: color 0.2s ease;
            }

            .sidebar-toggle-btn:hover .toggle-text {
                color: #ffffff;
            }
            

            
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
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%);
            }

            .portal-quick-info {
                padding: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid var(--border-subtle);
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

            @media (max-width: 768px) {
                .channel-banner-container {
                    height: 120px;
                }
                .portal-title-text {
                    font-size: 16px;
                }
            }

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
            .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: var(--border-subtle);
                border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background-color: transparent;
            }
            `}),r&&e.jsx(bs,{portalId:i._id,onClose:()=>_(!1)})]})},ws=({members:i=[],onClose:T})=>{const{onlineUsers:R}=Oe(),M=l=>{if(!l)return"";const j=new Date,r=new Date(l),_=Math.max(0,j-r),u=Math.floor(_/6e4);if(u<1)return"şimdi";if(u<60)return`${u}m`;const x=Math.floor(u/60);if(x<24)return`${x}h`;const d=Math.floor(x/24);if(d<30)return`${d}d`;const b=Math.floor(d/30);return b<12?`${b}mo`:`${Math.floor(b/12)}y`},$=i.filter(l=>{const j=l._id||l.id||l;return R.includes(j)}),m=i.filter(l=>{const j=l._id||l.id||l;return!R.includes(j)});return e.jsxs("div",{className:"members-sidebar custom-scrollbar",children:[e.jsxs("div",{className:"members-header-top",children:[e.jsx("h3",{children:"ÜYELER"}),T&&e.jsx("button",{onClick:T,className:"close-members-btn","aria-label":"Kapat",children:e.jsx(De,{size:20,strokeWidth:2})})]}),e.jsxs("div",{className:"members-category",children:["Çevrim içi — ",$.length]}),$.map((l,j)=>{var u,x,d;if(!l||typeof l=="string")return null;const r=l.username||"Unknown",_=l.avatar||((u=l.profile)==null?void 0:u.avatar);return e.jsxs(kt,{to:`/profile/${r}`,className:"member-item member-link",children:[e.jsxs("div",{className:"member-avatar-wrapper",children:[_?e.jsx("img",{src:Q(_),alt:"",className:"member-avatar"}):e.jsx("div",{className:"member-avatar-placeholder",children:((x=r[0])==null?void 0:x.toUpperCase())||"?"}),e.jsx("div",{className:"status-indicator online"})]}),e.jsxs("div",{className:"member-info",children:[e.jsxs("span",{className:"member-name active-role",style:{color:"#2ecc71"},children:[((d=l.profile)==null?void 0:d.displayName)||r,(l.role==="owner"||l.isAdmin)&&e.jsx("span",{style:{marginLeft:"4px"},children:"👑"})]}),e.jsx("div",{className:"member-custom-status",children:e.jsx("span",{role:"img","aria-label":"activity",children:"🎮"})})]})]},l._id||l.id||j)}),e.jsxs("div",{className:"members-category",children:["Çevrim dışı — ",m.length]}),m.map((l,j)=>{var u,x,d;if(!l||typeof l=="string")return null;const r=l.username||"Unknown",_=l.avatar||((u=l.profile)==null?void 0:u.avatar);return e.jsxs(kt,{to:`/profile/${r}`,className:"member-item offline member-link",children:[e.jsx("div",{className:"member-avatar-wrapper",children:_?e.jsx("img",{src:Q(_),alt:"",className:"member-avatar"}):e.jsx("div",{className:"member-avatar-placeholder",style:{backgroundColor:"var(--bg-secondary)"},children:((x=r[0])==null?void 0:x.toUpperCase())||"?"})}),e.jsx("div",{className:"member-info",style:{flex:1},children:e.jsxs("div",{className:"member-name-row",style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx("span",{className:"member-name",children:((d=l.profile)==null?void 0:d.displayName)||r}),l.lastActive&&e.jsx("span",{className:"last-active-time",style:{fontSize:"11px",color:"var(--text-muted)"},children:M(l.lastActive)})]})})]},l._id||l.id||`offline-${j}`)}),e.jsx("style",{children:`
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
            `})]})},Ns=({alerts:i=[]})=>{const[T,R]=n.useState(()=>{try{const r=sessionStorage.getItem("dismissed_portal_alerts");return r?JSON.parse(r):[]}catch{return[]}}),[M,$]=n.useState(null),m=i.filter(r=>!T.includes(r._id)),l=r=>{$(r),setTimeout(()=>{const _=[...T,r];R(_);try{sessionStorage.setItem("dismissed_portal_alerts",JSON.stringify(_))}catch{}$(null)},300)},j=r=>{const _=new Date,x=new Date(r)-_;if(x<=0)return null;const d=Math.floor(x/(1e3*60*60*24)),b=Math.floor(x/(1e3*60*60)%24),f=Math.floor(x/(1e3*60)%60);return d>0?`${d} gün ${b} saat kaldı`:b>0?`${b} saat ${f} dk kaldı`:`${f} dakika kaldı`};return m.length===0?null:e.jsx(e.Fragment,{children:m.map(r=>e.jsx("div",{className:`portal-alert-banner ${M===r._id?"dismissing":""}`,children:e.jsxs("div",{className:"alert-banner-inner",children:[e.jsx("div",{className:"alert-banner-icon",children:e.jsx(us,{size:18,strokeWidth:2})}),e.jsxs("div",{className:"alert-banner-content",children:[e.jsx("div",{className:"alert-banner-label",children:e.jsx("span",{children:"Yönetici Uyarısı"})}),e.jsx("div",{className:"alert-banner-message",children:r.message}),e.jsx("div",{className:"alert-banner-meta",children:e.jsxs("span",{className:"alert-banner-time",children:[e.jsx(hs,{size:16,strokeWidth:2}),j(r.expiresAt)||"Süresi dolmak üzere"]})})]}),e.jsx("button",{className:"alert-banner-close",onClick:()=>l(r._id),title:"Uyarıyı gizle",children:e.jsx(De,{size:16,strokeWidth:2.5})})]})},r._id))})},Ss=n.lazy(()=>ve(()=>import("./PortalSettingsModal-COGGYomd.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9]))),Cs=n.lazy(()=>ve(()=>import("./PortalNotifications-6Ydn6TDd.js"),__vite__mapDeps([10,1,2,3,4,5,6,11]))),_s=n.lazy(()=>ve(()=>import("./PortalInfoModal-DPxsNLh-.js"),__vite__mapDeps([12,1,2,3,4,5,6,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]))),Is=n.lazy(()=>ve(()=>import("./VoiceChannel-CeN_ZZhY.js"),__vite__mapDeps([32,1,4,2,3,5,6,33,34]))),Ps=n.lazy(()=>ve(()=>import("./ConferenceChannel-B7ef5O3M.js"),__vite__mapDeps([35,1,4,2,3,5,6,33,34]))),Xs=()=>{var vt,bt;const{id:i}=Qt(),T=Jt(),[R]=Zt(),M=R.get("channel"),$=R.get("post"),{user:m,updateUser:l,loading:j}=es(),{socket:r,connected:_}=Oe(),u=Nt(),x=Ct(),{isSidebarOpen:d,closeSidebar:b,isMobileView:f,mobileChannelOpen:q,setMobileChannelOpen:ae}=x||{},be=(x==null?void 0:x.isDesktopSidebarCollapsed)||!1,[a,se]=n.useState(null),F=Te(t=>t.posts),I=Te(t=>t.setPosts),[J,ie]=n.useState(!0),[pe,me]=n.useState(!1),[re,c]=n.useState(""),[N,Re]=n.useState(null),[ne,oe]=n.useState(null),[Me,Qe]=n.useState(!1),[P,le]=n.useState(null),[Je,_t]=n.useState(!1),[Z,$e]=n.useState(""),[H,Ze]=n.useState([]);n.useRef(null);const[ue,Ee]=n.useState(!1),[he,Xe]=n.useState(!1),[ce,et]=n.useState({show:!1,message:"",type:"info"}),[It,Pt]=n.useState(!1),[xe,G]=n.useState(!1),[tt,zt]=n.useState({top:0,left:0}),[Ae,st]=n.useState(""),[nt,je]=n.useState(!1),at=n.useRef(null),it=n.useRef(null),rt=n.useRef(null),ot=n.useRef(null),[S,fe]=n.useState(null),[D,ke]=n.useState(null),[Tt,we]=n.useState(0),[lt,qe]=n.useState(!1),Be=n.useRef(!1);ns();const X=wt(t=>t.activeUploads)[`portal-${i}`];n.useEffect(()=>{X&&X.status==="uploading"&&I(t=>t.map(s=>s.isOptimistic&&s.mediaType==="video"?{...s,uploadProgress:X.progress}:s))},[X==null?void 0:X.progress,X==null?void 0:X.status]);const[Dt,ct]=n.useState(!1),Rt=n.useRef(null),Ue=n.useRef(null),Mt=n.useCallback(t=>{t.preventDefault(),t.stopPropagation(),G(s=>{if(!s&&Ue.current){const o=Ue.current.getBoundingClientRect();zt({top:o.bottom+8,left:o.left})}return!s})},[]);n.useEffect(()=>{if(!xe)return;let t=!0;const s=g=>{if(!t)return;const p=g.target.closest(".plus-menu")||g.target.closest(".portal-plus-menu-portal"),y=g.target.closest(".upload-btn");!p&&!y&&G(!1)},o=setTimeout(()=>{t&&(document.addEventListener("click",s),document.addEventListener("touchstart",s))},0);return()=>{t=!1,clearTimeout(o),document.removeEventListener("click",s),document.removeEventListener("touchstart",s)}},[xe]),n.useEffect(()=>()=>{G(!1)},[]),n.useEffect(()=>{G(!1)},[P,i]),n.useEffect(()=>{var t;(t=T.state)!=null&&t.quotedPost&&(ke(T.state.quotedPost),T.state.selectedChannelId&&le(T.state.selectedChannelId),u(T.pathname+T.search,{replace:!0,state:{}}))},[T.state,i]);const B=(vt=a==null?void 0:a.channels)==null?void 0:vt.find(t=>t._id===P),Ne=(B==null?void 0:B.type)==="image",$t=((B==null?void 0:B.type)==="voice"||(B==null?void 0:B.type)==="conference")&&(!f||q);n.useEffect(()=>{if(!r||!_||!i)return;r.emit("join_portal",i),P&&r.emit("join_channel",P);const t=p=>{var v,C;const y=((v=p.portal)==null?void 0:v._id)||p.portal,k=((C=p.channel)==null?void 0:C._id)||p.channel,w=String(y)===String(i),E=String(k)===String(P);w&&E&&I(U=>{if(U.some(z=>z._id===p._id))return U;const Y=p.quotedPost&&(typeof p.quotedPost=="string"?p.quotedPost:p.quotedPost._id);if(Y){const z=U.find(W=>W._id===Y);z&&typeof z=="object"&&z.author?p.quotedPost=z:D&&Y===D._id&&(p.quotedPost=D)}return[p,...U]})},s=p=>{var w;const y=((w=p.portal)==null?void 0:w._id)||p.portal;String(y)===String(i)&&I(E=>E.map(v=>v._id===p._id?p:v))},o=({userId:p,status:y,lastActive:k})=>{y==="offline"&&Ze(w=>w.filter(E=>String(E.userId)!==String(p))),se(w=>{if(!w||!w.members)return w;const E=w.members.map(v=>{const C=v._id||v.id||v;return String(C)===String(p)&&typeof v=="object"&&v!==null?{...v,lastActive:k||new Date}:v});return{...w,members:E}})},g=({userId:p,username:y,displayName:k,avatar:w,isTyping:E})=>{String(p)!==String(m==null?void 0:m._id)&&Ze(v=>E?v.some(C=>String(C.userId)===String(p))?v:[...v,{userId:p,username:y,displayName:k,avatar:w}]:v.filter(C=>String(C.userId)!==String(p)))};return r.on("post:created",t),r.on("post:updated",s),r.on("user_status_change",o),r.on("portal_typing_update",g),()=>{r.off("post:created",t),r.off("post:updated",s),r.off("user_status_change",o),r.off("portal_typing_update",g)}},[r,_,i,P,m==null?void 0:m._id]);const Et=t=>{if(!t)return null;const s=/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,o=t.match(s);return o&&o[2].length===11?o[2]:null},At=t=>{const s=t.target.value;st(s)},dt=()=>{const t=Et(Ae);if(!t){O("Geçersiz YouTube URL'si","error");return}fe({name:"YouTube Video",type:"youtube",preview:`https://img.youtube.com/vi/${t}/hqdefault.jpg`,url:Ae}),je(!1),st("")},[qt,Se]=n.useState(!1),[Bt,Ut]=n.useState(0),We=n.useRef(null),Wt=t=>{const s=t.target;s.scrollTop>300?Se(!0):Se(!1);const o=s.scrollHeight-s.clientHeight,g=o>0?s.scrollTop/o*100:0;Ut(g)},Lt=()=>{We.current&&We.current.scrollTo({top:0,behavior:"smooth"})},Vt=t=>{le(t),Se(!1),f&&(b(),ae(!0))},O=n.useCallback((t,s="info")=>{et({show:!0,message:t,type:s}),setTimeout(()=>et(o=>({...o,show:!1})),4e3)},[]),Ce=t=>{const s=t.target.files[0];if(s){if(s.size>2*1024*1024*1024){O("Dosya boyutu 2 GB'dan büyük olamaz.","error");return}fe(s),Be.current=s.type.startsWith("video/")||["mp4","webm","ogg","mov","m4v"].includes(s.name.split(".").pop().toLowerCase()),G(!1)}};n.useEffect(()=>{!r||!i||(Z.trim().length>0||S!==null?ue||(Ee(!0),r.emit("portal_typing",{portalId:i,isTyping:!0})):ue&&(r.emit("portal_typing",{portalId:i,isTyping:!1}),Ee(!1)))},[Z,S,i,r,ue]),n.useEffect(()=>()=>{r&&i&&ue&&r.emit("portal_typing",{portalId:i,isTyping:!1})},[i,r,ue]);const pt=async()=>{var p,y;if(!Z.trim()&&!S)return;r&&i&&r.emit("portal_typing",{portalId:i,isTyping:!1}),Ee(!1);const t={content:Z,media:S},s=S&&S.type==="youtube",o=`temp-${Date.now()}`,g={_id:o,content:Z,media:s?S.url:S?URL.createObjectURL(S):null,mediaType:s?"youtube":S?S.type.startsWith("video")?"video":"image":null,author:m,createdAt:new Date().toISOString(),likes:[],likeCount:0,isOptimistic:!0,quotedPost:D};I(k=>[g,...k]),$e(""),fe(null),G(!1),qe(!0),we(0);try{let k=null,w=null,E=null,v=null;if(s)w=t.media.url,E="youtube";else if(t.media)if(Be.current){wt.getState().startVideoUpload({file:t.media,portalId:i,channel:P,content:t.content,quotedPostId:D==null?void 0:D._id,onFinish:(z,W)=>{if(z)I(L=>L.filter(A=>String(A._id)!==String(o))),O("Video yükleme başarısız oldu.","error");else if(W){const L=String(o);I(A=>{const K=String(W._id);return A.some(V=>String(V._id)===K)?A.filter(V=>String(V._id)!==L):A.map(V=>{if(String(V._id)===L){const ee=W,h=ee.quotedPost&&(typeof ee.quotedPost=="string"?ee.quotedPost:ee.quotedPost._id);return h&&V.quotedPost&&h===V.quotedPost._id&&(ee.quotedPost=V.quotedPost),ee}return V})})}}}),qe(!1),ke(null);return}else k=await ss(t.media,"post",i,z=>{we(z),I(W=>W.map(L=>String(L._id)===String(o)?{...L,uploadProgress:z}:L))});else we(100);const C={content:t.content,portalId:i,channel:P,quotedPostId:D==null?void 0:D._id};k?(C.mediaKey=k,Be.current?C.mediaType="video":t.media&&(t.media.type==="application/pdf"||t.media.name.toLowerCase().endsWith(".pdf"))&&(C.pdfName=t.media.name,C.pdfSize=t.media.size)):w&&(C.media=w,C.mediaType=E);const U=await te.post("/api/posts",C);ke(null);const Y=String(o);I(z=>{const W=String(U.data._id);return z.some(A=>String(A._id)===W)?z.filter(A=>String(A._id)!==Y):z.map(A=>{if(String(A._id)===Y){const K=U.data,de=K.quotedPost&&(typeof K.quotedPost=="string"?K.quotedPost:K.quotedPost._id);return de&&A.quotedPost&&de===A.quotedPost._id&&(K.quotedPost=A.quotedPost),K}return A})})}catch(k){const w=((y=(p=k.response)==null?void 0:p.data)==null?void 0:y.message)||k.message;O(w,"error"),I(E=>E.filter(v=>String(v._id)!==String(o))),$e(t.content),fe(t.media)}finally{qe(!1),we(0)}},[Le,_e]=n.useState(!1),[Ve,Ft]=n.useState("overview"),[Ds,Rs]=n.useState(!1),[Ms,Gt]=n.useState({name:"",description:"",privacy:"public"});n.useRef(null),n.useRef(null),n.useEffect(()=>{i&&!j&&mt()},[i,j]),n.useEffect(()=>{if(!j&&a&&a.channels&&a.channels.length>0)if(P){if(!a.channels.some(s=>String(s._id)===String(P))){const s=a.channels.find(o=>o.name==="genel"||o.name==="general")||a.channels[0];s&&le(s._id)}}else{if(M){const s=a.channels.find(o=>String(o._id)===String(M));if(s){le(s._id);return}}const t=a.channels.find(s=>s.name==="genel"||s.name==="general")||a.channels[0];t&&le(t._id)}},[a,j]),n.useEffect(()=>{i&&P&&a&&Ke(a._id,i)&&Pe()},[i,P,a==null?void 0:a._id]),n.useEffect(()=>{if($&&!Je&&!pe&&Array.isArray(F)&&F.length>0){const t=document.getElementById(`post-${$}`);t&&setTimeout(()=>{t.scrollIntoView({behavior:"smooth",block:"center"}),t.classList.add("highlight-post"),setTimeout(()=>t.classList.remove("highlight-post"),2e3),_t(!0)},100)}},[$,F,pe,Je]),n.useEffect(()=>{var t,s;if(a&&m){const o=((t=a.members)==null?void 0:t.includes(m._id))||((s=m.joinedPortals)==null?void 0:s.some(g=>g._id===a._id||g===a._id));Qe(!!o)}},[a,m]);const mt=async()=>{(!a||a._id!==i)&&(ie(!0),Se(!1));try{const t=await te.get(`/api/portals/${i}`);se(t.data),Gt({name:t.data.name,description:t.data.description||"",privacy:t.data.privacy||"public"})}catch(t){if(t.response&&t.response.status===403){const s=t.response.data;s.portalStatus==="suspended"||s.portalStatus==="closed"?(Re({portalStatus:s.portalStatus,statusReason:s.statusReason,suspendedUntil:s.suspendedUntil,portalName:s.portalName,portalAvatar:s.portalAvatar}),c("suspended")):c("blocked")}else t.response&&t.response.status===404?c("blocked"):c("Portal yüklenemedi")}finally{ie(!1)}},Ie=n.useRef(null),ut=n.useRef(F);ut.current=F;const Fe=n.useRef(P);Fe.current=P;const Pe=n.useCallback(async(t=!1)=>{var s,o;t?xt(!0):(Ie.current&&Ie.current.abort(),Ie.current=new AbortController,me(!0),I([]),Ge(!0));try{const g=localStorage.getItem("token"),p={signal:(s=Ie.current)==null?void 0:s.signal,...g&&{headers:{Authorization:`Bearer ${g}`}}},y=Fe.current;if(t&&y!==Fe.current)return;let k=`/api/portals/${i}/posts?channel=${y}&limit=10`;const w=ut.current;if(t&&w.length>0){const C=w[w.length-1];k+=`&before=${C.createdAt}`}const v=(await te.get(k,p)).data;v.length<10&&Ge(!1),I(t?C=>{const U=new Set(C.map(z=>z._id)),Y=v.filter(z=>!U.has(z._id));return[...C,...Y]}:v),c("")}catch(g){if(te.isCancel(g))return;((o=g.response)==null?void 0:o.status)===403?c("private"):c("Gönderiler yüklenemedi")}finally{t||me(!1),xt(!1),ie(!1)}},[i]),[ht,Ge]=n.useState(!0),[Ye,xt]=n.useState(!1),ze=n.useRef(),Yt=n.useCallback(t=>{Ye||(ze.current&&ze.current.disconnect(),ze.current=new IntersectionObserver(s=>{s[0].isIntersecting&&ht&&Pe(!0)}),t&&ze.current.observe(t))},[Ye,ht,Pe]);n.useEffect(()=>{I([]),Ge(!0),le(null),se(null),c(""),ae(!1)},[i]);const Kt=n.useCallback(t=>{I(s=>s.filter(o=>String(o._id)!==String(t)))},[I]),Ht=n.useCallback((t,s)=>{s&&I(o=>o.filter(g=>String(g._id)!==String(t)))},[I]),Ot=n.useCallback(async t=>{try{const o=(await te.put(`/api/posts/${t}/pin`)).data;I(g=>g.map(y=>y._id===t?o:y).sort((y,k)=>y.isPinned===k.isPinned?new Date(k.createdAt)-new Date(y.createdAt):y.isPinned?-1:1))}catch{O("Sabitleme işlemi başarısız","error")}},[I,O]),ft=async()=>{var t,s;if(!m){O("Lütfen giriş yapın veya kaydolun!","warning");return}try{const o=localStorage.getItem("token"),g=o?{headers:{Authorization:`Bearer ${o}`}}:{};if((await te.post(`/api/portals/${i}/join`,{},g)).data.status==="joined"){Qe(!0);const y={...m,joinedPortals:[...m.joinedPortals||[],a]};l(y),se(k=>({...k,members:[...k.members||[],m._id]})),Pe(),O("Portala başarıyla katıldınız!","success")}else O("Üyelik isteğiniz gönderildi!","info"),se(y=>({...y,isRequested:!0}))}catch(o){O(((s=(t=o.response)==null?void 0:t.data)==null?void 0:s.message)||"Katılma başarısız","error")}},Ke=(t,s)=>{if(!t||!s)return!1;const o=typeof t=="object"?t.toString():t,g=typeof s=="object"?s.toString():s;return o===g},gt=m&&a&&a.owner&&Ke(a.owner._id||a.owner,m._id),yt=gt||m&&a&&a.admins&&a.admins.some(t=>Ke(t._id||t,m._id));if(n.useEffect(()=>{if(!(N!=null&&N.suspendedUntil)){oe(null);return}const t=()=>{const o=new Date,p=new Date(N.suspendedUntil)-o;if(p<=0){oe(null),window.location.reload();return}oe({days:Math.floor(p/(1e3*60*60*24)),hours:Math.floor(p/(1e3*60*60)%24),minutes:Math.floor(p/(1e3*60)%60),seconds:Math.floor(p/1e3%60)})};t();const s=setInterval(t,1e3);return()=>clearInterval(s)},[N]),re==="suspended"&&N){const t=N.portalStatus==="suspended",s=N.suspendedUntil?new Date(N.suspendedUntil).toLocaleString("tr-TR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):null;return e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(ye,{}),e.jsx("div",{className:"suspension-screen",children:e.jsxs("div",{className:"suspension-card",children:[e.jsx("div",{className:"suspension-icon",children:t?"⏸️":"🔒"}),e.jsx("h1",{className:"suspension-title",children:N.portalName||"Portal"}),e.jsx("h2",{className:"suspension-subtitle",children:t?"Bu portal geçici olarak askıya alındı":"Bu portal kapatılmıştır"}),N.statusReason&&e.jsxs("div",{className:"suspension-reason",children:[e.jsx("div",{className:"suspension-reason-label",children:"Sebep"}),e.jsx("p",{children:N.statusReason})]}),t&&s&&e.jsxs("div",{className:"suspension-unlock",children:[e.jsx("div",{className:"suspension-unlock-label",children:"🔓 Erişim Açılma Tarihi"}),e.jsx("div",{className:"suspension-unlock-date",children:s}),ne&&e.jsxs("div",{className:"suspension-countdown",children:[e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(ne.days).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Gün"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(ne.hours).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saat"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(ne.minutes).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Dakika"})]}),e.jsx("div",{className:"countdown-separator",children:":"}),e.jsxs("div",{className:"countdown-item",children:[e.jsx("span",{className:"countdown-value",children:String(ne.seconds).padStart(2,"0")}),e.jsx("span",{className:"countdown-label",children:"Saniye"})]})]})]}),e.jsxs("div",{className:"suspension-policy",children:[e.jsx("span",{children:"📋"}),e.jsxs("p",{children:["Askıya alma nedenleri, platformun ",e.jsx("strong",{children:"Politika ve Koşullar"}),"'ı kapsamında değerlendirilmektedir. Detaylı bilgi için kurallarımızı inceleyebilirsiniz."]})]}),e.jsx("button",{onClick:()=>u("/"),className:"suspension-home-btn",children:"Anasayfaya Dön"})]})})]})}return re==="blocked"?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(ye,{}),e.jsxs("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center",flexDirection:"column",color:"var(--text-muted)"},children:[e.jsx("div",{style:{fontSize:"3rem",marginBottom:"1rem"},children:"🚫"}),e.jsx("h2",{children:"Sonuç Bulunamadı"}),e.jsx("p",{children:"Aradığınız portala ulaşılamıyor."}),e.jsx("button",{onClick:()=>u("/"),className:"btn-save",style:{marginTop:"20px",float:"none"},children:"Anasayfaya Dön"})]})]}):J||j||!a?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(ye,{}),e.jsx("div",{style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center"},children:e.jsx("div",{className:"spinner"})})]}):a.isNSFW&&!It&&!sessionStorage.getItem(`nsfw_confirmed_${i}`)?e.jsxs("div",{className:"app-wrapper full-height",children:[e.jsx(ye,{}),e.jsx("div",{className:"nsfw-gate-overlay",children:e.jsxs("div",{className:"nsfw-gate-card",children:[e.jsx("div",{className:"nsfw-gate-icon",children:e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]})}),e.jsx("div",{className:"nsfw-gate-badge",children:"+18"}),e.jsx("h1",{className:"nsfw-gate-title",children:"Yaş Kısıtlaması"}),e.jsxs("p",{className:"nsfw-gate-desc",children:[e.jsx("strong",{children:a.name})," portalı yetişkin içerik barındırabilir. Bu portala erişmek için 18 yaşından büyük olmanız gerekmektedir."]}),e.jsxs("div",{className:"nsfw-gate-actions",children:[e.jsx("button",{className:"nsfw-gate-confirm",onClick:()=>{sessionStorage.setItem(`nsfw_confirmed_${i}`,"true"),Pt(!0)},children:"18 yaşından büyüğüm, devam et"}),e.jsx("button",{className:"nsfw-gate-cancel",onClick:()=>u(-1),children:"Geri Dön"})]}),e.jsx("p",{className:"nsfw-gate-legal",children:"Devam ederek, yaşınızın 18'den büyük olduğunu ve yetişkin içerikle ilgili yasal sorumluluğu kabul ettiğinizi onaylarsınız."})]})})]}):e.jsxs("div",{className:`app-wrapper full-height discord-layout ${$t?"voice-channel-active":""}`,children:[e.jsx(vs,{title:a.name,description:a.description||`${a.name} topluluğuna katılın.`,image:Q(a.avatar),type:"website",schema:{"@context":"https://schema.org","@type":"Community",name:a.name,description:a.description,url:window.location.href,memberCount:((bt=a.members)==null?void 0:bt.length)||0}}),!Le&&e.jsx(ye,{}),ce.show&&e.jsxs("div",{className:`app-toast ${ce.type}`,children:[e.jsx("span",{className:"app-toast-icon",children:ce.type==="error"?"🚫":ce.type==="success"?"✅":ce.type==="warning"?"⚠️":"ℹ️"}),ce.message]}),e.jsxs("div",{className:`discord-split-view ${f&&q?"mobile-feed-active":""} ${be?"sidebar-collapsed":""}`,children:[m&&e.jsx(ks,{portal:a,isMember:Me,canManage:gt||yt,onEdit:t=>{Ft(typeof t=="string"?t:"overview"),_e(!0)},currentChannel:P,onChangeChannel:Vt,className:`${d?"mobile-open":""} ${f&&q?"mobile-hidden":""}`,onShowPortalInfo:()=>ct(!0)}),e.jsxs("main",{className:`discord-main-content ${f&&!q?"mobile-content-hidden":""}`,children:[f&&!q&&e.jsx(ys,{title:(a==null?void 0:a.name)||"Portal",showBack:!1}),(()=>{var p,y,k,w,E,v,C,U,Y,z,W,L,A,K,de,V,ee;const t=(p=a==null?void 0:a.channels)==null?void 0:p.find(h=>h._id===P),s=(t==null?void 0:t.type)||"text",o=(t==null?void 0:t.name)||"...",g=s==="voice"||s==="conference";return e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{display:"flex",flex:1,overflow:"hidden"},children:g?e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column"},children:[f&&e.jsx("header",{className:"channel-top-bar",style:{flexShrink:0},children:e.jsxs("div",{className:"channel-title-wrapper",children:[e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>ae(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",style:{color:"var(--primary-color)"},children:s==="voice"||s==="conference"?e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{color:"var(--primary-color)"},children:[e.jsx("path",{d:"M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"}),e.jsx("path",{d:"M19 10v2a7 7 0 0 1-14 0v-2"}),e.jsx("line",{x1:"12",y1:"19",x2:"12",y2:"23"})]}):s==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",style:{color:"var(--primary-color)"},children:o})]})}),e.jsx(n.Suspense,{fallback:e.jsx("div",{className:"skeleton-loader",children:e.jsx("p",{children:"Canlı bağlantı odası hazırlanıyor..."})}),children:s==="conference"?e.jsx(Ps,{portalId:i,channelId:P,channelName:o}):e.jsx(Is,{portalId:i,channelId:P,channelName:o})})]}):e.jsx("div",{className:"channel-messages-area",style:{flex:1,display:"flex",flexDirection:"column"},children:pe?e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"},children:[e.jsx("div",{className:"spinner"}),e.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.9rem"},children:"İçerik yükleniyor..."})]}):e.jsxs(e.Fragment,{children:[!g&&e.jsxs("header",{className:`channel-top-bar ${f?"":"desktop-only"}`,children:[e.jsxs("div",{className:"channel-title-wrapper",children:[f&&e.jsx("button",{className:"mobile-back-btn-inline",onClick:()=>ae(!1),children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",width:"24",height:"24",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("span",{className:"hashtag",style:{color:"var(--primary-color)"},children:s==="image"?"🖼️":"#"}),e.jsx("h3",{className:"channel-name",style:{color:"var(--primary-color)"},children:o})]}),e.jsx("div",{className:"channel-header-actions",children:Me&&e.jsx("button",{className:`icon-btn ${he?"active":""}`,onClick:()=>Xe(!he),title:he?"Üyeleri Gizle":"Üyeleri Göster",style:{background:"none",border:"none",color:he?"var(--primary-color)":"var(--text-muted)"},children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"24",height:"24",children:[e.jsx("path",{d:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"}),e.jsx("circle",{cx:"9",cy:"7",r:"4"}),e.jsx("path",{d:"M23 21v-2a4 4 0 0 0-3-3.87"}),e.jsx("path",{d:"M16 3.13a4 4 0 0 1 0 7.75"})]})})})]}),re==="private"?e.jsx("div",{className:"portal-privacy-screen",children:e.jsxs("div",{className:"privacy-card",children:[e.jsx("div",{className:"privacy-icon",children:"🔒"}),e.jsx("img",{src:Q(a.avatar),alt:"",className:"privacy-avatar",loading:"lazy",decoding:"async",width:"80",height:"80"}),e.jsx("h2",{children:a.name}),e.jsx("p",{className:"privacy-desc",children:a.description||"Bu portal gizlidir."}),e.jsx("p",{className:"privacy-hint",children:"İçeriği görmek ve mesajlaşmak için üye olmalısın."}),a.isRequested?e.jsx("button",{className:"privacy-join-btn requested",disabled:!0,children:"İstek Gönderildi"}):e.jsx("button",{className:"privacy-join-btn",onClick:ft,children:a.privacy==="private"?"Üyelik İsteği Gönder":"Portala Katıl"})]})}):e.jsxs(e.Fragment,{children:[(a==null?void 0:a.alerts)&&a.alerts.length>0&&e.jsx(Ns,{alerts:a.alerts}),e.jsxs("div",{className:"portal-feed-container discord-feed",onScroll:Wt,ref:We,children:[F.length===0&&!J&&e.jsxs("div",{className:"empty-portal",children:[e.jsx("div",{className:"empty-portal-icon",children:"👋"}),e.jsxs("h3",{children:[((k=(y=a==null?void 0:a.channels)==null?void 0:y.find(h=>h._id===P))==null?void 0:k.type)==="voice"?"🎙️":((E=(w=a==null?void 0:a.channels)==null?void 0:w.find(h=>h._id===P))==null?void 0:E.type)==="conference"?"🎤":((C=(v=a==null?void 0:a.channels)==null?void 0:v.find(h=>h._id===P))==null?void 0:C.type)==="image"?"🖼️":"#",((Y=(U=a==null?void 0:a.channels)==null?void 0:U.find(h=>String(h._id)===String(P)))==null?void 0:Y.name)||"..."," ","kanalına hoş geldin!"]}),e.jsx("p",{children:"Bu kanalda henüz mesaj yok. İlk mesajı sen at!"})]}),Array.isArray(F)&&F.map((h,ge)=>{var jt;h.isBot===!0||((jt=h.author)==null||jt.isBot);const He=ts.enableAds;return e.jsxs(n.Fragment,{children:[e.jsx(as,{post:h,onDelete:Kt,onPin:Ot,onArchive:Ht,isAdmin:yt},h._id),ge<F.length-1&&e.jsx("div",{className:"post-separator"}),He]},h._id)}),e.jsx("div",{ref:Yt,style:{height:"40px",margin:"10px 0",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"},children:Ye&&e.jsx("div",{className:"spinner-small"})})]}),(()=>{const ge=2*Math.PI*20,He=ge-Bt/100*ge;return e.jsxs("button",{className:`floating-scroll-top portal-scroll-top ${qt?"visible":""}`,onClick:Lt,"aria-label":"Yukarı Çık",children:[e.jsxs("svg",{className:"progress-ring",width:"50",height:"50",viewBox:"0 0 50 50",children:[e.jsx("circle",{className:"progress-ring-track",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25"}),e.jsx("circle",{className:"progress-ring-fill",strokeWidth:"3",fill:"transparent",r:20,cx:"25",cy:"25",style:{strokeDasharray:ge,strokeDashoffset:He}})]}),e.jsx("div",{className:"scroll-icon",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"m18 15-6-6-6 6"})})})]})})(),m&&Me?e.jsxs("div",{className:"channel-input-area",children:[xe&&Xt.createPortal(e.jsxs("div",{className:"plus-menu portal-plus-menu-portal",ref:Rt,style:{position:"fixed",top:tt.top,left:tt.left,zIndex:99999},children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{at.current.click(),G(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("circle",{cx:"8.5",cy:"8.5",r:"1.5"}),e.jsx("polyline",{points:"21 15 16 10 5 21"})]})}),"Görsel"]}),!Ne&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"plus-menu-item",onClick:()=>{it.current.click(),G(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("polygon",{points:"23 7 16 12 23 17 23 7"}),e.jsx("rect",{x:"1",y:"5",width:"15",height:"14",rx:"2",ry:"2"})]})}),"Video"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{rt.current.click(),G(!1)},children:[e.jsx("div",{className:"plus-menu-icon",style:{fontWeight:800,fontSize:"10px"},children:"GIF"}),"GIF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{ot.current.click(),G(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"})]})}),"PDF"]}),e.jsxs("div",{className:"plus-menu-item",onClick:()=>{je(!nt),G(!1)},children:[e.jsx("div",{className:"plus-menu-icon",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",width:"20",height:"20",children:[e.jsx("path",{d:"M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"}),e.jsx("polygon",{points:"9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02",fill:"currentColor"})]})}),"YouTube"]})]})]}),document.body),e.jsx("input",{type:"file",ref:at,onChange:Ce,style:{display:"none"},accept:"image/png, image/jpeg, image/jpg"}),e.jsx("input",{type:"file",ref:it,onChange:Ce,style:{display:"none"},accept:"video/mp4, video/webm, video/quicktime"}),e.jsx("input",{type:"file",ref:rt,onChange:Ce,style:{display:"none"},accept:"image/gif"}),e.jsx("input",{type:"file",ref:ot,onChange:Ce,style:{display:"none"},accept:".pdf"}),nt&&e.jsx("div",{className:"edit-modal-overlay",style:{zIndex:9999},children:e.jsxs("div",{className:"edit-modal-modern",style:{maxWidth:"400px",height:"auto",maxHeight:"none"},children:[e.jsxs("div",{className:"edit-modal-header-modern",children:[e.jsx("div",{className:"header-left",children:e.jsx("h3",{className:"header-title-modern",children:"YouTube Videosu Ekle"})}),e.jsx("button",{onClick:()=>je(!1),className:"close-btn-modern",children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),e.jsxs("div",{className:"edit-modal-content-modern",style:{padding:"20px"},children:[e.jsxs("div",{className:"floating-label-group",children:[e.jsx("label",{className:"floating-label",children:"Video Bağlantısı"}),e.jsx("input",{type:"text",className:"floating-input",placeholder:"https://www.youtube.com/watch?v=...",value:Ae,onChange:At,autoFocus:!0,onKeyDown:h=>{h.key==="Enter"&&(h.preventDefault(),dt())}})]}),e.jsxs("div",{style:{marginTop:"20px",display:"flex",justifyContent:"flex-end",gap:"10px"},children:[e.jsx("button",{onClick:()=>je(!1),className:"join-btn outline",style:{padding:"8px 16px"},children:"İptal"}),e.jsx("button",{onClick:dt,className:"join-btn primary",style:{padding:"8px 20px"},children:"Ekle"})]})]})]})}),D&&e.jsxs("div",{className:"input-quoted-preview",children:[e.jsxs("div",{className:"input-quoted-preview-header",children:[(W=(z=D.author)==null?void 0:z.profile)!=null&&W.avatar?e.jsx("img",{src:Q(D.author.profile.avatar),alt:"",className:"quoted-preview-avatar",loading:"lazy",decoding:"async",width:"32",height:"32"}):e.jsx("div",{className:"quoted-preview-avatar-placeholder",children:(A=(L=D.author)==null?void 0:L.username)==null?void 0:A.charAt(0).toUpperCase()}),e.jsxs("div",{className:"quoted-preview-meta",children:[e.jsx("span",{className:"quoted-preview-author",children:((de=(K=D.author)==null?void 0:K.profile)==null?void 0:de.displayName)||((V=D.author)==null?void 0:V.username)}),e.jsxs("span",{className:"quoted-preview-username",children:["@",(ee=D.author)==null?void 0:ee.username]})]}),e.jsx("button",{className:"remove-quote-btn",onClick:()=>ke(null),children:e.jsx(De,{size:16})})]}),e.jsxs("div",{className:"input-quoted-preview-body",children:[e.jsx("p",{className:"input-quoted-preview-text",children:D.content}),D.media&&e.jsx("div",{className:"input-quoted-preview-media",children:D.mediaType==="video"?e.jsxs("div",{className:"media-placeholder",children:[e.jsx(xs,{size:20}),e.jsx("span",{children:"Video Alıntısı"})]}):e.jsx("img",{src:Q(D.media),alt:"",loading:"lazy",decoding:"async",width:"120",height:"80"})})]})]}),Ne&&Z.trim()&&!S&&e.jsxs("div",{className:"image-channel-warning",style:{backgroundColor:"rgba(239, 68, 68, 0.1)",border:"1px solid rgba(239, 68, 68, 0.25)",color:"#f87171",padding:"8px 12px",borderRadius:"8px",fontSize:"13px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",style:{flexShrink:0},children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]}),e.jsx("span",{children:"Görsel kanallarında paylaşım yapabilmek için mutlaka bir görsel eklemelisiniz."})]}),e.jsxs("div",{className:"message-input-wrapper",children:[e.jsx("button",{ref:Ue,className:`input-action-btn upload-btn ${xe?"active":""}`,onClick:Mt,style:{backgroundColor:"#383a40",borderRadius:"50%",width:"32px",height:"32px",marginRight:"12px",color:xe?"var(--primary-color)":"#b9bbbe"},children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z"})})}),S&&e.jsxs("div",{className:"input-media-preview",style:{marginRight:"12px",display:"flex",alignItems:"center",backgroundColor:"var(--bg-secondary)",borderRadius:"8px",padding:"4px",gap:"8px",border:"1px solid var(--border-subtle)"},children:[S.type==="youtube"&&S.preview?e.jsx("img",{src:S.preview,alt:"Video Preview",style:{width:"40px",height:"30px",objectFit:"cover",borderRadius:"4px"},loading:"lazy",decoding:"async",width:"40",height:"30"}):e.jsx("span",{style:{fontSize:"20px",lineHeight:1,padding:"4px"},children:S.type.startsWith("video")?"🎥":S.type.includes("gif")?"👾":S.type==="application/pdf"||S.name&&S.name.toLowerCase().endsWith(".pdf")?"📄":"🖼️"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",maxWidth:"100px"},children:e.jsx("span",{style:{fontSize:"10px",color:"var(--text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:S.name||"Medya"})}),e.jsx("button",{onClick:()=>fe(null),style:{background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer"},children:"×"})]}),e.jsx("input",{type:"text",placeholder:Ne?"Gönderi paylaşmak için bir görsel ekleyin...":`#${(B==null?void 0:B.name)||"..."} kanalına mesaj gönder`,value:Z,onChange:h=>{$e(h.target.value)},onKeyDown:h=>{h.key==="Enter"&&!h.shiftKey&&(h.preventDefault(),pt())}}),e.jsx("div",{className:"input-right-actions",children:e.jsx("button",{className:"input-action-btn send-btn",onClick:pt,disabled:lt||(Ne||!Z.trim())&&!S,title:"Gönder",style:{color:Z.trim()||S?"var(--primary-color)":"var(--text-tertiary)"},children:lt?e.jsxs("div",{className:"compose-spinner-wrapper",style:{width:"20px",height:"20px"},children:[e.jsx("div",{className:"compose-spinner",style:{width:"20px",height:"20px",borderTopColor:"var(--primary-color)"}}),e.jsxs("span",{className:"compose-progress-text",style:{fontSize:"7px",color:"var(--text-primary)"},children:[Tt,"%"]})]}):e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"22",y1:"2",x2:"11",y2:"13"}),e.jsx("polygon",{points:"22 2 15 22 11 13 2 9 22 2"})]})})})]}),H&&H.length>0&&e.jsxs("div",{className:"portal-typing-indicator",style:{marginTop:"8px"},children:[e.jsx("div",{className:"typing-avatars-group",children:H.map(h=>e.jsx("img",{src:Q(h.avatar),alt:h.displayName,className:"typing-avatar",title:h.displayName},h.userId))}),e.jsx("span",{className:"typing-text",children:H.length===1?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:H[0].displayName})," yazıyor..."]}):H.length===2?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:H[0].displayName})," ve ",e.jsx("strong",{children:H[1].displayName})," yazıyor..."]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:H[0].displayName})," ve ",H.length-1," kişi daha yazıyor..."]})})]})]}):e.jsx("div",{className:"channel-input-area",style:{padding:"0 20px 24px 20px",backgroundColor:"transparent",borderTop:"none"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--glass-bg)",padding:"12px 20px",borderRadius:"8px",border:"1px solid var(--glass-border)",backdropFilter:"blur(20px) saturate(160%)",WebkitBackdropFilter:"blur(20px) saturate(160%)",boxShadow:"var(--glass-shadow)"},children:[e.jsxs("span",{style:{color:"var(--text-secondary)",fontWeight:500,fontSize:"14px"},children:["Bu kanalda mesaj göndermek için ",m?"portala katılmalısın.":"giriş yapmalısın."]}),m?e.jsx("button",{className:"privacy-join-btn",onClick:ft,disabled:a.isRequested,style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:a.isRequested?"İstek Gönderildi":"Portala Katıl"}):e.jsx("button",{className:"privacy-join-btn",onClick:()=>u("/login"),style:{margin:0,padding:"8px 16px",borderRadius:"4px",fontSize:"13px",minWidth:"auto",width:"auto"},children:"Giriş Yap"})]})})]})]})})}),he&&e.jsx(ws,{members:a.members,onClose:()=>Xe(!1)})]})})()]})]}),Le&&Ve!=="notifications"&&e.jsx(n.Suspense,{fallback:null,children:e.jsx(Ss,{portal:a,currentUser:m,initialTab:Ve,onClose:()=>_e(!1),onUpdate:t=>{se(t)}})}),Le&&Ve==="notifications"&&e.jsx("div",{className:"portal-notifications-modal",onClick:()=>_e(!1),children:e.jsxs("div",{className:"notifications-modal-content",onClick:t=>t.stopPropagation(),children:[e.jsx("button",{className:"close-notifications-btn",onClick:()=>_e(!1),children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsx(n.Suspense,{fallback:null,children:e.jsx(Cs,{portalId:a._id,portalChannels:a.channels||[],onUpdate:mt})})]})}),Dt&&e.jsx(n.Suspense,{fallback:null,children:e.jsx(_s,{portal:a,onClose:()=>ct(!1),isMobile:f})})]})};export{Xs as default};
