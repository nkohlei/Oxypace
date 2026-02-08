import Navbar from '../components/Navbar';

const Contact = () => {
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
                <h1>İletişim</h1>
                <br />
                <p>
                    Bizimle iletişime geçmek, soru, görüş veya önerilerinizi bildirmek için
                    aşağıdaki e-posta adresini kullanabilirsiniz.
                </p>
                <br />
                <div
                    style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px' }}
                >
                    <h3>E-posta</h3>
                    <p style={{ fontSize: '1.2rem', marginTop: '10px' }}>
                        <a
                            href="mailto:support@globalmessage.com"
                            style={{ color: 'var(--primary-color)' }}
                        >
                            support@globalmessage.com
                        </a>
                    </p>
                </div>
                <br />
                <p>
                    Geri bildirimleriniz bizim için değerlidir. En kısa sürede dönüş yapmaya
                    çalışacağız.
                </p>
            </main>
        </div>
    );
};

export default Contact;
