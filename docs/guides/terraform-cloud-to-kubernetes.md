---
sidebar_position: 9
title: Terraform Cloud → Kubernetes
description: Configure Kubernetes (EKS/GKE) to accept OIDC authentication from Terraform Cloud for secretless deployments
slug: /guides/terraform-cloud-to-kubernetes
keywords: [kubernetes, terraform cloud, hcp terraform, oidc, eks, gke, dynamic credentials]
---

# Configure Kubernetes for Terraform Cloud Authentication

This guide shows you how to configure Kubernetes to accept OIDC authentication from Terraform Cloud (HCP Terraform), eliminating the need to store kubeconfig files or service account tokens in your workspaces.

## Platform Support

:::info Platform Compatibility
Terraform Cloud dynamic credentials for Kubernetes are **only supported on**:
- **Amazon EKS** (Elastic Kubernetes Service)
- **Google GKE** (Google Kubernetes Engine)

Self-managed Kubernetes clusters and other managed services are not currently supported.
:::

## Prerequisites

- **Kubernetes Cluster**: EKS or GKE cluster with OIDC provider configured
- **Terraform Cloud**: Organization and workspace
- **Cluster Admin Access**: Permissions to create RBAC bindings
- **Self-Hosted Agents**: v1.13.1 or later (if applicable)

## Architecture Overview

```
┌───────────────────────┐                  ┌─────────────────┐
│   Terraform Cloud     │   OIDC Token     │   EKS/GKE       │
│      Workspace        │─────────────────>│  OIDC Provider  │
└───────────────────────┘                  └─────────────────┘
          │                                        │
          │                                        ▼
          │                                 Token Validation
          │                                        │
          │                                        ▼
          │                                ┌─────────────────┐
          │                                │  Kubernetes     │
          │                                │   API Server    │
          │                                └─────────────────┘
          │                                        │
          │                                        ▼
          │                                  RBAC Evaluation
          │                                        │
          │                                        ▼
          └────────────────────────────────> Deploy Resources
                  Apply Manifests
```

## Step 1: Configure EKS/GKE OIDC Provider

### Option A: Amazon EKS

EKS clusters need an OIDC identity provider configured to trust Terraform Cloud:

#### 1.1 Get Your EKS Cluster's OIDC Provider

```bash
# Get the OIDC provider URL
aws eks describe-cluster --name my-cluster --query "cluster.identity.oidc.issuer" --output text
```

#### 1.2 Create IAM OIDC Identity Provider (if not exists)

```bash
eksctl utils associate-iam-oidc-provider \
    --cluster my-cluster \
    --approve
```

#### 1.3 Configure Terraform Cloud as Trusted Provider

The EKS cluster must be configured to accept tokens from `https://app.terraform.io`:

:::info EKS Configuration
EKS OIDC configuration is typically done at cluster creation time or requires cluster updates. Refer to the [AWS documentation on EKS OIDC authentication](https://docs.aws.amazon.com/eks/latest/userguide/authenticate-oidc-identity-provider.html) for detailed steps.

HashiCorp provides example configurations in their [learn-terraform-dynamic-credentials repository](https://github.com/hashicorp/learn-terraform-dynamic-credentials).
:::

**Key Configuration Parameters**:
- **Issuer URL**: `https://app.terraform.io` (no trailing slash)
- **Client ID / Audience**: `kubernetes` (or your custom audience)
- **Username Claim**: `sub`
- **Groups Claim**: Optional, can use `terraform_organization_name` or custom claims

### Option B: Google GKE

GKE has native support for Workload Identity Federation:

#### 1.1 Enable Workload Identity on Your Cluster

```bash
gcloud container clusters update my-cluster \
    --workload-pool=PROJECT_ID.svc.id.goog
```

#### 1.2 Configure OIDC Authentication

Create an OIDC configuration for your GKE cluster. Refer to [GCP documentation on GKE OIDC](https://cloud.google.com/kubernetes-engine/docs/how-to/oidc) for detailed steps.

**Configuration Requirements**:
- **Issuer URL**: `https://app.terraform.io`
- **Audience**: `kubernetes` (must match workspace configuration)
- **Username Claim**: `sub`

:::tip GKE Examples
HashiCorp provides GKE example configurations in their [education repository](https://github.com/hashicorp/learn-terraform-dynamic-credentials).
:::

## Step 2: Create Kubernetes RBAC Bindings

Create role bindings that map Terraform Cloud identities to Kubernetes permissions.

### Understanding User Identity Format

Terraform Cloud tokens include a `sub` claim formatted as:

```
organization:<ORG>:project:<PROJECT>:workspace:<WORKSPACE>:run_phase:<PHASE>
```

Example:
```
organization:acme-corp:project:default:workspace:production-deploy:run_phase:apply
```

### Create ClusterRole (if needed)

Define the permissions for Terraform to manage resources:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: terraform-deployer
rules:
# Allow managing deployments, services, configmaps, etc.
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets", "statefulsets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: [""]
  resources: ["services", "configmaps", "secrets", "pods"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
# Add more rules as needed
```

Apply the role:

```bash
kubectl apply -f terraform-deployer-role.yaml
```

### Bind Role to Terraform Cloud Identity

#### Option 1: Bind to Specific Workspace (Most Secure)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: terraform-production-deployer
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: terraform-deployer
subjects:
- kind: User
  name: "organization:acme-corp:project:default:workspace:production-deploy:run_phase:apply"
  apiGroup: rbac.authorization.k8s.io
```

#### Option 2: Bind to All Workspaces in a Project

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: terraform-project-deployer
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: terraform-deployer
subjects:
- kind: User
  # Use wildcard for workspace name
  name: "organization:acme-corp:project:infrastructure:workspace:*:run_phase:apply"
  apiGroup: rbac.authorization.k8s.io
```

#### Option 3: Use Group Bindings

Configure your cluster OIDC settings to extract group claims, then bind to groups:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: terraform-org-deployer
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: terraform-deployer
subjects:
- kind: Group
  name: "tfc:acme-corp:production"
  apiGroup: rbac.authorization.k8s.io
```

:::warning Security Critical
Always validate the organization name to prevent unauthorized access:

✅ **Secure**:
```yaml
name: "organization:acme-corp:project:default:workspace:*:run_phase:*"
```

❌ **Insecure** (accepts any organization):
```yaml
name: "organization:*:project:*:workspace:*:run_phase:*"
```
:::

Apply the binding:

```bash
kubectl apply -f terraform-deployer-binding.yaml
```

### Phase-Specific Permissions (Recommended)

Grant read-only access for plan phase and write access for apply:

#### Plan Phase Binding (Read-Only)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: terraform-plan-reader
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: view  # Built-in read-only role
subjects:
- kind: User
  name: "organization:acme-corp:project:default:workspace:production-deploy:run_phase:plan"
  apiGroup: rbac.authorization.k8s.io
```

#### Apply Phase Binding (Full Access)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: terraform-apply-deployer
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: terraform-deployer
subjects:
- kind: User
  name: "organization:acme-corp:project:default:workspace:production-deploy:run_phase:apply"
  apiGroup: rbac.authorization.k8s.io
```

## Step 3: Configure Terraform Cloud Workspace

Add environment variables to your Terraform Cloud workspace to enable Kubernetes dynamic credentials.

### Required Variables

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `TFC_KUBERNETES_PROVIDER_AUTH` | `true` | Enable dynamic credentials (requires agent v1.14.0+) |
| `TFC_KUBERNETES_WORKLOAD_IDENTITY_AUDIENCE` | `kubernetes` | Token audience (must match cluster config) |

:::info Agent Version
- **Cloud-hosted agents**: Automatically use the latest version
- **Self-hosted agents**: Require v1.14.0 or later for these variables
:::

### EKS-Specific Configuration

For EKS clusters, you typically need:

```hcl
TFC_KUBERNETES_PROVIDER_AUTH = true
TFC_KUBERNETES_WORKLOAD_IDENTITY_AUDIENCE = "kubernetes"
```

### GKE-Specific Configuration

For GKE clusters:

```hcl
TFC_KUBERNETES_PROVIDER_AUTH = true
TFC_KUBERNETES_WORKLOAD_IDENTITY_AUDIENCE = "kubernetes"
```

## Step 4: Configure Terraform Kubernetes Provider

Update your Terraform configuration to use dynamic credentials. **Do not** hardcode `token` or `config_path`:

### Basic Configuration

```hcl
terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
  }
}

provider "kubernetes" {
  host                   = "https://my-cluster.example.com"
  cluster_ca_certificate = base64decode(var.cluster_ca_cert)

  # Do NOT set token or config_path
  # Terraform Cloud automatically sets KUBE_TOKEN environment variable
}

# Deploy resources
resource "kubernetes_deployment" "example" {
  metadata {
    name = "example-app"
  }

  spec {
    replicas = 3
    # ...
  }
}
```

### Multiple Cluster Configuration

Use provider aliases for managing multiple clusters:

```hcl
provider "kubernetes" {
  alias                  = "production"
  host                   = "https://prod-cluster.example.com"
  cluster_ca_certificate = base64decode(var.prod_ca_cert)
}

provider "kubernetes" {
  alias                  = "staging"
  host                   = "https://staging-cluster.example.com"
  cluster_ca_certificate = base64decode(var.staging_ca_cert)
}

resource "kubernetes_deployment" "prod_app" {
  provider = kubernetes.production
  # ...
}

resource "kubernetes_deployment" "staging_app" {
  provider = kubernetes.staging
  # ...
}
```

### Using tfc_kubernetes_dynamic_credentials Variable

For advanced multi-cluster scenarios, use the special variable:

```hcl
variable "tfc_kubernetes_dynamic_credentials" {
  description = "Automatically set by Terraform Cloud"
  type = object({
    default = object({
      token = string
    })
    aliases = map(object({
      token = string
    }))
  })
  default = {
    default = { token = "" }
    aliases = {}
  }
}

provider "kubernetes" {
  host                   = var.cluster_host
  cluster_ca_certificate = base64decode(var.cluster_ca_cert)
  token                  = var.tfc_kubernetes_dynamic_credentials.default.token
}
```

## Step 5: Verify Configuration

### Test RBAC Bindings

List role bindings to verify configuration:

```bash
# Check ClusterRoleBindings
kubectl get clusterrolebindings | grep terraform

# Describe a specific binding
kubectl describe clusterrolebinding terraform-apply-deployer
```

### Run a Terraform Plan

1. Queue a plan in your Terraform Cloud workspace
2. Check the run logs for Kubernetes authentication
3. Verify the plan can read cluster state

Expected log output:
```
Initializing Kubernetes provider...
Kubernetes provider configured successfully
```

### Run a Terraform Apply

1. Queue an apply
2. Verify resources are created in the cluster
3. Check Kubernetes audit logs for the Terraform Cloud identity

```bash
# Verify deployment
kubectl get deployments
kubectl describe deployment example-app
```

## Troubleshooting

### "Unauthorized" Errors (401)

**Cause**: OIDC token validation failed

**Solutions**:
1. Verify cluster OIDC configuration points to `https://app.terraform.io`
2. Check `TFC_KUBERNETES_WORKLOAD_IDENTITY_AUDIENCE` matches cluster audience
3. Ensure self-hosted agents are v1.14.0+

### "Forbidden" Errors (403)

**Cause**: RBAC permissions not configured correctly

**Solutions**:
1. Check ClusterRoleBinding exists: `kubectl get clusterrolebindings`
2. Verify the user name matches token subject claim
3. Confirm role has necessary permissions: `kubectl describe clusterrole <role-name>`

Example debug command:
```bash
kubectl auth can-i create deployments \
  --as="organization:acme:project:default:workspace:prod:run_phase:apply"
```

### "Provider configuration not set" Errors

**Cause**: Provider block includes conflicting authentication

**Solutions**:
- Remove `token` from provider configuration
- Remove `config_path` from provider configuration
- Ensure `TFC_KUBERNETES_PROVIDER_AUTH=true` is set

### Token Expiration During Long Applies

**Cause**: OIDC tokens have limited lifetime (typically 15-60 minutes)

**Solutions**:
- Break large applies into smaller workspaces
- Use `terraform apply -target` for incremental updates
- Consider using `terraform apply -parallelism=N` to speed up applies

## Security Best Practices

### Least Privilege Access

Create specific roles for different workspace needs:

```yaml
# Read-only for plan operations
kind: ClusterRole
metadata:
  name: terraform-reader
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["get", "list", "watch"]
```

```yaml
# Limited write access for apply operations
kind: ClusterRole
metadata:
  name: terraform-deployer-limited
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
  # No delete permissions
```

### Namespace Restrictions

Use `RoleBinding` instead of `ClusterRoleBinding` to limit scope:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: terraform-production-deployer
  namespace: production  # Only access production namespace
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: terraform-deployer
subjects:
- kind: User
  name: "organization:acme-corp:project:default:workspace:prod-deploy:run_phase:apply"
```

### Audit Logging

Enable Kubernetes audit logging to track Terraform operations:

```yaml
# audit-policy.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: RequestResponse
  users:
  - "organization:acme-corp:*"  # Log all Terraform Cloud operations
```

### Network Policies

Restrict Terraform-deployed workloads with Network Policies:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: terraform-deployed-apps
spec:
  podSelector:
    matchLabels:
      managed-by: terraform
  policyTypes:
  - Ingress
  - Egress
  # Define allowed traffic
```

## Advanced Configuration

### Custom Audience Claims

Use custom audience for additional security:

**Terraform Cloud Workspace**:
```hcl
TFC_KUBERNETES_WORKLOAD_IDENTITY_AUDIENCE = "my-custom-audience"
```

**Cluster OIDC Configuration**:
Update client ID / audience to match `my-custom-audience`

### Conditional Access Based on Workspace

Use admission controllers or OPA to enforce policies:

```rego
# Example OPA policy
package kubernetes.admission

deny[msg] {
  # Only allow production workspace to deploy to prod namespace
  input.request.namespace == "production"
  not regex.match(".*workspace:production-deploy:.*", input.request.userInfo.username)
  msg := "Only production workspace can deploy to production namespace"
}
```

## Additional Resources

- [Terraform Cloud Dynamic Credentials Overview](../initiators/infrastructure-as-code/terraform-cloud.md)
- [Kubernetes OIDC Authentication Overview](../providers/kubernetes/overview.md)
- [Kubernetes OIDC Authentication](https://kubernetes.io/docs/reference/access-authn-authz/authentication/#openid-connect-tokens)
- [EKS OIDC Provider Setup](https://docs.aws.amazon.com/eks/latest/userguide/authenticate-oidc-identity-provider.html)
- [GKE Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)
- [HashiCorp Learn: Dynamic Credentials](https://developer.hashicorp.com/terraform/tutorials/cloud/dynamic-credentials)
