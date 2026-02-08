import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export const sendVerificationEmail = async (email, username, token) => {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: '✨ Verify Your GlobalMessage Account',
        html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
          <h1 style="color: #667eea; margin-bottom: 20px; font-size: 28px;">Welcome to GlobalMessage! 🎉</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi <strong>${username}</strong>,</p>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Thank you for joining GlobalMessage! To complete your registration and start connecting with others, please verify your email address.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              Verify Email Address
            </a>
          </div>
          <p style="color: #777; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
          </p>
          <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            If you didn't create this account, please ignore this email.
          </p>
        </div>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
        console.error(`❌ Email sending failed: ${error.message}`);
        throw new Error('Failed to send verification email');
    }
};

export const sendPasswordResetEmail = async (email, username, code) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: '🔒 Şifre Sıfırlama Kodu - Oxypace',
        html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 16px;">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); text-align: center;">
          <h1 style="color: #333; margin-bottom: 20px; font-size: 24px;">Şifre Sıfırlama İsteği</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">Merhaba <strong>${username}</strong>,</p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Hesabınız için şifre sıfırlama talebi aldık. Şifrenizi sıfırlamak için aşağıdaki kodu kullanın:
          </p>
          
          <div style="margin: 30px 0;">
            <span style="display: inline-block; background: #eee; color: #333; padding: 15px 30px; border-radius: 8px; font-weight: 700; font-size: 32px; letter-spacing: 5px;">
              ${code}
            </span>
          </div>

          <p style="color: #888; font-size: 14px; margin-top: 20px;">
            Bu kod 15 dakika boyunca geçerlidir.
          </p>
          
          <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
          </p>
        </div>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent to ${email}`);
    } catch (error) {
        console.error(`❌ Email sending failed: ${error.message}`);
        throw new Error('Failed to send password reset email');
    }
};

export default transporter;
