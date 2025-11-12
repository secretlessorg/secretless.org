---
sidebar_position: 1
title: AWS OIDC Provider Setup
description: Configure AWS to accept OpenID Connect (OIDC) authentication from external services like GitHub Actions, eliminating the need for long-lived credentials
keywords: [aws, oidc, openid connect, iam, authentication, secretless, github actions, trust policy]
---

# AWS OIDC Provider Setup

Learn how to configure AWS to accept OpenID Connect (OIDC) authentication from external services, enabling secretless workflows without storing long-lived credentials.

## Overview

OpenID Connect (OIDC) allows external services to authenticate with AWS using short-lived tokens instead of permanent access keys. The authentication flow works as follows:

1. **Token Generation**: External service (e.g., GitHub Actions) creates a JWT (JSON Web Token)
2. **JWT Submission**: The service sends the token to AWS's OIDC endpoint
3. **Role Assumption**: AWS validates the token against configured trust policies
4. **Credential Exchange**: AWS returns temporary credentials (typically valid for 1 hour)

This eliminates the need to store AWS access keys in external systems, significantly reducing security risk.

## OIDC Identity Provider Setup

The OIDC Identity Provider must be created once per AWS account and can be reused across multiple IAM roles.

### Using AWS Console

1. Navigate to **IAM → Identity Providers → Add Provider**
2. Select **OpenID Connect**
3. **Provider URL**: Enter the OIDC provider URL (e.g., `https://token.actions.githubusercontent.com` for GitHub Actions)
4. **Audience**: Enter `sts.amazonaws.com` (for standard AWS regions)
5. Click **Add provider**

### Using AWS CLI

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

**Note**: As of July 2023, AWS automatically trusts GitHub's root CA, making the thumbprint optional (but still accepted for backwards compatibility).

### Verify Provider Creation

```bash
aws iam list-open-id-connect-providers
```

Expected output includes:
```
arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com
```

## IAM Role Configuration

### Trust Policy Structure

The trust policy determines which external entities can assume the role. This is the most critical security component.

