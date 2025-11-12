# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Secretless.cloud is a documentation website built to promote secretless authentication workflows and discourage the use of long-lived authentication tokens. The site documents how to integrate services using secretless techniques like OIDC connections and just-in-time authentication across major cloud providers (AWS, GCP, Azure, Kubernetes, Cloudflare) and CI/CD tools.

**Tech Stack:**
- Docusaurus 3.9.2 (static site generator)
- React 19.0.0
- TypeScript 5.6.2
- MDX 3.0.0 (Markdown with JSX)
- Node.js >= 20.0 required

## Terminology Guidelines

**CRITICAL: Promote "Secretless" over "OIDC"**

The term "Secretless" should be used prominently throughout the site as the primary terminology for describing authentication without long-lived credentials. While OIDC (OpenID Connect) is the underlying implementation mechanism, it's a technical detail that's not intuitive for most users.

**When to Use "Secretless":**
- User-facing titles and headings
- Marketing copy and introductions
- High-level concept explanations
- SEO-focused content (titles, descriptions, keywords)
- Navigation labels and categories
- General authentication workflow descriptions

**When OIDC is Appropriate:**
- Technical implementation details
- Provider-specific configuration (e.g., "AWS IAM OIDC Provider")
- When referring to specific protocols or standards
- Technical documentation where precision is required
- Code examples and API references
- When the provider or tool specifically uses "OIDC" in their terminology

**Examples:**
- ✅ "Configure Secretless Authentication from GitHub Actions to AWS"
- ❌ "Configure OIDC Authentication from GitHub Actions to AWS"
- ✅ "Set up the AWS IAM OIDC provider to accept secretless authentication"
- ✅ "This guide covers secretless workflows using OIDC tokens"

**Content Review Checklist:**
- Page titles should emphasize "Secretless" terminology
- Introductions should lead with "Secretless" concepts
- Technical sections can mention OIDC as the implementation mechanism
- Keywords in frontmatter should prioritize "secretless" over "oidc"

## Development Commands

```bash
# Development
npm start              # Start dev server at http://localhost:3000 with hot reload

# Building
npm run build          # Create production build in /build directory
npm run serve          # Preview production build locally
npm run clear          # Clear Docusaurus build cache

# Type Checking
npm run typecheck      # Run TypeScript compiler checks

# Deployment (GitHub Pages)
GIT_USER=<username> npm run deploy           # Deploy using GitHub credentials
USE_SSH=true npm run deploy                  # Deploy using SSH

# Theme Customization
npm run swizzle        # Eject/customize Docusaurus theme components
```

**Note:** Project uses bun.lock but works with npm, yarn, or bun.

## Development Workflow

**CRITICAL: Always Build Before Committing**

Before creating any git commits, you MUST run the build process to ensure:
- TypeScript compilation succeeds
- No build errors are introduced
- All dependencies resolve correctly
- Generated static site builds successfully

**Pre-commit Checklist:**
1. Run `npm run build` (or `bun run build`)
2. Verify build completes without errors
3. Optionally run `npm run serve` to preview production build
4. Review changes with `git diff`
5. Create commit only after successful build

**If Build Fails:**
- Fix all TypeScript errors
- Resolve any missing dependencies
- Check for broken imports or invalid MDX syntax
- Re-run build until it succeeds
- Never commit broken code

This ensures the main branch always remains in a deployable state and prevents CI/CD failures.

## Architecture

**Static Site Generation:** Docusaurus pre-renders all pages at build time for optimal performance and SEO.

**Key Directories:**
- `/docs/` - Main documentation content (Markdown/MDX files)
- `/blog/` - Blog posts with date-based naming (YYYY-MM-DD-title.md)
- `/src/components/` - Reusable React components
- `/src/pages/` - Static pages (automatically routed by filename)
- `/static/` - Static assets (images, favicon, etc.)
- `/build/` - Generated production build (gitignored)

**Navigation:** Sidebars are auto-generated from the `/docs` folder structure. Configure via `sidebars.ts` or use `_category_.json` files in folders to customize categories.

**Configuration Files:**
- `docusaurus.config.ts` - Main site configuration (title, URL, theme, plugins)
- `sidebars.ts` - Sidebar navigation structure
- `src/css/custom.css` - Theme customization and CSS variables

## Content Organization Strategy

The site should be organized to map providers (services that accept auth) with initiators (services that initiate auth) and provide service-to-service integration guides:

```
docs/
├── intro.md                      # Getting started with secretless workflows
├── concepts/                     # Core concepts
│   ├── what-is-secretless.md
│   ├── oidc-authentication.md
│   └── just-in-time-auth.md
├── providers/                    # Services that accept secretless auth
│   ├── aws/
│   ├── gcp/
│   ├── azure/
│   ├── kubernetes/
│   └── cloudflare/
├── initiators/                   # Services that initiate auth
│   ├── ci-tools/
│   │   ├── github-actions.md
│   │   └── gitlab-ci.md
│   ├── compute-runtime/
│   │   └── kubernetes.md
│   └── infrastructure-as-code/
│       └── terraform-cloud.md
└── guides/                       # Service-to-service integration guides
    ├── github-actions-to-aws.md
    ├── kubernetes-to-aws.md
    ├── kubernetes-to-gcp.md
    └── kubernetes-to-azure.md
```

### Separation of Concerns: Initiators vs Integration Guides

