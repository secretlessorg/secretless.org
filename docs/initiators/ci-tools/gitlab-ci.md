---
sidebar_position: 2
title: GitLab CI/CD OIDC Authentication
description: Learn how GitLab CI/CD initiates secretless authentication using OpenID Connect (OIDC) ID tokens to eliminate the need for storing long-lived credentials
keywords: [gitlab ci, gitlab, oidc, openid connect, authentication, secretless, ci cd, id tokens, jwt]
---

# GitLab CI/CD OIDC Authentication

GitLab CI/CD can authenticate with cloud providers using OpenID Connect (OIDC), eliminating the need to store long-lived credentials as CI/CD variables.

## Overview

GitLab generates OIDC ID tokens that workflows can exchange for temporary credentials with AWS, GCP, Azure, and other providers.

### Requirements

- **GitLab Version:** 15.7+ (December 2022)
- **Availability:** GitLab.com (SaaS), Self-Managed, and Dedicated
- **Tiers:** Free, Premium, and Ultimate

**Note:** Legacy `CI_JOB_JWT*` variables were removed in GitLab 17.0 (May 2024). Use `id_tokens` instead.

## Configuration

### Basic Setup

Configure ID tokens using the `id_tokens` keyword:

```yaml
job_name:
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://target-service.com
  script:
    - echo "Token available as $GITLAB_OIDC_TOKEN"
```

### Multiple Tokens

```yaml
authenticate_multiple:
  id_tokens:
    AWS_TOKEN:
      aud: https://gitlab.com
    GCP_TOKEN:
      aud: https://gitlab.com
    VAULT_TOKEN:
      aud: https://vault.example.com
  script:
    - authenticate-aws.sh $AWS_TOKEN
    - authenticate-gcp.sh $GCP_TOKEN
```

### Default Level (GitLab 16.4+)

```yaml
default:
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com

job1:
  script:
    - echo "Token inherited from default"
```

### File-Based Tokens

```yaml
job:
  id_tokens:
    TOKEN_FILE:
      aud: https://service.com
      file: true
  script:
    - custom-tool --token-file "${TOKEN_FILE}" authenticate
```

## Token Structure

### Standard Claims

```json
{
  "iss": "https://gitlab.com",
  "sub": "project_path:mygroup/myproject:ref_type:branch:ref:main",
  "aud": "https://gitlab.com",
  "exp": 1740824742,
  "nbf": 1740821137,
  "iat": 1740821142,
  "jti": "4bd8767e-3d66-4958-8b83-7097daebc1a7"
}
```

### GitLab-Specific Claims

```json
{
  "namespace_id": "10",
  "namespace_path": "example",
  "project_id": "1",
  "project_path": "example/my-project",
  "project_visibility": "public",
  "user_id": "1",
  "user_login": "username",
  "user_email": "user@example.com",
  "pipeline_id": "18",
  "pipeline_source": "push",
  "job_id": "34",
  "ref": "main",
  "ref_type": "branch",
  "ref_path": "refs/heads/main",
  "ref_protected": "true",
  "runner_environment": "self-hosted",
  "sha": "95d18d66afd2c0609f6c41bd537a827beb698e64"
}
```

### Environment Claims (when specified)

```json
{
  "environment": "production",
  "environment_protected": "true",
  "deployment_tier": "production"
}
```

### Subject Claim Format

```
project_path:{group}/{project}:ref_type:{type}:ref:{ref_name}
```

**Examples:**
- `project_path:my-group/my-project:ref_type:branch:ref:main`
- `project_path:my-group/my-project:ref_type:tag:ref:v1.0.0`

## OIDC Discovery Endpoints

**GitLab.com:**
- OpenID Configuration: `https://gitlab.com/.well-known/openid-configuration`
- JWKS: `https://gitlab.com/oauth/discovery/keys`

**Self-Managed:**
- OpenID Configuration: `https://your-gitlab.com/.well-known/openid-configuration`
- JWKS: `https://your-gitlab.com/oauth/discovery/keys`

**Important:** GitLab instance must be publicly accessible for external services to validate tokens.

## Integration Examples

### AWS

```yaml
assume_aws_role:
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  variables:
    ROLE_ARN: arn:aws:iam::123456789012:role/GitLabRole
  script:
    - |
      STS_OUTPUT=$(aws sts assume-role-with-web-identity \
        --role-arn ${ROLE_ARN} \
        --role-session-name "GitLab-${CI_PROJECT_ID}-${CI_PIPELINE_ID}" \
        --web-identity-token ${GITLAB_OIDC_TOKEN} \
        --duration-seconds 3600 \
        --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
        --output text)
    - export AWS_ACCESS_KEY_ID=$(echo $STS_OUTPUT | cut -d' ' -f1)
    - export AWS_SECRET_ACCESS_KEY=$(echo $STS_OUTPUT | cut -d' ' -f2)
    - export AWS_SESSION_TOKEN=$(echo $STS_OUTPUT | cut -d' ' -f3)
    - aws sts get-caller-identity
```

### GCP

