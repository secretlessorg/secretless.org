---
sidebar_position: 1
title: Node.js / Express
description: Implementing OIDC token validation in Express.js applications with middleware
keywords: [nodejs, express, oidc, jwt, middleware, authentication]
---

# OIDC Authentication in Node.js / Express

Learn how to implement OIDC token validation in Express.js applications using middleware.

## Overview

This guide shows you how to build Express.js middleware that validates OIDC tokens from GitHub Actions, GitLab CI, Kubernetes, and other identity providers.

## Prerequisites

- Node.js >= 18.0
- Express.js >= 4.18
- Basic understanding of Express middleware

## Installation

Install required packages:

```bash
npm install express jsonwebtoken jwks-rsa
```

**Dependencies**:
- `jsonwebtoken`: JWT signing and verification
- `jwks-rsa`: JWKS endpoint client with caching

## Basic Implementation

### 1. Create Authentication Middleware

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Configure allowed issuers and their JWKS endpoints
const allowedIssuers = {
  'https://token.actions.githubusercontent.com': {
    jwksUri: 'https://token.actions.githubusercontent.com/.well-known/jwks',
    audience: 'https://api.yourservice.com'
  },
  'https://gitlab.com': {
    jwksUri: 'https://gitlab.com/oauth/discovery/keys',
    audience: 'https://api.yourservice.com'
  }
};

// Create JWKS clients for each issuer
const jwksClients = {};
Object.entries(allowedIssuers).forEach(([issuer, config]) => {
  jwksClients[issuer] = jwksClient({
    jwksUri: config.jwksUri,
    cache: true,
    cacheMaxAge: 600000, // 10 minutes
    rateLimit: true,
    jwksRequestsPerMinute: 10
  });
});

async function verifyToken(token) {
  // Decode to get issuer (without verification)
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded) {
    throw new Error('Invalid token format');
  }

  const issuer = decoded.payload.iss;
  const issuerConfig = allowedIssuers[issuer];
  if (!issuerConfig) {
    throw new Error('Unknown issuer');
  }

  // Get signing key
  const client = jwksClients[issuer];
  const getKey = (header, callback) => {
    client.getSigningKey(header.kid, (err, key) => {
      if (err) return callback(err);
      callback(null, key.publicKey || key.rsaPublicKey);
    });
  };

  // Verify token
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      algorithms: ['RS256'],
      issuer: issuer,
      audience: issuerConfig.audience,
      clockTolerance: 60
    }, (err, payload) => {
      if (err) return reject(err);
      resolve(payload);
    });
  });
}

