const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Student is required']
    },
    professor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Professor is required']
    },
    availability: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Availability',
        required: [true, 'Availability slot is required']
    },
    date: {
        type: Date,
        required: [true, 'Appointment date is required']
    },
    startTime: {
        type: String,
        required: [true, 'Start time is required']
    },
    endTime: {
        type: String,
        required: [true, 'End time is required']
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
        default: 'scheduled'
    },
    reason: {
        type: String,
        trim: true,
        maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    cancelledBy: {
        type: String,
        enum: ['student', 'professor', 'system'],
        required: false
    },
    cancelledAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

appointmentSchema.index({ student: 1, status: 1, isActive: 1 });
appointmentSchema.index({ professor: 1, status: 1, isActive: 1 });
appointmentSchema.index({ date: 1, status: 1 });

appointmentSchema.virtual('isPast').get(function() {
    const now = new Date();
    const appointmentDate = new Date(this.date);
    appointmentDate.setHours(parseInt(this.startTime.split(':')[0]), parseInt(this.startTime.split(':')[1]));
    return appointmentDate < now;
});

appointmentSchema.methods.canBeCancelled = function() {
    const now = new Date();
    const appointmentDate = new Date(this.date);
    appointmentDate.setHours(parseInt(this.startTime.split(':')[0]), parseInt(this.startTime.split(':')[1]));
    
    const twoHoursBefore = new Date(appointmentDate.getTime() - (2 * 60 * 60 * 1000));
    return this.status === 'scheduled' && now < twoHoursBefore;
};

appointmentSchema.pre('save', async function(next) {
    if (this.isNew) {
        const Availability = mongoose.model('Availability');
        await Availability.findByIdAndUpdate(this.availability, {
            isBooked: true,
            appointmentId: this._id
        });
    }
    next();
});

module.exports = mongoose.model('Appointment', appointmentSchema); 