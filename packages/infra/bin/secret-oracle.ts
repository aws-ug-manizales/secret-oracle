#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config();

import * as cdk from 'aws-cdk-lib/core';
import { SecretOracleStack } from '../lib/secret-oracle-stack';

const requiredEnvVars = ['CERTIFICATE_ARN', 'HOSTED_ZONE_ID', 'HOSTED_ZONE_NAME', 'DOMAIN_NAME'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

const app = new cdk.App();
new SecretOracleStack(app, 'secret-oracle-web-stack', {
    name: 'secret-oracle',
    certificateArn: process.env.CERTIFICATE_ARN!,
    hostedZoneId: process.env.HOSTED_ZONE_ID!,
    hostedZoneName: process.env.HOSTED_ZONE_NAME!,
    domainName: process.env.DOMAIN_NAME!,
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
    },
});
