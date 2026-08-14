import dns from 'dns';

/**
 * Verifies whether an email address belongs to an existing and active mail domain in the world.
 * Performs syntax validation and real-time DNS MX / A record resolution.
 */
export const verifyEmailDomain = async (email) => {
    if (!email || typeof email !== 'string') {
        return { valid: false, message: 'Geçerli bir e-posta adresi girin.' };
    }

    const trimmed = email.trim().toLowerCase();
    const parts = trimmed.split('@');
    if (parts.length !== 2) {
        return { valid: false, message: 'Geçersiz e-posta formatı.' };
    }

    const [localPart, domain] = parts;

    if (!localPart || localPart.length > 64) {
        return { valid: false, message: 'Geçersiz e-posta kullanıcı adı.' };
    }

    // Domain syntax checks
    if (!domain || domain.length < 3 || !domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
        return { valid: false, message: 'Geçersiz e-posta alan adı (domain).' };
    }

    const tld = domain.split('.').pop();
    if (!tld || tld.length < 2) {
        return { valid: false, message: 'Geçersiz e-posta uzantısı.' };
    }

    // Real-time DNS MX Lookup with timeout
    const resolveWithTimeout = (promise, ms = 4000) => {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('DNS_TIMEOUT')), ms))
        ]);
    };

    try {
        const mxRecords = await resolveWithTimeout(dns.promises.resolveMx(domain));
        if (mxRecords && mxRecords.length > 0) {
            return { valid: true };
        }
    } catch (err) {
        // If MX lookup failed, try A record fallback (RFC 5321 specifies that if no MX exists, A/AAAA can receive mail)
        try {
            const aRecords = await resolveWithTimeout(dns.promises.resolve4(domain), 2000);
            if (aRecords && aRecords.length > 0) {
                return { valid: true };
            }
        } catch (aErr) {
            // Both MX and A record failed -> Domain does not exist or has no mail servers
            return {
                valid: false,
                message: 'Girilen e-posta alan adı aktif/geçerli bir e-posta sunucusuna sahip değil.'
            };
        }
        return {
            valid: false,
            message: 'Girilen e-posta alan adı aktif/geçerli bir e-posta sunucusuna sahip değil.'
        };
    }

    return {
        valid: false,
        message: 'Bu e-posta adresi için aktif bir posta sunucusu bulunamadı.'
    };
};
