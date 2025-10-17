# AndAction API Routes

This directory contains all API endpoints for the AndAction platform.

## Structure

```
api/
├── auth/           # Authentication endpoints (NextAuth.js)
├── users/          # User management endpoints
├── artists/        # Artist profile and management endpoints
├── videos/         # Video content endpoints
├── shorts/         # Shorts content endpoints
├── bookmarks/      # Bookmark management endpoints
├── search/         # Search functionality endpoints
├── upload/         # File upload endpoints
└── health/         # Health check endpoint
```

## API Conventions

### Response Format
All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

### Authentication
Protected routes require authentication via NextAuth.js session or JWT token.

## Development

To test API endpoints:
```bash
# Health check
curl http://localhost:3000/api/health

# With authentication (after implementing auth)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/users/me
```

