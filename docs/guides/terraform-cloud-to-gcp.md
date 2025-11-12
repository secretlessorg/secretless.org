---
sidebar_position: 6
title: Terraform Cloud → GCP
description: Configure Google Cloud Platform to accept OIDC authentication from Terraform Cloud using Workload Identity Federation
slug: /guides/terraform-cloud-to-gcp
keywords: [gcp, google cloud, terraform cloud, hcp terraform, workload identity federation, oidc, dynamic credentials]
---

# Configure GCP for Terraform Cloud Authentication

This guide shows you how to configure Google Cloud Platform to accept OIDC authentication from Terraform Cloud (HCP Terraform) using Workload Identity Federation, eliminating the need to store service account keys.

## Prerequisites

- GCP project with billing enabled
- `roles/iam.workloadIdentityPoolAdmin` permission
- Terraform Cloud organization and workspace
- Self-hosted agents require v1.7.0 or later (if applicable)

## Architecture Overview

```
┌─────────────────────┐                    ┌──────────────┐
│  Terraform Cloud    │   OIDC Token       │     GCP      │
│     Workspace       │───────────────────>│  Workload    │
│                     │                    │   Identity   │
└─────────────────────┘                    │     Pool     │
         │                                  └──────────────┘
         │                                        │
         │                                        ▼
         │                                 Token Validation
         │                                        │
         │                                        ▼
         │                                ┌──────────────┐
         │                                │   Service    │
         │                                │   Account    │
         │                                └──────────────┘
         │                                        │
         └────────────────────────────────> Temporary
                GCP Credentials              Credentials
```

## Step 1: Create Workload Identity Pool

Create a workload identity pool to manage external identities.

### Using gcloud CLI

```bash
gcloud iam workload-identity-pools create terraform-cloud-pool \
    --location="global" \
    --description="Identity pool for Terraform Cloud workspaces" \
    --display-name="Terraform Cloud Pool"
```

### Using Terraform

```hcl
resource "google_iam_workload_identity_pool" "terraform_cloud" {
  workload_identity_pool_id = "terraform-cloud-pool"
  display_name              = "Terraform Cloud Pool"
  description               = "Identity pool for Terraform Cloud workspaces"
  disabled                  = false
}
```

## Step 2: Create OIDC Provider

Configure the workload identity pool to trust Terraform Cloud tokens.

### Using gcloud CLI

```bash
gcloud iam workload-identity-pools providers create-oidc terraform-cloud-provider \
    --location="global" \
    --workload-identity-pool="terraform-cloud-pool" \
    --issuer-uri="https://app.terraform.io" \
    --attribute-mapping="google.subject=assertion.sub,attribute.terraform_organization_name=assertion.terraform_organization_name,attribute.terraform_workspace_name=assertion.terraform_workspace_name,attribute.terraform_project_name=assertion.terraform_project_name,attribute.terraform_run_phase=assertion.terraform_run_phase" \
    --attribute-condition="assertion.terraform_organization_name=='YOUR_ORG_NAME'"
```

For **Terraform Enterprise** (self-hosted):

```bash
gcloud iam workload-identity-pools providers create-oidc terraform-cloud-provider \
    --location="global" \
    --workload-identity-pool="terraform-cloud-pool" \
    --issuer-uri="https://terraform.example.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.terraform_organization_name=assertion.terraform_organization_name,attribute.terraform_workspace_name=assertion.terraform_workspace_name" \
    --attribute-condition="assertion.terraform_organization_name=='YOUR_ORG_NAME'"
```

:::warning Security Critical
Always include an **attribute-condition** to validate the organization name. This prevents other Terraform Cloud organizations from accessing your GCP resources.

Never use:
```bash
# ❌ INSECURE - allows any organization
--attribute-condition=""
```
:::

### Using Terraform

