---
sidebar_position: 2
title: Doppler
description: Access Doppler secrets using secretless OIDC authentication
keywords: [doppler, secrets management, oidc, secretless, environment variables]
---

# Doppler Secretless Access

Doppler supports OIDC-based authentication for accessing secrets without storing service tokens.

## Overview

Doppler's OIDC support enables CI/CD platforms and workloads to access secrets using temporary tokens from trusted identity providers. This provides:

- **No Service Tokens**: OIDC replaces Doppler service tokens
- **CI/CD Integration**: GitHub Actions, GitLab CI support
- **Project-Level Access**: Fine-grained secret access controls
- **Automatic Authentication**: Seamless token exchange

## Key Capabilities

- OIDC authentication for Doppler CLI and API
- Integration with CI/CD OIDC providers
- Project and environment-level access controls
- Token claim validation

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Doppler OIDC
- GitHub Actions workflow examples
- GitLab CI integration examples
- Doppler CLI configuration with OIDC
- Project and environment setup
- Access control configuration
- Troubleshooting guide
- Integration guides for different platforms

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Doppler authentication workflows

## Resources

- [Doppler Documentation](https://docs.doppler.com/)
- [Doppler OIDC](https://docs.doppler.com/docs/oidc)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
