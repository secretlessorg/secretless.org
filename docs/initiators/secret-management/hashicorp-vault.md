---
sidebar_position: 1
title: HashiCorp Vault
description: Access HashiCorp Vault using secretless OIDC authentication
keywords: [hashicorp vault, secrets management, oidc, secretless, jwt auth]
---

# HashiCorp Vault Secretless Access

HashiCorp Vault supports OIDC and JWT authentication methods for secretless access from CI/CD platforms and workloads.

## Overview

Vault's OIDC/JWT auth methods enable authentication using tokens from trusted identity providers without storing Vault tokens. This provides:

- **No Vault Tokens**: OIDC/JWT tokens replace long-lived Vault tokens
- **CI/CD Integration**: Authenticate from GitHub Actions, GitLab CI, etc.
- **Workload Identity**: Kubernetes, cloud provider integration
- **Fine-Grained Policies**: Token claim-based policy assignment

## Key Capabilities

- OIDC and JWT authentication methods
- Token claim validation and mapping
- Role-based policy assignment
- Integration with multiple identity providers

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Vault OIDC/JWT auth
- GitHub Actions integration examples
- GitLab CI integration examples
- Kubernetes workload authentication
- Cloud provider integration (AWS, GCP, Azure)
- Policy configuration based on claims
- Troubleshooting authentication issues
- Integration guides (e.g., github-actions-to-vault)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Vault authentication patterns

## Resources

- [Vault JWT/OIDC Auth](https://developer.hashicorp.com/vault/docs/auth/jwt)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