```hcl
resource "google_iam_workload_identity_pool_provider" "terraform_cloud" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.terraform_cloud.workload_identity_pool_id
  workload_identity_pool_provider_id = "terraform-cloud-provider"
  display_name                       = "Terraform Cloud Provider"

  # CRITICAL: Validate organization to prevent cross-tenant access
  attribute_condition = "assertion.terraform_organization_name=='acme-corp'"

  attribute_mapping = {
    "google.subject"                        = "assertion.sub"
    "attribute.terraform_organization_name" = "assertion.terraform_organization_name"
    "attribute.terraform_workspace_name"    = "assertion.terraform_workspace_name"
    "attribute.terraform_project_name"      = "assertion.terraform_project_name"
    "attribute.terraform_run_phase"         = "assertion.terraform_run_phase"
    "attribute.terraform_full_workspace"    = "assertion.terraform_full_workspace"
  }

  oidc {
    issuer_uri = "https://app.terraform.io"
  }
}
```

## Step 3: Create Service Account

Create a service account that Terraform Cloud will impersonate.

### Using gcloud CLI

```bash
gcloud iam service-accounts create terraform-cloud-sa \
    --display-name="Terraform Cloud Service Account" \
    --description="Service account for Terraform Cloud workspaces"
```

### Using Terraform

```hcl
resource "google_service_account" "terraform_cloud" {
  account_id   = "terraform-cloud-sa"
  display_name = "Terraform Cloud SA"
  description  = "Service account for Terraform Cloud workspaces"
}
```

## Step 4: Grant Impersonation Permission

Allow Terraform Cloud identities to impersonate the service account.

### Option A: Specific Workspace

Grant access to a single workspace:

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe PROJECT_ID --format="value(projectNumber)")

# Grant impersonation
gcloud iam service-accounts add-iam-policy-binding terraform-cloud-sa@PROJECT_ID.iam.gserviceaccount.com \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/terraform-cloud-pool/attribute.terraform_full_workspace/YOUR_ORG/YOUR_PROJECT/YOUR_WORKSPACE"
```

### Option B: All Workspaces in a Project

```bash
gcloud iam service-accounts add-iam-policy-binding terraform-cloud-sa@PROJECT_ID.iam.gserviceaccount.com \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/terraform-cloud-pool/attribute.terraform_project_name/YOUR_PROJECT"
```

### Option C: All Workspaces in Organization

```bash
gcloud iam service-accounts add-iam-policy-binding terraform-cloud-sa@PROJECT_ID.iam.gserviceaccount.com \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/terraform-cloud-pool/attribute.terraform_organization_name/YOUR_ORG"
```

### Using Terraform

```hcl
# Get project number
data "google_project" "project" {
  project_id = var.project_id
}

# Grant impersonation for specific workspace
resource "google_service_account_iam_member" "workload_identity" {
  service_account_id = google_service_account.terraform_cloud.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/projects/${data.google_project.project.number}/locations/global/workloadIdentityPools/${google_iam_workload_identity_pool.terraform_cloud.workload_identity_pool_id}/attribute.terraform_full_workspace/${var.terraform_org}/${var.terraform_project}/${var.terraform_workspace}"
}
```

## Step 5: Grant GCP Resource Permissions

Grant the service account permissions to manage GCP resources.

### Using gcloud CLI

```bash
# Project-level permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:terraform-cloud-sa@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/editor"

# Specific resource permissions (recommended)
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:terraform-cloud-sa@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/compute.instanceAdmin.v1"

gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:terraform-cloud-sa@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"
```

### Using Terraform

```hcl
# Grant specific permissions (least privilege)
resource "google_project_iam_member" "terraform_cloud_compute" {
  project = var.project_id
  role    = "roles/compute.instanceAdmin.v1"
  member  = "serviceAccount:${google_service_account.terraform_cloud.email}"
}

resource "google_project_iam_member" "terraform_cloud_storage" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.terraform_cloud.email}"
}
```

:::tip Least Privilege
Grant only the minimum permissions required. Avoid using `roles/owner` or `roles/editor` in production.
:::

## Step 6: Configure Terraform Cloud Workspace

Add environment variables to enable dynamic credentials in your Terraform Cloud workspace.

### Required Variables

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `TFC_GCP_PROVIDER_AUTH` | `true` | Enable dynamic credentials |
| `TFC_GCP_RUN_SERVICE_ACCOUNT_EMAIL` | `terraform-cloud-sa@PROJECT_ID.iam.gserviceaccount.com` | Service account email |
| `TFC_GCP_WORKLOAD_PROVIDER_NAME` | Full provider name (see below) | Workload identity provider |

### Get Workload Provider Name

```bash
gcloud iam workload-identity-pools providers describe terraform-cloud-provider \
    --location="global" \
    --workload-identity-pool="terraform-cloud-pool" \
    --format="value(name)"
