---
sidebar_position: 1
title: JWT Token Validation
description: Understanding JWT structure, signature verification, and JWKS endpoints for secure OIDC token validation
keywords: [jwt, token validation, jwks, signature verification, oidc]
---

# JWT Token Validation

Learn how to validate JSON Web Tokens (JWT) used in OIDC authentication workflows.

## Overview

OIDC tokens are JWTs - digitally signed JSON objects that contain claims about the authenticated identity. Proper validation ensures tokens are authentic and haven't been tampered with.

:::warning
**Security Critical**: Improper token validation can lead to authentication bypass. Follow all validation steps carefully.
:::

## JWT Structure

A JWT consists of three base64-encoded parts separated by dots:

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature
│                                  │                   │
│                                  │                   └─ Signature
│                                  └───────────────────── Payload (Claims)
└──────────────────────────────────────────────────────── Header
```

### Header

Contains metadata about the token:

```json
{
  "alg": "RS256",      // Signing algorithm (MUST be RS256 for OIDC)
  "typ": "JWT",        // Token type
  "kid": "abc123"      // Key ID (identifies which public key to use)
}
```

### Payload (Claims)

Contains identity information and metadata:

```json
{
  "iss": "https://token.actions.githubusercontent.com",
  "sub": "repo:owner/repo:ref:refs/heads/main",
  "aud": "https://api.yourservice.com",
  "exp": 1735689600,
  "iat": 1735686000,
  "nbf": 1735686000,
  "jti": "unique-token-id",
  // Issuer-specific claims
  "repository": "owner/repo",
  "ref": "refs/heads/main"
}
```

### Signature

Cryptographic signature created using the issuer's private key. Validates token authenticity.

## Validation Steps

Validate tokens in this **exact order**:

### 1. Decode Without Verification

First, decode the token to extract the header and payload **without verifying the signature**:

```javascript
const jwt = require('jsonwebtoken');

// Decode to inspect claims (does NOT verify)
const decoded = jwt.decode(token, { complete: true });

const header = decoded.header;   // { alg, typ, kid }
const payload = decoded.payload; // { iss, sub, aud, exp, ... }
```

:::danger
**Never trust decoded claims until signature is verified!** This step is only for extracting metadata (like `iss` and `kid`) needed for verification.
:::

### 2. Identify the Issuer

Extract the issuer (`iss`) claim to determine which public keys to use:

```javascript
const issuer = decoded.payload.iss;

// Map issuer to JWKS endpoint
const jwksEndpoints = {
  'https://token.actions.githubusercontent.com': 'https://token.actions.githubusercontent.com/.well-known/jwks',
  'https://gitlab.com': 'https://gitlab.com/oauth/discovery/keys',
  'https://accounts.google.com': 'https://www.googleapis.com/oauth2/v3/certs'
};

const jwksUri = jwksEndpoints[issuer];
if (!jwksUri) {
  throw new Error(`Unknown issuer: ${issuer}`);
}
```

### 3. Fetch Public Keys (JWKS)

Retrieve the JSON Web Key Set (JWKS) from the issuer:

```javascript
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: jwksUri,
  cache: true,           // Cache keys for performance
  cacheMaxAge: 600000,   // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

// Get the signing key using the key ID (kid) from token header
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}
```

**JWKS Example Response**:

```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "abc123",
      "use": "sig",
      "n": "0vx7agoebGcQ...",  // RSA public key modulus
      "e": "AQAB"              // RSA public key exponent
    }
  ]
}
```

### 4. Verify Signature

Use the public key to verify the token's signature:

```javascript
const verifiedPayload = jwt.verify(token, getKey, {
  algorithms: ['RS256'],  // Only allow RS256 (REQUIRED for security)
  issuer: issuer,
  audience: 'https://api.yourservice.com',
  clockTolerance: 60      // Allow 60 seconds clock skew
});
```

:::warning
**Algorithm Confusion Attack**: Always specify `algorithms: ['RS256']`. Never allow `HS256` (HMAC) for OIDC tokens.
:::

### 5. Validate Claims

After signature verification, validate required claims (covered in [Claims Verification](claims-verification.md)).

## JWKS Caching

Fetching JWKS on every request is slow and can hit rate limits. Implement caching:

### In-Memory Cache

```javascript
const NodeCache = require('node-cache');
const jwksCache = new NodeCache({ stdTTL: 600 }); // 10 minutes

