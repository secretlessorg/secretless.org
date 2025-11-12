---
sidebar_position: 5
title: env0
description: Use env0 with secretless OIDC authentication for infrastructure automation
keywords: [env0, infrastructure as code, oidc, secretless, terraform, automation]
---

# env0 Secretless Authentication

env0 supports native OIDC integration for authenticating to cloud providers without storing credentials.

## Overview

env0's built-in OIDC support enables infrastructure deployments using temporary credentials for cloud providers. This provides:

- **No Cloud Credentials**: OIDC tokens replace stored credentials
- **Native Integration**: Built-in AWS, GCP, Azure support
- **Automatic Authentication**: Seamless credential provisioning
- **Enhanced Security**: No credential storage in env0

## Key Capabilities

- Native OIDC integration with cloud providers
- Automatic credential exchange during deployments
- Environment and project-level configuration
- Support for Terraform, Terragrunt, Pulumi, OpenTofu

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for env0 OIDC
- AWS IAM role configuration for env0
- GCP Workload Identity Federation setup
- Azure Workload Identity configuration
- Environment and project setup
- Multi-cloud deployment patterns
- Troubleshooting authentication issues
- Migration from stored credentials

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your env0 OIDC configuration

## Resources

- [env0 Documentation](https://docs.env0.com/)
- [env0 OIDC Integration](https://docs.env0.com/docs/cloud-credentials)

