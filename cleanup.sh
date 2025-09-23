#!/bin/bash

# IoT Backend Cleanup Script
# This script cleans up all resources created by the iot-backend CloudFormation stack

set -e  # Exit on any error

# Check if required environment variables are set
if [ -z "$AWS_REGION" ] || [ -z "$STACK_NAME" ] || [ -z "$IOT_ASSETS_BUCKET" ]; then
    echo "Error: Required environment variables are not set."
    echo "Please set the following environment variables:"
    echo "  export AWS_REGION=your-region"
    echo "  export STACK_NAME=your-stack-name"
    echo "  export IOT_ASSETS_BUCKET=your-assets-bucket"
    echo ""
    echo "Example:"
    echo "  export AWS_REGION=eu-west-1"
    echo "  export STACK_NAME=iot-backend"
    echo "  export IOT_ASSETS_BUCKET=iot-backend-assets-1234567890"
    exit 1
fi

echo "Starting cleanup process for IoT Backend stack: $STACK_NAME"
echo "Region: $AWS_REGION"
echo "Assets Bucket: $IOT_ASSETS_BUCKET"
echo ""

# 1. Stop the EC2 instance to prevent more data from being written to S3
echo "Step 1: Stopping EC2 instance..."
INSTANCE_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $AWS_REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`InstanceId`].OutputValue' \
  --output text 2>/dev/null || echo "")

if [ ! -z "$INSTANCE_ID" ]; then
  echo "Stopping EC2 instance: $INSTANCE_ID"
  aws ec2 stop-instances --instance-ids $INSTANCE_ID --region $AWS_REGION > /dev/null 2>&1
  echo "Waiting for instance to stop..."
  aws ec2 wait instance-stopped --instance-ids $INSTANCE_ID --region $AWS_REGION
  echo "Instance stopped successfully"
else
  echo "No EC2 instance found or stack doesn't exist"
fi
echo ""

# 2. Empty and delete the RuleFilterBucket (find the actual bucket name from CloudFormation outputs)
echo "Step 2: Cleaning up RuleFilterBucket..."
RULE_FILTER_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $AWS_REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`RuleFilterBucket`].OutputValue' \
  --output text 2>/dev/null || echo "")

if [ ! -z "$RULE_FILTER_BUCKET" ]; then
  echo "Emptying and deleting RuleFilterBucket: $RULE_FILTER_BUCKET"
  aws s3 rm s3://$RULE_FILTER_BUCKET --recursive --region $AWS_REGION
  aws s3 rb s3://$RULE_FILTER_BUCKET --region $AWS_REGION
  echo "RuleFilterBucket deleted successfully"
else
  echo "No RuleFilterBucket found or stack doesn't exist"
fi
echo ""

# 3. Delete the assets bucket and its contents
echo "Step 3: Cleaning up assets bucket..."
echo "Deleting assets bucket: $IOT_ASSETS_BUCKET"
aws s3 rm s3://$IOT_ASSETS_BUCKET --recursive --region $AWS_REGION 2>/dev/null || echo "Assets bucket not found or already empty"
aws s3 rb s3://$IOT_ASSETS_BUCKET --region $AWS_REGION 2>/dev/null || echo "Assets bucket not found or already deleted"
echo "Assets bucket cleanup completed"
echo ""

# 4. Delete IoT resources (these should be cleaned up by CloudFormation, but just in case)
echo "Step 4: Cleaning up IoT resources..."
aws iot detach-policy --policy-name serverless-iot-backend-policy --target $(aws iot list-thing-principals --thing-name serverless-iot-backend-thing --query 'principals[0]' --output text --region $AWS_REGION) --region $AWS_REGION 2>/dev/null || true
aws iot detach-thing-principal --thing-name serverless-iot-backend-thing --principal $(aws iot list-thing-principals --thing-name serverless-iot-backend-thing --query 'principals[0]' --output text --region $AWS_REGION) --region $AWS_REGION 2>/dev/null || true
echo "IoT resources cleanup completed"
echo ""

# 5. Delete the CloudFormation stack
echo "Step 5: Deleting CloudFormation stack..."
echo "Deleting CloudFormation stack: $STACK_NAME"
aws cloudformation delete-stack --stack-name $STACK_NAME --region $AWS_REGION

# 6. Wait for stack deletion to complete (optional)
echo "Waiting for stack deletion to complete..."
aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME --region $AWS_REGION
echo "Stack deletion completed!"
echo ""

echo "✅ Cleanup process completed successfully!"
echo "All resources for the IoT Backend stack have been removed."