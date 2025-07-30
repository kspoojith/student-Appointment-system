# College Appointment System

A comprehensive backend API system for managing college appointments between students and professors. This system allows professors to specify their availability, students to view and book appointments, and provides full appointment lifecycle management.

## Features

- **User Authentication**: Secure JWT-based authentication for students and professors
- **Role-based Access Control**: Different permissions for students and professors
- **Availability Management**: Professors can create and manage their available time slots
- **Appointment Booking**: Students can view available slots and book appointments
- **Appointment Management**: Full CRUD operations for appointments including cancellation
- **Data Integrity**: Proper relationships and constraints between entities
- **Comprehensive Testing**: E2E automated tests covering complete user flows

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Testing**: Jest with Supertest
- **Environment**: dotenv for configuration

## Database Schema

### Users Collection
- `name`: User's full name
- `email`: Unique email address
- `password`: Hashed password
- `role`: Either 'student' or 'professor'
- `studentId`: Unique student ID (for students only)
- `department`: Department name (for professors only)
- `isActive`: Account status
- `createdAt`: Account creation timestamp

### Availability Collection
- `professor`: Reference to professor user
- `date`: Date of availability
- `startTime`: Start time (HH:MM format)
- `endTime`: End time (HH:MM format)
- `isBooked`: Whether slot is booked
- `appointmentId`: Reference to appointment (if booked)
- `isActive`: Slot status

### Appointments Collection
- `student`: Reference to student user
- `professor`: Reference to professor user
- `availability`: Reference to availability slot
- `date`: Appointment date
- `startTime`: Start time
- `endTime`: End time
- `status`: scheduled/completed/cancelled/no-show
- `reason`: Booking reason
- `notes`: Additional notes
- `cancelledBy`: Who cancelled (student/professor/system)
- `cancelledAt`: Cancellation timestamp
- `isActive`: Appointment status

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users/professors` - List all professors
- `GET /api/users/professors/:id` - Get specific professor
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Availability
- `POST /api/availability` - Create availability slot (professors only)
- `GET /api/availability/professor/:id` - Get professor's available slots
- `GET /api/availability/my-slots` - Get own availability slots (professors)
- `DELETE /api/availability/:id` - Delete availability slot (professors)

### Appointments
- `POST /api/appointments` - Book appointment (students only)
- `GET /api/appointments/my-appointments` - Get user's appointments
- `GET /api/appointments/:id` - Get specific appointment
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `PUT /api/appointments/:id/complete` - Mark as completed (professors)

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd college-appointment-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Copy `config.env` and update with your settings:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/college_appointments
   JWT_SECRET=your_super_secret_jwt_key_2024
   JWT_EXPIRE=24h
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run E2E tests only
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

The project includes comprehensive test coverage:
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete user flow testing

### E2E Test Flow

The main E2E test covers the complete user flow as specified in the assignment:

1. Student A1 authenticates
2. Professor P1 authenticates
3. Professor P1 creates availability slots
4. Student A1 views available slots
5. Student A1 books appointment for time T1
6. Student A2 authenticates
7. Student A2 books appointment for time T2
8. Professor P1 cancels appointment with Student A1
9. Student A1 verifies no pending appointments

## API Usage Examples

### Register a Student
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@college.edu",
    "password": "password123",
    "role": "student",
    "studentId": "STU001"
  }'
```

### Register a Professor
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Smith",
    "email": "smith@college.edu",
    "password": "password123",
    "role": "professor",
    "department": "Computer Science"
  }'
```

### Create Availability Slot
```bash
curl -X POST http://localhost:3000/api/availability \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "startTime": "10:00",
    "endTime": "11:00"
  }'
```

### Book Appointment
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "availabilityId": "AVAILABILITY_ID",
    "reason": "Discussion about final project"
  }'
```

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive validation using express-validator
- **Role-based Authorization**: Different access levels for students and professors
- **Data Sanitization**: Protection against injection attacks

## Error Handling

The API provides consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message",
      "value": "invalid value"
    }
  ]
}
```

## Performance Considerations

- **Database Indexing**: Proper indexes on frequently queried fields
- **Query Optimization**: Efficient database queries with population
- **Response Caching**: Appropriate caching strategies
- **Connection Pooling**: MongoDB connection optimization

## Deployment

### Production Deployment

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Use strong JWT secret
   - Configure production MongoDB URI

2. **Process Management**
   - Use PM2 or similar process manager
   - Set up proper logging
   - Configure monitoring

3. **Security**
   - Enable HTTPS
   - Set up CORS properly
   - Use environment variables for secrets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please contact the development team or create an issue in the repository. 