---
sidebar_position: 3
title: Cloudflare Workers
description: Deploy Cloudflare Workers using secretless OIDC authentication
keywords: [cloudflare, workers, serverless, oidc, secretless, edge computing]
---

# Cloudflare Workers Secretless Deployments

Cloudflare Workers supports OIDC-based authentication for secretless deployments from CI/CD platforms.

## Overview

Cloudflare's support for OIDC enables deploying Workers, Pages, and other edge services without storing API tokens. This provides:

- **API Token Elimination**: OIDC tokens replace Cloudflare API tokens
- **CI/CD Integration**: Native support for GitHub Actions and GitLab CI
- **Multi-Service Support**: Workers, Pages, R2, KV, and more
- **Enhanced Security**: Temporary credentials for each deployment

## Key Capabilities

- OIDC authentication for Cloudflare API access
- Integration with Wrangler CLI
- Account and zone-level access controls
- Support for multiple Cloudflare services

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Cloudflare OIDC
- GitHub Actions workflow examples with Wrangler
- GitLab CI configuration examples
- Service-specific deployment patterns (Workers, Pages, R2)
- Wrangler configuration with OIDC
- Troubleshooting and best practices
- Integration guides for Cloudflare services

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Cloudflare deployment workflows

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
