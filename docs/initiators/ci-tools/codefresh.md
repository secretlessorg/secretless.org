---
sidebar_position: 10
title: Codefresh
description: Use Codefresh with secretless OIDC authentication
keywords: [codefresh, ci cd, oidc, secretless, gitops, continuous delivery]
---

# Codefresh Secretless Authentication

Codefresh supports OIDC authentication for secretless deployments to cloud providers and Kubernetes clusters.

## Overview

Codefresh's OIDC support enables pipelines to authenticate without storing credentials in the platform. This provides:

- **No Stored Credentials**: OIDC tokens replace Codefresh secrets
- **Cloud Provider Integration**: AWS, GCP, Azure authentication
- **GitOps Support**: Secretless Argo CD and GitOps workflows
- **Enhanced Security**: Automatic credential rotation

## Key Capabilities

- OIDC token generation from pipelines
- Integration with cloud provider OIDC endpoints
- Kubernetes cluster authentication
- Pipeline and project identity

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Codefresh OIDC
- codefresh.yml pipeline examples
- AWS, GCP, Azure provider configuration
- Kubernetes cluster integration with OIDC
- GitOps workflow setup
- Migration from shared configuration
- Troubleshooting guide
- Integration guides (e.g., codefresh-to-aws, codefresh-to-gke)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Codefresh OIDC workflows

## Resources

- [Codefresh Documentation](https://codefresh.io/docs/)
- [Codefresh GitOps](https://codefresh.io/docs/docs/gitops/)

