import Header from "../blog/components/Header";
import Footer from "../blog/components/Footer";

export const metadata = {
  title: "Gizlilik Politikası - EVENT HORIZON | Oxypace",
  description: "Event Horizon & Oxypace Gizlilik Politikası, Çerez Kullanımı ve Kişisel Verilerin Korunması Hakkında Detaylı Bilgilendirme.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col text-slate-100 bg-[#060913]">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
        <div className="glass-card p-8 md:p-12 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>
            <p className="font-mono text-xs text-sky-400 uppercase tracking-widest">KVKK & GDPR COMPLIANT PRIVACY POLICY</p>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Gizlilik Politikası ve Kişisel Verilerin Korunması
          </h1>
          <p className="text-sm text-slate-400 mb-8 border-b border-slate-800 pb-4 font-mono">
            Son Güncelleme Tarihi: 9 Şubat 2026 | Sürüm: 2.1
          </p>

          <div className="space-y-10 text-slate-300 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-sky-400 mb-4 border-l-4 border-sky-500 pl-3">
                1. Giriş ve Amaç
              </h2>
              <p className="mb-3">
                Oxypace ve Event Horizon ("Şirket", "Biz" veya "Platform") olarak, kullanıcılarımızın ve ziyaretçilerimizin gizliliğine son derece önem veriyoruz. Bu Gizlilik Politikası, sitemizi (https://oxypace.com.tr) ve bağlı servisleri ziyaret ettiğinizde veya kullandığınızda kişisel verilerinizin nasıl toplandığını, işlendiğini, saklandığını ve korunduğunu ayrıntılı biçimde açıklamak amacıyla hazırlanmıştır.
              </p>
              <p>
                Platformumuzu kullanarak ve içeriklerimizi inceleyerek bu politikada belirtilen veri işleme usullerini kabul etmiş sayılırsınız.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-sky-400 mb-4 border-l-4 border-sky-500 pl-3">
                2. Toplanan Veri Türleri ve Yöntemleri
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-white text-base mb-1">A. Doğrudan Tarafınızca Sağlanan Veriler:</h3>
                  <ul className="list-disc pl-6 space-y-1 text-slate-300">
                    <li><strong>Hesap ve Kayıt Bilgileri:</strong> Kayıt olurken veya bültene kaydolurken verdiğiniz ad, kullanıcı adı, e-posta adresi ve şifrelenmiş kimlik doğrulama verileri.</li>
                    <li><strong>Gönüllü Katkı ve Ödeme Bilgileri:</strong> Google Reader Revenue Manager veya bağış sistemleri üzerinden sağlanan desteklerde işlenen işlem referans numaraları ve faturalandırma e-postaları.</li>
                    <li><strong>İletişim Bilgileri:</strong> Destek ekibimize gönderdiğiniz mesajlar, geri bildirimler ve talep formları.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base mb-1">B. Otomatik Olarak ve Teknik Araçlarla Toplanan Veriler:</h3>
                  <ul className="list-disc pl-6 space-y-1 text-slate-300">
                    <li><strong>Cihaz ve Erişim Bilgileri:</strong> IP adresiniz, tarayıcı türünüz ve sürümünüz, işletim sisteminiz, ekran çözünürlüğü ve cihaz türü.</li>
                    <li><strong>Analitik ve Trafik Verileri:</strong> Ziyaret edilen sayfalar, kalınan süreler, yönlendirici bağlantılar (referrer URLs), tıklama haritaları ve gezinme akışları.</li>
                    <li><strong>Çerezler ve Yerel Depolama (LocalStorage/SessionStorage):</strong> Oturum devamlılığını sağlamak, tema tercihlerinizi hatırlamak ve reklam/katkı modüllerini doğru çalıştırmak için kullanılan veri parçacıkları.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-sky-400 mb-4 border-l-4 border-sky-500 pl-3">
                3. Verilerin Kullanım Amaçları
              </h2>
              <p className="mb-3">Toplanan verileriniz strictly aşağıdaki yasal ve teknik amaçlar doğrultusunda işlenmektedir:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-300">
                <li>Platform hizmetlerinin kesintisiz, güvenli ve performanslı bir şekilde sunulması.</li>
                <li>Google Reader Revenue Manager ve AdSense entegrasyonları ile okuyucu katkılarının (bağışların) ve kişiselleştirilmiş yayınların yönetilmesi.</li>
                <li>Platform güvenliğinin sağlanması, yetkisiz erişimlerin, hileli işlemlerin ve siber saldırıların engellenmesi.</li>
                <li>Kullanıcı deneyimini geliştirmek adına anonim istatistiksel analizlerin ve performans ölçümlerinin yapılması.</li>
                <li>Yasal mevzuattan doğan bilgi saklama ve resmi makamlara bildirim yükümlülüklerinin yerine getirilmesi.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-sky-400 mb-4 border-l-4 border-sky-500 pl-3">
                4. Üçüncü Taraf Servisler ve Çerez Politikası
              </h2>
              <p className="mb-3">
                Sitemizde Google LLC tarafından sunulan **Google AdSense** ve **Google Reader Revenue Manager (SWG)** altyapıları kullanılmaktadır. Bu servisler:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-300">
                <li>Kullanıcıların ilgi alanlarına uygun içerik, yayın desteği ve reklam seçenekleri sunmak amacıyla birinci ve üçüncü taraf çerezlerden (cookies) yararlanabilir.</li>
                <li>Google'ın verileri nasıl işlediği ve çerez yönetimi hakkında ayrıntılı bilgi için <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline hover:text-sky-300">Google Gizlilik Politikası</a>'nı ziyaret edebilirsiniz.</li>
                <li>Dilerseniz tarayıcı ayarlarınız üzerinden çerez kullanımını kısıtlayabilir veya tamamen engelleyebilirsiniz.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-sky-400 mb-4 border-l-4 border-sky-500 pl-3">
                5. Veri Saklama ve Güvenlik Önlemleri
              </h2>
              <p>
                Kişisel verileriniz endüstri standardı olan 256-bit SSL/TLS şifreleme protokolleri ile korunan sunucularda barındırılır. Veri güvenliğini sağlamak için düzenli güvenlik taramaları, erişim yetkilendirmeleri ve güvenlik duvarı önlemleri uygulanmaktadır. Verileriniz, yasal zorunluluklar saklı kalmak kaydıyla, işleme amacının gerektirdiği süre boyunca saklanır.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-sky-400 mb-4 border-l-4 border-sky-500 pl-3">
                6. Kullanıcı Hakları (KVKK & GDPR)
              </h2>
              <p className="mb-3">Kişisel Verilerin Korunması Kanunu (KVKK) ve GDPR kapsamında aşağıdaki haklara sahipsiniz:</p>
              <ul className="list-disc pl-6 space-y-1 text-slate-300">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme ve bilgi talep etme,</li>
                <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
                <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme,</li>
                <li>Kanuni şartlar çerçevesinde verilerin silinmesini veya yok edilmesini talep etme,</li>
                <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme.</li>
              </ul>
            </section>

            <section className="pt-4 border-t border-slate-800">
              <h2 className="text-xl font-bold text-white mb-3">7. İletişim ve Veri Sorumlusu</h2>
              <p className="mb-3 text-slate-300">
                Gizlilik politikamız, haklarınız veya veri işleme süreçlerimizle ilgili her türlü soru ve talepleriniz için veri sorumlumuzla iletişime geçebilirsiniz:
              </p>
              <div className="p-5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 font-mono text-sm space-y-1">
                <p><strong>Kurum / Yayıncı:</strong> Oxypace Inc. - Event Horizon Science Portal</p>
                <p><strong>E-posta:</strong> support@oxypace.com.tr</p>
                <p><strong>Resmi Web Sitesi:</strong> https://oxypace.com.tr</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
