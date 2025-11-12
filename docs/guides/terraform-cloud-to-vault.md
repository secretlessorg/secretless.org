---
sidebar_position: 8
title: Terraform Cloud → Vault
description: Step-by-step guide to configure Vault to accept OIDC authentication from Terraform Cloud
slug: /guides/terraform-cloud-to-vault
keywords: [vault, terraform cloud, hcp terraform, oidc, jwt, dynamic credentials]
---

# Configure Vault for Terraform Cloud Authentication

This guide shows you how to configure HashiCorp Vault to accept OIDC authentication from Terraform Cloud (HCP Terraform) workspaces, eliminating the need to store Vault tokens in your workspaces.

## Prerequisites

- HashiCorp Vault instance (v1.9.0 or later recommended)
- Vault admin access to configure authentication backends
- Terraform Cloud organization and workspace
- Self-hosted agents require v1.8.0 or later (if applicable)

## Architecture Overview

```
┌─────────────────────┐                    ┌──────────────┐
│  Terraform Cloud    │  OIDC Token (JWT)  │    Vault     │
│     Workspace       │───────────────────>│  JWT Auth    │
│                     │                    │   Backend    │
└─────────────────────┘                    └──────────────┘
         │                                        │
         │                                        ▼
         │                                  ┌──────────────┐
         │                                  │   Policies   │
         │                                  │   & Secrets  │
         │◀─────────────────────────────────┤              │
         │   Vault Token (short-lived)      └──────────────┘
         ▼
  Access secrets during
  Terraform run
```

## Step 1: Enable JWT Authentication Backend

Enable the JWT authentication method in Vault:

```bash
vault auth enable jwt
```

If you need a custom mount path:

```bash
vault auth enable -path=tfc-jwt jwt
```

## Step 2: Configure Trust with Terraform Cloud

Configure Vault to trust tokens from Terraform Cloud:

```bash
vault write auth/jwt/config \
    oidc_discovery_url="https://app.terraform.io" \
    bound_issuer="https://app.terraform.io"
```

For **Terraform Enterprise** (self-hosted), replace the URL with your instance:

```bash
vault write auth/jwt/config \
    oidc_discovery_url="https://terraform.example.com" \
    bound_issuer="https://terraform.example.com"
```

:::info OIDC Discovery
The `oidc_discovery_url` allows Vault to automatically fetch the OIDC provider's public keys for token validation. Include the `https://` scheme but no trailing slash.
:::

## Step 3: Create Vault Policy

Create a policy defining what secrets your Terraform workspace can access. Save this as `tfc-policy.hcl`:

```hcl
# Allow tokens to query themselves
path "auth/token/lookup-self" {
  capabilities = ["read"]
}

# Allow tokens to renew themselves
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Allow tokens to revoke themselves
path "auth/token/revoke-self" {
  capabilities = ["update"]
}

# Access to specific secrets
path "secret/data/terraform/*" {
  capabilities = ["read"]
}

# Example: Access to database credentials
path "database/creds/terraform" {
  capabilities = ["read"]
}

# Example: Access to AWS dynamic credentials
path "aws/creds/terraform-role" {
  capabilities = ["read"]
}
```

Write the policy to Vault:

```bash
vault policy write tfc-policy tfc-policy.hcl
```

:::tip Least Privilege
Grant only the minimum permissions necessary for your Terraform workspace. Use separate policies for different workspaces or environments.
:::

## Step 4: Create JWT Authentication Role

Create a role that maps Terraform Cloud workspaces to the Vault policy.

### Option A: Single Workspace Mapping

For a specific workspace:

```bash
vault write auth/jwt/role/tfc-role \
    role_type="jwt" \
    bound_audiences="vault.workload.identity" \
    bound_claims="sub=organization:my-org-name:project:my-project-name:workspace:my-workspace-name:run_phase:*" \
    user_claim="terraform_full_workspace" \
    token_ttl=20m \
    token_policies="tfc-policy"
```

### Option B: All Workspaces in a Project

To allow all workspaces in a project:

