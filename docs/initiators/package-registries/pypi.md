---
sidebar_position: 2
title: PyPI
description: Publish Python packages to PyPI using Trusted Publishers with OIDC authentication
keywords: [pypi, python, package registry, oidc, secretless, trusted publishers]
---

# PyPI Trusted Publishers

PyPI supports Trusted Publishers, allowing secretless package publishing using OIDC tokens from CI/CD platforms like GitHub Actions and GitLab CI.

## Overview

PyPI's Trusted Publishers feature uses OIDC to establish a trust relationship between your package and your CI/CD platform. This enables:

- **No API Tokens**: Eliminate long-lived PyPI tokens from CI/CD
- **Automatic Authentication**: OIDC tokens verify identity during publishing
- **Enhanced Security**: Reduced credential exposure and rotation overhead

## Key Capabilities

- OIDC-based authentication from GitHub Actions and GitLab CI
- Per-project trust configuration on PyPI
- Token claim validation (repository, workflow, environment)
- Automatic token exchange during publishing

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for PyPI Trusted Publishers
- GitHub Actions and GitLab CI workflow examples
- Trust policy configuration instructions
- Migration guide from API tokens to Trusted Publishers
- Troubleshooting and security best practices

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your experience migrating to Trusted Publishers

## Resources

- [PyPI Trusted Publishers Documentation](https://docs.pypi.org/trusted-publishers/)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
- [GitLab CI OIDC](/docs/initiators/ci-tools/gitlab-ci)
