---
sidebar_position: 5
title: Azure DevOps
description: Use Azure DevOps with secretless workload identity federation
keywords: [azure devops, ci cd, oidc, secretless, workload identity]
---

# Azure DevOps Secretless Authentication

Azure DevOps supports workload identity federation for secretless authentication to Azure and other cloud providers.

## Overview

Azure DevOps' workload identity federation enables pipelines to authenticate using OIDC tokens without storing service connection credentials. This provides:

- **No Service Principal Secrets**: OIDC replaces client secrets
- **Azure Integration**: Native Azure authentication via workload identity
- **Cross-Cloud Support**: Authenticate to AWS, GCP with OIDC
- **Enhanced Security**: Automatic credential rotation

## Key Capabilities

- Workload identity federation for Azure services
- OIDC token generation for external providers
- Service connection configuration with OIDC
- Project and pipeline identity in tokens

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Azure DevOps workload identity
- Pipeline YAML examples
- Azure service connection configuration
- AWS and GCP federation setup
- Token claim structure and validation
- Migration from service principal secrets
- Troubleshooting guide
- Integration guides (e.g., azure-devops-to-azure, azure-devops-to-aws)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Azure DevOps OIDC setup

## Resources

- [Azure DevOps Documentation](https://learn.microsoft.com/en-us/azure/devops/)
- [Workload Identity Federation](https://learn.microsoft.com/en-us/azure/devops/pipelines/library/connect-to-azure)

