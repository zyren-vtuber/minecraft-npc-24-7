const logger = require('../logger');

/**
 * Hace que el bot se comporte como un jugador presente: mira alrededor,
 * salta y camina un par de pasos de vez en cuando, en lugar de quedarse
 * inmovil (lo cual dispara los plugins/anti-AFK de muchos servidores).
 */
function startAntiAfk(bot, intervalMs) {
  const timer = setInterval(() => {
    if (!bot.entity) return;

    const yaw = Math.random() * Math.PI * 2;
    const pitch = (Math.random() - 0.5) * 0.5;
    bot.look(yaw, pitch, true).catch(() => {});

    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 250);

    const direction = Math.random() < 0.5 ? 'forward' : 'back';
    bot.setControlState(direction, true);
    setTimeout(() => bot.setControlState(direction, false), 600);
  }, intervalMs);

  bot.once('end', () => clearInterval(timer));
  logger.info(`Anti-AFK activo cada ${intervalMs}ms.`);
  return timer;
}

module.exports = { startAntiAfk };
