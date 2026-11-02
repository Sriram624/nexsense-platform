#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// DEVELOPMENT EXAMPLE ONLY. Configure unique per-device credentials and TLS before deployment.
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_HOST = "192.168.1.100"; // Laptop LAN IP
const int MQTT_PORT = 1883;
const char* DEVICE_ID = "ESP32-001";

#define DHT_PIN 4
#define DHT_TYPE DHT22
#define RELAY_PIN 5

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);
DHT dht(DHT_PIN, DHT_TYPE);
bool relayOn = false;
unsigned long lastPublish = 0;

String telemetryTopic(){ return String("nexsense/devices/")+DEVICE_ID+"/telemetry"; }
String commandTopic(){ return String("nexsense/devices/")+DEVICE_ID+"/command"; }

void onMessage(char* topic, byte* payload, unsigned int length) {
  String body; for(unsigned int i=0;i<length;i++) body+=(char)payload[i];
  if(body.indexOf("\"command\":\"SET_RELAY\"")>=0) {
    relayOn = body.indexOf("\"value\":true")>=0;
    digitalWrite(RELAY_PIN,relayOn?HIGH:LOW);
    // Next telemetry publishes the observed output state; add explicit command IDs/ACKs for production.
  }
}
void connectWifi(){
  WiFi.mode(WIFI_STA); WiFi.begin(WIFI_SSID,WIFI_PASSWORD);
  while(WiFi.status()!=WL_CONNECTED) delay(500);
}
void connectMqtt(){
  while(!mqtt.connected()){
    String id=String("nexsense-")+DEVICE_ID;
    if(mqtt.connect(id.c_str())) mqtt.subscribe(commandTopic().c_str(),1);
    else delay(2000);
  }
}
void setup(){
  Serial.begin(115200); pinMode(RELAY_PIN,OUTPUT); digitalWrite(RELAY_PIN,LOW);
  dht.begin(); connectWifi(); mqtt.setServer(MQTT_HOST,MQTT_PORT);
  mqtt.setCallback(onMessage); mqtt.setBufferSize(512);
}
void loop(){
  if(WiFi.status()!=WL_CONNECTED) connectWifi();
  if(!mqtt.connected()) connectMqtt();
  mqtt.loop();
  if(millis()-lastPublish>=5000){
    lastPublish=millis(); float t=dht.readTemperature(), h=dht.readHumidity();
    if(!isnan(t)&&!isnan(h)){
      char payload[256];
      snprintf(payload,sizeof(payload),
        "{\"deviceId\":\"%s\",\"temperature\":%.2f,\"humidity\":%.2f,\"relayOn\":%s}",
        DEVICE_ID,t,h,relayOn?"true":"false");
      mqtt.publish(telemetryTopic().c_str(),payload,false);
    }
  }
}
