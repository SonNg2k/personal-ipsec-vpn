// The IaC code here is derived from the following GitHub repo:
// https://github.com/aws-samples/aws-cdk-examples/commits/master/typescript/ec2-instance

import {CfnOutput, Stack, StackProps, aws_ec2, aws_iam} from 'aws-cdk-lib'
import {EbsDeviceVolumeType, InstanceProps, VpcProps} from 'aws-cdk-lib/aws-ec2'
import {Asset} from 'aws-cdk-lib/aws-s3-assets'
import {Construct} from 'constructs'
import * as path from 'path'

interface PersonalIpsecVpnStackProps extends StackProps {
  // US West (Oregon), Asia Pacific (Hyderabad), or Asia Pacific (Osaka)
  region: 'us-west-2' | 'ap-south-2' | 'ap-northeast-3' | 'ap-southeast-2'
  amiId: string
}

export class PersonalIpsecVpnStack extends Stack {
  constructor(scope: Construct, id: string, props: PersonalIpsecVpnStackProps) {
    super(scope, id, props)

    const {region, amiId} = props

    // Select the desired image in the EC2 console to get its AMI ID. U should
    // periodically check if the aws_ec2.AmazonLinuxGeneration enum provides a
    // constant value that represents the latest stable version of AL2023.
    // Avoid using the AMI ID like below because it will not always correspond
    // to the latest OS version
    const ami = new aws_ec2.GenericLinuxImage({
      [region]: amiId,
    })

    const instanceType = aws_ec2.InstanceType.of(
      aws_ec2.InstanceClass.T4G,
      aws_ec2.InstanceSize.NANO
    )

    // Create a Key Pair to be used with this EC2 Instance. Since an EC2 KeyPair
    // cannot be updated, you cannot change any property related to the KeyPair.
    const keyPair = new aws_ec2.KeyPair(this, 'PublicIPsecVpnKeyPair', {
      keyPairName: region + '_public-ipsec-vpn-key-pair',
    })

    const vpc = new aws_ec2.Vpc(this, 'PublicIPsecVpnVPC', {
      // ipAddresses: '',
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'asterisk',
          subnetType: aws_ec2.SubnetType.PUBLIC,
        },
      ],
    } as VpcProps)

    const securityGroup = new aws_ec2.SecurityGroup(this, 'PublicIPsecVpnSecGroup', {
      vpc,
      securityGroupName: 'PublicIPsecVpnSecGroup',
      description: 'Allow SSH and inbound UDP ports 500 and 4500 for the public IPsec VPN server',
      allowAllOutbound: true,
    })
    securityGroup.addIngressRule(aws_ec2.Peer.anyIpv4(), aws_ec2.Port.tcp(22), 'Allow SSH')
    securityGroup.addIngressRule(
      aws_ec2.Peer.anyIpv4(),
      aws_ec2.Port.udp(500),
      'Allow UDP port 500'
    )
    securityGroup.addIngressRule(
      aws_ec2.Peer.anyIpv4(),
      aws_ec2.Port.udp(4500),
      'Allow UDP port 4500'
    )

    // Volume must be >= 8GB, which is equal to or larger than the minimum
    // snapshot
    const ebsVolume = aws_ec2.BlockDeviceVolume.ebs(8, {
      encrypted: true,
      deleteOnTermination: true,
      volumeType: EbsDeviceVolumeType.GP3,
    })

    // Allow sts:AssumeRole on Resource ${PublicIPsecVpnEC2Role.Arn} (Principle:
    // Service:ec2.amazonaws.com)
    const role = new aws_iam.Role(this, 'PublicIPsecVpnEC2Role', {
      roleName: region + '_PublicIPsecVpnEC2Role',
      // Select a trusted entity
      assumedBy: new aws_iam.ServicePrincipal('ec2.amazonaws.com'),
    })

    // The policy for EC2 Role to enable Systems Manager service core
    // functionality.
    role.addManagedPolicy(
      aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    )

    const ec2Instance = new aws_ec2.Instance(this, 'Instance', {
      vpc,
      role,
      securityGroup,
      instanceType,
      keyPair,
      machineImage: ami,
      blockDevices: [{deviceName: '/dev/xvda', volume: ebsVolume}],
      vpcSubnets: {
        // If you want your instances to have a public IP address and be directly reachable from
        // the Internet, you must place them in a public subnet.
        subnetType: aws_ec2.SubnetType.PUBLIC,
      },
    } as InstanceProps)

    // Create an asset that will be used as part of User Data to run on first
    // load. See S3 assets:
    // https://docs.aws.amazon.com/cdk/v2/guide/assets.html#assets_types_s3
    const asset = new Asset(this, 'Asset', {path: path.join(__dirname, '../src/config.sh')})
    const localPath = ec2Instance.userData.addS3DownloadCommand({
      bucket: asset.bucket,
      bucketKey: asset.s3ObjectKey,
    })
    ec2Instance.userData.addExecuteFileCommand({
      filePath: localPath,
      arguments: '--verbose -y',
    })
    asset.grantRead(ec2Instance.role)
    // Another way to add user data
    // let command = `export USER_NAME=${name} \n`;
    // let text = fs.readFileSync("./lib/user-data.sh", "utf8");
    // ec2Instance.addUserData(command.concat(text));
    // ec2Instance.addUserData(fs.readFileSync("./lib/user-data.sh", "utf8"));

    // Create outputs for connecting
    new CfnOutput(this, 'IP Address', {value: ec2Instance.instancePublicIp})
    new CfnOutput(this, 'Key Pair Name', {value: keyPair.keyPairName})

    // The secret names by default are prefixed with ec2-ssh-key/, the private
    // key is suffixed with /private, the public key is suffixed with /public.
    // The key pair created by the L1 CloudFormation constructs has the following
    // path name
    const pemFilename = keyPair.keyPairName + '.pem'
    const downKeyCmd = [
      `aws ssm get-parameter --name /ec2/keypair/${keyPair.keyPairId}`,
      '--with-decryption',
      '--query Parameter.Value',
      `--profile personal`,
      `--output text > ${pemFilename}`,
      `&& chmod 400 ${pemFilename}`,
    ].join(' ')
    new CfnOutput(this, 'Download Key Command', {value: downKeyCmd})
    new CfnOutput(this, 'SSH command', {
      // U can add the following option to the ssh command: -o IdentitiesOnly=yes
      value: `ssh -i "${pemFilename}" ubuntu@` + ec2Instance.instancePublicIp,
    })
    const scpCmdPrefix = `scp -i "${pemFilename}" ubuntu@${ec2Instance.instancePublicIp}:`
    new CfnOutput(this, 'Download VPN profile for iOS & macOS:', {
      value: scpCmdPrefix + 'vpnclient.mobileconfig ~/Desktop',
    })
    new CfnOutput(this, 'Download VPN profile for Windows & Linux:', {
      value: scpCmdPrefix + 'vpnclient.p12 ~/Desktop',
    })
  }
}
