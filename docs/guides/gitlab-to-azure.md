---
sidebar_position: 3
title: GitLab CI to Azure Integration Guide
description: Complete step-by-step guide to set up secretless authentication from GitLab CI/CD to Microsoft Azure using OIDC and federated identity credentials
keywords: [gitlab ci, azure, microsoft, entra id, federated identity, oidc, integration guide, secretless, authentication, deployment]
---

# GitLab CI to Azure Integration Guide

This guide walks you through setting up secretless authentication from GitLab CI/CD to Microsoft Azure using OIDC and federated identity credentials.

## Overview

By the end of this guide, your GitLab CI/CD pipelines will authenticate with Azure using short-lived tokens without storing any client secrets.

**Time Required**: 20-30 minutes

## Prerequisites

### Azure Requirements
- Azure subscription with Owner or Contributor access
- Application Administrator or Cloud Application Administrator role in Entra ID
- Azure CLI installed (for setup) or access to Azure Portal

### GitLab Requirements
- GitLab 15.7+ (for id_tokens support)
- GitLab.com, Self-Managed, or Dedicated
- Maintainer or Owner role on the project

### Planning Decisions
- **Which GitLab projects** need Azure access
- **Which Azure resources** pipelines need to access
- **Which branches/environments** should be allowed to deploy
- **Azure subscription and resource groups** for operations

## Step 1: Create Azure AD Application

### Using Azure CLI

```bash
# Create app registration
APP_NAME="gitlab-oidc-app"
APP_ID=$(az ad app create --display-name "$APP_NAME" --query appId -otsv)

echo "Application (Client) ID: $APP_ID"

# Create service principal
az ad sp create --id $APP_ID
```

### Using Azure Portal

1. Navigate to **Azure Portal → Entra ID → App registrations**
2. Click **New registration**
3. Name: `gitlab-oidc-app`
4. Supported account types: **Single tenant**
5. Click **Register**
6. Save the **Application (client) ID** and **Directory (tenant) ID**

## Step 2: Find Your GitLab Project Path

### Using GitLab UI
1. Navigate to your project
2. Note the full path (e.g., `mygroup/myproject`)

### Using GitLab API
```bash
curl --header "PRIVATE-TOKEN: YOUR_TOKEN" \
  "https://gitlab.com/api/v4/projects/PROJECT_ID" | jq -r .path_with_namespace
```

## Step 3: Add Federated Identity Credentials

You'll create separate credentials for different branches or environments.

### For Main Branch

```bash
# Get application object ID
OBJECT_ID=$(az ad app show --id $APP_ID --query id -otsv)

# Create federated credential
cat <<EOF > main-branch-cred.json
{
  "name": "gitlab-main-branch",
  "issuer": "https://gitlab.com",
  "subject": "project_path:mygroup/myproject:ref_type:branch:ref:main",
  "audiences": ["https://gitlab.com"],
  "description": "Main branch deployments"
}
EOF

az rest --method POST \
  --uri "https://graph.microsoft.com/beta/applications/$OBJECT_ID/federatedIdentityCredentials" \
  --body @main-branch-cred.json
```

### For Protected Branches (Recommended for Production)

```bash
cat <<EOF > protected-branch-cred.json
{
  "name": "gitlab-protected-branches",
  "issuer": "https://gitlab.com",
  "subject": "",
  "audiences": ["https://gitlab.com"],
  "description": "Protected branches only",
  "claimsMatchingPattern": "assertion.namespace_id=='YOUR_GROUP_ID' && assertion.ref_protected=='true'"
}
EOF

az rest --method POST \
  --uri "https://graph.microsoft.com/beta/applications/$OBJECT_ID/federatedIdentityCredentials" \
  --body @protected-branch-cred.json
```

**Note**: Replace `YOUR_GROUP_ID` with your GitLab group ID (found in group settings).

### For Multiple Branches

```bash
for BRANCH in main develop staging; do
  cat <<EOF > ${BRANCH}-cred.json
{
  "name": "gitlab-${BRANCH}",
  "issuer": "https://gitlab.com",
  "subject": "project_path:mygroup/myproject:ref_type:branch:ref:${BRANCH}",
  "audiences": ["https://gitlab.com"]
}
EOF
  az rest --method POST \
    --uri "https://graph.microsoft.com/beta/applications/$OBJECT_ID/federatedIdentityCredentials" \
    --body @${BRANCH}-cred.json
done
```

