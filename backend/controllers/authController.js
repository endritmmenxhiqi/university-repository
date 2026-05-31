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
            frontendUrl: process.env.FRONTEND_URL || 'https://university-frontend-one.vercel.app'
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
