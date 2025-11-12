---
sidebar_position: 1
title: GitHub Actions to AWS Integration Guide
description: Complete step-by-step guide to set up secretless authentication from GitHub Actions to AWS using OIDC, eliminating the need to store AWS credentials
keywords: [github actions, aws, oidc, integration guide, secretless, authentication, iam, deployment, ci cd]
---

# GitHub Actions to AWS Integration Guide

This guide walks you through setting up secretless authentication from GitHub Actions to AWS using OpenID Connect (OIDC), eliminating the need to store AWS access keys in GitHub.

## Overview

By the end of this guide, your GitHub Actions workflows will be able to authenticate with AWS using short-lived credentials without storing any long-lived secrets. The setup involves:

1. Creating an OIDC provider in AWS
2. Creating an IAM role with appropriate trust and permissions policies
3. Configuring your GitHub Actions workflow
4. Testing and verifying the integration
5. Hardening for production use

**Time Required**: 15-30 minutes

## Prerequisites

### AWS Requirements
- AWS account with administrator access to IAM
- AWS CLI installed and configured (optional, but recommended)
- Understanding of IAM roles and policies

### GitHub Requirements
- Repository with GitHub Actions enabled
- Admin access to repository settings
- Basic understanding of GitHub Actions workflow syntax

### Planning Decisions
Before starting, determine:
- **Which repositories** need AWS access
- **Which AWS services** workflows need to access
- **Which branches/environments** should be allowed to deploy
- **AWS region(s)** for operations

## Step 1: Create AWS OIDC Identity Provider

The OIDC Identity Provider must be created once per AWS account and can be reused across multiple roles.

### Using AWS Console

1. Navigate to **AWS Console → IAM → Identity Providers**
2. Click **Add Provider**
3. Select **OpenID Connect**
4. Enter the following:
   - **Provider URL**: `https://token.actions.githubusercontent.com`
   - **Audience**: `sts.amazonaws.com`
5. Click **Add Provider**

### Using AWS CLI

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### Verify Provider Creation

```bash
aws iam list-open-id-connect-providers
```

Expected output includes:
```
arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com
```

Save this ARN for the next steps.

## Step 2: Determine Subject Claim Pattern

The subject claim determines which GitHub contexts can assume your AWS role. Choose based on your security requirements:

| Security Level | Subject Pattern | Use Case |
|----------------|----------------|----------|
| **Highest** | `repo:myorg/myrepo:ref:refs/heads/main` | Production deployments from main branch only |
| **High** | `repo:myorg/myrepo:environment:production` | Deployments through GitHub Environment |
| **Medium** | `repo:myorg/myrepo:*` | Any workflow in a specific repository |
| **Lower** | `repo:myorg/*:*` | Any workflow in organization (use sparingly) |

**Recommendation**: Start with the most restrictive pattern that meets your needs.

**Example**: For production deployments from the `main` branch of `myorg/myrepo`:
```
repo:myorg/myrepo:ref:refs/heads/main
```

## Step 3: Create IAM Trust Policy

Create a file named `trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:<ORG>/<REPO>:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

**Replace**:
- `<ACCOUNT_ID>` - Your AWS account ID (12 digits)
- `<ORG>` - Your GitHub organization name
- `<REPO>` - Your repository name

**For multiple branches or environments**, use `StringLike` with an array:

```json
{
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
    },
    "StringLike": {
      "token.actions.githubusercontent.com:sub": [
        "repo:myorg/myrepo:ref:refs/heads/main",
        "repo:myorg/myrepo:ref:refs/heads/develop",
        "repo:myorg/myrepo:environment:production"
      ]
    }
  }
}
```

## Step 4: Create IAM Permissions Policy

Create a file named `permissions-policy.json` with the minimum permissions needed.

**Example for S3 deployment**:

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

**Example for EC2 deployments**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:RebootInstances"
      ],
      "Resource": "arn:aws:ec2:*:*:instance/*",
      "Condition": {
        "StringEquals": {
          "aws:ResourceTag/Environment": "production"
        }
      }
    }
  ]
}
```

**Principle**: Grant only the minimum permissions required for your workflow to function.

## Step 5: Create IAM Role

### Using AWS CLI

```bash
# Create the role with trust policy
aws iam create-role \
  --role-name GitHubActionsDeployRole \
  --assume-role-policy-document file://trust-policy.json \
  --description "Role for GitHub Actions deployments" \
  --max-session-duration 3600

# Attach inline permissions policy
aws iam put-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-name DeploymentPermissions \
  --policy-document file://permissions-policy.json

# Alternatively, attach managed policy
# aws iam attach-role-policy \
#   --role-name GitHubActionsDeployRole \
#   --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess

# Get the role ARN (save this!)
aws iam get-role \
  --role-name GitHubActionsDeployRole \
  --query 'Role.Arn' \
  --output text
```

### Using AWS Console

