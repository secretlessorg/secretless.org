---
sidebar_position: 2
title: AWS ECR
description: Access AWS ECR using secretless OIDC authentication
keywords: [aws ecr, elastic container registry, oidc, secretless, docker]
---

# AWS ECR Secretless Access

AWS Elastic Container Registry (ECR) supports secretless authentication using OIDC tokens and IAM roles.

## Overview

ECR integrates with AWS IAM to enable push and pull operations using temporary credentials from OIDC tokens. This provides:

- **No Access Keys**: OIDC tokens replace AWS access keys
- **Automatic Authentication**: Seamless access from GitHub Actions, GitLab CI
- **Repository Policies**: Fine-grained access controls
- **Cross-Account Access**: Assume roles for multi-account setups

## Key Capabilities

- OIDC-based authentication via IAM roles
- ECR authentication token generation
- Repository and image-level permissions
- Private and public registry support

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for ECR OIDC authentication
- Docker login configuration with OIDC
- CI/CD integration examples (GitHub Actions, GitLab CI)
- IAM role and policy configuration
- Cross-account registry access
- Troubleshooting authentication issues
- Integration guides (e.g., github-actions-to-ecr)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your ECR authentication workflows

## Resources

- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [AWS IAM OIDC](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)

