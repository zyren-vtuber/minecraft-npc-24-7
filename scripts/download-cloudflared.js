const fs = require('fs');
const path = require('path');
const https = require('https');

const BIN_DIR = path.join(__dirname, '..', 'bin');

function assetFor(platform, arch) {
  if (platform === 'win32') return 'cloudflared-windows-amd64.exe';
  if (platform === 'linux' && arch === 'arm64') return 'cloudflared-linux-arm64';
  if (platform === 'linux') return 'cloudflared-linux-amd64';
  return null;
}

function download(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Demasiadas redirecciones'));
    https.get(url, { headers: { 'User-Agent': 'minecraft-npc-24-7' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(download(res.headers.location, dest, redirects + 1));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} descargando ${url}`));
      }
      const file = fs.createWriteStream(dest, { mode: 0o755 });
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const asset = assetFor(process.platform, process.arch);
  if (!asset) {
    console.error(
      `No hay descarga automatica para ${process.platform}/${process.arch}. ` +
      'Instala cloudflared manualmente: https://github.com/cloudflare/cloudflared/releases'
    );
    process.exit(1);
  }

  fs.mkdirSync(BIN_DIR, { recursive: true });
  const destName = process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';
  const dest = path.join(BIN_DIR, destName);

  if (fs.existsSync(dest)) {
    console.log(`cloudflared ya existe en ${dest}`);
    return;
  }

  const url = `https://github.com/cloudflare/cloudflared/releases/latest/download/${asset}`;
  console.log(`Descargando ${url}...`);
  await download(url, dest);
  if (process.platform !== 'win32') {
    fs.chmodSync(dest, 0o755);
  }
  console.log(`Listo: ${dest}`);
}

main().catch((err) => {
  console.error('Fallo la descarga de cloudflared:', err.message);
  process.exit(1);
});
