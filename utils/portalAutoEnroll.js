import Portal from '../models/Portal.js';
import User from '../models/User.js';

/**
 * Auto-enroll a user into the default "Oxypace Tanıtım" portal
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<Object|null>} The portal object if enrolled
 */
export async function enrollInTanitimPortal(userId) {
    if (!userId) return null;
    try {
        const tanitimPortal = await Portal.findOne({
            name: { $regex: /^Oxypace Tanıtım$/i }
        });

        if (!tanitimPortal) {
            // Fallback search without Turkish character if needed
            const fallbackPortal = await Portal.findOne({
                name: { $regex: /^Oxypace Tanitim$/i }
            });
            if (!fallbackPortal) {
                return null;
            }
            return await applyEnrollment(fallbackPortal, userId);
        }

        return await applyEnrollment(tanitimPortal, userId);
    } catch (err) {
        console.error('⚠️ enrollInTanitimPortal error:', err.message);
        return null;
    }
}

async function applyEnrollment(portal, userId) {
    const userIdStr = userId.toString();
    const isMember = (portal.members || []).some(m => (m._id || m).toString() === userIdStr);

    if (!isMember) {
        await Portal.findByIdAndUpdate(portal._id, {
            $addToSet: { members: userId }
        });
    }

    await User.findByIdAndUpdate(userId, {
        $addToSet: { joinedPortals: portal._id }
    });

    return portal;
}
