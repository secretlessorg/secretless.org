---
sidebar_position: 4
title: Buildkite to AWS Integration Guide
description: Complete step-by-step guide to set up secretless authentication from Buildkite to AWS using OIDC, eliminating the need to store AWS credentials
keywords: [buildkite, aws, oidc, integration guide, secretless, authentication, iam, deployment, ci cd]
---

# Buildkite to AWS Integration Guide

This guide walks you through setting up secretless authentication from Buildkite to AWS using OIDC, eliminating the need to store AWS access keys.

## Overview

By the end of this guide, your Buildkite pipelines will authenticate with AWS using short-lived credentials without storing any long-lived secrets.

**Time Required**: 20-30 minutes

## Prerequisites

### AWS Requirements
- AWS account with administrator access to IAM
- AWS CLI installed and configured
- Understanding of IAM roles and trust policies

### Buildkite Requirements
- Buildkite organization and pipeline
- Buildkite agent version 3.41.0+ (v3.62.0+ recommended)
- Agent with network access to AWS endpoints

### Planning Decisions
- **Which Buildkite pipelines** need AWS access
- **Which AWS services** workflows need to access
- **Which branches/steps** should be allowed to deploy
- **AWS region(s)** for operations

## Step 1: Create AWS OIDC Identity Provider

### Using AWS Console

1. Navigate to **IAM → Identity Providers → Add Provider**
2. Select **OpenID Connect**
3. **Provider URL**: `https://agent.buildkite.com`
4. **Audience**: `sts.amazonaws.com`
5. Click **Add Provider**

### Using AWS CLI

```bash
aws iam create-open-id-connect-provider \
  --url https://agent.buildkite.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### Verify Provider Creation

```bash
aws iam list-open-id-connect-providers
```

Expected output includes:
```
arn:aws:iam::<ACCOUNT_ID>:oidc-provider/agent.buildkite.com
```

Save this ARN for the next steps.

## Step 2: Determine Subject Claim Pattern

The subject claim uniquely identifies your Buildkite pipeline. The pattern is:

```
organization:ORG_SLUG:pipeline:PIPELINE_SLUG:ref:REF:commit:COMMIT:step:STEP_KEY
```

### Find Your Organization and Pipeline Slugs

1. **Organization Slug**: Found in your Buildkite URL
   - Example: `https://buildkite.com/acme-inc/...` → `acme-inc`

2. **Pipeline Slug**: Found in pipeline settings
   - Example: `https://buildkite.com/acme-inc/super-app/...` → `super-app`

### Choose Subject Pattern Security Level

| Security Level | Pattern | Use Case |
|----------------|---------|----------|
| **Highest** | `organization:acme:pipeline:production:ref:refs/heads/main:commit:*:step:deploy` | Specific pipeline, branch, and step |
| **High** | `organization:acme:pipeline:production:*` | Specific pipeline, any build |
| **Medium** | `organization:acme:*` | Any pipeline in organization |

**Recommendation**: Start with a specific pattern and use wildcards only where necessary.

## Step 3: Create IAM Trust Policy

Create a file named `trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/agent.buildkite.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "agent.buildkite.com:sub": "organization:acme-inc:pipeline:super-app:*"
        },
        "StringEquals": {
          "agent.buildkite.com:aud": "sts.amazonaws.com"
        }
      }
    }
  ]
}
```

**Replace**:
- `<ACCOUNT_ID>` - Your AWS account ID
- `acme-inc` - Your Buildkite organization slug
- `super-app` - Your pipeline slug

### Advanced Trust Policy with Session Tags

For enhanced security, use session tags (requires agent v3.83.0+):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/agent.buildkite.com"
      },
      "Action": [
        "sts:AssumeRoleWithWebIdentity",
        "sts:TagSession"
      ],
      "Condition": {
        "StringLike": {
          "agent.buildkite.com:sub": "organization:acme-inc:*"
        },
        "StringEquals": {
          "agent.buildkite.com:aud": "sts.amazonaws.com",
          "aws:RequestTag/organization_slug": "acme-inc",
          "aws:RequestTag/pipeline_slug": "super-app"
        }
      }
    }
  ]
}
```

## Step 4: Create IAM Permissions Policy

Create `permissions-policy.json` with least-privilege permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::my-deployment-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::my-deployment-bucket"
    }
  ]
}
```

## Step 5: Create IAM Role

```bash
# Create the role
aws iam create-role \
  --role-name BuildkiteDeployRole \
  --assume-role-policy-document file://trust-policy.json \
  --description "Role for Buildkite deployments" \
  --max-session-duration 3600

# Attach permissions policy
aws iam put-role-policy \
  --role-name BuildkiteDeployRole \
  --policy-name DeploymentPermissions \
  --policy-document file://permissions-policy.json

# Get the role ARN (save this!)
aws iam get-role \
  --role-name BuildkiteDeployRole \
  --query 'Role.Arn' \
  --output text
```

