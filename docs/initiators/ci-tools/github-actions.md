---
sidebar_position: 1
title: GitHub Actions - Secretless Authentication
description: Learn how GitHub Actions enables secretless authentication to eliminate the need for storing long-lived credentials using OIDC tokens
keywords: [github actions, secretless, authentication, oidc, openid connect, ci cd, workflows, jwt token]
---

# GitHub Actions - Secretless Authentication

GitHub Actions enables secretless authentication with cloud providers using OpenID Connect (OIDC), eliminating the need to store long-lived credentials as secrets.

## Overview

GitHub Actions OIDC authentication works by:

1. **Token Generation**: GitHub generates a unique JWT (JSON Web Token) for each workflow run
2. **Token Request**: The workflow requests the token using special permissions
3. **Token Exchange**: The action exchanges the JWT with the cloud provider for temporary credentials
4. **Credential Usage**: Subsequent steps use the temporary credentials automatically

This approach means no AWS access keys, service account keys, or other long-lived credentials need to be stored in GitHub.

## How It Works

### Token Generation

When a workflow runs with `id-token: write` permission, GitHub automatically generates an OIDC token containing:

- **Standard JWT claims**: `iss`, `sub`, `aud`, `exp`, `iat`, `jti`, `nbf`
- **GitHub-specific claims**: `repository`, `workflow`, `actor`, `ref`, `sha`
- **Advanced claims**: `environment`, `job_workflow_ref`, `repository_visibility`

### Token Structure

Example token payload:

```json
{
  "jti": "example-id",
  "sub": "repo:octo-org/octo-repo:ref:refs/heads/main",
  "aud": "sts.amazonaws.com",
  "ref": "refs/heads/main",
  "sha": "abc123...",
  "repository": "octo-org/octo-repo",
  "repository_owner": "octo-org",
  "repository_id": "74",
  "repository_owner_id": "65",
  "repository_visibility": "private",
  "actor": "octocat",
  "actor_id": "12",
  "workflow": "Deploy",
  "workflow_ref": "octo-org/octo-repo/.github/workflows/deploy.yml@refs/heads/main",
  "workflow_sha": "def456...",
  "job_workflow_ref": "octo-org/octo-automation/.github/workflows/oidc.yml@refs/heads/main",
  "run_id": "1234567890",
  "run_number": "10",
  "run_attempt": "2",
  "event_name": "push",
  "ref_type": "branch",
  "ref_protected": "true",
  "environment": "production",
  "runner_environment": "github-hosted",
  "iss": "https://token.actions.githubusercontent.com",
  "exp": 1632493867,
  "iat": 1632493567
}
```

### Subject Claim Patterns

The `sub` (subject) claim uniquely identifies the workflow context and is used by cloud providers to authorize access:

| Context | Subject Pattern |
|---------|----------------|
| Branch push | `repo:<org>/<repo>:ref:refs/heads/<branch>` |
| Pull request | `repo:<org>/<repo>:pull_request` |
| Tag push | `repo:<org>/<repo>:ref:refs/tags/<tag>` |
| Environment | `repo:<org>/<repo>:environment:<environment>` |
| Reusable workflow | Uses caller workflow's context, but adds `job_workflow_ref` |

## Workflow Configuration

### Required Permissions

OIDC authentication requires specific permissions in your workflow:

```yaml
permissions:
  id-token: write   # Required to request OIDC token
  contents: read    # Required to checkout repository (if needed)
```

These can be set at the workflow level (applies to all jobs) or job level (specific jobs only).

### Basic Workflow Example

```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::123456789100:role/GitHubActionsRole
          aws-region: us-east-1

      - name: Deploy
        run: |
          aws s3 sync ./dist s3://my-bucket
```

## Configuration Options

### AWS-Specific Action: `aws-actions/configure-aws-credentials`

**Current Version**: v2 (use v2 or pin to specific version like v2.1.0)

**Key Parameters**:

| Parameter | Description | Required | Default |
|-----------|-------------|----------|---------|
| `role-to-assume` | ARN of the IAM role to assume | Yes | - |
| `aws-region` | AWS region for operations | Yes | - |
| `audience` | Audience for OIDC provider | No | `sts.amazonaws.com` |
| `role-session-name` | Custom session identifier | No | `GitHubActions` |
| `role-duration-seconds` | Credential validity (900-43200) | No | 3600 |
| `role-skip-session-tagging` | Skip automatic session tagging | No | `false` |
| `role-chaining` | Use existing credentials | No | `false` |
| `mask-aws-account-id` | Mask account ID in logs | No | `true` |
| `http-proxy` | HTTP proxy URL | No | - |

### Custom Session Names

Use descriptive session names for easier CloudTrail analysis:

```yaml
- uses: aws-actions/configure-aws-credentials@v2
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: us-east-1
    role-session-name: GitHubActions-${{ github.run_id }}-${{ github.job }}
```

### Session Duration

Control how long credentials remain valid:

