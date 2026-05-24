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

  // 4. Çerez kontrolü: Eğer admin_access çerezi varsa siteye normal erişime izin ver
  const hasAccess = context.cookies.get("admin_access") === "true";
  if (hasAccess) {
    return context.next();
  }

  // 5. Çerez yoksa, adres çubuğunu değiştirmeden arka planda sahte 404 sayfasına yönlendir (rewrite)
  return new URL("/404.html", request.url);
};
