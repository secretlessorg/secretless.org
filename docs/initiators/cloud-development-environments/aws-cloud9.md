---
sidebar_position: 3
title: AWS Cloud9
description: Use AWS Cloud9 with secretless authentication via IAM roles
keywords: [aws cloud9, cloud ide, oidc, secretless, iam roles]
---

# AWS Cloud9 Secretless Authentication

AWS Cloud9 supports secretless authentication to AWS services using IAM roles and temporary credentials.

## Overview

Cloud9 environments can assume IAM roles to access AWS services without storing long-lived credentials. This provides:

- **Automatic AWS Credentials**: EC2 instance profile or IAM role integration
- **Temporary Credentials**: Automatic credential rotation
- **No Access Keys**: Eliminates long-lived IAM user credentials
- **Cross-Account Access**: Assume roles in other AWS accounts

## Key Capabilities

- IAM role-based authentication
- EC2 instance profile integration
- Temporary credential management
- AWS credential file automation

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Setup guide for Cloud9 IAM role configuration
- EC2 instance profile setup
- Cross-account access patterns
- Credential provider chain configuration
- Integration with external OIDC providers
- Best practices for environment security
- Troubleshooting guide

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Cloud9 authentication setup

## Resources

- [AWS Cloud9 Documentation](https://docs.aws.amazon.com/cloud9/)
- [AWS IAM Roles](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html)

