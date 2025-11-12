---
sidebar_position: 4
title: Ansible Automation Platform
description: Use Ansible Automation Platform with secretless OIDC authentication
keywords: [ansible, automation platform, oidc, secretless, configuration management]
---

# Ansible Automation Platform Secretless Authentication

Ansible Automation Platform supports OIDC authentication for accessing cloud providers and managed nodes.

## Overview

Ansible Automation Platform's OIDC support enables playbook execution without storing cloud credentials or SSH keys. This provides:

- **No Stored Credentials**: OIDC tokens replace cloud provider credentials
- **Cloud Provider Integration**: AWS, GCP, Azure authentication
- **Credential-Free Execution**: Dynamic credential provisioning
- **Enhanced Security**: Temporary credentials for automation jobs

## Key Capabilities

- OIDC authentication for cloud providers
- Integration with cloud provider identity systems
- Job-level credential provisioning
- Organization and team-level controls

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete setup guide for Ansible Automation Platform OIDC
- Cloud provider credential configuration
- Job template setup with OIDC
- AWS, GCP, Azure collection configuration
- Kubernetes inventory with workload identity
- Troubleshooting authentication issues
- Best practices for credential management
- Migration from stored credentials

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your Ansible OIDC workflows

## Resources

- [Ansible Automation Platform Documentation](https://docs.ansible.com/)
- [Ansible Collections](https://docs.ansible.com/ansible/latest/collections/)

