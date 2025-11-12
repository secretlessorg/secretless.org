---
sidebar_position: 5
title: Terraform Cloud → AWS
description: Configure AWS to accept OIDC authentication from Terraform Cloud for secretless deployments
slug: /guides/terraform-cloud-to-aws
keywords: [aws, terraform cloud, hcp terraform, oidc, iam, dynamic credentials, secretless]
---

# Configure AWS for Terraform Cloud Authentication

This guide shows you how to configure AWS to accept OIDC authentication from Terraform Cloud (HCP Terraform), eliminating the need to store AWS access keys in your workspaces.

## Prerequisites

- AWS account with IAM permissions
- Terraform Cloud organization and workspace
- Self-hosted agents require v1.12.0 or later (if applicable)

## Architecture Overview

```
┌─────────────────────┐                    ┌──────────────┐
│  Terraform Cloud    │   OIDC Token       │     AWS      │
│     Workspace       │───────────────────>│  IAM OIDC    │
│                     │                    │   Provider   │
└─────────────────────┘                    └──────────────┘
         │                                        │
         │                                        ▼
         │                                 Token Validation
         │                                        │
         │                                        ▼
         │                                ┌──────────────┐
         │                                │  IAM Role    │
         │                                │  Trust Policy│
         │                                └──────────────┘
         │                                        │
         │                                        ▼
         └────────────────────────────────> Temporary
                AWS Credentials              Credentials
```

## Step 1: Create OIDC Identity Provider

Create an OIDC identity provider in AWS that trusts Terraform Cloud.

### Using AWS Console

1. Navigate to **IAM → Identity Providers → Add Provider**
2. Select **OpenID Connect**
3. **Provider URL**: `https://app.terraform.io` (no trailing slash)
4. **Audience**: `aws.workload.identity`
5. Click **Add provider**

### Using AWS CLI

```bash
aws iam create-open-id-connect-provider \
  --url https://app.terraform.io \
  --client-id-list aws.workload.identity
```

For **Terraform Enterprise** (self-hosted), replace the URL with your instance:

```bash
aws iam create-open-id-connect-provider \
  --url https://terraform.example.com \
  --client-id-list aws.workload.identity
```

### Verify Provider Creation

```bash
aws iam list-open-id-connect-providers
```

Expected output:
```
arn:aws:iam::<ACCOUNT_ID>:oidc-provider/app.terraform.io
```

## Step 2: Create IAM Role with Trust Policy

### Trust Policy Structure

Create a trust policy that specifies which Terraform Cloud workspaces can assume the role:

**trust-policy.json**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/app.terraform.io"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "app.terraform.io:aud": "aws.workload.identity"
        },
        "StringLike": {
          "app.terraform.io:sub": "organization:<ORG_NAME>:project:<PROJECT_NAME>:workspace:<WORKSPACE_NAME>:run_phase:*"
        }
      }
    }
  ]
}
```

Replace:
- `<ACCOUNT_ID>` - Your AWS account ID
- `<ORG_NAME>` - Your Terraform Cloud organization name
- `<PROJECT_NAME>` - Your Terraform Cloud project name
- `<WORKSPACE_NAME>` - Your Terraform Cloud workspace name

:::warning Security Critical
**Always validate the audience and organization name** to prevent unauthorized access from other HCP Terraform organizations.

Never use:
```json
// ❌ INSECURE - allows any organization
"app.terraform.io:sub": "organization:*:*"
```
:::

### Subject Claim Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| Specific workspace | Single workspace access | `organization:acme:project:infra:workspace:prod:run_phase:*` |
| All workspaces in project | Project-level access | `organization:acme:project:infra:workspace:*:run_phase:*` |
| All workspaces in org | Organization-wide | `organization:acme:project:*:workspace:*:run_phase:*` |
| Plan phase only | Read-only access | `organization:acme:project:infra:workspace:prod:run_phase:plan` |
| Apply phase only | Write access | `organization:acme:project:infra:workspace:prod:run_phase:apply` |

### Create Permissions Policy

Define what AWS operations the role can perform:

**permissions-policy.json**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::my-terraform-state",
        "arn:aws:s3:::my-terraform-state/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "ec2:CreateTags",
        "ec2:RunInstances",
        "ec2:TerminateInstances"
      ],
      "Resource": "*"
    }
  ]
}
```

:::tip Least Privilege
Grant only the minimum permissions required for your Terraform operations. Avoid using managed policies like `AdministratorAccess`.
:::

### Create the IAM Role

