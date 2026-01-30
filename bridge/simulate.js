const mqtt = require('mqtt');

const mqttClient = mqtt.connect('mqtt://captain.dev0.pandor.cloud:1884');

let isCelsius = true;

mqttClient.on('connect', () => {
    console.log('Simulateur connecte au broker MQTT');

    setInterval(() => {
        let temp = Math.round((18 + Math.random() * 12) * 10) / 10;
        let hum = Math.round((40 + Math.random() * 40) * 10) / 10;

        if (!isCelsius) {
            temp = Math.round((temp * 1.8 + 32) * 10) / 10;
        }

        const data = JSON.stringify({
            temperature: temp,
            humidity: hum,
            unit: isCelsius ? 'C' : 'F',
            simulation: true
        });

        mqttClient.publish('station/data', data);
        console.log('Publie:', data);
    }, 5000);
});

mqttClient.on('error', (err) => {
    console.log('Erreur MQTT:', err.message);
});