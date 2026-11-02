import json, random, time
from datetime import datetime, timezone
import paho.mqtt.client as mqtt

BROKER = "localhost"
DEVICE_ID = "ESP32-001"
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="nexsense-simulator")
client.connect(BROKER, 1883, 60)
client.loop_start()
print("Publishing demo telemetry. Ctrl+C to stop.")
temperature = 27.0
try:
    while True:
        temperature += random.uniform(-0.4, 0.5)
        payload = {
            "deviceId": DEVICE_ID,
            "temperature": round(temperature, 2),
            "humidity": round(random.uniform(45, 75), 2),
            "relayOn": False,
            "recordedAt": datetime.now(timezone.utc).isoformat()
        }
        client.publish(f"nexsense/devices/{DEVICE_ID}/telemetry", json.dumps(payload), qos=1)
        print(payload)
        time.sleep(3)
except KeyboardInterrupt:
    pass
finally:
    client.loop_stop()
    client.disconnect()
