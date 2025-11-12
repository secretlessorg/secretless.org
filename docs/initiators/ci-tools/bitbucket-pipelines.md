---
sidebar_position: 6
title: Bitbucket Pipelines
description: Use Bitbucket Pipelines with secretless OIDC authentication
keywords: [bitbucket, pipelines, ci cd, oidc, secretless, atlassian]
---

# Bitbucket Pipelines Secretless Authentication

Bitbucket Pipelines supports OIDC token generation for secretless authentication to cloud providers.

## Overview

Bitbucket Pipelines' OIDC support enables workflows to authenticate to cloud providers without storing credentials in repository variables. This provides:

- **No Repository Variables**: OIDC tokens replace stored credentials
- **Cloud Provider Integration**: AWS, GCP, Azure support
- **Workspace and Repository Identity**: Token claims include context
- **Enhanced Security**: Automatic credential rotation

## Key Capabilities

- OIDC token generation from pipeline steps
- Integration with cloud provider OIDC endpoints
- Workspace and repository identity in tokens
- Per-pipeline authentication

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Bitbucket Pipelines OIDC
- bitbucket-pipelines.yml examples
- AWS, GCP, Azure provider configuration
- Token claim structure and validation
- OIDC configuration in Bitbucket
- Migration from repository variables
- Troubleshooting guide
- Integration guides (e.g., bitbucket-to-aws)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Bitbucket Pipelines OIDC workflows

## Resources

- [Bitbucket Pipelines Documentation](https://support.atlassian.com/bitbucket-cloud/docs/get-started-with-bitbucket-pipelines/)
- [Bitbucket OIDC](https://support.atlassian.com/bitbucket-cloud/docs/integrate-pipelines-with-resource-servers-using-oidc/)

