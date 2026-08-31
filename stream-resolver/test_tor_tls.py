from curl_cffi import requests
import json

sites = [
    'https://www.hdfilmcehennemi.nl/hd-prestij-izle-8/',
    'https://filmmakinesi.to/film/yuzuklerin-efendisi-yuzuk-kardesligi-izle-fm5/',
    'https://www.fullhdfilmizlesene.now/film/fisilti-adam-the-whisper-man/',
    'https://hdfilmizle.to/film/yuzuklerin-efendisi-yuzuk-kardesligi-izle/',
    'https://www.filmizlemesitesi.vip/',
    'https://www.zipfilmizle.net/buz-yolu-2-intikam-full-hd-film-izle/'
]

proxies = {
    'http': 'socks5h://127.0.0.1:9050',
    'https': 'socks5h://127.0.0.1:9050'
}

for url in sites:
    try:
        r = requests.get(url, impersonate="chrome124", proxies=proxies, timeout=20)
        print(f"[{r.status_code}] Len: {len(r.text)} => {url}")
        if r.status_code == 200:
            print(f"   SUCCESS! Page Title/Snippet: {r.text[:200].strip().replace(chr(10), ' ')}")
    except Exception as e:
        print(f"[ERR] {url} => {e}")