// Middleware function
async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);

    // Verify token
    const claims = await verifyToken(token);

    // Add claims to request object
    req.user = claims;
    next();
  } catch (error) {
    console.error('Authentication failed:', error.message);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

module.exports = { authenticate, verifyToken };
```

### 2. Use Middleware in Routes

```javascript
// app.js
const express = require('express');
const { authenticate } = require('./middleware/auth');

const app = express();
app.use(express.json());

// Public endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Protected endpoint (requires auth)
app.get('/api/protected', authenticate, (req, res) => {
  res.json({
    message: 'Access granted',
    user: {
      issuer: req.user.iss,
      subject: req.user.sub,
      repository: req.user.repository // GitHub Actions
    }
  });
});

// Protected with authorization
app.post('/api/deploy', authenticate, (req, res) => {
  // Check authorization based on claims
  if (req.user.ref !== 'refs/heads/main') {
    return res.status(403).json({ error: 'Only main branch can deploy' });
  }

  if (req.user.repository_owner !== 'my-org') {
    return res.status(403).json({ error: 'Unauthorized organization' });
  }

  // Proceed with deployment
  res.json({ message: 'Deployment started' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Advanced Features

### Multi-Issuer Support

Handle tokens from multiple identity providers:

```javascript
// config/issuers.js
module.exports = {
  'https://token.actions.githubusercontent.com': {
    jwksUri: 'https://token.actions.githubusercontent.com/.well-known/jwks',
    audience: 'https://api.yourservice.com',
    name: 'GitHub Actions'
  },
  'https://gitlab.com': {
    jwksUri: 'https://gitlab.com/oauth/discovery/keys',
    audience: 'https://api.yourservice.com',
    name: 'GitLab CI'
  },
  'https://kubernetes.default.svc.cluster.local': {
    jwksUri: 'https://kubernetes.default.svc.cluster.local/openid/v1/jwks',
    audience: 'https://api.yourservice.com',
    name: 'Kubernetes'
  }
};
```

### Authorization Middleware

Create separate middleware for fine-grained authorization:

```javascript
// middleware/authorize.js

// Check if user can access specific repository
function requireRepository(allowedRepos) {
  return (req, res, next) => {
    const repository = req.user.repository || req.user.project_path;

    if (!repository) {
      return res.status(403).json({ error: 'No repository in token' });
    }

    if (!allowedRepos.includes(repository)) {
      return res.status(403).json({ error: 'Unauthorized repository' });
    }

    next();
  };
}

// Check if user can deploy to environment
function requireEnvironment(env) {
  return (req, res, next) => {
    // GitHub Actions: check ref
    if (req.user.ref) {
      const isMainBranch = req.user.ref === 'refs/heads/main';
      if (env === 'production' && !isMainBranch) {
        return res.status(403).json({ error: 'Production deploys require main branch' });
      }
    }

    // GitLab CI: check environment
    if (req.user.environment && req.user.environment !== env) {
      return res.status(403).json({ error: 'Environment mismatch' });
    }

    next();
  };
}

// Check if workflow is authorized
function requireWorkflow(allowedWorkflows) {
  return (req, res, next) => {
    if (!req.user.workflow) {
      return res.status(403).json({ error: 'No workflow in token' });
    }

    if (!allowedWorkflows.includes(req.user.workflow)) {
      return res.status(403).json({ error: 'Unauthorized workflow' });
    }

    next();
  };
}

module.exports = {
  requireRepository,
  requireEnvironment,
  requireWorkflow
};
```

### Using Authorization Middleware

```javascript
const { authenticate } = require('./middleware/auth');
const {
  requireRepository,
  requireEnvironment,
  requireWorkflow
} = require('./middleware/authorize');

// Deploy to production
app.post('/api/deploy/production',
  authenticate,
  requireRepository(['my-org/my-repo']),
  requireEnvironment('production'),
  requireWorkflow(['deploy']),
  (req, res) => {
    res.json({ message: 'Production deployment started' });
  }
);

// Deploy to staging
app.post('/api/deploy/staging',
  authenticate,
  requireRepository(['my-org/my-repo', 'my-org/other-repo']),
  requireEnvironment('staging'),
  (req, res) => {
    res.json({ message: 'Staging deployment started' });
  }
);
```

## Error Handling

### Centralized Error Handler

```javascript
// middleware/errorHandler.js

function errorHandler(err, req, res, next) {
  // Log error details securely
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Authentication errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Authorization errors
  if (err.message.includes('Unauthorized')) {
    return res.status(403).json({ error: err.message });
  }

  // Generic error
  res.status(500).json({
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error'
  });
}

module.exports = errorHandler;
```

### Use Error Handler

```javascript
const errorHandler = require('./middleware/errorHandler');

// Routes...

// Add error handler last
app.use(errorHandler);
```

## Testing

### Unit Tests

```javascript
// tests/auth.test.js
const { verifyToken } = require('../middleware/auth');

describe('Authentication Middleware', () => {
  it('should verify valid GitHub Actions token', async () => {
    const token = process.env.TEST_GITHUB_TOKEN;
    const claims = await verifyToken(token);

    expect(claims.iss).toBe('https://token.actions.githubusercontent.com');
    expect(claims.repository).toBe('my-org/my-repo');
  });

  it('should reject expired tokens', async () => {
    const expiredToken = 'eyJhbGci...expired';
    await expect(verifyToken(expiredToken))
      .rejects.toThrow('expired');
  });

  it('should reject tokens from unknown issuers', async () => {
    const unknownToken = createTokenWithIssuer('https://evil.com');
    await expect(verifyToken(unknownToken))
      .rejects.toThrow('Unknown issuer');
  });
});
```

### Integration Tests

```javascript
// tests/integration.test.js
const request = require('supertest');
const app = require('../app');

describe('Protected Endpoints', () => {
  const validToken = process.env.TEST_GITHUB_TOKEN;

  it('should allow access with valid token', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
  });

  it('should deny access without token', async () => {
    const response = await request(app)
      .get('/api/protected');

    expect(response.status).toBe(401);
  });

  it('should enforce authorization rules', async () => {
    const response = await request(app)
      .post('/api/deploy/production')
      .set('Authorization', `Bearer ${validToken}`);

    // Depends on token claims
    expect([200, 403]).toContain(response.status);
  });
});
```

## Configuration

### Environment Variables

```bash
# .env
NODE_ENV=production
PORT=3000
EXPECTED_AUDIENCE=https://api.yourservice.com
LOG_LEVEL=info

# Optional: Override default issuers
GITHUB_JWKS_URI=https://token.actions.githubusercontent.com/.well-known/jwks
GITLAB_JWKS_URI=https://gitlab.com/oauth/discovery/keys
```

### Load Configuration

```javascript
// config/index.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  expectedAudience: process.env.EXPECTED_AUDIENCE,
  logLevel: process.env.LOG_LEVEL || 'info',

  // Validate required config
  validate() {
    if (!this.expectedAudience) {
      throw new Error('EXPECTED_AUDIENCE must be set');
    }
  }
};
```

## Performance Optimization

### JWKS Caching Strategy

```javascript
const NodeCache = require('node-cache');
const jwksCache = new NodeCache({
  stdTTL: 600, // 10 minutes
  checkperiod: 120
});

// Override JWKS client with custom cache
function createJWKSClient(issuerConfig) {
  return jwksClient({
    jwksUri: issuerConfig.jwksUri,
    cache: true,
    cacheMaxAge: 600000,
    getKeysInterceptor: (cb) => {
      const cached = jwksCache.get(issuerConfig.jwksUri);
      if (cached) {
        return cb(null, cached);
      }
      // Cache miss - fetch and cache
      cb();
    }
  });
}
```

### Connection Pooling

```javascript
const https = require('https');

// Create agent with connection pooling
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000
});

// Use in JWKS client
const client = jwksClient({
  jwksUri: 'https://token.actions.githubusercontent.com/.well-known/jwks',
  requestAgent: httpsAgent
});
```

## Security Considerations

1. **Always use HTTPS**: Ensure your API only accepts HTTPS requests
2. **Validate algorithm**: Only allow RS256 in JWT verification
3. **Rate limiting**: Implement rate limiting on authentication endpoints
4. **CORS configuration**: Properly configure CORS for your frontend
5. **Logging**: Log authentication failures for security monitoring
6. **Token size limits**: Reject excessively large tokens (>8KB)

## Production Deployment

### Docker Example

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

USER node

CMD ["node", "app.js"]
```

### Kubernetes Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      containers:
      - name: api-server
        image: your-registry/api-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: EXPECTED_AUDIENCE
          value: "https://api.yourservice.com"
        - name: NODE_ENV
          value: "production"
        resources:
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
```

## Complete Example

See the [example repository](https://github.com/yourorg/oidc-express-example) for a complete working implementation.

## Next Steps

- Review [Token Validation](../concepts/token-validation.md) for detailed validation logic
- See [Claims Verification](../concepts/claims-verification.md) for authorization patterns
- Check [Security Best Practices](../concepts/security-best-practices.md) for production hardening