async function getJWKS(issuer) {
  const cached = jwksCache.get(issuer);
  if (cached) return cached;

  const response = await fetch(jwksEndpoints[issuer]);
  const jwks = await response.json();

  jwksCache.set(issuer, jwks);
  return jwks;
}
```

### Cache Invalidation

Handle key rotation gracefully:

```javascript
async function verifyWithRetry(token) {
  try {
    return await verifyToken(token);
  } catch (error) {
    if (error.name === 'JsonWebTokenError' && error.message.includes('invalid signature')) {
      // Key might have rotated - clear cache and retry
      jwksCache.flushAll();
      return await verifyToken(token);
    }
    throw error;
  }
}
```

## Common Algorithms

### RS256 (RSA + SHA256) - REQUIRED

Asymmetric signing using RSA public/private key pairs. **This is the only algorithm allowed for OIDC.**

- Issuer signs with **private key**
- You verify with **public key** (from JWKS)
- Public key cannot create signatures
- Industry standard for OIDC

### HS256 (HMAC + SHA256) - NEVER USE FOR OIDC

Symmetric signing using shared secret. **Do NOT accept HS256 for OIDC tokens.**

- Both parties share the same secret
- Anyone who can verify can also sign
- Security risk: if you treat public key as HMAC secret, attackers can forge tokens

:::danger
**Never allow `HS256` for OIDC**. Attackers can exploit algorithm confusion to forge tokens using your public key as an HMAC secret.
:::

## Security Best Practices

### 1. Validate Algorithm

```javascript
// ✅ CORRECT: Only allow RS256
jwt.verify(token, getKey, { algorithms: ['RS256'] });

// ❌ WRONG: Allows algorithm confusion attacks
jwt.verify(token, getKey); // Uses algorithm from token header
```

### 2. Use Current Libraries

Keep JWT libraries up to date:

```bash
npm outdated jsonwebtoken jwks-rsa
npm update jsonwebtoken jwks-rsa
```

### 3. Handle Errors Securely

Don't leak information in error messages:

```javascript
try {
  const claims = await verifyToken(token);
} catch (error) {
  // ❌ WRONG: Leaks details
  res.status(401).json({ error: error.message });

  // ✅ CORRECT: Generic message
  res.status(401).json({ error: 'Invalid or expired token' });

  // Log detailed error securely
  logger.error('Token validation failed', { error: error.message, token: token.substring(0, 20) });
}
```

### 4. Rate Limit JWKS Fetches

Prevent DoS by rate limiting JWKS endpoint requests:

```javascript
const client = jwksClient({
  jwksUri: jwksUri,
  rateLimit: true,
  jwksRequestsPerMinute: 10
});
```

## Example: Complete Validation

```javascript
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const allowedIssuers = {
  'https://token.actions.githubusercontent.com': {
    jwksUri: 'https://token.actions.githubusercontent.com/.well-known/jwks',
    audience: 'https://api.yourservice.com'
  }
};

// Create JWKS clients for each issuer
const jwksClients = {};
Object.entries(allowedIssuers).forEach(([issuer, config]) => {
  jwksClients[issuer] = jwksClient({
    jwksUri: config.jwksUri,
    cache: true,
    cacheMaxAge: 600000,
    rateLimit: true,
    jwksRequestsPerMinute: 10
  });
});

async function verifyToken(token) {
  // Step 1: Decode without verification
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded) {
    throw new Error('Invalid token format');
  }

  // Step 2: Identify issuer
  const issuer = decoded.payload.iss;
  const issuerConfig = allowedIssuers[issuer];
  if (!issuerConfig) {
    throw new Error('Unknown issuer');
  }

  // Step 3: Get signing key
  const client = jwksClients[issuer];
  const getKey = (header, callback) => {
    client.getSigningKey(header.kid, (err, key) => {
      if (err) return callback(err);
      callback(null, key.publicKey || key.rsaPublicKey);
    });
  };

  // Step 4 & 5: Verify signature and validate claims
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

module.exports = { verifyToken };
```

## Testing Token Validation

### Unit Tests

```javascript
const { verifyToken } = require('./auth');

describe('Token Validation', () => {
  it('should reject tokens with invalid signature', async () => {
    const invalidToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Rva2VuLmFjdGlvbnMuZ2l0aHViLmNvbSJ9.invalid';
    await expect(verifyToken(invalidToken)).rejects.toThrow();
  });

  it('should reject expired tokens', async () => {
    const expiredToken = createExpiredToken();
    await expect(verifyToken(expiredToken)).rejects.toThrow('jwt expired');
  });

  it('should accept valid tokens', async () => {
    const validToken = await getValidTestToken();
    const claims = await verifyToken(validToken);
    expect(claims.iss).toBe('https://token.actions.githubusercontent.com');
  });
});
```

## Troubleshooting

### "invalid signature" Error

**Causes**:
- Token signed with different key than in JWKS
- JWKS cache is stale (key rotation occurred)
- Token is from wrong issuer
- Token has been tampered with

**Solutions**:
1. Clear JWKS cache and retry
2. Verify issuer matches expected value
3. Check token hasn't expired
4. Ensure JWKS URL is correct

### "no matching key" Error

**Causes**:
- Token's `kid` (key ID) not found in JWKS
- JWKS endpoint returned empty response
- Key rotation just occurred

**Solutions**:
1. Fetch fresh JWKS from endpoint
2. Verify JWKS endpoint is accessible
3. Check token's `kid` header value
4. Retry after clearing cache

### Performance Issues

**Symptoms**:
- Slow token validation
- High latency on authenticated requests

**Solutions**:
1. Enable JWKS caching (10-60 minutes)
2. Use connection pooling for JWKS fetches
3. Implement health checks for JWKS endpoints
4. Monitor cache hit rates

## Next Steps

- Learn about [Claims Verification](claims-verification.md) for validating token contents
- Review [Security Best Practices](security-best-practices.md) for production deployments
- See framework-specific guides for implementation examples
