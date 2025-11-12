---
sidebar_position: 2
title: Spacelift
description: Use Spacelift with secretless OIDC authentication for infrastructure automation
keywords: [spacelift, infrastructure as code, oidc, secretless, terraform, automation]
---

# Spacelift Secretless Authentication

Spacelift has native OIDC support for authenticating to cloud providers without storing credentials.

## Overview

Spacelift's built-in OIDC support enables infrastructure deployments using temporary credentials for cloud providers. This provides:

- **No Cloud Credentials**: OIDC tokens replace stored cloud keys
- **Native Integration**: Built-in support for AWS, GCP, Azure
- **Automatic Token Exchange**: Seamless authentication during runs
- **Enhanced Security**: No credential storage in Spacelift

## Key Capabilities

- Native OIDC integration with cloud providers
- Automatic credential provisioning during runs
- Stack and space-level configuration
- Support for Terraform, Pulumi, CloudFormation, Kubernetes

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Spacelift OIDC
- AWS IAM role configuration for Spacelift
- GCP Workload Identity Federation setup
- Azure Workload Identity configuration
- Stack and space configuration examples
- Multi-cloud setup patterns
- Troubleshooting guide
- Migration from stored credentials

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Spacelift OIDC setup

## Resources

- [Spacelift Documentation](https://docs.spacelift.io/)
- [Spacelift OIDC](https://docs.spacelift.io/integrations/cloud-providers/)

