# Visdak SESAM

A pluggable authentication module with support for multiple databases and email providers.

---

## Features

- Modular architecture with adapter pattern
- Swappable database backends
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

## Configuration

The module requires a configuration object for initialization:

### Example Configuration

```javascript
const config = {
  MONGODB_URI: "mongodb://localhost:27017/your-db",
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
import { createAuthModule } from "visdak-sesam";

const app = express();
app.use(express.json());

const authModule = createAuthModule(config);

// Mount authentication routes
app.use("/auth", authModule.router);

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

## Endpoints and Usage

### 1. Register a User

- **Endpoint**: `POST /auth/register`
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
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
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token",
      "user": { "id": "user-id", "name": "John Doe", "email": "john@example.com", "role": "user" }
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
- **Request Body**:
  ```json
  {
    "refreshToken": "jwt-refresh-token"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": { "accessToken": "new-jwt-access-token" }
  }
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

| Endpoint             | Schema               |
|----------------------|----------------------|
| `/auth/register`     | `registerSchema`     |
| `/auth/login`        | `loginSchema`        |
| `/auth/forgot-password` | `forgotPasswordSchema` |
| `/auth/reset-password` | `resetPasswordSchema` |
| `/auth/refresh-token` | `refreshTokenSchema` |

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

- Replace database adapters (e.g., switch from Mongoose to PostgreSQL)
- Support additional email providers by implementing new adapters
- Add custom middleware for specialized use cases