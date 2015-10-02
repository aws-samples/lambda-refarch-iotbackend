// Lambda function acting as Event Processor for IoT Reference Architecture

console.log('Loading function');

var AWS = require('aws-sdk');

var cw = new AWS.CloudWatch();
var doc = new AWS.DynamoDB.DocumentClient();

exports.handler = function(event, context) {
    console.log('Received event:', JSON.stringify(event, null, 2));

    var stackName = context.functionName.split("-")[0];

    var ddbParams = {
        RequestItems: {}
    };

    var putItems = [];

    var cwParams = {
        MetricData: [],
        Namespace: 'Sensors'
    };

    event.Records.forEach(function(record) {
        payload = new Buffer(record.kinesis.data, 'base64').toString('ascii');
        console.log('Decoded payload:', payload);

        var sensorEvent = JSON.parse(payload);

        putItems.push(
            {
                PutRequest: {
                    Item: {
                        SensorId: sensorEvent.sensorid,
                        Timestamp: sensorEvent.timestamp,
                        Value: sensorEvent.value
                    }
                }
            });

        cwParams.MetricData.push(
            {
                MetricName: 'SensorData',
                Dimensions: [{ Name: 'SensorId', Value: sensorEvent.sensorid }],
                Timestamp: new Date(sensorEvent.timestamp),
                Value: sensorEvent.value
            });
    });

    ddbParams.RequestItems[stackName + '-SensorData'] = putItems;

    doc.batchWrite(ddbParams, function(err, data) {
        if (err) {
            console.log('DDB call failed: ' + err, err.stack);
            context.fail(err);
        } else {

            //if all is well - also log the metric to CloudWatch
            cw.putMetricData(cwParams, function(err, data) {
                if (err) {
                    console.log('CW call failed: ' + err, err.stack);
                    context.fail(err);
                } else {
                    context.succeed();
                }
            });
        }
    });
};

