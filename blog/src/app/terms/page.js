import Header from "../blog/components/Header";
import Footer from "../blog/components/Footer";

export const metadata = {
  title: "Hizmet Şartları - EVENT HORIZON | Oxypace",
  description: "Event Horizon & Oxypace Kullanım Koşulları ve Hizmet Şartları Bilgilendirmesi.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col text-slate-100 bg-[#060913]">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
        <div className="glass-card p-8 md:p-12 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <p className="font-mono text-xs text-sky-400 uppercase tracking-widest mb-2">TERMS OF SERVICE</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-6">
            Hizmet Şartları & Kullanım Koşulları
          </h1>
          <p className="text-sm text-slate-400 mb-8 border-b border-slate-800 pb-4">
            Son Güncelleme: 9 Şubat 2026
          </p>

          <div className="space-y-8 text-slate-300 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-xl font-bold text-sky-400 mb-3">01. Fikri Mülkiyet</h2>
              <p>
                Oxypace ve Event Horizon bünyesinde yayınlanan tüm makaleler, grafikler, yazılım kodları ve simülasyonlar 
                telif hakkı kanunları ile korunmaktadır. İzinsiz kopyalanması veya izinsiz ticari amaçla kullanımı yasaktır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-sky-400 mb-3">02. Sorumluluk Reddi</h2>
              <p>
                Sitemizde yer alan içerikler bilgilendirme ve eğitim amaçlıdır. Sunulan analizler ve veriler 
                resmi veya hukuki tavsiye niteliği taşımaz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-sky-400 mb-3">03. Kullanım Sınırlamaları</h2>
              <p>
                Sitenin altyapısına zarar verecek otomatik veri çekme (scraping), bot kullanımı ve siber saldırı girişimleri yasaktır. 
                Platform kurallarına uymayan erişimler engellenebilir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-sky-400 mb-3">04. Bağış ve Katkı İadeleri</h2>
              <p>
                Google Reader Revenue Manager üzerinden yapılan gönüllü katkılar ve bağışlar içerik üreticilerini desteklemek amacı taşır. 
                Aksi belirtilmedikçe yapılan gönüllü destek ödemeleri iade edilemez.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-sky-400 mb-3">05. İletişim</h2>
              <p>
                Hizmet şartları ile ilgili her türlü soru için bize ulaşabilirsiniz:
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
