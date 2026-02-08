const testProxy = async () => {
    // Constructed URL based on the extracted key
    const proxyUrl =
        'https://oxypace.vercel.app/r2-media/posts/69485e416ce2eac8943a5de2/media-1770384355362-980777708.jpg';

    console.log('Testing connectivity to:', proxyUrl);

    try {
        const response = await fetch(proxyUrl);
        console.log('Response Status:', response.status);
        console.log('Response Headers Content-Type:', response.headers.get('content-type'));

        if (response.status === 200) {
            console.log('✅ SUCCCESS! Vercel Proxy is WORKING correctly.');
            console.log('This proves that oxypace.vercel.app is successfully fetching from R2.');
        } else {
            console.log('❌ FAILED. Response was not 200 OK.');
        }
    } catch (error) {
        console.error('❌ Connection Error:', error.message);
    }
};

testProxy();
