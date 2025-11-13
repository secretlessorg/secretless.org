---
sidebar_position: 6
title: .NET / ASP.NET Core
description: Implementing OIDC token validation in ASP.NET Core applications with JWT Bearer authentication
keywords: [dotnet, csharp, aspnet, aspnet-core, oidc, jwt, authentication]
---

# OIDC Authentication in .NET / ASP.NET Core

Learn how to implement OIDC token validation in ASP.NET Core applications using JWT Bearer authentication.

## Overview

This guide shows you how to configure ASP.NET Core to validate OIDC tokens from GitHub Actions, GitLab CI, Kubernetes, and other identity providers.

## Coming Soon

This guide is under development. In the meantime, refer to:

- [Token Validation Concepts](../concepts/token-validation.md)
- [Claims Verification](../concepts/claims-verification.md)
- [Node.js / Express Guide](nodejs-express.md) for general patterns

## Key Topics (Planned)

- Microsoft.AspNetCore.Authentication.JwtBearer
- JWT token validation configuration
- Custom authorization policies
- Claims transformation
- Error handling
- Testing with xUnit
- Production deployment

## Example Implementation

```csharp
public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = "https://token.actions.githubusercontent.com";
                options.Audience = "https://api.yourservice.com";
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true
                };
            });

        services.AddAuthorization();
        services.AddControllers();
    }
}
```

## Contributing

Want to help complete this guide? [Contribute on GitHub](https://github.com/yourorg/secretless.org).
