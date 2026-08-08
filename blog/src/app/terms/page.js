import Header from "../blog/components/Header";
import Footer from "../blog/components/Footer";

export const metadata = {
  title: "Hizmet Şartları & Kullanım Koşulları - EVENT HORIZON | Oxypace",
  description: "Event Horizon & Oxypace Kullanım Koşulları, Yayın Hakları, Bağış Politikası ve Yasal Sorumluluk Metni.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col text-slate-100 bg-[#060913]">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
        <div className="glass-card p-8 md:p-12 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>
            <p className="font-mono text-xs text-sky-400 uppercase tracking-widest">TERMS & CONDITIONS OF SERVICE</p>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Hizmet Şartları ve Kullanım Koşulları
          </h1>
          <p className="text-sm text-slate-400 mb-8 border-b border-slate-800 pb-4 font-mono">
            Son Güncelleme Tarihi: 9 Şubat 2026 | Sürüm: 2.1
          </p>

          <div className="space-y-10 text-slate-300 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-sky-400 mb-4 border-l-4 border-sky-500 pl-3">
                1. Kabul ve Genel Şartlar
              </h2>
              <p className="mb-3">
                Bu web sitesine (https://oxypace.com.tr) ve bağımsız popüler bilim arşivi Event Horizon'a erişerek, içerikleri okuyarak veya platform servislerini kullanarak bu Hizmet Şartları'nı ("Koşullar") tamamen okuduğunuzu, anladığınızı ve bunlara uymayı kabul ettiğinizi beyan etmiş olursunuz.
              </p>
              <p>
                Eğer bu şartlardan herhangi birini kabul etmiyorsanız, lütfen web sitemizi ve bağlı servislerimizi kullanmayı derhal sonlandırınız.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-sky-400 mb-4 border-l-4 border-sky-500 pl-3">
                2. Fikri Mülkiyet ve Yayın Hakları
              </h2>
              <p className="mb-3">
                Oxypace ve Event Horizon platformunda yayınlanan tüm makaleler, akademik özetler, grafik tasarımları, logo, interaktif simülasyon kodları ve dijital materyaller Şirketimizin mülkiyetindedir veya lisanslı olarak kullanılmaktadır:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-300">
                <li>İçeriklerimizin kişisel, ticari olmayan eğitim ve araştırma amaçlı okunması ve paylaşılması serbesttir.</li>
                <li>İçeriklerimizin izin alınmaksızın aynen kopyalanması, başka mecralarda kaynak gösterilmeden yayınlanması veya ticari ürün haline getirilmesi kesinlikle yasaktır.</li>
                <li>Alıntı yapılması durumunda ilgili makaleye aktif ve doğrudan bağlantı (backlink) verilmesi zorunludur.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-sky-400 mb-4 border-l-4 border-sky-500 pl-3">
                3. Okuyucu Katkıları, Bağışlar ve Ödeme Politikası
              </h2>
              <p className="mb-3">
                Platformumuz, nitelikli bilimsel içerikleri bağımsız ve ücretsiz olarak sunmaya devam edebilmek amacıyla **Google Reader Revenue Manager** ve diğer destek araçlarını kullanmaktadır:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-300">
                <li><strong>Gönüllü Katkı / Bağış:</strong> Reader Revenue Manager üzerinden yapılan tüm katkılar tamamen gönüllülük esasına dayanır ve yayın faaliyetlerimizin sürdürülebilirliğini destekler.</li>
                <li><strong>İade Politikası:</strong> Gönüllü olarak yapılan bağış ve katkı ödemeleri, dijital hizmet ve bağımsız yayın desteği niteliğinde olduğundan (mevzuat aksini gerektirmedikçe) iade edilmez.</li>
                <li><strong>Ödeme Güvenliği:</strong> Tüm finansal işlemler Google Pay ve yetkili ödeme altyapısı sağlayıcıları güvencesinde gerçekleşir. Platformumuz kredi kartı bilgilerinizi asla saklamaz.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-sky-400 mb-4 border-l-4 border-sky-500 pl-3">
                4. Kullanım Kuralları ve Yasaklar
              </h2>
              <p className="mb-3">Platform ziyaretçileri ve kullanıcıları aşağıdaki eylemleri gerçekleştirmeyeceklerini taahhüt ederler:</p>
              <ul className="list-disc pl-6 space-y-1 text-slate-300">
                <li>Otomatik araçlar, botlar veya scraper'lar aracılığıyla altyapımıza aşırı yük getirecek şekilde veri çekimi yapmak,</li>
                <li>Sitenin güvenliğini ihlal etmeye veya sunuculara yetkisiz erişim sağlamaya çalışmak,</li>
                <li>Yasalara aykırı, telif hakkı ihlali barındıran veya zararlı içerik ya da yazılım yaymak,</li>
                <li>Yayınlanan içeriklerin altına kamu düzenini bozan, hakaret veya nefret söylemi içeren yorumlar yazmak.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-sky-400 mb-4 border-l-4 border-sky-500 pl-3">
                5. Sorumluluk Reddi (Bilimsel İncelemeler)
              </h2>
              <p>
                Event Horizon platformunda yayınlanan teorik fizik, astrofizik, ekstrem doğa şartları ve simülasyon analizleri bilgilendirme amacına yöneliktir. Sunulan bilimsel veriler ve hesaplama araçları "olduğu gibi" sağlanmakta olup, hayati veya tıbbi tavsiye niteliği taşımaz. Sitede yer alan bilgilerin kullanımından doğabilecek dolaylı zararlardan Şirketimiz sorumlu tutulamaz.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-sky-400 mb-4 border-l-4 border-sky-500 pl-3">
                6. Değişiklikler ve Yürürlük
              </h2>
              <p>
                Şirketimiz, bu Koşullar'ı dilediği zaman güncelleme hakkını saklı tutar. Güncellenmiş koşullar sitemizde yayınlandığı andan itibaren yürürlüğe girer. Değişikliklerden sonra platformu kullanmaya devam etmeniz, yeni şartları kabul ettiğiniz anlamına gelir.
              </p>
            </section>

            <section className="pt-4 border-t border-slate-800">
              <h2 className="text-xl font-bold text-white mb-3">7. İletişim</h2>
              <p className="mb-3 text-slate-300">
                Hizmet şartlarımız veya yayın politikamızla ilgili soru, öneri ve talepleriniz için iletişim bilgilerimiz:
              </p>
              <div className="p-5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 font-mono text-sm space-y-1">
                <p><strong>Yayıncı Kuruluş:</strong> Oxypace Inc. - Event Horizon Science Portal</p>
                <p><strong>E-posta:</strong> support@oxypace.com.tr</p>
                <p><strong>URL:</strong> https://oxypace.com.tr/terms</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
