/* Copyright 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"). You may not use 
this file except in compliance with the License. A copy of the License is 
located at

http://aws.amazon.com/apache2.0/

or in the "license" file accompanying this file. This file is distributed on an 
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or 
implied. See the License for the specific language governing permissions and 
limitations under the License. */

// Lambda function acting as API endpoint for IoT Reference Architecture

console.log('Loading function');

var AWS = require('aws-sdk');
var DOC = require('dynamodb-doc');

var cw = new AWS.CloudWatch();
var doc = new DOC.DynamoDB();

exports.handler = function(event, context) {
    console.log('Received event:', JSON.stringify(event, null, 2));

    var stackName = context.functionName.split("-")[0];

    var params = {
        TableName: stackName + '-SensorData',
        Limit: 20,                  //return the 20...
        ScanIndexForward: false,    //... most recent items
        KeyConditions: [doc.Condition('SensorId', 'EQ', event.sensorid)]
    };

    doc.query(params, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            context.fail(err);
        } else {
            console.log(data);           // successful response
            context.succeed(data);
        }
    });
}
