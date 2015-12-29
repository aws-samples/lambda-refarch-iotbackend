/* Copyright 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"). You may not use
this file except in compliance with the License. A copy of the License is
located at

http://aws.amazon.com/apache2.0/

or in the "license" file accompanying this file. This file is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing permissions and
limitations under the License. */

var AWS = require('aws-sdk');

var lambda = new AWS.Lambda();
var s3 = new AWS.S3();

var s3Bucket;

exports.handler = function(event, context) {
  if (s3Bucket) {
    handleEvent(event, context);
  } else {
    lambda.getFunction({
      "FunctionName": context.functionName,
      "Qualifier": context.functionVersion
    }, function(err, data) {
      if (err) {
        console.log("Error fetching function details: " + err);
        context.fail(err);
      } else {
        var description = data.Configuration.Description;
        if (description) {
          try {
            var config = JSON.parse(description);
            if(config.archiveBucket) {
              s3Bucket = config.archiveBucket;
            } else {
              console.log("Error: no archiveBucket defined in configuration.");
              context.fail("Lambda configuration error");
            }
          } catch (e) {
            console.log("Error deserializing description");
            context.fail(e);
          }
        }
        handleEvent(event, context);
      }
    });
  }
};

function handleEvent(event, context) {
    console.log(JSON.stringify(event, null, 2));

    if(event.Records.length == 0) {
        //Nothing to do
        console.log('Got no records.');
        context.succeed();
        return;
    }

    var firstRecord = event.Records[0];
    var stackName = context.functionName.split("-")[0];
    var accountId = firstRecord.eventSourceARN.split(":")[4];
    var date = new Date();
    var s3Key = date.toISOString().split("T")[0] + "/" + firstRecord.kinesis.sequenceNumber + ".json";

    var body = "{ \"Records\" : [\n";

    event.Records.forEach(function(record, index) {
        // Kinesis data is base64 encoded so decode here
        var payload = new Buffer(record.kinesis.data, 'base64').toString('ascii');

        console.log('Decoded payload:', payload);

        body = body + (index == 0 ? "" : ",\n") + payload;
    });

    body = body + "\n]}";

    var params = {
        Bucket: s3Bucket,
        Key: s3Key,
        Body: body
    };

    s3.putObject(params, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            context.fail(err);
        } else {
            console.log(data);           // successful response
            context.succeed();
        }
    });
}
