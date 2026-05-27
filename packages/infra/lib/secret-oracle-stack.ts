import * as cdk from 'aws-cdk-lib/core';
import { CfnOutput, Duration, RemovalPolicy, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { BlockPublicAccess, Bucket, BucketAccessControl } from "aws-cdk-lib/aws-s3";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import {
    AllowedMethods,
    CachePolicy,
    Distribution,
    Function as CfFunction,
    FunctionCode,
    FunctionEventType,
    HttpVersion,
    SecurityPolicyProtocol,
    ViewerProtocolPolicy
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { CnameRecord, HostedZone } from "aws-cdk-lib/aws-route53";


export interface SecretOracleStackProps extends StackProps {
    name: string;
    certificateArn: string;
    hostedZoneId: string;
    hostedZoneName: string;
    domainName: string;
    gameroomDomainName?: string;
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

        // CloudFront Function to route by Host header
        const routerFunction = new CfFunction(this, 'domain-router', {
            functionName: `${props.name}-domain-router`,
            code: FunctionCode.fromInline(`
function handler(event) {
    var request = event.request;
    var host = request.headers.host ? request.headers.host.value : '';
    var uri = request.uri;

    // Only rewrite root path requests
    if (uri === '/' || uri === '') {
        if (host.startsWith('gameroom')) {
            request.uri = '/promo.html';
        } else {
            request.uri = '/oracle-promo.html';
        }
    }

    return request;
}
            `.trim()),
        });

        const domainNames = [props.domainName];
        if (props.gameroomDomainName) {
            domainNames.push(props.gameroomDomainName);
        }

        const cloudfront = new Distribution(this, 'site-cloudfront', {
            defaultBehavior: {
                origin: S3BucketOrigin.withOriginAccessIdentity(frontBucket),
                cachePolicy: CachePolicy.CACHING_OPTIMIZED,
                viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
                functionAssociations: [{
                    function: routerFunction,
                    eventType: FunctionEventType.VIEWER_REQUEST,
                }],
            },
            domainNames,
            certificate,
            minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
            httpVersion: HttpVersion.HTTP2,
            defaultRootObject: '',
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
        this.addDomainName(props, 'frontend-dns', props.domainName, cloudfront.distributionDomainName);

        if (props.gameroomDomainName) {
            console.log('Adding GameRoom domain name to CloudFront distribution');
            this.addDomainName(props, 'gameroom-dns', props.gameroomDomainName, cloudfront.distributionDomainName);
        }

        console.log('Secret Oracle stack created successfully');

    }

    private addDomainName(props: SecretOracleStackProps, recordId: string, recordName: string, cloudfrontDomainName: string) {
        const hostedZone = HostedZone.fromHostedZoneAttributes(this, `hosted-zone-${recordId}`, {
            hostedZoneId: props.hostedZoneId,
            zoneName: props.hostedZoneName
        });

        return new CnameRecord(this, recordId, {
            recordName,
            domainName: cloudfrontDomainName,
            zone: hostedZone,
            comment: `DNS for ${recordName}`,
            ttl: Duration.seconds(300)
        });
    }


}
