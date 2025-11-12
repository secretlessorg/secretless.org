---
sidebar_position: 5
title: Azure Functions
description: Use Azure Functions with secretless managed identity authentication
keywords: [azure functions, serverless, managed identity, oidc, secretless, azure]
---

# Azure Functions Secretless Authentication

Azure Functions support managed identities for secretless authentication to Azure services and external providers.

## Overview

Azure Functions use managed identities to provide automatic authentication without storing credentials. This enables:

- **No Service Principal Keys**: Automatic managed identity
- **Function-Level Identity**: System or user-assigned identities
- **Temporary Credentials**: Automatic token management
- **Azure Service Integration**: Access Key Vault, Storage, etc.

## Key Capabilities

- System-assigned and user-assigned managed identities
- Azure AD authentication
- Integration with Azure services
- OIDC token generation for external services
- RBAC-based access controls

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete guide for Azure Functions managed identities
- Function app configuration examples
- System vs user-assigned identity setup
- Azure service authentication patterns
- External OIDC federation (AWS, GCP)
- Role assignment and RBAC configuration
- Troubleshooting authentication issues
- Integration guides (e.g., functions-to-storage, functions-to-aws)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Azure Functions authentication setup

## Resources

- [Azure Functions Documentation](https://learn.microsoft.com/en-us/azure/azure-functions/)
- [Managed Identities](https://learn.microsoft.com/en-us/azure/azure-functions/functions-identity-based-connections-tutorial)

