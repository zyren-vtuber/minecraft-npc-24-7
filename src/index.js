const config = require('./config');
const logger = require('./logger');
const { createBot } = require('./bot/createBot');
const { startPanel, updatePanelBot } = require('./panel/panelServer');
const { startTunnel } = require('./panel/tunnel');

let reconnectDelay = config.reconnectDelayMs;
let panelStarted = false;
let tunnelStarted = false;
let tunnelProcess = null;

function connect() {
  const bot = createBot(config, handleSpawned, handleDisconnect);
  if (config.panelEnabled) {
    if (!panelStarted) {
      startPanel(config);
      panelStarted = true;
    }
    if (config.tunnelEnabled && !tunnelStarted) {
      tunnelStarted = true;
      tunnelProcess = startTunnel(config, (publicUrl) => {
        const wsUrl = publicUrl.replace('https://', 'wss://');
        const pagesLink = `${config.pagesUrl}?ws=${encodeURIComponent(wsUrl)}`;
        logger.info(`Panel publico: ${publicUrl}`);
        logger.info(`Abre esto para ver el panel: ${pagesLink}`);
      });
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
  if (tunnelProcess) {
    tunnelProcess.kill();
  }
  process.exit(0);
});

connect();
