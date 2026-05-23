import Parser from 'rss-parser';

const parser = new Parser();

const feeds = [
    'https://techcrunch.com/feed/',
    'https://www.theverge.com/rss/index.xml',
    'https://www.espn.com/espn/rss/news',
    'https://feeds.bbci.co.uk/sport/rss.xml'
];

async function testFeeds() {
    for (const url of feeds) {
        try {
            console.log(`Scanning: ${url}`);
            const feed = await parser.parseURL(url);
            console.log(`✅ Success. Title: ${feed.title}, Items count: ${feed.items?.length}`);
            if (feed.items && feed.items.length > 0) {
                console.log(`   Sample item title: ${feed.items[0].title}`);
                console.log(`   Sample item link: ${feed.items[0].link}`);
                console.log(`   Sample item guid: ${feed.items[0].guid}`);
            }
        } catch (e) {
            console.error(`❌ Failed: ${url}. Error: ${e.message}`);
        }
    }
}

testFeeds();
