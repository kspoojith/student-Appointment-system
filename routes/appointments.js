const express = require('express');
const { body } = require('express-validator');
const Appointment = require('../models/Appointment');
const Availability = require('../models/Availability');
const User = require('../models/User');
const { protect, isStudent, isProfessor } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

const router = express.Router();


router.post('/', [
    protect,
    isStudent,
    body('availabilityId')
        .isMongoId()
        .withMessage('Valid availability ID is required'),
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Reason cannot exceed 500 characters'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { availabilityId, reason } = req.body;

        const availability = await Availability.findOne({
            _id: availabilityId,
            isActive: true,
            isBooked: false
        });

        if (!availability) {
            return res.status(404).json({
                status: 'error',
                message: 'Availability slot not found or already booked'
            });
        }

        const now = new Date();
        const slotDate = new Date(availability.date);
        slotDate.setHours(parseInt(availability.startTime.split(':')[0]), parseInt(availability.startTime.split(':')[1]));
        
        if (slotDate < now) {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot book appointments in the past'
            });
        }

        const existingAppointment = await Appointment.findOne({
            student: req.user.id,
            professor: availability.professor,
            date: availability.date,
            startTime: availability.startTime,
            status: 'scheduled',
            isActive: true
        });

        if (existingAppointment) {
            return res.status(400).json({
                status: 'error',
                message: 'You already have an appointment with this professor at this time'
            });
        }

        const appointment = await Appointment.create({
            student: req.user.id,
            professor: availability.professor,
            availability: availabilityId,
            date: availability.date,
            startTime: availability.startTime,
            endTime: availability.endTime,
            reason
        });

        await appointment.populate('professor', 'name email department');

        res.status(201).json({
            status: 'success',
            message: 'Appointment booked successfully',
            data: {
                appointment: {
                    id: appointment._id,
                    date: appointment.date,
                    startTime: appointment.startTime,
                    endTime: appointment.endTime,
                    status: appointment.status,
                    reason: appointment.reason,
                    professor: {
                        id: appointment.professor._id,
                        name: appointment.professor.name,
                        department: appointment.professor.department
                    }
                }
            }
        });
    } catch (error) {
        console.error('Book appointment error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});


router.get('/my-appointments', protect, async (req, res) => {
    try {
        const { status = 'all' } = req.query;
        
        let query = {
            isActive: true
        };

        if (req.user.role === 'student') {
            query.student = req.user.id;
        } else {
            query.professor = req.user.id;
        }

        if (status !== 'all') {
            query.status = status;
        }

        const appointments = await Appointment.find(query)
            .populate(req.user.role === 'student' ? 'professor' : 'student', 'name email department studentId')
            .sort({ date: 1, startTime: 1 });

        res.status(200).json({
            status: 'success',
            count: appointments.length,
            data: {
                appointments: appointments.map(appointment => ({
                    id: appointment._id,
                    date: appointment.date,
                    startTime: appointment.startTime,
                    endTime: appointment.endTime,
                    status: appointment.status,
                    reason: appointment.reason,
                    notes: appointment.notes,
                    [req.user.role === 'student' ? 'professor' : 'student']: {
                        id: appointment[req.user.role === 'student' ? 'professor' : 'student']._id,
                        name: appointment[req.user.role === 'student' ? 'professor' : 'student'].name,
                        email: appointment[req.user.role === 'student' ? 'professor' : 'student'].email,
                        department: appointment[req.user.role === 'student' ? 'professor' : 'student'].department,
                        studentId: appointment[req.user.role === 'student' ? 'professor' : 'student'].studentId
                    }
                }))
            }
        });
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            isActive: true,
            $or: [
                { student: req.user.id },
                { professor: req.user.id }
            ]
        })
        .populate('student', 'name email studentId')
        .populate('professor', 'name email department');

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                appointment: {
                    id: appointment._id,
                    date: appointment.date,
                    startTime: appointment.startTime,
                    endTime: appointment.endTime,
                    status: appointment.status,
                    reason: appointment.reason,
                    notes: appointment.notes,
                    cancelledBy: appointment.cancelledBy,
                    cancelledAt: appointment.cancelledAt,
                    student: {
                        id: appointment.student._id,
                        name: appointment.student.name,
                        email: appointment.student.email,
                        studentId: appointment.student.studentId
                    },
                    professor: {
                        id: appointment.professor._id,
                        name: appointment.professor.name,
                        email: appointment.professor.email,
                        department: appointment.professor.department
                    }
                }
            }
        });
    } catch (error) {
        console.error('Get appointment error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// @route   PUT /api/appointments/:id/cancel
// @desc    Cancel appointment
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            isActive: true,
            $or: [
                { student: req.user.id },
                { professor: req.user.id }
            ]
        });

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found'
            });
        }

        if (appointment.status !== 'scheduled') {
            return res.status(400).json({
                status: 'error',
                message: 'Only scheduled appointments can be cancelled'
            });
        }

        // Check if appointment can be cancelled
        if (!appointment.canBeCancelled()) {
            return res.status(400).json({
                status: 'error',
                message: 'Appointment cannot be cancelled within 2 hours of start time'
            });
        }

        // Determine who is cancelling
        const cancelledBy = req.user.role;

        // Update appointment
        appointment.status = 'cancelled';
        appointment.cancelledBy = cancelledBy;
        appointment.cancelledAt = new Date();
        await appointment.save();

        // Free up the availability slot
        await Availability.findByIdAndUpdate(appointment.availability, {
            isBooked: false,
            appointmentId: null
        });

        res.status(200).json({
            status: 'success',
            message: 'Appointment cancelled successfully',
            data: {
                appointment: {
                    id: appointment._id,
                    status: appointment.status,
                    cancelledBy: appointment.cancelledBy,
                    cancelledAt: appointment.cancelledAt
                }
            }
        });
    } catch (error) {
        console.error('Cancel appointment error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// @route   PUT /api/appointments/:id/complete
// @desc    Mark appointment as completed (professors only)
// @access  Private
router.put('/:id/complete', protect, isProfessor, async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            professor: req.user.id,
            status: 'scheduled',
            isActive: true
        });

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found'
            });
        }

        appointment.status = 'completed';
        await appointment.save();

        res.status(200).json({
            status: 'success',
            message: 'Appointment marked as completed',
            data: {
                appointment: {
                    id: appointment._id,
                    status: appointment.status
                }
            }
        });
    } catch (error) {
        console.error('Complete appointment error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

module.exports = router; 