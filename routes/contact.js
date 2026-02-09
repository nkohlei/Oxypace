import express from 'express';
import nodemailer from 'nodemailer';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// E-posta gönderim servisi (Gmail SMTP örneği)
// Gerçek ortamda .env dosyasından çekilmelidir: SMTP_HOST, SMTP_USER, SMTP_PASS
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER || 'nqohlei@gmail.com', // Gönderen yine kendi maili olabilir veya bir 'no-reply' hesabı
        pass: process.env.SMTP_PASS // Google App Password gerektirir
    }
});

router.post('/', protect, async (req, res) => {
    try {
        const { subject, message } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        // Email içeriği
        const mailOptions = {
            from: `"${user.username}" <${user.email}>`, // Görnen gönderen (teknik olarak SMTP user tarafından gönderilir)
            to: 'nqohlei@gmail.com', // Hedef e-posta
            subject: `Oxypace İletişim: ${subject} (${user.username})`,
            text: `
                Gönderen: ${user.username} (${user.email})
                Tarih: ${new Date().toLocaleString()}
                
                Mesaj:
                ${message}
            `,
            replyTo: user.email // Yanıtla denilince kullanıcıya gitsin
        };

        // Eğer SMTP ayarları yoksa (Development/Test) sadece loglayalım
        if (!process.env.SMTP_PASS) {
            console.log('--- MOCK EMAIL SENT ---');
            console.log(mailOptions);
            return res.status(200).json({ success: true, message: 'Mesajınız alındı (Mock Mode)' });
        }

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Mesajınız başarıyla gönderildi.' });

    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({ message: 'Mesaj gönderilemedi, lütfen daha sonra tekrar deneyin.' });
    }
});

export default router;
