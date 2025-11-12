---
sidebar_position: 1
title: GitHub Codespaces
description: Use GitHub Codespaces with secretless authentication to cloud providers
keywords: [github codespaces, cloud ide, oidc, secretless, development environment]
---

# GitHub Codespaces Secretless Authentication

GitHub Codespaces can generate OIDC tokens for secretless authentication to cloud providers without storing credentials.

## Overview

GitHub Codespaces leverages GitHub's OIDC token generation to enable authentication from cloud-hosted development environments. This provides:

- **No Stored Credentials**: OIDC tokens replace cloud provider API keys
- **Automatic Authentication**: Seamless access to AWS, GCP, Azure
- **Per-Repository Identity**: Tokens include repository context
- **Security**: Credentials never leave GitHub's infrastructure

## Key Capabilities

- OIDC token generation from Codespaces
- Integration with cloud provider OIDC endpoints
- Repository and user claim validation
- Temporary credential access

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Setup guide for Codespaces OIDC authentication
- Configuration for AWS, GCP, Azure access
- Token claim structure and validation
- devcontainer.json configuration examples
- Environment variable setup
- Troubleshooting guide
- Integration guides (e.g., codespaces-to-aws)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Codespaces authentication workflows

## Resources

- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)
- [GitHub OIDC](/docs/initiators/ci-tools/github-actions)
