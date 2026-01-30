#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

#define MODE_SIMULATION true   // mettre false pour le vrai capteur

// pins 
#define DHTPIN 4
#define DHTTYPE DHT22
#define BTN_PIN 15
#define LED_C 18
#define LED_F 19

const char* ssid = "NOM_WIFI";
const char* password = "MOT_DE_PASSE";

const char* mqtt_server = "captain.dev0.pandor.cloud";
const int mqtt_port = 1884;
const char* topic_data = "station/data";
const char* topic_cmd = "station/command";

DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);

bool isCelsius = true;
unsigned long lastPublish = 0;
unsigned long lastDebounce = 0;
const unsigned long debounceDelay = 250;
const unsigned long publishInterval = 5000;

void updateLeds();
void publishData(float temp, float hum);
void reconnect();
void callback(char* topic, byte* payload, unsigned int length);

void setup() {
  // TODO: init serial, pins, wifi, mqtt
}

void loop() {
  // TODO: mqtt loop, lecture bouton, publication donnees
}
