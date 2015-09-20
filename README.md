
# AWS Lambda Reference Architecture:  IoT Backend
--------

AWS Lambda Reference Architecture for creating an IoT Backend. The architecture described in this [diagram]() can be created with a CloudFormation
template.

[The
template](https://s3.amazonaws.com/awslambda-reference-architectures/iot-backend/lambda_iot_backend.template)
does the following:

-   Creates a Kinesis Stream

-   Creates an S3 Bucket named
    &lt;stackname&gt;-eventarchive-&lt;awsaccountid&gt;

-   Creates a DynamoDB table named &lt;stackname&gt;-SensorData

-   Creates Lambda Function 1 (&lt;stackname&gt;-IoTS3EventProcessor)
    which receives records from Kinesis and writes objects to the S3
    Bucket

-   Creates Lambda Function 2 (&lt;stackname&gt;-IoTDDBEventProcessor)
    which receives records from Kinesis and writes records to the
    DynamoDB table and CloudWatch

-   Creates an IAM Role and Policy to allow the event processing Lambda
    functions to write to CloudWatch Logs, read from the Kinesis
    Streams, write to the S3 bucket and DynamoDB table

-   Creates Lambda Function 3 (&lt;stackname&gt;-IoTAPI) which accepts
    synchronous calls from clients and reads historical data from the
    DynamoDB table

-   Creates an IAM Role and Policy to allow Lambda Function 3 to write
    to CloudWatch Logs and query the DynamoDB table

-   Creates an IAM user with credentials and policy containing
    permissions to invoke Lambda Function 3 and put records into the
    Kinesis stream

In addition, the CloudFormation template uses a Lambda function as a
CloudFormation custom resource to create map the Kinesis stream as an
input event source to Lambda Function 1 and 2.

## Instructions

**Important:** As the CloudFormation stack name is used in the name of
the S3 bucket, it must only contain lowercase letters. Please use
lowercase letters when entering the stack name.

Step 1 – Create a CloudFormation Stack with [the
template](https://lambda-iot-ref-arch.s3.amazonaws.com/lambda_iot_ref_arch.template)
using a lowercase name for the stack.

Step 2 – Open the testpage.html file in a text editor and insert the
configuration parameters which you can get from the Outputs tab of the
CloudFormation template once it’s created. Save the file once the
configuration has been changed.

Step 3 – Open the testpage.html in a web browser and try submitting a
value for a sensor ID using the Update button. You can input any values
you like into the text fields.

Step 4 – View the contents of the S3 bucket, which will have one object.
Lambda Function 2 sets the key of the object to a today’s date and the
sequence number of the Kinesis event.

Step 5 – Explore the DynamoDB table. The table will contain a record
with the data submitted.

Step 6 – Using the Query button, make a query for the same sensor ID as
you submitted an event for. The previously stored data is retrieved and
displayed in the output field.

## Cleanup

To remove all created resources, delete the CloudFormation stack.

**Note:** Deletion of the S3 bucket will fail unless all files in the
bucket are removed before the stack is deleted.
