import axios from 'axios';

const url = 'https://srv12.cdnimages2169.shop/hls/theusualsuspects19951080pdualmp4-JgOFoxXEuck.mp4/txt/master.txt';

const referers = [
    'https://www.hdfilmcehennemi.cx/',
    'https://www.hdfilmcehennemi.life/',
    'https://www.hdfilmcehennemi.com.tr/',
    'https://www.hdfilmcehennemi.net/',
    'https://www.hdfilmcehennemi.club/',
    'https://www.hdfilmcehennemi.com/',
    'https://hdfilmcehennemi.live/',
    'https://filmmodu.org/',
    'https://www.filmmodu.org/',
    'https://fullhdfilmizlesene.com/',
    'https://www.fullhdfilmizlesene.com/',
    'https://fullhdfilmizlesene.pw/',
    'https://www.fullhdfilmizlesene.pw/',
    'https://dizipal.com/',
    'https://www.dizipal.com/',
    'https://dizipal555.com/',
    'https://dizipal812.com/',
    'https://webteizle.one/',
    'https://www.webteizle.one/',
    'https://sinefy.com/',
    'https://www.sinefy.com/'
];

async function test() {
    for (const ref of referers) {
        try {
            console.log(`Testing referer: ${ref}...`);
            const parsed = new URL(ref);
            const res = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': ref,
                    'Origin': parsed.origin
                },
                timeout: 5000
            });
            console.log(`SUCCESS with referer: ${ref}! Length: ${res.data.length}`);
            console.log(res.data.substring(0, 500));
            return;
        } catch (e) {
            console.log(`Failed (Status ${e.response?.status || 'network error'}): ${e.message}`);
        }
    }
    console.log('All tested referers failed.');
}

test();
