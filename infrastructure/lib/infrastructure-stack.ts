import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC
    const vpc = new ec2.Vpc(this, 'CoinGroupVPC', {
      maxAzs: 2,
      natGateways: 1,
    });

    // Create ECS Cluster with Cloud Map namespace
    const cluster = new ecs.Cluster(this, 'CoinGroupCluster', {
      vpc,
      containerInsights: true,
      defaultCloudMapNamespace: {
        name: 'coin.group.internal',
      },
    });

    // Create S3 bucket for frontend
    const frontendBucket = new s3.Bucket(this, 'CoinGroupFrontendBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create Load Balancer for the backend service
    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'CoinGroupLoadBalancer', {
      vpc,
      internetFacing: true,
    });

    // Enable access logs
    const accessLogsBucket = new s3.Bucket(this, 'CoinGroupALBAccessLogsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Grant ALB permission to write to the bucket
    accessLogsBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('elasticloadbalancing.amazonaws.com')],
      actions: ['s3:PutObject'],
      resources: [accessLogsBucket.arnForObjects('*')],
    }));

    loadBalancer.setAttribute('access_logs.s3.enabled', 'true');
    loadBalancer.setAttribute('access_logs.s3.bucket', accessLogsBucket.bucketName);
    loadBalancer.setAttribute('access_logs.s3.prefix', 'alb-access-logs');

    // Create target group for the backend service
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'CoinGroupTargetGroup', {
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(60),
        timeout: cdk.Duration.seconds(30),
        healthyThresholdCount: 3,
        unhealthyThresholdCount: 5,
      },
    });

    // Create MongoDB Service
    const mongodbService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'MongoDBService', {
      cluster,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('mongo:latest'),
        containerPort: 27017,
        environment: {
          MONGO_INITDB_ROOT_USERNAME: 'admin',
          MONGO_INITDB_ROOT_PASSWORD: 'password123',
        },
      },
      desiredCount: 1,
      cpu: 256,
      memoryLimitMiB: 512,
      cloudMapOptions: {
        name: 'mongodb',
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: cdk.Duration.seconds(10),
      },
    });

    // Create Fargate Service
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'CoinGroupService', {
      cluster,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset('../backend', {
          platform: Platform.LINUX_AMD64,
        }),
        containerPort: 3000,
        environment: {
          NODE_ENV: 'production',
          MONGODB_URI: 'mongodb://admin:password123@mongodb.coin.group.internal:27017/coin_group_app?authSource=admin&retryWrites=true&w=majority',
          PORT: '3000',
          JWT_SECRET: 'your-secret-key',
        },
      },
      desiredCount: 2,
      cpu: 256,
      memoryLimitMiB: 512,
      healthCheckGracePeriod: cdk.Duration.seconds(120),
    });

    // Configure health check for the backend service
    fargateService.targetGroup.configureHealthCheck({
      path: '/health',
      interval: cdk.Duration.seconds(60),
      timeout: cdk.Duration.seconds(30),
      healthyThresholdCount: 3,
      unhealthyThresholdCount: 5,
    });

    // Create listener for the Load Balancer
    const listener = loadBalancer.addListener('HttpListener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // Add rule to strip /api prefix
    listener.addTargets('ApiTargetGroup', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [fargateService.service],
      priority: 1,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/api/*'])
      ],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(60),
        timeout: cdk.Duration.seconds(30),
        healthyThresholdCount: 3,
        unhealthyThresholdCount: 5,
      },
    });

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'CoinGroupDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.LoadBalancerV2Origin(loadBalancer),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(this, 'ApiResponseHeadersPolicy', {
            responseHeadersPolicyName: 'ApiResponseHeadersPolicy',
            corsBehavior: {
              accessControlAllowCredentials: true,
              accessControlAllowHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'Accept',
                'Origin',
                'Access-Control-Request-Method',
                'Access-Control-Request-Headers'
              ],
              accessControlAllowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
              accessControlAllowOrigins: ['*'],
              accessControlExposeHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'Accept',
                'Origin'
              ],
              accessControlMaxAge: cdk.Duration.days(1),
              originOverride: true,
            },
          }),
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: '/error.html',
        },
        {
          httpStatus: 504,
          responseHttpStatus: 504,
          responsePagePath: '/error.html',
        },
      ],
    });

    // Deploy frontend to S3
    new s3deploy.BucketDeployment(this, 'DeployFrontend', {
      sources: [s3deploy.Source.asset('../frontend/dist')],
      destinationBucket: frontendBucket,
      distribution,
    });

    // Add security group rules
    fargateService.service.connections.allowFromAnyIpv4(ec2.Port.tcp(3000));
    mongodbService.service.connections.allowFrom(fargateService.service, ec2.Port.tcp(27017));

    // Allow traffic from Load Balancer to the backend service
    fargateService.service.connections.allowFrom(loadBalancer, ec2.Port.tcp(3000));

    // Allow traffic from Load Balancer to MongoDB
    mongodbService.service.connections.allowFrom(loadBalancer, ec2.Port.tcp(27017));

    // Allow traffic from backend service to MongoDB
    mongodbService.service.connections.allowFrom(fargateService.service, ec2.Port.tcp(27017));

    // Output the CloudFront distribution domain name
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
    });

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'InfrastructureQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
