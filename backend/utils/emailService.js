const nodemailer = require('nodemailer');

/**
 * Sends a password reset email using Gmail SMTP (Nodemailer).
 * Uses app-specific password for security - no need for domain verification.
 * Works immediately without any activation.
 */
async function sendResetPasswordEmail({ email, resetToken, frontendUrl }) {
    const resetUrl = `${frontendUrl}/forgot-password/${resetToken}`;
    const subject = 'Resetimi i fjalëkalimit';

    const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">UIBM Inventory</h2>
                <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Sistemi i Menaxhimit të Inventarit</p>
            </div>

            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 25px;" />

            <h3 style="color: #0f172a; font-size: 18px; font-weight: 600; margin-top: 0;">Kërkesë për resetim të fjalëkalimit</h3>
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                Përshëndetje,<br/><br/>
                Ju keni kërkuar të ndryshoni fjalëkalimin e llogarisë suaj. Klikoni butonin e mëposhtëm për të vazhduar me resetimin:
            </p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #1e293b; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Reset Password</a>
            </div>

            <p style="color: #64748b; font-size: 13px; line-height: 1.6; background-color: #f8fafc; padding: 12px; border-radius: 6px; border-left: 4px solid #cbd5e1;">
                <strong>Nëse butoni nuk funksionon</strong>, mund të kopjoni dhe ngjitni këtë link në shfletuesin tuaj:<br/>
                <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
            </p>

            <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin-top: 25px;">
                Nëse nuk e keni kërkuar ju këtë veprim, ju lutem injorojeni këtë email. Kjo lidhje është e vlefshme për 1 orë.
            </p>

            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0 15px 0;" />

            <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin: 0;">
                Kjo është një porosi e automatizuar, ju lutem mos u përgjigjni direkt në këtë email.
            </p>
        </div>
    `;

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
        throw new Error('EMAIL_USER dhe EMAIL_PASS mungojnë në konfigurimin e serverit. Shto ato te Railway Variables.');
    }

    console.log("📨 [EmailService] Duke dërguar email përmes Gmail SMTP...");

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass
            }
        });

        const mailOptions = {
            from: emailUser,
            to: email,
            subject: subject,
            html: htmlContent
        };

        const result = await transporter.sendMail(mailOptions);
        console.log("✅ [EmailService] Email-i u dërgua me sukses përmes Gmail!", result);
        return { success: true, provider: 'gmail', data: result };
    } catch (error) {
        console.error("❌ [EmailService] Gmail SMTP refuzoi dërgimin:", error.message);
        throw new Error(`Email Service Error: ${error.message}`);
    }
}

module.exports = {
    sendResetPasswordEmail
};
