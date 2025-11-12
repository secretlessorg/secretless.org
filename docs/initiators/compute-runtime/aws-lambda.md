---
sidebar_position: 3
title: AWS Lambda
description: Use AWS Lambda with secretless IAM execution role authentication
keywords: [aws lambda, serverless, iam roles, oidc, secretless, functions]
---

# AWS Lambda Secretless Authentication

AWS Lambda functions use execution roles to access AWS services without storing credentials.

## Overview

Lambda's execution role provides automatic temporary credentials to functions, enabling secretless authentication. This provides:

- **No Access Keys**: Automatic IAM credential provisioning
- **Function-Level Identity**: Each function has its own execution role
- **Temporary Credentials**: Automatic rotation
- **Cross-Account Access**: Assume roles in other AWS accounts

## Key Capabilities

- IAM execution role for AWS service access
- Automatic temporary credential management
- AWS SDK automatic credential provider chain
- Cross-account role assumption
- Integration with AWS services

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete guide for Lambda execution roles
- Function configuration examples
- Cross-account access patterns
- IAM policy best practices
- External OIDC integration (non-AWS services)
- Troubleshooting credential issues
- Integration guides (e.g., lambda-to-s3, lambda-to-dynamodb)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Lambda authentication patterns

## Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Lambda Execution Roles](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)

