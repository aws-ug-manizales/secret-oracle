import * as cdk from 'aws-cdk-lib/core';
import { CfnOutput, Duration, RemovalPolicy, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { BlockPublicAccess, Bucket, BucketAccessControl } from "aws-cdk-lib/aws-s3";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import {
    AllowedMethods,
    CachePolicy,
    Distribution,
    HttpVersion,
    SecurityPolicyProtocol,
    ViewerProtocolPolicy
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { CnameRecord, HostedZone } from "aws-cdk-lib/aws-route53";


export interface SecretOracleStackProps extends StackProps {
    name: string;
    certificateArn: string;
}


export class SecretOracleStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: SecretOracleStackProps) {
        super(scope, id, props);

        const frontBucket = new Bucket(this, 'front-bucket', {
            bucketName: `${ props.name }-web-files`,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            publicReadAccess: true,
            accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
            blockPublicAccess: BlockPublicAccess.BLOCK_ACLS_ONLY,
            removalPolicy: RemovalPolicy.DESTROY
        });


        const certificate = Certificate.fromCertificateArn(this, 'front-certificate', props.certificateArn);


        const cloudfront = new Distribution(this, 'site-cloudfront', {
            defaultBehavior: {
                origin: S3BucketOrigin.withOriginAccessIdentity(frontBucket),
                cachePolicy: CachePolicy.CACHING_OPTIMIZED,
                viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
            },
            domainNames: [`secret-oracle.cloud-manizales.com`],
            certificate,
            minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
            httpVersion: HttpVersion.HTTP2,
            defaultRootObject: 'index.html',
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    ttl: Duration.seconds(300),
                    responsePagePath: '/index.html'
                }
            ]
        });

        console.log('Frontend resources added');

        new CfnOutput(this, 'BucketName', {
            value: frontBucket.bucketName,
            description: 'The name of the S3 bucket',
            exportName: `${ props.name }-bucket-name`
        });

        new CfnOutput(this, 'CloudDistributionId', {
            value: cloudfront.distributionId,
            description: 'The ID of the CloudFront distribution',
            exportName: `${ props.name }-cloudfront-id`
        });

        console.log('Adding domain name to CloudFront distribution');
        this.addDomainName(props, cloudfront.distributionDomainName);

        console.log('Secret Oracle stack created successfully');

    }

    private addDomainName(props: cdk.StackProps, cloudfrontDomainName: string) {
        const hostedZoneId = 'Z02728733IZSWB0A9X24Z';
        const hostedZoneName = 'cloud-manizales.com';

        const hostedZone = HostedZone.fromHostedZoneAttributes(this, 'hosted-zone', {
            hostedZoneId,
            zoneName: hostedZoneName
        });

        return new CnameRecord(this, 'frontend-dns', {
            recordName: 'secret-oracle.cloud-manizales.com',
            domainName: cloudfrontDomainName,
            zone: hostedZone,
            comment: `DNS for secret oracle frontend`,
            ttl: Duration.seconds(300)
        });
    }


}
