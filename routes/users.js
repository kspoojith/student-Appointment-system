const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/professors', async (req, res) => {
    try {
        const professors = await User.find({ 
            role: 'professor', 
            isActive: true 
        }).select('name email department');

        res.status(200).json({
            status: 'success',
            count: professors.length,
            data: {
                professors
            }
        });
    } catch (error) {
        console.error('Get professors error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// @route   GET /api/users/professors/:id
// @desc    Get professor by ID
// @access  Public
router.get('/professors/:id', async (req, res) => {
    try {
        const professor = await User.findOne({
            _id: req.params.id,
            role: 'professor',
            isActive: true
        }).select('name email department');

        if (!professor) {
            return res.status(404).json({
                status: 'error',
                message: 'Professor not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                professor
            }
        });
    } catch (error) {
        console.error('Get professor error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    studentId: user.studentId,
                    department: user.department,
                    createdAt: user.createdAt
                }
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, email } = req.body;
        
        // Check if email is being changed and if it already exists
        if (email && email !== req.user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email already exists'
                });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { name, email },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    studentId: updatedUser.studentId,
                    department: updatedUser.department
                }
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

module.exports = router; 