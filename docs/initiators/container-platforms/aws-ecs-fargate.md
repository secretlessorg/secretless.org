---
sidebar_position: 6
title: AWS ECS/Fargate
description: AWS ECS and Fargate tasks with secretless IAM role authentication
keywords: [aws ecs, fargate, containers, oidc, secretless, task roles]
---

# AWS ECS/Fargate Secretless Authentication

AWS ECS and Fargate support secretless authentication using IAM task roles and task execution roles.

## Overview

ECS tasks and Fargate services automatically receive temporary AWS credentials through IAM roles. This enables:

- **No Access Keys**: Automatic credential provisioning
- **Task-Level Identity**: Each task has its own IAM role
- **Temporary Credentials**: Automatic rotation
- **Cross-Account Access**: Assume roles in other accounts

## Key Capabilities

- IAM task roles for application access
- IAM execution roles for ECS agent operations
- Temporary credential management
- Integration with AWS services

## Contributing

This page is a placeholder. We need your help to create comprehensive documentation!

**What we need:**
- Complete guide for ECS/Fargate task roles
- Task and execution role configuration
- Cross-account access patterns
- Integration with ECR authentication
- Service-to-service authentication
- Best practices for role policies
- Troubleshooting credential issues
- Integration guides (e.g., ecs-to-s3, fargate-to-dynamodb)

**How to contribute:**
- [Open an issue](https://github.com/secretlessorg/secretless.org/issues) to discuss content
- [Submit a pull request](https://github.com/secretlessorg/secretless.org/pulls) with documentation
- Share your ECS/Fargate authentication setup

## Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [ECS Task Roles](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)

