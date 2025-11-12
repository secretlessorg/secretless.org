---
sidebar_position: 1
title: npm
description: Publish packages to npm using secretless authentication with OIDC provenance tokens
keywords: [npm, nodejs, package registry, oidc, secretless, provenance]
---

# npm Secretless Publishing

npm supports publishing packages with provenance using OIDC tokens from GitHub Actions, eliminating the need for long-lived API tokens.

## Overview

npm's provenance feature leverages OIDC tokens to create cryptographically signed attestations that link published packages to their source code and build environment. This enables:

- **Secretless Publishing**: No npm access tokens stored in CI/CD
- **Supply Chain Security**: Verifiable package provenance
- **Transparency**: Public attestations about package origins

## Key Capabilities

- OIDC token-based authentication during publishing
- Automatic provenance attestation generation
- Integration with GitHub Actions
- Signed link between package and source repository

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Step-by-step setup guide for npm provenance
- GitHub Actions workflow examples
- Configuration requirements and best practices
- Troubleshooting common issues
- Links to integration guides (e.g., npm-to-cloud-storage)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your real-world experience and examples

## Resources

- [npm Provenance Documentation](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
