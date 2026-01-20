/**
 * Converts URLs in text to clickable links.
 * Returns an array of React elements (strings and <a> tags).
 */
export const linkifyText = (text) => {
    if (!text) return null;

    // Regex to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/gi;

    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
        if (urlRegex.test(part)) {
            // Reset regex lastIndex
            urlRegex.lastIndex = 0;
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="linkified-url"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part.length > 50 ? part.substring(0, 50) + '...' : part}
                </a>
            );
        }
        return part;
    });
};
