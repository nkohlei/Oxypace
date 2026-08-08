import Header from "../blog/components/Header";
import Footer from "../blog/components/Footer";

export const metadata = {
  title: "Gizlilik Politikası - EVENT HORIZON | Oxypace",
  description: "Event Horizon & Oxypace Gizlilik Politikası ve Kişisel Verilerin Korunması Hakkında Bilgilendirme.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col text-slate-100 bg-[#060913]">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
        <div className="glass-card p-8 md:p-12 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <p className="font-mono text-xs text-sky-400 uppercase tracking-widest mb-2">PRIVACY POLICY</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-6">
            Gizlilik Politikası
          </h1>
          <p className="text-sm text-slate-400 mb-8 border-b border-slate-800 pb-4">
            Son Güncelleme: 9 Şubat 2026
          </p>

          <div className="space-y-8 text-slate-300 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-xl font-bold text-sky-400 mb-3">01. Veri Toplama ve Çerezler</h2>
              <p>
                Sitemiz, ziyaretçi trafiğini analiz etmek ve Google AdSense, Google Reader Revenue Manager gibi 
                üçüncü taraf hizmet ortaklarının kişiselleştirilmiş reklamlar ve içerikler sunabilmesi için çerezler (cookies) kullanmaktadır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-sky-400 mb-3">02. Üçüncü Taraf Servisler</h2>
              <p>
                Google dahil üçüncü taraf tedarikçiler, kullanıcıların web sitemize yaptığı önceki ziyaretlere dayalı olarak 
                reklam ve katkı/bağış seçenekleri sunmak üzere çerez kullanır. Toplanan veriler gizlilik standartlarına uygun olarak işlenir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-sky-400 mb-3">03. Veri Güvenliği</h2>
              <p>
                Toplanan tüm anonim analiz verileri ve kullanıcı tercihleri şifrelenmiş SSL/TLS protokolleri üzerinden iletilir ve güvenli sunucularda saklanır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-sky-400 mb-3">04. İletişim</h2>
              <p>
                Gizlilik politikamız veya kişisel verilerinizle ilgili sorularınız için bizimle iletişime geçebilirsiniz:
              </p>
              <div className="mt-3 p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 font-mono text-sm">
                E-posta: support@oxypace.com.tr
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
