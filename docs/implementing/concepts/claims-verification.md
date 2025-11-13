---
sidebar_position: 2
title: Claims Verification
description: Understanding and validating OIDC token claims including standard and issuer-specific claims
keywords: [jwt claims, oidc claims, token validation, iss, aud, sub, exp]
---

# Claims Verification

Learn how to validate JWT claims to ensure tokens are authentic, current, and authorized for your application.

## Overview

After [verifying the token signature](token-validation.md), you must validate the **claims** (the data inside the token) to ensure:

1. The token is from a trusted issuer
2. The token is intended for your application
3. The token hasn't expired
4. The token isn't being used before it's valid
5. The identity meets your authorization requirements

## Standard OIDC Claims

These claims are defined by the OIDC specification and should always be validated.

### `iss` (Issuer)

**What**: The identity provider that issued the token

**Format**: URL (typically HTTPS)

**Example**:
```json
{
  "iss": "https://token.actions.githubusercontent.com"
}
```

**Validation**:
```javascript
const allowedIssuers = [
  'https://token.actions.githubusercontent.com',
  'https://gitlab.com',
  'https://accounts.google.com'
];

if (!allowedIssuers.includes(claims.iss)) {
  throw new Error('Token from untrusted issuer');
}
```

:::warning
Always validate issuer against an allowlist. Never accept tokens from arbitrary issuers.
:::

### `sub` (Subject)

**What**: The identity of the authenticated entity

**Format**: Issuer-specific string

**Examples**:
```json
// GitHub Actions
{
  "sub": "repo:octo-org/octo-repo:ref:refs/heads/main"
}

// Kubernetes
{
  "sub": "system:serviceaccount:default:my-service-account"
}

// GitLab
{
  "sub": "project_path:group/project:ref_type:branch:ref:main"
}
```

**Validation**:
```javascript
// Extract subject components
const subject = claims.sub;

// Example: Validate GitHub repository
if (claims.iss === 'https://token.actions.githubusercontent.com') {
  const match = subject.match(/^repo:([^:]+):ref:(.+)$/);
  if (!match) {
    throw new Error('Invalid subject format');
  }

  const [_, repository, ref] = match;

  // Only allow specific repositories
  if (repository !== 'octo-org/octo-repo') {
    throw new Error('Unauthorized repository');
  }
}
```

### `aud` (Audience)

**What**: The intended recipient(s) of the token

**Format**: String or array of strings (URLs or identifiers)

**Examples**:
```json
// Single audience
{
  "aud": "https://api.yourservice.com"
}

// Multiple audiences
{
  "aud": ["https://api.yourservice.com", "https://api2.yourservice.com"]
}
```

**Validation**:
```javascript
const expectedAudience = 'https://api.yourservice.com';

// Handle both string and array formats
const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];

if (!audiences.includes(expectedAudience)) {
  throw new Error('Token not intended for this audience');
}
```

:::tip
**Best Practice**: Use your API's URL as the audience value. This prevents tokens intended for other services from being used with yours.
:::

### `exp` (Expiration Time)

**What**: When the token expires (Unix timestamp)

**Format**: Number (seconds since Unix epoch)

**Example**:
```json
{
  "exp": 1735689600  // 2025-01-01 00:00:00 UTC
}
```

**Validation**:
```javascript
const now = Math.floor(Date.now() / 1000);
const clockSkew = 60; // Allow 60 seconds clock skew

if (claims.exp < now - clockSkew) {
  throw new Error('Token has expired');
}
```

:::info
Most JWT libraries validate `exp` automatically when you call `jwt.verify()` with the `clockTolerance` option.
:::

### `iat` (Issued At)

**What**: When the token was issued (Unix timestamp)

**Format**: Number (seconds since Unix epoch)

**Example**:
```json
{
  "iat": 1735686000  // Issued 1 hour before expiration
}
```

