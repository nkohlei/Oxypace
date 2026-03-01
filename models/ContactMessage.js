// models/ContactMessage.js
import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        subject: {
            type: String,
            required: true,
            enum: ['Genel', 'Destek', 'Geribildirim', 'Sikayet', 'Isbirligi'],
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ['unread', 'read', 'archived'],
            default: 'unread',
        },
    },
    { timestamps: true }
);

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

export default ContactMessage;
