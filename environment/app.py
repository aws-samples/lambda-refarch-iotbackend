### Leverages the AWS IoT SDK for Python

# Import SDK packages
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
import settings  # importing configuration file
import device  # import device class
import time
import random
import string
import json
import sys

# create devices
dev_names = ['soilSensor1', 'soilSensor2', 'soilSensor3']
devs = []  # set up a list to hold your devices
for i in dev_names:
    devs.append(device.Device(i))


# Create a random 8-character string for connection id
CLIENT_ID = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(8))

# create AWS IoT MQTT client
client = AWSIoTMQTTClient(CLIENT_ID)

print("Inside python code")
print(sys.argv[1])
IOT_ENDPOINT_ADDRESS = json.loads(sys.argv[1])["endpointAddress"]

# configure client endpoint / port information & then set up certs

client.configureEndpoint(IOT_ENDPOINT_ADDRESS, settings.HOST_PORT)
client.configureCredentials(settings.ROOT_CERT, settings.PRIVATE_KEY, settings.DEVICE_CERT)
print(IOT_ENDPOINT_ADDRESS)

# configure client connection behavior
client.configureOfflinePublishQueueing(-1)  # Infinite offline Publish queueing
client.configureDrainingFrequency(2)  # Draining: 2 Hz
client.configureConnectDisconnectTimeout(10)  # 10 sec
client.configureMQTTOperationTimeout(5)  # 5 sec

print("Connecting to endpoint " + IOT_ENDPOINT_ADDRESS)
client.connect()

# start loop to begin publishing to topic
while True:
    for dev in devs:
        client.publish("device/" + dev.name + "/devicePayload", dev.get_payload(), settings.QOS_LEVEL)
        print("Published message on topic " + "device/" + dev.name + "/devicePayload" + " with payload: " + dev.get_payload())
        dev.update() # update the device with new data
    time.sleep(30) # just wait a sec before publishing next message
