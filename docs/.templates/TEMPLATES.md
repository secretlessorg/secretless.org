# Documentation Templates

This document defines the standard templates for creating provider, initiator, and integration guide pages. Following these templates ensures consistency, readability, and maintainability across the documentation.

## Template Philosophy

- **Focused Information**: Only include relevant details for the specific page type
- **No Cross-Contamination**: Don't add initiator examples on provider pages or vice versa
- **Bottom-Linked Guides**: Related integration guides are linked at the bottom, grouped by category
- **Consistent Structure**: All pages of the same type follow identical sections
- **Multiple Implementation Paths**: Guides provide Terraform, CLI, and platform-specific options via tabs

---

## Provider Page Template

Providers are services that **accept** secretless authentication. These pages document how to configure a provider to trust external identity providers via OIDC or similar mechanisms.

### Structure

```markdown
---
sidebar_position: [number]
title: [Provider Name] - Secretless Authentication
description: Configure [Provider Name] to accept OIDC-based secretless authentication from external services
keywords: [provider-name, oidc, secretless, authentication, trust policy]
---

# [Provider Name] - Secretless Authentication

[1-2 sentence overview of what this provider is and why secretless auth matters for it]

## Overview

[2-3 paragraphs explaining]:
- What secretless authentication means for this provider
- The authentication mechanism used (OIDC, Workload Identity, etc.)
- Key benefits specific to this provider

## How It Works

[Architecture explanation with optional Mermaid diagram showing the auth flow]

```mermaid
sequenceDiagram
    [Flow diagram here]
```

**Key Components:**
- **Component 1**: Description
- **Component 2**: Description

## Configuration Requirements

### Prerequisites
- Prerequisite 1
- Prerequisite 2

### Required Attributes

Document the key attributes/properties that must be configured:

| Attribute | Description | Example | Required |
|-----------|-------------|---------|----------|
| `attribute_name` | What it does | `example-value` | Yes/No |

### Trust Policy Selectors

Document available selectors/claims that can be used in trust policies:

| Selector | Description | Example Value | Use Case |
|----------|-------------|---------------|----------|
| `selector_name` | What it represents | `example:value` | When to use it |

## SDK and CLI Usage

### Environment Variables

Document environment variables that SDKs/CLIs use:

| Variable | Description | Example | SDK Support |
|----------|-------------|---------|-------------|
| `ENV_VAR_NAME` | What it configures | `value` | AWS SDK, Azure SDK |

### SDK Configuration

```language
// Code example showing SDK usage
```

### CLI Configuration

```bash
# CLI commands and configuration
```

## Setup Guide

### Step 1: [First Configuration Step]

[Instructions]

### Step 2: [Second Configuration Step]

[Instructions]

## Verification

How to verify the configuration is working:

```bash
# Test commands
```

## Best Practices

- Best practice 1
- Best practice 2

## Security Considerations

- Security consideration 1
- Security consideration 2

## Troubleshooting

### Common Issue 1
**Symptoms**: [Description]
**Solution**: [Resolution]

### Common Issue 2
**Symptoms**: [Description]
**Solution**: [Resolution]

## Related Integration Guides

Choose this provider for secretless authentication from:

### CI/CD Tools
- [Initiator → Provider Guide](#)
- [Initiator → Provider Guide](#)

### Infrastructure as Code
- [Initiator → Provider Guide](#)

### Runtime Environments
- [Initiator → Provider Guide](#)

## Additional Resources

- [Official Documentation](#)
- [API Reference](#)
```

### Example Provider Attributes

**AWS IAM Role Trust Policy:**
- Attributes: Role ARN, Session Name, Session Duration
- Selectors: `aud`, `sub`, custom claims
- Environment Variables: `AWS_ROLE_ARN`, `AWS_WEB_IDENTITY_TOKEN_FILE`, `AWS_REGION`

**GCP Workload Identity:**
- Attributes: Service Account Email, Project ID, Pool ID
- Selectors: `google.subject`, `attribute.repository`, `attribute.actor`
- Environment Variables: `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_CLOUD_PROJECT`

**Azure Federated Credentials:**
- Attributes: Subject Identifier, Issuer URL, Audience
- Selectors: `subject`, `issuer`, custom attributes
- Environment Variables: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_FEDERATED_TOKEN_FILE`

---

## Initiator Page Template

Initiators are services that **generate** identity tokens to authenticate with providers. These pages document how an initiator produces tokens and what claims are available.

### Structure

```markdown
---
sidebar_position: [number]
title: [Initiator Name] - OIDC Token Generation
description: Use [Initiator Name] to generate OIDC tokens for secretless authentication with cloud providers
keywords: [initiator-name, oidc, jwt, identity token, claims]
---

# [Initiator Name] - OIDC Token Generation

[1-2 sentence overview of what this initiator is and what tokens it generates]

## Overview

[2-3 paragraphs explaining]:
- What this initiator is
- How it generates identity tokens
- What providers can consume these tokens

## Token Generation

### How It Works

[Explanation of the token generation mechanism]

