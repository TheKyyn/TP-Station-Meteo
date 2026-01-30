/*
 * Station Météo - Frontend Script
 * Gère l'affichage des données météo en temps réel via WebSocket
 */

// Configuration
const CONFIG = {
  WS_URL: `ws://${location.hostname || 'localhost'}:8080`,
  MAX_HISTORY_POINTS: 10,
  TEMP_THRESHOLD: { C: 29, F: 84.2 },
  RECONNECT_DELAY: 3000,
  ANIMATION_DURATION: 500
};

const CHART_COLORS = {
  temp: { border: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)', point: '#2563eb', hover: '#3b82f6' },
  hum: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', point: '#10b981', hover: '#34d399' }
};

// Éléments DOM
const el = {
  temperature: document.getElementById('temperature'),
  humidite: document.getElementById('humidite'),
  unite: document.getElementById('unite'),
  status: document.getElementById('status'),
  btnToggle: document.getElementById('btn-toggle'),
  demoBadge: document.getElementById('demo-badge'),
  mixedChartCanvas: document.getElementById('mixed-chart'),
  moyenneTemp: document.getElementById('moyenne-temp'),
  moyenneHum: document.getElementById('moyenne-hum'),
};

// État global
let ws = null;
let lastData = null;
let temperatureHistory = [];
let humidityHistory = [];
let mixedChart = null;
let previousTemp = null;

// Utilitaires
function getTimeLabel() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
}

function isValidValue(value) {
  return value !== '--' && !isNaN(value) && value !== null;
}

function limitArraySize(array, maxSize) {
  if (array.length > maxSize) array.splice(0, array.length - maxSize);
}

// Détection de variation brutale de température
function TempVariation(newTemp) {
  if (previousTemp !== null) {
    const diff = Math.abs(newTemp - previousTemp);
    if (diff >= 15) {
      console.warn(`Variation brutale: ${diff.toFixed(1)}°C (${previousTemp}°C → ${newTemp}°C)`);
    }
  }
  previousTemp = newTemp;
}

// Gestion de l'état de connexion
function setStatus(connected) {
  const statusText = el.status?.querySelector('.status-text');
  if (statusText) statusText.textContent = connected ? 'Connecté' : 'Déconnecté';
  if (el.status) el.status.className = `status ${connected ? 'connecte' : 'deconnecte'}`;
}

// Gestion de l'historique
function addToHistory(temperature, humidity, unit) {
  const timeLabel = getTimeLabel();
  const timestamp = Date.now();

  if (isValidValue(temperature)) {
    temperatureHistory.push({ temperature: parseFloat(temperature), unit, time: timeLabel, timestamp });
    limitArraySize(temperatureHistory, CONFIG.MAX_HISTORY_POINTS);
  }

  if (isValidValue(humidity)) {
    humidityHistory.push({ humidity: parseFloat(humidity), time: timeLabel, timestamp });
    limitArraySize(humidityHistory, CONFIG.MAX_HISTORY_POINTS);
  }
}

function synchronizeHistory() {
  const allTimestamps = new Set([
    ...temperatureHistory.map(item => item.timestamp),
    ...humidityHistory.map(item => item.timestamp)
  ]);

  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
  const labels = [], tempData = [], humData = [];

  sortedTimestamps.forEach(timestamp => {
    const tempItem = temperatureHistory.find(item => item.timestamp === timestamp);
    const humItem = humidityHistory.find(item => item.timestamp === timestamp);
    if (tempItem || humItem) {
      labels.push(tempItem?.time || humItem.time);
      tempData.push(tempItem?.temperature || null);
      humData.push(humItem?.humidity || null);
    }
  });

  if (labels.length > CONFIG.MAX_HISTORY_POINTS) {
    const start = labels.length - CONFIG.MAX_HISTORY_POINTS;
    return { labels: labels.slice(start), tempData: tempData.slice(start), humData: humData.slice(start) };
  }

  return { labels, tempData, humData };
}

// Affichage des valeurs
function updateValue(element, value) {
  if (!element || element.textContent === value.toString()) return;
  element.textContent = value;
  element.classList.add('updated');
  setTimeout(() => element.classList.remove('updated'), CONFIG.ANIMATION_DURATION);
}

function updateTemperatureColor(temperature, unit) {
  if (!el.temperature || !isValidValue(temperature)) return;
  const tempNum = parseFloat(temperature);
  const threshold = CONFIG.TEMP_THRESHOLD[unit] || CONFIG.TEMP_THRESHOLD.C;
  const isHigh = tempNum > threshold;
  el.temperature.classList.toggle('temp-high', isHigh);
  if (el.unite) el.unite.classList.toggle('temp-high', isHigh);
}

function displayData(data) {
  if (!data) return;

  const tempValue = data.temperature ?? '--';
  const humValue = data.humidity ?? '--';
  const unit = data.unit || 'C';

  // Détecter les variations brutales de température
  if (data.temperature !== undefined && isValidValue(data.temperature)) {
    TempVariation(data.temperature);
  }

  updateValue(el.temperature, tempValue);
  updateValue(el.humidite, humValue);
  if (el.unite) el.unite.textContent = unit === 'F' ? '°F' : '°C';

  updateTemperatureColor(tempValue, unit);

  const isDemo = data.simulation === true;
  if (el.demoBadge) el.demoBadge.hidden = !isDemo;
  if (el.btnToggle) el.btnToggle.hidden = isDemo;

  if (isValidValue(tempValue) || isValidValue(humValue)) {
    addToHistory(tempValue, humValue, unit);
    updateCharts();
    updateAverages();
  }

  lastData = data;
}

