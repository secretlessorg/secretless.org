---
sidebar_position: 3
title: Okta (Initiator)
description: Configure Okta to issue OIDC tokens for your services and workloads
keywords: [okta, oidc tokens, oauth2, service authentication]
---

# Okta as Token Issuer

Learn how to configure Okta to issue OIDC tokens that your services can use to authenticate to cloud providers and APIs.

## Overview

Okta can issue OIDC tokens for service applications, enabling your services to authenticate to:
- AWS (via IAM OIDC provider)
- Google Cloud Platform (via Workload Identity Federation)
- Azure (via federated credentials)
- Your own APIs accepting OIDC

## Use Cases

### Enterprise Service Authentication

Use Okta for enterprise-grade service-to-service auth:
```
Service → Okta (get token) → AWS/GCP/Azure (use token)
```

### OAuth2 Client Credentials

Standard OAuth2 flow for machine-to-machine:
```
Service → Okta (client credentials) → Protected API
```

### Multi-Org Services

Services authenticate with org-specific tokens:
```
Org A Service → Okta → Cloud (org-scoped access)
```

## Coming Soon

This guide is under development. Topics will include:

- Creating OAuth2 service applications
- Configuring custom authorization servers
- Custom scopes and claims
- Client Credentials flow
- Token inline hooks for customization
- Token lifetime and policies
- Integration guides (Okta → AWS, etc.)

## Token Structure

Okta-issued service tokens contain:

```json
{
  "iss": "https://YOUR_DOMAIN.okta.com/oauth2/default",
  "sub": "client_id",
  "aud": "api://your-service",
  "iat": 1735686000,
  "exp": 1735689600,
  "cid": "client_id",
  "scp": ["api.read", "api.write"],
  // Custom claims via inline hooks
  "tenant_id": "tenant-123",
  "environment": "production"
}
```

## Quick Example

```bash
# Get token from Okta
curl --request POST \
  --url 'https://YOUR_DOMAIN.okta.com/oauth2/default/v1/token' \
  --header 'content-type: application/x-www-form-urlencoded' \
  --data 'client_id=YOUR_CLIENT_ID' \
  --data 'client_secret=YOUR_CLIENT_SECRET' \
  --data 'grant_type=client_credentials' \
  --data 'scope=api://your-service'

# Use token to authenticate
curl https://api.yourservice.com/endpoint \
  -H "Authorization: Bearer $TOKEN"
```

## Related Guides

- Okta → AWS Integration (Coming soon)
- Okta → GCP Integration (Coming soon)
- [Using Okta as Your App's IdP](../../implementing/platforms/okta.md)

## Resources

- [Okta OAuth 2.0 Documentation](https://developer.okta.com/docs/guides/implement-oauth-for-okta/)
- [Okta Custom Authorization Servers](https://developer.okta.com/docs/concepts/auth-servers/)

## Contributing

Want to help complete this guide? [Contribute on GitHub](https://github.com/yourorg/secretless.org).
