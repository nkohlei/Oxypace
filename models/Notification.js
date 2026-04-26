import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        type: {
            type: String,
            enum: [
                'like',
                'comment',
                'reply',
                'follow',
                'follow_request',
                'system',
                'portal_invite',
                'message',
                'friend_connected',
                'portal_post',
            ],
            required: true,
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
        },
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
        },
        portal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Portal',
        },
        channel: {
            type: String, // 'general' or Channel ObjectId
        },
        read: {
            type: Boolean,
            default: false,
        },
        content: {
            type: String,
        },
        link: {
            type: String, // Optional direct link
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.pre('save', function (next) {
    this.wasNew = this.isNew;
    next();
});

notificationSchema.post('save', async function (doc) {
    // Only send push notification on initial creation
    if (!doc.wasNew) return;

    try {
        const User = mongoose.model('User');
        const recipient = await User.findById(doc.recipient).select('fcmTokens settings username profile.displayName');
        
        // Skip if user doesn't exist, has no tokens, or disabled push notifications
        if (!recipient || !recipient.fcmTokens || recipient.fcmTokens.length === 0) return;
        if (recipient.settings?.notifications?.push === false) return;

        let senderName = 'Oxypace';
        if (doc.sender) {
             const sender = await User.findById(doc.sender).select('username profile.displayName');
             if (sender) {
                 senderName = sender.profile?.displayName || sender.username;
             }
        }

        let title = 'Yeni Bildirim';
        let body = 'Oxypace\'ten yeni bir bildiriminiz var.';

        // Map notification types to localized push messages
        switch(doc.type) {
            case 'like': body = `${senderName} gönderini beğendi.`; break;
            case 'comment': body = `${senderName} gönderine yorum yaptı.`; break;
            case 'reply': body = `${senderName} yorumuna yanıt verdi.`; break;
            case 'follow_request': body = `${senderName} seninle tanışmak istiyor.`; break;
            case 'friend_connected': body = `${senderName} ile artık arkadaşsınız!`; break;
            case 'portal_post': body = `Portalında yeni bir paylaşım var.`; break;
            case 'message': body = `${senderName} sana bir mesaj gönderdi.`; break;
            case 'portal_invite': body = `${senderName} seni bir portala davet etti.`; break;
        }

        // Dynamically import push service to prevent circular dependencies
        const { sendPushNotification } = await import('../services/pushService.js');
        
        await sendPushNotification(recipient.fcmTokens, {
            title,
            body,
            data: {
                url: doc.link || '/',
                notificationId: doc._id.toString()
            }
        });
    } catch (error) {
        console.error('Push Notification Trigger Error:', error);
    }
});

export default mongoose.model('Notification', notificationSchema);
