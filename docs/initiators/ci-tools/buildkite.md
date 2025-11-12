---
sidebar_position: 3
title: Buildkite OIDC Authentication
description: Learn how Buildkite initiates secretless authentication using OpenID Connect (OIDC) tokens to eliminate the need for storing long-lived credentials
keywords: [buildkite, oidc, openid connect, authentication, secretless, ci cd, buildkite agent, jwt]
---

# Buildkite OIDC Authentication

Buildkite provides native OIDC support, allowing pipelines to authenticate with cloud providers without storing long-lived credentials.

## Overview

Starting with agent v3.41.0 (March 2023), Buildkite agents can generate OIDC tokens that can be exchanged for temporary cloud credentials.

### Requirements

- **Minimum Agent Version:** v3.41.0
- **Recommended Version:** v3.62.0+
- **OIDC Provider:** `https://agent.buildkite.com`

## Token Generation

### Basic Command

```bash
buildkite-agent oidc request-token --audience <audience>
```

### Command Options

| Option | Description | Required |
|--------|-------------|----------|
| `--audience` | Token recipient (e.g., `sts.amazonaws.com`) | Yes |
| `--claim` | Additional claims to include | No |
| `--lifetime` | Token validity in seconds | No |
| `--aws-session-tag` | AWS session tags (v3.83.0+) | No |

### Examples

```bash
# Basic AWS token
buildkite-agent oidc request-token --audience sts.amazonaws.com

# Token with additional claims
buildkite-agent oidc request-token \
  --audience sts.amazonaws.com \
  --claim organization_id \
  --claim pipeline_id

# Token with custom lifetime
buildkite-agent oidc request-token \
  --audience vault.example.com \
  --lifetime 300

# AWS with session tags
buildkite-agent oidc request-token \
  --audience sts.amazonaws.com \
  --aws-session-tag "organization_slug,pipeline_slug"
```

## Token Structure

### Standard Claims

```json
{
  "iss": "https://agent.buildkite.com",
  "sub": "organization:acme:pipeline:app:ref:refs/heads/main:commit:abc123:step:deploy",
  "aud": "sts.amazonaws.com",
  "iat": 1669014898,
  "exp": 1669015198
}
```

### Subject Pattern

```
organization:ORG_SLUG:pipeline:PIPELINE_SLUG:ref:REF:commit:COMMIT:step:STEP_KEY
```

**Example:**
```
organization:planetscale:pipeline:vault-plugin:ref:refs/heads/main:commit:750339bf:step:deploy
```

### Available Claims

Request with `--claim` flag:

- `organization_slug` - Organization name (mutable)
- `organization_id` - Organization UUID (immutable)
- `pipeline_slug` - Pipeline name (mutable)
- `pipeline_id` - Pipeline UUID (immutable)
- `build_number` - Sequential build number
- `build_branch` - Git branch name
- `build_tag` - Git tag (if applicable)
- `build_commit` - Git commit SHA
- `step_key` - Step identifier
- `job_id` - Unique job UUID
- `agent_id` - Unique agent UUID

## Integration Examples

### AWS Integration

**Using Official Plugin:**

```yaml
steps:
  - label: "Deploy to AWS"
    command: |
      aws sts get-caller-identity
      aws s3 ls
    plugins:
      - aws-assume-role-with-web-identity#v1.4.0:
          role-arn: arn:aws:iam::123456789012:role/buildkite-deploy
```

**With Session Tags:**

```yaml
steps:
  - label: "Deploy with Tags"
    command: |
      aws ssm get-parameter --name /app/config
    plugins:
      - aws-assume-role-with-web-identity#v1.4.0:
          role-arn: arn:aws:iam::123456789012:role/buildkite-deploy
          role-session-name: "buildkite-${BUILDKITE_BUILD_NUMBER}"
          role-session-duration: 3600
          session-tags:
            - organization_slug
            - pipeline_slug
            - build_branch
          region: us-west-2
```

### GCP Integration

**Using Official Plugin:**

```yaml
steps:
  - label: "Deploy to GCP"
    command: |
      gcloud storage ls gs://my-bucket
    plugins:
      - gcp-workload-identity-federation#v1.2.0:
          service-account: "deploy-sa@project-id.iam.gserviceaccount.com"
          audience: "//iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/buildkite-pool/providers/buildkite-provider"
```

**With Additional Claims:**

```yaml
steps:
  - label: "Deploy with Claims"
    command: |
      gcloud compute instances list
    plugins:
      - gcp-workload-identity-federation#v1.2.0:
          service-account: "deploy-sa@project-id.iam.gserviceaccount.com"
          audience: "//iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/buildkite-pool/providers/buildkite-provider"
          claims:
            - organization_id
            - pipeline_id
          lifetime: 3600
```

### Azure Integration (Manual)

```yaml
steps:
  - label: "Deploy to Azure"
    command: |
      # Request token
      TOKEN=$(buildkite-agent oidc request-token --audience api://AzureADTokenExchange)

      # Login with federated token
      az login --service-principal \
        -u $AZURE_CLIENT_ID \
        -t $AZURE_TENANT_ID \
        --federated-token "$TOKEN"

      # Use Azure CLI
      az vm list
```

## OIDC Discovery Endpoints

