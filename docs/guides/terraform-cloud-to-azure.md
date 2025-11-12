---
sidebar_position: 7
title: Terraform Cloud → Azure
description: Configure Microsoft Azure to accept OIDC authentication from Terraform Cloud using federated identity credentials
slug: /guides/terraform-cloud-to-azure
keywords: [azure, microsoft, entra id, terraform cloud, hcp terraform, federated identity, oidc, dynamic credentials]
---

# Configure Azure for Terraform Cloud Authentication

This guide shows you how to configure Microsoft Azure to accept OIDC authentication from Terraform Cloud (HCP Terraform) using federated identity credentials, eliminating the need to store client secrets.

## Prerequisites

- Azure subscription with appropriate permissions
- Azure AD/Entra ID admin access
- Terraform Cloud organization and workspace
- Self-hosted agents require v1.7.0 or later (if applicable)

## Architecture Overview

```
┌─────────────────────┐                    ┌──────────────┐
│  Terraform Cloud    │   OIDC Token       │    Azure     │
│     Workspace       │───────────────────>│  Entra ID    │
│                     │                    │  (Azure AD)  │
└─────────────────────┘                    └──────────────┘
         │                                        │
         │                                        ▼
         │                                 Token Validation
         │                                        │
         │                                        ▼
         │                                ┌──────────────┐
         │                                │   Service    │
         │                                │  Principal   │
         │                                └──────────────┘
         │                                        │
         └────────────────────────────────> Azure Access
                Azure Credentials               Token
```

## Step 1: Create Azure AD Application

Create an application registration that will represent Terraform Cloud.

### Using Azure CLI

```bash
# Create app registration
APP_ID=$(az ad app create \
    --display-name "terraform-cloud-app" \
    --query appId \
    --output tsv)

echo "Application ID: $APP_ID"

# Create service principal
az ad sp create --id $APP_ID
```

### Using Terraform

```hcl
resource "azuread_application" "terraform_cloud" {
  display_name = "terraform-cloud-app"
}

resource "azuread_service_principal" "terraform_cloud" {
  client_id = azuread_application.terraform_cloud.client_id
}
```

## Step 2: Add Federated Identity Credential

Configure the application to trust OIDC tokens from Terraform Cloud.

### Understanding Subject Patterns

Terraform Cloud tokens include claims that identify the workspace:

```
organization:<ORG>:project:<PROJECT>:workspace:<WORKSPACE>:run_phase:<PHASE>
```

Example:
```
organization:acme-corp:project:infrastructure:workspace:production:run_phase:apply
```

### Using Azure CLI

Create a credential for a specific workspace:

```bash
cat <<EOF > credential.json
{
  "name": "terraform-cloud-prod",
  "issuer": "https://app.terraform.io",
  "subject": "organization:acme-corp:project:infrastructure:workspace:production:run_phase:*",
  "audiences": ["api://AzureADTokenExchange"],
  "description": "Terraform Cloud production workspace"
}
EOF

az ad app federated-credential create \
    --id $APP_ID \
    --parameters credential.json
```

For **Terraform Enterprise** (self-hosted):

```bash
cat <<EOF > credential.json
{
  "name": "terraform-cloud-prod",
  "issuer": "https://terraform.example.com",
  "subject": "organization:acme-corp:project:infrastructure:workspace:production:run_phase:*",
  "audiences": ["api://AzureADTokenExchange"]
}
EOF

az ad app federated-credential create \
    --id $APP_ID \
    --parameters credential.json
```

:::warning Security Critical
**Always use specific subject patterns** that include your organization name to prevent unauthorized access from other Terraform Cloud organizations.

Never use:
```json
// ❌ INSECURE - allows any organization
"subject": "organization:*:project:*:workspace:*:run_phase:*"
```
:::

### Using Terraform

```hcl
resource "azuread_application_federated_identity_credential" "terraform_cloud_prod" {
  application_id = azuread_application.terraform_cloud.id
  display_name   = "terraform-cloud-production"
  description    = "Terraform Cloud production workspace"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://app.terraform.io"
  subject        = "organization:acme-corp:project:infrastructure:workspace:production:run_phase:*"
}
```

### Subject Pattern Examples

