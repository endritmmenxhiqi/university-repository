const nodemailer = require('nodemailer');
const https = require('https');
const dns = require('dns');

// Prioritize IPv4 for DNS resolution to prevent ENETUNREACH errors on cloud hosting platforms (e.g. Railway)
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

/**
 * Helper function to send HTTP POST requests using Node's native 'https' module.
 * This guarantees compatibility with all Node.js versions without needing external dependencies.
 */
function sendHttpRequest(url, headers, body) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const bodyStr = JSON.stringify(body);
        
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                ...headers,
                'Content-Length': Buffer.byteLength(bodyStr)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ 
                        ok: res.statusCode >= 200 && res.statusCode < 300, 
                        status: res.statusCode, 
                        body: parsed 
                    });
                } catch (e) {
                    resolve({ 
                        ok: res.statusCode >= 200 && res.statusCode < 300, 
                        status: res.statusCode, 
                        body: data 
                    });
                }
            });
        });

        req.on('error', (e) => reject(e));
        
        // Set a timeout of 10 seconds for the request
        req.setTimeout(10000, () => {
            req.destroy(new Error('Request timed out'));
        });

        req.write(bodyStr);
        req.end();
    });
}

/**
 * Sends a password reset email.
 * 
 * Flow:
 * 1. Checks if a valid RESEND_API_KEY is configured in the environment.
 *    If yes, it uses the Resend Web API over HTTPS (port 443).
 *    This is extremely reliable and immune to SMTP port blocking (common on Render, Railway, AWS, etc.).
 * 2. If no valid Resend key is present, it falls back to Nodemailer SMTP (Gmail).
 *    It uses explicit robust settings (port 465, timeouts, TLS fallback) instead of the generic 'gmail' service.
 * 
 * @param {Object} params
 * @param {string} params.email - Recipient email
 * @param {string} params.resetToken - Password reset token
 * @param {string} params.frontendUrl - Frontend base URL
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
                <a href="${resetUrl}" style="background-color: #1e293b; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: background-color 0.2s;">Reset Password</a>
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

    // 1. Try Resend HTTP API if a valid key is provided
    const resendApiKey = process.env.RESEND_API_KEY;
    const hasResendKey = resendApiKey && resendApiKey !== 're_your_api_key_here' && resendApiKey.trim() !== '';

    if (hasResendKey) {
        console.log("📨 [EmailService] Resend API Key e vlefshme u detektua. Duke dërguar me Resend API...");
        try {
            // By default Resend free tier uses 'onboarding@resend.dev'.
            // If the user has configured their own domain, they can update this.
            const fromEmail = 'onboarding@resend.dev';
            
            const response = await sendHttpRequest(
                'https://api.resend.com/emails',
                {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                {
                    from: `UIBM Inventory <${fromEmail}>`,
                    to: email,
                    subject: subject,
                    html: htmlContent
                }
            );

            if (response.ok) {
                console.log("✅ [EmailService] Email-i u dërgua me sukses përmes Resend API!", response.body);
                return { success: true, provider: 'resend', data: response.body };
            } else {
                console.warn("⚠️ [EmailService] Resend API ktheu një gabim:", response.body);
                console.log("🔄 [EmailService] Duke provuar SMTP si fallback...");
            }
        } catch (apiError) {
            console.error("❌ [EmailService] Gabim gjatë dërgimit përmes Resend API:", apiError.message);
            console.log("🔄 [EmailService] Duke provuar SMTP si fallback...");
        }
    }

    // 2. Fallback to SMTP
    console.log("📨 [EmailService] Duke dërguar email-in përmes SMTP...");
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Konfigurimi i email-it (EMAIL_USER ose EMAIL_PASS) mungon në skedarin .env. Nuk mund të vazhdohet me dërgimin.");
    }

    // Configure Nodemailer transporter explicitly
    // Port 465 (SSL/TLS) is typically more reliable, but we set a custom timeout to fail quickly if blocked.
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // SSL/TLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 10000, // 10 seconds timeout before giving up
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: {
            rejectUnauthorized: false // Avoid self-signed certificate/SSL handshake rejection issues
        }
    });

    const mailOptions = {
        from: `"UIBM Inventory" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ [EmailService] Email-i u dërgua me sukses përmes SMTP!", info.messageId);
    return { success: true, provider: 'smtp', info };
}

module.exports = {
    sendResetPasswordEmail
};