```bash
vault write auth/jwt/role/tfc-project-role \
    role_type="jwt" \
    bound_audiences="vault.workload.identity" \
    bound_claims="sub=organization:my-org-name:project:my-project-name:workspace:*:run_phase:*" \
    user_claim="terraform_full_workspace" \
    token_ttl=20m \
    token_policies="tfc-policy"
```

### Option C: All Workspaces in an Organization

To allow all workspaces in your organization:

```bash
vault write auth/jwt/role/tfc-org-role \
    role_type="jwt" \
    bound_audiences="vault.workload.identity" \
    bound_claims="sub=organization:my-org-name:*" \
    user_claim="terraform_full_workspace" \
    token_ttl=20m \
    token_policies="tfc-policy"
```

:::warning Security Critical
Always validate at minimum:
- **`bound_audiences`**: Prevents tokens intended for other services from being used
- **Organization name in `bound_claims`**: Prevents other Terraform Cloud organizations from accessing your Vault

Example of an insecure configuration:
```bash
# ❌ INSECURE - accepts tokens from any organization
bound_claims="sub=organization:*:*"
```
:::

### Role Configuration Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `role_type` | Must be `"jwt"` for Terraform Cloud | `"jwt"` |
| `bound_audiences` | Token audience claim (prevents reuse) | `["vault.workload.identity"]` |
| `bound_claims` | Required claims in token (security boundary) | `sub=organization:acme:*` |
| `user_claim` | Claim to use as Vault username | `terraform_full_workspace` |
| `token_ttl` | Token lifetime (recommend 20m for automation) | `20m` |
| `token_policies` | Vault policies to attach | `tfc-policy` |

## Step 5: Configure Terraform Cloud Workspace

Add these environment variables to your Terraform Cloud workspace:

### Required Variables

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `TFC_VAULT_PROVIDER_AUTH` | `true` | Enable dynamic credentials |
| `TFC_VAULT_ADDR` | `https://vault.example.com:8200` | Vault server address |
| `TFC_VAULT_RUN_ROLE` | `tfc-role` | Vault role name (from Step 4) |

### Optional Variables

| Variable Name | Value | Use Case |
|---------------|-------|----------|
| `TFC_VAULT_NAMESPACE` | `admin/terraform` | Vault Enterprise namespaces |
| `TFC_VAULT_AUTH_PATH` | `tfc-jwt` | Custom JWT mount path |
| `TFC_VAULT_WORKLOAD_IDENTITY_AUDIENCE` | `vault.workload.identity` | Custom audience (must match role) |
| `TFC_VAULT_PLAN_ROLE` | `tfc-plan-role` | Read-only role for plan phase |
| `TFC_VAULT_APPLY_ROLE` | `tfc-apply-role` | Write role for apply phase |
| `TFC_VAULT_ENCODED_CACERT` | `LS0tLS1C...` | Base64-encoded CA cert for custom CAs |

:::info Custom CA Certificates
If your Vault instance uses a custom or self-signed certificate, encode it:
```bash
cat vault-ca.crt | base64
```
Set the output as `TFC_VAULT_ENCODED_CACERT`.
:::

## Step 6: Configure Terraform Vault Provider

Update your Terraform configuration to use dynamic credentials. **Do not** hardcode `address`, `token`, or `namespace`:

```hcl
terraform {
  required_providers {
    vault = {
      source  = "hashicorp/vault"
      version = "~> 4.0"
    }
  }
}

provider "vault" {
  # address, token, and namespace are set automatically
  # by Terraform Cloud using environment variables
}

# Access secrets in your configuration
data "vault_generic_secret" "database" {
  path = "secret/data/terraform/database"
}

resource "aws_db_instance" "example" {
  # Use secrets from Vault
  username = data.vault_generic_secret.database.data["username"]
  password = data.vault_generic_secret.database.data["password"]
}
```

Terraform Cloud automatically sets these environment variables during runs:
- `VAULT_ADDR` - Vault server address
- `VAULT_TOKEN` - Temporary token obtained via OIDC
- `VAULT_NAMESPACE` - Vault namespace (if configured)

## Step 7: Verify Configuration

### Test Authentication

From a machine with the Vault CLI and a valid Terraform Cloud token:

