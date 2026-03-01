const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Marrim krejt userin (përfshirë name dhe role)
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ message: 'Përdoruesi nuk ekziston më' });
            }
            
            next();
        } catch (error) {
            res.status(401).json({ message: 'Jo i autorizuar, token dështoi' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Nuk ka token, autorizimi u mohua' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        // Kontrollon nëse roli i userit është në listën e lejuar
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Roli ${req.user.role} nuk ka leje për këtë veprim` 
            });
        }
        next();
    };
};

module.exports = { protect, authorize };