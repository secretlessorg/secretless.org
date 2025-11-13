---
sidebar_position: 5
title: Java / Spring Boot
description: Implementing OIDC token validation in Spring Boot applications with Spring Security
keywords: [java, spring, spring-boot, spring-security, oidc, jwt, authentication]
---

# OIDC Authentication in Java / Spring Boot

Learn how to implement OIDC token validation in Spring Boot applications using Spring Security.

## Overview

This guide shows you how to configure Spring Security to validate OIDC tokens from GitHub Actions, GitLab CI, Kubernetes, and other identity providers.

## Coming Soon

This guide is under development. In the meantime, refer to:

- [Token Validation Concepts](../concepts/token-validation.md)
- [Claims Verification](../concepts/claims-verification.md)
- [Node.js / Express Guide](nodejs-express.md) for general patterns

## Key Topics (Planned)

- Spring Security OAuth2 Resource Server
- JWT token validation configuration
- Custom JwtAuthenticationConverter
- Authorization with @PreAuthorize
- Error handling
- Testing with Spring Test
- Production deployment

## Example Implementation

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            );
        return http.build();
    }
}
```

## Contributing

Want to help complete this guide? [Contribute on GitHub](https://github.com/yourorg/secretless.org).
