/*
  station meteo - script frontend

  - connexion : ws://localhost:8080
  - reception (station/data) : {"temperature": 22.5, "humidity": 65.0, "unit": "C"}
  - envoi (station/command) : {"unit": "C"} ou {"unit": "F"}

  DOM :
  - #temperature, #humidite, #unite, #status, #btn-toggle
*/

const WS_URL = 'ws://' + (location.hostname || 'localhost') + ':8080';

const el = {
  temperature: document.getElementById('temperature'),
  humidite: document.getElementById('humidite'),
  unite: document.getElementById('unite'),
  status: document.getElementById('status'),
  btnToggle: document.getElementById('btn-toggle'),
};

let ws = null;
let lastData = null;

function setStatus(connected) {
  el.status.textContent = connected ? 'Connecté' : 'Déconnecté';
  el.status.className = 'status ' + (connected ? 'connecte' : 'deconnecte');
}

function afficher(data) {
  if (!data) return;
  lastData = data;
  if (el.temperature) el.temperature.textContent = data.temperature ?? '--';
  if (el.humidite) el.humidite.textContent = data.humidity ?? '--';
  if (el.unite) el.unite.textContent = data.unit === 'F' ? '°F' : '°C';
}

function connect() {
  ws = new WebSocket(WS_URL);

  ws.onopen = () => setStatus(true);
  ws.onclose = () => {
    setStatus(false);
    setTimeout(connect, 3000);
  };
  ws.onerror = () => setStatus(false);
  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      afficher(data);
    } catch (_) {
      afficher(null);
    }
  };
}

function toggleUnite() {
  const next = (lastData && lastData.unit === 'F') ? 'C' : 'F';
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ unit: next }));
  }
}

connect();
if (el.btnToggle) el.btnToggle.addEventListener('click', toggleUnite);
