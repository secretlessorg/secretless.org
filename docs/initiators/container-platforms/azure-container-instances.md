---
sidebar_position: 7
title: Azure Container Instances
description: Azure Container Instances with secretless managed identity authentication
keywords: [azure aci, container instances, oidc, secretless, managed identity]
---

# Azure Container Instances Secretless Authentication

Azure Container Instances (ACI) support secretless authentication using managed identities.

## Overview

ACI containers can be assigned managed identities to access Azure resources without storing credentials. This enables:

- **No Service Principal Keys**: Automatic managed identity
- **Azure Resource Access**: Authenticate to Storage, Key Vault, etc.
- **System and User-Assigned Identities**: Flexible identity management
- **Automatic Token Retrieval**: Built-in credential handling

## Key Capabilities

- System-assigned and user-assigned managed identities
- Azure AD authentication
- Integration with Azure services
- RBAC-based access controls

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete guide for ACI managed identities
- System-assigned vs user-assigned identity setup
- Authentication to Azure services (Storage, Key Vault, etc.)
- Role assignment configuration
- Container group identity management
- Troubleshooting authentication issues
- Integration guides (e.g., aci-to-storage, aci-to-cosmos)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your ACI authentication patterns

## Resources

- [Azure Container Instances Documentation](https://learn.microsoft.com/en-us/azure/container-instances/)
- [Managed Identities](https://learn.microsoft.com/en-us/azure/container-instances/container-instances-managed-identity)

