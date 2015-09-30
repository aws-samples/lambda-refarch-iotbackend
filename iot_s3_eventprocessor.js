var AWS = require('aws-sdk');
var s3 = new AWS.S3();

exports.handler = function(event, context) {
    console.log(JSON.stringify(event, null, 2));

    var stackName = context.functionName.split("-")[0];
    var accountId = event.Records[0].eventSourceARN.split(":")[4];
    var s3Bucket = stackName + "-eventarchive-" + accountId;
    var date = new Date();
    var s3Key = date.toISOString().split("T")[0] + "/" + event.Records[0].kinesis.sequenceNumber + ".json";

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
};