```

Output format:
```
projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/terraform-cloud-pool/providers/terraform-cloud-provider
```

### Alternative: Separate Variables

Instead of `TFC_GCP_WORKLOAD_PROVIDER_NAME`, you can use:

| Variable Name | Value |
|---------------|-------|
| `TFC_GCP_PROJECT_NUMBER` | Your GCP project number |
| `TFC_GCP_WORKLOAD_POOL_ID` | `terraform-cloud-pool` |
| `TFC_GCP_WORKLOAD_PROVIDER_ID` | `terraform-cloud-provider` |

## Step 7: Configure Terraform GCP Provider

Update your Terraform configuration to use dynamic credentials. **Do not** hardcode `credentials`:

```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"

  # Do NOT set credentials
  # Terraform Cloud automatically configures authentication
}

# Use GCP resources normally
resource "google_storage_bucket" "example" {
  name     = "my-terraform-bucket"
  location = "US"
}
```

:::warning Provider Configuration
Terraform Cloud automatically sets `GOOGLE_CREDENTIALS` environment variable. Do not set it manually or provide a credentials file.
:::

## Step 8: Verify Configuration

### Test Plan

Queue a plan in your Terraform Cloud workspace:

1. Navigate to your workspace
2. Click **Actions → Start new plan**
3. Check run logs for successful authentication

Expected output:
```
Initializing GCP provider...
GCP provider configured with dynamic credentials
```

### Test Apply

Queue an apply to create resources:

1. Approve the plan
2. Verify resources are created in GCP Console
3. Check Cloud Audit Logs for service account activity

## Phase-Specific Service Accounts (Advanced)

Use separate service accounts for plan and apply phases to implement least-privilege access.

### Plan Service Account (Read-Only)

```bash
# Create plan service account
gcloud iam service-accounts create terraform-cloud-plan-sa \
    --display-name="Terraform Cloud Plan SA"

# Grant read-only permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:terraform-cloud-plan-sa@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/viewer"

# Grant impersonation for plan phase only
gcloud iam service-accounts add-iam-policy-binding terraform-cloud-plan-sa@PROJECT_ID.iam.gserviceaccount.com \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/terraform-cloud-pool/attribute.terraform_run_phase/plan"
```

### Apply Service Account (Read-Write)

```bash
# Create apply service account
gcloud iam service-accounts create terraform-cloud-apply-sa \
    --display-name="Terraform Cloud Apply SA"

# Grant write permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:terraform-cloud-apply-sa@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/editor"

# Grant impersonation for apply phase only
gcloud iam service-accounts add-iam-policy-binding terraform-cloud-apply-sa@PROJECT_ID.iam.gserviceaccount.com \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/terraform-cloud-pool/attribute.terraform_run_phase/apply"
```

### Configure Workspace

```hcl
TFC_GCP_PROVIDER_AUTH = true
TFC_GCP_PLAN_SERVICE_ACCOUNT_EMAIL = "terraform-cloud-plan-sa@PROJECT_ID.iam.gserviceaccount.com"
TFC_GCP_APPLY_SERVICE_ACCOUNT_EMAIL = "terraform-cloud-apply-sa@PROJECT_ID.iam.gserviceaccount.com"
TFC_GCP_WORKLOAD_PROVIDER_NAME = "projects/.../providers/terraform-cloud-provider"
```

## Complete Terraform Example

```hcl
variable "project_id" {
  description = "GCP Project ID"
}

variable "terraform_org" {
  description = "Terraform Cloud organization"
}

variable "terraform_project" {
  description = "Terraform Cloud project"
}

variable "terraform_workspace" {
  description = "Terraform Cloud workspace"
}

# Get project number
data "google_project" "project" {
  project_id = var.project_id
}

