---
sidebar_position: 1
title: Google Artifact Registry
description: Access Google Artifact Registry using secretless Workload Identity authentication
keywords: [google artifact registry, gar, containers, oidc, secretless, workload identity]
---

# Google Artifact Registry Secretless Access

Google Artifact Registry supports secretless authentication using Workload Identity and service account impersonation.

## Overview

Artifact Registry integrates with GCP's Workload Identity to enable push and pull operations without storing service account keys. This provides:

- **No Service Account Keys**: Workload Identity replaces JSON key files
- **Automatic Authentication**: Seamless access from GKE, Cloud Build, Cloud Run
- **Repository-Level Controls**: Fine-grained IAM permissions
- **Multi-Format Support**: Docker, Maven, npm, Python, and more

## Key Capabilities

- Workload Identity integration
- Service account impersonation
- OIDC-based authentication from external sources
- Repository and artifact-level access controls

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Workload Identity with Artifact Registry
- Docker authentication configuration
- CI/CD integration examples (GitHub Actions, GitLab CI)
- Repository IAM configuration
- Multi-format registry examples
- Troubleshooting authentication issues
- Integration guides (e.g., github-actions-to-gar)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Artifact Registry authentication patterns

## Resources

- [Google Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)
- [GCP Workload Identity](https://cloud.google.com/iam/docs/workload-identity-federation)

