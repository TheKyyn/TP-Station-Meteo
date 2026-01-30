/*
  Bridge MQTT -> WebSocket

  - se connecte au broker MQTT (captain.dev0.pandor.cloud:1884)
  - ecoute le topic "station/data"
  - retransmet les messages a tous les clients WebSocket (port 8080)
  - recoit les commandes WS et les publie sur "station/command" (bonus, à faire si temps)
*/

const mqtt = require('mqtt');
const WebSocket = require('ws');

const MQTT_BROKER = 'mqtt://captain.dev0.pandor.cloud';
const MQTT_PORT = 1884;
const WS_PORT = 8080;
const TOPIC_DATA = 'station/data';

const brokerUrl = `${MQTT_BROKER}:${MQTT_PORT}`;

const wss = new WebSocket.Server({ host: 'localhost', port: WS_PORT });

wss.on('listening', () => {
  console.log(`WebSocket sur ws://localhost:${WS_PORT}`);
});

const bridgeClient = mqtt.connect(brokerUrl, {
  clientId: 'bridge-mqtt-ws-' + Date.now(),
  clean: true,
  reconnectPeriod: 5000,
});

bridgeClient.on('connect', () => {
  console.log('Connecté au broker', brokerUrl);
  bridgeClient.subscribe(TOPIC_DATA, (err) => {
    if (err) console.error('Erreur abonnement', TOPIC_DATA, err);
    else console.log('Abonné à', TOPIC_DATA);
  });
});

bridgeClient.on('message', (topic, payload) => {
  const raw = payload.toString();
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(raw);
  });
});

bridgeClient.on('error', (err) => {
  console.error('Erreur MQTT:', err.message);
});

bridgeClient.on('offline', () => {
  console.log('Broker déconnecté, reconnexion...');
});