# Workload Identity Pool
resource "google_iam_workload_identity_pool" "terraform_cloud" {
  workload_identity_pool_id = "terraform-cloud-pool"
  display_name              = "Terraform Cloud Pool"
  description               = "Identity pool for Terraform Cloud"
}

# OIDC Provider
resource "google_iam_workload_identity_pool_provider" "terraform_cloud" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.terraform_cloud.workload_identity_pool_id
  workload_identity_pool_provider_id = "terraform-cloud-provider"
  display_name                       = "Terraform Cloud Provider"

  attribute_condition = "assertion.terraform_organization_name=='${var.terraform_org}'"

  attribute_mapping = {
    "google.subject"                        = "assertion.sub"
    "attribute.terraform_organization_name" = "assertion.terraform_organization_name"
    "attribute.terraform_workspace_name"    = "assertion.terraform_workspace_name"
    "attribute.terraform_project_name"      = "assertion.terraform_project_name"
    "attribute.terraform_full_workspace"    = "assertion.terraform_full_workspace"
  }

  oidc {
    issuer_uri = "https://app.terraform.io"
  }
}

# Service Account
resource "google_service_account" "terraform_cloud" {
  account_id   = "terraform-cloud-sa"
  display_name = "Terraform Cloud SA"
}

# Allow impersonation
resource "google_service_account_iam_member" "workload_identity" {
  service_account_id = google_service_account.terraform_cloud.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/projects/${data.google_project.project.number}/locations/global/workloadIdentityPools/${google_iam_workload_identity_pool.terraform_cloud.workload_identity_pool_id}/attribute.terraform_full_workspace/${var.terraform_org}/${var.terraform_project}/${var.terraform_workspace}"
}

# Grant permissions
resource "google_project_iam_member" "terraform_cloud" {
  project = var.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.terraform_cloud.email}"
}

# Outputs for Terraform Cloud configuration
output "service_account_email" {
  value       = google_service_account.terraform_cloud.email
  description = "Use for TFC_GCP_RUN_SERVICE_ACCOUNT_EMAIL"
}

output "workload_provider_name" {
  value       = google_iam_workload_identity_pool_provider.terraform_cloud.name
  description = "Use for TFC_GCP_WORKLOAD_PROVIDER_NAME"
}
```

## Troubleshooting

### "Failed to generate Google Cloud federated token"

**Cause**: Attribute condition not met

**Solution**: Verify organization name matches:
```bash
gcloud iam workload-identity-pools providers describe terraform-cloud-provider \
    --location="global" \
    --workload-identity-pool="terraform-cloud-pool" \
    --format="value(attributeCondition)"
```

### "Unable to acquire impersonated credentials"

**Cause**: Service account impersonation not configured

**Solution**: Check IAM binding exists:
```bash
gcloud iam service-accounts get-iam-policy terraform-cloud-sa@PROJECT_ID.iam.gserviceaccount.com
```

### "Project number not found"

**Cause**: Using project ID instead of project number

**Solution**: Get project number:
```bash
gcloud projects describe PROJECT_ID --format="value(projectNumber)"
```

## Security Best Practices

### 1. Always Validate Organization

Include attribute condition:
```hcl
attribute_condition = "assertion.terraform_organization_name=='your-org'"
```

### 2. Use Specific Attribute Mappings

Map workspace claims for fine-grained access:
```hcl
"principalSet://iam.googleapis.com/.../attribute.terraform_workspace_name/production"
```

### 3. Enable Cloud Audit Logging

Monitor service account activity:
```bash
gcloud logging read "protoPayload.authenticationInfo.principalEmail:terraform-cloud-sa@" \
    --limit 10 \
    --format json
```

### 4. Separate Environments

Use different service accounts for dev/staging/production.

## Additional Resources

- [Terraform Cloud Dynamic Credentials Overview](../initiators/infrastructure-as-code/terraform-cloud.md)
- [GCP Workload Identity Federation Setup](../providers/gcp/workload-identity-federation.md)
- [HashiCorp Documentation: GCP Dynamic Credentials](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/dynamic-provider-credentials/gcp-configuration)
- [GCP Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
