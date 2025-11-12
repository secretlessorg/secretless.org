---
sidebar_position: 2
title: Gitpod
description: Use Gitpod with secretless authentication to cloud providers
keywords: [gitpod, cloud ide, oidc, secretless, development environment]
---

# Gitpod Secretless Authentication

Gitpod supports OIDC integration for secretless authentication to cloud providers from cloud-hosted development workspaces.

## Overview

Gitpod's OIDC support enables authentication to cloud providers without storing credentials in workspace environments. This provides:

- **Credential-Free Workspaces**: OIDC tokens replace API keys
- **Cloud Provider Integration**: Access AWS, GCP, Azure resources
- **Workspace Identity**: Token claims include project context
- **Enhanced Security**: No long-lived credentials in workspaces

## Key Capabilities

- OIDC token generation from Gitpod workspaces
- Integration with cloud provider OIDC endpoints
- Project and user identity claims
- Automatic token refresh

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Gitpod OIDC
- Cloud provider configuration (AWS, GCP, Azure)
- .gitpod.yml configuration examples
- Token claim structure and validation
- Environment setup and initialization
- Troubleshooting common issues
- Integration guides for each cloud provider

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Gitpod authentication patterns

## Resources

- [Gitpod Documentation](https://www.gitpod.io/docs)
- [Gitpod OIDC](https://www.gitpod.io/docs/configure/authentication)