```yaml
- uses: aws-actions/configure-aws-credentials@v2
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: us-east-1
    role-duration-seconds: 7200  # 2 hours
```

**Duration Limits**:
- Minimum: 900 seconds (15 minutes)
- Maximum: 43200 seconds (12 hours) or role's maximum session duration
- Default: 3600 seconds (1 hour)

### Session Tagging

By default, GitHub Actions tags AWS sessions with metadata for tracking:

| Tag Key | Value Source | Example |
|---------|--------------|---------|
| `GitHub` | Static | "Actions" |
| `Repository` | `GITHUB_REPOSITORY` | "myorg/myrepo" |
| `Workflow` | `GITHUB_WORKFLOW` | "Deploy to Production" |
| `Action` | `GITHUB_ACTION` | "configure-aws-credentials" |
| `Actor` | `GITHUB_ACTOR` | "octocat" |
| `Branch` | `GITHUB_REF` | "refs/heads/main" |
| `Commit` | `GITHUB_SHA` | "abc123..." |

Disable session tagging if needed:

```yaml
- uses: aws-actions/configure-aws-credentials@v2
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: us-east-1
    role-skip-session-tagging: true
```

## Advanced Usage Patterns

### Multi-Account Deployment

Deploy to multiple AWS accounts in sequence:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - name: Configure Dev Account
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::111111111111:role/dev-role
          aws-region: us-east-1

      - name: Deploy to Dev
        run: ./deploy.sh dev

      - name: Configure Prod Account
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::222222222222:role/prod-role
          aws-region: us-east-1

      - name: Deploy to Prod
        run: ./deploy.sh prod
```

### Role Chaining

Assume a second role using credentials from the first:

```yaml
- name: Assume First Role
  uses: aws-actions/configure-aws-credentials@v2
  with:
    role-to-assume: arn:aws:iam::111111111111:role/first-role
    aws-region: us-east-1

- name: Assume Second Role (Cross-Account)
  uses: aws-actions/configure-aws-credentials@v2
  with:
    role-to-assume: arn:aws:iam::222222222222:role/second-role
    aws-region: us-east-1
    role-chaining: true
```

**Requirements**:
- Second role's trust policy must allow the first role to assume it
- First role needs `sts:TagSession` permission if session tagging is enabled

### Multi-Region Deployment

Use workflow matrices for parallel regional deployments:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    strategy:
      matrix:
        region: [us-east-1, eu-west-1, ap-southeast-1]
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ matrix.region }}

      - name: Deploy to Region
        run: |
          aws s3 sync ./dist s3://my-bucket-${{ matrix.region }}
```

### Environment-Based Deployment

Use GitHub Environments for approval workflows:

```yaml
jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production  # Requires approval in repo settings
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - name: Deploy
        run: ./deploy.sh
```

**Important**: When using GitHub Environments, the subject claim changes to:
```
repo:<org>/<repo>:environment:<environment-name>
```

The AWS trust policy must be updated to include this pattern.

### Custom Audience for AWS Partitions

For AWS China or GovCloud:

```yaml
- name: Configure AWS China Credentials
  uses: aws-actions/configure-aws-credentials@v2
  with:
    audience: sts.amazonaws.com.cn
    aws-region: cn-northwest-1
    role-to-assume: arn:aws-cn:iam::123456789100:role/my-role
```

## Reusable Workflows

When using reusable workflows, token claims include both caller and called workflow information.

**Caller workflow** (`.github/workflows/deploy.yml`):
```yaml
jobs:
  deploy:
    uses: myorg/shared-workflows/.github/workflows/aws-deploy.yml@main
    permissions:
      id-token: write
      contents: read
    secrets:
      AWS_ROLE_ARN: ${{ secrets.AWS_ROLE_ARN }}
```

**Reusable workflow** (in `myorg/shared-workflows`):
```yaml
on:
  workflow_call:
    secrets:
      AWS_ROLE_ARN:
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1
```

**Token Claims**:
- `sub`, `repository`, `workflow`: Describe the **caller** workflow
- `job_workflow_ref`: Describes the **reusable** workflow
  - Example: `myorg/shared-workflows/.github/workflows/aws-deploy.yml@refs/heads/main`

## Self-Hosted Runners

### Runner with Existing Credentials

If your self-hosted runner already has AWS access (e.g., EC2 instance with IAM role):

```yaml
- name: Use Runner's Credentials
  uses: aws-actions/configure-aws-credentials@v2
  with:
    aws-region: us-east-1
```

The action uses standard AWS SDK credential resolution.

### Runner Assuming Additional Role

```yaml
- name: Assume Role from Runner
  uses: aws-actions/configure-aws-credentials@v2
  with:
    aws-region: us-east-1
    role-to-assume: arn:aws:iam::123456789100:role/additional-role
```

### Proxy Configuration

For runners behind corporate proxies:

```yaml
- name: Configure AWS with Proxy
  uses: aws-actions/configure-aws-credentials@v2
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: us-east-1
    http-proxy: "http://proxy.company.com:3128"
```

