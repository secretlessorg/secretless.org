---
sidebar_position: 2
title: GitLab CI to GCP Integration Guide
description: Complete step-by-step guide to set up secretless authentication from GitLab CI/CD to Google Cloud Platform using OIDC and Workload Identity Federation
keywords: [gitlab ci, gcp, google cloud, workload identity federation, oidc, integration guide, secretless, authentication, deployment]
---

# GitLab CI to GCP Integration Guide

This guide walks you through setting up secretless authentication from GitLab CI/CD to Google Cloud Platform using OIDC and Workload Identity Federation.

## Overview

By the end of this guide, your GitLab CI/CD pipelines will authenticate with GCP using short-lived credentials without storing any service account keys.

**Time Required**: 20-30 minutes

## Prerequisites

### GCP Requirements
- GCP project with billing enabled
- Project Owner or `roles/iam.workloadIdentityPoolAdmin` permission
- Project number (found in project settings)
- APIs enabled: IAM, Security Token Service (STS)

### GitLab Requirements
- GitLab 15.7+ (for id_tokens support)
- GitLab.com, Self-Managed, or Dedicated
- Maintainer or Owner role on the project

### Planning Decisions
- **Which GitLab projects** need GCP access
- **Which GCP services** pipelines need to access
- **Which branches/environments** should be allowed to deploy
- **GCP region(s)** for operations

## Step 1: Enable Required GCP APIs

```bash
gcloud services enable iam.googleapis.com
gcloud services enable sts.googleapis.com
gcloud services enable iamcredentials.googleapis.com
```

## Step 2: Create Workload Identity Pool

```bash
gcloud iam workload-identity-pools create gitlab-pool \
    --location="global" \
    --description="GitLab CI/CD Identity Pool" \
    --display-name="GitLab Pool"
```

**Save the pool ID**: `gitlab-pool`

## Step 3: Configure OIDC Provider

### For GitLab.com

```bash
gcloud iam workload-identity-pools providers create-oidc gitlab-provider \
    --location="global" \
    --workload-identity-pool="gitlab-pool" \
    --issuer-uri="https://gitlab.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.project_path=assertion.project_path,attribute.namespace_id=assertion.namespace_id,attribute.namespace_path=assertion.namespace_path,attribute.project_id=assertion.project_id,attribute.ref=assertion.ref,attribute.ref_type=assertion.ref_type,attribute.ref_protected=assertion.ref_protected" \
    --attribute-condition="assertion.namespace_id=='YOUR_GROUP_ID'"
```

**Replace `YOUR_GROUP_ID`** with your GitLab group ID (found in group settings).

### For Self-Managed GitLab

```bash
gcloud iam workload-identity-pools providers create-oidc gitlab-provider \
    --location="global" \
    --workload-identity-pool="gitlab-pool" \
    --issuer-uri="https://gitlab.example.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.project_path=assertion.project_path,attribute.namespace_id=assertion.namespace_id" \
    --attribute-condition="assertion.namespace_id=='YOUR_GROUP_ID'"
```

**Important**: Your GitLab instance must be publicly accessible for GCP to reach OIDC endpoints.

## Step 4: Find Your GitLab Group ID

### Using GitLab UI
1. Navigate to your group
2. Go to **Settings → General**
3. Look for **Group ID** in the group information

### Using GitLab API
```bash
curl --header "PRIVATE-TOKEN: YOUR_TOKEN" \
  "https://gitlab.com/api/v4/groups/YOUR_GROUP_NAME" | jq .id
```

## Step 5: Create Service Account

```bash
gcloud iam service-accounts create gitlab-ci \
    --display-name="GitLab CI/CD Service Account" \
    --description="Service account for GitLab CI/CD pipelines"
```

**Save the service account email**:
```bash
SA_EMAIL="gitlab-ci@PROJECT_ID.iam.gserviceaccount.com"
```

## Step 6: Grant Service Account Permissions

