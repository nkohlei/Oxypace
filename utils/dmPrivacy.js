/**
 * Computes direct message (DM) permission for a viewer targeting another user.
 * Matches the enforcement rules in POST /api/messages.
 */
export const computeDmAccess = (targetUser, viewer) => {
    const dmSettings = targetUser?.settings?.privacy?.dmSettings || 'everyone';

    if (targetUser?.isSystemAccount) {
        return {
            dmSettings,
            canMessage: false,
            dmBlockReason: 'Bu hesap doğrudan mesaj kabul etmemektedir.',
        };
    }

    if (!viewer) {
        return {
            dmSettings,
            canMessage: dmSettings === 'everyone',
            dmBlockReason: dmSettings === 'everyone' ? null : 'Mesaj göndermek için giriş yapmalısınız.',
        };
    }

    const viewerIdStr = viewer._id ? String(viewer._id) : '';
    const targetIdStr = targetUser?._id ? String(targetUser._id) : '';

    if (viewerIdStr && targetIdStr && viewerIdStr === targetIdStr) {
        return { dmSettings, canMessage: true, dmBlockReason: null };
    }

    if (viewer.isAdmin) {
        return { dmSettings, canMessage: true, dmBlockReason: null };
    }

    if (dmSettings === 'none') {
        return {
            dmSettings,
            canMessage: false,
            dmBlockReason: 'Bu kullanıcı doğrudan mesaj almayı kapatmıştır.',
        };
    }

    if (dmSettings === 'friends') {
        const isFriend =
            (targetUser?.followers || []).some((id) => String(id?._id || id) === viewerIdStr) &&
            (targetUser?.following || []).some((id) => String(id?._id || id) === viewerIdStr);

        if (!isFriend) {
            return {
                dmSettings,
                canMessage: false,
                dmBlockReason: 'Bu kullanıcıya yalnızca arkadaşları doğrudan mesaj gönderebilir.',
            };
        }
    }

    return { dmSettings, canMessage: true, dmBlockReason: null };
};
