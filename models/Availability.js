const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
    professor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Professor is required']
    },
    date: {
        type: Date,
        required: [true, 'Date is required']
    },
    startTime: {
        type: String,
        required: [true, 'Start time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
    },
    endTime: {
        type: String,
        required: [true, 'End time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
    },
    isBooked: {
        type: Boolean,
        default: false
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

availabilitySchema.index({ professor: 1, date: 1, isActive: 1 });
availabilitySchema.index({ professor: 1, isBooked: 1, isActive: 1 });

availabilitySchema.virtual('isPast').get(function() {
    const now = new Date();
    const slotDate = new Date(this.date);
    slotDate.setHours(parseInt(this.startTime.split(':')[0]), parseInt(this.startTime.split(':')[1]));
    return slotDate < now;
});

availabilitySchema.methods.isAvailable = function() {
    return this.isActive && !this.isBooked && !this.isPast;
};

module.exports = mongoose.model('Availability', availabilitySchema); 