| Pattern | Use Case | Security Level |
|---------|----------|----------------|
| `organization:acme:project:infra:workspace:prod:run_phase:*` | Specific workspace (both phases) | Highest |
| `organization:acme:project:infra:workspace:prod:run_phase:apply` | Apply phase only | High |
| `organization:acme:project:infra:workspace:*:run_phase:*` | All workspaces in project | Medium |
| `organization:acme:project:*:workspace:*:run_phase:*` | All workspaces in org | Lower |

## Step 3: Assign RBAC Roles

Grant the service principal permissions to manage Azure resources.

### Using Azure CLI

```bash
# Get subscription ID
SUBSCRIPTION_ID=$(az account show --query id --output tsv)

# Resource group level (recommended)
az role assignment create \
    --assignee $APP_ID \
    --role "Contributor" \
    --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/production-rg"

# Subscription level (use with caution)
az role assignment create \
    --assignee $APP_ID \
    --role "Contributor" \
    --scope "/subscriptions/$SUBSCRIPTION_ID"

# Specific resource
az role assignment create \
    --assignee $APP_ID \
    --role "Storage Blob Data Contributor" \
    --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/production-rg/providers/Microsoft.Storage/storageAccounts/myaccount"
```

### Using Terraform

```hcl
data "azurerm_subscription" "current" {}

data "azurerm_resource_group" "production" {
  name = "production-rg"
}

# Resource group level
resource "azurerm_role_assignment" "terraform_cloud_contributor" {
  scope                = data.azurerm_resource_group.production.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.terraform_cloud.object_id
}

# Specific permissions (least privilege)
resource "azurerm_role_assignment" "terraform_cloud_storage" {
  scope                = azurerm_storage_account.example.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azuread_service_principal.terraform_cloud.object_id
}
```

:::tip Least Privilege
Assign roles at the narrowest scope necessary:
1. **Best**: Specific resource
2. **Good**: Resource group
3. **Caution**: Subscription
4. **Avoid**: Management group (unless truly needed)
:::

### Recommended Roles by Use Case

| Use Case | Role | Scope |
|----------|------|-------|
| General infrastructure | `Contributor` | Resource Group |
| Container deployment | `AcrPush` | Container Registry |
| Static website | `Storage Blob Data Contributor` | Storage Account |
| Key Vault secrets | `Key Vault Secrets User` | Key Vault |
| Network management | `Network Contributor` | Resource Group |

## Step 4: Configure Terraform Cloud Workspace

Add environment variables to your Terraform Cloud workspace to enable dynamic credentials.

### Required Variables

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `TFC_AZURE_PROVIDER_AUTH` | `true` | Enable dynamic credentials |
| `TFC_AZURE_RUN_CLIENT_ID` | Application (client) ID from Step 1 | Service principal ID |
| `ARM_SUBSCRIPTION_ID` | Your Azure subscription ID | Target subscription |
| `ARM_TENANT_ID` | Your Azure tenant ID | Azure AD tenant |

### Get Required IDs

```bash
# Get subscription ID
az account show --query id --output tsv

# Get tenant ID
az account show --query tenantId --output tsv

# Get application ID (from Step 1)
echo $APP_ID
```

### Optional Variables

| Variable Name | Value | Use Case |
|---------------|-------|----------|
| `TFC_AZURE_PLAN_CLIENT_ID` | Plan-phase client ID | Separate credentials for plan |
| `TFC_AZURE_APPLY_CLIENT_ID` | Apply-phase client ID | Separate credentials for apply |
| `TFC_AZURE_WORKLOAD_IDENTITY_AUDIENCE` | `api://AzureADTokenExchange` | Custom audience (must match credential) |

## Step 5: Configure Terraform Azure Provider

Update your Terraform configuration to use dynamic credentials. **Do not** hardcode `client_secret`:

```hcl
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}

  # Do NOT set client_secret
  # subscription_id, tenant_id, and client_id are set via environment variables
}

# Use Azure resources normally
resource "azurerm_storage_account" "example" {
  name                     = "examplestoracct"
  resource_group_name      = "production-rg"
  location                 = "eastus"
  account_tier             = "Standard"
  account_replication_type = "LRS"
}
```

:::warning Provider Configuration
Terraform Cloud automatically configures authentication via environment variables. Do not set `client_secret`, `use_msi`, or `use_cli` in the provider block.
:::

## Step 6: Verify Configuration

### Test Plan

Queue a plan in your Terraform Cloud workspace:

1. Navigate to your workspace
2. Click **Actions → Start new plan**
3. Check run logs for authentication success

Expected output:
```
Initializing Azure provider...
Azure provider configured with dynamic credentials
```

### Test Apply

Queue an apply to create resources:

1. Approve the plan
2. Verify resources are created in Azure Portal
3. Check Azure Activity Logs for service principal activity

## Phase-Specific Credentials (Advanced)

Use separate service principals for plan and apply phases to implement least-privilege access.

### Plan Service Principal (Read-Only)

```bash
# Create plan app
PLAN_APP_ID=$(az ad app create \
    --display-name "terraform-cloud-plan-app" \
    --query appId \
    --output tsv)

az ad sp create --id $PLAN_APP_ID

# Add federated credential for plan phase
cat <<EOF > plan-credential.json
{
  "name": "terraform-cloud-plan",
  "issuer": "https://app.terraform.io",
  "subject": "organization:acme-corp:project:infrastructure:workspace:production:run_phase:plan",
  "audiences": ["api://AzureADTokenExchange"]
}
EOF

az ad app federated-credential create \
    --id $PLAN_APP_ID \
    --parameters plan-credential.json

# Grant read-only permissions
az role assignment create \
    --assignee $PLAN_APP_ID \
    --role "Reader" \
    --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/production-rg"
```

### Apply Service Principal (Read-Write)

```bash
# Create apply app
APPLY_APP_ID=$(az ad app create \
    --display-name "terraform-cloud-apply-app" \
    --query appId \
    --output tsv)

az ad sp create --id $APPLY_APP_ID

# Add federated credential for apply phase
cat <<EOF > apply-credential.json
{
  "name": "terraform-cloud-apply",
  "issuer": "https://app.terraform.io",
  "subject": "organization:acme-corp:project:infrastructure:workspace:production:run_phase:apply",
  "audiences": ["api://AzureADTokenExchange"]
}
EOF

az ad app federated-credential create \
    --id $APPLY_APP_ID \
    --parameters apply-credential.json

# Grant write permissions
az role assignment create \
    --assignee $APPLY_APP_ID \
    --role "Contributor" \
    --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/production-rg"
```

### Configure Workspace Variables

```hcl
TFC_AZURE_PROVIDER_AUTH = true
TFC_AZURE_PLAN_CLIENT_ID = "<PLAN_APP_ID>"
TFC_AZURE_APPLY_CLIENT_ID = "<APPLY_APP_ID>"
ARM_SUBSCRIPTION_ID = "<SUBSCRIPTION_ID>"
ARM_TENANT_ID = "<TENANT_ID>"
```

## Complete Terraform Example

```hcl
variable "terraform_org" {
  description = "Terraform Cloud organization"
}

variable "terraform_project" {
  description = "Terraform Cloud project"
}

variable "terraform_workspace" {
  description = "Terraform Cloud workspace"
}

variable "subscription_id" {
  description = "Azure subscription ID"
}

# Azure AD Application
resource "azuread_application" "terraform_cloud" {
  display_name = "terraform-cloud-app"
}

# Service Principal
resource "azuread_service_principal" "terraform_cloud" {
  client_id = azuread_application.terraform_cloud.client_id
}

# Federated Identity Credential
resource "azuread_application_federated_identity_credential" "terraform_cloud" {
  application_id = azuread_application.terraform_cloud.id
  display_name   = "terraform-cloud-${var.terraform_workspace}"
  description    = "Terraform Cloud ${var.terraform_workspace} workspace"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://app.terraform.io"
  subject        = "organization:${var.terraform_org}:project:${var.terraform_project}:workspace:${var.terraform_workspace}:run_phase:*"
}

# Resource Group
resource "azurerm_resource_group" "example" {
  name     = "terraform-rg"
  location = "East US"
}

# RBAC Assignment
resource "azurerm_role_assignment" "terraform_cloud" {
  scope                = azurerm_resource_group.example.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.terraform_cloud.object_id
}

# Outputs for Terraform Cloud configuration
output "client_id" {
  value       = azuread_application.terraform_cloud.client_id
  description = "Use for TFC_AZURE_RUN_CLIENT_ID"
}

output "tenant_id" {
  value       = data.azurerm_client_config.current.tenant_id
  description = "Use for ARM_TENANT_ID"
}

output "subscription_id" {
  value       = var.subscription_id
  description = "Use for ARM_SUBSCRIPTION_ID"
}

data "azurerm_client_config" "current" {}
```