1. Navigate to **IAM → Roles → Create role**
2. Select **Web identity**
3. Choose **Identity provider**: `token.actions.githubusercontent.com`
4. Choose **Audience**: `sts.amazonaws.com`
5. Click **Next**
6. Skip policy selection for now, click **Next**
7. Enter **Role name**: `GitHubActionsDeployRole`
8. Click **Create role**
9. Open the newly created role
10. Click **Trust relationships → Edit trust policy**
11. Paste your trust policy JSON
12. Click **Update policy**
13. Go to **Permissions → Add permissions → Create inline policy**
14. Paste your permissions policy JSON
15. Click **Review policy**, name it, and create

**Save the Role ARN** (e.g., `arn:aws:iam::123456789100:role/GitHubActionsDeployRole`)

## Step 6: Store Role ARN in GitHub

### As a Secret (Recommended for Sensitive Information)

1. Navigate to your repository on GitHub
2. Go to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. **Name**: `AWS_ROLE_ARN`
5. **Value**: Paste the role ARN (e.g., `arn:aws:iam::123456789100:role/GitHubActionsDeployRole`)
6. Click **Add secret**

### As a Variable (For Non-Sensitive Information)

1. Navigate to your repository on GitHub
2. Go to **Settings → Secrets and variables → Actions → Variables**
3. Click **New repository variable**
4. **Name**: `AWS_ROLE_ARN`
5. **Value**: Paste the role ARN
6. Click **Add variable**

**Note**: Role ARNs are not sensitive, but using Secrets provides consistency if you also store other AWS-related values.

## Step 7: Create GitHub Actions Workflow

Create `.github/workflows/deploy-aws.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]
  workflow_dispatch:

# Required for OIDC authentication
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
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1
          role-session-name: GitHubActions-${{ github.run_id }}

      - name: Verify AWS Identity
        run: |
          aws sts get-caller-identity
          echo "Successfully authenticated with AWS!"

      - name: Deploy to S3
        run: |
          echo "Deploying application..."
          # Example: aws s3 sync ./dist s3://my-deployment-bucket
```

**Key Points**:
- `permissions: id-token: write` is required for OIDC
- Use the official `aws-actions/configure-aws-credentials@v2` action
- Reference the role ARN from secrets: `${{ secrets.AWS_ROLE_ARN }}`
- Set appropriate AWS region

## Step 8: Test the Integration

### Commit and Push

```bash
git add .github/workflows/deploy-aws.yml
git commit -m "Add AWS OIDC authentication workflow"
git push origin main
```

### Monitor Workflow Execution

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Click on the running workflow
4. Expand each step to view output

### Verify Success

Look for these indicators:
- ✅ "Configure AWS Credentials" step completes successfully
- ✅ "Verify AWS Identity" step shows assumed role ARN
- ✅ No authentication errors in subsequent AWS commands

**Example successful output**:
```
{
  "UserId": "AROA...:GitHubActions-1234567890",
  "Account": "123456789100",
  "Arn": "arn:aws:sts::123456789100:assumed-role/GitHubActionsDeployRole/GitHubActions-1234567890"
}
Successfully authenticated with AWS!
```

## Step 9: Verify in AWS CloudTrail

Check AWS CloudTrail to confirm the role assumption:

```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRoleWithWebIdentity \
  --max-results 5 \
  --query 'Events[0].CloudTrailEvent' \
  --output text | jq .
```

Verify:
- `userAgent` contains "GitHub-Actions"
- `requestParameters.roleArn` matches your role
- `requestParameters.roleSessionName` matches your workflow
- Event occurred at the expected time

## Step 10: Production Hardening

### Create GitHub Environment

1. Navigate to **Settings → Environments**
2. Click **New environment**
3. Name: `production`
4. Configure protection rules:
   - **Required reviewers**: Add team members who must approve deployments
   - **Wait timer**: Optional delay before deployment
   - **Deployment branches**: Limit to specific branches (e.g., `main`)
5. Click **Save protection rules**

### Update Trust Policy for Environment

When using GitHub Environments, the subject claim changes. Update your trust policy:

```json
{
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
    },
    "StringLike": {
      "token.actions.githubusercontent.com:sub": [
        "repo:myorg/myrepo:ref:refs/heads/main",
        "repo:myorg/myrepo:environment:production"
      ]
    }
  }
}
```

Update the role:

```bash
aws iam update-assume-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-document file://trust-policy-updated.json
```

### Update Workflow to Use Environment

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Adds approval requirement
    permissions:
      id-token: write
      contents: read
    steps:
      # ... rest of workflow
```

Now deployments to production require manual approval from designated reviewers.

### Enable CloudWatch Alerts

Create alerts for suspicious activity:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name github-actions-role-assumptions \
  --alarm-description "Alert on high volume of role assumptions" \
  --metric-name AssumeRoleWithWebIdentity \
  --namespace AWS/IAM \
  --statistic Sum \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:123456789100:alerts
```

### Set Up Branch Protection

1. Navigate to **Settings → Branches**
2. Add rule for `main` branch:
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date
   - Include administrators

This ensures only reviewed code can trigger deployments.

## Troubleshooting

### Error: "Credentials could not be loaded"

**Cause**: Missing `id-token: write` permission

**Solution**: Add to your workflow:
```yaml
permissions:
  id-token: write
  contents: read
```

### Error: "Not authorized to perform sts:AssumeRoleWithWebIdentity"