### For Self-Managed GitLab

```bash
cat <<EOF > gitlab-self-managed-cred.json
{
  "name": "gitlab-self-managed",
  "issuer": "https://gitlab.example.com",
  "subject": "project_path:mygroup/myproject:ref_type:branch:ref:main",
  "audiences": ["https://gitlab.example.com"]
}
EOF

az rest --method POST \
  --uri "https://graph.microsoft.com/beta/applications/$OBJECT_ID/federatedIdentityCredentials" \
  --body @gitlab-self-managed-cred.json
```

## Step 4: Assign Azure RBAC Roles

### Resource Group Level

```bash
RESOURCE_GROUP="production-rg"
SUBSCRIPTION_ID=$(az account show --query id -otsv)

az role assignment create \
  --assignee $APP_ID \
  --role "Contributor" \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP"
```

### Specific Resource

```bash
# Example: Storage account
STORAGE_ACCOUNT="mystorageaccount"

az role assignment create \
  --assignee $APP_ID \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Storage/storageAccounts/$STORAGE_ACCOUNT"
```

### Subscription Level (Use Sparingly)

```bash
az role assignment create \
  --assignee $APP_ID \
  --role "Reader" \
  --scope "/subscriptions/$SUBSCRIPTION_ID"
```

## Step 5: Store Configuration in GitLab CI/CD Variables

1. Navigate to your GitLab project
2. Go to **Settings → CI/CD → Variables**
3. Add the following variables:

| Variable Name | Value | Protected | Masked |
|---------------|-------|-----------|--------|
| `AZURE_CLIENT_ID` | Application (client) ID | ✓ | ✗ |
| `AZURE_TENANT_ID` | Directory (tenant) ID | ✓ | ✗ |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID | ✓ | ✗ |

## Step 6: Create GitLab CI/CD Pipeline

Create `.gitlab-ci.yml`:

```yaml
default:
  image: mcr.microsoft.com/azure-cli:latest

variables:
  AZURE_CLIENT_ID: "${AZURE_CLIENT_ID}"
  AZURE_TENANT_ID: "${AZURE_TENANT_ID}"
  AZURE_SUBSCRIPTION_ID: "${AZURE_SUBSCRIPTION_ID}"

stages:
  - test
  - deploy

.azure_auth: &azure_auth
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  before_script:
    - echo "Authenticating with Azure..."
    - |
      az login --service-principal \
        -u $AZURE_CLIENT_ID \
        -t $AZURE_TENANT_ID \
        --federated-token $GITLAB_OIDC_TOKEN
    - az account set --subscription $AZURE_SUBSCRIPTION_ID
    - az account show

verify_auth:
  stage: test
  <<: *azure_auth
  script:
    - echo "Verifying Azure authentication..."
    - az account show
    - az group list --output table

deploy_to_azure:
  stage: deploy
  <<: *azure_auth
  environment:
    name: production
  only:
    - main
  script:
    - echo "Deploying to Azure..."
    - az vm list --output table
    # Add your deployment commands here
```

## Step 7: Test the Integration

### Commit and Push

```bash
git add .gitlab-ci.yml
git commit -m "Add Azure OIDC authentication"
git push origin main
```

### Monitor Pipeline Execution

1. Go to **CI/CD → Pipelines**
2. Click on the running pipeline
3. Expand the `verify_auth` job
4. Verify successful authentication

**Expected output**:
```json
{
  "environmentName": "AzureCloud",
  "homeTenantId": "your-tenant-id",
  "id": "your-subscription-id",
  "isDefault": true,
  "name": "Your Subscription Name",
  "state": "Enabled",
  "tenantId": "your-tenant-id",
  "user": {
    "name": "your-app-id",
    "type": "servicePrincipal"
  }
}
```

## Step 8: Verify in Azure

### Check Sign-in Logs

1. Navigate to **Entra ID → Sign-in logs**
2. Filter by **Service principal sign-ins**
3. Look for your application name
4. Verify successful sign-ins from GitLab CI

