---
sidebar_position: 5
title: Custom Implementation
description: Building your own JWT token validation without third-party identity platforms
keywords: [custom, jwt validation, diy, implementation, self-hosted]
---

# Custom JWT Token Validation

Learn how to implement JWT token validation without relying on third-party identity platforms.

## Overview

For maximum control and flexibility, you can implement your own JWT token validation logic without using managed identity platforms like Auth0 or Okta.

## When to Use Custom Implementation

### Good Reasons

- **Existing identity system**: You already have user authentication
- **Specific requirements**: Need custom token claims or validation logic
- **Cost optimization**: High volume makes managed platforms expensive
- **Regulatory compliance**: Data residency or sovereignty requirements
- **Learning purposes**: Educational projects or proof of concepts

### Consider Managed Platforms If

- You need user management UI
- You want social login integration
- You require enterprise SSO (SAML, etc.)
- You prefer outsourcing security updates
- You want quick time-to-market

## Coming Soon

This guide is under development. Topics will include:

- JWT structure and validation
- JWKS endpoint implementation
- Token generation and signing
- Claims management
- Refresh token handling
- Token revocation strategies
- Security best practices
- Testing and validation

## Architecture Overview

```
Your Application
├── Token Generation
│   ├── Sign with RSA private key
│   ├── Add standard claims (iss, sub, aud, exp)
│   └── Add custom claims
├── JWKS Endpoint
│   ├── Expose public keys
│   └── Handle key rotation
└── Token Validation
    ├── Verify signature with public key
    ├── Validate claims
    └── Authorize based on claims
```

## Basic Example

```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Generate tokens
const privateKey = fs.readFileSync('private-key.pem');

function generateToken(userId, scopes) {
  return jwt.sign({
    sub: userId,
    iss: 'https://yourapp.com',
    aud: 'https://api.yourapp.com',
    scope: scopes.join(' '),
    custom_claim: 'value'
  }, privateKey, {
    algorithm: 'RS256',
    expiresIn: '1h',
    keyid: 'key-1'
  });
}

// Validate tokens
const publicKey = fs.readFileSync('public-key.pem');

function verifyToken(token) {
  return jwt.verify(token, publicKey, {
    issuer: 'https://yourapp.com',
    audience: 'https://api.yourapp.com',
    algorithms: ['RS256']
  });
}

// Expose JWKS endpoint
app.get('/.well-known/jwks.json', (req, res) => {
  res.json({
    keys: [{
      kty: 'RSA',
      use: 'sig',
      kid: 'key-1',
      n: '...', // RSA modulus
      e: 'AQAB'
    }]
  });
});
```

## Key Management

### Generating RSA Keys

```bash
# Generate private key
openssl genrsa -out private-key.pem 2048

# Extract public key
openssl rsa -in private-key.pem -pubout -out public-key.pem

# Extract modulus and exponent for JWKS
openssl rsa -in private-key.pem -noout -modulus
```

### Key Rotation

Implement regular key rotation:

```javascript
const activeKeys = new Map();
const retiredKeys = new Map();

function rotateKeys() {
  // Move current key to retired
  const currentKey = activeKeys.get('current');
  if (currentKey) {
    retiredKeys.set(currentKey.kid, currentKey);
  }

  // Generate and set new key
  const newKey = generateNewKeyPair();
  activeKeys.set('current', newKey);

  // Remove old retired keys after grace period
  cleanupOldKeys();
}

// Rotate keys monthly
setInterval(rotateKeys, 30 * 24 * 60 * 60 * 1000);
```

## Resources

- [JWT Specification (RFC 7519)](https://datatracker.ietf.org/doc/html/rfc7519)
- [JWK Specification (RFC 7517)](https://datatracker.ietf.org/doc/html/rfc7517)
- [JWT Best Practices (RFC 8725)](https://datatracker.ietf.org/doc/html/rfc8725)

## Contributing

Want to help complete this guide? [Contribute on GitHub](https://github.com/yourorg/secretless.org).
