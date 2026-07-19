import axios from 'axios';

const targetUrl = 'https://srv12.cdnimages2169.shop/hls/theusualsuspects19951080pdualmp4-JgOFoxXEuck.mp4/txt/master.txt';

async function runTest() {
    let origin = '';
    let referer = '';
    try {
        const parsedUrl = new URL(targetUrl);
        origin = parsedUrl.origin;
        referer = parsedUrl.origin + '/';
    } catch (e) {}

    const tlds = ['cx', 'life', 'cool', 'live', 'com.tr', 'de', 'be', 'vip', 'website', 'lol', 'cc', 'pro', 'pw', 'today', 'org', 'net', 'co', 'biz', 'info', 'us', 'me', 'tv', 'ws', 'xyz', 'online', 'site', 'store', 'tech', 'link', 'click', 'space', 'club', 'best', 'top', 'icu', 'win', 'bid', 'gdn', 'trade', 'loan', 'download', 'stream', 'date', 'party'];
    const refererList = [];
    tlds.forEach(tld => {
        refererList.push(`https://www.hdfilmcehennemi.${tld}/`);
        refererList.push(`https://hdfilmcehennemi.${tld}/`);
    });

    refererList.push(
        'https://www.filmmodu.org/',
        'https://filmmodu.org/',
        'https://www.filmmodu.dev/',
        'https://fullhdfilmizlesene.pw/',
        'https://www.fullhdfilmizlesene.pw/',
        'https://fullhdfilmizlesene.com/',
        'https://www.fullhdfilmizlesene.com/',
        origin + '/',
        '' // No referer fallback
    );

    console.log(`Total referrers to test: ${refererList.length}`);

    let response = null;
    let workingReferer = '';

    for (const ref of refererList) {
        try {
            let tempOrigin = '';
            if (ref) {
                tempOrigin = new URL(ref).origin;
            }
            console.log(`Testing: "${ref}" ...`);
            const res = await axios.get(targetUrl, {
                responseType: 'text',
                validateStatus: () => true,
                timeout: 2000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': '*/*',
                    ...(tempOrigin ? { 'Origin': tempOrigin } : {}),
                    ...(ref ? { 'Referer': ref } : {})
                }
            });
            console.log(`Status: ${res.status}`);
            if (res.status === 200 && res.data && (res.data.includes('#EXTM3U') || res.data.includes('#EXT-X-STREAM-INF') || res.data.includes('master') || res.data.includes('playlist') || res.data.includes('.txt') || res.data.includes('.m3u8'))) {
                response = res;
                workingReferer = ref;
                console.log(`\n🎉 WORKING REFERER FOUND: "${ref}"`);
                console.log('Manifest Start:');
                console.log(res.data.substring(0, 300));
                break;
            }
        } catch (err) {
            console.log(`Error testing "${ref}": ${err.message}`);
        }
    }

    if (!response) {
        console.log('\n❌ All referrers failed. Try direct fetch without referrer...');
        try {
            const res = await axios.get(targetUrl, {
                responseType: 'text',
                validateStatus: () => true,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': '*/*'
                }
            });
            console.log(`Direct fetch status: ${res.status}`);
            console.log(res.data.substring(0, 300));
        } catch (e) {
            console.log(`Direct fetch failed: ${e.message}`);
        }
    }
}

runTest();