Or set as environment variable:
```yaml
env:
  HTTP_PROXY: "http://proxy.company.com:3128"
```

## Debugging

### OIDC Token Debugger

Use the official debugger to inspect actual token claims:

```yaml
- name: Debug OIDC Token
  uses: github/actions-oidc-debugger@main
  with:
    audience: sts.amazonaws.com
```

This outputs all token claims, helping you craft accurate trust policies.

### Verbose Logging

Enable debug logging in your workflow:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      ACTIONS_STEP_DEBUG: true
    steps:
      # ... your steps
```

Or enable in repository settings: Settings → Secrets and variables → Actions → check "Enable debug logging"

### Verify AWS Identity

Add a verification step to confirm credentials:

```yaml
- name: Verify AWS Identity
  run: |
    aws sts get-caller-identity
    echo "Assumed role ARN: $(aws sts get-caller-identity --query Arn --output text)"
```

## Best Practices

### 1. Minimize Permissions

Only grant `id-token: write` to jobs that need AWS access:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read  # No id-token needed
    steps:
      - run: npm test

  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write  # Only for deployment
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v2
        # ...
```

### 2. Use GitHub Environments

Leverage environments for production deployments:
- Required reviewers for manual approval
- Wait timers for deployment windows
- Branch restrictions for allowed sources

### 3. Pin Action Versions

Use specific version tags, not moving tags:

```yaml
# Good
uses: aws-actions/configure-aws-credentials@v2.1.0

# Acceptable
uses: aws-actions/configure-aws-credentials@v2

# Avoid
uses: aws-actions/configure-aws-credentials@main
```

### 4. Store ARNs in Secrets or Variables

Never hardcode role ARNs:

```yaml
# Good
role-to-assume: ${{ secrets.AWS_ROLE_ARN }}

# Bad
role-to-assume: arn:aws:iam::123456789100:role/MyRole
```

### 5. Use Descriptive Session Names

Include identifying information in session names:

```yaml
role-session-name: GHA-${{ github.repository }}-${{ github.run_id }}
```

### 6. Set Appropriate Timeouts

Prevent hung workflows from holding credentials:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    # ...
```

### 7. Concurrency Controls

Prevent concurrent deployments to the same environment:

```yaml
concurrency:
  group: production-deployment
  cancel-in-progress: false
```

## Security Considerations

### Token Lifetime

OIDC tokens are short-lived (typically 5 minutes) and single-use. They cannot be reused or replayed.

### Audience Validation

Always verify that the audience (`aud`) in your AWS trust policy matches what GitHub Actions sends:
- Standard AWS: `sts.amazonaws.com`
- AWS China: `sts.amazonaws.com.cn`
- AWS GovCloud: `sts.amazonaws-us-gov.com`

### Branch Protection

Combine OIDC with branch protection rules:
- Require pull request reviews
- Require status checks to pass
- Restrict who can push to protected branches

This ensures only approved code can trigger deployments.

### Secrets Management

- Store role ARNs in GitHub Secrets (for sensitive) or Variables (for non-sensitive)
- Use environment-specific secrets for different deployment targets
- Regularly rotate and audit access to secrets

### Monitoring

Monitor workflow executions:
- Review workflow run logs regularly
- Set up notifications for failed deployments
- Monitor AWS CloudTrail for unexpected role assumptions

## Common Issues

### Issue: "Error: Credentials could not be loaded"

**Cause**: Missing `id-token: write` permission

**Solution**: Add required permissions:
```yaml
permissions:
  id-token: write
  contents: read
```

### Issue: "Not authorized to perform sts:AssumeRoleWithWebIdentity"

**Possible Causes**:
1. Subject claim mismatch in AWS trust policy
2. Audience mismatch
3. Missing OIDC provider in AWS

**Solution**: Use the OIDC debugger to inspect actual claims and verify they match your trust policy.

### Issue: Session tagging errors

**Cause**: Workflow or actor names contain invalid characters or are too long

**Solution**: Disable session tagging:
```yaml
role-skip-session-tagging: true
```

### Issue: Credentials expire during long workflows

**Cause**: Default 1-hour duration is insufficient

**Solution**: Increase duration:
```yaml
role-duration-seconds: 7200  # 2 hours
```

Also ensure the IAM role's max session duration allows this.

## Next Steps

- **AWS Setup**: See [AWS OIDC Provider Setup](../../providers/cloud-platforms/aws/oidc-setup.md)
- **Complete Integration**: Follow the [GitHub Actions to AWS Integration Guide](../../guides/github-actions-to-aws.md)
- **Other Cloud Providers**: Check documentation for GCP, Azure, and other providers

## Additional Resources

- [GitHub Docs: Security hardening with OpenID Connect](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [GitHub Docs: Configuring OIDC in AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [aws-actions/configure-aws-credentials Repository](https://github.com/aws-actions/configure-aws-credentials)
- [GitHub Actions OIDC Debugger](https://github.com/github/actions-oidc-debugger)
