---
sidebar_position: 3
title: Atlantis
description: Use Atlantis with secretless OIDC authentication for Terraform automation
keywords: [atlantis, terraform, oidc, secretless, pull requests, automation]
---

# Atlantis Secretless Authentication

Atlantis can leverage OIDC authentication to access cloud providers without storing credentials in the Atlantis server.

## Overview

Atlantis can use OIDC tokens to authenticate to cloud providers, enabling Terraform plan and apply operations without storing cloud credentials. This provides:

- **No Stored Credentials**: OIDC tokens replace cloud provider keys
- **Cloud Provider Integration**: AWS, GCP, Azure support via OIDC
- **Server-Side Authentication**: Atlantis assumes roles using OIDC
- **Enhanced Security**: Credentials never stored on Atlantis server

## Key Capabilities

- OIDC integration for cloud provider authentication
- Server identity-based authentication (Kubernetes, ECS, etc.)
- Repository and project-level configuration
- Support for multiple cloud providers

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Atlantis with OIDC
- Kubernetes deployment with workload identity
- AWS ECS deployment with task roles
- Cloud provider OIDC configuration
- atlantis.yaml configuration examples
- Multi-repo and multi-cloud patterns
- Troubleshooting authentication issues
- Migration from stored credentials

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Atlantis OIDC setup

## Resources

- [Atlantis Documentation](https://www.runatlantis.io/docs/)
- [AWS ECS/Fargate](/docs/initiators/container-platforms/aws-ecs-fargate)