**CRITICAL PRINCIPLE:** Initiator documentation must NEVER contain provider-specific setup instructions. Provider-specific information belongs exclusively in integration guides.

**Initiator Documentation Should Contain:**
- How the initiator generates OIDC tokens
- What claims are included in the tokens
- How to configure token generation (audiences, lifetimes, etc.)
- How to access/read generated tokens
- Generic best practices for token security
- Links to relevant integration guides

**Initiator Documentation Should NEVER Contain:**
- Provider-specific OIDC setup (e.g., AWS IAM role creation, GCP service account binding)
- Provider-specific trust policies
- Provider-specific authentication flows beyond token generation
- Cloud provider CLI commands or Terraform configurations
- Step-by-step provider setup instructions

**Integration Guides Should Contain:**
- Complete end-to-end setup for specific initiator → provider combinations
- Provider-specific OIDC configuration
- Trust policy examples with claim validation
- Permissions/IAM policy configuration
- Testing and verification steps
- Troubleshooting specific to that integration
- Complete working examples (Terraform, CLI scripts, etc.)

**Example - Kubernetes Documentation Structure:**

✅ **CORRECT: `/docs/initiators/compute-runtime/kubernetes.md`**
```markdown
# Kubernetes Workload Identity

- How Service Account Token Projection works
- Token claims (iss, sub, aud, kubernetes.io/*)
- Configuration parameters (expirationSeconds, audience, path)
- How to mount and access tokens
- Generic security best practices
- Links to: kubernetes-to-aws.md, kubernetes-to-gcp.md, kubernetes-to-azure.md
```

✅ **CORRECT: `/docs/guides/kubernetes-to-aws.md`**
```markdown
# Kubernetes to AWS Integration Guide

- Prerequisites (EKS or self-managed cluster)
- AWS IAM OIDC provider setup
- IAM role creation with trust policy
- ServiceAccount annotation (eks.amazonaws.com/role-arn)
- Complete testing and verification
- AWS-specific troubleshooting
- Full Terraform/CLI examples
```

❌ **INCORRECT: Mixing in initiator doc**
```markdown
# Kubernetes Workload Identity

## AWS IRSA Setup  ← NO! This belongs in kubernetes-to-aws.md
1. Create IAM OIDC provider...
2. Create IAM role...
3. Annotate ServiceAccount...

## GKE Workload Identity Setup  ← NO! This belongs in kubernetes-to-gcp.md
1. Enable Workload Identity on cluster...
2. Create GCP Service Account...
```

**Benefits of This Separation:**
- **Clarity**: Users can quickly find either "how to generate tokens" OR "how to connect to a specific provider"
- **Maintainability**: Provider-specific changes don't require updating initiator docs
- **Reusability**: Integration guide template can be reused for any initiator → provider combination
- **Discoverability**: Clear paths for both "I want to use X to authenticate" and "I want to authenticate to Y"
- **Reduces Duplication**: Provider setup is documented once per provider, not once per initiator

**Category Configuration:** Create `_category_.json` in each folder:
```json
{
  "label": "AWS",
  "position": 1,
  "link": {
    "type": "generated-index",
    "description": "Configure AWS to accept secretless authentication"
  }
}
```

## Content Authoring

**Frontmatter for SEO:**
```yaml
---
sidebar_position: 1
title: Configure GitHub Actions OIDC with AWS
description: Step-by-step guide to set up OIDC authentication between GitHub Actions and AWS without storing credentials
slug: /guides/github-to-aws
keywords: [github actions, aws, oidc, secretless, authentication]
---
```

**MDX Features:**
- Import and use React components within Markdown
- Use JSX syntax for interactive elements
- Code blocks with syntax highlighting (language-specific)

**Component Imports:**
```jsx
import ComponentName from '@site/src/components/ComponentName';
import ThemedImage from '@theme/ThemedImage';
```

**Styling:**
- Use CSS Modules for component-scoped styles (`styles.module.css`)
- Global styles and theme variables in `src/css/custom.css`
- Built-in Infima CSS classes available
- Dark mode: styles automatically handled via `[data-theme='dark']` selector

## SEO Optimization

**Built-in SEO Features:**
- Automatic meta tags from frontmatter
- Sitemap generation
- Semantic HTML structure
- Static generation for fast page loads

**Best Practices:**
- Add descriptive `title` and `description` to every page's frontmatter
- Use custom `slug` for clean URLs
- Include `keywords` for better indexing
- Add OpenGraph and Twitter card metadata in `docusaurus.config.ts`
- Interlink related documentation pages
- Use descriptive alt text for images

**Structured Data:** Consider adding JSON-LD schema for technical documentation pages to enhance search visibility.

## Important Patterns

**File Naming:**
- Documentation: Use descriptive kebab-case names
- Blog posts: `YYYY-MM-DD-post-title.md` or `.mdx`
- Components: PascalCase directories and files

**Path Aliases:**
- `@site/` - Project root
- `@theme/` - Docusaurus theme components
- `@docusaurus/` - Docusaurus core modules

**Dark Mode Support:** The theme supports light/dark mode with system preference detection. Ensure components and custom CSS handle both modes gracefully.

## Current Status

This is a fresh Docusaurus installation. The following still need customization:
- Site title, tagline, and branding in `docusaurus.config.ts`
- Organization and project name for GitHub Pages
- Base URL configuration
- Custom homepage design
- Documentation content structure
- Logo and favicon in `/static/img/`
