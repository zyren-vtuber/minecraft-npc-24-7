const config = require('./config');
const logger = require('./logger');
const { createBot } = require('./bot/createBot');

let reconnectDelay = config.reconnectDelayMs;

function connect() {
  createBot(config, handleSpawned, handleDisconnect);
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
