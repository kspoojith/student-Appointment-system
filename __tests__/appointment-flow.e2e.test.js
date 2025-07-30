const request = require('supertest');
const app = require('../test-server');
const User = require('../models/User');
const Availability = require('../models/Availability');
const Appointment = require('../models/Appointment');

describe('College Appointment System - Complete User Flow E2E Test', () => {
    let studentA1Token, studentA2Token, professorP1Token;
    let studentA1Id, studentA2Id, professorP1Id;
    let availabilitySlot1Id, availabilitySlot2Id;
    let appointment1Id, appointment2Id;
    const timestamp = Date.now();

    describe('Step 1: Student A1 authenticates to access the system', () => {
        it('should register Student A1 successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Student A1',
                    email: `studenta1_${timestamp}@college.edu`,
                    password: 'password123',
                    role: 'student',
                    studentId: `STU001_${timestamp}`
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.user.name).toBe('Student A1');
            expect(response.body.data.user.role).toBe('student');
            expect(response.body.data.token).toBeDefined();

            studentA1Token = response.body.data.token;
            studentA1Id = response.body.data.user.id;
        });

        it('should login Student A1 successfully', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: `studenta1_${timestamp}@college.edu`,
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.user.name).toBe('Student A1');
            expect(response.body.data.token).toBeDefined();
        });
    });

    describe('Step 2: Professor P1 authenticates to access the system', () => {
        it('should register Professor P1 successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Professor P1',
                    email: `professorp1_${timestamp}@college.edu`,
                    password: 'password123',
                    role: 'professor',
                    department: 'Computer Science'
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.user.name).toBe('Professor P1');
            expect(response.body.data.user.role).toBe('professor');
            expect(response.body.data.token).toBeDefined();

            professorP1Token = response.body.data.token;
            professorP1Id = response.body.data.user.id;
        });

        it('should login Professor P1 successfully', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: `professorp1_${timestamp}@college.edu`,
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.user.name).toBe('Professor P1');
            expect(response.body.data.token).toBeDefined();
        });
    });

    describe('Step 3: Professor P1 specifies which time slots he is free for appointments', () => {
        it('should create first availability slot (T1)', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0);

            const response = await request(app)
                .post('/api/availability')
                .set('Authorization', `Bearer ${professorP1Token}`)
                .send({
                    date: tomorrow.toISOString().split('T')[0],
                    startTime: '10:00',
                    endTime: '11:00'
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.availability.startTime).toBe('10:00');
            expect(response.body.data.availability.endTime).toBe('11:00');
            expect(response.body.data.availability.isBooked).toBe(false);

            availabilitySlot1Id = response.body.data.availability.id;
        });

        it('should create second availability slot (T2)', async () => {
            const dayAfterTomorrow = new Date();
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
            dayAfterTomorrow.setHours(14, 0, 0, 0);

            const response = await request(app)
                .post('/api/availability')
                .set('Authorization', `Bearer ${professorP1Token}`)
                .send({
                    date: dayAfterTomorrow.toISOString().split('T')[0],
                    startTime: '14:00',
                    endTime: '15:00'
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.availability.startTime).toBe('14:00');
            expect(response.body.data.availability.endTime).toBe('15:00');
            expect(response.body.data.availability.isBooked).toBe(false);

            availabilitySlot2Id = response.body.data.availability.id;
        });

        it('should list professor\'s availability slots', async () => {
            const response = await request(app)
                .get('/api/availability/my-slots')
                .set('Authorization', `Bearer ${professorP1Token}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.count).toBe(2);
            expect(response.body.data.availabilities).toHaveLength(2);
        });
    });

    describe('Step 4: Student A1 views available time slots for Professor P1', () => {
        it('should get available slots for Professor P1', async () => {
            const response = await request(app)
                .get(`/api/availability/professor/${professorP1Id}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.count).toBe(2);
            expect(response.body.data.professor.name).toBe('Professor P1');
            expect(response.body.data.availabilities).toHaveLength(2);
        });
    });

    describe('Step 5: Student A1 books an appointment with Professor P1 for time T1', () => {
        it('should book appointment for time slot T1', async () => {
            const response = await request(app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${studentA1Token}`)
                .send({
                    availabilityId: availabilitySlot1Id,
                    reason: 'Discussion about final project'
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.appointment.startTime).toBe('10:00');
            expect(response.body.data.appointment.endTime).toBe('11:00');
            expect(response.body.data.appointment.status).toBe('scheduled');
            expect(response.body.data.appointment.professor.name).toBe('Professor P1');

            appointment1Id = response.body.data.appointment.id;
        });

        it('should verify the availability slot is now booked', async () => {
            const response = await request(app)
                .get(`/api/availability/professor/${professorP1Id}`);

            expect(response.status).toBe(200);
            expect(response.body.count).toBe(1); 
            expect(response.body.data.availabilities[0].id).toBe(availabilitySlot2Id);
        });
    });

    describe('Step 6: Student A2 authenticates to access the system', () => {
        it('should register Student A2 successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Student A2',
                    email: `studenta2_${timestamp}@college.edu`,
                    password: 'password123',
                    role: 'student',
                    studentId: `STU002_${timestamp}`
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.user.name).toBe('Student A2');
            expect(response.body.data.user.role).toBe('student');
            expect(response.body.data.token).toBeDefined();

            studentA2Token = response.body.data.token;
            studentA2Id = response.body.data.user.id;
        });
    });

    describe('Step 7: Student A2 books an appointment with Professor P1 for time T2', () => {
        it('should book appointment for time slot T2', async () => {
            const response = await request(app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${studentA2Token}`)
                .send({
                    availabilityId: availabilitySlot2Id,
                    reason: 'Career guidance consultation'
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.appointment.startTime).toBe('14:00');
            expect(response.body.data.appointment.endTime).toBe('15:00');
            expect(response.body.data.appointment.status).toBe('scheduled');
            expect(response.body.data.appointment.professor.name).toBe('Professor P1');

            appointment2Id = response.body.data.appointment.id;
        });

        it('should verify no availability slots are left', async () => {
            const response = await request(app)
                .get(`/api/availability/professor/${professorP1Id}`);

            expect(response.status).toBe(200);
            expect(response.body.count).toBe(0); 
        });
    });

    describe('Step 8: Professor P1 cancels the appointment with Student A1', () => {
        it('should cancel appointment with Student A1', async () => {
            const response = await request(app)
                .put(`/api/appointments/${appointment1Id}/cancel`)
                .set('Authorization', `Bearer ${professorP1Token}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.appointment.status).toBe('cancelled');
            expect(response.body.data.appointment.cancelledBy).toBe('professor');
        });

        it('should verify the availability slot is freed up', async () => {
            const response = await request(app)
                .get(`/api/availability/professor/${professorP1Id}`);

            expect(response.status).toBe(200);
            expect(response.body.count).toBe(1); 
            expect(response.body.data.availabilities[0].id).toBe(availabilitySlot1Id);
        });
    });

    describe('Step 9: Student A1 checks their appointments and realizes they do not have any pending appointments', () => {
        it('should show Student A1 has no scheduled appointments', async () => {
            const response = await request(app)
                .get('/api/appointments/my-appointments?status=scheduled')
                .set('Authorization', `Bearer ${studentA1Token}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.count).toBe(0); 
        });

        it('should show Student A1 has one cancelled appointment', async () => {
            const response = await request(app)
                .get('/api/appointments/my-appointments?status=cancelled')
                .set('Authorization', `Bearer ${studentA1Token}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.count).toBe(1); 
            expect(response.body.data.appointments[0].status).toBe('cancelled');
        });

        it('should show Student A2 still has their scheduled appointment', async () => {
            const response = await request(app)
                .get('/api/appointments/my-appointments?status=scheduled')
                .set('Authorization', `Bearer ${studentA2Token}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.count).toBe(1); // One scheduled appointment
            expect(response.body.data.appointments[0].status).toBe('scheduled');
        });
    });

    describe('Additional Verification Tests', () => {
        it('should show Professor P1 has one scheduled appointment', async () => {
            const response = await request(app)
                .get('/api/appointments/my-appointments?status=scheduled')
                .set('Authorization', `Bearer ${professorP1Token}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.count).toBe(1); 
        });

        it('should show Professor P1 has one cancelled appointment', async () => {
            const response = await request(app)
                .get('/api/appointments/my-appointments?status=cancelled')
                .set('Authorization', `Bearer ${professorP1Token}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.count).toBe(1); 
        });

        it('should verify data integrity - appointment details are correct', async () => {
            const response = await request(app)
                .get(`/api/appointments/${appointment2Id}`)
                .set('Authorization', `Bearer ${studentA2Token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.appointment.student.name).toBe('Student A2');
            expect(response.body.data.appointment.professor.name).toBe('Professor P1');
            expect(response.body.data.appointment.startTime).toBe('14:00');
            expect(response.body.data.appointment.endTime).toBe('15:00');
        });
    });
}); 