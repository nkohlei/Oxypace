/**
 * Converts URLs in text to clickable links.
 * Returns an array of React elements (strings and <a> tags).
 */
export const linkifyText = (text) => {
    if (!text || typeof text !== 'string') return text;

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

/**
 * Truncates text while preserving full URLs.
 * Returns an object: { elements: ReactNode[], isTruncated: boolean }
 */
export const truncateAndLinkifyText = (text, maxLength) => {
    if (!text || typeof text !== 'string') {
        return { elements: text, isTruncated: false };
    }

    if (text.length <= maxLength) {
        return { elements: linkifyText(text), isTruncated: false };
    }

    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const parts = text.split(urlRegex);

    let currentLength = 0;
    const elements = [];
    let isTruncated = false;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        if (urlRegex.test(part)) {
            urlRegex.lastIndex = 0;
            elements.push(
                <a
                    key={`url-${i}`}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="linkified-url"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part.length > 50 ? part.substring(0, 50) + '...' : part}
                </a>
            );
            // Count full URL length towards limits to prevent too many URLs rendering
            currentLength += part.length;

            // If we hit or exceed length limit, mark as truncated and stop
            // But only if there is still text remaining
            if (currentLength >= maxLength && i < parts.length - 1 && parts.slice(i + 1).some(p => p.trim().length > 0)) {
                isTruncated = true;
                elements.push('...');
                break;
            }
        } else {
            if (currentLength + part.length > maxLength) {
                const remaining = maxLength - currentLength;
                let truncatedText = part.substring(0, remaining);
                const lastSpace = truncatedText.lastIndexOf(' ');
                // Avoid cutting the word too awkwardly
                if (lastSpace > 0 && remaining > 20) {
                    truncatedText = truncatedText.substring(0, lastSpace);
                }
                elements.push(<span key={`text-${i}`}>{truncatedText}...</span>);
                isTruncated = true;
                break;
            } else {
                elements.push(<span key={`text-${i}`}>{part}</span>);
                currentLength += part.length;
            }
        }
    }

    return { elements, isTruncated };
};
