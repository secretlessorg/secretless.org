---
sidebar_position: 4
title: 1Password
description: Access 1Password secrets using service account OIDC authentication
keywords: [1password, secrets management, oidc, secretless, service accounts]
---

# 1Password Secretless Access

1Password supports service accounts with OIDC-based authentication for accessing secrets in CI/CD and production environments.

## Overview

1Password service accounts enable programmatic access to secrets using OIDC authentication from trusted platforms. This provides:

- **No Long-Lived Tokens**: OIDC authentication for service accounts
- **CI/CD Integration**: GitHub Actions, GitLab CI support
- **Vault-Level Access**: Control access to specific vaults
- **Audit Logging**: Track all secret access

## Key Capabilities

- Service account authentication with OIDC
- Integration with CI/CD platforms
- Vault and item-level permissions
- 1Password CLI and SDK support

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for 1Password service accounts with OIDC
- GitHub Actions workflow examples
- 1Password CLI (op) configuration with OIDC
- Service account and vault permission setup
- Integration with Kubernetes and cloud platforms
- Best practices for secret management
- Troubleshooting guide
- Migration from service account tokens to OIDC

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your 1Password integration workflows

## Resources

- [1Password Developer Documentation](https://developer.1password.com/)
- [1Password Service Accounts](https://developer.1password.com/docs/service-accounts)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
