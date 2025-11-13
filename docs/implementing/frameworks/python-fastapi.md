---
sidebar_position: 2
title: Python / FastAPI
description: Implementing OIDC token validation in FastAPI applications with dependency injection
keywords: [python, fastapi, oidc, jwt, authentication, dependency injection]
---

# OIDC Authentication in Python / FastAPI

Learn how to implement OIDC token validation in FastAPI applications using dependency injection.

## Overview

This guide shows you how to build FastAPI dependencies that validate OIDC tokens from GitHub Actions, GitLab CI, Kubernetes, and other identity providers.

## Coming Soon

This guide is under development. In the meantime, refer to:

- [Token Validation Concepts](../concepts/token-validation.md)
- [Claims Verification](../concepts/claims-verification.md)
- [Node.js / Express Guide](nodejs-express.md) for general patterns

## Key Topics (Planned)

- Installing PyJWT and python-jose
- Creating authentication dependencies
- Token verification with JWKS
- Authorization with FastAPI dependencies
- Error handling and validation
- Testing with pytest
- Production deployment

## Example Implementation

```python
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, jwk
import requests

security = HTTPBearer()

async def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    token = credentials.credentials

    # Decode to get issuer
    unverified = jwt.get_unverified_claims(token)
    issuer = unverified.get('iss')

    # Fetch JWKS and verify
    # ... (implementation details)

    return unverified

@app.get("/protected")
async def protected_route(claims: dict = Depends(verify_token)):
    return {"user": claims}
```

## Contributing

Want to help complete this guide? [Contribute on GitHub](https://github.com/yourorg/secretless.org).
