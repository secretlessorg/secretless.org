---
sidebar_position: 2
title: Netlify
description: Deploy to Netlify using secretless OIDC authentication
keywords: [netlify, serverless, deployment, oidc, secretless, jamstack]
---

# Netlify Secretless Deployments

Netlify supports OIDC-based authentication for deployments, enabling secretless CI/CD workflows.

## Overview

Netlify's OIDC support allows deployments without storing personal access tokens or deploy keys. This enables:

- **Token-Free Deployments**: OIDC tokens replace API tokens
- **CI/CD Integration**: Support for GitHub Actions and other providers
- **Automated Authentication**: Temporary tokens for each deployment
- **Security**: No long-lived credentials in pipelines

## Key Capabilities

- OIDC authentication for deployments
- Integration with CI/CD platforms
- Site-level access controls
- Deploy preview and production workflows

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Setup guide for Netlify OIDC deployments
- GitHub Actions and GitLab CI workflow examples
- Netlify CLI configuration with OIDC
- Environment and context-based deployments
- Deploy preview workflows
- Migration guide from personal access tokens

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Netlify deployment patterns

## Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
- [GitLab CI OIDC](/docs/initiators/ci-tools/gitlab-ci)