**Basic Trust Policy**:

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
          "token.actions.githubusercontent.com:sub": "repo:<ORG>/<REPO>:ref:refs/heads/<BRANCH>"
        }
      }
    }
  ]
}
```

Replace:
- `<ACCOUNT_ID>` - Your AWS account ID
- `<ORG>/<REPO>` - GitHub organization and repository name
- `<BRANCH>` - Branch name (e.g., `main`)

### Subject Claim Scoping

The `sub` (subject) claim is crucial for security. It determines which external entities can assume the role.

| Scope Type | Subject Pattern | Use Case | Security Level |
|------------|----------------|----------|----------------|
| Specific Branch | `repo:<org>/<repo>:ref:refs/heads/<branch>` | Production deployments from main | Highest |
| Specific Environment | `repo:<org>/<repo>:environment:<env>` | Environment-specific deployments | High |
| Repository-wide | `repo:<org>/<repo>:*` | General repository access | Medium |
| Pull Requests | `repo:<org>/<repo>:pull_request` | PR validation workflows | Medium |
| Specific Tag | `repo:<org>/<repo>:ref:refs/tags/<tag>` | Release workflows | High |
| Organization-wide | `repo:<org>/*:*` | Shared organizational resources | Lower |

**Security Critical**: Without a subject condition, ANY GitHub user or repository could potentially assume the role. Always include specific subject constraints.

### Multiple Conditions Example

Allow multiple branches or environments to assume the same role:

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
  ]
}
```

## Creating IAM Roles

### Step 1: Create Trust Policy File

Save the trust policy as `trust-policy.json` with your specific values.

### Step 2: Create Permissions Policy

Create a permissions policy following the principle of least privilege:

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

### Step 3: Create the Role

```bash
# Create the role with trust policy
aws iam create-role \
  --role-name GitHubActionsDeployRole \
  --assume-role-policy-document file://trust-policy.json \
  --description "Role for GitHub Actions deployments" \
  --max-session-duration 3600

# Attach permissions policy
aws iam put-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-name DeploymentPermissions \
  --policy-document file://permissions-policy.json

# Get the role ARN (save this for your workflows)
aws iam get-role \
  --role-name GitHubActionsDeployRole \
  --query 'Role.Arn' \
  --output text
```

## CloudFormation Template

Automate OIDC setup with CloudFormation:

```yaml
Parameters:
  GitHubOrg:
    Type: String
    Description: GitHub organization name
  RepositoryName:
    Type: String
    Description: GitHub repository name
  OIDCProviderArn:
    Description: ARN for the GitHub OIDC Provider (leave empty to create new)
    Default: ""
    Type: String
  OIDCAudience:
    Description: Audience supplied to configure-aws-credentials
    Default: "sts.amazonaws.com"
    Type: String

Conditions:
  CreateOIDCProvider: !Equals
    - !Ref OIDCProviderArn
    - ""

Resources:
  GitHubOIDCProvider:
    Type: AWS::IAM::OIDCProvider
    Condition: CreateOIDCProvider
    Properties:
      Url: https://token.actions.githubusercontent.com
      ClientIdList:
        - sts.amazonaws.com
      ThumbprintList:
        - 6938fd4d98bab03faadb97b34396831e3780aea1

  GitHubActionsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: GitHubActionsRole
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Action: sts:AssumeRoleWithWebIdentity
            Principal:
              Federated: !If
                - CreateOIDCProvider
                - !Ref GitHubOIDCProvider
                - !Ref OIDCProviderArn
            Condition:
              StringEquals:
                token.actions.githubusercontent.com:aud: !Ref OIDCAudience
              StringLike:
                token.actions.githubusercontent.com:sub: !Sub repo:${GitHubOrg}/${RepositoryName}:*
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/ReadOnlyAccess  # Replace with least-privilege policies
      MaxSessionDuration: 3600

Outputs:
  RoleArn:
    Description: ARN of the IAM role for GitHub Actions
    Value: !GetAtt GitHubActionsRole.Arn
```

Deploy the template:

```bash
aws cloudformation create-stack \
  --stack-name github-oidc-setup \
  --template-body file://oidc-stack.yaml \
  --parameters ParameterKey=GitHubOrg,ParameterValue=myorg \
               ParameterKey=RepositoryName,ParameterValue=myrepo \
  --capabilities CAPABILITY_NAMED_IAM
```

## AWS Partition-Specific Configuration

Different AWS partitions require different audience values:

| Partition | Regions | Audience Value | Provider ARN Format |
|-----------|---------|----------------|---------------------|
| Standard AWS | us-east-1, eu-west-1, etc. | `sts.amazonaws.com` | `arn:aws:iam::...` |
| AWS China | cn-north-1, cn-northwest-1 | `sts.amazonaws.com.cn` | `arn:aws-cn:iam::...` |
| AWS GovCloud | us-gov-west-1, us-gov-east-1 | `sts.amazonaws-us-gov.com` | `arn:aws-us-gov:iam::...` |

Ensure your trust policy and external configuration use matching audience values for your partition.

## Security Best Practices

### Least Privilege Permissions

Grant only the minimum permissions required:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-bucket/deployments/*"
    }
  ]
}
```

**Avoid**:
- Wildcard actions (`s3:*`, `*`)
- Wildcard resources (`*`)
- Administrative policies (`AdministratorAccess`)

### Scope Trust Policies Tightly

**Bad** (allows any GitHub repository):
```json
{
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
    }
  }
}
```

**Good** (specific repository and branch):
```json
{
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
      "token.actions.githubusercontent.com:sub": "repo:myorg/myrepo:ref:refs/heads/main"
    }
  }
}
```

### Separate Roles by Environment

Create different roles for dev, staging, and production:

- `GitHubActions-Dev-Role` - Scoped to develop branch
- `GitHubActions-Staging-Role` - Scoped to staging environment
- `GitHubActions-Prod-Role` - Scoped to production environment with tighter permissions

### Session Duration Limits

Configure appropriate maximum session durations:

- **Short-lived deployments**: 900-1800 seconds (15-30 minutes)
- **Standard deployments**: 3600 seconds (1 hour, default)
- **Long-running processes**: Up to 43200 seconds (12 hours, maximum)

```bash
aws iam update-role \
  --role-name GitHubActionsDeployRole \
  --max-session-duration 3600
```

### Enable CloudTrail Monitoring

Monitor all role assumptions and API calls:

1. Ensure CloudTrail is enabled in your account
2. Configure CloudWatch alerts for suspicious activity
3. Regularly audit role assumptions

Query recent role assumptions:

```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRoleWithWebIdentity \
  --max-results 10 \
  --query 'Events[].{Time:EventTime,User:Username}' \
  --output table
```

### Use Resource Tags

Tag roles for easier management:

```bash
aws iam tag-role \
  --role-name GitHubActionsDeployRole \
  --tags Key=Environment,Value=Production \
         Key=ManagedBy,Value=Terraform \
         Key=Purpose,Value=GitHubActionsOIDC
```

### Service Control Policies

Use AWS Organizations SCPs for additional guardrails:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "iam:DeleteRole",
        "iam:UpdateAssumeRolePolicy"
      ],
      "Resource": "arn:aws:iam::*:role/GitHubActions*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalArn": "arn:aws:iam::*:role/AdminRole"
        }
      }
    }
  ]
}
```

## Common Issues

### Issue: Role name "GitHubActions" fails

**Problem**: Some configurations report failures with role names containing "GitHubActions".

**Solution**: Use a different naming pattern:
- `GHA-Deploy-Role`
- `CI-Deployment-Role`
- `GitHub-CI-Role`

### Issue: Trust policy too broad

**Problem**: Role being assumed from unexpected repositories.

**Solution**: Review and tighten the `sub` condition in your trust policy. Use specific branch or environment patterns instead of wildcards.

### Issue: Session duration errors

**Problem**: Credentials expire before workflow completes.

**Solution**: Increase the role's maximum session duration and specify longer duration in the workflow configuration.

## Next Steps

- **For GitHub Actions**: See [GitHub Actions Initiator Documentation](../../initiators/ci-tools/github-actions.md)
- **Integration Guide**: Follow the [GitHub Actions to AWS Integration Guide](../../guides/github-actions-to-aws.md)
- **Other Providers**: Check documentation for other service providers that support AWS OIDC

## Additional Resources

- [AWS IAM OIDC Identity Providers Documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
- [AWS Security Blog: Use IAM roles to connect GitHub Actions](https://aws.amazon.com/blogs/security/use-iam-roles-to-connect-github-actions-to-actions-in-aws/)
- [AWS STS AssumeRoleWithWebIdentity API Reference](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html)
