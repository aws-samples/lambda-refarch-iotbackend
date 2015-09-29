
# AWS Lambda Reference Architecture:  IoT Back End

AWS Lambda Reference Architecture for creating an IoT Back End. The architecture described in this [diagram](https://s3.amazonaws.com/awslambda-reference-architectures/iot-backend/lambda-refarch-iotbackend.pdf) can be created with an AWS CloudFormation
template.

[The
template](https://s3.amazonaws.com/awslambda-reference-architectures/iot-backend/lambda_iot_backend.template)
does the following:

-   Creates a Amazon Kinesis stream.

-   Creates an Amazon Simple Storage Serice (Amazon S3) bucket named
    &lt;stackname&gt;-eventarchive-&lt;awsaccountid&gt;.

-   Creates an Amazon DynamoDB table named &lt;stackname&gt;-SensorData.

-   Creates Lambda Function 1 (&lt;stackname&gt;-IoTS3EventProcessor),
    which receives records from Amazon Kinesis and writes objects to the S3
    bucket.

-   Creates Lambda Function 2 (&lt;stackname&gt;-IoTDDBEventProcessor),
    which receives records from Amazon Kinesis and writes records to the
    DynamoDB table and Amazon CloudWatch.

-   Creates an AWS Identity and Access Management (IAM) role and policy to allow the event-processing Lambda functions to write to Amazon CloudWatch Logs, read from the Amazon Kinesis streams, and write to the S3 bucket and DynamoDB table.

-   Creates Lambda Function 3 (&lt;stackname&gt;-IoTAPI), which accepts
    synchronous calls from clients and reads historical data from the
    DynamoDB table.

-   Creates an IAM role and policy to allow Lambda Function 3 to write
    to CloudWatch Logs and query the DynamoDB table.

-   Creates an IAM user with credentials and policy containing
    permissions to invoke Lambda Function 3 and put records into the
    Amazon Kinesis stream.

In addition, the AWS CloudFormation template uses a Lambda function as a
AWS CloudFormation custom resource to create the Amazon Kinesis stream as an
input event source to Lambda Function 1 and 2.

## Test HTML Page

The services that are configured by the AWS CloudFormation template can be tested with the HTML page testpage.html, which acts the same way as a simple device. It can submit events to the Amazon Kinesis stream and make synchronous calls to Lambda Function 3 to retrieve event data from DynamoDB.

In a production scenario it would be the devices or device gateways that make the calls to the AWS services.

## Instructions

**Important:** Because the AWS CloudFormation stack name is used in the name of
the S3 bucket, that stack name must only contain lowercase letters. Please use
lowercase letters when typing the stack name.

Step 1 – Create an AWS CloudFormation stack with [the
template](https://s3.amazonaws.com/awslambda-reference-architectures/iot-backend/lambda_iot_backend.template)
using a lowercase name for the stack.

Step 2 – Open the testpage.html file in a text editor and insert the
configuration parameters, which you can get from the Outputs tab of the
AWS CloudFormation template once it’s created. Save the file once the
configuration has been changed.

Step 3 – Open the testpage.html in a web browser and try submitting a
value for a sensor ID using the Submit button. You can type any values
you like into the text fields.

Step 4 – View the contents of the S3 bucket, which will have one object.
Lambda Function 2 sets the key of the object to a today’s date and the
sequence number of the Amazon Kinesis event.

Step 5 – Explore the DynamoDB table. The table contains a record
with the data submitted.

Step 6 – Using the Query button, make a query for the same sensor ID that
you submitted an event for. The previously stored data is retrieved and
displayed in the output field.

## Cleanup

To remove all created resources, delete the AWS CloudFormation stack.

**Note:** Deletion of the S3 bucket will fail unless all files in the
bucket are removed before the stack is deleted.
