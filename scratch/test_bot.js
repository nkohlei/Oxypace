import axios from 'axios';

async function runTests() {
    console.log('?? STARTING GOOGLEBOT SIMULATION TEST...\n');
    let passed = true;

    // Test 1: Request with normal user agent
    try {
        console.log('Test 1: Requesting bot-feed with normal User-Agent...');
        await axios.get('http://localhost:5000/api/posts/bot-feed', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        console.error('? Test 1 FAILED: Allowed access to normal User-Agent without authentication!');
        passed = false;
    } catch (err) {
        if (err.response && err.response.status === 403) {
            console.log('? Test 1 PASSED: Successfully blocked normal User-Agent (403 Forbidden).');
        } else {
            console.error('? Test 1 FAILED: Unexpected error:', err.message);
            passed = false;
        }
    }

    console.log('');

    // Test 2: Request with Googlebot user agent
    try {
        console.log('Test 2: Requesting bot-feed with Googlebot User-Agent...');
        const res = await axios.get('http://localhost:5000/api/posts/bot-feed', {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
        });
        
        if (res.status === 200 && res.data && Array.isArray(res.data.posts)) {
            console.log(`? Test 2 PASSED: Successfully fetched Global Feed with Googlebot User-Agent. Received ${res.data.posts.length} posts!`);
        } else {
            console.error('? Test 2 FAILED: Response was not valid:', res.status, res.data);
            passed = false;
        }
    } catch (err) {
        console.error('? Test 2 FAILED: Request failed:', err.message);
        if (err.response) {
            console.error('Response status:', err.response.status);
            console.error('Response data:', err.response.data);
        }
        passed = false;
    }

    console.log('');

    // Test 3: Verify sitemap structure
    try {
        console.log('Test 3: Fetching sitemap.xml...');
        const res = await axios.get('http://localhost:5000/sitemap.xml');
        const xml = res.data;
        
        const hasPortalLinks = xml.includes('/portal/');
        const hasChannelLinks = xml.includes('?channel=');
        const hasPostLinks = xml.includes('&amp;post=') || xml.includes('post=');

        if (hasPortalLinks && hasChannelLinks && hasPostLinks) {
            console.log('? Test 3 PASSED: sitemap.xml contains public portals, channel URLs, and nested post URLs.');
        } else {
            console.error('? Test 3 FAILED: sitemap.xml lacks expected structure.');
            console.log('Sitemap snippet:', xml.substring(0, 1000));
            passed = false;
        }
    } catch (err) {
        console.error('? Test 3 FAILED: Request failed:', err.message);
        passed = false;
    }

    console.log('\n-----------------------------------------');
    if (passed) {
        console.log('?? OVERALL RESULT: BAÞARILI');
        process.exit(0);
    } else {
        console.log('? OVERALL RESULT: BAÞARISIZ');
        process.exit(1);
    }
}

runTests();
