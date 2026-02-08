import Navbar from '../components/Navbar';

const PrivacyPolicy = () => {
    return (
        <div className="app-wrapper">
            <Navbar />
            <main
                className="app-content"
                style={{
                    padding: '20px',
                    maxWidth: '800px',
                    margin: '0 auto',
                    color: 'var(--text-primary)',
                }}
            >
                <h1>Gizlilik Politikası</h1>
                <p>Son Güncelleme: {new Date().toLocaleDateString()}</p>
                <br />
                <p>
                    GlobalMessage olarak gizliliğinize önem veriyoruz. Bu Gizlilik Politikası, web
                    sitemizi kullandığınızda bilgilerinizin nasıl toplandığını, kullanıldığını ve
                    korunduğunu açıklar.
                </p>

                <h2>1. Toplanan Bilgiler</h2>
                <p>
                    Kayıt olduğunuzda sizden kullanıcı adı, e-posta adresi gibi temel bilgileri
                    talep ederiz. Ayrıca siteyi kullanımınız sırasında IP adresi, tarayıcı türü gibi
                    teknik veriler otomatik olarak toplanabilir.
                </p>

                <h2>2. Çerezler (Cookies)</h2>
                <p>
                    Kullanıcı deneyimini geliştirmek, reklamları kişiselleştirmek ve site trafiğini
                    analiz etmek için çerezleri kullanıyoruz. Google dahil üçüncü taraf
                    tedarikçiler, web sitemize yaptığınız önceki ziyaretlere dayalı olarak reklam
                    yayınlamak için çerezleri kullanabilir.
                </p>

                <h2>3. Bilgilerin Kullanımı</h2>
                <p>
                    Topladığımız bilgileri hesabınızı yönetmek, hizmetlerimizi iyileştirmek ve
                    güvenliği sağlamak için kullanırız.
                </p>

                <h2>4. Üçüncü Taraf Bağlantılar</h2>
                <p>
                    Sitemizde üçüncü taraf web sitelerine bağlantılar bulunabilir. Bu sitelerin
                    gizlilik uygulamalarından sorumlu değiliz.
                </p>

                <h2>5. İletişim</h2>
                <p>
                    Gizlilik politikamızla ilgili sorularınız için İletişim sayfamızdan bize
                    ulaşabilirsiniz.
                </p>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
