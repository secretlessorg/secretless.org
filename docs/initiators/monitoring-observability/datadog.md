---
sidebar_position: 1
title: Datadog
description: Configure Datadog agents using secretless OIDC authentication
keywords: [datadog, monitoring, observability, oidc, secretless, apm]
---

# Datadog Secretless Authentication

Datadog supports OIDC integration for agent authentication and API access without storing API keys.

## Overview

Datadog's OIDC support enables agents and integrations to authenticate without embedding API keys. This provides:

- **No API Keys**: OIDC tokens replace Datadog API keys
- **Agent Authentication**: Secretless agent deployment
- **CI/CD Integration**: Authenticate API calls from pipelines
- **Enhanced Security**: Automatic credential rotation

## Key Capabilities

- OIDC authentication for Datadog Agent
- API access with OIDC tokens
- Integration with cloud provider identities
- Organization and team-level controls

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Datadog OIDC authentication
- Agent configuration examples
- Kubernetes deployment with workload identity
- Cloud provider integration (AWS, GCP, Azure)
- CI/CD pipeline integration for API calls
- Troubleshooting authentication issues
- Best practices for agent deployment

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Datadog authentication workflows

## Resources

- [Datadog Documentation](https://docs.datadoghq.com/)
- [Datadog Agent](https://docs.datadoghq.com/agent/)
