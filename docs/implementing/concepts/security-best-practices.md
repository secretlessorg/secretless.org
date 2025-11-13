---
sidebar_position: 3
title: Security Best Practices
description: Essential security practices for implementing OIDC token validation in production applications
keywords: [security, oidc security, jwt security, best practices, production]
---

# Security Best Practices

Essential security practices for implementing OIDC token validation in production environments.

## Critical Security Requirements

:::danger
**SECURITY CRITICAL**: These practices are mandatory. Skipping any of them can lead to authentication bypass and security vulnerabilities.
:::

### 1. Always Verify Signatures

**Never trust token contents without signature verification.**

```javascript
// ❌ WRONG: Trusting decoded token without verification
const claims = jwt.decode(token);
if (claims.admin === true) {
  grantAdminAccess();
}

// ✅ CORRECT: Verify signature first
const claims = await jwt.verify(token, getPublicKey, {
  algorithms: ['RS256'],
  issuer: expectedIssuer,
  audience: expectedAudience
});
```

**Why**: Anyone can create a JWT with arbitrary claims. Only signature verification proves authenticity.

### 2. Only Allow RS256 Algorithm

**Never accept `HS256` (HMAC) for OIDC tokens.**

```javascript
// ❌ WRONG: Allows algorithm from token header
jwt.verify(token, key); // Vulnerable to algorithm confusion

// ❌ WRONG: Allows both RS256 and HS256
jwt.verify(token, key, { algorithms: ['RS256', 'HS256'] });

// ✅ CORRECT: Only RS256
jwt.verify(token, key, { algorithms: ['RS256'] });
```

**Why**: Algorithm confusion attacks allow attackers to forge tokens using your public key as an HMAC secret.

### 3. Validate All Required Claims

**Always validate issuer, audience, expiration, and subject.**

```javascript
// ✅ CORRECT: Comprehensive validation
function validateToken(claims) {
  // Required claims
  if (!claims.iss) throw new Error('Missing issuer');
  if (!claims.sub) throw new Error('Missing subject');
  if (!claims.aud) throw new Error('Missing audience');
  if (!claims.exp) throw new Error('Missing expiration');

  // Issuer allowlist
  if (!allowedIssuers.includes(claims.iss)) {
    throw new Error('Untrusted issuer');
  }

  // Audience match
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(expectedAudience)) {
    throw new Error('Invalid audience');
  }

  // Expiration (with clock skew)
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp < now - 60) {
    throw new Error('Token expired');
  }

  return claims;
}
```

### 4. Use HTTPS for All Connections

**Never fetch JWKS or accept tokens over HTTP.**

```javascript
// ❌ WRONG: HTTP endpoint
const jwksUri = 'http://token.actions.githubusercontent.com/.well-known/jwks';

// ✅ CORRECT: HTTPS only
const jwksUri = 'https://token.actions.githubusercontent.com/.well-known/jwks';

// Validate HTTPS in code
if (!jwksUri.startsWith('https://')) {
  throw new Error('JWKS endpoint must use HTTPS');
}
```

**Why**: HTTP allows man-in-the-middle attacks where attackers can replace public keys.

### 5. Implement Rate Limiting

**Protect against DoS attacks on token validation.**

```javascript
const rateLimit = require('express-rate-limit');

// Limit authentication attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many authentication attempts',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', authLimiter);
```

**Why**: Prevents brute force attacks and resource exhaustion.

## JWKS Handling

### 1. Cache Public Keys

**Always cache JWKS responses to avoid rate limiting and improve performance.**

```javascript
// ✅ CORRECT: Cache with TTL
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'https://token.actions.githubusercontent.com/.well-known/jwks',
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10
});
```

### 2. Handle Key Rotation

**Gracefully handle key rotation without downtime.**

```javascript
async function verifyWithRetry(token, maxRetries = 1) {
  try {
    return await verifyToken(token);
  } catch (error) {
    if (error.message.includes('invalid signature') && maxRetries > 0) {
      // Key might have rotated - clear cache and retry once
      await jwksClient.clearCache();
      return await verifyWithRetry(token, maxRetries - 1);
    }
    throw error;
  }
}
```

