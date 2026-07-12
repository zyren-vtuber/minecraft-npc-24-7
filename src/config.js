require('dotenv').config();

function int(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const config = {
  host: process.env.MC_HOST || 'localhost',
  port: int(process.env.MC_PORT, 25565),
  username: process.env.MC_USERNAME || 'NPC_Bot',
  version: process.env.MC_VERSION ? process.env.MC_VERSION : false,
  auth: 'offline',
  antiAfkIntervalMs: int(process.env.ANTI_AFK_INTERVAL_MS, 30000),
  reconnectDelayMs: int(process.env.RECONNECT_DELAY_MS, 10000),
  reconnectMaxDelayMs: int(process.env.RECONNECT_MAX_DELAY_MS, 300000),
};

module.exports = config;