// Graphiques
function createDataset(label, colors, yAxisID) {
  return {
    label,
    data: [],
    borderColor: colors.border,
    backgroundColor: colors.bg,
    borderWidth: 2,
    fill: true,
    tension: 0.4,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBackgroundColor: colors.point,
    pointBorderColor: '#ffffff',
    pointBorderWidth: 2,
    pointHoverBackgroundColor: colors.hover,
    pointHoverBorderColor: '#ffffff',
    yAxisID
  };
}

function createChartConfig() {
  const commonFont = { family: 'Inter', size: 11 };
  return {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        createDataset('Température', CHART_COLORS.temp, 'y'),
        createDataset('Humidité', CHART_COLORS.hum, 'y1')
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { usePointStyle: true, padding: 15, font: { ...commonFont, size: 12, weight: '500' }, color: '#64748b' }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1e293b',
          bodyColor: '#64748b',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          callbacks: {
            label: (context) => {
              if (context.datasetIndex === 0) {
                const unit = lastData?.unit === 'F' ? '°F' : '°C';
                return `Température: ${context.parsed.y.toFixed(1)} ${unit}`;
              }
              return `Humidité: ${context.parsed.y.toFixed(1)} %`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: '#f1f5f9', drawBorder: false },
          ticks: { ...commonFont, color: '#64748b', maxRotation: 45, minRotation: 0 }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Température', color: CHART_COLORS.temp.border, font: { ...commonFont, size: 12, weight: '600' } },
          grid: { color: '#f1f5f9', drawBorder: false },
          ticks: {
            ...commonFont,
            color: CHART_COLORS.temp.border,
            callback: (value) => {
              const unit = lastData?.unit === 'F' ? '°F' : '°C';
              return `${value.toFixed(1)} ${unit}`;
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'Humidité', color: CHART_COLORS.hum.border, font: { ...commonFont, size: 12, weight: '600' } },
          grid: { drawOnChartArea: false, drawBorder: false },
          ticks: {
            ...commonFont,
            color: CHART_COLORS.hum.border,
            callback: (value) => `${value.toFixed(1)} %`
          }
        }
      },
      animation: { duration: CONFIG.ANIMATION_DURATION, easing: 'easeOutQuart' }
    }
  };
}

function initChart() {
  if (!el.mixedChartCanvas) return;
  const ctx = el.mixedChartCanvas.getContext('2d');
  mixedChart = new Chart(ctx, createChartConfig());
}

function updateCharts() {
  if (!mixedChart) return;
  const { labels, tempData, humData } = synchronizeHistory();
  mixedChart.data.labels = labels;
  mixedChart.data.datasets[0].data = tempData;
  mixedChart.data.datasets[1].data = humData;
  const unit = lastData?.unit === 'F' ? 'F' : 'C';
  mixedChart.options.scales.y.ticks.callback = (value) => `${value.toFixed(1)} °${unit}`;
  mixedChart.update('active');
}

// Calcul des moyennes
function updateAverages() {
  if (temperatureHistory.length > 0 && el.moyenneTemp) {
    const avg = temperatureHistory.reduce((acc, item) => acc + item.temperature, 0) / temperatureHistory.length;
    const unit = lastData?.unit === 'F' ? '°F' : '°C';
    el.moyenneTemp.textContent = `${avg.toFixed(1)} ${unit}`;
  } else if (el.moyenneTemp) {
    el.moyenneTemp.textContent = '--';
  }

  if (humidityHistory.length > 0 && el.moyenneHum) {
    const avg = humidityHistory.reduce((acc, item) => acc + item.humidity, 0) / humidityHistory.length;
    el.moyenneHum.textContent = `${avg.toFixed(1)} %`;
  } else if (el.moyenneHum) {
    el.moyenneHum.textContent = '--';
  }
}

// WebSocket
function connect() {
  ws = new WebSocket(CONFIG.WS_URL);
  ws.onopen = () => setStatus(true);
  ws.onclose = () => {
    setStatus(false);
    setTimeout(connect, CONFIG.RECONNECT_DELAY);
  };
  ws.onerror = () => setStatus(false);
  ws.onmessage = (event) => {
    try {
      displayData(JSON.parse(event.data));
    } catch (error) {
      console.error('Erreur parsing JSON:', error);
      displayData(null);
    }
  };
}

function toggleUnit() {
  if (!lastData || !ws || ws.readyState !== WebSocket.OPEN) return;
  const nextUnit = lastData.unit === 'F' ? 'C' : 'F';
  ws.send(JSON.stringify({ unit: nextUnit }));
}

// Initialisation
initChart();
connect();
if (el.btnToggle) el.btnToggle.addEventListener('click', toggleUnit);
