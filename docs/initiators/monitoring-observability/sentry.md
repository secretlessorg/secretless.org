---
sidebar_position: 3
title: Sentry
description: Configure Sentry error tracking using secretless OIDC authentication
keywords: [sentry, error tracking, observability, oidc, secretless, monitoring]
---

# Sentry Secretless Authentication

Sentry supports OIDC authentication for API access and integrations without storing auth tokens.

## Overview

Sentry's OIDC support enables authentication for deployments, releases, and API operations without storing tokens. This provides:

- **No Auth Tokens**: OIDC replaces Sentry auth tokens
- **CI/CD Integration**: Create releases and upload source maps
- **CLI Authentication**: Sentry CLI with OIDC
- **Enhanced Security**: Temporary credentials for operations

## Key Capabilities

- OIDC-based authentication for Sentry API
- Integration with CI/CD platforms
- Release and deploy tracking
- Organization and project-level access

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Sentry OIDC
- GitHub Actions workflow examples
- Sentry CLI configuration with OIDC
- Release creation and source map uploads
- Integration setup and configuration
- Troubleshooting authentication issues
- Best practices for CI/CD integration

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Sentry authentication workflows

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry CLI](https://docs.sentry.io/product/cli/)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
