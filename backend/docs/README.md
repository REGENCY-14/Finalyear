# API Documentation

This folder contains comprehensive Swagger/OpenAPI 3.0 documentation for the Medical Diagnosis Backend API.

## Overview

The API documentation is organized into separate files for each major route category:

- **Authentication Routes** (`/auth/`) - User signup, signin, profile, token refresh, and logout
- **Patient Management** (`/patients/`) - CRUD operations for patient records
- **Symptom Tracking** (`/symptoms/`) - Recording and retrieving patient symptoms
- **X-ray Image Management** (`/upload/`) - Uploading and managing X-ray images

## Main Documentation File

- **`swagger.json`** - The main Swagger configuration file that references all individual route documentation files

## Route Documentation Files

### Authentication (`/auth/`)
- `signup.json` - User registration endpoint
- `signin.json` - User authentication endpoint
- `profile.json` - Get current user profile
- `refresh.json` - Refresh access token
- `logout.json` - User logout endpoint

### Patient Management (`/patients/`)
- `patients.json` - Create and list patients
- `patient-by-id.json` - Get, update, and delete specific patients
- `patient-stats.json` - Patient statistics and overview

### Symptom Tracking (`/symptoms/`)
- `symptoms.json` - Record and retrieve symptoms
- `symptoms-by-patient.json` - Get symptoms for a specific patient
- `symptom-by-id.json` - Get, update, and delete specific symptoms
- `symptom-stats.json` - Symptom statistics and overview

### X-ray Image Management (`/upload/`)
- `xray-upload.json` - Upload X-ray images
- `xray-by-patient.json` - Get X-ray images for a specific patient
- `xray-by-id.json` - Get, update, and delete specific X-ray images
- `upload-stats.json` - Upload statistics and overview

## How to Use

### Viewing the Documentation

1. **Swagger UI**: Use Swagger UI to view the interactive documentation
   - Open `swagger.json` in Swagger UI
   - Or use online tools like [Swagger Editor](https://editor.swagger.io/)

2. **Direct File Access**: Each route file contains detailed information about:
   - Request/response schemas
   - Parameters and validation rules
   - Example requests and responses
   - Error codes and messages
   - Authentication requirements

### API Testing

You can use the documentation to:
- Understand the required request format
- See example request bodies
- Know what responses to expect
- Understand error handling
- Verify authentication requirements

### Integration

The documentation follows OpenAPI 3.0 standards, making it compatible with:
- Swagger UI
- Postman
- Insomnia
- Code generation tools
- API testing frameworks

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## File Structure

```
docs/
├── README.md                 # This file
├── swagger.json             # Main Swagger configuration
├── auth/                    # Authentication routes
│   ├── signup.json
│   ├── signin.json
│   ├── profile.json
│   ├── refresh.json
│   └── logout.json
├── patients/                # Patient management routes
│   ├── patients.json
│   ├── patient-by-id.json
│   └── patient-stats.json
├── symptoms/                # Symptom tracking routes
│   ├── symptoms.json
│   ├── symptoms-by-patient.json
│   ├── symptom-by-id.json
│   └── symptom-stats.json
└── upload/                  # X-ray image management routes
    ├── xray-upload.json
    ├── xray-by-patient.json
    ├── xray-by-id.json
    └── upload-stats.json
```

## Notes

- All timestamps are in ISO 8601 format (UTC)
- UUIDs are used for all IDs
- File uploads support JPEG, PNG, and JPG formats up to 10MB
- Pagination is implemented for list endpoints
- Soft deletion is used for patient records
- Role-based access control is implemented for sensitive operations

## Support

For questions about the API documentation, please refer to the main project README or contact the development team.
