# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## Reboot the instance after the OS updates

First, update your server with `sudo apt-get update && sudo apt-get
dist-upgrade` (Ubuntu/Debian) then reboot with `aws ec2 reboot-instances
--profile personal --instance-ids <value>`

Get the InstanceId of the VPN server:

```bash
aws ec2 describe-instances --filters Name=instance-type,Values=t4g.nano \
  --query "Reservations[*].Instances[*].\
  {Id:InstanceId,Type:InstanceType,CurrentState:State.Name,\
  Name:KeyName,PublicIp:PublicIpAddress}" \
  --output table \
  --profile personal
```
