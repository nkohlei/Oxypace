import WarpGridBackground from "./components/WarpGridBackground";

export const metadata = {
  title: "EVENT HORIZON - Popüler Bilim Arşivi | Oxypace",
  description: "Evrenin fizik sınırları ve ekstrem doğa koşulları üzerine bağımsız bilimsel arşiv.",
  openGraph: {
    title: "EVENT HORIZON - Popüler Bilim Arşivi | Oxypace",
    description: "Evrenin fizik sınırları ve ekstrem doğa koşulları üzerine bağımsız bilimsel arşiv.",
    url: "https://oxypace.com.tr/blog",
    siteName: "Oxypace - EVENT HORIZON",
    images: [
      {
        url: "https://oxypace.com.tr/logo.png",
        width: 512,
        height: 512,
        alt: "EVENT HORIZON",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
};

export default function BlogSubLayout({ children }) {
  return (
    <>
      <WarpGridBackground />
      {children}
    </>
  );
}

