---
sidebar_position: 5
title: Fly.io
description: Deploy to Fly.io using secretless OIDC authentication
keywords: [fly.io, serverless, deployment, oidc, secretless, edge computing]
---

# Fly.io Secretless Deployments

Fly.io supports OIDC authentication for secretless deployments from CI/CD platforms.

## Overview

Fly.io's OIDC support enables deploying applications without storing API tokens. This provides:

- **Token-Free Deployments**: OIDC replaces Fly API tokens
- **CI/CD Integration**: Support for GitHub Actions and other platforms
- **Organization Controls**: Per-org and per-app access
- **Security**: Temporary credentials for deployments

## Key Capabilities

- OIDC-based authentication for flyctl
- Integration with CI/CD platforms
- Organization and application-level controls
- Multi-region deployment support

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Fly.io OIDC
- GitHub Actions workflow examples
- flyctl configuration with OIDC
- Organization and app setup instructions
- Multi-region deployment patterns
- Secrets management with OIDC
- Migration guide from API tokens

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Fly.io deployment workflows

## Resources

- [Fly.io Documentation](https://fly.io/docs/)
- [flyctl CLI](https://fly.io/docs/flyctl/)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