### 3. Validate JWKS Response

**Verify JWKS contains valid keys.**

```javascript
async function fetchJWKS(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`JWKS fetch failed: ${response.status}`);
  }

  const jwks = await response.json();

  // Validate response structure
  if (!jwks.keys || !Array.isArray(jwks.keys)) {
    throw new Error('Invalid JWKS response');
  }

  if (jwks.keys.length === 0) {
    throw new Error('JWKS contains no keys');
  }

  // Validate each key
  for (const key of jwks.keys) {
    if (!key.kid || !key.kty || !key.use) {
      throw new Error('Invalid key in JWKS');
    }
  }

  return jwks;
}
```

## Input Validation

### 1. Validate Token Format

**Check token format before processing.**

```javascript
function validateTokenFormat(token) {
  // Check basic format
  if (typeof token !== 'string') {
    throw new Error('Token must be a string');
  }

  // Check for Bearer prefix
  if (token.startsWith('Bearer ')) {
    token = token.substring(7);
  }

  // Check JWT structure (3 base64 parts)
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  // Validate base64 encoding
  try {
    for (const part of parts) {
      Buffer.from(part, 'base64');
    }
  } catch (error) {
    throw new Error('Invalid base64 encoding');
  }

  return token;
}
```

### 2. Sanitize Inputs from Claims

**Never trust claim values directly in queries or commands.**

```javascript
// ❌ WRONG: SQL injection risk
const query = `SELECT * FROM users WHERE repo = '${claims.repository}'`;

// ✅ CORRECT: Parameterized query
const query = 'SELECT * FROM users WHERE repo = ?';
db.query(query, [claims.repository]);

// ❌ WRONG: Command injection risk
exec(`deploy.sh ${claims.repository}`);

// ✅ CORRECT: Validate and sanitize
const repoPattern = /^[\w-]+\/[\w-]+$/;
if (!repoPattern.test(claims.repository)) {
  throw new Error('Invalid repository format');
}
```

### 3. Limit Token Size

**Prevent DoS attacks with excessively large tokens.**

```javascript
const MAX_TOKEN_SIZE = 8192; // 8KB

function validateTokenSize(token) {
  if (token.length > MAX_TOKEN_SIZE) {
    throw new Error('Token too large');
  }
  return token;
}
```

## Error Handling

### 1. Don't Leak Information

**Return generic error messages to clients.**

```javascript
// ❌ WRONG: Leaks details
try {
  const claims = await verifyToken(token);
} catch (error) {
  res.status(401).json({
    error: 'Token verification failed',
    details: error.message,  // Leaks validation details
    stack: error.stack        // Leaks code structure
  });
}

// ✅ CORRECT: Generic message
try {
  const claims = await verifyToken(token);
} catch (error) {
  // Log detailed error securely
  logger.error('Token validation failed', {
    error: error.message,
    tokenPrefix: token.substring(0, 20),
    ip: req.ip
  });

  // Return generic message
  res.status(401).json({
    error: 'Authentication failed'
  });
}
```

### 2. Log Security Events

**Log all authentication failures for security monitoring.**

```javascript
function logSecurityEvent(event, details) {
  logger.warn('Security event', {
    timestamp: new Date().toISOString(),
    event,
    ip: details.ip,
    userAgent: details.userAgent,
    error: details.error,
    // Don't log full tokens
    tokenPrefix: details.token?.substring(0, 20)
  });
}

// Use in authentication
try {
  const claims = await verifyToken(token);
} catch (error) {
  logSecurityEvent('auth_failure', {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    error: error.message,
    token
  });
  throw error;
}
```

### 3. Monitor for Attacks

**Alert on suspicious patterns.**

```javascript
const failureCount = new Map();

function checkBruteForce(ip) {
  const count = failureCount.get(ip) || 0;

  if (count > 10) {
    logger.alert('Possible brute force attack', { ip, count });
    // Consider blocking the IP
    throw new Error('Too many failed attempts');
  }

  failureCount.set(ip, count + 1);

  // Clear counter after 1 hour
  setTimeout(() => failureCount.delete(ip), 3600000);
}
```

## Authorization

