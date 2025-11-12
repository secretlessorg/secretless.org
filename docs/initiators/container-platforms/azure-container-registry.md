---
sidebar_position: 3
title: Azure Container Registry
description: Access Azure Container Registry using secretless managed identity authentication
keywords: [azure acr, container registry, oidc, secretless, managed identity]
---

# Azure Container Registry Secretless Access

Azure Container Registry (ACR) supports secretless authentication using managed identities and OIDC workload identity federation.

## Overview

ACR integrates with Azure Active Directory to enable push and pull operations without admin credentials or service principal keys. This provides:

- **No Service Principal Keys**: Managed identities replace credentials
- **Automatic Authentication**: Seamless access from AKS, Azure DevOps
- **Repository Permissions**: Role-based access controls
- **Workload Identity**: OIDC federation for external platforms

## Key Capabilities

- Managed identity authentication
- OIDC workload identity federation
- Azure AD integration
- Repository and image-level RBAC

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for ACR managed identity authentication
- Workload identity federation configuration
- Docker authentication with managed identities
- CI/CD integration (GitHub Actions, Azure DevOps)
- Role assignment and RBAC configuration
- Cross-subscription access patterns
- Troubleshooting guide
- Integration guides (e.g., github-actions-to-acr)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your ACR authentication workflows

## Resources

- [Azure Container Registry Documentation](https://learn.microsoft.com/en-us/azure/container-registry/)
- [Azure Workload Identity](https://learn.microsoft.com/en-us/azure/active-directory/workload-identities/)

