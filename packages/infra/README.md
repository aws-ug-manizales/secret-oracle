# Secret Oracle — Infrastructure

AWS CDK (TypeScript) package that provisions the cloud infrastructure for the **Secret Oracle** web application.

## What gets deployed

| Resource | Details |
|---|---|
| **S3 Bucket** | `secret-oracle-web-files` — hosts the static frontend assets with public read access |
| **CloudFront Distribution** | Serves the frontend over HTTPS with TLS 1.2+, HTTP/2, and optimised caching. Redirects HTTP → HTTPS. 403 errors are rewritten to `/index.html` for SPA routing. |
| **ACM Certificate** | Existing certificate (`us-east-1`) referenced by ARN via environment variable |
| **Route 53 CNAME** | Configured domain → CloudFront domain, TTL 300 s |

### Stack outputs

| Export name | Description |
|---|---|
| `secret-oracle-bucket-name` | Name of the S3 bucket |
| `secret-oracle-cloudfront-id` | CloudFront distribution ID |

## Prerequisites

- Node.js ≥ 18 and npm
- AWS CLI configured with valid credentials
- AWS CDK CLI (`npm install -g aws-cdk` or use `npx cdk`)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env`:

```dotenv
# AWS account and region (set automatically by CDK CLI when using named profiles,
# but can be overridden here)
CDK_DEFAULT_ACCOUNT=123456789012
CDK_DEFAULT_REGION=us-east-1

# ARN of the ACM certificate — must be in us-east-1 for CloudFront
CERTIFICATE_ARN=arn:aws:acm:us-east-1:<account-id>:certificate/<certificate-id>

# Route 53 Hosted Zone
HOSTED_ZONE_ID=<hosted-zone-id>
HOSTED_ZONE_NAME=example.com

# Full domain name for the app
DOMAIN_NAME=secret-oracle.example.com
```

> ⚠️ `.env` is listed in `.gitignore` — **never commit it**.

### 3. Deploy

```bash
npx cdk deploy
```

## Useful commands

| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript to JS |
| `npm run watch` | Watch for changes and compile |
| `npm run test` | Run Jest unit tests |
| `npx cdk synth` | Emit the synthesised CloudFormation template |
| `npx cdk diff` | Compare deployed stack with current state |
| `npx cdk deploy` | Deploy this stack to AWS |

## Stack configuration

All environment-specific values are loaded from `.env` via [dotenv](https://github.com/motdotla/dotenv) in `bin/secret-oracle.ts`. The following variables are **required** (the app will throw a descriptive error if any are missing):

| Variable | Description |
|---|---|
| `CERTIFICATE_ARN` | ARN of the ACM certificate (must be in `us-east-1`) |
| `HOSTED_ZONE_ID` | ID of the Route 53 Hosted Zone |
| `HOSTED_ZONE_NAME` | Root domain name (e.g. `example.com`) |
| `DOMAIN_NAME` | Full subdomain for the app (e.g. `secret-oracle.example.com`) |
| `CDK_DEFAULT_ACCOUNT` | AWS account ID (optional if CDK CLI resolves it automatically) |
| `CDK_DEFAULT_REGION` | AWS region — defaults to `us-east-1` if not set |
