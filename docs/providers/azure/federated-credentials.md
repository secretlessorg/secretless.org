---
sidebar_position: 1
title: Azure Federated Identity Credentials
description: Configure Microsoft Azure to accept OpenID Connect (OIDC) authentication from external services using federated identity credentials, eliminating the need for client secrets
keywords: [azure, microsoft, entra id, federated identity, oidc, openid connect, authentication, secretless, github actions, gitlab ci, service principal]
---

# Azure Federated Identity Credentials

Configure Azure to accept OIDC authentication from external systems like GitHub Actions, GitLab CI, and Buildkite without storing client secrets.

## Overview

Azure's Workload Identity Federation enables external systems to authenticate using OIDC tokens instead of client secrets or certificates.

### Authentication Flow

1. **External system generates OIDC token**
2. **Token sent to Azure AD/Entra ID**
3. **Azure validates issuer, subject, and audience**
4. **Azure issues access token** (valid ~1 hour)
5. **Access token used for Azure resources**

## Configuration Requirements

Every federated credential requires five parameters:

| Parameter | Description | Requirements |
|-----------|-------------|--------------|
| **Name** | Unique identifier | 3-120 characters, alphanumeric/dash/underscore |
| **Issuer** | External identity provider URL | Must match token `iss` claim |
| **Subject** | External workload identifier | Must match token `sub` claim (max 600 chars) |
| **Audience** | Acceptable token audiences | Recommended: `api://AzureADTokenExchange` |
| **Description** | Optional context | Max 600 characters |

## Setup Methods

### Using Azure CLI

#### Create Service Principal

```bash
# Create app registration
appId=$(az ad app create --display-name "github-oidc-app" --query appId -otsv)

# Create service principal
az ad sp create --id $appId
```

#### Add Federated Credential

```bash
# Create credential JSON
cat <<EOF > credential.json
{
  "name": "github-actions-prod",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:myorg/myrepo:environment:Production",
  "audiences": ["api://AzureADTokenExchange"],
  "description": "GitHub Actions production environment"
}
EOF

az ad app federated-credential create --id $appId --parameters credential.json
```

### Using Terraform

```hcl
# Create Azure AD Application
resource "azuread_application" "github_app" {
  display_name = "github-actions-app"
}

# Create Service Principal
resource "azuread_service_principal" "github_sp" {
  client_id = azuread_application.github_app.client_id
}

# Add Federated Identity Credential
resource "azuread_application_federated_identity_credential" "github_prod" {
  application_id = azuread_application.github_app.id
  display_name   = "github-actions-production"
  description    = "Production environment"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:myorg/myrepo:environment:Production"
}

# Assign RBAC role
resource "azurerm_role_assignment" "contributor" {
  scope                = azurerm_resource_group.example.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.github_sp.object_id
}
```

## Subject Patterns

### GitHub Actions

| Entity Type | Subject Pattern |
|-------------|----------------|
| Environment | `repo:<org>/<repo>:environment:<name>` |
| Branch | `repo:<org>/<repo>:ref:refs/heads/<branch>` |
| Tag | `repo:<org>/<repo>:ref:refs/tags/<tag>` |
| Pull Request | `repo:<org>/<repo>:pull_request` |

**Note:** Standard credentials don't support wildcards. Each branch/environment needs separate credential.

### GitLab CI

| Scenario | Subject Pattern |
|----------|----------------|
| Specific branch | `project_path:<group>/<project>:ref_type:branch:ref:<branch>` |
| Specific tag | `project_path:<group>/<project>:ref_type:tag:ref:<tag>` |

## RBAC Configuration

### Assign Roles

```bash
# Resource group level
az role assignment create \
  --assignee $appId \
  --role "Contributor" \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP"

# Specific resource
az role assignment create \
  --assignee $appId \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG/providers/Microsoft.Storage/storageAccounts/$STORAGE"
```

### Recommended Roles by Use Case

| Use Case | Role | Scope |
|----------|------|-------|
| Infrastructure deployment | Contributor | Resource Group |
| Container deployment | AcrPush | ACR |
| Static site deployment | Storage Blob Data Contributor | Storage Account |
| Secrets access | Key Vault Secrets User | Key Vault |

## Security Best Practices

### 1. Use Specific Subjects

**Prefer environment-based:**
```
repo:org/repo:environment:Production
```