**Validation**:
```javascript
const now = Math.floor(Date.now() / 1000);
const maxAge = 3600; // 1 hour

if (claims.iat > now + 60) {
  throw new Error('Token issued in the future');
}

if (now - claims.iat > maxAge) {
  throw new Error('Token too old');
}
```

### `nbf` (Not Before)

**What**: Token is not valid before this time (Unix timestamp)

**Format**: Number (seconds since Unix epoch)

**Example**:
```json
{
  "nbf": 1735686000
}
```

**Validation**:
```javascript
const now = Math.floor(Date.now() / 1000);
const clockSkew = 60;

if (claims.nbf > now + clockSkew) {
  throw new Error('Token not yet valid');
}
```

## Issuer-Specific Claims

Different identity providers include additional claims for authorization.

### GitHub Actions Claims

```json
{
  "iss": "https://token.actions.githubusercontent.com",
  "sub": "repo:octo-org/octo-repo:ref:refs/heads/main",
  "aud": "https://api.yourservice.com",
  "exp": 1735689600,
  "repository": "octo-org/octo-repo",
  "repository_owner": "octo-org",
  "repository_owner_id": "123456",
  "repository_id": "789012",
  "ref": "refs/heads/main",
  "ref_type": "branch",
  "workflow": "deploy",
  "workflow_ref": "octo-org/octo-repo/.github/workflows/deploy.yml@refs/heads/main",
  "job_workflow_ref": "octo-org/octo-repo/.github/workflows/deploy.yml@refs/heads/main",
  "actor": "octocat",
  "actor_id": "345678",
  "run_id": "901234",
  "run_number": "42",
  "run_attempt": "1",
  "event_name": "push"
}
```

**Authorization Examples**:

```javascript
function authorizeGitHub(claims) {
  // Only allow from specific organization
  if (claims.repository_owner !== 'octo-org') {
    throw new Error('Unauthorized organization');
  }

  // Only allow from main branch
  if (claims.ref !== 'refs/heads/main') {
    throw new Error('Only main branch deployments allowed');
  }

  // Only allow specific workflow
  if (claims.workflow !== 'deploy') {
    throw new Error('Unauthorized workflow');
  }

  // Grant permissions based on context
  return {
    canDeploy: true,
    environment: claims.ref === 'refs/heads/main' ? 'production' : 'staging',
    repository: claims.repository
  };
}
```

### GitLab CI Claims

```json
{
  "iss": "https://gitlab.com",
  "sub": "project_path:group/project:ref_type:branch:ref:main",
  "aud": "https://api.yourservice.com",
  "exp": 1735689600,
  "namespace_id": "123",
  "namespace_path": "group",
  "project_id": "456",
  "project_path": "group/project",
  "pipeline_id": "789",
  "pipeline_source": "push",
  "job_id": "1011",
  "ref": "main",
  "ref_type": "branch",
  "ref_protected": "true",
  "environment": "production",
  "environment_protected": "true",
  "user_email": "[email protected]",
  "user_id": "1213",
  "user_login": "username"
}
```

**Authorization Examples**:

```javascript
function authorizeGitLab(claims) {
  // Only allow protected branches
  if (claims.ref_protected !== 'true') {
    throw new Error('Only protected branches allowed');
  }

  // Only allow specific namespace
  if (claims.namespace_path !== 'my-org') {
    throw new Error('Unauthorized namespace');
  }

  // Only allow protected environments
  if (claims.environment_protected !== 'true') {
    throw new Error('Only protected environments allowed');
  }

  return {
    canDeploy: true,
    environment: claims.environment,
    project: claims.project_path
  };
}
```

### Kubernetes Service Account Claims

```json
{
  "iss": "https://kubernetes.default.svc.cluster.local",
  "sub": "system:serviceaccount:default:my-service",
  "aud": "https://api.yourservice.com",
  "exp": 1735689600,
  "kubernetes.io": {
    "namespace": "default",
    "serviceaccount": {
      "name": "my-service",
      "uid": "abc-123-def"
    },
    "pod": {
      "name": "my-pod-xyz",
      "uid": "pod-abc-123"
    }
  }
}
```

