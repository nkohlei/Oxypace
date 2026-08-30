(function() {
  function initOxypacePlayers() {
    const scriptTag = document.currentScript || document.querySelector('script[src*="embed.js"]');
    const baseUrl = scriptTag ? new URL(scriptTag.src).origin : window.location.origin;

    document.querySelectorAll('.oxypace-player[data-url]:not([data-oxypace-initialized])').forEach(function(el) {
      el.setAttribute('data-oxypace-initialized', 'true');
      const filmUrl = el.getAttribute('data-url');
      const width = el.getAttribute('data-width') || '100%';
      const height = el.getAttribute('data-height') || '500px';

      const iframe = document.createElement('iframe');
      iframe.src = baseUrl + '/player?url=' + encodeURIComponent(filmUrl);
      iframe.style.width = width;
      iframe.style.height = height;
      iframe.style.border = 'none';
      iframe.style.borderRadius = '12px';
      iframe.allow = 'autoplay; fullscreen';
      iframe.allowFullscreen = true;

      el.innerHTML = '';
      el.appendChild(iframe);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOxypacePlayers);
  } else {
    initOxypacePlayers();
  }

  window.OxypacePlayer = { init: initOxypacePlayers };
})();
