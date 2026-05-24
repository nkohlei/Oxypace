let isMaintenanceCached = null;
let lastFetched = 0;

async function getMaintenanceStatus() {
  const now = Date.now();
  // Son fetch işleminden beri 5 saniye geçmediyse önbellekteki değeri dön
  if (isMaintenanceCached !== null && (now - lastFetched < 5000)) {
    return isMaintenanceCached;
  }
  try {
    const res = await fetch("https://unlikely-rosamond-oxypace-e695aebb.koyeb.app/api/auth/maintenance-status");
    if (!res.ok) return false;
    const data = await res.json();
    isMaintenanceCached = !!data.active;
    lastFetched = now;
    return isMaintenanceCached;
  } catch (e) {
    console.error("Failed to fetch maintenance status in Edge Function:", e);
    return false; // Hata durumunda siteyi açık tut (fail-safe)
  }
}

export default async (request, context) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Statik dosya isteklerini (js, css, resimler vb.) doğrudan geçir
  const isStaticAsset = pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?|map|json|txt|webmanifest)$/i);
  if (isStaticAsset) {
    return context.next();
  }

  // 2. API, WebSocket, medya yolları ve hata sayfasının kendisini doğrudan geçir
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/socket.io/") ||
    pathname.startsWith("/r2-media/") ||
    pathname === "/404.html"
  ) {
    return context.next();
  }

  // 3. Gizli erişim parametresi kontrolü (?access=oxypace)
  if (url.searchParams.get("access") === "oxypace") {
    // 30 gün geçerli admin çerezi ata
    context.cookies.set({
      name: "admin_access",
      value: "true",
      path: "/",
      maxAge: 2592000, // 30 gün (saniye)
      secure: true,
      sameSite: "Lax",
    });

    // Parametreyi temizlemek için kullanıcının bulunduğu sayfaya (parametresiz olarak) yönlendir
    url.searchParams.delete("access");
    return Response.redirect(url.toString(), 307);
  }

  // 4. Bakım Modu aktif mi kontrol et
  const isMaintenance = await getMaintenanceStatus();
  if (!isMaintenance) {
    return context.next(); // Bakım aktif değilse herkes normal erişebilir
  }

  // 5. Bakım aktifse çerez kontrolü yap: Eğer admin_access çerezi varsa siteye normal erişime izin ver
  const hasAccess = context.cookies.get("admin_access") === "true";
  if (hasAccess) {
    return context.next();
  }

  // 6. Çerez yoksa ve bakım aktifse sahte 404 sayfasına yönlendir (rewrite)
  return new URL("/404.html", request.url);
};