### Using Azure CLI

```bash
az monitor activity-log list \
  --caller $APP_ID \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --query "[].{Time:eventTimestamp, Operation:operationName.localizedValue, Status:status.localizedValue}" \
  --output table
```

## Step 9: Production Hardening

### Use GitLab Protected Branches

1. Navigate to **Settings → Repository → Protected branches**
2. Protect the `main` branch
3. Restrict push access to Maintainers
4. Require merge requests

### Use GitLab Environments

1. Navigate to **Settings → CI/CD → Environments**
2. Create environment `production`
3. Add protection rules:
   - **Required approvals**: 1 or more
   - **Allowed to deploy**: Maintainers only

Update `.gitlab-ci.yml`:

```yaml
deploy_to_azure:
  stage: deploy
  <<: *azure_auth
  environment:
    name: production
    action: start
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual
  script:
    - echo "Deploying to production..."
    - az deployment group create \
        --resource-group production-rg \
        --template-file main.bicep \
        --parameters @params.json
```

### Enable Azure Diagnostic Logs

```bash
# Create Log Analytics workspace
WORKSPACE_NAME="gitlab-ci-logs"
az monitor log-analytics workspace create \
  --resource-group monitoring-rg \
  --workspace-name $WORKSPACE_NAME

# Enable diagnostic settings for Entra ID
az monitor diagnostic-settings create \
  --name "entra-sign-ins" \
  --resource /tenants/$AZURE_TENANT_ID/providers/Microsoft.aadiam \
  --workspace /subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/monitoring-rg/providers/Microsoft.OperationalInsights/workspaces/$WORKSPACE_NAME \
  --logs '[{"category":"ServicePrincipalSignInLogs","enabled":true}]'
```

### Set Up Alerts

```bash
# Create action group
az monitor action-group create \
  --name "gitlab-ci-alerts" \
  --resource-group monitoring-rg \
  --short-name "GL-CI"

# Create alert for failed sign-ins
az monitor scheduled-query create \
  --name "Failed GitLab CI Sign-ins" \
  --resource-group monitoring-rg \
  --scopes /subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/monitoring-rg \
  --condition "count > 5" \
  --window-size 5m \
  --evaluation-frequency 5m \
  --action-groups gitlab-ci-alerts
```

## Troubleshooting

### AADSTS70021: No matching federated identity record found

**Causes**:
1. Subject claim mismatch
2. Issuer URL mismatch
3. Audience mismatch

**Solutions**:

1. **Debug token claims**:
```yaml
debug_token:
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  script:
    - echo $GITLAB_OIDC_TOKEN | cut -d '.' -f2 | base64 -d | jq .
```

2. **Verify federated credential**:
```bash
az ad app federated-credential list --id $APP_ID --output table
```

3. **Check exact subject format**:
```
project_path:mygroup/myproject:ref_type:branch:ref:main
```

### AADSTS90061: External OIDC endpoint request failed

**Cause**: GitLab instance not publicly accessible (self-managed only)

**Solutions**:

1. **Test OIDC endpoint**:
```bash
curl https://gitlab.example.com/.well-known/openid-configuration
```

2. **Ensure endpoints are public**:
   - `/.well-known/openid-configuration`
   - `/oauth/discovery/keys`

3. **Check firewall** allows Azure IP ranges

### AADSTS700016: Application not found

**Cause**: Incorrect client ID or wrong tenant

**Solutions**:

1. **Verify client ID**:
```bash
az ad app show --id $AZURE_CLIENT_ID
```

2. **Verify tenant ID**:
```bash
az account show --query tenantId -o tsv
```

### Pipeline Fails with "Invalid token"

**Causes**:
- Using deprecated `CI_JOB_JWT_V2`
- Audience mismatch
- Token expired

**Solutions**:

1. **Use id_tokens keyword**:
```yaml
id_tokens:
  GITLAB_OIDC_TOKEN:
    aud: https://gitlab.com
```

2. **Verify audience matches** credential configuration

3. **Re-run pipeline** to get fresh token

## Advanced Patterns

### Multi-Environment Deployment

