# This class provides class and methods for simple IoT device simulation
import random
import math
import datetime
import time
import json
import settings

# define the Device class
class Device:

    def __init__(self, name):
        self.name = name
        self.timeStampEpoch = int(time.time() * 1000)
        self.timeStampIso = datetime.datetime.isoformat(datetime.datetime.now())
        self.humidity='20'


    def get_payload(self):
        return json.dumps({"name": self.name,"humidity": self.humidity, "timeStampEpoch": self.timeStampEpoch, "timeStampIso": self.timeStampIso})

    def update(self):
        self.timeStampEpoch = int(time.time() * 1000)
        self.humidity=random.randint(20, 45)
        self.timeStampIso = datetime.datetime.isoformat(datetime.datetime.now())