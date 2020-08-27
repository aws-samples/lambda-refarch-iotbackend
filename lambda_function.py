import boto3
import os



sns = boto3.client('sns')
alertsns=os.environ['alert_sns']


def lambda_handler(event, context):
    print(event)
    deviceName=event['name']
    humidity=event['humidity']
                          
    print("send alert")
    alertmessage="Humidity "+ str(humidity) + " under threshold for device name "+ deviceName
    snsresponse=sns.publish(TopicArn=alertsns,
                            Message=alertmessage,
                            Subject="Attention:Humidity Under Threshold")
        
    return ''