```mermaid
sequenceDiagram
    [Flow diagram showing token generation]
```

### Token Availability

When and where tokens are available:
- **Availability**: Automatic / On-demand / Configuration required
- **Scope**: Per workflow / Per job / Per step
- **Lifetime**: Duration of token validity

## Token Claims

Standard claims included in the generated JWT:

| Claim | Description | Example Value |
|-------|-------------|---------------|
| `iss` | Token issuer | `https://token.issuer.url` |
| `sub` | Subject identifier | `repo:org/repo:ref:refs/heads/main` |
| `aud` | Audience | `https://provider.example.com` |

### Custom Claims

Additional claims specific to this initiator:

| Claim | Description | Example Value | Use Case |
|-------|-------------|---------------|----------|
| `claim_name` | What it represents | `value` | When to filter on it |

## Configuration

### Basic Setup

How to enable OIDC token generation:

```yaml
# Configuration example
```

### Advanced Options

| Option | Description | Default | Valid Values |
|--------|-------------|---------|--------------|
| `option_name` | What it does | `default` | `value1`, `value2` |

### Environment Variables

Variables automatically set by the initiator:

| Variable | Description | Example Value | Available When |
|----------|-------------|---------------|----------------|
| `VAR_NAME` | What it contains | `value` | During workflow |

## Token Access

How to access the generated token:

### Method 1: [Primary Access Method]

```language
# Code example
```

### Method 2: [Alternative Access Method]

```language
# Code example
```

## Inspecting Tokens

How to decode and inspect the token locally:

```bash
# Commands to view token claims
```

## Best Practices

- Best practice 1
- Best practice 2

## Limitations

- Limitation 1
- Limitation 2

## Related Integration Guides

Use [Initiator Name] tokens to authenticate with:

