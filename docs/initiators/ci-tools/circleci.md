---
sidebar_position: 4
title: CircleCI
description: Use CircleCI with secretless OIDC authentication to cloud providers
keywords: [circleci, ci cd, oidc, secretless, continuous integration]
---

# CircleCI Secretless Authentication

CircleCI supports OIDC token generation for secretless authentication to cloud providers from CI/CD pipelines.

## Overview

CircleCI's OIDC support enables workflows to authenticate to cloud providers without storing credentials as environment variables or contexts. This provides:

- **No Stored Credentials**: OIDC tokens replace cloud provider credentials
- **Context-Free Authentication**: No need for CircleCI contexts with secrets
- **Cloud Provider Integration**: AWS, GCP, Azure support
- **Enhanced Security**: Automatic credential rotation

## Key Capabilities

- OIDC token generation from CircleCI jobs
- Integration with cloud provider OIDC endpoints
- Project and organization identity in tokens
- Per-workflow authentication

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for CircleCI OIDC
- config.yml workflow examples
- AWS, GCP, Azure provider configuration
- Token claim structure and validation
- Context vs OIDC comparison
- Migration guide from stored credentials
- Troubleshooting guide
- Integration guides (e.g., circleci-to-aws)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your CircleCI OIDC workflows

## Resources

- [CircleCI Documentation](https://circleci.com/docs/)
- [CircleCI OIDC](https://circleci.com/docs/openid-connect-tokens/)