Grant the minimum permissions needed for your deployments:

```bash
# Example: Grant storage permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/storage.admin"

# Example: Grant compute permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/compute.instanceAdmin.v1"
```

**Recommendation**: Start with minimal permissions and expand as needed.

## Step 7: Allow Workload Identity to Impersonate Service Account

### Get Your Project Number

```bash
PROJECT_NUMBER=$(gcloud projects describe PROJECT_ID --format="value(projectNumber)")
echo "Project Number: $PROJECT_NUMBER"
```

### Grant Impersonation Permission

**For specific project:**

```bash
gcloud iam service-accounts add-iam-policy-binding ${SA_EMAIL} \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/gitlab-pool/attribute.project_path/YOUR_GROUP/YOUR_PROJECT"
```

**For all projects in a group:**

```bash
gcloud iam service-accounts add-iam-policy-binding ${SA_EMAIL} \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/gitlab-pool/attribute.namespace_id/YOUR_GROUP_ID"
```

## Step 8: Store Configuration in GitLab CI/CD Variables

1. Navigate to your GitLab project
2. Go to **Settings → CI/CD → Variables**
3. Add the following variables:

| Variable Name | Value | Protected | Masked |
|---------------|-------|-----------|--------|
| `GCP_PROJECT_ID` | Your GCP project ID | ✓ | ✗ |
| `GCP_PROJECT_NUMBER` | Your GCP project number | ✓ | ✗ |
| `GCP_SERVICE_ACCOUNT` | Service account email | ✓ | ✗ |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full provider path (see below) | ✓ | ✗ |

**Workload Identity Provider Path**:
```
projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/gitlab-pool/providers/gitlab-provider
```

## Step 9: Create GitLab CI/CD Pipeline

Create `.gitlab-ci.yml`:

```yaml
default:
  image: google/cloud-sdk:alpine

variables:
  GCP_PROJECT_ID: "${GCP_PROJECT_ID}"
  GCP_SERVICE_ACCOUNT: "${GCP_SERVICE_ACCOUNT}"
  WORKLOAD_IDENTITY_PROVIDER: "${GCP_WORKLOAD_IDENTITY_PROVIDER}"

stages:
  - test
  - deploy

.gcp_auth: &gcp_auth
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  before_script:
    - echo "Authenticating with GCP..."
    - echo ${GITLAB_OIDC_TOKEN} > /tmp/gitlab_oidc_token.json
    - |
      gcloud iam workload-identity-pools create-cred-config \
        ${WORKLOAD_IDENTITY_PROVIDER} \
        --service-account="${GCP_SERVICE_ACCOUNT}" \
        --credential-source-file=/tmp/gitlab_oidc_token.json \
        --output-file=/tmp/credentials.json
    - export GOOGLE_APPLICATION_CREDENTIALS=/tmp/credentials.json
    - gcloud auth login --cred-file=${GOOGLE_APPLICATION_CREDENTIALS}
    - gcloud config set project ${GCP_PROJECT_ID}

verify_auth:
  stage: test
  <<: *gcp_auth
  script:
    - echo "Verifying GCP authentication..."
    - gcloud auth list
    - gcloud config get-value account
    - gcloud projects describe ${GCP_PROJECT_ID}

deploy_to_gcp:
  stage: deploy
  <<: *gcp_auth
  environment:
    name: production
  only:
    - main
  script:
    - echo "Deploying to GCP..."
    - gcloud storage ls
    # Add your deployment commands here
```

## Step 10: Test the Integration

### Commit and Push

```bash
git add .gitlab-ci.yml
git commit -m "Add GCP OIDC authentication"
git push origin main
```

### Monitor Pipeline Execution

1. Go to **CI/CD → Pipelines**
2. Click on the running pipeline
3. Expand the `verify_auth` job
4. Verify successful authentication

