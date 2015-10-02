/* Copyright 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"). You may not use 
this file except in compliance with the License. A copy of the License is 
located at

http://aws.amazon.com/apache2.0/

or in the "license" file accompanying this file. This file is distributed on an 
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or 
implied. See the License for the specific language governing permissions and 
limitations under the License. */

// Lambda function acting as Event Processor for IoT Reference Architecture

console.log('Loading function');

var AWS = require('aws-sdk');
var DOC = require('dynamodb-doc');

var cw = new AWS.CloudWatch();
var doc = new DOC.DynamoDB();

exports.handler = function(event, context) {
    console.log('Received event:', JSON.stringify(event, null, 2));

    event.Records.forEach(function(record) {
        payload = new Buffer(record.kinesis.data, 'base64').toString('ascii');
        console.log('Decoded payload:', payload);

        update(JSON.parse(payload), context);
    });
};

var update = function(event, context) {

    var stackName = context.functionName.split("-")[0];

    var itemParams = {
        TableName: stackName + '-SensorData',
        Item: {
            SensorId: event.sensorid,
            Timestamp: event.timestamp,
            Value: event.value
        }
    };

    doc.putItem(itemParams, function(err, data) {
        if (err) {
            console.log('DDB call failed: ' + err, err.stack);
            context.error(err);
        } else {

            //if all is well - also log the metric to CloudWatch
            logMetric(event, function(err, data) {
                if (err) {
                    console.log('CW call failed: ' + err, err.stack);
                    context.error(err);
                } else {
                    context.succeed();
                }
            });
        }
    });
};

var logMetric = function(event, callback) {
    var params = {
        MetricData: [{
            MetricName: 'SensorData',
            Dimensions: [{ Name: 'SensorId', Value: event.sensorid }],
            Timestamp: new Date(event.timestamp),
            Value: event.value
        }],
        Namespace: 'Sensors'
    };

    cw.putMetricData(params, callback);
};
