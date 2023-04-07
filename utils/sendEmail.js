import { createTransport } from 'nodemailer';

export const sendEmail = async(to, subject, text) => {
    const transporter = createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text
    };
    await transporter.sendMail(mailOptions);
};