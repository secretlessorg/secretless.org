---
sidebar_position: 7
title: Jenkins
description: Use Jenkins with secretless OIDC authentication via plugins
keywords: [jenkins, ci cd, oidc, secretless, continuous integration]
---

# Jenkins Secretless Authentication

Jenkins supports OIDC authentication to cloud providers through plugins and native credential handling.

## Overview

Jenkins can leverage OIDC tokens for cloud provider authentication through various plugins and integrations. This enables:

- **No Stored Credentials**: OIDC tokens replace Jenkins credentials
- **Cloud Provider Integration**: AWS, GCP, Azure support via plugins
- **Kubernetes Integration**: Service account tokens on Kubernetes
- **Plugin Ecosystem**: Multiple OIDC authentication options

## Key Capabilities

- OIDC authentication via plugins
- Kubernetes service account integration
- Cloud provider credential plugins
- Pipeline-level authentication

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Jenkins OIDC
- Jenkinsfile pipeline examples
- Plugin recommendations (AWS, GCP, Azure)
- Kubernetes deployment with workload identity
- Cloud provider configuration examples
- Migration from stored credentials
- Troubleshooting guide
- Integration guides (e.g., jenkins-on-kubernetes-to-aws)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Jenkins OIDC setup

## Resources

- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [Jenkins Plugins](https://plugins.jenkins.io/)
