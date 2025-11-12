# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

secretless.org is a documentation website built to promote secretless authentication workflows and discourage the use of long-lived authentication tokens. The site documents how to integrate services using secretless techniques like OIDC connections and just-in-time authentication across major cloud providers (AWS, GCP, Azure, Kubernetes, Cloudflare) and CI/CD tools.

**Tech Stack:**
- Docusaurus 3.9.2 (static site generator)
- React 19.0.0
- TypeScript 5.6.2
- MDX 3.0.0 (Markdown with JSX)
- Node.js >= 20.0 required

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
│   └── runtime-environments/
└── guides/                       # Service-to-service integration guides
    ├── github-to-aws.md
    └── gitlab-to-gcp.md
```

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