- **Discovery:** `https://agent.buildkite.com/.well-known/openid-configuration`
- **JWKS:** `https://agent.buildkite.com/.well-known/jwks`

## Trust Policy Examples

### AWS IAM Trust Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::AWS-ACCOUNT-ID:oidc-provider/agent.buildkite.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "agent.buildkite.com:sub": "organization:acme:pipeline:app:*"
        },
        "StringEquals": {
          "agent.buildkite.com:aud": "sts.amazonaws.com"
        }
      }
    }
  ]
}
```

### GCP Workload Identity Provider

```bash
gcloud iam workload-identity-pools providers create-oidc buildkite-provider \
  --location="global" \
  --workload-identity-pool="buildkite-pool" \
  --issuer-uri="https://agent.buildkite.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.organization_slug=assertion.organization_slug,attribute.pipeline_slug=assertion.pipeline_slug" \
  --attribute-condition="assertion.organization_slug=='acme'"
```

### Azure Federated Credential

```bash
cat <<EOF > buildkite-cred.json
{
  "name": "BuildkiteOIDC",
  "issuer": "https://agent.buildkite.com",
  "subject": "organization:acme:pipeline:app:ref:refs/heads/main:commit:*:step:*",
  "audiences": ["api://AzureADTokenExchange"]
}
EOF

az ad app federated-credential create --id $APP_ID --parameters buildkite-cred.json
```

## Security Best Practices

### 1. Use Narrow Trust Policies

**DO:**
```json
{
  "Condition": {
    "StringEquals": {
      "agent.buildkite.com:sub": "organization:acme:pipeline:production:*"
    }
  }
}
```

**DON'T:**
```json
{
  "Condition": {
    "StringLike": {
      "agent.buildkite.com:sub": "*"
    }
  }
}
```

### 2. Use Immutable Claims

Prefer UUIDs over slugs:
- `organization_id` over `organization_slug`
- `pipeline_id` over `pipeline_slug`

**Why:** Organizations and pipelines can be renamed.

### 3. Leverage Session Tags (AWS)

```yaml
session-tags:
  - organization_id  # Immutable
  - pipeline_id      # Immutable
  - build_branch     # Branch-specific
```

Trust policy with session tags:
```json
{
  "Condition": {
    "StringEquals": {
      "aws:RequestTag/organization_id": "uuid-of-org",
      "aws:RequestTag/build_branch": "main"
    }
  }
}
```

### 4. Set Appropriate Token Lifetimes

```bash
# 5 minutes for quick operations
buildkite-agent oidc request-token --audience sts.amazonaws.com --lifetime 300

# 1 hour for deployments
buildkite-agent oidc request-token --audience sts.amazonaws.com --lifetime 3600
```

### 5. Enable Token Redaction

Update to agent v3.104.0+ for automatic token redaction from build logs.

## Troubleshooting

### BUILDKITE_AGENT_JOB_API_SOCKET empty

**Cause:** Agent version too old or job API unavailable

**Solution:**
```bash
# Verify agent version
buildkite-agent --version

# Upgrade to v3.62.0+
```

### Token Rejected by Cloud Provider

**Cause:** Trust policy mismatch

**Solution:**
```bash
# Decode token to verify claims
TOKEN=$(buildkite-agent oidc request-token --audience sts.amazonaws.com)
echo $TOKEN | cut -d. -f2 | base64 -d | jq .
```

### Missing Claims

**Cause:** Claims not requested

**Solution:**
```bash
buildkite-agent oidc request-token \
  --audience sts.amazonaws.com \
  --claim organization_id \
  --claim pipeline_id
```

### AWS Trust Policy Not Working

**Cause:** Incorrect OIDC provider or trust policy format

**Solution:**
```bash
# Verify OIDC provider exists
aws iam list-open-id-connect-providers

# Check trust policy uses colon notation
# agent.buildkite.com:sub (not agent.buildkite.com.sub)
```

## Plugin Options

### aws-assume-role-with-web-identity

| Option | Description |
|--------|-------------|
| `role-arn` | IAM role ARN to assume |
| `role-session-name` | Session identifier |
| `role-session-duration` | Session duration (seconds) |
| `session-tags` | OIDC claims for AWS session tags |
| `region` | AWS region |

### gcp-workload-identity-federation

| Option | Description |
|--------|-------------|
| `service-account` | GCP service account email |
| `audience` | Workload identity pool provider audience |
| `claims` | Additional OIDC claims |
| `lifetime` | Token validity (seconds) |

## Next Steps

- **AWS Setup**: See [AWS OIDC Provider Setup](../../providers/aws/oidc-setup.md)
- **GCP Setup**: See [GCP Workload Identity Federation](../../providers/gcp/workload-identity-federation.md)
- **Complete Integration**: Follow [Buildkite to AWS Guide](../../guides/buildkite-to-aws.md)

## Additional Resources

- [Buildkite OIDC Documentation](https://buildkite.com/docs/pipelines/security/oidc)
- [buildkite-agent oidc CLI Reference](https://buildkite.com/docs/agent/v3/cli-oidc)
- [AWS Plugin](https://github.com/buildkite-plugins/aws-assume-role-with-web-identity-buildkite-plugin)
- [GCP Plugin](https://github.com/buildkite-plugins/gcp-workload-identity-federation-buildkite-plugin)
