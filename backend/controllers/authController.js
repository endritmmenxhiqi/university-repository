const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendResetPasswordEmail } = require('../utils/emailService');

// Funksion ndihmës për të krijuar Token-in e Login-it
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

//     Regjistrimi i një përdoruesi të ri
exports.register = async (req, res) => {
    try {
        const { name, password, role } = req.body;
        const email = req.body.email?.trim().toLowerCase();

        if (!email) {
            return res.status(400).json({ message: 'Email eshte i detyrueshem' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Ky email është i regjistruar' });
        }
        const user = await User.create({ name, email, password, role });
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//     Login i përdoruesit
exports.login = async (req, res) => {
    try {
        const { password } = req.body;
        const email = req.body.email?.trim().toLowerCase();

        if (!email) {
            return res.status(400).json({ message: 'Email eshte i detyrueshem' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Email ose fjalëkalim i gabuar' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//   Kërkesa për harrimin e fjalëkalimit
exports.forgotPassword = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        console.log("1. Email i pranuar:", email);

        if (!email) {
            return res.status(400).json({ message: 'Email eshte i detyrueshem' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            console.log("2. Error: Nuk u gjet përdoruesi");
            return res.status(404).json({ message: 'Nuk ka përdorues me këtë email' });
        }

        // Gjenero token-in , me 1 ore vlerfshmeri
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 orë vlefshmëri
        await user.save();
        console.log("2. Token-i u ruajt në DB");

        // Dërgo email-in duke përdorur shërbimin tonë robust të email-it
        await sendResetPasswordEmail({
            email: user.email,
            resetToken,
            frontendUrl: process.env.PASSWORD_RESET_BASE_URL || process.env.BACKEND_PUBLIC_URL || 'https://university-repository-production.up.railway.app'
        });

        console.log("3. ✅ Email-i u dërgua me sukses!");
        res.json({ message: 'Email-i u dërgua me sukses' });

    } catch (error) {
        console.log("❌ GABIMI REAL NË BACKEND:");
        console.error(error); // Ky do të të tregojë në terminal pse dështoi
        res.status(500).json({ message: 'Gabim gjatë procesit', error: error.message });
    }
};

//   Resetimi i fjalëkalimit me token
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Token i pavlefshëm ose ka skaduar' });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Fjalëkalimi u ndryshua me sukses' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.renderResetPasswordPage = async (req, res) => {
    const { token } = req.params;
    const loginUrl = process.env.LOGIN_URL || process.env.FRONTEND_URL || 'https://university-frontend-one.vercel.app';

    res.type('html').send(`
<!doctype html>
<html lang="sq">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Reset Password - UIBM Inventory</title>
    <style>
        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            background: #f4f7f9;
            color: #1e293b;
            padding: 20px;
        }
        .card {
            width: 100%;
            max-width: 420px;
            background: #fff;
            border-radius: 14px;
            padding: 28px;
            box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
        }
        h1 {
            font-size: 22px;
            margin: 0 0 10px;
        }
        p {
            color: #64748b;
            line-height: 1.5;
            margin: 0 0 20px;
        }
        label {
            display: block;
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        input {
            width: 100%;
            box-sizing: border-box;
            padding: 13px 14px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            font-size: 16px;
            margin-bottom: 16px;
        }
        button {
            width: 100%;
            border: 0;
            border-radius: 10px;
            padding: 14px;
            background: #1e293b;
            color: #fff;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
        }
        button:disabled {
            opacity: 0.7;
            cursor: wait;
        }
        .message {
            margin-top: 16px;
            font-weight: 700;
        }
        .login-link {
            display: inline-block;
            margin-top: 16px;
            color: #2563eb;
            font-weight: 700;
            text-decoration: none;
        }
        .login-link:hover {
            text-decoration: underline;
        }
        .success {
            color: #15803d;
        }
        .error {
            color: #b91c1c;
        }
    </style>
</head>
<body>
    <main class="card">
        <h1>Resetimi i fjalekalimit</h1>
        <p>Vendosni fjalekalimin e ri per llogarine tuaj ne UIBM Inventory.</p>
        <form id="reset-form">
            <label for="password">Fjalekalimi i ri</label>
            <input id="password" name="password" type="password" minlength="6" required placeholder="Minimum 6 karaktere" />
            <button id="submit-button" type="submit">Ndrysho fjalekalimin</button>
        </form>
        <div id="message" class="message"></div>
        <a class="login-link" href="${loginUrl}">Kthehu te Login</a>
    </main>
    <script>
        const form = document.getElementById('reset-form');
        const button = document.getElementById('submit-button');
        const message = document.getElementById('message');

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            button.disabled = true;
            message.className = 'message';
            message.textContent = 'Duke u procesuar...';

            try {
                const response = await fetch('/api/auth/reset-password/${token}', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: form.password.value })
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Resetimi deshtoi.');
                }

                message.className = 'message success';
                message.innerHTML = 'Fjalekalimi u ndryshua me sukses. <br/><br/>Duke u ridrejtuar te Login-i...';
                form.reset();
                
                // Ridrejtimi automatik tek Login-i pas 3 sekondash
                setTimeout(() => {
                    window.location.href = "${loginUrl}";
                }, 3000);
                
            } catch (error) {
                message.className = 'message error';
                message.textContent = error.message;
            } finally {
                button.disabled = false;
            }
        });
    </script>
</body>
</html>
    `);
};