**Expected output**:
```
Authenticated with service account [gitlab-ci@project-id.iam.gserviceaccount.com]
```

## Step 11: Verify in GCP

### Check Audit Logs

```bash
gcloud logging read \
  'protoPayload.serviceName="sts.googleapis.com"
   protoPayload.authenticationInfo.principalEmail:"iam.googleapis.com"' \
  --limit=5 \
  --format=json
```

Verify:
- Token exchange occurred
- Service account was impersonated
- Correct project path in claims

## Step 12: Production Hardening

### Use Protected Branches

Update the Workload Identity Provider to require protected branches:

```bash
gcloud iam workload-identity-pools providers update-oidc gitlab-provider \
    --location="global" \
    --workload-identity-pool="gitlab-pool" \
    --attribute-condition="assertion.namespace_id=='YOUR_GROUP_ID' && assertion.ref_protected=='true'"
```

### Use GitLab Environments

Create protected environment in GitLab:

1. Navigate to **Settings → CI/CD → Environments**
2. Create environment `production`
3. Add protection rules:
   - Allowed to deploy: Maintainers only
   - Approval required: Yes

Update `.gitlab-ci.yml`:

```yaml
deploy_to_gcp:
  stage: deploy
  <<: *gcp_auth
  environment:
    name: production
    action: start
  only:
    - main
  script:
    - echo "Deploying to production..."
    - gcloud run deploy myapp --image=gcr.io/${GCP_PROJECT_ID}/myapp:latest
```

### Enable GCP Audit Logging

```bash
# Enable Data Access audit logs for IAM
gcloud projects get-iam-policy PROJECT_ID > policy.yaml

cat <<EOF >> policy.yaml
auditConfigs:
- auditLogConfigs:
  - logType: ADMIN_READ
  - logType: DATA_READ
  - logType: DATA_WRITE
  service: iam.googleapis.com
EOF

gcloud projects set-iam-policy PROJECT_ID policy.yaml
```

### Set Up Monitoring Alerts

Create alert for unusual activity:

```bash
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="GitLab CI STS Token Exchange Spike" \
  --condition-display-name="High token exchange rate" \
  --condition-threshold-value=50 \
  --condition-threshold-duration=300s
```

## Troubleshooting

### Error: "Failed to generate Google Cloud federated token"

**Cause**: Attribute condition not met

**Solutions**:

1. **Verify your Group ID**:
```bash
# In your pipeline, add debug step
debug_claims:
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  script:
    - echo $GITLAB_OIDC_TOKEN | cut -d '.' -f2 | base64 -d | jq .
```

2. **Check attribute condition**:
```bash
gcloud iam workload-identity-pools providers describe gitlab-provider \
  --location=global \
  --workload-identity-pool=gitlab-pool \
  --format="value(attributeCondition)"
```

3. **Ensure using namespace_id, not namespace_path**

### Error: "Unable to acquire impersonated credentials"

**Cause**: Service account impersonation not configured

**Solutions**:

1. **Verify IAM binding**:
```bash
gcloud iam service-accounts get-iam-policy ${SA_EMAIL}
```

2. **Check principal format** includes `attribute.project_path` or `attribute.namespace_id`

3. **Verify using project NUMBER** not project ID

### Error: "OIDC endpoint not accessible"

**Cause**: GitLab instance not publicly accessible (self-managed only)

**Solutions**:

1. **Test OIDC endpoint**:
```bash
curl https://gitlab.example.com/.well-known/openid-configuration
```

2. **Ensure endpoints are public**:
   - `/.well-known/openid-configuration`
   - `/oauth/discovery/keys`

3. **Check firewall rules** allow GCP IP ranges

### Pipeline Fails with "Invalid JWT"

**Cause**: Token expired or malformed

**Solutions**:

1. **Check GitLab version** (requires 15.7+)
2. **Verify id_tokens syntax**:
```yaml
id_tokens:
  GITLAB_OIDC_TOKEN:
    aud: https://gitlab.com  # Correct
# NOT: aud: "https://gitlab.com"  # Sometimes causes issues
```

