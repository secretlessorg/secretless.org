---
sidebar_position: 3
title: RubyGems
description: Publish Ruby gems to RubyGems.org using secretless OIDC authentication
keywords: [rubygems, ruby, package registry, oidc, secretless, trusted publishing]
---

# RubyGems Trusted Publishing

RubyGems.org supports trusted publishing with OIDC tokens, enabling secretless gem publishing from CI/CD platforms.

## Overview

RubyGems' trusted publishing feature uses OIDC authentication to verify publisher identity without requiring API keys. This provides:

- **Secretless Workflow**: No RubyGems API keys in CI/CD
- **Automated Publishing**: OIDC tokens authenticate gem pushes
- **Security**: Reduced risk of credential leakage

## Key Capabilities

- OIDC token authentication for gem publishing
- Integration with GitHub Actions and other OIDC providers
- Per-gem trust configuration
- Token claim verification

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Setup instructions for RubyGems trusted publishing
- GitHub Actions workflow examples
- Configuration steps on RubyGems.org
- Best practices for multi-gem repositories
- Troubleshooting guide

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your gem publishing workflows

## Resources

- [RubyGems Trusted Publishing](https://guides.rubygems.org/trusted-publishing/)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