```bash
# Create the role
aws iam create-role \
  --role-name TerraformCloudRole \
  --assume-role-policy-document file://trust-policy.json \
  --description "Role for Terraform Cloud workspace deployments" \
  --max-session-duration 3600

# Attach permissions policy
aws iam put-role-policy \
  --role-name TerraformCloudRole \
  --policy-name TerraformPermissions \
  --policy-document file://permissions-policy.json

# Get the role ARN (save for workspace configuration)
aws iam get-role \
  --role-name TerraformCloudRole \
  --query 'Role.Arn' \
  --output text
```

## Step 3: Configure Terraform Cloud Workspace

Add environment variables to your Terraform Cloud workspace to enable dynamic credentials.

### Required Variables

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `TFC_AWS_PROVIDER_AUTH` | `true` | Enable dynamic credentials |
| `TFC_AWS_RUN_ROLE_ARN` | `arn:aws:iam::123456789012:role/TerraformCloudRole` | IAM role ARN from Step 2 |

### Optional Variables

| Variable Name | Value | Use Case |
|---------------|-------|----------|
| `TFC_AWS_WORKLOAD_IDENTITY_AUDIENCE` | `aws.workload.identity` | Custom audience (must match trust policy) |
| `TFC_AWS_PLAN_ROLE_ARN` | `arn:aws:iam::...:role/TFCPlanRole` | Separate role for plan operations |
| `TFC_AWS_APPLY_ROLE_ARN` | `arn:aws:iam::...:role/TFCApplyRole` | Separate role for apply operations |

:::info Variable Sets
Configure these variables in a **Variable Set** to reuse across multiple workspaces.
:::

## Step 4: Configure Terraform AWS Provider

Update your Terraform configuration to use dynamic credentials. **Do not** hardcode `access_key` or `secret_key`:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"

  # Do NOT set access_key or secret_key
  # Terraform Cloud automatically configures credentials
}

# Use AWS resources normally
resource "aws_s3_bucket" "example" {
  bucket = "my-terraform-bucket"
}
```

:::warning Provider Configuration
Terraform Cloud sets `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_SESSION_TOKEN` environment variables automatically. Do not configure these manually.
:::

## Step 5: Verify Configuration

### Test Plan

Queue a plan in your Terraform Cloud workspace:

1. Navigate to your workspace in Terraform Cloud
2. Click **Actions → Start new plan**
3. Check the run logs for successful authentication

Expected log output:
```
Initializing AWS provider...
AWS provider configured with dynamic credentials
```

### Test Apply

Queue an apply to create resources:

1. Approve the plan from Step 1
2. Verify resources are created in AWS
3. Check CloudTrail for the role assumption

## Phase-Specific Roles (Advanced)

Implement least-privilege access by using separate roles for plan and apply phases:

### Plan Role (Read-Only)

**plan-trust-policy.json**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/app.terraform.io"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "app.terraform.io:aud": "aws.workload.identity",
          "app.terraform.io:sub": "organization:<ORG>:project:<PROJECT>:workspace:<WORKSPACE>:run_phase:plan"
        }
      }
    }
  ]
}
```

**plan-permissions-policy.json**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": "*"
    }
  ]
}
```

### Apply Role (Read-Write)

**apply-trust-policy.json**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/app.terraform.io"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "app.terraform.io:aud": "aws.workload.identity",
          "app.terraform.io:sub": "organization:<ORG>:project:<PROJECT>:workspace:<WORKSPACE>:run_phase:apply"
        }
      }
    }
  ]
}
```

**apply-permissions-policy.json**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "s3:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### Create Both Roles

```bash
# Create plan role
aws iam create-role \
  --role-name TerraformCloudPlanRole \
  --assume-role-policy-document file://plan-trust-policy.json

aws iam put-role-policy \
  --role-name TerraformCloudPlanRole \
  --policy-name PlanPermissions \
  --policy-document file://plan-permissions-policy.json

# Create apply role
aws iam create-role \
  --role-name TerraformCloudApplyRole \
  --assume-role-policy-document file://apply-trust-policy.json

aws iam put-role-policy \
  --role-name TerraformCloudApplyRole \
  --policy-name ApplyPermissions \
  --policy-document file://apply-permissions-policy.json
```

### Configure Workspace Variables

```hcl
TFC_AWS_PROVIDER_AUTH = true
TFC_AWS_PLAN_ROLE_ARN = "arn:aws:iam::123456789012:role/TerraformCloudPlanRole"
TFC_AWS_APPLY_ROLE_ARN = "arn:aws:iam::123456789012:role/TerraformCloudApplyRole"
```

