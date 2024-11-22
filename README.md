# Visdak Auth

A pluggable authentication module with support for multiple databases and email providers.

## Features

- Modular architecture with adapter pattern
- Swappable database backends
- Configurable email providers
- JWT-based authentication
- TypeScript support

## Installation

```bash
npm install visdak-auth
```

## Usage

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

// Protected route example
app.get('/protected', middleware.protect, (req, res) => {
  res.json({ message: 'Protected route' });
});

// Admin route example
app.get('/admin', middleware.protect, middleware.requireAdmin, (req, res) => {
  res.json({ message: 'Admin route' });
});
```

## Custom Database Adapter

Create your own database adapter by implementing the `DatabaseAdapter` interface:

```typescript
import { DatabaseAdapter } from 'visdak-auth';

export class PostgresAdapter implements DatabaseAdapter {
  // Implement the required methods
}
```

## Configuration

The module accepts a configuration object with the following options:

```typescript
interface AuthConfig {
  jwtSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  emailConfig: {
    provider: 'ses' | 'smtp';
    from: string;
    region?: string;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
    smtp?: {
      host: string;
      port: number;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
  appUrl: string;
}
```

## License

MIT