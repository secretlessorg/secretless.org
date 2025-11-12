---
sidebar_position: 6
title: Maven Central
description: Publish Java artifacts to Maven Central using secretless OIDC authentication
keywords: [maven, maven central, java, package registry, oidc, secretless]
---

# Maven Central Secretless Publishing

Maven Central supports OIDC authentication for publishing Java artifacts without storing credentials in CI/CD pipelines.

## Overview

Maven Central's OIDC support enables secretless publishing from CI/CD platforms, eliminating the need for long-lived tokens. This provides:

- **No Stored Credentials**: OIDC tokens replace GPG keys and passwords
- **CI/CD Integration**: Native support for GitHub Actions and other providers
- **Security**: Reduced exposure of publishing credentials

## Key Capabilities

- OIDC-based authentication for artifact publishing
- Integration with Sonatype Central Portal
- Support for GitHub Actions and other OIDC providers
- Automatic token exchange during deployment

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Step-by-step setup guide for Maven Central OIDC
- GitHub Actions workflow examples
- Gradle and Maven configuration examples
- Sonatype Central Portal setup instructions
- GPG signing with OIDC authentication
- Migration guide from username/password authentication

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Java publishing workflows

## Resources

- [Maven Central Publishing](https://central.sonatype.org/)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
