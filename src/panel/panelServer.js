const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const logger = require('../logger');

const indexHtml = fs.readFileSync(path.join(__dirname, 'public', 'index.html'));

let currentBot = null;
let wss = null;
let detachCurrentListeners = () => {};

function snapshot() {
  if (!currentBot || !currentBot.players) {
    return { connected: false, botUsername: null, players: [], updatedAt: Date.now() };
  }
  const players = Object.values(currentBot.players)
    .filter((p) => p.username)
    .map((p) => ({
      username: p.username,
      ping: p.ping ?? null,
      isBot: p.username === currentBot.username,
    }))
    .sort((a, b) => a.username.localeCompare(b.username));

  return {
    connected: true,
    botUsername: currentBot.username,
    players,
    updatedAt: Date.now(),
  };
}

function broadcast() {
  if (!wss) return;
  const payload = JSON.stringify(snapshot());
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  }
}

function updatePanelBot(bot) {
  detachCurrentListeners();
  currentBot = bot;

  if (!bot) {
    broadcast();
    return;
  }

  const onChange = () => broadcast();
  bot.on('playerJoined', onChange);
  bot.on('playerLeft', onChange);
  bot.on('spawn', onChange);
  bot.on('end', onChange);

  detachCurrentListeners = () => {
    bot.removeListener('playerJoined', onChange);
    bot.removeListener('playerLeft', onChange);
    bot.removeListener('spawn', onChange);
    bot.removeListener('end', onChange);
  };

  broadcast();
}

function startPanel(config) {
  const server = http.createServer((req, res) => {
    if (req.url === '/api/players') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(snapshot()));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(indexHtml);
  });

  wss = new WebSocketServer({ server });
  wss.on('connection', (client) => {
    client.send(JSON.stringify(snapshot()));
  });

  server.listen(config.panelPort, () => {
    logger.info(`Panel disponible en http://localhost:${config.panelPort}`);
  });

  return server;
}

module.exports = { startPanel, updatePanelBot };
