# Serverless Reference Architecture: IoT Backend

The serverless IoT backend reference architecture is a general-purpose, event-driven, IoT data processing architecture that uses [AWS Lambda](https://aws.amazon.com/lambda). This architecture is ideal for workloads where IoT data needs to be ingested, custom rules applied and prepared for further analysis such as Machine Learning.

This architecture and sample implementation provides a framework for ingesting IoT messages utilizing [AWS IoT Core](https://aws.amazon.com/iot-core/) and AWS Lambda.

In this demo humidity sensor application, IoT soil-moisture sensors deliver messages to the IoT backend. IoT rules check if humidity is under a set threshold and invoke a Lambda function if that's the case. The Lambda function sends an alert email notification. All of the IoT data is stored in S3 for downstream processing.

## ⚠️ Important Disclaimer

**This project is intended as a reference architecture for educational and demonstration purposes only. It is NOT suitable for production use.**

## Architecture Diagram

![Reference Architecture - IoT Backend](./iot-serverless-backend-architecture.png)

## Application Components

**Note**: Downstream data processing components in the architecture diagram - AWS IoT Analytics, Amazon SageMaker, Amazon Kinesis Data Streams, and Amazon DynamoDB are not included in this deployment.

### IoT Device/Thing

A soil moisture IoT sensor simulates a message with timestamp and soil humidity, and sends the message to the MQTT topic `device/[deviceName]/devicePayload` using the MQTT protocol.

### IoT Core

AWS IoT Core is a managed cloud service that lets connected devices easily and securely interact with cloud applications and other devices. All the messages from the sensor are delivered to an IoT topic. IoT rules act on incoming data based on the condition defined. In this example, one IoT Rule is configured to save all messages to an S3 bucket. Another IoT rule checks if humidity in the message is less than a certain threshold (set to 35 in this example) and invokes an AWS Lambda function. The AWS Lambda function parses the message to obtain device name and humidity, and sends an alert using an Amazon SNS Topic.

### Downstream Processing

As mentioned in the note above, downstream processing is not implemented as part of this deployment and is shown as part of what's possible. The data ingested in AWS IoT Core is stored in an S3 bucket. This data can be analyzed using services like Amazon SageMaker to train a machine learning model or can be analyzed using AWS IoT Analytics.

## Running the Example

You can use the provided [AWS CloudFormation template](./iot-backend.yaml) to launch a stack that demonstrates the IoT backend reference architecture. Details about the resources created by this template are provided in the _CloudFormation Template Resources_ section of this document.

### Deploying the template

**Important:** You can deploy the template in the following regions: `us-east-1`, `us-east-2`, `us-west-1`, `us-west-2`, or `eu-west-1`.

Change the SNSEmail address parameter to your own email and run the command on your terminal to deploy the CloudFormation template.

First, set up environment variables to customize your deployment:

```bash
# Set your preferred AWS region (us-east-1, us-east-2, us-west-1, us-west-2, or eu-west-1)
export AWS_REGION=us-east-1

# Set your email for SNS notifications
export SNS_EMAIL=your-email@domain.com

# Set a unique S3 bucket name for assets
export IOT_ASSETS_BUCKET=iot-backend-assets-$(date +%s)

# Set the CloudFormation stack name
export STACK_NAME=iot-backend
```

Create the S3 bucket and upload the environment.zip file:

```bash
# Create S3 bucket with unique name
aws s3 mb s3://$IOT_ASSETS_BUCKET --region $AWS_REGION

# Upload environment.zip to the bucket
aws s3 cp environment.zip s3://$IOT_ASSETS_BUCKET/
```

Deploy the CloudFormation template:

```bash
aws cloudformation deploy \
  --template-file iot-backend.yaml \
  --stack-name $STACK_NAME \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides SNSEmail=$SNS_EMAIL AssetsBucket=$IOT_ASSETS_BUCKET \
  --region $AWS_REGION
```

or you can directly go to the CloudFormation console and upload the template there.

### Seeing the IoT messages and alerts

After you successfully deploy the stack, you will observe the following:

1. As part of the template, an Amazon EC2 instance will be provisioned and it will start sending messages to the IoT Core automatically. To see the messages, go to the IoT Core console, navigate to the MQTT test client, and put `device/+/devicePayload` (without the quotes) in the "Subscription topic" field to see messages from all devices, or use `#` to see all topics. Keep every other field as is. Click "Subscribe to topic".
2. You will see the messages flowing from the devices to the IoT Core in the console. Messages will look like below:

```
    {
        "name": "soilSensor3",
        "humidity": 29,
        "timeStampEpoch": 1598536072677,
        "timeStampIso": "2020-08-27T13:47:52.677721"
    }
```

3. You will get an email with the subject line “AWS Notification - Subscription Confirmation” to confirm that you want to get the notifications, in case the humidity sensor devices record data under a certain threshold. Confirm the subscription from the email.
4. You should start getting emails for messages where humidity is below the threshold (< 35).
   Notification email will look like:
   `Attention:Humidity Under Threshold`
   Humidity 32 under threshold for device name soilSensor2
5. To stop getting emails, go to the email you received, in step 3, and click `sns-opt-out` at the bottom of that email.

## Updating and Re-deploying

If you need to modify the IoT device simulation code or other components, follow these steps to update your deployment:

### Updating the Environment Files

1. **Modify the source code**: Edit the files in the `environment/` directory:

   - `app.py` - Main IoT device simulator
   - `device.py` - Device class and sensor logic
   - `settings.py` - Configuration settings
   - `requirements.txt` - Python dependencies

2. **Create updated environment.zip**:

```bash
# Navigate to the environment directory
cd environment

# Create new zip file with updated code
zip -r ../environment.zip .

# Return to project root
cd ..
```

3. **Upload updated files to S3**:

```bash
# Upload the new environment.zip to your assets bucket
aws s3 cp environment.zip s3://$IOT_ASSETS_BUCKET/ --region $AWS_REGION
```

### Re-deploying the EC2 Instance

Since the EC2 instance downloads and runs the code during initial boot, you need to replace the instance to pick up changes:

#### Option 1: Update CloudFormation Stack (Recommended)

```bash
# Get the current instance ID before termination
INSTANCE_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $AWS_REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`InstanceId`].OutputValue' \
  --output text)

# Terminate the current EC2 instance to force replacement
echo "Terminating current instance: $INSTANCE_ID"
aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $AWS_REGION > /dev/null 2>&1

# Wait for instance to terminate
echo "Waiting for instance to terminate..."
aws ec2 wait instance-terminated --instance-ids $INSTANCE_ID --region $AWS_REGION

# Update the stack to create a new instance with updated code
echo "Updating CloudFormation stack to create new instance..."
aws cloudformation update-stack \
  --stack-name $STACK_NAME \
  --template-body file://iot-backend.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameters ParameterKey=SNSEmail,ParameterValue=$SNS_EMAIL \
               ParameterKey=AssetsBucket,ParameterValue=$IOT_ASSETS_BUCKET \
  --region $AWS_REGION

# Wait for update to complete
echo "Waiting for stack update to complete..."
aws cloudformation wait stack-update-complete --stack-name $STACK_NAME --region $AWS_REGION
echo "Stack update completed! New instance created with updated code."
```

#### Option 2: Quick Development Cycle

For rapid development and testing, you can SSH into the running instance and update code directly:

```bash
# Get instance details
INSTANCE_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $AWS_REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`InstanceId`].OutputValue' \
  --output text)

PUBLIC_IP=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $AWS_REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`PublicIP`].OutputValue' \
  --output text)

echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo ""
echo "To connect via SSM Session Manager:"
echo "aws ssm start-session --target $INSTANCE_ID --region $AWS_REGION"
echo ""
echo "Once connected, you can:"
echo "1. Stop the current IoT simulator: sudo pkill -f app.py"
echo "2. Update code in /home/ec2-user/environment/"
echo "3. Restart the simulator: cd /home/ec2-user/environment && python3 app.py \"\$(aws iot describe-endpoint --endpoint-type iot:Data-ATS --region $AWS_REGION)\" &"
```

**Note**: Option 2 is only for development/testing. Changes made directly on the instance will be lost if the instance is terminated or replaced.

### Troubleshooting

If you encounter issues:

1. **No messages appearing**: Check that the EC2 instance is running and has the correct IAM permissions
2. **Certificate errors**: Ensure the IoT policy is properly attached to the certificate
3. **Lambda not triggering**: Verify the IoT Rule SQL syntax and that messages match the humidity threshold condition
4. **No email notifications**: Check your email (including spam folder) and confirm the SNS subscription

### Cleaning Up

To delete all the resources created in this example, use the provided cleanup script with the same environment variables:

```bash
# Make the cleanup script executable (if not already)
chmod +x cleanup.sh

# Run the cleanup script
./cleanup.sh
```

The cleanup script will automatically:

1. Stop the EC2 instance to prevent more data from being written to S3
2. Empty and delete the RuleFilterBucket
3. Delete the assets bucket and its contents
4. Clean up any remaining IoT resources
5. Delete the CloudFormation stack
6. Wait for stack deletion to complete

**Note:** Make sure you have the same environment variables set that you used for deployment:

- `AWS_REGION`
- `STACK_NAME`
- `IOT_ASSETS_BUCKET`

**Alternative Manual Cleanup:**

1. **Stop the EC2 instance**: Go to the EC2 console, find the instance (tagged as "EC2 Instance for IoT Simulator"), and stop it to prevent more data from being written to S3
2. **Delete the S3 buckets**: Go to the S3 console and delete both the RuleFilterBucket and your assets bucket (empty them first if needed)
3. **Delete the IoT Policy**: Go to IoT Core > Secure > Policies, select `serverless-iot-backend-policy` and delete it
4. **Delete the IoT Thing**: Go to IoT Core > Manage > Things, select `serverless-iot-backend-thing` and delete it
5. **Delete the CloudFormation stack**: Go to the CloudFormation console and delete the stack

## CloudFormation Template Resources

### Resources

[The provided template](./iot-backend.yaml) creates the following resources:

- **ECInstanceProfile** - We need devices that will monitor the soil humidity/temperature. In this example we are using an EC2 instance that will simulate the data generated by devices and send it to the MQTT Queue. We are using SSM Systems Manager to launch this instance.

  AWS Systems Manager is an AWS service that you can use to view and control your infrastructure on AWS. Using the Systems Manager console, you can view operational data from multiple AWS services and automate operational tasks across your AWS resources. Systems Manager helps you maintain security and compliance by scanning your managed instances and reporting on (or taking corrective action on) any policy violations it detects.

- **IoTPolicy** - AWS IoT policies are JSON documents. AWS IoT policies allow you to control access to the AWS IoT data plane. The AWS IoT data plane consists of operations that allow you to connect to the AWS IoT message broker, send and receive MQTT messages.

- **IoTThing** - This is the representation of devices in IoT. A thing is a representation of a specific device or logical entity. It can be a physical device or sensor (for example, a light bulb or a switch on a wall). It can also be a logical entity like an instance of an application or physical entity that does not connect to AWS IoT but is related to other devices that do (for example, a car that has engine sensors or a control panel).

- **RuleFilterBucket** - An S3 bucket that holds the data that comes from the devices (soil sensors).

- **IoTTopicRule** - Rules give your devices the ability to interact with AWS services. Rules are analyzed and actions are performed based on the MQTT topic stream. In this case the IoT Rule simply puts the data received from the devices to `RuleFilterBucket` in the following format: `device/[deviceId]/devicePayload/[timestamp]`.

- **IoTFunction Events** - The Lambda function is configured with an IoT Rule event source that triggers when humidity falls below a certain threshold (< 35). This automatically invokes the Lambda function to send SNS notifications.

- **IoTFunction** - This is the Lambda function that publishes the message in the SNS topic.

- **AlertSNSTopic** - Amazon Simple Notification Service (SNS) is a highly available, durable, secure, fully managed pub/sub messaging service that enables you to decouple microservices, distributed systems, and serverless applications. Amazon SNS provides topics for high-throughput, push-based, many-to-many messaging. In our example we are using an Amazon SNS topic to fan out notifications to end users using email in case soil humidity falls below a certain threshold.
