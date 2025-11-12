---
sidebar_position: 8
title: Travis CI
description: Use Travis CI with secretless OIDC authentication
keywords: [travis ci, ci cd, oidc, secretless, continuous integration]
---

# Travis CI Secretless Authentication

Travis CI support for OIDC authentication enables secretless deployments to cloud providers.

## Overview

Travis CI's OIDC capabilities allow builds to authenticate to cloud providers without encrypted environment variables. This provides:

- **No Encrypted Variables**: OIDC tokens replace Travis encrypted secrets
- **Cloud Provider Integration**: AWS, GCP, Azure authentication
- **Repository Identity**: Token claims include repository context
- **Enhanced Security**: Automatic credential rotation

## Key Capabilities

- OIDC token generation from Travis builds
- Integration with cloud provider OIDC endpoints
- Repository and organization identity
- Per-build authentication

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Travis CI OIDC
- .travis.yml configuration examples
- AWS, GCP, Azure provider setup
- Token claim structure and validation
- Travis CI OIDC configuration
- Migration from encrypted variables
- Troubleshooting guide
- Integration guides (e.g., travis-to-aws)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Travis CI OIDC workflows

## Resources

- [Travis CI Documentation](https://docs.travis-ci.com/)

