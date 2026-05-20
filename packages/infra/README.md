# Secret Oracle — Infrastructure

AWS CDK (TypeScript) package that provisions the cloud infrastructure for the **Secret Oracle** web application.

## What gets deployed

| Resource | Details |
|---|---|
| **S3 Bucket** | `secret-oracle-web-files` — hosts the static frontend assets with public read access |
| **CloudFront Distribution** | Serves the frontend over HTTPS with TLS 1.2+, HTTP/2, and optimised caching. Redirects HTTP → HTTPS. 403 errors are rewritten to `/index.html` for SPA routing. |
| **ACM Certificate** | Existing certificate (`us-east-1`) referenced by ARN |
| **Route 53 CNAME** | `secret-oracle.cloud-manizales.com` → CloudFront domain, TTL 300 s |

### Stack outputs

| Export name | Description |
|---|---|
| `secret-oracle-bucket-name` | Name of the S3 bucket |
| `secret-oracle-cloudfront-id` | CloudFront distribution ID |

## Prerequisites

- Node.js ≥ 18 and npm
- AWS CLI configured with credentials for account `746669207643`
- AWS CDK CLI (`npm install -g aws-cdk` or use `npx cdk`)

## Setup

```bash
npm install
```

## Useful commands

| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript to JS |
| `npm run watch` | Watch for changes and compile |
| `npm run test` | Run Jest unit tests |
| `npx cdk synth` | Emit the synthesised CloudFormation template |
| `npx cdk diff` | Compare deployed stack with current state |
| `npx cdk deploy` | Deploy this stack to AWS account/region |

## Stack configuration

The stack is instantiated in `bin/secret-oracle.ts` with the following properties:

```typescript
new SecretOracleStack(app, 'secret-oracle-web-stack', {
    name: 'secret-oracle',
    certificateArn: 'arn:aws:acm:us-east-1:...',
    env: { account: '746669207643', region: 'us-east-1' },
});
```

To use a different domain or certificate, update `bin/secret-oracle.ts` and the domain references inside `lib/secret-oracle-stack.ts`.

