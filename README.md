# Station météo – commandes

## Installation (une fois)

```bash
cd bridge
npm install
```

## Lancer les services

### Bridge (MQTT → WebSocket)

```bash
cd bridge
npm start
```

### Frontend

Ouvrir `frontend/index.html` dans le navigateur, ou servir le dossier :

```bash
cd frontend
npx serve .
```

Puis ouvrir l’URL affichée (ex. http://localhost:3000).

### Simulation (données fictives sur MQTT)

Sans ESP32, pour envoyer des données de test sur le broker :

```bash
cd bridge
npm run simulate
```

Lancer le bridge et le frontend en parallèle pour voir les données en temps réel.

## Docker (alternative)

Lancer tous les services avec Docker Compose :

```bash
docker-compose up -d

docker-compose logs -f

docker-compose down
```

**URLs après démarrage :**
- Frontend : http://localhost:3000
- WebSocket : ws://localhost:8080
