---
sidebar_position: 1
title: Vercel
description: Deploy to Vercel using secretless OIDC authentication from CI/CD
keywords: [vercel, serverless, deployment, oidc, secretless, github]
---

# Vercel Secretless Deployments

Vercel supports OIDC integration for secretless deployments from GitHub and other platforms without storing deployment tokens.

## Overview

Vercel's OIDC support enables CI/CD pipelines to trigger deployments using temporary tokens instead of long-lived access tokens. This provides:

- **No Stored Tokens**: OIDC tokens replace Vercel deployment tokens
- **GitHub Integration**: Native OIDC support from GitHub Actions
- **Enhanced Security**: Automatic token rotation and reduced credential exposure

## Key Capabilities

- OIDC-based authentication for deployments
- Integration with GitHub Actions
- Project-level access controls
- Automatic token exchange during deployment

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Vercel OIDC deployments
- GitHub Actions workflow examples
- Vercel project configuration instructions
- Environment-specific deployment patterns
- Troubleshooting common issues
- Integration guides (e.g., vercel-to-aws, vercel-to-database)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Vercel deployment workflows

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
