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

const ubuntu2204Arm64Ami = 'ami-0ca512381d3dd7dd8'

new PersonalIpsecVpnStack(app, 'India-PersonalIpsecVpnStack', {
  region: 'ap-south-2',
  amiId: ubuntu2204Arm64Ami,
})

new PersonalIpsecVpnStack(app, 'US-PersonalIpsecVpnStack', {
  region: 'us-west-2',
  amiId: ubuntu2204Arm64Ami,
})
