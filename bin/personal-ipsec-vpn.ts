#!/usr/bin/env node
import {App} from 'aws-cdk-lib'
import 'source-map-support/register'
import {PersonalIpsecVpnStack} from '../lib/personal-ipsec-vpn-stack'

const app = new App()
// new PersonalIpsecVpnStack(app, 'PersonalIpsecVpnStack', {
/* If you don't specify 'env', this stack will be environment-agnostic.
 * Account/Region-dependent features and context lookups will not work,
 * but a single synthesized template can be deployed anywhere. */
/* Uncomment the next line to specialize this stack for the AWS Account
 * and Region that are implied by the current CLI configuration. */
// env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
/* Uncomment the next line if you know exactly what Account and Region you
 * want to deploy the stack to. */
// env: { account: '123456789012', region: 'us-east-1' },
/* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
// })

/*
!Remember to change the region in your local AWS config, delete the related S3
bucket as well as the CloudFormation stack, and update to the latest AMI in your region.
 */

new PersonalIpsecVpnStack(app, 'India-PersonalIpsecVpnStack', {
  region: 'ap-south-2',
  amiId: 'unknown',
})

new PersonalIpsecVpnStack(app, 'US-PersonalIpsecVpnStack', {
  region: 'us-west-2',
  amiId: 'ami-0836fd4a4a0b4f6ec',
})

new PersonalIpsecVpnStack(app, 'Oceania-PersonalIpsecVpnStack', {
  region: 'ap-southeast-2',
  amiId: 'ami-09b56d1f2bd9893f7',
})

new PersonalIpsecVpnStack(app, 'Japan-PersonalIpsecVpnStack', {
  region: 'ap-northeast-3',
  amiId: 'ami-0f9c25ede29180ec2',
})
