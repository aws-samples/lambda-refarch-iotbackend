# Serverless Reference Architecture: IoT Backend

The Serverless IOT Backend reference architecture is a general-purpose, event-driven, IoT data processing architecture that uses [AWS Lambda](https://aws.amazon.com/lambda). This architecture is ideal for workloads where IoT data needs to be ingested, custom rules applied and prepared for further analysis such as Machine Learning.

This architecture and sample implementation provides a framework for ingesting IoT messages utilizing [AWS IoT Core]((https://aws.amazon.com/iot-core/) and AWS Lambda.

In this demo humidity sensor application, IoT soil-mosture sensors deliver messages to backend. IoT rule checks if humidity is under threshold, and invoke a Lambda function if that's the case. Lambda function sends an alert notification. All the IoT data is stored in S3 for downstreams processing.   


## Architectural Diagram

![Reference Architecture - IoT Backend](https://code.amazon.com/packages/ServerlessIoTBackendRefresh/blobs/mainline/--/iot-serverless-backend-architecture.png?download=1)

## Application Components

**Note**
Downstream Data processing components in the architecture diagram - AWS IoT Analytics, Machine Learning, Amazon Kinesis Data Streams, and Amazon DynamoDB are not included in this deployment.

### IoT Device/Thing

A soil mosture IoT sensor simulates a messages with timestamp and soil humidity, and send the message to an IoT Topic using MQTT protocol. 

### IoT Device/Thing

The message from the sensor is delivered to IoT topic. IoT rules are automatically applied to the topic. Both Iot topic and rule part of AWS Iot Core. IoT rule saves all messages to a S3 bucket. This IoT rule also checks if humidity in the message is less than certain threshold (set to 35 in this example). If humidity is below the threshold, this IoT rule invokes an AWS Lambda function. This Lambda function receives the message as input in the event field, parses the message to obtain device name and humidity, and sends an alert using SNS Topic. 

### Downstream Processing

As mentioned in the Note section, the downstream processing is not implemented as part of this deployment and is shown as art of possible. Machine Learning can be used on all ther humidity data to perform predictions, IoT messages can be streamed to another system using Kinesis Data Streams, or can simply be saved in DynamoDB to be queried later. IoT Analytics can be used on the data using out of the box graphs or custom analysis.    

## Running the Example

You can use the provided [AWS SAM template](./iot-backend.yaml) to launch a stack that demonstrates the Lambda file processing reference architecture. Details about the resources created by this template are provided in the *SAM Template Resources* section of this document.

### Deploying the template

** Important** You can deploy the template in the following regions: `us-east-1` or `eu-west-1`.

Change the SNSEmail address to your own email and run the command on your terminal to deploy the cloud formation.

    ```
    aws cloudformation deploy --template-file iot-backend.yaml --stack-name iot-backend --capabilities CAPABILITY_NAMED_IAM --parameter-overrides SNSEmail=test@amazon.lu --region eu-west-1
    ```

or you can directly go to cloudformation console and upload the templete there.

### Seeing the IoT messages and alerts

After you successfully deploy the stack you will observe the following:

1. As part of the CloudFormation template, an EC2 will be provisioned and it will start sending messages to IoT core automatically. To see the messages, go to IoT Core console, then click  "Test" and put `#` (without the quotes) in "Subscription topic" field which will start accepting messages from all topics. Keep every other field as is. Click "Subscribe to topic".
2. You will see the messages flowing from the devices to IoT Core in the console. Messages will look like below:
```
    {
        "name": "soilSensor3",
        "humidity": 29,
        "timeStampEpoch": 1598536072677,
        "timeStampIso": "2020-08-27T13:47:52.677721"
    }
```
3. You will get an email from `AWS Notification - Subscription Confirmation` to confirm that you want to get the notifications in case the humudity sensor devices record data under a certain threshold. Confirm the subscription from the email.
4. You should start getting emails that the humidity is below the threshold (< 35), so that you can take the action to turn on the sprinkler.
Your email will be like this:
`Attention:Humidity Under Threshold` 
Humidity 32 under threshold for device name soilSensor2
5. To stop getting emails go to the email you received, in step 3, and click `sns-opt-out` that is at the bottom of that email.
6. To cleanup the resources after you are done, please perform the following steps.

### Cleaning Up the Example Resources

To delete all the resources created in this example you should follow the following steps:
1. Delete the s3 RuleFilterBucket: Go to S3 and your bucket will be with name like `iot-backend-rulefilterbucket-xxxxxxxxxxx`, delete all the contents of the bucket and then delete the bucket itself.
2. Delete the IoT Policy: Go to the IoT Core > Secure > Policies, select `serverless-iot-backend-policy` and delete it.
3. Delete the IoT Thing: Go to the IoT Core > Manage > Things, select `serverless-iot-backend-thing` and delete it.
4. Finally, you should go to cloudformation console and select the stack with name `iot-backend` and click the delete button. This will delete all the other resources created in this example

## SAM Template Resources

### Resources
[The provided template](https://code.amazon.com/packages/ServerlessIoTBackendRefresh/blobs/mainline/--/iot-backend.yaml)
creates the following resources:

- **ECInstanceProfile** - We need devices that will monitor the soil humidity/temperature. In this example we are using an EC2 instance that will simulate the data generated by the devices and send it to the MQTT Queue. We are using SSM Systems Manager to launch this instance. 

AWS Systems Manager is an AWS service that you can use to view and control your infrastructure on AWS. Using the Systems Manager console, you can view operational data from multiple AWS services and automate operational tasks across your AWS resources. Systems Manager helps you maintain security and compliance by scanning your managed instances and reporting on (or taking corrective action on) any policy violations it detects.

- **IoTPolicy** - AWS IoT policies are JSON documents. AWS IoT policies allow you to control access to the AWS IoT data plane. The AWS IoT data plane consists of operations that allow you to connect to the AWS IoT message broker, send and receive MQTT messages.

- **IoTThing** - This is the representation of devices in IoT. A thing is a representation of a specific device or logical entity. It can be a physical device or sensor (for example, a light bulb or a switch on a wall). It can also be a logical entity like an instance of an application or physical entity that does not connect to AWS IoT but is related to other devices that do (for example, a car that has engine sensors or a control panel).

- **RuleFilterBucket** - An S3 bucket that holds the data that comes from the devices (soil sensors).

- **IoTTopicRule** - Rules give your devices the ability to interact with AWS services. Rules are analyzed and actions are performed based on the MQTT topic stream. In this case the IoT Rule simply simply puts the data received from the devices to `RuleFilterBucket` in the following format: `RuleFilterBucket/deviceId/Timestamp`.

- **IoTFunctionPutImageEvent** - This is an IoT topic rule, that is created implicity, it triggers the lambda function to publish the message in SNS topic if the humidity falls below a certain threshold.

- **IoTFunction** - This is the lambda funtion that that publishes the message in the SNS topic.

- **AlertSNSTopic** - Amazon Simple Notification Service (SNS) is a highly available, durable, secure, fully managed pub/sub messaging service that enables you to decouple microservices, distributed systems, and serverless applications. Amazon SNS provides topics for high-throughput, push-based, many-to-many messaging. In our example we are using Amazon SNS topics, to fan out notifications to end users using email in case the soil humidity falls below a certain threshold.

## License

This reference architecture sample is licensed under Apache 2.0.