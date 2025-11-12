---
sidebar_position: 1
title: GCP Workload Identity Federation
description: Configure Google Cloud Platform for secretless authentication from external services using Workload Identity Federation, eliminating the need for service account keys
keywords: [gcp, google cloud, workload identity federation, secretless, authentication, oidc, openid connect, github actions, gitlab ci, service account]
---

# GCP Workload Identity Federation

Configure Google Cloud Platform for secretless authentication from external systems like GitHub Actions, GitLab CI, and Buildkite using OIDC without storing service account keys.

## Overview

Workload Identity Federation allows external identity providers to authenticate to GCP by exchanging OIDC tokens for short-lived GCP credentials. This eliminates the need to manage and rotate service account keys.

### Authentication Flow

1. **External system generates OIDC token** with identity claims
2. **Token sent to GCP STS** (Security Token Service)
3. **STS validates token** against Workload Identity Provider configuration
4. **STS returns federated token** (valid for ~10 minutes)
5. **Federated token exchanges for service account token** (valid for ~1 hour)
6. **Service account token used to access GCP resources**

## Prerequisites

- GCP project with billing enabled
- `roles/iam.workloadIdentityPoolAdmin` permission
- Project number (found in project settings)
- APIs enabled: IAM, Security Token Service (STS)

## Create Workload Identity Pool

The Workload Identity Pool is a container for external identity providers.

### Using gcloud CLI

```bash
gcloud iam workload-identity-pools create POOL_ID \
    --location="global" \
    --description="Identity pool for external CI/CD systems" \
    --display-name="CI/CD Identity Pool"
```

**Parameters:**
- `POOL_ID`: Immutable identifier (choose carefully)
- `location`: Use "global" for worldwide availability

### Using Terraform

```hcl
resource "google_iam_workload_identity_pool" "cicd_pool" {
  workload_identity_pool_id = "cicd-pool"
  display_name              = "CI/CD Identity Pool"
  description               = "Identity pool for external CI/CD systems"
  disabled                  = false
}
```

## Configure OIDC Provider

### GitHub Actions Provider

**Using gcloud:**

```bash
gcloud iam workload-identity-pools providers create-oidc github-provider \
    --location="global" \
    --workload-identity-pool="cicd-pool" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
    --attribute-condition="assertion.repository_owner=='YOUR_ORG_NAME'"
```

**Using Terraform:**

```hcl
resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.cicd_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub Actions Provider"

  attribute_condition = "assertion.repository_owner=='YOUR_ORG'"

  attribute_mapping = {
    "google.subject"             = "assertion.sub"
    "attribute.actor"            = "assertion.actor"
    "attribute.repository"       = "assertion.repository"
    "attribute.repository_owner" = "assertion.repository_owner"
    "attribute.repository_id"    = "assertion.repository_id"
  }

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}
```

### GitLab CI Provider

**Using gcloud:**

```bash
gcloud iam workload-identity-pools providers create-oidc gitlab-provider \
    --location="global" \
    --workload-identity-pool="cicd-pool" \
    --issuer-uri="https://gitlab.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.project_path=assertion.project_path,attribute.namespace_id=assertion.namespace_id,attribute.ref=assertion.ref" \
    --attribute-condition="assertion.namespace_id=='YOUR_GROUP_ID'"
```

**Using Terraform:**

```hcl
resource "google_iam_workload_identity_pool_provider" "gitlab" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.cicd_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "gitlab-provider"
  display_name                       = "GitLab CI Provider"

  attribute_condition = "assertion.namespace_id=='YOUR_GROUP_ID'"

  attribute_mapping = {
    "google.subject"         = "assertion.sub"
    "attribute.project_path" = "assertion.project_path"
    "attribute.namespace_id" = "assertion.namespace_id"
    "attribute.ref"          = "assertion.ref"
  }

  oidc {
    issuer_uri = "https://gitlab.com"
  }
}
```

## Attribute Mapping

Attribute mappings define how external OIDC token claims map to GCP attributes using Common Expression Language (CEL).

### Required Mapping

- `google.subject` - MUST be mapped (principal identifier, max 127 bytes)

### Common Patterns

**Basic mapping:**
```
google.subject=assertion.sub
```

**Custom subject with multiple claims:**
```
google.subject=assertion.repository + ":" + assertion.ref
```

**Extract specific values:**
```
google.subject=assertion.sub.extract('/repos/{repo}')
```

## Attribute Conditions

Attribute conditions are CEL expressions that restrict which tokens are accepted. **Critical for security with multi-tenant providers.**

### GitHub Examples

**Specific organization:**
```
assertion.repository_owner=='myorg'
```

**Specific repository and branch:**
```
assertion.repository_owner=='myorg' &&
assertion.repository=='myorg/myrepo' &&
assertion.ref=='refs/heads/main'
```

**Use immutable IDs (recommended):**
```
assertion.repository_owner_id=='12345678'
```

### GitLab Examples

**Specific group:**
```
assertion.namespace_id=='YOUR_GROUP_ID'
```

**Production environment only:**
```
assertion.namespace_id=='YOUR_GROUP_ID' &&
assertion.environment=='production'
```

**Protected branches:**
```
assertion.ref_protected=='true'
```

## Service Account Configuration

### Create Service Account

```bash
gcloud iam service-accounts create github-actions-sa \
    --display-name="GitHub Actions Service Account" \
    --description="Service account for GitHub Actions workflows"
```

