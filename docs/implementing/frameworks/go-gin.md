---
sidebar_position: 3
title: Go / Gin
description: Implementing OIDC token validation in Go Gin applications with middleware
keywords: [go, golang, gin, oidc, jwt, middleware, authentication]
---

# OIDC Authentication in Go / Gin

Learn how to implement OIDC token validation in Gin applications using middleware.

## Overview

This guide shows you how to build Gin middleware that validates OIDC tokens from GitHub Actions, GitLab CI, Kubernetes, and other identity providers.

## Coming Soon

This guide is under development. In the meantime, refer to:

- [Token Validation Concepts](../concepts/token-validation.md)
- [Claims Verification](../concepts/claims-verification.md)
- [Node.js / Express Guide](nodejs-express.md) for general patterns

## Key Topics (Planned)

- Using golang-jwt/jwt library
- Creating Gin middleware
- JWKS fetching and caching
- Authorization middleware
- Error handling
- Testing with testify
- Production deployment

## Example Implementation

```go
package middleware

import (
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        tokenString := c.GetHeader("Authorization")

        if tokenString == "" {
            c.JSON(401, gin.H{"error": "Missing authorization header"})
            c.Abort()
            return
        }

        // Verify token
        // ... (implementation details)

        c.Next()
    }
}
```

## Contributing

Want to help complete this guide? [Contribute on GitHub](https://github.com/yourorg/secretless.org).
