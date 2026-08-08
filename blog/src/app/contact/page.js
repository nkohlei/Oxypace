import Header from "../blog/components/Header";
import Footer from "../blog/components/Footer";

export const metadata = {
  title: "İletişim & Künye - EVENT HORIZON | Oxypace",
  description: "Event Horizon & Oxypace İletişim Bilgileri ve Yayıncı Bilgilendirmesi.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col text-slate-100 bg-[#060913]">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
        <div className="glass-card p-8 md:p-12 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <p className="font-mono text-xs text-sky-400 uppercase tracking-widest mb-2">MASTHEAD & CONTACT</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-6">
            İletişim & Künye
          </h1>

          <div className="space-y-8 text-slate-300 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-xl font-bold text-sky-400 mb-3">Yayın Sorumlusu & Yayıncı</h2>
              <p>
                <strong>Oxypace Inc. / Event Horizon Science Portal</strong><br />
                E-posta: support@oxypace.com.tr
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-sky-400 mb-3">Platform ve Altyapı</h2>
              <p>
                Oxypace platformu ve bilim arşivi Next.js mimarisiyle geliştirilmektedir.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
