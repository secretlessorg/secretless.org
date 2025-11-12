---
sidebar_position: 5
title: NuGet
description: Publish .NET packages to NuGet using secretless OIDC authentication
keywords: [nuget, dotnet, csharp, package registry, oidc, secretless]
---

# NuGet Secretless Publishing

NuGet supports OIDC-based authentication for publishing .NET packages without storing API keys.

## Overview

NuGet's OIDC support enables CI/CD platforms to publish packages using temporary tokens instead of long-lived API keys. This provides:

- **Keyless Publishing**: No NuGet API keys in CI/CD pipelines
- **Azure DevOps Integration**: Native OIDC support
- **GitHub Actions Support**: Token-based authentication
- **Reduced Risk**: No credential storage or rotation

## Key Capabilities

- OIDC authentication for package publishing
- Integration with Azure DevOps and GitHub Actions
- Per-package access controls
- Token claim validation

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for NuGet OIDC authentication
- Azure DevOps pipeline examples
- GitHub Actions workflow examples
- nuget.config configuration instructions
- Migration guide from API keys to OIDC
- Troubleshooting common issues

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your .NET publishing workflows

## Resources

- [NuGet Documentation](https://learn.microsoft.com/en-us/nuget/)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
