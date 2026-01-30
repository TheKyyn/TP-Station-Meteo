# Station météo – commandes

## Installation (une fois)

```bash
cd bridge
npm install
```

**✅ Les dépendances sont déjà installées !**

## Lancer les services

### 🚀 Méthode rapide (recommandée)

**Windows :**
```bash
# Lancer bridge + frontend ensemble
start.bat

# Ou avec PowerShell
.\start.ps1

# Options disponibles :
start.bat bridge      # Bridge uniquement
start.bat frontend    # Frontend uniquement
start.bat simulate    # Simulateur uniquement
start.bat all         # Tout (par défaut)
```

### Méthode manuelle

#### Bridge (MQTT → WebSocket)

```bash
cd bridge
npm start
```

#### Frontend

Ouvrir `frontend/index.html` dans le navigateur, ou servir le dossier :

```bash
cd frontend
npx serve .
```

Puis ouvrir l'URL affichée (ex. http://localhost:3000).

#### Simulation (données fictives sur MQTT)

Sans ESP32, pour envoyer des données de test sur le broker :

```bash
cd bridge
npm run simulate
```

Lancer le bridge et le frontend en parallèle pour voir les données en temps réel.