```bash
# Get a JWT from Terraform Cloud (example - actual token retrieval varies)
export TFC_WORKLOAD_IDENTITY_TOKEN="<your-token>"

# Authenticate to Vault
vault write auth/jwt/login role=tfc-role jwt=$TFC_WORKLOAD_IDENTITY_TOKEN

# Verify you can access secrets
vault kv get secret/terraform/database
```

### Run a Terraform Plan

In your Terraform Cloud workspace:

1. Queue a plan
2. Check the run logs for Vault authentication
3. Verify secrets are accessible during the run

Expected log output:
```
Initializing Vault provider...
Vault provider configured successfully
```

## Phase-Specific Roles (Advanced)

Implement least-privilege access by using different roles for plan and apply:

### Plan Role (Read-Only)

```bash
vault policy write tfc-plan-policy - <<EOF
path "secret/data/terraform/*" {
  capabilities = ["read"]
}
EOF

vault write auth/jwt/role/tfc-plan-role \
    role_type="jwt" \
    bound_audiences="vault.workload.identity" \
    bound_claims="sub=organization:my-org:*:run_phase:plan" \
    user_claim="terraform_full_workspace" \
    token_ttl=20m \
    token_policies="tfc-plan-policy"
```

### Apply Role (Read-Write)

```bash
vault policy write tfc-apply-policy - <<EOF
path "secret/data/terraform/*" {
  capabilities = ["read"]
}
path "database/creds/*" {
  capabilities = ["read"]
}
path "aws/creds/*" {
  capabilities = ["read"]
}
EOF

vault write auth/jwt/role/tfc-apply-role \
    role_type="jwt" \
    bound_audiences="vault.workload.identity" \
    bound_claims="sub=organization:my-org:*:run_phase:apply" \
    user_claim="terraform_full_workspace" \
    token_ttl=20m \
    token_policies="tfc-apply-policy"
```

### Workspace Configuration

```hcl
TFC_VAULT_PROVIDER_AUTH = true
TFC_VAULT_ADDR = "https://vault.example.com:8200"
TFC_VAULT_PLAN_ROLE = "tfc-plan-role"
TFC_VAULT_APPLY_ROLE = "tfc-apply-role"
```

## Troubleshooting

### "Permission Denied" Errors

**Cause**: Role not found or bound claims don't match

**Solution**: Verify role configuration matches your Terraform Cloud organization/workspace:
```bash
vault read auth/jwt/role/tfc-role
```

### "Invalid Audience" Errors

**Cause**: Audience mismatch between role and workspace configuration

**Solution**: Ensure `bound_audiences` matches `TFC_VAULT_WORKLOAD_IDENTITY_AUDIENCE` (default: `vault.workload.identity`)

### Token Expiration During Long Runs

**Cause**: `token_ttl` too short for run duration

**Solution**: Increase TTL and ensure token renewal is enabled:
```bash
vault write auth/jwt/role/tfc-role \
    token_ttl=60m \
    token_max_ttl=120m
```

### Self-Signed Certificate Errors

**Cause**: Vault uses custom CA not trusted by Terraform Cloud

**Solution**: Set `TFC_VAULT_ENCODED_CACERT` with your CA certificate (base64-encoded)

## Security Considerations

- **Rotate Secrets**: Regularly rotate secrets stored in Vault
- **Audit Logging**: Enable Vault audit logging to track secret access
- **Namespace Isolation**: Use Vault namespaces to isolate teams/environments (Enterprise)
- **Principle of Least Privilege**: Grant minimum necessary permissions
- **Monitor Usage**: Set up alerting for unusual authentication patterns

## Additional Resources

- [Terraform Cloud Dynamic Credentials Overview](../initiators/infrastructure-as-code/terraform-cloud.md)
- [Vault OIDC Authentication Overview](../providers/vault/overview.md)
- [Vault JWT Auth Documentation](https://developer.vaultproject.io/docs/auth/jwt)
- [HashiCorp Tutorial: Authenticate Providers with Dynamic Credentials](https://developer.hashicorp.com/terraform/tutorials/cloud/dynamic-credentials)
- [Vault-Backed Dynamic Credentials](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/dynamic-provider-credentials/vault-backed)
