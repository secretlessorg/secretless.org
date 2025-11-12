---
sidebar_position: 4
title: crates.io
description: Publish Rust crates to crates.io using secretless OIDC authentication
keywords: [crates.io, rust, cargo, package registry, oidc, secretless]
---

# crates.io Secretless Publishing

crates.io is exploring OIDC-based authentication for secretless crate publishing from CI/CD platforms.

## Overview

The Rust package registry is working towards supporting OIDC authentication for cargo publish operations, which will enable:

- **Token-Free Publishing**: No crates.io API tokens in CI/CD
- **CI/CD Integration**: Native support for GitHub Actions and other providers
- **Enhanced Security**: Reduced credential management overhead

## Key Capabilities

- OIDC token-based authentication (in development)
- Integration with CI/CD OIDC providers
- Per-crate access controls

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Current status of OIDC support in crates.io
- Beta/experimental setup instructions (if available)
- GitHub Actions workflow examples
- Migration path from token-based authentication
- Timeline and feature availability

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share information about OIDC support status

## Resources

- [crates.io Documentation](https://doc.rust-lang.org/cargo/reference/publishing.html)
- [GitHub Actions OIDC](/docs/initiators/ci-tools/github-actions)
