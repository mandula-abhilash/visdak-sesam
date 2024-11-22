Here’s an updated and more detailed README for **Visdak SESAM**, incorporating the cleaned-up structure and ensuring clarity and usability.

---

# Visdak SESAM

A modular authentication and authorization solution supporting multiple databases and email providers. Built with scalability, flexibility, and TypeScript in mind.

---

## Features

- 🌟 **Modular architecture** with an adapter pattern for database and email providers.
- 🔄 **JWT-based authentication**, including access and refresh tokens.
- 📧 **Email verification** using providers like Amazon SES or SMTP.
- 🔑 Middleware for **protected routes** and **role-based access control**.
- 💡 **TypeScript support** for strong typing and better developer experience.
- ⚙️ Easily configurable settings.

---

## Installation

Install the module from the private repository:

```bash
npm install visdak-auth
```

---

## Usage

### Basic Setup

```typescript
import express from 'express';
import { createAuthModule } from 'visdak-auth';

const app = express();
app.use(express.json());

const authConfig = {
  jwtSecret: process.env.JWT_SECRET!,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  emailConfig: {
    provider: 'ses',
    from: 'noreply@yourdomain.com',
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  },
  appUrl: 'http://localhost:3000',
};

const { router, middleware } = createAuthModule(authConfig);

// Mount auth routes
app.use('/auth', router);

// Example: Protected route
app.get('/protected', middleware.protect, (req, res) => {
  res.json({ message: 'This is a protected route.' });
});

// Example: Admin-only route
app.get('/admin', middleware.protect, middleware.requireAdmin, (req, res) => {
  res.json({ message: 'This is an admin-only route.' });
});
```

---

### Email Providers

#### Amazon SES Configuration:
```typescript
emailConfig: {
  provider: 'ses',
  from: 'noreply@yourdomain.com',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
}
```

#### SMTP Configuration:
```typescript
emailConfig: {
  provider: 'smtp',
  from: 'noreply@yourdomain.com',
  smtp: {
    host: 'smtp.mailtrap.io',
    port: 587,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  },
}
```

---

## Custom Database Adapter

Implement your own database backend by extending the `DatabaseAdapter` interface.

```typescript
import { DatabaseAdapter } from 'visdak-auth';

export class PostgresAdapter implements DatabaseAdapter {
  async findUserByEmail(email: string) {
    // Query Postgres to find user by email
  }

  async createUser(userData) {
    // Save user data to Postgres
  }

  // Implement other methods as required
}
```

Register your adapter during the module initialization:

```typescript
const authConfig = {
  ...
  databaseAdapter: new PostgresAdapter(),
};
```

---

## Configuration Options

| Option                | Type                | Description                              | Required |
|-----------------------|---------------------|------------------------------------------|----------|
| `jwtSecret`           | `string`           | Secret key for signing JWT tokens.       | ✅        |
| `refreshTokenSecret`  | `string`           | Secret key for signing refresh tokens.   | ✅        |
| `accessTokenExpiry`   | `string`           | Expiration for access tokens (e.g., '15m'). | ✅     |
| `refreshTokenExpiry`  | `string`           | Expiration for refresh tokens (e.g., '7d'). | ✅     |
| `emailConfig`         | `object`           | Email provider configuration.            | ✅        |
| `appUrl`              | `string`           | Base URL of your app (used in email links). | ✅     |
| `databaseAdapter`     | `DatabaseAdapter`  | Custom database adapter.                 | ✅        |

---

## API Routes

| Route           | Method | Description            | Middleware        |
|------------------|--------|------------------------|-------------------|
| `/auth/login`    | POST   | User login             | -                 |
| `/auth/register` | POST   | User registration      | -                 |
| `/auth/refresh`  | POST   | Refresh access token   | -                 |
| `/auth/logout`   | POST   | Logout user            | `middleware.protect` |
| `/auth/verify`   | GET    | Email verification     | -                 |

---

## Response Structure

### Success Response:
```json
{
  "status": "success",
  "data": {
    "token": "your-jwt-token"
  },
  "message": "Operation successful"
}
```

### Error Response:
```json
{
  "status": "error",
  "message": "An error occurred",
  "error": {
    "code": 400,
    "details": "Invalid request payload"
  }
}
```

---

## Status Code Guidelines

| Status Code | Description                |
|-------------|----------------------------|
| 200         | OK                         |
| 201         | Created                    |
| 400         | Bad Request                |
| 401         | Unauthorized               |
| 403         | Forbidden                  |
| 404         | Not Found                  |
| 409         | Conflict                   |
| 500         | Internal Server Error      |

---

## Future Enhancements

- OAuth2 provider integration
- Multi-factor authentication (MFA)
- Rate limiting for login attempts

---

## License

MIT License - see the [LICENSE](LICENSE) file for details.