**Authorization Examples**:

```javascript
function authorizeKubernetes(claims) {
  // Extract namespace and service account
  const k8s = claims['kubernetes.io'];
  const namespace = k8s.namespace;
  const serviceAccount = k8s.serviceaccount.name;

  // Only allow specific namespaces
  const allowedNamespaces = ['production', 'staging'];
  if (!allowedNamespaces.includes(namespace)) {
    throw new Error('Unauthorized namespace');
  }

  // Only allow specific service accounts
  if (serviceAccount !== 'my-service') {
    throw new Error('Unauthorized service account');
  }

  return {
    namespace,
    serviceAccount,
    canAccess: true
  };
}
```

### Google Cloud Platform Claims

```json
{
  "iss": "https://accounts.google.com",
  "sub": "112233445566778899000",
  "aud": "https://api.yourservice.com",
  "exp": 1735689600,
  "email": "[email protected]",
  "email_verified": true,
  "google": {
    "compute_engine": {
      "instance_id": "123456789",
      "instance_name": "my-instance",
      "project_id": "my-project",
      "project_number": "987654321",
      "zone": "us-central1-a"
    }
  }
}
```

## Complete Claims Validation

```javascript
function validateClaims(claims, options = {}) {
  const {
    expectedIssuer,
    expectedAudience,
    maxTokenAge = 3600,  // 1 hour
    clockSkew = 60       // 60 seconds
  } = options;

  const now = Math.floor(Date.now() / 1000);

  // 1. Validate issuer
  if (claims.iss !== expectedIssuer) {
    throw new Error('Invalid issuer');
  }

  // 2. Validate audience
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(expectedAudience)) {
    throw new Error('Invalid audience');
  }

  // 3. Validate expiration
  if (claims.exp < now - clockSkew) {
    throw new Error('Token has expired');
  }

  // 4. Validate not before
  if (claims.nbf && claims.nbf > now + clockSkew) {
    throw new Error('Token not yet valid');
  }

  // 5. Validate issued at
  if (claims.iat > now + clockSkew) {
    throw new Error('Token issued in the future');
  }

  if (now - claims.iat > maxTokenAge) {
    throw new Error('Token too old');
  }

  // 6. Validate subject exists
  if (!claims.sub) {
    throw new Error('Missing subject claim');
  }

  return true;
}
```

## Authorization Patterns

### Pattern 1: Allowlist by Repository

```javascript
const allowedRepositories = [
  'octo-org/octo-repo',
  'octo-org/another-repo'
];

if (!allowedRepositories.includes(claims.repository)) {
  throw new Error('Unauthorized repository');
}
```

### Pattern 2: Pattern Matching

```javascript
// Allow all repos in organization
const orgPattern = /^octo-org\//;
if (!orgPattern.test(claims.repository)) {
  throw new Error('Unauthorized organization');
}
```

### Pattern 3: Multi-Tenant by Organization

```javascript
// Extract tenant from claims
const tenant = claims.repository_owner;

// Load tenant-specific configuration
const tenantConfig = await getTenantConfig(tenant);
if (!tenantConfig) {
  throw new Error('Unknown tenant');
}

// Validate tenant-specific rules
if (tenantConfig.requireMainBranch && claims.ref !== 'refs/heads/main') {
  throw new Error('Tenant requires main branch');
}
```

### Pattern 4: Environment-Based Permissions

```javascript
function getPermissions(claims) {
  const permissions = {
    canRead: true,
    canWrite: false,
    canDelete: false
  };

  // Grant write access to main branch
  if (claims.ref === 'refs/heads/main') {
    permissions.canWrite = true;
  }

  // Grant delete access only to admins
  if (claims.actor === 'admin-user') {
    permissions.canDelete = true;
  }

  return permissions;
}
```

## Security Best Practices

### 1. Always Validate All Required Claims

