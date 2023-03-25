#!/bin/bash -xe

# This VPN server is bundled with Fail2Ban and Libreswan

# Update with optional user data that will run on instance start.
# Learn more about user-data:
# https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html

# Run
# sudo dnf update
# Or run
# sudo apt-get update && sudo apt-get dist-upgrade
# Use the AWS CLI to reboot the instance instead of the OS reboot command within
# your instance: aws ec2 reboot-instances --instance-ids

# This is the option 3 — Define your VPN credentials as environment variables.

# Run this command first:
sudo wget https://get.vpnsetup.net -O vpn.sh
# On the OS AL2023, u will get the error "amazon-linux-extras: command not
# found"

sudo VPN_IPSEC_PSK="$(aws ssm get-parameter --name /ec2/vpn_ipsec_psk --with-decryption --query Parameter.Value --output text)" \
  VPN_USER="$(aws ssm get-parameter --name /ec2/vpn_user --with-decryption --query Parameter.Value --output text)" \
  VPN_PASSWORD="$(aws ssm get-parameter --name /ec2/vpn_password --with-decryption --query Parameter.Value --output text)" \
  sh vpn.sh

# All values MUST be placed inside 'single quotes'
# DO NOT use these special characters within values: \ " '
# Note: A secure IPsec PSK should consist of at least 20 random characters.

# Client configuration is available at:
# /home/ubuntu/vpnclient.p12 (for Windows & Linux)
# /home/ubuntu/vpnclient.sswan (for Android)
# /home/ubuntu/vpnclient.mobileconfig (for iOS & macOS)
