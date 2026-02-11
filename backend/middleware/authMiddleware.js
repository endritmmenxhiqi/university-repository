const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Jo i autorizuar, token dështoi' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Nuk ka token, autorizimi u mohua' });
    }
};

// Middleware për Role-Based Access Control (RBAC)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Roli ${req.user.role} nuk ka leje për këtë veprim` 
            });
        }
        next();
    };
};

module.exports = { protect, authorize };