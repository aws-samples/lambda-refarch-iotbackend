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
