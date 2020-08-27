"""
Modify these values to match your configuration
"""
# AWS IoT endpoint settings
HOST_NAME = "ahrxvb36afpwx-ats.iot.eu-west-1.amazonaws.com" # replace with your AWS IoT endpoint for your region
HOST_PORT = 8883 # leave this as-is
# thing certs & keys
PRIVATE_KEY = "certs/private.pem.key" # replace with your private key name
DEVICE_CERT = "certs/certificate.pem.crt" # replace with your certificate name
ROOT_CERT = "certs/root-ca.pem"
# device & message settings
BATTERY_DISCHARGE_RANGE = (1, 3) # tuple that stores the possible discharge rates of the battery
# RANDOM_INTEGER_RANGE = (1,10) # tuple that stores the possible range of your sensor reading
QOS_LEVEL = 0 # AWS IoT supports QoS levels 0 & 1 for MQTT sessions
