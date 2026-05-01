import { constructProxiedUrl } from '../utils/mediaConfig.js';

const mockPortal = {
    name: 'Test Portal',
    banner: 'banner-1777638276590-578548050.gif',
    avatar: 'avatar-1777638921815-303820751.jpg'
};

console.log('Testing constructProxiedUrl with mock keys:');
console.log('Banner Key:', mockPortal.banner);
const finalImage = constructProxiedUrl(mockPortal.banner);
console.log('Final Image URL:', finalImage);

console.log('---');

console.log('Avatar Key:', mockPortal.avatar);
const finalAvatar = constructProxiedUrl(mockPortal.avatar);
console.log('Final Avatar URL:', finalAvatar);

if (finalImage && finalImage.includes('http')) {
    console.log('SUCCESS: URL is absolute');
} else {
    console.log('FAILURE: URL is relative or missing');
}
