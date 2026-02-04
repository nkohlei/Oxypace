import Parser from 'rss-parser';

class RSSService {
    constructor() {
        this.parser = new Parser();
    }

    async fetchFeed(feedUrl) {
        try {
            const feed = await this.parser.parseURL(feedUrl);
            console.log(`[RSSService] Fetched ${feed.items.length} items from ${feed.title}`);
            return feed.items;
        } catch (error) {
            console.error(`[RSSService] Error fetching feed ${feedUrl}:`, error.message);
            return [];
        }
    }
}

export default RSSService;
