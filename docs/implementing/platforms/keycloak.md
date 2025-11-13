---
sidebar_position: 2
title: Keycloak
description: Self-hosting Keycloak as your application's open-source identity provider
keywords: [keycloak, identity provider, self-hosted, open-source, oidc]
---

# Using Keycloak for Application Authentication

Learn how to self-host Keycloak as your application's identity provider for complete control over authentication.

## Overview

Keycloak is an open-source identity and access management solution that you can self-host, providing OIDC authentication without vendor lock-in.

## Coming Soon

This guide is under development. Topics will include:

- Installing and deploying Keycloak
- Creating realms and clients
- Configuring OIDC flows
- Validating Keycloak tokens
- Role-based access control
- User federation (LDAP/AD)
- Identity brokering
- Custom themes and branding
- High availability setup

## Use Cases

### 1. Self-Hosted Authentication

Run your own identity provider:
- Full data control
- No vendor lock-in
- Customizable authentication flows
- On-premises deployment

### 2. Enterprise Integration

Connect to existing identity systems:
- LDAP/Active Directory federation
- SAML identity brokering
- Custom user storage providers
- SSO across applications

### 3. Multi-Tenancy

Create separate realms for each customer:
- Isolated user bases
- Custom branding per tenant
- Tenant-specific authentication rules
- Cross-realm trust relationships

## Quick Example

```javascript
// Verify Keycloak token in your API
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'https://keycloak.yourcompany.com/realms/myrealm/protocol/openid-connect/certs'
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    callback(null, key.publicKey || key.rsaPublicKey);
  });
}

jwt.verify(token, getKey, {
  audience: 'your-api-client-id',
  issuer: 'https://keycloak.yourcompany.com/realms/myrealm',
  algorithms: ['RS256']
}, (err, decoded) => {
  if (err) throw err;
  console.log('User authenticated:', decoded);
});
```

## Resources

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Keycloak on Kubernetes](https://www.keycloak.org/operator/installation)
- [Keycloak Admin Guide](https://www.keycloak.org/docs/latest/server_admin/)

## Contributing

Want to help complete this guide? [Contribute on GitHub](https://github.com/yourorg/secretless.org).
