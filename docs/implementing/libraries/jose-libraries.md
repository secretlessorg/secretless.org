---
sidebar_position: 1
title: JOSE Libraries
description: JSON Object Signing and Encryption libraries for JWT token validation across languages
keywords: [jose, jwt, jws, jwk, jsonwebtoken, token validation]
---

# JOSE Libraries

Overview of JSON Object Signing and Encryption (JOSE) libraries for implementing JWT token validation.

## Overview

JOSE is a framework providing standards for:
- **JWT**: JSON Web Tokens
- **JWS**: JSON Web Signature
- **JWE**: JSON Web Encryption
- **JWK**: JSON Web Keys
- **JWA**: JSON Web Algorithms

## Popular Libraries by Language

### JavaScript / Node.js

**[jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)**
```bash
npm install jsonwebtoken
```

**[jose](https://github.com/panva/jose)**
```bash
npm install jose
```

**[jwks-rsa](https://github.com/auth0/node-jwks-rsa)**
```bash
npm install jwks-rsa
```

### Python

**[PyJWT](https://github.com/jpadilla/pyjwt)**
```bash
pip install pyjwt[crypto]
```

**[python-jose](https://github.com/mpdavis/python-jose)**
```bash
pip install python-jose[cryptography]
```

### Go

**[golang-jwt/jwt](https://github.com/golang-jwt/jwt)**
```go
go get github.com/golang-jwt/jwt/v5
```

**[lestrrat-go/jwx](https://github.com/lestrrat-go/jwx)**
```go
go get github.com/lestrrat-go/jwx/v2
```

### Rust

**[jsonwebtoken](https://github.com/Keats/jsonwebtoken)**
```toml
[dependencies]
jsonwebtoken = "9.0"
```

### Java

**[java-jwt](https://github.com/auth0/java-jwt)**
```xml
<dependency>
    <groupId>com.auth0</groupId>
    <artifactId>java-jwt</artifactId>
    <version>4.4.0</version>
</dependency>
```

**[nimbus-jose-jwt](https://connect2id.com/products/nimbus-jose-jwt)**
```xml
<dependency>
    <groupId>com.nimbusds</groupId>
    <artifactId>nimbus-jose-jwt</artifactId>
    <version>9.37</version>
</dependency>
```

### .NET / C#

**[System.IdentityModel.Tokens.Jwt](https://github.com/AzureAD/azure-activedirectory-identitymodel-extensions-for-dotnet)**
```bash
dotnet add package System.IdentityModel.Tokens.Jwt
```

## Coming Soon

Detailed guides for each library including:
- Installation and setup
- Token verification examples
- JWKS integration
- Best practices
- Common pitfalls

## Contributing

Want to help complete this guide? [Contribute on GitHub](https://github.com/yourorg/secretless.org).