```yaml
authenticate_gcp:
  image: google/cloud-sdk:alpine
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  variables:
    WORKLOAD_IDENTITY_PROVIDER: "projects/123/locations/global/workloadIdentityPools/gitlab-pool/providers/gitlab-provider"
    SERVICE_ACCOUNT: "gitlab-ci@project-id.iam.gserviceaccount.com"
  script:
    - echo ${GITLAB_OIDC_TOKEN} > /tmp/token
    - |
      gcloud iam workload-identity-pools create-cred-config \
        ${WORKLOAD_IDENTITY_PROVIDER} \
        --service-account=${SERVICE_ACCOUNT} \
        --credential-source-file=/tmp/token \
        --output-file=credentials.json
    - export GOOGLE_APPLICATION_CREDENTIALS=credentials.json
    - gcloud auth login --cred-file=${GOOGLE_APPLICATION_CREDENTIALS}
    - gcloud storage ls
```

### Azure

```yaml
default:
  image: mcr.microsoft.com/azure-cli:latest

variables:
  AZURE_CLIENT_ID: "your-client-id"
  AZURE_TENANT_ID: "your-tenant-id"

authenticate_azure:
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  script:
    - |
      az login --service-principal \
        -u $AZURE_CLIENT_ID \
        -t $AZURE_TENANT_ID \
        --federated-token $GITLAB_OIDC_TOKEN
    - az account show
    - az vm list
```

### HashiCorp Vault

```yaml
job_with_vault:
  id_tokens:
    VAULT_ID_TOKEN:
      aud: https://vault.example.com
  secrets:
    DATABASE_PASSWORD:
      vault: production/db/password@secret
      token: $VAULT_ID_TOKEN
  script:
    - echo "Password retrieved: $DATABASE_PASSWORD"
```

## Best Practices

### 1. Minimize Token Scope

Only configure tokens in jobs that need them:

```yaml
# Good: Token only where needed
deploy_production:
  id_tokens:
    AWS_TOKEN:
      aud: https://gitlab.com
  script:
    - deploy-to-aws.sh

build_application:
  # No token - doesn't need cloud access
  script:
    - npm run build
```

### 2. Use Specific Audiences

Configure different audiences for different services:

```yaml
job:
  id_tokens:
    AWS_TOKEN:
      aud: https://gitlab.com
    VAULT_TOKEN:
      aud: https://vault.company.com
```

### 3. Leverage Environment Claims

```yaml
deploy_production:
  environment:
    name: production
  id_tokens:
    PROD_TOKEN:
      aud: https://gitlab.com
  script:
    - deploy.sh
```

Token will include:
```json
{
  "environment": "production",
  "environment_protected": "true"
}
```

### 4. Restrict by Protected Branches

In trust policies:
```json
{
  "Condition": {
    "StringEquals": {
      "gitlab.com:ref_protected": "true"
    }
  }
}
```

### 5. Use Immutable IDs

Prefer `namespace_id` over `namespace_path` in trust policies (namespace paths can be renamed).

## Troubleshooting

### Token Not Available

**Cause:** Missing `id_tokens` configuration

**Solution:**
```yaml
job:
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: https://gitlab.com
  script:
    - echo $GITLAB_OIDC_TOKEN | wc -c  # Verify token exists
```

### 401 Unauthorized

**Causes:**
- Audience mismatch
- Using deprecated `CI_JOB_JWT_V2`
- Token expired

**Solution:**
- Verify audience matches between GitLab and provider
- Update to `id_tokens` keyword
- Check token expiration (default 5 minutes)

### GitLab Instance Not Accessible

**Cause:** Self-hosted GitLab behind firewall

**Solution:**
- Ensure `/.well-known/openid-configuration` is publicly accessible
- Whitelist cloud provider IPs if using firewall
- Test: `curl https://your-gitlab.com/.well-known/openid-configuration`

### Subject Claim Mismatch

**Cause:** Trust policy doesn't match actual subject

**Solution:**
```bash
# Decode token to verify claims
echo $GITLAB_OIDC_TOKEN | cut -d '.' -f2 | base64 -d | jq .sub
```

## Token Expiration

- **Default:** 5 minutes (if no job timeout specified)
- **With timeout:** Token expires at job timeout
- **Encoding:** RS256

## Security Considerations

### Trust Policy Restrictions

**Always restrict by project or namespace:**

```json
{
  "Condition": {
    "StringEquals": {
      "gitlab.com:namespace_id": "YOUR_GROUP_ID",
      "gitlab.com:ref": "main"
    }
  }
}
```

### Avoid Wildcards

```json
// BAD
"gitlab.com:sub": "project_path:*:*"

// GOOD
"gitlab.com:project_path": "mygroup/myproject"
```

### Monitor Authentication

- Review GitLab audit events
- Monitor cloud provider sign-in logs
- Set up alerts for failed authentication

## Next Steps

- **AWS Setup**: See [AWS OIDC Provider Setup](../../providers/cloud-platforms/aws/oidc-setup.md)
- **GCP Setup**: See [GCP Workload Identity Federation](../../providers/cloud-platforms/gcp/workload-identity-federation.md)
- **Azure Setup**: See [Azure Federated Credentials](../../providers/cloud-platforms/azure/federated-credentials.md)
- **Complete Integration**: Follow [GitLab to GCP Guide](../../guides/gitlab-to-gcp.md)

## Additional Resources

- [GitLab OIDC Documentation](https://docs.gitlab.com/ee/ci/secrets/id_token_authentication.html)
- [GitLab Cloud Services Integration](https://docs.gitlab.com/ci/cloud_services/)
- [ID Tokens Keyword Reference](https://docs.gitlab.com/ee/ci/yaml/#id_tokens)
