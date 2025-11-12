---
sidebar_position: 2
title: Nomad
description: Use HashiCorp Nomad with secretless workload identity authentication
keywords: [nomad, hashicorp, workload identity, oidc, secretless, orchestration]
---

# Nomad Secretless Authentication

HashiCorp Nomad supports workload identity for secretless authentication to cloud providers and services.

## Overview

Nomad's workload identity feature provides each task with an identity token that can be used for authentication without storing credentials. This enables:

- **No Stored Credentials**: Workload identity tokens replace secrets
- **Cloud Provider Integration**: AWS, GCP, Azure authentication
- **Vault Integration**: Native HashiCorp Vault authentication
- **Task-Level Identity**: Each task receives its own identity

## Key Capabilities

- Workload identity token generation
- OIDC token claims with task metadata
- Integration with cloud provider OIDC endpoints
- Vault JWT authentication
- Task and namespace identity

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Nomad workload identity
- Job specification examples
- AWS, GCP, Azure provider configuration
- Vault JWT auth integration
- Token claim structure and validation
- Identity template configuration
- Troubleshooting guide
- Integration guides (e.g., nomad-to-aws, nomad-to-vault)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Nomad workload identity setup

## Resources

- [Nomad Documentation](https://developer.hashicorp.com/nomad/docs)
- [Nomad Workload Identity](https://developer.hashicorp.com/nomad/docs/concepts/workload-identity)
- [HashiCorp Vault](/docs/initiators/secret-management/hashicorp-vault)
