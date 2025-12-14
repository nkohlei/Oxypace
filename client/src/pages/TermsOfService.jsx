import Navbar from '../components/Navbar';

const TermsOfService = () => {
    return (
        <div className="app-wrapper">
            <Navbar />
            <main className="app-content" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)' }}>
                <h1>Kullanım Koşulları</h1>
                <p>Son Güncelleme: {new Date().toLocaleDateString()}</p>
                <br />

                <h2>1. Kabul Edilme</h2>
                <p>GlobalMessage web sitesini kullanarak bu koşulları kabul etmiş sayılırsınız.</p>

                <h2>2. Kullanıcı Davranışı</h2>
                <p>Siteyi yasa dışı amaçlarla kullanamazsınız. Nefret söylemi, taciz, spam ve zararlı içerik paylaşımı yasaktır. Bu tür içerikler haber verilmeksizin kaldırılabilir ve hesabınız kapatılabilir.</p>

                <h2>3. Hesap Güvenliği</h2>
                <p>Hesap şifrenizin güvenliğinden siz sorumlusunuz. Hesabınızla yapılan tüm işlemler sizin sorumluluğunuzdadır.</p>

                <h2>4. İçerik Hakları</h2>
                <p>Paylaştığınız içeriklerin telif hakkı size aittir, ancak GlobalMessage'a bu içerikleri platformda gösterme hakkı tanırsınız.</p>

                <h2>5. Değişiklikler</h2>
                <p>Bu koşulları dilediğimiz zaman değiştirme hakkımız saklıdır.</p>
            </main>
        </div>
    );
};

export default TermsOfService;
