import axios from 'axios';
import ogs from 'open-graph-scraper-lite';

async function fetchGenericPreview(originalUrl) {
    try {
        const { data: html } = await axios.get(originalUrl, {
            timeout: 8000,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            responseType: 'text',
            validateStatus: (status) => status < 400,
        });

        if (!html || typeof html !== 'string') return null;

        const trimmedHtml = html.substring(0, 250000);
        const { result } = await ogs({ html: trimmedHtml });
        const hostname = new URL(originalUrl).hostname.replace('www.', '');
        
        let imageUrl = '';
        if (result?.ogImage) {
            if (Array.isArray(result.ogImage) && result.ogImage.length > 0) {
                imageUrl = result.ogImage[0]?.url || result.ogImage[0] || '';
            } else if (typeof result.ogImage === 'object') {
                imageUrl = result.ogImage.url || '';
            } else if (typeof result.ogImage === 'string') {
                imageUrl = result.ogImage;
            }
        }

        if (!imageUrl && result?.twitterImage) {
            if (Array.isArray(result.twitterImage) && result.twitterImage.length > 0) {
                imageUrl = result.twitterImage[0]?.url || result.twitterImage[0] || '';
            } else if (typeof result.twitterImage === 'object') {
                imageUrl = result.twitterImage.url || '';
            } else if (typeof result.twitterImage === 'string') {
                imageUrl = result.twitterImage;
            }
        }

        if (!imageUrl) {
            const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || 
                                html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
            if (ogImageMatch && ogImageMatch[1]) {
                imageUrl = ogImageMatch[1];
            }
        }
        if (!imageUrl) {
            const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                                      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
            if (twitterImageMatch && twitterImageMatch[1]) {
                imageUrl = twitterImageMatch[1];
            }
        }

        return {
            title: result?.ogTitle || result?.twitterTitle || hostname,
            image: imageUrl,
            url: originalUrl,
        };
    } catch (err) {
        console.error('Error:', err.message);
        return null;
    }
}

fetchGenericPreview('https://deadline.com/').then(res => {
    console.log('Results:', res);
});