### 1. Principle of Least Privilege

**Grant minimum necessary permissions based on token claims.**

```javascript
function getPermissions(claims) {
  const permissions = {
    canRead: false,
    canWrite: false,
    canDelete: false
  };

  // Base permissions for all authenticated users
  permissions.canRead = true;

  // Write access only for main branch
  if (claims.ref === 'refs/heads/main') {
    permissions.canWrite = true;
  }

  // Delete access only for specific repositories
  if (claims.repository === 'octo-org/admin-repo') {
    permissions.canDelete = true;
  }

  return permissions;
}
```

### 2. Validate Authorization on Every Request

**Don't cache authorization decisions.**

```javascript
// ❌ WRONG: Caching permissions
const userPermissions = new Map();

app.get('/api/resource', async (req, res) => {
  let permissions = userPermissions.get(req.user.sub);
  if (!permissions) {
    permissions = await getPermissions(req.user);
    userPermissions.set(req.user.sub, permissions);
  }
  // Stale permissions if user's access changed
});

// ✅ CORRECT: Fresh check every time
app.get('/api/resource', async (req, res) => {
  const permissions = await getPermissions(req.user);
  if (!permissions.canRead) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // Continue with request
});
```

### 3. Use Deny-by-Default

**Require explicit grants, don't assume permissions.**

```javascript
// ❌ WRONG: Allow by default
function canAccess(claims, resource) {
  if (claims.repository === 'blocked-repo') {
    return false;
  }
  return true; // Allow everything else
}

// ✅ CORRECT: Deny by default
function canAccess(claims, resource) {
  const allowedRepos = ['octo-org/repo1', 'octo-org/repo2'];
  if (allowedRepos.includes(claims.repository)) {
    return true;
  }
  return false; // Deny everything else
}
```

## Production Deployment

### 1. Use Environment Variables for Configuration

**Never hardcode secrets or configuration.**

```javascript
// ✅ CORRECT: Configuration from environment
const config = {
  jwksUri: process.env.JWKS_URI,
  expectedIssuer: process.env.EXPECTED_ISSUER,
  expectedAudience: process.env.EXPECTED_AUDIENCE,
  logLevel: process.env.LOG_LEVEL || 'info'
};

// Validate required configuration
if (!config.expectedIssuer || !config.expectedAudience) {
  throw new Error('Missing required configuration');
}
```

### 2. Keep Dependencies Updated

**Regularly update JWT libraries for security patches.**

```bash
# Check for outdated packages
npm outdated jsonwebtoken jwks-rsa

# Update to latest secure versions
npm update jsonwebtoken jwks-rsa

# Audit for vulnerabilities
npm audit
npm audit fix
```

### 3. Use Security Headers

**Add security headers to API responses.**

```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});
```

### 4. Enable CORS Properly

**Configure CORS to only allow trusted origins.**

```javascript
const cors = require('cors');

// ❌ WRONG: Allow all origins
app.use(cors({ origin: '*' }));

// ✅ CORRECT: Specific origins only
app.use(cors({
  origin: [
    'https://yourapp.com',
    'https://app.yourapp.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Monitoring and Alerting

### 1. Track Authentication Metrics

```javascript
const metrics = {
  totalAttempts: 0,
  successfulAuths: 0,
  failedAuths: 0,
  invalidTokens: 0,
  expiredTokens: 0
};

function trackMetrics(event) {
  metrics.totalAttempts++;

  switch (event.type) {
    case 'success':
      metrics.successfulAuths++;
      break;
    case 'expired':
      metrics.expiredTokens++;
      metrics.failedAuths++;
      break;
    case 'invalid':
      metrics.invalidTokens++;
      metrics.failedAuths++;
      break;
  }

  // Log metrics periodically
  if (metrics.totalAttempts % 100 === 0) {
    logger.info('Auth metrics', metrics);
  }
}
```

### 2. Alert on Anomalies

```javascript
function checkAnomalies() {
  const failureRate = metrics.failedAuths / metrics.totalAttempts;

  if (failureRate > 0.5) {
    logger.alert('High authentication failure rate', {
      failureRate,
      totalAttempts: metrics.totalAttempts,
      failedAuths: metrics.failedAuths
    });
  }
}

