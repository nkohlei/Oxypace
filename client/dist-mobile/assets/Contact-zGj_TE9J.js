import{r as i,a1 as e,au as N,Z as k}from"./vendor-jO-Cpt0r.js";import{N as S}from"./Navbar-Bv1vF-iV.js";import{I as w}from"./InfoPage-CrfsN3B7.js";import{u as M}from"./index-CEAavaNg.js";import"./UserAvatar-DQQA0xSd.js";import"./lucide-BocR4IYo.js";/* empty css                 */import"./socket-CLibEh-w.js";import"./livekit-aTqtZGx_.js";const I=()=>{var g;const{user:t}=M(),[b,j]=i.useState(((g=t==null?void 0:t.profile)==null?void 0:g.displayName)||""),[o,y]=i.useState((t==null?void 0:t.email)||""),[r,l]=i.useState(""),[s,d]=i.useState(""),[m,p]=i.useState(!1),[v,x]=i.useState(!1),[u,n]=i.useState(""),z=async a=>{var h,f;if(a.preventDefault(),!o||!r||!s){n("Lütfen tüm zorunlu alanları doldurun.");return}p(!0),n("");try{t?await k.post("/api/contact",{subject:r,message:s}):await new Promise(c=>setTimeout(c,1500)),x(!0),l(""),d("")}catch(c){n(((f=(h=c.response)==null?void 0:h.data)==null?void 0:f.message)||"Mesajınız gönderilemedi. Lütfen tekrar deneyin.")}finally{p(!1)}};return e.jsxs("div",{className:"app-wrapper",children:[e.jsxs(N,{children:[e.jsx("title",{children:"İletişim | Oxypace"}),e.jsx("meta",{name:"description",content:"Oxypace ile iletişime geçin. Destek, geri bildirim veya iş birlikleri için bize ulaşın."})]}),e.jsx(S,{}),e.jsx(w,{title:"İletişim",children:e.jsxs("div",{className:"contact-container",children:[e.jsxs("div",{className:"contact-info-card",children:[e.jsx("h2",{className:"contact-heading",children:"İletişim Kanalları"}),e.jsx("p",{className:"contact-paragraph",children:"Platformla ilgili herhangi bir sorun, geri bildirim veya iş birliği talebi için bizimle doğrudan iletişime geçebilirsiniz."}),e.jsxs("div",{className:"contact-details",children:[e.jsxs("div",{className:"contact-item",children:[e.jsx("span",{className:"contact-icon",children:"📧"}),e.jsxs("div",{children:[e.jsx("h4",{children:"Destek E-postası"}),e.jsx("p",{className:"contact-link",children:"support@oxypace.com.tr"})]})]}),e.jsxs("div",{className:"contact-item",children:[e.jsx("span",{className:"contact-icon",children:"📨"}),e.jsxs("div",{children:[e.jsx("h4",{children:"Geri Bildirim Hızlı Hattı"}),e.jsx("p",{className:"contact-link",children:"nqohlei@gmail.com"})]})]})]}),e.jsx("div",{className:"contact-notice",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Bilgilendirme:"})," Destek talepleriniz ekibimiz tarafından incelenerek en geç 24-48 saat içerisinde yanıtlanacaktır."]})})]}),e.jsx("div",{className:"contact-form-card",children:v?e.jsxs("div",{className:"success-state",children:[e.jsx("div",{className:"success-icon",children:"✅"}),e.jsx("h3",{children:"Mesajınız İletildi!"}),e.jsx("p",{children:"Talebiniz başarıyla alınmıştır. En kısa sürede geri dönüş sağlayacağız."}),e.jsx("button",{className:"btn btn-primary",onClick:()=>x(!1),children:"Yeni Mesaj Gönder"})]}):e.jsxs("form",{onSubmit:z,className:"contact-form",children:[e.jsx("h3",{className:"form-title",children:"Bize Mesaj Gönderin"}),u&&e.jsx("div",{className:"error-alert",children:u}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"contact-name",children:"Adınız Soyadınız"}),e.jsx("input",{type:"text",id:"contact-name",value:b,onChange:a=>j(a.target.value),placeholder:"Örn: Ahmet Yılmaz"})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"contact-email",children:"E-posta Adresiniz *"}),e.jsx("input",{type:"email",id:"contact-email",value:o,onChange:a=>y(a.target.value),placeholder:"Örn: ahmet@example.com",required:!0})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"contact-subject",children:"Konu *"}),e.jsx("input",{type:"text",id:"contact-subject",value:r,onChange:a=>l(a.target.value),placeholder:"Mesajınızın konusu",required:!0})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"contact-message",children:"Mesajınız *"}),e.jsx("textarea",{id:"contact-message",value:s,onChange:a=>d(a.target.value),placeholder:"Sorunuzu veya geri bildiriminizi buraya yazın...",rows:5,required:!0})]}),e.jsx("button",{type:"submit",className:"btn btn-primary submit-btn",disabled:m,children:m?e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"spinner-small",style:{marginRight:"8px"}}),"Gönderiliyor..."]}):"Gönder"})]})})]})}),e.jsx("style",{children:`
                .contact-container {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 30px;
                    width: 100%;
                    max-width: 1000px;
                    margin: 0 auto;
                }
                
                @media (min-width: 769px) {
                    .contact-container {
                        grid-template-columns: 1fr 1.2fr;
                        gap: 40px;
                    }
                }

                .contact-info-card, .contact-form-card {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 16px;
                    padding: 24px;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }

                .contact-heading {
                    color: #38bdf8;
                    font-size: 1.5rem;
                    margin-bottom: 16px;
                }

                .contact-paragraph {
                    color: var(--text-secondary);
                    line-height: 1.6;
                    font-size: 0.95rem;
                }

                .contact-details {
                    margin: 30px 0;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .contact-item {
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                }

                .contact-icon {
                    font-size: 24px;
                }

                .contact-item h4 {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0 0 4px 0;
                }

                .contact-link {
                    color: #38bdf8;
                    font-size: 13.5px;
                    margin: 0;
                }

                .contact-notice {
                    background: rgba(56, 189, 248, 0.05);
                    border-left: 4px solid #38bdf8;
                    padding: 12px 16px;
                    border-radius: 4px;
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                .contact-notice p {
                    margin: 0;
                    line-height: 1.5;
                }

                .form-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0 0 20px 0;
                }

                .contact-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-group label {
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-secondary);
                }

                .form-group input, .form-group textarea {
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 10px 14px;
                    color: #ffffff;
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.2s ease;
                }

                .form-group input:focus, .form-group textarea:focus {
                    border-color: #38bdf8;
                }

                .error-alert {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    padding: 10px 14px;
                    border-radius: 8px;
                    font-size: 13px;
                }

                .submit-btn {
                    margin-top: 10px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    height: 42px;
                    font-weight: 600;
                }

                .success-state {
                    text-align: center;
                    padding: 40px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }

                .success-icon {
                    font-size: 48px;
                }

                .success-state h3 {
                    font-size: 1.5rem;
                    color: var(--text-primary);
                    margin: 0;
                }

                .success-state p {
                    color: var(--text-secondary);
                    font-size: 14px;
                    margin: 0 0 10px 0;
                    max-width: 300px;
                    line-height: 1.5;
                }
            `})]})};export{I as default};
