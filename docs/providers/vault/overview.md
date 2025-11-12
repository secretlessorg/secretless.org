---
sidebar_position: 1
title: HashiCorp Vault Overview
description: Configure HashiCorp Vault to accept secretless OIDC authentication from various platforms
slug: /providers/vault
keywords: [vault, hashicorp, oidc, jwt, secretless, authentication]
---

# HashiCorp Vault Secretless Authentication

HashiCorp Vault supports secretless authentication through its **JWT/OIDC authentication backend**, allowing external services to authenticate using JSON Web Tokens without storing static credentials.

## How It Works

Vault's JWT authentication method validates tokens issued by trusted OIDC providers:

1. **Trust Configuration**: Vault is configured with the OIDC discovery URL and issuer of the identity provider
2. **Token Presentation**: An external service (like Terraform Cloud, GitHub Actions, etc.) presents a JWT token to Vault
3. **Token Validation**: Vault validates the token's signature and claims using the provider's public keys
4. **Policy Mapping**: Vault maps validated tokens to policies based on bound claims (organization, workspace, etc.)
5. **Secret Access**: The authenticated session can access secrets according to the assigned policies

## Key Features

- **Zero Static Credentials**: No need to distribute or rotate Vault tokens
- **Fine-Grained Access Control**: Map specific workspaces, projects, or environments to Vault policies
- **Short-Lived Sessions**: Tokens have configurable TTLs for automatic expiration
- **Centralized Secrets Management**: Use Vault as a single source of truth for secrets across your infrastructure
- **Audit Trail**: Vault logs all authentication attempts and secret access

## Common Use Cases

### 1. CI/CD Pipeline Authentication

Services like Terraform Cloud, GitHub Actions, and GitLab CI can authenticate to Vault without storing Vault tokens:

- **Terraform Cloud**: Uses workload identity tokens to access secrets during runs
- **GitHub Actions**: Uses OIDC tokens from GitHub's identity provider
- **GitLab CI**: Uses job tokens with JWT claims

### 2. Secrets Engine Integration

Vault can act as an intermediary for cloud provider credentials:

- **AWS Secrets Engine**: Generate temporary AWS credentials on-demand
- **GCP Secrets Engine**: Create short-lived GCP service account keys
- **Azure Secrets Engine**: Generate Azure service principal credentials
- **Database Credentials**: Provision just-in-time database credentials

### 3. Vault-Backed Dynamic Credentials

For environments where OIDC metadata endpoints cannot be publicly exposed, Vault can serve as a bridge:

```
Terraform Cloud → Vault (OIDC) → Cloud Provider (Vault Secrets Engine)
```

This allows you to:
- Keep OIDC trust relationships private
- Centralize credential generation in Vault
- Apply consistent security policies across multiple cloud providers

## Authentication Methods

Vault supports two JWT-based authentication methods:

### JWT Auth Method

Used when you have pre-existing JWTs from an OIDC provider:

- **Offline Validation**: Tokens are validated using public keys from the OIDC discovery endpoint
- **Bound Claims**: Restrict authentication based on token claims (subject, audience, organization, etc.)
- **Flexible Mapping**: Map token claims to Vault metadata and policies

### OIDC Auth Method

Used for interactive browser-based authentication:

- **Authorization Code Flow**: Redirects users to OIDC provider for login
- **Group Mapping**: Automatically map OIDC groups to Vault policies
- **SSO Integration**: Integrate with corporate identity providers (Okta, Azure AD, etc.)

For CI/CD and automation, the **JWT auth method** is recommended.

## Configuration Components

Setting up Vault for secretless authentication involves:

1. **Enable JWT Auth Backend**: Activate the authentication method
2. **Configure Trust**: Set OIDC discovery URL and issuer
3. **Create Policies**: Define what secrets each role can access
4. **Create Roles**: Map token claims to Vault policies with bound claims

## Security Best Practices

:::warning Critical Security Considerations
- **Validate Audience**: Always bind roles to specific audience claims to prevent token reuse
- **Restrict Organizations**: Use bound claims to ensure only your organization can authenticate
- **Minimum Privileges**: Grant the least privileges necessary for each role
- **Short TTLs**: Use short token TTLs (e.g., 20 minutes) for automated workflows
- **Enable Renewal**: Allow token renewal for long-running processes
:::

### Bound Claims Validation

Always validate these claims in your role configuration:

```hcl
bound_audiences = ["vault.workload.identity"]
bound_claims = {
  "sub" = "organization:your-org:project:your-project:workspace:*"
}
```

This ensures:
- Tokens are intended for Vault (audience validation)
- Only tokens from your organization are accepted (subject validation)

## Vault Enterprise Features

Vault Enterprise provides additional capabilities:

- **Namespaces**: Isolate teams and environments within a single Vault cluster
- **Sentinel Policies**: Enforce compliance rules at authentication time
- **MFA**: Require multi-factor authentication for sensitive operations
- **Performance Replication**: Scale read operations across multiple clusters

## Next Steps

Choose your identity provider to see detailed integration guides:

- [Terraform Cloud → Vault](../../guides/terraform-cloud-to-vault.md)
- GitHub Actions → Vault (Coming Soon)
- GitLab CI → Vault (Coming Soon)

## Additional Resources

- [Vault JWT/OIDC Auth Documentation](https://developer.vaultproject.io/docs/auth/jwt)
- [Vault Secrets Engines](https://developer.vaultproject.io/docs/secrets)
- [Vault Security Best Practices](https://developer.vaultproject.io/docs/internals/security)
