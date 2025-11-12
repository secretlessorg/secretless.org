---
sidebar_position: 9
title: Drone CI
description: Use Drone CI with secretless OIDC authentication
keywords: [drone ci, ci cd, oidc, secretless, continuous integration]
---

# Drone CI Secretless Authentication

Drone CI supports OIDC authentication for secretless deployments to cloud providers.

## Overview

Drone's OIDC support enables pipelines to authenticate to cloud providers without storing secrets in Drone's secret store. This provides:

- **No Stored Secrets**: OIDC tokens replace Drone secrets
- **Cloud Provider Integration**: AWS, GCP, Azure support
- **Repository Identity**: Token claims include repository context
- **Self-Hosted and Cloud**: Works with both deployment models

## Key Capabilities

- OIDC token generation from Drone pipelines
- Integration with cloud provider OIDC endpoints
- Repository and organization identity
- Extension and plugin support

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Drone OIDC
- .drone.yml pipeline examples
- AWS, GCP, Azure provider configuration
- Token claim structure and validation
- Drone server OIDC configuration
- Migration from Drone secrets
- Troubleshooting guide
- Integration guides (e.g., drone-to-aws)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Drone OIDC workflows

## Resources

- [Drone Documentation](https://docs.drone.io/)
- [Drone Extensions](https://docs.drone.io/extensions/)