Save the role ARN: `arn:aws:iam::123456789012:role/BuildkiteDeployRole`

## Step 6: Create Buildkite Pipeline

Create `pipeline.yml` in your repository:

```yaml
steps:
  - label: ":aws: Deploy to AWS"
    command: |
      # Verify AWS authentication
      aws sts get-caller-identity

      # Deploy to S3
      aws s3 sync ./dist s3://my-deployment-bucket
    plugins:
      - aws-assume-role-with-web-identity#v1.4.0:
          role-arn: arn:aws:iam::123456789012:role/BuildkiteDeployRole
```

### With Session Tags

```yaml
steps:
  - label: ":aws: Deploy with Session Tags"
    command: |
      aws sts get-caller-identity
      aws ssm get-parameter --name /app/config
    plugins:
      - aws-assume-role-with-web-identity#v1.4.0:
          role-arn: arn:aws:iam::123456789012:role/BuildkiteDeployRole
          role-session-name: "buildkite-${BUILDKITE_BUILD_NUMBER}"
          role-session-duration: 3600
          session-tags:
            - organization_slug
            - organization_id
            - pipeline_slug
            - pipeline_id
            - build_branch
          region: us-west-2
```

### Multiple AWS Accounts

```yaml
steps:
  - label: ":aws: Deploy to Dev"
    command: |
      aws sts get-caller-identity
      ./deploy.sh dev
    plugins:
      - aws-assume-role-with-web-identity#v1.4.0:
          role-arn: arn:aws:iam::111111111111:role/BuildkiteDevRole
          region: us-east-1

  - wait

  - label: ":aws: Deploy to Prod"
    command: |
      aws sts get-caller-identity
      ./deploy.sh prod
    branches: main
    plugins:
      - aws-assume-role-with-web-identity#v1.4.0:
          role-arn: arn:aws:iam::222222222222:role/BuildkiteProdRole
          region: us-west-2
```

## Step 7: Configure Buildkite Pipeline

### Using Buildkite UI

1. Navigate to your pipeline
2. Click **Pipeline Settings**
3. Update **Steps** with your `pipeline.yml` content
4. Save changes

### Using Pipeline Upload

Add to your repository's `.buildkite/pipeline.yml`:

```yaml
steps:
  - label: ":pipeline: Upload Pipeline"
    command: buildkite-agent pipeline upload .buildkite/pipeline.yml
```

## Step 8: Test the Integration

### Trigger a Build

1. Commit and push your changes
2. Navigate to **Buildkite → Your Pipeline**
3. Click **New Build**
4. Monitor the build progress

### Verify Success

Look for these indicators in the build logs:

```
Assuming role: arn:aws:iam::123456789012:role/BuildkiteDeployRole
Successfully assumed role
{
  "UserId": "AROA...:buildkite-1234",
  "Account": "123456789012",
  "Arn": "arn:aws:sts::123456789012:assumed-role/BuildkiteDeployRole/buildkite-1234"
}
```

## Step 9: Verify in AWS CloudTrail

```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRoleWithWebIdentity \
  --max-results 5 \
  --query 'Events[0].CloudTrailEvent' \
  --output text | jq .
```

Verify:
- `userAgent` contains "Buildkite"
- `requestParameters.roleArn` matches your role
- `requestParameters.roleSessionName` matches your build
- Event occurred at expected time

## Step 10: Production Hardening

### Branch Protection

Restrict production deployments to specific branches:

```yaml
steps:
  - label: ":aws: Deploy to Production"
    branches: main
    command: |
      ./deploy-production.sh
    plugins:
      - aws-assume-role-with-web-identity#v1.4.0:
          role-arn: arn:aws:iam::123456789012:role/BuildkiteProdRole
```

### Manual Approval

Add manual gates for production:

```yaml
steps:
  - block: ":rocket: Deploy to Production?"
    prompt: "Ready to deploy to production?"
    branches: main

  - label: ":aws: Production Deployment"
    branches: main
    command: |
      ./deploy-production.sh
    plugins:
      - aws-assume-role-with-web-identity#v1.4.0:
          role-arn: arn:aws:iam::123456789012:role/BuildkiteProdRole
```

### Separate Roles by Environment

Create different IAM roles:
- `BuildkiteDevRole` - Development deployments
- `BuildkiteStagingRole` - Staging deployments
- `BuildkiteProdRole` - Production deployments

Each with appropriate permissions and trust policies.

