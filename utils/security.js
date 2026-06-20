/**
 * Escapes special regex characters to prevent RegExp Injection and ReDoS attacks.
 * @param {string} str Input search term
 * @returns {string} Cleaned search term safe to put inside a RegExp constructor or MongoDB $regex query.
 */
export const escapeRegex = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