**Over branch-based:**
```
repo:org/repo:ref:refs/heads/main
```

### 2. Least Privilege RBAC

Assign roles at narrowest scope:

```bash
# Specific resource > Resource group > Subscription
az role assignment create \
  --assignee $appId \
  --role "Reader" \
  --scope "/subscriptions/$SUB_ID/resourceGroups/$RG/providers/Microsoft.Compute/virtualMachines/$VM"
```

### 3. Use GitHub Environments

Configure protection rules:
- Required reviewers
- Wait timers
- Allowed branches

### 4. Monitor Sign-ins

View in **Entra ID → Sign-in logs → Service principal sign-ins**

Key metrics:
- Failed authentication attempts
- Sign-ins from unexpected locations
- Token exchange failures

### 5. Enable Diagnostic Settings

```bash
az monitor diagnostic-settings create \
  --name "entra-sign-ins" \
  --resource "/tenants/$TENANT_ID/providers/Microsoft.aadiam" \
  --workspace "/subscriptions/$SUB_ID/resourceGroups/$RG/providers/Microsoft.OperationalInsights/workspaces/$WORKSPACE" \
  --logs '[{"category":"ServicePrincipalSignInLogs","enabled":true}]'
```

## Troubleshooting

### AADSTS70021: No matching federated identity record found

**Causes:**
1. Subject claim mismatch
2. Issuer URL mismatch
3. Audience mismatch
4. Missing trailing slash (for some issuers)

**Solution:**
```bash
# Verify configuration
az ad app federated-credential show --id $appId --federated-credential-id "cred-name"

# Check exact values match token claims
```

### AADSTS90061: External OIDC endpoint request failed

**Causes:**
1. OIDC issuer not accessible from internet
2. GitLab instance behind firewall

**Solution:**
- Ensure `/.well-known/openid-configuration` is publicly accessible
- Test: `curl https://your-issuer.com/.well-known/openid-configuration`

### AADSTS700016: Application not found

**Causes:**
1. Incorrect client ID
2. Wrong tenant ID

**Solution:**
```bash
# Verify application exists
az ad app show --id $CLIENT_ID

# Check tenant ID
az account show --query tenantId -o tsv
```

## Limitations

- **Maximum 20 federated credentials** per application/managed identity
- **No wildcard support** in standard credentials (use Flexible FIC preview for patterns)
- **Case-sensitive matching** of issuer, subject, audience
- **Replication delays** of 2-5 minutes after creation

## Complete Example

```bash
#!/bin/bash
set -e

APP_NAME="github-actions-oidc"
GITHUB_ORG="myorg"
GITHUB_REPO="myrepo"
RG="production-rg"
SUB_ID="your-subscription-id"

# Create app and SP
APP_ID=$(az ad app create --display-name "$APP_NAME" --query appId -otsv)
az ad sp create --id $APP_ID

# Add federated credentials
for env in Production Staging Development; do
  cat <<EOF > ${env}-cred.json
{
  "name": "github-${env,,}",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:${GITHUB_ORG}/${GITHUB_REPO}:environment:${env}",
  "audiences": ["api://AzureADTokenExchange"]
}
EOF
  az ad app federated-credential create --id $APP_ID --parameters ${env}-cred.json
done

# Assign RBAC
az role assignment create \
  --assignee $APP_ID \
  --role "Contributor" \
  --scope "/subscriptions/${SUB_ID}/resourceGroups/${RG}"

# Get IDs for GitHub secrets
TENANT_ID=$(az account show --query tenantId -otsv)

echo "Add these to GitHub secrets:"
echo "AZURE_CLIENT_ID: $APP_ID"
echo "AZURE_TENANT_ID: $TENANT_ID"
echo "AZURE_SUBSCRIPTION_ID: $SUB_ID"
```

## Next Steps

- **For GitHub Actions**: See [GitHub Actions Integration Guide](../../guides/github-actions-to-azure.md)
- **For GitLab CI**: See [GitLab CI Initiator Documentation](../../initiators/ci-tools/gitlab-ci.md)
- **Integration Examples**: Check [GitLab to Azure Guide](../../guides/gitlab-to-azure.md)

## Additional Resources

- [Azure Workload Identity Federation Documentation](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation)
- [GitHub Actions Azure Login](https://github.com/Azure/login)
- [Configure Azure with GitHub Actions](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure)