// Check every 5 minutes
setInterval(checkAnomalies, 5 * 60 * 1000);
```

## Testing Security

### 1. Test Invalid Tokens

```javascript
describe('Security Tests', () => {
  it('should reject tokens with invalid signature', async () => {
    const invalidToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Rva2VuLmFjdGlvbnMuZ2l0aHViLmNvbSJ9.invalid';
    await expect(verifyToken(invalidToken)).rejects.toThrow();
  });

  it('should reject expired tokens', async () => {
    const expiredToken = createTokenWithExp(Date.now() / 1000 - 3600);
    await expect(verifyToken(expiredToken)).rejects.toThrow('expired');
  });

  it('should reject tokens from wrong issuer', async () => {
    const token = createTokenWithIssuer('https://evil.com');
    await expect(verifyToken(token)).rejects.toThrow('issuer');
  });

  it('should reject tokens with HS256 algorithm', async () => {
    const token = createTokenWithAlgorithm('HS256');
    await expect(verifyToken(token)).rejects.toThrow();
  });

  it('should reject tokens without audience', async () => {
    const token = createTokenWithoutAudience();
    await expect(verifyToken(token)).rejects.toThrow('audience');
  });
});
```

### 2. Penetration Testing

**Test for common vulnerabilities:**

- Algorithm confusion attacks
- Expired token acceptance
- Missing signature verification
- SQL/command injection via claims
- Rate limit bypass
- JWKS manipulation

### 3. Security Audits

**Regular security reviews:**

- Code review focusing on authentication
- Dependency vulnerability scanning
- Static analysis for security issues
- Third-party security assessment

## Common Vulnerabilities

### 1. Algorithm Confusion (CVE-2015-9235)

**Attack**: Attacker changes algorithm from RS256 to HS256 and signs with public key.

**Prevention**:
```javascript
// Always specify algorithms explicitly
jwt.verify(token, key, { algorithms: ['RS256'] });
```

### 2. Missing Expiration Validation

**Attack**: Reuse old tokens indefinitely.

**Prevention**:
```javascript
// Validate expiration is present and not expired
if (!claims.exp || claims.exp < Math.floor(Date.now() / 1000)) {
  throw new Error('Token expired');
}
```

### 3. Audience Mismatch

**Attack**: Use token intended for different service.

**Prevention**:
```javascript
// Always validate audience
const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
if (!audiences.includes(expectedAudience)) {
  throw new Error('Invalid audience');
}
```

### 4. JWKS Injection

**Attack**: Trick application into using attacker's public key.

**Prevention**:
```javascript
// Only use HTTPS for JWKS
// Validate JWKS URL against allowlist
const allowedJwksUrls = [
  'https://token.actions.githubusercontent.com/.well-known/jwks',
  'https://gitlab.com/oauth/discovery/keys'
];

if (!allowedJwksUrls.includes(jwksUri)) {
  throw new Error('Untrusted JWKS endpoint');
}
```

## Security Checklist

Before deploying to production:

- [ ] Signature verification is mandatory
- [ ] Only RS256 algorithm is allowed
- [ ] All required claims are validated
- [ ] Issuer is validated against allowlist
- [ ] Audience matches expected value
- [ ] Expiration is checked with clock skew
- [ ] JWKS is fetched over HTTPS only
- [ ] JWKS responses are cached
- [ ] Rate limiting is enabled
- [ ] Error messages don't leak information
- [ ] Security events are logged
- [ ] Dependencies are up to date
- [ ] Security headers are set
- [ ] CORS is properly configured
- [ ] Input from claims is sanitized
- [ ] Authorization is checked on every request
- [ ] Tests cover security scenarios

## Resources

- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [RFC 7519: JWT Specification](https://datatracker.ietf.org/doc/html/rfc7519)
- [RFC 8725: JWT Best Current Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [CVE Details for JWT Libraries](https://www.cvedetails.com/)

## Next Steps

- Review [Token Validation](token-validation.md) for signature verification details
- See [Claims Verification](claims-verification.md) for claim validation examples
- Explore framework-specific security guides
