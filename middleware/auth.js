const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Access denied. No token provided.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'User not found'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                status: 'error',
                message: 'User account is deactivated'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token'
        });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

exports.isProfessor = (req, res, next) => {
    if (req.user.role !== 'professor') {
        return res.status(403).json({
            status: 'error',
            message: 'Only professors can access this resource'
        });
    }
    next();
};

exports.isStudent = (req, res, next) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({
            status: 'error',
            message: 'Only students can access this resource'
        });
    }
    next();
}; 