```yaml
.azure_auth_template: &azure_auth
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  before_script:
    - |
      az login --service-principal \
        -u $AZURE_CLIENT_ID \
        -t $AZURE_TENANT_ID \
        --federated-token $GITLAB_OIDC_TOKEN
    - az account set --subscription $AZURE_SUBSCRIPTION_ID

deploy_dev:
  stage: deploy
  <<: *azure_auth
  environment:
    name: development
  variables:
    RESOURCE_GROUP: "dev-rg"
  only:
    - develop
  script:
    - az webapp deployment source config-zip \
        --resource-group $RESOURCE_GROUP \
        --name myapp-dev \
        --src dist.zip

deploy_staging:
  stage: deploy
  <<: *azure_auth
  environment:
    name: staging
  variables:
    RESOURCE_GROUP: "staging-rg"
  only:
    - staging
  script:
    - az webapp deployment source config-zip \
        --resource-group $RESOURCE_GROUP \
        --name myapp-staging \
        --src dist.zip

deploy_prod:
  stage: deploy
  <<: *azure_auth
  environment:
    name: production
  variables:
    RESOURCE_GROUP: "prod-rg"
  only:
    - main
  when: manual
  script:
    - az webapp deployment source config-zip \
        --resource-group $RESOURCE_GROUP \
        --name myapp-prod \
        --src dist.zip
```

### Azure Container Registry (ACR) Push

```yaml
build_and_push:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  variables:
    ACR_NAME: "myregistry"
  before_script:
    - apk add --no-cache curl
    - curl -sL https://aka.ms/InstallAzureCLIDeb | sh
    - |
      az login --service-principal \
        -u $AZURE_CLIENT_ID \
        -t $AZURE_TENANT_ID \
        --federated-token $GITLAB_OIDC_TOKEN
    - az acr login --name $ACR_NAME
  script:
    - docker build -t ${ACR_NAME}.azurecr.io/myapp:${CI_COMMIT_SHA} .
    - docker push ${ACR_NAME}.azurecr.io/myapp:${CI_COMMIT_SHA}
```

### Terraform Deployment

```yaml
terraform:
  stage: deploy
  image: hashicorp/terraform:latest
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  variables:
    ARM_CLIENT_ID: "${AZURE_CLIENT_ID}"
    ARM_TENANT_ID: "${AZURE_TENANT_ID}"
    ARM_SUBSCRIPTION_ID: "${AZURE_SUBSCRIPTION_ID}"
    ARM_USE_OIDC: "true"
  before_script:
    - export ARM_OIDC_TOKEN=$GITLAB_OIDC_TOKEN
  script:
    - cd terraform/
    - terraform init
    - terraform plan -out=tfplan
    - terraform apply -auto-approve tfplan
  only:
    - main
```

**Note**: Terraform Azure provider supports OIDC via `ARM_USE_OIDC=true` and `ARM_OIDC_TOKEN`.

### Bicep Deployment

```yaml
deploy_infrastructure:
  stage: deploy
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  variables:
    RESOURCE_GROUP: "production-rg"
  before_script:
    - |
      az login --service-principal \
        -u $AZURE_CLIENT_ID \
        -t $AZURE_TENANT_ID \
        --federated-token $GITLAB_OIDC_TOKEN
    - az account set --subscription $AZURE_SUBSCRIPTION_ID
  script:
    - az deployment group create \
        --resource-group $RESOURCE_GROUP \
        --template-file infrastructure/main.bicep \
        --parameters infrastructure/params.prod.json \
        --name "deployment-${CI_PIPELINE_ID}"
  only:
    - main
```

## Security Best Practices

### 1. Use Specific Subject Claims

**Good**:
```json
{
  "subject": "project_path:mygroup/myproject:ref_type:branch:ref:main"
}
```

**Better** (with protection):
```json
{
  "claimsMatchingPattern": "assertion.ref_protected=='true'"
}
```

### 2. Least Privilege RBAC

```bash
# Good: Specific resource access
az role assignment create \
  --assignee $APP_ID \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/$SUB_ID/resourceGroups/$RG/providers/Microsoft.Storage/storageAccounts/$STORAGE"

# Bad: Subscription-wide owner
az role assignment create \
  --assignee $APP_ID \
  --role "Owner" \
  --scope "/subscriptions/$SUB_ID"
```

