const { validationResult } = require('express-validator');

exports.handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

exports.isValidTimeFormat = (value) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(value)) {
        throw new Error('Time must be in HH:MM format (24-hour)');
    }
    return true;
};

exports.isValidFutureDate = (value) => {
    const inputDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (inputDate < today) {
        throw new Error('Date cannot be in the past');
    }
    return true;
};

exports.isValidTimeRange = (startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    if (start >= end) {
        throw new Error('End time must be after start time');
    }
    
    const diffInMinutes = (end - start) / (1000 * 60);
    if (diffInMinutes < 30) {
        throw new Error('Time slot must be at least 30 minutes');
    }
    
    return true;
}; 