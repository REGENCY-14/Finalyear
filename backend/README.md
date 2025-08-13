# Diagnosis Backend API

A comprehensive Node.js Express backend application for medical diagnosis systems, designed specifically for medical personnel. This API provides secure authentication, patient management, symptom tracking, and X-ray image upload capabilities using Supabase as the backend.

## Features

- 🔐 **Secure Authentication**: JWT-based authentication with role-based access control
- 👥 **Medical Personnel Management**: Signup, signin, and profile management
- 🏥 **Patient Management**: CRUD operations for patient records
- 📋 **Symptom Tracking**: Record and manage patient symptoms
- 🖼️ **X-ray Image Upload**: Secure file upload to Supabase storage
- 🛡️ **Security**: Input validation, rate limiting, and CORS protection
- 📊 **Statistics**: Comprehensive analytics and reporting
- 🔍 **Search & Filtering**: Advanced search capabilities with pagination

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project
- PostgreSQL database (handled by Supabase)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd diagnosis-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `env.example` to `.env`
   - Fill in your Supabase credentials and other configuration

   ```bash
   cp env.example .env
   ```

4. **Configure Environment Variables**
   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # JWT Secret
   JWT_SECRET=your_jwt_secret_key_here
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # File Upload Configuration
   MAX_FILE_SIZE=10485760
   ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg
   ```

5. **Database Setup**
   - Run the SQL schema in your Supabase SQL editor
   - The schema file is located at `database/schema.sql`

6. **Storage Bucket Setup**
   - Create a storage bucket named `xray-images` in Supabase
   - Set it as private (not public)
   - Configure file size limits and allowed MIME types

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication

#### POST `/api/auth/signup`
Create a new medical personnel account.

**Request Body:**
```json
{
  "email": "doctor@hospital.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "doctor",
  "licenseNumber": "MD123456"
}
```

**Response:**
```json
{
  "message": "User account created successfully",
  "user": {
    "id": "uuid",
    "email": "doctor@hospital.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "doctor",
    "licenseNumber": "MD123456",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

#### POST `/api/auth/signin`
Authenticate medical personnel.

**Request Body:**
```json
{
  "email": "doctor@hospital.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "doctor@hospital.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "doctor",
    "licenseNumber": "MD123456"
  },
  "token": "jwt_token_here"
}
```

#### GET `/api/auth/profile`
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Patients

#### POST `/api/patients`
Create a new patient record.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "dateOfBirth": "1990-05-15",
  "gender": "female",
  "phoneNumber": "+1234567890",
  "email": "jane.smith@email.com",
  "address": "123 Main St, City, State",
  "medicalHistory": "No significant medical history"
}
```

#### GET `/api/patients`
Get all patients with pagination and search.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search term for name or email

#### GET `/api/patients/:id`
Get a specific patient by ID.

#### PUT `/api/patients/:id`
Update a patient record.

#### DELETE `/api/patients/:id`
Soft delete a patient (admin only).

### Symptoms

#### POST `/api/symptoms`
Record symptoms for a patient.

**Request Body:**
```json
{
  "patientId": "patient_uuid",
  "symptoms": [
    {
      "name": "Chest pain",
      "severity": "moderate",
      "duration": "2 hours"
    }
  ],
  "notes": "Patient reports sharp chest pain"
}
```

#### GET `/api/symptoms/patient/:patientId`
Get symptoms for a specific patient.

#### GET `/api/symptoms`
Get all symptoms with filters.

### X-ray Images

#### POST `/api/upload/xray`
Upload an X-ray image.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `image`: X-ray image file
- `patientId`: Patient UUID
- `imageType`: Type of image (optional)
- `bodyPart`: Body part imaged (optional)
- `notes`: Additional notes (optional)

#### GET `/api/upload/xray/patient/:patientId`
Get X-ray images for a specific patient.

#### GET `/api/upload/xray`
Get all X-ray images with filters.

## Database Schema

The application uses the following main tables:

- **medical_personnel**: Medical staff accounts
- **patients**: Patient records
- **symptoms**: Patient symptoms
- **symptom_sessions**: Symptom recording sessions
- **xray_images**: X-ray image metadata

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for different roles
- **Input Validation**: Comprehensive input validation using express-validator
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configurable CORS settings
- **Helmet Security**: Security headers and protection
- **Row Level Security**: Database-level security policies

## File Upload

- **Supported Formats**: JPEG, PNG, JPG
- **Maximum Size**: 10MB (configurable)
- **Storage**: Supabase Storage with private access
- **Metadata**: Rich metadata tracking for medical use

## Error Handling

The API provides comprehensive error handling with:
- HTTP status codes
- Descriptive error messages
- Validation error details
- Structured error responses

## Development

### Project Structure
```
diagnosis-backend/
├── config/
│   └── supabase.js
├── database/
│   └── schema.sql
├── middleware/
│   ├── auth.js
│   └── validation.js
├── routes/
│   ├── auth.js
│   ├── patients.js
│   ├── symptoms.js
│   └── upload.js
├── .env.example
├── package.json
├── README.md
└── server.js
```

### Adding New Routes

1. Create a new route file in the `routes/` directory
2. Import and register the route in `server.js`
3. Add appropriate middleware and validation

### Testing

```bash
# Health check
curl http://localhost:3000/health

# Test authentication
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@diagnosis.com","password":"Admin123!"}'
```

## Deployment

### Environment Variables
Ensure all environment variables are properly set in production.

### Database
- Use Supabase production project
- Ensure proper backup and monitoring

### Security
- Use strong JWT secrets
- Enable HTTPS in production
- Configure proper CORS origins

## Support

For issues and questions:
1. Check the API documentation
2. Review error logs
3. Verify environment configuration
4. Check Supabase project settings

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Note**: This application is designed for medical use. Ensure compliance with local healthcare regulations and data protection laws (HIPAA, GDPR, etc.) before deploying in production.
