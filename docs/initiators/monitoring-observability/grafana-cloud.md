---
sidebar_position: 4
title: Grafana Cloud
description: Configure Grafana Cloud using secretless OIDC service accounts
keywords: [grafana cloud, monitoring, observability, oidc, secretless, metrics]
---

# Grafana Cloud Secretless Authentication

Grafana Cloud supports OIDC service accounts for authentication without storing API keys.

## Overview

Grafana Cloud's OIDC service accounts enable authentication for agents, integrations, and API access. This provides:

- **No API Keys**: OIDC tokens replace Grafana Cloud API keys
- **Service Account Authentication**: OIDC-based service accounts
- **Agent Configuration**: Secretless agent deployment
- **Enhanced Security**: Temporary credentials for operations

## Key Capabilities

- OIDC service accounts
- Integration with cloud provider identities
- Agent authentication (Grafana Agent, Alloy)
- Stack and organization-level controls

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Grafana Cloud OIDC
- Service account configuration
- Grafana Agent deployment with OIDC
- Kubernetes integration examples
- Cloud provider integration (AWS, GCP, Azure)
- API access patterns
- Troubleshooting authentication issues
- Migration from API tokens

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Grafana Cloud authentication patterns

## Resources

- [Grafana Cloud Documentation](https://grafana.com/docs/grafana-cloud/)
- [Grafana Agent](https://grafana.com/docs/agent/)
