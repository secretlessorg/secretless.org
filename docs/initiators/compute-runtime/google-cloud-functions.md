---
sidebar_position: 4
title: Google Cloud Functions
description: Use Google Cloud Functions with secretless service account authentication
keywords: [google cloud functions, serverless, service account, oidc, secretless, gcp]
---

# Google Cloud Functions Secretless Authentication

Google Cloud Functions automatically provide service identities for secretless authentication to GCP services.

## Overview

Cloud Functions use service accounts to provide automatic authentication without service account keys. This enables:

- **No Service Account Keys**: Automatic identity provisioning
- **Function-Level Identity**: Each function has a service account
- **Temporary Credentials**: Automatic token management
- **GCP Service Integration**: Seamless access to Cloud Storage, Firestore, etc.

## Key Capabilities

- Automatic service account identity
- Service account impersonation
- OIDC token generation for external services
- Integration with GCP services
- Cross-project access

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete guide for Cloud Functions service identity
- Function configuration examples
- Service account setup and permissions
- OIDC token generation for external services
- Cross-project authentication patterns
- Troubleshooting authentication issues
- Integration guides (e.g., functions-to-storage, functions-to-aws)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Cloud Functions authentication setup

## Resources

- [Cloud Functions Documentation](https://cloud.google.com/functions/docs)
- [Function Identity](https://cloud.google.com/functions/docs/securing/function-identity)

