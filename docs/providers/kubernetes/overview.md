---
sidebar_position: 1
title: Kubernetes OIDC Authentication
description: Configure Kubernetes to accept secretless OIDC authentication from external services
slug: /providers/kubernetes
keywords: [kubernetes, k8s, oidc, secretless, workload identity, service account]
---

# Kubernetes Secretless Authentication

Kubernetes supports secretless authentication through **OIDC (OpenID Connect) authentication**, allowing external services to authenticate without storing static tokens or kubeconfig files.

## How It Works

Kubernetes can validate OIDC tokens from trusted identity providers:

1. **OIDC Provider Configuration**: The Kubernetes API server is configured with an OIDC issuer URL
2. **Token Presentation**: An external service presents an OIDC token to the Kubernetes API
3. **Token Validation**: The API server validates the token using the OIDC provider's public keys
4. **RBAC Mapping**: Kubernetes maps the validated identity to RBAC roles based on token claims (username, groups)
5. **Resource Access**: The authenticated service can perform operations allowed by its RBAC bindings

## Platform Support

OIDC authentication for Kubernetes varies by platform:

### Native Support
- **Amazon EKS**: Built-in OIDC provider integration with IAM roles for service accounts (IRSA)
- **Google GKE**: Workload Identity integration with GCP service accounts
- **Azure AKS**: Workload identity federation with Azure AD

### Manual Configuration
- **Self-Managed Kubernetes**: Requires API server configuration flags
- **Other Managed Kubernetes**: Check provider documentation for OIDC support

## Key Features

- **No Static Credentials**: Eliminate kubeconfig files with long-lived tokens
- **Ephemeral Access**: Tokens are short-lived and expire automatically
- **Fine-Grained RBAC**: Map external identities to Kubernetes roles and cluster roles
- **Audit Trail**: All operations are logged with the external identity's claims
- **Cross-Cloud Integration**: External services can access multiple clusters using the same identity provider

## Common Use Cases

### 1. CI/CD Pipeline Access

CI/CD platforms can deploy to Kubernetes without storing kubeconfig files:

- **Terraform Cloud**: Deploy Kubernetes resources during Terraform runs
- **GitHub Actions**: Apply manifests using OIDC tokens from GitHub
- **GitLab CI**: Use job tokens to authenticate to Kubernetes
- **Argo CD**: Sync applications using OIDC credentials

### 2. Multi-Cluster Management

External tools can manage multiple clusters with centralized authentication:

- **Cluster Management**: Tools like Rancher, Lens, or kubectl can authenticate across clusters
- **GitOps**: ArgoCD and Flux can sync to multiple clusters
- **Policy Enforcement**: Open Policy Agent (OPA) can validate policies across clusters

### 3. Service-to-Service Authentication

Applications running outside Kubernetes can access cluster resources:

- **External Databases**: Applications can fetch Kubernetes secrets or ConfigMaps
- **Monitoring Systems**: Prometheus can scrape metrics from multiple clusters
- **Logging Aggregators**: Fluentd/Logstash can collect logs from clusters

## Authentication Methods

### OIDC Token Projection

The recommended method for external services:

```yaml
# Kubernetes validates tokens from trusted OIDC providers
# No static credentials needed in the cluster
```

**Benefits**:
- Tokens are obtained dynamically from the OIDC provider
- Short-lived (typically minutes to hours)
- Automatically refreshed by the client
- Can carry custom claims for fine-grained authorization

### Service Account Token Projection (Internal)

For workloads running inside Kubernetes:

```yaml
# Pods automatically receive projected service account tokens
# Useful for pod-to-API-server communication
```

**Note**: This guide focuses on **external** authentication using OIDC tokens from external identity providers.

## RBAC Configuration

After OIDC authentication succeeds, Kubernetes uses RBAC to authorize operations:

### Role Bindings for External Identities

Map OIDC identities to Kubernetes roles:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: external-deployer
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: User
  name: "organization:my-org:project:my-project:workspace:my-workspace:run_phase:apply"
  apiGroup: rbac.authorization.k8s.io
```

### Group-Based Authorization

Use OIDC group claims for easier management:

```yaml
subjects:
- kind: Group
  name: "tfc:my-org:production"
  apiGroup: rbac.authorization.k8s.io
```

### Phase-Specific Permissions

Grant different permissions for different run phases:

```yaml
# Read-only for plan phase
- kind: User
  name: "organization:my-org:*:run_phase:plan"

# Full access for apply phase
- kind: User
  name: "organization:my-org:*:run_phase:apply"
```

## Security Best Practices

:::warning Critical Security Considerations
- **Validate Audience**: Always verify the token audience to prevent replay attacks
- **Restrict Organizations**: Bind roles to specific organizations to prevent cross-tenant access
- **Minimum Privileges**: Grant the least privileges necessary for each identity
- **Regular Audits**: Review RBAC bindings regularly to remove stale permissions
- **Network Policies**: Combine OIDC auth with Network Policies for defense in depth
:::

### Secure RBAC Bindings

Always include organization validation:

```yaml
subjects:
- kind: User
  # ✅ SECURE: Validates organization
  name: "organization:my-org:workspace:production:*"

  # ❌ INSECURE: Accepts any organization
  # name: "organization:*:workspace:production:*"
```

## Integration Guides

Each Kubernetes platform has different setup requirements:

- [Terraform Cloud → Kubernetes (EKS/GKE)](../../guides/terraform-cloud-to-kubernetes.md)
- GitHub Actions → Kubernetes (Coming Soon)
- GitLab CI → Kubernetes (Coming Soon)

## Architecture Patterns

### Pattern 1: Direct OIDC Authentication

```
┌──────────────────┐         OIDC Token          ┌────────────────┐
│  External Service│ ─────────────────────────> │  Kubernetes    │
│  (GitHub Actions)│                             │  API Server    │
└──────────────────┘                             └────────────────┘
         │                                              │
         │                                              ▼
         │                                         RBAC Evaluation
         │                                              │
         │                                              ▼
         └─────────────────────────────────────> Pod/Resource
                      Access Granted                Access
```

### Pattern 2: Platform-Native Integration

```
┌──────────────────┐      Workload Identity      ┌────────────────┐
│  Terraform Cloud │ ────────────────────────> │  EKS/GKE       │
└──────────────────┘                             │  OIDC Provider │
                                                  └────────────────┘
                                                         │
                                                         ▼
                                                  ┌────────────────┐
                                                  │  Kubernetes    │
                                                  │  API Server    │
                                                  └────────────────┘
```

## Troubleshooting

### Token Validation Failures

**Symptoms**: `401 Unauthorized` errors

**Causes**:
- OIDC issuer URL mismatch
- Token expired
- Audience claim doesn't match

**Solutions**:
- Verify API server OIDC configuration
- Check token expiration time
- Validate audience claim matches expected value

### RBAC Permission Denied

**Symptoms**: `403 Forbidden` errors

**Causes**:
- No role binding for the identity
- Role doesn't have required permissions
- Username/group claim mismatch

**Solutions**:
- Check role bindings: `kubectl get clusterrolebindings`
- Verify the username from token matches the binding
- Review role permissions: `kubectl describe role <role-name>`

## Additional Resources

- [Kubernetes Authentication Documentation](https://kubernetes.io/docs/reference/access-authn-authz/authentication/#openid-connect-tokens)
- [Kubernetes RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [EKS OIDC Provider Documentation](https://docs.aws.amazon.com/eks/latest/userguide/authenticate-oidc-identity-provider.html)
- [GKE Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)
