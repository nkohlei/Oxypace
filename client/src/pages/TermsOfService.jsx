import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import '../AppLayout.css'; // Stil değişkenleri için

const TermsOfService = () => {
    // Son güncelleme tarihi (Manuel veya dinamik)
    const effectiveDate = "9 Şubat 2026";

    return (
        <div className="app-wrapper">
            <Helmet>
                <title>Kullanım Koşulları | Oxypace</title>
                <meta name="description" content="Oxypace Kullanım Koşulları. Platform kuralları, kullanıcı sorumlulukları ve yasal haklarınız hakkında detaylı bilgi." />
            </Helmet>

            <Navbar />

            <main className="legal-content-wrapper" style={{
                maxWidth: '900px',
                margin: '40px auto',
                padding: '40px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                color: 'var(--text-primary)',
                lineHeight: '1.7'
            }}>
                <div className="legal-header" style={{ marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', background: 'linear-gradient(45deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Kullanım Koşulları</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Son Güncelleme: {effectiveDate}</p>
                </div>

                <div className="legal-body">
                    <section style={{ marginBottom: '30px' }}>
                        <p>
                            Lütfen Oxypace ("Platform") web sitesini ve hizmetlerini kullanmadan önce bu Kullanım Koşulları'nı ("Koşullar") dikkatlice okuyunuz.
                        </p>
                        <p>
                            Platforma erişerek, üye olarak veya herhangi bir hizmeti kullanarak, bu Koşullar'ı okuduğunuzu, anladığınızı ve bunlara uymayı kabul ettiğinizi beyan edersiniz. Eğer bu Koşullar'ı kabul etmiyorsanız, lütfen Platformu kullanmayı derhal bırakınız.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '15px' }}>1. Hesap ve Üyelik</h2>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                            <li><strong>Yaş Sınırı:</strong> Platformu kullanabilmek için en az 13 yaşında olmalısınız.</li>
                            <li><strong>Bilgi Doğruluğu:</strong> Kayıt olurken sağladığınız bilgilerin doğru, güncel ve eksiksiz olduğunu taahhüt edersiniz.</li>
                            <li><strong>Hesap Güvenliği:</strong> Şifrenizin güvenliğinden ve hesabınızla yapılan tüm işlemlerden siz sorumlusunuz. Şüpheli bir durum fark ederseniz derhal bize bildirmelisiniz.</li>
                            <li><strong>Birden Fazla Hesap:</strong> Kötü niyetli amaçlarla (spam, manipülasyon) birden fazla hesap oluşturmak yasaktır.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '15px' }}>2. Kullanım Kuralları ve Yasaklar</h2>
                        <p>Aşağıdaki eylemler kesinlikle yasaktır ve hesabınızın kapatılmasına yol açabilir:</p>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                            <li><strong>Yasa Dışı İçerik:</strong> Yasalara aykırı, tehditkar, hakaret içeren, müstehcen veya şiddeti teşvik eden içerikler paylaşmak.</li>
                            <li><strong>Telif Hakkı İhlali:</strong> Başkalarına ait fikri mülkiyet haklarını ihlal eden materyaller paylaşmak.</li>
                            <li><strong>Spam ve Reklam:</strong> İzinsiz reklam yapmak, toplu mesaj göndermek veya kullanıcıları rahatsız etmek.</li>
                            <li><strong>Zararlı Yazılım:</strong> Virüs, trojan veya siteye zarar verebilecek kodlar yaymak.</li>
                            <li><strong>Veri Madenciliği:</strong> Siteden otomatik yöntemlerle (bot, scraper) veri toplamak.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '15px' }}>3. İçerik ve Mülkiyet</h2>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                            <li><strong>Sizin İçeriğiniz:</strong> Platformda paylaştığınız içeriklerin (gönderi, yorum, fotoğraf) mülkiyeti size aittir. Ancak, bu içerikleri Platformda yayınlayarak bize dünya çapında, telifsiz bir kullanım lisansı vermiş olursunuz.</li>
                            <li><strong>Platform İçeriği:</strong> Oxypace logosu, tasarımı, kodları ve diğer materyalleri Şirketimizin mülkiyetindedir ve izinsiz kopyalanamaz.</li>
                            <li><strong>İçerik Kaldırma:</strong> Şirketimiz, bu Koşullar'ı ihlal ettiğini düşündüğü herhangi bir içeriği önceden bildirmeksizin kaldırma hakkını saklı tutar.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '15px' }}>4. Sorumluluk Reddi</h2>
                        <p>
                            Hizmetlerimiz "olduğu gibi" ve "mevcut olduğu şekilde" sunulmaktadır. Oxypace, kesintisiz hizmet, hatasız çalışma veya belirli bir amaca uygunluk konusunda hiçbir garanti vermez. Platformun kullanımından doğabilecek doğrudan veya dolaylı zararlardan sorumlu tutulamaz.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '15px' }}>5. Değişiklikler</h2>
                        <p>
                            Bu Koşullar'ı zaman zaman güncelleyebiliriz. Önemli değişiklikler yapıldığında size bildirim gönderebilir veya site üzerinden duyuru yapabiliriz. Değişikliklerden sonra siteyi kullanmaya devam etmeniz, yeni koşulları kabul ettiğiniz anlamına gelir.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '15px' }}>6. Fesih</h2>
                        <p>
                            Bu Koşullar'ı ihlal etmeniz durumunda, Oxypace tek taraflı olarak üyeliğinizi askıya alma veya sonlandırma hakkına sahiptir.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '15px' }}>7. İletişim</h2>
                        <p>
                            Kullanım Koşulları hakkında sorularınız varsa, bizimle iletişime geçebilirsiniz:
                        </p>
                        <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '8px', marginTop: '15px', borderLeft: '4px solid #6366f1' }}>
                            <p><strong>E-posta:</strong> <a href="mailto:support@oxypace.com" style={{ color: '#6366f1', textDecoration: 'none' }}>support@oxypace.com</a></p>
                        </div>
                    </section>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '40px', textAlign: 'center' }}>
                        &copy; {new Date().getFullYear()} Oxypace. Tüm hakları saklıdır.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default TermsOfService;
