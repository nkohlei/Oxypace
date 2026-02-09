import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import '../AppLayout.css'; // Stil değişkenleri için

const PrivacyPolicy = () => {
    // Son güncelleme tarihi (Manuel veya dinamik)
    const effectiveDate = "9 Şubat 2026";

    return (
        <div className="app-wrapper">
            <Helmet>
                <title>Gizlilik Politikası | Oxypace</title>
                <meta name="description" content="Oxypace Gizlilik Politikası. Verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu öğrenin. KVKK ve GDPR uyumlu şeffaf bilgilendirme." />
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
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', background: 'linear-gradient(45deg, #FF5F1F, #FF8C00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Gizlilik Politikası</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Son Güncelleme: {effectiveDate}</p>
                </div>

                <div className="legal-body">
                    <section style={{ marginBottom: '30px' }}>
                        <p>
                            Oxypace ("biz", "bizim" veya "Şirket") olarak gizliliğinize derin bir saygı duyuyoruz.
                            Bu Gizlilik Politikası, web sitemizi (https://oxypace.vercel.app) ve hizmetlerimizi kullandığınızda
                            kişisel verilerinizin nasıl toplandığını, işlendiğini, paylaşıldığını ve korunduğunu şeffaf bir şekilde açıklamaktadır.
                        </p>
                        <p>
                            Hizmetimizi kullanarak, bu politikada belirtilen veri uygulamalarını kabul etmiş olursunuz.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '15px' }}>1. Topladığımız Bilgiler</h2>
                        <p>Hizmetlerimizi sunabilmek için aşağıdaki veri türlerini topluyoruz:</p>

                        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '15px' }}>A. Bize Doğrudan Sağladığınız Bilgiler</h3>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                            <li><strong>Hesap Bilgileri:</strong> Kayıt olurken sağladığınız kullanıcı adı, e-posta adresi ve şifre (şifrelenmiş olarak).</li>
                            <li><strong>Profil Bilgileri:</strong> Profil fotoğrafınız, biyografiniz, kapak fotoğrafınız ve profilinizde paylaşmayı seçtiğiniz diğer bilgiler.</li>
                            <li><strong>İçerik:</strong> Oluşturduğunuz gönderiler (postlar), yorumlar, mesajlar ve diğer paylaşımlar.</li>
                            <li><strong>İletişim:</strong> Bize destek talebi gönderirken sağladığınız bilgiler.</li>
                        </ul>

                        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '15px' }}>B. Otomatik Olarak Toplanan Bilgiler</h3>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                            <li><strong>Cihaz ve Bağlantı Bilgileri:</strong> IP adresi, tarayıcı türü, işletim sistemi, cihaz modeli.</li>
                            <li><strong>Kullanım Verileri:</strong> Hangi sayfaları ziyaret ettiğiniz, etkileşimleriniz, tıklama verileri ve oturum süreleri.</li>
                            <li><strong>Çerezler ve Takip Teknolojileri:</strong> Oturumunuzu açık tutmak ve tercihlerinizi hatırlamak için çerezler kullanırız.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '15px' }}>2. Verilerinizi Nasıl Kullanıyoruz?</h2>
                        <p>Topladığımız bilgileri aşağıdaki amaçlarla işliyoruz:</p>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                            <li><strong>Hizmet Sunumu:</strong> Hesabınızı oluşturmak, giriş yapmanızı sağlamak ve platformu çalıştırmak.</li>
                            <li><strong>Kişiselleştirme:</strong> Size ilgi alanlarınıza uygun içerikler (portallar, gönderiler) önermek.</li>
                            <li><strong>İletişim:</strong> Hizmet güncellemeleri, güvenlik uyarıları ve destek yanıtları göndermek.</li>
                            <li><strong>Güvenlik:</strong> Hesabınızı yetkisiz erişimlere karşı korumak, spam ve kötüye kullanımı önlemek.</li>
                            <li><strong>Yasal Uyumluluk:</strong> Yasal yükümlülüklerimizi yerine getirmek.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '15px' }}>3. Verilerin Paylaşımı ve Üçüncü Taraflar</h2>
                        <p>Kişisel verilerinizi asla üçüncü taraflara satmayız. Verilerinizi yalnızca aşağıdaki durumlarda paylaşırız:</p>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                            <li><strong>Hizmet Sağlayıcılar:</strong> Hosting (Vercel), veritabanı (MongoDB Atlas), depolama (Cloudflare R2) ve analiz (Google Analytics) hizmeti aldğimiz güvenilir ortaklar.</li>
                            <li><strong>Yasal Zorunluluklar:</strong> Mahkeme emri veya yasal bir talep olması durumunda resmi makamlarla paylaşılabilir.</li>
                            <li><strong>Rızanız Dahilinde:</strong> Açık izniniz olduğu durumlarda (örneğin Google ile giriş yaparken).</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '15px' }}>4. Çerez Politikası</h2>
                        <p>
                            Çerezler, tarayıcınızda saklanan küçük metin dosyalarıdır. Oxypace'de çerezleri şu amaçlarla kullanırız:
                        </p>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                            <li><strong>Zorunlu Çerezler:</strong> Siteye giriş yapabilmeniz ve güvenli gezinebilmeniz için gereklidir (Oturum tokenları).</li>
                            <li><strong>Tercih Çerezleri:</strong> Dil, tema (Koyu/Açık mod) gibi tercihlerinizi hatırlar.</li>
                            <li><strong>Analitik Çerezler:</strong> Site trafiğini analiz ederek performansı iyileştirmemize yardımcı olur.</li>
                        </ul>
                        <p style={{ marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Tarayıcı ayarlarınızdan çerezleri istediğiniz zaman engelleyebilirsiniz, ancak bu durumda sitenin bazı özellikleri (giriş yapma gibi) çalışmayabilir.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '15px' }}>5. Kullanıcı Haklarınız (KVKK & GDPR)</h2>
                        <p>Kişisel verileriniz üzerinde aşağıdaki haklara sahipsiniz:</p>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                            <li><strong>Erişim Hakkı:</strong> Hakkınızda tuttuğumuz verilerin bir kopyasını talep etme.</li>
                            <li><strong>Düzeltme Hakkı:</strong> Yanlış veya eksik bilgilerin düzeltilmesini isteme.</li>
                            <li><strong>Silme Hakkı (Unutulma Hakkı):</strong> Hesabınızı ve verilerinizi tamamen silmemizi talep etme.</li>
                            <li><strong>İtiraz Hakkı:</strong> Verilerinizin işlenmesine itiraz etme.</li>
                        </ul>
                        <p style={{ marginTop: '10px' }}>Bu haklarınızı kullanmak için bizimle iletişime geçebilirsiniz.</p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '15px' }}>6. Veri Güvenliği</h2>
                        <p>
                            Verilerinizi korumak için endüstri standardı güvenlik önlemleri alıyoruz (SSL şifreleme, güvenli sunucular, erişim kısıtlamaları).
                            Ancak internet üzerinden yapılan hiçbir veri iletiminin %100 güvenli olduğunu garanti edemeyiz.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '15px' }}>7. İletişim</h2>
                        <p>
                            Bu Gizlilik Politikası hakkında sorularınız, talepleriniz veya endişeleriniz varsa, bizimle istediğiniz zaman iletişime geçebilirsiniz:
                        </p>
                        <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '8px', marginTop: '15px', borderLeft: '4px solid #FF5F1F' }}>
                            <p><strong>E-posta:</strong> <a href="mailto:support@oxypace.com" style={{ color: '#FF5F1F', textDecoration: 'none' }}>support@oxypace.com</a></p>
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

export default PrivacyPolicy;