## Troubleshooting

### AADSTS70021: No matching federated identity record found

**Cause**: Subject claim doesn't match any configured credential

**Solution**: Verify credential subject matches workspace identity:
```bash
az ad app federated-credential list --id $APP_ID --output table
```

### AADSTS700016: Application not found in directory

**Cause**: Incorrect client ID or tenant ID

**Solution**: Verify IDs are correct:
```bash
az ad app show --id $APP_ID
az account show --query tenantId
```

### "Insufficient privileges" errors

**Cause**: Service principal lacks required RBAC role

**Solution**: Check role assignments:
```bash
az role assignment list --assignee $APP_ID --output table
```

### "Audience validation failed"

**Cause**: Audience mismatch between credential and workspace configuration

**Solution**: Ensure both use `api://AzureADTokenExchange`:
```bash
az ad app federated-credential show \
    --id $APP_ID \
    --federated-credential-id "<cred-id>" \
    --query audiences
```

## Limitations

- **Maximum 20 federated credentials** per application
- **Case-sensitive matching** of issuer, subject, and audience
- **Replication delays** of 2-5 minutes after credential creation
- **No wildcard support** in standard credentials (except at end of subject)

## Security Best Practices

### 1. Use Specific Subjects

Always include organization name:
```json
// ✅ Secure
"subject": "organization:acme-corp:project:infra:workspace:prod:run_phase:*"

// ❌ Insecure
"subject": "organization:*:*"
```

### 2. Scope RBAC Tightly

Prefer resource-specific roles over subscription-wide:
```bash
# Good - specific scope
--scope "/subscriptions/.../resourceGroups/prod-rg"

# Avoid - too broad
--scope "/subscriptions/..."
```

### 3. Monitor Sign-in Logs

Check **Entra ID → Sign-in logs → Service principal sign-ins**

Look for:
- Failed authentication attempts
- Unexpected sign-in locations
- Token exchange failures

### 4. Enable Activity Logs

```bash
az monitor activity-log list \
    --caller $APP_ID \
    --output table
```

### 5. Separate Environments

Use different service principals for dev/staging/production.

## Complete Setup Script

```bash
#!/bin/bash
set -e

# Configuration
APP_NAME="terraform-cloud-app"
ORG_NAME="acme-corp"
PROJECT_NAME="infrastructure"
WORKSPACE_NAME="production"
RG_NAME="production-rg"

# Create app and SP
echo "Creating Azure AD application..."
APP_ID=$(az ad app create --display-name "$APP_NAME" --query appId -otsv)
az ad sp create --id $APP_ID

# Add federated credential
echo "Adding federated identity credential..."
cat <<EOF > credential.json
{
  "name": "terraform-cloud-${WORKSPACE_NAME}",
  "issuer": "https://app.terraform.io",
  "subject": "organization:${ORG_NAME}:project:${PROJECT_NAME}:workspace:${WORKSPACE_NAME}:run_phase:*",
  "audiences": ["api://AzureADTokenExchange"]
}
EOF

az ad app federated-credential create --id $APP_ID --parameters credential.json

# Assign RBAC role
echo "Assigning RBAC role..."
az role assignment create \
    --assignee $APP_ID \
    --role "Contributor" \
    --scope "/subscriptions/$(az account show --query id -otsv)/resourceGroups/$RG_NAME"

# Output configuration
echo ""
echo "=== Terraform Cloud Workspace Variables ==="
echo "TFC_AZURE_PROVIDER_AUTH = true"
echo "TFC_AZURE_RUN_CLIENT_ID = $APP_ID"
echo "ARM_TENANT_ID = $(az account show --query tenantId -otsv)"
echo "ARM_SUBSCRIPTION_ID = $(az account show --query id -otsv)"
```

## Additional Resources

- [Terraform Cloud Dynamic Credentials Overview](../initiators/infrastructure-as-code/terraform-cloud.md)
- [Azure Federated Credentials Setup](../providers/azure/federated-credentials.md)
- [HashiCorp Documentation: Azure Dynamic Credentials](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/dynamic-provider-credentials/azure-configuration)
- [Azure Workload Identity Federation](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation)
