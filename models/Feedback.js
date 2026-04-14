import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: ['Hata Bildirimi', 'Öneri', 'Şikayet', 'Genel', 'Genel İletişim'],
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        files: [
            {
                type: String,
            },
        ],
        status: {
            type: String,
            enum: ['new', 'reviewed', 'resolved', 'replied'],
            default: 'new',
        },
        adminResponse: {
            type: String,
        },
        repliedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
