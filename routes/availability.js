const express = require('express');
const { body } = require('express-validator');
const Availability = require('../models/Availability');
const User = require('../models/User');
const { protect, isProfessor } = require('../middleware/auth');
const { handleValidationErrors, isValidTimeFormat, isValidFutureDate, isValidTimeRange } = require('../middleware/validate');

const router = express.Router();

router.post('/', [
    protect,
    isProfessor,
    body('date')
        .isISO8601()
        .withMessage('Date must be a valid ISO date')
        .custom(isValidFutureDate),
    body('startTime')
        .custom(isValidTimeFormat),
    body('endTime')
        .custom(isValidTimeFormat),
    handleValidationErrors
], async (req, res) => {
    try {
        const { date, startTime, endTime } = req.body;

        // Validate time range
        try {
            isValidTimeRange(startTime, endTime);
        } catch (error) {
            return res.status(400).json({
                status: 'error',
                message: error.message
            });
        }

        // Check for overlapping slots
        const overlappingSlot = await Availability.findOne({
            professor: req.user.id,
            date: new Date(date),
            isActive: true,
            $or: [
                {
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime }
                }
            ]
        });

        if (overlappingSlot) {
            return res.status(400).json({
                status: 'error',
                message: 'Time slot overlaps with existing availability'
            });
        }

        const availability = await Availability.create({
            professor: req.user.id,
            date: new Date(date),
            startTime,
            endTime
        });

        res.status(201).json({
            status: 'success',
            message: 'Availability slot created successfully',
            data: {
                availability: {
                    id: availability._id,
                    date: availability.date,
                    startTime: availability.startTime,
                    endTime: availability.endTime,
                    isBooked: availability.isBooked
                }
            }
        });
    } catch (error) {
        console.error('Create availability error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// @route   GET /api/availability/professor/:professorId
// @desc    Get available slots for a professor
// @access  Public
router.get('/professor/:professorId', async (req, res) => {
    try {
        // Validate professorId format
        if (!req.params.professorId || req.params.professorId.length !== 24) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid professor ID format. Please provide a valid 24-character MongoDB ObjectId.'
            });
        }

        // Check if professor exists
        const professor = await User.findOne({
            _id: req.params.professorId,
            role: 'professor',
            isActive: true
        });

        if (!professor) {
            return res.status(404).json({
                status: 'error',
                message: 'Professor not found'
            });
        }

        const { date } = req.query;
        let query = {
            professor: req.params.professorId,
            isActive: true,
            isBooked: false
        };

        // Filter by date if provided
        if (date) {
            const filterDate = new Date(date);
            filterDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(filterDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            query.date = {
                $gte: filterDate,
                $lt: nextDay
            };
        } else {
            // Only show future slots
            query.date = { $gte: new Date() };
        }

        const availabilities = await Availability.find(query)
            .sort({ date: 1, startTime: 1 });

        res.status(200).json({
            status: 'success',
            count: availabilities.length,
            data: {
                professor: {
                    id: professor._id,
                    name: professor.name,
                    department: professor.department
                },
                availabilities: availabilities.map(slot => ({
                    id: slot._id,
                    date: slot.date,
                    startTime: slot.startTime,
                    endTime: slot.endTime
                }))
            }
        });
    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// @route   GET /api/availability/my-slots
// @desc    Get professor's own availability slots
// @access  Private
router.get('/my-slots', protect, isProfessor, async (req, res) => {
    try {
        const { status = 'all' } = req.query;
        
        let query = {
            professor: req.user.id,
            isActive: true
        };

        // Filter by booking status
        if (status === 'available') {
            query.isBooked = false;
        } else if (status === 'booked') {
            query.isBooked = true;
        }

        const availabilities = await Availability.find(query)
            .populate('appointmentId', 'student reason')
            .sort({ date: 1, startTime: 1 });

        res.status(200).json({
            status: 'success',
            count: availabilities.length,
            data: {
                availabilities: availabilities.map(slot => ({
                    id: slot._id,
                    date: slot.date,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    isBooked: slot.isBooked,
                    appointment: slot.appointmentId ? {
                        id: slot.appointmentId._id,
                        student: slot.appointmentId.student,
                        reason: slot.appointmentId.reason
                    } : null
                }))
            }
        });
    } catch (error) {
        console.error('Get my slots error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// @route   DELETE /api/availability/:id
// @desc    Delete availability slot (professors only)
// @access  Private
router.delete('/:id', protect, isProfessor, async (req, res) => {
    try {
        const availability = await Availability.findOne({
            _id: req.params.id,
            professor: req.user.id,
            isActive: true
        });

        if (!availability) {
            return res.status(404).json({
                status: 'error',
                message: 'Availability slot not found'
            });
        }

        if (availability.isBooked) {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot delete a booked slot'
            });
        }

        await Availability.findByIdAndUpdate(req.params.id, { isActive: false });

        res.status(200).json({
            status: 'success',
            message: 'Availability slot deleted successfully'
        });
    } catch (error) {
        console.error('Delete availability error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

module.exports = router; 