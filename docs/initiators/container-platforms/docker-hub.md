---
sidebar_position: 4
title: Docker Hub
description: Access Docker Hub using secretless OIDC authentication
keywords: [docker hub, container registry, oidc, secretless, docker]
---

# Docker Hub Secretless Access

Docker Hub supports OIDC authentication for secretless image publishing from CI/CD platforms.

## Overview

Docker Hub's OIDC support enables push operations using temporary tokens from CI/CD platforms without storing personal access tokens. This provides:

- **No Access Tokens**: OIDC replaces Docker Hub access tokens
- **CI/CD Integration**: Support for GitHub Actions and other platforms
- **Repository Controls**: Per-repository access management
- **Enhanced Security**: Automatic token rotation

## Key Capabilities

- OIDC-based authentication for docker push
- Integration with CI/CD OIDC providers
- Repository and organization-level access
- Public and private repository support

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Docker Hub OIDC
- GitHub Actions workflow examples
- docker login configuration with OIDC
- Repository and organization setup
- Multi-platform image publishing
- Migration guide from access tokens
- Troubleshooting guide

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Docker Hub authentication workflows

## Resources

- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
