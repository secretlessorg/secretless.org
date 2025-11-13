---
sidebar_position: 4
title: Rust / Axum
description: Implementing OIDC token validation in Axum applications with Tower layers
keywords: [rust, axum, oidc, jwt, tower, authentication, middleware]
---

# OIDC Authentication in Rust / Axum

Learn how to implement OIDC token validation in Axum applications using Tower layers.

## Overview

This guide shows you how to build Axum middleware (Tower layers) that validates OIDC tokens from GitHub Actions, GitLab CI, Kubernetes, and other identity providers.

## Coming Soon

This guide is under development. In the meantime, refer to:

- [Token Validation Concepts](../concepts/token-validation.md)
- [Claims Verification](../concepts/claims-verification.md)
- [Node.js / Express Guide](nodejs-express.md) for general patterns

## Key Topics (Planned)

- Using jsonwebtoken and jwks-client crates
- Creating Tower middleware layers
- Async JWKS fetching
- Type-safe claims with serde
- Error handling with thiserror
- Testing with tokio-test
- Production deployment

## Example Implementation

```rust
use axum::{
    extract::Request,
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, DecodingKey, Validation};

pub async fn auth_middleware(
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = req.headers()
        .get("authorization")
        .and_then(|h| h.to_str().ok());

    // Verify token
    // ... (implementation details)

    Ok(next.run(req).await)
}
```

## Contributing

Want to help complete this guide? [Contribute on GitHub](https://github.com/yourorg/secretless.org).
