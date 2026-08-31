from curl_cffi import requests
import sys

sites = [
    'https://www.hdfilmcehennemi.nl/hd-prestij-izle-8/',
    'https://filmmakinesi.to/film/yuzuklerin-efendisi-yuzuk-kardesligi-izle-fm5/',
    'https://www.fullhdfilmizlesene.now/film/fisilti-adam-the-whisper-man/',
    'https://hdfilmizle.to/film/yuzuklerin-efendisi-yuzuk-kardesligi-izle/',
    'https://www.filmizlemesitesi.vip/',
    'https://www.zipfilmizle.net/buz-yolu-2-intikam-full-hd-film-izle/'
]

for url in sites:
    try:
        r = requests.get(url, impersonate="chrome124", timeout=12)
        print(f"[{r.status_code}] Len: {len(r.text)} => {url}")
    except Exception as e:
        print(f"[ERR] {url} => {e}")
