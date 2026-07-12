const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const logger = require('../logger');

const URL_PATTERN = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;

function binaryPath() {
  const name = process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';
  return path.join(__dirname, '..', '..', 'bin', name);
}

function startTunnel(config, onUrl) {
  const bin = binaryPath();
  if (!fs.existsSync(bin)) {
    logger.warn(
      `No se encontro cloudflared en ${bin}. Corre "npm run setup:tunnel" para descargarlo.`
    );
    return null;
  }

  const child = spawn(bin, ['tunnel', '--url', `http://localhost:${config.panelPort}`]);
  let found = false;

  const handleOutput = (data) => {
    const text = data.toString();
    if (!found) {
      const match = text.match(URL_PATTERN);
      if (match) {
        found = true;
        onUrl(match[0]);
      }
    }
  };

  child.stdout.on('data', handleOutput);
  child.stderr.on('data', handleOutput);

  child.on('error', (err) => {
    logger.error('No se pudo iniciar cloudflared:', err.message);
  });

  child.on('exit', (code) => {
    logger.warn(`cloudflared termino (codigo ${code}).`);
  });

  return child;
}

module.exports = { startTunnel };
