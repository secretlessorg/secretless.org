---
sidebar_position: 1
title: Terraform Cloud / HCP Terraform
description: Configure Terraform Cloud (HCP Terraform) to use dynamic provider credentials for secretless authentication to cloud providers
slug: /initiators/terraform-cloud
keywords: [terraform cloud, hcp terraform, dynamic credentials, oidc, secretless, workload identity]
---

# Terraform Cloud Dynamic Provider Credentials

Terraform Cloud (also known as HCP Terraform) supports **dynamic provider credentials** that generate temporary, short-lived credentials for each Terraform run. This eliminates the need to store static credentials in workspaces, significantly improving your security posture.

## How It Works

Terraform Cloud uses OpenID Connect (OIDC) workload identity tokens to establish trust with cloud providers:

1. **Token Generation**: HCP Terraform generates an OIDC-compliant workload identity token containing organization, workspace, and run stage information
2. **Authentication**: The token is sent to your cloud platform during plan/apply operations
3. **Verification**: Your cloud platform verifies the token using HCP Terraform's public signing key
4. **Credential Issuance**: Upon verification, temporary credentials are returned and injected into the run environment
5. **Automatic Cleanup**: After the run completes, the run environment is destroyed and credentials are discarded

This secretless authentication model eliminates manual credential rotation and management overhead.

## Supported Providers

Terraform Cloud can authenticate to the following providers using dynamic credentials:

- **[AWS](../../providers/aws/oidc-setup.md)** - Using IAM roles and OIDC federation
- **[Google Cloud Platform](../../providers/gcp/workload-identity-federation.md)** - Using Workload Identity Federation
- **[Azure](../../providers/azure/federated-credentials.md)** - Using Federated Credentials
- **[HashiCorp Vault](../../providers/vault/overview.md)** - Using JWT authentication backend
- **[Kubernetes](../../providers/kubernetes/overview.md)** - Using OIDC authentication (EKS and GKE only)
- **HCP** - HashiCorp Cloud Platform

Additionally, you can use **Vault-backed dynamic credentials** to leverage Vault's secrets engines for generating temporary credentials for AWS, GCP, or Azure without exposing OIDC metadata endpoints to the public internet.

## Key Benefits

- **No Static Credentials**: Eliminates the need to store and rotate long-lived credentials
- **Reduced Blast Radius**: Each run uses unique, short-lived credentials that expire automatically
- **Fine-Grained Access Control**: Configure access based on run metadata (organization, workspace, project, run phase)
- **Automated Lifecycle Management**: Credentials are automatically provisioned and destroyed
- **Centralized Security**: Manage authentication policies in your cloud provider's IAM system

## Configuration Overview

Setting up dynamic provider credentials involves two main steps:

### 1. Configure Your Cloud Provider

You must establish a trust relationship between your cloud provider and HCP Terraform. This typically involves:

- Creating an OIDC identity provider pointing to `https://app.terraform.io` (or your Terraform Enterprise URL)
- Defining roles/service accounts that HCP Terraform can assume
- Setting up trust policies with conditions that validate:
  - **Audience claim**: Prevents tokens from being used elsewhere
  - **Organization name**: Ensures only your organization can access the role
  - **Workspace/project**: Optionally restrict to specific workspaces
  - **Run phase**: Optionally separate permissions for plan vs. apply

:::warning Security Best Practice
Always validate at minimum the **audience** and **organization name** in your trust policies to prevent unauthorized access from other HCP Terraform organizations.
:::

### 2. Configure Your Terraform Cloud Workspace

Add environment variables to your workspace to enable dynamic credentials:

- Set provider-specific variables (e.g., `TFC_AWS_PROVIDER_AUTH=true`)
- Specify the role/service account to use
- Configure optional settings like custom audiences or phase-specific roles

These variables can be set at the workspace level or in variable sets for reuse across multiple workspaces.

## Run Phase Separation

Dynamic credentials support separate roles for **plan** and **apply** phases, enabling you to implement least-privilege access:

- **Plan phase**: Read-only access to assess changes
- **Apply phase**: Write access to create/modify/destroy resources

This is configured using phase-specific variables:
- `TFC_<PROVIDER>_PLAN_ROLE_ARN` for plan operations
- `TFC_<PROVIDER>_APPLY_ROLE_ARN` for apply operations

The OIDC token's subject claim includes the run phase, allowing your provider to validate which phase is executing.

## Requirements

- **HCP Terraform**: Available for all users
- **Terraform Enterprise**: Requires recent versions
- **Self-Hosted Agents**: Minimum versions vary by provider (typically v1.7.0+, check provider-specific documentation)
- **Provider Configuration**: Must not include static credentials that would interfere with dynamic credentials

## Integration Guides

Select your cloud provider to see detailed setup instructions:

- [Terraform Cloud → AWS](../../guides/terraform-cloud-to-aws.md)
- [Terraform Cloud → GCP](../../guides/terraform-cloud-to-gcp.md)
- [Terraform Cloud → Azure](../../guides/terraform-cloud-to-azure.md)
- [Terraform Cloud → Vault](../../guides/terraform-cloud-to-vault.md)
- [Terraform Cloud → Kubernetes](../../guides/terraform-cloud-to-kubernetes.md)

## Additional Resources

- [HashiCorp Terraform Cloud Dynamic Credentials Documentation](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/dynamic-provider-credentials)
- [Dynamic Credentials Tutorial](https://developer.hashicorp.com/terraform/tutorials/cloud/dynamic-credentials)
- [Vault-Backed Dynamic Credentials](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/dynamic-provider-credentials/vault-backed)
