---
sidebar_position: 2
title: Keycloak (Initiator)
description: Configure Keycloak to issue OIDC tokens for your services and workloads
keywords: [keycloak, oidc tokens, service accounts, machine authentication]
---

# Keycloak as Token Issuer

Learn how to configure Keycloak to issue OIDC tokens that your services can use to authenticate to cloud providers and APIs.

## Overview

Keycloak can issue OIDC tokens for service accounts, enabling your services to authenticate to:
- AWS (via IAM OIDC provider)
- Google Cloud Platform (via Workload Identity Federation)
- Azure (via federated credentials)
- Your own APIs accepting OIDC

## Use Cases

### Self-Hosted Service Authentication

Run your own identity provider for service-to-service auth:
```
Service → Keycloak (get token) → AWS/GCP/Azure (use token)
```

### On-Premises to Cloud

Authenticate on-premises services to cloud resources:
```
On-Prem Service → Keycloak (get token) → Cloud Provider
```

### Custom Claims Control

Add custom claims to tokens for fine-grained authorization:
```
Service → Keycloak (custom claims) → Your API (authorize by claims)
```

## Coming Soon

This guide is under development. Topics will include:

- Creating service accounts (confidential clients)
- Configuring client scopes and mappers
- Adding custom claims to tokens
- Token audience configuration
- Client Credentials grant flow
- Service account roles and permissions
- Token lifetime policies
- Integration guides (Keycloak → AWS, etc.)

## Token Structure

Keycloak-issued service account tokens contain:

```json
{
  "iss": "https://keycloak.yourcompany.com/realms/myrealm",
  "sub": "service-account-client-id",
  "aud": "api://your-service",
  "exp": 1735689600,
  "iat": 1735686000,
  "azp": "client-id",
  "scope": "email profile",
  "clientId": "client-id",
  "clientHost": "10.0.0.1",
  // Custom claims via mappers
  "environment": "production",
  "tenant_id": "tenant-123"
}
```

## Quick Example

```bash
# Get token from Keycloak
curl --request POST \
  --url 'https://keycloak.yourcompany.com/realms/myrealm/protocol/openid-connect/token' \
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

- Keycloak → AWS Integration (Coming soon)
- Keycloak → GCP Integration (Coming soon)
- [Using Keycloak as Your App's IdP](../../implementing/platforms/keycloak.md)

## Resources

- [Keycloak Service Accounts](https://www.keycloak.org/docs/latest/server_admin/#_service_accounts)
- [Keycloak Client Scopes](https://www.keycloak.org/docs/latest/server_admin/#_client_scopes)

## Contributing

Want to help complete this guide? [Contribute on GitHub](https://github.com/yourorg/secretless.org).