### Enable CloudWatch Alerts

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name buildkite-role-assumptions \
  --alarm-description "Alert on high volume of Buildkite role assumptions" \
  --metric-name AssumeRoleWithWebIdentity \
  --namespace AWS/IAM \
  --statistic Sum \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:alerts
```

## Troubleshooting

### Error: "BUILDKITE_AGENT_JOB_API_SOCKET empty or undefined"

**Cause**: Agent version too old or job API unavailable

**Solution**:

```bash
# Verify agent version
buildkite-agent --version

# Upgrade to v3.62.0+
# For Docker:
# Use image: buildkite/agent:3.62.0
```

### Error: "Not authorized to perform sts:AssumeRoleWithWebIdentity"

**Causes**:
1. Subject claim mismatch
2. Audience mismatch
3. OIDC provider not configured

**Solutions**:

1. **Debug token claims**:
```yaml
steps:
  - label: ":mag: Debug OIDC Token"
    command: |
      TOKEN=$(buildkite-agent oidc request-token --audience sts.amazonaws.com)
      echo $TOKEN | cut -d. -f2 | base64 -d | jq .
```

2. **Verify trust policy**:
```bash
aws iam get-role --role-name BuildkiteDeployRole --query 'Role.AssumeRolePolicyDocument'
```

3. **Check OIDC provider**:
```bash
aws iam get-open-id-connect-provider \
  --open-id-connect-provider-arn arn:aws:iam::ACCOUNT:oidc-provider/agent.buildkite.com
```

### Error: "Token rejected"

**Cause**: Incorrect trust policy format

**Solution**:

Ensure using colon notation:
```json
{
  "Condition": {
    "StringLike": {
      "agent.buildkite.com:sub": "organization:acme:*"
    },
    "StringEquals": {
      "agent.buildkite.com:aud": "sts.amazonaws.com"
    }
  }
}
```

NOT dot notation: `agent.buildkite.com.sub`

### Session Tags Not Appearing

**Causes**:
1. Agent version < 3.83.0
2. Missing `sts:TagSession` permission in trust policy

**Solutions**:

1. **Update agent**:
```dockerfile
FROM buildkite/agent:3.83.0
```

2. **Update trust policy**:
```json
{
  "Action": [
    "sts:AssumeRoleWithWebIdentity",
    "sts:TagSession"
  ]
}
```

## Advanced Patterns

### Docker Build and Push to ECR

```yaml
steps:
  - label: ":docker: Build and Push to ECR"
    command: |
      # Login to ECR
      aws ecr get-login-password --region us-east-1 | \
        docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

      # Build and tag
      docker build -t myapp:${BUILDKITE_COMMIT} .
      docker tag myapp:${BUILDKITE_COMMIT} \
        123456789012.dkr.ecr.us-east-1.amazonaws.com/myapp:${BUILDKITE_COMMIT}

      # Push
      docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/myapp:${BUILDKITE_COMMIT}
    plugins:
      - docker#v5.8.0:
          mount-buildkite-agent: true
      - aws-assume-role-with-web-identity#v1.4.0:
          role-arn: arn:aws:iam::123456789012:role/BuildkiteECRRole
          region: us-east-1
```

### Terraform Deployment

```yaml
steps:
  - label: ":terraform: Plan Infrastructure"
    command: |
      cd terraform/
      terraform init
      terraform plan -out=tfplan
    artifact_paths:
      - "terraform/tfplan"
    plugins:
      - aws-assume-role-with-web-identity#v1.4.0:
          role-arn: arn:aws:iam::123456789012:role/BuildkiteTerraformRole

  - block: ":rocket: Apply Terraform?"
    prompt: "Review plan and approve?"
    branches: main

  - label: ":terraform: Apply Infrastructure"
    branches: main
    command: |
      cd terraform/
      buildkite-agent artifact download terraform/tfplan .
      terraform apply tfplan
    plugins:
      - aws-assume-role-with-web-identity#v1.4.0:
          role-arn: arn:aws:iam::123456789012:role/BuildkiteTerraformRole
```

### Lambda Deployment

```yaml
steps:
  - label: ":lambda: Deploy Lambda Function"
    command: |
      # Package function
      zip -r function.zip index.js node_modules/

      # Update function code
      aws lambda update-function-code \
        --function-name my-function \
        --zip-file fileb://function.zip

      # Publish new version
      aws lambda publish-version --function-name my-function
    plugins:
      - aws-assume-role-with-web-identity#v1.4.0:
          role-arn: arn:aws:iam::123456789012:role/BuildkiteLambdaRole
          region: us-east-1
