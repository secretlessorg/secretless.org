---
sidebar_position: 1
title: Auth0 (Initiator)
description: Configure Auth0 to issue OIDC tokens for your services and workloads
keywords: [auth0, oidc tokens, machine-to-machine, service authentication]
---

# Auth0 as Token Issuer

Learn how to configure Auth0 to issue OIDC tokens that your services can use to authenticate to cloud providers and APIs.

## Overview

Auth0 can issue OIDC tokens for machine-to-machine authentication, enabling your services to authenticate to:
- AWS (via IAM OIDC provider)
- Google Cloud Platform (via Workload Identity Federation)
- Azure (via federated credentials)
- Your own APIs accepting OIDC

## Use Cases

### Service-to-Cloud Authentication

Your services use Auth0-issued tokens to authenticate to cloud providers:
```
Service → Auth0 (get token) → AWS/GCP/Azure (use token)
```

### Machine-to-Machine APIs

Services authenticate to each other using Auth0 tokens:
```
Service A → Auth0 (get token) → Service B (validate token)
```

### Multi-Tenant Workloads

Each tenant's workloads get Auth0 tokens with tenant-specific claims:
```
Tenant A Service → Auth0 (tenant-scoped token) → Cloud Resources
```

## Coming Soon

This guide is under development. Topics will include:

- Creating machine-to-machine applications
- Configuring custom claims in tokens
- Token audience and scope configuration
- Retrieving tokens via Client Credentials flow
- Using Auth0 Actions to customize tokens
- Token lifetime and refresh
- Integration guides (Auth0 → AWS, Auth0 → GCP, etc.)

## Token Structure

Auth0-issued M2M tokens contain:

```json
{
  "iss": "https://YOUR_DOMAIN.auth0.com/",
  "sub": "client_id@clients",
  "aud": "https://api.yourservice.com",
  "iat": 1735686000,
  "exp": 1735689600,
  "azp": "YOUR_CLIENT_ID",
  "scope": "read:data write:data",
  "gty": "client-credentials",
  // Custom claims via Auth0 Actions
  "https://yourapp.com/tenant_id": "tenant-123"
}
```

## Quick Example

```bash
# Get token from Auth0
curl --request POST \
  --url 'https://YOUR_DOMAIN.auth0.com/oauth/token' \
  --header 'content-type: application/json' \
  --data '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "audience": "https://api.yourservice.com",
    "grant_type": "client_credentials"
  }'

# Use token to authenticate to your API
curl https://api.yourservice.com/endpoint \
  -H "Authorization: Bearer $TOKEN"
```

## Related Guides

- Auth0 → AWS Integration (Coming soon)
- Auth0 → GCP Integration (Coming soon)
- [Using Auth0 as Your App's IdP](../../implementing/platforms/auth0.md)

## Resources

- [Auth0 Machine-to-Machine Documentation](https://auth0.com/docs/get-started/authentication-and-authorization-flow/machine-to-machine-flow)
- [Auth0 Actions](https://auth0.com/docs/customize/actions)

## Contributing

Want to help complete this guide? [Contribute on GitHub](https://github.com/yourorg/secretless.org).