## AWS Partition Support

Different AWS partitions require different audience values:

| Partition | Regions | Audience | Provider URL |
|-----------|---------|----------|--------------|
| Standard AWS | us-east-1, etc. | `aws.workload.identity` | `https://app.terraform.io` |
| AWS China | cn-north-1, etc. | `aws.workload.identity` | `https://app.terraform.io` |
| AWS GovCloud | us-gov-west-1, etc. | `aws.workload.identity` | `https://app.terraform.io` |

## Troubleshooting

### "Not authorized to perform sts:AssumeRoleWithWebIdentity"

**Cause**: Trust policy doesn't match token claims

**Solution**: Verify trust policy conditions match your workspace:
```bash
aws iam get-role --role-name TerraformCloudRole \
  --query 'Role.AssumeRolePolicyDocument'
```

### "Invalid identity token"

**Cause**: OIDC provider not configured correctly

**Solution**: Verify provider exists and URL is correct:
```bash
aws iam list-open-id-connect-providers
```

### "Access denied" errors during plan/apply

**Cause**: Insufficient permissions in role policy

**Solution**: Review CloudTrail logs for denied API calls:
```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AccessDenied \
  --max-results 10
```

## Security Best Practices

### 1. Use Specific Subject Patterns

Always include organization and project validation:

```json
// ✅ Secure
"app.terraform.io:sub": "organization:acme:project:infra:workspace:prod:run_phase:*"

// ❌ Insecure
"app.terraform.io:sub": "organization:*:*"
```

### 2. Separate Roles by Environment

Create different roles for dev, staging, and production:

```bash
TerraformCloud-Dev-Role
TerraformCloud-Staging-Role
TerraformCloud-Prod-Role
```

### 3. Enable CloudTrail Logging

Monitor all role assumptions:

```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRoleWithWebIdentity \
  --query 'Events[?contains(CloudTrailEvent, `TerraformCloudRole`)]'
```

### 4. Use Condition Keys

Add additional security with IAM condition keys:

```json
{
  "Condition": {
    "StringEquals": {
      "app.terraform.io:aud": "aws.workload.identity",
      "app.terraform.io:sub": "organization:acme:project:infra:workspace:prod:run_phase:*"
    },
    "IpAddress": {
      "aws:SourceIp": ["1.2.3.4/32"]  // Optional: Restrict to known IPs
    }
  }
}
```

## CloudFormation Template

Automate the setup with CloudFormation:

```yaml
Parameters:
  TerraformCloudOrg:
    Type: String
    Description: Terraform Cloud organization name
  TerraformCloudProject:
    Type: String
    Description: Terraform Cloud project name
  TerraformCloudWorkspace:
    Type: String
    Description: Terraform Cloud workspace name

Resources:
  TerraformCloudOIDCProvider:
    Type: AWS::IAM::OIDCProvider
    Properties:
      Url: https://app.terraform.io
      ClientIdList:
        - aws.workload.identity
      ThumbprintList:
        - 9e99a48a9960b14926bb7f3b02e22da2b0ab7280  # Terraform Cloud thumbprint

  TerraformCloudRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: TerraformCloudRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action: sts:AssumeRoleWithWebIdentity
            Principal:
              Federated: !Ref TerraformCloudOIDCProvider
            Condition:
              StringEquals:
                app.terraform.io:aud: aws.workload.identity
              StringLike:
                app.terraform.io:sub: !Sub
                  - 'organization:${Org}:project:${Project}:workspace:${Workspace}:run_phase:*'
                  - Org: !Ref TerraformCloudOrg
                    Project: !Ref TerraformCloudProject
                    Workspace: !Ref TerraformCloudWorkspace
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/ReadOnlyAccess  # Replace with custom policy
      MaxSessionDuration: 3600

Outputs:
  RoleArn:
    Value: !GetAtt TerraformCloudRole.Arn
    Description: ARN to use in TFC_AWS_RUN_ROLE_ARN
```

## Additional Resources

- [Terraform Cloud Dynamic Credentials Overview](../initiators/infrastructure-as-code/terraform-cloud.md)
- [AWS OIDC Provider Setup](../providers/cloud-platforms/aws/oidc-setup.md)
- [HashiCorp Documentation: AWS Dynamic Credentials](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/dynamic-provider-credentials/aws-configuration)
- [AWS IAM OIDC Identity Providers](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
