export const adsConfig = {
  enableAds: true,
  enableProgrammaticAds: true,
  
  // Sample VAST XML ad tag URL
  EXTERNAL_AD_TAG_URL: 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/12431902/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=',
  
  // Sample Ad video fallback (MP4 format)
  preRollAdUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  
  // List of possible post ads to cycle or show randomly (internal fallback)
  postAds: [
    {
      id: 'ad-1',
      title: 'Oxypace Premium ile Sınırları Kaldırın',
      content: 'Özel rozetler, sınırsız canlı yayın süresi ve yüksek kaliteli sesli/görüntülü sohbet ayrıcalıklarına sahip olmak için şimdi Oxypace Premium\'a yükseltin.',
      ctaText: 'Detayları Gör',
      ctaUrl: '/settings?tab=premium',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
    },
    {
      id: 'ad-2',
      title: 'Kendi Topluluğunu İnşa Et',
      content: 'Gelişmiş moderasyon araçları, özel ses odaları ve portal içi özelleştirmelerle kendi portalını ücretsiz olarak oluştur.',
      ctaText: 'Hemen Portal Kur',
      ctaUrl: '#create-portal',
      image: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=60',
    }
  ]
};
