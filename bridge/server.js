/*
  Bridge MQTT -> WebSocket

  - se connecte au broker MQTT (captain.dev0.pandor.cloud:1884)
  - ecoute le topic "station/data"
  - retransmet les messages a tous les clients WebSocket (port 8080)
  - recoit les commandes WS et les publie sur "station/command" (bonus, à faire si temps)
*/

// TODO: implementation du bridge
