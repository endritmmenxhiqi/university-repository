const https = require('node:https');
const nodemailer = require('nodemailer');
const dns = require('node:dns');

dns.setDefaultResultOrder?.('ipv4first');

function sendHttpRequest(url, headers, body) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const bodyStr = JSON.stringify(body);

        const req = https.request({
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                ...headers,
                'Content-Length': Buffer.byteLength(bodyStr)
            },
            timeout: 20000
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        body: data ? JSON.parse(data) : {}
                    });
                } catch {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        body: data
                    });
                }
            });
        });

        req.on('timeout', () => {
            req.destroy(new Error('Request timed out'));
        });
        req.on('error', reject);
        req.write(bodyStr);
        req.end();
    });
}

function buildResetEmail({ resetUrl }) {
    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">UIBM Inventory</h2>
                <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Sistemi i Menaxhimit te Inventarit</p>
            </div>

            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 25px;" />

            <h3 style="color: #0f172a; font-size: 18px; font-weight: 600; margin-top: 0;">Kerkese per resetim te fjalekalimit</h3>
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                Pershendetje,<br/><br/>
                Ju keni kerkuar te ndryshoni fjalekalimin e llogarise suaj. Klikoni butonin e meposhtem per te vazhduar me resetimin:
            </p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #1e293b; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Reset Password</a>
            </div>

            <p style="color: #64748b; font-size: 13px; line-height: 1.6; background-color: #f8fafc; padding: 12px; border-radius: 6px; border-left: 4px solid #cbd5e1;">
                <strong>Nese butoni nuk funksionon</strong>, mund te kopjoni dhe ngjitni kete link ne shfletuesin tuaj:<br/>
                <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
            </p>

            <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin-top: 25px;">
                Nese nuk e keni kerkuar ju kete veprim, ju lutem injorojeni kete email. Kjo lidhje eshte e vlefshme per 1 ore.
            </p>

            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0 15px 0;" />

            <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin: 0;">
                Kjo eshte nje porosi e automatizuar, ju lutem mos u pergjigjni direkt ne kete email.
            </p>
        </div>
    `;
}

async function sendWithBrevo({ email, subject, htmlContent, senderEmail }) {
    const brevoApiKey = process.env.BREVO_API_KEY;

    if (!brevoApiKey) {
        throw new Error('BREVO_API_KEY mungon ne konfigurimin e serverit.');
    }

    console.log('[EmailService] Duke derguar email permes Brevo API...');

    const response = await sendHttpRequest(
        'https://api.brevo.com/v3/smtp/email',
        {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        {
            sender: {
                name: 'UIBM Inventory',
                email: senderEmail
            },
            to: [{ email }],
            subject,
            htmlContent
        }
    );

    if (!response.ok) {
        console.error('[EmailService] Brevo API refuzoi dergimin:', response.body);
        const errorMessage = response.body?.message || JSON.stringify(response.body);
        throw new Error(`Brevo API Error (${response.status}): ${errorMessage}`);
    }

    console.log('[EmailService] Email-i u dergua me sukses permes Brevo!', response.body);
    return { success: true, provider: 'brevo', data: response.body };
}

async function sendWithGmailSmtp({ email, subject, htmlContent, emailUser, emailPass, emailFrom }) {
    console.log('[EmailService] Duke derguar email permes Gmail SMTP...');

    const smtpDomain = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpSecure = smtpPort === 465;
    const [smtpHost] = await dns.promises.resolve4(smtpDomain);

    if (!smtpHost) {
        throw new Error(`Nuk u gjet IPv4 per ${smtpDomain}`);
    }

    console.log(`[EmailService] Gmail SMTP IPv4 host: ${smtpHost}:${smtpPort}`);

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        requireTLS: !smtpSecure,
        family: 4,
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        tls: {
            servername: smtpDomain
        },
        auth: {
            user: emailUser,
            pass: emailPass
        }
    });

    const result = await transporter.sendMail({
        from: emailFrom,
        to: email,
        subject,
        html: htmlContent
    });

    console.log('[EmailService] Email-i u dergua me sukses permes Gmail!', result);
    return { success: true, provider: 'gmail', data: result };
}

async function sendResetPasswordEmail({ email, resetToken, frontendUrl }) {
    if (!frontendUrl) {
        throw new Error('FRONTEND_URL mungon ne konfigurimin e serverit. Shto ate te Railway Variables.');
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const senderEmail = process.env.EMAIL_SENDER || emailUser;
    const emailFrom = process.env.EMAIL_FROM || `"UIBM Inventory" <${emailUser}>`;

    if (!senderEmail) {
        throw new Error('EMAIL_USER ose EMAIL_SENDER mungon ne konfigurimin e serverit.');
    }

    const resetUrl = `${frontendUrl}/forgot-password/${resetToken}`;
    const subject = 'Resetimi i fjalekalimit';
    const htmlContent = buildResetEmail({ resetUrl });

    if (process.env.BREVO_API_KEY) {
        return sendWithBrevo({ email, subject, htmlContent, senderEmail });
    }

    if (!emailUser || !emailPass) {
        throw new Error('EMAIL_USER dhe EMAIL_PASS mungojne ne konfigurimin e serverit. Shto ato te Railway Variables.');
    }

    return sendWithGmailSmtp({ email, subject, htmlContent, emailUser, emailPass, emailFrom });
}

module.exports = {
    sendResetPasswordEmail
};