**Possible Causes**:
1. **Subject claim mismatch**: Trust policy doesn't match actual workflow context
2. **Audience mismatch**: Different audience values in AWS and GitHub Actions
3. **OIDC provider missing**: Provider not created in AWS account

**Debug Steps**:

1. Add OIDC debugger to workflow:
```yaml
- name: Debug OIDC Token
  uses: github/actions-oidc-debugger@main
  with:
    audience: sts.amazonaws.com
```

2. Compare token claims with trust policy
3. Update trust policy to match actual claims

### Error: "Session tags contain invalid characters"

**Cause**: Workflow or actor names have special characters

**Solution**: Disable session tagging:
```yaml
- uses: aws-actions/configure-aws-credentials@v2
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: us-east-1
    role-skip-session-tagging: true
```

### Credentials Expire Mid-Workflow

**Cause**: Workflow runs longer than 1-hour default duration

**Solution**: Increase session duration:

1. Update workflow:
```yaml
- uses: aws-actions/configure-aws-credentials@v2
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: us-east-1
    role-duration-seconds: 7200  # 2 hours
```

2. Update IAM role max duration:
```bash
aws iam update-role \
  --role-name GitHubActionsDeployRole \
  --max-session-duration 7200
```

### Role Assumed from Unexpected Repository

**Cause**: Trust policy too permissive (e.g., `repo:myorg/*:*`)

**Solution**: Restrict to specific repository in trust policy:
```json
{
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:sub": "repo:myorg/myrepo:ref:refs/heads/main"
    }
  }
}
```

## Advanced Patterns

### Multi-Environment Deployment

```yaml
name: Deploy to Multiple Environments

on:
  push:
    branches: [main, develop]

permissions:
  id-token: write
  contents: read

jobs:
  deploy-dev:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: development
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_DEV }}
          aws-region: us-east-1
      - run: ./deploy.sh dev

  deploy-prod:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_PROD }}
          aws-region: us-east-1
      - run: ./deploy.sh prod
```

### Docker Build and Push to ECR

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/my-app:$IMAGE_TAG .
          docker tag $ECR_REGISTRY/my-app:$IMAGE_TAG $ECR_REGISTRY/my-app:latest
          docker push $ECR_REGISTRY/my-app:$IMAGE_TAG
          docker push $ECR_REGISTRY/my-app:latest
```

### Terraform Deployment

```yaml
jobs:
  terraform:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.6.0

      - uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_TERRAFORM_ROLE }}
          aws-region: us-east-1

      - name: Terraform Init
        run: terraform init

      - name: Terraform Plan
        id: plan
        run: terraform plan -out=tfplan

      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        run: terraform apply -auto-approve tfplan
```

## Security Best Practices

### 1. Principle of Least Privilege

- Grant only necessary AWS permissions
- Restrict trust policy to specific branches/environments
- Use separate roles for different environments

### 2. Use GitHub Environments

- Require manual approval for production
- Limit deployment branches
- Set up environment-specific secrets

### 3. Monitor and Audit

- Enable AWS CloudTrail logging
- Set up CloudWatch alerts for suspicious activity
- Regularly review role assumptions
- Use AWS Config to monitor IAM changes

### 4. Session Management

- Keep session durations as short as practical (default 1 hour)
- Use descriptive session names for tracking
- Enable session tagging for accountability

### 5. Branch Protection

- Require pull request reviews
- Require status checks to pass
- Restrict who can push to deployment branches

### 6. Secrets Management

- Store role ARNs in GitHub Secrets/Variables
- Use environment-specific secrets
- Never commit AWS credentials to repository
- Rotate credentials if accidentally exposed

### 7. Network Security

- For self-hosted runners, use VPC endpoints
- Consider IP-based restrictions in trust policies (self-hosted only)
- Use AWS PrivateLink where applicable

## Next Steps

### Further Reading

- [AWS Provider Documentation](../providers/cloud-platforms/aws/oidc-setup.md) - Detailed AWS configuration
- [GitHub Actions Documentation](../initiators/ci-tools/github-actions.md) - Advanced workflow patterns
- [AWS Security Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

### Expand Your Setup

1. **Add More Repositories**: Reuse the OIDC provider with new roles
2. **Multi-Region Deployment**: Deploy to multiple AWS regions
3. **Cross-Account Access**: Deploy to different AWS accounts
4. **Additional Services**: Add support for more AWS services

### Monitoring and Maintenance

- Set up dashboard for deployment metrics
- Create runbooks for common issues
- Schedule regular security audits
- Document your specific setup for your team

## Conclusion

You now have a fully functional secretless authentication setup between GitHub Actions and AWS using OIDC. This eliminates the security risks associated with storing long-lived AWS credentials while providing seamless deployment automation.

**Key Benefits**:
- ✅ No long-lived credentials stored in GitHub
- ✅ Automatic credential rotation (1-hour default)
- ✅ Fine-grained access control via IAM policies
- ✅ Full audit trail via CloudTrail
- ✅ Improved security posture

If you encounter any issues, refer to the troubleshooting section or consult the detailed provider and initiator documentation.