3. **Ensure token is fresh** (re-run pipeline)

## Advanced Patterns

### Multi-Environment Deployment

```yaml
.gcp_auth_template: &gcp_auth
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  before_script:
    - echo ${GITLAB_OIDC_TOKEN} > /tmp/token.json
    - |
      gcloud iam workload-identity-pools create-cred-config \
        ${WORKLOAD_IDENTITY_PROVIDER} \
        --service-account="${GCP_SERVICE_ACCOUNT}" \
        --credential-source-file=/tmp/token.json \
        --output-file=/tmp/creds.json
    - export GOOGLE_APPLICATION_CREDENTIALS=/tmp/creds.json
    - gcloud auth login --cred-file=${GOOGLE_APPLICATION_CREDENTIALS}

deploy_dev:
  stage: deploy
  <<: *gcp_auth
  environment:
    name: development
  variables:
    GCP_SERVICE_ACCOUNT: "gitlab-dev@project.iam.gserviceaccount.com"
  only:
    - develop
  script:
    - gcloud run deploy myapp-dev --image=gcr.io/${GCP_PROJECT_ID}/myapp:${CI_COMMIT_SHA}

deploy_prod:
  stage: deploy
  <<: *gcp_auth
  environment:
    name: production
  variables:
    GCP_SERVICE_ACCOUNT: "gitlab-prod@project.iam.gserviceaccount.com"
  only:
    - main
  script:
    - gcloud run deploy myapp-prod --image=gcr.io/${GCP_PROJECT_ID}/myapp:${CI_COMMIT_TAG}
```

### Docker Build and Push to GCR

```yaml
build_and_push:
  stage: build
  image: google/cloud-sdk:alpine
  services:
    - docker:dind
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  before_script:
    - apk add --no-cache docker
    - echo ${GITLAB_OIDC_TOKEN} > /tmp/token.json
    - |
      gcloud iam workload-identity-pools create-cred-config \
        ${WORKLOAD_IDENTITY_PROVIDER} \
        --service-account="${GCP_SERVICE_ACCOUNT}" \
        --credential-source-file=/tmp/token.json \
        --output-file=/tmp/creds.json
    - gcloud auth login --cred-file=/tmp/creds.json
    - gcloud auth configure-docker
  script:
    - docker build -t gcr.io/${GCP_PROJECT_ID}/myapp:${CI_COMMIT_SHA} .
    - docker push gcr.io/${GCP_PROJECT_ID}/myapp:${CI_COMMIT_SHA}
```

### Terraform Deployment

```yaml
terraform:
  stage: deploy
  image: hashicorp/terraform:latest
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  before_script:
    - apk add --no-cache curl jq
    - wget https://dl.google.com/dl/cloudsdk/release/google-cloud-sdk.tar.gz
    - tar -xzf google-cloud-sdk.tar.gz
    - ./google-cloud-sdk/install.sh -q
    - export PATH=$PATH:./google-cloud-sdk/bin
    - echo ${GITLAB_OIDC_TOKEN} > /tmp/token.json
    - |
      gcloud iam workload-identity-pools create-cred-config \
        ${WORKLOAD_IDENTITY_PROVIDER} \
        --service-account="${GCP_SERVICE_ACCOUNT}" \
        --credential-source-file=/tmp/token.json \
        --output-file=/tmp/creds.json
    - export GOOGLE_APPLICATION_CREDENTIALS=/tmp/creds.json
  script:
    - cd terraform/
    - terraform init
    - terraform plan -out=tfplan
    - terraform apply -auto-approve tfplan
  only:
    - main
```

## Security Best Practices

### 1. Use Immutable IDs

Prefer `namespace_id` over `namespace_path`:

```bash
--attribute-condition="assertion.namespace_id=='123'"  # Good
--attribute-condition="assertion.namespace_path=='mygroup'"  # Can be renamed
```

### 2. Restrict to Protected Branches

```bash
--attribute-condition="assertion.ref_protected=='true'"
```

### 3. Separate Service Accounts by Environment

- `gitlab-dev@project.iam.gserviceaccount.com` - Development
- `gitlab-staging@project.iam.gserviceaccount.com` - Staging
- `gitlab-prod@project.iam.gserviceaccount.com` - Production

### 4. Least Privilege Permissions

Grant only necessary permissions:

```bash
# Good: Specific bucket access
gsutil iam ch serviceAccount:${SA_EMAIL}:roles/storage.objectAdmin gs://my-bucket

# Bad: Project-wide storage admin
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.admin"
```

### 5. Monitor and Audit

- Enable GCP audit logging
- Monitor token exchange patterns
- Set up alerts for unusual activity
- Review service account usage quarterly

## Complete Terraform Example

```hcl
variable "gitlab_group_id" {
  description = "GitLab Group ID"
  type        = string
}

variable "gitlab_project_path" {
  description = "GitLab Project Path (e.g., mygroup/myproject)"
  type        = string
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

# Workload Identity Pool
resource "google_iam_workload_identity_pool" "gitlab_pool" {
  workload_identity_pool_id = "gitlab-pool"
  display_name              = "GitLab CI/CD Pool"
  description               = "Identity pool for GitLab CI/CD"
}

# OIDC Provider
resource "google_iam_workload_identity_pool_provider" "gitlab_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.gitlab_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "gitlab-provider"
  display_name                       = "GitLab Provider"

  attribute_condition = "assertion.namespace_id == '${var.gitlab_group_id}'"

  attribute_mapping = {
    "google.subject"         = "assertion.sub"
    "attribute.project_path" = "assertion.project_path"
    "attribute.namespace_id" = "assertion.namespace_id"
    "attribute.ref"          = "assertion.ref"
    "attribute.ref_protected" = "assertion.ref_protected"
  }

  oidc {
    issuer_uri = "https://gitlab.com"
  }
}

# Service Account
resource "google_service_account" "gitlab_ci" {
  account_id   = "gitlab-ci"
  display_name = "GitLab CI/CD SA"
}

# Allow impersonation
resource "google_service_account_iam_member" "workload_identity" {
  service_account_id = google_service_account.gitlab_ci.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.gitlab_pool.name}/attribute.project_path/${var.gitlab_project_path}"
}

# Grant permissions
resource "google_project_iam_member" "gitlab_storage" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.gitlab_ci.email}"
}

# Outputs
output "workload_identity_provider" {
  value = google_iam_workload_identity_pool_provider.gitlab_provider.name
}

output "service_account_email" {
  value = google_service_account.gitlab_ci.email
}
```

## Next Steps

- **Explore other integrations**: [GitLab to Azure](gitlab-to-azure.md)
- **Learn more about GitLab CI**: [GitLab CI Initiator Documentation](../initiators/ci-tools/gitlab-ci.md)
- **GCP deep dive**: [GCP Workload Identity Federation](../providers/cloud-platforms/gcp/workload-identity-federation.md)

## Additional Resources

- [GitLab CI/CD with GCP](https://docs.gitlab.com/ci/cloud_services/google_cloud/)
- [GCP Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitLab OIDC Documentation](https://docs.gitlab.com/ee/ci/secrets/id_token_authentication.html)

## Conclusion

You now have a fully functional secretless authentication setup between GitLab CI/CD and GCP using Workload Identity Federation. This eliminates the security risks of storing service account keys while providing seamless deployment automation.

**Key Benefits**:
- ✅ No service account keys stored in GitLab
- ✅ Automatic credential rotation
- ✅ Fine-grained access control via attribute conditions
- ✅ Full audit trail via GCP logging
- ✅ Improved security posture
