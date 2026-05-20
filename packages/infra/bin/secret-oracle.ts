#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { SecretOracleStack } from '../lib/secret-oracle-stack';

const app = new cdk.App();
new SecretOracleStack(app, 'secret-oracle-web-stack', {
    name: 'secret-oracle',
    certificateArn: 'arn:aws:acm:us-east-1:746669207643:certificate/83630519-ebb5-4af8-b8dd-e23224e477a7',
    env: { account: '746669207643', region: 'us-east-1' },
});
