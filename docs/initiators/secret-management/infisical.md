---
sidebar_position: 3
title: Infisical
description: Access Infisical secrets using secretless OIDC authentication
keywords: [infisical, secrets management, oidc, secretless, environment variables]
---

# Infisical Secretless Access

Infisical supports OIDC authentication for accessing secrets without storing machine identity tokens.

## Overview

Infisical's OIDC support enables workloads and CI/CD pipelines to access secrets using identity tokens from trusted providers. This provides:

- **No Machine Tokens**: OIDC replaces Infisical machine tokens
- **CI/CD Integration**: GitHub Actions, GitLab CI, and more
- **Project-Level Controls**: Fine-grained secret access
- **Open Source**: Self-hosted and cloud options

## Key Capabilities

- OIDC authentication for Infisical CLI and SDK
- Integration with multiple identity providers
- Project and environment-level permissions
- Token claim-based access controls

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Infisical OIDC
- GitHub Actions integration examples
- GitLab CI workflow examples
- Kubernetes workload authentication
- Infisical CLI configuration with OIDC
- Self-hosted vs cloud configuration differences
- Troubleshooting guide
- Integration guides for various platforms

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Infisical authentication patterns

## Resources

- [Infisical Documentation](https://infisical.com/docs)
- [Infisical OIDC](https://infisical.com/docs/documentation/platform/identities/oidc-auth)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
