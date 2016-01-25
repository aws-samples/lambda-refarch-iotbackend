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

var doc = new AWS.DynamoDB.DocumentClient();

var config;

exports.handler = function(event, context) {
  if (config) {
    handleEvent(event, context);
  } else {
    var params = {
      TableName: 'IoTRefArchConfig',
      Key: { Environment: 'demo' }
    };
    doc.get(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        context.fail(err);
      } else {
        config = data.Item;
        handleEvent(event, context);
      }
    });
  }
};

function handleEvent(event, context) {
    console.log('Received event:', JSON.stringify(event, null, 2));

    var params = {
        TableName: config.SensorDataTable,
        Limit: 20,                  //return the 20...
        ScanIndexForward: false,    //... most recent items
        KeyConditions: {
          SensorId : {
            ComparisonOperator: 'EQ',
            AttributeValueList: [event.sensorid]
          }
        }
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
