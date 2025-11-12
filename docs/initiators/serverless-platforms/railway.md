---
sidebar_position: 4
title: Railway
description: Deploy to Railway using secretless OIDC authentication
keywords: [railway, serverless, deployment, oidc, secretless, platform]
---

# Railway Secretless Deployments

Railway supports OIDC-based authentication for deployments without storing API tokens in CI/CD pipelines.

## Overview

Railway's OIDC support enables automated deployments using temporary tokens from CI/CD platforms. This provides:

- **No API Tokens**: OIDC replaces Railway deployment tokens
- **GitHub Integration**: Native support for GitHub Actions
- **Project Isolation**: Per-project access controls
- **Security**: Automatic credential rotation

## Key Capabilities

- OIDC authentication for Railway API
- Integration with CI/CD platforms
- Project and environment-level controls
- Support for multiple deployment types

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Setup instructions for Railway OIDC
- GitHub Actions workflow examples
- Railway CLI configuration with OIDC
- Project and environment setup
- Multi-service deployment patterns
- Migration guide from API tokens
- Troubleshooting guide

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Railway deployment workflows

## Resources

- [Railway Documentation](https://docs.railway.app/)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
