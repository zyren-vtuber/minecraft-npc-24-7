const mineflayer = require('mineflayer');
const logger = require('../logger');
const { startAntiAfk } = require('./antiAfk');

function createBot(config, onSpawned, onEnded) {
  const target = config.port ? `${config.host}:${config.port}` : `${config.host} (SRV)`;
  logger.info(`Conectando a ${target} como "${config.username}"...`);

  const options = {
    host: config.host,
    username: config.username,
    version: config.version,
    auth: config.auth,
  };
  if (config.port) {
    options.port = config.port;
  }

  const bot = mineflayer.createBot(options);

  bot.once('spawn', () => {
    logger.info('Bot conectado y en el mundo.');
    startAntiAfk(bot, config.antiAfkIntervalMs);
    onSpawned();
  });

  bot.on('kicked', (reason) => {
    logger.warn('El servidor expulso al bot:', reason);
  });

  bot.on('error', (err) => {
    logger.error('Error de conexion:', err.message);
  });

  bot.on('death', () => {
    logger.warn('El bot murio, respawneando...');
    bot.respawn();
  });

  bot.on('end', (reason) => {
    logger.warn('Conexion finalizada:', reason || 'sin motivo');
    onEnded();
  });

  return bot;
}

module.exports = { createBot };