### 3. Separate Applications by Environment

- `gitlab-dev-app` - Development resources
- `gitlab-staging-app` - Staging resources
- `gitlab-prod-app` - Production resources

### 4. Monitor Sign-in Activity

Query service principal sign-ins:

```kql
AADServicePrincipalSignInLogs
| where TimeGenerated > ago(24h)
| where AppId == "your-app-id"
| where ResultType != 0
| project TimeGenerated, AppDisplayName, IPAddress, Location, ResultType, ResultDescription
| order by TimeGenerated desc
```

### 5. Regular Audits

- Review federated credentials quarterly
- Audit RBAC assignments monthly
- Check for unused applications
- Verify protection rules on branches and environments

## Complete Terraform Example

```hcl
variable "gitlab_project_path" {
  description = "GitLab Project Path (e.g., mygroup/myproject)"
  type        = string
}

variable "resource_group_name" {
  description = "Azure Resource Group Name"
  type        = string
}

data "azurerm_client_config" "current" {}

# Azure AD Application
resource "azuread_application" "gitlab" {
  display_name = "gitlab-ci-app"
}

# Service Principal
resource "azuread_service_principal" "gitlab" {
  client_id = azuread_application.gitlab.client_id
}

# Federated Credential - Main Branch
resource "azuread_application_federated_identity_credential" "gitlab_main" {
  application_id = azuread_application.gitlab.id
  display_name   = "gitlab-main-branch"
  description    = "Main branch deployments"
  audiences      = ["https://gitlab.com"]
  issuer         = "https://gitlab.com"
  subject        = "project_path:${var.gitlab_project_path}:ref_type:branch:ref:main"
}

# Federated Credential - Protected Branches
resource "azuread_application_federated_identity_credential" "gitlab_protected" {
  application_id = azuread_application.gitlab.id
  display_name   = "gitlab-protected-branches"
  description    = "Protected branches only"
  audiences      = ["https://gitlab.com"]
  issuer         = "https://gitlab.com"
  subject        = ""

  # Note: claimsMatchingPattern not yet supported in azuread provider
  # Use az rest command for advanced patterns
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = "East US"
}

# RBAC Assignment
resource "azurerm_role_assignment" "gitlab_contributor" {
  scope                = azurerm_resource_group.main.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.gitlab.object_id
}

# Outputs
output "azure_client_id" {
  value = azuread_application.gitlab.client_id
}

output "azure_tenant_id" {
  value = data.azurerm_client_config.current.tenant_id
}

output "azure_subscription_id" {
  value = data.azurerm_client_config.current.subscription_id
}

output "instructions" {
  value = <<-EOT
    Add these CI/CD variables to your GitLab project:

    AZURE_CLIENT_ID: ${azuread_application.gitlab.client_id}
    AZURE_TENANT_ID: ${data.azurerm_client_config.current.tenant_id}
    AZURE_SUBSCRIPTION_ID: ${data.azurerm_client_config.current.subscription_id}
  EOT
}
```

## Next Steps

- **Explore other integrations**: [GitLab to GCP](gitlab-to-gcp.md)
- **Learn more about GitLab CI**: [GitLab CI Initiator Documentation](../initiators/ci-tools/gitlab-ci.md)
- **Azure deep dive**: [Azure Federated Credentials](../providers/cloud-platforms/azure/federated-credentials.md)

## Additional Resources

- [Azure Workload Identity Federation](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation)
- [GitLab CI/CD with Azure](https://docs.gitlab.com/ci/cloud_services/)
- [Configure OpenID Connect in Azure](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure)

## Conclusion

You now have a fully functional secretless authentication setup between GitLab CI/CD and Microsoft Azure using federated identity credentials. This eliminates the security risks of storing client secrets while providing seamless deployment automation.

**Key Benefits**:
- ✅ No client secrets stored in GitLab
- ✅ Automatic credential rotation (~1 hour tokens)
- ✅ Fine-grained access control via RBAC
- ✅ Full audit trail via Azure sign-in logs
- ✅ Improved security posture