### Grant Impersonation Permission

**For specific repository:**

```bash
gcloud iam service-accounts add-iam-policy-binding SERVICE_ACCOUNT_EMAIL \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/attribute.repository/ORG/REPO"
```

**For all repositories in organization:**

```bash
gcloud iam service-accounts add-iam-policy-binding SERVICE_ACCOUNT_EMAIL \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/attribute.repository_owner/ORG"
```

**Using Terraform:**

```hcl
resource "google_service_account" "github_actions" {
  account_id   = "github-actions-sa"
  display_name = "GitHub Actions SA"
}

resource "google_service_account_iam_member" "workload_identity" {
  service_account_id = google_service_account.github_actions.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/projects/${var.project_number}/locations/global/workloadIdentityPools/${google_iam_workload_identity_pool.cicd_pool.workload_identity_pool_id}/attribute.repository/${var.github_org}/${var.github_repo}"
}
```

### Grant Resource Permissions

```bash
# Example: Grant storage permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.admin"
```

## Complete Terraform Example

```hcl
variable "project_id" {
  description = "GCP Project ID"
}

variable "project_number" {
  description = "GCP Project Number"
}

variable "github_org" {
  description = "GitHub Organization"
}

variable "github_repo" {
  description = "GitHub Repository"
}

# Workload Identity Pool
resource "google_iam_workload_identity_pool" "github_pool" {
  workload_identity_pool_id = "github-pool"
  display_name              = "GitHub Actions Pool"
  description               = "Identity pool for GitHub Actions"
}

# OIDC Provider
resource "google_iam_workload_identity_pool_provider" "github_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub Provider"

  attribute_condition = "assertion.repository_owner == '${var.github_org}'"

  attribute_mapping = {
    "google.subject"             = "assertion.sub"
    "attribute.actor"            = "assertion.actor"
    "attribute.repository"       = "assertion.repository"
    "attribute.repository_owner" = "assertion.repository_owner"
  }

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Service Account
resource "google_service_account" "github_actions" {
  account_id   = "github-actions-sa"
  display_name = "GitHub Actions SA"
}

# Allow impersonation
resource "google_service_account_iam_member" "workload_identity_user" {
  service_account_id = google_service_account.github_actions.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/projects/${var.project_number}/locations/global/workloadIdentityPools/${google_iam_workload_identity_pool.github_pool.workload_identity_pool_id}/attribute.repository/${var.github_org}/${var.github_repo}"
}

# Grant permissions
resource "google_project_iam_member" "service_account_permissions" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Outputs
output "workload_identity_provider" {
  value = "projects/${var.project_number}/locations/global/workloadIdentityPools/${google_iam_workload_identity_pool.github_pool.workload_identity_pool_id}/providers/${google_iam_workload_identity_pool_provider.github_provider.workload_identity_pool_provider_id}"
}

output "service_account_email" {
  value = google_service_account.github_actions.email
}
```

## Security Best Practices

### 1. Use Specific Attribute Conditions

**Never allow all identities:**
```
# BAD - allows any GitHub repository
attribute_condition = ""

# GOOD - specific organization
attribute_condition = "assertion.repository_owner=='myorg'"
```

### 2. Use Immutable IDs

Prefer numeric IDs over names:
- `repository_id` instead of `repository`
- `namespace_id` instead of `namespace_path`

### 3. Separate Roles by Environment

Create different service accounts for dev/staging/production.

### 4. Least Privilege Permissions

Grant only necessary permissions:

```bash
# Specific bucket access
gsutil iam ch serviceAccount:SA_EMAIL:roles/storage.objectAdmin gs://BUCKET
```

### 5. Enable Audit Logging

```bash
# Enable IAM audit logs
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:SA_EMAIL" \
    --role="roles/logging.viewer"
```

Monitor:
- Token exchanges (STS API calls)
- Service account impersonation
- Failed authentication attempts

## Troubleshooting

### Error: "Failed to generate Google Cloud federated token"

**Cause:** Attribute condition not met

**Solution:**
1. Verify attribute condition matches token claims
2. Use OIDC debugger to inspect token
3. Check attribute mappings exist for all conditions

### Error: "Unable to acquire impersonated credentials"

**Cause:** Service account impersonation not configured

**Solution:**
1. Verify IAM binding exists:
```bash
gcloud iam service-accounts get-iam-policy SERVICE_ACCOUNT_EMAIL
```

2. Ensure using project NUMBER not ID
3. Check principal format is correct

### Error: "google.subject exceeds 127 bytes"

**Cause:** Subject claim too long

**Solution:**
Use extract or shorten:
```
google.subject=assertion.repository_id + ":" + assertion.ref
```

## Next Steps

- **For GitHub Actions**: See [GitHub Actions Initiator Documentation](../../../initiators/ci-tools/github-actions.md)
- **For GitLab CI**: See [GitLab CI Initiator Documentation](../../../initiators/ci-tools/gitlab-ci.md)
- **Integration Guides**: Check [Integration Guides](../../../guides/gitlab-to-gcp.md)

## Additional Resources

- [GCP Workload Identity Federation Documentation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions Auth Action](https://github.com/google-github-actions/auth)
- [Troubleshooting Guide](https://cloud.google.com/iam/docs/troubleshooting-workload-identity-federation)
