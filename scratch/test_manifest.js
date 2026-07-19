import axios from 'axios';

const url = 'https://srv12.cdnimages1029.shop/hls/thelordoftherings-3-returnoftheking-2003-trdualmp4-E2B7vPUNnEx.mp4/txt/master.txt';

async function test() {
    try {
        console.log('Attempt 1: Without Referer/Origin...');
        const res1 = await axios.get(url, { timeout: 5000 });
        console.log('Success! Content length:', res1.data.length);
        console.log(res1.data.substring(0, 500));
        return;
    } catch (e) {
        console.log('Attempt 1 Failed:', e.message);
    }

    try {
        console.log('\nAttempt 2: With CDN Origin/Referer...');
        const res2 = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://srv12.cdnimages1029.shop/',
                'Origin': 'https://srv12.cdnimages1029.shop'
            },
            timeout: 5000
        });
        console.log('Success! Content length:', res2.data.length);
        console.log(res2.data.substring(0, 500));
        return;
    } catch (e) {
        console.log('Attempt 2 Failed:', e.message);
    }

    try {
        console.log('\nAttempt 3: Spoofing movie site Referer...');
        const res3 = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.hdfilmcehennemi.life/',
                'Origin': 'https://www.hdfilmcehennemi.life'
            },
            timeout: 5000
        });
        console.log('Success! Content length:', res3.data.length);
        console.log(res3.data.substring(0, 500));
        return;
    } catch (e) {
        console.log('Attempt 3 Failed:', e.message);
    }
}

test();