```javascript
// ✅ CORRECT: Validate all required claims
function validateToken(claims) {
  if (!claims.iss) throw new Error('Missing issuer');
  if (!claims.sub) throw new Error('Missing subject');
  if (!claims.aud) throw new Error('Missing audience');
  if (!claims.exp) throw new Error('Missing expiration');

  // Continue with validation...
}

// ❌ WRONG: Skipping claim validation
function validateToken(claims) {
  // Oops! Not checking if token is expired
  return claims;
}
```

### 2. Use Strict Equality for Strings

```javascript
// ✅ CORRECT: Strict equality
if (claims.repository === 'octo-org/octo-repo') { }

// ❌ WRONG: Loose equality can cause bypasses
if (claims.repository == 'octo-org/octo-repo') { }
```

### 3. Validate Claim Types

```javascript
// ✅ CORRECT: Validate types
if (typeof claims.exp !== 'number') {
  throw new Error('Invalid expiration type');
}

// ❌ WRONG: Assuming types
const expiresAt = new Date(claims.exp * 1000); // Might fail if exp is string
```

### 4. Handle Missing Claims Gracefully

```javascript
// ✅ CORRECT: Check for existence
const repository = claims.repository ?? null;
if (!repository) {
  throw new Error('Missing repository claim');
}

// ❌ WRONG: Accessing potentially undefined properties
if (claims.repository.startsWith('octo-org/')) { } // Throws if undefined
```

## Testing Claims Validation

```javascript
describe('Claims Validation', () => {
  const validClaims = {
    iss: 'https://token.actions.githubusercontent.com',
    sub: 'repo:octo-org/octo-repo:ref:refs/heads/main',
    aud: 'https://api.yourservice.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    repository: 'octo-org/octo-repo',
    ref: 'refs/heads/main'
  };

  it('should accept valid claims', () => {
    expect(() => validateClaims(validClaims, {
      expectedIssuer: 'https://token.actions.githubusercontent.com',
      expectedAudience: 'https://api.yourservice.com'
    })).not.toThrow();
  });

  it('should reject wrong issuer', () => {
    const claims = { ...validClaims, iss: 'https://evil.com' };
    expect(() => validateClaims(claims, {
      expectedIssuer: 'https://token.actions.githubusercontent.com',
      expectedAudience: 'https://api.yourservice.com'
    })).toThrow('Invalid issuer');
  });

  it('should reject expired tokens', () => {
    const claims = { ...validClaims, exp: Math.floor(Date.now() / 1000) - 3600 };
    expect(() => validateClaims(claims, {
      expectedIssuer: 'https://token.actions.githubusercontent.com',
      expectedAudience: 'https://api.yourservice.com'
    })).toThrow('Token has expired');
  });

  it('should reject wrong audience', () => {
    const claims = { ...validClaims, aud: 'https://other-service.com' };
    expect(() => validateClaims(claims, {
      expectedIssuer: 'https://token.actions.githubusercontent.com',
      expectedAudience: 'https://api.yourservice.com'
    })).toThrow('Invalid audience');
  });
});
```

## Troubleshooting

### "Invalid audience" Errors

**Causes**:
- Client using wrong audience when requesting token
- Multiple services with different audiences
- Audience mismatch between token and validation

**Solutions**:
1. Check what audience the client is requesting
2. Verify your application's expected audience
3. Consider accepting multiple audiences if needed

### Authorization Failures

**Causes**:
- Claims don't contain expected fields
- Issuer-specific claims differ from expected
- Authorization logic doesn't match token structure

**Solutions**:
1. Log the full claims object (securely)
2. Verify issuer-specific claim names
3. Check token examples from the issuer's documentation

### Clock Skew Issues

**Causes**:
- Server clock out of sync
- Token issued with future timestamp
- Network latency affecting timestamps

**Solutions**:
1. Use NTP to sync server clocks
2. Increase `clockTolerance` to 60-120 seconds
3. Log timestamp differences for debugging

## Next Steps

- Review [Security Best Practices](security-best-practices.md) for production deployments
- See [Token Validation](token-validation.md) for signature verification
- Explore framework-specific implementation guides
