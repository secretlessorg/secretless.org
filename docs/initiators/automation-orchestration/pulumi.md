---
sidebar_position: 1
title: Pulumi
description: Use Pulumi with secretless OIDC authentication for infrastructure deployments
keywords: [pulumi, infrastructure as code, oidc, secretless, automation]
---

# Pulumi Secretless Authentication

Pulumi supports OIDC authentication for deployments to cloud providers without storing credentials.

## Overview

Pulumi's OIDC support enables infrastructure deployments using temporary tokens from CI/CD platforms and Pulumi Cloud. This provides:

- **No Cloud Credentials**: OIDC tokens replace cloud provider keys
- **CI/CD Integration**: GitHub Actions, GitLab CI support
- **Pulumi Cloud OIDC**: Native OIDC token generation
- **Enhanced Security**: Automatic credential rotation

## Key Capabilities

- OIDC authentication to cloud providers (AWS, GCP, Azure)
- Pulumi Cloud OIDC token generation
- Integration with CI/CD platforms
- Stack-level access controls

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Pulumi OIDC
- GitHub Actions workflow examples
- Pulumi Cloud configuration for OIDC
- AWS, GCP, Azure provider configuration
- Stack and organization setup
- Pulumi ESC (Environments, Secrets, Config) integration
- Troubleshooting guide
- Migration from stored credentials

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Pulumi OIDC workflows

## Resources

- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [Pulumi OIDC](https://www.pulumi.com/docs/pulumi-cloud/oidc/)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
