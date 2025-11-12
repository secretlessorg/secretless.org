---
sidebar_position: 5
title: Google Cloud Run
description: Google Cloud Run services with secretless Workload Identity authentication
keywords: [google cloud run, serverless, containers, oidc, secretless, workload identity]
---

# Google Cloud Run Secretless Authentication

Google Cloud Run services use service identities to authenticate to other GCP services without service account keys.

## Overview

Cloud Run automatically provides each service with an identity that can be used for secretless authentication. This enables:

- **No Service Account Keys**: Automatic service identity
- **Seamless GCP Access**: Authenticate to Cloud Storage, Firestore, etc.
- **Token Generation**: Built-in OIDC token generation
- **External Authentication**: Generate tokens for external services

## Key Capabilities

- Automatic service identity assignment
- Service account impersonation
- OIDC token generation for external services
- IAM-based access controls

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete guide for Cloud Run service identity
- Authentication to other GCP services
- External OIDC token generation examples
- Service-to-service authentication patterns
- IAM configuration and best practices
- Troubleshooting authentication issues
- Integration guides (e.g., cloud-run-to-aws, cloud-run-to-azure)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Cloud Run authentication patterns

## Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Service Identity](https://cloud.google.com/run/docs/securing/service-identity)