```

### CloudFormation Stack Deployment

```yaml
steps:
  - label: ":cloudformation: Deploy Stack"
    command: |
      aws cloudformation deploy \
        --template-file template.yaml \
        --stack-name my-stack \
        --parameter-overrides Environment=production \
        --capabilities CAPABILITY_IAM \
        --no-fail-on-empty-changeset
    plugins:
      - aws-assume-role-with-web-identity#v1.4.0:
          role-arn: arn:aws:iam::123456789012:role/BuildkiteCFNRole
```

## Security Best Practices

### 1. Use Immutable IDs

Prefer `organization_id` and `pipeline_id` over slugs in session tags:

```yaml
session-tags:
  - organization_id  # Immutable UUID
  - pipeline_id      # Immutable UUID
```

### 2. Specific Subject Patterns

```json
// Good
"agent.buildkite.com:sub": "organization:acme:pipeline:production:ref:refs/heads/main:*"

// Better with session tag validation
"aws:RequestTag/pipeline_id": "uuid-of-pipeline"
```

### 3. Least Privilege IAM Policies

Grant only necessary permissions:

```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::deployment-bucket/app1/*"
    }
  ]
}
```

### 4. Short Session Durations

```yaml
plugins:
  - aws-assume-role-with-web-identity#v1.4.0:
      role-arn: arn:aws:iam::123456789012:role/BuildkiteRole
      role-session-duration: 900  # 15 minutes
```

### 5. Monitor CloudTrail

Query Buildkite-initiated AWS calls:

```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=BuildkiteDeployRole \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --query 'Events[].{Time:EventTime, Event:EventName, User:Username}' \
  --output table
```

## Complete Terraform Example

```hcl
variable "buildkite_org_slug" {
  description = "Buildkite Organization Slug"
  type        = string
}

variable "buildkite_pipeline_slug" {
  description = "Buildkite Pipeline Slug"
  type        = string
}

data "aws_caller_identity" "current" {}

# OIDC Provider
resource "aws_iam_openid_connect_provider" "buildkite" {
  url             = "https://agent.buildkite.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# IAM Role
resource "aws_iam_role" "buildkite" {
  name = "BuildkiteDeployRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.buildkite.arn
        }
        Action = [
          "sts:AssumeRoleWithWebIdentity",
          "sts:TagSession"
        ]
        Condition = {
          StringLike = {
            "agent.buildkite.com:sub" = "organization:${var.buildkite_org_slug}:pipeline:${var.buildkite_pipeline_slug}:*"
          }
          StringEquals = {
            "agent.buildkite.com:aud"                = "sts.amazonaws.com"
            "aws:RequestTag/organization_slug"       = var.buildkite_org_slug
            "aws:RequestTag/pipeline_slug"           = var.buildkite_pipeline_slug
          }
        }
      }
    ]
  })

  max_session_duration = 3600
}

# IAM Policy
resource "aws_iam_role_policy" "buildkite_deployment" {
  name = "DeploymentPermissions"
  role = aws_iam_role.buildkite.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "arn:aws:s3:::my-deployment-bucket/*"
      },
      {
        Effect = "Allow"
        Action   = "s3:ListBucket"
        Resource = "arn:aws:s3:::my-deployment-bucket"
      }
    ]
  })
}

# Outputs
output "role_arn" {
  description = "ARN of the IAM role for Buildkite"
  value       = aws_iam_role.buildkite.arn
}

output "instructions" {
  description = "Setup instructions"
  value       = <<-EOT
    Add this to your Buildkite pipeline:

    plugins:
      - aws-assume-role-with-web-identity#v1.4.0:
          role-arn: ${aws_iam_role.buildkite.arn}
  EOT
}
```

## Next Steps

- **Learn more about Buildkite**: [Buildkite Initiator Documentation](../initiators/ci-tools/buildkite.md)
- **AWS deep dive**: [AWS OIDC Provider Setup](../providers/cloud-platforms/aws/oidc-setup.md)
- **Other integrations**: Explore GCP and Azure integrations

## Additional Resources

- [Buildkite OIDC Documentation](https://buildkite.com/docs/pipelines/security/oidc)
- [AWS Assume Role Plugin](https://github.com/buildkite-plugins/aws-assume-role-with-web-identity-buildkite-plugin)
- [buildkite-agent OIDC CLI](https://buildkite.com/docs/agent/v3/cli-oidc)

## Conclusion

You now have a fully functional secretless authentication setup between Buildkite and AWS using OIDC. This eliminates the security risks of storing AWS access keys while providing seamless deployment automation.

**Key Benefits**:
- ✅ No AWS credentials stored in Buildkite
- ✅ Automatic credential rotation (1-hour default)
- ✅ Fine-grained access control via IAM policies
- ✅ Full audit trail via CloudTrail
- ✅ Enhanced security with session tags
- ✅ Improved security posture
