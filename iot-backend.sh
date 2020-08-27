#!/bin/bash

POLICY_NAME="serverless-iot-backend-policy"
THING_NAME="serverless-iot-backend-thing"

# Creates a 2048-bit RSA key pair and issues an X.509 certificate using the issued public key.
echo "\nCreating the keys and certificate"
CERTIFICATE_ARN=$(aws iot create-keys-and-certificate \
  --set-as-active \
  --certificate-pem-outfile "serverless-iot-backend.cert.pem" \
  --public-key-outfile "serverless-iot-backend.public.key" \
  --private-key-outfile "serverless-iot-backend.private.key" | python -c 'import json,sys;obj=json.load(sys.stdin);print obj["certificateArn"]')
echo $CERTIFICATE_ARN

# Attach aws iot policy to device certificate
echo "\nAttaching certificate to a thing"
aws iot attach-thing-principal \
  --thing-name $THING_NAME \
  --principal $CERTIFICATE_ARN

# Attach a policy to a certificate
echo "\nAttaching iot policy to a certificate"
aws iot attach-policy \
	--policy-name $POLICY_NAME \
	--target $CERTIFICATE_ARN
