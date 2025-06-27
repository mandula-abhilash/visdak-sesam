# VISDAK SESAM

A pluggable authentication module with support for PostgreSQL database and email providers.

---

## Features

- Modular architecture with repository pattern
- PostgreSQL database with Knex.js migrations
- Flexible user schema with JSONB additional fields
- Configurable email providers (e.g., AWS SES)
- JWT-based authentication
- Middleware for route protection and role-based access
- Schema validation with `zod`
- Customizable and extensible for various use cases

---

## Installation

```bash
npm install visdak-sesam
```

---

## Database Setup

This module uses PostgreSQL with Knex.js for database operations and migrations.

### Prerequisites

1. PostgreSQL server running locally or remotely
2. Database created for the application

### Environment Configuration

Copy `.env.example` to `.env` and configure your PostgreSQL connection:

```env
PG_HOST=localhost
PG_PORT=5432
PG_USER=your_username
PG_PASSWORD=your_password
PG_DATABASE=your_database
```

### Running Migrations

```bash
# Run latest migrations
npm run migrate:latest

# Rollback last migration
npm run migrate:rollback

# Create new migration
npm run migrate:make migration_name
```

---

## Configuration

The module requires a configuration object for initialization:

### Example Configuration

```javascript
const config = {
  PG_HOST: "localhost",
  PG_PORT: 5432,
  PG_USER: "your_username",
  PG_PASSWORD: "your_password",
  PG_DATABASE: "your_database",
  JWT_SECRET: "your-jwt-secret",
  REFRESH_TOKEN_SECRET: "your-refresh-token-secret",
  accessTokenExpiry: "15m",
  refreshTokenExpiry: "7d",
  appUrl: "http://localhost:3000",
  emailConfig: {
    provider: "ses",
    from: "noreply@yourdomain.com",
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  },
};
```

---

## Usage

### Initialize the Authentication Module

```javascript
import express from "express";
import visdakSesamModule from "visdak-sesam";

const app = express();
app.use(express.json());

const authModule = visdakSesamModule();

// Mount authentication routes
app.use("/auth", authModule.authRoutes);

// Example protected route
app.get("/protected", authModule.middleware.protect, (req, res) => {
  res.json({ message: "Protected route accessed!", user: req.user });
});

// Example admin-only route
app.get(
  "/admin",
  authModule.middleware.protect,
  authModule.middleware.admin,
  (req, res) => {
    res.json({ message: "Admin-only route accessed!", user: req.user });
  }
);

// Start the server
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
```

---

## Flexible User Schema

The user schema supports additional fields through a JSONB column, allowing you to store custom data for different business needs:

### Registration with Additional Fields

```javascript
// Example registration with custom fields
const registrationData = {
  name: "John Doe",
  email: "john@example.com",
  password: "password123",
  businessName: "Acme Corp",
  additionalFields: {
    company: "Acme Corporation",
    phone: "+1234567890",
    department: "Engineering",
    preferences: {
      newsletter: true,
      notifications: false,
    },
    metadata: {
      source: "website",
      campaign: "spring2024",
    },
  },
};
```

### Database Schema

The `vd_sesam_users` table includes:

- **Core fields**: `id`, `name`, `email`, `password_hash`, `role`
- **Optional fields**: `business_name`
- **Flexible fields**: `additional_fields` (JSONB) - stores any custom data
- **Authentication fields**: `is_verified`, `verification_token`, etc.
- **Timestamps**: `created_at`, `updated_at`

---

## Endpoints and Usage

### 1. Register a User

- **Endpoint**: `POST /auth/register`
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "businessName": "Acme Corp",
    "additionalFields": {
      "company": "Acme Corporation",
      "phone": "+1234567890",
      "department": "Engineering"
    }
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": { "email": "john@example.com" },
    "message": "Registration successful. Please verify your email."
  }
  ```

---

### 2. Login

- **Endpoint**: `POST /auth/login`
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "user-id",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "businessName": "Acme Corp",
        "additionalFields": {
          "company": "Acme Corporation",
          "phone": "+1234567890"
        }
      }
    }
  }
  ```

---

### 3. Verify Email

- **Endpoint**: `GET /auth/verify-email?token=<verification_token>`
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Email verified successfully"
  }
  ```

---

### 4. Forgot Password

- **Endpoint**: `POST /auth/forgot-password`
- **Request Body**:
  ```json
  {
    "email": "john@example.com"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Password reset email sent"
  }
  ```

---

### 5. Reset Password

- **Endpoint**: `POST /auth/reset-password`
- **Request Body**:
  ```json
  {
    "token": "<password_reset_token>",
    "newPassword": "newPassword123"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Password reset successful"
  }
  ```

---

### 6. Refresh Token

- **Endpoint**: `POST /auth/refresh-token`
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Tokens refreshed successfully"
  }
  ```

---

## Database Operations

### Using the User Repository

```javascript
import { UserRepository } from "visdak-sesam";

// Find user by email
const user = await UserRepository.findByEmail("john@example.com");

// Create user with additional fields
const newUser = await UserRepository.create({
  name: "Jane Doe",
  email: "jane@example.com",
  password: "password123",
  additionalFields: {
    company: "Tech Corp",
    role: "Developer",
    skills: ["JavaScript", "Node.js", "PostgreSQL"],
  },
});

// Update user
const updatedUser = await UserRepository.updateById(userId, {
  additionalFields: {
    ...existingFields,
    lastLogin: new Date(),
    preferences: { theme: "dark" },
  },
});
```

---

## Migration Management

### Creating Migrations

```bash
# Create a new migration
npm run migrate:make add_user_preferences

# Run migrations
npm run migrate:latest

# Rollback last migration
npm run migrate:rollback
```

### Example Migration

```javascript
export const up = async (knex) => {
  return knex.schema.alterTable("vd_sesam_users", (table) => {
    table.jsonb("preferences").defaultTo("{}");
  });
};

export const down = async (knex) => {
  return knex.schema.alterTable("vd_sesam_users", (table) => {
    table.dropColumn("preferences");
  });
};
```

---

## Protected and Admin Routes

### Protected Route Example

```javascript
app.get("/protected", authModule.middleware.protect, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});
```

### Admin Route Example

```javascript
app.get(
  "/admin",
  authModule.middleware.protect,
  authModule.middleware.admin,
  (req, res) => {
    res.json({ message: "This is an admin-only route", user: req.user });
  }
);
```

---

## Validation

The module uses `zod` for schema validation.

### Validation Schemas

| Endpoint                | Schema                 |
| ----------------------- | ---------------------- |
| `/auth/register`        | `registerSchema`       |
| `/auth/login`           | `loginSchema`          |
| `/auth/forgot-password` | `forgotPasswordSchema` |
| `/auth/reset-password`  | `resetPasswordSchema`  |

---

## Error Handling

Responses follow a consistent structure.

### Success Response

```json
{
  "status": "success",
  "data": { "key": "value" },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "status": "error",
  "error": {
    "code": 400,
    "details": "Detailed error message"
  }
}
```

---

## Extensibility

- Replace database operations by extending the UserRepository
- Support additional email providers by implementing new adapters
- Add custom middleware for specialized use cases
- Extend the user schema with new migrations
- Store complex data structures in the `additional_fields` JSONB column