### Cloud Providers
- [Initiator → Provider Guide](#)
- [Initiator → Provider Guide](#)

### Secret Management
- [Initiator → Provider Guide](#)

### Container Platforms
- [Initiator → Provider Guide](#)

## Additional Resources

- [Official Documentation](#)
- [Token Specification](#)
```

### Example Initiator Claims

**GitHub Actions:**
- Standard: `iss`, `sub`, `aud`, `exp`, `iat`, `nbf`
- Custom: `repository`, `repository_owner`, `workflow`, `ref`, `sha`, `actor`
- Environment: `ACTIONS_ID_TOKEN_REQUEST_URL`, `ACTIONS_ID_TOKEN_REQUEST_TOKEN`

**GitLab CI:**
- Standard: `iss`, `sub`, `aud`, `exp`, `iat`, `nbf`
- Custom: `project_id`, `project_path`, `namespace_id`, `namespace_path`, `pipeline_id`, `ref`, `ref_type`
- Environment: `CI_JOB_JWT_V2`, `CI_SERVER_URL`

**Terraform Cloud:**
- Standard: `iss`, `sub`, `aud`, `exp`, `iat`
- Custom: `terraform_organization_id`, `terraform_organization_name`, `terraform_workspace_id`, `terraform_workspace_name`
- Environment: `TFC_WORKLOAD_IDENTITY_TOKEN`, `TFC_WORKLOAD_IDENTITY_AUDIENCE`

---

## Integration Guide Template

Integration guides provide complete, step-by-step instructions for connecting a specific initiator with a specific provider.

### Structure

```markdown
---
title: [Initiator] to [Provider] - Secretless Authentication
description: Complete guide to set up OIDC authentication between [Initiator] and [Provider] without storing long-lived credentials
keywords: [initiator-name, provider-name, oidc, secretless, authentication, integration]
---

# [Initiator] to [Provider] - Secretless Authentication

Connect [Initiator] to [Provider] using OpenID Connect (OIDC) for secretless authentication - no long-lived credentials required.

## Overview

[2-3 sentences explaining what this guide accomplishes]

**Time Required**: [X-Y] minutes
**Difficulty**: Beginner/Intermediate/Advanced

### What You'll Accomplish

- ✓ Configure [Provider] to trust [Initiator] tokens
- ✓ Set up trust policies with appropriate filters
- ✓ Implement the authentication flow in [Initiator]
- ✓ Test and verify the configuration

### Benefits

- No long-lived credentials stored in [Initiator]
- Automatic token rotation
- Fine-grained access control via trust policies
- Audit trail of authentication events

## Prerequisites

### [Provider] Requirements
- Requirement 1
- Requirement 2

### [Initiator] Requirements
- Requirement 1
- Requirement 2

### Knowledge Requirements
- Understanding of [concept 1]
- Familiarity with [concept 2]

## Planning Your Implementation

Before starting, decide:

1. **Trust Policy Scope**: [Guidance on scope]
2. **Permissions Level**: [Guidance on permissions]
3. **Token Audience**: [Guidance on audience]

## Architecture

```mermaid
sequenceDiagram
    [Complete flow diagram showing the integration]
```

**Flow Explanation:**
1. Step 1 description
2. Step 2 description
3. Step 3 description

## Implementation

### Step 1: Configure [Provider]

[Brief description of what this step accomplishes]

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="implementation-method">
  <TabItem value="terraform" label="Terraform" default>

```hcl
# Terraform code
```

**Explanation:** Line-by-line explanation of key configurations

  </TabItem>
  <TabItem value="cli" label="CLI">

```bash
# CLI commands
```

**Explanation:** What each command does

  </TabItem>
  <TabItem value="console" label="[Platform] Console">

Navigate to [location], click [button], and enter [values]

  </TabItem>
</Tabs>

### Step 2: Configure Trust Policy

[Brief description]

<Tabs groupId="implementation-method">
  <TabItem value="terraform" label="Terraform" default>

```hcl
# Trust policy in Terraform
```

**Key Selectors:** `selector1` (Description), `selector2` (Description)

  </TabItem>
  <TabItem value="cli" label="CLI">

```bash
# CLI commands for trust policy
```

  </TabItem>
  <TabItem value="console" label="[Platform] Console">

Follow the console steps to configure the trust policy

  </TabItem>
</Tabs>

### Step 3: Configure [Initiator]

[Brief description]

```yaml
# Initiator configuration (usually single format)
```

**Configuration Details:**
- `field1`: Explanation
- `field2`: Explanation

## Testing and Verification

### Test the Integration

1. Trigger a test run
2. Verify token generation
3. Confirm authentication success

```bash
# Verification commands
```

### Expected Output

```
# Sample successful output
```

## Production Hardening

### Security Best Practices

1. **Narrow Trust Policies**: [Guidance]
2. **Least Privilege Permissions**: [Guidance]
3. **Audience Validation**: [Guidance]

### Recommended Trust Policy Filters

| Filter | Example | Security Benefit |
|--------|---------|------------------|
| `filter1` | `value` | Benefit |

### Monitoring and Auditing

- Where to find auth logs
- What to monitor
- How to set up alerts

## Troubleshooting

### Issue: Token Not Generated

**Symptoms:**
- Error messages

**Solutions:**
1. Solution 1
2. Solution 2

### Issue: Authentication Denied

**Symptoms:**
- Error messages

**Solutions:**
1. Solution 1
2. Solution 2

### Issue: Permissions Errors

**Symptoms:**
- Error messages

**Solutions:**
1. Solution 1
2. Solution 2

## Complete Example

<Tabs groupId="implementation-method">
  <TabItem value="terraform" label="Complete Terraform Example" default>

```hcl
# Full working Terraform configuration
```

  </TabItem>
  <TabItem value="cli" label="Complete CLI Example">

```bash
# All CLI commands in sequence
```

  </TabItem>
</Tabs>

## Next Steps

- [Related guide 1]
- [Related guide 2]
- [Advanced configuration topic]

## Additional Resources

- [Initiator Documentation](#)
- [Provider Documentation](#)
- [OIDC Specification](https://openid.net/specs/openid-connect-core-1_0.html)
```

### Tab Group Guidelines

**Use `groupId="implementation-method"` for consistency**: This allows users to select their preferred method once, and all tabs in the guide will sync to that selection.

**Tab Order:**
1. **Terraform** (default): Most popular IaC option
2. **CLI**: Cloud provider CLI or tool-specific CLI
3. **Platform Console**: Web UI for manual setup

**When to Use Tabs:**
- Provider configuration (Terraform vs CLI vs Console)
- Trust policy creation (multiple implementation methods)
- Complete examples (full configurations)

**When NOT to Use Tabs:**
- Initiator configuration (usually single YAML/config format)
- Testing steps (same regardless of setup method)
- Architecture diagrams (same for all)

---

## Docusaurus Typography Features

### Admonitions

Use for important callouts:

```markdown
:::note
Standard information
:::

:::tip
Helpful tips and best practices
:::

:::info
Additional context
:::

:::warning
Important warnings
:::

:::danger
Critical security warnings
:::
```

### Code Blocks with Highlights

```markdown
```javascript {2,4-6}
// Line 2 is highlighted
// Lines 4-6 are highlighted
```
```

### Details/Summary

```markdown
<details>
<summary>Click to expand additional information</summary>

Hidden content here

</details>
```

### Inline TOC

```markdown
import TOCInline from '@theme/TOCInline';

<TOCInline toc={toc} />
```

## Checklist for New Pages

Before publishing a new page, ensure:

- [ ] Frontmatter includes title, description, keywords
- [ ] Page follows the appropriate template structure
- [ ] Only relevant information is included (no cross-contamination)
- [ ] Related guides are linked at the bottom, grouped by category
- [ ] Mermaid diagrams are used where helpful
- [ ] Tabs are used for multiple implementation methods (guides only)
- [ ] Code examples are tested and accurate
- [ ] Typography features enhance readability
- [ ] Security best practices are highlighted
- [ ] Troubleshooting section addresses common issues

## Template Maintenance

These templates are living documents. Update them when:
- New implementation patterns emerge
- User feedback suggests improvements
- New Docusaurus features become available
- Common questions reveal missing sections

Last Updated: 2025-11-12
