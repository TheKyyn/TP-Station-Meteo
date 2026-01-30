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

const char* ssid = "NOM_WIFI"; // à changer
const char* password = "MOT_DE_PASSE"; // à changer

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
  Serial.begin(115200);

  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_C, OUTPUT);
  pinMode(LED_F, OUTPUT);

  // celsius par defaut
  digitalWrite(LED_C, HIGH);
  digitalWrite(LED_F, LOW);

  if (!MODE_SIMULATION) {
    dht.begin();
  }

  // wifi
  WiFi.begin(ssid, password);
  Serial.print("Connexion WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" OK");
  Serial.println(WiFi.localIP());

  // mqtt
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  if (digitalRead(BTN_PIN) == LOW && (millis() - lastDebounce > debounceDelay)) {
    lastDebounce = millis();
    isCelsius = !isCelsius;
    updateLeds();
    Serial.println(isCelsius ? "Mode: Celsius" : "Mode: Fahrenheit");
  }

  // publication toutes les 5s (à changer si besoin)
  if (millis() - lastPublish >= publishInterval) {
    lastPublish = millis();

    float temp, hum;

    if (MODE_SIMULATION) {
      temp = random(180, 300) / 10.0; // valeur changeable au besoin
      hum = random(400, 800) / 10.0; // idem
    } else {
      temp = dht.readTemperature();
      hum = dht.readHumidity();
      if (isnan(temp) || isnan(hum)) {
        Serial.println("Erreur lecture DHT");
        return;
      }
    }

    if (!isCelsius) {
      temp = temp * 1.8 + 32;
    }

    publishData(temp, hum);
  }
}

void updateLeds() {
  digitalWrite(LED_C, isCelsius ? HIGH : LOW);
  digitalWrite(LED_F, isCelsius ? LOW : HIGH);
}

void publishData(float temp, float hum) {
  StaticJsonDocument<128> doc;
  doc["temperature"] = temp;
  doc["humidity"] = hum;
  doc["unit"] = isCelsius ? "C" : "F";
  doc["simulation"] = MODE_SIMULATION;

  char buffer[128];
  serializeJson(doc, buffer);

  client.publish(topic_data, buffer);
  Serial.print("Publie: ");
  Serial.println(buffer);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connexion MQTT...");
    if (client.connect("esp32-station")) {
      Serial.println(" OK");
      client.subscribe(topic_cmd);
    } else {
      Serial.print(" echec, rc=");
      Serial.print(client.state());
      Serial.println(" retry 5s");
      delay(5000);
    }
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  char msg[length + 1];
  memcpy(msg, payload, length);
  msg[length] = '\0';

  StaticJsonDocument<64> doc;
  deserializeJson(doc, msg);

  const char* unite = doc["unit"];
  if (strcmp(unite, "C") == 0) {
    isCelsius = true;
  } else if (strcmp(unite, "F") == 0) {
    isCelsius = false;
  }
  updateLeds();
  Serial.print("Commande recue: ");
  Serial.println(unite);
}