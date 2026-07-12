const config = require('./config');
const logger = require('./logger');
const { createBot } = require('./bot/createBot');
const { startPanel, updatePanelBot } = require('./panel/panelServer');

let reconnectDelay = config.reconnectDelayMs;
let panelStarted = false;

function connect() {
  const bot = createBot(config, handleSpawned, handleDisconnect);
  if (config.panelEnabled) {
    if (!panelStarted) {
      startPanel(config);
      panelStarted = true;
    }
    updatePanelBot(bot);
  }
}

function handleSpawned() {
  reconnectDelay = config.reconnectDelayMs;
}

function handleDisconnect() {
  logger.info(`Reintentando conexion en ${reconnectDelay}ms...`);
  setTimeout(connect, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 2, config.reconnectMaxDelayMs);
}

process.on('SIGINT', () => {
  logger.info('Cerrando bot (SIGINT).');
  process.exit(0);
});

connect();
